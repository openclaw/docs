---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o pomoc
    - Debugowanie awarii Gateway, restartów, presji na pamięć lub zbyt dużych ładunków
    - Przeglądanie, jakie dane diagnostyczne są rejestrowane lub redagowane
summary: Twórz udostępnialne pakiety diagnostyczne Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-06-27T17:32:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalny plik zip diagnostyki do zgłoszeń błędów. Łączy
oczyszczone informacje o statusie Gateway, kondycji, logach, kształcie konfiguracji
i ostatnich zdarzeniach stabilności bez payloadów.

Traktuj pakiety diagnostyki jak sekrety, dopóki ich nie przejrzysz. Są
zaprojektowane tak, aby pomijać lub redagować payloady i dane uwierzytelniające,
ale nadal podsumowują lokalne logi Gateway oraz stan środowiska uruchomieniowego
na poziomie hosta.

## Szybki start

```bash
openclaw gateway diagnostics export
```

Polecenie wypisuje ścieżkę zapisanego pliku zip. Aby wybrać ścieżkę:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Do automatyzacji:

```bash
openclaw gateway diagnostics export --json
```

## Polecenie czatu

Właściciele mogą użyć `/diagnostics [note]` na czacie, aby zażądać lokalnego eksportu Gateway.
Użyj tego, gdy błąd wystąpił w prawdziwej rozmowie i chcesz uzyskać jeden
raport dla wsparcia, który można wkleić:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj
   krótką notatkę, jeśli to pomaga, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła wstęp diagnostyki i prosi o jedną jawną zgodę na exec.
   Zgoda uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki przez regułę zezwalającą na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia zawierającym lokalną
   ścieżkę pakietu, podsumowanie manifestu, uwagi dotyczące prywatności i odpowiednie identyfikatory sesji.

W czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw nie
publikuje szczegółów diagnostycznych z powrotem na współdzielonym czacie. Wysyła wstęp,
monity zatwierdzenia, wynik eksportu Gateway oraz zestawienie sesji/wątków Codex
do właściciela przez prywatną ścieżkę zatwierdzania. Grupa otrzymuje tylko krótką informację,
że przepływ diagnostyki został wysłany prywatnie. Jeśli OpenClaw nie może znaleźć prywatnej
ścieżki do właściciela, polecenie zamyka się bezpiecznie i prosi właściciela o uruchomienie go z DM.

Gdy aktywna sesja OpenClaw używa natywnego harnessu OpenAI Codex,
ta sama zgoda exec obejmuje także przesłanie opinii OpenAI dla wątków środowiska
uruchomieniowego Codex, o których wie OpenClaw. To przesłanie jest oddzielne od lokalnego
pliku zip Gateway i pojawia się tylko dla sesji harnessu Codex. Przed zatwierdzeniem
monit wyjaśnia, że zatwierdzenie diagnostyki wyśle także opinię Codex, ale
nie wyświetla identyfikatorów sesji ani wątków Codex. Po zatwierdzeniu odpowiedź na czacie podaje
kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia wznawiania
dla wątków wysłanych na serwery OpenAI. Jeśli odmówisz zatwierdzenia lub je zignorujesz,
OpenClaw nie uruchamia eksportu, nie wysyła opinii Codex i
nie wypisuje identyfikatorów Codex.

Dzięki temu typowa pętla debugowania Codex jest krótka: zauważ błędne zachowanie w
Telegram, Discord lub innym kanale, uruchom `/diagnostics`, zatwierdź raz, udostępnij
raport wsparciu, a następnie uruchom wypisane polecenie `codex resume <thread-id>`
lokalnie, jeśli chcesz samodzielnie sprawdzić natywny wątek Codex. Zobacz
[harness Codex](/pl/plugins/codex-harness#inspect-codex-threads-locally), aby poznać
ten przepływ inspekcji.

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla wsparcia.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów, statusu, kondycji
  i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane linie logów.
- Migawki statusu i kondycji Gateway wykonane w trybie najlepszej dostępnej próby.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, jeśli jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway jest w złej kondycji. Jeśli Gateway nie może
odpowiedzieć na żądania statusu lub kondycji, lokalne logi, kształt konfiguracji i najnowszy
pakiet stabilności nadal są zbierane, gdy są dostępne.

## Model prywatności

Diagnostyka jest zaprojektowana tak, aby można ją było udostępniać. Eksport zachowuje dane operacyjne,
które pomagają w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory pluginów, identyfikatory providerów, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, prompty, instrukcje, treści webhooków i wyjścia narzędzi
- dane uwierzytelniające, klucze API, tokeny, ciasteczka i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, promptu lub payloadu narzędzia,
eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony strumień stabilności bez payloadów, gdy
diagnostyka jest włączona. Służy on do faktów operacyjnych, a nie treści.

Ten sam diagnostyczny heartbeat rejestruje próbki żywotności, gdy Gateway nadal
działa, ale pętla zdarzeń Node.js lub CPU wygląda na przeciążone. Te zdarzenia
`diagnostic.liveness.warning` obejmują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń,
stosunek do rdzeni CPU, liczby aktywnych/oczekujących/skolejkowanych sesji, bieżącą
fazę startu/środowiska uruchomieniowego, gdy jest znana, ostatnie przedziały faz oraz ograniczone etykiety
aktywnej/skolejkowanej pracy. Próbki bezczynności pozostają w telemetrii na poziomie `info`.
Próbki żywotności stają się ostrzeżeniami Gateway tylko wtedy, gdy praca oczekuje lub jest w kolejce
albo gdy aktywna praca nakłada się na utrzymujące się opóźnienie pętli zdarzeń. Przejściowe skoki
maksymalnego opóźnienia podczas skądinąd zdrowej pracy w tle pozostają w logach debugowania.
Same nie restartują Gateway.

Fazy startowe emitują także zdarzenia `diagnostic.phase.completed` z czasem zegarowym i
czasem CPU. Diagnostyka zablokowanych uruchomień osadzonych oznacza `terminalProgressStale=true`,
gdy ostatni postęp mostu wyglądał na końcowy, na przykład surowy element odpowiedzi lub
zdarzenie ukończenia odpowiedzi, ale Gateway nadal uznaje uruchomienie osadzone
za aktywne.

Sprawdź rejestrator na żywo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po fatalnym zakończeniu, przekroczeniu czasu
zamykania lub niepowodzeniu startu po restarcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz plik zip diagnostyki z najnowszego utrwalonego pakietu:

```bash
openclaw gateway stability --bundle latest --export
```

Utrwalone pakiety znajdują się w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia.

## Przydatne opcje

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: zapisuje do określonej ścieżki pliku zip.
- `--log-lines <count>`: maksymalna liczba oczyszczonych linii logów do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do sprawdzenia.
- `--url <url>`: URL WebSocket Gateway dla migawek statusu i kondycji.
- `--token <token>`: token Gateway dla migawek statusu i kondycji.
- `--password <password>`: hasło Gateway dla migawek statusu i kondycji.
- `--timeout <ms>`: limit czasu migawek statusu i kondycji.
- `--no-stability-bundle`: pomija wyszukiwanie utrwalonego pakietu stabilności.
- `--json`: wypisuje czytelne maszynowo metadane eksportu.

## Wyłącz diagnostykę

Diagnostyka jest domyślnie włączona. Aby wyłączyć rejestrator stabilności i
zbieranie zdarzeń diagnostycznych:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów. Nie wpływa na normalne
logowanie Gateway.

Migawki krytycznej presji pamięci są domyślnie wyłączone. Aby zachować zdarzenia
diagnostyczne i jednocześnie przechwycić migawkę stabilności sprzed OOM:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Używaj tego tylko na hostach, które mogą tolerować dodatkowe skanowanie systemu plików i zapis
migawki podczas krytycznej presji pamięci. Normalne zdarzenia presji pamięci nadal
rejestrują RSS, stertę, próg i fakty wzrostu, gdy migawka jest wyłączona.

## Powiązane

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do strumieniowania diagnostyki do kolektora
