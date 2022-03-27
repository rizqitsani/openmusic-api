const ExportHandler = require('./handler');
const routes = require('./route');

module.exports = {
  name: 'export',
  version: '1.0.0',
  register: async (server, { producerService, playlistService, validator }) => {
    const exportHandler = new ExportHandler(
      producerService,
      playlistService,
      validator,
    );
    server.route(routes(exportHandler));
  },
};
