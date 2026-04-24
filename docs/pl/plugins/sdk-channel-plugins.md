---
read_when:
    - Tworzysz nowy Plugin kanału komunikacyjnego
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu Pluginu kanału komunikacyjnego dla OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-04-24T09:23:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Ten przewodnik pokazuje krok po kroku, jak zbudować Plugin kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z bezpieczeństwem wiadomości prywatnych,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w core. Twój Plugin odpowiada za:

- **Config** — rozwiązywanie kont i kreator konfiguracji
- **Security** — politykę wiadomości prywatnych i allowlisty
- **Pairing** — przepływ zatwierdzania wiadomości prywatnych
- **Session grammar** — jak specyficzne dla dostawcy identyfikatory rozmów mapują się na czaty bazowe, identyfikatory wątków i fallbacki rodziców
- **Outbound** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Threading** — sposób wątkowania odpowiedzi
- **Heartbeat typing** — opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Core odpowiada za wspólne narzędzie message, powiązanie promptów, zewnętrzny kształt klucza sesji,
generyczne przechowywanie `:thread:` i dispatch.

Jeśli twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Pluginie kanału. Core wywołuje to ze
zmapowanym celem dostarczania heartbeat przed rozpoczęciem przebiegu modelu heartbeat i
używa współdzielonego cyklu życia keepalive/czyszczenia pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli twój kanał dodaje parametry narzędzia message przenoszące źródła multimediów, ujawnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Core używa tej jawnej listy do normalizacji ścieżek sandboxa i polityki dostępu do multimediów wychodzących, więc Pluginy nie potrzebują przypadków specjalnych w core współdzielonym dla parametrów awatarów, załączników czy obrazów okładki specyficznych dla dostawcy.
Preferuj zwracanie mapy kluczowanej akcją, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niezwiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów, które są celowo współdzielone przez każdą ujawnioną akcję.

Jeśli twoja platforma przechowuje dodatkowy zakres wewnątrz identyfikatorów rozmów, utrzymuj to parsowanie
w Pluginie przez `messaging.resolveSessionConversation(...)`. To kanoniczny Hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku, jawne `baseConversationId` oraz ewentualne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, utrzymuj ich kolejność od
najwęższego rodzica do najszerszej/bazowej rozmowy.

Dołączone Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą też udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Core używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr Pluginów czasu działania nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy fallback zgodności, gdy Plugin potrzebuje tylko fallbacków rodziców ponad
generycznym/surowym identyfikatorem. Jeśli istnieją oba Hooki, core używa
najpierw `resolveSessionConversation(...).parentConversationCandidates`, a do
`resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy kanoniczny Hook
je pominie.

## Zatwierdzenia i możliwości kanałów

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Core odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i generyczne dostarczanie fallback.
- Preferuj pojedynczy obiekt `approvalCapability` w Pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Fakty o dostarczaniu/renderowaniu/auth zatwierdzeń umieszczaj w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; core nie odczytuje już z tego obiektu Hooków auth dla zatwierdzeń.
- `approvalCapability.authorizeActorAction` oraz `approvalCapability.getActionAvailabilityState` to kanoniczna szczelina dla auth zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności auth zatwierdzeń w tym samym czacie.
- Jeśli twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej / natywnego klienta, gdy różni się od dostępności auth zatwierdzeń w tym samym czacie. Core używa tego Hooka specyficznego dla exec, aby rozróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, i uwzględnić kanał w wskazówkach fallbacku natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` albo `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń albo wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do routingu natywnych zatwierdzeń albo tłumienia fallbacku.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów zatwierdzeń należących do kanału. Utrzymuj to leniwie w gorących punktach wejścia kanału przez `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, a jednocześnie pozwala core składać cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzeń zamiast współdzielonego renderer.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki wyłączonej wyjaśniała dokładne pokrętła config potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości w stylu właściciela wiadomości prywatnych z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do core.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Używaj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Fakty specyficzne dla kanału umieszczaj za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` albo `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby core mogło złożyć handler i przejąć filtrowanie żądań, routing, deduplikację, wygaśnięcia, subskrypcję gateway i powiadomienia o dostarczeniu gdzie indziej. `nativeRuntime` jest podzielone na kilka mniejszych szczelin:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno być obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na natywne ładunki oczekujące/rozwiązane/wygasłe lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne Hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne Hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik Webhooków, rejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Generyczny rejestr runtime-context pozwala core uruchamiać handlery sterowane możliwościami na podstawie stanu startowego kanału bez dodawania glue wrapperów specyficznych dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` albo `createChannelNativeApprovalRuntime` tylko wtedy, gdy szczelina sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą kierować przez te helpery zarówno `accountId`, jak i `approvalKind`. `accountId` utrzymuje politykę zatwierdzeń wielokontowych w zakresie właściwego konta bota, a `approvalKind` utrzymuje dostępność zachowania zatwierdzeń exec vs Plugin dla kanału bez zakodowanych na sztywno gałęzi w core.
- Core odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do wiadomości prywatnych / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego ujawniaj dokładny routing pochodzenia + wiadomości prywatnych zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwól core agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia end-to-end. Natywni klienci nie powinni zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie stanu lokalnego dla kanału.
- Różne rodzaje zatwierdzeń mogą celowo ujawniać różne natywne powierzchnie.
  Obecne dołączone przykłady:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing wiadomości prywatnych/kanałowych i UX reakcji dla zatwierdzeń exec i Plugin, jednocześnie nadal pozwalając, aby auth różniło się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i ujawniać `approvalCapability` w Pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki runtime, gdy potrzebujesz tylko jednej części tej rodziny:

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

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery konfiguracji:
  bezpieczne importowo adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska szczelina adaptera świadomego env
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji plus kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli twój kanał obsługuje konfigurację lub auth sterowane env i generyczne przepływy startowe/config
mają znać te nazwy env przed załadowaniem runtime, zadeklaruj je w manifeście Pluginu przez `channelEnvVars`. Zachowaj runtime `envVars` kanału lub lokalne stałe tylko dla tekstów skierowanych do operatora.

Jeśli twój kanał może pojawiać się w `status`, `channels list`, `channels status` albo skanach SecretRef przed uruchomieniem runtime Pluginu, dodaj `openclaw.setupEntry` do `package.json`. Ten punkt wejścia powinien być bezpieczny do importu w ścieżkach poleceń tylko do odczytu i powinien zwracać metadane kanału, adapter config bezpieczny dla konfiguracji, adapter statusu oraz metadane docelowych sekretów kanału potrzebne do tych podsumowań. Nie uruchamiaj klientów, listenerów ani transportowych runtime z punktu wejścia konfiguracji.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej szczeliny `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów konfiguracji/config, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli twój kanał chce tylko ogłaszać „najpierw zainstaluj ten Plugin” w powierzchniach konfiguracji,
preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator bezpiecznie odmawia przy zapisach config i finalizacji oraz ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalize i tekstach linków do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  fallbacku domyślnego konta
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/koperty inbound i
  powiązania record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania multimediów oraz delegatów tożsamości/wysyłki outbound i planowania ładunków
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa outbound ma zachowywać jawne `replyToId`/`threadId` albo odzyskiwać bieżącą sesję `:thread:` po tym, jak bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisywać priorytet, zachowanie sufiksów i normalizację identyfikatora wątku, gdy ich platforma ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy starszy układ pól ładunku agent/media
  jest nadal wymagany
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów i stabilnego względem fallbacku kontraktu konfiguracji poleceń

Kanały tylko-auth zwykle mogą zatrzymać się na ścieżce domyślnej: core obsługuje zatwierdzenia, a Plugin tylko ujawnia możliwości outbound/auth. Kanały natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast tworzyć własny cykl życia zatwierdzeń.

## Polityka wzmianek inbound

Obsługę wzmianek inbound utrzymuj w dwóch warstwach:

- zbieranie dowodów należące do Pluginu
- współdzielona ocena polityki

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji polityki wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszej
beczki helperów inbound.

Dobre dopasowanie dla logiki lokalnej Pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa w wątku
- wykluczanie wiadomości usługowych/systemowych
- cache specyficzne dla platformy potrzebne do udowodnienia uczestnictwa bota

Dobre dopasowanie dla współdzielonego helpera:

- `requireMention`
- wynik jawnej wzmianki
- allowlista niejawnych wzmianek
- obejście poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty wzmianek.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce inbound.

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
dołączonych Pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niezwiązanych
helperów runtime inbound.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Instrukcja krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Pluginu. Pole `channel` w `package.json`
    sprawia, że jest to Plugin kanału. Pełną powierzchnię metadanych pakietu
    znajdziesz w [Konfiguracja Pluginu i Config](/pl/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Zbuduj obiekt Pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id` i `setup` — i dodawaj adaptery w miarę potrzeb.

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

      // Bezpieczeństwo wiadomości prywatnych: kto może pisać do bota
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Parowanie: przepływ zatwierdzania dla nowych kontaktów w wiadomościach prywatnych
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

    <Accordion title="Co robi za ciebie createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      deklaratywne opcje, a builder składa je razem:

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Resolver bezpieczeństwa wiadomości prywatnych ograniczony do zakresu z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania wiadomości prywatnych z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłki zwracające metadane wyników (identyfikatory wiadomości) |

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

    Umieszczaj deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mogło pokazywać je w root help bez aktywowania pełnego runtime kanału,
    podczas gdy normalne pełne ładowania nadal pobierają te same deskryptory do rzeczywistej rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy tylko w runtime.
    Jeśli `registerFull(...)` rejestruje metody gateway RPC, użyj
    prefiksu specyficznego dla Pluginu. Przestrzenie nazw administracyjnych core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji. Zobacz
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
    albo nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i Config](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały workspace, które rozdzielają eksporty bezpieczne dla konfiguracji do modułów pobocznych,
    mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują także
    jawnego settera runtime na etapie konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je dalej przez handler inbound twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth zarządzane przez Plugin (samodzielnie zweryfikuj sygnatury)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler inbound przekazuje wiadomość do OpenClaw.
          // Dokładne powiązanie zależy od SDK twojej platformy —
          // zobacz rzeczywisty przykład w pakiecie dołączonego Pluginu Microsoft Teams albo Google Chat.
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
      własny potok inbound. Sprawdź dołączone Pluginy kanałów
      (na przykład pakiet Pluginu Microsoft Teams albo Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testuj">
Pisz testy współlokowane w `src/channel.test.ts`:

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

    Współdzielone helpery testowe znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

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
├── runtime-api.ts            # Wewnętrzne eksporty runtime (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn runtime (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe reply modes, ograniczone do konta albo niestandardowe
  </Card>
  <Card title="Integracja narzędzia message" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie celów" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone szczeliny helperów nadal istnieją na potrzeby utrzymania i
zgodności dołączonych Pluginów. Nie są one zalecanym wzorcem dla nowych Pluginów kanałów;
preferuj generyczne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Pluginu](/pl/plugins/manifest) — pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Pluginy harness agenta](/pl/plugins/sdk-agent-harness)
