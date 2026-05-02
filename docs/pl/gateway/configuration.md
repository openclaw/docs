---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-02T09:49:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
będące symlinkami nie są obsługiwane dla zapisów zarządzanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować symlink. Jeśli trzymasz konfigurację poza
domyślnym katalogiem stanu, skieruj `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Łączenie kanałów i kontrolowanie, kto może wysyłać wiadomości do bota
- Ustawianie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrajanie sesji, multimediów, sieci lub UI

Zobacz [pełny opis](/pl/gateway/configuration-reference) każdego dostępnego pola.

Agenci i automatyzacja powinny używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Użyj tej strony jako wskazówek zorientowanych na zadania oraz
[opisu konfiguracji](/pl/gateway/configuration-reference) jako szerszej
mapy pól i wartości domyślnych.

<Tip>
**Nie znasz jeszcze konfiguracji?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby skorzystać z kompletnych konfiguracji do skopiowania i wklejenia.
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
  <Tab title="CLI (jednowierszowe polecenia)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interfejs Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Konfiguracja**.
    Control UI renderuje formularz na podstawie schematu konfiguracji na żywo, w tym metadanych dokumentacji pól
    `title` / `description` oraz schematów Plugin i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla interfejsów
    drill-down i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i stosuje zmiany automatycznie (zobacz [przeładowywanie na gorąco](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, niepoprawne typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączyć metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi drill-down. Metadane dokumentacji pól `title`/`description`
są przenoszone przez zagnieżdżone obiekty, wieloznaczniki (`*`), elementy tablic (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy Plugin i kanałów z czasu wykonywania są scalane, gdy
rejestr manifestów zostanie załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną ostatnią dobrą kopię po każdym pomyślnym uruchomieniu.
Jeśli `openclaw.json` później nie przejdzie walidacji (albo usunie `gateway.mode`, gwałtownie się
zmniejszy lub ma przypadkowy wiersz logu dodany na początku), OpenClaw zachowuje uszkodzony plik
jako `.clobbered.*`, przywraca ostatnią dobrą kopię i zapisuje w logu powód odzyskiwania.
Następna tura agenta otrzymuje też ostrzeżenie zdarzenia systemowego, aby główny
agent nie przepisał ślepo przywróconej konfiguracji. Promocja do ostatniej dobrej kopii
jest pomijana, gdy kandydat zawiera zredagowane placeholdery sekretów, takie jak `***`.
Gdy każdy problem walidacji jest ograniczony do `plugins.entries.<id>...`, OpenClaw
nie wykonuje odzyskiwania całego pliku. Zachowuje bieżącą konfigurację jako aktywną i
ujawnia błąd lokalny dla Plugin, aby niezgodność schematu Plugin lub wersji hosta
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

    Wszystkie kanały używają tego samego wzorca zasad DM:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako allowlist dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do allowlist bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje zmniejszanie obrazów transkryptu/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają użycie tokenów wizyjnych w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele w czacie, oraz [przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie modeli zapasowych.
    - Dla niestandardowych/samodzielnie hostowanych dostawców zobacz [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w opisie.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany osobno dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub sparowany magazyn zezwoleń)
    - `"open"`: zezwól na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` lub allowlist specyficznych dla kanału.

    Zobacz [pełny opis](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek w czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalaczy dla każdego agenta i zachowaj widoczne odpowiedzi w pokoju na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

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

    - **Wzmianki metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może globalnie wymagać wysyłek przez narzędzie wiadomości; `messages.groupChat.visibleReplies` nadpisuje to dla grup/kanałów.
    - Zobacz [pełny opis](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania dla poszczególnych kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Ogranicz Skills dla każdego agenta">
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
    - Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [opis konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrój monitorowanie kondycji kanałów Gateway">
    Kontroluj, jak agresywnie Gateway restartuje kanały, które wyglądają na nieaktywne:

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
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełny opis](/pl/gateway/configuration-reference#gateway) wszystkich pól.

  </Accordion>

  <Accordion title="Dostrój limit czasu uzgadniania WebSocket Gateway">
    Daj lokalnym klientom więcej czasu na ukończenie uzgadniania WebSocket przed uwierzytelnieniem na
    obciążonych hostach lub hostach o niskiej mocy:

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
    - `threadBindings`: globalne wartości domyślne routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

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

    Najpierw zbuduj obraz — z checkoutu źródeł uruchom `scripts/sandbox-setup.sh`, a po instalacji z npm zobacz wbudowane polecenie `docker build` w sekcji [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relayu dla oficjalnych buildów iOS">
    Push oparty na relayu konfiguruje się w `openclaw.json`.

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

    - Umożliwia Gateway wysyłanie `push.test`, impulsów wybudzania i wybudzeń ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłania o zakresie rejestracji przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relaya obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na relayu z tożsamością Gateway, z którą sparowała się aplikacja iOS, dzięki czemu inny Gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne buildy iOS przy bezpośrednim APNs. Wysyłki oparte na relayu dotyczą tylko oficjalnych buildów dystrybuowanych, które zarejestrowały się przez relay.
    - Musi pasować do bazowego URL relaya wbudowanego w oficjalny/TestFlight build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relaya.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS skompilowany z tym samym bazowym URL relaya.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w Gateway.
    3. Sparuj aplikację iOS z Gateway i pozwól połączyć się zarówno sesjom node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość Gateway, rejestruje się w relayu przy użyciu App Attest oraz potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relayu do sparowanego Gateway.
    5. Gateway zapisuje uchwyt relaya i uprawnienie wysyłania, a następnie używa ich dla `push.test`, impulsów wybudzania i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny Gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relaya powiązaną z tym Gateway.
    - Jeśli wydasz nowy build iOS wskazujący inne wdrożenie relaya, aplikacja odświeży swoją zapisaną w pamięci podręcznej rejestrację relaya zamiast ponownie używać starego źródła relaya.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje furtką deweloperską wyłącznie dla local loopback; nie zapisuj URL-i relaya HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relaya.

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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat w stylu DM
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
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i zachowanych wierszy.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać omówienie funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhooki (hooki)">
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
    - Traktuj całą zawartość ładunków hook/Webhook jako niezaufane dane wejściowe.
    - Użyj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków odbywa się tylko przez nagłówek (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj wejście Webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw wyłączone flagi obejścia niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że wykonujesz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne, nowoczesne poziomy modeli i rygorystyczną politykę narzędzi (na przykład tylko wiadomości oraz sandboxing, gdy to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z osobnymi przestrzeniami roboczymi i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) i [pełną dokumentację referencyjną](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu poszczególnych agentów.

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

    - **Pojedynczy plik**: zastępuje obiekt zawierający
    - **Tablica plików**: głęboko scalana w kolejności (późniejsze wygrywają)
    - **Klucze sąsiednie**: scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy należące do OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, taką jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwane zapisy przez include**: include w katalogu głównym, tablice include oraz include
      z nadpisaniami sąsiednimi kończą się bezpiecznym błędem dla zapisów należących do OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) dodatkowych
      katalogów, do których mogą odwoływać się include. Dowiązania symboliczne są rozwiązywane
      i sprawdzane ponownie, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony root, nadal zostanie odrzucona.
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest wymagany ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Watcher czeka
na uspokojenie tymczasowych zapisów/zmian nazw edytora, odczytuje końcowy plik i odrzuca
nieprawidłowe edycje zewnętrzne przez przywrócenie ostatniej znanej dobrej konfiguracji. Zapisy konfiguracji
należące do OpenClaw używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` lub zmniejszenie pliku o ponad połowę, są odrzucane
i zapisywane jako `.rejected.*` do sprawdzenia.

Wyjątkiem są lokalne błędy walidacji Plugin: jeśli wszystkie problemy znajdują się pod
`plugins.entries.<id>...`, reload zachowuje bieżącą konfigurację i zgłasza problem Plugin
zamiast przywracać `.last-good`.

Jeśli zobaczysz w logach `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź pasujący plik
`.clobbered.*` obok `openclaw.json`, napraw odrzucony ładunek, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby poznać checklistę odzyskiwania.

### Tryby reload

| Tryb                   | Zachowanie                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje dla krytycznych zmian. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.               |
| **`off`**              | Wyłącza obserwowanie plików. Zmiany zaczynają obowiązywać przy następnym ręcznym restarcie. |

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
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane kanały i kanały pluginów | Nie               |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                            | Nie               |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                | Nie               |
| Sesje i wiadomości  | `session`, `messages`                                             | Nie               |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`           | Nie               |
| UI i różne          | `ui`, `logging`, `identity`, `bindings`                           | Nie               |
| Serwer Gateway      | `gateway.*` (port, powiązanie, auth, tailscale, TLS, HTTP)        | **Tak**           |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                              | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie ponownego ładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
ponowne ładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego
widoku w pamięci. Dzięki temu decyzje dotyczące hot-reload (zastosowanie na gorąco
vs restart) pozostają przewidywalne nawet wtedy, gdy pojedyncza sekcja najwyższego
poziomu znajduje się w osobnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie ponownego ładowania kończy
się bezpieczną odmową, jeśli układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi, które zapisują konfigurację przez API gateway, preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania
  elementów podrzędnych)
- `config.get`, aby pobrać bieżący zrzut oraz `hash`
- `config.patch` do aktualizacji częściowych (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz restartu
- `update.status`, aby sprawdzić najnowszy znacznik restartu aktualizacji i zweryfikować działającą wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt dostępu do dokładnej
dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
dokumentacji podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszany jest 30-sekundowy czas oczekiwania między cyklami restartu.
`update.status` jest tylko do odczytu, ale ma zakres administratora, ponieważ znacznik restartu może
zawierać podsumowania kroków aktualizacji i końcówki danych wyjściowych poleceń.
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

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawić wbudowane zmienne środowiskowe w konfiguracji:

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
- Użyj `$${VAR}`, aby uzyskać dosłowny wynik
- Działa w plikach `$include`
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
