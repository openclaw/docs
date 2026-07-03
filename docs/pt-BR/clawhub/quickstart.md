---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando um skill ou plugin a partir do registry
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou Plugins.'
x-i18n:
    generated_at: "2026-07-03T09:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro para Skills e plugins do OpenClaw.

Use OpenClaw quando estiver instalando coisas no OpenClaw. Use a CLI `clawhub`
quando estiver fazendo login, publicando, gerenciando suas próprias listagens ou usando
fluxos de trabalho específicos do registro.

## Encontrar e instalar uma skill

Pesquise a partir do OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale uma skill:

```bash
openclaw skills install @openclaw/demo
```

Atualize as skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a skill veio para que atualizações posteriores possam continuar a
ser resolvidas pelo ClawHub.

## Encontrar e instalar um plugin

Pesquise a partir do OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale um plugin hospedado no ClawHub com uma fonte explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Atualize os plugins instalados:

```bash
openclaw plugins update --all
```

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote pelo
ClawHub em vez do npm ou de outra fonte.

## Fazer login para publicar

Instale a CLI do ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Faça login com GitHub:

```bash
clawhub login
clawhub whoami
```

Ambientes sem interface gráfica podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar uma skill

Uma skill é uma pasta com um arquivo `SKILL.md` obrigatório e arquivos de suporte
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

O comando ignora conteúdo inalterado. Novas skills começam em `1.0.0`; alterações posteriores
publicam automaticamente a próxima versão de patch. Use `--dry-run` para visualizar ou
`--version` para escolher uma versão explícita.

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as
variáveis de ambiente, ferramentas e permissões obrigatórias para que os usuários entendam do que a
skill precisa antes de instalá-la. Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

Para repositórios que contêm várias skills, o fluxo de trabalho reutilizável do GitHub chama
`skill publish` para cada pasta imediata de skill em `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publicar um plugin

Publique um plugin a partir de uma pasta local, um repositório do GitHub, uma ref do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para visualizar os metadados resolvidos do pacote, os campos de compatibilidade,
a atribuição da fonte e o plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de verificação:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Listagens públicas mostram o estado da verificação mais recente. Lançamentos retidos ou bloqueados por
moderação podem ficar ocultos da pesquisa e das superfícies de instalação até serem resolvidos.
