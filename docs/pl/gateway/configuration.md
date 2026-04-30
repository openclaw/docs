---
read_when:
    - Pierwsza konfiguracja OpenClaw
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-30T09:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i przecinki końcowe">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
będące dowiązaniami symbolicznymi nie są obsługiwane dla zapisów wykonywanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, ustaw `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Łączenie kanałów i kontrolowanie, kto może wysyłać wiadomości do bota
- Ustawianie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrajanie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference) dla każdego dostępnego pola.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Używaj tej strony jako przewodnika zadaniowego, a
[Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference) jako szerszej
mapy pól i wartości domyślnych.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo zobacz przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby skorzystać z kompletnych konfiguracji do skopiowania.
</Tip>

## Minimalna konfiguracja

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Edytowanie konfiguracji

<Tabs>
  <Tab title="Interaktywny kreator">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (jednolinijkowce)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI sterowania">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    UI sterowania renderuje formularz z aktywnego schematu konfiguracji, w tym metadane dokumentacji pól
    `title` / `description` oraz schematy pluginów i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla szczegółowych
    UI i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i stosuje zmiany automatycznie (zobacz [przeładowanie na gorąco](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, błędne typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez UI sterowania
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi ze szczegółowym przechodzeniem. Metadane dokumentacji pól `title`/`description`
przechodzą przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablic (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy pluginów i kanałów z czasu wykonywania są scalane, gdy
rejestr manifestów zostanie załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną ostatnią działającą kopię po każdym udanym uruchomieniu.
Jeśli `openclaw.json` później nie przejdzie walidacji (albo usunie `gateway.mode`, gwałtownie się
zmniejszy lub będzie miał na początku przypadkową linię logu), OpenClaw zachowa uszkodzony plik
jako `.clobbered.*`, przywróci ostatnią działającą kopię i zapisze powód odzyskiwania
w logach. Następna tura agenta otrzyma też ostrzeżenie w zdarzeniu systemowym, aby główny
agent nie przepisał ślepo przywróconej konfiguracji. Awansowanie do ostatniej działającej kopii
jest pomijane, gdy kandydat zawiera zredagowane symbole zastępcze sekretów, takie jak `***`.
Gdy każdy problem walidacji jest ograniczony do `plugins.entries.<id>...`, OpenClaw
nie wykonuje odzyskiwania całego pliku. Utrzymuje bieżącą konfigurację jako aktywną i
pokazuje lokalny błąd plugina, aby niezgodność schematu plugina lub wersji hosta
nie mogła cofnąć niepowiązanych ustawień użytkownika.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itd.)">
    Każdy kanał ma własną sekcję konfiguracji pod `channels.<provider>`. Zobacz dedykowaną stronę kanału, aby poznać kroki konfiguracji:

    - [WhatsApp](/pl/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/pl/channels/telegram) — `channels.telegram`
    - [Discord](/pl/channels/discord) — `channels.discord`
    - [Feishu](/pl/channels/feishu) — `channels.feishu`
    - [Google Chat](/pl/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/pl/channels/msteams) — `channels.msteams`
    - [Slack](/pl/channels/slack) — `channels.slack`
    - [Signal](/pl/channels/signal) — `channels.signal`
    - [iMessage](/pl/channels/imessage) — `channels.imessage`
    - [Mattermost](/pl/channels/mattermost) — `channels.mattermost`

    Wszystkie kanały współdzielą ten sam wzorzec zasad DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wybierz i skonfiguruj modele">
    Ustaw model główny i opcjonalne modele zapasowe:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych wartości dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do listy dozwolonych bez usuwania istniejących modeli. Zwykłe zamiany, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steruje zmniejszaniem obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają użycie tokenów wizyjnych w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [Przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie modeli zapasowych.
    - Dla niestandardowych/samodzielnie hostowanych dostawców zobacz [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany osobno dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub w sparowanym magazynie zezwoleń)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#dm-and-group-access), aby uzyskać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek na czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalaczy dla każdego agenta i pozostaw widoczne odpowiedzi w pokojach na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Wzmianki w metadanych**: natywne @-wzmianki (WhatsApp stuknij-aby-wspomnieć, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłek przez narzędzie wiadomości globalnie; `messages.groupChat.visibleReplies` nadpisuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania dla poszczególnych kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Ogranicz Skills dla każdego agenta">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisz określonych
    agentów za pomocą `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać Skills.
    - Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz
      [Dokumentację referencyjną konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrój monitorowanie kondycji kanałów Gateway">
    Kontroluj, jak agresywnie Gateway restartuje kanały, które wyglądają na nieaktualne:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitora kondycji.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania monitora globalnego.
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Dostrój limit czasu uzgadniania WebSocket w Gateway">
    Daj lokalnym klientom więcej czasu na ukończenie przeduwierzytelnieniowego uzgadniania WebSocket na
    obciążonych lub słabszych hostach:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Wartość domyślna to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo dla jednorazowych nadpisań usługi lub powłoki.
    - Najpierw preferuj naprawę zacięć uruchamiania/pętli zdarzeń; to pokrętło jest przeznaczone dla hostów, które są zdrowe, ale wolne podczas rozgrzewania.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowania">
    Sesje kontrolują ciągłość i izolację konwersacji:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (wspólny) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne dla routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych środowiskach uruchomieniowych sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Najpierw zbuduj obraz: `scripts/sandbox-setup.sh`

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby uzyskać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz powiadomienia push oparte na przekaźniku dla oficjalnych kompilacji iOS">
    Powiadomienia push oparte na przekaźniku konfiguruje się w `openclaw.json`.

    Ustaw to w konfiguracji gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Odpowiednik w CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Co to robi:

    - Pozwala gateway wysyłać `push.test`, sygnały wybudzenia oraz wybudzenia ponownego połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu przekaźnika obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na przekaźniku z tożsamością gateway, z którą sparowano aplikację iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na przekaźniku dotyczą tylko oficjalnych dystrybuowanych kompilacji zarejestrowanych przez przekaźnik.
    - Musi odpowiadać bazowemu URL przekaźnika wbudowanemu w oficjalną/TestFlight kompilację iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia przekaźnika.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną/TestFlight kompilację iOS skompilowaną z tym samym bazowym URL przekaźnika.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w przekaźniku przy użyciu App Attest oraz pokwitowania aplikacji, a następnie publikuje do sparowanego gateway ładunek `push.apns.register` oparty na przekaźniku.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłania, a następnie używa ich do `push.test`, sygnałów wybudzenia i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie przekaźnika, aplikacja odświeży swoją buforowaną rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyjściem awaryjnym wyłącznie do pracy deweloperskiej na local loopback; nie zapisuj URL-i przekaźnika HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Uwierzytelnianie i przepływ zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa przekaźnika.

  </Accordion>

  <Accordion title="Skonfiguruj Heartbeat (okresowe zgłoszenia)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: ciąg czasu trwania (`30m`, `2h`). Ustaw `0m`, aby wyłączyć.
    - `target`: `last` | `none` | `<channel-id>` (na przykład `discord`, `matrix`, `telegram` lub `whatsapp`)
    - `directPolicy`: `allow` (domyślnie) albo `block` dla celów Heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby uzyskać pełny przewodnik.

  </Accordion>

  <Accordion title="Skonfiguruj zadania Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: usuwa ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i zachowanych wierszy.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby uzyskać omówienie funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooks (hooks)">
    Włącz endpointy HTTP Webhook na Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Uwaga dotycząca bezpieczeństwa:
    - Traktuj całą zawartość ładunku hook/webhook jako niezaufane dane wejściowe.
    - Użyj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hook działa tylko przez nagłówki (`Authorization: Bearer ...` albo `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj ruch przychodzący webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obchodzenia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych przez hook preferuj mocne nowoczesne poziomy modeli i rygorystyczną politykę narzędzi (na przykład tylko komunikacja oraz sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z oddzielnymi obszarami roboczymi i sesjami:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Zobacz [Wielu agentów](/pl/concepts/multi-agent) i [pełną dokumentację referencyjną](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu dla poszczególnych agentów.

  </Accordion>

  <Accordion title="Podziel konfigurację na wiele plików ($include)">
    Użyj `$include`, aby organizować duże konfiguracje:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Jeden plik**: zastępuje zawierający go obiekt
    - **Tablica plików**: głęboko scalana w kolejności (późniejsze wygrywają)
    - **Klucze równorzędne**: scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      wspartą przez include pojedynczego pliku, taki jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany zapis przez include**: include w katalogu głównym, tablice include oraz include
      z nadpisaniami równorzędnymi kończą się bezpiecznym niepowodzeniem dla zapisów należących do OpenClaw zamiast
      spłaszczać konfigurację
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Gorące przeładowanie konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż uspokoi się tworzenie tymczasowych zapisów/zmian nazw przez edytor, odczytuje końcowy plik i odrzuca
nieprawidłowe edycje zewnętrzne, przywracając ostatnią znaną dobrą konfigurację. Zapisy konfiguracji należące do OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` albo zmniejszenie pliku o ponad połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Wyjątkiem są lokalne błędy walidacji Plugin: jeśli wszystkie problemy znajdują się pod
`plugins.entries.<id>...`, przeładowanie zachowuje bieżącą konfigurację i zgłasza problem Plugin
zamiast przywracać `.last-good`.

Jeśli w logach zobaczysz `Config auto-restored from last-known-good` albo
`config reload restored last-known-good config`, sprawdź odpowiadający plik
`.clobbered.*` obok `openclaw.json`, napraw odrzucony ładunek, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby uzyskać listę kontrolną odzyskiwania.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast gorąco stosuje bezpieczne zmiany. Automatycznie restartuje przy krytycznych. |
| **`hot`**              | Gorąco stosuje tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.                 |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną obowiązywać przy następnym ręcznym restarcie.   |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria           | Pola                                                              | Wymagany restart? |
| ------------------- | ----------------------------------------------------------------- | ----------------- |
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane i Plugin kanały | Nie             |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie               |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                | Nie               |
| Sesje i wiadomości  | `session`, `messages`                                             | Nie               |
| Narzędzia i media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie               |
| UI i pozostałe      | `ui`, `logging`, `identity`, `bindings`                           | Nie               |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**           |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                              | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
ponowne wczytanie na podstawie układu zapisanego w źródle, a nie spłaszczonego
widoku w pamięci. Dzięki temu decyzje hot-reload (zastosowanie na gorąco kontra
restart) pozostają przewidywalne nawet wtedy, gdy pojedyncza sekcja najwyższego
poziomu znajduje się w osobnym dołączanym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie ponownego wczytania kończy się bezpieczną odmową, jeśli
układ źródła jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi zapisujących konfigurację przez API gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę oraz `hash`
- `config.patch` do aktualizacji częściowych (JSON merge patch: obiekty są scalane, `null` usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz restartu
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować działającą wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt dla dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
odniesień podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszają 30-sekundowe wyciszenie między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administracyjny, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji oraz końcówki danych wyjściowych poleceń.
</Note>

Przykładowa częściowa poprawka:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zarówno `config.apply`, jak i `config.patch` akceptują `raw`, `baseHash`, `sessionKey`,
`note` oraz `restartDelayMs`. `baseHash` jest wymagany dla obu metod, gdy
konfiguracja już istnieje.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalna rezerwa)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz także ustawić zmienne środowiskowe inline w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import środowiska powłoki (opcjonalnie)">
  Jeśli jest włączony, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik zmiennej środowiskowej: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych środowiskowych w wartościach konfiguracji">
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości tekstowej konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne zgłaszają błąd podczas wczytywania
- Użyj ucieczki `$${VAR}`, aby uzyskać dosłowny wynik
- Działa wewnątrz plików `$include`
- Podstawianie inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencje sekretów (env, file, exec)">
  W przypadku pól obsługujących obiekty SecretRef możesz użyć:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdują się w [Zarządzaniu sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchni poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby poznać pełny priorytet i źródła.

## Pełna dokumentacja

Pełną dokumentację pól znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
