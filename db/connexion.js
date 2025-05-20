const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/chatmongo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connecté à MongoDB'))
    .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

module.exports = mongoose;
