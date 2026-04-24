---
read_when:
    - Você quer abrir a interface do Control com seu token atual
    - Você quer imprimir a URL sem abrir um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a interface do Control)
title: Painel
x-i18n:
    generated_at: "2026-04-24T05:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Abra a interface do Control usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Observações:

- `dashboard` resolve SecretRefs configurados em `gateway.auth.token` quando possível.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), `dashboard` imprime/copia/abre uma URL sem token para evitar expor segredos externos na saída do terminal, no histórico da área de transferência ou nos argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não resolvido neste caminho de comando, o comando imprimirá uma URL sem token e orientações explícitas de correção em vez de incorporar um placeholder de token inválido.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
