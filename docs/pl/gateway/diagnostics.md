---
read_when:
    - Przygotowywanie zgłoszenia błędu albo prośby o wsparcie.
    - Debugowanie awarii Gateway, restartów, presji pamięci albo zbyt dużych ładunków.
    - Przeglądanie tego, jakie dane diagnostyczne są rejestrowane albo redagowane.
summary: Tworzenie pakietów diagnostycznych Gateway do udostępniania w zgłoszeniach błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-04-24T09:09:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw może utworzyć lokalny plik zip z diagnostyką, który można bezpiecznie dołączyć do zgłoszeń błędów. Łączy on oczyszczony status Gateway, health, logi, kształt konfiguracji oraz ostatnie zdarzenia stabilności bez ładunków.

## Szybki start

```bash
openclaw gateway diagnostics export
```

Polecenie wypisuje ścieżkę do zapisanego pliku zip. Aby wybrać ścieżkę:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Do automatyzacji:

```bash
openclaw gateway diagnostics export --json
```

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla wsparcia.
- `diagnostics.json`: czytelne dla maszyn podsumowanie konfiguracji, logów, statusu, health i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane linie logów.
- Snapshoty statusu i health Gateway w trybie best-effort.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, jeśli jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway nie działa poprawnie. Jeśli Gateway nie może odpowiedzieć na żądania statusu albo health, lokalne logi, kształt konfiguracji i najnowszy pakiet stabilności są nadal zbierane, jeśli są dostępne.

## Model prywatności

Diagnostyka jest projektowana tak, aby można ją było udostępniać. Eksport zachowuje dane operacyjne pomocne w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory Pluginów, identyfikatory dostawców, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija albo redaguje:

- tekst czatu, prompty, instrukcje, treści webhooków i wyniki narzędzi
- poświadczenia, klucze API, tokeny, cookies i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst ładunku użytkownika, czatu, promptu albo narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony, pozbawiony ładunków strumień stabilności, gdy diagnostyka jest włączona. Służy on do faktów operacyjnych, a nie treści.

Sprawdź aktywny rejestrator:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po błędzie krytycznym, przekroczeniu czasu zamykania albo błędzie startu po restarcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz plik zip z diagnostyką na podstawie najnowszego utrwalonego pakietu:

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

- `--output <path>`: zapisuje do określonej ścieżki zip.
- `--log-lines <count>`: maksymalna liczba oczyszczonych linii logów do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do sprawdzenia.
- `--url <url>`: URL WebSocket Gateway do snapshotów statusu i health.
- `--token <token>`: token Gateway do snapshotów statusu i health.
- `--password <password>`: hasło Gateway do snapshotów statusu i health.
- `--timeout <ms>`: limit czasu snapshotów statusu i health.
- `--no-stability-bundle`: pomija wyszukiwanie utrwalonego pakietu stabilności.
- `--json`: wypisuje czytelne dla maszyn metadane eksportu.

## Wyłączanie diagnostyki

Diagnostyka jest domyślnie włączona. Aby wyłączyć rejestrator stabilności i zbieranie zdarzeń diagnostycznych:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów. Nie wpływa na zwykłe logowanie Gateway.

## Powiązana dokumentacja

- [Health Checks](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
