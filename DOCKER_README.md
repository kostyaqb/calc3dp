# Docker-контейнеризация проекта

Этот проект теперь поддерживает запуск в Docker-контейнере.

## Быстрый старт

### Вариант 1: Автоматическая установка (рекомендуется)

Простой способ установки с интерактивной настройкой:

```bash
# Запустите скрипт установки
./install.sh
```

Скрипт автоматически:
- Проверит наличие Docker и Docker Compose
- Создаст файл `.env`
- Запросит пароль для базы данных
- Запросит порт для запуска приложения
- Соберет и запустит контейнеры

### Вариант 2: Ручная установка через docker-compose

```bash
# Скопируйте файл с переменными окружения
cp .env.example .env

# Отредактируйте .env файл, установив свои значения:
# - SESSION_SECRET (секретный ключ для сессий)
# - ADMIN_PASSWORD (пароль администратора)
# - POSTGRES_PASSWORD (пароль базы данных)
# - APP_PORT (порт приложения)

# Запустите контейнер
docker-compose up -d --build
```

Приложение будет доступно по адресу: http://localhost:3000 (или на порту, указанном в .env)

### Вариант 3: Использование только Docker

```bash
# Сборка образа
docker build -t calculator-app .

# Запуск контейнера
docker run -d \
  -p 3000:3000 \
  -e SESSION_SECRET=your_secret \
  -e ADMIN_PASSWORD=your_password \
  -v db_data:/app/data \
  --name calculator-app \
  calculator-app
```

## Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `SESSION_SECRET` | Секретный ключ для сессий | `default_secret_change_me` |
| `ADMIN_PASSWORD` | Пароль администратора | (обязательно) |
| `NODE_ENV` | Режим работы (production/development) | `production` |
| `DB_FILE` | Путь к файлу базы данных | `/app/data/db.json` |

## Хранение данных

Данные сохраняются в Docker volume `db_data`, что обеспечивает сохранность данных при перезапуске контейнера.

Для просмотра данных:
```bash
docker volume ls  # Показать все volumes
docker volume inspect calculator-app_db_data  # Информация о volume
```

## Остановка контейнера

```bash
# При использовании docker-compose
docker-compose down

# При использовании docker run
docker stop calculator-app
docker rm calculator-app
```

## Логи

```bash
# Просмотр логов
docker-compose logs -f app

# Или для docker run
docker logs -f calculator-app
```
