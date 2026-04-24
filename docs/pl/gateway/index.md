---
read_when:
    - Uruchamianie lub debugowanie procesu gateway
summary: Runbook usługi Gateway, cyklu życia i operacji
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Używaj tej strony do operacji day-1 przy uruchamianiu i day-2 w obsłudze usługi Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka według objawów z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Przewodnik konfiguracji zorientowany na zadania + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie snapshotu runtime oraz operacje migrate/reload.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie auth-profile tylko z refami.
  </Card>
</CardGroup>

## 5-minutowy lokalny start

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace odbijane na stdio
openclaw gateway --port 18789 --verbose
# wymuś zabicie listenera na wybranym porcie, a potem uruchom
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Zdrowa linia bazowa: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z tym, czego oczekujesz. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz dowodu RPC z zakresem odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Przy osiągalnym gateway to uruchamia sondy live kanałów dla każdego konta oraz opcjonalne audyty.
Jeśli gateway jest nieosiągalny, CLI przechodzi na podsumowania kanałów tylko na podstawie konfiguracji
zamiast danych wyjściowych z live probe.

  </Step>
</Steps>

<Note>
Reload konfiguracji gateway obserwuje aktywną ścieżkę pliku konfiguracyjnego (rozwiązaną na podstawie domyślnych ustawień profilu/stanu albo `OPENCLAW_CONFIG_PATH`, jeśli jest ustawione).
Domyślny tryb to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym wczytaniu działający proces serwuje aktywny snapshot konfiguracji w pamięci; udany reload podmienia ten snapshot atomowo.
</Note>

## Model runtime

- Jeden zawsze działający proces dla routingu, control plane i połączeń kanałów.
- Jeden multipleksowany port dla:
  - sterowania/RPC WebSocket
  - API HTTP, kompatybilnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb binda: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy
  inne niż loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy kompatybilne z OpenAI

Najbardziej wartościowa powierzchnia zgodności OpenClaw obejmuje teraz:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sprawdza `/v1/models`.
- Wiele potoków RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest agent-first: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje się na skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać backend provider/model; w przeciwnym razie kontrolę zachowuje zwykła konfiguracja modelu i embeddingów wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej zaufanej granicy uwierzytelniania operatora co reszta API HTTP Gateway.

### Priorytet portu i binda

| Ustawienie     | Kolejność rozstrzygania                                      |
| -------------- | ------------------------------------------------------------ |
| Port Gateway   | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb binda     | CLI/override → `gateway.bind` → `loopback`                   |

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                |
| --------------------- | ----------------------------------------- |
| `off`                 | Brak reload konfiguracji                  |
| `hot`                 | Zastosowanie tylko zmian bezpiecznych dla hot |
| `restart`             | Restart przy zmianach wymagających reload |
| `hybrid` (domyślnie)  | Hot-apply, gdy bezpieczne, restart, gdy wymagane |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # dodaje skan usługi na poziomie systemu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/systemd system
units/schtasks), a nie do głębszej sondy zdrowia RPC.

## Wiele gatewayów (ten sam host)

Większość instalacji powinna uruchamiać jeden gateway na maszynę. Jeden gateway może hostować wielu
agentów i wiele kanałów.

Wiele gatewayów potrzebujesz tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne sprawdzenia:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłaszać `Other gateway-like services detected (best effort)`
  i wypisywać wskazówki czyszczenia, gdy nadal istnieją stare instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzegać o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli jest to zamierzone, izoluj porty, konfigurację/stan i katalogi główne obszarów roboczych dla każdego gateway.

Lista kontrolna dla każdej instancji:

- Unikalne `gateway.port`
- Unikalne `OPENCLAW_CONFIG_PATH`
- Unikalne `OPENCLAW_STATE_DIR`
- Unikalne `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Fallback: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie łącz klientów lokalnie z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania gateway. Przy uwierzytelnianiu współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać tę ścieżkę uwierzytelniania.
</Warning>

Zobacz: [Remote Gateway](/pl/gateway/remote), [Authentication](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Dla niezawodności zbliżonej do produkcyjnej używaj uruchomień nadzorowanych.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślnie) albo `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aby zachować działanie po wylogowaniu, włącz lingering:

```bash
sudo loginctl enable-linger <user>
```

Przykład ręcznej jednostki user, gdy potrzebujesz niestandardowej ścieżki instalacji:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Zarządzany natywny start Windows używa zaplanowanego zadania `OpenClaw Gateway`
(albo `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie Scheduled Task
zostanie odrzucone, OpenClaw przechodzi na launcher w folderze Startup per użytkownik,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (system service)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki user, ale zainstaluj ją pod
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli plik binarny `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Szybka ścieżka dla profilu dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne ustawienia obejmują izolowany stan/konfigurację i bazowy port gateway `19001`.

## Szybka dokumentacja protokołu (widok operatora)

- Pierwsza ramka klienta musi być `connect`.
- Gateway zwraca snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej ścieżki pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzeń oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź zakończenia (`status:"ok"|"error"`), z pośrednimi streamowanymi zdarzeniami `agent`

Pełna dokumentacja protokołu: [Gateway Protocol](/pl/gateway/protocol).

## Kontrole operacyjne

### Liveness

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` ze snapshotem.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie luk

Zdarzenia nie są odtwarzane. Przy lukach sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury błędów

| Sygnatura                                                     | Prawdopodobny problem                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind inny niż loopback bez prawidłowej ścieżki uwierzytelniania gateway         |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                  |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb remote albo brakuje znacznika trybu lokalnego w uszkodzonej konfiguracji |
| `unauthorized` during connect                                 | Niezgodność uwierzytelniania między klientem a gateway                          |

Aby uzyskać pełne sekwencje diagnozowania, użyj [Gateway Troubleshooting](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway kończą się szybko błędem, gdy Gateway jest niedostępny (bez niejawnego fallbacku do kanału bezpośredniego).
- Nieprawidłowe/pierwsze ramki inne niż connect są odrzucane, a połączenie zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem socketu.

---

Powiązane:

- [Troubleshooting](/pl/gateway/troubleshooting)
- [Background Process](/pl/gateway/background-process)
- [Configuration](/pl/gateway/configuration)
- [Health](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Authentication](/pl/gateway/authentication)

## Powiązane

- [Configuration](/pl/gateway/configuration)
- [Gateway troubleshooting](/pl/gateway/troubleshooting)
- [Remote access](/pl/gateway/remote)
- [Secrets management](/pl/gateway/secrets)
