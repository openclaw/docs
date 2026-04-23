---
read_when:
    - Зміна рендерингу виводу assistant у Control UI
    - Налагодження директив представлення `[embed ...]`, `MEDIA:`, reply або audio
summary: Протокол shortcodes для rich output для embeds, media, підказок аудіо та відповідей
title: Протокол rich output
x-i18n:
    generated_at: "2026-04-23T21:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d28bcf97c21d1058bbda2cffcb2532a032db07c5ab47b1a610d048c3b1dd384
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Вивід assistant може містити невеликий набір директив доставки/рендерингу:

- `MEDIA:` для доставки вкладень
- `[[audio_as_voice]]` для підказок представлення аудіо
- `[[reply_to_current]]` / `[[reply_to:<id>]]` для метаданих відповіді
- `[embed ...]` для rich rendering у Control UI

Ці директиви є окремими. `MEDIA:` і теги reply/voice залишаються метаданими доставки; `[embed ...]` — це вебшлях rich rendering.

## `[embed ...]`

`[embed ...]` — це єдиний агентний синтаксис rich rendering для Control UI.

Приклад самозакривного shortcode:

```text
[embed ref="cv_123" title="Status" /]
```

Правила:

- `[view ...]` більше не є валідним для нового виводу.
- Embed-shortcodes рендеряться лише в поверхні повідомлень assistant.
- Рендеряться лише embeds на основі URL. Використовуйте `ref="..."` або `url="..."`.
- Shortcodes embed у block-form inline HTML не рендеряться.
- Веб-UI прибирає shortcode з видимого тексту й рендерить embed inline.
- `MEDIA:` не є псевдонімом embed і не повинно використовуватися для rich embed rendering.

## Збережена форма рендерингу

Нормалізований/збережений блок вмісту assistant — це структурований елемент `canvas`:

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
