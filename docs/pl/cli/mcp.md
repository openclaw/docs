---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami obsługiwanymi przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie definicjami serwerów MCP zapisanymi przez OpenClaw
sidebarTitle: MCP
summary: Udostępniaj konwersacje kanałów OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-07-16T18:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ma dwa zadania:

- uruchamianie OpenClaw jako serwera MCP za pomocą `openclaw mcp serve`
- zarządzanie definicjami wychodzących serwerów MCP zarządzanych przez OpenClaw za pomocą `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` i `unset`

`serve` oznacza OpenClaw działający jako serwer MCP. Pozostałe podpolecenia dotyczą OpenClaw działającego jako rejestr serwerów po stronie klienta MCP, z którego jego środowiska uruchomieniowe mogą później korzystać.

<Note>
  `list`, `show`, `set` i `unset` odczytują i zapisują wyłącznie wpisy `mcp.servers` zarządzane przez OpenClaw w konfiguracji OpenClaw. Nie obejmują serwerów mcporter z `config/mcporter.json`; w przypadku tego rejestru należy użyć `mcporter list`.
</Note>

Gdy OpenClaw ma samodzielnie hostować sesję środowiska programistycznego i kierować to środowisko uruchomieniowe przez ACP, należy użyć [`openclaw acp`](/pl/cli/acp).

## Wybór właściwej ścieżki MCP

| Cel                                                                | Użycie                                                                  | Powód                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Umożliwienie zewnętrznemu klientowi MCP odczytywania i wysyłania konwersacji kanałów OpenClaw | `openclaw mcp serve`                                                 | OpenClaw jest serwerem MCP i udostępnia przez standardowe wejście i wyjście konwersacje obsługiwane przez Gateway.                                 |
| Zapisywanie serwerów MCP innych firm na potrzeby uruchomień agentów zarządzanych przez OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw jest rejestrem po stronie klienta MCP i później przekazuje te serwery do kwalifikujących się środowisk uruchomieniowych.               |
| Sprawdzanie zapisanego serwera bez wykonywania tury agenta                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` i `doctor` sprawdzają konfigurację; `probe` otwiera aktywne połączenie MCP i wyświetla listę możliwości.               |
| Edytowanie konfiguracji MCP w przeglądarce                                      | Interfejs sterowania `/settings/mcp` (alias `/mcp`)                            | Strona przedstawia spis, stan włączenia, podsumowania OAuth i filtrów, podpowiedzi poleceń oraz edytor `mcp` o ograniczonym zakresie.         |
| Udostępnianie serwerowi aplikacji Codex natywnego serwera MCP o ograniczonym zakresie                    | `mcp.servers.<name>.codex`                                           | Blok `codex` wpływa wyłącznie na projekcję wątków serwera aplikacji Codex i jest usuwany przed przekazaniem natywnej konfiguracji. |
| Uruchamianie sesji środowiska programistycznego hostowanych przez ACP                                     | [`openclaw acp`](/pl/cli/acp) i [Agenci ACP](/pl/tools/acp-agents-setup) | Tryb mostu ACP nie obsługuje wstrzykiwania serwerów MCP dla poszczególnych sesji; zamiast tego należy skonfigurować mosty Gateway lub Plugin.     |

<Tip>
W razie wątpliwości, której ścieżki użyć, należy zacząć od `openclaw mcp status --verbose`. Pokazuje ono elementy zapisane przez OpenClaw bez uruchamiania serwerów MCP.
</Tip>

## OpenClaw jako serwer MCP

Jest to ścieżka `openclaw mcp serve`.

### Kiedy używać polecenia serve

Należy użyć `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma komunikować się bezpośrednio z konwersacjami kanałów obsługiwanymi przez OpenClaw
- lokalny lub zdalny OpenClaw Gateway ze skierowanymi sesjami jest już dostępny
- potrzebny jest jeden serwer MCP działający ze wszystkimi backendami kanałów OpenClaw zamiast oddzielnych mostów dla każdego kanału

Zamiast tego należy użyć [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma samodzielnie hostować środowisko programistyczne i przechowywać sesję agenta wewnątrz OpenClaw.

### Sposób działania

`openclaw mcp serve` uruchamia serwer MCP korzystający ze standardowego wejścia i wyjścia. Proces ten należy do klienta MCP. Dopóki klient utrzymuje otwartą sesję standardowego wejścia i wyjścia, most łączy się przez WebSocket z lokalnym lub zdalnym OpenClaw Gateway i udostępnia skierowane konwersacje kanałów przez MCP.

<Steps>
  <Step title="Klient uruchamia most">
    Klient MCP uruchamia `openclaw mcp serve`.
  </Step>
  <Step title="Most łączy się z Gateway">
    Most łączy się przez WebSocket z OpenClaw Gateway.
  </Step>
  <Step title="Sesje stają się konwersacjami MCP">
    Skierowane sesje stają się konwersacjami MCP oraz narzędziami transkrypcji i historii.
  </Step>
  <Step title="Kolejkowanie zdarzeń na żywo">
    Zdarzenia na żywo są kolejkowane w pamięci, dopóki most pozostaje połączony.
  </Step>
  <Step title="Opcjonalne powiadomienia push Claude">
    Jeśli włączono tryb kanału Claude, ta sama sesja może również odbierać powiadomienia push przeznaczone dla Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - stan kolejki na żywo rozpoczyna się po nawiązaniu połączenia przez most
    - starsza historia transkrypcji jest odczytywana za pomocą `messages_read`
    - powiadomienia push Claude istnieją tylko w czasie trwania sesji MCP
    - po rozłączeniu klienta most kończy działanie, a kolejka na żywo znika
    - jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i `openclaw infer model run`, zamykają wszystkie otwarte przez siebie dołączone środowiska uruchomieniowe MCP po zakończeniu odpowiedzi, dzięki czemu powtarzane uruchomienia skryptowe nie gromadzą procesów potomnych MCP korzystających ze standardowego wejścia i wyjścia
    - serwery MCP korzystające ze standardowego wejścia i wyjścia, uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika), są podczas zamykania kończone wraz z całym drzewem procesów, dzięki czemu podprocesy uruchomione przez serwer nie pozostają aktywne po zakończeniu nadrzędnego klienta standardowego wejścia i wyjścia
    - usunięcie lub zresetowanie sesji zwalnia klientów MCP tej sesji za pośrednictwem wspólnej ścieżki czyszczenia środowiska uruchomieniowego, dzięki czemu nie pozostają żadne aktywne połączenia standardowego wejścia i wyjścia powiązane z usuniętą sesją

  </Accordion>
</AccordionGroup>

### Wybór trybu klienta

<Tabs>
  <Tab title="Ogólni klienci MCP">
    Tylko standardowe narzędzia MCP. Należy używać `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz narzędzi zatwierdzania.
  </Tab>
  <Tab title="Claude Code">
    Standardowe narzędzia MCP oraz adapter kanału przeznaczony dla Claude. Należy włączyć `--claude-channel-mode on` lub pozostawić wartość domyślną `auto`.
  </Tab>
</Tabs>

<Note>
Obecnie `auto` działa tak samo jak `on`. Wykrywanie możliwości klienta nie jest jeszcze dostępne.
</Note>

### Elementy udostępniane przez serve

Most używa istniejących metadanych tras sesji Gateway do udostępniania konwersacji obsługiwanych przez kanały. Konwersacja pojawia się, gdy OpenClaw ma już stan sesji ze znaną trasą, zawierającą na przykład:

- `channel`
- metadane odbiorcy lub miejsca docelowego
- opcjonalnie `accountId`
- opcjonalnie `threadId`

Dzięki temu klienci MCP mogą w jednym miejscu:

- wyświetlać listę ostatnich skierowanych konwersacji
- odczytywać ostatnią historię transkrypcji
- oczekiwać na nowe zdarzenia przychodzące
- wysyłać odpowiedź tą samą trasą
- wyświetlać żądania zatwierdzenia przychodzące podczas połączenia mostu

### Użycie

<Tabs>
  <Tab title="Lokalny Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Zdalny Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Zdalny Gateway (hasło)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Tryb szczegółowy / Claude wyłączony">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Narzędzia mostu

<AccordionGroup>
  <Accordion title="conversations_list">
    Wyświetla listę ostatnich konwersacji obsługiwanych przez sesje, które mają już metadane tras w stanie sesji Gateway.

    Filtry: `limit` (maks. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Zwraca jedną konwersację według `session_key`, korzystając z bezpośredniego wyszukiwania sesji Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Odczytuje ostatnie wiadomości transkrypcji z jednej konwersacji obsługiwanej przez sesję. Wartość domyślna `limit` wynosi 20, a maksymalna 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Wyodrębnia bloki zawartości innej niż tekst z jednej wiadomości transkrypcji. Jest to widok metadanych zawartości transkrypcji, a nie niezależny, trwały magazyn obiektów załączników.
  </Accordion>
  <Accordion title="events_poll">
    Odczytuje zdarzenia na żywo umieszczone w kolejce od pozycji wskazanej kursorem liczbowym. Maksymalna wartość `limit` wynosi 200.
  </Accordion>
  <Accordion title="events_wait">
    Stosuje długie odpytywanie do czasu nadejścia następnego pasującego zdarzenia w kolejce lub upłynięcia limitu czasu (domyślnie 30s, maksymalnie 300s).

    Należy tego użyć, gdy ogólny klient MCP potrzebuje dostarczania niemal w czasie rzeczywistym bez protokołu push przeznaczonego dla Claude.

  </Accordion>
  <Accordion title="messages_send">
    Wysyła tekst tą samą trasą, która jest już zapisana w sesji.

    Obecne zachowanie:

    - wymaga istniejącej trasy konwersacji
    - używa kanału, odbiorcy, identyfikatora konta i identyfikatora wątku sesji
    - wysyła wyłącznie tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Wyświetla oczekujące żądania zatwierdzenia wykonania lub Pluginu zaobserwowane przez most od czasu połączenia z Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Rozstrzyga jedno oczekujące żądanie zatwierdzenia wykonania lub Pluginu za pomocą:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci, dopóki pozostaje połączony.

Obecne typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kolejka obejmuje wyłącznie zdarzenia na żywo; rozpoczyna działanie wraz z mostem MCP
- `events_poll` i `events_wait` nie odtwarzają samodzielnie starszej historii Gateway
- trwałe zaległe dane należy odczytywać za pomocą `messages_read`

</Warning>

### Powiadomienia kanału Claude

Most może również udostępniać powiadomienia kanału przeznaczone dla Claude. Jest to odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają dostępne, ale wiadomości przychodzące na żywo mogą również docierać jako powiadomienia MCP przeznaczone dla Claude.

<Tabs>
  <Tab title="wyłączone">
    `--claude-channel-mode off`: tylko standardowe narzędzia MCP.
  </Tab>
  <Tab title="włączone">
    `--claude-channel-mode on`: włącza powiadomienia kanału Claude.
  </Tab>
  <Tab title="automatycznie (domyślnie)">
    `--claude-channel-mode auto`: obecna wartość domyślna; zachowanie mostu jest takie samo jak w przypadku `on`.
  </Tab>
</Tabs>

Po włączeniu trybu kanału Claude serwer ogłasza eksperymentalne możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkrypcji `user` są przekazywane jako `notifications/claude/channel`
- żądania uprawnień Claude otrzymane przez MCP są śledzone w pamięci
- jeśli właściciel polecenia w połączonej konwersacji wyśle później `yes <id>` lub `no <id>` (`<id>` to 5-literowy identyfikator żądania, bez `l`), most przekształca to w `notifications/claude/channel/permission`
- te powiadomienia są dostępne wyłącznie w aktywnej sesji; po rozłączeniu klienta MCP nie istnieje cel powiadomień push

To zachowanie jest celowo dostosowane do konkretnego klienta. Ogólni klienci MCP powinni korzystać ze standardowych narzędzi odpytywania.

### Konfiguracja klienta MCP

Przykładowa konfiguracja klienta korzystającego ze standardowego wejścia i wyjścia:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

W przypadku większości ogólnych klientów MCP należy zacząć od standardowego zestawu narzędzi i zignorować tryb Claude. Tryb Claude należy włączyć tylko dla klientów, którzy faktycznie obsługują metody powiadomień specyficzne dla Claude.

### Opcje

`openclaw mcp serve` obsługuje:

<ParamField path="--url" type="string">
  Adres URL WebSocket Gateway. Gdy jest skonfigurowany, wartością domyślną jest `gateway.remote.url`.
</ParamField>
<ParamField path="--token" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Odczytuje token z pliku.
</ParamField>
<ParamField path="--password" type="string">
  Hasło Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Odczytuje hasło z pliku.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Tryb powiadomień Claude. Wartość domyślna: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Szczegółowe dzienniki na stderr.
</ParamField>

<Tip>
Jeśli to możliwe, należy preferować `--token-file` lub `--password-file` zamiast sekretów podawanych bezpośrednio.
</Tip>

### Granica bezpieczeństwa i zaufania

Most nie tworzy reguł routingu. Udostępnia tylko konwersacje, które Gateway już potrafi przekierować.

Oznacza to, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać wyłącznie przez istniejącą zapisaną trasę
- stan zatwierdzeń jest dostępny tylko na żywo/w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokenu lub hasła Gateway, którym można zaufać w przypadku każdego innego zdalnego klienta Gateway

Jeśli w `conversations_list` brakuje konwersacji, zwykle przyczyną nie jest konfiguracja MCP. Powodem są brakujące lub niekompletne metadane trasy w bazowej sesji Gateway.

### Testowanie

OpenClaw zawiera deterministyczny test smoke w Dockerze dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten test smoke uruchamia jeden kontener: inicjuje stan konwersacji, uruchamia Gateway, następnie uruchamia `openclaw mcp serve` jako proces potomny stdio i steruje nim jak klientem MCP. Weryfikuje wykrywanie konwersacji, odczyt transkrypcji, odczyt metadanych załączników, zachowanie kolejki zdarzeń na żywo oraz powiadomienia o kanałach i uprawnieniach w stylu Claude za pośrednictwem rzeczywistego mostu MCP stdio. Routing wysyłania wychodzącego (`messages_send` ponownie wykorzystujący zapisaną trasę konwersacji) jest oddzielnie objęty testami jednostkowymi w `src/mcp/channel-server.test.ts`.

Jest to najszybszy sposób na potwierdzenie działania mostu bez podłączania do testu rzeczywistego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania opisano w sekcji [Testowanie](/pl/help/testing).

### Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie zwrócono żadnych konwersacji">
    Zwykle oznacza to, że sesja Gateway nie obsługuje jeszcze routingu. Należy potwierdzić, że bazowa sesja ma zapisane metadane kanału/dostawcy, odbiorcy oraz opcjonalnie konta/wątku trasy.
  </Accordion>
  <Accordion title="events_poll lub events_wait pomija starsze wiadomości">
    Jest to oczekiwane. Kolejka na żywo zaczyna działać po połączeniu mostu. Starszą historię transkrypcji należy odczytać za pomocą `messages_read`.
  </Accordion>
  <Accordion title="Powiadomienia Claude nie są wyświetlane">
    Należy sprawdzić wszystkie poniższe kwestie:

    - klient utrzymał otwartą sesję MCP stdio
    - `--claude-channel-mode` ma wartość `on` lub `auto`
    - klient faktycznie obsługuje metody powiadomień specyficzne dla Claude
    - wiadomość przychodząca pojawiła się po połączeniu mostu

  </Accordion>
  <Accordion title="Brakuje zatwierdzeń">
    `permissions_list_open` wyświetla tylko żądania zatwierdzenia zaobserwowane, gdy most był połączony. Nie jest to API trwałej historii zatwierdzeń.
  </Accordion>
</AccordionGroup>

## OpenClaw jako rejestr klientów MCP

Jest to ścieżka `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP obsługiwanymi przez OpenClaw w sekcji `mcp.servers` konfiguracji OpenClaw. Nie odczytują serwerów mcporter z `config/mcporter.json`.

Zapisane definicje są przeznaczone dla środowisk uruchomieniowych, które OpenClaw uruchamia lub konfiguruje później, takich jak osadzony OpenClaw i inne adaptery środowiska uruchomieniowego. OpenClaw przechowuje definicje centralnie, dzięki czemu te środowiska nie muszą utrzymywać własnych, zduplikowanych list serwerów MCP.

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - te polecenia wyłącznie odczytują lub zapisują konfigurację OpenClaw
    - `status`, `list`, `show`, `doctor` bez `--probe`, `set`, `configure`, `tools`, `logout`, `reload` i `unset` nie łączą się z docelowym serwerem MCP
    - `login` wykonuje sieciowy przepływ OAuth MCP dla skonfigurowanego serwera HTTP i zapisuje uzyskane lokalne dane uwierzytelniające
    - `status --verbose` wyświetla wskazówki dotyczące rozpoznanego transportu, uwierzytelniania, limitu czasu, filtrów i równoległych wywołań narzędzi bez nawiązywania połączenia
    - `doctor` sprawdza zapisane definicje pod kątem lokalnych problemów z konfiguracją, takich jak brakujące polecenia stdio, nieprawidłowe katalogi robocze, brakujące pliki TLS, wyłączone serwery, jawne wartości poufnych nagłówków/zmiennych środowiskowych i nieukończona autoryzacja OAuth
    - `doctor --probe` po pomyślnym przejściu kontroli statycznych dodaje ten sam dowód połączenia na żywo co `probe`
    - `probe` łączy się z wybranym serwerem lub wszystkimi skonfigurowanymi serwerami, wyświetla listę narzędzi oraz raportuje możliwości/diagnostykę
    - `add` tworzy definicję na podstawie flag i przeprowadza test przed zapisaniem, chyba że ustawiono `--no-probe` lub najpierw wymagana jest autoryzacja OAuth
    - adaptery środowiska uruchomieniowego w czasie wykonywania decydują, które kształty transportu faktycznie obsługują
    - `enabled: false` pozostawia serwer zapisany, ale wyklucza go z wykrywania przez osadzone środowisko uruchomieniowe
    - `timeout` i `connectTimeout` ustawiają limity czasu żądań i połączeń dla poszczególnych serwerów w sekundach
    - `supportsParallelToolCalls: true` oznacza serwery, które adaptery mogą wywoływać równolegle
    - serwery HTTP mogą używać statycznych nagłówków, logowania OAuth, sterowania weryfikacją TLS oraz ścieżek certyfikatu/klucza mTLS
    - osadzony OpenClaw udostępnia skonfigurowane narzędzia MCP w zwykłych profilach narzędzi `coding` i `messaging`; `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` jawnie je wyłącza
    - ustawienia `toolFilter.include` i `toolFilter.exclude` dla poszczególnych serwerów filtrują wykryte narzędzia MCP, zanim staną się narzędziami OpenClaw
    - serwery, które deklarują zasoby lub monity, udostępniają również narzędzia pomocnicze do wyświetlania/odczytywania zasobów oraz wyświetlania/pobierania monitów; wygenerowane nazwy tych narzędzi pomocniczych (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) korzystają z tego samego filtra uwzględniania/wykluczania
    - dynamiczne zmiany listy narzędzi MCP unieważniają katalog w pamięci podręcznej dla danej sesji; kolejne wykrycie/użycie odświeża go z serwera
    - powtarzające się błędy żądań/protokołu narzędzi MCP na krótko wstrzymują ten serwer, aby jeden uszkodzony serwer nie zużył całej tury
    - dołączone środowiska uruchomieniowe MCP o zakresie sesji są usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; aby wyłączyć, należy ustawić `0`), a jednorazowe osadzone uruchomienia czyszczą je po zakończeniu

  </Accordion>
</AccordionGroup>

Adaptery środowiska uruchomieniowego mogą normalizować ten wspólny rejestr do kształtu oczekiwanego przez ich klienta podrzędnego. Na przykład osadzony OpenClaw używa bezpośrednio wartości `transport` OpenClaw, natomiast Claude Code i Gemini otrzymują natywne dla CLI wartości `type`, takie jak `http`, `sse` lub `stdio`.

Serwer aplikacji Codex uwzględnia również opcjonalny blok `codex` na każdym serwerze. Są to
metadane projekcji OpenClaw przeznaczone wyłącznie dla wątków serwera aplikacji Codex; nie
zmieniają sesji ACP, ogólnej konfiguracji środowiska Codex ani innych adapterów środowiska uruchomieniowego.
Niepustego `codex.agents` należy użyć, aby projektować serwer wyłącznie do określonych
identyfikatorów agentów OpenClaw. Puste, zawierające wyłącznie białe znaki lub nieprawidłowe listy agentów są odrzucane przez
walidację konfiguracji i pomijane przez ścieżkę projekcji środowiska uruchomieniowego, zamiast stawać się
globalne. Należy użyć `codex.defaultToolsApprovalMode` (`auto`, `prompt` lub `approve`),
aby wyemitować natywne `default_tools_approval_mode` systemu Codex dla zaufanego serwera.
OpenClaw usuwa metadane `codex` przed przekazaniem natywnej konfiguracji `mcp_servers`
do Codex.

### Zapisane definicje serwerów MCP

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wyświetla pełny skonfigurowany obiekt serwera MCP.
- `status` klasyfikuje skonfigurowane transporty bez nawiązywania połączenia. `--verbose` uwzględnia rozpoznane szczegóły uruchamiania, limitu czasu, OAuth, filtrów i wywołań równoległych.
- `doctor` wykonuje kontrole statyczne bez nawiązywania połączenia. Należy dodać `--probe`, jeśli polecenie ma również sprawdzić, czy włączone serwery nawiązują połączenie.
- `probe` nawiązuje połączenie i raportuje liczbę narzędzi, obsługę zasobów/monitów, obsługę zmian listy oraz diagnostykę.
- `add` przyjmuje flagi stdio, takie jak `--command`, `--arg`, `--env` i `--cwd`, albo flagi HTTP, takie jak `--url`, `--transport`, `--header`, `--auth oauth`, a także flagi TLS, limitu czasu i wyboru narzędzi.
- `set` oczekuje w wierszu poleceń jednej wartości będącej obiektem JSON.
- `configure` aktualizuje stan włączenia, filtry narzędzi, limity czasu, OAuth, TLS i wskazówki dotyczące równoległych wywołań narzędzi bez zastępowania całej definicji serwera. Należy dodać `--probe`, aby zweryfikować zaktualizowany serwer przed zapisaniem.
- `tools` aktualizuje filtry narzędzi dla poszczególnych serwerów. Wpisy uwzględniania/wykluczania są nazwami narzędzi MCP i prostymi wzorcami glob `*`.
- `login` uruchamia przepływ OAuth dla serwerów HTTP skonfigurowanych z `auth: "oauth"`. Pierwsze uruchomienie wyświetla adres URL autoryzacji; po zatwierdzeniu należy ponownie uruchomić polecenie z `--code`.
- `logout` usuwa zapisane dane uwierzytelniające OAuth dla wskazanego serwera bez usuwania zapisanej definicji serwera.
- `reload` usuwa z pamięci podręcznej środowiska uruchomieniowe MCP działające w procesie wyłącznie dla bieżącego procesu CLI. Procesy Gateway lub agenta działające w innym procesie nadal wymagają własnej ścieżki ponownego wczytania lub ponownego uruchomienia.
- Dla serwerów MCP korzystających ze Streamable HTTP należy użyć `transport: "streamable-http"`. `openclaw mcp set` normalizuje również natywne dla CLI `type: "http"` do tego samego kanonicznego kształtu konfiguracji w celu zapewnienia zgodności.
- `unset` kończy się niepowodzeniem, jeśli wskazany serwer nie istnieje.

Przykłady:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Typowe konfiguracje serwerów

Te przykłady zapisują tylko definicje serwerów. Następnie uruchom `openclaw mcp doctor --probe`, aby potwierdzić, że serwer się uruchamia i udostępnia narzędzia.

<Tabs>
  <Tab title="System plików">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Ogranicz serwery systemu plików do najmniejszego drzewa katalogów, które agent powinien odczytywać lub edytować.

  </Tab>
  <Tab title="Pamięć">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Użyj filtra narzędzi, jeśli serwer udostępnia narzędzia zapisu, które nie powinny być dostępne dla zwykłych agentów.

  </Tab>
  <Tab title="Skrypt lokalny">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` sprawdza, czy `cwd` istnieje i czy polecenie jest rozpoznawane w skonfigurowanym środowisku.

  </Tab>
  <Tab title="Zdalny HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Użyj OAuth, gdy zdalny serwer go obsługuje. Jeśli serwer wymaga statycznych nagłówków, unikaj zatwierdzania w repozytorium dosłownych tokenów okaziciela.

  </Tab>
  <Tab title="Pulpit/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Serwery bezpośredniego sterowania pulpitem dziedziczą uprawnienia uruchamianego procesu. Używaj wąskich filtrów narzędzi i monitów o uprawnienia na poziomie systemu operacyjnego.

  </Tab>
</Tabs>

### Struktury danych wyjściowych JSON

Używaj `--json` w skryptach i panelach. Zestawy pól mogą z czasem się rozszerzać, dlatego odbiorcy powinni ignorować nieznane klucze.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Poświadczenia OAuth nie są autoryzowane; uruchom openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` kończy działanie z niezerowym kodem, gdy którykolwiek włączony i sprawdzony serwer ma problem poziomu `error`. Problemy `warning` i `info` są zgłaszane, ale same w sobie nie powodują niepowodzenia polecenia.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` otwiera aktywną sesję klienta MCP i bezpośrednio wyświetla jej wynik; w przeciwieństwie do `status`/`doctor` dane wyjściowe nie zawierają pola najwyższego poziomu `path`. Klucze `resources` i `prompts` występują tylko wtedy, gdy serwer faktycznie deklaruje daną funkcję (serwer bez monitów pomija klucz `prompts`, zamiast zgłaszać `false`). Używaj `probe` do potwierdzania osiągalności i możliwości, a nie do statycznych audytów konfiguracji.

  </Accordion>
</AccordionGroup>

Przykładowa struktura konfiguracji:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transport Stdio

Uruchamia lokalny proces potomny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                                      |
| -------------------------- | ----------------------------------------- |
| `command`         | Plik wykonywalny do uruchomienia (wymagany) |
| `args`         | Tablica argumentów wiersza poleceń        |
| `env`         | Dodatkowe zmienne środowiskowe             |
| `cwd` / `workingDirectory` | Katalog roboczy procesu |

<Warning>
**Filtr bezpieczeństwa środowiska Stdio**

OpenClaw odrzuca klucze środowiskowe uruchamiania interpretera, przejmowania modułu ładującego i inicjalizacji powłoki przed uruchomieniem serwera MCP Stdio, nawet jeśli występują one w bloku `env` serwera. Wykorzystuje to te same zasady bezpieczeństwa środowiska hosta, które obowiązują inne procesy uruchamiane przez OpenClaw: blokowane są znane haki uruchamiania interpretera (na przykład `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), prefiksy wstrzykiwania bibliotek współdzielonych i funkcji (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) oraz podobne zmienne sterujące środowiskiem uruchomieniowym. Podczas uruchamiania są one po cichu usuwane i rejestrowane jest ostrzeżenie, aby nie mogły wstrzyknąć niejawnego kodu inicjalizacyjnego, podmienić interpretera, włączyć debugera ani przejąć dynamicznego konsolidatora procesu Stdio. Jawna lista dozwolonych wartości umożliwia używanie zwykłych zmiennych środowiskowych poświadczeń MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), a także zwykłych zmiennych serwera proxy i zmiennych właściwych dla serwera (`HTTP_PROXY`, niestandardowe `*_API_KEY` itd.). Inne klucze `AWS_*`, takie jak `AWS_CONFIG_FILE` i `AWS_SHARED_CREDENTIALS_FILE`, pozostają zablokowane, ponieważ wskazują pliki poświadczeń, zamiast bezpośrednio zawierać wartość poświadczenia.

Jeśli serwer MCP rzeczywiście wymaga jednej z zablokowanych zmiennych, ustaw ją w procesie hosta Gateway, a nie w `env` serwera Stdio.
</Warning>

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez zdarzenia HTTP Server-Sent Events.

| Pole                           | Opis                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `url`             | Adres URL HTTP lub HTTPS zdalnego serwera (wymagany)               |
| `headers`             | Opcjonalna mapa nagłówków HTTP z parami klucz-wartość (na przykład tokeny uwierzytelniające) |
| `connectionTimeoutMs`             | Limit czasu połączenia dla serwera w ms (opcjonalny)               |
| `connectTimeout`             | Limit czasu połączenia dla serwera w sekundach (opcjonalny)        |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms |
| `auth: "oauth"`             | Użyj poświadczeń MCP OAuth zapisanych przez `openclaw mcp login`     |
| `sslVerify`             | Ustaw wartość false tylko dla jawnie zaufanych prywatnych punktów końcowych HTTPS |
| `clientCert` / `clientKey` | Ścieżki certyfikatu i klucza klienta mTLS              |
| `supportsParallelToolCalls`             | Wskazówka, że równoczesne wywołania są bezpieczne dla tego serwera |

Przykład:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Wrażliwe wartości w `url` (informacjach o użytkowniku) i `headers` są maskowane w dziennikach i danych wyjściowych stanu. `openclaw mcp doctor` ostrzega, gdy wpisy `headers` lub `env` wyglądające na wrażliwe zawierają wartości literałowe, aby operatorzy mogli usunąć te wartości z konfiguracji zatwierdzanej w repozytorium.

### Przepływ pracy OAuth

OAuth jest przeznaczony dla serwerów MCP HTTP, które deklarują obsługę przepływu OAuth MCP. Statyczne nagłówki `Authorization` są ignorowane dla serwera, gdy włączono `auth: "oauth"`. Poświadczenia zapisane przez `openclaw mcp login` działają z osadzonym MCP, programami uruchamiającymi CLI i lokalnym serwerem aplikacji Codex.

Dopóki poświadczenia nie będą dostępne, OpenClaw pomija w środowisku uruchomieniowym agenta tylko ten serwer MCP, zamiast powodować niepowodzenie tury agenta. Operator lub agent z dostępem do powłoki może następnie uruchomić `openclaw mcp login <name>` i użyć serwera w późniejszej turze.

Gdy zdalna usługa MCP jest już obsługiwana przez oddzielny profil uwierzytelniania OpenClaw z możliwością odświeżania, można opcjonalnie ustawić `oauth.authProfileId`. OpenClaw odświeża jedno ze źródeł poświadczeń przed projekcją środowiska uruchomieniowego i przekazuje klientowi MCP niższego poziomu tylko aktualny token dostępu.

<Steps>
  <Step title="Zapisz serwer">
    Dodaj lub zaktualizuj serwer za pomocą `auth: "oauth"` oraz opcjonalnych metadanych OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    W przypadku tokenu okaziciela opartego na profilu uwierzytelniania zapisz powiązanie profilu:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Rozpocznij logowanie">
    Uruchom logowanie, aby utworzyć żądanie autoryzacji.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw wyświetla adres URL autoryzacji i zapisuje tymczasowy stan weryfikatora OAuth w katalogu stanu OpenClaw.

  </Step>
  <Step title="Zakończ przy użyciu kodu">
    Po zatwierdzeniu w przeglądarce przekaż zwrócony kod z powrotem do OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Sprawdź autoryzację">
    Użyj polecenia status lub doctor, aby potwierdzić obecność tokenów.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Wyczyść dane uwierzytelniające">
    Wylogowanie usuwa zapisane dane uwierzytelniające OAuth, ale zachowuje zapisaną definicję serwera.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Jeśli dostawca rotuje tokeny lub stan autoryzacji się zablokuje, uruchom `openclaw mcp logout <name>`, a następnie ponownie wykonaj `login`. Polecenie `logout` może wyczyścić dane uwierzytelniające zapisanego serwera HTTP nawet po usunięciu `auth: "oauth"` z konfiguracji, o ile nazwa i adres URL serwera nadal identyfikują wpis w magazynie danych uwierzytelniających.

### Transport strumieniowego HTTP

`streamable-http` jest dodatkową opcją transportu obok `sse` i `stdio`. Wykorzystuje strumieniowanie HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                           | Opis                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | Adres URL HTTP lub HTTPS zdalnego serwera (wymagany)                                   |
| `transport`                    | Ustaw na `"streamable-http"`, aby wybrać ten transport; w przypadku pominięcia OpenClaw używa `sse` |
| `headers`                      | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów uwierzytelniających) |
| `connectionTimeoutMs`          | Limit czasu połączenia dla serwera w ms (opcjonalny)                                   |
| `connectTimeout`               | Limit czasu połączenia dla serwera w sekundach (opcjonalny)                            |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms                                 |
| `auth: "oauth"`                | Używa danych uwierzytelniających MCP OAuth zapisanych przez `openclaw mcp login`          |
| `sslVerify`                    | Ustaw na false tylko w przypadku jawnie zaufanych prywatnych punktów końcowych HTTPS   |
| `clientCert` / `clientKey`     | Ścieżki certyfikatu i klucza klienta mTLS                                              |
| `supportsParallelToolCalls`    | Wskazanie, że równoczesne wywołania są bezpieczne dla tego serwera                     |

Konfiguracja OpenClaw używa `transport: "streamable-http"` jako kanonicznej pisowni. Natywne dla CLI wartości MCP `type: "http"` są akceptowane przy zapisywaniu przez `openclaw mcp set` i naprawiane przez `openclaw doctor --fix` w istniejącej konfiguracji, ale osadzony OpenClaw bezpośrednio korzysta z `transport`.

Przykład:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Polecenia rejestru nie uruchamiają mostu kanału. Tylko `probe` i `doctor --probe` otwierają aktywną sesję klienta MCP, aby potwierdzić, że serwer docelowy jest osiągalny.
</Note>

## Interfejs sterowania

Przeglądarkowy interfejs sterowania zawiera dedykowaną stronę ustawień MCP pod adresem `/settings/mcp`; poprzednia ścieżka `/mcp` pozostaje aliasem. Strona wyświetla liczbę skonfigurowanych serwerów, podsumowania włączonych serwerów, OAuth i filtrów, wiersze transportu poszczególnych serwerów, elementy sterujące włączaniem i wyłączaniem, typowe polecenia CLI oraz edytor o zakresie ograniczonym do sekcji konfiguracji `mcp`.

Strona służy do wprowadzania zmian przez operatora i szybkiego przeglądania zasobów. Gdy wymagane jest potwierdzenie działania serwera na żywo, użyj `openclaw mcp doctor --probe` lub `openclaw mcp probe`.

Przepływ pracy operatora:

1. Otwórz interfejs sterowania i wybierz **MCP**.
2. Przejrzyj karty podsumowania całkowitej liczby serwerów oraz serwerów włączonych, korzystających z OAuth i filtrowanych.
3. W każdym wierszu serwera można znaleźć wskazówki dotyczące transportu, uwierzytelniania, filtra, limitu czasu i poleceń.
4. Przełącz stan włączenia, aby zachować definicję, ale wykluczyć ją z wykrywania w środowisku uruchomieniowym.
5. Edytuj sekcję konfiguracji `mcp` o ograniczonym zakresie, aby wprowadzać zmiany strukturalne, takie jak nowe serwery, nagłówki, TLS, metadane OAuth lub filtry narzędzi.
6. Wybierz **Save**, aby tylko zachować konfigurację, lub **Save & Publish**, aby zastosować ją za pośrednictwem ścieżki konfiguracji Gateway.
7. Uruchom `openclaw mcp doctor --probe`, gdy potrzebne jest potwierdzenie na żywo, że edytowany serwer uruchamia się i wyświetla listę narzędzi.

Uwagi:

- fragmenty poleceń ujmują nazwy serwerów w cudzysłowy, dzięki czemu nietypowe nazwy można skopiować do powłoki
- wyświetlane wartości przypominające adresy URL są przed renderowaniem redagowane, jeśli zawierają osadzone dane uwierzytelniające
- strona nie uruchamia samodzielnie transportów MCP
- aktywne środowiska uruchomieniowe mogą wymagać `openclaw mcp reload`, opublikowania konfiguracji Gateway lub ponownego uruchomienia procesu, zależnie od tego, który proces jest właścicielem klientów MCP

## Aplikacje MCP

OpenClaw może renderować narzędzia implementujące stabilne [rozszerzenie MCP Apps](https://modelcontextprotocol.io/extensions/apps). Aplikacje są opcjonalne, ponieważ ich kod HTML pochodzi ze skonfigurowanego serwera MCP i może żądać narzędzi lub zasobów widocznych dla aplikacji z tego samego serwera.

Włącz most hosta:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Po zmianie tego ustawienia uruchom ponownie Gateway. Po włączeniu OpenClaw uruchamia przeznaczony wyłącznie dla piaskownicy nasłuch HTTP(S) na porcie Gateway powiększonym o jeden (dla domyślnego Gateway jest to `18790`). Interfejs sterowania ładuje aplikacje z tego oddzielnego źródła; nasłuch nigdy nie udostępnia interfejsu sterowania, uwierzytelnionych tras Gateway ani danych użytkownika.

Bezpośrednie połączenia z Gateway wymagają dostępu do obu portów. Jeśli odwrotny serwer proxy lub terminator TLS udostępnia interfejs sterowania, należy przydzielić aplikacjom osobne publiczne źródło i przekazywać tylko to źródło do nasłuchu piaskownicy:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Źródło piaskownicy musi różnić się od źródła interfejsu sterowania. Nie należy udostępniać w nim innych uwierzytelnionych ani poufnych treści.

Na przykład oficjalne podstawowe demo React można skonfigurować następująco:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Zachowanie i granice bezpieczeństwa:

- OpenClaw ogłasza rozszerzenie `io.modelcontextprotocol/ui` tylko wtedy, gdy aplikacje są włączone.
- Renderowane są wyłącznie zasoby `ui://` z dokładnym typem MIME `text/html;profile=mcp-app`.
- Zasoby interfejsu użytkownika są ograniczone do 2 MiB, umieszczane za dwuetapowym serwerem proxy iframe w dedykowanym źródle zewnętrznym, ładowane do nieprzezroczystego wewnętrznego źródła aplikacji i ograniczane przez CSP wyprowadzoną z metadanych zasobu.
- Narzędzia przeznaczone wyłącznie dla aplikacji (`_meta.ui.visibility: ["app"]`) nie trafiają na listy narzędzi modelu. Aplikacje mogą wywoływać wyłącznie narzędzia widoczne dla aplikacji na serwerze, do którego należą, i które przechodzą również efektywne zasady OpenClaw dotyczące narzędzi dla przebiegu, w którym utworzono widok.
- Uprawnienia aplikacji powiązane ze źródłem, takie jak dostęp do kamery, mikrofonu i geolokalizacji, nie są przyznawane, gdy wewnętrzne dokumenty aplikacji używają nieprzezroczystych źródeł w celu izolacji między aplikacjami.
- Kod HTML aplikacji, pełne argumenty narzędzi i surowe wyniki znajdują się w ograniczonej, dziesięciominutowej dzierżawie widoku w pamięci i nie są zapisywane na dysku ani kopiowane do metadanych podglądu transkrypcji. Transkrypcja przechowuje tylko ograniczony deskryptor serwera, narzędzia i zasobu powiązany z pierwotnym identyfikatorem wywołania narzędzia. Po ponownym uruchomieniu Gateway interfejs sterowania może zweryfikować ten deskryptor względem transkrypcji uwierzytelnionej sesji i ponownie pobrać zasób `ui://`; odtworzone widoki są tylko do odczytu, dopóki nowy przebieg nie ustanowi aktualnych uprawnień do narzędzi.
- `openclaw security audit` ostrzega, gdy most jest włączony. Gdy nie jest potrzebny, wyłącz go za pomocą `openclaw config set mcp.apps.enabled false --strict-json`.

## Obecne ograniczenia

Ta strona dokumentuje most w postaci obecnie dostarczanej.

Obecne ograniczenia:

- wykrywanie konwersacji zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu wypychania poza adapterem przeznaczonym dla Claude
- narzędzia do edycji wiadomości i dodawania reakcji nie są jeszcze dostępne
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; multipleksowane połączenie nadrzędne nie jest jeszcze dostępne
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Pluginy](/pl/cli/plugins)
