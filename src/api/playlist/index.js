const PlaylistHandler = require('./handler');
const routes = require('./route');

module.exports = {
  name: 'playlist',
  version: '1.0.0',
  register: async (server, { playlistService, songService, validator }) => {
    const playlistHandler = new PlaylistHandler(
      playlistService,
      songService,
      validator,
    );
    server.route(routes(playlistHandler));
  },
};
