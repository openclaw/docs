---
read_when:
    - Zmieniasz formatowanie Markdown lub porcjowanie dla kanałów wychodzących
    - Dodajesz nowy formatter kanału lub mapowanie stylów
    - Debugujesz regresje formatowania między kanałami
summary: Pipeline formatowania Markdown dla kanałów wychodzących
title: Formatowanie Markdown
x-i18n:
    generated_at: "2026-04-05T13:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Formatowanie Markdown

OpenClaw formatuje wychodzący Markdown, konwertując go najpierw do wspólnej reprezentacji pośredniej
(IR), a dopiero potem renderując wynik specyficzny dla kanału. IR zachowuje
tekst źródłowy bez zmian, jednocześnie przenosząc zakresy stylów/linków, dzięki czemu porcjowanie i renderowanie mogą
pozostać spójne między kanałami.

## Cele

- **Spójność:** jeden krok parsowania, wiele rendererów.
- **Bezpieczne porcjowanie:** dzielenie tekstu przed renderowaniem, tak aby formatowanie inline nigdy
  nie łamało się między fragmentami.
- **Dopasowanie do kanału:** mapowanie tego samego IR do Slack mrkdwn, Telegram HTML i Signal
  style ranges bez ponownego parsowania Markdown.

## Pipeline

1. **Parsowanie Markdown -> IR**
   - IR to zwykły tekst plus zakresy stylów (bold/italic/strike/code/spoiler) i zakresy linków.
   - Offsety są liczone w jednostkach kodu UTF-16, aby zakresy stylów Signal były zgodne z jego API.
   - Tabele są parsowane tylko wtedy, gdy kanał włącza konwersję tabel.
2. **Porcjowanie IR (najpierw formatowanie)**
   - Porcjowanie odbywa się na tekście IR przed renderowaniem.
   - Formatowanie inline nie jest dzielone między fragmentami; zakresy są przycinane dla każdego fragmentu.
3. **Renderowanie dla każdego kanału**
   - **Slack:** tokeny mrkdwn (bold/italic/strike/code), linki jako `<url|label>`.
   - **Telegram:** tagi HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** zwykły tekst + zakresy `text-style`; linki stają się `label (url)`, gdy etykieta się różni.

## Przykład IR

Wejściowy Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schematycznie):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Gdzie jest używane

- Adaptery wychodzące Slack, Telegram i Signal renderują z IR.
- Inne kanały (WhatsApp, iMessage, Microsoft Teams, Discord) nadal używają zwykłego tekstu lub
  własnych reguł formatowania, z konwersją tabel Markdown stosowaną przed
  porcjowaniem, jeśli jest włączona.

## Obsługa tabel

Tabele Markdown nie są spójnie obsługiwane przez klientów czatu. Użyj
`markdown.tables`, aby kontrolować konwersję dla każdego kanału (i dla każdego konta).

- `code`: renderuj tabele jako bloki kodu (domyślnie dla większości kanałów).
- `bullets`: konwertuj każdy wiersz na wypunktowanie (domyślnie dla Signal i WhatsApp).
- `off`: wyłącz parsowanie i konwersję tabel; surowy tekst tabeli przechodzi bez zmian.

Klucze konfiguracji:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Reguły porcjowania

- Limity fragmentów pochodzą z adapterów/kontfiguracji kanałów i są stosowane do tekstu IR.
- Bloki kodu fenced są zachowywane jako pojedynczy blok z końcowym znakiem nowej linii, aby kanały
  renderowały je poprawnie.
- Prefiksy list i prefiksy blockquote są częścią tekstu IR, więc porcjowanie
  nie dzieli ich w środku prefiksu.
- Style inline (bold/italic/strike/inline-code/spoiler) nigdy nie są dzielone między
  fragmentami; renderer ponownie otwiera style wewnątrz każdego fragmentu.

Jeśli potrzebujesz więcej informacji o zachowaniu porcjowania między kanałami, zobacz
[Streaming + chunking](/concepts/streaming).

## Zasady linków

- **Slack:** `[label](url)` -> `<url|label>`; gołe URL-e pozostają bez zmian. Autolink
  jest wyłączony podczas parsowania, aby uniknąć podwójnego linkowania.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (tryb parsowania HTML).
- **Signal:** `[label](url)` -> `label (url)`, chyba że etykieta jest taka sama jak URL.

## Spoilery

Znaczniki spoilerów (`||spoiler||`) są parsowane tylko dla Signal, gdzie mapują się do
zakresów stylu SPOILER. Inne kanały traktują je jako zwykły tekst.

## Jak dodać lub zaktualizować formatter kanału

1. **Parsuj raz:** użyj wspólnego helpera `markdownToIR(...)` z opcjami
   odpowiednimi dla kanału (autolink, styl nagłówków, prefiks blockquote).
2. **Renderuj:** zaimplementuj renderer z `renderMarkdownWithMarkers(...)` i mapą
   markerów stylu (lub zakresami stylów Signal).
3. **Porcjuj:** wywołaj `chunkMarkdownIR(...)` przed renderowaniem; renderuj każdy fragment.
4. **Podłącz adapter:** zaktualizuj adapter wychodzący kanału, aby używał nowego chunkera
   i renderera.
5. **Testuj:** dodaj lub zaktualizuj testy formatowania oraz test dostarczania wychodzącego, jeśli dany
   kanał używa porcjowania.

## Typowe pułapki

- Tokeny Slack w nawiasach ostrych (`<@U123>`, `<#C123>`, `<https://...>`) muszą być
  zachowane; bezpiecznie escape'uj surowy HTML.
- Telegram HTML wymaga escape'owania tekstu poza tagami, aby uniknąć uszkodzonego znaczników.
- Zakresy stylów Signal zależą od offsetów UTF-16; nie używaj offsetów punktów kodowych.
- Zachowuj końcowe znaki nowej linii dla fenced code blocks, aby znaczniki zamykające trafiały
  do osobnej linii.
