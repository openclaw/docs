---
read_when:
    - Ви хочете налаштувати QMD як свій backend memory
    - Вам потрібні розширені можливості memory, як-от reranking або додаткові індексовані шляхи
summary: Локальний sidecar пошуку з пріоритетом локального виконання з BM25, векторами, reranking і розширенням запиту
title: Рушій memory QMD
x-i18n:
    generated_at: "2026-04-23T20:50:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a811b7a2ec911d5e3813e22a24a2f8a1a5e4ca8741281418d084690d809bb06
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) — це локальний sidecar пошуку з пріоритетом локального виконання, який працює
поруч з OpenClaw. Він поєднує BM25, векторний пошук і reranking в одному
бінарному файлі та може індексувати вміст за межами файлів memory вашого workspace.

## Що він додає понад вбудований варіант

- **Reranking і розширення запиту** для кращого recall.
- **Індексація додаткових каталогів** — документації проєкту, командних нотаток, будь-чого на диску.
- **Індексація транскриптів session** — для згадування попередніх розмов.
- **Повністю локальний** — працює через Bun + node-llama-cpp, автоматично завантажує моделі GGUF.
- **Автоматичний fallback** — якщо QMD недоступний, OpenClaw безшовно повертається до
  вбудованого рушія.

## Початок роботи

### Передумови

- Встановіть QMD: `npm install -g @tobilu/qmd` або `bun install -g @tobilu/qmd`
- Збірка SQLite, яка дозволяє extensions (`brew install sqlite` на macOS).
- QMD має бути в `PATH` gateway.
- macOS і Linux працюють одразу. Windows найкраще підтримується через WSL2.

### Увімкнення

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw створює самодостатній домашній каталог QMD у
`~/.openclaw/agents/<agentId>/qmd/` і автоматично керує життєвим циклом sidecar —
collections, оновлення та запуски embedding обробляються за вас.
Він надає перевагу поточним формам collection і MCP query у QMD, але все ще повертається до
застарілих прапорців collection `--mask` і старіших назв інструментів MCP, коли це потрібно.

## Як працює sidecar

- OpenClaw створює collections із файлів memory вашого workspace та будь-яких
  налаштованих `memory.qmd.paths`, а потім запускає `qmd update` + `qmd embed` під час boot
  і періодично (типово кожні 5 хвилин).
- Типова collection workspace відстежує `MEMORY.md` і дерево `memory/`.
  `memory.md` у нижньому регістрі не індексується як кореневий файл memory.
- Оновлення під час boot виконується у фоновому режимі, щоб не блокувати запуск чату.
- Пошук використовує налаштований `searchMode` (типово: `search`; також підтримує
  `vsearch` і `query`). Якщо режим не спрацьовує, OpenClaw повторює спробу з `qmd query`.
- Якщо QMD повністю виходить з ладу, OpenClaw повертається до вбудованого рушія SQLite.

<Info>
Перший пошук може бути повільним — QMD автоматично завантажує моделі GGUF (~2 GB) для
reranking і розширення запиту під час першого запуску `qmd query`.
</Info>

## Перевизначення моделей

Змінні середовища моделей QMD передаються без змін із процесу gateway,
тому ви можете глобально налаштовувати QMD без додавання нової конфігурації OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Після зміни embedding-моделі повторно запустіть embeddings, щоб індекс відповідав
новому векторному простору.

## Індексація додаткових шляхів

Спрямуйте QMD на додаткові каталоги, щоб зробити їх доступними для пошуку:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Фрагменти з додаткових шляхів з’являються як `qmd/<collection>/<relative-path>` у
результатах пошуку. `memory_get` розуміє цей префікс і читає з правильного
кореня collection.

## Індексація транскриптів session

Увімкніть індексацію session, щоб згадувати попередні розмови:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Транскрипти експортуються як очищені ходи User/Assistant у виділену QMD
collection у `~/.openclaw/agents/<id>/qmd/sessions/`.

## Область пошуку

Типово результати пошуку QMD показуються в direct і channel sessions
(не в групах). Щоб змінити це, налаштуйте `memory.qmd.scope`:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Коли область забороняє пошук, OpenClaw записує warning із похідними channel і
типом чату, щоб порожні результати було легше налагоджувати.

## Цитування

Коли `memory.citations` має значення `auto` або `on`, фрагменти пошуку містять
footer `Source: <path#line>`. Задайте `memory.citations = "off"`, щоб прибрати footer,
але все одно передавати шлях агенту внутрішньо.

## Коли використовувати

Обирайте QMD, коли вам потрібно:

- Reranking для якісніших результатів.
- Шукати в документації проєкту або нотатках поза workspace.
- Згадувати минулі розмови session.
- Повністю локальний пошук без API-ключів.

Для простіших конфігурацій [вбудований рушій](/uk/concepts/memory-builtin) добре працює
без додаткових залежностей.

## Усунення несправностей

**QMD не знайдено?** Переконайтеся, що бінарний файл є в `PATH` gateway. Якщо OpenClaw
працює як сервіс, створіть symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Перший пошук дуже повільний?** QMD завантажує моделі GGUF під час першого використання. Попередньо прогрійте
через `qmd query "test"`, використовуючи ті самі каталоги XDG, що й OpenClaw.

**Пошук завершується за timeout?** Збільште `memory.qmd.limits.timeoutMs` (типово: 4000ms).
Для повільнішого обладнання задайте `120000`.

**Порожні результати в групових чатах?** Перевірте `memory.qmd.scope` — типове значення
дозволяє лише direct і channel sessions.

**Тимчасові репозиторії, видимі з workspace, спричиняють `ENAMETOOLONG` або зламану індексацію?**
Обхід QMD зараз слідує поведінці базового сканера QMD, а не вбудованим правилам symlink OpenClaw.
Тримайте тимчасові checkout-и monorepo у прихованих каталогах, таких як `.tmp/`, або поза індексованими коренями QMD, доки QMD не надасть
безпечний щодо циклів обхід або явні механізми виключення.

## Конфігурація

Повну поверхню конфігурації (`memory.qmd.*`), режими пошуку, інтервали оновлення,
правила області та всі інші параметри див. у
[довіднику конфігурації Memory](/uk/reference/memory-config).
