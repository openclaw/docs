---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas do emparelhamento de Webhook
    - Configurando o iMessage no macOS
sidebarTitle: BlueBubbles
summary: Suporte legado ao iMessage via servidor macOS BlueBubbles (envio/recebimento por REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin legado incluído que se comunica com o servidor macOS do BlueBubbles por HTTP. Configurações existentes do BlueBubbles continuam funcionando, mas novas implantações do OpenClaw iMessage devem preferir o Plugin nativo [iMessage](/pt-BR/channels/imessage) quando seus requisitos forem adequados ao seu host.

<Warning>
O BlueBubbles está obsoleto para novas configurações do OpenClaw.

O ecossistema upstream do BlueBubbles ainda está ativo, mas o OpenClaw depende da API do servidor macOS do BlueBubbles. Em 6 de maio de 2026, a branch de desenvolvimento oficial do [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) foi alterada pela última vez em [22 de janeiro de 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037), e a versão mais recente do servidor ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) foi publicada em 16 de maio de 2025. O aplicativo cliente e os repositórios auxiliares têm atividade mais recente, então isso não é uma alegação de abandono; a descontinuação trata de reduzir a dependência do OpenClaw em relação a um servidor HTTP externo, Webhooks e superfície de compatibilidade com APIs privadas quando o caminho nativo `imsg` mantém a integração em um contrato stdio local.
</Warning>

<Note>
As versões atuais do OpenClaw incluem o BlueBubbles, portanto builds empacotados normais não precisam de uma etapa separada `openclaw plugins install`.
</Note>

## Visão geral

- Executa no macOS por meio do aplicativo auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Fallback legado para instalações que já dependem de IDs de canal do BlueBubbles, estado de Webhook, destinos de grupo, entrega por Cron ou roteamento de workspace.
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; a edição está atualmente quebrada no Tahoe, e atualizações de ícone de grupo podem relatar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio de sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam por Webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e expostos ao agente quando possível).
- Respostas Auto-TTS que sintetizam áudio MP3 ou CAF são entregues como balões de memorando de voz do iMessage em vez de anexos de arquivo comuns.
- O pareamento/lista de permissão funciona da mesma forma que outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são expostas como eventos de sistema, assim como Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

<Steps>
  <Step title="Instale o BlueBubbles">
    Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Habilite a API web">
    Na configuração do BlueBubbles, habilite a API web e defina uma senha.
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
  <Step title="Aponte os Webhooks para o Gateway">
    Aponte os Webhooks do BlueBubbles para seu Gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Inicie o Gateway">
    Inicie o Gateway; ele registrará o manipulador de Webhook e iniciará o pareamento.
  </Step>
</Steps>

<Warning>
**Segurança**

- Sempre defina uma senha de Webhook.
- A autenticação de Webhook é sempre obrigatória. O OpenClaw rejeita solicitações de Webhook do BlueBubbles a menos que elas incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo, `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar corpos completos de Webhook.

</Warning>

## Mantendo o Messages.app ativo (configurações de VM / headless)

Algumas configurações de VM macOS / sempre ativas podem acabar com o Messages.app ficando "ocioso" (eventos recebidos param até que o app seja aberto/colocado em primeiro plano). Uma solução alternativa simples é **tocar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

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

    Isso executa **a cada 300 segundos** e **no login**. A primeira execução pode acionar prompts de **Automation** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

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
  Caminho do endpoint de Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` ou `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Números de telefone, emails ou destinos de chat.
</ParamField>

Você também pode adicionar o BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

<Tabs>
  <Tab title="DMs">
    - Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até serem aprovadas (códigos expiram após 1 hora).
    - Aprove via:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pareamento é a troca de token padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)

  </Tab>
  <Tab title="Grupos">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

  </Tab>
</Tabs>

### Enriquecimento de nome de contato (macOS, opcional)

Webhooks de grupo do BlueBubbles frequentemente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar por enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita a consulta. Padrão: `false`.
- As consultas são executadas somente depois que acesso ao grupo, autorização de comando e gating de menção permitiram a passagem da mensagem.
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

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string `systemPrompt` opcional. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem nesse grupo, para que você possa definir persona ou regras comportamentais por grupo sem editar prompts de agente:

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

A chave corresponde ao que o BlueBubbles relata como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para cada grupo sem correspondência exata (o mesmo padrão usado por `requireMention` e políticas de ferramenta por grupo). Correspondências exatas sempre vencem o curinga. DMs ignoram este campo; use personalização de prompt no nível do agente ou da conta em vez disso.

#### Exemplo prático: respostas encadeadas e reações tapback (API privada)

Com a API privada do BlueBubbles habilitada, mensagens recebidas chegam com IDs curtos de mensagem (por exemplo, `[[reply_to:5]]`) e o agente pode chamar `action=reply` para encadear em uma mensagem específica ou `action=react` para adicionar um tapback. Um `systemPrompt` por grupo é uma forma confiável de manter o agente escolhendo a ferramenta certa:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Reações tapback e respostas encadeadas exigem a API privada do BlueBubbles; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para a mecânica subjacente.

## Bindings de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido de operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles são roteadas para a sessão ACP gerada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no lugar.
- `/acp close` fecha a sessão ACP e remove o binding.

Bindings persistentes configurados também são compatíveis por meio de entradas de nível superior `bindings[]` com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino compatível do BlueBubbles:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vínculos de grupo estáveis, prefira `chat_id:*` ou `chat_identifier:*`.

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

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vínculo ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: Enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: Controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: O OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou após tempo limite (a parada manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desativar confirmações de leitura
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
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // desfazer envio de mensagens (macOS 13+)
        reply: true, // encadeamento de respostas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud etc.)
        renameGroup: true, // renomear conversas em grupo
        setGroupIcon: true, // definir ícone/foto da conversa em grupo (instável no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de conversas em grupo
        sendAttachment: true, // enviar anexos/mídia
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ações disponíveis">
    - **react**: Adicionar/remover reações de tapback (`messageId`, `emoji`, `remove`). O conjunto nativo de tapbacks do iMessage é `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando um agente escolhe um emoji fora desse conjunto (por exemplo, `👀`), a ferramenta de reação recorre a `love` para que o tapback ainda seja renderizado em vez de falhar a solicitação inteira. Reações de confirmação configuradas ainda validam de forma estrita e geram erro em valores desconhecidos.
    - **edit**: Editar uma mensagem enviada (`messageId`, `text`).
    - **unsend**: Desfazer o envio de uma mensagem (`messageId`).
    - **reply**: Responder a uma mensagem específica (`messageId`, `text`, `to`).
    - **sendWithEffect**: Enviar com efeito do iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Renomear uma conversa em grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Definir o ícone/foto de uma conversa em grupo (`chatGuid`, `media`) - instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
    - **addParticipant**: Adicionar alguém a um grupo (`chatGuid`, `address`).
    - **removeParticipant**: Remover alguém de um grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sair de uma conversa em grupo (`chatGuid`).
    - **upload-file**: Enviar mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`).
      - Recados de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar recados de voz.
    - Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome de ação canônico.

  </Accordion>
</AccordionGroup>

### IDs de mensagem (curtos vs. completos)

O OpenClaw pode expor IDs de mensagem _curtos_ (por exemplo, `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar ao reiniciar ou por remoção do cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações e armazenamento duráveis:

- Modelos: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuração](/pt-BR/gateway/configuration) para variáveis de modelo.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Agrupamento de DMs de envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos no iMessage - por exemplo, `Dump https://example.com/article` - a Apple divide o envio em **duas entregas de Webhook separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

Os dois webhooks chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem agrupamento, o agente recebe apenas o comando no turno 1, responde (geralmente "envie a URL") e só vê a URL no turno 2 - momento em que o contexto do comando já foi perdido.

`channels.bluebubbles.coalesceSameSenderDms` opta uma DM por mesclar webhooks consecutivos do mesmo remetente em um único turno do agente. Conversas em grupo continuam a usar a chave por mensagem para preservar a estrutura de turnos com vários usuários.

<Tabs>
  <Tab title="Quando habilitar">
    Habilite quando:

    - Você entrega Skills que esperam `command + payload` em uma única mensagem (dump, paste, save, queue etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional do turno de DM (veja abaixo).

    Deixe desabilitado quando:

    - Você precisa de latência mínima de comando para gatilhos de DM de uma só palavra.
    - Todos os seus fluxos são comandos de disparo único sem payloads posteriores.

  </Tab>
  <Tab title="Habilitando">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // optar por habilitar (padrão: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.bluebubbles` explícito, a janela de debounce aumenta para **2500 ms** (o padrão para sem agrupamento é 500 ms). A janela mais ampla é necessária - a cadência de envio dividido da Apple de 0,8-2,0 s não cabe no padrão mais estreito.

    Para ajustar a janela você mesmo:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms funciona para a maioria das configurações; aumente para 4000 ms se o seu Mac estiver lento
            // ou sob pressão de memória (a lacuna observada pode passar de 2 s nesses casos).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latência adicional para comandos de controle por DM.** Com a flag ativada, mensagens de comando de controle por DM (como `Dump`, `Save` etc.) agora aguardam até a janela de debounce antes do despacho, caso um Webhook de payload esteja chegando. Comandos de conversa em grupo mantêm despacho instantâneo.
    - **A saída mesclada é limitada** - o texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira e a mais recente são mantidas além disso). Todo `messageId` de origem ainda chega à deduplicação de entrada, então uma repetição posterior do MessagePoller de qualquer evento individual é reconhecida como duplicata.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

| Usuário compõe                                                     | Apple entrega             | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                         |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (um envio)                              | 2 webhooks com ~1 s de intervalo | Dois turnos do agente: apenas "Dump", depois URL | Um turno: texto mesclado `Dump https://example.com`                      |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 webhooks                | Dois turnos                             | Um turno: texto + imagem                                                 |
| `/status` (comando isolado)                                        | 1 Webhook                 | Despacho instantâneo                    | **Aguarda até a janela e então despacha**                                 |
| URL colada sozinha                                                 | 1 Webhook                 | Despacho instantâneo                    | Despacho instantâneo (apenas uma entrada no bucket)                      |
| Texto + URL enviados como duas mensagens separadas deliberadas, com minutos de intervalo | 2 webhooks fora da janela | Dois turnos                             | Dois turnos (a janela expira entre eles)                                  |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)               | N webhooks                | N turnos                                | Um turno, saída limitada (primeira + mais recente, limites de texto/anexo aplicados) |

### Solução de problemas de agrupamento de envio dividido

Se a flag estiver ativada e envios divididos ainda chegarem como dois turnos, verifique cada camada:

<AccordionGroup>
  <Accordion title="Configuração realmente carregada">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Em seguida, `openclaw gateway restart` - a flag é lida na criação do debouncer-registry.

  </Accordion>
  <Accordion title="Janela de debounce ampla o suficiente para sua configuração">
    Veja o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Meça a lacuna entre o despacho de texto no estilo `"Dump"` e o despacho `"https://..."; Attachments:` que vem em seguida. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir essa lacuna com folga.

  </Accordion>
  <Accordion title="Timestamps de JSONL de sessão ≠ chegada do Webhook">
    Timestamps de eventos de sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o Gateway entrega uma mensagem ao agente, **não** quando o Webhook chegou. Uma segunda mensagem na fila marcada com `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo Webhook chegou - o bucket de agrupamento já tinha sido liberado. Ajuste a janela com base no log do servidor BB, não no log da sessão.
  </Accordion>
  <Accordion title="Pressão de memória retardando o despacho de resposta">
    Em máquinas menores (8 GB), turnos de agente podem demorar o suficiente para que o bucket de agrupamento seja liberado antes de a resposta ser concluída, e a URL entre como um segundo turno na fila. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o Gateway estiver acima de ~500 MB RSS e o compressor estiver ativo, feche outros processos pesados ou mude para um host maior.
  </Accordion>
  <Accordion title="Envios de citação de resposta seguem outro caminho">
    Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão de Dump), a URL fica em `replyToBody`, não em um segundo Webhook. O agrupamento não se aplica - isso é uma questão de skill/prompt, não uma questão de debouncer.
  </Accordion>
</AccordionGroup>

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos de entrada são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- O texto de saída é dividido em blocos conforme `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexão e Webhook">
    - `channels.bluebubbles.enabled`: Habilita/desabilita o canal.
    - `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
    - `channels.bluebubbles.password`: Senha da API.
    - `channels.bluebubbles.webhookPath`: Caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Política de acesso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permissões de DM (identificadores, e-mails, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permissões de remetentes de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: No macOS, opcionalmente enriquece participantes de grupo sem nome a partir dos Contatos locais depois que a filtragem passa. Padrão: `false`.
    - `channels.bluebubbles.groups`: Configuração por grupo (`requireMention` etc.).

  </Accordion>
  <Accordion title="Entrega e fragmentação">
    - `channels.bluebubbles.sendReadReceipts`: Envia confirmações de leitura (padrão: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilita streaming em bloco (padrão: `false`; obrigatório para respostas em streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamanho do fragmento de saída em caracteres (padrão: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tempo limite por solicitação em ms para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações do macOS 26 nas quais envios do iMessage pela Private API podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo, `45000` ou `60000`. Sondagens, buscas de chats, reações, edições e verificações de integridade atualmente mantêm o padrão mais curto de 10s; ampliar a cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (padrão) divide somente ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por comprimento.

  </Accordion>
  <Accordion title="Mídia e histórico">
    - `channels.bluebubbles.mediaMaxMb`: Limite de mídia de entrada/saída em MB (padrão: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios de caminhos locais são negados por padrão, a menos que isto esteja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Mescla Webhooks consecutivos de DM do mesmo remetente em uma única vez do agente, para que o envio dividido de texto+URL da Apple chegue como uma única mensagem (padrão: `false`). Consulte [Combinar DMs de envio dividido](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e compensações. Amplia a janela padrão de debounce de entrada de 500 ms para 2500 ms quando habilitado sem um `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensagens de grupo para contexto (0 desabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Limite de histórico de DM.
    - `channels.bluebubbles.replyContextApiFallback`: Quando uma resposta de entrada chega sem `replyToBody`/`replyToSender` e o cache em memória de contexto de resposta não acerta, busca a mensagem original na API HTTP do BlueBubbles como fallback de melhor esforço (padrão: `false`). Útil para implantações multi-instância que compartilham uma conta do BlueBubbles, após reinicializações do processo ou após despejo de cache TTL/LRU de longa duração. A busca é protegida contra SSRF pela mesma política de todas as outras solicitações do cliente BlueBubbles, nunca lança erro e preenche o cache para amortizar respostas subsequentes. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Uma configuração no nível do canal se propaga para contas que omitem a flag.

  </Accordion>
  <Accordion title="Ações e contas">
    - `channels.bluebubbles.actions`: Habilita/desabilita ações específicas.
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
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isto exige que a Private API do BlueBubbles esteja habilitada.

### Roteamento iMessage vs SMS

Quando o mesmo identificador tem tanto um chat do iMessage quanto um chat SMS no Mac (por exemplo, um número de telefone registrado no iMessage que também recebeu fallbacks de balão verde), o OpenClaw prefere o chat do iMessage e nunca rebaixa silenciosamente para SMS. Para forçar o chat SMS, use um prefixo de destino `sms:` explícito (por exemplo, `sms:+15555550123`). Identificadores sem um chat do iMessage correspondente ainda enviam por qualquer chat que o BlueBubbles informar.

## Segurança

- Solicitações de Webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você encaminhar tráfego de Webhook por proxy, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Segurança do Gateway](/pt-BR/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se o expuser fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme se o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); certifique-se de que a versão do servidor a exponha.
- Editar/desfazer envio exige macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), a edição está atualmente quebrada devido a mudanças na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações conhecidamente quebradas com base na versão de macOS do servidor BlueBubbles. Se a edição ainda aparecer no macOS 26 (Tahoe), desabilite-a manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, mas envios divididos (por exemplo, `Dump` + URL) ainda chegam como duas vezes: consulte a lista de verificação de [solução de problemas de combinação de envios divididos](#split-send-coalescing-troubleshooting) - causas comuns são uma janela de debounce curta demais, timestamps do log de sessão interpretados incorretamente como chegada de Webhook ou um envio com citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Canais](/pt-BR/channels) e o guia de [Plugins](/pt-BR/tools/plugin).

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e filtragem por menção
- [Pareamento](/pt-BR/channels/pairing) - autenticação de DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
