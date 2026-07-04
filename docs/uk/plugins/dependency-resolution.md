---
read_when:
    - Ви налагоджуєте встановлення пакетів плагінів
    - Ви змінюєте поведінку запуску plugin, doctor або встановлення через менеджер пакетів
    - Ви підтримуєте пакетовані інсталяції OpenClaw або маніфести вбудованих Plugin
sidebarTitle: Dependencies
summary: Як OpenClaw встановлює пакети Plugin і розв’язує залежності Plugin
title: Розв’язання залежностей Plugin
x-i18n:
    generated_at: "2026-07-04T15:35:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw залишає роботу із залежностями плагінів на час інсталяції/оновлення. Завантаження під час виконання
не запускає менеджери пакетів, не відновлює дерева залежностей і не змінює каталог
пакета OpenClaw.

## Розподіл відповідальності

Пакети плагінів володіють своїм графом залежностей:

- runtime-залежності розміщуються в `dependencies` або
  `optionalDependencies` пакета плагіна
- імпорти SDK/core є peer-залежностями або наданими імпортами OpenClaw
- плагіни локальної розробки приносять власні вже встановлені залежності
- плагіни npm і git встановлюються в корені пакетів, що належать OpenClaw

OpenClaw володіє лише життєвим циклом плагіна:

- виявити джерело плагіна
- встановити або оновити пакет за явним запитом
- записати метадані інсталяції
- завантажити entrypoint плагіна
- завершитися з дієвою помилкою, коли залежностей бракує

## Корені інсталяції

OpenClaw використовує стабільні корені для кожного джерела:

- npm-пакети встановлюються в проєкти для кожного плагіна під
  `~/.openclaw/npm/projects/<encoded-package>`
- git-пакети клонуються під `~/.openclaw/git`
- локальні/path/archive-інсталяції копіюються або посилаються без відновлення залежностей

npm-інсталяції виконуються в цьому корені проєкту для плагіна з:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` використовує той самий npm-корінь
проєкту для плагіна для локального tarball `npm-pack`. OpenClaw читає npm-метадані
tarball, додає його до керованого проєкту як скопійовану залежність `file:`, запускає
звичайну npm-інсталяцію, а потім перевіряє метадані встановленого lockfile, перш ніж
довіряти плагіну.
Це призначено для package-acceptance і доказу release-candidate, коли локальний
pack-артефакт має поводитися як registry-артефакт, який він імітує.

Використовуйте `npm-pack:` під час тестування офіційних або зовнішніх пакетів плагінів перед
публікацією. Сирий archive або path install корисний для локального налагодження, але він
не доводить той самий шлях залежностей, що й встановлений npm- або ClawHub-пакет.
`npm-pack:` доводить форму інсталяції керованого пакета; сам по собі він не є
доказом, що плагін є офіційним вмістом, пов’язаним із каталогом.

Коли поведінка залежить від bundled-plugin або статусу довіреного офіційного плагіна, поєднуйте
доказ локального пакета з офіційною інсталяцією на основі каталогу або опублікованим
шляхом пакета, який записує офіційну довіру. Привілейований доступ до helper і
обробку trusted-official scope слід перевіряти на цьому довіреному шляху інсталяції,
а не виводити з локальної інсталяції tarball.

Якщо плагін завершується під час виконання через відсутній імпорт, виправте manifest пакета
замість ручного відновлення керованого проєкту. Runtime-імпорти належать до
`dependencies` або `optionalDependencies` пакета плагіна; `devDependencies` не
встановлюються для керованих runtime-проєктів. Локальний `npm install` всередині
`~/.openclaw/npm/projects/<encoded-package>` може тимчасово розблокувати діагностику,
але це не є доказом package-acceptance, бо наступна інсталяція або оновлення
відтворить проєкт із метаданих пакета.

npm може hoist транзитивні залежності до `node_modules` проєкту для плагіна
поруч із пакетом плагіна. OpenClaw сканує корінь керованого проєкту перед тим, як
довіряти інсталяції, і видаляє цей проєкт під час uninstall, тому hoisted runtime-залежності
залишаються всередині межі очищення цього плагіна.

Опубліковані npm-пакети плагінів можуть постачати `npm-shrinkwrap.json`. npm використовує цей
публіковний lockfile під час інсталяції, а керований npm-корінь проєкту OpenClaw
підтримує його через звичайний шлях npm-інсталяції. Публіковні пакети плагінів,
що належать OpenClaw, мають містити package-local shrinkwrap, згенерований із
опублікованого графа залежностей цього пакета плагіна:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Генератор вилучає `devDependencies` плагіна, застосовує політику workspace override
і записує `extensions/<id>/npm-shrinkwrap.json` для кожного плагіна `publishToNpm`.
Пакети сторонніх плагінів також можуть постачати shrinkwrap; OpenClaw не вимагає
його для community-пакетів, але npm врахує його, якщо він присутній.

Перш ніж розглядати локальний пакет як доказ release-candidate, перевірте tarball,
який буде встановлено:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Для змін залежностей також перевірте, що production-інсталяція може resolve
runtime-пакети без dev-залежностей:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

npm-пакети плагінів, що належать OpenClaw, також можуть публікуватися з явними
`bundledDependencies`. Шлях публікації npm накладає список назв runtime-залежностей,
видаляє dev-only workspace-метадані з опублікованого manifest пакета, запускає
script-free npm-інсталяцію для package-local runtime-залежностей, а потім пакує або
публікує tarball плагіна з включеними файлами цих залежностей. Пакети з великою кількістю
native-залежностей, зокрема runtime Codex і ACP, вимикають це через
`openclaw.release.bundleRuntimeDependencies: false`; ці пакети все ще постачають свій
shrinkwrap, але npm resolve runtime-залежності під час інсталяції замість вбудовування
кожного platform binary в tarball плагіна. Кореневий пакет `openclaw` не bundle
повне дерево своїх залежностей.

Плагіни, які імпортують `openclaw/plugin-sdk/*`, оголошують `openclaw` як peer
dependency. OpenClaw не дозволяє npm встановлювати окрему registry-копію host-пакета
в керований проєкт, бо застарілі host-пакети можуть впливати на npm peer resolution
всередині цього плагіна. Керовані npm-інсталяції пропускають npm peer
resolution/materialization, а OpenClaw повторно встановлює локальні для плагіна
посилання `node_modules/openclaw` для встановлених пакетів, які оголошують host peer,
після інсталяції або оновлення.

git-інсталяції клонують або оновлюють репозиторій, потім запускають:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Після цього встановлений плагін завантажується з каталогу цього пакета, тож package-local
і parent `node_modules` resolution працює так само, як для звичайного
Node-пакета.

## Локальні плагіни

Локальні плагіни розглядаються як каталоги під контролем розробника. OpenClaw не
запускає для них `npm install`, `pnpm install` або відновлення залежностей. Якщо локальний
плагін має залежності, встановіть їх у цьому плагіні перед його завантаженням.

Сторонні локальні TypeScript-плагіни можуть використовувати emergency Jiti path. Запаковані
JavaScript-плагіни та bundled internal plugins завантажуються через native
import/require замість Jiti.

## Запуск і перезавантаження

Запуск Gateway і перезавантаження config ніколи не встановлюють залежності плагінів. Вони читають
записи інсталяції плагінів, обчислюють entrypoint і завантажують його.

Якщо під час виконання бракує залежності, плагін не завантажується, а помилка
має спрямувати оператора до явного виправлення:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` може очищати legacy-стан залежностей, згенерований OpenClaw, і відновлювати
downloadable plugins, яких бракує в локальних записах інсталяції, коли config
посилається на них. Doctor не відновлює залежності для вже встановленого локального
плагіна.

## Bundled plugins

Легкі та критично важливі для core bundled plugins постачаються як частина OpenClaw.
Вони або не повинні мати важкого runtime-дерева залежностей, або мають бути винесені
в downloadable package на ClawHub/npm.

Поточний згенерований список плагінів, які постачаються в core package, встановлюються
зовнішньо або залишаються source-only, див. в [Інвентарі Plugin](/uk/plugins/plugin-inventory).

Manifest bundled plugin не повинен запитувати dependency staging. Велику або optional
функціональність плагіна слід пакувати як звичайний плагін і встановлювати через
той самий шлях npm/git/ClawHub, що й сторонні плагіни.

У source checkout OpenClaw розглядає репозиторій як pnpm monorepo. Після
`pnpm install` bundled plugins завантажуються з `extensions/<id>`, тому package-local
workspace-залежності доступні, а редагування підхоплюються напряму. Розробка в source
checkout є лише pnpm-only; звичайний `npm install` у корені репозиторію не є
підтримуваним способом підготовки залежностей bundled plugin.

| Форма інсталяції                 | Розташування bundled plugin           | Власник залежностей                                                  |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Зібране runtime-дерево всередині пакета | Пакет OpenClaw і явні потоки install/update/doctor плагінів          |
| Git checkout плюс `pnpm install` | Workspace-пакети `extensions/<id>`    | pnpm workspace, включно з власними залежностями кожного пакета плагіна |
| `openclaw plugins install ...`   | Керований npm-проєкт/git/ClawHub-корінь | Потік install/update плагіна                                         |

## Очищення legacy

Старіші версії OpenClaw генерували корені залежностей bundled-plugin під час запуску або
під час відновлення doctor. Поточне очищення doctor видаляє ці застарілі каталоги та
symlink, коли використовується `--fix`, зокрема старі корені `plugin-runtime-deps`, глобальні
symlink пакетів Node-prefix, що вказують на pruned цілі `plugin-runtime-deps`,
manifest `.openclaw-runtime-deps*`, згенеровані plugin `node_modules`, каталоги
install stage і package-local pnpm stores. Packaged postinstall також видаляє ці
глобальні symlink перед pruning legacy target roots, щоб оновлення не залишали
dangling ESM package imports.

Старіші npm-інсталяції також використовували спільний корінь `~/.openclaw/npm/node_modules`.
Поточні потоки install, update, uninstall і doctor все ще розпізнають цей legacy
flat root лише для відновлення та очищення. Нові npm-інсталяції мають створювати
корені проєктів для кожного плагіна натомість.
