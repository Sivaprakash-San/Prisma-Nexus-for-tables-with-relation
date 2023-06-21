const { PrismaClient } = require('@prisma/client');
const { queryType, mutationType, stringArg, makeSchema, objectType, nonNull } = require('@nexus/schema');
const { ApolloServer } = require('apollo-server');

const prisma = new PrismaClient();

const client = objectType({
    name: 'client',
    definition(t){
        t.string('id');
        t.string('name');
        t.string('email');
        t.list.field('profile', {
            type: 'profile',
            resolve: (parent,_args) => {
                return prisma.client.findUnique({
                    where: {
                        id: parent.id || undefined
                    },
                })
                .profile();
            }
        })
    },
});

const profile = objectType({
    name: 'profile',
    definition(t) {
        t.string('id');
        t.string('bio');
        t.field('client', {
            type: 'client',
            resolve: (parent, _args) => {
                return prisma.profile.findUnique({
                    where: {
                        id: parent.id || undefined
                    },
                })
                .client()
            }
        })
    }
})

const Query = queryType({
    definition(t) {
        t.field('singleClient', {
            type: 'client',
            args: {
                id: stringArg({required: true}),
            },
            resolve: (_, args) => {
                return prisma.client.findUnique({
                    where: {
                        id: args.id,
                    }
                });
            }
        })

        t.list.field('manyClients', {
            type: 'client',
            resolve: () => {
                return prisma.client.findMany();
            },
        });

        t.field('singleProfile', {
            type: 'profile',
            args: {
                id: stringArg({required: true}),
            },
            resolve: (_, args) => {
                return prisma.profile.findUnique({
                    where: {
                        id: args.id,
                    },
                });
            },
        });

        t.list.field('manyProfiles', {
            type: 'profile',
            resolve: () => {
                return prisma.profile.findMany();
            },
        });
    },
});

const Mutation = mutationType({
    definition(t){
        t.field('createClient', {
            type: 'client',
            args: {
                name: stringArg({required: true}),
                email: stringArg({required: true})
            },
            resolve: async (_parent, args) => {
                return prisma.client.create({
                    data: {
                        name: args.name,
                        email: args.email,
                    },
                });
            },
        });

        t.field('createProfile', {
            type: 'profile',
            args: {
                bio:nonNull(stringArg()),
                client_id: stringArg({required: true}),
            },
            resolve: (_parent, args) => {
                return prisma.profile.create({
                    data: {
                        bio: args.bio,
                        client: {
                            connect: {
                                id: args.client_id,
                            }
                        },
                    },
                });
            },
        });

        t.field('deleteClient', {
            type: 'client',
            args: {
                id: stringArg({required: true}),
            },
            resolve:async (_, args) => {
               await prisma.profile.deleteMany({
                    where: {
                        client_id: args.id,
                    }
                });
               return await prisma.client.delete({
                    where: {
                        id: args.id,
                    },
                });  
            }
        });
    },
});






const schema = makeSchema({
    types: [client, profile, Query, Mutation]
});

const server = new ApolloServer({ schema });
server.listen(5000, () => {
    console.log("running on 5000");
});