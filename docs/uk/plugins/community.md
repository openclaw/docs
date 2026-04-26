---
read_when:
    - Ви хочете знайти сторонні plugin для OpenClaw
    - Ви хочете опублікувати або додати до списку власний plugin
summary: 'Plugin для OpenClaw, що підтримуються спільнотою: перегляд, встановлення та надсилання власних'
title: Plugin спільноти
x-i18n:
    generated_at: "2026-04-26T00:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Plugin спільноти — це сторонні пакунки, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, вони публікуються в [ClawHub](/uk/tools/clawhub) або npm і
можуть бути встановлені однією командою.

ClawHub — це канонічна поверхня виявлення для Plugin спільноти. Не відкривайте
PR лише до документації, щоб просто додати тут свій Plugin для кращого виявлення; натомість опублікуйте його в
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub, а потім автоматично переходить до npm.

## Перелічені Plugin

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скрейперів. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції тощо — просто за запитом.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним простим текстом і керуйте ним за допомогою природних для чату
команд для відновлення, планування, перевірки, вибору моделі, Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує текст, зображення та
файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management для OpenClaw. Підсумовування розмов
на основі DAG з інкрементною Compaction — зберігає повну цілісність контексту
і водночас зменшує використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний Plugin, який експортує трасування агентів до Opik. Відстежуйте поведінку агентів,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Додайте своєму агенту OpenClaw Live2D-аватар із синхронізацією губ у реальному часі, емоційними
виразами та перетворенням тексту на мовлення. Містить інструменти для авторів для генерації AI-активів
і розгортання в один клік у Prometheus Marketplace. Наразі в альфа-версії.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Підключіть OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, групові
згадки, повідомлення в каналах і мультимедіа, зокрема голосові повідомлення, зображення, відео
та файли.

Поточні релізи OpenClaw постачаються з QQ Bot у комплекті. Використовуйте вбудоване налаштування з
[QQ Bot](/uk/channels/qqbot) для звичайних встановлень; встановлюйте цей зовнішній Plugin лише
тоді, коли вам навмисно потрібен окремий пакунок, який підтримує Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
постійних WebSocket-з’єднань WeCom Bot, підтримує прямі повідомлення й групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування Markdown,
вбудований контроль доступу та Skills для документів/зустрічей/повідомлень.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Надішліть свій Plugin

Ми вітаємо Plugin спільноти, які є корисними, документованими та безпечними в експлуатації.

<Steps>
  <Step title="Опублікуйте в ClawHub або npm">
    Ваш Plugin має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його в [ClawHub](/uk/tools/clawhub) (бажано) або npm.
    Повний посібник дивіться в [Створення Plugin](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та
    трекером проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб ваш Plugin можна було знайти. Натомість опублікуйте його
    в ClawHub.

    Відкривайте PR до документації лише тоді, коли у вихідній документації OpenClaw потрібна реальна
    зміна вмісту, наприклад виправлення інструкцій зі встановлення або додавання міжрепозиторної
    документації, яка має належати до основного набору документації.

  </Step>
</Steps>

## Планка якості

| Вимога                    | Чому                                            |
| ------------------------- | ----------------------------------------------- |
| Опубліковано в ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювало |
| Публічний GitHub repo     | Перевірка вихідного коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати |
| Активна підтримка         | Нещодавні оновлення або оперативне опрацювання проблем |

Примітивні обгортки, незрозуміле володіння або пакунки без підтримки можуть бути відхилені.

## Пов’язане

- [Встановлення та налаштування Plugin](/uk/tools/plugin) — як встановити будь-який Plugin
- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
