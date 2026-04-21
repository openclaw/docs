---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości.
    - Chcesz połączyć OpenClaw z platformą wiadomości.
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin.
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin kanału wiadomości dla OpenClaw
title: Tworzenie Plugin kanałów wiadomości
x-i18n:
    generated_at: "2026-04-21T09:57:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie Plugin kanałów

Ten przewodnik prowadzi krok po kroku przez tworzenie Plugin kanału, który łączy OpenClaw z platformą wiadomości. Po jego ukończeniu będziesz mieć działający kanał z bezpieczeństwem DM, parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Plugin kanałów

Plugin kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core. Twój Plugin posiada:

- **Konfigurację** — rozwiązywanie kont i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i fallbacki nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, mediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Core posiada współdzielone narzędzie wiadomości, połączenie promptu, zewnętrzny kształt klucza sesji, ogólne księgowanie `:thread:` i dyspozycję.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła mediów, udostępnij te nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Core używa tej jawnej listy do normalizacji ścieżek sandbox i polityki dostępu do mediów wychodzących, więc Plugin nie potrzebują wyjątków współdzielonego core dla parametrów specyficznych dla dostawcy, takich jak awatar, załącznik lub obraz okładki.
Preferuj zwracanie mapy kluczowanej akcją, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie dziedziczyły argumentów mediów innej akcji. Płaska tablica nadal działa dla parametrów, które celowo są współdzielone przez każdą udostępnianą akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, zachowaj to parsowanie w Plugin za pomocą `messaging.resolveSessionConversation(...)`. To kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku, jawny `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od najwęższego rodzica do najszerszej/bazowej rozmowy.

Dołączone Plugin, które potrzebują tego samego parsowania, zanim uruchomi się rejestr kanałów, mogą także udostępnić plik najwyższego poziomu `session-key-api.ts` z pasującym eksportem `resolveSessionConversation(...)`. Core używa tej bezpiecznej przy bootstrap powierzchni tylko wtedy, gdy rejestr Plugin środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starszy fallback zgodności, gdy Plugin potrzebuje tylko fallbacków nadrzędnych ponad ogólny/surowy identyfikator. Jeśli istnieją oba hooki, core najpierw używa `resolveSessionConversation(...).parentConversationCandidates`, a do `resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy kanoniczny hook je pominie.

## Zatwierdzenia i możliwości kanału

Większość Plugin kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Core posiada zatwierdzenia `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i ogólne dostarczanie fallback.
- Gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń, preferuj jeden obiekt `approvalCapability` na Plugin kanału.
- `ChannelPlugin.approvals` zostało usunięte. Umieść fakty dotyczące dostarczania/natywności/renderowania/uwierzytelniania zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do login/logout; core nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Core używa tego hooka specyficznego dla exec do rozróżniania `enabled` vs `disabled`, decydowania, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, i uwzględniania kanału we wskazówkach fallback dla natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` do zachowania cyklu życia ładunku specyficznego dla kanału, takiego jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń lub wysyłanie wskaźników pisania przed dostarczeniem.
- `approvalCapability.delivery` używaj tylko do natywnego routingu zatwierdzeń lub tłumienia fallback.
- `approvalCapability.nativeRuntime` używaj dla natywnych faktów zatwierdzeń należących do kanału. Utrzymuj je leniwe na gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł środowiska uruchomieniowego na żądanie, jednocześnie pozwalając core złożyć cykl życia zatwierdzenia.
- `approvalCapability.render` używaj tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzeń zamiast współdzielonego renderer.
- Użyj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki wyłączonej wyjaśniała dokładne klucze konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do core.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby core mógł złożyć handler i posiadać filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o przekierowaniu. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno być obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe natywne ładunki lub końcowe akcje
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu środowiska uruchomieniowego pozwala core bootstrapować handlery sterowane możliwościami ze stanu startowego kanału bez dodawania otoczki specyficznej dla zatwierdzeń.
- Sięgaj po niższy poziom `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia oparta na możliwościach nie jest jeszcze wystarczająco ekspresyjna.
- Kanały z natywnymi zatwierdzeniami muszą routować zarówno `accountId`, jak i `approvalKind` przez te pomocniki. `accountId` utrzymuje zakres polityki zatwierdzeń wielu kont dla właściwego konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec vs Plugin dostępne dla kanału bez twardo zakodowanych rozgałęzień w core.
- Core posiada teraz także powiadomienia o ponownym routingu zatwierdzeń. Plugin kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępniaj dokładny routing źródła + DM zatwierdzającego przez współdzielone pomocniki możliwości zatwierdzeń i pozwól core agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj dostarczonego identyfikatora zatwierdzenia od końca do końca. Klienci natywni nie powinni zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Obecne dołączone przykłady:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanał i UX reakcji dla zatwierdzeń exec i Plugin, jednocześnie nadal pozwalając, by uwierzytelnianie różniło się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w Plugin.

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
`openclaw/plugin-sdk/reply-reference` i
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni parasolowej.

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla środowiska uruchomieniowego helpery konfiguracji:
  adaptery poprawek konfiguracji bezpieczne przy imporcie (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska powierzchnia adaptera świadoma env dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane env i ogólne przepływy startowe/konfiguracyjne powinny znać te nazwy env przed załadowaniem środowiska uruchomieniowego, zadeklaruj je w manifeście Plugin przez `channelEnvVars`. Zachowaj `envVars` środowiska uruchomieniowego kanału lub lokalne stałe tylko dla kopii skierowanej do operatora.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- sięgaj po szerszą powierzchnię `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także cięższych współdzielonych helperów konfiguracji, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten Plugin” na powierzchniach konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany adapter/kreator domyślnie odmawia zapisów konfiguracji i finalizacji oraz ponownie używa tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i treści z linkiem do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i fallback do konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/koperty ruchu przychodzącego oraz połączenia zapisu i dyspozycji
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz delegatów tożsamości/wysyłki wychodzącej i planowania ładunku
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest starszy układ pól ładunku agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram, walidacji duplikatów/konfliktów i stabilnego kontraktu konfiguracji poleceń jako fallback

Kanały tylko z uwierzytelnianiem zwykle mogą zatrzymać się na ścieżce domyślnej: core obsługuje zatwierdzenia, a Plugin jedynie udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast implementować własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Obsługę wzmianek przychodzących utrzymuj rozdzieloną na dwie warstwy:

- zbieranie danych należące do Plugin
- współdzielona ocena polityki

Do decyzji polityki wzmianek używaj `openclaw/plugin-sdk/channel-mention-gating`.
Po `openclaw/plugin-sdk/channel-inbound` sięgaj tylko wtedy, gdy potrzebujesz szerszego
barrela helperów przychodzących.

Dobrze pasuje do lokalnej logiki Plugin:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa w wątku
- wykluczanie wiadomości usługowych/systemowych
- natywne dla platformy cache potrzebne do potwierdzenia udziału bota

Dobrze pasuje do współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych ukrytych wzmianek
- obejście dla poleceń
- końcowa decyzja o pominięciu

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

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek
dla dołączonych Plugin kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania
niepowiązanych helperów środowiska uruchomieniowego ruchu przychodzącego.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Plugin. Pole `channel` w `package.json`
    sprawia, że jest to Plugin kanału. Pełną powierzchnię metadanych pakietu
    znajdziesz w [Plugin Setup and Config](/pl/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Zbuduj obiekt Plugin kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adaptera. Zacznij od
    minimum — `id` i `setup` — i dodawaj adaptery w miarę potrzeb.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // klient API Twojej platformy

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
      if (!token) throw new Error("acme-chat: wymagany jest token");
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

      // Bezpieczeństwo DM: kto może pisać do bota
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Parowanie: przepływ zatwierdzania dla nowych kontaktów DM
      pairing: {
        text: {
          idLabel: "nazwa użytkownika Acme Chat",
          message: "Wyślij ten kod, aby potwierdzić swoją tożsamość:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kod parowania: ${code}`);
          },
        },
      },

      // Wątkowanie: jak dostarczane są odpowiedzi
      threading: { topLevelReplyToMode: "reply" },

      // Ruch wychodzący: wysyłanie wiadomości na platformę
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
      przekazujesz deklaratywne opcje, a builder je składa:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Ograniczony do zakresu resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (ID wiadomości) |

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

    Umieść deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w głównej pomocy bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowania nadal pobiorą te same deskryptory do rzeczywistej rejestracji poleceń.
    `registerFull(...)` zachowaj dla pracy tylko w środowisku uruchomieniowym.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, użyj
    prefiksu specyficznego dla Plugin. Przestrzenie nazw administracyjnych core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozwiązywane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji. Zobacz
    [Entry Points](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj wpis konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas wdrażania:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu środowiska uruchomieniowego podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Setup and Config](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały workspace, które rozdzielają eksporty bezpieczne dla konfiguracji do modułów pomocniczych,
    mogą użyć `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują także
    jawnego settera środowiska uruchomieniowego na etapie konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym wzorcem jest Webhook, który weryfikuje żądanie i
    przekazuje je przez handler przychodzący Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // uwierzytelnianie zarządzane przez Plugin (podpisy weryfikujesz samodzielnie)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler przychodzący przekazuje wiadomość do OpenClaw.
          // Dokładne podłączenie zależy od SDK Twojej platformy —
          // zobacz rzeczywisty przykład w dołączonym pakiecie Plugin Microsoft Teams lub Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału posiada
      własny potok ruchu przychodzącego. Zobacz dołączone Plugin kanałów
      (na przykład pakiet Plugin Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Napisz testy współlokowane w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("rozwiązuje konto z konfiguracji", () => {
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

      it("zgłasza brakującą konfigurację", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Współdzielone helpery testowe znajdziesz w [Testing](/pl/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # Manifest ze schematem konfiguracji
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Eksporty publiczne (opcjonalnie)
├── runtime-api.ts            # Wewnętrzne eksporty środowiska uruchomieniowego (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn środowiska uruchomieniowego (w razie potrzeby)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, ograniczone do konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, podagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania
i zgodności bundled plugins. Nie są zalecanym wzorcem dla nowych Plugin kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę bundled plugins.
</Note>

## Następne kroki

- [Plugin dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [SDK Testing](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Plugin](/pl/plugins/manifest) — pełny schemat manifestu
