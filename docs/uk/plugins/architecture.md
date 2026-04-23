---
read_when:
    - Збирання або налагодження нативних plugins OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація runtime hooks provider або plugins каналів
sidebarTitle: Internals
summary: 'Внутрішня будова Plugin: модель можливостей, володіння, контракти, конвеєр завантаження та runtime helpers'
title: Внутрішня будова Plugin
x-i18n:
    generated_at: "2026-04-23T07:25:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7500ddc49feb828c65b0ec856aafdd53d52c965c32232bb518eb218f686ebf0
    source_path: plugins/architecture.md
    workflow: 15
---

# Внутрішня будова Plugin

<Info>
  Це **поглиблений довідник з архітектури**. Практичні посібники див. тут:
  - [Встановлення та використання plugins](/uk/tools/plugin) — посібник для користувачів
  - [Початок роботи](/uk/plugins/building-plugins) — перший посібник зі створення plugin
  - [Plugins каналів](/uk/plugins/sdk-channel-plugins) — створення каналу обміну повідомленнями
  - [Plugins providers](/uk/plugins/sdk-provider-plugins) — створення provider моделей
  - [Огляд SDK](/uk/plugins/sdk-overview) — карта імпорту та API реєстрації
</Info>

На цій сторінці описано внутрішню архітектуру системи plugins OpenClaw.

## Публічна модель можливостей

Можливості — це публічна модель **нативних plugins** всередині OpenClaw. Кожен
нативний plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Capability             | Registration method                              | Приклади plugins                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Виведення тексту       | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Бекенд CLI для виведення | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Мовлення               | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Отримання вебданих     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Вебпошук               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                 | `msteams`, `matrix`                  |

Plugin, який реєструє нуль можливостей, але надає hooks, tools або
services, є **застарілим plugin лише з hooks**. Такий шаблон і далі повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже реалізована в core і сьогодні використовується
вбудованими/нативними plugins, але сумісність зовнішніх plugins усе ще потребує
чіткішої межі, ніж «це експортується, отже це заморожено».

Поточні рекомендації:

- **наявні зовнішні plugins:** зберігайте працездатність інтеграцій на основі hooks; вважайте
  це базовим рівнем сумісності
- **нові вбудовані/нативні plugins:** віддавайте перевагу явній реєстрації можливостей замість
  vendor-specific доступу всередину або нових конструкцій лише з hooks
- **зовнішні plugins, що переходять на реєстрацію можливостей:** це дозволено, але
  вважайте surfaces допоміжних засобів, прив’язані до конкретних можливостей, такими, що розвиваються,
  якщо документація явно не позначає контракт як стабільний

Практичне правило:

- API реєстрації можливостей — це бажаний напрямок
- застарілі hooks залишаються найбезпечнішим шляхом без порушення сумісності для зовнішніх plugins під час
  переходу
- не всі експортовані допоміжні subpaths однакові; віддавайте перевагу вузькому задокументованому
  контракту, а не побічним експортам допоміжних засобів

### Форми plugins

OpenClaw класифікує кожен завантажений plugin за формою на основі його фактичної
поведінки реєстрації, а не лише статичних метаданих:

- **plain-capability** — реєструє рівно один тип можливостей (наприклад,
  plugin лише для provider, як-от `mistral`)
- **hybrid-capability** — реєструє кілька типів можливостей (наприклад,
  `openai` володіє виведенням тексту, мовленням, розумінням медіа та
  генерацією зображень)
- **hook-only** — реєструє лише hooks (типізовані або користувацькі), без capabilities,
  tools, commands чи services
- **non-capability** — реєструє tools, commands, services або routes, але без
  capabilities

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin і розподіл
можливостей. Докладніше див. у [довіднику CLI](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для
plugins лише з hooks. Реальні застарілі plugins усе ще залежать від нього.

Напрямок:

- зберігати його працездатним
- документувати його як застарілий
- для роботи з перевизначенням model/provider віддавати перевагу `before_model_resolve`
- для змін prompts віддавати перевагу `before_prompt_build`
- видаляти лише після зниження реального використання і коли покриття fixtures доведе безпечність міграції

### Сигнали сумісності

Під час запуску `openclaw doctor` або `openclaw plugins inspect <id>` ви можете побачити
один із таких ярликів:

| Signal                     | Значення                                                    |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Config успішно розбирається, plugins коректно визначаються  |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є застарілим |
| **hard error**             | Config некоректний або plugin не вдалося завантажити        |

Ні `hook-only`, ні `before_agent_start` не зламають ваш plugin сьогодні --
`hook-only` є рекомендаційним сигналом, а `before_agent_start` лише викликає попередження. Ці
сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система plugins OpenClaw має чотири рівні:

1. **Маніфест + виявлення**
   OpenClaw знаходить кандидатів у plugins із налаштованих шляхів, коренів workspace,
   глобальних коренів plugins і вбудованих plugins. Виявлення спочатку читає нативні
   маніфести `openclaw.plugin.json` та маніфести підтримуваних bundle.
2. **Увімкнення + валідація**
   Core визначає, чи є виявлений plugin увімкненим, вимкненим, заблокованим або
   вибраним для ексклюзивного слота, наприклад пам’яті.
3. **Завантаження runtime**
   Нативні plugins OpenClaw завантажуються в процесі через jiti і реєструють
   можливості в центральному реєстрі. Сумісні bundles нормалізуються в записи
   реєстру без імпорту коду runtime.
4. **Використання surfaces**
   Решта OpenClaw читає реєстр, щоб надавати tools, канали, налаштування provider,
   hooks, HTTP routes, CLI commands і services.

Зокрема для CLI plugin виявлення кореневих commands розділено на дві фази:

- метадані часу розбору надходять із `registerCli(..., { descriptors: [...] })`
- реальний модуль CLI plugin може залишатися лінивим і реєструватися під час першого виклику

Це дозволяє залишати код CLI, що належить plugin, всередині plugin, і водночас дає OpenClaw
можливість резервувати імена кореневих commands до розбору.

Важлива межа проєктування:

- виявлення + валідація config мають працювати на основі **метаданих маніфесту/схеми**
  без виконання коду plugin
- нативна поведінка runtime надходить зі шляху `register(api)` модуля plugin

Такий поділ дозволяє OpenClaw валідовувати config, пояснювати відсутні/вимкнені plugins і
будувати підказки UI/схеми ще до повної активації runtime.

### Plugins каналів і спільний tool повідомлень

Plugins каналів не повинні реєструвати окремий tool для надсилання/редагування/реакцій для
звичайних дій у чаті. OpenClaw зберігає один спільний tool `message` у core, а
plugins каналів володіють специфічним для каналу виявленням і виконанням за ним.

Поточна межа така:

- core володіє хостом спільного tool `message`, підключенням prompts, веденням обліку сесій/гілок
  і диспетчеризацією виконання
- plugins каналів володіють виявленням дій у межах scope, виявленням можливостей і будь-якими
  специфічними для каналу фрагментами схеми
- plugins каналів володіють специфічною для provider граматикою розмов сесії, наприклад
  тим, як ідентифікатори conversation кодують thread ids або успадковуються від батьківських conversations
- plugins каналів виконують остаточну дію через свій адаптер дій

Для plugins каналів surface SDK — це
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик
виявлення дозволяє plugin повертати видимі дії, можливості та внески до схеми
разом, щоб ці частини не розходилися.

Коли специфічний для каналу параметр tool повідомлень містить джерело медіа, наприклад
локальний шлях або URL віддаленого медіа, plugin також має повертати
`mediaSourceParams` з `describeMessageTool(...)`. Core використовує цей явний
список, щоб застосовувати нормалізацію шляхів пісочниці й підказки доступу до вихідних медіа
без жорстко закодованих імен параметрів plugin.
Тут віддавайте перевагу maps у межах дії, а не одному плоскому списку для всього каналу,
щоб параметр медіа лише для профілю не нормалізувався для не пов’язаних дій, таких як
`send`.

Core передає scope runtime у цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для context-sensitive plugins. Канал може приховувати або показувати
дії повідомлень залежно від активного облікового запису, поточної кімнати/гілки/повідомлення або
довіреної ідентичності запитувача без жорстко закодованих специфічних для каналу гілок у
core tool `message`.

Саме тому зміни маршрутизації embedded-runner усе ще є роботою plugin: runner
відповідає за передавання поточної ідентичності чату/сесії в межу виявлення plugin, щоб
спільний tool `message` відкривав правильний surface, що належить каналу, для поточного ходу.

Для допоміжних засобів виконання, що належать каналу, вбудовані plugins мають зберігати runtime виконання
всередині власних модулів extension. Core більше не володіє runtime дій повідомлень Discord,
Slack, Telegram або WhatsApp у `src/agents/tools`.
Ми не публікуємо окремі subpaths `plugin-sdk/*-action-runtime`, і вбудовані
plugins мають імпортувати свій власний локальний код runtime безпосередньо зі своїх
модулів extension.

Та сама межа застосовується до загалом SDK seams із назвами providers: core не повинен
імпортувати зручні barrels, специфічні для каналів Slack, Discord, Signal,
WhatsApp або подібних extensions. Якщо core потребує певної поведінки, або використовуйте
власний barrel `api.ts` / `runtime-api.ts` вбудованого plugin, або підніміть цю потребу
до вузької загальної можливості в спільному SDK.

Зокрема для опитувань існує два шляхи виконання:

- `outbound.sendPoll` — спільна базова реалізація для каналів, що відповідають загальній моделі
  опитувань
- `actions.handleAction("poll")` — бажаний шлях для специфічної для каналу семантики
  опитувань або додаткових параметрів опитувань

Тепер core відкладає спільний розбір опитувань до моменту, коли диспетчеризація опитування plugin
відхиляє дію, тож обробники опитувань, що належать plugin, можуть приймати специфічні для каналу поля
опитувань без блокування загальним парсером опитувань на попередньому етапі.

Повну послідовність запуску див. у розділі [Конвеєр завантаження](#load-pipeline).

## Модель володіння можливостями

OpenClaw розглядає нативний plugin як межу володіння для **компанії** або
**функції**, а не як набір не пов’язаних інтеграцій.

Це означає:

- plugin компанії зазвичай має володіти всіма surfaces OpenClaw, пов’язаними з цією компанією
- plugin функції зазвичай має володіти повним surface функції, яку він додає
- канали мають використовувати спільні можливості core замість того, щоб повторно реалізовувати
  поведінку provider ad hoc

Приклади:

- вбудований plugin `openai` володіє поведінкою provider моделей OpenAI, а також поведінкою OpenAI для
  мовлення + голосу в реальному часі + розуміння медіа + генерації зображень
- вбудований plugin `elevenlabs` володіє поведінкою мовлення ElevenLabs
- вбудований plugin `microsoft` володіє поведінкою мовлення Microsoft
- вбудований plugin `google` володіє поведінкою provider моделей Google, а також поведінкою Google для
  розуміння медіа + генерації зображень + вебпошуку
- вбудований plugin `firecrawl` володіє поведінкою отримання вебданих Firecrawl
- вбудовані plugins `minimax`, `mistral`, `moonshot` і `zai` володіють своїми
  бекендами розуміння медіа
- вбудований plugin `qwen` володіє поведінкою text-provider Qwen, а також
  поведінкою розуміння медіа і генерації відео
- plugin `voice-call` — це plugin функції: він володіє транспортом дзвінків, tools,
  CLI, routes і мостом медіапотоків Twilio, але використовує спільні можливості мовлення,
  а також транскрипції в реальному часі й голосу в реальному часі замість
  прямого імпорту plugins vendor

Бажаний кінцевий стан:

- OpenAI знаходиться в одному plugin, навіть якщо охоплює текстові моделі, мовлення, зображення та
  майбутнє відео
- інший vendor може зробити так само для власного surface
- канали не залежать від того, який plugin vendor володіє provider; вони використовують
  спільний контракт можливостей, який надає core

Ось ключова відмінність:

- **plugin** = межа володіння
- **capability** = контракт core, який можуть реалізовувати або використовувати кілька plugins

Тому, якщо OpenClaw додає нову область, наприклад відео, перше питання не таке:
«який provider повинен жорстко закодувати обробку відео?» Перше питання таке: «яким є
контракт core для можливостей відео?» Щойно такий контракт з’являється, plugins vendor
можуть реєструватися для нього, а plugins каналів/функцій можуть його використовувати.

Якщо можливість ще не існує, зазвичай правильний крок такий:

1. визначити відсутню можливість у core
2. відкрити її через API/runtime plugin у типізований спосіб
3. підключити канали/функції до цієї можливості
4. дозволити plugins vendor реєструвати реалізації

Це робить володіння явним і водночас уникає поведінки core, яка залежить від
одного vendor або одноразового специфічного для plugin шляху коду.

### Шарування можливостей

Використовуйте таку ментальну модель, коли вирішуєте, де має знаходитися код:

- **шар можливостей core**: спільна оркестрація, policy, fallback, правила
  злиття config, семантика доставки та типізовані контракти
- **шар plugin vendor**: специфічні для vendor API, автентифікація, каталоги моделей, синтез мовлення,
  генерація зображень, майбутні бекенди відео, endpoints використання
- **шар plugin каналу/функції**: інтеграція Slack/Discord/voice-call тощо,
  яка використовує можливості core і представляє їх на певному surface

Наприклад, TTS має таку форму:

- core володіє policy TTS під час відповіді, порядком fallback, prefs і доставкою через канали
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями синтезу
- `voice-call` використовує допоміжний засіб runtime телекомунікаційного TTS

Тому для майбутніх можливостей слід віддавати перевагу такому самому шаблону.

### Приклад plugin компанії з кількома можливостями

Plugin компанії має виглядати цілісно ззовні. Якщо OpenClaw має спільні
контракти для моделей, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа,
генерації зображень, генерації відео, отримання вебданих і вебпошуку,
vendor може володіти всіма своїми surfaces в одному місці:

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

- один plugin володіє surface vendor
- core, як і раніше, володіє контрактами можливостей
- канали та plugins функцій використовують helpers `api.runtime.*`, а не код vendor
- contract tests можуть перевіряти, що plugin зареєстрував ті можливості,
  якими він заявляє, що володіє

### Приклад можливості: розуміння відео

OpenClaw уже розглядає розуміння зображень/аудіо/відео як одну спільну
можливість. Та сама модель володіння застосовується і тут:

1. core визначає контракт розуміння медіа
2. plugins vendor реєструють `describeImage`, `transcribeAudio` і
   `describeVideo`, де це застосовно
3. канали та plugins функцій використовують спільну поведінку core замість
   прямого підключення до коду vendor

Це дозволяє не вшивати припущення про відео одного provider у core. Plugin володіє
surface vendor; core володіє контрактом можливостей і поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим
контрактом можливостей і helper runtime, а plugins vendor реєструють
реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний контрольний список впровадження? Див.
[Capability Cookbook](/uk/plugins/architecture).

## Контракти та забезпечення виконання

Surface API plugin навмисно типізований і централізований у
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
helpers runtime, на які може покладатися plugin.

Чому це важливо:

- автори plugins отримують один стабільний внутрішній стандарт
- core може відхилити дубльоване володіння, наприклад коли два plugins реєструють той самий
  id provider
- під час запуску можна показувати діагностику з конкретними діями для некоректної реєстрації
- contract tests можуть забезпечувати володіння вбудованими plugins і запобігати тихому дрейфу

Є два шари забезпечення виконання:

1. **забезпечення виконання реєстрації під час runtime**
   Реєстр plugins перевіряє реєстрації під час завантаження plugins. Приклади:
   дубльовані id provider, дубльовані id providers мовлення та некоректні
   реєстрації спричиняють діагностику plugin замість невизначеної поведінки.
2. **contract tests**
   Вбудовані plugins фіксуються в реєстрах контрактів під час тестових запусків, щоб
   OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для model
   providers, providers мовлення, providers вебпошуку та володіння реєстрацією вбудованих plugins.

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який plugin яким
surface володіє. Це дає змогу core і каналам безперешкодно компонуватися, оскільки володіння
задеклароване, типізоване й тестоване, а не неявне.

### Що має входити в контракт

Хороші контракти plugin:

- типізовані
- невеликі
- специфічні для можливості
- належать core
- придатні до повторного використання кількома plugins
- можуть використовуватися каналами/функціями без знання vendor

Погані контракти plugin:

- специфічна для vendor policy, прихована в core
- одноразові аварійні шляхи plugin, які обходять реєстр
- код каналу, який напряму звертається до реалізації vendor
- ad hoc об’єкти runtime, які не є частиною `OpenClawPluginApi` або
  `api.runtime`

Якщо є сумніви, підніміть рівень абстракції: спочатку визначте можливість, а вже потім
дозвольте plugins підключатися до неї.

## Модель виконання

Нативні plugins OpenClaw працюють **у межах процесу** разом із Gateway. Вони не
ізольовані пісочницею. Завантажений нативний plugin має той самий межовий рівень довіри процесу, що й
код core.

Наслідки:

- нативний plugin може реєструвати tools, network handlers, hooks і services
- помилка нативного plugin може призвести до збою або дестабілізації gateway
- зловмисний нативний plugin еквівалентний довільному виконанню коду всередині процесу OpenClaw

Сумісні bundles безпечніші за замовчуванням, оскільки OpenClaw наразі розглядає їх
як пакети метаданих/контенту. У поточних релізах це здебільшого означає вбудовані
Skills.

Для невбудованих plugins використовуйте allowlists і явні шляхи встановлення/завантаження. Ставтеся до
workspace plugins як до коду для часу розробки, а не як до стандартних налаштувань production.

Для імен пакетів вбудованих workspace зберігайте id plugin прив’язаним до імені npm:
`@openclaw/<id>` за замовчуванням або схвалений типізований суфікс, наприклад
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно відкриває вужчу роль plugin.

Важлива примітка про довіру:

- `plugins.allow` довіряє **ids plugins**, а не походженню джерела.
- Workspace plugin з тим самим id, що й вбудований plugin, навмисно затіняє
  вбудовану копію, коли цей workspace plugin увімкнено/додано до allowlist.
- Це нормально і корисно для локальної розробки, тестування патчів і hotfix.
- Довіра до вбудованого plugin визначається зі snapshot джерела — маніфесту та
  коду на диску під час завантаження — а не з метаданих встановлення. Пошкоджений
  або підмінений запис встановлення не може непомітно розширити surface довіри вбудованого plugin
  понад те, що заявляє фактичне джерело.

## Межа експорту

OpenClaw експортує можливості, а не зручність реалізації.

Зберігайте реєстрацію можливостей публічною. Скорочуйте експорти helper, що не є контрактами:

- subpaths helper, специфічні для вбудованих plugins
- subpaths внутрішньої інфраструктури runtime, не призначені як публічний API
- helpers зручності, специфічні для vendor
- helpers налаштування/онбордингу, які є деталями реалізації

Деякі subpaths helper вбудованих plugins досі залишаються в згенерованій карті експорту SDK
заради сумісності та супроводу вбудованих plugins. Поточні приклади включають
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька seams `plugin-sdk/matrix*`. Ставтеся до них як до
зарезервованих експортів деталей реалізації, а не як до рекомендованого шаблону SDK для
нових сторонніх plugins.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів plugins
2. читає нативні або сумісні маніфести bundle та метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує config plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає стан увімкнення для кожного кандидата
6. завантажує увімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незібрані нативні plugins використовують jiti
7. викликає hooks нативного `register(api)` і збирає реєстрації в реєстр plugins
8. відкриває реєстр для surfaces commands/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані plugins використовують `register`; для нових plugins віддавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли entry виходить за межі кореня plugin, шлях є world-writable або
володіння шляхом виглядає підозріло для невбудованих plugins.

### Поведінка manifest-first

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти оголошені канали/Skills/схему config або можливості bundle
- валідовувати `plugins.entries.<id>.config`
- доповнювати labels/placeholders Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime plugin

Для нативних plugins модуль runtime — це частина data plane. Він реєструє
фактичну поведінку, наприклад hooks, tools, commands або потоки provider.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації й виявлення налаштування;
вони не замінюють реєстрацію runtime, `register(...)` або `setupEntry`.
Перші живі споживачі активації тепер використовують підказки маніфесту для commands, каналів і providers,
щоб звузити завантаження plugins до ширшої матеріалізації реєстру:

- Завантаження CLI звужується до plugins, які володіють запитаною основною command
- визначення налаштування каналу/plugin звужується до plugins, які володіють запитаним
  id каналу
- явне визначення налаштування/runtime provider звужується до plugins, які володіють
  запитаним id provider

Виявлення налаштування тепер надає перевагу ids, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів plugins перед переходом до
`setup-api` для plugins, яким усе ще потрібні hooks runtime під час налаштування. Якщо більше
ніж один виявлений plugin заявляє той самий нормалізований id provider налаштування або CLI backend,
пошук налаштування відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення.

### Що кешує завантажувач

OpenClaw зберігає короткочасні кеші в межах процесу для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів plugins

Ці кеші зменшують стрибкоподібне навантаження під час запуску та повторних commands. Їх безпечно
сприймати як короткочасні кеші продуктивності, а не як постійне зберігання.

Примітка щодо продуктивності:

- Встановіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу за допомогою `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugins не змінюють напряму довільні глобальні об’єкти core. Вони реєструються в
центральному реєстрі plugins.

Реєстр відстежує:

- записи plugins (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- канали
- providers
- handlers Gateway RPC
- HTTP routes
- реєстратори CLI
- фонові services
- commands, що належать plugins

Потім можливості core читають із цього реєстру замість прямої взаємодії з модулями plugin.
Це зберігає одностороннє завантаження:

- модуль plugin -> реєстрація в реєстрі
- runtime core -> використання реєстру

Це розділення важливе для супроводу. Воно означає, що більшості surfaces core потрібна
лише одна точка інтеграції: «прочитати реєстр», а не «робити special-case для кожного модуля plugin».

## Зворотні виклики прив’язки conversation

Plugins, які прив’язують conversation, можуть реагувати, коли схвалення визначено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати зворотний виклик після того, як запит на прив’язку буде схвалено або відхилено:

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

Поля корисного навантаження зворотного виклику:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: початкове зведення запиту, підказка від’єднання, id відправника та
  метадані conversation

Цей зворотний виклик призначений лише для сповіщення. Він не змінює того, кому дозволено прив’язувати
conversation, і виконується після завершення обробки схвалення в core.

## Runtime hooks provider

Plugins provider тепер мають два шари:

- метадані маніфесту: `providerAuthEnvVars` для дешевого пошуку env-auth provider
  до завантаження runtime, `providerAuthAliases` для варіантів provider, які спільно використовують
  auth, `channelEnvVars` для дешевого пошуку env/setup каналу до
  завантаження runtime, а також `providerAuthChoices` для дешевих labels онбордингу/вибору auth та
  метаданих прапорців CLI до завантаження runtime
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw, як і раніше, володіє загальним циклом агента, failover, обробкою transcript і
policy tools. Ці hooks — це surface розширення для специфічної для provider поведінки без
потреби в повністю користувацькому транспорті виведення.

Використовуйте маніфест `providerAuthEnvVars`, коли provider має облікові дані на основі env,
які загальні шляхи auth/status/model-picker повинні бачити без завантаження runtime plugin. Використовуйте маніфест
`providerAuthAliases`, коли один id provider повинен повторно використовувати env vars, профілі auth,
auth на основі config і варіант онбордингу API-key іншого id provider. Використовуйте маніфест
`providerAuthChoices`, коли surfaces CLI для онбордингу/вибору auth повинні знати id вибору provider,
labels груп і просте підключення auth через один прапорець без завантаження runtime provider. Залишайте runtime provider
`envVars` для операторських підказок, таких як labels онбордингу або змінні налаштування
client-id/client-secret OAuth.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або setup на основі env, які
загальний shell-env fallback, перевірки config/status або prompts налаштування повинні бачити
без завантаження runtime каналу.

### Порядок hooks і їх використання

Для plugins model/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий посібник для вибору.

| #   | Hook                              | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує config provider у `models.providers` під час генерації `models.json`                                  | Provider володіє каталогом або базовими значеннями `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує глобальні значення config за замовчуванням, що належать provider, під час матеріалізації config    | Значення за замовчуванням залежать від режиму auth, env або семантики сімейства моделей provider                                              |
| --  | _(built-in model lookup)_         | OpenClaw спочатку намагається використати звичайний шлях реєстру/каталогу                                      | _(не є hook plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Provider володіє очищенням псевдонімів до канонічного визначення моделі                                                                       |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider перед загальним складанням моделі                              | Provider володіє очищенням транспорту для користувацьких ids provider у тому самому сімействі транспорту                                     |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/provider                                           | Provider потребує очищення config, яке має жити разом із plugin; вбудовані helpers сімейства Google також страхують підтримувані записи config Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує переписування сумісності native streaming-usage до config providers                                 | Provider потребує виправлень метаданих native streaming usage, зумовлених endpoint                                                           |
| 7   | `resolveConfigApiKey`             | Визначає auth через env-marker для config providers до завантаження auth runtime                               | Provider має власне визначення API-key через env-marker; `amazon-bedrock` також має тут вбудований resolver AWS env-marker                   |
| 8   | `resolveSyntheticAuth`            | Відкриває локальний/self-hosted або auth на основі config без збереження відкритого тексту                     | Provider може працювати із synthetic/local маркером облікових даних                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі auth, що належать provider; типове `persistence` — `runtime-only` для облікових даних CLI/app | Provider повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic-заповнювачів профілю порівняно з auth на основі env/config              | Provider зберігає synthetic-профілі-заповнювачі, які не повинні мати вищий пріоритет                                                         |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ids моделей provider, яких ще немає в локальному реєстрі                               | Provider приймає довільні ids моделей верхнього рівня                                                                                        |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` виконується знову                                         | Provider потребує мережевих метаданих до визначення невідомих ids                                                                            |
| 13  | `normalizeResolvedModel`          | Остаточне переписування перед тим, як embedded runner використає визначену модель                               | Provider потребує переписування транспорту, але все ще використовує транспорт core                                                           |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей vendor за іншим сумісним транспортом                                     | Provider розпізнає власні моделі на проксі-транспортах, не перебираючи на себе роль provider                                                |
| 15  | `capabilities`                    | Метадані transcript/tooling, що належать provider і використовуються спільною логікою core                     | Provider потребує особливостей transcript/сімейства provider                                                                                 |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми tools до того, як їх побачить embedded runner                                                  | Provider потребує очищення схем для сімейства транспорту                                                                                     |
| 17  | `inspectToolSchemas`              | Виводить діагностику схем, що належить provider, після нормалізації                                             | Provider хоче попередження щодо ключових слів без навчання core правилам, специфічним для provider                                          |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: native або з тегами                                                          | Provider потребує reasoning/final output із тегами замість native-полів                                                                      |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками опцій потоку                                         | Provider потребує параметри запиту за замовчуванням або очищення параметрів для конкретного provider                                        |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким транспортом                                               | Provider потребує користувацький дротовий протокол, а не просто обгортку                                                                     |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Provider потребує обгортки сумісності заголовків/тіла запиту/моделі без користувацького транспорту                                          |
| 22  | `resolveTransportTurnState`       | Прикріплює native-заголовки транспорту або метадані для кожного ходу                                            | Provider хоче, щоб загальні транспорти надсилали native-ідентичність ходу provider                                                          |
| 23  | `resolveWebSocketSessionPolicy`   | Прикріплює native-заголовки WebSocket або policy охолодження сесії                                              | Provider хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або policy fallback                                                 |
| 24  | `formatApiKey`                    | Форматувальник auth-profile: збережений профіль стає рядком `apiKey` runtime                                    | Provider зберігає додаткові метадані auth і потребує користувацьку форму токена runtime                                                     |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для користувацьких endpoint оновлення або policy помилки оновлення              | Provider не відповідає спільним засобам оновлення `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли оновлення OAuth завершується помилкою                                  | Provider потребує власні рекомендації щодо виправлення auth після помилки оновлення                                                          |
| 27  | `matchesContextOverflowError`     | Matcher переповнення context-window, що належить provider                                                       | Provider має сирі помилки переповнення, які загальні евристики не виявлять                                                                   |
| 28  | `classifyFailoverReason`          | Класифікація причини failover, що належить provider                                                             | Provider може зіставляти сирі помилки API/транспорту з rate-limit/overload тощо                                                             |
| 29  | `isCacheTtlEligible`              | Policy prompt-cache для providers проксі/backhaul                                                               | Provider потребує gating TTL кешу, специфічний для проксі                                                                                    |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення при відсутньому auth                                                 | Provider потребує специфічну для provider підказку відновлення при відсутньому auth                                                         |
| 31  | `suppressBuiltInModel`            | Пригнічення застарілої моделі верхнього рівня плюс необов’язкова підказка помилки для користувача              | Provider потребує приховати застарілі рядки верхнього рівня або замінити їх підказкою vendor                                                |
| 32  | `augmentModelCatalog`             | Synthetic/фінальні рядки каталогу, додані після виявлення                                                       | Provider потребує synthetic-рядки прямої сумісності в `models list` і засобах вибору                                                        |
| 33  | `resolveThinkingProfile`          | Специфічний для моделі рівень `/think`, labels відображення та значення за замовчуванням                       | Provider відкриває користувацьку шкалу thinking або бінарний label для вибраних моделей                                                     |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімкнено/вимкнено                                                     | Provider відкриває лише бінарний режим thinking увімкнено/вимкнено                                                                           |
| 35  | `supportsXHighThinking`           | Hook сумісності підтримки reasoning `xhigh`                                                                     | Provider хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності рівня `/think` за замовчуванням                                                                 | Provider володіє policy `/think` за замовчуванням для сімейства моделей                                                                      |
| 37  | `isModernModelRef`                | Matcher сучасних моделей для фільтрів live profile і вибору smoke                                              | Provider володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний токен/ключ runtime безпосередньо перед виведенням              | Provider потребує обміну токена або короткоживучих облікових даних запиту                                                                    |
| 39  | `resolveUsageAuth`                | Визначає облікові дані використання/білінгу для `/usage` і пов’язаних surfaces стану                           | Provider потребує користувацький розбір токена використання/квоти або інші облікові дані використання                                       |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує специфічні для provider snapshot використання/квоти після визначення auth                | Provider потребує специфічний для provider endpoint використання або парсер корисного навантаження                                           |
| 41  | `createEmbeddingProvider`         | Будує адаптер embedding, що належить provider, для пам’яті/пошуку                                              | Поведінка embedding для пам’яті має належати plugin provider                                                                                 |
| 42  | `buildReplayPolicy`               | Повертає policy replay, яка керує обробкою transcript для provider                                             | Provider потребує користувацьку policy transcript (наприклад, видалення блоків thinking)                                                    |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                   | Provider потребує специфічні для provider переписування replay понад спільні helpers Compaction                                             |
| 44  | `validateReplayTurns`             | Остаточна валідація або переформування ходів replay перед embedded runner                                      | Транспорт provider потребує суворішої валідації ходів після загальної санітизації                                                            |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать provider                                               | Provider потребує телеметрію або стан, що належить provider, коли модель стає активною                                                      |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний plugin provider, а потім переходять до інших plugins provider, які підтримують hooks,
доки один із них справді не змінить id моделі або transport/config. Це дозволяє
псевдонімним/сумісним shim provider працювати без вимоги, щоб викликач знав, який
вбудований plugin володіє цим переписуванням. Якщо жоден hook provider не переписує підтримуваний
запис config сімейства Google, вбудований нормалізатор config Google все одно застосовує
це очищення сумісності.

Якщо provider потрібен повністю користувацький дротовий протокол або користувацький виконавець запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки provider, яка
все ще працює в межах звичайного циклу виведення OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  і `wrapStreamFn`, оскільки володіє прямою сумісністю Claude 4.6,
  підказками для сімейства provider, рекомендаціями з відновлення auth, інтеграцією
  endpoint використання, придатністю prompt-cache, значеннями config за замовчуванням з урахуванням auth, політикою
  thinking Claude за замовчуванням/адаптивною і специфічним для Anthropic формуванням потоку для
  beta headers, `/fast` / `serviceTier` та `context1m`.
- Специфічні для Claude потокові helpers Anthropic поки що залишаються у власному
  публічному seam `api.ts` / `contract-api.ts` вбудованого plugin. Цей package surface
  експортує `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі
  засоби побудови обгорток Anthropic замість розширення загального SDK навколо правил
  beta-header одного provider.
- OpenAI використовує `resolveDynamicModel`, `normalizeResolvedModel` і
  `capabilities`, а також `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` і `isModernModelRef`,
  оскільки володіє прямою сумісністю GPT-5.4, прямою нормалізацією OpenAI
  `openai-completions` -> `openai-responses`, підказками auth з урахуванням Codex,
  пригніченням Spark, synthetic-рядками списку OpenAI і політикою thinking /
  live-model GPT-5; сімейство потоків `openai-responses-defaults` володіє
  спільними native-обгортками OpenAI Responses для headers атрибуції,
  `/fast`/`serviceTier`, деталізації тексту, native вебпошуку Codex,
  формування корисного навантаження reasoning-compat і керування context Responses.
- OpenRouter використовує `catalog`, а також `resolveDynamicModel` і
  `prepareDynamicModel`, оскільки provider є наскрізним і може відкривати нові
  ids моделей до оновлення статичного каталогу OpenClaw; він також використовує
  `capabilities`, `wrapStreamFn` і `isCacheTtlEligible`, щоб тримати
  специфічні для provider headers запитів, метадані маршрутизації, патчі reasoning і
  policy prompt-cache поза core. Його policy replay походить із
  сімейства `passthrough-gemini`, тоді як сімейство потоків `openrouter-thinking`
  володіє ін’єкцією reasoning через проксі та пропусками unsupported-model / `auto`.
- GitHub Copilot використовує `catalog`, `auth`, `resolveDynamicModel` і
  `capabilities`, а також `prepareRuntimeAuth` і `fetchUsageSnapshot`, оскільки йому
  потрібні вхід у систему пристрою, що належить provider, поведінка fallback моделі, особливості
  transcript Claude, обмін токена GitHub -> токен Copilot і endpoint використання,
  що належить provider.
- OpenAI Codex використовує `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` і `augmentModelCatalog`, а також
  `prepareExtraParams`, `resolveUsageAuth` і `fetchUsageSnapshot`, оскільки він
  усе ще працює на транспорті OpenAI core, але володіє нормалізацією
  transport/base URL, fallback policy оновлення OAuth, типовим вибором транспорту,
  synthetic-рядками каталогу Codex та інтеграцією endpoint використання ChatGPT; він
  ділить те саме сімейство потоків `openai-responses-defaults`, що й прямий OpenAI.
- Google AI Studio і Gemini CLI OAuth використовують `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` і `isModernModelRef`, оскільки
  сімейство replay `google-gemini` володіє fallback прямої сумісності Gemini 3.1,
  native-валідацією replay Gemini, початковою санітизацією replay, режимом
  виводу reasoning із тегами та зіставленням сучасних моделей, тоді як
  сімейство потоків `google-thinking` володіє нормалізацією корисного навантаження thinking Gemini;
  Gemini CLI OAuth також використовує `formatApiKey`, `resolveUsageAuth` і
  `fetchUsageSnapshot` для форматування токенів, розбору токенів і підключення
  endpoint квот.
- Anthropic Vertex використовує `buildReplayPolicy` через
  сімейство replay `anthropic-by-model`, щоб очищення replay, специфічне для Claude, залишалося
  обмеженим ids Claude, а не кожним транспортом `anthropic-messages`.
- Amazon Bedrock використовує `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` і `resolveThinkingProfile`, оскільки володіє
  специфічною для Bedrock класифікацією помилок throttle/not-ready/context-overflow
  для трафіку Anthropic-on-Bedrock; його policy replay усе ще поділяє той самий
  захист `anthropic-by-model`, обмежений Claude.
- OpenRouter, Kilocode, Opencode і Opencode Go використовують `buildReplayPolicy`
  через сімейство replay `passthrough-gemini`, оскільки вони проксіюють моделі Gemini
  через сумісні з OpenAI транспорти й потребують санітизації
  thought-signature Gemini без native-валідації replay Gemini чи
  початкових переписувань.
- MiniMax використовує `buildReplayPolicy` через
  сімейство replay `hybrid-anthropic-openai`, оскільки один provider володіє семантикою і
  Anthropic-message, і OpenAI-compatible; він зберігає видалення
  thinking-block лише для Claude на боці Anthropic, водночас перевизначаючи режим
  виводу reasoning назад на native, а сімейство потоків `minimax-fast-mode` володіє
  переписуванням моделей швидкого режиму на спільному шляху потоку.
- Moonshot використовує `catalog`, `resolveThinkingProfile` і `wrapStreamFn`, оскільки все ще використовує спільний
  транспорт OpenAI, але потребує нормалізації корисного навантаження thinking, що належить provider; сімейство
  потоків `moonshot-thinking` зіставляє config і стан `/think` зі своїм
  native-бінарним корисним навантаженням thinking.
- Kilocode використовує `catalog`, `capabilities`, `wrapStreamFn` і
  `isCacheTtlEligible`, оскільки йому потрібні headers запитів, що належать provider,
  нормалізація корисного навантаження reasoning, підказки transcript Gemini і
  gating cache-TTL Anthropic; сімейство потоків `kilocode-thinking` зберігає ін’єкцію
  thinking Kilo на спільному проксі-шляху потоку, водночас пропускаючи `kilo/auto` та
  інші ids проксі-моделей, які не підтримують явні корисні навантаження reasoning.
- Z.AI використовує `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` і `fetchUsageSnapshot`, оскільки володіє fallback GLM-5,
  значеннями `tool_stream` за замовчуванням, бінарним UX thinking, зіставленням сучасних моделей і
  як auth використання, так і отриманням квот; сімейство потоків `tool-stream-default-on` тримає
  обгортку `tool_stream`, увімкнену за замовчуванням, поза рукописним кодом glue для кожного provider.
- xAI використовує `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` і `isModernModelRef`,
  оскільки володіє нормалізацією native-транспорту xAI Responses, переписуванням
  псевдонімів швидкого режиму Grok, `tool_stream` за замовчуванням, очищенням
  strict-tool / корисного навантаження reasoning, повторним використанням fallback auth для tools,
  що належать plugin, прямим визначенням моделей Grok і латками сумісності, що належать provider,
  такими як профіль схем tools xAI, непідтримувані ключові слова схем, native `web_search` і декодування
  аргументів виклику tools з HTML-сутностями.
- Mistral, OpenCode Zen і OpenCode Go використовують лише `capabilities`, щоб тримати
  особливості transcript/tooling поза core.
- Вбудовані providers лише з каталогом, такі як `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` і `volcengine`, використовують
  лише `catalog`.
- Qwen використовує `catalog` для свого text provider, а також спільні реєстрації розуміння медіа і
  генерації відео для своїх мультимодальних surfaces.
- MiniMax і Xiaomi використовують `catalog`, а також hooks використання, тому що їхня поведінка `/usage`
  належить plugin, навіть попри те, що виведення все ще виконується через спільні транспорти.

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

- `textToSpeech` повертає звичайне корисне навантаження виводу TTS core для surfaces файлів/голосових нотаток.
- Використовує config core `messages.tts` і вибір provider.
- Повертає буфер аудіо PCM + sample rate. Plugins повинні виконати ресемплінг/кодування для providers.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для засобів вибору голосу або потоків налаштування, що належать vendor.
- Списки голосів можуть включати багатші метадані, такі як locale, gender і теги personality для засобів вибору з урахуванням provider.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugins також можуть реєструвати providers мовлення через `api.registerSpeechProvider(...)`.

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

- Зберігайте policy TTS, fallback і доставку відповідей у core.
- Використовуйте providers мовлення для поведінки синтезу, що належить vendor.
- Застаріле значення вводу Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель володіння орієнтована на компанію: один plugin vendor може володіти
  providers тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео plugins реєструють один типізований
provider розуміння медіа замість загального пакета key/value:

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

- Зберігайте оркестрацію, fallback, config і підключення каналів у core.
- Зберігайте поведінку vendor у plugin provider.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливостей і helper runtime
  - plugins vendor реєструють `api.registerVideoGenerationProvider(...)`
  - plugins функцій/каналів використовують `api.runtime.videoGeneration.*`

Для helpers runtime розуміння медіа plugins можуть викликати:

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

Для транскрипції аудіо plugins можуть використовувати або runtime
розуміння медіа, або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажаний спільний surface для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо розуміння медіа core (`tools.media.audio`) і порядок fallback provider.
- Повертає `{ text: undefined }`, коли не створено результат транскрипції (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається як псевдонім сумісності.

Plugins також можуть запускати фонові запуски subagent через `api.runtime.subagent`:

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

- `provider` і `model` — це необов’язкові перевизначення для окремого запуску, а не постійні зміни сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для запусків fallback, що належать plugin, оператори повинні явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugins конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски subagent із недовірених plugins теж працюють, але запити на перевизначення відхиляються замість тихого переходу до fallback.

Для вебпошуку plugins можуть використовувати спільний helper runtime замість
звернення безпосередньо до підключення tool агента:

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

Plugins також можуть реєструвати providers вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір provider, визначення облікових даних і спільну семантику запитів у core.
- Використовуйте providers вебпошуку для транспортів пошуку, специфічних для vendor.
- `api.runtime.webSearch.*` — це бажаний спільний surface для plugins функцій/каналів, яким потрібна поведінка пошуку без залежності від обгортки tool агента.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка providers генерації зображень.
- `listProviders(...)`: перелічує доступні providers генерації зображень і їхні можливості.

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

- `path`: шлях route під HTTP-сервером gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/перевірки Webhook, якими керує plugin.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію route.
- `handler`: повертає `true`, коли route обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було видалено і спричинить помилку завантаження plugin. Замість нього використовуйте `api.registerHttpRoute(...)`.
- Routes plugin повинні явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один plugin не може замінити route іншого plugin.
- Перекривні routes з різними рівнями `auth` відхиляються. Зберігайте ланцюжки fallthrough `exact`/`prefix` лише в межах одного рівня auth.
- Routes `auth: "plugin"` **не** отримують runtime scopes оператора автоматично. Вони призначені для Webhooks/перевірки підписів, якими керує plugin, а не для привілейованих helper-викликів Gateway.
- Routes `auth: "gateway"` працюють у межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes route plugin на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з носієм ідентичності (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` у приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах route plugin з носієм ідентичності, runtime scope переходить до `operator.write`
- Практичне правило: не припускайте, що route plugin з auth gateway є неявним admin surface. Якщо вашому route потрібна поведінка лише для admin, вимагайте режим auth із носієм ідентичності та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту SDK plugin

Під час написання plugins використовуйте subpaths SDK замість монолітного імпорту `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` для примітивів реєстрації plugin.
- `openclaw/plugin-sdk/core` для загального спільного контракту, орієнтованого на plugin.
- `openclaw/plugin-sdk/config-schema` для експорту кореневої Zod-схеми `openclaw.json`
  (`OpenClawSchema`).
- Стабільні примітиви каналів, такі як `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` для спільного підключення setup/auth/reply/webhook.
  `channel-inbound` — це спільне місце для debounce, зіставлення згадок,
  helpers політики вхідних згадок, форматування envelope вхідних даних і helpers
  контексту envelope вхідних даних.
  `channel-setup` — це вузький seam налаштування для необов’язкового встановлення.
  `setup-runtime` — це безпечний для runtime surface налаштування, який використовується `setupEntry` /
  відкладеним запуском, включно з безпечними для імпорту адаптерами латок налаштування.
  `setup-adapter-runtime` — це seam адаптера налаштування облікового запису з урахуванням env.
  `setup-tools` — це малий seam helpers для CLI/архівів/документації (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain subpaths, такі як `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
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
  `openclaw/plugin-sdk/directory-runtime` для спільних helpers runtime/config.
  `telegram-command-config` — це вузький публічний seam для нормалізації/валідації користувацьких
  commands Telegram і він залишається доступним, навіть якщо surface контракту вбудованого
  Telegram тимчасово недоступний.
  `text-runtime` — це спільний seam тексту/markdown/логування, включно з
  видаленням assistant-visible-text, helpers рендерингу/фрагментації markdown, helpers
  редагування, helpers тегів директив і утилітами безпечного тексту.
- Специфічні для схвалення seams каналів мають надавати перевагу одному контракту `approvalCapability`
  у plugin. Потім core читає auth схвалення, доставку, рендеринг,
  native-routing і поведінку lazy native-handler через цю єдину можливість
  замість змішування поведінки схвалення в непов’язані поля plugin.
- `openclaw/plugin-sdk/channel-runtime` є застарілим і залишається лише як
  shim сумісності для старіших plugins. Новий код повинен імпортувати вужчі
  загальні примітиви, а код repo не повинен додавати нові імпорти цього
  shim.
- Внутрішні частини вбудованих extensions залишаються приватними. Зовнішні plugins повинні використовувати лише subpaths `openclaw/plugin-sdk/*`. Код core/test OpenClaw може використовувати публічні точки входу repo
  в корені пакета plugin, такі як `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, і вузькоспеціалізовані файли, такі як
  `login-qr-api.js`. Ніколи не імпортуйте `src/*` пакета plugin із core або з
  іншого extension.
- Поділ точок входу repo:
  `<plugin-package-root>/api.js` — це barrel helpers/types,
  `<plugin-package-root>/runtime-api.js` — це barrel лише для runtime,
  `<plugin-package-root>/index.js` — це точка входу вбудованого plugin,
  а `<plugin-package-root>/setup-entry.js` — це точка входу plugin для setup.
- Поточні приклади вбудованих providers:
  - Anthropic використовує `api.js` / `contract-api.js` для helpers потоку Claude, таких
    як `wrapAnthropicProviderStream`, helpers beta-header і розбір `service_tier`.
  - OpenAI використовує `api.js` для побудовників provider, helpers моделі за замовчуванням і
    побудовників provider у реальному часі.
  - OpenRouter використовує `api.js` для свого побудовника provider, а також helpers
    онбордингу/config, тоді як `register.runtime.js` усе ще може повторно експортувати загальні
    helpers `plugin-sdk/provider-stream` для локального використання в repo.
- Публічні точки входу, завантажені через facade, надають перевагу активному snapshot config runtime,
  якщо він існує, а потім переходять до визначеного файла config на диску, коли
  OpenClaw ще не обслуговує snapshot runtime.
- Загальні спільні примітиви залишаються бажаним публічним контрактом SDK. Невеликий
  зарезервований сумісний набір branded helper seams вбудованих каналів усе ще існує. Ставтеся до них як до seams для супроводу вбудованих компонентів/сумісності, а не як до нових цілей імпорту для сторонніх розробників; нові міжканальні контракти, як і раніше, мають з’являтися в загальних subpaths `plugin-sdk/*` або в локальних barrels plugin `api.js` /
  `runtime-api.js`.

Примітка щодо сумісності:

- Уникайте кореневого barrel `openclaw/plugin-sdk` у новому коді.
- Спочатку віддавайте перевагу вузьким стабільним примітивам. Новіші subpaths setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool — це бажаний контракт для нової роботи з
  вбудованими та зовнішніми plugins.
  Розбір/зіставлення цілей має належати `openclaw/plugin-sdk/channel-targets`.
  Обмеження дій повідомлень і helpers message-id для реакцій мають належати
  `openclaw/plugin-sdk/channel-actions`.
- Branded helper barrels, специфічні для вбудованих extensions, за замовчуванням не є стабільними. Якщо
  helper потрібен лише вбудованому extension, тримайте його за локальним
  seam `api.js` або `runtime-api.js` цього extension замість просування в
  `openclaw/plugin-sdk/<extension>`.
- Нові спільні helper seams мають бути загальними, а не branded для каналу. Спільний розбір
  цілей має належати `openclaw/plugin-sdk/channel-targets`; специфічні для каналу
  внутрішні частини мають залишатися за локальним seam `api.js` або `runtime-api.js`
  plugin-власника.
- Специфічні для можливостей subpaths, такі як `image-generation`,
  `media-understanding` і `speech`, існують, тому що вбудовані/нативні plugins
  використовують їх уже сьогодні. Сам факт їх наявності ще не означає, що кожен експортований helper є
  довгостроковим замороженим зовнішнім контрактом.

## Схеми tool повідомлень

Plugins мають володіти внесками до схеми `describeMessageTool(...)`, специфічними для каналу,
для примітивів, що не є повідомленнями, таких як реакції, читання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів button, component, block або card, специфічних для provider.
Контракт, правила fallback, зіставлення providers і контрольний список для автора plugin див. у
[Message Presentation](/uk/plugins/message-presentation).

Plugins, які підтримують надсилання, оголошують, що вони можуть рендерити, через можливості повідомлень:

- `presentation` для блоків семантичного представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів доставки із закріпленням

Core вирішує, чи рендерити представлення нативно, чи деградувати його до тексту.
Не відкривайте аварійні шляхи до native UI provider із загального tool повідомлень.
Застарілі helpers SDK для старих native-схем залишаються експортованими для наявних
сторонніх plugins, але нові plugins не повинні їх використовувати.

## Визначення цілі каналу

Plugins каналів мають володіти семантикою цілі, специфічною для каналу. Зберігайте спільний
хост вихідної комунікації загальним і використовуйте surface адаптера повідомлень для правил provider:

- `messaging.inferTargetChatType({ to })` визначає, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  слід для введення одразу перейти до визначення як id-подібного значення замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` — це fallback plugin, коли
  core потребує остаточного визначення, що належить provider, після нормалізації або після
  відсутності результату в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою route сесії, специфічною для provider,
  після визначення цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які повинні прийматися до
  пошуку серед peers/groups.
- Використовуйте `looksLikeId` для перевірок на кшталт «трактувати це як явний/native id цілі».
- Використовуйте `resolveTarget` для fallback нормалізації, специфічного для provider, а не для
  широкого пошуку в каталозі.
- Зберігайте native-ids provider, такі як ids chat, ids thread, JID, handles і ids room,
  усередині значень `target` або специфічних для provider параметрів, а не в загальних полях SDK.

## Каталоги на основі config

Plugins, які формують записи каталогу з config, повинні зберігати цю логіку в
plugin і повторно використовувати спільні helpers із
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі config, наприклад:

- peers DM, керовані allowlist
- налаштовані зіставлення каналів/груп
- статичні fallback каталогу в межах облікового запису

Спільні helpers у `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування обмежень
- helpers дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Специфічна для каналу перевірка облікового запису та нормалізація id мають залишатися в
реалізації plugin.

## Каталоги provider

Plugins provider можуть визначати каталоги моделей для виведення через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли plugin володіє model ids, базовими значеннями base URL або метаданими моделей з обмеженням auth, специфічними для provider.

`catalog.order` керує тим, коли каталог plugin зливається відносно
вбудованих неявних providers OpenClaw:

- `simple`: прості providers на основі API-key або env
- `profile`: providers, які з’являються, коли існують профілі auth
- `paired`: providers, які синтезують кілька пов’язаних записів provider
- `late`: останній прохід, після інших неявних providers

Пізніші providers перемагають у разі конфлікту ключів, тож plugins можуть навмисно перевизначати
вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися помилкою, коли потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/config
  repair, не повинні матеріалізовувати облікові дані runtime лише для того, щоб
  описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для повідомлення про доступність у режимі лише читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела) для команд типу status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дозволяє командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди» замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштований.

## Пакети pack

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

Кожен запис стає plugin. Якщо pack містить кілька extensions, id plugin
стає `name/<fileBase>`.

Якщо ваш plugin імпортує залежності npm, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` повинен залишатися в межах каталогу plugin
після визначення symlink. Записи, що виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без залежностей dev під час runtime). Зберігайте дерева залежностей plugin «чистими JS/TS» і уникайте пакетів, які потребують збірок через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на полегшений модуль лише для setup.
Коли OpenClaw потребує surfaces setup для вимкненого plugin каналу або
коли plugin каналу увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу plugin. Це робить запуск і setup легшими,
коли ваша основна точка входу plugin також підключає tools, hooks або інший код
лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести plugin каналу на той самий шлях `setupEntry` під час
передслухового етапу запуску gateway, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває surface запуску, який має існувати
до того, як gateway почне слухати. На практиці це означає, що точка входу setup
повинна реєструвати кожну можливість, що належить каналу і від якої залежить запуск, наприклад:

- саму реєстрацію каналу
- будь-які HTTP routes, які мають бути доступні до початку прослуховування gateway
- будь-які methods Gateway, tools або services, які повинні існувати в той самий період

Якщо ваша повна точка входу все ще володіє будь-якою потрібною можливістю запуску, не вмикайте
цей прапорець. Залишайте plugin у стандартній поведінці й дозвольте OpenClaw завантажувати
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати helpers поверхні контракту лише для setup, до яких core
може звертатися до завантаження повного runtime каналу. Поточний surface
просування setup такий:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цей surface, коли йому потрібно просунути застарілу конфігурацію
каналу з одним обліковим записом у `channels.<id>.accounts.*` без завантаження повної точки входу plugin.
Matrix — поточний вбудований приклад: він переміщує лише ключі auth/bootstrap у
іменований просунутий обліковий запис, коли іменовані облікові записи вже існують, і може зберегти
налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери латок setup зберігають лінивий характер виявлення поверхні контракту вбудованих компонентів. Час імпорту залишається легким; surface просування завантажується лише під час першого використання замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці surfaces запуску включають methods Gateway RPC, зберігайте їх на
специфічному для plugin префіксі. Простори імен admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
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

### Метадані каталогу каналу

Plugins каналів можуть оголошувати метадані setup/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дозволяє core не містити власних даних каталогу.

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

Корисні поля `openclaw.channel` понад мінімальний приклад:

- `detailLabel`: вторинний label для багатших surfaces каталогу/status
- `docsLabel`: перевизначає текст посилання для посилання на docs
- `preferOver`: ids plugin/channel з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом для surface вибору
- `markdownCapable`: позначає канал як здатний до markdown для рішень щодо форматування вихідних даних
- `exposure.configured`: приховує канал із surfaces списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору setup/configure, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для surfaces навігації docs
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть файл JSON в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька файлів JSON (розділення комою/крапкою з комою/через `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugins context engine

Plugins context engine володіють оркестрацією контексту сесії для приймання, збирання
та Compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук пам’яті або hooks.

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

Якщо ваш engine **не** володіє алгоритмом Compaction, залишайте `compact()`
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
систему plugins через приватний внутрішній доступ. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, злиття config,
   життєвий цикл, семантика для каналів і форма helper runtime.
2. додайте типізовані surfaces реєстрації/runtime plugin
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшим корисним
   типізованим surface можливостей.
3. підключіть споживачів core + каналів/функцій
   Канали та plugins функцій повинні використовувати нову можливість через core,
   а не імпортувати реалізацію vendor напряму.
4. зареєструйте реалізації vendor
   Потім plugins vendor реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб із часом володіння та форма реєстрації залишалися явними.

Так OpenClaw зберігає чітку позицію, не стаючи жорстко прив’язаним до
світогляду одного provider. Конкретний контрольний список файлів і робочий приклад див. у [Capability Cookbook](/uk/plugins/architecture).

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має одночасно торкатися
таких surfaces:

- типи контрактів core у `src/<capability>/types.ts`
- helper runner/runtime core у `src/<capability>/runtime.ts`
- surface реєстрації API plugin у `src/plugins/types.ts`
- підключення реєстру plugins у `src/plugins/registry.ts`
- відкриття runtime plugin у `src/plugins/runtime/*`, коли plugins функцій/каналів
  повинні це використовувати
- helpers capture/test у `src/test-utils/plugin-registration.ts`
- твердження володіння/контракту в `src/plugins/contracts/registry.ts`
- docs для операторів/plugins у `docs/`

Якщо одного з цих surfaces бракує, це зазвичай ознака того, що можливість
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

Шаблон contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє контрактом можливостей + оркестрацією
- plugins vendor володіють реалізаціями vendor
- plugins функцій/каналів використовують helpers runtime
- contract tests зберігають явність володіння
