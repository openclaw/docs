---
read_when:
    - Ręczne bootstrapping obszaru roboczego
summary: Szablon obszaru roboczego dla HEARTBEAT.md
title: Szablon HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:20:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Szablon HEARTBEAT.md

`HEARTBEAT.md` znajduje się w obszarze roboczym agenta. Pozostaw plik pusty albo zawierający tylko komentarze i nagłówki Markdown, gdy chcesz, aby OpenClaw pomijał wywołania modelu Heartbeat.

Domyślny szablon środowiska uruchomieniowego to:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Dodawaj krótkie zadania pod komentarzami tylko wtedy, gdy chcesz, aby agent okresowo coś sprawdzał. Instrukcje Heartbeat powinny być krótkie, ponieważ są odczytywane podczas powtarzających się wybudzeń.

## Powiązane

- [Konfiguracja Heartbeat](/pl/gateway/config-agents)
