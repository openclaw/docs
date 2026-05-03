---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia slash: tekstowe kontra natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-03T21:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji jest kierowany do tej uprzęży ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do procedury obsługi poleceń ACP w OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Commands">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki w treści” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających tylko dyrektywy (wiadomość zawiera wyłącznie dyrektywy) są utrwalane w sesji i zwracają potwierdzenie.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych kanałów/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi przez zwykły przepływ.

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
  Rejestruje polecenia natywne. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać dla danego dostawcy (bool albo `"auto"`). W Discord `false` pomija rejestrację poleceń ukośnikowych i czyszczenie podczas uruchamiania; wcześniej zarejestrowane polecenia mogą pozostać widoczne, dopóki nie usuniesz ich z aplikacji Discord. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord specyfikacje poleceń natywnych mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako Discord `description_localizations` i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia **skill** natywnie, gdy są obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdej umiejętności). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać dla danego dostawcy (bool albo `"auto"`).
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
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw pod `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz kontrolki instalacji i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartu gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi tylko dla właściciela. To konto operatora człowieka, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` i `/config`. Jest oddzielne od `commands.allowFrom` oraz od dostępu przez parowanie DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby działać na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozwiązanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanale `allowFrom` albo pusta/nierozwiązana lista kandydatów właściciela **nie** wystarcza — polecenia tylko dla właściciela na tym kanale zawodzą w trybie zamkniętym. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były bramkowane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla autoryzacji poleceń według dostawcy. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanałów/parowanie oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Egzekwuje listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane elementy rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań `registerCommand()` pluginów
- rzeczywista dostępność na Twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetowania.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć i przełączyć na świeżą sesję dashboardu; wpisane `/reset` nadal uruchamia reset w miejscu w Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, odrzuca ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie exec, a następnie eksportuje pakiet [trajektorii](/pl/tools/trajectory) JSONL dla bieżącej sesji. Użyj go, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a niestandardowe poziomy, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia pluginu dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych przez auth dostawców albo modele dla dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` lub `/queue reset` czyści nadpisanie sesji. Zobacz [kolejkę poleceń](/pl/concepts/queue) i [kolejkę sterowania](/pl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` pokazuje krótki opis pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może użyć w tej chwili.
    - `/status` pokazuje status wykonania/czasu działania, w tym etykiety `Execution`/`Runtime` oraz użycie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to przepływ raportu wsparcia tylko dla właściciela dla błędów Gateway i uruchomień uprzęży Codex. Za każdym razem prosi o jawne zatwierdzenie exec przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami dotyczącymi prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa uprzęży OpenAI Codex, to samo zatwierdzenie wysyła również odpowiednie informacje zwrotne Codex do serwerów OpenAI, a ukończona odpowiedź wymienia identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz polecenia `codex resume <thread-id>`. Zobacz [eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla każdej odpowiedzi albo drukuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` uruchamia Skills według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozwiązuje prompty zatwierdzenia exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów w bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord albo temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
    - `/steer <id|#> <message>` wysyła sterowanie do działającego subagenta. Alias: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw pod `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginu. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w czasie działania. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
    - `/send on|off|inherit` ustawia politykę wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` kontroluje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupowej.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash działające w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony kanał. Konfigurację, przykłady i rozwiązywanie problemów znajdziesz w [Dokowaniu kanałów](/pl/concepts/channel-docking).

Polecenia dokowania są generowane z pluginów kanałów z obsługą poleceń natywnych. Bieżący zestaw wbudowany:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Użyj poleceń dokowania w czacie bezpośrednim, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego partnera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i partner docelowy muszą być w tej samej grupie tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisze `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest powiązany z partnerem Discord, polecenie zwróci wskazówkę konfiguracji zamiast przejść do normalnego czatu.

Dokowanie zmienia tylko aktywną trasę sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` albo innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia wbudowanych pluginów

Wbudowane pluginy mogą dodawać więcej poleceń ukośnika. Bieżące wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła gotowe ustawienia bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje wbudowaną uprząż serwera aplikacji Codex. Zobacz [Uprząż Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są także udostępniane jako polecenia ukośnika:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy skill/plugin je zarejestruje.
- natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą dostarczać `descriptionLocalizations` dla natywnych powierzchni obsługujących zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Pełny podział użycia dostawcy uzyskasz przez `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach z wieloma kontami kierowane do konfiguracji `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
    - `/usage` kontroluje stopkę użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalną ścieżkę/archiwum, pakiet npm, `git:<repo>` albo `clawhub:<pkg>`, a następnie żąda restartu Gateway, ponieważ moduły źródłowe pluginów się zmieniły.
    - `/plugins enable|disable` aktualizuje konfigurację pluginów i wyzwala ponowne wczytanie pluginów Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` kontroluje kanały głosowe (niedostępne jako tekst). `join` wymaga gildii i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` oraz poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie w czasie działania: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu trzymaj je **wyłączone**.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do pluginów wiersze śledzenia/debugowania i pozostawia normalny szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions UI, aby je wyczyścić i wrócić do domyślnych wartości konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapuje je na `service_tier=priority` w natywnych punktach końcowych Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniany OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania niepowodzeń narzędzi nadal są pokazywane, gdy są istotne, ale szczegółowy tekst niepowodzenia jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wynik narzędzi albo diagnostykę pluginów, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, zwłaszcza w czatach grupowych.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje w nowym modelu dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca z normalnego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmianką w grupie:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają także po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź o statusie, a pozostały tekst przechodzi przez normalny przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako polecenia ukośnika. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy numeryczne (np. `_2`).
      - `/skill <name> [input]` uruchamia skill według nazwy (przydatne, gdy ograniczenia poleceń natywnych uniemożliwiają polecenia dla poszczególnych Skills).
      - Domyślnie polecenia Skills są przekazywane do modelu jako normalne żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a Ty pominiesz argument. Dynamiczne wybory są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, nie o konfigurację: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest kompaktowe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Natywne powierzchnie poleceń obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy albo modelu może zmienić wynik.
- `/tools` obejmuje narzędzia, które faktycznie są osiągalne w czasie działania, w tym narzędzia rdzenia, połączone narzędzia pluginów i narzędzia należące do kanałów.

Do edycji profili i nadpisań użyj panelu Control UI Tools albo powierzchni konfiguracji/katalogu, zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: "Claude 80% pozostało") pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% pozostało`; dla MiniMax pola procentowe zawierające tylko pozostały limit są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/cache** w `/status` mogą awaryjnie użyć najnowszego wpisu użycia z transkryptu, gdy bieżąca migawka sesji jest niepełna. Istniejące niezerowe wartości z bieżącej sesji nadal mają pierwszeństwo, a awaryjne użycie transkryptu może także odzyskać etykietę aktywnego modelu środowiska wykonawczego oraz większą sumę ukierunkowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonanie a środowisko wykonawcze:** `/status` zgłasza `Execution` dla efektywnej ścieżki piaskownicy oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI lub backend ACP.
- **Tokeny/koszt na odpowiedź** kontroluje `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/uwierzytelniania/endpointów**, nie użycia.

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
- W Discord `/model` i `/models` otwierają interaktywny wybór z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko dla środowiska wykonawczego** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

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

## Wynik śledzenia Plugin

`/trace` pozwala przełączać **wiersze śledzenia/debugowania Plugin w zakresie sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śledzenia sesji.
- `/trace on` włącza wiersze śledzenia Plugin dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Wiersze śledzenia Plugin mogą pojawiać się w `/status` oraz jako uzupełniająca wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko dla środowiska wykonawczego.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe dane narzędzi/statusu nadal należą do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do konfiguracji na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.config: true`.

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

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi. Adaptery środowiska wykonawczego decydują, które transporty są faktycznie wykonywalne.
</Note>

## Aktualizacje Plugin

`/plugins` pozwala operatorom sprawdzać wykryte Plugin i przełączać włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Plugin względem bieżącego obszaru roboczego oraz konfiguracji na dysku.
- `/plugins install` instaluje z ClawHub, npm, git, katalogów lokalnych i archiwów.
- `/plugins enable|disable` aktualizuje tylko konfigurację Plugin; nie instaluje ani nie odinstalowuje Plugin.
- Zmiany włączenia i wyłączenia przeładowują na gorąco powierzchnie środowiska wykonawczego Plugin Gateway dla nowych tur agenta; instalacja żąda restartu Gateway, ponieważ zmieniły się moduły źródłowe Plugin.

</Note>

## Uwagi o powierzchniach

<AccordionGroup>
  <Accordion title="Sesje na powierzchnię">
    - **Polecenia tekstowe** działają w zwykłej sesji czatu (wiadomości DM współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
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
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy potrzebujesz tymczasowego wyjaśnienia, a główne zadanie nadal trwa.

Przykład:

```text
/btw co teraz robimy?
/side co zmieniło się, gdy główne uruchomienie było kontynuowane?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
