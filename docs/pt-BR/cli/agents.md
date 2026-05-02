---
read_when:
    - Você quer vários agentes isolados (espaços de trabalho + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (listar/adicionar/excluir/vínculos/vincular/desvincular/definir identidade)
title: Agentes
x-i18n:
    generated_at: "2026-05-02T20:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gerencie agentes isolados (espaços de trabalho + autenticação + roteamento).

Relacionado:

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Espaço de trabalho de agente](/pt-BR/concepts/agent-workspace)
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

## Vinculações de roteamento

Use vinculações de roteamento para fixar o tráfego de canal de entrada a um agente específico.

Se você também quiser Skills visíveis diferentes por agente, configure `agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte [Configuração de Skills](/pt-BR/tools/skills-config) e [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

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

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o resolverá a partir dos padrões do canal e dos hooks de configuração do Plugin quando disponíveis.

Se você omitir `--agent` para `bind` ou `unbind`, o OpenClaw direcionará para o agente padrão atual.

### Comportamento de escopo da vinculação

- Uma vinculação sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback para todo o canal (todas as contas) e é menos específico do que uma vinculação de conta explícita.
- Se o mesmo agente já tiver uma vinculação de canal correspondente sem `accountId`, e você posteriormente vincular com um `accountId` explícito ou resolvido, o OpenClaw atualizará essa vinculação existente no lugar em vez de adicionar uma duplicata.

Exemplo:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Após a atualização, o roteamento dessa vinculação fica escopado para `telegram:ops`. Se você também quiser roteamento para a conta padrão, adicione-o explicitamente (por exemplo, `--bind telegram:default`).

Remover vinculações:

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

- Passar qualquer flag explícita de adição muda o comando para o caminho não interativo.
- O modo não interativo exige um nome de agente e `--workspace`.
- `main` é reservado e não pode ser usado como o novo id do agente.
- No modo interativo, a propagação de autenticação copia apenas perfis estáticos portáveis
  (`api_key` e `token` estático por padrão). Perfis de token de atualização OAuth permanecem
  disponíveis apenas por herança de leitura do armazenamento real do agente `main`.
  Se o agente padrão configurado não for `main`, entre separadamente para perfis OAuth
  no novo agente.

### `agents bindings`

Opções:

- `--agent <id>`
- `--json`

### `agents bind`

Opções:

- `--agent <id>` (padrão: o agente padrão atual)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

### `agents unbind`

Opções:

- `--agent <id>` (padrão: o agente padrão atual)
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
- O espaço de trabalho, o estado do agente e os diretórios de transcrições de sessão são movidos para a Lixeira, não excluídos permanentemente.
- Quando o Gateway está acessível, a exclusão é enviada pelo Gateway para que a limpeza de configuração e de armazenamento de sessões compartilhe o mesmo gravador do tráfego em tempo de execução. Se o Gateway não puder ser acessado, a CLI recorre ao caminho local offline.
- Se o espaço de trabalho de outro agente for o mesmo caminho, estiver dentro deste espaço de trabalho ou contiver este espaço de trabalho,
  o espaço de trabalho será mantido e `--json` relatará `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## Arquivos de identidade

Cada espaço de trabalho de agente pode incluir um `IDENTITY.md` na raiz do espaço de trabalho:

- Caminho de exemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê a partir da raiz do espaço de trabalho (ou de um `--identity-file` explícito)

Caminhos de avatar são resolvidos em relação à raiz do espaço de trabalho.

## Definir identidade

`set-identity` grava campos em `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (caminho relativo ao espaço de trabalho, URL http(s) ou URI de dados)

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

- `--agent` ou `--workspace` pode ser usado para selecionar o agente de destino.
- Se você depender de `--workspace` e vários agentes compartilharem esse espaço de trabalho, o comando falhará e pedirá que você passe `--agent`.
- Quando nenhum campo de identidade explícito for fornecido, o comando lerá os dados de identidade de `IDENTITY.md`.

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
- [Espaço de trabalho de agente](/pt-BR/concepts/agent-workspace)
