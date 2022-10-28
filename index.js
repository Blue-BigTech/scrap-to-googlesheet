const {createServer} = require('http');
const puppeteer = require('puppeteer')

const hostname = '127.0.0.1';
const port = 3000;
var page = null;
var bScrapping = false
var ListData = null
var auth = null

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//////////========Authentication and cridential part ========////////////

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

//////////========Authentication and cridential end ========////////////

const extractNumber = (str) => {
  let num = str.match(/\d/g);
  num = num.join("");
  return num
}

async function readDataAPI() {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1Nx4Rsm-S0hXCx3X2OcbWiKi0Kl0CB9v37DjN7HdXYZQ',
    range: 'Google Sunroof!A2:C',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }

  const arr = Array.from(rows).map(record => {
    if(record.Address !== ""){
      return {
        id: record[0],
        addr: record[1],
        bill: extractNumber(record[2]),
        update: true
      }
    }
  });
  return arr.filter((item) => {
    return item.addr !== ""
  })
}

async function writeDataAPI(id, hours, sp, kw_bill, usage) {
  const sheets = google.sheets({version: 'v4', auth});
  const request = {
    spreadsheetId: "1Nx4Rsm-S0hXCx3X2OcbWiKi0Kl0CB9v37DjN7HdXYZQ",
    // range: "Google Sunroof!D2:G",
    range: "Google Sunroof!D" + id + ":G",
    valueInputOption: "USER_ENTERED",
    resource: {values: [
      [hours, sp, kw_bill, usage]
    ]},
    auth: auth,
  }
  const response = await sheets.spreadsheets.values.update(request);
}

const fetchAll = async () =>{
  return await readDataAPI()
}

const updateData = async (id, hours, sp, kw_bill, usage) =>{
  await writeDataAPI(parseInt(id)+1, hours, sp, kw_bill, usage)
}


////////////////////========scrapping=========///////////////////////


const _AddNew = (item, id) => {
  let bIs = false
  const cnt = ListData.length
  if(id >= cnt){
    bIs = true
    ListData.push(item)
  } else {
    if(ListData[id].addr !== item.addr || ListData[id].bill !== item.bill){
      ListData[id].addr = item.addr
      ListData[id].bill = item.bill
      ListData[id].update = true
      bIs = true
    }
  }
  return bIs
}

const detectUpdate = async () => {
  const newArr = await fetchAll()
  console.log(newArr)
  const newCnt = newArr.length
  for(let i=0; i<newCnt; i++){
    if(_AddNew(newArr[i], i))
      console.log("new address\n")
  }
}

const scrapByAdressList = async () => {
  if(bScrapping){
    return
  }
  await detectUpdate()
  bScrapping = true
  const count = ListData.length
  for(let i=0; i<count; i++){
    if(ListData[i].update){
      ListData[i].update = false
      await scrapFunc(ListData[i].addr, ListData[i].bill, ListData[i].id)
    }
  }
  bScrapping = false
}

const scrapFunc = async (address, bill, id) => {
  try{
    console.log(address)
    await page.type('#input-0', address);
    try{
      await page.waitForSelector('#md-option-0-0')
    }catch(e){
      return
    }
    await page.keyboard.press('Enter')

    await page.waitForNavigation({
      waitUntil: 'load',
    });
    await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')
  
    await page.waitForSelector('#select_value_label_1')
    await page.click('#select_value_label_1')

    const mdLists = await page.evaluate(() => {
      const elementAll = document.querySelector('#select_container_3 > md-select-menu > md-content').childNodes
      return Array.from(elementAll).map(item => {
        return {
          id : item.id,
          bill : item.value
        }
      })
    })
    const count = mdLists.length
    let s_Selector = '#select_option_7'
    for(let i=0; i<count; i++){
      if(bill == mdLists[i].bill){
        s_Selector = '#' + mdLists[i].id
        break
      }
    }
  
    await page.waitForSelector(s_Selector)
    await page.focus(s_Selector)
    await page.keyboard.press('Enter')
 
    await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')
    let kw_bill = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw').innerText
    })
  
    let hours = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(1) > div.panel-fact-text.md-body').innerText
    })
  
    let sq = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(2) > div.panel-fact-text.md-body').innerText
    })

    let usage = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > p').innerText
    })
    console.log(id, extractNumber(hours), extractNumber(sq), kw_bill.replace(" kW", ""), extractNumber(usage))
    await updateData(id, extractNumber(hours), extractNumber(sq), kw_bill.replace(" kW", ""), extractNumber(usage))

    await page.waitForTimeout(500)
  }
  catch(e){
    throw e
  }
}

(async () => {
  auth = await authorize()
  ListData = await fetchAll();

  console.log(ListData)
  const browser = await puppeteer.launch()
  // const browser = await puppeteer.launch({
  //     executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  //   headless: false
  // })
  page = await browser.newPage()
  await page.goto('https://sunroof.withgoogle.com/building/40.7331699/-73.2639021/#?f=buy')
  setInterval(scrapByAdressList, 3000)
  // browser.close()
})();
