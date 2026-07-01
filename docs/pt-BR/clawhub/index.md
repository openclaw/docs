---
read_when:
    - Explicando o que é o ClawHub
    - Pesquisar, instalar ou atualizar Skills ou plugins
    - Publicar Skills ou plugins no registro
    - Escolhendo entre os fluxos de CLI do openclaw e do clawhub
sidebarTitle: ClawHub
summary: Visão geral pública do ClawHub para descoberta, instalação, publicação, segurança e a CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T15:21:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub é o registro público para Skills e plugins do OpenClaw.

- Use comandos nativos `openclaw` para pesquisar, instalar e atualizar Skills e para instalar plugins do ClawHub.
- Use a CLI `clawhub` separada para autenticação no registro, publicação e fluxos de trabalho de exclusão/restauração.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

Pesquise e instale Skills com o OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Pesquise e instale plugins com o OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instale a CLI do ClawHub quando quiser fluxos de trabalho autenticados no registro, como
publicação ou exclusão/restauração:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## O que o ClawHub hospeda

| Superfície      | O que armazena                                              | Comando típico                               |
| --------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Skills          | Pacotes de texto versionados com `SKILL.md` e arquivos de apoio | `openclaw skills install @openclaw/demo`     |
| Plugins de código | Pacotes de plugins do OpenClaw com metadados de compatibilidade | `openclaw plugins install clawhub:<package>` |
| Plugins de pacote | Pacotes de plugins empacotados para distribuição do OpenClaw | `clawhub package publish <source>`           |

O ClawHub rastreia versões semver, tags como `latest`, changelogs, arquivos,
downloads, estrelas e resumos de verificação de segurança. Páginas públicas mostram o estado atual do registro
para que os usuários possam inspecionar uma Skill ou plugin antes de instalá-lo.

## Fluxos nativos do OpenClaw

Comandos nativos do OpenClaw instalam no workspace ativo do OpenClaw e persistem
metadados de origem para que comandos de atualização posteriores possam permanecer no ClawHub.

Use `clawhub:<package>` quando a instalação de um plugin deve ser resolvida pelo ClawHub.
Especificações de plugin simples e seguras para npm podem ser resolvidas pelo npm durante transições de lançamento, e
`npm:<package>` permanece somente npm quando uma origem precisa ser explícita.

Instalações de plugins validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes da instalação do arquivo. Quando uma versão de pacote publica um artefato
ClawPack, o OpenClaw prefere o `.tgz` exato do npm-pack enviado, verifica
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
```

A CLI também tem comandos de instalação/atualização de Skills para fluxos de trabalho diretos com o registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Esses comandos instalam Skills em `./skills` sob o diretório de trabalho atual
e registram as versões instaladas em `.clawhub/lock.json`.

## Publicação

Publique Skills de uma pasta local que contenha `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opções comuns de publicação:

- `--slug <slug>`: nome de URL da Skill publicada.
- `--name <name>`: nome de exibição.
- `--version <version>`: versão semver.
- `--changelog <text>`: texto do changelog.
- `--tags <tags>`: tags separadas por vírgula, com padrão `latest`.

Publique plugins de uma pasta local, `owner/repo`, `owner/repo@ref` ou uma URL do GitHub:

```bash
clawhub package publish <source>
```

Use `--dry-run` para criar o plano de publicação exato sem enviar, e `--json`
para saída adequada para CI.

Plugins de código devem incluir os metadados obrigatórios de compatibilidade com o OpenClaw em
`package.json`, incluindo `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consulte [CLI](/pt-BR/clawhub/cli) para a referência completa de comandos
e [Formato de Skill](/clawhub/skill-format) para metadados de Skills.

## Segurança e moderação

O ClawHub é aberto por padrão: qualquer pessoa pode enviar, mas a publicação exige uma conta do GitHub
antiga o suficiente para passar pelo controle de envio. Páginas públicas de detalhes resumem o
estado da verificação mais recente antes da instalação ou download.

O ClawHub executa verificações automatizadas em Skills publicadas e releases de plugins. Releases retidas por verificação
ou bloqueadas podem desaparecer do catálogo público e das superfícies de instalação enquanto
permanecem visíveis para seu proprietário em `/dashboard`.

Usuários conectados podem denunciar Skills e pacotes. Moderadores podem revisar denúncias,
ocultar ou restaurar conteúdo e banir contas abusivas. Consulte
[Segurança](/pt-BR/clawhub/security),
[Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/clawhub/moderation) e
[Uso aceitável](/pt-BR/clawhub/acceptable-usage) para detalhes de política e aplicação.

## Telemetria e ambiente

Quando você executa `clawhub install` enquanto está conectado, a CLI pode enviar um evento de instalação
em melhor esforço para que o ClawHub possa calcular contagens agregadas de instalações. Desative isso com:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substituições de ambiente úteis:

| Variável                      | Efeito                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Substitui a URL do site usada para login no navegador. |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.               |
| `CLAWHUB_CONFIG_PATH`         | Substitui onde a CLI armazena o estado de token/configuração. |
| `CLAWHUB_WORKDIR`             | Substitui o diretório de trabalho padrão.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria de instalação.              |

Consulte [Telemetria](/clawhub/telemetry), [API HTTP](/clawhub/http-api) e
[Solução de problemas](/pt-BR/clawhub/troubleshooting) para material de referência mais aprofundado.
