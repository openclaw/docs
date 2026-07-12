---
read_when:
    - Trabalhando com reações em qualquer canal
    - Entendendo como as reações com emojis diferem entre plataformas
summary: Semântica da ferramenta de reações em todos os canais compatíveis
title: Reações
x-i18n:
    generated_at: "2026-07-12T15:50:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

O agente adiciona e remove reações de emoji com a ação `react` da ferramenta
`message`. O comportamento varia de acordo com o canal.

## Como funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` é obrigatório ao adicionar uma reação.
- Defina `emoji` como uma string vazia (`""`) para remover as reações do bot em
  canais compatíveis.
- Defina `remove: true` para remover um emoji específico (requer `emoji`
  não vazio).
- Em canais com reações de status, definir `trackToolCalls: true` em uma reação permite
  que o runtime reutilize a mensagem que recebeu a reação para reações subsequentes
  de progresso das ferramentas durante o mesmo turno.

## Comportamento por canal

<AccordionGroup>
  <Accordion title="Discord e Slack">
    - Um `emoji` vazio remove todas as reações do bot na mensagem.
    - `remove: true` remove apenas o emoji especificado.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Somente adição de reações: `emoji` é obrigatório e não pode estar vazio.
    - A remoção de reações ainda não está vinculada a uma chamada de exclusão; `remove: true` é rejeitado com um erro explícito em vez de não produzir efeito silenciosamente.
    - Requer que o bot do Talk esteja registrado com o recurso `reaction` (consulte a [documentação do canal Nextcloud Talk](/pt-BR/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Um `emoji` vazio remove as reações do bot.
    - `remove: true` também remove reações, mas ainda exige um `emoji` não vazio para a validação da ferramenta.

  </Accordion>

  <Accordion title="WhatsApp">
    - Um `emoji` vazio remove a reação do bot.
    - `remove: true` é mapeado internamente para um emoji vazio (ainda requer `emoji` na chamada da ferramenta).
    - O WhatsApp tem um slot de reação do bot por mensagem; enviar uma nova reação substitui a anterior em vez de acumular vários emojis.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requer `emoji` não vazio tanto para adicionar quanto para remover.
    - `remove: true` remove essa reação de emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa a mesma ação `react` que os outros canais (adicionar/remover/listar por meio de IDs de reação da mensagem), e não uma ferramenta separada.
    - A adição requer `emoji` não vazio (mapeado para um `emoji_type` do Feishu, por exemplo, `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` requer `emoji` não vazio e remove a reação do próprio bot correspondente a esse tipo de emoji.
    - Um `emoji` vazio com `clearAll: true` remove todas as reações do bot na mensagem.

  </Accordion>

  <Accordion title="Signal">
    - As notificações de reações recebidas são controladas por `channels.signal.reactionNotifications`: `"off"` as desativa, `"own"` (padrão) emite eventos quando os usuários reagem às mensagens do bot, `"all"` emite eventos para todas as reações e `"allowlist"` emite eventos apenas para remetentes em `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - As reações enviadas são tapbacks do iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` e `question`); `emoji` deve ser mapeado para um desses tipos para adicionar uma reação.
    - `remove: true` sem um tipo de tapback reconhecido remove todos os tipos de tapback; com um tipo reconhecido, remove apenas esse tipo.

  </Accordion>
</AccordionGroup>

## Nível de reação

O `reactionLevel` por canal limita a frequência com que o agente envia suas
próprias reações. Valores: `off`, `ack`, `minimal` ou `extensive`.

- [Notificações de reações do Telegram](/pt-BR/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (padrão: `minimal`)
- [Nível de reação do WhatsApp](/pt-BR/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (padrão: `minimal`)
- [Reações do Signal](/pt-BR/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (padrão: `minimal`)

## Relacionado

- [Envio pelo agente](/pt-BR/tools/agent-send) - a ferramenta `message` que inclui `react`
- [Canais](/pt-BR/channels) - configuração específica de cada canal
