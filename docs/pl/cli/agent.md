---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja CLI dla `openclaw agent` (wysyłanie jednej tury agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-07-12T14:59:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Uruchamia jedną turę agenta za pośrednictwem Gateway. Jeśli żądanie do Gateway zakończy się niepowodzeniem, używa wbudowanego agenta; przekaż `--local`, aby od razu wymusić wykonanie wbudowane.

Przekaż co najmniej jeden selektor sesji: `--to`, `--session-key`, `--session-id` lub `--agent`.

Powiązane: [Narzędzie wysyłania agenta](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: treść wiadomości
- `--message-file <path>`: odczytuje treść wiadomości z pliku UTF-8
- `-t, --to <dest>`: odbiorca używany do wyznaczenia klucza sesji
- `--session-key <key>`: jawny klucz sesji używany do routingu
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; zastępuje powiązania routingu
- `--model <id>`: nadpisanie modelu dla tego uruchomienia (`provider/model` lub identyfikator modelu)
- `--thinking <level>`: poziom rozumowania agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez dostawcę, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: zapisuje poziom szczegółowości dla sesji
- `--channel <channel>`: kanał dostarczania; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: nadpisanie celu dostarczania
- `--reply-channel <channel>`: nadpisanie kanału dostarczania
- `--reply-account <id>`: nadpisanie konta dostarczania
- `--local`: uruchamia wbudowanego agenta bezpośrednio (po wstępnym załadowaniu rejestru pluginów)
- `--deliver`: wysyła odpowiedź z powrotem do wybranego kanału lub celu
- `--timeout <seconds>`: nadpisuje limit czasu agenta (domyślnie 600 lub `agents.defaults.timeoutSeconds`); `0` wyłącza limit czasu
- `--json`: generuje dane wyjściowe JSON

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

- Przekaż dokładnie jedną z opcji `--message` lub `--message-file`. Opcja `--message-file` usuwa początkowy znacznik BOM UTF-8 i zachowuje zawartość wielowierszową; odrzuca pliki, które nie są prawidłowym UTF-8.
- Polecenia z ukośnikiem (na przykład `/compact`) nie mogą być uruchamiane przez `--message`. CLI odrzuca je i wskazuje zamiast tego dedykowane polecenie (`openclaw sessions compact <key>` w przypadku Compaction).
- Uruchomienia z `--local` i z użyciem wbudowanego mechanizmu awaryjnego są jednorazowe: dołączone zasoby MCP local loopback oraz rozgrzane sesje Claude stdio otwarte na potrzeby uruchomienia są zamykane po odpowiedzi, dzięki czemu wywołania skryptowe nie pozostawiają uruchomionych lokalnych procesów potomnych. Uruchomienia obsługiwane przez Gateway pozostawiają natomiast zasoby MCP local loopback należące do Gateway w ramach działającego procesu Gateway.
- Gdy opcje `--agent`, `--channel` i `--to` są używane razem, routing sesji korzysta z kanonicznego odbiorcy kanału oraz `session.dmScope`. Kanały ze stabilną tożsamością odbiorcy używaną wyłącznie do wysyłania korzystają z sesji należącej do dostawcy, odizolowanej od głównej sesji agenta. Opcje `--reply-channel` i `--reply-account` wpływają wyłącznie na dostarczanie.
- `--session-key` wybiera jawny klucz sesji. Klucze z prefiksem agenta muszą mieć postać `agent:<agent-id>:<session-key>`, a gdy podano obie opcje, `--agent` musi odpowiadać identyfikatorowi agenta w kluczu. Zwykłe klucze, które nie są wartościami specjalnymi, są przypisywane do `--agent`, jeśli go podano, lub w przeciwnym razie do skonfigurowanego agenta domyślnego; na przykład `--agent ops --session-key incident-42` kieruje do `agent:ops:incident-42`. Dosłowne klucze `global` i `unknown` pozostają bez przypisanego zakresu tylko wtedy, gdy nie podano `--agent`.
- `--json` rezerwuje standardowe wyjście dla odpowiedzi JSON; diagnostyka Gateway, pluginów i wbudowanego mechanizmu awaryjnego trafia do standardowego wyjścia błędów, dzięki czemu skrypty mogą bezpośrednio analizować standardowe wyjście.
- JSON wbudowanego mechanizmu awaryjnego zawiera `meta.transport: "embedded"` oraz `meta.fallbackFrom: "gateway"`, dzięki czemu skrypty mogą wykryć uruchomienie awaryjne.
- Jeśli Gateway zaakceptuje uruchomienie, ale podczas oczekiwania CLI na końcową odpowiedź upłynie limit czasu, wbudowany mechanizm awaryjny używa nowego identyfikatora sesji i uruchomienia `gateway-fallback-*` oraz zgłasza `meta.fallbackReason: "gateway_timeout"` wraz z polami sesji awaryjnej, zamiast konkurować z transkrypcją należącą do Gateway lub po cichu zastępować pierwotną sesję.
- `SIGTERM`/`SIGINT` przerywają oczekujące żądanie obsługiwane przez Gateway; jeśli Gateway zaakceptował już uruchomienie, przed zakończeniem CLI wysyła również `chat.abort` dla identyfikatora tego uruchomienia. Uruchomienia z `--local` i wbudowanym mechanizmem awaryjnym otrzymują ten sam sygnał, ale nie wysyłają `chat.abort`. Jeśli wewnętrzny klucz deduplikacji uruchomień ma już aktywne uruchomienie dla tej sesji, odpowiedź zgłasza `status: "in_flight"`, a CLI bez JSON wypisuje komunikat diagnostyczny na standardowe wyjście błędów zamiast pustej odpowiedzi. W zewnętrznych wrapperach cron/systemd zachowaj awaryjne wymuszone zakończenie, na przykład `timeout -k 60 600 openclaw agent ...`, aby nadzorca mógł zakończyć proces, jeśli podczas zamykania nie uda się opróżnić kolejki.
- Gdy to polecenie wywołuje ponowne wygenerowanie pliku `models.json`, dane uwierzytelniające dostawcy zarządzane przez SecretRef są zapisywane jako znaczniki niebędące sekretami (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), nigdy jako jawny tekst rozwiązanych sekretów. Zapisy znaczników pochodzą z aktywnej migawki konfiguracji źródłowej, a nie z rozwiązanych wartości sekretów środowiska wykonawczego.

## Stan dostarczania JSON

W przypadku użycia `--json --deliver` odpowiedź JSON CLI zawiera pole najwyższego poziomu `deliveryStatus`, dzięki czemu skrypty mogą rozróżniać wysyłki dostarczone, pominięte, częściowe i zakończone niepowodzeniem:

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

Odpowiedzi CLI obsługiwane przez Gateway zachowują również surową strukturę wyniku Gateway w `result.deliveryStatus`.

`deliveryStatus.status` przyjmuje jedną z następujących wartości:

| Stan             | Znaczenie                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Dostarczanie zakończone.                                                                                                                                   |
| `suppressed`     | Dostarczanie celowo nie zostało wykonane (na przykład hook wysyłania wiadomości je anulował lub nie było widocznego wyniku). Stan końcowy, bez ponawiania. |
| `partial_failed` | Co najmniej jeden ładunek został wysłany, zanim wysłanie kolejnego zakończyło się niepowodzeniem.                                                           |
| `failed`         | Nie ukończono żadnej trwałej wysyłki lub kontrola wstępna dostarczania zakończyła się niepowodzeniem.                                                       |

Typowe pola:

- `requested`: zawsze `true`, gdy obiekt jest obecny.
- `attempted`: `true`, gdy uruchomiono ścieżkę trwałego wysyłania; `false` w przypadku niepowodzeń kontroli wstępnej lub braku widocznych ładunków.
- `succeeded`: `true`, `false` lub `"partial"`; wartość `"partial"` występuje wraz z `status: "partial_failed"`.
- `reason`: powód zapisany małymi literami w formacie snake_case, pochodzący z trwałego dostarczania lub walidacji wstępnej. Znane wartości obejmują `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` i `no_delivery_target`; zakończone niepowodzeniem trwałe wysyłki mogą również zgłaszać etap, na którym wystąpiło niepowodzenie. Nieznane wartości traktuj jako nieprzezroczyste, ponieważ zbiór może się rozszerzać.
- `resultCount`: liczba wyników wysyłania przez kanał, jeśli jest dostępna.
- `sentBeforeError`: `true`, gdy w przypadku częściowego niepowodzenia co najmniej jeden ładunek został wysłany przed wystąpieniem błędu.
- `error`: `true` w przypadku wysyłek zakończonych całkowitym lub częściowym niepowodzeniem.
- `errorMessage`: występuje tylko wtedy, gdy przechwycono bazowy komunikat o błędzie dostarczania. Niepowodzenia kontroli wstępnej zawierają `error`/`reason`, ale nie zawierają `errorMessage`.
- `payloadOutcomes`: opcjonalne wyniki poszczególnych ładunków z polami `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` lub, jeśli są dostępne, metadanymi hooka.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Środowisko wykonawcze agenta](/pl/concepts/agent)
