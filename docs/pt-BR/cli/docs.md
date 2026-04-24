---
read_when:
    - Você quer pesquisar a documentação ativa do OpenClaw pelo terminal
summary: Referência da CLI para `openclaw docs` (pesquisar o índice ativo da documentação)
title: Docs
x-i18n:
    generated_at: "2026-04-24T05:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Pesquise o índice ativo da documentação.

Argumentos:

- `[query...]`: termos de pesquisa para enviar ao índice ativo da documentação

Exemplos:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Observações:

- Sem consulta, `openclaw docs` abre o ponto de entrada da pesquisa na documentação ativa.
- Consultas com várias palavras são passadas como uma única solicitação de pesquisa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
