---
read_when:
    - Parowanie lub ponowne łączenie Node iOS
    - Uruchamianie aplikacji iOS ze źródeł
    - Debugowanie wykrywania gateway lub poleceń canvas
summary: 'Aplikacja iOS Node: połączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-04-24T09:20:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Dostępność: wewnętrzna wersja preview. Aplikacja iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości Node: Canvas, snapshot ekranu, przechwytywanie z kamery, lokalizację, tryb Talk, wybudzanie głosem.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia stanu Node.

## Wymagania

- Gateway działający na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ten sam LAN przez Bonjour, **lub**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **lub**
  - Ręczny host/port (fallback).

## Szybki start (parowanie + połączenie)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykryty gateway (albo włącz Manual Host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami auth (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na relay dla oficjalnych kompilacji

Oficjalne dystrybuowane kompilacje iOS używają zewnętrznego relay push zamiast publikować surowy token APNs
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

- Aplikacja iOS rejestruje się w relay przy użyciu App Attest i receipt aplikacji.
- Relay zwraca nieprzezroczysty uchwyt relay oraz uprawnienie wysyłki ograniczone do tej rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gateway i dołącza ją do rejestracji relay, dzięki czemu rejestracja oparta na relay jest delegowana do tego konkretnego gateway.
- Aplikacja przekazuje tę rejestrację opartą na relay do sparowanego gateway przez `push.apns.register`.
- Gateway używa zapisanego uchwytu relay do `push.test`, wybudzeń w tle i nudges wybudzających.
- Bazowy URL relay gateway musi odpowiadać URL relay wkompilowanemu w oficjalną/TestFlight kompilację iOS.
- Jeśli aplikacja później połączy się z innym gateway albo kompilacją z innym bazowym URL relay, odświeży rejestrację relay zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu relay dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na relay.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną/TestFlight kompilację iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` na gateway.
3. Sparuj aplikację z gateway i pozwól jej zakończyć łączenie.
4. Aplikacja automatycznie publikuje `push.apns.register`, gdy ma token APNs, połączoną sesję operatora i gdy rejestracja relay zakończy się sukcesem.
5. Po tym `push.test`, wybudzenia ponownego połączenia i wake nudges mogą używać zapisanej rejestracji opartej na relay.

Uwaga o zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gateway.

## Przepływ uwierzytelniania i zaufania

Relay istnieje po to, by wymusić dwa ograniczenia, których bezpośredni APNs-na-gateway nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko prawdziwe kompilacje OpenClaw iOS dystrybuowane przez Apple mogą korzystać z hostowanego relay.
- Gateway może wysyłać push oparty na relay tylko do urządzeń iOS, które sparowały się z tym konkretnym
  gateway.

Skok po skoku:

1. `aplikacja iOS -> gateway`
   - Aplikacja najpierw paruje się z gateway przez normalny przepływ auth Gateway.
   - Daje to aplikacji uwierzytelnioną sesję node oraz uwierzytelnioną sesję operatora.
   - Sesja operatora jest używana do wywołania `gateway.identity.get`.

2. `aplikacja iOS -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji relay przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz receipt aplikacji.
   - Relay waliduje bundle ID, dowód App Attest i receipt Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalne kompilacje Xcode/dev przed użyciem hostowanego relay. Lokalna kompilacja może być
     podpisana, ale nie spełnia wymaganego przez relay dowodu oficjalnej dystrybucji Apple.

3. `delegowanie tożsamości gateway`
   - Przed rejestracją relay aplikacja pobiera tożsamość sparowanego gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gateway do ładunku rejestracji relay.
   - Relay zwraca uchwyt relay i uprawnienie wysyłki ograniczone do rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt relay i uprawnienie wysyłki z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i wake nudges gateway podpisuje żądanie wysyłki
     własną tożsamością urządzenia.
   - Relay weryfikuje zarówno zapisane uprawnienie wysyłki, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli jakoś uzyska uchwyt.

5. `relay -> APNs`
   - Relay posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie zapisuje surowego tokenu APNs dla oficjalnych kompilacji opartych na relay.
   - Relay wysyła końcowy push do APNs w imieniu sparowanego gateway.

Dlaczego powstał ten projekt:

- Aby utrzymać produkcyjne poświadczenia APNs poza gateway użytkowników.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych kompilacji na gateway.
- Aby umożliwić użycie hostowanego relay tylko dla oficjalnych/TestFlight kompilacji OpenClaw.
- Aby uniemożliwić jednemu gateway wysyłanie wybudzających pushy do urządzeń iOS należących do innego gateway.

Lokalne/ręczne kompilacje pozostają przy bezpośrednim APNs. Jeśli testujesz takie kompilacje bez relay,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne środowiskowe runtime hosta gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
auth App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane przechowywanie na hoście gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie commituj pliku `.p8` ani nie umieszczaj go w checkout repozytorium.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` na `local.` oraz, jeśli jest skonfigurowane, tę samą
domenę wykrywania szerokoobszarowego DNS-SD. Gateway w tym samym LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu beacona.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowane, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) oraz Tailscale split DNS.
Przykład z CoreDNS znajdziesz w [Bonjour](/pl/gateway/bonjour).

### Ręczny host/port

W Ustawieniach włącz **Manual Host** i wpisz host gateway + port (domyślnie `18789`).

## Canvas + A2UI

Node iOS renderuje canvas w WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway serwuje `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest serwowany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Wróć do wbudowanego scaffold przez `canvas.navigate` i `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + tryb Talk

- Voice wake i tryb Talk są dostępne w Ustawieniach.
- iOS może wstrzymywać audio w tle; traktuj funkcje głosowe jako best-effort, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/camera/screen tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie zareklamował URL hosta canvas; sprawdź `canvasHost` w [Konfiguracji Gateway](/pl/gateway/configuration).
- Prompt parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie działa po reinstalacji: token parowania w Keychain został wyczyszczony; sparuj Node ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
