---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Uruchamianie aplikacji iOS ze źródła
    - Debugowanie wykrywania Gateway lub poleceń canvas
summary: 'Aplikacja Node na iOS: łączenie z Gateway, parowanie, kanwa i rozwiązywanie problemów'
title: Aplikacja na iOS
x-i18n:
    generated_at: "2026-07-02T22:52:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: kompilacje aplikacji na iPhone'a są dystrybuowane przez kanały Apple, gdy są włączone dla wydania. Lokalne kompilacje deweloperskie można też uruchamiać ze źródeł.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, zrzut ekranu, przechwytywanie z kamery, lokalizacja, tryb Talk, wybudzanie głosem.
- Odbiera polecenia `node.invoke` i zgłasza zdarzenia statusu węzła.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (rozwiązanie awaryjne).

## Szybki start (parowanie + łączenie)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykryty Gateway (albo włącz Ręczny host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Opcjonalnie: jeśli węzeł iOS zawsze łączy się ze ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie węzła przy pierwszym użyciu z jawnymi CIDR-ami lub dokładnymi adresami IP:

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
klucza publicznego nadal wymagają ręcznego zatwierdzenia.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na przekaźniku dla oficjalnych kompilacji

Oficjalne dystrybuowane kompilacje iOS używają zewnętrznego przekaźnika push zamiast publikować surowy
token APNs do Gateway.

Oficjalne kompilacje App Store z publicznej ścieżki wydania używają hostowanego przekaźnika pod adresem `https://ios-push-relay.openclaw.ai`.

Niestandardowe wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki kompilacji/wdrożenia iOS, której URL przekaźnika odpowiada URL przekaźnika Gateway. Publiczna ścieżka wydania App Store nie akceptuje niestandardowych nadpisań URL przekaźnika. Jeśli używasz niestandardowej kompilacji z przekaźnikiem, ustaw pasujący URL przekaźnika Gateway:

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

Jak działa przepływ:

- Aplikacja iOS rejestruje się w przekaźniku za pomocą App Attest i JWS transakcji aplikacji StoreKit.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz uprawnienie wysyłania ograniczone do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego Gateway i dołącza ją do rejestracji przekaźnika, dzięki czemu rejestracja oparta na przekaźniku jest delegowana do tego konkretnego Gateway.
- Aplikacja przekazuje tę rejestrację opartą na przekaźniku do sparowanego Gateway przez `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika dla `push.test`, wybudzeń w tle i impulsów wybudzających.
- Niestandardowe URL-e przekaźnika Gateway muszą odpowiadać URL-owi przekaźnika wbudowanemu w kompilację iOS.
- Jeśli aplikacja później łączy się z innym Gateway albo z kompilacją z innym bazowym URL-em przekaźnika, odświeża rejestrację przekaźnika zamiast ponownie używać starego powiązania.

Czego Gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu przekaźnika obejmującego całe wdrożenie.
- Brak bezpośredniego klucza APNs dla oficjalnych wysyłek z App Store opartych na przekaźniku.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną aplikację iOS.
2. Opcjonalnie: ustaw `gateway.push.apns.relay.baseUrl` na Gateway tylko wtedy, gdy używasz celowo oddzielnej niestandardowej kompilacji z przekaźnikiem.
3. Sparuj aplikację z Gateway i pozwól jej zakończyć łączenie.
4. Aplikacja publikuje `push.apns.register` automatycznie po uzyskaniu tokenu APNs, połączeniu sesji operatora i powodzeniu rejestracji przekaźnika.
5. Następnie `push.test`, wybudzenia ponownego połączenia i impulsy wybudzające mogą używać zapisanej rejestracji opartej na przekaźniku.

## Sygnały alive w tle

Gdy iOS wybudza aplikację dla cichego push, odświeżania w tle lub zdarzenia istotnej zmiany lokalizacji, aplikacja
próbuje krótkiego ponownego połączenia węzła, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego węzła/urządzenia tylko
po poznaniu uwierzytelnionej tożsamości urządzenia węzła.

Aplikacja traktuje wybudzenie w tle jako pomyślnie zapisane tylko wtedy, gdy odpowiedź Gateway zawiera
`handled: true`. Starsze Gateway mogą potwierdzać `node.event` za pomocą `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniego widzenia.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla Gateway.
- Publiczna ścieżka wydania App Store odrzuca `OPENCLAW_PUSH_RELAY_BASE_URL` dla kompilacji iOS.

## Uwierzytelnianie i przepływ zaufania

Przekaźnik istnieje po to, aby egzekwować dwa ograniczenia, których bezpośrednie APNs na Gateway nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko autentyczne kompilacje OpenClaw iOS dystrybuowane przez Apple mogą używać hostowanego przekaźnika.
- Gateway może wysyłać powiadomienia push oparte na przekaźniku tylko dla urządzeń iOS sparowanych z tym konkretnym
  Gateway.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z Gateway przez normalny przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję węzła oraz uwierzytelnioną sesję operatora.
   - Sesja operatora jest używana do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz JWS transakcji aplikacji StoreKit.
   - Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalne kompilacje Xcode/deweloperskie przed używaniem hostowanego przekaźnika. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez przekaźnik.

3. `gateway identity delegation`
   - Przed rejestracją przekaźnika aplikacja pobiera tożsamość sparowanego Gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość Gateway do ładunku rejestracji przekaźnika.
   - Przekaźnik zwraca uchwyt przekaźnika i uprawnienie wysyłania ograniczone do rejestracji, delegowane do
     tej tożsamości Gateway.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłania z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i impulsach wybudzających Gateway podpisuje żądanie wysłania swoją
     własną tożsamością urządzenia.
   - Przekaźnik weryfikuje zarówno zapisane uprawnienie wysyłania, jak i podpis Gateway względem delegowanej
     tożsamości Gateway z rejestracji.
   - Inny Gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.

5. `relay -> APNs`
   - Przekaźnik posiada produkcyjne poświadczenia APNs oraz surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie zapisuje surowego tokenu APNs dla oficjalnych kompilacji opartych na przekaźniku.
   - Przekaźnik wysyła końcowy push do APNs w imieniu sparowanego Gateway.

Dlaczego powstał ten projekt:

- Aby utrzymać produkcyjne poświadczenia APNs poza Gateway użytkowników.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych kompilacji na Gateway.
- Aby dopuścić użycie hostowanego przekaźnika tylko dla oficjalnych kompilacji OpenClaw iOS.
- Aby uniemożliwić jednemu Gateway wysyłanie push wybudzających do urządzeń iOS należących do innego Gateway.

Kompilacje lokalne/ręczne pozostają przy bezpośrednim APNs. Jeśli testujesz te kompilacje bez przekaźnika,
Gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

To są zmienne env czasu działania hosta Gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect, takie jak `APP_STORE_CONNECT_KEY_ID` i
`APP_STORE_CONNECT_ISSUER_ID`; nie konfiguruje bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane przechowywanie na hoście Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie commituj pliku `.p8` ani nie umieszczaj go w checkoutcie repozytorium.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, gdy jest skonfigurowana, tę samą
domenę wykrywania DNS-SD dla sieci rozległej. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny sieci rozległej bez zmiany typu sygnału.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby uzyskać przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Ręczny host** i wpisz host Gateway + port (domyślnie `18789`).

## Canvas + A2UI

Węzeł iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway udostępnia `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest udostępniany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Węzeł iOS zachowuje wbudowany szkielet jako domyślny widok po połączeniu. `canvas.a2ui.push` i `canvas.a2ui.reset` używają dołączonej strony A2UI należącej do aplikacji.
- Zdalne strony A2UI Gateway są tylko renderowane na iOS; natywne akcje przycisków A2UI są akceptowane tylko ze stron dołączonych do aplikacji i należących do niej.
- Wróć do wbudowanego szkieletu za pomocą `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest powierzchnią węzła mobilnego, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS przez narzędzia MCP;
aplikacja iOS udostępnia możliwości iPhone'a przez polecenia węzła OpenClaw,
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia węzła,
ale te wywołania przechodzą przez protokół węzła Gateway i podlegają limitom iOS
dla pierwszego planu/tła. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do lokalnego sterowania pulpitem, a tej strony do możliwości węzła iOS.

### Eval / zrzut Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosem + tryb Talk

- Wybudzanie głosem i tryb Talk są dostępne w Ustawieniach.
- OpenAI realtime Talk używa WebRTC należącego do klienta, gdy `talk.realtime.transport` ma wartość `webrtc`; jawna konfiguracja `gateway-relay` pozostaje własnością Gateway. Zobacz [tryb Talk](/pl/nodes/talk).
- Węzły iOS obsługujące Talk reklamują możliwość `talk` i mogą deklarować
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`;
  Gateway domyślnie zezwala na te polecenia push-to-talk dla zaufanych
  węzłów obsługujących Talk.
- iOS może wstrzymywać dźwięk w tle; traktuj funkcje głosowe jako działające na zasadzie najlepszej próby, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamera/ekran tego wymagają).
- `A2UI_HOST_UNAVAILABLE`: dołączona strona A2UI nie była osiągalna w WebView aplikacji; utrzymaj aplikację na pierwszym planie na karcie Ekran i spróbuj ponownie.
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie działa po reinstalacji: token parowania w Keychain został wyczyszczony; sparuj węzeł ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
