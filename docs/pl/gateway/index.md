---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Instrukcja operacyjna dla usługi Gateway, jej cyklu życia i operacji
title: Procedura operacyjna Gateway
x-i18n:
    generated_at: "2026-05-06T09:12:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Użyj tej strony do uruchomienia w dniu 1 i operacji w dniu 2 dla usługi Gateway.

<CardGroup cols={2}>
  <Card title="Głębokie rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka od objawu z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Zadaniowy przewodnik konfiguracji + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` i zachowanie profilu uwierzytelniania wyłącznie przez referencje.
  </Card>
</CardGroup>

## 5-minutowe uruchomienie lokalne

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

Zdrowa wartość bazowa: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...`, które odpowiadają Twoim oczekiwaniom. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz dowodu RPC w zakresie odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym gateway uruchamia to aktywne sondy kanałów dla poszczególnych kont oraz opcjonalne audyty.
Jeśli gateway jest nieosiągalny, CLI przełącza się na podsumowania kanałów wyłącznie z konfiguracji zamiast
wyniku aktywnej sondy.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje aktywną ścieżkę pliku konfiguracji (ustaloną z domyślnych wartości profilu/stanu albo z `OPENCLAW_CONFIG_PATH`, gdy jest ustawiona).
Domyślny tryb to `gateway.reload.mode="hybrid"`.
Po pierwszym pomyślnym wczytaniu działający proces obsługuje aktywną migawkę konfiguracji w pamięci; pomyślne przeładowanie podmienia tę migawkę atomowo.
</Note>

## Model środowiska uruchomieniowego

- Jeden stale działający proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Jeden multipleksowany port dla:
  - sterowania/RPC przez WebSocket
  - interfejsów API HTTP, zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (albo
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje
  reverse proxy poza loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

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

- `/v1/models` jest zorientowany najpierw na agentów: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje na skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać backendowego dostawcę/model; w przeciwnym razie kontrolę zachowuje normalny model i konfiguracja embeddingów wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej zaufanej granicy uwierzytelniania operatora co reszta interfejsu HTTP API Gateway.

### Priorytet portu i bindowania

| Ustawienie   | Kolejność rozstrzygania                                      |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bind    | CLI/nadpisanie → `gateway.bind` → `loopback`                  |

Zainstalowane usługi gateway zapisują rozstrzygnięty `--port` w metadanych nadzorcy. Po zmianie `gateway.port` uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, aby launchd/systemd/schtasks uruchamiały proces na nowym porcie.

Uruchomienie Gateway używa tego samego efektywnego portu i bindowania, gdy zasila lokalne
źródła Control UI dla bindów poza loopback. Na przykład `--bind lan --port 3000`
zasila `http://localhost:3000` i `http://127.0.0.1:3000` przed uruchomieniem
walidacji środowiska uruchomieniowego. Jawnie dodaj wszystkie zdalne źródła przeglądarki, takie jak adresy URL proxy HTTPS, do
`gateway.controlUi.allowedOrigins`.

### Tryby gorącego przeładowania

| `gateway.reload.mode` | Zachowanie                                      |
| --------------------- | ----------------------------------------------- |
| `off`                 | Brak przeładowania konfiguracji                 |
| `hot`                 | Zastosuj tylko zmiany bezpieczne na gorąco      |
| `restart`             | Uruchom ponownie przy zmianach wymagających przeładowania |
| `hybrid` (domyślnie)  | Zastosuj na gorąco, gdy bezpieczne; uruchom ponownie, gdy wymagane |

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

Większość instalacji powinna uruchamiać jeden gateway na maszynę. Pojedynczy gateway może obsługiwać wiele
agentów i kanałów.

Potrzebujesz wielu gatewayów tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego oczekiwać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy nadal istnieją przestarzałe instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli to zamierzone, odizoluj porty, konfigurację/stan i katalogi główne obszarów roboczych dla każdego gateway.

Lista kontrolna dla instancji:

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
Opcja awaryjna: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie podłącz klientów lokalnie do `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania gateway. Przy uwierzytelnianiu ze współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password`, nawet przez tunel. W trybach przenoszących tożsamość
żądanie nadal musi spełnić tę ścieżkę uwierzytelniania.
</Warning>

Zobacz: [Zdalny Gateway](/pl/gateway/remote), [Uwierzytelnianie](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Używaj nadzorowanych uruchomień dla niezawodności zbliżonej do produkcyjnej.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Używaj `openclaw gateway restart` do ponownych uruchomień. Nie łącz `openclaw gateway stop` i `openclaw gateway start`; na macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślna) albo `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

  </Tab>

  <Tab title="Linux (użytkownik systemd)">

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

Natywny zarządzany start Windows używa Zaplanowanego zadania o nazwie `OpenClaw Gateway`
(albo `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie Zaplanowanego zadania
zostanie odmówione, OpenClaw przełącza się na launcher w folderze Autostart użytkownika,
który wskazuje `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/stale działających.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co jednostka użytkownika, ale zainstaluj ją pod
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli Twój plik binarny `openclaw` znajduje się gdzie indziej.

Nie pozwalaj jednocześnie, aby `openclaw doctor --fix` zainstalował usługę gateway na poziomie użytkownika dla tego samego profilu/portu. Doctor odmawia tej automatycznej instalacji, gdy znajdzie usługę Gateway OpenClaw na poziomie systemowym; użyj `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy jednostka systemowa zarządza cyklem życia.

  </Tab>
</Tabs>

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne wartości obejmują odizolowany stan/konfigurację i bazowy port gateway `19001`.

## Szybka dokumentacja protokołu (widok operatora)

- Pierwsza ramka klienta musi być `connect`.
- Gateway zwraca migawkę `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź ukończenia (`status:"ok"|"error"`), z przesyłanymi strumieniowo zdarzeniami `agent` pomiędzy.

Zobacz pełną dokumentację protokołu: [Protokół Gateway](/pl/gateway/protocol).

## Kontrole operacyjne

### Żywotność

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` z migawką.

### Gotowość

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie po lukach

Zdarzenia nie są odtwarzane. Przy lukach sekwencji odśwież stan (`health`, `system-presence`) przed kontynuowaniem.

## Typowe sygnatury awarii

| Sygnatura                                                      | Prawdopodobny problem                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind poza loopback bez prawidłowej ścieżki uwierzytelniania gateway           |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguracja ustawiona na tryb zdalny albo w uszkodzonej konfiguracji brakuje znacznika trybu lokalnego |
| `unauthorized` podczas connect                                | Niezgodność uwierzytelniania między klientem a gateway                        |

Pełne sekwencje diagnostyczne znajdziesz w [Rozwiązywaniu problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway zgłaszają błąd od razu, gdy Gateway jest niedostępny (bez niejawnego przełączania awaryjnego na kanał bezpośredni).
- Nieprawidłowe pierwsze ramki albo pierwsze ramki inne niż connect są odrzucane i zamykane.
- Kontrolowane zamykanie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Stan](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
