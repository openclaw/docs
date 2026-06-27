---
read_when:
    - Você quer vários agentes isolados (espaços de trabalho + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (listar/adicionar/excluir/vinculações/vincular/desvincular/definir identidade)
title: Agentes
x-i18n:
    generated_at: "2026-06-27T17:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

Relacionado:

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Configuração de Skills](/pt-BR/tools/skills-config): configuração de visibilidade de Skills.

## Exemplos

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Associações de roteamento

Use associações de roteamento para fixar o tráfego de canal de entrada a um agente específico.

Se você também quiser Skills visíveis diferentes por agente, configure `agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte [Configuração de Skills](/pt-BR/tools/skills-config) e [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

Listar associações:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Adicionar associações:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Você também pode adicionar associações ao criar um agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o resolve a partir dos hooks de configuração do Plugin, da associação forçada de conta ou da contagem de contas configurada do canal.

Se você omitir `--agent` para `bind` ou `unbind`, o OpenClaw aponta para o agente padrão atual.

### Formato de `--bind`

| Formato                     | Significado                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Corresponde a todas as contas no canal.                                                                          |
| `--bind <channel>:<account>` | Corresponde a uma conta.                                                                                         |
| `--bind <channel>`           | Corresponde somente à conta padrão, a menos que a CLI possa resolver com segurança um escopo de conta específico do Plugin. |

### Comportamento do escopo de associação

- Uma associação armazenada sem `accountId` corresponde somente à conta padrão do canal.
- `accountId: "*"` é o fallback de todo o canal (todas as contas) e é menos específico do que uma associação de conta explícita.
- Se o mesmo agente já tiver uma associação de canal correspondente sem `accountId` e você depois associar com um `accountId` explícito ou resolvido, o OpenClaw atualiza essa associação existente no lugar em vez de adicionar uma duplicata.

Exemplos:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Após a atualização, o roteamento dessa associação fica limitado ao escopo `telegram:alerts`. Se você também quiser roteamento da conta padrão, adicione-o explicitamente (por exemplo, `--bind telegram:default`).

Remover associações:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` aceita `--all` ou um ou mais valores `--bind`, não ambos.

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
- `main` é reservado e não pode ser usado como o novo id do agente.
- No modo interativo, a propagação de autenticação copia somente perfis estáticos portáveis
  (`api_key` e `token` estático por padrão). Perfis OAuth com token de atualização permanecem
  disponíveis somente por herança de leitura a partir do armazenamento real do agente `main`.
  Se o agente padrão configurado não for `main`, faça login separadamente para perfis OAuth
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
- Sem `--force`, a confirmação interativa é obrigatória.
- O workspace, o estado do agente e os diretórios de transcrições de sessão são movidos para a Lixeira, não excluídos permanentemente.
- Quando o Gateway está acessível, a exclusão é enviada pelo Gateway para que a limpeza da configuração e do armazenamento de sessões compartilhe o mesmo escritor do tráfego em tempo de execução. Se o Gateway não puder ser alcançado, a CLI volta para o caminho local offline.
- Se o workspace de outro agente for o mesmo caminho, estiver dentro deste workspace ou contiver este workspace,
  o workspace será mantido e `--json` relatará `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## Arquivos de identidade

Cada workspace de agente pode incluir um `IDENTITY.md` na raiz do workspace:

- Caminho de exemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê da raiz do workspace (ou de um `--identity-file` explícito)

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

- `--agent` ou `--workspace` pode ser usado para selecionar o agente de destino.
- Se você depender de `--workspace` e vários agentes compartilharem esse workspace, o comando falhará e pedirá que você passe `--agent`.
- Arquivos de imagem de avatar locais relativos ao workspace são limitados a 2 MB. URLs HTTP(S) e URIs `data:` não são verificadas com o limite local de tamanho de arquivo.
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
