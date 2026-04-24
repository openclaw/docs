---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакунків пакетів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні компоненти архітектури Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішні компоненти архітектури Plugin
x-i18n:
    generated_at: "2026-04-24T03:06:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 243ccb0cb5b55c4ba08ac387f5b19949391b3a4f1772f6d7ac889f3d8f548a47
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Для публічної моделі можливостей, форм Plugin і контрактів
власності/виконання дивіться [Plugin architecture](/uk/plugins/architecture). Ця сторінка є
довідником із внутрішньої механіки: конвеєр завантаження, реєстр, runtime-хуки,
HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє кореневі каталоги потенційних Plugin
2. зчитує маніфести native або сумісних bundle і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи увімкнений кожен кандидат
6. завантажує увімкнені native-модулі: зібрані bundled-модулі використовують native loader;
   незібрані native Plugin використовують jiti
7. викликає native-хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. робить реєстр доступним для поверхонь команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це на тому самому етапі. Усі bundled Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** runtime-виконання. Кандидати блокуються,
коли entry виходить за межі кореня Plugin, шлях є доступним для запису всім, або
власність шляху виглядає підозріло для не-bundled Plugin.

### Поведінка manifest-first

Маніфест є джерелом істини control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості bundle
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/placeholder-и в Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для native Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, tools, commands або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише метадані-дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі live-активації тепер використовують підказки маніфесту для command, channel і provider,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin, яким належить запитана основна command
- розв’язання setup/Plugin каналу звужується до Plugin, яким належить запитаний
  id каналу
- явне розв’язання setup/runtime провайдера звужується до Plugin, яким належить
  запитаний id провайдера

Виявлення setup тепер надає перевагу id, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити перелік кандидатів Plugin, перш ніж перейти до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки під час setup. Якщо більше ніж
один виявлений Plugin заявляє однаковий нормалізований id провайдера setup або CLI backend,
пошук setup відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення.

### Що кешує завантажувач

OpenClaw зберігає короткоживучі внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- реєстрів завантажених Plugin

Ці кеші зменшують пікові витрати під час запуску та накладні витрати від повторних команд. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як механізм збереження стану.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштуйте вікна кешу за допомогою `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні змінні core. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- commands, що належать Plugin

Потім функції core читають із цього реєстру замість того, щоб звертатися до модулів Plugin
напряму. Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime core -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь core
потрібна лише одна точка інтеграції: «прочитати реєстр», а не
«робити спеціальний випадок для кожного модуля Plugin».

## Колбеки прив’язування розмов

Plugin, які прив’язують розмову, можуть реагувати, коли погодження завершено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати колбек після того,
як запит на прив’язування схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Тепер для цього Plugin + розмови існує прив’язування.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистіть будь-який локальний очікувальний стан.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля payload колбека:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: розв’язане прив’язування для схвалених запитів
- `request`: підсумок початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей колбек призначений лише для сповіщення. Він не змінює, хто має право прив’язувати
розмову, і виконується після завершення обробки погодження в core.

## Runtime-хуки провайдера

Plugin провайдера мають три шари:

- **Метадані маніфесту** для дешевого lookup до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застаріле `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, розв’язання моделей,
  обгортання stream, рівні thinking, політику replay та usage endpoints. Див.
  повний список у [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw, як і раніше, відповідає за загальний цикл агента, failover, обробку транскриптів і
політику tools. Ці hooks є поверхнею розширення для поведінки, специфічної для провайдера,
без потреби у повністю власному transport інференсу.

Використовуйте `providerAuthEnvVars` у маніфесті, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime Plugin.
Використовуйте `providerAuthAliases` у маніфесті, коли один id провайдера має повторно використовувати
env vars, профілі auth, auth на основі конфігурації та варіант онбордингу API-ключа
іншого id провайдера. Використовуйте `providerAuthChoices` у маніфесті, коли поверхні CLI
онбордингу/вибору auth повинні знати id варіанта провайдера, мітки груп та просте
підключення auth через один прапорець без завантаження runtime провайдера. Залишайте runtime
`envVars` провайдера для операторських підказок, таких як мітки онбордингу або змінні
налаштування OAuth client-id/client-secret.

Використовуйте `channelEnvVars` у маніфесті, коли канал має auth або setup, що керуються env,
які загальні fallback-и shell-env, перевірки config/status або підказки setup повинні бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для Plugin моделі/провайдера OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» є коротким орієнтиром для вибору.

| #   | Хук                               | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                         | Провайдер володіє каталогом або типовими значеннями `base URL`                                                                                |
| 2   | `applyConfigDefaults`             | Застосовує типові глобальні значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                     |
| --  | _(вбудований lookup моделі)_      | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                       | _(не є хуком Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми `model-id` перед lookup                                            | Провайдер володіє очищенням псевдонімів до канонічного розв’язання моделі                                                                     |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                            | Провайдер володіє очищенням transport для власних id провайдера в межах того самого сімейства transport                                      |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв’язанням runtime/провайдера                                       | Провайдеру потрібне очищення конфігурації, яке має жити разом із Plugin; також допоміжні засоби bundled сімейства Google підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування native streaming-usage до провайдерів конфігурації                             | Провайдеру потрібні виправлення метаданих native streaming usage, зумовлені endpoint                                                         |
| 7   | `resolveConfigApiKey`             | Розв’язує auth через env-marker для провайдерів конфігурації до завантаження runtime auth                      | Провайдер має власне розв’язання API-ключа через env-marker; `amazon-bedrock` також має тут вбудований AWS-розв’язувач env-marker           |
| 8   | `resolveSyntheticAuth`            | Виводить локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту               | Провайдер може працювати із synthetic/local маркером облікових даних                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі auth, що належать провайдеру; типове значення `persistence` — `runtime-only` для облікових даних CLI/app | Провайдер повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic placeholder-профілів порівняно з auth на основі env/конфігурації        | Провайдер зберігає synthetic placeholder-профілі, які не повинні мати вищий пріоритет                                                        |
| 11  | `resolveDynamicModel`             | Синхронний fallback для id моделей провайдера, яких ще немає в локальному реєстрі                             | Провайдер приймає довільні id моделей від upstream                                                                                            |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                       | Провайдеру потрібні мережеві метадані перед розв’язанням невідомих id                                                                         |
| 13  | `normalizeResolvedModel`          | Остаточне переписування перед тим, як вбудований runner використає розв’язану модель                           | Провайдеру потрібні переписування transport, але він усе ще використовує core transport                                                      |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для vendor-моделей за іншим сумісним transport                                           | Провайдер розпізнає власні моделі на proxy transport без перехоплення керування провайдером                                                  |
| 15  | `capabilities`                    | Метадані транскрипту/інструментів, що належать провайдеру та використовуються спільною логікою core           | Провайдеру потрібні особливості транскрипту/сімейства провайдера                                                                              |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми tools до того, як їх побачить вбудований runner                                               | Провайдеру потрібне очищення схем для сімейства transport                                                                                     |
| 17  | `inspectToolSchemas`              | Показує діагностику схем, що належить провайдеру, після нормалізації                                           | Провайдер хоче попередження щодо ключових слів без додавання в core правил, специфічних для провайдера                                       |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт виводу reasoning                                                             | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                        |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів stream                                   | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним transport                                                       | Провайдеру потрібен власний wire protocol, а не просто обгортка                                                                               |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних обгорток                                                          | Провайдеру потрібні обгортки заголовків/тіла запиту/compat моделі без власного transport                                                     |
| 22  | `resolveTransportTurnState`       | Додає native заголовки або метадані transport для кожного turn                                                 | Провайдер хоче, щоб загальні transport надсилали native ідентичність turn провайдера                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native заголовки WebSocket або політику cool-down сесії                                                  | Провайдер хоче, щоб загальні WS transport налаштовували заголовки сесії або fallback-політику                                                |
| 24  | `formatApiKey`                    | Форматувач профілю auth: збережений профіль стає runtime-рядком `apiKey`                                       | Провайдер зберігає додаткові метадані auth і потребує власну форму runtime-токена                                                            |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для власних endpoint refresh або політики помилки refresh                         | Провайдер не відповідає спільним засобам refresh `pi-ai`                                                                                      |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли OAuth refresh не вдається                                             | Провайдеру потрібні власні інструкції з відновлення auth після помилки refresh                                                                |
| 27  | `matchesContextOverflowError`     | Matcher переповнення контекстного вікна, що належить провайдеру                                                | Провайдер має сирі помилки переповнення, які загальні евристики можуть пропустити                                                            |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить провайдеру                                                           | Провайдер може зіставляти сирі API/transport-помилки з rate-limit/overload тощо                                                              |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                           | Провайдеру потрібне специфічне для proxy керування TTL кешу                                                                                   |
| 30  | `buildMissingAuthMessage`         | Замінник загального повідомлення відновлення при відсутньому auth                                              | Провайдеру потрібна специфічна для провайдера підказка відновлення при відсутньому auth                                                      |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей плюс необов’язкова підказка помилки для користувача                  | Провайдеру потрібно приховати застарілі рядки upstream або замінити їх підказкою постачальника                                               |
| 32  | `augmentModelCatalog`             | Synthetic/остаточні рядки каталогу, додані після виявлення                                                    | Провайдеру потрібні synthetic-рядки прямої сумісності в `models list` і засобах вибору                                                       |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                             | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                 |
| 34  | `isBinaryThinking`                | Compat-хук перемикача reasoning увімк./вимк.                                                                   | Провайдер підтримує thinking лише як двійкове увімк./вимк.                                                                                    |
| 35  | `supportsXHighThinking`           | Compat-хук підтримки reasoning `xhigh`                                                                         | Провайдер хоче `xhigh` лише для частини моделей                                                                                               |
| 36  | `resolveDefaultThinkingLevel`     | Compat-хук типового рівня `/think`                                                                             | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                            |
| 37  | `isModernModelRef`                | Matcher modern-моделей для live-фільтрів профілів і вибору smoke                                               | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед інференсом              | Провайдеру потрібен обмін токена або короткоживучі облікові дані запиту                                                                       |
| 39  | `resolveUsageAuth`                | Розв’язує облікові дані usage/billing для `/usage` і пов’язаних поверхонь статусу                              | Провайдеру потрібен власний розбір токена usage/quota або інші облікові дані usage                                                           |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки usage/quota, специфічні для провайдера, після розв’язання auth                    | Провайдеру потрібен специфічний для провайдера endpoint usage або парсер payload                                                              |
| 41  | `createEmbeddingProvider`         | Створює адаптер embedding, що належить провайдеру, для пам’яті/пошуку                                          | Поведінка embedding для пам’яті належить Plugin провайдера                                                                                    |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою транскрипту для провайдера                                        | Провайдеру потрібна власна політика транскрипту (наприклад, видалення блоків thinking)                                                       |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення транскрипту                                                 | Провайдеру потрібні специфічні для провайдера переписування replay понад спільні допоміжні засоби Compaction                                 |
| 44  | `validateReplayTurns`             | Остаточна валідація або переформування turn replay перед вбудованим runner                                     | Transport провайдера потребує суворішої валідації turn після загального очищення                                                             |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору, що належать провайдеру                                                    | Провайдеру потрібна телеметрія або стан, що належить провайдеру, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім переходять до інших Plugin провайдерів, що підтримують hooks,
доки один із них фактично не змінить id моделі або transport/config. Це зберігає
працездатність alias/compat-шарів провайдера без вимоги, щоб викликальник знав, який
bundled Plugin володіє цим переписуванням. Якщо жоден хук провайдера не переписує підтримуваний
запис конфігурації сімейства Google, bundled normalizer конфігурації Google все одно застосовує
це очищення сумісності.

Якщо провайдеру потрібен повністю власний wire protocol або власний виконавець запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки провайдера, яка
все ще працює на звичайному циклі інференсу OpenClaw.

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

Bundled Plugin провайдерів поєднують наведені вище hooks, щоб відповідати потребам кожного постачальника щодо каталогу,
auth, thinking, replay і usage. Авторитетний набір hooks зберігається разом із
кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Pass-through провайдери каталогу">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    id моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay та очищення транскриптів">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики транскриптів через `buildReplayPolicy` замість того, щоб кожен Plugin
    наново реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише каталогу">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл інференсу.
  </Accordion>
  <Accordion title="Специфічні для Anthropic допоміжні засоби stream">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` розміщені в
    публічному шві `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-допоміжні засоби

Plugin можуть отримувати доступ до вибраних допоміжних засобів core через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу core TTS для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію core `messages.tts` і вибір провайдера.
- Повертає PCM audio buffer + частоту дискретизації. Plugin мають виконати ресемплінг/кодування для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для засобів вибору голосу або потоків setup, що належать постачальнику.
- Списки голосів можуть містити багатші метадані, такі як локаль, стать і теги характеру, для засобів вибору, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

Plugin також можуть реєструвати speech-провайдерів через `api.registerSpeechProvider(...)`.

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

- Зберігайте політику TTS, fallback і доставку відповіді в core.
- Використовуйте speech-провайдерів для поведінки синтезу, що належить постачальнику.
- Застарілий вхід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння є орієнтованою на компанію: один Plugin постачальника може володіти
  текстовими, мовленнєвими, графічними та майбутніми медіапровайдерами в міру того, як OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin реєструють одного типізованого
провайдера розуміння медіа замість універсального набору ключ/значення:

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

- Зберігайте orchestration, fallback, config і підключення каналів у core.
- Зберігайте поведінку постачальника в Plugin провайдера.
- Розширення шляхом додавання має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується тієї самої моделі:
  - core володіє контрактом можливості та runtime-допоміжним засобом
  - Plugin постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime-допоміжних засобів розуміння медіа Plugin можуть викликати:

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
або старий псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов’язково, коли MIME не вдається надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` є бажаною спільною поверхнею для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію audio для розуміння медіа в core (`tools.media.audio`) і порядок fallback провайдерів.
- Повертає `{ text: undefined }`, коли результат транскрипції не створено (наприклад, через пропущений/непідтримуваний вхід).
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
- OpenClaw враховує ці поля перевизначення лише для довірених викликальників.
- Для fallback-запусків, що належать Plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"` для явного дозволу будь-якої цілі.
- Запуски субагента з недовірених Plugin також працюють, але запити на перевизначення відхиляються замість тихого fallback.

Для вебпошуку Plugin можуть використовувати спільний runtime-допоміжний засіб замість
прямого доступу до підключення інструмента агента:

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

- Зберігайте вибір провайдера, розв’язання облікових даних і спільну семантику запитів у core.
- Використовуйте провайдерів вебпошуку для специфічних для постачальника transport пошуку.
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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка провайдерів генерації зображень.
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

Plugin можуть відкривати HTTP endpoint-и за допомогою `api.registerHttpRoute(...)`.

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
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/Webhook-перевірки, якими керує Plugin.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертає `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin повинні явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Залишайте ланцюжки fallthrough `exact`/`prefix` лише на одному рівні `auth`.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-scopes оператора. Вони призначені для Webhook-ів/перевірки підписів, якими керує Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-scopes маршруту Plugin зафіксованими на `operator.write`, навіть якщо викликальник надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентифікацією (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентифікацією, runtime scope повертається до `operator.write`
- Практичне правило: не вважайте маршрут Plugin із gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентифікацією та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk` під час створення нових Plugin. Підшляхи core:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core` | Допоміжні засоби entry/build для каналів           |
| `openclaw/plugin-sdk/core`         | Загальні спільні допоміжні засоби та umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Коренева схема Zod `openclaw.json` (`OpenClawSchema`) |

Plugin каналів обирають із сімейства вузьких швів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погодження слід консолідувати
в одному контракті `approvalCapability`, а не змішувати між не пов’язаними
полями Plugin. Див. [Plugin каналів](/uk/plugins/sdk-channel-plugins).

Runtime- і config-допоміжні засоби розміщені у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` застарів — це shim сумісності для
старіших Plugin. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (для кореня пакета кожного bundled Plugin):

- `index.js` — entry bundled Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — entry setup Plugin

Зовнішні Plugin повинні імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із core або з іншого Plugin.
Точки входу, завантажені через facade, надають перевагу активному знімку конфігурації runtime, якщо він
існує, а потім повертаються до розв’язаного файла конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, оскільки bundled Plugin уже використовують їх сьогодні. Вони не є
автоматично довгостроково зафіксованими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми tools повідомлень

Plugin повинні володіти внесками до схеми `describeMessageTool(...)`, специфічними для каналу,
для немеседжевих примітивів, таких як реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів кнопок, компонентів, блоків або карток, специфічних для провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation) для контракту,
правил fallback, зіставлення провайдерів і контрольного списку автора Plugin.

Plugin, здатні надсилати, оголошують, що саме вони можуть рендерити, через можливості повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи рендерити представлення native-способом, чи деградувати його до тексту.
Не відкривайте шляхи обходу до native UI провайдера з загального tool повідомлень.
Застарілі допоміжні засоби SDK для старих native-схем залишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Розв’язання цілей каналу

Plugin каналів повинні володіти семантикою цілей, специфічною для каналу. Зберігайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` визначає, чи слід нормалізовану ціль
  трактувати як `direct`, `group` або `channel` до lookup каталогу.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи слід
  для вхідних даних одразу перейти до розв’язання, схожого на id, замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є fallback-варіантом Plugin, коли
  core потрібне фінальне розв’язання, що належить провайдеру, після нормалізації або після
  промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії,
  специфічною для провайдера, після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень за категоріями, які мають відбуватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок «вважати це явним/native id цілі».
- Використовуйте `resolveTarget` для fallback-нормалізації, специфічної для провайдера, а не для
  широкого пошуку в каталозі.
- Зберігайте native-id провайдера, такі як chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в загальних
  полях SDK.

## Каталоги на основі конфігурації

Plugin, які виводять записи каталогу з конфігурації, мають тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі конфігурації, наприклад:

- peer DM, керовані allowlist
- налаштовані зіставлення каналів/груп
- статичні fallback-и каталогу в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування обмежень
- dedupe/нормалізаційні допоміжні засоби
- побудову `ChannelDirectoryEntry[]`

Інспекція облікового запису, специфічна для каналу, і нормалізація id повинні залишатися в
реалізації Plugin.

## Каталоги провайдерів

Plugin провайдерів можуть визначати каталоги моделей для інференсу за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє id моделей, специфічними для провайдера, типовими значеннями `base URL`
або метаданими моделей, що залежать від auth.

`catalog.order` керує тим, коли каталог Plugin зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери на основі API-ключа або env
- `profile`: провайдери, які з’являються, коли існують профілі auth
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери виграють при колізії ключів, тож Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Йому дозволено припускати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися з помилкою, коли потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки
  відновлення doctor/config, не повинні потребувати матеріалізації runtime-облікових даних лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Уключайте поля джерела/статусу облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звіту про доступність
  в режимі тільки читання. Повернення `tokenStatus: "available"` (і відповідного поля
  джерела) достатньо для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовані через SecretRef, але
  недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

## Пакунки пакетів

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

Кожен entry стає Plugin. Якщо пакунок перелічує кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен entry у `openclaw.extensions` має залишатися в межах каталогу Plugin
після розв’язання symlink. Entries, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності Plugin за допомогою
`npm install --omit=dev --ignore-scripts` (без lifecycle-скриптів, без dev-залежностей у runtime). Зберігайте дерева залежностей Plugin
«чистими JS/TS» і уникайте пакетів, яким потрібні збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потрібні поверхні setup для вимкненого Plugin каналу або
коли Plugin каналу ввімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повного entry Plugin. Це робить запуск і setup легшими,
коли ваш основний entry Plugin також підключає tools, hooks або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести Plugin каналу на той самий шлях `setupEntry` під час
передпрослуховувальної фази запуску gateway, навіть якщо канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що entry setup
має реєструвати кожну можливість, що належить каналу, від якої залежить запуск, зокрема:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне прослуховування
- будь-які методи gateway, tools або сервіси, які мають існувати в це саме вікно

Якщо ваш повний entry усе ще володіє будь-якою обов’язковою можливістю запуску, не вмикайте
цей прапорець. Залиште для Plugin типову поведінку та дозвольте OpenClaw завантажити
повний entry під час запуску.

Bundled канали також можуть публікувати допоміжні засоби поверхні контракту лише для setup, які core
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу з одним обліковим записом
у `channels.<id>.accounts.*` без завантаження повного entry Plugin.
Matrix є поточним bundled-прикладом: він переміщує лише ключі auth/bootstrap до
іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і він може
зберегти налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapters зберігають ледаче виявлення поверхні контракту bundled.
Час імпорту залишається малим; поверхня просування завантажується лише під час першого використання, а не через
повторний вхід у запуск bundled каналу під час імпорту модуля.

Коли ці поверхні запуску містять методи Gateway RPC, тримайте їх у
префіксі, специфічному для Plugin. Простори імен адміністрування core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються
до `operator.admin`, навіть якщо Plugin запитує вужчий scope.

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
підказки встановлення через `openclaw.install`. Це дає змогу не зберігати дані каталогу в core.

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

Корисні поля `openclaw.channel` поза межами мінімального прикладу:

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/status
- `docsLabel`: перевизначає текст посилання для посилання на docs
- `preferOver`: id Plugin/каналу з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом для поверхонь вибору
- `markdownCapable`: позначає канал як сумісний з markdown для рішень щодо outbound-форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору setup/configure, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації docs
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: додає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу lookup сесії під час розв’язання цілей announce

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи більше JSON-файлів (розділених комами/крапками з комою/як у `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugin рушія контексту

Plugin рушія контексту володіють orchestration контексту сесії для ingest, assembly
і Compaction. Реєструйте їх зі свого Plugin за допомогою
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам’яті чи hooks.

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
систему Plugin через приватне внутрішнє втручання. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою повинен володіти core: policy, fallback, merge конфігурації,
   lifecycle, семантика для каналів і форма runtime helper.
2. додайте типізовані поверхні реєстрації/runtime для Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть core + споживачів каналів/функцій
   Канали та Plugin функцій повинні споживати нову можливість через core,
   а не імпортувати напряму реалізацію постачальника.
4. зареєструйте реалізації постачальників
   Потім Plugin постачальників реєструють свої backends для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння та реєстрації з часом залишалася явною.

Саме так OpenClaw залишається opinionated, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і робочого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом охоплювати такі
поверхні:

- типи контракту core у `src/<capability>/types.ts`
- runner/runtime helper core у `src/<capability>/runtime.ts`
- поверхню реєстрації API Plugin у `src/plugins/types.ts`
- підключення реєстру Plugin у `src/plugins/registry.ts`
- runtime-експонування Plugin у `src/plugins/runtime/*`, коли Plugin функцій/каналів
  мають її споживати
- допоміжні засоби capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- docs для операторів/Plugin у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
ще не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// контракт core
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

// спільний runtime helper для Plugin функцій/каналів
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Покажи, як робот іде через лабораторію.",
  cfg,
});
```

Шаблон тесту контракту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє контрактом можливості + orchestration
- Plugin постачальників володіють реалізаціями постачальників
- Plugin функцій/каналів споживають runtime helpers
- тести контракту зберігають володіння явним

## Пов’язане

- [Plugin architecture](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Plugin SDK subpaths](/uk/plugins/sdk-subpaths)
- [Plugin SDK setup](/uk/plugins/sdk-setup)
- [Building plugins](/uk/plugins/building-plugins)
