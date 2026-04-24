---
read_when:
    - Tworzenie lub debugowanie klientów Node (tryb Node iOS/Android/macOS)
    - Badanie błędów parowania lub uwierzytelniania bridge
    - Audyt powierzchni Node udostępnianej przez gateway
summary: 'Historyczny protokół bridge (starsze Node): TCP JSONL, parowanie, ograniczone zakresami RPC'
title: Protokół bridge
x-i18n:
    generated_at: "2026-04-24T09:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protokół bridge (starszy transport Node)

<Warning>
TCP bridge został **usunięty**. Bieżące buildy OpenClaw nie dostarczają listenera bridge i klucze konfiguracyjne `bridge.*` nie są już częścią schematu. Ta strona jest zachowana wyłącznie jako odniesienie historyczne. Używaj [Gateway Protocol](/pl/gateway/protocol) dla wszystkich klientów node/operator.
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: bridge udostępnia małą listę dozwolonych zamiast
  pełnej powierzchni API gateway.
- **Parowanie + tożsamość node**: dopuszczenie node należy do gateway i jest powiązane
  z tokenem per Node.
- **UX wykrywania**: Node mogą wykrywać gatewaye przez Bonjour w LAN albo łączyć się
  bezpośrednio przez tailnet.
- **Loopback WS**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że zostanie tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na linię (JSONL).
- Opcjonalny TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port listenera to `18790` (bieżące buildy nie uruchamiają
  TCP bridge).

Gdy TLS jest włączony, rekordy TXT wykrywania zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niepoufny wskaźnik. Pamiętaj, że rekordy TXT Bonjour/mDNS są
nieuwierzytelnione; klienci nie mogą traktować reklamowanego fingerprintu jako
autorytatywnego pina bez jawnej intencji użytkownika albo innej weryfikacji poza pasmem.

## Handshake + parowanie

1. Klient wysyła `hello` z metadanymi node + tokenem (jeśli został już sparowany).
2. Jeśli nie jest sparowany, gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracało `serverName` i mogło zawierać
`canvasHostUrl`.

## Ramki

Klient → Gateway:

- `req` / `res`: RPC gateway ograniczone zakresem (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sygnały node (transkrypt głosowy, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → Klient:

- `invoke` / `invoke-res`: polecenia node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Egzekwowanie historycznej listy dozwolonych znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Node mogą emitować zdarzenia `exec.finished` lub `exec.denied`, aby ujawniać aktywność system.run.
Są one mapowane na zdarzenia systemowe w gateway. (Starsze Node mogą nadal emitować `exec.started`.)

Pola ładunku (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta, która ma otrzymać zdarzenie systemowe.
- `runId`: unikalny identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły zakończenia (tylko finished).
- `reason`: powód odmowy (tylko denied).

## Historyczne użycie tailnet

- Powiąż bridge z adresem IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już prawidłowe).
- Klienci łączą się przez nazwę MagicDNS albo adres IP tailnet.
- Bonjour **nie** przechodzi przez sieci; użyj ręcznego host/port albo DNS‑SD o szerokim zasięgu,
  gdy jest potrzebne.

## Wersjonowanie

Bridge był **niejawnym v1** (bez negocjacji min/max). Ta sekcja stanowi
wyłącznie odniesienie historyczne; obecni klienci node/operator używają WebSocket
[Gateway Protocol](/pl/gateway/protocol).

## Powiązane

- [Gateway protocol](/pl/gateway/protocol)
- [Nodes](/pl/nodes)
