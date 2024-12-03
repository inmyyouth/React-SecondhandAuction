import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from './UserContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [product, setProduct] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newImage, setNewImage] = useState(null); 
  const [transactionMethod, setTransactionMethod] = useState('direct');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false); // 신고 모달 표시 상태
  const [reportReason, setReportReason] = useState(''); // 신고 사유
  const [reportedUserId, setReportedUserId] = useState(null); // 신고당한 사용자의 ID

  // 댓글 갱신
  useEffect(() => {
    let commentPollingInterval;
  
    const fetchComments = async () => {
      if (transactionMethod !== 'auction') return;
      try {
        const response = await axios.get(`http://localhost:5000/comments/${id}`);
        const fetchedComments = response.data.map(c => ({
          userId: c.UserID,
          content: c.Comment,
          timestamp: c.Timestamp,
        }));
  
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
  
    // Start polling for new comments every second during auction
    if (transactionMethod === 'auction' && timeLeft > 0) {
      commentPollingInterval = setInterval(fetchComments, 1000);
    }
  
    // Clean up the interval when component unmounts or auction ends
    return () => {
      if (commentPollingInterval) {
        clearInterval(commentPollingInterval);
      }
    };
  }, [id, transactionMethod, timeLeft]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/products/${id}`);
        setProduct(response.data);
        setTransactionMethod(response.data.TransactionMethod);

        if (response.data.TransactionMethod === 'auction') {
          const auctionEndTime = new Date(response.data.RegistrationDate);
          auctionEndTime.setHours(auctionEndTime.getHours() + 24); // 1시간 추가
          setTimeLeft(auctionEndTime - new Date());
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (transactionMethod !== 'auction') return;
      try {
        const response = await axios.get(`http://localhost:5000/comments/${id}`);
        const fetchedComments = response.data.map(c => ({
          userId: c.UserID,
          content: c.Comment,
          timestamp: c.Timestamp,
        }));

        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [id, transactionMethod]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(prev => prev - 1000);
      } else if (timeLeft <= 0 && !isAuctionEnded) {
        if (transactionMethod === 'auction') {
          setIsAuctionEnded(true);
          handleAuctionEnd();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAuctionEnded, transactionMethod]);

  const handleAuctionEnd = async () => {
    try {
      const response = await axios.put(`http://localhost:5000/products/${id}/auction-end`);
      
      if (response.data.LastPrice === null) {
        alert(response.data.message);
      } else {
        setLastPrice(response.data.LastPrice);
        alert(response.data.message);

        // 경매 종료 시 상품 상태를 "거래 중"으로 변경
        const updatedProduct = { ...product, Status: '거래 중' }; // 상태 변경
        setProduct(updatedProduct); // 로컬 상태 업데이트

        // 서버로 상태 업데이트 요청
        await axios.put(`http://localhost:5000/products/${id}`, updatedProduct);
      }
    } catch (error) {
      console.error('경매 종료 오류:', error);
      alert('경매 종료 중 오류가 발생했습니다.');
    }
  };

  // 댓글 엔터로 제출 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(e);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (comment.trim() === '') {
      alert('입찰가를 입력하세요. (숫자만 가능합니다)');
      return;
    }

    if (userId === null) {
      alert('입찰할 수 없습니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    const currentPrice = product.Price;
    const latestCommentPrice = comments.length > 0 ? parseInt(comments[0].content) : 0;

    if (parseInt(comment) <= currentPrice) {
      alert(`입찰가는 ${currentPrice}원 이상이어야 합니다.`);
      return;
    }

    if (parseInt(comment) <= latestCommentPrice) {
        alert(`입찰가는 가장 최신 입찰가(${latestCommentPrice}원)보다 높아야 합니다.`);
        return;
      }

    const newComment = { productId: id, userId, comment };

    try {
        const response = await axios.post('http://localhost:5000/comments', newComment);
        const timestamp = new Date().toISOString();
        setComments([{ userId, content: comment, timestamp }, ...comments]);
        setComment('');
      } catch (error) {
        console.error('입찰 실패:', error);
        alert('입찰에 실패했습니다.');
      }
    };

  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`http://localhost:5000/products/${id}`);
      alert('상품이 삭제되었습니다.');
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  const handleUpdateProduct = async () => {
    const updatedProduct = { ...product, TransactionMethod: transactionMethod };


    try {
      await axios.put(`http://localhost:5000/products/${id}`, updatedProduct);
      alert('상품이 수정되었습니다.');
      setIsEditing(false);
      setProduct(updatedProduct);
      setNewImage(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('상품 수정에 실패했습니다.');
    }
  };

  const startChat = async () => {
    const sellerID = product.UserID; // Seller ID
    let buyerID = null;
  
   // For auction
   if (transactionMethod === 'auction') {
    if (comments.length > 0) {
      buyerID = comments[0].userId; // Most recent commenter
    } else {
      alert('입찰 기록이 없습니다.');
      return; // 댓글(입찰자)이 없으면 종료
    }

    try {
      // Check for existing chat room
      const response = await axios.get(`http://localhost:5000/chatroom/${id}/${sellerID}/${buyerID}`);
      // Navigate to existing chat room
      navigate(`/chatroom/${id}/${response.data.ChatRoomID}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Create new chat room if not found
        try {
          const newChatRoom = {
            ProductID: id,
            SellerID: sellerID,
            BuyerID: buyerID,
          };

          const createResponse = await axios.post('http://localhost:5000/chatroom', newChatRoom);
          navigate(`/chatroom/${id}/${createResponse.data.ChatRoomID}`); // chatRoomID 포함
        } catch (createError) {
          console.error('Error creating chat room:', createError);
          alert('채팅방 생성 중 오류가 발생했습니다.');
        }
      } else {
        console.error('Error fetching chat room:', error);
        alert('채팅방 조회 중 오류가 발생했습니다.');
      }
    }
  
    // For direct sale
    } else if (transactionMethod === 'direct') {
        buyerID = userId; // Direct transaction uses logged-in user as buyer
    
        try {
          // Check for existing chat room
          const response = await axios.get(`http://localhost:5000/chatroom/${id}/${sellerID}/${buyerID}`);
          // Navigate to existing chat room
          navigate(`/chatroom/${id}/${response.data.ChatRoomID}`);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Create new chat room if not found
            try {
              const newChatRoom = {
                ProductID: id,
                SellerID: sellerID,
                BuyerID: buyerID,
              };
              const createResponse = await axios.post('http://localhost:5000/chatroom', newChatRoom);
              navigate(`/chatroom/${id}/${createResponse.data.ChatRoomID}`); // chatRoomID 포함
            } catch (createError) {
              console.error('Error creating chat room:', createError);
              alert('채팅방 생성 중 오류가 발생했습니다.');
            }
          } else {
            console.error('Error fetching chat room:', error);
            alert('채팅방 조회 중 오류가 발생했습니다.');
          }
        }
      }
    };

  // 신고 기능
  const handleReportSubmit = async () => {
    if (!reportReason) {
      alert("신고 사유를 선택하세요.");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/report-user', {
        userId: reportedUserId, // 신고 대상 사용자의 ID (판매자 또는 댓글 작성자)
        reasonId: reportReason, // 선택한 신고 사유
      });
      alert('사용자가 신고되었습니다.');
      setShowReportModal(false);
    } catch (error) {
      console.error('사용자 신고 오류:', error);
      alert('신고 중 오류가 발생했습니다.');
    }
  };


  const formatTimeLeft = (time) => {
    const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((time % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div className="img-display-container" style={{ flex: '2', marginRight: '50px' }}>
          <img className="img" src={`http://localhost:5000/${product.ImageURL}`} alt={product.ProductName} />
        </div>

        <div className="container-area" style={{ flex: '2' }}>
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProduct(); }}>
              <div className="revise-input-horizontal">
                <label className="name1">상품명</label>
                <input
                  className="product-revise-input1"
                  type="text"
                  value={product.ProductName}
                  onChange={(e) => setProduct({ ...product, ProductName: e.target.value })}
                  required
                />
              </div>
              <div className="revise-input-horizontal">
                <label className="name">설명</label>
                <textarea
                  className="product-revise-input"
                  value={product.Description}
                  onChange={(e) => setProduct({ ...product, Description: e.target.value })}
                  required
                />
              </div>
              <div className="revise-input-horizontal">
                <label className="name">가격</label>
                <input
                  className="product-revise-input"
                  type="number"
                  value={product.Price}
                  onChange={(e) => setProduct({ ...product, Price: e.target.value })}
                  required
                />
              </div>
              <div className="revise-input-horizontal">
                <label className="name">상태</label>
                <select
                  className="product-revise-input"
                  value={product.Status}
                  onChange={(e) => setProduct({ ...product, Status: e.target.value })}
                  required
                >
                  <option value="판매 중">판매 중</option>
                  <option value="거래 중">거래 중</option>
                  <option value="거래 완료">거래 완료</option>
                </select>
              </div>
              <div>
                <button className="revise-button" type="submit">상품 수정</button>
              </div>
            </form>
          ) : (
            <>
              {/* 상품 상세 정보 표시 */}
              <div className="price2">
                <h1>{product.ProductName}</h1>
              </div>
              <p className="price">{product.Description}</p>
              <h4 className="price">상태</h4> 
              <p className="price1">{product.Status}</p>
              <h4 className="price">거래 방법</h4> 
              <p className="price1">{product.TransactionMethod === 'direct' ? '가격 제시' : '경매'}</p>
              {transactionMethod === 'direct' ? (
                <>
                  <h4 className="price">가격</h4> 
                  <p className="price1">{product.Price}원</p>
                  {String(product.UserID) !== String(userId) && (
                    <>
                      <button className="message-start-button" onClick={startChat}>채팅 시작</button>
                      {/* 판매자 신고 버튼 */}
                      <button className="emergency-button1" onClick={() => {
                        setReportedUserId(product.UserID); // 판매자를 신고 대상으로 설정
                        setShowReportModal(true); // 신고 모달 표시
                      }}>
                        판매자 신고
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {timeLeft > 0 && (
                    <div>
                      <h4 className="price">시작 가격</h4>  
                      <p className="price1">{product.Price}원</p>
                      <h2 className="price3">남은 경매 시간</h2>
                      <p className="price4">{formatTimeLeft(timeLeft)}</p>
                    </div>
                  )}

                  {isAuctionEnded && (
                    <h2 style={{ color: 'red', fontWeight: 'bold' }}>경매 종료되었습니다.</h2>
                  )}

                  {isAuctionEnded && lastPrice !== null && (
                    <h2>낙찰가는 {lastPrice}원입니다.</h2> 
                  )}

                  {comments.length > 0 && (
                    <div>
                      {(String(comments[0].userId) === userId || String(product.UserID) === userId) && isAuctionEnded ? (
                        <button className="message-start-button" onClick={startChat}>채팅 시작</button>
                      ) : (
                        <button className="message-start-button" disabled>채팅 불가</button>
                      )}
                    </div>
                  )}
                </>
              )}

              {String(product.UserID) === userId && (transactionMethod !== 'auction') && (
                <div className="product-button-container">
                  <button className="product-button" onClick={() => setIsEditing(true)}>상품 수정</button>
                  <button className="product-button" onClick={handleDeleteProduct}>상품 삭제</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 신고 모달 */}
      {showReportModal && (
        <div className="modal">
          <h3 className="price">사용자 신고</h3>
          <select
            className="cate1"
            value={reportReason} 
            onChange={(e) => setReportReason(e.target.value)} 
          >
            <option value="">신고 사유 선택</option>
            <option value="1">스팸</option>
            <option value="2">사기</option>
            <option value="3">욕설/비하</option>
            <option value="4">불법 거래</option>
            <option value="5">경매 방해</option>
            <option value="6">기타</option>
          </select>
          <button className="emergency1-button" onClick={handleReportSubmit}>신고 제출</button>
          <button className="cancle-button" onClick={() => setShowReportModal(false)}>취소</button>
        </div>
      )}

      {/* 추가된 입찰 현황 및 입찰 UI */}
      {transactionMethod === 'auction' && (
        <div className="chat-container" style={{ marginTop: '20px' }}>
          {String(product.UserID) !== userId && timeLeft > 0 && (
            <>
              <h1 className="com">입찰</h1>
              <form onSubmit={handleCommentSubmit} className="format-box">
                <textarea
                  className="product-revise-input2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="입찰가를 입력하세요."
                  rows="4"
                  style={{ width: '100%', marginBottom: '10px' }}
                  onKeyPress={handleKeyPress} // 엔터 키 입력 시 댓글 추가 처리s
                />
                <button className="chat-plus-button" type="submit">입찰</button>
              </form>
            </>
          )}

          {(timeLeft > 0 || isAuctionEnded) && comments.length > 0 && (
            <div>
              <h3 className="com2">입찰 현황</h3>
              {comments.map((c, index) => (
                <div key={index} className="comment-item">
                 <p className="price6">{c.userId}, 입찰가: <strong>{c.content}원</strong> {new Date(c.timestamp).toLocaleString()}</p>
                  <button className="emergency-button" onClick={() => {
                    setReportedUserId(c.userId);
                    setShowReportModal(true);
                  }}>
                    신고
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
