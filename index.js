const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db/connexion'); 
const UserRouter = require('./tables/User');
const Message = require('./Message'); 
const http = require('http');
const { Server } = require('socket.io');


const app = express();
app.use('/uploads', express.static('uploads'));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL de ton client
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cors())
app.use(bodyParser.json());

// Routes
app.use('/api', UserRouter);

// Socket.io setup
io.on('connection', (socket) => {
    console.log('Utilisateur connecté');

    socket.on('joinRoom', async ({ senderId, receiverId }) => {
        // const roomId = [senderId, receiverId].sort().join('_');
        // socket.join(roomId);
        try{
            const messages = await Message.find({
                $or : [
                    {sender : senderId, receiver : receiverId},
                    {sender : receiverId, receiver : senderId}
                ]
            }).sort({timestamp : 1});
    
            // console.log(messages);
            socket.emit('getMessage', messages);
        }catch(error){
            console.error('erreur de getMessage'+error);
        }
        
    });

    socket.on('message', async ({ sender, receiver, message }) => {
        try {
            // const roomId = [sender, receiver].sort().join('_');

            const mssage = new Message({ sender, receiver, message});
            await mssage.save();

            // Envoie le message à tous les utilisateurs de la room
            // io.to(roomId).emit('getMessage', { sender, receiver, message });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du message:', error);
        }
        
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté');
    });
});

// Lancement du serveur
server.listen(8000, () => {
    console.log('Serveur écoute sur le port 8000');
});
