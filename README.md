# Lcode Image

[中文](#中文) | [English](#english) | [日本語](#日本語)

---

# 中文

## 项目简介

**Lcode Image** 是一个面向日常创作与轻量分享的公益 AI 图片生成站。  
它提供了一个完整的前后端项目，支持游客生成、用户注册登录、个人令牌配置、管理员后台配置、首页示例图轮换、邀请码注册、邮箱验证码，以及图片历史记录与自动清理。

如果你准备二次开发、私有部署，或者直接开源发布，这个项目已经具备比较完整的基础能力。

> Maintained by **lcode**.

## 主要作用

这个网站主要用于：

- 把自然语言提示词生成图片
- 支持上传参考图进行编辑/图生图
- 支持游客模式和登录用户模式
- 支持用户保存自己的图片 API 地址与个人身份令牌
- 支持管理员统一配置共享图片接口
- 支持注册开关、邀请码策略、邮箱验证码注册
- 支持首页每日自动轮换“示例灵感”图片
- 支持图片历史记录与 3 天自动过期清理

## 功能特性

### 用户侧

- 首页展示站点介绍、统计信息、示例灵感图、ECharts 图表
- 开始生成页支持：
  - 文生图
  - 上传参考图后编辑图片
  - 当前会话消息保留
  - 历史记录复用提示词
- 用户注册 / 登录
- 邮箱验证码注册
- 可选邀请码注册
- 登录后保存个人：
  - 图片 API 地址
  - 个人身份令牌
- 查看和删除自己的历史图片
- 成功操作淡色提示弹窗

### 管理员侧

- 管理员登录后台
- 配置共享图片 API 地址
- 配置共享身份令牌
- 配置站点 URL
- 配置 QQ 邮箱 SMTP 发信能力
- 测试上游图片接口
- 配置是否允许注册
- 配置是否必须邀请码注册
- 一键生成邀请码
- 查看邀请码使用情况
- 用户列表与管理员重置密码、封禁/解封用户
- 配置每日单 IP 限流
- 配置自动清理 Cron
- 手动清理过期图片
- 管理首页示例灵感池

### 系统能力

- SQLite 持久化存储
- 本地保存生成图片文件
- 图片默认保留 3 天
- 定时清理过期图片
- 每日 0 点自动刷新首页示例图
- JWT 用户与管理员鉴权
- 对敏感令牌做加密存储

## 技术栈

### 前端

- Vue 3
- Vue Router
- Pinia
- Axios
- ECharts
- Vite
- Playwright（已安装，可继续补自动化测试）

### 后端

- Node.js
- Express
- better-sqlite3
- bcryptjs
- jsonwebtoken
- multer
- nodemailer
- node-cron
- axios

## 项目结构

```text
image2-ui/
├─ frontend/                # Vue 前端
│  ├─ public/               # 静态资源
│  ├─ src/
│  │  ├─ components/        # 组件
│  │  ├─ pages/             # 页面
│  │  ├─ stores/            # Pinia 状态管理
│  │  ├─ api/               # 前端请求封装
│  │  ├─ router/            # 路由
│  │  └─ styles/            # 样式与主题变量
│  └─ package.json
├─ backend/                 # Express 后端
│  ├─ src/
│  │  ├─ controllers/       # 控制器
│  │  ├─ routes/            # 路由
│  │  ├─ services/          # 核心服务
│  │  ├─ middleware/        # 中间件
│  │  ├─ db/                # SQLite 与 schema
│  │  └─ config/            # 环境配置
│  ├─ uploads/              # 本地图片存储目录（运行后生成）
│  ├─ data.sqlite           # SQLite 数据库（运行后生成）
│  └─ package.json
├─ lcode-image-logo.png     # 项目 logo
└─ README.md
```

## 使用了什么接口 / 兼容什么上游

这个项目当前不是绑定某一家平台的网页控制台，而是面向 **OpenAI 风格图片接口** 的上游服务。

当前后端默认配置支持：

- 文生图接口：`/v1/images/generations`
- 图像编辑接口：`/v1/images/edits`
- 健康检查接口：`/health`
- 默认模型：`gpt-image-2`

也就是说，只要你的上游服务兼容类似的 OpenAI 图片生成协议，这个项目通常就可以接入。

默认相关配置位于：

- `backend/.env`
- `backend/src/config/env.js`
- `backend/src/services/chatgptSessionService.js`

## 环境要求

建议环境：

- Node.js 18+
- npm 9+
- macOS / Linux / Windows 均可

## 本地开发

### 1. 安装依赖

前端：

```bash
cd frontend
npm install
```

后端：

```bash
cd backend
npm install
```

### 2. 配置后端环境变量

在 `backend/` 下创建或修改 `.env`：

```env
PORT=3001
JWT_SECRET=change-this-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ENCRYPTION_SECRET=change-this-encryption-secret-32
FRONTEND_BASE_URL=http://127.0.0.1:5173

IMAGE2_API_BASE_URL=
IMAGE2_API_GENERATE_PATH=/v1/images/generations
IMAGE2_API_EDIT_PATH=/v1/images/edits
IMAGE2_API_TEST_PATH=/health
IMAGE2_API_MODEL=gpt-image-2
IMAGE2_API_SIZE=1024x1024
IMAGE2_API_QUALITY=hd
IMAGE2_API_COUNT=1
IMAGE2_API_STYLE=

DEFAULT_DAILY_LIMIT=20
DEFAULT_CLEANUP_CRON=0 * * * *

EMAIL_SMTP_HOST=smtp.qq.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
EMAIL_SENDER=
EMAIL_AUTH_USER=
EMAIL_AUTH_PASS=
```

### 3. 启动后端

```bash
cd backend
npm run dev
```

默认后端地址：

- `http://127.0.0.1:3001`

### 4. 启动前端

```bash
cd frontend
npm run dev
```

默认前端地址：

- `http://127.0.0.1:5173`

## 生产部署

## 部署方式概览

通常建议这样部署：

- **前端**：构建成静态文件，放到 Nginx / Caddy / Vercel / Netlify
- **后端**：Node.js 常驻运行，建议用 PM2 / systemd / Docker
- **数据库**：默认 SQLite，适合中小型自托管场景
- **图片文件**：默认保存在后端本地 `backend/uploads/`

---

### 方案一：传统服务器部署

#### 前端构建

```bash
cd frontend
npm install
npm run build
```

构建结果输出到：

- `frontend/dist`

你可以把它托管到 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/lcode-image/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 后端启动

```bash
cd backend
npm install
npm run start
```

建议使用 PM2：

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name lcode-image-backend
pm2 save
pm2 startup
```

#### 反向代理 API 与上传文件

示例 Nginx：

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

前端部署时记得配置：

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

---

### 方案二：Docker 部署

仓库现在已内置最小可用 Docker 打包，默认可以直接一条命令启动：

- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `backend/Dockerfile`
- `docker-compose.yml`

直接在项目根目录执行：

```bash
docker compose up --build -d
```

启动后默认地址：

- 前端：`http://127.0.0.1:8080`
- 后端 API：`http://127.0.0.1:3002/api`
- 后端健康检查：`http://127.0.0.1:3002/health`

默认持久化方式：

- `./backend/data.sqlite` → 容器内 `/app/data.sqlite`
- `./backend/uploads` → 容器内 `/app/uploads`

默认会直接读取：

- `backend/.env.example`

如果你准备正式部署，建议至少先把下面这些值改掉再启动：

- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `ENCRYPTION_SECRET`
- `IMAGE2_API_BASE_URL`（如果你要接真实上游）
- `CORS_ORIGINS`（如你修改了前端访问地址）

常用命令：

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

如果你修改了前端公开地址，记得同步修改：

- `docker-compose.yml` 里的 `FRONTEND_BASE_URL`
- `docker-compose.yml` 里的 `CORS_ORIGINS`
- 前端构建参数 `VITE_API_BASE_URL`（如果后端暴露地址也变了）

---

## 开源前建议

如果你准备公开仓库，建议先做这些处理：

1. **不要提交真实 `.env`**
2. 提供 `.env.example`
3. 修改默认管理员密码，不要保留 `admin123`
4. 确保没有真实：
   - API token
   - SMTP 授权码
   - 私人站点地址
   - 邮箱账号
5. 给 `backend/uploads/`、`backend/data.sqlite` 加 `.gitignore`
6. 补充 License
7. 补充截图与演示地址

## 默认路由

前端主要页面：

- `/` 首页
- `/login` 用户登录 / 注册
- `/create` 开始生成
- `/history` 历史记录
- `/admin/login` 管理员登录
- `/admin` 管理后台

## 管理员初始化说明

首次部署后：

1. 用 `.env` 中的管理员账号登录后台
2. 配置：
   - 图片 API 地址
   - 共享身份令牌
   - 站点 URL
3. 如需邮箱注册：
   - 配置 QQ 邮箱 SMTP 发信账号与授权码
4. 如需邀请码机制：
   - 开启邀请码注册
   - 生成邀请码
5. 配置首页示例灵感池

## 数据说明

默认使用 SQLite，主要表包括：

- `admin_settings`
- `users`
- `user_profiles`
- `generated_images`
- `featured_prompts`
- `featured_examples`
- `email_verification_codes`
- `invite_codes`

定义位于：

- `backend/src/db/schema.sql`

## 安全说明

当前项目已具备这些基础安全能力：

- 管理员 / 用户 JWT 鉴权
- 密码 bcrypt hash 存储
- 部分敏感配置加密存储
- 注册策略与邀请码控制
- 单 IP 限流
- 提示词校验

但如果你用于正式公网生产环境，仍建议继续增强：

- 更严格的 CORS 白名单
- HTTPS
- 更强的管理员密码策略
- CSRF / abuse 防护
- 日志审计
- 备份策略

## 测试与构建

前端：

```bash
cd frontend
npm run build
```

后端开发：

```bash
cd backend
npm run dev
```

后端生产：

```bash
cd backend
npm run start
```

## 项目作者

Open source project by **lcode**.

License:

- MIT

如果你公开发布，可以在这里补充：

- GitHub 仓库地址
- 演示站地址
- Issue / PR 贡献指南

---

# English

## Overview

**Lcode Image** is a public-interest AI image generation website built for lightweight creation, preview, and sharing.  
It includes a complete frontend and backend stack with guest generation, user accounts, personal token settings, admin configuration, rotating featured examples, invite-code registration, email verification, image history, and automatic cleanup.

This project is suitable for self-hosting, open-source release, and further customization.

> Maintained by **lcode**.

## Main Purpose

This site is mainly used to:

- Generate images from text prompts
- Edit images with uploaded reference images
- Support both guest mode and logged-in user mode
- Let users save their own image API base URL and personal token
- Let admins manage a shared upstream image API
- Control registration, invite code policy, and email verification
- Automatically rotate the homepage featured example image every day
- Keep image history and automatically clean expired files

## Features

### User Features

- Landing page with intro, public statistics, featured example, and ECharts charts
- Create page with:
  - text-to-image
  - image editing with file upload
  - persisted in-page conversation messages
  - prompt reuse from history
- User registration and login
- Email verification for registration
- Optional invite-code-based registration
- Logged-in users can save:
  - personal image API base URL
  - personal access token
- View and delete personal history images
- Soft success toasts for completed actions

### Admin Features

- Admin login
- Configure shared image API base URL
- Configure shared access token
- Configure site base URL
- Configure QQ Mail SMTP service
- Test upstream image API
- Enable or disable registration
- Require or disable invite code registration
- Bulk-generate invite codes
- View invite code usage
- View users and reset user passwords
- Configure per-IP daily limits
- Configure automatic cleanup cron
- Manually clean expired images
- Manage homepage featured prompt pool

### System Features

- SQLite persistence
- Local file storage for generated images
- 3-day default retention period
- Scheduled cleanup for expired images
- Daily featured example refresh at 00:00
- JWT-based user and admin authentication
- Encrypted storage for sensitive tokens

## Tech Stack

### Frontend

- Vue 3
- Vue Router
- Pinia
- Axios
- ECharts
- Vite
- Playwright

### Backend

- Node.js
- Express
- better-sqlite3
- bcryptjs
- jsonwebtoken
- multer
- nodemailer
- node-cron
- axios

## Architecture

```text
image2-ui/
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ stores/
│  │  ├─ api/
│  │  ├─ router/
│  │  └─ styles/
│  └─ package.json
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ middleware/
│  │  ├─ db/
│  │  └─ config/
│  ├─ uploads/
│  ├─ data.sqlite
│  └─ package.json
├─ lcode-image-logo.png
└─ README.md
```

## Upstream API Compatibility

This project is designed around an **OpenAI-style image API**, rather than a specific vendor dashboard.

The current backend supports these defaults:

- generation endpoint: `/v1/images/generations`
- edit endpoint: `/v1/images/edits`
- health check endpoint: `/health`
- default model: `gpt-image-2`

That means any upstream service implementing a compatible OpenAI-style image API can usually be connected.

Relevant configuration:

- `backend/.env`
- `backend/src/config/env.js`
- `backend/src/services/chatgptSessionService.js`

## Requirements

Recommended environment:

- Node.js 18+
- npm 9+

## Local Development

### Install dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

### Configure environment variables

Create or edit `backend/.env`:

```env
PORT=3001
JWT_SECRET=change-this-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ENCRYPTION_SECRET=change-this-encryption-secret-32
FRONTEND_BASE_URL=http://127.0.0.1:5173

IMAGE2_API_BASE_URL=
IMAGE2_API_GENERATE_PATH=/v1/images/generations
IMAGE2_API_EDIT_PATH=/v1/images/edits
IMAGE2_API_TEST_PATH=/health
IMAGE2_API_MODEL=gpt-image-2
IMAGE2_API_SIZE=1024x1024
IMAGE2_API_QUALITY=hd
IMAGE2_API_COUNT=1
IMAGE2_API_STYLE=

DEFAULT_DAILY_LIMIT=20
DEFAULT_CLEANUP_CRON=0 * * * *

EMAIL_SMTP_HOST=smtp.qq.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
EMAIL_SENDER=
EMAIL_AUTH_USER=
EMAIL_AUTH_PASS=
```

### Start backend

```bash
cd backend
npm run dev
```

### Start frontend

```bash
cd frontend
npm run dev
```

## Production Deployment

### Recommended setup

A common production setup is:

- **Frontend**: build static assets and serve with Nginx / Caddy / Vercel / Netlify
- **Backend**: run Node.js with PM2 / systemd / Docker
- **Database**: SQLite by default
- **Uploads**: local backend storage in `backend/uploads/`

### Frontend build

```bash
cd frontend
npm install
npm run build
```

Build output:

- `frontend/dist`

Example Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/lcode-image/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Backend run

```bash
cd backend
npm install
npm run start
```

Using PM2:

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name lcode-image-backend
pm2 save
pm2 startup
```

### Reverse proxy example

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

For frontend builds, set:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

### Docker deployment

This repository now includes a minimal Docker setup that can be started with a single command:

- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `backend/Dockerfile`
- `docker-compose.yml`

Run this from the project root:

```bash
docker compose up --build -d
```

Default addresses after startup:

- Frontend: `http://127.0.0.1:8080`
- Backend API: `http://127.0.0.1:3002/api`
- Backend health check: `http://127.0.0.1:3002/health`

Default persistence mapping:

- `./backend/data.sqlite` → `/app/data.sqlite`
- `./backend/uploads` → `/app/uploads`

By default, Docker Compose reads:

- `backend/.env.example`

Before a real deployment, it is recommended to change at least:

- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `ENCRYPTION_SECRET`
- `IMAGE2_API_BASE_URL` (if you want to use a real upstream image API)
- `CORS_ORIGINS` (if you change the frontend public URL)

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

If you change the public frontend address, also update:

- `FRONTEND_BASE_URL` in `docker-compose.yml`
- `CORS_ORIGINS` in `docker-compose.yml`
- `VITE_API_BASE_URL` build arg if the backend public address also changes

## Open-Source Preparation Checklist

Before publishing the repository, it is recommended to:

1. Remove any real `.env` values
2. Add `.env.example`
3. Change the default admin password
4. Make sure no real secrets are committed
5. Ignore `backend/uploads/` and `backend/data.sqlite`
6. Add a license
7. Add screenshots and a demo URL

## Routes

Main frontend routes:

- `/` landing page
- `/login` user login / register
- `/create` image generation page
- `/history` history page
- `/admin/login` admin login
- `/admin` admin dashboard

## Database Tables

Main SQLite tables:

- `admin_settings`
- `users`
- `user_profiles`
- `generated_images`
- `featured_prompts`
- `featured_examples`
- `email_verification_codes`
- `invite_codes`

Defined in:

- `backend/src/db/schema.sql`

## Security Notes

Current built-in security basics:

- JWT auth for users and admins
- bcrypt password hashing
- encrypted storage for sensitive tokens
- registration policy and invite code control
- per-IP rate limiting
- prompt validation

For public production usage, further hardening is still recommended:

- stricter CORS policy
- HTTPS
- stronger admin password policy
- abuse protection
- audit logs
- backups

## Scripts

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

Backend:

```bash
cd backend
npm run dev
npm run start
```

## Author

Open source project by **lcode**.

License:

- MIT

You can also add:

- GitHub repository URL
- Demo URL
- Contribution guide

---

# 日本語

## 概要

**Lcode Image** は、軽量な制作・共有・プレビュー向けに作られた公益系 AI 画像生成サイトです。  
フロントエンドとバックエンドを含む完全な構成で、ゲスト生成、ユーザー登録・ログイン、個人トークン設定、管理画面、日替わり注目画像、招待コード登録、メール認証、履歴管理、自動削除を備えています。

自己ホスト、二次開発、OSS 公開に向いています。

> Maintained by **lcode**.

## 主な用途

このサイトの主な用途は次の通りです：

- テキストプロンプトから画像を生成する
- 参照画像をアップロードして画像編集を行う
- ゲスト利用とログイン利用の両方をサポートする
- ユーザーごとの API URL と個人トークンを保存する
- 管理者が共通の上流画像 API を管理する
- 登録可否、招待コード必須設定、メール認証を制御する
- トップページの注目サンプル画像を毎日自動更新する
- 履歴画像を保存し、期限切れファイルを自動削除する

## 機能一覧

### ユーザー機能

- トップページに紹介、統計、注目サンプル、ECharts グラフを表示
- 生成ページで：
  - テキストから画像生成
  - 参照画像アップロードによる画像編集
  - 現在の会話状態を保持
  - 履歴からプロンプト再利用
- ユーザー登録 / ログイン
- メール認証付き登録
- 招待コード登録（任意 / 必須設定対応）
- ログイン後に個人設定を保存：
  - 画像 API URL
  - 個人アクセストークン
- 自分の履歴画像の閲覧と削除
- 成功操作用の淡色トースト通知

### 管理者機能

- 管理者ログイン
- 共通画像 API URL 設定
- 共通アクセストークン設定
- サイト URL 設定
- QQ メール SMTP 設定
- 上流 API 接続テスト
- 新規登録の有効 / 無効切り替え
- 招待コード必須設定
- 招待コード一括生成
- 招待コード使用状況確認
- ユーザー一覧とパスワード再設定
- IP 単位の 1 日制限設定
- 自動削除 Cron 設定
- 期限切れ画像の手動削除
- トップページ注目プロンプト管理

### システム機能

- SQLite 永続化
- 生成画像のローカル保存
- 画像の保持期間はデフォルト 3 日
- 期限切れ画像の定期削除
- 毎日 0:00 の注目画像更新
- JWT 認証
- 機密トークンの暗号化保存

## 技術スタック

### フロントエンド

- Vue 3
- Vue Router
- Pinia
- Axios
- ECharts
- Vite
- Playwright

### バックエンド

- Node.js
- Express
- better-sqlite3
- bcryptjs
- jsonwebtoken
- multer
- nodemailer
- node-cron
- axios

## API 互換性

このプロジェクトは **OpenAI 風の画像生成 API** を前提に設計されています。

現在の既定設定：

- 生成エンドポイント：`/v1/images/generations`
- 編集エンドポイント：`/v1/images/edits`
- ヘルスチェック：`/health`
- 既定モデル：`gpt-image-2`

つまり、同様の OpenAI 互換画像 API を提供する上流サービスであれば、通常は接続可能です。

## ローカル開発

### 依存関係のインストール

フロントエンド：

```bash
cd frontend
npm install
```

バックエンド：

```bash
cd backend
npm install
```

### 環境変数設定

`backend/.env` を作成または編集します：

```env
PORT=3001
JWT_SECRET=change-this-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ENCRYPTION_SECRET=change-this-encryption-secret-32
FRONTEND_BASE_URL=http://127.0.0.1:5173

IMAGE2_API_BASE_URL=
IMAGE2_API_GENERATE_PATH=/v1/images/generations
IMAGE2_API_EDIT_PATH=/v1/images/edits
IMAGE2_API_TEST_PATH=/health
IMAGE2_API_MODEL=gpt-image-2
IMAGE2_API_SIZE=1024x1024
IMAGE2_API_QUALITY=hd
IMAGE2_API_COUNT=1
IMAGE2_API_STYLE=

DEFAULT_DAILY_LIMIT=20
DEFAULT_CLEANUP_CRON=0 * * * *

EMAIL_SMTP_HOST=smtp.qq.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
EMAIL_SENDER=
EMAIL_AUTH_USER=
EMAIL_AUTH_PASS=
```

### 起動

バックエンド：

```bash
cd backend
npm run dev
```

フロントエンド：

```bash
cd frontend
npm run dev
```

## 本番デプロイ

推奨構成：

- **フロントエンド**：静的ビルドして Nginx / Caddy / Vercel / Netlify で配信
- **バックエンド**：Node.js を PM2 / systemd / Docker で常駐
- **DB**：SQLite
- **画像保存**：`backend/uploads/`

### フロントエンドビルド

```bash
cd frontend
npm install
npm run build
```

出力先：

- `frontend/dist`

### バックエンド起動

```bash
cd backend
npm install
npm run start
```

PM2 例：

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name lcode-image-backend
pm2 save
pm2 startup
```

## OSS 公開前の推奨事項

1. 実際の `.env` 値を削除する
2. `.env.example` を用意する
3. デフォルト管理者パスワードを変更する
4. 実トークンや SMTP 認証情報を含めない
5. `backend/uploads/` と `backend/data.sqlite` を ignore する
6. License を追加する
7. スクリーンショットやデモ URL を追加する

## ルート

- `/` トップページ
- `/login` ユーザーログイン / 登録
- `/create` 画像生成ページ
- `/history` 履歴ページ
- `/admin/login` 管理者ログイン
- `/admin` 管理画面

## 作者

Open source project by **lcode**.
