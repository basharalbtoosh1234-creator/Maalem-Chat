const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

// زيادة حد استيعاب البيانات بالسيرفر (عشان يدعم رفع الصور الكبيرة بالمحادثات يا معلم)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname)));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

let connectedUsersMap = {}; // تخزين اليوزر مع Socket ID الخاص به للوصول الدقيق

io.on('connection', (socket) => {
    console.log('🔗 يا معلم، اتصال جديد بالـ Socket: ' + socket.id);

    socket.on('join_user', (username) => {
        socket.username = username;
        connectedUsersMap[username] = socket.id; // ربط اليوزر بـ socket id الخاص به للإشعارات الدقيقة
        
        io.emit('update_users', Object.keys(connectedUsersMap));
        console.log(`👤 يا معلم، المستخدم [${username}] سجل دخوله بنجاح.`);
    });

    socket.on('send_message', (data) => {
        // دعم إرسال الرسائل النصية والصور بكل احترافية
        io.emit('receive_message', data);
    });

    // توجيه طلب الصداقة للمستخدم المطلوب بدقة بناءً على اسمه المستعار
    socket.on('send_friend_request', (data) => {
        const targetSocketId = connectedUsersMap[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('friend_request', { from: data.from });
            console.log(`📨 يا معلم، طلب صداقة من ${data.from} إلى ${data.to}`);
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete connectedUsersMap[socket.username];
            io.emit('update_users', Object.keys(connectedUsersMap));
            console.log(`❌ يا معلم، المستخدم [${socket.username}] غادر التطبيق.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 يا معلم، السيرفر شغال بدقة على البورت: ${PORT}`);
});