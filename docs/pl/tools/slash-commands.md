---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe i natywne, konfiguracja oraz obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-11T20:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji jest kierowany do tego harnessu ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do procedury obsługi poleceń ACP w OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających tylko dyrektywy (wiadomość zawiera wyłącznie dyrektywy) utrwalają się w sesji i odpowiadają potwierdzeniem.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych kanału/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skróty inline">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi przez normalny przepływ.

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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez poleceń natywnych (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać dla danego dostawcy (bool lub `"auto"`). W Discord `false` pomija rejestrację poleceń ukośnikowych i czyszczenie podczas uruchamiania; wcześniej zarejestrowane polecenia mogą pozostać widoczne, dopóki nie usuniesz ich z aplikacji Discord. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord specyfikacje poleceń natywnych mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako Discord `description_localizations` i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia **skill**, gdy są obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdego skill). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać dla danego dostawcy (bool lub `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kontroluje, jak długo bash czeka przed przełączeniem w tryb tła (`0` przenosi do tła natychmiast).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw pod `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz kontrolki instalowania i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartu Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora-człowieka, które może zatwierdzać niebezpieczne działania i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` oraz `/config`. Jest oddzielne od `commands.allowFrom` i od dostępu przez parowanie DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby działać na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozpoznanego kandydata na właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnych metadanych właściciela dostawcy), albo posiadać wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanale `allowFrom` lub pusta/nierozwiązana lista kandydatów na właściciela **nie** wystarcza — polecenia tylko dla właściciela kończą się odmową na tym kanale. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla każdego dostawcy do autoryzacji poleceń. Gdy jest skonfigurowana, jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanału/parowanie oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Egzekwuje listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane elementy core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań pluginów `registerCommand()`
- faktyczna dostępność w Twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia core

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetowania.
    - Interfejs sterowania przechwytuje wpisane `/new`, aby utworzyć i przełączyć się na świeżą sesję dashboardu, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; w takim przypadku `/new` resetuje główną sesję w miejscu. Wpisane `/reset` nadal uruchamia reset w miejscu w Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, odrzuca ponownie użyte identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie exec, a następnie eksportuje JSONL [pakiet trajektorii](/pl/tools/trajectory) dla bieżącej sesji. Użyj go, gdy potrzebujesz osi czasu promptu, narzędzia i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzania i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchomienia">
    - `/think <level|default>` ustawia poziom myślenia albo czyści nadpisanie sesji. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a poziomy niestandardowe, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia pluginów dla bieżącej sesji.
    - `/fast [status|on|off|default]` pokazuje, ustawia lub czyści tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych po uwierzytelnieniu dostawców lub modele danego dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy. Wpisy `provider/*` w `agents.defaults.models` sprawiają, że `/model` i `/models` pokazują wykryte modele tylko dla tych dostawców.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` lub `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).
    - `/steer <message>` wstrzykuje wskazówki do aktywnego uruchomienia dla bieżącej sesji, niezależnie od trybu `/queue`. Nie rozpoczyna nowego uruchomienia, gdy sesja jest bezczynna. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może używać w tej chwili.
    - `/status` pokazuje status wykonania/czasu działania, czas działania Gateway i systemu oraz użycie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to przepływ raportu wsparcia tylko dla właściciela dla błędów Gateway i uruchomień harnessu Codex. Za każdym razem prosi o jawne zatwierdzenie exec przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami o prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzania i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa harnessu OpenAI Codex, to samo zatwierdzenie wysyła też odpowiednie opinie Codex na serwery OpenAI, a ukończona odpowiedź wymienia identyfikatory sesji OpenClaw, identyfikatory wątków Codex i polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
    - `/context [list|detail|map|json]` wyjaśnia, jak składany jest kontekst. `map` wysyła obraz mapy drzewa kontekstu bieżącej sesji.
    - `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla każdej odpowiedzi albo drukuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia umiejętność według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozwiązuje monity o zatwierdzenie wykonania.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
    - `/subagents steer <id|#> <message>` wysyła wskazówki do działającego subagenta. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje zarządzaną przez OpenClaw konfigurację serwera MCP w `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub zmienia stan Plugin. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko dla środowiska uruchomieniowego. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/send on|off|inherit` ustawia zasady wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Głos, TTS, sterowanie kanałem">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupowej.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony
kanał. Zobacz [Dokowanie kanałów](/pl/concepts/channel-docking), aby poznać konfigurację,
przykłady i rozwiązywanie problemów.

Polecenia dokowania są generowane z kanałowych Plugin z obsługą poleceń natywnych. Bieżący zestaw w pakiecie:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Użyj poleceń dokowania w czacie bezpośrednim, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego partnera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i partner docelowy muszą być w tej samej grupie tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisuje `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest połączony z partnerem Discord, polecenie odpowiada wskazówką konfiguracyjną zamiast przechodzić do zwykłego czatu.

Dokowanie zmienia tylko aktywną trasę sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanału ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` lub innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia Plugin w pakiecie

Plugin w pakiecie mogą dodawać więcej poleceń ukośnikiem. Bieżące polecenia w pakiecie w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła gotowe ustawienia bogatej karty LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje dołączony harness serwera aplikacji Codex. Zobacz [Harness Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia umiejętności

Umiejętności wywoływane przez użytkownika są również udostępniane jako polecenia ukośnikiem:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- umiejętności mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy umiejętność/Plugin je rejestruje.
- natywna rejestracja poleceń umiejętności jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą podawać `descriptionLocalizations` dla natywnych powierzchni, które obsługują zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Uwagi o argumentach i parserze">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem i argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby uzyskać pełny podział użycia dostawcy, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach wielokontowych ukierunkowane na konfigurację `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
    - `/usage` kontroluje stopkę użycia dla odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje Plugin co `openclaw plugins install`: ścieżka lokalna/archiwum, pakiet npm, `git:<repo>` lub `clawhub:<pkg>`, a następnie żąda restartu Gateway, ponieważ moduły źródłowe Plugin uległy zmianie.
    - `/plugins enable|disable` aktualizuje konfigurację Plugin i wyzwala ponowne ładowanie Plugin w Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga serwera i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia wiązania wątku Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo verbose / trace / fast / reasoning">
    - `/verbose` służy do debugowania i dodatkowej widoczności; trzymaj je **wyłączone** podczas normalnego użycia.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Plugin linie trace/debug i wyłącza zwykły szczegółowy szum narzędzi.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych punktach końcowych Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi są nadal pokazywane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wyjście narzędzi lub diagnostykę Plugin, których nie zamierzałeś ujawniać. Lepiej pozostawić je wyłączone, szczególnie w czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modelu">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca ze zwykłego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień konfiguracyjnych.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmianki w grupie:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych pomijają wymagania wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają też po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź statusu, a pozostały tekst przechodzi dalej przez zwykły przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny `/...` w treści są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia umiejętności i argumenty natywne">
    - **Polecenia umiejętności:** umiejętności `user-invocable` są udostępniane jako polecenia ukośnikiem. Nazwy są sanitizowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują przyrostki numeryczne (np. `_2`).
      - `/skill <name> [input]` uruchamia umiejętność według nazwy (przydatne, gdy ograniczenia poleceń natywnych uniemożliwiają polecenia dla poszczególnych umiejętności).
      - Domyślnie polecenia umiejętności są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a argument zostanie pominięty. Dynamiczne wybory są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, uwzględniają nadpisanie `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, a nie o konfigurację: **czego ten agent może użyć teraz w tej konwersacji**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wyjście.
- `/tools` obejmuje narzędzia faktycznie osiągalne w czasie działania, w tym narzędzia rdzenia, połączone narzędzia Plugin i narzędzia należące do kanału.

Do edycji profilu i nadpisań użyj panelu Tools w interfejsie Control UI albo powierzchni konfiguracji/katalogu, zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; w przypadku MiniMax pola procentowe zawierające tylko pozostały limit są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/cache** w `/status` mogą wrócić do najnowszego wpisu użycia z transkryptu, gdy migawka sesji live jest skąpa. Istniejące niezerowe wartości live nadal mają pierwszeństwo, a fallback z transkryptu może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonywanie a runtime:** `/status` raportuje `Execution` dla efektywnej ścieżki sandboxa oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/uwierzytelniania/endpointów**, a nie użycia.

## Wybór modelu (`/model`)

`/model` jest zaimplementowane jako dyrektywa.

Przykłady:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Uwagi:

- `/model` i `/model list` pokazują kompaktowy, numerowany wybór (rodzina modelu + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny wybór z listami rozwijanymi dostawcy i modelu oraz krokiem Submit. Wybór respektuje `agents.defaults.models`, w tym wpisy `provider/*`, dzięki czemu odkrywanie ograniczone do dostawcy może utrzymać wybór poniżej limitu 25 opcji komponentu w Discord.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać **wyłącznie runtime** nadpisania konfiguracji (w pamięci, nie na dysku). Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast przy nowych odczytach konfiguracji, ale **nie** zapisują do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.
</Note>

## Dane wyjściowe śledzenia Plugin

`/trace` pozwala przełączać **linie śledzenia/debugowania Plugin ograniczone do sesji** bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śledzenia sesji.
- `/trace on` włącza linie śledzenia pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie śledzenia pluginów mogą pojawić się w `/status` oraz jako następcza wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza wyłącznie runtime nadpisaniami konfiguracji.
- `/trace` nie zastępuje `/verbose`; zwykłe dane wyjściowe narzędzi/statusu verbose nadal należą do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do konfiguracji na dysku (`openclaw.json`). Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.config: true`.

Przykłady:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` utrzymują się po restartach.
</Note>

## Aktualizacje MCP

`/mcp` zapisuje zarządzane przez OpenClaw definicje serwerów MCP w `mcp.servers`. Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi. Adaptery runtime decydują, które transporty są faktycznie wykonywalne.
</Note>

## Aktualizacje Plugin

`/plugins` pozwala operatorom sprawdzać odkryte pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` i `/plugins show` używają rzeczywistego odkrywania pluginów względem bieżącego workspace oraz konfiguracji na dysku.
- `/plugins install` instaluje z ClawHub, npm, git, katalogów lokalnych i archiwów.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Zmiany włączenia i wyłączenia hot-reloadują powierzchnie runtime pluginów Gateway dla nowych tur agenta; instalacja żąda restartu Gateway, ponieważ zmieniły się moduły źródłowe pluginów.

</Note>

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Sesje na powierzchnię">
    - **Polecenia tekstowe** działają w normalnej sesji czatu (DM-y współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje na sesję czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogła przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co w `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji. `/side` jest aliasem.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- w sesjach harness Codex działa jako efemeryczny wątek poboczny Codex z
  bieżącymi uprawnieniami Codex i natywną powierzchnią narzędzi,
- w sesjach innych niż Codex zachowuje starsze bezpośrednie zachowanie jednorazowego wywołania pobocznego,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane do historii transkryptu,
- jest dostarczane jako wynik poboczny live zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest użyteczne, gdy potrzebujesz tymczasowego doprecyzowania, podczas gdy główne zadanie trwa dalej.

Przykład:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
