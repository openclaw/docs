---
read_when:
    - Você quer abrir a interface de controle com seu token atual
    - Você quer exibir a URL sem abrir um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a interface de controle)
title: Painel de controle
x-i18n:
    generated_at: "2026-07-11T23:48:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Abra a interface de controle usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: exibe a URL, mas não inicia um navegador.
- `--yes`: inicia/instala o Gateway sem solicitar confirmação quando necessário.

Observações:

- Resolve SecretRefs configuradas em `gateway.auth.token` quando possível.
- Segue `gateway.tls.enabled`: Gateways com TLS habilitado exibem/abrem URLs da interface de controle com `https://` e se conectam por `wss://`.
- Para uma vinculação `lan` ou `custom` com curinga, as inicializações no mesmo host sempre usam local loopback, pois um curinga não é um destino de navegador. Vinculações `tailnet` e `custom` sem criptografia também usam `127.0.0.1` para que o navegador tenha um contexto seguro; hosts específicos com TLS habilitado mantêm o endereço configurado para que os nomes dos certificados correspondam.
- Antes de fornecer uma URL de local loopback autenticada para uma vinculação de interface específica, o comando testa a interface configurada e verifica se ela e `127.0.0.1` pertencem ao mesmo processo do Gateway. Se a propriedade do listener for ambígua, o comando falha de forma segura e fornece orientações sobre o status.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), a URL exibida/copiada/aberta nunca inclui o token, evitando que segredos externos vazem para a saída do terminal, o histórico da área de transferência ou os argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não estiver resolvido, o comando exibirá uma URL sem token e orientações de correção em vez de um placeholder de token inválido.
- Se o envio para a área de transferência ou para o navegador falhar em uma URL autenticada por token, o comando registrará uma dica segura de autenticação manual que menciona `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` e a chave `token` do fragmento da URL, sem exibir o valor do token.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
