#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Установка проекта (Docker)${NC}"
echo -e "${GREEN}=========================================${NC}"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Ошибка: Docker не найден. Пожалуйста, установите Docker.${NC}"
    exit 1
fi

# Проверка наличия Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Ошибка: Docker Compose не найден. Пожалуйста, установите Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Docker и Docker Compose найдены.${NC}"

# Создание файла .env
if [ -f .env ]; then
    echo -e "${YELLOW}Внимание: Файл .env уже существует. Он будет перезаписан.${NC}"
    read -p "Продолжить? (y/n): " confirm
    if [[ "$confirm" != "y" ]]; then
        echo "Установка отменена."
        exit 0
    fi
    rm -f .env
fi

# Интерактивный запрос параметров
echo ""
echo -e "${YELLOW}--- Настройка конфигурации ---${NC}"

# Запрос пароля администратора
read -p "Введите пароль администратора (ADMIN_PASSWORD): " ADMIN_PASSWORD
if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}Пароль не может быть пустым.${NC}"
    exit 1
fi

# Запрос порта
read -p "На каком порту запустить приложение? (по умолчанию 3000): " APP_PORT
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000
fi

# Запрос SESSION_SECRET
read -p "Введите SESSION_SECRET (или нажмите Enter для генерации случайного): " SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "secret_$(date +%s)_$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)")
    echo -e "${GREEN}[OK] Сгенерирован случайный SESSION_SECRET${NC}"
fi

# Создание файла .env с правильными значениями
cat > .env <<EOF
# Переменные окружения для Docker
SESSION_SECRET=${SESSION_SECRET}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
APP_PORT=${APP_PORT}
EOF

echo -e "${GREEN}[OK] Конфигурация сохранена в .env${NC}"
echo "   - Порт: ${APP_PORT}"
echo "   - Пароль администратора: установлен"
echo "   - SESSION_SECRET: установлен"

# Остановка старых контейнеров и удаление volumes для чистой установки
echo ""
echo -e "${YELLOW}Очистка старых контейнеров (если есть)...${NC}"
$COMPOSE_CMD down -v 2>/dev/null || true

# Запуск контейнеров
echo ""
echo -e "${YELLOW}Запуск контейнеров...${NC}"

# Определяем команду для compose (docker compose или docker-compose)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  Установка завершена успешно!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "Приложение доступно по адресу: http://localhost:${APP_PORT}"
    echo ""
    echo "Полезные команды:"
    echo "  $COMPOSE_CMD down       - Остановить контейнеры"
    echo "  $COMPOSE_CMD logs -f    - Просмотр логов"
    echo "  $COMPOSE_CMD ps         - Статус контейнеров"
else
    echo -e "${RED}Ошибка при запуске контейнеров. Проверьте логи выше.${NC}"
    exit 1
fi
