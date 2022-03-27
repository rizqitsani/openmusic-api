require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Jwt = require('@hapi/jwt');

const album = require('./api/album');
const authentication = require('./api/authentication');
const collaboration = require('./api/collaboration');
// eslint-disable-next-line no-underscore-dangle
const _exports = require('./api/export');
const playlist = require('./api/playlist');
const song = require('./api/song');
const user = require('./api/user');
const ClientError = require('./exceptions/ClientError');
const AlbumService = require('./services/postgres/AlbumService');
const AuthenticationService = require('./services/postgres/AuthenticationService');
const CollaborationService = require('./services/postgres/CollaborationService');
const PlaylistService = require('./services/postgres/PlaylistService');
const SongService = require('./services/postgres/SongService');
const UserService = require('./services/postgres/UserService');
const ProducerService = require('./services/rabbitmq/ProducerService');
const TokenManager = require('./tokenize/TokenManager');
const AlbumValidator = require('./validator/album');
const AuthenticationValidator = require('./validator/authentication');
const CollaborationValidator = require('./validator/collaboration');
const ExportValidator = require('./validator/export');
const PlaylistValidator = require('./validator/playlist');
const SongValidator = require('./validator/song');
const UserValidator = require('./validator/user');

const init = async () => {
  const albumService = new AlbumService();
  const authenticationService = new AuthenticationService();
  const collaborationService = new CollaborationService();
  const playlistService = new PlaylistService(collaborationService);
  const songService = new SongService();
  const userService = new UserService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return response.continue || response;
  });

  await server.register([
    {
      plugin: album,
      options: {
        service: albumService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: song,
      options: {
        service: songService,
        validator: SongValidator,
      },
    },
    {
      plugin: user,
      options: {
        service: userService,
        validator: UserValidator,
      },
    },
    {
      plugin: authentication,
      options: {
        authenticationService,
        userService,
        tokenManager: TokenManager,
        validator: AuthenticationValidator,
      },
    },
    {
      plugin: playlist,
      options: {
        playlistService,
        songService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: collaboration,
      options: {
        collaborationService,
        playlistService,
        userService,
        validator: CollaborationValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        producerService: ProducerService,
        playlistService,
        validator: ExportValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
