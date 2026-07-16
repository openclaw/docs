---
read_when:
    - Uruchamianie hosta Node bez interfejsu graficznego
    - Parowanie węzła innego niż macOS na potrzeby system.run
summary: Dokumentacja CLI dla `openclaw node` (bezobsługowy host Node)
title: Node
x-i18n:
    generated_at: "2026-07-16T18:27:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Uruchom **bezinterfejsowy host węzła**, który łączy się z WebSocketem Gateway i udostępnia
`system.run` / `system.which` na tym komputerze.

W systemie macOS aplikacja na pasku menu już osadza to środowisko wykonawcze hosta węzła we własnym
połączeniu węzła i dodaje natywne możliwości Maca. Używaj `openclaw node run` na
Macu tylko wtedy, gdy celowo potrzebny jest bezinterfejsowy węzeł bez aplikacji. Uruchomienie
obu tworzy dwie tożsamości węzła dla tego samego komputera.

## Dlaczego warto używać hosta węzła?

Host węzła umożliwia agentom **uruchamianie poleceń na innych komputerach** w
sieci bez instalowania na nich pełnej aplikacji towarzyszącej dla systemu macOS.

Typowe zastosowania:

- Uruchamianie poleceń na zdalnych komputerach z systemem Linux/Windows (serwerach kompilacji, komputerach laboratoryjnych, urządzeniach NAS).
- Utrzymywanie exec **w piaskownicy** na Gateway przy jednoczesnym przekazywaniu zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezinterfejsowego celu wykonawczego dla automatyzacji lub węzłów CI.

Wykonywanie nadal podlega **zatwierdzeniom exec** i listom dozwolonych poleceń poszczególnych agentów na
hoście węzła, dzięki czemu dostęp do poleceń może pozostać ograniczony i jawny.

Po nawiązaniu połączenia `openclaw node run` może publikować narzędzia oparte na pluginach lub MCP.
Gateway domyślnie ufa deskryptorom ze sparowanego węzła, wymagając jednocześnie,
aby polecenie każdego deskryptora pozostawało w zatwierdzonym zakresie poleceń węzła.
Agent widzi każdy zaakceptowany deskryptor jako zwykłe narzędzie pluginu, ale wykonanie nadal
odbywa się przez `node.invoke`, więc odłączenie węzła usuwa narzędzie z nowych
uruchomień agentów. Operatorzy Gateway mogą wyłączyć publikowanie za pomocą
`gateway.nodes.pluginTools.enabled: false`.

W przypadku deklaratywnych narzędzi MCP dodaj standardową strukturę serwera MCP w
`nodeHost.mcp.servers` w `openclaw.json` na komputerze węzła, a następnie uruchom ponownie
host węzła. Węzeł deklaruje rodzinę poleceń `mcp.tools.call.v1` wymagającą zatwierdzenia
i publikuje wymienione narzędzia po nawiązaniu połączenia; późniejsza zmiana listy serwerów
nie wymaga ponownego parowania. Zobacz
[Serwery MCP hostowane na węźle](/pl/nodes#node-hosted-mcp-servers).

## Serwer proxy przeglądarki (bez konfiguracji)

Hosty węzłów automatycznie ogłaszają serwer proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Dzięki temu agent może korzystać z automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie serwer proxy udostępnia standardowy zakres profili przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, serwer proxy staje się restrykcyjny:
wybieranie profili spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
trwałych profili są blokowane przez serwer proxy.

W razie potrzeby wyłącz go na węźle:

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
- `--context-path <path>`: ścieżka kontekstu WebSocketu Gateway (np. `/openclaw-gw`). Dołączana do adresu URL WebSocketu.
- `--tls`: użycie TLS dla połączenia z Gateway
- `--no-tls`: wymuszenie nieszyfrowanego połączenia z Gateway, nawet gdy lokalna konfiguracja Gateway włącza TLS
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąpienie identyfikatora instancji klienta przechowywanego we współdzielonym stanie SQLite (nie resetuje parowania)
- `--display-name <name>`: zastąpienie wyświetlanej nazwy węzła

## Uwierzytelnianie hosta węzła w Gateway

`openclaw node run` i `openclaw node install` ustalają dane uwierzytelniające Gateway na podstawie konfiguracji/zmiennych środowiskowych (polecenia węzła nie mają flag `--token`/`--password`):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie używana jest lokalna konfiguracja zastępcza: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host węzła celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` skonfigurowano jawnie za pomocą SecretRef i nie można ich rozpoznać, ustalanie danych uwierzytelniających węzła kończy się bezpiecznym niepowodzeniem (bez maskowania przez zdalne rozwiązanie zastępcze).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również mogą zostać użyte zgodnie z regułami pierwszeństwa zdalnego.
- Ustalanie danych uwierzytelniających hosta węzła uwzględnia tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

W przypadku węzła łączącego się z nieszyfrowanym Gateway `ws://` akceptowane są adresy
pętli zwrotnej, literały prywatnych adresów IP, hosty `.local` oraz hosty `*.ts.net` w Tailnet. Dla innych
zaufanych prywatnych nazw DNS ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; bez
tego uruchomienie węzła kończy się bezpiecznym niepowodzeniem i wyświetla prośbę o użycie `wss://`, tunelu SSH lub
Tailscale. Jest to opcjonalne ustawienie środowiska procesu, a nie klucz konfiguracji
`openclaw.json`.
`openclaw node install` zachowuje je w nadzorowanej usłudze węzła, gdy jest
obecne w środowisku polecenia instalacyjnego.

## Usługa (w tle)

Zainstaluj bezinterfejsowy host węzła jako usługę użytkownika (launchd w systemie macOS, systemd w
systemie Linux, Harmonogram zadań w systemie Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocketu Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocketu Gateway (domyślnie: `18789`)
- `--context-path <path>`: ścieżka kontekstu WebSocketu Gateway (np. `/openclaw-gw`). Dołączana do adresu URL WebSocketu.
- `--tls`: użycie TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS (sha256)
- `--node-id <id>`: zastąpienie identyfikatora instancji klienta przechowywanego we współdzielonym stanie SQLite (nie resetuje parowania)
- `--display-name <name>`: zastąpienie wyświetlanej nazwy węzła
- `--runtime <runtime>`: środowisko wykonawcze usługi (`node`)
- `--force`: ponowna instalacja/zastąpienie, jeśli usługa jest już zainstalowana

Zarządzanie usługą:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta węzła działającego na pierwszym planie (bez usługi).

Polecenia usługi obsługują `--json` w celu uzyskania danych wyjściowych do odczytu maszynowego.

Host węzła ponawia próby po ponownym uruchomieniu Gateway i zamknięciu połączeń sieciowych w ramach procesu. Jeśli
Gateway zgłosi końcowe wstrzymanie uwierzytelniania tokenem/hasłem/rozruchem, host węzła
rejestruje szczegóły zamknięcia i kończy działanie z niezerowym kodem, aby launchd/systemd/Harmonogram zadań mógł
uruchomić go ponownie z aktualną konfiguracją i danymi uwierzytelniającymi. Wstrzymania wymagające parowania pozostają w
przepływie pierwszoplanowym, aby oczekujące żądanie mogło zostać zatwierdzone.

## Parowanie

Pierwsze połączenie tworzy oczekujące żądanie parowania urządzenia (`role: node`) w Gateway.

Gdy host Gateway może łączyć się przez SSH z hostem węzła bez interakcji (ten sam użytkownik,
zaufany klucz hosta), oczekujące żądanie jest zatwierdzane automatycznie: Gateway
uruchamia `openclaw node identity --json` na hoście węzła przez SSH i zatwierdza je przy
dokładnej zgodności klucza urządzenia. Funkcja jest domyślnie włączona; zobacz
[Automatyczne zatwierdzanie urządzeń zweryfikowanych przez SSH](/pl/gateway/pairing#ssh-verified-device-auto-approval-default),
aby poznać wymagania i sposób jej wyłączenia (`gateway.nodes.pairing.sshVerify: false`).

W przeciwnym razie zatwierdź ręcznie za pomocą:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sprawdź lokalną tożsamość węzła, względem której Gateway przeprowadza weryfikację:

```bash
openclaw node identity --json
```

Polecenie wyświetla identyfikator urządzenia i klucz publiczny z `identity/device.json` i nigdy
nie tworzy ani nie modyfikuje plików tożsamości.

W ściśle kontrolowanych sieciach węzłów operator Gateway może jawnie włączyć
automatyczne zatwierdzanie pierwszego parowania węzła z zaufanych zakresów CIDR:

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

Funkcja jest domyślnie wyłączona (`autoApproveCidrs` nie jest ustawione). Dotyczy wyłącznie
nowego parowania `role: node` bez żądanych zakresów, z adresu IP klienta,
któremu Gateway ufa. Klienci operatora/przeglądarki, Control UI, WebChat oraz uaktualnienia roli,
zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponowi parowanie ze zmienionymi szczegółami uwierzytelniania (rolą/zakresami/kluczem publicznym),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

### Stan tożsamości i parowania

Bezinterfejsowy węzeł oddziela identyfikator instancji klienta od podpisanej tożsamości
urządzenia, której Gateway używa do parowania i trasowania. Ten stan znajduje się w
katalogu stanu OpenClaw (domyślnie `~/.openclaw` lub `$OPENCLAW_STATE_DIR`,
jeśli ustawiono):

| Stan                                        | Przeznaczenie                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | Identyfikator instancji klienta, wyświetlana nazwa i metadane połączenia z Gateway. Klient wysyła ten identyfikator jako `instanceId`.                     |
| `identity/device.json`                       | Podpisana para kluczy Ed25519 i pochodny identyfikator urządzenia. W przypadku podpisanych połączeń ten identyfikator urządzenia jest trasowanym identyfikatorem węzła i tożsamością parowania. |
| `identity/device-auth.json`                  | Tokeny sparowanych urządzeń indeksowane według kryptograficznego identyfikatora urządzenia i roli.                                                                 |

`--node-id` zmienia tylko identyfikator instancji klienta we współdzielonym stanie SQLite. Nie
zmienia kryptograficznego identyfikatora urządzenia ani nie usuwa danych uwierzytelniających parowania. Migracja wycofanego
`node.json` za pomocą `openclaw doctor --fix` również nie resetuje parowania. Aby
unieważnić i ponownie sparować węzeł:

1. W Gateway uruchom `openclaw nodes remove --node <id|name|ip>`.
2. Na węźle uruchom ponownie zainstalowaną usługę za pomocą `openclaw node restart` lub
   zatrzymaj i ponownie uruchom pierwszoplanowe polecenie `openclaw node run`. Rozpocznie to
   proces parowania urządzenia. Jeśli `openclaw devices list` nie wyświetla żądania,
   a węzeł zgłasza `AUTH_DEVICE_TOKEN_MISMATCH`, uruchom go ponownie jeszcze
   raz. Odrzucona próba usuwa unieważniony już lokalny token; następna
   próba może zażądać parowania.
3. W Gateway uruchom `openclaw devices list`, a następnie
   `openclaw devices approve <deviceRequestId>`.
4. Ponownie uruchom usługę lub polecenie węzła. Klient wstrzymany na czas parowania nie wznawia działania
   automatycznie po zatwierdzeniu; to ponowne połączenie tworzy osobne
   żądanie zakresu poleceń.
5. W Gateway uruchom `openclaw nodes pending`, a następnie
   `openclaw nodes approve <nodeRequestId>`.

Te dwa identyfikatory żądań są różne. Odpowiednia zasada zaufanego CIDR może
automatycznie zatwierdzić etap pierwszego parowania urządzenia; zatwierdzenie zakresu poleceń pozostaje
osobną kontrolą.

Starsze wersje OpenClaw przechowywały stan hosta węzła w `node.json` i mogły pozostawić tam
przestarzałe pole `token`. Zatrzymaj host węzła i uruchom jednorazowo `openclaw doctor --fix`;
Doctor importuje obsługiwane pola tożsamości i połączenia do SQLite,
odrzuca nieużywane pole tokenu, weryfikuje wiersz i usuwa wycofany plik.
Standardowe polecenia węzła kończą się bezpiecznym niepowodzeniem z tą instrukcją naprawy, dopóki istnieje plik lub
pozostałość po przerwanym przejęciu przez Doctor. Oba pliki w `identity/` muszą pozostać prywatne;
zawierają parę kluczy urządzenia i tokeny uwierzytelniające.

## Zatwierdzenia exec

`system.run` podlega lokalnym zatwierdzeniom exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` lub
  `~/.openclaw/exec-approvals.json`, gdy zmienna nie jest ustawiona
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

W przypadku zatwierdzonego asynchronicznego exec na węźle OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze zatwierdzone przekazanie `system.run` ponownie wykorzystuje zapisany
plan, dlatego zmiany pól polecenia/katalogu roboczego/sesji po utworzeniu żądania
zatwierdzenia są odrzucane, zamiast zmieniać to, co węzeł wykona.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
