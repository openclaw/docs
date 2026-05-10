---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-10T19:58:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji trafia do tego harnessu ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do handlera poleceń ACP w OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Commands">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (nie zawierających wyłącznie dyrektyw) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i zwracają potwierdzenie.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych nadawców; w przeciwnym razie autoryzacja pochodzi z list dozwolonych kanałów/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi dalej przez normalny przepływ.

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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę wartość na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywne polecenia. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń slash); ignorowane dla dostawców bez natywnej obsługi. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` albo `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (bool albo `"auto"`). W Discord `false` pomija rejestrację poleceń slash i czyszczenie podczas uruchamiania; wcześniej zarejestrowane polecenia mogą pozostać widoczne, dopóki nie usuniesz ich z aplikacji Discord. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord natywne specyfikacje poleceń mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako `description_localizations` Discord i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia **skill**, gdy są obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia slash dla każdego skill). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` albo `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (bool albo `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kontroluje, jak długo bash czeka przed przełączeniem w tryb tła (`0` natychmiast przenosi w tło).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw w `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status Plugin oraz kontrolki instalacji i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartu Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora-człowieka, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` oraz `/config`. Jest oddzielne od `commands.allowFrom` i od dostępu przez parowanie DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia dostępne tylko dla właściciela wymagają **tożsamości właściciela**, aby działać na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozpoznanego kandydata na właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo posiadać wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wildcard w kanale `allowFrom` albo pusta/nierozpoznana lista kandydatów na właściciela **nie** wystarcza — polecenia dostępne tylko dla właściciela w tym kanale domyślnie kończą się odmową. Pozostaw to wyłączone, jeśli chcesz, aby polecenia dostępne tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla dostawców używana do autoryzacji poleceń. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanałów/parowanie oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań `registerCommand()` Plugin
- rzeczywista dostępność na twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Plugin

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć świeżą sesję dashboardu i przełączyć się na nią, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; w takim przypadku `/new` resetuje główną sesję w miejscu. Wpisane `/reset` nadal uruchamia reset w miejscu obsługiwany przez Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygasaniem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zgodę na wykonanie, a następnie eksportuje pakiet JSONL [trajectory bundle](/pl/tools/trajectory) dla bieżącej sesji. Używaj tego, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level|default>` ustawia poziom myślenia albo czyści nadpisanie sesji. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a niestandardowe poziomy takie jak `xhigh`, `adaptive`, `max` albo binarne `on` występują tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
    - `/fast [status|on|off|default]` pokazuje, ustawia albo czyści tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje albo ustawia domyślne wartości exec.
    - `/model [name|#|status]` pokazuje albo ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych przez auth dostawców albo modele dla dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy. Wpisy `provider/*` w `agents.defaults.models` sprawiają, że `/model` i `/models` pokazują odkryte modele tylko dla tych dostawców.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` albo `/queue reset` czyści nadpisanie sesji. Zobacz [Command queue](/pl/concepts/queue) i [Steering queue](/pl/concepts/queue-steering).
    - `/steer <message>` wstrzykuje wskazówki do aktywnego uruchomienia dla bieżącej sesji, niezależnie od trybu `/queue`. Nie rozpoczyna nowego uruchomienia, gdy sesja jest bezczynna. Alias: `/tell`. Zobacz [Steer](/pl/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może użyć w tej chwili.
    - `/status` pokazuje status wykonania/czasu działania, czas działania Gateway i systemu oraz użycie/kwotę dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to dostępny tylko dla właściciela przepływ raportu wsparcia dla błędów Gateway i uruchomień harnessu Codex. Za każdym razem prosi o jawną zgodę na wykonanie przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą allow-all. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, notami prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa harnessu OpenAI Codex, ta sama zgoda wysyła także odpowiedni feedback Codex na serwery OpenAI, a ukończona odpowiedź zawiera identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz polecenia `codex resume <thread-id>`. Zobacz [Diagnostics Export](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|map|json]` wyjaśnia, jak składany jest kontekst. `map` wysyła obraz treemapy kontekstu bieżącej sesji.
    - `/whoami` pokazuje twój identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla każdej odpowiedzi albo drukuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia skill według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozwiązuje monity o zatwierdzenie exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
    - `/subagents steer <id|#> <message>` wysyła wskazówki sterujące do działającego subagenta. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginu. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza zastąpieniami konfiguracji wyłącznie w środowisku uruchomieniowym. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/send on|off|inherit` ustawia zasady wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Głos, TTS, kontrola kanału">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` kontroluje TTS. Zobacz [TTS](/pl/tools/tts).
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

Polecenia dokowania są generowane z pluginów kanałów obsługujących polecenia natywne. Bieżący zestaw dołączony:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Używaj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego partnera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i partner docelowy muszą znajdować się w tej samej grupie tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisuje `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest połączony z partnerem Discord, polecenie odpowiada wskazówką konfiguracji zamiast przechodzić do normalnego czatu.

Dokowanie zmienia tylko trasę aktywnej sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkryptu do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` lub innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia dołączonych pluginów

Dołączone pluginy mogą dodawać więcej poleceń slash. Bieżące dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzeń. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła gotowe karty rich card LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje dołączony harness serwera aplikacji Codex. Zobacz [Harness Codex](/pl/plugins/codex-harness).
- Polecenia tylko QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia skill

Skills wywoływane przez użytkownika są również udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- skills mogą także pojawiać się jako polecenia bezpośrednie, takie jak `/prose`, gdy skill/plugin je rejestruje.
- natywna rejestracja poleceń skill jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą udostępniać `descriptionLocalizations` dla natywnych powierzchni obsługujących zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Uwagi o argumentach i parserze">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby uzyskać pełny podział użycia według dostawcy, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i honoruje kanałowe `configWrites`.
    - W kanałach wielokontowych ukierunkowane na konfigurację `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` także honorują `configWrites` konta docelowego.
    - `/usage` kontroluje stopkę użycia na odpowiedź; `/usage cost` drukuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm, `git:<repo>` lub `clawhub:<pkg>`, a następnie żąda restartu Gateway, ponieważ moduły źródłowe pluginów się zmieniły.
    - `/plugins enable|disable` aktualizuje konfigurację pluginów i wyzwala ponowne wczytanie pluginów Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko Discord: `/vc join|leave|status` kontroluje kanały głosowe (niedostępne jako tekst). `join` wymaga guild i wybranego kanału voice/stage. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo verbose / trace / fast / reasoning">
    - `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; utrzymuj je **wyłączone** podczas normalnego użycia.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do pluginu i pozostawia normalny verbose szum narzędzi wyłączony.
    - `/fast on|off` utrwala zastąpienie sesji. Użyj opcji `inherit` w interfejsie sesji, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych punktach końcowych Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniany przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi są nadal pokazywane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, dane wyjściowe narzędzi lub diagnostykę pluginów, których nie zamierzano ujawniać. Preferuj pozostawienie ich wyłączonych, zwłaszcza na czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modelu">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie używa go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu tylko w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca z normalnego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty inline">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych są obsługiwane natychmiast (pomijają kolejkę i model).
    - **Bramkowanie wzmianki grupowej:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
    - **Skróty inline (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają także wtedy, gdy są osadzone w normalnej wiadomości, i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź statusu, a pozostały tekst przechodzi przez normalny przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenia są cicho ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia skill i argumenty natywne">
    - **Polecenia skill:** skills `user-invocable` są udostępniane jako polecenia slash. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy numeryczne (np. `_2`).
      - `/skill <name> [input]` uruchamia skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla każdego skill).
      - Domyślnie polecenia skill są przekazywane do modelu jako normalne żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a pominiesz argument. Dynamiczne wybory są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za zastąpieniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, a nie o konfigurację: **czego ten agent może używać teraz w tej rozmowie**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod kątem szybkiego skanowania.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wyjście.
- `/tools` obejmuje narzędzia faktycznie osiągalne w środowisku uruchomieniowym, w tym narzędzia rdzenia, połączone narzędzia pluginów i narzędzia należące do kanału.

Do edycji profilu i zastąpień używaj panelu Tools w interfejsie Control UI albo powierzchni konfiguracji/katalogu zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: "Claude 80% left") pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; w przypadku MiniMax pola procentowe zawierające tylko pozostały limit są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą użyć jako wartości zastępczej najnowszego wpisu użycia z transkrypcji, gdy migawka sesji na żywo jest skąpa. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a wartość zastępcza z transkrypcji może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisanych sum brakuje lub są mniejsze.
- **Wykonywanie a runtime:** `/status` raportuje `Execution` dla efektywnej ścieżki sandboxa oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź** kontroluje `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
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
- W Discord `/model` i `/models` otwierają interaktywny wybór z listami rozwijanymi dostawcy i modelu oraz krokiem Submit. Wybór respektuje `agents.defaults.models`, w tym wpisy `provider/*`, dzięki czemu wykrywanie ograniczone do dostawcy może utrzymać wybór poniżej limitu 25 opcji komponentu w Discord.
- `/model <#>` wybiera z tej listy (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawić nadpisania konfiguracji **tylko runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują się do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z dysku.
</Note>

## Dane wyjściowe śladu Plugin

`/trace` pozwala przełączać **ograniczone do sesji wiersze śladu/debugowania Plugin** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śladu sesji.
- `/trace on` włącza wiersze śladu Plugin dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Wiersze śladu Plugin mogą pojawić się w `/status` oraz jako następująca po zwykłej odpowiedzi asystenta wiadomość diagnostyczna.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko runtime.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe dane wyjściowe narzędzi/statusu nadal należą do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do konfiguracji na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.config: true`.

Przykłady:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` pozostają po restartach.
</Note>

## Aktualizacje MCP

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.mcp: true`.

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

`/plugins` pozwala operatorom sprawdzać wykryte pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz za pomocą `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego workspace oraz konfiguracji na dysku.
- `/plugins install` instaluje z ClawHub, npm, git, katalogów lokalnych i archiwów.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Zmiany włączenia i wyłączenia przeładowują na gorąco powierzchnie runtime pluginów Gateway dla nowych tur agenta; instalacja żąda restartu Gateway, ponieważ zmieniły się moduły źródłowe pluginów.

</Note>

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Sesje według powierzchni">
    - **Polecenia tekstowe** działają w zwykłej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogła przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Szczegóły Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co w `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji. `/side` jest aliasem.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkrypcji,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz tymczasowego wyjaśnienia, podczas gdy główne zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
