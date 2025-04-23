// Configuración global de la aplicación
const AppConfig = {
    // Ruta base de la aplicación - actualizada para el montaje en WSGI
    basePath: '/grupokossodo_ssh',
    
    // Método para obtener la ruta completa
    getFullPath: function(path) {
        return this.basePath + path;
    },
      // API URLs
    apiUrls: {
        login: '/grupokossodo_ssh/api/login',
        logout: '/grupokossodo_ssh/api/logout'
    }
};