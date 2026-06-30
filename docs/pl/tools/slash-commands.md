---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
    - Zrozumienie, jak rejestrowane są polecenia Skills
sidebarTitle: Slash commands
summary: Wszystkie dostępne polecenia z ukośnikiem, dyrektywy i skróty w tekście — konfiguracja, routing i zachowanie dla poszczególnych powierzchni.
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-06-30T14:29:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway obsługuje polecenia wysłane jako samodzielne wiadomości zaczynające się od `/`.
Polecenia bash tylko dla hosta używają `! <cmd>` (z `/bash <cmd>` jako aliasem).

Gdy konwersacja jest powiązana z sesją ACP, zwykły tekst trafia do harnessu ACP.
Polecenia zarządzania Gateway pozostają lokalne: `/acp ...` zawsze trafia
do obsługi poleceń OpenClaw, a `/status` oraz `/unfocus` pozostają lokalne zawsze,
gdy obsługa poleceń jest włączona dla danej powierzchni.

## Trzy typy poleceń

<CardGroup cols={3}>
  <Card title="Polecenia" icon="terminal">
    Samodzielne wiadomości `/...` obsługiwane przez Gateway. Muszą być wysłane jako
    jedyna treść wiadomości.
  </Card>
  <Card title="Dyrektywy" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — usuwane z wiadomości, zanim model
    ją zobaczy. Utrwalają ustawienia sesji, gdy są wysłane samodzielnie; działają
    jako wskazówki w treści, gdy są wysłane z innym tekstem.
  </Card>
  <Card title="Skróty w treści" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — uruchamiają się natychmiast i są
    usuwane, zanim model zobaczy pozostały tekst. Tylko autoryzowani nadawcy.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Szczegóły działania dyrektyw">
    - Dyrektywy są usuwane z wiadomości, zanim model ją zobaczy.
    - W wiadomościach **zawierających tylko dyrektywy** (wiadomość składa się wyłącznie z dyrektyw) są
      utrwalane w sesji i odpowiadają potwierdzeniem.
    - W wiadomościach **normalnego czatu** z innym tekstem działają jako wskazówki w treści i
      **nie** utrwalają ustawień sesji.
    - Dyrektywy mają zastosowanie tylko do **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`,
      jest to jedyna używana lista dozwolonych; w przeciwnym razie autoryzacja pochodzi z
      list dozwolonych/powiązania kanału oraz `commands.useAccessGroups`. Nieautoryzowani
      nadawcy widzą dyrektywy traktowane jako zwykły tekst.
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
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) polecenia tekstowe
  działają nawet wtedy, gdy ustawiono `false`.
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
  Jak długo bash czeka przed przełączeniem w tryb tła (`0` przenosi w tło
  natychmiast).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Włącza `/config` (odczytuje/zapisuje `openclaw.json`). Tylko właściciel.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Włącza `/mcp` (odczytuje/zapisuje zarządzaną przez OpenClaw konfigurację MCP w `mcp.servers`). Tylko właściciel.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Włącza `/plugins` (wykrywanie/status pluginów oraz instalowanie + włączanie/wyłączanie). Zapisy tylko dla właściciela.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Włącza `/debug` (nadpisania konfiguracji tylko w czasie działania). Tylko właściciel.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Włącza `/restart` i akcje narzędzi ponownego uruchomienia Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Jawna lista dozwolonych właścicieli dla powierzchni poleceń tylko dla właściciela. Oddzielna od
  `commands.allowFrom` i dostępu przez powiązanie DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Dla kanału: wymaga tożsamości właściciela dla poleceń tylko dla właściciela. Gdy `true`,
  nadawca musi pasować do `commands.ownerAllowFrom` albo posiadać wewnętrzny zakres `operator.admin`.
  Wpis wieloznaczny `allowFrom` **nie** wystarcza.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kontroluje sposób wyświetlania identyfikatorów właściciela w prompcie systemowym.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Sekret HMAC używany, gdy `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista dozwolonych dla autoryzacji poleceń osobna dla każdego dostawcy. Po skonfigurowaniu jest
  **jedynym** źródłem autoryzacji dla poleceń i dyrektyw. Użyj `"*"` jako
  globalnego domyślnego ustawienia; klucze specyficzne dla dostawcy je nadpisują.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Wymusza listy dozwolonych/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.
</ParamField>

## Lista poleceń

Polecenia pochodzą z trzech źródeł:

- **Wbudowane polecenia core:** `src/auto-reply/commands-registry.shared.ts`
- **Wygenerowane polecenia doku:** `src/auto-reply/commands-registry.data.ts`
- **Polecenia Plugin:** wywołania `registerCommand()` w pluginach

Dostępność zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych
pluginów.

### Polecenia core

<AccordionGroup>
  <Accordion title="Sesje i uruchomienia">
    | Polecenie | Opis |
    | --- | --- |
    | `/new [model]` | Zarchiwizuj bieżącą sesję i rozpocznij nową |
    | `/reset [soft [message]]` | Zresetuj bieżącą sesję w miejscu. `soft` zachowuje transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia start |
    | `/name <title>` | Nadaj nazwę lub zmień nazwę bieżącej sesji. Pomiń tytuł, aby zobaczyć obecną nazwę i sugestię |
    | `/compact [instructions]` | Kompaktuj kontekst sesji. Zobacz [Compaction](/pl/concepts/compaction) |
    | `/stop` | Przerwij bieżące uruchomienie |
    | `/session idle <duration\|off>` | Zarządzaj wygaśnięciem bezczynności powiązania wątku |
    | `/session max-age <duration\|off>` | Zarządzaj wygaśnięciem maksymalnego wieku powiązania wątku |
    | `/export-session [path]` | Wyeksportuj bieżącą sesję do HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Wyeksportuj pakiet trajektorii JSONL dla bieżącej sesji. Alias: `/trajectory` |

    <Note>
      Control UI przechwytuje wpisane `/new`, aby utworzyć i przełączyć na nową
      sesję dashboardu, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"`
      i bieżący rodzic jest główną sesją agenta — wtedy `/new`
      resetuje główną sesję w miejscu. Wpisane `/reset` nadal uruchamia reset w miejscu
      Gateway. Użyj `/model default`, gdy chcesz wyczyścić przypięty
      wybór modelu sesji.
    </Note>

  </Accordion>

  <Accordion title="Model i kontrolki uruchomienia">
    | Polecenie | Opis |
    | --- | --- |
    | `/think <level\|default>` | Ustaw poziom myślenia lub wyczyść nadpisanie sesji. Aliasy: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Przełącz szczegółowe dane wyjściowe. Alias: `/v` |
    | `/trace on\|off` | Przełącz dane wyjściowe śledzenia pluginu dla bieżącej sesji |
    | `/fast [status\|auto\|on\|off\|default]` | Pokaż, ustaw lub wyczyść tryb szybki |
    | `/reasoning [on\|off\|stream]` | Przełącz widoczność rozumowania. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Przełącz tryb podwyższony. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Pokaż lub ustaw domyślne wartości exec |
    | `/model [name\|#\|status]` | Pokaż lub ustaw model |
    | `/models [provider] [page] [limit=<n>\|all]` | Wyświetl skonfigurowanych/dostępnych przez auth dostawców lub modele |
    | `/queue <mode>` | Zarządzaj zachowaniem kolejki aktywnych uruchomień. Zobacz [Queue](/pl/concepts/queue) i [Queue steering](/pl/concepts/queue-steering) |
    | `/steer <message>` | Wstrzyknij wskazówki do aktywnego uruchomienia. Alias: `/tell`. Zobacz [Steer](/pl/tools/steer) |

    <AccordionGroup>
      <Accordion title="bezpieczeństwo verbose / trace / fast / reasoning">
        - `/verbose` służy do debugowania — trzymaj je **wyłączone** podczas normalnego użycia.
        - `/trace` ujawnia tylko linie śledzenia/debugowania należące do pluginu; normalne szczegółowe komunikaty pozostają wyłączone.
        - `/fast auto|on|off` utrwala nadpisanie sesji; użyj opcji `inherit` w UI Sesji, aby je wyczyścić.
        - `/fast` jest specyficzne dla dostawcy: OpenAI/Codex mapują je na `service_tier=priority`; bezpośrednie żądania Anthropic mapują je na `service_tier=auto` lub `standard_only`.
        - `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych — mogą ujawnić wewnętrzne rozumowanie lub diagnostykę pluginu. Trzymaj je wyłączone w czatach grupowych.

      </Accordion>
      <Accordion title="Szczegóły przełączania modelu">
        - `/model` natychmiast utrwala nowy model w sesji.
        - Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
        - Jeśli uruchomienie jest aktywne, przełączenie zostaje oznaczone jako oczekujące i zastosowane w następnym czystym punkcie ponowienia.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Wykrywanie i status">
    | Polecenie | Opis |
    | --- | --- |
    | `/help` | Pokaż krótkie podsumowanie pomocy |
    | `/commands` | Pokaż wygenerowany katalog poleceń |
    | `/tools [compact\|verbose]` | Pokaż, czego bieżący agent może teraz używać |
    | `/status` | Pokaż status wykonania/środowiska uruchomieniowego, czas działania Gateway i systemu, kondycję pluginów oraz użycie/limit dostawcy |
    | `/status plugins` | Pokaż szczegółową kondycję pluginów: błędy ładowania, kwarantanny, awarie kanałów, problemy z zależnościami, powiadomienia o zgodności |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Zarządzaj trwałym [celem](/pl/tools/goal) bieżącej sesji |
    | `/diagnostics [note]` | Przepływ raportu wsparcia tylko dla właściciela. Za każdym razem prosi o zatwierdzenie exec |
    | `/crestodian <request>` | Uruchom pomocnika konfiguracji i naprawy Crestodian z DM właściciela |
    | `/tasks` | Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji |
    | `/context [list\|detail\|map\|json]` | Wyjaśnij, jak składany jest kontekst |
    | `/whoami` | Pokaż identyfikator nadawcy. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kontroluj stopkę użycia dla odpowiedzi (`reset`/`inherit`/`clear`/`default` czyści nadpisanie sesji, aby ponownie odziedziczyć skonfigurowane ustawienie domyślne) albo wydrukuj lokalne podsumowanie kosztów |
  </Accordion>

  <Accordion title="Skills, listy dozwolonych, zatwierdzenia">
    | Polecenie | Opis |
    | --- | --- |
    | `/skill <name> [input]` | Uruchom skill według nazwy |
    | `/allowlist [list\|add\|remove] ...` | Zarządzaj wpisami listy dozwolonych. Tylko tekst |
    | `/approve <id> <decision>` | Rozwiąż prompty zatwierdzeń exec lub pluginu |
    | `/btw <question>` | Zadaj pytanie poboczne bez zmiany kontekstu sesji. Alias: `/side`. Zobacz [BTW](/pl/tools/btw) |
  </Accordion>

  <Accordion title="Subagenci i ACP">
    | Polecenie | Opis |
    | --- | --- |
    | `/subagents list\|log\|info` | Sprawdź uruchomienia subagentów dla bieżącej sesji |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Zarządzaj sesjami ACP i opcjami środowiska uruchomieniowego. Kontrolki środowiska uruchomieniowego wymagają zewnętrznego właściciela albo tożsamości wewnętrznego administratora Gateway |
    | `/focus <target>` | Powiąż bieżący wątek Discord lub temat Telegram z docelową sesją |
    | `/unfocus` | Usuń powiązanie bieżącego wątku |
    | `/agents` | Wyświetl agentów powiązanych z wątkiem dla bieżącej sesji |
  </Accordion>

  <Accordion title="Zapisy tylko dla właściciela i administracja">
    | Polecenie | Wymaga | Opis |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Odczytaj albo zapisz `openclaw.json`. Tylko właściciel |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Odczytaj albo zapisz konfigurację serwera MCP zarządzaną przez OpenClaw. Tylko właściciel |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Sprawdź albo zmień stan pluginu. Zapisy tylko dla właściciela. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Nadpisania konfiguracji wyłącznie w środowisku uruchomieniowym. Tylko właściciel |
    | `/restart` | `commands.restart: true` (domyślnie) | Uruchom ponownie OpenClaw |
    | `/send on\|off\|inherit` | właściciel | Ustaw zasady wysyłania |
  </Accordion>

  <Accordion title="Głos, TTS, sterowanie kanałem">
    | Polecenie | Opis |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Steruj TTS. Zobacz [TTS](/pl/tools/tts) |
    | `/activation mention\|always` | Ustaw tryb aktywacji grupowej |
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

| Polecenie                                                                                    | Opis                                                                                         |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Przełącz Dreaming pamięci (właściciel albo administrator Gateway). Zobacz [Dreaming](/pl/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Zarządzaj parowaniem urządzeń. Zobacz [parowanie](/pl/channels/pairing)                         |
| `/phone status\|arm ...\|disarm`                                                             | Tymczasowo uzbrój polecenia węzła telefonu wysokiego ryzyka                                  |
| `/voice status\|list\|set <voiceId>`                                                         | Zarządzaj konfiguracją głosu Talk. Natywna nazwa w Discord: `/talkvoice`                     |
| `/card ...`                                                                                  | Wysyłaj presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line)                            |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Steruj uprzężą serwera aplikacji Codex. Zobacz [uprząż Codex](/pl/plugins/codex-harness)        |

Tylko QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Polecenia Skills

Skills wywoływane przez użytkownika są udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą rejestrować się jako bezpośrednie polecenia (np. `/prose` dla OpenProse).
- Rejestracją natywnych poleceń Skills sterują `commands.nativeSkills` i
  `channels.<provider>.commands.nativeSkills`.
- Nazwy są oczyszczane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe.

<AccordionGroup>
  <Accordion title="Dyspozycja poleceń Skills">
    Domyślnie polecenia Skills są kierowane do modelu jako normalne żądanie.

    Skills mogą zadeklarować `command-dispatch: tool`, aby kierować bezpośrednio do narzędzia
    (deterministycznie, bez udziału modelu). Przykład: `/prose` (plugin OpenProse)
    — zobacz [OpenProse](/pl/prose).

  </Accordion>
  <Accordion title="Argumenty poleceń natywnych">
    Discord używa autouzupełniania dla opcji dynamicznych oraz menu przycisków, gdy wymagane
    argumenty są pominięte. Telegram i Slack pokazują menu przycisków dla poleceń z
    wyborami. Dynamiczne wybory są rozwiązywane względem modelu sesji docelowej, więc opcje
    specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` sesji.
  </Accordion>
</AccordionGroup>

## `/tools` — czego agent może teraz użyć

`/tools` odpowiada na pytanie środowiska uruchomieniowego: **czego ten agent może użyć teraz w tej
rozmowie** — nie jest statycznym katalogiem konfiguracji.

```text
/tools         # widok kompaktowy
/tools verbose # z krótkimi opisami
```

Wyniki są ograniczone do sesji. Zmiana agenta, kanału, wątku, autoryzacji
nadawcy albo modelu może zmienić dane wyjściowe. Do edycji profilu i nadpisań
użyj panelu Tools w Control UI albo powierzchni konfiguracji.

## `/model` — wybór modelu

```text
/model             # pokaż selektor modelu
/model list        # to samo
/model 3           # wybierz według numeru z selektora
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # wyczyść wybór modelu sesji
/model status      # widok szczegółowy z punktem końcowym i trybem API
```

W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i
modelu. Selektor uwzględnia `agents.defaults.models`, w tym wpisy
`provider/*`.

## `/config` — zapisy konfiguracji na dysku

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz za pomocą `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfiguracja jest sprawdzana przed zapisem. Nieprawidłowe zmiany są odrzucane. Aktualizacje `/config`
utrzymują się po ponownych uruchomieniach.

## `/mcp` — konfiguracja serwera MCP

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz za pomocą `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu osadzonego agenta.

## `/debug` — nadpisania tylko w środowisku uruchomieniowym

<Note>
  Tylko właściciel. Domyślnie wyłączone — włącz za pomocą `commands.debug: true`.
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
  Zapisy tylko dla właściciela. Domyślnie wyłączone — włącz za pomocą `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aktualizuje konfigurację pluginów i przeładowuje na gorąco środowisko uruchomieniowe
pluginów Gateway dla nowych tur agenta. `/plugins install` automatycznie ponownie uruchamia zarządzane
Gateway, ponieważ moduły źródłowe pluginów uległy zmianie.

## `/trace` — dane wyjściowe śledzenia pluginów

```text
/trace          # pokaż bieżący stan śledzenia
/trace on
/trace off
```

`/trace` ujawnia ograniczone do sesji wiersze śledzenia/debugowania pluginu bez pełnego trybu
szczegółowego. Nie zastępuje `/debug` (nadpisania środowiska uruchomieniowego) ani `/verbose` (normalne
dane wyjściowe narzędzi).

## `/btw` — pytania poboczne

`/btw` to szybkie pytanie poboczne o kontekst bieżącej sesji. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

W przeciwieństwie do normalnej wiadomości:

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
    - **Natywne polecenia Telegram:** `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
    - **`/stop`** celuje w aktywną sesję czatu, aby przerwać bieżące uruchomienie.

  </Accordion>
  <Accordion title="Specyfika Slack">
    `channels.slack.slashCommand` obsługuje pojedyncze polecenie w stylu `/openclaw`.
    Przy `commands.native: true` utwórz po jednym poleceniu slash Slack dla każdego wbudowanego
    polecenia. Zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje
    `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.
  </Accordion>
  <Accordion title="Szybka ścieżka i skróty w treści">
    - Wiadomości zawierające tylko polecenie od nadawców z listy dozwolonych są obsługiwane natychmiast (z pominięciem kolejki i modelu).
    - Skróty w treści (`/help`, `/commands`, `/status`, `/whoami`) działają także osadzone w normalnych wiadomościach i są usuwane, zanim model zobaczy pozostały tekst.
    - Nieautoryzowane wiadomości zawierające tylko polecenie są cicho ignorowane; tokeny `/...` w treści są traktowane jako zwykły tekst.

  </Accordion>
  <Accordion title="Uwagi o argumentach">
    - Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (`/think: high`, `/send: on`).
    - `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli brak dopasowania, tekst jest traktowany jako treść wiadomości.
    - `/allowlist add|remove` wymaga `commands.config: true` i respektuje kanałowe `configWrites`.

  </Accordion>
</AccordionGroup>

## Użycie i status dostawcy

- **Użycie/limit dostawcy** (np. „Claude 80% left”) pokazuje się w `/status` dla bieżącego dostawcy modelu, gdy śledzenie użycia jest włączone.
- **Wiersze tokenów/pamięci podręcznej** w `/status` mogą awaryjnie użyć najnowszego wpisu użycia transkrypcji, gdy migawka sesji na żywo jest skąpa.
- **Wykonanie a środowisko uruchomieniowe:** `/status` zgłasza `Execution` dla efektywnej ścieżki sandboxa i `Runtime` dla tego, kto uruchamia sesję: `OpenClaw Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt na odpowiedź:** kontrolowane przez `/usage off|tokens|full`.
- `/model status` dotyczy modeli/uwierzytelniania/punktów końcowych, a nie użycia.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Jak polecenia slash Skills są rejestrowane i bramkowane.
  </Card>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Zbuduj skill, który rejestruje własne polecenie slash.
  </Card>
  <Card title="BTW" href="/pl/tools/btw" icon="comments">
    Pytania poboczne bez zmieniania kontekstu sesji.
  </Card>
  <Card title="Sterowanie" href="/pl/tools/steer" icon="compass">
    Prowadź agenta w trakcie działania za pomocą `/steer`.
  </Card>
</CardGroup>
