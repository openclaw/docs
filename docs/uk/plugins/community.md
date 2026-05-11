---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Plugin-и OpenClaw, підтримувані спільнотою: переглядайте, встановлюйте та надсилайте власні'
title: Plugin спільноти
x-i18n:
    generated_at: "2026-05-11T20:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Спільнотні плагіни — це сторонні пакети, що розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, зазвичай вони публікуються на [ClawHub](/uk/clawhub) і встановлюються
однією командою. Npm залишається типовим способом запуску для простих специфікацій пакетів,
поки впроваджується встановлення пакетів ClawHub.

ClawHub — канонічна поверхня пошуку спільнотних плагінів. Не відкривайте
PR лише для документації тільки для того, щоб додати свій плагін сюди для видимості; натомість опублікуйте його на
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Використовуйте `openclaw plugins install <package-name>` для пакетів, розміщених у npm.

## Перелічені плагіни

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скраперів. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції тощо — просто попросивши про це.

- **npm:** `@apify/apify-openclaw-plugin`
- **репозиторій:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою команд,
природних для чату, для відновлення, планування, рев’ю, вибору моделі, Compaction тощо.

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

Плагін Lossless Context Management для OpenClaw. Стискання розмов на основі DAG
з інкрементним Compaction — зберігає повну точність контексту,
одночасно зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **репозиторій:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний плагін, що експортує трасування агентів до Opik. Відстежуйте поведінку агента,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **репозиторій:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Надайте своєму агенту OpenClaw аватар Live2D із синхронізацією губ у реальному часі, емоційними
виразами та синтезом мовлення з тексту. Містить інструменти для авторів для генерації AI-ресурсів
і розгортання одним кліком у Prometheus Marketplace. Наразі в alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **репозиторій:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Під’єднайте OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, групові
згадки, повідомлення каналів і розширені медіа, зокрема голос, зображення, відео
та файли.

Поточні релізи OpenClaw постачають QQ Bot у комплекті. Для звичайного встановлення використовуйте вбудоване налаштування в
[QQ Bot](/uk/channels/qqbot); встановлюйте цей зовнішній плагін лише тоді,
коли свідомо хочете окремий пакет, який підтримує Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **репозиторій:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
стійких підключень WeCom Bot WebSocket і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування Markdown,
вбудований контроль доступу та навички для документів/зустрічей/обміну повідомленнями.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **репозиторій:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Плагін каналу Yuanbao для OpenClaw від команди Tencent Yuanbao. Працює на основі
стійких підключень WebSocket і підтримує прямі повідомлення та групові чати,
потокові відповіді, проактивні повідомлення, обробку зображень/файлів/аудіо/відео,
форматування Markdown, вбудований контроль доступу та меню slash-команд.

- **npm:** `openclaw-plugin-yuanbao`
- **репозиторій:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Подайте свій плагін

Ми вітаємо спільнотні плагіни, які корисні, задокументовані та безпечні в експлуатації.

<Steps>
  <Step title="Опублікуйте на ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Публікуйте на [ClawHub](/uk/clawhub), якщо вам спеціально не потрібне розповсюдження
    лише через npm.
    Див. [Створення плагінів](/uk/plugins/building-plugins) для повного посібника.

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та трекером
    задач.

  </Step>

  <Step title="Використовуйте docs PR лише для змін у вихідній документації">
    Вам не потрібен docs PR лише для того, щоб зробити свій плагін доступним для пошуку. Натомість опублікуйте його
    на ClawHub.

    Відкривайте docs PR лише тоді, коли вихідна документація OpenClaw потребує фактичної зміни
    вмісту, наприклад виправлення інструкцій зі встановлення або додавання міжрепозиторної
    документації, якій місце в основному наборі документації.

  </Step>
</Steps>

## Планка якості

| Вимога                      | Чому                                           |
| --------------------------- | --------------------------------------------- |
| Опубліковано на ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювала |
| Публічний репозиторій GitHub | Перегляд вихідного коду, відстеження задач, прозорість |
| Документація з налаштування та використання | Користувачам потрібно знати, як це налаштувати |
| Активна підтримка           | Нещодавні оновлення або оперативна обробка задач |

Обгортки з мінімальними зусиллями, неясним володінням або непідтримувані пакети можуть бути відхилені.

## Пов’язане

- [Встановлення та налаштування плагінів](/uk/tools/plugin) — як встановити будь-який плагін
- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
