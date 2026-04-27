---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакунків пакетів
    - Налагодження порядку завантаження plugin або стану реєстру
    - Додавання нової можливості plugin або plugin рушія контексту
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішні механізми архітектури Plugin
x-i18n:
    generated_at: "2026-04-27T16:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72aac4073018a61d3731a8de54782c63c9ab6e3d21b3af95198adadf8be582f1
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Для публічної моделі можливостей, форм plugin та контрактів
володіння/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка —
довідник із внутрішніх механізмів: конвеєра завантаження, реєстру, runtime-хуків,
HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє кандидатні корені plugin
2. зчитує маніфести native або сумісних пакетів і метадані пакетів
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи вмикати кожного кандидата
6. завантажує ввімкнені native-модулі: зібрані вбудовані модулі використовують native-завантажувач;
   незібрані native-plugin використовують jiti
7. викликає native-хуки `register(api)` і збирає реєстрації в реєстр plugin
8. відкриває реєстр для поверхонь команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що з них присутнє (`def.register ?? def.activate`), і викликає в тій самій точці. Усі вбудовані plugins використовують `register`; для нових plugins надавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли точка входу виходить за межі кореня plugin, шлях має право запису для всіх,
або власник шляху виглядає підозріло для невбудованих plugins.

### Поведінка з пріоритетом маніфесту

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/заповнювачі Control UI
- показувати метадані встановлення/каталогу
- зберігати недорогі дескриптори активації та налаштування без завантаження runtime plugin

Для native-plugins runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише метадані-дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі живої активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до plugins, які володіють запитаною основною командою
- налаштування каналу/визначення plugin звужується до plugins, які володіють запитаним
  id каналу
- явне визначення налаштування/runtime провайдера звужується до plugins, які володіють
  запитаним id провайдера

Планувальник активації надає і API лише з id для наявних викликів, і
API плану для нової діагностики. Записи плану повідомляють, чому plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервного
володіння з маніфесту, такого як `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані plugin і далі працюють, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення налаштування тепер надає перевагу id, що належать дескриптору, таким як
`setup.providers` і `setup.cliBackends`, щоб звузити кандидатні plugins перед тим, як
повернутися до `setup-api` для plugins, яким і далі потрібні runtime-хуки на етапі налаштування. Списки
налаштування провайдера використовують маніфест `providerAuthChoices`, варіанти налаштування,
похідні від дескриптора, і метадані каталогу встановлення без завантаження runtime провайдера. Явний
`setup.requiresRuntime: false` є межею лише для дескриптора; якщо
`requiresRuntime` пропущено, для сумісності зберігається застарілий резервний шлях `setup-api`. Якщо більше
ніж один виявлений plugin заявляє про той самий нормалізований id провайдера налаштування або CLI-бекенда,
пошук налаштування відхиляє неоднозначного власника замість покладання на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє
про розбіжності між `setup.providers` / `setup.cliBackends` і провайдерами або CLI-бекендами,
зареєстрованими через setup-api, не блокуючи застарілі plugins.

### Що кешує завантажувач

OpenClaw зберігає короткоживучі внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів plugin

Ці кеші зменшують пікове навантаження під час запуску та накладні витрати повторних команд. Їх безпечно
розглядати як короткоживучі кеші продуктивності, а не як постійне зберігання.

Гарячі шляхи запуску Gateway мають віддавати перевагу поточному `PluginMetadataSnapshot`,
похідному `PluginLookUpTable` або явному реєстру маніфестів, переданому по ланцюжку викликів. Перевірка конфігурації,
автоматичне ввімкнення під час запуску та bootstrap plugin використовують той самий знімок, коли це можливо.
Для викликів, які все ще перебудовують метадані маніфесту зі збереженого індексу встановлених plugin,
OpenClaw також зберігає невеликий обмежений резервний кеш із ключами за встановленим індексом, формою запиту, політикою конфігурації,
runtime-коренями та сигнатурами файлів маніфесту/пакета. Цей кеш є лише
резервом для повторної реконструкції індексу встановлених plugin; це не змінюваний runtime-
реєстр plugin.

Примітка щодо продуктивності:

- Встановіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Встановіть `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1`, щоб вимкнути
  лише резервний кеш реєстру маніфестів для індексу встановлених plugin.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugins не змінюють напряму довільні глобальні об’єкти ядра. Вони реєструються в
центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки й типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, що належать plugin

Функції ядра потім читають із цього реєстру замість прямої взаємодії з модулями plugin.
Це зберігає односпрямованість завантаження:

- модуль plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для супроводу. Воно означає, що більшості поверхонь ядра
потрібна лише одна точка інтеграції: «читати реєстр», а не «окремо обробляти кожен модуль plugin».

## Колбеки прив’язки розмови

Plugins, які прив’язують розмову, можуть реагувати, коли погодження завершено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати колбек після того, як запит на прив’язку
схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Для цього plugin + розмови тепер існує прив’язка.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистьте будь-який локальний стан очікування.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля корисного навантаження колбека:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: вирішена прив’язка для схвалених запитів
- `request`: зведення початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей колбек призначений лише для сповіщення. Він не змінює, хто має право прив’язувати
розмову, і виконується після завершення обробки погодження ядром.

## Runtime-хуки провайдера

Plugins провайдера мають три рівні:

- **Метадані маніфесту** для недорогого передruntime-пошуку:
  `setup.providers[].envVars`, застарілий сумісний `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків для auth, визначення моделі,
  обгортання потоку, рівнів thinking, політики відтворення та кінцевих точок використання. Див.
  повний список у розділі [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw і далі відповідає за загальний цикл агента, failover, обробку транскриптів і
політику інструментів. Ці хуки — поверхня розширення для специфічної поведінки провайдера
без потреби у повністю власному транспорті інференсу.

Використовуйте маніфест `setup.providers[].envVars`, коли провайдер має облікові дані на основі env,
які мають бути видимі загальним шляхам auth/status/вибору моделі без
завантаження runtime plugin. Застарілий `providerAuthEnvVars` і далі читається адаптером сумісності
під час перехідного періоду, а невбудовані plugins, які його використовують, отримують
діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`, коли один id провайдера
має повторно використовувати env vars, профілі auth, auth на основі конфігурації та варіант
онбордингу з API-ключем іншого id провайдера. Використовуйте маніфест
`providerAuthChoices`, коли поверхні CLI онбордингу/вибору auth мають знати
id варіанта провайдера, мітки груп і просту auth-проводку з одним прапорцем без
завантаження runtime провайдера. Залишайте runtime провайдера
`envVars` для операторських підказок, таких як мітки онбордингу або змінні налаштування
OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування на основі env,
які загальний резервний шлях shell-env, перевірки config/status або підказки налаштування мають бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для plugins моделі/провайдера OpenClaw викликає хуки приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий посібник для вибору.

| #   | Хук                               | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                          | Провайдер володіє каталогом або типовими значеннями `base URL`                                                                                |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                     |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                   | _(не є хуком plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Провайдер володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                   |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                            | Провайдер володіє очищенням транспорту для власних id провайдера в межах того самого сімейства транспорту                                    |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                        | Провайдеру потрібне очищення конфігурації, яке має жити разом із plugin; вбудовані helper-и сімейства Google також страхують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні перезаписи native streaming-usage до конфігурованих провайдерів                             | Провайдеру потрібні виправлення метаданих native streaming usage, що залежать від кінцевої точки                                              |
| 7   | `resolveConfigApiKey`             | Визначає auth env-marker для конфігурованих провайдерів перед завантаженням runtime auth                       | Провайдер має власне визначення API-ключа env-marker; `amazon-bedrock` також має тут вбудований AWS-резолвер env-marker                      |
| 8   | `resolveSyntheticAuth`            | Виводить локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту               | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі auth, що належать провайдеру; типовим `persistence` є `runtime-only` для облікових даних CLI/app | Провайдер повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token-ів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені заповнювачі синтетичних профілів нижче за auth на основі env/конфігурації                    | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають отримувати пріоритет                                                          |
| 11  | `resolveDynamicModel`             | Синхронний резервний шлях для model id провайдера, яких ще немає в локальному реєстрі                          | Провайдер приймає довільні id моделей із зовнішнього джерела                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний розігрів, після чого `resolveDynamicModel` запускається знову                                       | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                           |
| 13  | `normalizeResolvedModel`          | Остаточний перезапис перед тим, як вбудований runner використовує визначену модель                              | Провайдеру потрібні перезаписи транспорту, але він усе ще використовує транспорт ядра                                                         |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці compat для моделей вендора за іншим сумісним транспортом                                        | Провайдер розпізнає власні моделі на proxy-транспортах, не перебираючи на себе роль провайдера                                                |
| 15  | `capabilities`                    | Метадані транскрипту/інструментів, що належать провайдеру та використовуються спільною логікою ядра            | Провайдеру потрібні особливості транскрипту/сімейства провайдера                                                                               |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                       | Провайдеру потрібне очищення схем для сімейства транспорту                                                                                     |
| 17  | `inspectToolSchemas`              | Виводить діагностику схем, що належить провайдеру, після нормалізації                                           | Провайдер хоче попередження про ключові слова без додавання в ядро специфічних для провайдера правил                                          |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт reasoning output                                                              | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                    | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                                |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                      | Провайдеру потрібен власний wire protocol, а не просто обгортка                                                                                |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Провайдеру потрібні обгортки сумісності заголовків/тіла запиту/моделі без власного транспорту                                                 |
| 22  | `resolveTransportTurnState`       | Додає native-заголовки або метадані транспорту для кожного ходу                                                 | Провайдер хоче, щоб загальні транспорти надсилали native-ідентичність ходу провайдера                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native-заголовки WebSocket або політику cooldown сесії                                                    | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику резервного шляху                                        |
| 24  | `formatApiKey`                    | Форматувач auth-профілю: збережений профіль стає рядком runtime `apiKey`                                        | Провайдер зберігає додаткові метадані auth і потребує власну форму runtime-токена                                                             |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для власних кінцевих точок refresh або політики помилки refresh                   | Провайдер не відповідає спільним механізмам refresh `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли OAuth refresh завершується помилкою                                    | Провайдеру потрібна власна підказка відновлення auth після помилки refresh                                                                     |
| 27  | `matchesContextOverflowError`     | Власний зіставник переповнення context window для провайдера                                                    | Провайдер має сирі помилки переповнення, які загальні евристики не виявлять                                                                   |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить провайдеру                                                            | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/перевантаженням тощо                                                       |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                            | Провайдеру потрібне обмеження TTL кешу, специфічне для proxy                                                                                   |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення при відсутності auth                                                 | Провайдеру потрібна специфічна для провайдера підказка відновлення при відсутності auth                                                        |
| 31  | `suppressBuiltInModel`            | Приховування застарілих моделей із зовнішнього джерела плюс необов’язкова користувацька підказка про помилку   | Провайдеру потрібно приховувати застарілі рядки з зовнішнього джерела або замінювати їх підказкою вендора                                     |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                      | Провайдеру потрібні синтетичні рядки прямої сумісності в `models list` і засобах вибору                                                       |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                              | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                  |
| 34  | `isBinaryThinking`                | Хук сумісності для перемикача reasoning увімк./вимк.                                                            | Провайдер підтримує лише двійкове thinking: увімкнено/вимкнено                                                                                 |
| 35  | `supportsXHighThinking`           | Хук сумісності підтримки reasoning `xhigh`                                                                      | Провайдер хоче підтримку `xhigh` лише для частини моделей                                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності типового рівня `/think`                                                                          | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                             |
| 37  | `isModernModelRef`                | Зіставник modern-model для фільтрів live-профілю та вибору smoke                                               | Провайдер володіє зіставленням preferred-model для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference               | Провайдеру потрібен обмін токена або короткоживучі облікові дані запиту                                                                       |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` та пов’язаних поверхонь статусу                              | Провайдеру потрібен власний парсинг токена usage/quota або інші облікові дані для usage                                                      |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує специфічні для провайдера знімки usage/quota після визначення auth                        | Провайдеру потрібна специфічна для провайдера кінцева точка usage або парсер корисного навантаження                                          |
| 41  | `createEmbeddingProvider`         | Створює embedding-адаптер, що належить провайдеру, для пам’яті/пошуку                                           | Поведінка embedding для пам’яті має належати plugin провайдера                                                                                |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою транскрипту для провайдера                                        | Провайдеру потрібна власна політика транскрипту, наприклад видалення блоків thinking                                                         |
| 43  | `sanitizeReplayHistory`           | Перезаписує історію replay після загального очищення транскрипту                                                | Провайдеру потрібні специфічні для провайдера перезаписи replay понад спільні helper-и Compaction                                           |
| 44  | `validateReplayTurns`             | Остаточна перевірка або зміна форми ходів replay перед вбудованим runner                                        | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санації                                                               |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать провайдеру                                              | Провайдеру потрібна телеметрія або стан, що належить провайдеру, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
plugin провайдера, що збігся, а потім переходять до інших plugin провайдерів із підтримкою хуків,
доки один із них фактично не змінить id моделі або transport/config. Це дає змогу
shim-прошаркам alias/compat провайдера працювати без вимоги, щоб виклик знав, який
саме вбудований plugin володіє цим перезаписом. Якщо жоден хук провайдера не перезапише
підтримуваний запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google
усе одно застосує це очищення сумісності.

Якщо провайдеру потрібен повністю власний wire protocol або власний виконавець запитів,
це вже інший клас розширення. Ці хуки призначені для поведінки провайдера,
яка все ще працює в межах звичайного циклу inference OpenClaw.

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

Вбудовані plugins провайдерів поєднують наведені вище хуки, щоб відповідати потребам
кожного вендора щодо каталогу, auth, thinking, replay та usage. Авторитетний набір хуків
живе разом із кожним plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогу з наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати id моделей
    із зовнішнього джерела раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і кінцевих точок usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення транскриптів">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу
    підключати політику транскриптів через `buildReplayPolicy` замість того, щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл inference.
  </Accordion>
  <Accordion title="Специфічні для Anthropic helper-и потоку">
    Бета-заголовки, `/fast` / `serviceTier` і `context1m` розміщено всередині
    публічного шва `api.ts` / `contract-api.ts` plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-helper-и

Plugins можуть отримувати доступ до вибраних helper-ів ядра через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайне корисне навантаження виводу TTS ядра для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію ядра `messages.tts` і вибір провайдера.
- Повертає PCM-аудіобуфер + частоту дискретизації. Plugins мають виконувати ресемплінг/кодування для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для засобів вибору голосу або потоків налаштування, що належать вендору.
- Списки голосів можуть містити багатші метадані, як-от locale, стать і теги характеру для засобів вибору, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

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

- Залишайте політику TTS, резервний шлях і доставлення відповіді в ядрі.
- Використовуйте мовленнєвих провайдерів для поведінки синтезу, що належить вендору.
- Застарілий вхід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння — орієнтована на компанію: один plugin вендора може володіти
  текстовими, мовленнєвими, графічними та майбутніми медіапровайдерами, коли OpenClaw додаватиме ці
  контракти можливостей.

Для розуміння зображень/аудіо/відео plugins реєструють одного типізованого
провайдера розуміння медіа замість узагальненого набору ключ/значення:

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

- Залишайте оркестрацію, резервний шлях, конфігурацію та підключення каналів у ядрі.
- Залишайте поведінку вендора в plugin провайдера.
- Розширення шляхом додавання має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже наслідує той самий шаблон:
  - ядро володіє контрактом можливості та runtime-helper-ом
  - plugins вендорів реєструють `api.registerVideoGenerationProvider(...)`
  - plugins функцій/каналів використовують `api.runtime.videoGeneration.*`

Для runtime-helper-ів розуміння медіа plugins можуть викликати:

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

Для транскрибування аудіо plugins можуть використовувати або runtime
розуміння медіа, або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов’язково, коли MIME неможливо надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо розуміння медіа ядра (`tools.media.audio`) і порядок резервних шляхів провайдера.
- Повертає `{ text: undefined }`, коли вихід транскрибування не створюється (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається як псевдонім сумісності.

Plugins також можуть запускати фонові виконання субагентів через `api.runtime.subagent`:

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
- OpenClaw враховує ці поля перевизначення лише для довірених викликів.
- Для резервних запусків, що належать plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugins конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски субагента з недовірених plugin усе ще працюють, але запити на перевизначення відхиляються замість тихого переходу на резервний шлях.
- Сесії субагентів, створені plugin, позначаються id plugin, що їх створив. Резервний шлях `api.runtime.subagent.deleteSession(...)` може видаляти лише ці сесії, що належать plugin; довільне видалення сесій, як і раніше, потребує запиту Gateway з областю дії адміністратора.

Для вебпошуку plugins можуть використовувати спільний runtime-helper замість
звернення до підключення інструмента агента:

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

Plugins також можуть реєструвати провайдерів вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Залишайте вибір провайдера, визначення облікових даних і спільну семантику запитів у ядрі.
- Використовуйте провайдерів вебпошуку для специфічних транспортів пошуку вендора.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для plugins функцій/каналів, яким потрібна поведінка пошуку без залежності від обгортки інструмента агента.

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

- `generate(...)`: генерує зображення, використовуючи налаштований ланцюжок провайдерів генерації зображень.
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

Plugins можуть відкривати HTTP-ендпойнти через `api.registerHttpRoute(...)`.

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
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth, керованої plugin, / перевірки Webhook.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертає `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було видалено, і це спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути plugin мають явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один plugin не може замінити маршрут іншого plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Ланцюжки передачі керування `exact`/`prefix` мають залишатися лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично області runtime оператора. Вони призначені для webhook-ів / перевірки підписів, керованих plugin, а не для привілейованих helper-викликів Gateway.
- Маршрути `auth: "gateway"` працюють у межах області runtime запиту Gateway, але ця область навмисно консервативна:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує області runtime маршрутів plugin на рівні `operator.write`, навіть якщо виклик надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршрутів plugin з ідентичністю, область runtime повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут plugin з auth gateway є неявною поверхнею адміністратора. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю й задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових plugins використовуйте вузькі підшляхи SDK замість
монолітного кореневого barrel `openclaw/plugin-sdk`.
Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Helper-и входу/побудови каналу                     |
| `openclaw/plugin-sdk/core`          | Загальні спільні helper-и та umbrella-контракт     |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Plugins каналів вибирають із сімейства вузьких швів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погодження слід консолідувати
в одному контракті `approvalCapability`, а не змішувати між не пов’язаними
полями plugin. Див. [Plugins каналів](/uk/plugins/sdk-channel-plugins).

Runtime- і config-helper-и розміщені у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших plugins. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (для кореня пакета кожного вбудованого plugin):

- `index.js` — точка входу вбудованого plugin
- `api.js` — barrel helper-ів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу plugin для setup

Зовнішні plugins мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета plugin з ядра або з іншого plugin.
Точки входу, завантажені через facade, віддають перевагу активному знімку runtime-конфігурації, якщо він існує,
а потім повертаються до визначеного файлу конфігурації на диску.

Підшляхи, специфічні для можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують, оскільки вбудовані plugins уже використовують їх сьогодні. Вони не є
автоматично зовнішніми контрактами, замороженими на довгий строк — перевіряйте відповідну сторінку
довідки SDK, коли покладаєтесь на них.

## Схеми інструментів повідомлень

Plugins мають володіти внесками до схеми канально-специфічного `describeMessageTool(...)`
для немеседжевих примітивів, як-от реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів кнопок, компонентів, блоків або карток конкретного провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation) для контракту,
правил резервного шляху, мапування провайдерів і контрольного списку автора plugin.

Plugins із підтримкою надсилання оголошують, що саме вони можуть відобразити, через можливості повідомлень:

- `presentation` для блоків семантичного представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленого доставлення

Ядро вирішує, чи відображати представлення native-способом, чи деградувати його до тексту.
Не відкривайте шляхи обходу до native UI провайдера з загального інструмента повідомлень.
Застарілі helper-и SDK для старих native-схем залишаються експортованими для наявних
сторонніх plugins, але нові plugins не мають їх використовувати.

## Визначення цілі каналу

Plugins каналів мають володіти канально-специфічною семантикою цілей. Залишайте спільний
вихідний хост узагальненим і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` визначає, чи слід трактувати нормалізовану ціль
  як `direct`, `group` або `channel` до пошуку в директорії.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи має
  вхідне значення одразу переходити до визначення id-подібної цілі замість пошуку в директорії.
- `messaging.targetResolver.resolveTarget(...)` — це резервний шлях plugin, коли
  ядру потрібне остаточне визначення, що належить провайдеру, після нормалізації або
  після промаху по директорії.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту вихідної сесії,
  специфічною для провайдера, після того як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорії, які мають ухвалюватися до
  пошуку peers/groups.
- Використовуйте `looksLikeId` для перевірок на кшталт «трактувати це як явний/native id цілі».
- Використовуйте `resolveTarget` для резервного шляху нормалізації, специфічного для провайдера, а не для
  широкого пошуку в директорії.
- Зберігайте native-id провайдера, як-от id чату, id потоку, JID, handles та room id,
  всередині значень `target` або параметрів, специфічних для провайдера, а не в загальних полях SDK.

## Директорії на основі конфігурації

Plugins, які отримують записи директорії з конфігурації, мають зберігати цю логіку в
plugin і повторно використовувати спільні helper-и з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, наприклад:

- DM-peers, керовані allowlist
- налаштовані мапи каналів/груп
- статичні резервні шляхи директорії в межах облікового запису

Спільні helper-и в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування ліміту
- helper-и дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікового запису та нормалізація id, специфічні для каналу, мають залишатися
в реалізації plugin.

## Каталоги провайдерів

Plugins провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли plugin володіє специфічними для провайдера id моделей, типовими значеннями `base URL`
або метаданими моделей, захищеними auth.

`catalog.order` визначає, коли каталог plugin зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери з API-ключем або на основі env
- `profile`: провайдери, що з’являються, коли існують профілі auth
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдера
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі конфлікту ключів, тож plugins можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` і далі працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Лише читання для перевірки каналу

Якщо ваш plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поруч із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і може швидко завершуватися з помилкою, коли обов’язкові секрети відсутні.
- Шляхи команд лише для читання, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` та потоки
  repair doctor/config, не повинні матеріалізовувати runtime-облікові дані лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- За потреби включає поля джерела/статусу облікових даних, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення токенів лише для звітування про доступність у режимі лише читання. Для команд на кшталт status достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела).
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

## Пакети пакетів

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

Кожен запис стає plugin. Якщо пакет перелічує кілька extensions, id plugin
стає `name/<fileBase>`.

Якщо ваш plugin імпортує npm-залежності, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися в межах каталогу plugin
після розв’язання symlink. Записи, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності plugin через
локальний для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies у runtime), ігноруючи успадковані глобальні налаштування npm install.
Підтримуйте дерева залежностей plugin «чистими JS/TS» і уникайте пакетів, яким потрібні
збірки через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує поверхонь setup для вимкненого channel plugin, або
коли channel plugin увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу plugin. Це робить запуск і setup легшими,
коли основна точка входу plugin також підключає інструменти, хуки або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести channel plugin на той самий шлях `setupEntry` під час
передслухової фази запуску gateway, навіть якщо канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що точка входу setup
має реєструвати всі можливості, що належать каналу, від яких залежить запуск, наприклад:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне слухати
- будь-які методи gateway, інструменти або сервіси, які мають існувати впродовж того самого вікна

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залиште plugin на типовій поведінці й дозвольте OpenClaw завантажувати
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати helper-и поверхні контракту лише для setup, які ядро
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути застарілу
конфігурацію однокористувацького каналу в `channels.<id>.accounts.*` без
завантаження повної точки входу plugin. Поточний вбудований приклад — Matrix:
він переносить у просунутий іменований обліковий запис лише ключі auth/bootstrap,
коли іменовані облікові записи вже існують, і може зберегти налаштований
неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери patch setup зберігають ліниве виявлення поверхні контракту для вбудованих компонентів. Час
імпорту залишається малим; поверхня просування завантажується лише під час першого використання
замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску включають Gateway RPC-методи, тримайте їх на
префіксі, специфічному для plugin. Простори імен адміністратора ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо plugin запитує вужчу область.

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

### Метадані каталогу каналу

Plugins каналів можуть оголошувати метадані setup/discovery через `openclaw.channel` та
підказки встановлення через `openclaw.install`. Це дозволяє не зберігати дані в каталозі ядра.

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

Корисні поля `openclaw.channel` понад мінімальний приклад:

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/статусу
- `docsLabel`: перевизначення тексту посилання для посилання на документацію
- `preferOver`: id plugin/каналу з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний з markdown для рішень щодо форматування вихідних повідомлень
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору setup/configure, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документацією
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комами/крапками з комою/через `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів відкривають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Ці
нормалізовані факти визначають, чи є npm-специфікація точною версією або плаваючим селектором,
чи присутні очікувані метадані цілісності та чи доступний також локальний шлях джерела.
Коли відома ідентичність каталогу/пакета, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності.
Вони також попереджають, коли `defaultChoice` є недійсним або вказує на джерело, яке
недоступне, а також коли метадані цілісності npm присутні без дійсного npm-
джерела. Споживачі мають ставитися до `installSource` як до додаткового необов’язкового поля, щоб
вручну створені записи й shim-и каталогів не мусили його синтезувати.
Це дає змогу онбордингу та діагностиці пояснювати стан площини джерела без
імпорту runtime plugin.

Офіційні зовнішні npm-записи мають надавати перевагу точному `npmSpec` разом із
`expectedIntegrity`. Голі назви пакетів і dist-tag-и все ще працюють для
сумісності, але вони показують попередження площини джерела, щоб каталог міг рухатися
до pinned- та integrity-checked-встановлень без порушення роботи наявних plugins.
Коли онбординг встановлює з локального шляху каталогу, він записує керований plugin
у запис індексу plugin із `source: "path"` і workspace-відносним
`sourcePath`, коли це можливо. Абсолютний робочий шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання шляхів локальної робочої станції
в довготривалій конфігурації. Це зберігає видимість локальних розробницьких встановлень для
діагностики площини джерела без додавання другої поверхні розкриття сирих шляхів файлової системи.
Збережений індекс plugin `plugins/installs.json` є джерелом істини для встановлення й може
оновлюватися без завантаження runtime-модулів plugin.
Його мапа `installRecords` є довговічною, навіть коли маніфест plugin відсутній або
недійсний; його масив `plugins` — це перебудовуваний вигляд маніфесту/кешу.

## Plugins рушія контексту

Plugins рушія контексту володіють оркестрацією контексту сесії для ingеst, assembly
і Compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам’яті чи хуки.

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

Коли plugin потрібна поведінка, яка не вписується в поточний API, не обходьте
систему plugin через приватне пряме звернення. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політикою, резервним шляхом, злиттям конфігурації,
   життєвим циклом, семантикою для каналів і формою runtime-helper-а.
2. додайте типізовані поверхні реєстрації/runtime для plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть ядро + споживачів каналів/функцій
   Канали та plugins функцій мають використовувати нову можливість через ядро,
   а не імпортувати реалізацію вендора напряму.
4. зареєструйте реалізації вендорів
   Потім plugins вендорів реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб з часом володіння та форма реєстрації залишалися явними.

Саме так OpenClaw залишається думкоцентричним, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Кулінарну книгу можливостей](/uk/plugins/architecture),
щоб отримати конкретний перелік файлів і розгорнутий приклад.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом зачіпати такі
поверхні:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/runtime-helper ядра в `src/<capability>/runtime.ts`
- поверхню реєстрації API plugin в `src/plugins/types.ts`
- підключення реєстру plugin в `src/plugins/registry.ts`
- відкриття runtime plugin в `src/plugins/runtime/*`, коли plugins функцій/каналів
  мають її використовувати
- helper-и capture/test в `src/test-utils/plugin-registration.ts`
- твердження володіння/контракту в `src/plugins/contracts/registry.ts`
- документацію для операторів/plugin у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
ще не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// контракт ядра
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// спільний runtime-helper для plugins функцій/каналів
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

- ядро володіє контрактом можливості + оркестрацією
- plugins вендорів володіють реалізаціями вендорів
- plugins функцій/каналів використовують runtime-helper-и
- тести контракту зберігають явність володіння

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель і форми можливостей
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
