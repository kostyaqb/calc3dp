# 1. Создание файла .env в корне
nano .env

ADMIN_PASSWORD=ваш_секретный_пароль
SESSION_SECRET=любая_случайная_строка_для_подписи_куки

# 2. Инициализируем проект
npm init -y

# 3. Устанавливаем все необходимые зависимости
npm install express express-session dotenv

# 4. Запускаем сервер
node server.js
