---
read_when:
    - Implementujesz zatwierdzanie parowania węzłów bez interfejsu macOS
    - Dodajesz przepływy CLI do zatwierdzania zdalnych węzłów
    - Rozszerzasz protokół gateway o zarządzanie węzłami
summary: Parowanie węzłów zarządzane przez Gateway (Opcja B) dla iOS i innych zdalnych węzłów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-04-05T13:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Parowanie zarządzane przez Gateway (Opcja B)

W parowaniu zarządzanym przez Gateway to **Gateway** jest źródłem prawdy o tym, które węzły
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są jedynie frontendami,
które zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** węzły WS używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** steruje handshake WS.
Z tego przepływu korzystają tylko klienci, którzy jawnie wywołują `node.pair.*`.

## Pojęcia

- **Oczekujące żądanie**: węzeł poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany węzeł**: zatwierdzony węzeł z wydanym tokenem uwierzytelniającym.
- **Transport**: endpoint WS Gateway przekazuje żądania dalej, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Węzeł łączy się z Gateway WS i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI albo UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Węzeł łączy się ponownie z użyciem tokenu i jest już „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ CLI (przyjazny dla trybu headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/podłączone węzły i ich możliwości.

## Powierzchnia API (protokół gateway)

Zdarzenia:

- `node.pair.requested` — emitowane po utworzeniu nowego oczekującego żądania.
- `node.pair.resolved` — emitowane po zatwierdzeniu/odrzuceniu/wygaśnięciu żądania.

Metody:

- `node.pair.request` — tworzy lub ponownie wykorzystuje oczekujące żądanie.
- `node.pair.list` — wyświetla oczekujące + sparowane węzły (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.verify` — weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne dla każdego węzła: powtórne wywołania zwracają to samo
  oczekujące żądanie.
- Powtórne żądania dla tego samego oczekującego węzła odświeżają też zapisane metadane
  węzła oraz najnowszy snapshot zadeklarowanych poleceń z allowlisty dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany przez
  `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów autozatwierdzania.
- `node.pair.approve` używa poleceń zadeklarowanych w oczekującym żądaniu do egzekwowania
  dodatkowych zakresów zatwierdzenia:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie poleceń innych niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Ważne:

- Parowanie węzłów to przepływ zaufania/tożsamości oraz wydawania tokenów.
- **Nie** przypina ono aktywnej powierzchni poleceń węzła dla każdego węzła.
- Aktywne polecenia węzła pochodzą z tego, co węzeł deklaruje podczas `connect`, po zastosowaniu
  globalnej polityki poleceń węzłów gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Polityka allow/ask dla `system.run` dla poszczególnych węzłów znajduje się na węźle w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

## Gating poleceń węzła (2026.3.31+)

<Warning>
**Zmiana powodująca niezgodność:** od wersji `2026.3.31` polecenia węzła są wyłączone, dopóki parowanie węzła nie zostanie zatwierdzone. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń węzła.
</Warning>

Gdy węzeł łączy się po raz pierwszy, żądanie parowania jest tworzone automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia węzła z tego węzła są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia węzła stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to, że:

- Węzły, które wcześniej polegały wyłącznie na parowaniu urządzenia do udostępniania poleceń, muszą teraz ukończyć parowanie węzła.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odkładane.

## Granice zaufania zdarzeń węzła (2026.3.31+)

<Warning>
**Zmiana powodująca niezgodność:** uruchomienia pochodzące z węzła pozostają teraz na ograniczonej powierzchni zaufania.
</Warning>

Podsumowania pochodzące z węzła i powiązane zdarzenia sesji są ograniczone do zamierzonej powierzchni zaufania. Przepływy oparte na powiadomieniach lub wyzwalane przez węzeł, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia węzła nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza granicami zaufania dozwolonymi dla danego węzła.

## Autozatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie próbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego monitu „Approve/Reject”.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przeniesie się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako dane wrażliwe.
- Rotacja tokenu wymaga ponownego zatwierdzenia (lub usunięcia wpisu węzła).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline lub parowanie jest wyłączone, węzły nie mogą się sparować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.
