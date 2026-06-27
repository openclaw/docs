---
description: Real-world OpenClaw projects from the community
read_when:
    - Шукаємо реальні приклади використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Проєкти та інтеграції, створені спільнотою на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-06-27T18:22:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

Проєкти OpenClaw — не іграшкові демо. Люди вже запускають цикли рев’ю PR, мобільні застосунки, домашню автоматизацію, голосові системи, devtools і робочі процеси з інтенсивним використанням пам’яті з каналів, якими вже користуються — chat-native збірки в Telegram, WhatsApp, Discord і терміналах; справжню автоматизацію для бронювання, покупок і підтримки без очікування API; а також інтеграції з фізичним світом: принтерами, пилососами, камерами та домашніми системами.

<Info>
**Хочете потрапити до добірки?** Поділіться своїм проєктом у [#self-promotion on Discord](https://discord.gg/clawd) або [позначте @openclaw у X](https://x.com/openclaw).
</Info>

## Свіже з Discord

Нещодавні помітні приклади з кодування, devtools, мобільної розробки та створення chat-native продуктів.

<CardGroup cols={2}>

<Card title="Рев’ю PR із відгуком у Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну, відкриває PR, OpenClaw перевіряє diff і відповідає в Telegram із пропозиціями та чітким вердиктом щодо злиття.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Відгук рев’ю PR OpenClaw, доставлений у Telegram" />
</Card>

<Card title="Skill для винного льоху за хвилини" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) створити локальний skill для винного льоху. Він запитує приклад експорту CSV і шлях до сховища, а потім створює й тестує skill (962 пляшки в прикладі).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює локальний skill для винного льоху з CSV" />
</Card>

<Card title="Автопілот покупок у Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Тижневий план харчування, регулярні товари, бронювання слота доставки, підтвердження замовлення. Без API, лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок у Tesco через чат" />
</Card>

<Card title="SNAG зі скриншота в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Гаряча клавіша для області екрана, Gemini vision, миттєвий Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG для перетворення скриншота на Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настільний застосунок для керування skills і командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Голосові нотатки Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Огортає TTS papla.media і надсилає результати як голосові нотатки Telegram (без дратівливого автовідтворення).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вивід голосової нотатки Telegram з TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Помічник, встановлений через Homebrew, для переліку, перегляду й спостереження за локальними сесіями OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Керування 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керуйте принтерами BambuLab і усувайте проблеми: статус, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Транспорт Відня (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, перебої, стан ліфтів і маршрути для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="Шкільне харчування ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільного харчування у Великій Британії через ParentPay. Використовує координати миші для надійного натискання комірок таблиці.
</Card>

<Card title="Завантаження R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантаження в Cloudflare R2/S3 і створення безпечних попередньо підписаних посилань для завантаження. Корисно для віддалених інстансів OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill завантаження R2 на ClawHub" />
</Card>

<Card title="iOS-застосунок через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Створено повний iOS-застосунок із мапами та записом голосу, розгорнутий у TestFlight повністю через чат Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-застосунок у TestFlight" />
</Card>

<Card title="Помічник здоров’я Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-помічник здоров’я, що інтегрує дані Oura ring із календарем, записами та розкладом спортзалу.

  <img src="/assets/showcase/oura-health.png" alt="Помічник здоров’я Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ агентів)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ агентів під одним gateway з оркестратором Opus 4.5, який делегує Codex workers. Див. [технічний опис](https://github.com/adam91holt/orchestrated-ai-articles) і [Clawdspace](https://github.com/adam91holt/clawdspace) для ізоляції агентів у sandbox.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, що інтегрується з агентними робочими процесами (Claude Code, OpenClaw). Керуйте issues, проєктами й робочими процесами з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читайте, надсилайте й архівуйте повідомлення через Beeper Desktop. Використовує локальний MCP API Beeper, щоб агенти могли керувати всіма вашими чатами (iMessage, WhatsApp тощо) в одному місці.
</Card>

</CardGroup>

## Автоматизація та робочі процеси

Планування, керування браузером, цикли підтримки та сторона продукту в стилі "просто виконай це завдання за мене".

<CardGroup cols={2}>

<Card title="Керування очищувачем повітря Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, після чого OpenClaw бере на себе керування якістю повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Гарні знімки неба з камери" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускається камерою на даху: попросіть OpenClaw зробити фото неба щоразу, коли воно виглядає гарно. Він спроєктував skill і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з камери на даху, зроблений OpenClaw" />
</Card>

<Card title="Візуальна сцена ранкового брифінгу" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланований prompt щоранку генерує одне зображення сцени (погода, завдання, дата, улюблений допис або цитата) через персону OpenClaw.
</Card>

<Card title="Бронювання корту для паделу" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Перевірка доступності Playtomic плюс CLI для бронювання. Більше ніколи не пропускайте вільний корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Приймання бухгалтерських документів" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Збирає PDF з email, готує документи для податкового консультанта. Щомісячна бухгалтерія на автопілоті.
</Card>

<Card title="Режим розробника з дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудував персональний сайт через Telegram під час перегляду Netflix — Notion в Astro, мігровано 18 дописів, DNS у Cloudflare. Жодного разу не відкрив ноутбук.
</Card>

<Card title="Агент пошуку роботи" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами CV і повертає релевантні можливості з посиланнями. Створено за 30 хвилин за допомогою JSearch API.
</Card>

<Card title="Конструктор skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw підключився до Jira, а потім на льоту згенерував новий skill (ще до того, як він з’явився на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і змусив OpenClaw згенерувати skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входить у TradingView через автоматизацію браузера, робить скриншоти графіків і виконує технічний аналіз на вимогу. API не потрібен — лише керування браузером.
</Card>

<Card title="Автопідтримка Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за каналом компанії в Slack, корисно відповідає й пересилає сповіщення в Telegram. Автономно виправив production-баг у розгорнутому застосунку без запиту.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, які індексують, шукають, запам’ятовують і міркують над особистими або командними знаннями.

<CardGroup cols={2}>

<Card title="Вивчення китайської xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Рушій для вивчення китайської з відгуком щодо вимови та навчальними потоками через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Відгук щодо вимови xuezh" />
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує 1k+ голосових нотаток, звіряє з git logs, виводить пов’язані markdown-звіти.
</Card>

<Card title="Семантичний пошук Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає векторний пошук до закладок Karakeep за допомогою Qdrant плюс embeddings OpenAI або Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, який перетворює файли сесій на спогади, потім на переконання, а потім на еволюційну модель себе.
</Card>

</CardGroup>

## Голос і телефон

Speech-first точки входу, телефонні мости та робочі процеси з інтенсивною транскрипцією.

<CardGroup cols={2}>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Голосовий помічник Vapi до HTTP-моста OpenClaw. Майже реальні за часом телефонні дзвінки з вашим агентом.
</Card>

<Card title="Транскрипція OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовна транскрипція аудіо через OpenRouter (Gemini тощо). Доступно на ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill транскрипції OpenRouter на ClawHub" />
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання та інтеграції, які спрощують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Додаток Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway, що працює на Home Assistant OS із підтримкою SSH-тунелю та постійним станом.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Керуйте пристроями Home Assistant і автоматизуйте їх за допомогою природної мови.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Пакування Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Готова до використання ніксифікована конфігурація OpenClaw для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Календарний skill із використанням khal і vdirsyncer. Інтеграція самостійно розміщеного календаря.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Дім і обладнання

Фізичний бік OpenClaw: будинки, датчики, камери, пилососи й інші пристрої.

<CardGroup cols={2}>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Нативна для Nix домашня автоматизація з OpenClaw як інтерфейсом, а також панелі Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте своїм роботом-пилососом Roborock через природну розмову.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Проєкти спільноти

Речі, що виросли за межі одного робочого процесу в ширші продукти або екосистеми.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс астрономічного обладнання. Створено з екосистемою OpenClaw і навколо неї.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте в [#self-promotion у Discord](https://discord.gg/clawd) або [згадайте @openclaw у твіті](https://x.com/openclaw).
  </Step>
  <Step title="Додайте подробиці">
    Розкажіть нам, що він робить, додайте посилання на репозиторій або демо й поділіться знімком екрана, якщо маєте.
  </Step>
  <Step title="Потрапте на сторінку">
    Ми додамо видатні проєкти на цю сторінку.
  </Step>
</Steps>

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [OpenClaw](/uk/start/openclaw)
