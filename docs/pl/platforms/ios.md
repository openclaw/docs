---
read_when:
    - Parujesz ponownie lub ponownie łączysz węzeł iOS
    - Uruchamiasz aplikację iOS ze źródeł
    - Debugujesz wykrywanie gateway lub polecenia canvas
summary: 'Aplikacja węzła iOS: łączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-04-07T09:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# Aplikacja iOS (węzeł)

Dostępność: wewnętrzny podgląd. Aplikacja iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości węzła: Canvas, migawka ekranu, przechwytywanie z kamery, lokalizacja, tryb rozmowy, wybudzanie głosowe.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia stanu węzła.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - ta sama sieć LAN przez Bonjour, **lub**
  - tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **lub**
  - ręcznie podany host/port (tryb awaryjny).

## Szybki start (parowanie + łączenie)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Settings i wybierz wykryty gateway (lub włącz Manual Host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push przez relay dla oficjalnych buildów

Oficjalnie dystrybuowane buildy iOS używają zewnętrznego relay push zamiast publikować surowy token APNs
do gateway.

Wymaganie po stronie gateway:

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

- Aplikacja iOS rejestruje się w relay przy użyciu App Attest i app receipt.
- Relay zwraca nieprzezroczysty relay handle oraz uprawnienie do wysyłki w zakresie rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gateway i dołącza ją do rejestracji relay, dzięki czemu rejestracja oparta na relay jest delegowana do tego konkretnego gateway.
- Aplikacja przekazuje tę rejestrację opartą na relay do sparowanego gateway za pomocą `push.apns.register`.
- Gateway używa zapisanego relay handle dla `push.test`, wybudzeń w tle i impulsów wybudzających.
- Bazowy URL relay gateway musi być zgodny z URL relay wbudowanym w oficjalny/TestFlight build iOS.
- Jeśli aplikacja później połączy się z innym gateway lub z buildem mającym inny bazowy URL relay, odświeży rejestrację relay zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje w tej ścieżce:

- Brak tokenu relay dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na relay.

Oczekiwany przepływ dla operatora:

1. Zainstaluj oficjalny/TestFlight build iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` na gateway.
3. Sparuj aplikację z gateway i poczekaj, aż zakończy łączenie.
4. Aplikacja publikuje `push.apns.register` automatycznie po uzyskaniu tokenu APNs, po połączeniu sesji operatora i po udanej rejestracji relay.
5. Po tym `push.test`, wybudzenia przy ponownym łączeniu i impulsy wybudzające mogą używać zapisanej rejestracji opartej na relay.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie środowiskowe dla gateway.

## Przepływ uwierzytelniania i zaufania

Relay istnieje po to, aby wymuszać dwa ograniczenia, których bezpośredni APNs na gateway nie może zapewnić dla
oficjalnych buildów iOS:

- Tylko autentyczne buildy iOS OpenClaw dystrybuowane przez Apple mogą używać hostowanego relay.
- Gateway może wysyłać push oparty na relay tylko do urządzeń iOS, które sparowały się z tym konkretnym
  gateway.

Krok po kroku:

1. `Aplikacja iOS -> gateway`
   - Aplikacja najpierw paruje się z gateway przez zwykły przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję węzła oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `Aplikacja iOS -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji relay przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz app receipt.
   - Relay weryfikuje bundle ID, dowód App Attest i Apple receipt oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalne buildy Xcode/deweloperskie przed użyciem hostowanego relay. Lokalny build może być
     podpisany, ale nie spełnia wymogów oficjalnego dowodu dystrybucji Apple oczekiwanego przez relay.

3. `Delegacja tożsamości gateway`
   - Przed rejestracją relay aplikacja pobiera tożsamość sparowanego gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gateway do ładunku rejestracyjnego relay.
   - Relay zwraca relay handle oraz uprawnienie do wysyłki w zakresie rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje relay handle i uprawnienie do wysyłki z `push.apns.register`.
   - Przy `push.test`, wybudzeniach przy ponownym łączeniu i impulsach wybudzających gateway podpisuje żądanie wysyłki swoją
     własną tożsamością urządzenia.
   - Relay weryfikuje zarówno zapisane uprawnienie do wysyłki, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inny gateway nie może ponownie użyć zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska handle.

5. `relay -> APNs`
   - Relay posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnego buildu.
   - Gateway nigdy nie zapisuje surowego tokenu APNs dla oficjalnych buildów opartych na relay.
   - Relay wysyła końcowy push do APNs w imieniu sparowanego gateway.

Dlaczego powstał ten projekt:

- Aby utrzymać produkcyjne poświadczenia APNs poza gateway użytkownika.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych buildów na gateway.
- Aby umożliwić użycie hostowanego relay tylko dla oficjalnych/TestFlight buildów OpenClaw.
- Aby uniemożliwić jednemu gateway wysyłanie push wybudzających do urządzeń iOS należących do innego gateway.

Lokalne/ręczne buildy nadal używają bezpośredniego APNs. Jeśli testujesz takie buildy bez relay,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne środowiskowe runtime hosta gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych buildów iOS.

Zalecane przechowywanie na hoście gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie zatwierdzaj pliku `.p8` do repozytorium ani nie umieszczaj go w checkout repo.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, jeśli jest skonfigurowana, tę samą
domenę wykrywania wide-area DNS-SD. Gatewaye w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny wide-area bez zmiany typu beacona.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby zapoznać się z przykładem CoreDNS.

### Ręczny host/port

W Settings włącz **Manual Host** i wpisz host gateway + port (domyślnie `18789`).

## Canvas + A2UI

Węzeł iOS renderuje canvas w WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway udostępnia `/__openclaw__/canvas/` oraz `/__openclaw__/a2ui/`.
- Jest obsługiwany przez serwer HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Węzeł iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Aby wrócić do wbudowanego scaffoldu, użyj `canvas.navigate` z `{"url":""}`.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosowe + tryb rozmowy

- Wybudzanie głosowe i tryb rozmowy są dostępne w Settings.
- iOS może wstrzymywać dźwięk w tle; funkcje głosowe należy traktować jako best-effort, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/camera/screen tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie reklamował URL hosta canvas; sprawdź `canvasHost` w [konfiguracji Gateway](/pl/gateway/configuration).
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne łączenie nie działa po reinstalacji: token parowania w Keychain został wyczyszczony; sparuj węzeł ponownie.

## Powiązana dokumentacja

- [Pairing](/pl/channels/pairing)
- [Discovery](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
