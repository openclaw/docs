---
read_when:
    - Configuração específica de grupos do WhatsApp
    - Alteração dos modos de ativação do WhatsApp (`mention` vs `always`)
    - Ajuste de chaves de sessão de grupos do WhatsApp ou do contexto de mensagens pendentes
sidebarTitle: WhatsApp groups
summary: Tratamento de mensagens em grupos do WhatsApp — ativação, listas de permissões, sessões e injeção de contexto
title: Mensagens de grupo do WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:09:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Para o modelo de grupos entre canais (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), consulte [Grupos](/pt-BR/channels/groups). Esta página cobre o comportamento específico do WhatsApp sobre esse modelo: ativação, listas de permissão de grupos, chaves de sessão por grupo e injeção de contexto de mensagens pendentes.

Objetivo: permitir que o OpenClaw fique em grupos do WhatsApp, acorde somente quando for chamado e mantenha essa conversa separada da sessão pessoal por DM.

<Note>
`agents.list[].groupChat.mentionPatterns` também é usado por Telegram, Discord, Slack e iMessage. Para configurações com vários agentes, defina isso por agente ou use `messages.groupChat.mentionPatterns` como fallback global.
</Note>

## Comportamento

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige uma chamada (menções @ reais do WhatsApp via `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer parte do texto). `always` acorda o agente em toda mensagem, mas ele deve responder somente quando puder agregar valor significativo; caso contrário, retorna o token silencioso exato `NO_REPLY` / `no_reply`. Os padrões podem ser definidos na configuração (`channels.whatsapp.groups`) e sobrescritos por grupo via `/activation`. Quando `channels.whatsapp.groups` é definido, ele também atua como uma lista de permissão de grupos (inclua `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla se mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até você adicionar remetentes).
- Sessões por grupo: as chaves de sessão têm o formato `agent:<agentId>:whatsapp:group:<jid>`, então comandos como `/verbose on`, `/trace on` ou `/think high` (enviados como mensagens independentes) ficam restritos a esse grupo; o estado da DM pessoal não é afetado. Heartbeats são ignorados para conversas em grupo.
- Injeção de contexto: mensagens de grupo **somente pendentes** (padrão 50) que _não_ acionaram uma execução são prefixadas em `[Chat messages since your last reply - for context]`, com a linha acionadora em `[Current message - respond to this]`. Mensagens já presentes na sessão não são reinjetadas.
- Exposição do remetente: todo lote de grupo agora termina com `[from: Sender Name (+E164)]`, para que o OpenClaw saiba quem está falando.
- Efêmeras/visualização única: desembrulhamos essas mensagens antes de extrair texto/menções, então chamadas dentro delas ainda acionam.
- Prompt de sistema de grupo: no primeiro turno de uma sessão de grupo (e sempre que `/activation` altera o modo), injetamos um breve texto no prompt de sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda informamos ao agente que é um chat em grupo.

## Exemplo de configuração (WhatsApp)

Adicione um bloco `groupChat` a `~/.openclaw/openclaw.json` para que chamadas por nome de exibição funcionem mesmo quando o WhatsApp remove o `@` visual do corpo do texto:

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

- As regexes não diferenciam maiúsculas de minúsculas e usam as mesmas proteções de regex segura que outras superfícies de regex de configuração; padrões inválidos e repetição aninhada insegura são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca no contato, então o fallback por número raramente é necessário, mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando de chat em grupo:

- `/activation mention`
- `/activation always`

Somente o número do proprietário (de `channels.whatsapp.allowFrom`, ou o E.164 do próprio bot quando não definido) pode alterar isso. Envie `/status` como uma mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que executa o OpenClaw) ao grupo.
2. Diga `@openclaw …` (ou inclua o número). Somente remetentes na lista de permissão podem acioná-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá contexto recente do grupo mais o marcador final `[from: …]`, para que ele possa se dirigir à pessoa correta.
4. Diretivas em nível de sessão (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam somente à sessão desse grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão pessoal por DM permanece independente.

## Teste / verificação

- Smoke manual:
  - Envie uma chamada `@openclaw` no grupo e confirme uma resposta que faça referência ao nome do remetente.
  - Envie uma segunda chamada e verifique se o bloco de histórico é incluído e depois limpo no próximo turno.
- Verifique os logs do Gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são intencionalmente ignorados em grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar texto idêntico duas vezes sem menções, somente o primeiro receberá uma resposta.
- Entradas do armazenamento de sessão aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessão (`~/.openclaw/agents/<agentId>/sessions/sessions.json` por padrão); uma entrada ausente significa apenas que o grupo ainda não acionou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode`. Quando respostas visíveis são ativadas no modo somente ferramenta de mensagem, a digitação começa imediatamente por padrão, para que os membros do grupo possam ver que o agente está trabalhando mesmo que nenhuma resposta final automática seja publicada. A configuração explícita do modo de digitação ainda prevalece.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
