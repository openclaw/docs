---
read_when:
    - Uruchamianie hosta węzła bez interfejsu graficznego
    - Parowanie węzła innego niż macOS dla system.run
summary: Dokumentacja referencyjna CLI dla `openclaw node` (host Node bez interfejsu graficznego)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Uruchom **bezgłowy host węzła**, który łączy się z WebSocket Gateway i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego używać hosta węzła?

Użyj hosta węzła, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach** w Twojej
sieci bez instalowania tam pełnej aplikacji towarzyszącej dla macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwery kompilacji, maszyny laboratoryjne, NAS).
- Utrzymywanie exec w **piaskownicy** na gatewayu, ale delegowanie zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezgłowego celu wykonywania dla automatyzacji lub węzłów CI.

Wykonywanie nadal jest chronione przez **zatwierdzenia exec** oraz listy dozwolonych elementów na agenta na
hoście węzła, dzięki czemu dostęp do poleceń może pozostać ograniczony i jawny.

## Proxy przeglądarki (bez konfiguracji)

Hosty węzłów automatycznie ogłaszają proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Pozwala to agentowi używać automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia standardową powierzchnię profilu przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
kierowanie do profili spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
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
- `--tls`: użyj TLS dla połączenia z gatewayem
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp id węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła

## Uwierzytelnianie Gateway dla hosta węzła

`openclaw node run` i `openclaw node install` rozpoznają uwierzytelnianie gatewaya z config/env (brak flag `--token`/`--password` w poleceniach węzła):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` są sprawdzane jako pierwsze.
- Następnie lokalna konfiguracja zapasowa: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozpoznawanie uwierzytelniania węzła kończy się bezpieczną odmową (bez maskowania przez zdalny mechanizm zapasowy).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również kwalifikują się zgodnie z regułami priorytetu zdalnego.
- Rozpoznawanie uwierzytelniania hosta węzła honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

Dla węzła łączącego się z nieloopbackowym Gateway `ws://` w zaufanej sieci prywatnej
ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Bez tego uruchomienie węzła
kończy się bezpieczną odmową i prosi o użycie `wss://`, tunelu SSH albo Tailscale.
To zgoda na poziomie środowiska procesu, a nie klucz konfiguracji `openclaw.json`.
`openclaw node install` utrwala ją w nadzorowanej usłudze węzła, gdy jest
obecna w środowisku polecenia instalacji.

## Usługa (tło)

Zainstaluj bezgłowy host węzła jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z gatewayem
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp id węzła (czyści token parowania)
- `--display-name <name>`: zastąp nazwę wyświetlaną węzła
- `--runtime <runtime>`: środowisko uruchomieniowe usługi (`node` albo `bun`)
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

Polecenia usługi akceptują `--json` dla wyjścia czytelnego maszynowo.

Host węzła ponawia restart Gateway i zamknięcia sieciowe w procesie. Jeśli
Gateway zgłosi terminalną pauzę uwierzytelniania tokenem/hasłem/bootstrapem, host węzła
zapisuje szczegóły zamknięcia w logu i kończy działanie z niezerowym kodem, aby launchd/systemd mógł go uruchomić ponownie ze
świeżą konfiguracją i poświadczeniami. Pauzy wymagające parowania pozostają w przepływie
pierwszoplanowym, aby oczekujące żądanie mogło zostać zatwierdzone.

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Klienci operatora/przeglądarki, Control UI, WebChat oraz ulepszenia roli,
zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponowi parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Host węzła przechowuje swój id węzła, token, nazwę wyświetlaną oraz informacje o połączeniu z gatewayem w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest bramkowane przez lokalne zatwierdzenia exec:

- `~/.openclaw/exec-approvals.json`
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego exec węzła OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze zatwierdzone przekazanie `system.run` ponownie używa tego zapisanego
planu, więc edycje pól command/cwd/session po utworzeniu żądania zatwierdzenia
są odrzucane zamiast zmieniać to, co wykonuje węzeł.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
