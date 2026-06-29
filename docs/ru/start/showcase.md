---
description: Real-world OpenClaw projects from the community
read_when:
    - Ищем реальные примеры использования OpenClaw
    - Обновление обзора проектов сообщества
summary: Проекты и интеграции сообщества на базе OpenClaw
title: Витрина
x-i18n:
    generated_at: "2026-06-28T23:48:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

Проекты OpenClaw — не игрушечные демо. Люди запускают рабочие циклы проверки PR, мобильные приложения, домашнюю автоматизацию, голосовые системы, devtools и workflows с интенсивным использованием памяти из каналов, которыми они уже пользуются: chat-native сборки в Telegram, WhatsApp, Discord и терминалах; реальная автоматизация бронирования, покупок и поддержки без ожидания API; а также интеграции с физическим миром: принтерами, пылесосами, камерами и домашними системами.

<Info>
**Хотите попасть в подборку?** Поделитесь своим проектом в [#self-promotion в Discord](https://discord.gg/clawd) или [отметьте @openclaw в X](https://x.com/openclaw).
</Info>

## Свежее из Discord

Недавние выдающиеся примеры в разработке, devtools, мобильных приложениях и создании chat-native продуктов.

<CardGroup cols={2}>

<Card title="Обратная связь по проверке PR в Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершает изменение, открывает PR, OpenClaw проверяет diff и отвечает в Telegram предложениями плюс четким вердиктом о merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Обратная связь по проверке PR OpenClaw, доставленная в Telegram" />
</Card>

<Card title="Skill для винного погреба за минуты" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) создать локальный skill для винного погреба. Он запрашивает пример экспорта CSV и путь к хранилищу, затем создает и тестирует skill (962 бутылки в примере).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw создает локальный skill для винного погреба из CSV" />
</Card>

<Card title="Автопилот покупок Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Еженедельный план питания, регулярные покупки, бронирование слота доставки, подтверждение заказа. Без API, только управление браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизация покупок Tesco через чат" />
</Card>

<Card title="SNAG: скриншот в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Горячая клавиша для области экрана, Gemini vision, мгновенный Markdown в буфере обмена.

  <img src="/assets/showcase/snag.png" alt="Инструмент SNAG для преобразования скриншота в Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Десктопное приложение для управления skills и командами в Agents, Claude, Codex и OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Приложение Agents UI" />
</Card>

<Card title="Голосовые заметки Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Оборачивает TTS papla.media и отправляет результаты как голосовые заметки Telegram (без раздражающего автозапуска).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вывод голосовой заметки Telegram из TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Устанавливаемый через Homebrew помощник для вывода списка, инспекции и наблюдения за локальными сессиями OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Управление 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Управляйте принтерами BambuLab и диагностируйте их: статус, задания, камера, AMS, калибровка и многое другое.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Транспорт Вены (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Отправления в реальном времени, сбои, статус лифтов и маршрутизация для общественного транспорта Вены.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="Школьные обеды ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизированное бронирование школьных обедов в Великобритании через ParentPay. Использует координаты мыши для надежных кликов по ячейкам таблицы.
</Card>

<Card title="Загрузка в R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Загрузка в Cloudflare R2/S3 и создание безопасных presigned-ссылок для скачивания. Полезно для удаленных экземпляров OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill загрузки в R2 на ClawHub" />
</Card>

<Card title="iOS-приложение через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Создано полноценное iOS-приложение с картами и записью голоса, развернуто в TestFlight полностью через чат Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-приложение в TestFlight" />
</Card>

<Card title="Помощник для здоровья Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональный ИИ-помощник для здоровья, интегрирующий данные кольца Oura с календарем, приемами и расписанием спортзала.

  <img src="/assets/showcase/oura-health.png" alt="Помощник для здоровья с кольцом Oura" />
</Card>

<Card title="Kev's Dream Team (14+ агентов)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ агентов под одним Gateway с оркестратором Opus 4.5, который делегирует задачи worker'ам Codex. См. [технический разбор](https://github.com/adam91holt/orchestrated-ai-articles) и [Clawdspace](https://github.com/adam91holt/clawdspace) для sandboxing агентов.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, интегрирующийся с агентными workflows (Claude Code, OpenClaw). Управляйте issues, проектами и workflows из терминала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Чтение, отправка и архивирование сообщений через Beeper Desktop. Использует локальный MCP API Beeper, чтобы агенты могли управлять всеми вашими чатами (iMessage, WhatsApp и другими) в одном месте.
</Card>

</CardGroup>

## Автоматизация и workflows

Планирование, управление браузером, циклы поддержки и сторона продукта «просто сделай задачу за меня».

<CardGroup cols={2}>

<Card title="Управление очистителем воздуха Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code обнаружил и подтвердил элементы управления очистителем, затем OpenClaw берет на себя управление качеством воздуха в комнате.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Управление очистителем воздуха Winix через OpenClaw" />
</Card>

<Card title="Красивые снимки неба с камеры" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускается камерой на крыше: попросите OpenClaw сделать фото неба, когда оно выглядит красиво. Он спроектировал skill и сделал снимок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Снимок неба с камеры на крыше, сделанный OpenClaw" />
</Card>

<Card title="Визуальная утренняя сводка-сцена" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланированный prompt каждое утро генерирует одно изображение-сцену (погода, задачи, дата, любимый пост или цитата) через персону OpenClaw.
</Card>

<Card title="Бронирование корта для падела" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Проверка доступности Playtomic плюс CLI для бронирования. Больше никогда не пропускайте свободный корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Прием бухгалтерских документов" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Собирает PDF из email, готовит документы для налогового консультанта. Ежемесячная бухгалтерия на автопилоте.
</Card>

<Card title="Режим разработки с дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Полностью перестроил персональный сайт через Telegram во время просмотра Netflix — миграция с Notion на Astro, 18 постов перенесено, DNS на Cloudflare. Ни разу не открыл ноутбук.
</Card>

<Card title="Агент поиска работы" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Ищет вакансии, сопоставляет их с ключевыми словами в CV и возвращает релевантные возможности со ссылками. Создано за 30 минут с использованием JSearch API.
</Card>

<Card title="Конструктор skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw подключился к Jira, затем на лету сгенерировал новый skill (до того, как он появился на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизировал задачи Todoist и заставил OpenClaw сгенерировать skill прямо в чате Telegram.
</Card>

<Card title="Анализ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входит в TradingView через браузерную автоматизацию, делает скриншоты графиков и выполняет технический анализ по запросу. API не нужен — только управление браузером.
</Card>

<Card title="Автоподдержка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Отслеживает корпоративный канал Slack, отвечает полезно и пересылает уведомления в Telegram. Автономно исправил production-баг в развернутом приложении без запроса.
</Card>

</CardGroup>

## Знания и память

Системы, которые индексируют, ищут, запоминают и рассуждают над личными или командными знаниями.

<CardGroup cols={2}>

<Card title="Изучение китайского xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Движок для изучения китайского языка с обратной связью по произношению и учебными flows через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Обратная связь по произношению xuezh" />
</Card>

<Card title="Хранилище памяти WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Загружает полные экспорты WhatsApp, транскрибирует 1k+ голосовых заметок, сверяет с git logs, выводит связанные markdown-отчеты.
</Card>

<Card title="Семантический поиск Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Добавляет векторный поиск по закладкам Karakeep с использованием Qdrant плюс embeddings OpenAI или Ollama.
</Card>

<Card title="Память Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Отдельный менеджер памяти, который превращает файлы сессий в воспоминания, затем в убеждения, затем в развивающуюся модель себя.
</Card>

</CardGroup>

## Голос и телефон

Точки входа с приоритетом речи, телефонные мосты и workflows с большим объемом транскрибации.

<CardGroup cols={2}>

<Card title="Телефонный мост Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Голосовой ассистент Vapi к HTTP-мосту OpenClaw. Телефонные звонки с вашим агентом почти в реальном времени.
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

OpenClaw gateway, работающий на Home Assistant OS с поддержкой SSH-туннеля и постоянным состоянием.
</Card>

<Card title="Навык Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Управляйте устройствами Home Assistant и автоматизируйте их с помощью естественного языка.

  <img src="/assets/showcase/homeassistant.png" alt="Навык Home Assistant на ClawHub" />
</Card>

<Card title="Пакетирование Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Готовая nixified-конфигурация OpenClaw для воспроизводимых развертываний.
</Card>

<Card title="Календарь CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Навык календаря с использованием khal и vdirsyncer. Интеграция с самостоятельно размещаемым календарем.

  <img src="/assets/showcase/caldav-calendar.png" alt="Навык календаря CalDAV на ClawHub" />
</Card>

</CardGroup>

## Дом и оборудование

Сторона OpenClaw, связанная с физическим миром: дома, датчики, камеры, пылесосы и другие устройства.

<CardGroup cols={2}>

<Card title="Автоматизация GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Домашняя автоматизация на основе Nix с OpenClaw в качестве интерфейса, а также панели Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Панель Grafana GoHome" />
</Card>

<Card title="Пылесос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Управляйте роботом-пылесосом Roborock через естественный диалог.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Состояние Roborock" />
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
  <Step title="Укажите подробности">
    Расскажите, что он делает, добавьте ссылку на репозиторий или демо и поделитесь скриншотом, если он у вас есть.
  </Step>
  <Step title="Попадите в подборку">
    Мы добавим выдающиеся проекты на эту страницу.
  </Step>
</Steps>

## Связанные материалы

- [Начало работы](/ru/start/getting-started)
- [OpenClaw](/ru/start/openclaw)
