---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando uma skill ou um Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-05-12T04:09:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro para skills e plugins do OpenClaw.

Use OpenClaw quando estiver instalando coisas no OpenClaw. Use a CLI `clawhub`
quando estiver fazendo login, publicando, gerenciando suas próprias listagens ou usando
fluxos de trabalho específicos do registro.

## Encontre e instale uma skill

Pesquise pelo OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale uma skill:

```bash
openclaw skills install <skill-slug>
```

Atualize skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a skill veio para que atualizações posteriores possam continuar
sendo resolvidas por meio do ClawHub.

## Encontre e instale um plugin

Pesquise pelo OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale um plugin hospedado no ClawHub com uma fonte ClawHub explícita:

```bash
openclaw plugins install clawhub:<package>
```

Atualize plugins instalados:

```bash
openclaw plugins update --all
```

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote por meio do
ClawHub em vez de npm ou outra fonte.

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

Ambientes sem interface gráfica podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publique uma skill

Uma skill é uma pasta com um arquivo obrigatório `SKILL.md` e arquivos de suporte
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Antes de publicar, verifique os metadados em `SKILL.md`. Declare variáveis de
ambiente, ferramentas e permissões obrigatórias para que os usuários possam entender do que a
skill precisa antes de instalá-la. Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Publique um plugin

Publique um plugin de uma pasta local, um repositório do GitHub, uma referência do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para visualizar os metadados resolvidos do pacote, os campos de compatibilidade,
a atribuição de origem e o plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronize skills que você mantém

`sync` verifica pastas de skills e publica skills novas ou alteradas que ainda não estão
sincronizadas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando você está conectado, `sync` também pode enviar uma captura mínima de instalação para
contagens agregadas de instalações. Consulte [Telemetria](/pt-BR/clawhub/telemetry) para ver o que é relatado
e como optar por não participar.

## Inspecione antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de verificação:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listagens públicas mostram o estado mais recente da verificação. Lançamentos retidos ou bloqueados por
moderação podem ficar ocultos das superfícies de pesquisa e instalação até serem resolvidos.
