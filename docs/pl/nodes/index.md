---
read_when:
    - Parowanie węzłów iOS/watchOS/Android z Gatewayem
    - Używanie płótna/kamery węzła jako kontekstu agenta
    - Dodawanie nowych poleceń Node lub pomocniczych narzędzi CLI
summary: 'Node’y: parowanie, możliwości, uprawnienia i narzędzia pomocnicze CLI do obsługi canvas/kamery/ekranu/urządzenia/powiadomień/systemu'
title: Węzły
x-i18n:
    generated_at: "2026-07-16T18:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

**Node** to urządzenie towarzyszące (macOS/iOS/watchOS/Android/bez interfejsu), które łączy się z Gateway za pomocą `role: "node"` i udostępnia interfejs poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Większość Node’ów korzysta z WebSocket Gateway na porcie operatora. Opcjonalny bezpośredni Node Apple Watch korzysta z odpytywania przez podpisane żądania HTTPS na tym samym porcie, ponieważ watchOS blokuje zwykłym aplikacjom ogólne mechanizmy sieciowe niskiego poziomu. Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

Starszy mechanizm transportu: [Protokół mostu](/pl/gateway/bridge-protocol) (TCP JSONL; w przypadku obecnych Node’ów wyłącznie do celów historycznych).

System macOS może również działać w **trybie Node**: aplikacja na pasku menu łączy się z serwerem
WS Gateway jako jeden Node (dzięki czemu `openclaw nodes …` działa względem tego Maca). Aplikacja
dodaje natywne polecenia Canvas, aparatu, ekranu, powiadomień i sterowania komputerem
do tego samego interfejsu poleceń hosta Node, którego używa `openclaw node run`. Nie należy uruchamiać
drugiego Node’a CLI na tym Macu; aplikacja uruchamia odpowiednie środowisko wykonawcze hosta Node CLI jako
wewnętrzny proces roboczy i pozostaje jedynym połączeniem z Gateway oraz jedyną tożsamością Node.

Node’y są **urządzeniami peryferyjnymi**, a nie Gatewayami: nie uruchamiają usługi Gateway, a wiadomości z kanałów (Telegram, WhatsApp itd.) trafiają do Gateway, nie do Node’ów.

Procedura rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie i stan

Node’y korzystają z **parowania urządzeń**. Podczas łączenia Node przedstawia podpisaną tożsamość urządzenia; Gateway tworzy żądanie parowania urządzenia dla `role: node`. Należy je zatwierdzić za pomocą CLI urządzeń (lub interfejsu użytkownika). Bezpośrednia konfiguracja Apple Watch używa utworzonego przez administratora, krótkotrwałego kodu konfiguracyjnego przeznaczonego wyłącznie dla Node’a, aby zatwierdzić jego stały interfejs poleceń niskiego ryzyka; późniejsze rozszerzenie możliwości nadal wymaga standardowego zatwierdzenia.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Oczekujące żądania parowania wygasają 5 minut po ostatniej ponownej próbie urządzenia — urządzenie, które nadal ponawia łączenie, podtrzymuje swoje jedno oczekujące żądanie (oraz `requestId`), zamiast co kilka minut generować nowy monit; pełny cykl żądania i zatwierdzania opisano w sekcji [Parowanie Node’a](/pl/gateway/pairing). Jeśli Node ponowi próbę ze zmienionymi szczegółami uwierzytelniania (rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy `requestId` — klienci otrzymają zdarzenie `device.pair.resolved` dotyczące zastąpionego żądania, a przed zatwierdzeniem należy ponownie uruchomić `openclaw devices list`.

- `nodes status` oznacza Node jako **sparowany**, gdy jego rola w parowaniu urządzenia obejmuje `node`.
- Połączony natywny Mac z uprawnieniem Dostępność może zgłaszać zagregowaną
  aktywność fizycznych urządzeń wejściowych. Gateway oznacza najświeższy kwalifikujący się Mac jako
  `active`, przekazuje agentowi stabilną wskazówkę identyfikatora Node i kieruje tam alerty
  o połączeniu Node przed opóźnionym użyciem rozwiązania zapasowego. Informacje o konfiguracji, prywatności, czasach i
  rozwiązywaniu problemów zawiera sekcja
  [Obecność aktywnego komputera](/nodes/presence).
- Rekord parowania urządzenia stanowi trwałą umowę zatwierdzonych ról. Rotacja tokenu odbywa się w granicach tej umowy; nie może nadać sparowanemu Node’owi roli, której nigdy nie przyznano podczas zatwierdzania parowania.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) to osobny, należący do Gateway magazyn parowania Node’ów, który między ponownymi połączeniami śledzi zatwierdzony interfejs poleceń i możliwości Node’a. **Nie** kontroluje uwierzytelniania transportu — odpowiada za to parowanie urządzeń.
- `openclaw nodes remove --node <id|name|ip>` usuwa parowanie Node’a. W przypadku Node’a powiązanego z urządzeniem unieważnia rolę `node` urządzenia w magazynie sparowanych urządzeń i rozłącza sesje tego urządzenia z rolą Node’a: urządzenie z wieloma rolami zachowuje swój wiersz i traci tylko rolę `node`, natomiast wiersz urządzenia mającego wyłącznie rolę Node’a zostaje usunięty. Usuwa również wszystkie pasujące wpisy z osobnego magazynu parowania Node’ów. `operator.pairing` może usuwać wiersze Node’ów niebędących operatorami na innych urządzeniach; wywołujący używający tokenu urządzenia, który unieważnia własną rolę Node’a na urządzeniu z wieloma rolami, potrzebuje dodatkowo `operator.admin`.
- Zakres zatwierdzenia wynika z poleceń zadeklarowanych w oczekującym żądaniu:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia Node’a inne niż exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Rozbieżność wersji i kolejność aktualizacji

WebSocket Gateway akceptuje uwierzytelnionych klientów Node w oknie protokołów N-1.
Bieżący Gateway v4 akceptuje zatem Node’y v3, gdy połączenie deklaruje
zarówno `role: "node"`, jak i `client.mode: "node"`. Sesje operatora i interfejsu użytkownika muszą
nadal korzystać z bieżącego protokołu.

W przypadku etapowej aktualizacji floty należy najpierw zaktualizować Gateway, a następnie każdy Node.
Node N-1 pozostaje widoczny i możliwy do zarządzania podczas aktualizacji; Gateway
rejestruje `legacy node protocol accepted` z zaleceniem aktualizacji. Parowanie,
uwierzytelnianie urządzeń, listy dozwolonych poleceń i zatwierdzanie exec nadal obowiązują.
Możliwości i polecenia należące do Pluginów pozostają ukryte do czasu zaktualizowania Node’a do
bieżącego protokołu. Node’y starsze niż N-1 wymagają aktualizacji poza pasmem przed
ponownym połączeniem.

Bezpośredni transport HTTPS systemu watchOS wymaga bieżącej wersji protokołu; przed
włączeniem trybu bezpośredniego należy zaktualizować aplikację zegarka razem z Gateway.

## Zdalny host Node (system.run)

**Hosta Node** należy używać, gdy Gateway działa na jednym komputerze, a polecenia mają być wykonywane na innym. Model nadal komunikuje się z **Gateway**; Gateway przekazuje wywołania `exec` do **hosta Node**, gdy wybrano `host=node`.

| Rola         | Odpowiedzialność                                                   |
| ------------ | ---------------------------------------------------------------- |
| Host Gateway | Odbiera wiadomości, uruchamia model i kieruje wywołania narzędzi.            |
| Host Node    | Wykonuje `system.run`/`system.which` na komputerze Node’a.        |
| Zatwierdzenia    | Egzekwowane na hoście Node przez `~/.openclaw/exec-approvals.json`. |

Uwaga dotycząca zatwierdzania:

- Uruchomienia Node’a wymagające zatwierdzenia są powiązane z dokładnym kontekstem żądania. Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem; po jego udzieleniu Gateway przekazuje zapisany plan, a nie zmodyfikowane później przez wywołującego pola polecenia/cwd/sesji, i ponownie sprawdza katalog roboczy przed uruchomieniem.
- W przypadku bezpośrednich wykonań plików przez powłokę/środowisko wykonawcze OpenClaw podejmuje również najlepszą możliwą próbę powiązania jednego konkretnego lokalnego operandu plikowego i odrzuca uruchomienie, jeśli plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego pliku lokalnego dla polecenia interpretera/środowiska wykonawczego, wykonanie wymagające zatwierdzenia zostaje odrzucone zamiast pozorowania pełnego pokrycia środowiska wykonawczego. W przypadku szerszej semantyki interpretera należy użyć piaskownicy, osobnych hostów albo jawnej zaufanej listy dozwolonych elementów/pełnego przepływu pracy.

### Uruchamianie hosta Node (na pierwszym planie)

Na komputerze Node’a:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` przyjmuje również `--context-path` (ścieżkę kontekstu WS Gateway), `--tls`, `--tls-fingerprint <sha256>` oraz `--node-id` (zastępuje starszy identyfikator instancji klienta; nie resetuje to parowania).

### Zdalny Gateway przez tunel SSH (powiązanie z interfejsem loopback)

Jeśli Gateway jest powiązany z interfejsem loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym), zdalne hosty Node nie mogą łączyć się bezpośrednio. Należy utworzyć tunel SSH i skierować host Node do lokalnego końca tunelu.

Przykład (host Node -> host Gateway):

```bash
# Terminal A (pozostawić uruchomiony): przekierowanie lokalnego portu 18790 -> Gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportowanie tokenu Gateway i połączenie przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem lub hasłem.
- Preferowane są zmienne środowiskowe: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Zapasową konfiguracją jest `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami pierwszeństwa trybu zdalnego.
- Jeśli skonfigurowano aktywne lokalne odwołania SecretRefs `gateway.auth.*`, ale nie można ich rozpoznać, uwierzytelnianie hosta Node zostaje bezpiecznie odrzucone.
- Rozpoznawanie uwierzytelniania hosta Node uwzględnia wyłącznie zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

### Uruchamianie hosta Node (jako usługi)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` przyjmuje również `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (tylko starszy identyfikator instancji klienta), `--runtime <node>` (domyślnie: node) oraz `--force`, aby wykonać ponowną instalację. Dostępne są również `node status`, `node stop` i `node uninstall`.

### Parowanie i nadawanie nazwy

Na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli Node ponowi próbę ze zmienionymi szczegółami uwierzytelniania, należy ponownie uruchomić `openclaw devices list` i zatwierdzić bieżący `requestId`.

Opcje nadawania nazw:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane we współdzielonym wierszu SQLite `node_host_config` wraz z identyfikatorem instancji klienta i metadanymi połączenia Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie w Gateway).

### Serwery MCP hostowane na Node

Serwery MCP należy skonfigurować w `openclaw.json` na komputerze Node’a, a nie w
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

Host Node bez interfejsu uruchamia te serwery, wyświetla ich narzędzia i publikuje
deskryptory po nawiązaniu połączenia. Wywołania narzędzi wracają do tego Node’a przez
`mcp.tools.call.v1`; Gateway nie wymaga zgodnej konfiguracji MCP ani Pluginu
JS. Serwery OAuth MCP nie są obsługiwane przez tę ścieżkę v1 hostowaną na Node.

Bieżące hosty Node deklarują wbudowaną rodzinę poleceń `mcp.tools.call.v1` podczas
początkowego parowania, nawet gdy nie skonfigurowano żadnego serwera MCP. Node sparowany w
starszej wersji OpenClaw może zażądać jednorazowej aktualizacji interfejsu poleceń po
zaktualizowaniu hosta Node. Dodawanie, usuwanie lub filtrowanie serwerów po tym etapie nie
wymaga ponownego parowania, ponieważ zatwierdzona rodzina poleceń pozostaje bez zmian. Aby
zastosować zmiany konfiguracji MCP Node’a, należy ponownie uruchomić
`openclaw node run` lub `openclaw node restart`;
host Node nie monitoruje tej konfiguracji.

Operatorzy Gateway mogą ignorować wszystkie narzędzia widoczne dla agenta, które publikują sparowane Node’y,
w tym narzędzia MCP hostowane na Node, za pomocą
`gateway.nodes.pluginTools.enabled: false`. Dokładne odmowy poleceń, takie jak
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`, również blokują wykonanie.

### Skills hostowane na Node

Skills należy zainstalować w aktywnym katalogu Skills OpenClaw na komputerze Node’a,
domyślnie `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` i
`OPENCLAW_CONFIG_PATH` przenoszą ten aktywny profil. `OPENCLAW_STATE_DIR` ma
pierwszeństwo w przypadku Skills; w przeciwnym razie `skills/` znajduje się obok ścieżki wyświetlanej przez
`openclaw config file`. Host Node bez interfejsu publikuje prawidłowe pliki `SKILL.md`
po nawiązaniu połączenia, a Gateway dodaje je do migawek Skills agenta tylko wtedy, gdy
ten Node pozostaje połączony. Nazwa każdego katalogu Skills musi odpowiadać polu frontmatter `name`,
aby abstrakcyjny lokalizator Node wskazywał jeden wpis bez dodawania
kolejnego pola protokołu.

Początkowe parowanie roli węzła zatwierdza publikację umiejętności. Dodawanie, usuwanie lub
zmienianie umiejętności nie wymaga kolejnego parowania ani zmiany konfiguracji
Gateway. Po zmianie plików umiejętności węzła uruchom ponownie `openclaw node run` lub
`openclaw node restart`; host węzła nie monitoruje katalogu umiejętności.

Wpisy umiejętności hostowanych na węźle identyfikują swój węzeł i zawierają
lokalizację wykonania. Pliki umiejętności, ścieżki względne, do których się odwołują,
oraz pliki binarne pozostają na tym węźle. Agent odczytuje ogłaszaną lokalizację
`node://.../SKILL.md` za pomocą standardowego narzędzia `read`.
`file_fetch` akceptuje zatwierdzone przez operatora bezwzględne ścieżki węzła,
a nie lokalizatory umiejętności węzła; środowiska wykonawcze bez standardowego
narzędzia odczytu mogą zamiast tego uruchomić `cat SKILL.md` przez
`exec host=node node=<node-id>`, używając ogłaszanego katalogu `node://.../skills/<name>` jako
`workdir`. Pliki i pliki binarne, do których istnieją odwołania,
korzystają z tego samego celu wykonania i katalogu roboczego. Host węzła rozwiązuje
ten lokalizator względem swojego aktywnego katalogu stanu OpenClaw, dlatego ścieżki
względne są rozwiązywane na węźle, a nie na komputerze Gateway. Węzeł publikujący
musi mieć zatwierdzone `system.run`, a zasady wykonywania agenta muszą
zezwalać na `host=node`; w przeciwnym razie umiejętność nie znajdzie się
w migawce tego agenta.

Ustaw `nodeHost.skills.enabled: false` na węźle, aby zatrzymać publikację. Operatorzy Gateway
mogą ignorować umiejętności ze wszystkich sparowanych węzłów za pomocą
`gateway.nodes.skills.enabled: false`.

### Stan tożsamości bez interfejsu graficznego

Węzeł bez interfejsu graficznego przechowuje trzy osobne rekordy stanu:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): identyfikator instancji klienta, nazwa wyświetlana i metadane połączenia z Gateway.
- `~/.openclaw/identity/device.json`: podpisana para kluczy urządzenia i wyprowadzony kryptograficzny identyfikator urządzenia.
- `~/.openclaw/identity/device-auth.json`: tokeny uwierzytelniania sparowanych urządzeń indeksowane według kryptograficznego identyfikatora urządzenia i roli.

W przypadku podpisanego węzła Gateway używa kryptograficznego identyfikatora
urządzenia do parowania i routingu węzła. Identyfikator instancji klienta jest
jedynie metadaną połączenia. Zmiana `--node-id` lub migracja wycofanego
`node.json` nie resetuje więc parowania. Obsługiwany proces unieważnienia
i ponownego parowania oraz uwagi dotyczące aktualizacji opisano w sekcji
[Stan tożsamości i parowania](/pl/cli/node#identity-and-pairing-state).

### Dodawanie poleceń do listy dozwolonych

Zatwierdzenia wykonywania są konfigurowane **osobno dla każdego hosta węzła**.
Dodaj wpisy listy dozwolonych z poziomu Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia są przechowywane na hoście węzła w `~/.openclaw/exec-approvals.json`.

### Kierowanie wykonywania do węzła

Skonfiguruj ustawienia domyślne (konfiguracja Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Lub dla poszczególnych sesji:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Po skonfigurowaniu każde wywołanie `exec` z
`host=node` jest wykonywane na hoście węzła (z uwzględnieniem listy
dozwolonych i zatwierdzeń węzła).

`host=auto` nie wybierze samodzielnie węzła w sposób niejawny, ale jawne
żądanie `host=node` dla pojedynczego wywołania jest dozwolone z
`auto`. Aby wykonywanie na węźle było ustawieniem domyślnym sesji,
ustaw jawnie `tools.exec.host=node` lub `/exec host=node ...`.

Powiązane materiały:

- [CLI hosta węzła](/pl/cli/node)
- [Narzędzie wykonywania](/pl/tools/exec)
- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals)

### Lokalne wnioskowanie modelu

Węzeł komputera stacjonarnego lub serwera może udostępniać modele obsługujące
czat z serwera Ollama działającego na tym węźle. Agenci używają narzędzia
`node_inference` Pluginu Ollama do wykrywania zainstalowanych modeli
i zdalnego uruchamiania ograniczonego monitu; Gateway nie potrzebuje
bezpośredniego dostępu sieciowego do Ollama. Instrukcje konfiguracji, filtrowanie
modeli i polecenia bezpośredniej weryfikacji opisano w sekcji
[Lokalne wnioskowanie Ollama na węźle](/pl/providers/ollama#node-local-inference).

### Sesje i transkrypcje Codex

Oficjalny Plugin `codex` może udostępniać niezarchiwizowane sesje
Codex na hoście węzła bez interfejsu graficznego lub natywnym węźle macOS.
Rejestracja katalogu nie zależy już od `supervision.enabled`; ta opcja kontroluje
narzędzia nadzoru dostępne dla agenta. Ustaw `sessionCatalog.enabled: false` w konfiguracji
Pluginu Codex, aby wyłączyć polecenia katalogu operatora i katalogu sparowanych
węzłów bez wyłączania dostawcy ani środowiska wykonawczego.
Plugin nadal musi być aktywny na obu komputerach, a ustawienie węzła pozostaje
lokalną zgodą: włączenie funkcji wyłącznie na Gateway nie umożliwia odczytu
stanu Codex na innym komputerze.

Węzeł ogłasza wersjonowane polecenia tylko do odczytu
`codex.appServer.threads.list.v1` i
`codex.appServer.thread.turns.list.v1`. Natywny host węzła z dostępnym
CLI Codex ogłasza także `codex.terminal.resume.v1`. Zatwierdź rozszerzenie parowania
węzła, gdy te polecenia pojawią się po raz pierwszy. Gateway wywołuje je zgodnie
ze standardowymi zasadami Pluginu dotyczącymi węzłów i izoluje awarie według
hosta.

Wiersze sparowanych węzłów pojawiają się jako grupa **Codex** na standardowym
pasku bocznym sesji. Domyślnie wybranie wiersza otwiera standardowy panel czatu
i odczytuje utrwaloną transkrypcję przez ograniczone, stronicowane kursorem
wywołania `thread/turns/list` z pełną projekcją elementów. Użyj menu wiersza,
nagłówka przeglądarki lub ustawienia **Open Codex/Claude sessions in**, aby
uruchomić `codex resume <thread-id>` w terminalu operatora na komputerze będącym
właścicielem sesji. Ścieżka terminala sparowanego węzła jest przekaźnikiem PTY
z listy dozwolonych należącym do Pluginu Codex, a nie mechanizmem wykonywania
dowolnych poleceń na węźle.

Przekaźnik nie zapewnia pełnych kontraktów kontynuacji środowiska wykonawczego
OpenClaw ani własności archiwum. Opcje **Continue** i **Archive** są zatem
niedostępne dla wierszy zdalnych. Na komputerze Gateway zapisane i bezczynne
wiersze mogą rozpocząć odrębną gałąź czatu z zablokowanym modelem. Każdy z nich
można zarchiwizować dopiero po potwierdzeniu przez operatora, że żaden inny
klient Codex go nie używa; bieżąca aktywność zapisanego wiersza pozostaje
nieznana. Aktywnych wierszy nie można rozgałęziać ani archiwizować.

Instrukcje konfiguracji, stronicowanie, lokalną kontynuację i granicę
bezpieczeństwa metadanych opisano w sekcji
[Nadzorowanie sesji Codex](/pl/plugins/codex-supervision).

### Sesje i transkrypcje Claude

Dołączony Plugin `anthropic` domyślnie wykrywa niezarchiwizowane sesje
Claude CLI i Claude Desktop na Gateway oraz sparowanych węzłach. Ustaw
`plugins.entries.anthropic.config.sessionCatalog.enabled: false`, aby wyłączyć polecenia katalogu operatora i katalogu
sparowanych węzłów bez wyłączania modeli Anthropic ani backendu Claude CLI.
Zdalny węzeł aplikacji macOS ogłasza
`anthropic.claude.sessions.list.v1` i `anthropic.claude.sessions.read.v1`,
gdy Plugin Anthropic jest włączony i istnieje `~/.claude/projects/`. Zatwierdź
rozszerzenie parowania węzła, gdy te polecenia pojawią się po raz pierwszy.

Natywny host węzła z dostępnym Claude CLI ogłasza także
`anthropic.claude.terminal.resume.v1`. Kwalifikujące się wiersze CLI i Desktop mogą otwierać
`claude --resume <session-id>` w terminalu operatora na hoście będącym ich właścicielem.
Jest to przejęcie natywnej sesji; w przeciwieństwie do przejęcia przez OpenClaw
nie powoduje wcześniejszego rozwidlenia sesji Claude.

Katalog łączy prawidłowe rekordy indeksu projektów Claude CLI z ograniczonym
prefiksem metadanych z bieżących plików JSONL `sdk-cli`. Lokalne
metadane Claude Desktop dostarczają tytuły Desktop i stan archiwizacji. Metadane
Desktop mają pierwszeństwo, gdy oba źródła odnoszą się do tego samego
identyfikatora sesji Claude Code; transkrypcje dostępne wyłącznie w CLI pozostają
widoczne, ponieważ CLI nie ma flagi archiwizacji. Odczyty transkrypcji używają
nieprzezroczystych kursorów przesunięcia bajtowego i ograniczonych odczytów pliku
wstecz, dlatego wybranie dużej sesji lub załadowanie starszej strony nie wczytuje
całej historii JSONL do jednej odpowiedzi Gateway.

Polecenia wyświetlania listy i odczytu są przeznaczone tylko do odczytu.
Udostępniają metadane katalogu i treść transkrypcji wyłącznie za pośrednictwem
ogólnych metod `sessions.catalog.list` i `sessions.catalog.read` uwierzytelnionemu
połączeniu operatora z `operator.write`. Wiersz Claude CLI lokalny dla
Gateway można przejąć ze standardowego pola tworzenia wiadomości czatu: OpenClaw
importuje ograniczoną widoczną historię, wznawia za pomocą
`--fork-session` przy pierwszej turze i pozostawia transkrypcję źródłową
bez zmian.

Host węzła bez interfejsu graficznego może opcjonalnie włączyć ten sam proces
kontynuacji:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Węzeł ogłasza `agent.cli.claude.run.v1` tylko wtedy, gdy to lokalne ustawienie węzła
jest włączone, a plik wykonywalny `claude` jest rozpoznawany na tym
węźle. Gateway nie może włączyć go zdalnie. Polecenie podlega także istniejącym
zasadom zatwierdzania wykonywania węzła. Gdy wszystkie trzy polecenia Claude są
ogłaszane i dozwolone przez zasady poleceń węzła w Gateway, wiersz Claude CLI
na tym węźle można kontynuować: OpenClaw importuje ograniczoną historię, wiąże
przejętą sesję z węzłem i katalogiem roboczym zgłoszonym przez katalog oraz
uruchamia tam każdą jednorazową turę `claude -p`. Pierwsza tura nadal
używa `--fork-session`, zachowując transkrypcję źródłową.

Tury wykonywane na węźle używają domyślnych ustawień Claude tego węzła. W wersji
v1 nie otrzymują konfiguracji zwrotnej MCP Gateway ani Pluginu umiejętności
Gateway, nie mogą ponownie zainicjować danych z transkrypcji Gateway oraz
odrzucają załączniki i obrazy. Wiersze Claude Desktop oraz węzły, które nie
ogłaszają polecenia uruchamiania, pozostają dostępne tylko do wyświetlania.
Węzeł aplikacji macOS nie ogłasza jeszcze tego polecenia, dlatego jego wiersze
pozostają dostępne tylko do wyświetlania.

Zachowanie interfejsu Control UI i źródła pamięci masowej opisano w sekcji
[Anthropic: sesje Claude na wielu komputerach](/pl/providers/anthropic#claude-sessions-across-computers).

### Sesje OpenCode i Pi

Dołączone Pluginy OpenCode i ACPX również wykrywają natywne katalogi sesji tylko
do odczytu na Gateway i sparowanych węzłach. Węzeł ogłasza
`opencode.sessions.list.v1` / `opencode.sessions.read.v1`, gdy zainstalowano CLI
`opencode`, oraz `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`,
gdy istnieje katalog sesji Pi. Zatwierdź rozszerzenie parowania węzła, gdy nowe
polecenia pojawią się po raz pierwszy. Gdy dostępne jest również odpowiednie
CLI, węzeł dodaje `opencode.terminal.resume.v1` lub `acpx.pi.terminal.resume.v1`; istniejące menu
wiersza i nagłówek przeglądarki mogą następnie ponownie otworzyć wybraną sesję
w terminalu będącym jej właścicielem za pomocą `opencode --session <id>` lub
`pi --session <id>`.

OpenCode odczytuje dane przez oficjalny interfejs JSON/eksportu swojego CLI.
Pi odczytuje udokumentowany magazyn sesji JSONL, w tym projektowe i globalne
katalogi sesji `settings.json` oraz nadpisania `PI_CODING_AGENT_DIR` i
`PI_CODING_AGENT_SESSION_DIR`. Oba katalogi są domyślnie włączone; wyłącz je w interfejsie
Web UI w sekcji **Config > Plugins**.

Wznawianie w terminalu używa zapisanego katalogu roboczego sesji i tego samego
dwukierunkowego przekaźnika PTY z listy dozwolonych co Codex i Claude. Nie
umożliwia wykonywania dowolnych poleceń na węźle.

### Przesyłanie plików do terminala

Control UI umożliwia przeciąganie plików do otwartego terminala sparowanego
węzła. Natywny host węzła ogłasza polecenie `terminal.upload` dostępne tylko
dla administratora; zatwierdź rozszerzenie parowania, gdy pojawi się ono po raz
pierwszy. Każdy plik jest ograniczony do 16 MiB, umieszczany w prywatnym katalogu
tymczasowym na tym węźle i zwracany do terminala jako ścieżka ujęta w cudzysłowy
zgodnie ze składnią powłoki, bez jej wykonywania.

Wstawianie ścieżek obsługuje PowerShell, `cmd.exe` oraz rozpoznawane
powłoki POSIX (`sh`, Bash, Dash, Ash, Ksh, Zsh i Fish), w tym
Git Bash w systemie Windows. Inne nadpisania powłoki są odrzucane, ponieważ nie
można bezpiecznie ustalić ich reguł cytowania; aby używać natywnych ścieżek WSL,
uruchom host węzła wewnątrz WSL. Ścieżki `cmd.exe` zawierające
`%` lub `!` są również odrzucane, ponieważ ta
powłoka rozwija te znaki nawet wewnątrz podwójnych cudzysłowów.

## Wywoływanie poleceń

Niski poziom (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blokuje `system.run` i `system.run.prepare`; te
polecenia są uruchamiane wyłącznie przez narzędzie `exec` z
`host=node` (patrz wyżej). Dla typowych procesów „przekaż agentowi
załącznik MEDIA” istnieją pomocnicze funkcje wyższego poziomu (kanwa, kamera,
ekran, lokalizacja — opisane poniżej).

Długotrwałe strumieniowe polecenia węzła używają addytywnych zdarzeń `node.invoke.progress`.
Każde zdarzenie zawiera identyfikator wywołania, numer sekwencyjny liczony od zera oraz
ograniczony fragment tekstu UTF-8; Gateway porządkuje fragmenty przed przekazaniem ich
wywołującemu. Istniejące `node.invoke.result` pozostaje pojedynczą odpowiedzią
końcową. Wywołujący korzystający ze strumieniowania mogą ustawić limit czasu bezczynności, który rozpoczyna się wraz z
pierwszym zdarzeniem postępu i jest resetowany po kolejnych zdarzeniach postępu, przy jednoczesnym zachowaniu
oddzielnego bezwzględnego limitu czasu wywołania podczas zatwierdzania i wykonywania. Wynik, bezwzględny
limit czasu, limit czasu bezczynności oraz rozłączenie węzła powodują odrzucenie oczekującego stanu
strumienia. Anulowanie przez wywołującego emituje `node.invoke.cancel`; host węzła następnie
kończy pasujące drzewo procesów. Istniejące polecenia typu żądanie/odpowiedź pozostają bez zmian.

## Zasady poleceń

Polecenia węzła muszą przejść dwie bramy, zanim będzie można je wywołać:

1. Węzeł musi zadeklarować polecenie w swoich uwierzytelnionych metadanych połączenia (`connect.commands`).
2. Lista dozwolonych poleceń Gateway, wynikająca z platformy i zatwierdzenia, musi zawierać zadeklarowane polecenie.

Domyślne listy dozwolonych poleceń według platformy (przed domyślnymi ustawieniami pluginów i nadpisaniami `allowCommands`/`denyCommands`):

| Platforma | Polecenia domyślnie dozwolone                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (polecenia hosta węzła, takie jak `system.run`, wymagają zatwierdzenia; patrz poniżej)                                                                                                                                                                                                                                  |

Te wiersze opisują górną granicę zasad Gateway, a nie polecenia zaimplementowane przez każdą aplikację węzła. Polecenia można użyć tylko wtedy, gdy połączony węzeł również je deklaruje. W szczególności obecna aplikacja macOS nie deklaruje rodzin poleceń dotyczących urządzenia i danych osobowych wymienionych w wierszu zasad macOS.

Polecenia `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) są domyślnym ustawieniem pluginu w systemach iOS, Android, macOS, Windows, Linux oraz na nieznanych platformach. Węzły Linux deklarują je tylko wtedy, gdy dostępne jest lokalne gniazdo Canvas aplikacji komputerowej. Wszystkie polecenia Canvas w systemie iOS są ograniczone do działania na pierwszym planie.

Polecenia `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` i `talk.ptt.once` są domyślnie dozwolone dla każdego węzła, który ogłasza możliwość `talk` lub deklaruje polecenia `talk.*`, niezależnie od etykiety platformy.

Polecenia hosta komputerowego (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` i `screen.snapshot` w systemach macOS/Windows) nie należą do powyższej statycznej tabeli wartości domyślnych platformy. Stają się dostępne, gdy operator zatwierdzi żądanie parowania, które je deklaruje; od tego momentu zatwierdzony zestaw poleceń węzła zachowuje je przy ponownym połączeniu.

Niebezpieczne polecenia lub polecenia silnie ingerujące w prywatność nadal wymagają jawnego włączenia za pomocą `gateway.nodes.allowCommands`, nawet jeśli węzeł je deklaruje: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` zawsze ma pierwszeństwo przed wartościami domyślnymi i dodatkowymi wpisami listy dozwolonych poleceń. Informacje o bramie zgody na iPhonie zawiera strona [Podsumowania HealthKit](/platforms/ios-healthkit), a informacje o dodatkowych bramach dotyczących systemu macOS, zasad narzędzi i uzbrajania wejścia komputera — strona [Sterowanie komputerem](/pl/nodes/computer-use).

Polecenia węzła należące do pluginu mogą dodać zasady wywoływania węzła przez Gateway. Zasady te są wykonywane po sprawdzeniu listy dozwolonych poleceń, a przed przekazaniem żądania do węzła, dzięki czemu surowe `node.invoke`, pomocnicze narzędzia CLI i dedykowane narzędzia agenta współdzielą tę samą granicę uprawnień pluginu. Niebezpieczne polecenia węzła pluginu nadal wymagają jawnego włączenia za pomocą `gateway.nodes.allowCommands`.

Po zmianie przez węzeł listy deklarowanych poleceń należy odrzucić stare parowanie urządzenia i zatwierdzić nowe żądanie, aby Gateway zapisał zaktualizowaną migawkę poleceń.

## Konfiguracja (`openclaw.json`)

Ustawienia związane z węzłami znajdują się w sekcjach `gateway.nodes` i `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Automatycznie zatwierdzaj pierwsze parowanie węzła z zaufanych sieci (lista CIDR).
      // Wyłączone, gdy nie ustawiono. Dotyczy tylko pierwszych żądań role:node
      // bez żądanych zakresów; nie zatwierdza automatycznie uaktualnień.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Automatyczne zatwierdzanie zweryfikowane przez SSH (domyślnie: włączone). Zatwierdza pierwsze
        // parowanie węzła przy dokładnej zgodności klucza urządzenia odczytanego zwrotnie przez SSH.
        sshVerify: true,
      },
      // Ufaj widocznym dla agenta narzędziom pluginów publikowanym przez sparowane węzły (domyślnie: true).
      pluginTools: {
        enabled: true,
      },
      // Włącz niebezpieczne lub silnie ingerujące w prywatność polecenia węzła (camera.snap itp.).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokuj dokładne nazwy poleceń, nawet jeśli zawierają je wartości domyślne lub allowCommands.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Domyślny host wykonywania: "node" kieruje wszystkie wywołania exec do sparowanego węzła.
      host: "node",
      // Tryb zabezpieczeń wykonywania na węźle: zezwalaj tylko na zatwierdzone polecenia z listy dozwolonych.
      security: "allowlist",
      // Przypisz wykonywanie do określonego węzła (identyfikatora lub nazwy). Pomiń, aby zezwolić na dowolny węzeł.
      node: "build-node",
    },
  },
}
```

Należy używać dokładnych nazw poleceń węzła. `denyCommands` usuwa polecenie nawet wtedy, gdy domyślna wartość platformy lub wpis `allowCommands` w przeciwnym razie by na nie zezwalały. Sparowane węzły mogą domyślnie publikować widoczne dla agenta deskryptory narzędzi pluginów, ale polecenie każdego deskryptora nadal musi znajdować się w zatwierdzonym zestawie poleceń węzła. Ustaw `gateway.nodes.pluginTools.enabled: false`, aby ignorować wszystkie takie deskryptory. Szczegóły pól parowania węzłów Gateway i zasad poleceń zawiera [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference#gateway).

Nadpisanie węzła wykonywania dla poszczególnych agentów:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Zrzuty ekranu (migawki Canvas)

Jeśli węzeł wyświetla Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Narzędzie pomocnicze CLI (zapisuje do pliku tymczasowego i wyświetla zapisaną ścieżkę):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Elementy sterujące Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Uwagi:

- `canvas present` przyjmuje adresy URL lub lokalne ścieżki plików (`--target`) na węzłach obsługujących lokalne ścieżki, a także opcjonalne `--x/--y/--width/--height` do pozycjonowania. Canvas w systemie Linux przyjmuje adresy URL HTTP(S) lub dołączony do niego mechanizm renderujący A2UI.
- `canvas eval` przyjmuje kod JS podany bezpośrednio (`--js`) lub argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Węzły mobilne i komputerowe w systemie Linux używają dołączonej, należącej do aplikacji strony A2UI do renderowania z obsługą akcji.
- Obsługiwany jest tylko format JSONL A2UI v0.8 (v0.9/createSurface jest odrzucany).
- Systemy iOS i Android renderują zdalne strony Canvas Gateway, ale akcje przycisków A2UI są wysyłane tylko z dołączonej, należącej do aplikacji strony A2UI. Strony A2UI HTTP/HTTPS hostowane przez Gateway na tych klientach mobilnych służą wyłącznie do renderowania.
- System macOS może wysyłać akcje z dokładnej strony A2UI Gateway o zakresie określonym przez możliwości, wybranej przez aplikację. Inne strony HTTP/HTTPS służą wyłącznie do renderowania.
- System Linux wysyła akcje tylko z dołączonej strony A2UI. Inne strony HTTP/HTTPS służą wyłącznie do renderowania, a bezinterfejsowy węzeł Linux bez aplikacji komputerowej nie ogłasza Canvas.

## Zdjęcia i filmy (kamera węzła)

Zdjęcia (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # domyślnie: oba kierunki kamery (2 wiersze MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Klipy wideo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Uwagi:

- Węzeł musi znajdować się **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Węzły ograniczają czas trwania klipu, aby zachować rozsądny rozmiar ładunku base64 (dokładne limity dla poszczególnych platform zawiera strona [Przechwytywanie obrazu z kamery](/pl/nodes/camera)). Narzędzie agenta `nodes` dodatkowo ogranicza żądaną wartość `durationMs` do 300000 (5 minut) przed przekazaniem wywołania; sam węzeł egzekwuje bardziej rygorystyczny limit.
- Android wyświetli prośbę o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy będzie to możliwe; odrzucenie uprawnień powoduje błąd `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (węzły)

Obsługiwane węzły udostępniają `screen.record` (mp4). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy węzła.
- Narzędzie agenta `nodes` ogranicza żądaną wartość `durationMs` do 300000 (5 minut); węzeł może wymusić niższy limit, aby ograniczyć rozmiar zwracanego ładunku.
- `--no-audio` wyłącza przechwytywanie dźwięku z mikrofonu na obsługiwanych platformach.
- Gdy dostępnych jest wiele ekranów, użyj `--screen <index>`, aby wybrać ekran (0 = główny).

## Lokalizacja (węzły)

Węzły udostępniają `location.get`, gdy w ustawieniach włączono lokalizację.

Pomocnicze polecenie CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- Opcja „Always” wymaga uprawnienia systemowego; pobieranie w tle odbywa się w miarę możliwości.
- Odpowiedź zawiera szerokość i długość geograficzną, dokładność (w metrach) oraz znacznik czasu.
- Pełny format parametrów i odpowiedzi oraz kody błędów: [Polecenie lokalizacji](/pl/nodes/location-command).

## SMS (węzły Android)

Węzły Android mogą udostępniać `sms.send` i `sms.search`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię. Oba polecenia są domyślnie uznawane za niebezpieczne: operator Gateway musi również dodać je do `gateway.nodes.allowCommands`, zanim będzie można je wywołać (zobacz [Zasady poleceń](#command-policy)).

Aby włączyć wyszukiwanie wiadomości SMS tylko do odczytu, należy jawnie zezwolić na nie w `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Dodaj `sms.send` osobno tylko wtedy, gdy węzeł ma również mieć możliwość wysyłania wiadomości. Uprawnienie systemu Android i autoryzacja poleceń Gateway są niezależne; przyznanie uprawnienia na telefonie nie zmienia zasad Gateway.

Wywołanie niskopoziomowe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- `sms.search` można zadeklarować przed przyznaniem `READ_SMS`, aby wywołanie mogło zwrócić diagnostykę uprawnień; odczytywanie wiadomości nadal wymaga tego uprawnienia systemu Android.
- Urządzenia działające wyłącznie przez Wi-Fi i nieobsługujące telefonii nie będą zgłaszać `sms.send`.
- Błąd `requires explicit gateway.nodes.allowCommands opt-in` oznacza, że telefon zadeklarował polecenie, ale operator Gateway go nie autoryzował.

## Polecenia dotyczące urządzenia i danych osobowych

Węzły iOS i Android domyślnie zgłaszają kilka poleceń danych tylko do odczytu (zobacz tabelę [Zasady poleceń](#command-policy)); Android dodatkowo udostępnia większą grupę poleceń, których dostępność zależy od odpowiednich ustawień w aplikacji.

Dostępne grupy:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — tylko Android; `device.apps` wymaga włączenia udostępniania zainstalowanych aplikacji w ustawieniach systemu Android i domyślnie zwraca aplikacje widoczne w programie uruchamiającym.
- `notifications.list`, `notifications.actions` — tylko Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (domyślnie tylko do odczytu); `contacts.add` jest niebezpieczne i wymaga `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (domyślnie tylko do odczytu); `calendar.add` jest niebezpieczne i wymaga `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (domyślnie tylko do odczytu); `reminders.add` jest niebezpieczne i wymaga `gateway.nodes.allowCommands`.
- `callLog.search` — tylko Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; dostępność zależy od dostępnych czujników.

Przykładowe wywołania:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Polecenia systemowe (host węzła / węzeł Mac)

Węzeł macOS udostępnia `system.run`, `system.which`, `system.notify` i `system.execApprovals.get/set`. Bezinterfejsowy host węzła udostępnia `system.run.prepare`, `system.run`, `system.which` i `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Uwagi:

- `system.run` zwraca w ładunku standardowe wyjście, standardowe wyjście błędów oraz kod wyjścia.
- Wykonywanie poleceń powłoki odbywa się teraz za pośrednictwem narzędzia `exec` z `host=node`; `nodes` pozostaje bezpośrednim interfejsem RPC dla jawnych poleceń węzła.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; są one dostępne wyłącznie w ścieżce wykonywania.
- Ścieżka wykonywania przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Po udzieleniu zatwierdzenia Gateway przekazuje zapisany plan, a nie pola polecenia, katalogu roboczego ani sesji zmodyfikowane później przez wywołującego.
- `system.notify` uwzględnia stan uprawnień do powiadomień w aplikacji macOS; obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Nierozpoznane metadane `platform` / `deviceFamily` węzła korzystają z zachowawczej domyślnej listy dozwolonych elementów, która wyklucza `system.run` i `system.which`. Jeśli te polecenia są celowo potrzebne na nieznanej platformie, należy dodać je jawnie za pomocą `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- W przypadku nakładek powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` o zakresie żądania są ograniczane do jawnej listy dozwolonych elementów (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji „zawsze zezwalaj” w trybie listy dozwolonych elementów znane nakładki przekazujące (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) zapisują ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek nakładek. Jeśli bezpieczne usunięcie nakładki nie jest możliwe, żaden wpis nie jest automatycznie zapisywany na liście dozwolonych elementów.
- Na hostach węzłów Windows działających w trybie listy dozwolonych elementów uruchamianie za pośrednictwem nakładki powłoki `cmd.exe /c` wymaga zatwierdzenia (sam wpis na liście dozwolonych elementów nie zezwala automatycznie na użycie nakładki).
- Hosty węzłów ignorują nadpisania `PATH` w `--env` i przed uruchomieniem polecenia usuwają duży, utrzymywany zestaw zmiennych uruchomieniowych interpretera lub powłoki (na przykład `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`). Jeśli potrzebne są dodatkowe wpisy PATH, należy skonfigurować środowisko usługi hosta węzła (lub zainstalować narzędzia w standardowych lokalizacjach), zamiast przekazywać `PATH` za pośrednictwem `--env`.
- W trybie węzła macOS `system.run` podlega zatwierdzeniom wykonywania w aplikacji macOS (Settings → Exec approvals). Tryby pytania, listy dozwolonych elementów i pełnego dostępu działają tak samo jak w bezinterfejsowym hoście węzła; odrzucone monity zwracają `SYSTEM_RUN_DENIED`.
- W bezinterfejsowym hoście węzła `system.run` podlega zatwierdzeniom wykonywania (`~/.openclaw/exec-approvals.json`); w przypadku systemu macOS zobacz poniżej zmienne środowiskowe kierowania hosta wykonywania w sekcji [Bezinterfejsowy host węzła](#headless-node-host-cross-platform).

## Powiązanie węzła wykonywania

Gdy dostępnych jest wiele węzłów, można powiązać wykonywanie z określonym węzłem. Ustawia to domyślny węzeł dla `exec host=node` (ustawienie można zastąpić dla poszczególnych agentów).

Globalne ustawienie domyślne:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ustawienie dla agenta:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny węzeł:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa uprawnień

Węzły mogą zawierać mapę `permissions` w `node.list` / `node.describe`, indeksowaną według nazwy uprawnienia (np. `screenRecording`, `accessibility`, `location`) i zawierającą wartości logiczne (`true` = przyznano).

## Bezinterfejsowy host węzła (wieloplatformowy)

OpenClaw może uruchomić **bezinterfejsowy host węzła** (bez interfejsu użytkownika), który łączy się z WebSocket Gateway i udostępnia `system.run` / `system.which`. Jest to przydatne w systemach Linux/Windows lub do uruchamiania minimalnego węzła obok serwera.

Uruchomienie:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie jest nadal wymagane (Gateway wyświetli monit o parowanie urządzenia).
- Metadane instancji klienta, podpisana tożsamość urządzenia i uwierzytelnianie parowania korzystają z osobnych plików; zobacz [Stan tożsamości bezinterfejsowej](#headless-identity-state).
- Zatwierdzenia wykonywania są wymuszane lokalnie za pośrednictwem `~/.openclaw/exec-approvals.json` (zobacz [Zatwierdzenia wykonywania](/pl/tools/exec-approvals)).
- W systemie macOS bezinterfejsowy host węzła domyślnie wykonuje `system.run` lokalnie. Ustaw `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host wykonywania aplikacji towarzyszącej; dodaj `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i bezpiecznie przerwać działanie, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy WebSocket Gateway korzysta z TLS.

## Tryb węzła Mac

- Aplikacja paska menu systemu macOS łączy się z serwerem WebSocket Gateway jako węzeł (dzięki czemu `openclaw nodes …` działa na tym komputerze Mac).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
