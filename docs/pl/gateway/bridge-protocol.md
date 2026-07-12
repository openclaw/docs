---
read_when:
    - Badanie starego kodu klienta Node lub zarchiwizowanych dzienników parowania
    - Audyt tego, co wcześniej udostępniał starszy interfejs Node
summary: 'Historyczny protokół mostu (starsze węzły): TCP JSONL, parowanie, RPC o ograniczonym zakresie'
title: Protokół mostu
x-i18n:
    generated_at: "2026-07-12T15:08:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Most TCP został **usunięty**. Obecne kompilacje OpenClaw nie zawierają procesu nasłuchującego mostu, a klucze konfiguracji `bridge.*` nie są już częścią schematu. Ta strona służy wyłącznie jako dokumentacja historyczna. Wszystkie klienty węzłów i operatorów powinny korzystać z [protokołu Gateway](/pl/gateway/protocol).
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: udostępniał niewielką listę dozwolonych operacji zamiast pełnej powierzchni API Gateway.
- **Parowanie i tożsamość węzła**: przyjmowaniem węzłów zarządzał Gateway, a dostęp był powiązany z tokenem przypisanym do danego węzła.
- **Wygodne wykrywanie**: węzły mogły wykrywać Gatewaye za pośrednictwem Bonjour w sieci LAN albo łączyć się bezpośrednio przez tailnet.
- **WebSocket w local loopback**: pełna płaszczyzna sterowania WebSocket pozostawała lokalna, chyba że tunelowano ją przez SSH.

## Transport

- TCP, jeden obiekt JSON w każdym wierszu (JSONL).
- Opcjonalny TLS (`bridge.tls.enabled: true`).
- Domyślnym portem nasłuchiwania był `18790`.

Gdy TLS był włączony, rekordy TXT wykrywania zawierały `bridgeTls=1` oraz `bridgeTlsSha256` jako niepoufną wskazówkę. Rekordy TXT Bonjour/mDNS nie są uwierzytelniane, dlatego klienty nie mogły traktować rozgłaszanego odcisku jako autorytatywnego przypięcia bez dodatkowej weryfikacji poza tym kanałem.

## Uzgadnianie połączenia i parowanie

1. Klient wysyła `hello` z metadanymi węzła i tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, Gateway odpowiada `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

`hello-ok` zwracało wcześniej `serverName`; powierzchnie hostowanych pluginów są obecnie ogłaszane przez `pluginSurfaceUrls` w aktualnym protokole Gateway (Canvas/A2UI używa `pluginSurfaceUrls.canvas`).

## Ramki

Od klienta do Gateway:

- `req` / `res`: RPC Gateway o ograniczonym zakresie (czat, sesje, konfiguracja, kondycja, wybudzanie głosowe, `skills.bins`).
- `event`: sygnały węzła (transkrypcja głosu, żądanie agenta, subskrypcja czatu, cykl życia wykonania).

Od Gateway do klienta:

- `invoke` / `invoke-res`: polecenia węzła (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: aktualizacje czatu dla subskrybowanych sesji.
- `ping` / `pong`: utrzymywanie połączenia.

Egzekwowanie listy dozwolonych operacji znajdowało się w `src/gateway/server-bridge.ts` (usunięto).

## Zdarzenia cyklu życia wykonania

Węzły emitowały `exec.finished`, aby udostępniać informacje o zakończonej aktywności `system.run`, mapowanej przez Gateway na zdarzenia systemowe (starsze węzły mogły także emitować `exec.started`). `exec.denied` oznaczało odrzuconą próbę `system.run` jako ostatecznie odrzuconą, bez umieszczania zdarzenia systemowego w kolejce ani wybudzania pracy agenta.

Pola ładunku (wszystkie opcjonalne, o ile nie zaznaczono inaczej):

| Pole                             | Uwagi                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sessionKey`                     | Wymagane. Sesja agenta służąca do korelacji zdarzeń oraz, w przypadku `exec.finished`, dostarczania zdarzeń systemowych. |
| `runId`                          | Unikatowy identyfikator wykonania służący do grupowania.                                                           |
| `command`                        | Surowy lub sformatowany ciąg polecenia.                                                                            |
| `exitCode`, `timedOut`, `output` | Szczegóły zakończenia (tylko w przypadku ukończenia).                                                              |
| `reason`                         | Powód odmowy (tylko w przypadku odrzucenia).                                                                       |

## Historyczne użycie sieci tailnet

- Powiązanie mostu z adresem IP sieci tailnet: `bridge.bind: "tailnet"` w `~/.openclaw/openclaw.json` (wyłącznie historycznie; `bridge.*` nie jest już prawidłową konfiguracją).
- Klienty łączyły się za pomocą nazwy MagicDNS lub adresu IP sieci tailnet.
- Bonjour nie działa między sieciami; w przeciwnym razie wymagane było DNS-SD sieci rozległej albo ręczne podanie hosta i portu.

## Wersjonowanie

Most niejawnie używał wersji 1, bez negocjowania minimalnej i maksymalnej wersji. Obecne klienty węzłów i operatorów korzystają z [protokołu Gateway](/pl/gateway/protocol) opartego na WebSocket, który negocjuje zakres wersji protokołu.

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Węzły](/pl/nodes)
