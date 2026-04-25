---
read_when:
    - Você quer abrir a Control UI com seu token atual
    - Você quer exibir a URL sem abrir um navegador
summary: Referência de CLI para `openclaw dashboard` (abre a Control UI)
title: Painel
x-i18n:
    generated_at: "2026-04-25T13:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Abre a Control UI usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Observações:

- `dashboard` resolve SecretRefs configurados em `gateway.auth.token` quando possível.
- `dashboard` segue `gateway.tls.enabled`: Gateways com TLS habilitado exibem/abrem
  URLs da Control UI com `https://` e se conectam via `wss://`.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), `dashboard` exibe/copia/abre uma URL sem token para evitar expor segredos externos na saída do terminal, no histórico da área de transferência ou em argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não estiver resolvido neste caminho de comando, o comando exibirá uma URL sem token e orientações explícitas de correção em vez de incorporar um placeholder de token inválido.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
