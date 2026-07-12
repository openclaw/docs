---
read_when:
    - Projektowanie lub wdrażanie udostępniania workerów w chmurze, trybu workera lub przekazywania sesji
    - Zmiana environments.*, protokołu procesów roboczych, pozyskiwania transkrypcji lub wywołań RPC serwera proxy wnioskowania
    - Przegląd stanu zabezpieczeń zdalnego wykonywania agentów
summary: Uruchamiaj sesje agentów na efemerycznych maszynach dostępnych przez SSH, z inferencją pośredniczoną przez Gateway i strumieniowaniem na żywo w panelu bocznym.
title: Plan procesów roboczych w chmurze
x-i18n:
    generated_at: "2026-07-12T15:18:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Propozycja, wersja 3. Niezaimplementowana. Kierunek uzgodniono w 2026-07; wersja 2 uwzględniła ustalenia z przeglądu kontradyktoryjnego (dedykowany protokół workera, maszyny stanów umiejscowienia i środowiska, synchronizacja przychodząca uwzględniająca Git, jednokierunkowe przekazanie w wersji 1, sformułowania dotyczące bezpieczeństwa kontrolowanego ruchu wychodzącego). Wersja 3 rozstrzyga model własności synchronizacji (worker tworzy commity, Gateway je przejmuje i publikuje), dodaje prosty tryb synchronizacji bez Git, naprawia wykonywanie poleceń przez workera w trybie pełnym w obrębie maszyny, przenosi politykę dostępu do internetu na etap aprowizacji i przywraca delegowanie agenta do etapu 3.

## Problem

Sesje agentów OpenClaw wykonują swoją pętlę, narzędzia i inferencję wewnątrz procesu Gateway na jednej maszynie. Moc obliczeniowa jest ograniczona możliwościami tej maszyny, długie zadania ją zajmują, a równoległe operacje konkurują o jej zasoby. Usługi hostowane (agenci chmurowi Cursor, Claude Code w przeglądarce, Codex cloud) rozwiązują ten problem za pomocą efemerycznych, chmurowych piaskownic dla poszczególnych zadań, ale wymagają infrastruktury dostawcy i zaufania do niego.

Operatorzy, którzy mają już zapasowe maszyny (lub mogą je tanio wynająć), nie mają możliwości wydania polecenia: uruchom tę sesję tam, pokaż ją na moim pasku bocznym jak każdą inną sesję, a następnie usuń maszynę.

## Cele

- Uruchamianie pełnej sesji agenta (pętla + narzędzia) na efemerycznej maszynie zdalnej („worker chmurowy”), podczas gdy sesja jest widoczna i transmitowana strumieniowo w interfejsie Control UI dokładnie tak samo jak sesja lokalna.
- Brak stałych danych uwierzytelniających na workerze (bez uwierzytelniania dostawcy i tokenów platformy repozytoriów) oraz brak bezpośredniego ruchu wychodzącego z sieci; maszyna potrzebuje jedynie dostępnego serwera sshd.
- Aprowizacja, synchronizacja, uruchomienie, zebranie wyników i zniszczenie — w pełni zautomatyzowane, z wymiennymi dostawcami (pierwszy dostawca: narzędzia CLI dzierżawy w stylu Crabbox).
- Delegowanie trwającej pracy z Gateway do workera na granicy tury bez utraty transkrypcji, tożsamości sesji ani — gdy bajty żądania pozostają równoważne — powiązania z pamięcią podręczną dostawcy; bezpieczne pobieranie wyników.
- Zarówno ludzie (interfejs użytkownika), jak i agenci (narzędzie) mogą delegować pracę do workera chmurowego.
- Obsługa sesji trwających wiele dni; czas życia jest określany przez politykę, a nie zakodowany na stałe limit.

## Poza zakresem (wersja 1)

- Brak zewnętrznych środowisk programistycznych (Claude Code, Codex CLI) na workerach. Sesje workerów uruchamiają wyłącznie wbudowany moduł wykonawczy OpenClaw. Obsługa takich środowisk jest opcjonalną funkcją wersji 2, ponieważ wykonują one własną inferencję przy użyciu własnych danych uwierzytelniających.
- Brak rozgałęziania wielu prób / równoległych prób typu best-of-N.
- Brak zależności od VPN lub tailnetu. Jedynym transportem jest SSH.
- Brak nowego środowiska wykonawczego piaskownicy. Granicę izolacji stanowi maszyna workera; izolację systemową wewnątrz maszyny można dodać później jako kolejną warstwę.
- Brak symetrycznej migracji na żywo w wersji 1: delegowanie odbywa się lokalnie → worker; przejście worker → lokalnie wymaga zatrzymanej sesji i zakończonego uzgadniania przestrzeni roboczej. Dwukierunkowe przekazywanie na żywo będzie później oparte na tym samym mechanizmie barier.
- Brak dodatkowego stanu JSON po stronie Gateway; stan środowiska, umiejscowienia, kursorów i uprawnień jest przechowywany w SQLite.

## Wcześniejsze rozwiązania (co kopiujemy, a co odwracamy)

- Agenci chmurowi Cursor: pętla agenta działa w ich chmurze; maszyna wirtualna jest celem wykonywania narzędzi; magazyn konwersacji tylko do dopisywania jest transmitowany strumieniowo do wszystkich klientów; migawka po instalacji zapewnia szybki start; samodzielnie hostowane workery są procesami inicjującymi wyłącznie połączenia wychodzące. Kopiujemy model „źródło prawdy konwersacji pozostaje w orkiestratorze” oraz model transmisji strumieniowej; odwracamy umiejscowienie pętli (patrz decyzja poniżej).
- Codex cloud: dwufazowe środowisko wykonawcze — faza konfiguracji z dostępem do sieci, następnie faza agenta bez dostępu do sieci i po usunięciu sekretów; pamięć podręczna stanu kontenera przyspieszająca kolejne operacje. Kopiujemy podział na fazy jako model ruchu wychodzącego oraz koncepcję pamięci podręcznej dla ciepłych obrazów w wersji 2.
- Claude Code w przeglądarce: maszyna wirtualna dla każdej sesji; izolujący dane uwierzytelniające serwer proxy Git (rzeczywiste tokeny nigdy nie trafiają do piaskownicy, a wysyłanie zmian jest ograniczone do gałęzi sesji); migawka systemu plików po konfiguracji; przekazanie teleportacyjne = wysłana gałąź + odtworzona historia. Kopiujemy izolację danych uwierzytelniających i model przekazania, ale synchronizacja wychodząca używa rsync z Gateway, dzięki czemu obsługuje drzewa robocze z niezapisanymi zmianami, a token platformy repozytoriów nigdy nie znajduje się w pobliżu maszyny.
- Agent programistyczny Copilot: domyślna blokada ruchu wychodzącego z listą dozwolonych rejestrów pakietów. Nasze domyślne ustawienie podczas normalnej pracy jest bardziej restrykcyjne (całkowity brak bezpośredniego ruchu wychodzącego), ponieważ inferencja i wyszukiwanie w sieci docierają przez tunel SSH — jednak sekcja Bezpieczeństwo wyjaśnia, dlaczego jest to „kontrolowany ruch wychodzący”, a nie „zerowy ruch wychodzący”.

## Decyzja architektoniczna: pętla na workerze, inferencja przez Gateway

Rozważono trzy warianty umiejscowienia:

1. Pętla pozostaje w Gateway, a worker wykonuje narzędzia (model Cursor). Najbezpieczniejsza domena awarii (transkrypcja, inferencja, zatwierdzenia i odzyskiwanie po ponownym uruchomieniu pozostają lokalne) oraz preferowany przez recenzenta pierwszy etap. Odrzucono jako architekturę produktu: narzędzia OpenClaw inne niż wykonujące polecenia są wewnątrzprocesowymi operacjami na systemie plików, więc każdy odczyt, każda edycja i każde wyszukiwanie grep w pliku stają się sieciową komunikacją w obie strony albo wymagają dużej refaktoryzacji powierzchni narzędzi do postaci zgrubnych wywołań RPC przestrzeni roboczej; środowisko wykonawcze intensywnie komunikuje się małymi porcjami i jest ograniczone opóźnieniami. Wykorzystujemy ideę tego modelu tam, gdzie jest już zaimplementowana (delegowanie wykonywania poleceń do węzłów), ale nie tworzymy warstwy zdalnego wykonywania narzędzi.
2. Pętla i inferencja działają na workerze. Najprostsza domena awarii, ale dane uwierzytelniające modeli (w tym profile OAuth) muszą trafić na jednorazowe maszyny, Gateway traci kontrolę nad polityką, trasowaniem i audytem, a migracja zmienia tożsamość wywołującą dostawcę, unieważniając pamięci podręczne dostawcy.
3. Pętla + narzędzia na workerze, wywołania modelu przez serwer proxy w Gateway. Wariant wybrany. Jedna komunikacja w obie strony na turę modelu zamiast na każde wywołanie narzędzia; narzędzia działają obok kodu; Gateway pozostaje jedynym właścicielem profili uwierzytelniania, trasowania dostawców i polityki; worker nie przechowuje żadnych sekretów.

Kosztem wariantu 3 jest synchroniczna zależność od Gateway podczas każdej tury modelu, dlatego zasady trwałości tej architektury są częścią decyzji, a nie późniejszym dodatkiem:

- Utrata Gateway w trakcie tury powoduje niepowodzenie aktywnego wywołania dostawcy. Tura zostaje oznaczona jako nieudana i po ponownym połączeniu jest ponawiana jako nowa tura; trwający strumień dostawcy nie jest przezroczyście odtwarzany (ryzyko podwójnego naliczenia opłat lub podwójnego wywołania narzędzia).
- Każda operacja worker↔Gateway zawiera trwałą tożsamość (patrz Protokół workera), dzięki czemu po ponownym połączeniu operacje są wznawiane lub pobierają końcowe wyniki z pamięci podręcznej, zamiast pozostawać zawieszone.
- Gateway jest komponentem z zarządzaną przepustowością: limity równoczesnych workerów, kontrola przepływu i odrzucanie nadmiarowego obciążenia wchodzą w zakres wersji 1 (patrz Przepustowość).

Ponieważ Gateway przechowuje transkrypcję i inicjuje cały ruch do dostawców, sesja jest niezależna od lokalizacji: przenoszenie pętli między Gateway a workerem nie zmienia niczego po stronie dostawcy ani w ścieżce danych interfejsu użytkownika. To sprawia, że delegowanie i pobieranie z powrotem są tanie.

## Komponenty

### 1. Maszyna stanów środowiska + kontrakt dostawcy

`environments.*` w protokole Gateway jest obecnie jedynie projekcją stanu. Trwałym rdzeniem jest należący do SQLite rekord środowiska i maszyna stanów zaprojektowane przed kształtem RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Aprowizacja jest odporna na awarie: wiersz intencji jest utrwalany przed wywołaniem dostawcy wraz z deterministycznym identyfikatorem operacji, dzięki czemu po ponownym uruchomieniu Gateway może przejąć trwającą dzierżawę zamiast dwukrotnie aprowizować maszynę lub osierocić płatną maszynę.
- Uzgadnianie po ponownym uruchomieniu oraz mechanizm usuwania osieroconych zasobów (`inspect` dostawcy względem lokalnych rekordów) są wymaganiami wersji 1, a nie dodatkowymi zabezpieczeniami.

Kontrakt dostawcy (implementowany przez plugin; bez nazw dostawców ani polityki w rdzeniu):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → host/port/użytkownik/materiał klucza SSH
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // przejęcie/kondycja/usuwanie osieroconych zasobów
  renew?(leaseId: string): Promise<void>; // długotrwałe sesje a limity TTL dostawcy
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotentne, zwraca wynik dopiero po potwierdzeniu usunięcia
};
```

RPC: `environments.create`, `environments.destroy`, rozszerzone `environments.list/status` (dostawca, identyfikator dzierżawy, stan, wiek, czas bezczynności, dołączone sesje). Pierwsi dostawcy: opakowanie narzędzia CLI dzierżawy o strukturze Crabbox (ścieżka produktu) oraz dostawca statycznego hosta SSH oznaczony jako przeznaczony wyłącznie do programowania — worker na współdzielonym hoście może odczytać niepowiązane dane hosta, dlatego statyczne hosty służą do tworzenia funkcji, a nie jako domyślny model bezpieczeństwa.

### 2. Inicjalizacja workera: instalacja OpenClaw na maszynie

Bez specjalnego artefaktu workera i bez zależności od dostępności npm:

- Kanoniczna instalacja dla wszystkich trybów: utworzony przez Gateway pakiet workera identyfikowany skrótem zawartości (własne dane wynikowe kompilacji Gateway spakowane jako archiwum tar), przesłany przez SSH i zainstalowany na maszynie. Z definicji obsługuje to kompilacje programistyczne i nieopublikowane commity.
- `npm i -g openclaw@<exact gateway version>` jest optymalizacją, gdy Gateway działa w opublikowanej wersji; nigdy `latest`.
- Inicjalizacja jest idempotentna; ciepła dzierżawa z pasującym skrótem pakietu pomija instalację. Surowe maszyny mogą wymagać fazy instalacji zestawu narzędzi z dostępem do sieci (środowisko wykonawcze Node) — jest ona częścią fazy konfiguracji, po której dostęp zostaje zamknięty.
- Uzgadnianie weryfikuje skrót kompilacji workera, zestaw funkcji protokołu i zgodność środowiska wykonawczego. Istniejące kontrole wersji i protokołu Gateway są do tego niewystarczające (węzły tunelowane przez SSH są zwolnione z odrzucania z powodu niedokładnego dopasowania wersji), dlatego procedura dopuszczania workera przeprowadza własną kontrolę dokładnej kompilacji.

Tryb workera (`openclaw worker`) jest punktem wejścia, a nie odgałęzieniem: obsługa połączenia i wbudowany moduł wykonawczy agenta, z trwałością sesji i wywołaniami modelu obsługiwanymi przez RPC Gateway. Nie może uruchamiać powierzchni Gateway: bez kanałów, bez automatycznego uruchamiania pluginów poza zestawem narzędzi sesji, z jednorazowym katalogiem stanu i bez lokalnych profili uwierzytelniania.

### 3. Transport: wszystko przez SSH

Gateway jest właścicielem łączności; worker nie wymaga niczego poza sshd:

- Gateway otwiera połączenie SSH z workerem (dane uwierzytelniające z dzierżawy dostawcy, klucz hosta przypięty na podstawie danych wyjściowych aprowizacji — bez `StrictHostKeyChecking=no`) i ustanawia tunel zwrotny przekierowujący lokalne gniazdo workera do punktu końcowego WS Gateway.
- Ruch sterujący/modelu i transfer przestrzeni roboczej używają oddzielnych połączeń SSH z tym samym przypiętym materiałem zaufania, aby rsync nie blokował strumieni tokenów na początku kolejki.
- Cykl życia tunelu (keepalive, ponowne łączenie z rosnącym opóźnieniem) należy do środowiska wykonawczego środowiska w Gateway. Krótkotrwała przerwa w tunelu jest niewidoczna na poziomie sesji: trwały stan protokołu (poniżej) pozwala workerowi ponownie się dołączyć i wznowić pracę.

### 4. Protokół workera (dedykowany; nie protokół węzła)

Przegląd kontradyktoryjny obecnych punktów integracji węzłów wykluczył ich bezpośrednie ponowne użycie: oczekujące wywołania węzłów są obietnicami lokalnymi dla procesu, które znikają wraz z połączeniem, klucze idempotencji węzłów są analizowane, ale nie służą do deduplikacji, a co najważniejsze — połączony węzeł może emitować zwykłe zdarzenia węzła (w tym żądania uruchomienia agenta), dlatego „rodzaj węzła + ograniczenie możliwości” nie stanowi granicy bezpieczeństwa ruchu przychodzącego. Workery otrzymują zatem uwierzytelnioną rolę `worker` z zamkniętą, wersjonowaną listą dozwolonych RPC i zdarzeń; połączenia workerów nie mają dostępu do żadnych starszych procedur obsługi zdarzeń węzłów.

Tożsamość i dane uwierzytelniające: aprowizacja generuje krótkotrwałe dane uwierzytelniające workera powiązane z identyfikatorem środowiska, kluczem workera, skrótem pakietu, pojedynczą dozwoloną sesją, dozwolonym zestawem RPC i terminem ważności. Nadal obowiązuje parowanie zweryfikowane przez SSH (to my aprowizowaliśmy maszynę i posiadamy klucz), ale autoryzacja wynika z wygenerowanych danych uwierzytelniających, a nie z deklarowanej powierzchni węzła.

Semantyka trwałych operacji (struktura zapożyczona z istniejącego środowiska wykonawczego ACP i jego rejestru zdarzeń — stabilne uchwyty, serializacja dla każdej sesji, trwałe odtwarzanie `(session, seq)`):

- Każda operacja ma zakres `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Epoki własności odgradzają nieaktualne workery: worker zastępczy zwiększa epokę; spóźnione wyniki ze starej epoki są deterministycznie odrzucane.
- Dostarczanie co najmniej raz z utrwalonymi kursorami ACK i końcowymi wynikami buforowanymi w SQLite; deduplikacja jest deterministyczna. Bez gwarancji dokładnie jednokrotnego wykonania.
- Jawne ramki anulowania, zamknięcia, wznowienia i wyników końcowych; kontrola przepływu strumieni oparta na kredytach/oknach.
- Negocjowanie funkcji protokołu jest niezależne od ogólnej wersji protokołu węzła.

### 5. RPC zaplecza sesji

Dwie odrębne umowy — obecna baza kodu oddziela trwałe mutacje transkrypcji (zarządzane przez menedżera sesji, drzewo JSONL ze stanem rodzica/liścia) od lokalnych dla procesu zdarzeń na żywo (strumieniowe delty, cykl życia narzędzi, zatwierdzenia), a protokół workera musi zachować ten podział:

- Trwałe zatwierdzenia transkrypcji: worker przesyła semantyczne partie dopisywania z `runEpoch` oraz operacją compare-and-swap dla bazowego liścia; menedżer sesji Gateway generuje identyfikatory wpisów i identyfikatory rodziców. Worker nigdy nie może dostarczać zaufanych wierszy transkrypcji, identyfikatorów wpisów, identyfikatorów rodziców ani identyfikatorów obcych sesji.
- Odtwarzalne zdarzenia na żywo: typowana unia zdarzeń z numerami sekwencyjnymi workera, potwierdzeniami ACK Gateway, ograniczoną retencją i odgradzaniem spóźnionych zdarzeń, zasilająca istniejące rozsyłanie zdarzeń agenta, tak aby widok czatu, wiersze narzędzi oraz logika nieprzeczytanych elementów i statusów zachowywały się identycznie jak w sesjach lokalnych.

Proxy inferencji: ponownie wykorzystaj słownik zdarzeń istniejącego klienta strumienia proxy środowiska uruchomieniowego (`src/agents/runtime/proxy.ts`), ale przenieś granicę zaufania. Worker wysyła wyłącznie tożsamość sesji/uruchomienia, zatwierdzone odwołanie do modelu, kontekst oraz ograniczone opcje generowania; Gateway rozpoznaje dostawcę, punkt końcowy, uwierzytelnianie, nagłówki, trasowanie i zasady kosztowe na podstawie własnego katalogu. Obiekt modelu dostarczony przez workera (np. kontrolowany przez atakującego `baseUrl`) jest odrzucany. Obowiązują limity rozmiaru żądań, anulowanie, audyt i odtwarzanie wyniku końcowego. Narzędzia działające w Gateway (websearch) są wykonywane w Gateway i zwracają wyniki tym samym kanałem.

### 6. Synchronizacja przestrzeni roboczej

Punktem zakotwiczenia synchronizacji jest lokalna dla Gateway przestrzeń robocza z wyłączną własnością umiejscowienia: dla przestrzeni roboczych git jest to dedykowane zarządzane drzewo robocze (podstawę stanowią istniejące metadane zarządzanego drzewa roboczego — gałąź, baza, własność migawki); dla przestrzeni roboczych bez git jest to katalog docelowy należący do Gateway. Nigdy nie jest to aktywny katalog roboczy użytkownika. Wyłączna własność podczas zdalnego umiejscowienia sesji sprawia, że synchronizacja przychodząca jest z definicji wolna od konfliktów.

Podział odpowiedzialności — zatwierdzanie zmian a publikowanie:

- Agent po stronie workera normalnie tworzy zatwierdzenia zmian w swojej kopii (`git commit` jest operacją lokalną, niewymagającą poświadczeń; tożsamość autora jest odwzorowywana z konfiguracji Gateway). Te zatwierdzenia zmian są bezczynnymi obiektami, dopóki Gateway ich nie przyjmie.
- Gateway wykonuje wszystko, co wymaga zaufania: sprawdza, czy przychodzące zatwierdzenia zmian bazują na zapisanej podstawie, przewija lokalne drzewo robocze bez tworzenia dodatkowych zatwierdzeń, wykonuje push, tworzy PR oraz opcjonalnie podpisuje lub ponownie podpisuje — wszystko przy użyciu lokalnych poświadczeń Gateway. Worker nigdy nie przechowuje poświadczeń git ani platformy repozytorium i nigdy nie komunikuje się ze zdalnym repozytorium.

Dwa tryby synchronizacji, wybierane zależnie od tego, czy przestrzeń robocza jest repozytorium git:

- Tryb git. Wychodząco: zsynchronizuj drzewo robocze za pomocą rsync (łącznie z niezatwierdzonymi i kwalifikującymi się nieśledzonymi plikami; reguły dołączania/wykluczania w stylu crabbox, z uwzględnieniem `.worktreeinclude`) przy użyciu tożsamości SSH tunelu, zapisując wynik jako niezmienny manifest bazowy (skróty zawartości + bazowe zatwierdzenie zmian). Przychodząco: nowe zatwierdzenia zmian wracają jako pakiet git lub tymczasowe odwołanie względem zapisanej podstawy; nieśledzone artefakty wracają poprzez jawny manifest z kontrolami rozmiaru, typu i pozostawania dowiązań symbolicznych w dozwolonym zakresie. Przyjęcie weryfikuje pochodzenie od podstawy i zatrzymuje się przy rozbieżności — nic nie nadpisuje po cichu żadnej ze stron. Usunięcia, zmiany nazw, podmoduły i wyjścia dowiązań symbolicznych poza dozwolony zakres są obsługiwane przez reguły manifestu, a nie heurystyki rsync.
- Tryb zwykły (bez git — np. tworzenie projektu od podstaw na maszynie). Synchronizacja wychodząca wykorzystuje ten sam rsync i manifest bazowy. Synchronizacja przychodząca stanowi kopię lustrzaną opartą na różnicy manifestów, kierowaną z powrotem do katalogu docelowego należącego do Gateway, z propagacją usunięć. Jest bezpieczna z tego samego powodu co tryb git: wyłączna własność oznacza brak równoczesnych lokalnych zmian, które mogłyby powodować konflikty; manifest bazowy nadal wykrywa nieoczekiwane lokalne odchylenia i zatrzymuje operację zamiast nadpisywać dane.

Punkty kontrolne chronią wielodniowe sesje przed utratą dzierżawy: okresowe przychodzące punkty kontrolne (zatwierdzenia zmian na gałęzi sesji w trybie git, migawki manifestu w trybie zwykłym); częstotliwość jest zasadą profilu (domyślnie zależną od tur).

### 7. Maszyna stanów umiejscowienia, sesje i interfejs użytkownika

Umiejscowienie środowiska uruchomieniowego jest zarządzaną przez SQLite maszyną stanów powiązaną z sesją, a nie parą luźnych pól wiersza:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Utrwala identyfikator środowiska, generację przejścia, epokę aktywnego właściciela, bazowy manifest przestrzeni roboczej, skrót pakietu workera i ostatnie kursory ACK. Dopuszczenie tury atomowo przejmuje umiejscowienie, zanim którakolwiek pętla rozpocznie turę, dzięki czemu lokalna wiadomość dopuszczona na podstawie nieaktualnej migawki nigdy nie może konkurować z turą workera — w każdej chwili dokładnie jedna pętla jest właścicielem sesji.

Interfejs użytkownika:

- Sesja workera jest zwykłym wierszem sesji z dodatkowymi metadanymi umiejscowienia. Znajduje się w standardowym magazynie, jest wyświetlana przez `sessions.list` i przesyłana strumieniowo przez istniejące subskrypcje — pasek boczny i czat nie wymagają nowej ścieżki danych, a jedynie prezentacji: odznaki workera oraz statusu umiejscowienia/środowiska (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Interfejs tworzenia: pasek celu sesji (przeprojektowany pasek boczny sesji) otrzymuje miejsce docelowe workera chmurowego obok Gateway i Node. Wymaga skonfigurowanego profilu dostawcy; funkcja jest niewidoczna do czasu konfiguracji.
- Delegowanie przez agenta: narzędzie sesji pozwala agentowi przekazać pracę workerowi chmurowemu w taki sam sposób jak człowiek (podsesja obsługiwana przez workera, podobna do podagenta). Funkcja jest dostarczana w tym samym etapie co delegowanie przez człowieka i chroniona tą samą opcjonalną konfiguracją dostawcy. Rekurencja jest ograniczona strukturalnie (sesje workerów nie mogą samodzielnie delegować pracy workerom w wersji v1); kontrola wydatków odbywa się poprzez rozliczanie i audyt dla każdego środowiska, a nie mechanizmy limitów.

## Delegowanie i przekazywanie

Wersja v1 jest celowo asymetryczna:

- Lokalnie → worker (delegowanie): przejdź poniższą barierę migracji, przygotuj lub ponownie wykorzystaj workera, zsynchronizuj dane, przełącz umiejscowienie; następna tura jest wykonywana zdalnie.
- Worker → lokalnie (ściągnięcie z powrotem): zatrzymaj sesję (opróżnij workera zgodnie z tą samą barierą), zakończ uzgadnianie przychodzące, przełącz umiejscowienie na lokalne. Nie jest to migracja na żywo.
- Symetryczne przekazywanie na żywo (przenoszenie aktywnie pracującej sesji w obu kierunkach bez zatrzymywania) wykorzystuje ponownie tę samą barierę i mechanizmy uzgadniania oraz zostanie dostarczone po wykazaniu poprawności bariery przez testy wstrzykiwania błędów.

Bariera migracji (sama „granica tury” jest niewystarczająca — zatwierdzenia, procesy działające w tle i scalania transkrypcji po zwolnieniu blokady mogą ją przekraczać):

1. Zatrzymaj dopuszczanie nowych tur (przejęcie umiejscowienia).
2. Anuluj lub opróżnij aktywne uruchomienia.
3. Unieważnij oczekujące zatwierdzenia wykonania i uprawnienia do wykonywania.
4. Opróżnij poboczne zapisy transkrypcji i potwierdzenia ACK zdarzeń na żywo.
5. Zakończ procesy potomne workera.
6. Odgrodź starego właściciela, zwiększając epokę właściciela.
7. Uzgodnij przestrzeń roboczą (przychodząco, z uwzględnieniem konfliktów).
8. Aktywuj nowego właściciela.

Powinowactwo pamięci podręcznej: ponieważ żądania do dostawcy pochodzą z Gateway w obu umiejscowieniach, powinowactwo pamięci podręcznej zostaje zachowane, gdy zserializowane żądanie do dostawcy pozostaje równoważne — ta sama kolejność narzędzi, instrukcje systemowe, opakowania dostawcy i metadane pamięci podręcznej (które pozostają po stronie Gateway). Jest to właściwość możliwa do przetestowania, a nie założenie: testy równoważności bajtowej między umiejscowieniem lokalnym i workerowym dla każdego obsługiwanego transportu dostawcy są częścią etapu wprowadzającego pętlę workera.

## Model bezpieczeństwa

Precyzyjnie: worker nie ma bezpośredniego ruchu wychodzącego do sieci ani stale dostępnych poświadczeń dostawcy lub platformy repozytorium. Nie jest to „całkowity brak ruchu wychodzącego” — inferencja i narzędzia wykonywane przez Gateway są kontrolowanymi kanałami ruchu wychodzącego (worker poddany wstrzyknięciu polecenia nadal może umieścić bajty przestrzeni roboczej w kontekście modelu lub zapytaniach websearch). W związku z tym:

- Rozliczanie kontrolowanego ruchu wychodzącego: audyt dla każdego środowiska i widoczne dla operatora rozliczanie proxy inferencji oraz narzędzi Gateway. Limity szybkości/liczby bajtów istnieją jako sterowanie przepływem protokołu (przepustowość), a nie mechanizmy limitowania wydatków.
- Ruch przychodzący z workera do Gateway jest ograniczony zamkniętą listą dozwolonych operacji protokołu workera; zapisy transkrypcji są ograniczone strukturalnie (identyfikatory generowane przez Gateway, jedna powiązana sesja).
- Wykonywanie poleceń przez workera ma pełne uprawnienia wewnątrz maszyny. Maszyna jest jednorazowa i pozbawiona poświadczeń, więc zatwierdzanie każdego polecenia zwiększa utrudnienia, nie chroniąc niczego; chronioną granicą jest uzgadnianie przychodzące i audyt. Wykonywanie poleceń nigdy nie przechodzi przez ścieżkę zatwierdzania węzła Gateway.
- Zasady dostępu do internetu są decyzją dostawcy podejmowaną podczas przygotowywania: profil środowiska decyduje przy tworzeniu maszyny (zapora/grupa zabezpieczeń/sieć bez ruchu wychodzącego), opcjonalnie z sieciową fazą konfiguracji, którą dostawca zamyka przed fazą agenta. Rdzeń nie implementuje przełącznika sieciowego w czasie działania.
- Higiena maszyny podczas przygotowywania: punkt końcowy metadanych chmury jest zablokowany lub potwierdzono jego brak, brak profilu instancji, brak odziedziczonego agenta SSH, brak gniazda Docker, czyste środowisko i katalog domowy. Klucze hosta SSH są przypinane na podstawie danych wyjściowych przygotowywania.
- Zatwierdzenia i zasady dotyczące wszystkiego po stronie Gateway (push, PR, wywołania dostawcy) nadal są wykonywane w Gateway.

Zasięg szkód w przypadku przejęcia sesji workera: zsynchronizowana kopia przestrzeni roboczej oraz to, na co pozwalają audytowane kanały proxy — bez poświadczeń, bez bezpośredniego dostępu do sieci i bez dostępu do powierzchni Gateway poza listą dozwolonych operacji.

## Przepustowość

Gateway przekazuje każde polecenie i strumień tokenów dla N workerów, dlatego wersja v1 definiuje model przepustowości, zamiast odkrywać go w środowisku produkcyjnym: limity równoczesnych workerów na Gateway, okna kredytowe dla poszczególnych strumieni (obecna kolejka strumienia zdarzeń jest nieograniczona, a limit bufora gniazda Node wymusza zamknięcie połączenia z powolnymi odbiorcami — obie te właściwości w niezmienionej postaci są nieodpowiednie), ograniczone buforowanie skoków obciążenia na dysku oraz odrzucanie obciążenia z widocznymi w interfejsie użytkownika stanami przeciwciśnienia. Transfer przestrzeni roboczej pozostaje we własnym kanale SSH.

## Cykl życia

- Automatyczne zatrzymywanie przy bezczynności i TTL są zasadami profilu dostawcy, a nie stałymi wartościami. Domyślne wartości są hojne i obejmują jawne podtrzymywanie aktywności; wielodniowa praca jest pełnoprawnym przypadkiem użycia (dla backendów opartych na dzierżawie istnieje `renew` dostawcy); sesja z trwającą turą lub niedawną aktywnością nigdy nie jest odzyskiwana.
- Po śmierci lub odzyskaniu workera: umiejscowienie przechodzi do stanu `reclaimed`, wiersz sesji pozostaje, a następna wiadomość przygotowuje nowego workera i ponownie synchronizuje dane od ostatniego punktu kontrolnego. Konwersacja nigdy nie zostaje utracona (magazyn po stronie Gateway); zmiany przestrzeni roboczej od ostatniego punktu kontrolnego zostają utracone, a interfejs użytkownika informuje o tym.
- Ponowne wykorzystywanie rozgrzanej dzierżawy od pierwszego dnia (dla dostawców, którzy je obsługują); migawka obrazu po bootstrapie jest ścieżką szybkiego uruchamiania w wersji v2.

## Powierzchnia konfiguracji

Minimalna i opcjonalna: blok profilu dostawcy (identyfikator dostawcy, poświadczenia/odwołanie CLI, reguły synchronizacji, zasady czasu życia, budżety, opcjonalna faza konfiguracji) oraz wybór umiejscowienia dla każdej sesji. Bez nowych zmiennych środowiskowych. Nieskonfigurowane instalacje nie widzą tej funkcji.

## Etapy

Implementacja jest dostarczana jako małe PR-y, które można scalać niezależnie; każdy poniższy etap jest serią PR-ów, a nie pojedynczą zmianą.

1. Podstawy: maszyna stanów środowiska + umowa dostawcy + dostawca o strukturze crabbox (statyczne SSH jako środowisko deweloperskie), bootstrap pakietu workera + uzgadnianie dopuszczenia, tunel SSH + przypinanie klucza hosta, migawka zarządzanego drzewa roboczego + synchronizacja wychodząca (tryby git i zwykły). Czyszczenie osieroconych zasobów + ponowne przejęcie po restarcie.
2. Protokół workera + pętla workera: uwierzytelniona rola workera, trwałe operacje/epoki/kursory ACK, umowy zatwierdzania transkrypcji i zdarzeń na żywo, proxy inferencji z modelami rozpoznawanymi przez Gateway, sterowanie przepływem. Jeden dostawca, delegowanie nowych sesji wyłącznie przez człowieka, bez przekazywania. Testy wstrzykiwania błędów (podział tunelu, restart Gateway, śmierć workera) warunkują zakończenie etapu.
3. Delegowanie + ściąganie z powrotem + delegowanie przez agenta: bariera migracji, maszyna stanów umiejscowienia połączona z paskiem celu interfejsu użytkownika, uzgadnianie przychodzące + punkty kontrolne, audyt dla każdego środowiska, limity przepustowości, narzędzie delegowania przez agenta (sesje workerów nie mogą tworzyć rekurencji). Testy równoważności bajtowej pamięci podręcznej poleceń.
4. Symetryczne przekazywanie na żywo po potwierdzeniu przez testy wstrzykiwania błędów z etapu 3.

Później: środowiska testowe ACP na workerach jako opcjonalne nawadnianie poświadczeniami dla każdego środowiska; szybkie uruchamianie z migawki/rozgrzanego obrazu; rozdzielanie (N dzierżaw, to samo polecenie); izolowanie systemu operacyjnego wewnątrz maszyny; bogatsze przechwytywanie artefaktów za pomocą schematu artefaktów.

## Otwarte pytania

- Dostępność Pluginów/Skills na workerach: Skills przechowywane w repozytorium synchronizują się bez dodatkowych działań wraz z przestrzenią roboczą; Skills/Pluginy agentów skonfigurowane w Gateway wymagają jawnej decyzji o synchronizacji lub wykluczeniu (manifest narzędzia/Pluginu jest w obu przypadkach częścią uzgadniania dopuszczenia).
- Domyślna częstotliwość punktów kontrolnych: zależna od tur albo od czasu w przypadku bardzo intensywnych sesji czatu.
- Sposób interakcji profili środowiska z routingiem wieloagentowym (domyślne profile poszczególnych agentów a wybór wyłącznie dla poszczególnych sesji).
