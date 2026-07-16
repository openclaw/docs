---
read_when:
    - Implementowanie zatwierdzania parowania Node bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu Gateway o zarządzanie węzłami
summary: 'Zatwierdzanie możliwości Node: jak węzły uzyskują dostęp do poleceń po sparowaniu urządzenia'
title: Parowanie Node’ów
x-i18n:
    generated_at: "2026-07-16T18:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Parowanie Node ma dwie warstwy, obie przechowywane w rekordzie sparowanego urządzenia w bazie danych stanu SQLite Gateway:

- **Parowanie urządzenia** (rola `node`) warunkuje uzgadnianie `connect`. Zobacz
  [Automatyczne zatwierdzanie urządzeń na podstawie zaufanego CIDR](#trusted-cidr-device-auto-approval)
  poniżej oraz [Parowanie kanałów](/pl/channels/pairing).
- **Zatwierdzanie możliwości Node** (`node.pair.*`) określa, które zadeklarowane
  możliwości/polecenia może udostępniać połączony Node. Gateway jest
  źródłem prawdy; interfejsy użytkownika (aplikacja macOS, Control UI) służą do zatwierdzania lub
  odrzucania oczekujących żądań.

Poprzedni, niezależny magazyn parowania Node (`nodes/paired.json` z tokenem osobnym dla każdego Node,
wycofanym ze ścieżki połączenia w styczniu 2026 r.) już nie istnieje: podczas uruchamiania Gateway
jednorazowo przenoszą wszystkie pozostałe wiersze do rekordów urządzeń i archiwizują
starsze pliki z sufiksem `.migrated`. Obsługa starszego mostu TCP została
usunięta.

## Jak działa zatwierdzanie możliwości

1. Node łączy się z WS Gateway (ten krok wymaga parowania urządzenia).
2. Gateway porównuje zadeklarowany zakres możliwości/poleceń z zakresem
   zatwierdzonym; nowe lub rozszerzone zakresy powodują zapisanie **oczekującego żądania** w
   rekordzie urządzenia i wyemitowanie `node.pair.requested`.
3. Żądanie zostaje zatwierdzone lub odrzucone (za pomocą CLI lub interfejsu użytkownika).
4. Do czasu zatwierdzenia polecenia Node pozostają filtrowane; zatwierdzenie udostępnia zadeklarowany
   zakres z uwzględnieniem standardowej polityki poleceń.

Oczekujące żądania wygasają automatycznie **5 minut po ostatniej
ponownej próbie Node** — aktywnie łączący się ponownie Node utrzymuje swoje jedno oczekujące żądanie
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
- `node.pair.remove` — usuwa sparowany Node. Powoduje to unieważnienie roli `node`
  urządzenia w magazynie sparowanych urządzeń, usunięcie wraz z nią zatwierdzonego zakresu Node oraz
  unieważnienie/rozłączenie sesji tego urządzenia z rolą Node. Urządzenie z **wieloma rolami**
  (na przykład mające również `operator`) zachowuje swój wiersz i traci tylko
  rolę `node`; wiersz urządzenia mającego wyłącznie rolę Node zostaje usunięty. Autoryzacja:
  `operator.pairing` może usuwać wiersze Node niebędące operatorami; obiekt wywołujący z tokenem urządzenia,
  który unieważnia swoją **własną** rolę Node na urządzeniu z wieloma rolami, dodatkowo wymaga
  `operator.admin`.
- `node.rename` — zmienia widoczną dla operatora nazwę wyświetlaną sparowanego Node.

Usunięte w wersji 2026.7: `node.pair.request` i `node.pair.verify`. Oczekujące
żądania są tworzone przez sam Gateway podczas łączenia Node, a obsługiwany przez nie
osobny token dla każdego Node już nie istnieje; uwierzytelnianie Node odbywa się za pomocą
tokenu parowania urządzenia.

Uwagi:

- Ponowne połączenia z niezmienionym zakresem wykorzystują ponownie oczekujące żądanie; powtarzane
  żądania odświeżają zapisane metadane Node i najnowszy dozwolony
  zadeklarowany zestaw poleceń, aby operator miał aktualny wgląd.
- Poziomy zakresów operatora i kontrole wykonywane podczas zatwierdzania podsumowano w sekcji
  [Zakresy operatora](/pl/gateway/operator-scopes).
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - zwykłe żądanie polecenia: `operator.pairing` + `operator.write`
  - żądanie wymagające uprawnień administratora, zawierające `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` lub
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
Zatwierdzenie parowania Node rejestruje zaufany zakres możliwości. **Nie** przypina aktywnego zakresu poleceń osobno dla każdego Node.

- Aktywne polecenia Node wynikają z deklaracji Node podczas łączenia i są filtrowane przez
  globalną politykę poleceń Node Gateway (`gateway.nodes.allowCommands` i
  `denyCommands`).
- Polityka zezwalania i pytania `system.run` dla poszczególnych Node znajduje się w Node w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Ograniczanie poleceń Node (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecznie:** od wersji `2026.3.31` polecenia Node są wyłączone do czasu zatwierdzenia parowania Node. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń Node.
</Warning>

Gdy Node łączy się po raz pierwszy, żądanie parowania jest tworzone automatycznie.
Do czasu zatwierdzenia tego żądania wszystkie oczekujące polecenia z tego Node są
filtrowane i nie zostaną wykonane. Po zatwierdzeniu parowania zadeklarowane przez Node
polecenia stają się dostępne z uwzględnieniem standardowej polityki poleceń.

Oznacza to, że:

- Node, które wcześniej udostępniały polecenia wyłącznie na podstawie parowania urządzenia, muszą
  teraz również ukończyć parowanie Node.
- Polecenia umieszczone w kolejce przed zatwierdzeniem parowania są odrzucane, a nie odkładane.

## Granice zaufania zdarzeń Node (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecznie:** uruchomienia pochodzące z Node pozostają teraz w ograniczonym zaufanym zakresie.
</Warning>

Podsumowania pochodzące z Node i powiązane zdarzenia sesji są ograniczone do
zamierzonego zaufanego zakresu. Przepływy inicjowane przez powiadomienia lub Node, które
wcześniej korzystały z szerszego dostępu do narzędzi hosta lub sesji, mogą wymagać dostosowania.
To wzmocnienie zabezpieczeń zapobiega eskalacji zdarzeń Node do dostępu do narzędzi na poziomie hosta
wykraczającego poza granice zaufania dopuszczalne dla Node.

Trwałe aktualizacje obecności Node podlegają tej samej granicy tożsamości: zdarzenie
`node.presence.alive` jest akceptowane wyłącznie z uwierzytelnionych sesji urządzeń Node
i aktualizuje metadane parowania tylko wtedy, gdy tożsamość urządzenia/Node jest
już sparowana. Samodzielnie zadeklarowana wartość `client.id` nie wystarcza do zapisania
stanu ostatniej aktywności.

## Automatyczne zatwierdzanie urządzeń zweryfikowanych przez SSH (domyślnie)

Pierwsze parowanie urządzenia `role: node` z adresu prywatnego/CGNAT jest
zatwierdzane automatycznie, gdy Gateway może **udowodnić własność maszyny przez SSH**:
łączy się zwrotnie z hostem parowania (`BatchMode`, `StrictHostKeyChecking=yes`),
uruchamia tam `openclaw node identity --json` i zatwierdza tylko wtedy, gdy zdalny
identyfikator urządzenia i klucz publiczny dokładnie odpowiadają oczekującemu żądaniu. Dopasowanie klucza
zapewnia bezpieczeństwo: sama osiągalność nigdy nie powoduje zatwierdzenia, dlatego współużytkownicy NAT,
inni użytkownicy współdzielonego hosta i fałszowanie w sieci LAN zawsze powodują przejście do standardowego
monitu.

Domyślnie włączone. Wymagania aktywacji:

- Użytkownik procesu Gateway (lub `sshVerify.user`) może połączyć się przez SSH z hostem Node
  bez interakcji (klucze/agent; działa również Tailscale SSH), a klucz hosta jest
  już zaufany.
- `openclaw` jest rozpoznawane w zdalnym `PATH` dla nieinteraktywnego `sh -lc`.
- Adres IP połączenia jest bezpośrednim (bez pośrednika i bez interfejsu pętli zwrotnej) adresem prywatnym, ULA,
  lokalnym dla łącza lub CGNAT albo odpowiada `sshVerify.cidrs`, jeśli ustawiono tę wartość.
- Obowiązuje ten sam minimalny poziom kwalifikacji co przy zatwierdzaniu na podstawie zaufanego CIDR: tylko nowe parowanie
  Node bez zakresów; aktualizacje, przeglądarki, Control UI i WebChat zawsze wyświetlają monit.

Podczas działania sondy klient Node otrzymuje polecenie kontynuowania ponownych prób
(`wait_then_retry`) zamiast wstrzymywania działania do czasu ręcznego zatwierdzenia; jeśli sonda
zawiedzie, następna próba przechodzi do standardowego przepływu z monitem. Nieudane cele
otrzymują krótki okres blokady (5 minut po niezgodności klucza).

Zatwierdzone urządzenia rejestrują `approvedVia: "ssh-verified"`, a ich pierwszy zadeklarowany
zakres możliwości jest zatwierdzany w tym samym kroku — dopasowanie klucza już dowodzi,
że Node działa w ramach konta operatora na należącej do niego maszynie, co odpowiada
zapewnieniu wynikającemu z ręcznego zatwierdzenia możliwości. Późniejsze rozszerzenia zakresu nadal
wyświetlają monit.

Wzmocnienie zabezpieczeń lub wyłączenie:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Wyłącz całkowicie:
        sshVerify: false,
        // ...lub ogranicz/dostosuj sondę:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może podjąć próbę **cichego zatwierdzenia** żądań możliwości Node,
gdy:

- żądanie jest oznaczone jako `silent` (Gateway oznacza pierwszy zakres możliwości
  jako cichy, gdy parowanie urządzenia zatwierdzono bez interakcji), oraz
- aplikacja może zweryfikować połączenie SSH z hostem Gateway przy użyciu tego samego
  użytkownika.

Jeśli ciche zatwierdzenie nie powiedzie się, następuje powrót do standardowego monitu Approve/Reject.

## Automatyczne zatwierdzanie urządzeń na podstawie zaufanego CIDR

Parowanie urządzeń WS dla `role: node` pozostaje domyślnie ręczne. W prywatnych sieciach Node,
w których Gateway już ufa ścieżce sieciowej, operatorzy mogą włączyć tę funkcję
za pomocą jawnych zakresów CIDR lub dokładnych adresów IP:

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

- Wyłączone, gdy `gateway.nodes.pairing.autoApproveCidrs` nie jest ustawione.
- Nie istnieje ogólny tryb automatycznego zatwierdzania dla sieci LAN ani sieci prywatnych; automatyczne zatwierdzanie
  zweryfikowane przez SSH (powyżej) wymaga kryptograficznego dopasowania klucza urządzenia, a nigdy
  wyłącznie lokalizacji sieciowej.
- Kwalifikuje się tylko nowe żądanie parowania urządzenia `role: node` bez żądanych zakresów.
- Klienci operatora, przeglądarki, Control UI i WebChat pozostają obsługiwani ręcznie.
- Rozszerzenia ról, zakresów, metadanych i kluczy publicznych pozostają obsługiwane ręcznie.
- Ścieżki nagłówków zaufanego serwera proxy przez interfejs pętli zwrotnej tego samego hosta nie kwalifikują się, ponieważ
  lokalne obiekty wywołujące mogą sfałszować tę ścieżkę.

## Czyszczenie zastąpionych cichych parowań

Zatwierdzenia nieinteraktywne zapisują swoje pochodzenie w wierszu sparowanego urządzenia:
zatwierdzenia lokalnej polityki tego samego hosta jako `silent`, zatwierdzenia Node na podstawie zaufanego CIDR jako
`trusted-cidr`, a zatwierdzenia Node zweryfikowane przez SSH jako `ssh-verified`. Klienci, których katalog stanu jest efemeryczny (tymczasowe katalogi domowe,
kontenery, piaskownice dla poszczególnych uruchomień), generują nową parę kluczy urządzenia przy każdym uruchomieniu, a każde
uruchomienie po cichu paruje się ponownie jako całkowicie nowe urządzenie — bez czyszczenia lista sparowanych urządzeń
powiększa się o jeden nieaktualny wiersz przy każdym uruchomieniu.

Gdy Gateway po cichu zatwierdza **lokalne** parowanie urządzenia, wycofuje
starsze rekordy zatwierdzone jako `silent`, które należą do tego samego klastra klientów
(zgodność `clientId`, `clientMode` i nazwy wyświetlanej) i nie są obecnie
połączone. Lokalni klienci działają na samym hoście Gateway, dlatego klucz klastra
nie może odpowiadać innej maszynie. Tokeny wycofanych wierszy są natychmiast unieważniane;
każdy pasujący starszy wpis parowania Node zostaje usunięty, a zdarzenie usunięcia `node.pair.resolved`
jest rozgłaszane.

Granice:

- Kwalifikują się tylko rekordy, których ostatnie zatwierdzenie było lokalne na tym samym hoście (`silent`) — zarówno jako wyzwalacz, jak i cel. Powiązania zweryfikowane za pomocą zaufanego zakresu CIDR i SSH obejmują różne hosty, na których metadane wyświetlania nie stanowią tożsamości maszyny, dlatego nigdy nie są usuwane automatycznie — w ich przypadku należy użyć funkcji czyszczenia w interfejsie Control UI lub polecenia `openclaw nodes remove`.
- Powiązania zatwierdzone przez właściciela oraz za pomocą kodu QR/kodu konfiguracji (bootstrap) nigdy nie są usuwane automatycznie. Rekordy zatwierdzone przed wprowadzeniem informacji o pochodzeniu pozostają chronione nawet po późniejszym, niewidocznym ponownym zatwierdzeniu tego samego identyfikatora urządzenia.
- Aktualnie połączone urządzenia są pomijane, dzięki czemu równoczesne sesje lokalne z oddzielnymi katalogami stanu zachowują swoje tokeny przez cały czas trwania połączenia. Pomijane są również rekordy zatwierdzone w ciągu ostatniej minuty, dzięki czemu jednoczesne uzgadnianie powiązań nie może wzajemnie ich wycofać, zanim ich połączenia zostaną zarejestrowane.
- Klienci, których to dotyczy, są z założenia lokalni, dlatego przy następnym połączeniu ponownie powiążą się bez interakcji użytkownika.

## Automatyczne zatwierdzanie uaktualnienia metadanych

Gdy już powiązane urządzenie łączy się ponownie, a zmiany dotyczą wyłącznie niewrażliwych metadanych (na przykład nazwy wyświetlanej lub wskazówek dotyczących platformy klienta), OpenClaw traktuje to jako `metadata-upgrade`. Zakres automatycznego zatwierdzania bez interakcji użytkownika jest wąski: dotyczy ono wyłącznie zaufanych, lokalnych ponownych połączeń spoza przeglądarki, które wcześniej potwierdziły posiadanie lokalnych lub współdzielonych poświadczeń, w tym ponownych połączeń natywnej aplikacji na tym samym hoście po zmianie metadanych wersji systemu operacyjnego. Klienci przeglądarkowi/Control UI oraz klienci zdalni nadal korzystają z jawnego procesu ponownego zatwierdzania. Uaktualnienia zakresu uprawnień (z odczytu do zapisu/administracji) oraz zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania uaktualnienia metadanych; pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Narzędzia pomocnicze do powiązywania za pomocą kodu QR

`/pair qr` renderuje ładunek powiązania jako ustrukturyzowane multimedia, aby klienci mobilni i przeglądarkowi mogli go bezpośrednio zeskanować.

Usunięcie urządzenia usuwa również wszystkie nieaktualne oczekujące żądania powiązania dotyczące tego identyfikatora urządzenia, dzięki czemu `nodes pending` nie wyświetla osieroconych wierszy po unieważnieniu.

## Lokalność i nagłówki przekazywane

Mechanizm powiązywania Gateway uznaje połączenie za zwrotne tylko wtedy, gdy potwierdzają to zarówno nieprzetworzone gniazdo, jak i wszelkie dane pochodzące z nadrzędnego serwera proxy. Jeśli żądanie dociera przez interfejs zwrotny, ale zawiera dane nagłówka `Forwarded`, dowolnego nagłówka `X-Forwarded-*` lub `X-Real-IP`, te dane przekazywanego nagłówka wykluczają uznanie połączenia za lokalne dla interfejsu zwrotnego, a ścieżka powiązywania wymaga jawnego zatwierdzenia zamiast automatycznego traktowania żądania jako połączenia z tego samego hosta. Odpowiednią regułę dotyczącą uwierzytelniania operatora opisano w sekcji
[Uwierzytelnianie zaufanego serwera proxy](/pl/gateway/trusted-proxy-auth).

## Przechowywanie (lokalne, prywatne)

Stan powiązania znajduje się w rekordach powiązanych urządzeń we współdzielonej bazie danych stanu SQLite w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (powiązane urządzenia z uwierzytelnianiem urządzenia, zatwierdzone powierzchnie Node, oczekujące żądania powierzchni, oczekujące żądania powiązania urządzeń oraz tokeny bootstrap)

W przypadku zastąpienia wartości `OPENCLAW_STATE_DIR` baza danych zostanie przeniesiona razem z nią. Instancje Gateway uaktualnione z wydań korzystających z magazynów JSON importują je podczas uruchamiania i pozostawiają archiwa `devices/*.json.migrated` oraz `nodes/*.json.migrated`.

Uwagi dotyczące bezpieczeństwa:

- Tokeny urządzeń są danymi poufnymi; bazę danych stanu należy traktować jako wrażliwą.
- Do rotacji tokena urządzenia służy `openclaw devices rotate` /
  `device.token.rotate`.

## Działanie transportu

- Transport jest **bezstanowy**; nie przechowuje informacji o przynależności.
- Jeśli Gateway jest offline lub powiązywanie jest wyłączone, węzły nie mogą się powiązać.
- W trybie zdalnym powiązywanie odbywa się względem magazynu zdalnego Gateway.

## Powiązane materiały

- [Powiązywanie kanałów](/pl/channels/pairing)
- [CLI węzłów](/pl/cli/nodes)
- [CLI urządzeń](/pl/cli/devices)
