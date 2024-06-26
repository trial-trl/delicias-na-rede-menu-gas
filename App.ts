const doGet = (e: GoogleAppsScript.Events.DoGet) => {
  const data = getData();
  if (!data) return ContentService.createTextOutput('No data found');
  const { settings, translations } = data;

  const isCompactView = e.parameter.v && e.parameter.v == "compact";
  const template = isCompactView ? HtmlService.createTemplateFromFile('menu_compact') : HtmlService.createTemplateFromFile('menu');
  template.data = JSON.stringify(data);
  template.logo_light = settings.logo_light;
  template.logo_dark = settings.logo_dark;
  template.bg_image = settings.bg_image;
  template.order_now_actions = isCompactView ? settings.order_now_actions_compact : settings.order_now_actions;
  template.translations = translations;
  template.translations_obj = JSON.stringify(translations);

  return template
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle(`${settings.name} Menu`);
};

const getData = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings(ss);
  if (!settings) return null;

  const translations = getTranslations(ss);
  if (!translations) return null;

  const categories = getCategories(ss);

  const menu_items = getMenuItems(ss);
  if (!menu_items) return null;

  const data = {
    settings,
    translations,
    categories,
    menu_items,
  };

  return data;
};

const getSettings = (ss: GoogleAppsScript.Spreadsheet.Spreadsheet) => {
  const settings_sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!settings_sheet) return null;
  const data = settings_sheet.getDataRange().getValues();

  const settings = {
    name: data[0][1],
    logo_light: data[1][1],
    logo_dark: data[2][1],
    currency: data[3][1].split(','),
    order_now_actions: data[4][1],
    order_now_actions_compact: data[5][1],
    bg_image: data[6][1],
  };

  if (String(settings.logo_light).includes('drive.google.com')) {
    const fileId = String(settings.logo_light).split('/d/')[1].split('/')[0];
    const blob = DriveApp.getFileById(fileId).getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    settings.logo_light = `data:image/png;base64,${base64}`;
  }

  if (String(settings.logo_dark).includes('drive.google.com')) {
    const fileId = String(settings.logo_dark).split('/d/')[1].split('/')[0];
    const blob = DriveApp.getFileById(fileId).getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    settings.logo_dark = `data:image/png;base64,${base64}`;
  }

  return settings;
};

const getTranslations = (ss: GoogleAppsScript.Spreadsheet.Spreadsheet) => {
  const translations_sheet = ss.getSheetByName(SHEET_NAMES.TRANSLATIONS);
  if (!translations_sheet) return null;
  const data = translations_sheet.getDataRange().getValues();

  var translations = {};

  for (let i = 1; i < data.length; i++) {
    translations[data[i][0]] = data[i][1];
  }

  return translations;
};

const getMenuItems = (ss: GoogleAppsScript.Spreadsheet.Spreadsheet) => {
  const menu_sheet = ss.getSheetByName(SHEET_NAMES.MENU);
  if (!menu_sheet) return null;
  const data = menu_sheet.getDataRange().getValues();
  const menu_items: any = [];
  for (let i = 1; i < data.length; i++) {
    const [name, description, image, price, category, isAdditional] = data[i];

    if (!name) continue;

    const id = Math.random().toString(36).substring(2, 15);

    const item = {
      id,
      name,
      description,
      image,
      price,
      category,
      isAdditional,
    };

    if (String(image).includes('drive.google.com')) {
      const fileId = String(image).split('/d/')[1].split('/')[0];
      const blob = DriveApp.getFileById(fileId).getBlob();
      const base64 = Utilities.base64Encode(blob.getBytes());
      item.image = `data:image/png;base64,${base64}`;
    }

    menu_items.push(item);
  }
  return menu_items;
};

const getCategories = (ss: GoogleAppsScript.Spreadsheet.Spreadsheet) => {
  const categories_sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  if (!categories_sheet) return [];
  const data = categories_sheet.getDataRange().getValues();
  const categories: any = [];
  for (let i = 1; i < data.length; i++) {
    const [item] = data[i];
    const name = String(item).trim();
    if (name) categories.push(name);
  }
  return categories;
};
