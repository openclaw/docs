---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia ukośnikowe: tekstowe a natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia ukośnikowe

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość rozpoczynająca się od `/`.
Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (niebędących wyłącznie dyrektywami) są traktowane jako „wskazówki w treści” i **nie** utrwalają ustawień sesji.
  - W wiadomościach składających się wyłącznie z dyrektyw (wiadomość zawiera tylko dyrektywy) utrwalają się w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych źródeł; w przeciwnym razie autoryzacja wynika z list dozwolonych kanału/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje także kilka **skrótów inline** (tylko dla nadawców z listy dozwolonych / autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim wiadomość zobaczy model, a pozostały tekst przechodzi dalej normalnym przepływem.

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
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje polecenia natywne.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slacka (dopóki nie dodasz poleceń ukośnikowych); ignorowane dla dostawców bez natywnego wsparcia.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby wymusić ustawienie dla konkretnego dostawcy (bool lub `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discordzie/Telegramie przy uruchamianiu. Polecenia Slacka są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **skill**, gdy jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slacka (Slack wymaga utworzenia osobnego polecenia ukośnikowego dla każdego skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby wymusić ustawienie dla konkretnego dostawcy (bool lub `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga list dozwolonych `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) określa, jak długo bash czeka przed przełączeniem do trybu tła (`0` od razu uruchamia w tle).
- `commands.config` (domyślnie `false`) włącza `/config` (odczytuje/zapisuje `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczytuje/zapisuje konfigurację MCP zarządzaną przez OpenClaw w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status pluginów oraz kontrolę instalacji + włączania/wyłączania).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko w czasie działania).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzi restartu gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną listę dozwolonych źródeł właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. Jest to oddzielne od `commands.allowFrom`.
- `commands.ownerDisplay` określa, jak identyfikatory właściciela pojawiają się w system prompt: `raw` lub `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia listę dozwolonych źródeł per dostawca dla autoryzacji poleceń. Gdy jest skonfigurowane, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (listy dozwolonych kanału/parowania oraz `commands.useAccessGroups`
  są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Aktualne źródło prawdy:

- wbudowane polecenia core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań plugin `registerCommand()`
- rzeczywista dostępność w Twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Wbudowane polecenia core

Wbudowane polecenia dostępne obecnie:

- `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startup/system prompt w miejscu.
- `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygasaniem powiązania z wątkiem.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z niestandardowymi poziomami takimi jak `xhigh`, `adaptive`, `max` lub binarne `on` tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/trace on|off` przełącza wyjście śledzenia pluginów dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
- `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb podwyższonych uprawnień. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla dostawców lub modele dla dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz użyć.
- `/status` pokazuje status czasu działania, w tym użycie/limit dostawcy, gdy jest dostępny.
- `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia skill po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami listy dozwolonych. Tylko tekstowo.
- `/approve <id> <decision>` rozwiązuje prompty zatwierdzenia exec.
- `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami sub-agentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami czasu działania.
- `/focus <target>` wiąże bieżący wątek Discorda lub temat/konwersację Telegrama z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego lub wszystkich uruchomionych sub-agentów.
- `/steer <id|#> <message>` wysyła sterowanie do działającego sub-agenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginów. `/plugin` jest aliasem. Zapis tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w czasie działania. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką użycia na odpowiedź lub wyświetla lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowo. Alias: `! <command>`. Wymaga `commands.bash: true` oraz list dozwolonych `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash działające w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z pluginów kanałów ze wsparciem poleceń natywnych. Aktualny zestaw wbudowany:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia wbudowanych pluginów

Wbudowane pluginy mogą dodawać więcej poleceń ukośnikowych. Aktualne wbudowane polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia Node telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discordzie natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła predefiniowane karty rich card LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i kontroluje wbudowaną uprząż app-server Codex. Zobacz [Uprząż Codex](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia skill

Skill wywoływane przez użytkownika są również udostępniane jako polecenia ukośnikowe:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- skills mogą także pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy skill/plugin je rejestruje.
- natywna rejestracja poleceń skill jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` lub nazwę dostawcy (dopasowanie przybliżone); jeśli nic nie pasuje, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełny podział użycia dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje `configWrites` kanału.
- W kanałach wielokontowych ukierunkowane na konfigurację polecenia `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia dodawaną do każdej odpowiedzi; `/usage cost` wyświetla lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm lub `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację pluginu i może poprosić o restart.
- Natywne polecenie tylko dla Discorda: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i poleceń natywnych; niedostępne tekstowo).
- Polecenia powiązania wątku Discorda (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają, aby skuteczne powiązania wątków były włączone (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja polecenia ACP i zachowanie w czasie działania: [Agenci ACP](/pl/tools/acp-agents).
- `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do pluginów i pozostawia wyłączony zwykły szczegółowy szum narzędzi.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do domyślnych ustawień z konfiguracji.
- `/fast` jest zależne od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` lub `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy ma to znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne rozumowanie, wyniki narzędzi lub diagnostykę pluginów, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, szczególnie na czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub wysyłanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
- **Bramkowanie wzmianek w grupie:** wiadomości zawierające wyłącznie polecenie od nadawców z listy dozwolonych omijają wymagania dotyczące wzmianki.
- **Skróty inline (tylko dla nadawców z listy dozwolonych):** niektóre polecenia działają także po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź statusu, a pozostały tekst przechodzi dalej normalnym przepływem.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające wyłącznie polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia skill:** skills `user-invocable` są udostępniane jako polecenia ukośnikowe. Nazwy są sanitizowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają sufiksy numeryczne (np. `_2`).
  - `/skill <name> [input]` uruchamia skill po nazwie (przydatne, gdy limity poleceń natywnych uniemożliwiają utworzenie polecenia dla każdego skill).
  - Domyślnie polecenia skill są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty poleceń natywnych:** Discord używa autouzupełniania dla opcji dynamicznych (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie dotyczące czasu działania, a nie konfiguracji: **czego ten agent może użyć teraz w
tej rozmowie**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu jako `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy lub modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia, które są rzeczywiście osiągalne w czasie działania, w tym narzędzia core, podłączone
  narzędzia pluginów oraz narzędzia należące do kanału.

Do edycji profili i nadpisań używaj panelu Tools w interfejsie Control UI lub powierzchni config/catalog, zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe zawierające tylko pozostałą wartość są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Linie tokenów/cache** w `/status` mogą wracać do najnowszego wpisu użycia w transkrypcie, gdy migawka aktywnej sesji jest uboga. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a awaryjny odczyt z transkryptu może także odzyskać etykietę aktywnego modelu czasu działania oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące lub mniejsze.
- **Tokeny/koszt dla każdej odpowiedzi** są kontrolowane przez `/usage off|tokens|full` (dodawane do zwykłych odpowiedzi).
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

- `/model` i `/model list` pokazują zwięzły, numerowany selektor (rodzina modeli + dostępni dostawcy).
- Na Discordzie `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawców i modeli oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), jeśli są dostępne.

## Nadpisania debugowania

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

- Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują się do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.

## Wyjście śledzenia pluginów

`/trace` pozwala przełączać **linie śledzenia/debugowania pluginów o zakresie sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan śledzenia dla sesji.
- `/trace on` włącza linie śledzenia pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie śledzenia pluginów mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko w czasie działania.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe wyjście narzędzi/statusu nadal należy do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do Twojej konfiguracji na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.config: true`.

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
- Aktualizacje `/config` utrzymują się po restarcie.

## Aktualizacje MCP

`/mcp` zapisuje definicje serwera MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` zapisuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery czasu działania decydują, które transporty są faktycznie wykonalne.

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

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego workspace oraz konfiguracji na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach enable/disable uruchom ponownie gateway, aby je zastosować.

## Uwagi dotyczące powierzchni

- **Polecenia tekstowe** działają w normalnej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, aby mogło przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie ukośnikowe Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slacka są dostarczane jako efemeryczne przyciski Block Kit.
  - Natywny wyjątek Slacka: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slacka.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- działa jako osobne wywołanie jednorazowe **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne
zadanie nadal trwa.

Przykład:

```text
/btw co teraz robimy?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX
klienta.
