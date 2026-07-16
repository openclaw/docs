---
read_when:
    - Você está instalando, configurando ou auditando o plugin de transferência de arquivos
summary: Busque, liste e grave arquivos em nodes pareados por meio de comandos de node dedicados. Contorna o truncamento da saída padrão do bash usando base64 sobre node.invoke para arquivos binários de até 16 MB.
title: Plugin de transferência de arquivos
x-i18n:
    generated_at: "2026-07-16T12:44:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin de transferência de arquivos

Busque, liste e grave arquivos em nodes pareados por meio de comandos de node dedicados. Evita o truncamento da saída padrão do bash usando base64 via node.invoke para arquivos binários de até 16 MB.

## Distribuição

- Pacote: `@openclaw/file-transfer`
- Rota de instalação: incluído no OpenClaw

## Superfície

contratos: `tools`
