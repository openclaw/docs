---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
    - Jak rejestrowane są polecenia Skills
sidebarTitle: Slash commands
summary: Wszystkie dostępne polecenia z ukośnikiem, dyrektywy i skróty wbudowane — konfiguracja, routing i zachowanie poszczególnych interfejsów.
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-07-12T15:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway obsługuje polecenia wysyłane jako samodzielne wiadomości rozpoczynające się od `/`.
Polecenia bash wykonywane wyłącznie na hoście używają składni `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja jest powiązana z sesją ACP, zwykły tekst jest kierowany do
mechanizmu ACP. Polecenia zarządzania Gateway pozostają lokalne: `/acp ...` zawsze trafia
do modułu obsługi poleceń OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne, gdy
obsługa poleceń jest włączona dla danego interfejsu.

## Trzy typy poleceń

<CardGroup cols={3}>
  <Card title="Polecenia" icon="terminal">
    Samodzielne wiadomości `/...` obsługiwane przez Gateway. Muszą stanowić
    jedyną treść wiadomości.
  </Card>
  <Card title="Dyrektywy" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — usuwane z wiadomości, zanim zobaczy ją model.
    Wysłane samodzielnie utrwalają ustawienia sesji; wysłane z innym tekstem
    działają jako wskazówki w treści.
  </Card>
  <Card title="Skróty w treści" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — są wykonywane natychmiast
    i usuwane, zanim model zobaczy pozostały tekst. Tylko dla upoważnionych nadawców.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Szczegóły działania dyrektyw">
    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W wiadomościach zawierających **wyłącznie dyrektywy** (wiadomość składa się tylko z dyrektyw)
      są one utrwalane w sesji, a w odpowiedzi wysyłane jest potwierdzenie.
    - W wiadomościach **zwykłego czatu** zawierających inny tekst działają jako wskazówki
      w treści i **nie** utrwalają ustawień sesji.
    - Dyrektywy mają zastosowanie wyłącznie do **upoważnionych nadawców**. Jeśli ustawiono
      `commands.allowFrom`, jest to jedyna używana lista dozwolonych nadawców; w przeciwnym razie
      autoryzacja wynika z list dozwolonych nadawców kanału/parowania oraz `commands.useAccessGroups`.
      Dyrektywy od nieupoważnionych nadawców są traktowane jako zwykły tekst.
  </Accordion>
</AccordionGroup>

## Konfiguracja

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Włącza analizowanie `/...` w wiadomościach czatu. W interfejsach bez poleceń natywnych
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) polecenia tekstowe
  działają nawet po ustawieniu wartości `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Tryb automatyczny: włączony dla Discord/Telegram; wyłączony dla Slack;
  ignorowany w przypadku dostawców bez obsługi natywnej. Ustawienie można nadpisać dla poszczególnych kanałów
  za pomocą `channels.<provider>.commands.native`. W Discord wartość `false` pomija rejestrację
  poleceń z ukośnikiem; wcześniej zarejestrowane polecenia mogą pozostać widoczne do czasu ich usunięcia.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia Skills, jeśli są obsługiwane. Tryb automatyczny: włączony dla
  Discord/Telegram; wyłączony dla Slack. Ustawienie można nadpisać za pomocą
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Włącza wykonywanie poleceń powłoki hosta za pomocą `! <cmd>` (alias `/bash <cmd>`). Wymaga
  list dozwolonych nadawców `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Określa, jak długo bash czeka przed przejściem do trybu działania w tle (`0` powoduje
  natychmiastowe przejście do działania w tle).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw w `mcp.servers`). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie i stan pluginów oraz instalowanie, włączanie i wyłączanie). Operacje zapisu są dostępne tylko dla właściciela.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisywanie konfiguracji tylko na czas działania). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi służące do ponownego uruchamiania Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Jawna lista dozwolonych właścicieli dla interfejsów poleceń dostępnych tylko dla właściciela. Niezależna od
  `commands.allowFrom` oraz dostępu przez parowanie wiadomości prywatnych.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Ustawienie dla poszczególnych kanałów: wymaga tożsamości właściciela w przypadku poleceń dostępnych tylko dla właściciela. Gdy ma wartość `true`,
  nadawca musi pasować do `commands.ownerAllowFrom` lub mieć wewnętrzny zakres `operator.admin`.
  Wpis wieloznaczny na liście `allowFrom` **nie** jest wystarczający.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Określa sposób wyświetlania identyfikatorów właścicieli w monicie systemowym.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Sekret HMAC używany, gdy ustawiono `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych nadawców dla poszczególnych dostawców, używana do autoryzacji poleceń. Po skonfigurowaniu jest
  **jedynym** źródłem autoryzacji poleceń i dyrektyw. Użyj `"*"` jako
  globalnej wartości domyślnej; klucze właściwe dla dostawców mają przed nią pierwszeństwo.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza stosowanie list dozwolonych nadawców i zasad dla poleceń, gdy nie ustawiono `commands.allowFrom`.
</ParamField>

## Lista poleceń

Polecenia pochodzą z trzech źródeł:

- **Wbudowane polecenia rdzenia:** `src/auto-reply/commands-registry.shared.ts`
- **Wygenerowane polecenia docka:** `src/auto-reply/commands-registry.data.ts`
- **Polecenia Pluginów:** wywołania `registerCommand()` w pluginach

Dostępność zależy od flag konfiguracji, interfejsu kanału oraz zainstalowanych i włączonych
pluginów.

### Polecenia rdzenia

  <AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    | Polecenie | Opis |
    | --- | --- |
    | `/new [model]` | Zarchiwizuj bieżącą sesję i rozpocznij nową |
    | `/reset [soft [message]]` | Zresetuj bieżącą sesję w miejscu. `soft` zachowuje transkrypcję, usuwa ponownie używane identyfikatory sesji zaplecza CLI i ponownie wykonuje procedurę uruchamiania |
    | `/name <title>` | Nadaj nazwę bieżącej sesji lub zmień jej nazwę. Pomiń tytuł, aby zobaczyć bieżącą nazwę i sugestię |
    | `/compact [instructions]` | Skompaktuj kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction) |
    | `/stop` | Przerwij bieżące uruchomienie |
    | `/session idle <duration\|off>` | Zarządzaj wygaśnięciem powiązania wątku z powodu bezczynności |
    | `/session max-age <duration\|off>` | Zarządzaj wygaśnięciem powiązania wątku po osiągnięciu maksymalnego wieku |
    | `/export-session [path]` | Wyeksportuj bieżącą sesję do formatu HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Wyeksportuj pakiet trajektorii JSONL dla bieżącej sesji. Alias: `/trajectory` |

    <Note>
      Control UI przechwytuje wpisane `/new`, aby utworzyć nową sesję
      panelu i przełączyć się na nią, chyba że skonfigurowano `session.dmScope: "main"`,
      a bieżącym elementem nadrzędnym jest główna sesja agenta — w takim przypadku `/new`
      resetuje główną sesję w miejscu. Wpisane `/reset` nadal wykonuje reset Gateway
      w miejscu. Użyj `/model default`, aby wyczyścić przypięty
      wybór modelu sesji.
    </Note>

  </Accordion>

  <Accordion title="Sterowanie modelem i uruchomieniem">
    | Polecenie | Opis |
    | --- | --- |
    | `/think <level\|default>` | Ustaw poziom rozumowania lub wyczyść nadpisanie sesji. Aliasy: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Przełącz szczegółowe dane wyjściowe. Alias: `/v` |
    | `/trace on\|off` | Przełącz dane śledzenia Pluginu dla bieżącej sesji |
    | `/fast [status\|auto\|on\|off\|default]` | Wyświetl, ustaw lub wyczyść tryb szybki |
    | `/reasoning [on\|off\|stream]` | Przełącz widoczność rozumowania. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Przełącz tryb podwyższonych uprawnień. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Wyświetl lub ustaw wartości domyślne wykonywania |
    | `/login [codex\|openai\|openai-codex]` | Sparuj logowanie Codex/OpenAI z prywatnego czatu lub sesji Web UI. Tylko właściciel/administrator |
    | `/model [name\|#\|status]` | Wyświetl lub ustaw model |
    | `/models [provider] [page] [limit=<n>\|all]` | Wyświetl skonfigurowanych lub dostępnych po uwierzytelnieniu dostawców albo modele |
    | `/queue <mode>` | Zarządzaj zachowaniem kolejki aktywnych uruchomień. Zobacz [Kolejka](/pl/concepts/queue) i [Sterowanie kolejką](/pl/concepts/queue-steering) |
    | `/steer <message>` | Wprowadź wskazówki do aktywnego uruchomienia. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer) |

    <AccordionGroup>
      <Accordion title="bezpieczeństwo verbose / trace / fast / reasoning">
        - `/verbose` służy do debugowania — podczas zwykłego użytkowania pozostaw tę opcję **wyłączoną**.
        - `/trace` ujawnia tylko wiersze śledzenia/debugowania należące do Pluginu; zwykłe szczegółowe komunikaty pozostają wyłączone.
        - `/fast auto|on|off` utrwala nadpisanie sesji; użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić.
        - `/fast` zależy od dostawcy: OpenAI/Codex odwzorowują go na `service_tier=priority`; bezpośrednie żądania Anthropic odwzorowują go na `service_tier=auto` lub `standard_only`.
        - `/reasoning`, `/verbose` i `/trace` są ryzykowne w grupach — mogą ujawnić wewnętrzne rozumowanie lub diagnostykę Pluginu. Pozostaw je wyłączone na czatach grupowych.

      </Accordion>
      <Accordion title="Szczegóły przełączania modelu">
        - `/model` natychmiast zapisuje nowy model w sesji.
        - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
        - Jeśli uruchomienie jest aktywne, przełączenie zostaje oznaczone jako oczekujące i zastosowane w następnym bezpiecznym punkcie ponowienia.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Wykrywanie i stan">
    | Polecenie | Opis |
    | --- | --- |
    | `/help` | Wyświetl krótkie podsumowanie pomocy |
    | `/commands` | Wyświetl wygenerowany katalog poleceń |
    | `/tools [compact\|verbose]` | Wyświetl, z czego bieżący agent może teraz korzystać |
    | `/status` | Wyświetl stan wykonywania/środowiska uruchomieniowego, czas działania Gateway i systemu, kondycję Pluginów oraz wykorzystanie/limity dostawców |
    | `/status plugins` | Wyświetl szczegółową kondycję Pluginów: błędy ładowania, kwarantanny, awarie Pluginów kanałów, problemy z zależnościami i powiadomienia o zgodności. Wymaga `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Zarządzaj trwałym [celem](/pl/tools/goal) bieżącej sesji |
    | `/diagnostics [note]` | Przepływ raportu pomocy technicznej dostępny tylko dla właściciela. Za każdym razem prosi o zatwierdzenie wykonania |
    | `/crestodian <request>` | Uruchom pomocnika konfiguracji i naprawy Crestodian z wiadomości prywatnej właściciela |
    | `/tasks` | Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji |
    | `/context [list\|detail\|map\|json]` | Wyjaśnij sposób tworzenia kontekstu |
    | `/whoami` | Wyświetl identyfikator nadawcy. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steruj stopką wykorzystania dla każdej odpowiedzi (`reset`/`inherit`/`clear`/`default` usuwa nadpisanie sesji, aby ponownie odziedziczyć skonfigurowaną wartość domyślną) lub wyświetl lokalne podsumowanie kosztów |
  </Accordion>

  <Accordion title="Skills, listy dozwolonych elementów i zatwierdzenia">
    | Polecenie | Opis |
    | --- | --- |
    | `/skill <name> [input]` | Uruchom umiejętność według nazwy |
    | `/learn [request]` | Utwórz wersję roboczą jednej umiejętności gotowej do przeglądu na podstawie bieżącej rozmowy lub wskazanych źródeł za pomocą [Warsztatu umiejętności](/pl/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Zarządzaj wpisami listy dozwolonych elementów. Tylko tekst |
    | `/approve <id> <decision>` | Rozstrzygnij monity o zatwierdzenie wykonania lub Pluginu |
    | `/btw <question>` | Zadaj pytanie poboczne bez zmieniania kontekstu sesji. Alias: `/side`. Zobacz [Pytanie poboczne](/pl/tools/btw) |
  </Accordion>

  <Accordion title="Subagenci i ACP">
    | Polecenie | Opis |
    | --- | --- |
    | `/subagents list\|log\|info` | Sprawdź uruchomienia subagentów dla bieżącej sesji |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Zarządzaj sesjami ACP i opcjami środowiska wykonawczego. Sterowanie środowiskiem wykonawczym wymaga tożsamości zewnętrznego właściciela lub wewnętrznego administratora Gateway |
    | `/focus <target>` | Powiąż bieżący wątek Discord lub temat Telegram z celem sesji |
    | `/unfocus` | Usuń powiązanie bieżącego wątku |
    | `/agents` | Wyświetl agentów powiązanych z wątkiem dla bieżącej sesji |
  </Accordion>

  <Accordion title="Zapisy i administracja tylko dla właściciela">
    | Polecenie | Wymaga | Opis |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Odczytaj lub zapisz `openclaw.json`. Tylko dla właściciela |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Odczytaj lub zapisz konfigurację serwera MCP zarządzanego przez OpenClaw. Tylko dla właściciela |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Sprawdź lub zmień stan pluginu. Operacje zapisu tylko dla właściciela. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Nadpisania konfiguracji wyłącznie w środowisku wykonawczym. Tylko dla właściciela |
    | `/restart` | `commands.restart: true` (domyślnie) | Uruchom ponownie OpenClaw |
    | `/send on\|off\|inherit` | właściciel | Ustaw zasady wysyłania |
  </Accordion>

  <Accordion title="Głos, TTS i sterowanie kanałem">
    | Polecenie | Opis |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Steruj TTS. Zobacz [TTS](/pl/tools/tts) |
    | `/activation mention\|always` | Ustaw tryb aktywacji grupowej |
    | `/bash <command>` | Uruchom polecenie powłoki hosta. Alias: `! <command>`. Wymaga `commands.bash: true` |
    | `!poll [sessionId]` | Sprawdź zadanie bash działające w tle |
    | `!stop [sessionId]` | Zatrzymaj zadanie bash działające w tle |
  </Accordion>
</AccordionGroup>

### Polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi aktywnej sesji na inny połączony kanał.
Informacje o konfiguracji i rozwiązywaniu problemów znajdziesz w sekcji [Dokowanie kanałów](/pl/concepts/channel-docking).

Generowane przez pluginy kanałów obsługujące polecenia natywne:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i docelowy uczestnik
muszą należeć do tej samej grupy tożsamości.

### Polecenia dołączonych pluginów

| Polecenie                                               | Opis                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Włącz lub wyłącz Dreaming pamięci (właściciel lub administrator Gateway). Zobacz [Dreaming](/pl/concepts/dreaming)                                                                                |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Zarządzaj parowaniem urządzeń. Zobacz [Parowanie](/pl/channels/pairing)                                                                                                                            |
| `/phone status\|arm ...\|disarm`                        | Tymczasowo uzbrój polecenia Node wysokiego ryzyka (kamera/ekran/komputer/zapis). Zobacz [Korzystanie z komputera](/pl/nodes/computer-use)                                                         |
| `/voice status\|list\|set <voiceId>`                    | Zarządzaj konfiguracją głosu Talk. Natywna nazwa w Discord: `/talkvoice`                                                                                                                       |
| `/card ...`                                             | Wysyłaj ustawienia wstępne rozbudowanych kart LINE. Zobacz [LINE](/pl/channels/line)                                                                                                              |
| `/codex <action> ...`                                   | Powiąż, steruj i sprawdzaj środowisko testowe serwera aplikacji Codex (stan, wątki, wznawianie, model, tryb szybki, uprawnienia, Compaction, przegląd, MCP, Skills i inne). Zobacz [Środowisko testowe Codex](/pl/plugins/codex-harness) |

Tylko QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Polecenia Skills

Skills dostępne dla użytkownika są udostępniane jako polecenia z ukośnikiem:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą rejestrować się jako polecenia bezpośrednie (np. `/prose` dla OpenProse).
- Natywna rejestracja poleceń Skills jest sterowana przez `commands.nativeSkills` i
  `channels.<provider>.commands.nativeSkills`.
- Nazwy są oczyszczane do formatu `a-z0-9_` (maks. 32 znaki); w przypadku kolizji otrzymują przyrostki liczbowe.

<AccordionGroup>
  <Accordion title="Przekazywanie poleceń Skills">
    Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądania.

    Skills mogą zadeklarować `command-dispatch: tool`, aby przekazywać je bezpośrednio do narzędzia
    (deterministycznie, bez udziału modelu). Przykład: `/prose` (plugin OpenProse)
    — zobacz [OpenProse](/pl/prose).

  </Accordion>
  <Accordion title="Argumenty poleceń natywnych">
    Discord używa autouzupełniania dla opcji dynamicznych oraz menu przycisków, gdy pominięto
    wymagane argumenty. Telegram i Slack wyświetlają menu przycisków dla poleceń
    z dostępnymi opcjami. Opcje dynamiczne są rozpoznawane względem modelu sesji docelowej, dlatego
    opcje specyficzne dla modelu, takie jak poziomy `/think`, uwzględniają nadpisanie `/model` danej sesji.
  </Accordion>
</AccordionGroup>

## `/tools`: z czego agent może teraz korzystać

`/tools` odpowiada na pytanie dotyczące środowiska wykonawczego: **z czego ten agent może korzystać teraz w tej
rozmowie** — nie jest to statyczny katalog konfiguracji.

```text
/tools         # widok skrócony
/tools verbose # z krótkimi opisami
```

Wyniki dotyczą konkretnej sesji. Zmiana agenta, kanału, wątku, autoryzacji
nadawcy lub modelu może zmienić wynik. Do edycji profilu i nadpisań
użyj panelu Tools w interfejsie Control UI lub powierzchni konfiguracji.

## `/model`: wybór modelu

```text
/model             # pokaż selektor modelu
/model list        # to samo
/model 3           # wybierz według numeru z selektora
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # wyczyść wybór modelu dla sesji
/model status      # widok szczegółowy z punktem końcowym i trybem API
```

W Discord polecenia `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi
dostawców i modeli. Selektor uwzględnia `agents.defaults.models`, w tym
wpisy `provider/*`.

## `/config`: zapisywanie konfiguracji na dysku

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącz za pomocą `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfiguracja jest weryfikowana przed zapisem. Nieprawidłowe zmiany są odrzucane. Aktualizacje wykonane przez `/config`
są zachowywane po ponownym uruchomieniu.

## `/mcp`: konfiguracja serwera MCP

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącz za pomocą `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu osadzonego agenta.
`/mcp show` maskuje pola zawierające dane uwierzytelniające, rozpoznane wartości flag
danych uwierzytelniających oraz argumenty o znanych formatach sekretów. Po uruchomieniu w grupie
konfiguracja jest wysyłana prywatnie do właściciela; jeśli prywatna trasa do właściciela
nie jest dostępna, polecenie bezpiecznie odmawia wykonania i prosi właściciela o ponowienie próby w bezpośrednim
czacie.

## `/debug`: nadpisania wyłącznie w środowisku wykonawczym

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącz za pomocą `commands.debug: true`.
  Nadpisania są natychmiast stosowane do nowych odczytów konfiguracji, ale **nie** są zapisywane na dysku.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: zarządzanie pluginami

<Note>
  Operacje zapisu tylko dla właściciela. Domyślnie wyłączone — włącz za pomocą `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aktualizuje konfigurację pluginu i przeładowuje na gorąco środowisko wykonawcze
pluginów Gateway dla nowych tur agenta. `/plugins install` automatycznie uruchamia ponownie zarządzane
instancje Gateway, ponieważ zmieniły się moduły źródłowe pluginu.

## `/trace`: dane wyjściowe śledzenia pluginu

```text
/trace          # pokaż bieżący stan śledzenia
/trace on
/trace off
```

`/trace` ujawnia wiersze śledzenia i debugowania pluginów dotyczące sesji bez włączania pełnego trybu szczegółowego.
Nie zastępuje `/debug` (nadpisania środowiska wykonawczego) ani `/verbose` (zwykłe
dane wyjściowe narzędzi).

## `/btw`: pytania poboczne

`/btw` służy do szybkiego zadawania pytań pobocznych dotyczących kontekstu bieżącej sesji. Alias: `/side`.

```text
/btw co teraz robimy?
/side co się zmieniło, gdy główne uruchomienie było kontynuowane?
```

W przeciwieństwie do zwykłej wiadomości:

- Używa bieżącej sesji jako kontekstu pomocniczego.
- W sesjach środowiska testowego Codex działa jako efemeryczny wątek poboczny Codex.
- **Nie** zmienia przyszłego kontekstu sesji.
- Nie jest zapisywane w historii transkrypcji.

Pełny opis działania znajdziesz w sekcji [Pytania poboczne BTW](/pl/tools/btw).

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Zakres sesji dla poszczególnych powierzchni">
    - **Polecenia tekstowe:** działają w zwykłej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własne sesje).
    - **Natywne polecenia Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Natywne polecenia Slack:** `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowany przez `channels.slack.slashCommand.sessionPrefix`)
    - **Natywne polecenia Telegram:** `telegram:slash:<userId>` (wskazują sesję czatu przez `CommandTargetSessionKey`)
    - **`/login codex`** wysyła kody parowania urządzenia wyłącznie przez prywatny czat lub ścieżki odpowiedzi interfejsu Web UI. Wywołania w grupach lub tematach Telegram proszą właściciela o wysłanie prywatnej wiadomości do bota.
    - **`/stop`** wskazuje aktywną sesję czatu, aby przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` obsługuje pojedyncze polecenie w stylu `/openclaw`.
    Gdy `commands.native: true`, utwórz po jednym poleceniu Slack z ukośnikiem dla każdego wbudowanego
    polecenia. Zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje
    `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.
  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w tekście">
    - Wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - Skróty w tekście (`/help`, `/commands`, `/status`, `/whoami`) działają również osadzone w zwykłych wiadomościach i są usuwane, zanim model zobaczy pozostały tekst.
    - Nieautoryzowane wiadomości zawierające wyłącznie polecenie są po cichu ignorowane; tokeny `/...` w tekście są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Uwagi dotyczące argumentów">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (`/think: high`, `/send: on`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie przybliżone); jeśli nie znajdzie dopasowania, tekst jest traktowany jako treść wiadomości.
    - `/allowlist add|remove` wymaga `commands.config: true` i uwzględnia ustawienie kanału `configWrites`.

  </Accordion>
</AccordionGroup>

## Użycie i stan dostawcy

- **Wykorzystanie/limit dostawcy** (np. „Claude — pozostało 80%”) jest wyświetlane w `/status` dla dostawcy bieżącego modelu, gdy śledzenie wykorzystania jest włączone.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą korzystać z najnowszego wpisu wykorzystania w transkrypcji, gdy bieżąca migawka sesji zawiera niewiele danych.
- **Wykonanie a środowisko uruchomieniowe:** `/status` podaje `Execution` dla faktycznie używanej ścieżki piaskownicy oraz `Runtime` dla mechanizmu uruchamiającego sesję: `OpenClaw Default`, `OpenAI Codex`, backend CLI lub backend ACP.
- **Tokeny/koszt na odpowiedź:** sterowane za pomocą `/usage off|tokens|full`.
- `/model status` dotyczy modeli/uwierzytelniania/punktów końcowych, a nie wykorzystania.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Sposób rejestrowania i ograniczania dostępu do poleceń Skills z ukośnikiem.
  </Card>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Utwórz Skills, który rejestruje własne polecenie z ukośnikiem.
  </Card>
  <Card title="BTW" href="/pl/tools/btw" icon="comments">
    Pytania poboczne bez zmieniania kontekstu sesji.
  </Card>
  <Card title="Sterowanie" href="/pl/tools/steer" icon="compass">
    Kieruj agentem w trakcie działania za pomocą `/steer`.
  </Card>
</CardGroup>
