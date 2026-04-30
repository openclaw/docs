---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Instrukcja operacyjna dla usługi Gateway, cyklu życia i operacji
title: Procedura operacyjna Gateway
x-i18n:
    generated_at: "2026-04-30T09:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Użyj tej strony do uruchomienia Gateway pierwszego dnia oraz operacji drugiego dnia dla usługi Gateway.

<CardGroup cols={2}>
  <Card title="Głębokie rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka według objawów z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Zadaniowy przewodnik konfiguracji + pełna dokumentacja ustawień.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego oraz operacje migracji/ponownego ładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie profilu uwierzytelniania tylko z odwołaniami.
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

Zdrowa wartość bazowa: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz dowodu RPC z zakresem odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym gateway uruchamia to aktywne sondy kanałów dla każdego konta oraz opcjonalne audyty.
Jeśli gateway jest nieosiągalny, CLI przełącza się na podsumowania kanałów tylko z konfiguracji zamiast
wyniku aktywnej sondy.

  </Step>
</Steps>

<Note>
Ponowne ładowanie konfiguracji Gateway obserwuje aktywną ścieżkę pliku konfiguracji (ustalaną z domyślnych wartości profilu/stanu albo z `OPENCLAW_CONFIG_PATH`, gdy jest ustawiona).
Domyślny tryb to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym wczytaniu działający proces obsługuje aktywną migawkę konfiguracji w pamięci; udane ponowne ładowanie atomowo podmienia tę migawkę.
</Note>

## Model środowiska uruchomieniowego

- Jeden stale działający proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Jeden multipleksowany port dla:
  - Sterowania/RPC przez WebSocket
  - HTTP API zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze wspólnym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (albo
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy poza loopback
  mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

Najbardziej użyteczna powierzchnia zgodności OpenClaw obejmuje teraz:

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

- `/v1/models` stawia agenta na pierwszym miejscu: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje się na skonfigurowanego domyślnego agenta.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać backendowego dostawcę/model; w przeciwnym razie normalna konfiguracja modelu i embeddingów wybranego agenta pozostaje nadrzędna.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej zaufanej granicy uwierzytelniania operatora co reszta Gateway HTTP API.

### Priorytet portu i bindowania

| Ustawienie   | Kolejność rozwiązywania                                      |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bind    | CLI/override → `gateway.bind` → `loopback`                    |

Zainstalowane usługi gateway zapisują ustalony `--port` w metadanych nadzorcy. Po zmianie `gateway.port` uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, aby launchd/systemd/schtasks uruchamiał proces na nowym porcie.

Uruchamianie Gateway używa tego samego efektywnego portu i bind, gdy zasila lokalne
źródła Control UI dla bindów poza loopback. Na przykład `--bind lan --port 3000`
dodaje `http://localhost:3000` i `http://127.0.0.1:3000`, zanim uruchomi się
walidacja środowiska uruchomieniowego. Dodaj jawnie wszystkie zdalne źródła przeglądarki, takie jak URL-e proxy HTTPS, do
`gateway.controlUi.allowedOrigins`.

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                |
| --------------------- | ------------------------------------------ |
| `off`                 | Brak ponownego ładowania konfiguracji      |
| `hot`                 | Zastosuj tylko zmiany bezpieczne na gorąco |
| `restart`             | Uruchom ponownie przy zmianach wymagających restartu |
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

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/systemd system
units/schtasks), a nie do głębszej sondy kondycji RPC.

## Wiele gateway (ten sam host)

Większość instalacji powinna uruchamiać jeden gateway na maszynę. Jeden gateway może obsługiwać wiele
agentów i kanałów.

Wiele gateway jest potrzebnych tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać podpowiedzi czyszczenia, gdy wciąż istnieją przestarzałe instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli to celowe, izoluj porty, konfigurację/stan i katalogi główne obszarów roboczych dla każdego gateway.

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

## Endpoint mózgu czasu rzeczywistego VoiceClaw

OpenClaw udostępnia zgodny z VoiceClaw endpoint WebSocket czasu rzeczywistego pod adresem
`/voiceclaw/realtime`. Użyj go, gdy klient desktopowy VoiceClaw ma komunikować się
bezpośrednio z mózgiem OpenClaw czasu rzeczywistego zamiast przez osobny proces
przekaźnika.

Endpoint używa Gemini Live do dźwięku w czasie rzeczywistym i wywołuje OpenClaw jako
mózg, udostępniając narzędzia OpenClaw bezpośrednio Gemini Live. Wywołania narzędzi zwracają
natychmiastowy wynik `working`, aby utrzymać responsywność tury głosowej, a następnie OpenClaw
wykonuje rzeczywiste narzędzie asynchronicznie i wstrzykuje wynik z powrotem do
sesji live. Ustaw `GEMINI_API_KEY` w środowisku procesu gateway. Jeśli
uwierzytelnianie gateway jest włączone, klient desktopowy wysyła token albo hasło gateway
w pierwszej wiadomości `session.config`.

Dostęp do mózgu czasu rzeczywistego uruchamia autoryzowane przez właściciela polecenia agenta OpenClaw. Ogranicz
`gateway.auth.mode: "none"` do testowych instancji tylko loopback. Nielokalne
połączenia z mózgiem czasu rzeczywistego wymagają uwierzytelniania gateway.

Dla izolowanego testowego gateway uruchom osobną instancję z własnym portem, konfiguracją
i stanem:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Następnie skonfiguruj VoiceClaw, aby używał:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Opcja awaryjna: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie podłącz klientów lokalnie do `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania gateway. Przy uwierzytelnianiu ze wspólnym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach z tożsamością
żądanie nadal musi spełnić wymogi tej ścieżki uwierzytelniania.
</Warning>

Zobacz: [Zdalny Gateway](/pl/gateway/remote), [Uwierzytelnianie](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Używaj uruchomień nadzorowanych dla niezawodności podobnej do produkcyjnej.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Używaj `openclaw gateway restart` do restartów. Nie łącz `openclaw gateway stop` i `openclaw gateway start`; w macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślna) albo `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

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

Natywne zarządzane uruchamianie Windows używa zaplanowanego zadania o nazwie `OpenClaw Gateway`
(albo `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie zaplanowanego zadania
zostanie odrzucone, OpenClaw przełącza się na per-user launcher w folderze Startup,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/stale włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co w jednostce użytkownika, ale zainstaluj ją pod
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli plik binarny `openclaw` znajduje się gdzie indziej.

Nie pozwól jednocześnie, aby `openclaw doctor --fix` zainstalował usługę gateway na poziomie użytkownika dla tego samego profilu/portu. Doctor odmawia takiej automatycznej instalacji, gdy znajdzie usługę gateway OpenClaw na poziomie systemowym; użyj `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy jednostka systemowa odpowiada za cykl życia.

  </Tab>
</Tabs>

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne ustawienia obejmują izolowany stan/konfigurację i bazowy port gateway `19001`.

## Szybka dokumentacja protokołu (widok operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca migawkę `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź ukończenia (`status:"ok"|"error"`), ze strumieniowanymi zdarzeniami `agent` pomiędzy.

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

Zdarzenia nie są odtwarzane ponownie. W przypadku luk w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                      | Prawdopodobny problem                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Powiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguracja ustawiona na tryb zdalny albo w uszkodzonej konfiguracji brakuje znacznika trybu lokalnego |
| `unauthorized` during connect                                  | Niezgodność uwierzytelniania między klientem a Gateway                         |

Pełne ścieżki diagnostyczne znajdziesz w [Rozwiązywaniu problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway szybko kończą działanie, gdy Gateway jest niedostępny (bez niejawnego powrotu do bezpośredniego kanału).
- Nieprawidłowe pierwsze ramki lub pierwsze ramki inne niż connect są odrzucane, a połączenie jest zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

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
