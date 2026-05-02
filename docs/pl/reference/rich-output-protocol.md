---
read_when:
    - Zmiana renderowania danych wyjściowych asystenta w interfejsie sterowania
    - Debugowanie `[embed ...]`, `MEDIA:`, odpowiedzi lub dyrektyw prezentacji audio
summary: Protokół krótkich kodów dla rozbudowanego wyjścia, osadzonych elementów, multimediów, wskazówek audio i odpowiedzi
title: Protokół rozbudowanych danych wyjściowych
x-i18n:
    generated_at: "2026-05-02T22:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Dane wyjściowe asystenta mogą zawierać mały zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` do dostarczania załączników
- `[[audio_as_voice]]` do wskazówek prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` do metadanych odpowiedzi
- `[embed ...]` do bogatego renderowania w Control UI

Zdalne załączniki `MEDIA:` muszą być publicznymi URL-ami `https:`. Zwykłe `http:`,
loopback, link-local, prywatne i wewnętrzne nazwy hostów są ignorowane jako dyrektywy
załączników; serwerowe mechanizmy pobierania mediów nadal wymuszają własne zabezpieczenia sieciowe.

Lokalne załączniki `MEDIA:` mogą używać ścieżek bezwzględnych, ścieżek względnych względem obszaru roboczego albo
ścieżek względnych względem katalogu domowego `~/`. Przed dostarczeniem nadal przechodzą przez politykę odczytu plików agenta oraz
sprawdzanie typu mediów.

Zwykła składnia obrazów Markdown domyślnie pozostaje tekstem. Kanały, które celowo
mapują odpowiedzi z obrazami Markdown na załączniki multimedialne, włączają to w swoim wychodzącym
adapterze; Telegram robi to, aby `![alt](url)` nadal mogło stać się odpowiedzią multimedialną.

Te dyrektywy są oddzielne. `MEDIA:` oraz znaczniki odpowiedzi/głosu pozostają metadanymi dostarczania; `[embed ...]` jest ścieżką bogatego renderowania tylko dla webu.
Zaufane media z wyników narzędzi używają tego samego parsera `MEDIA:` / `[[audio_as_voice]]` przed dostarczeniem, więc tekstowe dane wyjściowe narzędzi nadal mogą oznaczyć załącznik audio jako notatkę głosową.

Gdy strumieniowanie blokowe jest włączone, `MEDIA:` pozostaje metadanymi jednokrotnego dostarczenia dla
tury. Jeśli ten sam URL mediów zostanie wysłany w strumieniowanym bloku i powtórzony w końcowym
ładunku asystenta, OpenClaw dostarcza załącznik raz i usuwa duplikat
z końcowego ładunku.

## `[embed ...]`

`[embed ...]` to jedyna składnia bogatego renderowania dostępna dla agenta w Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Reguły:

- `[view ...]` nie jest już prawidłowe dla nowych danych wyjściowych.
- Shortcode osadzenia renderują się tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL-ach. Użyj `ref="..."` albo `url="..."`.
- Blokowe shortcode osadzenia z osadzonym HTML-em nie są renderowane.
- Web UI usuwa shortcode z widocznego tekstu i renderuje osadzenie inline.
- `MEDIA:` nie jest aliasem osadzenia i nie powinno być używane do bogatego renderowania osadzeń.

## Zapisany kształt renderowania

Znormalizowany/zapisany blok treści asystenta to ustrukturyzowany element `canvas`:

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

Zapisane/renderowane bloki bogate używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
