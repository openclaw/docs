---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-04T02:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy rozmowa lub wątek jest powiązany z sesją ACP, zwykły tekst dalszej rozmowy trafia do tego mechanizmu ACP. Polecenia zarządzania Gateway pozostają jednak lokalne: `/acp ...` zawsze trafia do procedury obsługi poleceń ACP w OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim model ją zobaczy.
    - W zwykłych wiadomościach czatu (niezawierających wyłącznie dyrektyw) są traktowane jako „wskazówki w wierszu” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i zwracają potwierdzenie.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych/parowania kanału oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

  </Accordion>
  <Accordion title="Skróty w wierszu">
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
  Włącza analizowanie `/...` w wiadomościach czatu. Na powierzchniach bez poleceń natywnych (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Automatycznie: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (wartość logiczna lub `"auto"`). W Discord `false` pomija rejestrację poleceń ukośnikowych i czyszczenie podczas uruchamiania; wcześniej zarejestrowane polecenia mogą pozostać widoczne, dopóki nie usuniesz ich z aplikacji Discord. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord specyfikacje poleceń natywnych mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako Discord `description_localizations` i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia **Skills** natywnie, gdy jest to obsługiwane. Automatycznie: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdej Skills). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (wartość logiczna lub `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kontroluje, jak długo bash czeka przed przełączeniem w tryb tła (`0` od razu przenosi do tła).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw pod `mcp.servers`).
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
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora-człowieka, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` oraz `/config`. Jest oddzielne od `commands.allowFrom` i od dostępu przez parowanie wiadomości prywatnych.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby mogły zostać uruchomione na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozpoznanego kandydata na właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny na kanale `allowFrom` albo pusta/nierozpoznana lista kandydatów na właściciela **nie** wystarcza — polecenia tylko dla właściciela na tym kanale domyślnie kończą się odmową. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje sposób wyświetlania identyfikatorów właściciela w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla dostawcy używana do autoryzacji poleceń. Gdy jest skonfigurowana, jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych/parowanie kanału oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze właściwe dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Bieżące źródło prawdy:

- podstawowe wbudowane polecenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dokowania pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań Plugin `registerCommand()`
- rzeczywista dostępność na twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Plugin

### Podstawowe polecenia wbudowane

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetowania.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć świeżą sesję pulpitu i przełączyć się na nią; wpisane `/reset` nadal uruchamia reset w miejscu w Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, odrzuca ponownie użyte identyfikatory sesji zaplecza CLI i ponownie uruchamia w miejscu ładowanie startowe/promptu systemowego.
    - `/compact [instructions]` kompresuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie wykonania, a następnie eksportuje pakiet JSONL [trajektorii](/pl/tools/trajectory) dla bieżącej sesji. Użyj go, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchomienia">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a poziomy niestandardowe, takie jak `xhigh`, `adaptive`, `max` albo binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe dane wyjściowe. Alias: `/v`.
    - `/trace on|off` przełącza dane wyjściowe śledzenia Plugin dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych przez uwierzytelnienie dostawców albo modele dla dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` albo `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).
    - `/steer <message>` wstrzykuje wskazówki do aktywnego uruchomienia dla bieżącej sesji, niezależnie od trybu `/queue`. Nie rozpoczyna nowego uruchomienia, gdy sesja jest bezczynna. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
    - `/status` pokazuje status wykonywania/czasu działania, w tym etykiety `Execution`/`Runtime` oraz użycie/limity dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to przepływ raportu wsparcia tylko dla właściciela dotyczący błędów Gateway i uruchomień mechanizmu Codex. Za każdym razem prosi o jawne zatwierdzenie wykonania przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami o prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa mechanizmu OpenAI Codex, to samo zatwierdzenie wysyła też odpowiednią opinię Codex na serwery OpenAI, a ukończona odpowiedź zawiera identyfikatory sesji OpenClaw, identyfikatory wątków Codex i polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z wiadomości prywatnej właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla odpowiedzi albo drukuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia Skills według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekstowo.
    - `/approve <id> <decision>` rozstrzyga prompty zatwierdzania wykonania.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Podagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami podagentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące wiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego albo wszystkich działających podagentów.
    - `/subagents steer <id|#> <message>` wysyła sterowanie do działającego podagenta. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzanego przez OpenClaw w `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan Plugin. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza zastąpieniami konfiguracji tylko dla środowiska uruchomieniowego. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby wyłączyć.
    - `/send on|off|inherit` ustawia zasady wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Głos, TTS, kontrola kanału">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupy.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony
kanał. Zobacz [Dokowanie kanałów](/pl/concepts/channel-docking), aby poznać konfigurację,
przykłady i rozwiązywanie problemów.

Polecenia dokowania są generowane z Plugin kanałów z obsługą poleceń natywnych. Bieżący wbudowany zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Użyj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego peera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i peer docelowy muszą należeć do tej samej grupy tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o id `123` wyśle `/dock_discord`, OpenClaw zapisze `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest połączony z peerem Discord, polecenie odpowie wskazówką konfiguracji zamiast przejść do normalnego czatu.

Dokowanie zmienia tylko trasę aktywnej sesji. Nie tworzy kont kanałów, nie nadaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` albo innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Wbudowane polecenia Plugin

Wbudowane Plugin mogą dodawać więcej poleceń ukośnikowych. Bieżące wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza memory dreaming. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła gotowe ustawienia rozbudowanych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje wbudowaną uprząż serwera aplikacji Codex. Zobacz [Uprząż Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są również udostępniane jako polecenia ukośnikowe:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako polecenia bezpośrednie, takie jak `/prose`, gdy skill/Plugin je zarejestruje.
- natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą podawać `descriptionLocalizations` dla natywnych powierzchni, które obsługują zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Uwagi o argumentach i parserze">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby uzyskać pełny podział użycia według dostawcy, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach z wieloma kontami, kierowane do konfiguracji `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
    - `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z dzienników sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje Plugin co `openclaw plugins install`: ścieżkę lokalną/archiwum, pakiet npm, `git:<repo>` albo `clawhub:<pkg>`, a następnie żąda restartu Gateway, ponieważ moduły źródłowe Plugin uległy zmianie.
    - `/plugins enable|disable` aktualizuje konfigurację Plugin i wyzwala przeładowanie Plugin Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga serwera i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` oraz poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia skutecznych wiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo verbose / trace / fast / reasoning">
    - `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Plugin i pozostawia wyłączone zwykłe gadatliwe komunikaty narzędzi.
    - `/fast on|off` utrwala zastąpienie dla sesji. Użyj opcji `inherit` w UI sesji, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych punktach końcowych Responses, a bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi nadal są wyświetlane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wyjście narzędzi albo diagnostykę Plugin, których nie zamierzasz ujawniać. Lepiej pozostawić je wyłączone, zwłaszcza w czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modelu">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu go użyje.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby albo do następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca z normalnego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie nadaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmiankami w grupie:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych pomijają wymagania dotyczące wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź ze statusem, a pozostały tekst przechodzi przez normalny przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenia są po cichu ignorowane, a tokeny `/...` w treści są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia Skills i argumenty natywne">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako polecenia ukośnikowe. Nazwy są oczyszczane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe (np. `_2`).
      - `/skill <name> [input]` uruchamia skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla poszczególnych Skills).
      - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie zadeklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla dynamicznych opcji (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a argument zostanie pominięty. Dynamiczne wybory są rozwiązywane względem docelowego modelu sesji, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za zastąpieniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, nie o konfigurację: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wyjście.
- `/tools` obejmuje narzędzia faktycznie osiągalne w środowisku uruchomieniowym, w tym narzędzia podstawowe, podłączone narzędzia Plugin oraz narzędzia należące do kanału.

Do edycji profilu i zastąpień używaj panelu narzędzi w Control UI albo powierzchni konfiguracji/katalogu, zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co jest pokazywane gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% pozostało”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; w przypadku MiniMax pola procentowe zawierające tylko pozostałą wartość są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą użyć najnowszego wpisu użycia z transkrypcji jako wartości zapasowej, gdy migawka sesji na żywo jest niepełna. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a wartość zapasowa z transkrypcji może także odzyskać etykietę aktywnego modelu wykonawczego oraz większą, zorientowaną na prompt sumę, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonanie a środowisko uruchomieniowe:** `/status` zgłasza `Execution` dla efektywnej ścieżki sandboxa oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
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

- `/model` i `/model list` pokazują zwięzły, numerowany wybór (rodzina modelu + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny wybór z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawić nadpisania konfiguracji **tylko dla środowiska uruchomieniowego** (w pamięci, nie na dysku). Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z dysku.
</Note>

## Dane wyjściowe śledzenia pluginu

`/trace` pozwala przełączać **linie śledzenia/debugowania pluginu w zakresie sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śledzenia sesji.
- `/trace on` włącza linie śledzenia pluginu dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie śledzenia pluginu mogą pojawiać się w `/status` oraz jako dodatkowy komunikat diagnostyczny po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko dla środowiska uruchomieniowego.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe dane narzędzi/statusu nadal należą do `/verbose`.

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

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi. Adaptery środowiska uruchomieniowego decydują, które transporty są faktycznie wykonywalne.
</Note>

## Aktualizacje pluginów

`/plugins` pozwala operatorom sprawdzać wykryte pluginy i przełączać włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

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
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginu; nie instaluje ani nie odinstalowuje pluginów.
- Zmiany włączenia i wyłączenia przeładowują na gorąco powierzchnie środowiska uruchomieniowego pluginów Gateway dla nowych tur agenta; instalacja żąda restartu Gateway, ponieważ moduły źródłowe pluginu się zmieniły.

</Note>

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Sesje według powierzchni">
    - **Polecenia tekstowe** działają w normalnej sesji czatu (wiadomości DM współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogła przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Szczegóły Slack">
    `channels.slack.slashCommand` nadal jest obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co w `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Poboczne pytania BTW

`/btw` to szybkie **poboczne pytanie** dotyczące bieżącej sesji. `/side` jest aliasem.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkrypcji,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy potrzebujesz tymczasowego wyjaśnienia, podczas gdy główne zadanie trwa dalej.

Przykład:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Zobacz [Poboczne pytania BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
