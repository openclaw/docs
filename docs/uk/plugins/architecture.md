---
read_when:
    - Створення або налагодження нативних плагінів OpenClaw
    - Розуміння моделі можливостей Plugin або меж відповідальності
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація хуків середовища виконання провайдера або Plugin для каналів
sidebarTitle: Internals
summary: 'Внутрішня будова Plugin: модель можливостей, володіння, контракти, конвеєр завантаження та допоміжні засоби середовища виконання'
title: Внутрішні механізми Plugin
x-i18n:
    generated_at: "2026-05-01T22:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Це **поглиблений архітектурний довідник** для системи Plugin в OpenClaw. Практичні посібники починайте з однієї з наведених нижче цільових сторінок.

<CardGroup cols={2}>
  <Card title="Установлення та використання plugins" icon="plug" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із додавання, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Створення plugins" icon="rocket" href="/uk/plugins/building-plugins">
    Навчальний матеріал для першого Plugin із найменшим робочим маніфестом.
  </Card>
  <Card title="Канальні plugins" icon="comments" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями.
  </Card>
  <Card title="Провайдерські plugins" icon="microchip" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделі.
  </Card>
  <Card title="Огляд SDK" icon="book" href="/uk/plugins/sdk-overview">
    Довідник з import map та API реєстрації.
  </Card>
</CardGroup>

## Публічна модель можливостей

Можливості — це публічна модель **нативних Plugin** всередині OpenClaw. Кожен нативний Plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість                 | Метод реєстрації                                | Приклади plugins                    |
| -------------------------- | ------------------------------------------------ | ----------------------------------- |
| Текстовий висновок         | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| Бекенд висновку CLI        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`               |
| Мовлення                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Голос у реальному часі     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Розуміння медіа            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Генерація зображень        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Генерація музики           | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Генерація відео            | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Отримання вебвмісту        | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Вебпошук                   | `api.registerWebSearchProvider(...)`             | `google`                            |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |
| Виявлення Gateway          | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                           |

<Note>
Plugin, який не реєструє жодної можливості, але надає hooks, інструменти, служби виявлення або фонові служби, є **застарілим Plugin лише з hooks**. Цей шаблон і далі повністю підтримується.
</Note>

### Позиція щодо зовнішньої сумісності

Модель можливостей уже впроваджена в core і сьогодні використовується bundled/нативними plugins, але сумісність зовнішніх plugins потребує суворішої планки, ніж "це експортовано, отже це заморожено."

| Ситуація з Plugin                                 | Рекомендації                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Наявні зовнішні plugins                           | Підтримуйте роботу інтеграцій на основі hooks; це базовий рівень сумісності.                     |
| Нові bundled/нативні plugins                      | Надавайте перевагу явній реєстрації можливостей замість vendor-specific reach-ins або нових designs лише з hooks. |
| Зовнішні plugins, що впроваджують реєстрацію можливостей | Дозволено, але вважайте допоміжні поверхні для конкретних можливостей такими, що розвиваються, якщо документація не позначає їх стабільними. |

Реєстрація можливостей — це запланований напрям. Застарілі hooks залишаються найбезпечнішим шляхом без порушень сумісності для зовнішніх plugins під час переходу. Не всі експортовані допоміжні subpaths однакові — надавайте перевагу вузьким задокументованим контрактам, а не випадковим допоміжним експортам.

### Форми Plugin

OpenClaw класифікує кожен завантажений Plugin у форму на основі його фактичної поведінки реєстрації (а не лише статичних метаданих):

<AccordionGroup>
  <Accordion title="plain-capability">
    Реєструє рівно один тип можливості (наприклад, Plugin лише провайдера, як-от `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Реєструє кілька типів можливостей (наприклад, `openai` володіє текстовим висновком, мовленням, розумінням медіа та генерацією зображень).
  </Accordion>
  <Accordion title="hook-only">
    Реєструє лише hooks (типізовані або користувацькі), без можливостей, інструментів, команд або служб.
  </Accordion>
  <Accordion title="non-capability">
    Реєструє інструменти, команди, служби або маршрути, але без можливостей.
  </Accordion>
</AccordionGroup>

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin та розподіл можливостей. Докладніше див. [довідник CLI](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` і далі підтримується як шлях сумісності для plugins лише з hooks. Застарілі реальні plugins усе ще залежать від нього.

Напрям:

- підтримувати його роботу
- задокументувати його як застарілий
- надавати перевагу `before_model_resolve` для роботи з перевизначенням моделі/провайдера
- надавати перевагу `before_prompt_build` для роботи зі зміною prompt
- видаляти лише після зниження реального використання та після того, як покриття fixture доведе безпечність міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити одну з цих міток:

| Сигнал                     | Значення                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config успішно розбирається, а plugins розв'язуються         |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є deprecated  |
| **hard error**             | Config недійсний або Plugin не вдалося завантажити           |

Ні `hook-only`, ні `before_agent_start` сьогодні не зламають ваш Plugin: `hook-only` є рекомендаційним сигналом, а `before_agent_start` лише викликає попередження. Ці сигнали також з'являються в `openclaw status --all` та `openclaw plugins doctor`.

## Огляд архітектури

Система Plugin в OpenClaw має чотири шари:

<Steps>
  <Step title="Маніфест + виявлення">
    OpenClaw знаходить кандидатні plugins із налаштованих шляхів, коренів workspace, глобальних коренів plugins і bundled plugins. Виявлення спершу читає нативні маніфести `openclaw.plugin.json` та підтримувані маніфести bundle.
  </Step>
  <Step title="Увімкнення + валідація">
    Core вирішує, чи виявлений Plugin увімкнений, вимкнений, заблокований або вибраний для ексклюзивного слота, наприклад пам'яті.
  </Step>
  <Step title="Завантаження runtime">
    Нативні plugins OpenClaw завантажуються in-process і реєструють можливості в центральному реєстрі. Packaged JavaScript завантажується через нативний `require`; сторонній локальний source TypeScript є аварійним fallback Jiti. Сумісні bundles нормалізуються в записи реєстру без імпорту runtime-коду.
  </Step>
  <Step title="Споживання поверхонь">
    Решта OpenClaw читає реєстр, щоб відкривати інструменти, канали, налаштування провайдерів, hooks, HTTP-маршрути, команди CLI та служби.
  </Step>
</Steps>

Для Plugin CLI зокрема виявлення кореневих команд розділено на дві фази:

- метадані часу розбору надходять із `registerCli(..., { descriptors: [...] })`
- справжній модуль Plugin CLI може залишатися lazy і реєструватися під час першого виклику

Це зберігає код CLI, яким володіє Plugin, всередині Plugin, водночас дозволяючи OpenClaw зарезервувати назви кореневих команд до розбору.

Важлива межа дизайну:

- валідація manifest/config має працювати з **метаданих manifest/schema** без виконання коду Plugin
- виявлення нативних можливостей може завантажувати довірений entry-код Plugin, щоб побудувати неактивувальний snapshot реєстру
- runtime-поведінка нативного Plugin походить зі шляху `register(api)` модуля Plugin з `api.registrationMode === "full"`

Такий поділ дає OpenClaw змогу валідувати config, пояснювати відсутні/вимкнені plugins і будувати підказки UI/schema до активації повного runtime.

### Snapshot метаданих Plugin і таблиця пошуку

Під час запуску Gateway будує один `PluginMetadataSnapshot` для поточного snapshot config. Snapshot містить лише метадані: він зберігає індекс встановлених plugins, реєстр маніфестів, діагностику маніфестів, мапи власників, нормалізатор id Plugin і записи маніфестів. Він не містить завантажених модулів Plugin, SDK провайдерів, вмісту пакетів або runtime-експортів.

Валідація config з урахуванням Plugin, автоматичне увімкнення під час запуску та bootstrap Plugin у Gateway споживають цей snapshot замість того, щоб незалежно перебудовувати метадані manifest/index. `PluginLookUpTable` виводиться з того самого snapshot і додає план Plugin запуску для поточного runtime config.

Після запуску Gateway зберігає поточний snapshot метаданих як замінний runtime-продукт. Повторне runtime-виявлення провайдерів може використовувати цей snapshot замість реконструкції встановленого індексу та реєстру маніфестів для кожного проходу provider-catalog. Snapshot очищається або замінюється під час вимкнення Gateway, змін config/plugin inventory та записів встановленого індексу; callers повертаються до холодного шляху manifest/index, коли немає сумісного поточного snapshot. Перевірки сумісності мають включати корені виявлення Plugin, як-от `plugins.load.paths`, і типовий agent workspace, тому що workspace plugins є частиною області метаданих.

Snapshot і таблиця пошуку тримають повторювані рішення запуску на швидкому шляху:

- володіння каналами
- відкладений запуск каналів
- id Plugin запуску
- володіння провайдерами та бекендами CLI
- володіння setup provider, alias команди, provider каталогу моделей і контрактом маніфесту
- валідація config schema Plugin і channel config schema
- рішення автоматичного увімкнення під час запуску

Межа безпеки — це заміна snapshot, а не мутація. Перебудовуйте snapshot, коли змінюються config, plugin inventory, install records або persisted index policy. Не вважайте його широким змінним глобальним реєстром і не зберігайте необмежені історичні snapshots. Runtime-завантаження Plugin залишається окремим від metadata snapshots, щоб застарілий runtime-стан не міг бути прихований за metadata cache.

Правило cache задокументовано в [внутрішній архітектурі Plugin](/uk/plugins/architecture-internals#plugin-cache-boundary): метадані маніфесту та виявлення є свіжими, якщо caller явно не тримає snapshot, lookup table або manifest registry для поточного flow. Приховані metadata caches і wall-clock TTL не є частиною завантаження Plugin. Лише caches runtime loader, модулів і dependency-artifact можуть зберігатися після фактичного завантаження коду або встановлених артефактів.

Деякі callers холодного шляху все ще реконструюють реєстри маніфестів безпосередньо з persisted installed plugin index замість того, щоб отримувати Gateway `PluginLookUpTable`. Тепер цей шлях реконструює реєстр на вимогу; надавайте перевагу передаванню поточної lookup table або явного manifest registry через runtime flows, коли caller уже має один із них.

### Планування активації

Планування активації є частиною control plane. Callers можуть запитати, які plugins релевантні для конкретної команди, провайдера, каналу, маршруту, agent harness або можливості, перш ніж завантажувати ширші runtime registries.

Планувальник зберігає сумісність поточної поведінки маніфесту:

- поля `activation.*` є явними підказками планувальника
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і hooks залишаються fallback володіння з маніфесту
- API планувальника лише з id залишається доступним для наявних callers
- API плану повідомляє мітки причин, щоб діагностика могла відрізняти явні підказки від fallback володіння

<Warning>
Не розглядайте `activation` як lifecycle hook або заміну для `register(...)`. Це метадані, що використовуються для звуження завантаження. Віддавайте перевагу полям володіння, коли вони вже описують зв’язок; використовуйте `activation` лише для додаткових підказок планувальнику.
</Warning>

### Plugins каналів і спільний інструмент повідомлень

Plugins каналів не потрібно реєструвати окремий інструмент надсилання/редагування/реакції для звичайних дій чату. OpenClaw зберігає один спільний інструмент `message` у core, а plugins каналів володіють специфічним для каналу виявленням і виконанням за ним.

Поточна межа така:

- core володіє спільним хостом інструмента `message`, підключенням prompt, обліком сесій/потоків і dispatch виконання
- plugins каналів володіють виявленням scoped action, виявленням можливостей і будь-якими специфічними для каналу фрагментами schema
- plugins каналів володіють provider-specific граматикою сесійних розмов, наприклад тим, як conversation ids кодують thread ids або успадковуються від parent conversations
- plugins каналів виконують фінальну дію через свій action adapter

Для plugins каналів поверхня SDK — це `ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований discovery call дає plugin змогу повернути свої видимі дії, можливості та внески до schema разом, щоб ці частини не розходилися.

Коли специфічний для каналу параметр message-tool містить media source, як-от локальний шлях або віддалений media URL, plugin також має повертати `mediaSourceParams` з `describeMessageTool(...)`. Core використовує цей явний список, щоб застосовувати нормалізацію sandbox paths і підказки outbound media-access без жорстко заданих назв параметрів, що належать plugin. Віддавайте перевагу action-scoped maps там, а не одному плоскому списку для всього каналу, щоб media param лише для профілю не нормалізувався на непов’язаних діях, таких як `send`.

Core передає runtime scope у цей крок discovery. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted inbound `requesterSenderId`

Це важливо для context-sensitive plugins. Канал може приховувати або показувати message actions на основі активного account, поточної кімнати/потоку/повідомлення або довіреної ідентичності requester без жорстко заданих специфічних для каналу гілок у core інструменті `message`.

Саме тому зміни маршрутизації embedded-runner все ще є роботою plugin: runner відповідає за передавання поточної ідентичності chat/session у межу plugin discovery, щоб спільний інструмент `message` показував правильну поверхню, що належить каналу, для поточного turn.

Для channel-owned execution helpers bundled plugins мають тримати execution runtime всередині власних extension modules. Core більше не володіє Discord, Slack, Telegram або WhatsApp message-action runtimes у `src/agents/tools`. Ми не публікуємо окремі підшляхи `plugin-sdk/*-action-runtime`, а bundled plugins мають імпортувати власний локальний runtime code напряму зі своїх extension-owned modules.

Така сама межа застосовується до provider-named SDK seams загалом: core не має імпортувати специфічні для каналу convenience barrels для Slack, Discord, Signal, WhatsApp або подібних extensions. Якщо core потрібна поведінка, або споживайте власний barrel bundled plugin `api.ts` / `runtime-api.ts`, або підніміть потребу до вузької generic capability у shared SDK.

Bundled plugins дотримуються того самого правила. `runtime-api.ts` bundled plugin не має повторно експортувати власний branded facade `openclaw/plugin-sdk/<plugin-id>`. Ці branded facades лишаються compatibility shims для зовнішніх plugins і старіших consumers, але bundled plugins мають використовувати локальні exports плюс вузькі generic SDK subpaths, як-от `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` або `openclaw/plugin-sdk/webhook-ingress`. Новий код не має додавати plugin-id-specific SDK facades, якщо compatibility boundary для наявної зовнішньої екосистеми цього не вимагає.

Конкретно для polls є два шляхи виконання:

- `outbound.sendPoll` — спільний baseline для каналів, що відповідають common poll model
- `actions.handleAction("poll")` — бажаний шлях для специфічної для каналу семантики poll або додаткових параметрів poll

Core тепер відкладає shared poll parsing до моменту, коли plugin poll dispatch відхилить дію, тож plugin-owned poll handlers можуть приймати специфічні для каналу poll fields без попереднього блокування generic poll parser.

Див. [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals), щоб переглянути повну startup sequence.

## Модель володіння можливостями

OpenClaw розглядає native plugin як межу володіння для **компанії** або **функції**, а не як довільний набір непов’язаних інтеграцій.

Це означає:

- company plugin зазвичай має володіти всіма OpenClaw-facing surfaces цієї компанії
- feature plugin зазвичай має володіти повною feature surface, яку він вводить
- канали мають споживати shared core capabilities замість ad hoc повторної реалізації provider behavior

<AccordionGroup>
  <Accordion title="Багатоможливісний постачальник">
    `openai` володіє text inference, speech, realtime voice, media understanding і image generation. `google` володіє text inference плюс media understanding, image generation і web search. `qwen` володіє text inference плюс media understanding і video generation.
  </Accordion>
  <Accordion title="Одноможливісний постачальник">
    `elevenlabs` і `microsoft` володіють speech; `firecrawl` володіє web-fetch; `minimax` / `mistral` / `moonshot` / `zai` володіють media-understanding backends.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` володіє call transport, tools, CLI, routes і Twilio media-stream bridging, але споживає shared speech, realtime transcription і realtime voice capabilities замість прямого імпорту vendor plugins.
  </Accordion>
</AccordionGroup>

Бажаний кінцевий стан:

- OpenAI живе в одному plugin, навіть якщо він охоплює text models, speech, images і майбутнє video
- інший постачальник може зробити те саме для власної surface area
- каналам байдуже, який vendor plugin володіє provider; вони споживають shared capability contract, відкритий core

Ключова відмінність така:

- **plugin** = межа володіння
- **capability** = core contract, який кілька plugins можуть реалізовувати або споживати

Тож якщо OpenClaw додає новий domain, наприклад video, перше питання не "який provider має hardcode video handling?" Перше питання: "який core video capability contract?" Коли цей contract існує, vendor plugins можуть реєструватися щодо нього, а channel/feature plugins можуть його споживати.

Якщо capability ще не існує, правильний крок зазвичай такий:

<Steps>
  <Step title="Визначте capability">
    Визначте відсутню capability у core.
  </Step>
  <Step title="Відкрийте через SDK">
    Відкрийте її через plugin API/runtime типізованим способом.
  </Step>
  <Step title="Підключіть consumers">
    Підключіть канали/функції до цієї capability.
  </Step>
  <Step title="Реалізації постачальників">
    Дайте vendor plugins зареєструвати implementations.
  </Step>
</Steps>

Це зберігає володіння явним і водночас уникає core behavior, що залежить від одного постачальника або одноразового plugin-specific code path.

### Шарування capability

Використовуйте цю mental model, коли вирішуєте, де має бути код:

<Tabs>
  <Tab title="Шар core capability">
    Shared orchestration, policy, fallback, config merge rules, delivery semantics і typed contracts.
  </Tab>
  <Tab title="Шар vendor plugin">
    Vendor-specific APIs, auth, model catalogs, speech synthesis, image generation, майбутні video backends, usage endpoints.
  </Tab>
  <Tab title="Шар channel/feature plugin">
    Інтеграція Slack/Discord/voice-call/etc., яка споживає core capabilities і представляє їх на surface.
  </Tab>
</Tabs>

Наприклад, TTS має таку форму:

- core володіє reply-time TTS policy, fallback order, prefs і channel delivery
- `openai`, `elevenlabs` і `microsoft` володіють synthesis implementations
- `voice-call` споживає telephony TTS runtime helper

Той самий шаблон слід віддавати перевагу для майбутніх capabilities.

### Приклад багатоможливісного company plugin

Company plugin має ззовні відчуватися цілісним. Якщо OpenClaw має shared contracts для models, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch і web search, постачальник може володіти всіма своїми surfaces в одному місці:

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

- один plugin володіє vendor surface
- core усе ще володіє capability contracts
- channels і feature plugins споживають helpers `api.runtime.*`, а не vendor code
- contract tests можуть перевіряти, що plugin зареєстрував capabilities, якими заявляє володіння

### Приклад capability: video understanding

OpenClaw уже розглядає image/audio/video understanding як одну shared capability. Та сама ownership model застосовується й там:

<Steps>
  <Step title="Core визначає contract">
    Core визначає media-understanding contract.
  </Step>
  <Step title="Vendor plugins реєструються">
    Vendor plugins реєструють `describeImage`, `transcribeAudio` і `describeVideo`, якщо застосовно.
  </Step>
  <Step title="Consumers використовують shared behavior">
    Channels і feature plugins споживають shared core behavior замість прямого підключення до vendor code.
  </Step>
</Steps>

Це уникає вбудовування припущень одного provider щодо video в core. Plugin володіє vendor surface; core володіє capability contract і fallback behavior.

Video generation уже використовує таку саму послідовність: core володіє typed capability contract і runtime helper, а vendor plugins реєструють implementations `api.registerVideoGenerationProvider(...)` щодо нього.

Потрібен конкретний rollout checklist? Див. [Capability Cookbook](/uk/plugins/architecture).

## Contracts і enforcement

Поверхня plugin API навмисно типізована й централізована в `OpenClawPluginApi`. Цей contract визначає підтримувані registration points і runtime helpers, на які plugin може покладатися.

Чому це важливо:

- автори plugins отримують один стабільний внутрішній стандарт
- core може відхиляти duplicate ownership, як-от два plugins, що реєструють той самий provider id
- startup може показувати actionable diagnostics для malformed registration
- contract tests можуть забезпечувати bundled-plugin ownership і запобігати silent drift

Є два шари enforcement:

<AccordionGroup>
  <Accordion title="Примусове застосування реєстрації під час виконання">
    Реєстр plugin перевіряє реєстрації під час завантаження plugin. Приклади: дубльовані ідентифікатори провайдерів, дубльовані ідентифікатори мовленнєвих провайдерів і некоректно сформовані реєстрації створюють діагностику plugin замість невизначеної поведінки.
  </Accordion>
  <Accordion title="Тести контрактів">
    Вбудовані plugins фіксуються в реєстрах контрактів під час тестових запусків, щоб OpenClaw міг явно перевіряти володіння. Наразі це використовується для провайдерів моделей, мовленнєвих провайдерів, провайдерів вебпошуку та володіння вбудованими реєстраціями.
  </Accordion>
</AccordionGroup>

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який plugin володіє якою поверхнею. Це дає змогу core і каналам узгоджено компонуватися, бо володіння є оголошеним, типізованим і тестованим, а не неявним.

### Що належить до контракту

<Tabs>
  <Tab title="Добрі контракти">
    - типізовані
    - малі
    - специфічні для capability
    - належать core
    - багаторазово використовувані кількома plugins
    - придатні для використання каналами/функціями без знання постачальника

  </Tab>
  <Tab title="Погані контракти">
    - специфічна для постачальника політика, прихована в core
    - одноразові обхідні шляхи plugin, що обходять реєстр
    - код каналу, який звертається безпосередньо до реалізації постачальника
    - спеціальні об’єкти часу виконання, які не є частиною `OpenClawPluginApi` або `api.runtime`

  </Tab>
</Tabs>

Якщо маєте сумнів, підніміть рівень абстракції: спочатку визначте capability, а потім дайте plugins під’єднатися до неї.

## Модель виконання

Нативні plugins OpenClaw працюють **у процесі** разом із Gateway. Вони не ізольовані в пісочниці. Завантажений нативний plugin має ту саму межу довіри на рівні процесу, що й core-код.

<Warning>
Наслідки нативного plugin: plugin може реєструвати інструменти, мережеві обробники, hooks і служби; помилка plugin може аварійно завершити або дестабілізувати gateway; а зловмисний нативний plugin еквівалентний виконанню довільного коду всередині процесу OpenClaw.
</Warning>

Сумісні пакети безпечніші за замовчуванням, бо OpenClaw наразі розглядає їх як пакети метаданих/контенту. У поточних випусках це здебільшого означає вбудовані Skills.

Використовуйте allowlists і явні шляхи встановлення/завантаження для невбудованих plugins. Розглядайте workspace plugins як код для часу розробки, а не як production-типові значення.

Для назв вбудованих workspace-пакетів утримуйте ідентифікатор plugin прив’язаним до npm-назви: `@openclaw/<id>` за замовчуванням або затверджений типізований суфікс, як-от `-provider`, `-plugin`, `-speech`, `-sandbox` чи `-media-understanding`, коли пакет навмисно надає вужчу роль plugin.

<Note>
**Примітка про довіру:** `plugins.allow` довіряє **ідентифікаторам plugin**, а не походженню джерела. Workspace plugin з тим самим ідентифікатором, що й вбудований plugin, навмисно затіняє вбудовану копію, коли цей workspace plugin увімкнено/додано до allowlist. Це нормально й корисно для локальної розробки, тестування патчів і hotfixes. Довіра до вбудованого plugin визначається зі знімка джерела — маніфесту й коду на диску під час завантаження — а не з метаданих встановлення. Пошкоджений або підмінений запис встановлення не може непомітно розширити поверхню довіри вбудованого plugin понад те, що заявляє фактичне джерело.
</Note>

## Межа експорту

OpenClaw експортує capabilities, а не зручності реалізації.

Залишайте реєстрацію capabilities публічною. Скорочуйте експорти допоміжних засобів, що не є контрактами:

- допоміжні subpaths, специфічні для вбудованого plugin
- subpaths runtime plumbing, не призначені як публічний API
- зручні допоміжні засоби, специфічні для постачальника
- допоміжні засоби налаштування/onboarding, які є деталями реалізації

Зарезервовані допоміжні subpaths вбудованих plugin були вилучені зі згенерованої карти експорту SDK. Залишайте специфічні для власника допоміжні засоби всередині пакета plugin, якому вони належать; просувайте лише багаторазово використовувану поведінку хоста до загальних контрактів SDK, таких як `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

## Внутрішні механізми та довідка

Щодо конвеєра завантаження, моделі реєстру, runtime hooks провайдера, HTTP-маршрутів Gateway, схем інструментів повідомлень, визначення цілей каналів, каталогів провайдерів, plugins контекстного рушія та посібника з додавання нової capability див. [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Маніфест Plugin](/uk/plugins/manifest)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
