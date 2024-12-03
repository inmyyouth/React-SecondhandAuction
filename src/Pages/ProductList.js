import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css'; // Swiper 스타일 추가
import './ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태
  const [selectedTransactionMethod, setSelectedTransactionMethod] = useState(''); // 거래 방식 필터링 상태
  const [categories, setCategories] = useState([]); // 카테고리 목록
  const [selectedCategory, setSelectedCategory] = useState(''); // 선택된 카테고리

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories'); // 카테고리 데이터 API 호출
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // 검색어, 거래 방식, 카테고리 필터링
  const filteredProducts = products.filter((product) => {
    const matchesSearchTerm = product.ProductName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTransactionMethod =
      selectedTransactionMethod === '' || product.TransactionMethod === selectedTransactionMethod;
    const matchesCategory = selectedCategory === '' || product.CategoryID === Number(selectedCategory);

    return matchesSearchTerm && matchesTransactionMethod && matchesCategory;
  });

  return (
    <div className="product-list">
      <div className="reg-box">
        <h1>상품 목록</h1>
      </div>

      {/* 검색, 거래 방식, 카테고리 필터를 같은 행에 배치 */}
      <div className="cate-container">
        {/* 검색 입력 필드 */}
        <input
          className="cate"
          type="text"
          placeholder="상품명을 검색하세요..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 거래 방식 선택 드롭다운 */}
        <select
          className="cate-category"
          value={selectedTransactionMethod}
          onChange={(e) => setSelectedTransactionMethod(e.target.value)}
        >
          <option value="">모든 거래 방식</option>
          <option value="direct">즉시 구매</option>
          <option value="auction">경매</option>
        </select>

        {/* 카테고리 선택 드롭다운 */}
        <select
          className="cate-category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">모든 카테고리</option>
          {categories.map((category) => (
            <option key={category.CategoryID} value={category.CategoryID}>
              {category.CategoryName}
            </option>
          ))}
        </select>
      </div>

      {/* Swiper 컴포넌트 추가 */}
      <Swiper spaceBetween={5} slidesPerView={5} pagination={{ clickable: true }} navigation>
        {filteredProducts.map((product) => (
          <SwiperSlide key={product.ProductID}>
            <div className="product-card">
              <div className="product-image">
                <Link to={`/product/${product.ProductID}`}>
                  <img
                    src={product.ImageURL ? `http://localhost:5000/${product.ImageURL}` : '/images/default-image.jpg'}
                    alt={product.ProductName}
                  />
                </Link>
              </div>
              <h2>
                <Link to={`/product/${product.ProductID}`}>{product.ProductName}</Link>
              </h2>
              <div className="product-info">
                <p>{product.TransactionMethod === 'direct' ? '즉시 구매' : '경매'}</p>
                <p>{product.TransactionMethod === 'direct' ? `${product.Price}원` : '경매 상품'}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {filteredProducts.length === 0 && <p>해당 조건에 맞는 상품이 없습니다.</p>}
    </div>
  );
}

export default ProductList;
