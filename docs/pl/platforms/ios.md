---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Włączanie lub rozwiązywanie problemów z bezpośrednim Node’em Apple Watch
    - Uruchamianie aplikacji iOS z kodu źródłowego
    - Debugowanie wykrywania Gateway lub poleceń canvas
summary: 'Aplikacja Node na iOS: łączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja na iOS
x-i18n:
    generated_at: "2026-07-16T18:44:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: kompilacje aplikacji na iPhone'a są dystrybuowane kanałami Apple, gdy jest to włączone dla danego wydania. Lokalne kompilacje deweloperskie można również uruchamiać ze źródeł.

## Działanie

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, zrzut ekranu, przechwytywanie obrazu z kamery, lokalizację, tryb rozmowy, aktywację głosową oraz opcjonalne podsumowania danych zdrowotnych.
- Odbiera polecenia `node.invoke` i zgłasza zdarzenia stanu węzła.
- Umożliwia przeglądanie w trybie tylko do odczytu przestrzeni roboczej wybranego agenta z poziomu widoku Agents (Files): przechodzenie w głąb katalogów, podgląd tekstu z wyróżnianiem składni, podgląd obrazów oraz eksport za pomocą arkusza udostępniania. Operacje zapisu są niedostępne, a rozmiar podglądów jest ograniczany przez Gateway.
- Przechowuje niewielką lokalną pamięć podręczną tylko do odczytu, zawierającą ostatnie sesje czatu i transkrypcje dla każdego sparowanego Gateway: po uruchomieniu od zera natychmiast wyświetlana jest ostatnia znana transkrypcja, która zostaje odświeżona po odpowiedzi Gateway; ostatnie czaty można przeglądać bez połączenia, a zresetowanie lub usunięcie sparowania czyści chronioną lokalną pamięć podręczną.
- Umieszcza wiadomości tekstowe wysłane bez połączenia w trwałej skrzynce nadawczej przypisanej do Gateway (maksymalnie 50): oczekujące dymki są widoczne w transkrypcji, po ponownym połączeniu wiadomości są wysyłane w kolejności z idempotentnymi ponowieniami, pozostają zapisane do czasu potwierdzenia wysłania przez kanoniczną historię, a przed wyświetleniem działania ponowienia lub usunięcia próby są ponawiane z wydłużającymi się odstępami. Po 48 godzinach bez połączenia wiadomości wygasają zamiast zostać wysłane; zresetowanie lub usunięcie sparowania czyści kolejkę wraz z pamięcią podręczną.
- Odczytuje wiadomości asystenta na żądanie: należy nacisnąć i przytrzymać wiadomość w czacie, a następnie wybrać **Listen**. Aplikacja odtwarza obsługiwane klipy `tts.speak` z Gateway przy użyciu skonfigurowanego dostawcy TTS, a gdy dźwięk z Gateway jest niedostępny lub nie można go odtworzyć, korzysta z syntezy mowy na urządzeniu. Odtwarzanie zatrzymuje się po zmianie sesji lub przejściu aplikacji do tła.

## Wymagania

- Gateway działający na innym urządzeniu (macOS, Linux lub Windows za pośrednictwem WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **lub**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **lub**
  - Ręcznie podany host i port (rozwiązanie awaryjne).

## Szybki start (parowanie i łączenie)

Przy pierwszym uruchomieniu aplikacja wyświetla krótkie objaśnienie parowania oraz
stronę uprawnień (powiadomienia, kamera, mikrofon, zdjęcia, kontakty,
kalendarz, przypomnienia, lokalizacja). Każde uprawnienie jest opcjonalne i można je zmienić
później w **Settings** -> **Permissions** lub w aplikacji Ustawienia systemu iOS.

1. Uruchom uwierzytelniony Gateway z trasą dostępną dla telefonu. Tailscale
   Serve jest zalecaną trasą zdalną:

```bash
openclaw gateway --port 18789 --tailscale serve
```

W zaufanej konfiguracji w tej samej sieci LAN należy zamiast tego użyć uwierzytelnionego `gateway.bind: "lan"`.
Domyślne powiązanie z adresem pętli zwrotnej jest niedostępne z telefonu. Jeśli
Gateway nie został jeszcze skonfigurowany, najpierw uruchom `openclaw onboard`, aby tworzenie
kodu konfiguracji mogło korzystać z uwierzytelniania tokenem lub hasłem.

2. Otwórz [interfejs sterowania](/pl/web/control-ui), wybierz **Nodes**, a następnie kliknij
   **Pair mobile device** na stronie **Devices**. Pełny dostęp jest zalecany
   i domyślnie zaznaczony; wybierz Limited access tylko wtedy, gdy chcesz pominąć
   administracyjne elementy sterujące Gateway, a następnie kliknij **Create setup code**.

3. W aplikacji na iOS otwórz **Settings** -> **Gateway**, zeskanuj kod QR (lub wklej
   kod konfiguracji) i nawiąż połączenie.

   Jeśli kod konfiguracji zawiera zarówno trasy LAN, jak i Tailscale Serve, aplikacja
   sprawdza je po kolei i zapisuje pierwszy dostępny punkt końcowy.

4. Oficjalna aplikacja łączy się automatycznie. Jeśli w sekcji **Pending approval** pojawi się
   żądanie, przed jego zatwierdzeniem sprawdź rolę i zakresy.

   W sekcji **Settings → Gateway** można sprawdzić, czy zapisane połączenie operatora ma
   dostęp **Full**, czy **Limited**. Konfiguracja `ws://` w zwykłym tekście w sieci LAN jest automatycznie
   ograniczana ze względu na bezpieczeństwo tokenu okaziciela. Jeśli dostęp jest ograniczony, skonfiguruj `wss://` lub
   Tailscale Serve, zeskanuj nowy kod pełnego dostępu z interfejsu sterowania lub `openclaw qr`,
   a następnie połącz się ponownie, aby włączyć ustawienia i uaktualnienia.

Przycisk w interfejsie sterowania wymaga wcześniej sparowanej sesji z `operator.admin`.
Jako rozwiązanie awaryjne w terminalu wybierz wykryty Gateway w aplikacji na iOS (lub włącz
Manual Host i wprowadź host oraz port), a następnie zatwierdź żądanie na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponowi parowanie ze zmienionymi danymi uwierzytelniającymi (rola, zakresy lub klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione i utworzony zostanie nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Opcjonalnie: jeśli węzeł iOS zawsze łączy się z ściśle kontrolowanej podsieci, można włączyć automatyczne zatwierdzanie węzła przy pierwszym połączeniu, podając jawne zakresy CIDR lub dokładne adresy IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Funkcja jest domyślnie wyłączona. Dotyczy wyłącznie nowego parowania `role: node` bez żądanych zakresów. Parowanie operatora lub przeglądarki oraz każda zmiana roli, zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

5. Sprawdź połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Podsumowania danych zdrowotnych

Węzeł iOS może zwracać opcjonalny, przeznaczony tylko do odczytu agregat HealthKit dla bieżącego
dnia kalendarzowego. Zgoda na iPhonie oraz jawna autoryzacja polecenia Gateway stanowią
niezależne zabezpieczenia. Informacje o konfiguracji, wywoływaniu, polach ładunku, ochronie prywatności
i rozwiązywaniu problemów zawiera strona [Podsumowania HealthKit](/platforms/ios-healthkit).

Domyślnie aplikacja towarzysząca na Apple Watch nadal korzysta z istniejącego przekaźnika iPhone'a i
nie wymaga osobnego parowania z Gateway. Sparuj zegarek z iPhonem w aplikacji Watch
firmy Apple, zainstaluj OpenClaw, wybierając **Watch app -> My Watch -> Available
Apps**, a następnie uruchom OpenClaw po jednym razie na obu urządzeniach.

## Przeglądanie zatwierdzeń poleceń

Połączenie operatora z `operator.admin` lub sparowane
połączenie `operator.approvals`, do którego Gateway jawnie kieruje żądanie, może przeglądać
oczekujące żądania wykonania na iPhonie. Karta zatwierdzenia pokazuje oczyszczony przez Gateway
podgląd polecenia, ostrzeżenie, kontekst hosta, czas wygaśnięcia oraz wyłącznie
decyzje oferowane przez dane żądanie. Sparowany Apple Watch otrzymuje ten sam
bezpieczny dla osoby zatwierdzającej komunikat za pośrednictwem istniejącego przekaźnika iPhone'a i oferuje ograniczony
zestaw decyzji: jednorazowe zezwolenie lub odrzucenie. Bezpośredni tryb Gateway na zegarku nie przekazuje
komunikatów o zatwierdzeniu.

Stan zatwierdzenia jest współdzielony z interfejsem sterowania i obsługiwanymi powierzchniami czatu. Obowiązuje
pierwsza zatwierdzona odpowiedź. iPhone i zegarek pobierają kanoniczny
rekord końcowy z Gateway po rozstrzygnięciu żądania w innej powierzchni, po zdalnym
powiadomieniu o rozstrzygnięciu oraz zawsze, gdy potwierdzenie rozstrzygnięcia mogło zostać
utracone. Działania pozostają niedostępne, dopóki odczyt zwrotny nie potwierdzi, czy
żądanie nadal oczekuje.

Własność zatwierdzenia jest powiązana z wybranym Gateway. Zmiana Gateway nie pozwala
zastosować starego komunikatu do nowego połączenia. Gateway starsze niż
ujednolicone metody zatwierdzania korzystają awaryjnie z dostarczonych metod właściwych dla wykonania;
zachowanie stanu końcowego oraz bogatsze wyniki między powierzchniami wymagają zaktualizowanego
Gateway.

## Opcjonalny bezpośredni węzeł Apple Watch

Tryb bezpośredni nadaje zegarkowi własną podpisaną tożsamość węzła i połączenie z Gateway.
Obsługiwane polecenia węzła nadal działają przez Wi-Fi lub sieć komórkową zegarka, gdy
OpenClaw jest aktywny, nawet jeśli sparowany iPhone jest niedostępny.

Wymagania:

- iPhone jest połączony z Gateway z zakresem `operator.admin`.
- Kod konfiguracji udostępnia punkt końcowy Gateway `wss://` z certyfikatem zaufanym
  przez watchOS; zegarek cyklicznie odpytuje odpowiadające mu źródło `https://`. Zwykły protokół HTTP oraz
  certyfikaty samopodpisane lub zaufanie oparte wyłącznie na odcisku palca nie są obsługiwane. Informacje o konfiguracji punktu końcowego zawiera strona [Parowanie zarządzane przez
  Gateway](/pl/gateway/pairing). Trasy pętli zwrotnej, dostępne tylko dla iPhone'a
  oraz dostępne wyłącznie w tailnet nie są niezależnie osiągalne przez zegarek.
- Korzystanie z sieci komórkowej wymaga Apple Watch obsługującego łączność komórkową z aktywną usługą.
- OpenClaw jest aktywny na zegarku. Apple nie zezwala zwykłym aplikacjom watchOS na
  utrzymywanie ogólnych połączeń WebSocket/TCP, dlatego bezpośredni węzeł korzysta z krótkich odpytań HTTPS
  i ponownie łączy się, gdy aplikacja wraca na pierwszy plan. Zobacz opracowane przez Apple
  [wytyczne dotyczące niskopoziomowej komunikacji sieciowej w watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Konfiguracja:

1. Na iPhonie otwórz **Settings -> Apple Watch**.
2. Stuknij **Enable Direct Gateway Connection**.
3. Otwórz OpenClaw na zegarku przed wygaśnięciem krótkotrwałego kodu konfiguracji.
4. Sprawdź osobny wiersz Apple Watch za pomocą `openclaw nodes status`.

Kod konfiguracji zawiera krótkotrwałe dane uwierzytelniające inicjowania przeznaczone wyłącznie dla węzła; do czasu wygaśnięcia należy traktować je
jak hasło. Nigdy nie zawiera zapisanego na iPhonie hasła ani tokenu
Gateway. Po sparowaniu zegarek zapisuje własny token urządzenia i
usuwa dane uwierzytelniające inicjowania. Tryb bezpośredni obejmuje wyłącznie poniższe polecenia.
Czat, tryb rozmowy, zatwierdzenia oraz istniejący przepływ powiadomień `watch.*` pozostają
funkcjami przekaźnika iPhone'a i nadal wymagają sparowanego iPhone'a.

Bezpośrednie polecenia węzła watchOS:

| Powierzchnia   | Polecenia                       | Uwagi                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Urządzenie    | `device.info`, `device.status` | Tożsamość zegarka, bateria, stan cieplny, pamięć masowa i sieć. |
| Powiadomienia | `system.notify`                | Gdy aplikacja jest aktywna; wymaga uprawnienia na zegarku.     |

watchOS nie udostępnia WebKit aplikacjom innych firm, dlatego bezpośredni węzeł zegarka
nie ogłasza poleceń Canvas.

## Powiadomienia push obsługiwane przez przekaźnik w oficjalnych kompilacjach

Oficjalnie dystrybuowane kompilacje na iOS korzystają z zewnętrznego przekaźnika powiadomień push zamiast publikować nieprzetworzony token APNs w Gateway. Oficjalne kompilacje App Store z publicznego kanału wydań korzystają z hostowanego przekaźnika pod adresem `https://ios-push-relay.openclaw.ai`; ten bazowy adres URL jest zakodowany na stałe dla dystrybucji przez App Store i nie odczytuje żadnego nadpisania.

Niestandardowe wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki kompilacji i wdrażania aplikacji na iOS, której adres URL przekaźnika odpowiada adresowi URL przekaźnika Gateway. Kanał wydań App Store nigdy nie akceptuje niestandardowego adresu URL przekaźnika. W przypadku korzystania z niestandardowej kompilacji z przekaźnikiem ustaw zgodny adres URL przekaźnika Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Działanie przepływu:

- Aplikacja na iOS rejestruje się w przekaźniku za pomocą App Attest i JWS transakcji aplikacji StoreKit.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz uprawnienie do wysyłania ograniczone do danej rejestracji.
- Aplikacja na iOS pobiera tożsamość sparowanego Gateway (`gateway.identity.get`) i uwzględnia ją podczas rejestracji w przekaźniku, dzięki czemu rejestracja obsługiwana przez przekaźnik jest delegowana do tego konkretnego Gateway.
- Aplikacja przekazuje tę rejestrację obsługiwaną przez przekaźnik do sparowanego Gateway za pomocą `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika do `push.test`, wybudzania w tle i impulsów wybudzających.
- Jeśli aplikacja połączy się później z innym Gateway lub kompilacją korzystającą z innego bazowego adresu URL przekaźnika, odświeża rejestrację w przekaźniku zamiast ponownie używać starego powiązania.

Czego Gateway **nie** potrzebuje w tej ścieżce: tokenu przekaźnika obejmującego całe wdrożenie ani bezpośredniego klucza APNs do oficjalnych wysyłek z App Store obsługiwanych przez przekaźnik.

Oczekiwany przebieg po stronie operatora:

1. Zainstaluj oficjalną aplikację na iOS.
2. Opcjonalnie: ustaw `gateway.push.apns.relay.baseUrl` w Gateway tylko w przypadku korzystania z celowo oddzielnej niestandardowej kompilacji z przekaźnikiem.
3. Sparuj aplikację z Gateway i poczekaj na zakończenie nawiązywania połączenia.
4. Aplikacja publikuje `push.apns.register`, gdy ma token APNs, sesja operatora jest połączona, a rejestracja w przekaźniku zakończy się powodzeniem.
5. Następnie `push.test`, wybudzenia przy ponownym łączeniu oraz impulsy wybudzające mogą korzystać z zapisanej rejestracji obsługiwanej przez przekaźnik.

## Sygnały aktywności w tle

Gdy system iOS wybudza aplikację wskutek cichego powiadomienia push, odświeżania w tle lub zdarzenia znacznej zmiany lokalizacji, aplikacja podejmuje krótką próbę ponownego połączenia z Node, a następnie wywołuje `node.event` z `event: "node.presence.alive"`. Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego Node/urządzenia dopiero po ustaleniu uwierzytelnionej tożsamości urządzenia Node.

Aplikacja uznaje wybudzenie w tle za pomyślnie zarejestrowane tylko wtedy, gdy odpowiedź Gateway zawiera `handled: true`. Starsze wersje Gateway mogą potwierdzać `node.event` za pomocą `{ "ok": true }`; taka odpowiedź jest zgodna, ale nie jest uznawana za trwałą aktualizację czasu ostatniej aktywności.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe zastąpienie ustawienia Gateway za pomocą zmiennej środowiskowej (`gateway.push.apns.relay.baseUrl` jest preferowaną ścieżką opartą na konfiguracji).
- Tryb powiadomień push w kompilacji wydania App Store ma na stałe zakodowany host obsługiwanego przekaźnika i nigdy nie odczytuje zastępczego adresu URL przekaźnika — zmienna środowiskowa czasu kompilacji `OPENCLAW_PUSH_RELAY_BASE_URL` wpływa tylko na lokalne/testowe tryby kompilacji iOS.

## Przepływ uwierzytelniania i zaufania

Przekaźnik istnieje, aby egzekwować dwa ograniczenia, których bezpośrednie użycie APNs przez Gateway nie może zapewnić w oficjalnych kompilacjach iOS:

- Z obsługiwanego przekaźnika mogą korzystać tylko autentyczne kompilacje OpenClaw dla systemu iOS rozpowszechniane przez Apple.
- Gateway może wysyłać powiadomienia push obsługiwane przez przekaźnik tylko do urządzeń iOS sparowanych z tym konkretnym Gateway.

Krok po kroku:

1. `iOS app -> gateway`: aplikacja paruje się z Gateway za pośrednictwem standardowego przepływu uwierzytelniania Gateway, uzyskując uwierzytelnioną sesję Node oraz uwierzytelnioną sesję operatora. Sesja operatora wywołuje `gateway.identity.get`.
2. `iOS app -> relay`: aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS, przekazując dowód App Attest oraz JWS transakcji aplikacji StoreKit. Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga oficjalnej/produkcyjnej ścieżki dystrybucji — to uniemożliwia lokalnym kompilacjom Xcode/deweloperskim korzystanie z obsługiwanego przekaźnika, ponieważ lokalna kompilacja nie może przedstawić oficjalnego dowodu dystrybucji Apple.
3. `gateway identity delegation`: przed rejestracją w przekaźniku aplikacja pobiera tożsamość sparowanego Gateway z `gateway.identity.get` i dołącza ją do ładunku rejestracyjnego przekaźnika. Przekaźnik zwraca uchwyt przekaźnika oraz uprawnienie do wysyłania o zakresie ograniczonym do rejestracji, delegowane tej tożsamości Gateway.
4. `gateway -> relay`: Gateway przechowuje uchwyt przekaźnika i uprawnienie do wysyłania z `push.apns.register`. Przy `push.test`, wybudzeniach związanych z ponownym połączeniem i sygnałach wybudzających Gateway podpisuje żądanie wysłania własną tożsamością urządzenia; przekaźnik weryfikuje zarówno zapisane uprawnienie do wysyłania, jak i podpis Gateway względem delegowanej podczas rejestracji tożsamości Gateway. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.
5. `relay -> APNs`: przekaźnik zarządza produkcyjnymi poświadczeniami APNs i nieprzetworzonym tokenem APNs dla oficjalnej kompilacji. Gateway nigdy nie przechowuje nieprzetworzonego tokenu APNs dla oficjalnych kompilacji korzystających z przekaźnika; przekaźnik wysyła końcowe powiadomienie push do APNs w imieniu sparowanego Gateway.

Cel tego projektu: przechowywanie produkcyjnych poświadczeń APNs poza Gateway użytkowników, unikanie przechowywania nieprzetworzonych tokenów APNs oficjalnych kompilacji w Gateway, zezwalanie na korzystanie z obsługiwanego przekaźnika tylko oficjalnym kompilacjom OpenClaw dla systemu iOS oraz uniemożliwianie jednemu Gateway wysyłania powiadomień push wybudzających do urządzeń iOS należących do innego Gateway.

Kompilacje lokalne/ręczne nadal korzystają bezpośrednio z APNs. Podczas testowania tych kompilacji bez przekaźnika Gateway nadal wymaga bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne środowiskowe środowiska uruchomieniowego hosta Gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko dane uwierzytelniające App Store Connect, takie jak `APP_STORE_CONNECT_KEY_ID` i `APP_STORE_CONNECT_ISSUER_ID`; nie konfiguruje bezpośredniego dostarczania przez APNs dla lokalnych kompilacji iOS.

Zalecane miejsce przechowywania na hoście Gateway, zgodne z innymi poświadczeniami dostawców w `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie należy zatwierdzać pliku `.p8` w repozytorium ani umieszczać go w katalogu roboczym repozytorium.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS wyszukuje `_openclaw-gw._tcp` w `local.` oraz, jeśli skonfigurowano, w tej samej rozległej domenie wykrywania DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`; wykrywanie między sieciami może korzystać ze skonfigurowanej rozległej domeny bez zmiany typu sygnału.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowany, należy użyć strefy DNS-SD w trybie unicast (wybrać domenę; przykład: `openclaw.internal.`) oraz podzielonego DNS Tailscale. Przykład CoreDNS znajduje się w sekcji [Bonjour](/pl/gateway/bonjour).

### Ręczny host/port

W Settings włączyć **Manual Host** i wprowadzić host oraz port Gateway (domyślnie `18789`).

## Wiele Gateway

Aplikacja przechowuje rejestr wszystkich Gateway, z którymi została sparowana, dzięki czemu można przełączać się między nimi bez ponownego parowania:

- W sekcji **Settings -> Gateway** znajduje się lista **Paired Gateways** z oznaczonym aktywnym Gateway. Aby się przełączyć, należy stuknąć pozycję; aplikacja zamknie bieżące sesje i ponownie połączy się z wybranym Gateway. Gdy sparowano więcej niż jeden Gateway, obok wiersza połączenia pojawia się menu szybkiego przełączania.
- Poświadczenia, decyzje dotyczące zaufania TLS, preferencje dla poszczególnych Gateway oraz pamięć podręczna historii czatu są przechowywane osobno dla każdego Gateway. Przełączanie nigdy nie miesza stanów różnych Gateway, a rejestracja powiadomień push jest powiązana z aktywnym Gateway.
- Aby **Forget** sparowany Gateway, należy przesunąć jego pozycję (lub użyć menu kontekstowego); spowoduje to usunięcie jego poświadczeń, tokenów urządzenia, przypięcia TLS oraz rozmów z pamięci podręcznej.
- Aby przełączyć się na wykryty Gateway, musi on być widoczny w sieci; ręcznie skonfigurowane Gateway ponownie łączą się przy użyciu zapisanego hosta i portu.

## Canvas + A2UI

Node iOS renderuje Canvas w WKWebView. Do sterowania nim służy `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host Canvas w Gateway udostępnia `/__openclaw__/canvas/` i `/__openclaw__/a2ui/` z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS zachowuje wbudowany szkielet jako domyślny widok po połączeniu. `canvas.a2ui.push` i `canvas.a2ui.reset` korzystają z dołączonej strony A2UI należącej do aplikacji.
- Zdalne strony A2UI Gateway służą w systemie iOS wyłącznie do renderowania; natywne akcje przycisków A2UI są akceptowane tylko z dołączonych stron należących do aplikacji.
- Do wbudowanego szkieletu można wrócić za pomocą `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilnym interfejsem Node, a nie backendem Codex Computer Use. Codex Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS za pomocą narzędzi MCP; aplikacja iOS udostępnia funkcje iPhone'a za pomocą poleceń Node OpenClaw, takich jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci mogą nadal obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia Node, ale wywołania te przechodzą przez protokół Node Gateway i podlegają ograniczeniom działania systemu iOS na pierwszym planie i w tle. Do sterowania lokalnym pulpitem należy użyć [Codex Computer Use](/pl/plugins/codex-computer-use), a informacje o możliwościach Node iOS znajdują się na tej stronie.

### Ewaluacja / migawka Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosowe + tryb rozmowy

- Wybudzanie głosowe i tryb rozmowy są dostępne w Settings.
- Tryb rozmowy OpenAI w czasie rzeczywistym korzysta z WebRTC zarządzanego przez klienta, gdy `talk.realtime.transport` ma wartość `webrtc`; jawna konfiguracja `gateway-relay` pozostaje zarządzana przez Gateway. Zobacz [Tryb rozmowy](/pl/nodes/talk).
- Node iOS obsługujące rozmowę ogłaszają możliwość `talk` i mogą deklarować `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`; Gateway domyślnie zezwala na te polecenia „naciśnij, aby mówić” w przypadku zaufanych Node obsługujących rozmowę.
- System iOS może wstrzymać dźwięk w tle; gdy aplikacja nie jest aktywna, funkcje głosowe należy traktować jako działające w miarę możliwości.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: należy przenieść aplikację iOS na pierwszy plan (wymagają tego polecenia Canvas/kamery/ekranu).
- `A2UI_HOST_UNAVAILABLE`: dołączona strona A2UI była niedostępna w WebView aplikacji; należy pozostawić aplikację na pierwszym planie na karcie Screen i spróbować ponownie.
- Monit o parowanie nigdy się nie pojawia: uruchomić `openclaw devices list` i zatwierdzić ręcznie.
- Watch nie pokazuje stanu iPhone'a: należy potwierdzić, że iPhone zgłasza `watchPaired: true`
  oraz `watchAppInstalled: true` w `watch.status`. Jeśli wartość parowania jest fałszywa, należy sparować
  Watch w aplikacji Watch firmy Apple. Jeśli wartość instalacji jest fałszywa, należy zainstalować aplikację towarzyszącą
  z sekcji **My Watch -> Available Apps**. Po każdej z tych zmian należy jednokrotnie otworzyć OpenClaw na
  Watch; natychmiastowa dostępność nadal wymaga działania obu aplikacji,
  natomiast aktualizacje w kolejce mogą dotrzeć później w tle.
- Ponowne połączenie nie działa po reinstalacji: token parowania w Keychain został usunięty; należy ponownie sparować Node.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
