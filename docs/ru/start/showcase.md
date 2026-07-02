---
description: Real-world OpenClaw projects from the community
read_when:
    - Поиск реальных примеров использования OpenClaw
    - Обновление подборки проектов сообщества
summary: Проекты и интеграции, созданные сообществом на базе OpenClaw
title: Демонстрация
x-i18n:
    generated_at: "2026-07-02T08:43:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Проекты OpenClaw — это не игрушечные демо. Люди запускают циклы ревью PR, мобильные приложения, домашнюю автоматизацию, голосовые системы, devtools и workflow с большой нагрузкой на память из каналов, которыми они уже пользуются: chat-native сборки в Telegram, WhatsApp, Discord и терминалах; настоящую автоматизацию для бронирований, покупок и поддержки без ожидания API; а также интеграции с физическим миром: принтерами, пылесосами, камерами и домашними системами.

<Info>
**Хотите попасть в подборку?** Поделитесь своим проектом в [#self-promotion on Discord](https://discord.gg/clawd) или [отметьте @openclaw в X](https://x.com/openclaw).
</Info>

## Новое из Discord

Свежие заметные проекты в кодинге, devtools, мобильной разработке и создании chat-native продуктов.

<CardGroup cols={2}>

<Card title="Ревью PR с обратной связью в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершает изменение, открывает PR, OpenClaw ревьюит diff и отвечает в Telegram предложениями плюс четким вердиктом по merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Обратная связь ревью PR OpenClaw, доставленная в Telegram" />
</Card>

<Card title="Skill для винного погреба за минуты" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) создать локальный skill для винного погреба. Он запрашивает пример экспорта CSV и путь к хранилищу, затем собирает и тестирует skill (962 бутылки в примере).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw создает локальный skill для винного погреба из CSV" />
</Card>

<Card title="Автопилот для покупок в Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Недельный план питания, регулярные покупки, бронирование слота доставки, подтверждение заказа. Без API, только управление браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизация покупок в Tesco через чат" />
</Card>

<Card title="SNAG: скриншот в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Горячая клавиша для области экрана, Gemini vision, мгновенный Markdown в буфере обмена.

  <img src="/assets/showcase/snag.png" alt="Инструмент SNAG для преобразования скриншотов в Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настольное приложение для управления skills и командами в Agents, Claude, Codex и OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Приложение Agents UI" />
</Card>

<Card title="Голосовые заметки Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Оборачивает TTS papla.media и отправляет результаты как голосовые заметки Telegram (без раздражающего автопроигрывания).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вывод голосовой заметки Telegram из TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Помощник, устанавливаемый через Homebrew, для просмотра списка, инспекции и наблюдения за локальными сессиями OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Управление 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Управление принтерами BambuLab и диагностика: статус, задания, камера, AMS, калибровка и многое другое.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Транспорт Вены (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Отправления в реальном времени, сбои, состояние лифтов и маршрутизация для общественного транспорта Вены.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="Школьное питание ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматическое бронирование школьного питания в Великобритании через ParentPay. Использует координаты мыши для надежного нажатия на ячейки таблицы.
</Card>

<Card title="Загрузка в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Загрузка в Cloudflare R2/S3 и создание безопасных пред signed ссылок для скачивания. Полезно для удаленных экземпляров OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill загрузки в R2 на ClawHub" />
</Card>

<Card title="iOS-приложение через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Создано полноценное iOS-приложение с картами и записью голоса, полностью подготовленное к публикации в App Store через чат Telegram.
</Card>

<Card title="Ассистент здоровья Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональный AI-ассистент здоровья, интегрирующий данные Oura Ring с календарем, встречами и расписанием спортзала.

  <img src="/assets/showcase/oura-health.png" alt="Ассистент здоровья Oura Ring" />
</Card>

<Card title="Dream Team Кева (14+ агентов)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ агентов под одним Gateway с оркестратором Opus 4.5, который делегирует задачи worker-агентам Codex. См. [технический разбор](https://github.com/adam91holt/orchestrated-ai-articles) и [Clawdspace](https://github.com/adam91holt/clawdspace) для изоляции агентов в песочнице.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, который интегрируется с агентными workflow (Claude Code, OpenClaw). Управляйте issue, проектами и workflow из терминала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Чтение, отправка и архивирование сообщений через Beeper Desktop. Использует локальный MCP API Beeper, чтобы агенты могли управлять всеми вашими чатами (iMessage, WhatsApp и другими) в одном месте.
</Card>

</CardGroup>

## Автоматизация и workflow

Планирование, управление браузером, циклы поддержки и сторона продукта в духе "просто сделай задачу за меня".

<CardGroup cols={2}>

<Card title="Управление очистителем воздуха Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code обнаружил и подтвердил элементы управления очистителем, затем OpenClaw берет управление на себя, чтобы поддерживать качество воздуха в комнате.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Управление очистителем воздуха Winix через OpenClaw" />
</Card>

<Card title="Красивые снимки неба с камеры" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускается камерой на крыше: попросите OpenClaw сделать снимок неба, когда оно выглядит красиво. Он спроектировал skill и сделал снимок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Снимок неба с камеры на крыше, сделанный OpenClaw" />
</Card>

<Card title="Визуальная сцена утреннего брифинга" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланированный prompt каждое утро создает одно изображение сцены (погода, задачи, дата, любимый пост или цитата) через персону OpenClaw.
</Card>

<Card title="Бронирование кортов для падела" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Проверка доступности Playtomic плюс CLI для бронирования. Больше не пропускайте свободный корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Прием документов для бухгалтерии" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Собирает PDF из почты, готовит документы для налогового консультанта. Ежемесячная бухгалтерия на автопилоте.
</Card>

<Card title="Режим разработки с дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Полностью пересобран личный сайт через Telegram во время просмотра Netflix: Notion в Astro, перенесено 18 постов, DNS в Cloudflare. Ноутбук ни разу не открывался.
</Card>

<Card title="Агент для поиска работы" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Ищет вакансии, сопоставляет их с ключевыми словами из CV и возвращает релевантные возможности со ссылками. Создан за 30 минут с использованием JSearch API.
</Card>

<Card title="Конструктор skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw подключился к Jira, затем на лету сгенерировал новый skill (до того, как он появился на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизировал задачи Todoist, а OpenClaw сгенерировал skill прямо в чате Telegram.
</Card>

<Card title="Анализ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входит в TradingView через автоматизацию браузера, делает скриншоты графиков и выполняет технический анализ по запросу. API не нужен — только управление браузером.
</Card>

<Card title="Автоподдержка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Следит за корпоративным каналом Slack, полезно отвечает и пересылает уведомления в Telegram. Автономно исправил производственную ошибку в развернутом приложении без запроса.
</Card>

</CardGroup>

## Знания и память

Системы, которые индексируют, ищут, запоминают и рассуждают о личных или командных знаниях.

<CardGroup cols={2}>

<Card title="Изучение китайского xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Движок изучения китайского с обратной связью по произношению и учебными потоками через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Обратная связь по произношению в xuezh" />
</Card>

<Card title="Хранилище памяти WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Загружает полные экспорты WhatsApp, транскрибирует 1k+ голосовых заметок, сверяет с git-логами, выводит связанные markdown-отчеты.
</Card>

<Card title="Семантический поиск Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Добавляет векторный поиск по закладкам Karakeep с использованием Qdrant плюс эмбеддинги OpenAI или Ollama.
</Card>

<Card title="Память Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Отдельный менеджер памяти, который превращает файлы сессий в воспоминания, затем в убеждения, затем в развивающуюся модель себя.
</Card>

</CardGroup>

## Голос и телефон

Точки входа с приоритетом речи, телефонные мосты и workflow с большим объемом транскрибации.

<CardGroup cols={2}>

<Card title="Телефонный мост Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Голосовой ассистент Vapi в HTTP-мост OpenClaw. Почти реальные телефонные звонки в реальном времени с вашим агентом.
</Card>

<Card title="Транскрибация OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Многоязычная транскрибация аудио через OpenRouter (Gemini и другие). Доступно на ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill транскрибации OpenRouter на ClawHub" />
</Card>

</CardGroup>

## Инфраструктура и развертывание

Упаковка, развертывание и интеграции, которые упрощают запуск и расширение OpenClaw.

<CardGroup cols={2}>

<Card title="Дополнение Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, работающий на Home Assistant OS, с поддержкой SSH-туннеля и постоянным состоянием.
</Card>

<Card title="Навык Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Управляйте устройствами Home Assistant и автоматизируйте их с помощью естественного языка.

  <img src="/assets/showcase/homeassistant.png" alt="Навык Home Assistant в ClawHub" />
</Card>

<Card title="Пакетирование Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Готовая к использованию конфигурация OpenClaw в стиле Nix для воспроизводимых развертываний.
</Card>

<Card title="Календарь CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Навык календаря на базе khal и vdirsyncer. Интеграция с самостоятельно размещенным календарем.

  <img src="/assets/showcase/caldav-calendar.png" alt="Навык календаря CalDAV в ClawHub" />
</Card>

</CardGroup>

## Дом и оборудование

Физическая сторона OpenClaw: дома, датчики, камеры, пылесосы и другие устройства.

<CardGroup cols={2}>

<Card title="Автоматизация GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Домашняя автоматизация на базе Nix с OpenClaw в качестве интерфейса, а также панели мониторинга Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель мониторинга GoHome Grafana" />
</Card>

<Card title="Пылесос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Управляйте роботом-пылесосом Roborock через естественный диалог.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Статус Roborock" />
</Card>

</CardGroup>

## Проекты сообщества

То, что выросло из отдельного рабочего процесса в более широкие продукты или экосистемы.

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Сообщество** • `marketplace` `astronomy` `webapp`

Полноценный маркетплейс астрономического оборудования. Создан с использованием экосистемы OpenClaw и вокруг нее.
</Card>

</CardGroup>

## Отправьте свой проект

<Steps>
  <Step title="Поделитесь им">
    Опубликуйте в [#self-promotion в Discord](https://discord.gg/clawd) или [напишите @openclaw в X](https://x.com/openclaw).
  </Step>
  <Step title="Добавьте сведения">
    Расскажите, что он делает, дайте ссылку на репозиторий или демо и поделитесь снимком экрана, если он у вас есть.
  </Step>
  <Step title="Попадите на страницу">
    Мы добавим выдающиеся проекты на эту страницу.
  </Step>
</Steps>

## Связанные материалы

- [Начало работы](/ru/start/getting-started)
- [OpenClaw](/ru/start/openclaw)
