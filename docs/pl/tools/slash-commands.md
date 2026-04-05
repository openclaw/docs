---
read_when:
    - Używasz lub konfigurujesz polecenia czatu
    - Debugujesz routing poleceń lub uprawnienia
summary: 'Polecenia slash: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia slash
x-i18n:
    generated_at: "2026-04-05T14:10:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia slash

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`.
Polecenie czatu bash działające tylko na hoście używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (niebędących wyłącznie dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    allowlista używana dla dyrektyw i poleceń; w przeciwnym razie autoryzacja pochodzi z allowlist kanałów/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje też kilka **skrótów inline** (tylko dla nadawców z allowlisty / autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane przed pokazaniem wiadomości modelowi, a pozostały tekst przechodzi dalej zwykłym przepływem.

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
    restart: false,
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
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slacka (dopóki nie dodasz poleceń slash); ignorowane dla dostawców bez natywnego wsparcia.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać to dla dostawcy (bool lub `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy starcie. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skills**, gdy jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slacka (Slack wymaga utworzenia jednego polecenia slash dla każdego Skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać to dla dostawcy (bool lub `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` to alias; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) określa, jak długo bash czeka przed przejściem do trybu tła (`0` od razu uruchamia w tle).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis zarządzanej przez OpenClaw konfiguracji MCP pod `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status pluginów oraz sterowanie install + enable/disable).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko runtime).
- `commands.allowFrom` (opcjonalnie) ustawia allowlistę dla autoryzacji poleceń zależną od dostawcy. Gdy jest skonfigurowane, jest to
  jedyne źródło autoryzacji dla dyrektyw i poleceń (`commands.useAccessGroups`
  oraz allowlisty kanałów/parowanie są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) wymusza allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Tekstowe + natywne (gdy włączone):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (pokaż, czego bieżący agent może teraz używać; `verbose` dodaje opisy)
- `/skill <name> [input]` (uruchom Skill po nazwie)
- `/status` (pokaż bieżący status; obejmuje użycie/kwotę dostawcy dla bieżącego dostawcy modelu, gdy dostępne)
- `/tasks` (wyświetl zadania w tle dla bieżącej sesji; pokazuje aktywne i ostatnie szczegóły zadań wraz z lokalnymi dla agenta licznikami fallback)
- `/allowlist` (wyświetlanie/dodawanie/usuwanie wpisów allowlisty)
- `/approve <id> <decision>` (rozstrzyganie promptów zatwierdzeń exec; użyj wiadomości oczekującego zatwierdzenia, aby zobaczyć dostępne decyzje)
- `/context [list|detail|json]` (wyjaśnia „context”; `detail` pokazuje rozmiar dla każdego pliku + narzędzia + Skill + system prompt)
- `/btw <question>` (zadaj efemeryczne pytanie poboczne o bieżącą sesję bez zmiany przyszłego kontekstu sesji; zobacz [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (eksport bieżącej sesji do HTML z pełnym system prompt)
- `/whoami` (pokaż id nadawcy; alias: `/id`)
- `/session idle <duration|off>` (zarządzanie automatycznym odfokusowaniem po bezczynności dla wiązań skoncentrowanych wątków)
- `/session max-age <duration|off>` (zarządzanie twardym automatycznym odfokusowaniem po maksymalnym wieku dla wiązań skoncentrowanych wątków)
- `/subagents list|kill|log|info|send|steer|spawn` (inspekcja, sterowanie lub uruchamianie podagentów dla bieżącej sesji)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspekcja i sterowanie sesjami runtime ACP)
- `/agents` (wyświetlanie agentów związanych z wątkiem dla tej sesji)
- `/focus <target>` (Discord: powiąż ten wątek lub nowy wątek z celem sesji/podagenta)
- `/unfocus` (Discord: usuń bieżące powiązanie wątku)
- `/kill <id|#|all>` (natychmiast przerwij jednego lub wszystkich działających podagentów dla tej sesji; bez komunikatu potwierdzającego)
- `/steer <id|#> <message>` (natychmiast steruj działającym podagentem: w trakcie działania, gdy to możliwe, w przeciwnym razie przerwij bieżącą pracę i uruchom ponownie z komunikatem sterującym)
- `/tell <id|#> <message>` (alias dla `/steer`)
- `/config show|get|set|unset` (utrwalanie konfiguracji na dysku, tylko dla właściciela; wymaga `commands.config: true`)
- `/mcp show|get|set|unset` (zarządzanie konfiguracją serwera MCP zarządzaną przez OpenClaw, tylko dla właściciela; wymaga `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (inspekcja wykrytych pluginów, instalowanie nowych i przełączanie ich włączenia; zapis tylko dla właściciela; wymaga `commands.plugins: true`)
  - `/plugin` jest aliasem dla `/plugins`.
  - `/plugin install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
  - Zapis enable/disable nadal odpowiada wskazówką o restarcie. W obserwowanym gateway uruchomionym na pierwszym planie OpenClaw może wykonać ten restart automatycznie zaraz po zapisie.
- `/debug show|set|unset|reset` (nadpisania runtime, tylko dla właściciela; wymaga `commands.debug: true`)
- `/usage off|tokens|full|cost` (stopka użycia dla każdej odpowiedzi lub lokalne podsumowanie kosztów)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (sterowanie TTS; zobacz [/tts](/tools/tts))
  - Discord: natywne polecenie to `/voice` (Discord rezerwuje `/tts`); tekstowe `/tts` nadal działa.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (przełącz odpowiedzi na Telegram)
- `/dock-discord` (alias: `/dock_discord`) (przełącz odpowiedzi na Discord)
- `/dock-slack` (alias: `/dock_slack`) (przełącz odpowiedzi na Slack)
- `/activation mention|always` (tylko grupy)
- `/send on|off|inherit` (tylko dla właściciela)
- `/reset` lub `/new [model]` (opcjonalna wskazówka modelu; reszta jest przekazywana dalej)
- `/think <off|minimal|low|medium|high|xhigh>` (dynamiczne wybory według modelu/dostawcy; aliasy: `/thinking`, `/t`)
- `/fast status|on|off` (pominięcie argumentu pokazuje bieżący efektywny stan fast-mode)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; gdy włączone, wysyła osobną wiadomość z prefiksem `Reasoning:`; `stream` = tylko szkic Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` pomija zatwierdzenia exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (wyślij `/exec`, aby zobaczyć bieżący stan)
- `/model <name>` (alias: `/models`; albo `/<alias>` z `agents.defaults.models.*.alias`)
- `/queue <mode>` (plus opcje takie jak `debounce:2s cap:25 drop:summarize`; wyślij `/queue`, aby zobaczyć bieżące ustawienia)
- `/bash <command>` (tylko host; alias dla `! <command>`; wymaga `commands.bash: true` + allowlist `tools.elevated`)
- `/dreaming [off|core|rem|deep|status|help]` (przełącz tryb dreaming lub pokaż status; zobacz [Dreaming](/concepts/memory-dreaming))

Tylko tekstowe:

- `/compact [instructions]` (zobacz [/concepts/compaction](/concepts/compaction))
- `! <command>` (tylko host; po jednym naraz; używaj `!poll` + `!stop` dla długotrwałych zadań)
- `!poll` (sprawdź dane wyjściowe / status; akceptuje opcjonalne `sessionId`; `/bash poll` też działa)
- `!stop` (zatrzymaj działające zadanie bash; akceptuje opcjonalne `sessionId`; `/bash stop` też działa)

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie rozmyte); jeśli nic nie pasuje, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełny rozkład użycia dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i honoruje kanałowe `configWrites`.
- W kanałach z wieloma kontami ukierunkowane na konfigurację `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` także honorują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i natywnych poleceń; niedostępne jako tekst).
- Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączonych efektywnych wiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowania runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu trzymaj je **wyłączone**.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
- `/fast` jest specyficzne dla dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` na natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/providers/openai) i [Anthropic](/providers/anthropic).
- Podsumowania błędów narzędzi nadal są pokazywane, gdy mają znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
- `/reasoning` (oraz `/verbose`) są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie lub dane wyjściowe narzędzi, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, szczególnie w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu go użyje.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza aktywne przełączenie jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
- Jeśli aktywność narzędzia lub odpowiedź już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby lub następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z allowlisty są obsługiwane natychmiast (pomijają kolejkę + model).
- **Bramkowanie wzmianek w grupach:** wiadomości zawierające tylko polecenia od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko nadawcy z allowlisty):** niektóre polecenia działają także, gdy są osadzone w zwykłej wiadomości, i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` uruchamia odpowiedź statusową, a pozostały tekst przechodzi dalej normalnym przepływem.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenia są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia Skills:** Skills typu `user-invocable` są udostępniane jako polecenia slash. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają numeryczne sufiksy (np. `_2`).
  - `/skill <name> [input]` uruchamia Skill po nazwie (przydatne, gdy limity natywnych poleceń uniemożliwiają polecenia dla każdego Skill osobno).
  - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/prose).
- **Argumenty poleceń natywnych:** Discord używa autocomplete dla dynamicznych opcji (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a Ty pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie pytanie o konfigurację: **czego ten agent może używać teraz
w tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie natywnych poleceń obsługujące argumenty udostępniają ten sam przełącznik trybu `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia faktycznie osiągalne w runtime, w tym narzędzia rdzenia, podłączone
  narzędzia pluginów i narzędzia należące do kanałów.

Do edycji profili i nadpisań używaj panelu Tools w Control UI lub powierzchni config/catalog zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co gdzie się pokazuje)

- **Użycie/kwota dostawcy** (np. „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe z samą pozostałą wartością są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu wraz z etykietą planu oznaczoną modelem.
- **Linie token/cache** w `/status` mogą wracać do najnowszego wpisu usage w transkrypcie, gdy aktywna migawka sesji jest uboga. Istniejące niezerowe aktywne wartości nadal wygrywają, a fallback do transkryptu może także odzyskać aktywną etykietę modelu runtime oraz większą całkowitą wartość zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Tokeny/koszt dla każdej odpowiedzi** są sterowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/auth/endpointów**, a nie użycia.

## Wybór modelu (`/model`)

`/model` jest implementowane jako dyrektywa.

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

- `/model` i `/model list` pokazują zwięzły, numerowany selektor (rodzina modelu + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawiać **nadpisania konfiguracji tylko dla runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania działają natychmiast dla nowych odczytów konfiguracji, ale **nie** zapisują do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z dysku.

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

`/mcp` zapisuje definicje serwerów MCP zarządzanych przez OpenClaw pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery runtime decydują, które transporty faktycznie da się wykonać.

## Aktualizacje pluginów

`/plugins` pozwala operatorom inspekcjonować wykryte pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego workspace oraz konfiguracji z dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginu; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach enable/disable zrestartuj gateway, aby je zastosować.

## Uwagi dotyczące powierzchni

- **Polecenia tekstowe** działają w zwykłej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, aby móc przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (z tymi samymi nazwami co `/help`). Menu argumentów poleceń dla Slacka są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek natywny w Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** o bieżącą sesję.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane do historii transkryptu,
- jest dostarczane jako aktywny wynik poboczny zamiast zwykłej wiadomości asystenta.

Dzięki temu `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe wyjaśnienie, podczas gdy główne
zadanie nadal trwa.

Przykład:

```text
/btw co teraz robimy?
```

Pełne informacje o zachowaniu i szczegółach UX klienta znajdziesz w [BTW Side Questions](/tools/btw).
