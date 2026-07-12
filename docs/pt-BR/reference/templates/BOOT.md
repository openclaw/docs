---
read_when:
    - Adicionando uma lista de verificação BOOT.md
summary: Modelo de workspace para BOOT.md
title: Modelo de BOOT.md
x-i18n:
    generated_at: "2026-07-12T15:38:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Adicione aqui instruções de inicialização curtas e explícitas. O hook `boot-md` incluído executa este arquivo uma vez por espaço de trabalho do agente sempre que o Gateway é iniciado, se o arquivo existir e tiver conteúdo que não seja apenas espaço em branco. Vários agentes que compartilham um espaço de trabalho acionam apenas uma execução.

O hook vem desabilitado. Primeiro, habilite-o:

```bash
openclaw hooks enable boot-md
```

Se um item da lista de verificação enviar uma mensagem, use a ferramenta de mensagens e responda com o token silencioso exato `NO_REPLY` (sem distinção entre maiúsculas e minúsculas).

## Relacionados

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Hooks](/pt-BR/automation/hooks#boot-md)
