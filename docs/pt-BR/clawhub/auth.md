---
read_when:
    - Entrando no ClawHub
    - Usando a CLI do ClawHub
    - Depuração de 401s
summary: Login no ClawHub, tokens de API, login pela CLI, armazenamento de tokens e revogação.
x-i18n:
    generated_at: "2026-07-02T17:32:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticação

O ClawHub usa o GitHub para login na web. A CLI usa tokens da API do ClawHub criados
por meio dessa conta autenticada.

## Login na web

Use o GitHub para fazer login em [clawhub.ai](https://clawhub.ai).

Contas excluídas, banidas ou desativadas não podem concluir o login normal no ClawHub.
Se o login devolver você a um estado desconectado, sua conta pode não estar em situação
regular. Se sua conta foi banida ou desativada, use o
[formulário de recurso do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso é um
erro.

## Login pela CLI

O fluxo padrão de login pela CLI abre seu navegador:

```bash
clawhub login
clawhub whoami
```

O que acontece:

1. A CLI inicia um servidor de retorno de chamada temporário em `127.0.0.1`.
2. Seu navegador abre a página de login do ClawHub.
3. Após o login pelo GitHub, o ClawHub cria um token de API.
4. O navegador redireciona de volta para o retorno de chamada local.
5. A CLI armazena o token no arquivo de configuração do ClawHub.

Se seu navegador não conseguir acessar o retorno de chamada local por causa de regras de firewall, VPN ou
proxy, use o fluxo de token sem interface gráfica.

## Login sem interface gráfica

Crie um token na interface web do ClawHub e então passe-o para a CLI:

```bash
clawhub login --token clh_...
```

Use este fluxo para servidores, tarefas de CI ou ambientes somente de terminal.

Para shells remotos em que você pode abrir um navegador em outro lugar, execute:

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

Imprima o token armazenado para configuração de CI com:

```bash
clawhub token
```

## Revogação

Você pode revogar tokens de API na interface web do ClawHub.

Tokens revogados, inválidos ou ausentes retornam `401 Unauthorized`. Faça login novamente
com `clawhub login` ou forneça um token novo com `clawhub login --token`.

Contas excluídas, banidas ou desativadas não podem continuar usando tokens de API existentes.
Se sua conta foi banida ou desativada, use o
[formulário de recurso do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso é um
erro.
