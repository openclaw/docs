---
read_when:
    - Uruchamianie Gateway z CLI (dewelopersko lub na serwerach)
    - Debugowanie uwierzytelniania Gateway, trybów powiązania i łączności
    - Wykrywanie Gatewayów przez Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie Gatewayów
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway to serwer WebSocket OpenClaw (kanały, Node, sesje, hooki). Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Lokalna konfiguracja mDNS + szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Przegląd wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza Gatewaye i je znajduje.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration">
    Klucze konfiguracji Gateway najwyższego poziomu.
  </Card>
</CardGroup>

## Uruchamianie Gateway

Uruchom lokalny proces Gateway:

```bash
openclaw gateway
```

Alias pierwszoplanowy:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Zachowanie przy uruchamianiu">
    - Domyślnie Gateway odmawia uruchomienia, jeśli w `~/.openclaw/openclaw.json` nie jest ustawione `gateway.mode=local`. Użyj `--allow-unconfigured` do uruchomień ad hoc/deweloperskich.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast domyślnie zakładać tryb lokalny.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
    - Powiązanie poza loopback bez uwierzytelniania jest blokowane (bariera bezpieczeństwa).
    - `SIGUSR1` wyzwala restart w procesie, jeśli jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy narzędzie/konfiguracja Gateway apply/update pozostają dozwolone).
    - Programy obsługi `SIGINT`/`SIGTERM` zatrzymują proces gateway, ale nie przywracają niestandardowego stanu terminala. Jeśli opakowujesz CLI w TUI lub wejście raw-mode, przywróć terminal przed zakończeniem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (domyślny pochodzi z config/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb powiązania listenera.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Nadpisanie trybu uwierzytelniania.
</ParamField>
<ParamField path="--token <token>" type="string">
  Nadpisanie tokenu (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
</ParamField>
<ParamField path="--password <password>" type="string">
  Nadpisanie hasła.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Wystaw Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Resetuj konfigurację Tailscale serve/funnel przy zamykaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na uruchomienie gateway bez `gateway.mode=local` w konfiguracji. Omija barierę uruchamiania tylko dla rozruchu ad hoc/deweloperskiego; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Resetuj konfigurację deweloperską + poświadczenia + sesje + workspace (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij istniejący listener na wybranym porcie przed uruchomieniem.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Szczegółowe logi.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Pokazuj w konsoli tylko logi backendu CLI (i włącz stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Styl logu WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias dla `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Loguj surowe zdarzenia strumienia modelu do jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ścieżka jsonl surowego strumienia.
</ParamField>

<Warning>
Inline `--password` może być widoczne w lokalnych listach procesów. Preferuj `--password-file`, env lub `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby mierzyć czas uruchamiania Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz` oraz czasy śledzenia uruchamiania.

## Odpytywanie działającego Gateway

Wszystkie polecenia odpytywania używają WebSocket RPC.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylizacji/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącza ANSI przy zachowaniu układu dla człowieka.

  </Tab>
  <Tab title="Wspólne opcje">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: timeout/budżet (zależy od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agentów).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń to błąd.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Punkt końcowy HTTP `/healthz` to sonda żywotności: zwraca odpowiedź, gdy tylko serwer może odpowiadać przez HTTP. Punkt końcowy HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, gdy sidecary uruchamiania, kanały lub skonfigurowane hooki nadal się stabilizują.

### `gateway usage-cost`

Pobieraj podsumowania usage-cost z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Liczba dni do uwzględnienia.
</ParamField>

### `gateway stability`

Pobieraj ostatni rejestrator stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maksymalna liczba ostatnich zdarzeń do uwzględnienia (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtruj według typu zdarzenia diagnostycznego, takiego jak `payload.large` lub `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Uwzględnij tylko zdarzenia po numerze sekwencji diagnostycznej.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Odczytaj utrwalony pakiet stabilności zamiast wywoływać działający Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę do pliku JSON pakietu.
</ParamField>
<ParamField path="--export" type="boolean">
  Zapisz udostępnialny zip z diagnostyką wsparcia zamiast wypisywać szczegóły stabilności.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Prywatność i zachowanie pakietu">
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści Webhooka, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies, tajnych wartości, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i błędach uruchamiania podczas restartu OpenClaw zapisuje ten sam zrzut diagnostyczny do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet przez `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` również mają zastosowanie do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny zip diagnostyczny przeznaczony do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisano w [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa zip. Domyślnie eksport wsparcia w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych linii logów do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów logów do sprawdzenia.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway dla zrzutu health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla zrzutu health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla zrzutu health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout zrzutu status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone zrzuty status/health Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory dostawców, nietajne ustawienia funkcji oraz zredagowane komunikaty logów operacyjnych. Pomija lub redaguje tekst czatu, treści Webhooka, wyniki narzędzi, poświadczenia, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów oraz tajne wartości. Gdy komunikat w stylu LogTape wygląda jak tekst ładunku użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, wraz z liczbą jego bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę możliwości łączności/uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondy. Skonfigurowany zdalny + localhost nadal są sondowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla sondy.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla sondy.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout sondy.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondę łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj też usługi systemowe.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Podnieś domyślną sondę łączności do sondy odczytu i zakończ z kodem niezerowym, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket i możliwości uwierzytelniania widoczne w momencie handshake. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Sondy diagnostyczne nie modyfikują stanu przy pierwszym uwierzytelnianiu urządzenia: ponownie używają istniejącego buforowanego tokenu urządzenia, jeśli istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić status.
    - `gateway status` rozwiązuje skonfigurowane SecretRef uwierzytelniania dla uwierzytelniania sondy, gdy to możliwe.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany na tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy sonda łączności/uwierzytelniania zakończy się niepowodzeniem; przekaż jawnie `--token`/`--password` lub najpierw rozwiąż źródło sekretu.
    - Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanym auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacjach, gdy sama nasłuchująca usługa nie wystarcza i potrzebujesz również zdrowych wywołań RPC o zakresie odczytu.
    - `--deep` dodaje skanowanie best-effort dodatkowych instalacji launchd/systemd/schtasks. Gdy wykrytych zostanie wiele usług podobnych do gateway, wynik dla człowieka wypisuje wskazówki dotyczące porządkowania i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - Wynik dla człowieka zawiera rozwiązaną ścieżkę logu pliku oraz migawkę ścieżek/prawidłowości konfiguracji CLI względem usługi, aby pomóc diagnozować dryf profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole dryfu uwierzytelniania Linux systemd">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania odczytują z jednostki zarówno wartości `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików i opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują SecretRef `gateway.auth.token` przy użyciu scalonego środowiska wykonawczego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawne `gateway.auth.mode` ustawione na `password`/`none`/`trusted-proxy` albo nieustawiony tryb, w którym hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu z konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny gateway (jeśli ustawiony), oraz
- localhost (loopback) **nawet jeśli zdalny jest skonfigurowany**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wynik dla człowieka oznacza cele jako:

- `URL (jawny)`
- `Zdalny (skonfigurowany)` lub `Zdalny (skonfigurowany, nieaktywny)`
- `local loopback`

<Note>
Jeśli osiągalnych jest wiele gatewayów, wypisze je wszystkie. Wiele gatewayów jest obsługiwanych, gdy używasz izolowanych profili/portów (np. rescue bota), ale większość instalacji nadal uruchamia pojedynczy gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informuje, co sonda mogła potwierdzić o uwierzytelnianiu. Jest to oddzielne od osiągalności.
    - `Read probe: ok` oznacza, że szczegółowe wywołania RPC o zakresie odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale szczegółowe RPC o zakresie odczytu są ograniczone. Jest to zgłaszane jako osiągalność **zdegradowana**, a nie pełna awaria.
    - Podobnie jak `gateway status`, probe ponownie używa istniejącego buforowanego uwierzytelniania urządzenia, ale nie tworzy tożsamości urządzenia ani stanu parowania przy pierwszym użyciu.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wyjście JSON">
    Najwyższy poziom:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel miał ograniczone szczegółowe RPC z powodu zakresu.
    - `capability`: najlepsza widoczna możliwość wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny, następnie local loopback.
    - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: wskazówki URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte dla tego przebiegu sondy.

    Dla każdego celu (`targets[].connect`):

    - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowania.
    - `rpcOk`: pełny sukces szczegółowych RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu braku zakresu operatora.

    Dla każdego celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: prezentowana klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sond.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak rescue bot.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla celu zakończonego niepowodzeniem.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu była ograniczona z powodu braku `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (zgodność z aplikacją Mac)

Tryb „Remote over SSH” w aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalny gateway (który może być powiązany tylko z loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` lub `user@host:port` (port domyślnie `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Plik tożsamości.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wybierz pierwszy wykryty host gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena szerokoobszarowa, jeśli istnieje). Wskazówki tylko-TXT są ignorowane.
</ParamField>

Konfiguracja (opcjonalna, używana jako domyślna):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowy helper RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Ciąg obiektu JSON dla parametrów.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Budżet timeoutu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Głównie dla RPC w stylu agentów, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyjście JSON czytelne maszynowo.
</ParamField>

<Note>
`--params` musi być prawidłowym JSON.
</Note>

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Opcje poleceń">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Uwagi dotyczące instalacji i cyklu życia usługi">
    - `gateway install` obsługuje `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Używaj `gateway restart`, aby ponownie uruchomić zarządzaną usługę. Nie łącz `gateway stop` i `gateway start` jako zamiennika restartu; na macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, instalacja kończy się odmową zamiast utrwalać awaryjny jawny tekst.
    - W przypadku uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparte na SecretRef zamiast inline `--password`.
    - W trybie uwierzytelniania wnioskowanego samo shellowe `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań tokenu przy instalacji; przy instalacji zarządzanej usługi używaj trwałej konfiguracji (`gateway.auth.password` lub config `env`).
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.
    - Polecenia cyklu życia akceptują `--json` do skryptów.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gatewayów (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Beacon ogłaszają tylko Gatewaye z włączonym wykrywaniem Bonjour (domyślnie).

Rekordy wykrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalnie; klienci domyślnie ustawiają cele SSH na `22`, gdy go brak)
- `tailnetDns` (nazwa hosta MagicDNS, gdy dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + fingerprint certyfikatu)
- `cliPath` (wskazówka zdalnej instalacji zapisywana do strefy szerokoobszarowej)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout na polecenie (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Wyjście czytelne maszynowo (wyłącza też stylizację/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę szerokoobszarową, gdy jest włączona.
- `wsUrl` w wyjściu JSON jest wyprowadzany z rozwiązanego punktu końcowego usługi, a nie ze wskazówek tylko-TXT, takich jak `lanHost` czy `tailnetDns`.
- W `local.` mDNS `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort` pozostaje tam również opcjonalny.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
