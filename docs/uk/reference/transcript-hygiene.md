---
read_when:
    - Ви налагоджуєте відхилення запитів provider, пов’язані з формою transcript
    - Ви змінюєте логіку санітизації transcript або відновлення викликів tools
    - Ви досліджуєте невідповідності id викликів tools між provider-ами
summary: 'Довідка: правила санітизації та відновлення transcript для конкретних provider'
title: Гігієна transcript
x-i18n:
    generated_at: "2026-04-25T05:58:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Цей документ описує **виправлення, специфічні для provider-ів**, які застосовуються до transcript перед запуском
(побудовою контексту model). Це **in-memory** коригування, що використовуються для задоволення строгих
вимог provider-ів. Ці кроки гігієни **не** переписують збережений JSONL transcript
на диску; однак окремий етап відновлення файлу сесії може переписати некоректні JSONL-файли,
видаляючи невалідні рядки до завантаження сесії. Коли відбувається відновлення, оригінальний
файл резервно копіюється поруч із файлом сесії.

Область охоплює:

- Контекст prompt лише для runtime, який не потрапляє в видимі користувачу цикли transcript
- Санітизацію id викликів tools
- Валідацію вхідних даних викликів tools
- Відновлення парування результатів tools
- Валідацію / упорядкування циклів
- Очищення signature думок
- Санітизацію payload зображень
- Тегування походження user-input (для prompt, маршрутизованих між сесіями)

Якщо вам потрібні подробиці про зберігання transcript, див.:

- [Поглиблений розбір керування сесіями та Compaction](/uk/reference/session-management-compaction)

---

## Глобальне правило: runtime context — це не користувацький transcript

Контекст runtime/system можна додавати до prompt model для циклу, але це
не контент, створений кінцевим користувачем. OpenClaw зберігає окреме тіло
prompt, орієнтоване на transcript, для відповідей Gateway, follow-up у черзі, ACP, CLI та вбудованих
запусків Pi. Збережені видимі user-цикли використовують це тіло
transcript замість prompt, збагаченого runtime.

Для застарілих сесій, які вже зберегли обгортки runtime, поверхні історії
Gateway застосовують display projection перед поверненням повідомлень до WebChat,
TUI, REST або SSE-клієнтів.

---

## Де це виконується

Уся гігієна transcript централізована у вбудованому runner:

- Вибір policy: `src/agents/transcript-policy.ts`
- Застосування санітизації/відновлення: `sanitizeSessionHistory` у `src/agents/pi-embedded-runner/replay-history.ts`

Policy використовує `provider`, `modelApi` і `modelId`, щоб визначити, що застосовувати.

Окремо від гігієни transcript, файли сесій відновлюються (за потреби) перед завантаженням:

- `repairSessionFileIfNeeded` у `src/agents/session-file-repair.ts`
- Викликається з `run/attempt.ts` і `compact.ts` (вбудований runner)

---

## Глобальне правило: санітизація зображень

Payload зображень завжди санітизуються, щоб запобігти відхиленню з боку provider через
обмеження розміру (зменшення масштабу/повторне стиснення завеликих base64-зображень).

Це також допомагає контролювати тиск токенів, спричинений зображеннями, для model із підтримкою vision.
Менші максимальні розміри зазвичай зменшують використання токенів; більші розміри зберігають деталі.

Реалізація:

- `sanitizeSessionMessagesImages` у `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` у `src/agents/tool-images.ts`
- Максимальна сторона зображення налаштовується через `agents.defaults.imageMaxDimensionPx` (типово: `1200`).

---

## Глобальне правило: некоректні виклики tools

Блоки викликів tools асистента, у яких відсутні і `input`, і `arguments`, відкидаються
до побудови контексту model. Це запобігає відхиленню з боку provider через частково
збережені виклики tools (наприклад, після помилки rate limit).

Реалізація:

- `sanitizeToolCallInputs` у `src/agents/session-transcript-repair.ts`
- Застосовується в `sanitizeSessionHistory` у `src/agents/pi-embedded-runner/replay-history.ts`

---

## Глобальне правило: provenance міжсесійного вводу

Коли агент надсилає prompt в іншу сесію через `sessions_send` (включно з
етапами reply/announce між агентами), OpenClaw зберігає створений user-цикл з:

- `message.provenance.kind = "inter_session"`

Ці метадані записуються під час додавання до transcript і не змінюють роль
(`role: "user"` зберігається для сумісності з provider-ами). Читачі transcript можуть використовувати
це, щоб не вважати маршрутизовані внутрішні prompt інструкціями, написаними кінцевим користувачем.

Під час перебудови контексту OpenClaw також додає короткий маркер `[Inter-session message]`
до таких user-циклів in-memory, щоб model могла відрізняти їх від
зовнішніх інструкцій кінцевого користувача.

---

## Матриця provider-ів (поточна поведінка)

**OpenAI / OpenAI Codex**

- Лише санітизація зображень.
- Видалення осиротілих signature reasoning (окремих елементів reasoning без наступного content block) для transcript OpenAI Responses/Codex, а також видалення відтворюваного reasoning OpenAI після перемикання маршруту model.
- Без санітизації id викликів tools.
- Відновлення парування результатів tools може переміщувати справжні відповідні outputs і синтезувати outputs у стилі Codex зі значенням `aborted` для відсутніх викликів tools.
- Без валідації або перевпорядкування циклів.
- Відсутні outputs tools сімейства OpenAI Responses синтезуються як `aborted`, щоб відповідати нормалізації відтворення Codex.
- Без видалення signature думок.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Санітизація id викликів tools: строго буквено-цифрова.
- Відновлення парування результатів tools і синтетичні результати tools.
- Валідація циклів (чергування циклів у стилі Gemini).
- Виправлення порядку циклів Google (додавання крихітного user-bootstrap, якщо історія починається з assistant).
- Antigravity Claude: нормалізація signature thinking; видалення блоків thinking без signature.

**Anthropic / Minimax (Anthropic-compatible)**

- Відновлення парування результатів tools і синтетичні результати tools.
- Валідація циклів (злиття послідовних user-циклів для задоволення строгого чергування).

**Mistral (включно з виявленням на основі model-id)**

- Санітизація id викликів tools: strict9 (буквено-цифрові, довжина 9).

**OpenRouter Gemini**

- Очищення signature думок: видалення значень `thought_signature`, які не є base64 (base64 зберігається).

**Усе інше**

- Лише санітизація зображень.

---

## Історична поведінка (до 2026.1.22)

До релізу 2026.1.22 OpenClaw застосовував кілька шарів гігієни transcript:

- **Розширення transcript-sanitize** запускалося під час кожної побудови контексту і могло:
  - Відновлювати парування use/result tools.
  - Санітизувати id викликів tools (включно з нестрогим режимом, який зберігав `_`/`-`).
- Runner також виконував специфічну для provider санітизацію, що дублювало роботу.
- Додаткові мутації відбувалися поза policy provider, зокрема:
  - Видалення тегів `<final>` із тексту assistant перед збереженням.
  - Видалення порожніх циклів помилок assistant.
  - Обрізання вмісту assistant після викликів tools.

Ця складність спричиняла міжпровайдерні регресії (зокрема парування `openai-responses`
`call_id|fc_id`). Очищення 2026.1.22 видалило розширення, централізувало
логіку в runner і зробило OpenAI **no-touch**, окрім санітизації зображень.

## Пов’язане

- [Керування сесіями](/uk/concepts/session)
- [Очищення сесій](/uk/concepts/session-pruning)
