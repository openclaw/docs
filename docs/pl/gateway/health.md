---
read_when:
    - Diagnozowanie łączności kanału lub kondycji gateway
    - Zrozumienie poleceń CLI sprawdzania kondycji i opcji
summary: Polecenia sprawdzania kondycji i monitorowanie kondycji gateway
title: Sprawdzenia kondycji
x-i18n:
    generated_at: "2026-04-24T09:10:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Sprawdzenia kondycji (CLI)

Krótki przewodnik po weryfikacji łączności kanałów bez zgadywania.

## Szybkie sprawdzenia

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb gateway, wskazówka aktualizacji, wiek powiązanego uwierzytelnienia kanału, sesje + ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnoza (tylko do odczytu, z kolorami, bezpieczna do wklejenia przy debugowaniu).
- `openclaw status --deep` — pyta działające gateway o aktywną sondę kondycji (`health` z `probe:true`), w tym sondy kanałów per konto, jeśli są obsługiwane.
- `openclaw health` — pyta działające gateway o jego zrzut kondycji (tylko WS; bez bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza aktywną sondę kondycji i wypisuje szczegóły połączenia gateway.
- `openclaw health --json` — wyjście zrzutu kondycji czytelne maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby uzyskać odpowiedź ze stanem bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Głęboka diagnostyka

- Poświadczenia na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime powinno być aktualne).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżka może być nadpisana w konfiguracji). Liczba i ostatni odbiorcy są pokazywane przez `status`.
- Przepływ ponownego powiązania: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawiają się kody statusu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania przez QR automatycznie restartuje się raz dla statusu 515 po sparowaniu).
- Diagnostyka jest domyślnie włączona. Gateway zapisuje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci zapisują liczbę bajtów RSS/stosu, nacisk progowy i nacisk wzrostu. Zdarzenia zbyt dużych ładunków zapisują, co zostało odrzucone, obcięte lub podzielone na chunki, a także rozmiary i limity, gdy są dostępne. Nie zapisują tekstu wiadomości, zawartości załączników, treści Webhook, surowej treści żądań ani odpowiedzi, tokenów, ciasteczek ani wartości sekretów. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, który jest dostępny przez `openclaw gateway stability` albo RPC Gateway `diagnostics.stability`. Krytyczne wyjścia Gateway, timeouty zamknięcia i błędy uruchamiania przy restarcie zapisują najnowszy zrzut rejestratora w `~/.openclaw/logs/stability/`, jeśli istnieją zdarzenia; sprawdź najnowszy zapisany pakiet przez `openclaw gateway stability --bundle latest`.
- Na potrzeby zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i dołącz wygenerowany plik zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, zsanityzowane metadane logów, zsanityzowane zrzuty status/health Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści Webhooków, wyjścia narzędzi, poświadczenia, ciasteczka, identyfikatory kont/wiadomości i wartości sekretów są pomijane albo redagowane. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często gateway sprawdza kondycję kanałów. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i uruchomi ponownie. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: ruchomy limit restartów przez monitor kondycji per kanał/konto w ciągu jednej godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącz restarty monitora kondycji dla konkretnego kanału, pozostawiając globalne monitorowanie włączone.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie wielokontowe, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania per kanał dotyczą dziś wbudowanych monitorów kanałów, które je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś zawodzi

- `logged out` lub status 409–515 → ponownie powiąż przez `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że powiązany telefon jest online i nadawca jest dozwolony (`channels.whatsapp.allowFrom`); dla czatów grupowych upewnij się, że allowlista + reguły wzmianek są zgodne (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` pyta działające gateway o jego zrzut kondycji (bez bezpośrednich gniazd kanałów
z CLI). Domyślnie może zwrócić świeży zbuforowany zrzut gateway; gateway
następnie odświeża ten cache w tle. `openclaw health --verbose` wymusza
zamiast tego aktywną sondę. Polecenie raportuje wiek powiązanych poświadczeń/auth, jeśli są dostępne,
podsumowania sond per kanał, podsumowanie magazynu sesji i czas trwania sondy. Kończy się
kodem niezerowym, jeśli gateway jest nieosiągalny albo sonda nie powiedzie się/przekroczy czas.

Opcje:

- `--json`: wyjście JSON czytelne maszynowo
- `--timeout <ms>`: nadpisz domyślny timeout sondy 10 s
- `--verbose`: wymuś aktywną sondę i wypisz szczegóły połączenia gateway
- `--debug`: alias dla `--verbose`

Zrzut kondycji obejmuje: `ok` (boolean), `ts` (znacznik czasu), `durationMs` (czas sondy), status per kanał, dostępność agenta oraz podsumowanie magazynu sesji.

## Powiązane

- [Instrukcja operacyjna Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
