---
description: Real-world OpenClaw projects from the community
read_when:
    - Пошук реальних прикладів використання OpenClaw
    - Оновлення огляду проєктів спільноти
summary: Проєкти та інтеграції, створені спільнотою на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-04-23T21:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe06bada76a47f3bb70572179eab5fd1e39041657359fba5dc737cfed3a9df2
    source_path: start/showcase.md
    workflow: 15
---

Проєкти OpenClaw — це не іграшкові демо. Люди запускають цикли review PR, мобільні застосунки, домашню автоматизацію, голосові системи, devtools і memory-heavy робочі процеси з тих каналів, якими вони вже користуються — chat-native збірки в Telegram, WhatsApp, Discord і терміналах; реальна автоматизація для бронювання, покупок і підтримки без очікування на API; а також інтеграції з фізичним світом — принтерами, пилососами, камерами та домашніми системами.

<Info>
**Хочете потрапити у добірку?** Поділіться своїм проєктом у [#self-promotion на Discord](https://discord.gg/clawd) або [позначте @openclaw у X](https://x.com/openclaw).
</Info>

## Відео

Почніть тут, якщо хочете найкоротший шлях від «що це таке?» до «гаразд, я зрозумів».

<CardGroup cols={3}>

<Card title="Повний огляд налаштування" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 хвилин. Встановлення, онбординг і повний шлях до першого робочого асистента.
</Card>

<Card title="Ролик із добіркою проєктів спільноти" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Швидший огляд реальних проєктів, поверхонь і робочих процесів, побудованих навколо OpenClaw.
</Card>

<Card title="Проєкти в реальному використанні" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Приклади від спільноти — від chat-native циклів кодування до обладнання та персональної автоматизації.
</Card>

</CardGroup>

## Свіже з Discord

Недавні яскраві приклади з кодування, devtools, мобільних застосунків і chat-native створення продуктів.

<CardGroup cols={2}>

<Card title="PR Review до відгуку в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну, відкриває PR, OpenClaw перевіряє diff і відповідає в Telegram порадами та чітким вердиктом щодо merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Відгук OpenClaw щодо PR review, доставлений у Telegram" />
</Card>

<Card title="Skill для винного льоху за кілька хвилин" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) створити локальний Skill для винного льоху. Він запитує приклад експорту CSV і шлях збереження, а потім будує й тестує Skill (у прикладі — 962 пляшки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює локальний Skill для винного льоху з CSV" />
</Card>

<Card title="Автопілот покупок Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Щотижневий план харчування, звичні товари, бронювання слота доставки, підтвердження замовлення. Жодних API, лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок Tesco через чат" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Гаряча клавіша для ділянки екрана, Gemini vision, миттєвий Markdown у вашому буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG screenshot-to-markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Десктопний застосунок для керування skills і командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Голосові повідомлення Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Спільнота** • `voice` `tts` `telegram`

Обгортає TTS від papla.media й надсилає результати як голосові повідомлення Telegram (без дратівливого автопрогравання).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вивід TTS як голосове повідомлення Telegram" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Допоміжний інструмент, що встановлюється через Homebrew, для перегляду списку, інспекції й спостереження за локальними сесіями OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor у ClawHub" />
</Card>

<Card title="Керування 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керування та діагностика принтерів BambuLab: стан, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI у ClawHub" />
</Card>

<Card title="Транспорт Відня (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, збої, стан ліфтів і маршрути для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien у ClawHub" />
</Card>

<Card title="Шкільні обіди ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільних обідів у Великій Британії через ParentPay. Використовує координати миші для надійного натискання на клітинки таблиці.
</Card>

<Card title="Завантаження в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантаження в Cloudflare R2/S3 і генерація безпечних presigned-посилань для завантаження. Корисно для віддалених інстансів OpenClaw.
</Card>

<Card title="iOS-застосунок через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Створив повноцінний iOS-застосунок із картами й записом голосу та розгорнув його в TestFlight повністю через чат у Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-застосунок у TestFlight" />
</Card>

<Card title="Помічник здоров’я для Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-помічник зі здоров’я, який інтегрує дані Oura ring з календарем, зустрічами й розкладом спортзалу.

  <img src="/assets/showcase/oura-health.png" alt="Помічник здоров’я для Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ агентів)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ агентів під одним gateway, де orchestrator Opus 4.5 делегує роботу виконавцям Codex. Див. [технічний розбір](https://github.com/adam91holt/orchestrated-ai-articles) і [Clawdspace](https://github.com/adam91holt/clawdspace) для sandboxing агентів.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, що інтегрується з agentic-робочими процесами (Claude Code, OpenClaw). Керуйте issue, проєктами й робочими процесами з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читайте, надсилайте й архівуйте повідомлення через Beeper Desktop. Використовує локальний MCP API Beeper, щоб агенти могли керувати всіма вашими чатами (iMessage, WhatsApp та іншими) в одному місці.
</Card>

</CardGroup>

## Автоматизація та робочі процеси

Планування, керування браузером, цикли підтримки та сторона продукту «просто виконай це завдання за мене».

<CardGroup cols={2}>

<Card title="Керування очищувачем повітря Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, після чого OpenClaw взяв керування на себе для підтримання якості повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Гарні знімки неба з камери" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запуск від камери на даху: попросіть OpenClaw зробити фото неба, коли воно виглядає гарно. Він розробив Skill і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з камери на даху, зроблений OpenClaw" />
</Card>

<Card title="Візуальна сцена ранкового брифінгу" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланований prompt щоранку генерує одне сценічне зображення (погода, завдання, дата, улюблений пост або цитата) через persona OpenClaw.
</Card>

<Card title="Бронювання корту для паделу" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

CLI для перевірки доступності Playtomic і бронювання. Більше ніколи не пропустіть вільний корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Збір бухгалтерських документів" icon="file-invoice-dollar">
  **Спільнота** • `automation` `email` `pdf`

Збирає PDF з email і готує документи для податкового консультанта. Щомісячна бухгалтерія на автопілоті.
</Card>

<Card title="Режим розробки з дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудував персональний сайт через Telegram, дивлячись Netflix — від Notion до Astro, перенесено 18 постів, DNS переведено на Cloudflare. Ноутбук навіть не відкривав.
</Card>

<Card title="Агент для пошуку роботи" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами з CV і повертає релевантні можливості з посиланнями. Створено за 30 хвилин з використанням JSearch API.
</Card>

<Card title="Конструктор Skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw підключився до Jira, а потім згенерував новий Skill на льоту (ще до того, як він з’явився в ClawHub).
</Card>

<Card title="Skill для Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і змусив OpenClaw згенерувати Skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Заходить у TradingView через автоматизацію браузера, робить скриншоти графіків і виконує технічний аналіз на вимогу. API не потрібен — лише керування браузером.
</Card>

<Card title="Автопідтримка у Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за каналом компанії у Slack, корисно відповідає і пересилає сповіщення в Telegram. Автономно виправив production-баг у розгорнутому застосунку без будь-якого запиту.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, які індексують, шукають, запам’ятовують і міркують над персональними або командними знаннями.

<CardGroup cols={2}>

<Card title="xuezh для вивчення китайської" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Рушій для вивчення китайської з оцінюванням вимови й навчальними потоками через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Відгук про вимову в xuezh" />
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Спільнота** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує понад 1k голосових повідомлень, звіряє з git logs і формує пов’язані markdown-звіти.
</Card>

<Card title="Семантичний пошук Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає vector search до закладок Karakeep за допомогою Qdrant та embeddings OpenAI або Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Спільнота** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, який перетворює файли сесій на спогади, потім на переконання, а потім на еволюційну self model.
</Card>

</CardGroup>

## Голос і телефонія

Точки входу зі speech-first, телефонні мости та робочі процеси з інтенсивним транскрибуванням.

<CardGroup cols={2}>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-міст від голосового асистента Vapi до OpenClaw. Майже реальні телефонні дзвінки з вашим агентом.
</Card>

<Card title="Транскрибування через OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовне транскрибування аудіо через OpenRouter (Gemini та інші). Доступно в ClawHub.
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання й інтеграції, які полегшують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Add-on для Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, що працює на Home Assistant OS, з підтримкою SSH-тунелю та постійного стану.
</Card>

<Card title="Skill для Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Керуйте й автоматизуйте пристрої Home Assistant природною мовою.
</Card>

<Card title="Пакування Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Nixified-конфігурація OpenClaw з укомплектованими батарейками для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill календаря на базі khal і vdirsyncer. Self-hosted інтеграція календаря.
</Card>

</CardGroup>

## Дім і обладнання

Фізичний бік OpenClaw: будинки, сенсори, камери, пилососи та інші пристрої.

<CardGroup cols={2}>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Автоматизація дому, нативна для Nix, з OpenClaw як інтерфейсом, плюс панелі Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель Grafana GoHome" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте своїм роботом-пилососом Roborock через природну розмову.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

Речі, які виросли за межі одного робочого процесу в ширші продукти або екосистеми.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс обладнання для астрономії. Створений за допомогою та навколо екосистеми OpenClaw.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте в [#self-promotion на Discord](https://discord.gg/clawd) або [напишіть твіт із @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Додайте деталі">
    Розкажіть, що він робить, додайте посилання на repo або демо та поділіться скриншотом, якщо він у вас є.
  </Step>
  <Step title="Потрапте у добірку">
    Ми додамо найяскравіші проєкти на цю сторінку.
  </Step>
</Steps>
