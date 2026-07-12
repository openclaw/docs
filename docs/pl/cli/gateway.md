---
read_when:
    - Uruchamianie Gateway z poziomu CLI (środowisko programistyczne lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów powiązania i łączności
    - Wykrywanie Gatewayów przez Bonjour (lokalnie i przez rozległy DNS-SD)
sidebarTitle: Gateway
summary: CLI OpenClaw Gateway (`openclaw gateway`) — uruchamianie, wysyłanie zapytań i wykrywanie bram Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-12T15:00:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Wszystkie poniższe podpolecenia znajdują się w przestrzeni `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS i rozległego DNS-SD.
  </Card>
  <Card title="Omówienie wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw rozgłasza i odnajduje Gatewaye.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration">
    Klucze konfiguracji Gatewaya najwyższego poziomu.
  </Card>
</CardGroup>

## Uruchamianie Gatewaya

```bash
openclaw gateway
openclaw gateway run   # równoważna, jawna forma
```

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    - Odmawia uruchomienia, jeśli w `~/.openclaw/openclaw.json` nie ustawiono `gateway.mode=local`. Do uruchomień doraźnych/deweloperskich użyj `--allow-unconfigured`; pomija to zabezpieczenie bez zapisywania ani naprawiania konfiguracji.
    - `openclaw onboard --mode local` i `openclaw setup` zapisują `gateway.mode=local`. Jeśli plik konfiguracji istnieje, ale brakuje w nim `gateway.mode`, jest to traktowane jako uszkodzona lub nadpisana konfiguracja i Gateway nie zakłada za Ciebie wartości `local` — ponownie przeprowadź wdrażanie, ustaw klucz ręcznie albo przekaż `--allow-unconfigured`.
    - Nasłuchiwanie poza local loopback bez uwierzytelniania jest blokowane.
    - Wartości `lan`, `tailnet` i `custom` opcji `--bind` są obecnie rozwiązywane wyłącznie ścieżkami IPv4; konfiguracje z własnym hostem obsługujące tylko IPv6 wymagają sidecara IPv4 lub serwera proxy przed Gatewayem.
    - `SIGUSR1` wyzwala ponowne uruchomienie wewnątrz procesu, gdy jest autoryzowane. `commands.restart` (domyślnie: włączone) kontroluje zewnętrznie wysyłany sygnał `SIGUSR1`; ustaw tę opcję na `false`, aby zablokować ręczne ponowne uruchamianie za pomocą sygnału systemu operacyjnego, nadal zezwalając na ponowne uruchomienie poleceniem `gateway restart`, narzędziem Gateway oraz przez zastosowanie lub aktualizację konfiguracji.
    - `SIGINT`/`SIGTERM` zatrzymują proces, ale nie przywracają niestandardowego stanu terminala — jeśli opakowujesz CLI w TUI lub wejście w trybie surowym, samodzielnie przywróć terminal przed zakończeniem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (domyślnie z konfiguracji/zmiennych środowiskowych; zwykle `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Tryb powiązania: `loopback` (domyślnie), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Współdzielony token dla `connect.params.auth.token`. Domyślnie używa `OPENCLAW_GATEWAY_TOKEN`, jeśli jest ustawiony.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Tryb uwierzytelniania: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło dla `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło Gatewaya z pliku.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Udostępnianie przez Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację Tailscale serve/funnel podczas zamykania.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Uruchom bez wymuszania `gateway.mode=local`. Wyłącznie do doraźnego/deweloperskiego rozruchu; nie utrwala ani nie naprawia konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską i obszar roboczy, jeśli ich brakuje (pomija `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską, dane uwierzytelniające, sesje i obszar roboczy. Wymaga `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Przed uruchomieniem zakończ działanie istniejącego procesu nasłuchującego na porcie docelowym.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Szczegółowe rejestrowanie w stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Wyświetlaj w konsoli tylko logi zaplecza CLI (włącza również stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Styl logów WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias opcji `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rejestruj nieprzetworzone zdarzenia strumienia modelu w formacie JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ścieżka nieprzetworzonego strumienia JSONL.
</ParamField>

`--claude-cli-logs` to przestarzały alias opcji `--cli-backend-logs`.

Dla `--bind custom` ustaw `gateway.customBindHost` na adres IPv4. Każdy adres inny niż `127.0.0.1` lub `0.0.0.0` wymaga również adresu `127.0.0.1` na tym samym porcie dla klientów na tym samym hoście; uruchomienie nie powiedzie się, jeśli którykolwiek proces nasłuchujący nie może powiązać adresu. Adres wieloznaczny `0.0.0.0` nie dodaje osobnego wymaganego aliasu. Konfiguracje z własnym hostem obsługujące tylko IPv6 wymagają sidecara IPv4 lub serwera proxy przed Gatewayem.

## Ponowne uruchamianie Gatewaya

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` nakazuje działającemu Gatewayowi wstępnie sprawdzić aktywne zadania i zaplanować jedno skonsolidowane ponowne uruchomienie po ich zakończeniu. Oczekiwanie jest ograniczone przez `gateway.reload.deferralTimeoutMs` (domyślnie: 5 minut / `300000`); po wyczerpaniu limitu czasu ponowne uruchomienie jest wymuszane. Ustaw `deferralTimeoutMs: 0`, aby zamiast wymuszania czekać bezterminowo (z okresowymi ostrzeżeniami o nadal oczekujących zadaniach). Opcji `--safe` nie można łączyć z `--force` ani `--wait`.

`--skip-deferral` pomija mechanizm odraczania z powodu aktywnych zadań podczas bezpiecznego ponownego uruchamiania, dzięki czemu Gateway uruchamia się ponownie natychmiast, nawet jeśli zgłoszono blokady. Wymaga `--safe` — użyj tej opcji, gdy odroczenie utknęło z powodu niekontrolowanego zadania.

`--wait <duration>` zastępuje limit czasu opróżniania dla zwykłego (niebezpiecznego) ponownego uruchomienia. Akceptuje same milisekundy lub przyrostki jednostek `ms`, `s`, `m`, `h`, `d` (np. `30s`, `5m`, `1h30m`); `--wait 0` oznacza oczekiwanie bezterminowe. Opcja nie jest zgodna z `--force` ani `--safe`.

`--force` pomija opróżnianie aktywnych zadań i natychmiast ponownie uruchamia usługę. Zwykłe polecenie `restart` (bez flag) zachowuje dotychczasowe zachowanie ponownego uruchamiania przez menedżera usług.

<Warning>
Hasło przekazane bezpośrednio przez `--password` może być widoczne na lokalnej liście procesów. Preferuj `--password-file`, zmienną środowiskową lub `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie Gatewaya

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` rejestruje czasy faz podczas uruchamiania, w tym opóźnienie `eventLoopMax` poszczególnych faz oraz czasy tabel wyszukiwania pluginów (indeks zainstalowanych elementów, rejestr manifestów, planowanie uruchomienia, praca nad mapą właścicieli).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` rejestruje wiersze `restart trace:` dotyczące ponownego uruchamiania: obsługę sygnału, opróżnianie aktywnych zadań, fazy zamykania, następne uruchomienie, czas osiągnięcia gotowości i metryki pamięci.
- `OPENCLAW_DIAGNOSTICS=timeline` wraz z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` zapisuje, na zasadzie najlepszej staranności, oś czasu diagnostyki uruchamiania w formacie JSONL dla zewnętrznych narzędzi QA (odpowiada konfiguracji `diagnostics.flags: ["timeline"]`; ścieżka nadal jest dostępna tylko przez zmienną środowiskową). Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- `pnpm build`, a następnie `pnpm test:startup:gateway -- --runs 5 --warmup 1`, mierzy wydajność uruchamiania Gatewaya przy użyciu zbudowanego punktu wejścia CLI: pierwsze dane wyjściowe procesu, `/healthz`, `/readyz`, czasy śledzenia uruchamiania, opóźnienie pętli zdarzeń oraz czas tabel wyszukiwania pluginów.
- `pnpm build`, a następnie `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, mierzy wydajność ponownego uruchamiania wewnątrz procesu w systemie macOS lub Linux (nieobsługiwane w systemie Windows; ponowne uruchamianie wymaga `SIGUSR1`). Używa `SIGUSR1`, włącza oba mechanizmy śledzenia w procesie potomnym i rejestruje następne `/healthz`, następne `/readyz`, czas niedostępności, czas osiągnięcia gotowości, użycie procesora, RSS oraz metryki śledzenia ponownego uruchamiania.
- `/healthz` oznacza aktywność; `/readyz` oznacza gotowość do użycia. Traktuj wiersze śledzenia i wyniki testów wydajności jako wskazówki do przypisania odpowiedzialności, a nie jako pełny wniosek o wydajności na podstawie pojedynczego zakresu lub próbki.

## Wysyłanie zapytań do działającego Gatewaya

Wszystkie polecenia zapytań używają RPC przez WebSocket.

<Tabs>
  <Tab title="Tryby danych wyjściowych">
    - Domyślnie: format czytelny dla człowieka (kolorowy w TTY).
    - `--json`: format JSON do odczytu maszynowego (bez stylizacji/animacji oczekiwania).
    - `--no-color` (lub `NO_COLOR=1`): wyłącza sekwencje ANSI, zachowując układ czytelny dla człowieka.

  </Tab>
  <Tab title="Opcje wspólne">
    - `--url <url>`: adres URL WebSocket Gatewaya.
    - `--token <token>`: token Gatewaya.
    - `--password <password>`: hasło Gatewaya.
    - `--timeout <ms>`: limit czasu/budżet (wartość domyślna zależy od polecenia; zobacz poszczególne polecenia poniżej).
    - `--expect-final`: oczekuj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Po ustawieniu `--url` CLI nie korzysta awaryjnie z danych uwierzytelniających z konfiguracji ani zmiennych środowiskowych. Jawnie przekaż `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` to sonda aktywności: zwraca odpowiedź, gdy tylko serwer może odpowiadać przez HTTP. `/readyz` jest bardziej rygorystyczna i pozostaje w stanie błędu, dopóki sidecary pluginów uruchomieniowych, kanały lub skonfigurowane hooki nadal się inicjalizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi `/readyz` zawierają blok diagnostyczny `eventLoop` (opóźnienie, wykorzystanie, współczynnik rdzeni procesora, flaga `degraded`).

<ParamField path="--port <port>" type="number">
  Wskaż Gateway na local loopback działający na tym porcie. Dla tego wywołania zastępuje `OPENCLAW_GATEWAY_URL` i `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Pobierz podsumowania kosztów użycia z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Liczba uwzględnianych dni.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Ogranicz podsumowanie do jednego identyfikatora skonfigurowanego agenta.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agreguj dane ze wszystkich skonfigurowanych agentów. Nie można łączyć z `--agent`.
</ParamField>

### `gateway stability`

Pobierz ostatnie dane rejestratora stabilności diagnostycznej z działającego Gatewaya.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maksymalna liczba ostatnich uwzględnianych zdarzeń (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtruj według typu zdarzenia diagnostycznego, np. `payload.large` lub `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Uwzględnij tylko zdarzenia występujące po numerze sekwencji diagnostycznej.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Zamiast wywoływania działającego Gatewaya odczytaj utrwalony pakiet stabilności. `--bundle latest` (lub samo `--bundle`) wybiera najnowszy pakiet w katalogu stanu; można również bezpośrednio przekazać ścieżkę do pliku JSON pakietu.
</ParamField>
<ParamField path="--export" type="boolean">
  Zamiast wyświetlania szczegółów stabilności zapisz archiwum ZIP z diagnostyką pomocy technicznej, które można udostępnić.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Prywatność i działanie pakietów">
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejek/sesji, identyfikatory zatwierdzeń, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie zawierają tekstu czatu, treści Webhooków, danych wyjściowych narzędzi, nieprzetworzonych treści żądań/odpowiedzi, tokenów, plików cookie, wartości sekretów, nazw hostów ani nieprzetworzonych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Krytyczne zakończenia Gatewaya, przekroczenia limitu czasu zamykania i niepowodzenia uruchamiania po restarcie zapisują tę samą migawkę diagnostyczną w `~/.openclaw/logs/stability/openclaw-stability-*.json`, jeśli rejestrator zawiera zdarzenia. Sprawdź najnowszy pakiet za pomocą `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają zastosowanie również do danych wyjściowych pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalne archiwum ZIP z diagnostyką przeznaczoną do zgłoszeń błędów. Opis modelu prywatności i zawartości pakietu znajdziesz w sekcji [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowego pliku zip. Domyślnie jest to eksport dla pomocy technicznej w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych wierszy dziennika do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów dziennika do przeanalizowania.
</ParamField>
<ParamField path="--url <url>" type="string">
  Adres URL WebSocket Gateway na potrzeby migawki kondycji.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway na potrzeby migawki kondycji.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway na potrzeby migawki kondycji.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Limit czasu migawki stanu/kondycji.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyświetl zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport obejmuje: `manifest.json` (spis plików), `summary.md` (podsumowanie Markdown), `diagnostics.json` (nadrzędne podsumowanie konfiguracji/dzienników/wykrywania/stabilności/stanu/kondycji), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` oraz `stability/latest.json`, jeśli pakiet istnieje.

Eksport zaprojektowano z myślą o udostępnianiu. Zachowuje szczegóły operacyjne przydatne podczas debugowania — bezpieczne pola dziennika, nazwy podsystemów, kody stanu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów/dostawców, niepoufne ustawienia funkcji oraz zredagowane operacyjne komunikaty dziennika — a pomija lub redaguje treść czatów, zawartość Webhooków, dane wyjściowe narzędzi, dane uwierzytelniające, pliki cookie, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów oraz wartości poufne. Gdy komunikat dziennika przypomina tekst danych użytkownika/czatu/narzędzia (np. „użytkownik powiedział”, „tekst czatu”, „dane wyjściowe narzędzia”, „treść Webhooka”), eksport zachowuje wyłącznie informację o pominięciu wiadomości oraz jej rozmiar w bajtach.

### `gateway status`

Wyświetla usługę Gateway (launchd/systemd/schtasks) oraz opcjonalny test łączności/uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel testu. Skonfigurowany cel zdalny i localhost nadal są testowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem na potrzeby testu.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem na potrzeby testu.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Limit czasu testu.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń test łączności (widok wyłącznie usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj również usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Rozszerz test łączności o test odczytu i zakończ działanie z kodem różnym od zera w przypadku niepowodzenia. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka stanu">
    - Pozostaje dostępne do celów diagnostycznych nawet wtedy, gdy lokalna konfiguracja CLI nie istnieje lub jest nieprawidłowa.
    - Domyślne dane wyjściowe potwierdzają stan usługi, połączenie WebSocket oraz możliwość uwierzytelnienia widoczną podczas uzgadniania — nie operacje odczytu/zapisu/administracyjne.
    - Testy nie wprowadzają zmian w przypadku pierwszego uwierzytelnienia urządzenia: wykorzystują istniejący token urządzenia z pamięci podręcznej, jeśli jest dostępny, ale nigdy nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania tylko do odczytu wyłącznie w celu sprawdzenia stanu.
    - Jeśli to możliwe, rozwiązuje skonfigurowane SecretRef uwierzytelniania na potrzeby testu. Jeśli wymaganego SecretRef nie można rozwiązać, `--json` zgłasza `rpc.authWarning`, gdy test łączności/uwierzytelniania kończy się niepowodzeniem; przekaż jawnie `--token`/`--password` albo napraw źródło sekretu. Ostrzeżenia o nierozwiązanym uwierzytelnianiu są wyciszane po pomyślnym zakończeniu testu.
    - Dane wyjściowe JSON zawierają `gateway.version`, gdy uruchomiony Gateway ją zgłasza; `--require-rpc` może użyć zastępczo ładunku RPC `status.runtimeVersion`, jeśli test uzgadniania nie może dostarczyć metadanych wersji.
    - Używaj `--require-rpc` w skryptach/automatyzacji, gdy samo nasłuchiwanie usługi nie wystarcza i potrzebujesz również sprawnego RPC z zakresem odczytu.
    - `--deep` skanuje dodatkowe instalacje launchd/systemd/schtasks; gdy zostanie znalezionych wiele usług podobnych do Gateway, dane wyjściowe dla użytkownika wyświetlają wskazówki dotyczące porządkowania (zwykle należy uruchamiać jeden Gateway na komputer) i, w stosownych przypadkach, zgłaszają niedawne przekazanie po ponownym uruchomieniu nadzorcy.
    - `--deep` uruchamia również walidację konfiguracji w trybie uwzględniającym pluginy (`pluginValidation: "full"`) i ujawnia ostrzeżenia manifestu pluginu (np. brak metadanych konfiguracji kanału). Domyślne `gateway status` zachowuje szybką ścieżkę tylko do odczytu, która pomija walidację pluginów.
    - Dane wyjściowe dla użytkownika zawierają rozwiązaną ścieżkę pliku dziennika oraz ścieżki konfiguracji CLI i usługi wraz z informacją o ich poprawności, co pomaga diagnozować rozbieżności profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole rozbieżności uwierzytelniania w Linux systemd">
    - Kontrole rozbieżności uwierzytelniania usługi odczytują z jednostki zarówno `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki poprzedzone `-`).
    - Rozwiązuje SecretRef `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, następnie awaryjnie środowisko procesu).
    - Kontrole rozbieżności tokena pomijają rozwiązywanie tokena konfiguracji, gdy uwierzytelnianie tokenem nie jest faktycznie aktywne (`gateway.auth.mode` jawnie ustawione na `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdy hasło może mieć pierwszeństwo i żaden kandydat na token nie może zwyciężyć).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Polecenie „debuguj wszystko”. Zawsze testuje:

- skonfigurowany zdalny Gateway (jeśli ustawiono) oraz
- localhost (local loopback), **nawet jeśli skonfigurowano cel zdalny**.

Przekazanie `--url` dodaje ten jawny cel przed pozostałymi. Dane wyjściowe dla użytkownika oznaczają cele jako `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` oraz `Local loopback`.

<Note>
Jeśli osiągalnych jest wiele celów testu, wyświetlane są wszystkie. Tunel SSH, adres URL TLS/proxy i skonfigurowany zdalny adres URL mogą wskazywać ten sam Gateway, nawet jeśli używają różnych portów transportowych; `multiple_gateways` jest zarezerwowane dla osiągalnych Gatewayów o różnych lub niejednoznacznych tożsamościach. Uruchamianie wielu Gatewayów jest obsługiwane w przypadku odizolowanych profili (np. bota ratunkowego), ale większość instalacji uruchamia jeden Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Użyj tego portu dla lokalnego celu testu local loopback oraz zdalnego portu tunelu SSH. Bez `--url` powoduje to wybranie wyłącznie lokalnego celu local loopback zamiast skonfigurowanego adresu URL środowiska Gateway, portu środowiska lub celów zdalnych.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` określa, co test zdołał potwierdzić w zakresie uwierzytelniania, niezależnie od osiągalności.
    - `Read probe: ok` oznacza, że wywołania RPC ze szczegółami w zakresie odczytu (`health`/`status`/`system-presence`/`config.get`) również zakończyły się powodzeniem.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie powiodło się, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **obniżona** osiągalność, a nie całkowite niepowodzenie.
    - `Read probe: failed` po `Connect: ok` oznacza, że WebSocket został połączony, ale kolejne operacje diagnostyczne odczytu przekroczyły limit czasu lub zakończyły się niepowodzeniem — również stan **obniżony**, a nie nieosiągalność.
    - Podobnie jak `gateway status`, test wykorzystuje istniejące uwierzytelnianie urządzenia z pamięci podręcznej, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod zakończenia jest różny od zera tylko wtedy, gdy żaden testowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Dane wyjściowe JSON">
    Poziom nadrzędny:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej diagnostyki RPC ze szczegółami.
    - `capability`: najlepsza możliwość zaobserwowana wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel, który należy uznać za aktywnego zwycięzcę, w kolejności: jawny adres URL, tunel SSH, skonfigurowany cel zdalny, lokalny local loopback.
    - `warnings[]`: rekordy ostrzeżeń tworzone w miarę możliwości, zawierające `code`, `message` i opcjonalne `targetIds`.
    - `network`: wskazówki dotyczące adresów URL local loopback/sieci tailnet, wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` / `discovery.count`: faktyczny budżet wykrywania/liczba wyników użyte w tym przebiegu testu.

    Dla każdego celu (`targets[].connect`): `ok` (osiągalność + klasyfikacja stanu obniżonego), `rpcOk` (pełny sukces RPC ze szczegółami), `scopeLimited` (RPC ze szczegółami nie powiodło się z powodu braku zakresu operatora).

    Dla każdego celu (`targets[].auth`): `role` i `scopes` zgłoszone w `hello-ok`, jeśli są dostępne, oraz ujawniona klasyfikacja `capability`.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie użyło zastępczo testów bezpośrednich.
    - `multiple_gateways`: osiągalne były Gatewaye o różnych tożsamościach albo OpenClaw nie mógł potwierdzić, że osiągalne cele są tym samym Gateway. Tunel SSH, adres URL proxy lub skonfigurowany zdalny adres URL prowadzący do tego samego Gateway nie powoduje tego ostrzeżenia.
    - `auth_secretref_unresolved`: nie udało się rozwiązać skonfigurowanego SecretRef uwierzytelniania dla celu, którego test się nie powiódł.
    - `probe_scope_limited`: połączenie WebSocket powiodło się, ale test odczytu był ograniczony z powodu braku `operator.read`.
    - `local_tls_runtime_unavailable`: TLS lokalnego Gateway jest włączony, ale OpenClaw nie mógł wczytać odcisku palca lokalnego certyfikatu.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (zgodność z aplikacją Mac)

Tryb „Remote over SSH” aplikacji macOS używa lokalnego przekierowania portu, aby zdalny Gateway ograniczony do local loopback był osiągalny pod adresem `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` lub `user@host:port` (domyślny port to `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Plik tożsamości.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wybierz pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` oraz skonfigurowanej domeny rozległej, jeśli istnieje). Wskazówki wyłącznie TXT są ignorowane.
</ParamField>

Domyślne ustawienia konfiguracji (opcjonalne): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Niskopoziomowe narzędzie pomocnicze RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Ciąg obiektu JSON z parametrami.
</ParamField>
<ParamField path="--url <url>" type="string">
  Adres URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Budżet limitu czasu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Głównie dla wywołań RPC w stylu agenta, które przesyłają zdarzenia pośrednie przed końcowym ładunkiem.
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe JSON przeznaczone do odczytu maszynowego.
</ParamField>

<Note>
`--params` musi być prawidłowym JSON-em, a każda metoda weryfikuje własny kształt parametrów (dodatkowe lub błędnie nazwane pola są odrzucane).
</Note>

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalacja z programem opakowującym

Użyj `--wrapper`, gdy zarządzana usługa musi uruchamiać się za pośrednictwem innego pliku wykonywalnego, na przykład nakładki menedżera sekretów lub narzędzia uruchamiającego proces jako inny użytkownik. Program opakowujący otrzymuje standardowe argumenty Gateway i odpowiada za ostateczne wykonanie przez `exec` programu `openclaw` albo Node z tymi argumentami.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Wrapper można również ustawić za pośrednictwem środowiska. Polecenie `gateway install` sprawdza, czy ścieżka wskazuje na plik wykonywalny, zapisuje wrapper w `ProgramArguments` usługi i utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych ponownych instalacji, aktualizacji i napraw wykonywanych przez narzędzie diagnostyczne.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Aby usunąć utrwalony wrapper, wyczyść `OPENCLAW_WRAPPER` podczas ponownej instalacji:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opcje poleceń">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (domyślnie: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Działanie cyklu życia">
    - Użyj `gateway restart`, aby ponownie uruchomić zarządzaną usługę. Nie łącz poleceń `gateway stop` i `gateway start` jako zamiennika ponownego uruchomienia.
    - W systemie macOS polecenie `gateway stop` domyślnie używa `launchctl bootout`, co usuwa LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączania — automatyczne odzyskiwanie KeepAlive pozostaje aktywne na wypadek przyszłych awarii, a `gateway start` ponownie włącza usługę bez konieczności ręcznego użycia `launchctl enable`. Podaj `--disable`, aby trwale wyłączyć KeepAlive i RunAtLoad, dzięki czemu Gateway nie uruchomi się ponownie aż do kolejnego jawnego wywołania `gateway start`; użyj tej opcji, gdy ręczne zatrzymanie ma obowiązywać również po ponownym uruchomieniu systemu.
    - Polecenia cyklu życia obsługują opcję `--json` na potrzeby skryptów.

  </Accordion>
  <Accordion title="Uwierzytelnianie i SecretRef podczas instalacji">
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, polecenie `gateway install` sprawdza, czy można rozwiązać SecretRef, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowanego SecretRef tokenu nie można rozwiązać, instalacja zostaje bezpiecznie przerwana zamiast utrwalać tekst jawny jako wartość zastępczą.
    - W przypadku uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparty na SecretRef zamiast opcji `--password` z hasłem podanym bezpośrednio.
    - W trybie wnioskowanego uwierzytelniania dostępna tylko w powłoce zmienna `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań dotyczących tokenu podczas instalacji; podczas instalowania zarządzanej usługi użyj trwałej konfiguracji (`gateway.auth.password` lub `env` w konfiguracji).
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie instancji Gateway (Bonjour)

Polecenie `gateway discover` wyszukuje sygnały nawigacyjne Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour dla sieci rozległych): wybierz domenę (przykład: `openclaw.internal.`), a następnie skonfiguruj split DNS i serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Sygnał nawigacyjny rozgłaszają tylko instancje Gateway z włączonym wykrywaniem Bonjour (domyślnie włączonym).

Wskazówki TXT w każdym sygnale nawigacyjnym: `role` (wskazówka dotycząca roli Gateway), `transport` (wskazówka dotycząca transportu, np. `gateway`), `gatewayPort` (port WebSocket, zwykle `18789`), `tailnetDns` (nazwa hosta MagicDNS, jeśli jest dostępna), `gatewayTls` / `gatewayTlsSha256` (włączony TLS i odcisk certyfikatu). Pola `sshPort` i `cliPath` są publikowane tylko w pełnym trybie wykrywania (`discovery.mdns.mode: "full"`; domyślnie używany jest tryb `"minimal"`, który je pomija — klienci używają wtedy domyślnie portu `22` dla celów SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla pojedynczego polecenia (przeglądanie/rozwiązywanie).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe w formacie do odczytu maszynowego (wyłącza również stylizację i wskaźnik postępu).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Przeszukuje domenę `local.` oraz skonfigurowaną domenę sieci rozległej, jeśli jest włączona.
- Pole `wsUrl` w danych wyjściowych JSON jest wyprowadzane z rozwiązanego punktu końcowego usługi, a nie wyłącznie ze wskazówek TXT, takich jak `lanHost` lub `tailnetDns`.
- Ustawienie `discovery.mdns.mode` steruje publikowaniem pól `sshPort`/`cliPath` zarówno w lokalnym mDNS `local.`, jak i w DNS-SD dla sieci rozległych (zobacz wyżej).

</Note>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Podręcznik operacyjny Gateway](/pl/gateway)
