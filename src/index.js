const { app, BrowserWindow, screen: electronScreen, ipcMain } = require('electron');
const path = require('path');
const oracledb = require('oracledb');
const ExcelJS = require('exceljs');
const fs = require('fs');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.initOracleClient({ libDir: path.resolve(__dirname, '..', 'instantclient_21_13') });

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
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.openDevTools();
};

app.on('ready', async () => {
  await modifySqlNetOra();
  await conectarDB();
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

// Función que adapta la ruta base del archivo dentro de las configuraciones de Oracle
function modifySqlNetOra() {
  const walletPath = path.resolve(__dirname, '..', 'instantclient_21_13', 'network', 'admin');

  const pathPropiedades = path.join(walletPath, 'ojdbc.properties');

  try {
    let contenido = fs.readFileSync(pathPropiedades, 'utf8');
    contenido = contenido.replace(/DIRECTORY\s*=\s*.+\)/, `DIRECTORY=${walletPath})))`);
    fs.writeFileSync(pathPropiedades, contenido, 'utf8');
  } catch (err) {
    console.error('Error al modificar el archivo de propiedades:', err);
  }

  const pathSQLNetOra = path.join(walletPath, 'sqlnet.ora');

  try {
    let contenido = fs.readFileSync(pathSQLNetOra, 'utf8');
    contenido = contenido.replace(/DIRECTORY\s*=\s*.+\)/, `DIRECTORY = ${walletPath})))`);
    fs.writeFileSync(pathSQLNetOra, contenido, 'utf8');
  } catch (err) {
    console.error('Error al modificar sqlnet.ora:', err);
  }
}

async function conectarDB() {
  try {
    connection = await oracledb.getConnection({
      user: '',
      password: '',
      connectString: '',
    });
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
}

async function executeSelect(query, params) {
  if (connection) {
    try {
      const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });

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

ipcMain.handle('select-database', async (event, query, params) => {
  try {
    return await executeSelect(query, params);
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

  return guardarArchivoYObtenerPath(workbook);
});

async function guardarArchivoYObtenerPath(workbook) {
  let index = 0;
  let filePath = '';

  while (true) {
    // Verifica si hay un archivo, en caso de no existir con el mismo nombre lo guarda, sino itera y devuelve 'distancias(n).xlsx'
    const archivo = index === 0 ? '' : `(${index})`;
    filePath = path.join(app.getPath('downloads'), `distancias${archivo}.xlsx`);

    if (!fs.existsSync(filePath)) {
      try {
        await workbook.xlsx.writeFile(filePath);
        return filePath;
      } catch (error) {
        console.error('Error al guardar el archivo:', error);
        throw error;
      }
    }
    index++;
  }
}