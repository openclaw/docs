---
read_when:
    - Pierwsza konfiguracja OpenClaw
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-08T06:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguracja

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z pliku `~/.openclaw/openclaw.json`.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i określenie, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooks)
- Dostosowanie sesji, multimediów, sieci lub interfejsu użytkownika

Zobacz [pełną dokumentację](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

<Tip>
**Dopiero zaczynasz konfigurację?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
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
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadanych dokumentacji pól
    `title` / `description`, a także schematów pluginów i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako rozwiązaniem awaryjnym. Na potrzeby interfejsów
    szczegółowych i innych narzędzi gateway udostępnia również `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki wraz z podsumowaniami jego bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj bezpośrednio plik `~/.openclaw/openclaw.json`. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni odpowiadają schematowi. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

Uwagi dotyczące narzędzi schematu:

- `openclaw config schema` wyświetla tę samą rodzinę JSON Schema używaną przez Control UI
  i walidację konfiguracji.
- Traktuj dane wyjściowe tego schematu jako kanoniczny kontrakt możliwy do odczytu maszynowego dla
  `openclaw.json`; ten przegląd i dokumentacja konfiguracji go streszczają.
- Wartości pól `title` i `description` są przenoszone do danych wyjściowych schematu dla
  narzędzi edytora i formularzy.
- Wpisy zagnieżdżonych obiektów, wieloznacznych symboli (`*`) i elementów tablic (`[]`) dziedziczą te same
  metadane dokumentacji tam, gdzie istnieje pasująca dokumentacja pola.
- Gałęzie kompozycji `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane
  dokumentacji, więc warianty unii/przecięć zachowują tę samą pomoc dla pól.
- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia
  i podobne pola walidacji), dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych
  dla narzędzi szczegółowych.
- Schematy pluginów/kanałów w czasie działania są scalane, gdy gateway może załadować
  bieżący rejestr manifestów.
- `pnpm config:docs:check` wykrywa rozbieżności między artefaktami bazowymi konfiguracji
  używanymi w dokumentacji a bieżącą powierzchnią schematu.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

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

    Wszystkie kanały współdzielą ten sam wzorzec zasad DM:

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
    Ustaw podstawowy model i opcjonalne modele zapasowe:

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
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie obrazów w transkrypcie/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów vision w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie zapasowe.
    - W przypadku niestandardowych/samodzielnie hostowanych providerów zobacz [Custom providers](/pl/gateway/configuration-reference#custom-providers-and-base-urls) w dokumentacji.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany osobno dla każdego kanału za pomocą `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu zezwoleń)
    - `"open"`: zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie DM

    W przypadku grup użyj `groupPolicy` + `groupAllowFrom` lub list dozwolonych specyficznych dla kanału.

    Szczegóły dla poszczególnych kanałów znajdziesz w [pełnej dokumentacji](/pl/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Skonfiguruj ograniczanie wiadomości grupowych do wzmianek">
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

    - **Wzmianki w metadanych**: natywne wzmianki @ (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację](/pl/gateway/configuration-reference#group-chat-mention-gating), aby poznać zastąpienia dla poszczególnych kanałów i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills dla agenta">
    Użyj `agents.defaults.skills` jako współdzielonej bazy, a następnie zastąp ustawienia dla wybranych
    agentów za pomocą `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje ustawienia domyślne
          { id: "locked-down", skills: [] }, // brak Skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [Configuration Reference](/pl/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Dostosuj monitorowanie kondycji kanałów gateway">
    Określ, jak agresywnie gateway ma restartować kanały, które wyglądają na nieaktywne:

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
    - Zobacz [Health Checks](/pl/gateway/health), aby diagnozować problemy operacyjne, oraz [pełną dokumentację](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość i izolację rozmów:

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

    - `dmScope`: `main` (współdzielone) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne ustawienia domyślne routingu sesji powiązanego z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` oraz `/session max-age`).
    - Zobacz [Session Management](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację](/pl/gateway/configuration-reference#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agenta w izolowanych kontenerach Docker:

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

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację](/pl/gateway/configuration-reference#agentsdefaultssandbox), aby zobaczyć wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relay dla oficjalnych kompilacji iOS">
    Push oparty na relay konfiguruje się w `openclaw.json`.

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

    - Pozwala gateway wysyłać `push.test`, sygnały wybudzające i wybudzenia ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazanego dalej przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay dla całego wdrożenia.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, więc inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Zachowuje bezpośrednie APNs dla lokalnych/ręcznych kompilacji iOS. Wysyłki przez relay mają zastosowanie tylko do oficjalnie dystrybuowanych kompilacji, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalną kompilację iOS/TestFlight, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Kompletny przepływ:

    1. Zainstaluj oficjalną kompilację iOS/TestFlight skompilowaną z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay przy użyciu App Attest oraz potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłania, a następnie używa ich dla `push.test`, sygnałów wybudzających i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, ponownie połącz aplikację, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli udostępnisz nową kompilację iOS wskazującą na inne wdrożenie relay, aplikacja odświeży zapis w pamięci podręcznej dla rejestracji relay zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe zastąpienia env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie loopbackowym wyjściem awaryjnym dla środowiska developerskiego; nie zapisuj adresów URL relay HTTP w konfiguracji.

    Zobacz [iOS App](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać kompletny przepływ, oraz [Authentication and trust flow](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Skonfiguruj heartbeat (okresowe meldunki)">
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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby poznać pełny przewodnik.

  </Accordion>

  <Accordion title="Skonfiguruj zadania cron">
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

    - `sessionRetention`: usuwa ukończone sesje odizolowanych uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowanych linii.
    - Zobacz [Cron jobs](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooki (hooks)">
    Włącz punkty końcowe webhook HTTP na Gateway:

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
    - Traktuj całą zawartość ładunków hook/webhook jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa wyłącznie przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; utrzymuj wejście webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznych treści wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że wykonujesz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw również `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych przez hooki preferuj silne, nowoczesne poziomy modeli i ścisłe zasady narzędzi (na przykład tylko wiadomości plus sandboxing, jeśli to możliwe).

    Zobacz [pełną dokumentację](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu odizolowanych agentów z osobnymi przestrzeniami roboczymi i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację](/pl/gateway/configuration-reference#multi-agent-routing), aby poznać reguły powiązań i profile dostępu dla poszczególnych agentów.

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
    - **Tablica plików**: jest głęboko scalana w kolejności (ostatni wygrywa)
    - **Klucze sąsiadujące**: są scalane po include'ach (zastępują wartości dołączone)
    - **Zagnieżdżone include'y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku zawierającego
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include'ów

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — ręczny restart nie jest potrzebny w przypadku większości ustawień.

### Tryby przeładowywania

| Tryb                   | Zachowanie                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany. Automatycznie restartuje przy zmianach krytycznych. |
| **`hot`**              | Stosuje tylko bezpieczne zmiany. Gdy potrzebny jest restart, zapisuje ostrzeżenie w logach — obsługujesz to samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.               |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną działać przy następnym ręcznym restarcie.     |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól jest stosowana na gorąco bez przestojów. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                                 | Wymagany restart? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Kanały            | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane i rozszerzone kanały | Nie              |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                               | Nie              |
| Automatyzacja          | `hooks`, `cron`, `agent.heartbeat`                                   | Nie              |
| Sesje i wiadomości | `session`, `messages`                                                | Nie              |
| Narzędzia i multimedia       | `tools`, `browser`, `skills`, `audio`, `talk`                        | Nie              |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                              | Nie              |
| Serwer gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Tak**         |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                                 | **Tak**         |

<Note>
`gateway.reload` i `gateway.remote` to wyjątki — ich zmiana **nie** powoduje restartu.
</Note>

## RPC konfiguracji (aktualizacje programistyczne)

<Note>
RPC zapisu płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) mają ograniczenie do **3 żądań na 60 sekund** na `deviceId+clientIp`. Po przekroczeniu limitu RPC zwraca `UNAVAILABLE` z `retryAfterMs`.
</Note>

Bezpieczny/domyślny przepływ:

- `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji ograniczone do ścieżki z płytkim
  węzłem schematu, dopasowanymi metadanymi podpowiedzi i podsumowaniami bezpośrednich elementów podrzędnych
- `config.get`: pobierz bieżący zrzut + hash
- `config.patch`: preferowana ścieżka częściowej aktualizacji
- `config.apply`: tylko pełna zamiana całej konfiguracji
- `update.run`: jawna samodzielna aktualizacja + restart

Gdy nie zastępujesz całej konfiguracji, preferuj `config.schema.lookup`,
a następnie `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (pełna zamiana)">
    Waliduje + zapisuje pełną konfigurację i restartuje Gateway w jednym kroku.

    <Warning>
    `config.apply` zastępuje **całą konfigurację**. Użyj `config.patch` do częściowych aktualizacji albo `openclaw config set` dla pojedynczych kluczy.
    </Warning>

    Parametry:

    - `raw` (string) — ładunek JSON5 dla całej konfiguracji
    - `baseHash` (opcjonalne) — hash konfiguracji z `config.get` (wymagany, gdy konfiguracja istnieje)
    - `sessionKey` (opcjonalne) — klucz sesji dla pingu wybudzenia po restarcie
    - `note` (opcjonalne) — notatka dla znacznika restartu
    - `restartDelayMs` (opcjonalne) — opóźnienie przed restartem (domyślnie 2000)

    Żądania restartu są łączone, gdy jedno jest już oczekujące/w toku, a między cyklami restartu obowiązuje 30-sekundowy czas odnowienia.

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

    - Obiekty scalają się rekurencyjnie
    - `null` usuwa klucz
    - Tablice są zastępowane

    Parametry:

    - `raw` (string) — JSON5 zawierający tylko klucze do zmiany
    - `baseHash` (wymagane) — hash konfiguracji z `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — takie same jak w `config.apply`

    Zachowanie restartu odpowiada `config.apply`: łączenie oczekujących restartów oraz 30-sekundowy czas odnowienia między cyklami restartu.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

OpenClaw odczytuje zmienne env z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalne ustawienie zapasowe)

Żaden z tych plików nie zastępuje istniejących zmiennych env. Możesz też ustawić wbudowane zmienne env w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import env z powłoki (opcjonalne)">
  Jeśli jest włączony i oczekiwane klucze nie są ustawione, OpenClaw uruchamia powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik zmiennej env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych env w wartościach konfiguracji">
  Odwołuj się do zmiennych env w dowolnej wartości tekstowej konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas wczytywania
- Użyj `$${VAR}` dla literału
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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdują się w [Secrets Management](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Environment](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja

Aby zobaczyć pełną dokumentację wszystkich pól, przejdź do **[Configuration Reference](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Configuration Reference](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_
