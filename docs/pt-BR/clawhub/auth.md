---
read_when:
    - Entrando no ClawHub
    - Usando a CLI do ClawHub
    - Depuração de erros 401
summary: Login no ClawHub, tokens de API, login na CLI, armazenamento de tokens e revogação.
x-i18n:
    generated_at: "2026-07-03T00:53:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticação

ClawHub usa GitHub para login na web. A CLI usa tokens de API do ClawHub criados
por meio dessa conta conectada.

## Login na web

Use GitHub para entrar em [clawhub.ai](https://clawhub.ai).

Contas excluídas, banidas ou desativadas não conseguem concluir o login normal no ClawHub.
Se o login retornar você para um estado desconectado, sua conta pode não estar em boas
condições. Se sua conta foi banida ou desativada, use o
[formulário de apelação do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso é um
erro.

## Login pela CLI

O fluxo padrão de login pela CLI abre seu navegador:

```bash
clawhub login
clawhub whoami
```

O que acontece:

1. A CLI inicia um servidor temporário de callback em `127.0.0.1`.
2. Seu navegador abre a página de login do ClawHub.
3. Após o login pelo GitHub, ClawHub cria um token de API.
4. O navegador redireciona de volta para o callback local.
5. A CLI armazena o token no seu arquivo de configuração do ClawHub.

Se o seu navegador não conseguir acessar o callback local por causa de regras de firewall, VPN ou
proxy, use o fluxo de token sem interface gráfica.

## Login sem interface gráfica

Crie um token na interface web do ClawHub e depois passe-o para a CLI:

```bash
clawhub login --token clh_...
```

Use este fluxo para servidores, tarefas de CI ou ambientes somente com terminal.

Para shells remotos em que você consegue abrir um navegador em outro lugar, execute:

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

Tokens revogados, inválidos ou ausentes retornam `401 Unauthorized`. Entre novamente
com `clawhub login` ou forneça um token novo com `clawhub login --token`.

Contas excluídas, banidas ou desativadas não conseguem continuar usando tokens de API existentes.
Se sua conta foi banida ou desativada, use o
[formulário de apelação do ClawHub](https://appeals.openclaw.ai/) se você acredita que isso é um
erro.
