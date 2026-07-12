---
read_when:
    - Zmieniasz formatowanie Markdown lub podział na fragmenty dla kanałów wychodzących
    - Dodajesz nowy formater kanału lub mapowanie stylu
    - Debugujesz regresje formatowania w różnych kanałach
summary: Potok formatowania Markdown dla kanałów wychodzących
title: Formatowanie Markdown
x-i18n:
    generated_at: "2026-07-12T15:05:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw konwertuje wychodzący Markdown na wspólną reprezentację pośrednią
(IR) przed renderowaniem danych wyjściowych właściwych dla kanału. IR zachowuje
zwykły tekst oraz zakresy stylów i linków, dzięki czemu jeden etap analizy
obsługuje każdy kanał, a dzielenie na fragmenty nigdy nie rozdziela formatowania
wewnątrz zakresu.

## Potok przetwarzania

1. **Analiza Markdown do IR** (`markdownToIR`) — zwykły tekst oraz zakresy stylów
   (pogrubienie, kursywa, przekreślenie, kod, blok kodu, spoiler, cytat blokowy,
   nagłówki 1–6) i zakresy linków. Przesunięcia są wyrażone w jednostkach kodowych
   UTF-16, dzięki czemu zakresy stylów Signal są bezpośrednio zgodne z jego API.
   Tabele są analizowane tylko wtedy, gdy kanał włącza tryb tabel.
2. **Dzielenie IR na fragmenty** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   — podział odbywa się na tekście IR przed renderowaniem, więc style śródliniowe
   i linki są przycinane osobno dla każdego fragmentu, zamiast być przerywane
   na jego granicy.
3. **Renderowanie dla każdego kanału** (`renderMarkdownWithMarkers`) — mapa
   znaczników stylów przekształca zakresy w natywne znaczniki kanału.

| Kanał                                                            | Mechanizm renderujący                                                                 | Uwagi                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Slack                                                            | tokeny mrkdwn (`*pogrubienie*`, `_kursywa_`, `` `kod` ``, ogrodzenia kodu)             | Linki stają się `<url\|etykieta>`; automatyczne linkowanie jest wyłączone podczas analizy, aby uniknąć podwójnego linkowania |
| Telegram                                                         | znaczniki HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Obsługuje też tabele i nagłówki (`<h1>`–`<h6>`) w wiadomościach rozszerzonych, gdy włączono `richMessages` |
| Signal                                                           | zwykły tekst + zakresy `text-style`                                                    | Linki są renderowane jako `etykieta (url)`, gdy etykieta różni się od adresu URL                        |
| Discord, WhatsApp, iMessage, Microsoft Teams i inne kanały       | zwykły tekst                                                                          | Brak stylizacji opartej na IR; konwersja tabel Markdown nadal odbywa się przez `convertMarkdownTables` |

## Przykład IR

Wejściowy Markdown:
__OC_I18N_900000__
IR (schematycznie):
__OC_I18N_900001__
## Obsługa tabel

`markdown.tables` określa sposób konwersji tabel Markdown przez kanał,
osobno dla każdego kanału i opcjonalnie dla każdego konta:

| Tryb      | Zachowanie                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------ |
| `code`    | Renderuje jako wyrównaną tabelę ASCII wewnątrz bloku kodu (domyślny tryb rezerwowy)               |
| `bullets` | Konwertuje każdy wiersz na punkty listy w postaci `etykieta: wartość`                             |
| `block`   | Zachowuje natywne tabele, jeśli transport je obsługuje; w przeciwnym razie używa trybu `code`     |
| `off`     | Wyłącza analizę tabel; nieprzetworzony tekst tabeli jest przekazywany bez zmian                   |

Domyślne ustawienia Pluginów dla poszczególnych kanałów: Signal, WhatsApp
i Matrix domyślnie używają `bullets`; Mattermost domyślnie używa `off`;
Telegram domyślnie używa `block` (który jest rozstrzygany jako `code`, chyba
że na koncie włączono `richMessages`). Każdy kanał bez jawnego ustawienia
domyślnego Pluginu używa trybu `code`.
__OC_I18N_900002__
## Reguły dzielenia na fragmenty

- Limity fragmentów pochodzą z adapterów lub konfiguracji kanałów i dotyczą
  tekstu IR, a nie wyrenderowanych danych wyjściowych.
- Ogrodzone bloki kodu są zachowywane jako jeden blok z końcowym znakiem nowego
  wiersza, aby kanały prawidłowo renderowały ogrodzenie zamykające.
- Prefiksy list i cytatów blokowych są częścią tekstu IR, więc podział na
  fragmenty nigdy nie następuje wewnątrz prefiksu.
- Style śródliniowe nigdy nie są dzielone między fragmentami; mechanizm
  renderujący ponownie otwiera aktywny styl na początku następnego fragmentu.

Informacje o granicach fragmentów i sposobie dostarczania w poszczególnych
kanałach zawiera strona [Strumieniowanie i dzielenie na fragmenty](/concepts/streaming).

## Zasady obsługi linków

- **Slack:** `[etykieta](url)` -> `<url|etykieta>`; nieopakowane adresy URL pozostają nieopakowane.
- **Telegram:** `[etykieta](url)` -> `<a href="url">etykieta</a>` (tryb analizy HTML).
- **Signal:** `[etykieta](url)` -> `etykieta (url)`, chyba że etykieta jest już
  zgodna z adresem URL.

## Spoilery

Znaczniki spoilerów (`||spoiler||`) są analizowane dla Signal (mapowane na
zakresy stylu `SPOILER`) i Telegram (mapowane na `<tg-spoiler>`). Inne kanały
traktują `||...||` jako zwykły tekst.

## Dodawanie lub aktualizowanie formatera kanału

1. **Przeanalizuj raz** za pomocą `markdownToIR(...)`, przekazując opcje
   odpowiednie dla kanału (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Wyrenderuj** za pomocą `renderMarkdownWithMarkers(...)` i mapy znaczników
   stylów (lub niestandardowej logiki zakresów stylów dla transportów takich jak Signal).
3. **Podziel na fragmenty** za pomocą `chunkMarkdownIR(...)` lub
   `renderMarkdownIRChunksWithinLimit(...)` przed wyrenderowaniem każdego fragmentu.
4. **Połącz adapter**, aby wywoływał nowy mechanizm dzielenia na fragmenty
   i mechanizm renderujący ze ścieżki wysyłania wychodzącego.
5. **Przetestuj** za pomocą testów formatowania oraz testu dostarczania
   wychodzącego, jeśli kanał dzieli wiadomości na fragmenty.

## Typowe pułapki

- Tokeny Slack w nawiasach ostrych (`<@U123>`, `<#C123>`, `<https://...>`) muszą
  przetrwać kodowanie znaków specjalnych; nieprzetworzony HTML nadal musi być
  bezpiecznie kodowany.
- HTML Telegram wymaga kodowania znaków specjalnych w tekście poza znacznikami,
  aby uniknąć uszkodzenia znaczników.
- Zakresy stylów Signal używają przesunięć UTF-16, a nie przesunięć punktów kodowych.
- Zachowuj końcowe znaki nowego wiersza w ogrodzonych blokach kodu, aby znacznik
  zamykający znalazł się w osobnym wierszu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Strumieniowanie i dzielenie na fragmenty" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie strumieniowania wychodzącego, granice fragmentów i dostarczanie właściwe dla kanału.
  </Card>
  <Card title="Monit systemowy" href="/pl/concepts/system-prompt" icon="message-lines">
    Dane widoczne dla modelu przed rozmową, w tym wstrzyknięte pliki przestrzeni roboczej.
  </Card>
</CardGroup>
