---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja referencyjna CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-05-10T19:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby bezpośrednio wskazać skonfigurowanego agenta.

Przekaż co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Wysyłanie agenta](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: wymagana treść wiadomości
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; zastępuje powiązania routingu
- `--model <id>`: zastąpienie modelu dla tego uruchomienia (`provider/model` albo identyfikator modelu)
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez dostawcę, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: utrwal poziom szczegółowości dla sesji
- `--channel <channel>`: kanał dostarczania; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: zastąpienie celu dostarczania
- `--reply-channel <channel>`: zastąpienie kanału dostarczania
- `--reply-account <id>`: zastąpienie konta dostarczania
- `--local`: uruchom bezpośrednio osadzonego agenta (po wstępnym załadowaniu rejestru pluginów)
- `--deliver`: wyślij odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: zastąp limit czasu agenta (domyślnie 600 albo wartość z konfiguracji)
- `--json`: wypisz JSON

## Przykłady

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Uwagi

- Tryb Gateway wraca do osadzonego agenta, gdy żądanie Gateway się nie powiedzie. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr pluginów, więc dostawcy, narzędzia i kanały dostarczane przez pluginy pozostają dostępne podczas uruchomień osadzonych.
- Uruchomienia `--local` i osadzone uruchomienia awaryjne są traktowane jako uruchomienia jednorazowe. Dołączone zasoby pętli zwrotnej MCP i ciepłe sesje Claude stdio otwarte dla tego procesu lokalnego są wycofywane po odpowiedzi, więc wywołania skryptowe nie utrzymują lokalnych procesów potomnych przy życiu.
- Uruchomienia obsługiwane przez Gateway pozostawiają zasoby pętli zwrotnej MCP należące do Gateway w działającym procesie Gateway; starsi klienci mogą nadal wysyłać historyczną flagę czyszczenia, ale Gateway akceptuje ją jako zgodne wstecznie działanie bez efektu.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczanie odpowiedzi, a nie na routing sesji.
- `--json` rezerwuje stdout dla odpowiedzi JSON. Diagnostyka Gateway, pluginu i osadzonego trybu awaryjnego jest kierowana do stderr, aby skrypty mogły bezpośrednio parsować stdout.
- JSON osadzonego trybu awaryjnego zawiera `meta.transport: "embedded"` i `meta.fallbackFrom: "gateway"`, aby skrypty mogły odróżnić uruchomienia awaryjne od uruchomień Gateway.
- Jeśli Gateway przyjmie uruchomienie agenta, ale CLI przekroczy limit czasu oczekiwania na końcową odpowiedź, osadzony tryb awaryjny używa świeżego jawnego identyfikatora sesji/uruchomienia `gateway-fallback-*` i zgłasza `meta.fallbackReason: "gateway_timeout"` oraz pola sesji awaryjnej. Pozwala to uniknąć rywalizacji z blokadą transkryptu należącą do Gateway albo cichego zastępowania pierwotnej routowanej sesji konwersacji.
- Gdy to polecenie wyzwala ponowne generowanie `models.json`, poświadczenia dostawcy zarządzane przez SecretRef są utrwalane jako niejawne znaczniki niesekretne (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` albo `secretref-managed`), a nie jako rozwiązany tajny tekst jawny.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw utrwala znaczniki z aktywnej migawki konfiguracji źródłowej, a nie z rozwiązanych wartości tajnych środowiska uruchomieniowego.

## Status dostarczania JSON

Gdy używane jest `--json --deliver`, odpowiedź JSON CLI może zawierać najwyższego poziomu `deliveryStatus`, aby skrypty mogły odróżnić wysyłki dostarczone, pominięte, częściowe i nieudane:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` ma jedną z wartości: `sent`, `suppressed`, `partial_failed` albo `failed`. `suppressed` oznacza, że dostarczenie celowo nie zostało wysłane, na przykład anulował je hook wysyłania wiadomości albo nie było widocznego wyniku; nadal jest to końcowy wynik bez ponawiania. `partial_failed` oznacza, że co najmniej jeden payload został wysłany, zanim późniejszy payload się nie powiódł. `failed` oznacza, że żadna trwała wysyłka nie została ukończona albo wstępna kontrola dostarczania się nie powiodła.

Odpowiedzi CLI obsługiwane przez Gateway zachowują także surowy kształt wyniku Gateway, gdzie ten sam obiekt jest dostępny pod `result.deliveryStatus`.

Wspólne pola:

- `requested`: zawsze `true`, gdy obiekt jest obecny.
- `attempted`: `true` po uruchomieniu ścieżki trwałej wysyłki; `false` przy niepowodzeniach wstępnej kontroli albo braku widocznych payloadów.
- `succeeded`: `true`, `false` albo `"partial"`; `"partial"` występuje razem z `status: "partial_failed"`.
- `reason`: powód w formacie snake-case małymi literami, pochodzący z trwałego dostarczania albo walidacji wstępnej. Znane powody obejmują `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` i `no_delivery_target`; nieudane trwałe wysyłki mogą także zgłaszać etap niepowodzenia. Traktuj nieznane wartości jako nieprzezroczyste, ponieważ zestaw może się rozszerzać.
- `resultCount`: liczba wyników wysyłki kanału, gdy jest dostępna.
- `sentBeforeError`: `true`, gdy częściowe niepowodzenie wysłało co najmniej jeden payload przed błędem.
- `error`: wartość boolowska `true` dla wysyłek nieudanych albo częściowo nieudanych.
- `errorMessage`: dołączane tylko wtedy, gdy przechwycono bazowy komunikat błędu dostarczania. Niepowodzenia wstępnej kontroli zawierają `error` i `reason`, ale nie zawierają `errorMessage`.
- `payloadOutcomes`: opcjonalne wyniki dla poszczególnych payloadów z `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` albo metadanymi hooka, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
