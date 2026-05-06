---
read_when:
    - Implementowanie zatwierdzeń parowania Node bez interfejsu użytkownika macOS
    - Dodawanie przepływów CLI do zatwierdzania zdalnych węzłów
    - Rozszerzanie protokołu Gateway o zarządzanie Node
summary: Parowanie węzłów zarządzane przez Gateway (opcja B) dla iOS i innych zdalnych węzłów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-05-06T09:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

W parowaniu zarządzanym przez Gateway, **Gateway** jest źródłem prawdy określającym, które węzły
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są tylko frontendami, które
zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** Węzły WS używają **parowania urządzenia** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** blokuje uzgadniania WS.
Tylko klienci, którzy jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: węzeł poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany węzeł**: zatwierdzony węzeł z wydanym tokenem uwierzytelniania.
- **Transport**: punkt końcowy WS Gateway przekazuje żądania, ale nie decyduje
  o członkostwie. (Obsługa starszego mostka TCP została usunięta.)

## Jak działa parowanie

1. Węzeł łączy się z Gateway WS i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI albo interfejs użytkownika).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Węzeł łączy się ponownie z użyciem tokenu i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ pracy CLI (przyjazny dla trybu bez interfejsu)

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
- `node.pair.resolved` - emitowane, gdy żądanie zostanie zatwierdzone/odrzucone/wygasłe.

Metody:

- `node.pair.request` - tworzy lub ponownie używa oczekującego żądania.
- `node.pair.list` - wyświetla oczekujące + sparowane węzły (`operator.pairing`).
- `node.pair.approve` - zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` - odrzuca oczekujące żądanie.
- `node.pair.remove` - usuwa nieaktualny wpis sparowanego węzła.
- `node.pair.verify` - weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne dla danego węzła: powtarzane wywołania zwracają to samo
  oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego węzła odświeżają także zapisane metadane węzła
  oraz najnowszy dozwolony zrzut zadeklarowanych poleceń dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany przez
  `node.pair.request`.
- Poziomy zakresu operatora i kontrole wykonywane w czasie zatwierdzania są podsumowane w
  [Zakresach operatora](/pl/gateway/operator-scopes).
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Parowanie węzłów to przepływ zaufania i tożsamości oraz wydawania tokenów. **Nie** przypina aktywnej powierzchni poleceń węzła do konkretnego węzła.

- Aktywne polecenia węzła pochodzą z tego, co węzeł deklaruje przy połączeniu po zastosowaniu globalnej polityki poleceń węzłów Gateway (`gateway.nodes.allowCommands` i `denyCommands`).
- Polityka zezwalania i pytania dla `system.run` na poziomie węzła znajduje się na węźle w `exec.approvals.node.*`, a nie w rekordzie parowania.

</Warning>

## Bramkowanie poleceń węzła (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecz:** Począwszy od `2026.3.31`, polecenia węzłów są wyłączone do czasu zatwierdzenia parowania węzła. Samo parowanie urządzenia nie wystarcza już do ujawnienia zadeklarowanych poleceń węzła.
</Warning>

Gdy węzeł łączy się po raz pierwszy, parowanie jest żądane automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia węzła z tego węzła są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia węzła stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to, że:

- Węzły, które wcześniej polegały wyłącznie na parowaniu urządzenia w celu ujawniania poleceń, muszą teraz ukończyć parowanie węzła.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń węzła (2026.3.31+)

<Warning>
**Zmiana niezgodna wstecz:** Uruchomienia pochodzące od węzła pozostają teraz na ograniczonej zaufanej powierzchni.
</Warning>

Podsumowania pochodzące od węzła i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy wyzwalane przez powiadomienia lub węzeł, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia węzła nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania węzła.

Trwałe aktualizacje obecności węzła podążają za tą samą granicą tożsamości. Zdarzenie `node.presence.alive` jest
akceptowane tylko z uwierzytelnionych sesji urządzeń węzła i aktualizuje metadane parowania tylko wtedy, gdy
tożsamość urządzenia/węzła jest już sparowana. Samodzielnie zadeklarowane wartości `client.id` nie wystarczają do zapisu
stanu ostatniej aktywności.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie spróbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego monitu „Zatwierdź/Odrzuć”.

## Automatyczne zatwierdzanie urządzeń z zaufanego CIDR

Parowanie urządzeń WS dla `role: node` domyślnie pozostaje ręczne. W prywatnych
sieciach węzłów, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
włączyć to jawnie za pomocą CIDR lub dokładnych adresów IP:

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
- Nie istnieje ogólny tryb automatycznego zatwierdzania dla LAN ani sieci prywatnej.
- Kwalifikuje się tylko świeże parowanie urządzenia `role: node` bez żądanych zakresów.
- Klienci operatora, przeglądarki, Control UI i WebChat pozostają ręczni.
- Ulepszenia roli, zakresu, metadanych i klucza publicznego pozostają ręczne.
- Ścieżki nagłówków zaufanego proxy samego hosta przez loopback nie kwalifikują się, ponieważ ta
  ścieżka może zostać podszyta przez lokalnych wywołujących.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko ze zmianami niewrażliwych metadanych
(na przykład nazwy wyświetlanej lub wskazówek platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko
zaufanych lokalnych ponownych połączeń innych niż przeglądarkowe, które już udowodniły posiadanie lokalnych
lub współdzielonych poświadczeń, w tym ponownych połączeń natywnej aplikacji na tym samym hoście po zmianach
metadanych wersji systemu operacyjnego. Klienci przeglądarki/Control UI i klienci zdalni nadal
używają jawnego przepływu ponownego zatwierdzania. Ulepszenia zakresu (od odczytu do zapisu/admina) i
zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania aktualizacji metadanych -
pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocniki parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane multimedia, aby klienci mobilni i
przeglądarkowi mogli skanować go bezpośrednio.

Usunięcie urządzenia czyści także wszelkie nieaktualne oczekujące żądania parowania dla tego
identyfikatora urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po cofnięciu dostępu.

## Lokalność i przekazywane nagłówki

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zgadzają się zarówno surowe gniazdo,
jak i wszelkie dowody z nadrzędnego proxy. Jeśli żądanie przychodzi przez loopback, ale
zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`,
które wskazują na nielokalne źródło, dowód z przekazywanego nagłówka dyskwalifikuje
deklarację lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia
zamiast cicho traktować żądanie jako połączenie z tego samego hosta. Zobacz
[Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla
uwierzytelniania operatora.

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
- Jeśli Gateway jest offline lub parowanie jest wyłączone, węzły nie mogą się parować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [Węzły](/pl/nodes)
- [CLI urządzeń](/pl/cli/devices)
