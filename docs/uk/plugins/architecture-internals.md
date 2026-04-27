---
read_when:
    - Реалізація runtime hooks провайдера, життєвого циклу каналу або пакетних pack-ів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin engine контексту
summary: 'Внутрішня архітектура Plugin: конвеєр завантаження, реєстр, runtime hooks, маршрути HTTP та довідкові таблиці'
title: Внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-04-27T12:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c491e72f14cd0cb5673343dd8374e7377f245ac6f0ca94eee954540fd0d7de6
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щоб ознайомитися з публічною моделлю можливостей, формами Plugin і контрактами
володіння/виконання, див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка —
довідник із внутрішніх механізмів: конвеєр завантаження, реєстр, runtime hooks,
маршрути Gateway HTTP, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє корені потенційних Plugin
2. зчитує маніфести native або сумісних пакетів і метадані пакета
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи ввімкнено кожного кандидата
6. завантажує ввімкнені native-модулі: зібрані вбудовані модулі використовують native-loader;
   незібрані native Plugin використовують jiti
7. викликає native hooks `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані Plugin використовують `register`; для нових Plugin віддавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли entry виходить за межі кореня Plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозріло для не вбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/placeholder-и Control UI
- показувати метадані встановлення/каталогу
- зберігати легкі дескриптори активації та налаштування без завантаження runtime Plugin

Для native Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, інструменти, команди або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- налаштування каналу/визначення Plugin звужується до Plugin, які володіють запитаним
  id каналу
- явне визначення налаштування/runtime провайдера звужується до Plugin, які володіють
  запитаним id провайдера

Планувальник активації надає як API лише з id для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервного варіанта
володіння з маніфесту, такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Це розділення причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення налаштування тепер віддає перевагу id, якими володіють дескриптори, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів Plugin, перш ніж повертатися до
`setup-api` для Plugin, яким усе ще потрібні runtime hooks на етапі налаштування. Списки налаштування провайдера
використовують `providerAuthChoices` маніфесту, варіанти налаштування, похідні від дескриптора,
та метадані каталогу встановлення без завантаження runtime провайдера. Явне
`setup.requiresRuntime: false` є межею лише для дескриптора; пропущене
`requiresRuntime` зберігає застарілий резервний варіант `setup-api` для сумісності. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований id провайдера налаштування або CLI backend,
пошук налаштування відмовляється від неоднозначного власника замість того, щоб покладатися на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє про
розходження між `setup.providers` / `setup.cliBackends` і провайдерами або CLI backend-ами,
зареєстрованими `setup-api`, не блокуючи застарілі Plugin.

### Що кешує loader

OpenClaw зберігає короткоживучі кеші в процесі для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin

Ці кеші зменшують пікове навантаження під час запуску та повторні накладні витрати команд. Їх безпечно
розглядати як короткоживучі кеші продуктивності, а не як постійне сховище.

Гарячі шляхи Gateway мають віддавати перевагу поточному `PluginLookUpTable` або явному
реєстру маніфестів, переданому через ланцюжок викликів. Для викликачів, які все ще перебудовують
метадані маніфесту зі збереженого індексу встановлених Plugin, OpenClaw також зберігає
невеликий обмежений резервний кеш із ключами за встановленим індексом, формою запиту,
політикою конфігурації, коренями runtime та сигнатурами файлів маніфесту/пакета. Цей кеш —
лише резервний варіант для повторної реконструкції встановленого індексу; це не змінюваний
runtime-реєстр Plugin.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Установіть `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1`, щоб вимкнути
  лише резервний кеш manifest-registry для встановленого індексу.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні змінні ядра. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі hooks і типізовані hooks
- канали
- провайдери
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові служби
- команди, що належать Plugin

Потім функції ядра читають із цього реєстру замість прямої взаємодії з модулями Plugin.
Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для супроводу. Воно означає, що більшості поверхонь ядра потрібна
лише одна точка інтеграції: "читати реєстр", а не "робити special-case для кожного модуля Plugin".

## Callback-і прив’язки розмов

Plugin, які прив’язують розмову, можуть реагувати, коли схвалення буде вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як запит на прив’язку
буде схвалено або відхилено:

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

Поля payload callback-а:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: підсумок початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей callback призначений лише для сповіщення. Він не змінює того, кому дозволено прив’язувати
розмову, і запускається після завершення обробки схвалення в ядрі.

## Runtime hooks провайдера

Plugin провайдера мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime:
  `setup.providers[].envVars`, застаріла сумісна форма `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Hooks часу конфігурації**: `catalog` (застаріле `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 необов’язкових hooks для автентифікації, визначення моделі,
  обгортання потоку, рівнів thinking, політики повтору та кінцевих точок використання. Див.
  повний список у розділі [Порядок hooks і використання](#hook-order-and-usage).

OpenClaw, як і раніше, володіє загальним циклом агента, резервним перемиканням, обробкою транскрипту та
політикою інструментів. Ці hooks є поверхнею розширення для специфічної поведінки провайдера
без потреби в повністю власному транспорті inference.

Використовуйте `setup.providers[].envVars` маніфесту, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime Plugin.
Застаріле `providerAuthEnvVars` усе ще зчитується адаптером сумісності під час
перехідного періоду, а не вбудовані Plugin, які його використовують, отримують діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один id провайдера має повторно використовувати env vars, профілі автентифікації,
автентифікацію на основі конфігурації та варіант onboarding API-key іншого id провайдера. Використовуйте маніфест
`providerAuthChoices`, коли поверхні CLI onboarding/auth-choice мають знати
id вибору провайдера, мітки груп і просту auth-обв’язку з одним прапорцем без
завантаження runtime провайдера. Залишайте runtime `envVars` провайдера
для операторських підказок, таких як мітки onboarding або змінні налаштування
OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування на основі env,
які загальний резервний варіант shell-env, перевірки config/status або підказки setup мають бачити
без завантаження runtime каналу.

### Порядок hooks і використання

Для Plugin моделі/провайдера OpenClaw викликає hooks приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник для вибору.

| #   | Hook                              | Що він робить                                                                                                   | Коли використовувати                                                                                                                           |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                           | Провайдер володіє каталогом або типовими значеннями `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує типові глобальні значення конфігурації провайдера під час матеріалізації конфігурації               | Типові значення залежать від режиму автентифікації, env або семантики сімейства моделей провайдера                                            |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                        | _(це не hook Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми `model-id` перед пошуком                                            | Провайдер володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                    |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                             | Провайдер володіє очищенням транспорту для власних id провайдера в межах того самого сімейства транспорту                                     |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед runtime/визначенням провайдера                                         | Провайдеру потрібне очищення конфігурації, яке має жити разом із Plugin; вбудовані помічники сімейства Google також страхують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування використання native streaming до провайдерів у конфігурації                    | Провайдеру потрібні виправлення метаданих використання native streaming, зумовлені кінцевою точкою                                            |
| 7   | `resolveConfigApiKey`             | Визначає автентифікацію env-marker для провайдерів у конфігурації до завантаження runtime-auth                 | Провайдер має власне визначення API-key env-marker; `amazon-bedrock` також має тут вбудований AWS-resolver для env-marker                     |
| 8   | `resolveSyntheticAuth`            | Показує локальну/self-hosted або конфігураційну автентифікацію без збереження plaintext                        | Провайдер може працювати із synthetic/local marker облікових даних                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації провайдера; типове значення `persistence` — `runtime-only` для облікових даних CLI/застосунку | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh-token-ів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає placeholder-и збережених synthetic-профілів нижче за автентифікацію на основі env/конфігурації        | Провайдер зберігає synthetic placeholder-профілі, які не повинні мати вищий пріоритет                                                         |
| 11  | `resolveDynamicModel`             | Синхронний резервний варіант для власних id моделей провайдера, яких ще немає в локальному реєстрі            | Провайдер приймає довільні upstream id моделей                                                                                                 |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                           |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований виконавець використає визначену модель                         | Провайдеру потрібні переписування транспорту, але він усе ще використовує транспорт ядра                                                       |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей вендора за іншим сумісним транспортом                                        | Провайдер розпізнає власні моделі на proxy transport-ах, не перебираючи на себе роль провайдера                                               |
| 15  | `capabilities`                    | Метадані транскрипту/інструментів провайдера, які використовує спільна логіка ядра                             | Провайдеру потрібні особливості транскрипту/сімейства провайдера                                                                               |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований виконавець                                    | Провайдеру потрібне очищення схем для сімейства транспорту                                                                                     |
| 17  | `inspectToolSchemas`              | Показує діагностику схем провайдера після нормалізації                                                          | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт виходу reasoning                                                             | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                    | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                                 |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                      | Провайдеру потрібен власний wire protocol, а не просто обгортка                                                                                |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Провайдеру потрібні обгортки сумісності заголовків/body/моделі запиту без власного транспорту                                                 |
| 22  | `resolveTransportTurnState`       | Прикріплює native-заголовки або метадані транспорту для кожного ходу                                            | Провайдер хоче, щоб загальні транспорти надсилали native-ідентичність ходу провайдера                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Прикріплює native-заголовки WebSocket або політику охолодження сесії                                            | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику резервного перемикання                                  |
| 24  | `formatApiKey`                    | Formatter профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                              | Провайдер зберігає додаткові метадані автентифікації й потребує власної форми runtime-токена                                                  |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних кінцевих точок оновлення або політики збоїв оновлення               | Провайдер не вписується в спільні refreshers `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається, коли оновлення OAuth зазнає невдачі                                     | Провайдеру потрібна власна підказка щодо відновлення автентифікації після збою оновлення                                                      |
| 27  | `matchesContextOverflowError`     | Власний matcher провайдера для переповнення контекстного вікна                                                  | Провайдер має сирі помилки переповнення, які загальні евристики не виявляють                                                                   |
| 28  | `classifyFailoverReason`          | Власна класифікація причин резервного перемикання провайдера                                                    | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/перевантаженням тощо                                                       |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                            | Провайдеру потрібне керування TTL кешу, специфічне для proxy                                                                                   |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення про відсутню автентифікацію                                                      | Провайдеру потрібна власна підказка щодо відновлення після відсутньої автентифікації                                                          |
| 31  | `suppressBuiltInModel`            | Приглушення застарілих upstream-моделей плюс необов’язкова підказка помилки для користувача                    | Провайдеру потрібно приховати застарілі upstream-рядки або замінити їх підказкою вендора                                                      |
| 32  | `augmentModelCatalog`             | Synthetic/фінальні рядки каталогу, додані після виявлення                                                       | Провайдеру потрібні synthetic-рядки для прямої сумісності в майбутньому в `models list` і picker-ах                                           |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                             | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                  |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімк./вимк.                                                           | Провайдер підтримує лише двійковий thinking увімк./вимк.                                                                                       |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                                 | Провайдер хоче підтримку `xhigh` лише для підмножини моделей                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                     | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                             |
| 37  | `isModernModelRef`                | Matcher сучасних моделей для live-фільтрів профілю та вибору smoke                                             | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference               | Провайдеру потрібен обмін токена або короткоживучі облікові дані запиту                                                                       |
| 39  | `resolveUsageAuth`                | Визначає облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь стану                         | Провайдеру потрібен власний розбір токена використання/квоти або інші облікові дані використання                                             |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує snapshots використання/квоти, специфічні для провайдера, після визначення автентифікації | Провайдеру потрібна власна кінцева точка використання або parser payload-у                                                                    |
| 41  | `createEmbeddingProvider`         | Створює embedding-adapter провайдера для memory/search                                                         | Поведінка embedding-ів пам’яті має належати Plugin провайдера                                                                                |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою транскрипту для провайдера                                        | Провайдеру потрібна власна політика транскрипту (наприклад, видалення блоків thinking)                                                       |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення транскрипту                                                 | Провайдеру потрібні переписування replay, специфічні для провайдера, понад спільні helper-и Compaction                                      |
| 44  | `validateReplayTurns`             | Фінальна перевірка або зміна форми ходів replay перед вбудованим виконавцем                                    | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санітизації                                                           |
| 45  | `onModelSelected`                 | Запускає побічні ефекти провайдера після вибору                                                                | Провайдеру потрібна телеметрія або стан провайдера, коли модель стає активною                                                                 |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім переходять до інших Plugin провайдерів,
які підтримують hooks, доки один із них фактично не змінить id моделі або
транспорт/конфігурацію. Це дає змогу shim-ам провайдерів для псевдонімів/compat
працювати без вимоги, щоб викликач знав, який саме вбудований Plugin володіє
цим переписуванням. Якщо жоден hook провайдера не переписує підтримуваний запис
конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе
одно застосовує це виправлення compat.

Якщо провайдеру потрібен повністю власний wire protocol або власний виконавець
запитів, це інший клас розширення. Ці hooks призначені для поведінки провайдера,
яка все ще виконується в межах звичайного циклу inference OpenClaw.

### Приклад провайдера

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

Вбудовані Plugin провайдерів поєднують hooks вище, щоб відповідати потребам
кожного вендора щодо каталогу, автентифікації, thinking, replay і використання. Авторитетний
набір hooks живе разом із кожним Plugin у `extensions/`; ця сторінка
ілюструє форми, а не дзеркально повторює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогу з наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб показувати upstream
    id моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і кінцевих точок використання">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення транскрипту">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу
    підключатися до політики транскрипту через `buildReplayPolicy` замість того,
    щоб кожен Plugin заново реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише каталогу">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють у спільному циклі inference.
  </Accordion>
  <Accordion title="Спеціальні helper-и потоку Anthropic">
    Бета-заголовки, `/fast` / `serviceTier` і `context1m` живуть у
    публічному seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime helper-и

Plugin можуть отримувати доступ до вибраних helper-ів ядра через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виходу TTS ядра для поверхонь файлів/голосових повідомлень.
- Використовує конфігурацію `messages.tts` ядра та вибір провайдера.
- Повертає буфер аудіо PCM + частоту дискретизації. Plugin мають виконати ресемплінг/кодування для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для picker-ів голосу або потоків налаштування, що належать вендору.
- Списки голосів можуть містити багатші метадані, такі як локаль, стать і теги особистості для picker-ів, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugin також можуть реєструвати провайдерів мовлення через `api.registerSpeechProvider(...)`.

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

- Зберігайте політику TTS, резервне перемикання та доставку відповідей у ядрі.
- Використовуйте провайдерів мовлення для поведінки синтезу, що належить вендору.
- Застарілий вхід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння є компанієорієнтованою: один Plugin вендора може володіти
  провайдерами тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додаватиме
  ці контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin реєструють один типізований
провайдер розуміння медіа замість узагальненого набору ключ/значення:

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

- Зберігайте оркестрацію, резервне перемикання, конфігурацію та wiring каналів у ядрі.
- Зберігайте поведінку вендора в Plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - ядро володіє контрактом можливості та runtime helper-ом
  - Plugin вендорів реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime helper-ів розуміння медіа Plugin можуть викликати:

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

Для транскрипції аудіо Plugin можуть використовувати або runtime розуміння медіа,
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

- `api.runtime.mediaUnderstanding.*` є бажаною спільною поверхнею для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо розуміння медіа ядра (`tools.media.audio`) і порядок резервного перемикання провайдерів.
- Повертає `{ text: undefined }`, коли вихід транскрипції не створюється (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` лишається псевдонімом сумісності.

Plugin також можуть запускати фонові підзапуски subagent через `api.runtime.subagent`:

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
- Для запусків резервного перемикання, що належать Plugin, оператори мають явно ввімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цільовими `provider/model`, або `"*"` для явного дозволу будь-якої цілі.
- Запуски subagent від недовірених Plugin також працюють, але запити перевизначення відхиляються замість тихого переходу до резервного варіанта.
- Сесії subagent, створені Plugin, позначаються id Plugin, який їх створив. Резервний варіант `api.runtime.subagent.deleteSession(...)` може видаляти лише такі сесії-власники; довільне видалення сесій усе ще вимагає запиту Gateway з областю admin.

Для вебпошуку Plugin можуть споживати спільний runtime helper замість
прямого доступу до wiring інструментів агента:

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

Plugin також можуть реєструвати провайдерів вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір провайдера, визначення облікових даних і спільну семантику запитів у ядрі.
- Використовуйте провайдерів вебпошуку для транспортів пошуку, специфічних для вендора.
- `api.runtime.webSearch.*` є бажаною спільною поверхнею для Plugin функцій/каналів, яким потрібна поведінка пошуку без залежності від обгортки інструмента агента.

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

- `generate(...)`: створити зображення, використовуючи налаштований ланцюжок провайдерів генерації зображень.
- `listProviders(...)`: показати доступних провайдерів генерації зображень та їхні можливості.

## Маршрути Gateway HTTP

Plugin можуть відкривати кінцеві точки HTTP через `api.registerHttpRoute(...)`.

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

Поля маршруту:

- `path`: шлях маршруту під HTTP-сервером gateway.
- `auth`: обов’язкове поле. Використовуйте `"gateway"`, щоб вимагати звичайну автентифікацію gateway, або `"plugin"` для автентифікації/перевірки Webhook, якими керує Plugin.
- `match`: необов’язкове поле. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове поле. Дає змогу тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` видалено, і він спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Ланцюжки переходу `exact`/`prefix` мають бути лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-області оператора. Вони призначені для Webhook-ів/перевірки підписів, якими керує Plugin, а не для привілейованих helper-викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime-області запиту Gateway, але ця область навмисно консервативна:
  - bearer-автентифікація зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) тримає runtime-області маршруту Plugin закріпленими на `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, runtime-область повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з автентифікацією gateway є неявною поверхнею admin. Якщо вашому маршруту потрібна поведінка лише для admin, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових Plugin використовуйте вузькі підшляхи SDK замість
монолітного кореневого barrel `openclaw/plugin-sdk`. Основні підшляхи:

| Підшлях                            | Призначення                                      |
| ---------------------------------- | ------------------------------------------------ |
| `openclaw/plugin-sdk/plugin-entry` | Примітиви реєстрації Plugin                      |
| `openclaw/plugin-sdk/channel-core` | Helper-и входу/побудови каналу                   |
| `openclaw/plugin-sdk/core`         | Загальні спільні helper-и та umbrella-контракт   |
| `openclaw/plugin-sdk/config-schema`| Коренева схема Zod `openclaw.json` (`OpenClawSchema`) |

Plugin каналів вибирають із сімейства вузьких seam-ів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінка схвалення має консолідуватися
навколо одного контракту `approvalCapability`, а не змішуватися через не пов’язані
поля Plugin. Див. [Plugin каналів](/uk/plugins/sdk-channel-plugins).

Runtime і helper-и конфігурації живуть у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` застарів — це shim сумісності для
старіших Plugin. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного вбудованого Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel helper-ів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу Plugin для setup

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із ядра чи з іншого Plugin.
Точки входу, завантажені через facade, віддають перевагу активному snapshot-у конфігурації runtime, якщо він існує,
а потім переходять до визначеного файла конфігурації на диску.

Підшляхи для конкретних можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, оскільки вбудовані Plugin використовують їх уже сьогодні. Вони не є
автоматично назавжди зафіксованими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin мають володіти внесками в схеми каналоспецифічного `describeMessageTool(...)`
для примітивів, відмінних від повідомлень, таких як реакції, прочитання та опитування.
Спільне подання надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів провайдера для кнопок, компонентів, блоків або карток.
Див. [Message Presentation](/uk/plugins/message-presentation), щоб ознайомитися з контрактом,
правилами резервного варіанта, зіставленням провайдерів і контрольним списком автора Plugin.

Plugin, здатні надсилати, оголошують те, що вони можуть відтворювати, через можливості повідомлень:

- `presentation` для семантичних блоків подання (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи відтворювати подання нативно, чи деградувати його до тексту.
Не відкривайте generic message tool через лазівки до native UI провайдера.
Застарілі helper-и SDK для старих native-схем лишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Визначення цілей каналу

Plugin каналів мають володіти семантикою цілей, специфічною для каналу. Зберігайте спільний
вихідний хост узагальненим і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід вважати `direct`, `group` чи `channel` до пошуку в каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  вхідні дані мають одразу перейти до визначення, схожого на id, замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є резервним варіантом Plugin, коли
  ядру потрібне фінальне визначення, що належить провайдеру, після нормалізації або після
  промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою route сесії, специфічною для провайдера,
  після того як ціль визначено.

Рекомендований розподіл:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають прийматися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок на кшталт "вважати це явним/native id цілі".
- Використовуйте `resolveTarget` як резервний варіант нормалізації, специфічний для провайдера, а не для
  широкого пошуку в каталозі.
- Зберігайте native-id провайдера, такі як chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в generic-полях SDK.

## Каталоги на основі конфігурації

Plugin, які виводять записи каталогу з конфігурації, мають зберігати цю логіку в
Plugin і повторно використовувати спільні helper-и з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі конфігурації, такі як:

- peer-и DM зі списку дозволених
- налаштовані мапи каналів/груп
- статичні резервні варіанти каталогу на рівні облікового запису

Спільні helper-и в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування лімітів
- видалення дублікатів/helper-и нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікового запису та нормалізація id, специфічні для каналу, мають залишатися
в реалізації Plugin.

## Каталоги провайдерів

Plugin провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє id моделей, специфічними для провайдера, типовими
значеннями base URL або метаданими моделей, обмеженими автентифікацією.

`catalog.order` керує тим, коли каталог Plugin об’єднується відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери на основі API-key або env
- `profile`: провайдери, які з’являються, коли існують профілі автентифікації
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі колізії ключів, тому Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш Plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися з помилкою, коли потрібних секретів бракує.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки відновлення doctor/config
  не повинні потребувати матеріалізації runtime-облікових даних лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Включайте поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про доступність у режимі лише читання. Повернення `tokenStatus: "available"` (і відповідного поля джерела) достатньо для команд на кшталт status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти "налаштовано, але недоступно в цьому шляху команди" замість аварійного завершення або помилкового повідомлення, що обліковий запис не налаштовано.

## Пакетні pack-и

Каталог Plugin може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен запис стає Plugin. Якщо pack містить кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує залежності npm, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися в межах каталогу Plugin
після визначення symlink. Записи, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності Plugin через
локальний для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані глобальні налаштування npm install.
Підтримуйте дерева залежностей Plugin "чистими JS/TS" і уникайте пакетів, яким потрібні
збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує поверхонь setup для вимкненого Plugin каналу або
коли Plugin каналу ввімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і setup легшими,
коли ваша основна точка входу Plugin також підключає інструменти, hooks або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести Plugin каналу на той самий шлях `setupEntry` під час
фази запуску gateway до `listen`, навіть коли канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що точка входу setup
має зареєструвати кожну можливість, що належить каналу, від якої залежить запуск, наприклад:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які методи gateway, інструменти або служби, які мають існувати в це саме вікно

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залишайте Plugin на типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати helper-и поверхні контракту лише для setup, які ядро
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно підвищити застарілу конфігурацію
каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повної точки входу Plugin.
Matrix — поточний вбудований приклад: він переносить лише auth/bootstrap-ключі в
іменований підвищений обліковий запис, коли іменовані облікові записи вже існують, і може
зберігати налаштований неканонічний ключ типового облікового запису замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери patch setup зберігають ліниве виявлення поверхні контракту вбудованих пакетів.
Час імпорту лишається малим; поверхня просування завантажується лише під час першого використання, а не через повторний вхід у запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску включають Gateway RPC methods, зберігайте їх на
префіксі, специфічному для Plugin. Простори назв admin ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо Plugin запитує вужчу область.

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

Plugin каналів можуть оголошувати метадані setup/discovery через `openclaw.channel` і
підказки щодо встановлення через `openclaw.install`. Це дозволяє ядру не містити даних каталогу.

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

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/status
- `docsLabel`: перевизначення тексту посилання для посилання на документацію
- `preferOver`: id Plugin/каналів нижчого пріоритету, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: засоби керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень форматування вихідних даних
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал із інтерактивних picker-ів setup/configure, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: додає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів відкривають
нормалізовані факти джерела встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти
визначають, чи є npm spec точною версією чи плаваючим селектором, чи присутні
очікувані метадані цілісності, і чи доступний також локальний шлях до джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності.
Вони також попереджають, коли `defaultChoice` є некоректним або вказує на джерело, яке
недоступне, і коли метадані цілісності npm присутні без коректного джерела npm.
Споживачі мають розглядати `installSource` як адитивне необов’язкове поле, щоб
записи, створені вручну, і shim-и каталогу не мусили його синтезувати.
Це дає змогу onboarding і діагностиці пояснювати стан площини джерела без
імпорту runtime Plugin.

Офіційні зовнішні записи npm мають віддавати перевагу точному `npmSpec` плюс
`expectedIntegrity`. Голі імена пакетів і dist-tag-и все ще працюють для
сумісності, але показують попередження площини джерела, щоб каталог міг
рухатися до інсталяцій із фіксованими версіями та перевіркою цілісності без порушення роботи наявних Plugin.
Коли onboarding встановлює з локального шляху каталогу, він записує керований запис індексу Plugin
із `source: "path"` і `sourcePath`, відносним до робочого простору, коли це можливо. Абсолютний робочий шлях завантаження залишається в
`plugins.load.paths`; запис інсталяції уникає дублювання локальних шляхів робочої станції
в довготривалій конфігурації. Це дозволяє діагностиці площини джерела бачити локальні інсталяції розробки без додавання другої поверхні розкриття сирого шляху файлової системи.
Збережений індекс Plugin `plugins/installs.json` є джерелом істини для джерела встановлення і може бути оновлений без завантаження runtime-модулів Plugin.
Його мапа `installRecords` є стійкою, навіть коли маніфест Plugin відсутній або
некоректний; його масив `plugins` — це відтворюване подання маніфесту/кешу.

## Plugin engine контексту

Plugin engine контексту володіють оркестрацією контексту сесії для поглинання, складання
та Compaction. Реєструйте їх зі свого Plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам’яті або hooks.

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

Якщо ваш engine **не** володіє алгоритмом Compaction, залиште `compact()`
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

Коли Plugin потребує поведінки, яка не вписується в поточний API, не обходьте
систему Plugin через приватне проникнення всередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політикою, резервним перемиканням, об’єднанням конфігурації,
   життєвим циклом, семантикою для каналів і формою runtime helper-а.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть ядро + споживачів каналів/функцій
   Канали та Plugin функцій мають споживати нову можливість через ядро,
   а не імпортувати реалізацію вендора безпосередньо.
4. зареєструйте реалізації вендора
   Потім Plugin вендорів реєструють свої backend-и щодо цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб володіння та форма реєстрації залишалися явними з часом.

Саме так OpenClaw лишається цілеспрямованим, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture),
щоб побачити конкретний контрольний список файлів і приклад реалізації.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має зачіпати такі
поверхні разом:

- типи контрактів ядра в `src/<capability>/types.ts`
- виконавець/helper runtime ядра в `src/<capability>/runtime.ts`
- поверхню реєстрації API Plugin у `src/plugins/types.ts`
- wiring реєстру Plugin у `src/plugins/registry.ts`
- runtime-експозицію Plugin у `src/plugins/runtime/*`, коли Plugin функцій/каналів
  мають її споживати
- helper-и capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документацію для операторів/Plugin у `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака того, що можливість
ще не повністю інтегровано.

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

- ядро володіє контрактом можливості + оркестрацією
- Plugin вендорів володіють реалізаціями вендорів
- Plugin функцій/каналів споживають runtime helper-и
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
