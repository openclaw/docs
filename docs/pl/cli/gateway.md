---
read_when:
    - Uruchamianie Gateway z CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie Gateway za pomocą Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamiaj, odpytuj i wykrywaj instancje Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS + szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza i znajduje bramy.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - Domyślnie Gateway odmawia uruchomienia, chyba że w `~/.openclaw/openclaw.json` ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` do jednorazowych uruchomień ad hoc/deweloperskich.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, potraktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast zakładać tryb lokalny domyślnie.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania trybu lokalnego” za Ciebie.
    - Bindowanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
    - `SIGUSR1` wyzwala restart w procesie, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, przy jednoczesnym pozostawieniu dozwolonych operacji narzędzia Gateway/config apply/update).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces Gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie surowym, przywróć terminal przed wyjściem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (domyślna wartość pochodzi z konfiguracji/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb bindowania nasłuchu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Nadpisanie trybu uwierzytelniania.
</ParamField>
<ParamField path="--token <token>" type="string">
  Nadpisanie tokena (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
</ParamField>
<ParamField path="--password <password>" type="string">
  Nadpisanie hasła.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło Gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację Tailscale serve/funnel przy zamykaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na uruchomienie Gateway bez `gateway.mode=local` w konfiguracji. Omija zabezpieczenie uruchamiania wyłącznie dla ad hoc/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską + dane uwierzytelniające + sesje + workspace (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij istniejący nasłuch na wybranym porcie przed uruchomieniem.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Szczegółowe logi.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Pokazuj w konsoli tylko logi backendu CLI (i włącz stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Styl logów WebSocket.
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

## Restartowanie Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw przed restartem. Jeśli aktywne są zakolejkowane operacje, dostarczanie odpowiedzi, osadzone uruchomienia lub uruchomienia zadań, Gateway zgłasza blokady, scala zduplikowane żądania bezpiecznego restartu i restartuje się po opróżnieniu aktywnej pracy. Zwykłe `restart` zachowuje istniejące zachowanie menedżera usług dla zgodności. Używaj `--force` tylko wtedy, gdy jawnie chcesz natychmiastowej ścieżki nadpisania.

<Warning>
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, env albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania pluginów dla installed-index, manifest registry, startup planning i owner-map.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać najlepszym wysiłkiem oś czasu diagnostyki uruchamiania JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest podawana przez env. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby wykonać benchmark uruchamiania Gateway. Benchmark zapisuje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy trace uruchamiania, opóźnienie pętli zdarzeń oraz szczegóły czasów tabel wyszukiwania pluginów.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają RPC przez WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Domyślnie: czytelne dla człowieka (kolorowe w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ czytelny dla człowieka.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: timeout/budżet (różni się zależnie od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Przekaż `--token` lub `--password` jawnie. Brak jawnych danych uwierzytelniających jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest próbką żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, gdy boczne procesy pluginów startowych, kanały lub skonfigurowane hooki nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, stosunkiem rdzeni CPU oraz flagą `degraded`.

### `gateway usage-cost`

Pobierz podsumowania kosztu użycia z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Liczba dni do uwzględnienia.
</ParamField>

### `gateway stability`

Pobierz najnowszy rejestrator stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maksymalna liczba najnowszych zdarzeń do uwzględnienia (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtruj według typu zdarzenia diagnostycznego, takiego jak `payload.large` lub `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Uwzględnij tylko zdarzenia po numerze sekwencji diagnostycznej.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Odczytaj utrwalony pakiet stabilności zamiast wywoływać działający Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę JSON pakietu.
</ParamField>
<ParamField path="--export" type="boolean">
  Zapisz udostępnialny zip diagnostyki wsparcia zamiast drukować szczegóły stabilności.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Rekordy przechowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary bajtów, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i błędach uruchamiania po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet za pomocą `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają też zastosowanie do wyjścia pakietu.

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
  Ścieżka wyjściowa zip. Domyślnie jest to eksport wsparcia w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych linii logów do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów logów do sprawdzenia.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway dla migawki health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout migawki statusu/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone migawki statusu/health Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomocne w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory providerów, niesekretne ustawienia funkcji oraz zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, dane uwierzytelniające, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów oraz wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną próbę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondowania. Skonfigurowany zdalny cel + localhost nadal są sondowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla sondy.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla sondy.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Limit czasu sondy.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondę łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Ulepsz domyślną sondę łączności do sondy odczytu i zakończ z kodem niezerowym, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest brakująca lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz możliwość uwierzytelniania widoczną w czasie uzgadniania połączenia. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Sondy diagnostyczne nie modyfikują uwierzytelniania urządzenia przy pierwszym użyciu: ponownie używają istniejącego, buforowanego tokena urządzenia, gdy taki istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu tylko po to, aby sprawdzić status.
    - `gateway status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania dla uwierzytelniania sondy, gdy to możliwe.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach do uwierzytelniania są wyciszane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i potrzebujesz także sprawnych wywołań RPC z zakresem odczytu.
    - `--deep` dodaje best-effort skanowanie dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wyjście czytelne dla człowieka drukuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - `--deep` zgłasza także niedawne przekazanie restartu nadzorcy Gateway, gdy proces usługi zakończył się czysto na potrzeby restartu przez zewnętrznego nadzorcę.
    - Wyjście czytelne dla człowieka zawiera rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek/poprawności konfiguracji CLI względem usługi, aby pomóc diagnozować rozbieżności profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole rozbieżności uwierzytelniania Linux systemd">
    - W instalacjach Linux systemd kontrole rozbieżności uwierzytelniania usługi odczytują zarówno wartości `Environment=`, jak i `EnvironmentFile=` z jednostki (w tym `%h`, ścieżki w cudzysłowie, wiele plików oraz opcjonalne pliki `-`).
    - Kontrole rozbieżności rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, następnie awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawny `gateway.auth.mode` równy `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdzie hasło może wygrać i żaden kandydat tokena nie może wygrać), kontrole rozbieżności tokena pomijają rozwiązywanie tokena konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny Gateway (jeśli ustawiony), oraz
- localhost (local loopback) **nawet jeśli zdalny cel jest skonfigurowany**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed obydwoma. Wyjście czytelne dla człowieka etykietuje cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli osiągalnych jest wiele Gateway, wypisuje je wszystkie. Wiele Gateway jest obsługiwanych, gdy używasz izolowanych profili/portów (np. bot ratunkowy), ale większość instalacji nadal uruchamia pojedynczy Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co sonda mogła potwierdzić o uwierzytelnianiu. Jest to oddzielne od osiągalności.
    - `Read probe: ok` oznacza, że szczegółowe wywołania RPC z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) także się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale dalsza diagnostyka odczytu przekroczyła limit czasu lub się nie powiodła. To także **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, sonda ponownie używa istniejącego buforowanego uwierzytelniania urządzenia, ale nie tworzy pierwszorazowej tożsamości urządzenia ani stanu parowania.
    - Kod zakończenia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wyjście JSON">
    Poziom główny:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej szczegółowej diagnostyki RPC.
    - `capability`: najlepsza możliwość widziana wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywnego zwycięzcę w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny cel, następnie local loopback.
    - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: wskazówki URL dla local loopback/tailnet pochodzące z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte dla tego przebiegu sondy.

    Dla celu (`targets[].connect`):

    - `ok`: osiągalność po klasyfikacji połączenia + degradacji.
    - `rpcOk`: pełny sukces szczegółowego RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu brakującego zakresu operatora.

    Dla celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: ujawniona klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sond.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; jest to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak bot ratunkowy.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla nieudanego celu.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu została ograniczona przez brakujący `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (zgodność z aplikacją Mac)

Tryb aplikacji macOS „Remote over SSH” używa lokalnego przekierowania portu, aby zdalny Gateway (który może być związany tylko z loopback) stał się osiągalny pod `ws://127.0.0.1:<port>`.

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
  Wybierz pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Wskazówki tylko TXT są ignorowane.
</ParamField>

Konfiguracja (opcjonalna, używana jako wartości domyślne):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowy pomocnik RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Łańcuch obiektu JSON dla parametrów.
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
  Budżet limitu czasu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Głównie dla RPC w stylu agenta, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyjście JSON czytelne maszynowo.
</ParamField>

<Note>
`--params` musi być prawidłowym JSON.
</Note>

## Zarządzaj usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalacja z wrapperem

Użyj `--wrapper`, gdy zarządzana usługa musi startować przez inny plik wykonywalny, na przykład podkładkę menedżera sekretów lub pomocnika uruchamiania jako inny użytkownik. Wrapper otrzymuje normalne argumenty Gateway i odpowiada za ostateczne wykonanie `openclaw` albo Node z tymi argumentami.

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

Możesz także ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest plikiem wykonywalnym, zapisuje wrapper do `ProgramArguments` usługi i utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Aby usunąć utrwalony wrapper, wyczyść `OPENCLAW_WRAPPER` podczas reinstalacji:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opcje poleceń">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Zachowanie cyklu życia">
    - Użyj `gateway restart`, aby zrestartować zarządzaną usługę. Nie łącz `gateway stop` i `gateway start` jako zamiennika restartu; w macOS `gateway stop` celowo wyłącza LaunchAgent przed zatrzymaniem go.
    - `gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw i odroczenie restartu do czasu opróżnienia dostarczania odpowiedzi, osadzonych uruchomień i uruchomień zadań. `--safe` nie można łączyć z `--force` ani `--wait`.
    - `gateway restart --wait 30s` zastępuje skonfigurowany budżet opróżniania restartu dla tego restartu. Same liczby oznaczają milisekundy; akceptowane są jednostki takie jak `s`, `m` i `h`. `--wait 0` czeka bezterminowo.
    - `gateway restart --force` pomija opróżnianie aktywnej pracy i restartuje natychmiast. Użyj tego, gdy operator sprawdził już wymienione blokery zadań i chce natychmiast przywrócić gateway.
    - Polecenia cyklu życia akceptują `--json` do skryptowania.

  </Accordion>
  <Accordion title="Uwierzytelnianie i SecretRefs podczas instalacji">
    - Gdy uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, `gateway install` sprawdza, czy SecretRef można rozwiązać, ale nie zapisuje rozwiązanego tokena w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena pozostaje nierozwiązany, instalacja kończy się niepowodzeniem w trybie zamkniętym zamiast zapisywać awaryjny tekst jawny.
    - W przypadku uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` albo `gateway.auth.password` oparty na SecretRef zamiast wbudowanego `--password`.
    - W wywnioskowanym trybie uwierzytelniania dostępne tylko w powłoce `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań dotyczących tokena instalacyjnego; podczas instalowania zarządzanej usługi użyj trwałej konfiguracji (`gateway.auth.password` lub konfiguracji `env`).
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje w poszukiwaniu sygnałów nawigacyjnych Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko Gateway z włączonym wykrywaniem Bonjour (domyślnie) ogłaszają sygnał nawigacyjny.

Rekordy wykrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli Gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalnie; gdy go nie ma, klienci domyślnie ustawiają cele SSH na `22`)
- `tailnetDns` (nazwa hosta MagicDNS, gdy jest dostępna)
- `gatewayTls` / `gatewayTlsSha256` (TLS włączony + odcisk certyfikatu)
- `cliPath` (wskazówka instalacji zdalnej zapisywana w strefie Wide-Area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo (wyłącza także stylizację/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę Wide-Area, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON pochodzi z rozwiązanego punktu końcowego usługi, a nie z wskazówek dostępnych tylko w TXT, takich jak `lanHost` lub `tailnetDns`.
- W mDNS `local.` wartości `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort` również pozostaje tam opcjonalny.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
