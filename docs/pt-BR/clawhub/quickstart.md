---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando uma habilidade ou Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-05-12T00:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro para Skills e plugins do OpenClaw.

Use OpenClaw quando estiver instalando coisas no OpenClaw. Use a CLI `clawhub`
quando estiver fazendo login, publicando, gerenciando suas próprias listagens ou usando
fluxos de trabalho específicos do registro.

## Encontrar e instalar uma skill

Pesquise pelo OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale uma skill:

```bash
openclaw skills install <skill-slug>
```

Atualize as skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a skill veio para que atualizações posteriores possam continuar
a ser resolvidas pelo ClawHub.

## Encontrar e instalar um plugin

Pesquise pelo OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale um plugin hospedado no ClawHub com uma origem ClawHub explícita:

```bash
openclaw plugins install clawhub:<package>
```

Atualize os plugins instalados:

```bash
openclaw plugins update --all
```

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote pelo
ClawHub em vez de npm ou outra origem.

## Fazer login para publicar

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

Ambientes sem interface podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar uma skill

Uma skill é uma pasta com um arquivo obrigatório `SKILL.md` e arquivos de suporte
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as variáveis de
ambiente, ferramentas e permissões exigidas para que os usuários possam entender o que a
skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

## Publicar um plugin

Publique um plugin a partir de uma pasta local, um repositório do GitHub, uma ref do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para visualizar os metadados resolvidos do pacote, campos de compatibilidade,
atribuição de origem e plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizar skills que você mantém

`sync` verifica pastas de skills e publica skills novas ou alteradas que ainda não estão
sincronizadas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando você está conectado, `sync` também pode enviar um snapshot mínimo de instalação para
contagens agregadas de instalação. Consulte [Telemetria](/pt-BR/clawhub/telemetry) para saber o que é relatado
e como desativar.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de varredura:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listagens públicas mostram o estado da varredura mais recente. Releases retidas ou bloqueadas por
moderação podem ficar ocultas das superfícies de busca e instalação até serem resolvidas.
