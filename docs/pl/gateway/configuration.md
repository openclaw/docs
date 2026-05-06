---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Omówienie konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-06T09:12:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
oparte na dowiązaniach symbolicznych nie są obsługiwane dla zapisów wykonywanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, wskaż `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Łączenie kanałów i kontrola tego, kto może wysyłać wiadomości do bota
- Ustawianie modeli, narzędzi, sandboxingu lub automatyzacji (cron, haki)
- Dostrajanie sesji, multimediów, sieci lub interfejsu użytkownika

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

Agenci i automatyzacje powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Używaj tej strony do wskazówek zorientowanych na zadania oraz
[dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference) jako szerszej
mapy pól i wartości domyślnych.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples), który zawiera kompletne konfiguracje do skopiowania i wklejenia.
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
  <Tab title="Interfejs sterowania">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Konfiguracja**.
    Interfejs sterowania renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadane dokumentacji pól
    `title` / `description` oraz schematy Plugin i kanałów, gdy są
    dostępne, z edytorem **Surowy JSON** jako wyjściem awaryjnym. Na potrzeby szczegółowych
    interfejsów użytkownika i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów potomnych.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [przeładowanie na gorąco](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, błędne typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), dzięki czemu edytory mogą dołączyć metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez interfejs sterowania
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów potomnych dla narzędzi szczegółowych. Metadane dokumentacji pól `title`/`description`
są przenoszone przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablic (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy Plugin i kanałów z czasu działania są scalane, gdy
rejestr manifestów jest załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną kopię ostatniej poprawnej konfiguracji po każdym udanym uruchomieniu,
ale uruchomienie i przeładowanie na gorąco nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym walidacji lokalnej dla Plugin), uruchomienie Gateway się nie powiedzie albo
przeładowanie zostanie pominięte, a bieżące środowisko wykonawcze zachowa ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (lub `--yes`), aby naprawić konfigurację z prefiksami/nadpisaną albo
przywrócić kopię ostatniej poprawnej konfiguracji. Promocja do ostatniej poprawnej konfiguracji jest pomijana, gdy
kandydat zawiera zredagowane symbole zastępcze sekretów, takie jak `***`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itd.)">
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

    Wszystkie kanały korzystają z tego samego wzorca zasad DM:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do listy dozwolonych bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie w dół obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów wizyjnych w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie zapasowe.
    - W przypadku niestandardowych/samodzielnie hostowanych dostawców zobacz [dostawców niestandardowych](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany dla każdego kanału za pomocą `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek w czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalania dla każdego agenta i pozostaw widoczne odpowiedzi w pokoju na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

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

    - **Wzmianki metadanych**: natywne @wzmianki (WhatsApp dotknij, aby wspomnieć, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce wyrażeń regularnych w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może wymagać wysyłek przez narzędzie wiadomości globalnie; `messages.groupChat.visibleReplies` zastępuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, zastąpienia dla poszczególnych kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Ogranicz Skills dla każdego agenta">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie zastąp ją dla konkretnych
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
    - Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [dokumentację referencyjną konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrój monitorowanie kondycji kanałów Gateway">
    Kontroluj, jak agresywnie Gateway ponownie uruchamia kanały, które wyglądają na nieaktywne:

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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć ponowne uruchomienia wykonywane przez monitor kondycji.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` albo `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne ponowne uruchomienia dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Dostrój limit czasu uzgadniania WebSocket Gateway">
    Daj lokalnym klientom więcej czasu na ukończenie uzgadniania WebSocket przed uwierzytelnieniem na
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
    - Najpierw najlepiej naprawić zacięcia uruchamiania/pętli zdarzeń; to pokrętło jest przeznaczone dla hostów, które są zdrowe, ale wolne podczas rozgrzewki.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowania">
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

    - `dmScope`: `main` (współdzielony) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne dla routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz piaskownicę">
    Uruchamiaj sesje agentów w izolowanych środowiskach uruchomieniowych piaskownicy:

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

    Najpierw zbuduj obraz - z pobranego kodu źródłowego uruchom `scripts/sandbox-setup.sh`, a w przypadku instalacji z npm zobacz wbudowane polecenie `docker build` w [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Zobacz [Piaskownica](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz powiadomienia push przez przekaźnik dla oficjalnych kompilacji iOS">
    Powiadomienia push obsługiwane przez przekaźnik konfiguruje się w `openclaw.json`.

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

    Odpowiednik CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Co to robi:

    - Pozwala Gateway wysyłać `push.test`, wybudzenia i ponowne wybudzenia połączenia przez zewnętrzny przekaźnik.
    - Używa uprawnienia wysyłki ograniczonego do rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu przekaźnika obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację obsługiwaną przez przekaźnik z tożsamością Gateway, z którą sparowano aplikację iOS, dzięki czemu inny Gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki przez przekaźnik dotyczą tylko oficjalnych kompilacji dystrybuowanych, które zarejestrowały się przez przekaźnik.
    - Musi odpowiadać bazowemu adresowi URL przekaźnika wbudowanemu w oficjalną/TestFlight kompilację iOS, aby ruch rejestracji i wysyłki trafiał do tego samego wdrożenia przekaźnika.

    Przepływ od początku do końca:

    1. Zainstaluj oficjalną/TestFlight kompilację iOS skompilowaną z tym samym bazowym adresem URL przekaźnika.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w Gateway.
    3. Sparuj aplikację iOS z Gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość Gateway, rejestruje się w przekaźniku przy użyciu App Attest oraz paragonu aplikacji, a następnie publikuje obsługiwany przez przekaźnik ładunek `push.apns.register` do sparowanego Gateway.
    5. Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłki, a następnie używa ich dla `push.test`, wybudzeń i ponownych wybudzeń połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny Gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację przekaźnika powiązaną z tym Gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą na inne wdrożenie przekaźnika, aplikacja odświeży swoją zapisaną w pamięci podręcznej rejestrację przekaźnika zamiast ponownie używać starego źródła przekaźnika.

    Uwaga o zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania zmiennych środowiskowych.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyjściem awaryjnym tylko do programowania przez local loopback; nie zapisuj adresów URL przekaźnika HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ od początku do końca, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa przekaźnika.

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
    - `directPolicy`: `allow` (domyślnie) albo `block` dla celów Heartbeat w stylu wiadomości prywatnych
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby przeczytać pełny przewodnik.

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
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać opis funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhooki (hooki)">
    Włącz punkty końcowe Webhook HTTP w Gateway:

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
    - `hooks.path` nie może być `/`; utrzymuj wejście webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi omijania niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć wybierane przez wywołującego klucze sesji.
    - Dla agentów sterowanych hookami preferuj silne, nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko komunikacja oraz piaskownica tam, gdzie to możliwe).

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

    Zobacz [Wielu agentów](/pl/concepts/multi-agent) i [pełną dokumentację](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły wiązania oraz profile dostępu dla poszczególnych agentów.

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
    - **Tablica plików**: głęboko scalana w kolejności (późniejsze wygrywają)
    - **Klucze równorzędne**: scalane po dołączeniach (nadpisują dołączone wartości)
    - **Zagnieżdżone dołączenia**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na dołączeniu pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany zapis przez dołączenie**: dołączenia główne, tablice dołączeń i dołączenia
      z nadpisaniami równorzędnymi są bezpiecznie odrzucane przy zapisach należących do OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) do
      dodatkowych katalogów, do których dołączenia mogą się odwoływać. Dowiązania symboliczne są rozwiązywane
      i sprawdzane ponownie, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony katalog główny, nadal zostanie odrzucona.
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania i cyklicznych dołączeń

  </Accordion>
</AccordionGroup>

## Przeładowywanie konfiguracji na gorąco

Gateway obserwuje `~/.openclaw/openclaw.json` i stosuje zmiany automatycznie - w przypadku większości ustawień ręczny restart nie jest potrzebny.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż tymczasowe zapisy/zmiany nazw wykonywane przez edytor się ustabilizują, odczytuje plik końcowy i odrzuca
nieprawidłowe edycje zewnętrzne bez przepisywania `openclaw.json`. Zapisy konfiguracji należące do OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` lub zmniejszenie pliku o więcej niż połowę, są odrzucane i
zapisywane jako `.rejected.*` do wglądu.

Jeśli zobaczysz `config reload skipped (invalid config)` albo uruchamianie zgłosi `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix` w celu naprawy. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby przejrzeć listę kontrolną.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje przy krytycznych zmianach. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Zapisuje ostrzeżenie, gdy potrzebny jest restart - wykonujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.                 |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczynają działać po następnym ręcznym restarcie.      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                              | Czy restart jest potrzebny? |
| -------------------- | ----------------------------------------------------------------- | --------------------------- |
| Kanały               | `channels.*`, `web` (WhatsApp) - wszystkie wbudowane kanały i kanały pluginów | Nie                         |
| Agent i modele       | `agent`, `agents`, `models`, `routing`                            | Nie                         |
| Automatyzacja        | `hooks`, `cron`, `agent.heartbeat`                                | Nie                         |
| Sesje i wiadomości   | `session`, `messages`                                             | Nie                         |
| Narzędzia i media    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nie                         |
| UI i inne            | `ui`, `logging`, `identity`, `bindings`                           | Nie                         |
| Serwer Gateway       | `gateway.*` (port, powiązanie, uwierzytelnianie, Tailscale, TLS, HTTP) | **Tak**                 |
| Infrastruktura       | `discovery`, `canvasHost`, `plugins`                              | **Tak**                     |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami - ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
ponowne załadowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego
widoku w pamięci. Dzięki temu decyzje dotyczące hot reload (hot-apply lub restart)
pozostają przewidywalne nawet wtedy, gdy pojedyncza sekcja najwyższego poziomu
znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie ponownego załadowania
kończy się bezpiecznym błędem, jeśli układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

Dla narzędzi zapisujących konfigurację przez API Gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę oraz `hash`
- `config.patch` do częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null` usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz restartu; dołącz `continuationMessage`, gdy sesja po restarcie ma wykonać jedną kolejną turę
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować uruchomioną wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt odniesienia
dla dokładnej dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do
dedykowanych dokumentacji podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania
restartu są łączone, a następnie wymuszają 30-sekundowy czas odnowienia między
cyklami restartu. `update.status` jest tylko do odczytu, ale ma zakres
administracyjny, ponieważ znacznik restartu może zawierać podsumowania kroków
aktualizacji oraz końcówki wyjścia poleceń.
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

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalny fallback)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz także ustawiać w konfiguracji wbudowane zmienne środowiskowe:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Jeśli jest włączone, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia Twoją powłokę logowania i importuje tylko brakujące klucze:

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
- Użyj ucieczki `$${VAR}`, aby uzyskać dosłowne wyjście
- Działa wewnątrz plików `$include`
- Podstawianie w linii: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdują się w [Zarządzaniu sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchni poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby uzyskać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja

Pełną dokumentację pola po polu znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
