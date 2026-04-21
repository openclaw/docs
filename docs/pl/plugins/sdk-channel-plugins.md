---
read_when:
    - Tworzysz nowy plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia pluginu kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-04-21T19:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie pluginów kanałów

Ten przewodnik krok po kroku opisuje tworzenie pluginu kanału, który łączy OpenClaw z platformą komunikacyjną. Po jego ukończeniu będziesz mieć działający kanał z zabezpieczeniami DM, parowaniem, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie tworzono wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu. Twój plugin odpowiada za:

- **Konfigurację** — rozpoznawanie kont i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy są mapowane na bazowe czaty, identyfikatory wątków i zapasowe elementy nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, połączenia z promptami, zewnętrzny kształt klucza sesji, ogólne księgowanie `:thread:` oraz dyspozycję.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła multimediów, ujawnij te nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa tej jawnej listy do normalizacji ścieżek w piaskownicy i polityki dostępu do multimediów wychodzących, więc pluginy nie potrzebują wyjątków w współdzielonym rdzeniu dla parametrów avatarów, załączników czy obrazów okładek specyficznych dla dostawcy.
Zalecane jest zwracanie mapy indeksowanej kluczem akcji, na przykład
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie dziedziczyły argumentów multimedialnych innej akcji. Płaska tablica nadal działa w przypadku parametrów, które mają być celowo współdzielone przez każdą ujawnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, zachowaj to parsowanie w pluginie za pomocą `messaging.resolveSessionConversation(...)`. To kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku, jawny `baseConversationId` oraz ewentualne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od najbardziej zawężonego elementu nadrzędnego do najszerszej/bazowej rozmowy.

Dołączone pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów, mogą również ujawnić plik najwyższego poziomu `session-key-api.ts` z pasującym eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni tylko wtedy, gdy rejestr pluginów środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starszy zapasowy mechanizm zgodności, gdy plugin potrzebuje tylko zapasowych elementów nadrzędnych ponad ogólny/surowy identyfikator. Jeśli oba hooki istnieją, rdzeń najpierw używa `resolveSessionConversation(...).parentConversationCandidates`, a do `resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy hook kanoniczny je pomija.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie wymaga kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i ogólne dostarczanie zapasowe.
- Preferuj pojedynczy obiekt `approvalCapability` w pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieść fakty o dostarczaniu/natywności/renderowaniu/uwierzytelnianiu zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy wyłącznie do logowania/wylogowania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanoniczną powierzchnią dla uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, używaj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec do rozróżniania `enabled` i `disabled`, decydowania, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględniania kanału w wskazówkach awaryjnych dla klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to w typowym przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia dostarczania zapasowego.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów o zatwierdzeniach będących własnością kanału. Zachowaj leniwe ładowanie na gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł środowiska uruchomieniowego na żądanie, a jednocześnie pozwalać rdzeniowi składać cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje własnych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź w ścieżce wyłączonej wyjaśniała dokładne ustawienia konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki zależne od konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki zatwierdzeń specyficznej dla rdzenia.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, skoncentruj kod kanału na normalizacji celu oraz faktach o transporcie/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć obsługę i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o skierowaniu gdzie indziej. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzeń na oczekujące/rozstrzygnięte/wygasłe natywne ładunki lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów będących własnością środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu środowiska uruchomieniowego pozwala rdzeniowi uruchamiać handlery sterowane możliwościami na podstawie stanu uruchomienia kanału bez dodawania opakowującego kodu specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą przekazywać zarówno `accountId`, jak i `approvalKind` przez te pomocniki. `accountId` utrzymuje zakres polityki zatwierdzeń wielokontowych na właściwym koncie bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec vs Plugin dostępne dla kanału bez zakodowanych na sztywno rozgałęzień w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o ponownym skierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych komunikatów uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego ujawnij dokładny routing źródła + DM zatwierdzającego przez współdzielone pomocniki możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem na czacie inicjującym.
- Zachowuj typ identyfikatora dostarczonego zatwierdzenia od początku do końca. Klienci natywni nie powinni zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie stanu lokalnego kanału.
- Różne rodzaje zatwierdzeń mogą celowo ujawniać różne powierzchnie natywne.
  Obecne dołączone przykłady:
  - Slack zachowuje dostępność natywnego routingu zatwierdzeń zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń exec i Plugin, jednocześnie nadal pozwalając, by uwierzytelnianie różniło się zależnie od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodności, ale nowy kod powinien preferować konstruktor możliwości i ujawniać `approvalCapability` w pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki środowiska uruchomieniowego, gdy potrzebujesz tylko jednej części tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Podobnie preferuj `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` oraz
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni parasolowej.

Konkretnie w przypadku konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla środowiska uruchomieniowego helpery konfiguracji:
  bezpieczne importowo adaptery łatek konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  konstruktory proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma env powierzchnia adaptera
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje konstruktory konfiguracji opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane przez env i ogólne przepływy uruchamiania/konfiguracji mają znać te nazwy env przed załadowaniem środowiska uruchomieniowego, zadeklaruj je w manifeście pluginu przez `channelEnvVars`. Zachowaj środowiskouruchomieniowe `envVars` kanału lub lokalne stałe tylko dla kopii skierowanej do operatora.

Jeśli Twój kanał może pojawiać się w `status`, `channels list`, `channels status` lub skanach SecretRef przed uruchomieniem środowiska pluginu, dodaj `openclaw.setupEntry` w `package.json`. Ten punkt wejścia powinien być bezpieczny do importowania w ścieżkach poleceń tylko do odczytu i powinien zwracać metadane kanału, bezpieczny dla konfiguracji adapter konfiguracji, adapter statusu oraz metadane celu sekretów kanału potrzebne do tych podsumowań. Nie uruchamiaj klientów, listenerów ani środowisk transportowych z punktu wejścia konfiguracji.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko informować w powierzchniach konfiguracji „najpierw zainstaluj ten plugin”, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany adapter/kreator domyślnie odrzuca zapisy konfiguracji i finalizację oraz ponownie wykorzystuje ten sam komunikat o wymaganej instalacji w walidacji, finalizacji i treści linku do dokumentacji.

W przypadku innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielokontowej i
  zapasowego przełączania na konto domyślne
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` do routingu/koperty wejściowej i
  połączenia rejestrowania z dyspozycją
- `openclaw/plugin-sdk/messaging-targets` do parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` do ładowania multimediów oraz
  delegatów tożsamości/wysyłania wychodzącego i planowania ładunków
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany
  jest starszy układ pól ładunku agenta/multimediów
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji własnych komend Telegram,
  walidacji duplikatów/konfliktów oraz kontraktu konfiguracji komend
  stabilnego wobec fallbacków

Kanały wyłącznie uwierzytelniające zwykle mogą zakończyć na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a plugin jedynie ujawnia możliwości wychodzące/uwierzytelniania. Kanały natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i własne transporty czatu, powinny używać współdzielonych helperów natywnych zamiast tworzyć własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Obsługę wzmianek przychodzących zachowaj rozdzieloną na dwie warstwy:

- gromadzenie dowodów należące do pluginu
- współdzielona ocena polityki

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji dotyczących polityki wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego
barrela helperów przychodzących.

Dobrze pasuje do logiki lokalnej pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa we wątku
- wykluczanie wiadomości serwisowych/systemowych
- natywne dla platformy cache potrzebne do potwierdzenia udziału bota

Dobrze pasuje do współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych dla niejawnych wzmianek
- obejście dla komend
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce wejściowej.

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

`api.runtime.channel.mentions` ujawnia te same współdzielone helpery wzmianek dla
dołączonych pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` oraz
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niezwiązanych
helperów środowiska uruchomieniowego dla ruchu przychodzącego.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Omówienie krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channel` w `package.json`
    sprawia, że jest to plugin kanału. Pełny zakres metadanych pakietu
    znajdziesz w [Konfiguracja i ustawienia pluginu](/pl/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Zbuduj obiekt pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij
    od minimum — `id` i `setup` — i dodawaj adaptery w miarę potrzeb.

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

    <Accordion title="Co robi za Ciebie createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów,
      przekazujesz deklaratywne opcje, a konstruktor je składa:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Ograniczony zakresem resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodów |
      | `threading` | Resolver trybu reply-to (stały, zależny od konta lub własny) |
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

    Umieszczaj deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowania nadal przejmują te same deskryptory do rzeczywistej
    rejestracji komend. Zachowaj `registerFull(...)` dla pracy wykonywanej wyłącznie w środowisku uruchomieniowym.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, używaj
    prefiksu specyficznego dla pluginu. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozwiązywane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje rozdzielenie trybów rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
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
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu środowiska uruchomieniowego podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały obszaru roboczego, które dzielą eksporty bezpieczne dla konfiguracji do modułów pobocznych,
    mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują również
    jawnego settera środowiska uruchomieniowego na etapie konfiguracji.

  </Step>

  <Step title="Obsługuj wiadomości przychodzące">
    Twój plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je przez handler przychodzący Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // uwierzytelnianie zarządzane przez plugin (samodzielnie zweryfikuj sygnatury)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler ruchu przychodzącego przekazuje wiadomość do OpenClaw.
          // Dokładne połączenie zależy od SDK Twojej platformy —
          // rzeczywisty przykład znajdziesz w dołączonym pakiecie pluginu Microsoft Teams lub Google Chat.
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
      odpowiada za własny potok ruchu przychodzącego. Sprawdź dołączone pluginy kanałów
      (na przykład pakiet pluginu Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testowanie">
Napisz testy obok kodu w `src/channel.test.ts`:

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

    Współdzielone helpery testowe opisano w [Testowanie](/pl/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # manifest ze schematem konfiguracji
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # eksporty publiczne (opcjonalnie)
├── runtime-api.ts            # wewnętrzne eksporty środowiska uruchomieniowego (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # testy
    ├── client.ts             # klient API platformy
    └── runtime.ts            # magazyn środowiska uruchomieniowego (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, zależne od konta lub własne tryby odpowiedzi
  </Card>
  <Card title="Integracja z narzędziem wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania
i zgodności dołączonych pluginów. Nie są zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) — pełny schemat manifestu
