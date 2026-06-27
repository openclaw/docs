---
read_when:
    - Chcesz uruchamiać przebiegi agenta ze skryptów lub z wiersza poleceń
    - Musisz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Wysyłanie przez agenta
x-i18n:
    generated_at: "2026-06-27T18:24:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` uruchamia pojedynczą turę agenta z wiersza poleceń bez potrzeby
przychodzącej wiadomości czatu. Używaj go do skryptowanych przepływów pracy, testowania i
dostarczania programowego.

## Szybki start

<Steps>
  <Step title="Uruchom prostą turę agenta">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    To wysyła wiadomość przez Gateway i wypisuje odpowiedź.

  </Step>

  <Step title="Wyślij wielowierszowy prompt z pliku">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    To odczytuje poprawny plik UTF-8 jako treść wiadomości agenta.

  </Step>

  <Step title="Wskaż konkretnego agenta lub sesję">
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

| Flaga                         | Opis                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Wiadomość inline do wysłania                                |
| `--message-file \<path\>`     | Odczytaj wiadomość z poprawnego pliku UTF-8                 |
| `--to \<dest\>`               | Wyprowadź klucz sesji z celu (telefonu, identyfikatora czatu) |
| `--session-key \<key\>`       | Użyj jawnego klucza sesji                                   |
| `--agent \<id\>`              | Wskaż skonfigurowanego agenta (używa jego sesji `main`)     |
| `--session-id \<id\>`         | Użyj ponownie istniejącej sesji według identyfikatora       |
| `--local`                     | Wymuś lokalne osadzone środowisko uruchomieniowe (pomiń Gateway) |
| `--deliver`                   | Wyślij odpowiedź do kanału czatu                            |
| `--channel \<name\>`          | Kanał dostarczania (whatsapp, telegram, discord, slack itd.) |
| `--reply-to \<target\>`       | Nadpisanie celu dostarczania                                |
| `--reply-channel \<name\>`    | Nadpisanie kanału dostarczania                              |
| `--reply-account \<id\>`      | Nadpisanie identyfikatora konta dostarczania                |
| `--thinking \<level\>`        | Ustaw poziom myślenia dla wybranego profilu modelu          |
| `--verbose \<on\|full\|off\>` | Ustaw poziom szczegółowości                                 |
| `--timeout \<seconds\>`       | Nadpisz limit czasu agenta                                  |
| `--json`                      | Wypisz ustrukturyzowany JSON                                |

## Zachowanie

- Domyślnie CLI przechodzi **przez Gateway**. Dodaj `--local`, aby wymusić
  osadzone środowisko uruchomieniowe na bieżącej maszynie.
- Przekaż dokładnie jedną z opcji `--message` albo `--message-file`. Wiadomości z pliku zachowują
  treść wielowierszową po usunięciu opcjonalnego znacznika BOM UTF-8.
- Jeśli Gateway jest nieosiągalny, CLI **wraca** do lokalnego uruchomienia osadzonego.
- Wybór sesji: `--to` wyprowadza klucz sesji (cele grup/kanałów
  zachowują izolację; czaty bezpośrednie są sprowadzane do `main`).
- `--session-key` wybiera jawny klucz. Klucze z prefiksem agenta muszą używać formatu
  `agent:<agent-id>:<session-key>`, a `--agent` musi pasować do tego identyfikatora agenta, gdy
  podano oba. Gołe klucze niebędące sentinelem są ograniczane zakresem do `--agent`, gdy
  go podano; na przykład `--agent ops --session-key incident-42` kieruje do
  `agent:ops:incident-42`. Bez `--agent` gołe klucze niebędące sentinelem są ograniczane
  do skonfigurowanego domyślnego agenta. Literały `global` i `unknown` pozostają
  bez zakresu tylko wtedy, gdy nie podano `--agent`; w takim przypadku osadzony fallback
  i własność magazynu używają skonfigurowanego domyślnego agenta.
- Flagi myślenia i szczegółowości są utrwalane w magazynie sesji.
- Dane wyjściowe: domyślnie zwykły tekst albo `--json` dla ustrukturyzowanego ładunku i metadanych.
- Z `--json --deliver` JSON zawiera status dostarczania dla wysyłek
  wysłanych, pominiętych, częściowych i nieudanych. Zobacz
  [status dostarczania JSON](/pl/cli/agent#json-delivery-status).

## Przykłady

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
    Pełna dokumentacja flag i opcji `openclaw agent`.
  </Card>
  <Card title="Podagenci" href="/pl/tools/subagents" icon="users">
    Uruchamianie podagentów w tle.
  </Card>
  <Card title="Sesje" href="/pl/concepts/session" icon="comments">
    Jak działają klucze sesji oraz jak `--to`, `--agent` i `--session-id` je rozpoznają.
  </Card>
  <Card title="Polecenia ukośnikowe" href="/pl/tools/slash-commands" icon="slash">
    Natywny katalog poleceń używany wewnątrz sesji agenta.
  </Card>
</CardGroup>
