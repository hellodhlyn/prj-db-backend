const cookie = require('cookie');
const { verify } = require('../modules/jwt');
const { query } = require('../modules/db');
const app = require('../app');

const getIdAndName = socket => socket.handshake.headers['cookie'] && cookie.parse(socket.handshake.headers['cookie']).token && verify(cookie.parse(socket.handshake.headers['cookie']).token) || {};
const updateOnlineList = (io, roomName) => { //roomName이 online임. online인사람 늘어나는거. online 방에 있는 사람 전체의 정보를 출력함. 
	const roomPeople = io.sockets.adapter.rooms.get(roomName) ? Array.from(io.sockets.adapter.rooms.get(roomName)).map(socket_id => ({
		id: io.sockets.sockets.get(socket_id).user_id,
		name: io.sockets.sockets.get(socket_id).name,
	})) : [];

	// notification(알림) to people //online접속된 사람들에게 누가 새로 접속했다고 알림. 일단 알리지 않는 것으로 보냅니다.
	//io.to(roomName).emit('UPDATE_ONLINE_USERS', roomPeople);
}

//io.sockets.sockets가 현재 존재하는 모든 소켓을 의미하는 듯 하다. 
//온라인이든 아니든 일단 찾아준다. 부재시(로그아웃중)에도 채팅이 보내질 수 있음. 
const findSocketById = (io, id) => {
	const sockets = [];
	for (let socket of io.sockets.sockets.values()) {
		if (socket.user_id === id) {
			sockets.push(socket);		
		}
	}
	return sockets;
};

module.exports = io => {
	app.set('io',io);
	io.on('connection', socket => { //웹소켓 연결 시 . 로그인하면 소켓 만들어서 연결됨. 소켓 connect는 여기서 하는게 아니라 front에서 던지는거 
		//disconnect는 새로 socket을 만들기 전에는 이뤄지지 않는다. disconnect하면 부재시에는 채팅이 갈 수가 없음. 
		//아니 그 실시간 채팅방에 있지 않으면 실시간으로 채팅을 전송할 필요가 없지 않은가? 
		//front는 그 방에 있지 않으면 'RESPONSE_MESSAGE'에 unsubscribe하게 구현되어있음 

		const { id, name } = getIdAndName(socket); // 얘는 어떤 name을 제공하는거지. 
		if (id) {
			findSocketById(io, id).map(socket => socket.disconnect()); // 원래 같은 id로 연결되어있던게 있으면 다 끊음. 
			socket.user_id = id;
			socket.name = name;
			socket.join('online');
			updateOnlineList(io, 'online');
			console.log(`JOIN ONLINE ${id}`);
		} else {
			socket.disconnect(); 
		}


		socket.on("disconnect", () => {//연결 종료시 . online이라는 room에서 빠지게됨. 
			if (socket.user_id) {
				socket.leave('online');
				updateOnlineList(io, 'online');
				console.log(`LEAVE ONLINE ${socket.user_id}`); 
			}
		});
	});
};
