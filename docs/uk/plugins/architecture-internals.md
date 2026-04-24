---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні аспекти архітектури Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішні аспекти архітектури Plugin
x-i18n:
    generated_at: "2026-04-24T20:11:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4926ca8b020752da694749f8fc43a246c7f4499a404192408dfdc9611f721ebb
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм Plugin, а також контрактів
володіння/виконання, див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка є
довідником щодо внутрішньої механіки: конвеєра завантаження, реєстру, runtime-хуків,
HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє кореневі каталоги потенційних Plugin
2. зчитує маніфести нативних або сумісних пакетів і метадані пакетів
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. вирішує, чи вмикати кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незібрані нативні Plugin використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. надає реєстр поверхням команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це на тій самій стадії. Усі вбудовані Plugin використовують `register`; для нових Plugin слід надавати перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозрілим для невбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/placeholder-и Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або потоки провайдерів.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють реєстрацію runtime, `register(...)` або `setupEntry`.
Перші споживачі живої активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin, яким належить запитана основна команда
- налаштування каналу/визначення Plugin звужується до Plugin, яким належить
  запитаний id каналу
- явне визначення налаштування/runtime провайдера звужується до Plugin, яким належить
  запитаний id провайдера

Планувальник активації надає як API лише з id для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від запасного варіанта
володіння через маніфест, такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані Plugin продовжують працювати, тоді як новий код може виявляти широкі підказки
або запасну поведінку без зміни семантики завантаження runtime.

Виявлення налаштування тепер надає перевагу id, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити кандидатів Plugin, перш ніж воно повернеться до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки на етапі налаштування. Явне
`setup.requiresRuntime: false` є межею лише для дескриптора; пропущене
`requiresRuntime` зберігає застарілий запасний варіант `setup-api` для сумісності. Якщо більше
ніж один виявлений Plugin заявляє про той самий нормалізований id провайдера налаштування або
CLI backend, пошук налаштування відхиляє неоднозначного власника замість покладатися на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє про
розходження між `setup.providers` / `setup.cliBackends` і провайдерами або CLI
backend-ами, зареєстрованими через setup-api, не блокуючи застарілі Plugin.

### Що кешує завантажувач

OpenClaw зберігає короткоживучі кеші в межах процесу для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin

Ці кеші зменшують сплески навантаження під час запуску та накладні витрати на повторні команди. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як сховище.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні об’єкти ядра. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- CLI-реєстратори
- фонові сервіси
- команди, що належать Plugin

Потім можливості ядра зчитують дані з цього реєстру замість прямої взаємодії з модулями Plugin.
Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для зручності підтримки. Воно означає, що більшості поверхонь ядра потрібна
лише одна точка інтеграції: «прочитати реєстр», а не «окремо обробляти кожен модуль Plugin».

## Колбеки прив’язування розмов

Plugin, які прив’язують розмову, можуть реагувати, коли погодження завершено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати колбек після того, як запит на прив’язування буде схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Для цього Plugin + розмови тепер існує прив’язування.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистіть будь-який локальний стан очікування.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля корисного навантаження колбека:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: вирішене прив’язування для схвалених запитів
- `request`: підсумок початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей колбек призначений лише для сповіщення. Він не змінює, хто має право прив’язувати
розмову, і виконується після завершення обробки погодження ядром.

## Runtime-хуки провайдера

Plugin провайдерів мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime:
  `setup.providers[].envVars`, застарілий сумісний `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків для auth, визначення моделі,
  обгортання потоку, рівнів thinking, політики повторного відтворення та
  кінцевих точок usage. Повний список див. у [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw, як і раніше, відповідає за загальний цикл агента, failover, обробку transcript і
політику інструментів. Ці хуки є поверхнею розширення для поведінки, специфічної для провайдера,
без потреби в цілком власному транспорті inference.

Використовуйте маніфест `setup.providers[].envVars`, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` усе ще зчитується
адаптером сумісності протягом періоду знецінення, а невбудовані Plugin,
які його використовують, отримують діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один id провайдера має повторно використовувати env vars, профілі auth,
auth на основі конфігурації та варіант onboarding API-ключа іншого id провайдера. Використовуйте маніфест
`providerAuthChoices`, коли поверхні CLI onboarding/вибору auth мають знати
id вибору провайдера, мітки груп і просте auth-підключення з одним прапорцем без
завантаження runtime провайдера. Залишайте runtime
`envVars` провайдера для підказок, орієнтованих на операторів, таких як мітки onboarding або змінні
налаштування OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування на основі env, які
загальний запасний варіант shell-env, перевірки config/status або запити налаштування мають бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для Plugin моделей/провайдерів OpenClaw викликає хуки приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий довідник для вибору.

| #   | Хук                               | Що він робить                                                                                                   | Коли використовувати                                                                                                                           |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                           | Провайдер володіє каталогом або типовими значеннями `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                      |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                    | _(не є хуком Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                              | Провайдер володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                    |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдерів перед загальним збиранням моделі                             | Провайдер володіє очищенням транспорту для користувацьких id провайдерів у тому самому сімействі транспортів                                  |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                         | Провайдеру потрібне очищення конфігурації, яке має бути в Plugin; вбудовані помічники сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи native streaming-usage до конфігурацій провайдерів                                 | Провайдеру потрібні виправлення метаданих native streaming usage, керовані кінцевими точками                                                  |
| 7   | `resolveConfigApiKey`             | Визначає auth з env-marker для конфігурацій провайдерів до завантаження runtime auth                            | Провайдер має власне визначення API-ключа через env-marker; `amazon-bedrock` також має тут вбудований AWS-резолвер env-marker                |
| 8   | `resolveSyntheticAuth`            | Показує локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту                 | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth-профілі, що належать провайдеру; типове значення `persistence` — `runtime-only` для облікових даних CLI/додатка | Провайдер повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені заповнювачі синтетичних профілів нижче auth на основі env/конфігурації                       | Провайдер зберігає синтетичні профілі-заповнювачі, які не повинні мати вищий пріоритет                                                        |
| 11  | `resolveDynamicModel`             | Синхронний запасний варіант для id моделей провайдера, яких ще немає в локальному реєстрі                      | Провайдер приймає довільні id моделей від зовнішнього джерела                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                           |
| 13  | `normalizeResolvedModel`          | Остаточний перезапис перед тим, як вбудований runner використовує визначену модель                              | Провайдеру потрібні перезаписи транспорту, але він усе ще використовує транспорт ядра                                                          |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей постачальника за іншим сумісним транспортом                                   | Провайдер розпізнає власні моделі на проксі-транспортах, не перебираючи на себе роль провайдера                                               |
| 15  | `capabilities`                    | Метадані transcript/інструментів, що належать провайдеру та використовуються спільною логікою ядра             | Провайдеру потрібні особливості transcript/сімейства провайдерів                                                                               |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований runner                                         | Провайдеру потрібне очищення схем для сімейства транспортів                                                                                    |
| 17  | `inspectToolSchemas`              | Показує діагностику схем, що належить провайдеру, після нормалізації                                            | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: native чи tagged                                                             | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                    | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                                |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                      | Провайдеру потрібен власний wire protocol, а не просто обгортка                                                                                |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Провайдеру потрібні обгортки сумісності заголовків/тіла запиту/моделі без власного транспорту                                                |
| 22  | `resolveTransportTurnState`       | Прикріплює native-заголовки або метадані транспорту для кожного ходу                                            | Провайдер хоче, щоб загальні транспорти надсилали native-ідентичність ходу, специфічну для провайдера                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Прикріплює native-заголовки WebSocket або політику охолодження сесії                                            | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику запасного варіанта                                     |
| 24  | `formatApiKey`                    | Форматувач auth-профілю: збережений профіль стає рядком runtime `apiKey`                                        | Провайдер зберігає додаткові метадані auth і потребує власної форми runtime-токена                                                            |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для користувацьких кінцевих точок refresh або політики збоїв refresh              | Провайдер не відповідає спільним refresher-ам `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається, коли збій стається під час OAuth refresh                                | Провайдеру потрібні власні вказівки щодо відновлення auth після збою refresh                                                                  |
| 27  | `matchesContextOverflowError`     | Матчер переповнення context window, що належить провайдеру                                                      | Провайдер має сирі помилки переповнення, які загальні евристики не помічають                                                                  |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить провайдеру                                                            | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/overload тощо                                                              |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для проксі/backhaul-провайдерів                                                           | Провайдеру потрібне керування TTL кешу, специфічне для проксі                                                                                  |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення про відсутній auth                                                               | Провайдеру потрібна підказка відновлення після відсутнього auth, специфічна для провайдера                                                    |
| 31  | `suppressBuiltInModel`            | Приховування застарілих моделей зовнішнього джерела плюс необов’язкова підказка помилки для користувача        | Провайдеру потрібно приховати застарілі рядки зовнішнього джерела або замінити їх підказкою постачальника                                     |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                      | Провайдеру потрібні синтетичні рядки прямої сумісності в `models list` і засобах вибору                                                       |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                              | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                  |
| 34  | `isBinaryThinking`                | Хук сумісності для перемикача reasoning увімк./вимк.                                                            | Провайдер підтримує лише двійкове thinking: увімк./вимк.                                                                                       |
| 35  | `supportsXHighThinking`           | Хук сумісності для підтримки reasoning `xhigh`                                                                  | Провайдер хоче мати `xhigh` лише для підмножини моделей                                                                                        |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності для типового рівня `/think`                                                                      | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                             |
| 37  | `isModernModelRef`                | Матчер сучасних моделей для фільтрів live-профілів і вибору smoke                                              | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference               | Провайдеру потрібен обмін токена або короткоживучі облікові дані запиту                                                                        |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов’язаних поверхонь статусу                               | Провайдеру потрібен користувацький розбір usage/quota-токена або інші облікові дані usage                                                     |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки usage/quota, специфічні для провайдера, після визначення auth                     | Провайдеру потрібна кінцева точка usage або парсер корисного навантаження, специфічні для провайдера                                          |
| 41  | `createEmbeddingProvider`         | Створює адаптер embedding, що належить провайдеру, для memory/search                                           | Поведінка memory embedding має належати Plugin провайдера                                                                                      |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою transcript для провайдера                                         | Провайдеру потрібна користувацька політика transcript (наприклад, видалення блоків thinking)                                                  |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                   | Провайдеру потрібні специфічні для провайдера перезаписи replay понад спільні помічники Compaction                                           |
| 44  | `validateReplayTurns`             | Остаточна перевірка або переформування ходів replay перед вбудованим runner                                    | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санітизації                                                            |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать провайдеру                                             | Провайдеру потрібна телеметрія або стан провайдера, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім послідовно переходять до інших Plugin провайдерів,
які підтримують хуки, доки один із них справді не змінить id моделі або transport/config. Це зберігає
працездатність shim-ів alias/compat провайдерів без потреби, щоб викликач знав, який саме
вбудований Plugin володіє цим перезаписом. Якщо жоден хук провайдера не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе одно застосує
це сумісне очищення.

Якщо провайдеру потрібен повністю користувацький wire protocol або користувацький виконавець запитів,
це вже інший клас розширення. Ці хуки призначені для поведінки провайдера, яка
все ще працює в межах звичайного циклу inference OpenClaw.

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

Вбудовані Plugin провайдерів поєднують наведені вище хуки відповідно до потреб кожного постачальника щодо каталогу,
auth, thinking, replay і usage. Авторитетний набір хуків розміщується разом
з кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогів із наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати id
    моделей із зовнішнього джерела раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і кінцевих точок usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією з `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають змогу провайдерам підключати
    політику transcript через `buildReplayPolicy`, замість того щоб кожен Plugin
    заново реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише каталогу">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють у спільному циклі inference.
  </Accordion>
  <Accordion title="Допоміжні stream-інструменти, специфічні для Anthropic">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` розміщені всередині
    публічного seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-помічники

Plugin можуть отримувати доступ до окремих помічників ядра через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайне корисне навантаження виводу TTS ядра для поверхонь файлів/голосових повідомлень.
- Використовує конфігурацію ядра `messages.tts` і вибір провайдера.
- Повертає PCM-аудіобуфер + частоту дискретизації. Plugin мають самі виконувати ресемплінг/кодування для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для засобів вибору голосів або потоків налаштування, що належать постачальнику.
- Списки голосів можуть містити багатші метадані, такі як locale, стать і теги характеру для засобів вибору, обізнаних про провайдера.
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

- Зберігайте політику TTS, запасний варіант і доставку відповіді в ядрі.
- Використовуйте провайдерів мовлення для поведінки синтезу, що належить постачальнику.
- Застарілий ввід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння орієнтована на компанію: один Plugin постачальника може керувати
  текстовими, мовленнєвими, графічними та майбутніми медіапровайдерами в міру того, як OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin реєструють один типізований
media-understanding-провайдер замість узагальненого набору ключ/значення:

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

- Зберігайте оркестрацію, запасний варіант, конфігурацію і прив’язку каналів у ядрі.
- Зберігайте поведінку постачальника в Plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - ядро володіє контрактом можливості та runtime-помічником
  - Plugin постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin можливостей/каналів використовують `api.runtime.videoGeneration.*`

Для runtime-помічників media-understanding Plugin можуть викликати:

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

Для транскрибування аудіо Plugin можуть використовувати або runtime
media-understanding, або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов’язково, коли MIME не вдається надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо media-understanding ядра (`tools.media.audio`) і порядок запасних варіантів провайдерів.
- Повертає `{ text: undefined }`, коли вихід транскрибування не створено (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності.

Plugin також можуть запускати фонові виконання субагента через `api.runtime.subagent`:

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
- Для запасних запусків, що належать Plugin, оператори мають явно ввімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски субагента від недовірених Plugin усе ще працюють, але запити на перевизначення відхиляються, а не тихо переходять до запасного варіанта.

Для вебпошуку Plugin можуть використовувати спільний runtime-помічник замість
прямого доступу до прив’язки інструмента агента:

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
- Використовуйте провайдерів вебпошуку для транспортів пошуку, специфічних для постачальника.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для Plugin можливостей/каналів, яким потрібна поведінка пошуку без залежності від обгортки інструмента агента.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка провайдерів генерації зображень.
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

Plugin можуть відкривати HTTP-ендпоінти за допомогою `api.registerHttpRoute(...)`.

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
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайний auth gateway, або `"plugin"` для auth/перевірки webhook, якими керує Plugin.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: поверніть `true`, якщо маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` вилучено, і він спричинить помилку завантаження Plugin. Замість нього використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Маршрути, що перекриваються та мають різні рівні `auth`, відхиляються. Залишайте ланцюги проходження `exact`/`prefix` лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично області доступу runtime оператора. Вони призначені для webhook/перевірки підписів, якими керує Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` працюють у межах області runtime запиту Gateway, але ця область навмисно консервативна:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує області runtime маршруту Plugin на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, область runtime повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з auth gateway є неявною поверхнею адміністратора. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk`, коли створюєте нові Plugin. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Помічники входу/побудови каналу                    |
| `openclaw/plugin-sdk/core`          | Загальні спільні помічники та umbrella-контракт    |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Plugin каналів вибирають із сімейства вузьких seam-ів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погодження слід консолідувати
в одному контракті `approvalCapability`, а не змішувати між не пов’язаними
полями Plugin. Див. [Plugin каналів](/uk/plugins/sdk-channel-plugins).

Runtime- і config-помічники розміщуються у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` застарів — це shim сумісності для
старіших Plugin. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (для кореня кожного пакета вбудованого Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel помічників/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу Plugin налаштування

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin з ядра або з іншого Plugin.
Точки входу, завантажені через facade, надають перевагу активному знімку конфігурації runtime, якщо він
існує, а потім повертаються до визначеного файла конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують тому, що вбудовані Plugin уже використовують їх сьогодні. Вони не є
автоматично зовнішніми контрактами, назавжди зафіксованими на довгий термін — перегляньте
відповідну довідкову сторінку SDK, якщо покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin мають володіти внесками до схем `describeMessageTool(...)`, специфічних для каналів,
для немеседжевих примітивів, таких як реакції, прочитання й опитування.
Спільне подання надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів кнопок, компонентів, блоків або карток, специфічних для провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
правил запасного варіанта, зіставлення провайдерів і контрольного списку автора Plugin.

Plugin, здатні надсилати повідомлення, оголошують, що саме вони можуть рендерити, через можливості повідомлень:

- `presentation` для семантичних блоків подання (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи рендерити подання нативно, чи деградувати його до тексту.
Не відкривайте шлюзи до native UI, специфічного для провайдера, із загального
інструмента повідомлень. Застарілі помічники SDK для legacy native-схем і далі експортуються для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Визначення цільового каналу

Plugin каналів мають володіти семантикою цілей, специфічною для каналів. Зберігайте спільний
вихідний хост узагальненим і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в директорії.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  слід одразу перейти до визначення за схожістю з id замість пошуку в директорії.
- `messaging.targetResolver.resolveTarget(...)` — це запасний варіант Plugin, коли
  ядру потрібне остаточне визначення, що належить провайдеру, після нормалізації або після
  промаху в директорії.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сеансу,
  специфічною для провайдера, після того як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають ухвалюватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок на кшталт «трактувати це як явний/native id цілі».
- Використовуйте `resolveTarget` для специфічного для провайдера запасного варіанта нормалізації, а не для
  широкого пошуку в директорії.
- Зберігайте native-id провайдера, такі як chat id, thread id, JID, handle та room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в загальних полях SDK.

## Директорії на основі конфігурації

Plugin, які виводять записи директорії з конфігурації, мають зберігати цю логіку в
Plugin і повторно використовувати спільні помічники з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі конфігурації, наприклад:

- DM peer-и, керовані allowlist
- налаштовані відображення каналів/group
- статичні запасні варіанти директорії в межах облікового запису

Спільні помічники в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування обмежень
- помічники дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікового запису та нормалізація id, специфічні для каналу, мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Plugin провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли Plugin володіє id моделей, специфічними для провайдера, типовими
значеннями base URL або метаданими моделей, керованими auth.

`catalog.order` визначає, коли каталог Plugin зливається відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: прості провайдери з API-ключем або env
- `profile`: провайдери, які з’являються, коли існують auth-профілі
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі конфлікту ключів, тож Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Канал лише для читання: перевірка стану

Якщо ваш Plugin реєструє канал, краще реалізувати
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і може швидко завершитися з помилкою, якщо потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/config
  repair, не повинні потребувати матеріалізації облікових даних runtime лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- Додає поля джерела/статусу облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення токенів лише для повідомлення про доступність лише для читання.
  Достатньо повернути `tokenStatus: "available"` (і відповідне поле
  джерела) для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

## Пакетні набори

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

Кожен запис стає Plugin. Якщо набір містить кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися в межах каталогу Plugin
після визначення symlink. Записи, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності Plugin за допомогою
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev-залежностей у runtime). Підтримуйте дерева залежностей Plugin
«чистими JS/TS» й уникайте пакетів, які потребують збирання через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на полегшений модуль лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого Plugin каналу або
коли Plugin каналу ввімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і налаштування легшими,
коли основна точка входу Plugin також підключає інструменти, хуки або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести Plugin каналу на той самий шлях `setupEntry` під час фази
запуску gateway до початку прослуховування, навіть якщо канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу налаштування
має реєструвати всі можливості, що належать каналу й від яких залежить запуск, зокрема:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне прослуховування
- будь-які методи gateway, інструменти або сервіси, які мають існувати в це саме вікно часу

Якщо ваша повна точка входу все ще володіє будь-якою обов’язковою можливістю запуску, не вмикайте
цей прапорець. Залиште для Plugin типову поведінку й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати помічники contract-surface лише для налаштування, які ядро
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування налаштування така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу з одним обліковим записом
у `channels.<id>.accounts.*` без завантаження повної точки входу Plugin.
Matrix — поточний вбудований приклад: він переміщує лише ключі auth/bootstrap до
іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і може
зберігати налаштований неканонічний ключ облікового запису за замовчуванням, замість того щоб завжди створювати
`accounts.default`.

Ці адаптери латок налаштування зберігають discovery вбудованої contract-surface лінивим. Час імпорту залишається легким; поверхня
просування завантажується лише під час першого використання, а не через повторний вхід у запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску містять Gateway RPC-методи, зберігайте їх на
префіксі, специфічному для Plugin. Простори імен адміністратора ядра (`config.*`,
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

### Метадані каталогу каналів

Plugin каналів можуть оголошувати метадані налаштування/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дає змогу ядру не містити даних каталогу.

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
      "blurb": "Self-hosted чат через webhook-ботів Nextcloud Talk.",
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
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: id Plugin/каналів нижчого пріоритету, які цей запис каталогу має перевершувати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування копією поверхні вибору
- `markdownCapable`: позначає канал як такий, що підтримує markdown, для рішень щодо форматування вихідних повідомлень
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору налаштування/конфігурації, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть якщо існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в один із таких шляхів:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів відкривають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Ці
нормалізовані факти вказують, чи є npm-специфікація точною версією або плаваючим
селектором, чи присутні очікувані метадані цілісності, і чи також доступний локальний
шлях до джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти
попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності.
Вони також попереджають, коли `defaultChoice` недійсний або вказує на джерело, яке
недоступне, і коли метадані цілісності npm присутні без дійсного джерела
npm. Споживачі повинні трактувати `installSource` як адитивне необов’язкове поле, щоб
старішим вручну створеним записам і shim-ам сумісності не доводилося його синтезувати.
Це дає змогу onboarding і діагностиці пояснювати стан площини джерел без
імпорту runtime Plugin.

Офіційні зовнішні записи npm мають надавати перевагу точному `npmSpec` разом із
`expectedIntegrity`. Голі імена пакетів і dist-tag-и все ще працюють для
сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися
до зафіксованих, перевірених за цілісністю встановлень без порушення роботи наявних Plugin.
Коли onboarding встановлює з локального шляху каталогу, він записує
запис `plugins.installs` із `source: "path"` і шляхом `sourcePath`, відносним до workspace,
коли це можливо. Абсолютний операційний шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції
в довготривалій конфігурації. Це зберігає локальні встановлення для розробки видимими для
діагностики площини джерел без додавання другої сирої поверхні розкриття шляхів файлової системи.

## Plugin рушія контексту

Plugin рушія контексту володіють оркестрацією контексту сесії для ingest, assembly
і Compaction. Реєструйте їх зі свого Plugin за допомогою
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у memory або хуки.

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

Якщо ваш рушій **не** володіє алгоритмом Compaction, залиште `compact()`
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
систему Plugin через приватне глибоке звернення. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політика, запасний варіант, злиття конфігурації,
   життєвий цикл, семантика для каналів і форма runtime-помічника.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть ядро + споживачів каналів/можливостей
   Канали й Plugin можливостей мають використовувати нову можливість через ядро,
   а не імпортувати реалізацію постачальника безпосередньо.
4. зареєструйте реалізації постачальників
   Потім Plugin постачальників реєструють свої backend-и для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб володіння та форма реєстрації з часом залишалися явними.

Саме так OpenClaw залишається принциповим, не перетворюючись на жорстко
закодований продукт під світогляд одного провайдера. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і готового прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом зачіпати такі
поверхні:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/runtime-помічник ядра в `src/<capability>/runtime.ts`
- поверхню реєстрації API Plugin в `src/plugins/types.ts`
- підключення реєстру Plugin в `src/plugins/registry.ts`
- відкриття runtime Plugin у `src/plugins/runtime/*`, коли Plugin можливостей/каналів
  мають її використовувати
- помічники capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документацію для операторів/Plugin у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
ще не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// контракт ядра
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// спільний runtime-помічник для Plugin можливостей/каналів
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Покажи робота, що йде лабораторією.",
  cfg,
});
```

Шаблон тесту контракту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- ядро володіє контрактом можливості + оркестрацією
- Plugin постачальників володіють реалізаціями постачальників
- Plugin можливостей/каналів використовують runtime-помічники
- тести контрактів зберігають володіння явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель і форми можливостей
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
