import express from 'express'

import session from 'express-session'

import { Liquid } from 'liquidjs';


const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((request, response, next) => {
  request.session = { user: { id: 13, username: 'Süleyman', profile: { id: 123, username: 'Yavuzhan' } } };
  next();
});

app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express());

app.set('views', './views')

const sessionSecret = process.env.SESSION_SECRET || 'shg1234'
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true
}))

// Maak een GET route voor de index (meestal doe je dit in de root, als /)
app.get('/', async function (request, response) {

  const playlistResponse = await fetch('https://fdnd-agency.directus.app/items/tm_playlist');
  const playlistResponseJSON = await playlistResponse.json();

  const storiesResponse = await fetch('https://fdnd-agency.directus.app/items/tm_story');
  const storiesResponseJSON = await storiesResponse.json();

  const userlistResponse = await fetch('https://fdnd-agency.directus.app/items/tm_users');
  const userlistResponseJSON = await userlistResponse.json();

  const profilelistResponse = await fetch('https://fdnd-agency.directus.app/items/tm_profile');
  const profilelistResponseJSON = await profilelistResponse.json();

  const playlistlikesResponse = await fetch('https://fdnd-agency.directus.app/items/tm_profile')
  const playlistlikesResponseJSON = await playlistlikesResponse.json()


  const userProfileId = request.session.user.profile.id;
  const likesResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_likes?filter[profile][_eq]=${userProfileId}&fields=profile,playlist,id,playlist.image, playlist.title, playlist.id`);
  const likesResponseJSON = await likesResponse.json();
  console.log(likesResponseJSON)

  const likedPlaylists = playlistResponseJSON.data.filter(playlist =>
    likesResponseJSON.data.some(like => like.playlist_id === playlist.id)
  );

  console.log(request.session.user)
  // Geef hier eventueel data aan mee
  response.render('index.liquid', {
    title: 'Lessons',
    playlists: playlistResponseJSON.data,
    stories: storiesResponseJSON.data,
    userlist: userlistResponseJSON.data,
    profilelist: profilelistResponseJSON.data,
    likedPlaylists: likedPlaylists,
    likedds: likesResponseJSON.data,
    user: request.session.user
  });
});


app.get('/likes', async function (request, response) {
  const directusResponse = await fetch('https://fdnd-agency.directus.app/items/tm_likes', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await directusResponse.json();

  response.json(data);
});

app.post('/like', async function (request, response) {

  console.log(request.body, 'Suleyman is gek')

  await fetch('https://fdnd-agency.directus.app/items/tm_likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: request.body.profile,
      playlist: request.body.playlist
    })
  });

  response.redirect(303, '/')
});


app.delete('/like', async function (request, response) {
  const profileId = request.session.user.profile.id;
  const playlistId = request.body.playlist;

  try {
    const findResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_likes?filter[profile][_eq]=${profileId}&filter[playlist][_eq]=${playlistId}`);
    const findJSON = await findResponse.json();
    const likeToDelete = findJSON.data[0];

    if (!likeToDelete) {
      return response.status(404).json({ message: 'Like not found' });
    }

    await fetch(`https://fdnd-agency.directus.app/items/tm_likes/${likeToDelete.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    response.status(200).json({ message: 'Like deleted' });

  } catch (error) {
    console.error('Delete error:', error);
    response.status(500).json({ message: 'Something went wrong' });
  }
});




app.get('/stories', async function (request, response) {
    const storiesResponse = await fetch('https://fdnd-agency.directus.app/items/tm_story')
  const storiesResponseJSON = await storiesResponse.json()

  const playlistResponse = await fetch('https://fdnd-agency.directus.app/items/tm_playlist')
  const playlistResponseJSON = await playlistResponse.json()

  // Geef hier eventueel data aan mee
  response.render('allstories.liquid', {
    title: 'All stories',
    stories: storiesResponseJSON.data,
    playlists: playlistResponseJSON.data
  })
})


app.post('/', async function (request, response) {

    response.redirect(303, '/')
})

app.get('/lessons', async function (request, response) {
  const lessonsplaylistResponse = await fetch('https://fdnd-agency.directus.app/items/tm_playlists')
  const lessonsplaylistResponseJSON = await lessonsplaylistResponse.json()

  response.render('partials/playlists.liquid', {
    title: "lessons",
    drops: lessonsplaylistResponseJSON.data,
  })
})

app.post('/lessons', async function (request, response) {

  await fetch('https://fdnd-agency.directus.app/items/tm_likes', {
    method: 'POST',
    body: JSON.stringify({
      from: request.body.from,
      text: request.body.text
    }),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  response.redirect(303, '/lessons');
})



app.set('port', process.env.PORT || 8000)

app.listen(app.get('port'), function () {
    console.log(`Application started on http://localhost:${app.get('port')}`)
})
