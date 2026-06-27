---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Runbook dla usługi Gateway, cyklu życia i operacji
title: Instrukcja operacyjna Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Użyj tej strony do uruchomienia usługi Gateway w dniu 1 oraz operacji w dniu 2.

<CardGroup cols={2}>
  <Card title="Głębokie rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka według objawów z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Zadaniowy przewodnik konfiguracji + pełne odniesienie konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie profilu auth tylko z referencjami.
  </Card>
</CardGroup>

## 5-minutowe lokalne uruchomienie

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Zweryfikuj kondycję usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Zdrowa baza: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz dowodu RPC z zakresem odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym Gateway uruchamia to aktywne sondy kanałów dla każdego konta oraz opcjonalne audyty.
Jeśli Gateway jest nieosiągalny, CLI przełącza się na podsumowania kanałów wyłącznie z konfiguracji zamiast
wyniku aktywnej sondy.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje ścieżkę aktywnego pliku konfiguracji (rozwiązaną z domyślnych ustawień profilu/stanu albo z `OPENCLAW_CONFIG_PATH`, gdy jest ustawione).
Tryb domyślny to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym wczytaniu działający proces obsługuje aktywną migawkę konfiguracji w pamięci; udane przeładowanie atomowo podmienia tę migawkę.
</Note>

## Model środowiska uruchomieniowego

- Jeden stale działający proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Pojedynczy multipleksowany port dla:
  - Sterowania/RPC przez WebSocket
  - API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Tras HTTP Plugin, takich jak opcjonalne `/api/v1/admin/rpc`
  - Control UI i hooków
- Domyślny tryb wiązania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy poza local loopback
  mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Punkty końcowe zgodne z OpenAI

Najważniejsza powierzchnia zgodności OpenClaw to teraz:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele potoków RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest ukierunkowany na agentów: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje się na skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać dostawcę/model backendu; w przeciwnym razie kontrolę zachowuje normalna konfiguracja modelu i embeddingów wybranego agenta.

Wszystkie te punkty działają na głównym porcie Gateway i używają tej samej granicy uwierzytelniania zaufanego operatora co pozostała część API HTTP Gateway.

Administracyjne RPC HTTP (`POST /api/v1/admin/rpc`) to osobna, domyślnie wyłączona trasa Plugin dla narzędzi hosta, które nie mogą używać RPC przez WebSocket. Zobacz [Administracyjne RPC HTTP](/pl/plugins/admin-http-rpc).

### Priorytet portu i wiązania

| Ustawienie   | Kolejność rozwiązywania                                    |
| ------------ | ---------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb wiązania | CLI/override → `gateway.bind` → `loopback`                |

Zainstalowane usługi gateway zapisują rozwiązane `--port` w metadanych nadzorcy. Po zmianie `gateway.port` uruchom `openclaw doctor --fix` lub `openclaw gateway install --force`, aby launchd/systemd/schtasks uruchamiał proces na nowym porcie.

Uruchamianie Gateway używa tego samego efektywnego portu i wiązania, gdy zasila lokalne
źródła Control UI dla wiązań poza local loopback. Na przykład `--bind lan --port 3000`
zasila `http://localhost:3000` i `http://127.0.0.1:3000`, zanim uruchomi się walidacja
środowiska uruchomieniowego. Dodaj jawnie wszelkie źródła zdalnych przeglądarek, takie jak adresy URL proxy HTTPS, do
`gateway.controlUi.allowedOrigins`.

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Brak przeładowania konfiguracji             |
| `hot`                 | Stosuje tylko zmiany bezpieczne dla hot reload |
| `restart`             | Restartuje przy zmianach wymagających przeładowania |
| `hybrid` (domyślnie)  | Stosuje hot-apply, gdy jest bezpiecznie; restartuje, gdy jest to wymagane |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/jednostki systemowe systemd/schtasks), a nie do głębszej sondy kondycji RPC.

## Wiele gatewayów (ten sam host)

Większość instalacji powinna uruchamiać jeden gateway na maszynę. Pojedynczy gateway może obsługiwać wielu
agentów i wiele kanałów.

Potrzebujesz wielu gatewayów tylko wtedy, gdy celowo chcesz izolacji lub bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy nadal istnieją przestarzałe instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateway identities`, gdy odpowiadają różne
  gatewaye albo gdy OpenClaw nie może udowodnić, że osiągalne cele są tym samym Gateway.
  Tunel SSH, URL proxy lub skonfigurowany zdalny URL do tego samego Gateway to jeden
  gateway z wieloma transportami, nawet gdy porty transportu się różnią.
- Jeśli jest to zamierzone, odizoluj porty, konfigurację/stan oraz katalogi główne przestrzeni roboczych dla każdego Gateway.

Lista kontrolna dla każdej instancji:

- Unikalny `gateway.port`
- Unikalny `OPENCLAW_CONFIG_PATH`
- Unikalny `OPENCLAW_STATE_DIR`
- Unikalny `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Rozwiązanie awaryjne: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie podłączaj klientów lokalnie do `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania Gateway. W przypadku uwierzytelniania współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password`, nawet przez tunel. W trybach przenoszących tożsamość
żądanie nadal musi spełnić wymagania tej ścieżki uwierzytelniania.
</Warning>

Zobacz: [Zdalny Gateway](/pl/gateway/remote), [Uwierzytelnianie](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Używaj nadzorowanych uruchomień, aby uzyskać niezawodność podobną do produkcyjnej.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Używaj `openclaw gateway restart` do ponownych uruchomień. Nie łącz `openclaw gateway stop` i `openclaw gateway start` jako zamiennika ponownego uruchomienia.

W macOS `gateway stop` domyślnie używa `launchctl bootout` — usuwa to LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączania, więc automatyczne odzyskiwanie KeepAlive nadal działa po nieoczekiwanych awariach, a `gateway start` ponownie włącza usługę w czysty sposób. Aby trwale zablokować automatyczne ponowne uruchamianie między restartami systemu, przekaż `--disable`: `openclaw gateway stop --disable`.

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślna) lub `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia rozjazdy konfiguracji usługi.

  </Tab>

  <Tab title="Linux (systemd użytkownika)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aby zachować działanie po wylogowaniu, włącz lingering:

```bash
sudo loginctl enable-linger <user>
```

Przykład ręcznej jednostki użytkownika, gdy potrzebujesz niestandardowej ścieżki instalacji:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (natywnie)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Natywne zarządzane uruchamianie w Windows używa zaplanowanego zadania o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie zaplanowanego zadania
zostanie odrzucone, OpenClaw przechodzi awaryjnie na launcher w folderze Autostart dla danego użytkownika,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych lub stale włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co w jednostce użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli plik binarny `openclaw` znajduje się gdzie indziej.

Nie pozwalaj także, aby `openclaw doctor --fix` instalował usługę Gateway na poziomie użytkownika dla tego samego profilu/portu. Doctor odmawia takiej automatycznej instalacji, gdy znajdzie usługę Gateway OpenClaw na poziomie systemowym; użyj `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy jednostka systemowa odpowiada za cykl życia.

  </Tab>
</Tabs>

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Wartości domyślne obejmują odizolowany stan/konfigurację oraz bazowy port Gateway `19001`.

## Skrócona dokumentacja protokołu (widok operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca migawkę `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to zachowawcza lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania
  oraz `shutdown`.

Uruchomienia agenta są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź zakończenia (`status:"ok"|"error"`), z przesyłanymi strumieniowo zdarzeniami `agent` pomiędzy.

Zobacz pełną dokumentację protokołu: [Protokół Gateway](/pl/gateway/protocol).

## Kontrole operacyjne

### Aktywność

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` z migawką.

### Gotowość

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie po lukach

Zdarzenia nie są odtwarzane. W przypadku luk w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                      | Prawdopodobny problem                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Wiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway    |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguracja ustawiona na tryb zdalny albo w uszkodzonej konfiguracji brakuje znacznika trybu lokalnego |
| `unauthorized` podczas łączenia                                | Niezgodność uwierzytelniania między klientem a Gateway                          |

Pełne ścieżki diagnostyczne znajdziesz w sekcji [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway szybko kończą działanie, gdy Gateway jest niedostępny (bez niejawnego powrotu do kanału bezpośredniego).
- Nieprawidłowe pierwsze ramki lub pierwsze ramki bez połączenia są odrzucane i zamykane.
- Płynne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Kondycja](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
