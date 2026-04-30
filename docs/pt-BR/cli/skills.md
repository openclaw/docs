---
read_when:
    - Você quer ver quais Skills estão disponíveis e prontas para execução
    - Você quer buscar, instalar ou atualizar Skills do ClawHub
    - Você quer depurar binários/ambiente/configuração ausentes para Skills
summary: Referência da CLI para `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecione Skills locais e instale/atualize Skills do ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/pt-BR/tools/skills)
- Configuração de Skills: [Configuração de Skills](/pt-BR/tools/skills-config)
- Instalações do ClawHub: [ClawHub](/pt-BR/tools/clawhub)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` usam o ClawHub diretamente e instalam no diretório
`skills/` do workspace ativo. `list`/`info`/`check` ainda inspecionam as Skills
locais visíveis para o workspace e a configuração atuais. Comandos apoiados por
workspace resolvem o workspace de destino a partir de `--agent <id>`, depois o
diretório de trabalho atual quando ele está dentro de um workspace de agente
configurado, e então o agente padrão.

Este comando `install` da CLI baixa pastas de Skills do ClawHub. Instalações de
dependências de Skills apoiadas pelo Gateway, acionadas pelo onboarding ou pelas
configurações de Skills, usam o caminho de solicitação `skills.install`
separado.

Observações:

- `search [query...]` aceita uma consulta opcional; omita-a para navegar pelo
  feed de busca padrão do ClawHub.
- `search --limit <n>` limita os resultados retornados.
- `install --force` sobrescreve uma pasta de Skill existente no workspace para o
  mesmo slug.
- `--agent <id>` direciona para um workspace de agente configurado e substitui a
  inferência pelo diretório de trabalho atual.
- `update --all` atualiza apenas instalações rastreadas do ClawHub no workspace ativo.
- `list` é a ação padrão quando nenhum subcomando é fornecido.
- `list`, `info` e `check` gravam a saída renderizada em stdout. Com
  `--json`, isso significa que o payload legível por máquina permanece em stdout
  para pipes e scripts.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Skills](/pt-BR/tools/skills)
