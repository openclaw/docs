---
read_when:
    - Primeira vez usando o ClawHub
    - Instalação de uma skill ou Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-07-12T21:29:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro de Skills e plugins do OpenClaw.

Use o OpenClaw ao instalar itens no OpenClaw. Use a CLI `clawhub`
ao iniciar sessão, publicar, gerenciar suas próprias listagens ou usar
fluxos de trabalho específicos do registro.

## Encontrar e instalar uma Skill

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

O OpenClaw registra a origem da Skill para que atualizações posteriores possam continuar
sendo resolvidas pelo ClawHub.

## Encontrar e instalar um plugin

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
ClawHub, em vez do npm ou de outra origem.

## Iniciar sessão para publicar

Instale a CLI do ClawHub:

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Inicie sessão com o GitHub:

```bash
clawhub login
clawhub whoami
```

Ambientes sem interface gráfica podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar uma Skill

Uma Skill é uma pasta com um arquivo `SKILL.md` obrigatório e arquivos de apoio
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

O comando ignora conteúdo inalterado. Novas Skills começam na versão `1.0.0`; alterações posteriores
publicam automaticamente a próxima versão de correção. Use `--dry-run` para visualizar ou
`--version` para escolher uma versão explícita.

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as variáveis de
ambiente, ferramentas e permissões necessárias para que os usuários entendam do que a
Skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

Para repositórios que contêm várias Skills, o fluxo de trabalho reutilizável do GitHub chama
`skill publish` para cada pasta de Skill diretamente dentro de `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publicar um plugin

Publique um plugin a partir de uma pasta local, um repositório do GitHub, uma referência do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para visualizar os metadados resolvidos do pacote, os campos de
compatibilidade, a atribuição da origem e o plano de envio sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links da origem, versões, históricos de alterações e status da verificação:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

As listagens públicas mostram o estado mais recente da verificação. Versões retidas ou bloqueadas pela
moderação podem ficar ocultas nas interfaces de pesquisa e instalação até que a situação seja resolvida.
