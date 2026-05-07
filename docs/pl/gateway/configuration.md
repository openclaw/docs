---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-07T13:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
z dowiązaniami symbolicznymi nie są obsługiwane dla zapisów należących do OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować dowiązanie symboliczne. Jeśli przechowujesz konfigurację poza
domyślnym katalogiem stanu, ustaw `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku nie ma, OpenClaw używa bezpiecznych wartości domyślnych. Typowe powody dodania konfiguracji:

- Połączenie kanałów i kontrola, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostrojenie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference) wszystkich dostępnych pól.

Agenci i automatyzacja powinni używać `config.schema.lookup`, aby uzyskać dokładną
dokumentację na poziomie pól przed edycją konfiguracji. Używaj tej strony do wskazówek zorientowanych na zadania oraz
[Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference) do szerszej
mapy pól i wartości domyślnych.

<Tip>
**Dopiero zaczynasz konfigurować?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples) z kompletnymi konfiguracjami do skopiowania i wklejenia.
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
  <Tab title="UI sterowania">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Konfiguracja**.
    UI sterowania renderuje formularz na podstawie aktywnego schematu konfiguracji, w tym metadane dokumentacji
    pól `title` / `description` oraz schematy pluginów i kanałów, gdy są dostępne,
    z edytorem **Surowy JSON** jako wyjściem awaryjnym. Dla interfejsów
    szczegółowych i innych narzędzi Gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj `~/.openclaw/openclaw.json` bezpośrednio. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje w pełni zgodne ze schematem. Nieznane klucze, błędne typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez UI sterowania
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania elementów podrzędnych dla narzędzi szczegółowych. Metadane dokumentacji pól `title`/`description`
przechodzą przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablicy (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy pluginów i kanałów w czasie działania są scalane, gdy
rejestr manifestów jest załadowany.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway zachowuje zaufaną kopię ostatniej poprawnej konfiguracji po każdym udanym uruchomieniu,
ale uruchamianie i hot reload nie przywracają jej automatycznie. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym lokalnej walidacji plugina), uruchomienie Gateway się nie powiedzie lub
przeładowanie zostanie pominięte, a bieżące środowisko wykonawcze zachowa ostatnią zaakceptowaną konfigurację.
Uruchom `openclaw doctor --fix` (lub `--yes`), aby naprawić konfigurację z prefiksami/nadpisaną albo
przywrócić ostatnią poprawną kopię. Promowanie do ostatniej poprawnej kopii jest pomijane, gdy
kandydat zawiera zredagowane symbole zastępcze sekretów, takie jak `***`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itd.)">
    Każdy kanał ma własną sekcję konfiguracji w `channels.<provider>`. Zobacz dedykowaną stronę kanału z krokami konfiguracji:

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
    - `agents.defaults.imageMaxDimensionPx` steruje zmniejszaniem obrazów z transkrypcji/narzędzi (domyślnie `1200`); niższe wartości zwykle zmniejszają użycie tokenów wizji w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele w czacie, oraz [Przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie zapasowe.
    - W przypadku niestandardowych/samodzielnie hostowanych dostawców zobacz [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp do wiadomości prywatnych jest kontrolowany osobno dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub w sparowanym magazynie zezwoleń)
    - `"open"`: zezwól na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie wiadomości prywatne

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo list zezwoleń specyficznych dla kanału.

    Szczegóły dla poszczególnych kanałów znajdziesz w [pełnej dokumentacji](/pl/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek w czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce wyzwalaczy dla poszczególnych agentów i pozostaw widoczne odpowiedzi w pokoju na domyślnej ścieżce narzędzia wiadomości, chyba że celowo chcesz używać starszych automatycznych odpowiedzi końcowych:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // ustaw "message_tool", aby wszędzie wymagać wysyłania przez narzędzie wiadomości
        groupChat: {
          visibleReplies: "message_tool", // domyślnie; użyj "automatic" dla starszych odpowiedzi w pokoju
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

    - **Wzmianki w metadanych**: natywne @-wzmianki (WhatsApp dotknij-aby-wspomnieć, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może globalnie wymagać wysyłania przez narzędzie wiadomości; `messages.groupChat.visibleReplies` zastępuje to dla grup/kanałów.
    - Zobacz [pełną dokumentację](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać tryby widocznych odpowiedzi, nadpisania dla poszczególnych kanałów i tryb czatu z samym sobą.

  </Accordion>

  <Accordion title="Ogranicz Skills dla poszczególnych agentów">
    Użyj `agents.defaults.skills` jako wspólnej podstawy, a następnie nadpisz konkretnych
    agentów za pomocą `agents.list[].skills`:

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
    - Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [Dokumentację konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostosuj monitorowanie kondycji kanałów Gateway">
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
    - Użyj `channels.<provider>.healthMonitor.enabled` albo `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Dostosuj limit czasu uzgadniania WebSocket Gateway">
    Daj klientom lokalnym więcej czasu na ukończenie przedautoryzacyjnego uzgadniania WebSocket na
    obciążonych hostach lub hostach o małej mocy:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Wartość domyślna to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo dla jednorazowych nadpisań usługi lub powłoki.
    - Najpierw najlepiej naprawić zacięcia uruchamiania/pętli zdarzeń; to ustawienie jest przeznaczone dla hostów, które są zdrowe, ale wolne podczas rozgrzewania.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość i izolację konwersacji:

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
    - `threadBindings`: globalne wartości domyślne dla trasowania sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

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

    Najpierw zbuduj obraz - z checkoutu źródeł uruchom `scripts/sandbox-setup.sh`, a przy instalacji z npm zobacz wbudowane polecenie `docker build` w [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing), a wszystkie opcje w [pełnej referencji](/pl/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Włącz push wspierany przez relay dla oficjalnych buildów iOS">
    Push wspierany przez relay konfiguruje się w `openclaw.json`.

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

    - Pozwala gateway wysyłać `push.test`, pobudki wake nudges i pobudki ponownego połączenia przez zewnętrzny relay.
    - Używa grantu wysyłania o zakresie rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay obowiązującego dla całego wdrożenia.
    - Wiąże każdą rejestrację wspieraną przez relay z tożsamością gateway, z którą sparowano aplikację iOS, więc inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne buildy iOS przy bezpośrednim APNs. Wysyłki wspierane przez relay dotyczą tylko oficjalnie dystrybuowanych buildów, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalny/TestFlight build iOS, aby ruch rejestracji i wysyłania trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalny/TestFlight build iOS skompilowany z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay z użyciem App Attest oraz paragonu aplikacji, a następnie publikuje payload `push.apns.register` wspierany przez relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i grant wysyłania, a następnie używa ich dla `push.test`, pobudek wake nudges i pobudek ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nowy build iOS wskazujący inne wdrożenie relay, aplikacja odświeży swoją buforowaną rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje awaryjną furtką deweloperską tylko dla local loopback; nie zapisuj URL-i relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Uwierzytelnianie i przepływ zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

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
    - `directPolicy`: `allow` (domyślnie) albo `block` dla celów Heartbeat w stylu DM
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

    - `sessionRetention`: usuwa ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i zachowywanych wierszy.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

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
    - Traktuj całą zawartość payloadów hook/Webhook jako niezaufane dane wejściowe.
    - Użyj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówki (`Authorization: Bearer ...` albo `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; utrzymuj ingress Webhook na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw wyłączone flagi omijania niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć wybierane przez wywołującego klucze sesji.
    - Dla agentów sterowanych hookami preferuj mocne nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

    Zobacz [pełną referencję](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) i [pełną referencję](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu poszczególnych agentów.

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
    - **Tablica plików**: głęboko scalana po kolei (późniejszy wygrywa)
    - **Klucze równorzędne**: scalane po include (nadpisują dołączone wartości)
    - **Zagnieżdżone include**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku zawierającego include
    - **Zapisy zarządzane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany zapis przez include**: include w katalogu głównym, tablice include oraz include
      z nadpisaniami równorzędnymi kończą się bezpiecznym błędem dla zapisów zarządzanych przez OpenClaw zamiast
      spłaszczać konfigurację
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się pod katalogiem zawierającym
      `openclaw.json`. Aby współdzielić drzewo między maszynami lub użytkownikami, ustaw
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w POSIX, `;` w Windows) do
      dodatkowych katalogów, do których include mogą się odwoływać. Dowiązania symboliczne są rozwiązywane
      i ponownie sprawdzane, więc ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony root, nadal jest odrzucana.
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include

  </Accordion>
</AccordionGroup>

## Przeładowanie konfiguracji na gorąco

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany - dla większości ustawień ręczny restart nie jest potrzebny.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustanie cykl tymczasowych zapisów/zmian nazw wykonywany przez edytor, odczytuje finalny plik i odrzuca
nieprawidłowe edycje zewnętrzne bez przepisywania `openclaw.json`. Zapisy konfiguracji zarządzane przez OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie jak
usunięcie `gateway.mode` albo zmniejszenie pliku o więcej niż połowę, są odrzucane i
zapisywane jako `.rejected.*` do inspekcji.

Jeśli zobaczysz `config reload skipped (invalid config)` albo uruchomienie zgłosi `Invalid
config`, sprawdź konfigurację, uruchom `openclaw config validate`, a następnie uruchom `openclaw
doctor --fix`, aby naprawić. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config),
aby przejść checklistę.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Automatycznie restartuje przy krytycznych. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy potrzebny jest restart - obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.                 |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczynają obowiązywać przy następnym ręcznym restarcie. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                            | Wymagany restart? |
| -------------------- | --------------------------------------------------------------- | ----------------- |
| Kanały               | `channels.*`, `web` (WhatsApp) - wszystkie wbudowane i pluginowe kanały | Nie               |
| Agent i modele       | `agent`, `agents`, `models`, `routing`                          | Nie               |
| Automatyzacja        | `hooks`, `cron`, `agent.heartbeat`                              | Nie               |
| Sesje i wiadomości   | `session`, `messages`                                           | Nie               |
| Narzędzia i media    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`            | Nie               |
| UI i różne           | `ui`, `logging`, `identity`, `bindings`                         | Nie               |
| Serwer Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)            | **Tak**           |
| Infrastruktura       | `discovery`, `plugins`                                          | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami - ich zmiana **nie** wyzwala restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
ponowne wczytanie na podstawie układu autorskiego źródła, a nie spłaszczonego
widoku w pamięci. Dzięki temu decyzje dotyczące hot reload (zastosowanie na
gorąco vs ponowne uruchomienie) pozostają przewidywalne nawet wtedy, gdy jedna
sekcja najwyższego poziomu znajduje się w osobnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie ponownego wczytania
kończy się bezpieczną odmową, jeśli układ źródła jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi, które zapisują konfigurację przez API Gateway, preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę oraz `hash`
- `config.patch` do aktualizacji częściowych (JSON merge patch: obiekty są scalane, `null` usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` do jawnej samoaktualizacji oraz ponownego uruchomienia; dołącz `continuationMessage`, gdy sesja po ponownym uruchomieniu ma wykonać jedną turę kontynuacji
- `update.status`, aby sprawdzić najnowszy znacznik ponownego uruchomienia aktualizacji i zweryfikować działającą wersję po restarcie

Agenci powinni traktować `config.schema.lookup` jako pierwszy punkt sprawdzania
dokładnej dokumentacji i ograniczeń na poziomie pól. Użyj [Dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do
dedykowanych dokumentacji podsystemów.

<Note>
Zapisy w płaszczyźnie sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania
ponownego uruchomienia są scalane, a następnie wymuszają 30-sekundowy okres
ochłonięcia między cyklami restartu. `update.status` jest tylko do odczytu, ale
ma zakres administracyjny, ponieważ znacznik restartu może zawierać podsumowania
kroków aktualizacji oraz końcówki wyjścia poleceń.
</Note>

Przykład częściowej poprawki:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zarówno `config.apply`, jak i `config.patch` akceptują `raw`, `baseHash`,
`sessionKey`, `note` oraz `restartDelayMs`. `baseHash` jest wymagany dla obu
metod, gdy konfiguracja już istnieje.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalna ścieżka awaryjna)

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
- Brakujące/puste zmienne zgłaszają błąd podczas wczytywania
- Użyj `$${VAR}`, aby uzyskać dosłowny wynik
- Działa wewnątrz plików `$include`
- Podstawianie w tekście: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencje sekretów (env, file, exec)">
  W przypadku pól obsługujących obiekty SecretRef możesz użyć:

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

Pełną dokumentację każdego pola znajdziesz w **[Dokumentacji konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
