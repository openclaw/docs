---
read_when:
    - Chcesz wyzwalać uruchomienia agenta ze skryptów lub z wiersza poleceń
    - Potrzebujesz programowo dostarczać odpowiedzi agenta do kanału czatu
summary: Uruchamiaj tury agenta z CLI i opcjonalnie dostarczaj odpowiedzi do kanałów
title: Wysyłanie przez agenta
x-i18n:
    generated_at: "2026-04-21T10:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Wysyłanie przez agenta

`openclaw agent` uruchamia jedną turę agenta z wiersza poleceń bez potrzeby
otrzymania przychodzącej wiadomości na czacie. Używaj tego do workflow opartych na skryptach, testowania i
programowego dostarczania.

## Szybki start

<Steps>
  <Step title="Uruchom prostą turę agenta">
    ```bash
    openclaw agent --message "Jaka jest dziś pogoda?"
    ```

    To wysyła wiadomość przez Gateway i wypisuje odpowiedź.

  </Step>

  <Step title="Skieruj do konkretnego agenta lub sesji">
    ```bash
    # Skieruj do konkretnego agenta
    openclaw agent --agent ops --message "Podsumuj logi"

    # Skieruj do numeru telefonu (wyprowadza klucz sesji)
    openclaw agent --to +15555550123 --message "Aktualizacja statusu"

    # Użyj ponownie istniejącej sesji
    openclaw agent --session-id abc123 --message "Kontynuuj zadanie"
    ```

  </Step>

  <Step title="Dostarcz odpowiedź do kanału">
    ```bash
    # Dostarcz do WhatsApp (kanał domyślny)
    openclaw agent --to +15555550123 --message "Raport gotowy" --deliver

    # Dostarcz do Slack
    openclaw agent --agent ops --message "Wygeneruj raport" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flagi

| Flaga                         | Opis                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Wiadomość do wysłania (wymagane)                            |
| `--to \<dest\>`               | Wyprowadza klucz sesji z celu (telefon, chat id)            |
| `--agent \<id\>`              | Kieruje do skonfigurowanego agenta (używa jego sesji `main`)|
| `--session-id \<id\>`         | Używa ponownie istniejącej sesji po id                      |
| `--local`                     | Wymusza lokalny osadzony runtime (pomija Gateway)           |
| `--deliver`                   | Wysyła odpowiedź do kanału czatu                            |
| `--channel \<name\>`          | Kanał dostarczenia (whatsapp, telegram, discord, slack itp.)|
| `--reply-to \<target\>`       | Nadpisanie celu dostarczenia                                |
| `--reply-channel \<name\>`    | Nadpisanie kanału dostarczenia                              |
| `--reply-account \<id\>`      | Nadpisanie id konta dostarczenia                            |
| `--thinking \<level\>`        | Ustawia poziom thinking dla wybranego profilu modelu        |
| `--verbose \<on\|full\|off\>` | Ustawia poziom verbose                                      |
| `--timeout \<seconds\>`       | Nadpisuje timeout agenta                                    |
| `--json`                      | Zwraca strukturalny JSON                                    |

## Zachowanie

- Domyślnie CLI działa **przez Gateway**. Dodaj `--local`, aby wymusić
  osadzony runtime na bieżącej maszynie.
- Jeśli Gateway jest nieosiągalny, CLI **wraca** do lokalnego uruchomienia osadzonego.
- Wybór sesji: `--to` wyprowadza klucz sesji (cele grupowe/kanałowe
  zachowują izolację; czaty bezpośrednie zwijają się do `main`).
- Flagi thinking i verbose są utrwalane w magazynie sesji.
- Wyjście: domyślnie zwykły tekst albo `--json` dla uporządkowanego ładunku + metadanych.

## Przykłady

```bash
# Prosta tura z wyjściem JSON
openclaw agent --to +15555550123 --message "Prześledź logi" --verbose on --json

# Tura z poziomem thinking
openclaw agent --session-id 1234 --message "Podsumuj skrzynkę odbiorczą" --thinking medium

# Dostarczenie do innego kanału niż sesja
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Powiązane

- [Dokumentacja CLI agenta](/cli/agent)
- [Sub-agents](/pl/tools/subagents) — uruchamianie sub-agentów w tle
- [Sessions](/pl/concepts/session) — jak działają klucze sesji
