const { ApolloServer } = require('apollo-server');
const isEmail = require('isemail');

const { createStore } = require('./utils');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const typeDefs = require('./schema');

const resolvers = require('./resolvers');

const store = createStore();

const server = new ApolloServer({
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || '';
    const email = Buffer.from(auth, 'base64').toString('ascii');
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;

    return { user: { ...user.dataValues } };
  },
  typeDefs,
  // fieldName: (parent, args, context, info) => data;
  resolvers,
  engine: {
    apiKey: process.env.ENGINE_API_KEY,
    schemaTag: 'production',
  },
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
