---
read_when:
    - Zmiana renderowania danych wyjściowych asystenta w interfejsie Control UI
    - Debugowanie `[embed ...]`, mediów strukturalnych, odpowiedzi lub dyrektyw prezentacji audio
summary: Protokół rozbudowanego wyjścia dla mediów strukturalnych, osadzeń, wskazówek audio i odpowiedzi
title: Protokół bogatego wyjścia
x-i18n:
    generated_at: "2026-06-27T18:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Dane wyjściowe asystenta mogą zawierać mały zestaw dyrektyw dostarczania/renderowania:

- ustrukturyzowane pola `mediaUrl` / `mediaUrls` do dostarczania załączników
- `[[audio_as_voice]]` dla wskazówek prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi
- `[embed ...]` dla bogatego renderowania w Control UI

Zdalne załączniki multimedialne muszą być publicznymi adresami URL `https:`. Zwykłe `http:`,
loopback, link-local, prywatne i wewnętrzne nazwy hostów są ignorowane jako dyrektywy
załączników; pobierające multimedia komponenty po stronie serwera nadal egzekwują własne zabezpieczenia sieciowe.

Lokalne załączniki multimedialne mogą używać ścieżek bezwzględnych, ścieżek względnych wobec workspace albo
ścieżek względnych wobec katalogu domowego `~/`. Przed dostarczeniem nadal przechodzą przez politykę odczytu plików agenta oraz
kontrole typu multimediów.

<Warning>
Nie emituj tekstowych poleceń dla załączników z narzędzi, plugins, bloków strumieniowania,
danych wyjściowych przeglądarki ani akcji wiadomości. Zamiast tego używaj ustrukturyzowanych pól multimediów.

Prawidłowy ładunek narzędzia wiadomości:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Starszy tekst końcowej odpowiedzi asystenta może nadal być normalizowany dla zgodności, ale
nie jest ogólnym protokołem plugin/narzędzie.
</Warning>

Zwykła składnia obrazów Markdown domyślnie pozostaje tekstem. Kanały, które celowo
mapują odpowiedzi z obrazami Markdown na załączniki multimedialne, włączają to w swoim adapterze
wyjściowym; Telegram robi to, aby `![alt](url)` nadal mogło stać się odpowiedzią multimedialną.

Te dyrektywy są oddzielne. Ustrukturyzowane pola multimediów oraz tagi odpowiedzi/głosu są
metadanymi dostarczania; `[embed ...]` jest ścieżką bogatego renderowania wyłącznie dla webu.

Gdy strumieniowanie bloków jest włączone, multimedia muszą być przenoszone w ustrukturyzowanych polach ładunku.
Jeśli ten sam URL multimediów zostanie wysłany w strumieniowanym bloku i powtórzony w
końcowym ładunku asystenta, OpenClaw dostarcza załącznik raz i usuwa
duplikat z końcowego ładunku.

## `[embed ...]`

`[embed ...]` to jedyna składnia bogatego renderowania dostępna dla agenta w Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Reguły:

- `[view ...]` nie jest już prawidłowe dla nowych danych wyjściowych.
- Shortcodes osadzania renderują się wyłącznie w powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` albo `url="..."`.
- Blokowe shortcodes osadzania HTML inline nie są renderowane.
- Webowy interfejs użytkownika usuwa shortcode z widocznego tekstu i renderuje osadzenie inline.
- Ustrukturyzowane multimedia nie są aliasem osadzenia i nie powinny być używane do bogatego renderowania osadzeń.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta jest ustrukturyzowanym elementem `canvas`:

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

Przechowywane/renderowane bloki bogate używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
