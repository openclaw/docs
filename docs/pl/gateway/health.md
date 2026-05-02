---
read_when:
    - Diagnozowanie łączności kanału lub stanu Gateway
    - Omówienie poleceń i opcji CLI do sprawdzania stanu
summary: Polecenia sprawdzania stanu i monitorowanie stanu Gateway
title: Kontrole stanu
x-i18n:
    generated_at: "2026-05-02T09:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Krótki przewodnik do weryfikowania łączności kanałów bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, wskazówka aktualizacji, wiek uwierzytelnienia połączonego kanału, sesje i ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnoza (tylko do odczytu, kolorowa, bezpieczna do wklejenia przy debugowaniu).
- `openclaw status --deep` — pyta działający Gateway o aktywną sondę kondycji (`health` z `probe:true`), w tym sondy kanałów dla poszczególnych kont, gdy są obsługiwane.
- `openclaw health` — pyta działający Gateway o jego migawkę kondycji (tylko WS; bez bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza aktywną sondę kondycji i wypisuje szczegóły połączenia z Gateway.
- `openclaw health --json` — wynik migawki kondycji w formacie czytelnym maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby otrzymać odpowiedź ze statusem bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj według `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

W przypadku Discord i innych dostawców czatu wiersze sesji nie oznaczają żywotności gniazda.
`openclaw sessions`, Gateway `sessions.list` oraz narzędzie agenta `sessions_list`
odczytują zapisany stan konwersacji. Dostawca może połączyć się ponownie i pokazywać zdrowy
status kanału, zanim zostanie utworzony jakikolwiek nowy wiersz sesji. Do kontroli aktywnej
łączności używaj powyższych poleceń statusu kanału i kondycji.

## Głęboka diagnostyka

- Dane uwierzytelniające na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (czas modyfikacji powinien być świeży).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżkę można nadpisać w konfiguracji). Liczba i ostatni odbiorcy są pokazywani przez `status`.
- Przepływ ponownego łączenia: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawiają się kody statusu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania QR automatycznie restartuje się raz dla statusu 515 po sparowaniu).
- Diagnostyka jest domyślnie włączona. Gateway zapisuje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci zapisują liczby bajtów RSS/sterty, presję progów i presję wzrostu. Ostrzeżenia o żywotności zapisują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń, proporcję rdzeni CPU oraz liczby aktywnych/oczekujących/zakolejkowanych sesji, gdy proces działa, ale jest przeciążony. Zdarzenia zbyt dużych ładunków zapisują, co zostało odrzucone, skrócone lub podzielone na części, a także rozmiary i limity, gdy są dostępne. Nie zapisują tekstu wiadomości, zawartości załączników, treści webhooka, surowej treści żądania lub odpowiedzi, tokenów, cookies ani wartości sekretów. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, który jest dostępny przez `openclaw gateway stability` lub RPC Gateway `diagnostics.stability`. Krytyczne wyjścia Gateway, przekroczenia czasu zamykania i niepowodzenia startu po restarcie utrwalają najnowszą migawkę rejestratora w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia; sprawdź najnowszy zapisany pakiet poleceniem `openclaw gateway stability --bundle latest`.
- W przypadku zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i dołącz wygenerowany plik zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, oczyszczone metadane logów, oczyszczone migawki statusu/kondycji Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści webhooków, wyniki narzędzi, dane uwierzytelniające, cookies, identyfikatory kont/wiadomości i wartości sekretów są pomijane lub redagowane. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często gateway sprawdza kondycję kanałów. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i zrestartuje. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący, jednogodzinny limit restartów monitora kondycji na kanał/konto. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora kondycji dla konkretnego kanału, pozostawiając globalne monitorowanie włączone.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania dla poszczególnych kanałów dotyczą wbudowanych monitorów kanałów, które udostępniają je obecnie: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś zawiedzie

- `logged out` lub status 409–515 → połącz ponownie za pomocą `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że połączony telefon jest online, a nadawca jest dozwolony (`channels.whatsapp.allowFrom`); w przypadku czatów grupowych upewnij się, że lista dozwolonych i reguły wzmianek pasują (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` pyta działający Gateway o jego migawkę kondycji (bez bezpośrednich gniazd kanałów
z CLI). Domyślnie może zwrócić świeżą zbuforowaną migawkę Gateway; następnie
gateway odświeża tę pamięć podręczną w tle. `openclaw health --verbose` wymusza
zamiast tego aktywną sondę. Polecenie raportuje połączone dane uwierzytelniające/wiek uwierzytelnienia, gdy są dostępne,
podsumowania sond dla poszczególnych kanałów, podsumowanie magazynu sesji oraz czas trwania sondy. Kończy się
kodem niezerowym, jeśli Gateway jest nieosiągalny albo sonda nie powiedzie się/przekroczy limit czasu.

Opcje:

- `--json`: wynik JSON czytelny maszynowo
- `--timeout <ms>`: nadpisuje domyślny 10-sekundowy limit czasu sondy
- `--verbose`: wymusza aktywną sondę i wypisuje szczegóły połączenia z Gateway
- `--debug`: alias dla `--verbose`

Migawka kondycji obejmuje: `ok` (wartość logiczna), `ts` (znacznik czasu), `durationMs` (czas sondy), status dla poszczególnych kanałów, dostępność agenta i podsumowanie magazynu sesji.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
