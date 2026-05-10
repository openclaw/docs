---
read_when:
    - Você quer ver quais Skills estão disponíveis e prontas para execução
    - Você quer pesquisar, instalar ou atualizar Skills do ClawHub
    - Você quer depurar binários/env/config ausentes para Skills
summary: Referência da CLI para `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecione Skills locais e instale/atualize Skills a partir do ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/pt-BR/tools/skills)
- Configuração de Skills: [Configuração de Skills](/pt-BR/tools/skills-config)
- Instalações do ClawHub: [ClawHub](/pt-BR/clawhub/cli)

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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` usam o ClawHub diretamente e instalam no diretório
`skills/` do workspace ativo. `list`/`info`/`check` ainda inspecionam as
Skills locais visíveis para o workspace e a configuração atuais. Comandos com
base em workspace resolvem o workspace de destino a partir de `--agent <id>`,
depois do diretório de trabalho atual quando ele está dentro de um workspace
de agente configurado e, por fim, do agente padrão.

Este comando `install` da CLI baixa pastas de Skills do ClawHub. Instalações de
dependências de Skills com suporte do Gateway acionadas a partir do onboarding
ou das configurações de Skills usam o caminho de solicitação `skills.install`
separado.

Observações:

- `search [query...]` aceita uma consulta opcional; omita-a para navegar pelo
  feed de busca padrão do ClawHub.
- `search --limit <n>` limita os resultados retornados.
- `install --force` sobrescreve uma pasta de Skills existente no workspace para
  o mesmo slug.
- `--agent <id>` direciona para um workspace de agente configurado e substitui a
  inferência do diretório de trabalho atual.
- `update --all` atualiza somente instalações rastreadas do ClawHub no workspace ativo.
- `check --agent <id>` verifica o workspace do agente selecionado e informa
  quais Skills prontas estão realmente visíveis no prompt ou na superfície de
  comandos desse agente.
- `list` é a ação padrão quando nenhum subcomando é fornecido.
- `list`, `info` e `check` gravam sua saída renderizada em stdout. Com
  `--json`, isso significa que a carga útil legível por máquina permanece em
  stdout para pipes e scripts.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Skills](/pt-BR/tools/skills)
