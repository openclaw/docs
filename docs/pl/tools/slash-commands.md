---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-02T10:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b469c4436dec92eb3712f71e5f54bf2c96b9b0b17d60a1533d8669c127caefee
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń trzeba wysyłać jako **samodzielną** wiadomość zaczynającą się od `/`. Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy rozmowa lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji jest kierowany do tego środowiska ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do procedury obsługi poleceń OpenClaw ACP, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (niezawierających wyłącznie dyrektyw) są traktowane jako „wskazówki w treści” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i zwracają potwierdzenie.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych nadawców; w przeciwnym razie autoryzacja pochodzi z list dozwolonych nadawców kanału/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skróty w treści">
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
  Włącza analizowanie `/...` w wiadomościach czatu. Na powierzchniach bez poleceń natywnych (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Tryb automatyczny: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (wartość boolowska albo `"auto"`). `false` czyści wcześniej zarejestrowane polecenia w Discord/Telegram przy uruchamianiu. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord natywne specyfikacje poleceń mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako Discord `description_localizations` i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia **Skills**, gdy jest to obsługiwane. Tryb automatyczny: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdej Skills). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (wartość boolowska albo `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Określa, jak długo bash czeka przed przełączeniem w tryb tła (`0` natychmiast przenosi w tło).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje zarządzaną przez OpenClaw konfigurację MCP pod `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status Plugin oraz kontrolki instalacji i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi ponownego uruchamiania Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora będącego człowiekiem, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` i `/config`. Jest oddzielne od `commands.allowFrom` oraz dostępu przez parowanie wiadomości prywatnych.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia dostępne tylko dla właściciela wymagają **tożsamości właściciela**, aby można było je uruchomić na tej powierzchni. Gdy wartość to `true`, nadawca musi albo pasować do rozpoznanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanale `allowFrom` albo pusta/nierozpoznana lista kandydatów właściciela **nie** wystarcza — polecenia dostępne tylko dla właściciela są domyślnie blokowane w tym kanale. Pozostaw to wyłączone, jeśli chcesz, aby polecenia dostępne tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Określa, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla dostawcy na potrzeby autoryzacji poleceń. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanału/parowania oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnego ustawienia domyślnego; klucze specyficzne dla dostawcy je nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/zasady dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Bieżące źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia doku pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań Plugin `registerCommand()`
- rzeczywista dostępność na Twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Plugin

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetowania.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć i przełączyć na świeżą sesję panelu; wpisane `/reset` nadal uruchamia reset w miejscu wykonywany przez Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, odrzuca ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygasaniem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie wykonania, a następnie eksportuje pakiet [trajectory bundle](/pl/tools/trajectory) JSONL dla bieżącej sesji. Użyj tego, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchomienia">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a poziomy niestandardowe, takie jak `xhigh`, `adaptive`, `max`, albo binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne wykonania.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych po uwierzytelnieniu dostawców albo modele dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` albo `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
    - `/status` pokazuje status wykonania/czasu działania, w tym etykiety `Execution`/`Runtime` oraz użycie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to dostępny tylko dla właściciela przepływ raportu wsparcia dla błędów Gateway i uruchomień środowiska Codex. Za każdym razem prosi o jawne zatwierdzenie wykonania przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą pozwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami o prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa środowiska OpenAI Codex, to samo zatwierdzenie wysyła również odpowiednie opinie Codex na serwery OpenAI, a ukończona odpowiedź wymienia identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z wiadomości prywatnej właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` steruje stopką użycia w każdej odpowiedzi albo wypisuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia Skills według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozstrzyga prompty zatwierdzenia wykonania.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Podagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami podagentów w bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord albo temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających podagentów.
    - `/steer <id|#> <message>` wysyła sterowanie do działającego podagenta. Alias: `/tell`.

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzanego przez OpenClaw w `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginu. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza wyłącznie uruchomieniowymi nadpisaniami konfiguracji. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` ponownie uruchamia OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/send on|off|inherit` ustawia zasadę wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Głos, TTS i sterowanie kanałem">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupowej.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash działające w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony
kanał. Zobacz [Dokowanie kanałów](/pl/concepts/channel-docking), aby poznać konfigurację,
przykłady i rozwiązywanie problemów.

Polecenia dokowania są generowane z pluginów kanałów obsługujących polecenia natywne. Obecny zestaw wbudowany:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Używaj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego uczestnika kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i uczestnik docelowy muszą należeć do tej samej grupy tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisze `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest powiązany z uczestnikiem Discord, polecenie odpowie wskazówką konfiguracyjną zamiast przechodzić do zwykłego czatu.

Dokowanie zmienia tylko trasę aktywnej sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` albo innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia wbudowanych pluginów

Wbudowane pluginy mogą dodawać więcej poleceń slash. Obecne wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje wbudowany harness serwera aplikacji Codex. Zobacz [Harness Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są także udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą także pojawiać się jako polecenia bezpośrednie, takie jak `/prose`, gdy Skill/plugin je rejestruje.
- rejestracja natywnych poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą dostarczać `descriptionLocalizations` dla natywnych powierzchni obsługujących zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Uwagi dotyczące argumentów i parsera">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby zobaczyć pełny podział użycia dostawców, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach z wieloma kontami ukierunkowane na konfigurację `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` także respektują `configWrites` konta docelowego.
    - `/usage` kontroluje stopkę użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm, `git:<repo>` albo `clawhub:<pkg>`.
    - `/plugins enable|disable` aktualizuje konfigurację pluginów i może poprosić o ponowne uruchomienie.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga guild oraz wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączonych efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo trybów verbose / trace / fast / reasoning">
    - `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw to **wyłączone**.
    - `/trace` ma węższy zakres niż `/verbose`: ujawnia tylko linie trace/debug należące do pluginu i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions UI, aby je wyczyścić i wrócić do domyślnej konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują to na `service_tier=priority` w natywnych punktach końcowych Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują to na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi nadal są pokazywane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wynik narzędzi albo diagnostykę pluginów, których nie zamierzasz ujawniać. Najlepiej zostawić je wyłączone, zwłaszcza na czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modelu">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie używa go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i uruchamia ponownie z nowym modelem dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca ze zwykłego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmianki grupowej:** wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają także wtedy, gdy są osadzone w zwykłej wiadomości, i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź ze statusem, a pozostały tekst przechodzi przez zwykły przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny `/...` w treści są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia Skills i argumenty natywne">
    - **Polecenia Skills:** Skills typu `user-invocable` są udostępniane jako polecenia slash. Nazwy są normalizowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają numeryczne sufiksy (np. `_2`).
      - `/skill <name> [input]` uruchamia Skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla poszczególnych Skills).
      - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a argument zostanie pominięty. Dynamiczne wybory są rozwiązywane względem docelowego modelu sesji, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie uruchomieniowe, a nie konfiguracyjne: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest kompaktowe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wyjście.
- `/tools` obejmuje narzędzia faktycznie osiągalne w czasie wykonywania, w tym narzędzia rdzeniowe, połączone narzędzia pluginów i narzędzia należące do kanałów.

Do edycji profilu i nadpisań używaj panelu Control UI Tools albo powierzchni konfiguracji/katalogu, zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co gdzie się wyświetla)

- **Użycie/limit dostawcy** (przykład: "Claude 80% left") pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; w MiniMax pola procentowe zawierające tylko pozostały limit są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/cache** w `/status` mogą użyć najnowszego wpisu użycia transkrypcji jako wartości zastępczej, gdy migawka sesji na żywo jest skąpa. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a wartość zastępcza z transkrypcji może także odzyskać etykietę aktywnego modelu środowiska uruchomieniowego oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonanie a środowisko uruchomieniowe:** `/status` zgłasza `Execution` dla efektywnej ścieżki piaskownicy i `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/uwierzytelniania/endpointów**, a nie użycia.

## Wybór modelu (`/model`)

`/model` jest zaimplementowany jako dyrektywa.

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

- `/model` i `/model list` pokazują kompaktowy, numerowany selektor (rodzina modelu + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem przesłania.
- `/model <#>` wybiera pozycję z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko dla środowiska uruchomieniowego** (pamięć, nie dysk). Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji zapisanej na dysku.
</Note>

## Dane wyjściowe śledzenia Plugin

`/trace` pozwala przełączać **wiersze śledzenia/debugowania Plugin ograniczone do sesji** bez włączania pełnego trybu szczegółowego.

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
- Wiersze śledzenia Plugin mogą pojawiać się w `/status` oraz jako dodatkowy komunikat diagnostyczny po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko dla środowiska uruchomieniowego.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe dane wyjściowe narzędzi/statusu nadal należą do `/verbose`.

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
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` pozostają po ponownych uruchomieniach.
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

## Aktualizacje Plugin

`/plugins` pozwala operatorom sprawdzać wykryte Plugin i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

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
- `/plugins enable|disable` aktualizuje tylko konfigurację Plugin; nie instaluje ani nie odinstalowuje Plugin.
- Po zmianach włączenia/wyłączenia uruchom ponownie Gateway, aby je zastosować.

</Note>

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Sesje według powierzchni">
    - **Polecenia tekstowe** działają w normalnej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** kieruje do aktywnej sesji czatu, aby mogła przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnika Slack dla każdego wbudowanego polecenia (te same nazwy co w `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Poboczne pytania BTW

`/btw` to szybkie **poboczne pytanie** dotyczące bieżącej sesji.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako oddzielne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkrypcji,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe wyjaśnienie, podczas gdy główne zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
```

Zobacz [Poboczne pytania BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
