---
read_when:
    - Chcesz wywoływać uruchomienia agenta ze skryptów albo z wiersza poleceń
    - Potrzebujesz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Wysyłanie agenta
x-i18n:
    generated_at: "2026-04-24T09:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` uruchamia pojedynczą turę agenta z wiersza poleceń bez potrzeby
otrzymania przychodzącej wiadomości czatu. Używaj go do skryptowych przepływów pracy, testów i
programowego dostarczania.

## Szybki start

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "Jaka jest dziś pogoda?"
    ```

    To wysyła wiadomość przez Gateway i wypisuje odpowiedź.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Wskaż konkretnego agenta
    openclaw agent --agent ops --message "Podsumuj logi"

    # Wskaż numer telefonu (wyprowadza klucz sesji)
    openclaw agent --to +15555550123 --message "Aktualizacja statusu"

    # Użyj ponownie istniejącej sesji
    openclaw agent --session-id abc123 --message "Kontynuuj zadanie"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Dostarcz do WhatsApp (domyślny kanał)
    openclaw agent --to +15555550123 --message "Raport gotowy" --deliver

    # Dostarcz do Slack
    openclaw agent --agent ops --message "Wygeneruj raport" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flagi

| Flaga                        | Opis                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`         | Wiadomość do wysłania (wymagane)                            |
| `--to \<dest\>`              | Wyprowadza klucz sesji z celu (telefon, chat id)            |
| `--agent \<id\>`             | Wskazuje skonfigurowanego agenta (używa jego sesji `main`)  |
| `--session-id \<id\>`        | Używa ponownie istniejącej sesji według id                  |
| `--local`                    | Wymusza lokalny osadzony runtime (pomija Gateway)           |
| `--deliver`                  | Wysyła odpowiedź do kanału czatu                            |
| `--channel \<name\>`         | Kanał dostarczania (whatsapp, telegram, discord, slack itd.) |
| `--reply-to \<target\>`      | Nadpisanie celu dostarczania                                |
| `--reply-channel \<name\>`   | Nadpisanie kanału dostarczania                              |
| `--reply-account \<id\>`     | Nadpisanie identyfikatora konta dostarczania                |
| `--thinking \<level\>`       | Ustawia poziom myślenia dla wybranego profilu modelu        |
| `--verbose \<on\|full\|off\>` | Ustawia poziom verbose                                     |
| `--timeout \<seconds\>`      | Nadpisuje timeout agenta                                    |
| `--json`                     | Dane wyjściowe w uporządkowanym JSON                        |

## Zachowanie

- Domyślnie CLI przechodzi **przez Gateway**. Dodaj `--local`, aby wymusić
  osadzony runtime na bieżącej maszynie.
- Jeśli Gateway jest nieosiągalny, CLI **wraca** do lokalnego uruchomienia osadzonego.
- Wybór sesji: `--to` wyprowadza klucz sesji (cele grup/kanałów
  zachowują izolację; czaty bezpośrednie zwijają się do `main`).
- Flagi thinking i verbose są utrwalane w magazynie sesji.
- Dane wyjściowe: domyślnie zwykły tekst albo `--json` dla uporządkowanego ładunku + metadanych.

## Przykłady

```bash
# Prosta tura z wyjściem JSON
openclaw agent --to +15555550123 --message "Prześledź logi" --verbose on --json

# Tura z poziomem myślenia
openclaw agent --session-id 1234 --message "Podsumuj skrzynkę odbiorczą" --thinking medium

# Dostarcz do innego kanału niż sesja
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Powiązane

- [Agent CLI reference](/pl/cli/agent)
- [Sub-agents](/pl/tools/subagents) — uruchamianie subagentów w tle
- [Sessions](/pl/concepts/session) — jak działają klucze sesji
