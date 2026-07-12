---
read_when:
    - Uruchamianie hosta Node bez interfejsu graficznego
    - Parowanie węzła spoza systemu macOS na potrzeby system.run
summary: Dokumentacja CLI dla `openclaw node` (host Node bez interfejsu graficznego)
title: Node
x-i18n:
    generated_at: "2026-07-12T14:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Uruchamia **bezinterfejsowy host Node**, który łączy się z WebSocketem Gateway i udostępnia
`system.run` / `system.which` na tym komputerze.

## Dlaczego warto używać hosta Node?

Użyj hosta Node, gdy chcesz, aby agenci **uruchamiali polecenia na innych komputerach** w Twojej
sieci bez instalowania na nich pełnej aplikacji towarzyszącej dla systemu macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych komputerach z systemem Linux/Windows (serwerach kompilacji, komputerach laboratoryjnych, urządzeniach NAS).
- Utrzymywanie wykonywania poleceń w **piaskownicy** na Gateway przy jednoczesnym delegowaniu zatwierdzonych wykonań do innych hostów.
- Udostępnianie lekkiego, bezinterfejsowego środowiska docelowego wykonywania dla automatyzacji lub węzłów CI.

Wykonywanie jest nadal chronione przez **zatwierdzenia wykonywania** i listy dozwolonych poleceń poszczególnych agentów na
hoście Node, dzięki czemu dostęp do poleceń może mieć ograniczony i jawnie określony zakres.

Po nawiązaniu połączenia `openclaw node run` może publikować narzędzia oparte na pluginach lub MCP.
Gateway domyślnie ufa deskryptorom sparowanego Node, wymagając jednocześnie,
aby polecenie każdego deskryptora pozostawało w zatwierdzonym zakresie poleceń Node.
Agent widzi każdy zaakceptowany deskryptor jako zwykłe narzędzie plugina, ale wykonanie nadal
odbywa się przez `node.invoke`, więc odłączenie Node usuwa narzędzie z nowych
uruchomień agenta. Operatorzy Gateway mogą wyłączyć publikowanie za pomocą
`gateway.nodes.pluginTools.enabled: false`.

W przypadku deklaratywnych narzędzi MCP dodaj standardową strukturę serwera MCP w
`nodeHost.mcp.servers` w pliku `openclaw.json` na komputerze Node, a następnie uruchom ponownie
host Node. Node deklaruje rodzinę poleceń `mcp.tools.call.v1` chronioną zatwierdzeniami
i publikuje wymienione narzędzia po nawiązaniu połączenia; późniejsza zmiana listy serwerów
nie wymaga ponownego parowania. Zobacz
[Serwery MCP hostowane przez Node](/pl/nodes#node-hosted-mcp-servers).

## Proxy przeglądarki (bez konfiguracji)

Hosty Node automatycznie ogłaszają proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na Node. Pozwala to agentowi korzystać z automatyzacji przeglądarki na tym Node
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia standardowy zakres profili przeglądarki Node. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy zacznie stosować ograniczenia:
wybieranie profili spoza listy dozwolonych będzie odrzucane, a trasy tworzenia i usuwania
trwałych profili zostaną zablokowane przez proxy.

W razie potrzeby wyłącz je na Node:

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

- `--host <host>`: host WebSocketu Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocketu Gateway (domyślnie: `18789`)
- `--context-path <path>`: ścieżka kontekstu WebSocketu Gateway (np. `/openclaw-gw`). Jest dołączana do adresu URL WebSocketu.
- `--tls`: użyj TLS dla połączenia z Gateway
- `--no-tls`: wymuś nieszyfrowane połączenie z Gateway, nawet jeśli lokalna konfiguracja Gateway włącza TLS
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator instancji starszego klienta przechowywany w `node.json` (nie resetuje parowania)
- `--display-name <name>`: zastąp wyświetlaną nazwę Node

## Uwierzytelnianie hosta Node w Gateway

`openclaw node run` i `openclaw node install` ustalają dane uwierzytelniające Gateway na podstawie konfiguracji/zmiennych środowiskowych (polecenia Node nie mają flag `--token`/`--password`):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie używana jest lokalna konfiguracja awaryjna: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jawnie skonfigurowano za pomocą SecretRef i nie można ich rozpoznać, ustalanie uwierzytelniania Node kończy się bezpiecznym błędem (bez maskującego go zdalnego mechanizmu awaryjnego).
- W trybie `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również mogą być używane zgodnie z regułami pierwszeństwa dla trybu zdalnego.
- Ustalanie uwierzytelniania hosta Node uwzględnia wyłącznie zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

W przypadku Node łączącego się z Gateway przez nieszyfrowane `ws://` akceptowane są local loopback, literały prywatnych adresów IP,
`.local` oraz hosty Tailnet `*.ts.net`. W przypadku innych
zaufanych nazw prywatnego DNS ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; bez
tej zmiennej uruchamianie Node kończy się bezpiecznym błędem i wyświetla prośbę o użycie `wss://`, tunelu SSH lub
Tailscale. Jest to opcja włączana w środowisku procesu, a nie klucz konfiguracji
`openclaw.json`.
`openclaw node install` zapisuje ją w nadzorowanej usłudze Node, jeśli jest
obecna w środowisku polecenia instalacji.

## Usługa (w tle)

Zainstaluj bezinterfejsowy host Node jako usługę użytkownika (launchd w systemie macOS, systemd w
systemie Linux, Harmonogram zadań systemu Windows w systemie Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocketu Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocketu Gateway (domyślnie: `18789`)
- `--context-path <path>`: ścieżka kontekstu WebSocketu Gateway (np. `/openclaw-gw`). Jest dołączana do adresu URL WebSocketu.
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąp identyfikator instancji starszego klienta przechowywany w `node.json` (nie resetuje parowania)
- `--display-name <name>`: zastąp wyświetlaną nazwę Node
- `--runtime <runtime>`: środowisko uruchomieniowe usługi (`node` lub `bun`)
- `--force`: zainstaluj ponownie/nadpisz, jeśli usługa jest już zainstalowana

Zarządzanie usługą:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run`, aby uruchomić host Node na pierwszym planie (bez usługi).

Polecenia usługi obsługują flagę `--json`, która zapewnia dane wyjściowe możliwe do odczytu maszynowego.

Host Node ponawia połączenie wewnątrz procesu po ponownym uruchomieniu Gateway i zamknięciu połączenia sieciowego. Jeśli
Gateway zgłosi końcowe wstrzymanie uwierzytelniania z powodu tokenu/hasła/inicjalizacji, host Node
zapisze szczegóły zamknięcia w dzienniku i zakończy działanie z kodem różnym od zera, aby launchd/systemd/Harmonogram zadań
mógł uruchomić go ponownie ze zaktualizowaną konfiguracją i danymi uwierzytelniającymi. Wstrzymania wymagające parowania pozostają
w przepływie pierwszoplanowym, aby oczekujące żądanie mogło zostać zatwierdzone.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie sparowania urządzenia (`role: node`) na Gateway.

Jeśli host Gateway może połączyć się z hostem Node przez SSH bez interakcji (ten sam użytkownik,
zaufany klucz hosta), oczekujące żądanie zostaje zatwierdzone automatycznie: Gateway
uruchamia `openclaw node identity --json` na hoście Node przez SSH i zatwierdza je
w przypadku dokładnej zgodności klucza urządzenia. Ta funkcja jest domyślnie włączona; zobacz
[Automatyczne zatwierdzanie urządzeń zweryfikowanych przez SSH](/pl/gateway/pairing#ssh-verified-device-auto-approval-default),
aby poznać wymagania i sposób jej wyłączenia (`gateway.nodes.pairing.sshVerify: false`).

W przeciwnym razie zatwierdź ręcznie za pomocą:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sprawdź lokalną tożsamość Node, względem której Gateway przeprowadza weryfikację:

```bash
openclaw node identity --json
```

Polecenie wyświetla identyfikator urządzenia i klucz publiczny z `identity/device.json` i nigdy
nie tworzy ani nie modyfikuje plików tożsamości.

W ściśle kontrolowanych sieciach Node operator Gateway może jawnie włączyć
automatyczne zatwierdzanie pierwszego parowania Node z zaufanych zakresów CIDR:

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

Domyślnie ta funkcja jest wyłączona (`autoApproveCidrs` nie jest ustawione). Dotyczy wyłącznie
nowego parowania z `role: node` bez żądanych zakresów uprawnień, pochodzącego z adresu IP klienta,
któremu ufa Gateway. Klienci operatora/przeglądarki, interfejs Control UI, WebChat oraz aktualizacje roli,
zakresu uprawnień, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli Node ponowi parowanie ze zmienionymi szczegółami uwierzytelniania (rolą/zakresami uprawnień/kluczem publicznym),
poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

### Tożsamość i stan parowania

Bezinterfejsowy Node oddziela identyfikator instancji starszego klienta od podpisanej tożsamości
urządzenia, której Gateway używa do parowania i routingu. Te pliki znajdują się w
katalogu stanu OpenClaw (domyślnie `~/.openclaw` lub `$OPENCLAW_STATE_DIR`,
gdy zmienna jest ustawiona):

| Plik                        | Przeznaczenie                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Identyfikator instancji klienta w starszym kluczu `nodeId`, wyświetlana nazwa i metadane połączenia z Gateway. Klient wysyła tę wartość jako `instanceId`. |
| `identity/device.json`      | Podpisana para kluczy Ed25519 i wyprowadzony identyfikator urządzenia. W przypadku podpisanych połączeń ten identyfikator urządzenia jest identyfikatorem routowanego Node i tożsamością parowania.              |
| `identity/device-auth.json` | Tokeny sparowanego urządzenia uporządkowane według kryptograficznego identyfikatora urządzenia i roli.                                                                              |

`--node-id` zmienia wyłącznie identyfikator instancji klienta w `node.json`. Nie
zmienia kryptograficznego identyfikatora urządzenia ani nie usuwa uwierzytelniania parowania. Podobnie usunięcie wyłącznie
`node.json` nie resetuje parowania. Aby unieważnić i ponownie sparować Node:

1. Na Gateway uruchom `openclaw nodes remove --node <id|name|ip>`.
2. Na Node uruchom ponownie zainstalowaną usługę za pomocą `openclaw node restart` albo
   zatrzymaj i ponownie uruchom pierwszoplanowe polecenie `openclaw node run`. Rozpocznie to
   proces parowania urządzenia. Jeśli `openclaw devices list` nie wyświetla żądania,
   a Node zgłasza `AUTH_DEVICE_TOKEN_MISMATCH`, uruchom go ponownie jeszcze
   raz. Odrzucona próba usuwa lokalny token, który został już unieważniony; kolejna
   próba może zażądać parowania.
3. Na Gateway uruchom `openclaw devices list`, a następnie
   `openclaw devices approve <deviceRequestId>`.
4. Ponownie uruchom Node. Klient wstrzymany na czas parowania nie wznawia działania
   automatycznie po zatwierdzeniu; to ponowne połączenie tworzy oddzielne
   żądanie zakresu poleceń.
5. Na Gateway uruchom `openclaw nodes pending`, a następnie
   `openclaw nodes approve <nodeRequestId>`.

Te dwa identyfikatory żądań są odrębne. Odpowiednia zasada zaufanych zakresów CIDR może
automatycznie zatwierdzić etap pierwszego parowania urządzenia; zatwierdzenie zakresu poleceń pozostaje
oddzielną kontrolą.

Starsze wersje OpenClaw mogły pozostawiać starsze pole `token` w `node.json`.
Bieżąca wersja OpenClaw nie używa tego pola i usuwa je przy następnym zapisaniu pliku przez host
Node. Zachowaj prywatność obu plików w katalogu `identity/`; zawierają one
parę kluczy urządzenia i tokeny uwierzytelniające.

## Zatwierdzenia wykonywania

`system.run` podlega lokalnym zatwierdzeniom wykonywania:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` lub
  `~/.openclaw/exec-approvals.json`, gdy zmienna nie jest ustawiona
- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z poziomu Gateway)

W przypadku zatwierdzonego asynchronicznego wykonywania na Node OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze przekazanie zatwierdzonego `system.run` ponownie wykorzystuje zapisany
plan, dlatego zmiany pól polecenia/katalogu roboczego/sesji po utworzeniu żądania
zatwierdzenia są odrzucane zamiast zmieniać to, co wykonuje Node.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Nodes](/pl/nodes)
