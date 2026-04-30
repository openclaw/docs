---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia z ukośnikiem: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-04-30T10:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja lub wątek jest powiązany z sesją ACP, zwykły tekst kontynuacji trafia do tego harnessu ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do procedury obsługi poleceń OpenClaw ACP, a `/status` oraz `/unfocus` pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla danej powierzchni.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W zwykłych wiadomościach czatu (niebędących wyłącznie dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i powodują odpowiedź z potwierdzeniem.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych/parowania kanału oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Skróty inline">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Są uruchamiane natychmiast, usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi dalej przez normalny przepływ.

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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez poleceń natywnych (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę opcję na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla danego dostawcy (wartość logiczna albo `"auto"`). `false` czyści wcześniej zarejestrowane polecenia w Discord/Telegram podczas uruchamiania. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia **Skills** natywnie, gdy jest to obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdego Skills). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla danego dostawcy (wartość logiczna albo `"auto"`).
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
  Dla kanału: sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby można je było uruchomić na tej powierzchni. Gdy wartość to `true`, nadawca musi albo pasować do rozpoznanego kandydata na właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanale `allowFrom` lub pusta/nierozpoznana lista kandydatów na właściciela **nie** wystarcza — polecenia tylko dla właściciela na tym kanale zawodzą w trybie zamkniętym. Pozostaw tę opcję wyłączoną, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje, jak identyfikatory właścicieli pojawiają się w prompcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla autoryzacji poleceń, osobna dla każdego dostawcy. Po skonfigurowaniu jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych/parowanie kanału oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Bieżące źródło prawdy:

- wbudowane elementy core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań Plugin `registerCommand()`
- rzeczywista dostępność w twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Plugin

### Wbudowane polecenia core

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` uruchamia nową sesję; `/reset` jest aliasem resetu.
    - `/reset soft [message]` zachowuje bieżący transkrypt, odrzuca ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startowe/promptu systemowego w miejscu.
    - `/compact [instructions]` kompresuje kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` prosi o zatwierdzenie exec, a następnie eksportuje pakiet JSONL [trajectory bundle](/pl/tools/trajectory) dla bieżącej sesji. Użyj go, gdy potrzebujesz osi czasu promptu, narzędzi i transkryptu dla jednej sesji OpenClaw. W czatach grupowych prompt zatwierdzenia i wynik eksportu trafiają prywatnie do właściciela. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model i kontrolki uruchomienia">
    - `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a poziomy niestandardowe, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla skonfigurowanych/dostępnych po uwierzytelnieniu dostawców albo modele dla dostawcy; dodaj `all`, aby przeglądać pełny katalog tego dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, starsze `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) oraz opcjami takimi jak `debounce:0.5s cap:25 drop:summarize`; `/queue default` lub `/queue reset` czyści nadpisanie sesji. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz używać.
    - `/status` pokazuje status wykonania/czasu działania, w tym etykiety `Execution`/`Runtime` oraz użycie/limit dostawcy, gdy są dostępne.
    - `/diagnostics [note]` to przepływ raportu wsparcia tylko dla właściciela dotyczący błędów Gateway i uruchomień harnessu Codex. Za każdym razem prosi o jawne zatwierdzenie exec przed uruchomieniem `openclaw gateway diagnostics export --json`; nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu wysyła raport gotowy do wklejenia, zawierający lokalną ścieżkę pakietu, podsumowanie manifestu, uwagi dotyczące prywatności i odpowiednie identyfikatory sesji. W czatach grupowych prompt zatwierdzenia i raport trafiają prywatnie do właściciela. Gdy aktywna sesja używa harnessu OpenAI Codex, to samo zatwierdzenie wysyła też odpowiednie informacje zwrotne Codex na serwery OpenAI, a ukończona odpowiedź wymienia identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz polecenia `codex resume <thread-id>`. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics).
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` kontroluje stopkę użycia dla każdej odpowiedzi albo wypisuje lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia Skills według nazwy.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekstowo.
    - `/approve <id> <decision>` rozwiązuje prompty zatwierdzania exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami czasu działania.
    - `/focus <target>` wiąże bieżący wątek Discord albo temat/konwersację Telegram z docelową sesją.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
    - `/steer <id|#> <message>` wysyła sterowanie do działającego subagenta. Alias: `/tell`.

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzanego przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginu. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza wyłącznie runtime’owymi nadpisaniami konfiguracji. Tylko dla właściciela. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
    - `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.

  </Accordion>
  <Accordion title="Głos, TTS, sterowanie kanałem">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupowej.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list zezwoleń `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash działające w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi bieżącej sesji na inny połączony
kanał. Zobacz [Dokowanie kanałów](/pl/concepts/channel-docking), aby poznać konfigurację,
przykłady i rozwiązywanie problemów.

Polecenia dokowania są generowane z pluginów kanałów z obsługą poleceń natywnych. Obecny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Używaj poleceń dokowania z czatu bezpośredniego, aby przełączyć trasę odpowiedzi bieżącej sesji na inny połączony kanał. Agent zachowuje ten sam kontekst sesji, ale przyszłe odpowiedzi dla tej sesji są dostarczane do wybranego peera kanału.

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i peer docelowy muszą być w tej samej grupie tożsamości, na przykład `["telegram:123", "discord:456"]`. Jeśli użytkownik Telegram o identyfikatorze `123` wyśle `/dock_discord`, OpenClaw zapisuje `lastChannel: "discord"` i `lastTo: "456"` w aktywnej sesji. Jeśli nadawca nie jest połączony z peerem Discord, polecenie odpowiada wskazówką konfiguracji zamiast przejść do normalnego czatu.

Dokowanie zmienia tylko trasę aktywnej sesji. Nie tworzy kont kanałów, nie przyznaje dostępu, nie omija list zezwoleń kanałów ani nie przenosi historii transkrypcji do innej sesji. Użyj `/dock-telegram`, `/dock-slack`, `/dock-mattermost` lub innego wygenerowanego polecenia dokowania, aby ponownie przełączyć trasę.

### Dołączone polecenia pluginów

Dołączone pluginy mogą dodawać więcej poleceń slash. Obecne dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzeń. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety rozbudowanych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` sprawdza i steruje dołączoną uprzężą serwera aplikacji Codex. Zobacz [Uprząż Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są również udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy rejestruje je skill/plugin.
- natywna rejestracja poleceń Skills jest sterowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Uwagi dotyczące argumentów i parsera">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę providera (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - Aby uzyskać pełne zestawienie użycia providera, użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje `configWrites` kanału.
    - W kanałach z wieloma kontami `/allowlist --account <id>` skierowane do konfiguracji oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
    - `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: ścieżkę lokalną/archiwum, pakiet npm lub `clawhub:<pkg>`.
    - `/plugins enable|disable` aktualizuje konfigurację pluginów i może poprosić o restart.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga serwera i wybranego kanału głosowego/scenicznego. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowanie runtime: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / bezpieczeństwo reasoning">
    - `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko wiersze trace/debug należące do pluginu i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w UI Sessions, aby je wyczyścić i wrócić do domyślnych wartości konfiguracji.
    - `/fast` zależy od providera: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi nadal są pokazywane, gdy są istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wynik narzędzia lub diagnostykę pluginu, których nie zamierzano ujawniać. Najlepiej pozostawić je wyłączone, szczególnie w czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modeli">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu go użyje.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu tylko w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wynik odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca ze zwykłego TUI agenta do Crestodian. Jest to odrębne od trybu ratunkowego kanału wiadomości i nie przyznaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z listy zezwoleń są obsługiwane natychmiast (omijają kolejkę i model).
    - **Bramkowanie wzmianki w grupie:** wiadomości zawierające tylko polecenie od nadawców z listy zezwoleń omijają wymagania wzmianki.
    - **Skróty w treści (tylko nadawcy z listy zezwoleń):** niektóre polecenia działają także wtedy, gdy są osadzone w normalnej wiadomości, i są usuwane, zanim model zobaczy pozostały tekst.
      - Przykład: `hey /status` wyzwala odpowiedź statusu, a pozostały tekst przechodzi przez normalny przepływ.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny `/...` w treści są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia Skills i natywne argumenty">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako polecenia slash. Nazwy są oczyszczane do `a-z0-9_` (maks. 32 znaki); kolizje dostają sufiksy liczbowe (np. `_2`).
      - `/skill <name> [input]` uruchamia skill według nazwy (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla poszczególnych Skills).
      - Domyślnie polecenia Skills są przekazywane do modelu jako normalne żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby przekierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a argument zostanie pominięty. Wybory dynamiczne są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie pytanie o konfigurację: **czego ten agent może użyć teraz w tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu co `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wynik.
- `/tools` zawiera narzędzia faktycznie osiągalne w runtime, w tym narzędzia core, połączone narzędzia pluginów i narzędzia należące do kanału.

Do edycji profilu i nadpisań użyj panelu Tools w Control UI albo powierzchni konfiguracji/katalogu zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co gdzie się pokazuje)

- **Użycie/limit providera** (przykład: „Claude 80% left”) pojawia się w `/status` dla providera bieżącego modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna providerów do `% left`; dla MiniMax pola procentowe z samą pozostałą wartością są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze tokenów/cache** w `/status` mogą wrócić do najnowszego wpisu użycia transkrypcji, gdy bieżący snapshot sesji jest skąpy. Istniejące niezerowe wartości bieżące nadal wygrywają, a fallback transkrypcji może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Wykonanie vs runtime:** `/status` raportuje `Execution` dla efektywnej ścieżki sandboxa oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt dla każdej odpowiedzi** są sterowane przez `/usage off|tokens|full` (dołączane do normalnych odpowiedzi).
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

- `/model` i `/model list` pokazują zwarty, numerowany selektor (rodzina modelu + dostępni providerzy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi providera i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i preferuje bieżącego providera, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint providera (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać nadpisania konfiguracji działające **tylko w czasie wykonywania** (w pamięci, nie na dysku). Tylko właściciel. Domyślnie wyłączone; włącz za pomocą `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast przy nowych odczytach konfiguracji, ale **nie** są zapisywane do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji zapisanej na dysku.
</Note>

## Dane wyjściowe śladu pluginów

`/trace` pozwala przełączać **wiersze śladu/debugowania pluginów ograniczone do sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śladu sesji.
- `/trace on` włącza wiersze śladu pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Wiersze śladu pluginów mogą pojawiać się w `/status` oraz jako dodatkowy komunikat diagnostyczny po normalnej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji działającymi tylko w czasie wykonywania.
- `/trace` nie zastępuje `/verbose`; normalne szczegółowe dane wyjściowe narzędzi/statusu nadal należą do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje konfigurację na dysku (`openclaw.json`). Tylko właściciel. Domyślnie wyłączone; włącz za pomocą `commands.config: true`.

Przykłady:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` utrzymują się po ponownym uruchomieniu.
</Note>

## Aktualizacje MCP

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko właściciel. Domyślnie wyłączone; włącz za pomocą `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi. Adaptery czasu wykonywania decydują, które transporty są faktycznie wykonywalne.
</Note>

## Aktualizacje pluginów

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
- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego obszaru roboczego oraz konfiguracji zapisanej na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach włączenia/wyłączenia uruchom ponownie Gateway, aby je zastosować.

</Note>

## Uwagi dotyczące powierzchni

<AccordionGroup>
  <Accordion title="Sesje na powierzchnię">
    - **Polecenia tekstowe** działają w normalnej sesji czatu (wiadomości prywatne współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby mogło przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co w `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W odróżnieniu od normalnego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako oddzielne, jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkrypcji,
- jest dostarczane jako wynik poboczny na żywo zamiast normalnej wiadomości asystenta.

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
