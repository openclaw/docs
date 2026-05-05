---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o wsparcie
    - Debugowanie awarii Gateway, ponownych uruchomień, presji pamięciowej lub zbyt dużych ładunków danych
    - Sprawdzanie, jakie dane diagnostyczne są zapisywane lub maskowane
summary: Twórz udostępnialne pakiety diagnostyczne Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-05-05T01:46:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalny plik zip diagnostyki do zgłoszeń błędów. Łączy
oczyszczony status Gateway, stan zdrowia, logi, kształt konfiguracji oraz
ostatnie zdarzenia stabilności bez ładunków.

Traktuj pakiety diagnostyczne jak sekrety, dopóki ich nie przejrzysz. Są
zaprojektowane tak, aby pomijać lub redagować ładunki i dane uwierzytelniające,
ale nadal podsumowują lokalne logi Gateway oraz stan uruchomieniowy na poziomie hosta.

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

Właściciele mogą użyć `/diagnostics [note]` na czacie, aby zażądać lokalnego
eksportu Gateway. Użyj tego, gdy błąd wystąpił w rzeczywistej rozmowie i chcesz
uzyskać jeden raport dla pomocy technicznej, który można wkleić:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj krótką
   notatkę, jeśli to pomoże, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła wstęp diagnostyki i prosi o jedno jawne zatwierdzenie exec.
   Zatwierdzenie uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki przez regułę zezwalającą na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia, zawierającym
   lokalną ścieżkę pakietu, podsumowanie manifestu, uwagi o prywatności oraz
   odpowiednie identyfikatory sesji.

W czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw
nie publikuje szczegółów diagnostycznych z powrotem we wspólnym czacie. Wysyła
wstęp, monity zatwierdzenia, wynik eksportu Gateway oraz podział sesji/wątków
Codex do właściciela przez prywatną trasę zatwierdzania. Grupa otrzymuje tylko
krótką informację, że przepływ diagnostyki został wysłany prywatnie. Jeśli
OpenClaw nie może znaleźć prywatnej trasy do właściciela, polecenie kończy się
bezpieczną odmową i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Gdy aktywna sesja OpenClaw używa natywnego środowiska OpenAI Codex, to samo
zatwierdzenie exec obejmuje również przesłanie opinii do OpenAI dla wątków
środowiska uruchomieniowego Codex, o których wie OpenClaw. To przesłanie jest
oddzielne od lokalnego pliku zip Gateway i pojawia się tylko w sesjach środowiska
Codex. Przed zatwierdzeniem monit wyjaśnia, że zatwierdzenie diagnostyki wyśle
również opinię Codex, ale nie wymienia identyfikatorów sesji ani wątków Codex. Po
zatwierdzeniu odpowiedź na czacie wymienia kanały, identyfikatory sesji OpenClaw,
identyfikatory wątków Codex oraz lokalne polecenia wznawiania dla wątków
wysłanych na serwery OpenAI. Jeśli odmówisz zatwierdzenia lub je zignorujesz,
OpenClaw nie uruchomi eksportu, nie wyśle opinii Codex i nie wypisze
identyfikatorów Codex.

Dzięki temu typowa pętla debugowania Codex jest krótka: zauważ złe zachowanie w
Telegram, Discord lub innym kanale, uruchom `/diagnostics`, zatwierdź raz,
udostępnij raport pomocy technicznej, a następnie uruchom lokalnie wypisane
polecenie `codex resume <thread-id>`, jeśli chcesz samodzielnie sprawdzić
natywny wątek Codex. Zobacz
[środowisko Codex](/pl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli),
aby poznać ten przepływ inspekcji.

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla pomocy technicznej.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów,
  statusu, zdrowia i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane wiersze logów.
- Migawki statusu i zdrowia Gateway wykonywane w trybie najlepszych starań.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, gdy jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway jest w złym stanie. Jeśli Gateway
nie może odpowiedzieć na żądania statusu lub zdrowia, lokalne logi, kształt
konfiguracji i najnowszy pakiet stabilności nadal są zbierane, gdy są dostępne.

## Model prywatności

Diagnostyka jest zaprojektowana tak, aby można ją było udostępniać. Eksport
zachowuje dane operacyjne pomocne w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory pluginów, identyfikatory dostawców, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, monity, instrukcje, treści webhooków i wyjścia narzędzi
- dane uwierzytelniające, klucze API, tokeny, pliki cookie i wartości sekretne
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, monitu lub ładunku
narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty,
oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony strumień stabilności bez ładunków, gdy
diagnostyka jest włączona. Jest przeznaczony do faktów operacyjnych, nie treści.

Ten sam diagnostyczny heartbeat rejestruje próbki żywotności, gdy Gateway nadal
działa, ale pętla zdarzeń Node.js lub CPU wygląda na przeciążoną. Te zdarzenia
`diagnostic.liveness.warning` obejmują opóźnienie pętli zdarzeń, wykorzystanie
pętli zdarzeń, stosunek rdzeni CPU, liczby aktywnych/oczekujących/kolejkowanych
sesji, bieżącą fazę startu/środowiska uruchomieniowego, gdy jest znana, ostatnie
zakresy faz oraz ograniczone etykiety aktywnej/kolejkowanej pracy. Próbki
bezczynności pozostają w telemetrii na poziomie `info`. Próbki żywotności stają
się ostrzeżeniami Gateway tylko wtedy, gdy praca czeka lub jest w kolejce, albo
gdy aktywna praca nakłada się na utrzymujące się opóźnienie pętli zdarzeń.
Przejściowe skoki maksymalnego opóźnienia podczas poza tym zdrowej pracy w tle
pozostają w logach debugowania. Same z siebie nie restartują Gateway.

Fazy startu emitują również zdarzenia `diagnostic.phase.completed` z czasem
zegarowym i czasem CPU. Diagnostyka zablokowanego uruchomienia osadzonego oznacza
`terminalProgressStale=true`, gdy ostatni postęp mostka wyglądał na terminalny,
na przykład surowy element odpowiedzi lub zdarzenie zakończenia odpowiedzi, ale
Gateway nadal uznaje uruchomienie osadzone za aktywne.

Sprawdź rejestrator na żywo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po krytycznym zakończeniu,
przekroczeniu limitu czasu zamykania lub niepowodzeniu startu po restarcie:

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
- `--log-lines <count>`: maksymalna liczba oczyszczonych wierszy logu do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logu do sprawdzenia.
- `--url <url>`: adres URL WebSocket Gateway dla migawek statusu i zdrowia.
- `--token <token>`: token Gateway dla migawek statusu i zdrowia.
- `--password <password>`: hasło Gateway dla migawek statusu i zdrowia.
- `--timeout <ms>`: limit czasu migawek statusu i zdrowia.
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

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów. Nie wpływa na
normalne logowanie Gateway.

## Powiązane

- [Kontrole zdrowia](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do strumieniowania diagnostyki do kolektora
