---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Plugin kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-07-02T22:51:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez budowę Pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie zbudowano wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę pakietu
  i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reagowania. OpenClaw utrzymuje jedno
współdzielone narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfiguracja** - rozpoznawanie kont i kreator konfiguracji
- **Bezpieczeństwo** - zasady DM i listy dozwolonych
- **Parowanie** - przepływ zatwierdzania DM
- **Gramatyka sesji** - sposób mapowania identyfikatorów rozmów specyficznych dla dostawcy na czaty bazowe, identyfikatory wątków i awaryjne elementy nadrzędne
- **Wiadomości wychodzące** - wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** - sposób wątkowania odpowiedzi
- **Sygnalizowanie pisania dla Heartbeat** - opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Rdzeń odpowiada za współdzielone narzędzie wiadomości, połączenie promptów, zewnętrzny kształt klucza sesji,
ogólne prowadzenie ewidencji `:thread:` i wysyłkę.

Nowe Pluginy kanałów powinny też udostępniać adapter `message` z użyciem
`defineChannelMessageAdapter` z `openclaw/plugin-sdk/channel-outbound`. Adapter
deklaruje, które trwałe możliwości finalnego wysyłania są faktycznie obsługiwane przez transport natywny,
i kieruje wysyłanie tekstu/multimediów do tych samych funkcji transportu co
starszy adapter `outbound`. Deklaruj możliwość tylko wtedy, gdy test kontraktu
potwierdza natywny efekt uboczny i zwrócone potwierdzenie.
Pełny kontrakt API, przykłady, macierz możliwości, zasady potwierdzeń, finalizację podglądu na żywo,
zasady potwierdzeń odbioru, testy i tabelę migracji znajdziesz w
[API wiadomości wychodzących kanału](/pl/plugins/sdk-channel-outbound).
Jeśli istniejący adapter `outbound` ma już właściwe metody wysyłania i
metadane możliwości, użyj `createChannelMessageAdapterFromOutbound(...)`, aby
wyprowadzić adapter `message` zamiast ręcznie pisać kolejny most.
Wysyłki adaptera powinny zwracać wartości `MessageReceipt`. Gdy kod zgodności
nadal potrzebuje starszych identyfikatorów, wyprowadzaj je za pomocą `listMessageReceiptPlatformIds(...)`
lub `resolveMessageReceiptPrimaryId(...)` zamiast utrzymywać równoległe pola
`messageIds` w nowym kodzie cyklu życia.
Kanały obsługujące podgląd powinny też deklarować `message.live.capabilities` z
dokładnym cyklem życia live, za który odpowiadają, takim jak `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` lub
`quietFinalization`. Kanały, które finalizują podgląd wersji roboczej w miejscu, powinny
także deklarować `message.live.finalizer.capabilities`, takie jak `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` i
`retainOnAmbiguousFailure`, oraz kierować logikę runtime przez
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Utrzymuj te możliwości jako potwierdzone
testami `verifyChannelMessageLiveCapabilityAdapterProofs(...)` i
`verifyChannelMessageLiveFinalizerProofs(...)`, aby natywny podgląd,
postęp, edycja, awaryjne zachowanie/zachowanie treści, czyszczenie i potwierdzenia nie mogły po cichu się rozjechać.
Odbiorniki przychodzące, które odraczają potwierdzenia platformy, powinny deklarować
`message.receive.defaultAckPolicy` i `supportedAckPolicies` zamiast ukrywać
czas potwierdzenia w stanie lokalnym monitora. Pokryj każdą zadeklarowaną zasadę testami
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Starsze pomocniki odpowiedzi, takie jak `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` i `recordInboundSessionAndDispatchReply`,
pozostają dostępne dla dispatcherów zgodności. Nie używaj tych nazw w nowym
kodzie kanału; nowe Pluginy powinny zaczynać od adaptera `message`, potwierdzeń oraz
pomocników cyklu życia odbierania/wysyłania z `openclaw/plugin-sdk/channel-outbound`.

Kanały migrujące autoryzację przychodzącą mogą używać eksperymentalnej podścieżki
`openclaw/plugin-sdk/channel-ingress-runtime` ze ścieżek odbioru runtime.
Podścieżka utrzymuje wyszukiwanie platformy i efekty uboczne w Pluginie, jednocześnie
współdzieląc rozpoznawanie stanu listy dozwolonych, decyzje dotyczące trasy/nadawcy/polecenia/zdarzenia/aktywacji,
zredagowaną diagnostykę i mapowanie dopuszczania tur. Utrzymuj normalizację
tożsamości Pluginu w deskryptorze przekazywanym do resolvera; nie serializuj
surowych wartości dopasowania z rozpoznanego stanu ani decyzji. Zobacz
[API wejścia kanału](/pl/plugins/sdk-channel-ingress), aby poznać projekt API,
granicę własności i oczekiwania testowe.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Pluginie kanału. Rdzeń wywołuje go z
rozpoznanym celem dostarczania Heartbeat przed rozpoczęciem przebiegu modelu Heartbeat i
używa współdzielonego cyklu życia podtrzymania/czyszczenia pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości przenoszące źródła multimediów, udostępnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek sandboxa i zasad dostępu do multimediów wychodzących,
więc Pluginy nie potrzebują specjalnych przypadków w współdzielonym rdzeniu dla parametrów awatara,
załącznika ani obrazu okładki specyficznych dla dostawcy.
Preferuj zwracanie mapy kluczowanej akcjami, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów, które
są celowo współdzielone między wszystkimi ujawnionymi akcjami.
Kanały, które muszą udostępnić tymczasowy publiczny URL do pobrania multimediów po stronie platformy,
mogą użyć `createHostedOutboundMediaStore(...)` z
`openclaw/plugin-sdk/outbound-media` ze sklepami stanu Pluginu. Utrzymuj parsowanie
tras platformy i egzekwowanie tokenów w Pluginie kanału; współdzielony pomocnik
odpowiada tylko za ładowanie multimediów, metadane wygaśnięcia, wiersze fragmentów i czyszczenie.

Jeśli Twój kanał potrzebuje kształtowania specyficznego dla dostawcy dla `message(action="send")`,
preferuj `actions.prepareSendPayload(...)`. Umieszczaj natywne karty, bloki, osadzenia lub
inne trwałe dane pod `payload.channelData.<channel>` i pozwól rdzeniowi wykonać
rzeczywistą wysyłkę przez adapter outbound/message. Używaj
`actions.handleAction(...)` do wysyłania tylko jako awaryjnego rozwiązania zgodności dla
ładunków, których nie można zserializować i ponowić.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, utrzymuj to parsowanie
w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku,
jawny `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, utrzymuj je w kolejności od
najwęższego elementu nadrzędnego do najszerszej/bazowej rozmowy.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod Pluginu musi normalizować
pola podobne do tras, porównywać wątek podrzędny z jego trasą nadrzędną albo budować
stabilny klucz deduplikacji z `{ channel, to, accountId, threadId }`. Pomocnik
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, więc Pluginy powinny preferować
go zamiast doraźnych porównań `String(threadId)`.
Pluginy z gramatyką celu specyficzną dla dostawcy powinny udostępniać
`messaging.resolveOutboundSessionRoute(...)`, aby rdzeń otrzymywał natywną dla dostawcy
tożsamość sesji i wątku bez używania shimów parsera.

Bundlowane Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą także udostępnić plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr Pluginów runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starsze awaryjne rozwiązanie zgodności, gdy Plugin potrzebuje tylko awaryjnych elementów nadrzędnych na bazie
ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hook
je pomija.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Core odpowiada za `/approve` w tym samym czacie, współdzielone payloady przycisków zatwierdzania oraz ogólne dostarczanie awaryjne.
- Preferuj jeden obiekt `approvalCapability` w pluginie kanału, gdy kanał wymaga zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Fakty dotyczące dostarczania zatwierdzeń, natywności, renderowania i autoryzacji umieszczaj w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; core nie odczytuje już hooków autoryzacji zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanonicznym stykiem autoryzacji zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności autoryzacji zatwierdzeń w tym samym czacie. Zachowaj skonfigurowanych zatwierdzających jako dostępnych dla `/approve` nawet wtedy, gdy natywne dostarczanie jest wyłączone; zamiast tego używaj stanu natywnej powierzchni inicjującej do wskazówek dotyczących dostarczania/konfiguracji.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia wykonywania, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od autoryzacji zatwierdzeń w tym samym czacie. Core używa tego hooka specyficznego dla wykonywania, aby rozróżnić `enabled` i `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia wykonywania, oraz uwzględnić kanał we wskazówkach awaryjnych dla natywnego klienta. `createApproverRestrictedNativeApprovalCapability(...)` uzupełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla specyficznego dla kanału zachowania cyklu życia payloadu, takiego jak ukrywanie zduplikowanych lokalnych monitów zatwierdzenia lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia fallbacku.
- Używaj `approvalCapability.nativeRuntime` dla należących do kanału faktów natywnych zatwierdzeń. Utrzymuj go leniwym w gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, jednocześnie nadal pozwalając core złożyć cykl życia zatwierdzenia.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych payloadów zatwierdzania zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź ścieżki wyłączonej wyjaśniała dokładne przełączniki konfiguracji potrzebne do włączenia natywnych zatwierdzeń wykonywania. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Używaj `approvalCapability.describePluginApprovalSetup`, gdy wskazówki dotyczące awarii zatwierdzenia pluginu można bezpiecznie pokazać przy braku trasy zatwierdzenia pluginu i awariach timeoutu. `createApproverRestrictedNativeApprovalCapability(...)` nie wywodzi tego z `describeExecApprovalSetup`; przekaż ten sam helper jawnie tylko wtedy, gdy zatwierdzenia pluginu i wykonywania naprawdę używają tej samej natywnej konfiguracji.
- Jeśli kanał może wywnioskować stabilne, podobne do właściciela tożsamości DM z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń w core.
- Jeśli niestandardowa autoryzacja zatwierdzeń celowo pozwala tylko na fallback w tym samym czacie, zwróć `markImplicitSameChatApprovalAuthorization({ authorized: true })` z `openclaw/plugin-sdk/approval-auth-runtime`; w przeciwnym razie core traktuje wynik jako jawną autoryzację zatwierdzającego.
- Jeśli należące do kanału natywne callbacki rozwiązują zatwierdzenia bezpośrednio, użyj `isImplicitSameChatApprovalAuthorization(...)` przed rozwiązaniem, aby niejawny fallback nadal przechodził przez normalną autoryzację aktora kanału.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skoncentrowany na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby core mogło złożyć handler i odpowiadać za filtrowanie żądań, routing, deduplikację, wygaśnięcie, subskrypcję Gateway oraz powiadomienia o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielony na kilka mniejszych styków:
- Użyj `createNativeApprovalChannelRouteGates` z `openclaw/plugin-sdk/approval-native-runtime`, gdy kanał obsługuje zarówno natywne dostarczanie z pochodzenia sesji, jak i jawne cele przekazywania zatwierdzeń. Helper centralizuje wybór konfiguracji zatwierdzania, obsługę `mode`, filtry agenta/sesji, wiązanie konta, dopasowywanie celu sesji oraz dopasowywanie listy celów, podczas gdy wywołujący nadal odpowiadają za id kanału, domyślny tryb przekazywania, lookup konta, sprawdzanie włączenia transportu, normalizację celu i rozwiązywanie celu źródła tury. Nie używaj go do tworzenia należących do core domyślnych polityk kanału; przekaż jawnie udokumentowany domyślny tryb kanału.
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego matchera tras kanału dla celów `{ to, accountId, threadId }`. Przekaż `targetsMatch` tylko wtedy, gdy kanał ma specyficzne dla dostawcy reguły równoważności, takie jak dopasowywanie prefiksu znacznika czasu Slack.
- Przekaż `normalizeTargetForMatch` do `createChannelNativeOriginTargetResolver`, gdy kanał musi skanonizować id dostawcy przed uruchomieniem domyślnego matchera tras lub niestandardowego callbacka `targetsMatch`, zachowując oryginalny cel do dostarczenia. Użyj `normalizeTarget` tylko wtedy, gdy sam rozwiązany cel dostarczenia powinien zostać skanonizowany.
- `availability` - czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` - mapuje współdzielony model widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe natywne payloady lub końcowe akcje
- `transport` - przygotowuje cele oraz wysyła/aktualizuje/usuwa natywne wiadomości zatwierdzeń
- `interactions` - opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji oraz opcjonalny hook `cancelDelivered`. Zaimplementuj `cancelDelivered`, gdy `deliverPending` rejestruje stan w procesie lub trwały stan (taki jak magazyn celów reakcji), aby ten stan mógł zostać zwolniony, jeśli zatrzymanie handlera anuluje dostarczanie przed uruchomieniem `bindPending` albo gdy `bindPending` nie zwróci uchwytu
- `observe` - opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik webhooków, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala core bootstrapować handlery sterowane capability ze stanu startowego kanału bez dodawania specyficznego dla zatwierdzeń kleju wrapperów.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy styk sterowany capability nie jest jeszcze wystarczająco ekspresyjny.
- Natywne kanały zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzania dla wielu kont ograniczoną do właściwego konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń wykonywania i pluginu dostępne dla kanału bez zakodowanych na sztywno gałęzi w core.
- Core odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości następczych typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij dokładne routowanie pochodzenia + DM zatwierdzającego przez współdzielone helpery capability zatwierdzeń i pozwól core zagregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowaj rodzaj dostarczonego id zatwierdzenia od końca do końca. Natywni klienci nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń wykonywania względem pluginu na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne natywne powierzchnie.
  Aktualne przykłady w pakiecie:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla id wykonywania, jak i pluginu.
  - Matrix utrzymuje ten sam natywny routing DM/kanału oraz UX reakcji dla zatwierdzeń wykonywania
    i pluginu, nadal pozwalając, aby autoryzacja różniła się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper kompatybilności, ale nowy kod powinien preferować builder capability i udostępniać `approvalCapability` w pluginie.

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
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni parasolowej.

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery konfiguracji:
  `createSetupTranslator`, bezpieczne importowo adaptery łatek konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatki lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery proxy konfiguracji
- `openclaw/plugin-sdk/setup-runtime` obejmuje styk adaptera świadomego env dla
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji
  oraz kilka bezpiecznych dla konfiguracji prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub autoryzację sterowaną env i ogólne
przepływy startu/konfiguracji powinny znać te nazwy env przed załadowaniem runtime, zadeklaruj je w
manifeście pluginu za pomocą `channelEnvVars`. Zachowaj `envVars` runtime kanału lub lokalne
stałe tylko dla treści skierowanych do operatora.

Jeśli Twój kanał może pojawić się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed startem runtime pluginu, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importu w ścieżkach poleceń tylko do odczytu
i powinien zwracać metadane kanału, bezpieczny dla konfiguracji adapter konfiguracji, adapter statusu
oraz metadane celu sekretów kanału potrzebne do tych podsumowań. Nie uruchamiaj
klientów, listenerów ani runtime'ów transportu z punktu wejścia konfiguracji.

Zachowaj także wąską główną ścieżkę importu kanału. Discovery może ocenić
punkt wejścia i moduł pluginu kanału, aby zarejestrować capabilities bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt pluginu kanału
bez importowania kreatorów konfiguracji, klientów transportu, listenerów socketów,
launcherów podprocesów ani modułów startu usług. Umieść te części runtime
w modułach ładowanych z `registerFull(...)`, setterów runtime lub leniwych
adapterów capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszego styku `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych współdzielonych helperów konfiguracji/config, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten plugin” w powierzchniach
konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator fail-closed przy zapisach konfiguracji i finalizacji, a także ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i treści linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielu kont i
  mechanizmu awaryjnego konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/channel-inbound` do przychodzącej trasy/koperty oraz
  połączenia rejestrowania i przekazywania
- `openclaw/plugin-sdk/channel-targets` do pomocników parsowania celów
- `openclaw/plugin-sdk/outbound-media` do wczytywania mediów oraz
  `openclaw/plugin-sdk/channel-outbound` do delegatów tożsamości/wysyłania wychodzącego
  i planowania ładunku
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować
  jawny `replyToId`/`threadId` albo odzyskać bieżącą sesję `:thread:`
  po tym, jak podstawowy klucz sesji nadal pasuje. Pluginy dostawców mogą nadpisać
  priorytet, zachowanie sufiksu i normalizację identyfikatora wątku, gdy ich platforma
  ma natywną semantykę dostarczania wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agenta/mediów
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji niestandardowych poleceń
  Telegram, walidacji duplikatów/konfliktów oraz stabilnej awaryjnie umowy konfiguracji
  poleceń

Kanały tylko do uwierzytelniania zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin udostępnia tylko możliwości wychodzące/uwierzytelniania. Natywne kanały zatwierdzania, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych pomocników zamiast implementować własny cykl życia zatwierdzania.

## Zasady wzmianek przychodzących

Obsługę wzmianek przychodzących rozdziel na dwie warstwy:

- zbieranie dowodów należące do Pluginu
- ocena współdzielonych zasad

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji zasad wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego
barrela pomocników przychodzących.

Dobre zastosowania dla logiki lokalnej Pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowanego bota
- sprawdzanie udziału w wątku
- wykluczenia komunikatów usługowych/systemowych
- natywne pamięci podręczne platformy potrzebne do udowodnienia udziału bota

Dobre zastosowania dla współdzielonego pomocnika:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych wzmianek niejawnych
- obejście poleceniem
- końcowa decyzja pominięcia

Preferowany przepływ:

1. Oblicz lokalne fakty wzmianki.
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
dołączonych Pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niepowiązanych pomocników
przychodzącego środowiska uruchomieniowego.

Używaj `resolveInboundMentionDecision({ facts, policy })` do bramkowania wzmianek.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
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
    konfiguracji, konfigurację początkową i powierzchnie UI przed załadowaniem środowiska uruchomieniowego Pluginu.

  </Step>

  <Step title="Zbuduj obiekt Pluginu kanału">
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

    W przypadku kanałów, które akceptują zarówno kanoniczne klucze wiadomości bezpośrednich najwyższego poziomu, jak i starsze klucze zagnieżdżone, użyj pomocników z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` i `normalizeChannelDmPolicy` utrzymują wartości lokalne dla konta przed odziedziczonymi wartościami głównymi. Połącz ten sam resolver z naprawą przez doctor za pomocą `normalizeLegacyDmAliases`, aby środowisko uruchomieniowe i migracja odczytywały tę samą umowę.

    <Accordion title="Co createChatChannelPlugin robi za Ciebie">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      deklaratywne opcje, a kreator je składa:

      | Opcja | Co łączy |
      | --- | --- |
      | `security.dm` | Ograniczony do zakresu resolver zabezpieczeń wiadomości bezpośrednich z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania wiadomości bezpośrednich z wymianą kodu |
      | `threading` | Resolver trybu odpowiedzi (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania z czasu dostarczania,
      takie jak `maxLinesPerMessage`; zastosuj je przed wysłaniem, aby wątkowanie odpowiedzi
      i granice fragmentów były rozstrzygane raz przez współdzielone dostarczanie wychodzące.
      Konteksty wysyłania zawierają też `replyToIdSource` (`implicit` albo `explicit`),
      gdy rozstrzygnięto natywny cel odpowiedzi, dzięki czemu pomocniki ładunku mogą zachować
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

    Umieść należące do kanału deskryptory CLI w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w głównej pomocy bez aktywowania pełnego runtime kanału,
    podczas gdy normalne pełne ładowanie nadal pobiera te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy dotyczącej wyłącznie runtime.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu specyficznego dla Pluginu. Główne przestrzenie nazw administracyjnych (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj wpis konfiguracji">
    Utwórz `setup-entry.ts` na potrzeby lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje ten wpis zamiast pełnego wpisu, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

    Dołączone kanały workspace, które wydzielają bezpieczne dla konfiguracji eksporty do modułów
    towarzyszących, mogą użyć `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują też
    jawnego settera runtime w czasie konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je przez przychodzący handler Twojego kanału:

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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału posiada
      własny pipeline przychodzący. Sprawdź dołączone Pluginy kanałów
      (na przykład pakiet Pluginu Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
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

    Wspólne helpery testowe opisano w [Testowanie](/pl/plugins/sdk-testing).

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
    Tryby odpowiedzi stałe, zakresowane do konta lub niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, subagent przez api.runtime
  </Card>
  <Card title="API przychodzące kanału" icon="bolt" href="/pl/plugins/sdk-channel-inbound">
    Wspólny cykl życia zdarzenia przychodzącego: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Niektóre dołączone punkty rozszerzeń helperów nadal istnieją na potrzeby utrzymania dołączonych Pluginów
i zgodności. Nie są zalecanym wzorcem dla nowych Pluginów kanałów;
preferuj ogólne podścieżki kanału/konfiguracji/odpowiedzi/runtime ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - jeśli Twój Plugin również dostarcza modele
- [Przegląd SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) - narzędzia testowe i testy kontraktów
- [Manifest Pluginu](/pl/plugins/manifest) - pełny schemat manifestu

## Powiązane

- [Konfiguracja SDK Pluginu](/pl/plugins/sdk-setup)
- [Budowanie Pluginów](/pl/plugins/building-plugins)
- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
