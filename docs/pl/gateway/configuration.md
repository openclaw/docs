---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-10T19:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy z dowiązaniem symbolicznym `openclaw.json`
nie są obsługiwane dla zapisów należących do OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, wskaż `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrola, kto może pisać do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrojenie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Użyj tej strony jako
wskazówek zadaniowych, a [dokumentacji konfiguracji](/pl/gateway/configuration-reference)
jako szerszej mapy pól i wartości domyślnych.

<Tip>
**Zaczynasz od konfiguracji?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples) z kompletnymi konfiguracjami do skopiowania.
</Tip>

## Minimalna konfiguracja

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Edycja konfiguracji

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym
    metadane dokumentacji pól `title` / `description` oraz schematy pluginów i kanałów, gdy
    są dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla interfejsów
    szczegółowych i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Direct edit">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje w pełni zgodne ze schematem. Nieznane klucze, nieprawidłowo sformatowane typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi szczegółowych. Metadane dokumentacji pól
`title`/`description` są przenoszone przez zagnieżdżone obiekty, wildcard (`*`), elementy tablicy (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy runtime pluginów i kanałów są scalane po załadowaniu
rejestru manifestów.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną ostatnią znaną dobrą kopię po każdym udanym uruchomieniu,
ale uruchamianie i hot reload nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym walidacji lokalnej dla pluginu), uruchomienie Gateway kończy się niepowodzeniem albo
przeładowanie jest pomijane, a bieżący runtime zachowuje ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (lub `--yes`), aby naprawić konfigurację z prefiksami/nadpisaną albo
przywrócić ostatnią znaną dobrą kopię. Awans do ostatniej znanej dobrej kopii jest pomijany, gdy
kandydat zawiera zredagowane placeholdery sekretów, takie jak `***`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Każdy kanał ma własną sekcję konfiguracji pod `channels.<provider>`. Zobacz dedykowaną stronę kanału, aby poznać kroki konfiguracji:

    - [WhatsApp](/pl/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/pl/channels/telegram) - `channels.telegram`
    - [Discord](/pl/channels/discord) - `channels.discord`
    - [Feishu](/pl/channels/feishu) - `channels.feishu`
    - [Google Chat](/pl/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/pl/channels/msteams) - `channels.msteams`
    - [Slack](/pl/channels/slack) - `channels.slack`
    - [Signal](/pl/channels/signal) - `channels.signal`
    - [iMessage](/pl/channels/imessage) - `channels.imessage`
    - [Mattermost](/pl/channels/mattermost) - `channels.mattermost`

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

  <Accordion title="Choose and configure models">
    Ustaw model podstawowy i opcjonalne modele zapasowe:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych dla `/model`; wpisy `provider/*` filtrują `/model`, `/models` i selektory modeli do wybranych dostawców, nadal korzystając z dynamicznego wykrywania modeli.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do listy dozwolonych bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje zmniejszanie obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów wizji w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [Przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie modeli zapasowych.
    - Dla niestandardowych/samodzielnie hostowanych dostawców zobacz [Dostawcy niestandardowi](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Dostęp DM jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub sparowanym magazynie zezwoleń)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły per kanał.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalania per agent i pozostaw widoczne odpowiedzi w pokoju na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

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

    - **Wzmianki w metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itp.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłania przez narzędzie wiadomości globalnie; `messages.groupChat.visibleReplies` nadpisuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisz konkretnych
    agentów przez `agents.list[].skills`:

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
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [dokumentację konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Kontroluj, jak agresywnie Gateway restartuje kanały, które wyglądają na przestarzałe:

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
    - Użyj `channels.<provider>.healthMonitor.enabled` albo `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację](/pl/gateway/configuration-reference#gateway) dla wszystkich pól.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Daj lokalnym klientom więcej czasu na ukończenie przeduwierzytelnieniowego uzgadniania WebSocket na
    obciążonych lub mniej wydajnych hostach:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Domyślna wartość to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo dla jednorazowych nadpisań usługi lub powłoki.
    - Najpierw preferuj naprawę zacięć uruchamiania/pętli zdarzeń; to pokrętło jest dla hostów, które są zdrowe, ale wolne podczas rozgrzewania.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Sesje kontrolują ciągłość i izolację rozmów:

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

    - `dmScope`: `main` (wspólne) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne routingu sesji powiązanych z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz izolację w sandboxie">
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

    Najpierw zbuduj obraz - ze sklonowanych źródeł uruchom `scripts/sandbox-setup.sh`, a w przypadku instalacji z npm zobacz wbudowane polecenie `docker build` w sekcji [Izolacja w sandboxie § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Zobacz [Izolacja w sandboxie](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz powiadomienia push oparte na przekaźniku dla oficjalnych kompilacji iOS">
    Powiadomienia push oparte na przekaźniku są konfigurowane w `openclaw.json`.

    Ustaw to w konfiguracji Gateway:

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

    - Pozwala Gateway wysyłać `push.test`, sygnały wybudzające i wybudzenia do ponownego połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu przekaźnika dla całego wdrożenia.
    - Wiąże każdą rejestrację opartą na przekaźniku z tożsamością Gateway, z którą sparowano aplikację iOS, więc inny Gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na przekaźniku dotyczą tylko oficjalnych dystrybuowanych kompilacji, które zarejestrowały się przez przekaźnik.
    - Musi pasować do bazowego URL przekaźnika wbudowanego w oficjalną kompilację iOS/TestFlight, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia przekaźnika.

    Przepływ od początku do końca:

    1. Zainstaluj oficjalną kompilację iOS lub kompilację z TestFlight skompilowaną z tym samym bazowym URL przekaźnika.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w Gateway.
    3. Sparuj aplikację iOS z Gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość Gateway, rejestruje się w przekaźniku przy użyciu App Attest wraz z pokwitowaniem aplikacji, a następnie publikuje oparty na przekaźniku ładunek `push.apns.register` do sparowanego Gateway.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie do wysyłania, a następnie używa ich dla `push.test`, sygnałów wybudzających i wybudzeń do ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny Gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym Gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie przekaźnika, aplikacja odświeży swoją buforowaną rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje deweloperskim obejściem tylko dla local loopback; nie zapisuj adresów URL przekaźnika HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ od początku do końca, oraz [Uwierzytelnianie i przepływ zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa przekaźnika.

  </Accordion>

  <Accordion title="Skonfiguruj Heartbeat (okresowe meldunki)">
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
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby poznać pełny przewodnik.

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
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowanych wierszy.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać opis funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhook (hooki)">
    Włącz punkty końcowe HTTP typu Webhook w Gateway:

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
    - Traktuj całą zawartość ładunków hook/Webhook jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówek (`Authorization: Bearer ...` albo `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może być `/`; trzymaj ruch przychodzący Webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw wyłączone flagi obchodzenia niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne nowoczesne klasy modeli i ścisłe zasady narzędzi (na przykład tylko wiadomości plus izolacja w sandboxie, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z osobnymi obszarami roboczymi i sesjami:

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
    Użyj `$include`, aby porządkować duże konfiguracje:

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

    - **Pojedynczy plik**: zastępuje obiekt zawierający
    - **Tablica plików**: głęboko scalana w kolejności (późniejsze wygrywają)
    - **Klucze równorzędne**: scalane po dołączeniach (nadpisują dołączone wartości)
    - **Zagnieżdżone dołączenia**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy wykonywane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na dołączeniu pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany zapis przez include**: dołączenia główne, tablice dołączeń i dołączenia
      z nadpisaniami przez klucze równorzędne kończą się bezpieczną odmową dla zapisów wykonywanych przez OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby udostępnić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) do
      dodatkowych katalogów, do których dołączenia mogą się odwoływać. Dowiązania symboliczne są rozwiązywane
      i sprawdzane ponownie, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony katalog główny, nadal jest odrzucana.
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych dołączeń

  </Accordion>
</AccordionGroup>

## Gorące przeładowanie konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany - w przypadku większości ustawień ręczny restart nie jest potrzebny.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż seria tymczasowych zapisów/zmian nazw edytora się ustabilizuje, odczytuje końcowy plik i odrzuca
nieprawidłowe zewnętrzne edycje bez przepisywania `openclaw.json`. Zapisy konfiguracji
wykonywane przez OpenClaw używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` albo zmniejszenie pliku o ponad połowę, są odrzucane i
zapisywane jako `.rejected.*` do inspekcji.

Jeśli zobaczysz `config reload skipped (invalid config)` albo start zgłosi `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix`, aby naprawić. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby poznać listę kontrolną.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje przy zmianach krytycznych. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy restart jest potrzebny - restart wykonujesz samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, niezależnie od tego, czy jest bezpieczna. |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczynają obowiązywać przy następnym ręcznym restarcie. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                            | Wymagany restart? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanały            | `channels.*`, `web` (WhatsApp) - wszystkie wbudowane kanały i kanały typu Plugin | Nie              |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie              |
| Automatyzacja          | `hooks`, `cron`, `agent.heartbeat`                                | Nie              |
| Sesje i wiadomości | `session`, `messages`                                             | Nie              |
| Narzędzia i media       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie              |
| UI i różne           | `ui`, `logging`, `identity`, `bindings`                           | Nie              |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**         |
| Infrastruktura      | `discovery`, `plugins`                                            | **Tak**         |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami - ich zmiana **nie** wywołuje restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje dotyczące hot reloadu (hot-apply kontra restart) pozostają przewidywalne
nawet wtedy, gdy pojedyncza sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku,
takim jak `plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się
bezpieczną odmową, jeśli układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi zapisujących konfigurację przez API Gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania
  elementów podrzędnych)
- `config.get`, aby pobrać bieżący zrzut oraz `hash`
- `config.patch` do częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji z restartem; dołącz `continuationMessage`, gdy sesja po restarcie ma wykonać jedną kolejną turę
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować uruchomioną wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt dla dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
dokumentacji referencyjnych podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszają 30-sekundowy czas odnowienia między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administracyjny, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji i końcówki wyjścia poleceń.
</Note>

Przykład częściowej poprawki:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zarówno `config.apply`, jak i `config.patch` akceptują `raw`, `baseHash`, `sessionKey`,
`note` oraz `restartDelayMs`. `baseHash` jest wymagane dla obu metod, gdy konfiguracja
już istnieje.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalna rezerwa)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz także ustawić wbudowane zmienne środowiskowe w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import środowiska powłoki (opcjonalny)">
  Jeśli ta opcja jest włączona, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia powłokę logowania i importuje tylko brakujące klucze:

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

Reguły:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne zgłaszają błąd podczas ładowania
- Ucieknij za pomocą `$${VAR}`, aby uzyskać dosłowne wyjście
- Działa wewnątrz plików `$include`
- Podstawianie wbudowane: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencje sekretów (env, file, exec)">
  Dla pól obsługujących obiekty SecretRef możesz użyć:

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

## Pełna dokumentacja referencyjna

Pełną dokumentację referencyjną pole po polu znajdziesz w **[Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) · [Diagnostyka](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Procedura operacyjna Gateway](/pl/gateway)
