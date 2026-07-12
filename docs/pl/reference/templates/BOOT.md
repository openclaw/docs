---
read_when:
    - Dodawanie listy kontrolnej BOOT.md
summary: Szablon przestrzeni roboczej dla BOOT.md
title: Szablon BOOT.md
x-i18n:
    generated_at: "2026-07-12T15:39:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Dodaj tutaj krótkie, jednoznaczne instrukcje uruchamiania. Dołączony hook `boot-md` uruchamia ten plik raz dla każdego obszaru roboczego agenta przy każdym uruchomieniu Gateway, jeśli plik istnieje i zawiera znaki inne niż białe. Wielu agentów współdzielących obszar roboczy wyzwala tylko jedno uruchomienie.

Hook jest domyślnie wyłączony. Najpierw go włącz:

```bash
openclaw hooks enable boot-md
```

Jeśli pozycja listy kontrolnej wysyła wiadomość, użyj narzędzia wiadomości, a następnie odpowiedz dokładnym tokenem ciszy `NO_REPLY` (bez rozróżniania wielkości liter).

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Hooki](/pl/automation/hooks#boot-md)
