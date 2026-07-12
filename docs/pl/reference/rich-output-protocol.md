---
read_when:
    - Zmiana sposobu renderowania odpowiedzi asystenta w interfejsie sterowania
    - Debugowanie dyrektyw `[embed ...]` dotyczących prezentacji multimediów strukturalnych, odpowiedzi lub dźwięku
summary: Protokół rozszerzonego wyjścia dla ustrukturyzowanych multimediów, osadzonych treści, wskazówek audio i odpowiedzi
title: Protokół rozszerzonego wyjścia
x-i18n:
    generated_at: "2026-07-12T15:36:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Dane wyjściowe asystenta przekazują dyrektywy dostarczania/renderowania za pośrednictwem kilku dedykowanych kanałów:

- Ustrukturyzowane pola `mediaUrl` / `mediaUrls` do dostarczania załączników.
- `[[audio_as_voice]]` dla wskazówek dotyczących prezentacji dźwięku.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi.
- `[embed ...]` do rozszerzonego renderowania w interfejsie Control UI.

Ustrukturyzowane pola multimediów oraz znaczniki `[[...]]` stanowią metadane dostarczania. `[embed ...]` jest osobną, dostępną wyłącznie w interfejsie internetowym ścieżką rozszerzonego renderowania; nie jest aliasem multimediów.

## Załączniki multimedialne

Załączniki zdalne muszą być publicznymi adresami URL `https:`. Adresy `http:`, local loopback i link-local oraz prywatne i wewnętrzne nazwy hostów są odrzucane jako dyrektywy załączników; mechanizmy pobierania multimediów po stronie serwera stosują dodatkowo własne zabezpieczenia sieciowe.

Załączniki lokalne mogą używać ścieżek bezwzględnych, ścieżek względnych wobec obszaru roboczego lub ścieżek `~/` względnych wobec katalogu domowego. Przed dostarczeniem nadal podlegają zasadom odczytu plików przez agenta oraz kontroli typu multimediów.

<Warning>
Nie emituj tekstowych poleceń dotyczących załączników z narzędzi, pluginów, bloków przesyłania strumieniowego, danych wyjściowych przeglądarki ani akcji wiadomości. Zamiast tego używaj ustrukturyzowanych pól multimediów:

```json
{ "message": "Oto Twój obraz.", "mediaUrl": "/workspace/image.png" }
```

Tekst starszych odpowiedzi końcowych może być nadal normalizowany w celu zapewnienia zgodności, ale nie jest to ogólny protokół pluginów ani narzędzi.
</Warning>

Zwykła składnia obrazów Markdown (`![alt](url)`) domyślnie pozostaje tekstem. Kanały, które chcą traktować obrazy Markdown jako odpowiedzi multimedialne, włączają tę funkcję w swoim adapterze wychodzącym; Telegram robi to, dzięki czemu `![alt](url)` staje się załącznikiem multimedialnym.

Gdy włączone jest strumieniowanie blokowe, multimedia muszą być przesyłane w ustrukturyzowanych polach ładunku. Jeśli ten sam adres URL multimediów pojawi się w przesyłanym strumieniowo bloku, a następnie ponownie w końcowym ładunku asystenta, OpenClaw dostarczy go raz i usunie duplikat z końcowego ładunku.

## `[embed ...]`

`[embed ...]` jest jedyną składnią rozszerzonego renderowania dostępną dla agenta w interfejsie Control UI. Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłową składnią dla nowych danych wyjściowych.
- Skrócone znaczniki osadzania są renderowane wyłącznie w obszarze wiadomości asystenta.
- Renderowane są wyłącznie osadzenia oparte na adresach URL; użyj `ref="..."` lub `url="..."`.
- Blokowe skrócone znaczniki osadzania w formacie HTML nie są renderowane.
- Interfejs internetowy usuwa skrócony znacznik z widocznego tekstu i renderuje osadzenie w tekście.

## Przechowywana postać renderowania

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

`present_view` nie jest rozpoznawane; przechowywane/renderowane bloki rozszerzone zawsze używają tej postaci `canvas`.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
