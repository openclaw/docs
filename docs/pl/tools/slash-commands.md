---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia slash: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia slash
x-i18n:
    generated_at: "2026-04-24T09:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`.
Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (nie będących wyłącznie dyrektywami) są traktowane jako „inline hints” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane do sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    allowlista używana; w przeciwnym razie autoryzacja pochodzi z allowlist kanałów/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje też kilka **skrótów inline** (tylko dla nadawców z allowlisty / autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim wiadomość zobaczy model, a pozostały tekst przechodzi dalej normalnym przepływem.

## Config

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

- `commands.text` (domyślnie `true`) włącza parsowanie `/...` w wiadomościach czatu.
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje natywne polecenia.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń slash); ignorowane dla dostawców bez natywnej obsługi.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać per dostawca (bool albo `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy starcie. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skill**, gdy jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia slash dla każdego Skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać per dostawca (bool albo `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń shella hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) kontroluje, jak długo bash czeka przed przełączeniem się do trybu tła (`0` natychmiast przenosi do tła).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status Pluginów plus kontrolki install + enable/disable).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko w runtime).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzia restartu gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. Jest to oddzielne od `commands.allowFrom`.
- Per kanał `channels.<channel>.commands.enforceOwnerForCommands` (opcjonalne, domyślnie `false`) powoduje, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby uruchomić je na tej powierzchni. Gdy ma wartość `true`, nadawca musi albo pasować do rozpoznanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnych metadanych właściciela dostawcy), albo posiadać wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wildcard w kanale `allowFrom` albo pusta / nierozpoznana lista kandydatów właściciela **nie** jest wystarczająca — polecenia tylko dla właściciela kończą się niepowodzeniem w trybie fail-closed na tym kanale. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były bramkowane jedynie przez `ownerAllowFrom` i standardowe allowlisty poleceń.
- `commands.ownerDisplay` kontroluje, jak identyfikatory właściciela pojawiają się w prompcie systemowym: `raw` albo `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia allowlistę per dostawca dla autoryzacji poleceń. Gdy jest skonfigurowane, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (`commands.useAccessGroups`
  oraz allowlisty kanałów/parowanie są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) egzekwuje allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Bieżące źródło prawdy:

- wbudowane polecenia core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Pluginów pochodzą z wywołań Pluginu `registerCommand()`
- rzeczywista dostępność na twoim gateway nadal zależy od flag config, powierzchni kanału i zainstalowanych/włączonych Pluginów

### Wbudowane polecenia core

Wbudowane polecenia dostępne obecnie:

- `/new [model]` rozpoczyna nową sesję; `/reset` to alias resetu.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startup/system-prompt in-place.
- `/compact [instructions]` wykonuje Compaction kontekstu sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżący przebieg.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem wiązania wątku.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z niestandardowymi poziomami takimi jak `xhigh`, `adaptive`, `max` albo binarnym `on` tylko tam, gdzie jest to obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza verbose output. Alias: `/v`.
- `/trace on|off` przełącza trace output Pluginów dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje albo ustawia fast mode.
- `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje albo ustawia wartości domyślne exec.
- `/model [name|#|status]` pokazuje albo ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla dostawców albo modele danego dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może używać teraz.
- `/status` pokazuje status runtime, w tym etykiety `Runtime`/`Runner` oraz użycie/kwotę dostawcy, gdy są dostępne.
- `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/export-trajectory [path]` eksportuje [trajectory bundle](/pl/tools/trajectory) JSONL dla bieżącej sesji. Alias: `/trajectory`.
- `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia Skill po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekstowe.
- `/approve <id> <decision>` rozstrzyga prompty zatwierdzeń exec.
- `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza przebiegami sub-agentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami runtime.
- `/focus <target>` wiąże bieżący wątek Discord albo temat/rozmowę Telegram z celem sesji.
- `/unfocus` usuwa bieżące wiązanie.
- `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego albo wszystkich działających sub-agentów.
- `/steer <id|#> <message>` wysyła steering do działającego sub-agenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje albo zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje albo zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw pod `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza albo modyfikuje stan Pluginów. `/plugin` to alias. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami config tylko w runtime. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką użycia per odpowiedź albo wypisuje lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie shella hosta. Tylko tekstowe. Alias: `! <command>`. Wymaga `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash działające w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z Pluginów kanałów z obsługą natywnych poleceń. Bieżący dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych Pluginów

Dołączone Pluginy mogą dodawać kolejne polecenia slash. Bieżące dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia node telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety rich card LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i steruje dołączonym harnessem Codex app-server. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skill

Skills wywoływane przez użytkownika są również udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako generyczny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia takie jak `/prose`, gdy rejestruje je Skill/Plugin.
- natywna rejestracja poleceń Skill jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (fuzzy match); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełny podział użycia dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
- W kanałach wielokontowych polecenia `/allowlist --account <id>` skierowane do konfiguracji oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` docelowego konta.
- `/usage` steruje stopką użycia per odpowiedź; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje Pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm albo `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację Pluginów i może wyświetlić prompt o restart.
- Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i natywnych poleceń; niedostępne jako tekst).
- Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają, aby skuteczne wiązania wątków były włączone (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja polecenia ACP i zachowanie runtime: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Pluginów linie trace/debug i pozostawia wyłączony zwykły verbose chatter narzędzi.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w Sessions UI, aby je wyczyścić i wrócić do wartości domyślnych config.
- `/fast` jest specyficzne dla dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` na natywnych punktach końcowych Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy mają znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne reasoning, wyniki narzędzi albo diagnostykę Pluginów, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, zwłaszcza w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następny przebieg użyje go od razu.
- Jeśli przebieg jest już aktywny, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie retry.
- Jeśli aktywność narzędzia albo wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji retry albo do następniej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z allowlisty są obsługiwane natychmiast (z pominięciem kolejki + modelu).
- **Bramkowanie wzmianek grupowych:** wiadomości zawierające tylko polecenie od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko nadawcy z allowlisty):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wyzwala odpowiedź statusu, a pozostały tekst przechodzi dalej normalnym przepływem.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia Skill:** Skills `user-invocable` są udostępniane jako polecenia slash. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają numeryczne sufiksy (np. `_2`).
  - `/skill <name> [input]` uruchamia Skill po nazwie (przydatne, gdy limity natywnych poleceń uniemożliwiają polecenia per Skill).
  - Domyślnie polecenia Skill są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty natywnych poleceń:** Discord używa autocomplete dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie konfiguracyjne: **czego ten agent może używać teraz
w tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie natywnych poleceń, które obsługują argumenty, udostępniają ten sam przełącznik trybu jako `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy albo modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia rzeczywiście osiągalne w runtime, w tym narzędzia core, podłączone
  narzędzia Pluginów i narzędzia należące do kanałów.

Do edycji profili i nadpisań używaj panelu Tools w Control UI albo powierzchni config/katalogu, zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co gdzie się pokazuje)

- **Użycie/kwota dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do postaci `% left`; dla MiniMax pola procentowe oznaczające tylko pozostałą wartość są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Linie token/cache** w `/status` mogą wracać do najnowszego wpisu użycia z transkryptu, gdy aktywny snapshot sesji jest ubogi. Istniejące niezerowe wartości aktywne nadal wygrywają, a fallback transkryptu może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są nieobecne lub mniejsze.
- **Runtime vs runner:** `/status` raportuje `Runtime` dla skutecznej ścieżki wykonania i stanu sandboxa oraz `Runner` dla tego, kto faktycznie uruchamia sesję: osadzonego Pi, dostawcy opartego na CLI albo harness/backend ACP.
- **Tokeny/koszt per odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/auth/punktów końcowych**, a nie użycia.

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

- `/model` i `/model list` pokazują zwarty, numerowany wybierak (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny wybierak z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego wybieraka (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Debug overrides

`/debug` pozwala ustawiać nadpisania config **tylko w runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania są stosowane natychmiast do nowych odczytów config, ale **nie** zapisują się do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do config na dysku.

## Plugin trace output

`/trace` pozwala przełączać **linie trace/debug Pluginów ograniczone do sesji** bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan trace sesji.
- `/trace on` włącza linie trace Pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie trace Pluginów mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami config tylko w runtime.
- `/trace` nie zastępuje `/verbose`; zwykłe verbose output narzędzi/statusu nadal należy do `/verbose`.

## Aktualizacje Config

`/config` zapisuje do config na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.config: true`.

Przykłady:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Uwagi:

- Config jest walidowany przed zapisem; nieprawidłowe zmiany są odrzucane.
- Aktualizacje `/config` utrzymują się po restartach.

## Aktualizacje MCP

`/mcp` zapisuje definicje serwerów MCP zarządzanych przez OpenClaw pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` przechowuje config w config OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery runtime decydują, które transporty są faktycznie wykonywalne.

## Aktualizacje Pluginów

`/plugins` pozwala operatorom sprawdzać wykryte Pluginy i przełączać włączenie w config. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Pluginów względem bieżącego obszaru roboczego oraz config na dysku.
- `/plugins enable|disable` aktualizuje tylko config Pluginów; nie instaluje ani nie odinstalowuje Pluginów.
- Po zmianach enable/disable zrestartuj gateway, aby je zastosować.

## Uwagi o powierzchniach

- **Polecenia tekstowe** działają w zwykłej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (kieruje na sesję czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, aby móc przerwać bieżący przebieg.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W odróżnieniu od zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane do historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe wyjaśnienie, podczas gdy główne
zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
```

Pełne zachowanie i szczegóły UX klientów znajdziesz w [Pytania poboczne BTW](/pl/tools/btw).

## Powiązane

- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
- [Tworzenie Skills](/pl/tools/creating-skills)
