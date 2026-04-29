---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, хуки середовища виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-04-29T03:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24f6b5d20bbd7f0f33e8e6bcbd9b0769e7e7c335530e19c4b85f60cb3b5b070e
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin і контрактів володіння/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка є довідником з внутрішньої механіки: конвеєр завантаження, registry, runtime hooks, HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів Plugin
2. читає нативні або сумісні маніфести bundle і метадані package
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled modules використовують нативний loader;
   незібрані нативні Plugin використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в registry Plugin
8. відкриває registry для команд/runtime поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає наявний варіант (`def.register ?? def.activate`) і викликає його в тій самій точці. Усі bundled Plugin використовують `register`; для нових Plugin віддавайте перевагу `register`.
</Note>

Запобіжні перевірки виконуються **до** runtime-виконання. Кандидатів блокують,
коли entry виходить за межі кореня Plugin, шлях є world-writable або володіння
шляхом виглядає підозріло для небандлених Plugin.

### Поведінка manifest-first

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/placeholder-и Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є data-plane частиною. Він реєструє
фактичну поведінку, як-от hooks, tools, commands або provider flows.

Необовʼязкові блоки маніфесту `activation` і `setup` залишаються на control plane.
Це metadata-only дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту для команд, каналів і provider,
щоб звузити завантаження Plugin перед ширшою матеріалізацією registry:

- завантаження CLI звужується до Plugin, які володіють запитаною primary command
- налаштування каналу/визначення Plugin звужується до Plugin, які володіють запитаним
  channel id
- явне налаштування provider/runtime resolution звужується до Plugin, які володіють запитаним
  provider id
- планування запуску Gateway використовує `activation.onStartup` для явних startup
  imports і startup opt-outs; кожен Plugin має оголошувати це, оскільки OpenClaw
  відходить від неявних startup imports, тоді як Plugin без статичних
  метаданих можливостей і без `activation.onStartup` досі використовують
  застарілий неявний startup sidecar fallback для сумісності

Планувальник активації надає і API лише з ids для наявних callers, і
plan API для нових diagnostics. Plan entries повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback на основі володіння в маніфесті,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Такий поділ причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти broad hints
або fallback-поведінку без зміни семантики runtime loading.

Виявлення setup тепер віддає перевагу descriptor-owned ids, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити candidate Plugin перед fallback до
`setup-api` для Plugin, яким досі потрібні setup-time runtime hooks. Списки
налаштування provider використовують маніфест `providerAuthChoices`, setup
choices, отримані з descriptors, і install-catalog metadata без завантаження provider runtime. Явне
`setup.requiresRuntime: false` є descriptor-only cutoff; пропущене
`requiresRuntime` зберігає legacy setup-api fallback для сумісності. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований setup provider або CLI
backend id, setup lookup відхиляє неоднозначного власника замість покладатися на
порядок виявлення. Коли setup runtime все ж виконується, registry diagnostics повідомляє
drift між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, не блокуючи legacy Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані manifest registry
за wall-clock вікнами. Встановлення, редагування маніфесту й зміни load-path
мають ставати видимими під час наступного явного читання metadata або rebuild snapshot.

Безпечний швидкий шлях metadata — це явне володіння обʼєктом, а не прихований cache.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`,
похідний `PluginLookUpTable` або явний manifest registry через call
chain. Перевірка конфігурації, startup auto-enable, bootstrap Plugin і вибір provider
можуть повторно використовувати ці обʼєкти, доки вони представляють поточну конфігурацію та
інвентар Plugin. Setup lookup досі реконструює metadata маніфесту на вимогу,
якщо конкретний setup path не отримує явний manifest registry; зберігайте це
як cold-path fallback, а не додавайте приховані lookup caches. Коли input
змінюється, перебудуйте й замініть snapshot замість мутувати його або зберігати
історичні копії.
Views над активним registry Plugin і bundled channel bootstrap helpers
мають переобчислюватися з поточного registry/root. Короткоживучі maps прийнятні
всередині одного call для dedupe роботи або захисту reentry; вони не мають ставати process
metadata caches.

Для завантаження Plugin постійний cache layer — це runtime loading. Він може повторно використовувати
стан loader, коли code або installed artifacts фактично завантажені, наприклад:

- `PluginLoaderCacheState` і сумісні active runtime registries
- jiti/module caches і public-surface loader caches, що використовуються, щоб уникати повторного імпорту
  тієї самої runtime surface
- runtime dependency mirrors і filesystem caches для installed plugin
  artifacts
- короткоживучі per-call maps для нормалізації шляхів або duplicate resolution

Ці caches є data-plane деталями реалізації. Вони не мають відповідати на
control-plane питання, як-от "який Plugin володіє цим provider?", якщо caller
навмисно не попросив runtime loading.

Не додавайте постійні або wall-clock caches для:

- результатів виявлення
- прямих manifest registries
- manifest registries, реконструйованих з installed plugin index
- provider owner lookup, model suppression, provider policy або public-artifact
  metadata
- будь-якої іншої відповіді, похідної від маніфесту, де змінений маніфест, installed index
  або load path має бути видимим під час наступного metadata read

Callers, які перебудовують manifest metadata з persisted installed plugin
index, реконструюють цей registry на вимогу. Installed index є durable
source-plane state; це не прихований in-process metadata cache.

## Модель registry

Завантажені Plugin не мутують довільні core globals напряму. Вони реєструються в
центральний registry Plugin.

Registry відстежує:

- записи Plugin (identity, source, origin, status, diagnostics)
- tools
- legacy hooks і typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands, якими володіють Plugin

Після цього core features читають із цього registry замість прямого звернення до Plugin modules.
Це зберігає одностороннє завантаження:

- plugin module -> registry registration
- core runtime -> registry consumption

Це розділення важливе для супроводу. Воно означає, що більшості core surfaces потрібна лише
одна integration point: "читати registry", а не "особливо обробляти кожен Plugin
module".

## Callback-и привʼязки розмови

Plugin, які привʼязують розмову, можуть реагувати, коли approval resolved.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як bind
request схвалено або відхилено:

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
- `binding`: resolved binding для approved requests
- `request`: original request summary, detach hint, sender id і
  conversation metadata

Цей callback призначений лише для сповіщення. Він не змінює, кому дозволено привʼязувати
розмову, і виконується після завершення core approval handling.

## Runtime hooks provider

Provider Plugin мають три шари:

- **Manifest metadata** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 optional hooks, що покривають auth, model resolution,
  stream wrapping, thinking levels, replay policy і usage endpoints. Див.
  повний список у [Порядок і використання hook](#hook-order-and-usage).

OpenClaw досі володіє generic agent loop, failover, transcript handling і
tool policy. Ці hooks є extension surface для provider-specific
поведінки без потреби в повністю custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли provider має env-based
credentials, які generic auth/status/model-picker paths мають бачити без
завантаження plugin runtime. Deprecated `providerAuthEnvVars` досі читається
compatibility adapter під час deprecation window, а non-bundled Plugin,
які його використовують, отримують manifest diagnostic. Використовуйте маніфест `providerAuthAliases`,
коли один provider id має повторно використовувати env vars, auth profiles,
config-backed auth і API-key onboarding choice іншого provider id. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI surfaces мають знати
provider choice id, group labels і просте one-flag auth wiring без
завантаження provider runtime. Зберігайте provider runtime
`envVars` для operator-facing hints, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли channel має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження channel runtime.

### Порядок і використання hook

Для model/provider Plugin OpenClaw викликає hooks приблизно в такому порядку.
Стовпець "Коли використовувати" є коротким decision guide.

| #   | Хук                               | Що робить                                                                                                     | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                         | Провайдер має власний каталог або стандартні значення базової URL-адреси                                                                      |
| 2   | `applyConfigDefaults`             | Застосовує належні провайдеру глобальні стандартні значення конфігурації під час матеріалізації конфігурації   | Стандартні значення залежать від режиму автентифікації, середовища або семантики сімейства моделей провайдера                                 |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                      | _(не Plugin-хук)_                                                                                                                             |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми ідентифікаторів моделей перед пошуком                             | Провайдер відповідає за очищення псевдонімів перед канонічним визначенням моделі                                                              |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                           | Провайдер відповідає за очищення транспорту для власних ідентифікаторів провайдера в тому самому транспортному сімействі                     |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                       | Провайдеру потрібне очищення конфігурації, яке має жити з Plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує переписування сумісності нативного використання streaming до провайдерів конфігурації              | Провайдеру потрібні виправлення метаданих нативного використання streaming, керовані endpoint                                                |
| 7   | `resolveConfigApiKey`             | Визначає автентифікацію через маркер середовища для провайдерів конфігурації перед завантаженням runtime-автентифікації | Провайдер має власне визначення API-ключа через маркер середовища; `amazon-bedrock` також має тут вбудований AWS-резолвер маркерів середовища |
| 8   | `resolveSyntheticAuth`            | Показує локальну/self-hosted або підкріплену конфігурацією автентифікацію без збереження plaintext            | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Накладає належні провайдеру зовнішні профілі автентифікації; стандартне `persistence` — `runtime-only` для облікових даних, якими володіє CLI/застосунок | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh-токенів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів після автентифікації, підкріпленої середовищем/конфігурацією | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають отримувати пріоритет                                                          |
| 11  | `resolveDynamicModel`             | Синхронний fallback для належних провайдеру ідентифікаторів моделей, яких ще немає в локальному реєстрі       | Провайдер приймає довільні upstream-ідентифікатори моделей                                                                                    |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` запускається знову                                     | Провайдеру потрібні мережеві метадані перед визначенням невідомих ідентифікаторів                                                            |
| 13  | `normalizeResolvedModel`          | Остаточне переписування перед тим, як вбудований runner використає визначену модель                           | Провайдеру потрібні транспортні переписування, але він усе ще використовує core-транспорт                                                     |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей постачальника за іншим сумісним транспортом                             | Провайдер розпізнає власні моделі на proxy-транспортах, не перебираючи провайдера на себе                                                     |
| 15  | `capabilities`                    | Належні провайдеру метадані transcript/tooling, які використовує спільна core-логіка                          | Провайдеру потрібні особливості transcript/сімейства провайдера                                                                               |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                     | Провайдеру потрібне очищення схем транспортного сімейства                                                                                     |
| 17  | `inspectToolSchemas`              | Показує належну провайдеру діагностику схем після нормалізації                                                | Провайдер хоче попередження щодо ключових слів без навчання core правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт reasoning-output: нативний або з тегами                                                      | Провайдеру потрібне reasoning/фінальний вивід із тегами замість нативних полів                                                                |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів stream                                  | Провайдеру потрібні стандартні параметри запиту або очищення параметрів для окремого провайдера                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним транспортом                                                    | Провайдеру потрібен власний wire-протокол, а не лише обгортка                                                                                 |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних обгорток                                                         | Провайдеру потрібні обгортки сумісності заголовків/тіла/моделі запиту без власного транспорту                                                 |
| 22  | `resolveTransportTurnState`       | Додає нативні транспортні заголовки або метадані для кожного turn                                             | Провайдер хоче, щоб загальні транспорти надсилали нативну для провайдера ідентичність turn                                                    |
| 23  | `resolveWebSocketSessionPolicy`   | Додає нативні WebSocket-заголовки або політику cool-down сеансу                                               | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сеансу або fallback-політику                                               |
| 24  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                              | Провайдер зберігає додаткові метадані автентифікації та потребує власної форми runtime-токена                                                 |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для власних endpoint refresh або політики помилок refresh                        | Провайдер не вписується у спільні refreshers `pi-ai`                                                                                          |
| 26  | `buildAuthDoctorHint`             | Підказка ремонту, що додається, коли OAuth refresh завершується помилкою                                      | Провайдеру потрібні належні провайдеру вказівки з ремонту автентифікації після помилки refresh                                                |
| 27  | `matchesContextOverflowError`     | Належний провайдеру matcher переповнення контекстного вікна                                                   | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                  |
| 28  | `classifyFailoverReason`          | Належна провайдеру класифікація причини failover                                                              | Провайдер може відображати сирі помилки API/транспорту на rate-limit/overload тощо                                                           |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                          | Провайдеру потрібне proxy-специфічне обмеження TTL кешу                                                                                       |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення для відсутньої автентифікації                                      | Провайдеру потрібна специфічна для провайдера підказка відновлення відсутньої автентифікації                                                  |
| 31  | `suppressBuiltInModel`            | Застаріло. Runtime-хук більше не викликається; використовуйте `modelCatalog.suppressions` маніфесту           | Історичний хук для приховування застарілих upstream-рядків; зберігайте нові дані приглушення в маніфесті Plugin                              |
| 32  | `augmentModelCatalog`             | Синтетичні/остаточні рядки каталогу, додані після discovery                                                   | Провайдеру потрібні синтетичні forward-compat рядки у `models list` і засобах вибору                                                          |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, display labels і стандартне значення для конкретної моделі                             | Провайдер надає власну драбину thinking або бінарну мітку для вибраних моделей                                                                |
| 34  | `isBinaryThinking`                | Хук сумісності для перемикача reasoning on/off                                                                | Провайдер надає лише бінарний thinking on/off                                                                                                 |
| 35  | `supportsXHighThinking`           | Хук сумісності підтримки reasoning `xhigh`                                                                    | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності стандартного рівня `/think`                                                                    | Провайдер володіє стандартною політикою `/think` для сімейства моделей                                                                        |
| 37  | `isModernModelRef`                | Зіставлення сучасних моделей для фільтрів live-профілів і вибору smoke-тестів                                  | Провайдер відповідає за зіставлення бажаних моделей для live/smoke                                                                             |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед інференсом               | Провайдеру потрібен обмін токена або короткочасні облікові дані запиту                                                                         |
| 39  | `resolveUsageAuth`                | Визначає облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь статусу                        | Провайдеру потрібен власний розбір токена використання/квоти або інші облікові дані використання                                               |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує специфічні для провайдера знімки використання/квоти після визначення автентифікації       | Провайдеру потрібна специфічна для нього кінцева точка використання або парсер payload                                                        |
| 41  | `createEmbeddingProvider`         | Створює керований провайдером адаптер embedding для пам’яті/пошуку                                             | Поведінка embedding пам’яті належить Plugin провайдера                                                                                        |
| 42  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою транскрипту для провайдера                                         | Провайдеру потрібна власна політика транскрипту (наприклад, видалення блоків мислення)                                                        |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення транскрипту                                                 | Провайдеру потрібні специфічні для нього перезаписи replay понад спільні допоміжні засоби compaction                                           |
| 44  | `validateReplayTurns`             | Остаточна валідація або переформування replay-turn перед вбудованим runner                                     | Транспорту провайдера потрібна суворіша валідація turn після загальної санітизації                                                            |
| 45  | `onModelSelected`                 | Виконує керовані провайдером побічні ефекти після вибору                                                       | Провайдеру потрібна телеметрія або керований провайдером стан, коли модель стає активною                                                      |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний provider plugin, а потім переходять до інших provider plugins із підтримкою хуків,
доки якийсь із них справді не змінить model id або transport/config. Це зберігає
працездатність alias/compat provider shim без вимоги до викликача знати, який
bundled plugin відповідає за rewrite. Якщо жоден provider hook не переписує підтримуваний
запис конфігурації Google-family, bundled нормалізатор конфігурації Google все одно застосовує
це сумісне очищення.

Якщо провайдеру потрібен повністю власний wire protocol або власний request executor,
це інший клас розширення. Ці хуки призначені для поведінки провайдера,
яка все ще виконується у звичайному inference loop OpenClaw.

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

Bundled provider plugins поєднують наведені вище хуки, щоб адаптуватися до catalog,
auth, thinking, replay і usage потреб кожного постачальника. Авторитетний набір хуків міститься
в кожному plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркалить список.

<AccordionGroup>
  <Accordion title="Провайдери з passthrough catalog">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    model ids раніше за статичний catalog OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint для usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти token exchange та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    transcript policy через `buildReplayPolicy` замість того, щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише з catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний inference loop.
  </Accordion>
  <Accordion title="Stream helpers, специфічні для Anthropic">
    Beta headers, `/fast` / `serviceTier` і `context1m` містяться всередині
    публічного seam `api.ts` / `contract-api.ts` Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugins можуть отримувати доступ до вибраних core helpers через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний core TTS output payload для file/voice-note surfaces.
- Використовує core конфігурацію `messages.tts` і вибір провайдера.
- Повертає PCM audio buffer + sample rate. Plugins мають виконувати resample/encode для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для vendor-owned voice pickers або setup flows.
- Списки голосів можуть містити багатші metadata, як-от locale, gender і personality tags для provider-aware pickers.
- OpenAI і ElevenLabs наразі підтримують telephony. Microsoft не підтримує.

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

- Залишайте TTS policy, fallback і delivery відповіді в core.
- Використовуйте speech providers для vendor-owned synthesis behavior.
- Legacy вхід Microsoft `edge` нормалізується до provider id `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor plugin може володіти
  text, speech, image і future media providers у міру того, як OpenClaw додає ці
  capability contracts.

Для image/audio/video understanding plugins реєструють один typed
media-understanding provider замість generic key/value bag:

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

- Залишайте orchestration, fallback, config і channel wiring у core.
- Залишайте vendor behavior у provider plugin.
- Additive expansion має залишатися typed: нові optional methods, нові optional
  result fields, нові optional capabilities.
- Video generation уже використовує той самий pattern:
  - core володіє capability contract і runtime helper
  - vendor plugins реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins використовують `api.runtime.videoGeneration.*`

Для media-understanding runtime helpers plugins можуть викликати:

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

Для audio transcription plugins можуть використовувати або media-understanding runtime,
або старіший STT alias:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` є бажаною shared surface для
  image/audio/video understanding.
- Використовує core media-understanding audio configuration (`tools.media.audio`) і provider fallback order.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, пропущений/непідтримуваний input).
- `api.runtime.stt.transcribeAudioFile(...)` залишається compatibility alias.

Plugins також можуть запускати background subagent runs через `api.runtime.subagent`:

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

- `provider` і `model` є optional per-run overrides, а не persistent session changes.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для plugin-owned fallback runs оператори мають увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються замість silent fallback.
- Plugin-created subagent sessions позначаються id plugin, що їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session усе ще потребує admin-scoped Gateway request.

Для web search plugins можуть використовувати shared runtime helper замість
звертання до agent tool wiring:

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

Plugins також можуть реєструвати web-search providers через
`api.registerWebSearchProvider(...)`.

Примітки:

- Залишайте provider selection, credential resolution і shared request semantics у core.
- Використовуйте web-search providers для vendor-specific search transports.
- `api.runtime.webSearch.*` є бажаною shared surface для feature/channel plugins, яким потрібна search behavior без залежності від agent tool wrapper.

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

- `generate(...)`: згенерувати зображення за допомогою налаштованого image-generation provider chain.
- `listProviders(...)`: перелічити доступні image-generation providers та їхні capabilities.

## Gateway HTTP routes

Plugins можуть відкривати HTTP endpoints за допомогою `api.registerHttpRoute(...)`.

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

- `path`: route path під gateway HTTP server.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну gateway auth, або `"plugin"` для plugin-managed auth/webhook verification.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну route registration.
- `handler`: поверніть `true`, коли route обробив request.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і воно спричинить помилку завантаження плагіна. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один плагін не може замінити маршрут іншого плагіна.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Тримайте ланцюжки пропускання `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують операторські runtime scopes автоматично. Вони призначені для webhook-ів/перевірки підписів, керованих плагіном, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer-автентифікація зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршрутів плагіна зафіксованими на `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах до маршрутів плагіна з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не вважайте, що маршрут плагіна з gateway-auth є неявною адміністративною поверхнею. Якщо ваш маршрут потребує поведінки лише для адміністраторів, вимагайте режим auth з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk`
під час створення нових плагінів. Основні підшляхи:

| Підшлях                             | Призначення                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/побудови каналу                        |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та парасольковий контракт       |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Плагіни каналів вибирають із родини вузьких стиків — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між непов’язаними
полями плагіна. Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації розміщені у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого сумісного barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими сумісними shim-ами для
старіших плагінів. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного вбудованого плагіна):

- `index.js` — точка входу вбудованого плагіна
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup-плагіна

Зовнішні плагіни мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета плагіна з core або з іншого плагіна.
Точки входу, завантажені через facade, надають перевагу активному знімку runtime-конфігурації, коли він
існує, а потім повертаються до розв’язаного файлу конфігурації на диску.

Підшляхи для конкретних можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують тому, що вбудовані плагіни використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну сторінку
довідника SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Плагіни мають володіти внесками до специфічної для каналу схеми `describeMessageTool(...)`
для немеседжевих примітивів, таких як реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість provider-native полів кнопок, компонентів, блоків або карток.
Див. [Представлення повідомлень](/uk/plugins/message-presentation) для контракту,
правил fallback, зіставлення провайдерів і контрольного списку автора плагіна.

Плагіни з можливістю надсилання оголошують, що вони можуть рендерити, через можливості повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи рендерити представлення нативно, чи деградувати його до тексту.
Не відкривайте provider-native escape hatch-и UI із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy нативних схем залишаються експортованими для наявних
сторонніх плагінів, але нові плагіни не мають їх використовувати.

## Розв’язання цілей каналу

Плагіни каналів мають володіти специфічною для каналу семантикою цілей. Тримайте спільний
outbound-хост загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід нормалізовану ціль
  трактувати як `direct`, `group` або `channel` перед пошуком у каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи має
  вхідне значення переходити одразу до id-подібного розв’язання замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є fallback-ом плагіна, коли
  core потребує остаточного розв’язання, яке належить провайдеру, після нормалізації або після
  промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою специфічного для провайдера маршруту
  сеансу після розв’язання цілі.

Рекомендований розподіл:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають відбуватися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний id цілі".
- Використовуйте `resolveTarget` для специфічного для провайдера fallback нормалізації, а не для
  широкого пошуку в каталозі.
- Тримайте provider-native ids, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або специфічних для провайдера параметрів, а не в загальних
  полях SDK.

## Каталоги на основі конфігурації

Плагіни, які виводять записи каталогу з конфігурації, мають тримати цю логіку в
плагіні та повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли канал потребує peers/groups на основі конфігурації, таких як:

- DM peers, керовані allowlist
- налаштовані мапи channels/groups
- статичні fallback-и каталогу в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрування запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Специфічна для каналу перевірка облікового запису та нормалізація id мають залишатися в
реалізації плагіна.

## Каталоги провайдерів

Плагіни провайдерів можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли плагін володіє специфічними для провайдера ids моделей, типовими
base URL або метаданими моделей, захищеними auth.

`catalog.order` контролює, коли каталог плагіна зливається відносно
вбудованих implicit providers OpenClaw:

- `simple`: прості провайдери, керовані API-key або env
- `profile`: провайдери, що з’являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших implicit providers

Пізніші провайдери перемагають у разі колізії ключів, тому плагіни можуть навмисно перевизначити
вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy-псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only перевірка каналу

Якщо ваш плагін реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` є runtime-шляхом. Йому дозволено припускати, що credentials
  повністю матеріалізовані, і швидко завершуватися помилкою, коли бракує обов’язкових секретів.
- Read-only шляхи команд, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/config
  repair не мають потребувати матеріалізації runtime credentials лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу credentials, коли доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення token лише для повідомлення read-only
  доступності. Повернення `tokenStatus: "available"` (і відповідного поля source)
  достатньо для status-style команд.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  недоступний у поточному шляху команди.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому шляху
команди" замість аварійного завершення або помилкового звітування, що обліковий запис не налаштований.

## Пакети packages

Каталог плагіна може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен запис стає плагіном. Якщо pack перелічує кілька extensions, plugin id
стає `name/<fileBase>`.

Якщо ваш плагін імпортує npm deps, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисний бар’єр безпеки: кожен запис `openclaw.extensions` має залишатися всередині каталогу плагіна
після розв’язання symlink. Записи, що виходять за межі каталогу пакета,
відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності плагіна за допомогою
локального для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей плагіна "pure JS/TS" і уникайте пакетів, що потребують
`postinstall` builds.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий setup-only модуль.
Коли OpenClaw потребує setup-поверхонь для вимкненого плагіна каналу або
коли плагін каналу ввімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу плагіна. Це полегшує запуск і setup,
коли основна точка входу вашого плагіна також підключає інструменти, hooks або інший runtime-only
код.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести плагін каналу на той самий шлях `setupEntry` під час фази startup перед прослуховуванням gateway,
навіть коли канал уже налаштований.

Використовуйте це лише коли `setupEntry` повністю покриває startup-поверхню, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має зареєструвати кожну можливість, що належить каналу і від якої залежить startup, зокрема:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, що мають бути доступні до того, як gateway почне слухати
- будь-які методи, інструменти або сервіси gateway, що мають існувати протягом того самого вікна

Якщо ваша повна точка входу досі володіє будь-якою обов’язковою startup capability, не вмикайте
цей прапорець. Залиште плагін на типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час startup.

Вбудовані канали також можуть публікувати setup-only допоміжні засоби contract-surface, які core
може консультувати до завантаження повного runtime каналу. Поточна поверхня
promotion для setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно підвищити застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного входу плагіна. Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового завантаження до іменованого підвищеного облікового запису, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають ліниве виявлення вбудованої контрактної поверхні. Час імпорту залишається легким; поверхня підвищення завантажується лише під час першого використання, замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці стартові поверхні містять методи gateway RPC, тримайте їх на префіксі, специфічному для плагіна. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до `operator.admin`, навіть якщо плагін запитує вужчу область.

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

Плагіни каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` та підказки встановлення через `openclaw.install`. Це зберігає каталог Core вільним від даних.

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
- `docsLabel`: перевизначити текст посилання для посилання на документацію
- `preferOver`: ідентифікатори плагінів/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: керування текстом поверхні вибору
- `markdownCapable`: позначає канал як здатний працювати з markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховати канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховати канал із інтерактивних засобів вибору налаштування/конфігурування, коли встановлено `false`
- `exposure.docs`: позначити канал як внутрішній/приватний для поверхонь навігації документацією
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які досі приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: увімкнути канал у стандартний потік швидкого старту `allowFrom`
- `forceAccountBinding`: вимагати явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надавати перевагу пошуку сеансу під час розв’язання цілей оголошень

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на один чи кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів відкривають нормалізовані факти джерела встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи є npm-специфікація точною версією або плаваючим селектором, чи наявні очікувані метадані цілісності, і чи також доступний шлях локального джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, а також коли метадані цілісності npm наявні без дійсного джерела npm. Споживачі мають трактувати `installSource` як додаткове необов’язкове поле, щоб записи, створені вручну, і прокладки каталогу не мусили його синтезувати. Це дає онбордингу й діагностиці змогу пояснювати стан площини джерел без імпорту runtime плагіна.

Офіційні зовнішні npm-записи мають надавати перевагу точному `npmSpec` разом із `expectedIntegrity`. Голі імена пакетів і dist-tags досі працюють для сумісності, але показують попередження площини джерел, щоб каталог міг рухатися до закріплених, перевірених на цілісність встановлень без поломки наявних плагінів. Коли онбординг встановлює з локального шляху каталогу, він записує керований запис індексу плагінів із `source: "path"` та відносним до робочого простору `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалу конфігурацію. Це зберігає локальні встановлення для розробки видимими для діагностики площини джерел без додавання другої сирої поверхні розкриття шляхів файлової системи. Збережений індекс плагінів `plugins/installs.json` є джерелом істини щодо джерела встановлення й може оновлюватися без завантаження runtime-модулів плагінів. Його мапа `installRecords` є довговічною навіть тоді, коли маніфест плагіна відсутній або недійсний; його масив `plugins` є відбудовуваним поданням маніфестів.

## Плагіни контекстного рушія

Плагіни контекстного рушія володіють оркестрацією контексту сеансу для приймання, складання та compaction. Зареєструйте їх із вашого плагіна за допомогою `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій через `plugins.slots.contextEngine`.

Використовуйте це, коли вашому плагіну потрібно замінити або розширити стандартний конвеєр контексту, а не просто додати пошук пам’яті чи хуки.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

Фабрика `ctx` відкриває необов’язкові значення `config`, `agentDir` і `workspaceDir` для ініціалізації під час створення.

Якщо ваш рушій **не** володіє алгоритмом compaction, залиште `compact()` реалізованим і явно делегуйте його:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

Коли плагіну потрібна поведінка, яка не вкладається в поточний API, не обходьте систему плагінів приватним доступом усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, якою спільною поведінкою має володіти Core: політика, резервний шлях, злиття конфігурації, життєвий цикл, семантика для каналів і форма runtime-хелпера.
2. додайте типізовані поверхні реєстрації/runtime для плагінів
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте споживачів Core + каналів/функцій
   Канали й плагіни функцій мають споживати нову можливість через Core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Потім плагіни постачальників реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації з часом залишалися явними.

Саме так OpenClaw залишається впевненим у своїх підходах, не стаючи жорстко прив’язаним до світогляду одного провайдера. Дивіться [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного чекліста файлів і пропрацьованого прикладу.

### Чекліст можливості

Коли ви додаєте нову можливість, реалізація зазвичай має охоплювати ці поверхні разом:

- типи контракту Core в `src/<capability>/types.ts`
- runtime-хелпер/runner Core в `src/<capability>/runtime.ts`
- поверхню реєстрації API плагінів у `src/plugins/types.ts`
- під’єднання реєстру плагінів у `src/plugins/registry.ts`
- експонування runtime плагінів у `src/plugins/runtime/*`, коли плагінам функцій/каналів потрібно це споживати
- хелпери захоплення/тестування в `src/test-utils/plugin-registration.ts`
- твердження володіння/контракту в `src/plugins/contracts/registry.ts`
- документацію оператора/плагіна в `docs/`

Якщо однієї з цих поверхонь немає, це зазвичай ознака того, що можливість ще не повністю інтегрована.

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

- Core володіє контрактом можливості + оркестрацією
- плагіни постачальників володіють реалізаціями постачальників
- плагіни функцій/каналів споживають runtime-хелпери
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура плагінів](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
