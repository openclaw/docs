---
read_when:
    - Uruchamiasz lub debugujesz proces gateway
summary: Runbook dla usługi Gateway, jej cyklu życia i operacji
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-07T09:45:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd2c21036e88612861ef2195b8ff7205aca31386bb11558614ade8d1a54fdebd
    source_path: gateway/index.md
    workflow: 15
---

# Runbook Gateway

Używaj tej strony do uruchomienia usługi Gateway w pierwszym dniu oraz do operacji w kolejnych dniach.

<CardGroup cols={2}>
  <Card title="Głębokie rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka oparta na objawach z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Przewodnik konfiguracji zorientowany na zadania + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie snapshotów w czasie wykonywania oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły target/path dla `secrets apply` oraz zachowanie profilu uwierzytelniania tylko z referencjami.
  </Card>
</CardGroup>

## 5-minutowe lokalne uruchomienie

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace odbijane do stdio
openclaw gateway --port 18789 --verbose
# wymuś zabicie procesu nasłuchującego na wybranym porcie, a następnie uruchom
openclaw gateway --force
```

  </Step>

  <Step title="Zweryfikuj stan usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Prawidłowa baza: `Runtime: running` i `RPC probe: ok`.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym gateway to polecenie uruchamia aktywne sondy kanałów dla każdego konta oraz opcjonalne audyty.
Jeśli gateway jest nieosiągalny, CLI przełącza się na podsumowania kanałów oparte wyłącznie na konfiguracji zamiast
wyświetlać wynik aktywnego sondowania.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji gateway obserwuje ścieżkę aktywnego pliku konfiguracji (ustalaną na podstawie wartości domyślnych profilu/stanu lub `OPENCLAW_CONFIG_PATH`, jeśli jest ustawione).
Tryb domyślny to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym wczytaniu działający proces udostępnia aktywny snapshot konfiguracji w pamięci; udane przeładowanie podmienia ten snapshot atomowo.
</Note>

## Model działania w czasie wykonywania

- Jeden stale uruchomiony proces do routingu, control plane i połączeń kanałów.
- Jeden multipleksowany port dla:
  - control/RPC przez WebSocket
  - API HTTP, zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy
  poza `loopback` mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Punkty końcowe zgodne z OpenAI

Najważniejsza powierzchnia zgodności OpenClaw to obecnie:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele pipeline’ów RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywnie agentowi coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest zorientowane agentowo: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje się do skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, jeśli chcesz nadpisać dostawcę/model po stronie backendu; w przeciwnym razie kontrolę zachowuje zwykła konfiguracja modelu i embeddingów wybranego agenta.

Wszystkie te punkty końcowe działają na głównym porcie Gateway i używają tej samej granicy uwierzytelniania zaufanego operatora co reszta HTTP API Gateway.

### Priorytet portu i trybu bindowania

| Ustawienie    | Kolejność ustalania                                            |
| ------------- | -------------------------------------------------------------- |
| Port Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bindowania | CLI/override → `gateway.bind` → `loopback`                  |

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                 |
| --------------------- | ------------------------------------------ |
| `off`                 | Brak przeładowania konfiguracji            |
| `hot`                 | Zastosuj tylko zmiany bezpieczne dla hot reload |
| `restart`             | Restart przy zmianach wymagających przeładowania |
| `hybrid` (domyślny)   | Zastosuj na gorąco, gdy jest bezpiecznie, restartuj, gdy to wymagane |

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

`gateway status --deep` służy do dodatkowego wykrywania usług (jednostki systemowe LaunchDaemons/systemd/schtasks),
a nie do głębszego sondowania stanu RPC.

## Wiele gateway na jednym hoście

Większość instalacji powinna uruchamiać jeden gateway na maszynę. Jeden gateway może hostować wielu
agentów i kanały.

Wiele gateway jest potrzebnych tylko wtedy, gdy celowo chcesz izolacji lub bota ratunkowego.

Przydatne sprawdzenia:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego oczekiwać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wyświetlić wskazówki czyszczenia, gdy nadal istnieją stare instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada
  więcej niż jeden cel.
- Jeśli jest to zamierzone, izoluj porty, konfigurację/stan oraz katalogi workspace dla każdego gateway.

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Zapasowo: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie połącz klientów lokalnie z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania gateway. W przypadku uwierzytelniania współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać tę ścieżkę uwierzytelniania.
</Warning>

Zobacz: [Gateway zdalny](/pl/gateway/remote), [Uwierzytelnianie](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

W przypadku niezawodności zbliżonej do produkcyjnej używaj uruchomień nadzorowanych.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślna) lub `ai.openclaw.<profile>` (profil nazwany). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

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

  <Tab title="Windows (natywnie)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Natywne zarządzane uruchamianie w Windows używa Harmonogramu zadań o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli tworzenie zadania Harmonogramu zadań
zostanie odrzucone, OpenClaw przełącza się na launcher per użytkownik w folderze Autostart,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli binarka `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Wiele gateway na jednym hoście

Większość konfiguracji powinna uruchamiać **jeden** Gateway.
Używaj wielu tylko dla ścisłej izolacji/nadmiarowości (na przykład profil ratunkowy).

Lista kontrolna dla każdej instancji:

- Unikalny `gateway.port`
- Unikalne `OPENCLAW_CONFIG_PATH`
- Unikalne `OPENCLAW_STATE_DIR`
- Unikalne `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Zobacz: [Wiele gateway](/pl/gateway/multiple-gateways).

### Szybka ścieżka dla profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Wartości domyślne obejmują odizolowany stan/konfigurację oraz bazowy port gateway `19001`.

## Szybka dokumentacja protokołu (widok operatora)

- Pierwsza ramka klienta musi być `connect`.
- Gateway zwraca snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/politykę).
- `hello-ok.features.methods` / `events` to zachowawcza lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej ścieżki pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/akceptacji oraz `shutdown`.

Uruchomienia agenta są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Ostateczna odpowiedź zakończenia (`status:"ok"|"error"`), z przesyłanymi strumieniowo zdarzeniami `agent` pomiędzy nimi.

Zobacz pełną dokumentację protokołu: [Protokół Gateway](/pl/gateway/protocol).

## Kontrole operacyjne

### Żywotność

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` ze snapshotem.

### Gotowość

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odtwarzanie po lukach

Zdarzenia nie są odtwarzane ponownie. Przy lukach sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                     | Prawdopodobny problem                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania gateway        |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                   |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb zdalny lub brak znacznika trybu lokalnego w uszkodzonej konfiguracji |
| `unauthorized` during connect                                 | Niezgodność uwierzytelniania między klientem a gateway                           |

Aby uzyskać pełne sekwencje diagnostyczne, użyj [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway kończą działanie szybko, gdy Gateway jest niedostępny (bez niejawnego bezpośredniego fallbacku kanału).
- Nieprawidłowe/pierwsze ramki inne niż `connect` są odrzucane i połączenie jest zamykane.
- Uprzejme zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Stan zdrowia](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)
