---
read_when:
    - Parowanie węzłów iOS/Android z Gateway
    - Używanie Node canvas/camera jako kontekstu agenta
    - Dodawanie nowych poleceń Node lub pomocników CLI
summary: 'Węzły: parowanie, możliwości, uprawnienia i narzędzia pomocnicze CLI dla canvas/camera/screen/device/notifications/system'
title: Węzły
x-i18n:
    generated_at: "2026-07-03T10:02:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

A **węzeł** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z **WebSocket** Gateway (ten sam port co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [protokół Gateway](/pl/gateway/protocol).

Starszy transport: [protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
wyłącznie historyczny dla obecnych węzłów).

macOS może też działać w **trybie węzła**: aplikacja paska menu łączy się z
serwerem WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako węzeł (dzięki czemu
`openclaw nodes …` działa względem tego Maca). W trybie zdalnego Gateway
automatyzacją przeglądarki zajmuje się host węzła CLI (`openclaw node run` albo
zainstalowana usługa węzła), a nie natywny węzeł aplikacji.

Uwagi:

- Węzły są **urządzeniami peryferyjnymi**, nie bramami. Nie uruchamiają usługi gateway.
- Wiadomości Telegram/WhatsApp/itd. trafiają do **gateway**, nie do węzłów.
- Runbook rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Węzły WS używają parowania urządzeń.** Węzły przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (lub UI).

Szybkie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli węzeł ponawia próbę ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), wcześniejsze
oczekujące żądanie zostaje zastąpione i powstaje nowe `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza węzeł jako **sparowany**, gdy jego rola parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałym kontraktem zatwierdzonej roli. Rotacja tokenów
  pozostaje wewnątrz tego kontraktu; nie może podnieść sparowanego węzła do
  innej roli, której zatwierdzenie parowania nigdy nie przyznało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) to osobny, należący do gateway
  magazyn parowania węzłów; **nie** bramkuje uzgadniania WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` usuwa parowanie węzła. Dla
  węzła opartego na urządzeniu cofa rolę `node` urządzenia w `devices/paired.json`
  i rozłącza sesje tego urządzenia z rolą węzła — urządzenie o mieszanych rolach zachowuje
  swój wiersz i traci tylko rolę `node`, natomiast wiersz urządzenia tylko-węzłowego jest
  usuwany. Czyści też każdy pasujący wpis z osobnego, należącego do gateway
  magazynu parowania węzłów. `operator.pairing` może usuwać nieoperatorskie wiersze węzłów; wywołujący
  z tokenem urządzenia, który cofa własną rolę węzła na urządzeniu o mieszanych rolach,
  dodatkowo potrzebuje `operator.admin`.
- Zakres zatwierdzenia wynika z poleceń zadeklarowanych w oczekującym żądaniu:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia węzła inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host węzła (system.run)

Użyj **hosta węzła**, gdy Gateway działa na jednej maszynie, a polecenia mają
wykonywać się na innej. Model nadal rozmawia z **gateway**; gateway
przekazuje wywołania `exec` do **hosta węzła**, gdy wybrano `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host węzła**: wykonuje `system.run`/`system.which` na maszynie węzła.
- **Zatwierdzenia**: egzekwowane na hoście węzła przez `~/.openclaw/exec-approvals.json`.

Uwaga o zatwierdzeniach:

- Uruchomienia węzła oparte na zatwierdzeniu wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań plików powłoki/środowiska uruchomieniowego OpenClaw próbuje też związać jeden konkretny lokalny
  operand pliku i odmawia uruchomienia, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego,
  wykonanie oparte na zatwierdzeniu jest odmawiane zamiast udawać pełne pokrycie środowiska uruchomieniowego. Użyj sandboxingu,
  osobnych hostów albo jawnej zaufanej listy dozwolonych/pełnego workflow dla szerszej semantyki interpretera.

### Uruchom host węzła (pierwszy plan)

Na maszynie węzła:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny Gateway przez tunel SSH (wiązanie loopback)

Jeśli Gateway wiąże się z loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym),
zdalne hosty węzłów nie mogą łączyć się bezpośrednio. Utwórz tunel SSH i skieruj
host węzła na lokalny koniec tunelu.

Przykład (host węzła -> host gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem lub hasłem.
- Preferowane są zmienne środowiskowe: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfiguracji to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami zdalnego pierwszeństwa.
- Jeśli aktywne lokalne SecretRefs `gateway.auth.*` są skonfigurowane, ale nierozwiązane, uwierzytelnianie hosta węzła kończy się odmową.
- Rozwiązywanie uwierzytelniania hosta węzła honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

### Uruchom host węzła (usługa)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Sparuj + nazwij

Na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli węzeł ponawia próbę ze zmienionymi szczegółami uwierzytelniania, uruchom ponownie `openclaw devices list`
i zatwierdź bieżące `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwala się w `~/.openclaw/node.json` na węźle).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie gateway).

### Dodaj polecenia do listy dozwolonych

Zatwierdzenia exec są **per host węzła**. Dodaj wpisy listy dozwolonych z gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia znajdują się na hoście węzła w `~/.openclaw/exec-approvals.json`.

### Skieruj exec na węzeł

Skonfiguruj wartości domyślne (konfiguracja gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Albo dla sesji:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście węzła (z zastrzeżeniem
listy dozwolonych/zatwierdzeń węzła).

`host=auto` nie wybierze niejawnie węzła samodzielnie, ale jawne żądanie per wywołanie `host=node` jest dozwolone z `auto`. Jeśli chcesz, aby exec w węźle był domyślny dla sesji, ustaw jawnie `tools.exec.host=node` albo `/exec host=node ...`.

Powiązane:

- [CLI hosta węzła](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

### Lokalne wnioskowanie modelu

Węzeł desktopowy lub serwerowy może udostępniać modele obsługujące czat z serwera Ollama
działającego na tym węźle. Agenci używają narzędzia `node_inference` Pluginu Ollama do
wykrywania zainstalowanych modeli i zdalnego uruchamiania ograniczonego promptu; Gateway
nie potrzebuje bezpośredniego dostępu sieciowego do Ollama. Zobacz [lokalne wnioskowanie Ollama na węźle](/pl/providers/ollama#node-local-inference)
dla konfiguracji, filtrowania modeli i bezpośrednich poleceń weryfikacyjnych.

## Wywoływanie poleceń

Niskopoziomowo (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją pomocnicy wyższego poziomu dla typowych workflow „daj agentowi załącznik MEDIA”.

## Polityka poleceń

Polecenia węzła muszą przejść przez dwie bramki, zanim będzie można je wywołać:

1. Węzeł musi zadeklarować polecenie na liście WebSocket `connect.commands`.
2. Polityka platformy gateway musi zezwalać na zadeklarowane polecenie.

Węzły towarzyszące Windows i macOS domyślnie zezwalają na bezpieczne zadeklarowane polecenia, takie jak
`canvas.*`, `camera.list`, `location.get` i `screen.snapshot`.
Zaufane węzły, które ogłaszają zdolność `talk` albo deklarują polecenia `talk.*`,
domyślnie zezwalają też na zadeklarowane polecenia push-to-talk (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), niezależnie od etykiety platformy.
Niebezpieczne lub silnie prywatnościowe polecenia, takie jak `camera.snap`, `camera.clip` i
`screen.record`, nadal wymagają jawnego opt-in przez
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` zawsze wygrywa z
wartościami domyślnymi i dodatkowymi wpisami listy dozwolonych.

Polecenia węzła należące do Pluginu mogą dodać politykę node-invoke Gateway. Ta polityka
działa po sprawdzeniu listy dozwolonych i przed przekazaniem do węzła, więc surowe
`node.invoke`, pomocnicy CLI i dedykowane narzędzia agenta współdzielą tę samą granicę
uprawnień Pluginu. Niebezpieczne polecenia węzła Pluginu nadal wymagają jawnego
opt-in `gateway.nodes.allowCommands`.

Po zmianie przez węzeł zadeklarowanej listy poleceń odrzuć stare parowanie urządzenia
i zatwierdź nowe żądanie, aby gateway zapisał zaktualizowany snapshot poleceń.

## Konfiguracja (`openclaw.json`)

Ustawienia związane z węzłami znajdują się pod `gateway.nodes` i `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Używaj dokładnych nazw poleceń węzła. `denyCommands` usuwa polecenie nawet wtedy, gdy
domyślna wartość platformy albo wpis `allowCommands` w innym razie by na nie zezwalał. Zobacz
[referencję konfiguracji Gateway](/pl/gateway/configuration-reference#gateway-field-details)
po szczegóły pól parowania węzłów gateway i polityki poleceń.

Nadpisanie węzła exec per agent:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Zrzuty ekranu (snapshoty canvas)

Jeśli węzeł pokazuje Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Pomocnik CLI (zapisuje do pliku tymczasowego i wypisuje zapisaną ścieżkę):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Kontrolki Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Uwagi:

- `canvas present` akceptuje adresy URL albo lokalne ścieżki plików (`--target`) oraz opcjonalne `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` akceptuje JS inline (`--js`) albo argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Węzły mobilne używają dołączonej strony A2UI należącej do aplikacji do renderowania obsługującego akcje.
- Obsługiwany jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).
- iOS i Android renderują zdalne strony Gateway Canvas, ale akcje przycisków A2UI są wysyłane tylko z dołączonej strony A2UI należącej do aplikacji. Strony A2UI HTTP/HTTPS hostowane przez Gateway są na tych klientach mobilnych tylko do renderowania.

## Zdjęcia + filmy (kamera węzła)

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

- Węzeł musi być **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków base64.
- Android poprosi o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy będzie to możliwe; odmowa uprawnień kończy się błędem `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (węzły)

Obsługiwane węzły udostępniają `screen.record` (mp4). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy węzła.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać ekran, gdy dostępnych jest wiele ekranów.

## Lokalizacja (węzły)

Węzły udostępniają `location.get`, gdy lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- „Zawsze” wymaga uprawnienia systemowego; pobieranie w tle działa w trybie best-effort.
- Odpowiedź obejmuje lat/lon, dokładność (metry) i znacznik czasu.

## SMS (węzły Android)

Węzły Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Wywołanie niskopoziomowe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Monit o uprawnienie musi zostać zaakceptowany na urządzeniu Android, zanim funkcja zostanie ogłoszona.
- Urządzenia tylko Wi-Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobistych

Węzły Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiadające im funkcje są włączone.

Dostępne rodziny:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps`, gdy udostępnianie zainstalowanych aplikacji jest włączone w ustawieniach Android
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Uwagi:

- `device.apps` jest opcjonalne i domyślnie zwraca aplikacje widoczne w launcherze.
- Polecenia ruchu są ograniczone funkcją na podstawie dostępnych czujników.

## Polecenia systemowe (host węzła / węzeł Mac)

Węzeł macOS udostępnia `system.run`, `system.notify` i `system.execApprovals.get/set`.
Bezinterfejsowy host węzła udostępnia `system.run`, `system.which` i `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje powierzchnią direct-RPC dla jawnych poleceń węzłów.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one tylko na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Po
  przyznaniu zatwierdzenia gateway przekazuje ten zapisany plan, a nie żadne później
  edytowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnienia do powiadomień w aplikacji macOS.
- Nierozpoznane metadane węzła `platform` / `deviceFamily` używają konserwatywnej domyślnej listy dozwolonych poleceń, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` ograniczone do żądania są redukowane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji zawsze zezwalających w trybie listy dozwolonych znane opakowania wysyłania (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek opakowań. Jeśli odpakowanie nie jest bezpieczne, żaden wpis listy dozwolonych nie jest automatycznie utrwalany.
- Na hostach węzłów Windows w trybie listy dozwolonych uruchomienia opakowań powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis listy dozwolonych nie zezwala automatycznie na formę opakowania).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty węzłów ignorują nadpisania `PATH` i usuwają niebezpieczne klucze startowe/powłoki (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta węzła (albo zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie węzła macOS `system.run` jest ograniczane przez zatwierdzenia exec w aplikacji macOS (Ustawienia → Zatwierdzenia exec).
  Ask/allowlist/full działają tak samo jak bezinterfejsowy host węzła; odrzucone monity zwracają `SYSTEM_RUN_DENIED`.
- Na bezinterfejsowym hoście węzła `system.run` jest ograniczane przez zatwierdzenia exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie węzła exec

Gdy dostępnych jest wiele węzłów, możesz powiązać exec z konkretnym węzłem.
Ustawia to domyślny węzeł dla `exec host=node` (i można to nadpisać dla każdego agenta).

Domyślne globalne:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie dla agenta:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny węzeł:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa uprawnień

Węzły mogą zawierać mapę `permissions` w `node.list` / `node.describe`, indeksowaną nazwą uprawnienia (np. `screenRecording`, `accessibility`) z wartościami logicznymi (`true` = przyznane).

## Bezinterfejsowy host węzła (wieloplatformowy)

OpenClaw może uruchamiać **bezinterfejsowy host węzła** (bez UI), który łączy się z WebSocket Gateway i udostępnia `system.run` / `system.which`. Jest to przydatne w Linux/Windows
lub do uruchamiania minimalnego węzła obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie jest nadal wymagane (Gateway pokaże monit parowania urządzenia).
- Host węzła przechowuje identyfikator węzła, token, nazwę wyświetlaną i informacje o połączeniu z gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są wymuszane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- W macOS bezinterfejsowy host węzła domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i zakończyć zamknięciem w razie jego niedostępności.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb węzła Mac

- Aplikacja macOS na pasku menu łączy się z serwerem Gateway WS jako węzeł (więc `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
