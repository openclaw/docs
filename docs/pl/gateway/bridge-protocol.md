---
read_when:
    - Tworzenie lub debugowanie klientów węzłów (tryb węzła iOS/Android/macOS)
    - Badanie awarii parowania lub uwierzytelniania bridge
    - Audytowanie powierzchni węzła udostępnianej przez gateway
summary: 'Historyczny protokół bridge (starsze węzły): TCP JSONL, parowanie, zakresowane RPC'
title: Protokół Bridge
x-i18n:
    generated_at: "2026-04-05T13:52:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protokół bridge (starszy transport węzłów)

<Warning>
TCP bridge został **usunięty**. Bieżące buildy OpenClaw nie zawierają listenera bridge, a klucze config `bridge.*` nie są już częścią schematu. Ta strona została zachowana wyłącznie jako materiał historyczny. Dla wszystkich klientów węzłów/operatorów używaj [Gateway Protocol](/gateway/protocol).
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: bridge udostępnia małą listę dozwolonych elementów zamiast
  pełnej powierzchni API gateway.
- **Parowanie + tożsamość węzła**: dopuszczanie węzłów należy do gateway i jest powiązane
  z tokenem per węzeł.
- **UX wykrywania**: węzły mogą wykrywać gateway przez Bonjour w LAN albo łączyć się
  bezpośrednio przez tailnet.
- **Loopback WS**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że jest tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na linię (JSONL).
- Opcjonalny TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port listenera to `18790` (bieżące buildy nie uruchamiają
  bridge TCP).

Gdy TLS jest włączony, rekordy TXT wykrywania zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niejawną podpowiedź. Pamiętaj, że rekordy TXT Bonjour/mDNS są
nieuwierzytelnione; klienci nie mogą traktować ogłaszanego fingerprintu jako
autorytatywnego pina bez wyraźnej intencji użytkownika lub innej weryfikacji poza pasmem.

## Handshake + parowanie

1. Klient wysyła `hello` z metadanymi węzła + tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracało `serverName` i mogło zawierać
`canvasHostUrl`.

## Ramki

Klient → Gateway:

- `req` / `res`: zakresowane RPC gateway (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: sygnały węzła (transkrypcja głosowa, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → Klient:

- `invoke` / `invoke-res`: polecenia węzła (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Egzekwowanie starszej listy dozwolonych znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Węzły mogą emitować zdarzenia `exec.finished` lub `exec.denied`, aby ujawniać aktywność system.run.
Są one mapowane na zdarzenia systemowe w gateway. (Starsze węzły mogą nadal emitować `exec.started`.)

Pola payloadu (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta, która ma otrzymać zdarzenie systemowe.
- `runId`: unikalny identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły zakończenia (tylko finished).
- `reason`: powód odmowy (tylko denied).

## Historyczne użycie tailnet

- Zbindowanie bridge do adresu IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już prawidłowe).
- Klienci łączą się przez nazwę MagicDNS lub adres IP tailnet.
- Bonjour **nie** działa między sieciami; w razie potrzeby używaj ręcznie podanego hosta/portu lub szerokoobszarowego DNS‑SD.

## Wersjonowanie

Bridge był **niejawną wersją v1** (bez negocjacji min/max). Ta sekcja ma
wyłącznie charakter historyczny; bieżący klienci węzłów/operatorów używają WebSocket
[Gateway Protocol](/gateway/protocol).
