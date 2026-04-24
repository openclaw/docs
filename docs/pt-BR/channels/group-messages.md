---
read_when:
    - Alterando regras de mensagens em grupo ou menções
summary: Comportamento e configuração para o tratamento de mensagens em grupos do WhatsApp (`mentionPatterns` são compartilhados entre superfícies)
title: Mensagens em grupo
x-i18n:
    generated_at: "2026-04-24T05:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Mensagens em grupo (canal web do WhatsApp)

Objetivo: permitir que o Clawd participe de grupos do WhatsApp, seja ativado apenas quando for chamado e mantenha essa conversa separada da sessão de DM pessoal.

Observação: `agents.list[].groupChat.mentionPatterns` agora também é usado por Telegram/Discord/Slack/iMessage; esta documentação se concentra no comportamento específico do WhatsApp. Para configurações com vários agentes, defina `agents.list[].groupChat.mentionPatterns` por agente (ou use `messages.groupChat.mentionPatterns` como fallback global).

## Implementação atual (2025-12-03)

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige um ping (menções reais do WhatsApp via `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer lugar do texto). `always` ativa o agente em toda mensagem, mas ele deve responder apenas quando puder agregar valor significativo; caso contrário, retorna o token silencioso exato `NO_REPLY` / `no_reply`. Os padrões podem ser definidos na configuração (`channels.whatsapp.groups`) e substituídos por grupo via `/activation`. Quando `channels.whatsapp.groups` é definido, ele também atua como lista de permissões de grupos (inclua `"*"` para permitir todos).
- Política de grupo: `channels.whatsapp.groupPolicy` controla se mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até que você adicione remetentes).
- Sessões por grupo: chaves de sessão têm o formato `agent:<agentId>:whatsapp:group:<jid>`, então comandos como `/verbose on`, `/trace on` ou `/think high` (enviados como mensagens independentes) ficam limitados a esse grupo; o estado da DM pessoal não é afetado. Heartbeats são ignorados para conversas em grupo.
- Injeção de contexto: mensagens de grupo **apenas pendentes** (padrão 50) que _não_ dispararam uma execução são prefixadas em `[Chat messages since your last reply - for context]`, com a linha que disparou em `[Current message - respond to this]`. Mensagens já presentes na sessão não são reinjetadas.
- Exposição do remetente: cada lote de grupo agora termina com `[from: Sender Name (+E164)]` para que o Pi saiba quem está falando.
- Efêmeras/view-once: nós desembrulhamos essas mensagens antes de extrair texto/menções, então pings dentro delas ainda disparam.
- Prompt de sistema para grupos: no primeiro turno de uma sessão de grupo (e sempre que `/activation` altera o modo), injetamos um pequeno trecho no prompt de sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda informamos ao agente que se trata de um chat em grupo.

## Exemplo de configuração (WhatsApp)

Adicione um bloco `groupChat` a `~/.openclaw/openclaw.json` para que pings por nome de exibição funcionem mesmo quando o WhatsApp remove o `@` visual do corpo do texto:

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

- As regexes não diferenciam maiúsculas de minúsculas e usam as mesmas proteções safe-regex de outras superfícies de regex de configuração; padrões inválidos e repetições aninhadas inseguras são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca no contato, então o fallback pelo número raramente é necessário, mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando do chat em grupo:

- `/activation mention`
- `/activation always`

Apenas o número do proprietário (de `channels.whatsapp.allowFrom`, ou o próprio E.164 do bot quando não definido) pode alterar isso. Envie `/status` como uma mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que está executando o OpenClaw) ao grupo.
2. Diga `@openclaw …` (ou inclua o número). Apenas remetentes na lista de permissões podem ativá-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá o contexto recente do grupo mais o marcador final `[from: …]`, para que ele possa se dirigir à pessoa correta.
4. Diretivas no nível da sessão (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam apenas à sessão desse grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão de DM pessoal permanece independente.

## Testes / verificação

- Smoke manual:
  - Envie um ping `@openclaw` no grupo e confirme uma resposta que faça referência ao nome do remetente.
  - Envie um segundo ping e verifique se o bloco de histórico é incluído e depois limpo no próximo turno.
- Verifique os logs do Gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são intencionalmente ignorados em grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar o mesmo texto duas vezes sem menções, apenas a primeira receberá resposta.
- Entradas do armazenamento de sessão aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessão (`~/.openclaw/agents/<agentId>/sessions/sessions.json` por padrão); uma entrada ausente apenas significa que o grupo ainda não disparou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode` (padrão: `message` quando não mencionado).

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
