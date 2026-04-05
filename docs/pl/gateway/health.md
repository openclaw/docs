---
read_when:
    - Diagnozujesz łączność kanału lub kondycję gateway
    - Chcesz zrozumieć polecenia CLI do sprawdzania kondycji i ich opcje
summary: Polecenia sprawdzania kondycji i monitorowanie kondycji gateway
title: Kontrole kondycji
x-i18n:
    generated_at: "2026-04-05T13:52:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Kontrole kondycji (CLI)

Krótki przewodnik po weryfikacji łączności kanału bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb gateway, wskazówka o aktualizacji, wiek uwierzytelnienia połączonego kanału, sesje + ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnoza (tylko do odczytu, z kolorami, bezpieczna do wklejenia podczas debugowania).
- `openclaw status --deep` — prosi uruchomiony gateway o sondę kondycji live (`health` z `probe:true`), w tym sondy kanałów dla poszczególnych kont, gdy są obsługiwane.
- `openclaw health` — prosi uruchomiony gateway o snapshot kondycji (tylko WS; bez bezpośrednich gniazd kanałów z poziomu CLI).
- `openclaw health --verbose` — wymusza sondę kondycji live i wypisuje szczegóły połączenia z gateway.
- `openclaw health --json` — dane wyjściowe snapshotu kondycji w formacie odczytywalnym maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby otrzymać odpowiedź ze stanem bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj po `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Głęboka diagnostyka

- Dane uwierzytelniające na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (czas modyfikacji powinien być aktualny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżka może zostać nadpisana w konfiguracji). Liczba i ostatni odbiorcy są pokazywani przez `status`.
- Przepływ ponownego łączenia: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawiają się kody stanu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania QR automatycznie uruchamia się ponownie raz dla stanu 515 po sparowaniu).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często gateway sprawdza kondycję kanału. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i uruchomi ponownie. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limit restartów monitora kondycji na kanał/konto w ruchomym oknie jednej godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora kondycji dla określonego kanału przy pozostawieniu globalnego monitorowania włączonego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania dla poszczególnych kanałów dotyczą wbudowanych monitorów kanałów, które obecnie je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś nie działa

- `logged out` lub status 409–515 → połącz ponownie przez `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że połączony telefon jest online i że nadawca jest dozwolony (`channels.whatsapp.allowFrom`); w przypadku czatów grupowych upewnij się, że reguły allowlisty i wzmianek są zgodne (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` prosi uruchomiony gateway o jego snapshot kondycji (bez bezpośrednich
gniazd kanałów z poziomu CLI). Domyślnie może zwrócić świeży snapshot gateway z pamięci podręcznej; gateway
następnie odświeża tę pamięć podręczną w tle. `openclaw health --verbose` wymusza
zamiast tego sondę live. Polecenie raportuje wiek połączonych danych uwierzytelniających/uwierzytelnienia, gdy są dostępne,
podsumowania sond dla poszczególnych kanałów, podsumowanie magazynu sesji oraz czas trwania sondy. Kończy się
kodem niezerowym, jeśli gateway jest nieosiągalny lub sonda nie powiedzie się/przekroczy limit czasu.

Opcje:

- `--json`: dane wyjściowe JSON odczytywalne maszynowo
- `--timeout <ms>`: nadpisuje domyślny limit czasu sondy wynoszący 10 s
- `--verbose`: wymusza sondę live i wypisuje szczegóły połączenia z gateway
- `--debug`: alias dla `--verbose`

Snapshot kondycji obejmuje: `ok` (boolean), `ts` (znacznik czasu), `durationMs` (czas sondy), stan poszczególnych kanałów, dostępność agentów oraz podsumowanie magazynu sesji.
