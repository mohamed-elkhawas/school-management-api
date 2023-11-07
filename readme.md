## Introduction

This project is the backend of school management system. 
    
    Implemented using: Node.js, express, MongoDB and Redis.

    Tested using: jest, supertest and postman. 
        (the tests coverage exceeds 99% of the Branches).

    Secure against: Brocken Access Control attacks (BAC) and emails and password bruteforcing (rate limit)

    Deployed on: https://sms-api-ccpx.onrender.com

    Details:
        
        the super admin can CRUD schools, classrooms, students, and users with roles (super admin, admin and student).

        the admin can get his school, CRUD classrooms and students (in his school) and users with roles (student) (in his school).

        the student can only see his grades.

## Setup

Make sure to follow all these steps exactly as explained below. Do not miss any steps or you won't be able to run this application.

### Install MongoDB and Redis

To run this project, you need to install the latest version of MongoDB and Redis.

### Install the Dependencies

Next, from the project folder, install the dependencies:

    npm i

### Run the Tests

You're almost done! Run the tests to make sure everything is working:

    npm test

All tests should pass.

### (Optional) Environment Variables

you may edit the default superAdmin credentials, jwtPrivateKey, server port and databases urls using environment variables.

On Mac:

    export SM_jwtPrivateKey=your_Strong@SecureKey!
    export SM_mongoDB_url=mongodb://0.0.0.0/SM
    export SM_redisDB_url=redis://0.0.0.0:6379
    export SM_port=3000
    export SM_email=realy_unique@mail.com
    export SM_password=Very_Hard@P755w0rd
    export SM_username=Mohamed

On Windows:

    set SM_jwtPrivateKey=your_Strong@SecureKey!
    set SM_mongoDB_url=mongodb://0.0.0.0/SM
    set SM_redisDB_url=redis://0.0.0.0:6379
    set SM_port=3000
    set SM_email=realy_unique@mail.com
    set SM_password=Very_Hard@P755w0rd
    set SM_username=Mohamed

### add the new super admin

to clear the DB and to add the super admin :

    npm run seed

### Start the Server

    node index.js
