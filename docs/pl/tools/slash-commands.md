---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia ukośnikowe: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-21T10:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia ukośnikowe

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`.
Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z `/bash <cmd>` jako aliasem).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych/pairing kanału oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

Istnieje także kilka **skrótów inline** (tylko dla nadawców z listy dozwolonych/autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Są uruchamiane natychmiast, usuwane, zanim wiadomość zobaczy model, a pozostały tekst przechodzi dalej normalnym przepływem.

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
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę opcję na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje polecenia natywne.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz slash commands); ignorowane dla dostawców bez wsparcia natywnego.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać to per dostawca (bool lub `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy uruchomieniu. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skills**, gdy jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia jednego slash command dla każdej Skills).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać to per dostawca (bool lub `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) kontroluje, jak długo bash czeka przed przełączeniem w tryb tła (`0` natychmiast przenosi do tła).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status pluginów oraz instalacja i sterowanie włączaniem/wyłączaniem).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko w czasie działania).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzi restartu Gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną listę dozwolonych właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. To jest oddzielne od `commands.allowFrom`.
- `commands.ownerDisplay` określa, jak identyfikatory właściciela pojawiają się w system prompt: `raw` lub `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia listę dozwolonych per dostawca dla autoryzacji poleceń. Gdy jest skonfigurowane, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (`commands.useAccessGroups`
  oraz listy dozwolonych/pairing kanału są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- generowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań plugin `registerCommand()`
- rzeczywista dostępność w Twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału i zainstalowanych/włączonych pluginów

### Wbudowane polecenia rdzenia

Wbudowane polecenia dostępne obecnie:

- `/new [model]` rozpoczyna nową sesję; `/reset` to alias resetowania.
- `/compact [instructions]` wykonuje Compaction kontekstu sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` oraz `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania z wątkiem.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z niestandardowymi poziomami takimi jak `xhigh`, `adaptive`, `max` lub binarnym `on` tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/trace on|off` przełącza wyjście śledzenia pluginów dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
- `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla listę dostawców lub modeli dla dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) wraz z opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz używać.
- `/status` pokazuje stan czasu działania, w tym użycie/limit dostawcy, gdy jest dostępny.
- `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia Skills po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekstowe.
- `/approve <id> <decision>` rozstrzyga prośby o zatwierdzenie exec.
- `/btw <question>` zadaje poboczne pytanie bez zmieniania przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami podagentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami czasu działania.
- `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla listę agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa działanie jednego lub wszystkich podagentów.
- `/steer <id|#> <message>` wysyła sterowanie do działającego podagenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginów. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w czasie działania. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` kontroluje stopkę użycia dla każdej odpowiedzi lub wyświetla lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowe. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z pluginów kanałów z obsługą poleceń natywnych. Aktualny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych pluginów

Dołączone pluginy mogą dodawać więcej poleceń ukośnikowych. Aktualne dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem pairing/konfiguracji urządzenia. Zobacz [Pairing](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia node telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i kontroluje dołączoną uprząż app-server Codex. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są także udostępniane jako polecenia ukośnikowe:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą także pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy rejestruje je Skills/plugin.
- Natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (na przykład `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby uzyskać pełny podział użycia według dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje `configWrites` kanału.
- W kanałach z wieloma kontami polecenia `/allowlist --account <id>` ukierunkowane na konfigurację oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` docelowego konta.
- `/usage` kontroluje stopkę użycia dla każdej odpowiedzi; `/usage cost` wyświetla lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację pluginów i może poprosić o restart.
- Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i poleceń natywnych; niedostępne jako tekst).
- Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączonych efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowanie w czasie działania: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
- `/trace` ma węższy zakres niż `/verbose`: ujawnia tylko linie śledzenia/debug należące do pluginów i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
- `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi nadal są pokazywane, gdy ma to znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne reasoning, wyjście narzędzi lub diagnostykę pluginów, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, szczególnie w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje się do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub do następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
- **Bramkowanie wzmianek w grupie:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
- **Skróty inline (tylko dla nadawców z listy dozwolonych):** niektóre polecenia działają także po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź statusu, a pozostały tekst przechodzi dalej normalnym przepływem.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające wyłącznie polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia Skills:** Skills typu `user-invocable` są udostępniane jako polecenia ukośnikowe. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy numeryczne (na przykład `_2`).
  - `/skill <name> [input]` uruchamia Skills po nazwie (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia per Skills).
  - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie o czas działania, a nie na pytanie o konfigurację: **czego ten agent może użyć teraz
w tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych, które obsługują argumenty, udostępniają ten sam przełącznik trybu jako `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia, które są faktycznie osiągalne w czasie działania, w tym narzędzia rdzenia, podłączone
  narzędzia pluginów i narzędzia należące do kanału.

Do edytowania profili i nadpisań użyj panelu Tools w interfejsie Control lub powierzchni config/catalog, zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (na przykład „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe typu remaining-only są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Linie token/cache** w `/status` mogą wracać do ostatniego wpisu użycia z transkryptu, gdy migawka sesji na żywo jest uboga. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a fallback do transkryptu może również odzyskać etykietę aktywnego modelu czasu działania oraz większą sumę zorientowaną na prompt, gdy zapisane sumy nie istnieją lub są mniejsze.
- **Tokeny/koszt dla każdej odpowiedzi** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
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

- `/model` i `/model list` pokazują zwarty, numerowany selektor (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko w czasie działania** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

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
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.

## Wyjście śledzenia pluginów

`/trace` pozwala przełączać **ograniczone do sesji linie śledzenia/debug pluginów** bez włączania pełnego trybu verbose.

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
- Linie śledzenia pluginów mogą pojawiać się w `/status` oraz jako diagnostyczna wiadomość uzupełniająca po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko w czasie działania.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe wyjście narzędzi/statusu nadal należy do `/verbose`.

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
- Aktualizacje `/config` są trwałe po restartach.

## Aktualizacje MCP

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` zapisuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery czasu działania decydują, które transporty są faktycznie wykonywalne.

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

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego obszaru roboczego oraz konfiguracji na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach enable/disable uruchom ponownie gateway, aby je zastosować.

## Uwagi dotyczące powierzchni

- **Polecenia tekstowe** działają w normalnej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
- **`/stop`** jest kierowane do aktywnej sesji czatu, aby mogło przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnikowe Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek dla poleceń natywnych Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Poboczne pytania BTW

`/btw` to szybkie **poboczne pytanie** dotyczące bieżącej sesji.

W odróżnieniu od zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne
zadanie jest kontynuowane.

Przykład:

```text
/btw co teraz robimy?
```

Zobacz [BTW Side Questions](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.
