---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-21T09:53:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguracja

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i kontrola tego, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostosowanie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

<Tip>
**Dopiero zaczynasz pracę z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść przez konfigurację interaktywną, albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
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
  <Tab title="Kreator interaktywny">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (pojedyncze polecenia)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadanych dokumentacyjnych pól
    `title` / `description`, a także schematów Plugin i kanałów, gdy
    są dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla interfejsów
    zagłębiania się w strukturę i innych narzędzi gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje plik i stosuje zmiany automatycznie (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, nieprawidłowe typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

Uwagi o narzędziach schematu:

- `openclaw config schema` wypisuje tę samą rodzinę JSON Schema, której używają Control UI
  i walidacja konfiguracji.
- Traktuj to wyjście schematu jako kanoniczny kontrakt maszynowo odczytywalny dla
  `openclaw.json`; ten przegląd i dokumentacja referencyjna konfiguracji go podsumowują.
- Wartości pól `title` i `description` są przenoszone do wyjścia schematu dla
  narzędzi edytorów i formularzy.
- Zagnieżdżone obiekty, wpisy wieloznaczne (`*`) i elementy tablic (`[]`) dziedziczą te same
  metadane dokumentacyjne tam, gdzie istnieje pasująca dokumentacja pola.
- Gałęzie kompozycji `anyOf` / `oneOf` / `allOf` także dziedziczą te same metadane
  dokumentacyjne, więc warianty union/intersection zachowują tę samą pomoc dla pól.
- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia
  i podobne pola walidacyjne), dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych
  dla narzędzi zagłębiania się w strukturę.
- Schematy Plugin/kanałów środowiska uruchomieniowego są scalane, gdy gateway może załadować
  bieżący rejestr manifestów.
- `pnpm config:docs:check` wykrywa rozjazd między artefaktami bazowymi konfiguracji widocznymi dla dokumentacji
  a bieżącą powierzchnią schematu.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje też zaufaną ostatnią znaną dobrą kopię po udanym uruchomieniu. Jeśli
`openclaw.json` zostanie później zmieniony poza OpenClaw i przestanie przechodzić walidację, uruchomienie
i hot reload zachowają uszkodzony plik jako snapshot `.clobbered.*` z sygnaturą czasu,
przywrócą ostatnią znaną dobrą kopię i zapiszą głośne ostrzeżenie z powodem odzyskania.
Następny turn głównego agenta otrzyma też ostrzeżenie jako zdarzenie systemowe z informacją, że
konfiguracja została przywrócona i nie wolno jej bezmyślnie nadpisywać. Promowanie ostatniej znanej dobrej wersji
jest aktualizowane po zwalidowanym uruchomieniu i po zaakceptowanych hot reloadach, w tym
zapisach konfiguracji należących do OpenClaw, których utrwalony hash pliku nadal odpowiada zaakceptowanemu
zapisowi. Promowanie jest pomijane, gdy kandydat zawiera zredagowane placeholdery sekretów,
takie jak `***` lub skrócone wartości tokenów.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itp.)">
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

    Wszystkie kanały współdzielą ten sam wzorzec polityki DM:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako allowlista dla `/model`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steruje skalowaniem obrazów w transkryptach/narzędziach w dół (domyślnie `1200`); niższe wartości zwykle zmniejszają użycie tokenów vision przy przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać rotację autoryzacji i zachowanie fallback.
    - W przypadku niestandardowych/samohostowanych dostawców zobacz [Niestandardowi dostawcy](/pl/gateway/configuration-reference#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy dostają jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub sparowanego magazynu zezwoleń)
    - `"open"`: zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie DM

    W przypadku grup użyj `groupPolicy` + `groupAllowFrom` albo allowlist specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#dm-and-group-access), aby poznać szczegóły per kanał.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek na czacie grupowym">
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

    - **Wzmianki w metadanych**: natywne wzmianki @ (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#group-chat-mention-gating), aby poznać nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills per agent">
    Użyj `agents.defaults.skills` dla współdzielonej bazy, a następnie nadpisz konkretne
    agenty przez `agents.list[].skills`:

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
    - Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz
      [Dokumentację referencyjną konfiguracji](/pl/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostosuj monitorowanie kondycji kanałów gateway">
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
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania monitora globalnego.
    - Zobacz [Health Checks](/pl/gateway/health), aby debugować działanie operacyjne, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość rozmowy i izolację:

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
    - `threadBindings`: globalne wartości domyślne dla routingu sesji powiązanego z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesją](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i politykę wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#session), aby poznać wszystkie pola.

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

    Najpierw zbuduj obraz: `scripts/sandbox-setup.sh`

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relay dla oficjalnych buildów iOS">
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
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, więc inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Zachowuje lokalne/ręczne buildy iOS na bezpośrednim APNs. Wysyłanie oparte na relay dotyczy tylko oficjalnych dystrybuowanych buildów, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalny/TestFlight build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS skompilowany z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom Node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay przy użyciu App Attest i paragonu aplikacji, a następnie publikuje payload `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłania, a następnie używa ich do `push.test`, sygnałów wybudzających i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nowy build iOS wskazujący na inne wdrożenie relay, aplikacja odświeży zapisaną w pamięci podręcznej rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga o zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania przez zmienne środowiskowe.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie loopbackowym wyjściem awaryjnym dla developmentu; nie utrwalaj adresów URL relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby przeczytać pełny przewodnik.

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

    - `sessionRetention`: przycinaj ukończone sesje izolowanych uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinaj `cron/runs/<jobId>.jsonl` według rozmiaru i zachowanych linii.
    - Zobacz [Zadania cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooki (hooki)">
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
    - Traktuj całą zawartość payloadów hooków/webhooków jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; utrzymuj wejście webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - W przypadku agentów uruchamianych przez hooki preferuj silne nowoczesne klasy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

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
    - **Tablica plików**: jest głęboko scalana po kolei (późniejsze wygrywają)
    - **Klucze rodzeństwa**: są scalane po include’ach (nadpisują wartości z include’ów)
    - **Zagnieżdżone include’y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku zawierającego
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania i include’ów cyklicznych

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i stosuje zmiany automatycznie — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustanie zamieszanie związane z tymczasowym zapisem/zmianą nazwy przez edytor, odczytuje końcowy plik i odrzuca
nieprawidłowe zewnętrzne edycje, przywracając ostatnią znaną dobrą konfigurację. Zapisy konfiguracji należące do OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` lub zmniejszenie pliku o więcej niż połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Jeśli w logach zobaczysz `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź pasujący
plik `.clobbered.*` obok `openclaw.json`, popraw odrzucony payload, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby przejść przez checklistę odzyskiwania.

### Tryby przeładowania

| Tryb                  | Zachowanie                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bezpieczne zmiany metodą hot apply. Dla krytycznych zmian automatycznie restartuje. |
| **`hot`**             | Stosuje metodą hot apply tylko bezpieczne zmiany. Gdy potrzebny jest restart, zapisuje ostrzeżenie — obsługujesz go samodzielnie. |
| **`restart`**         | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.              |
| **`off`**             | Wyłącza obserwowanie pliku. Zmiany zaczną działać przy następnym ręcznym restarcie.    |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się metodą hot apply, a co wymaga restartu

Większość pól stosuje się metodą hot apply bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria           | Pola                                                                 | Potrzebny restart? |
| ------------------- | -------------------------------------------------------------------- | ------------------ |
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane kanały i kanały rozszerzeń | Nie                |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                               | Nie                |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                   | Nie                |
| Sesje i wiadomości  | `session`, `messages`                                                | Nie                |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `audio`, `talk`                     | Nie                |
| UI i różne          | `ui`, `logging`, `identity`, `bindings`                              | Nie                |
| Serwer Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Tak**            |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                                 | **Tak**            |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

## Config RPC (aktualizacje programistyczne)

<Note>
RPC zapisu control plane (`config.apply`, `config.patch`, `update.run`) mają limit szybkości do **3 żądań na 60 sekund** na `deviceId+clientIp`. Po przekroczeniu limitu RPC zwraca `UNAVAILABLE` z `retryAfterMs`.
</Note>

Bezpieczny/domyślny przepływ:

- `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji ograniczone do ścieżki z płytkim
  węzłem schematu, dopasowanymi metadanymi podpowiedzi i podsumowaniami bezpośrednich elementów podrzędnych
- `config.get`: pobierz bieżący snapshot + hash
- `config.patch`: preferowana ścieżka częściowej aktualizacji
- `config.apply`: tylko pełna zamiana konfiguracji
- `update.run`: jawna self-update + restart

Jeśli nie zastępujesz całej konfiguracji, preferuj `config.schema.lookup`,
a następnie `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (pełna zamiana)">
    Waliduje + zapisuje pełną konfigurację i restartuje Gateway w jednym kroku.

    <Warning>
    `config.apply` zastępuje **całą konfigurację**. Użyj `config.patch` do częściowych aktualizacji albo `openclaw config set` dla pojedynczych kluczy.
    </Warning>

    Parametry:

    - `raw` (string) — payload JSON5 dla całej konfiguracji
    - `baseHash` (opcjonalne) — hash konfiguracji z `config.get` (wymagany, gdy konfiguracja istnieje)
    - `sessionKey` (opcjonalne) — klucz sesji dla pingu wybudzającego po restarcie
    - `note` (opcjonalne) — notatka dla sentinela restartu
    - `restartDelayMs` (opcjonalne) — opóźnienie przed restartem (domyślnie 2000)

    Żądania restartu są scalane, gdy jedno już oczekuje/trwa, a między cyklami restartu obowiązuje 30-sekundowy cooldown.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
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

    Zachowanie restartu odpowiada `config.apply`: scalane oczekujące restarty oraz 30-sekundowy cooldown między cyklami restartu.

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

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawiać wbudowane zmienne środowiskowe w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import zmiennych środowiskowych powłoki (opcjonalne)">
  Jeśli ta opcja jest włączona, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia twoją powłokę logowania i importuje tylko brakujące klucze:

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
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości string w konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas wczytywania
- Użyj `$${VAR}`, aby uzyskać dosłowny wynik
- Działa także w plikach `$include`
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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby poznać pełny priorytet i źródła.

## Pełna dokumentacja referencyjna

Aby zobaczyć kompletną dokumentację referencyjną wszystkich pól, przejdź do **[Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_
