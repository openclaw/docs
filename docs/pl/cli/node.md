---
read_when:
    - Uruchamianie bezgłowego hosta Node.
    - Parowanie node innego niż macOS dla `system.run`
summary: Dokumentacja CLI dla `openclaw node` (bezgłowy host Node)
title: Node
x-i18n:
    generated_at: "2026-04-24T09:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Uruchom **bezgłowy host Node**, który łączy się z Gateway WebSocket i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego warto używać hosta Node?

Użyj hosta Node, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach** w twojej
sieci bez instalowania pełnej aplikacji pomocniczej macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwery buildów, maszyny labowe, NAS).
- Zachowanie exec w trybie **sandboxed** na gateway, ale delegowanie zatwierdzonych uruchomień na inne hosty.
- Udostępnienie lekkiego, bezgłowego celu wykonania dla automatyzacji lub węzłów CI.

Wykonywanie jest nadal chronione przez **zatwierdzenia exec** i listy dozwolonych per agent na
hoście Node, dzięki czemu dostęp do poleceń pozostaje ograniczony i jawny.

## Proxy przeglądarki (zero-config)

Hosty Node automatycznie deklarują proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na node. Dzięki temu agent może używać automatyzacji przeglądarki na tym node
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia standardową powierzchnię profilu przeglądarki node. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
celowanie w profile spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
trwałych profili są blokowane przez proxy.

W razie potrzeby wyłącz je na node:

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

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: używa TLS dla połączenia z gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisuje identyfikator node (czyści token parowania)
- `--display-name <name>`: nadpisuje nazwę wyświetlaną node

## Uwierzytelnianie Gateway dla hosta Node

`openclaw node run` i `openclaw node install` rozwiązują uwierzytelnianie gateway z config/env (polecenia node nie mają flag `--token`/`--password`):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie fallback do lokalnej konfiguracji: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nie zostaną rozwiązane, rozwiązywanie uwierzytelniania node kończy się zamknięciem awaryjnym (bez maskującego zdalnego fallbacku).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również kwalifikują się zgodnie z regułami pierwszeństwa trybu zdalnego.
- Rozwiązywanie uwierzytelniania hosta Node uwzględnia tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

Dla node łączącego się z nie-loopbackowym `ws://` Gateway w zaufanej prywatnej
sieci ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Bez tego start node kończy się
zamknięciem awaryjnym i prośbą o użycie `wss://`, tunelu SSH albo Tailscale.
Jest to zgoda przez zmienną środowiskową procesu, a nie klucz konfiguracji `openclaw.json`.
`openclaw node install` zapisuje ją w nadzorowanej usłudze node, jeśli jest
obecna w środowisku polecenia instalacji.

## Usługa (w tle)

Zainstaluj bezgłowy host Node jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: używa TLS dla połączenia z gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisuje identyfikator node (czyści token parowania)
- `--display-name <name>`: nadpisuje nazwę wyświetlaną node
- `--runtime <runtime>`: runtime usługi (`node` albo `bun`)
- `--force`: reinstaluje/nadpisuje, jeśli już zainstalowano

Zarządzanie usługą:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta Node na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla czytelnego dla maszyn wyjścia.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie parowania urządzenia (`role: node`) na Gateway.
Zatwierdź je przez:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli node ponowi próbę parowania ze zmienionymi danymi uwierzytelnienia (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Host Node przechowuje swój identyfikator node, token, nazwę wyświetlaną i informacje o połączeniu z gateway w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest chronione przez lokalne zatwierdzenia exec:

- `~/.openclaw/exec-approvals.json`
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego exec na node OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze przekazanie zatwierdzonego `system.run` używa ponownie tego zapisanego
planu, więc edycje pól command/cwd/session po utworzeniu żądania zatwierdzenia są odrzucane zamiast zmieniać to, co node wykona.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Node](/pl/nodes)
