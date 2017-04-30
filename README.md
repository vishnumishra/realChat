# realChat

This is a real time chat applicaiton build on node.js sails.js socket.io angular.js and mysql.

`Installation`

git clone https://github.com/vishnumishra/realChat.git

npm install 


** you need to have mysql server to run this applicaiton.**

Now run these query:

```
CREATE DATABASE chat;

USE chat;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(22) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `password` varchar(200) NOT NULL,
  `p_photo` varchar(200) ,
  `timestamp` int(255) NOT NULL,
  `online` varchar(2) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `conversation` (
  `id` int(22) NOT NULL AUTO_INCREMENT,
  `from_id` varchar(200) NOT NULL,
  `to_id` varchar(200) NOT NULL,
  `timestamp` varchar(200) NOT NULL,
  `con_id` int(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `conversation_reply` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `reply` text NOT NULL,
  `from_id` int(11) NOT NULL,
  `to_id` int(11) NOT NULL,
  `timestamp` varchar(500) NOT NULL,
  `con_id` int(255) NOT NULL,
  PRIMARY KEY (`id`)
);

```

** Start the server **
node app.js

check in http://127.0.0.1:81
