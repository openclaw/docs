---
read_when:
    - Alteração do roteamento de canais ou do comportamento da caixa de entrada
summary: Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado
title: Roteamento de canais
x-i18n:
    generated_at: "2026-07-12T14:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canais e roteamento

O OpenClaw encaminha as respostas **de volta ao canal de onde veio a mensagem**. O
modelo não escolhe um canal; o roteamento é determinístico e controlado pela
configuração do host.

## Termos principais

- **Canal**: um plugin de canal incluído, como `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` ou `whatsapp`, além dos canais de plugins instalados. `webchat` é o canal interno da interface WebChat e não é um canal de saída configurável.
- **AccountId**: instância de conta por canal (quando houver suporte).
- Conta padrão opcional do canal: `channels.<channel>.defaultAccount` escolhe
  qual conta será usada quando um caminho de saída não especificar `accountId`.
  - Em configurações com várias contas, defina explicitamente uma conta padrão (`defaultAccount` ou uma conta chamada `default`) quando houver duas ou mais contas configuradas. Sem isso, o roteamento de fallback poderá escolher o primeiro ID de conta normalizado.
- **AgentId**: um espaço de trabalho isolado + armazenamento de sessões ("cérebro").
- **SessionKey**: a chave do agrupador usada para armazenar contexto e controlar a concorrência.

## Prefixos de destino de saída

Destinos de saída explícitos podem incluir um prefixo de provedor, como `telegram:123` ou `tg:123`. O núcleo trata esse prefixo como uma indicação de seleção de canal apenas quando o canal selecionado é `last` ou ainda não foi resolvido, e somente quando o plugin carregado anuncia esse prefixo. Se o chamador já tiver selecionado um canal explícito, o prefixo do provedor deverá corresponder a esse canal; combinações entre canais, como entregar pelo WhatsApp para `telegram:123`, falham antes da normalização de destino específica do plugin.

Prefixos de tipo de destino e de serviço, como `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` e `sms:<number>`, permanecem dentro da gramática do canal selecionado. Eles não selecionam o provedor por conta própria.

## Formatos de chave de sessão (exemplos)

Por padrão, as mensagens diretas são consolidadas na sessão **principal** do agente:

- `agent:<agentId>:<mainKey>` (padrão: `agent:main:main`)

`session.dmScope` controla a consolidação das MDs: `main` (padrão) compartilha uma
única sessão principal, enquanto `per-peer`, `per-channel-peer` e `per-account-channel-peer`
mantêm as MDs em sessões separadas. Uma vinculação de rota pode substituir o escopo para os
pares correspondentes por meio de `bindings[].session.dmScope`.

Mesmo quando o histórico de conversas por mensagens diretas é compartilhado com a sessão principal, as políticas de
sandbox e de ferramentas usam uma chave de runtime de conversa direta por conta derivada para MDs externas,
para que mensagens originadas em canais não sejam tratadas como execuções locais da sessão principal.

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canais/salas: `agent:<agentId>:<channel>:channel:<id>`

Tópicos:

- Tópicos do Slack/Discord acrescentam `:thread:<threadId>` à chave base.
- Tópicos de fórum do Telegram incorporam `:topic:<topicId>` à chave do grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixação da rota de MD principal

Quando `session.dmScope` é `main`, as mensagens diretas podem compartilhar uma única sessão principal.
Para impedir que o `lastRoute` da sessão seja sobrescrito por MDs de usuários que não sejam o proprietário,
o OpenClaw infere um proprietário fixado a partir de `allowFrom` quando todas estas condições são verdadeiras:

- `allowFrom` contém exatamente uma entrada que não seja curinga.
- A entrada pode ser normalizada para um ID de remetente concreto desse canal.
- O remetente da MD recebida não corresponde ao proprietário fixado.

Nesse caso de incompatibilidade, o OpenClaw ainda registra os metadados da sessão recebida, mas
não atualiza o `lastRoute` da sessão principal.

## Registro protegido de mensagens recebidas

Plugins de canal podem marcar um registro de sessão recebida como `createIfMissing: false`
quando um caminho protegido não deve criar uma nova sessão do OpenClaw. Nesse modo,
o OpenClaw pode atualizar os metadados e o `lastRoute` de uma sessão existente, mas
não cria uma entrada de sessão apenas para a rota simplesmente porque uma mensagem foi observada.

## Regras de roteamento (como um agente é escolhido)

O roteamento seleciona **um agente** para cada mensagem recebida:

1. **Correspondência exata de peer** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondência de peer pai** (herança de thread).
3. **Correspondência curinga de peer** (`peer.id: "*"` para um tipo de peer).
4. **Correspondência de guilda + funções** (Discord) por meio de `guildId` + `roles`.
5. **Correspondência de guilda** (Discord) por meio de `guildId`.
6. **Correspondência de equipe** (Slack) por meio de `teamId`.
7. **Correspondência de conta** (`accountId` no canal).
8. **Correspondência de canal** (qualquer conta nesse canal, `accountId: "*"`).
9. **Agente padrão** (`agents.list[].default`; caso contrário, a primeira entrada da lista, com fallback para `main`).

Quando uma vinculação inclui vários campos de correspondência (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que essa vinculação seja aplicada.

O agente correspondente determina quais workspace e armazenamento de sessões são usados.

## Grupos de transmissão (executar vários agentes)

Os grupos de transmissão permitem executar **vários agentes** para o mesmo peer **quando o OpenClaw normalmente responderia** (por exemplo: em grupos do WhatsApp, após a verificação de menção/ativação).

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

Consulte: [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

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

## Armazenamento de sessões

As linhas de sessão em tempo de execução ficam no banco de dados SQLite de cada agente, no diretório de estado (padrão `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Instalações mais antigas podem ter arquivos JSONL legados de transcrições e um armazenamento de linhas `sessions.json` em `~/.openclaw/agents/<agentId>/sessions/`. A inicialização do Gateway e `openclaw doctor --fix` importam automaticamente para o SQLite as linhas e o histórico legados em uso. Use `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e a sequência de validação do
[Doctor](/pt-BR/cli/doctor#session-sqlite-migration) quando precisar de evidências explícitas da migração.
Ainda é possível selecionar um caminho de armazenamento legado por meio de `session.store` e da modelagem `{agentId}` para fluxos de trabalho de migração e manutenção offline.

A descoberta de sessões do Gateway e do ACP também verifica os armazenamentos de agentes em disco na raiz padrão `agents/` e nas raízes modeladas de `session.store`. Os armazenamentos descobertos devem permanecer dentro dessa raiz de agente resolvida e usar um arquivo legado regular `sessions.json`. Links simbólicos e caminhos fora da raiz são ignorados.

## Comportamento do WebChat

O WebChat se conecta ao **agente selecionado** e usa como padrão a sessão principal
do agente. Por isso, o WebChat permite que você veja em um só lugar o contexto entre canais
desse agente.

## Contexto da resposta

As respostas recebidas incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponíveis.
- O contexto citado é acrescentado a `Body` como um bloco `[Replying to ...]`.

Isso é consistente em todos os canais.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Pareamento](/pt-BR/channels/pairing)
