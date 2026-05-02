---
read_when:
    - Você quer exemplos rápidos para instalar, listar, atualizar ou desinstalar Plugins
    - Você quer escolher entre a distribuição de Plugin pelo ClawHub e pelo npm
    - Você está publicando um pacote de Plugin
sidebarTitle: Manage plugins
summary: Exemplos rápidos para instalar, listar, desinstalar, atualizar e publicar Plugins do OpenClaw
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-05-02T20:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

A maioria dos fluxos de trabalho de plugins envolve alguns comandos: pesquisar, instalar, reiniciar o Gateway,
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

`plugins list` é uma verificação fria de inventário. Ele mostra o que o OpenClaw consegue descobrir
a partir da configuração, dos manifestos e do registro de plugins; ele não prova que um
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
openclaw plugins install npm:@openclaw/codex@beta

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

Use `inspect --runtime` quando precisar de prova de que o plugin registrou superfícies
de runtime, como ferramentas, hooks, serviços, métodos do Gateway ou comandos de CLI
pertencentes ao plugin.

## Atualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Se um plugin foi instalado a partir de uma dist-tag npm como `@beta`, chamadas
posteriores de `update <plugin-id>` reutilizam essa tag registrada. Passar uma spec npm
explícita muda a instalação rastreada para essa spec em atualizações futuras.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um plugin de volta para a linha de lançamento padrão do registro
quando ele estava previamente fixado em uma versão exata ou tag.

Quando `openclaw update` é executado no canal beta, registros de plugins npm e ClawHub
da linha padrão tentam primeiro a versão `@beta` correspondente do plugin. Se essa versão beta
não existir, o OpenClaw volta para a spec padrão/mais recente registrada.
Versões exatas e tags explícitas como `@rc` ou `@beta` são preservadas.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

A desinstalação remove a entrada de configuração do plugin, o registro de índice do plugin, entradas de
lista de permissão/negação e caminhos de carregamento vinculados quando aplicável. Diretórios de instalação gerenciados são
removidos, a menos que você passe `--keep-files`.

## Publicar plugins

Você pode publicar plugins externos no [ClawHub](https://clawhub.ai), em npmjs.com ou
em ambos.

### Publicar no ClawHub

O ClawHub é a principal superfície pública de descoberta para plugins do OpenClaw. Ele oferece aos
usuários metadados pesquisáveis, histórico de versões e resultados de varredura do registro antes da
instalação.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Os usuários instalam a partir do ClawHub com:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

A forma simples ainda verifica o ClawHub primeiro.

### Publicar em npmjs.com

Plugins npm nativos devem incluir um manifesto de plugin e metadados de ponto de entrada
do OpenClaw no `package.json`.

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

Os usuários instalam apenas pelo npm com:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Se o mesmo pacote também estiver disponível no ClawHub, `npm:` ignora a busca no ClawHub e
força a resolução pelo npm.

## Escolha da origem

- **ClawHub**: use quando quiser descoberta nativa do OpenClaw, resumos de varredura,
  versões e dicas de instalação.
- **npmjs.com**: use quando você já distribui pacotes JavaScript ou precisa de fluxos de trabalho de
  dist-tags/registro privado do npm.
- **Git**: use quando quiser instalar diretamente de uma branch, tag ou commit.
- **Caminho local**: use quando você estiver desenvolvendo ou testando um plugin na mesma
  máquina.

## Relacionado

- [Plugins](/pt-BR/tools/plugin) - visão geral e solução de problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [ClawHub](/pt-BR/tools/clawhub) - operações de publicação e registro
- [Criar plugins](/pt-BR/plugins/building-plugins) - crie um pacote de plugin
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
