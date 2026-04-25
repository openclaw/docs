---
read_when:
    - Você quer vários agentes isolados (workspaces + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agentes
x-i18n:
    generated_at: "2026-04-25T13:42:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

Relacionado:

- Roteamento com múltiplos agentes: [Roteamento com múltiplos agentes](/pt-BR/concepts/multi-agent)
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

## Vinculações de roteamento

Use vinculações de roteamento para fixar o tráfego de entrada do canal em um agente específico.

Se você também quiser Skills visíveis diferentes por agente, configure
`agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte
[Configuração de Skills](/pt-BR/tools/skills-config) e
[Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

Listar vinculações:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Adicionar vinculações:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o resolve a partir dos padrões do canal e dos hooks de configuração do plugin, quando disponíveis.

Se você omitir `--agent` em `bind` ou `unbind`, o OpenClaw usa o agente padrão atual como destino.

### Comportamento do escopo da vinculação

- Uma vinculação sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback para todo o canal (todas as contas) e é menos específico do que uma vinculação explícita de conta.
- Se o mesmo agente já tiver uma vinculação de canal correspondente sem `accountId`, e você depois vincular com um `accountId` explícito ou resolvido, o OpenClaw atualiza essa vinculação existente no local, em vez de adicionar uma duplicata.

Exemplo:

```bash
# vinculação inicial apenas do canal
openclaw agents bind --agent work --bind telegram

# depois atualizar para vinculação com escopo de conta
openclaw agents bind --agent work --bind telegram:ops
```

Após a atualização, o roteamento dessa vinculação fica limitado a `telegram:ops`. Se você também quiser roteamento para a conta padrão, adicione-o explicitamente (por exemplo, `--bind telegram:default`).

Remover vinculações:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` aceita `--all` ou um ou mais valores `--bind`, não ambos.

## Superfície de comando

### `agents`

Executar `openclaw agents` sem subcomando equivale a `openclaw agents list`.

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

- Passar qualquer flag explícita de adição alterna o comando para o modo não interativo.
- O modo não interativo exige um nome de agente e `--workspace`.
- `main` é reservado e não pode ser usado como novo id do agente.

### `agents bindings`

Opções:

- `--agent <id>`
- `--json`

### `agents bind`

Opções:

- `--agent <id>` (o padrão é o agente padrão atual)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

### `agents unbind`

Opções:

- `--agent <id>` (o padrão é o agente padrão atual)
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
- Workspace, estado do agente e diretórios de transcrição da sessão são movidos para a Lixeira, não excluídos permanentemente.
- Se o workspace de outro agente for o mesmo caminho, estiver dentro deste workspace ou contiver este workspace,
  o workspace será mantido e `--json` reportará `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## Arquivos de identidade

Cada workspace de agente pode incluir um `IDENTITY.md` na raiz do workspace:

- Caminho de exemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê da raiz do workspace (ou de um `--identity-file` explícito)

Os caminhos do avatar são resolvidos em relação à raiz do workspace.

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
- Se você depender de `--workspace` e vários agentes compartilharem esse workspace, o comando falhará e pedirá que você forneça `--agent`.
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
- [Roteamento com múltiplos agentes](/pt-BR/concepts/multi-agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
