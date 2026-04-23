---
read_when:
    - Ви хочете знайти сторонні Plugins OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Plugins OpenClaw, які підтримує спільнота: перегляд, встановлення та надсилання власних Plugin'
title: Plugins спільноти
x-i18n:
    generated_at: "2026-04-23T21:02:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Plugins спільноти — це сторонні пакети, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, вони публікуються в [ClawHub](/uk/tools/clawhub) або npm і
встановлюються однією командою.

ClawHub — це канонічна поверхня для пошуку Plugin спільноти. Не відкривайте
PR лише до документації тільки для того, щоб додати тут свій Plugin для видимості; натомість опублікуйте його в
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub, а потім автоматично повертається до npm.

## Plugins у списку

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових scraper. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, e-commerce сайтів та інших джерел — просто за запитом.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для conversations Codex App Server. Прив’яжіть чат до
thread Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою нативних для чату
команд для resume, planning, review, вибору моделі, Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує текст,
зображення й файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management для OpenClaw. DAG-базоване
узагальнення розмов з інкрементальним Compaction — зберігає повну точність контексту
при зменшенні використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний Plugin, який експортує трасування агента в Opik. Відстежуйте поведінку агента,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Додайте своєму агенту OpenClaw аватар Live2D з синхронізацією губ у реальному часі,
виразами емоцій і перетворенням тексту на мовлення. Містить інструменти для авторів для AI-генерації ресурсів
і розгортання в один клік на Prometheus Marketplace. Наразі в alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Підключіть OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, групові
згадки, повідомлення в каналах і розширені медіа, включно з голосом, зображеннями, відео
та файлами.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на базі
постійних WebSocket-з’єднань WeCom Bot і підтримує direct messages та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування
Markdown, вбудоване керування доступом і Skills для документів/зустрічей/повідомлень.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Надішліть свій Plugin

Ми вітаємо Plugins спільноти, які є корисними, задокументованими й безпечними в експлуатації.

<Steps>
  <Step title="Опублікуйте в ClawHub або npm">
    Ваш Plugin має встановлюватися через `openclaw plugins install \<package-name\>`.
    Публікуйте в [ClawHub](/uk/tools/clawhub) (бажано) або npm.
    Повний посібник див. у [Building Plugins](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією щодо налаштування та
    issue tracker.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб зробити свій Plugin доступним для пошуку. Опублікуйте його
    в ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw справді потребує
    зміни вмісту, наприклад для виправлення інструкцій зі встановлення або додавання міжрепозиторної
    документації, яка має належати до основного набору документації.

  </Step>
</Steps>

## Планка якості

| Requirement                 | Why                                              |
| --------------------------- | ------------------------------------------------ |
| Опубліковано в ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювала |
| Публічний репозиторій GitHub | Перегляд джерела, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати       |
| Активна підтримка           | Нещодавні оновлення або оперативна робота з issue |

Низькозусильні wrapper, незрозуміла відповідальність або непідтримувані пакети можуть бути відхилені.

## Пов’язане

- [Install and Configure Plugins](/uk/tools/plugin) — як установити будь-який Plugin
- [Building Plugins](/uk/plugins/building-plugins) — створіть власний
- [Plugin Manifest](/uk/plugins/manifest) — схема manifest
