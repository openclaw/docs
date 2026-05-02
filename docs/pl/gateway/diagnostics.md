---
read_when:
    - Przygotowanie zgłoszenia błędu lub prośby o wsparcie
    - Debugowanie awarii Gateway, restartów, presji pamięciowej lub zbyt dużych ładunków
    - Przeglądanie, jakie dane diagnostyczne są zapisywane lub maskowane
summary: Twórz udostępnialne pakiety diagnostyczne Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-05-02T09:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalne archiwum diagnostyczne zip do zgłoszeń błędów. Łączy
oczyszczony status Gateway, kondycję, logi, kształt konfiguracji oraz ostatnie
zdarzenia stabilności bez ładunków.

Traktuj pakiety diagnostyczne jak sekrety, dopóki ich nie przejrzysz. Zostały
zaprojektowane tak, aby pomijać lub redagować ładunki i dane uwierzytelniające,
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

Właściciele mogą użyć `/diagnostics [note]` na czacie, aby poprosić o lokalny eksport Gateway.
Użyj tego, gdy błąd wystąpił w prawdziwej rozmowie i chcesz uzyskać jeden
raport dla wsparcia, który da się łatwo wkleić:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj
   krótką notatkę, jeśli pomoże, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła wstęp diagnostyczny i prosi o jedną wyraźną zgodę na exec.
   Zgoda uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki przez regułę zezwalającą na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia, zawierającym lokalną
   ścieżkę pakietu, podsumowanie manifestu, informacje o prywatności oraz odpowiednie identyfikatory sesji.

W czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw nie
publikuje szczegółów diagnostycznych z powrotem we wspólnym czacie. Wysyła wstęp,
monity o zatwierdzenie, wynik eksportu Gateway oraz rozbicie sesji/wątków Codex
do właściciela prywatną ścieżką zatwierdzania. Grupa otrzymuje tylko krótką informację,
że przepływ diagnostyczny został wysłany prywatnie. Jeśli OpenClaw nie może znaleźć prywatnej
trasy do właściciela, polecenie kończy się bezpiecznie niepowodzeniem i prosi właściciela o uruchomienie go z DM.

Gdy aktywna sesja OpenClaw używa natywnego harnessu OpenAI Codex,
ta sama zgoda na exec obejmuje także przesłanie opinii OpenAI dla wątków środowiska
uruchomieniowego Codex, o których wie OpenClaw. To przesłanie jest oddzielne od lokalnego
pliku zip Gateway i pojawia się tylko w sesjach harnessu Codex. Przed zatwierdzeniem
monit wyjaśnia, że zatwierdzenie diagnostyki wyśle także opinię Codex, ale
nie wymienia identyfikatorów sesji ani wątków Codex. Po zatwierdzeniu odpowiedź na czacie wymienia
kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia wznawiania
dla wątków wysłanych na serwery OpenAI. Jeśli odmówisz lub zignorujesz
zatwierdzenie, OpenClaw nie uruchomi eksportu, nie wyśle opinii Codex i
nie wypisze identyfikatorów Codex.

To skraca typową pętlę debugowania Codex: zauważ niewłaściwe zachowanie w
Telegram, Discord lub innym kanale, uruchom `/diagnostics`, zatwierdź raz, udostępnij
raport wsparciu, a następnie uruchom lokalnie wypisane polecenie `codex resume <thread-id>`,
jeśli chcesz samodzielnie sprawdzić natywny wątek Codex. Zobacz
[harness Codex](/pl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli), aby poznać
ten przepływ inspekcji.

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla wsparcia.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów, statusu, kondycji
  i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane linie logów.
- Najlepsze możliwe migawki statusu i kondycji Gateway.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, gdy jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway jest w złym stanie. Jeśli Gateway nie może
odpowiedzieć na żądania statusu lub kondycji, lokalne logi, kształt konfiguracji i najnowszy
pakiet stabilności nadal są zbierane, gdy są dostępne.

## Model prywatności

Diagnostyka jest projektowana tak, aby można było ją udostępniać. Eksport zachowuje dane operacyjne,
które pomagają w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory Plugin, identyfikatory providerów, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, prompty, instrukcje, treści Webhook i wyjścia narzędzi
- dane uwierzytelniające, klucze API, tokeny, pliki cookie i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, promptu lub ładunku narzędzia,
eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie zapisuje ograniczony strumień stabilności bez ładunków, gdy
diagnostyka jest włączona. Dotyczy to faktów operacyjnych, nie treści.

Ten sam diagnostyczny Heartbeat zapisuje próbki żywotności, gdy Gateway nadal działa,
ale pętla zdarzeń Node.js lub CPU wygląda na przeciążoną. Te zdarzenia
`diagnostic.liveness.warning` obejmują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń,
współczynnik rdzeni CPU oraz liczby aktywnych/oczekujących/zakolejkowanych sesji. Próbki bezczynności
pozostają w telemetrii na poziomie `info`; są logowane jako ostrzeżenia Gateway
tylko wtedy, gdy praca diagnostyczna jest aktywna, oczekuje lub jest w kolejce. Same z siebie nie
restartują Gateway.

Sprawdź rejestrator na żywo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po krytycznym zakończeniu, przekroczeniu czasu zamknięcia
lub niepowodzeniu startu po restarcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz diagnostyczny plik zip z najnowszego utrwalonego pakietu:

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

## Powiązane

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do strumieniowania diagnostyki do kolektora
