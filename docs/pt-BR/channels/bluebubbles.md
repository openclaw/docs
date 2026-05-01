---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de pareamento de Webhook
    - Configurando iMessage no macOS
sidebarTitle: BlueBubbles
summary: iMessage via servidor macOS do BlueBubbles (envio/recebimento REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T05:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin empacotado que se comunica com o servidor macOS BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à sua API mais rica e configuração mais fácil em comparação com o canal imsg legado.

<Note>
As versões atuais do OpenClaw incluem o BlueBubbles, portanto builds empacotados normais não precisam de uma etapa separada de `openclaw plugins install`.
</Note>

## Visão geral

- Executa no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; a edição está atualmente quebrada no Tahoe, e atualizações de ícone de grupo podem relatar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio da API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam por webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e expostos ao agente quando possível).
- Respostas Auto-TTS que sintetizam áudio MP3 ou CAF são entregues como bolhas de memorando de voz do iMessage em vez de anexos de arquivo simples.
- O pareamento/lista de permissões funciona da mesma forma que outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são expostas como eventos do sistema, assim como Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, desfazer envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

<Steps>
  <Step title="Install BlueBubbles">
    Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    Na configuração do BlueBubbles, habilite a API web e defina uma senha.
  </Step>
  <Step title="Configure OpenClaw">
    Execute `openclaw onboard` e selecione BlueBubbles, ou configure manualmente:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    Aponte os webhooks do BlueBubbles para o seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Inicie o Gateway; ele registrará o manipulador de Webhook e começará o pareamento.
  </Step>
</Steps>

<Warning>
**Segurança**

- Sempre defina uma senha de Webhook.
- A autenticação de Webhook é sempre obrigatória. O OpenClaw rejeita solicitações de Webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo, `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes da leitura/análise dos corpos completos de Webhook.

</Warning>

## Mantendo o Messages.app ativo (VM / configurações headless)

Algumas configurações de VM macOS / sempre ativas podem acabar com o Messages.app ficando "ocioso" (eventos recebidos param até que o app seja aberto/trazido para primeiro plano). Uma solução simples é **cutucar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Salve isto como `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Salve isto como `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Isso executa **a cada 300 segundos** e **no login**. A primeira execução pode acionar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles está disponível no onboarding interativo:

```
openclaw onboard
```

O assistente solicita:

<ParamField path="Server URL" type="string" required>
  Endereço do servidor BlueBubbles (por exemplo, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Senha da API das configurações do BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Caminho do endpoint de Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` ou `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Números de telefone, emails ou destinos de chat.
</ParamField>

Você também pode adicionar BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

<Tabs>
  <Tab title="DMs">
    - Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até a aprovação (os códigos expiram após 1 hora).
    - Aprove via:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - O pareamento é a troca de tokens padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

  </Tab>
</Tabs>

### Enriquecimento de nome de contato (macOS, opcional)

Webhooks de grupo do BlueBubbles muitas vezes incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar pelo enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita a consulta. Padrão: `false`.
- As consultas são executadas somente depois que o acesso ao grupo, a autorização de comando e o gating de menção permitirem a passagem da mensagem.
- Somente participantes de telefone sem nome são enriquecidos.
- Números de telefone brutos permanecem como fallback quando nenhuma correspondência local é encontrada.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Gating de menção (grupos)

BlueBubbles oferece suporte a gating de menção para chats em grupo, correspondendo ao comportamento do iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está habilitado para um grupo, o agente responde somente quando mencionado.
- Comandos de controle de remetentes autorizados ignoram o gating de menção.

Configuração por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Gating de comandos

- Comandos de controle (por exemplo, `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comando.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

### Prompt de sistema por grupo

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem nesse grupo, para que você possa definir persona ou regras comportamentais por grupo sem editar prompts do agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

A chave corresponde a qualquer valor que o BlueBubbles relate como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem uma correspondência exata (o mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre vencem o curinga. DMs ignoram esse campo; use personalização de prompt no nível do agente ou da conta em vez disso.

#### Exemplo prático: respostas encadeadas e reações tapback (API privada)

Com a API privada do BlueBubbles habilitada, mensagens de entrada chegam com IDs curtos de mensagem (por exemplo, `[[reply_to:5]]`) e o agente pode chamar `action=reply` para encadear em uma mensagem específica ou `action=react` para enviar um tapback. Um `systemPrompt` por grupo é uma forma confiável de manter o agente escolhendo a ferramenta certa:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reações tapback e respostas encadeadas exigem a API privada do BlueBubbles; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para a mecânica subjacente.

## Associações de conversas ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles são roteadas para a sessão ACP gerada.
- `/new` e `/reset` redefinem a mesma sessão ACP associada no lugar.
- `/acp close` fecha a sessão ACP e remove a associação.

Associações persistentes configuradas também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino BlueBubbles compatível:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para associações estáveis de grupo, prefira `chat_id:*` ou `chat_identifier:*`.

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de associação ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: Enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: Controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: O OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou ao atingir o tempo limite (a parada manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Ações avançadas

O BlueBubbles oferece suporte a ações avançadas de mensagem quando habilitadas na configuração:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Adicionar/remover reações tapback (`messageId`, `emoji`, `remove`). O conjunto nativo de tapbacks do iMessage é `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando um agente escolhe um emoji fora desse conjunto (por exemplo, `👀`), a ferramenta de reação recorre a `love` para que o tapback ainda seja renderizado em vez de falhar a solicitação inteira. Reações de confirmação configuradas ainda são validadas estritamente e geram erro em valores desconhecidos.
    - **edit**: Editar uma mensagem enviada (`messageId`, `text`).
    - **unsend**: Desfazer o envio de uma mensagem (`messageId`).
    - **reply**: Responder a uma mensagem específica (`messageId`, `text`, `to`).
    - **sendWithEffect**: Enviar com efeito do iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Renomear uma conversa em grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Definir o ícone/foto de uma conversa em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
    - **addParticipant**: Adicionar alguém a um grupo (`chatGuid`, `address`).
    - **removeParticipant**: Remover alguém de um grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sair de uma conversa em grupo (`chatGuid`).
    - **upload-file**: Enviar mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`).
      - Memos de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como uma mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar memos de voz.
    - Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.

  </Accordion>
</AccordionGroup>

### IDs de mensagem (curtos vs. completos)

O OpenClaw pode expor IDs de mensagem _curtos_ (por exemplo, `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; podem expirar ao reiniciar ou com a remoção do cache.
- Ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações e armazenamento duráveis:

- Modelos: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuração](/pt-BR/gateway/configuration) para variáveis de modelo.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Mesclagem de DMs com envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos no iMessage — por exemplo, `Dump https://example.com/article` — a Apple divide o envio em **duas entregas de webhook separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de pré-visualização de URL (`"https://..."`) com imagens de pré-visualização OG como anexos.

Os dois webhooks chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem mesclagem, o agente recebe apenas o comando no turno 1, responde (geralmente "envie a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido.

`channels.bluebubbles.coalesceSameSenderDms` opta por mesclar webhooks consecutivos do mesmo remetente em uma DM em um único turno do agente. Conversas em grupo continuam a usar chave por mensagem para preservar a estrutura de turnos de vários usuários.

<Tabs>
  <Tab title="When to enable">
    Habilite quando:

    - Você entrega skills que esperam `command + payload` em uma mensagem (dump, colar, salvar, enfileirar etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional no turno de DM (veja abaixo).

    Deixe desabilitado quando:

    - Você precisa de latência mínima de comando para gatilhos de DM de uma única palavra.
    - Todos os seus fluxos são comandos únicos sem payloads subsequentes.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.bluebubbles` explícito, a janela de debounce aumenta para **2500 ms** (o padrão sem mesclagem é 500 ms). A janela maior é necessária — a cadência de envio dividido da Apple, de 0,8-2,0 s, não cabe no padrão mais estreito.

    Para ajustar a janela por conta própria:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latência adicional para comandos de controle de DM.** Com a flag ativada, mensagens de comando de controle em DM (como `Dump`, `Save` etc.) agora aguardam até a janela de debounce antes do despacho, caso um webhook de payload esteja chegando. Comandos em conversas de grupo mantêm despacho instantâneo.
    - **A saída mesclada é limitada** — o texto mesclado tem limite de 4000 caracteres com um marcador explícito `…[truncated]`; anexos têm limite de 20; entradas de origem têm limite de 10 (a primeira e a mais recente são mantidas além disso). Cada `messageId` de origem ainda chega à desduplicação de entrada, então uma reprodução posterior do MessagePoller de qualquer evento individual é reconhecida como duplicada.
    - **Opcional, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

| Usuário compõe                                                     | Apple entrega             | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                         |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 webhooks com ~1 s entre eles | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 webhooks                | Dois turnos                             | Um turno: texto + imagem                                                |
| `/status` (comando independente)                                   | 1 webhook                 | Despacho instantâneo                    | **Aguarda até a janela e então despacha**                               |
| URL colada sozinha                                                 | 1 webhook                 | Despacho instantâneo                    | Despacho instantâneo (apenas uma entrada no bucket)                     |
| Texto + URL enviados como duas mensagens separadas deliberadas, com minutos de diferença | 2 webhooks fora da janela | Dois turnos                             | Dois turnos (a janela expira entre eles)                                |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)               | N webhooks                | N turnos                                | Um turno, saída limitada (primeira + mais recente, limites de texto/anexo aplicados) |

### Solução de problemas da mesclagem de envio dividido

Se a flag estiver ativada e envios divididos ainda chegarem como dois turnos, verifique cada camada:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Em seguida, `openclaw gateway restart` — a flag é lida na criação do registro do debouncer.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    Consulte o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Meça o intervalo entre o despacho de texto no estilo `"Dump"` e o despacho seguinte de `"https://..."; Attachments:`. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir esse intervalo com folga.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Os carimbos de data/hora de eventos de sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o gateway entrega uma mensagem ao agente, **não** quando o webhook chegou. Uma segunda mensagem enfileirada marcada como `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo webhook chegou — o bucket de mesclagem já tinha sido esvaziado. Ajuste a janela com base no log do servidor BB, não no log de sessão.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    Em máquinas menores (8 GB), turnos do agente podem demorar o suficiente para que o bucket de mesclagem seja esvaziado antes de a resposta ser concluída, e a URL chegue como um segundo turno enfileirado. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o gateway estiver acima de ~500 MB RSS e o compressor estiver ativo, feche outros processos pesados ou migre para um host maior.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão Dump), a URL fica em `replyToBody`, não em um segundo webhook. A mesclagem não se aplica — isso é uma questão de skill/prompt, não do debouncer.
  </Accordion>
</AccordionGroup>

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Mídia + limites

- Anexos de entrada são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- Texto de saída é dividido em blocos até `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Habilitar/desabilitar o canal.
    - `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
    - `channels.bluebubbles.password`: Senha da API.
    - `channels.bluebubbles.webhookPath`: Caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permissões de DM (identificadores, e-mails, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permissões de remetentes de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: No macOS, opcionalmente enriquecer participantes de grupo sem nome a partir dos Contatos locais depois que as verificações de acesso passarem. Padrão: `false`.
    - `channels.bluebubbles.groups`: Configuração por grupo (`requireMention` etc.).

  </Accordion>
  <Accordion title="Entrega e fragmentação">
    - `channels.bluebubbles.sendReadReceipts`: Enviar confirmações de leitura (padrão: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilitar streaming em blocos (padrão: `false`; obrigatório para respostas em streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamanho dos fragmentos de saída em caracteres (padrão: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tempo limite por solicitação, em ms, para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações do macOS 26 nas quais envios do iMessage pela Private API podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo, `45000` ou `60000`. Probes, buscas de chat, reações, edições e verificações de integridade atualmente mantêm o padrão mais curto de 10 s; ampliar a cobertura para reações e edições está planejado como continuidade. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (padrão) divide somente ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por tamanho.

  </Accordion>
  <Accordion title="Mídia e histórico">
    - `channels.bluebubbles.mediaMaxMb`: Limite de mídia de entrada/saída em MB (padrão: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios por caminho local são negados por padrão, a menos que isto esteja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Mesclar webhooks de DM consecutivos do mesmo remetente em um único turno do agente para que o envio dividido de texto+URL da Apple chegue como uma única mensagem (padrão: `false`). Consulte [Agrupando DMs enviadas em partes](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e compensações. Amplia a janela padrão de debounce de entrada de 500 ms para 2500 ms quando habilitado sem um `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensagens de grupo para contexto (0 desabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Limite de histórico de DM.
    - `channels.bluebubbles.replyContextApiFallback`: Quando uma resposta de entrada chega sem `replyToBody`/`replyToSender` e o cache em memória de contexto de resposta falha, buscar a mensagem original na API HTTP do BlueBubbles como fallback de melhor esforço (padrão: `false`). Útil para implantações com várias instâncias compartilhando uma conta do BlueBubbles, após reinicializações do processo ou após remoção por cache TTL/LRU de longa duração. A busca é protegida contra SSRF pela mesma política de todas as outras solicitações do cliente BlueBubbles, nunca lança erro e popula o cache para que respostas subsequentes sejam amortizadas. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Uma configuração no nível do canal se propaga para contas que omitem a flag.

  </Accordion>
  <Accordion title="Ações e contas">
    - `channels.bluebubbles.actions`: Habilitar/desabilitar ações específicas.
    - `channels.bluebubbles.accounts`: Configuração de várias contas.

  </Accordion>
</AccordionGroup>

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Endereçamento / destinos de entrega

Prefira `chat_guid` para roteamento estável:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores diretos: `+15555550123`, `user@example.com`
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a Private API do BlueBubbles esteja habilitada.

### Roteamento iMessage vs SMS

Quando o mesmo identificador tem tanto um chat iMessage quanto um chat SMS no Mac (por exemplo, um número de telefone registrado no iMessage que também recebeu fallbacks de bolha verde), o OpenClaw prefere o chat iMessage e nunca rebaixa silenciosamente para SMS. Para forçar o chat SMS, use um prefixo de destino `sms:` explícito (por exemplo, `sms:+15555550123`). Identificadores sem um chat iMessage correspondente ainda enviam por qualquer chat que o BlueBubbles reportar.

## Segurança

- Solicitações de Webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook secretos (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você encaminhar tráfego de Webhook por proxy, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [segurança do Gateway](/pt-BR/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se o expuser fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme se o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); certifique-se de que a versão do servidor a expõe.
- Editar/desfazer envio exige macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), a edição está atualmente quebrada devido a alterações na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se a edição ainda aparecer no macOS 26 (Tahoe), desabilite-a manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, mas envios divididos (por exemplo, `Dump` + URL) ainda chegam como dois turnos: consulte a lista de verificação de [solução de problemas de agrupamento de envios divididos](#split-send-coalescing-troubleshooting) — causas comuns são janela de debounce apertada demais, timestamps do log de sessão interpretados incorretamente como chegada do Webhook ou um envio com citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Canais](/pt-BR/channels) e o guia de [Plugins](/pt-BR/tools/plugin).

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
