CREATE DATABASE IF NOT EXISTS DDW;
USE DDW;

-- User Table
CREATE TABLE User (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Email VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Major VARCHAR(45)
);

-- Category Table
CREATE TABLE Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL
);

INSERT INTO Category (CategoryName) VALUES
('디지털기기'),
('생활가전'),
('가구/인테리어'),
('생활/주방'),
('유아동'),
('유아도서'),
('여성의류'),
('여성잡화'),
('남성패션/잡화'),
('뷰티/미용'),
('스포츠/레저'),
('취미/게임/음반'),
('도서'),
('티켓/교환권'),
('가공식품'),
('건강기능식품'),
('반려동물용품'),
('식물'),
('기타 중고물품');

-- Product Table
CREATE TABLE Product (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    Description TEXT,
    Price INT,
    LastPrice INT,
    UserID INT,
    CategoryID INT,
    RegistrationDate DATETIME,
    ImageURL VARCHAR(255),
    TransactionMethod VARCHAR(50),
    Status VARCHAR(50), 
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ChatRoom Table
CREATE TABLE ChatRoom (
    ChatRoomID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    SellerID INT,
    BuyerID INT,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SellerID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (BuyerID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Chat Table
CREATE TABLE Chat (
    ChatID INT AUTO_INCREMENT PRIMARY KEY,
    ChatRoomID INT,
    SenderID INT,
    Message TEXT,
    Timestamp DATETIME,
    FOREIGN KEY (ChatRoomID) REFERENCES ChatRoom(ChatRoomID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SenderID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Comment Table
CREATE TABLE Comment (
    CommentID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    UserID INT,
    Comment INT NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Transaction Table
CREATE TABLE Transaction (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    BuyerID INT,
    SellerID INT,
    ProductID INT,
    TransactionDate DATETIME,
    FOREIGN KEY (BuyerID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SellerID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- BlackListReason Table
CREATE TABLE BlackListReason (
    ReasonID INT AUTO_INCREMENT PRIMARY KEY,
    Reason VARCHAR(255) NOT NULL
);

-- BlackList
INSERT INTO BlackListReason (Reason) VALUES
('스팸'),
('사기'),
('욕설/비하'),
('불법 거래'),
('경매 방해'),
('기타');

-- BlackList Table
CREATE TABLE BlackList (
    BlackListID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    ReasonID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ReasonID) REFERENCES BlackListReason(ReasonID) ON DELETE CASCADE ON UPDATE CASCADE
);
