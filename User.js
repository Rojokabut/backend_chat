const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    photo: { 
        type: String ,
        required : true

    }
});

//Hash le mot de passe avant de sauvegarder l'User
userSchema.pre('save', async function (next){
    if(!this.isModified('password')){
        return next;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password , salt);
    next();
})

//Comparer le mot de passe pour l'authentification
userSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', userSchema);
module.exports = User;
