---
read_when:
    - Inicializando manualmente um workspace
summary: Modelo de espaço de trabalho para HEARTBEAT.md
title: modelo HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# modelo de HEARTBEAT.md

`HEARTBEAT.md` fica no workspace do agente. Mantenha o arquivo vazio, ou apenas com comentários e títulos em Markdown, quando quiser que o OpenClaw ignore chamadas de modelo de Heartbeat.

O modelo padrão do runtime é:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Adicione tarefas curtas abaixo dos comentários somente quando quiser que o agente verifique algo periodicamente. Mantenha as instruções de Heartbeat pequenas, porque elas são lidas durante despertares recorrentes.

## Relacionado

- [Configuração de Heartbeat](/pt-BR/gateway/config-agents)
