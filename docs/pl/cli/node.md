---
read_when:
    - Uruchamianie bezgłowego hosta Node
    - Parowanie węzła innego niż macOS dla system.run
summary: Dokumentacja CLI dla `openclaw node` (bezgłowy host węzła)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:21:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Uruchom **bezgłowego hosta węzła**, który łączy się z Gateway WebSocket i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego używać hosta węzła?

Użyj hosta węzła, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach** w Twojej
sieci bez instalowania tam pełnej aplikacji towarzyszącej dla macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwerach buildów, maszynach laboratoryjnych, NAS).
- Utrzymanie exec **w piaskownicy** na Gateway, ale delegowanie zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezgłowego celu wykonywania dla automatyzacji lub węzłów CI.

Wykonywanie nadal jest chronione przez **zatwierdzenia exec** i listy dozwolonych na agenta na
hoście węzła, więc możesz utrzymać dostęp do poleceń w określonym zakresie i jawny.

## Proxy przeglądarki (bez konfiguracji)

Hosty węzłów automatycznie ogłaszają proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Pozwala to agentowi używać automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia normalną powierzchnię profilu przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
kierowanie na profile spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
profili trwałych są blokowane przez proxy.

Wyłącz je na węźle, jeśli to potrzebne:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Uruchomienie (pierwszy plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk palca certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp id węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła

## Uwierzytelnianie Gateway dla hosta węzła

`openclaw node run` i `openclaw node install` rozpoznają uwierzytelnianie Gateway z config/env (bez flag `--token`/`--password` w poleceniach węzła):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` są sprawdzane jako pierwsze.
- Następnie lokalny fallback konfiguracji: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozpoznawanie uwierzytelniania węzła kończy się zamknięciem bez dostępu (bez maskowania przez zdalny fallback).
- W `gateway.mode=remote` pola zdalnego klienta (`gateway.remote.token` / `gateway.remote.password`) także kwalifikują się zgodnie z zasadami zdalnego pierwszeństwa.
- Rozpoznawanie uwierzytelniania hosta węzła uwzględnia tylko zmienne env `OPENCLAW_GATEWAY_*`.

Dla węzła łączącego się ze zwykłym tekstowym Gateway `ws://` akceptowane są loopback, prywatne literały IP,
`.local` oraz hosty Tailnet `*.ts.net`. Dla innych
zaufanych nazw private-DNS ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; bez
tego uruchomienie węzła kończy się zamknięciem bez dostępu i prosi o użycie `wss://`, tunelu SSH lub
Tailscale. Jest to opt-in przez środowisko procesu, a nie klucz konfiguracji `openclaw.json`.
`openclaw node install` utrwala go w nadzorowanej usłudze węzła, gdy jest
obecny w środowisku polecenia instalacji.

## Usługa (tło)

Zainstaluj bezgłowego hosta węzła jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk palca certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp id węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła
- `--runtime <runtime>`: runtime usługi (`node` lub `bun`)
- `--force`: zainstaluj ponownie/nadpisz, jeśli już zainstalowano

Zarządzanie usługą:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta węzła na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla danych wyjściowych czytelnych maszynowo.

Host węzła ponawia restart Gateway i zamknięcia sieciowe w obrębie procesu. Jeśli
Gateway zgłasza terminalną pauzę uwierzytelniania tokenu/hasła/bootstrap, host węzła
loguje szczegóły zamknięcia i kończy działanie z kodem niezerowym, aby launchd/systemd mógł uruchomić go ponownie ze
świeżą konfiguracją i poświadczeniami. Pauzy wymagające parowania pozostają w przepływie
pierwszego planu, aby oczekujące żądanie mogło zostać zatwierdzone.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie parowania urządzenia (`role: node`) na Gateway.
Zatwierdź je przez:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

W ściśle kontrolowanych sieciach węzłów operator Gateway może jawnie włączyć
automatyczne zatwierdzanie pierwszego parowania węzła z zaufanych CIDR:

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Klienci operatora/przeglądarki, Control UI, WebChat oraz aktualizacje roli,
zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Host węzła przechowuje swój identyfikator węzła, token, nazwę wyświetlaną i informacje o połączeniu z gateway w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest chronione przez lokalne zatwierdzenia exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` albo
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
