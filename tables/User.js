const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../User');
const jwt = require('jsonwebtoken');
const Message = require('../Message');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crée le dossier "uploads" s'il n'existe pas
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });



router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try{
        
        const user = await User.findOne({ email });
        if(!user ){
            return res.status(400).json({message: "identifiant incorrecte"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).send('mot de passe incorrecte'); 
        console.log('mandeh');

        const token = jwt.sign({id: user._id}, JWT_SECRET, {
            expiresIn: '1h',
        });
        
        res.json({token});

    }catch(err){
        console.log('erreur');
        res.status(400).json({message : "erreur de la connexion"});
    }
    
});


//Middleware pour protéger les routes
const protect = (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        return res.status(401).json({message : "Accès réfusés , token manquant"});

    }

    try{
        const decode = jwt.verify(token, JWT_SECRET);
        req.user = decode;
        next();
    }catch(error){
        return res.status(401).json({message : 'Token invalide'});
    }
}

// Déconnexion
router.post('/logout', (req, res) => {
    
    res.status(200).json({ message: 'Déconnexion réussie' });
});

// Ajouter un nouvel utilisateur
router.post('/ajouter', upload.single('photo'), async (req, res) => {
  const { nom, email, password } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!password || password.trim() === "") {
    return res.status(400).json({ message: "Le mot de passe est requis" });
  }

  try {
    const user = new User({ nom, email, password, photo });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erreur lors de la création de l\'utilisateur', error: err });
  }
});

//Exemple de route protégée
router.get('/dashboard', protect , async (req, res) => {
    
    try{
        
        const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Retourner les informations de l'utilisateur
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des informations utilisateur' });
  }
    
})



router.get('/users',protect, async (req, res) => {
    try{
        const user = await User.find({ _id : { $ne : req.user.id}}).select('-password');
        if(!user){
            return res.status(406).json({message: 'Aucun user existé'});

        }
        res.status(200).json(user);
    }catch(error){
        console.error('Erreur lors de la récupération des users: ', error);
        res.status(502).json({message : 'erreur de la recuperation des uses'});
    }
})

router.get('/messages/:senderId/:receiverId', protect , async(req, res) => {
    const senderId = req.params.senderId;
    const receiverId = req.params.receiverId;
    try{
        const messages = await Message.find({
            $or : [
                {sender : senderId, receiver : receiverId},
                {sender : receiverId, receiver : senderId}
            ]
        }).sort({timestamp : 1});
        
        return res.status(200).json(messages);
        
    }catch(error){
        console.error('erreur de recuperation des messages' , error);
    }
})

router.post('/sendMessage' ,protect , async(req, res) => {
    const { sender , receiver , message } = req.body;
    try{
        const mssage = new Message({sender, receiver, message});
        await mssage.save();
        res.status(200).json({message : 'message envoyé'});
    }catch(error){
        console.error('erreur d envoie des messages' , error);
    }
})
module.exports = router;
