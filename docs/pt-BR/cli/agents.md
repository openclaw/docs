---
read_when:
    - Você quer vários agents isolados (espaços de trabalho + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-23T14:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gerencie agents isolados (espaços de trabalho + autenticação + roteamento).

Relacionado:

- Roteamento multi-agent: [Roteamento multi-agent](/pt-BR/concepts/multi-agent)
- Espaço de trabalho do agent: [Espaço de trabalho do agent](/pt-BR/concepts/agent-workspace)
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

Use vinculações de roteamento para fixar o tráfego de entrada do canal em um agent específico.

Se você também quiser Skills visíveis diferentes por agent, configure
`agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte
[Configuração de Skills](/pt-BR/tools/skills-config) e
[Referência de configuração](/pt-BR/gateway/configuration-reference#agents-defaults-skills).

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

Se você omitir `--agent` em `bind` ou `unbind`, o OpenClaw direciona para o agent padrão atual.

### Comportamento do escopo de vinculação

- Uma vinculação sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback para todo o canal (todas as contas) e é menos específico do que uma vinculação de conta explícita.
- Se o mesmo agent já tiver uma vinculação de canal correspondente sem `accountId`, e você depois fizer a vinculação com um `accountId` explícito ou resolvido, o OpenClaw atualiza essa vinculação existente no local em vez de adicionar uma duplicata.

Exemplo:

```bash
# vinculação inicial somente de canal
openclaw agents bind --agent work --bind telegram

# depois, atualiza para vinculação com escopo de conta
openclaw agents bind --agent work --bind telegram:ops
```

Após a atualização, o roteamento dessa vinculação passa a ter escopo em `telegram:ops`. Se você também quiser roteamento da conta padrão, adicione-o explicitamente (por exemplo `--bind telegram:default`).

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
- `--bindings`: inclui regras completas de roteamento, não apenas contagens/resumos por agent

### `agents add [name]`

Opções:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetível)
- `--non-interactive`
- `--json`

Observações:

- Passar qualquer flag explícita de add coloca o comando no caminho não interativo.
- O modo não interativo exige um nome de agent e `--workspace`.
- `main` é reservado e não pode ser usado como novo id de agent.

### `agents bindings`

Opções:

- `--agent <id>`
- `--json`

### `agents bind`

Opções:

- `--agent <id>` (o padrão é o agent padrão atual)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

### `agents unbind`

Opções:

- `--agent <id>` (o padrão é o agent padrão atual)
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
- Diretórios de espaço de trabalho, estado do agent e transcrições de sessão são movidos para a Lixeira, não excluídos permanentemente.

## Arquivos de identidade

Cada espaço de trabalho do agent pode incluir um `IDENTITY.md` na raiz do espaço de trabalho:

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

- `--agent` ou `--workspace` podem ser usados para selecionar o agent de destino.
- Se você depender de `--workspace` e vários agents compartilharem esse espaço de trabalho, o comando falhará e pedirá que você informe `--agent`.
- Quando nenhum campo explícito de identidade é fornecido, o comando lê os dados de identidade de `IDENTITY.md`.

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
          theme: "lagosta espacial",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
