---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o pomoc techniczną
    - Debugowanie awarii Gateway, ponownych uruchomień, presji pamięciowej lub zbyt dużych ładunków
    - Sprawdzanie, jakie dane diagnostyczne są rejestrowane lub maskowane
summary: Tworzenie udostępnialnych pakietów diagnostycznych Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-05-03T21:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalny plik zip diagnostyki do zgłoszeń błędów. Łączy on oczyszczony stan Gateway, kondycję, logi, kształt konfiguracji oraz ostatnie, pozbawione ładunków zdarzenia stabilności.

Traktuj pakiety diagnostyczne jak sekrety, dopóki ich nie przejrzysz. Są zaprojektowane tak, aby pomijać lub redagować ładunki i poświadczenia, ale nadal podsumowują lokalne logi Gateway oraz stan środowiska uruchomieniowego na poziomie hosta.

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
raport dla wsparcia, możliwy do skopiowania i wklejenia:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj
   krótką notatkę, jeśli pomoże, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła wstęp diagnostyki i prosi o jedną wyraźną zgodę na wykonanie.
   Zgoda uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki przez regułę allow-all.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia, zawierającym lokalną
   ścieżkę pakietu, podsumowanie manifestu, informacje o prywatności oraz odpowiednie identyfikatory sesji.

Na czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw nie
publikuje szczegółów diagnostycznych z powrotem we wspólnym czacie. Wysyła wstęp,
monity zatwierdzenia, wynik eksportu Gateway oraz podział sesji/wątku Codex do
właściciela przez prywatną ścieżkę zatwierdzania. Grupa otrzymuje tylko krótkie powiadomienie,
że przepływ diagnostyczny został wysłany prywatnie. Jeśli OpenClaw nie może znaleźć prywatnej
ścieżki do właściciela, polecenie kończy się zamknięciem i prosi właściciela o uruchomienie go z DM.

Gdy aktywna sesja OpenClaw używa natywnego środowiska OpenAI Codex,
ta sama zgoda na wykonanie obejmuje również przesłanie opinii OpenAI dla wątków środowiska
uruchomieniowego Codex znanych OpenClaw. To przesłanie jest oddzielne od lokalnego
pliku zip Gateway i pojawia się tylko dla sesji środowiska Codex. Przed zatwierdzeniem
monit wyjaśnia, że zatwierdzenie diagnostyki wyśle też opinię Codex, ale
nie wypisuje identyfikatorów sesji ani wątków Codex. Po zatwierdzeniu odpowiedź na czacie wypisuje
kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia wznawiania
dla wątków wysłanych na serwery OpenAI. Jeśli odmówisz lub zignorujesz
zatwierdzenie, OpenClaw nie uruchomi eksportu, nie wyśle opinii Codex i
nie wypisze identyfikatorów Codex.

Dzięki temu typowa pętla debugowania Codex jest krótka: zauważ nieprawidłowe zachowanie w
Telegram, Discord lub innym kanale, uruchom `/diagnostics`, zatwierdź raz, udostępnij
raport wsparciu, a następnie uruchom wypisane polecenie `codex resume <thread-id>`
lokalnie, jeśli chcesz samodzielnie sprawdzić natywny wątek Codex. Zobacz
[środowisko Codex](/pl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli), aby poznać
ten przepływ inspekcji.

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla wsparcia.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów, stanu, kondycji
  i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji oraz niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane wiersze logów.
- Migawki stanu i kondycji Gateway wykonane w trybie najlepszej próby.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, gdy jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway jest w złej kondycji. Jeśli Gateway nie może
odpowiedzieć na żądania stanu lub kondycji, lokalne logi, kształt konfiguracji i najnowszy
pakiet stabilności nadal są zbierane, gdy są dostępne.

## Model prywatności

Diagnostyka jest projektowana tak, aby można było ją udostępniać. Eksport zachowuje dane operacyjne,
które pomagają w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory pluginów, identyfikatory dostawców, identyfikatory kanałów i skonfigurowane tryby
- kody stanu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, monity, instrukcje, treści Webhook i wyniki narzędzi
- poświadczenia, klucze API, tokeny, pliki cookie i wartości sekretne
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, monitu lub ładunku narzędzia,
eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony, pozbawiony ładunków strumień stabilności, gdy
diagnostyka jest włączona. Służy on do faktów operacyjnych, nie treści.

Ten sam diagnostyczny Heartbeat rejestruje próbki żywotności, gdy Gateway nadal
działa, ale pętla zdarzeń Node.js lub CPU wygląda na nasycone. Te zdarzenia
`diagnostic.liveness.warning` obejmują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń,
współczynnik rdzeni CPU oraz liczby aktywnych/oczekujących/skolejkowanych sesji. Próbki bezczynności
pozostają w telemetrii na poziomie `info`. Próbki żywotności stają się ostrzeżeniami Gateway
tylko wtedy, gdy praca oczekuje lub jest w kolejce, albo gdy aktywna praca nakłada się na
utrzymujące się opóźnienie pętli zdarzeń. Przejściowe skoki maksymalnego opóźnienia podczas skądinąd zdrowej
pracy w tle pozostają w logach debugowania. Same z siebie nie restartują Gateway.

Sprawdź rejestrator na żywo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po fatalnym zakończeniu, przekroczeniu czasu
zamykania lub błędzie uruchamiania po restarcie:

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

- `--output <path>`: zapisz do określonej ścieżki pliku zip.
- `--log-lines <count>`: maksymalna liczba oczyszczonych wierszy logów do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do sprawdzenia.
- `--url <url>`: adres URL WebSocket Gateway dla migawek stanu i kondycji.
- `--token <token>`: token Gateway dla migawek stanu i kondycji.
- `--password <password>`: hasło Gateway dla migawek stanu i kondycji.
- `--timeout <ms>`: limit czasu migawek stanu i kondycji.
- `--no-stability-bundle`: pomiń wyszukiwanie utrwalonego pakietu stabilności.
- `--json`: wypisz czytelne maszynowo metadane eksportu.

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

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszenia błędu. Nie wpływa na normalne
logowanie Gateway.

## Powiązane

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do przesyłania strumieniowego diagnostyki do kolektora
