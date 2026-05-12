---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando uma habilidade ou um Plugin do registro
    - Publicando no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-05-12T23:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

O ClawHub é um registro para Skills e plugins do OpenClaw.

Use o OpenClaw quando estiver instalando coisas no OpenClaw. Use a CLI `clawhub`
quando estiver fazendo login, publicando, gerenciando suas próprias listagens ou usando
fluxos de trabalho específicos do registro.

## Encontrar e instalar uma Skill

Pesquise pelo OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale uma Skill:

```bash
openclaw skills install <skill-slug>
```

Atualize as Skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde veio a Skill para que atualizações posteriores possam continuar a
resolver pelo ClawHub.

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

Ambientes headless podem usar um token de API da interface web do ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar uma Skill

Uma Skill é uma pasta com um arquivo `SKILL.md` obrigatório e arquivos de suporte
opcionais.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Antes de publicar, verifique os metadados em `SKILL.md`. Declare as variáveis de
ambiente, ferramentas e permissões obrigatórias para que os usuários possam entender do que a
Skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

## Publicar um plugin

Publique um plugin de uma pasta local, um repositório do GitHub, uma ref do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para pré-visualizar os metadados resolvidos do pacote, campos de compatibilidade,
atribuição de origem e plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com o OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizar Skills que você mantém

`sync` verifica pastas de Skills e publica Skills novas ou alteradas que ainda não estão
sincronizadas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando você está logado, `sync` também pode enviar um snapshot mínimo de instalação para
contagens agregadas de instalações. Consulte [Telemetria](/pt-BR/clawhub/telemetry) para saber o que é relatado
e como desativar.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou os comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de verificação:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listagens públicas mostram o estado de verificação mais recente. Versões retidas ou bloqueadas pela
moderação podem ficar ocultas das superfícies de pesquisa e instalação até serem resolvidas.
