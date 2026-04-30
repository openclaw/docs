---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Uruchamianie aplikacji iOS z kodu źródłowego
    - Debugowanie wykrywania Gateway lub poleceń canvas
summary: 'Aplikacja Node na iOS: łączenie z Gateway, parowanie, kanwa i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-04-30T10:04:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: wewnętrzny podgląd. Aplikacja na iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, zrzut ekranu, przechwytywanie z kamery, lokalizacja, tryb rozmowy, wybudzanie głosowe.
- Odbiera polecenia `node.invoke` i zgłasza zdarzenia statusu węzła.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (awaryjnie).

## Szybki start (sparuj + połącz)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykryty gateway (albo włącz Ręczny host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście gatewaya:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Opcjonalnie: jeśli węzeł iOS zawsze łączy się z ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie węzła przy pierwszym użyciu za pomocą jawnych CIDR-ów lub dokładnych adresów IP:

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

Oficjalnie dystrybuowane kompilacje iOS używają zewnętrznego przekaźnika push zamiast publikować surowy token APNs
do gatewaya.

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

Jak działa przepływ:

- Aplikacja iOS rejestruje się w przekaźniku przy użyciu App Attest oraz JWS transakcji aplikacji StoreKit.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz uprawnienie wysyłki ograniczone do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gatewaya i dołącza ją do rejestracji w przekaźniku, dzięki czemu rejestracja oparta na przekaźniku jest delegowana do tego konkretnego gatewaya.
- Aplikacja przekazuje tę rejestrację opartą na przekaźniku do sparowanego gatewaya przez `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika dla `push.test`, wybudzeń w tle i impulsów wybudzania.
- Bazowy URL przekaźnika gatewaya musi pasować do URL-a przekaźnika wbudowanego w oficjalną/TestFlight kompilację iOS.
- Jeśli aplikacja później połączy się z innym gatewayem albo kompilacją z innym bazowym URL-em przekaźnika, odświeży rejestrację w przekaźniku zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu przekaźnika dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na przekaźniku.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną/TestFlight kompilację iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` na gatewayu.
3. Sparuj aplikację z gatewayem i pozwól jej zakończyć łączenie.
4. Aplikacja automatycznie publikuje `push.apns.register`, gdy ma token APNs, sesja operatora jest połączona, a rejestracja w przekaźniku zakończy się powodzeniem.
5. Następnie `push.test`, wybudzenia ponownego połączenia i impulsy wybudzania mogą używać zapisanej rejestracji opartej na przekaźniku.

## Sygnały aktywności w tle

Gdy iOS wybudza aplikację dla cichego push, odświeżania w tle lub zdarzenia znaczącej zmiany lokalizacji, aplikacja
próbuje wykonać krótkie ponowne połączenie węzła, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego węzła/urządzenia dopiero
po poznaniu uwierzytelnionej tożsamości urządzenia węzła.

Aplikacja uznaje wybudzenie w tle za pomyślnie zarejestrowane tylko wtedy, gdy odpowiedź gatewaya zawiera
`handled: true`. Starsze gatewaye mogą potwierdzać `node.event` przez `{ "ok": true }`; taka odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej widoczności.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gatewaya.

## Przepływ uwierzytelniania i zaufania

Przekaźnik istnieje, aby egzekwować dwa ograniczenia, których bezpośrednie APNs na gatewayu nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko autentyczne kompilacje OpenClaw na iOS dystrybuowane przez Apple mogą używać hostowanego przekaźnika.
- Gateway może wysyłać push oparte na przekaźniku tylko do urządzeń iOS sparowanych z tym konkretnym
  gatewayem.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z gatewayem przez standardowy przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję węzła oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz JWS transakcji aplikacji StoreKit.
   - Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To blokuje lokalnym kompilacjom Xcode/deweloperskim możliwość używania hostowanego przekaźnika. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez przekaźnik.

3. `gateway identity delegation`
   - Przed rejestracją w przekaźniku aplikacja pobiera tożsamość sparowanego gatewaya z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gatewaya do ładunku rejestracji w przekaźniku.
   - Przekaźnik zwraca uchwyt przekaźnika i uprawnienie wysyłki ograniczone do rejestracji, delegowane do
     tej tożsamości gatewaya.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłki z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i impulsach wybudzania gateway podpisuje żądanie wysyłki swoją
     własną tożsamością urządzenia.
   - Przekaźnik weryfikuje zarówno zapisane uprawnienie wysyłki, jak i podpis gatewaya względem delegowanej
     tożsamości gatewaya z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób pozyska uchwyt.

5. `relay -> APNs`
   - Przekaźnik posiada produkcyjne dane uwierzytelniające APNs oraz surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie przechowuje surowego tokenu APNs dla oficjalnych kompilacji opartych na przekaźniku.
   - Przekaźnik wysyła końcowy push do APNs w imieniu sparowanego gatewaya.

Dlaczego powstał ten projekt:

- Aby trzymać produkcyjne dane uwierzytelniające APNs poza gatewayami użytkowników.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych kompilacji na gatewayu.
- Aby pozwolić na użycie hostowanego przekaźnika tylko oficjalnym/TestFlight kompilacjom OpenClaw.
- Aby zapobiec wysyłaniu przez jeden gateway push wybudzających do urządzeń iOS należących do innego gatewaya.

Lokalne/ręczne kompilacje pozostają przy bezpośrednim APNs. Jeśli testujesz te kompilacje bez przekaźnika,
gateway nadal potrzebuje bezpośrednich danych uwierzytelniających APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

To są runtime env vars hosta gatewaya, nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane miejsce przechowywania na hoście gatewaya:

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
domenę wykrywania wide-area DNS-SD. Gatewaye w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny wide-area bez zmiany typu beacona.

### Tailnet (między sieciami)

Jeśli mDNS jest zablokowane, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby uzyskać przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Ręczny host** i wpisz host gatewaya + port (domyślnie `18789`).

## Canvas + A2UI

Węzeł iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway serwuje `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest serwowany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Węzeł iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Wróć do wbudowanego szkieletu przez `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilną powierzchnią węzła, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS przez narzędzia MCP;
aplikacja iOS udostępnia możliwości iPhone’a przez polecenia węzła OpenClaw,
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia węzła,
ale te wywołania przechodzą przez protokół węzła gatewaya i podlegają limitom iOS
na pierwszym planie/w tle. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do sterowania lokalnym pulpitem, a tej strony do możliwości węzła iOS.

### Eval canvas / zrzut

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosowe + tryb rozmowy

- Wybudzanie głosowe i tryb rozmowy są dostępne w Ustawieniach.
- iOS może wstrzymywać dźwięk w tle; traktuj funkcje głosowe jako best-effort, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamery/ekranu tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie zareklamował URL-a hosta canvas; sprawdź `canvasHost` w [konfiguracji Gateway](/pl/gateway/configuration).
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie działa po reinstalacji: token parowania Keychain został wyczyszczony; sparuj węzeł ponownie.

## Powiązane dokumenty

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
