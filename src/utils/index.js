/* eslint-disable camelcase */
const mapAlbumDBToModel = ({ id, name, year, created_at, updated_at }) => ({
  id,
  name,
  year,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapNestedSongs = ({ song_id, song_title, performer }) => ({
  id: song_id,
  title: song_title,
  performer,
});

const mapSongDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapAlbumDBToModel, mapNestedSongs, mapSongDBToModel };
