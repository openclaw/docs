---
read_when:
    - Diagnozowanie łączności kanału lub stanu Gateway
    - Omówienie poleceń i opcji CLI sprawdzania stanu
summary: Polecenia kontroli stanu i monitorowanie stanu Gateway
title: Kontrole stanu
x-i18n:
    generated_at: "2026-04-30T09:53:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Krótki przewodnik do weryfikowania łączności kanałów bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, wskazówka dotycząca aktualizacji, wiek uwierzytelnienia połączonego kanału, sesje + ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnostyka (tylko do odczytu, kolorowa, bezpieczna do wklejenia podczas debugowania).
- `openclaw status --deep` — pyta działający Gateway o bieżącą sondę kondycji (`health` z `probe:true`), w tym sondy kanałów dla poszczególnych kont, gdy są obsługiwane.
- `openclaw health` — pyta działający Gateway o migawkę kondycji (tylko WS; brak bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza bieżącą sondę kondycji i wypisuje szczegóły połączenia z Gateway.
- `openclaw health --json` — wynik migawki kondycji w formacie czytelnym maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby otrzymać odpowiedź statusową bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj po `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Głęboka diagnostyka

- Dane uwierzytelniające na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime powinien być niedawny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżkę można nadpisać w konfiguracji). Liczba i ostatni odbiorcy są pokazywani przez `status`.
- Przepływ ponownego łączenia: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawią się kody statusu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania QR automatycznie uruchamia się ponownie raz dla statusu 515 po sparowaniu.)
- Diagnostyka jest domyślnie włączona. Gateway zapisuje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci zapisują liczbę bajtów RSS/sterty, presję progu i presję wzrostu. Ostrzeżenia o żywotności zapisują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń, stosunek do rdzeni CPU oraz liczby aktywnych/oczekujących/zakolejkowanych sesji, gdy proces działa, ale jest przeciążony. Zdarzenia nadmiernie dużych ładunków zapisują, co zostało odrzucone, skrócone lub podzielone na części, a także rozmiary i limity, gdy są dostępne. Nie zapisują tekstu wiadomości, zawartości załączników, treści Webhooka, surowej treści żądania lub odpowiedzi, tokenów, cookies ani wartości tajnych. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, dostępny przez `openclaw gateway stability` lub RPC Gateway `diagnostics.stability`. Krytyczne zakończenia Gateway, przekroczenia czasu zamykania i niepowodzenia uruchamiania po restarcie utrwalają najnowszą migawkę rejestratora w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia; sprawdź najnowszy zapisany pakiet poleceniem `openclaw gateway stability --bundle latest`.
- W przypadku zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i załącz wygenerowany plik zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, oczyszczone metadane logów, oczyszczone migawki statusu/kondycji Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści Webhooków, wyniki narzędzi, dane uwierzytelniające, cookies, identyfikatory kont/wiadomości i wartości tajne są pomijane lub redagowane. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często Gateway sprawdza kondycję kanału. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostać bezczynny, zanim monitor kondycji uzna go za nieaktualny i zrestartuje. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący godzinny limit restartów monitora kondycji na kanał/konto. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora kondycji dla konkretnego kanału, pozostawiając globalne monitorowanie włączone.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania dla poszczególnych kanałów mają zastosowanie do wbudowanych monitorów kanałów, które obecnie je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś się nie powiedzie

- `logged out` lub status 409–515 → połącz ponownie za pomocą `openclaw channels logout`, a potem `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że połączony telefon jest online i nadawca jest dozwolony (`channels.whatsapp.allowFrom`); w przypadku czatów grupowych upewnij się, że lista dozwolonych + reguły wzmianek pasują (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie "health"

`openclaw health` pyta działający Gateway o jego migawkę kondycji (bez bezpośrednich
gniazd kanałów z CLI). Domyślnie może zwrócić świeżą zapisaną w pamięci podręcznej
migawkę Gateway; Gateway następnie odświeża tę pamięć podręczną w tle. `openclaw health --verbose` wymusza
zamiast tego bieżącą sondę. Polecenie raportuje połączone dane uwierzytelniające/wiek uwierzytelnienia, gdy są dostępne,
podsumowania sond dla poszczególnych kanałów, podsumowanie magazynu sesji oraz czas trwania sondy. Kończy się
kodem niezerowym, jeśli Gateway jest nieosiągalny albo sonda nie powiedzie się lub przekroczy limit czasu.

Opcje:

- `--json`: wynik JSON czytelny maszynowo
- `--timeout <ms>`: nadpisuje domyślny limit czasu sondy wynoszący 10 s
- `--verbose`: wymusza bieżącą sondę i wypisuje szczegóły połączenia z Gateway
- `--debug`: alias dla `--verbose`

Migawka kondycji obejmuje: `ok` (boolean), `ts` (timestamp), `durationMs` (czas sondy), status dla poszczególnych kanałów, dostępność agenta oraz podsumowanie magazynu sesji.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
