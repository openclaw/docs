---
read_when:
    - Реалізація хуків часу виконання провайдера, життєвого циклу каналу або наборів пакетів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні аспекти архітектури Plugin: конвеєр завантаження, реєстр, хуки часу виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-05-01T20:39:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 782ee5f33fe157071cb2936cfb9d1e807b7452c4c6c18364a376d0bd99727b8a
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin та контрактів володіння/виконання
див. [Архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є
довідником з внутрішньої механіки: конвеєра завантаження, реєстру, runtime-хуків,
HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. знаходить корені кандидатів Plugin
2. читає нативні або сумісні маніфести пакетів і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незбиранi нативні plugins використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає наявний варіант (`def.register ?? def.activate`) і викликає його в тій самій точці. Усі вбудовані plugins використовують `register`; для нових plugins віддавайте перевагу `register`.
</Note>

Запобіжні перевірки виконуються **до** runtime-виконання. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім,
або володіння шляхом виглядає підозрілим для невбудованих plugins.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для площини керування. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- знаходити оголошені канали/skills/схему конфігурації або можливості пакета
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних plugins runtime-модуль є частиною площини даних. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або потоки провайдерів.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в площині керування.
Це дескриптори лише метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до plugins, які володіють запитаною основною командою
- розв’язання налаштування каналу/Plugin звужується до plugins, які володіють запитаним
  id каналу
- явне розв’язання налаштування/runtime провайдера звужується до plugins, які володіють запитаним
  id провайдера
- планування запуску Gateway використовує `activation.onStartup` для явних імпортів
  під час запуску та відмов від запуску; кожен Plugin має оголошувати це, оскільки OpenClaw
  відходить від неявних імпортів під час запуску, тоді як plugins без статичних
  метаданих можливостей і без `activation.onStartup` усе ще використовують
  застарілий неявний sidecar fallback під час запуску для сумісності

Планувальник активації відкриває як API лише з ids для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому було вибрано Plugin,
відокремлюючи явні підказки планувальника `activation.*` від fallback володіння
з маніфесту, як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Цей поділ причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер віддає перевагу ids, якими володіють дескриптори, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити plugins-кандидати, перш ніж повертатися до
`setup-api` для plugins, яким досі потрібні runtime-хуки під час налаштування. Списки
налаштування провайдерів використовують маніфест `providerAuthChoices`, варіанти налаштування,
виведені з дескрипторів, і метадані каталогу встановлення без завантаження runtime провайдера. Явне
`setup.requiresRuntime: false` є descriptor-only відсіканням; пропущене
`requiresRuntime` зберігає застарілий fallback setup-api для сумісності. Якщо більш ніж
один виявлений Plugin претендує на той самий нормалізований id провайдера налаштування або CLI
backend, пошук налаштування відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє
про розбіжність між `setup.providers` / `setup.cliBackends` і провайдерами або CLI
backends, зареєстрованими setup-api, не блокуючи застарілі plugins.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або дані прямого реєстру маніфестів
за часовими вікнами wall-clock. Встановлення, зміни маніфесту та зміни шляхів завантаження
мають ставати видимими під час наступного явного читання метаданих або перебудови знімка.
Парсер файлів маніфесту може тримати обмежений кеш файлових сигнатур, ключований за
відкритим шляхом маніфесту, inode, розміром і часовими мітками; цей кеш лише уникає
повторного парсингу незмінених байтів і не повинен кешувати відповіді про виявлення,
реєстр, власника або політику.

Безпечний швидкий шлях метаданих — явне володіння об’єктами, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`,
похідну `PluginLookUpTable` або явний реєстр маніфестів через ланцюг викликів.
Перевірка конфігурації, автоматичне ввімкнення під час запуску, bootstrap Plugin і вибір
провайдера можуть повторно використовувати ці об’єкти, поки вони представляють поточну конфігурацію та
інвентар Plugin. Пошук налаштування все ще реконструює метадані маніфесту на вимогу,
якщо конкретний шлях налаштування не отримує явний реєстр маніфестів; зберігайте це
як fallback холодного шляху замість додавання прихованих кешів пошуку. Коли вхідні дані
змінюються, перебудуйте й замініть знімок замість того, щоб мутувати його або зберігати
історичні копії.
Подання активного реєстру Plugin і helpers bootstrap для вбудованих каналів
мають перераховуватися з поточного реєстру/кореня. Короткоживучі мапи прийнятні
всередині одного виклику, щоб дедуплікувати роботу або захистити повторний вхід; вони не повинні ставати процесними
кешами метаданих.

Для завантаження Plugin постійний шар кешу — це runtime-завантаження. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти фактично завантажуються, як-от:

- `PluginLoaderCacheState` і сумісні активні runtime-реєстри
- кеші jiti/модулів і кеші завантажувача публічних поверхонь, які використовуються, щоб уникати імпорту
  тієї самої runtime-поверхні повторно
- кеші файлової системи для встановлених артефактів Plugin
- короткоживучі per-call мапи для нормалізації шляхів або розв’язання дублікатів

Ці кеші є деталями реалізації площини даних. Вони не повинні відповідати на
питання площини керування, як-от "який Plugin володіє цим провайдером?", якщо
викликач навмисно не попросив runtime-завантаження.

Не додавайте постійні або wall-clock кеші для:

- результатів виявлення
- прямих реєстрів маніфестів
- реєстрів маніфестів, реконструйованих із індексу встановлених Plugin
- пошуку власника провайдера, приглушення моделі, політики провайдера або метаданих
  публічних артефактів
- будь-якої іншої відповіді, виведеної з маніфесту, де змінений маніфест, встановлений індекс
  або шлях завантаження має бути видимим під час наступного читання метаданих

Викликачі, які перебудовують метадані маніфесту зі збереженого індексу встановлених Plugin,
реконструюють цей реєстр на вимогу. Встановлений індекс — це довговічний
стан площини джерела; він не є прихованим внутрішньопроцесним кешем метаданих.

## Модель реєстру

Завантажені plugins не мутують напряму випадкові core-глобальні змінні. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові служби
- команди, якими володіє Plugin

Потім core-функції читають із цього реєстру замість того, щоб напряму звертатися до модулів Plugin.
Це зберігає завантаження односпрямованим:

- модуль Plugin -> реєстрація в реєстрі
- core runtime -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості core-поверхонь потрібна лише
одна точка інтеграції: "читати реєстр", а не "робити спеціальний випадок для кожного
модуля Plugin".

## Callback-и прив’язки розмови

Plugins, які прив’язують розмову, можуть реагувати, коли схвалення розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після схвалення
або відхилення запиту на прив’язку:

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
- `request`: початковий підсумок запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей callback призначений лише для сповіщення. Він не змінює того, кому дозволено прив’язувати
розмову, і запускається після завершення core-обробки схвалення.

## Runtime-хуки провайдера

Plugins провайдерів мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime пошуку:
  `setup.providers[].envVars`, застаріла сумісність `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, розв’язання моделі,
  обгортання stream, рівні thinking, політику replay і usage endpoints. Див.
  повний список у розділі [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw усе ще володіє generic agent loop, failover, обробкою transcript і
політикою інструментів. Ці хуки є extension-поверхнею для provider-specific
поведінки без потреби в повністю custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли провайдер має env-based
облікові дані, які generic auth/status/model-picker шляхи мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` все ще читається
адаптером сумісності протягом вікна deprecation, а невбудовані plugins,
які його використовують, отримують діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один id провайдера має повторно використовувати env vars іншого id провайдера, auth profiles,
config-backed auth і API-key onboarding choice. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI-поверхні мають знати
choice id провайдера, мітки груп і просте one-flag auth wiring без
завантаження runtime провайдера. Зберігайте runtime провайдера
`envVars` для operator-facing підказок, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли канал має env-driven auth або налаштування, яке
generic shell-env fallback, перевірки config/status або setup prompts мають бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для plugins моделей/провайдерів OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник для вибору.
Compatibility-only поля провайдера, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
перелічені тут.

| #   | Хук                               | Що робить                                                                                                      | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію постачальника в `models.providers` під час генерації `models.json`                      | Постачальник володіє каталогом або стандартними значеннями базового URL                                                                       |
| 2   | `applyConfigDefaults`             | Застосовує глобальні стандартні значення конфігурації, що належать постачальнику, під час матеріалізації конфігурації | Стандартні значення залежать від режиму автентифікації, середовища або семантики сімейства моделей постачальника                              |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                      | _(не хук plugin)_                                                                                                                             |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview псевдоніми ідентифікаторів моделей перед пошуком                             | Постачальник володіє очищенням псевдонімів перед канонічним розв’язанням моделі                                                              |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства постачальника перед загальним складанням моделі                        | Постачальник володіє очищенням транспорту для користувацьких ідентифікаторів постачальників у тому самому транспортному сімействі             |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв’язанням runtime/постачальника                                   | Постачальнику потрібне очищення конфігурації, яке має жити разом із plugin; вбудовані помічники Google-сімейства також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування нативного використання потокового передавання до постачальників конфігурації  | Постачальнику потрібні виправлення метаданих нативного використання потокового передавання, керовані endpoint                                 |
| 7   | `resolveConfigApiKey`             | Розв’язує автентифікацію env-marker для постачальників конфігурації перед завантаженням runtime-автентифікації | Постачальник має власне розв’язання API-ключа env-marker; `amazon-bedrock` також має тут вбудований розв’язувач AWS env-marker                |
| 8   | `resolveSyntheticAuth`            | Виводить локальну/самостійно розміщену або config-backed автентифікацію без збереження відкритого тексту      | Постачальник може працювати із синтетичним/локальним маркером облікових даних                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, що належать постачальнику; типовий `persistence` — `runtime-only` для CLI/app-owned облікових даних | Постачальник повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh tokens; оголосіть `contracts.externalAuthProviders` у manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів позаду env/config-backed автентифікації         | Постачальник зберігає синтетичні профілі-заповнювачі, які не мають отримувати пріоритет                                                       |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ідентифікаторів моделей, що належать постачальнику і ще не є в локальному реєстрі      | Постачальник приймає довільні upstream ідентифікатори моделей                                                                                 |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                      | Постачальнику потрібні мережеві метадані перед розв’язанням невідомих ідентифікаторів                                                        |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає розв’язану модель                            | Постачальнику потрібні переписування транспорту, але він усе ще використовує core transport                                                   |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для vendor моделей за іншим сумісним транспортом                                        | Постачальник розпізнає власні моделі на proxy transports без перебрання постачальника                                                         |
| 15  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                     | Постачальнику потрібне очищення схем транспортного сімейства                                                                                  |
| 16  | `inspectToolSchemas`              | Виводить діагностику схем, що належить постачальнику, після нормалізації                                      | Постачальник хоче попередження за ключовими словами без навчання core rules, специфічних для постачальника                                   |
| 17  | `resolveReasoningOutputMode`      | Вибирає контракт reasoning-output: native або tagged                                                          | Постачальнику потрібен tagged reasoning/final output замість native fields                                                                    |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними wrappers опцій stream                                         | Постачальнику потрібні стандартні параметри запиту або очищення параметрів для окремого постачальника                                         |
| 19  | `createStreamFn`                  | Повністю замінює звичайний stream path користувацьким транспортом                                             | Постачальнику потрібен користувацький wire protocol, а не лише wrapper                                                                        |
| 20  | `wrapStreamFn`                    | Stream wrapper після застосування generic wrappers                                                            | Постачальнику потрібні wrappers сумісності заголовків/тіла/моделі запиту без користувацького транспорту                                       |
| 21  | `resolveTransportTurnState`       | Додає нативні заголовки або метадані транспорту для кожного turn                                              | Постачальник хоче, щоб generic transports надсилали provider-native ідентичність turn                                                         |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні заголовки WebSocket або політику cool-down сесії                                                | Постачальник хоче, щоб generic WS transports налаштовували заголовки сесії або fallback policy                                                |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime рядком `apiKey`                              | Постачальник зберігає додаткові метадані автентифікації й потребує користувацької форми runtime token                                        |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для користувацьких endpoint оновлення або політики refresh-failure             | Постачальник не вписується в спільні refreshers `pi-ai`                                                                                       |
| 25  | `buildAuthDoctorHint`             | Підказка ремонту, що додається, коли оновлення OAuth завершується невдачею                                    | Постачальнику потрібні власні вказівки з ремонту автентифікації після невдалого оновлення                                                     |
| 26  | `matchesContextOverflowError`     | Matcher переповнення context-window, що належить постачальнику                                                | Постачальник має raw overflow errors, які generic heuristics пропустили б                                                                     |
| 27  | `classifyFailoverReason`          | Класифікація причини failover, що належить постачальнику                                                      | Постачальник може зіставляти raw API/transport errors із rate-limit/overload/etc                                                             |
| 28  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul постачальників                                                       | Постачальнику потрібне proxy-specific cache TTL gating                                                                                        |
| 29  | `buildMissingAuthMessage`         | Заміна generic повідомлення відновлення missing-auth                                                          | Постачальнику потрібна provider-specific підказка відновлення missing-auth                                                                    |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після discovery                                                    | Постачальнику потрібні синтетичні forward-compat рядки в `models list` і pickers                                                              |
| 31  | `resolveThinkingProfile`          | Набір рівнів `/think`, display labels і стандартне значення для конкретної моделі                             | Постачальник надає користувацьку thinking ladder або binary label для вибраних моделей                                                        |
| 32  | `isBinaryThinking`                | Compatibility hook для перемикача reasoning on/off                                                            | Постачальник надає лише binary thinking on/off                                                                                                |
| 33  | `supportsXHighThinking`           | Compatibility hook підтримки `xhigh` reasoning                                                                | Постачальник хоче `xhigh` лише на підмножині моделей                                                                                          |
| 34  | `resolveDefaultThinkingLevel`     | Compatibility hook стандартного рівня `/think`                                                                | Постачальник володіє стандартною політикою `/think` для сімейства моделей                                                                     |
| 35  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів live profile і smoke selection                                           | Постачальник володіє зіставленням preferred-model для live/smoke                                                                              |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime token/key безпосередньо перед inference                | Постачальнику потрібен token exchange або короткострокові облікові дані запиту                                                               |
| 37  | `resolveUsageAuth`                | Визначає облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь статусу                                     | Провайдер потребує власного аналізу токена використання/квоти або інших облікових даних використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримує та нормалізує специфічні для провайдера знімки використання/квоти після визначення автентифікації                             | Провайдер потребує специфічної для провайдера кінцевої точки використання або аналізатора корисного навантаження                                                                           |
| 39  | `createEmbeddingProvider`         | Створює належний провайдеру адаптер вбудовувань для пам’яті/пошуку                                                     | Поведінка вбудовування пам’яті належить Plugin провайдера                                                                                    |
| 40  | `buildReplayPolicy`               | Повертає політику повторного відтворення, що керує обробкою транскрипту для провайдера                                        | Провайдер потребує власної політики транскрипту (наприклад, вилучення блоків мислення)                                                               |
| 41  | `sanitizeReplayHistory`           | Переписує історію повторного відтворення після загального очищення транскрипту                                                        | Провайдер потребує специфічних для провайдера переписувань повторного відтворення поза спільними допоміжними засобами Compaction                                                             |
| 42  | `validateReplayTurns`             | Виконує фінальну перевірку або зміну форми кроків повторного відтворення перед вбудованим виконавцем                                           | Транспорт провайдера потребує суворішої перевірки кроків після загального очищення                                                                    |
| 43  | `onModelSelected`                 | Запускає належні провайдеру побічні ефекти після вибору                                                                 | Провайдер потребує телеметрії або належного провайдеру стану, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спершу перевіряють
зіставлений provider Plugin, а потім переходять до інших provider Plugin-ів із
підтримкою hook-ів, доки один із них фактично не змінить ідентифікатор моделі
або transport/config. Це зберігає роботу alias/compat provider shim-ів без
вимоги, щоб викликач знав, якому bundled Plugin належить перезапис. Якщо жоден
provider hook не перезаписує підтримуваний запис конфігурації Google-сімейства,
bundled нормалізатор конфігурації Google все одно застосовує це очищення
сумісності.

Якщо provider потребує повністю власного wire protocol або власного request executor,
це інший клас розширення. Ці hook-и призначені для поведінки provider-а, яка
все ще працює у звичайному inference loop OpenClaw.

### Приклад provider-а

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

Bundled provider Plugin-и поєднують наведені вище hook-и, щоб адаптуватися до
catalog, auth, thinking, replay і usage-потреб кожного постачальника. Авторитетний
набір hook-ів зберігається з кожним Plugin у `extensions/`; ця сторінка ілюструє
форми, а не дублює список.

<AccordionGroup>
  <Accordion title="Постачальники catalog із наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати
    upstream ідентифікатори моделей раніше за статичний catalog OpenClaw.
  </Accordion>
  <Accordion title="Постачальники OAuth і usage endpoint">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` із `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay та очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають provider-ам змогу
    підключатися до політики transcript через `buildReplayPolicy`, а не
    повторно реалізовувати очищення в кожному Plugin.
  </Accordion>
  <Accordion title="Постачальники лише catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний inference loop.
  </Accordion>
  <Accordion title="Допоміжні засоби stream, специфічні для Anthropic">
    Beta headers, `/fast` / `serviceTier` і `context1m` живуть у публічному seam
    `api.ts` / `contract-api.ts` Anthropic Plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Допоміжні засоби runtime

Plugin-и можуть отримувати доступ до вибраних допоміжних засобів core через `api.runtime`. Для TTS:

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

Нотатки:

- `textToSpeech` повертає звичайний core payload виводу TTS для поверхонь file/voice-note.
- Використовує core-конфігурацію `messages.tts` і вибір provider-а.
- Повертає PCM audio buffer + sample rate. Plugin-и мають виконувати resample/encode для provider-ів.
- `listVoices` є необов'язковим для кожного provider-а. Використовуйте його для voice picker-ів або setup flow-ів, якими володіє постачальник.
- Списки голосів можуть містити багатші metadata, як-от locale, gender і personality tags для picker-ів, обізнаних про provider-а.
- OpenAI та ElevenLabs наразі підтримують telephony. Microsoft не підтримує.

Plugin-и також можуть реєструвати speech provider-ів через `api.registerSpeechProvider(...)`.

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

Нотатки:

- Тримайте політику TTS, fallback і доставку відповіді в core.
- Використовуйте speech provider-ів для поведінки синтезу, якою володіє постачальник.
- Legacy вхід Microsoft `edge` нормалізується до provider id `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor Plugin може володіти
  provider-ами тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додає ці
  capability contracts.

Для розуміння image/audio/video Plugin-и реєструють один типізований
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

Нотатки:

- Тримайте orchestration, fallback, config і channel wiring у core.
- Тримайте поведінку постачальника в provider Plugin.
- Additive expansion має залишатися типізованим: нові optional methods, нові optional
  result fields, нові optional capabilities.
- Video generation уже використовує той самий pattern:
  - core володіє capability contract і runtime helper
  - vendor Plugin-и реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel Plugin-и споживають `api.runtime.videoGeneration.*`

Для media-understanding runtime helpers Plugin-и можуть викликати:

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

Для audio transcription Plugin-и можуть використовувати або media-understanding runtime,
або старіший STT alias:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Нотатки:

- `api.runtime.mediaUnderstanding.*` є бажаною спільною поверхнею для
  розуміння image/audio/video.
- Використовує core audio-конфігурацію media-understanding (`tools.media.audio`) і fallback order provider-ів.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається compatibility alias.

Plugin-и також можуть запускати фонові subagent runs через `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Нотатки:

- `provider` і `model` є optional per-run overrides, а не persistent session changes.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для fallback runs, якими володіє Plugin, operators мають явно ввімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted Plugin-и конкретними canonical `provider/model` targets, або `"*"`, щоб явно дозволити будь-який target.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються замість мовчазного fallback.
- Створені Plugin subagent sessions позначаються id Plugin, який їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session усе ще вимагає admin-scoped Gateway request.

Для web search Plugin-и можуть використовувати спільний runtime helper замість
доступу до agent tool wiring:

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

Plugin-и також можуть реєструвати web-search provider-ів через
`api.registerWebSearchProvider(...)`.

Нотатки:

- Тримайте вибір provider-а, credential resolution і спільну request semantics у core.
- Використовуйте web-search provider-ів для vendor-specific search transports.
- `api.runtime.webSearch.*` є бажаною спільною поверхнею для feature/channel Plugin-ів, яким потрібна search behavior без залежності від agent tool wrapper.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка image-generation provider-ів.
- `listProviders(...)`: перелічує доступних image-generation provider-ів та їхні capabilities.

## HTTP-маршрути Gateway

Plugin-и можуть виставляти HTTP endpoints через `api.registerHttpRoute(...)`.

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

- `path`: route path під HTTP server Gateway.
- `auth`: обов'язкове. Використовуйте `"gateway"`, щоб вимагати звичайний gateway auth, або `"plugin"` для plugin-managed auth/webhook verification.
- `match`: необов'язкове. `"exact"` (default) або `"prefix"`.
- `replaceExisting`: необов'язкове. Дозволяє тому самому Plugin замінити власну наявну route registration.
- `handler`: поверніть `true`, коли route обробив request.

Нотатки:

- `api.registerHttpHandler(...)` було видалено, і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-області оператора. Вони призначені для Webhook/перевірки підпису, керованих Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині runtime-області запиту Gateway, але ця область навмисно консервативна:
  - bearer-автентифікація зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-області маршрутів Plugin прив’язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному вході) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів Plugin з ідентичністю, runtime-область повертається до `operator.write`
- Практичне правило: не вважайте маршрут Plugin з gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk` під час створення нових plugins. Основні підшляхи:

| Підшлях                             | Призначення                                        |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/побудови каналу             |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальні plugins вибирають із родини вузьких швів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку підтвердження слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між непов’язаними
полями Plugin. Див. [Канальні plugins](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації розміщені у відповідних сфокусованих підшляхах
`*-runtime` (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого сумісного barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими сумісними shim для
старіших plugins. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного вбудованого пакета Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні plugins мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin з core або з іншого Plugin.
Точки входу, завантажені через фасад, надають перевагу активному runtime-знімку
конфігурації, коли він існує, а потім повертаються до розв’язаного файлу
конфігурації на диску.

Підшляхи для конкретних можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують, бо вбудовані plugins використовують їх зараз. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте
відповідну довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugins мають володіти канально-специфічними внесками схем
`describeMessageTool(...)` для примітивів, що не є повідомленнями, як-от реакції,
прочитання та опитування. Спільне представлення надсилання має використовувати
загальний контракт `MessagePresentation` замість нативних для провайдера полів
кнопок, компонентів, блоків або карток.
Див. [Представлення повідомлень](/uk/plugins/message-presentation) для контракту,
правил fallback, мапінгу провайдерів і чекліста автора Plugin.

Plugins із можливістю надсилання оголошують, що вони можуть відтворювати через можливості повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи відтворювати представлення нативно, чи деградувати його до тексту.
Не відкривайте нативні для провайдера UI escape hatch із загального інструмента
повідомлень. Застарілі допоміжні засоби SDK для legacy нативних схем лишаються
експортованими для наявних сторонніх plugins, але нові plugins не повинні їх
використовувати.

## Розв’язання цілі каналу

Канальні plugins мають володіти канально-специфічною семантикою цілей. Тримайте
спільний outbound-хост загальним і використовуйте поверхню messaging adapter
для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль слід
  трактувати як `direct`, `group` або `channel` перед пошуком у каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  має ввід одразу перейти до id-подібного розв’язання замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є fallback Plugin, коли
  core потрібне фінальне розв’язання, що належить провайдеру, після нормалізації
  або після промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту
  сесії, специфічною для провайдера, після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорії, які мають
  відбуватися перед пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний target id".
- Використовуйте `resolveTarget` для fallback нормалізації, специфічної для
  провайдера, а не для широкого пошуку в каталозі.
- Тримайте нативні ідентифікатори провайдера, як-от chat ids, thread ids, JIDs,
  handles і room ids, всередині значень `target` або специфічних для провайдера
  параметрів, а не в загальних полях SDK.

## Каталоги на основі конфігурації

Plugins, які виводять записи каталогу з конфігурації, мають тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers, керовані allowlist
- налаштовані мапи channel/group
- статичні fallback каталогу в межах акаунта

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Канально-специфічна інспекція акаунта та нормалізація id мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Provider plugins можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє специфічними для провайдера model ids,
типовими base URL або metadata моделей, обмеженими auth.

`catalog.order` керує тим, коли каталог Plugin зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: прості провайдери, керовані API-key або env
- `profile`: провайдери, що з’являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдера
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі колізії ключів, тож plugins можуть
навмисно перевизначити вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only інспекція каналу

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поруч із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Йому дозволено припускати, що
  облікові дані повністю матеріалізовані, і швидко завершуватися помилкою,
  коли бракує потрібних секретів.
- Read-only шляхи команд, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки
  doctor/config repair, не повинні матеріалізувати runtime-облікові дані лише
  для опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан акаунта.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу облікових даних, коли це доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про
  read-only доступність. Повернення `tokenStatus: "available"` (і відповідного
  поля source) достатньо для status-команд.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовані через
  SecretRef, але недоступні в поточному шляху команди.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому
шляху команди" замість аварійного завершення або хибного повідомлення, що акаунт
не налаштований.

## Пакети packages

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

Кожен entry стає Plugin. Якщо pack перелічує кілька extensions, Plugin id
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm deps, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Security guardrail: кожен entry `openclaw.extensions` має залишатися всередині
каталогу Plugin після розв’язання symlink. Entries, що виходять за межі
каталогу package, відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності Plugin за
допомогою локального для проєкту `npm install --omit=dev --ignore-scripts` (без
lifecycle scripts, без dev dependencies у runtime), ігноруючи успадковані
глобальні налаштування npm install. Тримайте дерева залежностей Plugin
"pure JS/TS" і уникайте packages, які потребують `postinstall` builds.

Опційно: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потрібні setup surfaces для вимкненого канального Plugin або
коли канальний Plugin увімкнений, але ще не налаштований, він завантажує
`setupEntry` замість повної точки входу Plugin. Це полегшує запуск і setup,
коли ваша основна точка входу Plugin також підключає tools, hooks або інший
код лише для runtime.

Опційно: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити канальний Plugin до того самого шляху `setupEntry` під час
pre-listen фази запуску gateway, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup surface,
яка має існувати до того, як gateway почне слухати. На практиці це означає, що
setup entry має зареєструвати кожну можливість, що належить каналу і від якої
залежить startup, як-от:

- сама реєстрація каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які gateway methods, tools або services, які мають існувати в тому самому вікні

Якщо ваша повна точка входу все ще володіє будь-якою необхідною startup capability,
не вмикайте цей прапорець. Залиште Plugin на типовій поведінці й дозвольте
OpenClaw завантажувати повну точку входу під час startup.

Вбудовані канали також можуть публікувати допоміжні засоби contract-surface лише
для setup, які core може консультувати до завантаження повного runtime каналу.
Поточна setup promotion surface:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли потрібно підвищити застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного входу Plugin. Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового налаштування в іменований підвищений обліковий запис, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери setup patch зберігають вбудоване виявлення поверхні контракту лінивим. Час імпорту залишається легким; поверхня підвищення завантажується лише під час першого використання замість повторного входу у запуск вбудованого каналу під час імпорту модуля.

Коли ці стартові поверхні містять методи RPC Gateway, тримайте їх на префіксі, специфічному для Plugin. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди вирішуються в `operator.admin`, навіть якщо Plugin запитує вужчу область.

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

Plugin-и каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` та підказки встановлення через `openclaw.install`. Це зберігає каталог Core вільним від даних.

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
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору налаштування/конфігурації, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку швидкого старту `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення цілей оголошення

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Розмістіть JSON-файл в одному з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на один чи кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів виставляють нормалізовані факти про джерело встановлення поруч із необробленим блоком `openclaw.install`. Нормалізовані факти визначають, чи є npm spec точною версією або плаваючим селектором, чи наявні очікувані метадані цілісності, і чи також доступний локальний шлях джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібрана назва npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, і коли метадані цілісності npm наявні без дійсного джерела npm. Споживачі мають розглядати `installSource` як додаткове необов’язкове поле, щоб записи, створені вручну, і прокладки каталогу не мусили його синтезувати. Це дає onboarding і діагностиці змогу пояснювати стан площини джерела без імпорту runtime Plugin.

Офіційні зовнішні npm-записи мають віддавати перевагу точному `npmSpec` плюс `expectedIntegrity`. Голі назви пакетів і dist-tags усе ще працюють для сумісності, але вони показують попередження площини джерела, щоб каталог міг рухатися до закріплених, перевірених за цілісністю встановлень без порушення наявних Plugin-ів. Коли onboarding встановлює з локального шляху каталогу, він записує керований запис індексу Plugin із `source: "path"` і відносним до workspace `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалій конфігурації. Це зберігає локальні встановлення для розробки видимими для діагностики площини джерела без додавання другої поверхні розкриття необробленого шляху файлової системи. Збережений індекс Plugin `plugins/installs.json` є джерелом істини щодо джерела встановлення й може оновлюватися без завантаження runtime-модулів Plugin. Його мапа `installRecords` є довговічною навіть тоді, коли маніфест Plugin відсутній або недійсний; його масив `plugins` є відновлюваним поданням маніфесту.

## Plugin-и контекстного рушія

Plugin-и контекстного рушія володіють оркестрацією контексту сесії для ingest, assembly і compaction. Зареєструйте їх зі свого Plugin за допомогою `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій через `plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити стандартний конвеєр контексту, а не просто додати пошук у пам’яті чи hooks.

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

Фабрика `ctx` виставляє необов’язкові значення `config`, `agentDir` і `workspaceDir` для ініціалізації під час створення.

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

Коли Plugin потребує поведінки, яка не вписується в поточний API, не обходьте систему Plugin приватним проникненням усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, якою спільною поведінкою має володіти Core: політика, fallback, злиття конфігурації, життєвий цикл, семантика для каналів і форма runtime helper.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. підключіть Core + споживачів каналу/функції
   Канали й Plugin-и функцій мають споживати нову можливість через Core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Потім Plugin-и постачальників реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння та реєстрації з часом залишалася явною.

Так OpenClaw залишається принциповим, не стаючи жорстко закодованим під світогляд одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного контрольного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має торкатися цих поверхонь разом:

- типи контракту Core в `src/<capability>/types.ts`
- runner/runtime helper Core в `src/<capability>/runtime.ts`
- поверхня реєстрації API Plugin в `src/plugins/types.ts`
- підключення реєстру Plugin в `src/plugins/registry.ts`
- runtime-експозиція Plugin у `src/plugins/runtime/*`, коли Plugin-и функцій/каналів мають її споживати
- helpers для capture/test у `src/test-utils/plugin-registration.ts`
- твердження про володіння/контракт у `src/plugins/contracts/registry.ts`
- документація для operator/Plugin у `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака, що можливість ще не повністю інтегрована.

### Шаблон можливості

Мінімальний патерн:

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

Патерн контрактного тесту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- Core володіє контрактом можливості + оркестрацією
- Plugin-и постачальників володіють реалізаціями постачальників
- Plugin-и функцій/каналів споживають runtime helpers
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
