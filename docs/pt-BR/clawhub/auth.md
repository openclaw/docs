---
read_when:
    - Como entrar no ClawHub
    - Usando a CLI do ClawHub
    - Depuração de erros 401
summary: Login no ClawHub, tokens de API, login na CLI, armazenamento de tokens e revogação.
x-i18n:
    generated_at: "2026-07-11T23:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticação

O ClawHub usa o GitHub para autenticação na Web. A CLI usa tokens da API do ClawHub criados por meio dessa conta autenticada.

## Autenticação na Web

Use o GitHub para entrar em [clawhub.ai](https://clawhub.ai).

Contas excluídas, banidas ou desativadas não podem concluir a autenticação normal no ClawHub. Se, após a autenticação, você retornar ao estado de sessão encerrada, talvez sua conta não esteja em situação regular. Se sua conta tiver sido banida ou desativada e você acreditar que isso foi um engano, use o [formulário de recurso do ClawHub](https://appeals.openclaw.ai/).

## Login na CLI

O fluxo de login padrão da CLI abre o navegador:

```bash
clawhub login
clawhub whoami
```

O que acontece:

1. A CLI inicia um servidor temporário de callback em `127.0.0.1`.
2. O navegador abre a página de autenticação do ClawHub.
3. Após a autenticação no GitHub, o ClawHub cria um token de API.
4. O navegador redireciona de volta para o callback local.
5. A CLI armazena o token no arquivo de configuração do ClawHub.

Se o navegador não conseguir acessar o callback local devido a regras de firewall, VPN ou proxy, use o fluxo de token sem interface gráfica.

## Login sem interface gráfica

Crie um token na interface Web do ClawHub e forneça-o à CLI:

```bash
clawhub login --token clh_...
```

Use esse fluxo para servidores, trabalhos de CI ou ambientes que usam somente terminal.

Para shells remotos em que seja possível abrir um navegador em outro local, execute:

```bash
clawhub login --device
```

A CLI exibe um código de uso único e aguarda enquanto você concede a autorização em `https://clawhub.ai/cli/device`.

## Armazenamento do token

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

Tokens revogados, inválidos ou ausentes retornam `401 Unauthorized`. Entre novamente com `clawhub login` ou forneça um token novo com `clawhub login --token`.

Contas excluídas, banidas ou desativadas não podem continuar usando tokens de API existentes. Se sua conta tiver sido banida ou desativada e você acreditar que isso foi um engano, use o [formulário de recurso do ClawHub](https://appeals.openclaw.ai/).
