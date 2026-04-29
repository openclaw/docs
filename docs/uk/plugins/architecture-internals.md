---
read_when:
    - Реалізація хуків середовища виконання провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні механізми архітектури Plugin: конвеєр завантаження, реєстр, хуки часу виконання, HTTP-маршрути та довідкові таблиці'
title: Внутрішні аспекти архітектури Plugin
x-i18n:
    generated_at: "2026-04-29T01:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c1167edfe84782c735fa8f22e25e14728c64289b63774a6c9730fecace7cc1a
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публічної моделі можливостей, форм плагінів і контрактів власності/виконання див. [архітектуру Plugin](/uk/plugins/architecture). Ця сторінка є довідником із внутрішніх механізмів: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє кандидатські корені плагінів
2. читає нативні або сумісні маніфести bundle і метадані пакета
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію плагінів (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає ввімкнення для кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані bundled-модулі використовують нативний завантажувач;
   незібрані нативні плагіни використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстрі плагінів
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі bundled-плагіни використовують `register`; для нових плагінів віддавайте перевагу `register`.
</Note>

Запобіжні перевірки відбуваються **до** runtime-виконання. Кандидати блокуються,
коли entry виходить за межі кореня плагіна, шлях доступний для запису всім або
власність шляху виглядає підозрілою для небандлованих плагінів.

### Поведінка за пріоритетом маніфесту

Маніфест є джерелом істини для control-plane. OpenClaw використовує його, щоб:

- ідентифікувати плагін
- виявити оголошені канали/skills/схему конфігурації або можливості bundle
- перевірити `plugins.entries.<id>.config`
- доповнити мітки/заповнювачі Control UI
- показати метадані встановлення/каталогу
- зберегти дешеві дескриптори активації та налаштування без завантаження runtime плагіна

Для нативних плагінів runtime-модуль є data-plane частиною. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або provider-потоки.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на control plane.
Це лише метадані-дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші живі споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і providers,
щоб звузити завантаження плагінів перед ширшою матеріалізацією реєстру:

- завантаження CLI звужується до плагінів, які володіють запитаною основною командою
- setup/розв’язання плагіна каналу звужується до плагінів, які володіють запитаним
  id каналу
- явне setup/runtime-розв’язання provider звужується до плагінів, які володіють
  запитаним id provider
- планування запуску Gateway використовує `activation.onStartup` для явних startup
  imports і відмов від запуску; кожен плагін має оголошувати це, оскільки OpenClaw
  відходить від неявних startup imports, тоді як плагіни без статичних
  метаданих можливостей і без `activation.onStartup` досі використовують
  застарілий неявний sidecar fallback запуску для сумісності

Планувальник активації відкриває і API лише з ids для наявних викликачів, і
plan API для нової діагностики. Записи плану повідомляють, чому плагін було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від fallback на основі володіння маніфестом,
такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Такий поділ причин є межею сумісності:
наявні метадані плагінів продовжують працювати, а новий код може виявляти широкі підказки
або fallback-поведінку без зміни семантики runtime-завантаження.

Виявлення setup тепер віддає перевагу id, якими володіє дескриптор, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити кандидатські плагіни перед fallback до
`setup-api` для плагінів, яким досі потрібні runtime-хуки під час setup. Списки
provider setup використовують маніфест `providerAuthChoices`, отримані з дескриптора setup
choices і метадані install-catalog без завантаження runtime provider. Явне
`setup.requiresRuntime: false` є descriptor-only відсіченням; пропущене
`requiresRuntime` зберігає застарілий fallback setup-api для сумісності. Якщо більш
ніж один виявлений плагін заявляє той самий нормалізований setup provider або id CLI
backend, setup lookup відмовляється від неоднозначного власника замість того, щоб покладатися на
порядок виявлення. Коли runtime setup все ж виконується, діагностика реєстру повідомляє
розбіжності між `setup.providers` / `setup.cliBackends` і providers або CLI
backends, зареєстрованими setup-api, не блокуючи застарілі плагіни.

### Що кешує завантажувач

OpenClaw зберігає короткі in-process кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів плагінів

Ці кеші зменшують навантаження під час вибухових запусків і повторних команд. Їх безпечно
розглядати як короткоживучі кеші продуктивності, а не як персистентне сховище.

Гарячі шляхи запуску Gateway мають віддавати перевагу поточному `PluginMetadataSnapshot`,
похідній `PluginLookUpTable` або явному реєстру маніфестів, переданому через
ланцюжок викликів. Перевірка конфігурації, автоматичне ввімкнення під час запуску та bootstrap плагінів використовують
той самий snapshot, коли він доступний. Для викликачів, які досі перебудовують метадані
маніфестів зі збереженого індексу встановлених плагінів, OpenClaw також тримає невеликий
обмежений fallback-кеш, ключований індексом встановлених плагінів, формою запиту, політикою
конфігурації, runtime roots і сигнатурами файлів маніфесту/пакета. Цей кеш є лише
fallback для повторної реконструкції installed-index; це не mutable runtime
реєстр плагінів.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Установіть `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1`, щоб вимкнути
  лише fallback-кеш реєстру маніфестів installed-index.
- Налаштовуйте вікна кешу за допомогою `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені плагіни не мутують напряму випадкові глобальні змінні core. Вони реєструються в
центральному реєстрі плагінів.

Реєстр відстежує:

- записи плагінів (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки та типізовані хуки
- канали
- providers
- обробники RPC Gateway
- HTTP-маршрути
- CLI-реєстратори
- фонові служби
- команди, якими володіє плагін

Потім core-функції читають із цього реєстру замість того, щоб напряму звертатися до модулів плагінів.
Це зберігає завантаження односпрямованим:

- модуль плагіна -> реєстрація в реєстрі
- runtime core -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості core-поверхонь потрібна лише
одна інтеграційна точка: "прочитати реєстр", а не "обробляти кожен модуль плагіна окремим випадком".

## Колбеки прив’язки розмови

Плагіни, які прив’язують розмову, можуть реагувати, коли approval розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після схвалення
або відхилення запиту на bind:

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
- `binding`: розв’язана прив’язка для схвалених запитів
- `request`: початковий summary запиту, detach hint, sender id і
  метадані розмови

Цей callback є лише сповіщенням. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення core-обробки approval.

## Runtime-хуки provider

Provider-плагіни мають три шари:

- **Метадані маніфесту** для дешевого pre-runtime lookup:
  `setup.providers[].envVars`, застарілий сумісний `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Config-time хуки**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, model resolution,
  stream wrapping, thinking levels, replay policy і usage endpoints. Див.
  повний список у розділі [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw досі володіє generic agent loop, failover, обробкою transcript і
tool policy. Ці хуки є extension-поверхнею для provider-specific
поведінки без потреби в цілому custom inference transport.

Використовуйте маніфест `setup.providers[].envVars`, коли provider має облікові дані на основі env,
які generic auth/status/model-picker шляхи мають бачити без
завантаження runtime плагіна. Застарілий `providerAuthEnvVars` досі читається
compatibility adapter під час deprecation window, а небандловані плагіни,
які його використовують, отримують діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`,
коли один provider id має повторно використовувати env vars, auth profiles,
config-backed auth і API-key onboarding choice іншого provider id. Використовуйте маніфест
`providerAuthChoices`, коли onboarding/auth-choice CLI-поверхні мають знати
choice id provider, group labels і просте one-flag auth wiring без
завантаження runtime provider. Залишайте runtime provider
`envVars` для підказок, орієнтованих на оператора, таких як onboarding labels або OAuth
client-id/client-secret setup vars.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або setup на основі env, які
generic shell-env fallback, config/status checks або setup prompts мають бачити
без завантаження runtime каналу.

### Порядок хуків і використання

Для model/provider плагінів OpenClaw викликає хуки приблизно в такому порядку.
Стовпець "Коли використовувати" — це короткий посібник із вибору.

| #   | Хук                               | Що робить                                                                                                     | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                         | Провайдер володіє каталогом або типовими значеннями базового URL                                                                              |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму автентифікації, середовища або семантики сімейства моделей провайдера                                     |
| --  | _(вбудований пошук моделі)_       | OpenClaw спершу пробує звичайний шлях реєстру/каталогу                                                        | _(не хук Plugin)_                                                                                                                             |
| 3   | `normalizeModelId`                | Нормалізує застарілі або попередні псевдоніми ідентифікаторів моделей перед пошуком                           | Провайдер володіє очищенням псевдонімів перед канонічним розв’язанням моделі                                                                 |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі                            | Провайдер володіє очищенням транспорту для власних ідентифікаторів провайдерів у тому самому транспортному сімействі                         |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв’язанням середовища виконання/провайдера                         | Провайдеру потрібне очищення конфігурації, яке має жити разом із Plugin; вбудовані помічники сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування нативного потокового використання до провайдерів конфігурації                | Провайдеру потрібні виправлення метаданих нативного потокового використання, керовані кінцевою точкою                                         |
| 7   | `resolveConfigApiKey`             | Розв’язує автентифікацію з env-маркером для провайдерів конфігурації перед завантаженням runtime-автентифікації | Провайдер має власне розв’язання API-ключа з env-маркером; `amazon-bedrock` також має тут вбудований розв’язувач env-маркера AWS             |
| 8   | `resolveSyntheticAuth`            | Виводить локальну/самостійно розміщену або підтриману конфігурацією автентифікацію без збереження відкритого тексту | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі автентифікації, що належать провайдеру; типовий `persistence` — `runtime-only` для облікових даних, що належать CLI/застосунку | Провайдер повторно використовує зовнішні облікові дані автентифікації без збереження скопійованих refresh-токенів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних заповнювачів профілів за автентифікацією на основі середовища/конфігурації | Провайдер зберігає синтетичні профілі-заповнювачі, які не мають перемагати за пріоритетом                                                     |
| 11  | `resolveDynamicModel`             | Синхронний запасний варіант для ідентифікаторів моделей, що належать провайдеру й ще не є в локальному реєстрі | Провайдер приймає довільні ідентифікатори моделей від upstream                                                                                |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після якого `resolveDynamicModel` запускається знову                                     | Провайдеру потрібні мережеві метадані перед розв’язанням невідомих ідентифікаторів                                                            |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає розв’язану модель                            | Провайдеру потрібні переписування транспорту, але він усе ще використовує core-транспорт                                                     |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для моделей постачальника за іншим сумісним транспортом                              | Провайдер розпізнає власні моделі на проксі-транспортах без перебрання провайдера                                                            |
| 15  | `capabilities`                    | Метадані транскрипту/інструментів, що належать провайдеру й використовуються спільною core-логікою            | Провайдеру потрібні особливості транскрипту/сімейства провайдера                                                                              |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів перед тим, як їх побачить вбудований runner                                     | Провайдеру потрібне очищення схем транспортного сімейства                                                                                     |
| 17  | `inspectToolSchemas`              | Виводить діагностику схем, що належить провайдеру, після нормалізації                                         | Провайдер хоче попередження щодо ключових слів без навчання core правилам, специфічним для провайдера                                        |
| 18  | `resolveReasoningOutputMode`      | Вибирає нативний або тегований контракт виводу міркування                                                     | Провайдеру потрібне теговане міркування/фінальний вивід замість нативних полів                                                                |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками потокових опцій                                    | Провайдеру потрібні типові параметри запиту або очищення параметрів для окремого провайдера                                                  |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку власним транспортом                                                    | Провайдеру потрібен власний wire-протокол, а не лише обгортка                                                                                 |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                         | Провайдеру потрібні обгортки сумісності заголовків/тіла/моделі запиту без власного транспорту                                                 |
| 22  | `resolveTransportTurnState`       | Додає нативні транспортні заголовки або метадані для кожного ходу                                             | Провайдер хоче, щоб загальні транспорти надсилали нативну ідентичність ходу провайдера                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Додає нативні заголовки WebSocket або політику охолодження сесії                                              | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику запасного варіанта                                     |
| 24  | `formatApiKey`                    | Форматувач профілю автентифікації: збережений профіль стає runtime-рядком `apiKey`                            | Провайдер зберігає додаткові метадані автентифікації й потребує власної форми runtime-токена                                                  |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних кінцевих точок оновлення або політики збоїв оновлення              | Провайдер не вписується у спільні оновлювачі `pi-ai`                                                                                          |
| 26  | `buildAuthDoctorHint`             | Підказка з відновлення, що додається, коли оновлення OAuth завершується збоєм                                 | Провайдеру потрібні власні настанови з відновлення автентифікації після збою оновлення                                                        |
| 27  | `matchesContextOverflowError`     | Матчер переповнення контекстного вікна, що належить провайдеру                                                | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                  |
| 28  | `classifyFailoverReason`          | Класифікація причини failover, що належить провайдеру                                                         | Провайдер може зіставляти сирі помилки API/транспорту з обмеженням швидкості/перевантаженням тощо                                             |
| 29  | `isCacheTtlEligible`              | Політика кешу підказок для проксі/backhaul-провайдерів                                                       | Провайдеру потрібне специфічне для проксі керування придатністю TTL кешу                                                                      |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення в разі відсутньої автентифікації                                   | Провайдеру потрібна специфічна для провайдера підказка відновлення відсутньої автентифікації                                                  |
| 31  | `suppressBuiltInModel`            | Застаріло. Runtime-хук більше не викликається; використовуйте `modelCatalog.suppressions` у маніфесті         | Історичний хук для приховування застарілих upstream-рядків; зберігайте нові дані приглушення в маніфесті Plugin                              |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, що додаються після виявлення                                              | Провайдеру потрібні синтетичні рядки forward-сумісності в `models list` і засобах вибору                                                      |
| 33  | `resolveThinkingProfile`          | Специфічний для моделі набір рівнів `/think`, відображувані мітки та типове значення                          | Провайдер відкриває власну драбину мислення або бінарну мітку для вибраних моделей                                                           |
| 34  | `isBinaryThinking`                | Хук сумісності перемикача міркування увімкнено/вимкнено                                                       | Провайдер відкриває лише бінарне мислення увімкнено/вимкнено                                                                                  |
| 35  | `supportsXHighThinking`           | Хук сумісності підтримки міркування `xhigh`                                                                   | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності типового рівня `/think`                                                                        | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                            |
| 37  | `isModernModelRef`                | Зіставлювач сучасних моделей для фільтрів live-профілю та вибору smoke                                         | Провайдер керує зіставленням бажаних моделей для live/smoke                                                                                   |
| 38  | `prepareRuntimeAuth`              | Обміняти налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед інференсом              | Провайдеру потрібен обмін токена або короткочасні облікові дані запиту                                                                        |
| 39  | `resolveUsageAuth`                | Визначити облікові дані використання/білінгу для `/usage` і пов’язаних поверхонь статусу                       | Провайдеру потрібен власний розбір токенів використання/квот або інші облікові дані використання                                              |
| 40  | `fetchUsageSnapshot`              | Отримати й нормалізувати специфічні для провайдера знімки використання/квот після визначення автентифікації    | Провайдеру потрібна специфічна для нього кінцева точка використання або парсер payload                                                        |
| 41  | `createEmbeddingProvider`         | Створити керований провайдером адаптер вбудовувань для пам’яті/пошуку                                          | Поведінка вбудовувань пам’яті належить Plugin провайдера                                                                                      |
| 42  | `buildReplayPolicy`               | Повернути політику повторного відтворення, що керує обробкою транскрипту для провайдера                        | Провайдеру потрібна власна політика транскрипту (наприклад, видалення блоків міркування)                                                      |
| 43  | `sanitizeReplayHistory`           | Переписати історію повторного відтворення після загального очищення транскрипту                                | Провайдеру потрібні специфічні для нього переписування повторного відтворення поза спільними допоміжними засобами Compaction                  |
| 44  | `validateReplayTurns`             | Остаточна перевірка або переформування кроків повторного відтворення перед вбудованим runner                   | Транспорту провайдера потрібна суворіша перевірка кроків після загальної санітизації                                                          |
| 45  | `onModelSelected`                 | Виконати керовані провайдером побічні ефекти після вибору                                                      | Провайдеру потрібна телеметрія або керований провайдером стан, коли модель стає активною                                                      |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спершу перевіряють
відповідний provider plugin, а потім переходять до інших provider plugins із
підтримкою хуків, доки один із них фактично не змінить model id або transport/config. Це зберігає
працездатність alias/compat provider shims без вимоги до викликача знати, який
вбудований plugin відповідає за переписування. Якщо жоден provider hook не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно застосує
це суміснісне очищення.

Якщо provider потребує повністю власного wire protocol або власного request executor,
це інший клас розширення. Ці хуки призначені для поведінки provider,
яка все ще працює у звичайному inference loop OpenClaw.

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

Вбудовані provider plugins поєднують наведені вище хуки, щоб відповідати потребам кожного постачальника щодо catalog,
auth, thinking, replay і usage. Авторитетний набір хуків міститься в
кожному plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Provider із наскрізним catalog">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб показувати upstream
    model ids раніше за статичний catalog OpenClaw.
  </Accordion>
  <Accordion title="Provider з OAuth і usage endpoint">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` із `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти token exchange та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають providers змогу підключатися до
    transcript policy через `buildReplayPolicy`, замість того щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Provider лише з catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний inference loop.
  </Accordion>
  <Accordion title="Специфічні для Anthropic stream helpers">
    Beta headers, `/fast` / `serviceTier` і `context1m` містяться всередині
    публічної межі `api.ts` / `contract-api.ts` Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    generic SDK.
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

- `textToSpeech` повертає звичайний core TTS output payload для поверхонь файлів/голосових нотаток.
- Використовує core-конфігурацію `messages.tts` і вибір provider.
- Повертає PCM audio buffer + sample rate. Plugins мають виконувати resample/encode для providers.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для vendor-owned voice pickers або setup flows.
- Списки голосів можуть містити багатші metadata, як-от locale, gender і personality tags для provider-aware pickers.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft не підтримує.

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

- Залишайте TTS policy, fallback і reply delivery у core.
- Використовуйте speech providers для vendor-owned synthesis behavior.
- Legacy Microsoft `edge` input нормалізується до provider id `microsoft`.
- Бажана модель ownership орієнтована на компанію: один vendor plugin може володіти
  text, speech, image і майбутніми media providers у міру того, як OpenClaw додає ці
  capability contracts.

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

- Залишайте orchestration, fallback, config і channel wiring у core.
- Залишайте vendor behavior у provider plugin.
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
  image/audio/video understanding.
- Використовує core-конфігурацію media-understanding audio (`tools.media.audio`) і порядок fallback для provider.
- Повертає `{ text: undefined }`, коли transcription output не створено (наприклад, skipped/unsupported input).
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
- Для plugin-owned fallback runs operators мають увімкнути `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити trusted plugins конкретними canonical targets `provider/model`, або `"*"`, щоб явно дозволити будь-яку target.
- Untrusted plugin subagent runs усе ще працюють, але override requests відхиляються, а не мовчки falling back.
- Створені plugin subagent sessions позначаються id plugin, який їх створив. Fallback `api.runtime.subagent.deleteSession(...)` може видаляти лише ці owned sessions; довільне видалення session все ще потребує admin-scoped Gateway request.

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

- Залишайте provider selection, credential resolution і shared request semantics у core.
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

- `generate(...)`: згенерувати зображення за допомогою налаштованого image-generation provider chain.
- `listProviders(...)`: перелічити доступні image-generation providers та їхні capabilities.

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

Поля route:

- `path`: route path під HTTP server Gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайний gateway auth, або `"plugin"` для plugin-managed auth/webhook verification.
- `match`: необов’язкове. `"exact"` (за замовчуванням) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну route registration.
- `handler`: поверніть `true`, коли route обробив request.

Примітки:

- `api.registerHttpHandler(...)` було вилучено й спричинятиме помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти з точним `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один плагін не може замінити маршрут іншого плагіна.
- Маршрути, що перекриваються, з різними рівнями `auth` відхиляються. Тримайте ланцюжки резервного переходу `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично операторські runtime-області. Вони призначені для керованих плагіном webhooks/перевірки підпису, а не для привілейованих викликів допоміжних функцій Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime-області запиту Gateway, але ця область навмисно консервативна:
  - автентифікація bearer за спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-області маршрутів Plugin закріпленими за `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах до маршруту Plugin з ідентичністю, runtime-область повертається до `operator.write`
- Практичне правило: не вважайте маршрут Plugin із gateway-auth неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого barrel `openclaw/plugin-sdk` під час створення нових плагінів. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби для входу/побудови каналу         |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та umbrella-контракт |
| `openclaw/plugin-sdk/config-schema` | Коренева Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальні плагіни вибирають із сімейства вузьких стиків — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку схвалення слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між непов’язаними
полями плагіна. Див. [Канальні плагіни](/uk/plugins/sdk-channel-plugins).

Runtime- і конфігураційні допоміжні засоби розміщені у відповідних сфокусованих підшляхах
`*-runtime` (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` тощо). Надавайте перевагу `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation`
замість широкого сумісного barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
і `openclaw/plugin-sdk/infra-runtime` є застарілими сумісними shim для
старіших плагінів. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного вбудованого пакета плагіна):

- `index.js` — точка входу вбудованого плагіна
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup-плагіна

Зовнішні плагіни мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета плагіна з core або з іншого плагіна.
Точки входу, завантажені через facade, надають перевагу активному runtime-знімку
конфігурації, коли він існує, а потім повертаються до розв’язного файлу
конфігурації на диску.

Підшляхи для конкретних capability, як-от `image-generation`, `media-understanding`
і `speech`, існують тому, що вбудовані плагіни використовують їх сьогодні. Вони
не є автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте
відповідну довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Плагіни мають володіти канально-специфічними внесками до схеми
`describeMessageTool(...)` для непризначених для повідомлень примітивів, як-от
реакції, прочитання й опитування. Спільне подання надсилання має використовувати
загальний контракт `MessagePresentation` замість provider-native полів кнопок,
компонентів, блоків або карток. Див. [Подання повідомлень](/uk/plugins/message-presentation)
щодо контракту, правил fallback, мапінгу провайдерів і checklist автора плагіна.

Плагіни з можливістю надсилання оголошують, що вони можуть відтворювати, через можливості повідомлень:

- `presentation` для семантичних блоків подання (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Core вирішує, чи відтворювати подання нативно, чи деградувати його до тексту.
Не відкривайте provider-native UI escape hatch із загального інструмента повідомлень.
Застарілі допоміжні засоби SDK для legacy нативних схем залишаються експортованими
для наявних сторонніх плагінів, але нові плагіни не мають їх використовувати.

## Розв’язання цілей каналу

Канальні плагіни мають володіти канально-специфічною семантикою цілей. Тримайте
спільний outbound host загальним і використовуйте поверхню messaging-адаптера
для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` перед пошуком у каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  має вхідне значення одразу перейти до id-like розв’язання замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` є fallback плагіна, коли
  core потребує остаточного розв’язання, яким володіє провайдер, після нормалізації
  або після промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє provider-specific побудовою
  маршруту сесії після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають
  відбутися перед пошуком peers/groups.
- Використовуйте `looksLikeId` для перевірок "трактувати це як явний/нативний id цілі".
- Використовуйте `resolveTarget` для provider-specific fallback нормалізації, а не
  для широкого пошуку в каталозі.
- Тримайте provider-native id, як-от chat ids, thread ids, JIDs, handles і room
  ids, усередині значень `target` або provider-specific params, а не в загальних
  полях SDK.

## Каталоги на основі конфігурації

Плагіни, які виводять записи каталогу з конфігурації, мають тримати цю логіку
в плагіні й повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, як-от:

- DM peers на основі allowlist
- налаштовані мапи channel/group
- account-scoped статичні fallback каталогу

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування ліміту
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Канально-специфічна інспекція облікового запису та нормалізація id мають
залишатися в реалізації плагіна.

## Каталоги провайдерів

Плагіни провайдерів можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли плагін володіє provider-specific id моделей,
типовими значеннями базового URL або auth-gated метаданими моделей.

`catalog.order` керує тим, коли каталог плагіна зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери, керовані API-ключем або env
- `profile`: провайдери, що з’являються, коли існують профілі auth
- `paired`: провайдери, що синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі колізії ключів, тож плагіни можуть
навмисно перевизначати вбудований запис провайдера з тим самим provider id.

Сумісність:

- `discovery` досі працює як legacy alias
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Read-only інспекція каналу

Якщо ваш плагін реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Йому дозволено припускати, що облікові
  дані повністю матеріалізовані, і він може швидко завершитися з помилкою, коли
  потрібні secrets відсутні.
- Read-only командні шляхи, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також doctor/config
  repair flows, не повинні матеріалізувати runtime-облікові дані лише для опису
  конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/статусу облікових даних, коли доречно, як-от:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для повідомлення про
  read-only доступність. Повернути `tokenStatus: "available"` (і відповідне
  поле джерела) достатньо для status-style команд.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовані через SecretRef,
  але недоступні в поточному командному шляху.

Це дає read-only командам змогу повідомляти "налаштовано, але недоступно в цьому
командному шляху" замість аварійного завершення або хибного повідомлення, що
обліковий запис не налаштований.

## Пакети пакетів

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

Кожен запис стає плагіном. Якщо pack перелічує кілька extensions, id плагіна
стає `name/<fileBase>`.

Якщо ваш плагін імпортує npm deps, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися
всередині каталогу плагіна після розв’язання symlink. Записи, що виходять за
межі каталогу пакета, відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності плагіна
через project-local `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev dependencies у runtime), ігноруючи успадковані глобальні налаштування npm install.
Тримайте дерева залежностей плагіна "pure JS/TS" і уникайте пакетів, які потребують
`postinstall` builds.

Опційно: `openclaw.setupEntry` може вказувати на легкий setup-only модуль.
Коли OpenClaw потребує setup-поверхонь для вимкненого канального плагіна або
коли канальний плагін увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу плагіна. Це полегшує startup і setup,
коли ваша основна точка входу плагіна також під’єднує інструменти, hooks або інший
runtime-only код.

Опційно: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести канальний плагін на той самий шлях `setupEntry` під час pre-listen
startup-фази gateway, навіть коли канал уже налаштований.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває startup-поверхню,
яка має існувати до того, як gateway почне слухати. На практиці це означає, що
setup entry має зареєструвати кожну capability, якою володіє канал і від якої
залежить startup, як-от:

- сама реєстрація каналу
- будь-які HTTP-маршрути, що мають бути доступні до того, як gateway почне слухати
- будь-які gateway methods, tools або services, що мають існувати в цьому самому вікні

Якщо ваша повна точка входу досі володіє будь-якою потрібною startup capability,
не вмикайте цей прапорець. Залиште плагін на типовій поведінці й дозвольте
OpenClaw завантажити повну точку входу під час startup.

Вбудовані канали також можуть публікувати setup-only допоміжні засоби поверхні
контракту, до яких core може звертатися до завантаження повного runtime каналу.
Поточна поверхня promotion для setup:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного запису Plugin.
Matrix — поточний вбудований приклад: він переносить лише ключі автентифікації/початкового налаштування до іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і може зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати `accounts.default`.

Ці адаптери патчів налаштування зберігають виявлення вбудованої контрактної поверхні лінивим. Час імпорту залишається легким; поверхня просування завантажується лише під час першого використання, замість повторного входу в запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску містять методи Gateway RPC, тримайте їх на префіксі, специфічному для Plugin. Простори імен адміністрування Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до `operator.admin`, навіть якщо Plugin запитує вужчу область дії.

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

Plugins каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і підказки встановлення через `openclaw.install`. Це зберігає основний каталог без даних.

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
- `preferOver`: ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як здатний до markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховати канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховати канал з інтерактивних засобів вибору налаштування/конфігурації, коли встановлено `false`
- `exposure.docs`: позначити канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключити канал до стандартного потоку швидкого старту `allowFrom`
- `forceAccountBinding`: вимагати явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надавати перевагу пошуку сеансу під час розв’язання цілей оголошення

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на один чи кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл має містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів надають нормалізовані факти джерела встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані факти визначають, чи є специфікація npm точною версією або плаваючим селектором, чи присутні очікувані метадані цілісності, і чи також доступний локальний шлях джерела. Коли відома ідентичність каталогу/пакета, нормалізовані факти попереджають, якщо розібране ім’я npm-пакета відхиляється від цієї ідентичності. Вони також попереджають, коли `defaultChoice` недійсний або вказує на недоступне джерело, а також коли метадані цілісності npm присутні без чинного джерела npm. Споживачі мають розглядати `installSource` як додаткове необов’язкове поле, щоб записи, створені вручну, і прокладки каталогів не мусили його синтезувати.
Це дає змогу онбордингу та діагностиці пояснювати стан площини джерел без імпорту середовища виконання Plugin.

Офіційні зовнішні записи npm мають надавати перевагу точному `npmSpec` разом з `expectedIntegrity`. Голі імена пакетів і dist-tags усе ще працюють для сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися до закріплених встановлень із перевіркою цілісності без поломки наявних plugins.
Коли онбординг встановлює з локального шляху каталогу, він записує керований запис індексу Plugin з `source: "path"` і відносним до робочого простору `sourcePath`, коли це можливо. Абсолютний операційний шлях завантаження залишається в `plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів робочої станції в довготривалу конфігурацію. Це зберігає локальні встановлення для розробки видимими для діагностики площини джерел без додавання другої поверхні розкриття сирого шляху файлової системи. Збережений індекс Plugin `plugins/installs.json` є джерелом істини встановлення й може оновлюватися без завантаження модулів середовища виконання Plugin.
Його мапа `installRecords` є довговічною навіть тоді, коли маніфест Plugin відсутній або недійсний; його масив `plugins` є відновлюваним поданням маніфесту/кешу.

## Plugins рушія контексту

Plugins рушія контексту відповідають за оркестрацію контексту сеансу для приймання, складання та Compaction. Зареєструйте їх зі свого Plugin через `api.registerContextEngine(id, factory)`, а потім виберіть активний рушій за допомогою `plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити стандартний конвеєр контексту, а не просто додати пошук у пам’яті чи хуки.

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

Коли Plugin потребує поведінки, яка не вписується в поточний API, не обходьте систему Plugin приватним проникненням усередину. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: політика, резервний варіант, злиття конфігурації, життєвий цикл, семантика для каналів і форма допоміжних засобів середовища виконання.
2. додайте типізовані поверхні реєстрації/середовища виконання Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною типізованою поверхнею можливості.
3. під’єднайте core + споживачів каналів/функцій
   Канали та функціональні plugins мають споживати нову можливість через core, а не імпортувати реалізацію постачальника напряму.
4. зареєструйте реалізації постачальників
   Потім plugins постачальників реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб власність і форма реєстрації з часом залишалися явними.

Так OpenClaw залишається принциповим, не стаючи жорстко прив’язаним до світогляду одного провайдера. Дивіться [Кулінарну книгу можливостей](/uk/plugins/architecture) для конкретного контрольного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має охоплювати ці поверхні разом:

- типи контракту core в `src/<capability>/types.ts`
- допоміжний засіб запуску/середовища виконання core в `src/<capability>/runtime.ts`
- поверхню реєстрації API Plugin в `src/plugins/types.ts`
- підключення реєстру Plugin в `src/plugins/registry.ts`
- експозицію середовища виконання Plugin в `src/plugins/runtime/*`, коли функціональним/канальним plugins потрібно її споживати
- допоміжні засоби захоплення/тестування в `src/test-utils/plugin-registration.ts`
- твердження щодо власності/контракту в `src/plugins/contracts/registry.ts`
- документацію оператора/Plugin в `docs/`

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

- core володіє контрактом можливості + оркестрацією
- plugins постачальників володіють реалізаціями постачальників
- функціональні/канальні plugins споживають допоміжні засоби середовища виконання
- контрактні тести зберігають власність явною

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
