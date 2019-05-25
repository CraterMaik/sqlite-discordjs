const Discord = require("discord.js");
const client = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./mybotdata.sqlite"); //nombre de nuestra bd

client.on("ready", () => {
	console.log("Estoy listo!");

	//<-- CREATE TABLE USUARIO -->
 let crear = "CREATE TABLE IF NOT EXISTS usuarios (idusuario TEXT, nivel INTEGER, exp INTEGER)";

 db.run(crear, function (err) {
 	if (err) return console.error(err.message)
 })

});

let prefix = '!';

client.on("message", (message) => {

	if (!message.content.startsWith(prefix)) return;
	if (message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	//<-- INSERT USUARIO / UPDATE EXPERIENCIA/NIVELES -->
let id = message.author.id;
let sentencia = `SELECT * FROM usuarios WHERE idusuario = ${id}`;

db.get(sentencia, (err, filas) => {
	if (err) return console.error(err.message)
	if (!filas) {
		let insert = `INSERT INTO usuarios(idusuario, nivel, exp) VALUES(${id}, 0, 1)`;

		db.run(insert, function (err) {
			if (err) return console.error(err.message)
		});

	} else {

		//<-- UPDATE EXPERIENCIA/NIVELES -->
		let curLevel = Math.floor(0.1 * Math.sqrt(filas.exp + 1));

		if (curLevel > filas.nivel) {
			let update = `UPDATE usuarios SET exp = ${filas.exp + 1}, nivel = ${curLevel} WHERE idusuario = ${id}`;

			db.run(update, function (err) {
				if (err) return console.error(err.message)
				message.channel.send('Subiste de nivel, ' + message.author.tag)

			});

		}

		let update = `UPDATE perfiles SET exp = ${filas.exp + 1} WHERE idusuario = ${id}`;
		db.run(update, function (err) {
			if (err) return console.error(err.message)
		})

	}

});

	//<-- SELECT USUARIO -->
if (command === "perfil") {
	let select = `SELECT * FROM usuarios WHERE idusuario = ${id}`;

	db.get(select, (err, filas) => {
		if (err) return console.error(err.message)
		if (!filas) return message.channel.send('Sin resultados.')

		let embed = new Discord.RichEmbed()
			.setAuthor('Perfil de ' + message.author.username, message.author.displayAvatarURL)
			.addField('Nivel', filas.nivel, true)
			.addField('Exp', filas.exp, true)
			.setColor("ff7b00")

		message.channel.send(embed);

	});

}

	//<-- DELETE USUARIO -->
if (command === "eliminar") {
	let miembro = message.mentions.users.first();
	if (!miembro) return message.channel.send('Debe mencionar a un usuario a eliminar.')

	let remover = `DELETE FROM usuarios WHERE idusuario = ${miembro.id}`;
	db.run(remover, function (err) {
		if (err) return console.error(err.message)
		message.channel.send(miembro.username + ', fue eliminado correctamente.');
	});

}

	//<-- SELECT LISTA TOP USUARIO -->
if (command === "top") {
	let lista = `SELECT idusuario, nivel, exp FROM usuarios ORDER BY nivel DESC LIMIT 10`
	let embed = new Discord.RichEmbed()

	db.all(lista, (err, filas) => {
		if (err) return console.error(err.message)
		let datos = [];

		filas.map(ls => {
			if (client.users.get(ls.idusuario)) {
				datos.push('__' + client.users.get(ls.idusuario).tag + '__, Nivel: **' + ls.nivel + '**, Exp: **' + ls.exp + '**')
			}

		});

		embed.setTitle('Lista de usuarios (TOP Niveles)')
		embed.setDescription(datos.join('\n'))

		message.channel.send(embed);

	});

}

});

client.login("TokenSecreto");