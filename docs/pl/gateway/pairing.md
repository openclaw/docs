---
read_when:
    - Implementowanie zatwierdzeń parowania węzłów bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu gateway o zarządzanie węzłami
summary: Parowanie węzłów zarządzane przez Gateway (opcja B) dla iOS i innych zdalnych węzłów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-06-27T17:36:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

W parowaniu zarządzanym przez Gateway **Gateway** jest źródłem prawdy dla tego, które węzły
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszłe klienty) są tylko frontendami,
które zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** węzły WS używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** kontroluje uzgadniania WS.
Tylko klienty, które jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: węzeł poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany węzeł**: zatwierdzony węzeł z wydanym tokenem uwierzytelniania.
- **Transport**: punkt końcowy WS Gateway przekazuje żądania, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Węzeł łączy się z Gateway WS i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz albo odrzucasz żądanie (CLI lub interfejs użytkownika).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Węzeł ponownie łączy się przy użyciu tokenu i jest teraz „sparowany”.

Oczekujące żądania automatycznie wygasają po **5 minutach**.

## Przepływ CLI (przyjazny dla trybu bezobsługowego)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/połączone węzły oraz ich możliwości.

## Powierzchnia API (protokół Gateway)

Zdarzenia:

- `node.pair.requested` - emitowane, gdy zostanie utworzone nowe oczekujące żądanie.
- `node.pair.resolved` - emitowane, gdy żądanie zostanie zatwierdzone/odrzucone/wygaszone.

Metody:

- `node.pair.request` - tworzy oczekujące żądanie lub używa istniejącego ponownie.
- `node.pair.list` - wyświetla oczekujące + sparowane węzły (`operator.pairing`).
- `node.pair.approve` - zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` - odrzuca oczekujące żądanie.
- `node.pair.remove` - usuwa sparowany węzeł. W przypadku parowań opartych na urządzeniu
  cofa rolę `node` urządzenia: modyfikuje `devices/paired.json` i
  unieważnia/rozłącza sesje tego urządzenia z rolą węzła. Urządzenie z **mieszanymi rolami**
  (np. ma także `operator`) zachowuje swój wiersz i traci tylko rolę `node`;
  wiersz urządzenia wyłącznie z rolą węzła jest usuwany. Usuwa także każdy pasujący starszy
  wpis parowania węzła zarządzany przez gateway. Authz: `operator.pairing` może usuwać
  wiersze węzłów niebędące operatorami; wywołujący z tokenem urządzenia, który cofa rolę węzła
  **własnego** urządzenia z mieszanymi rolami, dodatkowo potrzebuje `operator.admin`.
- `node.pair.verify` - weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne dla każdego węzła: powtarzane wywołania zwracają to samo
  oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego węzła odświeżają także przechowywane metadane
  węzła oraz najnowszą migawkę deklarowanych poleceń z listy dozwolonych, widoczną dla operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany z
  `node.pair.request`.
- Poziomy zakresów operatora i kontrole wykonywane podczas zatwierdzania są podsumowane w
  [Zakresach operatora](/pl/gateway/operator-scopes).
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa deklarowanych poleceń z oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Parowanie węzłów to przepływ zaufania i tożsamości oraz wydawanie tokenów. **Nie** przypina bieżącej powierzchni poleceń węzła do konkretnego węzła.

- Bieżące polecenia węzła pochodzą z tego, co węzeł deklaruje przy połączeniu, po zastosowaniu globalnej polityki poleceń węzłów gateway (`gateway.nodes.allowCommands` i `denyCommands`).
- Polityka allow i ask dla `system.run` dla pojedynczego węzła znajduje się na węźle w `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Bramkowanie poleceń węzła (2026.3.31+)

<Warning>
**Zmiana łamiąca zgodność:** Począwszy od `2026.3.31`, polecenia węzła są wyłączone do czasu zatwierdzenia parowania węzła. Samo parowanie urządzenia nie wystarcza już, aby udostępnić deklarowane polecenia węzła.
</Warning>

Gdy węzeł łączy się po raz pierwszy, parowanie jest żądane automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia węzła z tego węzła są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania deklarowane polecenia węzła stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to, że:

- Węzły, które wcześniej polegały wyłącznie na parowaniu urządzenia w celu udostępniania poleceń, muszą teraz ukończyć parowanie węzła.
- Polecenia kolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń węzła (2026.3.31+)

<Warning>
**Zmiana łamiąca zgodność:** Uruchomienia pochodzące z węzłów pozostają teraz na ograniczonej, zaufanej powierzchni.
</Warning>

Podsumowania pochodzące z węzłów i powiązane zdarzenia sesji są ograniczone do zamierzonej, zaufanej powierzchni. Przepływy sterowane powiadomieniami lub wyzwalane przez węzły, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia węzła nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania węzła.

Trwałe aktualizacje obecności węzła podążają za tą samą granicą tożsamości. Zdarzenie `node.presence.alive` jest
akceptowane tylko z uwierzytelnionych sesji urządzeń węzłów i aktualizuje metadane parowania tylko wtedy, gdy
tożsamość urządzenia/węzła jest już sparowana. Samodzielnie deklarowane wartości `client.id` nie wystarczą do zapisania
stanu ostatniej aktywności.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie próbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego monitu „Zatwierdź/Odrzuć”.

## Automatyczne zatwierdzanie urządzeń z zaufanych CIDR

Parowanie urządzeń WS dla `role: node` domyślnie pozostaje ręczne. W prywatnych
sieciach węzłów, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
włączyć tę funkcję jawnie podanymi CIDR lub dokładnymi adresami IP:

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
- Nie istnieje ogólny tryb automatycznego zatwierdzania dla LAN ani sieci prywatnych.
- Kwalifikuje się tylko świeże parowanie urządzenia z `role: node` bez żądanych zakresów.
- Klienty operatora, przeglądarki, Control UI i WebChat pozostają ręczne.
- Aktualizacje ról, zakresów, metadanych i kluczy publicznych pozostają ręczne.
- Ścieżki nagłówka zaufanego proxy przez same-host loopback nie kwalifikują się, ponieważ tę
  ścieżkę mogą podszyć lokalni wywołujący.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie ponownie łączy się wyłącznie ze zmianami metadanych
niewrażliwych (na przykład nazwa wyświetlana lub wskazówki platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko
zaufanych lokalnych ponownych połączeń nieprzeglądarkowych, które już udowodniły posiadanie lokalnych
lub współdzielonych poświadczeń, w tym ponownych połączeń natywnej aplikacji na tym samym hoście po zmianach
metadanych wersji systemu operacyjnego. Klienty przeglądarki/Control UI i klienty zdalne nadal
używają jawnego przepływu ponownego zatwierdzania. Aktualizacje zakresów (read na write/admin) oraz
zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania `metadata-upgrade` -
pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocniki parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane multimedia, aby klienty mobilne i
przeglądarkowe mogły go bezpośrednio zeskanować.

Usunięcie urządzenia usuwa także wszelkie przestarzałe oczekujące żądania parowania dla tego
identyfikatora urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po cofnięciu.

## Lokalność i przekazywane nagłówki

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zgadzają się zarówno surowe gniazdo,
jak i dowody z każdego nadrzędnego proxy. Jeśli żądanie dociera przez loopback, ale
niesie dowody w nagłówkach `Forwarded`, dowolnym `X-Forwarded-*` lub `X-Real-IP`, te
dowody z przekazanych nagłówków dyskwalifikują deklarację lokalności loopback. Ścieżka parowania
wymaga wtedy jawnego zatwierdzenia zamiast cicho traktować żądanie jako połączenie z tego samego hosta.
Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth), aby poznać
równoważną regułę dla uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przeniesie się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako wrażliwy.
- Rotacja tokenu wymaga ponownego zatwierdzenia (lub usunięcia wpisu węzła).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, węzły nie mogą się parować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanału](/pl/channels/pairing)
- [Węzły](/pl/nodes)
- [CLI urządzeń](/pl/cli/devices)
