---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні аспекти архітектури Plugin: конвеєр завантаження, реєстр, runtime hooks, HTTP-маршрути та довідкові таблиці'
title: Внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Модель публічних можливостей, форми plugin, а також контракти володіння/виконання
див. в [Архітектурі Plugin](/uk/plugins/architecture). Ця сторінка є
довідником з внутрішньої механіки: конвеєр завантаження, реєстр, runtime-хуки,
HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів plugin
2. читає нативні або сумісні маніфести bundle і метадані пакунків
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled-модулі використовують нативний завантажувач;
   локальний TypeScript-код сторонніх джерел використовує аварійний fallback Jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр plugin
8. надає реєстр командам/runtime-поверхням

<Note>
`activate` є застарілим псевдонімом для `register` — завантажувач визначає наявний варіант (`def.register ?? def.activate`) і викликає його в тій самій точці. Усі bundled plugins використовують `register`; для нових plugins віддавайте перевагу `register`.
</Note>

Запобіжні шлюзи спрацьовують **до** виконання runtime. Кандидати блокуються,
коли точка входу виходить за межі кореня plugin, шлях доступний для запису всім
або володіння шляхом виглядає підозріло для не-bundled plugins.

Заблоковані кандидати залишаються прив’язаними до свого id plugin для діагностики. Якщо конфігурація
досі посилається на цей id, валідація повідомляє про plugin як присутній, але заблокований,
і вказує назад на попередження про безпеку шляху, замість того щоб вважати запис конфігурації
застарілим.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти оголошені канали/skills/схему конфігурації або можливості bundle
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime plugin

Для нативних plugins runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або потоки провайдерів.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на control plane.
Вони є лише метаданими-дескрипторами для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки команд, каналів і провайдерів з маніфесту,
щоб звузити завантаження plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до plugins, які володіють запитаною основною командою
- setup/розв’язання plugin для каналу звужується до plugins, які володіють запитаним
  id каналу
- явне setup/runtime-розв’язання провайдера звужується до plugins, які володіють запитаним
  id провайдера
- планування запуску Gateway використовує `activation.onStartup` для явних імпортів під час запуску
  та opt-out під час запуску; plugins без метаданих запуску завантажуються лише
  через вужчі тригери активації

Request-time runtime preloads, що запитують широкий scope `all`, усе ще виводять
явний ефективний набір id plugin з конфігурації, планування запуску, налаштованих
каналів, слотів і правил auto-enable. Якщо цей виведений набір порожній, OpenClaw
завантажує порожній runtime-реєстр замість розширення до кожного доступного для виявлення
plugin.

Планувальник активації надає і ids-only API для наявних викликачів, і
plan API для нової діагностики. Записи плану повідомляють, чому plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback володіння маніфестом,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані plugin продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення setup тепер віддає перевагу descriptor-owned ids, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити кандидатні plugins перед fallback до
`setup-api` для plugins, яким досі потрібні runtime-хуки під час setup. Списки
setup провайдерів використовують маніфест `providerAuthChoices`, setup choices,
виведені з дескрипторів, і метадані install-catalog без завантаження runtime провайдера. Явне
`setup.requiresRuntime: false` є descriptor-only відсіканням; пропущене
`requiresRuntime` зберігає застарілий fallback setup-api для сумісності. Якщо більше
ніж один виявлений plugin заявляє той самий нормалізований setup provider або id CLI
backend, setup lookup відмовляється від неоднозначного власника замість покладання на
порядок виявлення. Коли setup runtime все ж виконується, діагностика реєстру повідомляє
drift між `setup.providers` / `setup.cliBackends` і провайдерами або CLI
backends, зареєстрованими setup-api, без блокування застарілих plugins.

### Межа кешу plugin

OpenClaw не кешує результати виявлення plugin або прямі дані реєстру маніфестів
за wall-clock windows. Встановлення, редагування маніфестів і зміни load-path
мають ставати видимими під час наступного явного читання метаданих або перебудови snapshot.
Парсер файлу маніфесту може тримати обмежений кеш сигнатур файлів, ключований за
відкритим шляхом маніфесту, inode, розміром і часовими мітками; цей кеш лише уникає
повторного парсингу незмінених байтів і не має кешувати відповіді щодо виявлення,
реєстру, власника або політики.

Безпечний швидкий шлях метаданих — це явне володіння об’єктом, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`,
виведену `PluginLookUpTable` або явний реєстр маніфестів через ланцюг викликів.
Валідація конфігурації, startup auto-enable, bootstrap plugin і вибір провайдера
можуть повторно використовувати ці об’єкти, доки вони представляють поточну конфігурацію та
інвентар plugin. Setup lookup досі реконструює метадані маніфесту на вимогу,
якщо конкретний setup path не отримує явний реєстр маніфестів; тримайте це
як cold-path fallback замість додавання прихованих lookup caches. Коли вхідні дані
змінюються, перебудовуйте й замінюйте snapshot замість мутування його або збереження
історичних копій.
Подання над активним реєстром plugin і bundled channel bootstrap helpers
мають переобчислюватися з поточного реєстру/кореня. Короткоживучі maps прийнятні
всередині одного виклику для dedupe роботи або захисту reentry; вони не мають ставати
process metadata caches.

Для завантаження plugin постійний шар кешу — це runtime-завантаження. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти фактично завантажені, наприклад:

- `PluginLoaderCacheState` і сумісні активні runtime-реєстри
- кеші jiti/module і кеші завантажувача public-surface, які використовуються, щоб уникати
  повторного імпорту тієї самої runtime-поверхні
- кеші файлової системи для встановлених артефактів plugin
- короткоживучі per-call maps для нормалізації шляхів або розв’язання дублікатів

Ці кеші є деталями реалізації data plane. Вони не мають відповідати на
питання control plane, як-от "which plugin owns this provider?", якщо викликач
навмисно не попросив runtime-завантаження.

Не додавайте постійні або wall-clock кеші для:

- результатів виявлення
- прямих реєстрів маніфестів
- реєстрів маніфестів, реконструйованих із встановленого індексу plugin
- lookup власника провайдера, model suppression, політики провайдера або метаданих public-artifact
- будь-якої іншої відповіді, виведеної з маніфесту, де змінений маніфест, встановлений індекс
  або load path має бути видимим під час наступного читання метаданих

Викликачі, які перебудовують метадані маніфесту з persisted installed plugin
index, реконструюють цей реєстр на вимогу. Встановлений індекс є durable
source-plane state; це не прихований in-process metadata cache.

## Модель реєстру

Завантажені plugins не мутують напряму випадкові core globals. Вони реєструються в
центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- CLI-реєстратори
- фонові сервіси
- команди, якими володіє plugin

Після цього core features читають із цього реєстру замість прямої взаємодії з модулями plugin.
Це зберігає завантаження односпрямованим:

- модуль plugin -> реєстрація в реєстрі
- core runtime -> споживання реєстру

Це розділення важливе для супроводжуваності. Воно означає, що більшості core surfaces потрібна лише
одна точка інтеграції: "read the registry", а не "special-case every plugin
module".

## Callback-и прив’язки розмови

Plugins, які прив’язують розмову, можуть реагувати, коли approval розв’язано.

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
- `binding`: розв’язана прив’язка для схвалених requests
- `request`: початкове summary request, підказка detach, sender id і
  метадані розмови

Цей callback лише сповіщає. Він не змінює, кому дозволено прив’язувати
розмову, і запускається після завершення core approval handling.

## Runtime-хуки провайдера

Provider plugins мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, застарілий compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що покривають auth, model resolution,
  stream wrapping, thinking levels, replay policy і usage endpoints. Див.
  повний список у [Порядку хуків і використанні](#hook-order-and-usage).

OpenClaw досі володіє generic agent loop, failover, обробкою transcript і
tool policy. Ці хуки є extension surface для provider-specific
поведінки без потреби в повністю custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли провайдер має env-based
облікові дані, які generic auth/status/model-picker paths мають бачити без
завантаження runtime plugin. Застарілий `providerAuthEnvVars` досі читається
compatibility adapter під час deprecation window, а non-bundled plugins,
які його використовують, отримують diagnostic маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один id провайдера має повторно використовувати env vars іншого id провайдера, auth profiles,
config-backed auth і API-key onboarding choice. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI surfaces мають знати
choice id провайдера, group labels і просте one-flag auth wiring без
завантаження runtime провайдера. Залишайте runtime провайдера
`envVars` для operator-facing підказок, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли канал має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження runtime каналу.

### Порядок хуків і використання

Для model/provider plugins OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" є коротким посібником для ухвалення рішення.
Compatibility-only поля провайдера, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
наведені тут.

| #   | Hook                              | Що робить                                                                                                   | Коли використовувати                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                                | Провайдер володіє каталогом або типовими значеннями базової URL-адреси                                                                                                  |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, якими володіє провайдер, під час матеріалізації конфігурації                                      | Типові значення залежать від режиму автентифікації, env або семантики сімейства моделей провайдера                                                                         |
| --  | _(вбудований пошук моделей)_         | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                          | _(не Plugin hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі псевдоніми або псевдоніми попереднього перегляду ідентифікаторів моделей перед пошуком                                                     | Провайдер володіє очищенням псевдонімів перед канонічним розв'язанням моделі                                                                                 |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                                      | Провайдер володіє очищенням транспорту для власних ідентифікаторів провайдера в тому самому транспортному сімействі                                                          |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед runtime/розв'язанням провайдера                                           | Провайдер потребує очищення конфігурації, яке має жити разом із Plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google   |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує переписування сумісності власного потокового використання до провайдерів конфігурації                                               | Провайдер потребує виправлень метаданих власного потокового використання, керованих endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Розв'язує автентифікацію через env-маркер для провайдерів конфігурації перед завантаженням runtime-автентифікації                                       | Провайдери надають власні hook розв'язання API-ключів через env-маркер                                                                                |
| 8   | `resolveSyntheticAuth`            | Показує локальну/самостійно розгорнуту або підкріплену конфігурацією автентифікацію без збереження відкритого тексту                                   | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, якими володіє провайдер; типовий `persistence` — `runtime-only` для облікових даних, якими володіє CLI/застосунок | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh-токенів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів за автентифікацією, підкріпленою env/конфігурацією                                      | Провайдер зберігає синтетичні профілі-заповнювачі, які не повинні мати пріоритет                                                                 |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ідентифікаторів моделей, якими володіє провайдер і яких ще немає в локальному реєстрі                                       | Провайдер приймає довільні ідентифікатори моделей upstream                                                                                                 |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` виконується знову                                                           | Провайдер потребує мережевих метаданих перед розв'язанням невідомих ідентифікаторів                                                                                  |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає розв'язану модель                                               | Провайдер потребує переписувань транспорту, але все ще використовує транспорт ядра                                                                             |
| 14  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                                    | Провайдер потребує очищення схем транспортного сімейства                                                                                                |
| 15  | `inspectToolSchemas`              | Показує діагностику схем, якою володіє провайдер, після нормалізації                                                  | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                                                 |
| 16  | `resolveReasoningOutputMode`      | Вибирає контракт виводу міркувань: власний або позначений                                                              | Провайдер потребує позначеного виводу міркувань/фінального виводу замість власних полів                                                                         |
| 17  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                              | Провайдер потребує типових параметрів запиту або очищення параметрів для окремого провайдера                                                                           |
| 18  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                   | Провайдер потребує власного wire-протоколу, а не лише обгортки                                                                                     |
| 20  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                              | Провайдер потребує обгорток сумісності заголовків/тіла/моделі запиту без власного транспорту                                                          |
| 21  | `resolveTransportTurnState`       | Додає власні транспортні заголовки або метадані для кожного turn                                                           | Провайдер хоче, щоб загальні транспорти надсилали власну для провайдера ідентичність turn                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Додає власні WebSocket-заголовки або політику охолодження сеансу                                                    | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сеансу або політику fallback                                                               |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                                     | Провайдер зберігає додаткові метадані автентифікації та потребує власної форми runtime-токена                                                                    |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних endpoint оновлення або політики помилок оновлення                                  | Провайдер не підходить до спільних засобів оновлення OpenClaw                                                                                          |
| 25  | `buildAuthDoctorHint`             | Підказка щодо виправлення, додана, коли оновлення OAuth не вдається                                                                  | Провайдер потребує власних настанов щодо виправлення автентифікації після помилки оновлення                                                                      |
| 26  | `matchesContextOverflowError`     | Matcher переповнення контекстного вікна, яким володіє провайдер                                                                 | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                                |
| 27  | `classifyFailoverReason`          | Класифікація причини failover, якою володіє провайдер                                                                  | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/перевантаженням тощо                                                                          |
| 28  | `isCacheTtlEligible`              | Політика кешу підказок для proxy/backhaul-провайдерів                                                               | Провайдер потребує специфічного для proxy gating TTL кешу                                                                                                |
| 29  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення за відсутньої автентифікації                                                      | Провайдер потребує специфічної для провайдера підказки відновлення за відсутньої автентифікації                                                                                 |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                          | Провайдер потребує синтетичних рядків прямої сумісності в `models list` і засобах вибору                                                                     |
| 31  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                                                 | Провайдер надає власну драбину мислення або бінарну мітку для вибраних моделей                                                                 |
| 32  | `isBinaryThinking`                | Hook сумісності перемикача міркувань увімк./вимк.                                                                     | Провайдер надає лише бінарне мислення увімк./вимк.                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook сумісності підтримки міркувань `xhigh`                                                                   | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook сумісності типового рівня `/think`                                                                      | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                                      |
| 35  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів live-профілю та вибору smoke-перевірок                                              | Провайдер володіє зіставленням бажаних моделей для live/smoke-перевірок                                                                                             |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference                       | Провайдер потребує обміну токена або короткоживучих облікових даних запиту                                                                             |
| 37  | `resolveUsageAuth`                | Розв'язує облікові дані використання/білінгу для `/usage` і пов'язаних поверхонь стану                                     | Провайдер потребує власного розбору токена використання/квоти або інших облікових даних використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримати й нормалізувати знімки використання/квоти, специфічні для провайдера, після завершення автентифікації | Провайдеру потрібна специфічна для провайдера кінцева точка використання або парсер payload                                                   |
| 39  | `createEmbeddingProvider`         | Створити належний провайдеру адаптер embedding для пам’яті/пошуку                                             | Поведінка embedding пам’яті належить Plugin провайдера                                                                                        |
| 40  | `buildReplayPolicy`               | Повернути політику replay, що керує обробкою транскрипту для провайдера                                       | Провайдеру потрібна власна політика транскрипту (наприклад, вилучення thinking-блоків)                                                        |
| 41  | `sanitizeReplayHistory`           | Переписати історію replay після загального очищення транскрипту                                               | Провайдеру потрібні специфічні для провайдера переписування replay поза спільними допоміжними засобами Compaction                             |
| 42  | `validateReplayTurns`             | Остаточна валідація або зміна форми replay-turn перед вбудованим runner                                       | Транспорту провайдера потрібна суворіша валідація turn після загальної санації                                                                |
| 43  | `onModelSelected`                 | Запустити належні провайдеру побічні ефекти після вибору                                                     | Провайдеру потрібна телеметрія або належний провайдеру стан, коли модель стає активною                                                        |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin постачальника, а потім переходять до інших Plugin-ів постачальників
із підтримкою хуків, доки один із них справді не змінить ідентифікатор моделі або transport/config. Це зберігає працездатність
alias/compat shim-ів постачальників без вимоги до викликача знати, який
вбудований Plugin володіє перезаписом. Якщо жоден хук постачальника не переписує підтриманий
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе одно застосовує
це сумісне очищення.

Якщо постачальнику потрібен повністю власний дротовий протокол або власний виконавець запитів,
це інший клас розширення. Ці хуки призначені для поведінки постачальника,
яка все ще працює у звичайному циклі інференсу OpenClaw.

`resolveUsageAuth` вирішує, чи OpenClaw має викликати `fetchUsageSnapshot`, чи
повертатися до загального розв’язання облікових даних для поверхонь використання/статусу. Поверніть
`{ token, accountId? }`, коли постачальник має облікові дані для використання, поверніть
`{ handled: true }`, коли автентифікація використання, якою володіє постачальник, уже обробила запит і
має придушити загальний fallback API-key/OAuth, і поверніть `null` або `undefined`,
коли постачальник не обробив автентифікацію використання.

### Приклад постачальника

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

Вбудовані Plugin-и постачальників поєднують наведені вище хуки, щоб відповідати потребам
каталогу, автентифікації, міркування, повторного відтворення та використання кожного постачальника. Авторитетний набір хуків міститься разом із
кожним Plugin-ом у `extensions/`; ця сторінка ілюструє форми, а не
дзеркалить список.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб показувати upstream
    ідентифікатори моделей попереду статичного каталогу OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають постачальникам змогу підключатися до
    політики транскрипта через `buildReplayPolicy`, замість того щоб кожен Plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють на спільному циклі інференсу.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічної межі `api.ts` / `contract-api.ts` Plugin-а Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-помічники

Plugin-и можуть отримувати доступ до вибраних основних помічників через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайне основне корисне навантаження виводу TTS для поверхонь файлів/голосових нотаток.
- Використовує основну конфігурацію `messages.tts` і вибір постачальника.
- Повертає PCM audio buffer + sample rate. Plugin-и мають виконувати resample/encode для постачальників.
- `listVoices` є необов’язковим для кожного постачальника. Використовуйте його для керованих постачальником вибирачів голосу або потоків налаштування.
- Списки голосів можуть містити багатші метадані, як-от локаль, стать і теги особистості для вибирачів, обізнаних про постачальника.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft не підтримує.

Plugin-и також можуть реєструвати мовленнєвих постачальників через `api.registerSpeechProvider(...)`.

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
- Використовуйте мовленнєвих постачальників для поведінки синтезу, якою володіє постачальник.
- Застарілий вхід Microsoft `edge` нормалізується до ідентифікатора постачальника `microsoft`.
- Бажана модель володіння орієнтована на компанію: один Plugin постачальника може володіти
  текстовими, мовленнєвими, зображувальними та майбутніми медіапостачальниками, коли OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin-и реєструють одного типізованого
постачальника media-understanding замість загального key/value bag:

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

- Тримайте оркестрацію, fallback, конфігурацію та wiring каналів у core.
- Тримайте поведінку постачальника в Plugin-і постачальника.
- Додавальне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результатів, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливості та runtime-помічником
  - Plugin-и постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin-и функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime-помічників media-understanding Plugin-и можуть викликати:

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Для транскрипції аудіо Plugin-и можуть використовувати або runtime media-understanding,
або старіший alias STT:

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
- `extractStructuredWithModel(...)` є межею для Plugin-ів для обмеженого
  витягування, яким володіє постачальник і яке орієнтоване насамперед на зображення. Додайте принаймні один вхід зображення;
  текстові входи є додатковим контекстом.
  product Plugin-и володіють своїми маршрутами та схемами, тоді як OpenClaw володіє
  межею provider/runtime.
- Використовує основну аудіоконфігурацію media-understanding (`tools.media.audio`) і порядок fallback постачальників.
- Повертає `{ text: undefined }`, коли транскрипційний вивід не створено (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається alias-ом сумісності.

Plugin-и також можуть запускати фонові виконання subagent через `api.runtime.subagent`:

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

- `provider` і `model` є необов’язковими перевизначеннями для окремого запуску, а не постійними змінами сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, якими володіє Plugin, оператори мають явно ввімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin-и конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Недовірені subagent-запуски Plugin-ів усе ще працюють, але запити перевизначення відхиляються замість тихого fallback.
- Створені Plugin-ом subagent-сесії позначаються ідентифікатором Plugin-а, що їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці власні сесії; довільне видалення сесій і далі потребує Gateway-запиту з admin scope.

Для вебпошуку Plugin-и можуть споживати спільний runtime-помічник замість того, щоб
заходити у wiring інструментів агента:

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

Plugin-и також можуть реєструвати постачальників вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Тримайте вибір постачальника, розв’язання облікових даних і спільну семантику запитів у core.
- Використовуйте постачальників вебпошуку для специфічних для постачальника пошукових transport-ів.
- `api.runtime.webSearch.*` є бажаною спільною поверхнею для Plugin-ів функцій/каналів, яким потрібна пошукова поведінка без залежності від wrapper-а інструментів агента.

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

- `generate(...)`: згенерувати зображення за допомогою налаштованого ланцюга постачальників генерації зображень.
- `listProviders(...)`: перелічити доступних постачальників генерації зображень та їхні можливості.

## HTTP-маршрути Gateway

Plugin-и можуть відкривати HTTP endpoints за допомогою `api.registerHttpRoute(...)`.

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

- `path`: шлях маршруту під HTTP-сервером Gateway.
- `auth`: обов’язково. Використовуйте `"gateway"`, щоб вимагати звичайну автентифікацію Gateway, або `"plugin"` для автентифікації/перевірки Webhook, керованої Plugin.
- `match`: необов’язково. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язково. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: поверніть `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти точної комбінації `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише на одному рівні автентифікації.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime scopes оператора. Вони призначені для Webhook/перевірки підпису, керованих Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - автентифікація bearer зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршрутів Plugin прив’язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів Plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з автентифікацією Gateway є неявною адміністративною поверхнею. Якщо ваш маршрут потребує поведінки лише для адміністраторів, вимагайте режим автентифікації з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових Plugin використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk`. Основні підшляхи:

| Підшлях                            | Призначення                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/збирання каналу                        |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та парасольковий контракт       |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальні Plugin вибирають із родини вузьких стиків — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку затвердження слід консолідувати
на одному контракті `approvalCapability`, а не змішувати непов’язані
поля Plugin. Див. [Plugin каналів](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації живуть у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого barrel сумісності `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
малі фасади допоміжних засобів каналу, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими shim сумісності для
старіших Plugin. Новий код має натомість імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного вбудованого Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із core або з іншого Plugin.
Точки входу, завантажені фасадом, надають перевагу активному знімку runtime-конфігурації, коли він
існує, а потім повертаються до розв’язаного конфігураційного файла на диску.

Підшляхи для конкретних можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують тому, що вбудовані Plugin використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну сторінку
довідника SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin мають володіти канально-специфічними внесками схеми `describeMessageTool(...)`
для примітивів, що не є повідомленнями, як-от реакції, прочитання та опитування.
Спільна презентація надсилання має використовувати загальний контракт `MessagePresentation`
замість нативних для провайдера полів кнопок, компонентів, блоків або карток.
Див. [Презентація повідомлень](/uk/plugins/message-presentation) щодо контракту,
правил fallback, зіставлення провайдерів і checklist автора Plugin.

Plugin із можливістю надсилання оголошують, що вони можуть відтворювати, через можливості повідомлень:

- `presentation` для семантичних блоків презентації (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи відтворювати презентацію нативно, чи деградувати її до тексту.
Не відкривайте нативні для провайдера аварійні виходи UI із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy нативних схем залишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Розв’язання цілі каналу

Канальні Plugin мають володіти канально-специфічною семантикою цілі. Тримайте спільний
outbound-хост загальним і використовуйте поверхню адаптера повідомлень для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` перед пошуком у каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  введення має перейти безпосередньо до id-подібного розв’язання замість пошуку в каталозі.
- `messaging.targetResolver.reservedLiterals` перелічує прості слова, які є
  посиланнями каналу/сеансу для цього провайдера. Розв’язання зберігає налаштовані
  записи каталогу перед відхиленням зарезервованих літералів, а потім закрито завершується помилкою
  за промаху в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є fallback Plugin, коли
  core потребує остаточного розв’язання, яким володіє провайдер, після нормалізації або після
  промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сеансу,
  специфічною для провайдера, після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбуватися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний id цілі".
- Використовуйте `resolveTarget` для fallback нормалізації, специфічної для провайдера, а не для
  широкого пошуку в каталозі.
- Тримайте нативні для провайдера id, як-от id чатів, id потоків, JID, handles і id кімнат,
  усередині значень `target` або специфічних для провайдера параметрів, а не в загальних полях SDK.

## Каталоги на основі конфігурації

Plugin, які виводять записи каталогу з конфігурації, мають тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers, керовані allowlist
- налаштовані мапи channel/group
- статичні fallback каталогу в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрація запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудова `ChannelDirectoryEntry[]`

Канально-специфічна перевірка облікового запису та нормалізація id мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Provider Plugin можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє id моделей, специфічними для провайдера, типовими значеннями
base URL або метаданими моделей, закритими автентифікацією.

`catalog.order` керує тим, коли каталог Plugin зливається відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: прості провайдери, керовані API-key або env
- `profile`: провайдери, що з’являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдера
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають за колізії ключів, тож Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Plugin також можуть публікувати read-only рядки моделей через
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Це прямий шлях для поверхонь list/help/picker і підтримує рядки
`text`, `image_generation`, `video_generation` і `music_generation`.
Provider Plugin і далі володіють викликами live endpoint, token exchange і зіставленням
відповідей вендора; core володіє спільною формою рядка, мітками джерел і форматуванням довідки
інструмента медіа. Реєстрації провайдерів генерації медіа автоматично синтезують статичні
рядки каталогу з `defaultModel`, `models` і `capabilities`.

Сумісність:

- `discovery` досі працює як legacy alias, але видає попередження про застарілість
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`
- `augmentModelCatalog` застаріло; вбудовані провайдери мають публікувати
  додаткові рядки через `registerModelCatalogProvider`

## Read-only перевірка каналу

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поряд із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` є runtime-шляхом. Він може припускати, що облікові дані
  повністю матеріалізовані, і може швидко завершуватися помилкою, коли обов’язкових секретів бракує.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/repair конфігурації,
  не повинні матеріалізувати runtime credentials лише для того, щоб
  описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу облікових даних, коли доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для того, щоб повідомити про read-only
  доступність. Повернення `tokenStatus: "available"` (і відповідного поля джерела)
  достатньо для команд стилю status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовані через SecretRef, але
  недоступні в поточному командному шляху.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому командному
шляху" замість аварійного завершення або помилкового повідомлення, що обліковий запис не налаштовано.

## Пакети package

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

Кожен запис стає Plugin. Якщо пакет перелічує кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm deps, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися всередині каталогу Plugin
після розв’язання symlink. Записи, що виходять за межі каталогу пакета, відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності plugin за допомогою
локального для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час виконання), ігноруючи успадковані глобальні налаштування встановлення npm.
Тримайте дерева залежностей plugin «pure JS/TS» і уникайте пакетів, які потребують
`postinstall` builds.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого channel plugin, або
коли channel plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу plugin. Це полегшує запуск і налаштування,
коли основна точка входу вашого plugin також під’єднує tools, hooks або інший код,
потрібний лише під час виконання.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести channel plugin на той самий шлях `setupEntry` під час фази запуску gateway
до початку прослуховування, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup surface, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу налаштування
має зареєструвати кожну capability, якою володіє канал і від якої залежить запуск, наприклад:

- сама реєстрація каналу
- будь-які HTTP routes, які мають бути доступні до того, як gateway почне прослуховування
- будь-які gateway methods, tools або services, які мають існувати протягом того самого вікна

Якщо ваша повна точка входу все ще володіє будь-якою обов’язковою startup capability, не вмикайте
цей прапорець. Залиште plugin на стандартній поведінці й дозвольте OpenClaw завантажувати
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати допоміжні засоби setup-only contract-surface, які core
може використовувати до завантаження повного runtime каналу. Поточна surface просування налаштування:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю surface, коли потрібно просунути застарілу конфігурацію single-account channel
у `channels.<id>.accounts.*` без завантаження повної точки входу plugin.
Matrix є поточним вбудованим прикладом: він переміщує лише ключі auth/bootstrap у
іменований просунутий account, коли іменовані accounts уже існують, і може зберегти
налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapters зберігають ліниве виявлення bundled contract-surface. Час
імпорту залишається легким; promotion surface завантажується лише під час першого використання,
а не повторно входить у запуск bundled channel під час імпорту модуля.

Коли ці startup surfaces містять gateway RPC methods, тримайте їх на
специфічному для plugin префіксі. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються
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

Channel plugins можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це зберігає core catalog data-free.

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
- `preferOver`: plugin/channel ids із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом selection-surface
- `markdownCapable`: позначає канал як здатний працювати з markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховати канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховати канал з інтерактивних засобів вибору setup/configure, якщо встановлено `false`
- `exposure.docs`: позначити канал як internal/private для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: підключити канал до стандартного quickstart flow `allowFrom`
- `forceAccountBinding`: вимагати явного прив’язування account, навіть коли існує лише один account
- `preferSessionLookupForAnnounceTarget`: віддавати перевагу пошуку session під час розв’язання announce targets

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт registry MPM).
Розмістіть JSON-файл в одному з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (чи `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення provider надають
нормалізовані install-source facts поруч із сирим блоком `openclaw.install`. Нормалізовані
facts визначають, чи npm spec є точною версією або floating selector, чи присутні очікувані
integrity metadata, і чи також доступний локальний source path. Коли catalog/package identity відома,
нормалізовані facts попереджають, якщо розібрана назва npm package відхиляється від цієї identity.
Вони також попереджають, коли `defaultChoice` недійсний або вказує на source, який
недоступний, і коли npm integrity metadata присутні без valid npm
source. Consumers мають розглядати `installSource` як додаткове необов’язкове поле, щоб
hand-built entries і catalog shims не мусили його синтезувати.
Це дає змогу onboarding і diagnostics пояснювати стан source-plane без
імпорту runtime plugin.

Офіційні зовнішні npm entries мають віддавати перевагу точному `npmSpec` плюс
`expectedIntegrity`. Голі назви пакетів і dist-tags усе ще працюють для
сумісності, але вони показують source-plane warnings, щоб каталог міг рухатися
до pinned, integrity-checked installs без ламання наявних plugins.
Коли onboarding встановлює з local catalog path, він записує managed plugin
plugin index entry із `source: "path"` і workspace-relative
`sourcePath`, коли це можливо. Абсолютний operational load path залишається в
`plugins.load.paths`; install record уникає дублювання локальних workstation
paths у довгоживучу конфігурацію. Це зберігає local development installs видимими для
source-plane diagnostics без додавання другої поверхні розкриття raw filesystem-path.
Збережений рядок SQLite `installed_plugin_index` є джерелом істини встановлення
і може оновлюватися без завантаження runtime modules plugin.
Його map `installRecords` довговічний навіть тоді, коли manifest plugin відсутній або
недійсний; його payload `plugins` є відновлюваним manifest view.

## Plugins контекстного рушія

Context engine plugins володіють orchestration session context для ingest, assembly
і Compaction. Зареєструйте їх із вашого plugin за допомогою
`api.registerContextEngine(id, factory)`, а потім виберіть active engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити стандартний context
pipeline, а не просто додати memory search або hooks.

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

Factory `ctx` надає необов’язкові значення `config`, `agentDir` і `workspaceDir`
для ініціалізації під час конструювання.

`assemble()` може повертати `contextProjection`, коли active harness має
persistent backend thread. Опустіть його для застарілої per-turn projection. Поверніть
`{ mode: "thread_bootstrap", epoch }`, коли зібраний context має бути
одноразово ін’єктований у backend thread і повторно використовуваний, доки epoch не зміниться. Змініть
epoch після семантичної зміни context рушія, наприклад після
проходу compaction, яким володіє рушій. Hosts можуть зберігати tool-call metadata, input
shape і redacted tool results у thread-bootstrap projection, щоб нові
backend threads зберігали tool continuity без копіювання raw secret-bearing
payloads.

Якщо ваш engine **не** володіє алгоритмом Compaction, залиште `compact()`
реалізованим і явно делегуйте його:

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

## Додавання нової capability

Коли plugin потребує поведінки, яка не вкладається в поточний API, не обходьте
систему plugins приватним reach-in. Додайте відсутню capability.

Рекомендована послідовність:

1. визначте core contract
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, config merge,
   lifecycle, channel-facing semantics і форма runtime helper.
2. додайте типізовані plugin registration/runtime surfaces
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою capability surface.
3. під’єднайте core + channel/feature consumers
   Channels і feature plugins мають споживати нову capability через core,
   а не імпортувати vendor implementation напряму.
4. зареєструйте vendor implementations
   Потім vendor plugins реєструють свої backends для capability.
5. додайте contract coverage
   Додайте тести, щоб ownership і registration shape залишалися явними з часом.

Саме так OpenClaw лишається opinionated, не стаючи hardcoded під світогляд одного
provider. Див. [Capability Cookbook](/uk/plugins/adding-capabilities)
для конкретного checklist файлів і опрацьованого прикладу.

### Checklist capability

Коли ви додаєте нову capability, реалізація зазвичай має разом торкатися таких
surfaces:

- core contract types у `src/<capability>/types.ts`
- core runner/runtime helper у `src/<capability>/runtime.ts`
- plugin API registration surface у `src/plugins/types.ts`
- plugin registry wiring у `src/plugins/registry.ts`
- plugin runtime exposure у `src/plugins/runtime/*`, коли feature/channel
  plugins мають її споживати
- capture/test helpers у `src/test-utils/plugin-registration.ts`
- ownership/contract assertions у `src/plugins/contracts/registry.ts`
- operator/plugin docs у `docs/`

Якщо однієї з цих surfaces бракує, це зазвичай ознака, що capability ще
не повністю інтегрована.

### Шаблон capability

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
- Plugin постачальників володіють реалізаціями постачальників
- Plugin функцій/каналів споживають runtime-помічники
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
