---
read_when:
    - Você quer exemplos rápidos de instalação, listagem, atualização ou desinstalação de Plugin
    - Você quer escolher entre a distribuição de Plugins pelo ClawHub e pelo npm
    - Você está publicando um pacote de Plugin
sidebarTitle: Manage plugins
summary: Exemplos rápidos para instalar, listar, desinstalar, atualizar e publicar plugins do OpenClaw
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-05-10T19:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

A maioria dos fluxos de trabalho de plugins consiste em poucos comandos: pesquisar, instalar, reiniciar o Gateway,
verificar e desinstalar quando você não precisar mais do plugin.

## Listar plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Use `--json` para scripts. Ele inclui diagnósticos do registro e o
`dependencyStatus` estático de cada plugin quando o pacote do plugin declara
`dependencies` ou `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` é uma verificação de inventário fria. Ela mostra o que o OpenClaw consegue descobrir
a partir da configuração, dos manifestos e do registro de plugins; ela não prova que um
processo do Gateway já em execução importou o runtime do plugin.

## Instalar plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Depois de instalar o código do plugin, reinicie o Gateway que atende seus canais:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Use `inspect --runtime` quando precisar provar que o plugin registrou superfícies de runtime
como ferramentas, hooks, serviços, métodos do Gateway ou comandos de CLI
pertencentes ao plugin.

## Atualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Se um plugin foi instalado a partir de uma dist-tag do npm, como `@beta`, chamadas posteriores de
`update <plugin-id>` reutilizam essa tag registrada. Passar uma especificação npm explícita
altera a instalação rastreada para essa especificação em atualizações futuras.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um plugin de volta para a linha de lançamento padrão do registro
quando ele estava anteriormente fixado em uma versão exata ou tag.

Quando `openclaw update` é executado no canal beta, registros de plugins npm e ClawHub
da linha padrão tentam primeiro o lançamento `@beta` correspondente do plugin. Se esse lançamento
beta não existir, o OpenClaw volta para a especificação padrão/latest registrada.
Para plugins npm, o OpenClaw também volta quando o pacote beta existe, mas falha
na validação de instalação. Versões exatas e tags explícitas, como `@rc` ou `@beta`,
são preservadas.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

A desinstalação remove a entrada de configuração do plugin, o registro de índice do plugin, entradas
de lista de permissão/bloqueio e caminhos de carregamento vinculados quando aplicável. Diretórios de instalação
gerenciados são removidos, a menos que você passe `--keep-files`.

No modo Nix (`OPENCLAW_NIX_MODE=1`), os comandos de instalar, atualizar, desinstalar, habilitar
e desabilitar plugins ficam desabilitados. Gerencie essas escolhas na origem Nix da
instalação; para nix-openclaw, use o
[Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com foco no agente.

## Publicar plugins

Você pode publicar plugins externos no [ClawHub](https://clawhub.ai), em npmjs.com ou em
ambos.

### Publicar no ClawHub

O ClawHub é a principal superfície pública de descoberta para plugins do OpenClaw. Ele oferece
aos usuários metadados pesquisáveis, histórico de versões e resultados de varredura do registro antes da
instalação.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Usuários instalam a partir do ClawHub com:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

A forma sem prefixo ainda verifica o ClawHub primeiro.

### Publicar em npmjs.com

Plugins npm nativos devem incluir um manifesto de plugin e metadados de ponto de entrada
do OpenClaw em `package.json`.

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

Usuários instalam apenas via npm com:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Se o mesmo pacote também estiver disponível no ClawHub, `npm:` ignora a consulta ao ClawHub e
força a resolução via npm.

## Escolha da origem

- **ClawHub**: use quando quiser descoberta nativa do OpenClaw, resumos de varredura,
  versões e dicas de instalação.
- **npmjs.com**: use quando você já distribui pacotes JavaScript ou precisa de fluxos de trabalho de
  dist-tags/registro privado do npm.
- **Git**: use quando quiser instalar diretamente a partir de uma branch, tag ou commit.
- **Caminho local**: use quando estiver desenvolvendo ou testando um plugin na mesma
  máquina.

## Relacionado

- [Plugins](/pt-BR/tools/plugin) - visão geral e solução de problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [ClawHub](/pt-BR/clawhub/cli) - publicação e operações de registro
- [Criação de plugins](/pt-BR/plugins/building-plugins) - crie um pacote de plugin
- [Manifesto do plugin](/pt-BR/plugins/manifest) - metadados de manifesto e pacote
