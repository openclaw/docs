---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Підтримувані спільнотою Plugin для OpenClaw: переглядайте, встановлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-05-02T19:10:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Плагіни спільноти — це сторонні пакети, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, зазвичай їх публікують у [ClawHub](/uk/tools/clawhub), і вони встановлюються
однією командою. Npm залишається типовим варіантом запуску для простих специфікацій пакетів,
поки розгортаються встановлення пакетів ClawHub.

ClawHub — це канонічна поверхня для пошуку плагінів спільноти. Не відкривайте
PR лише до документації, щоб додати сюди свій плагін для помітності; натомість опублікуйте його в
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Використовуйте `openclaw plugins install <package-name>` для пакетів, розміщених у npm.

## Перелічені плагіни

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скреперів. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції тощо — просто попросивши його.

- **npm:** `@apify/apify-openclaw-plugin`
- **репозиторій:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним простим текстом і керуйте ним за допомогою нативних для чату
команд для відновлення, планування, рев’ю, вибору моделі, compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **репозиторій:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота в режимі Stream. Підтримує текстові, графічні та
файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **репозиторій:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Плагін Lossless Context Management для OpenClaw. Підсумовування розмов на основі DAG
з інкрементальним compaction — зберігає повну точність контексту,
водночас зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **репозиторій:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний плагін, який експортує трейси агентів до Opik. Відстежуйте поведінку агента,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **репозиторій:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Дайте своєму агенту OpenClaw аватар Live2D із синхронізацією губ у реальному часі, емоційними
виразами та синтезом мовлення. Містить інструменти для творців для генерації AI-ресурсів
і розгортання в один клік у Prometheus Marketplace. Наразі в альфа-версії.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **репозиторій:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Під’єднайте OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, групові
згадки, повідомлення каналів і багаті медіа, зокрема голос, зображення, відео
та файли.

Поточні випуски OpenClaw постачають QQ Bot у комплекті. Використовуйте вбудоване налаштування в
[QQ Bot](/uk/channels/qqbot) для звичайних встановлень; встановлюйте цей зовнішній плагін лише
коли навмисно хочете використовувати автономний пакет, який підтримує Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **репозиторій:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
постійних з’єднань WeCom Bot WebSocket і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування Markdown,
вбудований контроль доступу та Skills для документів/зустрічей/повідомлень.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **репозиторій:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Плагін каналу Yuanbao для OpenClaw від команди Tencent Yuanbao. Працює на основі
постійних з’єднань WebSocket і підтримує прямі повідомлення та групові чати,
потокові відповіді, проактивні повідомлення, обробку зображень/файлів/аудіо/відео,
форматування Markdown, вбудований контроль доступу та меню slash-команд.

- **npm:** `openclaw-plugin-yuanbao`
- **репозиторій:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Надішліть свій плагін

Ми вітаємо плагіни спільноти, які корисні, задокументовані та безпечні в експлуатації.

<Steps>
  <Step title="Опублікуйте в ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Публікуйте в [ClawHub](/uk/tools/clawhub), якщо вам спеціально не потрібне розповсюдження
    лише через npm.
    Див. повний посібник у [Створення плагінів](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та трекером
    проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін вихідної документації">
    Вам не потрібен PR до документації лише для того, щоб ваш плагін можна було знайти. Натомість опублікуйте його
    в ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw потребує фактичної зміни
    вмісту, наприклад виправлення інструкцій зі встановлення або додавання міжрепозиторної
    документації, якій місце в основному наборі документації.

  </Step>
</Steps>

## Планка якості

| Вимога                      | Чому                                          |
| --------------------------- | --------------------------------------------- |
| Опубліковано в ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювала |
| Публічний репозиторій GitHub | Перегляд коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачам потрібно знати, як його налаштувати |
| Активна підтримка           | Нещодавні оновлення або оперативна робота з проблемами |

Пакети з мінімальними обгортками, нечіткою відповідальністю або без підтримки можуть бути відхилені.

## Пов’язане

- [Установлення та налаштування плагінів](/uk/tools/plugin) — як установити будь-який плагін
- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
