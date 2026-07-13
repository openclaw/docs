---
description: Real-world OpenClaw projects from the community
read_when:
    - Поиск реальных примеров использования OpenClaw
    - Обновление списка заметных проектов сообщества
summary: Проекты и интеграции сообщества на базе OpenClaw
title: Витрина
x-i18n:
    generated_at: "2026-07-13T18:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Проекты OpenClaw, созданные сообществом: циклы проверки PR, мобильные приложения, домашняя автоматизация, голосовые системы, инструменты разработчика и процессы работы с памятью, реализованные с нативным взаимодействием через чаты в Telegram, WhatsApp, Discord и терминалах.

<Info>
**Хотите попасть в подборку?** Расскажите о своём проекте в канале [#self-promotion в Discord](https://discord.gg/clawd) или [отметьте @openclaw в X](https://x.com/openclaw).
</Info>

## Новинки из Discord

Недавние выдающиеся проекты в области программирования, инструментов разработчика, мобильных приложений и создания продуктов с нативным взаимодействием через чаты.

<CardGroup cols={2}>

<Card title="Мгновенная публикация HTML с Dropage" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Скажите агенту «опубликуй этот HTML» и примерно через секунду получите общедоступный URL. Через час страницы автоматически удаляются — без сервера, настройки и регистрации.
</Card>

<Card title="Проверка URL на мошенничество" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Вставьте любой URL и получите заключение. Более 2,5 млн мошеннических доменов из 38 источников (PhishTank, OpenPhish, CERT.PL и других) сопоставляются локально, поэтому история браузера никогда не покидает устройство.
</Card>

<Card title="Skills для анализа продуктового дизайна" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Три инструмента для работы над продуктом: [«Сократический диалог»](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) тщательно разбирает вопрос перед ответом, [«Стратег по модели Кано»](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) определяет, какие функции действительно заслуживают места в продукте, а [«Понятный вывод агента»](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) переписывает ответы агента простым языком.
</Card>

<Card title="Почтовый брокер для субагентов" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Не позволяет оркестраторам простаивать, пока субагенты выполняют работу: механизм асинхронных обратных вызовов, при котором результаты поступают в почтовый ящик, не блокируя родительского агента.
</Card>

<Card title="Облегчённый режим для устройств с малым объёмом ОЗУ" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Позволяет использовать OpenClaw на устройствах с 2–4 ГБ памяти: проверяет объём свободной памяти и отключает ресурсоёмкие функции до того, как система начнёт активно использовать файл подкачки. [Исходный код на GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="Отслеживание расходов tokenomics" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Средство отслеживания стоимости токенов от инженера NVIDIA с полноценной поддержкой OpenClaw: позволяет точно увидеть расходы агента по каждой модели и каждому сеансу.
</Card>

<Card title="Генератор диаграмм Excalidraw" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Опишите диаграмму в чате и получите программно созданный эскиз Excalidraw.
</Card>

<Card title="Плагин аналитики GA4" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw создал собственный инструмент запросов к Google Analytics, после чего его упаковали и опубликовали в ClawHub.
</Card>

<Card title="Рейтинг моделей ClawEval" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Сравнивает модели для 59 ролей агентов, чтобы ответить на вопрос «какую LLM выбрать для моего GPU?». Популярный в сообществе инструмент для выбора локальных моделей.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Независимая от провайдера генерация песен: планирование композиции, структурирование текста и доработка скудных результатов вместо генерации одним запросом. Включает [вариант для MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) с управлением BPM, тональностью, структурой и созданием мэшапов.
</Card>

<Card title="От проверки PR до обратной связи в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершает изменение и открывает PR, затем OpenClaw проверяет различия и отвечает в Telegram, предлагая улучшения и вынося однозначное решение о слиянии.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Отзыв OpenClaw по результатам проверки PR, отправленный в Telegram" />
</Card>

<Card title="Плагин для винного погреба за несколько минут" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

У «Robby» (@openclaw) запросили локальный плагин для винного погреба. Он запрашивает образец экспорта CSV и путь к хранилищу, а затем создаёт и тестирует плагин (в примере — 962 бутылки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw создаёт локальный плагин для винного погреба из CSV" />
</Card>

<Card title="Автопилот для покупок в Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Еженедельный план питания, привычные товары, бронирование времени доставки и подтверждение заказа. Никаких API — только управление браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизация покупок в Tesco через чат" />
</Card>

<Card title="SNAG: из снимка экрана в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Выделите область экрана горячей клавишей, обработайте её с помощью компьютерного зрения Gemini и мгновенно получите Markdown в буфере обмена.

  <img src="/assets/showcase/snag.png" alt="Инструмент SNAG для преобразования снимков экрана в Markdown" />
</Card>

<Card title="Интерфейс агентов" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настольное приложение для управления Skills и командами в Agents, Claude, Codex и OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Приложение Agents UI" />
</Card>

<Card title="Голосовые сообщения Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Сообщество** • `voice` `tts` `telegram`

Предоставляет оболочку для синтеза речи papla.media и отправляет результаты как голосовые сообщения Telegram (без раздражающего автоматического воспроизведения).

  <img src="/assets/showcase/papla-tts.jpg" alt="Голосовое сообщение Telegram, созданное с помощью синтеза речи" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Устанавливаемый через Homebrew вспомогательный инструмент для просмотра списка, проверки и отслеживания локальных сеансов OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor в ClawHub" />
</Card>

<Card title="Управление 3D-принтерами Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Управление принтерами BambuLab и устранение неполадок: состояние, задания, камера, AMS, калибровка и многое другое.

  <img src="/assets/showcase/bambu-cli.png" alt="Плагин Bambu CLI в ClawHub" />
</Card>

<Card title="Транспорт Вены (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Отправления в реальном времени, сбои, состояние лифтов и построение маршрутов для общественного транспорта Вены.

  <img src="/assets/showcase/wienerlinien.png" alt="Плагин Wiener Linien в ClawHub" />
</Card>

<Card title="Школьное питание ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизированное бронирование школьного питания в Великобритании через ParentPay. Для надёжного нажатия на ячейки таблицы используются координаты мыши.
</Card>

<Card title="Загрузка в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Загрузка в Cloudflare R2/S3 и создание безопасных предварительно подписанных ссылок для скачивания. Полезно для удалённых экземпляров OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Плагин загрузки в R2 в ClawHub" />
</Card>

<Card title="Приложение iOS через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Полноценное приложение iOS с картами и записью голоса, полностью подготовленное к распространению через App Store посредством чата Telegram.
</Card>

<Card title="Помощник по здоровью с Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональный ИИ-помощник по здоровью, объединяющий данные кольца Oura с календарём, записями на приём и расписанием тренировок.

  <img src="/assets/showcase/oura-health.png" alt="Помощник по здоровью с кольцом Oura" />
</Card>

<Card title="Команда мечты Кева (более 14 агентов)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Более 14 агентов под управлением одного Gateway, где оркестратор Opus 4.5 делегирует задачи рабочим агентам Codex. Подробности см. в [техническом описании](https://github.com/adam91holt/orchestrated-ai-articles) и [Clawdspace](https://github.com/adam91holt/clawdspace), предназначенном для изоляции агентов.
</Card>

<Card title="CLI для Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, интегрируемый в агентные рабочие процессы (Claude Code, OpenClaw). Управляйте задачами, проектами и рабочими процессами из терминала.
</Card>

<Card title="CLI для Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Чтение, отправка и архивирование сообщений через Beeper Desktop. Использует локальный MCP API Beeper, чтобы агенты могли управлять всеми вашими чатами (iMessage, WhatsApp и другими) в одном месте.
</Card>

</CardGroup>

## Автоматизация и рабочие процессы

Планирование, управление браузером, циклы поддержки и та часть продукта, которая позволяет «просто выполнить задачу за меня».

<CardGroup cols={2}>

<Card title="Управление очистителем воздуха Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code обнаружил и проверил элементы управления очистителем, после чего OpenClaw взял на себя управление качеством воздуха в помещении.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Управление очистителем воздуха Winix через OpenClaw" />
</Card>

<Card title="Красивые снимки неба с камеры" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускается с камеры на крыше: попросите OpenClaw сделать снимок неба, когда оно выглядит красиво. OpenClaw разработал плагин и сделал фотографию.

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

<Card title="Приём бухгалтерских документов" icon="file-invoice-dollar">
  **Сообщество** • `automation` `email` `pdf`

Собирает PDF-файлы из электронной почты и подготавливает документы для налогового консультанта. Ежемесячная бухгалтерия на автопилоте.
</Card>

<Card title="Режим диванного разработчика" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Полностью переделал личный сайт через Telegram, пока смотрел Netflix: перенёс сайт с Notion на Astro, мигрировал 18 публикаций и перевёл DNS на Cloudflare. Ни разу не открыл ноутбук.
</Card>

<Card title="Агент для поиска работы" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Ищет вакансии, сопоставляет их с ключевыми словами из резюме и возвращает подходящие предложения со ссылками. Создан за 30 минут с помощью JSearch API.
</Card>

<Card title="Конструктор навыков Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw подключился к Jira, а затем на лету создал новый навык — ещё до его появления на ClawHub.
</Card>

<Card title="Навык Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизировал задачи Todoist и поручил OpenClaw создать навык прямо в чате Telegram.
</Card>

<Card title="Анализ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входит в TradingView с помощью автоматизации браузера, делает снимки графиков и по запросу выполняет технический анализ. API не требуется — достаточно управления браузером.
</Card>

<Card title="Торг при покупке автомобиля (экономия $4,200)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Поручил OpenClaw общаться с автодилерами: он самостоятельно вёл переговоры и добился снижения цены на $4,200.
</Card>

<Card title="Автоматическая регистрация на рейс" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Находит в электронной почте ближайший рейс, проходит онлайн-регистрацию и выбирает место у окна — приложение авиакомпании не требуется.
</Card>

<Card title="Подача страхового заявления" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Самостоятельно подал страховое заявление и назначил последующую встречу.
</Card>

<Card title="Навык для недвижимости Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI для Idealista API, предназначенный для поиска и оценки недвижимости и оформленный как навык, чтобы агент мог подбирать жильё в чате.
</Card>

<Card title="Бэк-офис садоводческого бизнеса" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Отслеживает заказы в Gmail, анализирует отправленные через Telegram фотографии объектов, создаёт многостраничные PDF-сметы в LaTeX и выставляет счета через Xero.
</Card>

<Card title="Автоматическая поддержка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Следит за корпоративным каналом Slack, даёт полезные ответы и пересылает уведомления в Telegram. Без отдельного запроса самостоятельно исправил ошибку в рабочей версии развёрнутого приложения.
</Card>

</CardGroup>

## Знания и память

Системы, которые индексируют, ищут, запоминают и анализируют личные или командные знания.

<CardGroup cols={2}>

<Card title="Изучение китайского с xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Система изучения китайского языка с оценкой произношения и учебными сценариями через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Оценка произношения в xuezh" />
</Card>

<Card title="Конвейер анализа публикаций X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Собрал 4 миллиона публикаций из 100 крупнейших аккаунтов X и превратил их в аналитический конвейер с поддержкой запросов.
</Card>

<Card title="Результаты анализов в Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Систематизировал результаты лабораторных анализов крови за несколько лет в структурированной базе данных Notion.
</Card>

<Card title="Второй мозг в Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Повседневный помощник в WhatsApp, вся память которого хранится в виде Markdown в хранилище Obsidian под управлением системы контроля версий: учёт калорий и тренировок, списки дел, управление бытовыми вопросами.
</Card>

<Card title="Бот семейной истории" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Работает в семейном групповом чате Telegram, документирует истории более чем 50 родственников и задаёт содержательные уточняющие вопросы, отвечая носителям языка на непальском.
</Card>

<Card title="Хранилище памяти WhatsApp" icon="vault">
  **Сообщество** • `memory` `transcription` `indexing`

Импортирует полные экспорты WhatsApp, расшифровывает более 1 тыс. голосовых сообщений, сверяет данные с журналами git и создаёт связанные отчёты в Markdown.
</Card>

<Card title="Семантический поиск Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Добавляет в закладки Karakeep векторный поиск с помощью Qdrant и эмбеддингов OpenAI или Ollama.
</Card>

<Card title="Память Inside-Out-2" icon="brain">
  **Сообщество** • `memory` `beliefs` `self-model`

Отдельный менеджер памяти, который преобразует файлы сеансов в воспоминания, затем в убеждения, а после — в развивающуюся модель личности.
</Card>

</CardGroup>

## Голос и телефонная связь

Точки входа с голосовым управлением, телефонные мосты и процессы с интенсивным использованием транскрипции.

<CardGroup cols={2}>

<Card title="Голосовое управление одним касанием Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Одно касание Pebble Ring запускает голосовой разговор с OpenClaw — доступ к агенту с носимого устройства.
</Card>

<Card title="Медиастудия для авторов" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Полноценная медиастудия в чате: синтез речи, транскрипция и автоматизация браузера, подключённые к Codex 5.2 и MiniMax.
</Card>

<Card title="Рация через Action Button" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Action Button на iPhone подключена к OpenClaw: нажмите, говорите — и агент ответит голосом, как по рации.
</Card>

<Card title="Телефонный мост Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-мост между голосовым помощником Vapi и OpenClaw. Телефонные разговоры с вашим агентом почти в реальном времени.
</Card>

<Card title="Транскрипция OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Многоязычная транскрипция аудио через OpenRouter (Gemini и другие модели). Доступно на ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Навык транскрипции OpenRouter на ClawHub" />
</Card>

</CardGroup>

## Инфраструктура и развёртывание

Пакетирование, развёртывание и интеграции, упрощающие запуск и расширение OpenClaw.

<CardGroup cols={2}>

<Card title="Дополнение Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, работающий в Home Assistant OS, с поддержкой SSH-туннелей и постоянного состояния.
</Card>

<Card title="Навык Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Управляйте устройствами Home Assistant и автоматизируйте их с помощью естественного языка.

  <img src="/assets/showcase/homeassistant.png" alt="Навык Home Assistant на ClawHub" />
</Card>

<Card title="Менеджер строки меню macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Нативное приложение на Swift для строки меню, которое отображает состояние агента и предоставляет быстрые элементы управления.
</Card>

<Card title="Пакетирование Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Готовая к использованию конфигурация OpenClaw для Nix, обеспечивающая воспроизводимое развёртывание.
</Card>

<Card title="Календарь CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Навык календаря на основе khal и vdirsyncer. Интеграция с самостоятельно размещённым календарём.

  <img src="/assets/showcase/caldav-calendar.png" alt="Навык календаря CalDAV на ClawHub" />
</Card>

</CardGroup>

## Дом и оборудование

Физическая сторона OpenClaw: дома, датчики, камеры, пылесосы и другие устройства.

<CardGroup cols={2}>

<Card title="Самостоятельно созданный навык HomePod" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw обнаружил HomePod в локальной сети и самостоятельно создал навык для управления ими.
</Card>

<Card title="Интерфейс в виде голографического куба за $35" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Недорогой голографический куб в роли физического лица агента на рабочем столе.
</Card>

<Card title="Автоматизация GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Нативная для Nix домашняя автоматизация с OpenClaw в качестве интерфейса и панелями мониторинга Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель мониторинга GoHome в Grafana" />
</Card>

<Card title="Пылесос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Управляйте роботом-пылесосом Roborock в обычном разговоре.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Состояние Roborock" />
</Card>

</CardGroup>

## Проекты сообщества

Проекты, которые переросли отдельный рабочий процесс и превратились в более широкие продукты или экосистемы.

<CardGroup cols={2}>

<Card title="Торговая площадка StarSwap" icon="star" href="https://star-swap.com/">
  **Сообщество** • `marketplace` `astronomy` `webapp`

Полноценная торговая площадка для астрономического оборудования. Создана с использованием экосистемы OpenClaw и вокруг неё.
</Card>

<Card title="Протокол переговоров между агентами Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Открытые переговоры между агентами: ваш агент согласовывает сделки, расписания и соглашения об услугах с другими узлами и криптографически подписывает результат — вам остаётся только одобрить или отклонить его.
</Card>

</CardGroup>

## Отправьте свой проект

<Steps>
  <Step title="Поделитесь">
    Опубликуйте в [#self-promotion в Discord](https://discord.gg/clawd) или [напишите в X, упомянув @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Добавьте подробности">
    Расскажите, что делает проект, добавьте ссылку на репозиторий или демонстрацию и поделитесь снимком экрана, если он у вас есть.
  </Step>
  <Step title="Попадите на эту страницу">
    Мы добавим на эту страницу выдающиеся проекты.
  </Step>
</Steps>

## Связанные материалы

- [Начало работы](/ru/start/getting-started)
- [OpenClaw](/ru/start/openclaw)
- [Полная подборка из X на openclaw.ai](https://openclaw.ai/showcase/)
