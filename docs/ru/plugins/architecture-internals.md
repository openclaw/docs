---
read_when:
    - Реализация runtime-хуков провайдера, жизненного цикла канала или пакетных наборов
    - Отладка порядка загрузки Plugin или состояния реестра
    - Добавление новой возможности Plugin или Plugin движка контекста
summary: 'Внутреннее устройство архитектуры Plugin: конвейер загрузки, реестр, хуки среды выполнения, маршруты HTTP и справочные таблицы'
title: Внутренние механизмы архитектуры Plugin
x-i18n:
    generated_at: "2026-06-28T23:14:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Для публичной модели возможностей, форматов plugin и контрактов владения/выполнения см. [Архитектура Plugin](/ru/plugins/architecture). Эта страница является справочником по внутренним механизмам: конвейеру загрузки, реестру, runtime-хукам, HTTP-маршрутам Gateway, путям импорта и таблицам схем.

## Конвейер загрузки

При запуске OpenClaw примерно выполняет следующее:

1. обнаруживает корневые каталоги кандидатов plugin
2. читает нативные или совместимые манифесты bundle и метаданные пакетов
3. отклоняет небезопасных кандидатов
4. нормализует конфигурацию plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. определяет включение для каждого кандидата
6. загружает включенные нативные модули: собранные bundled-модули используют нативный загрузчик;
   локальный исходный TypeScript сторонних разработчиков использует аварийный fallback Jiti
7. вызывает нативные хуки `register(api)` и собирает регистрации в реестр plugin
8. предоставляет реестр командам и runtime-поверхностям

<Note>
`activate` — это устаревший псевдоним для `register`: загрузчик разрешает то, что присутствует (`def.register ?? def.activate`), и вызывает это в той же точке. Все bundled plugins используют `register`; для новых plugins предпочитайте `register`.
</Note>

Проверки безопасности выполняются **до** runtime-выполнения. Кандидаты блокируются,
когда точка входа выходит за пределы корня plugin, путь доступен для записи всем пользователям или владение
путем выглядит подозрительно для не-bundled plugins.

Заблокированные кандидаты остаются привязанными к своему id plugin для диагностики. Если конфигурация
все еще ссылается на этот id, валидация сообщает, что plugin присутствует, но заблокирован,
и указывает обратно на предупреждение о безопасности пути, вместо того чтобы считать запись конфигурации
устаревшей.

### Поведение с приоритетом манифеста

Манифест — источник истины control plane. OpenClaw использует его, чтобы:

- идентифицировать plugin
- обнаруживать объявленные каналы/skills/схему конфигурации или возможности bundle
- валидировать `plugins.entries.<id>.config`
- дополнять метки/placeholder'ы Control UI
- показывать метаданные установки/каталога
- сохранять дешевые дескрипторы активации и настройки без загрузки runtime plugin

Для нативных plugins runtime-модуль является частью data plane. Он регистрирует
фактическое поведение, такое как хуки, инструменты, команды или provider flows.

Необязательные блоки манифеста `activation` и `setup` остаются на control plane.
Это только метаданные-дескрипторы для планирования активации и обнаружения настройки;
они не заменяют runtime-регистрацию, `register(...)` или `setupEntry`.
Первые потребители live-активации теперь используют подсказки манифеста по командам, каналам и provider,
чтобы сужать загрузку plugin перед более широкой материализацией реестра:

- загрузка CLI сужается до plugins, которым принадлежит запрошенная основная команда
- настройка канала/разрешение plugin сужается до plugins, которым принадлежит запрошенный
  id канала
- явная настройка provider/runtime-разрешение сужается до plugins, которым принадлежит запрошенный
  id provider
- планирование запуска Gateway использует `activation.onStartup` для явных startup-импортов
  и отказов от запуска; plugins без startup-метаданных загружаются только
  через более узкие триггеры активации

Runtime-предзагрузки во время запроса, которые запрашивают широкую область `all`, все равно выводят
явный эффективный набор id plugin из конфигурации, планирования запуска, настроенных
каналов, slots и правил автовключения. Если этот выведенный набор пуст, OpenClaw
загружает пустой runtime-реестр вместо расширения до каждого обнаруживаемого
plugin.

Планировщик активации предоставляет как API только для ids для существующих вызывающих сторон, так и
API плана для новой диагностики. Записи плана сообщают, почему был выбран plugin,
отделяя явные подсказки планировщика `activation.*` от fallback владения из манифеста,
такого как `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` и хуки. Это разделение причин является границей совместимости:
существующие метаданные plugin продолжают работать, а новый код может обнаруживать широкие подсказки
или fallback-поведение без изменения семантики runtime-загрузки.

Обнаружение настройки теперь предпочитает ids, принадлежащие дескрипторам, такие как `setup.providers` и
`setup.cliBackends`, чтобы сужать plugins-кандидаты перед fallback к
`setup-api` для plugins, которым все еще нужны runtime-хуки во время настройки. Списки настройки
provider используют `providerAuthChoices` из манифеста, варианты настройки, выведенные из дескрипторов,
и метаданные install-catalog без загрузки runtime provider. Явное
`setup.requiresRuntime: false` является descriptor-only отсечением; пропущенное
`requiresRuntime` сохраняет устаревший fallback setup-api для совместимости. Если более
чем один обнаруженный plugin заявляет один и тот же нормализованный setup provider или id CLI
backend, поиск настройки отклоняет неоднозначного владельца вместо того, чтобы полагаться на
порядок обнаружения. Когда setup runtime действительно выполняется, диагностика реестра сообщает
о расхождении между `setup.providers` / `setup.cliBackends` и providers или CLI
backends, зарегистрированными setup-api, без блокировки устаревших plugins.

### Граница кэша plugin

OpenClaw не кэширует результаты обнаружения plugin или данные прямого реестра манифестов
за окнами wall-clock. Установки, правки манифеста и изменения load-path
должны становиться видимыми при следующем явном чтении метаданных или пересборке снимка.
Парсер файла манифеста может держать ограниченный кэш сигнатур файлов, ключом которого являются
открытый путь манифеста, inode, размер и timestamps; этот кэш только избегает
повторного парсинга неизмененных байтов и не должен кэшировать ответы по обнаружению,
реестру, владельцу или policy.

Безопасный быстрый путь метаданных — это явное владение объектом, а не скрытый кэш.
Горячие пути запуска Gateway должны передавать текущий `PluginMetadataSnapshot`,
выведенный `PluginLookUpTable` или явный реестр манифестов по цепочке вызовов.
Валидация конфигурации, startup auto-enable, bootstrap plugin и выбор provider
могут переиспользовать эти объекты, пока они представляют текущую конфигурацию и
инвентарь plugin. Поиск настройки все еще реконструирует метаданные манифеста по требованию,
если конкретный путь настройки не получает явный реестр манифестов; держите это
как fallback холодного пути, вместо того чтобы добавлять скрытые кэши поиска. Когда входные данные
меняются, пересобирайте и заменяйте снимок, вместо того чтобы мутировать его или хранить
исторические копии.
Представления активного реестра plugin и helpers bootstrap bundled channel
следует пересчитывать из текущего реестра/корня. Краткоживущие maps допустимы
внутри одного вызова для дедупликации работы или защиты от повторного входа; они не должны становиться process
metadata caches.

Для загрузки plugin постоянным слоем кэша является runtime-загрузка. Он может переиспользовать
состояние загрузчика, когда код или установленные артефакты действительно загружены, например:

- `PluginLoaderCacheState` и совместимые активные runtime-реестры
- кэши jiti/module и кэши загрузчика public-surface, используемые для избежания
  повторного импорта одной и той же runtime-поверхности
- кэши файловой системы для установленных артефактов plugin
- краткоживущие per-call maps для нормализации путей или разрешения дубликатов

Эти кэши являются деталями реализации data plane. Они не должны отвечать на
вопросы control plane, такие как «какому plugin принадлежит этот provider?», если вызывающая сторона
намеренно не запросила runtime-загрузку.

Не добавляйте постоянные или wall-clock кэши для:

- результатов обнаружения
- прямых реестров манифестов
- реестров манифестов, реконструированных из индекса установленных plugin
- поиска владельца provider, подавления модели, policy provider или метаданных public-artifact
- любых других ответов, выведенных из манифеста, где измененный манифест, установленный индекс
  или load path должны быть видны при следующем чтении метаданных

Вызывающие стороны, которые пересобирают метаданные манифеста из сохраненного индекса установленных plugin,
реконструируют этот реестр по требованию. Установленный индекс — это durable
source-plane state; он не является скрытым in-process metadata cache.

## Модель реестра

Загруженные plugins не мутируют напрямую случайные глобальные объекты core. Они регистрируются в
центральном реестре plugin.

Реестр отслеживает:

- записи plugin (identity, source, origin, status, diagnostics)
- tools
- устаревшие хуки и typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- команды, принадлежащие plugin

Затем core-функции читают из этого реестра, а не общаются с модулями plugin
напрямую. Это сохраняет загрузку однонаправленной:

- plugin module -> registry registration
- core runtime -> registry consumption

Это разделение важно для сопровождаемости. Оно означает, что большинству core-поверхностей нужна только
одна точка интеграции: «читать реестр», а не «обрабатывать каждый модуль plugin особым образом».

## Callback'и привязки беседы

Plugins, которые привязывают беседу, могут реагировать, когда approval разрешен.

Используйте `api.onConversationBindingResolved(...)`, чтобы получить callback после того, как запрос bind
одобрен или отклонен:

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

- `status`: `"approved"` или `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` или `"deny"`
- `binding`: разрешенная привязка для одобренных запросов
- `request`: исходная сводка запроса, подсказка detach, id отправителя и
  метаданные беседы

Этот callback предназначен только для уведомления. Он не меняет, кому разрешено привязывать
беседу, и выполняется после завершения обработки approval в core.

## Runtime-хуки provider

Provider plugins имеют три слоя:

- **Метаданные манифеста** для дешевого pre-runtime поиска:
  `setup.providers[].envVars`, устаревшая совместимость `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` и `channelEnvVars`.
- **Хуки времени конфигурации**: `catalog` (устаревший `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: более 40 необязательных хуков, покрывающих auth, разрешение модели,
  обертку stream, уровни thinking, policy replay и endpoints использования. См.
  полный список в разделе [Порядок и использование хуков](#hook-order-and-usage).

OpenClaw по-прежнему владеет общим agent loop, failover, обработкой transcript и
tool policy. Эти хуки являются extension surface для специфичного для provider
поведения без необходимости в полностью пользовательском inference transport.

Используйте `setup.providers[].envVars` из манифеста, когда у provider есть учетные данные на основе env,
которые generic auth/status/model-picker paths должны видеть без
загрузки runtime plugin. Устаревший `providerAuthEnvVars` все еще читается
adapter'ом совместимости в течение окна устаревания, а не-bundled plugins,
которые его используют, получают diagnostic манифеста. Используйте `providerAuthAliases`
из манифеста, когда один id provider должен переиспользовать env vars, auth profiles,
auth на основе config и выбор API-key onboarding другого id provider. Используйте
`providerAuthChoices` из манифеста, когда onboarding/auth-choice CLI surfaces должны знать
choice id provider, labels групп и простую one-flag auth wiring без
загрузки runtime provider. Оставляйте runtime provider
`envVars` для подсказок, обращенных к operator, таких как onboarding labels или OAuth
client-id/client-secret setup vars.

Используйте `channelEnvVars` из манифеста, когда у канала есть auth или setup, управляемые env, которые
generic shell-env fallback, проверки config/status или prompts настройки должны видеть
без загрузки runtime канала.

### Порядок и использование хуков

Для plugins моделей/provider OpenClaw вызывает хуки примерно в таком порядке.
Столбец «Когда использовать» — это краткое руководство для принятия решений.
Поля provider только для совместимости, которые OpenClaw больше не вызывает, такие как
`ProviderPlugin.capabilities` и `suppressBuiltInModel`, намеренно не
перечислены здесь.

| #   | Hook                              | Что делает                                                                                                                | Когда использовать                                                                                                                                         |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публикует конфигурацию провайдера в `models.providers` при генерации `models.json`                                        | Провайдер владеет каталогом или значениями по умолчанию для базового URL                                                                                   |
| 2   | `applyConfigDefaults`             | Применяет принадлежащие провайдеру глобальные значения конфигурации по умолчанию при материализации конфигурации          | Значения по умолчанию зависят от режима аутентификации, env или семантики семейства моделей провайдера                                                     |
| --  | _(встроенный поиск моделей)_      | OpenClaw сначала пробует обычный путь через реестр/каталог                                                                | _(не hook Plugin)_                                                                                                                                         |
| 3   | `normalizeModelId`                | Нормализует устаревшие или preview-псевдонимы идентификаторов моделей перед поиском                                      | Провайдер отвечает за очистку псевдонимов перед каноническим разрешением модели                                                                            |
| 4   | `normalizeTransport`              | Нормализует `api` / `baseUrl` семейства провайдера перед общей сборкой модели                                             | Провайдер отвечает за очистку транспорта для пользовательских идентификаторов провайдера в том же семействе транспорта                                     |
| 5   | `normalizeConfig`                 | Нормализует `models.providers.<id>` перед разрешением runtime/провайдера                                                  | Провайдеру нужна очистка конфигурации, которая должна находиться в Plugin; встроенные помощники семейства Google также страхуют поддерживаемые записи конфигурации Google |
| 6   | `applyNativeStreamingUsageCompat` | Применяет совместимые перезаписи native streaming-usage к провайдерам конфигурации                                        | Провайдеру нужны исправления метаданных native streaming usage, зависящие от endpoint                                                                       |
| 7   | `resolveConfigApiKey`             | Разрешает аутентификацию через env-marker для провайдеров конфигурации перед загрузкой runtime-аутентификации             | Провайдеры предоставляют собственные hooks разрешения API-ключа через env-marker                                                                            |
| 8   | `resolveSyntheticAuth`            | Отображает локальную/самостоятельно размещенную или конфигурационную аутентификацию без сохранения открытого текста       | Провайдер может работать с synthetic/local маркером учетных данных                                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Накладывает принадлежащие провайдеру внешние профили аутентификации; значение `persistence` по умолчанию — `runtime-only` для учетных данных, принадлежащих CLI/приложению | Провайдер повторно использует внешние учетные данные аутентификации без сохранения скопированных refresh-токенов; объявите `contracts.externalAuthProviders` в манифесте |
| 10  | `shouldDeferSyntheticProfileAuth` | Понижает приоритет сохраненных synthetic-заполнителей профиля за аутентификацией на основе env/конфигурации              | Провайдер хранит synthetic-заполнители профилей, которые не должны получать приоритет                                                                       |
| 11  | `resolveDynamicModel`             | Синхронный fallback для принадлежащих провайдеру идентификаторов моделей, которых пока нет в локальном реестре           | Провайдер принимает произвольные идентификаторы upstream-моделей                                                                                            |
| 12  | `prepareDynamicModel`             | Асинхронный прогрев, затем `resolveDynamicModel` запускается снова                                                        | Провайдеру нужны сетевые метаданные перед разрешением неизвестных идентификаторов                                                                           |
| 13  | `normalizeResolvedModel`          | Финальная перезапись перед тем, как встроенный runner использует разрешенную модель                                       | Провайдеру нужны перезаписи транспорта, но он по-прежнему использует core-транспорт                                                                         |
| 14  | `normalizeToolSchemas`            | Нормализует схемы инструментов до того, как встроенный runner их увидит                                                   | Провайдеру нужна очистка схем для семейства транспорта                                                                                                      |
| 15  | `inspectToolSchemas`              | Отображает принадлежащую провайдеру диагностику схем после нормализации                                                   | Провайдеру нужны предупреждения по ключевым словам без добавления в core правил, специфичных для провайдера                                                |
| 16  | `resolveReasoningOutputMode`      | Выбирает контракт reasoning-output: native или tagged                                                                      | Провайдеру нужен tagged reasoning/final output вместо native-полей                                                                                         |
| 17  | `prepareExtraParams`              | Нормализация параметров запроса перед общими обертками параметров stream                                                  | Провайдеру нужны параметры запроса по умолчанию или очистка параметров для конкретного провайдера                                                          |
| 18  | `createStreamFn`                  | Полностью заменяет обычный путь stream пользовательским транспортом                                                       | Провайдеру нужен пользовательский wire protocol, а не просто обертка                                                                                       |
| 20  | `wrapStreamFn`                    | Обертка stream после применения общих оберток                                                                             | Провайдеру нужны compat-обертки заголовков/тела/модели запроса без пользовательского транспорта                                                            |
| 21  | `resolveTransportTurnState`       | Прикрепляет native транспортные заголовки или метаданные для каждого turn                                                 | Провайдер хочет, чтобы общие транспорты отправляли provider-native идентификатор turn                                                                      |
| 22  | `resolveWebSocketSessionPolicy`   | Прикрепляет native WebSocket-заголовки или политику cool-down сессии                                                     | Провайдер хочет, чтобы общие WS-транспорты настраивали заголовки сессии или политику fallback                                                             |
| 23  | `formatApiKey`                    | Форматтер профиля аутентификации: сохраненный профиль становится runtime-строкой `apiKey`                                 | Провайдер хранит дополнительные метаданные аутентификации и нуждается в пользовательской форме runtime-токена                                              |
| 24  | `refreshOAuth`                    | Переопределение обновления OAuth для пользовательских endpoint обновления или политики сбоя обновления                    | Провайдер не подходит под общие refreshers OpenClaw                                                                                                        |
| 25  | `buildAuthDoctorHint`             | Подсказка для ремонта, добавляемая при сбое обновления OAuth                                                              | Провайдеру нужны принадлежащие провайдеру инструкции по ремонту аутентификации после сбоя обновления                                                       |
| 26  | `matchesContextOverflowError`     | Принадлежащий провайдеру matcher переполнения контекстного окна                                                           | У провайдера есть сырые ошибки переполнения, которые общие эвристики пропустили бы                                                                         |
| 27  | `classifyFailoverReason`          | Принадлежащая провайдеру классификация причины failover                                                                    | Провайдер может сопоставлять сырые ошибки API/транспорта с rate-limit/overload/etc                                                                         |
| 28  | `isCacheTtlEligible`              | Политика prompt-cache для proxy/backhaul-провайдеров                                                                      | Провайдеру нужен proxy-специфичный gate для TTL кэша                                                                                                       |
| 29  | `buildMissingAuthMessage`         | Замена общего сообщения восстановления при отсутствующей аутентификации                                                   | Провайдеру нужна специфичная для провайдера подсказка восстановления отсутствующей аутентификации                                                          |
| 30  | `augmentModelCatalog`             | Synthetic/final строки каталога, добавляемые после обнаружения                                                            | Провайдеру нужны synthetic строки прямой совместимости в `models list` и средствах выбора                                                                  |
| 31  | `resolveThinkingProfile`          | Набор уровней `/think` для модели, отображаемые labels и значение по умолчанию                                            | Провайдер предоставляет пользовательскую thinking-лестницу или binary label для выбранных моделей                                                          |
| 32  | `isBinaryThinking`                | Hook совместимости для переключателя reasoning вкл/выкл                                                                    | Провайдер предоставляет только binary thinking вкл/выкл                                                                                                    |
| 33  | `supportsXHighThinking`           | Hook совместимости поддержки reasoning `xhigh`                                                                             | Провайдер хочет `xhigh` только для подмножества моделей                                                                                                    |
| 34  | `resolveDefaultThinkingLevel`     | Hook совместимости уровня `/think` по умолчанию                                                                            | Провайдер владеет политикой `/think` по умолчанию для семейства моделей                                                                                    |
| 35  | `isModernModelRef`                | Matcher современных моделей для фильтров live-профиля и выбора smoke                                                      | Провайдер владеет сопоставлением preferred-model для live/smoke                                                                                            |
| 36  | `prepareRuntimeAuth`              | Обменивает настроенные учетные данные на фактический runtime-токен/ключ непосредственно перед inference                   | Провайдеру нужен обмен токенов или краткоживущие учетные данные запроса                                                                                    |
| 37  | `resolveUsageAuth`                | Разрешает учетные данные usage/billing для `/usage` и связанных поверхностей статуса                                      | Провайдеру нужен пользовательский разбор токенов usage/quota или другие учетные данные usage                                                               |
| 38  | `fetchUsageSnapshot`              | Получить и нормализовать специфичные для провайдера снимки использования/квоты после разрешения аутентификации | Провайдеру нужна специфичная для провайдера конечная точка использования или парсер полезной нагрузки                                         |
| 39  | `createEmbeddingProvider`         | Создать принадлежащий провайдеру адаптер эмбеддингов для памяти/поиска                                          | Поведение эмбеддингов памяти принадлежит Plugin провайдера                                                                                    |
| 40  | `buildReplayPolicy`               | Вернуть политику повтора, управляющую обработкой транскрипта для провайдера                                    | Провайдеру нужна пользовательская политика транскрипта (например, удаление блоков размышлений)                                               |
| 41  | `sanitizeReplayHistory`           | Переписать историю повтора после общей очистки транскрипта                                                     | Провайдеру нужны специфичные для провайдера переписывания повтора сверх общих вспомогательных средств Compaction                             |
| 42  | `validateReplayTurns`             | Финальная проверка или преобразование ходов повтора перед встроенным раннером                                  | Транспорту провайдера нужна более строгая проверка ходов после общей санитарной обработки                                                     |
| 43  | `onModelSelected`                 | Выполнить принадлежащие провайдеру побочные эффекты после выбора                                               | Провайдеру нужна телеметрия или принадлежащее провайдеру состояние, когда модель становится активной                                          |

`normalizeModelId`, `normalizeTransport` и `normalizeConfig` сначала проверяют
совпавший provider plugin, затем переходят к другим provider plugins с поддержкой
хуков, пока один из них фактически не изменит идентификатор модели или transport/config. Это сохраняет
работу provider shim-слоев для alias/compat без необходимости для вызывающего кода знать, какой
встроенный Plugin владеет перезаписью. Если ни один provider hook не перезаписывает поддерживаемую
запись конфигурации семейства Google, встроенный нормализатор конфигурации Google всё равно применяет
эту compatibility-очистку.

Если провайдеру нужен полностью собственный wire protocol или собственный request executor,
это другой класс расширения. Эти хуки предназначены для поведения провайдера,
которое всё ещё выполняется в обычном inference loop OpenClaw.

`resolveUsageAuth` решает, должен ли OpenClaw вызывать `fetchUsageSnapshot` или
возвращаться к generic credential resolution для поверхностей usage/status. Верните
`{ token, accountId? }`, когда у провайдера есть учетные данные usage, верните
`{ handled: true }`, когда usage auth, принадлежащая провайдеру, обработала запрос и
должна подавить общий fallback API-key/OAuth, и верните `null` или `undefined`,
когда провайдер не обработал usage auth.

### Пример провайдера

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

### Встроенные примеры

Встроенные provider plugins объединяют хуки выше, чтобы соответствовать потребностям
catalog, auth, thinking, replay и usage каждого поставщика. Авторитетный набор хуков находится
в каждом Plugin в `extensions/`; эта страница иллюстрирует формы, а не
зеркалирует список.

<AccordionGroup>
  <Accordion title="Провайдеры каталога с pass-through">
    OpenRouter, Kilocode, Z.AI, xAI регистрируют `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, чтобы они могли показывать upstream
    идентификаторы моделей до статического каталога OpenClaw.
  </Accordion>
  <Accordion title="Провайдеры OAuth и endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai сочетают
    `prepareRuntimeAuth` или `formatApiKey` с `resolveUsageAuth` +
    `fetchUsageSnapshot`, чтобы владеть обменом токенов и интеграцией `/usage`.
  </Accordion>
  <Accordion title="Семейства replay и очистки transcript">
    Общие именованные семейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) позволяют провайдерам подключаться к
    политике transcript через `buildReplayPolicy` вместо того, чтобы каждый Plugin
    заново реализовывал очистку.
  </Accordion>
  <Accordion title="Провайдеры только каталога">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` и
    `volcengine` регистрируют только `catalog` и используют общий inference loop.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` и `context1m` находятся внутри
    публичного шва Anthropic plugin `api.ts` / `contract-api.ts`
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    generic SDK.
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugins могут получать доступ к выбранным core helpers через `api.runtime`. Для TTS:

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

Примечания:

- `textToSpeech` возвращает обычный core TTS output payload для поверхностей file/voice-note.
- Использует core-конфигурацию `messages.tts` и выбор провайдера.
- Возвращает PCM audio buffer + sample rate. Plugins должны выполнять resample/encode для провайдеров.
- `listVoices` необязателен для каждого провайдера. Используйте его для voice pickers или setup flows, принадлежащих поставщику.
- Списки голосов могут включать более богатые метаданные, такие как locale, gender и personality tags для provider-aware pickers.
- OpenAI и ElevenLabs сегодня поддерживают telephony. Microsoft не поддерживает.

Plugins также могут регистрировать speech providers через `api.registerSpeechProvider(...)`.

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

Примечания:

- Держите политику TTS, fallback и доставку ответов в core.
- Используйте speech providers для поведения синтеза, принадлежащего поставщику.
- Устаревший Microsoft `edge` input нормализуется в идентификатор провайдера `microsoft`.
- Предпочтительная модель владения ориентирована на компанию: один vendor plugin может владеть
  text, speech, image и будущими media providers по мере добавления OpenClaw этих
  capability contracts.

Для понимания image/audio/video Plugins регистрируют один типизированный
media-understanding provider вместо generic key/value bag:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Примечания:

- Держите orchestration, fallback, config и channel wiring в core.
- Держите поведение поставщика в provider plugin.
- Additive expansion должен оставаться типизированным: новые optional methods, новые optional
  result fields, новые optional capabilities.
- Генерация видео уже следует тому же шаблону:
  - core владеет capability contract и runtime helper
  - vendor plugins регистрируют `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins используют `api.runtime.videoGeneration.*`

Для runtime helpers media-understanding Plugins могут вызывать:

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

Для транскрипции аудио Plugins могут использовать либо runtime media-understanding,
либо более старый STT alias:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примечания:

- `api.runtime.mediaUnderstanding.*` является предпочтительной общей поверхностью для
  понимания image/audio/video.
- `extractStructuredWithModel(...)` является обращенным к Plugin швом для ограниченной
  provider-owned image-first extraction. Включите как минимум один image input;
  text inputs являются дополнительным контекстом.
  product plugins владеют своими routes и schemas, а OpenClaw владеет
  boundary provider/runtime.
- Использует core media-understanding audio configuration (`tools.media.audio`) и provider fallback order.
- Возвращает `{ text: undefined }`, когда transcription output не создан (например, input пропущен или не поддерживается).
- `api.runtime.stt.transcribeAudioFile(...)` остается compatibility alias.

Plugins также могут запускать фоновые subagent runs через `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Примечания:

- `provider` и `model` являются необязательными per-run overrides, а не постоянными изменениями session.
- OpenClaw учитывает эти override fields только для доверенных callers.
- Для plugin-owned fallback runs операторы должны явно включить `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Используйте `plugins.entries.<id>.subagent.allowedModels`, чтобы ограничить доверенные Plugins конкретными canonical `provider/model` targets, или `"*"`, чтобы явно разрешить любой target.
- Untrusted plugin subagent runs всё ещё работают, но override requests отклоняются вместо silent fallback.
- Созданные Plugin subagent sessions помечаются идентификатором создавшего Plugin. Fallback `api.runtime.subagent.deleteSession(...)` может удалять только эти принадлежащие ему sessions; удаление произвольных sessions всё ещё требует admin-scoped Gateway request.

Для web search Plugins могут использовать общий runtime helper вместо
обращения к agent tool wiring:

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

Plugins также могут регистрировать web-search providers через
`api.registerWebSearchProvider(...)`.

Примечания:

- Держите provider selection, credential resolution и shared request semantics в core.
- Используйте web-search providers для vendor-specific search transports.
- `api.runtime.webSearch.*` является предпочтительной общей поверхностью для feature/channel plugins, которым нужно search behavior без зависимости от agent tool wrapper.

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

- `generate(...)`: сгенерировать изображение с использованием настроенной цепочки image-generation provider.
- `listProviders(...)`: перечислить доступных image-generation providers и их capabilities.

## HTTP-маршруты Gateway

Plugins могут предоставлять HTTP endpoints с помощью `api.registerHttpRoute(...)`.

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

Поля маршрута:

- `path`: путь маршрута на HTTP-сервере Gateway.
- `auth`: обязательно. Используйте `"gateway"`, чтобы требовать обычную аутентификацию Gateway, или `"plugin"` для управляемой плагином аутентификации/проверки Webhook.
- `match`: необязательно. `"exact"` (по умолчанию) или `"prefix"`.
- `replaceExisting`: необязательно. Позволяет тому же плагину заменить собственную существующую регистрацию маршрута.
- `handler`: возвращайте `true`, когда маршрут обработал запрос.

Примечания:

- `api.registerHttpHandler(...)` удален и вызовет ошибку загрузки плагина. Используйте вместо него `api.registerHttpRoute(...)`.
- Маршруты плагинов должны явно объявлять `auth`.
- Точные конфликты `path + match` отклоняются, если не задано `replaceExisting: true`, и один плагин не может заменить маршрут другого плагина.
- Перекрывающиеся маршруты с разными уровнями `auth` отклоняются. Оставляйте цепочки переходов `exact`/`prefix` только на одном уровне аутентификации.
- Маршруты `auth: "plugin"` **не** получают автоматически области runtime оператора. Они предназначены для управляемых плагином Webhook/проверки подписей, а не для привилегированных вызовов вспомогательных средств Gateway.
- Маршруты `auth: "gateway"` выполняются внутри области runtime запроса Gateway, но эта область намеренно консервативна:
  - аутентификация bearer с общим секретом (`gateway.auth.mode = "token"` / `"password"`) удерживает области runtime маршрутов плагина на `operator.write`, даже если вызывающая сторона отправляет `x-openclaw-scopes`
  - доверенные HTTP-режимы с идентификацией (например, `trusted-proxy` или `gateway.auth.mode = "none"` на приватном ingress) учитывают `x-openclaw-scopes` только когда заголовок явно присутствует
  - если `x-openclaw-scopes` отсутствует в таких запросах маршрутов плагина с идентификацией, область runtime откатывается к `operator.write`
- Практическое правило: не предполагайте, что маршрут плагина с аутентификацией Gateway является неявной административной поверхностью. Если маршруту нужно поведение только для администраторов, требуйте режим аутентификации с идентификацией и документируйте явный контракт заголовка `x-openclaw-scopes`.

## Пути импорта SDK плагинов

Используйте узкие подпути SDK вместо монолитного корневого barrel `openclaw/plugin-sdk`
при создании новых плагинов. Основные подпути:

| Подпуть                             | Назначение                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примитивы регистрации плагина                     |
| `openclaw/plugin-sdk/channel-core`  | Вспомогательные средства входа/сборки канала                        |
| `openclaw/plugin-sdk/core`          | Общие разделяемые вспомогательные средства и зонтичный контракт       |
| `openclaw/plugin-sdk/config-schema` | Корневая Zod-схема `openclaw.json` (`OpenClawSchema`) |

Канальные плагины выбирают из семейства узких стыков — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` и `channel-actions`. Поведение утверждения должно сводиться
к одному контракту `approvalCapability`, а не смешиваться между несвязанными
полями плагина. См. [Канальные плагины](/ru/plugins/sdk-channel-plugins).

Вспомогательные средства runtime и конфигурации находятся в соответствующих
сфокусированных подпутях `*-runtime` (`approval-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`,
`system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` и т. д.).
Предпочитайте `config-contracts`, `plugin-config-runtime`,
`runtime-config-snapshot` и `config-mutation` вместо широкого barrel совместимости
`config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
малые фасады вспомогательных средств каналов, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
и `openclaw/plugin-sdk/infra-runtime` являются устаревшими shim-слоями
совместимости для старых плагинов. Новый код должен импортировать более узкие
универсальные примитивы.
</Info>

Внутренние точки входа репозитория (относительно корня пакета встроенного плагина):

- `index.js` — точка входа встроенного плагина
- `api.js` — barrel вспомогательных средств/типов
- `runtime-api.js` — barrel только для runtime
- `setup-entry.js` — точка входа плагина настройки

Внешние плагины должны импортировать только подпути `openclaw/plugin-sdk/*`.
Никогда не импортируйте `src/*` другого пакета плагина из ядра или из другого
плагина. Точки входа, загружаемые через фасад, предпочитают активный снимок
runtime-конфигурации, когда он существует, а затем откатываются к разрешенному
файлу конфигурации на диске.

Подпути для конкретных возможностей, такие как `image-generation`, `media-understanding`
и `speech`, существуют, потому что встроенные плагины используют их сегодня. Они
не являются автоматически долгосрочно замороженными внешними контрактами — проверяйте
соответствующую справочную страницу SDK, когда полагаетесь на них.

## Схемы инструментов сообщений

Плагины должны владеть канально-специфичными вкладами схемы
`describeMessageTool(...)` для примитивов не-сообщений, таких как реакции,
прочтения и опросы. Общее представление отправки должно использовать универсальный
контракт `MessagePresentation` вместо полей кнопок, компонентов, блоков или
карточек, нативных для провайдера. См. [Представление сообщений](/ru/plugins/message-presentation)
для контракта, правил отката, сопоставления провайдеров и контрольного списка
автора плагина.

Плагины с возможностью отправки объявляют, что они могут отображать, через возможности сообщений:

- `presentation` для семантических блоков представления (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запросов закрепленной доставки

Ядро решает, отображать ли представление нативно или деградировать его до текста.
Не раскрывайте escape hatch для нативного UI провайдера из универсального инструмента
сообщений. Устаревшие вспомогательные средства SDK для легаси-нативных схем остаются
экспортированными для существующих сторонних плагинов, но новые плагины не должны
их использовать.

## Разрешение целей канала

Канальные плагины должны владеть канально-специфичной семантикой целей. Держите
общий исходящий host универсальным и используйте поверхность адаптера сообщений
для правил провайдера:

- `messaging.inferTargetChatType({ to })` решает, следует ли считать нормализованную цель
  `direct`, `group` или `channel` до поиска в каталоге.
- `messaging.targetResolver.looksLikeId(raw, normalized)` сообщает ядру, должен ли ввод
  сразу перейти к разрешению как id, а не к поиску в каталоге.
- `messaging.targetResolver.reservedLiterals` перечисляет отдельные слова, которые являются
  ссылками на канал/сессию для этого провайдера. Разрешение сохраняет настроенные
  записи каталога перед отклонением зарезервированных литералов, затем закрыто
  завершается ошибкой при промахе каталога.
- `messaging.targetResolver.resolveTarget(...)` — откат плагина, когда ядру нужно
  окончательное разрешение, принадлежащее провайдеру, после нормализации или после
  промаха каталога.
- `messaging.resolveOutboundSessionRoute(...)` владеет построением маршрута сессии,
  специфичного для провайдера, после разрешения цели.

Рекомендуемое разделение:

- Используйте `inferTargetChatType` для решений о категории, которые должны происходить до
  поиска peers/groups.
- Используйте `looksLikeId` для проверок "считать это явным/нативным id цели".
- Используйте `resolveTarget` для специфичного для провайдера отката нормализации, а не для
  широкого поиска в каталоге.
- Храните нативные для провайдера идентификаторы, такие как chat ids, thread ids, JIDs, handles и room
  ids, внутри значений `target` или специфичных для провайдера параметров, а не в универсальных
  полях SDK.

## Каталоги на основе конфигурации

Плагины, которые выводят записи каталога из конфигурации, должны держать эту
логику в плагине и переиспользовать общие вспомогательные средства из
`openclaw/plugin-sdk/directory-runtime`.

Используйте это, когда каналу нужны peers/groups на основе конфигурации, такие как:

- DM peers, управляемые allowlist
- настроенные карты каналов/групп
- статические откаты каталога в области учетной записи

Общие вспомогательные средства в `directory-runtime` обрабатывают только универсальные операции:

- фильтрация запросов
- применение лимита
- вспомогательные средства дедупликации/нормализации
- построение `ChannelDirectoryEntry[]`

Специфичные для канала проверка учетной записи и нормализация id должны оставаться
в реализации плагина.

## Каталоги провайдеров

Плагины провайдеров могут определять каталоги моделей для inference с помощью
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` возвращает ту же форму, которую OpenClaw записывает в
`models.providers`:

- `{ provider }` для одной записи провайдера
- `{ providers }` для нескольких записей провайдера

Используйте `catalog`, когда плагин владеет специфичными для провайдера id моделей,
значениями по умолчанию base URL или метаданными моделей с доступом через аутентификацию.

`catalog.order` управляет тем, когда каталог плагина сливается относительно встроенных
неявных провайдеров OpenClaw:

- `simple`: простые провайдеры, управляемые API-ключом или env
- `profile`: провайдеры, которые появляются при наличии профилей аутентификации
- `paired`: провайдеры, которые синтезируют несколько связанных записей провайдера
- `late`: последний проход, после других неявных провайдеров

Более поздние провайдеры побеждают при коллизии ключей, поэтому плагины могут намеренно
переопределить встроенную запись провайдера с тем же id провайдера.

Плагины также могут публиковать строки моделей только для чтения через
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Это дальнейший путь для поверхностей списка/справки/выбора и поддерживает
строки `text`, `image_generation`, `video_generation` и `music_generation`.
Плагины провайдеров по-прежнему владеют вызовами live endpoint, обменом токенов
и сопоставлением ответов вендора; ядро владеет общей формой строки, метками
источников и форматированием справки для медиа-инструментов. Регистрации провайдеров
генерации медиа автоматически синтезируют строки статического каталога из
`defaultModel`, `models` и `capabilities`.

Совместимость:

- `discovery` по-прежнему работает как легаси-псевдоним, но выводит предупреждение об устаревании
- если зарегистрированы и `catalog`, и `discovery`, OpenClaw использует `catalog`
- `augmentModelCatalog` устарел; встроенные провайдеры должны публиковать
  дополнительные строки через `registerModelCatalogProvider`

## Проверка канала только для чтения

Если ваш плагин регистрирует канал, предпочитайте реализовать
`plugin.config.inspectAccount(cfg, accountId)` вместе с `resolveAccount(...)`.

Почему:

- `resolveAccount(...)` — путь runtime. Ему разрешено предполагать, что учетные данные
  полностью материализованы, и он может быстро завершаться ошибкой, когда отсутствуют
  необходимые секреты.
- Пути команд только для чтения, такие как `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а также потоки doctor/config
  repair не должны материализовать runtime-учетные данные только для описания конфигурации.

Рекомендуемое поведение `inspectAccount(...)`:

- Возвращайте только описательное состояние учетной записи.
- Сохраняйте `enabled` и `configured`.
- Включайте поля источника/статуса учетных данных, когда это уместно, например:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не нужно возвращать сырые значения токенов только для сообщения о доступности
  только для чтения. Возврата `tokenStatus: "available"` (и соответствующего поля
  source) достаточно для команд в стиле status.
- Используйте `configured_unavailable`, когда учетные данные настроены через SecretRef, но
  недоступны в текущем пути команды.

Это позволяет командам только для чтения сообщать "настроено, но недоступно в этом
пути команды" вместо сбоя или ошибочного сообщения, что учетная запись не настроена.

## Пакеты пакетов

Каталог плагина может включать `package.json` с `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Каждая запись становится плагином. Если пакет перечисляет несколько расширений, id плагина
становится `name/<fileBase>`.

Если ваш плагин импортирует npm-зависимости, установите их в этот каталог, чтобы
`node_modules` был доступен (`npm install` / `pnpm install`).

Защитное ограничение безопасности: каждая запись `openclaw.extensions` должна оставаться внутри
каталога плагина после разрешения symlink. Записи, выходящие за пределы каталога пакета,
отклоняются.

Примечание по безопасности: `openclaw plugins install` устанавливает зависимости Plugin с помощью
локального для проекта `npm install --omit=dev --ignore-scripts` (без lifecycle-скриптов,
без dev-зависимостей во время выполнения), игнорируя унаследованные глобальные настройки установки npm.
Держите деревья зависимостей Plugin «pure JS/TS» и избегайте пакетов, которым требуются
сборки через `postinstall`.

Необязательно: `openclaw.setupEntry` может указывать на легковесный модуль только для настройки.
Когда OpenClaw нужны поверхности настройки для отключенного канального Plugin или
когда канальный Plugin включен, но еще не настроен, он загружает `setupEntry`
вместо полной точки входа Plugin. Это облегчает запуск и настройку,
когда основная точка входа Plugin также подключает инструменты, хуки или другой код,
нужный только во время выполнения.

Необязательно: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
может перевести канальный Plugin на тот же путь `setupEntry` во время фазы запуска Gateway
до начала прослушивания, даже если канал уже настроен.

Используйте это только тогда, когда `setupEntry` полностью покрывает поверхность запуска, которая должна существовать
до того, как Gateway начнет прослушивание. На практике это означает, что точка входа настройки
должна зарегистрировать каждую принадлежащую каналу возможность, от которой зависит запуск, например:

- сама регистрация канала
- любые HTTP-маршруты, которые должны быть доступны до того, как Gateway начнет прослушивание
- любые методы Gateway, инструменты или сервисы, которые должны существовать в это же окно

Если полная точка входа все еще владеет какой-либо обязательной возможностью запуска, не включайте
этот флаг. Оставьте Plugin на поведении по умолчанию и позвольте OpenClaw загрузить
полную точку входа во время запуска.

Встроенные каналы также могут публиковать вспомогательные функции контрактной поверхности только для настройки, к которым core
может обращаться до загрузки полной среды выполнения канала. Текущая поверхность
продвижения настройки:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core использует эту поверхность, когда ему нужно продвинуть устаревшую конфигурацию канала с одной учетной записью
в `channels.<id>.accounts.*` без загрузки полной точки входа Plugin.
Matrix — текущий встроенный пример: он перемещает только ключи auth/bootstrap в
именованную продвинутую учетную запись, когда именованные учетные записи уже существуют, и может сохранить
настроенный неканонический ключ учетной записи по умолчанию вместо того, чтобы всегда создавать
`accounts.default`.

Эти адаптеры патчей настройки сохраняют ленивым обнаружение встроенной контрактной поверхности. Время
импорта остается легким; поверхность продвижения загружается только при первом использовании, а не
повторно входит в запуск встроенного канала при импорте модуля.

Когда эти поверхности запуска включают RPC-методы Gateway, держите их на
префиксе, специфичном для Plugin. Административные пространства имен core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) остаются зарезервированными и всегда разрешаются
в `operator.admin`, даже если Plugin запрашивает более узкую область.

Пример:

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

### Метаданные каталога каналов

Канальные Plugin могут объявлять метаданные настройки/обнаружения через `openclaw.channel` и
подсказки установки через `openclaw.install`. Это сохраняет каталог core свободным от данных.

Пример:

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

Полезные поля `openclaw.channel` помимо минимального примера:

- `detailLabel`: вторичная метка для более насыщенных поверхностей каталога/статуса
- `docsLabel`: переопределяет текст ссылки для ссылки на документацию
- `preferOver`: id Plugin/каналов с более низким приоритетом, которые эта запись каталога должна превосходить
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: элементы управления текстом поверхности выбора
- `markdownCapable`: помечает канал как поддерживающий markdown для решений о форматировании исходящих сообщений
- `exposure.configured`: скрывает канал из поверхностей списка настроенных каналов, когда задано `false`
- `exposure.setup`: скрывает канал из интерактивных выборщиков setup/configure, когда задано `false`
- `exposure.docs`: помечает канал как внутренний/приватный для поверхностей навигации документации
- `showConfigured` / `showInSetup`: устаревшие псевдонимы, все еще принимаемые для совместимости; предпочитайте `exposure`
- `quickstartAllowFrom`: подключает канал к стандартному потоку quickstart `allowFrom`
- `forceAccountBinding`: требует явной привязки учетной записи, даже когда существует только одна учетная запись
- `preferSessionLookupForAnnounceTarget`: предпочитает поиск сеанса при разрешении целей объявлений

OpenClaw также может объединять **внешние каталоги каналов** (например, экспорт
реестра MPM). Поместите JSON-файл в один из путей:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Или укажите `OPENCLAW_PLUGIN_CATALOG_PATHS` (или `OPENCLAW_MPM_CATALOG_PATHS`) на
один или несколько JSON-файлов (разделенных запятыми/точками с запятой/`PATH`). Каждый файл должен
содержать `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер также принимает `"packages"` или `"plugins"` как устаревшие псевдонимы ключа `"entries"`.

Сгенерированные записи каталога каналов и записи каталога установки провайдеров предоставляют
нормализованные факты об источнике установки рядом с исходным блоком `openclaw.install`. Эти
нормализованные факты определяют, является ли npm-спецификация точной версией или плавающим
селектором, присутствуют ли ожидаемые метаданные целостности и доступен ли также локальный
путь источника. Когда идентичность каталога/пакета известна,
нормализованные факты предупреждают, если разобранное имя npm-пакета расходится с этой идентичностью.
Они также предупреждают, когда `defaultChoice` недействителен или указывает на источник, который
недоступен, и когда метаданные целостности npm присутствуют без действительного npm
источника. Потребители должны рассматривать `installSource` как добавочное необязательное поле, чтобы
созданным вручную записям и shim-слоям каталога не приходилось его синтезировать.
Это позволяет onboarding и диагностике объяснять состояние плоскости источников без
импорта среды выполнения Plugin.

Официальные внешние npm-записи должны предпочитать точный `npmSpec` плюс
`expectedIntegrity`. Голые имена пакетов и dist-tags все еще работают для
совместимости, но они показывают предупреждения плоскости источников, чтобы каталог мог двигаться
к закрепленным установкам с проверкой целостности, не ломая существующие Plugin.
Когда onboarding устанавливает из локального пути каталога, он записывает управляемую запись индекса
Plugin с `source: "path"` и относительным к рабочей области
`sourcePath`, когда это возможно. Абсолютный рабочий путь загрузки остается в
`plugins.load.paths`; запись установки избегает дублирования локальных путей рабочей станции
в долгоживущей конфигурации. Это сохраняет установки локальной разработки видимыми для
диагностики плоскости источников без добавления второй необработанной поверхности раскрытия путей файловой системы.
Сохраненная строка SQLite `installed_plugin_index` является источником истины установки
и может обновляться без загрузки модулей среды выполнения Plugin.
Ее карта `installRecords` долговечна, даже когда манифест Plugin отсутствует или
недействителен; ее полезная нагрузка `plugins` — перестраиваемое представление манифеста.

## Plugin движка контекста

Plugin движка контекста владеют оркестрацией контекста сеанса для ingest, сборки
и Compaction. Зарегистрируйте их из своего Plugin с помощью
`api.registerContextEngine(id, factory)`, затем выберите активный движок через
`plugins.slots.contextEngine`.

Используйте это, когда вашему Plugin нужно заменить или расширить конвейер контекста
по умолчанию, а не просто добавить поиск памяти или хуки.

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

Фабрика `ctx` предоставляет необязательные значения `config`, `agentDir` и `workspaceDir`
для инициализации во время создания.

`assemble()` может вернуть `contextProjection`, когда активный harness имеет
постоянный backend-поток. Опустите его для устаревшей проекции на каждый ход. Верните
`{ mode: "thread_bootstrap", epoch }`, когда собранный контекст должен быть
один раз внедрен в backend-поток и переиспользоваться, пока epoch не изменится. Изменяйте
epoch после изменения семантического контекста движка, например после
прохода Compaction, принадлежащего движку. Хосты могут сохранять метаданные tool-call, форму
ввода и отредактированные результаты инструментов в проекции thread-bootstrap, чтобы свежие
backend-потоки сохраняли непрерывность инструментов без копирования сырых полезных нагрузок,
содержащих секреты.

Если ваш движок **не** владеет алгоритмом Compaction, оставьте `compact()`
реализованным и явно делегируйте его:

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

## Добавление новой возможности

Когда Plugin нужно поведение, которое не укладывается в текущий API, не обходите
систему Plugin приватным reach-in. Добавьте недостающую возможность.

Рекомендуемая последовательность:

1. определите контракт core
   Решите, каким общим поведением должен владеть core: политика, fallback, слияние конфигурации,
   жизненный цикл, семантика для каналов и форма runtime-helper.
2. добавьте типизированные поверхности регистрации/среды выполнения Plugin
   Расширьте `OpenClawPluginApi` и/или `api.runtime` минимальной полезной
   типизированной поверхностью возможности.
3. подключите core + потребителей канала/функции
   Каналы и функциональные Plugin должны потреблять новую возможность через core,
   а не напрямую импортировать реализацию поставщика.
4. зарегистрируйте реализации поставщиков
   Затем Plugin поставщиков регистрируют свои backend против возможности.
5. добавьте покрытие контракта
   Добавьте тесты, чтобы владение и форма регистрации со временем оставались явными.

Так OpenClaw остается принципиальным, не становясь жестко привязанным к мировоззрению одного
провайдера. См. [Capability Cookbook](/ru/plugins/adding-capabilities)
для конкретного чек-листа файлов и проработанного примера.

### Чек-лист возможностей

Когда вы добавляете новую возможность, реализация обычно должна затрагивать эти
поверхности вместе:

- типы контракта core в `src/<capability>/types.ts`
- runner/runtime-helper core в `src/<capability>/runtime.ts`
- поверхность регистрации API Plugin в `src/plugins/types.ts`
- проводку реестра Plugin в `src/plugins/registry.ts`
- экспозицию среды выполнения Plugin в `src/plugins/runtime/*`, когда функциональным/канальным
  Plugin нужно ее потреблять
- helper-функции захвата/тестов в `src/test-utils/plugin-registration.ts`
- утверждения владения/контракта в `src/plugins/contracts/registry.ts`
- документацию оператора/Plugin в `docs/`

Если одна из этих поверхностей отсутствует, это обычно признак того, что возможность
еще не полностью интегрирована.

### Шаблон возможности

Минимальный шаблон:

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

Шаблон контрактного теста:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Это сохраняет правило простым:

- ядро владеет контрактом возможности и оркестрацией
- Plugin поставщика владеют реализациями поставщиков
- функциональные/канальные Plugin используют runtime-помощники
- контрактные тесты сохраняют владение явным

## Связанные материалы

- [Архитектура Plugin](/ru/plugins/architecture) — публичная модель возможностей и структуры
- [Подпути Plugin SDK](/ru/plugins/sdk-subpaths)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание Plugin](/ru/plugins/building-plugins)
