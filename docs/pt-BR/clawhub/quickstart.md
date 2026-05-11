---
read_when:
    - Primeira vez usando o ClawHub
    - Instalando uma habilidade ou Plugin do registro
    - Publicação no ClawHub
summary: 'Comece a usar o ClawHub: encontre, instale, atualize e publique Skills ou plugins.'
x-i18n:
    generated_at: "2026-05-11T20:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Início rápido

ClawHub é um registro de Skills e plugins do OpenClaw.

Use OpenClaw quando estiver instalando coisas no OpenClaw. Use a CLI `clawhub`
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

Atualize Skills instaladas:

```bash
openclaw skills update --all
```

O OpenClaw registra de onde a Skill veio para que atualizações posteriores possam continuar a
resolver pelo ClawHub.

## Encontrar e instalar um plugin

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

Use o prefixo `clawhub:` quando quiser que o OpenClaw resolva o pacote pelo
ClawHub em vez do npm ou de outra fonte.

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

Antes de publicar, verifique os metadados em `SKILL.md`. Declare variáveis de
ambiente, ferramentas e permissões obrigatórias para que os usuários entendam do que a
Skill precisa antes de instalá-la. Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

## Publicar um plugin

Publique um plugin a partir de uma pasta local, um repositório GitHub, uma ref do GitHub ou um
arquivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use `--dry-run` primeiro para pré-visualizar os metadados resolvidos do pacote, campos de compatibilidade, atribuição de origem e plano de upload sem publicar.

Plugins de código devem incluir metadados de compatibilidade com OpenClaw em `package.json`,
incluindo `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizar Skills que você mantém

`sync` verifica pastas de Skills e publica Skills novas ou alteradas que ainda não estão
sincronizadas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando você está logado, `sync` também pode enviar um instantâneo mínimo de instalação para
contagens agregadas de instalações. Consulte [Telemetria](/pt-BR/clawhub/telemetry) para saber o que é relatado
e como desativar.

## Inspecionar antes de instalar

Antes de instalar, use a página web do ClawHub ou comandos de detalhes da CLI para inspecionar
metadados, links de origem, versões, changelogs e status de varredura:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listagens públicas mostram o estado mais recente da varredura. Lançamentos retidos ou bloqueados por
moderação podem ficar ocultos da pesquisa e das superfícies de instalação até serem resolvidos.
