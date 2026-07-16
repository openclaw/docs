---
read_when:
    - Diagnozowanie łączności kanału lub stanu Gateway
    - Omówienie poleceń i opcji CLI do kontroli kondycji
summary: Polecenia kontroli kondycji i monitorowanie kondycji Gateway
title: Kontrole stanu
x-i18n:
    generated_at: "2026-07-16T18:24:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Krótki przewodnik po sprawdzaniu łączności kanałów bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, wskazówka dotycząca aktualizacji, wiek uwierzytelnienia połączonego kanału, sesje i ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnostyka (tylko do odczytu, z kolorami, bezpieczna do wklejenia podczas debugowania).
- `openclaw status --deep` — wysyła do działającego Gateway żądanie aktywnej sondy (`health` z `probe:true`), w tym sond kanałów dla poszczególnych kont, jeśli są obsługiwane.
- `openclaw status --usage` — wyświetla migawki wykorzystania/limitów dostawcy modelu.
- `openclaw health` — wysyła do działającego Gateway żądanie migawki stanu (tylko WS; bez bezpośrednich połączeń z gniazdami kanałów z CLI).
- `openclaw health --verbose` (alias `--debug`) — wymusza aktywną sondę stanu i wyświetla szczegóły połączenia z Gateway.
- `openclaw health --json` — dane wyjściowe migawki stanu w formacie przeznaczonym do przetwarzania maszynowego.
- Wyślij `/status` jako samodzielne polecenie czatu w dowolnym kanale, aby otrzymać odpowiedź o stanie bez wywoływania agenta.
- Logi: obserwuj `/tmp/openclaw/openclaw-*.log` i filtruj według `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

W przypadku Discord i innych dostawców czatu wiersze sesji nie wskazują, czy gniazdo jest aktywne.
`openclaw sessions`, Gateway `sessions.list` i narzędzie agenta `sessions_list`
odczytują zapisany stan konwersacji. Dostawca może ponownie nawiązać połączenie i wyświetlać prawidłowy stan kanału,
zanim zostanie utworzony nowy wiersz sesji. Do aktywnego sprawdzania łączności używaj podanych wyżej
poleceń stanu kanału i kontroli kondycji.

## Szczegółowa diagnostyka

- Dane uwierzytelniające na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (czas modyfikacji powinien być niedawny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Liczba i ostatni odbiorcy są wyświetlani przez `status`.
- Procedura ponownego łączenia: użyj `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawią się kody stanu 409-515 lub `loggedOut`. Procedura logowania za pomocą kodu QR automatycznie uruchamia się ponownie jeden raz w przypadku stanu 515 po sparowaniu.
- Diagnostyka jest domyślnie włączona (`diagnostics.enabled: false` ją wyłącza). Zdarzenia pamięci rejestrują liczbę bajtów RSS/sterty oraz presję progową/wzrostu; krytyczna presja pamięci jest rejestrowana przez logger Gateway, a gdy ustawiono `diagnostics.memoryPressureSnapshot: true`, zapisywany jest również pakiet stabilności sprzed wystąpienia OOM (statystyki sterty V8, liczniki cgroup systemu Linux, jeśli są dostępne, liczby aktywnych zasobów oraz największe pliki sesji/transkrypcji wskazane przez zanonimizowaną ścieżkę względną). Ostrzeżenia o aktywności rejestrują opóźnienie/wykorzystanie pętli zdarzeń, współczynnik użycia rdzeni procesora oraz liczbę aktywnych/oczekujących/kolejkowanych sesji, gdy proces działa, ale jest przeciążony. Zdarzenia zbyt dużych ładunków rejestrują, co zostało odrzucone/skrócone/podzielone na fragmenty, a także rozmiary i limity, ale nigdy tekst wiadomości, zawartość załączników, treści webhooków, nieprzetworzone treści żądań/odpowiedzi, tokeny, pliki cookie ani wartości sekretów.
- Ten sam Heartbeat steruje rejestratorem stabilności o ograniczonym rozmiarze: `openclaw gateway stability` (lub RPC Gateway `diagnostics.stability`). Krytyczne zakończenia Gateway, przekroczenia limitu czasu zamykania, niepowodzenia uruchamiania po restarcie oraz (gdy `diagnostics.memoryPressureSnapshot: true`) krytyczna presja pamięci zapisują najnowszą migawkę w `~/.openclaw/logs/stability/`. Najnowszy pakiet można sprawdzić za pomocą `openclaw gateway stability --bundle latest`.
- W przypadku zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i załącz wygenerowany plik ZIP: podsumowanie Markdown, najnowszy pakiet stabilności, oczyszczone metadane logów, oczyszczone migawki stanu/kondycji Gateway oraz strukturę konfiguracji. Tekst czatu, treści webhooków, dane wyjściowe narzędzi, dane uwierzytelniające, pliki cookie, identyfikatory kont/wiadomości i wartości sekretów są pomijane lub anonimizowane. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: częstotliwość sprawdzania kondycji kanałów przez Gateway. Wartość domyślna: `5`. Ustaw `0`, aby globalnie wyłączyć ponowne uruchamianie przez monitor kondycji.
- `gateway.channelStaleEventThresholdMinutes`: czas, przez jaki połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i uruchomi ponownie. Wartość domyślna: `30`. Ta wartość musi być większa lub równa `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący godzinny limit ponownych uruchomień przez monitor kondycji na kanał/konto. Wartość domyślna: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza ponowne uruchamianie przez monitor kondycji dla określonego kanału, pozostawiając włączone monitorowanie globalne.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ustawienie zastępujące dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te ustawienia zastępujące dla poszczególnych kanałów dotyczą wbudowanych kanałów, które obecnie je udostępniają: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Monitorowanie czasu działania

Zewnętrzne usługi monitorowania czasu działania powinny używać dedykowanego punktu końcowego `/health`, a nie `/v1/chat/completions`.

- **UŻYWAJ:** `GET /health` — natychmiastowa odpowiedź, bez tworzenia sesji i wywoływania LLM; zwraca `{"ok":true,"status":"live"}`
- **NIE UŻYWAJ:** `/v1/chat/completions` do kontroli kondycji — każde żądanie tworzy pełną sesję agenta z migawką Skills, składaniem kontekstu i wywołaniami LLM

Jeśli nie podano nagłówka `x-openclaw-session-key` ani pola `user`, `/v1/chat/completions` generuje nową losową sesję dla każdego żądania. Usługi monitorujące, które wysyłają żądanie co 15 minut, tworzą około 96 sesji dziennie, z których każda zajmuje 4-22KB. Z czasem powoduje to rozrost magazynu sesji i może doprowadzić do przepełnienia okna kontekstu.

### Przykłady konfiguracji usług monitorujących

- **BetterStack:** Ustaw adres URL kontroli kondycji na `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Dodaj nowy monitor HTTP z adresem URL `https://<your-gateway-host>:<port>/health`
- **Ogólne:** Dowolne żądanie HTTP GET do `/health` zwraca kod 200 z `{"ok":true}`, gdy Gateway działa prawidłowo

## Gdy wystąpi błąd

- `logged out` lub stan 409-515 → ponownie połącz za pomocą `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway jest nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → upewnij się, że połączony telefon jest online, a nadawca jest dozwolony (`channels.whatsapp.allowFrom`); w przypadku czatów grupowych upewnij się, że lista dozwolonych oraz reguły wzmianek są zgodne (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` wysyła do działającego Gateway żądanie migawki jego kondycji (bez bezpośrednich połączeń
z gniazdami kanałów z CLI). Domyślnie zwraca świeżą migawkę Gateway z pamięci podręcznej,
którą Gateway odświeża w tle; `--verbose` zamiast tego wymusza aktywną sondę.
Polecenie raportuje wiek połączonych danych uwierzytelniających/uwierzytelnienia, gdy jest dostępny, podsumowania sond poszczególnych kanałów,
podsumowanie magazynu sesji oraz czas trwania sondy. Kończy działanie z kodem różnym od zera, jeśli Gateway jest
nieosiągalny albo sonda zakończy się niepowodzeniem lub przekroczy limit czasu.

Opcje:

- `--json`: dane wyjściowe JSON przeznaczone do przetwarzania maszynowego
- `--timeout <ms>`: zastępuje domyślny limit czasu sondy wynoszący 10s
- `--verbose`: wymusza aktywną sondę i wyświetla szczegóły połączenia z Gateway
- `--debug`: alias dla `--verbose`

Migawka kondycji zawiera: `ok` (wartość logiczna), `ts` (znacznik czasu), `durationMs` (czas sondy), stan poszczególnych kanałów, dostępność agenta i podsumowanie magazynu sesji.

## Powiązane

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
