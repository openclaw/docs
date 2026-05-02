---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-05-02T20:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy rozmowa lub wątek jest powiązany z sesją ACP, zwykły tekst kolejnej odpowiedzi jest kierowany do tego środowiska ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do obsługi poleceń ACP OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla danej powierzchni.

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
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych nadawców; w przeciwnym razie autoryzacja pochodzi z list dozwolonych nadawców/parowania kanału oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skróty w treści">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Są uruchamiane natychmiast, usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi przez zwykły przepływ.

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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę opcję na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywne polecenia. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnika); ignorowane dla dostawców bez natywnej obsługi. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (wartość boolowska albo `"auto"`). `false` czyści wcześniej zarejestrowane polecenia w Discord/Telegram podczas uruchamiania. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
W Discord natywne specyfikacje poleceń mogą zawierać `descriptionLocalizations`, które OpenClaw publikuje jako `description_localizations` Discord i uwzględnia w porównaniach uzgadniania.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywnie polecenia **skill**, gdy są obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnika dla każdej skill). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (wartość boolowska albo `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kontroluje, jak długo bash czeka przed przełączeniem w tryb tła (`0` natychmiast przenosi do tła).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje zarządzaną przez OpenClaw konfigurację MCP pod `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz kontrolki instalacji i włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania wyłącznie w czasie działania).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartu gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właścicieli dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To konto operatora będącego człowiekiem, które może zatwierdzać niebezpieczne akcje i uruchamiać polecenia takie jak `/diagnostics`, `/export-trajectory` oraz `/config`. Jest oddzielne od `commands.allowFrom` i od dostępu przez parowanie DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia dostępne tylko dla właściciela wymagają **tożsamości właściciela**, aby działały na tej powierzchni. Gdy `true`, nadawca musi albo pasować do rozpoznanego kandydata na właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w `allowFrom` kanału lub pusta/nierozpoznana lista kandydatów na właściciela **nie** wystarcza — polecenia dostępne tylko dla właściciela na tym kanale domyślnie kończą się odmową. Pozostaw tę opcję wyłączoną, jeśli chcesz, aby polecenia dostępne tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właściciela pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla dostawcy na potrzeby autoryzacji poleceń. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych/parowanie kanału oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane elementy rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań pluginów `registerCommand()`
- faktyczna dostępność w twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
    - Control UI przechwytuje wpisane `/new`, aby utworzyć i przełączyć na świeżą sesję panelu; wpisane `/reset` nadal uruchamia reset w miejscu w Gateway.
    - `/reset soft [message]` zachowuje bieżącą transkrypcję, odrzuca ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygasaniem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie exec, a następnie eksportuje pakiet [trajectory bundle](/pl/tools/trajectory) JSONL dla bieżącej sesji. Używaj tego, gdy potrzebujesz osi czasu promptu, narzędzi i transkrypcji dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchamiania">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a poziomy niestandardowe, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, występują tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe dane wyjściowe. Alias: `/v`.
    - `/trace on|off` przełącza dane wyjściowe śledzenia pluginów dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych po uwierzytelnieniu dostawców albo modele dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` lub `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
    - `/status` pokazuje status wykonania/czasu działania, w tym etykiety `Execution`/`Runtime` oraz użycie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to dostępny tylko dla właściciela przepływ raportu wsparcia dla błędów Gateway i uruchomień środowiska Codex. Za każdym razem prosi o jawne zatwierdzenie exec przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu, podsumowaniem manifestu, uwagami dotyczącymi prywatności oraz odpowiednimi identyfikatorami sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa środowiska OpenAI Codex, to samo zatwierdzenie wysyła również odpowiednie opinie Codex na serwery OpenAI, a ukończona odpowiedź zawiera identyfikatory sesji OpenClaw, identyfikatory wątków Codex i polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje twój identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla odpowiedzi albo drukuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia skill według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekst.
    - `/approve <id> <decision>` rozwiązuje prompty zatwierdzenia exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów w bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
    - `/steer <id|#> <message>` wysyła instrukcje sterujące do działającego subagenta. Alias: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko właściciel. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzanego przez OpenClaw w `mcp.servers`. Tylko właściciel. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginów. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko dla środowiska uruchomieniowego. Tylko właściciel. Wymaga `commands.debug: true`.
    - `/restart` uruchamia ponownie OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/send on|off|inherit` ustawia zasady wysyłania. Tylko właściciel.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupowej.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony
kanał. Zobacz [dokowanie kanałów](/pl/concepts/channel-docking), aby poznać konfigurację,
przykłady i rozwiązywanie problemów.

Polecenia dokowania są generowane z pluginów kanałów obsługujących polecenia natywne. Bieżący zestaw wbudowany:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Używaj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego partnera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i partner docelowy muszą znajdować się w tej samej grupie tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisuje `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest powiązany z partnerem Discord, polecenie odpowiada wskazówką dotyczącą konfiguracji zamiast przechodzić do zwykłego czatu.

Dokowanie zmienia tylko aktywną trasę sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list dozwolonych kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` lub innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Polecenia wbudowanych pluginów

Wbudowane pluginy mogą dodawać więcej poleceń ukośnika. Bieżące wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord nazwa polecenia natywnego to `/talkvoice`.
- `/card ...` wysyła gotowe ustawienia bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i kontroluje wbudowaną uprząż serwera aplikacji Codex. Zobacz [uprząż Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są także udostępniane jako polecenia ukośnika:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako polecenia bezpośrednie, takie jak `/prose`, gdy Skill/plugin je rejestruje.
- rejestracja natywnych poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.
- specyfikacje poleceń mogą udostępniać `descriptionLocalizations` dla natywnych powierzchni obsługujących zlokalizowane opisy, w tym Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli brak dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby uzyskać pełny podział użycia dostawców, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje `configWrites` kanału.
    - W kanałach wielokontowych `/allowlist --account <id>` skierowane do konfiguracji oraz `/config set channels.<provider>.accounts.<id>...` także respektują `configWrites` konta docelowego.
    - `/usage` kontroluje stopkę użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z dzienników sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby to wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm, `git:<repo>` lub `clawhub:<pkg>`, a następnie żąda ponownego uruchomienia Gateway, ponieważ moduły źródłowe pluginów uległy zmianie.
    - `/plugins enable|disable` aktualizuje konfigurację pluginów i wyzwala ponowne wczytanie pluginów Gateway dla nowych tur agenta.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga gildii i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia Discord do wiązania wątków (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` służy do debugowania i dodatkowej widoczności; trzymaj je **wyłączone** podczas normalnego użycia.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do pluginu i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions UI, aby je wyczyścić i wrócić do domyślnych wartości konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania błędów narzędzi nadal są pokazywane, gdy są istotne, ale szczegółowy tekst błędu jest uwzględniany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wyniki narzędzi lub diagnostykę pluginów, których nie chcesz ujawniać. Preferuj pozostawianie ich wyłączonych, zwłaszcza w czatach grupowych.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie używa go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i uruchamia ponownie z nowym modelem dopiero w czystym punkcie ponownej próby.
    - Jeśli aktywność narzędzia lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby lub następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca ze zwykłego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień konfiguracyjnych.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - **Bramkowanie wzmianką w grupie:** wiadomości zawierające tylko polecenia od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
    - **Skróty w treści (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają też, gdy są osadzone w zwykłej wiadomości, i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź ze statusem, a pozostały tekst przechodzi przez zwykły przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenia są cicho ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako polecenia ukośnika. Nazwy są oczyszczane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe (np. `_2`).
      - `/skill <name> [input]` uruchamia Skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają osobne polecenia dla każdego Skill).
      - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby skierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a argument zostanie pominięty. Wybory dynamiczne są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie dotyczące środowiska uruchomieniowego, a nie konfiguracji: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wyjście.
- `/tools` zawiera narzędzia faktycznie osiągalne w czasie wykonywania, w tym narzędzia core, narzędzia podłączonych pluginów i narzędzia należące do kanału.

Do edycji profilu i nadpisań używaj panelu Control UI Tools albo powierzchni konfiguracji/katalogu zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% pozostało”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe zawierające tylko pozostały limit są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą awaryjnie używać najnowszego wpisu użycia z transkrypcji, gdy bieżąca migawka sesji jest skąpa. Istniejące niezerowe wartości bieżące nadal mają pierwszeństwo, a awaryjne użycie transkrypcji może też odzyskać etykietę aktywnego modelu środowiska wykonawczego oraz większą, zorientowaną na prompt sumę, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonanie a środowisko wykonawcze:** `/status` zgłasza `Execution` dla efektywnej ścieżki piaskownicy oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI lub backend ACP.
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

- `/model` i `/model list` pokazują zwarty, numerowany selektor (rodzina modeli + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawić nadpisania konfiguracji **tylko dla środowiska wykonawczego** (pamięć, nie dysk). Tylko właściciel. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.
</Note>

## Dane wyjściowe śledzenia Plugin

`/trace` pozwala przełączać **linie śledzenia/debugowania Plugin ograniczone do sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śledzenia sesji.
- `/trace on` włącza linie śledzenia Plugin dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie śledzenia Plugin mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po normalnej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko dla środowiska wykonawczego.
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
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` pozostają po restartach.
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
- Zmiany włączenia i wyłączenia przeładowują na gorąco powierzchnie środowiska wykonawczego Plugin Gateway dla nowych tur agentów; instalacja żąda restartu Gateway, ponieważ moduły źródłowe Plugin uległy zmianie.

</Note>

## Uwagi o powierzchniach

<AccordionGroup>
  <Accordion title="Sesje według powierzchni">
    - **Polecenia tekstowe** działają w normalnej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogło przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W przeciwieństwie do normalnego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkrypcji,
- jest dostarczane jako bieżący wynik poboczny zamiast normalnej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz tymczasowego wyjaśnienia, podczas gdy główne zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
