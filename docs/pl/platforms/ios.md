---
read_when:
    - Parowanie lub ponowne łączenie węzła iOS
    - Uruchamianie aplikacji iOS ze źródeł
    - Debugowanie wykrywania Gateway lub poleceń canvas
summary: 'Aplikacja węzła iOS: łączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: Aplikacja iOS
x-i18n:
    generated_at: "2026-07-02T08:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Dostępność: kompilacje aplikacji na iPhone są dystrybuowane przez kanały Apple, gdy są włączone dla wydania. Lokalne kompilacje deweloperskie można też uruchamiać ze źródeł.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN lub tailnet).
- Udostępnia możliwości Node: Canvas, zrzut ekranu, przechwytywanie z kamery, lokalizacja, tryb rozmowy, wybudzanie głosowe.
- Odbiera polecenia `node.invoke` i zgłasza zdarzenia stanu Node.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux lub Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **lub**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **lub**
  - Ręczny host/port (awaryjnie).

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

Jeśli aplikacja ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Opcjonalnie: jeśli Node iOS zawsze łączy się z ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie Node przy pierwszym połączeniu, podając jawne CIDR lub dokładne adresy IP:

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
klucza publicznego nadal wymaga ręcznego zatwierdzenia.

4. Sprawdź połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na przekaźniku dla oficjalnych kompilacji

Oficjalnie dystrybuowane kompilacje iOS używają zewnętrznego przekaźnika push zamiast publikować surowy token APNs
do gateway.

Oficjalne kompilacje App Store z publicznej ścieżki wydawniczej używają hostowanego przekaźnika pod adresem `https://ios-push-relay.openclaw.ai`.

Niestandardowe wdrożenia przekaźnika wymagają celowo oddzielnej ścieżki kompilacji/wdrożenia iOS, której URL przekaźnika pasuje do URL przekaźnika gateway. Publiczna ścieżka wydawnicza App Store nie akceptuje niestandardowych nadpisań URL przekaźnika. Jeśli używasz niestandardowej kompilacji przekaźnika, ustaw pasujący URL przekaźnika gateway:

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

- Aplikacja iOS rejestruje się w przekaźniku, używając App Attest i transakcji aplikacji StoreKit w formacie JWS.
- Przekaźnik zwraca nieprzezroczysty uchwyt przekaźnika oraz uprawnienie wysyłania ograniczone do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gateway i dołącza ją do rejestracji przekaźnika, więc rejestracja oparta na przekaźniku jest delegowana do tego konkretnego gateway.
- Aplikacja przekazuje tę rejestrację opartą na przekaźniku do sparowanego gateway za pomocą `push.apns.register`.
- Gateway używa zapisanego uchwytu przekaźnika dla `push.test`, wybudzeń w tle i ponagleń wybudzenia.
- Niestandardowe URL-e przekaźnika gateway muszą pasować do URL przekaźnika wbudowanego w kompilację iOS.
- Jeśli aplikacja później połączy się z innym gateway albo kompilacją z innym bazowym URL przekaźnika, odświeży rejestrację przekaźnika zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Brak tokenu przekaźnika dla całego wdrożenia.
- Brak bezpośredniego klucza APNs dla oficjalnych wysyłek App Store opartych na przekaźniku.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalną aplikację iOS.
2. Opcjonalnie: ustaw `gateway.push.apns.relay.baseUrl` na gateway tylko wtedy, gdy używasz celowo oddzielnej niestandardowej kompilacji przekaźnika.
3. Sparuj aplikację z gateway i pozwól jej zakończyć łączenie.
4. Aplikacja automatycznie publikuje `push.apns.register`, gdy ma token APNs, sesja operatora jest połączona, a rejestracja przekaźnika powiedzie się.
5. Po tym `push.test`, wybudzenia ponownego połączenia i ponaglenia wybudzenia mogą używać zapisanej rejestracji opartej na przekaźniku.

## Sygnały aktywności w tle

Gdy iOS wybudzi aplikację przez cichy push, odświeżanie w tle lub zdarzenie znaczącej zmiany lokalizacji, aplikacja
próbuje krótkiego ponownego połączenia Node, a następnie wywołuje `node.event` z `event: "node.presence.alive"`.
Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego Node/urządzenia dopiero
po poznaniu uwierzytelnionej tożsamości urządzenia Node.

Aplikacja uznaje wybudzenie w tle za pomyślnie zapisane tylko wtedy, gdy odpowiedź gateway zawiera
`handled: true`. Starsze gateway mogą potwierdzać `node.event` za pomocą `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniego widzenia.

Uwaga dotycząca zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie env dla gateway.
- Publiczna ścieżka wydawnicza App Store odrzuca `OPENCLAW_PUSH_RELAY_BASE_URL` dla kompilacji iOS.

## Uwierzytelnianie i przepływ zaufania

Przekaźnik istnieje, aby wymusić dwa ograniczenia, których bezpośrednie APNs na gateway nie może zapewnić dla
oficjalnych kompilacji iOS:

- Tylko autentyczne kompilacje OpenClaw iOS dystrybuowane przez Apple mogą używać hostowanego przekaźnika.
- Gateway może wysyłać pushe oparte na przekaźniku tylko dla urządzeń iOS sparowanych z tym konkretnym
  gateway.

Krok po kroku:

1. `iOS app -> gateway`
   - Aplikacja najpierw paruje się z gateway przez normalny przepływ uwierzytelniania Gateway.
   - Daje to aplikacji uwierzytelnioną sesję Node oraz uwierzytelnioną sesję operatora.
   - Sesja operatora jest używana do wywołania `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikacja wywołuje punkty końcowe rejestracji przekaźnika przez HTTPS.
   - Rejestracja obejmuje dowód App Attest oraz transakcję aplikacji StoreKit w formacie JWS.
   - Przekaźnik weryfikuje identyfikator pakietu, dowód App Attest i dowód dystrybucji Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalnym kompilacjom Xcode/deweloperskim użycie hostowanego przekaźnika. Lokalna kompilacja może być
     podpisana, ale nie spełnia oficjalnego dowodu dystrybucji Apple oczekiwanego przez przekaźnik.

3. `gateway identity delegation`
   - Przed rejestracją przekaźnika aplikacja pobiera tożsamość sparowanego gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gateway do ładunku rejestracji przekaźnika.
   - Przekaźnik zwraca uchwyt przekaźnika i uprawnienie wysyłania ograniczone do rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje uchwyt przekaźnika i uprawnienie wysyłania z `push.apns.register`.
   - Przy `push.test`, wybudzeniach ponownego połączenia i ponagleniach wybudzenia gateway podpisuje żądanie wysyłki własną
     tożsamością urządzenia.
   - Przekaźnik weryfikuje zarówno zapisane uprawnienie wysyłania, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska uchwyt.

5. `relay -> APNs`
   - Przekaźnik posiada produkcyjne poświadczenia APNs oraz surowy token APNs dla oficjalnej kompilacji.
   - Gateway nigdy nie zapisuje surowego tokenu APNs dla oficjalnych kompilacji opartych na przekaźniku.
   - Przekaźnik wysyła końcowy push do APNs w imieniu sparowanego gateway.

Dlaczego powstał ten projekt:

- Aby utrzymać produkcyjne poświadczenia APNs poza gateway użytkowników.
- Aby uniknąć zapisywania surowych tokenów APNs oficjalnych kompilacji na gateway.
- Aby umożliwić użycie hostowanego przekaźnika tylko oficjalnym kompilacjom OpenClaw iOS.
- Aby uniemożliwić jednemu gateway wysyłanie pushy wybudzających do urządzeń iOS należących do innego gateway.

Lokalne/ręczne kompilacje pozostają przy bezpośrednim APNs. Jeśli testujesz te kompilacje bez przekaźnika,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne env środowiska wykonawczego hosta gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
uwierzytelnianie App Store Connect, takie jak `APP_STORE_CONNECT_KEY_ID` i
`APP_STORE_CONNECT_ISSUER_ID`; nie konfiguruje bezpośredniego dostarczania APNs dla lokalnych kompilacji iOS.

Zalecane przechowywanie na hoście gateway:

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
szerokoobszarową domenę wykrywania DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny szerokoobszarowej bez zmiany typu sygnału.

### Tailnet (między sieciami)

Jeśli mDNS jest zablokowany, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby uzyskać przykład CoreDNS.

### Ręczny host/port

W Ustawieniach włącz **Manual Host** i wpisz host gateway + port (domyślnie `18789`).

## Canvas + A2UI

Node iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway serwuje `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest serwowany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS utrzymuje wbudowany szkielet jako domyślny widok po połączeniu. `canvas.a2ui.push` i `canvas.a2ui.reset` używają dołączonej strony A2UI należącej do aplikacji.
- Zdalne strony Gateway A2UI są na iOS tylko renderowane; natywne akcje przycisków A2UI są akceptowane tylko ze stron dołączonych i należących do aplikacji.
- Wróć do wbudowanego szkieletu za pomocą `canvas.navigate` i `{"url":""}`.

## Relacja z Computer Use

Aplikacja iOS jest mobilną powierzchnią Node, a nie backendem Codex Computer Use. Codex
Computer Use i `cua-driver mcp` sterują lokalnym pulpitem macOS przez narzędzia MCP;
aplikacja iOS udostępnia możliwości iPhone przez polecenia Node OpenClaw,
takie jak `canvas.*`, `camera.*`, `screen.*`, `location.*` i `talk.*`.

Agenci nadal mogą obsługiwać aplikację iOS przez OpenClaw, wywołując polecenia
Node, ale te wywołania przechodzą przez protokół Node gateway i podlegają limitom iOS
na pierwszym planie/w tle. Użyj [Codex Computer Use](/pl/plugins/codex-computer-use)
do sterowania lokalnym pulpitem, a tej strony do możliwości Node iOS.

### Eval / zrzut canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wybudzanie głosowe + tryb rozmowy

- Wybudzanie głosowe i tryb rozmowy są dostępne w Ustawieniach.
- Node iOS obsługujące rozmowę ogłaszają możliwość `talk` i mogą deklarować
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` oraz `talk.ptt.once`;
  Gateway domyślnie zezwala na te polecenia push-to-talk dla zaufanych
  Node obsługujących rozmowę.
- iOS może wstrzymywać dźwięk w tle; traktuj funkcje głosowe jako działające w trybie najlepszej próby, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/kamery/ekranu tego wymagają).
- `A2UI_HOST_UNAVAILABLE`: dołączona strona A2UI była nieosiągalna w WebView aplikacji; pozostaw aplikację na pierwszym planie na karcie Ekran i spróbuj ponownie.
- Monit parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Ponowne połączenie nie działa po reinstalacji: token parowania Keychain został wyczyszczony; sparuj Node ponownie.

## Powiązana dokumentacja

- [Parowanie](/pl/channels/pairing)
- [Wykrywanie](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
