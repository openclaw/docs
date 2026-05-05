---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe kontra natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-05T06:19:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy rozmowa lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji trafia do tego środowiska ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do obsługi poleceń OpenClaw ACP, a `/status` oraz `/unfocus` pozostają lokalne zawsze wtedy, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (niezawierających wyłącznie dyrektyw) są traktowane jako „wskazówki w tekście” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są zapisywane w sesji i odpowiadają potwierdzeniem.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych kanału/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skróty w tekście">
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
  Włącza analizowanie `/...` w wiadomościach czatu. Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę opcję na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywne polecenia. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikiem); ignorowane w przypadku dostawców bez natywnej obsługi. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (bool lub `"auto"`). W Discord wartość `false` pomija rejestrację poleceń ukośnikiem i czyszczenie podczas uruchamiania; wcześniej zarejestrowane polecenia mogą pozostać widoczne, dopóki nie usuniesz ich z aplikacji Discord. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord natywne specyfikacje poleceń mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako Discord `description_localizations` i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia **skill**, gdy jest to obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikiem dla każdego skill). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (bool lub `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kontroluje, jak długo bash czeka przed przełączeniem do trybu tła (`0` natychmiast przenosi do tła).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw w `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz kontrolki instalacji i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędziowe restartu gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właściciela dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora człowieka, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` oraz `/config`. Jest oddzielne od `commands.allowFrom` i dostępu przez parowanie DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: wymaga, aby polecenia dostępne tylko dla właściciela były uruchamiane przez **tożsamość właściciela** na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozpoznanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanale `allowFrom` albo pusta/nierozpoznana lista kandydatów właściciela **nie** wystarcza — polecenia dostępne tylko dla właściciela są na tym kanale domyślnie odrzucane. Pozostaw tę opcję wyłączoną, jeśli chcesz, aby polecenia dostępne tylko dla właściciela były ograniczane tylko przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla każdego dostawcy na potrzeby autoryzacji poleceń. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanału/parowania oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia doku pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań pluginów `registerCommand()`
- rzeczywista dostępność w twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć świeżą sesję panelu i przełączyć się na nią; wpisane `/reset` nadal uruchamia reset w miejscu w Gateway.
    - `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia w miejscu ładowanie startowe/promptu systemowego.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie exec, a następnie eksportuje pakiet JSONL [trajektorii](/pl/tools/trajectory) dla bieżącej sesji. Użyj go, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych monit zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchomienia">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a niestandardowe poziomy, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia pluginów dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych przez auth dostawców albo modele dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` lub `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).
    - `/steer <message>` wstrzykuje wskazówki do aktywnego uruchomienia dla bieżącej sesji, niezależnie od trybu `/queue`. Nie rozpoczyna nowego uruchomienia, gdy sesja jest bezczynna. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
    - `/status` pokazuje status wykonania/czasu działania, czas działania Gateway i systemu oraz wykorzystanie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to przepływ raportu wsparcia dostępny tylko dla właściciela dla błędów Gateway i uruchomień środowiska Codex. Za każdym razem prosi o jawne zatwierdzenie exec przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami o prywatności i odpowiednimi identyfikatorami sesji. W czatach grupowych monit zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa środowiska OpenAI Codex, to samo zatwierdzenie wysyła także odpowiednią opinię Codex na serwery OpenAI, a ukończona odpowiedź zawiera identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla odpowiedzi albo wypisuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia skill według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozstrzyga monity zatwierdzeń exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami podagentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich uruchomionych podagentów.
    - `/subagents steer <id|#> <message>` wysyła sterowanie do uruchomionego podagenta. Zobacz [Sterowanie](/pl/tools/steer).

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje zarządzaną przez OpenClaw konfigurację serwera MCP w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub zmienia stan plugin. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza zastąpieniami konfiguracji obowiązującymi tylko w środowisku uruchomieniowym. Tylko dla właściciela. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/send on|off|inherit` ustawia zasady wysyłania. Tylko dla właściciela.

  </Accordion>
  <Accordion title="Głos, TTS, sterowanie kanałem">
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

Polecenia dokowania są generowane z plugin kanałów z obsługą poleceń natywnych. Obecny zestaw wbudowany:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Używaj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego równorzędnego kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i docelowy peer muszą należeć do tej samej grupy tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisze `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest połączony z peerem Discord, polecenie odpowiada wskazówką konfiguracji zamiast przechodzić do zwykłego czatu.

Dokowanie zmienia tylko trasę aktywnej sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` lub innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia wbudowanych plugin

Wbudowane plugin mogą dodawać więcej poleceń z ukośnikiem. Obecne wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła gotowe bogate karty LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje wbudowany harness serwera aplikacji Codex. Zobacz [Harness Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są również udostępniane jako polecenia z ukośnikiem:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy skill/plugin je zarejestruje.
- natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą zapewniać `descriptionLocalizations` dla natywnych powierzchni obsługujących zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Uwagi o argumentach i parserze">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby zobaczyć pełny podział użycia dostawcy, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach z wieloma kontami ukierunkowane na konfigurację `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
    - `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje plugin co `openclaw plugins install`: lokalną ścieżkę/archiwum, pakiet npm, `git:<repo>` lub `clawhub:<pkg>`, a następnie żąda restartu Gateway, ponieważ moduły źródłowe plugin się zmieniły.
    - `/plugins enable|disable` aktualizuje konfigurację plugin i wyzwala ponowne załadowanie plugin Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga serwera i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia skutecznych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo verbose / trace / fast / reasoning">
    - `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do plugin wiersze trace/debug i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala zastąpienie sesji. Użyj opcji `inherit` w interfejsie sesji, aby je wyczyścić i wrócić do domyślnej konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych punktach końcowych Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi nadal są pokazywane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wynik narzędzia lub diagnostykę plugin, których nie zamierzano ujawniać. Najlepiej pozostawić je wyłączone, szczególnie w czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modelu">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca ze zwykłego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmianką w grupie:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź o statusie, a pozostały tekst przechodzi przez zwykły przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenia są po cichu ignorowane, a tokeny `/...` w treści są traktowane jak zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia Skills i argumenty natywne">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako polecenia z ukośnikiem. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe (np. `_2`).
      - `/skill <name> [input]` uruchamia skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla poszczególnych Skills).
      - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby przekierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument. Dynamiczne wybory są rozstrzygane względem docelowego modelu sesji, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za zastąpieniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, a nie o konfigurację: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest kompaktowe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wynik.
- `/tools` obejmuje narzędzia faktycznie osiągalne w środowisku uruchomieniowym, w tym narzędzia rdzeniowe, połączone narzędzia plugin i narzędzia należące do kanału.

Do edycji profili i zastąpień używaj panelu narzędzi w interfejsie sterowania albo powierzchni konfiguracji/katalogu zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co gdzie się pokazuje)

- **Użycie/limit dostawcy** (przykład: „Claude 80% pozostało”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; w przypadku MiniMax pola procentowe zawierające tylko pozostałą część są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą użyć najnowszego wpisu użycia z transkryptu jako wartości zastępczej, gdy migawka aktywnej sesji jest skąpa. Istniejące niezerowe wartości z aktywnej sesji nadal mają pierwszeństwo, a wartość zastępcza z transkryptu może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisanych sum brakuje albo są mniejsze.
- **Wykonanie a runtime:** `/status` zgłasza `Execution` dla efektywnej ścieżki sandboxa oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dodawane do zwykłych odpowiedzi).
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

- `/model` i `/model list` pokazują zwarty, numerowany selektor (rodzina modelu + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.debug: true`.

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

## Dane wyjściowe śledzenia Plugin

`/trace` pozwala przełączać **wiersze śledzenia/debugowania Plugin o zakresie sesji** bez włączania pełnego trybu szczegółowego.

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
- Wiersze śledzenia Plugin mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
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
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` utrzymują się po restartach.
</Note>

## Aktualizacje MCP

`/mcp` zapisuje zarządzane przez OpenClaw definicje serwerów MCP pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.mcp: true`.

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

`/plugins` pozwala operatorom sprawdzać wykryte plugins i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz za pomocą `commands.plugins: true`.

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
- `/plugins enable|disable` aktualizuje tylko konfigurację Plugin; nie instaluje ani nie odinstalowuje plugins.
- Zmiany włączenia i wyłączenia przeładowują na gorąco powierzchnie runtime Plugin Gateway dla nowych tur agenta; instalacja żąda restartu Gateway, ponieważ moduły źródłowe Plugin uległy zmianie.

</Note>

## Uwagi o powierzchniach

<AccordionGroup>
  <Accordion title="Sesje na powierzchnię">
    - **Polecenia tekstowe** działają w zwykłej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogło przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnikowe Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji. `/side` jest aliasem.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz tymczasowego wyjaśnienia, podczas gdy główne zadanie trwa dalej.

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
