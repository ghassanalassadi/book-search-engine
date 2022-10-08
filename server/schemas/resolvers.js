const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id })
                    .select("-__v -password")
                    .populate('books');
            }
            throw new AuthenticationError("You need to be logged in!");
        }
    },
    
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { user, token };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError("No user found with this email address");
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError("Incorrect credentials");
            }

            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, {bookData}, context) => {
            if (context.user) {
                const updatingUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    {$push: {savedBooks: bookData}},
                    {new: true}
            );

            return updatingUser;
        }
        throw new AuthenticationError('You need to be logged in!');
        },
        removeBook: async (parent, {bookId}, context) => {
            if (context.user) {
                const updatingUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {$pull: {savedBooks: {bookId}}},
                    { new: true }
                );

                return updatingUser;
            }
            throw new AuthenticationError("You need to be logged in!");
        }
    }
};

module.exports = resolvers;