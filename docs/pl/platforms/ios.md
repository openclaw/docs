---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Uruchamianie aplikacji iOS z kodu źródłowego
    - Debugowanie wykrywania Gateway lub poleceń canvas
summary: 'Aplikacja węzła iOS: łączenie z Gateway, parowanie, kanwa i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-05-07T13:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: wewnętrzny podgląd. Aplikacja iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia funkcje Node: Canvas, zrzut ekranu, przechwytywanie obrazu z kamery, lokalizację, tryb rozmowy, wybudzanie głosem.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia statusu Node.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (awaryjnie).

## Szybki start (parowanie + połączenie)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Ustawienia i wybierz wykryty gateway (albo włącz Manual Host i wprowadź host/port).

3. Zatwierdź żądanie parowania na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`.
Uruchom `openclaw devices list` ponownie przed zatwierdzeniem.

Opcjonalnie: jeśli Node iOS zawsze łączy się ze ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie Node przy pierwszym użyciu, podając jawne CIDR-y lub dokładne adresy IP:

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

## Push oparty na relay dla oficjalnych kompilacji

Oficjalnie dystrybuowane kompilacje iOS używają zewnętrznego relay push zamiast publikowania surowego tokenu APNs
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

Jak działa przepływ:

- Aplikacja iOS rejestruje się w relay przy użyciu App Attest oraz JWS transakcji aplikacji StoreKit.
- Relay zwraca nieprzezroczysty uchwyt relay oraz grant wysyłania ograniczony do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gateway i dołącza ją do rejestracji relay, dzięki czemu rejestracja oparta na relay jest delegowana do tego konkretnego gateway.
- Aplikacja przekazuje tę rejestrację opartą na relay do sparowanego gateway za pomocą `push.apns.register`.
- Gateway używa zapisanego uchwytu relay dla `push.test`, wybudzeń w tle i impulsów wybudzających.
- Bazowy URL relay w gateway musi odpowiadać URL relay wbudowanemu w oficjalną/TestFlight kompilację iOS.
- Jeśli aplikacja później połączy się z innym gateway albo z kompilacją z innym bazowym URL relay, odświeży rejestrację relay zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu relay obejmującego całe wdrożenie.
- Brak bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na relay.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną/TestFlight kompilację iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` w gateway.
3. Sparuj aplikację z gateway i pozwól jej zakończyć łączenie.
4. Aplikacja publikuje `push.apns.register` automatycznie po uzyskaniu tokenu APNs, połączeniu sesji operatora i powodzeniu rejestracji relay.
5. Następnie `push.test`, wybudzenia ponownego połączenia i impulsy wybudzające mogą używać zapisanej rejestracji opartej na relay.

## Sygnały aktywności w tle

Gdy iOS wybudza aplikację dla cichego push, odświeżenia w tle albo zdarzenia znaczącej zmiany lokalizacji, aplikacja
próbuje wykonać krótkie ponowne połączenie Node, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego Node/urządzenia dopiero
po ustaleniu uwierzytelnionej tożsamości urządzenia Node.

Aplikacja traktuje wybudzenie w tle jako pomyślnie zapisane tylko wtedy, gdy odpowiedź gateway zawiera
`handled: true`. Starsze gateway mogą potwierdzać `node.event` przez `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej obecności.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gateway.

## Przepływ uwierzytelniania i zaufania

Relay istnieje po to, aby wymusić dwa ograniczenia, których bezpośrednie APNs na gateway nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko prawdziwe kompilacje OpenClaw iOS dystrybuowane przez Apple mogą używać hostowanego relay.
- Gateway może wysyłać push oparty na relay tylko dla urządzeń iOS sparowanych z tym konkretnym
  gateway.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z gateway przez normalny przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję Node oraz uwierzytelnioną sesję operatora.
   - Sesja operatora służy do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji relay przez HTTPS.
   - Rejestracja zawiera dowód App Attest oraz JWS transakcji aplikacji StoreKit.
   - Relay weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalnym kompilacjom Xcode/deweloperskim używanie hostowanego relay. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez relay.

3. `gateway identity delegation`
   - Przed rejestracją relay aplikacja pobiera tożsamość sparowanego gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gateway do ładunku rejestracji relay.
   - Relay zwraca uchwyt relay i grant wysyłania ograniczony do rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt relay i grant wysyłania z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i impulsach wybudzających gateway podpisuje żądanie wysyłki swoją
     własną tożsamością urządzenia.
   - Relay weryfikuje zarówno zapisany grant wysyłania, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.

5. `relay -> APNs`
   - Relay posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie przechowuje surowego tokenu APNs dla oficjalnych kompilacji opartych na relay.
   - Relay wysyła końcowy push do APNs w imieniu sparowanego gateway.

Dlaczego powstał ten projekt:

- Aby utrzymać produkcyjne poświadczenia APNs poza gateway użytkowników.
- Aby uniknąć przechowywania surowych tokenów APNs oficjalnych kompilacji na gateway.
- Aby umożliwić użycie hostowanego relay tylko dla oficjalnych/TestFlight kompilacji OpenClaw.
- Aby zapobiec wysyłaniu przez jeden gateway push wybudzających do urządzeń iOS należących do innego gateway.

Lokalne/ręczne kompilacje pozostają przy bezpośrednim APNs. Jeśli testujesz takie kompilacje bez relay,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

To są runtime env vars hosta gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane miejsce przechowywania na hoście gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie commituj pliku `.p8` ani nie umieszczaj go w katalogu checkout repo.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, gdy jest skonfigurowana, tę samą
domenę wykrywania szerokoobszarowego DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu sygnału.

### Tailnet (między sieciami)

Jeśli mDNS jest zablokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby znaleźć przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Manual Host** i wprowadź host gateway + port (domyślnie `18789`).

## Canvas + A2UI

Node iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host Canvas Gateway udostępnia `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest serwowany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS automatycznie przechodzi do A2UI po połączeniu, gdy reklamowany jest URL hosta canvas.
- Wróć do wbudowanego szkieletu przez `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilną powierzchnią Node, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS przez narzędzia MCP;
aplikacja iOS udostępnia funkcje iPhone przez polecenia Node OpenClaw
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia Node,
ale te wywołania przechodzą przez protokół gateway Node i podlegają ograniczeniom iOS
dla pierwszego planu/tła. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do sterowania lokalnym pulpitem, a tej strony do funkcji Node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosem + tryb rozmowy

- Wybudzanie głosem i tryb rozmowy są dostępne w Ustawieniach.
- Node iOS obsługujące rozmowę reklamują funkcję `talk` i mogą deklarować
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`;
  Gateway domyślnie zezwala na te polecenia push-to-talk dla zaufanych
  Node obsługujących rozmowę.
- iOS może zawieszać dźwięk w tle; traktuj funkcje głosowe jako działające według najlepszych możliwości, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamery/ekranu tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie zareklamował URL powierzchni Plugin Canvas; sprawdź `plugins.entries.canvas.config.host` w [konfiguracji Gateway](/pl/gateway/configuration).
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie kończy się niepowodzeniem po ponownej instalacji: token parowania Keychain został wyczyszczony; sparuj Node ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
