//server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// 'uploads' image folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Change app.listen to http server
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: true, // React 클라이언트 주소
    methods: ["GET", "POST"]
  }
});

const connectedUsers = new Set();

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);
  connectedUsers.add(socket.id);
    console.log(`연결된 사용자 수: ${connectedUsers.size}`);

  // Join a chat room when a user connects
  socket.on('join_room', ( userId, chatRoomId ) => {
  socket.join(chatRoomId); // 채팅방에 참여
  console.log(`사용자 ${userId}가 ${chatRoomId} 방에 참여했습니다.`);
});

  // Listen for incoming chat messages
  socket.on('send_chat', (data) => { // 'send_chat' event to receive messages
    console.log('채팅 수신:', data);
    
    const { text, senderId, chatRoomId } = data;
    const timestamp = new Date();

    // Check for required data
    if (!text || !senderId || !chatRoomId) {
      console.error('필수 데이터가 부족합니다:', data);
      return; // Do not save if data is insufficient
    }

    // Insert chat into the database
    const query = 'INSERT INTO Chat (ChatRoomID, SenderID, Message, Timestamp) VALUES (?, ?, ?, ?)';
    db.query(query, [chatRoomId, senderId, text, timestamp], (error, results) => {
      if (error) {
        console.error('채팅을 데이터베이스에 저장하는 중 오류 발생:', error);
        return;
      }

      // Broadcast the message to all clients in the chat room
      io.to(chatRoomId).emit('receive_chat', {
        text,
        senderId,
        chatRoomId,
        timestamp, // You can send the timestamp or format it as needed
      });
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
  });
});

/*------------------------------------------------------------------------------------------------ */

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0000',
  database: 'ddw'});

// Connect database
db.connect((err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err);
    return;
  }
  console.log('MySQL 데이터베이스에 연결되었습니다.');
});

/*------------------------------------------------------------------------------------------------- */

// ProductList API
app.get('/products', (req, res) => {
  const productListQuery = 'SELECT * FROM Product';
  db.query(productListQuery, (err, result) => {
      if (err) {
          console.error('상품 목록 불러오기 오류:', err);
          return res.status(500).json({ message: '상품 목록 불러오기에 실패했습니다.' });
      }
      res.json(result); 
  });
});

// Product Detail Information API
app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const productDetailQuery = 'SELECT * FROM Product WHERE ProductID = ?';
  db.query(productDetailQuery, [id], (err, result) => {
      if (err) {
          console.error('상품 상세 정보 불러오기 오류:', err);
          return res.status(500).json({ message: '상품 상세 정보 불러오기에 실패했습니다.' });
      }
      res.json(result[0]); 
  });
});

// CategoryList API 
app.get('/categories', (req, res) => {
  const categoryListQuery = 'SELECT * FROM Category';
  db.query(categoryListQuery, (err, result) => {
      if (err) {
          console.error('카테고리 목록 불러오기 오류:', err);
          return res.status(500).json({ message: '카테고리 목록 불러오기에 실패했습니다.' });
      }
      res.json(result); 
  });
});

// Register Product
app.post('/register', upload.single('image'), (req, res) => {
  const {
    productName,
    productDescription,
    productPrice,
    transactionMethod,
    categoryID,
    userID,
  } = req.body;

  if (!userID) {
    return res.status(400).json({ message: '회원가입이 필요합니다.' });
  }

  // Get the file path of the uploaded image
  const imagePath = req.file ? req.file.path : null;

  // SQL query to insert product
  const productQuery = `
    INSERT INTO Product 
    (ProductName, Description, Price, LastPrice, UserID, CategoryID, RegistrationDate, ImageURL, TransactionMethod, Status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Prepare product values
  const productValues = [
    productName,
    productDescription,
    transactionMethod === 'auction' ? productPrice : productPrice,
    null, // LastPrice is initially null
    userID,
    categoryID,
    new Date(), // Registration date
    imagePath, // Store the image file path
    transactionMethod,
    '판매 중',
  ];

  // Execute the query
  db.query(productQuery, productValues, (error, results) => {
    if (error) {
      console.error('상품 등록 오류:', error);
      return res.status(500).json({ message: '상품 등록에 실패했습니다.', error: error });
    }

    const productId = results.insertId; // Newly inserted product ID
    res.status(201).json({ message: '상품이 성공적으로 등록되었습니다!', productId });
  });
});

// Make the uploads folder publicly accessible
app.use('/uploads', express.static('uploads'));

// Delete Product API
app.delete('/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM Product WHERE ProductID = ?';

  db.query(query, [productId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

// Edit Product API
app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const {
    ProductName,
    Description,
    Price,
    UserID,
    CategoryID,
    ImageURL,
    TransactionMethod,
    Status,
  } = req.body; 

  const query = `
    UPDATE Product 
    SET ProductName = ?, Description = ?, Price = ?, UserID = ?, CategoryID = ?, ImageURL = ?, TransactionMethod = ?, Status = ?
    WHERE ProductID = ?
  `;

  db.query(
    query,
    [ProductName, Description, Price, UserID, CategoryID, ImageURL, TransactionMethod, Status, id],
    (err, result) => {
      if (err) {
        console.error('상품 수정 중 오류 발생:', err);
        return res.status(500).send({ message: '상품 수정에 실패했습니다.', error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: '상품을 찾을 수 없습니다.' });
      }

      res.send({ message: '상품이 수정되었습니다.' }); // 수정 성공 메시지
    }
  );
});

// Add bid price API
app.post('/comments', (req, res) => {
  const { productId, userId, comment } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '로그인해야 작성가능합니다.' });
  }

  const sql = 'INSERT INTO Comment (ProductID, UserID, Comment) VALUES (?, ?, ?)';
  
  db.query(sql, [productId, userId, comment], (err, result) => {
    if (err) {
      console.error('댓글 추가 오류:', err);
      return res.status(500).json({ error: '댓글 추가에 실패했습니다.' });
    }
    res.status(201).json({ commentId: result.insertId });
  });
});

// Get bid price API
app.get('/comments/:productId', (req, res) => {
  const productId = req.params.productId;

  const sql = `
    SELECT c.CommentID, c.UserID, c.Comment, c.Timestamp, u.Username 
    FROM Comment c 
    JOIN User u ON c.UserID = u.UserID 
    WHERE c.ProductID = ? 
    ORDER BY c.Timestamp DESC`; // Latest bid price first
  
  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('댓글 가져오기 오류:', err);
      return res.status(500).json({ error: '댓글 가져오기 실패' });
    }
    res.json(results); 
  });
});

// Update Latest bid price API
app.put('/products/:id/auction-end', (req, res) => {
  const productId = req.params.id;

  const sql = `
    SELECT Comment 
    FROM Comment 
    WHERE ProductID = ? 
    ORDER BY Timestamp DESC 
    LIMIT 1`;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('최신 댓글 가져오기 오류:', err);
      return res.status(500).json({ error: '최신 댓글 가져오기 실패' });
    }

    // no bid
    if (results.length === 0) {
      return res.json({ message: '경매가 종료되었습니다. 참여자가 없어 유찰되었습니다.', LastPrice: null });
    }

    const latestCommentPrice = parseInt(results[0].Comment); // 최신 댓글의 가격을 가져옴

    // Product 테이블의 LastPrice 및 Status 업데이트
    const updateSql = `
      UPDATE Product 
      SET LastPrice = ?, Status = '거래 중' 
      WHERE ProductID = ?`;

    db.query(updateSql, [latestCommentPrice, productId], (updateErr) => {
      if (updateErr) {
        console.error('LastPrice 및 Status 업데이트 오류:', updateErr);
        return res.status(500).json({ error: 'LastPrice 및 Status 업데이트 실패' });
      }

      res.json({ message: '경매가 성공적으로 종료되었습니다. 낙찰가가 업데이트되었습니다.', LastPrice: latestCommentPrice });
    });
  });
});

// Chatroom List for specific user API
app.get('/chatrooms', async (req, res) => {
  const userId = req.query.userId;

  const query = `
    SELECT ChatRoomID, ProductID, SellerID, BuyerID
    FROM ChatRoom
    WHERE SellerID = ? OR BuyerID = ?
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('채팅방 목록을 불러오는 중 오류가 발생했습니다.', err);
      return res.status(500).json({ error: '채팅방 목록 불러오기 실패' });
    }

    res.json(results); // 참여한 채팅방 목록 반환
  });
});


// Get Chat Record API
app.get('/chatroom/:chatRoomId/messages', async (req, res) => {
  const chatRoomId = req.params.chatRoomId; // URL 파라미터에서 채팅방 ID 가져오기

  const query = `
    SELECT SenderID, Message, Timestamp
    FROM Chat
    WHERE ChatRoomID = ?
    ORDER BY Timestamp ASC
  `;

  db.query(query, [chatRoomId], (err, results) => {
    if (err) {
      console.error('채팅 로드 오류:', err);
      return res.status(500).json({ error: '채팅을 불러오는 중 오류가 발생했습니다.' });
    }

    // 채팅 기록 반환
    res.json(results); // 채팅 기록 배열 반환
  });
});

// Check existing chatroom API
app.get('/chatroom/:productId/:sellerId/:buyerId', (req, res) => {
  const { productId, sellerId, buyerId } = req.params;

  const query = `
    SELECT * FROM ChatRoom 
    WHERE ProductID = ? AND SellerID = ? AND BuyerID = ? LIMIT 1
  `;

  db.query(query, [productId, sellerId, buyerId], (err, results) => {
    if (err) {
      console.error('Error fetching chat room:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      // 채팅방이 존재하면 해당 데이터를 클라이언트에 반환
      res.status(200).json(results[0]);
    } else {
      // 채팅방이 없으면 404 상태와 함께 에러 메시지 반환
      res.status(404).json({ message: 'Chat room not found' });
    }
  });
});

// Create Chatroom API
app.post('/chatroom', (req, res) => {
  const { ProductID, SellerID, BuyerID } = req.body;

  // 중복된 채팅방이 있는지 확인
  const checkQuery = `
    SELECT * FROM ChatRoom 
    WHERE ProductID = ? AND SellerID = ? AND BuyerID = ? LIMIT 1
  `;

  db.query(checkQuery, [ProductID, SellerID, BuyerID], (err, results) => {
    if (err) {
      console.error('Error checking for existing chat room:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      // 이미 채팅방이 존재하면 에러 반환
      return res.status(400).json({ message: 'Chat room already exists' });
    }

    // 새로운 채팅방 생성 쿼리
    const insertQuery = `
      INSERT INTO ChatRoom (ProductID, SellerID, BuyerID) 
      VALUES (?, ?, ?)
    `;

    db.query(insertQuery, [ProductID, SellerID, BuyerID], (err, results) => {
      if (err) {
        console.error('Error creating chat room:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // 새로 생성된 채팅방의 ID를 반환
      const newChatRoomID = results.insertId;
      res.status(201).json({ ChatRoomID: newChatRoomID, ProductID, SellerID, BuyerID });
    });
  });
});

/*------------------------------------------------------------------------------------------------ */

// Start server
const PORT = process.env.PORT || 5000;
server.listen(5000, () => {
  console.log('서버가 포트 5000에서 실행 중입니다.');
});
