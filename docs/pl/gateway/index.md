---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Runbook usługi Gateway, cyklu życia i operacji
title: Procedura operacyjna Gateway
x-i18n:
    generated_at: "2026-05-10T19:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Użyj tej strony do uruchomienia usługi Gateway w dniu 1 oraz operacji w dniu 2.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka od objawu z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Zadaniowy przewodnik konfiguracji + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego oraz operacje migrate/reload.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły celu/ścieżki `secrets apply` oraz zachowanie profilu uwierzytelniania tylko przez odwołania.
  </Card>
</CardGroup>

## 5-minutowe uruchomienie lokalne

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Zdrowa baza: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz dowodu RPC w zakresie odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Przy osiągalnym Gateway uruchamia to sondy kanałów na żywo dla każdego konta oraz opcjonalne audyty.
Jeśli Gateway jest nieosiągalny, CLI zamiast wyników sond na żywo wraca do podsumowań kanałów tylko na podstawie konfiguracji.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje aktywną ścieżkę pliku konfiguracji (rozwiązaną z domyślnych ustawień profilu/stanu albo z `OPENCLAW_CONFIG_PATH`, gdy jest ustawione).
Domyślny tryb to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym wczytaniu działający proces obsługuje aktywną migawkę konfiguracji w pamięci; udane przeładowanie atomowo podmienia tę migawkę.
</Note>

## Model środowiska uruchomieniowego

- Jeden stale działający proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Pojedynczy multipleksowany port dla:
  - sterowania/RPC przez WebSocket
  - API HTTP zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - interfejsu sterowania i hooków
- Domyślny tryb wiązania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (albo
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy poza loopback
  mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

Najważniejsza powierzchnia zgodności OpenClaw to teraz:

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

- `/v1/models` jest ukierunkowane na agenty: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje się na skonfigurowanego agenta domyślnego.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać dostawcę/model backendu; w przeciwnym razie wybrany agent zachowuje kontrolę nad swoim zwykłym modelem i konfiguracją embeddingów.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej granicy zaufanego uwierzytelniania operatora co reszta API HTTP Gateway.

### Priorytet portu i wiązania

| Ustawienie   | Kolejność rozwiązywania                                      |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb wiązania | CLI/override → `gateway.bind` → `loopback`                    |

Zainstalowane usługi Gateway zapisują rozwiązany `--port` w metadanych nadzorcy. Po zmianie `gateway.port` uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, aby launchd/systemd/schtasks uruchamiał proces na nowym porcie.

Uruchomienie Gateway używa tego samego efektywnego portu i wiązania, gdy inicjuje lokalne
źródła interfejsu sterowania dla wiązań poza loopback. Na przykład `--bind lan --port 3000`
inicjuje `http://localhost:3000` i `http://127.0.0.1:3000`, zanim zostanie uruchomiona
walidacja środowiska uruchomieniowego. Dodaj jawnie wszelkie źródła zdalnych przeglądarek,
takie jak adresy URL proxy HTTPS, do `gateway.controlUi.allowedOrigins`.

### Tryby gorącego przeładowania

| `gateway.reload.mode` | Zachowanie                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Brak przeładowania konfiguracji            |
| `hot`                 | Zastosuj tylko zmiany bezpieczne na gorąco |
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

## Wiele Gateway (ten sam host)

Większość instalacji powinna uruchamiać jeden Gateway na maszynę. Pojedynczy Gateway może obsługiwać wiele
agentów i kanałów.

Wiele Gateway jest potrzebnych tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego oczekiwać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy przestarzałe instalacje launchd/systemd/schtasks nadal istnieją.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli to celowe, izoluj porty, konfigurację/stan i katalogi główne obszarów roboczych dla każdego Gateway.

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
Awaryjnie: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie podłącz klientów lokalnie do `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania Gateway. W przypadku uwierzytelniania ze współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach przenoszących tożsamość
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

Używaj `openclaw gateway restart` do ponownych uruchomień. Nie łącz `openclaw gateway stop` i `openclaw gateway start` jako zamiennika restartu.

Na macOS `gateway stop` domyślnie używa `launchctl bootout` — usuwa to LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączenia, więc automatyczne odzyskiwanie KeepAlive nadal działa po nieoczekiwanych awariach, a `gateway start` ponownie włącza usługę czysto. Aby trwale zatrzymać automatyczne ponowne uruchamianie między restartami systemu, przekaż `--disable`: `openclaw gateway stop --disable`.

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślnie) albo `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia rozjazdy konfiguracji usługi.

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

Natywne zarządzane uruchamianie w Windows używa Zaplanowanego zadania o nazwie `OpenClaw Gateway`
(albo `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie Zaplanowanego zadania
zostanie odrzucone, OpenClaw wróci do per-user launchera w folderze Autostart,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (system service)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/stale działających.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co jednostka użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli plik binarny `openclaw` znajduje się gdzie indziej.

Nie pozwalaj jednocześnie, aby `openclaw doctor --fix` instalował usługę Gateway na poziomie użytkownika dla tego samego profilu/portu. Doctor odmawia takiej automatycznej instalacji, gdy znajdzie usługę OpenClaw Gateway na poziomie systemowym; użyj `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy jednostka systemowa zarządza cyklem życia.

  </Tab>
</Tabs>

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Wartości domyślne obejmują izolowany stan/konfigurację oraz bazowy port Gateway `19001`.

## Szybka referencja protokołu (widok operatora)

- Pierwsza ramka klienta musi być `connect`.
- Gateway zwraca migawkę `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej możliwej do wywołania trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź zakończenia (`status:"ok"|"error"`), z przesyłanymi po drodze zdarzeniami `agent`.

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

Zdarzenia nie są odtwarzane. Przy lukach w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                      | Prawdopodobny problem                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Powiązanie spoza pętli zwrotnej bez prawidłowej ścieżki uwierzytelniania Gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguracja ustawiona na tryb zdalny albo w uszkodzonej konfiguracji brakuje znacznika trybu lokalnego |
| `unauthorized` during connect                                  | Niezgodność uwierzytelniania między klientem a Gateway                           |

Pełne ścieżki diagnostyczne znajdziesz w [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway szybko kończą działanie, gdy Gateway jest niedostępny (bez niejawnego przełączania awaryjnego bezpośrednio na kanał).
- Nieprawidłowe pierwsze ramki lub pierwsze ramki bez połączenia są odrzucane i zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Stan](/pl/gateway/health)
- [Diagnostyka](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
