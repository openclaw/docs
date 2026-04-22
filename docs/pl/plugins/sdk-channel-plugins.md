---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości.
    - Chcesz połączyć OpenClaw z platformą do przesyłania wiadomości.
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin.
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin kanału wiadomości dla OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-04-22T09:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie Pluginów kanałów

Ten przewodnik prowadzi krok po kroku przez tworzenie Plugin kanału, który łączy OpenClaw z
platformą do przesyłania wiadomości. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie zbudowano jeszcze żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfigurację** — rozpoznawanie kont i kreator konfiguracji
- **Bezpieczeństwo** — zasady DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory konwersacji specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i awaryjne ścieżki nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób grupowania odpowiedzi we wątki
- **Heartbeat typing** — opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Rdzeń odpowiada za wspólne narzędzie wiadomości, połączenie promptów, zewnętrzny kształt klucza sesji,
ogólne prowadzenie ewidencji `:thread:` i dyspozycję.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Plugin kanału. Rdzeń wywołuje to z rozpoznanym celem dostarczania Heartbeat przed rozpoczęciem uruchomienia modelu Heartbeat i
używa wspólnego cyklu życia keepalive/czyszczenia wskaźnika pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła multimediów,
udostępnij te nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek sandboxa i polityki dostępu do multimediów wychodzących,
więc Pluginy nie potrzebują przypadków specjalnych we wspólnym rdzeniu dla parametrów
specyficznych dla dostawcy, takich jak avatar, załącznik czy obraz okładki.
Preferuj zwracanie mapy kluczowanej akcją, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie dziedziczyły argumentów multimedialnych innej akcji. Płaska tablica nadal działa w przypadku parametrów, które są celowo współdzielone przez każdą udostępnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, zachowaj to parsowanie
w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny
identyfikator wątku, jawny `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj kolejność od
najwęższego nadrzędnego do najszerszej/bazowej konwersacji.

Dołączone Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą również udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr Plugin środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starsza awaryjna ścieżka zgodności, gdy Plugin potrzebuje tylko nadrzędnych ścieżek awaryjnych
na bazie ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń używa
najpierw `resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy hook kanoniczny ich
nie zwraca.

## Zatwierdzenia i możliwości kanałów

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzania i ogólne dostarczanie awaryjne.
- Preferuj pojedynczy obiekt `approvalCapability` w Pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieść fakty dotyczące dostarczania/renderowania/uwierzytelniania zatwierdzeń natywnych w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia uwierzytelniania zatwierdzeń.
- Użyj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec do rozróżniania `enabled` i `disabled`, decydowania, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględniania kanału w wskazówkach dotyczących awaryjnego klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Użyj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzania lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub wyłączania ścieżki awaryjnej.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów zatwierdzeń należących do kanału. Utrzymuj je w trybie lazy na gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł środowiska uruchomieniowego na żądanie, a jednocześnie pozwala rdzeniowi złożyć cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał rzeczywiście potrzebuje własnych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Użyj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź dla ścieżki wyłączonej wyjaśniała dokładne przełączniki konfiguracyjne potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki o zakresie konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń w rdzeniu.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, skup kod kanału na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i odpowiadać za filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway i komunikaty „przekierowano gdzie indziej”. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe ładunki natywne lub końcowe akcje
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu środowiska uruchomieniowego pozwala rdzeniowi bootstrapować handlery sterowane możliwościami na podstawie stanu uruchomienia kanału bez dodawania kodu klejącego wrapperów specyficznych dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` zachowuje dostępność zachowania zatwierdzeń exec i Plugin dla kanału bez zakodowanych na stałe rozgałęzień w rdzeniu.
- Rdzeń odpowiada teraz również za komunikaty o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij poprawny routing źródła + DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek komunikatu z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia od początku do końca. Klienci natywni nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec i Plugin na podstawie stanu lokalnego kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie natywne.
  Obecne dołączone przykłady:
  - Slack zachowuje dostępność natywnego routingu zatwierdzeń zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń exec
    i Plugin, a jednocześnie nadal pozwala, aby uwierzytelnianie różniło się w zależności od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w Pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki środowiska uruchomieniowego, gdy potrzebujesz tylko
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
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni
parasolowej.

W szczególności dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje pomocniki konfiguracji bezpieczne dla środowiska uruchomieniowego:
  adaptery patch konfiguracji bezpieczne przy imporcie (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska powierzchnia adaptera uwzględniającego env
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane przez env i ogólne przepływy uruchamiania/konfiguracji
powinny znać te nazwy env przed załadowaniem środowiska uruchomieniowego, zadeklaruj je w
manifeście Plugin za pomocą `channelEnvVars`. Zachowaj runtime `envVars` kanału lub lokalne
stałe tylko do treści przeznaczonych dla operatora.

Jeśli Twój kanał może pojawiać się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed uruchomieniem runtime Plugin, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importowania w ścieżkach poleceń tylko do odczytu
i powinien zwracać metadane kanału, adapter konfiguracji bezpieczny dla setup, adapter statusu
oraz metadane celu sekretu kanału potrzebne do tych podsumowań. Nie uruchamiaj
klientów, nasłuchiwaczy ani runtime transportu z punktu wejścia setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz również
  cięższych współdzielonych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce jedynie reklamować „najpierw zainstaluj ten Plugin” na
powierzchniach konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie odrzuca zapisy konfiguracji i finalizację, a także ponownie używa
tego samego komunikatu wymagającego instalacji w walidacji, finalizacji i treści z linkiem do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielu kont oraz
  awaryjnego przełączania na konto domyślne
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` do routingu/koperty ruchu przychodzącego oraz
  połączenia zapisu i dyspozycji
- `openclaw/plugin-sdk/messaging-targets` do parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` do ładowania multimediów oraz delegatów
  tożsamości/wysyłania ruchu wychodzącego i planowania ładunku
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować jawne
  `replyToId`/`threadId` lub odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisywać
  priorytet, zachowanie sufiksów i normalizację identyfikatora wątku, gdy ich platforma
  ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agenta/multimediów
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego wobec ścieżki awaryjnej kontraktu
  konfiguracji poleceń

Kanały wyłącznie z uwierzytelnianiem zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin jedynie udostępnia możliwości ruchu wychodzącego/uwierzytelniania. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast tworzyć własny cykl życia zatwierdzeń.

## Zasady wzmianek przychodzących

Obsługę wzmianek przychodzących zachowaj rozdzieloną na dwie warstwy:

- gromadzenie danych należące do Plugin
- współdzielona ocena zasad

Do decyzji dotyczących zasad wzmianek używaj `openclaw/plugin-sdk/channel-mention-gating`.
Po `openclaw/plugin-sdk/channel-inbound` sięgaj tylko wtedy, gdy potrzebujesz szerszego
bara pomocników ruchu przychodzącego.

Dobre zastosowania logiki lokalnej dla Plugin:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowania bota
- sprawdzanie uczestnictwa w wątku
- wykluczanie wiadomości usługowych/systemowych
- natywne cache platformy potrzebne do potwierdzenia udziału bota

Dobre zastosowania współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście dla poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w bramce ruchu przychodzącego.

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
dołączonych Pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych
helperów runtime ruchu przychodzącego.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Plugin. Pole `channel` w `package.json` określa,
    że jest to Plugin kanału. Pełny zakres metadanych pakietu znajdziesz w
    [Konfiguracja Plugin i Config](/pl/plugins/sdk-setup#openclaw-channel):

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
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      opcje deklaratywne, a builder składa je razem:

      | Option | Co podłącza |
      | --- | --- |
      | `security.dm` | Ograniczony zakresem resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodów |
      | `threading` | Resolver trybu odpowiedzi (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania, które zwracają metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazywać surowe obiekty adapterów zamiast opcji deklaratywnych,
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
    mógł pokazywać je w głównej pomocy bez aktywowania pełnego runtime kanału,
    podczas gdy normalne pełne ładowania nadal pobierają te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy wyłącznie w runtime.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, używaj
    prefiksu specyficznego dla Plugin. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje rozdzielenie trybów rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
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
    lub nieskonfigurowany. Pozwala to uniknąć pobierania ciężkiego kodu runtime podczas przepływów setup.
    Szczegóły znajdziesz w [Setup i Config](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały przestrzeni roboczej, które rozdzielają eksporty bezpieczne dla setup do modułów
    pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują również
    jawnego settera runtime na czas setup.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym wzorcem jest Webhook, który weryfikuje żądanie i
    przekazuje je przez handler ruchu przychodzącego Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // uwierzytelnianie zarządzane przez Plugin (samodzielnie weryfikuj sygnatury)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler ruchu przychodzącego przekazuje wiadomość do OpenClaw.
          // Dokładne połączenie zależy od SDK Twojej platformy —
          // zobacz rzeczywisty przykład w pakiecie dołączonego Plugin Microsoft Teams lub Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału odpowiada
      za własny pipeline ruchu przychodzącego. Zobacz dołączone Pluginy kanałów
      (na przykład pakiet Plugin Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testowanie">
Pisz testy współumieszczone w `src/channel.test.ts`:

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

    Informacje o współdzielonych helperach testowych znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

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
    └── runtime.ts            # Magazyn runtime (w razie potrzeby)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, ograniczone do konta lub niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania
i zgodności dołączonych Pluginów. Nie są one zalecanym wzorcem dla nowych Pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Plugin](/pl/plugins/manifest) — pełny schemat manifestu
