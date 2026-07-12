---
description: Real-world OpenClaw projects from the community
read_when:
    - Ищете реальные примеры использования OpenClaw
    - Обновление обзора проектов сообщества
summary: Проекты и интеграции сообщества на базе OpenClaw
title: Витрина
x-i18n:
    generated_at: "2026-07-12T11:54:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Проекты OpenClaw, созданные сообществом: циклы проверки PR, мобильные приложения, домашняя автоматизация, голосовые системы, инструменты разработчика и рабочие процессы с памятью, реализованные в виде нативных чатов в Telegram, WhatsApp, Discord и терминалах.

<Info>
**Хотите попасть в подборку?** Поделитесь своим проектом в [#self-promotion в Discord](https://discord.gg/clawd) или [отметьте @openclaw в X](https://x.com/openclaw).
</Info>

## Новинки из Discord

Недавние выдающиеся проекты в области программирования, инструментов разработчика, мобильных приложений и создания продуктов с нативным чат-интерфейсом.

<CardGroup cols={2}>

<Card title="Мгновенная публикация HTML с Dropage" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Скажите агенту «разверни этот HTML» и примерно через секунду получите общедоступный URL. Через час страницы автоматически удаляются — без сервера, конфигурации и регистрации.
</Card>

<Card title="Проверка URL на мошенничество" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Вставьте любой URL и получите заключение. Более 2,5 млн мошеннических доменов из 38 источников (PhishTank, OpenPhish, CERT.PL и других) сопоставляются локально, поэтому история просмотров никогда не покидает устройство.
</Card>

<Card title="Skills для обоснования продуктовых решений" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Три инструмента для продуктовой работы: [Сократический диалог](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) тщательно разбирает вопрос перед ответом, [Стратег по модели Кано](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) определяет, какие функции заслуживают места в продукте, а [Понятный вывод агента](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) переписывает вывод агента простым языком.
</Card>

<Card title="Почтовый брокер для субагентов" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Не позволяет оркестраторам простаивать во время работы субагентов: асинхронный механизм обратных вызовов помещает результаты в почтовый ящик вместо блокировки родительского агента.
</Card>

<Card title="Облегчённый режим для устройств с малым объёмом ОЗУ" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Позволяет использовать OpenClaw на устройствах с 2–4 ГБ памяти: проверяет объём свободной памяти и отключает ресурсоёмкие функции до того, как система начнёт активно использовать файл подкачки. [Исходный код на GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="Отслеживание расходов tokenomics" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Средство отслеживания стоимости токенов от инженера NVIDIA с полноценной поддержкой OpenClaw: показывает, на что именно расходуются средства агента, с разбивкой по моделям и сеансам.
</Card>

<Card title="Генератор диаграмм Excalidraw" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Опишите диаграмму в чате и получите программно созданный эскиз Excalidraw.
</Card>

<Card title="Skill для аналитики GA4" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw создал собственный инструмент запросов к Google Analytics, а затем упаковал и опубликовал его в ClawHub.
</Card>

<Card title="Рейтинг моделей ClawEval" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Сравнивает модели в 59 агентских ролях, чтобы ответить на вопрос «какая LLM подойдёт для моего графического процессора?». Популярный в сообществе инструмент для выбора локальных моделей.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Независимая от провайдера генерация песен: планирование композиции, структурирование текста и доработка неполных результатов вместо однократного запроса. Включает [вариант для MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) с управлением темпом, тональностью, структурой и созданием мэшапов.
</Card>

<Card title="Обратная связь по проверке PR в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершает изменение и открывает PR, OpenClaw проверяет различия и отвечает в Telegram, предлагая улучшения и вынося однозначный вердикт о слиянии.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Отзыв OpenClaw о проверке PR, доставленный в Telegram" />
</Card>

<Card title="Skill для винного погреба за считаные минуты" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

У «Robby» (@openclaw) запросили локальный skill для винного погреба. Он запрашивает образец экспорта CSV и путь к хранилищу, а затем создаёт и тестирует skill (в примере — 962 бутылки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw создаёт локальный skill для винного погреба из CSV" />
</Card>

<Card title="Автопилот для покупок в Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Составляет еженедельный план питания, добавляет привычные товары, бронирует интервал доставки и подтверждает заказ. Никаких API — только управление браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизация покупок в Tesco через чат" />
</Card>

<Card title="Преобразование снимков экрана в Markdown с помощью SNAG" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Выберите область экрана горячей клавишей, обработайте её с помощью компьютерного зрения Gemini и мгновенно получите Markdown в буфере обмена.

  <img src="/assets/showcase/snag.png" alt="Инструмент SNAG для преобразования снимков экрана в Markdown" />
</Card>

<Card title="Интерфейс Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настольное приложение для управления Skills и командами в Agents, Claude, Codex и OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Приложение Agents UI" />
</Card>

<Card title="Голосовые сообщения Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Сообщество** • `voice` `tts` `telegram`

Использует TTS от papla.media и отправляет результаты в виде голосовых сообщений Telegram без раздражающего автоматического воспроизведения.

  <img src="/assets/showcase/papla-tts.jpg" alt="Голосовое сообщение Telegram, созданное с помощью TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Устанавливаемый через Homebrew вспомогательный инструмент для просмотра списка, изучения и отслеживания локальных сеансов OpenAI Codex (CLI и VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor в ClawHub" />
</Card>

<Card title="Управление 3D-принтерами Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Управление принтерами BambuLab и устранение неполадок: состояние, задания, камера, AMS, калибровка и многое другое.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI в ClawHub" />
</Card>

<Card title="Транспорт Вены (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Отправления в реальном времени, сбои, состояние лифтов и построение маршрутов в общественном транспорте Вены.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien в ClawHub" />
</Card>

<Card title="Школьное питание ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматическое бронирование школьного питания в Великобритании через ParentPay. Для надёжного выбора ячеек таблицы используются координаты указателя мыши.
</Card>

<Card title="Загрузка в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Загрузка в Cloudflare R2/S3 и создание защищённых предварительно подписанных ссылок для скачивания. Полезно для удалённых экземпляров OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill для загрузки в R2 в ClawHub" />
</Card>

<Card title="Приложение iOS через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Полноценное приложение iOS с картами и записью голоса создано и подготовлено к публикации в App Store исключительно через чат Telegram.
</Card>

<Card title="Помощник по здоровью с Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональный ИИ-помощник по здоровью, объединяющий данные кольца Oura с календарём, встречами и расписанием тренировок.

  <img src="/assets/showcase/oura-health.png" alt="Помощник по здоровью с кольцом Oura" />
</Card>

<Card title="Команда мечты Кева (более 14 агентов)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Более 14 агентов под управлением одного Gateway, где оркестратор Opus 4.5 делегирует задачи рабочим агентам Codex. Подробнее см. в [техническом описании](https://github.com/adam91holt/orchestrated-ai-articles) и проекте [Clawdspace](https://github.com/adam91holt/clawdspace), предназначенном для изоляции агентов.
</Card>

<Card title="CLI для Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, интегрируемый с агентскими рабочими процессами (Claude Code, OpenClaw). Позволяет управлять задачами, проектами и рабочими процессами из терминала.
</Card>

<Card title="CLI для Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Чтение, отправка и архивирование сообщений через Beeper Desktop. Использует локальный MCP API Beeper, чтобы агенты могли управлять всеми вашими чатами (iMessage, WhatsApp и другими) в одном месте.
</Card>

</CardGroup>

## Автоматизация и рабочие процессы

Планирование, управление браузером, циклы поддержки и та часть продукта, которая позволяет сказать: «просто выполни задачу за меня».

<CardGroup cols={2}>

<Card title="Управление очистителем воздуха Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code обнаружил и подтвердил элементы управления очистителем, после чего OpenClaw взял на себя управление качеством воздуха в помещении.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Управление очистителем воздуха Winix через OpenClaw" />
</Card>

<Card title="Красивые снимки неба с камеры" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускается камерой на крыше: попросите OpenClaw делать снимок неба всякий раз, когда оно выглядит красиво. Он разработал skill и сделал снимок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Снимок неба с камеры на крыше, сделанный OpenClaw" />
</Card>

<Card title="Визуальная сцена для утренней сводки" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланированный запрос каждое утро создаёт одно изображение-сцену (погода, задачи, дата, любимая публикация или цитата) с помощью персонажа OpenClaw.
</Card>

<Card title="Бронирование корта для падела" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Средство проверки доступности Playtomic и CLI для бронирования. Больше ни одного упущенного свободного корта.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Снимок экрана padel-cli" />
</Card>

<Card title="Сбор бухгалтерских документов" icon="file-invoice-dollar">
  **Сообщество** • `automation` `email` `pdf`

Собирает PDF-файлы из электронной почты и подготавливает документы для налогового консультанта. Ежемесячная бухгалтерия на автопилоте.
</Card>

<Card title="Режим разработки с дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Полностью перестроил личный сайт через Telegram во время просмотра Netflix: перенёс данные из Notion в Astro, мигрировал 18 публикаций и перевёл DNS на Cloudflare. Ноутбук даже не пришлось открывать.
</Card>

<Card title="Агент для поиска работы" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Ищет вакансии, сопоставляет их с ключевыми словами из резюме и возвращает подходящие предложения со ссылками. Создан за 30 минут с использованием API JSearch.
</Card>

<Card title="Конструктор skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw подключился к Jira, а затем на лету создал новый навык (до того, как он появился в ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизировал задачи Todoist и поручил OpenClaw создать навык прямо в чате Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входит в TradingView с помощью автоматизации браузера, делает снимки графиков и по запросу проводит технический анализ. API не требуется — достаточно управления браузером.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw самостоятельно вел переговоры с автодилерами: он занимался всей перепиской и добился снижения цены на 4 200 долларов.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Находит в электронной почте ближайший рейс, выполняет онлайн-регистрацию и выбирает место у окна — приложение авиакомпании не требуется.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Самостоятельно подал страховое требование и назначил последующую встречу.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI для API Idealista, предназначенный для поиска и оценки недвижимости, оформлен как навык, чтобы агент мог искать жилье прямо в чате.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Отслеживает заказы на работы в Gmail, анализирует фотографии объектов, отправленные через Telegram, создает многостраничные PDF-файлы с коммерческими предложениями в LaTeX и выставляет счета через Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Следит за корпоративным каналом Slack, предоставляет полезные ответы и пересылает уведомления в Telegram. Без дополнительных указаний самостоятельно исправил ошибку в развернутом рабочем приложении.
</Card>

</CardGroup>

## Знания и память

Системы, которые индексируют, ищут, запоминают и анализируют личные или командные знания.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Система изучения китайского языка с обратной связью по произношению и учебными сценариями через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Собрал 4 миллиона публикаций из 100 ведущих учетных записей X и преобразовал их в аналитический конвейер с возможностью выполнения запросов.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Систематизировал результаты анализов крови за несколько лет в структурированной базе данных Notion.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Повседневный помощник в WhatsApp, вся память которого хранится в виде файлов Markdown в хранилище Obsidian под управлением версий: учет калорий и тренировок, списки дел и решение бытовых организационных задач.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Работает в семейном групповом чате Telegram, документирует истории более чем 50 родственников и задает содержательные уточняющие вопросы, отвечая носителям языка на непальском.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Сообщество** • `memory` `transcription` `indexing`

Загружает полные экспорты WhatsApp, расшифровывает более тысячи голосовых сообщений, сверяет данные с журналами git и создает связанные отчеты в формате Markdown.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Добавляет в закладки Karakeep векторный поиск с использованием Qdrant и эмбеддингов OpenAI или Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Сообщество** • `memory` `beliefs` `self-model`

Отдельный диспетчер памяти, который преобразует файлы сеансов сначала в воспоминания, затем в убеждения, а потом в развивающуюся модель самого себя.
</Card>

</CardGroup>

## Голосовая связь и телефон

Точки входа с приоритетом голосового взаимодействия, телефонные шлюзы и рабочие процессы с интенсивным использованием расшифровки речи.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Одно нажатие на Pebble Ring начинает голосовой разговор с OpenClaw, предоставляя доступ к агенту с носимого устройства.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Полноценная медиастудия в чате: синтез и распознавание речи, а также автоматизация браузера, подключенные к Codex 5.2 и MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Кнопка действия iPhone подключена к OpenClaw: нажмите, говорите, и агент ответит голосом, как по рации.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-шлюз между голосовым помощником Vapi и OpenClaw. Телефонные разговоры с вашим агентом практически в реальном времени.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Многоязычная расшифровка аудио через OpenRouter с использованием Gemini и других моделей. Доступно в ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Инфраструктура и развертывание

Упаковка, развертывание и интеграции, упрощающие запуск и расширение OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, работающий в Home Assistant OS, с поддержкой туннеля SSH и постоянного состояния.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Управление устройствами Home Assistant и их автоматизация с помощью естественного языка.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Нативное приложение Swift для строки меню, отображающее состояние агента и предоставляющее элементы быстрого управления.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Полнофункциональная конфигурация OpenClaw для Nix, обеспечивающая воспроизводимые развертывания.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Навык календаря, использующий khal и vdirsyncer. Интеграция с календарем, размещенным на собственном сервере.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Дом и оборудование

Физическая сторона OpenClaw: дома, датчики, камеры, пылесосы и другие устройства.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw обнаружил устройства HomePod в локальной сети и самостоятельно создал навык для управления ими.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Недорогой голографический куб, служащий физическим лицом агента на рабочем столе.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Нативная для Nix домашняя автоматизация с OpenClaw в качестве интерфейса и панелями мониторинга Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Управляйте роботом-пылесосом Roborock с помощью обычного разговора.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Проекты сообщества

Проекты, которые вышли за рамки одного рабочего процесса и превратились в более крупные продукты или экосистемы.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Сообщество** • `marketplace` `astronomy` `webapp`

Полноценная торговая площадка астрономического оборудования. Создана с использованием экосистемы OpenClaw и вокруг нее.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Открытый протокол переговоров между агентами: ваш агент договаривается с другими узлами о сделках, расписаниях и соглашениях об оказании услуг, а затем криптографически подписывает результат — вам остается только одобрить или отклонить его.
</Card>

</CardGroup>

## Отправьте свой проект

<Steps>
  <Step title="Share it">
    Опубликуйте его в [#self-promotion в Discord](https://discord.gg/clawd) или [напишите @openclaw в X](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Расскажите, что делает проект, добавьте ссылку на репозиторий или демонстрацию и поделитесь снимком экрана, если он у вас есть.
  </Step>
  <Step title="Get featured">
    Мы добавим выдающиеся проекты на эту страницу.
  </Step>
</Steps>

## См. также

- [Начало работы](/ru/start/getting-started)
- [OpenClaw](/ru/start/openclaw)
- [Полная подборка публикаций X на openclaw.ai](https://openclaw.ai/showcase/)
