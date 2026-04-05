---
read_when:
    - Chcesz wywoływać uruchomienia agenta ze skryptów lub z wiersza poleceń
    - Musisz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Agent Send
x-i18n:
    generated_at: "2026-04-05T14:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` uruchamia pojedynczą turę agenta z wiersza poleceń bez potrzeby
otrzymania przychodzącej wiadomości czatu. Używaj go do przepływów skryptowych, testów i
programowego dostarczania.

## Szybki start

<Steps>
  <Step title="Uruchom prostą turę agenta">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    To wysyła wiadomość przez Gateway i wypisuje odpowiedź.

  </Step>

  <Step title="Skieruj do konkretnego agenta lub sesji">
    ```bash
    # Skieruj do konkretnego agenta
    openclaw agent --agent ops --message "Summarize logs"

    # Skieruj do numeru telefonu (wyprowadza klucz sesji)
    openclaw agent --to +15555550123 --message "Status update"

    # Użyj istniejącej sesji ponownie
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Dostarcz odpowiedź do kanału">
    ```bash
    # Dostarcz do WhatsApp (domyślny kanał)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Dostarcz do Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flagi

| Flaga                         | Opis                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Wiadomość do wysłania (wymagana)                            |
| `--to \<dest\>`               | Wyprowadza klucz sesji z celu (telefon, identyfikator czatu) |
| `--agent \<id\>`              | Kieruje do skonfigurowanego agenta (używa jego sesji `main`) |
| `--session-id \<id\>`         | Ponownie używa istniejącej sesji według identyfikatora      |
| `--local`                     | Wymusza lokalny osadzony runtime (pomija Gateway)           |
| `--deliver`                   | Wysyła odpowiedź do kanału czatu                            |
| `--channel \<name\>`          | Kanał dostarczenia (whatsapp, telegram, discord, slack itp.) |
| `--reply-to \<target\>`       | Nadpisanie celu dostarczenia                                |
| `--reply-channel \<name\>`    | Nadpisanie kanału dostarczenia                              |
| `--reply-account \<id\>`      | Nadpisanie identyfikatora konta dostarczenia                |
| `--thinking \<level\>`        | Ustawia poziom thinking (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`) |
| `--verbose \<on\|full\|off\>` | Ustawia poziom verbose                                      |
| `--timeout \<seconds\>`       | Nadpisuje limit czasu agenta                                |
| `--json`                      | Zwraca uporządkowany JSON                                   |

## Zachowanie

- Domyślnie CLI działa **przez Gateway**. Dodaj `--local`, aby wymusić
  osadzony runtime na bieżącej maszynie.
- Jeśli Gateway jest nieosiągalny, CLI **wraca** do lokalnego uruchomienia osadzonego.
- Wybór sesji: `--to` wyprowadza klucz sesji (cele grup/kanałów
  zachowują izolację; czaty bezpośrednie są zwijane do `main`).
- Flagi thinking i verbose są utrwalane w magazynie sesji.
- Dane wyjściowe: domyślnie zwykły tekst albo `--json` dla uporządkowanego ładunku i metadanych.

## Przykłady

```bash
# Prosta tura z wyjściem JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Tura z poziomem thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Dostarczenie do innego kanału niż sesja
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Powiązane

- [Dokumentacja CLI agenta](/cli/agent)
- [Sub-agenci](/tools/subagents) — uruchamianie sub-agentów w tle
- [Sesje](/pl/concepts/session) — jak działają klucze sesji
