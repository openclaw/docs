---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o pomoc techniczną
    - Debugowanie awarii i ponownych uruchomień Gateway, presji na pamięć oraz zbyt dużych ładunków danych
    - Sprawdzanie, jakie dane diagnostyczne są rejestrowane lub redagowane
summary: Tworzenie pakietów diagnostycznych Gateway do udostępniania w zgłoszeniach błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-07-12T15:03:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalne archiwum diagnostyczne `.zip` na potrzeby zgłoszeń błędów: oczyszczone dane o stanie i kondycji Gateway, logi, strukturę konfiguracji oraz ostatnie zdarzenia stabilności bez danych użytkownika.

Traktuj pakiety diagnostyczne jak dane poufne do czasu ich sprawdzenia. Dane użytkownika i dane uwierzytelniające są celowo redagowane, ale pakiet nadal zawiera podsumowanie lokalnych logów Gateway oraz stanu środowiska uruchomieniowego hosta.

## Szybki start

```bash
openclaw gateway diagnostics export
```

Wyświetla ścieżkę zapisanego archiwum zip. Aby wybrać ścieżkę wyjściową:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Na potrzeby automatyzacji:

```bash
openclaw gateway diagnostics export --json
```

## Polecenie czatu

Właściciele mogą uruchomić `/diagnostics [note]` w dowolnej rozmowie, aby zażądać lokalnego eksportu Gateway w postaci jednego raportu pomocy technicznej, który można łatwo skopiować i wkleić:

1. Wyślij `/diagnostics`, opcjonalnie z krótką notatką (`/diagnostics niewłaściwy wybór narzędzia`).
2. OpenClaw wysyła komunikat wstępny i prosi o jedno jawne zatwierdzenie wykonania polecenia, które uruchamia
   `openclaw gateway diagnostics export --json`. Nie zatwierdzaj diagnostyki za pomocą
   reguły zezwalającej na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada, podając lokalną ścieżkę pakietu, podsumowanie
   manifestu, uwagi dotyczące prywatności oraz odpowiednie identyfikatory sesji.

W czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw wysyła
wynik eksportu, monity o zatwierdzenie oraz zestawienie sesji i wątków Codex
prywatnie do właściciela. Grupa widzi jedynie krótką informację, że dane diagnostyczne
zostały wysłane prywatnie. Jeśli nie istnieje prywatna trasa do właściciela, polecenie
kończy się bezpiecznym niepowodzeniem i prosi właściciela o uruchomienie go w wiadomości prywatnej.

Gdy aktywna sesja korzysta z natywnego środowiska OpenAI Codex, to samo zatwierdzenie
wykonania obejmuje również przesłanie opinii do OpenAI dla wątków Codex znanych
OpenClaw. To przesłanie jest niezależne od lokalnego archiwum zip Gateway i następuje
wyłącznie w przypadku sesji środowiska Codex. Monit o zatwierdzenie informuje, że
zatwierdzenie powoduje również wysłanie opinii dotyczącej Codex, bez wymieniania
identyfikatorów sesji ani wątków Codex. Po zatwierdzeniu odpowiedź zawiera kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia
wznawiania dla wątków wysłanych do OpenAI. Odrzucenie lub zignorowanie zatwierdzenia
pomija eksport, przesłanie opinii dotyczącej Codex oraz listę identyfikatorów Codex.

Dzięki temu proces debugowania Codex jest krótki: zauważ nieprawidłowe zachowanie
na kanale, uruchom `/diagnostics`, zatwierdź jeden raz, udostępnij raport, a następnie
uruchom lokalnie wyświetlone polecenie `codex resume <thread-id>`, jeśli chcesz
samodzielnie sprawdzić wątek. Zobacz [Środowisko Codex](/pl/plugins/codex-harness#inspect-codex-threads-locally).

## Zawartość eksportu

- `summary.md`: czytelny dla człowieka przegląd przeznaczony dla pomocy technicznej.
- `diagnostics.json`: podsumowanie konfiguracji, logów, stanu, kondycji
  i danych o stabilności w formacie przeznaczonym do przetwarzania maszynowego.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczona struktura konfiguracji i niepoufne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane wiersze logów.
- Migawki stanu i kondycji Gateway uzyskane w miarę możliwości.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, jeśli jest dostępny.

Eksport pozostaje przydatny nawet wtedy, gdy Gateway działa nieprawidłowo: jeśli
żądania stanu lub kondycji zakończą się niepowodzeniem, lokalne logi, struktura
konfiguracji i najnowszy pakiet stabilności nadal są gromadzone, jeśli są dostępne.

## Model prywatności

Zachowywane: nazwy podsystemów, identyfikatory pluginów, identyfikatory dostawców,
identyfikatory kanałów, skonfigurowane tryby, kody stanu, czasy trwania, liczby bajtów,
stan kolejek, odczyty pamięci, oczyszczone metadane logów, zredagowane komunikaty
operacyjne, struktura konfiguracji oraz niepoufne ustawienia funkcji.

Pomijane lub redagowane: tekst czatów, monity, instrukcje, treści webhooków, dane
wyjściowe narzędzi, dane uwierzytelniające, klucze API, tokeny, pliki cookie, wartości
poufne, nieprzetworzone treści żądań i odpowiedzi, identyfikatory kont, identyfikatory
wiadomości, nieprzetworzone identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników.

Gdy komunikat w logu wygląda jak tekst pochodzący od użytkownika, z czatu, monitu
lub danych narzędzia, eksport zachowuje jedynie informację o pominięciu komunikatu
oraz liczbę jego bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony strumień danych o stabilności bez danych
użytkownika, gdy diagnostyka jest włączona. Przechwytuje fakty operacyjne, a nie treść.

Ten sam Heartbeat próbkuje również żywotność, gdy pętla zdarzeń lub procesor wydają
się przeciążone, emitując zdarzenia `diagnostic.liveness.warning` z opóźnieniem pętli
zdarzeń, wykorzystaniem pętli zdarzeń, współczynnikiem użycia rdzeni procesora, liczbą
aktywnych, oczekujących i kolejkowanych sesji, bieżącą fazą uruchamiania lub działania
(jeśli jest znana), ostatnimi przedziałami faz oraz ograniczonymi etykietami zadań.
Stają się one wierszami logów Gateway na poziomie `warn` tylko wtedy, gdy zadania
oczekują lub znajdują się w kolejce albo gdy aktywne zadania nakładają się na utrzymujące
się opóźnienie pętli zdarzeń; w przeciwnym razie są rejestrowane na poziomie `debug`.
Próbki żywotności podczas bezczynności nadal są rejestrowane jako zdarzenia
diagnostyczne, ale same nigdy nie powodują eskalacji do ostrzeżenia.

Fazy uruchamiania emitują zdarzenia `diagnostic.phase.completed` z czasem zegarowym
i czasem procesora. Diagnostyka zablokowanych osadzonych uruchomień ustawia
`terminalProgressStale=true`, gdy ostatni postęp mostu wyglądał na końcowy
(na przykład nieprzetworzony element odpowiedzi lub zdarzenie zakończenia odpowiedzi),
ale Gateway nadal uznaje osadzone uruchomienie za aktywne.

Sprawdź aktywny rejestrator:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet po krytycznym zakończeniu, przekroczeniu limitu
czasu zamykania lub niepowodzeniu uruchomienia po ponownym starcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz archiwum diagnostyczne zip z najnowszego utrwalonego pakietu:

```bash
openclaw gateway stability --bundle latest --export
```

Utrwalone pakiety są przechowywane w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia.

## Przydatne opcje

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flaga                   | Wartość domyślna                                                             | Opis                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Zapisz pod określoną ścieżką zip lub w katalogu.        |
| `--log-lines <count>`   | `5000`                                                                        | Maksymalna liczba oczyszczonych wierszy logów.          |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Maksymalna liczba bajtów logów do sprawdzenia.          |
| `--url <url>`           | -                                                                             | Adres URL WebSocket Gateway dla migawek stanu/kondycji. |
| `--token <token>`       | -                                                                             | Token Gateway dla migawek stanu/kondycji.               |
| `--password <password>` | -                                                                             | Hasło Gateway dla migawek stanu/kondycji.               |
| `--timeout <ms>`        | `3000`                                                                        | Limit czasu migawki stanu/kondycji.                     |
| `--no-stability-bundle` | wyłączone                                                                     | Pomiń wyszukiwanie utrwalonego pakietu stabilności.     |
| `--json`                | wyłączone                                                                     | Wyświetl metadane eksportu do przetwarzania maszynowego. |

## Wyłączanie diagnostyki

Diagnostyka jest domyślnie włączona. Aby wyłączyć rejestrator stabilności i
gromadzenie zdarzeń diagnostycznych:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów, ale nie wpływa na
standardowe rejestrowanie logów Gateway.

Migawki krytycznego obciążenia pamięci są domyślnie wyłączone. Aby oprócz zwykłych
zdarzeń diagnostycznych przechwytywać migawkę stabilności sprzed błędu braku pamięci:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Używaj tej opcji wyłącznie na hostach, które mogą obsłużyć dodatkowe skanowanie
systemu plików i zapis migawki podczas krytycznego obciążenia pamięci. Zwykłe
zdarzenia obciążenia pamięci nadal rejestrują RSS, stertę, próg oraz dane o wzroście
(`rss_threshold`, `heap_threshold`, `rss_growth`), gdy migawka jest wyłączona.

## Powiązane materiały

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#rpc-method-families)
- [Rejestrowanie logów](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny proces strumieniowego przesyłania danych diagnostycznych do kolektora
