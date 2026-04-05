---
read_when:
    - Створення або налагодження нативних plugin OpenClaw
    - Розуміння моделі можливостей plugin або меж володіння
    - Робота над конвеєром завантаження plugin або реєстром
    - Реалізація runtime-хуків провайдера або channel plugins
sidebarTitle: Internals
summary: 'Внутрішні компоненти plugin: модель можливостей, межі володіння, контракти, конвеєр завантаження та допоміжні засоби runtime'
title: Внутрішні компоненти Plugin
x-i18n:
    generated_at: "2026-04-05T18:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70424e2745e6e289aa2e7ff899d33bea4b04f5c18bd3f73de38287f788bd939b
    source_path: plugins/architecture.md
    workflow: 15
---

# Внутрішні компоненти Plugin

<Info>
  Це **довідник з глибокої архітектури**. Практичні посібники дивіться тут:
  - [Встановлення та використання plugin](/uk/tools/plugin) — посібник для користувача
  - [Початок роботи](/uk/plugins/building-plugins) — перший навчальний матеріал зі створення plugin
  - [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення каналу обміну повідомленнями
  - [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення провайдера моделей
  - [Огляд SDK](/uk/plugins/sdk-overview) — карта імпортів і API реєстрації
</Info>

Ця сторінка описує внутрішню архітектуру системи plugin OpenClaw.

## Публічна модель можливостей

Можливості — це публічна модель **нативних plugin** всередині OpenClaw. Кожен
нативний plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість            | Метод реєстрації                               | Приклади plugin                     |
| --------------------- | ---------------------------------------------- | ----------------------------------- |
| Текстовий inference   | `api.registerProvider(...)`                    | `openai`, `anthropic`               |
| Мовлення              | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`           |
| Транскрипція в realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Голос у realtime      | `api.registerRealtimeVoiceProvider(...)`       | `openai`                            |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                  |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | `qwen`                              |
| Отримання вебданих    | `api.registerWebFetchProvider(...)`            | `firecrawl`                         |
| Вебпошук              | `api.registerWebSearchProvider(...)`           | `google`                            |
| Канал / повідомлення  | `api.registerChannel(...)`                     | `msteams`, `matrix`                 |

Plugin, який не реєструє жодної можливості, але надає hooks, tools або
services, є **застарілим plugin лише з hooks**. Цей шаблон і далі повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже впроваджена в core і сьогодні використовується
вбудованими/нативними plugins, але сумісність із зовнішніми plugins усе ще
потребує вищої планки, ніж "це експортується, отже це вже зафіксовано."

Поточні рекомендації:

- **наявні зовнішні plugins:** зберігайте працездатність інтеграцій на основі hooks; вважайте
  це базовим рівнем сумісності
- **нові вбудовані/нативні plugins:** віддавайте перевагу явній реєстрації можливостей, а не
  vendor-специфічним прямим зверненням або новим дизайнам лише з hooks
- **зовнішні plugins, що переходять на реєстрацію можливостей:** це дозволено, але
  capability-специфічні допоміжні поверхні слід вважати такими, що еволюціонують, якщо в документації контракт явно не позначено як стабільний

Практичне правило:

- API реєстрації можливостей — це бажаний напрямок
- застарілі hooks залишаються найбезпечнішим шляхом без зламів для зовнішніх plugins під час
  переходу
- не всі експортовані допоміжні subpaths однакові; віддавайте перевагу вузькому задокументованому
  контракту, а не випадковим допоміжним експортам

### Форми plugin

OpenClaw класифікує кожен завантажений plugin за формою на основі його фактичної
поведінки реєстрації (а не лише статичних метаданих):

- **plain-capability** -- реєструє рівно один тип можливості (наприклад,
  plugin лише для провайдера, як-от `mistral`)
- **hybrid-capability** -- реєструє кілька типів можливостей (наприклад,
  `openai` володіє текстовим inference, мовленням, розумінням медіа та
  генерацією зображень)
- **hook-only** -- реєструє лише hooks (типізовані або custom), без можливостей,
  tools, commands чи services
- **non-capability** -- реєструє tools, commands, services або routes, але не можливості

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin і
розподіл можливостей. Докладніше див. у [довіднику CLI](/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для
plugin лише з hooks. Реальні застарілі plugins усе ще залежать від нього.

Напрямок:

- зберігати його працездатним
- документувати його як застарілий
- для перевизначення моделі/провайдера віддавати перевагу `before_model_resolve`
- для мутації prompt віддавати перевагу `before_prompt_build`
- видаляти лише після зниження реального використання та після того, як покриття fixture підтвердить безпеку міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити
один із цих маркерів:

| Сигнал                     | Значення                                                    |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Конфігурація успішно парситься, і plugins коректно визначаються |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який вважається застарілим |
| **hard error**             | Конфігурація недійсна або plugin не вдалося завантажити     |

Ні `hook-only`, ні `before_agent_start` не зламають ваш plugin сьогодні --
`hook-only` є рекомендаційним сигналом, а `before_agent_start` лише спричиняє попередження. Ці
сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система plugin OpenClaw має чотири шари:

1. **Маніфест + виявлення**
   OpenClaw знаходить потенційні plugins у налаштованих шляхах, коренях workspace,
   глобальних коренях extension і серед вбудованих extension. Виявлення спочатку читає нативні
   маніфести `openclaw.plugin.json` разом із підтримуваними маніфестами bundle.
2. **Увімкнення + валідація**
   Core вирішує, чи є знайдений plugin увімкненим, вимкненим, заблокованим або
   вибраним для ексклюзивного слота, наприклад memory.
3. **Runtime-завантаження**
   Нативні plugins OpenClaw завантажуються in-process через jiti і реєструють
   можливості в центральному реєстрі. Сумісні bundles нормалізуються в записи
   реєстру без імпорту runtime-коду.
4. **Використання поверхонь**
   Решта OpenClaw читає реєстр, щоб надавати tools, channels, налаштування provider,
   hooks, HTTP routes, CLI commands і services.

Для CLI plugin зокрема, виявлення кореневих команд розділено на дві фази:

- метадані під час парсингу походять із `registerCli(..., { descriptors: [...] })`
- реальний модуль CLI plugin може залишатися lazy і реєструватися лише під час першого виклику

Це дозволяє утримувати код CLI, що належить plugin, всередині plugin, при цьому OpenClaw
може резервувати імена кореневих команд до початку парсингу.

Важлива межа проєктування:

- виявлення + валідація config мають працювати на основі **метаданих маніфесту/схеми**
  без виконання коду plugin
- нативна runtime-поведінка походить із шляху `register(api)` модуля plugin

Такий поділ дозволяє OpenClaw перевіряти config, пояснювати відсутні/вимкнені plugins і
будувати підказки UI/схеми до повної активації runtime.

### Channel plugins і спільний tool повідомлень

Channel plugins не повинні реєструвати окремий tool send/edit/react для
звичайних дій у чаті. OpenClaw підтримує один спільний core tool `message`, а
channel plugins володіють channel-специфічним виявленням і виконанням за ним.

Поточна межа така:

- core володіє спільним host tool `message`, підключенням prompt,
  обліком session/thread і диспетчеризацією виконання
- channel plugins володіють виявленням дій в межах scope, виявленням можливостей
  і будь-якими channel-специфічними фрагментами schema
- channel plugins володіють provider-специфічною граматикою conversation session, зокрема
  тим, як ідентифікатори conversation кодують ідентифікатори thread або успадковуються від батьківських conversations
- channel plugins виконують фінальну дію через свій action adapter

Для channel plugins поверхнею SDK є
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик
виявлення дозволяє plugin повертати видимі дії, можливості та внески до schema
разом, щоб ці частини не розходилися між собою.

Core передає runtime scope в цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для context-sensitive plugins. Канал може приховувати або показувати
дії повідомлень залежно від активного облікового запису, поточної кімнати/thread/message або
довіреної ідентичності запитувача без жорсткого channel-специфічного branching у core tool `message`.

Саме тому зміни маршрутизації embedded-runner усе ще є роботою plugin: runner
відповідає за передавання поточної ідентичності chat/session до межі
виявлення plugin, щоб спільний tool `message` показував правильну channel-власну
поверхню для поточного кроку.

Для channel-власних допоміжних засобів виконання вбудовані plugins повинні
зберігати runtime виконання всередині своїх власних модулів extension. Core більше не володіє Discord,
Slack, Telegram або WhatsApp runtime дій повідомлень у `src/agents/tools`.
Ми не публікуємо окремі subpaths `plugin-sdk/*-action-runtime`, а вбудовані
plugins повинні імпортувати власний локальний runtime-код безпосередньо зі своїх
модулів extension.

Та сама межа застосовується до provider-іменованих швів SDK загалом: core не повинен
імпортувати channel-специфічні допоміжні barrels для Slack, Discord, Signal,
WhatsApp або подібних extension. Якщо core потрібна певна поведінка, або
використовуйте власний barrel `api.ts` / `runtime-api.ts` вбудованого plugin, або
підніміть цю потребу до вузької загальної можливості в спільному SDK.

Зокрема для poll існує два шляхи виконання:

- `outbound.sendPoll` — спільна базова лінія для каналів, які вписуються в загальну модель
  poll
- `actions.handleAction("poll")` — бажаний шлях для channel-специфічної семантики
  poll або додаткових параметрів poll

Тепер core відкладає спільний парсинг poll до моменту, коли plugin-диспетчеризація poll
відхиляє дію, щоб handlers poll, що належать plugin, могли приймати channel-специфічні
поля poll без блокування з боку загального parser poll.

Повну послідовність запуску див. у [Конвеєрі завантаження](#load-pipeline).

## Модель володіння можливостями

OpenClaw розглядає нативний plugin як межу володіння для **компанії** або
**функції**, а не як набір несумісних між собою інтеграцій.

Це означає:

- plugin компанії зазвичай повинен володіти всіма surfaces цієї компанії, орієнтованими на OpenClaw
- plugin функції зазвичай повинен володіти повною surface запроваджуваної ним функції
- channels повинні використовувати спільні можливості core замість випадкового повторного
  впровадження provider-поведінки

Приклади:

- вбудований plugin `openai` володіє поведінкою провайдера моделей OpenAI і
  поведінкою OpenAI для speech + realtime-voice + media-understanding + image-generation
- вбудований plugin `elevenlabs` володіє поведінкою мовлення ElevenLabs
- вбудований plugin `microsoft` володіє поведінкою мовлення Microsoft
- вбудований plugin `google` володіє поведінкою провайдера моделей Google плюс
  поведінкою Google для media-understanding + image-generation + web-search
- вбудований plugin `firecrawl` володіє поведінкою web-fetch Firecrawl
- вбудовані plugins `minimax`, `mistral`, `moonshot` і `zai` володіють своїми
  backend для media-understanding
- plugin `voice-call` є plugin функції: він володіє transport дзвінків, tools,
  CLI, routes і bridgеing медіапотоків Twilio, але використовує спільні можливості speech
  плюс realtime-transcription і realtime-voice замість прямого імпорту vendor plugins

Бажаний кінцевий стан:

- OpenAI живе в одному plugin, навіть якщо охоплює текстові моделі, мовлення, зображення і
  майбутнє відео
- інший vendor може робити те саме для своєї власної surface
- channels не зважають на те, який plugin vendor володіє provider; вони використовують
  спільний capability-контракт, який надає core

Ось ключова відмінність:

- **plugin** = межа володіння
- **capability** = контракт core, який кілька plugins можуть реалізовувати або використовувати

Отже, якщо OpenClaw додає новий домен, наприклад відео, перше питання —
не "який provider має жорстко кодувати обробку відео?" Перше питання —
"який core-контракт можливості відео?" Щойно такий контракт з’являється,
plugins vendor можуть реєструватися для нього, а channel/feature plugins можуть його використовувати.

Якщо можливості ще не існує, правильний крок зазвичай такий:

1. визначити відсутню можливість у core
2. відкрити її через API/runtime plugin у типізованому вигляді
3. підключити channels/features до цієї можливості
4. дозволити plugins vendor реєструвати реалізації

Це зберігає явне володіння і водночас уникає поведінки core, яка залежить від
одного vendor або одноразового plugin-специфічного шляху коду.

### Шарування можливостей

Користуйтеся цією ментальною моделлю, коли вирішуєте, де має бути код:

- **шар можливостей core**: спільна orchestration, policy, fallback, правила
  злиття config, семантика доставки та типізовані контракти
- **шар plugin vendor**: vendor-специфічні API, auth, catalogs моделей, speech
  synthesis, image generation, майбутні backend відео, endpoints usage
- **шар channel/feature plugin**: інтеграції Slack/Discord/voice-call тощо,
  які використовують можливості core і представляють їх на surface

Наприклад, TTS має таку форму:

- core володіє policy TTS під час відповіді, порядком fallback, prefs і доставкою в channels
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями synthesis
- `voice-call` використовує допоміжний засіб runtime TTS для telephony

Той самий шаблон слід віддавати перевагу і для майбутніх можливостей.

### Приклад company plugin з кількома можливостями

Plugin компанії повинен виглядати цілісно ззовні. Якщо OpenClaw має спільні
контракти для моделей, мовлення, транскрипції в realtime, голосу в realtime, розуміння медіа,
генерації зображень, генерації відео, web fetch і web search, vendor може
володіти всіма своїми surfaces в одному місці:

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
      // vendor speech config — directly implement the SpeechProviderPlugin interface
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

Важливі не точні назви helpers. Важлива форма:

- один plugin володіє surface vendor
- core усе ще володіє контрактами можливостей
- channels і feature plugins використовують helpers `api.runtime.*`, а не vendor-код
- тести контрактів можуть перевіряти, що plugin зареєстрував можливості, якими
  він заявляє, що володіє

### Приклад можливості: розуміння відео

OpenClaw вже розглядає розуміння зображень/аудіо/відео як одну спільну
можливість. Та сама модель володіння застосовується і тут:

1. core визначає контракт media-understanding
2. plugins vendor реєструють `describeImage`, `transcribeAudio` і
   `describeVideo` за потреби
3. channels і feature plugins використовують спільну поведінку core замість
   прямого підключення до vendor-коду

Це запобігає вбудовуванню припущень одного провайдера про відео в core. Plugin володіє
surface vendor; core володіє capability-контрактом і поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим
capability-контрактом і runtime helper, а plugins vendor реєструють
реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний контрольний список впровадження? Див.
[Capability Cookbook](/uk/plugins/architecture).

## Контракти та контроль

Поверхня API plugin навмисно типізована й централізована в
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
runtime helpers, на які plugin може покладатися.

Чому це важливо:

- автори plugin отримують єдиний стабільний внутрішній стандарт
- core може відхиляти дублювання володіння, наприклад коли два plugins реєструють один і той самий
  id provider
- під час запуску можна показувати діагностику, придатну до дій, для хибної реєстрації
- тести контрактів можуть забезпечувати володіння вбудованими plugins і запобігати тихому дрейфу

Є два шари контролю:

1. **контроль runtime-реєстрації**
   Реєстр plugin перевіряє реєстрації під час завантаження plugins. Приклади:
   дубльовані id provider, дубльовані id провайдерів мовлення та хибні
   реєстрації породжують діагностику plugin замість невизначеної поведінки.
2. **тести контрактів**
   Вбудовані plugins фіксуються в реєстрах контрактів під час запусків тестів, щоб
   OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для model
   providers, speech providers, web search providers і володіння реєстрацією вбудованих компонентів.

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який plugin
володіє якою surface. Це дозволяє core і channels композиційно працювати, бо
володіння оголошене, типізоване й перевіряється тестами, а не є неявним.

### Що має належати контракту

Хороші контракти plugin є:

- типізованими
- малими
- capability-специфічними
- такими, що належать core
- повторно використовуваними кількома plugins
- придатними до використання channels/features без знань про vendor

Погані контракти plugin є:

- vendor-специфічною policy, прихованою в core
- одноразовими лазівками plugin, які обходять реєстр
- кодом channel, що напряму лізе у реалізацію vendor
- ad hoc runtime-об’єктами, які не є частиною `OpenClawPluginApi` або
  `api.runtime`

Якщо сумніваєтеся, піднімайте рівень абстракції: спочатку визначте можливість, а
потім дозвольте plugins підключатися до неї.

## Модель виконання

Нативні plugins OpenClaw працюють **in-process** із Gateway. Вони не
ізольовані. Завантажений нативний plugin має ту саму межу довіри на рівні процесу,
що й код core.

Наслідки:

- нативний plugin може реєструвати tools, network handlers, hooks і services
- помилка в нативному plugin може аварійно завершити роботу gateway або дестабілізувати його
- шкідливий нативний plugin еквівалентний довільному виконанню коду всередині
  процесу OpenClaw

Сумісні bundles безпечніші за замовчуванням, оскільки OpenClaw наразі розглядає їх
як metadata/content packs. У поточних релізах це здебільшого означає вбудовані
Skills.

Для невбудованих plugins використовуйте allowlists і явні шляхи install/load. Розглядайте
plugins workspace як код для часу розробки, а не як production-типові значення.

Для назв пакетів у workspace, що містять вбудовані plugins, зберігайте прив’язку plugin id у назві npm:
`@openclaw/<id>` за замовчуванням або затверджений типізований suffix на кшталт
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно надає вужчу роль plugin.

Важлива примітка щодо довіри:

- `plugins.allow` довіряє **id plugin**, а не походженню джерела.
- Plugin workspace з тим самим id, що й вбудований plugin, навмисно затіняє
  вбудовану копію, коли цей plugin workspace увімкнено/додано в allowlist.
- Це нормально і корисно для локальної розробки, тестування патчів і hotfix.

## Межа експорту

OpenClaw експортує можливості, а не зручні реалізаційні шари.

Реєстрацію можливостей слід залишати публічною. Неекспортовані допоміжні зручності слід обрізати:

- допоміжні subpaths, специфічні для вбудованих plugins
- subpaths runtime plumbing, які не призначені бути публічним API
- vendor-специфічні convenience helpers
- helpers setup/onboarding, які є деталями реалізації

Деякі допоміжні subpaths вбудованих plugins усе ще присутні в згенерованій карті
експорту SDK з міркувань сумісності та підтримки вбудованих plugins. Поточні приклади включають
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька швів `plugin-sdk/matrix*`. Розглядайте їх як
зарезервовані implementation-detail exports, а не як рекомендований шаблон SDK для
нових сторонніх plugins.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє корені потенційних plugin
2. читає нативні або сумісні маніфести bundle та метадані package
3. відхиляє небезпечних кандидатів
4. нормалізує config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. вирішує стан увімкнення для кожного кандидата
6. завантажує увімкнені нативні modules через jiti
7. викликає нативні hooks `register(api)` (або `activate(api)` — застарілий псевдонім) і збирає реєстрації до реєстру plugin
8. відкриває реєстр для surfaces commands/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що з них присутнє (`def.register ?? def.activate`), і викликає в тій самій точці. Усі вбудовані plugins використовують `register`; для нових plugins віддавайте перевагу `register`.
</Note>

Перевірки безпеки виконуються **до** виконання runtime. Кандидати блокуються,
коли entry виходить за межі кореня plugin, шлях має права запису для всіх, або
власність шляху виглядає підозріло для невбудованих plugins.

### Поведінка manifest-first

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти оголошені channels/skills/config schema або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати labels/placeholders у Control UI
- показувати metadata install/catalog

Для нативних plugins модуль runtime є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, tools, commands або provider flows.

### Що кешує завантажувач

OpenClaw зберігає короткі in-process кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів plugin

Ці кеші зменшують пікові витрати під час запуску та повторних викликів commands. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як persistence.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешування через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugins не змінюють безпосередньо випадкові глобальні стани core. Вони
реєструються в центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- channels
- providers
- handlers Gateway RPC
- HTTP routes
- CLI registrars
- background services
- commands, що належать plugin

Потім функції core читають із цього реєстру, а не звертаються до модулів plugin
безпосередньо. Це зберігає односпрямованість завантаження:

- модуль plugin -> реєстрація в реєстрі
- runtime core -> використання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь core
потрібна лише одна точка інтеграції: "читати реєстр", а не "робити special-case для кожного модуля plugin".

## Callbacks прив’язки conversation

Plugins, які прив’язують conversation, можуть реагувати, коли approval вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як запит на bind буде схвалено або відхилено:

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

Поля payload callback:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: початкове резюме запиту, підказка detach, id відправника та
  metadata conversation

Цей callback лише сповіщує. Він не змінює того, кому дозволено прив’язувати
conversation, і запускається після завершення обробки approval у core.

## Runtime-хуки провайдера

Тепер provider plugins мають два шари:

- metadata маніфесту: `providerAuthEnvVars` для дешевого пошуку env-auth до
  завантаження runtime, плюс `providerAuthChoices` для дешевих labels onboarding/auth-choice
  і metadata CLI flags до завантаження runtime
- hooks часу config: `catalog` / застарілий `discovery` плюс `applyConfigDefaults`
- runtime hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
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

OpenClaw і далі володіє загальним agent loop, failover, обробкою transcript і
policy tools. Ці hooks — це surface розширення для provider-специфічної поведінки без
потреби в повністю custom inference transport.

Використовуйте manifest `providerAuthEnvVars`, коли provider має credentials на основі env,
які загальні шляхи auth/status/model-picker повинні бачити без завантаження runtime plugin.
Використовуйте manifest `providerAuthChoices`, коли surfaces CLI onboarding/auth-choice
мають знати id choice провайдера, labels груп і просту прив’язку auth одним flag без завантаження runtime provider.
Залишайте `envVars` runtime provider для operator-facing підказок, таких як labels onboarding або
OAuth client-id/client-secret setup vars.

### Порядок hooks і використання

Для model/provider plugins OpenClaw викликає hooks приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий орієнтир для вибору.

| #   | Hook                              | Що він робить                                                                           | Коли використовувати                                                                                                                        |
| --- | --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує config provider у `models.providers` під час генерації `models.json`          | Провайдер володіє catalog або типовими значеннями base URL                                                                                  |
| 2   | `applyConfigDefaults`             | Застосовує global config defaults, що належать provider, під час materialization config | Типові значення залежать від режиму auth, env або семантики сімейства моделей provider                                                     |
| --  | _(built-in model lookup)_         | OpenClaw спочатку пробує звичайний шлях registry/catalog                                | _(це не hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview alias model-id до пошуку                               | Провайдер володіє очищенням alias до канонічного визначення моделі                                                                          |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider до загального складання моделі          | Провайдер володіє очищенням transport для custom id provider у тому ж сімействі transport                                                  |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` до визначення runtime/provider                       | Провайдеру потрібне очищення config, яке має жити разом із plugin; вбудовані helpers Google-family також підтримують сумісні записи Google config |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи використання нативного streaming до config providers       | Провайдеру потрібні endpoint-керовані виправлення metadata нативного streaming usage                                                       |
| 7   | `resolveConfigApiKey`             | Визначає env-marker auth для config providers до завантаження runtime auth              | Провайдер має власне визначення API key через env-marker; `amazon-bedrock` також має тут вбудований AWS env-marker resolver               |
| 8   | `resolveSyntheticAuth`            | Показує local/self-hosted або auth на основі config без збереження plaintext            | Провайдер може працювати із synthetic/local marker credentials                                                                              |
| 9   | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic placeholder profiles порівняно з auth через env/config | Провайдер зберігає synthetic placeholder profiles, які не повинні мати вищий пріоритет                                                     |
| 10  | `resolveDynamicModel`             | Синхронний fallback для model id, що належать provider, але ще відсутні в локальному registry | Провайдер приймає довільні upstream model id                                                                                                |
| 11  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` запускається знову               | Провайдеру потрібні мережеві metadata до визначення невідомих id                                                                            |
| 12  | `normalizeResolvedModel`          | Фінальний перезапис до того, як embedded runner використає визначену модель             | Провайдеру потрібні перезаписи transport, але він усе ще використовує core transport                                                       |
| 13  | `contributeResolvedModelCompat`   | Додає compat-flags для vendor-моделей за сумісним transport іншого типу                 | Провайдер розпізнає власні моделі на proxy transports без перехоплення всього provider                                                     |
| 14  | `capabilities`                    | Метадані transcript/tooling, що належать provider і використовуються спільною логікою core | Провайдеру потрібні особливості transcript/provider-family                                                                                  |
| 15  | `normalizeToolSchemas`            | Нормалізує schema tools до того, як їх побачить embedded runner                         | Провайдеру потрібне очищення schema для сімейства transport                                                                                 |
| 16  | `inspectToolSchemas`              | Показує provider-owned діагностику schema після нормалізації                            | Провайдер хоче попередження про keywords, не навчаючи core provider-специфічних правил                                                     |
| 17  | `resolveReasoningOutputMode`      | Вибирає нативний або tagged контракт reasoning-output                                   | Провайдеру потрібен tagged reasoning/final output замість нативних полів                                                                    |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту до загальних wrappers параметрів stream                  | Провайдеру потрібні типові параметри запиту або очищення параметрів per-provider                                                           |
| 19  | `createStreamFn`                  | Повністю замінює звичайний шлях stream custom transport                                 | Провайдеру потрібен custom wire protocol, а не просто wrapper                                                                               |
| 20  | `wrapStreamFn`                    | Wrapper stream після застосування загальних wrappers                                    | Провайдеру потрібні wrappers заголовків/тіла/compat моделі запиту без custom transport                                                     |
| 21  | `resolveTransportTurnState`       | Додає нативні заголовки або metadata transport для конкретного turn                     | Провайдер хоче, щоб загальні transports передавали provider-native turn identity                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні заголовки WebSocket або policy cool-down session                          | Провайдер хоче, щоб загальні WS transports налаштовували заголовки session або policy fallback                                             |
| 23  | `formatApiKey`                    | Форматер auth-profile: збережений profile стає runtime-рядком `apiKey`                 | Провайдер зберігає додаткові metadata auth і потребує custom форми runtime token                                                           |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для custom endpoints refresh або policy помилок refresh  | Провайдер не вписується у спільні refreshers `pi-ai`                                                                                       |
| 25  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається при помилці оновлення OAuth                      | Провайдеру потрібна власна підказка щодо відновлення auth після помилки refresh                                                            |
| 26  | `matchesContextOverflowError`     | Matcher переповнення context window, що належить provider                               | Провайдер має сирі помилки overflow, які загальні heuristics пропустять                                                                     |
| 27  | `classifyFailoverReason`          | Класифікація причин failover, що належить provider                                      | Провайдер може зіставити сирі API/transport errors із rate-limit/overload тощо                                                             |
| 28  | `isCacheTtlEligible`              | Policy prompt-cache для proxy/backhaul providers                                        | Провайдеру потрібне proxy-специфічне керування TTL кешу                                                                                    |
| 29  | `buildMissingAuthMessage`         | Заміна загального recovery message для відсутньої auth                                  | Провайдеру потрібна provider-специфічна підказка відновлення при відсутній auth                                                            |
| 30  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей плюс необов’язкова user-facing підказка помилки | Провайдеру потрібно приховувати застарілі upstream rows або замінювати їх підказкою vendor                                                 |
| 31  | `augmentModelCatalog`             | Додає synthetic/final rows catalog після виявлення                                      | Провайдеру потрібні synthetic rows для forward-compat у `models list` і pickers                                                            |
| 32  | `isBinaryThinking`                | Перемикач reasoning увімк./вимк. для binary-thinking providers                          | Провайдер відкриває лише бінарне thinking on/off                                                                                            |
| 33  | `supportsXHighThinking`           | Підтримка reasoning `xhigh` для вибраних моделей                                        | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                          |
| 34  | `resolveDefaultThinkingLevel`     | Типовий рівень `/think` для конкретного сімейства моделей                               | Провайдер володіє типовою policy `/think` для сімейства моделей                                                                             |
| 35  | `isModernModelRef`                | Matcher modern-model для live filters профілів і вибору smoke                           | Провайдер володіє зіставленням preferred моделей для live/smoke                                                                             |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані credentials на фактичний runtime token/key перед inference          | Провайдеру потрібен обмін token або short-lived credentials для запиту                                                                      |
| 37  | `resolveUsageAuth`                | Визначає credentials usage/billing для `/usage` і пов’язаних surfaces status            | Провайдеру потрібен custom парсинг token usage/quota або інші credentials usage                                                            |
| 38  | `fetchUsageSnapshot`              | Отримує та нормалізує provider-специфічні snapshots usage/quota після визначення auth   | Провайдеру потрібен provider-специфічний endpoint usage або parser payload                                                                  |
| 39  | `createEmbeddingProvider`         | Створює embedding adapter, що належить provider, для memory/search                      | Поведінка embedding memory має належати plugin provider                                                                                     |
| 40  | `buildReplayPolicy`               | Повертає policy replay, яка керує обробкою transcript для provider                      | Провайдеру потрібна custom policy transcript (наприклад, видалення блоків thinking)                                                        |
| 41  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                            | Провайдеру потрібні provider-специфічні перезаписи replay понад спільні helpers compact                                                    |
| 42  | `validateReplayTurns`             | Фінальна валідація або зміна форми turns replay до embedded runner                      | Transport провайдера потребує суворішої валідації turn після загальної санітизації                                                         |
| 43  | `onModelSelected`                 | Запускає побічні ефекти після вибору моделі, що належать provider                       | Провайдеру потрібна telemetry або provider-owned стан, коли модель стає активною                                                            |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний plugin provider, а потім переходять до інших provider plugins, здатних на hooks,
доки один із них справді не змінить model id або transport/config. Це дозволяє
shim providers для alias/compat працювати без потреби, щоб викликаюча сторона знала, який
вбудований plugin володіє цим перезаписом. Якщо жоден provider hook не переписує
підтримуваний запис Google-family config, все одно застосовується вбудований нормалізатор Google config.

Якщо provider потрібен повністю custom wire protocol або custom виконавець запитів,
це вже інший клас extension. Ці hooks призначені для поведінки provider, яка
все ще працює на звичайному inference loop OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  і `wrapStreamFn`, оскільки володіє forward-compat для Claude 4.6,
  підказками сімейства provider, інструкціями відновлення auth, інтеграцією з endpoint usage,
  відповідністю prompt-cache, типовими значеннями config з урахуванням auth, типовою/адаптивною policy thinking Claude,
  а також Anthropic-специфічним формуванням stream для
  beta headers, `/fast` / `serviceTier` і `context1m`.
- Claude-специфічні helpers stream Anthropic поки що залишаються у власному
  публічному шві `api.ts` / `contract-api.ts` вбудованого plugin. Ця package surface
  експортує `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі
  builders wrappers Anthropic замість розширення загального SDK навколо правил
  beta-header одного provider.
- OpenAI використовує `resolveDynamicModel`, `normalizeResolvedModel` і
  `capabilities` плюс `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` і `isModernModelRef`,
  оскільки володіє GPT-5.4 forward-compat, прямою нормалізацією OpenAI
  `openai-completions` -> `openai-responses`, підказками auth з урахуванням Codex,
  приховуванням Spark, synthetic rows списку OpenAI і політикою thinking / live-model GPT-5;
  сімейство stream `openai-responses-defaults` володіє
  спільними нативними wrappers OpenAI Responses для
  attribution headers, `/fast`/`serviceTier`, verbosity тексту, нативного web search Codex,
  формуванням payload reasoning-compat і керуванням context у Responses.
- OpenRouter використовує `catalog` плюс `resolveDynamicModel` і
  `prepareDynamicModel`, оскільки provider є pass-through і може відкривати нові
  model id ще до оновлення статичного catalog OpenClaw; він також використовує
  `capabilities`, `wrapStreamFn` і `isCacheTtlEligible`, щоб тримати
  provider-специфічні заголовки запитів, metadata маршрутизації, патчі reasoning і
  policy prompt-cache поза core. Його policy replay походить із сімейства
  `passthrough-gemini`, тоді як сімейство stream `openrouter-thinking`
  володіє ін’єкцією proxy reasoning і пропусками для непідтримуваних моделей / `auto`.
- GitHub Copilot використовує `catalog`, `auth`, `resolveDynamicModel` і
  `capabilities` плюс `prepareRuntimeAuth` і `fetchUsageSnapshot`, оскільки йому
  потрібні device login, що належать provider, fallback-поведінка моделей, особливості transcript Claude,
  обмін токена GitHub на токен Copilot і endpoint usage, що належить provider.
- OpenAI Codex використовує `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` і `augmentModelCatalog` плюс
  `prepareExtraParams`, `resolveUsageAuth` і `fetchUsageSnapshot`, оскільки він
  усе ще працює на core transports OpenAI, але володіє своєю нормалізацією
  transport/base URL, policy fallback оновлення OAuth, типовим вибором transport,
  synthetic rows catalog Codex і інтеграцією з endpoint usage ChatGPT; він
  використовує те саме сімейство stream `openai-responses-defaults`, що й прямий OpenAI.
- Google AI Studio і Gemini CLI OAuth використовують `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` і `isModernModelRef`, оскільки
  сімейство replay `google-gemini` володіє fallback для forward-compat Gemini 3.1,
  нативною валідацією replay Gemini, санітизацією replay під час bootstrap, режимом
  tagged reasoning-output і зіставленням modern-model, тоді як
  сімейство stream `google-thinking` володіє нормалізацією payload thinking Gemini;
  Gemini CLI OAuth також використовує `formatApiKey`, `resolveUsageAuth` і
  `fetchUsageSnapshot` для форматування токена, парсингу токена та
  підключення endpoint quota.
- Anthropic Vertex використовує `buildReplayPolicy` через
  сімейство replay `anthropic-by-model`, щоб Claude-специфічне очищення replay
  залишалося прив’язаним до id Claude, а не до кожного transport `anthropic-messages`.
- Amazon Bedrock використовує `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` і `resolveDefaultThinkingLevel`, оскільки володіє
  класифікацією помилок throttle/not-ready/context-overflow, специфічною для Bedrock,
  для трафіку Anthropic-on-Bedrock; його policy replay все ще використовує той самий
  захист лише для Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode і Opencode Go використовують `buildReplayPolicy`
  через сімейство replay `passthrough-gemini`, оскільки вони проксіюють моделі Gemini
  через transports, сумісні з OpenAI, і потребують санітизації
  thought-signature Gemini без нативної валідації replay Gemini або bootstrap-перезаписів.
- MiniMax використовує `buildReplayPolicy` через
  сімейство replay `hybrid-anthropic-openai`, оскільки один provider володіє і
  семантикою Anthropic-message, і семантикою OpenAI-compatible; він
  зберігає видалення blocks thinking лише для Claude з боку Anthropic, одночасно перевизначаючи
  режим reasoning output назад на нативний, а сімейство stream `minimax-fast-mode`
  володіє перезаписами моделі fast-mode на спільному шляху stream.
- Moonshot використовує `catalog` плюс `wrapStreamFn`, оскільки все ще використовує
  спільний OpenAI transport, але потребує provider-owned нормалізації payload thinking; сімейство
  stream `moonshot-thinking` відображає config плюс стан `/think` на
  його нативний бінарний payload thinking.
- Kilocode використовує `catalog`, `capabilities`, `wrapStreamFn` і
  `isCacheTtlEligible`, оскільки потребує provider-owned заголовків запитів,
  нормалізації payload reasoning, підказок transcript Gemini та керування
  TTL кешу Anthropic; сімейство stream `kilocode-thinking` зберігає ін’єкцію Kilo thinking
  на спільному proxy stream, пропускаючи `kilo/auto` та
  інші proxy model id, які не підтримують явні payload reasoning.
- Z.AI використовує `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` і `fetchUsageSnapshot`, оскільки володіє fallback GLM-5,
  типовими значеннями `tool_stream`, UX бінарного thinking, зіставленням modern-model,
  а також auth для usage + отриманням quota; сімейство stream `tool-stream-default-on`
  тримає wrapper `tool_stream`, увімкнений за замовчуванням, поза handwritten glue для кожного provider.
- xAI використовує `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` і `isModernModelRef`,
  оскільки володіє нативною нормалізацією transport Responses xAI, перезаписами alias fast-mode Grok,
  типовим `tool_stream`, очищенням strict-tool / reasoning-payload,
  повторним використанням fallback auth для tools, що належать plugin, forward-compat
  визначенням моделей Grok і compat-патчами, що належать provider, такими як профіль schema tools xAI,
  непідтримувані keywords schema, нативний `web_search` і декодування аргументів викликів tools з HTML entities.
- Mistral, OpenCode Zen і OpenCode Go використовують лише `capabilities`, щоб
  тримати особливості transcript/tooling поза core.
- Вбудовані providers лише з catalog, такі як `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` і `volcengine`, використовують
  лише `catalog`.
- Qwen використовує `catalog` для свого текстового provider плюс спільні реєстрації
  media-understanding і video-generation для своїх мультимодальних surfaces.
- MiniMax і Xiaomi використовують `catalog` плюс hooks usage, оскільки їхня поведінка `/usage`
  належить plugin, хоча inference і далі виконується через спільні transports.

## Runtime helpers

Plugins можуть отримувати доступ до вибраних helpers core через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS core для surfaces файлів/voice-note.
- Використовує core-конфігурацію `messages.tts` і вибір provider.
- Повертає буфер аудіо PCM + sample rate. Plugins повинні виконувати ресемплінг/кодування для provider.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для voice pickers або setup flows, що належать vendor.
- Списки голосів можуть включати багатші metadata, такі як locale, стать і теги personality для provider-aware pickers.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

Plugins також можуть реєструвати speech providers через `api.registerSpeechProvider(...)`.

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

- Залишайте policy TTS, fallback і доставку відповідей у core.
- Використовуйте speech providers для поведінки synthesis, що належить vendor.
- Застаріле значення вводу Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель володіння — орієнтована на компанію: один plugin vendor може володіти
  text, speech, image і майбутніми media providers у міру того, як OpenClaw додає ці
  capability-контракти.

Для розуміння зображень/аудіо/відео plugins реєструють один типізований
provider media-understanding замість загального key/value bag:

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

- Залишайте orchestration, fallback, config і підключення channels у core.
- Залишайте поведінку vendor у plugin provider.
- Розширення шляхом додавання повинно залишатися типізованим: нові необов’язкові methods, нові необов’язкові
  поля result, нові необов’язкові capabilities.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє capability-контрактом і runtime helper
  - plugins vendor реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins використовують `api.runtime.videoGeneration.*`

Для runtime helpers media-understanding plugins можуть викликати:

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

Для транскрипції аудіо plugins можуть використовувати або runtime media-understanding,
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

- `api.runtime.mediaUnderstanding.*` — це бажана спільна surface для
  розуміння зображень/аудіо/відео.
- Використовує core-конфігурацію аудіо media-understanding (`tools.media.audio`) і порядок fallback provider.
- Повертає `{ text: undefined }`, коли вихід транскрипції не створюється (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності.

Plugins також можуть запускати фонові виконання subagent через `api.runtime.subagent`:

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

- `provider` і `model` — це необов’язкові перевизначення для окремого запуску, а не постійні зміни session.
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, що належать plugin, оператори повинні явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugins конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски subagent для недовірених plugins усе ще працюють, але запити на перевизначення відхиляються, а не тихо повертаються до fallback.

Для web search plugins можуть використовувати спільний runtime helper замість
прямого звернення до підключення tool агента:

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

Plugins також можуть реєструвати providers web-search через
`api.registerWebSearchProvider(...)`.

Примітки:

- Залишайте вибір provider, визначення credentials і спільну семантику запитів у core.
- Використовуйте web-search providers для vendor-специфічних transports пошуку.
- `api.runtime.webSearch.*` — це бажана спільна surface для feature/channel plugins, яким потрібна поведінка пошуку без залежності від wrapper tool агента.

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

- `generate(...)`: згенерувати зображення, використовуючи налаштований ланцюжок providers генерації зображень.
- `listProviders(...)`: перелічити доступних providers генерації зображень і їхні можливості.

## HTTP routes Gateway

Plugins можуть відкривати HTTP endpoints через `api.registerHttpRoute(...)`.

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

- `path`: шлях route у межах HTTP server gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"` для вимоги звичайної auth gateway, або `"plugin"` для auth/перевірки webhook, якими керує plugin.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію route.
- `handler`: повертає `true`, коли route обробив запит.

Примітки:

- `api.registerHttpHandler(...)` видалено і спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Routes plugin повинні явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один plugin не може замінити route іншого plugin.
- Routes, що перекриваються, з різними рівнями `auth` відхиляються. Зберігайте ланцюжки fallthrough `exact`/`prefix` лише в межах одного рівня auth.
- Routes `auth: "plugin"` **не** отримують автоматично operator runtime scopes. Вони призначені для webhook/signature verification, якими керує plugin, а не для привілейованих helper-викликів Gateway.
- Routes `auth: "gateway"` працюють усередині runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth із shared-secret (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes route plugin прив’язаними до `operator.write`, навіть якщо викликаюча сторона надсилає `x-openclaw-scopes`
  - довірені режими HTTP з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких identity-bearing запитах route plugin, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що route plugin з auth gateway є неявною admin-surface. Якщо вашому route потрібна поведінка лише для admin, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення plugins використовуйте subpaths SDK замість монолітного імпорту `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` для примітивів реєстрації plugin.
- `openclaw/plugin-sdk/core` для загального спільного контракту, орієнтованого на plugin.
- `openclaw/plugin-sdk/config-schema` для експорту кореневої Zod schema `openclaw.json`
  (`OpenClawSchema`).
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
  setup/auth/reply/webhook. `channel-inbound` — це спільне місце для
  debounce, mention matching, форматування envelope і helpers контексту inbound envelope.
  `channel-setup` — вузький шов setup для необов’язкового install.
  `setup-runtime` — runtime-safe surface setup, яка використовується `setupEntry` /
  відкладеним запуском, включно з import-safe адаптерами патчів setup.
  `setup-adapter-runtime` — це env-aware шов adapter setup облікового запису.
  `setup-tools` — це малий шов CLI/archive/docs helper (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain subpaths, такі як `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `openclaw/plugin-sdk/directory-runtime` для спільних helpers runtime/config.
  `telegram-command-config` — це вузький публічний шов для нормалізації/валідації custom-команд Telegram і він залишається доступним, навіть якщо вбудована contract-surface Telegram тимчасово недоступна.
  `text-runtime` — це спільний шов text/markdown/logging, включно з
  видаленням assistant-visible-text, helpers render/chunking markdown, helpers редагування,
  helpers directive-tag і utilities безпечного тексту.
- Для approval-специфічних швів channel слід віддавати перевагу одному контракту
  `approvalCapability` на plugin. Потім core читає auth approval, доставку, render і
  native-routing behavior через цю одну capability замість змішування
  поведінки approval з не пов’язаними полями plugin.
- `openclaw/plugin-sdk/channel-runtime` є застарілим і залишається лише як
  compatibility shim для старіших plugins. Новий код повинен імпортувати вужчі
  загальні примітиви, а код repo не повинен додавати нові імпорти цього shim.
- Внутрішні компоненти вбудованих extension залишаються приватними. Зовнішні plugins повинні використовувати лише subpaths `openclaw/plugin-sdk/*`. Core/test код OpenClaw може використовувати
  публічні точки входу repo під коренем package plugin, такі як `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, а також вузькі файли, наприклад
  `login-qr-api.js`. Ніколи не імпортуйте `src/*` package plugin з core або з
  іншого extension.
- Поділ точок входу repo:
  `<plugin-package-root>/api.js` — це barrel helpers/types,
  `<plugin-package-root>/runtime-api.js` — це barrel лише для runtime,
  `<plugin-package-root>/index.js` — це entry вбудованого plugin,
  а `<plugin-package-root>/setup-entry.js` — це entry plugin setup.
- Поточні приклади вбудованих providers:
  - Anthropic використовує `api.js` / `contract-api.js` для helpers stream Claude, таких
    як `wrapAnthropicProviderStream`, helpers beta-header і парсинг `service_tier`.
  - OpenAI використовує `api.js` для builders provider, helpers типової моделі та
    builders provider realtime.
  - OpenRouter використовує `api.js` для свого builder provider плюс helpers
    onboarding/config, тоді як `register.runtime.js` усе ще може реекспортувати загальні
    helpers `plugin-sdk/provider-stream` для локального використання в repo.
- Публічні точки входу, завантажені через facade, надають перевагу активному snapshot config runtime,
  якщо він існує, а потім повертаються до визначеного config-файлу на диску,
  коли OpenClaw ще не надає runtime snapshot.
- Загальні спільні примітиви залишаються бажаним публічним контрактом SDK. Невеликий
  зарезервований набір branded helper-швів вбудованих channels усе ще існує. Розглядайте їх як
  шви підтримки/сумісності вбудованих компонентів, а не нові цілі імпорту для сторонніх рішень; нові міжканальні контракти, як і раніше, мають з’являтися в
  загальних subpaths `plugin-sdk/*` або в локальних barrels `api.js` /
  `runtime-api.js` plugin.

Примітка щодо сумісності:

- Уникайте кореневого barrel `openclaw/plugin-sdk` у новому коді.
- Спочатку віддавайте перевагу вузьким стабільним примітивам. Новіші subpaths
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool — це бажаний контракт для нової роботи
  із вбудованими та зовнішніми plugins.
  Парсинг/зіставлення targets належить до `openclaw/plugin-sdk/channel-targets`.
  Gating дій повідомлень і helpers message-id реакцій належать до
  `openclaw/plugin-sdk/channel-actions`.
- Допоміжні barrels, специфічні для вбудованих extension, не є стабільними за замовчуванням. Якщо
  helper потрібен лише вбудованому extension, залишайте його за локальним швом `api.js` або `runtime-api.js` цього extension замість просування до
  `openclaw/plugin-sdk/<extension>`.
- Нові спільні helper-шви мають бути загальними, а не branded за channel. Спільний парсинг
  targets належить до `openclaw/plugin-sdk/channel-targets`; channel-специфічні
  внутрішні компоненти залишаються за локальним швом `api.js` або `runtime-api.js` plugin-власника.
- Capability-специфічні subpaths, такі як `image-generation`,
  `media-understanding` і `speech`, існують, тому що вбудовані/нативні plugins використовують
  їх сьогодні. Їхня наявність сама по собі не означає, що кожен експортований helper є
  довгостроковим зафіксованим зовнішнім контрактом.

## Schema tools повідомлень

Plugins повинні володіти channel-специфічними внесками до schema в `describeMessageTool(...)`.
Зберігайте provider-специфічні поля в plugin, а не в спільному core.

Для спільних portable fragments schema використовуйте загальні helpers, що експортуються через
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` для payload у стилі grid кнопок
- `createMessageToolCardSchema()` для структурованих payload карток

Якщо форма schema має сенс лише для одного provider, визначайте її у
власному джерелі цього plugin замість просування до спільного SDK.

## Визначення channel target

Channel plugins повинні володіти channel-специфічною семантикою target. Зберігайте спільний
outbound host загальним і використовуйте surface messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід нормалізований target
  трактувати як `direct`, `group` або `channel` до lookup у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  слід пропустити одразу до визначення за id-подібним значенням, а не виконувати пошук у directory.
- `messaging.targetResolver.resolveTarget(...)` — це fallback plugin, коли
  core потребує фінального provider-owned визначення після нормалізації або
  після невдалого пошуку в directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє provider-специфічною побудовою
  route session після того, як target визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які повинні відбуватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок "сприймати це як явний/нативний id target".
- Використовуйте `resolveTarget` для provider-специфічного fallback нормалізації, а не для
  широкого пошуку в directory.
- Зберігайте provider-native ids, як-от ids chat, ids thread, JIDs, handles і ids room,
  у значеннях `target` або provider-специфічних params, а не в загальних полях SDK.

## Directories на основі config

Plugins, які формують entries directory з config, повинні тримати цю логіку в
plugin і повторно використовувати спільні helpers із
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли channel потребує peers/groups на основі config, таких як:

- DM peers на основі allowlist
- налаштовані карти channels/groups
- статичні fallback-и directory з урахуванням scope облікового запису

Спільні helpers у `directory-runtime` обробляють лише загальні операції:

- фільтрацію query
- застосування limit
- helpers dedupe/normalization
- побудову `ChannelDirectoryEntry[]`

Channel-специфічна перевірка облікового запису та нормалізація id повинні залишатися в реалізації plugin.

## Catalogs provider

Provider plugins можуть визначати catalogs моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує до
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли plugin володіє provider-специфічними model ids, типовими
значеннями base URL або metadata моделей, які залежать від auth.

`catalog.order` керує тим, коли catalog plugin зливається відносно вбудованих
неявних providers OpenClaw:

- `simple`: прості providers на основі API key або env
- `profile`: providers, які з’являються, коли існують auth profiles
- `paired`: providers, які синтезують кілька пов’язаних записів provider
- `late`: останній прохід після інших неявних providers

Пізніші providers перемагають у разі конфлікту key, тож plugins можуть навмисно
перевизначати вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Канальний огляд лише для читання

Якщо ваш plugin реєструє channel, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поряд із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Він може припускати, що credentials
  повністю materialized, і швидко помилятися, якщо обов’язкових secrets бракує.
- Шляхи commands лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки doctor/config
  repair, не повинні потребувати materialization runtime credentials лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- Включає поля джерела/стану credentials, коли це доречно, такі як:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для повідомлення про доступність лише для читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле source) для commands у стилі status.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але він недоступний у поточному шляху command.

Це дозволяє commands лише для читання повідомляти "налаштовано, але недоступно в цьому шляху command" замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

## Package packs

Directory plugin може містити `package.json` з `openclaw.extensions`:

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

Якщо ваш plugin імпортує залежності npm, установіть їх у цій directory, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне правило безпеки: кожен entry `openclaw.extensions` повинен залишатися в межах directory plugin
після визначення symlink. Entries, які виходять за межі directory package, відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts і без dev dependencies у runtime). Зберігайте дерева залежностей plugin як "pure JS/TS" і уникайте package, які потребують збірок через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує surfaces setup для вимкненого channel plugin або
коли channel plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повного entry plugin. Це робить запуск і setup легшими,
коли ваш основний entry plugin також підключає tools, hooks чи інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести channel plugin на той самий шлях `setupEntry` під час фази
запуску gateway до listen, навіть якщо channel уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup-surface, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що entry setup
повинен реєструвати всі можливості channel-власника, від яких залежить запуск, такі як:

- сама реєстрація channel
- будь-які HTTP routes, які мають бути доступні до того, як gateway почне слухати
- будь-які methods, tools або services gateway, які мають існувати в тому ж вікні часу

Якщо ваш повний entry усе ще володіє будь-якою обов’язковою startup-можливістю, не вмикайте
цей flag. Залишайте plugin на типовій поведінці й дозвольте OpenClaw завантажити
повний entry під час запуску.

Вбудовані channels також можуть публікувати helpers contract-surface лише для setup, до яких core
може звертатися до завантаження повного runtime channel. Поточна surface setup promotion така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю surface, коли йому потрібно підвищити застарілу
конфігурацію single-account channel до `channels.<id>.accounts.*` без завантаження
повного entry plugin. Matrix — поточний вбудований приклад: він переносить лише
keys auth/bootstrap до іменованого підвищеного облікового запису, коли іменовані облікові записи вже існують, і
може зберігати налаштований неканонічний key default-account замість того, щоб завжди створювати
`accounts.default`.

Ці adapters патчів setup зберігають lazy-виявлення contract-surface вбудованих компонентів. Час import
залишається малим; surface promotion завантажується лише під час першого використання замість повторного входу у startup вбудованого channel при import module.

Коли ці startup surfaces включають methods Gateway RPC, зберігайте їх під
plugin-специфічним prefix. Простори імен admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди визначаються
як `operator.admin`, навіть якщо plugin запитує вужчий scope.

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

### Metadata catalog channel

Channel plugins можуть оголошувати metadata setup/discovery через `openclaw.channel` і
підказки install через `openclaw.install`. Це дозволяє залишати data-free у core catalog.

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

Корисні поля `openclaw.channel` поза мінімальним прикладом:

- `detailLabel`: вторинний label для багатших surfaces catalog/status
- `docsLabel`: перевизначення тексту посилання на docs
- `preferOver`: ids plugin/channel нижчого пріоритету, які цей запис catalog має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: керування copy для surfaces selection
- `markdownCapable`: позначає channel як сумісний із markdown для рішень щодо outbound formatting
- `showConfigured`: приховує channel із surfaces списку налаштованих channels, якщо встановлено `false`
- `quickstartAllowFrom`: включає channel до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть якщо існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддає перевагу lookup session під час визначення announce targets

OpenClaw також може зливати **зовнішні catalogs channels** (наприклад, експорт реєстру MPM).
Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл повинен
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для key `"entries"`.

## Plugins context engine

Plugins context engine володіють orchestration контексту session для ingest, assembly
і compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити типову
конвеєрну обробку context, а не просто додати memory search або hooks.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
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
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Додавання нової можливості

Коли plugin потребує поведінки, яка не вписується в поточний API, не обходьте
систему plugin приватним прямим зверненням. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначити контракт core
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, злиття config,
   lifecycle, channel-facing semantics і форма runtime helper.
2. додати типізовані surfaces реєстрації/runtime plugin
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою surface можливості.
3. підключити core + споживачів channels/features
   Channels і feature plugins повинні використовувати нову можливість через core,
   а не напряму імпортувати реалізацію vendor.
4. зареєструвати реалізації vendor
   Потім plugins vendor реєструють свої backend для цієї можливості.
5. додати покриття контракту
   Додайте тести, щоб володіння і форма реєстрації з часом залишалися явними.

Саме так OpenClaw залишається виразним, не стаючи жорстко прив’язаним до
світогляду одного provider. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і пропрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай повинна одночасно торкатися
таких surfaces:

- типи контрактів core у `src/<capability>/types.ts`
- runner/runtime helper core у `src/<capability>/runtime.ts`
- surface реєстрації API plugin у `src/plugins/types.ts`
- підключення реєстру plugin у `src/plugins/registry.ts`
- відкриття runtime plugin у `src/plugins/runtime/*`, коли feature/channel
  plugins мають її використовувати
- helpers capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контрактів у `src/plugins/contracts/registry.ts`
- docs для операторів/plugin у `docs/`

Якщо якоїсь із цих surfaces бракує, це зазвичай означає, що можливість
ще не повністю інтегрована.

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

Шаблон тесту контракту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає просте правило:

- core володіє capability-контрактом + orchestration
- plugins vendor володіють vendor-реалізаціями
- feature/channel plugins використовують runtime helpers
- тести контрактів зберігають явність володіння
