---
read_when:
    - Implementowanie zatwierdzania parowania Node bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu Gateway o zarządzanie węzłami
summary: 'Zatwierdzanie uprawnień Node: jak Node uzyskują możliwość udostępniania poleceń po sparowaniu urządzenia'
title: Parowanie Node
x-i18n:
    generated_at: "2026-07-12T15:11:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Parowanie Node ma dwie warstwy, obie przechowywane w rekordzie sparowanego urządzenia w bazie danych stanu SQLite Gateway:

- **Parowanie urządzenia** (rola `node`) kontroluje uzgadnianie `connect`. Zobacz
  [Automatyczne zatwierdzanie urządzeń z zaufanych CIDR](#trusted-cidr-device-auto-approval)
  poniżej oraz [Parowanie kanałów](/pl/channels/pairing).
- **Zatwierdzanie możliwości Node** (`node.pair.*`) kontroluje, które zadeklarowane
  możliwości/polecenia może udostępniać połączony Node. Gateway jest
  źródłem prawdy; interfejsy użytkownika (aplikacja macOS, Control UI) służą do zatwierdzania lub
  odrzucania oczekujących żądań.

Dawny, niezależny magazyn parowania Node (`nodes/paired.json` z tokenem
dla każdego Node, wycofany ze ścieżki łączenia w styczniu 2026 roku) już nie istnieje: podczas uruchamiania Gateway
jednorazowo przenosi wszystkie pozostałe wpisy do rekordów urządzeń i archiwizuje
starsze pliki z przyrostkiem `.migrated`. Obsługa starszego mostu TCP została
usunięta.

## Jak działa zatwierdzanie możliwości

1. Node łączy się z WS Gateway (ten etap jest kontrolowany przez parowanie urządzenia).
2. Gateway porównuje zadeklarowany zestaw możliwości/poleceń z
   zatwierdzonym zestawem; nowe lub rozszerzone zestawy zapisują **oczekujące żądanie** w
   rekordzie urządzenia i emitują `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (za pomocą CLI albo interfejsu użytkownika).
4. Do czasu zatwierdzenia polecenia Node pozostają filtrowane; zatwierdzenie udostępnia zadeklarowany
   zestaw z uwzględnieniem standardowej polityki poleceń.

Oczekujące żądania automatycznie wygasają **5 minut po ostatniej
ponownej próbie Node** — aktywnie ponownie łączący się Node utrzymuje swoje jedno oczekujące żądanie
zamiast generować nowe żądanie (i monit o zatwierdzenie) przy każdej próbie.

## Przepływ pracy CLI (odpowiedni dla środowisk bez interfejsu graficznego)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` wyświetla sparowane/połączone Node oraz ich możliwości.

## Powierzchnia API (protokół Gateway)

Zdarzenia:

- `node.pair.requested` — emitowane po utworzeniu nowego oczekującego żądania.
- `node.pair.resolved` — emitowane po zatwierdzeniu, odrzuceniu lub
  wygaśnięciu żądania.

Metody:

- `node.pair.list` — wyświetla oczekujące i sparowane Node (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie.
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.remove` — usuwa sparowany Node. Powoduje to odebranie roli `node`
  urządzenia w magazynie sparowanych urządzeń, usunięcie wraz z nią zatwierdzonego zestawu Node oraz
  unieważnienie/rozłączenie sesji tego urządzenia z rolą Node. Urządzenie z **wieloma rolami**
  (na przykład mające również rolę `operator`) zachowuje swój rekord i traci jedynie
  rolę `node`; rekord urządzenia mającego wyłącznie rolę Node zostaje usunięty. Autoryzacja:
  `operator.pairing` może usuwać rekordy Node bez roli operatora; wywołujący używający tokenu urządzenia,
  który odbiera **własną** rolę Node na urządzeniu z wieloma rolami, dodatkowo potrzebuje
  `operator.admin`.
- `node.rename` — zmienia nazwę wyświetlaną sparowanego Node widoczną dla operatora.

Usunięto w wersji 2026.7: `node.pair.request` oraz `node.pair.verify`. Oczekujące
żądania są tworzone przez sam Gateway podczas łączenia Node, a
niezależny token dla każdego Node, który obsługiwały te metody, już nie istnieje; uwierzytelnianie Node korzysta z
tokenu parowania urządzenia.

Uwagi:

- Ponowne połączenia z niezmienionym zestawem ponownie wykorzystują oczekujące żądanie; kolejne
  żądania odświeżają przechowywane metadane Node i najnowszy dozwolony
  obraz zadeklarowanych poleceń, aby był widoczny dla operatora.
- Poziomy zakresu operatora i kontrole wykonywane podczas zatwierdzania podsumowano w
  [Zakresach operatora](/pl/gateway/operator-scopes).
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż wykonawcze: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Zatwierdzenie parowania Node zapisuje zaufany zestaw możliwości. **Nie** przypina bieżącego zestawu poleceń Node osobno dla każdego Node.

- Bieżące polecenia Node pochodzą z deklaracji Node podczas łączenia i są filtrowane przez
  globalną politykę poleceń Node w Gateway (`gateway.nodes.allowCommands` i
  `denyCommands`).
- Polityka zezwoleń i pytań dla `system.run` dotycząca konkretnego Node znajduje się na tym Node w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Kontrolowanie poleceń Node (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecznie:** od wersji `2026.3.31` polecenia Node są wyłączone do czasu zatwierdzenia parowania Node. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń Node.
</Warning>

Gdy Node łączy się po raz pierwszy, żądanie parowania jest tworzone automatycznie.
Do czasu zatwierdzenia tego żądania wszystkie oczekujące polecenia Node pochodzące z tego Node są
filtrowane i nie zostaną wykonane. Po zatwierdzeniu parowania zadeklarowane przez Node
polecenia stają się dostępne z uwzględnieniem standardowej polityki poleceń.

Oznacza to, że:

- Node, które wcześniej polegały wyłącznie na parowaniu urządzenia w celu udostępniania poleceń, muszą
  teraz również ukończyć parowanie Node.
- Polecenia umieszczone w kolejce przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń Node (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecznie:** uruchomienia inicjowane przez Node pozostają teraz w ograniczonym zaufanym obszarze.
</Warning>

Podsumowania pochodzące z Node i powiązane zdarzenia sesji są ograniczone do
zamierzonego zaufanego obszaru. Przepływy sterowane powiadomieniami lub wyzwalane przez Node, które
wcześniej polegały na szerszym dostępie do narzędzi hosta albo sesji, mogą wymagać dostosowania.
To wzmocnienie zabezpieczeń zapobiega eskalowaniu zdarzeń Node do dostępu do narzędzi na poziomie hosta
wykraczającego poza granicę zaufania dozwoloną dla danego Node.

Trwałe aktualizacje obecności Node podlegają tej samej granicy tożsamości: zdarzenie
`node.presence.alive` jest akceptowane wyłącznie z uwierzytelnionych sesji urządzeń Node
i aktualizuje metadane parowania tylko wtedy, gdy tożsamość urządzenia/Node
jest już sparowana. Samodzielnie zadeklarowana wartość `client.id` nie wystarcza do zapisania
stanu ostatniej aktywności.

## Automatyczne zatwierdzanie urządzeń zweryfikowanych przez SSH (domyślnie)

Pierwsze parowanie urządzenia z `role: node` z adresu prywatnego/CGNAT jest
automatycznie zatwierdzane, gdy Gateway może **potwierdzić własność maszyny przez SSH**:
łączy się zwrotnie z hostem parującym (`BatchMode`, `StrictHostKeyChecking=yes`),
uruchamia tam `openclaw node identity --json` i zatwierdza tylko wtedy, gdy identyfikator zdalnego
urządzenia oraz klucz publiczny dokładnie odpowiadają oczekującemu żądaniu. Dopasowanie klucza
zapewnia bezpieczeństwo: sama osiągalność nigdy nie powoduje zatwierdzenia, więc współużytkownicy NAT,
inni użytkownicy współdzielonego hosta i fałszowanie w sieci LAN przechodzą do standardowego
monitu.

Funkcja jest domyślnie włączona. Wymagania konieczne do jej uruchomienia:

- Użytkownik procesu Gateway (lub `sshVerify.user`) może łączyć się przez SSH z hostem Node
  nieinteraktywnie (klucze/agent; działa również Tailscale SSH), a klucz hosta jest
  już zaufany.
- Polecenie `openclaw` jest dostępne w zdalnej zmiennej `PATH` dla nieinteraktywnego `sh -lc`.
- Łączący się adres IP jest bezpośrednim (bez serwera proxy i bez local loopback) adresem prywatnym, ULA,
  lokalnym dla łącza lub CGNAT albo pasuje do `sshVerify.cidrs`, jeśli je ustawiono.
- Obowiązuje ten sam minimalny poziom kwalifikacji co w przypadku zatwierdzania z zaufanych CIDR: tylko nowe parowanie
  Node bez zakresów; rozszerzenia uprawnień, przeglądarki, Control UI i WebChat zawsze wymagają monitu.

Podczas działania sondy klient Node otrzymuje polecenie dalszego ponawiania prób
(`wait_then_retry`) zamiast wstrzymywania się w oczekiwaniu na ręczne zatwierdzenie; jeśli sonda
zawiedzie, następna próba przechodzi do standardowego przepływu z monitem. Dla celów, których weryfikacja się nie powiodła,
obowiązuje krótki okres oczekiwania (5 minut po niezgodności klucza).

Zatwierdzone urządzenia zapisują `approvedVia: "ssh-verified"`, a ich pierwszy zadeklarowany
zestaw możliwości jest zatwierdzany w tym samym kroku — dopasowanie klucza już dowodzi,
że Node działa na koncie operatora na należącej do niego maszynie, co stanowi
to samo zapewnienie co ręczne zatwierdzenie możliwości. Późniejsze rozszerzenia zestawu nadal
wymagają monitu.

Wzmocnienie zabezpieczeń lub wyłączenie:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może podjąć próbę **cichego zatwierdzenia** żądań możliwości Node,
gdy:

- żądanie jest oznaczone jako `silent` (Gateway oznacza pierwszy zestaw możliwości
  jako cichy, gdy parowanie urządzenia zatwierdzono nieinteraktywnie), oraz
- aplikacja może zweryfikować połączenie SSH z hostem Gateway przy użyciu tego samego
  użytkownika.

Jeśli ciche zatwierdzanie się nie powiedzie, aplikacja przechodzi do standardowego monitu Approve/Reject.

## Automatyczne zatwierdzanie urządzeń z zaufanych CIDR

Parowanie urządzenia WS dla `role: node` domyślnie pozostaje ręczne. W prywatnych sieciach
Node, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą włączyć tę funkcję
za pomocą jawnie określonych CIDR lub dokładnych adresów IP:

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

Granica bezpieczeństwa:

- Funkcja jest wyłączona, gdy `gateway.nodes.pairing.autoApproveCidrs` nie jest ustawione.
- Nie istnieje ogólny tryb automatycznego zatwierdzania sieci LAN ani sieci prywatnej; automatyczne zatwierdzanie
  zweryfikowane przez SSH (powyżej) wymaga kryptograficznego dopasowania klucza urządzenia, nigdy
  wyłącznie lokalizacji sieciowej.
- Kwalifikuje się wyłącznie nowe żądanie parowania urządzenia z `role: node` bez żądanych zakresów.
- Klienci operatora, przeglądarki, Control UI i WebChat pozostają obsługiwani ręcznie.
- Rozszerzenia ról, zakresów, metadanych i kluczy publicznych pozostają obsługiwane ręcznie.
- Ścieżki nagłówków zaufanego serwera proxy dla local loopback na tym samym hoście nie kwalifikują się, ponieważ taka
  ścieżka może zostać sfałszowana przez lokalnych wywołujących.

## Czyszczenie zastąpionych cichych parowań

Nieinteraktywne zatwierdzenia zapisują swoje pochodzenie w rekordzie sparowanego urządzenia:
zatwierdzenia przez lokalną politykę tego samego hosta jako `silent`, zatwierdzenia Node z zaufanych CIDR jako
`trusted-cidr`, a zatwierdzenia Node zweryfikowane przez SSH jako `ssh-verified`. Klienci, których katalog stanu jest efemeryczny (tymczasowe katalogi domowe,
kontenery, piaskownice dla poszczególnych uruchomień), generują nową parę kluczy urządzenia przy każdym uruchomieniu, a każde
uruchomienie ponownie paruje się po cichu jako zupełnie nowe urządzenie — bez czyszczenia lista sparowanych urządzeń
powiększałaby się o jeden nieaktualny rekord przy każdym uruchomieniu.

Gdy Gateway po cichu zatwierdza **lokalne** parowanie urządzenia, wycofuje
starsze rekordy zatwierdzone jako `silent`, które należą do tego samego klastra klienta
(zgodne `clientId`, `clientMode` i nazwa wyświetlana) i nie są obecnie
połączone. Lokalni klienci działają na samym hoście Gateway, dlatego klucz klastra
nie może pasować do innej maszyny. Wycofane rekordy natychmiast tracą swoje tokeny;
każdy pasujący starszy wpis parowania Node zostaje usunięty i rozgłaszane jest zdarzenie usunięcia
`node.pair.resolved`.

Granice:

- Kwalifikują się wyłącznie rekordy, których ostatnie zatwierdzenie było lokalne dla tego samego hosta (`silent`),
  zarówno jako wyzwalacze, jak i cele. Parowania z zaufanych CIDR i zweryfikowane przez SSH
  obejmują różne hosty, na których metadane wyświetlania nie są tożsamością maszyny, dlatego
  nigdy nie są usuwane automatycznie — użyj czyszczenia w Control UI lub
  `openclaw nodes remove`.
- Parowania zatwierdzone przez właściciela oraz za pomocą kodu QR/kodu konfiguracji (rozruchowe) nigdy nie są usuwane
  automatycznie. Rekordy zatwierdzone przed wprowadzeniem informacji o pochodzeniu pozostają chronione,
  nawet po późniejszym cichym ponownym zatwierdzeniu tego samego identyfikatora urządzenia.
- Obecnie połączone urządzenia są pomijane, dzięki czemu współbieżne lokalne sesje z
  oddzielnymi katalogami stanu zachowują swoje tokeny, dopóki są aktywne. Rekordy zatwierdzone
  w ciągu ostatniej minuty również są pomijane, aby równoczesne uzgadnianie parowania
  nie mogło wzajemnie wycofać rekordów przed zarejestrowaniem połączeń.
- Klienci, których to dotyczy, są z założenia lokalni, dlatego przy następnym połączeniu
  ponownie parują się po cichu.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie ponownie łączy się wyłącznie z niepoufnymi zmianami metadanych
(na przykład nazwy wyświetlanej lub wskazówek dotyczących platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie ma wąski zakres: dotyczy wyłącznie
zaufanych, lokalnych połączeń innych niż przeglądarkowe, które już potwierdziły posiadanie
lokalnych lub współdzielonych danych uwierzytelniających, w tym ponownych połączeń natywnej aplikacji na tym samym hoście po
zmianach metadanych wersji systemu operacyjnego. Klienci przeglądarkowi/Control UI oraz klienci zdalni
nadal korzystają z jawnego przepływu ponownego zatwierdzania. Rozszerzenia zakresu (z odczytu do
zapisu/administracji) oraz zmiany klucza publicznego **nie** kwalifikują się do
automatycznego zatwierdzania `metadata-upgrade`; pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Narzędzia pomocnicze parowania QR

`/pair qr` renderuje dane parowania jako ustrukturyzowane multimedia, dzięki czemu klienty mobilne i przeglądarkowe mogą je bezpośrednio zeskanować.

Usunięcie urządzenia powoduje również wyczyszczenie wszystkich nieaktualnych oczekujących żądań parowania dla identyfikatora tego urządzenia, dzięki czemu po cofnięciu uprawnień polecenie `nodes pending` nie wyświetla osieroconych wierszy.

## Lokalność i przekazywane nagłówki

Podczas parowania Gateway uznaje połączenie za local loopback tylko wtedy, gdy potwierdzają to zarówno surowe gniazdo, jak i wszelkie dane pochodzące z pośredniczącego serwera proxy. Jeśli żądanie dociera przez local loopback, ale zawiera dane z nagłówka `Forwarded`, dowolnego nagłówka `X-Forwarded-*` lub nagłówka `X-Real-IP`, dane te wykluczają uznanie połączenia za lokalne, a ścieżka parowania wymaga jawnego zatwierdzenia zamiast automatycznie traktować żądanie jako połączenie z tego samego hosta. Odpowiednik tej reguły dotyczący uwierzytelniania operatora opisano w sekcji [Uwierzytelnianie zaufanego serwera proxy](/pl/gateway/trusted-proxy-auth).

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w rekordach sparowanych urządzeń we współdzielonej bazie danych stanu SQLite w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (sparowane urządzenia z uwierzytelnianiem urządzeń, zatwierdzone interfejsy węzłów, oczekujące żądania dostępu do interfejsów, oczekujące żądania parowania urządzeń oraz tokeny inicjalizacyjne)

Jeśli zmienisz wartość `OPENCLAW_STATE_DIR`, baza danych zostanie przeniesiona wraz z tym katalogiem. Gateway zaktualizowane z wersji korzystających z magazynów JSON importują je podczas uruchamiania i pozostawiają archiwa `devices/*.json.migrated` oraz `nodes/*.json.migrated`.

Uwagi dotyczące bezpieczeństwa:

- Tokeny urządzeń są danymi poufnymi; bazę danych stanu należy traktować jako wrażliwą.
- Do rotacji tokenu urządzenia służy `openclaw devices rotate` / `device.token.rotate`.

## Działanie transportu

- Transport jest **bezstanowy**; nie przechowuje informacji o członkostwie.
- Jeśli Gateway jest niedostępny lub parowanie jest wyłączone, węzły nie mogą się parować.
- W trybie zdalnym parowanie odbywa się z użyciem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [CLI węzłów](/pl/cli/nodes)
- [CLI urządzeń](/pl/cli/devices)
