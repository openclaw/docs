---
read_when:
    - Uruchamianie Gateway z CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie gatewayów przez Bonjour (lokalne + rozległe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, haki). Podkomendy na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS + rozległego DNS-SD.
  </Card>
  <Card title="Omówienie wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza i znajduje bramy.
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
    - Domyślnie Gateway odmawia uruchomienia, chyba że `gateway.mode=local` jest ustawione w `~/.openclaw/openclaw.json`. Użyj `--allow-unconfigured` do doraźnych/deweloperskich uruchomień.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, potraktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją, zamiast domyślnie zakładać tryb lokalny.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za ciebie.
    - Wiązanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
    - `lan`, `tailnet` i `custom` obecnie rozwiązywane są przez ścieżki BYOH wyłącznie IPv4.
    - BYOH wyłącznie IPv6 nie jest dziś natywnie obsługiwane na tej ścieżce. Użyj sidecara IPv4 lub proxy, jeśli sam host obsługuje tylko IPv6.
    - `SIGUSR1` wyzwala restart w procesie, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy narzędzia Gateway i zastosowanie/aktualizacja konfiguracji pozostaną dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces Gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI przy użyciu TUI lub wejścia w trybie raw, przywróć terminal przed wyjściem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (domyślnie pochodzi z konfiguracji/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb wiązania listenera. `lan`, `tailnet` i `custom` obecnie rozwiązywane są przez ścieżki wyłącznie IPv4.
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
  Odczytaj hasło Gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację Tailscale serve/funnel przy zamykaniu.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Dziś oczekuje adresu IPv4. Dla BYOH wyłącznie IPv6 umieść sidecar IPv4 lub proxy przed Gateway i skieruj OpenClaw na ten punkt końcowy IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na start Gateway bez `gateway.mode=local` w konfiguracji. Omija zabezpieczenie uruchamiania tylko dla doraźnego/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską + poświadczenia + sesje + workspace (wymaga `--dev`).
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
  Ścieżka jsonl surowego strumienia.
</ParamField>

## Restart Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` prosi działający Gateway o sprawdzenie aktywnej pracy OpenClaw przed restartem. Jeśli aktywne są operacje w kolejce, dostarczanie odpowiedzi, osadzone uruchomienia lub uruchomienia zadań, Gateway zgłasza blokady, scala zduplikowane żądania bezpiecznego restartu i restartuje się po opróżnieniu aktywnej pracy. Zwykłe `restart` zachowuje istniejące zachowanie menedżera usług dla zgodności. Używaj `--force` tylko wtedy, gdy wyraźnie chcesz natychmiastowej ścieżki nadpisania.

`openclaw gateway restart --safe --skip-deferral` uruchamia ten sam skoordynowany restart świadomy OpenClaw co `--safe`, ale omija bramkę odroczenia aktywnej pracy, więc Gateway emituje restart natychmiast nawet wtedy, gdy zgłoszono blokady. Użyj tego jako wyjścia awaryjnego operatora, gdy odroczenie zostało przytrzymane przez zablokowane uruchomienie zadania, a samo `--safe` czekałoby bez końca. `--skip-deferral` wymaga `--safe`.

<Warning>
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, env albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie Gateway

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania Plugin dla installed-index, rejestru manifestów, planowania uruchamiania i pracy owner-map.
- Ustaw `OPENCLAW_GATEWAY_RESTART_TRACE=1`, aby logować linie `restart trace:` ograniczone do restartu dla obsługi sygnału restartu, opróżniania aktywnej pracy, faz zamykania, następnego startu, czasu gotowości i metryk pamięci.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki uruchamiania JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest podawana przez env. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Najpierw uruchom `pnpm build`, a potem `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby zbenchmarkować uruchamianie Gateway względem zbudowanego wejścia CLI. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy trace uruchamiania, opóźnienie pętli zdarzeń i szczegóły czasów tabel wyszukiwania Plugin.
- Najpierw uruchom `pnpm build`, a potem `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, aby zbenchmarkować restart Gateway w procesie względem zbudowanego wejścia CLI na macOS lub Linux. Benchmark restartu używa SIGUSR1, włącza zarówno trace uruchamiania, jak i restartu w procesie potomnym oraz rejestruje następne `/healthz`, następne `/readyz`, przestój, czas gotowości, CPU, RSS i metryki trace restartu.
- Traktuj `/healthz` jako żywotność, a `/readyz` jako gotowość do użycia. Linie trace i wynik benchmarku służą do przypisania właściciela; nie traktuj jednego zakresu trace ani jednej próbki jako pełnego wniosku o wydajności.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają RPC WebSocket.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ czytelny dla człowieka.

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
Gdy ustawisz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Punkt końcowy HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Punkt końcowy HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki sidecary Plugin uruchamiania, kanały lub skonfigurowane haki nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości obejmują blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, stosunkiem rdzeni CPU i flagą `degraded`.

<ParamField path="--port <port>" type="number">
  Celuj w local loopback Gateway na tym porcie. Nadpisuje to `OPENCLAW_GATEWAY_URL` i `OPENCLAW_GATEWAY_PORT` dla wywołania health.
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
  Liczba dni do uwzględnienia.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Ogranicz podsumowanie kosztów do jednego skonfigurowanego identyfikatora agenta.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agreguj podsumowanie kosztów ze wszystkich skonfigurowanych agentów. Nie można łączyć z `--agent`.
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
  <Accordion title="Prywatność i zachowanie pakietu">
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Plugin i zredagowane podsumowania sesji. Nie zachowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, ciasteczek, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i niepowodzeniach uruchamiania po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet za pomocą `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają też zastosowanie do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny zip diagnostyki przeznaczony do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisuje [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa zip. Domyślnie jest to eksport wsparcia w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych wierszy dziennika do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów dziennika do sprawdzenia.
</ParamField>
<ParamField path="--url <url>" type="string">
  Adres URL WebSocket Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki kondycji.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Limit czasu migawki statusu/kondycji.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania dzienników, oczyszczone migawki statusu/kondycji Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomocne przy debugowaniu, takie jak bezpieczne pola dzienników OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory Plugin, identyfikatory dostawców, nietajne ustawienia funkcji oraz zredagowane operacyjne komunikaty dziennika. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, poświadczenia, pliki cookie, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości tajne. Gdy komunikat w stylu LogTape wygląda jak tekst ładunku użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną próbę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel próby. Skonfigurowane zdalne miejsce docelowe i localhost nadal są sprawdzane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla próby.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla próby.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Limit czasu próby.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń próbę łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Przeskanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Podnieś domyślną próbę łączności do próby odczytu i zakończ z niezerowym kodem, gdy ta próba odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest brakująca lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz możliwość uwierzytelniania widoczną w czasie uzgadniania. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Próby diagnostyczne nie mutują uwierzytelniania urządzenia przy pierwszym użyciu: używają istniejącego tokenu urządzenia z pamięci podręcznej, jeśli taki istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić status.
    - `gateway status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania próby, gdy to możliwe.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie próby się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli próba się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są tłumione, aby uniknąć wyników fałszywie dodatnich.
    - Gdy próbkowanie jest włączone, wyjście JSON zawiera `gateway.version`, jeśli uruchomiony Gateway je zgłasza; `--require-rpc` może wrócić do ładunku RPC `status.runtimeVersion`, jeśli kolejna próba uzgadniania nie może dostarczyć metadanych wersji.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i potrzebujesz także sprawnych wywołań RPC z zakresem odczytu.
    - `--deep` dodaje best-effort skanowanie dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wyjście dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden gateway na maszynę.
    - `--deep` zgłasza także niedawne przekazanie restartu nadzorcy Gateway, gdy proces usługi zakończył się czysto na potrzeby restartu przez zewnętrznego nadzorcę.
    - `--deep` uruchamia walidację konfiguracji w trybie świadomym Plugin (`pluginValidation: "full"`) i pokazuje ostrzeżenia skonfigurowanego manifestu Plugin (na przykład brak metadanych konfiguracji kanału), aby kontrole smoke instalacji i aktualizacji je wykrywały. Domyślne `gateway status` zachowuje szybką ścieżkę tylko do odczytu, która pomija walidację Plugin.
    - Wyjście dla człowieka zawiera rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek/poprawności konfiguracji CLI względem usługi, aby ułatwić diagnozowanie rozjazdu profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole dryfu uwierzytelniania Linux systemd">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania odczytują z unitu zarówno wartości `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików i opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska wykonawczego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` równy `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdy hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sprawdza:

- skonfigurowany zdalny gateway (jeśli ustawiony), oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalny**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wyjście dla człowieka etykietuje cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli wiele celów próby jest osiągalnych, wypisuje je wszystkie. Tunel SSH, adres URL TLS/proxy i skonfigurowany zdalny adres URL mogą wszystkie wskazywać na ten sam gateway nawet wtedy, gdy ich porty transportowe się różnią; `multiple_gateways` jest zarezerwowane dla odrębnych lub niejednoznacznych tożsamościowo osiągalnych gatewayów. Wiele gatewayów jest obsługiwanych, gdy używasz izolowanych profili (np. bota ratunkowego), ale większość instalacji nadal uruchamia pojedynczy gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Użyj tego portu dla celu próby local loopback i zdalnego portu tunelu SSH. Bez `--url` wybiera to cel local loopback zamiast skonfigurowanego adresu URL środowiska Gateway, portu środowiska lub celów zdalnych.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co próba mogła potwierdzić o uwierzytelnianiu. Jest to niezależne od osiągalności.
    - `Read probe: ok` oznacza, że szczegółowe wywołania RPC z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale kolejne diagnostyki odczytu przekroczyły limit czasu lub się nie powiodły. To również jest **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, próba używa istniejącego uwierzytelniania urządzenia z pamięci podręcznej, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sprawdzany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wyjście JSON">
    Najwyższy poziom:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej szczegółowej diagnostyki RPC.
    - `capability`: najlepsza możliwość widziana we wszystkich osiągalnych celach (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywnego zwycięzcę w tej kolejności: jawny adres URL, tunel SSH, skonfigurowany zdalny, potem local loopback.
    - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnymi `targetIds`.
    - `network`: podpowiedzi adresów URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: faktyczny budżet wykrywania/liczba wyników użyte w tym przebiegu próby.

    Na cel (`targets[].connect`):

    - `ok`: osiągalność po klasyfikacji połączenia i degradacji.
    - `rpcOk`: pełny sukces szczegółowego RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu brakującego zakresu operatora.

    Na cel (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: ujawniona klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich prób.
    - `multiple_gateways`: osiągalne były odrębne tożsamości gatewayów albo OpenClaw nie mógł potwierdzić, że osiągalne cele są tym samym gatewayem. Tunel SSH, adres URL proxy lub skonfigurowany zdalny adres URL do tego samego gatewaya nie wyzwala tego ostrzeżenia.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla nieudanego celu.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale próba odczytu została ograniczona przez brakujące `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parytet aplikacji Mac)

Tryb „Remote over SSH” aplikacji macOS używa lokalnego przekierowania portu, aby zdalny gateway (który może być powiązany tylko z loopback) był osiągalny pod `ws://127.0.0.1:<port>`.

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
  Wybierz pierwszy wykryty host gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Podpowiedzi tylko TXT są ignorowane.
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
  Adres URL WebSocket Gateway.
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

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalacja z wrapperem

Użyj `--wrapper`, gdy usługa zarządzana musi zostać uruchomiona przez inny plik wykonywalny, na przykład
shim menedżera sekretów albo pomocnika run-as. Wrapper otrzymuje normalne argumenty Gateway i jest
odpowiedzialny za ostateczne wykonanie przez exec `openclaw` albo Node z tymi argumentami.

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

Możesz też ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest
plikiem wykonywalnym, zapisuje wrapper w `ProgramArguments` usługi i utrwala
`OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych ponownych instalacji, aktualizacji i napraw
przez doctor.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Użyj `gateway restart`, aby ponownie uruchomić usługę zarządzaną. Nie łącz `gateway stop` i `gateway start` jako zamiennika restartu.
    - W macOS `gateway stop` domyślnie używa `launchctl bootout`, co usuwa LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączenia — automatyczne odzyskiwanie KeepAlive pozostaje aktywne dla przyszłych awarii, a `gateway start` ponownie włącza usługę czysto, bez ręcznego `launchctl enable`. Przekaż `--disable`, aby trwale wyłączyć KeepAlive i RunAtLoad, tak aby Gateway nie odradzał się do następnego jawnego `gateway start`; użyj tego, gdy ręczne zatrzymanie ma przetrwać ponowne uruchomienia komputera albo systemu.
    - `gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw i odroczenie restartu, aż dostarczanie odpowiedzi, osadzone uruchomienia i uruchomienia zadań zostaną opróżnione. `--safe` nie można łączyć z `--force` ani `--wait`.
    - `gateway restart --wait 30s` nadpisuje skonfigurowany budżet opróżniania przed restartem dla tego restartu. Same liczby oznaczają milisekundy; akceptowane są jednostki takie jak `s`, `m` i `h`. `--wait 0` czeka bezterminowo.
    - `gateway restart --safe --skip-deferral` uruchamia bezpieczny restart świadomy OpenClaw, ale omija bramkę odroczenia, więc Gateway emituje restart natychmiast, nawet gdy zgłoszono blokady. Jest to awaryjne wyjście operatora dla odroczeń zablokowanych uruchomień zadań; wymaga `--safe`.
    - `gateway restart --force` pomija opróżnianie aktywnej pracy i restartuje natychmiast. Użyj tego, gdy operator już sprawdził wymienione blokady zadań i chce teraz przywrócić Gateway.
    - Polecenia cyklu życia akceptują `--json` na potrzeby skryptów.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się błędem w trybie fail-closed zamiast utrwalać awaryjny tekst jawny.
    - Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` albo `gateway.auth.password` oparte na SecretRef zamiast wbudowanego `--password`.
    - W wywnioskowanym trybie uwierzytelniania ustawione tylko w powłoce `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań tokenu podczas instalacji; przy instalowaniu usługi zarządzanej użyj trwałej konfiguracji (`gateway.auth.password` albo konfiguracji `env`).
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja zostanie zablokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko bramy z włączonym wykrywaniem Bonjour (domyślnie) ogłaszają beacon.

Rekordy wykrywania wide-area mogą zawierać następujące wskazówki TXT:

- `role` (wskazówka roli Gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (tylko pełny tryb wykrywania; klienci domyślnie używają `22` jako celu SSH, gdy go nie ma)
- `tailnetDns` (nazwa hosta MagicDNS, gdy jest dostępna)
- `gatewayTls` / `gatewayTlsSha256` (TLS włączony + odcisk certyfikatu)
- `cliPath` (tylko pełny tryb wykrywania)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (przeglądanie/rozwiązywanie).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo (wyłącza też stylowanie/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę wide-area, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON pochodzi z rozwiązanego punktu końcowego usługi, a nie z samych wskazówek TXT, takich jak `lanHost` czy `tailnetDns`.
- W `local.` mDNS i wide-area DNS-SD `sshPort` oraz `cliPath` są publikowane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
