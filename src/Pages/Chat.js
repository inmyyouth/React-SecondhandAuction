import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import io from 'socket.io-client'; // Socket.IO 클라이언트
import './Chat.css';

const socket = io('http://localhost:5000'); // 서버 주소

const Chat = () => {
  const { productId, chatRoomId } = useParams();
  const { userId } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [productName, setProductName] = useState('');

  useEffect(() => {
    // 채팅 방에 참여
    socket.emit('join_room', userId, chatRoomId);

    // 실시간 메시지 수신
    socket.on('receive_chat', (data) => {
      // 데이터 형식 확인 및 메시지 추가
      const newMessageData = {
        SenderID: data.senderId,
        Message: data.text,
        Timestamp: data.timestamp,
      };
      setMessages((prevMessages) => [...prevMessages, newMessageData]); // 새로운 메시지를 추가
    });

    // 채팅 기록 가져오기 (초기 로드)
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chatroom/${chatRoomId}/messages`);
        const data = await response.json();
        setMessages(data); // 기존 채팅 기록을 설정
      } catch (error) {
        console.error('채팅 기록을 가져오는 중 오류가 발생했습니다.', error);
      }
    };

    fetchMessages(); // 컴포넌트 로드 시 채팅 기록 가져오기

    // 상품 정보 가져오기
    const fetchProductName = async () => {
      try {
        const response = await fetch(`http://localhost:5000/products/${productId}`);
        const data = await response.json();
        setProductName(data.ProductName); // ProductName 설정
      } catch (error) {
        console.error('상품 정보를 가져오는 중 오류가 발생했습니다.', error);
      }
    };

    fetchProductName(); // 컴포넌트 로드 시 상품 이름 가져오기

    return () => {
      // 소켓 이벤트 정리
      socket.off('receive_chat');
    };
  }, [chatRoomId, userId, productId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (newMessage.trim() === '') return;

    const messageData = {
      chatRoomId,
      senderId: userId,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    // 소켓을 통해 메시지 전송
    socket.emit('send_chat', messageData);
    setNewMessage(''); // 메시지 전송 후 입력창 초기화
  };

  // 엔터키로 메시지 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e); // 메시지 전송 함수 호출
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-room">채팅방</h2>
      <p className="name"><strong>제품: {productName}</strong></p> {/* Product Name 표시 */}
      <div className="messages">
        {messages.length > 0 ? ( // 메시지가 있을 때만 표시
          messages.map((msg, index) => {
            // 각 메시지 렌더링 시 ID를 콘솔에 출력
            // SenderID와 userId를 문자열로 변환하여 비교
            const isCurrentUser = String(msg.SenderID) === String(userId);
  
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', // 오른쪽 또는 왼쪽 정렬
                  margin: '10px 40px', // 메시지 간의 간격 조정
                }}
              >
                <div 
                  style={{
                    maxWidth: '100%', 
                    textAlign: isCurrentUser ? 'right' : 'left',
                    backgroundColor: isCurrentUser ? '#D1E7DD' : '#F8D7DA', // 색상 변경
                    borderRadius: '10px', // 모서리 둥글게
                    padding: '15px', // 여백 추가
                  }}
                >
                  <strong>{msg.SenderID}</strong>: {msg.Message} {/* SenderID와 Message 출력 */}
                  <span style={{ fontSize: '0.8em', color: '#888' }}>
                   <br/> {' ('}{new Date(msg.Timestamp).toLocaleString()}{')'} {/* 타임스탬프 출력 */}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p>채팅 기록이 없습니다.</p> // 메시지가 없을 경우
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="message-form">
        <textarea
        className="input-box"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          onKeyPress={handleKeyPress} // 엔터키 이벤트 핸들러 추가
        />
        <button className="send-button" type="submit">전송</button>
      </form>
      </div>
  );  
};

export default Chat;