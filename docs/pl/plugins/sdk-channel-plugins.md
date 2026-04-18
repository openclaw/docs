---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości.
    - Chcesz połączyć OpenClaw z platformą komunikacyjną.
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin.
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu Pluginu kanału wiadomości dla OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-04-18T09:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie Pluginów kanałów

Ten przewodnik przeprowadzi Cię przez tworzenie Pluginu kanału, który łączy OpenClaw z platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM, parowaniem, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie tworzyłeś jeszcze żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfigurację** — rozpoznawanie konta i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki specyficzne dla dostawcy identyfikatory konwersacji mapują się na czaty bazowe, identyfikatory wątków i rezerwowe elementy nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, podłączenie promptów, zewnętrzny kształt klucza sesji, ogólne śledzenie `:thread:` oraz dyspozycję.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła multimediów, udostępnij te nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa tej jawnej listy do normalizacji ścieżek sandboxa i polityki dostępu do multimediów wychodzących, więc Pluginy nie potrzebują wyjątków we współdzielonym rdzeniu dla specyficznych dla dostawcy parametrów avatarów, załączników czy obrazów okładki.
Preferuj zwracanie mapy z kluczami akcji, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie dziedziczyły argumentów multimedialnych innej akcji. Płaska tablica nadal działa dla parametrów, które są celowo współdzielone przez każdą udostępnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, zachowaj to parsowanie w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To kanoniczny hook do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku, jawny `baseConversationId` oraz dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od najwęższego elementu nadrzędnego do najszerszej/bazowej konwersacji.

Bundlowane Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów, mogą też udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni tylko wtedy, gdy rejestr Pluginów środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starszy, zgodnościowy mechanizm rezerwowy, gdy Plugin potrzebuje jedynie rezerwowych elementów nadrzędnych ponad ogólnym/surowym identyfikatorem. Jeśli istnieją oba hooki, rdzeń najpierw używa `resolveSessionConversation(...).parentConversationCandidates`, a do `resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy kanoniczny hook ich nie zwraca.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzania i ogólne dostarczanie rezerwowe.
- Preferuj pojedynczy obiekt `approvalCapability` w Pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieść informacje o dostarczaniu/renderowaniu/uwierzytelnianiu natywnych zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowywania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` do dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia wykonania, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla wykonania, aby odróżniać `enabled` od `disabled`, decydować, czy kanał inicjujący obsługuje natywne zatwierdzenia wykonania, oraz uwzględniać kanał w wskazówkach dotyczących natywnego klienta jako rozwiązania rezerwowego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzenia lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do routingu natywnych zatwierdzeń lub wyłączania dostarczania rezerwowego.
- Używaj `approvalCapability.nativeRuntime` dla faktów dotyczących natywnych zatwierdzeń należących do kanału. Zachowaj leniwe ładowanie na gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować Twój moduł środowiska uruchomieniowego na żądanie, a jednocześnie pozwalać rdzeniowi składać cykl życia zatwierdzenia.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź na ścieżce wyłączonej wyjaśniała dokładne pokrętła konfiguracyjne potrzebne do włączenia natywnych zatwierdzeń wykonania. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki o zakresie konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania do rdzenia logiki specyficznej dla zatwierdzeń.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach dotyczących transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o przekierowaniu. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno być obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzeń na oczekujące/rozwiązane/wygasłe natywne ładunki lub końcowe akcje
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt lub odbiornik Webhooków, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu środowiska uruchomieniowego pozwala rdzeniowi uruchamiać handlery sterowane możliwościami na podstawie stanu startowego kanału bez dodawania kleju opakowującego specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą kierować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` utrzymuje dostępność zachowania zatwierdzeń wykonania vs zatwierdzeń Pluginu dla kanału bez zakodowanych na stałe gałęzi w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij dokładny routing pochodzenia + DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowuj typ dostarczonego identyfikatora zatwierdzenia end-to-end. Natywni klienci nie powinni zgadywać ani przepisywać routingu zatwierdzeń wykonania vs zatwierdzeń Pluginu na podstawie stanu lokalnego kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Obecne przykłady bundlowane:
  - Slack zachowuje dostępność natywnego routingu zatwierdzeń zarówno dla identyfikatorów wykonania, jak i Pluginu.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń wykonania i Pluginu, jednocześnie nadal pozwalając, aby uwierzytelnianie różniło się w zależności od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodnościowe, ale nowy kod powinien preferować kreator możliwości i udostępniać `approvalCapability` w Pluginie.

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
  bezpieczne importowo adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  kreatory proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska powierzchnia adaptera
  świadoma środowiska dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje kreatory konfiguracji
  opcjonalnej instalacji oraz kilka bezpiecznych dla konfiguracji prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane zmiennymi środowiskowymi i ogólne przepływy uruchamiania/konfiguracji powinny znać te nazwy zmiennych środowiskowych przed załadowaniem środowiska uruchomieniowego, zadeklaruj je w manifeście Pluginu za pomocą `channelEnvVars`. Zachowaj środowiskouruchomieniowe `envVars` kanału lub lokalne stałe tylko dla kopii przeznaczonej dla operatora.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów konfiguracji, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce jedynie reklamować „najpierw zainstaluj ten Plugin” na powierzchniach konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany adapter/kreator domyślnie blokuje zapisy konfiguracji i finalizację, a także ponownie wykorzystuje ten sam komunikat o wymaganej instalacji w walidacji, finalizacji i kopii linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielu kont i
  rezerwowego konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` do routingu/koperty wejściowej oraz
  okablowania rejestracji i dyspozycji
- `openclaw/plugin-sdk/messaging-targets` do parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` do ładowania multimediów oraz delegatów
  tożsamości/wysyłania ruchu wychodzącego
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany
  jest starszy układ pól ładunku agenta/multimediów
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji niestandardowych poleceń Telegram, walidacji duplikatów/konfliktów i umowy konfiguracji poleceń stabilnej wobec mechanizmu rezerwowego

Kanały tylko z uwierzytelnianiem zwykle mogą zakończyć na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin jedynie udostępnia możliwości outbound/auth. Kanały natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast implementować własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Obsługę przychodzących wzmianek utrzymuj rozdzieloną na dwie warstwy:

- gromadzenie danych należące do Pluginu
- współdzielona ocena polityki

Do decyzji dotyczących polityki wzmianek używaj `openclaw/plugin-sdk/channel-mention-gating`.
Z `openclaw/plugin-sdk/channel-inbound` korzystaj tylko wtedy, gdy potrzebujesz
szerszego zbioru helperów dla ruchu przychodzącego.

Dobrze pasuje do lokalnej logiki Pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie udziału we wątku
- wykluczanie wiadomości serwisowych/systemowych
- natywne dla platformy cache potrzebne do potwierdzenia udziału bota

Dobrze pasuje do współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych domyślnych wzmianek
- obejście dla poleceń
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce ruchu przychodzącego.

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
bundlowanych Pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych
helperów środowiska uruchomieniowego dla ruchu przychodzącego.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodnościowe. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Pluginu. Pole `channel` w `package.json`
    sprawia, że jest to Plugin kanału. Pełny opis powierzchni metadanych pakietu
    znajdziesz w [Konfiguracja i setup Pluginu](/pl/plugins/sdk-setup#openclaw-channel):

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
      deklaratywne opcje, a kreator składa je razem:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Ograniczony zakresem resolver zabezpieczeń DM na podstawie pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu odpowiedzi (stały, ograniczony do konta lub niestandardowy) |
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
    mógł wyświetlać je w głównej pomocy bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowania nadal przechwytują te same deskryptory do rzeczywistej rejestracji poleceń.
    Zachowaj `registerFull(...)` dla pracy wyłącznie środowiska uruchomieniowego.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu specyficznego dla Pluginu. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozwiązywane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje ten podział trybu rejestracji. Zobacz
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
    Szczegóły znajdziesz w [Konfiguracja i setup](/pl/plugins/sdk-setup#setup-entry).

    Bundlowane kanały workspace, które rozdzielają eksporty bezpieczne dla konfiguracji do modułów
    pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują także
    jawnego settera środowiska uruchomieniowego na czas konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je przez handler ruchu przychodzącego Twojego kanału:

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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału
      ma własny potok ruchu przychodzącego. Zobacz bundlowane Pluginy kanałów
      (na przykład pakiet Pluginu Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testy">
Pisz współlokowane testy w `src/channel.test.ts`:

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

    W przypadku współdzielonych helperów testowych zobacz [Testowanie](/pl/plugins/sdk-testing).

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
    └── runtime.ts            # Magazyn środowiska uruchomieniowego (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, ograniczone do konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
Niektóre bundlowane powierzchnie helperów nadal istnieją na potrzeby utrzymania bundlowanych Pluginów i zgodności. Nie są one zalecanym wzorcem dla nowych Pluginów kanałów; preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę bundlowanych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Pluginu](/pl/plugins/manifest) — pełny schemat manifestu
