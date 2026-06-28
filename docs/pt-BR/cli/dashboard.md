---
read_when:
    - Você quer abrir a UI de Controle com seu token atual
    - Você quer imprimir a URL sem abrir um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a interface de controle)
title: Painel
x-i18n:
    generated_at: "2026-05-05T01:44:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Abra a UI de Controle usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Observações:

- `dashboard` resolve SecretRefs de `gateway.auth.token` configuradas quando possível.
- `dashboard` segue `gateway.tls.enabled`: instâncias de Gateway com TLS habilitado imprimem/abrem URLs da UI de Controle com
  `https://` e se conectam por `wss://`.
- Se a entrega pela área de transferência/navegador falhar para uma URL do painel autenticada por token,
  `dashboard` registra uma dica segura de autenticação manual nomeando `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` e a chave de fragmento `token` sem imprimir o valor do token.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), `dashboard` imprime/copia/abre uma URL sem token para evitar expor segredos externos na saída do terminal, no histórico da área de transferência ou nos argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não for resolvido neste caminho de comando, o comando imprime uma URL sem token e orientações explícitas de correção em vez de incorporar um placeholder de token inválido.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
