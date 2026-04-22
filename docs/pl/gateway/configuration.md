---
read_when:
    - Pierwsza konfiguracja OpenClaw
    - Szukasz typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i odnośniki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-22T04:22:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguracja

OpenClaw odczytuje opcjonalną konfigurację w formacie <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z pliku `~/.openclaw/openclaw.json`.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrola, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (Cron, hooki)
- Dostrojenie sesji, mediów, sieci lub UI

Pełną listę dostępnych pól znajdziesz w [pełnej dokumentacji referencyjnej](/pl/gateway/configuration-reference).

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Configuration Examples](/pl/gateway/configuration-examples) z kompletnymi konfiguracjami do skopiowania i wklejenia.
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
    openclaw onboard       # pełny proces wdrożenia
    openclaw configure     # kreator konfiguracji
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
    Control UI renderuje formularz na podstawie schematu aktywnej konfiguracji, w tym metadanych dokumentacyjnych pól
    `title` / `description`, a także schematów Plugin i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako obejściem awaryjnym. Dla interfejsów
    drill-down i innych narzędzi gateway udostępnia też `config.schema.lookup`,
    aby pobrać jeden węzeł schematu ograniczony do ścieżki wraz z podsumowaniami
    bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni odpowiadają schematowi. Nieznane klucze, nieprawidłowe typy lub błędne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

Uwagi dotyczące narzędzi schematu:

- `openclaw config schema` wypisuje tę samą rodzinę JSON Schema, której używają Control UI
  i walidacja konfiguracji.
- Traktuj wynik tego schematu jako kanoniczny kontrakt czytelny maszynowo dla
  `openclaw.json`; ten przegląd i dokumentacja referencyjna konfiguracji go podsumowują.
- Wartości pól `title` i `description` są przenoszone do wyniku schematu na potrzeby
  narzędzi edytora i formularzy.
- Zagnieżdżone obiekty, wpisy wieloznaczne (`*`) i elementy tablic (`[]`) dziedziczą te same
  metadane dokumentacyjne tam, gdzie istnieje pasująca dokumentacja pola.
- Gałęzie kompozycji `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane
  dokumentacyjne, więc warianty union/intersection zachowują tę samą pomoc dla pól.
- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia
  i podobne pola walidacji), dopasowanymi metadanymi wskazówek UI oraz podsumowaniami
  bezpośrednich elementów podrzędnych dla narzędzi drill-down.
- Schematy runtime Plugin/kanałów są scalane, gdy gateway może załadować
  bieżący rejestr manifestów.
- `pnpm config:docs:check` wykrywa dryf między artefaktami bazowymi konfiguracji
  używanymi w dokumentacji a bieżącą powierzchnią schematu.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchamia
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje też zaufaną ostatnią działającą kopię po pomyślnym uruchomieniu. Jeśli
`openclaw.json` zostanie później zmieniony poza OpenClaw i przestanie przechodzić walidację, uruchomienie
i hot reload zachowają uszkodzony plik jako opatrzony znacznikiem czasu snapshot `.clobbered.*`,
przywrócą ostatnią działającą kopię i zapiszą głośne ostrzeżenie z powodem odzyskania.
Następna tura głównego agenta również otrzyma ostrzeżenie system-event informujące, że
konfiguracja została przywrócona i nie wolno jej bezmyślnie nadpisywać. Promowanie ostatniej działającej
wersji jest aktualizowane po zwalidowanym uruchomieniu oraz po zaakceptowanych hot reloadach, w tym
po zapisach konfiguracji należących do OpenClaw, których utrwalony hash pliku nadal odpowiada
zaakceptowanemu zapisowi. Promowanie jest pomijane, gdy kandydat zawiera zredagowane placeholdery
sekretów, takie jak `***` lub skrócone wartości tokenów.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itd.)">
    Każdy kanał ma własną sekcję konfiguracji w `channels.<provider>`. Zobacz dedykowaną stronę kanału, aby poznać kroki konfiguracji:

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

    Wszystkie kanały mają ten sam wzorzec polityki DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // tylko dla allowlist/open
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

    - `agents.defaults.models` definiuje katalog modeli i pełni rolę allowlisty dla `/model`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie obrazów w transkryptach/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie vision tokenów przy przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać zachowanie rotacji uwierzytelniania i modeli zapasowych.
    - W przypadku providerów niestandardowych/self-hosted zobacz [Custom providers](/pl/gateway/configuration-reference#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp do DM jest kontrolowany osobno dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy dostają jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu dozwolonych)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo allowlist specyficznych dla kanału.

    Szczegóły dla każdego kanału znajdziesz w [pełnej dokumentacji referencyjnej](/pl/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmiankami w czatach grupowych">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce dla każdego agenta:

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

    - **Wzmianki w metadanych**: natywne @mentions (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#group-chat-mention-gating), aby poznać nadpisania dla poszczególnych kanałów i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills dla konkretnego agenta">
    Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisz konkretne
    agenty przez `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
          { id: "locked-down", skills: [] }, // brak Skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config) oraz
      [Configuration Reference](/pl/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrój monitorowanie zdrowia kanałów Gateway">
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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitorowania zdrowia.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Health Checks](/pl/gateway/health), aby diagnozować problemy operacyjne, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość konwersacji i izolację:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // zalecane dla wielu użytkowników
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

    - `dmScope`: `main` (współdzielona) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne dla routingu sesji powiązanego z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Session Management](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i politykę wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#session), aby poznać wszystkie pola.

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

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relay dla oficjalnych buildów iOS">
    Push oparty na relay jest konfigurowany w `openclaw.json`.

    Ustaw to w konfiguracji gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcjonalne. Domyślnie: 10000
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

    - Umożliwia Gateway wysyłanie `push.test`, sygnałów wybudzenia i wybudzeń ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazywanego dalej przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay dla całego wdrożenia.
    - Wiąże każdą rejestrację relay-backed z tożsamością Gateway, z którą sparowała się aplikacja iOS, więc inny Gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne buildy iOS przy bezpośrednim APNs. Wysyłki relay-backed dotyczą tylko oficjalnych dystrybuowanych buildów, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalny/TestFlight build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS, który został skompilowany z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w Gateway.
    3. Sparuj aplikację iOS z Gateway i pozwól połączyć się zarówno sesjom node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość Gateway, rejestruje się w relay przy użyciu App Attest oraz paragonu aplikacji, a następnie publikuje payload `push.apns.register` relay-backed do sparowanego Gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłania, a następnie używa ich dla `push.test`, sygnałów wybudzenia i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny Gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym Gateway.
    - Jeśli dostarczysz nowy build iOS wskazujący na inne wdrożenie relay, aplikacja odświeży zapisaną w pamięci podręcznej rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania przez zmienne środowiskowe.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje przeznaczonym wyłącznie dla loopback obejściem deweloperskim; nie zapisuj w konfiguracji URL-i relay używających HTTP.

    Zobacz [iOS App](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Authentication and trust flow](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Skonfiguruj Heartbeat (okresowe check-iny)">
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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla targetów Heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby przeczytać pełny przewodnik.

  </Accordion>

  <Accordion title="Skonfiguruj zadania Cron">
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

    - `sessionRetention`: usuwaj ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinaj `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowanych linii.
    - Zobacz [Cron jobs](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhooki (hooki)">
    Włącz endpointy HTTP Webhook w Gateway:

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
    - Traktuj całą zawartość payloadów hook/Webhook jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hook działa tylko przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może być równe `/`; utrzymuj ruch przychodzący Webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że wykonujesz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych przez hook preferuj mocne nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing multi-agent">
    Uruchamiaj wiele izolowanych agentów z osobnymi obszarami roboczymi i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) i [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

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
    - **Tablica plików**: scala głęboko w podanej kolejności (późniejsze wygrywają)
    - **Klucze sąsiednie**: są scalane po include’ach (nadpisują dołączone wartości)
    - **Zagnieżdżone include’y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include’ów

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustanie tymczasowy zapis/zmiana nazwy wykonywane przez edytor, odczytuje plik końcowy i odrzuca
nieprawidłowe zewnętrzne edycje, przywracając ostatnią działającą konfigurację. Zapisy konfiguracji
należące do OpenClaw używają tej samej bramki schematu przed zapisaniem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` lub zmniejszenie pliku o więcej niż połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Jeśli w logach zobaczysz `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź odpowiadający
plik `.clobbered.*` obok `openclaw.json`, popraw odrzucony payload, a następnie uruchom
`openclaw config validate`. Zobacz [Gateway troubleshooting](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby skorzystać z listy kontrolnej odzyskiwania.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Dla krytycznych automatycznie restartuje. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Zapisuje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.             |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczynają działać przy następnym ręcznym restarcie. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                             | Wymagany restart? |
| -------------------- | ---------------------------------------------------------------- | ----------------- |
| Kanały               | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane kanały i kanały Plugin | Nie               |
| Agent i modele       | `agent`, `agents`, `models`, `routing`                           | Nie               |
| Automatyzacja        | `hooks`, `cron`, `agent.heartbeat`                               | Nie               |
| Sesje i wiadomości   | `session`, `messages`                                            | Nie               |
| Narzędzia i media    | `tools`, `browser`, `skills`, `audio`, `talk`                    | Nie               |
| UI i inne            | `ui`, `logging`, `identity`, `bindings`                          | Nie               |
| Serwer Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Tak**           |
| Infrastruktura       | `discovery`, `canvasHost`, `plugins`                             | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

## Config RPC (aktualizacje programowe)

<Note>
RPC zapisu płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) mają limit **3 żądań na 60 sekund** dla `deviceId+clientIp`. Po przekroczeniu limitu RPC zwraca `UNAVAILABLE` z `retryAfterMs`.
</Note>

Bezpieczny/domyślny przepływ:

- `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji ograniczone do ścieżki z płytkim
  węzłem schematu, dopasowanymi metadanymi wskazówek i podsumowaniami bezpośrednich elementów podrzędnych
- `config.get`: pobierz bieżący snapshot + hash
- `config.patch`: preferowana ścieżka częściowej aktualizacji
- `config.apply`: tylko pełne zastąpienie konfiguracji
- `update.run`: jawna samoaktualizacja + restart

Gdy nie zastępujesz całej konfiguracji, preferuj `config.schema.lookup`,
a potem `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (pełne zastąpienie)">
    Waliduje + zapisuje pełną konfigurację i restartuje Gateway w jednym kroku.

    <Warning>
    `config.apply` zastępuje **całą konfigurację**. Użyj `config.patch` do częściowych aktualizacji albo `openclaw config set` dla pojedynczych kluczy.
    </Warning>

    Parametry:

    - `raw` (string) — payload JSON5 dla całej konfiguracji
    - `baseHash` (opcjonalne) — hash konfiguracji z `config.get` (wymagany, gdy konfiguracja istnieje)
    - `sessionKey` (opcjonalne) — klucz sesji dla sygnału wybudzenia po restarcie
    - `note` (opcjonalne) — notatka dla znacznika restartu
    - `restartDelayMs` (opcjonalne) — opóźnienie przed restartem (domyślnie 2000)

    Żądania restartu są łączone, gdy jedno oczekuje lub jest już w toku, a między cyklami restartu obowiązuje 30-sekundowy cooldown.

    ```bash
    openclaw gateway call config.get --params '{}'  # przechwyć payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (częściowa aktualizacja)">
    Scala częściową aktualizację z istniejącą konfiguracją (semantyka JSON merge patch):

    - Obiekty są scalane rekurencyjnie
    - `null` usuwa klucz
    - Tablice są zastępowane

    Parametry:

    - `raw` (string) — JSON5 tylko z kluczami do zmiany
    - `baseHash` (wymagane) — hash konfiguracji z `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — takie same jak w `config.apply`

    Zachowanie restartu jest takie samo jak w `config.apply`: łączenie oczekujących restartów oraz 30-sekundowy cooldown między cyklami restartu.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

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

<Accordion title="Import shell env (opcjonalny)">
  Jeśli ta opcja jest włączona i oczekiwane klucze nie są ustawione, OpenClaw uruchamia Twój shell logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik w zmiennych środowiskowych: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych środowiskowych w wartościach konfiguracji">
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości string konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas ładowania
- Użyj `$${VAR}` dla dosłownego wyniku
- Działa także w plikach `$include`
- Podstawianie inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdziesz w [Secrets Management](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Environment](/pl/help/environment), aby poznać pełny priorytet i źródła.

## Pełna dokumentacja referencyjna

Aby zobaczyć kompletną dokumentację referencyjną wszystkich pól, przejdź do **[Configuration Reference](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Configuration Examples](/pl/gateway/configuration-examples) · [Configuration Reference](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_
