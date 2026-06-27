---
read_when:
    - Tworzenie narzędzi hosta, które nie mogą używać klienta RPC Gateway WebSocket
    - Udostępnianie automatyzacji administracyjnej Gateway za prywatnym, zaufanym ingresem
    - Audyt modelu bezpieczeństwa dostępu HTTP do metod Gateway
summary: Udostępnij wybrane metody płaszczyzny sterowania Gateway przez dołączony, opcjonalnie włączany plugin admin-http-rpc
title: Administracyjny Plugin RPC HTTP
x-i18n:
    generated_at: "2026-06-27T17:49:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Dołączony Plugin `admin-http-rpc` udostępnia wybrane metody płaszczyzny sterowania Gateway przez HTTP dla zaufanej automatyzacji hosta, która nie może używać zwykłego klienta RPC WebSocket Gateway.

Plugin jest dołączony do OpenClaw, ale domyślnie jest wyłączony. Gdy jest wyłączony, trasa nie jest rejestrowana. Gdy jest włączony, dodaje:

- `POST /api/v1/admin/rpc`
- ten sam nasłuch co Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Włączaj go tylko dla prywatnych narzędzi hosta, automatyzacji w tailnecie albo zaufanego wewnętrznego punktu wejścia. Nie wystawiaj tej trasy bezpośrednio do publicznego internetu.

## Zanim go włączysz

RPC administracyjne HTTP to pełna powierzchnia płaszczyzny sterowania operatora. Każdy wywołujący, który przejdzie uwierzytelnianie HTTP Gateway, może wywołać metody z listy dozwolonych na tej stronie.

Używaj go, gdy wszystkie poniższe warunki są spełnione:

- Wywołujący jest zaufany do obsługi Gateway.
- Wywołujący nie może używać klienta RPC WebSocket.
- Trasa jest osiągalna tylko przez loopback, tailnet albo prywatny uwierzytelniony punkt wejścia.
- Przejrzano dozwolone metody i odpowiadają automatyzacji, którą planujesz uruchomić.

Używaj ścieżki RPC WebSocket dla klientów OpenClaw i narzędzi interaktywnych, które mogą utrzymywać otwarte połączenie WebSocket Gateway.

## Włączanie

Włącz dołączony Plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Trasa jest rejestrowana podczas uruchamiania Plugin. Uruchom ponownie Gateway po zmianie konfiguracji Plugin.

Wyłącz go, gdy nie potrzebujesz już powierzchni HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Weryfikacja trasy

Użyj `health` jako najmniejszego bezpiecznego żądania:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Pomyślna odpowiedź ma `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Gdy Plugin jest wyłączony, trasa zwraca `404`, ponieważ nie jest zarejestrowana.

## Uwierzytelnianie

Trasa Plugin używa uwierzytelniania HTTP Gateway.

Typowe ścieżki uwierzytelniania:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` albo `"password"`): `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`): kieruj przez skonfigurowany serwer proxy świadomy tożsamości i pozwól mu wstrzyknąć wymagane nagłówki tożsamości
- otwarte uwierzytelnianie prywatnego punktu wejścia (`gateway.auth.mode="none"`): nagłówek uwierzytelniania nie jest wymagany

## Model bezpieczeństwa

Traktuj ten Plugin jako pełną powierzchnię operatora Gateway.

- Włączenie Plugin celowo udostępnia dostęp do dozwolonych metod RPC administratora pod adresem `/api/v1/admin/rpc`.
- Plugin deklaruje zarezerwowany kontrakt manifestu `contracts.gatewayMethodDispatch: ["authenticated-request"]`, aby jego uwierzytelniona przez Gateway trasa HTTP mogła wysyłać metody płaszczyzny sterowania w procesie.
- Uwierzytelnianie bearer współdzielonym sekretem potwierdza posiadanie sekretu operatora gateway.
- Dla uwierzytelniania `token` i `password` węższe nagłówki `x-openclaw-scopes` są ignorowane i przywracane są zwykłe pełne domyślne uprawnienia operatora.
- Zaufane tryby HTTP przenoszące tożsamość respektują `x-openclaw-scopes`, gdy są obecne.
- `gateway.auth.mode="none"` oznacza, że ta trasa jest nieuwierzytelniona, jeśli Plugin jest włączony. Używaj tego tylko za prywatnym punktem wejścia, któremu w pełni ufasz.
- Żądania są wysyłane przez te same procedury obsługi metod Gateway i kontrole zakresów co RPC WebSocket po przejściu uwierzytelniania trasy Plugin.
- Utrzymuj tę trasę na loopback, tailnecie albo prywatnym zaufanym punkcie wejścia. Nie wystawiaj jej bezpośrednio do publicznego internetu.
- Kontrakty manifestu Plugin nie są piaskownicą. Zapobiegają przypadkowemu użyciu zarezerwowanych pomocników SDK; zaufane pluginy nadal działają w procesie Gateway.

Używaj oddzielnych gatewayów, gdy wywołujący przekraczają granice zaufania.

## Żądanie

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Pola:

- `id` (ciąg znaków, opcjonalne): kopiowane do odpowiedzi. UUID jest generowany, gdy pole zostanie pominięte.
- `method` (ciąg znaków, wymagane): dozwolona nazwa metody Gateway.
- `params` (dowolne, opcjonalne): parametry specyficzne dla metody.

Domyślny maksymalny rozmiar treści żądania to 1 MB.

## Odpowiedź

Pomyślne odpowiedzi używają kształtu RPC Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Błędy metod Gateway używają:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Status HTTP podąża za błędem Gateway, gdy to możliwe. Na przykład `INVALID_REQUEST` zwraca `400`, a `UNAVAILABLE` zwraca `503`.

## Dozwolone metody

- wykrywanie: `commands.list`
  Zwraca nazwy metod RPC HTTP dozwolone przez ten Plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- konfiguracja: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kanały: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modele: `models.list`, `models.authStatus`
- agenci: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- zatwierdzenia: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- urządzenia: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- węzły: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- zadania: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostyka: `doctor.memory.status`, `update.status`

Inne metody Gateway są blokowane, dopóki nie zostaną celowo dodane.

## Porównanie z WebSocket

Zwykła ścieżka RPC WebSocket Gateway pozostaje preferowanym API płaszczyzny sterowania dla klientów OpenClaw. Używaj RPC administracyjnego HTTP tylko dla narzędzi hosta, które potrzebują powierzchni HTTP typu żądanie/odpowiedź.

Klienci WebSocket ze współdzielonym tokenem bez zaufanej tożsamości urządzenia nie mogą samodzielnie deklarować zakresów administratora podczas łączenia. RPC administracyjne HTTP celowo podąża za istniejącym modelem zaufanego operatora HTTP: gdy Plugin jest włączony, uwierzytelnianie bearer współdzielonym sekretem jest traktowane jako pełny dostęp operatora do tej powierzchni administracyjnej.

## Rozwiązywanie problemów

`404 Not Found`

: Plugin jest wyłączony, Gateway nie został ponownie uruchomiony od czasu jego włączenia albo żądanie trafia do innego procesu Gateway.

`401 Unauthorized`

: Żądanie nie spełniło uwierzytelniania HTTP Gateway. Sprawdź token bearer albo nagłówki tożsamości trusted-proxy.

`400 INVALID_REQUEST`

: Treść żądania nie jest prawidłowym JSON, brakuje pola `method` albo metoda nie znajduje się na liście dozwolonych Plugin.

`503 UNAVAILABLE`

: Procedura obsługi metody Gateway jest niedostępna. Sprawdź logi Gateway i ponów próbę po zakończeniu uruchamiania Gateway.

## Powiązane

- [Zakresy operatora](/pl/gateway/operator-scopes)
- [Bezpieczeństwo Gateway](/pl/gateway/security)
- [Dostęp zdalny](/pl/gateway/remote)
- [Manifest Plugin](/pl/plugins/manifest#contracts)
- [Podścieżki SDK](/pl/plugins/sdk-subpaths)
