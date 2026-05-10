---
read_when:
    - Uruchamianie Gateway z poziomu CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie instancji Gateway za pomocą Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie instancji Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS + szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Przegląd wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza i znajduje gatewaye.
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
  <Accordion title="Zachowanie podczas uruchamiania">
    - Domyślnie Gateway odmawia uruchomienia, chyba że w `~/.openclaw/openclaw.json` ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` do doraźnych uruchomień lub uruchomień deweloperskich.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast zakładać tryb lokalny niejawnie.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania lokalnego” za Ciebie.
    - Wiązanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
    - `SIGUSR1` wyzwala restart w procesie, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy narzędzia gateway oraz zastosowanie/aktualizacja konfiguracji pozostaną dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI przy użyciu TUI lub wejścia w trybie surowym, przywróć terminal przed wyjściem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (wartość domyślna pochodzi z konfiguracji/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb wiązania listenera.
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
  Odczytaj hasło gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację serve/funnel Tailscale przy zamykaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na start gateway bez `gateway.mode=local` w konfiguracji. Omija zabezpieczenie uruchamiania wyłącznie dla doraźnego/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską + dane uwierzytelniające + sesje + workspace (wymaga `--dev`).
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
  Styl logów WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias dla `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Loguj surowe zdarzenia strumienia modelu do jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ścieżka surowego strumienia jsonl.
</ParamField>

## Restartowanie Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` prosi działający Gateway o sprawdzenie aktywnej pracy OpenClaw przed restartem. Jeśli aktywne są operacje w kolejce, dostarczanie odpowiedzi, uruchomienia osadzone lub uruchomienia zadań, Gateway zgłasza blokady, scala zduplikowane żądania bezpiecznego restartu i restartuje się po opróżnieniu aktywnej pracy. Zwykłe `restart` zachowuje istniejące zachowanie menedżera usług dla zgodności. Używaj `--force` tylko wtedy, gdy wyraźnie chcesz natychmiastowej ścieżki nadpisania.

`openclaw gateway restart --safe --skip-deferral` wykonuje ten sam skoordynowany restart świadomy OpenClaw co `--safe`, ale omija bramkę odroczenia aktywnej pracy, więc Gateway emituje restart natychmiast nawet wtedy, gdy zgłaszane są blokady. Używaj tego jako awaryjnego wyjścia operatora, gdy odroczenie zostało przypięte przez zablokowane uruchomienie zadania, a samo `--safe` czekałoby bez końca. `--skip-deferral` wymaga `--safe`.

<Warning>
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, env albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania Plugin dla indeksu zainstalowanych, rejestru manifestów, planowania uruchomienia i pracy mapy właścicieli.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki uruchamiania w JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest podawana przez env. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby zmierzyć uruchamianie Gateway. Benchmark zapisuje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy śledzenia uruchamiania, opóźnienie pętli zdarzeń oraz szczegóły czasów tabel wyszukiwania Plugin.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają RPC przez WebSocket.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ dla człowieka.

  </Tab>
  <Tab title="Wspólne opcje">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: timeout/budżet (różni się zależnie od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agentów).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki sidecary Plugin, kanały lub skonfigurowane hooki podczas uruchamiania nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, stosunkiem rdzeni CPU oraz flagą `degraded`.

### `gateway usage-cost`

Pobierz podsumowania kosztów użycia z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Liczba dni do uwzględnienia.
</ParamField>

### `gateway stability`

Pobierz ostatni rejestrator stabilności diagnostycznej z działającego Gateway.

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
  Odczytaj utrwalony pakiet stabilności zamiast wywoływać działający Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę do JSON pakietu.
</ParamField>
<ParamField path="--export" type="boolean">
  Zapisz udostępnialny zip diagnostyki wsparcia zamiast drukować szczegóły stabilności.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Prywatność i zachowanie pakietu">
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczby, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Plugin oraz zredagowane podsumowania sesji. Nie zachowują tekstu czatu, treści webhooków, wyjść narzędzi, surowych treści żądań lub odpowiedzi, tokenów, cookies, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i niepowodzeniach uruchamiania po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet za pomocą `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają też zastosowanie do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny zip diagnostyczny przeznaczony do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisuje [Eksport diagnostyki](/pl/gateway/diagnostics).

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
  URL WebSocket Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout migawki statusu/kondycji.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wydrukuj zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone migawki statusu/kondycji Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory Plugin, identyfikatory dostawców, niesekretne ustawienia funkcji oraz zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyjścia narzędzi, dane uwierzytelniające, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondowania. Skonfigurowany zdalny cel + localhost nadal są sondowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla sondowania.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla sondowania.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Limit czasu sondowania.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondowanie łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Podnieś domyślne sondowanie łączności do sondowania odczytu i zakończ z niezerowym kodem, gdy to sondowanie odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka stanu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI nie istnieje lub jest nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz możliwość uwierzytelnienia widoczną podczas uzgadniania. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Sondy diagnostyczne nie wprowadzają zmian przy pierwszym uwierzytelnianiu urządzenia: ponownie używają istniejącego tokena urządzenia z pamięci podręcznej, jeśli taki istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić stan.
    - `gateway status` w miarę możliwości rozwiązuje skonfigurowane auth SecretRefs na potrzeby uwierzytelniania sondy.
    - Jeśli wymagany auth SecretRef nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i wywołania RPC w zakresie odczytu również muszą być zdrowe.
    - `--deep` dodaje skanowanie best-effort w poszukiwaniu dodatkowych instalacji launchd/systemd/schtasks. Gdy wykrytych zostanie wiele usług podobnych do Gateway, wynik dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - `--deep` zgłasza także niedawne przekazanie restartu nadzorcy Gateway, gdy proces usługi zakończył się czysto na potrzeby restartu przez zewnętrznego nadzorcę.
    - Wynik dla człowieka zawiera rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek konfiguracji i ich poprawności dla CLI oraz usługi, aby pomóc diagnozować rozjazd profilu lub state-dir.

  </Accordion>
  <Accordion title="Kontrole dryfu uwierzytelniania Linux systemd">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania usługi odczytują z jednostki zarówno wartości `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików i opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska runtime (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` ustawiony na `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdzie hasło może wygrać i żaden kandydat tokena nie może wygrać), kontrole dryfu tokena pomijają rozwiązywanie tokena konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny Gateway (jeśli ustawiony), oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalny cel**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wynik dla człowieka etykietuje cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli osiągalnych jest wiele Gateway, wypisuje je wszystkie. Wiele Gateway jest obsługiwanych, gdy używasz odizolowanych profili/portów (np. bota ratunkowego), ale większość instalacji nadal uruchamia pojedynczy Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co sonda mogła potwierdzić o uwierzytelnianiu. Jest to niezależne od osiągalności.
    - `Read probe: ok` oznacza, że wywołania RPC szczegółów w zakresie odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC w zakresie odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale dalsza diagnostyka odczytu przekroczyła limit czasu lub się nie powiodła. To także **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Tak jak `gateway status`, sonda ponownie używa istniejącego uwierzytelniania urządzenia z pamięci podręcznej, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wynik JSON">
    Poziom główny:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej szczegółowej diagnostyki RPC.
    - `capability`: najlepsza możliwość widziana we wszystkich osiągalnych celach (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` albo `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny cel, następnie local loopback.
    - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: wskazówki URL dla local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte w tym przebiegu sondowania.

    Dla każdego celu (`targets[].connect`):

    - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowania.
    - `rpcOk`: pełny sukces szczegółowego RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu brakującego zakresu operatora.

    Dla każdego celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy jest dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy są dostępne.
    - `capability`: widoczna klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do sond bezpośrednich.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; to nietypowe, chyba że celowo uruchamiasz odizolowane profile, na przykład bota ratunkowego.
    - `auth_secretref_unresolved`: skonfigurowany auth SecretRef nie mógł zostać rozwiązany dla celu z awarią.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu była ograniczona przez brak `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parzystość z aplikacją Mac)

Tryb „Remote over SSH” aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalny Gateway (który może być powiązany tylko z loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

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
  Wybierz pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena wide-area, jeśli istnieje). Wskazówki tylko TXT są ignorowane.
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
  Budżet limitu czasu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Głównie dla RPC w stylu agenta, które strumieniują zdarzenia pośrednie przed końcowym payloadem.
</ParamField>
<ParamField path="--json" type="boolean">
  Wynik JSON czytelny maszynowo.
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

Użyj `--wrapper`, gdy zarządzana usługa musi startować przez inny plik wykonywalny, na przykład shim menedżera sekretów albo pomocnik run-as. Wrapper otrzymuje normalne argumenty Gateway i odpowiada za ostateczne wykonanie `openclaw` albo Node z tymi argumentami.

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

Możesz też ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest plikiem wykonywalnym, zapisuje wrapper w `ProgramArguments` usługi i utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Zachowanie cyklu życia">
    - Użyj `gateway restart`, aby ponownie uruchomić usługę zarządzaną. Nie łącz `gateway stop` i `gateway start` jako zamiennika ponownego uruchomienia.
    - W systemie macOS `gateway stop` domyślnie używa `launchctl bootout`, co usuwa LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączenia — automatyczne odzyskiwanie KeepAlive pozostaje aktywne dla przyszłych awarii, a `gateway start` ponownie włącza usługę w czysty sposób bez ręcznego `launchctl enable`. Przekaż `--disable`, aby trwale wstrzymać KeepAlive i RunAtLoad, tak aby Gateway nie uruchamiał się ponownie do czasu następnego jawnego `gateway start`; użyj tego, gdy ręczne zatrzymanie ma przetrwać ponowne uruchomienia systemu.
    - `gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw i odroczenie ponownego uruchomienia do czasu opróżnienia dostarczania odpowiedzi, osadzonych uruchomień i uruchomień zadań. `--safe` nie można łączyć z `--force` ani `--wait`.
    - `gateway restart --wait 30s` nadpisuje skonfigurowany budżet opróżniania dla ponownego uruchomienia w tym konkretnym przypadku. Same liczby oznaczają milisekundy; akceptowane są jednostki takie jak `s`, `m` i `h`. `--wait 0` czeka bezterminowo.
    - `gateway restart --safe --skip-deferral` uruchamia bezpieczny restart świadomy OpenClaw, ale pomija bramkę odroczenia, więc Gateway emituje restart natychmiast, nawet gdy zgłoszono blokady. Jest to awaryjna ścieżka operatora dla odroczeń zablokowanych uruchomień zadań; wymaga `--safe`.
    - `gateway restart --force` pomija opróżnianie aktywnej pracy i uruchamia ponownie natychmiast. Użyj tego, gdy operator sprawdził już wymienione blokady zadań i chce od razu przywrócić gateway.
    - Polecenia cyklu życia akceptują `--json` do skryptowania.

  </Accordion>
  <Accordion title="Uwierzytelnianie i SecretRefs podczas instalacji">
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się niepowodzeniem w trybie zamkniętym zamiast utrwalać awaryjny tekst jawny.
    - Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` albo `gateway.auth.password` oparte na SecretRef zamiast wbudowanego `--password`.
    - W trybie uwierzytelniania wnioskowanego wyłącznie powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie rozluźnia wymagań dotyczących tokenu podczas instalacji; przy instalowaniu usługi zarządzanej użyj trwałej konfiguracji (`gateway.auth.password` albo `env` w konfiguracji).
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie gatewayów (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS oraz serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko gatewaye z włączonym wykrywaniem Bonjour (domyślnie) rozgłaszają beacon.

Rekordy wykrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli gatewaya)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalny; klienci domyślnie używają `22` jako celu SSH, gdy go brakuje)
- `tailnetDns` (nazwa hosta MagicDNS, gdy jest dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + odcisk certyfikatu)
- `cliPath` (wskazówka instalacji zdalnej zapisana w strefie Wide-Area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo (wyłącza też stylizację/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę Wide-Area, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON pochodzi z rozwiązanego punktu końcowego usługi, a nie z podpowiedzi wyłącznie TXT, takich jak `lanHost` czy `tailnetDns`.
- W `local.` mDNS `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort` także tam pozostaje opcjonalny.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
