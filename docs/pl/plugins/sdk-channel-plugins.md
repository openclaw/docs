---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć interfejs adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Plugin kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-05-10T19:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez tworzenie Pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie tworzono wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania, edytowania ani reagowania. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfigurację** - rozpoznawanie konta i kreator konfiguracji
- **Bezpieczeństwo** - zasady DM i listy dozwolonych
- **Parowanie** - przepływ zatwierdzania przez DM
- **Gramatykę sesji** - sposób mapowania identyfikatorów konwersacji specyficznych dla dostawcy na czaty bazowe, identyfikatory wątków i zapasowe elementy nadrzędne
- **Wiadomości wychodzące** - wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** - sposób wątkowania odpowiedzi
- **Heartbeat wpisywania** - opcjonalne sygnały wpisywania/zajętości dla celów dostarczania heartbeat

Rdzeń odpowiada za wspólne narzędzie wiadomości, okablowanie promptów, zewnętrzny kształt klucza sesji,
ogólną księgowość `:thread:` oraz dispatch.

Nowe Pluginy kanałów powinny również udostępniać adapter `message` za pomocą
`defineChannelMessageAdapter` z `openclaw/plugin-sdk/channel-message`. Adapter
deklaruje, które trwałe możliwości finalnego wysyłania są faktycznie obsługiwane przez natywny transport
i kieruje wysyłanie tekstu/multimediów do tych samych funkcji transportu co
starszy adapter `outbound`. Deklaruj możliwość tylko wtedy, gdy test kontraktu
potwierdza natywny efekt uboczny i zwrócone potwierdzenie.
Pełny kontrakt API, przykłady, macierz możliwości, zasady potwierdzeń, finalizację podglądu na żywo,
zasady ack odbioru, testy i tabelę migracji znajdziesz w
[API wiadomości kanału](/pl/plugins/sdk-channel-message).
Jeśli istniejący adapter `outbound` ma już właściwe metody wysyłania i
metadane możliwości, użyj `createChannelMessageAdapterFromOutbound(...)`, aby
wyprowadzić adapter `message` zamiast ręcznie pisać kolejny most.
Wysyłki adaptera powinny zwracać wartości `MessageReceipt`. Gdy kod zgodności
nadal potrzebuje starszych identyfikatorów, wyprowadzaj je za pomocą `listMessageReceiptPlatformIds(...)`
lub `resolveMessageReceiptPrimaryId(...)` zamiast utrzymywać równoległe pola
`messageIds` w nowym kodzie cyklu życia.
Kanały obsługujące podgląd powinny również deklarować `message.live.capabilities` z
dokładnym cyklem życia na żywo, za który odpowiadają, takim jak `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` albo
`quietFinalization`. Kanały, które finalizują podgląd wersji roboczej w miejscu, powinny
także deklarować `message.live.finalizer.capabilities`, takie jak `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` i
`retainOnAmbiguousFailure`, oraz prowadzić logikę runtime przez
`defineFinalizableLivePreviewAdapter(...)` oraz
`deliverWithFinalizableLivePreviewAdapter(...)`. Utrzymuj te możliwości oparte
na testach `verifyChannelMessageLiveCapabilityAdapterProofs(...)` oraz
`verifyChannelMessageLiveFinalizerProofs(...)`, aby natywny podgląd,
postęp, edycja, zachowanie zapasowe/zachowanie danych, czyszczenie i potwierdzenia nie mogły
po cichu się rozjechać.
Odbiorniki przychodzące, które odraczają potwierdzenia platformy, powinny deklarować
`message.receive.defaultAckPolicy` i `supportedAckPolicies` zamiast ukrywać
czas ack w stanie lokalnym monitora. Pokryj każdą zadeklarowaną zasadę testem
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Starsze pomocniki odpowiedzi/turn, takie jak `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` i `recordInboundSessionAndDispatchReply`,
pozostają dostępne dla dyspozytorów zgodności. Nie używaj tych nazw w nowym
kodzie kanału; nowe Pluginy powinny zaczynać od adaptera `message`, potwierdzeń oraz
pomocników cyklu życia odbioru/wysyłania w `openclaw/plugin-sdk/channel-message`.

Kanały migrujące autoryzację przychodzącą mogą użyć eksperymentalnej
podścieżki `openclaw/plugin-sdk/channel-ingress-runtime` z runtime'owych ścieżek odbioru.
Podścieżka utrzymuje wyszukiwanie platformy i efekty uboczne w Pluginie, a jednocześnie
współdzieli rozpoznawanie stanu listy dozwolonych, decyzje dotyczące trasy/nadawcy/polecenia/zdarzenia/aktywacji,
zredagowaną diagnostykę oraz mapowanie dopuszczenia turn. Utrzymuj normalizację
tożsamości Pluginu w deskryptorze przekazywanym do resolvera; nie
serializuj surowych wartości dopasowania z rozpoznanego stanu ani decyzji. Zobacz
[API ingress kanału](/pl/plugins/sdk-channel-ingress), aby poznać projekt API,
granicę odpowiedzialności i oczekiwania dotyczące testów.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Pluginie kanału. Rdzeń wywołuje je z
rozpoznanym celem dostarczania heartbeat przed rozpoczęciem przebiegu modelu heartbeat i
używa wspólnego cyklu życia utrzymywania/czyszczenia wskaźnika pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości przenoszące źródła multimediów, udostępnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek sandboxa i zasad dostępu do multimediów wychodzących,
więc Pluginy nie potrzebują specjalnych przypadków we wspólnym rdzeniu dla specyficznych dla dostawcy
parametrów awatara, załącznika lub obrazu okładki.
Preferuj zwracanie mapy według kluczy akcji, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów, które
są celowo współdzielone przez każdą udostępnioną akcję.

Jeśli Twój kanał wymaga kształtowania specyficznego dla dostawcy dla `message(action="send")`,
preferuj `actions.prepareSendPayload(...)`. Umieszczaj natywne karty, bloki, osadzenia lub
inne trwałe dane pod `payload.channelData.<channel>` i pozwól rdzeniowi wykonać
rzeczywistą wysyłkę przez adapter outbound/message. Używaj
`actions.handleAction(...)` dla wysyłki tylko jako zapasowej opcji zgodności dla
ładunków, których nie można zserializować i ponowić.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, utrzymuj to parsowanie
w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku,
jawny `baseConversationId` oraz dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowuj ich kolejność od
najwęższego elementu nadrzędnego do najszerszej/bazowej konwersacji.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod Pluginu musi normalizować
pola podobne do tras, porównywać wątek podrzędny z jego trasą nadrzędną albo budować
stabilny klucz deduplikacji z `{ channel, to, accountId, threadId }`. Pomocnik
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, więc Pluginy powinny preferować
go zamiast doraźnych porównań `String(threadId)`.
Pluginy z gramatyką celu specyficzną dla dostawcy mogą wstrzyknąć swój parser do
`resolveChannelRouteTargetWithParser(...)` i nadal uzyskać ten sam kształt celu trasy
oraz semantykę zapasowego wątku, których używa rdzeń.

Bundlowane Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą także udostępnić plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej powierzchni bezpiecznej dla bootstrapu
tylko wtedy, gdy runtime'owy rejestr Pluginów nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starsza zapasowa opcja zgodności, gdy Plugin potrzebuje tylko zapasowych elementów nadrzędnych na bazie
ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń używa najpierw
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hook
je pomija.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń obsługuje `/approve` w tym samym czacie, współdzielone payloady przycisków zatwierdzania oraz ogólne dostarczanie awaryjne.
- Preferuj jeden obiekt `approvalCapability` w pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzania.
- `ChannelPlugin.approvals` został usunięty. Umieść fakty dotyczące dostarczania/natywności/renderowania/uwierzytelniania zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanonicznym połączeniem dla uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia wykonywania, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla wykonywania, aby rozróżnić `enabled` i `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia wykonywania, oraz uwzględnić kanał we wskazówkach dostarczania awaryjnego do natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla specyficznego dla kanału zachowania cyklu życia payloadu, takiego jak ukrywanie zduplikowanych lokalnych monitów o zatwierdzenie albo wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia trybu awaryjnego.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów zatwierdzania należących do kanału. Zachowaj leniwe działanie w gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować Twój moduł wykonawczy na żądanie, nadal pozwalając rdzeniowi złożyć cykl życia zatwierdzania.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych payloadów zatwierdzania zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki wyłączonej wyjaśniała dokładne pokrętła konfiguracji potrzebne do włączenia natywnych zatwierdzeń wykonywania. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki zakresowane do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki rdzenia specyficznej dla zatwierdzania.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skoncentrowany na normalizacji celu oraz faktach transportu/prezentacji. Używaj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` albo `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i obsługiwać filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielony na kilka mniejszych połączeń:
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego dopasowywania tras kanału dla celów `{ to, accountId, threadId }`. Przekazuj `targetsMatch` tylko wtedy, gdy kanał ma specyficzne dla dostawcy reguły równoważności, takie jak dopasowywanie prefiksu znacznika czasu Slack.
- Przekaż `normalizeTargetForMatch` do `createChannelNativeOriginTargetResolver`, gdy kanał musi kanonizować identyfikatory dostawcy przed uruchomieniem domyślnego dopasowywania tras albo niestandardowego callbacku `targetsMatch`, zachowując oryginalny cel dla dostarczenia. Używaj `normalizeTarget` tylko wtedy, gdy sam rozpoznany cel dostarczenia powinien zostać skanonizowany.
- `availability` - czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` - mapowanie współdzielonego modelu widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe natywne payloady albo działania końcowe
- `transport` - przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzania
- `interactions` - opcjonalne hooki wiązania/odwiązywania/czyszczenia działań dla natywnych przycisków lub reakcji
- `observe` - opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt albo odbiornik webhooka, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala rdzeniowi uruchamiać handlery sterowane możliwościami ze stanu startowego kanału bez dodawania kleju opakowującego specyficznego dla zatwierdzeń.
- Sięgaj po niższego poziomu `createChannelApprovalHandler` albo `createChannelNativeApprovalRuntime` tylko wtedy, gdy połączenie sterowane możliwościami nie jest jeszcze wystarczająco wyraziste.
- Natywne kanały zatwierdzania muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje zakres polityki zatwierdzania wielu kont przy właściwym koncie bota, a `approvalKind` udostępnia kanałowi zachowanie zatwierdzeń wykonywania i Plugin bez twardo zakodowanych gałęzi w rdzeniu.
- Rdzeń obsługuje teraz także powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij dokładne routowanie źródła i DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzania i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj dostarczonego identyfikatora zatwierdzenia od początku do końca. Natywni klienci nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń wykonywania i Plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Obecne przykłady w pakiecie:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów wykonywania, jak i Plugin.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń wykonywania
    i Plugin, jednocześnie nadal pozwalając, aby uwierzytelnianie różniło się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie kompatybilności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w pluginie.

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
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` oraz
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni
parasolowej.

Specyficznie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje helpery konfiguracji bezpieczne dla runtime:
  bezpieczne do importu adaptery łat konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatki wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery proxy konfiguracji
- `openclaw/plugin-sdk/setup-runtime` zawiera połączenie adaptera świadomego env dla
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane env, a ogólne przepływy uruchamiania/konfiguracji
powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w manifeście
pluginu za pomocą `channelEnvVars`. Zachowaj runtime kanału `envVars` albo lokalne
stałe tylko dla treści skierowanej do operatora.

Jeśli Twój kanał może pojawiać się w `status`, `channels list`, `channels status` albo
skanach SecretRef przed startem runtime pluginu, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importu w ścieżkach poleceń
tylko do odczytu i powinien zwracać metadane kanału, bezpieczny dla konfiguracji adapter konfiguracji, adapter statusu
oraz metadane docelowe sekretów kanału potrzebne do tych podsumowań. Nie
uruchamiaj klientów, listenerów ani runtime transportu z punktu wejścia konfiguracji.

Zachowaj także wąską ścieżkę importu głównego punktu wejścia kanału. Odkrywanie może ocenić
punkt wejścia i moduł pluginu kanału, aby zarejestrować możliwości bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt pluginu
kanału bez importowania kreatorów konfiguracji, klientów transportu, listenerów socketów,
launcherów podprocesów ani modułów startu usług. Umieść te elementy runtime
w modułach ładowanych z `registerFull(...)`, setterów runtime albo leniwych
adapterów możliwości.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszego połączenia `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten plugin” w powierzchniach konfiguracji,
preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator zamyka się bezpiecznie przy zapisach konfiguracji i finalizacji oraz ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i treści
linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  awaryjnego użycia konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla trasy/koperty przychodzącej oraz
  okablowania zapisz-i-wyślij
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz delegatów
  tożsamości/wysyłania wychodzącego i planowania payloadów
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować
  jawne `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisywać
  pierwszeństwo, zachowanie sufiksów oraz normalizację identyfikatora wątku, gdy ich platforma
  ma semantykę natywnego dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia wiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy starszy układ pól payloadu
  agenta/mediów jest nadal wymagany
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego awaryjnie kontraktu konfiguracji poleceń

Kanały tylko uwierzytelniające zwykle mogą zatrzymać się na domyślnej ścieżce: rdzeń obsługuje zatwierdzenia, a plugin tylko udostępnia możliwości wychodzące/uwierzytelniania. Natywne kanały zatwierdzania, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast tworzyć własny cykl życia zatwierdzania.

## Polityka wzmianek przychodzących

Utrzymuj obsługę wzmianek przychodzących podzieloną na dwie warstwy:

- zbieranie dowodów należące do pluginu
- ocena współdzielonej polityki

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji polityki wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego barrela helperów
przychodzących.

Dobry zakres dla logiki lokalnej pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowanego bota
- sprawdzanie uczestnictwa w wątku
- wykluczenia wiadomości serwisowych/systemowych
- natywne dla platformy cache potrzebne do potwierdzenia uczestnictwa bota

Dobry zakres dla współdzielonego helpera:

- `requireMention`
- wynik jawnej wzmianki
- lista dozwolonych wzmianki niejawnej
- obejście polecenia
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` oraz `decision.shouldSkip` w swojej bramce przychodzącej.

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

`api.runtime.channel.mentions` udostępnia te same współdzielone pomocniki wzmianki dla
dołączonych Pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych pomocników
środowiska uruchomieniowego dla ruchu przychodzącego.

Starsze pomocniki `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksport zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Pluginu. Pole `channel` w `package.json` jest
    tym, co sprawia, że jest to Plugin kanału. Pełny zakres metadanych pakietu
    znajdziesz w [Konfiguracja i ustawienia Pluginu](/pl/plugins/sdk-setup#openclaw-channel):

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
    ustawień należących do Pluginu, które nie są konfiguracją konta kanału. `channelConfigs`
    waliduje `channels.acme-chat` i jest źródłem ścieżki zimnej używanym przez schemat
    konfiguracji, konfigurator i powierzchnie UI przed załadowaniem środowiska uruchomieniowego Pluginu.

  </Step>

  <Step title="Zbuduj obiekt Pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum - `id` i `setup` - i dodawaj adaptery, gdy będą potrzebne.

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

    W przypadku kanałów, które akceptują zarówno kanoniczne klucze DM najwyższego poziomu, jak i starsze klucze zagnieżdżone, użyj pomocników z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` oraz `normalizeChannelDmPolicy` utrzymują wartości lokalne dla konta przed odziedziczonymi wartościami z katalogu głównego. Sparuj ten sam resolver z naprawą przez doctor za pomocą `normalizeLegacyDmAliases`, aby środowisko uruchomieniowe i migracja odczytywały ten sam kontrakt.

    <Accordion title="Co createChatChannelPlugin robi za Ciebie">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      opcje deklaratywne, a konstruktor je komponuje:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Resolver zabezpieczeń DM o określonym zakresie z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu odpowiedzi (stały, o zakresie konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania z czasu dostarczenia,
      takie jak `maxLinesPerMessage`; zastosuj je przed wysłaniem, aby wątkowanie odpowiedzi
      i granice fragmentów zostały rozwiązane raz przez współdzielone dostarczanie wychodzące.
      Konteksty wysyłania zawierają też `replyToIdSource` (`implicit` lub `explicit`),
      gdy rozwiązano natywny cel odpowiedzi, dzięki czemu pomocniki ładunku mogą zachować
      jawne znaczniki odpowiedzi bez zużywania niejawnego, jednorazowego miejsca odpowiedzi.
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
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego środowiska uruchomieniowego kanału,
    a zwykłe pełne ładowanie nadal pobierało te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla prac wyłącznie w środowisku uruchomieniowym.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu specyficznego dla Pluginu. Główne przestrzenie nazw administracyjnych (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Wszystkie
    opcje znajdziesz w [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Dodaj punkt wejścia konfiguratora">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu środowiska uruchomieniowego podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały obszaru roboczego, które dzielą eksporty bezpieczne dla konfiguracji na moduły
    boczne, mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują też
    jawnego settera środowiska uruchomieniowego w czasie konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    wysyła je przez handler przychodzący Twojego kanału:

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
      Obsługa wiadomości przychodzących zależy od kanału. Każdy Plugin kanału ma
      własny potok wejściowy. Rzeczywiste wzorce znajdziesz w dołączonych Pluginach kanałów
      (na przykład w pakiecie Pluginu Microsoft Teams lub Google Chat).
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

    Współdzielone pomocnicze narzędzia testowe opisano w sekcji [Testowanie](/pl/plugins/sdk-testing).

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
  <Card title="Threading options" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, tryby zakresu konta albo tryby niestandardowe
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/pl/plugins/sdk-channel-turn">
    Współdzielony cykl życia tury przychodzącej: pobieranie, rozpoznawanie, rejestrowanie, wysyłanie, finalizacja
  </Card>
</CardGroup>

<Note>
Niektóre dołączone pomocnicze punkty styku nadal istnieją na potrzeby utrzymania
i zgodności dołączonych Pluginów. Nie są zalecanym wzorcem dla nowych Pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - jeśli Twój Plugin udostępnia również modele
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna dokumentacja importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) - narzędzia testowe i testy kontraktowe
- [Manifest Pluginu](/pl/plugins/manifest) - pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie Pluginów](/pl/plugins/building-plugins)
- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
