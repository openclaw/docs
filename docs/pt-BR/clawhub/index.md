---
read_when:
    - Explicando o que é o ClawHub
    - Pesquisar, instalar ou atualizar Skills ou plugins
    - Publicação de Skills ou plugins no registro
    - Escolhendo entre os fluxos de CLI do openclaw e do clawhub
sidebarTitle: ClawHub
summary: Visão geral pública do ClawHub para descoberta, instalação, publicação, segurança e a CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub é o registro público para Skills e plugins do OpenClaw.

- Use comandos nativos `openclaw` para pesquisar, instalar e atualizar Skills e instalar plugins a partir do ClawHub.
- Use a CLI `clawhub` separada para workflows de autenticação no registro, publicação, exclusão/restauração e sincronização.

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

Instale a CLI do ClawHub quando quiser workflows autenticados no registro, como
publicação, sincronização ou exclusão/restauração:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## O que o ClawHub hospeda

| Superfície      | O que armazena                                                  | Comando típico                               |
| --------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Skills          | Pacotes de texto versionados com `SKILL.md` e arquivos de apoio | `openclaw skills install <slug>`             |
| Plugins de código | Pacotes de plugin do OpenClaw com metadados de compatibilidade  | `openclaw plugins install clawhub:<package>` |
| Plugins de bundle | Bundles de plugin empacotados para distribuição do OpenClaw     | `clawhub package publish <source>`           |
| Souls           | Bundles `SOUL.md` exibidos em onlycrabs.ai                      | Fluxos de publicação pela Web e API          |

O ClawHub rastreia versões semver, tags como `latest`, changelogs, arquivos,
downloads, estrelas e resumos de varreduras de segurança. Páginas públicas mostram o estado atual do registro
para que os usuários possam inspecionar uma Skill ou um plugin antes de instalá-lo.

## Fluxos nativos do OpenClaw

Comandos nativos do OpenClaw instalam no workspace ativo do OpenClaw e persistem
metadados de origem para que comandos de atualização posteriores possam permanecer no ClawHub.

Use `clawhub:<package>` quando uma instalação de plugin deve ser resolvida pelo ClawHub.
Especificações de plugin sem prefixo e seguras para npm podem ser resolvidas pelo npm durante transições de lançamento, e
`npm:<package>` permanece somente npm quando uma origem precisa ser explícita.

Instalações de plugin validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes que a instalação do arquivo compactado seja executada. Quando uma versão de pacote publica um
artefato ClawPack, o OpenClaw prefere o `.tgz` exato do npm-pack enviado, verifica
o cabeçalho de digest do ClawHub e os bytes baixados, e registra metadados do artefato para
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

A CLI também tem comandos de instalação/atualização de Skills para workflows diretos do registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Esses comandos instalam Skills em `./skills` no diretório de trabalho atual
e registram as versões instaladas em `.clawhub/lock.json`.

## Publicação

Publique Skills a partir de uma pasta local que contenha `SKILL.md`:

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

Use `--dry-run` para gerar o plano de publicação exato sem enviar, e `--json`
para saída adequada a CI.

Plugins de código devem incluir os metadados de compatibilidade obrigatórios do OpenClaw em
`package.json`, incluindo `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consulte [CLI](/pt-BR/clawhub/cli) para a referência completa de comandos
e [Formato de Skill](/pt-BR/clawhub/skill-format) para metadados de Skill.

## Segurança e moderação

O ClawHub é aberto por padrão: qualquer pessoa pode enviar, mas publicar exige uma conta do GitHub
antiga o suficiente para passar pelo bloqueio de envio. Páginas públicas de detalhes resumem o
estado da varredura mais recente antes da instalação ou download.

O ClawHub executa verificações automatizadas em Skills publicadas e versões de plugin. Versões retidas por varredura
ou bloqueadas podem desaparecer do catálogo público e das superfícies de instalação, enquanto
permanecem visíveis para seus proprietários em `/dashboard`.

Usuários conectados podem denunciar Skills e pacotes. Moderadores podem revisar denúncias,
ocultar ou restaurar conteúdo e banir contas abusivas. Consulte
[Uso aceitável](/pt-BR/clawhub/acceptable-usage) e
[Segurança + moderação](/pt-BR/clawhub/security) para detalhes de política e aplicação.

## Telemetria e ambiente

Quando você executa `clawhub sync` estando conectado, a CLI envia um snapshot mínimo para que
o ClawHub possa calcular contagens de instalações. Desative isso com:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substituições úteis de ambiente:

| Variável                      | Efeito                                                |
| ----------------------------- | ----------------------------------------------------- |
| `CLAWHUB_SITE`                | Substitui a URL do site usada para login no navegador. |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.                   |
| `CLAWHUB_CONFIG_PATH`         | Substitui onde a CLI armazena o estado de token/configuração. |
| `CLAWHUB_WORKDIR`             | Substitui o diretório de trabalho padrão.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria em `sync`.                      |

Consulte [Telemetria](/pt-BR/clawhub/telemetry), [API HTTP](/pt-BR/clawhub/http-api) e
[Solução de problemas](/pt-BR/clawhub/troubleshooting) para material de referência mais aprofundado.
