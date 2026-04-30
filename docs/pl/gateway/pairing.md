---
read_when:
    - Implementowanie zatwierdzeń parowania węzłów bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu Gateway o zarządzanie węzłami
summary: Parowanie węzłów zarządzane przez Gateway (Opcja B) dla iOS i innych zdalnych węzłów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-04-30T09:55:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

W parowaniu zarządzanym przez Gateway **Gateway** jest źródłem prawdy dla tego, które węzły
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są tylko frontendami, które
zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** Węzły WS używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to oddzielny magazyn parowania i **nie** bramkuje uzgadniania WS.
Tylko klienci, którzy jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: węzeł poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany węzeł**: zatwierdzony węzeł z wydanym tokenem uwierzytelniania.
- **Transport**: punkt końcowy WS Gateway przekazuje żądania, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Węzeł łączy się z WS Gateway i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz albo odrzucasz żądanie (CLI lub UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Węzeł ponownie łączy się przy użyciu tokena i jest teraz „sparowany”.

Oczekujące żądania automatycznie wygasają po **5 minutach**.

## Przepływ CLI (przyjazny dla pracy bez interfejsu)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/połączone węzły i ich możliwości.

## Powierzchnia API (protokół gateway)

Zdarzenia:

- `node.pair.requested` — emitowane po utworzeniu nowego oczekującego żądania.
- `node.pair.resolved` — emitowane po zatwierdzeniu/odrzuceniu/wygaśnięciu żądania.

Metody:

- `node.pair.request` — utwórz albo użyj ponownie oczekującego żądania.
- `node.pair.list` — wyświetl oczekujące + sparowane węzły (`operator.pairing`).
- `node.pair.approve` — zatwierdź oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuć oczekujące żądanie.
- `node.pair.remove` — usuń przestarzały wpis sparowanego węzła.
- `node.pair.verify` — zweryfikuj `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne dla każdego węzła: powtarzane wywołania zwracają to samo
  oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego węzła odświeżają także zapisane
  metadane węzła oraz najnowszy dozwolony zadeklarowany zrzut poleceń dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; token nigdy nie jest zwracany z
  `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Parowanie węzłów to przepływ zaufania i tożsamości oraz wydawania tokenów. **Nie** przypina aktywnej powierzchni poleceń węzła dla każdego węzła.

- Aktywne polecenia węzła pochodzą z tego, co węzeł deklaruje przy połączeniu po zastosowaniu globalnej polityki poleceń węzłów Gateway (`gateway.nodes.allowCommands` i `denyCommands`).
- Polityka zezwalania i pytania dla `system.run` na poziomie węzła znajduje się na węźle w `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Bramkowanie poleceń węzła (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecz:** Od `2026.3.31` polecenia węzła są wyłączone do czasu zatwierdzenia parowania węzła. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń węzła.
</Warning>

Gdy węzeł łączy się po raz pierwszy, parowanie jest żądane automatycznie. Do czasu zatwierdzenia żądania parowania wszystkie oczekujące polecenia węzła z tego węzła są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia węzła stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to:

- Węzły, które wcześniej polegały wyłącznie na parowaniu urządzeń w celu udostępniania poleceń, muszą teraz ukończyć parowanie węzła.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń węzłów (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecz:** Uruchomienia pochodzące z węzłów pozostają teraz na ograniczonej zaufanej powierzchni.
</Warning>

Podsumowania pochodzące z węzłów i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy sterowane powiadomieniami lub wyzwalane przez węzeł, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To wzmocnienie zapewnia, że zdarzenia węzłów nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania węzła.

Trwałe aktualizacje obecności węzła podlegają tej samej granicy tożsamości. Zdarzenie `node.presence.alive` jest
akceptowane tylko z uwierzytelnionych sesji urządzeń węzłów i aktualizuje metadane parowania tylko wtedy, gdy
tożsamość urządzenia/węzła jest już sparowana. Samodzielnie zadeklarowane wartości `client.id` nie wystarczą do zapisu
stanu ostatniej widoczności.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie spróbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego monitu „Zatwierdź/Odrzuć”.

## Automatyczne zatwierdzanie urządzeń z zaufanych CIDR

Parowanie urządzeń WS dla `role: node` domyślnie pozostaje ręczne. Dla prywatnych
sieci węzłów, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
włączyć tę funkcję za pomocą jawnych CIDR lub dokładnych adresów IP:

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
- Nie istnieje tryb automatycznego zatwierdzania całej sieci LAN ani sieci prywatnej.
- Kwalifikuje się tylko świeże parowanie urządzenia `role: node` bez żądanych zakresów.
- Klienci operatora, przeglądarki, Control UI i WebChat pozostają ręczni.
- Rola, zakres, metadane i aktualizacje klucza publicznego pozostają ręczne.
- Ścieżki nagłówka zaufanego proxy przez local loopback na tym samym hoście nie kwalifikują się, ponieważ ta
  ścieżka może zostać sfałszowana przez lokalne wywołania.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie ponownie łączy się wyłącznie ze zmianami
niewrażliwych metadanych (na przykład nazwy wyświetlanej lub wskazówek platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko
zaufanych lokalnych ponownych połączeń spoza przeglądarki, które już udowodniły posiadanie lokalnych
lub współdzielonych poświadczeń, w tym ponownych połączeń natywnej aplikacji na tym samym hoście po zmianach
metadanych wersji systemu operacyjnego. Klienci przeglądarki/Control UI oraz klienci zdalni nadal
używają jawnego przepływu ponownego zatwierdzania. Aktualizacje zakresu (z odczytu do zapisu/admina) i
zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania aktualizacji metadanych —
pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocniki parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane multimedia, aby klienci mobilni i
przeglądarkowi mogli skanować go bezpośrednio.

Usunięcie urządzenia usuwa także wszelkie przestarzałe oczekujące żądania parowania dla tego
identyfikatora urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po cofnięciu dostępu.

## Lokalność i przekazywane nagłówki

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zgadzają się zarówno surowe gniazdo,
jak i wszelkie dowody z nadrzędnego proxy. Jeśli żądanie przychodzi przez loopback, ale
zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`,
które wskazują na nielokalne źródło, ten dowód z przekazywanych nagłówków dyskwalifikuje
twierdzenie o lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia
zamiast cicho traktować żądanie jako połączenie z tego samego hosta. Zobacz
[Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla
uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` zostanie przeniesiony razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako wrażliwy.
- Rotacja tokena wymaga ponownego zatwierdzenia (albo usunięcia wpisu węzła).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, węzły nie mogą się sparować.
- Jeśli Gateway jest w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [Węzły](/pl/nodes)
- [CLI urządzeń](/pl/cli/devices)
