---
read_when:
    - Tworzysz nowy plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-04-22T04:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie pluginów kanałów

Ten przewodnik pokazuje krok po kroku, jak zbudować plugin kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje
jedno współdzielone narzędzie `message` w rdzeniu. Twój plugin odpowiada za:

- **Konfigurację** — rozstrzyganie kont i kreator konfiguracji
- **Bezpieczeństwo** — zasady DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory konwersacji specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i zapasowe ścieżki nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i polls na platformę
- **Wątkowanie** — sposób, w jaki wątkowane są odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, okablowanie promptów, zewnętrzny kształt klucza sesji,
ogólne zarządzanie `:thread:` i dispatch.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości przenoszące źródła multimediów, ujawnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek w sandboxie i zasad dostępu do multimediów wychodzących,
dzięki czemu pluginy nie potrzebują specjalnych przypadków we współdzielonym rdzeniu dla parametrów
awatarów, załączników czy obrazów okładki specyficznych dla dostawcy.
Preferuj zwracanie mapy kluczowanej akcją, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów,
które celowo są współdzielone przez każdą ujawnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, zachowaj to parsowanie
w pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku,
jawny `baseConversationId` i ewentualne `parentConversationCandidates`.
Jeśli zwracasz `parentConversationCandidates`, zachowaj ich kolejność od
najwęższego rodzica do najszerszej/bazowej konwersacji.

Dołączone pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą także udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym eksportem
`resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr pluginów runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starszy
zapasowy mechanizm zgodności, gdy plugin potrzebuje jedynie zapasowych ścieżek nadrzędnych ponad
ogólnym/surowym identyfikatorem. Jeśli istnieją oba hooki, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates`, a do
`resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy kanoniczny hook
je pomija.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i ogólne zapasowe dostarczanie.
- Preferuj pojedynczy obiekt `approvalCapability` w pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieszczaj informacje o dostarczaniu/renderowaniu/auth natywnych zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do login/logout; rdzeń nie odczytuje już hooków auth zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanoniczną powierzchnią dla auth zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności auth zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od auth zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec do rozróżnienia `enabled` vs `disabled`, ustalenia, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, i uwzględnienia kanału we wskazówkach zapasowych dotyczących klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń albo wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko dla natywnego routingu zatwierdzeń albo tłumienia fallbacku.
- Używaj `approvalCapability.nativeRuntime` dla natywnych informacji o zatwierdzeniach należących do kanału. Utrzymuj je leniwie na gorących entrypointach kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, a jednocześnie pozwala rdzeniowi złożyć cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał rzeczywiście potrzebuje własnych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź na ścieżce wyłączonej wyjaśniała dokładne klucze konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki w zakresie konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń w rdzeniu.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach dotyczących transportu/prezentacji. Używaj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję gateway oraz powiadomienia o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno być obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzeń na natywne ładunki oczekujące/rozwiązane/wygasłe lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczenia
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr runtime-context pozwala rdzeniowi bootstrapować handlery sterowane możliwościami ze stanu startowego kanału bez dodawania kleju opakowującego specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje zasady zatwierdzeń wielu kont w odpowiednim zakresie konta bota, a `approvalKind` zachowuje zachowanie zatwierdzeń exec vs Plugin dostępne dla kanału bez zakodowanych na sztywno gałęzi w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego ujawniaj dokładny routing źródła + DM zatwierdzających przez współdzielone helpery możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia end-to-end. Klienci natywni nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie stanu lokalnego kanału.
- Różne rodzaje zatwierdzeń mogą celowo ujawniać różne powierzchnie natywne.
  Obecne dołączone przykłady:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanał i UX reakcji dla zatwierdzeń exec
    i Plugin, jednocześnie nadal pozwalając, aby auth różniło się zależnie od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodności, ale nowy kod powinien preferować builder możliwości i ujawniać `approvalCapability` w pluginie.

Dla gorących entrypointów kanału preferuj węższe podścieżki runtime, gdy potrzebujesz tylko
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

Szczególnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery konfiguracji:
  bezpieczne importowo adaptery patch konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane
  buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska powierzchnia adaptera
  świadoma env dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji
  plus kilka bezpiecznych dla konfiguracji prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub auth sterowane env i ogólne przepływy startu/konfiguracji
powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w
manifeście pluginu przez `channelEnvVars`. Zachowaj runtime `envVars` kanału lub lokalne
stałe tylko dla kopii operatora.

Jeśli Twój kanał może pojawiać się w `status`, `channels list`, `channels status` lub skanach SecretRef
przed uruchomieniem runtime pluginu, dodaj `openclaw.setupEntry` w
`package.json`. Ten entrypoint powinien być bezpieczny do importu w ścieżkach poleceń tylko do odczytu
i powinien zwracać metadane kanału, bezpieczny dla konfiguracji adapter config, adapter statusu oraz metadane celu sekretów kanału potrzebne do tych podsumowań. Nie uruchamiaj klientów, listenerów ani runtime transportu z entry konfiguracji.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz też
  cięższych współdzielonych helperów konfiguracji/config, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce jedynie reklamować „najpierw zainstaluj ten plugin” w powierzchniach konfiguracji,
preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie odmawiają zapisów config i finalizacji, a także ponownie wykorzystują
ten sam komunikat o wymaganej instalacji w walidacji, finalize i kopii linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  zapasowego konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla okablowania trasy/koperty wejściowej oraz
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania multimediów plus delegatów
  tożsamości/wysyłki wychodzącej i planowania ładunku
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować jawne
  `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`,
  jeśli bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisywać
  priorytet, zachowanie sufiksów i normalizację identyfikatorów wątków, gdy ich platforma
  ma natywną semantykę dostarczania do wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji poleceń niestandardowych Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego fallbackowego kontraktu konfiguracji poleceń

Kanały tylko z auth zwykle mogą zakończyć na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a plugin po prostu udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast implementować własny cykl życia zatwierdzeń.

## Zasady wzmianek wejściowych

Zachowaj obsługę przychodzących wzmianek rozdzieloną na dwie warstwy:

- zbieranie danych należące do pluginu
- współdzielona ocena zasad

Używaj `openclaw/plugin-sdk/channel-mention-gating` do podejmowania decyzji o zasadach wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszej
beczki helperów wejściowych.

Dobre dopasowanie do logiki lokalnej pluginu:

- wykrywanie odpowiedzi na wiadomość bota
- wykrywanie cytatu wiadomości bota
- sprawdzanie uczestnictwa w wątku
- wykluczanie wiadomości serwisowych/systemowych
- cache specyficzne dla platformy potrzebne do potwierdzenia udziału bota

Dobre dopasowanie do współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście dla poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty o wzmiankach.
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

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek dla
dołączonych pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych
helperów runtime wejścia.

Starsze helpery `resolveMentionGating*` pozostają na
`openclaw/plugin-sdk/channel-inbound` jedynie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Instrukcja krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channel` w `package.json`
    właśnie sprawia, że jest to plugin kanału. Pełny opis powierzchni metadanych pakietu
    znajdziesz w [Konfiguracja pluginu i Config](/pl/plugins/sdk-setup#openclaw-channel):

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
          idLabel: "Nazwa użytkownika Acme Chat",
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

    <Accordion title="Co daje Ci createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      opcje deklaratywne, a builder składa je za Ciebie:

      | Opcja | Co okablowuje |
      | --- | --- |
      | `security.dm` | Zakresowy resolver bezpieczeństwa DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodów |
      | `threading` | Resolver trybu reply-to (stały, zakresowy względem konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.
    </Accordion>

  </Step>

  <Step title="Podłącz entrypoint">
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
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego runtime kanału,
    podczas gdy zwykłe pełne ładowania nadal pobiorą te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy tylko w runtime.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, używaj
    prefiksu specyficznego dla pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozstrzygane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje rozdzielenie trybów rejestracji. Zobacz
    [Entrypointy](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj entry konfiguracji">
    Utwórz `setup-entry.ts` dla lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego entry, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć dociągania ciężkiego kodu runtime podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Setup i Config](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały workspace, które rozdzielają bezpieczne dla konfiguracji eksporty do modułów pobocznych,
    mogą użyć `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują też
    jawnego settera runtime dla czasu konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to webhook, który weryfikuje żądanie i
    dispatchuje je przez handler wejściowy Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth zarządzany przez plugin (samodzielnie weryfikuj podpisy)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Twój handler wejściowy przekazuje wiadomość do OpenClaw.
          // Dokładne okablowanie zależy od SDK Twojej platformy —
          // zobacz rzeczywisty przykład w pakiecie dołączonego pluginu Microsoft Teams lub Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących zależy od kanału. Każdy plugin kanału zarządza
      własnym pipeline wejściowym. Zobacz dołączone pluginy kanałów
      (na przykład pakiet pluginu Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Napisz testy współlokowane w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("rozstrzyga konto z config", () => {
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

      it("zgłasza brak config", () => {
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
├── openclaw.plugin.json      # Manifest ze schematem config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Eksporty publiczne (opcjonalnie)
├── runtime-api.ts            # Eksporty wewnętrznego runtime (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Store runtime (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, zakresowe względem konta albo niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozstrzyganie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania dołączonych pluginów i
zgodności. Nie są one zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych pluginów.
</Note>

## Kolejne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój plugin dostarcza również modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) — pełny schemat manifestu
