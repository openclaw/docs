---
read_when:
    - Tworzysz nową wtyczkę kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą wiadomości
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu wtyczki kanału wiadomości dla OpenClaw
title: Tworzenie wtyczek kanałów
x-i18n:
    generated_at: "2026-04-05T14:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie wtyczek kanałów

Ten przewodnik omawia tworzenie wtyczki kanału, która łączy OpenClaw z
platformą wiadomości. Po jego ukończeniu będziesz mieć działający kanał z
zabezpieczeniami DM, parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości.

<Info>
  Jeśli nie tworzono wcześniej żadnej wtyczki OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają wtyczki kanałów

Wtyczki kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw
utrzymuje jedno współdzielone narzędzie `message` w rdzeniu. Twoja wtyczka
odpowiada za:

- **Konfigurację** — rozpoznawanie konta i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych nadawców
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i alternatywne identyfikatory nadrzędne
- **Wysyłanie** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, powiązanie z promptami,
zewnętrzny kształt klucza sesji, ogólne śledzenie `:thread:` i wysyłkę.

Jeśli twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów,
utrzymuj to parsowanie we wtyczce za pomocą `messaging.resolveSessionConversation(...)`. To
kanoniczny hook mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny
identyfikator wątku, jawne `baseConversationId` oraz wszelkie
`parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od
najwęższego rodzica do najszerszej/bazowej rozmowy.

Wbudowane wtyczki, które potrzebują tego samego parsowania przed uruchomieniem
rejestru kanałów, mogą także udostępniać plik najwyższego poziomu
`session-key-api.ts` z pasującym eksportem `resolveSessionConversation(...)`. Rdzeń
używa tej bezpiecznej przy rozruchu powierzchni tylko wtedy, gdy środowiskowy
rejestr wtyczek nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy zgodnościowy mechanizm zapasowy, gdy wtyczka potrzebuje tylko
alternatywnych identyfikatorów nadrzędnych ponad ogólnym/surowym identyfikatorem. Jeśli istnieją oba hooki, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates`, a do
`resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy hook
kanoniczny ich nie zwraca.

## Zatwierdzenia i możliwości kanału

Większość wtyczek kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzania i ogólne dostarczanie zapasowe.
- Gdy kanał wymaga zachowania specyficznego dla zatwierdzeń, preferuj jeden obiekt `approvalCapability` we wtyczce kanału.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia uwierzytelniania zatwierdzeń.
- Użyj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzania lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub wyłączania mechanizmu zapasowego.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela na podstawie istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki rdzenia specyficznej dla zatwierdzeń.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu i hookach transportowych. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` i `createChannelNativeApprovalRuntime` z `openclaw/plugin-sdk/approval-runtime`, aby rdzeń odpowiadał za filtrowanie żądań, routing, deduplikację, wygaśnięcie i subskrypcję bramy.
- Kanały z natywnymi zatwierdzeniami muszą przekazywać zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń wielokontowych w odpowiednim zakresie dla właściwego konta bota, a `approvalKind` udostępnia kanałowi zachowanie zatwierdzeń exec i plugin bez zakodowanych na stałe rozgałęzień w rdzeniu.
- Zachowuj rodzaj dostarczonego identyfikatora zatwierdzenia od początku do końca. Klienci natywni nie powinni zgadywać ani przepisywać routingu zatwierdzeń exec i plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie natywne.
  Obecne przykłady wbudowane:
  - Slack zachowuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i plugin.
  - Matrix zachowuje natywny routing DM/kanału tylko dla zatwierdzeń exec i pozostawia zatwierdzenia plugin na współdzielonej ścieżce `/approve` w tym samym czacie.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako zgodnościowy wrapper, ale nowy kod powinien preferować kreator możliwości i udostępniać `approvalCapability` we wtyczce.

W gorących punktach wejścia kanału preferuj węższe ścieżki runtime, gdy
potrzebujesz tylko jednej części tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Podobnie preferuj `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` i
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej
powierzchni zbiorczej.

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne runtime helpery konfiguracji:
  bezpieczne przy imporcie adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane
  kreatory proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma środowiska
  powierzchnia adaptera dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje kreatory konfiguracji
  opcjonalnej instalacji plus kilka bezpiecznych dla konfiguracji prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
  `splitSetupEntries`
- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz również cięższych współdzielonych helperów konfiguracji i ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli twój kanał chce tylko informować w powierzchniach konfiguracji „najpierw
zainstaluj tę wtyczkę”, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie bezpiecznie blokuje zapisy konfiguracji i finalizację,
a także ponownie używa tego samego komunikatu o wymaganej instalacji w walidacji,
finalizacji i tekście z linkiem do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych
starszych powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielokontowej i
  mechanizmu zapasowego konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/obwiedni
  przychodzących wiadomości oraz powiązania record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania multimediów oraz
  delegatów tożsamości/wysyłki wychodzącej
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań
  wątków i rejestracji adaptera
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany
  jest starszy układ pól ładunku agenta/multimediów
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji
  niestandardowych poleceń Telegram, walidacji duplikatów/konfliktów oraz
  stabilnego kontraktu konfiguracji poleceń dla mechanizmu zapasowego

Kanały tylko z auth zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a wtyczka po prostu udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast tworzyć własny cykl życia zatwierdzeń.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki wtyczki. Pole `channel` w `package.json`
    sprawia, że jest to wtyczka kanału. Pełną powierzchnię metadanych pakietu
    znajdziesz w [Konfiguracja i ustawienia wtyczki](/plugins/sdk-setup#openclawchannel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Zbuduj obiekt wtyczki kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adaptera. Zacznij od minimum — `id` i `setup` — a następnie dodawaj adaptery w miarę potrzeb.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="Co zapewnia createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów,
      przekazujesz deklaratywne opcje, a kreator składa je razem:

      | Opcja | Co jest podłączane |
      | --- | --- |
      | `security.dm` | Zakresowy resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Oparty na tekście przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, zakresowy dla konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.
    </Accordion>

  </Step>

  <Step title="Podłącz punkt wejścia">
    Utwórz `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Umieść deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł je pokazywać w głównej pomocy bez aktywowania pełnego runtime kanału,
    podczas gdy normalne pełne ładowania nadal przejmują te same deskryptory do
    rzeczywistej rejestracji poleceń. Zachowaj `registerFull(...)` dla prac
    wyłącznie runtime.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, użyj
    prefiksu specyficznego dla wtyczki. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozwiązywane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji. Zobacz
    [Punkty wejścia](/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj punkt wejścia konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć dociągania ciężkiego kodu runtime
    podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twoja wtyczka musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym wzorcem jest webhook, który weryfikuje żądanie i
    wysyła je przez handler przychodzący twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każda
      wtyczka kanału odpowiada za własny potok przychodzący. Zobacz wbudowane
      wtyczki kanałów
      (na przykład pakiet wtyczek Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testowanie">
Napisz współlokowane testy w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Współdzielone helpery testowe opisano w [Testowanie](/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Stałe, zakresowe dla konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja z narzędziem message" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre wbudowane powierzchnie helperów nadal istnieją na potrzeby utrzymania
wbudowanych wtyczek i zgodności. Nie są one zalecanym wzorcem dla nowych
wtyczek kanałów; preferuj ogólne podścieżki channel/setup/reply/runtime ze
wspólnej powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę
wbudowanych wtyczek.
</Note>

## Następne kroki

- [Wtyczki dostawców](/plugins/sdk-provider-plugins) — jeśli twoja wtyczka udostępnia także modele
- [Przegląd SDK](/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest wtyczki](/plugins/manifest) — pełny schemat manifestu
