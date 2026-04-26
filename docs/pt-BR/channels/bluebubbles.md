---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de pareamento do Webhook
    - Configurando o iMessage no macOS
sidebarTitle: BlueBubbles
summary: iMessage via servidor macOS BlueBubbles (envio/recebimento por REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: Plugin incluído que se comunica com o servidor macOS BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à API mais rica e à configuração mais simples em comparação com o canal imsg legado.

<Note>
As versões atuais do OpenClaw incluem o BlueBubbles, então builds empacotadas normais não precisam de uma etapa separada de `openclaw plugins install`.
</Note>

## Visão geral

- É executado no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). O macOS Tahoe (26) funciona; a edição está quebrada no momento no Tahoe, e atualizações do ícone do grupo podem reportar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio da API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- As mensagens recebidas chegam por Webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e apresentados ao agente quando possível).
- Respostas automáticas de TTS que sintetizam áudio MP3 ou CAF são entregues como bolhas de memo de voz do iMessage em vez de anexos de arquivo simples.
- Pareamento/lista de permissões funciona da mesma forma que em outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são apresentadas como eventos de sistema, assim como no Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, respostas encadeadas, efeitos de mensagem, gerenciamento de grupo.

## Início rápido

<Steps>
  <Step title="Instalar o BlueBubbles">
    Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Ativar a API web">
    Na configuração do BlueBubbles, ative a API web e defina uma senha.
  </Step>
  <Step title="Configurar o OpenClaw">
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
  <Step title="Apontar os Webhooks para o Gateway">
    Aponte os Webhooks do BlueBubbles para o seu Gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Iniciar o Gateway">
    Inicie o Gateway; ele registrará o manipulador de Webhook e iniciará o pareamento.
  </Step>
</Steps>

<Warning>
**Segurança**

- Sempre defina uma senha para o Webhook.
- A autenticação do Webhook é sempre obrigatória. O OpenClaw rejeita requisições de Webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo, `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar corpos completos de Webhook.
  </Warning>

## Mantendo o Messages.app ativo (configurações de VM / headless)

Algumas configurações de VM do macOS / sempre ativas podem acabar com o Messages.app ficando "ocioso" (eventos recebidos param até que o app seja aberto/trazido para o primeiro plano). Uma solução simples é **acionar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

<Steps>
  <Step title="Salvar o AppleScript">
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
  <Step title="Instalar um LaunchAgent">
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

    Isso é executado **a cada 300 segundos** e **ao fazer login**. A primeira execução pode disparar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

  </Step>
  <Step title="Carregá-lo">
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

<ParamField path="URL do servidor" type="string" required>
  Endereço do servidor BlueBubbles (por exemplo, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Senha" type="string" required>
  Senha da API das configurações do BlueBubbles Server.
</ParamField>
<ParamField path="Caminho do Webhook" type="string" default="/bluebubbles-webhook">
  Caminho do endpoint do Webhook.
</ParamField>
<ParamField path="Política de DM" type="string">
  `pairing`, `allowlist`, `open` ou `disabled`.
</ParamField>
<ParamField path="Lista de permissões" type="string[]">
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
    - Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até serem aprovadas (os códigos expiram após 1 hora).
    - Aprovar via:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - O pareamento é a troca de token padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)
  </Tab>
  <Tab title="Grupos">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.
  </Tab>
</Tabs>

### Enriquecimento de nomes de contato (macOS, opcional)

Webhooks de grupo do BlueBubbles frequentemente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, é possível ativar o enriquecimento local via Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` ativa a busca. Padrão: `false`.
- As buscas são executadas somente depois que o acesso ao grupo, a autorização de comando e o bloqueio por menção permitirem a passagem da mensagem.
- Apenas participantes de telefone sem nome são enriquecidos.
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

### Bloqueio por menção (grupos)

O BlueBubbles oferece suporte a bloqueio por menção para chats em grupo, correspondendo ao comportamento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está ativado para um grupo, o agente só responde quando é mencionado.
- Comandos de controle de remetentes autorizados ignoram o bloqueio por menção.

Configuração por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // padrão para todos os grupos
        "iMessage;-;chat123": { requireMention: false }, // substituição para grupo específico
      },
    },
  },
}
```

### Bloqueio de comandos

- Comandos de controle (por exemplo, `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

### Prompt de sistema por grupo

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string `systemPrompt` opcional. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem nesse grupo, para que você possa definir regras de persona ou comportamento por grupo sem editar prompts do agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantenha as respostas com menos de 3 frases. Espelhe o tom casual do grupo.",
        },
      },
    },
  },
}
```

A chave corresponde ao que o BlueBubbles reporta como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem correspondência exata (mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre têm prioridade sobre o curinga. DMs ignoram esse campo; use personalização de prompt no nível do agente ou da conta.

#### Exemplo prático: respostas encadeadas e reações tapback (Private API)

Com a Private API do BlueBubbles ativada, mensagens recebidas chegam com IDs curtos de mensagem (por exemplo, `[[reply_to:5]]`) e o agente pode chamar `action=reply` para encadear em uma mensagem específica ou `action=react` para adicionar um tapback. Um `systemPrompt` por grupo é uma forma confiável de fazer o agente escolher a ferramenta correta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Ao responder neste grupo, sempre chame action=reply com o",
            "messageId [[reply_to:N]] do contexto para que sua resposta fique encadeada",
            "sob a mensagem que acionou a resposta. Nunca envie uma nova mensagem sem vínculo.",
            "",
            "Para reconhecimentos curtos ('ok', 'entendi', 'estou cuidando disso'), use",
            "action=react com um emoji de tapback apropriado (❤️, 👍, 😂, ‼️, ❓)",
            "em vez de enviar uma resposta em texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reações tapback e respostas encadeadas exigem a Private API do BlueBubbles; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para a mecânica subjacente.

## Vinculações de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles serão roteadas para a sessão ACP iniciada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer formato de destino BlueBubbles compatível:

- identificador normalizado de DM como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculações estáveis de grupo, prefira `chat_id:*` ou `chat_identifier:*`.

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
      sendReadReceipts: false, // desabilitar confirmações de leitura
    },
  },
}
```

## Ações avançadas

O BlueBubbles oferece suporte a ações avançadas de mensagem quando ativadas na configuração:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // respostas encadeadas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud etc.)
        renameGroup: true, // renomear chats em grupo
        setGroupIcon: true, // definir ícone/foto do chat em grupo (instável no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de chats em grupo
        sendAttachment: true, // enviar anexos/mídia
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ações disponíveis">
    - **react**: Adiciona/remove reações tapback (`messageId`, `emoji`, `remove`). O conjunto nativo de tapbacks do iMessage é `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando um agente escolhe um emoji fora desse conjunto (por exemplo `👀`), a ferramenta de reação usa `love` como fallback para que o tapback ainda seja renderizado em vez de fazer a solicitação inteira falhar. Reações de confirmação configuradas ainda são validadas estritamente e retornam erro em valores desconhecidos.
    - **edit**: Edita uma mensagem enviada (`messageId`, `text`).
    - **unsend**: Cancela o envio de uma mensagem (`messageId`).
    - **reply**: Responde a uma mensagem específica (`messageId`, `text`, `to`).
    - **sendWithEffect**: Envia com efeito do iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Renomeia um chat em grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Define o ícone/foto de um chat em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
    - **addParticipant**: Adiciona alguém a um grupo (`chatGuid`, `address`).
    - **removeParticipant**: Remove alguém de um grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sai de um chat em grupo (`chatGuid`).
    - **upload-file**: Envia mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`).
      - Memos de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como uma mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar memos de voz.
    - Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.
  </Accordion>
</AccordionGroup>

### IDs de mensagem (curtos vs. completos)

O OpenClaw pode expor IDs de mensagem _curtos_ (por exemplo, `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar após reinicialização ou remoção do cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos retornarão erro se não estiverem mais disponíveis.

Use IDs completos para automações duráveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuração](/pt-BR/gateway/configuration) para variáveis de template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescência de DMs com envio dividido (comando + URL em uma única composição)

Quando um usuário digita um comando e uma URL juntos no iMessage — por exemplo `Dump https://example.com/article` — a Apple divide o envio em **duas entregas de Webhook separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

Os dois Webhooks chegam ao OpenClaw com cerca de ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (muitas vezes "me envie a URL"), e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido.

`channels.bluebubbles.coalesceSameSenderDms` habilita em uma DM a mesclagem de Webhooks consecutivos do mesmo remetente em um único turno do agente. Chats em grupo continuam sendo indexados por mensagem, para que a estrutura de turnos multiusuário seja preservada.

<Tabs>
  <Tab title="Quando ativar">
    Ative quando:

    - Você disponibiliza Skills que esperam `comando + payload` em uma única mensagem (dump, paste, save, queue etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional no turno de DM (veja abaixo).

    Deixe desativado quando:

    - Você precisa da menor latência possível de comando para gatilhos de DM com uma única palavra.
    - Todos os seus fluxos são comandos de disparo único sem payloads subsequentes.

  </Tab>
  <Tab title="Ativando">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // ativar (padrão: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.bluebubbles` explícito, a janela de debounce é ampliada para **2500 ms** (o padrão sem coalescência é 500 ms). A janela mais ampla é necessária — a cadência de envio dividido da Apple de 0,8-2,0 s não cabe no padrão mais apertado.

    Para ajustar a janela manualmente:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms funciona para a maioria das configurações; aumente para 4000 ms se o seu Mac for lento
            // ou estiver sob pressão de memória (a diferença observada pode então passar de 2 s).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latência adicional para comandos de controle em DM.** Com a flag ativada, mensagens de comando de controle em DM (como `Dump`, `Save` etc.) agora esperam até a janela de debounce antes do envio, caso um Webhook de payload esteja a caminho. Comandos em chats de grupo continuam com envio imediato.
    - **A saída mesclada é limitada** — o texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira e a mais recente são mantidas além disso). Cada `messageId` de origem ainda chega à deduplicação de entrada, para que uma repetição posterior do MessagePoller de qualquer evento individual seja reconhecida como duplicada.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.
  </Tab>
</Tabs>

### Cenários e o que o agente vê

| O usuário compõe                                                   | A Apple entrega          | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                       |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 Webhooks com ~1 s      | Dois turnos do agente: "Dump" sozinho, depois a URL | Um turno: texto mesclado `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 Webhooks               | Dois turnos                             | Um turno: texto + imagem                                               |
| `/status` (comando independente)                                   | 1 Webhook                | Envio imediato                          | **Espera até a janela, depois envia**                                  |
| URL colada sozinha                                                 | 1 Webhook                | Envio imediato                          | Envio imediato (apenas uma entrada no bucket)                          |
| Texto + URL enviados como duas mensagens separadas deliberadamente, com minutos de diferença | 2 Webhooks fora da janela | Dois turnos                             | Dois turnos (a janela expira entre eles)                               |
| Fluxo rápido (>10 DMs pequenas dentro da janela)                   | N Webhooks               | N turnos                                | Um turno, saída limitada (primeira + mais recente, com limites de texto/anexo aplicados) |

### Solução de problemas de coalescência de envio dividido

Se a flag estiver ativada e envios divididos ainda chegarem como dois turnos, verifique cada camada:

<AccordionGroup>
  <Accordion title="Configuração realmente carregada">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Depois execute `openclaw gateway restart` — a flag é lida na criação do registro de debouncer.

  </Accordion>
  <Accordion title="Janela de debounce ampla o suficiente para a sua configuração">
    Veja o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Meça a diferença entre o envio do texto no estilo `"Dump"` e o envio seguinte de `"https://..."; Attachments:`. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir essa diferença com folga.

  </Accordion>
  <Accordion title="Timestamps de JSONL da sessão ≠ chegada do Webhook">
    Timestamps de eventos da sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o Gateway entrega uma mensagem ao agente, **não** quando o Webhook chegou. Uma segunda mensagem enfileirada marcada com `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo Webhook chegou — o bucket de coalescência já havia sido descarregado. Ajuste a janela com base no log do servidor BB, não no log da sessão.
  </Accordion>
  <Accordion title="Pressão de memória atrasando o envio da resposta">
    Em máquinas menores (8 GB), turnos do agente podem demorar o suficiente para que o bucket de coalescência seja descarregado antes de a resposta terminar, e a URL acabe em um segundo turno enfileirado. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o Gateway estiver acima de ~500 MB de RSS e o compressor estiver ativo, feche outros processos pesados ou migre para um host maior.
  </Accordion>
  <Accordion title="Envios com citação de resposta seguem um caminho diferente">
    Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão Dump), a URL fica em `replyToBody`, não em um segundo Webhook. A coalescência não se aplica — isso é uma questão de Skill/prompt, não de debouncer.
  </Accordion>
</AccordionGroup>

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ativar streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos de entrada são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- O texto de saída é dividido em partes conforme `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexão e Webhook">
    - `channels.bluebubbles.enabled`: Ativa/desativa o canal.
    - `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
    - `channels.bluebubbles.password`: Senha da API.
    - `channels.bluebubbles.webhookPath`: Caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="Política de acesso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permissões de DM (identificadores, emails, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permissões de remetentes em grupos.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: No macOS, enriquece opcionalmente participantes sem nome em grupos a partir dos Contatos locais após a validação passar. Padrão: `false`.
    - `channels.bluebubbles.groups`: Configuração por grupo (`requireMention` etc.).
  </Accordion>
  <Accordion title="Entrega e fragmentação">
    - `channels.bluebubbles.sendReadReceipts`: Envia confirmações de leitura (padrão: `true`).
    - `channels.bluebubbles.blockStreaming`: Ativa streaming em blocos (padrão: `false`; necessário para respostas em streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamanho do fragmento de saída em caracteres (padrão: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout por requisição em ms para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações com macOS 26 em que envios de iMessage pela Private API possam travar por mais de 60 segundos dentro do framework do iMessage; por exemplo `45000` ou `60000`. Probes, buscas de chat, reações, edições e verificações de integridade atualmente mantêm o padrão mais curto de 10 s; ampliar a cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas quando ultrapassa `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por tamanho.
  </Accordion>
  <Accordion title="Mídia e histórico">
    - `channels.bluebubbles.mediaMaxMb`: Limite de mídia de entrada/saída em MB (padrão: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista explícita de permissões de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios por caminho local são negados por padrão, a menos que isso seja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Mescla Webhooks consecutivos de DM do mesmo remetente em um único turno do agente para que o envio dividido de texto+URL da Apple chegue como uma única mensagem (padrão: `false`). Consulte [Coalescência de DMs com envio dividido](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e trade-offs. Amplia a janela padrão de debounce de entrada de 500 ms para 2500 ms quando ativado sem um `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensagens de grupo para contexto (0 desativa).
    - `channels.bluebubbles.dmHistoryLimit`: Limite de histórico de DM.
  </Accordion>
  <Accordion title="Ações e contas">
    - `channels.bluebubbles.actions`: Ativa/desativa ações específicas.
    - `channels.bluebubbles.accounts`: Configuração de múltiplas contas.
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
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a Private API do BlueBubbles esteja ativada.

### Roteamento iMessage vs SMS

Quando o mesmo identificador tem tanto um chat de iMessage quanto um chat de SMS no Mac (por exemplo, um número de telefone registrado no iMessage, mas que também recebeu fallbacks de balão verde), o OpenClaw prefere o chat de iMessage e nunca faz downgrade silencioso para SMS. Para forçar o chat de SMS, use um prefixo de destino `sms:` explícito (por exemplo `sms:+15555550123`). Identificadores sem um chat de iMessage correspondente ainda enviam pelo chat que o BlueBubbles reportar.

## Segurança

- Requisições de Webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você fizer proxy do tráfego de Webhook, mantenha a senha do BlueBubbles na requisição de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Segurança do Gateway](/pt-BR/gateway/security#reverse-proxy-configuration).
- Ative HTTPS + regras de firewall no servidor BlueBubbles se for expô-lo fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme se o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a Private API do BlueBubbles (`POST /api/v1/message/react`); verifique se a versão do servidor a expõe.
- Editar/cancelar envio exige macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), editar está quebrado no momento devido a mudanças na Private API.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se editar ainda aparecer no macOS 26 (Tahoe), desative manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ativado, mas envios divididos (por exemplo `Dump` + URL) ainda chegam como dois turnos: consulte a lista de verificação de [solução de problemas de coalescência de envio dividido](#split-send-coalescing-troubleshooting) — causas comuns são janela de debounce muito curta, timestamps do log de sessão interpretados incorretamente como chegada do Webhook, ou um envio com citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Canais](/pt-BR/channels) e o guia [Plugins](/pt-BR/tools/plugin).

## Relacionado

- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e bloqueio por menção
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção adicional
