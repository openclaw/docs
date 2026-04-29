---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або наборів пакетів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, хуки часу виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні аспекти архітектури Plugin
x-i18n:
    generated_at: "2026-04-29T04:06:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin і контрактів володіння/виконання див. [архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є довідником щодо внутрішніх механізмів: конвеєра завантаження, реєстру, runtime-хуків, HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів Plugin
2. читає нативні або сумісні маніфести пакетів і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незібрані нативні Plugin використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд і runtime-поверхонь

<Note>
`activate` є застарілим псевдонімом для `register` — завантажувач визначає наявний варіант (`def.register ?? def.activate`) і викликає його в тій самій точці. Усі вбудовані Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Запобіжні перевірки виконуються **до** runtime-виконання. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях є доступним для запису всім користувачам або володіння шляхом виглядає підозрілим для невбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для площини керування. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною площини даних. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або provider-потоки.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на площині керування.
Вони є лише метаданими-дескрипторами для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і provider,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- розв’язання налаштування каналу/Plugin звужується до Plugin, які володіють запитаним
  ідентифікатором каналу
- явне розв’язання налаштування/runtime provider звужується до Plugin, які володіють запитаним
  ідентифікатором provider
- планування запуску Gateway використовує `activation.onStartup` для явних імпортів під час запуску
  та відмов від запуску; кожен Plugin має оголошувати це, оскільки OpenClaw
  відходить від неявних імпортів під час запуску, тоді як Plugin без статичних
  метаданих можливостей і без `activation.onStartup` все ще використовують
  застарілий неявний fallback запускового sidecar для сумісності

Планувальник активації відкриває і API лише з ідентифікаторами для наявних викликачів, і
API плану для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback володіння з маніфесту,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Такий поділ причин є межею сумісності:
наявні метадані Plugin продовжують працювати, тоді як новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер надає перевагу ідентифікаторам, що належать дескрипторам, як-от `setup.providers` і
`setup.cliBackends`, щоб звужувати кандидатні Plugin, перш ніж повертатися до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки під час налаштування. Списки
налаштування provider використовують `providerAuthChoices` з маніфесту, варіанти налаштування,
похідні від дескрипторів, і метадані каталогу встановлення без завантаження runtime provider. Явне
`setup.requiresRuntime: false` є cutoff лише для дескрипторів; пропущений
`requiresRuntime` зберігає застарілий fallback setup-api для сумісності. Якщо більше
ніж один виявлений Plugin претендує на той самий нормалізований provider налаштування або ідентифікатор CLI
backend, пошук налаштування відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє
про розбіжність між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, не блокуючи застарілі Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані реєстру маніфестів
за часовими вікнами. Встановлення, редагування маніфесту та зміни шляхів завантаження
мають ставати видимими під час наступного явного читання метаданих або перебудови знімка.
Парсер файлу маніфесту може зберігати обмежений кеш файлових сигнатур, ключований за
відкритим шляхом маніфесту, inode, розміром і часовими мітками; цей кеш лише уникає
повторного парсингу незмінених байтів і не повинен кешувати відповіді щодо виявлення,
реєстру, власника або політик.

Безпечний швидкий шлях метаданих — це явне володіння об’єктами, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`, похідну
`PluginLookUpTable` або явний реєстр маніфестів через ланцюг викликів.
Перевірка конфігурації, автоматичне ввімкнення під час запуску, bootstrap Plugin і вибір
provider можуть повторно використовувати ці об’єкти, доки вони представляють поточну конфігурацію та
інвентар Plugin. Пошук налаштування все ще реконструює метадані маніфесту на вимогу,
якщо конкретний шлях налаштування не отримує явний реєстр маніфестів; залишайте це
fallback для холодного шляху, замість додавання прихованих кешів пошуку. Коли вхідні дані
змінюються, перебудовуйте й замінюйте знімок замість його мутації або збереження
історичних копій.
Подання активного реєстру Plugin і допоміжні засоби bootstrap вбудованих каналів
мають повторно обчислюватися з поточного реєстру/кореня. Короткоживучі мапи допустимі
в межах одного виклику для дедуплікації роботи або захисту від повторного входу; вони не повинні ставати
кешами метаданих процесу.

Для завантаження Plugin постійним шаром кешу є runtime-завантаження. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти справді завантажені, як-от:

- `PluginLoaderCacheState` і сумісні активні runtime-реєстри
- кеші jiti/модулів і кеші завантажувача публічних поверхонь, що використовуються для уникнення
  повторного імпорту тієї самої runtime-поверхні
- runtime-дзеркала залежностей і файлові кеші для встановлених артефактів Plugin
- короткоживучі мапи на один виклик для нормалізації шляхів або розв’язання дублікатів

Ці кеші є деталями реалізації площини даних. Вони не повинні відповідати на
запитання площини керування, як-от "який Plugin володіє цим provider?", якщо
викликач свідомо не попросив runtime-завантаження.

Не додавайте постійні або часові кеші для:

- результатів виявлення
- прямих реєстрів маніфестів
- реєстрів маніфестів, реконструйованих зі встановленого індексу Plugin
- пошуку власника provider, приглушення моделей, політик provider або метаданих публічних артефактів
- будь-якої іншої відповіді, похідної від маніфесту, де змінений маніфест, встановлений індекс
  або шлях завантаження має бути видимим під час наступного читання метаданих

Викликачі, які перебудовують метадані маніфесту зі збереженого встановленого індексу Plugin,
реконструюють цей реєстр на вимогу. Встановлений індекс є durable-станом
source-plane; це не прихований in-process кеш метаданих.

## Модель реєстру

Завантажені Plugin не мутують напряму випадкові глобальні об’єкти ядра. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки й типізовані хуки
- канали
- providers
- RPC-обробники Gateway
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, що належать Plugin

Потім функції ядра читають із цього реєстру замість того, щоб напряму звертатися до модулів Plugin.
Це зберігає завантаження односпрямованим:

- модуль Plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Такий поділ важливий для підтримуваності. Він означає, що більшості поверхонь ядра потрібна лише
одна точка інтеграції: "читати реєстр", а не "спеціально обробляти кожен модуль Plugin".

## Колбеки прив’язування розмови

Plugin, які прив’язують розмову, можуть реагувати, коли approval розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після схвалення
або відхилення запиту bind:

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
- `binding`: розв’язане прив’язування для схвалених запитів
- `request`: початкове зведення запиту, підказка detach, ідентифікатор відправника та
  метадані розмови

Цей callback призначений лише для сповіщення. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення обробки approval ядром.

## Runtime-хуки provider

Provider Plugin мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime пошуку:
  `setup.providers[].envVars`, застарілий сумісний `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки під час конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, розв’язання моделей,
  обгортання stream, рівні thinking, replay policy та usage endpoints. Повний
  список див. у розділі [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw все ще володіє загальним циклом агента, failover, обробкою transcript і
політикою інструментів. Ці хуки є поверхнею розширення для provider-специфічної
поведінки без потреби в повністю власному inference transport.

Використовуйте `setup.providers[].envVars` маніфесту, коли provider має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` усе ще читається
адаптером сумісності протягом вікна deprecation, а невбудовані Plugin,
які його використовують, отримують діагностику маніфесту. Використовуйте
`providerAuthAliases` маніфесту, коли один ідентифікатор provider має повторно використовувати env vars,
auth profiles, config-backed auth і вибір onboarding API key іншого ідентифікатора provider. Використовуйте
`providerAuthChoices` маніфесту, коли поверхні onboarding/auth-choice CLI мають знати
ідентифікатор вибору provider, group labels і просте one-flag auth wiring без
завантаження runtime provider. Зберігайте runtime
`envVars` provider для підказок, орієнтованих на оператора, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте `channelEnvVars` маніфесту, коли канал має auth або setup на основі env, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження runtime каналу.

### Порядок хуків і використання

Для Plugin моделей/provider OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" є коротким посібником для ухвалення рішення.
Поля provider лише для сумісності, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
перелічені тут.

| #   | Хук                               | Що робить                                                                                                      | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                         | Провайдер володіє каталогом або типовими значеннями базової URL-адреси                                                                       |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму автентифікації, середовища або семантики сімейства моделей провайдера                                     |
| --  | _(вбудований пошук моделей)_      | OpenClaw спершу пробує звичайний шлях реєстру/каталогу                                                        | _(не Plugin-хук)_                                                                                                                             |
| 3   | `normalizeModelId`                | Нормалізує застарілі псевдоніми або псевдоніми попереднього перегляду для ідентифікаторів моделей перед пошуком | Провайдер відповідає за очищення псевдонімів перед канонічним визначенням моделі                                                             |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                            | Провайдер відповідає за очищення транспорту для власних ідентифікаторів провайдерів у тому самому транспортному сімействі                    |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                        | Провайдеру потрібне очищення конфігурації, яке має належати Plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування нативного використання потоковості до провайдерів конфігурації                | Провайдеру потрібні виправлення метаданих нативного використання потоковості, керовані ендпойнтом                                            |
| 7   | `resolveConfigApiKey`             | Визначає автентифікацію через маркер середовища для провайдерів конфігурації перед завантаженням runtime-автентифікації | Провайдер має власне визначення API-ключа через маркер середовища; `amazon-bedrock` також має тут вбудований резолвер AWS-маркера середовища |
| 8   | `resolveSyntheticAuth`            | Виводить локальну/саморозміщену або конфігураційну автентифікацію без збереження відкритого тексту            | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                   |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, що належать провайдеру; типове `persistence` — `runtime-only` для облікових даних, якими володіє CLI/застосунок | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh-токенів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів після автентифікації, підтриманої середовищем/конфігурацією | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають перемагати за пріоритетом                                                    |
| 11  | `resolveDynamicModel`             | Синхронний fallback для ідентифікаторів моделей, що належать провайдеру й ще не є в локальному реєстрі         | Провайдер приймає довільні ідентифікатори upstream-моделей                                                                                   |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` виконується знову                                       | Провайдеру потрібні мережеві метадані перед визначенням невідомих ідентифікаторів                                                            |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає визначену модель                             | Провайдеру потрібні переписування транспорту, але він усе ще використовує базовий транспорт ядра                                             |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей постачальника за іншим сумісним транспортом                              | Провайдер розпізнає власні моделі на proxy-транспортах без перебрання контролю над провайдером                                               |
| 15  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                      | Провайдеру потрібне очищення схем транспортного сімейства                                                                                     |
| 16  | `inspectToolSchemas`              | Виводить діагностику схем, що належить провайдеру, після нормалізації                                          | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                        |
| 17  | `resolveReasoningOutputMode`      | Вибирає нативний або тегований контракт виводу міркування                                                      | Провайдеру потрібен тегований вивід міркування/фінального результату замість нативних полів                                                  |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками опцій потоку                                        | Провайдеру потрібні типові параметри запиту або очищення параметрів для окремого провайдера                                                  |
| 19  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                     | Провайдеру потрібен власний wire-протокол, а не лише обгортка                                                                                |
| 20  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                          | Провайдеру потрібні обгортки сумісності заголовків/тіла/моделі запиту без власного транспорту                                                |
| 21  | `resolveTransportTurnState`       | Додає нативні транспортні заголовки або метадані для кожного turn                                              | Провайдер хоче, щоб загальні транспорти надсилали нативну для провайдера ідентичність turn                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні WebSocket-заголовки або політику охолодження сесії                                               | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику fallback                                               |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                               | Провайдер зберігає додаткові метадані автентифікації й потребує власної форми runtime-токена                                                 |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних ендпойнтів оновлення або політики помилок оновлення                 | Провайдер не вписується у спільні `pi-ai` refreshers                                                                                          |
| 25  | `buildAuthDoctorHint`             | Підказка ремонту, що додається, коли оновлення OAuth не вдається                                               | Провайдеру потрібні власні вказівки з ремонту автентифікації після помилки оновлення                                                         |
| 26  | `matchesContextOverflowError`     | Матчер переповнення контекстного вікна, що належить провайдеру                                                 | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                 |
| 27  | `classifyFailoverReason`          | Класифікація причини failover, що належить провайдеру                                                          | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/overload тощо                                                             |
| 28  | `isCacheTtlEligible`              | Політика prompt-кешу для proxy/backhaul-провайдерів                                                            | Провайдеру потрібне proxy-специфічне обмеження TTL кешу                                                                                      |
| 29  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення у разі відсутньої автентифікації                                    | Провайдеру потрібна специфічна для провайдера підказка відновлення відсутньої автентифікації                                                 |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, що додаються після discovery                                               | Провайдеру потрібні синтетичні forward-compat рядки в `models list` і вибірниках                                                             |
| 31  | `resolveThinkingProfile`          | Специфічний для моделі набір рівнів `/think`, відображувані мітки та типове значення                           | Провайдер надає власну шкалу мислення або бінарну мітку для вибраних моделей                                                                 |
| 32  | `isBinaryThinking`                | Хук сумісності для перемикача міркування увімк./вимк.                                                          | Провайдер надає лише бінарне мислення увімк./вимк.                                                                                            |
| 33  | `supportsXHighThinking`           | Хук сумісності підтримки міркування `xhigh`                                                                    | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | Хук сумісності типового рівня `/think`                                                                         | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                           |
| 35  | `isModernModelRef`                | Матчер сучасної моделі для фільтрів live-профілю та вибору smoke                                               | Провайдер володіє зіставленням пріоритетних моделей для live/smoke                                                                           |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference                | Провайдеру потрібен обмін токена або короткочасні облікові дані запиту                                                                       |
| 37  | `resolveUsageAuth`                | Визначити облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь статусу                                     | Провайдеру потрібен власний розбір токена використання/квоти або інші облікові дані використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримати й нормалізувати специфічні для провайдера знімки використання/квоти після визначення автентифікації                             | Провайдеру потрібен специфічний для провайдера endpoint використання або парсер payload                                                                           |
| 39  | `createEmbeddingProvider`         | Створити належний провайдеру адаптер ембедингів для пам’яті/пошуку                                                     | Поведінка ембедингів пам’яті належить Plugin провайдера                                                                                    |
| 40  | `buildReplayPolicy`               | Повернути політику повторного відтворення, що керує обробкою стенограми для провайдера                                        | Провайдеру потрібна власна політика стенограми (наприклад, видалення блоків мислення)                                                               |
| 41  | `sanitizeReplayHistory`           | Переписати історію повторного відтворення після загального очищення стенограми                                                        | Провайдеру потрібні специфічні для провайдера перезаписи повторного відтворення поза спільними допоміжними засобами Compaction                                                             |
| 42  | `validateReplayTurns`             | Остаточна перевірка або зміна форми ходів повторного відтворення перед вбудованим засобом запуску                                           | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санації                                                                    |
| 43  | `onModelSelected`                 | Запустити належні провайдеру побічні ефекти після вибору                                                                 | Провайдеру потрібна телеметрія або належний провайдеру стан, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний provider plugin, а потім переходять до інших provider plugins із
підтримкою хуків, доки один із них фактично не змінить model id або transport/config. Це зберігає
працездатність shim-ів провайдерів для alias/compat без потреби, щоб викликач знав, який
вбудований plugin відповідає за переписування. Якщо жоден provider hook не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно застосовує
це очищення сумісності.

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

Вбудовані provider plugins поєднують наведені вище хуки, щоб пристосуватися до потреб
каталогу, автентифікації, thinking, replay і usage кожного постачальника. Авторитетний набір хуків міститься в
кожному plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогів із наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    model ids перед статичним каталогом OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб відповідати за обмін токенів та інтеграцію `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики transcript через `buildReplayPolicy`, замість того щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний inference loop.
  </Accordion>
  <Accordion title="Допоміжні засоби stream, специфічні для Anthropic">
    Beta headers, `/fast` / `serviceTier` і `context1m` розміщені всередині
    публічного seam `api.ts` / `contract-api.ts` Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Допоміжні засоби runtime

Plugins можуть отримувати доступ до вибраних основних допоміжних засобів через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний основний payload виводу TTS для поверхонь файлів/voice-note.
- Використовує основну конфігурацію `messages.tts` і вибір провайдера.
- Повертає аудіобуфер PCM + частоту дискретизації. Plugins мають виконати resample/encode для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для voice pickers або потоків налаштування, якими володіє постачальник.
- Списки голосів можуть містити багатші metadata, зокрема locale, gender і personality tags для pickers, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft не підтримує.

Plugins також можуть реєструвати мовленнєвих провайдерів через `api.registerSpeechProvider(...)`.

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
- Використовуйте мовленнєвих провайдерів для поведінки синтезу, якою володіє постачальник.
- Застарілий input Microsoft `edge` нормалізується до provider id `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor plugin може відповідати за
  text, speech, image і майбутніх media providers, коли OpenClaw додаватиме ці
  capability contracts.

Для розуміння зображень/аудіо/відео plugins реєструють один типізований
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

- Тримайте orchestration, fallback, config і channel wiring у core.
- Тримайте поведінку постачальника в provider plugin.
- Адитивне розширення має залишатися типізованим: нові optional methods, нові optional
  result fields, нові optional capabilities.
- Генерація відео вже дотримується того самого шаблону:
  - core відповідає за capability contract і runtime helper
  - vendor plugins реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins використовують `api.runtime.videoGeneration.*`

Для runtime helpers media-understanding plugins можуть викликати:

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

Для транскрипції аудіо plugins можуть використовувати або runtime
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
  розуміння image/audio/video.
- Використовує основну аудіоконфігурацію media-understanding (`tools.media.audio`) і fallback order провайдерів.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, пропущений/непідтримуваний input).
- `api.runtime.stt.transcribeAudioFile(...)` лишається compatibility alias.

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

- `provider` і `model` є необов’язковими per-run overrides, а не постійними змінами session.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для fallback runs, якими володіє plugin, operators мають увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Subagent runs від untrusted plugin усе ще працюють, але override requests відхиляються замість мовчазного fallback.
- Створені plugin sessions subagent позначаються id plugin, що їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session усе ще потребує admin-scoped запиту Gateway.

Для вебпошуку plugins можуть використовувати спільний runtime helper замість
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

- Тримайте вибір провайдера, credential resolution і спільну семантику запитів у core.
- Використовуйте web-search providers для пошукових transport, специфічних для постачальника.
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

- `generate(...)`: згенерувати зображення за допомогою налаштованого image-generation provider chain.
- `listProviders(...)`: перелічити доступних image-generation providers та їхні capabilities.

## HTTP-маршрути Gateway

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

Поля маршруту:

- `path`: шлях маршруту під HTTP-сервером gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну автентифікацію gateway, або `"plugin"` для керованої plugin автентифікації/перевірки webhook.
- `match`: необов’язкове. `"exact"` (за замовчуванням) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і це спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один plugin не може замінити маршрут іншого plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Тримайте ланцюжки переходу `exact`/`prefix` лише на тому самому рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично операторські runtime scopes. Вони призначені для керованих plugin webhooks/перевірки підпису, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - автентифікація bearer через спільний секрет (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршрутів plugin прив'язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не вважайте маршрут plugin з gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk`
під час створення нових plugins. Основні підшляхи:

| Підшлях                            | Призначення                                       |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/побудови каналу            |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби й umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Zod-схема кореневого `openclaw.json` (`OpenClawSchema`) |

Канальні plugins вибирають із сімейства вузьких меж — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку затвердження слід об'єднувати
навколо одного контракту `approvalCapability`, а не змішувати між непов'язаними
полями plugin. Див. [Канальні plugins](/uk/plugins/sdk-channel-plugins).

Допоміжні засоби runtime і конфігурації розміщені у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого compatibility barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
та `openclaw/plugin-sdk/infra-runtime` — це застарілі сумісні shims для
старіших plugins. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (на корінь пакета кожного bundled plugin):

- `index.js` — вхід bundled plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — вхід setup plugin

Зовнішні plugins мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета plugin з core або з іншого plugin.
Точки входу, завантажені через фасад, надають перевагу активному знімку runtime config, коли він
існує, а потім повертаються до розв'язаного конфігураційного файла на диску.

Підшляхи для конкретних capabilities, як-от `image-generation`, `media-understanding`
і `speech`, існують тому, що bundled plugins використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну довідкову
сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugins мають володіти специфічними для каналу внесками схеми `describeMessageTool(...)`
для примітивів, що не є повідомленнями, як-от reactions, reads і polls.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість provider-native полів кнопок, компонентів, блоків або карток.
Див. [Представлення повідомлень](/uk/plugins/message-presentation) щодо контракту,
правил fallback, мапінгу провайдера та checklist автора plugin.

Plugins із можливістю надсилання оголошують, що вони можуть відтворювати через message capabilities:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів pinned-delivery

Core вирішує, чи відтворювати представлення нативно, чи погіршувати його до тексту.
Не відкривайте provider-native UI escape hatches із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy native schemas лишаються експортованими для наявних
сторонніх plugins, але нові plugins не повинні їх використовувати.

## Розв'язання цілі каналу

Канальні plugins мають володіти специфічною для каналу семантикою цілей. Тримайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід нормалізовану ціль
  трактувати як `direct`, `group` або `channel` перед пошуком у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи має
  вхід пропустити пошук у directory і відразу перейти до id-like resolution.
- `messaging.targetResolver.resolveTarget(...)` є fallback plugin, коли
  core потребує фінального розв'язання, яким володіє провайдер, після нормалізації або після
  промаху directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою специфічного для провайдера
  маршруту сесії після розв'язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбуватися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний ідентифікатор цілі".
- Використовуйте `resolveTarget` для специфічного для провайдера fallback нормалізації, а не для
  широкого пошуку в directory.
- Тримайте provider-native ids, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або специфічних для провайдера params, а не в загальних полях SDK.

## Довідники на основі конфігурації

Plugins, що виводять записи directory з конфігурації, мають тримати цю логіку в
plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers, керовані allowlist
- налаштовані мапи channel/group
- статичні fallback довідника в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрація запитів
- застосування ліміту
- допоміжні засоби deduping/нормалізації
- побудова `ChannelDirectoryEntry[]`

Специфічна для каналу перевірка облікового запису та нормалізація ідентифікаторів мають залишатися в
реалізації plugin.

## Каталоги провайдерів

Plugins провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли plugin володіє специфічними для провайдера ідентифікаторами моделей, типовими
base URL або metadata моделей, захищеними auth.

`catalog.order` керує тим, коли каталог plugin об'єднується відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери, керовані API key або env
- `profile`: провайдери, що з'являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов'язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі конфлікту ключів, тож plugins можуть навмисно перевизначити
вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only інспекція каналу

Якщо ваш plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поряд із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` є runtime path. Він може припускати, що credentials
  повністю матеріалізовані, і може швидко завершуватися з помилкою, коли бракує потрібних secrets.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також doctor/config
  repair flows, не повинні матеріалізувати runtime credentials лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/стану credentials, коли доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про read-only
  доступність. Повернення `tokenStatus: "available"` (і відповідного поля source)
  достатньо для команд у стилі status.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному командному шляху.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому командному
шляху" замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштований.

## Пакети пакетів

Директорія plugin може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен запис стає plugin. Якщо pack перелічує кілька extensions, plugin id
стає `name/<fileBase>`.

Якщо ваш plugin імпортує npm deps, встановіть їх у цій директорії, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Security guardrail: кожен запис `openclaw.extensions` має залишатися всередині директорії plugin
після розв'язання symlink. Записи, що виходять за межі директорії пакета,
відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності plugin через
локальний для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies у runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей plugin "pure JS/TS" і уникайте пакетів, які потребують
збірок `postinstall`.

Необов'язково: `openclaw.setupEntry` може вказувати на легкий setup-only модуль.
Коли OpenClaw потребує setup surfaces для вимкненого канального plugin або
коли канальний plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повного входу plugin. Це робить startup і setup легшими,
коли ваш основний вхід plugin також підключає tools, hooks або інший runtime-only
код.

Необов'язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити канальний plugin до того самого шляху `setupEntry` під час
pre-listen фази startup Gateway, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup surface, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має реєструвати кожну capability, якою володіє канал і від якої залежить startup, як-от:

- сама реєстрація каналу
- будь-які HTTP-маршрути, що мають бути доступні до того, як gateway почне слухати
- будь-які gateway methods, tools або services, що мають існувати впродовж того самого вікна

Якщо ваш повний entry досі володіє будь-якою required startup capability, не вмикайте
цей прапорець. Залиште plugin на стандартній поведінці й дозвольте OpenClaw завантажити
повний entry під час startup.

Bundled channels також можуть публікувати setup-only допоміжні засоби contract-surface, до яких core
може звертатися до завантаження повного runtime каналу. Поточна поверхня setup
promotion:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно підвищити застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного входу плагіна. Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового налаштування в іменований підвищений обліковий запис, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають вбудоване виявлення контрактної поверхні лінивим. Час імпорту залишається малим; поверхня підвищення завантажується лише під час першого використання, замість повторного входу у запуск вбудованого каналу під час імпорту модуля.

Коли ці стартові поверхні включають методи RPC Gateway, тримайте їх на префіксі, специфічному для плагіна. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються в `operator.admin`, навіть якщо плагін запитує вужчу область дії.

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

Плагіни каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і підказки встановлення через `openclaw.install`. Це зберігає каталог Core без даних.

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
- `preferOver`: ідентифікатори плагінів/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як здатний працювати з markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховати канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховати канал із інтерактивних засобів вибору налаштування/конфігурування, коли встановлено `false`
- `exposure.docs`: позначити канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: підключити канал до стандартного потоку швидкого старту `allowFrom`
- `forceAccountBinding`: вимагати явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддавати перевагу пошуку сеансу під час розв’язання цілей оголошення

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Покладіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (чи `OPENCLAW_MPM_CATALOG_PATHS`) на один або кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів надають нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи є npm-специфікація точною версією або плаваючим селектором, чи присутні очікувані метадані цілісності, і чи також доступний локальний шлях джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібрана назва npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` є недійсним або вказує на недоступне джерело, а також коли метадані цілісності npm присутні без дійсного npm-джерела. Споживачі мають трактувати `installSource` як додаткове необов’язкове поле, щоб створені вручну записи та прокладки каталогів не мусили його синтезувати.
Це дає змогу онбордингу та діагностиці пояснювати стан площини джерел без імпорту runtime плагіна.

Офіційні зовнішні npm-записи мають віддавати перевагу точному `npmSpec` разом з `expectedIntegrity`. Голі назви пакетів і dist-tags усе ще працюють для сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися до закріплених встановлень із перевіркою цілісності без поламування наявних плагінів. Коли онбординг встановлює з локального шляху каталогу, він записує керований запис індексу плагінів із `source: "path"` і відносним до робочого простору `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довгоживучу конфігурацію. Це зберігає локальні встановлення для розробки видимими для діагностики площини джерел без додавання другої сирої поверхні розкриття шляху файлової системи. Збережений індекс плагінів `plugins/installs.json` є джерелом істини встановлення і може оновлюватися без завантаження runtime-модулів плагінів. Його мапа `installRecords` є сталою навіть тоді, коли маніфест плагіна відсутній або недійсний; його масив `plugins` є перебудовуваним поданням маніфесту.

## Плагіни рушія контексту

Плагіни рушія контексту володіють оркестрацією контексту сеансу для внесення, складання та Compaction. Зареєструйте їх зі свого плагіна через `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій за допомогою `plugins.slots.contextEngine`.

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

Коли плагіну потрібна поведінка, яка не вписується в поточний API, не обходьте систему плагінів приватним прямим доступом. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, якою спільною поведінкою має володіти Core: політика, fallback, об’єднання конфігурації, життєвий цикл, семантика для каналів і форма runtime-помічника.
2. додайте типізовані поверхні реєстрації/runtime плагінів
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте Core + споживачів каналів/функцій
   Канали й функціональні плагіни мають споживати нову можливість через Core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Плагіни постачальників потім реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння та реєстрації з часом залишалася явною.

Саме так OpenClaw залишається принциповим, не стаючи жорстко прив’язаним до світогляду одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного контрольного списку файлів і пропрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом торкатися цих поверхонь:

- типи контракту Core в `src/<capability>/types.ts`
- runner/runtime-помічник Core в `src/<capability>/runtime.ts`
- поверхня реєстрації API плагінів у `src/plugins/types.ts`
- під’єднання реєстру плагінів у `src/plugins/registry.ts`
- runtime-експозиція плагінів у `src/plugins/runtime/*`, коли функціональним/канальним плагінам потрібно її споживати
- помічники захоплення/тестування в `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документація оператора/плагіна в `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака, що можливість ще не повністю інтегрована.

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
- функціональні/канальні плагіни споживають runtime-помічники
- контрактні тести зберігають володіння явним

## Пов’язане

- [Архітектура плагінів](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
