---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Плагіни OpenClaw, які підтримує спільнота: переглядайте, встановлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-27T15:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b9c92e8f2e592bbbdbaa8d3f354d176f1600354f6438f137dbe01c01c6f5603
    source_path: plugins/community.md
    workflow: 15
---

Плагіни спільноти — це сторонні пакунки, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, вони публікуються на [ClawHub](/uk/tools/clawhub) або npm і
встановлюються однією командою.

ClawHub — це канонічна поверхня для пошуку плагінів спільноти. Не відкривайте
PR лише до документації тільки для того, щоб додати тут свій плагін для кращої видимості;
натомість опублікуйте його на ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і за потреби автоматично переходить на npm.

## Перелічені плагіни

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скраперів. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції тощо — просто за запитом.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою
природних для чату команд для відновлення, планування, перегляду, вибору моделі,
Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує текстові,
графічні повідомлення та повідомлення з файлами через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Плагін керування контекстом без втрат для OpenClaw. Підсумовування розмов на основі DAG
з інкрементальним Compaction — зберігає повну точність контексту
та зменшує використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний плагін, який експортує трасування агента до Opik. Відстежуйте поведінку агента,
витрати, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Додайте своєму агенту OpenClaw аватар Live2D із синхронізацією губ у реальному часі, емоційними
виразами та перетворенням тексту на мовлення. Містить інструменти для творців для генерації AI-активів
і розгортання в Prometheus Marketplace в один клік. Наразі в альфа-версії.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Підключіть OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, згадки в групах,
повідомлення каналів і мультимедійний контент, зокрема голос, зображення, відео
та файли.

Поточні випуски OpenClaw постачаються з QQ Bot у комплекті. Для звичайних установок використовуйте
вбудоване налаштування в [QQ Bot](/uk/channels/qqbot); встановлюйте цей зовнішній плагін лише
тоді, коли вам навмисно потрібен окремий пакунок, який підтримує Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
постійних WebSocket-з’єднань WeCom Bot і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів,
форматування Markdown, вбудований контроль доступу та Skills для документів/зустрічей/обміну повідомленнями.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Плагін каналу Yuanbao для OpenClaw від команди Tencent Yuanbao. Працює на основі
постійних WebSocket-з’єднань і підтримує прямі повідомлення та групові чати,
потокові відповіді, проактивні повідомлення, обробку зображень/файлів/аудіо/відео,
форматування Markdown, вбудований контроль доступу та меню slash-команд.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Надішліть свій плагін

Ми вітаємо плагіни спільноти, які є корисними, документованими та безпечними в експлуатації.

<Steps>
  <Step title="Опублікуйте на ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його на [ClawHub](/uk/tools/clawhub) (бажано) або npm.
    Повний посібник дивіться в [Building Plugins](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування
    та трекером проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб ваш плагін можна було знайти. Натомість опублікуйте його
    на ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw справді потребує
    зміни вмісту, наприклад виправлення вказівок зі встановлення або додавання міжрепозиторної
    документації, яка має належати до основного набору документації.

  </Step>
</Steps>

## Планка якості

| Вимога                    | Чому                                          |
| ------------------------- | --------------------------------------------- |
| Опубліковано на ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювало |
| Публічний репозиторій GitHub    | Перегляд коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати |
| Активна підтримка         | Нещодавні оновлення або оперативна обробка проблем |

Маловартісні обгортки, незрозуміле володіння або пакунки без підтримки можуть бути відхилені.

## Пов’язане

- [Install and Configure Plugins](/uk/tools/plugin) — як встановити будь-який плагін
- [Building Plugins](/uk/plugins/building-plugins) — створіть власний
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
