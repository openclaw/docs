---
read_when:
    - Zmieniasz formatowanie Markdown lub dzielenie na fragmenty dla kanałów wychodzących
    - Dodajesz nowy formater kanału lub mapowanie stylów
    - Debugujesz regresje formatowania między kanałami
summary: Potok formatowania Markdown dla kanałów wychodzących
title: Formatowanie Markdown
x-i18n:
    generated_at: "2026-04-24T09:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw formatuje wychodzący Markdown, konwertując go najpierw do współdzielonej
reprezentacji pośredniej (IR), zanim wyrenderuje wynik specyficzny dla kanału. IR zachowuje
tekst źródłowy bez zmian, a jednocześnie przenosi zakresy stylów/linków, dzięki czemu dzielenie na fragmenty i renderowanie
mogą pozostać spójne między kanałami.

## Cele

- **Spójność:** jeden krok parsowania, wiele rendererów.
- **Bezpieczne dzielenie na fragmenty:** dzielenie tekstu przed renderowaniem, aby formatowanie inline
  nigdy nie pękało między fragmentami.
- **Dopasowanie do kanału:** mapowanie tego samego IR do Slack mrkdwn, Telegram HTML i zakresów stylów
  Signal bez ponownego parsowania Markdown.

## Potok

1. **Parsowanie Markdown -> IR**
   - IR to zwykły tekst plus zakresy stylów (bold/italic/strike/code/spoiler) i zakresy linków.
   - Przesunięcia są liczone w jednostkach UTF-16, aby zakresy stylów Signal były zgodne z jego API.
   - Tabele są parsowane tylko wtedy, gdy kanał wybierze konwersję tabel.
2. **Dzielenie IR na fragmenty (najpierw format)**
   - Dzielenie na fragmenty odbywa się na tekście IR przed renderowaniem.
   - Formatowanie inline nie jest dzielone między fragmentami; zakresy są przycinane per fragment.
3. **Renderowanie per channel**
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

## Gdzie jest używany

- Adaptery wychodzące Slack, Telegram i Signal renderują z IR.
- Inne kanały (WhatsApp, iMessage, Microsoft Teams, Discord) nadal używają zwykłego tekstu lub
  własnych reguł formatowania, z konwersją tabel Markdown stosowaną przed
  dzieleniem na fragmenty, gdy jest włączona.

## Obsługa tabel

Tabele Markdown nie są spójnie obsługiwane przez klientów czatu. Użyj
`markdown.tables`, aby sterować konwersją per channel (i per account).

- `code`: renderowanie tabel jako bloków kodu (domyślnie dla większości kanałów).
- `bullets`: konwersja każdego wiersza do punktów listy (domyślnie dla Signal + WhatsApp).
- `off`: wyłącza parsowanie i konwersję tabel; surowy tekst tabeli przechodzi bez zmian.

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

## Reguły dzielenia na fragmenty

- Limity fragmentów pochodzą z adapterów kanałów/konfiguracji i są stosowane do tekstu IR.
- Ogrodzenia kodu są zachowywane jako pojedynczy blok z końcowym znakiem nowej linii, aby kanały
  renderowały je poprawnie.
- Prefiksy list i prefiksy blockquote są częścią tekstu IR, więc dzielenie na fragmenty
  nie rozcina ich w środku prefiksu.
- Style inline (bold/italic/strike/inline-code/spoiler) nigdy nie są dzielone między
  fragmentami; renderer otwiera style ponownie wewnątrz każdego fragmentu.

Jeśli potrzebujesz więcej informacji o zachowaniu dzielenia na fragmenty między kanałami, zobacz
[Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Polityka linków

- **Slack:** `[label](url)` -> `<url|label>`; gołe URL-e pozostają gołe. Autolink
  jest wyłączony podczas parsowania, aby uniknąć podwójnego linkowania.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (tryb parsowania HTML).
- **Signal:** `[label](url)` -> `label (url)`, chyba że etykieta odpowiada URL-owi.

## Spoilery

Znaczniki spoilerów (`||spoiler||`) są parsowane tylko dla Signal, gdzie mapują się na
zakresy stylu SPOILER. Inne kanały traktują je jako zwykły tekst.

## Jak dodać lub zaktualizować formater kanału

1. **Parsuj raz:** użyj współdzielonej funkcji pomocniczej `markdownToIR(...)` z opcjami
   odpowiednimi dla kanału (autolink, styl nagłówków, prefiks blockquote).
2. **Renderuj:** zaimplementuj renderer z `renderMarkdownWithMarkers(...)` oraz mapą
   znaczników stylów (lub zakresami stylów Signal).
3. **Dziel na fragmenty:** wywołaj `chunkMarkdownIR(...)` przed renderowaniem; wyrenderuj każdy fragment.
4. **Podłącz adapter:** zaktualizuj wychodzący adapter kanału, aby używał nowego chunkera
   i renderera.
5. **Testuj:** dodaj lub zaktualizuj testy formatowania oraz test dostarczania wychodzącego, jeśli
   kanał używa dzielenia na fragmenty.

## Typowe pułapki

- Tokeny Slack w nawiasach ostrych (`<@U123>`, `<#C123>`, `<https://...>`) muszą być
  zachowane; bezpiecznie escapuj surowy HTML.
- HTML Telegram wymaga escapowania tekstu poza tagami, aby uniknąć uszkodzonego znacznika.
- Zakresy stylów Signal zależą od przesunięć UTF-16; nie używaj przesunięć według punktów kodowych.
- Zachowuj końcowe znaki nowej linii dla ogrodzonych bloków kodu, aby znaczniki zamknięcia trafiały
  do osobnej linii.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [System prompt](/pl/concepts/system-prompt)
