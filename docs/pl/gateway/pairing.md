---
read_when:
    - Implementowanie zatwierdzeń parowania Node bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu Gateway o zarządzanie Node
summary: Parowanie węzłów zarządzane przez Gateway (Opcja B) dla iOS i innych zdalnych węzłów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-05-03T09:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

W parowaniu zarządzanym przez Gateway **Gateway** jest źródłem prawdy o tym, które węzły mogą dołączać. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są tylko frontendami, które zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** węzły WS używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** kontroluje uzgadniania WS.
Tylko klienci, którzy jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: węzeł poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany węzeł**: zatwierdzony węzeł z wydanym tokenem uwierzytelniającym.
- **Transport**: punkt końcowy WS Gateway przekazuje żądania, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Węzeł łączy się z WS Gateway i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI albo UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Węzeł łączy się ponownie przy użyciu tokena i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ pracy CLI (przyjazny dla trybu bez interfejsu graficznego)

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

- `node.pair.requested` — emitowane, gdy zostanie utworzone nowe oczekujące żądanie.
- `node.pair.resolved` — emitowane, gdy żądanie zostanie zatwierdzone/odrzucone/wygasłe.

Metody:

- `node.pair.request` — utwórz lub ponownie użyj oczekującego żądania.
- `node.pair.list` — wyświetl oczekujące + sparowane węzły (`operator.pairing`).
- `node.pair.approve` — zatwierdź oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuć oczekujące żądanie.
- `node.pair.remove` — usuń nieaktualny wpis sparowanego węzła.
- `node.pair.verify` — zweryfikuj `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne dla każdego węzła: powtarzane wywołania zwracają to samo
  oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego węzła odświeżają też zapisane metadane węzła
  oraz najnowszy dozwolony zrzut zadeklarowanych poleceń dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany przez
  `node.pair.request`.
- Poziomy zakresów operatora oraz kontrole wykonywane w czasie zatwierdzania są podsumowane w
  [Zakresy operatora](/pl/gateway/operator-scopes).
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania do wymuszenia
  dodatkowych zakresów zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Parowanie węzłów to przepływ zaufania i tożsamości oraz wydawania tokenów. **Nie** przypina bieżącej powierzchni poleceń węzła dla poszczególnych węzłów.

- Bieżące polecenia węzła pochodzą z tego, co węzeł deklaruje przy połączeniu po zastosowaniu globalnej polityki poleceń węzłów Gateway (`gateway.nodes.allowCommands` i `denyCommands`).
- Polityka zezwalania i pytania dla `system.run` na poziomie węzła znajduje się na węźle w `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Kontrola poleceń węzła (2026.3.31+)

<Warning>
**Zmiana łamiąca zgodność:** od `2026.3.31` polecenia węzła są wyłączone do czasu zatwierdzenia parowania węzła. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń węzła.
</Warning>

Gdy węzeł łączy się po raz pierwszy, parowanie jest żądane automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia węzła z tego węzła są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia węzła stają się dostępne z zastrzeżeniem normalnej polityki poleceń.

Oznacza to, że:

- Węzły, które wcześniej polegały wyłącznie na parowaniu urządzenia w celu udostępniania poleceń, muszą teraz ukończyć parowanie węzła.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń węzła (2026.3.31+)

<Warning>
**Zmiana łamiąca zgodność:** uruchomienia pochodzące z węzła pozostają teraz na ograniczonej, zaufanej powierzchni.
</Warning>

Podsumowania pochodzące z węzła i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy sterowane powiadomieniami lub wyzwalane przez węzeł, które wcześniej polegały na szerszym dostępie do narzędzi hosta albo sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia węzła nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania węzła.

Trwałe aktualizacje obecności węzła stosują tę samą granicę tożsamości. Zdarzenie `node.presence.alive` jest
akceptowane tylko z uwierzytelnionych sesji urządzeń węzła i aktualizuje metadane parowania tylko wtedy, gdy
tożsamość urządzenia/węzła jest już sparowana. Samodzielnie zadeklarowane wartości `client.id` nie wystarczają do zapisania
stanu ostatniej widoczności.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie próbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do normalnego monitu „Zatwierdź/Odrzuć”.

## Automatyczne zatwierdzanie urządzeń z zaufanych CIDR

Parowanie urządzeń WS dla `role: node` pozostaje domyślnie ręczne. W prywatnych
sieciach węzłów, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
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
- Nie istnieje tryb ogólnego automatycznego zatwierdzania dla LAN ani sieci prywatnej.
- Kwalifikuje się tylko świeże parowanie urządzenia `role: node` bez żądanych zakresów.
- Klienci operatora, przeglądarki, Control UI i WebChat pozostają ręczni.
- Ulepszenia roli, zakresu, metadanych i klucza publicznego pozostają ręczne.
- Ścieżki nagłówków zaufanego proxy przez loopback tego samego hosta nie kwalifikują się, ponieważ ta
  ścieżka może zostać podszyta przez lokalnych wywołujących.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko z niewrażliwymi zmianami metadanych
(na przykład nazwą wyświetlaną lub wskazówkami dotyczącymi platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: stosuje się tylko
do zaufanych, lokalnych ponownych połączeń innych niż przeglądarkowe, które już udowodniły posiadanie lokalnych
lub współdzielonych poświadczeń, w tym ponownych połączeń natywnych aplikacji na tym samym hoście po zmianach metadanych
wersji systemu operacyjnego. Klienci przeglądarki/Control UI i klienci zdalni nadal
używają jawnego przepływu ponownego zatwierdzania. Ulepszenia zakresu (z odczytu do zapisu/admina) oraz
zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania `metadata-upgrade` —
pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocniki parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane media, aby klienci mobilni i
przeglądarkowi mogli skanować go bezpośrednio.

Usunięcie urządzenia czyści też wszelkie nieaktualne oczekujące żądania parowania dla tego
identyfikatora urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po cofnięciu dostępu.

## Lokalność i nagłówki przekazane

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zarówno surowe gniazdo,
jak i dowody z proxy nadrzędnego są zgodne. Jeśli żądanie dociera przez loopback, ale
zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`,
które wskazują na nielokalne źródło, ten dowód z przekazanych nagłówków dyskwalifikuje
roszczenie lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia
zamiast cicho traktować żądanie jako połączenie z tego samego hosta. Zobacz
[Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla
uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przenosi się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako wrażliwy.
- Rotacja tokena wymaga ponownego zatwierdzenia (albo usunięcia wpisu węzła).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, węzły nie mogą się parować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [Węzły](/pl/nodes)
- [CLI urządzeń](/pl/cli/devices)
