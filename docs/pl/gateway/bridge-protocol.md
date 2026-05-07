---
read_when:
    - Tworzenie lub debugowanie klientów Node (tryb Node iOS/Android/macOS)
    - Diagnozowanie niepowodzeń parowania lub uwierzytelniania mostka
    - Audyt powierzchni Node eksponowanej przez Gateway
summary: 'Historyczny protokół mostu (starsze węzły): TCP JSONL, parowanie, RPC o ograniczonym zakresie'
title: Protokół mostu
x-i18n:
    generated_at: "2026-05-07T13:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Most TCP został **usunięty**. Aktualne kompilacje OpenClaw nie dostarczają odbiornika mostu, a klucze konfiguracji `bridge.*` nie znajdują się już w schemacie. Ta strona jest zachowana wyłącznie jako odniesienie historyczne. Użyj [protokołu Gateway](/pl/gateway/protocol) dla wszystkich klientów węzłów/operatorów.
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: most udostępnia małą listę dozwolonych elementów zamiast
  pełnej powierzchni API Gateway.
- **Parowanie + tożsamość węzła**: przyjmowanie węzłów jest zarządzane przez Gateway i powiązane
  z tokenem przypisanym do węzła.
- **UX wykrywania**: węzły mogą wykrywać Gateway przez Bonjour w sieci LAN albo łączyć się
  bezpośrednio przez sieć tailnet.
- **WS local loopback**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że zostanie tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na linię (JSONL).
- Opcjonalne TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port odbiornika to `18790` (aktualne kompilacje nie uruchamiają
  mostu TCP).

Gdy TLS jest włączone, rekordy TXT wykrywania zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niejawną wskazówkę. Pamiętaj, że rekordy TXT Bonjour/mDNS
nie są uwierzytelniane; klienci nie mogą traktować ogłaszanego odcisku jako
autorytatywnego przypięcia bez wyraźnej intencji użytkownika lub innej weryfikacji poza pasmem.

## Uzgadnianie + parowanie

1. Klient wysyła `hello` z metadanymi węzła + tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, Gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracało `serverName`; hostowane powierzchnie Plugin są teraz
ogłaszane przez `pluginSurfaceUrls`. Canvas/A2UI używa
`pluginSurfaceUrls.canvas`; przestarzały alias `canvasHostUrl` nie jest częścią
przeprojektowanego protokołu.

## Ramki

Klient → Gateway:

- `req` / `res`: zakresowe RPC Gateway (czat, sesje, konfiguracja, kondycja, voicewake, skills.bins)
- `event`: sygnały węzła (transkrypcja głosu, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → klient:

- `invoke` / `invoke-res`: polecenia węzła (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Starsze wymuszanie listy dozwolonych elementów znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Węzły mogą emitować zdarzenia `exec.finished` lub `exec.denied`, aby ujawniać aktywność system.run.
Są one mapowane na zdarzenia systemowe w Gateway. (Starsze węzły mogą nadal emitować `exec.started`.)

Pola payloadu (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta, która ma otrzymać zdarzenie systemowe.
- `runId`: unikalny identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły zakończenia (tylko finished).
- `reason`: przyczyna odmowy (tylko denied).

## Historyczne użycie tailnet

- Powiąż most z adresem IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już prawidłowe).
- Klienci łączą się przez nazwę MagicDNS lub adres IP tailnet.
- Bonjour **nie** działa między sieciami; w razie potrzeby użyj ręcznego hosta/portu lub szerokoobszarowego DNS-SD.

## Wersjonowanie

Most był **niejawnym v1** (bez negocjacji min./maks.). Ta sekcja jest
wyłącznie odniesieniem historycznym; aktualni klienci węzłów/operatorów używają WebSocket
[protokołu Gateway](/pl/gateway/protocol).

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Węzły](/pl/nodes)
