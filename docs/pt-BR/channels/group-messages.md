---
read_when:
    - Configurando especificamente grupos do WhatsApp
    - Alteração dos modos de ativação do WhatsApp (`mention` vs `always`)
    - Ajuste de chaves de sessão de grupos do WhatsApp ou do contexto de mensagens pendentes
sidebarTitle: WhatsApp groups
summary: Tratamento de mensagens de grupos do WhatsApp — ativação, listas de permissões, sessões e injeção de contexto
title: Mensagens de grupo do WhatsApp
x-i18n:
    generated_at: "2026-07-12T14:56:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Para o modelo de grupos entre canais (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), consulte [Grupos](/pt-BR/channels/groups). Esta página aborda o comportamento específico do WhatsApp sobre esse modelo: ativação, listas de permissões de grupos, chaves de sessão por grupo e injeção de contexto de mensagens pendentes.

Objetivo: permitir que o OpenClaw permaneça em grupos do WhatsApp, seja ativado somente quando mencionado e mantenha essa conversa separada da sessão pessoal de mensagem direta.

<Note>
`agents.list[].groupChat.mentionPatterns` é compartilhado com o controle de menções dos outros canais. Para configurações com vários agentes, defina-o por agente ou use `messages.groupChat.mentionPatterns` como fallback global. Se nenhum dos dois estiver definido, os padrões serão derivados do nome/emoji da identidade do agente.
</Note>

## Comportamento

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige um ping: uma @menção real do WhatsApp (`mentionedJids`), um padrão de expressão regular configurado, os dígitos E.164 do bot em qualquer parte do texto ou uma resposta citando uma das mensagens do bot (exceto em configurações de conversa consigo mesmo com número compartilhado). `always` ativa o agente a cada mensagem, mas o prompt de grupo injetado instrui o agente a responder somente quando agregar valor e, caso contrário, retornar exatamente o token de silêncio `NO_REPLY` (sem diferenciar maiúsculas de minúsculas). Os padrões vêm da configuração (`channels.whatsapp.groups` `requireMention`) e podem ser substituídos por grupo por meio de `/activation`.
- Lista de permissões de grupos: quando `channels.whatsapp.groups` está definido, somente os JIDs de grupo listados são admitidos (inclua `"*"` para permitir todos); mensagens de grupos não listados são descartadas com uma indicação no log.
- Política de grupos: `channels.whatsapp.groupPolicy` controla se as mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até que você adicione remetentes).
- Sessões por grupo: as chaves de sessão têm a forma `agent:<agentId>:whatsapp:group:<jid>` (contas que não são a padrão acrescentam `:thread:whatsapp-account-<accountId>`), portanto, diretivas como `/verbose on`, `/trace on` ou `/think high` (enviadas como mensagens independentes) ficam restritas a esse grupo; o estado das mensagens diretas pessoais não é alterado.
- Injeção de contexto: mensagens de grupo **somente pendentes** (50 por padrão) que _não_ acionaram uma execução recebem o prefixo `[Chat messages since your last reply - for context]`, com a linha de acionamento sob `[Current message - respond to this]`. A janela de pendências é limpa após a execução; mensagens que já estão na sessão não são reinjetadas.
- Atribuição do remetente: cada linha do grupo contém o rótulo do remetente dentro do envelope da mensagem, por exemplo, `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, e a identidade do remetente, além do assunto e dos membros do grupo, é incluída no bloco não confiável de metadados da conversa.
- Efêmeras/de visualização única: os invólucros são removidos antes da extração de texto/menções, portanto, os pings dentro deles ainda acionam o agente.
- Prompt de sistema do grupo: o primeiro turno de uma sessão de grupo (e qualquer turno após `/activation` alterar o modo) injeta orientações de ativação no prompt de sistema (`Activation: trigger-only ...` ou `Activation: always-on ...`, além de "dirija-se ao remetente específico"). As orientações persistentes de entrega em conversas de grupo ("Você está em uma conversa de grupo do WhatsApp...") são sempre incluídas.

## Exemplo de configuração (WhatsApp)

Faça com que as menções ao nome de exibição funcionem mesmo quando o WhatsApp remover o `@` visual do corpo do texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // janela de contexto pendente do grupo (padrão 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Observações:

- As expressões regulares não diferenciam maiúsculas de minúsculas e usam as mesmas proteções de regex segura que as demais áreas de configuração de regex; padrões inválidos e repetições aninhadas inseguras são ignorados.
- O WhatsApp ainda envia menções canônicas por meio de `mentionedJids` quando alguém toca no contato, portanto, o número como alternativa raramente é necessário, mas funciona como uma proteção útil.
- A janela de contexto pendente é resolvida como `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Comando de ativação (somente para o proprietário)

Use o comando de chat em grupo:

- `/activation mention`
- `/activation always`

Somente números de proprietários (de `channels.whatsapp.allowFrom` ou o próprio número E.164 do bot, quando não definido) podem alterar isso; `/activation` enviado por qualquer outra pessoa é ignorado e armazenado apenas como contexto. Envie `/status` como uma mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que está executando o OpenClaw) ao grupo.
2. Diga `@openclaw ...` (ou inclua o número). Somente remetentes na lista de permissões podem acioná-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente inclui o contexto pendente do grupo e linhas identificadas por remetente, para que ele possa responder à pessoa certa.
4. As diretivas de sessão (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) aplicam-se somente à sessão desse grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão pessoal por mensagem direta permanece independente.

## Teste / verificação

- Teste de fumaça manual:
  - Envie uma menção a `@openclaw` no grupo e confirme uma resposta que faça referência ao nome do remetente.
  - Envie uma segunda menção e verifique se o bloco de histórico está incluído e, depois, se é limpo no turno seguinte.
- Verifique os logs do Gateway (execute com `--verbose`) em busca de entradas `inbound web message` que mostrem `from: <groupJid>` e o corpo identificado por remetente.

## Considerações conhecidas

- Heartbeats são executados na sessão principal do agente; sessões de grupo nunca recebem execuções de Heartbeat.
- A supressão de eco memoriza o prompt combinado (histórico + mensagem atual) por sessão para que as próprias mensagens entregues pelo bot não o acionem novamente; um lote idêntico repetido pode ser ignorado como eco.
- As entradas do armazenamento de sessões aparecem como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessões SQLite por agente; uma entrada ausente significa apenas que o grupo ainda não acionou uma execução.
- Os indicadores de digitação seguem `session.typingMode` / `agents.defaults.typingMode`. Quando as respostas visíveis são configuradas para o modo somente pela ferramenta de mensagens, a digitação começa imediatamente por padrão para que os membros do grupo possam ver o agente trabalhando, mesmo que nenhuma resposta final automática seja publicada. A configuração explícita do modo de digitação ainda tem precedência.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
