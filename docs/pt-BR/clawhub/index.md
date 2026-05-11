---
read_when:
    - Explicando o que é o ClawHub
    - Busca, instalação ou atualização de Skills ou Plugins
    - Publicando Skills ou Plugins no registro
    - Escolhendo entre os fluxos de CLI do openclaw e do clawhub
sidebarTitle: ClawHub
summary: Visão geral pública do ClawHub para descoberta, instalação, publicação, segurança e a CLI do clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub é o registro público para Skills e plugins do OpenClaw.

- Use comandos nativos do `openclaw` para pesquisar, instalar e atualizar Skills e para instalar plugins do ClawHub.
- Use a CLI `clawhub` separada para fluxos de trabalho de autenticação no registro, publicação, exclusão/restauração e sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

Pesquise e instale Skills com o OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Pesquise e instale plugins com o OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instale a CLI do ClawHub quando quiser fluxos de trabalho autenticados no registro, como
publicar, sincronizar ou excluir/restaurar:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## O que o ClawHub hospeda

| Superfície      | O que armazena                                               | Comando típico                               |
| --------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills          | Pacotes de texto versionados com `SKILL.md` e arquivos de suporte | `openclaw skills install <slug>`             |
| Plugins de código | Pacotes de plugin do OpenClaw com metadados de compatibilidade | `openclaw plugins install clawhub:<package>` |
| Plugins de pacote | Pacotes de plugin empacotados para distribuição do OpenClaw  | `clawhub package publish <source>`           |
| Souls           | Pacotes `SOUL.md` exibidos em onlycrabs.ai                   | Fluxos de publicação pela Web e API          |

O ClawHub rastreia versões semver, tags como `latest`, changelogs, arquivos,
downloads, estrelas e resumos de varreduras de segurança. Páginas públicas mostram o estado atual do registro
para que usuários possam inspecionar uma Skill ou plugin antes de instalá-lo.

## Fluxos nativos do OpenClaw

Comandos nativos do OpenClaw instalam no workspace ativo do OpenClaw e persistem
metadados de origem para que comandos de atualização posteriores possam continuar no ClawHub.

Use `clawhub:<package>` quando a instalação de um plugin deve ser resolvida pelo ClawHub.
Especificações de plugin simples e seguras para npm podem ser resolvidas pelo npm durante transições de lançamento, e
`npm:<package>` permanece exclusivo do npm quando uma origem precisa ser explícita.

Instalações de plugin validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes da instalação do arquivo compactado ser executada. Quando uma versão de pacote publica um
artefato ClawPack, o OpenClaw prefere o `.tgz` exato do npm-pack enviado, verifica
o cabeçalho de resumo do ClawHub e os bytes baixados, e registra metadados do artefato para
atualizações posteriores.

## CLI do ClawHub

A CLI do ClawHub é para trabalho autenticado no registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

A CLI também tem comandos de instalação/atualização de Skills para fluxos de trabalho diretos no registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Esses comandos instalam Skills em `./skills` no diretório de trabalho atual
e registram versões instaladas em `.clawhub/lock.json`.

## Publicação

Publique Skills a partir de uma pasta local contendo `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opções comuns de publicação:

- `--slug <slug>`: slug da Skill.
- `--name <name>`: nome de exibição.
- `--version <version>`: versão semver.
- `--changelog <text>`: texto do changelog.
- `--tags <tags>`: tags separadas por vírgula, com padrão `latest`.

Publique plugins a partir de uma pasta local, `owner/repo`, `owner/repo@ref` ou uma URL do GitHub:

```bash
clawhub package publish <source>
```

Use `--dry-run` para montar o plano de publicação exato sem enviar nada, e `--json`
para saída adequada a CI.

Plugins de código devem incluir os metadados obrigatórios de compatibilidade do OpenClaw em
`package.json`, incluindo `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consulte [CLI](/pt-BR/clawhub/cli) para a referência completa de comandos
e [Formato de Skill](/pt-BR/clawhub/skill-format) para metadados de Skill.

## Segurança e moderação

O ClawHub é aberto por padrão: qualquer pessoa pode enviar conteúdo, mas a publicação exige uma conta do GitHub
com idade suficiente para passar pelo gate de envio. Páginas públicas de detalhes resumem o
estado mais recente da varredura antes da instalação ou do download.

O ClawHub executa verificações automatizadas em Skills publicadas e versões de plugin. Versões retidas por varredura
ou bloqueadas podem desaparecer do catálogo público e das superfícies de instalação enquanto
continuam visíveis para seu proprietário em `/dashboard`.

Usuários autenticados podem denunciar Skills e pacotes. Moderadores podem revisar denúncias,
ocultar ou restaurar conteúdo e banir contas abusivas. Consulte
[Uso aceitável](/pt-BR/clawhub/acceptable-usage) e
[Segurança + moderação](/pt-BR/clawhub/security) para detalhes de política e aplicação.

## Telemetria e ambiente

Quando você executa `clawhub sync` enquanto está autenticado, a CLI envia um snapshot mínimo para que
o ClawHub possa calcular contagens de instalações. Desative isso com:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substituições de ambiente úteis:

| Variável                      | Efeito                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Substitui a URL do site usada para login no navegador. |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.              |
| `CLAWHUB_CONFIG_PATH`         | Substitui onde a CLI armazena o estado de token/configuração. |
| `CLAWHUB_WORKDIR`             | Substitui o diretório de trabalho padrão.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria em `sync`.                 |

Consulte [Telemetria](/pt-BR/clawhub/telemetry), [API HTTP](/pt-BR/clawhub/http-api) e
[Solução de problemas](/pt-BR/clawhub/troubleshooting) para material de referência mais aprofundado.
