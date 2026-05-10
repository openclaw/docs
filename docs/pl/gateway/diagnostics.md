---
read_when:
    - Przygotowanie zgłoszenia błędu lub prośby o wsparcie
    - Debugowanie awarii Gateway, ponownych uruchomień, presji na pamięć lub zbyt dużych ładunków
    - Sprawdzanie, jakie dane diagnostyczne są rejestrowane lub maskowane
summary: Tworzenie udostępnialnych pakietów diagnostycznych Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-05-10T19:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw może utworzyć lokalny plik zip diagnostyki do zgłoszeń błędów. Łączy
oczyszczony status Gateway, kondycję, logi, kształt konfiguracji oraz ostatnie
zdarzenia stabilności bez payloadów.

Traktuj pakiety diagnostyczne jak sekrety, dopóki ich nie przejrzysz. Zostały
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

Właściciele mogą użyć `/diagnostics [note]` na czacie, aby zażądać lokalnego
eksportu Gateway. Użyj tego, gdy błąd wystąpił w prawdziwej rozmowie i chcesz
mieć jeden raport możliwy do skopiowania i wklejenia dla pomocy technicznej:

1. Wyślij `/diagnostics` w rozmowie, w której zauważono problem. Dodaj krótką
   notatkę, jeśli to pomaga, na przykład `/diagnostics bad tool choice`.
2. OpenClaw wysyła preambułę diagnostyki i prosi o jedną jawną zgodę na exec.
   Zgoda uruchamia `openclaw gateway diagnostics export --json`.
   Nie zatwierdzaj diagnostyki za pomocą reguły zezwalającej na wszystko.
3. Po zatwierdzeniu OpenClaw odpowiada raportem do wklejenia, zawierającym
   lokalną ścieżkę pakietu, podsumowanie manifestu, uwagi dotyczące prywatności
   oraz odpowiednie identyfikatory sesji.

W czatach grupowych właściciel nadal może uruchomić `/diagnostics`, ale OpenClaw
nie publikuje szczegółów diagnostycznych z powrotem na wspólnym czacie. Wysyła
preambułę, monity zatwierdzenia, wynik eksportu Gateway oraz rozbicie
sesji/wątków Codex do właściciela przez prywatną ścieżkę zatwierdzeń. Grupa
otrzymuje tylko krótkie powiadomienie, że przepływ diagnostyki został wysłany
prywatnie. Jeśli OpenClaw nie może znaleźć prywatnej ścieżki do właściciela,
polecenie kończy się bezpiecznym niepowodzeniem i prosi właściciela o
uruchomienie go z wiadomości prywatnej.

Gdy aktywna sesja OpenClaw używa natywnego harnessa OpenAI Codex, ta sama zgoda
na exec obejmuje także przesłanie opinii do OpenAI dla wątków środowiska
uruchomieniowego Codex, o których wie OpenClaw. To przesłanie jest oddzielne od
lokalnego pliku zip Gateway i pojawia się tylko dla sesji harnessa Codex. Przed
zatwierdzeniem monit wyjaśnia, że zatwierdzenie diagnostyki wyśle także opinię
Codex, ale nie wyświetla identyfikatorów sesji ani wątków Codex. Po
zatwierdzeniu odpowiedź na czacie wymienia kanały, identyfikatory sesji OpenClaw,
identyfikatory wątków Codex oraz lokalne polecenia wznowienia dla wątków
wysłanych na serwery OpenAI. Jeśli odmówisz zatwierdzenia albo je zignorujesz,
OpenClaw nie uruchamia eksportu, nie wysyła opinii Codex i nie wypisuje
identyfikatorów Codex.

Dzięki temu typowa pętla debugowania Codex jest krótka: zauważ nieprawidłowe
zachowanie w Telegram, Discord lub innym kanale, uruchom `/diagnostics`,
zatwierdź raz, udostępnij raport pomocy technicznej, a następnie uruchom
wypisane polecenie `codex resume <thread-id>` lokalnie, jeśli chcesz samodzielnie
sprawdzić natywny wątek Codex. Zobacz
[harness Codex](/pl/plugins/codex-harness#inspect-codex-threads-locally), aby
poznać ten przepływ inspekcji.

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd dla pomocy technicznej.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów,
  statusu, kondycji i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane wiersze logów.
- Najlepsze możliwe migawki statusu i kondycji Gateway.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, jeśli jest
  dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway jest w złej kondycji. Jeśli
Gateway nie może odpowiedzieć na żądania statusu lub kondycji, lokalne logi,
kształt konfiguracji i najnowszy pakiet stabilności nadal są zbierane, gdy są
dostępne.

## Model prywatności

Diagnostyka została zaprojektowana tak, aby można było ją udostępniać. Eksport
zachowuje dane operacyjne, które pomagają w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory pluginów, identyfikatory dostawców,
  identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, monity, instrukcje, treści Webhook i dane wyjściowe narzędzi
- dane uwierzytelniające, klucze API, tokeny, pliki cookie i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji,
  nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, monitu lub payloadu
narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty,
oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony, pozbawiony payloadów strumień
stabilności, gdy diagnostyka jest włączona. Służy on do faktów operacyjnych, a
nie do treści.

Ten sam diagnostyczny Heartbeat rejestruje próbki żywotności, gdy Gateway nadal
działa, ale pętla zdarzeń Node.js lub CPU wygląda na przeciążoną. Te zdarzenia
`diagnostic.liveness.warning` obejmują opóźnienie pętli zdarzeń, wykorzystanie
pętli zdarzeń, stosunek do rdzeni CPU, liczby aktywnych/oczekujących/w kolejce
sesji, bieżącą fazę startu/środowiska uruchomieniowego, gdy jest znana, ostatnie
przedziały faz oraz ograniczone etykiety aktywnych i zakolejkowanych prac.
Próbki bezczynności pozostają w telemetrii na poziomie `info`. Próbki żywotności
stają się ostrzeżeniami Gateway tylko wtedy, gdy praca czeka lub jest w kolejce,
albo gdy aktywna praca nakłada się na utrzymujące się opóźnienie pętli zdarzeń.
Przejściowe skoki maksymalnego opóźnienia podczas poza tym zdrowej pracy w tle
pozostają w logach debugowania. Same z siebie nie restartują Gateway.

Fazy startu emitują również zdarzenia `diagnostic.phase.completed` z czasem
zegarowym i czasem CPU. Zatrzymana diagnostyka osadzonego uruchomienia oznacza
`terminalProgressStale=true`, gdy ostatni postęp mostka wyglądał na końcowy,
na przykład surowy element odpowiedzi lub zdarzenie ukończenia odpowiedzi, ale
Gateway nadal uważa osadzone uruchomienie za aktywne.

Sprawdź działający rejestrator:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po krytycznym zakończeniu,
przekroczeniu czasu zamykania lub błędzie startu po restarcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz plik zip diagnostyki z najnowszego utrwalonego pakietu:

```bash
openclaw gateway stability --bundle latest --export
```

Utrwalone pakiety znajdują się w `~/.openclaw/logs/stability/`, gdy istnieją
zdarzenia.

## Przydatne opcje

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: zapisz do konkretnej ścieżki zip.
- `--log-lines <count>`: maksymalna liczba oczyszczonych wierszy logów do
  uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do sprawdzenia.
- `--url <url>`: adres URL WebSocket Gateway dla migawek statusu i kondycji.
- `--token <token>`: token Gateway dla migawek statusu i kondycji.
- `--password <password>`: hasło Gateway dla migawek statusu i kondycji.
- `--timeout <ms>`: limit czasu migawki statusu i kondycji.
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

Wyłączenie diagnostyki zmniejsza szczegółowość zgłoszeń błędów. Nie wpływa na
normalne logowanie Gateway.

## Powiązane

- [Kontrole kondycji](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do
  strumieniowania diagnostyki do kolektora
