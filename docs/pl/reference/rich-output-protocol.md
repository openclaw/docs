---
read_when:
    - Zmiana renderowania wyjścia asystenta w Control UI.
    - Debugowanie dyrektyw prezentacji `[embed ...]`, `MEDIA:`, reply albo audio
summary: Protokół shortcode dla bogatego wyjścia dla embedów, mediów, wskazówek audio i odpowiedzi
title: Protokół bogatego wyjścia
x-i18n:
    generated_at: "2026-04-24T09:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Wyjście asystenta może zawierać niewielki zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` dla dostarczania załączników
- `[[audio_as_voice]]` dla wskazówek prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi
- `[embed ...]` dla bogatego renderowania w Control UI

Te dyrektywy są oddzielne. `MEDIA:` oraz tagi reply/voice pozostają metadanymi dostarczania; `[embed ...]` to ścieżka bogatego renderowania tylko dla web.

## `[embed ...]`

`[embed ...]` to jedyna składnia bogatego renderowania widoczna dla agenta w Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłowe dla nowego wyjścia.
- Shortcode embedów renderują się tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko embedy oparte na URL. Użyj `ref="..."` albo `url="..."`.
- Block-form shortcode embedów z inline HTML nie są renderowane.
- Interfejs web usuwa shortcode z widocznego tekstu i renderuje embed inline.
- `MEDIA:` nie jest aliasem embedu i nie powinno być używane do bogatego renderowania embedów.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta to ustrukturyzowany element `canvas`:

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

Przechowywane/renderowane bogate bloki używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
