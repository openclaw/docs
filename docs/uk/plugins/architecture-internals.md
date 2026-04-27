---
read_when:
    - Реалізація runtime hooks провайдера, життєвого циклу каналу або package packs
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішня архітектура Plugin: конвеєр завантаження, реєстр, runtime hooks, HTTP-маршрути та довідкові таблиці'
title: внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-04-27T11:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea728243270d7f234fe016e2e0ec73d24c350d20b0163bbc19aeb29fb8667cbc
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм Plugin і контрактів
володіння/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка —
довідник щодо внутрішньої механіки: конвеєр завантаження, реєстр, runtime hooks,
HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє корені кандидатів Plugin
2. читає маніфести нативних або сумісних bundle і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує config Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи ввімкнено кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled modules використовують native loader;
   незібрані нативні Plugin використовують jiti
7. викликає нативні hooks `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для поверхонь команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі bundled Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Шлюзи безпеки спрацьовують **до** виконання runtime. Кандидатів блокують,
коли entry виходить за межі кореня Plugin, шлях має право запису для всіх або
володіння шляхом виглядає підозріло для небандлованих Plugin.

### Поведінка manifest-first

Маніфест — це джерело істини control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявити оголошені channels/Skills/schema config або можливості bundle
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/placeholders у Control UI
- показувати install/catalog metadata
- зберігати дешеві дескриптори activation і setup без завантаження runtime Plugin

Для нативних Plugin модуль runtime є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, tools, commands або provider flows.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори metadata для планування activation і виявлення setup;
вони не замінюють реєстрацію runtime, `register(...)` або `setupEntry`.
Перші споживачі live activation тепер використовують підказки команд, каналів і провайдерів із маніфесту,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- setup каналів/визначення Plugin звужується до Plugin, які володіють запитаним
  id каналу
- явне setup/runtime визначення провайдера звужується до Plugin, які володіють
  запитаним id провайдера

Планувальник activation надає і API лише з id для наявних викликів, і
API плану для нової діагностики. Записи плану повідомляють, чому було вибрано Plugin,
відокремлюючи явні підказки планувальника `activation.*` від резервного володіння маніфесту,
такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Це розділення причин є межею сумісності:
наявні metadata Plugin продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення setup тепер надає перевагу id, якими володіє дескриптор, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів Plugin, перш ніж переходити до
`setup-api` для Plugin, яким усе ще потрібні runtime hooks під час setup. Списки setup провайдерів
використовують `providerAuthChoices` із маніфесту, варіанти setup, похідні від дескриптора,
і metadata install-catalog без завантаження runtime провайдера. Явне
`setup.requiresRuntime: false` є лише дескрипторним обмеженням; якщо
`requiresRuntime` пропущено, для сумісності зберігається резервний шлях через legacy setup-api. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований id setup provider або CLI
backend, пошук setup відхиляє неоднозначного власника замість покладання на
порядок виявлення. Коли runtime setup все ж виконується, діагностика реєстру повідомляє про
розбіжність між `setup.providers` / `setup.cliBackends` і провайдерами або CLI
backend-ами, зареєстрованими через setup-api, не блокуючи legacy Plugin.

### Що кешує loader

OpenClaw тримає короткоживучі внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin

Ці кеші зменшують стрибкоподібне навантаження під час запуску та накладні витрати
повторних команд. Їх безпечно розглядати як короткоживучі кеші продуктивності,
а не як постійне зберігання.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні змінні core. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- legacy hooks і типізовані hooks
- channels
- providers
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, якими володіє Plugin

Потім можливості core читають із цього реєстру, замість того щоб напряму
взаємодіяти з модулями Plugin. Це зберігає односторонність завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime core -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь core
потрібна лише одна точка інтеграції: «прочитати реєстр», а не «спеціально обробляти кожен модуль Plugin».

## Зворотні виклики прив’язки розмови

Plugin, які прив’язують розмову, можуть реагувати, коли схвалення вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати зворотний виклик після того,
як запит на прив’язку схвалено або відхилено:

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

Поля payload зворотного виклику:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: зведення початкового запиту, підказка detach, id відправника та
  metadata розмови

Цей зворотний виклик призначено лише для сповіщення. Він не змінює, хто має право прив’язувати
розмову, і виконується після завершення обробки схвалення в core.

## Runtime hooks провайдера

Plugin провайдерів мають три рівні:

- **Metadata маніфесту** для дешевого пошуку до runtime:
  `setup.providers[].envVars`, застарілий сумісний `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Hooks часу config**: `catalog` (legacy `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 необов’язкових hooks, що покривають auth, визначення моделей,
  обгортання stream, рівні thinking, політику replay і endpoints використання. Див.
  повний список у [Порядок hooks і використання](#hook-order-and-usage).

OpenClaw і далі володіє загальним циклом агента, failover, обробкою transcript і
політикою tools. Ці hooks — це поверхня розширення для специфічної поведінки провайдера
без потреби в цілому кастомному transport інференсу.

Використовуйте `setup.providers[].envVars` у маніфесті, коли провайдер має credentials на основі env,
які мають бути видимі загальним шляхам auth/status/model-picker без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` усе ще читається адаптером
сумісності протягом вікна депрецiацiї, а небандловані Plugin, які його використовують,
отримують діагностику маніфесту. Використовуйте `providerAuthAliases` у маніфесті,
коли один id провайдера має повторно використовувати env vars, auth profiles,
auth на основі config і варіант onboarding API key іншого id провайдера. Використовуйте
`providerAuthChoices` у маніфесті, коли поверхні CLI onboarding/auth-choice повинні знати
choice id провайдера, мітки груп і просту auth-логіку з одним прапорцем
без завантаження runtime провайдера. Залишайте runtime
`envVars` провайдера для операторських підказок, таких як мітки onboarding або змінні setup для OAuth
client-id/client-secret.

Використовуйте `channelEnvVars` у маніфесті, коли канал має auth або setup на основі env,
які мають бути видимі загальному резервному шляху shell-env, перевіркам config/status або
підказкам setup без завантаження runtime каналу.

### Порядок hooks і використання

Для Plugin моделей/провайдерів OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий посібник із вибору.

| #   | Hook                              | Що робить                                                                                                      | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує config провайдера в `models.providers` під час генерації `models.json`                               | Провайдер володіє catalog або типовими значеннями base URL                                                                                    |
| 2   | `applyConfigDefaults`             | Застосовує типові значення глобального config, що належать провайдеру, під час materialization config         | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                     |
| --  | _(built-in model lookup)_         | OpenClaw спочатку намагається пройти звичайний шлях registry/catalog                                           | _(це не hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед lookup                                              | Провайдер володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                   |
| 4   | `normalizeTransport`              | Нормалізує сімейство провайдерів `api` / `baseUrl` перед загальним збиранням моделі                           | Провайдер володіє очищенням transport для кастомних id провайдерів у межах того самого сімейства transport                                   |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                        | Провайдеру потрібне очищення config, яке має жити разом із Plugin; bundled helpers сімейства Google також страхують підтримувані записи config Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи native streaming-usage до config-провайдерів                                      | Провайдеру потрібні виправлення metadata native streaming usage на основі endpoint                                                            |
| 7   | `resolveConfigApiKey`             | Визначає auth env-marker для config-провайдерів перед завантаженням runtime auth                               | Провайдер має власне визначення API-key env-marker; `amazon-bedrock` також має тут вбудований AWS env-marker resolver                        |
| 8   | `resolveSyntheticAuth`            | Показує auth для local/self-hosted або на основі config без збереження plaintext                               | Провайдер може працювати із synthetic/local marker credentials                                                                                |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth profiles, що належать провайдеру; типове значення `persistence` — `runtime-only` для creds, що належать CLI/app | Провайдер повторно використовує зовнішні auth credentials без збереження скопійованих refresh tokens; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic placeholder profiles відносно auth на основі env/config                  | Провайдер зберігає synthetic placeholder profiles, які не мають отримувати вищий пріоритет                                                   |
| 11  | `resolveDynamicModel`             | Синхронний fallback для model id, що належать провайдеру, але ще відсутні в локальному registry                | Провайдер приймає довільні upstream model id                                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Провайдеру потрібні мережеві metadata перед визначенням невідомих id                                                                          |
| 13  | `normalizeResolvedModel`          | Фінальний перезапис перед тим, як embedded runner використає визначену модель                                   | Провайдеру потрібні перезаписи transport, але він усе ще використовує transport core                                                         |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для vendor-моделей за іншим сумісним transport                                            | Провайдер розпізнає власні моделі на proxy transport без перехоплення керування провайдером                                                  |
| 15  | `capabilities`                    | Metadata transcript/tooling провайдера, які використовує спільна логіка core                                   | Провайдеру потрібні особливості transcript/сімейства провайдерів                                                                              |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми tools до того, як їх побачить embedded runner                                                  | Провайдеру потрібне очищення схем для сімейства transport                                                                                     |
| 17  | `inspectToolSchemas`              | Показує діагностику схем, що належить провайдеру, після нормалізації                                            | Провайдер хоче попередження про ключові слова без навчання core правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged контракт reasoning-output                                                              | Провайдеру потрібен tagged reasoning/final output замість native fields                                                                       |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними wrappers параметрів stream                                      | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream кастомним transport                                                      | Провайдеру потрібен кастомний wire protocol, а не просто wrapper                                                                              |
| 21  | `wrapStreamFn`                    | Wrapper stream після застосування загальних wrappers                                                             | Провайдеру потрібні wrappers сумісності для заголовків/тіла/model запиту без кастомного transport                                            |
| 22  | `resolveTransportTurnState`       | Додає native заголовки або metadata transport для кожного ходу                                                  | Провайдер хоче, щоб загальні transports надсилали native turn identity провайдера                                                            |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native заголовки WebSocket або політику cool-down сесії                                                   | Провайдер хоче, щоб загальні WS transports налаштовували заголовки сесії або fallback-політику                                               |
| 24  | `formatApiKey`                    | Форматувач auth-profile: збережений profile стає рядком runtime `apiKey`                                        | Провайдер зберігає додаткові metadata auth і потребує кастомної форми runtime token                                                          |
| 25  | `refreshOAuth`                    | Override оновлення OAuth для кастомних endpoint оновлення або політики збоїв оновлення                          | Провайдер не відповідає спільним засобам оновлення `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли оновлення OAuth завершується з помилкою                                | Провайдеру потрібні власні підказки щодо відновлення auth після збою оновлення                                                               |
| 27  | `matchesContextOverflowError`     | Власний для провайдера matcher переповнення context-window                                                      | Провайдер має сирі помилки переповнення, які пропустили б загальні евристики                                                                  |
| 28  | `classifyFailoverReason`          | Власна для провайдера класифікація причин failover                                                              | Провайдер може зіставити сирі помилки API/transport з rate-limit/overload тощо                                                               |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul провайдерів                                                            | Провайдеру потрібне керування TTL кешу, специфічне для proxy                                                                                  |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення при відсутності auth                                                 | Провайдеру потрібна специфічна для провайдера підказка відновлення при відсутності auth                                                       |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream моделей плюс необов’язкова підказка помилки для користувача                   | Провайдеру потрібно приховати застарілі upstream rows або замінити їх підказкою постачальника                                                |
| 32  | `augmentModelCatalog`             | Synthetic/final rows catalog, додані після discovery                                                            | Провайдеру потрібні synthetic rows для прямої сумісності в `models list` і picker-ах                                                         |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                             | Провайдер надає кастомну шкалу thinking або бінарну мітку для вибраних моделей                                                               |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімк./вимк.                                                           | Провайдер підтримує лише бінарне thinking увімк./вимк.                                                                                         |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                                 | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                     | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                            |
| 37  | `isModernModelRef`                | Matcher modern-model для live profile filters і вибору smoke                                                   | Провайдер володіє зіставленням preferred-model для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані credentials на фактичний runtime token/key безпосередньо перед інференсом                 | Провайдеру потрібен обмін token або короткоживучі credentials запиту                                                                          |
| 39  | `resolveUsageAuth`                | Визначає credentials usage/billing для `/usage` і пов’язаних поверхонь статусу                                | Провайдеру потрібен кастомний розбір token usage/quota або інші credentials usage                                                            |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує специфічні для провайдера snapshots usage/quota після визначення auth                     | Провайдеру потрібен специфічний для провайдера endpoint usage або parser payload                                                              |
| 41  | `createEmbeddingProvider`         | Будує embedding adapter, що належить провайдеру, для memory/search                                             | Поведінка embedding для пам’яті має належати Plugin провайдера                                                                                |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою transcript для провайдера                                         | Провайдеру потрібна кастомна політика transcript, наприклад видалення блоків thinking                                                        |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                  | Провайдеру потрібні специфічні для провайдера перезаписи replay понад спільні helper-и compaction                                            |
| 44  | `validateReplayTurns`             | Фінальна валідація або переформування ходів replay перед embedded runner                                       | Transport провайдера потребує суворішої валідації ходів після загальної санації                                                              |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать провайдеру                                             | Провайдеру потрібна телеметрія або стан, що належить провайдеру, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім переходять до інших Plugin провайдерів, що підтримують hooks,
доки один із них справді не змінить model id або transport/config. Це дає змогу
shim-провайдерам alias/compat працювати без необхідності для виклику знати, який
bundled Plugin володіє цим перезаписом. Якщо жоден hook провайдера не переписує
підтримуваний запис config сімейства Google, bundled normalizer config Google
усе одно застосовує це очищення для сумісності.

Якщо провайдеру потрібен повністю кастомний wire protocol або кастомний executor запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки провайдера,
яка все ще працює в межах звичайного циклу інференсу OpenClaw.

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

Bundled Plugin провайдерів поєднують наведені вище hooks, щоб відповідати потребам кожного постачальника щодо catalog,
auth, thinking, replay і usage. Авторитетний набір hooks знаходиться разом
з кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально повторює список.

<AccordionGroup>
  <Accordion title="Провайдери catalog із наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    model id раніше за статичний catalog OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном token і інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають змогу провайдерам підключатися
    до політики transcript через `buildReplayPolicy` замість того, щоб кожен Plugin
    заново реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл інференсу.
  </Accordion>
  <Accordion title="Специфічні для Anthropic helper-и stream">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічного seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime helper-и

Plugin можуть отримувати доступ до вибраних helper-ів core через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS core для поверхонь файлів/voice note.
- Використовує config core `messages.tts` і вибір провайдера.
- Повертає PCM audio buffer + частоту дискретизації. Plugin мають виконувати resample/encode для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для picker-ів голосів або сценаріїв setup, що належать постачальнику.
- Списки голосів можуть містити багатші metadata, такі як locale, gender і теги personality для picker-ів, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

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

- Зберігайте політику TTS, fallback і доставку reply у core.
- Використовуйте провайдерів мовлення для поведінки synthesis, що належить постачальнику.
- Застарілий вхід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння — орієнтована на компанію: один Plugin постачальника може володіти
  text, speech, image і майбутніми media-провайдерами, коли OpenClaw додаватиме ці
  контракти можливостей.

Для розуміння image/audio/video Plugin реєструють один типізований
провайдер media-understanding замість загального key/value bag:

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

- Зберігайте orchestration, fallback, config і wiring каналів у core.
- Зберігайте поведінку постачальника в Plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливості та runtime helper
  - Plugin постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel Plugin споживають `api.runtime.videoGeneration.*`

Для runtime helper-ів media-understanding Plugin можуть викликати:

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
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — бажана спільна поверхня для
  розуміння image/audio/video.
- Використовує audio config core media-understanding (`tools.media.audio`) і порядок fallback провайдерів.
- Повертає `{ text: undefined }`, коли не було створено жодного результату транскрибування (наприклад, для пропущеного/непідтримуваного входу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності.

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

- `provider` і `model` — це необов’язкові override для окремого запуску, а не постійні зміни session.
- OpenClaw враховує ці поля override лише для довірених викликів.
- Для fallback-запусків, що належать Plugin, оператори мають явно ввімкнути це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски subagent із недовірених Plugin усе ще працюють, але запити override відхиляються, а не тихо переходять на fallback.
- Session subagent, створені Plugin, позначаються id Plugin, що їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці session, якими він володіє; довільне видалення session, як і раніше, потребує запиту Gateway з областю admin.

Для web search Plugin можуть використовувати спільний runtime helper замість
проникнення у wiring інструмента агента:

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

Plugin також можуть реєструвати провайдерів web search через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір провайдера, визначення credentials і спільну семантику запитів у core.
- Використовуйте провайдерів web search для transport, специфічного для постачальника.
- `api.runtime.webSearch.*` — бажана спільна поверхня для feature/channel Plugin, яким потрібна поведінка пошуку без залежності від wrapper інструмента агента.

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

- `generate(...)`: згенерувати зображення, використовуючи налаштований ланцюжок провайдерів генерації зображень.
- `listProviders(...)`: перелічити доступних провайдерів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

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

Поля маршруту:

- `path`: шлях маршруту в HTTP-сервері gateway.
- `auth`: обов’язкове поле. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/webhook verification, якими керує Plugin.
- `match`: необов’язкове поле. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове поле. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертає `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було видалено, і воно спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Використовуйте ланцюжки fallthrough `exact`/`prefix` лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime scopes оператора. Вони призначені для webhook/signature verification, якими керує Plugin, а не для привілейованих helper-викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно є консервативним:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршруту Plugin на рівні `operator.write`, навіть якщо виклик надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю виклику (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з gateway-auth є неявною поверхнею admin. Якщо вашому маршруту потрібна поведінка лише для admin, вимагайте режим auth з ідентичністю виклику та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових Plugin використовуйте вузькі підшляхи SDK замість
монолітного root-barrel `openclaw/plugin-sdk`. Основні підшляхи:

| Підшлях                            | Призначення                                       |
| ---------------------------------- | ------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | helper-и entry/build для каналів                  |
| `openclaw/plugin-sdk/core`          | Загальні спільні helper-и та umbrella contract    |
| `openclaw/plugin-sdk/config-schema` | Zod schema кореневого `openclaw.json` (`OpenClawSchema`) |

Плагіни каналів вибирають із сімейства вузьких seam-ів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
в одному контракті `approvalCapability`, а не змішувати між не пов’язаними
полями Plugin. Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).

Runtime і config helper-и живуть у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших Plugin. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного bundled Plugin):

- `index.js` — entry bundled Plugin
- `api.js` — barrel helper-ів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — entry setup Plugin

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із core або з іншого Plugin.
Точки входу, завантажені через facade, надають перевагу активному snapshot runtime config, якщо він існує,
а потім повертаються до визначеного config file на диску.

Підшляхи, специфічні для можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують, тому що bundled Plugin уже використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin мають володіти внесками до схем `describeMessageTool(...)`, специфічними для каналів,
для немеседжних примітивів, таких як реакції, прочитання й опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`,
а не нативні для провайдера поля buttons, component, block або card.
Див. [Message Presentation](/uk/plugins/message-presentation) для опису контракту,
правил fallback, мапінгу провайдерів і контрольного списку для авторів Plugin.

Плагіни, здатні надсилати повідомлення, оголошують, що саме вони можуть відтворювати, через message capabilities:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів pinned-delivery

Core вирішує, чи відтворювати presentation нативно, чи знижувати його до тексту.
Не відкривайте нативні UI-escape hatch постачальника через загальний інструмент повідомлень.
Застарілі helper-и SDK для legacy native schemas лишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Визначення цільового каналу

Плагіни каналів мають володіти семантикою цілей, специфічною для каналів. Зберігайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` визначає, чи слід нормалізовану ціль
  трактувати як `direct`, `group` або `channel` до lookup у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  слід одразу перейти до визначення на кшталт id, замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` — це fallback Plugin, коли
  core потрібне остаточне визначення, що належить провайдеру, після нормалізації або
  після промаху в directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою route session, специфічною для провайдера,
  після того як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорії, які мають прийматися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок типу «трактувати це як явний/нативний id цілі».
- Використовуйте `resolveTarget` для fallback нормалізації, специфічного для провайдера, а не для
  широкого пошуку в directory.
- Тримайте нативні id провайдера, як-от chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в загальних полях SDK.

## Directory на основі config

Plugin, які виводять записи directory з config, мають тримати цю логіку всередині
Plugin і повторно використовувати спільні helper-и з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі config, наприклад:

- DM peers на основі allowlist
- налаштовані мапи channel/group
- статичні fallback-и directory з прив’язкою до account

Спільні helper-и в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запиту
- застосування ліміту
- helper-и deduping/normalization
- побудову `ChannelDirectoryEntry[]`

Специфічні для каналу перевірка account і нормалізація id мають залишатися в реалізації Plugin.

## Catalog провайдерів

Plugin провайдерів можуть визначати catalogs моделей для інференсу через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє model id, base URL
defaults або metadata моделей, що залежать від auth.

`catalog.order` керує тим, коли catalog Plugin зливається відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: провайдери зі звичайним API key або env
- `profile`: провайдери, які з’являються, коли існують auth profiles
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають при колізії ключів, тому Plugin можуть навмисно
перевизначати вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Канал лише для читання

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поряд із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Він може припускати, що credentials
  повністю матеріалізовані, і швидко завершуватися з помилкою, коли потрібні secrets відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки
  doctor/config repair, не повинні матеріалізовувати runtime credentials лише для
  опису config.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан account.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу credentials, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення token лише для повідомлення про доступність у режимі лише читання.
  Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела)
  для команд у стилі status.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  воно недоступне в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди» замість аварійного завершення або помилкового повідомлення, що account не налаштовано.

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

Кожен entry стає Plugin. Якщо pack містить кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm dependencies, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен entry в `openclaw.extensions` має залишатися в межах каталогу Plugin
після визначення symlink. Entries, що виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності Plugin через
локальний для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies у runtime), ігноруючи успадковані глобальні налаштування npm install.
Підтримуйте дерева залежностей Plugin «чистими JS/TS» і уникайте пакетів, яким потрібні
збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потрібні поверхні setup для вимкненого плагіна каналу або
коли плагін каналу ввімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повного entry Plugin. Це робить startup і setup легшими,
коли ваш основний entry Plugin також підключає tools, hooks або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести плагін каналу на той самий шлях `setupEntry` під час
фази startup gateway до `listen`, навіть коли канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню startup, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що entry setup
має зареєструвати кожну можливість, що належить каналу і від якої залежить startup, наприклад:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які методи gateway, tools або services, які мають існувати в цей самий проміжок

Якщо ваш повний entry усе ще володіє будь-якою потрібною можливістю startup, не вмикайте
цей прапорець. Залиште для Plugin типову поведінку й дозвольте OpenClaw завантажити
повний entry під час startup.

Bundled channels також можуть публікувати helper-и поверхні контракту лише для setup, які core
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно просунути застарілий config
однокористувацького каналу в `channels.<id>.accounts.*` без завантаження повного entry Plugin.
Поточний bundled-приклад — Matrix: він переносить у
іменований просунутий account лише ключі auth/bootstrap, коли іменовані accounts уже існують, і може
зберегти налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapters зберігають lazy-виявлення bundled contract-surface. Час імпорту
залишається малим; поверхня просування завантажується лише під час першого використання, замість
повторного входу в startup bundled channel під час імпорту модуля.

Коли ці поверхні startup включають Gateway RPC methods, тримайте їх на
специфічному для Plugin префіксі. Простори імен admin у core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) лишаються зарезервованими й завжди визначаються
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

### Metadata catalog каналу

Плагіни каналів можуть оголошувати metadata setup/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дає змогу зберігати дані core catalog вільними від даних.

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
      "blurb": "Самостійно розгорнутий чат через webhook-ботів Nextcloud Talk.",
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

- `detailLabel`: вторинна мітка для багатших поверхонь catalog/status
- `docsLabel`: перевизначає текст посилання для посилання на docs
- `preferOver`: id Plugin/каналу нижчого пріоритету, які цей запис catalog має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом на поверхні вибору
- `markdownCapable`: позначає канал як сумісний з Markdown для рішень щодо outbound formatting
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних picker-ів setup/configure, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації docs
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: додає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки account, навіть коли існує лише один account
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку session під час визначення announce targets

OpenClaw також може зливати **зовнішні channel catalogs** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділювачі — кома/крапка з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи channel catalog і записи install catalog провайдерів відкривають
нормалізовані факти install-source поруч із сирим блоком `openclaw.install`. Нормалізовані
факти визначають, чи є npm spec точною версією або плаваючим селектором,
чи присутні очікувані metadata цілісності, і чи доступний також локальний шлях до джерела.
Коли відома ідентичність catalog/package, нормалізовані факти попереджають, якщо
розібране ім’я npm-пакета відхиляється від цієї ідентичності. Вони також
попереджають, коли `defaultChoice` є невалідним або вказує на джерело, яке
недоступне, і коли metadata цілісності npm присутні без валідного npm
джерела. Споживачі мають трактувати `installSource` як адитивне необов’язкове поле, щоб
вручну зібрані записи й shims catalog не були змушені його синтезувати.
Це дає змогу onboarding і діагностиці пояснювати стан source-plane без
імпорту runtime Plugin.

Офіційні зовнішні записи npm мають надавати перевагу точному `npmSpec` разом із
`expectedIntegrity`. Голі імена пакетів і dist-tag-и все ще працюють для
сумісності, але вони показують попередження source-plane, щоб catalog міг
рухатися до pinned- і integrity-checked-встановлень без руйнування наявних Plugin.
Коли onboarding встановлює з локального шляху catalog, він записує запис індексу
керованого Plugin з `source: "path"` і відносним до workspace
`sourcePath`, коли це можливо. Абсолютний робочий шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції
в довготривалому config. Це зберігає видимість локальних встановлень розробки для
діагностики source-plane без додавання другої поверхні розкриття сирих шляхів файлової системи.
Постійний індекс Plugin `plugins/installs.json` є джерелом істини для install
і може оновлюватися без завантаження runtime modules Plugin.
Його мапа `installRecords` є довговічною, навіть коли маніфест Plugin відсутній або
невалідний; його масив `plugins` — це відновлюваний вигляд manifest/cache.

## Plugin рушія контексту

Плагіни рушія контексту володіють orchestration контексту session для ingest, assembly
і Compaction. Реєструйте їх зі свого Plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати memory search або hooks.

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

Якщо ваш рушій **не** володіє алгоритмом Compaction, залишайте `compact()`
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

Коли Plugin потрібна поведінка, яка не вписується в поточний API, не обходьте
систему Plugin через приватне глибоке втручання. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, merge config,
   lifecycle, channel-facing semantics і форму runtime helper.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть core + споживачів channel/feature
   Канали й feature Plugin мають споживати нову можливість через core,
   а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Потім Plugin постачальників реєструють свої backend-и для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації з часом залишалася явною.

Саме так OpenClaw залишається opinionated, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і готового прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом зачіпати такі
поверхні:

- типи контракту core у `src/<capability>/types.ts`
- runner/runtime helper core у `src/<capability>/runtime.ts`
- поверхню реєстрації API Plugin у `src/plugins/types.ts`
- підключення реєстру Plugin у `src/plugins/registry.ts`
- відкриття runtime Plugin у `src/plugins/runtime/*`, коли feature/channel
  Plugin мають її споживати
- helper-и capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- docs для операторів/Plugin у `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака того, що можливість
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

Це зберігає правило простим:

- core володіє контрактом можливості + orchestration
- Plugin постачальників володіють реалізаціями постачальників
- feature/channel Plugin споживають runtime helper-и
- тести контракту зберігають володіння явним

## Пов’язані матеріали

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
