let users;

export default class UsersDAO {
    static async injectDB(conn) {
        if(users) {
            return;
        }

        try {
            users = await conn.db(process.env.DB_NAME).collection("users");
        } catch(err) {
            console.log(`Failed to inject DB. ${err}`);
        }
    }

    static async addUser(data) {
        try {
            const user = await users.findOne({ username: data.username });
            if(user) {
                throw new Error(`Username ${data.username} già utilizzato.`);
            }

            return await users.insertOne(data);
        } catch(err) {
            console.log(`addUser - ${err}`);
            return { error: err };
        }
    }

    static async getUserByName(username) {
        try {
            return await users.findOne({ username: username });
        } catch(err) {
            console.log(`login - ${err}`);
        }
    }

    static async getPermessi() {
        try {
            const cursor = await users.aggregate([
                { $match: { "permessi.1": { $exists: true } } },
                { $project: { "_id": 0, "password": 0, "admin": 0 } }
            ]);
            const displayCursor = cursor.limit(Number.MAX_SAFE_INTEGER).skip(0);
            const usersList = await displayCursor.toArray();
            return usersList;
        } catch(err) {
            console.log("getUsers - ", err);
        }
    }

    static async pushPermessi(username, dataToPush = []) {
        try {
            return await users.updateOne(
              { username: username },
              { $push: { permessi: { $each: dataToPush } } }
            );
        } catch(err) {
            console.log(`pushPermessi - ${err}`);
            return { error: err };
        }
    }

    static async pullPermessi(username, dataToPull = []) {
        try {
            return await users.updateOne(
              { username: username },
              { $pull: { permessi: { $in: dataToPull } } }
            );
        } catch(err) {
            console.log(`pullPermessi -${err}`);
            return { error: err };
        }
    }
};