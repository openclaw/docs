---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin контекстного рушія
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, хуки середовища виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-05-03T18:44:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм Plugin та контрактів володіння/виконання див. [Архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є довідником із внутрішніх механізмів: конвеєра завантаження, реєстру, runtime-хуків, HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів Plugin
2. читає нативні або сумісні маніфести пакетів і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled-модулі використовують нативний завантажувач;
   сторонній локальний вихідний TypeScript використовує аварійний fallback Jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для команд і runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі bundled Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Запобіжні перевірки виконуються **до** runtime-виконання. Кандидатів блокують,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім користувачам або володіння шляхом
виглядає підозрілим для не-bundled Plugin.

Заблоковані кандидати залишаються прив’язаними до свого id Plugin для діагностики. Якщо конфігурація
все ще посилається на цей id, валідація повідомляє, що Plugin присутній, але заблокований,
і вказує назад на попередження про безпеку шляху, а не вважає запис конфігурації
застарілим.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для площини керування. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеву активацію та дескриптори налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною площини даних. Він реєструє
фактичну поведінку, як-от хуки, інструменти, команди або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на площині керування.
Це дескриптори лише метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження Plugin перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- налаштування каналу/розв’язання Plugin звужується до Plugin, які володіють запитаним
  id каналу
- явне налаштування провайдера/розв’язання runtime звужується до Plugin, які володіють
  запитаним id провайдера
- планування запуску Gateway використовує `activation.onStartup` для явних імпортів
  під час запуску та відмов від запуску; Plugin без метаданих запуску завантажуються лише
  через вужчі тригери активації

Runtime-попередні завантаження під час запиту, які запитують широкий scope `all`, усе ще виводять
явний ефективний набір id Plugin з конфігурації, планування запуску, налаштованих
каналів, слотів і правил автоматичного ввімкнення. Якщо цей виведений набір порожній, OpenClaw
завантажує порожній runtime-реєстр замість розширення до кожного виявного
Plugin.

Планувальник активації відкриває як API лише з ids для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому було вибрано Plugin,
відокремлюючи явні підказки планувальника `activation.*` від fallback володіння з маніфесту,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Такий поділ причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер надає перевагу id, якими володіють дескриптори, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити кандидатні Plugin, перш ніж повертатися до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки під час налаштування. Списки налаштування
провайдера використовують маніфест `providerAuthChoices`, виведені з дескрипторів варіанти налаштування
та метадані install-каталогу без завантаження runtime провайдера. Явне
`setup.requiresRuntime: false` є descriptor-only відсіканням; пропущене
`requiresRuntime` зберігає застарілий fallback setup-api для сумісності. Якщо більш
ніж один виявлений Plugin заявляє той самий нормалізований id провайдера налаштування або CLI
backend, пошук налаштування відмовляється від неоднозначного власника замість покладання на
порядок виявлення. Коли setup runtime виконується, діагностика реєстру повідомляє
про розбіжність між `setup.providers` / `setup.cliBackends` і провайдерами або CLI
backends, зареєстрованими setup-api, без блокування застарілих Plugin.

### Межа кешу Plugin

OpenClaw не кешує результати виявлення Plugin або прямі дані реєстру маніфесту
за часовими вікнами настінного годинника. Встановлення, редагування маніфестів і зміни load-path
мають ставати видимими під час наступного явного читання метаданих або перебудови snapshot.
Парсер файлу маніфесту може зберігати обмежений кеш файлового підпису, ключований за
відкритим шляхом маніфесту, inode, розміром і timestamps; цей кеш лише уникає
повторного парсингу незмінених байтів і не повинен кешувати відповіді щодо виявлення,
реєстру, власника або політики.

Безпечний швидкий шлях метаданих — це явне володіння об’єктом, а не прихований кеш.
Гарячі шляхи запуску Gateway мають передавати поточний `PluginMetadataSnapshot`,
виведену `PluginLookUpTable` або явний реєстр маніфесту через ланцюжок викликів.
Валідація конфігурації, автоматичне ввімкнення під час запуску, bootstrap Plugin і вибір провайдера
можуть повторно використовувати ці об’єкти, доки вони представляють поточну конфігурацію та
інвентар Plugin. Пошук налаштування все ще реконструює метадані маніфесту на вимогу,
якщо конкретний шлях налаштування не отримує явний реєстр маніфесту; тримайте це
як cold-path fallback, а не додавайте приховані кеші пошуку. Коли вхідні дані
змінюються, перебудуйте й замініть snapshot замість того, щоб мутувати його або зберігати
історичні копії.
Подання активного реєстру Plugin і bundled helpers bootstrap каналу
мають переобчислюватися з поточного реєстру/кореня. Короткоживучі мапи прийнятні
всередині одного виклику для дедуплікації роботи або захисту від повторного входу; вони не повинні ставати процесними
кешами метаданих.

Для завантаження Plugin постійний шар кешу — це runtime-завантаження. Він може повторно використовувати
стан завантажувача, коли код або встановлені артефакти справді завантажені, як-от:

- `PluginLoaderCacheState` і сумісні активні runtime-реєстри
- кеші jiti/модулів і кеші завантажувача публічних поверхонь, що використовуються, щоб уникнути імпорту
  тієї самої runtime-поверхні повторно
- кеші файлової системи для встановлених артефактів Plugin
- короткоживучі per-call мапи для нормалізації шляхів або розв’язання дублікатів

Ці кеші є деталями реалізації площини даних. Вони не повинні відповідати на
питання площини керування, як-от "який Plugin володіє цим провайдером?", якщо
викликач навмисно не попросив runtime-завантаження.

Не додавайте постійні або wall-clock кеші для:

- результатів виявлення
- прямих реєстрів маніфесту
- реєстрів маніфесту, реконструйованих із встановленого індексу Plugin
- пошуку власника провайдера, приглушення моделі, політики провайдера або метаданих
  публічного артефакту
- будь-якої іншої відповіді, виведеної з маніфесту, де змінений маніфест, встановлений індекс
  або load path має бути видимим під час наступного читання метаданих

Викликачі, які перебудовують метадані маніфесту зі збереженого встановленого індексу Plugin,
реконструюють цей реєстр на вимогу. Встановлений індекс є durable
source-plane станом; це не прихований in-process кеш метаданих.

## Модель реєстру

Завантажені Plugin не мутують напряму випадкові глобальні змінні core. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- CLI registrars
- фонові сервіси
- команди, якими володіє Plugin

Core-функції потім читають із цього реєстру замість того, щоб звертатися до модулів Plugin
напряму. Це зберігає завантаження односпрямованим:

- модуль Plugin -> реєстрація в реєстрі
- core runtime -> споживання реєстру

Це розділення важливе для супроводу. Воно означає, що більшості core-поверхонь потрібна лише
одна інтеграційна точка: "читати реєстр", а не "робити special-case для кожного модуля Plugin".

## Callback-и прив’язування розмови

Plugin, які прив’язують розмову, можуть реагувати, коли approval розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як запит на bind
схвалено або відхилено:

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
- `request`: початкове зведення запиту, detach-підказка, id відправника та
  метадані розмови

Цей callback має лише сповіщувальний характер. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення core-обробки approval.

## Runtime-хуки провайдера

Provider Plugin мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime пошуку:
  `setup.providers[].envVars`, застарілий compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Config-time хуки**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що покривають auth, розв’язання моделі,
  stream wrapping, рівні thinking, політику replay та endpoints usage. Див.
  повний список у розділі [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw усе ще володіє загальним agent loop, failover, обробкою transcript і
політикою інструментів. Ці хуки є розширювальною поверхнею для provider-specific
поведінки без потреби в повністю custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли провайдер має env-based
облікові дані, які загальні шляхи auth/status/model-picker мають бачити без
завантаження runtime Plugin. Застарілий `providerAuthEnvVars` усе ще читається
compatibility adapter під час deprecation window, а не-bundled Plugin,
які його використовують, отримують діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один id провайдера має повторно використовувати env vars іншого id провайдера, auth profiles,
config-backed auth і API-key onboarding choice. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI поверхні мають знати
choice id провайдера, group labels і просте one-flag auth wiring без
завантаження runtime провайдера. Зберігайте runtime провайдера
`envVars` для operator-facing підказок, як-от onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли канал має env-driven auth або setup, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження runtime каналу.

### Порядок хуків і використання

Для model/provider Plugin OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник для ухвалення рішення.
Compatibility-only поля провайдера, які OpenClaw більше не викликає, як-от
`ProviderPlugin.capabilities` і `suppressBuiltInModel`, навмисно не
перелічені тут.

| #   | Гачок                             | Що він робить                                                                                                   | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                           | Провайдер володіє каталогом або типовими значеннями базової URL-адреси                                                                       |
| 2   | `applyConfigDefaults`             | Застосовує належні провайдеру глобальні типові значення конфігурації під час матеріалізації конфігурації        | Типові значення залежать від режиму автентифікації, середовища або семантики сімейства моделей провайдера                                    |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                        | _(не гачок Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | Нормалізує застарілі або попередні псевдоніми ідентифікаторів моделей перед пошуком                             | Провайдер відповідає за очищення псевдонімів перед канонічним визначенням моделі                                                             |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                             | Провайдер відповідає за очищення транспорту для користувацьких ідентифікаторів провайдера в тому самому транспортному сімействі              |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням середовища виконання/провайдера                            | Провайдер потребує очищення конфігурації, яке має належати Plugin; вбудовані помічники сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує переписування сумісності нативного використання потокового передавання до провайдерів конфігурації   | Провайдер потребує виправлень метаданих нативного використання потокового передавання, керованих кінцевою точкою                             |
| 7   | `resolveConfigApiKey`             | Визначає автентифікацію з маркера середовища для провайдерів конфігурації перед завантаженням автентифікації середовища виконання | Провайдер має належне провайдеру визначення API-ключа з маркера середовища; `amazon-bedrock` також має тут вбудований резолвер маркерів середовища AWS |
| 8   | `resolveSyntheticAuth`            | Показує локальну/саморозміщену або підкріплену конфігурацією автентифікацію без збереження відкритого тексту    | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                   |
| 9   | `resolveExternalAuthProfiles`     | Накладає належні провайдеру зовнішні профілі автентифікації; типовим `persistence` є `runtime-only` для облікових даних, що належать CLI/застосунку | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих токенів оновлення; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів на користь автентифікації, підкріпленої середовищем/конфігурацією | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають отримувати пріоритет                                                         |
| 11  | `resolveDynamicModel`             | Синхронізує резервне визначення для належних провайдеру ідентифікаторів моделей, яких ще немає в локальному реєстрі | Провайдер приймає довільні ідентифікатори моделей upstream                                                                                   |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` запускається знову                                      | Провайдер потребує мережевих метаданих перед визначенням невідомих ідентифікаторів                                                           |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає визначену модель                              | Провайдер потребує переписування транспорту, але все ще використовує базовий транспорт                                                       |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей вендора за іншим сумісним транспортом                                    | Провайдер розпізнає власні моделі на проксі-транспортах без перебирання провайдера на себе                                                   |
| 15  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                      | Провайдер потребує очищення схем транспортного сімейства                                                                                      |
| 16  | `inspectToolSchemas`              | Показує належну провайдеру діагностику схем після нормалізації                                                 | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                        |
| 17  | `resolveReasoningOutputMode`      | Вибирає контракт виводу міркувань: нативний або тегований                                                       | Провайдер потребує тегованого виводу міркувань/фінального результату замість нативних полів                                                  |
| 18  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                   | Провайдер потребує типових параметрів запиту або очищення параметрів для окремого провайдера                                                 |
| 19  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким транспортом                                              | Провайдер потребує користувацького протоколу передавання, а не лише обгортки                                                                 |
| 20  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                          | Провайдер потребує обгорток сумісності заголовків/тіла/моделі запиту без користувацького транспорту                                          |
| 21  | `resolveTransportTurnState`       | Додає нативні для кожного ходу транспортні заголовки або метадані                                              | Провайдер хоче, щоб загальні транспорти надсилали нативну для провайдера ідентичність ходу                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Додає нативні заголовки WebSocket або політику охолодження сесії                                               | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику резервного переходу                                    |
| 23  | `formatApiKey`                    | Форматер профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                               | Провайдер зберігає додаткові метадані автентифікації та потребує користувацької форми runtime-токена                                         |
| 24  | `refreshOAuth`                    | Перевизначення оновлення OAuth для користувацьких кінцевих точок оновлення або політики збоїв оновлення        | Провайдер не вписується у спільні засоби оновлення `pi-ai`                                                                                    |
| 25  | `buildAuthDoctorHint`             | Підказка для ремонту, що додається, коли оновлення OAuth не вдається                                           | Провайдер потребує належних провайдеру вказівок з ремонту автентифікації після збою оновлення                                                |
| 26  | `matchesContextOverflowError`     | Належний провайдеру matcher переповнення контекстного вікна                                                    | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                 |
| 27  | `classifyFailoverReason`          | Належна провайдеру класифікація причини резервного переходу                                                    | Провайдер може зіставляти сирі помилки API/транспорту з лімітом швидкості/перевантаженням тощо                                               |
| 28  | `isCacheTtlEligible`              | Політика кешу підказок для проксі/backhaul-провайдерів                                                         | Провайдер потребує проксі-специфічного обмеження TTL кешу                                                                                    |
| 29  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення за відсутньої автентифікації                                        | Провайдер потребує специфічної для провайдера підказки відновлення за відсутньої автентифікації                                              |
| 30  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                     | Провайдер потребує синтетичних рядків прямої сумісності в `models list` і засобах вибору                                                     |
| 31  | `resolveThinkingProfile`          | Специфічний для моделі набір рівнів `/think`, відображувані мітки та типове значення                           | Провайдер надає користувацьку шкалу thinking або бінарну мітку для вибраних моделей                                                          |
| 32  | `isBinaryThinking`                | Гачок сумісності перемикача міркувань увімкнено/вимкнено                                                       | Провайдер надає лише бінарне увімкнення/вимкнення thinking                                                                                   |
| 33  | `supportsXHighThinking`           | Гачок сумісності підтримки міркувань `xhigh`                                                                   | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | Гачок сумісності типового рівня `/think`                                                                       | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                           |
| 35  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів живого профілю та вибору smoke-перевірок                                  | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                |
| 36  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference                | Провайдер потребує обміну токенів або короткоживучих облікових даних запиту                                                                  |
| 37  | `resolveUsageAuth`                | Вирішити облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь стану                                     | Провайдеру потрібен спеціальний розбір токена використання/квоти або інші облікові дані використання                                                               |
| 38  | `fetchUsageSnapshot`              | Отримати й нормалізувати специфічні для провайдера знімки використання/квоти після вирішення автентифікації                             | Провайдеру потрібна специфічна для провайдера кінцева точка використання або парсер корисного навантаження                                                                           |
| 39  | `createEmbeddingProvider`         | Створити належний провайдеру адаптер вбудовувань для пам’яті/пошуку                                                     | Поведінка вбудовувань пам’яті належить Plugin провайдера                                                                                    |
| 40  | `buildReplayPolicy`               | Повернути політику повторного відтворення, що керує обробкою транскрипту для провайдера                                        | Провайдеру потрібна спеціальна політика транскрипту (наприклад, вилучення блоків мислення)                                                               |
| 41  | `sanitizeReplayHistory`           | Переписати історію повторного відтворення після загального очищення транскрипту                                                        | Провайдеру потрібні специфічні для провайдера перезаписи повторного відтворення поза спільними помічниками Compaction                                                             |
| 42  | `validateReplayTurns`             | Виконати фінальну перевірку або зміну форми ходів повторного відтворення перед вбудованим runner                                           | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санітизації                                                                    |
| 43  | `onModelSelected`                 | Запустити належні провайдеру побічні ефекти після вибору                                                                 | Провайдеру потрібна телеметрія або належний провайдеру стан, коли модель стає активною                                                                  |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний provider plugin, а потім переходять до інших provider plugins із підтримкою хуків,
доки один із них фактично не змінить ідентифікатор моделі або transport/config. Це зберігає
працездатність alias/compat provider shims без потреби для викликача знати, який
вбудований plugin відповідає за перезапис. Якщо жоден provider hook не перезаписує підтримуваний
запис конфігурації Google-family, вбудований нормалізатор конфігурації Google все одно застосовує
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

Вбудовані provider plugins поєднують наведені вище хуки, щоб адаптуватися до каталогу,
автентифікації, thinking, replay і потреб usage кожного постачальника. Авторитетний набір хуків міститься разом із
кожним plugin у `extensions/`; ця сторінка ілюструє форми, а не
віддзеркалює список.

<AccordionGroup>
  <Accordion title="Провайдери наскрізного каталогу">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    ідентифікатори моделей перед статичним каталогом OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay та очищення transcript">
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
  <Accordion title="Потокові помічники, специфічні для Anthropic">
    Beta headers, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічного шва plugin Anthropic `api.ts` / `contract-api.ts`
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
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для voice pickers або setup flows, якими володіє постачальник.
- Списки голосів можуть містити багатші metadata, як-от locale, gender і personality tags для provider-aware pickers.
- OpenAI та ElevenLabs сьогодні підтримують telephony. Microsoft не підтримує.

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

- Залишайте політику TTS, fallback і доставку відповіді в core.
- Використовуйте speech providers для поведінки синтезу, якою володіє постачальник.
- Застарілий input Microsoft `edge` нормалізується до ідентифікатора провайдера `microsoft`.
- Переважна модель володіння орієнтована на компанії: один vendor plugin може володіти
  провайдерами text, speech, image і майбутніх media, коли OpenClaw додає ці
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

- Залишайте orchestration, fallback, config і channel wiring у core.
- Залишайте vendor behavior у provider plugin.
- Адитивне розширення має залишатися типізованим: нові необов’язкові methods, нові необов’язкові
  result fields, нові необов’язкові capabilities.
- Генерація відео вже дотримується того самого шаблону:
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

- `api.runtime.mediaUnderstanding.*` є переважною спільною поверхнею для
  розуміння image/audio/video.
- Використовує core media-understanding audio configuration (`tools.media.audio`) і provider fallback order.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, input пропущений або не підтримується).
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

- `provider` і `model` є необов’язковими per-run overrides, а не persistent session changes.
- OpenClaw враховує ці override fields лише для trusted callers.
- Для plugin-owned fallback runs оператори мають увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical targets `provider/model`, або `"*"`, щоб явно дозволити будь-яку target.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються замість silent falling back.
- Plugin-created subagent sessions позначаються ідентифікатором plugin, що їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; arbitrary session deletion усе ще потребує admin-scoped Gateway request.

Для web search plugins можуть використовувати спільний runtime helper замість того, щоб
звертатися до agent tool wiring:

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
- `api.runtime.webSearch.*` є переважною спільною поверхнею для feature/channel plugins, яким потрібна search behavior без залежності від agent tool wrapper.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюга image-generation provider.
- `listProviders(...)`: перелічує доступних image-generation providers та їхні capabilities.

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

- `path`: шлях маршруту під HTTP server gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну автентифікацію gateway, або `"plugin"` для plugin-managed auth/webhook verification.
- `match`: необов’язкове. `"exact"` (за замовчуванням) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну route registration.
- `handler`: повертає `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено й спричинить помилку завантаження плагіна. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути плагінів мають явно оголошувати `auth`.
- Точні конфлікти `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один плагін не може замінити маршрут іншого плагіна.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Ланцюжки переходу `exact`/`prefix` тримайте лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-області оператора. Вони призначені для керованих плагіном webhooks/перевірки підписів, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині runtime-області запиту Gateway, але ця область навмисно консервативна:
  - bearer-auth на спільному секреті (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-області маршрутів плагіна прив'язаними до `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів плагіна з ідентичністю, runtime-область повертається до `operator.write`
- Практичне правило: не вважайте маршрут плагіна з gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте режим auth з ідентичністю та задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових плагінів використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk`. Основні підшляхи:

| Підшлях                            | Призначення                                       |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації плагінів                     |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/збирання каналів           |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та парасольковий контракт |
| `openclaw/plugin-sdk/config-schema` | Zod-схема кореневого `openclaw.json` (`OpenClawSchema`) |

Плагіни каналів вибирають із сімейства вузьких seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між непов'язаними
полями плагіна. Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).

Runtime- та конфігураційні допоміжні засоби містяться у відповідних сфокусованих підшляхах `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Віддавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого compatibility-barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими сумісними shims для
старіших плагінів. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного вбудованого плагіна):

- `index.js` — точка входу вбудованого плагіна
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup-плагіна

Зовнішні плагіни мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` пакета іншого плагіна з core або з іншого плагіна.
Точки входу, завантажені через facade, надають перевагу активному snapshot runtime-конфігурації,
коли він існує, а потім повертаються до розв'язуваного конфігураційного файла на диску.

Capability-специфічні підшляхи, як-от `image-generation`, `media-understanding`
і `speech`, існують, бо вбудовані плагіни використовують їх сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Плагіни мають володіти внесками до channel-specific схем `describeMessageTool(...)`
для примітивів, що не є повідомленнями, як-от реакції, прочитання та опитування.
Спільна презентація надсилання має використовувати загальний контракт `MessagePresentation`
замість provider-native полів кнопок, компонентів, блоків або карток.
Див. [Презентація повідомлень](/uk/plugins/message-presentation) щодо контракту,
правил fallback, мапінгу провайдерів і checklist для авторів плагінів.

Плагіни з можливістю надсилання оголошують, що вони можуть відтворювати через capabilities повідомлень:

- `presentation` для семантичних блоків презентації (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи відтворювати презентацію нативно, чи деградувати її до тексту.
Не відкривайте provider-native обхідні UI-механізми з загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy нативних схем лишаються експортованими для наявних
сторонніх плагінів, але нові плагіни не мають їх використовувати.

## Розв'язання цілей каналів

Плагіни каналів мають володіти channel-specific семантикою цілей. Тримайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи normalized ціль
  слід розглядати як `direct`, `group` або `channel` перед пошуком у directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи має
  вхід пропустити пошук у directory і перейти прямо до id-like розв'язання.
- `messaging.targetResolver.resolveTarget(...)` є fallback плагіна, коли
  core потрібне фінальне provider-owned розв'язання після нормалізації або після
  промаху directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою provider-specific маршруту
  сесії після розв'язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбуватися перед
  пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "розглядати це як явний/нативний target id".
- Використовуйте `resolveTarget` для provider-specific fallback нормалізації, а не для
  широкого пошуку в directory.
- Тримайте provider-native ids, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або provider-specific параметрів, а не в загальних
  полях SDK.

## Директорії на основі конфігурації

Плагіни, які виводять записи directory з конфігурації, мають тримати цю логіку в
плагіні та повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers на основі allowlist
- налаштовані мапи каналів/груп
- статичні fallback directory в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Channel-specific інспекція облікового запису та нормалізація id мають лишатися в
реалізації плагіна.

## Каталоги провайдерів

Плагіни провайдерів можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли плагін володіє provider-specific model ids, типовими значеннями
base URL або auth-gated метаданими моделей.

`catalog.order` керує тим, коли каталог плагіна зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: прості провайдери на API-key або env
- `profile`: провайдери, які з'являються, коли існують auth profiles
- `paired`: провайдери, що синтезують кілька пов'язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають під час колізії ключів, тож плагіни можуть навмисно перевизначити
вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only інспекція каналів

Якщо ваш плагін реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` є runtime-шляхом. Йому дозволено припускати, що credentials
  повністю матеріалізовані, і він може швидко завершуватися помилкою, коли потрібні secrets відсутні.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки doctor/config
  repair, не мають потребувати матеріалізації runtime credentials лише щоб
  описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/стану credentials, коли доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення токенів лише для звітування про read-only
  доступність. Повернути `tokenStatus: "available"` (і відповідне поле source)
  достатньо для status-style команд.
- Використовуйте `configured_unavailable`, коли credential налаштовано через SecretRef, але
  він недоступний у поточному командному шляху.

Це дозволяє read-only командам повідомляти "налаштовано, але недоступно в цьому командному
шляху" замість аварійного завершення або хибного звіту, що обліковий запис не налаштовано.

## Package packs

Директорія плагіна може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен entry стає плагіном. Якщо pack перелічує кілька extensions, id плагіна
стає `name/<fileBase>`.

Якщо ваш плагін імпортує npm deps, встановіть їх у цій директорії, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен entry `openclaw.extensions` має лишатися всередині директорії плагіна
після розв'язання symlink. Entries, що виходять за межі директорії пакета,
відхиляються.

Примітка з безпеки: `openclaw plugins install` встановлює залежності плагіна через
локальний для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies під час runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей плагіна "pure JS/TS" та уникайте пакетів, які потребують
`postinstall` builds.

Необов'язково: `openclaw.setupEntry` може вказувати на легкий setup-only модуль.
Коли OpenClaw потрібні setup surfaces для вимкненого плагіна каналу або
коли плагін каналу увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу плагіна. Це робить startup і setup легшими,
коли основна точка входу вашого плагіна також під'єднує інструменти, hooks або інший runtime-only
код.

Необов'язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може увімкнути для плагіна каналу той самий шлях `setupEntry` під час pre-listen
фази startup gateway, навіть коли канал уже налаштований.

Використовуйте це лише коли `setupEntry` повністю покриває startup surface, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що setup entry
має зареєструвати кожну channel-owned capability, від якої залежить startup, як-от:

- сама реєстрація каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які gateway methods, tools або services, які мають існувати протягом того самого вікна

Якщо ваша повна entry все ще володіє будь-якою потрібною startup capability, не вмикайте
цей flag. Залиште плагін на поведінці за замовчуванням і дозвольте OpenClaw завантажити
повну entry під час startup.

Вбудовані канали також можуть публікувати setup-only допоміжні засоби contract-surface, до яких core
може звертатися до завантаження повного runtime каналу. Поточна setup
promotion surface така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу з одним обліковим записом у `channels.<id>.accounts.*` без завантаження повного входу plugin.
Matrix є поточним вбудованим прикладом: він переносить лише ключі автентифікації/початкового налаштування в іменований просунутий обліковий запис, коли іменовані облікові записи вже існують, і може зберігати налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають ліниве виявлення вбудованої контрактної поверхні. Час імпорту залишається невеликим; поверхня просування завантажується лише під час першого використання замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску містять методи RPC Gateway, тримайте їх на префіксі, специфічному для plugin. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються в `operator.admin`, навіть якщо plugin запитує вужчу область дії.

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

Channel plugins можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і підказки встановлення через `openclaw.install`. Це дає змогу Core залишатися без даних каталогу.

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
- `preferOver`: ids plugin/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховати канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховати канал з інтерактивних засобів вибору налаштування/конфігурування, коли встановлено `false`
- `exposure.docs`: позначити канал як внутрішній/приватний для поверхонь навігації документацією
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключити канал до стандартного потоку швидкого старту `allowFrom`
- `forceAccountBinding`: вимагати явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надавати перевагу пошуку сеансу під час розв’язання цілей оголошення

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Розмістіть файл JSON в одному з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або спрямуйте `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на один чи кілька файлів JSON (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів надають нормалізовані факти джерела встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи npm-специфікація є точною версією або плаваючим селектором, чи наявні очікувані метадані цілісності, і чи також доступний локальний шлях джерела. Коли ідентичність каталогу/пакета відома, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, і коли метадані цілісності npm наявні без дійсного npm-джерела. Споживачі мають розглядати `installSource` як додаткове необов’язкове поле, щоб створені вручну записи й прокладки каталогу не мусили його синтезувати.
Це дає змогу онбордингу й діагностиці пояснювати стан площини джерел без імпорту runtime plugin.

Офіційні зовнішні npm-записи мають надавати перевагу точному `npmSpec` разом із `expectedIntegrity`. Голі імена пакетів і dist-tags усе ще працюють для сумісності, але вони виводять попередження площини джерел, щоб каталог міг перейти до закріплених, перевірених на цілісність встановлень без порушення роботи наявних plugins.
Коли онбординг встановлює з локального шляху каталогу, він записує керований запис індексу plugin із `source: "path"` і відносним до робочої області `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалу конфігурацію. Це зберігає локальні встановлення для розробки видимими для діагностики площини джерел без додавання другої сирої поверхні розкриття шляхів файлової системи. Збережений індекс plugin `plugins/installs.json` є джерелом істини для джерела встановлення й може оновлюватися без завантаження runtime-модулів plugin.
Його мапа `installRecords` є стійкою, навіть коли маніфест plugin відсутній або недійсний; його масив `plugins` є відновлюваним представленням маніфестів.

## Plugins рушія контексту

Plugins рушія контексту володіють оркестрацією контексту сеансу для отримання, збирання та Compaction. Зареєструйте їх зі свого plugin за допомогою `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій через `plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити стандартний конвеєр контексту, а не просто додати пошук у пам’яті чи хуки.

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

Коли plugin потрібна поведінка, яка не вписується в поточний API, не обходьте систему plugin через приватне втручання. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт Core
   Вирішіть, якою спільною поведінкою має володіти Core: політикою, fallback, об’єднанням конфігурації, життєвим циклом, семантикою для каналів і формою runtime-помічника.
2. додайте типізовані поверхні реєстрації/runtime plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте Core + споживачів каналів/функцій
   Канали й feature plugins мають споживати нову можливість через Core, а не шляхом прямого імпорту реалізації постачальника.
4. зареєструйте реалізації постачальників
   Vendor plugins потім реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб власність і форма реєстрації з часом залишалися явними.

Так OpenClaw залишається принциповим, не стаючи жорстко прив’язаним до світогляду одного провайдера. Дивіться [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного контрольного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом охоплювати ці поверхні:

- типи контракту Core у `src/<capability>/types.ts`
- runner/runtime-помічник Core у `src/<capability>/runtime.ts`
- поверхня реєстрації API plugin у `src/plugins/types.ts`
- підключення реєстру plugin у `src/plugins/registry.ts`
- runtime-експозиція plugin у `src/plugins/runtime/*`, коли feature/channel plugins мають її споживати
- помічники захоплення/тестування у `src/test-utils/plugin-registration.ts`
- твердження власності/контракту у `src/plugins/contracts/registry.ts`
- документація оператора/plugin у `docs/`

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

Шаблон контрактного тесту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- Core володіє контрактом можливості + оркестрацією
- vendor plugins володіють реалізаціями постачальників
- feature/channel plugins споживають runtime-помічники
- контрактні тести зберігають власність явною

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
