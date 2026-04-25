---
read_when:
    - Alterando regras de mensagens de grupo ou menções
summary: Comportamento e configuração para o tratamento de mensagens de grupo do WhatsApp (`mentionPatterns` são compartilhados entre superfícies)
title: Mensagens de grupo
x-i18n:
    generated_at: "2026-04-25T13:41:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Objetivo: permitir que o Clawd fique em grupos do WhatsApp, acorde apenas quando for chamado e mantenha essa conversa separada da sessão de DM pessoal.

Observação: `agents.list[].groupChat.mentionPatterns` agora também é usado por Telegram/Discord/Slack/iMessage; esta documentação foca no comportamento específico do WhatsApp. Para configurações com vários agentes, defina `agents.list[].groupChat.mentionPatterns` por agente (ou use `messages.groupChat.mentionPatterns` como fallback global).

## Implementação atual (2025-12-03)

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige um ping (menções reais do WhatsApp com `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer lugar do texto). `always` ativa o agente em toda mensagem, mas ele deve responder apenas quando puder agregar valor de forma significativa; caso contrário, retorna o token silencioso exato `NO_REPLY` / `no_reply`. Os padrões podem ser definidos na configuração (`channels.whatsapp.groups`) e sobrescritos por grupo via `/activation`. Quando `channels.whatsapp.groups` está definido, ele também atua como uma allowlist de grupos (inclua `"*"` para permitir todos).
- Política de grupo: `channels.whatsapp.groupPolicy` controla se mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até você adicionar remetentes).
- Sessões por grupo: as chaves de sessão têm o formato `agent:<agentId>:whatsapp:group:<jid>`, então comandos como `/verbose on`, `/trace on` ou `/think high` (enviados como mensagens independentes) ficam restritos àquele grupo; o estado da DM pessoal permanece intocado. Heartbeats são ignorados em conversas de grupo.
- Injeção de contexto: mensagens de grupo **somente pendentes** (padrão: 50) que _não_ dispararam uma execução são prefixadas em `[Chat messages since your last reply - for context]`, com a linha disparadora em `[Current message - respond to this]`. Mensagens já presentes na sessão não são reinjetadas.
- Identificação do remetente: cada lote de grupo agora termina com `[from: Nome do Remetente (+E164)]`, para que o Pi saiba quem está falando.
- Efêmeras/view-once: nós as desembrulhamos antes de extrair texto/menções, então pings dentro delas ainda disparam.
- Prompt de sistema para grupo: no primeiro turno de uma sessão de grupo (e sempre que `/activation` muda o modo), injetamos um pequeno texto no prompt de sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda assim informamos ao agente que é um chat em grupo.

## Exemplo de configuração (WhatsApp)

Adicione um bloco `groupChat` a `~/.openclaw/openclaw.json` para que pings por nome de exibição funcionem mesmo quando o WhatsApp remove o `@` visual no corpo do texto:

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

- As regexes não diferenciam maiúsculas de minúsculas e usam as mesmas proteções de regex segura de outras superfícies de regex de configuração; padrões inválidos e repetições aninhadas inseguras são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca no contato, então o fallback por número raramente é necessário, mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando do chat em grupo:

- `/activation mention`
- `/activation always`

Somente o número do proprietário (de `channels.whatsapp.allowFrom`, ou o próprio E.164 do bot quando não definido) pode mudar isso. Envie `/status` como mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que está executando o OpenClaw) ao grupo.
2. Diga `@openclaw …` (ou inclua o número). Somente remetentes na allowlist podem dispará-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá o contexto recente do grupo mais o marcador final `[from: …]`, para que ele possa se dirigir à pessoa certa.
4. Diretivas no nível da sessão (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam apenas à sessão daquele grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão de DM pessoal continua independente.

## Testes / verificação

- Smoke manual:
  - Envie um ping `@openclaw` no grupo e confirme uma resposta que faça referência ao nome do remetente.
  - Envie um segundo ping e verifique se o bloco de histórico é incluído e então limpo no próximo turno.
- Verifique os logs do gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são intencionalmente ignorados em grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar o mesmo texto duas vezes sem menções, apenas a primeira receberá resposta.
- Entradas do armazenamento de sessão aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessão (`~/.openclaw/agents/<agentId>/sessions/sessions.json` por padrão); uma entrada ausente apenas significa que o grupo ainda não disparou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode` (padrão: `message` quando não mencionado).

## Relacionados

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
