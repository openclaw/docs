---
read_when:
    - Budujesz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą wiadomości
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po budowaniu Plugin kanału wiadomości dla OpenClaw
title: Budowanie Plugin kanałowych
x-i18n:
    generated_at: "2026-04-25T13:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Ten przewodnik przeprowadza przez budowę Plugin kanału, który łączy OpenClaw z
platformą wiadomości. Na końcu będziesz mieć działający kanał z zabezpieczeniami wiadomości prywatnych,
pairing, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie budowałeś wcześniej żadnego Plugin OpenClaw, najpierw przeczytaj
  [Getting Started](/pl/plugins/building-plugins), aby poznać podstawową strukturę pakietu
  i konfigurację manifestu.
</Info>

## Jak działają Plugin kanałowe

Plugin kanałowe nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje jedno
współdzielone narzędzie `message` w rdzeniu. Twój Plugin posiada:

- **Config** — rozwiązywanie kont i kreator konfiguracji
- **Security** — politykę wiadomości prywatnych i listy dozwolonych
- **Pairing** — przepływ zatwierdzania wiadomości prywatnych
- **Session grammar** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i fallbacki rodziców
- **Outbound** — wysyłanie tekstu, mediów i ankiet na platformę
- **Threading** — sposób wątkowania odpowiedzi
- **Heartbeat typing** — opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Rdzeń posiada współdzielone narzędzie wiadomości, okablowanie promptu, zewnętrzny kształt klucza sesji,
ogólne księgowanie `:thread:` i dispatch.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Plugin kanałowym. Rdzeń wywołuje to z
rozpoznanym celem dostarczania Heartbeat przed rozpoczęciem uruchomienia modelu Heartbeat i
używa współdzielonego cyklu życia keepalive/cleanup dla pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma potrzebuje jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości przenoszące źródła mediów, ujawnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek sandbox i polityki dostępu do mediów wychodzących,
więc Plugin nie potrzebują szczególnych przypadków we współdzielonym rdzeniu dla parametrów
awatarów, załączników albo obrazów okładek specyficznych dla dostawcy.
Preferuj zwracanie mapy kluczowanej akcją, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niezwiązane akcje nie
dziedziczyły argumentów mediów innej akcji. Płaska tablica nadal działa dla parametrów,
które są celowo współdzielone przez wszystkie ujawnione akcje.

Jeśli Twoja platforma przechowuje dodatkowy zakres wewnątrz identyfikatorów rozmów, utrzymuj to parsowanie
w Plugin za pomocą `messaging.resolveSessionConversation(...)`. To kanoniczny hook
do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku,
jawne `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, utrzymuj ich kolejność od
najwęższego rodzica do najszerszej/bazowej rozmowy.

Dołączone Plugin, które potrzebują tego samego parsowania, zanim uruchomi się rejestr kanałów,
mogą również ujawniać plik najwyższego poziomu `session-key-api.ts` z odpowiadającym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrap powierzchni
tylko wtedy, gdy rejestr Plugin runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starszy fallback zgodności, gdy Plugin potrzebuje tylko fallbacków rodzica ponad
ogólnym/surowym identyfikatorem. Jeśli oba hooki istnieją, rdzeń używa najpierw
`resolveSessionConversation(...).parentConversationCandidates`, a do `resolveParentConversationCandidates(...)` wraca dopiero wtedy, gdy kanoniczny hook
je pominie.

## Zatwierdzenia i możliwości kanału

Większość Plugin kanałowych nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń posiada `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i ogólne fallback delivery.
- Preferuj jeden obiekt `approvalCapability` w Plugin kanałowym, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieszczaj fakty dotyczące dostarczania/renderowania/auth natywnych zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do login/logout; rdzeń nie odczytuje już hooków auth zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia auth zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności auth zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał ujawnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się od auth zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec do rozróżniania `enabled` i `disabled`, decydowania, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz dołączania kanału do wskazówek fallback natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` albo `outbound.beforeDeliverPayload` dla zachowania cyklu życia ładunku specyficznego dla kanału, takiego jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń albo wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko dla natywnego routingu zatwierdzeń albo tłumienia fallback.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów zatwierdzeń należących do kanału. Utrzymuj to leniwe na gorących punktach wejścia kanału dzięki `createLazyChannelApprovalNativeRuntimeAdapter(...)`, które może importować moduł runtime na żądanie, a jednocześnie pozwala rdzeniowi składać cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje własnych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki disabled wyjaśniała dokładne pokrętła konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych wartości najwyższego poziomu.
- Jeśli kanał potrafi wnioskować stabilne tożsamości podobne do właściciela wiadomości prywatnych z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki rdzenia specyficznej dla zatwierdzeń.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` albo `createLazyChannelApprovalNativeRuntimeAdapter(...)`, tak aby rdzeń mógł złożyć handler i posiadać filtrowanie żądań, routing, dedupe, expiry, subskrypcję gateway i powiadomienia routed-elsewhere. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno być obsługiwane
- `presentation` — mapowanie współdzielonego view model zatwierdzeń na oczekujące/rozwiązane/wygasłe ładunki natywne albo końcowe akcje
- `transport` — przygotowanie celów plus wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków albo reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt albo odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr runtime-context pozwala rdzeniowi bootstrapować handlery sterowane możliwościami ze stanu startowego kanału bez dodawania glue wrapperów specyficznych dla zatwierdzeń.
- Sięgaj po niższy poziom `createChannelApprovalHandler` albo `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą kierować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń wielokontowych w zakresie właściwego konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec vs Plugin dostępne dla kanału bez hardkodowanych gałęzi w rdzeniu.
- Rdzeń posiada teraz także powiadomienia o przekierowaniu zatwierdzeń. Plugin kanałowe nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego ujawniaj dokładny routing do źródła + DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia end-to-end. Natywni klienci nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo ujawniać różne powierzchnie natywne.
  Obecne dołączone przykłady:
  - Slack utrzymuje dostępny natywny routing zatwierdzeń zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanał i UX reakcji dla zatwierdzeń exec
    i Plugin, nadal pozwalając auth różnić się zależnie od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i ujawniać `approvalCapability` w Plugin.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki runtime, gdy potrzebujesz tylko
jednej części tej rodziny:

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
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej
powierzchni parasolowej.

Konkretnie dla setup:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery setup:
  bezpieczne importowo adaptery poprawek setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane
  buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska powierzchnia adaptera świadomego env
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery setup z opcjonalną instalacją
  plus kilka bezpiecznych dla setup prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje setup lub auth sterowane env i ogólne przepływy startup/config
powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w manifeście Plugin przez `channelEnvVars`. Utrzymuj kanałowe `envVars` runtime albo lokalne
stałe tylko dla kopii skierowanej do operatora.

Jeśli Twój kanał może pojawić się w `status`, `channels list`, `channels status` albo skanach SecretRef przed uruchomieniem runtime Plugin, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importu w ścieżkach poleceń tylko-do-odczytu i powinien zwracać metadane kanału, bezpieczny dla setup adapter konfiguracji, adapter statusu i metadane celu sekretów kanału potrzebne do tych podsumowań. Nie uruchamiaj klientów, listenerów ani runtime transportu z punktu wejścia setup.

Utrzymuj także wąską ścieżkę importu głównego punktu wejścia kanału. Discovery może oceniać
punkt wejścia i moduł Plugin kanału, aby rejestrować możliwości bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt Plugin kanału bez importowania kreatorów setup, klientów transportu, listenerów socketów, uruchamiania podprocesów ani modułów uruchamiania usług. Umieszczaj te elementy runtime w modułach ładowanych z `registerFull(...)`, setterów runtime albo leniwych adapterów możliwości.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów setup/config, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten Plugin” na
powierzchniach setup, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator zamyka się fail-closed przy zapisach konfiguracji i finalizacji oraz ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i treści
z linkiem do dokumentacji.

Dla innych gorących ścieżek kanału preferuj węższe helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielokontowej i
  fallback domyślnego konta
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/envelope wejściowego oraz
  okablowania record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz delegatów
  tożsamości/wysyłki wychodzącej i planowania ładunków
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować jawne
  `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal pasuje. Plugin dostawców mogą nadpisywać
  pierwszeństwo, zachowanie sufiksów i normalizację identyfikatorów wątków, gdy ich platforma
  ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia thread-binding
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego względem fallback kontraktu
  konfiguracji poleceń

Kanały tylko z auth zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin tylko ujawnia możliwości outbound/auth. Kanały natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast budować własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Utrzymuj obsługę przychodzących wzmianek rozdzieloną na dwie warstwy:

- zbieranie dowodów należące do Plugin
- współdzielona ewaluacja polityki

Użyj `openclaw/plugin-sdk/channel-mention-gating` do decyzji polityki wzmianek.
Użyj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego
barrel helperów wejściowych.

Dobre dopasowanie dla lokalnej logiki Plugin:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa wątku
- wykluczenia wiadomości usługowych/systemowych
- cache natywne dla platformy potrzebne do udowodnienia uczestnictwa bota

Dobre dopasowanie dla współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście poleceń
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianek.
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
dołączonych Plugin kanałowych, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych
helperów runtime wejściowych.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` tylko jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Plugin. Pole `channel` w `package.json` sprawia,
    że jest to Plugin kanałowy. Pełną powierzchnię metadanych pakietu znajdziesz w
    [Plugin Setup and Config](/pl/plugins/sdk-setup#openclaw-channel):

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
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` waliduje `plugins.entries.acme-chat.config`. Używaj go dla
    ustawień należących do Plugin, które nie są konfiguracją konta kanału. `channelConfigs`
    waliduje `channels.acme-chat` i jest źródłem zimnej ścieżki używanym przez
    schemat konfiguracji, setup i powierzchnie UI, zanim załaduje się runtime Plugin.

  </Step>

  <Step title="Zbuduj obiekt Plugin kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
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

      // Bezpieczeństwo DM: kto może wysyłać wiadomości do bota
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
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
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

    <Accordion title="Co robi za Ciebie createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      deklaratywne opcje, a builder je składa:

      | Option | Co podłącza |
      | --- | --- |
      | `security.dm` | Scoped resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ Pairing DM z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, ograniczony do konta albo niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłki zwracające metadane wyników (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery outbound mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania w czasie dostarczania,
      takie jak `maxLinesPerMessage`; stosuj je przed wysłaniem, tak aby wątkowanie odpowiedzi
      i granice chunków były rozwiązywane raz przez współdzielone dostarczanie outbound.
      Konteksty wysyłki zawierają też `replyToIdSource` (`implicit` albo `explicit`)
      wtedy, gdy rozwiązano natywny cel odpowiedzi, tak aby helpery ładunków mogły zachować
      jawne tagi odpowiedzi bez zużywania niejawnego jednorazowego slotu odpowiedzi.
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
    mógł pokazywać je w pomocy root bez aktywowania pełnego runtime kanału,
    podczas gdy zwykłe pełne ładowania nadal pobiorą te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy tylko runtime.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, użyj
    prefiksu specyficznego dla Plugin. Przestrzenie nazw admin rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Entry Points](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj punkt wejścia setup">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony
    albo nieskonfigurowany. Pozwala to uniknąć ładowania ciężkiego kodu runtime podczas przepływów setup.
    Szczegóły znajdziesz w [Setup and Config](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały workspace, które rozdzielają bezpieczne dla setup eksporty do modułów sidecar,
    mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują także
    jawnego settera runtime na czas setup.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym wzorcem jest Webhook, który weryfikuje żądanie i
    przekazuje je przez inbound handler Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth zarządzane przez Plugin (samodzielnie weryfikuj sygnatury)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój inbound handler przekazuje wiadomość do OpenClaw.
          // Dokładne okablowanie zależy od SDK Twojej platformy —
          // zobacz rzeczywisty przykład w dołączonym pakiecie Plugin Microsoft Teams albo Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanałowy posiada
      własny potok inbound. Spójrz na dołączone Plugin kanałowe
      (na przykład pakiet Plugin Microsoft Teams albo Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testowanie">
Zapisz testy colocated w `src/channel.test.ts`:

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
├── api.ts                    # Eksporty publiczne (opcjonalne)
├── runtime-api.ts            # Eksporty runtime wewnętrzne (opcjonalne)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn runtime (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, ograniczone do konta albo niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i discovery akcji
  </Card>
  <Card title="Rozwiązywanie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania dołączonych Plugin i
zgodności. Nie są zalecanym wzorcem dla nowych Plugin kanałowych;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Plugin.
</Note>

## Kolejne kroki

- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin dostarcza także modele
- [SDK Overview](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [SDK Testing](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Plugin Manifest](/pl/plugins/manifest) — pełny schemat manifestu

## Powiązane

- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Budowanie Plugin](/pl/plugins/building-plugins)
- [Plugin harness agenta](/pl/plugins/sdk-agent-harness)
