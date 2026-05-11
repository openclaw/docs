---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, хуки середовища виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішня реалізація архітектури Plugin
x-i18n:
    generated_at: "2026-05-11T20:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin і контрактів володіння/виконання див. [архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є довідником з внутрішніх механізмів: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів Plugin
2. читає нативні або сумісні маніфести bundle і метадані пакета
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи вмикати кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled-модулі використовують нативний завантажувач;
   сторонній локальний TypeScript-код використовує аварійний fallback Jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що доступно (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі bundled Plugin використовують `register`; для нових Plugin віддавайте перевагу `register`.
</Note>

Запобіжники безпеки спрацьовують **до** runtime-виконання. Кандидати блокуються,
коли entry виходить за межі кореня Plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозрілим для небандлених Plugin.

Заблоковані кандидати залишаються прив’язаними до свого id Plugin для діагностики. Якщо конфігурація
досі посилається на цей id, валідація повідомляє Plugin як наявний, але заблокований,
і вказує назад на попередження про безпеку шляху, замість того щоб вважати запис конфігурації
застарілим.

### Поведінка manifest-first

Маніфест є джерелом істини для площини керування. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або bundle-можливості
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/placeholder-и Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеву активацію та дескриптори налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною площини даних. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або provider flows.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на площині керування.
Це metadata-only дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і provider,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною primary command
- setup/розв’язання Plugin для каналу звужується до Plugin, які володіють запитаним
  channel id
- явне setup/runtime-розв’язання provider звужується до Plugin, які володіють запитаним
  provider id
- планування запуску Gateway використовує `activation.onStartup` для явних startup
  imports і startup opt-outs; Plugin без startup-метаданих завантажуються лише
  через вужчі activation triggers

Request-time runtime preloads, які запитують широкий scope `all`, усе ще виводять
явний effective set id Plugin із конфігурації, планування запуску, налаштованих
каналів, slots і правил auto-enable. Якщо цей виведений набір порожній, OpenClaw
завантажує порожній runtime-реєстр замість розширення до кожного discoverable
Plugin.

Планувальник активації відкриває як ids-only API для наявних викликачів, так і
plan API для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні planner hints `activation.*` від fallback за володінням у маніфесті,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Цей поділ причин є compatibility boundary:
наявні метадані Plugin продовжують працювати, а новий код може виявляти broad hints
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення setup тепер надає перевагу descriptor-owned id, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити кандидатні Plugin, перш ніж повертатися до
`setup-api` для Plugin, яким досі потрібні runtime-хуки під час setup. Списки
provider setup використовують маніфест `providerAuthChoices`, setup choices,
виведені з дескрипторів, і install-catalog metadata без завантаження provider runtime. Явне
`setup.requiresRuntime: false` є descriptor-only відсіченням; пропущене
`requiresRuntime` зберігає legacy setup-api fallback для сумісності. Якщо більш ніж
один виявлений Plugin заявляє той самий normalized setup provider або CLI
backend id, setup lookup відхиляє неоднозначного власника замість покладання на
порядок виявлення. Коли setup runtime виконується, діагностика реєстру повідомляє
drift між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, без блокування legacy Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані реєстру маніфестів
за wall-clock windows. Встановлення, редагування маніфестів і зміни load-path
мають ставати видимими під час наступного явного читання метаданих або rebuild snapshot.
Парсер файлу маніфесту може тримати обмежений file-signature cache, ключований
відкритим шляхом маніфесту, inode, розміром і timestamps; цей кеш лише уникає
повторного парсингу незмінених байтів і не повинен кешувати discovery, registry, owner або
policy answers.

Безпечний швидкий шлях метаданих — це явне володіння об’єктом, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`,
виведену `PluginLookUpTable` або явний реєстр маніфестів через ланцюг викликів.
Валідація конфігурації, startup auto-enable, bootstrap Plugin і вибір provider
можуть повторно використовувати ці об’єкти, поки вони представляють поточну конфігурацію та
інвентар Plugin. Setup lookup усе ще реконструює метадані маніфесту on demand,
якщо конкретний setup path не отримує явний реєстр маніфестів; тримайте це
як cold-path fallback замість додавання прихованих lookup caches. Коли input
змінюється, перебудуйте й замініть snapshot замість мутації його або збереження
історичних копій.
Представлення над активним реєстром Plugin і bundled channel bootstrap helpers
мають повторно обчислюватися з поточного registry/root. Short-lived maps допустимі
всередині одного виклику для dedupe work або guard reentry; вони не повинні ставати process
metadata caches.

Для завантаження Plugin шар persistent cache — це runtime loading. Він може повторно використовувати
loader state, коли код або installed artifacts фактично завантажуються, як-от:

- `PluginLoaderCacheState` і сумісні active runtime registries
- jiti/module caches і public-surface loader caches, що використовуються, щоб уникати імпорту
  тієї самої runtime surface повторно
- filesystem caches для installed plugin artifacts
- short-lived per-call maps для path normalization або duplicate resolution

Ці кеші є data-plane implementation details. Вони не повинні відповідати на
control-plane питання, як-от "який Plugin володіє цим provider?", якщо викликач
навмисно не попросив runtime loading.

Не додавайте persistent або wall-clock caches для:

- результатів discovery
- прямих manifest registries
- manifest registries, реконструйованих із installed plugin index
- provider owner lookup, model suppression, provider policy або public-artifact
  metadata
- будь-якої іншої manifest-derived відповіді, де змінений manifest, installed index
  або load path має бути видимим під час наступного metadata read

Викликачі, які перебудовують manifest metadata з persisted installed plugin
index, реконструюють цей registry on demand. Installed index є durable
source-plane state; це не прихований in-process metadata cache.

## Модель реєстру

Завантажені Plugin не мутують напряму випадкові core globals. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (identity, source, origin, status, diagnostics)
- інструменти
- legacy hooks і typed hooks
- канали
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

Core features потім читають із цього реєстру замість прямої взаємодії з plugin modules.
Це зберігає завантаження односпрямованим:

- plugin module -> registry registration
- core runtime -> registry consumption

Цей поділ важливий для maintainability. Він означає, що більшості core surfaces потрібна лише
одна integration point: "читати registry", а не "special-case кожен plugin
module".

## Callback-и прив’язування розмов

Plugin, які прив’язують розмову, можуть реагувати, коли approval вирішено.

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
- `request`: початковий request summary, detach hint, sender id і
  metadata розмови

Цей callback є notification-only. Він не змінює, кому дозволено bind a
conversation, і запускається після завершення core approval handling.

## Runtime-хуки provider

Provider Plugin мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 optional hooks, що охоплюють auth, model resolution,
  stream wrapping, thinking levels, replay policy і usage endpoints. Повний список див.
  у [Порядок і використання hook](#hook-order-and-usage).

OpenClaw досі володіє generic agent loop, failover, transcript handling і
tool policy. Ці hooks є extension surface для provider-specific
behavior без потреби в цілому custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли provider має env-based
credentials, які generic auth/status/model-picker paths мають бачити без
завантаження plugin runtime. Deprecated `providerAuthEnvVars` досі читається
compatibility adapter під час deprecation window, а non-bundled Plugin,
які його використовують, отримують manifest diagnostic. Використовуйте маніфест `providerAuthAliases`,
коли один provider id має повторно використовувати env vars іншого provider id, auth profiles,
config-backed auth і API-key onboarding choice. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI surfaces мають знати
choice id provider, group labels і simple one-flag auth wiring без
завантаження provider runtime. Залишайте provider runtime
`envVars` для operator-facing hints, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли канал має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження channel runtime.

### Порядок і використання hook

Для model/provider Plugin OpenClaw викликає hooks у такому приблизному порядку.
Колонка "Коли використовувати" є швидким decision guide.
Compatibility-only provider fields, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
перелічені тут.

| #   | Хук                               | Що він робить                                                                                                      | Коли використовувати                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію постачальника в `models.providers` під час генерування `models.json`                         | Постачальник володіє каталогом або типовими значеннями базової URL-адреси                                                                               |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, якими володіє постачальник, під час матеріалізації конфігурації | Типові значення залежать від режиму автентифікації, середовища або семантики сімейства моделей постачальника                                            |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                           | _(не хук Plugin)_                                                                                                                                       |
| 3   | `normalizeModelId`                | Нормалізує застарілі або попередні псевдоніми ідентифікаторів моделей перед пошуком                                | Постачальник володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                          |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства постачальника перед загальним складанням моделі                             | Постачальник володіє очищенням транспорту для користувацьких ідентифікаторів постачальників у тому самому транспортному сімействі                      |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням середовища виконання/постачальника                            | Постачальнику потрібне очищення конфігурації, яке має жити з Plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування нативного потокового використання до постачальників конфігурації                  | Постачальнику потрібні виправлення метаданих нативного потокового використання, керовані кінцевою точкою                                                |
| 7   | `resolveConfigApiKey`             | Визначає автентифікацію маркера середовища для постачальників конфігурації перед завантаженням автентифікації середовища виконання | Постачальник має власне визначення API-ключа через маркер середовища; `amazon-bedrock` також має тут вбудований визначник маркерів середовища AWS       |
| 8   | `resolveSyntheticAuth`            | Надає локальну/саморозміщену або конфігураційно підкріплену автентифікацію без збереження відкритого тексту        | Постачальник може працювати із синтетичним/локальним маркером облікових даних                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, якими володіє постачальник; типове `persistence` — `runtime-only` для облікових даних, якими володіє CLI/застосунок | Постачальник повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих токенів оновлення; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів позаду автентифікації, підкріпленої середовищем/конфігурацією | Постачальник зберігає синтетичні профілі-заповнювачі, які не мають отримувати пріоритет                                                                  |
| 11  | `resolveDynamicModel`             | Синхронний запасний шлях для ідентифікаторів моделей, якими володіє постачальник і яких ще немає в локальному реєстрі | Постачальник приймає довільні ідентифікатори моделей від upstream                                                                                        |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` запускається знову                                          | Постачальнику потрібні мережеві метадані перед визначенням невідомих ідентифікаторів                                                                    |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використовує визначену модель                               | Постачальнику потрібні переписування транспорту, але він усе ще використовує основний транспорт                                                         |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей вендора за іншим сумісним транспортом                                       | Постачальник розпізнає власні моделі на проксі-транспортах без перебирання постачальника на себе                                                       |
| 15  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований runner                                           | Постачальнику потрібне очищення схем транспортного сімейства                                                                                             |
| 16  | `inspectToolSchemas`              | Надає діагностику схем, якою володіє постачальник, після нормалізації                                             | Постачальник хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для постачальника                                            |
| 17  | `resolveReasoningOutputMode`      | Вибирає нативний або тегований контракт виводу міркувань                                                          | Постачальнику потрібні теговані міркування/фінальний вивід замість нативних полів                                                                        |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                      | Постачальнику потрібні типові параметри запиту або очищення параметрів для окремого постачальника                                                       |
| 19  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким транспортом                                                 | Постачальнику потрібен користувацький wire-протокол, а не лише обгортка                                                                                  |
| 20  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                             | Постачальнику потрібні обгортки заголовків/тіла/моделі запиту для сумісності без користувацького транспорту                                             |
| 21  | `resolveTransportTurnState`       | Додає нативні заголовки транспорту або метадані для кожного ходу                                                  | Постачальник хоче, щоб загальні транспорти надсилали нативну для постачальника ідентичність ходу                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні заголовки WebSocket або політику охолодження сесії                                                  | Постачальник хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або запасну політику                                                        |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає рядком `apiKey` середовища виконання                     | Постачальник зберігає додаткові метадані автентифікації та потребує користувацької форми токена середовища виконання                                    |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для користувацьких кінцевих точок оновлення або політики помилок оновлення         | Постачальник не вписується у спільні оновлювачі `pi-ai`                                                                                                  |
| 25  | `buildAuthDoctorHint`             | Підказка ремонту, що додається, коли оновлення OAuth завершується помилкою                                        | Постачальнику потрібні власні вказівки з ремонту автентифікації після помилки оновлення                                                                 |
| 26  | `matchesContextOverflowError`     | Власний для постачальника зіставлювач переповнення контекстного вікна                                             | Постачальник має необроблені помилки переповнення, які загальні евристики пропустили б                                                                  |
| 27  | `classifyFailoverReason`          | Класифікація причини перемикання на резервний шлях, якою володіє постачальник                                     | Постачальник може зіставити необроблені помилки API/транспорту з обмеженням швидкості/перевантаженням тощо                                             |
| 28  | `isCacheTtlEligible`              | Політика кешу підказок для проксі-/транзитних постачальників                                                     | Постачальнику потрібне проксі-специфічне обмеження TTL кешу                                                                                              |
| 29  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення при відсутній автентифікації                                           | Постачальнику потрібна специфічна для постачальника підказка відновлення при відсутній автентифікації                                                  |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                        | Постачальнику потрібні синтетичні рядки прямої сумісності в `models list` і засобах вибору                                                              |
| 31  | `resolveThinkingProfile`          | Специфічний для моделі набір рівнів `/think`, відображувані мітки та типове значення                              | Постачальник надає користувацьку шкалу мислення або бінарну мітку для вибраних моделей                                                                  |
| 32  | `isBinaryThinking`                | Хук сумісності перемикача міркувань увімкнено/вимкнено                                                            | Постачальник надає лише бінарне мислення увімкнено/вимкнено                                                                                              |
| 33  | `supportsXHighThinking`           | Хук сумісності підтримки міркувань `xhigh`                                                                         | Постачальник хоче `xhigh` лише для підмножини моделей                                                                                                    |
| 34  | `resolveDefaultThinkingLevel`     | Хук сумісності типового рівня `/think`                                                                             | Постачальник володіє типовою політикою `/think` для сімейства моделей                                                                                    |
| 35  | `isModernModelRef`                | Зіставлювач сучасних моделей для фільтрів live-профілю та вибору smoke                                            | Постачальник володіє зіставленням бажаних моделей для live/smoke                                                                                        |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний токен/ключ середовища виконання безпосередньо перед інференсом     | Постачальнику потрібен обмін токена або короткочасні облікові дані запиту                                                                               |
| 37  | `resolveUsageAuth`                | Визначає облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь статусу                                     | Провайдеру потрібен власний розбір токенів використання/квоти або інші облікові дані використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримує й нормалізує специфічні для провайдера знімки використання/квоти після визначення автентифікації                             | Провайдеру потрібна специфічна для провайдера кінцева точка використання або парсер payload                                                                           |
| 39  | `createEmbeddingProvider`         | Створює адаптер embeddings, яким володіє провайдер, для пам’яті/пошуку                                                     | Поведінка embeddings пам’яті належить Plugin провайдера                                                                                    |
| 40  | `buildReplayPolicy`               | Повертає політику повторного відтворення, що керує обробкою транскрипту для провайдера                                        | Провайдеру потрібна власна політика транскрипту (наприклад, вилучення thinking-блоків)                                                               |
| 41  | `sanitizeReplayHistory`           | Переписує історію повторного відтворення після загального очищення транскрипту                                                        | Провайдеру потрібні специфічні для провайдера перезаписи повторного відтворення поза спільними допоміжними засобами Compaction                                                             |
| 42  | `validateReplayTurns`             | Виконує фінальну валідацію або зміну форми turns повторного відтворення перед вбудованим runner                                           | Транспорту провайдера потрібна суворіша валідація turns після загальної санітизації                                                                    |
| 43  | `onModelSelected`                 | Запускає побічні ефекти після вибору, якими володіє провайдер                                                                 | Провайдеру потрібна телеметрія або власний стан провайдера, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний plugin провайдера, а потім переходять до інших plugins провайдерів із підтримкою хуків,
доки один із них фактично не змінить id моделі або transport/config. Це зберігає
роботу shim-ів провайдера для alias/compat, не вимагаючи від викликача знати, який
вбудований plugin відповідає за переписування. Якщо жоден хук провайдера не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно застосує
це очищення сумісності.

Якщо провайдеру потрібен повністю власний дротовий протокол або власний executor запитів,
це інший клас розширення. Ці хуки призначені для поведінки провайдера,
яка все ще виконується у звичайному циклі інференсу OpenClaw.

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

Вбудовані plugins провайдерів поєднують наведені вище хуки, щоб пристосуватися до catalog,
auth, thinking, replay і usage-потреб кожного постачальника. Авторитетний набір хуків міститься в
кожному plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    ids моделей перед статичним catalog OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики transcript через `buildReplayPolicy`, замість того щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл інференсу.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічної межі `api.ts` / `contract-api.ts` Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    generic SDK.
  </Accordion>
</AccordionGroup>

## Допоміжні засоби runtime

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

- `textToSpeech` повертає звичайний core TTS output payload для поверхонь файлів/voice-note.
- Використовує core конфігурацію `messages.tts` і вибір провайдера.
- Повертає PCM audio buffer + sample rate. Plugins мають resample/encode для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для vendor-owned вибору голосів або setup flows.
- Списки голосів можуть містити багатші metadata, як-от locale, gender і personality tags для provider-aware pickers.
- OpenAI і ElevenLabs зараз підтримують telephony. Microsoft не підтримує.

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

- Тримайте TTS policy, fallback і доставку відповіді в core.
- Використовуйте speech providers для vendor-owned поведінки synthesis.
- Застарілий input Microsoft `edge` нормалізується до provider id `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor plugin може володіти
  text, speech, image і майбутніми media providers, коли OpenClaw додаватиме ці
  контракти можливостей.

Для розуміння image/audio/video plugins реєструють один типізований
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

- Тримайте orchestration, fallback, config і channel wiring у core.
- Тримайте поведінку vendor у provider plugin.
- Additive expansion має лишатися типізованим: нові optional methods, нові optional
  result fields, нові optional capabilities.
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
- `extractStructuredWithModel(...)` є межею для plugins для обмеженого
  provider-owned image-first extraction. Додайте принаймні один image input;
  text inputs є додатковим контекстом.
  product plugins володіють своїми routes і schemas, тоді як OpenClaw володіє
  межею provider/runtime.
- Використовує core media-understanding audio configuration (`tools.media.audio`) і provider fallback order.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, input пропущений/непідтримуваний).
- `api.runtime.stt.transcribeAudioFile(...)` лишається alias для сумісності.

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

- `provider` і `model` є optional per-run overrides, а не persistent session changes.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для plugin-owned fallback runs оператори мають увімкнути це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical targets `provider/model`, або `"*"`, щоб явно дозволити будь-який target.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються замість мовчазного fallback.
- Subagent sessions, створені plugin, позначаються id plugin, який їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session усе ще потребує admin-scoped Gateway request.

Для web search plugins можуть споживати спільний runtime helper замість того,
щоб звертатися до wiring agent tool:

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

- Тримайте provider selection, credential resolution і shared request semantics у core.
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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка image-generation provider.
- `listProviders(...)`: перелічує доступні image-generation providers та їхні capabilities.

## HTTP-маршрути Gateway

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

Поля маршруту:

- `path`: шлях маршруту під gateway HTTP server.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну gateway auth, або `"plugin"` для plugin-managed auth/webhook verification.
- `match`: optional. `"exact"` (default) або `"prefix"`.
- `replaceExisting`: optional. Дозволяє тому самому plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Маршрути, що перекриваються, з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують області runtime оператора автоматично. Вони призначені для керованих Plugin вебхуків/перевірки підпису, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині області runtime запиту Gateway, але ця область навмисно консервативна:
  - bearer-автентифікація зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує області runtime маршрутів Plugin прив’язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів Plugin з ідентичністю, область runtime повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin із gateway-auth є неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте режим auth з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk`
під час створення нових plugins. Основні підшляхи:

| Підшлях                             | Призначення                                        |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/збирання каналу             |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби й umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Zod-схема кореневого `openclaw.json` (`OpenClawSchema`) |

Канальні plugins вибирають із сімейства вузьких seams — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
в одному контракті `approvalCapability`, а не змішувати між непов’язаними
полями Plugin. Див. [Канальні plugins](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації розміщені у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Віддавайте перевагу `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого сумісного barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими compatibility shims для
старіших plugins. Новий код має натомість імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного bundled пакета Plugin):

- `index.js` — точка входу bundled Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні plugins мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із core або з іншого Plugin.
Точки входу, завантажені через фасад, віддають перевагу активному знімку runtime-конфігурації, коли він
існує, а потім повертаються до розв’язаного конфігураційного файла на диску.

Підшляхи для конкретних capabilities, як-от `image-generation`, `media-understanding`
і `speech`, існують, бо bundled plugins використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну довідкову
сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugins мають володіти внесками схеми `describeMessageTool(...)`, специфічними для каналу,
для примітивів, що не є повідомленнями, як-от reactions, reads і polls.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість provider-native полів кнопок, компонентів, блоків або карток.
Див. [Представлення повідомлення](/uk/plugins/message-presentation) щодо контракту,
правил fallback, зіставлення провайдерів і checklist для авторів Plugin.

Plugins із можливістю надсилання оголошують, що вони можуть рендерити, через capabilities повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів pinned-delivery

Core вирішує, чи рендерити представлення нативно, чи деградувати його до тексту.
Не відкривайте provider-native UI escape hatches із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy native schemas залишаються експортованими для наявних
сторонніх plugins, але нові plugins не мають їх використовувати.

## Розв’язання цілей каналу

Канальні plugins мають володіти специфічною для каналу семантикою цілей. Тримайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` перед пошуком у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи має
  вхідне значення перейти прямо до id-like розв’язання замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` є fallback Plugin, коли
  core потребує фінального provider-owned розв’язання після нормалізації або після
  промаху directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє provider-specific побудовою маршруту
  сеансу після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбутися до
  пошуку peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/native target id".
- Використовуйте `resolveTarget` для provider-specific fallback нормалізації, а не для
  широкого пошуку в directory.
- Тримайте provider-native ids, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або provider-specific params, а не в загальних полях SDK.

## Директорії на основі конфігурації

Plugins, які виводять записи directory з конфігурації, мають тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers, керовані allowlist
- налаштовані мапи каналів/груп
- статичні fallback directory в межах акаунта

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Специфічна для каналу інспекція акаунта й нормалізація id мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Provider plugins можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли Plugin володіє provider-specific model ids, базовими URL
за замовчуванням або auth-gated метаданими моделей.

`catalog.order` керує тим, коли каталог Plugin зливається відносно вбудованих implicit providers OpenClaw:

- `simple`: звичайні провайдери на основі API-key або env
- `profile`: провайдери, що з’являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших implicit providers

Пізніші провайдери перемагають під час колізії ключів, тому plugins можуть навмисно перевизначати
вбудований запис провайдера з таким самим provider id.

Plugins також можуть публікувати read-only рядки моделей через
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Це forward path для поверхонь list/help/picker і підтримує
рядки `text`, `image_generation`, `video_generation` і `music_generation`.
Provider plugins усе ще володіють live-викликами endpoint, token exchange і зіставленням
відповідей постачальника; core володіє спільною формою рядка, source labels і форматуванням довідки
медіаінструментів. Реєстрації media-generation provider автоматично синтезують статичні
рядки каталогу з `defaultModel`, `models` і `capabilities`.

Сумісність:

- `discovery` усе ще працює як legacy alias, але видає попередження про застарілість
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`
- `augmentModelCatalog` застаріло; bundled providers мають публікувати
  додаткові рядки через `registerModelCatalogProvider`

## Read-only інспекція каналу

Якщо ваш Plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` є runtime-шляхом. Він може припускати, що credentials
  повністю матеріалізовані, і швидко завершуватися помилкою, коли потрібні secrets відсутні.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки doctor/config
  repair, не мають потребувати матеріалізації runtime credentials лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан акаунта.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу credentials, коли це доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення token лише для повідомлення read-only
  доступності. Повернення `tokenStatus: "available"` (і відповідного поля source)
  достатньо для status-style команд.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному командному шляху.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому командному
шляху" замість аварійного завершення або помилкового повідомлення, що акаунт не налаштований.

## Пакети пакетів

Директорія Plugin може містити `package.json` з `openclaw.extensions`:

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

Якщо ваш Plugin імпортує npm deps, встановіть їх у цій директорії, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Обмеження безпеки: кожен entry `openclaw.extensions` має залишатися всередині директорії Plugin
після розв’язання symlink. Entries, що виходять за межі директорії package, відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності Plugin за допомогою
локального для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей Plugin "pure JS/TS" і уникайте пакетів, які потребують
`postinstall` builds.

Опційно: `openclaw.setupEntry` може вказувати на легкий setup-only module.
Коли OpenClaw потребує setup surfaces для вимкненого канального Plugin або
коли канальний Plugin увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить startup і setup легшими,
коли основна точка входу вашого Plugin також підключає tools, hooks або інший runtime-only
код.

Опційно: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити канальний Plugin до того самого шляху `setupEntry` під час pre-listen
фази startup Gateway, навіть коли канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має зареєструвати кожну можливість, якою володіє канал і від якої залежить запуск, як-от:

- сама реєстрація каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які методи, інструменти або сервіси gateway, які мають існувати протягом того самого вікна

Якщо ваш full entry усе ще володіє будь-якою обов’язковою можливістю запуску, не вмикайте
цей прапорець. Залиште Plugin із типовою поведінкою і дозвольте OpenClaw завантажити
full entry під час запуску.

Вбудовані канали також можуть публікувати setup-only helper-и контрактної поверхні, до яких core
може звертатися до завантаження повного runtime каналу. Поточна поверхня
setup promotion така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли потрібно підвищити legacy single-account конфігурацію каналу
до `channels.<id>.accounts.*` без завантаження повного Plugin entry.
Matrix є поточним вбудованим прикладом: він переносить лише ключі auth/bootstrap у
іменований підвищений account, коли іменовані accounts уже існують, і може зберегти
налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapters зберігають discovery вбудованої контрактної поверхні лінивим. Час
імпорту залишається легким; promotion surface завантажується лише під час першого використання, а не
повторно входить у запуск вбудованого каналу під час import module.

Коли ці поверхні запуску містять gateway RPC methods, тримайте їх у
префіксі, специфічному для Plugin. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди resolve
до `operator.admin`, навіть якщо Plugin запитує вужчу scope.

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

Channel plugins можуть оголошувати setup/discovery metadata через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це залишає core catalog без data.

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

- `detailLabel`: вторинна мітка для багатших catalog/status surfaces
- `docsLabel`: перевизначає текст посилання для docs link
- `preferOver`: plugin/channel ids нижчого пріоритету, які цей catalog entry має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controls для selection-surface copy
- `markdownCapable`: позначає канал як markdown-capable для рішень щодо outbound formatting
- `exposure.configured`: приховує канал із configured-channel listing surfaces, коли встановлено `false`
- `exposure.setup`: приховує канал з interactive setup/configure pickers, коли встановлено `false`
- `exposure.docs`: позначає канал як internal/private для docs navigation surfaces
- `showConfigured` / `showInSetup`: legacy aliases, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: додає канал до стандартного quickstart `allowFrom` flow
- `forceAccountBinding`: вимагає явного account binding, навіть коли існує лише один account
- `preferSessionLookupForAnnounceTarget`: надає перевагу session lookup під час resolve announce targets

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, export з MPM
registry). Покладіть JSON-файл в один із таких шляхів:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (чи `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser також приймає `"packages"` або `"plugins"` як legacy aliases для ключа `"entries"`.

Згенеровані channel catalog entries і provider install catalog entries expose
нормалізовані install-source facts поруч із сирим блоком `openclaw.install`. Ці
нормалізовані facts визначають, чи npm spec є exact version або floating
selector, чи присутні expected integrity metadata, і чи також доступний local
source path. Коли catalog/package identity відома, нормалізовані facts попереджають, якщо
розпарсена назва npm package відхиляється від цієї identity.
Вони також попереджають, коли `defaultChoice` є недійсним або вказує на source, який
недоступний, і коли npm integrity metadata присутня без valid npm
source. Consumers мають розглядати `installSource` як additive optional field, щоб
hand-built entries і catalog shims не мусили синтезувати його.
Це дає змогу onboarding і diagnostics пояснювати source-plane state без
імпорту plugin runtime.

Official external npm entries мають надавати перевагу exact `npmSpec` разом із
`expectedIntegrity`. Bare package names і dist-tags усе ще працюють для
сумісності, але вони показують source-plane warnings, щоб catalog міг рухатися
до pinned, integrity-checked installs без ламання existing plugins.
Коли onboarding встановлює з local catalog path, він записує managed plugin
plugin index entry з `source: "path"` і workspace-relative
`sourcePath`, коли це можливо. Absolute operational load path залишається в
`plugins.load.paths`; install record уникає дублювання local workstation
paths у long-lived config. Це зберігає local development installs видимими для
source-plane diagnostics без додавання другої raw filesystem-path disclosure
surface. Збережений plugin index `plugins/installs.json` є install
source of truth і може оновлюватися без завантаження plugin runtime modules.
Його map `installRecords` є durable, навіть коли manifest Plugin відсутній або
недійсний; його array `plugins` є rebuildable manifest view.

## Context engine plugins

Context engine plugins володіють orchestration session context для ingest, assembly
і Compaction. Зареєструйте їх зі свого Plugin за допомогою
`api.registerContextEngine(id, factory)`, потім виберіть active engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити default context
pipeline, а не просто додати memory search чи hooks.

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

Factory `ctx` expose optional `config`, `agentDir` і `workspaceDir`
values для construction-time initialization.

Якщо ваш engine **не** володіє алгоритмом Compaction, залиште `compact()`
реалізованим і делегуйте його явно:

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

Коли Plugin потребує поведінки, яка не вписується в поточний API, не обходьте
plugin system через private reach-in. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте core contract
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, config merge,
   lifecycle, channel-facing semantics і shape runtime helper.
2. додайте typed plugin registration/runtime surfaces
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   typed capability surface.
3. під’єднайте core + channel/feature consumers
   Channels і feature plugins мають споживати нову можливість через core,
   а не імпортувати vendor implementation напряму.
4. зареєструйте vendor implementations
   Vendor plugins потім реєструють свої backends для capability.
5. додайте contract coverage
   Додайте tests, щоб ownership і registration shape залишалися явними з часом.

Саме так OpenClaw залишається opinionated, не стаючи hardcoded під worldview одного
provider. Див. [Capability Cookbook](/uk/plugins/adding-capabilities)
для конкретного checklist файлів і worked example.

### Checklist можливостей

Коли ви додаєте нову можливість, реалізація зазвичай має торкатися цих
surfaces разом:

- core contract types у `src/<capability>/types.ts`
- core runner/runtime helper у `src/<capability>/runtime.ts`
- plugin API registration surface у `src/plugins/types.ts`
- plugin registry wiring у `src/plugins/registry.ts`
- plugin runtime exposure у `src/plugins/runtime/*`, коли feature/channel
  plugins мають споживати його
- capture/test helpers у `src/test-utils/plugin-registration.ts`
- ownership/contract assertions у `src/plugins/contracts/registry.ts`
- operator/plugin docs у `docs/`

Якщо одна з цих surfaces відсутня, це зазвичай ознака, що capability ще
не повністю інтегрована.

### Шаблон можливості

Мінімальний pattern:

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

Pattern contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє capability contract + orchestration
- vendor plugins володіють vendor implementations
- feature/channel plugins споживають runtime helpers
- contract tests зберігають ownership явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна capability model і shapes
- [Plugin SDK subpaths](/uk/plugins/sdk-subpaths)
- [Plugin SDK setup](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
