---
read_when:
    - Tworzenie lub debugowanie klientów węzłów (tryb węzła iOS/Android/macOS)
    - Badanie niepowodzeń parowania lub uwierzytelniania mostka
    - Audyt powierzchni węzła udostępnianej przez Gateway
summary: 'Historyczny protokół mostka (starsze węzły): TCP JSONL, parowanie, RPC o ograniczonym zakresie'
title: Protokół pomostu
x-i18n:
    generated_at: "2026-06-27T17:31:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Mostek TCP został **usunięty**. Obecne kompilacje OpenClaw nie dostarczają listenera mostka, a klucze konfiguracji `bridge.*` nie znajdują się już w schemacie. Ta strona jest zachowana wyłącznie jako materiał historyczny. Używaj [Protokołu Gateway](/pl/gateway/protocol) dla wszystkich klientów węzłów/operatorów.
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: mostek udostępnia małą listę dozwolonych zamiast
  pełnej powierzchni API Gateway.
- **Parowanie + tożsamość węzła**: dopuszczanie węzłów należy do Gateway i jest powiązane
  z tokenem przypisanym do węzła.
- **UX wykrywania**: węzły mogą wykrywać Gateway przez Bonjour w sieci LAN albo łączyć się
  bezpośrednio przez tailnet.
- **Loopback WS**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że zostanie tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na wiersz (JSONL).
- Opcjonalne TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port listenera to `18790` (obecne kompilacje nie uruchamiają
  mostka TCP).

Gdy TLS jest włączone, rekordy TXT wykrywania zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niejawną wskazówkę. Pamiętaj, że rekordy TXT Bonjour/mDNS
nie są uwierzytelniane; klienci nie mogą traktować ogłaszanego odcisku palca jako
autorytatywnego przypięcia bez wyraźnej intencji użytkownika lub innej weryfikacji poza pasmem.

## Handshake + parowanie

1. Klient wysyła `hello` z metadanymi węzła + tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, Gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracało `serverName`; hostowane powierzchnie Plugin są teraz
ogłaszane przez `pluginSurfaceUrls`. Canvas/A2UI używa
`pluginSurfaceUrls.canvas`; przestarzały alias `canvasHostUrl` nie jest częścią
zrefaktoryzowanego protokołu.

## Ramki

Klient → Gateway:

- `req` / `res`: ograniczone zakresem RPC Gateway (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sygnały węzła (transkrypcja głosu, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → Klient:

- `invoke` / `invoke-res`: polecenia węzła (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Starsze egzekwowanie listy dozwolonych znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Węzły mogą emitować zdarzenia `exec.finished`, aby ujawniać ukończoną aktywność `system.run`.
Są one mapowane na zdarzenia systemowe w Gateway. (Starsze węzły mogą nadal emitować `exec.started`.)
Węzły mogą emitować `exec.denied` dla odrzuconych prób `system.run`; Gateway akceptuje
zdarzenie jako końcową odmowę i nie dodaje zdarzenia systemowego do kolejki ani nie wybudza pracy agenta.

Pola payloadu (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta do korelacji zdarzeń oraz, dla
  `exec.finished`, dostarczania zdarzeń systemowych.
- `runId`: unikalny identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły ukończenia (tylko finished).
- `reason`: powód odmowy (tylko denied).

## Historyczne użycie tailnet

- Powiąż mostek z adresem IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już poprawne).
- Klienci łączą się przez nazwę MagicDNS lub adres IP tailnet.
- Bonjour **nie** przechodzi między sieciami; w razie potrzeby użyj ręcznego hosta/portu albo szerokoobszarowego DNS-SD.

## Wersjonowanie

Mostek był **niejawnym v1** (bez negocjacji min/max). Ta sekcja jest
wyłącznie materiałem historycznym; obecni klienci węzłów/operatorów używają WebSocket
[Protokołu Gateway](/pl/gateway/protocol).

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Węzły](/pl/nodes)
