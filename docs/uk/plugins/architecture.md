---
read_when:
    - Створення або налагодження нативних plugin OpenClaw
    - Розуміння моделі можливостей plugin або меж власності
    - Робота над конвеєром завантаження plugin або реєстром
    - Реалізація runtime-хуків provider або channel plugin
sidebarTitle: Internals
summary: 'Внутрішня будова plugin: модель можливостей, межі власності, контракти, конвеєр завантаження та допоміжні засоби runtime'
title: Внутрішня будова plugin
x-i18n:
    generated_at: "2026-04-07T18:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc5a62710390dc6ad064b818222c1bb7609b3d076741f80bb5bbd9edb90342f1
    source_path: plugins/architecture.md
    workflow: 15
---

# Внутрішня будова plugin

<Info>
  Це **довідник із глибокої архітектури**. Практичні посібники дивіться тут:
  - [Встановлення та використання plugin](/uk/tools/plugin) — посібник користувача
  - [Початок роботи](/uk/plugins/building-plugins) — перший навчальний посібник зі створення plugin
  - [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення каналу обміну повідомленнями
  - [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення постачальника моделей
  - [Огляд SDK](/uk/plugins/sdk-overview) — карта імпортів і API реєстрації
</Info>

Ця сторінка описує внутрішню архітектуру системи plugin в OpenClaw.

## Публічна модель можливостей

Можливості — це публічна модель **нативних plugin** всередині OpenClaw. Кожен
нативний plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість             | Метод реєстрації                               | Приклади plugin                     |
| ---------------------- | ---------------------------------------------- | ----------------------------------- |
| Текстова інференція    | `api.registerProvider(...)`                    | `openai`, `anthropic`               |
| Бекенд CLI для інференції | `api.registerCliBackend(...)`               | `openai`, `anthropic`               |
| Мовлення               | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`           |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | `openai`                            |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                  |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                 |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`     | `qwen`                              |
| Веботримання           | `api.registerWebFetchProvider(...)`            | `firecrawl`                         |
| Вебпошук               | `api.registerWebSearchProvider(...)`           | `google`                            |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                | `msteams`, `matrix`                 |

Plugin, який не реєструє жодної можливості, але надає hooks, tools або
services, є **застарілим plugin лише з hooks**. Такий шаблон досі повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже впроваджена в core і сьогодні використовується
вбудованими/нативними plugin, але сумісність із зовнішніми plugin усе ще
потребує вищої планки, ніж "це експортується, отже, це заморожено."

Поточні рекомендації:

- **наявні зовнішні plugin:** зберігайте працездатність інтеграцій на основі hook;
  вважайте це базовим рівнем сумісності
- **нові вбудовані/нативні plugin:** віддавайте перевагу явній реєстрації можливостей,
  а не vendor-специфічним зверненням углиб або новим дизайнам лише з hooks
- **зовнішні plugin, що переходять на реєстрацію можливостей:** це дозволено, але
  вважайте допоміжні поверхні, специфічні для можливостей, такими, що еволюціонують,
  якщо документація явно не позначає контракт як стабільний

Практичне правило:

- API реєстрації можливостей — це бажаний напрям
- застарілі hooks залишаються найбезпечнішим шляхом без порушення сумісності
  для зовнішніх plugin під час переходу
- не всі експортовані допоміжні підшляхи однакові; віддавайте перевагу вузькому
  задокументованому контракту, а не випадковим експортам допоміжних засобів

### Форми plugin

OpenClaw класифікує кожен завантажений plugin за формою на основі його
фактичної поведінки під час реєстрації, а не лише статичних метаданих:

- **plain-capability** -- реєструє рівно один тип можливості (наприклад,
  plugin лише для provider, як-от `mistral`)
- **hybrid-capability** -- реєструє кілька типів можливостей (наприклад,
  `openai` володіє текстовою інференцією, мовленням, розумінням медіа та генерацією зображень)
- **hook-only** -- реєструє лише hooks (типізовані або кастомні), без можливостей,
  tools, commands або services
- **non-capability** -- реєструє tools, commands, services або routes, але без
  можливостей

Використайте `openclaw plugins inspect <id>`, щоб побачити форму plugin та
розподіл можливостей. Докладніше див. у [довідці CLI](/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для
plugin лише з hooks. Наявні реальні застарілі plugin досі від нього залежать.

Напрям:

- зберігати його працездатним
- документувати його як застарілий
- для перевизначення моделі/provider віддавати перевагу `before_model_resolve`
- для мутації prompt віддавати перевагу `before_prompt_build`
- видаляти лише після зниження реального використання і після того, як покриття
  фікстурами доведе безпечність міграції

### Сигнали сумісності

Під час виконання `openclaw doctor` або `openclaw plugins inspect <id>` ви можете побачити
одну з таких міток:

| Сигнал                     | Значення                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Конфігурація успішно парситься, і plugin успішно розв'язуються |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є застарілим  |
| **hard error**             | Конфігурація невалідна або plugin не вдалося завантажити     |

Ні `hook-only`, ні `before_agent_start` не зламають ваш plugin сьогодні --
`hook-only` має дорадчий характер, а `before_agent_start` лише викликає попередження. Ці
сигнали також з'являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система plugin в OpenClaw має чотири шари:

1. **Маніфест + виявлення**
   OpenClaw знаходить потенційні plugin у налаштованих шляхах, коренях workspace,
   глобальних коренях extension і серед вбудованих extension. Під час виявлення спочатку
   читаються нативні маніфести `openclaw.plugin.json` і підтримувані bundle-маніфести.
2. **Увімкнення + валідація**
   Core вирішує, чи виявлений plugin увімкнений, вимкнений, заблокований або
   вибраний для ексклюзивного слота, такого як memory.
3. **Завантаження runtime**
   Нативні plugin OpenClaw завантажуються в процес через jiti і реєструють
   можливості в центральному реєстрі. Сумісні bundles нормалізуються у записи
   реєстру без імпорту коду runtime.
4. **Використання поверхонь**
   Решта OpenClaw читає реєстр, щоб надавати tools, channels, налаштування provider,
   hooks, HTTP routes, CLI commands і services.

Зокрема для CLI plugin виявлення кореневих команд розділене на дві фази:

- метадані часу парсингу надходять із `registerCli(..., { descriptors: [...] })`
- реальний модуль CLI plugin може залишатися лінивим і реєструватися під час першого виклику

Це дає змогу тримати код CLI, який належить plugin, всередині plugin і водночас дозволяє OpenClaw
резервувати імена кореневих команд до початку парсингу.

Важлива межа проєктування:

- виявлення + валідація config мають працювати на основі **метаданих manifest/schema**
  без виконання коду plugin
- нативна поведінка runtime надходить із шляху `register(api)` модуля plugin

Такий поділ дозволяє OpenClaw валідовувати config, пояснювати відсутні/вимкнені plugin і
будувати підказки для UI/schema ще до повної активації runtime.

### Channel plugin і спільний tool повідомлень

Channel plugin не потрібно реєструвати окремий tool для надсилання/редагування/реакцій
для звичайних дій у чаті. OpenClaw підтримує один спільний tool `message` у core, а
channel plugin відповідають за специфічне для каналу виявлення та виконання за ним.

Поточна межа така:

- core відповідає за спільний host tool `message`, підключення до prompt,
  облік сесій/потоків і диспетчеризацію виконання
- channel plugin відповідають за виявлення дій у межах області, виявлення
  можливостей і будь-які фрагменти schema, специфічні для каналу
- channel plugin відповідають за граматику розмови сесії, специфічну для provider,
  зокрема за те, як conversation id кодують thread id або успадковуються від батьківських conversations
- channel plugin виконують фінальну дію через свій action adapter

Для channel plugin поверхнею SDK є
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик
виявлення дозволяє plugin повертати видимі дії, можливості та внески в schema
разом, щоб ці частини не розходилися.

Core передає до цього кроку виявлення runtime-область. Важливі поля:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для context-sensitive plugin. Канал може приховувати або показувати
дії повідомлень залежно від активного облікового запису, поточної кімнати/потоку/повідомлення або
довіреної ідентичності запитувача без жорстко закодованих розгалужень, специфічних для каналу,
у core tool `message`.

Саме тому зміни маршрутизації embedded-runner усе ще є роботою plugin: runner
відповідає за передавання поточної ідентичності чату/сесії в межу виявлення plugin, щоб
спільний tool `message` показував правильну поверхню, що належить каналу,
для поточного ходу.

Для допоміжних засобів виконання, що належать каналу, вбудовані plugin мають тримати runtime
виконання всередині власних модулів extension. Core більше не володіє runtime
message-action для Discord, Slack, Telegram або WhatsApp у `src/agents/tools`.
Ми не публікуємо окремі підшляхи `plugin-sdk/*-action-runtime`, і вбудовані
plugin мають імпортувати свій локальний код runtime безпосередньо зі своїх
модулів extension.

Та сама межа застосовується і до SDK seam, названих на честь provider, загалом:
core не повинен імпортувати channel-специфічні convenience barrel для Slack, Discord, Signal,
WhatsApp або подібних extension. Якщо core потрібна певна поведінка, або
використовуйте власний barrel `api.ts` / `runtime-api.ts` відповідного вбудованого plugin,
або підніміть потребу в вузьку узагальнену можливість у спільному SDK.

Зокрема для polls існують два шляхи виконання:

- `outbound.sendPoll` — спільний базовий варіант для каналів, які відповідають загальній
  моделі опитувань
- `actions.handleAction("poll")` — бажаний шлях для channel-специфічної
  семантики опитувань або додаткових параметрів опитування

Тепер core відкладає спільний парсинг опитувань до моменту, коли dispatch опитування plugin
відхилить дію, щоб обробники опитувань, що належать plugin, могли приймати
channel-специфічні поля опитувань без блокування спочатку загальним парсером poll.

Повну послідовність запуску див. у [Конвеєр завантаження](#load-pipeline).

## Модель власності можливостей

OpenClaw розглядає нативний plugin як межу власності для **компанії** або
**функції**, а не як набір не пов'язаних між собою інтеграцій.

Це означає:

- plugin компанії зазвичай має володіти всіма OpenClaw-поверхнями цієї компанії
- plugin функції зазвичай має володіти повною поверхнею функції, яку він вводить
- channels мають споживати спільні можливості core замість того, щоб
  ситуативно перевпроваджувати поведінку provider

Приклади:

- вбудований plugin `openai` володіє поведінкою provider моделей OpenAI і поведінкою OpenAI для
  мовлення + голосу в реальному часі + розуміння медіа + генерації зображень
- вбудований plugin `elevenlabs` володіє поведінкою мовлення ElevenLabs
- вбудований plugin `microsoft` володіє поведінкою мовлення Microsoft
- вбудований plugin `google` володіє поведінкою provider моделей Google, а також поведінкою Google для
  розуміння медіа + генерації зображень + вебпошуку
- вбудований plugin `firecrawl` володіє поведінкою веботримання Firecrawl
- вбудовані plugin `minimax`, `mistral`, `moonshot` і `zai` володіють своїми
  бекендами розуміння медіа
- вбудований plugin `qwen` володіє текстовою поведінкою provider Qwen, а також
  поведінкою розуміння медіа і генерації відео
- plugin `voice-call` — це plugin функції: він володіє транспортом дзвінків, tools,
  CLI, routes і мостом медіапотоків Twilio, але споживає спільні можливості мовлення,
  а також транскрипції і голосу в реальному часі замість прямого імпорту vendor plugin

Бажаний кінцевий стан:

- OpenAI живе в одному plugin, навіть якщо він охоплює текстові моделі, мовлення, зображення і
  майбутнє відео
- інший vendor може зробити те саме для власної області
- channels не турбує, який vendor plugin володіє provider; вони споживають
  спільний контракт можливості, який надає core

Ось ключова відмінність:

- **plugin** = межа власності
- **можливість** = контракт core, який можуть реалізовувати або споживати кілька plugin

Тому, якщо OpenClaw додає нову доменну область, наприклад відео, перше запитання не
"який provider має жорстко закодувати обробку відео?" Перше запитання — "яким є
контракт core для можливості відео?" Щойно такий контракт існує, vendor plugin
можуть реєструватися для нього, а channel/feature plugin можуть його споживати.

Якщо можливість ще не існує, зазвичай правильний крок такий:

1. визначити відсутню можливість у core
2. відкрити її через API/runtime plugin у типізований спосіб
3. під'єднати channels/features до цієї можливості
4. дозволити vendor plugin реєструвати реалізації

Це зберігає явну власність і водночас уникає поведінки core, що залежить від
одного vendor або одноразового plugin-специфічного шляху коду.

### Шарування можливостей

Використовуйте цю ментальну модель, коли вирішуєте, де має бути код:

- **шар можливостей core**: спільна оркестрація, політика, fallback, правила
  злиття config, семантика доставки та типізовані контракти
- **шар vendor plugin**: vendor-специфічні API, auth, каталоги моделей, синтез мовлення,
  генерація зображень, майбутні відеобекенди, endpoint використання
- **шар channel/feature plugin**: інтеграції Slack/Discord/voice-call/etc.,
  які споживають можливості core і представляють їх на певній поверхні

Наприклад, TTS має таку форму:

- core володіє політикою TTS під час відповіді, порядком fallback, prefs і доставкою в канал
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями синтезу
- `voice-call` споживає допоміжний runtime TTS для телефонії

Той самий шаблон слід віддавати перевагу і для майбутніх можливостей.

### Приклад plugin компанії з кількома можливостями

Plugin компанії має виглядати цілісно ззовні. Якщо OpenClaw має спільні
контракти для моделей, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа,
генерації зображень, генерації відео, веботримання та вебпошуку,
vendor може володіти всіма своїми поверхнями в одному місці:

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

- один plugin володіє поверхнею vendor
- core все одно володіє контрактами можливостей
- channels і feature plugin споживають helper `api.runtime.*`, а не код vendor
- контрактні тести можуть перевіряти, що plugin зареєстрував можливості, якими
  він заявляє, що володіє

### Приклад можливості: розуміння відео

OpenClaw уже розглядає розуміння зображень/аудіо/відео як одну спільну
можливість. Та сама модель власності застосовується і тут:

1. core визначає контракт media-understanding
2. vendor plugin реєструють `describeImage`, `transcribeAudio` і
   `describeVideo`, де це застосовно
3. channels і feature plugin споживають спільну поведінку core, а не
   напряму під'єднуються до коду vendor

Це дозволяє не вбудовувати припущення одного provider щодо відео в core. Plugin володіє
поверхнею vendor; core володіє контрактом можливості та поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим
контрактом можливості та helper runtime, а vendor plugin реєструють
реалізації `api.registerVideoGenerationProvider(...)` для неї.

Потрібен конкретний контрольний список впровадження? Див.
[Capability Cookbook](/uk/plugins/architecture).

## Контракти та контроль

Поверхня API plugin навмисно типізована і централізована в
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
helper runtime, на які plugin може покладатися.

Чому це важливо:

- автори plugin отримують один стабільний внутрішній стандарт
- core може відхиляти дубльовану власність, наприклад коли два plugin реєструють один і той самий provider id
- під час запуску можна показувати діагностику з конкретними діями для
  некоректної реєстрації
- контрактні тести можуть контролювати власність вбудованих plugin і запобігати тихому дрейфу

Є два шари контролю:

1. **контроль реєстрації під час runtime**
   Реєстр plugin валідовує реєстрації під час завантаження plugin. Приклади:
   дубльовані id provider, дубльовані id provider мовлення та некоректні
   реєстрації породжують діагностику plugin замість невизначеної поведінки.
2. **контрактні тести**
   Вбудовані plugin захоплюються в контрактні реєстри під час тестових запусків, щоб
   OpenClaw міг явно перевіряти власність. Сьогодні це використовується для model
   providers, speech providers, web-search providers і власності вбудованих реєстрацій.

Практичний ефект у тому, що OpenClaw наперед знає, який plugin якою
поверхнею володіє. Це дозволяє core і channels безшовно поєднуватися, оскільки
власність оголошена, типізована і піддається тестуванню, а не є неявною.

### Що має входити до контракту

Хороші контракти plugin:

- типізовані
- малі
- специфічні для можливості
- належать core
- повторно використовуються кількома plugin
- можуть споживатися channels/features без знання про vendor

Погані контракти plugin:

- vendor-специфічна політика, прихована в core
- одноразові лазівки для plugin, які обходять реєстр
- код каналу, який напряму лізе у vendor-реалізацію
- спеціальні runtime-об'єкти, що не входять до `OpenClawPluginApi` або
  `api.runtime`

Якщо сумніваєтеся, піднімайте рівень абстракції: спочатку визначте можливість, а
потім дозволяйте plugin підключатися до неї.

## Модель виконання

Нативні plugin OpenClaw працюють **у межах процесу** разом із Gateway. Вони не
ізольовані. Завантажений нативний plugin має ту саму межу довіри на рівні процесу,
що й код core.

Наслідки:

- нативний plugin може реєструвати tools, network handlers, hooks і services
- помилка нативного plugin може призвести до аварії gateway або його дестабілізації
- зловмисний нативний plugin еквівалентний довільному виконанню коду всередині
  процесу OpenClaw

Сумісні bundles безпечніші за замовчуванням, тому що зараз OpenClaw розглядає їх
як набори метаданих/контенту. У поточних релізах це переважно означає
вбудовані Skills.

Використовуйте allowlist і явні шляхи встановлення/завантаження для невбудованих plugin. Розглядайте
workspace plugin як код для часу розробки, а не як бойові типові значення.

Для назв пакетів у workspace-вбудованих plugin зберігайте прив'язку id plugin у npm-імені:
`@openclaw/<id>` за замовчуванням або затверджений типізований суфікс, наприклад
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно відкриває вужчу роль plugin.

Важлива примітка щодо довіри:

- `plugins.allow` довіряє **id plugin**, а не походженню джерела.
- workspace plugin з тим самим id, що й вбудований plugin, навмисно затіняє
  вбудовану копію, коли цей workspace plugin увімкнено/додано до allowlist.
- Це нормально й корисно для локальної розробки, тестування патчів і hotfix.

## Межа експорту

OpenClaw експортує можливості, а не зручні реалізаційні helper.

Залишайте реєстрацію можливостей публічною. Скорочуйте експорти helper, які не є контрактом:

- допоміжні підшляхи, специфічні для вбудованих plugin
- підшляхи plumbing runtime, не призначені як публічний API
- vendor-специфічні convenience helper
- helper налаштування/onboarding, які є деталями реалізації

Деякі підшляхи helper вбудованих plugin усе ще залишаються в згенерованій карті
експортів SDK для сумісності та підтримки вбудованих plugin. Поточні приклади:
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька seam `plugin-sdk/matrix*`. Розглядайте їх як
зарезервовані експорти деталей реалізації, а не як рекомендований шаблон SDK для
нових сторонніх plugin.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. знаходить корені потенційних plugin
2. читає нативні або сумісні bundle-маніфести та метадані package
3. відхиляє небезпечні кандидати
4. нормалізує config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає стан увімкнення для кожного кандидата
6. завантажує увімкнені нативні модулі через jiti
7. викликає hooks нативного `register(api)` (або `activate(api)` — застарілий псевдонім) і збирає реєстрації до реєстру plugin
8. відкриває реєстр для команд/поверхонь runtime

<Note>
`activate` — це застарілий псевдонім для `register` — loader знаходить будь-який із них (`def.register ?? def.activate`) і викликає його в тій самій точці. Усі вбудовані plugin використовують `register`; для нових plugin віддавайте перевагу `register`.
</Note>

Запобіжні перевірки відбуваються **до** виконання runtime. Кандидати блокуються,
якщо entry виходить за межі кореня plugin, шлях доступний на запис для всіх або
власність шляху виглядає підозріло для невбудованих plugin.

### Поведінка manifest-first

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- знаходити оголошені channels/skills/schema config або можливості bundle
- валідовувати `plugins.entries.<id>.config`
- доповнювати labels/placeholders у Control UI
- показувати метадані встановлення/каталогу

Для нативних plugin модуль runtime є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, tools, commands або потоки provider.

### Що кешує loader

OpenClaw підтримує короткоживучі кеші в межах процесу для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів plugin

Ці кеші зменшують ривкове навантаження під час запуску та повторних команд. Їх
доречно розглядати як короткоживучі кеші продуктивності, а не як сховище.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugin не змінюють випадкові глобальні об'єкти core напряму. Вони
реєструються в центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- channels
- providers
- handlers Gateway RPC
- HTTP routes
- реєстратори CLI
- фонові services
- commands, що належать plugin

Після цього можливості core читають із цього реєстру замість прямої взаємодії
з модулями plugin. Це зберігає односторонність завантаження:

- модуль plugin -> реєстрація в реєстрі
- runtime core -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь core
потрібна лише одна точка інтеграції: "читати реєстр", а не "створювати окремі special-case для кожного модуля plugin".

## Callback-и прив'язки conversation

Plugin, які прив'язують conversation, можуть реагувати, коли схвалення вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після
схвалення або відхилення запиту на прив'язку:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля callback payload:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: розв'язана прив'язка для схвалених запитів
- `request`: підсумок оригінального запиту, підказка від'єднання, id відправника та
  метадані conversation

Цей callback має лише повідомний характер. Він не змінює, кому дозволено
прив'язувати conversation, і виконується після завершення обробки схвалення в core.

## Runtime-hooks provider

Тепер plugin provider мають два шари:

- метадані маніфесту: `providerAuthEnvVars` для дешевого пошуку env-auth provider
  до завантаження runtime, `channelEnvVars` для дешевого пошуку env/setup каналу
  до завантаження runtime, а також `providerAuthChoices` для дешевих
  labels onboarding/auth-choice і метаданих прапорців CLI до завантаження runtime
- hooks часу config: `catalog` / застарілий `discovery` плюс `applyConfigDefaults`
- hooks runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw як і раніше володіє загальним циклом агента, failover, обробкою transcript і
політикою tools. Ці hooks є поверхнею розширення для поведінки provider без
потреби в повністю кастомному транспорті інференції.

Використовуйте manifest `providerAuthEnvVars`, коли provider має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime plugin.
Використовуйте manifest `providerAuthChoices`, коли поверхні onboarding/auth-choice CLI
мають знати id варіанта provider, labels груп і просте підключення auth одним прапорцем
без завантаження runtime provider. Зберігайте `envVars` runtime provider для
підказок для операторів, таких як labels onboarding або змінні налаштування OAuth
client-id/client-secret.

Використовуйте manifest `channelEnvVars`, коли канал має auth або setup на основі env,
які загальні шляхи shell-env fallback, перевірок config/status або prompts setup
мають бачити без завантаження runtime каналу.

### Порядок hook і спосіб використання

Для plugin моделей/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпчик "Коли використовувати" — це швидкий орієнтир для вибору.

| #   | Hook                              | Що він робить                                                                                                  | Коли використовувати                                                                                                                        |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує config provider у `models.providers` під час генерації `models.json`                                  | Provider володіє каталогом або типовими значеннями base URL                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує типові значення config, що належать provider, під час матеріалізації config                         | Типові значення залежать від режиму auth, env або семантики сімейства моделей provider                                                     |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                   | _(це не hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Provider володіє очищенням псевдонімів до канонічного розв'язання моделі                                                                   |
| 4   | `normalizeTransport`              | Нормалізує provider-family `api` / `baseUrl` перед загальним складанням моделі                                 | Provider володіє очищенням транспорту для кастомних id provider у тій самій transport family                                               |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв'язанням runtime/provider                                         | Provider потребує очищення config, яке має жити разом із plugin; вбудовані helper для сімейства Google також підстраховують підтримувані записи config Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи native streaming-usage до config providers                                        | Provider потребує виправлень метаданих native streaming usage, що залежать від endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Розв'язує env-marker auth для config providers до завантаження runtime auth                                    | Provider має власне розв'язання API-ключа env-marker; `amazon-bedrock` також має тут вбудований resolver env-marker AWS                   |
| 8   | `resolveSyntheticAuth`            | Показує локальний/self-hosted або auth на основі config без збереження plaintext                               | Provider може працювати із synthetic/local marker credential                                                                                |
| 9   | `resolveExternalAuthProfiles`     | Накладає профілі зовнішньої auth, що належать provider; типове `persistence` — `runtime-only` для creds CLI/app | Provider повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic placeholder profile порівняно з auth на основі env/config               | Provider зберігає synthetic placeholder profiles, які не мають переважати                                                                  |
| 11  | `resolveDynamicModel`             | Синхронний fallback для model id provider, яких ще немає в локальному реєстрі                                  | Provider приймає довільні upstream model id                                                                                                |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Provider потребує мережевих метаданих перед розв'язанням невідомих id                                                                      |
| 13  | `normalizeResolvedModel`          | Фінальний rewrite перед тим, як embedded runner використає розв'язану модель                                   | Provider потребує rewrite транспорту, але все ще використовує core transport                                                                |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для vendor-моделей за іншим сумісним transport                                            | Provider розпізнає власні моделі на proxy transport без перехоплення ролі provider                                                         |
| 15  | `capabilities`                    | Метадані transcript/tooling, що належать provider і використовуються спільною логікою core                     | Provider потрібні особливості transcript/provider-family                                                                                    |
| 16  | `normalizeToolSchemas`            | Нормалізує schema tools до того, як їх побачить embedded runner                                                | Provider потребує очищення schema для transport-family                                                                                      |
| 17  | `inspectToolSchemas`              | Показує diagnostics schema, що належать provider, після нормалізації                                            | Provider хоче попередження щодо keyword без навчання core правилам, специфічним для provider                                               |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: native чи tagged                                                            | Provider потребує tagged reasoning/final output замість native fields                                                                       |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту до загальних обгорток опцій stream                                              | Provider потребує типових параметрів запиту або очищення параметрів для конкретного provider                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream кастомним transport                                                     | Provider потребує кастомного wire protocol, а не лише wrapper                                                                              |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних wrapper                                                           | Provider потребує wrapper для headers/body/model compat без кастомного transport                                                           |
| 22  | `resolveTransportTurnState`       | Додає native headers або metadata на один хід transport                                                        | Provider хоче, щоб загальні transport надсилали native turn identity provider                                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native headers WebSocket або політику cool-down сесії                                                    | Provider хоче, щоб загальні transport WS налаштовували headers сесії або політику fallback                                                 |
| 24  | `formatApiKey`                    | Форматер auth-profile: збережений profile стає runtime-рядком `apiKey`                                         | Provider зберігає додаткові метадані auth і потребує кастомної форми runtime token                                                         |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для кастомних endpoint refresh або політики помилок refresh                       | Provider не вписується у спільні refreshers `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається, коли не вдається OAuth refresh                                         | Provider потребує власних рекомендацій з ремонту auth після помилки refresh                                                                |
| 27  | `matchesContextOverflowError`     | Matcher переповнення контекстного вікна, що належить provider                                                  | Provider має сирі помилки переповнення, які пропустять загальні heuristics                                                                 |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить provider                                                             | Provider може зіставляти сирі API/transport помилки з rate-limit/overload тощо                                                             |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul provider                                                              | Provider потребує gating TTL кешу, специфічного для proxy                                                                                  |
| 30  | `buildMissingAuthMessage`         | Замінює загальне повідомлення відновлення для відсутньої auth                                                  | Provider потребує provider-специфічної підказки для відновлення після відсутності auth                                                     |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей з необов'язковою користувацькою підказкою про помилку                | Provider потребує приховати застарілі upstream-рядки або замінити їх підказкою vendor                                                      |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після discovery                                                     | Provider потребує синтетичних рядків прямої сумісності в `models list` і picker-ах                                                        |
| 33  | `isBinaryThinking`                | Перемикач reasoning on/off для provider з binary-thinking                                                      | Provider підтримує лише бінарне thinking on/off                                                                                             |
| 34  | `supportsXHighThinking`           | Підтримка reasoning `xhigh` для вибраних моделей                                                               | Provider хоче `xhigh` лише для підмножини моделей                                                                                           |
| 35  | `resolveDefaultThinkingLevel`     | Типовий рівень `/think` для конкретного сімейства моделей                                                      | Provider володіє типовою політикою `/think` для сімейства моделей                                                                           |
| 36  | `isModernModelRef`                | Matcher сучасних моделей для фільтрів live profile і вибору smoke                                              | Provider володіє зіставленням бажаних моделей для live/smoke                                                                                |
| 37  | `prepareRuntimeAuth`              | Обмінює налаштовані credentials на фактичний runtime token/key безпосередньо перед інференцією                 | Provider потребує обміну token або короткоживучих облікових даних запиту                                                                   |
| 38  | `resolveUsageAuth`                | Розв'язує credentials використання/білінгу для `/usage` і пов'язаних поверхонь status                         | Provider потребує кастомного парсингу token використання/квот або інших credentials використання                                          |
| 39  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки використання/квот, специфічні для provider, після розв'язання auth               | Provider потребує власний endpoint використання або parser payload                                                                          |
| 40  | `createEmbeddingProvider`         | Створює adapter embeddings, що належить provider, для memory/search                                            | Поведінка embeddings для memory має належати plugin provider                                                                                |
| 41  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою transcript для provider                                            | Provider потребує кастомну політику transcript (наприклад, видалення блоків thinking)                                                      |
| 42  | `sanitizeReplayHistory`           | Перезаписує історію replay після загального очищення transcript                                                | Provider потребує provider-специфічні rewrite replay понад спільні helper compaction                                                      |
| 43  | `validateReplayTurns`             | Фінальна валідація або зміна форми turn replay перед embedded runner                                           | Transport provider потребує суворішої валідації ходів після загальної санітизації                                                          |
| 44  | `onModelSelected`                 | Запускає побічні ефекти після вибору моделі, що належать provider                                              | Provider потребує телеметрію або власний стан, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний plugin provider, а потім переходять до інших plugin provider, здатних до hooks,
доки хтось справді не змінить model id або transport/config. Це дозволяє
shim-и псевдонімів/compat provider працювати без потреби, щоб викликаючий код знав,
який саме вбудований plugin володіє rewrite. Якщо жоден hook provider не перепише
підтримуваний запис config сімейства Google, вбудований нормалізатор config Google
усе одно виконає це очищення для сумісності.

Якщо provider потребує повністю кастомного wire protocol або кастомного виконавця запитів,
це інший клас extension. Ці hooks призначені для поведінки provider,
яка все ще працює на звичайному циклі інференції OpenClaw.

### Приклад provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Вбудовані приклади

- Anthropic використовує `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  і `wrapStreamFn`, тому що володіє прямою сумісністю вперед для Claude 4.6,
  підказками щодо сімейства provider, вказівками з ремонту auth, інтеграцією з endpoint використання,
  придатністю prompt-cache, типовими значеннями config з урахуванням auth,
  типовою/адаптивною політикою thinking Claude та формуванням stream,
  специфічним для Anthropic, для beta headers, `/fast` / `serviceTier` і `context1m`.
- Допоміжні засоби stream, специфічні для Claude в Anthropic, поки що залишаються у
  власному публічному seam plugin `api.ts` / `contract-api.ts`. Ця поверхня пакета
  експортує `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі
  builder-и wrapper Anthropic замість того, щоб розширювати загальний SDK навколо правил
  beta headers одного provider.
- OpenAI використовує `resolveDynamicModel`, `normalizeResolvedModel` і
  `capabilities`, а також `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` і `isModernModelRef`,
  тому що володіє прямою сумісністю вперед для GPT-5.4, нормалізацією
  прямого OpenAI `openai-completions` -> `openai-responses`, підказками auth з урахуванням Codex,
  придушенням Spark, синтетичними рядками списку OpenAI і політикою thinking /
  live-model для GPT-5; сімейство stream `openai-responses-defaults` володіє
  спільними native wrappers OpenAI Responses для headers атрибуції,
  `/fast`/`serviceTier`, деталізації тексту, native вебпошуку Codex,
  формування payload reasoning-compat і керування контекстом Responses.
- OpenRouter використовує `catalog`, а також `resolveDynamicModel` і
  `prepareDynamicModel`, тому що provider є наскрізним і може відкривати нові
  model id до оновлення статичного каталогу OpenClaw; він також використовує
  `capabilities`, `wrapStreamFn` і `isCacheTtlEligible`, щоб тримати
  provider-специфічні headers запитів, metadata маршрутизації, патчі reasoning і
  політику prompt-cache поза core. Його replay policy надходить від сімейства
  `passthrough-gemini`, тоді як сімейство stream `openrouter-thinking`
  володіє ін'єкцією proxy reasoning і пропусками для непідтримуваних моделей / `auto`.
- GitHub Copilot використовує `catalog`, `auth`, `resolveDynamicModel` і
  `capabilities`, а також `prepareRuntimeAuth` і `fetchUsageSnapshot`,
  тому що йому потрібні login пристрою, що належать provider, поведінка fallback моделей,
  особливості transcript Claude, обмін GitHub token -> Copilot token і
  endpoint використання, що належить provider.
- OpenAI Codex використовує `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` і `augmentModelCatalog`, а також
  `prepareExtraParams`, `resolveUsageAuth` і `fetchUsageSnapshot`,
  тому що він усе ще працює на core transport OpenAI, але володіє своєю
  нормалізацією transport/base URL, політикою fallback для OAuth refresh,
  типовим вибором transport, синтетичними рядками каталогу Codex і інтеграцією з
  endpoint використання ChatGPT; він використовує те саме сімейство stream
  `openai-responses-defaults`, що й прямий OpenAI.
- Google AI Studio і Gemini CLI OAuth використовують `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` і `isModernModelRef`, тому що
  сімейство replay `google-gemini` володіє fallback прямої сумісності вперед для Gemini 3.1,
  native валідацією replay Gemini, санітизацією bootstrap replay, режимом
  tagged reasoning-output і зіставленням сучасних моделей, тоді як
  сімейство stream `google-thinking` володіє нормалізацією payload thinking Gemini;
  Gemini CLI OAuth також використовує `formatApiKey`, `resolveUsageAuth` і
  `fetchUsageSnapshot` для форматування token, парсингу token і підключення
  endpoint квот.
- Anthropic Vertex використовує `buildReplayPolicy` через
  сімейство replay `anthropic-by-model`, щоб очищення replay, специфічне для Claude,
  залишалося обмеженим ідентифікаторами Claude, а не всіма transport `anthropic-messages`.
- Amazon Bedrock використовує `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` і `resolveDefaultThinkingLevel`, тому що володіє
  Bedrock-специфічною класифікацією помилок throttle/not-ready/context-overflow
  для трафіку Anthropic-on-Bedrock; його replay policy при цьому все ще використовує той самий
  guard `anthropic-by-model`, обмежений Claude.
- OpenRouter, Kilocode, Opencode і Opencode Go використовують `buildReplayPolicy`
  через сімейство replay `passthrough-gemini`, тому що вони проксіюють моделі Gemini
  через transport, сумісні з OpenAI, і потребують санітизації
  thought-signature Gemini без native валідації replay Gemini або rewrite bootstrap.
- MiniMax використовує `buildReplayPolicy` через
  сімейство replay `hybrid-anthropic-openai`, тому що один provider володіє і
  семантикою повідомлень Anthropic, і OpenAI-compatible; він зберігає видалення
  блоків thinking лише для Claude з боку Anthropic, одночасно перевизначаючи режим
  reasoning output назад на native, а сімейство stream `minimax-fast-mode` володіє
  rewrite моделей fast-mode на спільному шляху stream.
- Moonshot використовує `catalog` і `wrapStreamFn`, тому що він усе ще
  використовує спільний transport OpenAI, але потребує нормалізації payload thinking,
  що належить provider; сімейство stream `moonshot-thinking` зіставляє config і стан `/think`
  на його native binary payload thinking.
- Kilocode використовує `catalog`, `capabilities`, `wrapStreamFn` і
  `isCacheTtlEligible`, тому що йому потрібні headers запитів, що належать provider,
  нормалізація payload reasoning, підказки transcript Gemini та gating
  Anthropic cache-TTL; сімейство stream `kilocode-thinking` зберігає ін'єкцію
  thinking Kilo на спільному шляху proxy stream, пропускаючи `kilo/auto` та
  інші id proxy-моделей, які не підтримують явний payload reasoning.
- Z.AI використовує `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` і `fetchUsageSnapshot`, тому що володіє fallback для GLM-5,
  типовими значеннями `tool_stream`, UX binary thinking, зіставленням сучасних моделей
  і як auth використання, так і отриманням квот; сімейство stream `tool-stream-default-on`
  не дає wrapper за замовчуванням увімкненого `tool_stream` перетворитися на
  рукописний клей для кожного provider.
- xAI використовує `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` і `isModernModelRef`,
  тому що володіє нормалізацією native transport xAI Responses, rewrite псевдонімів
  fast-mode для Grok, типовим `tool_stream`, очищенням strict-tool / reasoning-payload,
  повторним використанням fallback auth для tools, що належать plugin, прямим розв'язанням
  моделей Grok для сумісності вперед і compat-патчами, що належать provider, такими як профіль
  schema tools xAI, непідтримувані keywords schema, native `web_search` і декодування
  аргументів tool-call із HTML-сутностями.
- Mistral, OpenCode Zen і OpenCode Go використовують лише `capabilities`, щоб
  тримати особливості transcript/tooling поза core.
- Провайдери, вбудовані лише з catalog, такі як `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` і `volcengine`, використовують
  лише `catalog`.
- Qwen використовує `catalog` для свого текстового provider, а також спільні
  реєстрації media-understanding і video-generation для своїх мультимодальних поверхонь.
- MiniMax і Xiaomi використовують `catalog` плюс hooks використання, тому що їхня поведінка `/usage`
  належить plugin, навіть якщо інференція все ще виконується через спільні transport.

## Допоміжні засоби runtime

Plugin можуть отримувати доступ до вибраних helper core через `api.runtime`. Для TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Примітки:

- `textToSpeech` повертає звичайний payload TTS core для поверхонь файлів/голосових повідомлень.
- Використовує config core `messages.tts` і вибір provider.
- Повертає PCM audio buffer + sample rate. Plugin мають виконувати ресемплінг/кодування для providers.
- `listVoices` є необов'язковим для кожного provider. Використовуйте його для picker-ів голосів або потоків setup, що належать vendor.
- Списки голосів можуть містити багатші metadata, такі як locale, gender і теги personality для picker-ів, що враховують provider.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugin також можуть реєструвати speech providers через `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Примітки:

- Тримайте політику TTS, fallback і доставку відповідей у core.
- Використовуйте speech providers для поведінки синтезу, що належить vendor.
- Застарілий вхід Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель власності — орієнтована на компанію: один vendor plugin може володіти
  text, speech, image і майбутніми media providers у міру того, як OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео plugin реєструють один типізований
provider media-understanding замість узагальненого key/value bag:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Примітки:

- Оркестрацію, fallback, config і підключення каналів тримайте в core.
- Поведінку vendor тримайте в plugin provider.
- Розширення мають залишатися адитивно типізованими: нові необов'язкові методи,
  нові необов'язкові поля результату, нові необов'язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливості та helper runtime
  - vendor plugin реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugin споживають `api.runtime.videoGeneration.*`

Для helper runtime media-understanding plugin можуть викликати:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Для транскрипції аудіо plugin можуть використовувати або runtime media-understanding,
або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння зображень/аудіо/відео.
- Використовує config аудіо media-understanding у core (`tools.media.audio`) і порядок fallback provider.
- Повертає `{ text: undefined }`, коли вихід транскрипції не створено (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності.

Plugin також можуть запускати фонові запуски subagent через `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Примітки:

- `provider` і `model` — це необов'язкові перевизначення на один запуск, а не постійні зміни сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликаючих.
- Для запусків fallback, що належать plugin, оператори мають явним чином дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugin конкретними канонічними цілями `provider/model`, або `"*"` для явного дозволу будь-якої цілі.
- Запуски subagent із недовірених plugin усе ще працюють, але запити на перевизначення відхиляються, а не безшумно повертаються до fallback.

Для вебпошуку plugin можуть споживати спільний helper runtime замість
звернення до підключення agent tool:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin також можуть реєструвати web-search providers через
`api.registerWebSearchProvider(...)`.

Примітки:

- Тримайте вибір provider, розв'язання credentials і спільну семантику запитів у core.
- Використовуйте web-search providers для transport пошуку, специфічних для vendor.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для feature/channel plugin, яким потрібна поведінка пошуку без залежності від wrapper agent tool.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка provider генерації зображень.
- `listProviders(...)`: показує доступні providers генерації зображень і їхні можливості.

## HTTP routes Gateway

Plugin можуть відкривати HTTP endpoints через `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Поля route:

- `path`: шлях route під HTTP server gateway.
- `auth`: обов'язково. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/webhook verification, якими керує plugin.
- `match`: необов'язково. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов'язково. Дозволяє тому самому plugin замінити власну наявну реєстрацію route.
- `handler`: повертайте `true`, коли route обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було видалено, і він спричинить помилку завантаження plugin. Використовуйте натомість `api.registerHttpRoute(...)`.
- Plugin routes мають явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один plugin не може замінювати route іншого plugin.
- Перекривні routes з різними рівнями `auth` відхиляються. Ланцюжки fallthrough `exact`/`prefix` мають залишатися лише в межах одного рівня auth.
- Routes `auth: "plugin"` **не** отримують автоматично operator runtime scope. Вони призначені для webhook/signature verification, якими керує plugin, а не для привілейованих helper-викликів Gateway.
- Routes `auth: "gateway"` працюють усередині runtime scope запиту Gateway, але ця область навмисно консервативна:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) тримає runtime scope route plugin на рівні `operator.write`, навіть якщо викликаючий надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей header явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах plugin-route з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що route plugin з auth gateway автоматично є поверхнею адміністратора. Якщо вашому route потрібна лише admin-поведінка, вимагайте auth-режим з ідентичністю і документуйте явний контракт header `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення plugin використовуйте підшляхи SDK замість монолітного імпорту `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` для примітивів реєстрації plugin.
- `openclaw/plugin-sdk/core` для узагальненого спільного контракту для plugin.
- `openclaw/plugin-sdk/config-schema` для експорту кореневої Zod schema
  `openclaw.json` (`OpenClawSchema`).
- Стабільні channel-примітиви, такі як `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` і
  `openclaw/plugin-sdk/webhook-ingress` для спільного підключення
  setup/auth/reply/webhook. `channel-inbound` є спільним місцем для debounce,
  зіставлення mention, helper-ів вхідної політики mention, форматування envelope та
  helper-ів контексту вхідних envelope.
  `channel-setup` — це вузький seam setup для необов'язкового встановлення.
  `setup-runtime` — це безпечна для runtime поверхня setup, яку використовують `setupEntry` /
  відкладений запуск, включно з adapter-ами патчів setup, безпечними для імпорту.
  `setup-adapter-runtime` — це seam adapter налаштування облікових записів із урахуванням env.
  `setup-tools` — це малий seam helper для CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Доменні підшляхи, такі як `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` і
  `openclaw/plugin-sdk/directory-runtime` для спільних helper runtime/config.
  `telegram-command-config` — це вузький публічний seam для нормалізації/валідації кастомних
  команд Telegram і він залишається доступним, навіть якщо поверхня контракту
  вбудованого Telegram тимчасово недоступна.
  `text-runtime` — це спільний seam text/markdown/logging, включно з
  видаленням assistant-visible-text, helper-ами рендерингу/розбиття markdown, helper-ами
  редагування, helper-ами directive-tag і утилітами safe-text.
- Approval-специфічні channel seam мають віддавати перевагу одному контракту
  `approvalCapability` на plugin. Тоді core читає auth, delivery, render,
  native-routing і ліниву поведінку native-handler для approval через цю одну можливість,
  а не змішує поведінку approval з не пов'язаними полями plugin.
- `openclaw/plugin-sdk/channel-runtime` є застарілим і залишається лише як shim
  сумісності для старіших plugin. Новий код має імпортувати вузькіші загальні примітиви, а
  код репозиторію не повинен додавати нові імпорти цього shim.
- Внутрішні частини вбудованих extension залишаються приватними. Зовнішні plugin мають
  використовувати лише підшляхи `openclaw/plugin-sdk/*`. Код core/test OpenClaw може
  використовувати публічні entry point репозиторію під коренем пакета plugin, такі як `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` і вузько спрямовані файли, наприклад
  `login-qr-api.js`. Ніколи не імпортуйте `src/*` пакета plugin із core або з
  іншого extension.
- Розділення entry point у репозиторії:
  `<plugin-package-root>/api.js` — це barrel helper/types,
  `<plugin-package-root>/runtime-api.js` — це barrel лише для runtime,
  `<plugin-package-root>/index.js` — це entry вбудованого plugin,
  а `<plugin-package-root>/setup-entry.js` — це entry plugin setup.
- Поточні приклади вбудованих provider:
  - Anthropic використовує `api.js` / `contract-api.js` для helper stream Claude, таких
    як `wrapAnthropicProviderStream`, helper-и beta-header і парсинг `service_tier`.
  - OpenAI використовує `api.js` для builder-ів provider, helper-ів типових моделей і builder-ів provider realtime.
  - OpenRouter використовує `api.js` для свого builder-а provider, а також helper-ів onboarding/config,
    тоді як `register.runtime.js` і далі може повторно експортувати загальні
    helper `plugin-sdk/provider-stream` для локального використання в репозиторії.
- Публічні entry point, завантажені через facade, віддають перевагу активному snapshot config runtime,
  якщо він існує, а потім переходять до розв'язаного config-файлу на диску, коли
  OpenClaw ще не надає snapshot runtime.
- Загальні примітиви залишаються бажаним публічним контрактом SDK. Невеликий
  зарезервований набір сумісності з helper seam вбудованих каналів, названих на їхню честь, усе ще існує.
  Розглядайте їх як seam підтримки вбудованих/сумісності, а не нові цілі імпорту
  для сторонніх рішень; нові міжканальні контракти, як і раніше, мають
  потрапляти у загальні підшляхи `plugin-sdk/*` або локальні barrel-и plugin `api.js` /
  `runtime-api.js`.

Примітка щодо сумісності:

- Уникайте кореневого barrel `openclaw/plugin-sdk` у новому коді.
- Насамперед віддавайте перевагу вузьким стабільним примітивам. Новіші підшляхи
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool — це бажаний контракт для нової роботи з
  вбудованими та зовнішніми plugin.
  Парсинг/зіставлення цілей має бути в `openclaw/plugin-sdk/channel-targets`.
  Гейти message action і helper-и message-id для реакцій мають бути в
  `openclaw/plugin-sdk/channel-actions`.
- Допоміжні barrel-и, специфічні для вбудованих extension, за замовчуванням нестабільні. Якщо
  helper потрібен лише вбудованому extension, тримайте його за локальним seam
  `api.js` або `runtime-api.js` цього extension, а не просувайте в
  `openclaw/plugin-sdk/<extension>`.
- Нові спільні helper seam мають бути загальними, а не названими на честь каналу. Спільний парсинг цілей
  має бути в `openclaw/plugin-sdk/channel-targets`; channel-специфічні
  внутрішні частини мають залишатися за локальним seam `api.js` або `runtime-api.js`
  відповідного plugin.
- Підшляхи, специфічні для можливостей, такі як `image-generation`,
  `media-understanding` і `speech`, існують тому, що вбудовані/нативні plugin використовують
  їх сьогодні. Їхня наявність сама по собі не означає, що кожен експортований helper є
  довгостроковим замороженим зовнішнім контрактом.

## Schema tool повідомлень

Plugin мають володіти channel-специфічними внесками schema в `describeMessageTool(...)`.
Тримайте provider-специфічні поля в plugin, а не в спільному core.

Для спільних портативних фрагментів schema повторно використовуйте загальні helper, експортовані через
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` для payload у стилі сітки кнопок
- `createMessageToolCardSchema()` для структурованих payload карток

Якщо форма schema має сенс лише для одного provider, визначайте її у
власному коді цього plugin замість того, щоб просувати у спільний SDK.

## Розв'язання цілей каналу

Channel plugin мають володіти channel-специфічною семантикою цілей. Зберігайте
спільний outbound host загальним і використовуйте поверхню messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід трактувати нормалізовану ціль
  як `direct`, `group` або `channel` до пошуку в directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи слід
  одразу перейти до розв'язання у стилі id замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` є fallback plugin, коли
  core потребує фінального розв'язання, що належить provider, після нормалізації або
  після пропуску в directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє channel-специфічним побудуванням
  route сесії після того, як ціль розв'язано.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають
  прийматися до пошуку peers/groups.
- Використовуйте `looksLikeId` для перевірок "вважати це явним/native id цілі".
- Використовуйте `resolveTarget` для provider-специфічного fallback нормалізації, а не для
  широкого пошуку в directory.
- Тримайте native id provider, такі як id чатів, id потоків, JID, handles і id кімнат,
  всередині значень `target` або provider-специфічних параметрів, а не в загальних полях SDK.

## Directory на основі config

Plugin, які виводять записи directory із config, мають тримати цю логіку в
plugin і повторно використовувати спільні helper з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі config, такі як:

- peers DM на основі allowlist
- налаштовані maps каналів/груп
- статичні fallback directory в межах облікового запису

Спільні helper у `directory-runtime` виконують лише загальні операції:

- фільтрацію запитів
- застосування обмежень
- дедуплікацію/нормалізацію
- побудову `ChannelDirectoryEntry[]`

Channel-специфічну перевірку облікових записів і нормалізацію id слід залишати в
реалізації plugin.

## Каталоги provider

Plugin provider можуть визначати каталоги моделей для інференції через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує у
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли plugin володіє model id, типовими base URL
або metadata моделей із прив'язкою до auth, специфічними для provider.

`catalog.order` керує тим, коли каталог plugin зливається відносно вбудованих
неявних providers OpenClaw:

- `simple`: providers зі звичайним API-key або env
- `profile`: providers, які з'являються, коли існують auth profiles
- `paired`: providers, що синтезують кілька пов'язаних записів provider
- `late`: останній прохід, після інших неявних providers

Пізніші providers перемагають у разі колізії ключів, тож plugin можуть
навмисно перевизначати вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only інспекція каналів

Якщо ваш plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поруч із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може виходити з припущення, що credentials
  повністю матеріалізовані, і швидко завершуватися з помилкою, коли потрібних secret бракує.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки
  doctor/config repair, не повинні потребувати матеріалізації runtime credentials лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- Включає поля джерела/статусу credentials, якщо це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення token лише для повідомлення про read-only
  доступність. Для команд у стилі status достатньо повернути `tokenStatus: "available"`
  (і відповідне поле source).
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному шляху команди.

Це дозволяє командам лише для читання повідомляти "налаштовано, але недоступно в
цьому шляху команди" замість аварійного завершення або хибного повідомлення, що
обліковий запис не налаштований.

## Package packs

Каталог plugin може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен entry стає plugin. Якщо pack перелічує кілька extension, id plugin
стає `name/<fileBase>`.

Якщо ваш plugin імпортує npm-залежності, установіть їх у цьому каталозі, щоб
був доступний `node_modules` (`npm install` / `pnpm install`).

Запобіжна перевірка безпеки: кожен entry `openclaw.extensions` має залишатися всередині каталогу plugin
після розв'язання symlink. Entries, які виходять за межі каталогу package,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev dependencies під час runtime). Тримайте дерева залежностей plugin "чистими JS/TS" і уникайте пакетів, яким потрібні збірки через `postinstall`.

Необов'язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує поверхонь setup для вимкненого channel plugin або
коли channel plugin увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повного entry plugin. Це робить запуск і setup легшими,
коли ваш основний entry plugin також підключає tools, hooks або інший код лише для runtime.

Необов'язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
дозволяє channel plugin підключитися до того самого шляху `setupEntry` під час
передслухової фази запуску gateway, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску,
яка має існувати до того, як gateway почне слухати. На практиці це означає, що
entry setup має реєструвати всі можливості каналу, від яких залежить запуск, наприклад:

- реєстрацію самого каналу
- будь-які HTTP routes, які мають бути доступні до початку прослуховування gateway
- будь-які methods, tools або services gateway, які мають існувати в тому самому вікні часу

Якщо ваш повний entry усе ще володіє будь-якою необхідною для запуску можливістю, не вмикайте
цей прапорець. Залиште plugin зі стандартною поведінкою і дозвольте OpenClaw завантажити
повний entry під час запуску.

Вбудовані channels також можуть публікувати helper-и поверхні контракту лише для setup, до яких core
може звертатися до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно просунути застарілий config каналу з
одним обліковим записом у `channels.<id>.accounts.*` без завантаження повного entry plugin.
Matrix є поточним вбудованим прикладом: він переносить лише ключі auth/bootstrap у
іменований promoted account, коли іменовані accounts уже існують, і може зберігати
налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці patch adapter-и setup зберігають ліниве виявлення поверхні контракту вбудованих plugin.
Час імпорту залишається малим; поверхня promotion завантажується лише під час першого використання,
а не повторно входить у запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску містять methods Gateway RPC, тримайте їх на
plugin-специфічному префіксі. Простори імен admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди розв'язуються
до `operator.admin`, навіть якщо plugin запитує вужчу область.

Приклад:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Метадані каталогу каналів

Channel plugin можуть рекламувати метадані setup/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дозволяє core не містити дані каталогу.

Приклад:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Корисні поля `openclaw.channel`, окрім мінімального прикладу:

- `detailLabel`: вторинний label для багатших поверхонь catalog/status
- `docsLabel`: перевизначає текст посилання на документацію
- `preferOver`: id plugin/channel з нижчим пріоритетом, які цей запис каталогу має перевершувати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування копірайтом для поверхні вибору
- `markdownCapable`: позначає канал як markdown-capable для рішень щодо outbound-форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних picker-ів setup/configure, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: додає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив'язки облікового запису, навіть якщо існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддає перевагу пошуку за сесією під час розв'язання цілей announce

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Додайте JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugin context engine

Plugin context engine володіють оркестрацією контексту сесії для ingest, assembly
і compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити типовий конвеєр context,
а не просто додати memory search або hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Якщо ваш engine **не** володіє алгоритмом compaction, залишайте `compact()`
реалізованим і явно делегуйте його:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Додавання нової можливості

Коли plugin потребує поведінки, яка не вписується в поточний API, не обходьте
систему plugin приватним зверненням углиб. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: політикою, fallback, злиттям config,
   життєвим циклом, channel-facing семантикою і формою helper runtime.
2. додайте типізовані поверхні реєстрації/runtime plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. під'єднайте споживачів core + channel/feature
   Channels і feature plugin мають споживати нову можливість через core,
   а не імпортувати vendor-реалізацію напряму.
4. зареєструйте vendor-реалізації
   Потім vendor plugin реєструють свої бекенди для цієї можливості.
5. додайте контрактне покриття
   Додайте тести, щоб форма власності та реєстрації залишалася явною з часом.

Саме так OpenClaw залишається opinionated, не стаючи жорстко прив'язаним до
світогляду одного provider. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і робочого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має торкатися цих
поверхонь разом:

- типи контракту core у `src/<capability>/types.ts`
- runner/helper runtime core у `src/<capability>/runtime.ts`
- поверхня реєстрації API plugin у `src/plugins/types.ts`
- підключення реєстру plugin у `src/plugins/registry.ts`
- відкриття runtime plugin у `src/plugins/runtime/*`, коли feature/channel
  plugin мають її споживати
- helper-и capture/test у `src/test-utils/plugin-registration.ts`
- перевірки власності/контракту в `src/plugins/contracts/registry.ts`
- документація для операторів/plugin у `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака того, що можливість ще
не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Шаблон контрактного тесту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє контрактом можливості + оркестрацією
- vendor plugin володіють vendor-реалізаціями
- feature/channel plugin споживають helper runtime
- контрактні тести зберігають явну власність
