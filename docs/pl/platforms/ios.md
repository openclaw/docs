---
read_when:
    - Parowanie lub ponowne łączenie node iOS
    - Uruchamianie aplikacji iOS ze źródeł
    - Debugowanie wykrywania gateway lub poleceń canvas
summary: 'Aplikacja iOS node: połączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-04-05T14:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# Aplikacja iOS (Node)

Dostępność: wewnętrzny podgląd. Aplikacja iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości node: Canvas, migawkę ekranu, przechwytywanie aparatu, lokalizację, tryb rozmowy, wybudzanie głosowe.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia stanu node.

## Wymagania

- Gateway uruchomiona na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (fallback).

## Szybki start (parowanie + połączenie)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykrytą gateway (lub włącz Manual Host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponowi próbę parowania ze zmienionymi danymi auth (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostanie zastąpione i utworzony zostanie nowy `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na relay dla oficjalnych buildów

Oficjalne dystrybuowane buildy iOS używają zewnętrznego push relay zamiast publikować surowy token APNs
do gateway.

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

- Aplikacja iOS rejestruje się w relay przy użyciu App Attest i paragonu aplikacji.
- Relay zwraca nieprzezroczysty uchwyt relay oraz uprawnienie wysyłki o zakresie rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanej gateway i uwzględnia ją w rejestracji relay, dzięki czemu rejestracja oparta na relay jest delegowana do tej konkretnej gateway.
- Aplikacja przekazuje tę rejestrację opartą na relay do sparowanej gateway przez `push.apns.register`.
- Gateway używa zapisanego uchwytu relay dla `push.test`, wybudzeń w tle i impulsów wybudzania.
- Base URL relay w gateway musi odpowiadać adresowi URL relay wbudowanemu w oficjalny/TestFlight build iOS.
- Jeśli aplikacja później połączy się z inną gateway lub buildem z innym base URL relay, odświeży rejestrację relay zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu relay dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla wysyłek relay-backed z oficjalnych/TestFlight buildów.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalny/TestFlight build iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` w gateway.
3. Sparuj aplikację z gateway i pozwól jej zakończyć łączenie.
4. Aplikacja automatycznie publikuje `push.apns.register`, gdy ma już token APNs, sesja operatora jest połączona, a rejestracja relay zakończy się powodzeniem.
5. Następnie `push.test`, wybudzenia przy ponownym połączeniu i impulsy wybudzania mogą używać zapisanej rejestracji opartej na relay.

Uwaga o zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gateway.

## Przepływ uwierzytelniania i zaufania

Relay istnieje po to, aby wymuszać dwa ograniczenia, których bezpośredni APNs w gateway nie może zapewnić dla
oficjalnych buildów iOS:

- Tylko prawdziwe buildy OpenClaw iOS dystrybuowane przez Apple mogą używać hostowanego relay.
- Gateway może wysyłać push oparty na relay tylko do urządzeń iOS sparowanych z tą konkretną
  gateway.

Etap po etapie:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z gateway przez zwykły przepływ auth Gateway.
   - Daje to aplikacji uwierzytelnioną sesję node oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje endpointy rejestracji relay przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz paragon aplikacji.
   - Relay waliduje bundle ID, dowód App Attest i paragon Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalne buildy Xcode/dev przed użyciem hostowanego relay. Lokalny build może być
     podpisany, ale nie spełnia wymagań dotyczących oficjalnego dowodu dystrybucji Apple, których oczekuje relay.

3. `gateway identity delegation`
   - Przed rejestracją relay aplikacja pobiera tożsamość sparowanej gateway z
     `gateway.identity.get`.
   - Aplikacja uwzględnia tę tożsamość gateway w ładunku rejestracji relay.
   - Relay zwraca uchwyt relay i uprawnienie wysyłki o zakresie rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt relay i uprawnienie wysyłki z `push.apns.register`.
   - Przy `push.test`, wybudzeniach przy ponownym połączeniu i impulsach wybudzania gateway podpisuje żądanie wysyłki własną
     tożsamością urządzenia.
   - Relay weryfikuje zarówno zapisane uprawnienie wysyłki, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inna gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.

5. `relay -> APNs`
   - Relay posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnego builda.
   - Gateway nigdy nie przechowuje surowego tokenu APNs dla oficjalnych buildów relay-backed.
   - Relay wysyła końcowy push do APNs w imieniu sparowanej gateway.

Dlaczego powstał taki projekt:

- Aby trzymać produkcyjne poświadczenia APNs poza gateway użytkowników.
- Aby unikać przechowywania surowych tokenów APNs oficjalnych buildów na gateway.
- Aby umożliwiać korzystanie z hostowanego relay tylko oficjalnym/TestFlight buildom OpenClaw.
- Aby uniemożliwić jednej gateway wysyłanie push wybudzających do urządzeń iOS należących do innej gateway.

Lokalne/ręczne buildy nadal używają bezpośredniego APNs. Jeśli testujesz takie buildy bez relay,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, jeśli skonfigurowano, tę samą
domenę wykrywania szerokoobszarowego DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie przez `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu beacon.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowane, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) oraz Tailscale split DNS.
Przykład CoreDNS znajdziesz w [Bonjour](/gateway/bonjour).

### Ręczny host/port

W Ustawieniach włącz **Manual Host** i wpisz host + port gateway (domyślnie `18789`).

## Canvas + A2UI

Node iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Canvas host Gateway udostępnia `/__openclaw__/canvas/` oraz `/__openclaw__/a2ui/`.
- Jest udostępniany przez serwer HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Powrót do wbudowanego scaffoldu przez `canvas.navigate` i `{"url":""}`.

### Canvas eval / snapshot

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

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/camera/screen tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie zareklamowała URL hosta canvas; sprawdź `canvasHost` w [Gateway configuration](/gateway/configuration).
- Monit o parowanie nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie działa po reinstalacji: token parowania w Keychain został wyczyszczony; sparuj node ponownie.

## Powiązane dokumenty

- [Pairing](/pl/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
