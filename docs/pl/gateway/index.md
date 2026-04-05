---
read_when:
    - Uruchamiasz proces gateway lub go debugujesz
summary: Instrukcja operacyjna dla usługi Gateway, jej cyklu życia i operacji
title: Instrukcja operacyjna Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Instrukcja operacyjna Gateway

Używaj tej strony do uruchomienia usługi Gateway pierwszego dnia i do operacji drugiego dnia.

<CardGroup cols={2}>
  <Card title="Głębokie rozwiązywanie problemów" icon="siren" href="/gateway/troubleshooting">
    Diagnostyka oparta na objawach z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/gateway/configuration">
    Przewodnik konfiguracji zorientowany na zadania + pełna dokumentacja referencyjna konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/gateway/secrets">
    Kontrakt SecretRef, zachowanie snapshotów runtime oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie profilu uwierzytelniania tylko z odwołaniami.
  </Card>
</CardGroup>

## 5-minutowe lokalne uruchomienie

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace zduplikowane do stdio
openclaw gateway --port 18789 --verbose
# wymuś zabicie nasłuchującego procesu na wybranym porcie, a następnie uruchom
openclaw gateway --force
```

  </Step>

  <Step title="Zweryfikuj kondycję usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Zdrowa baza: `Runtime: running` i `RPC probe: ok`.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym gateway uruchamia to sondy kanałów live dla poszczególnych kont oraz opcjonalne audyty.
Jeśli gateway jest nieosiągalny, CLI wraca do podsumowań kanałów opartych tylko na konfiguracji
zamiast do danych wyjściowych z sond live.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje ścieżkę aktywnego pliku konfiguracji (rozwiązaną z domyślnych ustawień profilu/stanu lub z `OPENCLAW_CONFIG_PATH`, gdy jest ustawione).
Domyślnym trybem jest `gateway.reload.mode="hybrid"`.
Po pierwszym pomyślnym wczytaniu uruchomiony proces obsługuje aktywny snapshot konfiguracji w pamięci; pomyślne przeładowanie atomowo podmienia ten snapshot.
</Note>

## Model runtime

- Jeden stale działający proces do routingu, control plane i połączeń kanałów.
- Jeden multipleksowany port dla:
  - control/RPC przez WebSocket
  - API HTTP, zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - interfejsu Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Domyślnie wymagane jest uwierzytelnianie. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje
  reverse proxy spoza loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

Najbardziej wartościową powierzchnią zgodności OpenClaw jest obecnie:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele pipeline’ów RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest agent-first: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje do skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, jeśli chcesz nadpisać backend provider/model; w przeciwnym razie kontrolę zachowuje zwykły model i konfiguracja osadzeń wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej granicy uwierzytelniania zaufanego operatora co reszta API HTTP Gateway.

### Priorytet portu i bindowania

| Ustawienie      | Kolejność rozwiązywania                                         |
| --------------- | --------------------------------------------------------------- |
| Port Gateway    | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bindowania | CLI/override → `gateway.bind` → `loopback`                    |

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                  |
| --------------------- | ------------------------------------------- |
| `off`                 | Brak przeładowania konfiguracji             |
| `hot`                 | Zastosuj tylko zmiany bezpieczne dla hot    |
| `restart`             | Restart przy zmianach wymagających restartu |
| `hybrid` (domyślnie)  | Zastosuj hot, gdy bezpieczne, restart gdy wymagany |

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
units/schtasks), a nie do głębszej sondy kondycji RPC.

## Wiele gateway na jednym hoście

W większości instalacji powinna działać jedna brama gateway na maszynę. Jeden gateway może obsługiwać wiele
agentów i kanałów.

Wiele gateway potrzebujesz tylko wtedy, gdy celowo chcesz izolacji lub bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy nadal istnieją stare instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli to zamierzone, odizoluj porty, konfigurację/stan oraz katalogi główne obszarów roboczych dla każdego gateway.

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Fallback: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie podłącz klientów lokalnie do `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania gateway. W przypadku uwierzytelniania współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać tę ścieżkę uwierzytelniania.
</Warning>

Zobacz: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Nadzór i cykl życia usługi

Dla niezawodności na poziomie produkcyjnym używaj uruchomień nadzorowanych.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślnie) lub `ai.openclaw.<profile>` (profil nazwany). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

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

Zarządzane natywne uruchamianie w Windows używa Zaplanowanego zadania o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli tworzenie Scheduled Task
zostanie odrzucone, OpenClaw wraca do programu uruchamiającego w folderze Startup dla użytkownika,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (system service)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli Twój binarny `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Wiele gateway na jednym hoście

W większości konfiguracji powinien działać **jeden** Gateway.
Używaj wielu tylko dla ścisłej izolacji/nadmiarowości (na przykład profilu ratunkowego).

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

Zobacz: [Multiple gateways](/gateway/multiple-gateways).

### Szybka ścieżka dla profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślnie obejmuje to odizolowany stan/konfigurację oraz bazowy port gateway `19001`.

## Szybka dokumentacja referencyjna protokołu (widok operatora)

- Pierwsza ramka klienta musi być `connect`.
- Gateway zwraca snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to zachowawcza lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej ścieżki pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/akceptacji oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź zakończenia (`status:"ok"|"error"`), ze strumieniowanymi zdarzeniami `agent` pomiędzy.

Pełna dokumentacja protokołu: [Gateway Protocol](/gateway/protocol).

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

### Odzyskiwanie po lukach

Zdarzenia nie są odtwarzane ponownie. W przypadku luk sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                     | Prawdopodobny problem                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania gateway         |
| `another gateway instance is already listening` / `EADDRINUSE`| Konflikt portu                                                                    |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb zdalny albo brakuje znacznika trybu lokalnego w uszkodzonej konfiguracji |
| `unauthorized` during connect                                 | Niezgodność uwierzytelniania między klientem a gateway                            |

Pełne sekwencje diagnostyczne znajdziesz w [Gateway Troubleshooting](/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway kończą działanie natychmiast, gdy Gateway jest niedostępny (bez niejawnego fallbacku do bezpośredniego kanału).
- Nieprawidłowe/pierwsze ramki inne niż `connect` są odrzucane, a połączenie zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
