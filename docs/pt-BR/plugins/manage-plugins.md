---
doc-schema-version: 1
read_when:
    - Você quer exemplos rápidos de listagem, instalação, atualização, inspeção ou desinstalação de plugins
    - Você quer escolher uma fonte de instalação de Plugin
    - Você quer a referência certa para publicar pacotes de Plugin
sidebarTitle: Manage plugins
summary: Exemplos rápidos para listar, instalar, atualizar, inspecionar e desinstalar plugins do OpenClaw
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-06-27T17:48:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Use esta página para comandos comuns de gerenciamento de plugins. Para o contrato de comandos
exaustivo, flags, regras de seleção de origem e casos extremos, consulte
[`openclaw plugins`](/pt-BR/cli/plugins).

A maioria dos fluxos de instalação é:

1. encontrar um pacote
2. instalá-lo a partir do ClawHub, npm, git ou um caminho local
3. permitir que o Gateway gerenciado reinicie automaticamente, ou reiniciá-lo manualmente quando não gerenciado
4. verificar os registros de runtime do plugin

## Listar e pesquisar plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Use `--json` para scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` é uma verificação fria de inventário. Ela mostra o que o OpenClaw consegue descobrir
a partir da configuração, dos manifestos e do registro de plugins; ela não prova que um
Gateway já em execução importou o runtime do plugin. A saída JSON inclui
diagnósticos do registro e o `dependencyStatus` estático de cada plugin quando o
pacote do plugin declara `dependencies` ou `optionalDependencies`.

`plugins search` consulta o ClawHub por pacotes de plugins instaláveis e imprime
dicas de instalação, como `openclaw plugins install clawhub:<package>`.

## Instalar plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Especificações de pacote sem prefixo instalam a partir do npm durante a transição de lançamento. Use `clawhub:`,
`npm:`, `git:` ou `npm-pack:` quando precisar de seleção de origem determinística.
Se o nome sem prefixo corresponder a um id oficial de plugin, o OpenClaw poderá instalar a
entrada do catálogo diretamente.

Use `--force` somente quando quiser sobrescrever intencionalmente um destino de instalação
existente. Para upgrades de rotina de instalações rastreadas do npm, ClawHub ou hook-pack, use
`openclaw plugins update`.

## Reiniciar e inspecionar

Depois de instalar, atualizar ou desinstalar código de plugin, um Gateway gerenciado em execução
com recarregamento de configuração habilitado reinicia automaticamente. Se o Gateway não for
gerenciado ou o recarregamento estiver desabilitado, reinicie-o você mesmo antes de verificar
superfícies de runtime ativas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Use `inspect --runtime` quando precisar de prova de que o plugin registrou superfícies de runtime,
como ferramentas, hooks, serviços, métodos do Gateway, rotas HTTP ou comandos de CLI
pertencentes ao plugin. `inspect` e `list` simples são verificações frias de manifesto,
configuração e registro.

## Atualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação rastreada. Dist-tags
armazenadas, como `@beta`, e versões exatas fixadas continuam sendo usadas em
execuções posteriores de `update <plugin-id>`.

`openclaw plugins update --all` é o caminho de manutenção em massa. Ele ainda respeita
especificações de instalação rastreadas comuns, mas registros confiáveis de plugins oficiais do OpenClaw podem
sincronizar com o destino atual do catálogo oficial em vez de permanecer em um pacote oficial exato
obsoleto. Se `update.channel` estiver definido como `beta`, essa sincronização oficial em massa
usa o contexto do canal beta. Use um `update <plugin-id>` direcionado quando
quiser manter intencionalmente uma especificação oficial exata ou marcada intocada.

Para instalações npm, você pode passar uma especificação de pacote explícita para trocar o registro
rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um plugin de volta para a linha de lançamento padrão do registro
quando ele estava previamente fixado em uma versão exata ou tag.

Quando `openclaw update` é executado no canal beta, os registros de plugin podem preferir
lançamentos `@beta` correspondentes. Para as regras exatas de fallback e fixação, consulte
[`openclaw plugins`](/pt-BR/cli/plugins#update).

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

A desinstalação remove a entrada de configuração do plugin, o registro persistido do índice de plugins,
entradas de lista de permissão/bloqueio e caminhos de carregamento vinculados quando aplicável. Diretórios de instalação
gerenciados são removidos, a menos que você passe `--keep-files`. Um Gateway gerenciado em execução
reinicia automaticamente quando a desinstalação altera a origem do plugin.

No modo Nix (`OPENCLAW_NIX_MODE=1`), comandos de instalar, atualizar, desinstalar, habilitar
e desabilitar plugins ficam desabilitados. Gerencie essas escolhas na origem Nix da
instalação.

## Escolher uma origem

| Origem      | Use quando                                                                    | Exemplo                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, resumos de varredura, versões e dicas     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Você já distribui pacotes JavaScript ou precisa de dist-tags/registro privado do npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Você quer uma branch, tag ou commit de um repositório                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local  | Você está desenvolvendo ou testando um plugin na mesma máquina                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Você está comprovando um artefato de pacote local por meio da semântica de instalação do npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Você está instalando um plugin de marketplace compatível com Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Instalações gerenciadas de caminho local devem ser diretórios ou arquivos compactados de plugin. Coloque
arquivos de plugin avulsos em `plugins.load.paths` em vez de instalá-los com
`plugins install`.

## Publicar plugins

O ClawHub é a principal superfície pública de descoberta para plugins do OpenClaw. Publique
lá quando quiser que usuários encontrem metadados do plugin, histórico de versões, resultados de varredura
do registro e dicas de instalação antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugins npm nativos devem incluir um manifesto de plugin e metadados de pacote antes
da publicação:

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
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Use estas páginas para o contrato completo de publicação em vez de tratar esta página
como a referência de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) explica proprietários, escopos, lançamentos,
  revisão, validação de pacote e transferência de pacote.
- [Criação de plugins](/pt-BR/plugins/building-plugins) mostra o formato do pacote de plugin
  e o primeiro fluxo de publicação.
- [Manifesto de plugin](/pt-BR/plugins/manifest) define os campos do manifesto de plugin nativo.

Se o mesmo pacote estiver disponível tanto no ClawHub quanto no npm, use o prefixo explícito
`clawhub:` ou `npm:` quando precisar forçar uma origem.

## Relacionados

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta pública e publicação no ClawHub
- [ClawHub](/pt-BR/clawhub/cli) - operações da CLI do registro
- [Criação de plugins](/pt-BR/plugins/building-plugins) - criar um pacote de plugin
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados de pacote
