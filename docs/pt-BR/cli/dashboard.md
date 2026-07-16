---
read_when:
    - Você quer abrir a interface de controle com seu token atual
    - Você quer exibir a URL sem abrir um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a interface de controle)
title: Painel de controle
x-i18n:
    generated_at: "2026-07-16T12:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Abra a interface de controle usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: exibe a URL, mas não inicia um navegador.
- `--json`: exibe um objeto de conexão legível por máquina sem abrir um navegador, usar a área de transferência, solicitar entrada ou iniciar o Gateway.
- `--yes`: inicia/instala o Gateway sem solicitar confirmação quando necessário.

## Saída legível por máquina

Use `--json` para integrações de desktop e scripts que precisam da URL resolvida da interface de controle:

```bash
openclaw dashboard --json
```

A resposta inclui `url`, `httpUrl`, `wsUrl`, `port` e `tokenIncluded`. Se o Gateway não estiver pronto, o comando retornará `{"ok":false,"reason":"..."}` e será encerrado com um código diferente de zero. Tokens gerenciados por SecretRef nunca são incluídos em `url`.

Observações:

- Resolve SecretRefs de `gateway.auth.token` configurados quando possível.
- Segue `gateway.tls.enabled`: Gateways com TLS habilitado exibem/abrem URLs `https://` da interface de controle e se conectam por `wss://`.
- Para uma vinculação `lan` ou curinga `custom`, as inicializações no mesmo host sempre usam loopback porque um curinga não é um destino de navegador. As vinculações de texto simples `tailnet` e `custom` também usam `127.0.0.1` para que o navegador tenha um contexto seguro; hosts específicos com TLS habilitado mantêm o endereço configurado para que os nomes dos certificados correspondam.
- Antes de fornecer uma URL de loopback autenticada para uma vinculação de interface específica, o comando verifica a interface configurada e confirma que ela e `127.0.0.1` pertencem ao mesmo processo do Gateway. A propriedade ambígua do listener falha de forma segura, com orientações sobre o status.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), a URL exibida/copiada/aberta nunca inclui o token, de modo que segredos externos não vazem para a saída do terminal, o histórico da área de transferência ou os argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não estiver resolvido, o comando exibirá uma URL sem token e orientações de correção, em vez de um espaço reservado de token inválido.
- Se o envio para a área de transferência/navegador falhar para uma URL autenticada por token, o comando registrará uma dica segura de autenticação manual que identifica `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` e a chave de fragmento da URL `token`, sem exibir o valor do token.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Painel](/pt-BR/web/dashboard)
