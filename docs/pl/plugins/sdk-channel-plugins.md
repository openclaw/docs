---
read_when:
    - Tworzysz nowy Plugin kanału komunikacyjnego
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Trzeba zrozumieć interfejs adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia pluginu kanału komunikacyjnego dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-07-16T18:50:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik opisuje tworzenie pluginu kanału, który łączy OpenClaw z platformą
komunikacyjną: zabezpieczenia wiadomości prywatnych, parowanie, wątki odpowiedzi i wiadomości wychodzące.

<Info>
  Pierwszy kontakt z pluginami OpenClaw? Najpierw przeczytaj [Wprowadzenie](/pl/plugins/building-plugins),
  aby poznać strukturę pakietu i konfigurację manifestu.
</Info>

## Za co odpowiada plugin

Pluginy kanałów nie implementują narzędzi do wysyłania, edytowania ani reagowania; rdzeń udostępnia jedno
współdzielone narzędzie `message`. Plugin odpowiada za:

- **Konfigurację** — rozpoznawanie konta i kreator konfiguracji
- **Zabezpieczenia** — zasady wiadomości prywatnych i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania wiadomości prywatnych
- **Gramatykę sesji** — sposób mapowania identyfikatorów konwersacji specyficznych dla dostawcy na bazowe
  czaty, identyfikatory wątków i zastępcze konwersacje nadrzędne
- **Wiadomości wychodzące** — wysyłanie na platformę tekstu, multimediów i ankiet
- **Obsługę wątków** — sposób grupowania odpowiedzi w wątki
- **Wskaźnik pisania Heartbeat** — opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Rdzeń odpowiada za współdzielone narzędzie wiadomości, integrację z promptem, zewnętrzną postać klucza sesji,
ogólną ewidencję `:thread:` i wysyłanie.

## Adapter wiadomości

Udostępnij adapter `message` z `defineChannelMessageAdapter` z
`openclaw/plugin-sdk/channel-outbound`. Deklaruj wyłącznie trwałe możliwości wysyłania finalnego,
które rzeczywiście obsługuje transport natywny, wraz z testem kontraktowym
potwierdzającym natywny efekt uboczny i zwrócone potwierdzenie. Wysyłanie tekstu i multimediów
powinno używać tych samych funkcji transportowych co starszy adapter `outbound`. Pełny
kontrakt API, macierz możliwości, reguły potwierdzeń, finalizację podglądu
na żywo, zasady potwierdzania odbioru, testy i tabelę migracji opisano w
[API wiadomości wychodzących kanału](/pl/plugins/sdk-channel-outbound).

Jeśli istniejący adapter `outbound` ma już odpowiednie metody wysyłania
i metadane możliwości, utwórz adapter `message` za pomocą
`createChannelMessageAdapterFromOutbound(...)` zamiast ręcznie pisać kolejny
most. Operacje wysyłania adaptera zwracają wartości `MessageReceipt`. W przypadku starszych identyfikatorów wyznaczaj
je za pomocą `listMessageReceiptPlatformIds(...)` lub
`resolveMessageReceiptPrimaryId(...)`, zamiast utrzymywać równoległe pola `messageIds`.

Precyzyjnie deklaruj możliwości transmisji na żywo i finalizatora — rdzeń wykorzystuje je do określenia
możliwości kanału, a rozbieżność między zadeklarowanym a rzeczywistym zachowaniem oznacza
niepowodzenie testu kontraktowego:

| Powierzchnia                           | Wartości                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Kanały, które finalizują wersję roboczą podglądu w miejscu, powinny kierować logikę środowiska uruchomieniowego
przez `defineFinalizableLivePreviewAdapter(...)` oraz
`deliverWithFinalizableLivePreviewAdapter(...)`, a zadeklarowane
możliwości powinny być objęte testami `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
i `verifyChannelMessageLiveFinalizerProofs(...)`, aby zachowanie natywnego podglądu,
postępu, edycji, mechanizmu zastępczego/zachowania, czyszczenia i potwierdzeń nie mogło
niepostrzeżenie się rozbiec.

Odbiorniki przychodzące, które opóźniają potwierdzenia platformy, powinny deklarować
`message.receive.defaultAckPolicy` i `supportedAckPolicies`, zamiast ukrywać
czas potwierdzenia w lokalnym stanie monitora. Każda zadeklarowana zasada powinna być objęta
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Starsze funkcje pomocnicze odpowiedzi, takie jak `dispatchInboundReplyWithBase` i
`recordInboundSessionAndDispatchReply`, pozostają dostępne dla zgodności
z dyspozytorami. Nie używaj ich w nowym kodzie kanału; zacznij od adaptera `message`,
potwierdzeń oraz funkcji pomocniczych cyklu życia odbierania i wysyłania w
`openclaw/plugin-sdk/channel-outbound`.

### Obsługa ruchu przychodzącego (eksperymentalna)

Kanały migrujące autoryzację ruchu przychodzącego mogą używać eksperymentalnej
ścieżki podrzędnej `openclaw/plugin-sdk/channel-ingress-runtime` ze ścieżek odbierania środowiska uruchomieniowego.
Przyjmuje ona fakty platformy, surowe listy dozwolonych, deskryptory tras, fakty
poleceń i konfigurację grup dostępu, a następnie zwraca projekcje nadawcy, trasy, polecenia i aktywacji
oraz uporządkowany graf obsługi ruchu przychodzącego, podczas gdy wyszukiwanie na platformie i efekty
uboczne pozostają w pluginie. Normalizację tożsamości pluginu należy zachować w
deskryptorze przekazywanym do mechanizmu rozpoznawania; nie serializuj surowych wartości dopasowań ze
stanu wynikowego ani decyzji. Projekt API,
granice odpowiedzialności i wymagania dotyczące testów opisano w
[API obsługi ruchu przychodzącego kanału](/pl/plugins/sdk-channel-ingress).

### Wskaźniki pisania

Jeśli kanał obsługuje wskaźniki pisania poza odpowiedziami na wiadomości przychodzące, udostępnij
`heartbeat.sendTyping(...)` w pluginie kanału. Rdzeń wywołuje go z
rozpoznanym celem dostarczania Heartbeat przed rozpoczęciem przebiegu modelu Heartbeat
i używa współdzielonego cyklu podtrzymywania oraz czyszczenia wskaźnika pisania. Dodaj
`heartbeat.clearTyping(...)`, gdy platforma wymaga jawnego sygnału zatrzymania.

### Parametry źródeł multimediów

Jeśli kanał dodaje do narzędzia wiadomości parametry zawierające źródła multimediów, udostępnij
nazwy tych parametrów przez `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Rdzeń używa tej jawnej listy do normalizacji ścieżek piaskownicy i egzekwowania zasad
dostępu do multimediów wychodzących, dzięki czemu pluginy nie wymagają w współdzielonym rdzeniu specjalnych przypadków
dla specyficznych dla dostawcy parametrów awatara, załącznika lub obrazu okładki.

Preferuj mapę indeksowaną według akcji, taką jak `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
aby niepowiązane akcje nie dziedziczyły argumentów multimedialnych innej akcji. Płaska tablica
nadal działa w przypadku parametrów celowo współdzielonych przez każdą udostępnioną akcję.

Kanały, które muszą udostępnić tymczasowy publiczny adres URL na potrzeby pobierania multimediów
po stronie platformy, mogą używać `createHostedOutboundMediaStore(...)` z
`openclaw/plugin-sdk/outbound-media` wraz z magazynami stanu pluginu. Analiza tras
platformy i egzekwowanie tokenów powinny pozostać w pluginie kanału; współdzielona funkcja pomocnicza
odpowiada wyłącznie za wczytywanie multimediów, metadane wygaśnięcia, wiersze fragmentów i czyszczenie.

### Kształtowanie natywnego ładunku

Jeśli kanał wymaga kształtowania specyficznego dla dostawcy na potrzeby `message(action="send")`,
preferuj `actions.prepareSendPayload(...)`. Natywne karty, bloki, osadzenia lub
inne trwałe dane umieszczaj w `payload.channelData.<channel>`, a rdzeń powinien je wysyłać
przez adapter wiadomości wychodzących. Używaj `actions.handleAction(...)` do wysyłania
wyłącznie jako mechanizmu zgodności dla ładunków, których nie można serializować
ani wysyłać ponownie.

### Gramatyka konwersacji sesji

Jeśli platforma przechowuje dodatkowy zakres wewnątrz identyfikatorów konwersacji, zachowaj jego analizę
w pluginie za pomocą `messaging.resolveSessionConversation(...)`. Jest to
kanoniczny punkt rozszerzenia do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny
identyfikator wątku, jawne `baseConversationId` oraz dowolne
`parentConversationCandidates`. Zwracając `parentConversationCandidates`,
uporządkuj je od najwęższej konwersacji nadrzędnej do najszerszej/bazowej konwersacji.

`messaging.resolveParentConversationCandidates(...)` to przestarzały
mechanizm zgodności dla pluginów, które potrzebują wyłącznie zastępczych konwersacji nadrzędnych
opartych na ogólnym/surowym identyfikatorze. Jeśli istnieją oba punkty rozszerzeń, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny
punkt rozszerzenia ich nie zwróci.

Dołączone pluginy, które potrzebują tej samej analizy przed uruchomieniem rejestru kanałów,
mogą udostępnić plik najwyższego poziomu `session-key-api.ts` z odpowiadającym mu
eksportem `resolveSessionConversation(...)` (zobacz pluginy Feishu i Telegram).
Rdzeń używa tej powierzchni bezpiecznej podczas rozruchu tylko wtedy, gdy rejestr pluginów środowiska uruchomieniowego
nie jest jeszcze dostępny.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod pluginu musi normalizować
pola przypominające trasy, porównywać wątek podrzędny z jego trasą nadrzędną albo tworzyć
stabilny klucz deduplikacji na podstawie `{ channel, to, accountId, threadId }`. Funkcja pomocnicza
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, dlatego należy jej używać zamiast doraźnych
porównań `String(threadId)`. Pluginy z gramatyką celów specyficzną dla dostawcy
powinny udostępniać `messaging.resolveOutboundSessionRoute(...)`, aby rdzeń otrzymywał
natywną dla dostawcy tożsamość sesji i wątku bez warstw zgodności parsera.

### Obsługa powiązań konwersacji w zakresie konta

Ustaw `conversationBindings.supportsCurrentConversationBinding`, gdy kanał
obsługuje ogólne powiązania bieżącej konwersacji. `createChatChannelPlugin(...)`
domyślnie ustawia tę statyczną możliwość na `true`.

Jeśli obsługa różni się zależnie od skonfigurowanego konta, zaimplementuj również
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Rdzeń wywołuje ten synchroniczny punkt rozszerzenia dopiero po włączeniu statycznej możliwości.
Zwrócenie `false` powoduje, że ogólne operacje sprawdzania możliwości bieżącej konwersacji,
wiązania, wyszukiwania, wyświetlania listy, odświeżania i usuwania powiązania stają się niedostępne dla tego konta.
Pominięcie punktu rozszerzenia powoduje zastosowanie statycznej możliwości do każdego konta.

Odpowiedź należy wyznaczać na podstawie już wczytanej konfiguracji konta lub stanu środowiska uruchomieniowego. Ten
punkt rozszerzenia kontroluje wyłącznie ogólne powiązania bieżących konwersacji; nie zastępuje
skonfigurowanych reguł powiązań ani routingu sesji należącego do pluginu. Testy kontraktowe
powinny obejmować co najmniej jedno obsługiwane i jedno nieobsługiwane konto za pomocą
kontraktu `ChannelPlugin["conversationBindings"]` eksportowanego przez
`openclaw/plugin-sdk/channel-core`.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie wymaga kodu specyficznego dla zatwierdzeń. Rdzeń odpowiada za
`/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzania i ogólne dostarczanie zastępcze.
`ChannelPlugin.approvals` usunięto; fakty dotyczące dostarczania, natywnej obsługi, renderowania i autoryzacji zatwierdzeń
należy umieścić w jednym obiekcie `approvalCapability`. `plugin.auth` służy wyłącznie do logowania i wylogowywania
— rdzeń nie odczytuje już punktów rozszerzeń autoryzacji zatwierdzeń z tego obiektu.

Używaj `approvalCapability.delivery` wyłącznie do natywnego routingu zatwierdzeń lub wyłączania
mechanizmu zastępczego, a `approvalCapability.render` tylko wtedy, gdy kanał rzeczywiście wymaga
niestandardowych ładunków zatwierdzeń zamiast współdzielonego mechanizmu renderowania.

### Autoryzacja zatwierdzeń

- `approvalCapability.authorizeActorAction` i
  `approvalCapability.getActionAvailabilityState` są kanonicznym
  punktem rozszerzenia autoryzacji zatwierdzeń.
- Używaj `getActionAvailabilityState` do określania dostępności autoryzacji zatwierdzeń w tym samym czacie.
  Zachowaj dostępność skonfigurowanych zatwierdzających dla `/approve` nawet wtedy, gdy natywne dostarczanie
  jest wyłączone; do dostarczania i wskazówek konfiguracyjnych używaj zamiast tego stanu natywnej powierzchni inicjującej.
- Jeśli kanał udostępnia natywne zatwierdzenia wykonania, używaj
  `approvalCapability.getExecInitiatingSurfaceState` do określania
  stanu powierzchni inicjującej/natywnego klienta, gdy różni się on od autoryzacji
  zatwierdzeń w tym samym czacie. Rdzeń używa tego punktu rozszerzenia specyficznego dla wykonania, aby rozróżnić `enabled` i
  `disabled`, określić, czy kanał inicjujący obsługuje natywne zatwierdzenia wykonania,
  oraz uwzględnić kanał we wskazówkach dotyczących natywnego klienta zastępczego.
  `createApproverRestrictedNativeApprovalCapability(...)` uzupełnia tę wartość w
  typowym przypadku.
- Jeśli kanał może na podstawie istniejącej konfiguracji wywnioskować stabilne tożsamości wiadomości prywatnych podobne do właściciela,
  użyj `createResolvedApproverActionAuthAdapter` z
  `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie
  bez dodawania do rdzenia logiki specyficznej dla zatwierdzeń.
- Jeśli niestandardowa autoryzacja zatwierdzeń celowo zezwala wyłącznie na mechanizm zastępczy w tym samym czacie, zwróć
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` z
  `openclaw/plugin-sdk/approval-auth-runtime`; w przeciwnym razie rdzeń traktuje
  wynik jako jawną autoryzację zatwierdzającego.
- Jeśli natywne wywołanie zwrotne należące do kanału bezpośrednio rozstrzyga zatwierdzenia, przed rozstrzygnięciem użyj
  `isImplicitSameChatApprovalAuthorization(...)`, aby niejawny
  mechanizm zastępczy nadal przechodził przez zwykłą autoryzację aktora kanału.

### Cykl życia ładunku i wskazówki konfiguracyjne

- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub
  `outbound.beforeDeliverPayload` do zachowań cyklu życia ładunku specyficznych dla kanału,
  takich jak ukrywanie zduplikowanych lokalnych monitów o zatwierdzenie lub wysyłanie wskaźników
  pisania przed dostarczeniem.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce,
  aby odpowiedź dla wyłączonej ścieżki wyjaśniała dokładne opcje konfiguracji potrzebne do włączenia
  natywnych zatwierdzeń wykonania. Punkt rozszerzenia otrzymuje `{ channel, channelLabel, accountId }`;
  kanały z nazwanymi kontami powinny renderować ścieżki w zakresie konta, takie jak
  `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych
  wartości najwyższego poziomu.
- Używaj `approvalCapability.describePluginApprovalSetup`, gdy wskazówki dotyczące niepowodzenia
  zatwierdzenia pluginu można bezpiecznie wyświetlać w przypadku braku trasy zatwierdzenia pluginu i przekroczenia
  limitu czasu. `createApproverRestrictedNativeApprovalCapability(...)` nie
  wyznacza tego na podstawie `describeExecApprovalSetup`; przekaż tę samą funkcję pomocniczą jawnie
  tylko wtedy, gdy zatwierdzenia pluginu i wykonania rzeczywiście korzystają z tej samej konfiguracji natywnej.

### Natywne dostarczanie zatwierdzeń

Jeśli kanał wymaga natywnego dostarczania zatwierdzeń, kod kanału powinien koncentrować się na
normalizacji celu oraz faktach transportowych i prezentacyjnych. Używaj
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` i
`createApproverRestrictedNativeApprovalCapability` z
`openclaw/plugin-sdk/approval-runtime`. Fakty specyficzne dla kanału umieść za
`approvalCapability.nativeRuntime`, najlepiej za pomocą
`createChannelApprovalNativeRuntimeAdapter(...)` lub
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć
procedurę obsługi i odpowiadać za filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję
Gateway oraz powiadomienia o skierowaniu w inne miejsce.

`nativeRuntime` jest podzielony na kilka mniejszych punktów rozszerzeń:

- `availability` — czy konto jest skonfigurowane i czy żądanie
  powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na
  natywne ładunki oczekujące/rozstrzygnięte/wygasłe lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych
  komunikatów zatwierdzenia
- `interactions` — opcjonalne haki powiązania/usunięcia powiązania/czyszczenia działania dla natywnych przycisków
  lub reakcji oraz opcjonalny hak `cancelDelivered`. Należy zaimplementować
  `cancelDelivered`, gdy `deliverPending` rejestruje stan w procesie lub stan trwały
  (na przykład magazyn celów reakcji), aby można było zwolnić ten stan, jeśli
  zatrzymanie procedury obsługi anuluje dostarczenie przed uruchomieniem `bindPending`, albo gdy
  `bindPending` nie zwróci uchwytu
- `observe` — opcjonalne haki diagnostyki dostarczania

Inne funkcje pomocnicze zatwierdzania:

- Należy używać `createNativeApprovalChannelRouteGates` z
  `openclaw/plugin-sdk/approval-native-runtime`, gdy kanał obsługuje zarówno natywne dostarczanie
  pochodzące z sesji, jak i jawne cele przekazywania zatwierdzeń. Ta funkcja
  pomocnicza centralizuje wybór konfiguracji zatwierdzeń, obsługę `mode`, filtry
  agenta/sesji, powiązanie konta, dopasowanie celu sesji i dopasowanie listy celów,
  natomiast kod wywołujący nadal odpowiada za identyfikator kanału, domyślny tryb
  przekazywania, wyszukiwanie konta, sprawdzenie włączenia transportu,
  normalizację celu i ustalanie celu na podstawie źródła tury. Nie należy używać jej
  do tworzenia należących do rdzenia domyślnych zasad kanału;
  należy jawnie przekazać udokumentowany domyślny tryb kanału.
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego mechanizmu
  dopasowywania tras kanału dla celów `{ to, accountId, threadId }`. Parametr
  `targetsMatch` należy przekazywać tylko wtedy, gdy kanał ma reguły równoważności
  specyficzne dla dostawcy, takie jak dopasowywanie prefiksu znacznika czasu w Slack.
  Parametr `normalizeTargetForMatch` należy przekazać, gdy kanał musi kanonizować identyfikatory
  dostawcy przed uruchomieniem domyślnego mechanizmu dopasowywania tras lub niestandardowego
  wywołania zwrotnego `targetsMatch`, zachowując jednocześnie pierwotny cel do
  dostarczenia. `normalizeTarget` należy używać tylko wtedy, gdy kanonizacji
  powinien podlegać sam ustalony cel dostarczenia.
- Jeśli kanał potrzebuje obiektów należących do środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt
  lub odbiornik webhooka, należy je zarejestrować przez
  `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu środowiska uruchomieniowego
  pozwala rdzeniowi inicjować procedury obsługi sterowane możliwościami na podstawie stanu
  uruchomienia kanału bez dodawania kodu opakowującego specyficznego dla zatwierdzeń.
- Po funkcje niższego poziomu `createChannelApprovalHandler` lub
  `createChannelNativeApprovalRuntime` należy sięgać tylko wtedy, gdy punkt integracji sterowany
  możliwościami nie jest jeszcze wystarczająco ekspresyjny.
- Kanały natywnych zatwierdzeń muszą kierować zarówno `accountId`, jak i `approvalKind`
  przez te funkcje pomocnicze. `accountId` ogranicza zasady zatwierdzania
  dla wielu kont do właściwego konta bota, a `approvalKind` udostępnia kanałowi
  różne zachowanie zatwierdzeń exec i Plugin bez zakodowanych na stałe rozgałęzień
  w rdzeniu.
- Rdzeń odpowiada również za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać
  własnych komunikatów uzupełniających „zatwierdzenie trafiło do wiadomości prywatnych / innego kanału” z
  `createChannelNativeApprovalRuntime`; zamiast tego należy udostępnić dokładne trasowanie
  źródło + wiadomość prywatna zatwierdzającego za pomocą współdzielonych funkcji pomocniczych
  możliwości zatwierdzania i pozwolić rdzeniowi agregować rzeczywiste dostarczenia przed
  opublikowaniem jakiegokolwiek powiadomienia z powrotem na czacie inicjującym.
- Należy zachować rodzaj identyfikatora dostarczonego zatwierdzenia w całym przepływie. Klienci natywni nie powinni
  odgadywać ani przepisywać trasowania zatwierdzeń exec i Plugin na podstawie lokalnego
  stanu kanału.
- Ten jawny `approvalKind` należy przekazać do `resolveApprovalOverGateway`. Powoduje to użycie
  kanonicznej usługi `approval.resolve` i zwrócenie zarejestrowanego zwycięzcy, gdy
  inna powierzchnia odpowie jako pierwsza. Starsze jawne wejście `resolveMethod`
  pozostaje dostępne dla elementów sterujących opartych na poleceniach; nowe działania natywne nie mogą go używać ani
  wywnioskowywać rodzaju z identyfikatora.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie
  natywne. Obecne dołączone przykłady: Matrix zachowuje takie samo natywne
  trasowanie wiadomości prywatnych/kanału i środowisko reakcji dla zatwierdzeń exec i Plugin,
  jednocześnie nadal pozwalając różnicować uwierzytelnianie według rodzaju zatwierdzenia; Slack zachowuje
  natywne trasowanie zatwierdzeń dla identyfikatorów exec i Plugin.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako
  opakowanie zgodności, ale nowy kod powinien preferować konstruktor możliwości
  i udostępniać `approvalCapability` w pluginie.

### Węższe podścieżki środowiska uruchomieniowego zatwierdzeń

W często używanych punktach wejścia kanału należy preferować te węższe podścieżki zamiast szerszego
eksportu zbiorczego `approval-runtime`, gdy potrzebna jest tylko jedna część tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Podobnie należy preferować `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` i
`openclaw/plugin-sdk/reply-chunking` zamiast szerszych powierzchni zbiorczych, gdy
nie wszystkie są potrzebne.

### Podścieżki konfiguracji

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla środowiska uruchomieniowego funkcje pomocnicze konfiguracji:
  `createSetupTranslator`, bezpieczne przy imporcie adaptery poprawek konfiguracji
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), dane wyjściowe uwag wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  konstruktory proxy konfiguracji.
- `openclaw/plugin-sdk/channel-setup` obejmuje konstruktory konfiguracji
  opcjonalnej instalacji oraz kilka bezpiecznych dla konfiguracji elementów podstawowych: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` i `splitSetupEntries`.
- Szerszego punktu integracji `openclaw/plugin-sdk/setup` należy używać tylko wtedy, gdy potrzebne są również
  bardziej rozbudowane współdzielone funkcje pomocnicze konfiguracji, takie jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Jeśli kanał chce jedynie reklamować „najpierw zainstaluj ten plugin” na powierzchniach
konfiguracji, należy preferować `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator bezpiecznie odrzuca zapisy konfiguracji i finalizację, a także ponownie wykorzystuje
ten sam komunikat o wymaganej instalacji podczas walidacji, finalizacji i kopiowania
łącza do dokumentacji.

Jeśli kanał obsługuje konfigurację lub uwierzytelnianie sterowane zmiennymi środowiskowymi, a ogólne przepływy uruchamiania/konfiguracji
powinny znać nazwy tych zmiennych przed załadowaniem środowiska uruchomieniowego, należy zadeklarować je w
manifeście pluginu za pomocą `channelEnvVars`. Kanałowe `envVars` środowiska uruchomieniowego lub lokalne
stałe należy zachować wyłącznie na potrzeby tekstu przeznaczonego dla operatora.

Jeśli kanał może pojawić się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed uruchomieniem środowiska uruchomieniowego pluginu, należy dodać `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importowania w ścieżkach poleceń
tylko do odczytu i powinien zwracać metadane kanału, bezpieczny dla konfiguracji adapter
konfiguracji, adapter stanu oraz metadane celu sekretu kanału potrzebne do tych
podsumowań. Nie należy uruchamiać klientów, nasłuchiwaczy ani środowisk uruchomieniowych transportu z
punktu wejścia konfiguracji.

Należy również utrzymywać wąską główną ścieżkę importu punktu wejścia kanału. Wykrywanie może oceniać
punkt wejścia i moduł pluginu kanału, aby rejestrować możliwości bez
aktywowania kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować
obiekt pluginu kanału bez importowania kreatorów konfiguracji, klientów
transportu, nasłuchiwaczy gniazd, modułów uruchamiających podprocesy ani modułów uruchamiania usług.
Te elementy środowiska uruchomieniowego należy umieścić w modułach ładowanych z `registerFull(...)`, setterach środowiska
uruchomieniowego lub leniwych adapterach możliwości.

### Inne wąskie podścieżki kanału

W pozostałych często używanych ścieżkach kanału należy preferować wąskie funkcje pomocnicze zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` do konfiguracji wielu kont i
  powrotu do konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/channel-inbound` do okablowania trasy/koperty przychodzącej oraz
  rejestrowania i wysyłania
- `openclaw/plugin-sdk/channel-targets` do funkcji pomocniczych analizowania celu
- `openclaw/plugin-sdk/outbound-media` do ładowania multimediów oraz
  `openclaw/plugin-sdk/channel-outbound` do delegatów tożsamości/wysyłania wychodzącego
  i planowania ładunku
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować
  jawny `replyToId`/`threadId` lub odzyskać bieżącą sesję `:thread:`
  po tym, jak bazowy klucz sesji nadal jest zgodny. Pluginy dostawców mogą
  nadpisywać pierwszeństwo, zachowanie sufiksów i normalizację identyfikatora wątku, gdy
  ich platforma ma natywną semantykę dostarczania do wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` do cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy starszy układ pól
  ładunku agenta/multimediów jest nadal wymagany
- `openclaw/plugin-sdk/telegram-command-config` (przestarzałe: żaden dołączony
  plugin nie używa go w środowisku produkcyjnym) do normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów i stabilnego mimo mechanizmu zapasowego kontraktu konfiguracji
  poleceń; w nowym kodzie pluginu należy preferować lokalną obsługę konfiguracji poleceń

Kanały obsługujące wyłącznie uwierzytelnianie mogą zwykle pozostać przy ścieżce domyślnej: rdzeń obsługuje
zatwierdzenia, a plugin udostępnia jedynie możliwości wysyłania/uwierzytelniania. Kanały
natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu,
powinny korzystać ze współdzielonych natywnych funkcji pomocniczych zamiast implementować własny cykl życia
zatwierdzeń.

## Zasady obsługi wzmianek przychodzących

Obsługę wzmianek przychodzących należy rozdzielić na dwie warstwy:

- gromadzenie dowodów należące do pluginu
- ocena współdzielonych zasad

Do decyzji związanych z zasadami wzmianek należy używać `openclaw/plugin-sdk/channel-mention-gating`.
`openclaw/plugin-sdk/channel-inbound` należy używać tylko wtedy, gdy potrzebny jest szerszy
eksport zbiorczy funkcji pomocniczych danych przychodzących.

Dobre zastosowania logiki lokalnej dla pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowania bota
- sprawdzanie udziału w wątku
- wykluczanie wiadomości usługi/systemowych
- natywne pamięci podręczne platformy potrzebne do potwierdzenia udziału bota

Dobre zastosowania współdzielonej funkcji pomocniczej:

- `requireMention`
- wynik jawnej wzmianki
- lista dozwolonych niejawnych wzmianek
- pomijanie dla poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Obliczyć lokalne fakty dotyczące wzmianek.
2. Przekazać te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyć `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i
   `decision.shouldSkip` w bramie danych przychodzących.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
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

`matchesMentionWithExplicit(...)` zwraca wartość logiczną. `hasAnyMention`,
`isExplicitlyMentioned` i `canResolveExplicit` pochodzą z własnych
natywnych metadanych wzmianek kanału (encji wiadomości, flag odpowiedzi do bota i podobnych);
należy podać wartości `false`/`undefined`, gdy platforma nie może ich wykryć.

`api.runtime.channel.mentions` udostępnia te same współdzielone funkcje pomocnicze wzmianek
dla dołączonych pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Jeśli potrzebne są tylko `implicitMentionKindWhen` i `resolveInboundMentionDecision`,
należy importować je z `openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania
niepowiązanych funkcji pomocniczych środowiska uruchomieniowego danych przychodzących.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channels` w
    `openclaw.plugin.json` (a nie pole `kind`) oznacza, że manifest
    jest właścicielem kanału. Pełny zakres metadanych pakietu opisano w sekcji
    [Konfiguracja i ustawienia pluginu](/pl/plugins/sdk-setup#openclaw-channel):

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
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin kanału Acme Chat",
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
              "label": "Token bota",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` weryfikuje `plugins.entries.acme-chat.config`. Należy używać go do
    ustawień należących do pluginu, które nie są konfiguracją konta kanału.
    `channelConfigs.acme-chat.schema` weryfikuje `channels.acme-chat` i jest
    źródłem ścieżki rzadko wykonywanej, używanym przez schemat konfiguracji, konfigurator i interfejs użytkownika przed
    załadowaniem środowiska uruchomieniowego pluginu. Pełny opis pól najwyższego poziomu zawiera
    [Manifest pluginu](/pl/plugins/manifest).

  </Step>

  <Step title="Utwórz obiekt pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id`, `config` i `setup` — i dodawaj adaptery w miarę
    potrzeb.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // klient API platformy

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
      if (!token) throw new Error("acme-chat: token jest wymagany");
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
        // Rozwiązywanie i sprawdzanie kont należy do `config`, a nie do `setup`.
        // `setup` obsługuje zapisy podczas wdrażania (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
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
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Zabezpieczenia wiadomości prywatnych: kto może wysyłać wiadomości do bota
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Parowanie: przepływ zatwierdzania nowych kontaktów w wiadomościach prywatnych
      pairing: {
        text: {
          idLabel: "Nazwa użytkownika Acme Chat",
          message: "Wyślij ten kod, aby zweryfikować swoją tożsamość:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kod parowania: ${code}`);
          },
        },
      },

      // Wątki: sposób dostarczania odpowiedzi
      threading: { topLevelReplyToMode: "reply" },

      // Wiadomości wychodzące: wysyłanie wiadomości na platformę
      outbound: {
        attachedResults: {
          channel: "acme-chat",
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

    W przypadku kanałów, które akceptują zarówno kanoniczne klucze wiadomości prywatnych najwyższego poziomu, jak i starsze klucze zagnieżdżone, należy użyć funkcji pomocniczych z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` i `normalizeChannelDmPolicy` zachowują pierwszeństwo wartości lokalnych dla konta przed wartościami odziedziczonymi z poziomu głównego. Ten sam mechanizm rozstrzygania należy połączyć z naprawą wykonywaną przez narzędzie doctor za pośrednictwem `normalizeLegacyDmAliases`, aby środowisko uruchomieniowe i migracja odczytywały ten sam kontrakt.

    <Accordion title="Co zapewnia createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazuje się
      opcje deklaratywne, a konstruktor je składa:

      | Opcja | Co konfiguruje |
      | --- | --- |
      | `security.dm` | Ograniczony do zakresu mechanizm rozstrzygania zabezpieczeń wiadomości prywatnych na podstawie pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania wiadomości prywatnych z wymianą kodu |
      | `threading` | Mechanizm rozstrzygania trybu odpowiedzi (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłające, które zwracają metadane wyniku (identyfikatory wiadomości); wymagają sąsiedniego identyfikatora `channel`, aby rdzeń mógł oznaczyć zwrócony wynik dostarczenia |

      Jeśli potrzebna jest pełna kontrola, zamiast opcji deklaratywnych można również
      przekazać surowe obiekty adapterów.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalny `ctx.formatting` przenosi decyzje dotyczące formatowania w chwili dostarczania,
      takie jak `maxLinesPerMessage`; należy zastosować go przed wysłaniem, aby wątki odpowiedzi
      i granice fragmentów zostały rozstrzygnięte tylko raz przez współdzielony mechanizm dostarczania wiadomości wychodzących.
      Konteksty wysyłania zawierają również `replyToIdSource` (`implicit` lub `explicit`),
      gdy rozstrzygnięto natywny cel odpowiedzi, dzięki czemu funkcje pomocnicze ładunku mogą zachować
      jawne znaczniki odpowiedzi bez zużywania niejawnego, jednorazowego miejsca na odpowiedź.
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

    Deskryptory CLI należące do kanału należy umieścić w `registerCliMetadata(...)`, aby OpenClaw
    mógł wyświetlać je w głównej pomocy bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowanie nadal pobiera te same deskryptory w celu rzeczywistej
    rejestracji poleceń. `registerFull(...)` należy zachować do zadań wykonywanych wyłącznie w czasie działania.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, należy użyć
    prefiksu specyficznego dla pluginu. Główne przestrzenie nazw administracyjnych (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze
    są rozstrzygane do `operator.admin`. Wszystkie
    opcje opisano w sekcji [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Dodaj punkt wejścia konfiguratora">
    Utwórz `setup-entry.ts`, aby umożliwić lekkie ładowanie podczas wdrażania:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    Gdy kanał jest wyłączony lub nieskonfigurowany, OpenClaw ładuje ten punkt zamiast pełnego punktu wejścia.
    Pozwala to uniknąć ładowania ciężkiego kodu środowiska uruchomieniowego podczas procesów konfiguracji.
    Szczegółowe informacje zawiera sekcja [Konfigurator i ustawienia](/pl/plugins/sdk-setup#setup-entry).

    Kanały dołączone do obszaru roboczego, które rozdzielają bezpieczne dla konfiguratora eksporty do modułów
    towarzyszących, mogą użyć `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, jeśli potrzebują także
    jawnej funkcji ustawiającej środowisko uruchomieniowe na czas konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowym rozwiązaniem jest Webhook, który weryfikuje żądanie i
    przekazuje je przez procedurę obsługi wiadomości przychodzących kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // uwierzytelnianie zarządzane przez plugin (podpisy należy weryfikować samodzielnie)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Procedura obsługi wiadomości przychodzących przekazuje wiadomość do OpenClaw.
          // Dokładny sposób podłączenia zależy od SDK platformy —
          // rzeczywisty przykład znajduje się w dołączonym pakiecie pluginu Microsoft Teams lub Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy plugin kanału jest właścicielem
      własnego potoku wiadomości przychodzących. Rzeczywiste wzorce można znaleźć w dołączonych pluginach kanałów
      (na przykład w pakiecie pluginu Microsoft Teams lub Google Chat).
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Testy współlokowane należy zapisać w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("rozpoznaje konto z konfiguracji", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("sprawdza konto bez materializowania sekretów", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("zgłasza brak konfiguracji", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Informacje o współdzielonych pomocniczych narzędziach testowych zawiera sekcja [Testowanie](/pl/plugins/sdk-testing).

</Step>
</Steps>

## Struktura plików

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # manifest ze schematem konfiguracji
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # eksporty publiczne (opcjonalne)
├── runtime-api.ts            # wewnętrzne eksporty środowiska uruchomieniowego (opcjonalne)
└── src/
    ├── channel.ts            # ChannelPlugin za pośrednictwem createChatChannelPlugin
    ├── channel.test.ts       # testy
    ├── client.ts             # klient API platformy
    └── runtime.ts            # magazyn środowiska uruchomieniowego (w razie potrzeby)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątków" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, ograniczone do konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Narzędzia pomocnicze środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, podagent za pośrednictwem api.runtime
  </Card>
  <Card title="API wiadomości przychodzących kanału" icon="bolt" href="/pl/plugins/sdk-channel-inbound">
    Współdzielony cykl życia zdarzeń przychodzących: pozyskanie, rozpoznanie, zapisanie, przekazanie, zakończenie
  </Card>
</CardGroup>

<Note>
Niektóre wbudowane pomocnicze punkty integracji nadal istnieją na potrzeby utrzymania
wbudowanych pluginów i zgodności. Nie są zalecanym wzorcem dla nowych pluginów kanałów;
preferowane są ogólne podścieżki kanału, konfiguracji, odpowiedzi i środowiska uruchomieniowego
ze wspólnej powierzchni SDK, chyba że bezpośrednio utrzymywana jest dana rodzina wbudowanych pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli plugin udostępnia również modele
- [Omówienie SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów z podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) — pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Pluginy infrastruktury agentów](/pl/plugins/sdk-agent-harness)
