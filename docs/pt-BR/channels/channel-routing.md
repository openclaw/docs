---
read_when:
    - Alterar o roteamento de canais ou o comportamento da caixa de entrada
summary: Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado
title: Roteamento de canais
x-i18n:
    generated_at: "2026-04-30T09:35:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canais e roteamento

OpenClaw roteia respostas **de volta para o canal de onde veio uma mensagem**. O
modelo não escolhe um canal; o roteamento é determinístico e controlado pela
configuração do host.

## Termos-chave

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, além de canais de plugin. `webchat` é o canal interno da interface WebChat e não é um canal de saída configurável.
- **AccountId**: instância de conta por canal (quando compatível).
- Conta padrão opcional do canal: `channels.<channel>.defaultAccount` escolhe
  qual conta é usada quando um caminho de saída não especifica `accountId`.
  - Em configurações com várias contas, defina um padrão explícito (`defaultAccount` ou `accounts.default`) quando duas ou mais contas estiverem configuradas. Sem isso, o roteamento de fallback pode escolher o primeiro ID de conta normalizado.
- **AgentId**: um workspace isolado + armazenamento de sessão (“cérebro”).
- **SessionKey**: a chave do bucket usada para armazenar contexto e controlar concorrência.

## Formatos de chave de sessão (exemplos)

Mensagens diretas são colapsadas para a sessão **principal** do agente por padrão:

- `agent:<agentId>:<mainKey>` (padrão: `agent:main:main`)

Mesmo quando o histórico de conversa de mensagens diretas é compartilhado com a principal, a sandbox e
a política de ferramentas usam uma chave de runtime de chat direto por conta derivada para DMs externas,
para que mensagens originadas por canal não sejam tratadas como execuções da sessão principal local.

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canais/salas: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Threads do Slack/Discord acrescentam `:thread:<threadId>` à chave base.
- Tópicos de fórum do Telegram incorporam `:topic:<topicId>` à chave do grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixação da rota de DM principal

Quando `session.dmScope` é `main`, mensagens diretas podem compartilhar uma sessão principal.
Para impedir que o `lastRoute` da sessão seja sobrescrito por DMs que não sejam do proprietário,
OpenClaw infere um proprietário fixado a partir de `allowFrom` quando todas estas condições são verdadeiras:

- `allowFrom` tem exatamente uma entrada sem curinga.
- A entrada pode ser normalizada para um ID de remetente concreto para esse canal.
- O remetente da DM de entrada não corresponde a esse proprietário fixado.

Nesse caso de incompatibilidade, OpenClaw ainda registra metadados da sessão de entrada, mas
ignora a atualização do `lastRoute` da sessão principal.

## Registro de entrada protegido

Plugins de canal podem marcar um registro de sessão de entrada como `createIfMissing: false`
quando um caminho protegido não deve criar uma nova sessão OpenClaw. Nesse modo,
OpenClaw pode atualizar metadados e `lastRoute` para uma sessão existente, mas
não cria uma entrada de sessão somente de rota apenas porque uma mensagem foi observada.

## Regras de roteamento (como um agente é escolhido)

O roteamento escolhe **um agente** para cada mensagem de entrada:

1. **Correspondência exata de peer** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondência de peer pai** (herança de thread).
3. **Correspondência de guilda + funções** (Discord) via `guildId` + `roles`.
4. **Correspondência de guilda** (Discord) via `guildId`.
5. **Correspondência de equipe** (Slack) via `teamId`.
6. **Correspondência de conta** (`accountId` no canal).
7. **Correspondência de canal** (qualquer conta nesse canal, `accountId: "*"`).
8. **Agente padrão** (`agents.list[].default`, caso contrário a primeira entrada da lista, fallback para `main`).

Quando um binding inclui vários campos de correspondência (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que esse binding seja aplicado.

O agente correspondente determina quais workspace e armazenamento de sessão são usados.

## Grupos de transmissão (executar vários agentes)

Grupos de transmissão permitem executar **vários agentes** para o mesmo peer **quando OpenClaw normalmente responderia** (por exemplo: em grupos do WhatsApp, após gating de menção/ativação).

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

Veja: [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

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

Armazenamentos de sessão ficam no diretório de estado (padrão `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições JSONL ficam ao lado do armazenamento

Você pode sobrescrever o caminho do armazenamento via `session.store` e templating de `{agentId}`.

A descoberta de sessões do Gateway e do ACP também verifica armazenamentos de agentes baseados em disco sob a
raiz padrão `agents/` e sob raízes de `session.store` com templates. Armazenamentos descobertos
devem permanecer dentro dessa raiz de agente resolvida e usar um arquivo
`sessions.json` regular. Symlinks e caminhos fora da raiz são ignorados.

## Comportamento do WebChat

O WebChat se anexa ao **agente selecionado** e usa como padrão a sessão principal do agente.
Por causa disso, o WebChat permite ver o contexto entre canais desse
agente em um só lugar.

## Contexto de resposta

Respostas de entrada incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponíveis.
- Contexto citado é anexado a `Body` como um bloco `[Replying to ...]`.

Isso é consistente entre canais.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Pareamento](/pt-BR/channels/pairing)
