---
read_when:
    - Parowanie węzłów iOS/Android z Gateway
    - Używanie kanwy/kamery Node jako contextu agenta
    - Dodawanie nowych poleceń Node lub pomocników CLI
summary: 'Węzły: parowanie, możliwości, uprawnienia i pomocnicze narzędzia CLI dla płótna/kamery/ekranu/urządzenia/powiadomień/systemu'
title: Węzły
x-i18n:
    generated_at: "2026-04-30T10:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

**Node** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z WebSocket Gateway (ten sam port co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [protokół Gateway](/pl/gateway/protocol).

Starszy transport: [protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
tylko historycznie dla obecnych nodów).

macOS może też działać w **trybie node**: aplikacja na pasku menu łączy się z serwerem
WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako node (dzięki czemu
`openclaw nodes …` działa względem tego Maca). W trybie zdalnego gatewaya automatyzacja
przeglądarki jest obsługiwana przez host node CLI (`openclaw node run` albo
zainstalowaną usługę node), a nie przez node aplikacji natywnej.

Uwagi:

- Nody są **peryferiami**, nie gatewayami. Nie uruchamiają usługi gatewaya.
- Wiadomości Telegram/WhatsApp/itp. trafiają do **gatewaya**, nie do nodów.
- Runbook rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Nody WS używają parowania urządzeń.** Nody przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (albo UI).

Szybkie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli node ponawia próbę ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie jest zastępowane i tworzony jest nowy `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza node jako **sparowany**, gdy jego rola parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałym kontraktem zatwierdzonej roli. Rotacja tokenów
  pozostaje w ramach tego kontraktu; nie może podnieść sparowanego node do
  innej roli, której zatwierdzenie parowania nigdy nie nadało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) to osobny, należący do gatewaya
  magazyn parowania nodów; **nie** bramkuje uzgadniania WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` usuwa nieaktualne wpisy z tego
  osobnego, należącego do gatewaya magazynu parowania nodów.
- Zakres zatwierdzenia wynika z poleceń zadeklarowanych przez oczekujące żądanie:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia node inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host node (system.run)

Użyj **hosta node**, gdy Gateway działa na jednej maszynie, a chcesz, aby polecenia
wykonywały się na innej. Model nadal rozmawia z **gatewayem**; gateway
przekazuje wywołania `exec` do **hosta node**, gdy wybrano `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host node**: wykonuje `system.run`/`system.which` na maszynie node.
- **Zatwierdzenia**: egzekwowane na hoście node przez `~/.openclaw/exec-approvals.json`.

Uwaga o zatwierdzeniach:

- Uruchomienia node oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań plików powłoki/runtime OpenClaw dodatkowo, w miarę możliwości, wiąże jeden konkretny lokalny
  operand pliku i odmawia uruchomienia, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może wskazać dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime,
  wykonanie oparte na zatwierdzeniu jest odmawiane zamiast udawać pełne pokrycie runtime. Użyj sandboxingu,
  osobnych hostów albo jawnej zaufanej listy allowlist/pełnego workflow dla szerszej semantyki interpretera.

### Uruchom host node (pierwszy plan)

Na maszynie node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny gateway przez tunel SSH (powiązanie loopback)

Jeśli Gateway wiąże się z loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym),
zdalne hosty node nie mogą połączyć się bezpośrednio. Utwórz tunel SSH i skieruj
host node na lokalny koniec tunelu.

Przykład (host node -> host gateway):

```bash
# Terminal A (pozostaw uruchomiony): przekieruj lokalne 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportuj token gatewaya i połącz się przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem albo hasłem.
- Preferowane są zmienne środowiskowe: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfiguracji to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami pierwszeństwa zdalnego.
- Jeśli aktywne lokalne SecretRefs `gateway.auth.*` są skonfigurowane, ale nierozwiązane, uwierzytelnianie hosta node kończy się bezpieczną odmową.
- Rozwiązywanie uwierzytelniania hosta node honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

### Uruchom host node (usługa)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Sparuj + nazwij

Na hoście gatewaya:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli node ponawia próbę ze zmienionymi szczegółami uwierzytelniania, uruchom ponownie `openclaw devices list`
i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane w `~/.openclaw/node.json` na node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie gatewaya).

### Dodaj polecenia do allowlist

Zatwierdzenia exec są **per host node**. Dodaj wpisy allowlist z gatewaya:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia znajdują się na hoście node w `~/.openclaw/exec-approvals.json`.

### Skieruj exec na node

Skonfiguruj domyślne wartości (konfiguracja gatewaya):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Albo dla sesji:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście node (z zastrzeżeniem
allowlist/zatwierdzeń node).

`host=auto` nie wybierze domyślnie node samodzielnie, ale jawne żądanie `host=node` dla pojedynczego wywołania jest dozwolone z `auto`. Jeśli chcesz, aby exec na node był domyślny dla sesji, ustaw jawnie `tools.exec.host=node` albo `/exec host=node ...`.

Powiązane:

- [CLI hosta node](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Wywoływanie poleceń

Niski poziom (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją pomocnicze narzędzia wyższego poziomu dla typowych workflow „przekaż agentowi załącznik MEDIA”.

## Polityka poleceń

Polecenia node muszą przejść dwie bramki, zanim mogą zostać wywołane:

1. Node musi zadeklarować polecenie na swojej liście WebSocket `connect.commands`.
2. Polityka platformy gatewaya musi zezwalać na zadeklarowane polecenie.

Towarzyszące nody Windows i macOS domyślnie zezwalają na bezpieczne zadeklarowane polecenia, takie jak
`canvas.*`, `camera.list`, `location.get` i `screen.snapshot`.
Niebezpieczne albo mocno związane z prywatnością polecenia, takie jak `camera.snap`, `camera.clip` i
`screen.record`, nadal wymagają jawnego włączenia przez
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` zawsze wygrywa z
domyślnymi wartościami i dodatkowymi wpisami allowlist.

Polecenia node należące do Plugin mogą dodać politykę node-invoke Gateway. Ta polityka
działa po sprawdzeniu allowlist i przed przekazaniem do node, więc surowe
`node.invoke`, pomocniki CLI i dedykowane narzędzia agentów współdzielą tę samą granicę
uprawnień Plugin. Niebezpieczne polecenia node Plugin nadal wymagają jawnego
włączenia przez `gateway.nodes.allowCommands`.

Po zmianie listy zadeklarowanych poleceń przez node odrzuć stare parowanie urządzenia
i zatwierdź nowe żądanie, aby gateway zapisał zaktualizowaną migawkę poleceń.

## Zrzuty ekranu (migawki canvas)

Jeśli node wyświetla Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Pomocnik CLI (zapisuje do pliku tymczasowego i wypisuje `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Elementy sterujące Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Uwagi:

- `canvas present` akceptuje adresy URL albo lokalne ścieżki plików (`--target`), plus opcjonalne `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` akceptuje wbudowany JS (`--js`) albo argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Obsługiwany jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).

## Zdjęcia + filmy (kamera node)

Zdjęcia (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Klipy wideo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Uwagi:

- Node musi być **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych payloadów base64.
- Android wyświetli prośbę o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy to możliwe; odmowa uprawnień kończy się błędem `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (nody)

Obsługiwane nody udostępniają `screen.record` (mp4). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy node.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać wyświetlacz, gdy dostępnych jest wiele ekranów.

## Lokalizacja (nody)

Nody udostępniają `location.get`, gdy Lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- „Zawsze” wymaga uprawnień systemowych; pobieranie w tle działa w miarę możliwości.
- Odpowiedź zawiera lat/lon, dokładność (metry) oraz znacznik czasu.

## SMS (nody Android)

Nody Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Wywołanie niskiego poziomu:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Monit o uprawnienia musi zostać zaakceptowany na urządzeniu Android, zanim capability zostanie ogłoszona.
- Urządzenia tylko Wi-Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobistych

Nody Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiednie capability są włączone.

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

- Polecenia ruchu są ograniczane dostępnością funkcji przez dostępne sensory.

## Polecenia systemowe (host Node / Node Mac)

Node macOS udostępnia `system.run`, `system.notify` oraz `system.execApprovals.get/set`.
Bezinterfejsowy host Node udostępnia `system.run`, `system.which` oraz `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonywanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje bezpośrednią powierzchnią RPC dla jawnych poleceń Node.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one tylko na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Po
  udzieleniu zgody gateway przekazuje ten zapisany plan, a nie później
  edytowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnień do powiadomień w aplikacji macOS.
- Nierozpoznane metadane Node `platform` / `deviceFamily` używają konserwatywnej domyślnej listy dozwolonych poleceń, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` oraz `--needs-screen-recording`.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` ograniczone do żądania są redukowane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji zawsze zezwalających w trybie listy dozwolonych znane wrappery uruchamiania (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek wrapperów. Jeśli odpakowanie wrappera nie jest bezpieczne, żaden wpis listy dozwolonych nie jest automatycznie utrwalany.
- Na hostach Node Windows w trybie listy dozwolonych uruchomienia wrappera powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis listy dozwolonych nie zezwala automatycznie na tę formę wrappera).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty Node ignorują nadpisania `PATH` i usuwają niebezpieczne klucze uruchomieniowe/powłoki (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta Node (lub zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie Node macOS `system.run` jest ograniczane zatwierdzeniami exec w aplikacji macOS (Ustawienia → Zatwierdzenia exec).
  Ask/allowlist/full działają tak samo jak bezinterfejsowy host Node; odrzucone monity zwracają `SYSTEM_RUN_DENIED`.
- Na bezinterfejsowym hoście Node `system.run` jest ograniczane zatwierdzeniami exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie Node exec

Gdy dostępnych jest wiele Node, możesz powiązać exec z konkretnym Node.
Ustawia to domyślny Node dla `exec host=node` (i może zostać nadpisane dla danego agenta).

Domyślne globalne:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie dla agenta:

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

Node mogą zawierać mapę `permissions` w `node.list` / `node.describe`, indeksowaną nazwą uprawnienia (np. `screenRecording`, `accessibility`) z wartościami logicznymi (`true` = przyznane).

## Bezinterfejsowy host Node (wieloplatformowy)

OpenClaw może uruchamiać **bezinterfejsowy host Node** (bez UI), który łączy się z Gateway
WebSocket i udostępnia `system.run` / `system.which`. Jest to przydatne na Linux/Windows
lub do uruchamiania minimalnego Node obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie jest nadal wymagane (Gateway pokaże monit parowania urządzenia).
- Host Node przechowuje swój identyfikator Node, token, nazwę wyświetlaną i informacje o połączeniu z gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są wymuszane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- Na macOS bezinterfejsowy host Node domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i zakończyć niepowodzeniem w trybie zamkniętym, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb Node Mac

- Aplikacja paska menu macOS łączy się z serwerem Gateway WS jako Node (więc `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
