---
read_when:
    - Збирання або налагодження нативних плагінів OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація хуків середовища виконання провайдера або Plugin для каналів
sidebarTitle: Internals
summary: 'Внутрішня архітектура Plugin: модель можливостей, право власності, контракти, конвеєр завантаження та допоміжні засоби середовища виконання'
title: Внутрішні механізми Plugin
x-i18n:
    generated_at: "2026-04-28T11:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6afc634508c1d623fa1caceb6b463917f5a8adbaabf42b5381974bd86d117f5d
    source_path: plugins/architecture.md
    workflow: 16
---

Це **поглиблений архітектурний довідник** для системи plugins OpenClaw. Для практичних посібників почніть з однієї зі спеціалізованих сторінок нижче.

<CardGroup cols={2}>
  <Card title="Установлення та використання plugins" icon="plug" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо додавання, увімкнення й усунення несправностей plugins.
  </Card>
  <Card title="Створення plugins" icon="rocket" href="/uk/plugins/building-plugins">
    Посібник зі створення першого plugin з найменшим робочим маніфестом.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу обміну повідомленнями.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin постачальника моделей.
  </Card>
  <Card title="Огляд SDK" icon="book" href="/uk/plugins/sdk-overview">
    Довідник щодо карти імпортів і API реєстрації.
  </Card>
</CardGroup>

## Публічна модель можливостей

Можливості є публічною моделлю **нативних plugin** в OpenClaw. Кожен нативний plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість             | Метод реєстрації                              | Приклади plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Текстове виведення         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Бекенд CLI-виведення  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Мовлення                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Отримання вебвмісту              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Вебпошук             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Виявлення Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin, який реєструє нуль можливостей, але надає hooks, tools, служби виявлення або фонові служби, є **застарілим plugin лише з hooks**. Цей шаблон досі повністю підтримується.
</Note>

### Позиція щодо зовнішньої сумісності

Модель можливостей уже додано в core і сьогодні використовується в вбудованих/нативних plugins, але сумісність зовнішніх plugins усе ще потребує суворішої планки, ніж «це експортовано, отже це зафіксовано».

| Ситуація з plugin                                  | Рекомендації                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Наявні зовнішні plugins                         | Підтримуйте працездатність інтеграцій на основі hooks; це базова лінія сумісності.                        |
| Нові вбудовані/нативні plugins                        | Надавайте перевагу явній реєстрації можливостей замість vendor-specific reach-ins або нових дизайнів лише на hooks. |
| Зовнішні plugins, що впроваджують реєстрацію можливостей | Дозволено, але вважайте допоміжні поверхні, специфічні для можливостей, такими, що еволюціонують, якщо документація не позначає їх стабільними. |

Реєстрація можливостей є цільовим напрямком. Застарілі hooks залишаються найбезпечнішим шляхом без поломок для зовнішніх plugins під час переходу. Експортовані допоміжні підшляхи не всі рівноцінні — надавайте перевагу вузьким задокументованим контрактам над випадковими допоміжними експортами.

### Форми plugin

OpenClaw класифікує кожен завантажений plugin за формою на основі його фактичної поведінки реєстрації (а не лише статичних метаданих):

<AccordionGroup>
  <Accordion title="plain-capability">
    Реєструє рівно один тип можливості (наприклад, plugin лише постачальника, як-от `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Реєструє кілька типів можливостей (наприклад, `openai` володіє текстовим виведенням, мовленням, розумінням медіа та генерацією зображень).
  </Accordion>
  <Accordion title="hook-only">
    Реєструє лише hooks (типізовані або користувацькі), без можливостей, tools, команд або служб.
  </Accordion>
  <Accordion title="non-capability">
    Реєструє tools, команди, служби або маршрути, але без можливостей.
  </Accordion>
</AccordionGroup>

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin та розбивку його можливостей. Докладніше див. [довідник CLI](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для plugins лише з hooks. Застарілі реальні plugins досі залежать від нього.

Напрямок:

- підтримувати його працездатність
- документувати його як застарілий
- надавати перевагу `before_model_resolve` для роботи з перевизначенням моделі/постачальника
- надавати перевагу `before_prompt_build` для роботи зі зміною prompt
- видалити лише після того, як реальне використання зменшиться, а покриття fixtures підтвердить безпеку міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити одну з цих міток:

| Сигнал                     | Значення                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config успішно розбирається, а plugins розв’язуються                       |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який застарів        |
| **hard error**             | Config недійсний або plugin не вдалося завантажити                   |

Ані `hook-only`, ані `before_agent_start` сьогодні не зламають ваш plugin: `hook-only` є рекомендаційним сигналом, а `before_agent_start` лише викликає попередження. Ці сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система plugins OpenClaw має чотири шари:

<Steps>
  <Step title="Маніфест + виявлення">
    OpenClaw знаходить кандидатні plugins із налаштованих шляхів, коренів робочих просторів, глобальних коренів plugins і вбудованих plugins. Виявлення спочатку читає нативні маніфести `openclaw.plugin.json` та підтримувані маніфести пакетів.
  </Step>
  <Step title="Увімкнення + перевірка">
    Core вирішує, чи виявлений plugin увімкнений, вимкнений, заблокований або вибраний для ексклюзивного слота, наприклад пам’яті.
  </Step>
  <Step title="Завантаження під час виконання">
    Нативні plugins OpenClaw завантажуються в процесі через jiti і реєструють можливості в центральному реєстрі. Сумісні пакети нормалізуються в записи реєстру без імпортування коду виконання.
  </Step>
  <Step title="Споживання поверхнями">
    Решта OpenClaw читає реєстр, щоб відкривати tools, канали, налаштування постачальників, hooks, HTTP-маршрути, команди CLI та служби.
  </Step>
</Steps>

Саме для CLI plugins виявлення кореневих команд поділено на дві фази:

- метадані часу розбору надходять із `registerCli(..., { descriptors: [...] })`
- справжній модуль CLI plugin може залишатися ледачим і реєструватися під час першого виклику

Це утримує CLI-код, що належить plugin, всередині plugin, водночас дозволяючи OpenClaw зарезервувати назви кореневих команд до розбору.

Важлива межа дизайну:

- перевірка маніфесту/config має працювати з **метаданих маніфесту/схеми** без виконання коду plugin
- виявлення нативних можливостей може завантажувати довірений код входу plugin, щоб побудувати знімок реєстру без активації
- нативна поведінка під час виконання надходить зі шляху `register(api)` модуля plugin, коли `api.registrationMode === "full"`

Такий поділ дає OpenClaw змогу перевіряти config, пояснювати відсутні/вимкнені plugins і будувати підказки UI/схеми до того, як повний runtime стане активним.

### Знімок метаданих plugin і таблиця пошуку

Під час запуску Gateway будує один `PluginMetadataSnapshot` для поточного знімка config. Знімок містить лише метадані: він зберігає індекс установлених plugins, реєстр маніфестів, діагностику маніфестів, карти власників, нормалізатор id plugin і записи маніфестів. Він не містить завантажених модулів plugin, SDK постачальників, вмісту пакетів або runtime-експортів.

Перевірка config з урахуванням plugins, автоматичне увімкнення під час запуску та bootstrap plugins Gateway споживають цей знімок замість незалежної повторної побудови метаданих маніфесту/індексу. `PluginLookUpTable` виводиться з того самого знімка й додає план plugins запуску для поточної runtime config.

Після запуску Gateway зберігає поточний знімок метаданих як замінюваний runtime-продукт. Повторне виявлення runtime-постачальників може позичати цей знімок замість реконструкції встановленого індексу та реєстру маніфестів для кожного проходу каталогу постачальників. Знімок очищується або замінюється під час завершення роботи Gateway, змін config/інвентарю plugins і записів установленого індексу; виклики повертаються до холодного шляху маніфесту/індексу, коли сумісного поточного знімка немає. Перевірки сумісності мають включати корені виявлення plugins, такі як `plugins.load.paths` і стандартний робочий простір агента, оскільки plugins робочого простору є частиною області метаданих.

Знімок і таблиця пошуку утримують повторні рішення запуску на швидкому шляху:

- власність каналу
- відкладений запуск каналу
- id plugins запуску
- власність постачальника та бекенду CLI
- власність постачальника налаштування, alias команди, постачальника каталогу моделей і контракту маніфесту
- перевірка схеми config plugin і схеми config каналу
- рішення автоматичного увімкнення під час запуску

Межею безпеки є заміна знімка, а не мутація. Перебудовуйте знімок, коли змінюються config, інвентар plugins, записи встановлення або політика збереженого індексу. Не розглядайте його як широкий змінний глобальний реєстр і не зберігайте необмежену історію знімків. Runtime-завантаження plugins залишається окремим від знімків метаданих, щоб застарілий runtime-стан не міг бути прихований за кешем метаданих.

Деякі виклики холодного шляху досі реконструюють реєстри маніфестів безпосередньо зі збереженого індексу встановлених plugins замість отримання Gateway `PluginLookUpTable`. Цей запасний шлях зберігає невеликий обмежений кеш у пам’яті, ключований установленим індексом, формою запиту, політикою config, runtime-коренями та сигнатурами файлів маніфесту/пакета. Це запасна сітка безпеки для повторної реконструкції індексу, а не бажаний гарячий шлях Gateway. Надавайте перевагу передаванню поточної таблиці пошуку або явного реєстру маніфестів через runtime-потоки, коли виклик уже має один із них.

### Планування активації

Планування активації є частиною control plane. Виклики можуть запитати, які plugins релевантні для конкретної команди, постачальника, каналу, маршруту, harness агента або можливості, перш ніж завантажувати ширші runtime-реєстри.

Планувальник зберігає сумісність із поточною поведінкою маніфесту:

- поля `activation.*` є явними підказками планувальника
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і hooks залишаються запасним варіантом визначення власності з маніфесту
- API планувальника лише з id залишається доступним для наявних викликів
- API плану повідомляє мітки причин, щоб діагностика могла відрізняти явні підказки від запасного визначення власності

<Warning>
Не розглядайте `activation` як hook життєвого циклу або заміну для `register(...)`. Це метадані, що використовуються для звуження завантаження. Надавайте перевагу полям власності, коли вони вже описують зв’язок; використовуйте `activation` лише для додаткових підказок планувальника.
</Warning>

### Channel plugins і спільний tool повідомлень

Plugin каналів не потрібно реєструвати окремий інструмент send/edit/react для звичайних дій чату. OpenClaw зберігає один спільний інструмент `message` у ядрі, а Plugin каналів володіють специфічним для каналу виявленням і виконанням за ним.

Поточна межа така:

- ядро володіє спільним хостом інструмента `message`, підключенням prompt, обліком сесій/threads і диспетчеризацією виконання
- Plugin каналів володіють виявленням дій у межах області, виявленням можливостей і будь-якими специфічними для каналу фрагментами schema
- Plugin каналів володіють граматикою розмови сесії конкретного провайдера, наприклад тим, як conversation ids кодують thread ids або успадковуються від батьківських розмов
- Plugin каналів виконують фінальну дію через свій action adapter

Для Plugin каналів поверхня SDK — це `ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик виявлення дає Plugin змогу повертати видимі дії, можливості та внески до schema разом, щоб ці частини не розходилися.

Коли специфічний для каналу параметр message-tool містить джерело media, як-от локальний шлях або віддалений media URL, Plugin також має повертати `mediaSourceParams` із `describeMessageTool(...)`. Ядро використовує цей явний список, щоб застосувати нормалізацію sandbox path і підказки outbound media-access без жорстко закодованих назв параметрів, що належать Plugin. Надавайте перевагу мапам у межах дії, а не одному плоскому списку на весь канал, щоб media-параметр лише для профілю не нормалізувався для непов’язаних дій, як-от `send`.

Ядро передає runtime scope у цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений inbound `requesterSenderId`

Це важливо для контекстно-залежних Plugin. Канал може приховувати або показувати message actions на основі активного облікового запису, поточної room/thread/message або довіреної ідентичності requester без жорстко закодованих специфічних для каналу гілок у ядрі інструмента `message`.

Саме тому зміни маршрутизації embedded-runner все ще є роботою Plugin: runner відповідає за пересилання поточної ідентичності chat/session у межу виявлення Plugin, щоб спільний інструмент `message` відкривав правильну поверхню, що належить каналу, для поточного ходу.

Для execution helpers, що належать каналу, bundled plugins мають тримати execution runtime всередині власних модулів розширення. Ядро більше не володіє runtime для message-action Discord, Slack, Telegram або WhatsApp у `src/agents/tools`. Ми не публікуємо окремі subpaths `plugin-sdk/*-action-runtime`, і bundled plugins мають імпортувати власний локальний runtime code безпосередньо зі своїх модулів, що належать розширенню.

Та сама межа загалом застосовується до provider-named SDK seams: ядро не має імпортувати специфічні для каналу convenience barrels для Slack, Discord, Signal, WhatsApp або подібних розширень. Якщо ядру потрібна поведінка, воно має або споживати власний barrel bundled Plugin `api.ts` / `runtime-api.ts`, або підняти потребу в вузьку generic capability у спільному SDK.

Bundled plugins дотримуються того самого правила. `runtime-api.ts` bundled Plugin не має повторно експортувати власний branded facade `openclaw/plugin-sdk/<plugin-id>`. Ці branded facades лишаються compatibility shims для external plugins і старіших consumers, але bundled plugins мають використовувати локальні exports плюс вузькі generic SDK subpaths, як-от `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` або `openclaw/plugin-sdk/webhook-ingress`. Новий код не має додавати SDK facades, специфічні для plugin-id, якщо цього не вимагає compatibility boundary для наявної зовнішньої екосистеми.

Конкретно для polls є два шляхи виконання:

- `outbound.sendPoll` — спільна базова лінія для каналів, що відповідають common poll model
- `actions.handleAction("poll")` — бажаний шлях для специфічної для каналу semantics poll або додаткових poll parameters

Тепер ядро відкладає спільний parsing poll, доки диспетчеризація poll Plugin не відхилить дію, тому poll handlers, що належать Plugin, можуть приймати специфічні для каналу poll fields без блокування generic poll parser спочатку.

Див. [внутрішню архітектуру Plugin](/uk/plugins/architecture-internals), щоб переглянути повну послідовність запуску.

## Модель володіння можливостями

OpenClaw розглядає native Plugin як межу володіння для **компанії** або **функції**, а не як випадковий набір непов’язаних інтеграцій.

Це означає:

- company Plugin зазвичай має володіти всіма поверхнями цієї компанії, зверненими до OpenClaw
- feature Plugin зазвичай має володіти повною поверхнею функції, яку він вводить
- канали мають споживати спільні можливості ядра замість повторної ad hoc реалізації provider behavior

<AccordionGroup>
  <Accordion title="Мульти-можливість постачальника">
    `openai` володіє text inference, speech, realtime voice, media understanding та image generation. `google` володіє text inference плюс media understanding, image generation і web search. `qwen` володіє text inference плюс media understanding і video generation.
  </Accordion>
  <Accordion title="Одна можливість постачальника">
    `elevenlabs` і `microsoft` володіють speech; `firecrawl` володіє web-fetch; `minimax` / `mistral` / `moonshot` / `zai` володіють media-understanding backends.
  </Accordion>
  <Accordion title="Feature Plugin">
    `voice-call` володіє call transport, tools, CLI, routes і Twilio media-stream bridging, але споживає спільні можливості speech, realtime transcription і realtime voice замість прямого імпорту vendor plugins.
  </Accordion>
</AccordionGroup>

Очікуваний кінцевий стан:

- OpenAI живе в одному Plugin, навіть якщо охоплює text models, speech, images і майбутнє video
- інший постачальник може зробити те саме для власної surface area
- каналам байдуже, який vendor Plugin володіє provider; вони споживають спільний capability contract, відкритий ядром

Ключова відмінність така:

- **Plugin** = межа володіння
- **capability** = контракт ядра, який можуть реалізовувати або споживати кілька Plugin

Тож якщо OpenClaw додає новий домен, як-от video, перше питання не "який provider має жорстко закодувати обробку video?" Перше питання — "який core video capability contract?" Коли цей контракт існує, vendor plugins можуть реєструватися для нього, а channel/feature plugins можуть його споживати.

Якщо capability ще не існує, правильний крок зазвичай такий:

<Steps>
  <Step title="Визначте capability">
    Визначте відсутню capability у ядрі.
  </Step>
  <Step title="Відкрийте через SDK">
    Відкрийте її через Plugin API/runtime типізованим способом.
  </Step>
  <Step title="Підключіть consumers">
    Підключіть channels/features до цієї capability.
  </Step>
  <Step title="Реалізації постачальників">
    Дайте vendor plugins змогу реєструвати реалізації.
  </Step>
</Steps>

Це зберігає явне володіння, водночас уникаючи поведінки ядра, що залежить від одного vendor або одноразового code path, специфічного для Plugin.

### Нашарування capabilities

Використовуйте цю ментальну модель, коли вирішуєте, де має бути код:

<Tabs>
  <Tab title="Шар core capability">
    Спільна оркестрація, policy, fallback, config merge rules, delivery semantics і typed contracts.
  </Tab>
  <Tab title="Шар vendor Plugin">
    Vendor-specific APIs, auth, model catalogs, speech synthesis, image generation, майбутні video backends, usage endpoints.
  </Tab>
  <Tab title="Шар channel/feature Plugin">
    Інтеграція Slack/Discord/voice-call/тощо, яка споживає core capabilities і представляє їх на поверхні.
  </Tab>
</Tabs>

Наприклад, TTS має таку форму:

- ядро володіє reply-time TTS policy, fallback order, prefs і channel delivery
- `openai`, `elevenlabs` і `microsoft` володіють synthesis implementations
- `voice-call` споживає telephony TTS runtime helper

Для майбутніх можливостей варто надавати перевагу тому самому шаблону.

### Приклад company Plugin із кількома capabilities

Company Plugin має відчуватися цілісним ззовні. Якщо OpenClaw має спільні контракти для models, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch і web search, vendor може володіти всіма своїми поверхнями в одному місці:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Важливі не точні назви helper. Важлива форма:

- один Plugin володіє vendor surface
- ядро все ще володіє capability contracts
- канали та feature plugins споживають helpers `api.runtime.*`, а не vendor code
- contract tests можуть перевіряти, що Plugin зареєстрував capabilities, якими заявляє володіння

### Приклад capability: video understanding

OpenClaw уже розглядає image/audio/video understanding як одну спільну capability. Та сама модель володіння застосовується і там:

<Steps>
  <Step title="Ядро визначає контракт">
    Ядро визначає media-understanding contract.
  </Step>
  <Step title="Vendor plugins реєструються">
    Vendor plugins реєструють `describeImage`, `transcribeAudio` і `describeVideo`, якщо застосовно.
  </Step>
  <Step title="Consumers використовують спільну поведінку">
    Channels і feature plugins споживають спільну core behavior замість прямого підключення до vendor code.
  </Step>
</Steps>

Це уникає вбудовування припущень одного provider щодо video у ядро. Plugin володіє vendor surface; ядро володіє capability contract і fallback behavior.

Video generation уже використовує ту саму послідовність: ядро володіє typed capability contract і runtime helper, а vendor plugins реєструють реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний rollout checklist? Див. [Capability Cookbook](/uk/plugins/architecture).

## Контракти та примусове застосування

Поверхня Plugin API навмисно типізована й централізована в `OpenClawPluginApi`. Цей контракт визначає підтримувані registration points і runtime helpers, на які може покладатися Plugin.

Чому це важливо:

- автори Plugin отримують один стабільний внутрішній стандарт
- ядро може відхиляти duplicate ownership, наприклад коли два Plugin реєструють той самий provider id
- запуск може показувати actionable diagnostics для malformed registration
- contract tests можуть забезпечувати ownership bundled-plugin і запобігати непомітному drift

Є два рівні enforcement:

<AccordionGroup>
  <Accordion title="Примусове застосування реєстрації під час runtime">
    Plugin registry перевіряє registrations під час завантаження Plugin. Приклади: duplicate provider ids, duplicate speech provider ids і malformed registrations створюють plugin diagnostics замість undefined behavior.
  </Accordion>
  <Accordion title="Contract tests">
    Bundled plugins фіксуються в contract registries під час тестових запусків, щоб OpenClaw міг явно перевіряти ownership. Сьогодні це використовується для model providers, speech providers, web search providers і bundled registration ownership.
  </Accordion>
</AccordionGroup>

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який plugin володіє якою поверхнею. Це дає змогу ядру й каналам безшовно компонуватися, тому що володіння оголошене, типізоване й придатне для тестування, а не неявне.

### Що належить до контракту

<Tabs>
  <Tab title="Добрі контракти">
    - типізовані
    - невеликі
    - специфічні для можливості
    - належать ядру
    - повторно використовувані кількома plugins
    - споживані каналами/функціями без знання постачальника

  </Tab>
  <Tab title="Погані контракти">
    - специфічна для постачальника політика, прихована в ядрі
    - одноразові обхідні шляхи plugin, що обходять реєстр
    - код каналу, який напряму звертається до реалізації постачальника
    - ситуативні runtime-об’єкти, які не є частиною `OpenClawPluginApi` або `api.runtime`

  </Tab>
</Tabs>

Якщо маєте сумніви, підніміть рівень абстракції: спочатку визначте можливість, а потім дозвольте plugins підключатися до неї.

## Модель виконання

Нативні plugins OpenClaw працюють **у процесі** разом із Gateway. Вони не ізольовані в пісочниці. Завантажений нативний plugin має ту саму межу довіри на рівні процесу, що й код ядра.

<Warning>
Наслідки нативних plugins: plugin може реєструвати інструменти, мережеві обробники, хуки й сервіси; помилка plugin може спричинити збій або дестабілізувати gateway; а зловмисний нативний plugin еквівалентний виконанню довільного коду всередині процесу OpenClaw.
</Warning>

Сумісні бандли безпечніші за замовчуванням, тому що OpenClaw наразі розглядає їх як пакети метаданих/контенту. У поточних випусках це здебільшого означає вбудовані skills.

Використовуйте allowlists і явні шляхи встановлення/завантаження для невбудованих plugins. Розглядайте workspace plugins як код часу розробки, а не як production-стандарт.

Для імен вбудованих workspace-пакетів прив’язуйте id plugin до npm-імені: `@openclaw/<id>` за замовчуванням або затверджений типізований суфікс, як-от `-provider`, `-plugin`, `-speech`, `-sandbox` чи `-media-understanding`, коли пакет навмисно надає вужчу роль plugin.

<Note>
**Примітка щодо довіри:** `plugins.allow` довіряє **plugin ids**, а не походженню джерела. Workspace plugin із тим самим id, що й вбудований plugin, навмисно затіняє вбудовану копію, коли цей workspace plugin увімкнено/додано до allowlist. Це нормально й корисно для локальної розробки, тестування патчів і hotfixes. Довіра до вбудованого plugin визначається зі знімка джерела — маніфесту й коду на диску під час завантаження, — а не з метаданих встановлення. Пошкоджений або підмінений запис встановлення не може непомітно розширити поверхню довіри вбудованого plugin понад те, що фактично заявляє джерело.
</Note>

## Межа експорту

OpenClaw експортує можливості, а не зручності реалізації.

Залишайте реєстрацію можливостей публічною. Скорочуйте експорти helper-функцій, які не є контрактами:

- підшляхи helper-функцій, специфічні для вбудованого plugin
- підшляхи runtime-інфраструктури, не призначені як публічний API
- специфічні для постачальника helper-функції для зручності
- helper-функції налаштування/onboarding, які є деталями реалізації

Зарезервовані підшляхи helper-функцій вбудованих plugins було вилучено зі згенерованої мапи експортів SDK. Тримайте helper-функції, специфічні для власника, всередині пакета plugin-власника; просувайте лише повторно використовувану поведінку хоста до загальних контрактів SDK, як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

## Внутрішні механізми й довідка

Про конвеєр завантаження, модель реєстру, runtime-хуки постачальників, HTTP-маршрути Gateway, схеми інструментів повідомлень, визначення цілей каналів, каталоги постачальників, plugins рушія контексту й посібник із додавання нової можливості див. [Внутрішня архітектура plugin](/uk/plugins/architecture-internals).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Маніфест plugin](/uk/plugins/manifest)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
