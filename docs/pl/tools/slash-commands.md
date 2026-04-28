---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
sidebarTitle: Slash commands
summary: 'Polecenia ukośnikowe: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-26T11:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`. Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z aliasem `/bash <cmd>`).

Gdy rozmowa lub wątek jest powiązany z sesją ACP, zwykły dalszy tekst jest kierowany do tego harness ACP. Polecenia zarządzania Gateway nadal pozostają lokalne: `/acp ...` zawsze trafia do obsługi poleceń ACP OpenClaw, a `/status` i `/unfocus` pozostają lokalne wszędzie tam, gdzie dla danej powierzchni włączona jest obsługa poleceń.

Istnieją dwa powiązane systemy:

<AccordionGroup>
  <Accordion title="Polecenia">
    Samodzielne wiadomości `/...`.
  </Accordion>
  <Accordion title="Dyrektywy">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Dyrektywy są usuwane z wiadomości, zanim model ją zobaczy.
    - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
    - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) utrwalają się w sesji i zwracają potwierdzenie.
    - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z list dozwolonych kanału/parowania oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

  </Accordion>
  <Accordion title="Skróty inline">
    Tylko nadawcy z listy dozwolonych/autoryzowani: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi dalej normalnym przepływem.

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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia natywne. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz slash commands); ignorowane dla dostawców bez natywnego wsparcia. Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać ustawienie dla dostawcy (bool lub `"auto"`). `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram podczas uruchamiania. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia **Skills** natywnie, jeśli jest to obsługiwane. Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia slash command dla każdego Skill). Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać ustawienie dla dostawcy (bool lub `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Określa, jak długo bash czeka przed przejściem do trybu tła (`0` natychmiast przenosi do tła).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczyt/zapis `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw w `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status Plugin plus kontrolki instalacji oraz włączania/wyłączania).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania tylko w runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartu Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Ustawia jawną listę dozwolonych właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. Oddzielne od `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: sprawia, że polecenia tylko dla właściciela wymagają uruchomienia przez **tożsamość właściciela** na tej powierzchni. Gdy ustawione na `true`, nadawca musi albo pasować do rozpoznanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w `allowFrom` kanału albo pusta/nierozpoznana lista kandydatów właściciela **nie** wystarczą — polecenia tylko dla właściciela kończą się dla tego kanału w trybie fail closed. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe listy dozwolonych poleceń.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Określa, jak identyfikatory właściciela pojawiają się w promptcie systemowym.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla autoryzacji poleceń per dostawca. Gdy jest skonfigurowana, jest jedynym źródłem autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanału/parowania oraz `commands.useAccessGroups` są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawców ją nadpisują.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Egzekwuje listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia rdzenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Plugin pochodzą z wywołań `registerCommand()` w Plugin
- rzeczywista dostępność na Twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Pluginów

### Wbudowane polecenia rdzenia

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    - `/new [model]` uruchamia nową sesję; `/reset` to alias resetu.
    - `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i na miejscu ponownie uruchamia ładowanie startup/system prompt.
    - `/compact [instructions]` wykonuje Compaction kontekstu sesji. Zobacz [Compaction](/pl/concepts/compaction).
    - `/stop` przerywa bieżące uruchomienie.
    - `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
    - `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
    - `/export-trajectory [path]` eksportuje pakiet [trajectory](/pl/tools/trajectory) JSONL dla bieżącej sesji. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Sterowanie modelem i uruchomieniem">
    - `/think <level>` ustawia poziom thinking. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z niestandardowymi poziomami takimi jak `xhigh`, `adaptive`, `max` lub binarnym `on` tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
    - `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
    - `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
    - `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
    - `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` przełącza tryb elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
    - `/model [name|#|status]` pokazuje lub ustawia model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla dostawców lub modele dla dostawcy.
    - `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Wykrywanie i status">
    - `/help` pokazuje krótkie podsumowanie pomocy.
    - `/commands` pokazuje wygenerowany katalog poleceń.
    - `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
    - `/status` pokazuje status wykonania/runtime, w tym etykiety `Execution`/`Runtime` oraz użycie/limit dostawcy, gdy są dostępne.
    - `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
    - `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
    - `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
    - `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
    - `/usage off|tokens|full|cost` steruje stopką użycia dla każdej odpowiedzi lub wyświetla lokalne podsumowanie kosztów.

  </Accordion>
  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    - `/skill <name> [input]` uruchamia Skill po nazwie.
    - `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekstowe.
    - `/approve <id> <decision>` rozwiązuje prompty zatwierdzeń exec.
    - `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [BTW](/pl/tools/btw).

  </Accordion>
  <Accordion title="Subagenci i ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami sub-agentów dla bieżącej sesji.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami runtime.
    - `/focus <target>` wiąże bieżący wątek Discord lub temat/rozmowę Telegram z celem sesji.
    - `/unfocus` usuwa bieżące powiązanie.
    - `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
    - `/kill <id|#|all>` przerywa jednego lub wszystkich działających sub-agentów.
    - `/steer <id|#> <message>` wysyła sterowanie do działającego sub-agenta. Alias: `/tell`.

  </Accordion>
  <Accordion title="Zapisy tylko dla właściciela i administracja">
    - `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
    - `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan Plugin. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
    - `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w runtime. Tylko dla właściciela. Wymaga `commands.debug: true`.
    - `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby wyłączyć.
    - `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.

  </Accordion>
  <Accordion title="Głos, TTS, sterowanie kanałem">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steruje TTS. Zobacz [TTS](/pl/tools/tts).
    - `/activation mention|always` ustawia tryb aktywacji grupy.
    - `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowe. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
    - `!poll [sessionId]` sprawdza zadanie bash działające w tle.
    - `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

  </Accordion>
</AccordionGroup>

### Wygenerowane polecenia dock

Polecenia dock są generowane z Pluginów kanałów z obsługą poleceń natywnych. Bieżący dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych Pluginów

Dołączone Pluginy mogą dodawać kolejne slash commands. Aktualne dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia węzła telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord nazwa natywnego polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i kontroluje dołączony harness app-server Codex. Zobacz [Harness Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływalne przez użytkownika są również udostępniane jako slash commands:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy zarejestruje je Skill/Plugin.
- natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Uwagi o argumentach i parserze">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nic nie pasuje, tekst jest traktowany jako treść wiadomości.
    - Dla pełnego rozbicia użycia dostawców użyj `openclaw status --usage`.
    - `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
    - W kanałach wielokontowych ukierunkowane na konfigurację `/allowlist --account <id>` i `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` docelowego konta.
    - `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wyświetla lokalne podsumowanie kosztów z logów sesji OpenClaw.
    - `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
    - `/plugins install <spec>` akceptuje te same specyfikacje Plugin co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
    - `/plugins enable|disable` aktualizuje konfigurację Plugin i może poprosić o restart.

  </Accordion>
  <Accordion title="Zachowanie specyficzne dla kanału">
    - Natywne polecenie tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga guild i wybranego kanału voice/stage. Wymaga `channels.discord.voice` i poleceń natywnych.
    - Polecenia powiązań wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają skutecznie włączonych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
    - Dokumentacja poleceń ACP i zachowania runtime: [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>
  <Accordion title="Bezpieczeństwo verbose / trace / fast / reasoning">
    - `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
    - `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do Plugin i utrzymuje zwykły szczegółowy szum narzędzi wyłączony.
    - `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w UI sesji, aby je wyczyścić i wrócić do domyślnych ustawień konfiguracji.
    - `/fast` zależy od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` na natywnych punktach końcowych Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniany przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
    - Podsumowania awarii narzędzi są nadal pokazywane, gdy to istotne, ale szczegółowy tekst awarii jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
    - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzny reasoning, wynik narzędzi lub diagnostykę Plugin, których nie zamierzałeś ujawniać. Lepiej pozostawić je wyłączone, zwłaszcza w czatach grupowych.

  </Accordion>
  <Accordion title="Przełączanie modeli">
    - `/model` natychmiast utrwala nowy model sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje nowy model dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
    - W lokalnym TUI `/crestodian [request]` wraca z normalnego TUI agenta do Crestodian. Jest to oddzielne od trybu ratunkowego kanału wiadomości i nie nadaje zdalnych uprawnień do konfiguracji.

  </Accordion>
  <Accordion title="Szybka ścieżka i skróty inline">
    - **Szybka ścieżka:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (pomijają kolejkę i model).
    - **Bramkowanie wzmiankami w grupie:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych omijają wymagania wzmianki.
    - **Skróty inline (tylko nadawcy z listy dozwolonych):** niektóre polecenia działają także po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostałą treść.
      - Przykład: `hey /status` wywołuje odpowiedź statusu, a pozostały tekst przechodzi dalej normalnym przepływem.
    - Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nieautoryzowane wiadomości zawierające wyłącznie polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.

  </Accordion>
  <Accordion title="Polecenia Skills i argumenty natywne">
    - **Polecenia Skills:** Skills `user-invocable` są udostępniane jako slash commands. Nazwy są sanitizowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają sufiksy liczbowe (np. `_2`).
      - `/skill <name> [input]` uruchamia Skill po nazwie (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia per Skill).
      - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
      - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
      - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
    - **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków po pominięciu wymaganych argumentów). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument. Wybory dynamiczne są rozwiązywane względem modelu sesji docelowej, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie na pytanie o konfigurację: **czego ten agent może używać teraz w tej rozmowie**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może zmienić wynik.
- `/tools` obejmuje narzędzia faktycznie osiągalne w runtime, w tym narzędzia rdzenia, podłączone narzędzia Plugin i narzędzia należące do kanału.

Do edycji profili i nadpisań użyj panelu Tools w UI Control albo powierzchni konfiguracji/katalogu zamiast traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pojawia się gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe tylko z wartością pozostałą są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu wraz z etykietą planu oznaczoną modelem.
- **Linie token/cache** w `/status` mogą awaryjnie korzystać z najnowszego wpisu użycia w transkrypcie, gdy aktywny snapshot sesji jest skąpy. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a awaryjne użycie transkryptu może także odzyskać etykietę aktywnego modelu runtime oraz większą łączną wartość zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Execution vs runtime:** `/status` raportuje `Execution` dla skutecznej ścieżki sandbox i `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI lub backend ACP.
- **Tokeny/koszt dla każdej odpowiedzi** są kontrolowane przez `/usage off|tokens|full` (dołączane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/uwierzytelniania/punktów końcowych**, a nie użycia.

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
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko w runtime** (pamięć, nie dysk). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują się do `openclaw.json`. Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji zapisanej na dysku.
</Note>

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
- Linie trace Plugin mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko w runtime.
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

<Note>
Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane. Aktualizacje `/config` utrzymują się po restartach.
</Note>

## Aktualizacje MCP

`/mcp` zapisuje definicje serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

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

## Aktualizacje Pluginów

`/plugins` pozwala operatorom sprawdzać wykryte Pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać aliasu `/plugin`. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Plugin względem bieżącego workspace i konfiguracji zapisanej na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację Plugin; nie instaluje ani nie odinstalowuje Pluginów.
- Po zmianach `enable/disable` uruchom ponownie Gateway, aby je zastosować.

</Note>

## Uwagi o powierzchniach

<AccordionGroup>
  <Accordion title="Sesje per powierzchnia">
    - **Polecenia tekstowe** działają w zwykłej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
    - **Polecenia natywne** używają izolowanych sesji:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** jest kierowane do aktywnej sesji czatu, aby mogło przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Szczegóły Slack">
    `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.

    Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

  </Accordion>
</AccordionGroup>

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
```

Pełne informacje o zachowaniu i szczegółach UX klienta znajdziesz w [Pytania poboczne BTW](/pl/tools/btw).

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills)
- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
