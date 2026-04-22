---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie trasowania poleceń lub uprawnień
summary: 'Polecenia ukośnikowe: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-22T04:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia ukośnikowe

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`.
Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających tylko dyrektywy (wiadomość zawiera wyłącznie dyrektywy) są utrwalane w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    allowlista używana dla dyrektyw; w przeciwnym razie autoryzacja pochodzi z allowlist kanałów/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

Istnieje także kilka **skrótów inline** (tylko dla nadawców z allowlisty/autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim zobaczy je model, a pozostały tekst przechodzi dalej normalnym przepływem.

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

- `commands.text` (domyślnie `true`) włącza parsowanie `/...` w wiadomościach czatu.
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje natywne polecenia.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać per dostawca (bool lub `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy uruchomieniu. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje polecenia **Skill** natywnie tam, gdzie jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia oddzielnego polecenia ukośnikowego dla każdego Skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać per dostawca (bool lub `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) kontroluje, jak długo bash czeka przed przełączeniem do trybu tła (`0` przenosi do tła natychmiast).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis zarządzanej przez OpenClaw konfiguracji MCP w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status Plugin oraz sterowanie install + enable/disable).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko runtime).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzia restartu gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. Jest to oddzielne od `commands.allowFrom`.
- Per kanał `channels.<channel>.commands.enforceOwnerForCommands` (opcjonalne, domyślnie `false`) sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela** na tej powierzchni. Gdy ma wartość `true`, nadawca musi albo odpowiadać rozwiązanej kandydaturze właściciela (na przykład wpisowi w `commands.ownerAllowFrom` lub natywnym metadanym właściciela dostawcy), albo posiadać wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wildcard w kanale `allowFrom` lub pusta/nierozwiązana lista kandydatów właściciela **nie** wystarczają — polecenia tylko dla właściciela kończą się niepowodzeniem w trybie fail closed na tym kanale. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane tylko przez `ownerAllowFrom` i standardowe allowlisty poleceń.
- `commands.ownerDisplay` kontroluje, jak identyfikatory właściciela pojawiają się w prompt systemowym: `raw` lub `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia allowlistę per dostawca dla autoryzacji poleceń. Gdy jest skonfigurowane, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (allowlisty kanałów/parowanie i `commands.useAccessGroups`
  są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy mają pierwszeństwo.
- `commands.useAccessGroups` (domyślnie `true`) egzekwuje allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań `registerCommand()` Plugin
- rzeczywista dostępność na Twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału i zainstalowanych/włączonych Plugin

### Wbudowane polecenia core

Wbudowane polecenia dostępne dziś:

- `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i uruchamia ponownie wczytanie startup/promptu systemowego na miejscu.
- `/compact [instructions]` przeprowadza Compaction kontekstu sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` oraz `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania z wątkiem.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z własnymi poziomami takimi jak `xhigh`, `adaptive`, `max` lub binarne `on` tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
- `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb podwyższonych uprawnień. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla dostawców lub modele dla dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, z czego bieżący agent może teraz korzystać.
- `/status` pokazuje status runtime, w tym użycie/limit dostawcy, jeśli są dostępne.
- `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia Skill według nazwy.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekst.
- `/approve <id> <decision>` rozstrzyga monity zatwierdzeń exec.
- `/btw <question>` zadaje pytanie poboczne bez zmiany przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami sub-agentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami runtime.
- `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego lub wszystkie uruchomione sub-agenty.
- `/steer <id|#> <message>` wysyła sterowanie do uruchomionego sub-agenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje zarządzaną przez OpenClaw konfigurację serwera MCP w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan Plugin. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko runtime. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką użycia dla każdej odpowiedzi lub drukuje lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby to wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z Plugin kanałów z obsługą poleceń natywnych. Obecny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych Plugin

Dołączone Plugin mogą dodawać kolejne polecenia ukośnikowe. Obecne dołączone polecenia w tym repo:

- `/dreaming [on|off|status|help]` przełącza memory Dreaming. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzeń. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja wysokiego ryzyka polecenia phone node'a.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i steruje dołączoną uprzężą app-server Codex. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skill

Skills wywoływane przez użytkownika są także udostępniane jako polecenia ukośnikowe:

- `/skill <name> [input]` zawsze działa jako generyczny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy Skill/Plugin je zarejestruje.
- Rejestracja natywnych poleceń Skill jest sterowana przez `commands.nativeSkills` oraz `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełne rozbicie użycia dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
- W kanałach wielokontowych `config-targeted` `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` także respektują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` drukuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje Plugin co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację Plugin i może poprosić o restart.
- Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i poleceń natywnych; niedostępne jako tekst).
- Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają skutecznego włączenia wiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowanie runtime: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu trzymaj je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do Plugin i pozostawia wyłączony normalny szczegółowy szum narzędzi.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych wartości z konfiguracji.
- `/fast` jest zależne od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniany OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy ma to znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, wynik narzędzia lub diagnostykę Plugin, których nie zamierzałeś ujawniać. Preferuj pozostawienie ich wyłączonych, zwłaszcza w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, kolejne uruchomienie użyje go od razu.
- Jeśli uruchomienie już trwa, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje się do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub wynik odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub do następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z allowlisty są obsługiwane natychmiast (omijają kolejkę + model).
- **Ograniczanie grup na podstawie wzmianek:** wiadomości zawierające tylko polecenie od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko nadawcy z allowlisty):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` uruchamia odpowiedź statusu, a pozostały tekst przechodzi dalej normalnym przepływem.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.
- **Polecenia Skill:** Skills `user-invocable` są udostępniane jako polecenia ukośnikowe. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy numeryczne (np. `_2`).
  - `/skill <name> [input]` uruchamia Skill według nazwy (przydatne, gdy limity natywnych poleceń uniemożliwiają polecenia per Skill).
  - Domyślnie polecenia Skill są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie pytanie o konfigurację: **z czego ten agent może teraz korzystać w
tej konwersacji**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia, które są rzeczywiście osiągalne w runtime, w tym narzędzia core, podłączone
  narzędzia Plugin i narzędzia należące do kanału.

Do edycji profili i nadpisań używaj panelu Tools w interfejsie Control UI lub powierzchni config/catalog,
zamiast traktować `/tools` jak statyczny katalog.

## Powierzchnie użycia (co jest pokazywane gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe tylko z wartością pozostałą są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu plus etykietę planu oznaczoną modelem.
- **Linie tokenów/cache** w `/status` mogą wracać do najnowszego wpisu użycia w transkrypcie, gdy snapshot sesji live jest ubogi. Istniejące niezerowe wartości live nadal mają pierwszeństwo, a fallback do transkryptu może także odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisanych sum brakuje lub są mniejsze.
- **Tokeny/koszt dla każdej odpowiedzi** są sterowane przez `/usage off|tokens|full` (dołączane do normalnych odpowiedzi).
- `/model status` dotyczy **modeli/auth/endpointów**, a nie użycia.

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

- `/model` i `/model list` pokazują zwięzły, numerowany picker (rodzina modelu + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny picker z listami rozwijanymi dostawców i modeli oraz krokiem Submit.
- `/model <#>` wybiera z tego pickera (i preferuje bieżącego dostawcę, gdy to możliwe).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko w runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują nic do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z pliku na dysku.

## Wyjście trace Plugin

`/trace` pozwala przełączać **linie trace/debug Plugin ograniczone do sesji** bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan trace sesji.
- `/trace on` włącza linie trace Plugin dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie trace Plugin mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po normalnej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko runtime.
- `/trace` nie zastępuje `/verbose`; normalne szczegółowe wyjście narzędzi/statusu nadal należy do `/verbose`.

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

Uwagi:

- Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane.
- Aktualizacje `/config` utrzymują się po restartach.

## Aktualizacje MCP

`/mcp` zapisuje zarządzane przez OpenClaw definicje serwerów MCP pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery runtime decydują, które transporty są faktycznie wykonywalne.

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

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Plugin względem bieżącego workspace i konfiguracji z dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację Plugin; nie instaluje ani nie odinstalowuje Plugin.
- Po zmianach enable/disable zrestartuj gateway, aby je zastosować.

## Uwagi o powierzchniach

- **Polecenia tekstowe** działają w normalnej sesji czatu (prywatne wiadomości współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, dzięki czemu może przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` nadal jest obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnikowe Slack dla każdego wbudowanego polecenia (o tych samych nazwach co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Natywny wyjątek Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- działa jako oddzielne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast normalnej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe wyjaśnienie, podczas gdy główne
zadanie jest kontynuowane.

Przykład:

```text
/btw what are we doing right now?
```

Zobacz [BTW Side Questions](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX
klienta.
