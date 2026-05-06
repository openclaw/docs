---
read_when:
    - Budowanie lub debugowanie klientów Node (tryb Node dla iOS/Android/macOS)
    - Badanie błędów parowania lub uwierzytelniania mostka
    - Audyt powierzchni Node udostępnianej przez Gateway
summary: 'Historyczny protokół mostu (starsze węzły): TCP JSONL, parowanie, RPC o ograniczonym zakresie'
title: Protokół mostka
x-i18n:
    generated_at: "2026-05-06T17:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Most TCP został **usunięty**. Obecne kompilacje OpenClaw nie zawierają listenera mostu, a klucze konfiguracji `bridge.*` nie znajdują się już w schemacie. Ta strona jest zachowana wyłącznie jako odniesienie historyczne. Używaj [protokołu Gateway](/pl/gateway/protocol) dla wszystkich klientów węzłów/operatorów.
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: most udostępnia małą listę dozwolonych elementów zamiast
  pełnej powierzchni API Gateway.
- **Parowanie + tożsamość węzła**: dopuszczanie węzłów jest zarządzane przez Gateway i powiązane
  z tokenem przypisanym do konkretnego węzła.
- **UX wykrywania**: węzły mogą wykrywać Gateway przez Bonjour w sieci LAN albo łączyć się
  bezpośrednio przez tailnet.
- **Loopback WS**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że zostanie tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na linię (JSONL).
- Opcjonalny TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port listenera to `18790` (obecne kompilacje nie uruchamiają
  mostu TCP).

Gdy TLS jest włączony, rekordy TXT wykrywania zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niejawną wskazówkę, która nie jest sekretem. Pamiętaj, że rekordy TXT Bonjour/mDNS
nie są uwierzytelniane; klienci nie mogą traktować reklamowanego odcisku palca jako
autorytatywnego przypięcia bez wyraźnej intencji użytkownika lub innej weryfikacji poza pasmem.

## Handshake + parowanie

1. Klient wysyła `hello` z metadanymi węzła + tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, Gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracało `serverName` i mogło zawierać
`canvasHostUrl`.

## Ramki

Klient → Gateway:

- `req` / `res`: zakresowe RPC Gateway (chat, sesje, konfiguracja, kondycja, voicewake, skills.bins)
- `event`: sygnały węzła (transkrypcja głosowa, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → Klient:

- `invoke` / `invoke-res`: polecenia węzła (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Starsze wymuszanie listy dozwolonych elementów znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Węzły mogą emitować zdarzenia `exec.finished` lub `exec.denied`, aby ujawniać aktywność system.run.
Są one mapowane na zdarzenia systemowe w Gateway. (Starsze węzły mogą nadal emitować `exec.started`.)

Pola ładunku (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta, która ma otrzymać zdarzenie systemowe.
- `runId`: unikatowy identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły zakończenia (tylko finished).
- `reason`: powód odmowy (tylko denied).

## Historyczne użycie tailnet

- Powiąż most z adresem IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już prawidłowe).
- Klienci łączą się przez nazwę MagicDNS lub adres IP tailnet.
- Bonjour **nie** działa między sieciami; w razie potrzeby użyj ręcznego hosta/portu lub DNS-SD
  dla sieci rozległych.

## Wersjonowanie

Most był **niejawnym v1** (bez negocjacji min/max). Ta sekcja jest
wyłącznie odniesieniem historycznym; obecni klienci węzłów/operatorów używają WebSocketowego
[protokołu Gateway](/pl/gateway/protocol).

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Węzły](/pl/nodes)
