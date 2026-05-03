---
read_when:
    - Pierwsza konfiguracja OpenClaw
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-03T21:32:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
będące dowiązaniami symbolicznymi nie są obsługiwane dla zapisów wykonywanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, wskaż `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrola tego, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrojenie sesji, multimediów, sieci lub UI

Zobacz [pełną referencję](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Używaj tej strony jako przewodnika zadaniowego oraz
[referencji konfiguracji](/pl/gateway/configuration-reference) jako szerszej
mapy pól i wartości domyślnych.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby uzyskać kompletne konfiguracje do skopiowania i wklejenia.
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
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadane dokumentacji pól
    `title` / `description` oraz schematy pluginów i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla interfejsów
    szczegółowych i innych narzędzi gateway udostępnia również `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Direct edit">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i stosuje zmiany automatycznie (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmówi uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi szczegółowych. Metadane dokumentacji pól `title`/`description`
przechodzą przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablic (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy pluginów i kanałów czasu wykonania są scalane, gdy
rejestr manifestów jest załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (albo `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną ostatnią znaną dobrą kopię po każdym udanym uruchomieniu,
ale uruchamianie i hot reload nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym walidacji lokalnej dla pluginu), uruchomienie Gateway kończy się niepowodzeniem albo
przeładowanie jest pomijane, a bieżące środowisko wykonawcze zachowuje ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (albo `--yes`), aby naprawić konfigurację z prefiksami/nadpisaniami lub
przywrócić ostatnią znaną dobrą kopię. Awansowanie do ostatniej znanej dobrej kopii jest pomijane, gdy
kandydat zawiera zredagowane placeholdery sekretów, takie jak `***`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
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

  <Accordion title="Choose and configure models">
    Ustaw model podstawowy i opcjonalne modele awaryjne:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do listy dozwolonych bez usuwania istniejących modeli. Zwykłe zastąpienia, które usuwałyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje zmniejszanie obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów wizji w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie awaryjne.
    - Dla niestandardowych/samodzielnie hostowanych dostawców zobacz [niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w referencji.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Dostęp DM jest kontrolowany per kanał za pomocą `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (albo w sparowanym magazynie dozwolonych)
    - `"open"`: zezwól na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` lub list dozwolonych specyficznych dla kanału.

    Zobacz [pełną referencję](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły per kanał.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalania per agent i zostaw widoczne odpowiedzi w pokojach na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

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

    - **Wzmianki w metadanych**: natywne @-wzmianki (wzmianka przez dotknięcie w WhatsApp, @bot w Telegram, itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłek narzędziem wiadomości globalnie; `messages.groupChat.visibleReplies` nadpisuje to dla grup/kanałów.
    - Zobacz [pełną referencję](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania per kanał i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Użyj `agents.defaults.skills` jako współdzielonej bazy, a następnie nadpisuj konkretnych
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

    - Pomiń `agents.defaults.skills`, aby domyślnie zezwolić na Skills bez ograniczeń.
    - Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfiguracja Skills](/pl/tools/skills-config) oraz
      [referencję konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Kontroluj, jak agresywnie gateway restartuje kanały, które wyglądają na nieaktywne:

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
    - `channelStaleEventThresholdMinutes` powinno być większe niż interwał sprawdzania albo równe mu.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania monitora globalnego.
    - Zobacz [kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną referencję](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Daj lokalnym klientom więcej czasu na ukończenie przedautoryzacyjnego uzgadniania WebSocket na
    obciążonych hostach albo hostach o niskiej mocy:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Wartość domyślna to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo dla jednorazowych nadpisań usługi lub powłoki.
    - Najpierw lepiej naprawić zastoje uruchamiania/pętli zdarzeń; to pokrętło jest przeznaczone dla hostów, które są zdrowe, ale wolne podczas rozgrzewania.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Sesje kontrolują ciągłość i izolację rozmowy:

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
    - `threadBindings`: globalne wartości domyślne dla routingu sesji powiązanych z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, linki tożsamości i zasady wysyłania.
    - Zobacz [pełną referencję](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych środowiskach wykonawczych sandbox:

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

    Najpierw zbuduj obraz — z checkoutu źródłowego uruchom `scripts/sandbox-setup.sh`, a w przypadku instalacji z npm zobacz wbudowane polecenie `docker build` w sekcji [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing), a wszystkie opcje w [pełnej dokumentacji referencyjnej](/pl/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Włącz push oparty na przekaźniku dla oficjalnych kompilacji iOS">
    Push oparty na przekaźniku jest konfigurowany w `openclaw.json`.

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

    - Pozwala gateway wysyłać `push.test`, ponaglenia wybudzania i wybudzania ponownego połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłki o zakresie rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu przekaźnika obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na przekaźniku z tożsamością gateway, z którym sparowano aplikację iOS, więc inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na przekaźniku dotyczą tylko oficjalnych dystrybuowanych kompilacji, które zarejestrowały się przez przekaźnik.
    - Musi odpowiadać bazowemu adresowi URL przekaźnika wbudowanemu w oficjalną/TestFlight kompilację iOS, aby ruch rejestracji i wysyłki trafiał do tego samego wdrożenia przekaźnika.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną/TestFlight kompilację iOS, która została skompilowana z tym samym bazowym adresem URL przekaźnika.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w przekaźniku za pomocą App Attest oraz potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na przekaźniku do sparowanego gateway.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłki, a następnie używa ich do `push.test`, ponagleń wybudzania i wybudzań ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie przekaźnika, aplikacja odświeży swoją zbuforowaną rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania przez zmienne środowiskowe.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje awaryjną ścieżką programistyczną tylko dla pętli zwrotnej; nie zapisuj adresów URL przekaźnika HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa przekaźnika.

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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat w stylu DM
    - Pełny przewodnik znajdziesz w [Heartbeat](/pl/gateway/heartbeat).

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

    - `sessionRetention`: usuwa zakończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i zachowanych wierszy.
    - Zobacz [zadania Cron](/pl/automation/cron-jobs), aby poznać omówienie funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooki (hooki)">
    Włącz punkty końcowe HTTP Webhook na Gateway:

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
    - Traktuj całą zawartość ładunków hooków/webhooków jako niezaufane dane wejściowe.
    - Użyj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówek (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj przychodzący ruch webhooków na dedykowanej ścieżce podrzędnej, takiej jak `/hooks`.
    - Pozostaw wyłączone flagi obejścia niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne, nowoczesne poziomy modeli oraz rygorystyczną politykę narzędzi (na przykład tylko obsługa wiadomości oraz sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z oddzielnymi przestrzeniami roboczymi i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) i [pełną dokumentację referencyjną](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań oraz profile dostępu poszczególnych agentów.

  </Accordion>

  <Accordion title="Podziel konfigurację na wiele plików ($include)">
    Użyj `$include`, aby uporządkować duże konfiguracje:

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
    - **Klucze równorzędne**: scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, taką jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwane zapisy przez include**: główne include, tablice include oraz include
      z nadpisaniami równorzędnymi kończą się bezpiecznym błędem dla zapisów należących do OpenClaw zamiast
      spłaszczania konfiguracji
    - **Izolacja**: ścieżki `$include` muszą rozwiązywać się w katalogu zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) do
      dodatkowych katalogów, do których mogą odwoływać się include. Dowiązania symboliczne są rozwiązywane
      i ponownie sprawdzane, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony katalog główny, nadal jest odrzucana.
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Gorące przeładowanie konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest wymagane ręczne ponowne uruchomienie.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustanie tymczasowy zapis/zmiana nazwy wykonywane przez edytor, odczytuje końcowy plik i odrzuca
nieprawidłowe zewnętrzne edycje bez przepisywania `openclaw.json`. Zapisy konfiguracji należące do OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` lub zmniejszenie pliku o ponad połowę, są odrzucane i
zapisywane jako `.rejected.*` do inspekcji.

Jeśli zobaczysz `config reload skipped (invalid config)` albo przy starcie pojawi się `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix` w celu naprawy. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby przejść przez listę kontrolną.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje przy krytycznych. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Rejestruje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
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
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane i pluginowe kanały | Nie               |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie               |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                | Nie               |
| Sesje i wiadomości  | `session`, `messages`                                             | Nie               |
| Narzędzia i media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie               |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                           | Nie               |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**           |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                              | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego widoku
w pamięci. Dzięki temu decyzje o przeładowaniu na gorąco (zastosowanie na gorąco
vs restart) pozostają przewidywalne, nawet gdy pojedyncza sekcja najwyższego
poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się
bezpiecznym niepowodzeniem, jeśli układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

Dla narzędzi zapisujących konfigurację przez API gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu +
  podsumowania elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę oraz `hash`
- `config.patch` do aktualizacji częściowych (JSON merge patch: obiekty są
  scalane, `null` usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz restartu; dołącz `continuationMessage`, gdy sesja po restarcie ma wykonać jedną turę uzupełniającą
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować uruchomioną wersję po restarcie

Agenty powinny traktować `config.schema.lookup` jako pierwszy punkt dla dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacja konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne albo linki do
dedykowanych dokumentacji podsystemów.

<Note>
Zapisy w płaszczyźnie sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania restartu są
łączone, a następnie wymuszają 30-sekundowy czas odnowienia między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administracyjny, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji i końcówki wyjścia poleceń.
</Note>

Przykładowa łatka częściowa:

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
- `~/.openclaw/.env` (globalne rozwiązanie awaryjne)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawić wbudowane zmienne środowiskowe w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
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

<Accordion title="Env var substitution in config values">
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości ciągu znaków konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reguły:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne zgłaszają błąd podczas ładowania
- Ucieczka za pomocą `$${VAR}` daje dosłowny wynik
- Działa wewnątrz plików `$include`
- Podstawianie wbudowane: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdują się w [Zarządzanie sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja

Pełną dokumentację wszystkich pól znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
