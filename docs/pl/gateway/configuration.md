---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-24T09:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy
`openclaw.json` oparte na symlinkach nie są obsługiwane przy zapisach wykonywanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować symlink. Jeśli przechowujesz konfigurację poza
domyślnym katalogiem stanu, skieruj `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrolowanie, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (Cron, hooks)
- Strojenie sesji, multimediów, sieci lub interfejsu użytkownika

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

<Tip>
**Dopiero zaczynasz pracę z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść przez interaktywną konfigurację, albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
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
  <Tab title="Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadanych dokumentacyjnych pól
    `title` / `description`, a także schematów Pluginów i kanałów, jeśli są
    dostępne, z edytorem **Raw JSON** jako awaryjną ścieżką wyjścia. Dla interfejsów
    szczegółowych i innych narzędzi gateway udostępnia także `config.schema.lookup`, aby
    pobrać pojedynczy węzeł schematu ograniczony do ścieżki oraz podsumowania jego bezpośrednich dzieci.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, nieprawidłowe typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania dzieci dla narzędzi szczegółowych. Metadane dokumentacyjne pól `title`/`description`
są przenoszone przez obiekty zagnieżdżone, gałęzie wildcard (`*`), elementów tablic (`[]`) oraz `anyOf`/
`oneOf`/`allOf`. Schematy runtime Pluginów i kanałów są scalane po załadowaniu
rejestru manifestów.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchamia
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway zachowuje zaufaną ostatnią znaną dobrą kopię po każdym pomyślnym uruchomieniu.
Jeśli później `openclaw.json` nie przejdzie walidacji (lub utraci `gateway.mode`, gwałtownie
się zmniejszy albo będzie miał dołączoną na początku przypadkową linię logu), OpenClaw zachowa uszkodzony plik
jako `.clobbered.*`, przywróci ostatnią znaną dobrą kopię i zapisze powód odzyskania
w logu. Następna tura agenta również otrzyma ostrzeżenie w postaci zdarzenia systemowego, aby główny
agent nie przepisał bezrefleksyjnie przywróconej konfiguracji. Promocja do ostatniej znanej dobrej
kopii jest pomijana, gdy kandydat zawiera zredagowane placeholdery sekretów, takie jak `***`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Konfiguracja kanału (WhatsApp, Telegram, Discord itd.)">
    Każdy kanał ma własną sekcję konfiguracji w `channels.<provider>`. Instrukcje konfiguracji znajdziesz na dedykowanej stronie kanału:

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

    Wszystkie kanały współdzielą ten sam wzorzec zasad wiadomości prywatnych:

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

  <Accordion title="Wybór i konfiguracja modeli">
    Ustaw model główny i opcjonalne fallbacki:

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
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy listy dozwolonych bez usuwania istniejących modeli. Zwykłe zastąpienia, które usuwałyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie w dół obrazów w transkryptach/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów vision przy sesjach z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać zachowanie rotacji uwierzytelniania i fallbacków.
    - W przypadku dostawców niestandardowych/samodzielnie hostowanych zobacz [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontrolowanie, kto może wysyłać wiadomości do bota">
    Dostęp do wiadomości prywatnych jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu listy dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie wiadomości prywatne

    W przypadku grup użyj `groupPolicy` + `groupAllowFrom` lub list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Konfiguracja bramkowania wzmiankami w czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce per agent:

    ```json5
    {
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

    - **Wzmianki metadanych**: natywne wzmianki @ (stuknięcie wzmianki w WhatsApp, @bot w Telegram itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Ograniczanie Skills per agent">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisuj konkretne
    agenty za pomocą `agents.list[].skills`:

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

    - Pomiń `agents.defaults.skills`, aby domyślnie Skills nie były ograniczone.
    - Pomiń `agents.list[].skills`, aby dziedziczyć ustawienia domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config) oraz
      [Configuration Reference](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Strojenie monitorowania kondycji kanałów Gateway">
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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitorowania kondycji.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Health Checks](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Konfiguracja sesji i resetów">
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

    - `dmScope`: `main` (wspólna) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne ustawienia domyślne dla routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Session Management](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włączanie sandboxingu">
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

    Najpierw zbuduj obraz: `scripts/sandbox-setup.sh`

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włączanie push opartego na relay dla oficjalnych kompilacji iOS">
    Push oparty na relay jest konfigurowany w `openclaw.json`.

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

    - Umożliwia gateway wysyłanie `push.test`, sygnałów wybudzenia i wybudzeń ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Zachowuje lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na relay mają zastosowanie tylko do oficjalnych dystrybuowanych kompilacji, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalną/TestFlight kompilację iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną/TestFlight kompilację iOS, która została skompilowana z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom Node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay przy użyciu App Attest oraz potwierdzenia aplikacji, a następnie publikuje payload `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłania, a następnie używa ich do `push.test`, sygnałów wybudzenia i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą na inne wdrożenie relay, aplikacja odświeży swoją zbuforowaną rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga o zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje awaryjnym obejściem deweloperskim tylko dla loopback; nie utrwalaj URL-i relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać pełny przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Konfiguracja Heartbeat (okresowe sprawdzenia)">
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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat w stylu wiadomości prywatnych
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby poznać pełny przewodnik.

  </Accordion>

  <Accordion title="Konfiguracja zadań Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: usuwanie zakończonych izolowanych sesji wykonania z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinanie `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowywanych linii.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Konfiguracja Webhooków (hooks)">
    Włącz endpointy Webhook HTTP w Gateway:

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
    - Traktuj całą treść payloadów hook/Webhook jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; utrzymuj wejście Webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej treści wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że wykonujesz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych przez hooki preferuj mocne nowoczesne poziomy modeli i ścisłe zasady narzędzi (na przykład tylko wiadomości plus sandboxing, jeśli to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację Gmail.

  </Accordion>

  <Accordion title="Konfiguracja routingu wielu agentów">
    Uruchamiaj wielu odizolowanych agentów z oddzielnymi obszarami roboczymi i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

  </Accordion>

  <Accordion title="Podział konfiguracji na wiele plików ($include)">
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
    - **Tablica plików**: głębokie scalenie w kolejności (późniejsze wygrywają)
    - **Klucze rodzeństwa**: scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy wykonywane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, taką jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany write-through**: include na poziomie głównym, tablice include i include
      z nadpisaniami rodzeństwa kończą się bezpieczną blokadą przy zapisach wykonywanych przez OpenClaw zamiast
      spłaszczać konfigurację
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustabilizuje się tymczasowe zapisywanie/zmiana nazwy przez edytor, odczytuje końcowy plik i odrzuca
nieprawidłowe zewnętrzne edycje, przywracając ostatnią znaną dobrą konfigurację. Zapisy konfiguracji wykonywane przez OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne uszkodzenia, takie jak
usunięcie `gateway.mode` lub zmniejszenie pliku o więcej niż połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Jeśli w logach zobaczysz `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź pasujący
plik `.clobbered.*` obok `openclaw.json`, popraw odrzucony payload, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby poznać listę kroków odzyskiwania.

### Tryby przeładowania

| Tryb                  | Zachowanie                                                                              |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Krytyczne obsługuje przez automatyczny restart. |
| **`hot`**             | Stosuje na gorąco tylko bezpieczne zmiany. Zapisuje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
| **`restart`**         | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.               |
| **`off`**             | Wyłącza obserwowanie pliku. Zmiany zaczynają działać przy następnym ręcznym restarcie.  |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria           | Pola                                                             | Wymaga restartu? |
| ------------------- | ---------------------------------------------------------------- | ---------------- |
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie kanały wbudowane i kanały Pluginów | Nie              |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                           | Nie              |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                               | Nie              |
| Sesje i wiadomości  | `session`, `messages`                                            | Nie              |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `audio`, `talk`                 | Nie              |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                          | Nie              |
| Serwer Gateway      | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)             | **Tak**          |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                             | **Tak**          |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu utworzonego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje hot-reload (zastosowanie na gorąco vs restart) pozostają przewidywalne nawet wtedy, gdy
pojedyncza sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się bezpieczną blokadą, jeśli
układ źródła jest niejednoznaczny.

## Config RPC (aktualizacje programowe)

Dla narzędzi zapisujących konfigurację przez API gateway preferuj następujący przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania dzieci)
- `config.get`, aby pobrać bieżącą migawkę wraz z `hash`
- `config.patch` dla częściowych aktualizacji (JSON merge patch: obiekty się scalają, `null`
  usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` dla jawnej samodzielnej aktualizacji + restartu

<Note>
Zapisy na płaszczyźnie sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczane do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania restartu
są łączone, a następnie wymuszają 30-sekundowy okres chłodzenia między cyklami restartu.
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
`note` i `restartDelayMs`. `baseHash` jest wymagane dla obu metod, gdy
konfiguracja już istnieje.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalne ustawienie awaryjne)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawić zmienne środowiskowe inline w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import env z powłoki (opcjonalne)">
  Jeśli ta opcja jest włączona i oczekiwane klucze nie są ustawione, OpenClaw uruchamia Twoją powłokę logowania i importuje tylko brakujące klucze:

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
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości ciągu konfiguracji przy użyciu `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd w czasie ładowania
- Użyj `$${VAR}` dla dosłownego wyniku
- Działa także wewnątrz plików `$include`
- Podstawianie inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
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
Obsługiwane ścieżki poświadczeń są wymienione w [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja referencyjna

Pełną dokumentację referencyjną wszystkich pól znajdziesz w **[Configuration Reference](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Configuration Reference](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
