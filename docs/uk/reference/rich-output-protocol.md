---
read_when:
    - Зміна рендерингу виводу помічника в Control UI
    - Налагодження директив представлення `[embed ...]`, `MEDIA:`, reply або audio
summary: Протокол shortcode для rich output для вбудовувань, медіа, аудіопідказок і відповідей
title: Протокол rich output
x-i18n:
    generated_at: "2026-04-27T11:04:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Вивід помічника може містити невеликий набір директив доставки/рендерингу:

- `MEDIA:` для доставки вкладень
- `[[audio_as_voice]]` для підказок представлення аудіо
- `[[reply_to_current]]` / `[[reply_to:<id>]]` для метаданих відповіді
- `[embed ...]` для rich-рендерингу в Control UI

Віддалені вкладення `MEDIA:` мають бути публічними URL `https:`. Звичайні `http:`,
loopback, link-local, private та internal hostnames ігноруються як директиви
вкладень; серверні засоби отримання медіа все одно застосовують власні мережеві guard.

Звичайний синтаксис зображень Markdown типово залишається текстом. Канали, які навмисно
зіставляють відповіді із зображеннями Markdown з медіавкладеннями, вмикають це у своєму outbound
adapter; Telegram робить саме так, щоб `![alt](url)` усе ще міг ставати медіавідповіддю.

Ці директиви є окремими. `MEDIA:` і теги reply/voice залишаються метаданими доставки; `[embed ...]` — це лише вебшлях rich-рендерингу.
Медіа довірених результатів інструментів використовує той самий парсер `MEDIA:` / `[[audio_as_voice]]` перед доставкою, тож текстові виводи інструментів усе ще можуть позначати аудіовкладення як голосову нотатку.

Коли ввімкнено block streaming, `MEDIA:` залишається метаданими одноразової доставки для
ходу. Якщо той самий URL медіа надсилається в streamed block і повторюється у фінальному
payload помічника, OpenClaw доставляє вкладення один раз і прибирає дублікат
із фінального payload.

## `[embed ...]`

`[embed ...]` — це єдиний agent-facing синтаксис rich-рендерингу для Control UI.

Приклад самозакривного запису:

```text
[embed ref="cv_123" title="Status" /]
```

Правила:

- `[view ...]` більше не є валідним для нового виводу.
- Shortcode embed рендеряться лише в поверхні повідомлень помічника.
- Рендеряться лише embed-и з URL-підтримкою. Використовуйте `ref="..."` або `url="..."`.
- Shortcode embed у block-form inline HTML не рендеряться.
- Web UI прибирає shortcode з видимого тексту та рендерить embed inline.
- `MEDIA:` не є псевдонімом embed і не має використовуватися для rich-рендерингу embed.

## Збережена форма рендерингу

Нормалізований/збережений блок вмісту помічника — це структурований елемент `canvas`:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Збережені/відрендерені rich-блоки безпосередньо використовують цю форму `canvas`. `present_view` не розпізнається.

## Пов’язане

- [Адаптери RPC](/uk/reference/rpc)
- [Typebox](/uk/concepts/typebox)
