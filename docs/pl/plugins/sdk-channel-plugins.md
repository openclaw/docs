---
read_when:
    - Tworzysz nowy plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-04-07T09:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aab6cc835b292c62e33c52ad0c35f989fb1a5b225511e8bdc2972feb3c64f09
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie pluginów kanałów

Ten przewodnik prowadzi krok po kroku przez tworzenie pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie tworzono wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Getting Started](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w core. Plugin zarządza:

- **Config** — rozwiązywaniem kont i kreatorem konfiguracji
- **Security** — polityką DM i allowlistami
- **Pairing** — przepływem zatwierdzania DM
- **Session grammar** — tym, jak identyfikatory rozmów specyficzne dla providera mapują się na czaty bazowe, identyfikatory wątków i fallbacki do elementów nadrzędnych
- **Outbound** — wysyłaniem tekstu, mediów i ankiet na platformę
- **Threading** — sposobem wątkowania odpowiedzi

Core zarządza wspólnym narzędziem wiadomości, okablowaniem promptów, zewnętrznym kształtem klucza sesji,
ogólnym bookkeepingiem `:thread:` i dispatch.

Jeśli platforma przechowuje dodatkowy zakres wewnątrz identyfikatorów rozmów, utrzymuj to parsowanie
w pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku,
jawny `baseConversationId` oraz wszelkie `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowuj kolejność od
najwęższego elementu nadrzędnego do najszerszej/bazowej rozmowy.

Dołączone pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą też udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Core używa tej bezpiecznej przy bootstrapie powierzchni
tylko wtedy, gdy rejestr pluginów runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy fallback zgodności, gdy plugin potrzebuje tylko fallbacków elementów nadrzędnych
ponad ogólnym/surowym identyfikatorem. Jeśli istnieją oba hooki, core używa najpierw
`resolveSessionConversation(...).parentConversationCandidates` i wraca do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hook
ich nie poda.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Core zarządza `/approve` w tym samym czacie, współdzielonymi payloadami przycisków zatwierdzania oraz ogólnym dostarczaniem fallback.
- Preferuj jeden obiekt `approvalCapability` na pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna szczelina autoryzacji zatwierdzeń.
- Jeśli kanał udostępnia natywne zatwierdzenia exec, zaimplementuj `approvalCapability.getActionAvailabilityState` nawet wtedy, gdy natywny transport znajduje się całkowicie pod `approvalCapability.native`. Core używa tego hooka dostępności, aby odróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia, oraz uwzględnić kanał w wskazówkach fallback dla klientów natywnych.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia payloadu specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzania lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routowania zatwierdzeń lub wyciszania fallbacku.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych payloadów zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź na ścieżce wyłączonej wyjaśniała dokładne klucze configu potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki z zakresem konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela na podstawie istniejącego configu, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń w core.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skoncentrowany na normalizacji targetu i hookach transportowych. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` oraz `createChannelNativeApprovalRuntime` z `openclaw/plugin-sdk/approval-runtime`, aby core zarządzał filtrowaniem żądań, routowaniem, deduplikacją, wygasaniem i subskrypcją gateway.
- Natywne kanały zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje zakres polityki zatwierdzeń dla wielu kont powiązany z właściwym kontem bota, a `approvalKind` utrzymuje zachowanie exec vs plugin dostępne dla kanału bez hardcoded branchy w core.
- Zachowuj dostarczony rodzaj identyfikatora zatwierdzenia end-to-end. Klienci natywni nie powinni
  zgadywać ani przepisywać routowania zatwierdzeń exec vs plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Bieżące dołączone przykłady:
  - Slack zachowuje natywne routowanie zatwierdzeń dostępne zarówno dla identyfikatorów exec, jak i plugin.
  - Matrix zachowuje natywne routowanie DM/kanału tylko dla zatwierdzeń exec i pozostawia
    zatwierdzenia pluginów na współdzielonej ścieżce `/approve` w tym samym czacie.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w pluginie.

Dla gorących entrypointów kanału preferuj węższe subścieżki runtime, gdy potrzebna
jest tylko jedna część tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Podobnie preferuj `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` oraz
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej
powierzchni parasolowej.

Konkretnie dla setupu:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery setupu:
  bezpieczne importowo adaptery patchowania setupu (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma env
  szczelina adaptera dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery setupu dla opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla setupu:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli kanał obsługuje setup lub auth sterowane env i ogólne przepływy startup/config
mają znać te nazwy env przed załadowaniem runtime, zadeklaruj je w
manifeście pluginu za pomocą `channelEnvVars`. Zachowaj runtime `envVars` kanału
lub lokalne stałe tylko do kopii operator-facing.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej szczeliny `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz też
  cięższych współdzielonych helperów setup/config, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli kanał chce tylko informować w powierzchniach setupu „najpierw zainstaluj ten plugin”, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie blokuje zapisy do configu i finalizację oraz ponownie używa
tego samego komunikatu „wymagana instalacja” w walidacji, finalizacji i tekście
odnośników do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla configu wielu kont i
  fallbacku konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla okablowania trasy/koperty przychodzącej i
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania targetów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz delegatów tożsamości/wysyłania
  wychodzącego
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia
  powiązań wątków i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany
  jest starszy układ pól payloadu agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz kontraktu configu poleceń
  stabilnego względem fallbacku

Kanały tylko-auth zwykle mogą zatrzymać się na ścieżce domyślnej: core obsługuje zatwierdzenia, a plugin jedynie udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast pisać własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Obsługę przychodzących wzmianek utrzymuj rozdzieloną na dwie warstwy:

- gromadzenie dowodów po stronie pluginu
- współdzieloną ocenę polityki

Do warstwy współdzielonej używaj `openclaw/plugin-sdk/channel-inbound`.

Dobre zastosowania logiki lokalnej dla pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie udziału w wątku
- wykluczanie komunikatów usługowych/systemowych
- cache specyficzne dla platformy potrzebne do wykazania udziału bota

Dobre zastosowania helpera współdzielonego:

- `requireMention`
- wynik jawnej wzmianki
- allowlista niejawnych wzmianek
- obejście poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianek.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` oraz `decision.shouldSkip` w bramce przychodzącej.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek dla
dołączonych pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` tylko jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Instrukcja krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channel` w `package.json`
    sprawia, że jest to plugin kanału. Pełny zakres metadanych pakietu
    znajdziesz w [Plugin Setup and Config](/pl/plugins/sdk-setup#openclawchannel):

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
          "blurb": "Połącz OpenClaw z Acme Chat."
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
      "description": "Plugin kanału Acme Chat",
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

  <Step title="Zbuduj obiekt pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id` i `setup` — a następnie dodawaj adaptery w miarę potrzeb.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // klient API twojej platformy

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

      // Zabezpieczenia DM: kto może pisać do bota
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: przepływ zatwierdzania dla nowych kontaktów DM
      pairing: {
        text: {
          idLabel: "Nazwa użytkownika Acme Chat",
          message: "Wyślij ten kod, aby zweryfikować swoją tożsamość:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Wątkowanie: jak dostarczane są odpowiedzi
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: wysyłanie wiadomości na platformę
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

    <Accordion title="Co daje createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów,
      przekazujesz deklaratywne opcje, a builder składa je razem:

      | Option | Co jest podłączane |
      | --- | --- |
      | `security.dm` | Resolver zabezpieczeń DM z zakresem opartym na polach configu |
      | `pairing.text` | Tekstowy przepływ pairing DM z wymianą kodów |
      | `threading` | Resolver trybu reply-to (stały, z zakresem konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (ID wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.
    </Accordion>

  </Step>

  <Step title="Podłącz entry point">
    Utwórz `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin kanału Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Zarządzanie Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Zarządzanie Acme Chat",
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

    Umieszczaj deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł je pokazać w głównej pomocy bez aktywowania pełnego runtime kanału,
    a zwykłe pełne ładowanie nadal pobierało te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy tylko runtime.
    Jeśli `registerFull(...)` rejestruje metody gateway RPC, użyj
    prefiksu specyficznego dla pluginu. Przestrzenie nazw administratora core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje ten podział trybów rejestracji. Zobacz
    [Entry Points](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj setup entry">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje ten plik zamiast pełnego entry, gdy kanał jest wyłączony
    albo nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów setupu.
    Szczegóły znajdziesz w [Setup and Config](/pl/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to webhook, który weryfikuje żądanie i
    dispatchuje je przez przychodzący handler kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // uwierzytelnianie zarządzane przez plugin (zweryfikuj podpisy samodzielnie)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler przychodzący dispatchuje wiadomość do OpenClaw.
          // Dokładne okablowanie zależy od SDK twojej platformy —
          // zobacz rzeczywisty przykład w dołączonym pakiecie pluginu Microsoft Teams lub Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy plugin kanału
      zarządza własnym pipeline przychodzącym. Zajrzyj do dołączonych pluginów kanałów
      (na przykład do pakietu pluginu Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testuj">
Pisz testy współlokowane w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("rozwiązuje konto z configu", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("sprawdza konto bez materializowania sekretów", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("zgłasza brakujący config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Współdzielone helpery testowe opisano w [Testing](/pl/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # Manifest ze schematem configu
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Eksporty publiczne (opcjonalnie)
├── runtime-api.ts            # Wewnętrzne eksporty runtime (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Store runtime (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, tryby z zakresem konta lub niestandardowe
  </Card>
  <Card title="Integracja z narzędziem wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie targetów" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone szczeliny helperów nadal istnieją na potrzeby utrzymania dołączonych pluginów i
zgodności. Nie są one zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne subścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych pluginów.
</Note>

## Kolejne kroki

- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — jeśli plugin udostępnia również modele
- [SDK Overview](/pl/plugins/sdk-overview) — pełne odniesienie do importów subścieżek
- [SDK Testing](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Plugin Manifest](/pl/plugins/manifest) — pełny schemat manifestu
