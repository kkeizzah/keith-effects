const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const FormData = require('form-data');
const cheerio = require('cheerio').load;

const effects = require('./effects.json');

/**
 * Apply a PhotoFunia effect
 * @param {string} effectName
 * @param {string|Buffer} urlOrBuffer
 * @returns {Promise<Array<{ size: string, url: string }>>}
 */
async function applyKeithEffect(effectName, urlOrBuffer) {
  const match = effects.find(e => e.uniquename === effectName);
  if (!match) return [];

  const effectKey = match.key;
  let imageBuffer;

  if (Buffer.isBuffer(urlOrBuffer)) {
    imageBuffer = urlOrBuffer;
  } else if (typeof urlOrBuffer === 'string') {
    const response = await axios.get(urlOrBuffer, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
  } else {
    throw new Error("Invalid image input");
  }

  const form = new FormData();
  form.append('image', imageBuffer, {
    filename: 'upload.jpg',
    contentType: 'image/jpeg'
  });
  form.append('server', '1');

  const uploadUrl = `https://m.photofunia.com/categories/all_effects/${effectKey}?server=1`;

  const uploadResponse = await axios.post(uploadUrl, form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://m.photofunia.com',
      'Referer': 'https://m.photofunia.com/categories/all_effects/calendar'
    },
    maxRedirects: 0,
    validateStatus: status => status === 302
  });

  const redirectPath = uploadResponse.headers.location;
  const resultUrl = `https://m.photofunia.com${redirectPath}`;
  const resultPage = await axios.get(resultUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio(resultPage.data);
  const links = [];

  $('ul.images li a').each((_, el) => {
    const size = $(el).text().trim();
    const href = $(el).attr('href');
    if (href) links.push({ size, url: href });
  });

  return links;
}

/**
 * Download image from effect result
 * @param {Array<{ size: string, url: string }>} links
 * @returns {Promise<string>} path to downloaded image
 */
async function downloadImage(links) {
  const downloadLink = links.find(l => l.size.toLowerCase().includes('regular'));
  if (!downloadLink) return;

  const folder = path.join(process.cwd(), 'Logos');
  await fsp.mkdir(folder, { recursive: true });

  const files = await fsp.readdir(folder);
  const numbers = files
    .map(f => f.match(/^output(\d+)\.(jpg|jpeg|png|gif)$/i))
    .filter(Boolean)
    .map(m => parseInt(m[1]));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  const outputPath = path.join(folder, `output${next}.jpg`);
  const imageStream = await axios.get(downloadLink.url, { responseType: 'stream' });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    imageStream.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return outputPath;
}

/**
 * Check if an effect name is valid
 * @param {string} name
 * @returns {boolean}
 */
function isValid(name) {
  return effects.some(e => e.uniquename === name);
}

/**
 * Get list of all available effect names
 * @returns {string[]}
 */
function listEffects() {
  return effects.map(e => e.uniquename);
}

module.exports = {
  applyKeithffect,
  downloadImage,
  isValid,
  listEffects
};
