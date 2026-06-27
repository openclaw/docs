---
read_when:
    - Parowanie węzłów iOS/Android z gatewayem
    - Używanie kanwy/kamery Node na potrzeby kontekstu agenta
    - Dodawanie nowych poleceń Node lub pomocników CLI
summary: 'Węzły: parowanie, możliwości, uprawnienia i pomocnicze polecenia CLI dla canvas/kamery/ekranu/urządzenia/powiadomień/systemu'
title: Węzły
x-i18n:
    generated_at: "2026-06-27T17:45:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**Węzeł** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z Gateway **WebSocket** (ten sam port co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

Starszy transport: [Protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
wyłącznie historyczny dla obecnych węzłów).

macOS może także działać w **trybie węzła**: aplikacja z paska menu łączy się z serwerem WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako węzeł (dzięki czemu `openclaw nodes …` działa wobec tego Maca). W trybie zdalnego gateway automatyzację przeglądarki obsługuje host węzła CLI (`openclaw node run` albo zainstalowana usługa węzła), a nie natywny węzeł aplikacji.

Uwagi:

- Węzły są **urządzeniami peryferyjnymi**, nie gatewayami. Nie uruchamiają usługi gateway.
- Wiadomości Telegram/WhatsApp/itd. trafiają do **gateway**, nie do węzłów.
- Runbook rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Węzły WS używają parowania urządzeń.** Węzły przedstawiają tożsamość urządzenia podczas `connect`; Gateway tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (albo UI).

Szybkie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli węzeł ponawia próbę ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza węzeł jako **sparowany**, gdy jego rola parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałym kontraktem zatwierdzonej roli. Rotacja tokenu pozostaje wewnątrz tego kontraktu; nie może podnieść sparowanego węzła do innej roli, której zatwierdzenie parowania nigdy nie nadało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) to osobny, należący do gateway magazyn parowania węzłów; **nie** bramkuje uzgadniania WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` usuwa parowanie węzła. Dla węzła opartego na urządzeniu odbiera rolę `node` tego urządzenia w `devices/paired.json` i rozłącza sesje tego urządzenia w roli węzła — urządzenie o mieszanych rolach zachowuje swój wiersz i traci tylko rolę `node`, natomiast wiersz urządzenia wyłącznie węzłowego jest usuwany. Czyści też pasujący wpis z osobnego, należącego do gateway magazynu parowania węzłów. `operator.pairing` może usuwać wiersze węzłów niebędących operatorami; wywołujący z tokenem urządzenia, który odbiera własną rolę węzła na urządzeniu o mieszanych rolach, dodatkowo potrzebuje `operator.admin`.
- Zakres zatwierdzenia wynika z zadeklarowanych poleceń oczekującego żądania:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia węzła inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host węzła (system.run)

Użyj **hosta węzła**, gdy Gateway działa na jednej maszynie, a chcesz wykonywać polecenia na innej. Model nadal rozmawia z **gateway**; gateway przekazuje wywołania `exec` do **hosta węzła**, gdy wybrane jest `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host węzła**: wykonuje `system.run`/`system.which` na maszynie węzła.
- **Zatwierdzenia**: egzekwowane na hoście węzła przez `~/.openclaw/exec-approvals.json`.

Uwaga o zatwierdzeniach:

- Uruchomienia węzła oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań plików powłoki/runtime OpenClaw dodatkowo podejmuje najlepszą próbę powiązania jednego konkretnego lokalnego operandu pliku i odmawia uruchomienia, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może wskazać dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime, wykonanie oparte na zatwierdzeniu jest odmawiane zamiast udawać pełne pokrycie runtime. Użyj sandboxingu, osobnych hostów albo jawnej zaufanej allowlisty/pełnego workflow dla szerszej semantyki interpretera.

### Uruchom host węzła (pierwszy plan)

Na maszynie węzła:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny gateway przez tunel SSH (wiązanie loopback)

Jeśli Gateway wiąże się z loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym), zdalne hosty węzłów nie mogą połączyć się bezpośrednio. Utwórz tunel SSH i skieruj host węzła na lokalny koniec tunelu.

Przykład (host węzła -> host gateway):

```bash
# Terminal A (utrzymuj uruchomiony): przekieruj lokalne 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportuj token gateway i połącz się przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem lub hasłem.
- Preferowane są zmienne env: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfiguracji to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami pierwszeństwa zdalnego.
- Jeśli skonfigurowano aktywne lokalne SecretRefs `gateway.auth.*`, ale są nierozwiązane, uwierzytelnianie hosta węzła kończy się odmową.
- Rozwiązywanie uwierzytelniania hosta węzła honoruje tylko zmienne env `OPENCLAW_GATEWAY_*`.

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

Jeśli węzeł ponawia próbę ze zmienionymi szczegółami uwierzytelniania, uruchom ponownie `openclaw devices list` i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane w `~/.openclaw/node.json` na węźle).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie gateway).

### Dodaj polecenia do allowlisty

Zatwierdzenia exec są **per host węzła**. Dodaj wpisy allowlisty z gateway:

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

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście węzła (z zastrzeżeniem allowlisty/zatwierdzeń węzła).

`host=auto` nie wybierze samodzielnie węzła niejawnie, ale jawne żądanie per wywołanie `host=node` jest dozwolone z `auto`. Jeśli chcesz, aby exec węzła był domyślny dla sesji, ustaw jawnie `tools.exec.host=node` albo `/exec host=node ...`.

Powiązane:

- [CLI hosta węzła](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Wywoływanie poleceń

Niskopoziomowo (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją helpery wyższego poziomu dla typowych workflow „daj agentowi załącznik MEDIA”.

## Polityka poleceń

Polecenia węzła muszą przejść przez dwie bramki, zanim można je wywołać:

1. Węzeł musi zadeklarować polecenie na swojej liście WebSocket `connect.commands`.
2. Polityka platformy gateway musi zezwalać na zadeklarowane polecenie.

Węzły towarzyszące Windows i macOS domyślnie zezwalają na bezpieczne zadeklarowane polecenia, takie jak `canvas.*`, `camera.list`, `location.get` i `screen.snapshot`.
Zaufane węzły, które reklamują możliwość `talk` albo deklarują polecenia `talk.*`, domyślnie zezwalają także na zadeklarowane polecenia push-to-talk (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), niezależnie od etykiety platformy.
Niebezpieczne lub mocno naruszające prywatność polecenia, takie jak `camera.snap`, `camera.clip` i `screen.record`, nadal wymagają jawnego opt-in przez `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` zawsze ma pierwszeństwo przed wartościami domyślnymi i dodatkowymi wpisami allowlisty.

Polecenia węzła należące do Pluginu mogą dodać politykę Gateway node-invoke. Ta polityka działa po sprawdzeniu allowlisty i przed przekazaniem do węzła, więc surowe `node.invoke`, helpery CLI i dedykowane narzędzia agenta współdzielą tę samą granicę uprawnień Pluginu. Niebezpieczne polecenia węzła Pluginu nadal wymagają jawnego opt-in `gateway.nodes.allowCommands`.

Po zmianie przez węzeł zadeklarowanej listy poleceń odrzuć stare parowanie urządzenia i zatwierdź nowe żądanie, aby gateway zapisał zaktualizowany snapshot poleceń.

## Konfiguracja (`openclaw.json`)

Ustawienia związane z węzłami znajdują się pod `gateway.nodes` i `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Automatycznie zatwierdzaj pierwsze parowanie węzła z zaufanych sieci (lista CIDR).
      // Wyłączone, gdy nieustawione. Dotyczy tylko pierwszych żądań role:node
      // bez żądanych zakresów; nie zatwierdza automatycznie podniesień uprawnień.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt-in do niebezpiecznych/mocno naruszających prywatność poleceń węzła (camera.snap itd.).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokuj dokładne nazwy poleceń nawet wtedy, gdy wartości domyślne lub allowCommands je obejmują.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Domyślny host exec: "node" kieruje wszystkie wywołania exec do sparowanego węzła.
      host: "node",
      // Tryb bezpieczeństwa dla exec węzła: zezwalaj tylko na zatwierdzone/podane w allowliście polecenia.
      security: "allowlist",
      // Przypnij exec do konkretnego węzła (id lub nazwa). Pomiń, aby zezwolić na dowolny węzeł.
      node: "build-node",
    },
  },
}
```

Używaj dokładnych nazw poleceń węzła. `denyCommands` usuwa polecenie nawet wtedy, gdy domyślna wartość platformy lub wpis `allowCommands` w przeciwnym razie by je zezwalały. Zobacz [Dokumentację referencyjną konfiguracji Gateway](/pl/gateway/configuration-reference#gateway-field-details), aby uzyskać szczegóły pól parowania węzłów gateway i polityki poleceń.

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

Helper CLI (zapisuje do pliku tymczasowego i wypisuje zapisaną ścieżkę):

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

- `canvas present` akceptuje URL-e lub lokalne ścieżki plików (`--target`) oraz opcjonalne `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` akceptuje wbudowany JS (`--js`) albo argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Węzły mobilne używają do renderowania z obsługą akcji dołączonej strony A2UI należącej do aplikacji.
- Obsługiwany jest tylko JSONL A2UI v0.8 (v0.9/createSurface jest odrzucane).
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
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych payloadów base64.
- Android wyświetli prośbę o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy to możliwe; odrzucone uprawnienia kończą się błędem `*_PERMISSION_REQUIRED`.

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
- Użyj `--screen <index>`, aby wybrać wyświetlacz, gdy dostępnych jest wiele ekranów.

## Lokalizacja (węzły)

Węzły udostępniają `location.get`, gdy Lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- „Zawsze” wymaga uprawnień systemowych; pobieranie w tle działa w trybie najlepszych starań.
- Odpowiedź zawiera szerokość/długość geograficzną, dokładność (w metrach) i znacznik czasu.

## SMS (węzły Android)

Węzły Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Niskopoziomowe wywołanie:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Prośba o uprawnienie musi zostać zaakceptowana na urządzeniu Android, zanim funkcja zostanie ogłoszona.
- Urządzenia tylko Wi-Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android i danych osobistych

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
- Polecenia ruchu są ograniczone przez dostępne czujniki.

## Polecenia systemowe (host węzła / węzeł Mac)

Węzeł macOS udostępnia `system.run`, `system.notify` oraz `system.execApprovals.get/set`.
Bezgłowy host węzła udostępnia `system.run`, `system.which` oraz `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w payloadzie.
- Wykonywanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje bezpośrednią powierzchnią RPC dla jawnych poleceń węzła.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one wyłącznie na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Po
  przyznaniu zatwierdzenia Gateway przekazuje ten zapisany plan, a nie żadne później
  edytowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnień do powiadomień w aplikacji macOS.
- Nierozpoznane metadane węzła `platform` / `deviceFamily` używają konserwatywnej domyślnej listy dozwolonych, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` o zakresie żądania są ograniczane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji „zawsze zezwalaj” w trybie listy dozwolonych znane opakowania dyspozytorskie (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek opakowań. Jeśli odpakowanie nie jest bezpieczne, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.
- Na hostach węzłów Windows w trybie listy dozwolonych uruchomienia opakowania powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis listy dozwolonych nie zezwala automatycznie na formę opakowania).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty węzłów ignorują nadpisania `PATH` i usuwają niebezpieczne klucze startowe/powłoki (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta węzła (albo zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie węzła macOS `system.run` jest ograniczone zatwierdzeniami exec w aplikacji macOS (Ustawienia → Zatwierdzenia exec).
  Tryby pytania/listy dozwolonych/pełny działają tak samo jak w bezgłowym hoście węzła; odrzucone prośby zwracają `SYSTEM_RUN_DENIED`.
- Na bezgłowym hoście węzła `system.run` jest ograniczone zatwierdzeniami exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie węzła exec

Gdy dostępnych jest wiele węzłów, możesz powiązać exec z konkretnym węzłem.
Ustawia to domyślny węzeł dla `exec host=node` (i można to nadpisać dla każdego agenta).

Domyślne ustawienie globalne:

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

## Bezgłowy host węzła (wieloplatformowy)

OpenClaw może uruchomić **bezgłowy host węzła** (bez UI), który łączy się z WebSocketem Gateway
i udostępnia `system.run` / `system.which`. Jest to przydatne w systemach Linux/Windows
lub do uruchamiania minimalnego węzła obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie nadal jest wymagane (Gateway pokaże prośbę o sparowanie urządzenia).
- Host węzła przechowuje swój identyfikator węzła, token, nazwę wyświetlaną i informacje o połączeniu z Gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są egzekwowane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- Na macOS bezgłowy host węzła domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i zakończyć niepowodzeniem w trybie zamkniętym, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb węzła Mac

- Aplikacja macOS z paska menu łączy się z serwerem Gateway WS jako węzeł (więc `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
