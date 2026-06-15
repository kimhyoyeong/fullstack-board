const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// CORS(Cross-Origin Resource Sharing)
// 다른 Origin(도메인, 포트)에서 API 호출을 허용하기 위한 라이브러리
// 현재는
// Frontend : localhost:3000
// Backend  : localhost:3001
// 이므로 브라우저가 기본적으로 차단함
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

// 모든 Origin 요청 허용
// 실무에서는 특정 도메인만 허용하는 경우가 많음
app.use(cors());

// JSON 형태의 요청 body를 읽기 위해 사용
app.use(express.json());

/**
 * 서버 상태 확인용 API
 * GET http://localhost:3001/
 */
app.get('/', (req, res) => {
  res.send('Hello FullStack');
});

/**
 * 전체 사용자 조회
 * GET http://localhost:3001/users
 */
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();

  res.json(users);
});

/**
 * 회원가입 API
 * POST http://localhost:3001/users
 *
 * 요청 예시
 * {
 *   "email": "test@test.com",
 *   "password": "1234",
 *   "name": "김효영"
 * }
 */
app.post('/users', async (req, res) => {
  const { email, password, name } = req.body;

  // 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  res.json(user);
});

/**
 * 로그인 API
 * POST http://localhost:3001/login
 *
 * 요청 예시
 * {
 *   "email": "test@test.com",
 *   "password": "1234"
 * }
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 이메일로 사용자 조회
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // 사용자가 없는 경우
  if (!user) {
    return res.status(401).json({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  }

  // 입력한 비밀번호와 DB 비밀번호 비교
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  // 비밀번호 불일치
  if (!isPasswordValid) {
    return res.status(401).json({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  }

  // JWT 생성
  // userId, email 정보를 토큰에 담음
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    'my-secret-key',
    {
      expiresIn: '1h',
    }
  );

  res.json({
    message: '로그인 성공',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * 서버 실행
 * localhost:3001
 */
app.listen(3001, () => {
  console.log('Server Running');
});

