//친구 목록, 친구 검색
var express = require('express');
var router = express.Router();
const { query } = require('../modules/db');
const { verifyMiddleWare } = require('../modules/jwt');
var CryptoJS = require("crypto-js");
var secretKey = 'secret key';

/* GET /friend/가 들어왔을 때 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'friends' });
});


// 친구 목록 검색
router.get('/list', verifyMiddleWare, async (req, res, next) => {
  const {id} = req.decoded;
        
  const me = await query(`SELECT * FROM user WHERE id = '${id}'`);
  const users = await query(`SELECT * FROM user WHERE id IN (SELECT friend_id FROM friend WHERE id = '${id}')`);

  try {
    res.json({
      status: 200,
      message: '친구 검색 성공',                   
      data: { user_self: me, users: users }             
    });
  } catch (error) {
    res.json({
      status:400,
      message: '친구 검색 실패',
      error
    });
  }
  
});

// 친구 추가
router.get('/add/:id', verifyMiddleWare, async (req, res, next) => {
  const {id} = req.decoded;
  const {targetId}= req.params;

  const queryResult = await query(`INSERT INTO friend('${id}', '${targetId}')`);          
  const user = await query(`SELECT * FROM friend WHERE targetId = '${id}'`);

  console.log(queryResult);
  console.log(user);

  try {
    res.json({
      status: 200,
      message: '친구 추가 성공',
      data: user              
    });
  } catch (error) {
    res.json({
      status:400,
      message: '친구 추가 실패',
      error
    });
  }
});

// 친구 검색(가장 위에 있었던 라우터인데 와일드카드가 list를 받아서 밑으로 내려놓았습니다!)
router.get('/:id_name', verifyMiddleWare, async (req, res, next) => {
  try{
    const {id_name}= req.params;
        
    const user = await query(`SELECT * FROM user WHERE name LIKE '%"${id_name}"%'`);
    const user2 = await query(`SELECT * FROM user WHERE id LIKE '%"${id_name}"%'`);
  
    console.log(user);
    console.log(user2);
  
    res.json({
      status: 200,
      message: '친구 검색 성공',
      data: user              
    });

  } catch (error) {
    res.json({
      status:400,
      message: '친구 검색 실패',
      error
    });
  }
  
});


// 친구 삭제 
router.delete('/:id', verifyMiddleWare, async (req, res, next) => {
  const {id} = req.decoded;
  const {targetId}= req.params;

  const queryResult = await query(`DELETE FROM friend where id = '${id}' AND friend_id = '${targetId}'`);
  console.log(queryResult);

  try {
    res.json({
      status: 200,
      message: '친구 삭제 성공',
      data: targetId              // json 형식으로 다시 보낼 필요성 검토
    });
  } catch (error) {
    res.json({
      status:400,
      message: '친구 삭제 실패'
    });
  }
});

module.exports = router;
