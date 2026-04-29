---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або показати у списку власний Plugin
summary: 'Плагіни OpenClaw, які підтримує спільнота: переглядайте, установлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-29T05:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

Community-плагіни — це сторонні пакети, що розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та
підтримує спільнота, зазвичай їх публікують на [ClawHub](/uk/tools/clawhub), і їх
можна встановити однією командою. Npm залишається підтримуваним резервним
варіантом для пакетів, які ще не перейшли на ClawHub.

ClawHub — це канонічна поверхня для виявлення community-плагінів. Не відкривайте
PR-и лише для документації тільки для того, щоб додати свій плагін сюди заради
видимості; натомість опублікуйте його на ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і автоматично переходить до npm як
резервного варіанта.

## Перелічені плагіни

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скраперів.
Дайте своєму агенту змогу отримувати дані з Instagram, Facebook, TikTok,
YouTube, Google Maps, Google Search, сайтів електронної комерції тощо — просто
попросивши його.

- **npm:** `@apify/apify-openclaw-plugin`
- **репозиторій:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до потоку
Codex, спілкуйтеся з ним звичайним текстом і керуйте ним командами, природними
для чату, для відновлення, планування, огляду, вибору моделі, Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **репозиторій:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням потокового режиму. Підтримує
текстові, графічні та файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **репозиторій:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Плагін Lossless Context Management для OpenClaw. Узагальнення розмов на основі
DAG з інкрементальною Compaction — зберігає повну точність контексту, водночас
зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **репозиторій:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний плагін, який експортує трасування агентів до Opik. Відстежуйте
поведінку агента, вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **репозиторій:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Надайте своєму агенту OpenClaw аватар Live2D із синхронізацією губ у реальному
часі, емоційними виразами та перетворенням тексту на мовлення. Містить
інструменти для авторів, призначені для генерації AI-ресурсів і розгортання в
один клік у Prometheus Marketplace. Наразі в альфа-версії.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **репозиторій:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Під’єднайте OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, згадки в
групах, повідомлення каналів і насичені медіа, зокрема голос, зображення, відео
та файли.

Поточні випуски OpenClaw містять QQ Bot у комплекті. Для звичайних встановлень
використовуйте вбудоване налаштування в [QQ Bot](/uk/channels/qqbot); встановлюйте
цей зовнішній плагін лише тоді, коли ви навмисно хочете окремий пакет, який
підтримує Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **репозиторій:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
сталих WebSocket-з’єднань WeCom Bot і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів,
форматування Markdown, вбудований контроль доступу та навички для документів,
зустрічей і повідомлень.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **репозиторій:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Плагін каналу Yuanbao для OpenClaw від команди Tencent Yuanbao. Працює на основі
сталих WebSocket-з’єднань і підтримує прямі повідомлення та групові чати,
потокові відповіді, проактивні повідомлення, обробку зображень/файлів/аудіо/відео,
форматування Markdown, вбудований контроль доступу та меню slash-команд.

- **npm:** `openclaw-plugin-yuanbao`
- **репозиторій:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Подайте свій плагін

Ми вітаємо community-плагіни, які корисні, задокументовані та безпечні в
експлуатації.

<Steps>
  <Step title="Опублікуйте на ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його на [ClawHub](/uk/tools/clawhub), якщо вам не потрібне саме
    розповсюдження лише через npm.
    Повний посібник див. у [Створення плагінів](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з
    налаштування та трекером задач.

  </Step>

  <Step title="Використовуйте PR-и до документації лише для змін вихідної документації">
    Вам не потрібен PR до документації тільки для того, щоб зробити свій плагін
    видимим. Натомість опублікуйте його на ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw
    потребує фактичної зміни вмісту, наприклад виправлення інструкцій зі
    встановлення або додавання міжрепозиторійної документації, якій місце в
    основному наборі документації.

  </Step>
</Steps>

## Планка якості

| Вимога                     | Чому                                              |
| -------------------------- | ------------------------------------------------- |
| Опубліковано на ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювала |
| Публічний репозиторій GitHub | Огляд вихідного коду, відстеження задач, прозорість |
| Документація з налаштування та використання | Користувачам потрібно знати, як це налаштувати |
| Активна підтримка          | Нещодавні оновлення або оперативна обробка задач |

Обгортки з мінімальними зусиллями, незрозумілим власником або непідтримувані
пакети можуть бути відхилені.

## Пов’язане

- [Встановлення та налаштування плагінів](/uk/tools/plugin) — як встановити будь-який плагін
- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
