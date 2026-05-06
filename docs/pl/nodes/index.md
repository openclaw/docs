---
read_when:
    - Parowanie węzłów iOS/Android z Gateway
    - Używanie kanwy/kamery węzła jako kontekstu agenta
    - Dodawanie nowych poleceń Node lub narzędzi pomocniczych CLI
summary: 'Węzły: parowanie, możliwości, uprawnienia i pomocniki CLI do kanwy/kamery/ekranu/urządzenia/powiadomień/systemu'
title: Węzły
x-i18n:
    generated_at: "2026-05-06T09:20:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**Node** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z WebSocket **Gateway** (ten sam port co operatorzy) z `role: "node"` i udostępnia interfejs poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

Starszy transport: [Protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
historyczny wyłącznie dla bieżących urządzeń Node).

macOS może też działać w **trybie Node**: aplikacja na pasku menu łączy się z
serwerem WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako Node (więc
`openclaw nodes …` działa wobec tego Maca). W trybie zdalnego Gateway
automatyzacją przeglądarki zajmuje się host Node CLI (`openclaw node run` lub
zainstalowana usługa Node), a nie Node aplikacji natywnej.

Uwagi:

- Urządzenia Node są **urządzeniami peryferyjnymi**, nie instancjami Gateway. Nie uruchamiają usługi Gateway.
- Wiadomości Telegram/WhatsApp/itp. trafiają do **Gateway**, nie do urządzeń Node.
- Procedura rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Urządzenia Node WS używają parowania urządzeń.** Urządzenia Node przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (lub UI).

Szybkie użycie CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli Node ponawia próbę ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza Node jako **paired**, gdy jego rola parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia jest trwałym kontraktem zatwierdzonych ról. Rotacja
  tokenów pozostaje w tym kontrakcie; nie może podnieść sparowanego Node do
  innej roli, której zatwierdzenie parowania nigdy nie przyznało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) to osobny, należący do Gateway
  magazyn parowania Node; **nie** kontroluje uzgadniania WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` usuwa nieaktualne wpisy z tego
  osobnego, należącego do Gateway magazynu parowania Node.
- Zakres zatwierdzenia wynika z poleceń zadeklarowanych przez oczekujące żądanie:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia Node inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host Node (system.run)

Użyj **hosta Node**, gdy Gateway działa na jednej maszynie, a polecenia mają
wykonywać się na innej. Model nadal komunikuje się z **Gateway**; Gateway
przekazuje wywołania `exec` do **hosta Node**, gdy wybrane jest `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołania narzędzi.
- **Host Node**: wykonuje `system.run`/`system.which` na maszynie Node.
- **Zatwierdzenia**: egzekwowane na hoście Node przez `~/.openclaw/exec-approvals.json`.

Uwaga o zatwierdzeniach:

- Uruchomienia Node oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- Dla bezpośrednich wykonań plików przez powłokę/środowisko uruchomieniowe OpenClaw w miarę możliwości wiąże też jeden konkretny lokalny
  operand pliku i odrzuca uruchomienie, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego,
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast udawać pełne pokrycie środowiska uruchomieniowego. Użyj sandboxingu,
  osobnych hostów albo jawnej zaufanej listy dozwolonych/pełnego przepływu pracy dla szerszej semantyki interpreterów.

### Uruchamianie hosta Node (pierwszy plan)

Na maszynie Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny Gateway przez tunel SSH (wiązanie loopback)

Jeśli Gateway wiąże się z loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym),
zdalne hosty Node nie mogą połączyć się bezpośrednio. Utwórz tunel SSH i skieruj
host Node na lokalny koniec tunelu.

Przykład (host Node -> host Gateway):

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
- Zapasowa konfiguracja to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` mogą być użyte zgodnie z regułami priorytetu zdalnego.
- Jeśli skonfigurowane są aktywne lokalne SecretRefs `gateway.auth.*`, ale nie da się ich rozwiązać, uwierzytelnianie hosta Node odmawia dostępu.
- Rozwiązywanie uwierzytelniania hosta Node uwzględnia wyłącznie zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

### Uruchamianie hosta Node (usługa)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Parowanie + nazwa

Na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli Node ponawia próbę ze zmienionymi danymi uwierzytelniania, uruchom ponownie `openclaw devices list`
i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwala się w `~/.openclaw/node.json` na Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie Gateway).

### Dodaj polecenia do listy dozwolonych

Zatwierdzenia exec są **dla każdego hosta Node**. Dodaj wpisy listy dozwolonych z Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia znajdują się na hoście Node w `~/.openclaw/exec-approvals.json`.

### Skieruj exec na Node

Skonfiguruj wartości domyślne (konfiguracja Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Lub dla sesji:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście Node (zgodnie z
listą dozwolonych/zatwierdzeniami Node).

`host=auto` nie wybierze niejawnie Node samodzielnie, ale jawne żądanie `host=node` dla pojedynczego wywołania jest dozwolone z `auto`. Jeśli chcesz, aby exec Node był domyślny dla sesji, ustaw jawnie `tools.exec.host=node` albo `/exec host=node ...`.

Powiązane:

- [CLI hosta Node](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Wywoływanie poleceń

Niski poziom (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją funkcje pomocnicze wyższego poziomu dla typowych przepływów pracy „przekaż agentowi załącznik MEDIA”.

## Zasady poleceń

Polecenia Node muszą przejść przez dwa etapy kontroli, zanim mogą zostać wywołane:

1. Node musi zadeklarować polecenie na swojej liście WebSocket `connect.commands`.
2. Polityka platformy Gateway musi zezwalać na zadeklarowane polecenie.

Urządzenia towarzyszące Node na Windows i macOS domyślnie zezwalają na bezpieczne zadeklarowane polecenia, takie jak
`canvas.*`, `camera.list`, `location.get` i `screen.snapshot`.
Zaufane urządzenia Node, które ogłaszają możliwość `talk` albo deklarują polecenia `talk.*`,
domyślnie zezwalają też na zadeklarowane polecenia trybu „naciśnij, aby mówić” (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), niezależnie od etykiety platformy.
Niebezpieczne lub mocno ingerujące w prywatność polecenia, takie jak `camera.snap`, `camera.clip` i
`screen.record`, nadal wymagają jawnego włączenia przez
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` zawsze ma pierwszeństwo przed
wartościami domyślnymi i dodatkowymi wpisami listy dozwolonych.

Polecenia Node należące do Plugin mogą dodać politykę Gateway dla wywołań Node. Ta polityka
działa po sprawdzeniu listy dozwolonych i przed przekazaniem do Node, więc surowe
`node.invoke`, funkcje pomocnicze CLI i dedykowane narzędzia agentów współdzielą tę samą granicę
uprawnień Plugin. Niebezpieczne polecenia Node Plugin nadal wymagają jawnego
włączenia przez `gateway.nodes.allowCommands`.

Po zmianie zadeklarowanej listy poleceń przez Node odrzuć stare parowanie urządzenia
i zatwierdź nowe żądanie, aby Gateway zapisał zaktualizowaną migawkę poleceń.

## Zrzuty ekranu (migawki Canvas)

Jeśli Node pokazuje Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Funkcja pomocnicza CLI (zapisuje do pliku tymczasowego i wypisuje `MEDIA:<path>`):

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

- `canvas present` przyjmuje adresy URL lub lokalne ścieżki plików (`--target`) oraz opcjonalnie `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` przyjmuje wbudowany JS (`--js`) lub argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Obsługiwane jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).

## Zdjęcia + filmy (kamera Node)

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
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków base64.
- Android poprosi o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy to możliwe; odmowa uprawnień powoduje błąd `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (urządzenia Node)

Obsługiwane urządzenia Node udostępniają `screen.record` (mp4). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy Node.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać ekran, gdy dostępnych jest wiele ekranów.

## Lokalizacja (urządzenia Node)

Urządzenia Node udostępniają `location.get`, gdy Lokalizacja jest włączona w ustawieniach.

Funkcja pomocnicza CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- „Zawsze” wymaga uprawnienia systemowego; pobieranie w tle jest wykonywane w miarę możliwości.
- Odpowiedź zawiera lat/lon, dokładność (metry) i znacznik czasu.

## SMS (urządzenia Node Android)

Urządzenia Node Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Wywołanie niskiego poziomu:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Monit o uprawnienie musi zostać zaakceptowany na urządzeniu Android, zanim możliwość zostanie ogłoszona.
- Urządzenia tylko z Wi-Fi bez telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobowych

Urządzenia Node Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiednie możliwości są włączone.

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

- Polecenia ruchu są ograniczone możliwościami dostępnymi przez dostępne czujniki.

## Polecenia systemowe (host węzła / węzeł Mac)

Węzeł macOS udostępnia `system.run`, `system.notify` oraz `system.execApprovals.get/set`.
Bezgłowy host węzła udostępnia `system.run`, `system.which` oraz `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonywanie powłoki przechodzi teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje bezpośrednią powierzchnią RPC dla jawnych poleceń węzła.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one tylko na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Po
  udzieleniu zatwierdzenia gateway przekazuje ten zapisany plan, a nie później
  zmodyfikowane przez wywołującego pola command/cwd/session.
- `system.notify` respektuje stan uprawnień do powiadomień w aplikacji macOS.
- Nierozpoznane metadane węzła `platform` / `deviceFamily` używają konserwatywnej domyślnej listy dozwolonych poleceń, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` oraz `--needs-screen-recording`.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` o zakresie żądania są redukowane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji zawsze zezwalaj w trybie listy dozwolonych znane opakowania dispatch (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek opakowań. Jeśli odpakowanie nie jest bezpieczne, żaden wpis listy dozwolonych nie jest automatycznie utrwalany.
- Na hostach węzła Windows w trybie listy dozwolonych uruchomienia opakowania powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis listy dozwolonych nie zezwala automatycznie na formę opakowania).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` oraz `--delivery <system|overlay|auto>`.
- Hosty węzła ignorują nadpisania `PATH` i usuwają niebezpieczne klucze startowe/powłoki (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta węzła (albo zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie węzła macOS `system.run` jest kontrolowane przez zatwierdzenia exec w aplikacji macOS (Ustawienia → Zatwierdzenia exec).
  Tryby ask/allowlist/full działają tak samo jak w bezgłowym hoście węzła; odrzucone monity zwracają `SYSTEM_RUN_DENIED`.
- W bezgłowym hoście węzła `system.run` jest kontrolowane przez zatwierdzenia exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie węzła exec

Gdy dostępnych jest wiele węzłów, możesz powiązać exec z konkretnym węzłem.
Ustawia to domyślny węzeł dla `exec host=node` (i może zostać zastąpione dla pojedynczego agenta).

Domyślne globalne:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie dla agenta:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny węzeł:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa uprawnień

Węzły mogą zawierać mapę `permissions` w `node.list` / `node.describe`, indeksowaną według nazwy uprawnienia (np. `screenRecording`, `accessibility`) z wartościami logicznymi (`true` = przyznane).

## Bezgłowy host węzła (wieloplatformowy)

OpenClaw może uruchamiać **bezgłowy host węzła** (bez UI), który łączy się z WebSocket
Gateway i udostępnia `system.run` / `system.which`. Jest to przydatne na Linux/Windows
lub do uruchamiania minimalnego węzła obok serwera.

Uruchom go:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie nadal jest wymagane (Gateway pokaże monit parowania urządzenia).
- Host węzła przechowuje identyfikator węzła, token, nazwę wyświetlaną i informacje o połączeniu z gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są wymuszane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- Na macOS bezgłowy host węzła domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i bezpiecznie zakończyć niepowodzeniem, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb węzła Mac

- Aplikacja paska menu macOS łączy się z serwerem Gateway WS jako węzeł (więc `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
