# 📦 Stock App — Учёт остатков товара

Telegram Mini App для учёта остатков. Работает прямо внутри Telegram.

---

## 🚀 Деплой на Railway (15 минут)

### Шаг 1 — Подготовка GitHub

1. Создай репозиторий на github.com (New → назови `stock-app`)
2. Открой папку проекта в терминале и выполни:

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/ТВО_ИМЯ/stock-app.git
git push -u origin main
```

---

### Шаг 2 — База данных на Railway

1. Зайди на railway.app → **New Project**
2. **Add a service** → **Database** → **PostgreSQL**
3. Кликни на базу → вкладка **Connect** → скопируй **DATABASE_URL**

---

### Шаг 3 — Приложение на Railway

1. В том же проекте → **Add a service** → **GitHub Repo** → выбери `stock-app`
2. Перейди в сервис → вкладка **Variables** → добавь:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | скопировал на шаге 2 |
| `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
| `JWT_SECRET` | любые 32+ символа, например: `mySuperSecret-change-this-now-123!` |
| `MINI_APP_URL` | заполни после шага 4 |
| `NEXT_PUBLIC_MINI_APP_URL` | то же самое |

3. Вкладка **Settings** → **Public Domain** → **Generate Domain**
4. Скопируй домен (например `stock-app-prod.up.railway.app`)
5. Вернись в **Variables** и заполни:
   - `MINI_APP_URL` = `https://stock-app-prod.up.railway.app`
   - `NEXT_PUBLIC_MINI_APP_URL` = `https://stock-app-prod.up.railway.app`
6. Railway задеплоит автоматически — жди 3-5 минут

---

### Шаг 4 — Настройка бота

1. Открой [@BotFather](https://t.me/BotFather) → `/mybots` → выбери бота
2. **Bot Settings** → **Menu Button** → **Configure menu button**
3. Введи URL: `https://твой-домен.up.railway.app`
4. Введи название кнопки: `📦 Открыть учёт`

---

### Шаг 5 — Готово! 🎉

Напиши боту `/start` → нажми кнопку → приложение откроется.

**Первый кто открыл = автоматически ADMIN.**  
Остальные пользователи ждут активации в Настройки → Пользователи.

---

## 💻 Локальная разработка

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать .env
cp .env.example .env
# Отредактировать .env — заполнить DATABASE_URL и TELEGRAM_BOT_TOKEN

# 3. Создать таблицы в БД
npm run db:push

# 4. Заполнить тестовыми данными
npm run db:seed

# 5. Запустить Next.js
npm run dev

# 6. В другом терминале — запустить бота
npm run bot

# 7. Для Telegram нужен HTTPS туннель
npx ngrok http 3000
# Скопировать HTTPS URL в .env → MINI_APP_URL
```

---

## 📁 Структура проекта

```
├── app/
│   ├── api/              ← API endpoints
│   └── (miniapp)/        ← Страницы Mini App
├── bot/index.js          ← Telegram бот
├── components/           ← UI компоненты
├── lib/                  ← Утилиты (auth, i18n, prisma)
├── services/             ← Бизнес-логика
├── prisma/
│   ├── schema.prisma     ← Схема БД
│   └── seed.js           ← Тестовые данные
└── start.js              ← Запуск на Railway
```

---

## 🔑 Роли пользователей

| Роль | Права |
|---|---|
| **ADMIN** | Всё: добавлять товары, управлять пользователями |
| **WORKER** | Приход, расход, корректировка, просмотр |

Первый пользователь → автоматически ADMIN.  
Новые пользователи → WORKER + неактивны (нужно одобрение ADMIN).
