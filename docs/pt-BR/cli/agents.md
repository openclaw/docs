---
read_when:
    - Você quer vários agentes isolados (workspaces + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agentes
x-i18n:
    generated_at: "2026-04-24T05:44:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

Relacionado:

- Roteamento multiagente: [Roteamento Multiagente](/pt-BR/concepts/multi-agent)
- Workspace do agente: [Workspace do agente](/pt-BR/concepts/agent-workspace)
- Configuração de visibilidade de Skills: [Configuração de Skills](/pt-BR/tools/skills-config)

## Exemplos

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Vínculos de roteamento

Use vínculos de roteamento para fixar o tráfego de entrada do canal em um agente específico.

Se você também quiser diferentes Skills visíveis por agente, configure
`agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte
[Configuração de Skills](/pt-BR/tools/skills-config) e
[Referência de Configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

Liste vínculos:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Adicione vínculos:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o resolve a partir dos padrões do canal e dos hooks de configuração do Plugin, quando disponíveis.

Se você omitir `--agent` em `bind` ou `unbind`, o OpenClaw usa o agente padrão atual como destino.

### Comportamento do escopo do vínculo

- Um vínculo sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback em nível de canal (todas as contas) e é menos específico do que um vínculo de conta explícita.
- Se o mesmo agente já tiver um vínculo de canal correspondente sem `accountId`, e você depois vincular com um `accountId` explícito ou resolvido, o OpenClaw atualiza esse vínculo existente no local em vez de adicionar uma duplicata.

Exemplo:

```bash
# vínculo inicial somente de canal
openclaw agents bind --agent work --bind telegram

# depois atualizar para vínculo com escopo de conta
openclaw agents bind --agent work --bind telegram:ops
```

Após a atualização, o roteamento desse vínculo fica no escopo de `telegram:ops`. Se você também quiser roteamento para a conta padrão, adicione-o explicitamente (por exemplo `--bind telegram:default`).

Remova vínculos:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` aceita `--all` ou um ou mais valores `--bind`, mas não ambos.

## Superfície de comandos

### `agents`

Executar `openclaw agents` sem subcomando é equivalente a `openclaw agents list`.

### `agents list`

Opções:

- `--json`
- `--bindings`: inclui regras completas de roteamento, não apenas contagens/resumos por agente

### `agents add [name]`

Opções:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetível)
- `--non-interactive`
- `--json`

Observações:

- Passar qualquer flag explícita de adição faz o comando usar o caminho não interativo.
- O modo não interativo exige tanto um nome de agente quanto `--workspace`.
- `main` é reservado e não pode ser usado como novo ID de agente.

### `agents bindings`

Opções:

- `--agent <id>`
- `--json`

### `agents bind`

Opções:

- `--agent <id>` (usa por padrão o agente padrão atual)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

### `agents unbind`

Opções:

- `--agent <id>` (usa por padrão o agente padrão atual)
- `--bind <channel[:accountId]>` (repetível)
- `--all`
- `--json`

### `agents delete <id>`

Opções:

- `--force`
- `--json`

Observações:

- `main` não pode ser excluído.
- Sem `--force`, é necessária confirmação interativa.
- Os diretórios de workspace, estado do agente e transcrições de sessão são movidos para a Lixeira, não excluídos permanentemente.

## Arquivos de identidade

Cada workspace de agente pode incluir um `IDENTITY.md` na raiz do workspace:

- Caminho de exemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê da raiz do workspace (ou de um `--identity-file` explícito)

Os caminhos de avatar são resolvidos em relação à raiz do workspace.

## Definir identidade

`set-identity` grava campos em `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (caminho relativo ao workspace, URL http(s) ou URI de dados)

Opções:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Observações:

- `--agent` ou `--workspace` podem ser usados para selecionar o agente de destino.
- Se você usar `--workspace` e vários agentes compartilharem esse workspace, o comando falhará e pedirá que você informe `--agent`.
- Quando nenhum campo de identidade explícito é fornecido, o comando lê os dados de identidade de `IDENTITY.md`.

Carregar de `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Substituir campos explicitamente:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Exemplo de configuração:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
