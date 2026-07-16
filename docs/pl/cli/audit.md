---
read_when:
    - Trzeba ustalić, kto uruchomił agenta lub narzędzie, kiedy je uruchomiono i jak zakończyło się jego działanie
    - Potrzebne są metadane cyklu życia wiadomości przychodzących lub wychodzących, niezawierające treści
    - Potrzebny jest ograniczony zakresowo eksport aktywności, bezpieczny pod względem redakcji danych wrażliwych
summary: Dokumentacja CLI dotycząca rekordów audytu cyklu życia uruchomień, narzędzi i wiadomości zawierających wyłącznie metadane
title: Rekordy audytu
x-i18n:
    generated_at: "2026-07-16T18:09:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Przeszukuj rejestr audytu Gateway zawierający wyłącznie metadane dotyczące uruchomień agentów, działań narzędzi i opcjonalnych rekordów cyklu życia wiadomości.

Rejestr jest domyślnie włączony dla zdarzeń uruchomień i narzędzi. Ustaw
[`audit.enabled: false`](/pl/gateway/configuration-reference#audit) i uruchom ponownie
Gateway, aby zatrzymać rejestrowanie wszystkich nowych zdarzeń. Rekordy wiadomości są domyślnie wyłączone niezależnie;
ustaw `audit.messages` na `direct` lub `all` i uruchom ponownie Gateway, aby
je rejestrować. Istniejące rekordy można przeszukiwać do czasu ich wygaśnięcia (30 dni).

Rejestr jest niezależny od transkrypcji konwersacji: zapisuje tożsamość,
kolejność, pochodzenie, działanie, status i znormalizowane kody wyników, ale nigdy
nie przechowuje treści, a identyfikatory wiadomości występują wyłącznie jako
lokalne dla instalacji pseudonimy z kluczem. [Historia audytu](/gateway/audit) definiuje pełny model danych,
zasady prywatności, ograniczenia przechowywania/retencji i zakres pokrycia; ta strona
opisuje interfejs poleceń.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filtry

- `--agent <id>`: dokładny identyfikator agenta
- `--session <key>`: dokładny klucz sesji
- `--run <id>`: dokładny identyfikator uruchomienia
- `--kind <kind>`: `agent_run`, `tool_action` lub `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` lub `unknown`
- `--direction <direction>`: kierunek wiadomości, `inbound` lub `outbound`
- `--channel <channel>`: dokładny kanał wiadomości
- `--after <timestamp>` / `--before <timestamp>`: włącznie znacznik czasu ISO lub
  milisekundy czasu uniksowego
- `--limit <count>`: rozmiar strony od 1 do 500; domyślnie `100`
- `--cursor <sequence>`: kontynuuj poprzednie zapytanie uporządkowane od najnowszych
- `--json`: wyświetl ograniczoną stronę jako JSON

CLI wysyła zapytania do wersjonowanego RPC aktywności, dzięki czemu jedno polecenie pokazuje cały
skonfigurowany rejestr. Dane tekstowe zawierają czas, rodzaj, kierunek, kanał, status,
agenta, uruchomienie i działanie. Brakujące pochodzenie wiadomości jest wyświetlane jako `-`; OpenClaw
nie wymyśla identyfikatorów agentów ani uruchomień. Działania narzędzi zawierają również nazwę narzędzia. Dane wyjściowe
JSON zawierają `nextCursor`, gdy istnieje kolejna strona. Przekaż tę wartość do
`--cursor`, aby kontynuować bez zmiany kolejności rekordów napływających podczas stronicowania.

Te eksporty pozostają wrażliwymi metadanymi operacyjnymi, mimo że nie zawierają treści wiadomości
ani nieprzetworzonych pól ich tożsamości. Identyfikatory agentów, sesji i uruchomień, informacje o czasie,
kanały, wyniki i stabilne odwołania HMAC mogą umożliwiać korelację aktywności. Należy chronić
je za pomocą takich samych mechanizmów kontroli dostępu i zasad retencji jak inne rejestry
operatora.

## Rejestrowane zdarzenia

Gateway odwzorowuje zaufane strumienie cyklu życia na sześć działań:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Każdy zwrócony rekord ma stabilny identyfikator zdarzenia, monotonicznie rosnący numer
sekwencji rejestru, znacznik czasu cyklu życia, wykonawcę, działanie, status,
znacznik `schemaVersion: 1`, sekwencję źródłową i `redaction: "metadata_only"`.
Dane o pochodzeniu agenta/sesji/uruchomienia oraz pola specyficzne dla zdarzenia występują tylko wtedy, gdy
udostępnia je zaufane źródło. Rekordy wiadomości celowo pomijają
`sessionKey` i `sessionId`, dlatego filtry `--session` obejmują tylko rekordy uruchomień i narzędzi.

Końcowe rekordy uruchomień i narzędzi rozróżniają powodzenie, niepowodzenie, anulowanie,
przekroczenie limitu czasu i blokady zasad za pomocą zamkniętego statusu i kodów błędów. `unknown` jest
jawnym wynikiem innym niż powodzenie, gdy nadrzędne środowisko uruchomieniowe nie udostępnia
autorytatywnego wyniku końcowego. Identyfikatory wywołań narzędzi są eksportowane wyłącznie jako stabilne
odciski. Nazwy narzędzi muszą być zgodne z kontraktem zwięzłych nazw udostępnianych modelowi;
inne wartości stają się `unknown`.

Rekordy wiadomości dodają kierunek, kanał, rodzaj konwersacji, wynik i opcjonalnie
rodzaj dostarczenia, etap niepowodzenia, czas trwania, liczbę wyników, znormalizowany
kod przyczyny oraz pseudonimy konta/konwersacji/wiadomości/celu z kluczem. Obecna
granica ruchu przychodzącego obejmuje zaakceptowane wiadomości docierające do głównego mechanizmu rozsyłania,
w tym wyniki deduplikacji i końcowego przetwarzania przez rdzeń. Granica ruchu wychodzącego
zapisuje jeden końcowy wiersz dla każdego pierwotnego logicznego ładunku odpowiedzi, który dociera
do współdzielonego trwałego mechanizmu dostarczania; dzielenie na fragmenty i rozsyłanie przez adaptery są agregowane w
`resultCount`. Zakolejkowane wysyłki możliwe do ponowienia lub niejednoznaczne są rejestrowane dopiero po
potwierdzeniu, przeniesieniu do kolejki martwych wiadomości lub uzgodnieniu, które czyni wynik końcowym.
Ścieżki lokalne dla Pluginu i bezpośredniego wysyłania, które omijają te współdzielone granice, nie są
jeszcze objęte; brak wiersza nie dowodzi, że wiadomość nie istniała.

Rejestr audytu nie zastępuje transkrypcji, historii zadań, historii uruchomień Cron
ani dzienników. Zapewnia niewielki indeks obejmujący wiele uruchomień na potrzeby zapytań operatora bez
kopiowania treści konwersacji do innego magazynu.

W przypadku wierszy przychodzących `durationMs` mierzy rozsyłanie przez rdzeń, a `resultCount` zlicza
sfinalizowane zakolejkowane ładunki narzędzi, blokad i odpowiedzi. W przypadku wierszy wychodzących
`durationMs` obejmuje własność dostarczenia aż do jego zakończenia (a więc także
czas oczekiwania w kolejce), natomiast `resultCount` zlicza zidentyfikowane fizyczne wysyłki
na platformę. `deliveryKind`, jeśli występuje, opisuje efektywny ładunek po wykonaniu hooka
i renderowaniu; wiersze wygaszone i niejednoznaczne z powodu awarii pomijają tę wartość.

## RPC Gateway

`audit.activity.list` wymaga `operator.read` i przyjmuje te same filtry. Zwraca
nazwaną unię zdarzeń aktywności V1, obejmującą rekordy uruchomień, narzędzi oraz wiadomości
przychodzących i wychodzących.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Wynikiem jest `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Wyniki są uporządkowane od najnowszych i ograniczone do 500 rekordów na żądanie.

Dostarczone RPC `audit.list` pozostaje bez zmian dla starszych klientów uruchomień/narzędzi. Gdy
`audit.activity.list` jest niedostępne w starszym Gateway, CLI ponawia próbę za pomocą
`audit.list` tylko wtedy, gdy wszystkie żądane filtry są obsługiwane przez tę starszą metodę. `--kind message`,
`--direction` i `--channel` kończą się komunikatem o konieczności aktualizacji w starszym Gateway,
zamiast być po cichu odrzucane.

## Powiązane

- [Historia audytu](/gateway/audit)
- [Protokół Gateway](/pl/gateway/protocol#audit-ledger-rpc)
- [Sesje](/pl/cli/sessions)
- [Zadania](/pl/cli/tasks)
- [Zadania Cron](/pl/automation/cron-jobs)
