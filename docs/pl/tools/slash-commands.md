---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
    - Jak rejestrowane są polecenia Skills
sidebarTitle: Slash commands
summary: Wszystkie dostępne polecenia z ukośnikiem, dyrektywy i skróty w tekście — konfiguracja, routing i zachowanie w poszczególnych interfejsach.
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-07-16T19:14:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway obsługuje polecenia wysyłane jako samodzielne wiadomości rozpoczynające się od `/`.
Polecenia bash wykonywane wyłącznie na hoście używają `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja jest powiązana z sesją ACP, zwykły tekst jest kierowany do
środowiska ACP. Polecenia zarządzania Gateway pozostają lokalne: `/acp ...` zawsze trafia
do procedury obsługi poleceń OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne, gdy
obsługa poleceń jest włączona dla danego interfejsu.

## Trzy typy poleceń

<CardGroup cols={3}>
  <Card title="Polecenia" icon="terminal">
    Samodzielne wiadomości `/...` obsługiwane przez Gateway. Muszą stanowić
    jedyną treść wiadomości.
  </Card>
  <Card title="Dyrektywy" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — usuwane z wiadomości, zanim zobaczy ją
    model. Utrwalają ustawienia sesji, gdy są wysyłane samodzielnie; działają jako wskazówki w treści,
    gdy są wysyłane z innym tekstem.
  </Card>
  <Card title="Skróty w treści" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — są wykonywane natychmiast i
    usuwane, zanim model zobaczy pozostały tekst. Tylko dla autoryzowanych nadawców.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Szczegóły działania dyrektyw">
    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W wiadomościach zawierających **wyłącznie dyrektywy** (wiadomość składa się tylko z dyrektyw)
      są one utrwalane w sesji, a odpowiedź zawiera potwierdzenie.
    - W wiadomościach **zwykłego czatu** zawierających inny tekst działają jako wskazówki w treści i
      **nie** utrwalają ustawień sesji.
    - Dyrektywy mają zastosowanie tylko do **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`,
      jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja wynika z
      list dozwolonych/parowania kanałów oraz `commands.useAccessGroups`. W przypadku nieautoryzowanych
      nadawców dyrektywy są traktowane jak zwykły tekst.
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
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) polecenia
  tekstowe działają nawet po ustawieniu na `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Tryb automatyczny: włączony dla Discord/Telegram; wyłączony dla Slack;
  ignorowany przez dostawców bez obsługi natywnej. Można go nadpisać dla poszczególnych kanałów za pomocą
  `channels.<provider>.commands.native`. W Discord `false` pomija rejestrację poleceń
  z ukośnikiem; wcześniej zarejestrowane polecenia mogą pozostać widoczne do czasu ich usunięcia.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia umiejętności, jeśli jest to obsługiwane. Tryb automatyczny: włączony dla
  Discord/Telegram; wyłączony dla Slack. Można go nadpisać za pomocą
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do wykonywania poleceń powłoki hosta (alias `/bash <cmd>`). Wymaga
  list dozwolonych `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Czas oczekiwania bash przed przejściem w tryb działania w tle (`0` natychmiast
  przełącza działanie w tło).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw w `mcp.servers`). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz instalowanie i włączanie/wyłączanie). Operacje zapisu tylko dla właściciela.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania konfiguracji tylko na czas działania). Tylko dla właściciela.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz zewnętrzne żądania ponownego uruchomienia `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Jawna lista właścicieli dozwolonych dla interfejsów poleceń dostępnych tylko właścicielowi. Niezależna od
  `commands.allowFrom` i dostępu przez parowanie wiadomości prywatnych.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Ustawienie dla kanału: wymaga tożsamości właściciela dla poleceń dostępnych tylko właścicielowi. Gdy `true`,
  nadawca musi odpowiadać `commands.ownerAllowFrom` lub mieć wewnętrzny zakres `operator.admin`.
  Wpis wieloznaczny `allowFrom` **nie** jest wystarczający.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Określa sposób wyświetlania identyfikatorów właścicieli w monicie systemowym.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Sekret HMAC używany, gdy `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla poszczególnych dostawców używana do autoryzacji poleceń. Po jej skonfigurowaniu jest
  **jedynym** źródłem autoryzacji poleceń i dyrektyw. `"*"` służy jako
  globalna wartość domyślna; klucze specyficzne dla dostawców ją nadpisują.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/zasady dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Polecenia pochodzą z trzech źródeł:

- **Wbudowane polecenia podstawowe:** `src/auto-reply/commands-registry.shared.ts`
- **Generowane polecenia dock:** `src/auto-reply/commands-registry.data.ts`
- **Polecenia pluginów:** wywołania `registerCommand()` pluginu

Dostępność zależy od flag konfiguracji, interfejsu kanału oraz zainstalowanych/włączonych
pluginów.

### Polecenia podstawowe

<AccordionGroup>
  <Accordion title="Sesje i przebiegi">
    | Polecenie | Opis |
    | --- | --- |
    | `/new [model]` | Archiwizuje bieżącą sesję i rozpoczyna nową |
    | `/reset [soft [message]]` | Resetuje bieżącą sesję w miejscu. `soft` zachowuje transkrypcję, usuwa ponownie używane identyfikatory sesji zaplecza CLI i ponownie wykonuje uruchamianie początkowe |
    | `/name <title>` | Nadaje lub zmienia nazwę bieżącej sesji. Pominięcie tytułu wyświetla bieżącą nazwę i sugestię |
    | `/compact [instructions]` | Kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction) |
    | `/stop` | Przerywa bieżący przebieg |
    | `/session idle <duration\|off>` | Zarządza wygaśnięciem powiązania wątku z powodu bezczynności |
    | `/session max-age <duration\|off>` | Zarządza wygaśnięciem powiązania wątku po osiągnięciu maksymalnego wieku |
    | `/export-session [path]` | Tylko dla właściciela. Eksportuje bieżącą sesję do formatu HTML w obszarze roboczym. Alias: `/export` |
    | `/export-trajectory [path]` | Eksportuje pakiet trajektorii JSONL dla bieżącej sesji. Alias: `/trajectory` |

    Jawne ścieżki `/export-session` zastępują istniejące pliki w
    obszarze roboczym. Pominięcie ścieżki powoduje wygenerowanie nazwy pliku odpornej na kolizje.

    <Note>
      Control UI przechwytuje wpisane `/new`, aby utworzyć nową
      sesję panelu i przełączyć się na nią, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"`,
      a bieżącym elementem nadrzędnym jest główna sesja agenta — w takim przypadku `/new`
      resetuje główną sesję w miejscu. Wpisane `/reset` nadal wykonuje reset w miejscu
      przez Gateway. Użyj `/model default`, aby wyczyścić przypisany do sesji
      wybór modelu.
    </Note>

  </Accordion>

  <Accordion title="Sterowanie modelem i przebiegiem">
    | Polecenie | Opis |
    | --- | --- |
    | `/think <level\|default>` | Ustawia poziom myślenia lub usuwa nadpisanie sesji. Aliasy: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Przełącza szczegółowe dane wyjściowe. Alias: `/v` |
    | `/trace on\|off` | Przełącza dane wyjściowe śledzenia pluginu dla bieżącej sesji |
    | `/fast [status\|auto\|on\|off\|default]` | Wyświetla, ustawia lub wyłącza tryb szybki |
    | `/reasoning [on\|off\|stream]` | Przełącza widoczność rozumowania. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Przełącza tryb podwyższonych uprawnień. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Wyświetla lub ustawia domyślne wartości wykonywania |
    | `/login [codex\|openai\|openai-codex]` | Paruje logowanie Codex/OpenAI z czatu prywatnego lub sesji Web UI. Tylko dla właściciela/administratora |
    | `/model [name\|#\|status]` | Wyświetla lub ustawia model |
    | `/models [provider] [page] [limit=<n>\|all]` | Wyświetla listę skonfigurowanych/dostępnych po uwierzytelnieniu dostawców lub modeli |
    | `/queue <mode>` | Zarządza zachowaniem kolejki aktywnych przebiegów. Zobacz [Kolejka](/pl/concepts/queue) oraz [Sterowanie kolejką](/pl/concepts/queue-steering) |
    | `/steer <message>` | Wprowadza wskazówki do aktywnego przebiegu. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer) |

    <AccordionGroup>
      <Accordion title="Bezpieczeństwo trybów szczegółowego, śledzenia, szybkiego i rozumowania">
        - `/verbose` służy do debugowania — podczas zwykłego użycia należy pozostawić je **wyłączone**.
        - `/trace` ujawnia tylko wiersze śledzenia/debugowania należące do pluginu; zwykłe szczegółowe komunikaty pozostają wyłączone.
        - `/fast auto|on|off` utrwala nadpisanie sesji; aby je wyczyścić, użyj opcji `inherit` w interfejsie Sessions.
        - `/fast` zależy od dostawcy: OpenAI/Codex mapują je na `service_tier=priority`; bezpośrednie żądania Anthropic mapują je na `service_tier=auto` lub `standard_only`.
        - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych — mogą ujawnić wewnętrzne rozumowanie lub diagnostykę pluginu. W czatach grupowych należy pozostawić je wyłączone.

      </Accordion>
      <Accordion title="Szczegóły przełączania modelu">
        - `/model` natychmiast utrwala nowy model w sesji.
        - Jeśli agent jest bezczynny, następny przebieg od razu go użyje.
        - Jeśli przebieg jest aktywny, przełączenie zostaje oznaczone jako oczekujące i zastosowane przy następnym bezpiecznym punkcie ponowienia.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Wykrywanie i status">
    | Polecenie | Opis |
    | --- | --- |
    | `/help` | Wyświetla krótkie podsumowanie pomocy |
    | `/commands` | Wyświetla wygenerowany katalog poleceń |
    | `/tools [compact\|verbose]` | Wyświetla, z czego bieżący agent może w danej chwili korzystać |
    | `/status` | Wyświetla status wykonywania/środowiska uruchomieniowego, czas działania Gateway i systemu, stan pluginów oraz wykorzystanie/limit dostawcy |
    | `/status plugins` | Wyświetla szczegółowy stan pluginów: błędy ładowania, kwarantanny, awarie pluginów kanałów, problemy z zależnościami i powiadomienia o zgodności. Wymaga `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Zarządza trwałym [celem](/pl/tools/goal) bieżącej sesji |
    | `/diagnostics [note]` | Przepływ raportu pomocy technicznej tylko dla właściciela. Za każdym razem prosi o zatwierdzenie wykonania |
    | `/openclaw <request>` | Uruchamia narzędzie konfiguracji i naprawy OpenClaw z wiadomości prywatnej właściciela |
    | `/tasks` | Wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji |
    | `/context [list\|detail\|map\|json]` | Wyjaśnia sposób składania kontekstu |
    | `/whoami` | Wyświetla identyfikator nadawcy. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steruje stopką użycia dla poszczególnych odpowiedzi (`reset`/`inherit`/`clear`/`default` usuwa nadpisanie sesji, aby ponownie odziedziczyć skonfigurowaną wartość domyślną) lub wyświetla lokalne podsumowanie kosztów |
  </Accordion>

  <Accordion title="Skills, listy dozwolonych elementów, zatwierdzenia">
    | Polecenie | Opis |
    | --- | --- |
    | `/skill <name> [input]` | Uruchamia skill według nazwy |
    | `/learn [request]` | Tworzy wersję roboczą jednego skillu gotowego do przeglądu na podstawie bieżącej rozmowy lub wskazanych źródeł za pomocą [warsztatu skilli](/pl/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Zarządza wpisami listy dozwolonych elementów. Tylko tekst |
    | `/approve <id> <decision>` | Rozstrzyga monity o zatwierdzenie wykonania lub pluginu |
    | `/btw <question>` | Zadaje pytanie poboczne bez zmiany kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw) |
  </Accordion>

  <Accordion title="Subagenci i ACP">
    | Polecenie | Opis |
    | --- | --- |
    | `/subagents list\|log\|info` | Sprawdza uruchomienia subagentów w bieżącej sesji |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Zarządza sesjami ACP i opcjami środowiska uruchomieniowego. Sterowanie środowiskiem uruchomieniowym wymaga tożsamości zewnętrznego właściciela lub wewnętrznego administratora Gateway |
    | `/focus <target>` | Wiąże bieżący wątek Discord lub temat Telegram z celem sesji |
    | `/unfocus` | Usuwa powiązanie bieżącego wątku |
    | `/agents` | Wyświetla agentów powiązanych z wątkiem w bieżącej sesji |
  </Accordion>

  <Accordion title="Zapisy i administracja tylko dla właściciela">
    | Polecenie | Wymaga | Opis |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw. Tylko dla właściciela |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Sprawdza lub modyfikuje stan pluginu. Zapisy tylko dla właściciela. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Nadpisania konfiguracji tylko w środowisku uruchomieniowym. Tylko dla właściciela |
    | `/restart` | `commands.restart: true` (domyślnie) | Ponownie uruchamia OpenClaw |
    | `/send on\|off\|inherit` | właściciel | Ustawia zasady wysyłania |
  </Accordion>

  <Accordion title="Głos, TTS i sterowanie kanałem">
    | Polecenie | Opis |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Steruje TTS. Zobacz [TTS](/pl/tools/tts) |
    | `/activation mention\|always` | Ustawia tryb aktywacji grupowej |
    | `/bash <command>` | Uruchamia polecenie powłoki hosta. Alias: `! <command>`. Wymaga `commands.bash: true` |
    | `!poll [sessionId]` | Sprawdza zadanie bash działające w tle |
    | `!stop [sessionId]` | Zatrzymuje zadanie bash działające w tle |
  </Accordion>
</AccordionGroup>

### Polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi aktywnej sesji na inny połączony kanał.
Informacje o konfiguracji i rozwiązywaniu problemów zawiera [Dokowanie kanałów](/pl/concepts/channel-docking).

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
| `/dreaming [on\|off\|status\|help]`                     | Przełącza dreaming pamięci (właściciel lub administrator Gateway). Zobacz [Dreaming](/pl/concepts/dreaming)                                                                                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Zarządza parowaniem urządzeń. Zobacz [Parowanie](/pl/channels/pairing)                                                                                                                             |
| `/phone status\|arm ...\|disarm`                        | Tymczasowo uzbraja polecenia node'a wysokiego ryzyka (kamera/ekran/komputer/zapisy). Zobacz [Korzystanie z komputera](/pl/nodes/computer-use)                                                      |
| `/voice status\|list\|set <voiceId>`                    | Zarządza konfiguracją głosu Talk. Natywna nazwa w Discord: `/talkvoice`                                                                                                                       |
| `/card ...`                                             | Wysyła predefiniowane bogate karty LINE. Zobacz [LINE](/pl/channels/line)                                                                                                                         |
| `/codex <action> ...`                                   | Wiąże, steruje i sprawdza platformę testową serwera aplikacji Codex (stan, wątki, wznawianie, model, tryb szybki, uprawnienia, compact, przegląd, mcp, skills i inne). Zobacz [Platforma testowa Codex](/pl/plugins/codex-harness) |

Tylko QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Polecenia skilli

Skille dostępne dla użytkowników są udostępniane jako polecenia z ukośnikiem:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skille mogą być rejestrowane jako polecenia bezpośrednie (np. `/prose` dla OpenProse).
- Rejestrowaniem natywnych poleceń skilli sterują `commands.nativeSkills` oraz
  `channels.<provider>.commands.nativeSkills`.
- Nazwy są oczyszczane do postaci `a-z0-9_` (maks. 32 znaki); w przypadku kolizji dodawane są sufiksy numeryczne.

<AccordionGroup>
  <Accordion title="Przekazywanie poleceń skilli">
    Domyślnie polecenia skilli są przekazywane do modelu jako zwykłe żądania.

    Skille mogą zadeklarować `command-dispatch: tool`, aby kierować żądania bezpośrednio do narzędzia
    (deterministycznie, bez udziału modelu). Przykład: `/prose` (plugin OpenProse)
    — zobacz [OpenProse](/pl/prose).

  </Accordion>
  <Accordion title="Argumenty poleceń natywnych">
    Discord używa autouzupełniania dla opcji dynamicznych oraz menu przycisków, gdy pominięto
    wymagane argumenty. Telegram i Slack wyświetlają menu przycisków dla poleceń z
    dostępnymi opcjami. Opcje dynamiczne są rozstrzygane na podstawie docelowego modelu sesji, dlatego opcje
    specyficzne dla modelu, takie jak poziomy `/think`, uwzględniają nadpisanie `/model` sesji.
  </Accordion>
</AccordionGroup>

## `/tools`: czego agent może teraz używać

`/tools` odpowiada na pytanie dotyczące środowiska uruchomieniowego: **z czego ten agent może korzystać teraz w tej
rozmowie** — nie jest to statyczny katalog konfiguracji.

```text
/tools         # widok kompaktowy
/tools verbose # z krótkimi opisami
```

Wyniki są ograniczone do sesji. Zmiana agenta, kanału, wątku, autoryzacji
nadawcy lub modelu może zmienić dane wyjściowe. Do edycji profilu i nadpisań
należy użyć panelu Tools w interfejsie Control UI lub powierzchni konfiguracji.

## `/model`: wybór modelu

```text
/model             # pokaż selektor modelu
/model list        # to samo
/model 3           # wybierz według numeru z selektora
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # wyczyść wybór modelu sesji
/model status      # widok szczegółowy z punktem końcowym i trybem API
```

W Discord polecenia `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi
dostawcy i modelu. Selektor uwzględnia `agents.defaults.models`, w tym
wpisy `provider/*`.

## `/config`: zapis konfiguracji na dysku

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącza się za pomocą `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfiguracja jest sprawdzana przed zapisem. Nieprawidłowe zmiany są odrzucane. Aktualizacje `/config`
są zachowywane po ponownym uruchomieniu.

## `/mcp`: konfiguracja serwera MCP

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącza się za pomocą `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu osadzonego agenta.
`/mcp show` maskuje pola zawierające dane uwierzytelniające, wartości rozpoznanych flag danych uwierzytelniających
oraz argumenty o znanych wzorcach sekretów. Po uruchomieniu z grupy
konfiguracja jest wysyłana prywatnie do właściciela; jeśli prywatna trasa do właściciela
nie jest dostępna, polecenie bezpiecznie kończy się niepowodzeniem i prosi właściciela o ponowienie próby na
czacie bezpośrednim.

## `/debug`: nadpisania tylko w środowisku uruchomieniowym

<Note>
  Tylko dla właściciela. Domyślnie wyłączone — włącza się za pomocą `commands.debug: true`.
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
  Zapisy tylko dla właściciela. Domyślnie wyłączone — włącza się za pomocą `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` aktualizuje konfigurację pluginu i przeładowuje na gorąco środowisko uruchomieniowe
pluginów Gateway na potrzeby nowych tur agenta. `/plugins install` automatycznie ponownie uruchamia zarządzane
Gatewaye, ponieważ zmieniły się moduły źródłowe pluginu. Instalacje z zaufanego ClawHub
i oficjalnego katalogu nie wymagają dodatkowego potwierdzenia. Dowolne źródła npm,
git, archiwa, `npm-pack:` oraz ścieżki lokalne wyświetlają ostrzeżenie o pochodzeniu i
wymagają końcowego `--force` po przejrzeniu źródła. Ta flaga potwierdza
źródło i zezwala na zastąpienie istniejącej instalacji; nie pomija
`security.installPolicy` ani kontroli bezpieczeństwa instalatora. Wydania ClawHub z
ostrzeżeniami o ryzyku nadal wymagają oddzielnej flagi dostępnej tylko w powłoce:
`--acknowledge-clawhub-risk`. Instalacje z marketplace'u, połączone i przypięte również
pozostają dostępne tylko w powłoce.

## `/trace`: dane wyjściowe śledzenia pluginu

```text
/trace          # pokaż bieżący stan śledzenia
/trace on
/trace off
```

`/trace` ujawnia ograniczone do sesji wiersze śledzenia/debugowania pluginu bez pełnego trybu
szczegółowego. Nie zastępuje `/debug` (nadpisań środowiska uruchomieniowego) ani `/verbose` (zwykłych
danych wyjściowych narzędzia).

## `/btw`: pytania poboczne

`/btw` to szybkie pytanie poboczne dotyczące kontekstu bieżącej sesji. Alias: `/side`.

```text
/btw co teraz robimy?
/side co zmieniło się podczas dalszego działania głównego uruchomienia?
```

W odróżnieniu od zwykłej wiadomości:

- Używa bieżącej sesji jako kontekstu pomocniczego.
- W sesjach platformy testowej Codex działa jako efemeryczny wątek poboczny Codex.
- **Nie** zmienia przyszłego kontekstu sesji.
- Nie jest zapisywane w historii transkrypcji.

Pełny opis działania zawiera strona [Pytania poboczne BTW](/pl/tools/btw).

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Zakres sesji według powierzchni">
    - **Polecenia tekstowe:** działają w zwykłej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własne sesje).
    - **Natywne polecenia Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Natywne polecenia Slack:** `agent:<agentId>:slack:slash:<userId>` (prefiks można skonfigurować za pomocą `channels.slack.slashCommand.sessionPrefix`)
    - **Natywne polecenia Telegram:** `telegram:slash:<userId>` (kierowane do sesji czatu za pomocą `CommandTargetSessionKey`)
    - **`/login codex`** wysyła kody parowania urządzenia wyłącznie przez czat prywatny lub ścieżki odpowiedzi interfejsu Web UI. Wywołania w grupach lub tematach Telegram proszą właściciela o wysłanie prywatnej wiadomości do bota.
    - **`/stop`** jest kierowane do aktywnej sesji czatu, aby przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` obsługuje jedno polecenie w stylu `/openclaw`.
    W przypadku `commands.native: true` utwórz po jednym poleceniu ukośnikowym Slack dla każdego wbudowanego
    polecenia. Zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje
    `/status`. Tekst `/status` nadal działa w wiadomościach Slack.
  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w tekście">
    - Wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - Skróty w tekście (`/help`, `/commands`, `/status`, `/whoami`) działają również osadzone w zwykłych wiadomościach i są usuwane, zanim model zobaczy pozostały tekst.
    - Nieautoryzowane wiadomości zawierające wyłącznie polecenie są po cichu ignorowane; tokeny `/...` w tekście są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Uwagi dotyczące argumentów">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (`/think: high`, `/send: on`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie przybliżone); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - `/allowlist add|remove` wymaga `commands.config: true` i respektuje ustawienie kanału `configWrites`.

  </Accordion>
</AccordionGroup>

## Użycie i stan dostawcy

- **Użycie/limit dostawcy** (np. „Claude — pozostało 80%”) jest wyświetlane w `/status` dla dostawcy bieżącego modelu, gdy włączone jest śledzenie użycia.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą korzystać z najnowszego wpisu użycia w transkrypcji, gdy bieżąca migawka sesji zawiera niewiele danych.
- **Środowisko wykonania a środowisko uruchomieniowe:** `/status` zgłasza `Execution` dla faktycznie używanej ścieżki piaskownicy oraz `Runtime` dla podmiotu uruchamiającego sesję: `OpenClaw Default`, `OpenAI Codex`, backend CLI lub backend ACP.
- **Tokeny/koszt na odpowiedź:** kontrolowane przez `/usage off|tokens|full`.
- `/model status` dotyczy modeli/uwierzytelniania/punktów końcowych, a nie użycia.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Sposób rejestrowania i ograniczania dostępu do poleceń ukośnikowych Skills.
  </Card>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Utwórz Skills, który rejestruje własne polecenie ukośnikowe.
  </Card>
  <Card title="BTW" href="/pl/tools/btw" icon="comments">
    Pytania poboczne bez zmiany kontekstu sesji.
  </Card>
  <Card title="Sterowanie" href="/pl/tools/steer" icon="compass">
    Kieruj agentem w trakcie działania za pomocą `/steer`.
  </Card>
</CardGroup>
