---
read_when:
    - Implementacja zatwierdzeń parowania Node bez interfejsu macOS UI
    - Dodawanie przepływów CLI do zatwierdzania zdalnych Node
    - Rozszerzanie protokołu gateway o zarządzanie Node
summary: Parowanie Node zarządzane przez Gateway (opcja B) dla iOS i innych zdalnych Node
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-04-24T09:11:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Parowanie zarządzane przez Gateway (opcja B)

W parowaniu zarządzanym przez Gateway to **Gateway** jest źródłem prawdy określającym, które Node
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są tylko frontendami,
które zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** Node WS używają **parowania urządzenia** (rola `node`) podczas `connect`.
`node.pair.*` to oddzielny magazyn parowania i **nie** steruje handshake WS.
Tylko klienci, którzy jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: Node poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany Node**: zatwierdzony Node z wydanym tokenem auth.
- **Transport**: punkt końcowy Gateway WS przekazuje żądania dalej, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Node łączy się z Gateway WS i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI albo UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Node łączy się ponownie, używając tokenu, i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ CLI (przyjazny dla trybu headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/podłączone Node i ich możliwości.

## Powierzchnia API (protokół gateway)

Zdarzenia:

- `node.pair.requested` — emitowane przy utworzeniu nowego oczekującego żądania.
- `node.pair.resolved` — emitowane przy zatwierdzeniu/odrzuceniu/wygaśnięciu żądania.

Metody:

- `node.pair.request` — tworzy lub używa ponownie oczekującego żądania.
- `node.pair.list` — lista oczekujących + sparowanych Node (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.verify` — weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne per Node: powtórzone wywołania zwracają to samo
  oczekujące żądanie.
- Powtórzone żądania dla tego samego oczekującego Node odświeżają również zapisane metadane Node
  oraz najnowszy snapshot zadeklarowanych poleceń z allowlisty dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany z
  `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń z oczekującego żądania do egzekwowania
  dodatkowych zakresów zatwierdzenia:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie poleceń bez exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Ważne:

- Parowanie Node to przepływ zaufania/tożsamości plus wydawanie tokenów.
- **Nie** przypina aktywnej powierzchni poleceń Node per Node.
- Aktywne polecenia Node pochodzą z tego, co Node deklaruje przy połączeniu po zastosowaniu
  globalnej polityki poleceń Node gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Polityka allow/ask per Node dla `system.run` znajduje się na samym Node w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

## Bramka poleceń Node (2026.3.31+)

<Warning>
**Zmiana niekompatybilna:** Od `2026.3.31` polecenia Node są wyłączone, dopóki parowanie Node nie zostanie zatwierdzone. Samo parowanie urządzenia nie wystarcza już do ujawnienia zadeklarowanych poleceń Node.
</Warning>

Gdy Node łączy się po raz pierwszy, żądanie parowania jest tworzone automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia Node z tego Node są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia Node stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to, że:

- Node, które wcześniej polegały wyłącznie na parowaniu urządzenia do ujawniania poleceń, muszą teraz zakończyć parowanie Node.
- Polecenia ustawione w kolejce przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń Node (2026.3.31+)

<Warning>
**Zmiana niekompatybilna:** Przebiegi pochodzące z Node pozostają teraz na ograniczonej powierzchni zaufanej.
</Warning>

Podsumowania pochodzące z Node i powiązane zdarzenia sesji są ograniczone do zamierzonej powierzchni zaufanej. Przepływy wyzwalane przez powiadomienia lub Node, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie gwarantuje, że zdarzenia Node nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania tego Node.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie próbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway z użyciem tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego promptu „Approve/Reject”.

## Automatyczne zatwierdzanie ulepszenia metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko ze zmianami niewrażliwych metadanych
(na przykład nazwy wyświetlanej albo wskazówek platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko
zaufanych lokalnych ponownych połączeń CLI/helper, które już udowodniły posiadanie
współdzielonego tokenu lub hasła przez loopback. Klienci przeglądarkowi/Control UI i klienci
zdalni nadal używają jawnego przepływu ponownego zatwierdzania. Ulepszenia zakresów (z odczytu do
zapisu/admin) i zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania
`metadata-upgrade` — pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocniki parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane multimedia, aby klienci
mobilni i przeglądarkowi mogli zeskanować go bezpośrednio.

Usunięcie urządzenia usuwa też wszystkie nieaktualne oczekujące żądania parowania dla
tego identyfikatora urządzenia, dzięki czemu `nodes pending` nie pokazuje osieroconych wierszy po odwołaniu.

## Lokalność i nagłówki przekazane dalej

Gateway pairing traktuje połączenie jako loopback tylko wtedy, gdy zarówno surowe gniazdo,
jak i wszelkie dane z proxy upstream są zgodne. Jeśli żądanie dociera przez loopback, ale
niesie nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, które wskazują
na nielokalne źródło, te dane z nagłówków przekazanych dalej unieważniają twierdzenie o lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia zamiast cichego traktowania żądania jako połączenia z tego samego hosta. Zobacz
[Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla
uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przenosi się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako wrażliwy.
- Rotacja tokenu wymaga ponownego zatwierdzenia (albo usunięcia wpisu Node).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, Node nie mogą się sparować.
- Jeśli Gateway jest w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [Node](/pl/nodes)
- [CLI urządzeń](/pl/cli/devices)
