---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішня будова архітектури Plugin: конвеєр завантаження, реєстр, хуки середовища виконання, маршрути HTTP і довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-04-29T03:41:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a598de14ca67d4ef08093a4e6ce65ade18e1c427fca9b3edfce218f847915850
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin і контрактів володіння/виконання див. [архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є довідником щодо внутрішніх механізмів: конвеєра завантаження, реєстру, runtime-хуків, HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. знаходить корені кандидатів Plugin
2. читає нативні або сумісні маніфести bundle та метадані пакета
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи ввімкнено кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled-модулі використовують нативний завантажувач;
   незібрані нативні Plugin використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. надає реєстр командам/runtime-поверхням

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що наявне (`def.register ?? def.activate`), і викликає це в той самий момент. Усі bundled Plugin використовують `register`; для нових Plugin віддавайте перевагу `register`.
</Note>

Запобіжники безпеки спрацьовують **до** runtime-виконання. Кандидати блокуються,
коли entry виходить за межі кореня Plugin, шлях доступний для запису всім користувачам або право власності на шлях виглядає підозріло для небундлених Plugin.

### Manifest-first поведінка

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/skills/схему конфігурації або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати labels/placeholders у Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або provider flows.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на control plane.
Це дескриптори лише з метаданими для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки команд, каналів і providers із маніфесту,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною primary command
- розв’язання setup/plugin для каналу звужується до Plugin, які володіють запитаним
  channel id
- явне розв’язання setup/runtime для provider звужується до Plugin, які володіють запитаним
  provider id
- планування запуску Gateway використовує `activation.onStartup` для явних startup
  імпортів і startup opt-outs; кожен Plugin має оголошувати це, оскільки OpenClaw
  відходить від неявних startup imports, тоді як Plugin без статичних
  метаданих можливостей і без `activation.onStartup` все ще використовують
  застарілий неявний startup sidecar fallback для сумісності

Планувальник активації надає як API лише з ids для наявних викликів, так і
plan API для нових діагностик. Entries плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback володіння з маніфесту,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Такий поділ причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення setup тепер віддає перевагу ids, якими володіють дескриптори, наприклад `setup.providers` і
`setup.cliBackends`, щоб звужувати кандидатів Plugin перед fallback до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки під час setup. Списки
provider setup використовують `providerAuthChoices` із маніфесту, choices setup,
виведені з дескрипторів, і метадані install-catalog без завантаження runtime provider. Явне
`setup.requiresRuntime: false` є descriptor-only відсіканням; пропущене
`requiresRuntime` зберігає застарілий setup-api fallback для сумісності. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований setup provider або CLI
backend id, setup lookup відмовляє неоднозначному власнику замість покладатися на
порядок виявлення. Коли setup runtime все ж виконується, діагностики реєстру повідомляють
про розбіжність між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, без блокування застарілих Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані реєстру маніфестів
за часовими вікнами wall-clock. Встановлення, редагування маніфестів і зміни load-path
мають ставати видимими під час наступного явного читання метаданих або перебудови snapshot.
Парсер файла маніфесту може тримати обмежений кеш файлових сигнатур, ключем якого є
відкритий шлях маніфесту, inode, розмір і timestamps; цей кеш лише уникає
повторного парсингу незмінених байтів і не має кешувати відповіді щодо discovery, registry, owner або
policy.

Безпечний швидкий шлях метаданих — це явне володіння об’єктом, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`, похідну
`PluginLookUpTable` або явний реєстр маніфестів через ланцюг викликів.
Перевірка конфігурації, startup auto-enable, bootstrap Plugin і вибір provider
можуть повторно використовувати ці об’єкти, доки вони представляють поточну конфігурацію та
інвентар Plugin. Setup lookup усе ще реконструює метадані маніфестів на вимогу,
якщо конкретний setup path не отримує явний реєстр маніфестів; залишайте це
cold-path fallback замість додавання прихованих lookup caches. Коли input
змінюється, перебудовуйте й замінюйте snapshot замість мутувати його або зберігати
історичні копії.
Views над активним реєстром Plugin і bundled channel bootstrap helpers
мають перераховуватися з поточного registry/root. Короткоживучі maps допустимі
всередині одного виклику для dedupe work або guard reentry; вони не мають ставати process
metadata caches.

Для завантаження Plugin постійний шар кешу — це runtime loading. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти справді завантажено, наприклад:

- `PluginLoaderCacheState` і сумісні active runtime registries
- caches jiti/module і public-surface loader caches, що використовуються для уникнення
  повторного імпорту тієї самої runtime surface
- runtime dependency mirrors і filesystem caches для встановлених артефактів Plugin
- короткоживучі per-call maps для нормалізації шляхів або duplicate resolution

Ці caches є деталями реалізації data plane. Вони не мають відповідати на
control-plane питання, як-от "який Plugin володіє цим provider?", якщо
викликач навмисно не попросив runtime loading.

Не додавайте persistent або wall-clock caches для:

- результатів discovery
- прямих реєстрів маніфестів
- реєстрів маніфестів, реконструйованих із встановленого індексу Plugin
- lookup власника provider, suppression моделей, policy provider або metadata public-artifact
- будь-якої іншої відповіді, виведеної з маніфесту, де змінений маніфест, встановлений index
  або load path має бути видимим під час наступного читання metadata

Викликачі, які перебудовують metadata маніфестів із persisted installed plugin
index, реконструюють цей registry на вимогу. Installed index є durable
source-plane state; це не прихований in-process metadata cache.

## Модель реєстру

Завантажені Plugin не мутують напряму випадкові core globals. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (identity, source, origin, status, diagnostics)
- tools
- legacy hooks і typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands, якими володіє Plugin

Core features потім читають із цього реєстру замість напряму звертатися до модулів Plugin.
Це зберігає завантаження односпрямованим:

- plugin module -> registry registration
- core runtime -> registry consumption

Це розділення важливе для підтримуваності. Воно означає, що більшості core surfaces потрібна лише
одна integration point: "читати реєстр", а не "special-case кожен модуль Plugin".

## Callbacks прив’язки розмови

Plugin, які прив’язують розмову, можуть реагувати, коли approval resolved.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після схвалення
або відхилення bind request:

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

Цей callback призначений лише для сповіщення. Він не змінює, кому дозволено прив’язувати
розмову, і запускається після завершення core approval handling.

## Runtime-хуки provider

Provider Plugin мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, застарілий compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Config-time hooks**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 необов’язкових хуків, що охоплюють auth, model resolution,
  stream wrapping, thinking levels, replay policy і usage endpoints. Див.
  повний список у розділі [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw усе ще володіє загальним agent loop, failover, transcript handling і
tool policy. Ці хуки є extension surface для provider-specific
поведінки без потреби в цілому custom inference transport.

Використовуйте `setup.providers[].envVars` із маніфесту, коли provider має env-based
credentials, які generic auth/status/model-picker paths мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` все ще читається
compatibility adapter під час deprecation window, а non-bundled Plugin,
які його використовують, отримують manifest diagnostic. Використовуйте `providerAuthAliases`
із маніфесту, коли один provider id має повторно використовувати env vars, auth profiles,
config-backed auth і API-key onboarding choice іншого provider id. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI surfaces мають знати
choice id provider, group labels і simple one-flag auth wiring без
завантаження runtime provider. Залишайте runtime provider
`envVars` для operator-facing hints, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте `channelEnvVars` із маніфесту, коли канал має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження channel runtime.

### Порядок хуків і використання

Для model/provider Plugin OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник для ухвалення рішення.

| #   | Hook                              | Що робить                                                                                                   | Коли використовувати                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                                | Провайдер володіє каталогом або стандартними значеннями базової URL-адреси                                                                                                  |
| 2   | `applyConfigDefaults`             | Застосовує глобальні стандартні значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації                                      | Стандартні значення залежать від режиму автентифікації, середовища або семантики сімейства моделей провайдера                                                                         |
| --  | _(вбудований пошук моделі)_         | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                          | _(не hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або попередні псевдоніми model-id перед пошуком                                                     | Провайдер відповідає за очищення псевдонімів перед канонічним розв’язанням моделі                                                                                 |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                                      | Провайдер відповідає за очищення транспорту для власних ідентифікаторів провайдера в тому самому транспортному сімействі                                                          |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв’язанням runtime/провайдера                                           | Провайдеру потрібне очищення конфігурації, яке має жити в Plugin; bundled Google-family помічники також підстраховують підтримувані записи конфігурації Google   |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування native streaming-usage до провайдерів конфігурації                                               | Провайдеру потрібні виправлення метаданих використання нативного потокового передавання, керовані endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Розв’язує автентифікацію env-marker для провайдерів конфігурації перед завантаженням runtime-автентифікації                                       | Провайдер має власне розв’язання API-ключа через env-marker; `amazon-bedrock` також має тут вбудований AWS env-marker resolver                  |
| 8   | `resolveSyntheticAuth`            | Відображає локальну/саморозміщену або конфігураційно підкріплену автентифікацію без збереження plaintext                                   | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, що належать провайдеру; стандартне `persistence` — `runtime-only` для облікових даних CLI/застосунку | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних placeholder профілю позаду автентифікації на основі env/config                                      | Провайдер зберігає синтетичні placeholder профілі, які не мають отримувати перевагу                                                                 |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ідентифікаторів моделей, що належать провайдеру й ще відсутні в локальному реєстрі                                       | Провайдер приймає довільні upstream ідентифікатори моделей                                                                                                 |
| 12  | `prepareDynamicModel`             | Асинхронний розігрів, після чого `resolveDynamicModel` запускається знову                                                           | Провайдеру потрібні мережеві метадані перед розв’язанням невідомих ідентифікаторів                                                                                  |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає розв’язану модель                                               | Провайдеру потрібні переписування транспорту, але він усе ще використовує core transport                                                                             |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей постачальника за іншим сумісним транспортом                                  | Провайдер розпізнає власні моделі на proxy transports без перебрання провайдера                                                       |
| 15  | `capabilities`                    | Метадані transcript/tooling, що належать провайдеру та використовуються спільною core логікою                                           | Провайдеру потрібні особливості transcript/сімейства провайдера                                                                                              |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                                    | Провайдеру потрібне очищення схем транспортного сімейства                                                                                                |
| 17  | `inspectToolSchemas`              | Відображає діагностику схем, що належить провайдеру, після нормалізації                                                  | Провайдер хоче попередження про ключові слова, не навчаючи core правил, специфічних для провайдера                                                                 |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: native або tagged                                                              | Провайдеру потрібен tagged reasoning/фінальний вивід замість native полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними wrappers параметрів потоку                                              | Провайдеру потрібні стандартні параметри запиту або очищення параметрів для конкретного провайдера                                                                           |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                   | Провайдеру потрібен власний wire protocol, а не просто wrapper                                                                                     |
| 21  | `wrapStreamFn`                    | Stream wrapper після застосування загальних wrappers                                                              | Провайдеру потрібні wrappers сумісності заголовків/тіла/моделі запиту без власного транспорту                                                          |
| 22  | `resolveTransportTurnState`       | Додає нативні транспортні заголовки або метадані для кожного turn                                                           | Провайдер хоче, щоб загальні transports надсилали provider-native turn identity                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Додає нативні WebSocket заголовки або політику cool-down сесії                                                    | Провайдер хоче, щоб загальні WS transports налаштовували заголовки сесії або fallback policy                                                               |
| 24  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime рядком `apiKey`                                     | Провайдер зберігає додаткові метадані автентифікації та потребує власної форми runtime token                                                                    |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних endpoint оновлення або політики refresh-failure                                  | Провайдер не підходить під спільні refreshers `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | Підказка для відновлення, додана після збою оновлення OAuth                                                                  | Провайдеру потрібні власні вказівки з відновлення автентифікації після збою оновлення                                                                      |
| 27  | `matchesContextOverflowError`     | Matcher переповнення context-window, що належить провайдеру                                                                 | Провайдер має сирі помилки overflow, які загальні евристики пропустили б                                                                                |
| 28  | `classifyFailoverReason`          | Класифікація причини failover, що належить провайдеру                                                                  | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/overload/etc                                                                          |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul провайдерів                                                               | Провайдеру потрібне proxy-specific cache TTL gating                                                                                                |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення за відсутньої автентифікації                                                      | Провайдеру потрібна підказка відновлення відсутньої автентифікації, специфічна для провайдера                                                                                 |
| 31  | `suppressBuiltInModel`            | Застаріло. Runtime hook більше не викликається; використовуйте `modelCatalog.suppressions` маніфесту                         | Історичний hook для приховування застарілих upstream рядків; зберігайте нові дані suppression у маніфесті Plugin                                              |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після discovery                                                          | Провайдеру потрібні синтетичні forward-compat рядки в `models list` і pickers                                                                     |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think` для конкретної моделі, мітки відображення та стандартне значення                                                 | Провайдер надає власну драбину thinking або бінарну мітку для вибраних моделей                                                                 |
| 34  | `isBinaryThinking`                | Compatibility hook для перемикача reasoning on/off                                                                     | Провайдер надає лише бінарний thinking on/off                                                                                                  |
| 35  | `supportsXHighThinking`           | Compatibility hook підтримки reasoning `xhigh`                                                                   | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Compatibility hook стандартного рівня `/think`                                                                      | Провайдер володіє стандартною політикою `/think` для сімейства моделей                                                                                      |
| 37  | `isModernModelRef`                | Зіставник сучасних моделей для фільтрів робочих профілів і відбору для перевірок працездатності                                              | Провайдер відповідає за зіставлення бажаних моделей для робочого режиму та перевірок працездатності                                                                                             |
| 38  | `prepareRuntimeAuth`              | Обміняти налаштовані облікові дані на фактичний токен/ключ середовища виконання безпосередньо перед інференсом                       | Провайдер потребує обміну токена або короткочасних облікових даних запиту                                                                             |
| 39  | `resolveUsageAuth`                | Визначити облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь стану                                     | Провайдер потребує власного розбору токена використання/квоти або інших облікових даних використання                                                               |
| 40  | `fetchUsageSnapshot`              | Отримати й нормалізувати специфічні для провайдера знімки використання/квот після визначення автентифікації                             | Провайдер потребує специфічної для провайдера кінцевої точки використання або парсера корисного навантаження                                                                           |
| 41  | `createEmbeddingProvider`         | Побудувати належний провайдеру адаптер embeddings для пам’яті/пошуку                                                     | Поведінка embeddings для пам’яті належить Plugin провайдера                                                                                    |
| 42  | `buildReplayPolicy`               | Повернути політику повторного відтворення, що керує обробкою транскрипту для провайдера                                        | Провайдер потребує власної політики транскрипту (наприклад, вилучення блоків міркування)                                                               |
| 43  | `sanitizeReplayHistory`           | Переписати історію повторного відтворення після загального очищення транскрипту                                                        | Провайдер потребує специфічних для провайдера перезаписів повторного відтворення поза спільними помічниками compaction                                                             |
| 44  | `validateReplayTurns`             | Остаточна валідація або переформування ходів повторного відтворення перед вбудованим runner                                           | Транспорт провайдера потребує суворішої валідації ходів після загальної санітизації                                                                    |
| 45  | `onModelSelected`                 | Виконати належні провайдеру побічні ефекти після вибору                                                                 | Провайдер потребує телеметрії або належного провайдеру стану, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний provider plugin, а потім проходять інші provider plugins із підтримкою hooks,
доки якийсь із них справді не змінить ідентифікатор моделі або transport/config. Це зберігає
працездатність alias/compat provider shims без потреби для виклику знати, який
вбудований plugin відповідає за переписування. Якщо жоден provider hook не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно застосовує
це очищення сумісності.

Якщо provider потребує повністю власного wire protocol або власного request executor,
це вже інший клас розширення. Ці hooks призначені для поведінки provider,
яка все ще виконується у звичайному inference loop OpenClaw.

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

Вбудовані provider plugins поєднують наведені вище hooks, щоб відповідати каталогу,
автентифікації, мисленню, replay і потребам обліку використання кожного постачальника. Авторитетний набір hooks міститься разом із
кожним plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    ідентифікатори моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб самостійно керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають providers змогу підключатися до
    політики transcript через `buildReplayPolicy`, замість того щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють через спільний inference loop.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` і `context1m` містяться всередині
    публічного шва `api.ts` / `contract-api.ts` Anthropic plugin
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
- Використовує core-конфігурацію `messages.tts` і вибір provider.
- Повертає PCM audio buffer + sample rate. Plugins мають виконувати resample/encode для providers.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для vendor-owned voice pickers або setup flows.
- Voice listings можуть містити багатші метадані, як-от locale, gender і personality tags для provider-aware pickers.
- OpenAI та ElevenLabs наразі підтримують telephony. Microsoft не підтримує.

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

- Зберігайте політику TTS, fallback і доставку відповіді в core.
- Використовуйте speech providers для vendor-owned synthesis behavior.
- Застарілий вхід Microsoft `edge` нормалізується до ідентифікатора provider `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor plugin може володіти
  text, speech, image і майбутніми media providers, коли OpenClaw додаватиме ці
  capability contracts.

Для розуміння image/audio/video plugins реєструють один типізований
media-understanding provider замість загального key/value bag:

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

- Зберігайте orchestration, fallback, config і channel wiring у core.
- Зберігайте vendor behavior у provider plugin.
- Additive expansion має залишатися типізованим: нові необов’язкові methods, нові необов’язкові
  result fields, нові необов’язкові capabilities.
- Video generation уже дотримується того самого шаблону:
  - core володіє capability contract і runtime helper
  - vendor plugins реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins споживають `api.runtime.videoGeneration.*`

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

- `api.runtime.mediaUnderstanding.*` є бажаною спільною поверхнею для
  розуміння image/audio/video.
- Використовує core media-understanding audio configuration (`tools.media.audio`) і provider fallback order.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, пропущений/непідтримуваний input).
- `api.runtime.stt.transcribeAudioFile(...)` залишається compatibility alias.

Plugins також можуть запускати фонові subagent runs через `api.runtime.subagent`:

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

- `provider` і `model` є необов’язковими per-run overrides, а не persistent session changes.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для plugin-owned fallback runs оператори мають увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical `provider/model` targets, або `"*"`, щоб явно дозволити будь-яку target.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються замість тихого fallback.
- Створені plugin subagent sessions позначаються ідентифікатором plugin, який їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session усе ще потребує admin-scoped Gateway request.

Для web search plugins можуть споживати спільний runtime helper замість
звернення до agent tool wiring:

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

- Зберігайте provider selection, credential resolution і shared request semantics у core.
- Використовуйте web-search providers для vendor-specific search transports.
- `api.runtime.webSearch.*` є бажаною спільною поверхнею для feature/channel plugins, яким потрібна search behavior без залежності від agent tool wrapper.

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

- `generate(...)`: згенерувати зображення за допомогою налаштованого ланцюжка image-generation providers.
- `listProviders(...)`: перелічити доступні image-generation providers та їхні capabilities.

## Gateway HTTP routes

Plugins можуть надавати HTTP endpoints через `api.registerHttpRoute(...)`.

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
- `match`: необов’язкове. `"exact"` (за замовчуванням) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну route registration.
- `handler`: повертайте `true`, коли route обробив request.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і це спричинятиме помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin повинні явно оголошувати `auth`.
- Конфлікти з точним збігом `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Маршрути, що перекриваються, з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично області runtime оператора. Вони призначені для webhooks/перевірки підпису, керованих Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime-області запиту Gateway, але ця область навмисно консервативна:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-області маршрутів Plugin закріпленими за `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному вході) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах до маршрутів Plugin з ідентичністю, runtime-область повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з gateway-auth є неявною адмінською поверхнею. Якщо ваш маршрут потребує поведінки лише для адміністратора, вимагайте режим auth з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk` під час створення нових Plugin. Основні підшляхи:

| Підшлях                            | Призначення                                       |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/збирання каналу            |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальні Plugin вибирають із родини вузьких швів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінка затвердження має консолідуватися
навколо одного контракту `approvalCapability`, а не змішуватися між непов’язаними
полями Plugin. Див. [Канальні Plugin](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації розміщені у відповідних сфокусованих підшляхах
`*-runtime` (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого compatibility barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими compatibility shim для
старіших Plugin. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного bundled package Plugin):

- `index.js` — точка входу bundled Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні Plugin повинні імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` пакета іншого Plugin з core або з іншого Plugin.
Точки входу, завантажені через фасад, віддають перевагу активному runtime-знімку конфігурації, коли він
існує, а потім повертаються до розв’язаного файлу конфігурації на диску.

Підшляхи для конкретних можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують, бо bundled Plugin використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну сторінку
довідки SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin повинні володіти внесками до схем `describeMessageTool(...)`, специфічними для каналів,
для не-повідомленнєвих примітивів, як-от реакції, прочитання та опитування.
Спільне подання надсилання має використовувати загальний контракт `MessagePresentation`
замість нативних для провайдера полів кнопок, компонентів, блоків або карток.
Див. [Подання повідомлень](/uk/plugins/message-presentation) щодо контракту,
правил fallback, мапінгу провайдерів і checklist автора Plugin.

Plugin з можливістю надсилання оголошують, що вони можуть рендерити, через можливості повідомлень:

- `presentation` для семантичних presentation-блоків (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи рендерити presentation нативно, чи знизити його до тексту.
Не відкривайте нативні для провайдера escape hatch UI із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy нативних схем залишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Розв’язання цілі каналу

Канальні Plugin повинні володіти специфічною для каналу семантикою цілей. Зберігайте спільний
outbound-хост загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід нормалізовану ціль
  трактувати як `direct`, `group` або `channel` перед пошуком у довіднику.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи має
  вхід перейти прямо до id-подібного розв’язання замість пошуку в довіднику.
- `messaging.targetResolver.resolveTarget(...)` є fallback Plugin, коли
  core потребує остаточного розв’язання, яким володіє провайдер, після нормалізації або після
  промаху довідника.
- `messaging.resolveOutboundSessionRoute(...)` відповідає за побудову маршруту сесії,
  специфічну для провайдера, після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбутися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний ідентифікатор цілі".
- Використовуйте `resolveTarget` для fallback нормалізації, специфічного для провайдера, а не для
  широкого пошуку в довіднику.
- Тримайте нативні для провайдера ідентифікатори, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або специфічних для провайдера параметрів, а не в загальних полях SDK.

## Довідники на основі конфігурації

Plugin, які виводять записи довідника з конфігурації, повинні тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли канал потребує peers/groups на основі конфігурації, як-от:

- DM peers на основі allowlist
- налаштовані мапи каналів/груп
- статичні fallback довідника в межах акаунта

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрація запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудова `ChannelDirectoryEntry[]`

Специфічна для каналу перевірка акаунта та нормалізація ідентифікаторів мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Provider Plugin можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли Plugin володіє специфічними для провайдера model ids, base URL
defaults або auth-gated metadata моделей.

`catalog.order` керує тим, коли каталог Plugin зливається відносно вбудованих implicit providers OpenClaw:

- `simple`: звичайні провайдери на основі API-key або env
- `profile`: провайдери, що з’являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших implicit providers

Пізніші провайдери перемагають у разі колізії ключів, тому Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` усе ще працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only перевірка каналів

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Йому дозволено припускати, що credentials
  повністю матеріалізовані, і швидко завершуватися помилкою, коли потрібні secrets відсутні.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, і потоки doctor/config
  repair не повинні матеріалізувати runtime credentials лише для того, щоб
  описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан акаунта.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу credentials, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про read-only
  доступність. Повернення `tokenStatus: "available"` (і відповідного поля source)
  достатньо для status-style команд.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному командному шляху.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому командному
шляху" замість аварійного завершення або помилкового звітування, що акаунт не налаштований.

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

Кожен запис стає Plugin. Якщо набір перелічує кілька extensions, ідентифікатор Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm deps, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Security guardrail: кожен запис `openclaw.extensions` має залишатися всередині каталогу Plugin
після розв’язання symlink. Записи, що виходять за межі каталогу пакета,
відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності Plugin за допомогою
локального для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей Plugin "pure JS/TS" і уникайте пакетів, що потребують
збирання `postinstall`.

Опційно: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує setup-поверхні для вимкненого канального Plugin або
коли канальний Plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить startup і setup легшими,
коли ваша основна точка входу Plugin також підключає tools, hooks або інший runtime-only
код.

Опційно: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити канальний Plugin до того самого шляху `setupEntry` під час
pre-listen startup-фази gateway, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup-поверхню, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має зареєструвати кожну можливість, якою володіє канал і від якої залежить startup, наприклад:

- власне реєстрація каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які методи gateway, tools або services, які мають існувати впродовж того самого вікна

Якщо ваша повна точка входу все ще володіє будь-якою необхідною startup-можливістю, не вмикайте
цей прапорець. Залиште Plugin на типовій поведінці та дозвольте OpenClaw завантажити
повну точку входу під час startup.

Bundled канали також можуть публікувати setup-only допоміжні засоби contract-surface, з якими core
може звірятися до завантаження повного runtime каналу. Поточна setup
promotion surface така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли потрібно підвищити застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного входу плагіна. Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового налаштування в іменований підвищений обліковий запис, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають вбудоване виявлення контрактної поверхні лінивим. Час імпорту залишається малим; поверхня підвищення завантажується лише під час першого використання, замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску містять методи RPC Gateway, тримайте їх на префіксі, специфічному для плагіна. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до `operator.admin`, навіть якщо плагін запитує вужчу область.

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

Плагіни каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і підказки встановлення через `openclaw.install`. Це залишає Core без даних каталогу.

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

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/стану
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: ідентифікатори плагінів/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: керування текстом поверхні вибору
- `markdownCapable`: позначає канал як такий, що підтримує markdown, для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору налаштування/конфігурування, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку швидкого старту `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сеансу під час розв’язання цілей оголошення

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Розмістіть JSON-файл в одному з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (чи `OPENCLAW_MPM_CATALOG_PATHS`) на один або кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів надають нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи є специфікація npm точною версією або плаваючим селектором, чи наявні очікувані метадані цілісності, і чи також доступний локальний шлях джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібрана назва пакета npm відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, а також коли метадані цілісності npm наявні без чинного джерела npm. Споживачі мають трактувати `installSource` як додаткове необов’язкове поле, щоб записи, створені вручну, і прокладки каталогу не мусили його синтезувати.
Це дає змогу онбордингу й діагностиці пояснювати стан площини джерел без імпорту runtime плагіна.

Офіційні зовнішні записи npm мають надавати перевагу точному `npmSpec` плюс `expectedIntegrity`. Голі назви пакетів і dist-tags усе ще працюють для сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися до закріплених встановлень із перевіркою цілісності без ламання наявних плагінів.
Коли онбординг встановлює з локального шляху каталогу, він записує запис індексу керованого плагіна з `source: "path"` і відносним до робочої області `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалу конфігурацію. Це робить локальні встановлення для розробки видимими для діагностики площини джерел без додавання другої поверхні розкриття сирих шляхів файлової системи. Збережений індекс плагінів `plugins/installs.json` є джерелом істини для встановлень і може оновлюватися без завантаження runtime-модулів плагінів. Його мапа `installRecords` довговічна навіть тоді, коли маніфест плагіна відсутній або недійсний; його масив `plugins` є відновлюваним представленням маніфестів.

## Плагіни контекстного рушія

Плагіни контекстного рушія володіють оркестрацією контексту сеансу для приймання, складання та Compaction. Зареєструйте їх зі свого плагіна за допомогою `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій через `plugins.slots.contextEngine`.

Використовуйте це, коли вашому плагіну потрібно замінити або розширити типовий конвеєр контексту, а не просто додати пошук пам’яті чи хуки.

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

Фабрика `ctx` надає необов’язкові значення `config`, `agentDir` і `workspaceDir` для ініціалізації під час побудови.

Якщо ваш рушій **не** володіє алгоритмом Compaction, залиште `compact()` реалізованим і явно делегуйте його:

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

Коли плагіну потрібна поведінка, яка не вписується в поточний API, не обходьте систему плагінів приватним зверненням усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, якою спільною поведінкою має володіти Core: політикою, fallback, об’єднанням конфігурації, життєвим циклом, семантикою для каналів і формою runtime-помічника.
2. додайте типізовані поверхні реєстрації/runtime плагінів
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте Core і споживачів каналів/функцій
   Канали та функціональні плагіни мають споживати нову можливість через Core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Плагіни постачальників потім реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації залишалася явною з часом.

Так OpenClaw залишається принциповим, не стаючи жорстко прив’язаним до світогляду одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного чекліста файлів і проробленого прикладу.

### Чекліст можливості

Коли ви додаєте нову можливість, реалізація зазвичай має зачіпати ці поверхні разом:

- типи контракту Core у `src/<capability>/types.ts`
- runtime-помічник/запускач Core у `src/<capability>/runtime.ts`
- поверхню реєстрації API плагінів у `src/plugins/types.ts`
- під’єднання реєстру плагінів у `src/plugins/registry.ts`
- runtime-експозицію плагінів у `src/plugins/runtime/*`, коли функціональним/канальним плагінам потрібно її споживати
- помічники захоплення/тестів у `src/test-utils/plugin-registration.ts`
- твердження володіння/контракту в `src/plugins/contracts/registry.ts`
- документацію для операторів/плагінів у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака, що можливість ще не повністю інтегрована.

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

- Core володіє контрактом можливості й оркестрацією
- плагіни постачальників володіють реалізаціями постачальників
- функціональні/канальні плагіни споживають runtime-помічники
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура плагінів](/uk/plugins/architecture) — публічна модель і форми можливостей
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
