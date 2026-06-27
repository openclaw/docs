---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja referencyjna CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-06-27T17:18:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu wbudowanego).
Użyj `--agent <id>`, aby bezpośrednio wskazać skonfigurowanego agenta.

Przekaż co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Wysyłanie agenta](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: treść wiadomości
- `--message-file <path>`: odczytaj treść wiadomości z pliku UTF-8
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-key <key>`: jawny klucz sesji używany do routingu
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; zastępuje powiązania routingu
- `--model <id>`: nadpisanie modelu dla tego uruchomienia (`provider/model` lub identyfikator modelu)
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez dostawcę, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: utrwal poziom szczegółowości dla sesji
- `--channel <channel>`: kanał dostarczania; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: nadpisanie celu dostarczania
- `--reply-channel <channel>`: nadpisanie kanału dostarczania
- `--reply-account <id>`: nadpisanie konta dostarczania
- `--local`: uruchom bezpośrednio wbudowanego agenta (po wstępnym załadowaniu rejestru Plugin)
- `--deliver`: wyślij odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: nadpisz limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: wypisz JSON

## Przykłady

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Uwagi

- Przekaż dokładnie jedną z opcji `--message` albo `--message-file`. `--message-file` zachowuje wielowierszową zawartość pliku po usunięciu opcjonalnego znacznika BOM UTF-8 i odrzuca pliki, które nie są poprawnym UTF-8.
- Tryb Gateway przełącza się awaryjnie na wbudowanego agenta, gdy żądanie Gateway się nie powiedzie. Użyj `--local`, aby od razu wymusić wykonanie wbudowane.
- `--local` nadal najpierw wstępnie ładuje rejestr Plugin, więc dostawcy, narzędzia i kanały dostarczane przez Plugin pozostają dostępne podczas uruchomień wbudowanych.
- `--local` i uruchomienia awaryjne w trybie wbudowanym są traktowane jako uruchomienia jednorazowe. Dołączone zasoby loopback MCP i ciepłe sesje stdio Claude otwarte dla tego procesu lokalnego są wycofywane po odpowiedzi, więc wywołania skryptowe nie utrzymują lokalnych procesów potomnych przy życiu.
- Uruchomienia oparte na Gateway pozostawiają należące do Gateway zasoby loopback MCP w działającym procesie Gateway; starsi klienci mogą nadal wysyłać historyczną flagę czyszczenia, ale Gateway akceptuje ją jako bezoperacyjną zgodność.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczanie odpowiedzi, a nie na routing sesji.
- `--session-key` wybiera jawny klucz sesji. Klucze z prefiksem agenta muszą używać formatu `agent:<agent-id>:<session-key>`, a `--agent` musi pasować do identyfikatora agenta z klucza, gdy podane są oba. Surowe klucze inne niż sentinel są ograniczane do `--agent`, gdy go podano, albo w przeciwnym razie do skonfigurowanego agenta domyślnego; na przykład `--agent ops --session-key incident-42` kieruje do `agent:ops:incident-42`. Dosłowne `global` i `unknown` pozostają bez zakresu tylko wtedy, gdy nie podano `--agent`; w takim przypadku wbudowane wykonanie awaryjne i własność magazynu używają skonfigurowanego agenta domyślnego.
- `--json` rezerwuje stdout dla odpowiedzi JSON. Diagnostyka Gateway, Plugin i wbudowanego wykonania awaryjnego jest kierowana do stderr, aby skrypty mogły bezpośrednio parsować stdout.
- JSON wbudowanego wykonania awaryjnego zawiera `meta.transport: "embedded"` i `meta.fallbackFrom: "gateway"`, aby skrypty mogły odróżniać uruchomienia awaryjne od uruchomień Gateway.
- Jeśli Gateway zaakceptuje uruchomienie agenta, ale CLI przekroczy limit czasu oczekiwania na końcową odpowiedź, wbudowane wykonanie awaryjne używa świeżego jawnego identyfikatora sesji/uruchomienia `gateway-fallback-*` i zgłasza `meta.fallbackReason: "gateway_timeout"` oraz pola sesji awaryjnej. Pozwala to uniknąć wyścigu o należącą do Gateway blokadę transkryptu lub cichego zastąpienia pierwotnej sesji konwersacji z routingu.
- W przypadku uruchomień opartych na Gateway `SIGTERM` i `SIGINT` przerywają oczekujące żądanie CLI. Jeśli Gateway już zaakceptuje uruchomienie, CLI przed zakończeniem wysyła również `chat.abort` dla tego zaakceptowanego identyfikatora uruchomienia. Lokalne uruchomienia `--local` i wbudowane uruchomienia awaryjne otrzymują ten sam sygnał przerwania, ale nie wysyłają `chat.abort`. Jeśli zduplikowany `--run-id` dotrze do Gateway, gdy pierwotne uruchomienie agenta jest nadal aktywne, zduplikowana odpowiedź zgłasza `status: "in_flight"`, a CLI bez JSON wypisuje diagnostykę na stderr zamiast pustej odpowiedzi. W przypadku zewnętrznych opakowań cron/systemd zachowaj zewnętrzny twardy bezpiecznik zabicia procesu, taki jak `timeout -k 60 600 openclaw agent ...`, aby nadzorca nadal mógł zebrać proces, jeśli zamknięcia nie da się opróżnić.
- Gdy to polecenie wyzwala ponowne generowanie `models.json`, poświadczenia dostawców zarządzane przez SecretRef są utrwalane jako niejawne znaczniki (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako rozwiązany tajny tekst jawny.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw utrwala znaczniki z aktywnej migawki konfiguracji źródłowej, a nie z rozwiązanych wartości sekretów środowiska uruchomieniowego.

## Status dostarczania JSON

Gdy używane jest `--json --deliver`, odpowiedź JSON CLI może zawierać najwyższego poziomu `deliveryStatus`, aby skrypty mogły odróżniać wysyłki dostarczone, stłumione, częściowe i nieudane:

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

`deliveryStatus.status` ma jedną z wartości `sent`, `suppressed`, `partial_failed` albo `failed`. `suppressed` oznacza, że dostarczanie celowo nie zostało wysłane, na przykład hook wysyłania wiadomości je anulował albo nie było widocznego wyniku; nadal jest to końcowy wynik bez ponawiania. `partial_failed` oznacza, że co najmniej jeden ładunek został wysłany, zanim późniejszy ładunek się nie powiódł. `failed` oznacza, że nie ukończono trwałej wysyłki albo nie powiodła się kontrola wstępna dostarczania.

Odpowiedzi CLI oparte na Gateway zachowują też surowy kształt wyniku Gateway, gdzie ten sam obiekt jest dostępny pod `result.deliveryStatus`.

Typowe pola:

- `requested`: zawsze `true`, gdy obiekt jest obecny.
- `attempted`: `true` po wykonaniu trwałej ścieżki wysyłki; `false` w przypadku niepowodzeń kontroli wstępnej albo braku widocznych ładunków.
- `succeeded`: `true`, `false` albo `"partial"`; `"partial"` łączy się ze `status: "partial_failed"`.
- `reason`: powód w formacie snake-case małymi literami z trwałego dostarczania albo walidacji wstępnej. Znane powody obejmują `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` i `no_delivery_target`; nieudane trwałe wysyłki mogą również zgłosić nieudany etap. Traktuj nieznane wartości jako nieprzezroczyste, ponieważ zbiór może się rozszerzać.
- `resultCount`: liczba wyników wysyłki kanału, gdy jest dostępna.
- `sentBeforeError`: `true`, gdy częściowe niepowodzenie wysłało co najmniej jeden ładunek przed błędem.
- `error`: wartość logiczna `true` dla wysyłek nieudanych lub częściowo nieudanych.
- `errorMessage`: uwzględniane tylko wtedy, gdy przechwycono bazowy komunikat błędu dostarczania. Niepowodzenia kontroli wstępnej przenoszą `error` i `reason`, ale bez `errorMessage`.
- `payloadOutcomes`: opcjonalne wyniki dla poszczególnych ładunków z `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` albo metadanymi hooka, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
