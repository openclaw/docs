---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia ukośnikowe: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-08T06:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a7ee7f1a8012058279b9e632889b291d4e659e4ec81209ca8978afbb9ad4b96
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia ukośnikowe

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość rozpoczynająca się od `/`.
Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W normalnych wiadomościach czatu (niebędących wyłącznie dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
  - W wiadomościach składających się wyłącznie z dyrektyw (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i zwracają potwierdzenie.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    używana allowlista; w przeciwnym razie autoryzacja pochodzi z allowlist kanału/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jako zwykły tekst.

Istnieje także kilka **skrótów inline** (tylko dla nadawców z allowlisty / autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi dalej przez normalny przepływ.

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

- `commands.text` (domyślnie `true`) włącza analizowanie `/...` w wiadomościach czatu.
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz tę opcję na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje polecenia natywne.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez obsługi natywnej.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać to dla danego dostawcy (bool lub `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram podczas uruchamiania. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **skill**, jeśli są obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia ukośnikowego dla każdego skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać to dla danego dostawcy (bool lub `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) określa, jak długo bash czeka przed przełączeniem do trybu tła (`0` od razu przenosi do tła).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status pluginów oraz sterowanie instalacją i włączaniem/wyłączaniem).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko w czasie działania).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz działania narzędzia restartu gateway.
- `commands.ownerAllowFrom` (opcjonalnie) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. Jest to oddzielne od `commands.allowFrom`.
- `commands.ownerDisplay` kontroluje sposób wyświetlania identyfikatorów właściciela w system prompt: `raw` lub `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalnie) ustawia allowlistę dla każdego dostawcy na potrzeby autoryzacji poleceń. Gdy jest skonfigurowana, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (`commands.useAccessGroups`
  oraz allowlisty kanału/parowania są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawców ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) wymusza allowlisty/zasady dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Obecne źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań plugin `registerCommand()`
- rzeczywista dostępność na Twoim gateway nadal zależy od flag konfiguracyjnych, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia rdzenia

Wbudowane polecenia dostępne obecnie:

- `/new [model]` rozpoczyna nową sesję; `/reset` to alias resetowania.
- `/compact [instructions]` kompresuje kontekst sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania z wątkiem.
- `/think <off|minimal|low|medium|high|xhigh>` ustawia poziom myślenia. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
- `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla listę dostawców lub modeli dla dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
- `/status` pokazuje status środowiska uruchomieniowego, w tym użycie/limit dostawcy, gdy jest dostępne.
- `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia skill po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekst.
- `/approve <id> <decision>` rozwiązuje monity zatwierdzenia exec.
- `/btw <question>` zadaje pytanie poboczne bez zmiany przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
- `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla listę agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego lub wszystkich uruchomionych subagentów.
- `/steer <id|#> <message>` wysyła sterowanie do działającego subagenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginów. `/plugin` jest aliasem. Zapis tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w czasie działania. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką użycia dla każdej odpowiedzi lub wyświetla lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia zasady wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekst. Alias: `! <command>`. Wymaga `commands.bash: true` oraz allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z pluginów kanałów z obsługą poleceń natywnych. Obecny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych pluginów

Dołączone pluginy mogą dodawać kolejne polecenia ukośnikowe. Bieżące dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza śnienie pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Pairing](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. W Discord nazwa polecenia natywnego to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia skill

Skills wywoływane przez użytkownika są również udostępniane jako polecenia ukośnikowe:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy skill/plugin je rejestruje.
- natywna rejestracja poleceń skill jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby uzyskać pełny podział użycia dostawców, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanał `configWrites`.
- W kanałach wielokontowych polecenia `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` kierowane do konfiguracji również respektują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wyświetla lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację pluginu i może poprosić o restart.
- Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i poleceń natywnych; niedostępne jako tekst).
- Polecenia powiązań z wątkiem Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają skutecznie włączonych powiązań wątku (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowania środowiska uruchomieniowego: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych ustawień z konfiguracji.
- `/fast` jest zależne od dostawcy: OpenAI/OpenAI Codex mapują je do `service_tier=priority` na natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je do `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy są istotne, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
- `/reasoning` (oraz `/verbose`) są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne rozumowanie lub dane wyjściowe narzędzi, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, zwłaszcza w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu go użyje.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje się do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub odpowiedź wyjściowa już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające wyłącznie polecenia od nadawców z allowlisty są obsługiwane natychmiast (z pominięciem kolejki i modelu).
- **Bramkowanie wzmianek grupowych:** wiadomości zawierające wyłącznie polecenia od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko dla nadawców z allowlisty):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź statusu, a pozostały tekst przechodzi dalej przez normalny przepływ.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające wyłącznie polecenia są po cichu ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.
- **Polecenia skill:** skills `user-invocable` są udostępniane jako polecenia ukośnikowe. Nazwy są sanitizowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują numeryczne sufiksy (np. `_2`).
  - `/skill <name> [input]` uruchamia skill po nazwie (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia dla każdego skill).
  - Domyślnie polecenia skill są przekazywane do modelu jako normalne żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla dynamicznych opcji (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie dotyczące środowiska uruchomieniowego, a nie konfiguracji: **czego ten agent może użyć teraz
w tej rozmowie**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych, które obsługują argumenty, udostępniają ten sam przełącznik trybu jako `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia, które są faktycznie osiągalne w czasie działania, w tym narzędzia rdzenia, podłączone
  narzędzia pluginów i narzędzia należące do kanału.

Do edytowania profilu i nadpisań używaj panelu Tools w interfejsie Control UI lub powierzchni konfiguracji/katalogu,
zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co jest pokazywane gdzie)

- **Użycie/limit dostawcy** (na przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe zawierające tylko wartość pozostałą są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze token/cache** w `/status` mogą wracać do najnowszego wpisu użycia w transkrypcie, gdy migawka aktywnej sesji jest uboga. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a awaryjny odczyt z transkryptu może również odzyskać etykietę aktywnego modelu środowiska uruchomieniowego oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Tokeny/koszt dla każdej odpowiedzi** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
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

- `/model` i `/model list` pokazują zwięzły, numerowany selektor (rodzina modeli + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz etapem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawić nadpisania konfiguracji **tylko w czasie działania** (pamięć, nie dysk). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują się do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.

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
- Aktualizacje `/config` są trwałe po restarcie.

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
- Adaptery środowiska uruchomieniowego decydują, które transporty są faktycznie wykonywalne.

## Aktualizacje pluginów

`/plugins` pozwala operatorom sprawdzać wykryte pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego workspace i konfiguracji na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginu; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach enable/disable uruchom ponownie gateway, aby je zastosować.

## Uwagi dotyczące powierzchni

- **Polecenia tekstowe** działają w normalnej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowany przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
- **`/stop`** kieruje się do aktywnej sesji czatu, aby mogło przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnikowe Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.
- **BTW pytania poboczne**

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W odróżnieniu od zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne wywołanie jednorazowe **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne
zadanie jest kontynuowane.

Przykład:

```text
/btw what are we doing right now?
```

Pełny opis zachowania i UX klienta znajdziesz w [BTW Side Questions](/pl/tools/btw).
