---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando um skill ou Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou Plugins.'
x-i18n:
    generated_at: "2026-07-01T15:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro para Skills e plugins do OpenClaw.

Use o OpenClaw quando estiver instalando itens no OpenClaw. Use a CLI `clawhub`
quando estiver fazendo login, publicando, gerenciando suas próprias listagens ou usando
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

Atualize Skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a Skill veio para que atualizações posteriores possam continuar
a resolver pelo ClawHub.

## Encontre e instale um plugin

Pesquise pelo OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale um plugin hospedado no ClawHub com uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Atualize plugins instalados:

```bash
openclaw plugins update --all
```

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote pelo
ClawHub em vez do npm ou de outra origem.

## Faça login para publicar

Instale a CLI do ClawHub:

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Faça login com o GitHub:

```bash
clawhub login
clawhub whoami
```

Ambientes sem interface podem usar um token de API da UI web do ClawHub:

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

O comando ignora conteúdo inalterado. Novas Skills começam em `1.0.0`; alterações posteriores
publicam automaticamente a próxima versão de patch. Use `--dry-run` para pré-visualizar ou
`--version` para escolher uma versão explícita.

Antes de publicar, verifique os metadados em `SKILL.md`. Declare variáveis de
ambiente, ferramentas e permissões obrigatórias para que os usuários possam entender do que a
Skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

Para repositórios que contêm várias Skills, o fluxo de trabalho reutilizável do GitHub chama
`skill publish` para cada pasta de Skill imediata em `skills/`:

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

Use `--dry-run` primeiro para pré-visualizar os metadados resolvidos do pacote, campos de
compatibilidade, atribuição de origem e plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Inspecione antes de instalar

Antes de instalar, use a página web do ClawHub ou comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de verificação:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Listagens públicas mostram o estado de verificação mais recente. Lançamentos retidos ou bloqueados por
moderação podem ficar ocultos das superfícies de pesquisa e instalação até serem resolvidos.
