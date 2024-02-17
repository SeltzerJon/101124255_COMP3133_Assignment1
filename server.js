const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const app = express();

mongoose.connect('mongodb+srv://jon:uZ9YM1XJVh9ZELBQ@cluster0.j4ebflz.mongodb.net/comp3133_assigment1?retryWrites=true&w=majority', 
{ useNewUrlParser: true, useUnifiedTopology: true });

const schema = buildSchema(`
    type User {
        id: ID!
        username: String!
        password: String!
        email: String!
    }

    type Mutation {
        signup(username: String!,password: String!, email: String!): User
    }

    type Query {
        login(username: String!, password: String!): User
    }
`);

// User Model
const User = mongoose.model('User', {
    username: String,
    email: { type: String, unique: true },
    password: String
});


const root = {
    // Sign Up

    signup: async ({ username, password, email }) => {
        // If the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        // Hashes the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email });
        await user.save();
        return user;
    },

    // Login
    login: async ({ username, password }) => {
        // If the user already exists  
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        // compares the password of the input and users
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        return user;
    }
};


app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/graphql`);
});
