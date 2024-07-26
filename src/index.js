const { app, BrowserWindow, screen: electronScreen, ipcMain } = require('electron');
const path = require('path');
const oracledb = require('oracledb');
require('dotenv').config();
const ExcelJS = require('exceljs');

// Configuración del cliente Oracle
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.initOracleClient({ libDir: 'B:/Oracle/instantclient_21_13' });

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let connection;

const createWindow = () => {
  const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
  });

  mainWindow.loadFile(path.join(__dirname, './index.html'));

  mainWindow.webContents.openDevTools();
};

app.on('ready', async () => {
  await connectToDatabase();
  createWindow();
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión a la base de datos:', err);
      }
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

async function connectToDatabase() {
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });
    console.log('Conexión exitosa a la base de datos');
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
}

async function executeQuery(query) {
  if (connection) {
    try {
      const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

      // Procesa los LOBs
      const processedRows = await Promise.all(result.rows.map(async (row) => {
        for (const key in row) {
          if (row[key] instanceof oracledb.Lob) {
            row[key] = await lobToString(row[key]);
          }
        }
        return row;
      }));

      return { rows: processedRows };
    } catch (err) {
      console.error('Error executing query:', err);
      return { error: err.message };
    }
  } else {
    return { error: 'No connection to the database.' };
  }
}

async function executeInsert(query, params) {
  if (connection) {
    try {
      const result = await connection.execute(query, params, { autoCommit: true });
      return { rows: result.rows };  
    } catch (err) {
      console.error('Error executing insert query:', err);
      return { error: err.message };
    }
  } else {
    return { error: 'No connection to the database.' };
  }
}

ipcMain.handle('select-database', async (event, query) => {
  try {
    return await executeQuery(query);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('insert-database', async (event, query, params) => {
  try {
    return await executeInsert(query, params);
  } catch (err) {
    return { error: err.message };
  }
});

app.on('before-quit', async () => {
  if (connection) {
    try {
      await connection.close();
    } catch (err) {
      console.error('Error al cerrar la conexión a la base de datos:', err);
    }
  }
});

ipcMain.handle('generate-excel', async (event, nombresPartida, nombresLlegada, distancias) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Distancias');

  worksheet.addRow(['Nombres', ...nombresLlegada]);

  nombresPartida.forEach((nombrePartida, i) => {
      const row = [nombrePartida];
      nombresLlegada.forEach((_, j) => {
          row.push(parseInt(distancias[i][j]));
      });
      worksheet.addRow(row);
  });

  // Guardar el archivo
  const filePath = path.join(app.getPath('downloads'), 'distancias.xlsx');
  await workbook.xlsx.writeFile(filePath);

  return filePath;
});