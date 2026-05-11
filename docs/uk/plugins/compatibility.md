---
read_when:
    - Ви супроводжуєте OpenClaw Plugin
    - Ви бачите попередження про сумісність Plugin
    - Ви плануєте міграцію SDK для Plugin або маніфесту
summary: Контракти сумісності Plugin, метадані застарівання та очікування щодо міграції
title: Сумісність Plugin
x-i18n:
    generated_at: "2026-05-11T20:47:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw зберігає старіші контракти plugin підключеними через іменовані адаптери сумісності перед їх видаленням. Це захищає наявні вбудовані та зовнішні plugins, поки розвиваються контракти SDK, manifest, налаштування, конфігурації та agent runtime.

## Реєстр сумісності

Контракти сумісності plugin відстежуються в основному реєстрі за адресою
`src/plugins/compat/registry.ts`.

Кожен запис має:

- стабільний код сумісності
- статус: `active`, `deprecated`, `removal-pending` або `removed`
- власник: SDK, конфігурація, налаштування, канал, provider, виконання plugin, agent runtime
  або core
- дати впровадження та застарівання, коли застосовно
- рекомендації щодо заміни
- документація, діагностика та тести, що покривають стару й нову поведінку

Реєстр є джерелом для планування супровідниками та майбутніх перевірок інспектора plugin. Якщо поведінка, видима для plugin, змінюється, додайте або оновіть запис сумісності в тій самій зміні, яка додає адаптер.

Сумісність виправлення й міграції Doctor відстежується окремо за адресою
`src/commands/doctor/shared/deprecation-compat.ts`. Ці записи покривають старі форми конфігурації, структури журналу встановлень і repair shims, які можуть потребувати збереження після видалення шляху runtime-сумісності.

Під час перевірок релізу слід перевіряти обидва реєстри. Не видаляйте міграцію Doctor лише тому, що відповідний запис runtime- або config-сумісності завершився; спочатку перевірте, що немає підтримуваного шляху оновлення, який усе ще потребує виправлення. Також повторно перевіряйте кожну анотацію заміни під час планування релізу, оскільки власність plugin і конфігураційний обсяг можуть змінюватися, коли providers і канали переміщуються з core.

## Пакет інспектора plugin

Інспектор plugin має жити поза основним репозиторієм OpenClaw як окремий пакет/репозиторій, що спирається на версіоновані контракти сумісності та manifest.

CLI першого дня має бути:

```sh
openclaw-plugin-inspector ./my-plugin
```

Він має виводити:

- перевірку manifest/schema
- версію сумісності контракту, що перевіряється
- перевірки метаданих встановлення/джерела
- перевірки імпорту холодного шляху
- попередження про застарівання та сумісність

Використовуйте `--json` для стабільного машинозчитуваного виводу в CI-анотаціях. Core OpenClaw має надавати контракти та fixtures, які інспектор може споживати, але не має публікувати бінарний файл інспектора з основного пакета `openclaw`.

### Лінія приймання для супровідників

Використовуйте Crabbox-backed Blacksmith Testbox для лінії приймання installable-package під час перевірки зовнішнього інспектора з пакетами plugin OpenClaw. Запускайте її з чистого checkout OpenClaw після збирання пакета:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Залишайте цю лінію opt-in для супровідників, оскільки вона встановлює зовнішній npm-пакет і може перевіряти пакети plugin, клоновані поза репозиторієм. Локальні guards репозиторію покривають export map SDK, метадані реєстру сумісності, скорочення застарілих SDK-імпортів і межі імпорту вбудованих extensions; доказ інспектора Testbox покриває пакет так, як його споживають автори зовнішніх plugin.

## Політика застарівання

OpenClaw не має видаляти документований контракт plugin у тому самому релізі, який вводить його заміну.

Послідовність міграції така:

1. Додайте новий контракт.
2. Залиште стару поведінку підключеною через іменований адаптер сумісності.
3. Виводьте діагностику або попередження, коли автори plugin можуть діяти.
4. Задокументуйте заміну й часові межі.
5. Протестуйте старий і новий шляхи.
6. Дочекайтеся оголошеного вікна міграції.
7. Видаляйте лише з явним схваленням breaking-release.

Застарілі записи мають містити дату початку попереджень, заміну, посилання на документацію та остаточну дату видалення не пізніше ніж через три місяці після початку попереджень. Не додавайте застарілий шлях сумісності з відкритим вікном видалення, якщо супровідники явно не вирішили, що це постійна сумісність, і не позначили його як `active` натомість.

## Поточні сфери сумісності

Поточні записи сумісності включають:

- застарілі широкі імпорти SDK, як-от `openclaw/plugin-sdk/compat`
- застарілі форми plugin лише з hooks і `before_agent_start`
- застарілі entrypoints plugin `activate(api)`, поки plugins мігрують на
  `register(api)`
- застарілі SDK aliases, як-от `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builders статусів `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (замінені на сфокусовані тестові subpaths
  `openclaw/plugin-sdk/*`) і type aliases `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist і поведінка enablement для вбудованих plugin
- застарілі метадані manifest для env-var provider/channel
- застарілі hooks і type aliases provider plugin, поки providers переходять на
  явні hooks catalog, auth, thinking, replay і transport
- застарілі runtime aliases, як-от `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, і застарілі
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- застаріла split registration memory-plugin, поки memory plugins переходять на
  `registerMemoryCapability`
- застарілі helpers channel SDK для native message schemas, mention gating,
  форматування inbound envelope і вкладення approval capability
- застарілі aliases для channel route key і comparable-target helper, поки plugins
  переходять на `openclaw/plugin-sdk/channel-route`
- activation hints, які замінюються власністю manifest contribution
- runtime fallback `setup-api`, поки setup descriptors переходять на холодні метадані
  `setup.requiresRuntime: false`
- hooks `discovery` provider, поки hooks provider catalog переходять на
  `catalog.run(...)`
- метадані channel `showConfigured` / `showInSetup`, поки пакети channel переходять
  на `openclaw.channel.exposure`
- застарілі ключі конфігурації runtime-policy, поки Doctor мігрує операторів на
  `agentRuntime`
- fallback згенерованих метаданих bundled channel config, поки впроваджуються registry-first
  метадані `channelConfigs`
- збережені env flags вимкнення реєстру plugin і install-migration, поки
  repair flows мігрують операторів на `openclaw plugins registry --refresh` і
  `openclaw doctor --fix`
- застарілі шляхи конфігурації web search, web fetch і x_search, якими володіє plugin, поки
  Doctor мігрує їх у `plugins.entries.<plugin>.config`
- застаріла authored config `plugins.installs` і aliases шляху завантаження bundled plugin,
  поки install metadata переходять у state-managed plugin ledger

Новий код plugin має віддавати перевагу заміні, зазначеній у реєстрі та конкретному посібнику з міграції. Наявні plugins можуть продовжувати використовувати шлях сумісності, доки документація, діагностика й release notes не оголосять вікно видалення.

## Примітки до релізу

Примітки до релізу мають містити майбутні застарівання plugin із цільовими датами та посиланнями на документацію з міграції. Це попередження має відбутися до того, як шлях сумісності перейде в `removal-pending` або `removed`.
