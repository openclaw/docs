---
read_when:
    - Parowanie węzłów iOS/Android z gateway
    - Używanie canvas/camera węzła jako kontekstu dla agenta
    - Dodawanie nowych poleceń węzłów lub pomocników CLI
summary: 'Nodes: parowanie, możliwości, uprawnienia i pomocniki CLI dla canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-05T13:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodes

**Node** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z Gateway **WebSocket** (tym samym portem co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [Gateway protocol](/gateway/protocol).

Starszy transport: [Bridge protocol](/gateway/bridge-protocol) (TCP JSONL;
wyłącznie historyczny dla obecnych węzłów).

macOS może również działać w **trybie node**: aplikacja w pasku menu łączy się z serwerem WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako węzeł (więc `openclaw nodes …` działa względem tego Maca).

Uwagi:

- Nodes to **urządzenia peryferyjne**, a nie gateway. Nie uruchamiają usługi gateway.
- Wiadomości Telegram/WhatsApp/etc. trafiają do **gateway**, a nie do nodes.
- Procedura rozwiązywania problemów: [/nodes/troubleshooting](/nodes/troubleshooting)

## Parowanie + status

**Węzły WS używają parowania urządzeń.** Węzły przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź je przez CLI devices (lub UI).

Szybkie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli węzeł ponowi próbę z innymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza węzeł jako **paired**, gdy jego rola w parowaniu urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałą umową zatwierdzonej roli. Rotacja
  tokena pozostaje w granicach tej umowy; nie może podnieść sparowanego węzła do
  innej roli, której zatwierdzenie parowania nigdy nie przyznało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) to osobny magazyn
  parowania węzłów należący do gateway; **nie** kontroluje on handshake `connect` dla WS.
- Zakres zatwierdzenia podąża za zadeklarowanymi poleceniami oczekującego żądania:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia węzła inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host node (`system.run`)

Użyj **hosta node**, gdy Gateway działa na jednym komputerze, a polecenia
mają być wykonywane na innym. Model nadal komunikuje się z **gateway**; gateway
przekazuje wywołania `exec` do **hosta node**, gdy wybrane jest `host=node`.

### Co działa gdzie

- **Host gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host node**: wykonuje `system.run`/`system.which` na komputerze węzła.
- **Approvals**: egzekwowane na hoście node przez `~/.openclaw/exec-approvals.json`.

Uwaga dotycząca zatwierdzeń:

- Uruchomienia node oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań plików powłoki/runtime OpenClaw dodatkowo w trybie best-effort wiąże jeden konkretny lokalny
  operand pliku i odrzuca uruchomienie, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpreter/runtime,
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast udawać pełne pokrycie runtime. Użyj sandboxingu,
  osobnych hostów albo jawnej zaufanej listy dozwolonych/pełnego workflow dla szerszej semantyki interpreterów.

### Uruchom hosta node (na pierwszym planie)

Na komputerze węzła:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny gateway przez tunel SSH (bind loopback)

Jeśli Gateway jest związany z loopback (`gateway.bind=loopback`, domyślnie w trybie local),
zdalne hosty node nie mogą połączyć się bezpośrednio. Utwórz tunel SSH i skieruj
hosta node na lokalny koniec tunelu.

Przykład (host node -> host gateway):

```bash
# Terminal A (pozostaw uruchomiony): przekieruj lokalny 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportuj token gateway i połącz się przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem lub hasłem.
- Preferowane są zmienne env: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Zapasowa konfiguracja to `gateway.auth.token` / `gateway.auth.password`.
- W trybie local host node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie remote `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami pierwszeństwa dla remote.
- Jeśli aktywne lokalne SecretRef `gateway.auth.*` są skonfigurowane, ale nierozwiązane, uwierzytelnianie hosta node kończy się fail-closed.
- Rozwiązywanie uwierzytelniania hosta node uwzględnia tylko zmienne env `OPENCLAW_GATEWAY_*`.

### Uruchom hosta node (jako usługę)

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

Jeśli węzeł ponowi próbę z innymi szczegółami uwierzytelniania, uruchom ponownie `openclaw devices list`
i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane w `~/.openclaw/node.json` na węźle).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie gateway).

### Dodaj polecenia do listy dozwolonych

Exec approvals są **per host node**. Dodaj wpisy listy dozwolonych z gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Approvals znajdują się na hoście node w `~/.openclaw/exec-approvals.json`.

### Skieruj exec do node

Skonfiguruj wartości domyślne (konfiguracja gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Lub per sesja:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście node (z zastrzeżeniem
listy dozwolonych/approvals hosta node).

`host=auto` sam z siebie nie wybierze niejawnie node, ale jawne żądanie `host=node` per wywołanie jest dozwolone z `auto`. Jeśli chcesz, aby exec na node był wartością domyślną dla sesji, ustaw jawnie `tools.exec.host=node` lub `/exec host=node ...`.

Powiązane:

- [Node host CLI](/cli/node)
- [Narzędzie exec](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## Wywoływanie poleceń

Niskopoziomowo (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją pomocniki wyższego poziomu dla typowych workflow typu „daj agentowi załącznik MEDIA”.

## Zrzuty ekranu (snapshoty canvas)

Jeśli węzeł wyświetla Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

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

- `canvas present` akceptuje URL-e lub lokalne ścieżki plików (`--target`), plus opcjonalne `--x/--y/--width/--height` dla pozycjonowania.
- `canvas eval` akceptuje JS inline (`--js`) lub argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Obsługiwany jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).

## Zdjęcia + wideo (kamera node)

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

- Węzeł musi być **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków base64.
- Android wyświetli prośbę o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy to możliwe; odrzucone uprawnienia kończą się błędem `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (nodes)

Obsługiwane nodes udostępniają `screen.record` (`mp4`). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy node.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać ekran, gdy dostępnych jest wiele ekranów.

## Lokalizacja (nodes)

Nodes udostępniają `location.get`, gdy lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest domyślnie **wyłączona**.
- „Always” wymaga uprawnienia systemowego; pobieranie w tle działa w trybie best-effort.
- Odpowiedź zawiera szer./dł. geograficzną, dokładność (metry) i timestamp.

## SMS (węzły Android)

Węzły Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Niskopoziomowe invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Prompt uprawnień musi zostać zaakceptowany na urządzeniu Android, zanim capability zostanie ogłoszone.
- Urządzenia tylko z Wi‑Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobowych

Węzły Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiednie capabilities są włączone.

Dostępne rodziny:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Przykładowe invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Uwagi:

- Polecenia motion są ograniczane przez capability dostępnych sensorów.

## Polecenia systemowe (host node / mac node)

macOS node udostępnia `system.run`, `system.notify` i `system.execApprovals.get/set`.
Headless node host udostępnia `system.run`, `system.which` i `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje bezpośrednią powierzchnią RPC dla jawnych poleceń node.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one wyłącznie na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Gdy
  zatwierdzenie zostanie przyznane, gateway przekazuje ten zapisany plan, a nie
  później edytowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnienia do powiadomień w aplikacji macOS.
- Nierozpoznane metadane `platform` / `deviceFamily` node używają zachowawczej domyślnej listy dozwolonych poleceń, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` o zakresie żądania są redukowane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlist znane wrappery dispatch (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek wrapperów. Jeśli bezpieczne rozpakowanie nie jest możliwe, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.
- Na hostach node Windows w trybie allowlist uruchomienia wrapperów powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis allowlist nie powoduje automatycznego zezwolenia na formę wrappera).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty node ignorują nadpisania `PATH` i usuwają niebezpieczne klucze uruchomieniowe/powłoki (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta node (lub zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie macOS node `system.run` jest ograniczane przez exec approvals w aplikacji macOS (Settings → Exec approvals).
  Ask/allowlist/full działają tak samo jak w headless node host; odrzucone prompty zwracają `SYSTEM_RUN_DENIED`.
- W headless node host `system.run` jest ograniczane przez exec approvals (`~/.openclaw/exec-approvals.json`).

## Powiązanie exec z node

Gdy dostępnych jest wiele nodes, możesz powiązać exec z konkretnym node.
Ustawia to domyślny node dla `exec host=node` (i może zostać nadpisane per agent).

Globalna wartość domyślna:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie per agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa uprawnień

Nodes mogą zawierać mapę `permissions` w `node.list` / `node.describe`, kluczowaną nazwą uprawnienia (np. `screenRecording`, `accessibility`) z wartościami logicznymi (`true` = przyznane).

## Headless node host (wieloplatformowy)

OpenClaw może uruchamiać **headless node host** (bez UI), który łączy się z Gateway
WebSocket i udostępnia `system.run` / `system.which`. Jest to przydatne na Linux/Windows
lub do uruchomienia minimalnego node obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie nadal jest wymagane (Gateway pokaże prompt parowania urządzenia).
- Host node przechowuje swój identyfikator node, token, nazwę wyświetlaną i informacje o połączeniu z gateway w `~/.openclaw/node.json`.
- Exec approvals są egzekwowane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Exec approvals](/tools/exec-approvals)).
- Na macOS headless node host domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez exec host aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i stosować fail-closed, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb mac node

- Aplikacja macOS w pasku menu łączy się z serwerem Gateway WS jako node (więc `openclaw nodes …` działa względem tego Maca).
- W trybie remote aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
