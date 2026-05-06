---
read_when:
    - Chcesz wyzwalać uruchomienia agenta ze skryptów lub z wiersza poleceń
    - Musisz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Wysyłanie przez agenta
x-i18n:
    generated_at: "2026-05-06T09:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` uruchamia jedną turę agenta z wiersza poleceń bez potrzeby
przychodzącej wiadomości czatu. Używaj go do skryptowanych przepływów pracy,
testowania i dostarczania programowego.

## Szybki start

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    To wysyła wiadomość przez Gateway i wypisuje odpowiedź.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
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
| `--message \<text\>`          | Wiadomość do wysłania (wymagana)                            |
| `--to \<dest\>`               | Wyprowadź klucz sesji z celu (telefon, identyfikator czatu) |
| `--agent \<id\>`              | Wskaż skonfigurowanego agenta (używa jego sesji `main`)     |
| `--session-id \<id\>`         | Użyj ponownie istniejącej sesji według identyfikatora        |
| `--local`                     | Wymuś lokalny wbudowany runtime (pomiń Gateway)             |
| `--deliver`                   | Wyślij odpowiedź do kanału czatu                            |
| `--channel \<name\>`          | Kanał dostarczania (whatsapp, telegram, discord, slack itp.) |
| `--reply-to \<target\>`       | Nadpisanie celu dostarczania                                |
| `--reply-channel \<name\>`    | Nadpisanie kanału dostarczania                              |
| `--reply-account \<id\>`      | Nadpisanie identyfikatora konta dostarczania                |
| `--thinking \<level\>`        | Ustaw poziom myślenia dla wybranego profilu modelu          |
| `--verbose \<on\|full\|off\>` | Ustaw poziom szczegółowości                                 |
| `--timeout \<seconds\>`       | Nadpisz limit czasu agenta                                  |
| `--json`                      | Wypisz strukturalny JSON                                    |

## Zachowanie

- Domyślnie CLI przechodzi **przez Gateway**. Dodaj `--local`, aby wymusić
  wbudowany runtime na bieżącej maszynie.
- Jeśli Gateway jest nieosiągalny, CLI **przełącza się awaryjnie** na lokalne wbudowane uruchomienie.
- Wybór sesji: `--to` wyprowadza klucz sesji (cele grup/kanałów
  zachowują izolację; czaty bezpośrednie zwijają się do `main`).
- Flagi myślenia i szczegółowości są utrwalane w magazynie sesji.
- Wyjście: domyślnie zwykły tekst albo `--json` dla strukturalnego ładunku i metadanych.

## Przykłady

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/pl/cli/agent" icon="terminal">
    Pełna dokumentacja flag i opcji `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/pl/tools/subagents" icon="users">
    Uruchamianie podagentów w tle.
  </Card>
  <Card title="Sessions" href="/pl/concepts/session" icon="comments">
    Jak działają klucze sesji i jak `--to`, `--agent` oraz `--session-id` je rozpoznają.
  </Card>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="slash">
    Natywny katalog poleceń używany wewnątrz sesji agentów.
  </Card>
</CardGroup>
