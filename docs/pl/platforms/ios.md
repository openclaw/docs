---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Uruchamianie aplikacji iOS z kodu źródłowego
    - Debugowanie wykrywania Gateway lub poleceń kanwy
summary: 'Aplikacja węzła iOS: łączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-07-04T18:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Availability: kompilacje aplikacji na iPhone'a są dystrybuowane przez kanały Apple, gdy są włączone dla wydania. Lokalne kompilacje deweloperskie można też uruchamiać ze źródeł.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, zrzut ekranu, przechwytywanie z kamery, lokalizację, tryb rozmowy, wybudzanie głosem.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia stanu węzła.

## Wymagania

- Gateway działający na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ten sam LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (ścieżka awaryjna).

## Szybki start (parowanie + połączenie)

1. Uruchom uwierzytelniony Gateway z trasą osiągalną dla telefonu. Tailscale
   Serve to zalecana ścieżka zdalna:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Dla zaufanej konfiguracji w tym samym LAN użyj zamiast tego uwierzytelnionego `gateway.bind: "lan"`.
Domyślne powiązanie loopback nie jest osiągalne z telefonu. Jeśli
Gateway nie został jeszcze skonfigurowany, najpierw uruchom `openclaw onboard`, aby tworzenie
kodu konfiguracji miało ścieżkę uwierzytelniania tokenem lub hasłem.

2. Otwórz [interfejs Control UI](/pl/web/control-ui), wybierz **Węzły** i kliknij
   **Sparuj urządzenie mobilne** na karcie **Urządzenia**.

3. W aplikacji iOS otwórz **Ustawienia** → **Gateway**, zeskanuj kod QR (lub wklej
   kod konfiguracji) i połącz się.

4. Oficjalna aplikacja łączy się automatycznie. Jeśli **Urządzenia** pokazują oczekujące
   żądanie, sprawdź jego rolę i zakresy przed zatwierdzeniem.

Przycisk Control UI wymaga już sparowanej sesji z `operator.admin`.
Jako terminalowej ścieżki awaryjnej wybierz wykryty gateway w aplikacji iOS (lub włącz
Ręczny host i wpisz host/port), a następnie zatwierdź żądanie na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node`
bez żądanych zakresów. Parowanie operatora/przeglądarki oraz każda zmiana roli, zakresu, metadanych lub
klucza publicznego nadal wymagają ręcznego zatwierdzenia.

5. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Powiadomienia push oparte na przekaźniku dla oficjalnych kompilacji

Oficjalnie dystrybuowane kompilacje iOS używają zewnętrznego przekaźnika push zamiast publikować surowy token APNs
do gatewaya.

Oficjalne kompilacje App Store z publicznej ścieżki wydań używają hostowanego przekaźnika pod `https://ios-push-relay.openclaw.ai`.

Własne wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki kompilacji/wdrożenia iOS, której URL przekaźnika pasuje do URL przekaźnika gatewaya. Publiczna ścieżka wydania App Store nie akceptuje niestandardowych nadpisań URL przekaźnika. Jeśli używasz własnej kompilacji z przekaźnikiem, ustaw pasujący URL przekaźnika gatewaya:

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

- Aplikacja iOS rejestruje się w przekaźniku przy użyciu App Attest oraz JWS transakcji aplikacji StoreKit.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz uprawnienie wysyłki ograniczone do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gatewaya i dołącza ją do rejestracji w przekaźniku, dzięki czemu rejestracja oparta na przekaźniku jest delegowana do tego konkretnego gatewaya.
- Aplikacja przekazuje tę rejestrację opartą na przekaźniku do sparowanego gatewaya przez `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika dla `push.test`, wybudzeń w tle i impulsów wybudzających.
- Niestandardowe URL-e przekaźnika gatewaya muszą pasować do URL przekaźnika wbudowanego w kompilację iOS.
- Jeśli aplikacja później połączy się z innym gatewayem albo z kompilacją o innym bazowym URL przekaźnika, odświeży rejestrację w przekaźniku zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu przekaźnika dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla oficjalnych wysyłek z App Store opartych na przekaźniku.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną aplikację iOS.
2. Opcjonalnie: ustaw `gateway.push.apns.relay.baseUrl` na gatewayu tylko wtedy, gdy używasz celowo oddzielnej własnej kompilacji z przekaźnikiem.
3. Sparuj aplikację z gatewayem i pozwól jej zakończyć łączenie.
4. Aplikacja automatycznie publikuje `push.apns.register`, gdy ma token APNs, sesja operatora jest połączona, a rejestracja w przekaźniku powiedzie się.
5. Potem `push.test`, wybudzenia ponownego połączenia i impulsy wybudzające mogą używać zapisanej rejestracji opartej na przekaźniku.

## Sygnały aktywności w tle

Gdy iOS wybudza aplikację dla cichego powiadomienia push, odświeżenia w tle lub zdarzenia znaczącej zmiany lokalizacji, aplikacja
próbuje krótkiego ponownego połączenia węzła, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego węzła/urządzenia tylko
po poznaniu uwierzytelnionej tożsamości urządzenia węzła.

Aplikacja traktuje wybudzenie w tle jako pomyślnie zapisane tylko wtedy, gdy odpowiedź gatewaya zawiera
`handled: true`. Starsze gatewaye mogą potwierdzać `node.event` przez `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej widoczności.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gatewaya.
- Publiczna ścieżka wydania App Store odrzuca `OPENCLAW_PUSH_RELAY_BASE_URL` dla kompilacji iOS.

## Uwierzytelnianie i przepływ zaufania

Przekaźnik istnieje, aby wymusić dwa ograniczenia, których bezpośrednie APNs na gatewayu nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko oryginalne kompilacje OpenClaw iOS dystrybuowane przez Apple mogą używać hostowanego przekaźnika.
- Gateway może wysyłać powiadomienia push oparte na przekaźniku tylko do urządzeń iOS sparowanych z tym konkretnym
  gatewayem.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z gatewayem przez normalny przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję węzła oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS.
   - Rejestracja zawiera dowód App Attest oraz JWS transakcji aplikacji StoreKit.
   - Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To blokuje lokalnym kompilacjom Xcode/deweloperskim używanie hostowanego przekaźnika. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez przekaźnik.

3. `gateway identity delegation`
   - Przed rejestracją w przekaźniku aplikacja pobiera tożsamość sparowanego gatewaya z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gatewaya do ładunku rejestracji w przekaźniku.
   - Przekaźnik zwraca uchwyt przekaźnika oraz uprawnienie wysyłki ograniczone do rejestracji, które są delegowane do
     tej tożsamości gatewaya.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłki z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i impulsach wybudzających gateway podpisuje żądanie wysyłki własną
     tożsamością urządzenia.
   - Przekaźnik weryfikuje zarówno zapisane uprawnienie wysyłki, jak i podpis gatewaya względem delegowanej
     tożsamości gatewaya z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.

5. `relay -> APNs`
   - Przekaźnik posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie zapisuje surowego tokenu APNs dla oficjalnych kompilacji opartych na przekaźniku.
   - Przekaźnik wysyła końcowe powiadomienie push do APNs w imieniu sparowanego gatewaya.

Dlaczego utworzono ten projekt:

- Aby trzymać produkcyjne poświadczenia APNs poza gatewayami użytkowników.
- Aby uniknąć zapisywania surowych tokenów APNs oficjalnych kompilacji na gatewayu.
- Aby pozwolić na używanie hostowanego przekaźnika tylko przez oficjalne kompilacje OpenClaw iOS.
- Aby uniemożliwić jednemu gatewayowi wysyłanie powiadomień wybudzających do urządzeń iOS należących do innego gatewaya.

Kompilacje lokalne/ręczne pozostają przy bezpośrednim APNs. Jeśli testujesz te kompilacje bez przekaźnika,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

To są zmienne env czasu działania hosta gatewaya, nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect, takie jak `APP_STORE_CONNECT_KEY_ID` i
`APP_STORE_CONNECT_ISSUER_ID`; nie konfiguruje bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane przechowywanie na hoście gatewaya:

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

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, gdy skonfigurowano, tę samą
szerokoobszarową domenę wykrywania DNS-SD. Gatewaye w tym samym LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu sygnału.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby uzyskać przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Ręczny host** i wpisz host gatewaya + port (domyślnie `18789`).

## Canvas + A2UI

Węzeł iOS renderuje płótno WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host Canvas Gateway udostępnia `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest obsługiwany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Węzeł iOS zachowuje wbudowany szkielet jako domyślny widok po połączeniu. `canvas.a2ui.push` i `canvas.a2ui.reset` używają dołączonej strony A2UI należącej do aplikacji.
- Zdalne strony A2UI Gateway są na iOS tylko do renderowania; natywne akcje przycisków A2UI są akceptowane tylko z dołączonych stron należących do aplikacji.
- Wróć do wbudowanego szkieletu przez `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilną powierzchnią węzła, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` kontrolują lokalny pulpit macOS przez narzędzia MCP;
aplikacja iOS udostępnia możliwości iPhone'a przez polecenia węzła OpenClaw,
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia
węzła, ale te wywołania przechodzą przez protokół węzła gatewaya i podlegają limitom iOS
dla pierwszego planu/tła. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do lokalnego sterowania pulpitem, a tej strony do możliwości węzła iOS.

### Eval / migawka Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosem + tryb rozmowy

- Wybudzanie głosem i tryb rozmowy są dostępne w Ustawieniach.
- Rozmowa OpenAI w czasie rzeczywistym używa należącego do klienta WebRTC, gdy `talk.realtime.transport` ma wartość `webrtc`; jawna konfiguracja `gateway-relay` pozostaje własnością Gateway. Zobacz [Tryb rozmowy](/pl/nodes/talk).
- Węzły iOS obsługujące rozmowę ogłaszają funkcję `talk` i mogą deklarować
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`;
  Gateway domyślnie zezwala na te polecenia push-to-talk dla zaufanych
  węzłów obsługujących rozmowę.
- iOS może wstrzymywać dźwięk w tle; traktuj funkcje głosowe jako działające na zasadzie najlepszych starań, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamera/ekran tego wymagają).
- `A2UI_HOST_UNAVAILABLE`: dołączona strona A2UI była nieosiągalna w WebView aplikacji; pozostaw aplikację na pierwszym planie na karcie Ekran i spróbuj ponownie.
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie udaje się po ponownej instalacji: token parowania w Keychain został wyczyszczony; sparuj węzeł ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
