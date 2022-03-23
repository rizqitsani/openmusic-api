require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const album = require('./api/album');
const authentication = require('./api/authentication');
const song = require('./api/song');
const user = require('./api/user');
const ClientError = require('./exceptions/ClientError');
const AlbumService = require('./services/postgres/AlbumService');
const AuthenticationService = require('./services/postgres/AuthenticationService');
const SongService = require('./services/postgres/SongService');
const UserService = require('./services/postgres/UserService');
const TokenManager = require('./tokenize/TokenManager');
const AlbumValidator = require('./validator/album');
const AuthenticationValidator = require('./validator/authentication');
const SongValidator = require('./validator/song');
const UserValidator = require('./validator/user');

const init = async () => {
  const albumService = new AlbumService();
  const authenticationService = new AuthenticationService();
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
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
