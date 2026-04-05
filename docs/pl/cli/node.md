---
read_when:
    - Uruchamianie bezgłowego hosta węzła
    - Parowanie węzła spoza macOS dla system.run
summary: Dokumentacja CLI dla `openclaw node` (bezgłowego hosta węzła)
title: węzeł
x-i18n:
    generated_at: "2026-04-05T13:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Uruchamia **bezgłowego hosta węzła**, który łączy się z WebSocketem Gateway i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego warto używać hosta węzła?

Użyj hosta węzła, jeśli chcesz, aby agenty **uruchamiały polecenia na innych maszynach** w Twojej
sieci bez instalowania tam pełnej aplikacji towarzyszącej dla macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwerach buildów, maszynach laboratoryjnych, NAS-ach).
- Utrzymanie **piaskownicowego** wykonywania na bramie, ale delegowanie zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezgłowego celu wykonywania dla automatyzacji lub węzłów CI.

Wykonywanie jest nadal chronione przez **zatwierdzenia wykonania** i listy dozwolonych agentów na
hoście węzła, dzięki czemu możesz zachować jawny i ograniczony zakres dostępu do poleceń.

## Proxy przeglądarki (bez konfiguracji)

Hosty węzłów automatycznie ogłaszają proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Dzięki temu agent może używać automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia standardową powierzchnię profilu przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
kierowanie do profili spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
trwałych profili są blokowane przez proxy.

W razie potrzeby wyłącz je na węźle:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Uruchamianie (na pierwszym planie)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła

## Uwierzytelnianie Gateway dla hosta węzła

`openclaw node run` i `openclaw node install` rozwiązują uwierzytelnianie Gateway z config/env (bez flag `--token`/`--password` w poleceniach węzła):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie używany jest lokalny config zapasowy: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie uwierzytelniania węzła kończy się trybem fail-closed (bez maskującego zdalnego fallbacku).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również kwalifikują się zgodnie z regułami pierwszeństwa dla trybu zdalnego.
- Rozwiązywanie uwierzytelniania hosta węzła uwzględnia tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

## Usługa (w tle)

Zainstaluj bezgłowego hosta węzła jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła
- `--runtime <runtime>`: środowisko uruchomieniowe usługi (`node` lub `bun`)
- `--force`: zainstaluj ponownie/nadpisz, jeśli już zainstalowano

Zarządzanie usługą:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta węzła uruchomionego na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla wyniku czytelnego maszynowo.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie parowania urządzenia (`role: node`) w Gateway.
Zatwierdź je za pomocą:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli węzeł ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Host węzła przechowuje identyfikator węzła, token, nazwę wyświetlaną oraz informacje o połączeniu z Gateway w
`~/.openclaw/node.json`.

## Zatwierdzenia wykonania

`system.run` jest kontrolowane przez lokalne zatwierdzenia wykonania:

- `~/.openclaw/exec-approvals.json`
- [Zatwierdzenia wykonania](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego wykonania węzła OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze zatwierdzone przekazanie `system.run` ponownie wykorzystuje ten zapisany
plan, więc zmiany w polach command/cwd/session po utworzeniu żądania zatwierdzenia
są odrzucane zamiast zmieniać to, co węzeł wykonuje.
