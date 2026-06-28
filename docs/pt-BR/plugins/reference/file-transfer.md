---
read_when:
    - Você está instalando, configurando ou auditando o Plugin de transferência de arquivos
summary: Busque, liste e grave arquivos em nós pareados por meio de comandos de nó dedicados. Contorna o truncamento de stdout do bash usando base64 via node.invoke para binários de até 16 MB.
title: Plugin de transferência de arquivos
x-i18n:
    generated_at: "2026-05-02T20:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plugin File Transfer

Busque, liste e grave arquivos em nodes pareados por meio de comandos de Node dedicados. Ignora o truncamento de stdout do bash usando base64 por `node.invoke` para binários de até 16 MB.

## Distribuição

- Pacote: `@openclaw/file-transfer`
- Rota de instalação: incluído no OpenClaw

## Superfície

contratos: ferramentas
