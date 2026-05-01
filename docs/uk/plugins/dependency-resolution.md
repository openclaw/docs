---
read_when:
    - Ви налагоджуєте відновлення залежностей середовища виконання вбудованого Plugin
    - Ви змінюєте поведінку запуску Plugin, doctor або встановлення через менеджер пакетів
    - Ви супроводжуєте пакетні встановлення OpenClaw або маніфести вбудованих Plugin
sidebarTitle: Dependencies
summary: Як OpenClaw планує, готує та відновлює залежності середовища виконання вбудованих Plugin
title: Розв’язання залежностей Plugin
x-i18n:
    generated_at: "2026-05-01T07:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw не встановлює все дерево залежностей кожного bundled plugin під час встановлення пакета. Спочатку він виводить ефективний план plugin з конфігурації та метаданих plugin, а потім готує runtime-залежності лише для bundled plugins, що належать OpenClaw, які цей план справді може завантажити.

Ця сторінка описує пакетовані runtime-залежності для bundled OpenClaw plugins. Сторонні plugins і власні шляхи plugin і надалі використовують явні команди встановлення plugin, як-от `openclaw plugins install` і `openclaw plugins update`.

## Розподіл відповідальності

OpenClaw відповідає за план і політику:

- які plugins активні для цієї конфігурації
- які корені залежностей доступні для запису або лише для читання
- коли дозволено repair
- які ідентифікатори plugin готуються для запуску
- фінальні перевірки перед імпортом runtime-модулів plugin

Менеджер пакетів відповідає за збіжність залежностей:

- розв’язання графа пакетів
- обробку production, optional і peer залежностей
- структуру `node_modules`
- цілісність пакетів
- метадані lock і install

На практиці OpenClaw має вирішувати, що повинно існувати. `pnpm` або `npm` мають привести файлову систему у відповідність до цього рішення.

OpenClaw також відповідає за координаційний lock для кожного install-root. Менеджери пакетів захищають власну install-транзакцію, але вони не серіалізують записи manifest OpenClaw, копіювання/перейменування isolated-stage, фінальну валідацію або імпорт plugin відносно іншого процесу Gateway, doctor чи CLI, який торкається того самого кореня runtime-залежностей.

## Ефективний план plugin

Ефективний план plugin виводиться з конфігурації разом із виявленими метаданими plugin. Ці вхідні дані можуть активувати runtime-залежності bundled plugin:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` і `plugins.enabled`
- legacy-конфігурація channel, як-от `channels.telegram.enabled`
- налаштовані providers, models або CLI backend references, яким потрібен plugin
- стандартні значення bundled manifest, як-от `enabledByDefault`
- індекс установлених plugin і метадані bundled manifest

Явне вимкнення має пріоритет. Вимкнений plugin, заборонений ідентифікатор plugin, вимкнена система plugin або вимкнений channel не запускають repair runtime-залежностей. Лише збережений auth state також не активує bundled channel або provider.

План plugin є стабільним входом. Згенерована матеріалізація залежностей є виходом цього плану.

## Потік запуску

Під час запуску Gateway розбирає конфігурацію та будує startup plugin lookup table до завантаження runtime-модулів plugin. Потім startup готує runtime-залежності лише для `startupPluginIds`, вибраних цим планом.

Для пакетованих установлень staging залежностей дозволено перед імпортом plugin. Після staging runtime loader імпортує startup plugins із вимкненим install repair; у цей момент відсутня матеріалізація залежностей вважається load failure, а не ще одним циклом repair.

Коли staging startup-залежностей відкладено за HTTP bind, готовність Gateway залишається заблокованою через причину `plugin-runtime-deps`, доки залежності вибраних startup plugin не буде матеріалізовано і runtime startup plugin не завантажиться.

## Коли запускається repair

Repair runtime-залежностей має запускатися, коли істинне одне з наведеного:

- ефективний план plugin змінився і додає bundled plugins, яким потрібні runtime-залежності
- згенерований manifest залежностей більше не відповідає ефективному плану
- очікувані sentinels установлених пакетів відсутні або неповні
- було запрошено `openclaw doctor --fix` або `openclaw plugins deps --repair`

Repair runtime-залежностей не має запускатися лише тому, що OpenClaw стартував. Звичайний startup із незміненим планом і повною матеріалізацією залежностей має пропускати роботу менеджера пакетів.

Команди, які редагують конфігурацію, вмикають plugins або виправляють знахідки doctor, можуть один раз увійти в режим плану plugin, матеріалізувати нові потрібні bundled-залежності, а потім повернутися до звичайного потоку команди. Локальні `openclaw onboard` і `openclaw configure` роблять це автоматично після успішного запису конфігурації, тож наступний запуск Gateway не виявляє відсутніх пакетів bundled plugin після того, як startup уже почався. Віддалений onboarding/configure залишається read-only для локальних runtime deps.

## Правило hot reload

Шляхи hot reload, які можуть змінювати активні plugins, мають знову пройти через режим плану plugin перед завантаженням runtime plugin. Reload має порівняти новий ефективний план plugin із попереднім, підготувати відсутні залежності для новоактивних bundled plugins, а потім завантажити або перезапустити відповідний runtime.

Якщо reload конфігурації не змінює ефективний план plugin, він не має ремонтувати bundled runtime-залежності.

## Виконання менеджера пакетів

OpenClaw записує згенерований install manifest для вибраних bundled runtime-залежностей і запускає менеджер пакетів у корені встановлення runtime-залежностей. Він надає перевагу `pnpm`, коли той доступний, і повертається до bundled з Node runner `npm`.

Шлях `pnpm` використовує production-залежності, вимикає lifecycle scripts, ігнорує workspace і тримає store всередині install root:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

Fallback `npm` використовує безпечний wrapper встановлення npm із production-залежностями, вимкненими lifecycle scripts, вимкненим workspace mode, вимкненим audit, вимкненим fund output, legacy-поведінкою peer dependency і ввімкненим package-lock output для згенерованого install root.

Після install OpenClaw валідує staged дерево залежностей перед тим, як зробити його видимим для кореня runtime-залежностей. Isolated staging копіюється в корінь runtime-залежностей і валідується повторно.

Уся секція repair/materialization захищена install-root lock. Поточні власники lock записують PID, час старту процесу, коли він доступний, і час створення. Legacy locks без доказів часу старту процесу або часу створення reclaim виконують лише за віком файлової системи, тож перероблені Docker PID 1 locks відновлюються без завершення нормальних довготривалих поточних install лише за віком.

## Install roots

Пакетовані встановлення не повинні змінювати read-only директорії пакетів. OpenClaw може читати корені залежностей із пакетованих шарів, але записує згенеровані runtime-залежності у writable stage, як-от:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` в установленнях container-style

Writable root є фінальною ціллю матеріалізації. Старіші read-only roots зберігаються як шари сумісності лише за потреби.

Коли пакетоване оновлення OpenClaw змінює versioned writable root, але вибраний план залежностей bundled-plugin все ще задовольняється попереднім staged root, repair повторно використовує попереднє дерево `node_modules` замість повторного запуску менеджера пакетів. Новий versioned root усе одно отримує власне поточне package runtime mirror, тож код plugin надходить із поточного пакета OpenClaw, а незмінені дерева залежностей спільно використовуються між оновленнями. Reuse пропускає попередні roots з активним OpenClaw runtime-dependency lock, тому новий root не посилається на дерево залежностей, яке інший процес Gateway, doctor або CLI зараз ремонтує.

## Doctor і команди CLI

Використовуйте `plugins deps`, щоб переглядати або ремонтувати матеріалізацію runtime-залежностей bundled plugin:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Використовуйте doctor, коли стан залежностей є частиною ширшого install health:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` і doctor працюють із runtime-залежностями bundled plugin, що належать OpenClaw і вибрані ефективним планом plugin. Вони не є командами встановлення або оновлення сторонніх plugin.

## Усунення несправностей

Якщо пакетоване встановлення повідомляє про відсутні bundled runtime-залежності:

1. Запустіть `openclaw plugins deps --json`, щоб переглянути вибраний план і відсутні пакети.
2. Запустіть `openclaw plugins deps --repair` або `openclaw doctor --fix`, щоб відремонтувати writable dependency stage.
3. Якщо install root доступний лише для читання, встановіть `OPENCLAW_PLUGIN_STAGE_DIR` на writable path і повторно запустіть repair.
4. Перезапустіть Gateway після repair, якщо відсутня залежність заблокувала завантаження startup plugin.

У source checkouts workspace install зазвичай надає залежності bundled plugin. Запустіть `pnpm install` для repair залежностей source замість того, щоб першим кроком використовувати repair пакетованих runtime-залежностей.
