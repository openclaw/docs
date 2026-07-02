---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-02T08:55:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy z dowiązaniem symbolicznym `openclaw.json`
nie są obsługiwane dla zapisów należących do OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, wskaż `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli brakuje pliku, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrola, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostosowanie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację](/pl/gateway/configuration-reference), aby poznać każde dostępne pole.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Używaj tej strony jako poradnika zadaniowego, a
[Configuration reference](/pl/gateway/configuration-reference) jako szerszej
mapy pól i wartości domyślnych.

<Tip>
**Dopiero zaczynasz konfigurację?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Configuration Examples](/pl/gateway/configuration-examples) z kompletnymi konfiguracjami do skopiowania.
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
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadanych dokumentacji pól
    `title` / `description` oraz schematów Plugin i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla interfejsów
    z nawigacją w głąb i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki wraz z podsumowaniami bezpośrednich elementów potomnych.
  </Tab>
  <Tab title="Direct edit">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmówi uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączyć metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów potomnych dla narzędzi z nawigacją w głąb. Metadane dokumentacji pól `title`/`description`
przechodzą przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablicy (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy Plugin i kanałów środowiska uruchomieniowego są scalane, gdy
rejestr manifestów jest załadowany.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchamia
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway zachowuje zaufaną ostatnią znaną dobrą kopię po każdym udanym uruchomieniu,
ale uruchomienie i hot reload nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym walidacji lokalnej dla Plugin), uruchomienie Gateway kończy się niepowodzeniem albo
przeładowanie zostaje pominięte, a bieżące środowisko uruchomieniowe zachowuje ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (lub `--yes`), aby naprawić konfigurację z prefiksami/nadpisaną albo
przywrócić ostatnią znaną dobrą kopię. Promocja do ostatniej znanej dobrej jest pomijana, gdy
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

    Wszystkie kanały mają ten sam wzorzec zasad DM:

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
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy listy dozwolonych bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje zmniejszanie obrazów z transkrypcji/narzędzi (domyślnie `1200`); niższe wartości zwykle ograniczają użycie tokenów vision w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie zapasowe.
    - Dla niestandardowych/samodzielnie hostowanych dostawców zobacz [Custom providers](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Dostęp DM jest kontrolowany dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub w sparowanym magazynie zezwoleń)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` lub list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalaczy dla każdego agenta. Normalne odpowiedzi w grupach/kanałach są publikowane automatycznie; włącz ścieżkę narzędzia wiadomości dla współdzielonych pokojów, w których agent powinien decydować, kiedy się odezwać:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Wzmianki metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłania przez narzędzie wiadomości globalnie; `messages.groupChat.visibleReplies` nadpisuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania dla poszczególnych kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisz konkretnych
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
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config) oraz
      [Configuration Reference](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Health Checks](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Daj klientom lokalnym więcej czasu na ukończenie przeduwierzytelnieniowego uzgadniania WebSocket na
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
    - Najpierw preferuj naprawę zacięć uruchamiania/pętli zdarzeń; ta opcja jest przeznaczona dla hostów, które są zdrowe, ale wolne podczas rozgrzewki.

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

    - `dmScope`: `main` (współdzielone) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz izolację w piaskownicy">
    Uruchamiaj sesje agentów w izolowanych środowiskach piaskownicy:

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

    Najpierw zbuduj obraz - z checkoutu źródeł uruchom `scripts/sandbox-setup.sh`, a w przypadku instalacji z npm zobacz wbudowane polecenie `docker build` w sekcji [Izolacja w piaskownicy § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Zobacz [Izolacja w piaskownicy](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na przekaźniku dla oficjalnych buildów iOS">
    Push oparty na przekaźniku dla publicznych buildów App Store używa hostowanego przekaźnika OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Niestandardowe wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki buildu/wdrożenia iOS, której adres URL przekaźnika pasuje do adresu URL przekaźnika Gateway. Jeśli używasz niestandardowego buildu przekaźnika, ustaw to w konfiguracji gateway:

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

    Odpowiednik CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Co to robi:

    - Pozwala gateway wysyłać `push.test`, impulsy wybudzające i wybudzenia ponownego połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu przekaźnika obowiązującego dla całego wdrożenia.
    - Wiąże każdą rejestrację opartą na przekaźniku z tożsamością gateway, z którą sparowano aplikację iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne buildy iOS przy bezpośrednim APNs. Wysyłki oparte na przekaźniku dotyczą tylko oficjalnie dystrybuowanych buildów zarejestrowanych przez przekaźnik.
    - Musi pasować do bazowego adresu URL przekaźnika wbudowanego w build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia przekaźnika.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną aplikację iOS.
    2. Opcjonalnie: skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway tylko wtedy, gdy używasz celowo oddzielnego niestandardowego buildu przekaźnika.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom Node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w przekaźniku za pomocą App Attest oraz potwierdzenia aplikacji, a następnie publikuje oparty na przekaźniku ładunek `push.apns.register` do sparowanego gateway.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłania, a następnie używa ich dla `push.test`, impulsów wybudzających i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym gateway.
    - Jeśli wydasz nowy build iOS wskazujący na inne wdrożenie przekaźnika, aplikacja odświeży swoją zbuforowaną rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - Niestandardowe adresy URL przekaźnika gateway muszą pasować do bazowego adresu URL przekaźnika wbudowanego w build iOS. Publiczna ścieżka wydania App Store odrzuca niestandardowe nadpisania adresu URL przekaźnika iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie deweloperską furtką dla local loopback; nie zapisuj adresów URL przekaźnika HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Uwierzytelnianie i przepływ zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa przekaźnika.

  </Accordion>

  <Accordion title="Skonfiguruj Heartbeat (okresowe odprawy)">
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
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: usuwa ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: usuwa zachowane wiersze historii uruchomień Cron dla każdego zadania. `maxBytes` pozostaje akceptowane dla starszych dzienników uruchomień opartych na plikach.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać omówienie funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooks (hooki)">
    Włącz punkty końcowe HTTP Webhook w Gateway:

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
    - Traktuj całą treść ładunków hook/webhook jako niezaufane dane wejściowe.
    - Użyj dedykowanego `hooks.token`; nie używaj ponownie aktywnych sekretów uwierzytelniania Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Uwierzytelnianie hooków odbywa się wyłącznie przez nagłówki (`Authorization: Bearer ...` albo `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj ruch wejściowy webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw wyłączone flagi obejścia niebezpiecznej treści (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - W przypadku agentów sterowanych hookami preferuj mocne nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko komunikacja plus izolacja w piaskownicy tam, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację Gmail.

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

    - **Pojedynczy plik**: zastępuje zawierający go obiekt
    - **Tablica plików**: scalana głęboko w kolejności (późniejsze wygrywają)
    - **Klucze równorzędne**: scalane po include (nadpisują wartości z include)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku zawierającego include
    - **Format ścieżki**: ścieżki include nie mogą zawierać bajtów null i muszą być ściśle krótsze niż 4096 znaków przed rozwiązaniem i po nim
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwane zapisy przez include**: include na poziomie root, tablice include oraz include
      z nadpisaniami równorzędnymi kończą się zamkniętą odmową dla zapisów należących do OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) dodatkowych
      katalogów, do których mogą odwoływać się include. Dowiązania symboliczne są rozwiązywane
      i sprawdzane ponownie, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony root, nadal jest odrzucana.
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania, cyklicznych include, nieprawidłowego formatu ścieżki i nadmiernej długości

  </Accordion>
</AccordionGroup>

## Gorące przeładowanie konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany - dla większości ustawień nie jest wymagany ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż zakończy się seria tymczasowych zapisów/zmian nazw edytora, odczytuje finalny plik i odrzuca
nieprawidłowe zewnętrzne edycje bez przepisywania `openclaw.json`. Zapisy konfiguracji należące do OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` lub zmniejszenie pliku o ponad połowę, są odrzucane i
zapisywane jako `.rejected.*` do sprawdzenia.

Jeśli zobaczysz `config reload skipped (invalid config)` albo uruchamianie zgłosi `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix`, aby naprawić. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby przejść przez listę kontrolną.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje przy krytycznych zmianach. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Rejestruje ostrzeżenie, gdy potrzebny jest restart - obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.               |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną obowiązywać przy następnym ręcznym restarcie. |

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
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanały              | `channels.*`, `web` (WhatsApp) - wszystkie wbudowane kanały i kanały Plugin | Nie              |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie              |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                | Nie              |
| Sesje i wiadomości  | `session`, `messages`                                             | Nie              |
| Narzędzia i media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie              |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                           | Nie              |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**         |
| Infrastruktura      | `discovery`, `plugins`                                            | **Tak**         |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami - ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje hot-reload (zastosowanie na gorąco kontra restart) pozostają przewidywalne nawet wtedy, gdy
pojedyncza sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się odmową, jeśli
układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

Dla narzędzi zapisujących konfigurację przez API Gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania
  elementów podrzędnych)
- `config.get`, aby pobrać bieżący snapshot oraz `hash`
- `config.patch` do częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice są zastępowane po jawnym potwierdzeniu za pomocą `replacePaths`, jeśli
  wpisy miałyby zostać usunięte)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji wraz z restartem; dołącz `continuationMessage`, gdy sesja po restarcie powinna wykonać jedną kolejną turę
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować uruchomioną wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt dostępu do dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
odniesień podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszają 30-sekundowy czas oczekiwania między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administracyjny, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji i końcówki wyjścia poleceń.
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

`config.patch` akceptuje także `replacePaths`, tablicę ścieżek konfiguracji, których zastąpienie tablicy
jest zamierzone. Jeśli poprawka zastąpiłaby lub usunęła istniejącą tablicę
z mniejszą liczbą wpisów, Gateway odrzuca zapis, chyba że dokładna ścieżka znajduje się
w `replacePaths`; zagnieżdżone tablice pod wpisami tablic używają `[]`, na przykład
`agents.list[].skills`. Zapobiega to cichemu nadpisaniu tablic routingu lub list dozwolonych
przez obcięte snapshoty `config.get`. Użyj `config.apply`, gdy
zamierzasz zastąpić pełną konfigurację.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalny fallback)

Żaden z tych plików nie zastępuje istniejących zmiennych środowiskowych. Możesz także ustawić wbudowane zmienne środowiskowe w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import środowiska powłoki (opcjonalny)">
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

Reguły:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne zgłaszają błąd podczas ładowania
- Ucieczka za pomocą `$${VAR}` daje wynik literalny
- Działa wewnątrz plików `$include`
- Podstawianie wbudowane: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Odwołania do sekretów (env, file, exec)">
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

## Pełna dokumentacja

Pełną dokumentację wszystkich pól znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
