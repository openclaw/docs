---
read_when:
    - Вы хотите установить Plugin для Gateway или совместимые пакеты либо управлять ими
    - Вы хотите создать каркас или проверить простой Plugin инструмента
    - Вы хотите отладить сбои загрузки Plugin
sidebarTitle: Plugins
summary: Справочник CLI для `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагины
x-i18n:
    generated_at: "2026-06-28T22:45:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Управляйте Plugin-компонентами Gateway, наборами хуков и совместимыми бандлами.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ru/tools/plugin">
    Руководство для конечных пользователей по установке, включению и устранению неполадок Plugin-компонентов.
  </Card>
  <Card title="Manage plugins" href="/ru/plugins/manage-plugins">
    Краткие примеры установки, просмотра списка, обновления, удаления и публикации.
  </Card>
  <Card title="Plugin bundles" href="/ru/plugins/bundles">
    Модель совместимости бандлов.
  </Card>
  <Card title="Plugin manifest" href="/ru/plugins/manifest">
    Поля манифеста и схема конфигурации.
  </Card>
  <Card title="Security" href="/ru/gateway/security">
    Усиление безопасности для установок Plugin-компонентов.
  </Card>
</CardGroup>

## Команды

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Для расследования медленной установки, проверки, удаления или обновления реестра запустите
команду с `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трассировка записывает длительность фаз
в stderr и сохраняет JSON-вывод пригодным для разбора. См. [Отладка](/ru/help/debugging#plugin-lifecycle-trace).

<Note>
В режиме Nix (`OPENCLAW_NIX_MODE=1`) изменяющие операции жизненного цикла Plugin-компонентов отключены. Используйте источник Nix для этой установки вместо `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` или `plugins disable`; для nix-openclaw используйте ориентированный на агента [Быстрый старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Встроенные Plugin-компоненты поставляются вместе с OpenClaw. Некоторые включены по умолчанию (например, встроенные поставщики моделей, встроенные поставщики речи и встроенный браузерный Plugin); для остальных требуется `plugins enable`.

Нативные Plugin-компоненты OpenClaw должны поставлять `openclaw.plugin.json` со встроенной JSON Schema (`configSchema`, даже если она пустая). Совместимые бандлы вместо этого используют собственные манифесты бандлов.

`plugins list` показывает `Format: openclaw` или `Format: bundle`. Подробный вывод list/info также показывает подтип бандла (`codex`, `claude` или `cursor`) и обнаруженные возможности бандла.
</Note>

### Автор

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` по умолчанию создает минимальный Plugin инструмента на TypeScript. Первый
аргумент — идентификатор Plugin; передайте `--name` для отображаемого имени. OpenClaw использует
идентификатор для каталога вывода по умолчанию и именования пакета. Каркасы инструментов используют
`defineToolPlugin`.
`plugins build` импортирует собранную точку входа, читает ее статические метаданные инструмента, записывает
`openclaw.plugin.json` и поддерживает `package.json` `openclaw.extensions` в актуальном состоянии.
`plugins validate` проверяет, что сгенерированный манифест, метаданные пакета и
текущий экспорт точки входа по-прежнему согласованы. Полный рабочий процесс создания инструментов см. в
[Plugin-компоненты инструментов](/ru/plugins/tool-plugins).

Каркас записывает исходный код TypeScript, но генерирует метаданные из собранной
точки входа `./dist/index.js`, поэтому рабочий процесс также работает с опубликованным CLI. Используйте
`--entry <path>`, если точка входа не является точкой входа пакета по умолчанию. Используйте
`plugins build --check` в CI, чтобы завершать выполнение с ошибкой, когда сгенерированные метаданные устарели, без
перезаписи файлов.

### Каркас поставщика

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Каркасы поставщиков создают универсальный Plugin поставщика текста/моделей с OpenAI-совместимой
обвязкой API-ключа, встроенным скриптом `npm run validate` для `clawhub package
validate`, метаданными пакета ClawHub и запускаемым вручную workflow GitHub
для будущей доверенной публикации через GitHub Actions OIDC. Каркасы поставщиков не
генерируют Skills и не используют `openclaw plugins build` или
`openclaw plugins validate`; эти команды предназначены для пути сгенерированных метаданных
каркаса инструмента.

Перед публикацией замените базовый URL API-заполнитель, каталог моделей, маршрут документации,
текст учетных данных и текст README реальными сведениями о поставщике. Используйте
сгенерированный README для первой публикации в ClawHub и настройки доверенного издателя.

### Установка

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Мейнтейнеры, тестирующие установки во время настройки, могут переопределять автоматические источники установки Plugin-компонентов
с помощью защищенных переменных окружения. См.
[Переопределения установки Plugin-компонентов](/ru/plugins/install-overrides).

<Warning>
Голые имена пакетов по умолчанию устанавливаются из npm во время переходного периода запуска, если они не совпадают с официальным идентификатором Plugin. Необработанные спецификации пакетов `@openclaw/*`, совпадающие со встроенными Plugin-компонентами, используют встроенную копию, поставленную с текущей сборкой OpenClaw. Используйте `npm:<package>`, когда намеренно хотите внешний npm-пакет. Используйте `clawhub:<package>` для ClawHub. Относитесь к установкам Plugin-компонентов как к запуску кода. Предпочитайте закрепленные версии.
</Warning>

`plugins search` запрашивает ClawHub на наличие устанавливаемых пакетов Plugin-компонентов и выводит
готовые к установке имена пакетов. Он ищет пакеты code-plugin и bundle-plugin,
а не Skills. Используйте `openclaw skills search` для Skills в ClawHub.

<Note>
ClawHub — основная поверхность распространения и обнаружения для большинства Plugin-компонентов. Npm
остается поддерживаемым резервным вариантом и путем прямой установки. Принадлежащие OpenClaw
пакеты Plugin-компонентов `@openclaw/*` снова публикуются в npm; см. текущий список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) или в
[инвентаре Plugin-компонентов](/ru/plugins/plugin-inventory). Стабильные установки используют `latest`.
Установки и обновления beta-канала предпочитают npm dist-tag `beta`, когда этот тег
доступен, а затем откатываются к `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Если ваш раздел `plugins` поддерживается однофайловым `$include`, `plugins install/update/enable/disable/uninstall` записывают изменения в этот подключенный файл и оставляют `openclaw.json` нетронутым. Корневые include, массивы include и include с соседними переопределениями завершаются закрыто вместо выравнивания. Поддерживаемые формы см. в [Config includes](/ru/gateway/configuration).

    Если конфигурация недействительна во время установки, `plugins install` обычно завершается закрыто и предлагает сначала запустить `openclaw doctor --fix`. Во время запуска Gateway и горячей перезагрузки недействительная конфигурация Plugin-компонента завершается закрыто, как и любая другая недействительная конфигурация; `openclaw doctor --fix` может изолировать недействительную запись Plugin. Единственное документированное исключение во время установки — узкий путь восстановления встроенного Plugin для Plugin-компонентов, которые явно включают `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно использует существующую цель установки и перезаписывает уже установленный Plugin или набор хуков на месте. Используйте его, когда намеренно переустанавливаете тот же идентификатор из нового локального пути, архива, пакета ClawHub или артефакта npm. Для обычных обновлений уже отслеживаемого npm Plugin предпочитайте `openclaw plugins update <id-or-npm-spec>`.

    Если вы запускаете `plugins install` для идентификатора Plugin, который уже установлен, OpenClaw останавливается и указывает на `plugins update <id-or-npm-spec>` для обычного обновления или на `plugins install <package> --force`, когда вы действительно хотите перезаписать текущую установку из другого источника.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` применяется только к установкам npm. Он не поддерживается с установками `git:`; используйте явную ссылку git, например `git:github.com/acme/plugin@v1.2.3`, когда вам нужен закрепленный источник. Он не поддерживается с `--marketplace`, потому что установки из marketplace сохраняют метаданные источника marketplace вместо спецификации npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` устарел и теперь является no-op. OpenClaw больше не выполняет встроенную блокировку опасного кода во время установки для Plugin-компонентов.

    Используйте общую поверхность `security.installPolicy`, принадлежащую оператору, когда требуется политика установки, специфичная для хоста. Хуки Plugin `before_install` являются хуками жизненного цикла среды выполнения Plugin и не являются основной границей политики для установок CLI.

    Если Plugin, опубликованный вами в ClawHub, скрыт или заблокирован сканированием реестра, используйте шаги издателя в [публикации ClawHub](/ru/clawhub/publishing). `--dangerously-force-unsafe-install` не просит ClawHub повторно сканировать Plugin или делать заблокированный выпуск публичным.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Установки из сообщества ClawHub проверяют запись доверия выбранного выпуска перед скачиванием пакета. Если ClawHub отключает скачивание для выпуска, сообщает о вредоносных результатах сканирования или помещает выпуск в блокирующее состояние модерации, например карантин, OpenClaw отклоняет выпуск. Для неблокирующих рискованных статусов сканирования, рискованных состояний модерации или причин реестра OpenClaw показывает сведения о доверии и просит подтверждение перед продолжением.

    Используйте `--acknowledge-clawhub-risk` только после просмотра предупреждения ClawHub и принятия решения продолжить без интерактивного запроса. Ожидающие или устаревшие чистые записи доверия предупреждают, но не требуют подтверждения. Официальные пакеты ClawHub и встроенные источники Plugin-компонентов OpenClaw обходят этот запрос доверия к выпуску.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` также является поверхностью установки для наборов хуков, которые раскрывают `openclaw.hooks` в `package.json`. Используйте `openclaw hooks` для фильтрованной видимости хуков и включения отдельных хуков, а не для установки пакетов.

    Спецификации npm поддерживаются **только из реестра** (имя пакета + необязательная **точная версия** или **dist-tag**). Спецификации Git/URL/file и диапазоны semver отклоняются. Установка зависимостей выполняется в одном управляемом npm-проекте на плагин с `--ignore-scripts` для безопасности, даже если в вашей оболочке настроены глобальные параметры установки npm. Управляемые npm-проекты плагинов наследуют npm `overrides` уровня пакета OpenClaw, поэтому защитные закрепления хоста применяются и к поднятым зависимостям плагинов.

    Используйте `npm:<package>`, когда нужно явно указать разрешение через npm. Голые спецификации пакетов также устанавливаются напрямую из npm во время переходного периода запуска, если они не совпадают с официальным идентификатором плагина.

    Необработанные спецификации пакетов `@openclaw/*`, совпадающие с включенными плагинами, разрешаются в принадлежащую образу включенную копию до отката к npm. Например, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` использует включенный плагин Discord из текущей сборки OpenClaw вместо создания управляемого npm-переопределения. Чтобы принудительно использовать внешний npm-пакет, выполните `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Голые спецификации и `@latest` остаются на стабильной ветке. Версии исправлений OpenClaw с датой, такие как `2026.5.3-1`, для этой проверки считаются стабильными выпусками. Если npm разрешает любой из этих вариантов в предварительный выпуск, OpenClaw останавливается и просит явно согласиться с помощью тега предварительного выпуска, например `@beta`/`@rc`, или точной версии предварительного выпуска, например `@1.2.3-beta.4`.

    Для установок npm без точной версии (`npm:<package>` или `npm:<package>@latest`) OpenClaw проверяет разрешенные метаданные пакета перед установкой. Если последний стабильный пакет требует более новую версию API плагинов OpenClaw или минимальную версию хоста, OpenClaw просматривает более старые стабильные версии и устанавливает самый новый совместимый выпуск. Точные версии и явные dist-tags, такие как `@beta`, остаются строгими: если выбранный пакет несовместим, команда завершается ошибкой и просит обновить OpenClaw или выбрать совместимую версию.

    Если голая спецификация установки совпадает с официальным идентификатором плагина (например, `diffs`), OpenClaw устанавливает запись каталога напрямую. Чтобы установить npm-пакет с тем же именем, используйте явную scoped-спецификацию (например, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Используйте `git:<repo>` для установки напрямую из git-репозитория. Поддерживаемые формы включают `git:github.com/owner/repo`, `git:owner/repo`, полные URL клонирования `https://`, `ssh://`, `git://`, `file://` и `git@host:owner/repo.git`. Добавьте `@<ref>` или `#<ref>`, чтобы перед установкой переключиться на ветку, тег или коммит.

    Установки из Git клонируются во временный каталог, при наличии переключаются на запрошенный ref, затем используют обычный установщик каталога плагина. Это означает, что проверка манифеста, политика установки оператора, работа установки менеджера пакетов и записи установки ведут себя как при установках npm. Записанные установки из git включают исходный URL/ref и разрешенный коммит, чтобы `openclaw plugins update` мог позже заново разрешить источник.

    После установки из git используйте `openclaw plugins inspect <id> --runtime --json`, чтобы проверить регистрации времени выполнения, такие как методы Gateway и команды CLI. Если плагин зарегистрировал корень CLI с помощью `api.registerCli`, выполняйте эту команду напрямую через корневой CLI OpenClaw, например `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Поддерживаемые архивы: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Собственные архивы плагинов OpenClaw должны содержать действительный `openclaw.plugin.json` в корне извлеченного плагина; архивы, содержащие только `package.json`, отклоняются до того, как OpenClaw запишет записи установки.

    Используйте `npm-pack:<path.tgz>`, когда файл является tarball npm-pack и нужно
    протестировать тот же путь управляемого npm-проекта на плагин, который используется установками
    из реестра, включая проверку `package-lock.json`, сканирование поднятых зависимостей
    и записи установки npm. Обычные пути архивов по-прежнему устанавливаются как локальные
    архивы в корне расширений плагинов.

    Установки из Claude marketplace также поддерживаются.

  </Accordion>
</AccordionGroup>

Установки ClawHub используют явный локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голые npm-безопасные спецификации плагинов по умолчанию устанавливаются из npm во время переходного периода запуска, если они не совпадают с официальным идентификатором плагина:

```bash
openclaw plugins install openclaw-codex-app-server
```

Используйте `npm:`, чтобы явно указать разрешение только через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw проверяет объявленную совместимость API плагина / минимального Gateway перед установкой. Когда выбранная версия ClawHub публикует артефакт ClawPack, OpenClaw загружает версионированный npm-pack `.tgz`, проверяет заголовок дайджеста ClawHub и дайджест артефакта, затем устанавливает его через обычный путь архива. Более старые версии ClawHub без метаданных ClawPack по-прежнему устанавливаются через устаревший путь проверки архива пакета. Записанные установки сохраняют свои исходные метаданные ClawHub, тип артефакта, npm integrity, npm shasum, имя tarball и факты дайджеста ClawPack для последующих обновлений.
Неверсионированные установки ClawHub сохраняют неверсионированную записанную спецификацию, чтобы `openclaw plugins update` мог отслеживать более новые выпуски ClawHub; явные селекторы версии или тега, такие как `clawhub:pkg@1.2.3` и `clawhub:pkg@beta`, остаются закрепленными на этом селекторе.

#### Сокращение Marketplace

Используйте сокращение `plugin@marketplace`, когда имя marketplace существует в локальном кэше реестра Claude по адресу `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Используйте `--marketplace`, когда хотите явно передать источник маркетплейса:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Источники маркетплейса">
    - имя известного маркетплейса Claude из `~/.claude/plugins/known_marketplaces.json`
    - локальный корень маркетплейса или путь к `marketplace.json`
    - сокращение репозитория GitHub, например `owner/repo`
    - URL репозитория GitHub, например `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила удаленного маркетплейса">
    Для удаленных маркетплейсов, загруженных из GitHub или git, записи плагинов должны оставаться внутри клонированного репозитория маркетплейса. OpenClaw принимает источники с относительными путями из этого репозитория и отклоняет HTTP(S), абсолютные пути, git, GitHub и другие источники плагинов не в виде путей из удаленных манифестов.
  </Tab>
</Tabs>

Для локальных путей и архивов OpenClaw автоматически обнаруживает:

- нативные плагины OpenClaw (`openclaw.plugin.json`)
- Codex-совместимые пакеты (`.codex-plugin/plugin.json`)
- Claude-совместимые пакеты (`.claude-plugin/plugin.json` или стандартную структуру компонентов Claude)
- Cursor-совместимые пакеты (`.cursor-plugin/plugin.json`)

Управляемые локальные установки должны быть каталогами или архивами плагинов. Отдельные файлы плагинов `.js`,
`.mjs`, `.cjs` и `.ts` не копируются в управляемый корень плагинов
командой `plugins install`; вместо этого явно перечислите их в `plugins.load.paths`.

<Note>
Совместимые пакеты устанавливаются в обычный корень плагинов и участвуют в том же потоке list/info/enable/disable. Сейчас поддерживаются Skills пакетов, command-skills Claude, значения по умолчанию Claude `settings.json`, значения по умолчанию Claude `.lsp.json` / объявленные в манифесте `lspServers`, command-skills Cursor и совместимые каталоги хуков Codex; другие обнаруженные возможности пакетов показываются в диагностике/info, но пока не подключены к выполнению во время работы.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Показывать только включенные плагины.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Переключиться с табличного представления на строки сведений по каждому плагину с метаданными source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый инвентарь плюс диагностика реестра и состояние установки зависимостей пакетов.
</ParamField>

<Note>
`plugins list` сначала читает сохраненный локальный реестр плагинов, с резервным выводом только из манифестов, если реестр отсутствует или недействителен. Это полезно для проверки, установлен ли плагин, включен ли он и виден ли при планировании холодного запуска, но это не live-зонд уже запущенного процесса Gateway. После изменения кода плагина, состояния включения, политики хуков или `plugins.load.paths` перезапустите Gateway, обслуживающий канал, прежде чем ожидать выполнения нового кода `register(api)` или хуков. Для удаленных/контейнерных развертываний проверьте, что вы перезапускаете фактический дочерний процесс `openclaw gateway run`, а не только процесс-обертку.

`plugins list --json` включает `dependencyStatus` каждого плагина из `package.json`
`dependencies` и `optionalDependencies`. OpenClaw проверяет, присутствуют ли эти имена пакетов
по обычному пути поиска Node `node_modules` для плагина; он
не импортирует runtime-код плагина, не запускает пакетный менеджер и не исправляет отсутствующие
зависимости.
</Note>

Если в журналах запуска есть `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
выполните `openclaw plugins list --enabled --verbose` или
`openclaw plugins inspect <id>` с указанным идентификатором плагина, чтобы подтвердить
идентификаторы плагинов и скопировать доверенные идентификаторы в `plugins.allow` в `openclaw.json`. Когда
предупреждение может перечислить каждый обнаруженный плагин, оно выводит готовый для вставки
фрагмент `plugins.allow`, который уже включает эти идентификаторы. Если плагин загружается
без сведений о происхождении установки/load-path, проверьте этот идентификатор плагина, затем либо закрепите
доверенный идентификатор в `plugins.allow`, либо переустановите плагин из доверенного источника,
чтобы OpenClaw записал происхождение установки.

`plugins search` — это удаленный поиск по каталогу ClawHub. Он не проверяет локальное
состояние, не изменяет конфигурацию, не устанавливает пакеты и не загружает runtime-код плагина. Результаты поиска
включают имя пакета ClawHub, семейство, канал, версию, сводку и
подсказку установки, например `openclaw plugins install clawhub:<package>`.

Для работы с встроенным плагином внутри упакованного Docker-образа смонтируйте исходный каталог
плагина поверх соответствующего упакованного пути исходников, например
`/app/extensions/synology-chat`. OpenClaw обнаружит это смонтированное наложение исходников
раньше `/app/dist/extensions/synology-chat`; обычный скопированный каталог исходников
останется неактивным, поэтому обычные упакованные установки по-прежнему используют скомпилированный dist.

Для отладки runtime-хуков:

- `openclaw plugins inspect <id> --runtime --json` показывает зарегистрированные хуки и диагностику из прохода инспекции с загруженным модулем. Runtime-инспекция никогда не устанавливает зависимости; используйте `openclaw doctor --fix`, чтобы очистить устаревшее состояние зависимостей или восстановить отсутствующие загружаемые плагины, на которые ссылается конфигурация.
- `openclaw gateway status --deep --require-rpc` подтверждает доступный URL/профиль Gateway, подсказки сервиса/процесса, путь конфигурации и состояние RPC.
- Невстроенным хукам беседы (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) требуется `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Используйте `--link`, чтобы не копировать локальный каталог плагина (добавляет его в `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Отдельные файлы плагинов должны быть перечислены в `plugins.load.paths`, а не
установлены через `plugins install` или размещены напрямую в `~/.openclaw/extensions`
или `<workspace>/.openclaw/extensions`. Эти автоматически обнаруживаемые корни загружают каталоги
пакетов или пакетов-совместимостей плагинов, а скриптовые файлы верхнего уровня считаются локальными
вспомогательными файлами и пропускаются.

<Note>
Plugins из рабочей области, обнаруженные из корня `extensions` рабочей области, не
импортируются и не выполняются, пока они явно не включены. Для локальной разработки
выполните `openclaw plugins enable <plugin-id>` или задайте
`plugins.entries.<plugin-id>.enabled: true`; если ваша конфигурация использует
`plugins.allow`, также добавьте туда тот же идентификатор плагина. Это правило
fail-closed также применяется, когда настройка канала явно указывает на Plugin из
рабочей области для загрузки только при настройке, поэтому код настройки локального
плагина канала не будет выполняться, пока этот Plugin рабочей области остается
отключенным или исключенным из allowlist. Связанные установки и явные записи
`plugins.load.paths` следуют обычной политике для их разрешенного источника
плагина. См.
[Настройка политики Plugin](/ru/tools/plugin#configure-plugin-policy)
и [Справочник по конфигурации](/ru/gateway/configuration-reference#plugins).

`--force` не поддерживается вместе с `--link`, потому что связанные установки повторно используют исходный путь вместо копирования поверх управляемой цели установки.

Используйте `--pin` для установок npm, чтобы сохранить разрешенную точную спецификацию (`name@version`) в управляемом индексе плагинов, сохраняя поведение по умолчанию без закрепления.
</Note>

### Индекс Plugin

Метаданные установки Plugin — это состояние, управляемое машиной, а не пользовательская конфигурация. Установки и обновления записывают его в общую базу данных состояния SQLite в активном каталоге состояния OpenClaw. Строка `installed_plugin_index` хранит долговечные метаданные `installRecords`, включая записи для поврежденных или отсутствующих манифестов плагинов, а также производный от манифеста холодный кэш реестра, используемый `openclaw plugins update`, удалением, диагностикой и холодным реестром плагинов.

Когда OpenClaw видит поставляемые устаревшие записи `plugins.installs` в конфигурации, чтения во время выполнения рассматривают их как входные данные совместимости без перезаписи `openclaw.json`. Явные записи Plugin и `openclaw doctor --fix` переносят эти записи в индекс плагинов и удаляют ключ конфигурации, когда запись конфигурации разрешена; если какая-либо запись завершается ошибкой, записи конфигурации сохраняются, чтобы метаданные установки не были потеряны.

### Удаление

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` удаляет записи Plugin из `plugins.entries`, сохраненного индекса плагинов, записей списков разрешения/запрета плагинов и связанных записей `plugins.load.paths`, когда это применимо. Если `--keep-files` не задан, удаление также удаляет отслеживаемый каталог управляемой установки, когда он находится внутри корня расширений Plugin OpenClaw. Для плагинов активной памяти слот памяти сбрасывается на `memory-core`.

<Note>
`--keep-config` поддерживается как устаревший псевдоним для `--keep-files`.
</Note>

### Обновление

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Обновления применяются к отслеживаемым установкам Plugin в управляемом индексе плагинов и отслеживаемым установкам пакетов хуков в `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Когда вы передаете идентификатор Plugin, OpenClaw повторно использует записанную спецификацию установки для этого плагина. Это означает, что ранее сохраненные dist-tags, такие как `@beta`, и точные закрепленные версии продолжают использоваться при последующих запусках `update <id>`.

    Во время `update <id> --dry-run` точные закрепленные установки npm остаются закрепленными. Если OpenClaw также может разрешить стандартную линию реестра пакета и эта стандартная линия новее установленной закрепленной версии, пробный запуск сообщает о закреплении и выводит явную команду обновления пакета `@latest`, чтобы перейти на стандартную линию реестра.

    Это правило целевого обновления отличается от массового пути обслуживания `openclaw plugins update --all`. Массовые обновления по-прежнему учитывают обычные отслеживаемые спецификации установки, но доверенные официальные записи Plugin OpenClaw могут синхронизироваться с текущей целью официального каталога вместо сохранения устаревшего точного официального пакета. Используйте целевой `update <id>`, когда намеренно хотите оставить точную или помеченную официальную спецификацию без изменений.

    Для установок npm вы также можете передать явную спецификацию пакета npm с dist-tag или точной версией. OpenClaw разрешает имя этого пакета обратно в отслеживаемую запись Plugin, обновляет этот установленный Plugin и записывает новую спецификацию npm для будущих обновлений по идентификатору.

    Передача имени пакета npm без версии или тега также разрешается обратно в отслеживаемую запись Plugin. Используйте это, когда Plugin был закреплен на точной версии и вы хотите вернуть его к стандартной линии выпуска реестра.

  </Accordion>
  <Accordion title="Beta channel updates">
    Целевой `openclaw plugins update <id-or-npm-spec>` повторно использует отслеживаемую спецификацию Plugin, если вы не передаете новую спецификацию. Массовый `openclaw plugins update --all` использует настроенный `update.channel`, когда синхронизирует доверенные официальные записи Plugin с целью официального каталога, поэтому установки beta-канала могут оставаться на beta-линии выпуска вместо тихой нормализации до stable/latest.

    `openclaw update` также знает активный канал обновлений OpenClaw: на beta-канале записи Plugin npm и ClawHub стандартной линии сначала пробуют `@beta`. Они откатываются к записанной спецификации default/latest, если beta-выпуск Plugin не существует; Plugins npm также откатываются, когда beta-пакет существует, но не проходит проверку установки. Такой откат сообщается как предупреждение и не приводит к сбою обновления ядра. Точные версии и явные теги остаются закрепленными за этим селектором для целевых обновлений.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Перед живым обновлением npm OpenClaw сверяет установленную версию пакета с метаданными реестра npm. Если установленная версия и записанная идентичность артефакта уже совпадают с разрешенной целью, обновление пропускается без скачивания, переустановки или перезаписи `openclaw.json`.

    Когда сохраненный хэш целостности существует, а хэш полученного артефакта меняется, OpenClaw рассматривает это как дрейф артефакта npm. Интерактивная команда `openclaw plugins update` выводит ожидаемый и фактический хэши и запрашивает подтверждение перед продолжением. Неинтерактивные помощники обновления завершаются по fail-closed, если вызывающая сторона не предоставляет явную политику продолжения.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` также принимается в `plugins update` для совместимости, но он устарел и больше не меняет поведение обновления Plugin. Операторский `security.installPolicy` все еще может блокировать обновления; хуки Plugin `before_install` применяются только в процессах, где загружены хуки Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Обновления Plugin, поддерживаемые сообществом через ClawHub, выполняют ту же проверку доверия к точному выпуску, что и установки, перед скачиванием заменяющего пакета. Используйте `--acknowledge-clawhub-risk` для проверенной автоматизации, которая должна продолжаться, когда выбранный выпуск ClawHub имеет рискованное предупреждение доверия. Официальные пакеты ClawHub и встроенные источники Plugin OpenClaw обходят этот запрос доверия к выпуску.
  </Accordion>
</AccordionGroup>

### Инспекция

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Инспекция показывает идентичность, статус загрузки, источник, возможности манифеста, флаги политики, диагностику, метаданные установки, возможности пакета и любую обнаруженную поддержку серверов MCP или LSP без импорта runtime Plugin по умолчанию. Вывод JSON включает контракты манифеста Plugin, такие как `contracts.agentToolResultMiddleware` и `contracts.trustedToolPolicies`, чтобы операторы могли аудитировать объявления доверенной поверхности перед включением или перезапуском Plugin. Добавьте `--runtime`, чтобы загрузить модуль Plugin и включить зарегистрированные хуки, инструменты, команды, сервисы, методы Gateway и маршруты HTTP. Runtime-инспекция напрямую сообщает об отсутствующих зависимостях Plugin; установки и исправления остаются в `openclaw plugins install`, `openclaw plugins update` и `openclaw doctor --fix`.

CLI-команды, принадлежащие Plugin, обычно устанавливаются как корневые группы команд `openclaw`, но Plugins также могут регистрировать вложенные команды под родительской командой ядра, например `openclaw nodes`. После того как `inspect --runtime` показывает команду в `cliCommands`, запустите ее по указанному пути; например, Plugin, который регистрирует `demo-git`, можно проверить с помощью `openclaw demo-git ping`.

Каждый Plugin классифицируется по тому, что он фактически регистрирует во время выполнения:

- **plain-capability** — один тип возможности (например, Plugin только для провайдера)
- **hybrid-capability** — несколько типов возможностей (например, текст + речь + изображения)
- **hook-only** — только хуки, без возможностей или поверхностей
- **non-capability** — инструменты/команды/сервисы, но без возможностей

См. [Формы Plugin](/ru/plugins/architecture#plugin-shapes), чтобы узнать больше о модели возможностей.

<Note>
Флаг `--json` выводит машиночитаемый отчет, подходящий для скриптов и аудита. `inspect --all` отображает таблицу по всему парку с колонками формы, типов возможностей, уведомлений о совместимости, возможностей пакета и сводки хуков. `info` является псевдонимом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` сообщает об ошибках загрузки Plugin, диагностике манифеста/обнаружения, уведомлениях о совместимости и устаревших ссылках конфигурации Plugin, таких как отсутствующие слоты Plugin. Когда дерево установки и конфигурация Plugin чистые, он выводит `No plugin issues detected.` Если устаревшая конфигурация остается, но дерево установки в остальном исправно, сводка говорит об этом вместо того, чтобы подразумевать полное здоровье Plugin.

Если настроенный Plugin присутствует на диске, но заблокирован проверками безопасности путей загрузчика, проверка конфигурации сохраняет запись Plugin и сообщает о ней как `present but blocked`. Исправьте предшествующую диагностику заблокированного Plugin, например владение путем или права записи для всех, вместо удаления конфигурации `plugins.entries.<id>` или `plugins.allow`.

Для сбоев формы модуля, таких как отсутствующие экспорты `register`/`activate`, повторно запустите с `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, чтобы включить компактную сводку формы экспорта в диагностический вывод.

### Реестр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальный реестр Plugin — это сохраненная холодная модель чтения OpenClaw для идентичности установленных Plugin, включения, метаданных источника и владения вкладами. Обычный запуск, поиск владельца провайдера, классификация настройки канала и инвентаризация Plugin могут читать его без импорта runtime-модулей Plugin.

Используйте `plugins registry`, чтобы проверить, присутствует ли сохраненный реестр, актуален ли он или устарел. Используйте `--refresh`, чтобы пересобрать его из сохраненного индекса Plugin, политики конфигурации и метаданных манифеста/пакета. Это путь исправления, а не путь активации во время выполнения.

`openclaw doctor --fix` также исправляет смежный с реестром управляемый дрейф npm: если осиротевший или восстановленный пакет `@openclaw/*` в управляемом npm-проекте Plugin или устаревшем плоском управляемом корне npm затеняет встроенный Plugin, doctor удаляет этот устаревший пакет и пересобирает реестр, чтобы запуск проверялся по встроенному манифесту. Doctor также повторно связывает пакет хоста `openclaw` в управляемые npm Plugins, которые объявляют `peerDependencies.openclaw`, чтобы локальные для пакета импорты runtime, такие как `openclaw/plugin-sdk/*`, разрешались после обновлений или исправлений npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — устаревший аварийный переключатель совместимости для сбоев чтения реестра. Предпочитайте `plugins registry --refresh` или `openclaw doctor --fix`; fallback через env предназначен только для аварийного восстановления запуска, пока миграция внедряется.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` выводит список записей из настроенного фида маркетплейса OpenClaw. По умолчанию команда пытается использовать размещенный фид и при необходимости откатывается к последнему принятому снимку или встроенным данным. Используйте `--feed-profile <name>`, чтобы прочитать конкретный настроенный профиль, `--feed-url <url>`, чтобы прочитать явный URL размещенного фида, и `--offline`, чтобы прочитать последний принятый снимок без получения фида.

`plugins marketplace refresh` обновляет настроенный снимок размещенного фида и сообщает, принял ли OpenClaw размещенные данные, размещенный снимок или встроенные резервные данные. Используйте `--expected-sha256`, когда вызывающей стороне нужно, чтобы команда завершилась ошибкой, если новая размещенная полезная нагрузка не совпадает с закрепленной контрольной суммой.

Marketplace `list` принимает локальный путь маркетплейса, путь к `marketplace.json`, сокращенную запись GitHub вида `owner/repo`, URL репозитория GitHub или git URL. `--json` выводит метку разрешенного источника, а также разобранный манифест маркетплейса и записи Plugin.

Обновление Marketplace загружает размещенную ленту маркетплейса OpenClaw и сохраняет
проверенный ответ как локальный снимок размещенной ленты. Без параметров оно использует
настроенный профиль ленты по умолчанию. Используйте `--feed-profile <name>`, чтобы обновить
конкретный настроенный профиль, `--feed-url <url>`, чтобы обновить явный URL размещенной
ленты, `--expected-sha256 <sha256>`, чтобы потребовать совпадающую контрольную сумму
полезной нагрузки (`sha256:<hex>` или простой 64-символьный hex-дайджест), и `--json` для
машиночитаемого вывода. Явные URL размещенных лент не должны содержать
учетные данные, строки запроса или фрагменты. Обновления без закрепления могут сообщить о
размещенном снимке или результате встроенного резервного варианта, не завершая команду ошибкой. Закрепленные
обновления завершаются ошибкой, если они не принимают свежую размещенную полезную нагрузку, а успешные размещенные
обновления завершаются ошибкой, если OpenClaw не может сохранить проверенный снимок.

## Связанные материалы

- [Создание Plugin](/ru/plugins/building-plugins)
- [Справочник CLI](/ru/cli)
- [ClawHub](/ru/clawhub)
