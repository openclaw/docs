---
read_when:
    - Tworzenie narzędzi dla hosta, które nie mogą korzystać z klienta RPC WebSocket Gatewaya
    - Udostępnianie automatyzacji administracyjnej Gateway przez prywatny, zaufany punkt wejścia
    - Audyt modelu zabezpieczeń dostępu HTTP do metod Gateway
summary: Udostępnij wybrane metody płaszczyzny sterowania Gateway za pośrednictwem dołączonego, opcjonalnie włączanego pluginu admin-http-rpc
title: Administracyjny Plugin RPC HTTP
x-i18n:
    generated_at: "2026-07-12T15:21:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Dołączony plugin `admin-http-rpc` udostępnia przez HTTP dozwolony zestaw metod płaszczyzny sterowania Gateway na potrzeby zaufanej automatyzacji hosta, która nie może utrzymywać otwartego połączenia WebSocket z Gateway.

Jest dostarczany z OpenClaw, ale domyślnie pozostaje wyłączony; gdy jest wyłączony, trasa nie jest rejestrowana. Po włączeniu dodaje `POST /api/v1/admin/rpc` w tym samym procesie nasłuchującym co Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Włączaj go wyłącznie dla prywatnych narzędzi hosta, automatyzacji w sieci tailnet lub zaufanego wewnętrznego punktu wejścia. Nigdy nie udostępniaj tej trasy bezpośrednio w publicznym internecie.

## Przed włączeniem

Administracyjne RPC przez HTTP zapewnia pełny dostęp operatorski do płaszczyzny sterowania: każdy klient, który przejdzie uwierzytelnianie HTTP Gateway, może wywołać wymienione poniżej dozwolone metody. Włączaj je tylko wtedy, gdy spełnione są wszystkie poniższe warunki:

- Klient jest zaufany i może zarządzać Gateway.
- Klient nie może używać klienta RPC WebSocket.
- Trasa jest dostępna wyłącznie przez local loopback, sieć tailnet lub prywatny uwierzytelniony punkt wejścia.
- Dozwolone metody zostały sprawdzone i odpowiadają planowanej automatyzacji.

W przypadku klientów OpenClaw i narzędzi interaktywnych, które mogą utrzymywać otwarte połączenie WebSocket z Gateway, użyj zamiast tego RPC WebSocket.

## Włączanie

Włącz dołączony plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Konfiguracja">
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

Trasa jest rejestrowana podczas uruchamiania pluginu, dlatego po zmianie jego konfiguracji uruchom ponownie Gateway.

Wyłącz ją, gdy interfejs HTTP nie jest już potrzebny:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Weryfikowanie trasy

Użyj `health` jako najmniejszego bezpiecznego żądania:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Pomyślna odpowiedź zawiera `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Gdy plugin jest wyłączony, trasa zwraca `404`, ponieważ nie jest zarejestrowana.

## Uwierzytelnianie

Trasa pluginu korzysta z uwierzytelniania HTTP Gateway.

Typowe sposoby uwierzytelniania:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`): kieruj ruch przez skonfigurowany serwer proxy uwzględniający tożsamość i pozwól mu wstrzyknąć wymagane nagłówki tożsamości
- otwarte uwierzytelnianie za prywatnym punktem wejścia (`gateway.auth.mode="none"`): nagłówek uwierzytelniania nie jest wymagany

## Model zabezpieczeń

Traktuj ten plugin jako pełny interfejs operatorski Gateway.

- Włączenie pluginu celowo udostępnia dozwolone administracyjne metody RPC pod adresem `/api/v1/admin/rpc`.
- Plugin deklaruje zastrzeżony kontrakt manifestu `contracts.gatewayMethodDispatch: ["authenticated-request"]`, który umożliwia jego trasie HTTP uwierzytelnionej przez Gateway wywoływanie metod płaszczyzny sterowania w obrębie procesu. Nie jest to piaskownica: kontrakt zapobiega przypadkowemu użyciu zastrzeżonych funkcji pomocniczych SDK, ale zaufane pluginy nadal działają w procesie Gateway.
- Uwierzytelnianie nośnikiem współdzielonego sekretu (tryby `token`/`password`) potwierdza posiadanie sekretu operatora Gateway; węższe nagłówki `x-openclaw-scopes` są w tym przypadku ignorowane i przywracane są zwykłe domyślne uprawnienia pełnego operatora.
- Zaufane uwierzytelnianie HTTP przenoszące tożsamość (tryb `trusted-proxy`) respektuje nagłówek `x-openclaw-scopes`, jeśli jest obecny.
- `gateway.auth.mode="none"` oznacza, że po włączeniu pluginu ta trasa nie jest uwierzytelniana. Używaj tego ustawienia wyłącznie za w pełni zaufanym prywatnym punktem wejścia.
- Po pomyślnym uwierzytelnieniu trasy pluginu żądania są przekazywane do tych samych procedur obsługi metod Gateway i mechanizmów sprawdzania zakresów co RPC WebSocket.
- Trasa pozostaje dostępna podczas przygotowanego okresu zawieszenia. Nadal dostępne są ograniczona weryfikacja żądań oraz lokalna odpowiedź wykrywania `commands.list`. Spośród metod przekazywanych do Gateway po zamknięciu przyjmowania żądań mogą działać wyłącznie `gateway.suspend.prepare`, `gateway.suspend.status` i `gateway.suspend.resume`; pozostałe dozwolone metody zwracają standardową, ponawialną odpowiedź Gateway `UNAVAILABLE`.
- Utrzymuj tę trasę w local loopback, sieci tailnet lub za prywatnym zaufanym punktem wejścia. Nie udostępniaj jej bezpośrednio w publicznym internecie. Gdy klienci należą do różnych stref zaufania, używaj oddzielnych instancji Gateway.

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

- `id` (ciąg znaków, opcjonalne): kopiowane do odpowiedzi. W razie pominięcia generowany jest identyfikator UUID.
- `method` (ciąg znaków, wymagane): nazwa dozwolonej metody Gateway.
- `params` (dowolny typ, opcjonalne): parametry właściwe dla danej metody.

Domyślny maksymalny rozmiar treści żądania wynosi 1 MB.

## Odpowiedź

Pomyślne odpowiedzi używają formatu RPC Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Błędy metod Gateway używają następującego formatu:

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

Status HTTP odpowiada kodowi błędu:

| Kod błędu                  | Status HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| dowolny inny kod           | 500         |

## Dozwolone metody

- wykrywanie: `commands.list`
  Zwraca nazwy metod RPC HTTP dozwolonych przez ten plugin.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- konfiguracja: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kanały: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- sieć: `web.login.start`, `web.login.wait`
- modele: `models.list`, `models.authStatus`
- agenci: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- zatwierdzenia: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- urządzenia: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- węzły: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- zadania: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostyka: `doctor.memory.status`, `update.status`

Pozostałe metody Gateway są blokowane, dopóki nie zostaną celowo dodane.

## Porównanie z WebSocket

Standardowa ścieżka RPC WebSocket Gateway pozostaje preferowanym interfejsem API płaszczyzny sterowania dla klientów OpenClaw. Używaj administracyjnego RPC przez HTTP wyłącznie w przypadku narzędzi hosta wymagających interfejsu HTTP opartego na żądaniach i odpowiedziach.

Klienci WebSocket korzystający ze współdzielonego tokenu, którzy nie mają zaufanej tożsamości urządzenia, nie mogą samodzielnie deklarować zakresów administracyjnych podczas nawiązywania połączenia. Administracyjne RPC przez HTTP celowo przestrzega istniejącego modelu zaufanego operatora HTTP: gdy plugin jest włączony, uwierzytelnianie nośnikiem współdzielonego sekretu jest traktowane jako pełny dostęp operatorski do tego interfejsu administracyjnego.

## Rozwiązywanie problemów

`404 Not Found`

: Plugin jest wyłączony, Gateway nie został ponownie uruchomiony po jego włączeniu albo żądanie jest wysyłane do innego procesu Gateway.

`401 Unauthorized`

: Żądanie nie spełniło wymagań uwierzytelniania HTTP Gateway. Sprawdź token typu bearer lub nagłówki tożsamości serwera `trusted-proxy`.

`405 Method Not Allowed`

: W żądaniu użyto metody innej niż `POST`.

`413 Payload Too Large`

: Treść żądania przekroczyła limit 1 MB.

`400 INVALID_REQUEST`

: Treść żądania nie jest prawidłowym dokumentem JSON, brakuje pola `method`, metoda nie znajduje się na liście dozwolonych metod pluginu albo identyfikator wznowienia zawieszenia nie odpowiada aktywnemu okresowi zawieszenia.

`503 UNAVAILABLE`

: Metoda Gateway jest uruchamiana, objęta ograniczeniem szybkości, zawieszona albo oczekuje na zakończenie konkurencyjnej operacji zawieszenia lub wznowienia. Sprawdź `error.details`, jeśli jest dostępne, i przed ponowieniem żądania odczekaj czas określony w `error.retryAfterMs`.

## Powiązane materiały

- [Zakresy operatora](/pl/gateway/operator-scopes)
- [Bezpieczeństwo Gateway](/pl/gateway/security)
- [Dostęp zdalny](/pl/gateway/remote)
- [Manifest pluginu](/pl/plugins/manifest#contracts-reference)
- [Ścieżki podrzędne SDK](/pl/plugins/sdk-subpaths)
