---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando uma skill ou plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-07-04T20:28:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro para Skills e plugins do OpenClaw.

Use o OpenClaw ao instalar itens no OpenClaw. Use a CLI `clawhub`
ao fazer login, publicar, gerenciar suas próprias listagens ou usar
fluxos de trabalho específicos do registro.

## Encontre e instale uma Skill

Pesquise pelo OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale uma Skill:

```bash
openclaw skills install @openclaw/demo
```

Atualize as Skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a Skill veio para que atualizações posteriores possam continuar
a ser resolvidas pelo ClawHub.

## Encontre e instale um plugin

Pesquise pelo OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale um plugin hospedado no ClawHub com uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Atualize os plugins instalados:

```bash
openclaw plugins update --all
```

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote pelo
ClawHub em vez de npm ou outra origem.

## Faça login para publicar

Instale a CLI do ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Faça login com o GitHub:

```bash
clawhub login
clawhub whoami
```

Ambientes headless podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publique uma Skill

Uma Skill é uma pasta com um arquivo obrigatório `SKILL.md` e arquivos de suporte
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

O comando ignora conteúdo inalterado. Novas Skills começam em `1.0.0`; alterações
posteriores publicam automaticamente a próxima versão de patch. Use `--dry-run` para pré-visualizar ou
`--version` para escolher uma versão explícita.

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as variáveis de
ambiente, ferramentas e permissões necessárias para que os usuários possam entender do que a
Skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

Para repositórios que contêm várias Skills, o fluxo de trabalho reutilizável do GitHub chama
`skill publish` para cada pasta imediata de Skill em `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publique um plugin

Publique um plugin de uma pasta local, um repositório do GitHub, uma ref do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para pré-visualizar os metadados resolvidos do pacote, os campos de
compatibilidade, a atribuição de origem e o plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Inspecione antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de verificação:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Listagens públicas mostram o estado da verificação mais recente. Versões retidas ou bloqueadas por
moderação podem ficar ocultas das superfícies de pesquisa e instalação até serem resolvidas.
