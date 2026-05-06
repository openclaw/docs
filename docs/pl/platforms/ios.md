---
read_when:
    - Parowanie lub ponowne łączenie Node iOS
    - Uruchamianie aplikacji iOS z kodu źródłowego
    - Debugowanie wykrywania Gateway lub poleceń kanwy
summary: 'Aplikacja węzła iOS: łączenie z Gateway, parowanie, kanwa i rozwiązywanie problemów'
title: Aplikacja na iOS
x-i18n:
    generated_at: "2026-05-06T09:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: wewnętrzny podgląd. Aplikacja iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, zrzut ekranu, przechwytywanie obrazu z kamery, lokalizacja, tryb rozmowy, wybudzanie głosem.
- Odbiera polecenia `node.invoke` i zgłasza zdarzenia statusu węzła.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (wariant awaryjny).

## Szybki start (sparuj i połącz)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykryty Gateway (albo włącz Manual Host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Opcjonalnie: jeśli węzeł iOS zawsze łączy się ze ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie węzła przy pierwszym parowaniu za pomocą jawnych CIDR-ów lub dokładnych adresów IP:

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Parowanie operatora/przeglądarki oraz każda zmiana roli, zakresu, metadanych lub
klucza publicznego nadal wymaga ręcznego zatwierdzenia.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na przekaźniku dla oficjalnych kompilacji

Oficjalnie dystrybuowane kompilacje iOS używają zewnętrznego przekaźnika push zamiast publikować surowy token APNs
do Gateway.

Wymaganie po stronie Gateway:

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

Jak działa ten przepływ:

- Aplikacja iOS rejestruje się w przekaźniku przy użyciu App Attest i JWS transakcji aplikacji StoreKit.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz przyznanie wysyłania o zakresie rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego Gateway i dołącza ją do rejestracji w przekaźniku, więc rejestracja oparta na przekaźniku jest delegowana do tego konkretnego Gateway.
- Aplikacja przekazuje tę rejestrację opartą na przekaźniku do sparowanego Gateway za pomocą `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika do `push.test`, wybudzeń w tle i ponagleń wybudzania.
- Bazowy URL przekaźnika Gateway musi pasować do URL-a przekaźnika wbudowanego w oficjalną/TestFlight kompilację iOS.
- Jeśli aplikacja później połączy się z innym Gateway lub kompilacją z innym bazowym URL-em przekaźnika, odświeża rejestrację przekaźnika zamiast ponownie używać starego powiązania.

Czego Gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu przekaźnika obejmującego całe wdrożenie.
- Brak bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na przekaźniku.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną/TestFlight kompilację iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` na Gateway.
3. Sparuj aplikację z Gateway i pozwól jej zakończyć łączenie.
4. Aplikacja publikuje `push.apns.register` automatycznie po uzyskaniu tokenu APNs, połączeniu sesji operatora i powodzeniu rejestracji przekaźnika.
5. Następnie `push.test`, wybudzenia ponownego połączenia i ponaglenia wybudzania mogą używać zapisanej rejestracji opartej na przekaźniku.

## Beacony aktywności w tle

Gdy iOS wybudza aplikację przez cichy push, odświeżanie w tle albo zdarzenie znaczącej zmiany lokalizacji, aplikacja
próbuje wykonać krótkie ponowne połączenie węzła, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego węzła/urządzenia dopiero
po poznaniu uwierzytelnionej tożsamości urządzenia węzła.

Aplikacja traktuje wybudzenie w tle jako skutecznie zapisane tylko wtedy, gdy odpowiedź Gateway zawiera
`handled: true`. Starsze Gateway mogą potwierdzać `node.event` odpowiedzią `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniego widzenia.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla Gateway.

## Uwierzytelnianie i przepływ zaufania

Przekaźnik istnieje po to, aby wymusić dwa ograniczenia, których bezpośredni APNs na Gateway nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko autentyczne kompilacje iOS OpenClaw dystrybuowane przez Apple mogą używać hostowanego przekaźnika.
- Gateway może wysyłać pushe oparte na przekaźniku tylko do urządzeń iOS sparowanych z tym konkretnym
  Gateway.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z Gateway przez normalny przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję węzła oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz JWS transakcji aplikacji StoreKit.
   - Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalnym kompilacjom Xcode/deweloperskim korzystanie z hostowanego przekaźnika. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez przekaźnik.

3. `gateway identity delegation`
   - Przed rejestracją przekaźnika aplikacja pobiera tożsamość sparowanego Gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość Gateway do ładunku rejestracji przekaźnika.
   - Przekaźnik zwraca uchwyt przekaźnika oraz przyznanie wysyłania o zakresie rejestracji, które są delegowane do
     tej tożsamości Gateway.

4. `gateway -> relay`
   - Gateway przechowuje uchwyt przekaźnika i przyznanie wysyłania z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i ponagleniach wybudzania Gateway podpisuje żądanie wysłania swoją
     własną tożsamością urządzenia.
   - Przekaźnik weryfikuje zarówno zapisane przyznanie wysyłania, jak i podpis Gateway względem delegowanej
     tożsamości Gateway z rejestracji.
   - Inny Gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli jakimś sposobem pozyska uchwyt.

5. `relay -> APNs`
   - Przekaźnik posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie przechowuje surowego tokenu APNs dla oficjalnych kompilacji opartych na przekaźniku.
   - Przekaźnik wysyła końcowy push do APNs w imieniu sparowanego Gateway.

Dlaczego powstał ten projekt:

- Aby trzymać produkcyjne poświadczenia APNs poza Gateway użytkowników.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych kompilacji na Gateway.
- Aby zezwalać na użycie hostowanego przekaźnika tylko oficjalnym/TestFlight kompilacjom OpenClaw.
- Aby uniemożliwić jednemu Gateway wysyłanie pushy wybudzających do urządzeń iOS należących do innego Gateway.

Lokalne/ręczne kompilacje pozostają przy bezpośrednim APNs. Jeśli testujesz te kompilacje bez przekaźnika,
Gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne env czasu działania hosta Gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane przechowywanie na hoście Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie commituj pliku `.p8` ani nie umieszczaj go w checkoutcie repo.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, gdy jest skonfigurowana, tę samą
domenę wykrywania szerokoobszarowego DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu beacona.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) oraz split DNS Tailscale.
Zobacz [Bonjour](/pl/gateway/bonjour), aby poznać przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Manual Host** i wpisz host Gateway + port (domyślnie `18789`).

## Canvas + A2UI

Węzeł iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway udostępnia `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest udostępniany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Węzeł iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Wróć do wbudowanego szkieletu za pomocą `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilną powierzchnią węzła, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS przez narzędzia MCP;
aplikacja iOS udostępnia możliwości iPhone'a przez polecenia węzła OpenClaw,
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia
węzła, ale te wywołania przechodzą przez protokół węzła Gateway i podlegają limitom
pierwszego planu/tła iOS. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do sterowania lokalnym pulpitem, a tej strony do możliwości węzła iOS.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosem + tryb rozmowy

- Wybudzanie głosem i tryb rozmowy są dostępne w Ustawieniach.
- Węzły iOS obsługujące rozmowę reklamują możliwość `talk` i mogą deklarować
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`;
  Gateway domyślnie zezwala na te polecenia push-to-talk dla zaufanych
  węzłów obsługujących rozmowę.
- iOS może wstrzymywać dźwięk w tle; traktuj funkcje głosowe jako best-effort, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamery/ekranu tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie zareklamował URL-a hosta canvas; sprawdź `canvasHost` w [konfiguracji Gateway](/pl/gateway/configuration).
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie po reinstalacji nie działa: token parowania Keychain został wyczyszczony; sparuj węzeł ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
