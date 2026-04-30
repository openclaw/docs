---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до каталогу власний Plugin
summary: 'Плагіни OpenClaw, які підтримує спільнота: переглядайте, установлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-30T08:06:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugin спільноти — це сторонні пакети, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Вони створюються та підтримуються
спільнотою, зазвичай публікуються на [ClawHub](/uk/tools/clawhub), і їх можна встановити
однією командою. Npm залишається підтримуваним резервним варіантом для пакетів, які ще
не перейшли на ClawHub.

ClawHub — це канонічна поверхня пошуку для Plugin спільноти. Не відкривайте
PR лише для документації тільки щоб додати свій Plugin сюди для видимості; натомість опублікуйте його на
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і автоматично переходить до npm як резервного варіанту.

## Перелічені Plugin

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скреперів. Дайте своєму агенту змогу
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції та інших джерел — просто запитавши.

- **npm:** `@apify/apify-openclaw-plugin`
- **репозиторій:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою нативних для чату
команд для відновлення, планування, рев’ю, вибору моделі, Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **репозиторій:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує текст, зображення та
файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **репозиторій:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin керування контекстом без втрат для OpenClaw. Сумаризація розмов на основі DAG
з інкрементальною Compaction — зберігає повну точність контексту,
одночасно зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **репозиторій:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний Plugin, який експортує трасування агента до Opik. Відстежуйте поведінку агента,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **репозиторій:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Надайте своєму агенту OpenClaw аватар Live2D із синхронізацією губ у реальному часі, емоційними
виразами та перетворенням тексту на мовлення. Містить інструменти для авторів для генерації AI-ресурсів
і розгортання в один клік до Prometheus Marketplace. Наразі в альфа-версії.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **репозиторій:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Під’єднайте OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, групові
згадки, повідомлення каналів і розширені медіа, зокрема голос, зображення, відео
та файли.

Поточні випуски OpenClaw містять QQ Bot у комплекті. Використовуйте вбудоване налаштування в
[QQ Bot](/uk/channels/qqbot) для звичайних інсталяцій; встановлюйте цей зовнішній Plugin лише
тоді, коли ви навмисно хочете окремий пакет, підтримуваний Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **репозиторій:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin каналу WeCom для OpenClaw від команди Tencent WeCom. На базі
постійних WebSocket-з’єднань WeCom Bot він підтримує прямі повідомлення й групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування Markdown,
вбудований контроль доступу та Skills для документів/зустрічей/обміну повідомленнями.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **репозиторій:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin каналу Yuanbao для OpenClaw від команди Tencent Yuanbao. На базі
постійних WebSocket-з’єднань він підтримує прямі повідомлення й групові чати,
потокові відповіді, проактивні повідомлення, обробку зображень/файлів/аудіо/відео,
форматування Markdown, вбудований контроль доступу та меню slash-команд.

- **npm:** `openclaw-plugin-yuanbao`
- **репозиторій:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Надішліть свій Plugin

Ми вітаємо Plugin спільноти, які корисні, задокументовані та безпечні в експлуатації.

<Steps>
  <Step title="Опублікуйте на ClawHub або npm">
    Ваш Plugin має встановлюватися через `openclaw plugins install \<package-name\>`.
    Публікуйте на [ClawHub](/uk/tools/clawhub), якщо вам не потрібне саме поширення
    лише через npm.
    Див. [Створення Plugin](/uk/plugins/building-plugins) для повного посібника.

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та трекером
    проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб зробити свій Plugin видимим. Натомість опублікуйте його
    на ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw потребує фактичної зміни
    вмісту, наприклад виправлення інструкцій зі встановлення або додавання міжрепозиторної
    документації, якій місце в основному наборі документації.

  </Step>
</Steps>

## Планка якості

| Вимога                      | Чому                                          |
| --------------------------- | --------------------------------------------- |
| Опубліковано на ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працював |
| Публічний репозиторій GitHub | Перегляд вихідного коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачам потрібно знати, як це налаштувати |
| Активна підтримка           | Нещодавні оновлення або оперативна обробка проблем |

Обгортки з мінімальними зусиллями, незрозумілим власником або непідтримувані пакети можуть бути відхилені.

## Пов’язане

- [Встановлення та налаштування Plugin](/uk/tools/plugin) — як встановити будь-який Plugin
- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
