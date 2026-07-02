---
description: Real-world OpenClaw projects from the community
read_when:
    - Пошук реальних прикладів використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Проєкти та інтеграції спільноти на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-07-02T08:48:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Проєкти OpenClaw не є іграшковими демо. Люди запускають у роботу цикли рев’ю PR, мобільні застосунки, домашню автоматизацію, голосові системи, devtools і workflow з великим обсягом пам’яті з каналів, якими вони вже користуються — chat-native збірки в Telegram, WhatsApp, Discord і терміналах; реальну автоматизацію для бронювання, покупок і підтримки без очікування API; а також інтеграції з фізичним світом: принтерами, пилососами, камерами й домашніми системами.

<Info>
**Хочете потрапити до добірки?** Поділіться своїм проєктом у [#self-promotion на Discord](https://discord.gg/clawd) або [позначте @openclaw в X](https://x.com/openclaw).
</Info>

## Свіже з Discord

Нещодавні помітні приклади з coding, devtools, мобільної розробки та створення chat-native продуктів.

<CardGroup cols={2}>

<Card title="Від рев’ю PR до фідбеку в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну, відкриває PR, OpenClaw переглядає diff і відповідає в Telegram пропозиціями та чітким вердиктом щодо merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Фідбек рев’ю PR OpenClaw доставлено в Telegram" />
</Card>

<Card title="Skill для винного льоху за лічені хвилини" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) створити локальний skill для винного льоху. Він запитує приклад експорту CSV і шлях до сховища, потім збирає й тестує skill (962 пляшки в прикладі).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює локальний skill для винного льоху з CSV" />
</Card>

<Card title="Автопілот покупок у Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Тижневий план харчування, регулярні товари, бронювання слота доставки, підтвердження замовлення. Жодних API, лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок у Tesco через чат" />
</Card>

<Card title="SNAG: зі скриншота в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Гаряча клавіша для області екрана, Gemini vision, миттєвий Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG для перетворення скриншотів у Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop застосунок для керування skills і командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Голосові нотатки Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Огортає TTS papla.media й надсилає результати як голосові нотатки Telegram (без надокучливого автовідтворення).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вивід голосової нотатки Telegram із TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Допоміжний інструмент, встановлений через Homebrew, для перегляду списку, інспектування й моніторингу локальних сесій OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Керування 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керування й діагностика принтерів BambuLab: статус, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Транспорт Відня (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, перебої, стан ліфтів і маршрути для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="Шкільні обіди ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільних обідів у Великій Британії через ParentPay. Використовує координати миші для надійного натискання клітинок таблиці.
</Card>

<Card title="Завантаження R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантаження в Cloudflare R2/S3 і створення безпечних presigned посилань для завантаження. Корисно для віддалених екземплярів OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill для завантаження R2 на ClawHub" />
</Card>

<Card title="iOS застосунок через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Повний iOS застосунок із мапами й голосовим записом, підготовлений до дистрибуції в App Store повністю через чат Telegram.
</Card>

<Card title="Асистент здоров’я Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-асистент здоров’я, що інтегрує дані кільця Oura з календарем, зустрічами та розкладом тренувань.

  <img src="/assets/showcase/oura-health.png" alt="Асистент здоров’я з кільцем Oura" />
</Card>

<Card title="Kev's Dream Team (14+ агентів)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Понад 14 агентів під одним gateway з оркестратором Opus 4.5, який делегує роботу працівникам Codex. Дивіться [технічний опис](https://github.com/adam91holt/orchestrated-ai-articles) і [Clawdspace](https://github.com/adam91holt/clawdspace) для пісочниць агентів.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, що інтегрується з агентними workflow (Claude Code, OpenClaw). Керуйте issues, проєктами й workflow з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читайте, надсилайте й архівуйте повідомлення через Beeper Desktop. Використовує локальний MCP API Beeper, щоб агенти могли керувати всіма вашими чатами (iMessage, WhatsApp тощо) в одному місці.
</Card>

</CardGroup>

## Автоматизація та workflow

Планування, керування браузером, цикли підтримки й частина продукту в стилі "просто виконай це завдання за мене".

<CardGroup cols={2}>

<Card title="Керування очищувачем повітря Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, а потім OpenClaw бере на себе керування якістю повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Гарні кадри неба з камери" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускається від камери на даху: попросіть OpenClaw зробити фото неба щоразу, коли воно має гарний вигляд. Він спроєктував skill і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з дахової камери, зроблений OpenClaw" />
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

<Card title="Режим розробки з дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудував персональний сайт через Telegram, дивлячись Netflix — міграція з Notion до Astro, 18 дописів перенесено, DNS на Cloudflare. Жодного разу не відкрив ноутбук.
</Card>

<Card title="Агент пошуку роботи" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами CV і повертає релевантні можливості з посиланнями. Зібрано за 30 хвилин із використанням JSearch API.
</Card>

<Card title="Конструктор skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw під’єднався до Jira, а потім згенерував новий skill на льоту (ще до того, як він з’явився на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і змусив OpenClaw згенерувати skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входить у TradingView через автоматизацію браузера, робить скриншоти графіків і виконує технічний аналіз на вимогу. API не потрібен — лише керування браузером.
</Card>

<Card title="Автопідтримка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за каналом компанії в Slack, корисно відповідає й пересилає сповіщення в Telegram. Автономно виправив production-баг у розгорнутому застосунку без окремого прохання.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, що індексують, шукають, запам’ятовують і міркують над особистими або командними знаннями.

<CardGroup cols={2}>

<Card title="Вивчення китайської xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Двигун для вивчення китайської з фідбеком щодо вимови та навчальними потоками через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Фідбек щодо вимови xuezh" />
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує понад 1 тис. голосових нотаток, звіряє з git logs, виводить пов’язані markdown-звіти.
</Card>

<Card title="Семантичний пошук Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає векторний пошук до закладок Karakeep за допомогою Qdrant плюс embeddings OpenAI або Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, що перетворює файли сесій на спогади, потім на переконання, а далі на еволюційну модель себе.
</Card>

</CardGroup>

## Голос і телефон

Speech-first точки входу, телефонні мости та workflow з великою кількістю транскрипції.

<CardGroup cols={2}>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Голосовий асистент Vapi до HTTP-моста OpenClaw. Телефонні дзвінки з вашим агентом майже в реальному часі.
</Card>

<Card title="Транскрипція OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовна аудіотранскрипція через OpenRouter (Gemini тощо). Доступно на ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill транскрипції OpenRouter на ClawHub" />
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання й інтеграції, які полегшують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Додаток Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway, що працює на Home Assistant OS з підтримкою SSH-тунелю та persistent state.
</Card>

<Card title="Навичка Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Керуйте пристроями Home Assistant і автоматизуйте їх за допомогою природної мови.

  <img src="/assets/showcase/homeassistant.png" alt="Навичка Home Assistant на ClawHub" />
</Card>

<Card title="Пакування Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Повна nixified-конфігурація OpenClaw для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Навичка календаря, що використовує khal і vdirsyncer. Інтеграція самостійно розміщеного календаря.

  <img src="/assets/showcase/caldav-calendar.png" alt="Навичка календаря CalDAV на ClawHub" />
</Card>

</CardGroup>

## Дім і апаратне забезпечення

Сторона OpenClaw, пов’язана з фізичним світом: домівки, датчики, камери, пилососи та інші пристрої.

<CardGroup cols={2}>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Домашня автоматизація на основі Nix з OpenClaw як інтерфейсом, а також панелі Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель Grafana GoHome" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте своїм роботом-пилососом Roborock через природну розмову.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

Речі, що виросли за межі одного робочого процесу в ширші продукти чи екосистеми.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс астрономічного спорядження. Створено з екосистемою OpenClaw і навколо неї.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте в [#self-promotion на Discord](https://discord.gg/clawd) або [напишіть @openclaw у X](https://x.com/openclaw).
  </Step>
  <Step title="Додайте подробиці">
    Розкажіть нам, що він робить, додайте посилання на репозиторій або демо та поділіться знімком екрана, якщо маєте.
  </Step>
  <Step title="Потрапте на сторінку">
    Ми додамо видатні проєкти на цю сторінку.
  </Step>
</Steps>

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [OpenClaw](/uk/start/openclaw)
