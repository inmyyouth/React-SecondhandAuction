import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { Link } from 'react-router-dom';
import './MyChatRooms.css';

const MyChatrooms = () => {
  const { userId } = useUser(); // 현재 로그인된 사용자의 userID를 가져옴
  const [chatrooms, setChatrooms] = useState([]); // 채팅방 목록을 저장할 상태
  const [loading, setLoading] = useState(true);   // 로딩 상태

  useEffect(() => {
    const fetchChatrooms = async () => {
      try {
        // userId가 sellerID 또는 buyerID로 참여한 채팅방 목록을 가져오는 API 호출
        const response = await axios.get(`http://localhost:5000/chatrooms?userId=${userId}`);
        const chatroomsData = response.data;

        // 각 채팅방에 해당하는 상품 정보 가져오기
        const productDetails = await Promise.all(
          chatroomsData.map(async (chatroom) => {
            const productResponse = await axios.get(`http://localhost:5000/products/${chatroom.ProductID}`);
            return { chatroom, product: productResponse.data };
          })
        );

        // 가져온 채팅방과 상품 정보 저장
        setChatrooms(productDetails);
      } catch (error) {
        console.error('채팅방 목록을 불러오는 중 오류가 발생했습니다.', error);
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    if (userId) {
      fetchChatrooms(); // userId가 있는 경우 채팅방 목록을 가져옴
    }
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (chatrooms.length === 0) {
    return <div>채팅 기록이 없습니다.</div>;
  }

  return (
    <div className="my-chatrooms">
      <h2 className="my-room">내가 참여한 채팅방</h2>
      <div className="chatroom-list">
        {chatrooms.map(({ chatroom, product }) => {
          // 현재 로그인된 사용자가 sellerID인지 buyerID인지 확인하고 상대방 ID 설정
          let otherPartyId = '';

          if (chatroom.SellerID.toString() === userId.toString()) {
            otherPartyId = chatroom.BuyerID; // 내가 판매자면 상대방은 구매자
          } else if (chatroom.BuyerID.toString() === userId.toString()) {
            otherPartyId = chatroom.SellerID; // 내가 구매자면 상대방은 판매자
          }
          console.log(otherPartyId);

          return (
            <div key={chatroom.ChatRoomID} >
              <Link to={`/chatroom/${product.ProductID}/${chatroom.ChatRoomID}`} className="product-name-link">
                <h3 className="chatroom-box">{product.ProductName}</h3>
              </Link>
              {otherPartyId ? (
                <p className="ID">상대방 ID: {otherPartyId}</p> // 상대방 ID 출력
              ) : (
                <p>상대방 정보가 없습니다.</p> // 상대방 정보가 없을 때의 처리
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyChatrooms;
