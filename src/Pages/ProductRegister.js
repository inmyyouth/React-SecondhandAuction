import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // UserContext에서 userId 가져오기
import axios from 'axios'; // Axios for sending the request
import './ProductRegister.css'

function Register() {
  const { userId } = useUser(); // 로그인된 사용자 ID 가져오기
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState(null); // 이미지 상태를 하나로 수정
  const [saleMethod, setSaleMethod] = useState('direct');
  const [productPrice, setProductPrice] = useState(''); // 직접 판매 가격
  const [startingPrice, setStartingPrice] = useState(''); // 시작 가격 상태 추가
  const [categories, setCategories] = useState([]); // 카테고리 상태 추가
  const [selectedCategory, setSelectedCategory] = useState(null); // 선택된 카테고리 상태 추가
  const navigate = useNavigate(); // useNavigate 훅 사용

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories'); // 카테고리 API 호출
        if (!response.ok) {
          throw new Error('카테고리 불러오기 실패');
        }
        const data = await response.json();
        setCategories(data); // 카테고리 데이터 설정
      } catch (error) {
        console.error(error);
        alert('카테고리 불러오기 오류');
      }
    };

    fetchCategories(); // 컴포넌트 마운트 시 카테고리 불러오기
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProductImage(file); // 선택된 파일을 상태로 설정
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId); // 선택된 카테고리 ID 설정
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (!productImage) {
      alert('상품 이미지를 선택해주세요.');
      return;
    }

    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // Create FormData to hold all the product data, including the image file
      const formData = new FormData();
      formData.append('productName', productName);
      formData.append('productDescription', productDescription);
      formData.append('productPrice', saleMethod === 'direct' ? productPrice : startingPrice);
      formData.append('transactionMethod', saleMethod);
      formData.append('categoryID', selectedCategory);
      formData.append('userID', userId);
      formData.append('image', productImage); // Image file

      // Send the FormData to the server
      const response = await axios.post('http://localhost:5000/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('상품이 성공적으로 등록되었습니다!');
      navigate('/products'); // 페이지 이동
    } catch (error) {
      console.error(error);
      alert('상품 등록에 실패했습니다.');
    }
  };

  return (
    <div className="register-container">
      <div className="reg-box">
        <h1> 판매 상품 등록 </h1>
        </div>
        <form className="register-form" onSubmit={handleSubmit}>
          {/* 상품명 입력 */}
          <div className="input-group">
            <label className="name" htmlFor="name">상품명</label>
            <input
            className="box-group"
              type="text"
              id="name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

        {/* 상품 설명 입력 */}
          <div className="input-group">
            <label className="name" htmlFor="description">상품 설명</label>
            <textarea
            className="box-group"
              id="description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              required
            />
          </div>

        {/* 상품 이미지 입력 */}
          <div className="input-group">
            <label className="name" htmlFor="image">상품 이미지</label>
            <input
            className="box-group"
            button="file-upload-button"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {productImage && ( // 이미지 미리보기 조건부 렌더링
              <div>
                <h3>미리보기 </h3>
                <img
                  src={URL.createObjectURL(productImage)} // Blob URL 생성
                  alt="상품 미리보기"
                  style={{ width: '200px', height: 'auto' }} // 스타일 조정
                />
              </div>
            )}
        </div>

        {/* 카테고리 선택 부분 */}
        <div className="input-group">
            <label htmlFor="category" className="input-label"  ><h4>카테고리 선택</h4></label>
            <select className="cate" onChange={(e) => handleCategoryChange(e.target.value)} value={selectedCategory}>
                <option value="">카테고리를 선택하세요</option>
                {categories.map((category) => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                        {category.CategoryName}
                    </option>
                ))}
            </select>
        </div>

        {/* 판매 방법 선택 */}
        <div className="input-group">
            <label className="input-label"><h4>판매 방법</h4></label>
            <div className="sale-method">
              <div
                className={`method-button ${saleMethod === 'direct' ? 'selected' : ''}`}
                onClick={() => setSaleMethod('direct')}
              >
                가격 제시
              </div>
              <div
                className={`method-button ${saleMethod === 'auction' ? 'selected' : ''}`}
                onClick={() => setSaleMethod('auction')}
              >
                경매
              </div>
            </div>
          </div>

          {saleMethod === 'direct' && (
            <div >
            <p  className="nanum" style={{ color: 'red', fontWeight: 'bold' }}>
            나눔인 경우 판매 금액을 0원으로 설정하고 <br/>설명란에 나눔으로 표시해주세요.</p>

            <div className="input-group">
              <label className="name" htmlFor="startingPrice">가격</label>
              <input
                className="box-group"
                type="number"
                id="startingPrice"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
              />
            </div>
            </div>
        )}

        

        {saleMethod === 'auction' && (
          <div>
            <p className="nanum" style={{ color: 'red', fontWeight: 'bold' }}>
              등록 시 경매가 시작되고 수정,삭제가 불가능합니다. <br/>
              주의해서 작성해주세요.
            </p>

            <div className="input-group">
            <label className="name" htmlFor="startingPrice">시작 가격</label>
            <input
              className="box-group"
              type="number"
              id="startingPrice"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              min="100" // 최소 시작 가격 설정
            />
          </div>
          </div>
        )}

        <button  type="submit">등록</button>
      </form>
    </div>
  );
}

export default Register;
