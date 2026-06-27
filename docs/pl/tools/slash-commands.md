---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
    - Zrozumienie sposobu rejestrowania poleceń Skills
sidebarTitle: Slash commands
summary: Wszystkie dostępne polecenia slash, dyrektywy i skróty inline — konfiguracja, routing i zachowanie dla poszczególnych powierzchni.
title: Polecenia z ukośnikiem
x-i18n:
    generated_at: "2026-06-27T18:30:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway obsługuje polecenia wysyłane jako samodzielne wiadomości zaczynające się od `/`.
Polecenia bash tylko dla hosta używają `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja jest powiązana z sesją ACP, zwykły tekst trafia do harnessu ACP. Polecenia zarządzające Gateway pozostają lokalne: `/acp ...` zawsze trafia do obsługi poleceń OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla danej powierzchni.

## Trzy typy poleceń

<CardGroup cols={3}>
  <Card title="Polecenia" icon="terminal">
    Samodzielne wiadomości `/...` obsługiwane przez Gateway. Muszą być wysłane jako jedyna treść wiadomości.
  </Card>
  <Card title="Dyrektywy" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — usuwane z wiadomości, zanim zobaczy ją model.
    Utrwalają ustawienia sesji, gdy są wysłane samodzielnie; działają jako wskazówki inline, gdy są wysłane z innym tekstem.
  </Card>
  <Card title="Skróty inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — uruchamiają się natychmiast i są usuwane, zanim model zobaczy pozostały tekst. Tylko autoryzowani nadawcy.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Szczegóły działania dyrektyw">
    - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
    - W wiadomościach **zawierających tylko dyrektywy** (wiadomość składa się wyłącznie z dyrektyw) są one utrwalane w sesji i zwracają potwierdzenie.
    - W **zwykłych wiadomościach czatu** z innym tekstem działają jako wskazówki inline i **nie** utrwalają ustawień sesji.
    - Dyrektywy mają zastosowanie tylko do **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna używana lista dozwolonych nadawców; w przeciwnym razie autoryzacja pochodzi z list dozwolonych nadawców/parowania kanału oraz `commands.useAccessGroups`. Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.
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
  Włącza parsowanie `/...` w wiadomościach czatu. Na powierzchniach bez natywnych poleceń
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) polecenia tekstowe działają nawet po ustawieniu na `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Rejestruje natywne polecenia. Auto: włączone dla Discord/Telegram; wyłączone dla Slack;
  ignorowane dla dostawców bez natywnej obsługi. Nadpisz dla kanału za pomocą
  `channels.<provider>.commands.native`. W Discord `false` pomija rejestrację slash-command;
  wcześniej zarejestrowane polecenia mogą pozostać widoczne do czasu usunięcia.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Rejestruje polecenia Skills natywnie, gdy jest to obsługiwane. Auto: włączone dla
  Discord/Telegram; wyłączone dla Slack. Nadpisz za pomocą
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (alias `/bash <cmd>`). Wymaga
  list dozwolonych `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Jak długo bash czeka przed przełączeniem w tryb tła (`0` przenosi w tło natychmiast).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczyt/zapis `openclaw.json`). Tylko właściciel.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw pod `mcp.servers`). Tylko właściciel.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status Pluginów oraz instalacja i włączanie/wyłączanie). Zapisy tylko dla właściciela.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania konfiguracji tylko w czasie działania). Tylko właściciel.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` oraz akcje narzędzi restartujące gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Jawna lista dozwolonych właścicieli dla powierzchni poleceń tylko dla właściciela. Oddzielna od
  `commands.allowFrom` i dostępu przez parowanie DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: wymaga tożsamości właściciela dla poleceń tylko dla właściciela. Gdy `true`,
  nadawca musi pasować do `commands.ownerAllowFrom` albo mieć wewnętrzny zakres `operator.admin`.
  Wpis wieloznaczny `allowFrom` **nie** wystarcza.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje sposób wyświetlania identyfikatorów właścicieli w prompcie systemowym.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Sekret HMAC używany, gdy `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych nadawców dla autoryzacji poleceń, osobna dla każdego dostawcy. Gdy jest skonfigurowana, jest
  **jedynym** źródłem autoryzacji dla poleceń i dyrektyw. Użyj `"*"` jako
  globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych nadawców/zasady dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Polecenia pochodzą z trzech źródeł:

- **Wbudowane elementy core:** `src/auto-reply/commands-registry.shared.ts`
- **Wygenerowane polecenia docka:** `src/auto-reply/commands-registry.data.ts`
- **Polecenia Pluginów:** wywołania `registerCommand()` Pluginów

Dostępność zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych
Pluginów.

### Polecenia core

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    | Polecenie | Opis |
    | --- | --- |
    | `/new [model]` | Zarchiwizuj bieżącą sesję i rozpocznij nową |
    | `/reset [soft [message]]` | Zresetuj bieżącą sesję w miejscu. `soft` zachowuje transkrypt, porzuca ponownie użyte identyfikatory sesji backendu CLI i ponownie uruchamia start |
    | `/name <title>` | Nazwij lub zmień nazwę bieżącej sesji. Pomiń tytuł, aby zobaczyć bieżącą nazwę i sugestię |
    | `/compact [instructions]` | Skompaktuj kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction) |
    | `/stop` | Przerwij bieżące uruchomienie |
    | `/session idle <duration\|off>` | Zarządzaj wygaśnięciem bezczynności powiązania wątku |
    | `/session max-age <duration\|off>` | Zarządzaj wygaśnięciem maksymalnego wieku powiązania wątku |
    | `/export-session [path]` | Eksportuj bieżącą sesję do HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Eksportuj pakiet trajektorii JSONL dla bieżącej sesji. Alias: `/trajectory` |

    <Note>
      Control UI przechwytuje wpisane `/new`, aby utworzyć i przełączyć na nową
      sesję dashboardu, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"`
      i bieżący rodzic jest główną sesją agenta — wtedy `/new`
      resetuje główną sesję w miejscu. Wpisane `/reset` nadal uruchamia reset w miejscu Gateway.
      Użyj `/model default`, gdy chcesz wyczyścić przypięty wybór modelu sesji.
    </Note>

  </Accordion>

  <Accordion title="Kontrole modelu i uruchomień">
    | Polecenie | Opis |
    | --- | --- |
    | `/think <level\|default>` | Ustaw poziom myślenia albo wyczyść nadpisanie sesji. Aliasy: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Przełącz szczegółowe wyjście. Alias: `/v` |
    | `/trace on\|off` | Przełącz wyjście śledzenia Pluginu dla bieżącej sesji |
    | `/fast [status\|auto\|on\|off\|default]` | Pokaż, ustaw albo wyczyść tryb szybki |
    | `/reasoning [on\|off\|stream]` | Przełącz widoczność rozumowania. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Przełącz tryb podwyższony. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Pokaż albo ustaw domyślne wartości exec |
    | `/model [name\|#\|status]` | Pokaż albo ustaw model |
    | `/models [provider] [page] [limit=<n>\|all]` | Wyświetl skonfigurowanych/dostępnych przez auth dostawców albo modele |
    | `/queue <mode>` | Zarządzaj zachowaniem kolejki aktywnych uruchomień. Zobacz [Queue](/pl/concepts/queue) i [Queue steering](/pl/concepts/queue-steering) |
    | `/steer <message>` | Wstrzyknij wskazówki do aktywnego uruchomienia. Alias: `/tell`. Zobacz [Sterowanie](/pl/tools/steer) |

    <AccordionGroup>
      <Accordion title="bezpieczeństwo verbose / trace / fast / reasoning">
        - `/verbose` służy do debugowania — trzymaj je **wyłączone** w normalnym użyciu.
        - `/trace` ujawnia tylko linie trace/debug należące do Pluginu; zwykły szczegółowy szum pozostaje wyłączony.
        - `/fast auto|on|off` utrwala nadpisanie sesji; użyj opcji `inherit` w interfejsie Sessions UI, aby je wyczyścić.
        - `/fast` jest specyficzne dla dostawcy: OpenAI/Codex mapuje je na `service_tier=priority`; bezpośrednie żądania Anthropic mapują je na `service_tier=auto` albo `standard_only`.
        - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych — mogą ujawnić wewnętrzne rozumowanie albo diagnostykę Pluginu. Trzymaj je wyłączone w czatach grupowych.

      </Accordion>
      <Accordion title="Szczegóły przełączania modeli">
        - `/model` natychmiast utrwala nowy model w sesji.
        - Jeśli agent jest bezczynny, następne uruchomienie używa go od razu.
        - Jeśli uruchomienie jest aktywne, przełączenie jest oznaczane jako oczekujące i stosowane w następnym czystym punkcie ponowienia.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Wykrywanie i status">
    | Polecenie | Opis |
    | --- | --- |
    | `/help` | Pokaż krótkie podsumowanie pomocy |
    | `/commands` | Pokaż wygenerowany katalog poleceń |
    | `/tools [compact\|verbose]` | Pokaż, czego bieżący agent może użyć teraz |
    | `/status` | Pokaż status wykonania/czasu działania, czas pracy Gateway i systemu, kondycję Pluginów oraz użycie/limit dostawcy |
    | `/status plugins` | Pokaż szczegółową kondycję Pluginów: błędy ładowania, kwarantanny, awarie kanałów, problemy zależności, powiadomienia o zgodności |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Zarządzaj trwałym [celem](/pl/tools/goal) bieżącej sesji |
    | `/diagnostics [note]` | Przepływ raportu wsparcia tylko dla właściciela. Za każdym razem pyta o zgodę na exec |
    | `/crestodian <request>` | Uruchom pomocnika konfiguracji i napraw Crestodian z DM właściciela |
    | `/tasks` | Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji |
    | `/context [list\|detail\|map\|json]` | Wyjaśnij, jak składany jest kontekst |
    | `/whoami` | Pokaż swój identyfikator nadawcy. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kontroluj stopkę użycia dla odpowiedzi (`reset`/`inherit`/`clear`/`default` czyści nadpisanie sesji, aby ponownie odziedziczyć skonfigurowaną wartość domyślną) albo wypisz lokalne podsumowanie kosztów |
  </Accordion>

  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    | Polecenie | Opis |
    | --- | --- |
    | `/skill <name> [input]` | Uruchom skill według nazwy |
    | `/allowlist [list\|add\|remove] ...` | Zarządzaj wpisami listy dozwolonych. Tylko tekstowo |
    | `/approve <id> <decision>` | Rozwiąż prompty zatwierdzania exec albo Pluginu |
    | `/btw <question>` | Zadaj pytanie poboczne bez zmieniania kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw) |
  </Accordion>

  <Accordion title="Subagenci i ACP">
    | Polecenie | Opis |
    | --- | --- |
    | `/subagents list\|log\|info` | Sprawdź uruchomienia subagentów dla bieżącej sesji |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Zarządzaj sesjami ACP i opcjami runtime |
    | `/focus <target>` | Powiąż bieżący wątek Discord lub temat Telegram z celem sesji |
    | `/unfocus` | Usuń bieżące powiązanie wątku |
    | `/agents` | Wyświetl agentów powiązanych z wątkiem dla bieżącej sesji |
  </Accordion>

  <Accordion title="Zapisy tylko dla właściciela i administracja">
    | Polecenie | Wymaga | Opis |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Odczytaj lub zapisz `openclaw.json`. Tylko właściciel |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Odczytaj lub zapisz konfigurację serwera MCP zarządzaną przez OpenClaw. Tylko właściciel |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Sprawdź lub zmień stan pluginów. Zapisy tylko dla właściciela. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Nadpisania konfiguracji tylko w runtime. Tylko właściciel |
    | `/restart` | `commands.restart: true` (domyślnie) | Uruchom ponownie OpenClaw |
    | `/send on\|off\|inherit` | właściciel | Ustaw politykę wysyłania |
  </Accordion>

  <Accordion title="Głos, TTS, sterowanie kanałem">
    | Polecenie | Opis |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Steruj TTS. Zobacz [TTS](/pl/tools/tts) |
    | `/activation mention\|always` | Ustaw tryb aktywacji grupy |
    | `/bash <command>` | Uruchom polecenie powłoki hosta. Alias: `! <command>`. Wymaga `commands.bash: true` |
    | `!poll [sessionId]` | Sprawdź zadanie bash działające w tle |
    | `!stop [sessionId]` | Zatrzymaj zadanie bash działające w tle |
  </Accordion>
</AccordionGroup>

### Polecenia dokowania

Polecenia dokowania przełączają trasę odpowiedzi aktywnej sesji na inny połączony kanał.
Konfigurację i rozwiązywanie problemów opisuje [dokowanie kanałów](/pl/concepts/channel-docking).

Wygenerowane z pluginów kanałów z obsługą poleceń natywnych:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Polecenia dokowania wymagają `session.identityLinks`. Nadawca źródłowy i docelowy peer
muszą należeć do tej samej grupy tożsamości.

### Polecenia dołączonych pluginów

| Polecenie                                                                                    | Opis                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Przełącz dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming)                  |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Zarządzaj parowaniem urządzeń. Zobacz [parowanie](/pl/channels/pairing)              |
| `/phone status\|arm ...\|disarm`                                                             | Tymczasowo uzbrój polecenia węzła telefonu o wysokim ryzyku                       |
| `/voice status\|list\|set <voiceId>`                                                         | Zarządzaj konfiguracją głosu Talk. Natywna nazwa w Discord: `/talkvoice`          |
| `/card ...`                                                                                  | Wyślij presety rozbudowanych kart LINE. Zobacz [LINE](/pl/channels/line)             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Steruj uprzężą serwera aplikacji Codex. Zobacz [uprząż Codex](/pl/plugins/codex-harness) |

Tylko QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Polecenia Skills

Skills wywoływane przez użytkownika są udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą rejestrować się jako bezpośrednie polecenia (np. `/prose` dla OpenProse).
- Natywna rejestracja poleceń Skills jest kontrolowana przez `commands.nativeSkills` i
  `channels.<provider>.commands.nativeSkills`.
- Nazwy są oczyszczane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe.

<AccordionGroup>
  <Accordion title="Dyspozycja poleceń Skills">
    Domyślnie polecenia Skills są kierowane do modelu jako zwykłe żądanie.

    Skills mogą deklarować `command-dispatch: tool`, aby kierować je bezpośrednio do narzędzia
    (deterministycznie, bez udziału modelu). Przykład: `/prose` (Plugin OpenProse)
    — zobacz [OpenProse](/pl/prose).

  </Accordion>
  <Accordion title="Argumenty poleceń natywnych">
    Discord używa autouzupełniania dla opcji dynamicznych oraz menu przycisków, gdy wymagane
    argumenty są pominięte. Telegram i Slack pokazują menu przycisków dla poleceń z
    wyborami. Wybory dynamiczne są rozwiązywane względem modelu sesji docelowej, więc opcje
    specyficzne dla modelu, takie jak poziomy `/think`, respektują nadpisanie `/model` sesji.
  </Accordion>
</AccordionGroup>

## `/tools` — czego agent może użyć teraz

`/tools` odpowiada na pytanie runtime: **czego ten agent może użyć teraz w tej
rozmowie** — nie jest to statyczny katalog konfiguracji.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Wyniki mają zakres sesji. Zmiana agenta, kanału, wątku, autoryzacji nadawcy
lub modelu może zmienić wynik. Do edycji profilu i nadpisań użyj panelu Tools
w Control UI albo powierzchni konfiguracji.

## `/model` — wybór modelu

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

W Discord `/model` i `/models` otwierają interaktywny wybór z listami dostawcy i
modelu. Wybór respektuje `agents.defaults.models`, w tym wpisy
`provider/*`.

## `/config` — zapisy konfiguracji na dysku

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz przez `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfiguracja jest walidowana przed zapisem. Nieprawidłowe zmiany są odrzucane. Aktualizacje `/config`
utrzymują się po restartach.

## `/mcp` — konfiguracja serwera MCP

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz przez `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu osadzonego agenta.

## `/debug` — nadpisania tylko w runtime

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz przez `commands.debug: true`.
  Nadpisania stosują się natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują na dysk.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — zarządzanie pluginami

<Note>
  Zapisy tylko dla właściciela. Domyślnie wyłączone — włącz przez `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aktualizuje konfigurację pluginów i przeładowuje na gorąco runtime
pluginów Gateway dla nowych tur agenta. `/plugins install` automatycznie restartuje zarządzane
Gatewaye, ponieważ zmieniły się moduły źródłowe pluginów.

## `/trace` — wyjście śledzenia pluginu

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` ujawnia linie śledzenia/debugowania pluginów w zakresie sesji bez pełnego trybu
szczegółowego. Nie zastępuje `/debug` (nadpisania runtime) ani `/verbose` (normalne
wyjście narzędzia).

## `/btw` — pytania poboczne

`/btw` to szybkie pytanie poboczne dotyczące kontekstu bieżącej sesji. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

W przeciwieństwie do zwykłej wiadomości:

- Używa bieżącej sesji jako kontekstu tła.
- W sesjach uprzęży Codex działa jako efemeryczny wątek poboczny Codex.
- **Nie** zmienia przyszłego kontekstu sesji.
- Nie jest zapisywane w historii transkrypcji.

Pełne zachowanie opisują [pytania poboczne BTW](/pl/tools/btw).

## Uwagi o powierzchniach

<AccordionGroup>
  <Accordion title="Zakres sesji według powierzchni">
    - **Polecenia tekstowe:** działają w normalnej sesji czatu (DM-y współdzielą `main`, grupy mają własną sesję).
    - **Natywne polecenia Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Natywne polecenia Slack:** `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
    - **Natywne polecenia Telegram:** `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` obsługuje jedno polecenie w stylu `/openclaw`.
    Przy `commands.native: true` utwórz jedno polecenie slash Slack dla każdego wbudowanego
    polecenia. Zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje
    `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.
  </Accordion>
  <Accordion title="Szybka ścieżka i skróty inline">
    - Wiadomości składające się tylko z polecenia od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - Skróty inline (`/help`, `/commands`, `/status`, `/whoami`) działają także osadzone w zwykłych wiadomościach i są usuwane, zanim model zobaczy pozostały tekst.
    - Nieautoryzowane wiadomości składające się tylko z polecenia są po cichu ignorowane; tokeny inline `/...` są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Uwagi o argumentach">
    - Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (`/think: high`, `/send: on`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
    - `/allowlist add|remove` wymaga `commands.config: true` i respektuje kanałowe `configWrites`.

  </Accordion>
</AccordionGroup>

## Użycie i status dostawcy

- **Użycie/limit dostawcy** (np. „Claude 80% left”) pojawia się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone.
- **Linie tokenów/cache** w `/status` mogą awaryjnie użyć najnowszego wpisu użycia z transkrypcji, gdy migawka sesji live jest skąpa.
- **Wykonanie vs runtime:** `/status` raportuje `Execution` dla efektywnej ścieżki sandboxa i `Runtime` dla tego, kto uruchamia sesję: `OpenClaw Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź:** kontrolowane przez `/usage off|tokens|full`.
- `/model status` dotyczy modeli/autoryzacji/endpointów, a nie użycia.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Jak rejestrowane i bramkowane są polecenia slash Skills.
  </Card>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Zbuduj skill, który rejestruje własne polecenie slash.
  </Card>
  <Card title="BTW" href="/pl/tools/btw" icon="comments">
    Pytania poboczne bez zmiany kontekstu sesji.
  </Card>
  <Card title="Sterowanie" href="/pl/tools/steer" icon="compass">
    Prowadź agenta w trakcie uruchomienia za pomocą `/steer`.
  </Card>
</CardGroup>
