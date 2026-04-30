---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o wsparcie
    - Debugowanie awarii Gateway, ponownych uruchomień, presji pamięci lub zbyt dużych ładunków
    - Sprawdzanie, jakie dane diagnostyczne są rejestrowane lub maskowane
summary: Utwórz udostępnialne pakiety diagnostyczne Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-04-30T09:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalny plik zip diagnostyki do zgłoszeń błędów. Łączy on
oczyszczony status Gateway, kondycję, logi, kształt konfiguracji oraz ostatnie
zdarzenia stabilności bez danych payload.

Traktuj pakiety diagnostyczne jak sekrety, dopóki ich nie przejrzysz. Zostały
zaprojektowane tak, aby pomijać lub redagować payloady i poświadczenia, ale nadal
podsumowują lokalne logi Gateway oraz stan runtime na poziomie hosta.

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

## Polecenie na czacie

Właściciele mogą użyć `/diagnostics [note]` na czacie, aby zażądać lokalnego eksportu Gateway.
Użyj tego, gdy błąd wystąpił w prawdziwej rozmowie i chcesz mieć jeden
raport do skopiowania i wklejenia dla wsparcia:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj
   krótką notatkę, jeśli to pomoże, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła wstęp diagnostyczny i prosi o jedną jawną zgodę na wykonanie
   polecenia. Zgoda uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki przez regułę zezwalającą na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia, zawierającym lokalną
   ścieżkę pakietu, podsumowanie manifestu, uwagi dotyczące prywatności oraz istotne identyfikatory sesji.

Na czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw nie
publikuje szczegółów diagnostycznych z powrotem we współdzielonym czacie. Wysyła wstęp,
prośby o zatwierdzenie, wynik eksportu Gateway oraz podział sesji/wątków Codex
do właściciela przez prywatną ścieżkę zatwierdzania. Grupa otrzymuje tylko krótką informację,
że przepływ diagnostyczny został wysłany prywatnie. Jeśli OpenClaw nie może znaleźć prywatnej
ścieżki do właściciela, polecenie kończy się bezpiecznym niepowodzeniem i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Gdy aktywna sesja OpenClaw używa natywnego harnessu OpenAI Codex,
ta sama zgoda na wykonanie polecenia obejmuje także przesłanie opinii OpenAI dla wątków runtime Codex,
o których wie OpenClaw. To przesłanie jest oddzielne od lokalnego pliku zip Gateway
i pojawia się tylko dla sesji harnessu Codex. Przed zatwierdzeniem
komunikat wyjaśnia, że zatwierdzenie diagnostyki wyśle także opinię Codex, ale
nie wyświetla identyfikatorów sesji ani wątków Codex. Po zatwierdzeniu odpowiedź na czacie zawiera
kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia wznawiania
dla wątków wysłanych na serwery OpenAI. Jeśli odmówisz lub zignorujesz
zatwierdzenie, OpenClaw nie uruchomi eksportu, nie wyśle opinii Codex i
nie wypisze identyfikatorów Codex.

Dzięki temu typowa pętla debugowania Codex jest krótka: zauważ niewłaściwe zachowanie w
Telegram, Discord lub innym kanale, uruchom `/diagnostics`, zatwierdź raz, udostępnij
raport wsparciu, a następnie uruchom wypisane polecenie `codex resume <thread-id>`
lokalnie, jeśli chcesz samodzielnie sprawdzić natywny wątek Codex. Zobacz
[Harness Codex](/pl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli), aby poznać
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

Diagnostyka została zaprojektowana tak, aby można było ją udostępniać. Eksport zachowuje dane operacyjne,
które pomagają w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory pluginów, identyfikatory providerów, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, prompty, instrukcje, treści webhooków i wyniki narzędzi
- poświadczenia, klucze API, tokeny, pliki cookie i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, promptu lub payload narzędzia,
eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony strumień stabilności bez danych payload, gdy
diagnostyka jest włączona. Służy on faktom operacyjnym, a nie treści.

Ten sam diagnostyczny heartbeat rejestruje ostrzeżenia żywotności, gdy Gateway nadal
działa, ale pętla zdarzeń Node.js lub CPU wydają się przeciążone. Te zdarzenia
`diagnostic.liveness.warning` zawierają opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń,
stosunek rdzeni CPU oraz liczby aktywnych/oczekujących/zakolejkowanych sesji. Same z siebie
nie restartują Gateway.

Sprawdź rejestrator na żywo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po fatalnym zakończeniu, przekroczeniu czasu
zamykania lub błędzie uruchomienia po restarcie:

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
- `--log-lines <count>`: maksymalna liczba oczyszczonych linii logu do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logu do sprawdzenia.
- `--url <url>`: adres URL WebSocket Gateway dla migawek statusu i kondycji.
- `--token <token>`: token Gateway dla migawek statusu i kondycji.
- `--password <password>`: hasło Gateway dla migawek statusu i kondycji.
- `--timeout <ms>`: limit czasu migawek statusu i kondycji.
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

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów. Nie wpływa na normalne
logowanie Gateway.

## Powiązane

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do strumieniowania diagnostyki do kolektora
