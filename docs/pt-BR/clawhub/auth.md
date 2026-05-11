---
read_when:
    - Entrar no ClawHub
    - Como usar a CLI do ClawHub
    - Depuração de 401s
summary: Login no ClawHub, tokens de API, login na CLI, armazenamento de tokens e revogação.
x-i18n:
    generated_at: "2026-05-11T22:19:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticação

O ClawHub usa o GitHub para login na web. A CLI usa tokens de API do ClawHub criados
por meio dessa conta conectada.

## Login na web

Use o GitHub para fazer login em [clawhub.ai](https://clawhub.ai).

Contas excluídas, banidas ou desativadas não conseguem concluir o login normal no ClawHub.
Se o login devolver você a um estado desconectado, sua conta pode não estar em
situação regular.

## Login pela CLI

O fluxo padrão de login pela CLI abre seu navegador:

```bash
clawhub login
clawhub whoami
```

O que acontece:

1. A CLI inicia um servidor temporário de callback em `127.0.0.1`.
2. Seu navegador abre a página de login do ClawHub.
3. Após o login pelo GitHub, o ClawHub cria um token de API.
4. O navegador redireciona de volta para o callback local.
5. A CLI armazena o token no arquivo de configuração do ClawHub.

Se seu navegador não conseguir acessar o callback local por causa de regras de firewall, VPN ou
proxy, use o fluxo de token sem interface gráfica.

## Login sem interface gráfica

Crie um token na interface web do ClawHub e passe-o para a CLI:

```bash
clawhub login --token clh_...
```

Use esse fluxo para servidores, tarefas de CI ou ambientes apenas com terminal.

Para shells remotos nos quais você pode abrir um navegador em outro lugar, execute:

```bash
clawhub login --device
```

A CLI imprime um código de uso único e aguarda enquanto você o autoriza em
`https://clawhub.ai/cli/device`.

## Armazenamento de tokens

Caminhos de configuração padrão:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Substitua o caminho com:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## Revogação

Você pode revogar tokens de API na interface web do ClawHub.

Tokens revogados, inválidos ou ausentes retornam `401 Unauthorized`. Faça login novamente
com `clawhub login` ou forneça um token novo com `clawhub login --token`.

Contas excluídas, banidas ou desativadas não podem continuar usando tokens de API existentes.
