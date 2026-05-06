---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć interfejs adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin kanału wiadomości dla OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-05-06T09:23:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez budowanie Plugin kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli wcześniej nie tworzono żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfiguracja** - rozpoznawanie konta i kreator konfiguracji
- **Bezpieczeństwo** - polityka DM i listy dozwolonych
- **Parowanie** - przepływ zatwierdzania DM
- **Gramatyka sesji** - sposób mapowania identyfikatorów rozmów specyficznych dla dostawcy na czaty bazowe, identyfikatory wątków i zapasowe elementy nadrzędne
- **Wiadomości wychodzące** - wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** - sposób wątkowania odpowiedzi
- **Sygnalizacja pisania Heartbeat** - opcjonalne sygnały pisania/zajętości dla celów dostarczania heartbeat

Rdzeń odpowiada za wspólne narzędzie wiadomości, podłączanie promptów, zewnętrzny kształt klucza sesji,
ogólne księgowanie `:thread:` i wysyłkę.

Nowe Pluginy kanałów powinny także udostępniać adapter `message` za pomocą
`defineChannelMessageAdapter` z `openclaw/plugin-sdk/channel-message`. Adapter
deklaruje, które trwałe możliwości końcowego wysyłania są faktycznie obsługiwane przez transport natywny,
i kieruje wysyłanie tekstu/multimediów do tych samych funkcji transportu co
starszy adapter `outbound`. Deklaruj możliwość tylko wtedy, gdy test kontraktu
potwierdza natywny efekt uboczny i zwracane potwierdzenie.
Pełny kontrakt API, przykłady, macierz możliwości, reguły potwierdzeń, finalizację
podglądu na żywo, politykę ack odbioru, testy i tabelę migracji znajdziesz w
[API wiadomości kanału](/pl/plugins/sdk-channel-message).
Jeśli istniejący adapter `outbound` ma już odpowiednie metody wysyłania i
metadane możliwości, użyj `createChannelMessageAdapterFromOutbound(...)`, aby
wyprowadzić adapter `message` zamiast ręcznie pisać kolejny most.
Wysyłki adaptera powinny zwracać wartości `MessageReceipt`. Gdy kod zgodności
nadal potrzebuje starszych identyfikatorów, wyprowadź je za pomocą `listMessageReceiptPlatformIds(...)`
lub `resolveMessageReceiptPrimaryId(...)` zamiast utrzymywać równoległe
pola `messageIds` w nowym kodzie cyklu życia.
Kanały obsługujące podgląd powinny także deklarować `message.live.capabilities` z
dokładnym cyklem życia na żywo, którym zarządzają, takim jak `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` lub
`quietFinalization`. Kanały finalizujące roboczy podgląd w miejscu powinny
także deklarować `message.live.finalizer.capabilities`, takie jak `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` i
`retainOnAmbiguousFailure`, oraz kierować logikę środowiska uruchomieniowego przez
`defineFinalizableLivePreviewAdapter(...)` wraz z
`deliverWithFinalizableLivePreviewAdapter(...)`. Utrzymuj te możliwości potwierdzone
testami `verifyChannelMessageLiveCapabilityAdapterProofs(...)` i
`verifyChannelMessageLiveFinalizerProofs(...)`, aby natywny podgląd,
postęp, edycja, fallback/zachowanie, czyszczenie i zachowanie potwierdzeń nie mogły
po cichu się rozjechać.
Odbiorniki wejściowe, które odraczają potwierdzenia platformy, powinny deklarować
`message.receive.defaultAckPolicy` i `supportedAckPolicies` zamiast ukrywać
czas ack w stanie lokalnym monitora. Obejmij każdą zadeklarowaną politykę testem
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Starsze helpery odpowiedzi/tur, takie jak `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` i `recordInboundSessionAndDispatchReply`,
pozostają dostępne dla dyspozytorów zgodności. Nie używaj tych nazw w nowym
kodzie kanału; nowe Pluginy powinny zaczynać od adaptera `message`, potwierdzeń oraz
helperów cyklu życia odbioru/wysyłki w `openclaw/plugin-sdk/channel-message`.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami wejściowymi, udostępnij
`heartbeat.sendTyping(...)` w Plugin kanału. Rdzeń wywołuje go z
rozpoznanym celem dostarczania heartbeat przed rozpoczęciem przebiegu modelu heartbeat i
używa wspólnego cyklu życia keepalive/czyszczenia pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła multimediów, udostępnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek piaskownicy i polityki dostępu do multimediów wychodzących,
więc Pluginy nie potrzebują specjalnych przypadków we wspólnym rdzeniu dla parametrów specyficznych dla dostawcy:
awatara, załącznika lub obrazu okładki.
Preferuj zwracanie mapy kluczowanej akcjami, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów z innej akcji. Płaska tablica nadal działa dla parametrów,
które są celowo współdzielone przez każdą udostępnioną akcję.

Jeśli Twój kanał wymaga kształtowania specyficznego dla dostawcy dla `message(action="send")`,
preferuj `actions.prepareSendPayload(...)`. Umieszczaj natywne karty, bloki, osadzenia lub
inne trwałe dane w `payload.channelData.<channel>` i pozwól rdzeniowi wykonać
właściwą wysyłkę przez adapter outbound/message. Używaj
`actions.handleAction(...)` dla wysyłania tylko jako zapasowego mechanizmu zgodności dla
ładunków, których nie można zserializować i ponowić.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, utrzymuj to parsowanie
w Plugin za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator
wątku, jawne `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, utrzymuj je uporządkowane od
najwęższego elementu nadrzędnego do najszerszej/bazowej rozmowy.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod Plugin musi normalizować
pola podobne do tras, porównywać wątek podrzędny z jego trasą nadrzędną albo budować
stabilny klucz deduplikacji z `{ channel, to, accountId, threadId }`. Helper
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, więc Pluginy powinny preferować
go zamiast doraźnych porównań `String(threadId)`.
Pluginy z gramatyką celów specyficzną dla dostawcy mogą wstrzyknąć swój parser do
`resolveChannelRouteTargetWithParser(...)` i nadal uzyskać ten sam kształt celu trasy
oraz semantykę zapasowego wątku, której używa rdzeń.

Wbudowane Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą także udostępnić plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej powierzchni bezpiecznej dla bootstrapu
tylko wtedy, gdy rejestr Plugin środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy zapasowy mechanizm zgodności, gdy Plugin potrzebuje tylko zapasowych elementów nadrzędnych na podstawie
ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates` i sięga po
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hook
je pomija.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone payloady przycisków zatwierdzania oraz ogólne dostarczanie awaryjne.
- Preferuj jeden obiekt `approvalCapability` w Pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` został usunięty. Umieść fakty dotyczące dostarczania/renderowania/uwierzytelniania oraz natywnych zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanoniczną seamą uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, używaj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec, aby odróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględnić kanał w wskazówkach awaryjnych dla natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowania cyklu życia payloadu specyficznego dla kanału, takiego jak ukrywanie zduplikowanych lokalnych monitów zatwierdzenia lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia fallbacku.
- Używaj `approvalCapability.nativeRuntime` dla faktów natywnych zatwierdzeń należących do kanału. Utrzymuj je lazy na gorących entrypointach kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, nadal pozwalając rdzeniowi złożyć cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych payloadów zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź na ścieżce wyłączenia wyjaśniała dokładne przełączniki konfiguracyjne potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki zakresowane do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne, podobne do właściciela tożsamości DM z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki rdzenia specyficznej dla zatwierdzeń.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Używaj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i odpowiadać za filtrowanie żądań, routing, deduplikację, wygaśnięcie, subskrypcję Gateway oraz powiadomienia o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielony na kilka mniejszych seamów:
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego matchera tras kanałów dla celów `{ to, accountId, threadId }`. Przekazuj `targetsMatch` tylko wtedy, gdy kanał ma reguły równoważności specyficzne dla dostawcy, takie jak dopasowywanie prefiksu timestampu w Slack.
- Przekaż `normalizeTargetForMatch` do `createChannelNativeOriginTargetResolver`, gdy kanał musi kanonizować identyfikatory dostawcy przed uruchomieniem domyślnego matchera tras lub niestandardowego callbacka `targetsMatch`, zachowując oryginalny cel do dostarczenia. Używaj `normalizeTarget` tylko wtedy, gdy sam rozwiązany cel dostarczenia powinien zostać skanonizowany.
- `availability` - czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` - mapuje współdzielony model widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe natywne payloady lub końcowe akcje
- `transport` - przygotowuje cele oraz wysyła/aktualizuje/usuwa natywne wiadomości zatwierdzeń
- `interactions` - opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` - opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala rdzeniowi bootstrapować handlery sterowane capability ze stanu startowego kanału bez dodawania wrapper glue specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy seam sterowana capability nie jest jeszcze wystarczająco ekspresyjna.
- Natywne kanały zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` udostępnia kanałowi zachowanie zatwierdzeń exec vs Plugin bez zakodowanych gałęzi w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego powinny udostępniać dokładny routing pochodzenia + DM zatwierdzającego przez współdzielone helpery capability zatwierdzeń i pozwolić rdzeniowi zagregować faktyczne dostarczenia przed opublikowaniem powiadomienia z powrotem na czacie inicjującym.
- Zachowaj rodzaj dostarczonego identyfikatora zatwierdzenia end-to-end. Natywni klienci nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin ze stanu lokalnego kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Aktualne przykłady wbudowane:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanału oraz UX reakcji dla zatwierdzeń exec
    i Plugin, nadal pozwalając, aby uwierzytelnianie różniło się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper kompatybilności, ale nowy kod powinien preferować builder capability i udostępniać `approvalCapability` w Pluginie.

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
`openclaw/plugin-sdk/reply-reference` oraz
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni
parasola.

Konkretnie dla setupu:

- `openclaw/plugin-sdk/setup-runtime` obejmuje helpery setupu bezpieczne dla runtime:
  importowo bezpieczne adaptery patchy setupu (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wynik notatki lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma env seama adaptera
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery setupu
  opcjonalnej instalacji oraz kilka prymitywów bezpiecznych dla setupu:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje setup lub uwierzytelnianie sterowane przez env, a ogólne przepływy startupu/konfiguracji
powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w
manifeście Plugin za pomocą `channelEnvVars`. Zachowaj runtime kanału `envVars` lub lokalne
stałe wyłącznie dla tekstu skierowanego do operatora.

Jeśli Twój kanał może pojawić się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed startem runtime Plugin, dodaj `openclaw.setupEntry` w
`package.json`. Ten entrypoint powinien być bezpieczny do importu w ścieżkach poleceń
tylko do odczytu i powinien zwracać metadane kanału, bezpieczny dla setupu adapter konfiguracji, adapter statusu
oraz metadane celów sekretów kanału potrzebne do tych podsumowań. Nie
uruchamiaj klientów, listenerów ani runtime transportu z entry setupu.

Utrzymuj wąską także główną ścieżkę importu entry kanału. Discovery może ocenić
entry i moduł Plugin kanału, aby zarejestrować capability bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt Plugin
kanału bez importowania kreatorów setupu, klientów transportu, listenerów socketów,
launcherów subprocessów ani modułów startu usług. Umieść te części runtime
w modułach ładowanych z `registerFull(...)`, setterów runtime lub lazy
adapterów capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej seamy `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów setupu/konfiguracji, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten Plugin” w powierzchniach setupu, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator kończy się bezpieczną odmową przy zapisach konfiguracji i finalizacji oraz ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i tekście
linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  fallbacku domyślnego konta
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla przychodzącej trasy/koperty i
  okablowania record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz delegatów
  tożsamości/wysyłania wychodzącego i planowania payloadu
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować
  jawne `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisywać
  priorytet, zachowanie sufiksów i normalizację identyfikatora wątku, gdy ich platforma
  ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia thread-binding
  i rejestracji adaptera
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy starszy układ pól payloadu agenta/mediów
  jest nadal wymagany
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego fallbackiem kontraktu konfiguracji poleceń

Kanały wyłącznie uwierzytelniające mogą zwykle zatrzymać się na domyślnej ścieżce: rdzeń obsługuje zatwierdzenia, a Plugin po prostu udostępnia capability wychodzące/uwierzytelniania. Natywne kanały zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast tworzyć własny cykl życia zatwierdzeń.

## Zasady dotyczące wzmianek przychodzących

Obsługę wzmianek przychodzących utrzymuj podzieloną na dwie warstwy:

- zbieranie dowodów należące do Plugin
- współdzielona ewaluacja zasad

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji dotyczących zasad wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego barrela helperów
przychodzących.

Dobre dopasowanie dla logiki lokalnej Plugin:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowanego bota
- sprawdzanie uczestnictwa w wątku
- wykluczenia wiadomości serwisowych/systemowych
- natywne cache platformy potrzebne do udowodnienia uczestnictwa bota

Dobre dopasowanie dla współdzielonego helpera:

- `requireMention`
- wynik jawnej wzmianki
- lista dozwolonych wzmiankowania niejawnego
- obejście komendy
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce przychodzącej.

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

`api.runtime.channel.mentions` udostępnia te same współdzielone pomocniki wzmianek dla
wbudowanych channel plugins, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych pomocników
runtime dla obsługi przychodzącej.

Starsze pomocniki `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Plugin. Pole `channel` w `package.json` jest tym,
    co sprawia, że jest to channel plugin. Pełny zakres metadanych pakietu
    znajdziesz w [Konfiguracja i ustawienia Plugin](/pl/plugins/sdk-setup#openclaw-channel):

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
    waliduje `channels.acme-chat` i jest źródłem zimnej ścieżki używanym przez schemat
    konfiguracji, konfigurację początkową i powierzchnie UI, zanim załaduje się runtime Plugin.

  </Step>

  <Step title="Zbuduj obiekt channel plugin">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum - `id` i `setup` - i dodawaj adaptery w miarę potrzeb.

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

    W przypadku kanałów, które akceptują zarówno kanoniczne klucze DM najwyższego poziomu, jak i starsze klucze zagnieżdżone, używaj pomocników z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` i `normalizeChannelDmPolicy` utrzymują wartości lokalne dla konta przed odziedziczonymi wartościami głównymi. Połącz ten sam resolver z naprawą doctor przez `normalizeLegacyDmAliases`, aby runtime i migracja odczytywały ten sam kontrakt.

    <Accordion title="Co createChatChannelPlugin robi za Ciebie">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      opcje deklaratywne, a builder je komponuje:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Zakresowy resolver zabezpieczeń DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, zakresowy dla konta albo niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania z czasu dostarczania,
      takie jak `maxLinesPerMessage`; zastosuj je przed wysłaniem, aby wątkowanie odpowiedzi
      i granice fragmentów zostały rozstrzygnięte raz przez współdzielone dostarczanie wychodzące.
      Konteksty wysyłania zawierają też `replyToIdSource` (`implicit` lub `explicit`),
      gdy natywny cel odpowiedzi został rozstrzygnięty, więc pomocniki payload mogą zachować
      jawne tagi odpowiedzi bez zużywania niejawnego, jednorazowego miejsca odpowiedzi.
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
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego runtime kanału,
    podczas gdy normalne pełne ładowania nadal pobierają te same deskryptory do rzeczywistej
    rejestracji komend. Zachowaj `registerFull(...)` dla pracy wyłącznie runtime.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu specyficznego dla Plugin. Główne przestrzenie nazw administracyjnych (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj wpis konfiguracji początkowej">
    Utwórz `setup-entry.ts` dla lekkiego ładowania podczas wdrażania:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego wpisu, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów konfiguracji początkowej.
    Szczegóły znajdziesz w [Konfiguracja początkowa i konfiguracja](/pl/plugins/sdk-setup#setup-entry).

    Wbudowane kanały przestrzeni roboczej, które wydzielają eksporty bezpieczne dla konfiguracji początkowej do modułów pomocniczych,
    mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują też
    jawnego settera runtime na czas konfiguracji początkowej.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je przez obsługę przychodzącą Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału odpowiada
      za własny potok przychodzący. Zobacz dołączone Plugin kanałów
      (na przykład pakiet Plugin Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Napisz testy współlokowane w `src/channel.test.ts`:

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

    Współdzielone pomocniki testowe znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

</Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
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
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, ograniczone do konta lub niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Pomocniki środowiska wykonawczego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, subagent przez api.runtime
  </Card>
  <Card title="Jądro tury kanału" icon="bolt" href="/pl/plugins/sdk-channel-turn">
    Współdzielony cykl życia tury przychodzącej: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Niektóre dołączone pomocnicze punkty styku nadal istnieją na potrzeby utrzymania dołączonych Plugin
i zgodności. Nie są zalecanym wzorcem dla nowych Plugin kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Plugin.
</Note>

## Następne kroki

- [Plugin dostawców](/pl/plugins/sdk-provider-plugins) - jeśli Twój Plugin udostępnia także modele
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) - narzędzia testowe i testy kontraktowe
- [Manifest Plugin](/pl/plugins/manifest) - pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Plugin uprzęży agenta](/pl/plugins/sdk-agent-harness)
