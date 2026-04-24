---
read_when:
    - Parowanie Node iOS/Android z gateway
    - Używanie canvas/kamery Node do kontekstu agenta
    - Dodawanie nowych poleceń Node lub pomocników CLI
summary: 'Node: parowanie, możliwości, uprawnienia i pomocniki CLI dla canvas/kamery/ekranu/urządzenia/powiadomień/systemu'
title: Node
x-i18n:
    generated_at: "2026-04-24T09:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Node to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z Gateway **WebSocket** (ten sam port co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

Starszy transport: [Protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
wyłącznie historyczny dla bieżących Node).

macOS może też działać w **trybie node**: aplikacja na pasku menu łączy się z serwerem WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako Node (dzięki czemu `openclaw nodes …` działa względem tego Maca).

Uwagi:

- Node to **urządzenia peryferyjne**, a nie gateway. Nie uruchamiają usługi gateway.
- Wiadomości Telegram/WhatsApp itd. trafiają do **gateway**, a nie do Node.
- Instrukcja rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Node WS używają parowania urządzenia.** Node przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (albo UI).

Szybkie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli Node ponowi próbę ze zmienionymi danymi auth (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza Node jako **paired**, gdy rola jego parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałym kontraktem zatwierdzonej roli. Rotacja
  tokenu pozostaje wewnątrz tego kontraktu; nie może podnieść sparowanego Node do
  innej roli, której zatwierdzenie parowania nigdy nie przyznało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) to oddzielny magazyn parowania Node zarządzany przez gateway;
  **nie** steruje handshake WS `connect`.
- Zakres zatwierdzenia zależy od zadeklarowanych poleceń w oczekującym żądaniu:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia Node bez exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host Node (`system.run`)

Użyj **hosta Node**, gdy twoje Gateway działa na jednej maszynie, a chcesz, aby polecenia
wykonywały się na innej. Model nadal rozmawia z **gateway**; gateway
przekazuje wywołania `exec` do **hosta Node**, gdy wybrano `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host Node**: wykonuje `system.run`/`system.which` na maszynie Node.
- **Zatwierdzenia**: egzekwowane na hoście Node przez `~/.openclaw/exec-approvals.json`.

Uwaga o zatwierdzeniach:

- Przebiegi Node oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań powłoki/pliku runtime OpenClaw dodatkowo best-effort wiąże jeden konkretny lokalny
  operand pliku i odrzuca wykonanie, jeśli ten plik zmieni się przed uruchomieniem.
- Jeśli OpenClaw nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime,
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast udawać pełne pokrycie runtime. Użyj sandboxingu,
  oddzielnych hostów albo jawnej zaufanej allowlisty/pełnego workflow dla szerszej semantyki interpreterów.

### Uruchom hosta Node (pierwszy plan)

Na maszynie Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalne gateway przez tunel SSH (powiązanie loopback)

Jeśli Gateway wiąże się do loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym),
zdalne hosty Node nie mogą połączyć się bezpośrednio. Utwórz tunel SSH i skieruj
host Node na lokalny koniec tunelu.

Przykład (host Node -> host gateway):

```bash
# Terminal A (pozostaw uruchomiony): przekieruj lokalny 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportuj token gateway i połącz przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje auth tokenem albo hasłem.
- Preferowane są zmienne środowiskowe: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback z konfiguracji to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami priorytetu zdalnego.
- Jeśli skonfigurowane są aktywne lokalne SecretRef `gateway.auth.*`, ale nie da się ich rozwiązać, auth hosta Node bezpiecznie kończy się odmową.
- Rozwiązywanie auth hosta Node honoruje tylko zmienne env `OPENCLAW_GATEWAY_*`.

### Uruchom hosta Node (usługa)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Sparuj + nazwij

Na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli Node ponowi próbę ze zmienionymi danymi auth, uruchom ponownie `openclaw devices list`
i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane w `~/.openclaw/node.json` na Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie gateway).

### Dodaj polecenia do allowlisty

Zatwierdzenia exec są **per host Node**. Dodawaj wpisy allowlisty z gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia znajdują się na hoście Node w `~/.openclaw/exec-approvals.json`.

### Skieruj exec na Node

Skonfiguruj wartości domyślne (konfiguracja gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Albo per sesja:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście Node (z zastrzeżeniem
allowlisty/zatwierdzeń Node).

`host=auto` nie wybierze niejawnie Node sam z siebie, ale jawne żądanie `host=node` per wywołanie jest dozwolone z `auto`. Jeśli chcesz, aby exec na Node był domyślny dla sesji, ustaw `tools.exec.host=node` albo `/exec host=node ...` jawnie.

Powiązane:

- [CLI hosta Node](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Wywoływanie poleceń

Niski poziom (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją też pomocniki wyższego poziomu dla typowych przepływów „daj agentowi załącznik MEDIA”.

## Zrzuty ekranu (snapshoty canvas)

Jeśli Node pokazuje Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Pomocnik CLI (zapisuje do pliku tymczasowego i wypisuje `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Sterowanie Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Uwagi:

- `canvas present` akceptuje URL-e albo lokalne ścieżki plików (`--target`), plus opcjonalne `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` akceptuje inline JS (`--js`) albo argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Obsługiwany jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).

## Zdjęcia + wideo (kamera Node)

Zdjęcia (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # domyślnie: obie strony (2 linie MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Klipy wideo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Uwagi:

- Node musi być **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Czas klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków base64.
- Android w miarę możliwości wyświetli prośbę o uprawnienia `CAMERA`/`RECORD_AUDIO`; odrzucone uprawnienia kończą się błędem `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (Node)

Obsługiwane Node udostępniają `screen.record` (`mp4`). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy Node.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać wyświetlacz, gdy dostępnych jest wiele ekranów.

## Lokalizacja (Node)

Node udostępniają `location.get`, gdy Lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- Tryb „Always” wymaga uprawnień systemowych; pobieranie w tle działa best-effort.
- Odpowiedź zawiera lat/lon, dokładność (metry) i znacznik czasu.

## SMS (Node Android)

Node Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Wywołanie niskiego poziomu:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Monit o uprawnienie musi zostać zaakceptowany na urządzeniu Android, zanim możliwość zostanie ogłoszona.
- Urządzenia tylko z Wi‑Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobowych

Node Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiednie możliwości są włączone.

Dostępne rodziny:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Przykładowe wywołania:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Uwagi:

- Polecenia motion są ograniczane przez możliwości dostępnych sensorów.

## Polecenia systemowe (host Node / mac node)

Node macOS udostępnia `system.run`, `system.notify` i `system.execApprovals.get/set`.
Host Node headless udostępnia `system.run`, `system.which` i `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje powierzchnią bezpośredniego RPC dla jawnych poleceń Node.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one wyłącznie na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Gdy
  zatwierdzenie zostanie przyznane, gateway przekazuje ten zapisany plan, a nie później
  edytowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnień do powiadomień w aplikacji macOS.
- Nierozpoznane metadane `platform` / `deviceFamily` Node używają zachowawczej domyślnej allowlisty, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` ograniczone do zakresu żądania są redukowane do jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlisty znane wrappery dyspozycji (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek wrapperów. Jeśli bezpieczne rozpakowanie nie jest możliwe, żaden wpis allowlisty nie jest automatycznie utrwalany.
- Na hostach Windows Node w trybie allowlisty uruchomienia wrapperów powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis allowlisty nie daje automatycznego zezwolenia dla formy wrappera).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty Node ignorują nadpisania `PATH` i usuwają niebezpieczne klucze startowe/powłoki (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta Node (albo zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie mac node `system.run` jest ograniczane przez zatwierdzenia exec w aplikacji macOS (Settings → Exec approvals).
  Ask/allowlist/full zachowują się tak samo jak headless host Node; odrzucone prompty zwracają `SYSTEM_RUN_DENIED`.
- Na headless hoście Node `system.run` jest ograniczane przez zatwierdzenia exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie exec z Node

Gdy dostępnych jest wiele Node, możesz powiązać exec z konkretnym Node.
Ustawia to domyślny Node dla `exec host=node` (i może być nadpisane per agent).

Globalna wartość domyślna:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie per agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa uprawnień

Node mogą zawierać mapę `permissions` w `node.list` / `node.describe`, kluczowaną nazwą uprawnienia (np. `screenRecording`, `accessibility`) z wartościami logicznymi (`true` = przyznane).

## Headless host Node (wieloplatformowy)

OpenClaw może uruchamiać **headless host Node** (bez UI), który łączy się z Gateway
WebSocket i udostępnia `system.run` / `system.which`. Jest to przydatne na Linux/Windows
albo do uruchamiania minimalnego Node obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie jest nadal wymagane (Gateway pokaże prompt parowania urządzenia).
- Host Node przechowuje swój identyfikator Node, token, nazwę wyświetlaną i informacje o połączeniu gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są egzekwowane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- Na macOS headless host Node domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i bezpiecznie zakończyć odmową, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb mac node

- Aplikacja macOS na pasku menu łączy się z serwerem Gateway WS jako Node (dzięki czemu `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
