---
read_when:
    - Zmieniasz formatowanie Markdown lub dzielenie na fragmenty dla kanałów wychodzących
    - Dodajesz nowy formater kanału lub mapowanie stylów
    - Debugujesz regresje formatowania w różnych kanałach
summary: Potok formatowania Markdown dla kanałów wychodzących
title: Formatowanie Markdown
x-i18n:
    generated_at: "2026-05-06T09:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatuje wychodzący Markdown, konwertując go na wspólną pośrednią
reprezentację (IR) przed renderowaniem danych wyjściowych specyficznych dla kanału. IR zachowuje
tekst źródłowy bez zmian, jednocześnie przenosząc zakresy stylów/linków, aby dzielenie na fragmenty i renderowanie mogły
pozostać spójne między kanałami.

## Cele

- **Spójność:** jeden etap parsowania, wiele rendererów.
- **Bezpieczne dzielenie na fragmenty:** dziel tekst przed renderowaniem, aby formatowanie liniowe nigdy
  nie przerywało się między fragmentami.
- **Dopasowanie do kanału:** mapuj to samo IR na Slack mrkdwn, HTML Telegram i zakresy
  stylów Signal bez ponownego parsowania Markdown.

## Potok

1. **Parsuj Markdown -> IR**
   - IR to zwykły tekst oraz zakresy stylów (pogrubienie/kursywa/przekreślenie/kod/spoiler) i zakresy linków.
   - Przesunięcia są jednostkami kodu UTF-16, aby zakresy stylów Signal były zgodne z jego API.
   - Tabele są parsowane tylko wtedy, gdy kanał włącza konwersję tabel.
2. **Dziel IR na fragmenty (najpierw formatowanie)**
   - Dzielenie na fragmenty odbywa się na tekście IR przed renderowaniem.
   - Formatowanie liniowe nie jest dzielone między fragmentami; zakresy są wycinane dla każdego fragmentu.
3. **Renderuj dla kanału**
   - **Slack:** tokeny mrkdwn (pogrubienie/kursywa/przekreślenie/kod), linki jako `<url|label>`.
   - **Telegram:** tagi HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** zwykły tekst + zakresy `text-style`; linki stają się `label (url)`, gdy etykieta się różni.

## Przykład IR

Wejściowy Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schematycznie):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Gdzie jest używane

- Adaptery wychodzące Slack, Telegram i Signal renderują z IR.
- Inne kanały (WhatsApp, iMessage, Microsoft Teams, Discord) nadal używają zwykłego tekstu lub
  własnych reguł formatowania, z konwersją tabel Markdown stosowaną przed
  dzieleniem na fragmenty, gdy jest włączona.

## Obsługa tabel

Tabele Markdown nie są spójnie obsługiwane przez klientów czatu. Użyj
`markdown.tables`, aby kontrolować konwersję dla każdego kanału (i konta).

- `code`: renderuj tabele jako bloki kodu (domyślnie dla większości kanałów).
- `bullets`: konwertuj każdy wiersz na punkty listy (domyślnie dla Signal + WhatsApp).
- `off`: wyłącz parsowanie i konwersję tabel; surowy tekst tabeli przechodzi dalej.

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

- Limity fragmentów pochodzą z adapterów/konfiguracji kanałów i są stosowane do tekstu IR.
- Ogrodzenia kodu są zachowywane jako pojedynczy blok z końcowym znakiem nowej linii, aby kanały
  renderowały je poprawnie.
- Prefiksy list i prefiksy cytatów blokowych są częścią tekstu IR, więc dzielenie na fragmenty
  nie rozdziela ich w środku prefiksu.
- Style liniowe (pogrubienie/kursywa/przekreślenie/kod liniowy/spoiler) nigdy nie są dzielone między
  fragmentami; renderer ponownie otwiera style wewnątrz każdego fragmentu.

Jeśli potrzebujesz więcej informacji o zachowaniu dzielenia na fragmenty między kanałami, zobacz
[Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Zasady linków

- **Slack:** `[label](url)` -> `<url|label>`; gołe adresy URL pozostają gołe. Autolink
  jest wyłączony podczas parsowania, aby uniknąć podwójnego linkowania.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (tryb parsowania HTML).
- **Signal:** `[label](url)` -> `label (url)`, chyba że etykieta pasuje do adresu URL.

## Spoilery

Znaczniki spoilerów (`||spoiler||`) są parsowane tylko dla Signal, gdzie są mapowane na
zakresy stylu SPOILER. Inne kanały traktują je jako zwykły tekst.

## Jak dodać lub zaktualizować formatter kanału

1. **Parsuj raz:** użyj wspólnego helpera `markdownToIR(...)` z opcjami odpowiednimi
   dla kanału (autolink, styl nagłówków, prefiks cytatu blokowego).
2. **Renderuj:** zaimplementuj renderer z `renderMarkdownWithMarkers(...)` i mapą
   znaczników stylów (lub zakresami stylów Signal).
3. **Dziel na fragmenty:** wywołaj `chunkMarkdownIR(...)` przed renderowaniem; renderuj każdy fragment.
4. **Podłącz adapter:** zaktualizuj adapter wychodzący kanału, aby używał nowego mechanizmu dzielenia na fragmenty
   i renderera.
5. **Testuj:** dodaj lub zaktualizuj testy formatowania oraz test dostarczania wychodzącego, jeśli
   kanał używa dzielenia na fragmenty.

## Typowe pułapki

- Tokeny Slack w nawiasach ostrych (`<@U123>`, `<#C123>`, `<https://...>`) muszą być
  zachowane; bezpiecznie escapuj surowy HTML.
- HTML Telegram wymaga escapowania tekstu poza tagami, aby uniknąć uszkodzonego znacznikowania.
- Zakresy stylów Signal zależą od przesunięć UTF-16; nie używaj przesunięć punktów kodowych.
- Zachowuj końcowe znaki nowej linii dla ogrodzonych bloków kodu, aby znaczniki zamykające trafiały do
  własnej linii.

## Powiązane

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie strumieniowania wychodzącego, granice fragmentów i dostarczanie specyficzne dla kanału.
  </Card>
  <Card title="System prompt" href="/pl/concepts/system-prompt" icon="message-lines">
    Co model widzi przed rozmową, w tym wstrzyknięte pliki obszaru roboczego.
  </Card>
</CardGroup>
