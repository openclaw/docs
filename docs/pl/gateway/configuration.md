---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnego opisu参考'
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-27T17:32:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
będące dowiązaniami symbolicznymi nie są obsługiwane dla zapisów wykonywanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, ustaw `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączanie kanałów i kontrolowanie, kto może pisać do bota
- Ustawianie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrajanie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference) wszystkich dostępnych pól.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby przed edycją konfiguracji
uzyskać dokładną dokumentację na poziomie pól. Użyj tej strony do wskazówek zorientowanych na zadania oraz
[Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference) do szerszej
mapy pól i wartości domyślnych.

<Tip>
**Nowy w konfiguracji?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples) z kompletnymi konfiguracjami do skopiowania.
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
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Konfiguracja**.
    Control UI renderuje formularz z aktywnego schematu konfiguracji, w tym metadane dokumentacji pól
    `title` / `description` oraz schematy Plugin i kanałów, gdy są
    dostępne, z edytorem **Surowy JSON** jako wyjściem awaryjnym. Dla interfejsów
    pogłębionych i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Direct edit">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [przeładowanie na gorąco](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje w pełni zgodne ze schematem. Nieznane klucze, nieprawidłowo sformatowane typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi pogłębionych. Metadane dokumentacji pól `title`/`description`
przechodzą przez zagnieżdżone obiekty, wildcard (`*`), elementy tablicy (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy Plugin i kanałów z runtime są scalane, gdy
rejestr manifestów jest załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną kopię ostatniej poprawnej konfiguracji po każdym udanym uruchomieniu,
ale uruchomienie i przeładowanie na gorąco nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym lokalnej walidacji Plugin), uruchomienie Gateway nie powiedzie się albo
przeładowanie zostanie pominięte, a bieżący runtime zachowa ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (lub `--yes`), aby naprawić konfigurację z prefiksem/nadpisaną albo
przywrócić ostatnią poprawną kopię. Promowanie do ostatniej poprawnej konfiguracji jest pomijane, gdy
kandydat zawiera zredagowane symbole zastępcze sekretów, takie jak `***`.

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako allowlista dla `/model`; wpisy `provider/*` filtrują `/model`, `/models` i selektory modeli do wybranych dostawców, nadal używając dynamicznego wykrywania modeli.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy allowlisty bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje zmniejszanie rozmiaru obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle ograniczają zużycie tokenów wizji w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [Przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie zapasowe.
    - W przypadku niestandardowych/samodzielnie hostowanych dostawców zobacz [Niestandardowych dostawców](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Dostęp DM jest kontrolowany dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (albo w sparowanym magazynie zezwoleń)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo allowlist specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalaczy dla każdego agenta. Zwykłe odpowiedzi grupowe/kanałowe są publikowane automatycznie; włącz ścieżkę narzędzia wiadomości dla współdzielonych pokojów, w których agent powinien decydować, kiedy się odezwać:

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

    - **Wzmianki z metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłek przez narzędzie wiadomości globalnie; `messages.groupChat.visibleReplies` zastępuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, zastąpienia dla kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Użyj `agents.defaults.skills` jako wspólnej podstawy, a następnie nadpisz konkretnych
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

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych skills.
    - Zobacz [Skills](/pl/tools/skills), [Konfigurację Skills](/pl/tools/skills-config) oraz
      [Dokumentację referencyjną konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitora zdrowia.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` albo `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Kontrole zdrowia](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway) wszystkich pól.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Daj lokalnym klientom więcej czasu na ukończenie przedautoryzacyjnego uzgadniania WebSocket na
    obciążonych lub słabszych hostach:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Wartość domyślna to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo dla jednorazowych zastąpień usługi lub powłoki.
    - Najpierw preferuj naprawę zacięć uruchamiania/pętli zdarzeń; to pokrętło jest dla hostów, które są zdrowe, ale powolne podczas rozgrzewania.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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
    - Zobacz [pełną dokumentację](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych środowiskach sandbox:

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

    Najpierw zbuduj obraz - z checkoutu źródeł uruchom `scripts/sandbox-setup.sh`, a przy instalacji z npm zobacz wbudowane polecenie `docker build` w sekcji [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push przez przekaźnik dla oficjalnych buildów iOS">
    Push przez przekaźnik dla publicznych buildów App Store/TestFlight używa hostowanego przekaźnika OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Niestandardowe wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki buildu/wdrożenia iOS, w której adres URL przekaźnika odpowiada adresowi URL przekaźnika gateway. Jeśli używasz niestandardowego buildu przekaźnika, ustaw to w konfiguracji gateway:

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

    - Pozwala gateway wysyłać `push.test`, powiadomienia wybudzające i wybudzenia ponownego połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokena przekaźnika dla całego wdrożenia.
    - Wiąże każdą rejestrację obsługiwaną przez przekaźnik z tożsamością gateway, z którą sparowano aplikację iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne buildy iOS przy bezpośrednim APNs. Wysyłki przez przekaźnik dotyczą tylko oficjalnie dystrybuowanych buildów, które zarejestrowały się przez przekaźnik.
    - Musi odpowiadać bazowemu adresowi URL przekaźnika wbudowanemu w build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia przekaźnika.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS.
    2. Opcjonalnie: skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway tylko wtedy, gdy używasz celowo oddzielnego niestandardowego buildu przekaźnika.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w przekaźniku z użyciem App Attest oraz potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` obsługiwany przez przekaźnik do sparowanego gateway.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłania, a następnie używa ich dla `push.test`, powiadomień wybudzających i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym gateway.
    - Jeśli wydasz nowy build iOS wskazujący inne wdrożenie przekaźnika, aplikacja odświeży swoją buforowaną rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - Niestandardowe adresy URL przekaźnika gateway muszą odpowiadać bazowemu adresowi URL przekaźnika wbudowanemu w build iOS. Publiczna ścieżka wydań App Store odrzuca niestandardowe nadpisania adresu URL przekaźnika iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje furtką deweloperską wyłącznie dla local loopback; nie zapisuj adresów URL przekaźnika HTTP w konfiguracji.

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
    - `directPolicy`: `allow` (domyślnie) albo `block` dla celów heartbeat w stylu DM
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

    - `sessionRetention`: usuwa zakończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: usuwa zachowane wiersze historii uruchomień cron dla każdego zadania. `maxBytes` pozostaje akceptowane dla starszych dzienników uruchomień opartych na plikach.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać omówienie funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhooki (hooki)">
    Włącz punkty końcowe HTTP webhooków w Gateway:

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
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie aktywnych sekretów uwierzytelniania Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Uwierzytelnianie hooków działa tylko przez nagłówek (`Authorization: Bearer ...` albo `x-openclaw-token`); tokeny w query stringu są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj wejście webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne, nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmailem.

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

    Zobacz [Wielu agentów](/pl/concepts/multi-agent) i [pełną dokumentację](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły wiązania i profile dostępu dla poszczególnych agentów.

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
    - **Tablica plików**: głęboko scalana w kolejności (późniejszy wygrywa)
    - **Klucze równorzędne**: scalane po include'ach (nadpisują dołączone wartości)
    - **Zagnieżdżone include'y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Format ścieżki**: ścieżki include nie mogą zawierać bajtów null i muszą mieć ściśle mniej niż 4096 znaków przed rozwiązaniem i po nim
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany zapis przez include**: include'y w katalogu głównym, tablice include oraz include'y
      z nadpisaniami równorzędnymi kończą się bezpiecznym niepowodzeniem dla zapisów należących do OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) dodatkowych
      katalogów, do których include'y mogą się odwoływać. Symlinki są rozwiązywane
      i ponownie sprawdzane, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony root, nadal zostanie odrzucona.
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania, cyklicznych include'ów, nieprawidłowego formatu ścieżki i nadmiernej długości

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany - dla większości ustawień nie jest wymagane ręczne ponowne uruchomienie.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustanie tymczasowy zapis/zmiana nazwy wykonywana przez edytor, odczytuje finalny plik i odrzuca
nieprawidłowe zewnętrzne edycje bez ponownego zapisywania `openclaw.json`. Zapisy konfiguracji
należące do OpenClaw używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` albo zmniejszenie pliku o więcej niż połowę, są odrzucane i
zapisywane jako `.rejected.*` do inspekcji.

Jeśli zobaczysz `config reload skipped (invalid config)` albo start zgłosi `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix` w celu naprawy. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby poznać listę kontrolną.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie uruchamia ponownie przy krytycznych. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy potrzebny jest restart - obsługujesz go samodzielnie. |
| **`restart`**          | Uruchamia Gateway ponownie przy każdej zmianie konfiguracji, bezpiecznej lub nie.          |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną obowiązywać po następnym ręcznym restarcie.      |

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
| Kanały              | `channels.*`, `web` (WhatsApp) - wszystkie wbudowane kanały i kanały Plugin | Nie               |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie               |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                | Nie               |
| Sesje i wiadomości  | `session`, `messages`                                             | Nie               |
| Narzędzia i media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie               |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                           | Nie               |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**           |
| Infrastruktura      | `discovery`, `plugins`                                            | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami - ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje dotyczące hot-reload (zastosowanie na gorąco vs restart)
pozostają przewidywalne nawet wtedy, gdy jedna sekcja najwyższego poziomu znajduje się
we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się odmową,
jeśli układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi zapisujących konfigurację przez API Gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania
  elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę oraz `hash`
- `config.patch` do częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice są zastępowane po jawnym potwierdzeniu przez `replacePaths`, jeśli
  wpisy miałyby zostać usunięte)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz restartu; dodaj `continuationMessage`, gdy sesja po restarcie powinna wykonać jedną turę uzupełniającą
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować działającą wersję po restarcie

Agenty powinny traktować `config.schema.lookup` jako pierwszy punkt dostępu do dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
odniesień podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszają 30-sekundowy czas odnowienia między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administracyjny, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji i końcówki wyników poleceń.
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
`note` oraz `restartDelayMs`. `baseHash` jest wymagany dla obu metod, gdy
konfiguracja już istnieje.

`config.patch` akceptuje także `replacePaths`, tablicę ścieżek konfiguracji, których zastąpienie tablicy
jest zamierzone. Jeśli poprawka zastąpiłaby lub usunęła istniejącą tablicę
mniejszą liczbą wpisów, Gateway odrzuci zapis, chyba że dokładna ścieżka pojawi się
w `replacePaths`; zagnieżdżone tablice pod wpisami tablic używają `[]`, na przykład
`agents.list[].skills`. Zapobiega to cichemu nadpisywaniu tablic routingu lub list dozwolonych
przez ucięte migawki `config.get`. Użyj `config.apply`, gdy
zamierzasz zastąpić pełną konfigurację.

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
- Brakujące/puste zmienne powodują błąd podczas ładowania
- Użyj `$${VAR}`, aby uzyskać literał w wyniku
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

Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja

Pełną dokumentację pole po polu znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
