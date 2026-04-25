---
read_when:
    - Зміна рендерингу виводу асистента в Control UI
    - Налагодження директив представлення `[embed ...]`, `MEDIA:`, reply або audio
summary: Протокол shortcode розширеного виводу для embeds, медіа, підказок аудіо та відповідей
title: Протокол розширеного виводу
x-i18n:
    generated_at: "2026-04-25T05:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Вивід асистента може містити невеликий набір директив доставки/рендерингу:

- `MEDIA:` для доставки вкладень
- `[[audio_as_voice]]` для підказок представлення аудіо
- `[[reply_to_current]]` / `[[reply_to:<id>]]` для metadata відповіді
- `[embed ...]` для розширеного рендерингу в Control UI

Ці директиви є окремими. `MEDIA:` і теги reply/voice залишаються metadata доставки; `[embed ...]` — це шлях розширеного рендерингу лише для web.

Коли ввімкнено block streaming, `MEDIA:` залишається metadata одноразової доставки для
ходу. Якщо той самий URL медіа надсилається у streaming-блоці й повторюється у фінальному
payload асистента, OpenClaw доставляє вкладення один раз і прибирає дублікат
із фінального payload.

## `[embed ...]`

`[embed ...]` — це єдиний агент-орієнтований синтаксис розширеного рендерингу для Control UI.

Приклад самозакривного запису:

```text
[embed ref="cv_123" title="Status" /]
```

Правила:

- `[view ...]` більше не є валідним для нового виводу.
- Shortcode embed рендеряться лише в поверхні повідомлень асистента.
- Рендеряться лише embed із підтримкою URL. Використовуйте `ref="..."` або `url="..."`.
- Shortcode embed із block-формою inline HTML не рендеряться.
- Web UI прибирає shortcode з видимого тексту й рендерить embed inline.
- `MEDIA:` не є псевдонімом embed і не має використовуватися для розширеного рендерингу embed.

## Збережена форма рендерингу

Нормалізований/збережений блок вмісту асистента — це структурований елемент `canvas`:

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

Збережені/відрендерені розширені блоки безпосередньо використовують цю форму `canvas`. `present_view` не розпізнається.

## Пов’язане

- [Адаптери RPC](/uk/reference/rpc)
- [Typebox](/uk/concepts/typebox)
