---
read_when:
    - Konfigurujesz OpenClaw po raz pierwszy
    - Szukasz typowych wzorców konfiguracji
    - Przechodzisz do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-05T13:53:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguracja

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Podłącz kanały i określ, kto może wysyłać wiadomości do bota
- Ustaw modele, narzędzia, sandboxing lub automatyzację (cron, hooki)
- Dostosuj sesje, multimedia, sieć lub interfejs użytkownika

Pełną listę dostępnych pól znajdziesz w [pełnej dokumentacji](/gateway/configuration-reference).

<Tip>
**Dopiero zaczynasz pracę z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść przez konfigurację interaktywną, albo zajrzyj do przewodnika [Przykłady konfiguracji](/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
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
    openclaw onboard       # pełny przebieg onboardingu
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
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadanych dokumentacyjnych pól
    `title` / `description`, a także schematów pluginów i kanałów, gdy są
    dostępne, z edytorem **Raw JSON** jako ścieżką awaryjną. Dla interfejsów
    szczegółowych i innego oprzyrządowania gateway udostępnia też `config.schema.lookup`,
    aby pobrać jeden węzeł schematu ograniczony do ścieżki wraz z podsumowaniami bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje ten plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni odpowiadają schematowi. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

Uwagi dotyczące narzędzi schematu:

- `openclaw config schema` wypisuje tę samą rodzinę JSON Schema, której używają Control UI
  i walidacja konfiguracji.
- Wartości pól `title` i `description` są przenoszone do danych wyjściowych schematu dla
  edytorów i narzędzi formularzy.
- Wpisy zagnieżdżonych obiektów, wildcard (`*`) i elementów tablic (`[]`) dziedziczą te same
  metadane dokumentacyjne tam, gdzie istnieje odpowiadająca dokumentacja pól.
- Gałęzie kompozycji `anyOf` / `oneOf` / `allOf` także dziedziczą te same metadane
  dokumentacyjne, dzięki czemu warianty union/intersection zachowują tę samą pomoc dla pól.
- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia
  i podobne pola walidacyjne), dopasowanymi metadanymi wskazówek UI oraz podsumowaniami bezpośrednich elementów podrzędnych
  dla narzędzi typu drill-down.
- Schematy runtime pluginów/kanałów są scalane, gdy gateway może załadować
  bieżący rejestr manifestów.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchomi
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

    Wszystkie kanały współdzielą ten sam wzorzec polityki DM:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych dla `/model`.
    - Referencje modeli używają formatu `provider/model` (na przykład `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie w dół obrazów w transkryptach/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów vision podczas przebiegów z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/concepts/models), aby przełączać modele w czacie, oraz [Model Failover](/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie modeli zapasowych.
    - W przypadku dostawców niestandardowych/samohostowanych zobacz [Niestandardowi dostawcy](/gateway/configuration-reference#custom-providers-and-base-urls) w dokumentacji.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp do DM jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy dostają jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub z magazynu sparowanych dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie DM

    W przypadku grup użyj `groupPolicy` + `groupAllowFrom` albo list dozwolonych specyficznych dla kanału.

    Szczegóły per kanał znajdziesz w [pełnej dokumentacji](/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek w czacie grupowym">
    Domyślnie wiadomości grupowe **wymagają wzmianki**. Skonfiguruj wzorce per agent:

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
    - Zobacz [pełną dokumentację](/gateway/configuration-reference#group-chat-mention-gating), aby poznać nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills per agent">
    Użyj `agents.defaults.skills` jako współdzielonej bazy, a następnie nadpisz konkretne
    agenty przez `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje domyślne
          { id: "locked-down", skills: [] }, // brak Skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby odziedziczyć ustawienia domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
    - Zobacz [Skills](/tools/skills), [Konfiguracja Skills](/tools/skills-config) oraz
      [Dokumentację konfiguracji](/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Dostosuj monitorowanie zdrowia kanałów gateway">
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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitora zdrowia.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Health Checks](/gateway/health), aby poznać operacyjne debugowanie, oraz [pełną dokumentację](/gateway/configuration-reference#gateway), aby zobaczyć wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość rozmowy i izolację:

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

    - `dmScope`: `main` (wspólne) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne ustawienia domyślne dla routingu sesji powiązanego z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesją](/concepts/session), aby poznać zakresy, powiązania tożsamości i politykę wysyłania.
    - Zobacz [pełną dokumentację](/gateway/configuration-reference#session), aby zobaczyć wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych kontenerach Docker:

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

    Zobacz [Sandboxing](/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację](/gateway/configuration-reference#agentsdefaultssandbox), aby zobaczyć wszystkie opcje.

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

    - Pozwala gateway wysyłać `push.test`, impulsy wybudzające i wybudzenia ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłania ograniczonego do rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Zachowuje lokalne/ręczne buildy iOS na bezpośrednim APNs. Wysyłki oparte na relay dotyczą tylko oficjalnych dystrybuowanych buildów, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalny/TestFlight build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS skompilowany z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay za pomocą App Attest i potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłania, a następnie używa ich dla `push.test`, impulsów wybudzających i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz ją ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nowy build iOS wskazujący na inne wdrożenie relay, aplikacja odświeży zapis rejestracji relay w pamięci podręcznej zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania przez zmienne środowiskowe.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie lokalnym mechanizmem awaryjnym do celów deweloperskich dla loopback; nie zapisuj adresów URL HTTP relay w konfiguracji.

    Zobacz [Aplikacja iOS](/platforms/ios#relay-backed-push-for-official-builds), aby poznać pełny przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Skonfiguruj heartbeat (okresowe check-iny)">
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
    - Zobacz [Heartbeat](/gateway/heartbeat), aby przeczytać pełny przewodnik.

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

    - `sessionRetention`: przycinaj ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinaj `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowanych wierszy.
    - Zobacz [Zadania cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooki (hooki)">
    Włącz endpointy webhooków HTTP na Gateway:

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
    - Uwierzytelnianie hooków działa wyłącznie przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może być `/`; utrzymuj wejście webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - W przypadku agentów sterowanych przez hooki preferuj mocne nowoczesne klasy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości oraz sandboxing tam, gdzie to możliwe).

    Wszystkie opcje mapowania i integracji z Gmail znajdziesz w [pełnej dokumentacji](/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z oddzielnymi workspace i sesjami:

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

    Zobacz [Multi-Agent](/concepts/multi-agent) oraz [pełną dokumentację](/gateway/configuration-reference#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

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
    - **Klucze sąsiednie**: są scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku zawierającego include
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i stosuje zmiany automatycznie — dla większości ustawień nie jest wymagany ręczny restart.

### Tryby przeładowania

| Tryb                  | Zachowanie                                                                            |
| --------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bezpieczne zmiany na gorąco. W przypadku krytycznych zmian automatycznie restartuje. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Gdy potrzebny jest restart, zapisuje ostrzeżenie — obsługujesz to ręcznie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.            |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczynają działać przy następnym ręcznym restarcie. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól jest stosowana na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                                 | Wymaga restartu? |
| -------------------- | -------------------------------------------------------------------- | ---------------- |
| Kanały               | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane i rozszerzone kanały | Nie              |
| Agent i modele       | `agent`, `agents`, `models`, `routing`                               | Nie              |
| Automatyzacja        | `hooks`, `cron`, `agent.heartbeat`                                   | Nie              |
| Sesje i wiadomości   | `session`, `messages`                                                | Nie              |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `audio`, `talk`                      | Nie              |
| UI i różne           | `ui`, `logging`, `identity`, `bindings`                              | Nie              |
| Serwer Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Tak**          |
| Infrastruktura       | `discovery`, `canvasHost`, `plugins`                                 | **Tak**          |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

## RPC konfiguracji (aktualizacje programowe)

<Note>
Zapisy do control-plane RPC (`config.apply`, `config.patch`, `update.run`) są ograniczane do **3 żądań na 60 sekund** dla każdego `deviceId+clientIp`. Gdy limit zostanie osiągnięty, RPC zwraca `UNAVAILABLE` z `retryAfterMs`.
</Note>

Bezpieczny/domyslny przepływ:

- `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji ograniczone do ścieżki wraz z płytkim
  węzłem schematu, dopasowanymi metadanymi wskazówek i podsumowaniami bezpośrednich elementów podrzędnych
- `config.get`: pobierz bieżącą migawkę + hash
- `config.patch`: preferowana ścieżka częściowej aktualizacji
- `config.apply`: tylko pełne zastąpienie konfiguracji
- `update.run`: jawna samodzielna aktualizacja + restart

Jeśli nie zastępujesz całej konfiguracji, preferuj `config.schema.lookup`,
a następnie `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (pełne zastąpienie)">
    Waliduje + zapisuje pełną konfigurację i restartuje Gateway w jednym kroku.

    <Warning>
    `config.apply` zastępuje **całą konfigurację**. Użyj `config.patch` dla częściowych aktualizacji albo `openclaw config set` dla pojedynczych kluczy.
    </Warning>

    Parametry:

    - `raw` (string) — ładunek JSON5 dla całej konfiguracji
    - `baseHash` (opcjonalne) — hash konfiguracji z `config.get` (wymagany, gdy konfiguracja istnieje)
    - `sessionKey` (opcjonalne) — klucz sesji dla sygnału wybudzenia po restarcie
    - `note` (opcjonalne) — notatka dla sentinela restartu
    - `restartDelayMs` (opcjonalne) — opóźnienie przed restartem (domyślnie 2000)

    Żądania restartu są łączone, gdy jedno jest już oczekujące/w trakcie, a między cyklami restartu obowiązuje 30-sekundowy cooldown.

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

    Zachowanie restartu odpowiada `config.apply`: łączenie oczekujących restartów oraz 30-sekundowy cooldown między cyklami restartu.

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

<Accordion title="Import zmiennych środowiskowych z powłoki (opcjonalny)">
  Jeśli ta opcja jest włączona i oczekiwane klucze nie są ustawione, OpenClaw uruchamia powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik w zmiennej środowiskowej: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych środowiskowych w wartościach konfiguracji">
  Możesz odwoływać się do zmiennych środowiskowych w dowolnej wartości string w konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy zapisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas ładowania
- Użyj `$${VAR}`, aby uzyskać wynik dosłowny
- Działa także w plikach `$include`
- Podstawianie inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencje do sekretów (env, file, exec)">
  W polach obsługujących obiekty SecretRef możesz użyć:

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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdziesz w [Zarządzanie sekretami](/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchnia poświadczeń SecretRef](/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja

Aby zobaczyć kompletną dokumentację każdego pola, przejdź do **[Dokumentacja konfiguracji](/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/gateway/configuration-examples) · [Dokumentacja konfiguracji](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
