---
read_when:
    - Zmiana sposobu renderowania odpowiedzi asystenta w interfejsie Control UI
    - Debugowanie `[embed ...]`, `MEDIA:`, odpowiedzi lub dyrektyw prezentacji audio
summary: Protokół shortcode dla bogatych danych wyjściowych, osadzeń, multimediów, wskazówek audio i odpowiedzi
title: Protokół bogatego wyjścia
x-i18n:
    generated_at: "2026-04-30T10:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Dane wyjściowe asystenta mogą zawierać niewielki zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` do dostarczania załączników
- `[[audio_as_voice]]` dla wskazówek dotyczących prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi
- `[embed ...]` dla renderowania rozszerzonego w Control UI

Zdalne załączniki `MEDIA:` muszą być publicznymi adresami URL `https:`. Zwykłe `http:`,
loopback, link-local, prywatne i wewnętrzne nazwy hostów są ignorowane jako dyrektywy
załączników; serwerowe mechanizmy pobierania mediów nadal egzekwują własne zabezpieczenia sieciowe.

Zwykła składnia obrazów Markdown domyślnie pozostaje tekstem. Kanały, które celowo
mapują odpowiedzi z obrazami Markdown na załączniki multimedialne, włączają to w swoim
adapterze wychodzącym; Telegram robi to, aby `![alt](url)` nadal mogło stać się odpowiedzią multimedialną.

Te dyrektywy są odrębne. `MEDIA:` oraz tagi odpowiedzi/głosowe pozostają metadanymi dostarczania; `[embed ...]` to ścieżka rozszerzonego renderowania tylko dla sieci.
Zaufane media z wyników narzędzi używają tego samego parsera `MEDIA:` / `[[audio_as_voice]]` przed dostarczeniem, więc tekstowe dane wyjściowe narzędzia nadal mogą oznaczyć załącznik audio jako notatkę głosową.

Gdy włączone jest przesyłanie strumieniowe bloków, `MEDIA:` pozostaje metadanymi pojedynczego dostarczenia dla
tury. Jeśli ten sam adres URL multimediów zostanie wysłany w przesyłanym strumieniowo bloku i powtórzony w końcowym
ładunku asystenta, OpenClaw dostarczy załącznik raz i usunie duplikat
z końcowego ładunku.

## `[embed ...]`

`[embed ...]` to jedyna składnia rozszerzonego renderowania przeznaczona dla agenta w Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Reguły:

- `[view ...]` nie jest już prawidłowe dla nowych danych wyjściowych.
- Krótkie kody osadzeń renderują się wyłącznie na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` lub `url="..."`.
- Blokowe krótkie kody osadzeń inline HTML nie są renderowane.
- Interfejs webowy usuwa krótki kod z widocznego tekstu i renderuje osadzenie inline.
- `MEDIA:` nie jest aliasem osadzenia i nie powinno być używane do renderowania rozszerzonych osadzeń.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta jest strukturalnym elementem `canvas`:

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

Przechowywane/renderowane bloki rozszerzone używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
