---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de pareamento de Webhook
    - Configurando o iMessage no macOS
sidebarTitle: BlueBubbles
summary: iMessage via servidor macOS BlueBubbles (envio/recebimento REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T09:35:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin incluído que se comunica com o servidor BlueBubbles macOS por HTTP. **Recomendado para integração com iMessage** devido à sua API mais rica e à configuração mais fácil em comparação com o canal imsg legado.

<Note>
As versões atuais do OpenClaw incluem o BlueBubbles, portanto builds empacotadas normais não precisam de uma etapa separada de `openclaw plugins install`.
</Note>

## Visão geral

- Executa no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; a edição está quebrada no Tahoe no momento, e atualizações de ícone de grupo podem relatar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio da sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam via webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e figurinhas são ingeridos como mídia de entrada (e expostos ao agente quando possível).
- Respostas Auto-TTS que sintetizam áudio MP3 ou CAF são entregues como bolhas de memo de voz do iMessage em vez de anexos de arquivo simples.
- Emparelhamento/lista de permissões funciona da mesma forma que outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de emparelhamento.
- Reações são expostas como eventos de sistema, assim como no Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, desfazer envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

<Steps>
  <Step title="Instale o BlueBubbles">
    Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Ative a API web">
    Na configuração do BlueBubbles, ative a API web e defina uma senha.
  </Step>
  <Step title="Configure o OpenClaw">
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
  <Step title="Aponte os webhooks para o gateway">
    Aponte os webhooks do BlueBubbles para o seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Inicie o gateway">
    Inicie o gateway; ele registrará o manipulador de webhook e começará o emparelhamento.
  </Step>
</Steps>

<Warning>
**Segurança**

- Sempre defina uma senha de webhook.
- A autenticação de webhook é sempre obrigatória. O OpenClaw rejeita solicitações de webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo, `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes da leitura/análise dos corpos completos de webhook.

</Warning>

## Mantendo o Mensagens.app ativo (VM / configurações headless)

Algumas configurações de VM macOS / sempre ativas podem acabar com o Mensagens.app ficando "ocioso" (eventos recebidos param até que o app seja aberto/trazido para primeiro plano). Uma solução simples é **acionar o Mensagens a cada 5 minutos** usando um AppleScript + LaunchAgent.

<Steps>
  <Step title="Salve o AppleScript">
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
  <Step title="Instale um LaunchAgent">
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

    Isso executa **a cada 300 segundos** e **ao fazer login**. A primeira execução pode acionar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

  </Step>
  <Step title="Carregue-o">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

O BlueBubbles está disponível no onboarding interativo:

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
  Caminho do endpoint de webhook.
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
    - Remetentes desconhecidos recebem um código de emparelhamento; mensagens são ignoradas até serem aprovadas (códigos expiram após 1 hora).
    - Aprove via:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Emparelhamento é a troca de token padrão. Detalhes: [Emparelhamento](/pt-BR/channels/pairing)

  </Tab>
  <Tab title="Grupos">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

  </Tab>
</Tabs>

### Enriquecimento de nomes de contatos (macOS, opcional)

Webhooks de grupo do BlueBubbles frequentemente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar pelo enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` ativa a busca. Padrão: `false`.
- As buscas são executadas somente depois que o acesso ao grupo, a autorização de comando e o gating de menção permitiram a passagem da mensagem.
- Somente participantes por telefone sem nome são enriquecidos.
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

O BlueBubbles oferece suporte a gating de menção para chats em grupo, correspondendo ao comportamento do iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está ativado para um grupo, o agente responde somente quando mencionado.
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

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string `systemPrompt` opcional. O valor é injetado no prompt de sistema do agente em cada turno que trata uma mensagem nesse grupo, para que você possa definir persona ou regras comportamentais por grupo sem editar prompts de agentes:

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

A chave corresponde ao que o BlueBubbles relata como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem correspondência exata (o mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre prevalecem sobre o curinga. DMs ignoram este campo; use personalização de prompt no nível do agente ou da conta em vez disso.

#### Exemplo completo: respostas encadeadas e reações tapback (API privada)

Com a API privada do BlueBubbles ativada, mensagens recebidas chegam com IDs curtos de mensagem (por exemplo, `[[reply_to:5]]`) e o agente pode chamar `action=reply` para encadear em uma mensagem específica ou `action=react` para enviar um tapback. Um `systemPrompt` por grupo é uma forma confiável de manter o agente escolhendo a ferramenta certa:

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

## Vinculações de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa BlueBubbles são roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino BlueBubbles compatível:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculações de grupo estáveis, prefira `chat_id:*` ou `chat_identifier:*`.

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

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vinculação ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: Enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: Controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: O OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou por timeout (a parada manual via DELETE não é confiável).

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
    - **react**: Adiciona/remove reações tapback (`messageId`, `emoji`, `remove`). O conjunto nativo de tapbacks do iMessage é `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando um agente escolhe um emoji fora desse conjunto (por exemplo, `👀`), a ferramenta de reação recorre a `love` para que o tapback ainda seja renderizado em vez de falhar a solicitação inteira. Reações de confirmação configuradas ainda são validadas estritamente e geram erro para valores desconhecidos.
    - **edit**: Edita uma mensagem enviada (`messageId`, `text`).
    - **unsend**: Cancela o envio de uma mensagem (`messageId`).
    - **reply**: Responde a uma mensagem específica (`messageId`, `text`, `to`).
    - **sendWithEffect**: Envia com efeito do iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Renomeia uma conversa em grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Define o ícone/foto de uma conversa em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
    - **addParticipant**: Adiciona alguém a um grupo (`chatGuid`, `address`).
    - **removeParticipant**: Remove alguém de um grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sai de uma conversa em grupo (`chatGuid`).
    - **upload-file**: Envia mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`).
      - Mensagens de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar mensagens de voz.
    - Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.

  </Accordion>
</AccordionGroup>

### IDs de mensagem (curto vs completo)

O OpenClaw pode expor IDs de mensagem _curtos_ (por exemplo, `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar ao reiniciar ou por remoção do cache.
- Ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações e armazenamento duráveis:

- Modelos: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuração](/pt-BR/gateway/configuration) para variáveis de modelo.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescência de DMs de envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos no iMessage — por exemplo, `Dump https://example.com/article` — a Apple divide o envio em **duas entregas de Webhook separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de pré-visualização de URL (`"https://..."`) com imagens de pré-visualização OG como anexos.

Os dois webhooks chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (frequentemente "envie a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido.

`channels.bluebubbles.coalesceSameSenderDms` opta por mesclar webhooks consecutivos do mesmo remetente em uma DM em um único turno do agente. Conversas em grupo continuam usando chave por mensagem, preservando a estrutura de turnos com vários usuários.

<Tabs>
  <Tab title="When to enable">
    Habilite quando:

    - Você entrega Skills que esperam `command + payload` em uma mensagem (dump, paste, save, queue etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional no turno da DM (veja abaixo).

    Deixe desabilitado quando:

    - Você precisa de latência mínima de comando para acionadores de DM de uma única palavra.
    - Todos os seus fluxos são comandos pontuais sem payloads subsequentes.

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

    Com a flag ativada e sem `messages.inbound.byChannel.bluebubbles` explícito, a janela de debounce aumenta para **2500 ms** (o padrão sem coalescência é 500 ms). A janela mais ampla é necessária — a cadência de envio dividido da Apple, de 0,8-2,0 s, não cabe no padrão mais estreito.

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
    - **Latência adicional para comandos de controle em DM.** Com a flag ativada, mensagens de comando de controle em DM (como `Dump`, `Save` etc.) agora aguardam até a janela de debounce antes do despacho, caso um Webhook de payload esteja chegando. Comandos em conversas em grupo mantêm despacho instantâneo.
    - **A saída mesclada tem limites** — o texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira e as mais recentes são mantidas além disso). Cada `messageId` de origem ainda chega à desduplicação de entrada, portanto uma repetição posterior do MessagePoller de qualquer evento individual é reconhecida como duplicata.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

| O usuário compõe                                                    | A Apple entrega            | Flag desativada (padrão)                      | Flag ativada + janela de 2500 ms                                      |
| ------------------------------------------------------------------- | -------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                               | 2 webhooks com ~1 s entre eles | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (anexo + texto)                     | 2 webhooks                 | Dois turnos                                   | Um turno: texto + imagem                                              |
| `/status` (comando autônomo)                                        | 1 Webhook                  | Despacho instantâneo                          | **Aguarda até a janela e então despacha**                             |
| URL colada sozinha                                                  | 1 Webhook                  | Despacho instantâneo                          | Despacho instantâneo (apenas uma entrada no bucket)                   |
| Texto + URL enviados como duas mensagens separadas intencionais, com minutos entre elas | 2 webhooks fora da janela | Dois turnos                                   | Dois turnos (a janela expira entre eles)                              |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)                | N webhooks                 | N turnos                                      | Um turno, saída limitada (primeira + mais recentes, limites de texto/anexo aplicados) |

### Solução de problemas de coalescência de envio dividido

Se a flag estiver ativada e envios divididos ainda chegarem como dois turnos, verifique cada camada:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Depois `openclaw gateway restart` — a flag é lida na criação do registro de debouncers.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    Veja o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Meça o intervalo entre o despacho de texto no estilo `"Dump"` e o despacho seguinte de `"https://..."; Attachments:`. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir esse intervalo com folga.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Os timestamps de eventos de sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o Gateway entrega uma mensagem ao agente, **não** quando o Webhook chegou. Uma segunda mensagem enfileirada marcada como `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo Webhook chegou — o bucket de coalescência já tinha sido liberado. Ajuste a janela com base no log do servidor BB, não no log da sessão.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    Em máquinas menores (8 GB), os turnos do agente podem demorar o bastante para que o bucket de coalescência seja liberado antes de a resposta terminar, e a URL chegue como um segundo turno enfileirado. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o Gateway estiver acima de ~500 MB de RSS e o compressor estiver ativo, feche outros processos pesados ou migre para um host maior.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão de Dump), a URL fica em `replyToBody`, não em um segundo Webhook. A coalescência não se aplica — isso é uma questão de skill/prompt, não do debouncer.
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
- O texto de saída é dividido em partes em `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Habilita/desabilita o canal.
    - `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
    - `channels.bluebubbles.password`: Senha da API.
    - `channels.bluebubbles.webhookPath`: Caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permissões de DM (identificadores, emails, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permissões de remetentes de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: No macOS, opcionalmente enriquece participantes de grupo sem nome a partir dos Contatos locais depois que as verificações de acesso passam. Padrão: `false`.
    - `channels.bluebubbles.groups`: Configuração por grupo (`requireMention` etc.).

  </Accordion>
  <Accordion title="Delivery and chunking">
    - `channels.bluebubbles.sendReadReceipts`: Enviar confirmações de leitura (padrão: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilitar streaming de blocos (padrão: `false`; obrigatório para respostas em streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamanho do fragmento de saída em caracteres (padrão: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tempo limite por solicitação em ms para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações do macOS 26 em que envios do iMessage pela Private API podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo `45000` ou `60000`. Probes, consultas de chat, reações, edições e verificações de integridade atualmente mantêm o padrão mais curto de 10s; ampliar a cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho.

  </Accordion>
  <Accordion title="Media and history">
    - `channels.bluebubbles.mediaMaxMb`: Limite de mídia de entrada/saída em MB (padrão: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios por caminho local são negados por padrão, a menos que isso esteja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Mescla webhooks de DM consecutivos do mesmo remetente em um único turno do agente, para que o envio dividido de texto+URL da Apple chegue como uma única mensagem (padrão: `false`). Veja [Coalescência de DMs de envio dividido](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e compensações. Amplia a janela padrão de debounce de entrada de 500 ms para 2500 ms quando habilitado sem um `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensagens de grupo para contexto (0 desabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Limite de histórico de DM.

  </Accordion>
  <Accordion title="Actions and accounts">
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
- Handles diretos: `+15555550123`, `user@example.com`
  - Se um handle direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a Private API do BlueBubbles esteja habilitada.

### Roteamento iMessage vs SMS

Quando o mesmo handle tem tanto um chat do iMessage quanto um chat de SMS no Mac (por exemplo, um número de telefone registrado no iMessage, mas que também recebeu fallbacks de bolha verde), o OpenClaw prefere o chat do iMessage e nunca faz downgrade silencioso para SMS. Para forçar o chat de SMS, use um prefixo de destino explícito `sms:` (por exemplo `sms:+15555550123`). Handles sem um chat do iMessage correspondente ainda enviam por qualquer chat que o BlueBubbles reportar.

## Segurança

- Solicitações de Webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você fizer proxy do tráfego de Webhook, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Veja [Segurança do Gateway](/pt-BR/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se expô-lo fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme que o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); certifique-se de que a versão do servidor a exponha.
- Editar/cancelar envio exige macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), a edição está atualmente quebrada devido a mudanças na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se editar ainda aparecer no macOS 26 (Tahoe), desabilite manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, mas envios divididos (por exemplo, `Dump` + URL) ainda chegam como dois turnos: veja a lista de verificação de [solução de problemas de coalescência de envio dividido](#split-send-coalescing-troubleshooting) — causas comuns são janela de debounce muito curta, timestamps do log de sessão interpretados incorretamente como chegada de Webhook ou um envio de citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, veja [Canais](/pt-BR/channels) e o guia de [Plugins](/pt-BR/tools/plugin).

## Relacionado

- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e controle por menções
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
