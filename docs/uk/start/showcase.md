---
description: Real-world OpenClaw projects from the community
read_when:
    - Шукаєте реальні приклади використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Створені спільнотою проєкти та інтеграції на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-04-23T16:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95dc12399a1a263c268671ffccfc86b069ec908a5bf40adc00663153c281d7d
    source_path: start/showcase.md
    workflow: 15
---

# Вітрина

Проєкти OpenClaw — це не іграшкові демо. Люди запускають цикли перевірки PR, мобільні застосунки, домашню автоматизацію, голосові системи, devtools і робочі процеси з великим обсягом пам’яті з тих каналів, якими вони вже користуються — нативні для чату збірки в Telegram, WhatsApp, Discord і терміналах; реальна автоматизація для бронювання, покупок і підтримки без очікування на API; а також інтеграції з фізичним світом — із принтерами, пилососами, камерами та домашніми системами.

<Info>
**Хочете потрапити у добірку?** Поділіться своїм проєктом у [#self-promotion на Discord](https://discord.gg/clawd) або [позначте @openclaw у X](https://x.com/openclaw).
</Info>

## Відео

Почніть тут, якщо хочете найкоротший шлях від «що це таке?» до «гаразд, я зрозумів».

<CardGroup cols={3}>

<Card title="Повний покроковий посібник із налаштування" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 хвилин. Встановлення, онбординг і шлях до першого працездатного асистента від початку до кінця.
</Card>

<Card title="Відеодобірка проєктів спільноти" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Швидший огляд реальних проєктів, поверхонь і робочих процесів, побудованих навколо OpenClaw.
</Card>

<Card title="Проєкти в реальному використанні" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Приклади від спільноти — від нативних для чату циклів програмування до обладнання та персональної автоматизації.
</Card>

</CardGroup>

## Свіже з Discord

Нещодавні помітні приклади в програмуванні, devtools, мобільних застосунках і створенні продуктів, нативних для чату.

<CardGroup cols={2}>

<Card title="Від перевірки PR до відгуку в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну, відкриває PR, OpenClaw перевіряє diff і відповідає в Telegram рекомендаціями та чітким вердиктом щодо злиття.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Відгук OpenClaw щодо перевірки PR, доставлений у Telegram" />
</Card>

<Card title="Skill для винного погреба за лічені хвилини" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили «Robby» (@openclaw) створити локальний Skill для винного погреба. Він запитує зразок експорту CSV і шлях збереження, а потім створює та тестує Skill (962 пляшки в прикладі).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює локальний Skill для винного погреба з CSV" />
</Card>

<Card title="Автопілот для покупок у Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Щотижневий план харчування, звичні товари, бронювання слота доставки, підтвердження замовлення. Жодних API — лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок у Tesco через чат" />
</Card>

<Card title="SNAG: зі скриншота в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Вибір області екрана гарячою клавішею, Gemini vision, миттєвий Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG для перетворення скриншотів у markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Десктопний застосунок для керування Skills і командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Голосові повідомлення Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Спільнота** • `voice` `tts` `telegram`

Обгортає papla.media TTS і надсилає результати як голосові повідомлення Telegram (без набридливого автовідтворення).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вивід TTS як голосове повідомлення Telegram" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Помічник, що встановлюється через Homebrew, для перегляду, інспекції та відстеження локальних сесій OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor у ClawHub" />
</Card>

<Card title="Керування 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керування й діагностика принтерів BambuLab: стан, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI у ClawHub" />
</Card>

<Card title="Транспорт Відня (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, збої, стан ліфтів і маршрути для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien у ClawHub" />
</Card>

<Card title="Шкільне харчування через ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільного харчування у Великій Британії через ParentPay. Використовує координати миші для надійного натискання на клітинки таблиці.
</Card>

<Card title="Завантаження в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантаження в Cloudflare R2/S3 і генерація безпечних presigned-посилань для завантаження. Корисно для віддалених інстансів OpenClaw.
</Card>

<Card title="iOS-застосунок через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Повністю створений iOS-застосунок із картами та записом голосу, розгорнутий у TestFlight цілком через чат у Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-застосунок у TestFlight" />
</Card>

<Card title="Помічник для здоров’я з Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-помічник для здоров’я, який інтегрує дані Oura ring із календарем, записами на прийом і графіком тренувань.

  <img src="/assets/showcase/oura-health.png" alt="Помічник для здоров’я з Oura ring" />
</Card>

<Card title="Dream Team Кева (14+ агентів)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ агентів під одним Gateway з оркестратором Opus 4.5, який делегує роботу воркерам Codex. Дивіться [технічний опис](https://github.com/adam91holt/orchestrated-ai-articles) і [Clawdspace](https://github.com/adam91holt/clawdspace) для ізоляції агентів у sandbox.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, який інтегрується з агентними робочими процесами (Claude Code, OpenClaw). Керуйте задачами, проєктами та робочими процесами з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читання, надсилання та архівування повідомлень через Beeper Desktop. Використовує локальний API MCP Beeper, тож агенти можуть керувати всіма вашими чатами (iMessage, WhatsApp та іншими) в одному місці.
</Card>

</CardGroup>

## Автоматизація та робочі процеси

Планування, керування браузером, цикли підтримки та той бік продукту, де він «просто виконує завдання за мене».

<CardGroup cols={2}>

<Card title="Керування очищувачем повітря Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, після чого OpenClaw перебирає керування якістю повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Гарні знімки неба з камери" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускається від камери на даху: попросіть OpenClaw зробити фото неба щоразу, коли воно має гарний вигляд. Він спроєктував Skill і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з камери на даху, зроблений OpenClaw" />
</Card>

<Card title="Візуальна сцена ранкового брифінгу" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланований запит щоранку генерує одне сценічне зображення (погода, завдання, дата, улюблений допис або цитата) через персонажу OpenClaw.
</Card>

<Card title="Бронювання корту для паделу" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

CLI для перевірки доступності в Playtomic і бронювання. Більше ніколи не пропускайте вільний корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Збір бухгалтерських документів" icon="file-invoice-dollar">
  **Спільнота** • `automation` `email` `pdf`

Збирає PDF з електронної пошти, готує документи для податкового консультанта. Щомісячна бухгалтерія на автопілоті.
</Card>

<Card title="Режим розробки з дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудував персональний сайт через Telegram, дивлячись Netflix — міграція з Notion на Astro, перенесено 18 дописів, DNS до Cloudflare. Ноутбук навіть не відкривав.
</Card>

<Card title="Агент для пошуку роботи" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами в CV і повертає релевантні можливості з посиланнями. Створено за 30 хвилин із використанням API JSearch.
</Card>

<Card title="Конструктор Skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw підключився до Jira, а потім згенерував новий Skill на льоту (ще до того, як він з’явився в ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і доручив OpenClaw згенерувати Skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз у TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Виконує вхід у TradingView через автоматизацію браузера, робить скриншоти графіків і виконує технічний аналіз за запитом. API не потрібен — лише керування браузером.
</Card>

<Card title="Автопідтримка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за каналом компанії в Slack, корисно відповідає та пересилає сповіщення в Telegram. Автономно виправив production-баг у розгорнутому застосунку без будь-якого запиту.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, які індексують, шукають, запам’ятовують і міркують на основі особистих або командних знань.

<CardGroup cols={2}>

<Card title="xuezh для вивчення китайської" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Система для вивчення китайської мови зі зворотним зв’язком щодо вимови та навчальними сценаріями через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Зворотний зв’язок щодо вимови в xuezh" />
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Спільнота** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує понад 1 тис. голосових повідомлень, звіряє з git-логами та формує пов’язані markdown-звіти.
</Card>

<Card title="Семантичний пошук у Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає векторний пошук до закладок Karakeep за допомогою Qdrant і ембедингів OpenAI або Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Спільнота** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, який перетворює файли сесій на спогади, потім на переконання, а далі — на еволюційну модель себе.
</Card>

</CardGroup>

## Голос і телефон

Точки входу зі ставкою на мовлення, телефонні мости та робочі процеси з інтенсивною транскрибацією.

<CardGroup cols={2}>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-міст від голосового асистента Vapi до OpenClaw. Майже в реальному часі телефонні дзвінки з вашим агентом.
</Card>

<Card title="Транскрибування через OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовне транскрибування аудіо через OpenRouter (Gemini та інші). Доступно в ClawHub.
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання та інтеграції, які спрощують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Доповнення для Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, що працює на Home Assistant OS, із підтримкою SSH-тунелю та постійним станом.
</Card>

<Card title="Skill для Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Керуйте та автоматизуйте пристрої Home Assistant природною мовою.
</Card>

<Card title="Пакування для Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Готова до використання nix-конфігурація OpenClaw для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill календаря на основі khal і vdirsyncer. Самостійно розгорнута інтеграція календаря.
</Card>

</CardGroup>

## Дім і обладнання

Сторона OpenClaw, пов’язана з фізичним світом: домівки, датчики, камери, пилососи та інші пристрої.

<CardGroup cols={2}>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Автоматизація дому з нативною підтримкою Nix, де OpenClaw виступає інтерфейсом, плюс панелі Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель Grafana для GoHome" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте своїм роботом-пилососом Roborock за допомогою природної розмови.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

Речі, що вийшли за межі одного робочого процесу й перетворилися на ширші продукти або екосистеми.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс астрономічного обладнання. Створений із використанням екосистеми OpenClaw і навколо неї.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте його в [#self-promotion на Discord](https://discord.gg/clawd) або [твітніть @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Додайте деталі">
    Розкажіть, що він робить, дайте посилання на репозиторій або демо та додайте скриншот, якщо він у вас є.
  </Step>
  <Step title="Потрапте у добірку">
    Ми додамо найкращі проєкти на цю сторінку.
  </Step>
</Steps>
