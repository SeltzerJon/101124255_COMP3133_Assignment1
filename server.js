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

        createEmployee(firstname: String!, lastname: String!, email: String!, gender: String!, salary: String!): Employee    }

    type Query {
        login(username: String!, password: String!): User
        
        getAllEmployees: [Employee]
    }
    type Employee {
        id: ID!
        firstname: String!
        lastname: String!
        email: String!
        gender: String!
        salary: Float!
    }
`);

// User Model
const User = mongoose.model('User', {
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});


const Employee = mongoose.model('Employee', {
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    salary: {
        type: Number,
        required: true
    }
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
    },
    getAllEmployees: async () => {
        try {
            const employee = await Employee.find();
            return employee;
        } catch (error) {
            throw new Error('Unable to fetch employees');
        }
    },
    createEmployee: async ({ firstname, lastname, email, gender, salary }) => {
        const employee = new Employee({ firstname, lastname, email, gender, salary });
        await employee.save();
        return employee;
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
