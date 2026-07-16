---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Wyszukiwanie typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Omówienie konfiguracji: typowe zadania, szybka konfiguracja i łącza do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-16T18:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`. Jeśli plik nie istnieje, OpenClaw używa bezpiecznych wartości domyślnych.

Aktywna ścieżka konfiguracji musi wskazywać zwykły plik. Zapisy wykonywane przez OpenClaw zastępują go atomowo (przez zmianę nazwy na ścieżkę docelową), więc w przypadku dowiązania symbolicznego `openclaw.json` zastąpiony zostanie jego cel, zamiast zapisania danych za pośrednictwem dowiązania — należy unikać układów konfiguracji korzystających z dowiązań symbolicznych. Jeśli konfiguracja znajduje się poza domyślnym katalogiem stanu, należy ustawić `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Typowe powody dodania konfiguracji:

- Połączenie kanałów i kontrolowanie, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, piaskownicy lub automatyzacji (cron, hooki)
- Dostrojenie sesji, multimediów, sieci lub interfejsu użytkownika

Opis wszystkich dostępnych pól znajduje się w [pełnej dokumentacji referencyjnej](/pl/gateway/configuration-reference).

Agenci i automatyzacje powinni przed edycją konfiguracji użyć `config.schema.lookup`,
aby uzyskać dokładną dokumentację poszczególnych pól. Ta strona zawiera wskazówki
zorientowane na zadania, natomiast [dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
przedstawia szerszą mapę pól i wartości domyślne.

<Tip>
**Pierwszy kontakt z konfiguracją?** Interaktywną konfigurację można rozpocząć za pomocą `openclaw onboard` albo skorzystać z przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), który zawiera kompletne konfiguracje gotowe do skopiowania i wklejenia.
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
    openclaw onboard       # pełny proces wdrażania
    openclaw configure     # kreator konfiguracji
    ```
  </Tab>
  <Tab title="CLI (pojedyncze polecenia)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interfejs sterowania">
    Należy otworzyć [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyć karty **Config**.
    Interfejs sterowania renderuje formularz na podstawie aktywnego schematu konfiguracji,
    uwzględniając metadane dokumentacji pól `title` / `description` oraz
    dostępne schematy pluginów i kanałów, a także udostępnia edytor **Raw JSON** jako
    rozwiązanie awaryjne. Na potrzeby interfejsów umożliwiających szczegółową analizę
    i innych narzędzi Gateway udostępnia również `config.schema.lookup`, które pobiera
    jeden węzeł schematu ograniczony do wskazanej ścieżki wraz z podsumowaniami
    jego bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Należy bezpośrednio edytować `~/.openclaw/openclaw.json`. Gateway monitoruje plik i automatycznie stosuje zmiany (zobacz [przeładowywanie na gorąco](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje wyłącznie konfiguracje w pełni zgodne ze schematem. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg znaków), dzięki któremu edytory mogą dołączać metadane schematu JSON.
</Warning>

`openclaw config schema` wyświetla kanoniczny schemat JSON używany przez interfejs sterowania
i mechanizm walidacji. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do wskazanej
ścieżki wraz z podsumowaniami elementów podrzędnych dla narzędzi umożliwiających szczegółową
analizę. Metadane dokumentacji pól `title`/`description` są przenoszone
przez zagnieżdżone obiekty, symbole wieloznaczne (`*`), elementy tablic
(`[]`) oraz gałęzie `anyOf`/`oneOf`/`allOf`.
Schematy pluginów i kanałów środowiska uruchomieniowego są scalane po załadowaniu rejestru manifestów.

Gdy walidacja zakończy się niepowodzeniem:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Należy uruchomić `openclaw doctor`, aby wyświetlić dokładne problemy
- Należy uruchomić `openclaw doctor --fix` (`--repair` jest tą samą flagą; `--yes` pomija monity), aby zastosować naprawy

Po każdym pomyślnym uruchomieniu Gateway zachowuje zaufaną kopię ostatniej znanej
poprawnej konfiguracji, ale uruchamianie i przeładowywanie na gorąco nie przywracają
jej automatycznie — robi to wyłącznie `openclaw doctor --fix`. Jeśli `openclaw.json`
nie przejdzie walidacji (w tym walidacji lokalnej pluginu), uruchomienie Gateway kończy
się niepowodzeniem albo przeładowanie zostaje pominięte, a bieżące środowisko uruchomieniowe
nadal korzysta z ostatniej zaakceptowanej konfiguracji. Odrzucony zapis jest również
zapisywany jako `<path>.rejected.<timestamp>` do celów inspekcji. Gateway blokuje zapisy wyglądające
na przypadkowe nadpisanie — usunięcie `gateway.mode`, utratę bloku `meta`
lub zmniejszenie pliku o ponad połowę — chyba że zapis jawnie zezwala na destrukcyjne
zmiany. Kandydat nie jest promowany do ostatniej znanej poprawnej konfiguracji, jeśli
zawiera symbol zastępczy zredagowanego sekretu, taki jak `***` lub `[redacted]`.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Konfigurowanie kanału (WhatsApp, Telegram, Discord itp.)">
    Każdy kanał ma własną sekcję konfiguracji w `channels.<provider>`. Instrukcje konfiguracji znajdują się na stronie poświęconej danemu kanałowi:

    - [Discord](/pl/channels/discord) — `channels.discord`
    - [Feishu](/pl/channels/feishu) — `channels.feishu`
    - [Google Chat](/pl/channels/googlechat) — `channels.googlechat`
    - [iMessage](/pl/channels/imessage) — `channels.imessage`
    - [Mattermost](/pl/channels/mattermost) — `channels.mattermost`
    - [Microsoft Teams](/pl/channels/msteams) — `channels.msteams`
    - [Signal](/pl/channels/signal) — `channels.signal`
    - [Slack](/pl/channels/slack) — `channels.slack`
    - [Telegram](/pl/channels/telegram) — `channels.telegram`
    - [WhatsApp](/pl/channels/whatsapp) — `channels.whatsapp`

    Wszystkie kanały korzystają z tego samego wzorca zasad wiadomości prywatnych:

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

  <Accordion title="Wybór i konfigurowanie modeli">
    Należy ustawić model podstawowy i opcjonalne modele zastępcze:

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

    - `agents.defaults.models` definiuje katalog modeli i pełni funkcję listy dozwolonych dla `/model`; wpisy `provider/*` ograniczają `/model`, `/models` i selektory modeli do wybranych dostawców, nadal korzystając z dynamicznego wykrywania modeli.
    - Aby dodać wpisy do listy dozwolonych bez usuwania istniejących modeli, należy użyć `openclaw config set agents.defaults.models '<json>' --strict-json --merge`. Zwykłe zastąpienia, które spowodowałyby usunięcie wpisów, są odrzucane, chyba że przekazano `--replace`.
    - Odwołania do modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steruje zmniejszaniem rozdzielczości obrazów w transkrypcjach i narzędziach (domyślnie `1200`); niższe wartości zazwyczaj ograniczają użycie tokenów wizyjnych podczas przebiegów z dużą liczbą zrzutów ekranu.
    - Informacje o przełączaniu modeli na czacie znajdują się w [CLI modeli](/pl/concepts/models), a informacje o rotacji uwierzytelniania i działaniu modeli zastępczych — w [Przełączaniu awaryjnym modeli](/pl/concepts/model-failover).
    - Informacje o niestandardowych lub samodzielnie hostowanych dostawcach znajdują się w sekcji [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontrolowanie, kto może wysyłać wiadomości do bota">
    Dostęp do wiadomości prywatnych jest kontrolowany osobno dla każdego kanału za pomocą `dmPolicy` (domyślnie `"pairing"`):

    - `"pairing"`: nieznani nadawcy otrzymują jednorazowy kod parowania wymagający zatwierdzenia
    - `"allowlist"`: dostęp mają tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie wiadomości prywatne

    W przypadku grup należy użyć `groupPolicy` (`"allowlist" | "open" | "disabled"`) wraz z `groupAllowFrom` lub listami dozwolonych właściwymi dla kanału.

    Szczegóły dotyczące poszczególnych kanałów znajdują się w [pełnej dokumentacji referencyjnej](/pl/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Konfigurowanie wymogu wzmianki na czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Wzorce wyzwalające konfiguruje się osobno dla każdego agenta. Zwykłe odpowiedzi w grupie lub kanale są publikowane automatycznie; w pokojach współdzielonych, w których agent powinien decydować, kiedy się odezwać, należy włączyć ścieżkę narzędzia wiadomości:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // ustaw "message_tool", aby wszędzie wymagać wysyłania przez narzędzie wiadomości
        groupChat: {
          visibleReplies: "message_tool", // opcjonalne; widoczny wynik wymaga message(action=send)
          unmentionedInbound: "room_event", // niewspomniane, stale aktywne rozmowy grupowe stanowią cichy kontekst
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

    - **Wzmianki w metadanych**: natywne wzmianki @ (dotknięcie wzmianki w WhatsApp, @bot w Telegramie itp.)
    - **Wzorce tekstowe**: bezpieczne wzorce wyrażeń regularnych w `mentionPatterns`
    - **Widoczne odpowiedzi**: `messages.visibleReplies` może globalnie wymagać wysyłania za pomocą narzędzia wiadomości; `messages.groupChat.visibleReplies` zastępuje to ustawienie dla grup i kanałów.
    - Tryby widocznych odpowiedzi, ustawienia zastępujące dla poszczególnych kanałów i tryb czatu z samym sobą opisano w [pełnej dokumentacji referencyjnej](/pl/gateway/config-channels#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Ograniczanie Skills dla poszczególnych agentów">
    Należy użyć `agents.defaults.skills` jako wspólnej konfiguracji bazowej, a następnie zastąpić ją
    dla określonych agentów za pomocą `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
          { id: "locked-down", skills: [] }, // bez Skills
        ],
      },
    }
    ```

    - Aby domyślnie nie ograniczać Skills, należy pominąć `agents.defaults.skills`.
    - Aby odziedziczyć wartości domyślne, należy pominąć `agents.list[].skills`.
    - Aby wyłączyć Skills, należy ustawić `agents.list[].skills: []`.
    - Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz
      [Dokumentacja referencyjna konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrajanie monitorowania stanu kanałów Gateway">
    Można określić, jak agresywnie Gateway ma ponownie uruchamiać kanały, które wydają się nieaktywne:

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

    - Przedstawione wartości są domyślne. Aby globalnie wyłączyć ponowne uruchamianie przez monitor stanu, należy ustawić `gateway.channelHealthCheckMinutes: 0`.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Aby wyłączyć automatyczne ponowne uruchamianie pojedynczego kanału lub konta bez wyłączania globalnego monitora, należy użyć `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`.
    - Informacje o debugowaniu operacyjnym znajdują się w [Kontrolach stanu](/pl/gateway/health), a opis wszystkich pól — w [pełnej dokumentacji referencyjnej](/pl/gateway/configuration-reference#gateway).

  </Accordion>

  <Accordion title="Dostrajanie limitu czasu uzgadniania WebSocket Gateway">
    Lokalnym klientom można zapewnić więcej czasu na ukończenie uzgadniania WebSocket
    poprzedzającego uwierzytelnianie na obciążonych hostach lub hostach o małej mocy:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Wartość domyślna to `15000` milisekund.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` nadal ma pierwszeństwo w przypadku jednorazowych nadpisań usługi lub powłoki.
    - Najpierw należy usunąć zastoje podczas uruchamiania lub w pętli zdarzeń; to ustawienie jest przeznaczone dla hostów, które działają prawidłowo, ale wolno podczas rozgrzewania.

  </Accordion>

  <Accordion title="Konfigurowanie sesji i resetowania">
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

    - `dmScope`: `main` (współdzielone) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne wartości domyślne routingu sesji powiązanych z wątkami. `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age` odpowiednio wiążą, usuwają powiązanie, wyświetlają listę i dostosowują to ustawienie dla poszczególnych sesji (Discord wiąże wątki, Telegram wiąże tematy/konwersacje).
    - Informacje o zakresach, powiązaniach tożsamości i zasadach wysyłania zawiera sekcja [Zarządzanie sesjami](/pl/concepts/session).
    - Wszystkie pola opisano w [pełnej dokumentacji](/pl/gateway/config-agents#session).

  </Accordion>

  <Accordion title="Włączanie piaskownicy">
    Sesje agentów można uruchamiać w izolowanych środowiskach piaskownicy:

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

    Najpierw należy zbudować obraz — w repozytorium źródłowym należy uruchomić `scripts/sandbox-setup.sh`, a w przypadku instalacji z npm użyć wbudowanego polecenia `docker build` opisanego w sekcji [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup).

    Pełny przewodnik zawiera sekcja [Piaskownica](/pl/gateway/sandboxing), a wszystkie opcje opisano w [pełnej dokumentacji](/pl/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Włączanie przekazywanych powiadomień push dla oficjalnych kompilacji iOS">
    Przekazywane powiadomienia push w publicznych kompilacjach z App Store korzystają z hostowanej usługi przekazywania OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Niestandardowe wdrożenia usługi przekazywania wymagają celowo oddzielnej ścieżki kompilacji i wdrażania iOS, której adres URL usługi przekazywania jest zgodny z adresem URL usługi przekazywania Gateway. W przypadku korzystania z niestandardowej kompilacji usługi przekazywania należy ustawić w konfiguracji Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcjonalne. Wartość domyślna: 10000
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

    Działanie:

    - Umożliwia Gateway wysyłanie `push.test`, sygnałów wybudzania i wybudzeń ponownego połączenia przez zewnętrzną usługę przekazywania.
    - Używa uprawnienia do wysyłania ograniczonego do rejestracji, przekazanego przez sparowaną aplikację iOS. Gateway nie wymaga tokenu usługi przekazywania obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację korzystającą z usługi przekazywania z tożsamością Gateway, z którą sparowano aplikację iOS, dzięki czemu inny Gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim korzystaniu z APNs. Wysyłanie przez usługę przekazywania dotyczy tylko oficjalnie dystrybuowanych kompilacji zarejestrowanych za jej pośrednictwem.
    - Musi odpowiadać bazowemu adresowi URL usługi przekazywania wbudowanemu w kompilację iOS, aby ruch rejestracyjny i wysyłania trafiał do tego samego wdrożenia usługi przekazywania.

    Przepływ kompleksowy:

    1. Zainstalować oficjalną aplikację iOS.
    2. Opcjonalnie: skonfigurować `gateway.push.apns.relay.baseUrl` w Gateway wyłącznie w przypadku korzystania z celowo oddzielnej, niestandardowej kompilacji usługi przekazywania.
    3. Sparować aplikację iOS z Gateway i umożliwić połączenie sesji Node oraz operatora.
    4. Aplikacja iOS pobiera tożsamość Gateway, rejestruje się w usłudze przekazywania przy użyciu App Attest oraz potwierdzenia zakupu aplikacji, a następnie publikuje do sparowanego Gateway ładunek `push.apns.register` obsługiwany przez usługę przekazywania.
    5. Gateway zapisuje uchwyt usługi przekazywania i uprawnienie do wysyłania, a następnie używa ich dla `push.test`, sygnałów wybudzania i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Po przełączeniu aplikacji iOS na inny Gateway należy ponownie połączyć aplikację, aby mogła opublikować nową rejestrację usługi przekazywania powiązaną z tym Gateway.
    - W przypadku wydania nowej kompilacji iOS wskazującej inne wdrożenie usługi przekazywania aplikacja odświeża rejestrację usługi przekazywania w pamięci podręcznej zamiast ponownie używać starego źródła usługi.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania za pomocą zmiennych środowiskowych.
    - Niestandardowe adresy URL usługi przekazywania Gateway muszą odpowiadać bazowemu adresowi URL wbudowanemu w kompilację iOS; publiczny kanał wydań App Store odrzuca nadpisania niestandardowego adresu URL usługi przekazywania iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje mechanizmem awaryjnym przeznaczonym wyłącznie do programowania w pętli zwrotnej; nie należy trwale zapisywać adresów URL usługi przekazywania HTTP w konfiguracji.

    Kompleksowy przepływ opisano w sekcji [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), a model zabezpieczeń usługi przekazywania w sekcji [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow).

  </Accordion>

  <Accordion title="Konfigurowanie Heartbeat (okresowych zgłoszeń)">
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

    - `every`: ciąg określający czas trwania (`30m`, `2h`). Aby wyłączyć, należy ustawić `0m`. Wartość domyślna: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (na przykład `discord`, `matrix`, `telegram` lub `whatsapp`)
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat typu DM
    - Pełny przewodnik zawiera sekcja [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Konfigurowanie zadań Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // wartość domyślna; wysyłanie cron + wykonanie izolowanego przebiegu agenta cron
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: usuwa zakończone sesje izolowanych przebiegów z wierszy sesji SQLite (domyślnie `24h`; aby wyłączyć, należy ustawić `false`).
    - Historia przebiegów automatycznie zachowuje najnowsze 2000 końcowych wierszy na zadanie; utracone wiersze zachowują 24-godzinne okno usuwania.
    - Omówienie funkcji i przykłady użycia CLI zawiera sekcja [Zadania Cron](/pl/automation/cron-jobs).

  </Accordion>

  <Accordion title="Konfigurowanie Webhooków (hooków)">
    Włączanie punktów końcowych HTTP Webhook na Gateway:

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
    - Całą zawartość ładunków hooków/Webhooków należy traktować jako niezaufane dane wejściowe.
    - Należy użyć dedykowanego `hooks.token`; nie należy ponownie używać aktywnych sekretów uwierzytelniających Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ani `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Uwierzytelnianie hooków odbywa się wyłącznie za pomocą nagłówka (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; ruch przychodzący Webhooków należy utrzymywać w dedykowanej podścieżce, takiej jak `/hooks`.
    - Flagi pomijania zabezpieczeń dla niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) powinny pozostać wyłączone, z wyjątkiem ściśle ograniczonego debugowania.
    - W przypadku włączenia `hooks.allowRequestSessionKey` należy także ustawić `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - W przypadku agentów uruchamianych przez hooki zaleca się zaawansowane, nowoczesne poziomy modeli i rygorystyczne zasady dotyczące narzędzi (na przykład tylko obsługa wiadomości oraz piaskownica, gdy jest to możliwe).

    Wszystkie opcje mapowania i integrację z Gmailem opisano w [pełnej dokumentacji](/pl/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Konfigurowanie routingu wielu agentów">
    Uruchamianie wielu izolowanych agentów z oddzielnymi obszarami roboczymi i sesjami:

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

    Reguły powiązań i profile dostępu poszczególnych agentów opisano w sekcjach [Wielu agentów](/pl/concepts/multi-agent) i [pełna dokumentacja](/pl/gateway/config-agents#multi-agent-routing).

  </Accordion>

  <Accordion title="Dzielenie konfiguracji na wiele plików ($include)">
    Duże konfiguracje można porządkować za pomocą `$include`:

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
    - **Tablica plików**: scalana głęboko w kolejności (późniejsze wartości mają pierwszeństwo), maksymalnie do 10 poziomów zagnieżdżenia
    - **Klucze równorzędne**: scalane po dołączeniu plików (nadpisują dołączone wartości)
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Format ścieżki**: ścieżki dołączanych plików nie mogą zawierać bajtów null i muszą mieć ściśle mniej niż 4096 znaków przed i po rozwiązaniu
    - **Zapisy wykonywane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na dołączeniu pojedynczego pliku, takim jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwane przekazywanie zapisu**: dołączenia główne, tablice dołączeń oraz dołączenia
      z równorzędnymi nadpisaniami są bezpiecznie odrzucane podczas zapisów wykonywanych przez OpenClaw zamiast
      spłaszczania konfiguracji
    - **Ograniczenie**: ścieżki `$include` muszą rozwiązywać się w katalogu zawierającym
      `openclaw.json`. Aby współdzielić drzewo między komputerami lub użytkownikami, należy ustawić
      `OPENCLAW_INCLUDE_ROOTS` na listę ścieżek (`:` w systemach POSIX, `;` w systemie Windows) do
      dodatkowych katalogów, do których mogą odwoływać się dołączenia. Dowiązania symboliczne są rozwiązywane
      i ponownie sprawdzane, dlatego ścieżka, która leksykalnie znajduje się w katalogu konfiguracji, ale której
      rzeczywisty cel wychodzi poza każdy dozwolony katalog główny, nadal jest odrzucana.
    - **Obsługa błędów**: czytelne błędy dotyczące brakujących plików, błędów analizy składni, cyklicznych dołączeń, nieprawidłowego formatu ścieżki i nadmiernej długości

  </Accordion>
</AccordionGroup>

## Przeładowywanie konfiguracji na gorąco

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — w przypadku większości ustawień ręczne ponowne uruchomienie nie jest potrzebne.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Mechanizm obserwujący czeka
na zakończenie tymczasowych zapisów i zmian nazw wykonywanych przez edytor, odczytuje ostateczny plik i odrzuca
nieprawidłowe zmiany zewnętrzne bez ponownego zapisywania `openclaw.json`. Zapisy konfiguracji wykonywane przez OpenClaw
przechodzą tę samą walidację schematu przed zapisem (reguły nadpisywania i wycofywania zmian dotyczące każdego zapisu opisano
w sekcji [Ścisła walidacja](#strict-validation)).

Jeśli pojawi się `config reload skipped (invalid config)` lub podczas uruchamiania zostanie zgłoszone `Invalid
config`, należy sprawdzić konfigurację, uruchomić `openclaw config validate`, a następnie uruchomić `openclaw
doctor --fix`, aby ją naprawić. Lista kontrolna znajduje się w sekcji [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

### Tryby przeładowywania

| Tryb                   | Zachowanie                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślny) | Natychmiast stosuje bez restartu bezpieczne zmiany. Automatycznie uruchamia ponownie w przypadku zmian krytycznych.           |
| **`hot`**              | Stosuje bez restartu tylko bezpieczne zmiany. Rejestruje ostrzeżenie, gdy wymagane jest ponowne uruchomienie — należy wykonać je ręcznie. |
| **`restart`**          | Uruchamia Gateway ponownie przy każdej zmianie konfiguracji, bez względu na to, czy jest bezpieczna.                                 |
| **`off`**              | Wyłącza monitorowanie plików. Zmiany zaczynają obowiązywać po następnym ręcznym ponownym uruchomieniu.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Które zmiany są stosowane bez restartu, a które go wymagają

Większość pól jest stosowana bez restartu i bez przestojów; niektóre sekcje stosowane bez restartu uruchamiają ponownie tylko dany
podsystem (kanał, cron, heartbeat, monitor kondycji), a nie cały Gateway. W trybie
`hybrid` zmiany wymagające ponownego uruchomienia Gateway są obsługiwane automatycznie.

| Kategoria            | Pola                                                                  | Czy wymagany jest restart Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kanały            | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane kanały i kanały pluginów       | Nie (uruchamia ponownie ten kanał)   |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                                  | Nie                           |
| Automatyzacja          | `hooks`, `cron`, `agent.heartbeat`                                      | Nie (uruchamia ponownie ten podsystem) |
| Sesje i wiadomości | `session`, `messages`                                                   | Nie                           |
| Narzędzia i multimedia       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Nie                           |
| Konfiguracja pluginów       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Nie (przeładowuje środowisko uruchomieniowe pluginu)  |
| Interfejs użytkownika i inne           | `ui`, `logging`, `identity`, `bindings`                                 | Nie                           |
| Serwer Gateway      | `gateway.*` (port, powiązanie, uwierzytelnianie, tailscale, TLS, HTTP, push)              | **Tak**                      |
| Infrastruktura      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Tak**                      |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami w ramach `gateway.*` — ich zmiana **nie** wyzwala ponownego uruchomienia. Poszczególne pluginy mogą również zastępować tę tabelę: załadowany plugin może deklarować własne prefiksy konfiguracji wyzwalające ponowne uruchomienie (na przykład dołączony plugin Canvas uruchamia Gateway ponownie dla `plugins.enabled`, `plugins.allow` i `plugins.deny`, a nie tylko dla własnego `plugins.entries.canvas`), dlatego rzeczywiste zachowanie zależy od aktywnych pluginów.
</Note>

### Planowanie przeładowania

Podczas edycji pliku źródłowego, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu zapisanego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje dotyczące przeładowania bez restartu (zastosowanie bez restartu lub ponowne uruchomienie) pozostają przewidywalne, nawet gdy
pojedyncza sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się bezpiecznym niepowodzeniem, jeśli
układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

W przypadku narzędzi zapisujących konfigurację za pośrednictwem API Gateway zalecany jest następujący przebieg:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu i podsumowania
  elementów podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę wraz z `hash`
- `config.patch` do częściowych aktualizacji (poprawka scalająca JSON: obiekty są scalane, `null`
  usuwa, a tablice są zastępowane po jawnym potwierdzeniu za pomocą `replacePaths`, jeśli
  wpisy zostałyby usunięte)
- `config.apply` tylko wtedy, gdy zamierzone jest zastąpienie całej konfiguracji
- `update.run` do jawnej samodzielnej aktualizacji i ponownego uruchomienia; należy dołączyć `continuationMessage`, jeśli sesja po ponownym uruchomieniu ma wykonać jeden dodatkowy przebieg
- `update.status`, aby sprawdzić najnowszy znacznik ponownego uruchomienia po aktualizacji i zweryfikować uruchomioną wersję po ponownym uruchomieniu

Agenty powinny w pierwszej kolejności korzystać z `config.schema.lookup`, aby uzyskać dokładną
dokumentację i ograniczenia na poziomie pól. Należy użyć [dokumentacji konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub odsyłacze do dedykowanej
dokumentacji podsystemów.

<Note>
Zapisy płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są
ograniczone do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania ponownego uruchomienia
są łączone, po czym obowiązuje 30-sekundowy okres oczekiwania między cyklami ponownego uruchomienia.
`update.status` jest tylko do odczytu, ale wymaga uprawnień administratora, ponieważ znacznik ponownego uruchomienia może
zawierać podsumowania kroków aktualizacji i końcowe fragmenty danych wyjściowych poleceń.
</Note>

Przykładowa częściowa poprawka:

```bash
openclaw gateway call config.get --params '{}'  # przechwyć payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zarówno `config.apply`, jak i `config.patch` akceptują `raw`, `baseHash`, `sessionKey`,
`note` oraz `restartDelayMs`. `baseHash` jest wymagane dla obu metod, gdy plik
konfiguracji już istnieje (pierwszy zapis bez istniejącej konfiguracji pomija tę kontrolę).

`config.patch` akceptuje również `replacePaths`, czyli tablicę ścieżek konfiguracji, dla których zastąpienie
tablicy jest zamierzone. Jeśli poprawka zastąpiłaby lub usunęła istniejącą tablicę,
pozostawiając mniej wpisów, Gateway odrzuci zapis, chyba że dokładnie ta ścieżka znajduje się
w `replacePaths`; zagnieżdżone tablice we wpisach tablic używają `[]`, na przykład
`agents.list[].skills`. Zapobiega to cichemu nadpisywaniu tablic routingu lub list dozwolonych
przez obcięte migawki `config.get`. Należy użyć `config.apply`, gdy zamierzone jest
zastąpienie całej konfiguracji.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` w bieżącym katalogu roboczym (jeśli istnieje)
- `~/.openclaw/.env` (globalna wartość rezerwowa)

Żaden z tych plików nie zastępuje istniejących zmiennych środowiskowych. Zmienne środowiskowe można również ustawić bezpośrednio w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import zmiennych środowiskowych powłoki (opcjonalny)">
  Jeśli ta funkcja jest włączona, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik w postaci zmiennej środowiskowej: `OPENCLAW_LOAD_SHELL_ENV=1`. Domyślne `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Podstawianie zmiennych środowiskowych w wartościach konfiguracji">
  Do zmiennych środowiskowych można odwoływać się w dowolnej wartości ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reguły:

- Dopasowywane są tylko nazwy zapisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące lub puste zmienne powodują błąd podczas ładowania
- Sekwencja ucieczki `$${VAR}` pozwala uzyskać dosłowny tekst wyjściowy
- Działa wewnątrz plików `$include`
- Podstawianie w tekście: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Odwołania do sekretów (środowisko, plik, wykonanie)">
  W przypadku pól obsługujących obiekty SecretRef można użyć:

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

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdują się w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki danych uwierzytelniających wymieniono w sekcji [Zakres danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Pełną kolejność pierwszeństwa i źródła opisano w sekcji [Środowisko](/pl/help/environment).

## Pełna dokumentacja

Pełną dokumentację wszystkich pól zawiera **[Dokumentacja konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Podręcznik operacyjny Gateway](/pl/gateway)
