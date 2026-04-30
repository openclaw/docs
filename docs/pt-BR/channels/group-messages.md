---
read_when:
    - Alterando regras de mensagens de grupo ou menções
summary: Comportamento e configuração para o tratamento de mensagens de grupos do WhatsApp (mentionPatterns são compartilhados entre superfícies)
title: Mensagens em grupo
x-i18n:
    generated_at: "2026-04-30T09:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Objetivo: permitir que Clawd fique em grupos do WhatsApp, acorde somente quando mencionado e mantenha essa conversa separada da sessão pessoal de DM.

<Note>
`agents.list[].groupChat.mentionPatterns` também é usado pelo Telegram, Discord, Slack e iMessage. Este documento se concentra no comportamento específico do WhatsApp. Para configurações com vários agentes, defina `agents.list[].groupChat.mentionPatterns` por agente ou use `messages.groupChat.mentionPatterns` como fallback global.
</Note>

## Implementação atual (2025-12-03)

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige uma menção (menções @ reais do WhatsApp via `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer parte do texto). `always` acorda o agente em toda mensagem, mas ele só deve responder quando puder agregar valor significativo; caso contrário, retorna o token silencioso exato `NO_REPLY` / `no_reply`. Os padrões podem ser definidos na configuração (`channels.whatsapp.groups`) e substituídos por grupo via `/activation`. Quando `channels.whatsapp.groups` é definido, ele também atua como uma lista de permissões de grupos (inclua `"*"` para permitir todos).
- Política de grupo: `channels.whatsapp.groupPolicy` controla se mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até você adicionar remetentes).
- Sessões por grupo: as chaves de sessão têm o formato `agent:<agentId>:whatsapp:group:<jid>`, então comandos como `/verbose on`, `/trace on` ou `/think high` (enviados como mensagens independentes) ficam escopados a esse grupo; o estado de DM pessoal permanece intocado. Heartbeats são ignorados em conversas de grupo.
- Injeção de contexto: mensagens de grupo **somente pendentes** (padrão 50) que _não_ acionaram uma execução são prefixadas em `[Chat messages since your last reply - for context]`, com a linha acionadora em `[Current message - respond to this]`. Mensagens já presentes na sessão não são reinjetadas.
- Exposição do remetente: todo lote de grupo agora termina com `[from: Sender Name (+E164)]`, para que o Pi saiba quem está falando.
- Efêmeras/visualização única: desempacotamos essas mensagens antes de extrair texto/menções, então menções dentro delas ainda acionam o agente.
- Prompt de sistema de grupo: no primeiro turno de uma sessão de grupo (e sempre que `/activation` altera o modo), injetamos um breve texto no prompt de sistema, como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda informamos ao agente que é um chat em grupo.

## Exemplo de configuração (WhatsApp)

Adicione um bloco `groupChat` a `~/.openclaw/openclaw.json` para que menções por nome de exibição funcionem mesmo quando o WhatsApp remove o `@` visual no corpo do texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Observações:

- As regexes não diferenciam maiúsculas de minúsculas e usam as mesmas proteções de safe-regex que outras superfícies de regex de configuração; padrões inválidos e repetição aninhada insegura são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca no contato, então o fallback por número raramente é necessário, mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando do chat em grupo:

- `/activation mention`
- `/activation always`

Somente o número do proprietário (de `channels.whatsapp.allowFrom`, ou o E.164 do próprio bot quando não definido) pode alterar isso. Envie `/status` como mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que executa o OpenClaw) ao grupo.
2. Diga `@openclaw …` (ou inclua o número). Somente remetentes na lista de permissões podem acioná-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá o contexto recente do grupo mais o marcador final `[from: …]`, para que ele possa se dirigir à pessoa certa.
4. Diretivas no nível da sessão (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam somente à sessão desse grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão pessoal de DM permanece independente.

## Testes / verificação

- Verificação manual rápida:
  - Envie uma menção `@openclaw` no grupo e confirme uma resposta que mencione o nome do remetente.
  - Envie uma segunda menção e verifique se o bloco de histórico é incluído e depois limpo no turno seguinte.
- Verifique os logs do Gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são ignorados intencionalmente em grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar texto idêntico duas vezes sem menções, somente o primeiro receberá uma resposta.
- Entradas do armazenamento de sessões aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessões (`~/.openclaw/agents/<agentId>/sessions/sessions.json` por padrão); uma entrada ausente significa apenas que o grupo ainda não acionou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode`. Quando respostas visíveis usam o modo padrão somente por ferramenta de mensagem, a digitação começa imediatamente por padrão, para que os membros do grupo possam ver que o agente está trabalhando mesmo que nenhuma resposta final automática seja publicada. A configuração explícita do modo de digitação ainda tem prioridade.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
