---
read_when:
    - Uruchamianie bezgłowego hosta Node
    - Parowanie węzła innego niż macOS dla system.run
summary: Dokumentacja CLI dla `openclaw node` (bezgłowy host węzła)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:23:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Uruchom **bezgłowego hosta węzła**, który łączy się z WebSocket Gateway i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego używać hosta węzła?

Użyj hosta węzła, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach** w Twojej
sieci bez instalowania tam pełnej aplikacji towarzyszącej dla macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwerach kompilacji, maszynach laboratoryjnych, NAS).
- Utrzymanie exec **w piaskownicy** na bramie, ale delegowanie zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezgłowego celu wykonywania dla automatyzacji lub węzłów CI.

Wykonywanie nadal jest chronione przez **zatwierdzenia exec** i listy dozwolonych dla poszczególnych agentów na
hoście węzła, dzięki czemu dostęp do poleceń może pozostać ograniczony i jawny.

## Proxy przeglądarki (zero-config)

Hosty węzłów automatycznie ogłaszają proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Pozwala to agentowi używać automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia normalną powierzchnię profilu przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
kierowanie na profile spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
trwałych profili są blokowane przez proxy.

W razie potrzeby wyłącz to na węźle:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Uruchamianie (pierwszy plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--context-path <path>`: ścieżka kontekstu WebSocket Gateway (np. `/openclaw-gw`). Dołączana do adresu URL WebSocket.
- `--tls`: użyj TLS dla połączenia z bramą
- `--tls-fingerprint <sha256>`: oczekiwany odcisk palca certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator węzła (czyści token parowania)
- `--display-name <name>`: zastąp wyświetlaną nazwę węzła

## Uwierzytelnianie Gateway dla hosta węzła

`openclaw node run` i `openclaw node install` rozwiązują uwierzytelnianie Gateway z konfiguracji/zmiennych środowiskowych (brak flag `--token`/`--password` w poleceniach węzła):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` są sprawdzane jako pierwsze.
- Następnie lokalna konfiguracja awaryjna: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie uwierzytelniania węzła kończy się zamknięciem odmownym (bez maskowania przez zdalną konfigurację awaryjną).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) także kwalifikują się zgodnie z regułami zdalnego pierwszeństwa.
- Rozwiązywanie uwierzytelniania hosta węzła honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

Dla węzła łączącego się z jawnym tekstem `ws://` Gateway akceptowane są hosty local loopback, literały
prywatnych adresów IP, `.local` i Tailnet `*.ts.net`. Dla innych
zaufanych nazw prywatnego DNS ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; bez
tego uruchomienie węzła kończy się zamknięciem odmownym i prosi o użycie `wss://`, tunelu SSH lub
Tailscale. To jest zgoda na poziomie środowiska procesu, a nie klucz konfiguracji
`openclaw.json`.
`openclaw node install` utrwala ją w nadzorowanej usłudze węzła, gdy jest
obecna w środowisku polecenia instalacji.

## Usługa (tło)

Zainstaluj bezgłowego hosta węzła jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--context-path <path>`: ścieżka kontekstu WebSocket Gateway (np. `/openclaw-gw`). Dołączana do adresu URL WebSocket.
- `--tls`: użyj TLS dla połączenia z bramą
- `--tls-fingerprint <sha256>`: oczekiwany odcisk palca certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator węzła (czyści token parowania)
- `--display-name <name>`: zastąp wyświetlaną nazwę węzła
- `--runtime <runtime>`: środowisko uruchomieniowe usługi (`node` lub `bun`)
- `--force`: zainstaluj ponownie/zastąp, jeśli już zainstalowano

Zarządzanie usługą:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta węzła działającego na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla wyjścia czytelnego maszynowo.

Host węzła ponawia restart Gateway i zamknięcia sieciowe w ramach procesu. Jeśli
Gateway zgłosi terminalną pauzę uwierzytelniania tokenem/hasłem/bootstrap, host węzła
rejestruje szczegóły zamknięcia i kończy działanie z kodem niezerowym, aby launchd/systemd mogły uruchomić go ponownie ze
świeżą konfiguracją i poświadczeniami. Pauzy wymagające parowania pozostają w przepływie
pierwszego planu, aby oczekujące żądanie mogło zostać zatwierdzone.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie parowania urządzenia (`role: node`) na Gateway.
Zatwierdź je przez:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

W ściśle kontrolowanych sieciach węzłów operator Gateway może jawnie wyrazić zgodę
na automatyczne zatwierdzanie pierwszego parowania węzła z zaufanych CIDR:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Jest to domyślnie wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Klienci operatora/przeglądarki, Control UI, WebChat oraz aktualizacje roli,
zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Host węzła przechowuje swój identyfikator węzła, token, wyświetlaną nazwę i informacje o połączeniu z bramą w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest bramkowane przez lokalne zatwierdzenia exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, lub
  `~/.openclaw/exec-approvals.json`, gdy zmienna nie jest ustawiona
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego exec węzła OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze zatwierdzone przekazanie `system.run` ponownie używa tego zapisanego
planu, więc edycje pól command/cwd/session po utworzeniu żądania zatwierdzenia
są odrzucane zamiast zmieniać to, co wykonuje węzeł.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
