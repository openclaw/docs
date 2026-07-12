---
read_when:
    - Você quer vários agentes isolados (espaços de trabalho + roteamento + autenticação)
summary: Referência da CLI para `openclaw agents` (listar/adicionar/excluir/vínculos/vincular/desvincular/definir identidade)
title: Agentes
x-i18n:
    generated_at: "2026-07-11T23:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gerencie agentes isolados (espaços de trabalho + autenticação + roteamento). Executar `openclaw agents` sem um subcomando equivale a `openclaw agents list`.

Relacionado:

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Configuração de Skills](/pt-BR/tools/skills-config): configuração da visibilidade de Skills.

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

## Superfície de comandos

### `agents list`

Opções: `--json`, `--bindings` (inclui as regras de roteamento completas, não apenas contagens/resumos por agente).

### `agents add [name]`

Opções: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetível), `--non-interactive`, `--json`.

- Passar qualquer opção explícita de adição faz o comando usar o fluxo não interativo.
- O modo não interativo exige o nome do agente e `--workspace`.
- `main` é reservado e não pode ser usado como o ID do novo agente.
- O modo interativo inicializa a autenticação copiando apenas credenciais estáticas portáteis (perfis `api_key` e `token` estático), a menos que uma credencial desative essa cópia com `copyToAgents: false`; perfis OAuth com token de atualização não são copiados, a menos que um provedor habilite a cópia com `copyToAgents: true`. Sem uma cópia, o OAuth permanece disponível apenas por herança com leitura indireta do armazenamento real do agente `main`. Se o agente padrão configurado não for `main`, faça login separadamente nos perfis OAuth do novo agente.

### `agents bindings`

Opções: `--agent <id>`, `--json`.

### `agents bind`

Opções: `--agent <id>` (o padrão é o agente padrão atual), `--bind <channel[:accountId]>` (repetível), `--json`.

### `agents unbind`

Opções: `--agent <id>` (o padrão é o agente padrão atual), `--bind <channel[:accountId]>` (repetível), `--all`, `--json`. Aceita `--all` ou um ou mais valores de `--bind`, mas não ambos.

### `agents set-identity`

Opções: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Consulte [Definir identidade](#set-identity) abaixo.

### `agents delete <id>`

Opções: `--force`, `--json`.

- `main` não pode ser excluído.
- Sem `--force`, é necessária uma confirmação interativa (falha em uma sessão sem TTY; execute novamente com `--force`).
- Os diretórios do espaço de trabalho, do estado do agente e das transcrições de sessão são movidos para a Lixeira, não excluídos permanentemente.
- Quando o Gateway está acessível, a exclusão é roteada pelo Gateway para que a limpeza da configuração e do armazenamento de sessões use o mesmo gravador que o tráfego de execução. Se o Gateway estiver inacessível, a CLI recorre ao fluxo local offline.
- Se o espaço de trabalho de outro agente for o mesmo caminho, estiver dentro deste espaço de trabalho ou contiver este espaço de trabalho, o espaço de trabalho será mantido, e `--json` informará `workspaceRetained`, `workspaceRetainedReason` e `workspaceSharedWith`.

## Vínculos de roteamento

Use vínculos de roteamento para direcionar o tráfego de entrada de um canal a um agente específico.

Se você também quiser Skills visíveis diferentes para cada agente, configure `agents.defaults.skills` e `agents.list[].skills` em `openclaw.json`. Consulte [Configuração de Skills](/pt-BR/tools/skills-config) e [Referência de configuração](/pt-BR/gateway/config-agents#agentsdefaultsskills).

Liste os vínculos:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Adicione vínculos:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Você também pode adicionar vínculos ao criar um agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Se você omitir `accountId` (`--bind <channel>`), o OpenClaw o determina com base nos hooks de configuração do plugin, no vínculo obrigatório de conta ou na quantidade de contas configuradas do canal.

Se você omitir `--agent` em `bind` ou `unbind`, o OpenClaw usa o agente padrão atual como destino.

### Formato de `--bind`

| Formato                      | Significado                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Corresponde a todas as contas do canal.                                                                                     |
| `--bind <channel>:<account>` | Corresponde a uma conta.                                                                                                    |
| `--bind <channel>`           | Corresponde apenas à conta padrão, a menos que a CLI possa determinar com segurança um escopo de conta específico do plugin. |

### Comportamento do escopo dos vínculos

- Um vínculo armazenado sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é a alternativa para todo o canal (todas as contas) e é menos específica que um vínculo explícito de conta.
- Se o mesmo agente já tiver um vínculo de canal correspondente sem `accountId` e, posteriormente, você criar um vínculo com um `accountId` explícito ou determinado, o OpenClaw atualizará esse vínculo existente no local em vez de adicionar uma duplicata.

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

Após a atualização, o roteamento desse vínculo fica restrito a `telegram:alerts`. Se você também quiser roteamento para a conta padrão, adicione-o explicitamente (por exemplo, `--bind telegram:default`).

Remova vínculos:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Arquivos de identidade

Cada espaço de trabalho de agente pode incluir um arquivo `IDENTITY.md` na raiz do espaço de trabalho:

- Exemplo de caminho: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lê a partir da raiz do espaço de trabalho (ou de um `--identity-file` explícito).

Os caminhos de avatar são resolvidos em relação à raiz do espaço de trabalho e não podem sair dela, nem mesmo por meio de um link simbólico.

## Definir identidade

`set-identity` grava campos em `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (caminho relativo ao espaço de trabalho, URL http(s) ou URI de dados).

- `--agent` ou `--workspace` seleciona o agente de destino. Se `--workspace` corresponder a mais de um agente, o comando falhará e solicitará que você passe `--agent`.
- Arquivos locais de imagem de avatar com caminho relativo ao espaço de trabalho são limitados a 2 MB. URLs HTTP(S) e URIs `data:` não são verificadas em relação ao limite de tamanho de arquivo local.
- Quando nenhum campo de identidade explícito é fornecido, o comando lê os dados de identidade de `IDENTITY.md`.

Carregue a partir de `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Substitua campos explicitamente:

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
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
