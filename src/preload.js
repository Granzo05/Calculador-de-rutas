const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('excel', {
    createExcel: async (nombresPartida, nombresLlegada, distancias) => {
        return await ipcRenderer.invoke('generate-excel', nombresPartida, nombresLlegada, distancias);
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    selectDatabase: async (query, params) => {
        try {
            const response = await ipcRenderer.invoke('select-database', query, params);
            return response;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },
    insertDatabase: async (query, params) => {
        try {
            const response = await ipcRenderer.invoke('insert-database', query, params);
            return response;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },
    onQueryResult: (callback) => ipcRenderer.on('query-result', (event, result) => callback(result)),
});