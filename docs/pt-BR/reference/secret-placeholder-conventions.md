---
read_when:
    - Escrevendo documentação que inclui tokens, chaves de API ou trechos de credenciais
    - Atualizando exemplos que podem ser verificados por ferramentas de detecção de segredos
summary: Convenções de placeholders seguras para scanner de segredos em documentação e exemplos
title: Convenções de espaços reservados de segredos
x-i18n:
    generated_at: "2026-06-27T18:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenções de placeholders de segredos

Use placeholders que sejam legíveis por humanos, mas que não pareçam segredos reais.

## Estilo recomendado

- Prefira valores descritivos como `example-openai-key-not-real` ou `example-discord-bot-token`.
- Para trechos de shell, prefira `${OPENAI_API_KEY}` em vez de strings inline que pareçam tokens.
- Mantenha os exemplos obviamente falsos e restritos ao propósito (provedor, canal, tipo de autenticação).

## Evite estes padrões na documentação

- Texto literal de cabeçalho ou rodapé de chave privada PEM.
- Prefixos que pareçam credenciais ativas, por exemplo `sk-...`, `xoxb-...`, `AKIA...`.
- Tokens bearer com aparência realista copiados de logs de runtime.

## Exemplo

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
