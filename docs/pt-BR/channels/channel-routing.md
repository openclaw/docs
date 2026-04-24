---
read_when:
    - Alterar o roteamento do canal ou o comportamento da caixa de entrada
summary: Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado
title: Roteamento de canal
x-i18n:
    generated_at: "2026-04-24T05:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Canais e roteamento

O OpenClaw roteia as respostas **de volta para o canal de onde uma mensagem veio**. O
modelo não escolhe um canal; o roteamento é determinístico e controlado pela
configuração do host.

## Termos principais

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, além de canais de Plugin. `webchat` é o canal interno da interface WebChat e não é um canal de saída configurável.
- **AccountId**: instância de conta por canal (quando compatível).
- Conta padrão opcional do canal: `channels.<channel>.defaultAccount` escolhe
  qual conta é usada quando um caminho de saída não especifica `accountId`.
  - Em configurações com múltiplas contas, defina um padrão explícito (`defaultAccount` ou `accounts.default`) quando duas ou mais contas estiverem configuradas. Sem isso, o roteamento de fallback pode escolher o primeiro ID de conta normalizado.
- **AgentId**: um espaço de trabalho + armazenamento de sessão isolados (“cérebro”).
- **SessionKey**: a chave de bucket usada para armazenar contexto e controlar a concorrência.

## Formatos de chave de sessão (exemplos)

Mensagens diretas são recolhidas na sessão **principal** do agente por padrão:

- `agent:<agentId>:<mainKey>` (padrão: `agent:main:main`)

Mesmo quando o histórico da conversa de mensagem direta é compartilhado com a principal, a sandbox e
a política de ferramentas usam uma chave de runtime derivada por conta para chat direto em
DMs externas, para que mensagens originadas do canal não sejam tratadas como execuções da sessão principal local.

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canais/salas: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Threads do Slack/Discord acrescentam `:thread:<threadId>` à chave base.
- Tópicos de fórum do Telegram incorporam `:topic:<topicId>` na chave do grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixação de rota da DM principal

Quando `session.dmScope` é `main`, mensagens diretas podem compartilhar uma sessão principal.
Para impedir que o `lastRoute` da sessão seja sobrescrito por DMs de não proprietários,
o OpenClaw infere um proprietário fixado a partir de `allowFrom` quando tudo isso é verdadeiro:

- `allowFrom` tem exatamente uma entrada sem curinga.
- A entrada pode ser normalizada para um ID de remetente concreto desse canal.
- O remetente da DM de entrada não corresponde a esse proprietário fixado.

Nesse caso de incompatibilidade, o OpenClaw ainda registra os metadados da sessão de entrada, mas
ignora a atualização de `lastRoute` da sessão principal.

## Regras de roteamento (como um agente é escolhido)

O roteamento escolhe **um agente** para cada mensagem de entrada:

1. **Correspondência exata de peer** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondência de peer pai** (herança de thread).
3. **Correspondência de guild + papéis** (Discord) via `guildId` + `roles`.
4. **Correspondência de guild** (Discord) via `guildId`.
5. **Correspondência de team** (Slack) via `teamId`.
6. **Correspondência de conta** (`accountId` no canal).
7. **Correspondência de canal** (qualquer conta nesse canal, `accountId: "*"`).
8. **Agente padrão** (`agents.list[].default`, senão a primeira entrada da lista, com fallback para `main`).

Quando um binding inclui vários campos de correspondência (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que esse binding se aplique.

O agente correspondente determina qual espaço de trabalho e armazenamento de sessão são usados.

## Grupos de broadcast (executar vários agentes)

Os grupos de broadcast permitem executar **vários agentes** para o mesmo peer **quando o OpenClaw normalmente responderia** (por exemplo: em grupos do WhatsApp, após o bloqueio por menção/ativação).

Configuração:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Consulte: [Grupos de broadcast](/pt-BR/channels/broadcast-groups).

## Visão geral da configuração

- `agents.list`: definições de agentes nomeados (workspace, modelo etc.).
- `bindings`: mapeia canais/contas/peers de entrada para agentes.

Exemplo:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Armazenamento de sessão

Os armazenamentos de sessão ficam no diretório de estado (padrão `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições JSONL ficam ao lado do armazenamento

Você pode substituir o caminho do armazenamento via `session.store` e template `{agentId}`.

A descoberta de sessão do Gateway e ACP também examina armazenamentos de agentes em disco no
raiz padrão `agents/` e em raízes de `session.store` com template. Os armazenamentos
descobertos devem permanecer dentro dessa raiz de agente resolvida e usar um arquivo
`sessions.json` regular. Symlinks e caminhos fora da raiz são ignorados.

## Comportamento do WebChat

O WebChat se conecta ao **agente selecionado** e, por padrão, à sessão principal do agente.
Por isso, o WebChat permite ver em um só lugar o contexto entre canais desse
agente.

## Contexto da resposta

As respostas de entrada incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponíveis.
- O contexto citado é acrescentado a `Body` como um bloco `[Replying to ...]`.

Isso é consistente em todos os canais.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Grupos de broadcast](/pt-BR/channels/broadcast-groups)
- [Pareamento](/pt-BR/channels/pairing)
