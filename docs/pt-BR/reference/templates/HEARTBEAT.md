---
read_when:
    - Inicializando um espaço de trabalho manualmente
summary: Modelo de espaço de trabalho para HEARTBEAT.md
title: Modelo de HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T00:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Modelo de HEARTBEAT.md

`HEARTBEAT.md` fica no espaço de trabalho do agente e contém a lista de verificação periódica do Heartbeat. Mantenha-o vazio, ou apenas com espaços em branco, comentários Markdown, cabeçalhos ATX, itens de lista vazios (`- `, `* [ ]`) ou marcadores de cercas, para que o OpenClaw ignore completamente a chamada do modelo do Heartbeat (`reason=empty-heartbeat-file`).

Conteúdo padrão distribuído:

```markdown
<!-- Modelo de Heartbeat; conteúdo apenas com comentários impede chamadas agendadas à API do Heartbeat. -->

# Mantenha este arquivo vazio (ou apenas com comentários) para ignorar chamadas à API do Heartbeat.

# Adicione tarefas abaixo quando quiser que o agente verifique algo periodicamente.
```

Adicione tarefas curtas abaixo das linhas de comentário somente quando quiser verificações periódicas. Mantenha o conteúdo pequeno: as execuções do Heartbeat leem este arquivo a cada ciclo (por padrão, a cada 30 minutos), portanto, instruções excessivas consomem tokens a cada ativação.

Para verificações apenas quando estiverem agendadas, em vez de uma lista de verificação simples, use um bloco estruturado `tasks:` com os campos `interval` e `prompt` para cada tarefa; consulte [HEARTBEAT.md](/pt-BR/gateway/heartbeat#heartbeatmd-optional) para ver o formato e o comportamento.

## Relacionado

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Configuração do Heartbeat](/pt-BR/gateway/config-agents)
