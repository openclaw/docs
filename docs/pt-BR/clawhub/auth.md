---
read_when:
    - Fazendo login no ClawHub
    - Usando a CLI do ClawHub
    - Depuração de erros 401
summary: Login no ClawHub, tokens de API, login na CLI, armazenamento de tokens e revogação.
x-i18n:
    generated_at: "2026-07-12T14:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticação

O ClawHub usa o GitHub para o login na Web. A CLI usa tokens da API do ClawHub criados
por meio dessa conta autenticada.

## Login na Web

Use o GitHub para entrar em [clawhub.ai](https://clawhub.ai).

Contas excluídas, banidas ou desativadas não podem concluir o login normal no ClawHub.
Se o login levar você de volta a um estado desconectado, talvez sua conta não esteja em
situação regular. Se sua conta foi banida ou desativada, use o
[formulário de recurso do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso foi um
engano.

## Login na CLI

O fluxo padrão de login da CLI abre seu navegador:

```bash
clawhub login
clawhub whoami
```

O que acontece:

1. A CLI inicia um servidor temporário de callback em `127.0.0.1`.
2. Seu navegador abre a página de login do ClawHub.
3. Após o login no GitHub, o ClawHub cria um token de API.
4. O navegador redireciona de volta para o callback local.
5. A CLI armazena o token no arquivo de configuração do ClawHub.

Se o navegador não conseguir acessar o callback local devido a regras de firewall, VPN ou
proxy, use o fluxo de token sem interface gráfica.

## Login sem interface gráfica

Crie um token na interface Web do ClawHub e forneça-o à CLI:

```bash
clawhub login --token clh_...
```

Use esse fluxo para servidores, trabalhos de CI ou ambientes que dispõem somente de terminal.

Para shells remotos nos quais você pode abrir um navegador em outro lugar, execute:

```bash
clawhub login --device
```

A CLI exibe um código de uso único e aguarda enquanto você concede autorização em
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

Exiba o token armazenado para configurar a CI com:

```bash
clawhub token
```

## Revogação

Você pode revogar tokens de API na interface Web do ClawHub.

Tokens revogados, inválidos ou ausentes retornam `401 Unauthorized`. Entre novamente
com `clawhub login` ou forneça um token novo com `clawhub login --token`.

Contas excluídas, banidas ou desativadas não podem continuar usando tokens de API existentes.
Se sua conta foi banida ou desativada, use o
[formulário de recurso do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso foi um
engano.
