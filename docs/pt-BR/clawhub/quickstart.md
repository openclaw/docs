---
read_when:
    - Primeira vez usando o ClawHub
    - Instalação de uma skill ou Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-07-16T12:16:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro de Skills e plugins do OpenClaw.

Use o OpenClaw ao instalar itens no OpenClaw. Use a CLI `clawhub`
ao entrar, publicar, gerenciar suas próprias listagens ou usar
fluxos de trabalho específicos do registro.

## Encontrar e instalar uma skill

Pesquise pelo OpenClaw:

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

O OpenClaw registra a origem da skill para que atualizações posteriores possam continuar
sendo obtidas pelo ClawHub.

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

Use o prefixo `clawhub:` quando quiser que o OpenClaw obtenha o pacote pelo
ClawHub em vez do npm ou de outra origem.

## Entrar para publicar

Instale a CLI do ClawHub:

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Entre com o GitHub:

```bash
clawhub login
clawhub whoami
```

Ambientes sem interface gráfica podem usar um token de API obtido na interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar uma skill

Uma skill é uma pasta com um arquivo obrigatório `SKILL.md` e arquivos auxiliares
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

O comando ignora conteúdo inalterado. Novas skills começam na versão `1.0.0`; alterações posteriores
publicam automaticamente a próxima versão de correção. Use `--dry-run` para visualizar ou
`--version` para escolher uma versão explícita.

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as
variáveis de ambiente, ferramentas e permissões necessárias para que os usuários possam entender do que a
skill precisa antes de instalá-la. Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

Para repositórios que contêm várias skills, o fluxo de trabalho reutilizável do GitHub chama
`skill publish` para cada pasta de skill diretamente em `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publicar um plugin

Publique um plugin de uma pasta local, um repositório do GitHub, uma referência do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para visualizar os metadados resolvidos do pacote, os campos de
compatibilidade, a atribuição da origem e o plano de envio sem publicar.

Os plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, registros de alterações e status da verificação:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

As listagens públicas mostram o estado da verificação mais recente. Versões retidas ou bloqueadas pela
moderação podem ficar ocultas nas interfaces de pesquisa e instalação até que a situação seja resolvida.
