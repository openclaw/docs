---
read_when:
    - Você quer abrir a interface de controle com seu token atual
    - Você quer exibir a URL sem abrir um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a interface de controle)
title: Painel de controle
x-i18n:
    generated_at: "2026-07-12T15:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

- `--no-open`: exibe a URL, mas não abre um navegador.
- `--yes`: inicia/instala o Gateway sem solicitar confirmação quando necessário.

Observações:

- Resolve SecretRefs configuradas em `gateway.auth.token` quando possível.
- Segue `gateway.tls.enabled`: Gateways com TLS habilitado exibem/abrem URLs da interface de controle com `https://` e se conectam por `wss://`.
- Para uma vinculação `lan` ou `custom` com curinga, as aberturas no mesmo host sempre usam loopback, pois um curinga não é um destino de navegador. Vinculações `tailnet` e `custom` sem criptografia também usam `127.0.0.1` para que o navegador tenha um contexto seguro; hosts específicos com TLS habilitado mantêm o endereço configurado para que os nomes dos certificados correspondam.
- Antes de fornecer uma URL de loopback autenticada para uma vinculação a uma interface específica, o comando verifica a interface configurada e confirma que ela e `127.0.0.1` pertencem ao mesmo processo do Gateway. Se a propriedade do listener for ambígua, a operação falha de forma segura, com orientações de status.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), a URL exibida/copiada/aberta nunca inclui o token, para que segredos externos não vazem para a saída do terminal, o histórico da área de transferência nem os argumentos de abertura do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não estiver resolvido, o comando exibirá uma URL sem token e orientações de correção, em vez de um espaço reservado de token inválido.
- Se o envio para a área de transferência/navegador falhar para uma URL autenticada por token, o comando registra uma dica segura de autenticação manual que menciona `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` e a chave `token` do fragmento da URL, sem exibir o valor do token.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
