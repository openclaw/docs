---
read_when:
    - Реалізація runtime hooks постачальника, життєвого циклу каналу або package packs
    - Налагодження порядку завантаження Plugin або стану registry
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішня архітектура Plugin: конвеєр завантаження, registry, runtime hooks, HTTP routes і довідкові таблиці'
title: Внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-04-24T18:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71dbdc066ed9e37fe5d051a5cd5ebbf5bdb951115612a344cccc21cab60405a9
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм Plugin і контрактів
власності/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка —
це довідник щодо внутрішньої механіки: конвеєр завантаження, registry, runtime hooks,
Gateway HTTP routes, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів Plugin
2. читає маніфести native або сумісних bundle і метадані package
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи увімкнено кожного кандидата
6. завантажує увімкнені native modules: зібрані bundled modules використовують native loader;
   незібрані native Plugins використовують jiti
7. викликає native hooks `register(api)` і збирає реєстрації в registry Plugin
8. відкриває registry для команд/поверхонь runtime

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає, що з них наявне (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі bundled Plugins використовують `register`; для нових Plugins віддавайте перевагу `register`.
</Note>

Перевірки безпеки виконуються **до** runtime execution. Кандидати блокуються,
якщо entry виходить за межі кореня Plugin, шлях є world-writable або
право власності на шлях виглядає підозрілим для небандлованих Plugins.

### Поведінка manifest-first

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені channels/Skills/schema конфігурації або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для native Plugins runtime module є частиною data plane. Вона реєструє
фактичну поведінку, таку як hooks, tools, commands або потоки provider.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime registration, `register(...)` або `setupEntry`.
Перші живі споживачі активації тепер використовують підказки маніфесту про command, channel і provider,
щоб звузити завантаження Plugin до ширшої матеріалізації registry:

- завантаження CLI звужується до Plugins, які володіють запитаною primary command
- налаштування channel/визначення Plugin звужується до Plugins, які володіють запитаним
  id channel
- явне визначення setup/runtime provider звужується до Plugins, які володіють
  запитаним id provider

Планувальник активації надає як API лише для ids для наявних викликачів, так і
plan API для нової діагностики. Записи plan повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервних варіантів володіння маніфесту,
таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Це розділення причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення setup тепер віддає перевагу id, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звужувати кандидатів Plugin, перш ніж повертатися до
`setup-api` для Plugins, яким усе ще потрібні runtime hooks під час setup. Явне
`setup.requiresRuntime: false` є лише межею для дескриптора; пропущений
`requiresRuntime` зберігає застарілий резервний варіант `setup-api` для сумісності. Якщо більше
ніж один виявлений Plugin заявляє однаковий нормалізований id setup provider або CLI
backend, пошук setup відхиляє неоднозначного власника замість покладання на
порядок виявлення.

### Що кешує loader

OpenClaw зберігає короткі кеші в межах процесу для:

- результатів виявлення
- даних registry маніфестів
- registry завантажених Plugins

Ці кеші зменшують пікові витрати під час запуску й повторних викликів команд. Їх безпечно
сприймати як короткочасні кеші продуктивності, а не як постійне сховище.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель registry

Завантажені Plugins не змінюють напряму довільні глобальні об’єкти core. Вони реєструються в
центральний registry Plugin.

Registry відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- channels
- providers
- обробники Gateway RPC
- HTTP routes
- реєстратори CLI
- фонові сервіси
- commands, що належать Plugin

Функції core далі читають із цього registry замість прямої взаємодії з modules Plugin.
Це робить завантаження односпрямованим:

- module Plugin -> реєстрація в registry
- runtime core -> споживання registry

Це розділення важливе для супроводу. Воно означає, що більшості поверхонь core потрібна лише
одна точка інтеграції: «прочитати registry», а не «робити special-case для кожного module Plugin».

## Зворотні виклики прив’язки розмов

Plugins, які прив’язують розмову, можуть реагувати, коли підтвердження вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати зворотний виклик після того, як запит прив’язки
підтверджено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Тепер для цього Plugin + розмови існує прив’язка.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистіть будь-який локальний стан очікування.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля payload зворотного виклику:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: вирішена прив’язка для підтверджених запитів
- `request`: підсумок початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей зворотний виклик призначений лише для сповіщення. Він не змінює те, кому дозволено прив’язувати
розмову, і виконується після завершення обробки підтвердження в core.

## Runtime hooks provider

Plugins provider мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Hooks на етапі конфігурації**: `catalog` (застаріле `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 необов’язкових hooks, що охоплюють auth, визначення моделі,
  обгортання stream, рівні thinking, політику replay і endpoints використання. Див.
  повний список у розділі [Порядок hooks і використання](#hook-order-and-usage).

OpenClaw і далі володіє загальним циклом агента, failover, обробкою transcript і
політикою tool. Ці hooks є поверхнею розширення для специфічної для provider
поведінки без потреби в цілому власному inference transport.

Використовуйте `providerAuthEnvVars` маніфесту, коли provider має облікові дані на основі env,
які мають бути видимі загальним шляхам auth/status/model-picker без завантаження runtime Plugin.
Використовуйте `providerAuthAliases` маніфесту, коли один id provider має повторно використовувати
env vars, профілі auth, auth на основі конфігурації та вибір API-ключа для onboarding
іншого id provider. Використовуйте `providerAuthChoices` маніфесту, коли поверхні onboarding/auth-choice
CLI мають знати id вибору provider, мітки груп і просту однопрапорцеву auth wiring
без завантаження runtime provider. Зберігайте `envVars` runtime provider для
підказок, видимих оператору, таких як мітки onboarding або змінні налаштування
OAuth client-id/client-secret.

Використовуйте `channelEnvVars` маніфесту, коли channel має auth або setup на основі env, які
мають бути видимі загальному резервному shell-env, перевіркам config/status або підказкам setup
без завантаження runtime channel.

### Порядок hooks і використання

Для Plugins model/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий орієнтир для вибору.

| #   | Hook                              | Що робить                                                                                                      | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію provider у `models.providers` під час генерації `models.json`                            | Provider володіє каталогом або типовими значеннями base URL                                                                                   |
| 2   | `applyConfigDefaults`             | Застосовує типові глобальні значення конфігурації provider під час матеріалізації конфігурації                | Типові значення залежать від режиму auth, env або семантики сімейства моделей provider                                                       |
| --  | _(built-in model lookup)_         | OpenClaw спочатку пробує звичайний шлях registry/catalog                                                      | _(не є hook Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                            | Provider володіє очищенням псевдонімів перед визначенням канонічної моделі                                                                    |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider перед загальним збиранням моделі                              | Provider володіє очищенням транспорту для власних id provider у межах того самого сімейства транспорту                                       |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/provider                                          | Provider потребує очищення конфігурації, яке має жити разом із Plugin; bundled helper-и сімейства Google також резервно підтримують записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування native streaming-usage до provider-ів у конфігурації                         | Provider потребує виправлень метаданих native streaming usage, що залежать від endpoint                                                      |
| 7   | `resolveConfigApiKey`             | Визначає auth через env-marker для provider-ів у конфігурації перед завантаженням runtime auth                | Provider має власне визначення API-ключа через env-marker; `amazon-bedrock` також має тут вбудований resolver AWS env-marker                |
| 8   | `resolveSyntheticAuth`            | Показує локальну/self-hosted або auth на основі конфігурації без збереження plaintext                         | Provider може працювати із synthetic/local маркером облікових даних                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі auth, що належать provider; типове `persistence` — `runtime-only` для creds, якими володіє CLI/app | Provider повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет synthetic placeholders збережених профілів відносно auth на основі env/config               | Provider зберігає synthetic placeholder-профілі, які не повинні мати вищий пріоритет                                                         |
| 11  | `resolveDynamicModel`             | Синхронний резервний варіант для model id provider, яких ще немає в локальному registry                       | Provider приймає довільні upstream model id                                                                                                   |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                       | Provider потребує мережевих метаданих перед визначенням невідомих id                                                                          |
| 13  | `normalizeResolvedModel`          | Остаточне переписування перед тим, як embedded runner використовує визначену модель                            | Provider потребує переписувань транспорту, але все ще використовує транспорт core                                                            |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці compat для vendor-моделей за іншим сумісним транспортом                                        | Provider розпізнає власні моделі на proxy-транспортах, не перебираючи на себе provider                                                       |
| 15  | `capabilities`                    | Метадані transcript/tooling, що належать provider і використовуються спільною логікою core                    | Provider потребує особливостей transcript/provider family                                                                                     |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми tool перед тим, як їх побачить embedded runner                                                | Provider потребує очищення схем для сімейства транспорту                                                                                      |
| 17  | `inspectToolSchemas`              | Показує діагностику схем, що належить provider, після нормалізації                                             | Provider хоче попередження про ключові слова без навчання core правилам, специфічним для provider                                            |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт reasoning-output                                                             | Provider потребує tagged reasoning/final output замість native полів                                                                          |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів stream                                   | Provider потребує типових параметрів запиту або очищення параметрів для конкретного provider                                                 |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним транспортом                                                     | Provider потребує власного wire protocol, а не лише обгортки                                                                                  |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних обгорток                                                          | Provider потребує обгорток сумісності заголовків/тіла запиту/моделі без власного транспорту                                                  |
| 22  | `resolveTransportTurnState`       | Додає native заголовки або метадані транспорту для кожного turn                                                | Provider хоче, щоб загальні транспорти надсилали native ідентичність turn для provider                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native заголовки WebSocket або політику cool-down для сесії                                              | Provider хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або резервну політику                                                |
| 24  | `formatApiKey`                    | Форматувач auth-profile: збережений профіль стає runtime-рядком `apiKey`                                       | Provider зберігає додаткові метадані auth і потребує власної форми runtime token                                                             |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних endpoint-ів оновлення або політики помилок оновлення               | Provider не відповідає спільним механізмам оновлення `pi-ai`                                                                                  |
| 26  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається, коли оновлення OAuth завершується помилкою                            | Provider потребує власних рекомендацій щодо виправлення auth після помилки оновлення                                                         |
| 27  | `matchesContextOverflowError`     | Засіб зіставлення переповнення context window, що належить provider                                            | Provider має сирі помилки переповнення, які загальні евристики не виявляють                                                                   |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить provider                                                             | Provider може зіставляти сирі помилки API/транспорту з rate-limit/перевантаженням тощо                                                       |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для provider-ів proxy/backhaul                                                           | Provider потребує керування TTL кешу, специфічного для proxy                                                                                  |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення при відсутній auth                                                  | Provider потребує підказки відновлення при відсутній auth, специфічної для provider                                                          |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей плюс необов’язкова підказка помилки для користувача                  | Provider потребує приховувати застарілі upstream-рядки або замінювати їх підказкою vendor                                                    |
| 32  | `augmentModelCatalog`             | Synthetic/final рядки каталогу, додані після виявлення                                                         | Provider потребує synthetic рядків прямої сумісності в `models list` і вибирачах                                                             |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                            | Provider відкриває власну шкалу thinking або бінарну мітку для вибраних моделей                                                              |
| 34  | `isBinaryThinking`                | Hook сумісності для вмикання/вимикання reasoning                                                               | Provider підтримує лише бінарне thinking увімк./вимк.                                                                                         |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                                | Provider хоче `xhigh` лише для підмножини моделей                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                    | Provider володіє типовою політикою `/think` для сімейства моделей                                                                             |
| 37  | `isModernModelRef`                | Засіб зіставлення modern-model для фільтрів live profile і вибору smoke                                        | Provider володіє зіставленням бажаних моделей для live/smoke                                                                                  |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime token/key безпосередньо перед inference                | Provider потребує обміну токена або короткоживучих облікових даних запиту                                                                     |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов’язаних поверхонь статусу                              | Provider потребує власного розбору usage/quota token або інших облікових даних usage                                                         |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки usage/quota, специфічні для provider, після визначення auth                      | Provider потребує власного endpoint usage або парсера payload                                                                                 |
| 41  | `createEmbeddingProvider`         | Створює embedding adapter, що належить provider, для пам’яті/пошуку                                            | Поведінка embedding для пам’яті має належати Plugin provider                                                                                  |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою transcript для provider                                           | Provider потребує власної політики transcript (наприклад, видалення thinking-block)                                                          |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                  | Provider потребує власних переписувань replay, специфічних для provider, понад спільні helper-и Compaction                                   |
| 44  | `validateReplayTurns`             | Фінальна перевірка або зміна форми turn replay перед embedded runner                                           | Транспорт provider потребує суворішої перевірки turn після загального очищення                                                                |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать provider                                               | Provider потребує телеметрії або стану, що належить provider, коли модель стає активною                                                      |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
підібраний Plugin provider, а потім переходять до інших Plugin provider, які підтримують hooks,
доки один із них фактично не змінить id моделі або transport/config. Це дозволяє
shim-ам alias/compat provider працювати без потреби, щоб викликач знав, який bundled Plugin
володіє цим переписуванням. Якщо жоден hook provider не переписує підтримуваний запис конфігурації
сімейства Google, bundled normalizer конфігурації Google все одно застосовує
це очищення сумісності.

Якщо provider потребує повністю власного wire protocol або власного виконавця запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки provider, яка
все ще працює на звичайному циклі inference OpenClaw.

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

Bundled Plugins provider комбінують наведені вище hooks відповідно до потреб кожного постачальника щодо catalog,
auth, thinking, replay і usage. Авторитетний набір hooks міститься в кожному
Plugin у `extensions/`; ця сторінка ілюструє форми, а не дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб показувати upstream
    model id раніше за статичний catalog OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дозволяють provider-ам підключатися до
    політики transcript через `buildReplayPolicy`, замість того щоб кожен Plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють на спільному циклі inference.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` і `context1m` розміщені всередині
    публічного seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugins можуть отримувати доступ до вибраних helper-ів core через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS core для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію core `messages.tts` і вибір provider.
- Повертає PCM audio buffer + sample rate. Plugins мають виконувати ресемплінг/кодування для provider-ів.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для голосових вибирачів або потоків setup, що належать постачальнику.
- Списки голосів можуть містити багатші метадані, такі як locale, gender і personality tags для вибирачів, обізнаних про provider.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

Plugins також можуть реєструвати speech provider-ів через `api.registerSpeechProvider(...)`.

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

- Зберігайте політику TTS, резервну поведінку й доставку відповідей у core.
- Використовуйте speech provider-ів для поведінки синтезу, що належить постачальнику.
- Застарілий ввід Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель володіння є орієнтованою на компанію: один Plugin постачальника може володіти
  text, speech, image і майбутніми media provider-ами в міру того, як OpenClaw додає ці
  контракти можливостей.

Для розуміння image/audio/video Plugins реєструють один типізований
provider media understanding замість узагальненого набору ключ/значення:

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

- Зберігайте orchestration, резервну поведінку, конфігурацію й wiring channel у core.
- Зберігайте поведінку постачальника в Plugin provider.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливості й runtime helper-ом
  - Plugins постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - Plugins функцій/channel споживають `api.runtime.videoGeneration.*`

Для runtime helper-ів media understanding Plugins можуть викликати:

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

Для транскрибування audio Plugins можуть використовувати або runtime media understanding,
або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов’язково, коли MIME неможливо надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна surface для
  розуміння image/audio/video.
- Використовує конфігурацію audio для media understanding у core (`tools.media.audio`) і резервний порядок provider-ів.
- Повертає `{ text: undefined }`, якщо не створено жодного результату транскрибування (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності.

Plugins також можуть запускати фонові прогони subagent через `api.runtime.subagent`:

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
- Для резервних прогонів, що належать Plugin, оператори мають явно увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugins конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Прогони subagent для недовірених Plugins усе ще працюють, але запити на перевизначення відхиляються, а не тихо переходять до резервної поведінки.

Для web search Plugins можуть використовувати спільний runtime helper замість
прямого доступу до wiring tool агента:

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

Plugins також можуть реєструвати provider-ів web search через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір provider, визначення облікових даних і спільну семантику запитів у core.
- Використовуйте provider-ів web search для транспортів пошуку, специфічних для постачальника.
- `api.runtime.webSearch.*` — це бажана спільна surface для Plugins функцій/channel, яким потрібна поведінка пошуку без залежності від обгортки tool агента.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка provider-ів генерації зображень.
- `listProviders(...)`: показує доступних provider-ів генерації зображень і їхні можливості.

## Gateway HTTP routes

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

- `path`: шлях route під HTTP server Gateway.
- `auth`: обов’язкове поле. Використовуйте `"gateway"`, щоб вимагати звичайну auth Gateway, або `"plugin"` для auth/webhook verification під керуванням Plugin.
- `match`: необов’язково. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язково. Дозволяє тому самому Plugin замінити власну наявну реєстрацію route.
- `handler`: повертає `true`, якщо route обробив запит.

Примітки:

- `api.registerHttpHandler(...)` вилучено, і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Routes Plugin мають явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один Plugin не може замінити route іншого Plugin.
- Перекривні routes з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише в межах одного рівня auth.
- Routes `auth: "plugin"` **не** отримують автоматично runtime scopes оператора. Вони призначені для webhook-ів/signature verification під керуванням Plugin, а не для привілейованих helper-викликів Gateway.
- Routes `auth: "gateway"` працюють у runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth на спільному секреті (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes route Plugin на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` у приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах route Plugin з ідентичністю, runtime scope резервно переходить до `operator.write`
- Практичне правило: не припускайте, що route Plugin з auth gateway є неявною admin surface. Якщо вашому route потрібна поведінка лише для admin, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту SDK Plugin

Використовуйте вузькі підшляхи SDK замість монолітного root
barrel `openclaw/plugin-sdk` під час створення нових Plugins. Підшляхи core:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Helper-и входу/збирання channel                    |
| `openclaw/plugin-sdk/core`          | Загальні спільні helper-и та umbrella contract     |
| `openclaw/plugin-sdk/config-schema` | Zod schema кореневого `openclaw.json` (`OpenClawSchema`) |

Plugins channel обирають із сімейства вузьких seam-ів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку підтвердження слід зводити
до одного контракту `approvalCapability`, а не змішувати її між не пов’язаними
полями Plugin. Див. [Plugins channel](/uk/plugins/sdk-channel-plugins).

Runtime і helper-и конфігурації розміщуються у відповідних підшляхах
`*-runtime` (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших Plugins. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Точки входу, внутрішні для репозиторію (для кореня package кожного bundled Plugin):

- `index.js` — точка входу bundled Plugin
- `api.js` — barrel helper-ів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні Plugins повинні імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого package Plugin із core або з іншого Plugin.
Точки входу, завантажені через facade, віддають перевагу активному знімку конфігурації runtime, якщо такий
існує, а потім резервно використовують визначений файл конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, оскільки bundled Plugins уже використовують їх сьогодні. Вони
не є автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте
відповідну сторінку довідника SDK, коли покладаєтеся на них.

## Схеми tool повідомлень

Plugins повинні володіти внесками у схему `describeMessageTool(...)`, специфічними для channel,
для примітивів, відмінних від повідомлень, таких як реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native полів provider для button, component, block або card.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
резервних правил, зіставлення provider і контрольного списку для авторів Plugin.

Plugins із можливістю надсилання оголошують, що вони можуть відтворювати, через message capabilities:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи відтворювати представлення нативно, чи деградувати його до тексту.
Не відкривайте шляхи обходу нативного UI provider із загального message tool.
Застарілі helper-и SDK для старих native схем залишаються експортованими для наявних
сторонніх Plugins, але нові Plugins не повинні їх використовувати.

## Визначення цілі channel

Plugins channel повинні володіти семантикою цілей, специфічною для channel. Зберігайте спільний
хост вихідного трафіку узагальненим і використовуйте surface messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` визначає, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  вхідні дані слід одразу передавати до визначення за id-подібним значенням замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` — це резервний варіант Plugin, коли
  core потрібне остаточне визначення, що належить provider, після нормалізації або
  після промаху в directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії,
  специфічною для provider, після того як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень за категоріями, які мають відбуватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок виду «обробляти це як явний/native id цілі».
- Використовуйте `resolveTarget` для резервної нормалізації, специфічної для provider, а не для
  широкого пошуку в directory.
- Зберігайте native id provider, такі як chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для provider, а не в загальних
  полях SDK.

## Directory на основі конфігурації

Plugins, які виводять записи directory з конфігурації, мають зберігати цю логіку в
Plugin і повторно використовувати спільні helper-и з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли channel потребує peer/group на основі конфігурації, наприклад:

- DM-peer-и на основі allowlist
- налаштовані зіставлення channel/group
- статичні резервні варіанти directory для окремих облікових записів

Спільні helper-и в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування лімітів
- helper-и дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка channel-специфічних облікових записів і нормалізація id мають залишатися в
реалізації Plugin.

## Каталоги provider

Plugins provider можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли Plugin володіє model id, специфічними для provider, типовими
значеннями base URL або метаданими моделей, залежними від auth.

`catalog.order` керує тим, коли каталог Plugin зливається відносно
вбудованих неявних provider-ів OpenClaw:

- `simple`: звичайні provider-и на API-ключах або env
- `profile`: provider-и, які з’являються, коли існують профілі auth
- `paired`: provider-и, які синтезують кілька пов’язаних записів provider
- `late`: останній прохід, після інших неявних provider-ів

Пізніші provider-и перемагають у разі колізії ключів, тому Plugins можуть навмисно
перевизначати вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Лише для читання: перевірка channel

Якщо ваш Plugin реєструє channel, краще реалізувати
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і може швидко завершуватися помилкою, якщо потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки doctor/repair конфігурації,
  не повинні матеріалізовувати облікові дані runtime лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- Включає поля джерела/статусу облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення токенів лише для повідомлення про доступність у режимі лише читання.
  Для команд у стилі status достатньо повертати `tokenStatus: "available"` (і відповідне поле джерела).
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дозволяє командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштований.

## Package packs

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

Кожен запис стає Plugin. Якщо pack перелічує кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує залежності npm, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися в межах каталогу Plugin
після визначення symlink. Записи, які виходять за межі каталогу package,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності Plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev dependencies під час runtime). Зберігайте дерева залежностей Plugin
«чистими JS/TS» і уникайте package-ів, які потребують збірок через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий module лише для setup.
Коли OpenClaw потребує поверхонь setup для вимкненого Plugin channel або
коли Plugin channel увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і setup легшими,
коли ваша основна точка входу Plugin також підключає tools, hooks або інший код
лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести Plugin channel на той самий шлях `setupEntry` під час
фази запуску gateway до початку прослуховування, навіть якщо channel уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу setup
має реєструвати всі можливості, що належать channel і від яких залежить запуск, наприклад:

- власне реєстрацію channel
- будь-які HTTP routes, які мають бути доступні до того, як gateway почне прослуховування
- будь-які методи Gateway, tools або сервіси, які мають існувати в тому самому вікні

Якщо ваша повна точка входу все ще володіє будь-якою потрібною можливістю запуску, не вмикайте
цей прапорець. Залиште Plugin на типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Bundled channels також можуть публікувати helper-и contract-surface лише для setup, до яких core
може звертатися до завантаження повного runtime channel. Поточна surface
просування setup:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю surface, коли потрібно просунути застарілу конфігурацію
одиночного облікового запису channel у `channels.<id>.accounts.*` без завантаження повної точки входу Plugin.
Matrix — поточний bundled приклад: він переміщує лише auth/bootstrap-ключі в
іменований просунутий обліковий запис, коли іменовані облікові записи вже існують, і може зберегти
налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapter-и зберігають lazy-виявлення bundled contract-surface. Час імпорту залишається
легким; surface просування завантажується лише під час першого використання, а не через
повторний вхід у запуск bundled channel під час імпорту module.

Коли ці surface запуску включають методи Gateway RPC, зберігайте їх на
префіксі, специфічному для Plugin. Простори назв admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо Plugin запитує вужчий scope.

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

### Метадані каталогу channel

Plugins channel можуть оголошувати метадані setup/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дозволяє core не містити даних каталогу.

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

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/статусу
- `docsLabel`: перевизначення тексту посилання для посилання на документацію
- `preferOver`: id Plugin/channel з нижчим пріоритетом, які цей запис каталогу має перевершувати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: керування текстом поверхні вибору
- `markdownCapable`: позначає channel як сумісний із Markdown для рішень щодо форматування вихідних повідомлень
- `exposure.configured`: приховує channel із поверхонь списку налаштованих channel, коли встановлено `false`
- `exposure.setup`: приховує channel з інтерактивних вибирачів setup/configure, коли встановлено `false`
- `exposure.docs`: позначає channel як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає channel до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може зливати **зовнішні каталоги channel** (наприклад, експорт registry
MPM). Розмістіть JSON-файл в одному з місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або більше JSON-файлів (розділення комою/крапкою з комою/через `PATH`). Кожен файл повинен
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу channel і записи каталогу встановлення provider-ів відкривають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Ці
нормалізовані факти визначають, чи є npm spec точною версією чи плаваючим
селектором, чи присутні очікувані метадані цілісності та чи доступне також локальне
джерело. Коли ідентичність каталогу/package відома, нормалізовані факти попереджають, якщо
розібрана назва npm package відхиляється від цієї ідентичності.
Вони також попереджають, коли `defaultChoice` є недійсним або вказує на джерело, яке
недоступне, і коли метадані цілісності npm присутні без дійсного джерела
npm. Споживачі мають трактувати `installSource` як адитивне необов’язкове поле, щоб
старі записи, зібрані вручну, і compatibility shim-и не мусили його синтезувати.
Це дозволяє onboarding і діагностиці пояснювати стан plane джерел без
імпорту runtime Plugin.

Офіційні зовнішні записи npm повинні віддавати перевагу точному `npmSpec` плюс
`expectedIntegrity`. Прості назви package і dist-tag-и все ще працюють для
сумісності, але вони показують попередження plane джерел, щоб каталог міг рухатися
до встановлень із фіксованими версіями та перевіркою цілісності без порушення наявних Plugins.
Коли onboarding встановлює з локального шляху каталогу, він записує
запис `plugins.installs` із `source: "path"` і шляхом `sourcePath`, відносним до workspace,
коли це можливо. Абсолютний робочий шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання локальних робочих
шляхів станції у довготривалу конфігурацію. Це робить локальні встановлення для розробки видимими для
діагностики plane джерел без додавання другої surface розкриття сирих шляхів файлової системи.

## Plugins рушія контексту

Plugins рушія контексту володіють orchestration контексту сесії для ingest, assembly
і Compaction. Реєструйте їх зі свого Plugin за допомогою
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли ваш Plugin має замінити або розширити типовий конвеєр
контексту, а не просто додати пошук у пам’яті або hooks.

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

Коли Plugin потребує поведінки, яка не вкладається в поточний API, не обходьте
систему Plugin через приватний доступ усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: політика, резервна поведінка, злиття конфігурації,
   життєвий цикл, семантика для channel і форма runtime helper-а.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` мінімально корисною
   типізованою surface можливості.
3. підключіть споживачів core + channel/feature
   Channels і Plugins функцій повинні споживати нову можливість через core,
   а не імпортувати напряму реалізацію постачальника.
4. зареєструйте реалізації постачальників
   Потім Plugins постачальників реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб володіння й форма реєстрації з часом залишалися явними.

Саме так OpenClaw залишається виразним, не стаючи жорстко прив’язаним до
світогляду одного постачальника. Див. [Збірник рецептів можливостей](/uk/plugins/architecture)
для конкретного списку файлів і готового прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай повинна разом торкатися
таких поверхонь:

- типи контрактів core у `src/<capability>/types.ts`
- runner/runtime helper core у `src/<capability>/runtime.ts`
- surface реєстрації API Plugin у `src/plugins/types.ts`
- wiring registry Plugin у `src/plugins/registry.ts`
- відкриття runtime Plugin у `src/plugins/runtime/*`, коли Plugins функцій/channel
  мають його споживати
- helper-и захоплення/тестування в `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документація для операторів/Plugin у `docs/`

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

// спільний runtime helper для Plugins функцій/channel
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Шаблон тесту контракту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє контрактом можливості + orchestration
- Plugins постачальників володіють реалізаціями постачальників
- Plugins функцій/channel споживають runtime helper-и
- тести контракту зберігають володіння явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель і форми можливостей
- [Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugins](/uk/plugins/building-plugins)
