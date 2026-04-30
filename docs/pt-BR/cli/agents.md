---
read_when:
    - Você quer vários agentes isolados (espaços de trabalho + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agentes
x-i18n:
    generated_at: "2026-04-30T09:39:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

Relacionados:

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Configuração de Skills](/pt-BR/tools/skills-config): configuração de visibilidade de Skills.

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

Use vínculos de roteamento para fixar o tráfego de entrada de canais a um agente específico.

Se você também quiser Skills visíveis diferentes por agente, configure `agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte [Configuração de Skills](/pt-BR/tools/skills-config) e [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

Listar vínculos:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Adicionar vínculos:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o resolve a partir dos padrões do canal e dos hooks de configuração do Plugin quando disponíveis.

Se você omitir `--agent` para `bind` ou `unbind`, o OpenClaw usa o agente padrão atual como destino.

### Comportamento do escopo de vínculo

- Um vínculo sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback de todo o canal (todas as contas) e é menos específico que um vínculo de conta explícito.
- Se o mesmo agente já tiver um vínculo de canal correspondente sem `accountId`, e você depois criar um vínculo com um `accountId` explícito ou resolvido, o OpenClaw atualiza esse vínculo existente no lugar em vez de adicionar uma duplicata.

Exemplo:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Após a atualização, o roteamento desse vínculo fica limitado ao escopo `telegram:ops`. Se você também quiser roteamento da conta padrão, adicione-o explicitamente (por exemplo, `--bind telegram:default`).

Remover vínculos:

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

- Passar qualquer flag explícita de adição alterna o comando para o caminho não interativo.
- O modo não interativo exige um nome de agente e `--workspace`.
- `main` é reservado e não pode ser usado como o novo ID do agente.
- No modo interativo, a propagação de autenticação copia apenas perfis estáticos portáteis
  (`api_key` e `token` estático por padrão). Perfis OAuth com token de atualização permanecem
  disponíveis apenas por herança de leitura do armazenamento real do agente `main`.
  Se o agente padrão configurado não for `main`, entre separadamente para perfis OAuth
  no novo agente.

### `agents bindings`

Opções:

- `--agent <id>`
- `--json`

### `agents bind`

Opções:

- `--agent <id>` (usa o agente padrão atual por padrão)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

### `agents unbind`

Opções:

- `--agent <id>` (usa o agente padrão atual por padrão)
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
- Diretórios de workspace, estado do agente e transcrições de sessão são movidos para a Lixeira, não excluídos definitivamente.
- Se o workspace de outro agente for o mesmo caminho, estiver dentro deste workspace ou contiver este workspace,
  o workspace é preservado e `--json` informa `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## Arquivos de identidade

Cada workspace de agente pode incluir um `IDENTITY.md` na raiz do workspace:

- Caminho de exemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê a partir da raiz do workspace (ou de um `--identity-file` explícito)

Caminhos de avatar são resolvidos em relação à raiz do workspace.

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
- Se você depender de `--workspace` e vários agentes compartilharem esse workspace, o comando falhará e pedirá que você passe `--agent`.
- Quando nenhum campo de identidade explícito é fornecido, o comando lê dados de identidade de `IDENTITY.md`.

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

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
