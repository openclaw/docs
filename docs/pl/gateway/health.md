---
read_when:
    - Diagnozowanie łączności kanału lub stanu Gateway
    - Omówienie poleceń i opcji CLI sprawdzania kondycji
summary: Polecenia kontroli kondycji i monitorowanie kondycji Gateway
title: Kontrole stanu
x-i18n:
    generated_at: "2026-06-27T17:33:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Krótki przewodnik weryfikacji łączności kanału bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, wskazówka o aktualizacji, wiek autoryzacji połączonego kanału, sesje + ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnoza (tylko do odczytu, kolorowa, bezpieczna do wklejenia przy debugowaniu).
- `openclaw status --deep` — odpytuje działający Gateway o próbę kondycji na żywo (`health` z `probe:true`), w tym próby kanałów dla poszczególnych kont, gdy są obsługiwane.
- `openclaw health` — odpytuje działający Gateway o jego migawkę kondycji (tylko WS; bez bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza próbę kondycji na żywo i wypisuje szczegóły połączenia z Gateway.
- `openclaw health --json` — dane wyjściowe migawki kondycji w formacie czytelnym maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby otrzymać odpowiedź o statusie bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj po `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

W przypadku Discord i innych dostawców czatu wiersze sesji nie oznaczają aktywności gniazda.
`openclaw sessions`, `sessions.list` Gateway oraz narzędzie agenta `sessions_list`
odczytują zapisany stan konwersacji. Dostawca może ponownie się połączyć i pokazywać prawidłowy
status kanału, zanim zmaterializuje się jakikolwiek nowy wiersz sesji. Do kontroli łączności
na żywo używaj powyższych poleceń statusu kanału i kondycji.

## Głęboka diagnostyka

- Poświadczenia na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime powinien być niedawny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżkę można nadpisać w konfiguracji). Liczba i ostatni odbiorcy są pokazywani przez `status`.
- Przepływ ponownego łączenia: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawią się kody statusu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania QR automatycznie uruchamia się ponownie raz dla statusu 515 po sparowaniu).
- Diagnostyka jest domyślnie włączona. Gateway zapisuje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci zapisują liczniki bajtów RSS/sterty, presję progową i presję wzrostu. Krytyczna presja pamięci jest logowana przez logger Gateway. Gdy ustawiono `diagnostics.memoryPressureSnapshot: true`, krytyczna presja pamięci zapisuje także przed-OOM-owy pakiet stabilności ze statystykami sterty V8, licznikami Linux cgroup, gdy są dostępne, liczbą aktywnych zasobów oraz największymi plikami sesji/transkryptów według zredagowanej ścieżki względnej. Ostrzeżenia o żywotności zapisują opóźnienie pętli zdarzeń, wykorzystanie pętli zdarzeń, stosunek do rdzeni CPU oraz liczby aktywnych/oczekujących/zakolejkowanych sesji, gdy proces działa, ale jest przeciążony. Zdarzenia nadmiarowego ładunku zapisują, co zostało odrzucone, ucięte lub podzielone na fragmenty, oraz rozmiary i limity, gdy są dostępne. Nie zapisują tekstu wiadomości, zawartości załączników, treści Webhook, surowej treści żądania lub odpowiedzi, tokenów, plików cookie ani wartości sekretów. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, dostępny przez `openclaw gateway stability` lub RPC Gateway `diagnostics.stability`. Krytyczne wyjścia Gateway, przekroczenia limitu czasu zamknięcia i niepowodzenia startu po restarcie utrwalają najnowszą migawkę rejestratora w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia; krytyczna presja pamięci robi to również tylko wtedy, gdy ustawiono `diagnostics.memoryPressureSnapshot: true`. Sprawdź najnowszy zapisany pakiet za pomocą `openclaw gateway stability --bundle latest`.
- W przypadku zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i dołącz wygenerowany plik zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, oczyszczone metadane logów, oczyszczone migawki statusu/kondycji Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści Webhook, dane wyjściowe narzędzi, poświadczenia, pliki cookie, identyfikatory kont/wiadomości i wartości sekretów są pomijane lub redagowane. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często Gateway sprawdza kondycję kanału. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i go zrestartuje. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący godzinny limit restartów monitora kondycji na kanał/konto. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora kondycji dla konkretnego kanału, pozostawiając włączone monitorowanie globalne.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania dla kanałów dotyczą wbudowanych monitorów kanałów, które obecnie je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Monitorowanie czasu działania

Zewnętrzne usługi monitorowania czasu działania powinny używać dedykowanego endpointu `/health`, a nie `/v1/chat/completions`.

- **UŻYWAJ:** `GET /health` — natychmiastowa odpowiedź, bez tworzenia sesji, bez wywołania LLM, zwraca `{"ok":true,"status":"live"}`
- **NIE UŻYWAJ:** `/v1/chat/completions` do kontroli kondycji — każde żądanie tworzy pełną sesję agenta z migawką Skills, składaniem kontekstu i wywołaniami LLM

Gdy nie podano nagłówka `x-openclaw-session-key` ani pola `user`, `/v1/chat/completions` generuje nową losową sesję dla każdego żądania. Usługi monitorowania odpytujące co 15 minut tworzą około 96 sesji dziennie, z których każda zużywa 4–22 KB. Z czasem powoduje to rozrost magazynu sesji i może prowadzić do przepełnienia okna kontekstu.

### Przykłady konfiguracji usługi monitorowania

- **BetterStack:** ustaw URL kontroli kondycji na `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** dodaj nowy monitor HTTP z URL `https://<your-gateway-host>:<port>/health`
- **Ogólne:** dowolne HTTP GET do `/health` zwraca 200 z `{"ok":true}`, gdy Gateway jest zdrowy

## Gdy coś zawiedzie

- `logged out` lub status 409–515 → połącz ponownie za pomocą `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że połączony telefon jest online, a nadawca jest dozwolony (`channels.whatsapp.allowFrom`); w przypadku czatów grupowych upewnij się, że lista dozwolonych + reguły wzmianek pasują (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` odpytuje działający Gateway o jego migawkę kondycji (bez bezpośrednich
gniazd kanałów z CLI). Domyślnie może zwrócić świeżą, buforowaną migawkę Gateway; następnie
Gateway odświeża tę pamięć podręczną w tle. `openclaw health --verbose` wymusza
zamiast tego próbę na żywo. Polecenie raportuje połączone poświadczenia/wiek autoryzacji, gdy są dostępne,
podsumowania prób dla poszczególnych kanałów, podsumowanie magazynu sesji oraz czas trwania próby. Kończy się
kodem niezerowym, jeśli Gateway jest nieosiągalny albo próba kończy się niepowodzeniem/przekroczeniem czasu.

Opcje:

- `--json`: dane wyjściowe JSON czytelne maszynowo
- `--timeout <ms>`: nadpisuje domyślny 10-sekundowy limit czasu próby
- `--verbose`: wymusza próbę na żywo i wypisuje szczegóły połączenia z Gateway
- `--debug`: alias dla `--verbose`

Migawka kondycji zawiera: `ok` (wartość logiczna), `ts` (znacznik czasu), `durationMs` (czas próby), status poszczególnych kanałów, dostępność agenta oraz podsumowanie magazynu sesji.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
