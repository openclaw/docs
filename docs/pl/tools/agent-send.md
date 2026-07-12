---
read_when:
    - Chcesz uruchamiać agenta ze skryptów lub z wiersza poleceń
    - Musisz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z poziomu CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Wysyłanie przez agenta
x-i18n:
    generated_at: "2026-07-12T15:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` uruchamia pojedynczą turę agenta z wiersza poleceń bez
przychodzącej wiadomości czatu. Używaj go w skryptowanych przepływach pracy, testach i
dostarczaniu programistycznym. Pełna dokumentacja flag i zachowania:
[Dokumentacja CLI agenta](/pl/cli/agent).

## Szybki start

<Steps>
  <Step title="Uruchom prostą turę agenta">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Wysyła wiadomość przez Gateway i wyświetla odpowiedź.

  </Step>

  <Step title="Wyślij wielowierszowy monit z pliku">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Odczytuje prawidłowy plik UTF-8 jako treść wiadomości agenta.

  </Step>

  <Step title="Wybierz określonego agenta lub sesję">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Dostarcz odpowiedź do kanału">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flagi

| Flaga                       | Opis                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `--message <text>`          | Wiadomość wbudowana do wysłania                                       |
| `--message-file <path>`     | Odczytanie wiadomości z prawidłowego pliku UTF-8                       |
| `--to <dest>`               | Wyprowadzenie klucza sesji z odbiorcy (telefonu, identyfikatora czatu) |
| `--session-key <key>`       | Użycie jawnego klucza sesji                                           |
| `--agent <id>`              | Wybór skonfigurowanego agenta (używa jego sesji `main`)                |
| `--session-id <id>`         | Ponowne użycie istniejącej sesji według identyfikatora                 |
| `--model <id>`              | Zastąpienie modelu dla tego uruchomienia (`provider/model` lub identyfikator modelu) |
| `--local`                   | Wymuszenie lokalnego, osadzonego środowiska wykonawczego (z pominięciem Gateway) |
| `--deliver`                 | Wysłanie odpowiedzi do kanału czatu                                   |
| `--channel <name>`          | Kanał dostarczania; z `--agent` + `--to` dotyczy również zakresu wiadomości bezpośrednich |
| `--reply-to <target>`       | Zastąpienie odbiorcy dostarczania                                     |
| `--reply-channel <name>`    | Zastąpienie kanału dostarczania                                       |
| `--reply-account <id>`      | Zastąpienie identyfikatora konta używanego do dostarczania             |
| `--thinking <level>`        | Ustawienie poziomu rozumowania dla wybranego profilu modelu            |
| `--verbose <on\|full\|off>` | Utrwalenie poziomu szczegółowości dla sesji (`full` rejestruje także dane wyjściowe narzędzi) |
| `--timeout <seconds>`       | Zastąpienie limitu czasu agenta (domyślnie 600 lub wartość konfiguracji) |
| `--json`                    | Wyświetlenie ustrukturyzowanego formatu JSON                           |

## Zachowanie

- Domyślnie CLI działa **przez Gateway**. Dodaj `--local`, aby wymusić
  osadzone środowisko wykonawcze na bieżącym komputerze.
- Przekaż dokładnie jedną z opcji `--message` lub `--message-file`. Wiadomości z pliku zachowują
  wielowierszową treść po usunięciu opcjonalnego znacznika BOM UTF-8.
- Jeśli żądanie Gateway zakończy się niepowodzeniem, CLI **przełącza się**
  na lokalne uruchomienie osadzone; przekroczenie limitu czasu Gateway powoduje przełączenie
  z nową sesją zamiast rywalizacji z pierwotnym transkryptem.
- Wybór sesji: `--to` wyprowadza klucz sesji (odbiorcy grupowi i kanałowi
  zachowują izolację; czaty bezpośrednie są sprowadzane do `main`). Gdy `--agent`,
  `--channel` i `--to` są używane razem, trasowanie wykorzystuje kanonicznego
  odbiorcę kanału oraz `session.dmScope`. Stabilne tożsamości używane wyłącznie
  do wysyłania korzystają z sesji należącej do dostawcy, odizolowanej od głównej sesji agenta.
- `--session-key` wybiera jawny klucz. Klucze z prefiksem agenta muszą mieć postać
  `agent:<agent-id>:<session-key>`, a gdy podano również `--agent`, jego identyfikator musi
  być zgodny z tym identyfikatorem agenta. Zwykłe klucze niebędące wartościami specjalnymi są
  przypisywane do `--agent`, jeśli go podano; na przykład
  `--agent ops --session-key incident-42` prowadzi do
  `agent:ops:incident-42`. Bez `--agent` zwykłe klucze niebędące wartościami specjalnymi
  są przypisywane do skonfigurowanego agenta domyślnego. Literały `global` i `unknown`
  pozostają bez zakresu tylko wtedy, gdy nie podano `--agent`; osadzona ścieżka
  rezerwowa przypisuje te specjalne sesje do skonfigurowanego agenta domyślnego.
- `--reply-channel` i `--reply-account` wpływają tylko na dostarczanie.
- Flagi poziomu rozumowania i szczegółowości są utrwalane w magazynie sesji.
- Dane wyjściowe: domyślnie zwykły tekst lub `--json` dla ustrukturyzowanego ładunku i metadanych.
- W przypadku `--json --deliver` dane JSON zawierają stan dostarczania dla wysyłek
  wysłanych, pominiętych, częściowych i zakończonych niepowodzeniem. Zobacz
  [Stan dostarczania JSON](/pl/cli/agent#json-delivery-status).

## Przykłady

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Dokumentacja CLI agenta" href="/pl/cli/agent" icon="terminal">
    Pełna dokumentacja flag i opcji polecenia `openclaw agent`.
  </Card>
  <Card title="Podagenci" href="/pl/tools/subagents" icon="users">
    Uruchamianie podagentów w tle.
  </Card>
  <Card title="Sesje" href="/pl/concepts/session" icon="comments">
    Sposób działania kluczy sesji oraz rozwiązywania ich przez `--to`, `--agent` i `--session-id`.
  </Card>
  <Card title="Polecenia z ukośnikiem" href="/pl/tools/slash-commands" icon="slash">
    Katalog natywnych poleceń używanych w sesjach agentów.
  </Card>
</CardGroup>
