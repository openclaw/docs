---
read_when:
    - Como escrever documentação que inclui tokens, chaves de API ou trechos de credenciais
    - Atualização de exemplos que podem ser verificados por ferramentas de detecção de segredos
summary: Convenções de placeholders seguras para scanners de segredos em documentação e exemplos
title: Convenções de placeholders de segredos
x-i18n:
    generated_at: "2026-07-12T15:36:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenções para placeholders de segredos

Use placeholders legíveis por humanos, mas que não se pareçam com segredos reais.

## Estilo recomendado

- Prefira valores descritivos como `example-openai-key-not-real` ou `example-discord-bot-token`.
- Para trechos de shell, prefira `${OPENAI_API_KEY}` em vez de strings semelhantes a tokens inseridas diretamente.
- Mantenha os exemplos obviamente fictícios e específicos para a finalidade (provedor, canal, tipo de autenticação).

## Evite estes padrões na documentação

- Texto literal de cabeçalho ou rodapé de chave privada PEM.
- Prefixos que se pareçam com credenciais ativas, por exemplo, `sk-...`, `xoxb-...`, `AKIA...`.
- Tokens de portador com aparência realista copiados de logs de runtime.

## Exemplo

```bash
# Bom
export OPENAI_API_KEY="example-openai-key-not-real"

# Melhor (quando a documentação trata da configuração de variáveis de ambiente)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
