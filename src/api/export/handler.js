class ExportHandler {
  constructor(producerService, playlistService, validator) {
    this._producerService = producerService;
    this._playlistService = playlistService;
    this._validator = validator;

    this.postExportPlaylistsHandler =
      this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistService.getPlaylistById(playlistId);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._producerService.sendMessage(
      'export:playlists',
      JSON.stringify(message),
    );

    return h
      .response({
        status: 'success',
        message: 'Permintaan Anda sedang kami proses',
      })
      .code(201);
  }
}

module.exports = ExportHandler;
