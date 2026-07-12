---
description: Real-world OpenClaw projects from the community
read_when:
    - Пошук реальних прикладів використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Проєкти та інтеграції від спільноти на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-07-12T13:50:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Спільнотні проєкти OpenClaw: цикли перевірки PR, мобільні застосунки, домашня автоматизація, голосові системи, інструменти розробника та робочі процеси пам’яті, створені для нативної роботи в чатах Telegram, WhatsApp, Discord і терміналах.

<Info>
**Хочете потрапити до добірки?** Поділіться своїм проєктом у [#self-promotion у Discord](https://discord.gg/clawd) або [позначте @openclaw у X](https://x.com/openclaw).
</Info>

## Свіже з Discord

Нещодавні яскраві проєкти у сферах програмування, інструментів розробника, мобільних технологій і створення продуктів, нативних для чатів.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Скажіть своєму агенту «розгорни цей HTML» — і приблизно за секунду отримаєте загальнодоступну URL-адресу. Сторінки автоматично видаляються через годину — без сервера, конфігурації та реєстрації.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Вставте будь-яку URL-адресу й отримайте висновок. Понад 2,5 млн шахрайських доменів із 38 джерел (PhishTank, OpenPhish, CERT.PL та інших) перевіряються локально, тому історія переглядів ніколи не залишає пристрій.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Тріо для роботи над продуктом: [Сократівський діалог](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) ретельно розбирає запитання перед відповіддю, [Стратег моделі Кано](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) визначає, які функції справді заслуговують на своє місце, а [Зрозумілий результат агента](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) переписує результат роботи агента простою мовою.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Не дає оркестраторам простоювати, поки працюють підагенти: асинхронний механізм зворотного виклику, у якому результати надходять до поштової скриньки замість блокування батьківського агента.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Зберігає OpenClaw придатним до роботи на пристроях із 2–4 ГБ пам’яті: перевіряє вільну пам’ять і вимикає ресурсомісткі функції, перш ніж система почне активно використовувати файл підкачки. [Джерельний код на GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Засіб відстеження вартості токенів від інженера NVIDIA з повноцінною підтримкою OpenClaw: точно показує витрати вашого агента для кожної моделі та кожного сеансу.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Опишіть діаграму в чаті й отримайте програмно згенерований ескіз Excalidraw.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw створив власний інструмент запитів до Google Analytics, а потім його запакували й опублікували в ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Порівнює моделі для 59 ролей агентів, щоб відповісти на запитання «яку LLM вибрати для мого GPU?». Улюблений спільнотою інструмент для вибору локальних моделей.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Незалежне від постачальника генерування пісень: сплануйте композицію, структуруйте текст і доопрацюйте недостатньо деталізовані результати замість використання одного запиту. Також доступний [варіант для MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) з керуванням BPM, тональністю, структурою та мешапами.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну й відкриває PR, OpenClaw перевіряє різницю та відповідає в Telegram із пропозиціями й чітким висновком щодо злиття.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

У «Robby» (@openclaw) попросили локальний засіб для обліку винного льоху. Він запитує приклад експорту CSV і шлях до сховища, а потім створює та тестує засіб (у прикладі — 962 пляшки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Щотижневий план харчування, звичні товари, бронювання часу доставки, підтвердження замовлення. Жодних API — лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Виділіть ділянку екрана гарячою клавішею, обробіть її за допомогою комп’ютерного зору Gemini й миттєво отримайте Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настільний застосунок для керування Skills і командами в Agents, Claude, Codex та OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Спільнота** • `voice` `tts` `telegram`

Огортає TTS від papla.media та надсилає результати як голосові повідомлення Telegram (без надокучливого автоматичного відтворення).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Допоміжний інструмент, установлений через Homebrew, для перегляду списку, перевірки та спостереження за локальними сеансами OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керуйте принтерами BambuLab і усувайте проблеми з ними: стан, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, перебої, стан ліфтів і прокладання маршрутів у громадському транспорті Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільного харчування у Великій Британії через ParentPay. Для надійного натискання клітинок таблиці використовує координати миші.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантажує файли до Cloudflare R2/S3 і генерує безпечні попередньо підписані посилання для завантаження. Корисно для віддалених екземплярів OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Повноцінний застосунок для iOS із картами й записуванням голосу було створено та підготовлено до розповсюдження через App Store цілком у чаті Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний помічник зі здоров’я на основі ШІ, який поєднує дані кільця Oura з календарем, записами на прийом і розкладом тренувань.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Понад 14 агентів під керуванням одного Gateway, де оркестратор Opus 4.5 делегує завдання виконавцям Codex. Докладніше дивіться в [технічному описі](https://github.com/adam91holt/orchestrated-ai-articles), а про ізоляцію агентів — у [Clawdspace](https://github.com/adam91holt/clawdspace).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, який інтегрується з агентними робочими процесами (Claude Code, OpenClaw). Керуйте завданнями, проєктами та робочими процесами з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читайте, надсилайте й архівуйте повідомлення через Beeper Desktop. Використовує локальний MCP API Beeper, щоб агенти могли керувати всіма вашими чатами (iMessage, WhatsApp тощо) в одному місці.
</Card>

</CardGroup>

## Автоматизація та робочі процеси

Планування, керування браузером, цикли підтримки та аспект продукту «просто виконай це завдання за мене».

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, після чого OpenClaw перебирає керування якістю повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускається камерою на даху: попросіть OpenClaw фотографувати небо щоразу, коли воно має гарний вигляд. Він спроєктував засіб і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланований запит щоранку генерує одне зображення-сцену (погода, завдання, дата, улюблена публікація або цитата) за допомогою персонажа OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Засіб перевірки доступності Playtomic і CLI для бронювання. Більше ніколи не пропускайте вільний корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Спільнота** • `automation` `email` `pdf`

Збирає PDF-файли з електронної пошти та готує документи для податкового консультанта. Щомісячний бухгалтерський облік на автопілоті.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудував особистий сайт через Telegram під час перегляду Netflix — переніс із Notion до Astro 18 публікацій і перевів DNS до Cloudflare. Ноутбук навіть не відкривав.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами в резюме та повертає відповідні пропозиції з посиланнями. Створено за 30 хвилин за допомогою JSearch API.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw під’єднався до Jira, а потім на льоту створив новий Skill (ще до того, як він з’явився на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і налаштував OpenClaw на створення Skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входить у TradingView за допомогою автоматизації браузера, робить знімки екрана з графіками та виконує технічний аналіз на запит. API не потрібен — лише керування браузером.
</Card>

<Card title="Переговори щодо автомобіля (заощаджено $4 200)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw доручили вести переговори з автодилерами: він самостійно провів усе листування та домігся зниження ціни на $4 200.
</Card>

<Card title="Автоматична реєстрація на рейс" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Знаходить у пошті інформацію про найближчий рейс, проходить онлайн-реєстрацію та вибирає місце біля вікна — застосунок авіакомпанії не потрібен.
</Card>

<Card title="Подання страхової заяви" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Автономно подав страхову заяву та запланував наступну зустріч.
</Card>

<Card title="Skill для нерухомості Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI для API Idealista, призначений для пошуку нерухомості та її оцінювання й оформлений як Skill, щоб агент міг шукати житло безпосередньо в чаті.
</Card>

<Card title="Адміністративна автоматизація садівничого бізнесу" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Відстежує робочі замовлення в Gmail, аналізує фотографії об’єктів, надіслані через Telegram, створює багатосторінкові PDF із кошторисами в LaTeX і виставляє рахунки через Xero.
</Card>

<Card title="Автоматична підтримка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за корпоративним каналом Slack, надає корисні відповіді та пересилає сповіщення в Telegram. Без окремого запиту автономно виправив помилку в розгорнутому робочому застосунку.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, які індексують, шукають, запам’ятовують і аналізують особисті або командні знання.

<CardGroup cols={2}>

<Card title="Вивчення китайської мови з xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Система вивчення китайської мови зі зворотним зв’язком щодо вимови та навчальними сценаріями через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Зворотний зв’язок xuezh щодо вимови" />
</Card>

<Card title="Конвеєр аналізу дописів у X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Зібрав 4 мільйони дописів зі 100 провідних облікових записів X і перетворив їх на аналітичний конвеєр із можливістю виконання запитів.
</Card>

<Card title="Результати аналізів у Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Упорядкував результати лабораторних аналізів крові за багато років у структурованій базі даних Notion.
</Card>

<Card title="Другий мозок в Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Асистент для щоденного використання у WhatsApp, уся пам’ять якого зберігається у форматі Markdown у сховищі Obsidian із контролем версій: відстеження калорій і тренувань, списки справ та керування повсякденними справами.
</Card>

<Card title="Бот сімейної історії" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Працює в сімейному груповому чаті Telegram, документує історії понад 50 родичів і ставить доречні уточнювальні запитання, відповідаючи носіям мови непальською.
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Спільнота** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує понад тисячу голосових повідомлень, звіряє їх із журналами git і створює пов’язані звіти у форматі Markdown.
</Card>

<Card title="Семантичний пошук Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає векторний пошук до закладок Karakeep за допомогою Qdrant і векторних представлень від OpenAI або Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Спільнота** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, який перетворює файли сеансів спочатку на спогади, потім на переконання, а згодом — на саморозвиткову модель особистості.
</Card>

</CardGroup>

## Голос і телефонія

Точки входу з пріоритетом голосового керування, телефонні мости та робочі процеси з інтенсивним використанням транскрибування.

<CardGroup cols={2}>

<Card title="Голосове керування одним дотиком через Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Один дотик до Pebble Ring розпочинає голосову розмову з OpenClaw — доступ до агента з носимого пристрою.
</Card>

<Card title="Медіастудія для авторів" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Повноцінна медіастудія в чаті: синтез мовлення, транскрибування та автоматизація браузера з підключенням до Codex 5.2 і MiniMax.
</Card>

<Card title="Рація через Action Button" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Action Button на iPhone під’єднано до OpenClaw: натисніть, говоріть — і агент відповість голосом, наче по рації.
</Card>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-міст між голосовим асистентом Vapi та OpenClaw. Телефонні дзвінки з вашим агентом майже в реальному часі.
</Card>

<Card title="Транскрибування через OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовне транскрибування аудіо через OpenRouter (Gemini та інші моделі). Доступне на ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill транскрибування OpenRouter на ClawHub" />
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання та інтеграції, які спрощують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Доповнення Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, що працює в Home Assistant OS із підтримкою SSH-тунелю та постійного стану.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Керування пристроями Home Assistant та їх автоматизація за допомогою природної мови.

  <img src="/assets/showcase/homeassistant.png" alt="Skill Home Assistant на ClawHub" />
</Card>

<Card title="Менеджер рядка меню macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Нативний застосунок Swift для рядка меню, який показує стан агента та надає елементи швидкого керування.
</Card>

<Card title="Пакування для Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Повністю готова конфігурація OpenClaw для Nix, призначена для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill календаря на основі khal і vdirsyncer. Інтеграція з календарем на власному сервері.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill календаря CalDAV на ClawHub" />
</Card>

</CardGroup>

## Дім і обладнання

Фізична сторона OpenClaw: оселі, датчики, камери, пилососи та інші пристрої.

<CardGroup cols={2}>

<Card title="Самостійно створений Skill для HomePod" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw знайшов пристрої HomePod у локальній мережі та сам створив Skill для керування ними.
</Card>

<Card title="Інтерфейс у вигляді голографічного куба за $35" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Недорогий голографічний куб слугує фізичним обличчям агента на робочому столі.
</Card>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Нативна для Nix домашня автоматизація з OpenClaw як інтерфейсом і панелями Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель Grafana для GoHome" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте роботом-пилососом Roborock за допомогою природної розмови.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

Розробки, які вийшли за межі окремого робочого процесу й перетворилися на ширші продукти або екосистеми.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс астрономічного обладнання. Створений за допомогою екосистеми OpenClaw і навколо неї.
</Card>

<Card title="Протокол переговорів між агентами Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Відкриті переговори між агентами: ваш агент узгоджує угоди, розклади та домовленості про послуги з іншими вузлами й криптографічно підписує результат — вам залишається лише схвалити або відхилити його.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте його в [#self-promotion у Discord](https://discord.gg/clawd) або [напишіть у X обліковому запису @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Додайте подробиці">
    Розкажіть, що він робить, додайте посилання на репозиторій або демонстрацію та поділіться знімком екрана, якщо він у вас є.
  </Step>
  <Step title="Потрапте до добірки">
    Ми додамо найвизначніші проєкти на цю сторінку.
  </Step>
</Steps>

## Пов’язані матеріали

- [Початок роботи](/uk/start/getting-started)
- [OpenClaw](/uk/start/openclaw)
- [Повна добірка з X на openclaw.ai](https://openclaw.ai/showcase/)
