// 安装第三方请求库（或使用原生的 Fetch API），本例中使用 axios
// npm install axios

// 通过 OAuth2 获取 Linux Do 用户信息的参考流程
const axios = require('axios');
const readline = require('readline');

// 配置信息（建议通过环境变量配置，避免使用硬编码）
const CLIENT_ID = '你的 Client ID';
const CLIENT_SECRET = '你的 Client Secret';
const REDIRECT_URI = '你的回调地址';
const AUTH_URL = 'https://connect.linux.do/oauth2/authorize';
const TOKEN_URL = 'https://connect.linux.do/oauth2/token';
const USER_INFO_URL = 'https://connect.linux.do/api/user';

// 第一步：生成授权 URL
function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user'
  });

  return `${AUTH_URL}?${params.toString()}`;
}

// 第二步：获取 code 参数
function getCode() {
  return new Promise((resolve) => {
    // 本例中使用终端输入来模拟流程，仅供本地测试
    // 请在实际应用中替换为真实的处理逻辑
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('从回调 URL 中提取出 code，粘贴到此处并按回车：', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// 第三步：使用 code 参数获取访问令牌
async function getAccessToken(code) {
  try {
    const form = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    const response = await axios.post(TOKEN_URL, form, {
      // 提醒：需正确配置请求头，否则无法正常获取访问令牌
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`获取访问令牌失败：${error.response ? JSON.stringify(error.response.data) : error.message}`);
    throw error;
  }
}

// 第四步：使用访问令牌获取用户信息
async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error(`获取用户信息失败：${error.response ? JSON.stringify(error.response.data) : error.message}`);
    throw error;
  }
}

// 主流程
async function main() {
  // 1. 生成授权 URL，前端引导用户访问授权页
  const authUrl = getAuthUrl();
  console.log(`请访问此 URL 授权：${authUrl}
`);

  // 2. 用户授权后，从回调 URL 获取 code 参数
  const code = await getCode();

  try {
    // 3. 使用 code 参数获取访问令牌
    const tokenData = await getAccessToken(code);
    const accessToken = tokenData.access_token;

    // 4. 使用访问令牌获取用户信息
    if (accessToken) {
      const userInfo = await getUserInfo(accessToken);
      console.log(`
获取用户信息成功：${JSON.stringify(userInfo, null, 2)}`);
    } else {
      console.log(`
获取访问令牌失败：${JSON.stringify(tokenData)}`);
    }
  } catch (error) {
    console.error('发生错误：', error);
  }
}

main();