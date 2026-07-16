---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Podręcznik operacyjny usługi Gateway, jej cyklu życia i obsługi operacyjnej
title: Podręcznik operacyjny Gateway
x-i18n:
    generated_at: "2026-07-16T18:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Użyj tej strony do początkowego uruchomienia i późniejszej obsługi usługi Gateway.

<CardGroup cols={2}>
  <Card title="Zaawansowane rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka według objawów z dokładnymi sekwencjami poleceń i sygnaturami dzienników.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Instrukcja konfiguracji zorientowana na zadania oraz pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego oraz operacje migracji i ponownego ładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie profilu uwierzytelniania wyłącznie z odwołaniami.
  </Card>
</CardGroup>

## Lokalne uruchomienie w 5 minut

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debugowanie/śledzenie przekierowane również do standardowego wejścia/wyjścia
openclaw gateway --port 18789 --verbose
# wymuś zakończenie procesu nasłuchującego na wybranym porcie, a następnie uruchom usługę
openclaw gateway --force
```

  </Step>

  <Step title="Sprawdź stan usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Prawidłowy stan bazowy: `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability` zgodny z oczekiwaniami. Użyj `openclaw gateway status --require-rpc` jako potwierdzenia RPC z zakresem odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Gdy Gateway jest osiągalny, polecenie wykonuje aktywne sondy kanałów dla poszczególnych kont oraz opcjonalne audyty. Jeśli Gateway jest nieosiągalny, CLI używa podsumowań kanałów opartych wyłącznie na konfiguracji.

  </Step>
</Steps>

<Note>
Ponowne ładowanie konfiguracji Gateway monitoruje ścieżkę aktywnego pliku konfiguracji (ustaloną na podstawie wartości domyślnych profilu/stanu lub `OPENCLAW_CONFIG_PATH`, jeśli ją ustawiono). Trybem domyślnym jest `gateway.reload.mode="hybrid"`. Po pierwszym pomyślnym załadowaniu działający proces korzysta z aktywnej migawki konfiguracji w pamięci; pomyślne ponowne załadowanie atomowo zastępuje tę migawkę.
</Note>

## Model środowiska uruchomieniowego

- Jeden stale działający proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Jeden multipleksowany port dla:
  - sterowania i RPC przez WebSocket
  - interfejsów API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - tras HTTP Pluginów, takich jak opcjonalna `/api/v1/admin/rpc`
  - interfejsu sterowania i punktów zaczepienia
- Domyślny tryb powiązania: `loopback`. W wykrytym środowisku kontenerowym efektywną wartością domyślną jest `auto` (rozwiązywaną do `0.0.0.0` na potrzeby przekierowania portów), chyba że aktywne jest udostępnianie lub przekazywanie Tailscale, które zawsze wymusza `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają `gateway.auth.token` / `gateway.auth.password` (lub `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje odwrotnego serwera proxy poza interfejsem pętli zwrotnej mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Punkty końcowe zgodne z OpenAI

Najbardziej użyteczna warstwa zgodności OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw jest ważny:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele potoków RAG i pamięci oczekuje `/v1/embeddings`.
- Klienty natywne dla agentów coraz częściej preferują `/v1/responses`.

`/v1/models` działa przede wszystkim z myślą o agentach: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>` dla każdego skonfigurowanego agenta. `openclaw/default` jest stabilnym aliasem, który zawsze wskazuje skonfigurowanego agenta domyślnego. Wyślij `x-openclaw-model`, aby zastąpić dostawcę/model zaplecza; w przeciwnym razie obowiązuje standardowa konfiguracja modelu i osadzania wybranego agenta.

Wszystkie te punkty końcowe działają na głównym porcie Gateway i korzystają z tej samej granicy uwierzytelniania zaufanego operatora co pozostała część interfejsu HTTP API Gateway.

Administracyjne RPC HTTP (`POST /api/v1/admin/rpc`) jest osobną, domyślnie wyłączoną trasą Pluginu dla narzędzi hosta, które nie mogą korzystać z RPC przez WebSocket. Zobacz [Administracyjne RPC HTTP](/pl/plugins/admin-http-rpc).

### Kolejność pierwszeństwa portu i powiązania

| Ustawienie    | Kolejność rozstrzygania                                               |
| ------------- | -------------------------------------------------------------------- |
| Port Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Tryb powiązania | CLI/nadpisanie → `gateway.bind` → `loopback` (lub `auto` w kontenerach) |

Zainstalowane usługi Gateway zapisują ustaloną wartość `--port` w metadanych nadzorcy. Po zmianie `gateway.port` uruchom `openclaw doctor --fix` lub `openclaw gateway install --force`, aby launchd/systemd/schtasks uruchamiał proces na nowym porcie.

Podczas uruchamiania Gateway używa tego samego efektywnego portu i powiązania do zainicjowania lokalnych źródeł interfejsu sterowania dla powiązań innych niż pętla zwrotna. Na przykład `--bind lan --port 3000` inicjuje `http://localhost:3000` i `http://127.0.0.1:3000` przed rozpoczęciem walidacji środowiska uruchomieniowego. Jawnie dodaj wszystkie źródła zdalnych przeglądarek, takie jak adresy URL serwera proxy HTTPS, do `gateway.controlUi.allowedOrigins`.

### Tryby ponownego ładowania na gorąco

| `gateway.reload.mode` | Zachowanie                                 |
| --------------------- | ------------------------------------------ |
| `off`                 | Bez ponownego ładowania konfiguracji       |
| `hot`                 | Zastosuj tylko zmiany bezpieczne na gorąco |
| `restart`             | Uruchom ponownie przy zmianach wymagających ponownego załadowania |
| `hybrid` (domyślnie) | Zastosuj na gorąco, gdy jest to bezpieczne, i uruchom ponownie, gdy jest to wymagane |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # dodaje skanowanie usług na poziomie systemu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/jednostki systemowe systemd/schtasks), a nie do dokładniejszej sondy stanu RPC.

## Wiele instancji Gateway (na tym samym hoście)

W większości instalacji na jednej maszynie powinien działać jeden Gateway. Jeden Gateway może obsługiwać wielu agentów i wiele kanałów. Wiele instancji Gateway jest potrzebnych tylko wtedy, gdy celowo wymagana jest izolacja lub bot ratunkowy.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Oczekiwane zachowanie:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)` i wyświetlić wskazówki dotyczące czyszczenia, gdy nadal istnieją nieaktualne instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateway identities`, gdy odpowiadają różne instancje Gateway lub gdy OpenClaw nie może potwierdzić, że osiągalne cele są tą samą instancją Gateway. Tunel SSH, adres URL serwera proxy lub skonfigurowany zdalny adres URL prowadzący do tej samej instancji Gateway oznacza jedną instancję z wieloma transportami, nawet jeśli porty transportów są różne.
- Jeśli jest to zamierzone, dla każdej instancji Gateway odizoluj porty, konfigurację/stan oraz katalogi główne przestrzeni roboczych.

Lista kontrolna dla każdej instancji:

- Unikatowy `gateway.port`
- Unikatowy `OPENCLAW_CONFIG_PATH`
- Unikatowy `OPENCLAW_STATE_DIR`
- Unikatowy `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Dostęp zdalny

Preferowane rozwiązanie: Tailscale/VPN.
Rozwiązanie zapasowe: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Następnie lokalnie połącz klienty z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania Gateway. W przypadku uwierzytelniania współdzielonym sekretem klienty nadal
muszą wysyłać `token`/`password`, nawet przez tunel. W trybach przenoszących tożsamość
żądanie nadal musi spełniać wymagania tej ścieżki uwierzytelniania.
</Warning>

Zobacz: [Zdalny Gateway](/pl/gateway/remote), [Uwierzytelnianie](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

W celu uzyskania niezawodności zbliżonej do środowiska produkcyjnego używaj uruchomień nadzorowanych.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Do ponownego uruchamiania używaj `openclaw gateway restart`. Nie łącz kolejno `openclaw gateway stop` i `openclaw gateway start` jako zamiennika ponownego uruchomienia.

W systemie macOS `gateway stop` domyślnie używa `launchctl bootout`. Powoduje to usunięcie LaunchAgenta z bieżącej sesji rozruchowej bez trwałego wyłączania, dzięki czemu automatyczne odzyskiwanie KeepAlive nadal działa po nieoczekiwanych awariach, a `gateway start` ponownie włącza usługę bez problemów. Aby trwale wyłączyć automatyczne ponowne uruchamianie po kolejnych rozruchach, przekaż `--disable`: `openclaw gateway stop --disable`.

Etykiety LaunchAgenta to `ai.openclaw.gateway` (domyślna) lub `ai.openclaw.<profile>` (profil nazwany). `openclaw doctor` przeprowadza audyt i naprawia rozbieżności konfiguracji usługi.

  </Tab>

  <Tab title="Linux (systemd użytkownika)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aby usługa działała po wylogowaniu, włącz utrzymywanie sesji:

```bash
sudo loginctl enable-linger $(whoami)
```

Na serwerze bez interfejsu graficznego i bez sesji pulpitu przed ponownym wykonaniem poleceń `systemctl --user` należy również upewnić się, że ustawiono `XDG_RUNTIME_DIR` (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`).

Przykład ręcznej jednostki użytkownika, gdy wymagana jest niestandardowa ścieżka instalacji:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (natywny)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Zarządzane uruchamianie w natywnym systemie Windows korzysta z zaplanowanego zadania o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` w przypadku profili nazwanych). Jeśli utworzenie zaplanowanego zadania
zostanie odrzucone, OpenClaw użyje programu uruchamiającego w folderze Autostart bieżącego użytkownika,
który wskazuje `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

W przypadku hostów wieloużytkownikowych lub stale działających użyj jednostki systemowej.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co w jednostce użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli plik binarny `openclaw` znajduje się w innym miejscu.

Nie zezwalaj jednocześnie, aby `openclaw doctor --fix` instalował usługę Gateway na poziomie użytkownika dla tego samego profilu/portu. Doctor odmawia takiej automatycznej instalacji po wykryciu usługi OpenClaw Gateway na poziomie systemowym; użyj `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy cyklem życia zarządza jednostka systemowa.

  </Tab>
</Tabs>

Błędy nieprawidłowej konfiguracji powodują zakończenie z kodem `78`. Jednostki systemd w systemie Linux używają `RestartPreventExitStatus=78`, aby wstrzymać ponowne uruchamianie do czasu naprawienia konfiguracji. launchd i Harmonogram zadań systemu Windows nie mają równoważnej reguły zatrzymywania zależnej od kodu zakończenia, dlatego Gateway przechowuje również historię szybkich nieprawidłowych uruchomień i po powtarzających się niepowodzeniach uruchamiania wyłącza automatyczne uruchamianie kont kanałów/dostawców. W tym trybie bezpiecznym płaszczyzna sterowania nadal uruchamia się w celu inspekcji i naprawy, ponowne ładowanie konfiguracji na gorąco oraz `secrets.reload` odmawiają automatycznego ponownego uruchamiania kanałów, a jawne żądanie operatora `channels.start` może zastąpić to ograniczenie.

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Wartości domyślne obejmują odizolowany stan/konfigurację i bazowy port Gateway `19001`.

## Skrócona dokumentacja protokołu (widok operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca ramkę `hello-ok` z `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) oraz limitami `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` stanowią zachowawczą listę wykrywania, a nie
  wygenerowany zrzut każdej możliwej do wywołania trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, opcjonalne
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania oraz `shutdown`.

Uruchomienia agenta są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź o ukończeniu (`status:"ok"|"error"`), ze strumieniowanymi pomiędzy nimi zdarzeniami `agent`.

Pełna dokumentacja protokołu: [Protokół Gateway](/pl/gateway/protocol).

## Kontrole operacyjne

### Aktywność

- Otwórz połączenie WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` z migawką.

### Gotowość

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie po luce

Zdarzenia nie są odtwarzane. W przypadku luk w sekwencji przed kontynuowaniem odśwież stan (`health`, `system-presence`).

## Typowe sygnatury błędów

| Sygnatura                                                      | Prawdopodobny problem                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Powiązanie z adresem innym niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway                           |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portów                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguracja ustawiona na tryb zdalny lub brak `gateway.mode` w uszkodzonej konfiguracji |
| `unauthorized` podczas łączenia                                  | Niezgodność uwierzytelniania między klientem a Gateway                                      |

Pełne procedury diagnostyczne zawiera [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway natychmiast zgłaszają błąd, gdy Gateway jest niedostępny (bez niejawnego przełączania awaryjnego na kanał bezpośredni).
- Nieprawidłowe pierwsze ramki lub pierwsze ramki inne niż ramki połączenia są odrzucane, a połączenie jest zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Stan](/pl/gateway/health)
- [Diagnostyka](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
