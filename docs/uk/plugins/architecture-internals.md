---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні аспекти архітектури Plugin: конвеєр завантаження, реєстр, хуки середовища виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-05-02T14:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin і контрактів володіння/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка є довідником щодо внутрішніх механізмів: конвеєра завантаження, реєстру, runtime-хуків, HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені Plugin-кандидатів
2. читає нативні або сумісні маніфести бандлів і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   сторонній локальний вихідний TypeScript використовує аварійний fallback Jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що доступне (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Запобіжні перевірки виконуються **до** runtime-виконання. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім користувачам або
володіння шляхом виглядає підозріло для невбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для площини керування. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/skills/схему конфігурації або можливості бандла
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною площини даних. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або provider-потоки.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на площині керування.
Це лише метадані-дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі live-активації тепер використовують підказки маніфесту щодо команд, каналів і providers,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- налаштування каналу/розв’язання Plugin звужується до Plugin, які володіють запитаним
  id каналу
- явне налаштування provider/розв’язання runtime звужується до Plugin, які володіють запитаним
  id provider
- планування запуску Gateway використовує `activation.onStartup` для явних startup-імпортів
  і відмов від запуску; Plugin без startup-метаданих завантажуються лише
  через вужчі тригери активації

Runtime-попередні завантаження під час запиту, які просять широкий scope `all`, усе ще виводять
явний ефективний набір id Plugin з конфігурації, планування запуску, налаштованих
каналів, слотів і правил автоввімкнення. Якщо цей виведений набір порожній, OpenClaw
завантажує порожній runtime-реєстр замість розширення до кожного доступного для виявлення
Plugin.

Планувальник активації відкриває як API лише з ids для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback-володіння маніфесту,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер надає перевагу id, якими володіють дескриптори, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити Plugin-кандидати, перш ніж fallback-перехід до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки під час налаштування. Списки
налаштування provider використовують маніфестні `providerAuthChoices`, виведені з дескрипторів варіанти
налаштування та метадані інсталяційного каталогу без завантаження runtime provider. Явне
`setup.requiresRuntime: false` є descriptor-only межею; пропущене
`requiresRuntime` зберігає застарілий fallback до setup-api для сумісності. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований id setup provider або CLI
backend, пошук налаштування відхиляє неоднозначного власника замість покладання на
порядок виявлення. Коли setup runtime виконується, діагностика реєстру повідомляє
про розбіжності між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, без блокування застарілих Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані реєстру маніфестів
за часовими вікнами настінного годинника. Встановлення, редагування маніфестів і зміни load-path
мають ставати видимими під час наступного явного читання метаданих або перебудови snapshot.
Парсер файлу маніфесту може зберігати обмежений кеш сигнатур файлів, прив’язаний до
відкритого шляху маніфесту, inode, розміру й часових міток; цей кеш лише уникає
повторного парсингу незмінених байтів і не повинен кешувати відповіді щодо виявлення,
реєстру, власника або політики.

Безпечний швидкий шлях метаданих — це явне володіння об’єктом, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`, виведену
`PluginLookUpTable` або явний реєстр маніфестів через ланцюжок викликів.
Перевірка конфігурації, startup auto-enable, bootstrap Plugin і вибір provider
можуть повторно використовувати ці об’єкти, доки вони представляють поточну конфігурацію та
інвентар Plugin. Пошук налаштування все ще реконструює метадані маніфесту на вимогу,
якщо конкретний шлях налаштування не отримує явний реєстр маніфестів; зберігайте це
як fallback холодного шляху замість додавання прихованих кешів lookup. Коли вхідні дані
змінюються, перебудовуйте й замінюйте snapshot замість його мутації або збереження
історичних копій.
Подання над активним реєстром Plugin і helpers bootstrap для вбудованих каналів
мають переобчислюватися з поточного реєстру/кореня. Короткоживучі мапи допустимі
всередині одного виклику для дедуплікації роботи або захисту від повторного входу; вони не повинні ставати process
metadata caches.

Для завантаження Plugin постійний шар кешу — це runtime-завантаження. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти справді завантажуються, як-от:

- `PluginLoaderCacheState` і сумісні активні runtime-реєстри
- кеші jiti/module і кеші завантажувача public-surface, що використовуються, щоб уникати повторного імпорту
  тієї самої runtime-поверхні
- файлові кеші для встановлених артефактів Plugin
- короткоживучі per-call мапи для нормалізації шляхів або розв’язання дублікатів

Ці кеші є деталями реалізації площини даних. Вони не повинні відповідати на
питання площини керування, як-от "який Plugin володіє цим provider?", якщо викликач
навмисно не попросив runtime-завантаження.

Не додавайте постійні або wall-clock кеші для:

- результатів виявлення
- прямих реєстрів маніфестів
- реєстрів маніфестів, реконструйованих зі встановленого індексу Plugin
- lookup власника provider, приглушення моделей, політики provider або метаданих public-artifact
- будь-якої іншої відповіді, виведеної з маніфесту, де змінений маніфест, встановлений індекс
  або load path має бути видимим під час наступного читання метаданих

Викликачі, які перебудовують метадані маніфесту зі збереженого встановленого індексу Plugin,
реконструюють цей реєстр на вимогу. Встановлений індекс є довготривалим
станом source-plane; це не прихований in-process кеш метаданих.

## Модель реєстру

Завантажені Plugin не мутують напряму випадкові core globals. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- providers
- RPC-обробники Gateway
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, якими володіють Plugin

Потім core-функції читають із цього реєстру замість прямої взаємодії з модулями Plugin.
Це зберігає завантаження односпрямованим:

- модуль Plugin -> реєстрація в реєстрі
- core runtime -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості core-поверхонь потрібна лише
одна точка інтеграції: "прочитати реєстр", а не "спеціально обробляти кожен модуль Plugin".

## Callback-и прив’язування розмови

Plugin, які прив’язують розмову, можуть реагувати, коли approval розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як запит
на bind схвалено або відхилено:

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
- `binding`: розв’язана прив’язка для схвалених запитів
- `request`: початковий підсумок запиту, підказка detach, id відправника та
  метадані розмови

Цей callback є лише сповіщенням. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення core-обробки approval.

## Runtime-хуки provider

Provider Plugin мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, застарілий compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, розв’язання моделей,
  обгортання stream, рівні thinking, replay policy і usage endpoints. Повний список див.
  у розділі [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw усе ще володіє загальним agent loop, failover, обробкою transcript і
tool policy. Ці хуки є поверхнею extension для provider-specific
поведінки без потреби в повністю кастомному inference transport.

Використовуйте маніфестний `setup.providers[].envVars`, коли provider має env-based
облікові дані, які generic auth/status/model-picker шляхи мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` усе ще читається
compatibility adapter протягом deprecation window, а невбудовані Plugin,
які його використовують, отримують діагностику маніфесту. Використовуйте маніфестний `providerAuthAliases`,
коли один id provider має повторно використовувати env vars, auth profiles,
config-backed auth і вибір onboarding з API key іншого id provider. Використовуйте маніфестний
`providerAuthChoices`, коли onboarding/auth-choice CLI surfaces мають знати
choice id provider, group labels і просте one-flag auth wiring без
завантаження runtime provider. Зберігайте runtime
`envVars` provider для operator-facing підказок, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфестний `channelEnvVars`, коли канал має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження channel runtime.

### Порядок хуків і використання

Для Plugin моделей/provider OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник для ухвалення рішення.
Compatibility-only поля provider, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
перелічені тут.

| #   | Хук                               | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                         | Провайдер володіє каталогом або типовими значеннями базової URL-адреси                                                                       |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму автентифікації, середовища або семантики родини моделей провайдера                                       |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                       | _(не хук plugin)_                                                                                                                             |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Провайдер володіє очищенням псевдонімів перед канонічним розпізнаванням моделі                                                               |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` родини провайдера перед загальним складанням моделі                               | Провайдер володіє очищенням транспорту для користувацьких ідентифікаторів провайдера в тій самій родині транспорту                          |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розпізнаванням runtime/провайдера                                    | Провайдер потребує очищення конфігурації, яке має жити разом із plugin; вбудовані допоміжні засоби родини Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування нативного використання потокового передавання до провайдерів конфігурації     | Провайдер потребує виправлень метаданих нативного використання потокового передавання, керованих endpoint                                   |
| 7   | `resolveConfigApiKey`             | Розпізнає автентифікацію через env-маркер для провайдерів конфігурації перед завантаженням runtime-автентифікації | Провайдер має власне для провайдера розпізнавання API-ключа через env-маркер; `amazon-bedrock` також має тут вбудований розпізнавач AWS env-маркера |
| 8   | `resolveSyntheticAuth`            | Надає локальну/самостійно розгорнуту або конфігураційно підкріплену автентифікацію без збереження plaintext    | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                   |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, що належать провайдеру; типове `persistence` — `runtime-only` для облікових даних, якими володіє CLI/app | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh tokens; оголосіть `contracts.externalAuthProviders` у manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілю за автентифікацією, підкріпленою env/config       | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають перемагати за пріоритетом                                                    |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ідентифікаторів моделей, що належать провайдеру й ще не є в локальному реєстрі         | Провайдер приймає довільні upstream-ідентифікатори моделей                                                                                    |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                      | Провайдер потребує мережевих метаданих перед розпізнаванням невідомих ідентифікаторів                                                        |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає розпізнану модель                            | Провайдер потребує переписувань транспорту, але все ще використовує core-транспорт                                                           |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей постачальника за іншим сумісним транспортом                                 | Провайдер розпізнає власні моделі на проксі-транспортах без перебирання ролі провайдера                                                      |
| 15  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                      | Провайдер потребує очищення схем родини транспорту                                                                                            |
| 16  | `inspectToolSchemas`              | Надає діагностику схем, що належить провайдеру, після нормалізації                                             | Провайдер хоче попередження щодо ключових слів без навчання core правилам, специфічним для провайдера                                       |
| 17  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: нативний або tagged                                                         | Провайдер потребує tagged reasoning/фінального виводу замість нативних полів                                                                 |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками опцій потоку                                       | Провайдер потребує типових параметрів запиту або очищення параметрів для окремого провайдера                                                  |
| 19  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким транспортом                                              | Провайдер потребує користувацького wire-протоколу, а не лише обгортки                                                                         |
| 20  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                          | Провайдер потребує compat-обгорток заголовків/тіла/моделі запиту без користувацького транспорту                                               |
| 21  | `resolveTransportTurnState`       | Додає нативні per-turn транспортні заголовки або метадані                                                      | Провайдер хоче, щоб загальні транспорти надсилали нативну для провайдера ідентичність turn                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні WebSocket-заголовки або політику cool-down сеансу                                                | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сеансу або fallback-політику                                              |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                              | Провайдер зберігає додаткові метадані автентифікації та потребує користувацької форми runtime-токена                                         |
| 24  | `refreshOAuth`                    | Перевизначення OAuth refresh для користувацьких endpoint refresh або політики refresh-failure                  | Провайдер не вписується у спільні refreshers `pi-ai`                                                                                          |
| 25  | `buildAuthDoctorHint`             | Підказка для виправлення, що додається, коли OAuth refresh зазнає невдачі                                      | Провайдер потребує власних для провайдера вказівок з відновлення автентифікації після невдачі refresh                                       |
| 26  | `matchesContextOverflowError`     | Matcher переповнення context-window, що належить провайдеру                                                   | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                  |
| 27  | `classifyFailoverReason`          | Класифікація причини failover, що належить провайдеру                                                          | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/overload/тощо                                                             |
| 28  | `isCacheTtlEligible`              | Політика prompt-cache для проксі/backhaul провайдерів                                                          | Провайдер потребує проксі-специфічного обмеження cache TTL                                                                                    |
| 29  | `buildMissingAuthMessage`         | Заміна для загального повідомлення відновлення при відсутній автентифікації                                    | Провайдер потребує специфічної для провайдера підказки відновлення при відсутній автентифікації                                              |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                     | Провайдер потребує синтетичних forward-compat рядків у `models list` і picker                                                                |
| 31  | `resolveThinkingProfile`          | Набір рівнів `/think` для конкретної моделі, мітки відображення та типове значення                             | Провайдер надає користувацьку драбину thinking або бінарну мітку для вибраних моделей                                                        |
| 32  | `isBinaryThinking`                | Compat-хук перемикача reasoning увімкнено/вимкнено                                                             | Провайдер надає лише бінарне thinking увімкнено/вимкнено                                                                                      |
| 33  | `supportsXHighThinking`           | Compat-хук підтримки reasoning `xhigh`                                                                         | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | Compat-хук типового рівня `/think`                                                                             | Провайдер володіє типовою політикою `/think` для родини моделей                                                                               |
| 35  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів live-профілю та вибору smoke                                             | Провайдер володіє зіставленням бажаних live/smoke моделей                                                                                    |
| 36  | `prepareRuntimeAuth`              | Обмін налаштованих облікових даних на фактичний runtime-токен/ключ безпосередньо перед inference              | Провайдер потребує обміну токена або короткочасних облікових даних запиту                                                                    |
| 37  | `resolveUsageAuth`                | Визначити облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь стану                                     | Постачальнику потрібен користувацький розбір токена використання/квоти або інші облікові дані використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримати й нормалізувати специфічні для постачальника знімки використання/квоти після визначення автентифікації                             | Постачальнику потрібна специфічна для постачальника кінцева точка використання або парсер корисного навантаження                                                                           |
| 39  | `createEmbeddingProvider`         | Побудувати належний постачальнику адаптер ембедингів для пам’яті/пошуку                                                     | Поведінка ембедингів пам’яті належить Plugin постачальника                                                                                    |
| 40  | `buildReplayPolicy`               | Повернути політику повторного відтворення, що керує обробкою транскрипту для постачальника                                        | Постачальнику потрібна користувацька політика транскрипту (наприклад, вилучення блоків мислення)                                                               |
| 41  | `sanitizeReplayHistory`           | Переписати історію повторного відтворення після загального очищення транскрипту                                                        | Постачальнику потрібні специфічні для постачальника переписування повторного відтворення поза спільними допоміжними засобами Compaction                                                             |
| 42  | `validateReplayTurns`             | Остаточна валідація або зміна форми ходів повторного відтворення перед вбудованим runner                                           | Транспорт постачальника потребує суворішої валідації ходів після загальної санітизації                                                                    |
| 43  | `onModelSelected`                 | Виконати належні постачальнику побічні ефекти після вибору                                                                 | Постачальнику потрібна телеметрія або належний постачальнику стан, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin постачальника, а потім переходять до інших Plugin постачальників,
здатних працювати з хуками, доки один із них фактично не змінить ідентифікатор
моделі або транспорт/конфігурацію. Це дає змогу shim-сумісності
alias/compat постачальників працювати без вимоги до викликача знати, який
вбудований Plugin володіє переписуванням. Якщо жоден хук постачальника не
переписує підтримуваний запис конфігурації Google-родини, вбудований нормалізатор
конфігурації Google усе одно застосує це очищення сумісності.

Якщо постачальнику потрібен повністю власний wire protocol або власний виконавець
запитів, це інший клас розширення. Ці хуки призначені для поведінки
постачальника, яка все ще працює у звичайному циклі інференсу OpenClaw.

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

Вбудовані Plugin постачальників поєднують наведені вище хуки, щоб відповідати
потребам каталогу, автентифікації, міркування, відтворення та використання кожного
постачальника. Авторитетний набір хуків міститься з кожним Plugin у `extensions/`;
ця сторінка ілюструє форми, а не дублює список.

<AccordionGroup>
  <Accordion title="Постачальники з наскрізним каталогом">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб показувати upstream
    ідентифікатори моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Постачальники OAuth і endpoint використання">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Родини відтворення й очищення transcript">
    Спільні іменовані родини (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають постачальникам змогу
    підключатися до політики transcript через `buildReplayPolicy`, замість того
    щоб кожен Plugin повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Постачальники лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл
    інференсу.
  </Accordion>
  <Accordion title="Допоміжні засоби потоку, специфічні для Anthropic">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` містяться всередині
    публічної межі `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Допоміжні засоби runtime

Plugin можуть отримувати доступ до вибраних допоміжних засобів ядра через
`api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS ядра для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію ядра `messages.tts` і вибір постачальника.
- Повертає аудіобуфер PCM + частоту дискретизації. Plugin мають виконувати ресемплінг/кодування для постачальників.
- `listVoices` є необов’язковим для кожного постачальника. Використовуйте його для засобів вибору голосу або потоків налаштування, якими володіє постачальник.
- Списки голосів можуть містити багатші метадані, як-от локаль, стать і теги особистості для засобів вибору, обізнаних про постачальника.
- OpenAI та ElevenLabs сьогодні підтримують телефонію. Microsoft не підтримує.

Plugin також можуть реєструвати постачальників мовлення через `api.registerSpeechProvider(...)`.

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

- Залишайте політику TTS, fallback і доставку відповідей у ядрі.
- Використовуйте постачальників мовлення для поведінки синтезу, якою володіє постачальник.
- Застарілий вхід Microsoft `edge` нормалізується до ідентифікатора постачальника `microsoft`.
- Бажана модель володіння орієнтована на компанію: один Plugin постачальника може володіти
  постачальниками тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додає ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin реєструють одного типізованого
постачальника media-understanding замість загального набору ключ/значення:

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

- Залишайте оркестрацію, fallback, конфігурацію та підключення каналів у ядрі.
- Залишайте поведінку постачальника в Plugin постачальника.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого патерну:
  - ядро володіє контрактом можливості та допоміжним засобом runtime
  - Plugin постачальників реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin функцій/каналів використовують `api.runtime.videoGeneration.*`

Для допоміжних засобів runtime media-understanding Plugin можуть викликати:

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
media-understanding, або старіший alias STT:

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
- Використовує аудіоконфігурацію ядра media-understanding (`tools.media.audio`) і порядок fallback постачальників.
- Повертає `{ text: undefined }`, коли вихід транскрипції не створено (наприклад, пропущений/непідтримуваний вхід).
- `api.runtime.stt.transcribeAudioFile(...)` залишається alias сумісності.

Plugin також можуть запускати фонові виконання subagent через `api.runtime.subagent`:

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
- Для fallback-запусків, якими володіє Plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Недовірені subagent-запуски Plugin усе ще працюють, але запити перевизначення відхиляються, а не тихо переходять до fallback.
- Створені Plugin subagent-сесії позначаються ідентифікатором Plugin, який їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці власні сесії; довільне видалення сесій усе ще потребує admin-scoped запиту Gateway.

Для вебпошуку Plugin можуть використовувати спільний допоміжний засіб runtime замість
доступу до підключення інструментів агента:

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

Plugin також можуть реєструвати постачальників вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Залишайте вибір постачальника, розв’язання облікових даних і спільну семантику запитів у ядрі.
- Використовуйте постачальників вебпошуку для специфічних для постачальника транспортів пошуку.
- `api.runtime.webSearch.*` є бажаною спільною поверхнею для Plugin функцій/каналів, яким потрібна пошукова поведінка без залежності від wrapper інструмента агента.

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

Plugin можуть відкривати HTTP endpoint за допомогою `api.registerHttpRoute(...)`.

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
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну автентифікацію gateway, або `"plugin"` для керованої Plugin автентифікації/перевірки webhook.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: поверніть `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` видалено, і це спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один plugin не може замінити маршрут іншого plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Залишайте ланцюжки переходу `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично операторські runtime scopes. Вони призначені для webhook/перевірки підписів, керованих plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) залишає runtime scopes маршрутів plugin прив'язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентифікацією (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах до маршруту plugin з ідентифікацією, runtime scope повертається до `operator.write`
- Практичне правило: не вважайте plugin route з gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте auth-режим з ідентифікацією та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових plugins використовуйте вузькі підшляхи SDK замість монолітного root barrel `openclaw/plugin-sdk`.
Основні підшляхи:

| Підшлях                            | Призначення                                      |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби entry/build для каналу                        |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та umbrella-контракт       |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальні plugins вибирають із сімейства вузьких меж — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між непов'язаними
полями plugin. Див. [Канальні plugins](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації містяться у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Віддавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого compatibility barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими compatibility shims для
старіших plugins. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні entry points репозиторію (для кореня кожного bundled plugin package):

- `index.js` — entry bundled plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — entry setup plugin

Зовнішні plugins мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого plugin package з core або з іншого plugin.
Entry points, завантажені через facade, віддають перевагу активному знімку runtime config, якщо він
існує, а потім повертаються до розв'язаного config file на диску.

Підшляхи, специфічні для capabilities, як-от `image-generation`, `media-understanding`
і `speech`, існують, бо bundled plugins використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну сторінку довідки SDK,
коли покладаєтеся на них.

## Схеми message tool

Plugins мають володіти внесками до channel-specific схеми `describeMessageTool(...)`
для не-message примітивів, як-от reactions, reads і polls.
Спільна presentation для надсилання має використовувати загальний контракт `MessagePresentation`
замість provider-native полів button, component, block або card.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
правил fallback, provider mapping і checklist для автора plugin.

Plugins, здатні надсилати повідомлення, оголошують, що вони можуть відтворювати, через message capabilities:

- `presentation` для semantic presentation blocks (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів pinned-delivery

Core вирішує, чи відтворювати presentation нативно, чи деградувати її до тексту.
Не відкривайте provider-native UI escape hatches із загального message tool.
Застарілі допоміжні засоби SDK для legacy native schemas залишаються експортованими для наявних
сторонніх plugins, але нові plugins не повинні їх використовувати.

## Розв'язання цілі каналу

Канальні plugins мають володіти channel-specific семантикою цілей. Залишайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` перед пошуком у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  input має одразу перейти до id-like resolution замість directory search.
- `messaging.targetResolver.resolveTarget(...)` є fallback plugin, коли
  core потребує остаточного provider-owned resolution після нормалізації або після
  directory miss.
- `messaging.resolveOutboundSessionRoute(...)` володіє provider-specific побудовою маршруту сесії,
  коли ціль розв'язано.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для category decisions, які мають відбуватися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як explicit/native target id".
- Використовуйте `resolveTarget` для provider-specific normalization fallback, а не для
  широкого directory search.
- Зберігайте provider-native ids, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або provider-specific params, а не в загальних полях SDK.

## Довідники на основі конфігурації

Plugins, які виводять directory entries з конфігурації, мають тримати цю логіку в
plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- peers для DM, керовані allowlist
- налаштовані channel/group maps
- account-scoped static directory fallbacks

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування limit
- допоміжні засоби deduping/normalization
- побудову `ChannelDirectoryEntry[]`

Channel-specific inspection облікового запису та нормалізація id мають залишатися в
реалізації plugin.

## Каталоги provider

Provider plugins можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного provider entry
- `{ providers }` для кількох provider entries

Використовуйте `catalog`, коли plugin володіє provider-specific model ids, base URL
defaults або auth-gated model metadata.

`catalog.order` керує тим, коли каталог plugin об'єднується відносно
вбудованих implicit providers OpenClaw:

- `simple`: звичайні providers, керовані API key або env
- `profile`: providers, що з'являються, коли існують auth profiles
- `paired`: providers, що синтезують кілька пов'язаних provider entries
- `late`: останній прохід, після інших implicit providers

Пізніші providers перемагають під час key collision, тому plugins можуть навмисно перевизначати
вбудований provider entry з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only inspection каналу

Якщо ваш plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime path. Він може припускати, що credentials
  повністю матеріалізовані, і швидко завершуватися помилкою, коли потрібні secrets відсутні.
- Read-only command paths, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/config
  repair, не повинні матеріалізувати runtime credentials лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля source/status для credentials, коли доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення token лише для повідомлення read-only
  availability. Повернення `tokenStatus: "available"` (і відповідного поля source)
  достатньо для status-style commands.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному command path.

Це дає read-only commands змогу повідомляти "configured but unavailable in this command
path" замість аварійного завершення або помилкового повідомлення, що обліковий запис не налаштований.

## Пакети package

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

Кожен entry стає plugin. Якщо pack перелічує кілька extensions, plugin id
стає `name/<fileBase>`.

Якщо ваш plugin імпортує npm deps, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Security guardrail: кожен entry `openclaw.extensions` має залишатися всередині каталогу plugin
після розв'язання symlink. Entries, що виходять за межі package directory,
відхиляються.

Security note: `openclaw plugins install` встановлює залежності plugin за допомогою
project-local `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані global npm install settings.
Тримайте дерева залежностей plugin "pure JS/TS" і уникайте package, які потребують
`postinstall` builds.

Необов'язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує setup surfaces для вимкненого channel plugin або
коли channel plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повного plugin entry. Це полегшує startup і setup,
коли ваш main plugin entry також під'єднує tools, hooks або інший runtime-only
code.

Необов'язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести channel plugin на той самий шлях `setupEntry` під час pre-listen startup phase
gateway, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup surface, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має зареєструвати кожну channel-owned capability, від якої залежить startup, як-от:

- сама реєстрація каналу
- будь-які HTTP routes, які мають бути доступні до того, як gateway почне слухати
- будь-які gateway methods, tools або services, які мають існувати протягом того самого вікна

Якщо ваш full entry досі володіє будь-якою required startup capability, не вмикайте
цей flag. Залиште plugin на default behavior і дозвольте OpenClaw завантажити
full entry під час startup.

Bundled channels також можуть публікувати setup-only contract-surface helpers, до яких core
може звертатися до завантаження повного channel runtime. Поточна setup
promotion surface така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли потрібно підвищити застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного входу плагіна. Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового завантаження до іменованого підвищеного облікового запису, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають виявлення вбудованої поверхні контракту лінивим. Час імпорту залишається малим; поверхня підвищення завантажується лише під час першого використання, замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці стартові поверхні містять RPC-методи Gateway, тримайте їх на префіксі, специфічному для плагіна. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до `operator.admin`, навіть якщо плагін запитує вужчу область.

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

Плагіни каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і підказки встановлення через `openclaw.install`. Це дає змогу Core не містити даних каталогу.

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

- `detailLabel`: вторинна мітка для насиченіших поверхонь каталогу/стану
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: ідентифікатори плагінів/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору налаштування/конфігурування, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: вмикає канал у стандартний потік швидкого старту `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сеансу під час розв’язання цілей оголошень

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на один чи кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів показують нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи є npm-специфікація точною версією або плаваючим селектором, чи присутні очікувані метадані цілісності та чи доступний також локальний шлях джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, а також коли метадані цілісності npm присутні без дійсного джерела npm. Споживачі мають розглядати `installSource` як додаткове необов’язкове поле, щоб записи, створені вручну, і прокладки каталогу не мусили його синтезувати. Це дає змогу онбордингу й діагностиці пояснювати стан площини джерел без імпорту середовища виконання плагіна.

Офіційні зовнішні npm-записи мають віддавати перевагу точному `npmSpec` разом із `expectedIntegrity`. Голі імена пакетів і dist-tag-и все ще працюють для сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися до закріплених встановлень із перевіркою цілісності без ламання наявних плагінів. Коли онбординг встановлює з локального шляху каталогу, він записує керований запис індексу плагіна з `source: "path"` і відносним до робочої області `sourcePath`, коли це можливо. Абсолютний робочий шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалу конфігурацію. Це зберігає встановлення для локальної розробки видимими для діагностики площини джерел без додавання другої сирої поверхні розкриття шляху файлової системи. Збережений індекс плагінів `plugins/installs.json` є джерелом істини для встановлення й може оновлюватися без завантаження модулів середовища виконання плагінів. Його мапа `installRecords` є довговічною навіть тоді, коли маніфест плагіна відсутній або недійсний; його масив `plugins` є перебудовуваним поданням маніфесту.

## Плагіни контекстного рушія

Плагіни контекстного рушія відповідають за оркестрацію контексту сеансу для приймання, збирання та Compaction. Зареєструйте їх зі свого плагіна через `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій за допомогою `plugins.slots.contextEngine`.

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

Фабрика `ctx` надає необов’язкові значення `config`, `agentDir` і `workspaceDir` для ініціалізації під час створення.

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

Коли плагіну потрібна поведінка, яка не вкладається в поточний API, не обходьте систему плагінів приватним проникненням усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, яку спільну поведінку має контролювати Core: політику, резервний шлях, об’єднання конфігурації, життєвий цикл, семантику для каналів і форму допоміжного засобу середовища виконання.
2. додайте типізовані поверхні реєстрації/середовища виконання плагіна
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте споживачів Core + каналів/функцій
   Канали й функціональні плагіни мають споживати нову можливість через Core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Потім плагіни постачальників реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації з часом залишалася явною.

Саме так OpenClaw залишається принциповим, не стаючи жорстко прив’язаним до світогляду одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного контрольного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має одночасно торкатися таких поверхонь:

- типи контракту Core у `src/<capability>/types.ts`
- допоміжний засіб запуску/середовища виконання Core у `src/<capability>/runtime.ts`
- поверхня реєстрації API плагіна у `src/plugins/types.ts`
- під’єднання реєстру плагінів у `src/plugins/registry.ts`
- експонування середовища виконання плагіна у `src/plugins/runtime/*`, коли функціональним/канальним плагінам потрібно його споживати
- допоміжні засоби захоплення/тестування у `src/test-utils/plugin-registration.ts`
- твердження про володіння/контракт у `src/plugins/contracts/registry.ts`
- документація для оператора/плагіна у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість ще не повністю інтегрована.

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

- Core володіє контрактом можливості + оркестрацією
- плагіни постачальників володіють реалізаціями постачальників
- функціональні/канальні плагіни споживають допоміжні засоби середовища виконання
- тести контракту зберігають володіння явним

## Пов’язане

- [Архітектура плагінів](/uk/plugins/architecture) — публічна модель і форми можливостей
- [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths)
- [Налаштування SDK плагінів](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
