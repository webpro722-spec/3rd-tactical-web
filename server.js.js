const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const http = require('http');

// ================= 디스코드 봇 설정 =================
const BOT_TOKEN = 'MTU2NTY1NzYzMTc5NDc5MDQzMA.GuyXG5.lVzerToN7W-mXhyjI9ibIrwHvfbsF86zSYiwRo';          
const NEW_MEMBER_CHANNEL_ID = '1565689171660636180'; 
const MOVE_LOG_CHANNEL_ID = '1565880892155494501';   

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 데이터 저장용 객체
let stats = {
    inCount: 0,
    outCount: 0,
    retireCount: 0,
    dmcCount: 0,
    ibcCount: 0,
    officers: [],
    ncos: [],
    enlisted: [],
    recentLogs: []
};

// ================= Express 웹서버 설정 =================
const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// HTML 대시보드 페이지 (다른 대원들도 링크로 접속해 볼 수 있는 화면)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>3대대 행정 관리 시스템</title>
            <style>
                body { background-color: #121212; color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
                h1 { color: #4CAF50; text-align: center; }
                .card-container { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
                .card { background: #1e1e1e; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px; text-align: center; }
                .card h3 { margin: 0 0 10px 0; color: #90CAF9; }
                .card p { font-size: 24px; font-weight: bold; margin: 0; }
                .section { background: #1e1e1e; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                ul { padding-left: 20px; }
            </style>
        </head>
        <body>
            <h1>🛡️ 제3대대 반작전대대(DMC/IBC) 실시간 행정 대시보드</h1>
            
            <div class="card-container">
                <div class="card"><h3>전입 (IN)</h3><p id="inCount">0</p></div>
                <div class="card"><h3>전출 (OUT)</h3><p id="outCount">0</p></div>
                <div class="card"><h3>전역/퇴소</h3><p id="retireCount">0</p></div>
                <div class="card"><h3>DMC 인원</h3><p id="dmcCount">0</p></div>
                <div class="card"><h3>IBC 인원</h3><p id="ibcCount">0</p></div>
            </div>

            <div class="section">
                <h2>📋 실시간 로그 및 현황</h2>
                <ul id="logList"></ul>
            </div>

            <script>
                async function fetchData() {
                    try {
                        const res = await fetch('/api/stats');
                        const data = await res.json();
                        
                        document.getElementById('inCount').innerText = data.inCount;
                        document.getElementById('outCount').innerText = data.outCount;
                        document.getElementById('retireCount').innerText = data.retireCount;
                        document.getElementById('dmcCount').innerText = data.dmcCount;
                        document.getElementById('ibcCount').innerText = data.ibcCount;

                        const logList = document.getElementById('logList');
                        logList.innerHTML = data.recentLogs.map(log => \`<li>\${log}</li>\`).join('');
                    } catch (e) {
                        console.error('데이터 동기화 실패:', e);
                    }
                }
                setInterval(fetchData, 5000);
                fetchData();
            </script>
        </body>
        </html>
    `);
});

// 5초마다 프론트엔드에 데이터를 제공하는 API 엔드포인트
app.get('/api/stats', (req, res) => {
    res.json(stats);
});

// ================= 디스코드 봇 이벤트 =================
client.once('ready', () => {
    console.log(`🤖 디스코드 봇 로그인 성공: ${client.user.tag}`);
});

// 새 전입 및 이동 로그 채널 메시지 파싱
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content;
    const channelId = message.channel.id;

    if (channelId === NEW_MEMBER_CHANNEL_ID) {
        stats.inCount++;
        stats.recentLogs.unshift(`[전입] ${message.author.tag}: ${content}`);
        if (stats.recentLogs.length > 20) stats.recentLogs.pop();
    } else if (channelId === MOVE_LOG_CHANNEL_ID) {
        if (content.includes('전출')) stats.outCount++;
        if (content.includes('전역') || content.includes('퇴소')) stats.retireCount++;
        stats.recentLogs.unshift(`[이동로그] ${message.author.tag}: ${content}`);
        if (stats.recentLogs.length > 20) stats.recentLogs.pop();
    }
});

// 웹서버 및 봇 동시 구동
server.listen(PORT, () => {
    console.log(`🌐 웹서버 구동 완료: http://localhost:${PORT}`);
    client.login(BOT_TOKEN);
});