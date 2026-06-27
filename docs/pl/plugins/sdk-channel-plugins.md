---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: 'Przewodnik krok po kroku: tworzenie Plugin kanału komunikacyjnego dla OpenClaw'
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-06-27T18:05:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez budowanie pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie zbudowano wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje jedno
współdzielone narzędzie `message` w rdzeniu. Twój plugin odpowiada za:

- **Konfiguracja** - rozwiązywanie konta i kreator konfiguracji
- **Bezpieczeństwo** - zasady DM i listy dozwolonych
- **Parowanie** - przepływ zatwierdzania DM
- **Gramatyka sesji** - sposób mapowania identyfikatorów konwersacji specyficznych dla dostawcy na czaty bazowe, identyfikatory wątków i rezerwowe elementy nadrzędne
- **Wiadomości wychodzące** - wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** - sposób wątkowania odpowiedzi
- **Wpisywanie Heartbeat** - opcjonalne sygnały pisania/zajętości dla celów dostarczania heartbeat

Rdzeń odpowiada za współdzielone narzędzie wiadomości, okablowanie promptów, zewnętrzny kształt klucza sesji,
ogólne księgowanie `:thread:` i dispatch.

Nowe pluginy kanałów powinny także udostępniać adapter `message` za pomocą
`defineChannelMessageAdapter` z `openclaw/plugin-sdk/channel-outbound`. Adapter
deklaruje, które trwałe możliwości finalnego wysłania natywny transport
rzeczywiście obsługuje, oraz kieruje wysyłki tekstu/multimediów do tych samych funkcji transportu co
starszy adapter `outbound`. Deklaruj możliwość tylko wtedy, gdy test kontraktu
potwierdza natywny efekt uboczny i zwrócone potwierdzenie.
Pełny kontrakt API, przykłady, macierz możliwości, zasady potwierdzeń, finalizację
podglądu na żywo, zasady potwierdzeń odbioru, testy i tabelę migracji znajdziesz w
[API wiadomości wychodzących kanału](/pl/plugins/sdk-channel-outbound).
Jeśli istniejący adapter `outbound` ma już właściwe metody wysyłania i
metadane możliwości, użyj `createChannelMessageAdapterFromOutbound(...)`, aby
wyprowadzić adapter `message` zamiast ręcznie pisać kolejny most.
Wysyłki adaptera powinny zwracać wartości `MessageReceipt`. Gdy kod zgodności
nadal potrzebuje starszych identyfikatorów, wyprowadzaj je za pomocą `listMessageReceiptPlatformIds(...)`
lub `resolveMessageReceiptPrimaryId(...)` zamiast utrzymywać równoległe
pola `messageIds` w nowym kodzie cyklu życia.
Kanały obsługujące podgląd powinny także deklarować `message.live.capabilities` z
dokładnym cyklem życia na żywo, za który odpowiadają, takim jak `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` lub
`quietFinalization`. Kanały, które finalizują podgląd wersji roboczej w miejscu, powinny
także deklarować `message.live.finalizer.capabilities`, takie jak `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` i
`retainOnAmbiguousFailure`, oraz prowadzić logikę runtime przez
`defineFinalizableLivePreviewAdapter(...)` wraz z
`deliverWithFinalizableLivePreviewAdapter(...)`. Utrzymuj te możliwości potwierdzone
testami `verifyChannelMessageLiveCapabilityAdapterProofs(...)` i
`verifyChannelMessageLiveFinalizerProofs(...)`, aby natywny podgląd,
postęp, edycja, fallback/zachowanie, czyszczenie i zachowanie potwierdzeń nie mogły
po cichu się rozjechać.
Odbiorniki przychodzące, które odraczają potwierdzenia platformy, powinny deklarować
`message.receive.defaultAckPolicy` i `supportedAckPolicies` zamiast ukrywać
czas potwierdzenia w lokalnym stanie monitora. Pokryj każdą zadeklarowaną zasadę za pomocą
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Starsze helpery odpowiedzi, takie jak `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` i `recordInboundSessionAndDispatchReply`,
pozostają dostępne dla dispatcherów zgodności. Nie używaj tych nazw w nowym
kodzie kanału; nowe pluginy powinny zaczynać od adaptera `message`, potwierdzeń oraz
helperów cyklu życia odbioru/wysyłania z `openclaw/plugin-sdk/channel-outbound`.

Kanały migrujące autoryzację przychodzącą mogą używać eksperymentalnej
ścieżki podrzędnej `openclaw/plugin-sdk/channel-ingress-runtime` ze ścieżek odbioru runtime.
Ścieżka podrzędna utrzymuje wyszukiwanie platformy i efekty uboczne w pluginie, jednocześnie
współdzieląc rozwiązywanie stanu listy dozwolonych, decyzje dotyczące trasy/nadawcy/polecenia/zdarzenia/aktywacji,
zredagowane diagnostyki i mapowanie dopuszczenia tury. Zachowaj normalizację
tożsamości pluginu w deskryptorze przekazywanym do resolvera; nie
serializuj surowych wartości dopasowania z rozwiązanego stanu ani decyzji. Zobacz
[API wejścia kanału](/pl/plugins/sdk-channel-ingress), aby poznać projekt API,
granicę własności i oczekiwania testowe.

Jeśli kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w pluginie kanału. Rdzeń wywołuje je z
rozwiązanym celem dostarczania heartbeat przed rozpoczęciem przebiegu modelu heartbeat i
używa współdzielonego cyklu życia podtrzymania/czyszczenia pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli kanał dodaje parametry narzędzia wiadomości przenoszące źródła multimediów, udostępnij
nazwy tych parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek sandboxa i zasad dostępu do multimediów wychodzących,
więc pluginy nie potrzebują specjalnych przypadków we współdzielonym rdzeniu dla specyficznych dla dostawcy
parametrów awatara, załącznika lub obrazu okładki.
Preferuj zwracanie mapy kluczowanej akcjami, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów, które
są celowo współdzielone przez każdą udostępnioną akcję.
Kanały, które muszą udostępnić tymczasowy publiczny URL do pobrania multimediów po stronie platformy,
mogą użyć `createHostedOutboundMediaStore(...)` z
`openclaw/plugin-sdk/outbound-media` wraz z magazynami stanu pluginu. Zachowaj parsowanie
tras platformy i egzekwowanie tokenów w pluginie kanału; współdzielony helper
odpowiada tylko za ładowanie multimediów, metadane wygaśnięcia, wiersze fragmentów i czyszczenie.

Jeśli kanał wymaga kształtowania specyficznego dla dostawcy dla `message(action="send")`,
preferuj `actions.prepareSendPayload(...)`. Umieszczaj natywne karty, bloki, osadzenia lub
inne trwałe dane pod `payload.channelData.<channel>` i pozwól rdzeniowi wykonać
właściwą wysyłkę przez adapter outbound/message. Używaj
`actions.handleAction(...)` do wysyłania tylko jako fallback zgodności dla
ładunków, których nie można zserializować i ponowić.

Jeśli platforma przechowuje dodatkowy zakres wewnątrz identyfikatorów konwersacji, zachowaj to parsowanie
w pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku,
jawny `baseConversationId` oraz wszelkie `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, utrzymuj je w kolejności od
najwęższego elementu nadrzędnego do najszerszej/bazowej konwersacji.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod pluginu musi normalizować
pola przypominające trasy, porównać wątek podrzędny z jego trasą nadrzędną albo zbudować
stabilny klucz deduplikacji z `{ channel, to, accountId, threadId }`. Helper
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, więc pluginy powinny preferować
go zamiast doraźnych porównań `String(threadId)`.
Pluginy z gramatyką celu specyficzną dla dostawcy powinny udostępniać
`messaging.resolveOutboundSessionRoute(...)`, aby rdzeń otrzymywał natywną dla dostawcy
tożsamość sesji i wątku bez używania shimów parsera.

Dołączone pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą także udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapa powierzchni
tylko wtedy, gdy rejestr pluginów runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy fallback zgodności, gdy plugin potrzebuje tylko rezerwowych elementów nadrzędnych na bazie
ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń używa najpierw
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hook
je pomija.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń obsługuje same-chat `/approve`, współdzielone payloady przycisków zatwierdzeń oraz ogólne dostarczanie awaryjne.
- Preferuj jeden obiekt `approvalCapability` w Pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` usunięto. Umieszczaj fakty dotyczące dostarczania/natywności/renderowania/uwierzytelniania zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanonicznym połączeniem uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń same-chat.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od uwierzytelniania zatwierdzeń same-chat. Rdzeń używa tego hooka specyficznego dla exec, aby odróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględnić kanał we wskazówkach dotyczących awaryjnego użycia natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` uzupełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` do specyficznego dla kanału zachowania cyklu życia payloadu, takiego jak ukrywanie zduplikowanych lokalnych monitów zatwierdzeń lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia awaryjnego.
- Używaj `approvalCapability.nativeRuntime` do faktów natywnych zatwierdzeń zarządzanych przez kanał. Zachowaj leniwość w gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, jednocześnie nadal pozwalając rdzeniowi złożyć cykl życia zatwierdzenia.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę wymaga niestandardowych payloadów zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki wyłączonej wyjaśniała dokładne pokrętła konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki o zakresie konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych wartości najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć same-chat `/approve` bez dodawania logiki rdzenia specyficznej dla zatwierdzeń.
- Jeśli niestandardowe uwierzytelnianie zatwierdzeń celowo dopuszcza tylko awaryjny same-chat, zwróć `markImplicitSameChatApprovalAuthorization({ authorized: true })` z `openclaw/plugin-sdk/approval-auth-runtime`; w przeciwnym razie rdzeń traktuje wynik jako jawne upoważnienie zatwierdzającego.
- Jeśli natywne wywołanie zwrotne zarządzane przez kanał rozwiązuje zatwierdzenia bezpośrednio, użyj `isImplicitSameChatApprovalAuthorization(...)` przed rozwiązaniem, aby niejawny fallback nadal przechodził przez normalne upoważnienie aktora kanału.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymaj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o routingu gdzie indziej. `nativeRuntime` jest podzielony na kilka mniejszych połączeń:
- Używaj `createNativeApprovalChannelRouteGates` z `openclaw/plugin-sdk/approval-native-runtime`, gdy kanał obsługuje zarówno natywne dostarczanie pochodzące z sesji, jak i jawne cele przekazywania zatwierdzeń. Helper centralizuje wybór konfiguracji zatwierdzeń, obsługę `mode`, filtry agenta/sesji, powiązanie konta, dopasowanie celu sesji i dopasowanie listy celów, podczas gdy wywołujący nadal zarządzają identyfikatorem kanału, domyślnym trybem przekazywania, wyszukiwaniem konta, sprawdzaniem włączenia transportu, normalizacją celu i rozwiązywaniem celu źródła tury. Nie używaj go do tworzenia domyślnych polityk kanału zarządzanych przez rdzeń; jawnie przekaż udokumentowany domyślny tryb kanału.
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego dopasowywania tras kanału dla celów `{ to, accountId, threadId }`. Przekaż `targetsMatch` tylko wtedy, gdy kanał ma reguły równoważności specyficzne dla providera, takie jak dopasowanie prefiksu znacznika czasu Slack.
- Przekaż `normalizeTargetForMatch` do `createChannelNativeOriginTargetResolver`, gdy kanał musi kanonizować identyfikatory providera przed uruchomieniem domyślnego dopasowywania tras lub niestandardowego callbacku `targetsMatch`, zachowując jednocześnie pierwotny cel do dostarczenia. Używaj `normalizeTarget` tylko wtedy, gdy sam rozwiązany cel dostarczenia powinien zostać zkanonizowany.
- `availability` - czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` - mapuje współdzielony model widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe natywne payloady lub działania końcowe
- `transport` - przygotowuje cele oraz wysyła/aktualizuje/usuwa natywne wiadomości zatwierdzeń
- `interactions` - opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji, plus opcjonalny hook `cancelDelivered`. Zaimplementuj `cancelDelivered`, gdy `deliverPending` rejestruje stan w procesie lub trwały (taki jak magazyn celów reakcji), aby ten stan mógł zostać zwolniony, jeśli zatrzymanie handlera anuluje dostarczanie przed uruchomieniem `bindPending` lub gdy `bindPending` nie zwróci uchwytu
- `observe` - opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów zarządzanych przez runtime, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala rdzeniowi bootstrapować handlery oparte na capability ze stanu uruchomienia kanału bez dodawania kleju wrappera specyficznego dla zatwierdzeń.
- Sięgaj po niższego poziomu `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy połączenie oparte na capability nie jest jeszcze wystarczająco ekspresywne.
- Natywne kanały zatwierdzeń muszą przekazywać przez te helpery zarówno `accountId`, jak i `approvalKind`. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` udostępnia kanałowi zachowanie zatwierdzeń exec i plugin bez zakodowanych na stałe gałęzi w rdzeniu.
- Rdzeń obsługuje teraz także powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości follow-up typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępniaj dokładne routowanie pochodzenia + DM zatwierdzającego przez współdzielone helpery capability zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem na czacie inicjującym.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia od początku do końca. Natywni klienci nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Obecne przykłady wbudowane:
  - Slack utrzymuje dostępność natywnego routingu zatwierdzeń zarówno dla identyfikatorów exec, jak i plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanału oraz UX reakcji dla zatwierdzeń exec
    i plugin, nadal pozwalając, aby uwierzytelnianie różniło się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder capability i udostępniać `approvalCapability` na pluginie.

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
zbiorczej.

Konkretnie dla setupu:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery setupu:
  `createSetupTranslator`, bezpieczne w imporcie adaptery łatek setupu (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatki wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery proxy setupu
- `openclaw/plugin-sdk/setup-runtime` zawiera świadome env połączenie adaptera dla
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery setupu opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla setupu:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje setup lub uwierzytelnianie sterowane env, a ogólne przepływy startupu/konfiguracji
powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w manifeście
pluginu za pomocą `channelEnvVars`. Zachowaj runtime kanału `envVars` lub lokalne
stałe tylko dla tekstów kierowanych do operatorów.

Jeśli Twój kanał może pojawić się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed startem runtime pluginu, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importu w ścieżkach poleceń tylko do odczytu
i powinien zwracać metadane kanału, bezpieczny dla setupu adapter konfiguracji, adapter statusu
oraz metadane celów sekretów kanału potrzebne do tych podsumowań. Nie
uruchamiaj klientów, listenerów ani runtime'ów transportu z punktu wejścia setupu.

Utrzymuj także wąską ścieżkę importu głównego wejścia kanału. Discovery może ocenić
wejście i moduł pluginu kanału, aby zarejestrować capability bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt pluginu kanału
bez importowania kreatorów setupu, klientów transportu, listenerów socketów,
launcherów podprocesów ani modułów startupu usługi. Umieść te elementy runtime
w modułach ładowanych z `registerFull(...)`, setterów runtime lub leniwych
adapterów capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszego połączenia `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów setupu/konfiguracji, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten plugin” w powierzchniach setupu, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator kończą niepowodzeniem w sposób zamknięty przy zapisach konfiguracji i finalizacji, a także ponownie używają
tego samego komunikatu wymaganego instalowania w walidacji, finalizacji i tekście linku
do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielu kont i
  fallbacku konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/channel-inbound` do trasy/koperty przychodzącej oraz
  okablowania rejestrowania i przekazywania
- `openclaw/plugin-sdk/channel-targets` do helperów parsowania celów
- `openclaw/plugin-sdk/outbound-media` do ładowania mediów oraz
  `openclaw/plugin-sdk/channel-outbound` do delegatów tożsamości/wysyłki wychodzącej
  i planowania ładunku
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować
  jawne `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisać
  pierwszeństwo, zachowanie sufiksu i normalizację identyfikatora wątku, gdy ich platforma
  ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adaptera
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy starszy układ pól
  ładunku agenta/mediów jest nadal wymagany
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji niestandardowych poleceń
  Telegram, walidacji duplikatów/konfliktów i stabilnej względem fallbacku umowy
  konfiguracji poleceń

Kanały wyłącznie uwierzytelniające zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin udostępnia tylko możliwości wychodzące/uwierzytelniania. Natywne kanały zatwierdzania, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast tworzyć własny cykl życia zatwierdzania.

## Zasady wzmiankowania przychodzącego

Zachowaj obsługę wzmianek przychodzących podzieloną na dwie warstwy:

- zbieranie dowodów należące do Pluginu
- współdzielona ocena zasad

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji dotyczących zasad wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego barrela helperów
przychodzących.

Dobre dopasowanie dla logiki lokalnej dla Pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowanego bota
- sprawdzanie udziału w wątku
- wykluczenia wiadomości usługowych/systemowych
- natywne dla platformy pamięci podręczne potrzebne do udowodnienia udziału bota

Dobre dopasowanie dla współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście poleceń
- ostateczna decyzja pominięcia

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianek.
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

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek dla
dołączonych Pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych helperów runtime
przychodzącego.

Używaj `resolveInboundMentionDecision({ facts, policy })` do bramkowania wzmianek.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Utwórz standardowe pliki Pluginu. Pole `channel` w `package.json`
    sprawia, że jest to Plugin kanału. Pełną powierzchnię metadanych pakietu
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

    `configSchema` waliduje `plugins.entries.acme-chat.config`. Używaj go do
    ustawień należących do Pluginu, które nie są konfiguracją konta kanału. `channelConfigs`
    waliduje `channels.acme-chat` i jest źródłem ścieżki zimnej używanym przez schemat
    konfiguracji, konfigurację początkową i powierzchnie UI przed załadowaniem runtime Pluginu.

  </Step>

  <Step title="Build the channel plugin object">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adaptera. Zacznij od
    minimum - `id` i `setup` - i dodawaj adaptery w miarę potrzeby.

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

    Dla kanałów, które akceptują zarówno kanoniczne klucze DM najwyższego poziomu, jak i starsze klucze zagnieżdżone, używaj helperów z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` i `normalizeChannelDmPolicy` utrzymują wartości lokalne dla konta przed odziedziczonymi wartościami głównymi. Połącz ten sam resolver z naprawą doctor przez `normalizeLegacyDmAliases`, aby runtime i migracja odczytywały tę samą umowę.

    <Accordion title="What createChatChannelPlugin does for you">
      Zamiast implementować niskopoziomowe interfejsy adapterów ręcznie, przekazujesz
      opcje deklaratywne, a builder je komponuje:

      | Opcja | Co okablowuje |
      | --- | --- |
      | `security.dm` | Zakresowy resolver zabezpieczeń DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu odpowiedzi do (stały, zakresowy dla konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz także przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania z czasu dostarczania,
      takie jak `maxLinesPerMessage`; zastosuj je przed wysyłką, aby wątkowanie odpowiedzi
      i granice fragmentów zostały rozwiązane raz przez współdzielone dostarczanie wychodzące.
      Konteksty wysyłania zawierają także `replyToIdSource` (`implicit` lub `explicit`),
      gdy natywny cel odpowiedzi został rozwiązany, dzięki czemu helpery ładunku mogą zachować
      jawne tagi odpowiedzi bez zużywania niejawnego jednorazowego miejsca odpowiedzi.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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
    podczas gdy zwykłe pełne ładowania nadal pobierają te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy wyłącznie w runtime.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu specyficznego dla pluginu. Główne przestrzenie nazw administratora (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj wpis konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas wdrażania:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje ten wpis zamiast pełnego wpisu, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i config](/pl/plugins/sdk-setup#setup-entry).

    Kanały z dołączonego obszaru roboczego, które rozdzielają bezpieczne dla konfiguracji eksporty do modułów
    pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują też
    jawnego settera runtime na czas konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym wzorcem jest Webhook, który weryfikuje żądanie i
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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy plugin kanału posiada
      własny potok przychodzący. Sprawdź dołączone pluginy kanałów
      (na przykład pakiet pluginu Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Napisz testy kolokowane w `src/channel.test.ts`:

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

    Wspólne helpery testowe opisuje [Testowanie](/pl/plugins/sdk-testing).

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
  <Card title="Opcje wątków" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, ograniczone do konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, podagent przez api.runtime
  </Card>
  <Card title="API przychodzące kanału" icon="bolt" href="/pl/plugins/sdk-channel-inbound">
    Wspólny cykl życia zdarzenia przychodzącego: pobranie, rozwiązanie, zapisanie, wysłanie, finalizacja
  </Card>
</CardGroup>

<Note>
Niektóre dołączone powierzchnie helperów nadal istnieją na potrzeby utrzymania dołączonych pluginów i
zgodności. Nie są zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne podścieżki kanału, konfiguracji, odpowiedzi i runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - jeśli Twój plugin także dostarcza modele
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) - narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) - pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
