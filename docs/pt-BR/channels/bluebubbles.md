---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de emparelhamento de Webhook
    - Configurando o iMessage no macOS
summary: iMessage via servidor macOS BlueBubbles (envio/recebimento REST, digitação, reações, emparelhamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T13:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST no macOS)

Status: Plugin integrado que se comunica com o servidor macOS BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à sua API mais rica e configuração mais simples em comparação com o canal imsg legado.

## Plugin integrado

As versões atuais do OpenClaw incluem o BlueBubbles, então builds empacotadas normais não
precisam de uma etapa separada de `openclaw plugins install`.

## Visão geral

- É executado no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). O macOS Tahoe (26) funciona; editar está atualmente quebrado no Tahoe, e atualizações de ícone de grupo podem informar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio de sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- As mensagens recebidas chegam via Webhook; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia recebida (e apresentados ao agente quando possível).
- Emparelhamento/lista de permissões funciona da mesma forma que em outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de emparelhamento.
- Reações são apresentadas como eventos de sistema, assim como no Slack/Telegram, para que os agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, respostas em thread, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

1. Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuração do BlueBubbles, habilite a API web e defina uma senha.
3. Execute `openclaw onboard` e selecione BlueBubbles, ou configure manualmente:

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

4. Aponte os webhooks do BlueBubbles para o seu Gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicie o Gateway; ele registrará o manipulador de Webhook e iniciará o emparelhamento.

Observação de segurança:

- Sempre defina uma senha de Webhook.
- A autenticação do Webhook é sempre obrigatória. O OpenClaw rejeita solicitações de Webhook do BlueBubbles, a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar corpos completos de Webhook.

## Mantendo o Messages.app ativo (VM / configurações headless)

Algumas configurações de VM macOS / sempre ativas podem acabar com o Messages.app entrando em “idle” (os eventos recebidos param até que o app seja aberto/trazido para o primeiro plano). Uma solução simples é **acionar o Messages a cada 5 minutos** usando AppleScript + LaunchAgent.

### 1) Salve o AppleScript

Salve isto como:

- `~/Scripts/poke-messages.scpt`

Script de exemplo (não interativo; não rouba o foco):

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

### 2) Instale um LaunchAgent

Salve isto como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

Observações:

- Isso é executado **a cada 300 segundos** e **ao iniciar sessão**.
- A primeira execução pode acionar avisos do macOS de **Automação** (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

Carregue-o:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

O BlueBubbles está disponível no onboarding interativo:

```
openclaw onboard
```

O assistente solicita:

- **URL do servidor** (obrigatório): endereço do servidor BlueBubbles (ex.: `http://192.168.1.100:1234`)
- **Senha** (obrigatório): senha da API nas configurações do BlueBubbles Server
- **Caminho do Webhook** (opcional): o padrão é `/bluebubbles-webhook`
- **Política de DM**: pairing, allowlist, open ou disabled
- **Lista de permissões**: números de telefone, e-mails ou destinos de chat

Você também pode adicionar BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de emparelhamento; as mensagens são ignoradas até aprovação (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- O emparelhamento é a troca de token padrão. Detalhes: [Emparelhamento](/pt-BR/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

### Enriquecimento de nomes de contato (macOS, opcional)

Webhooks de grupos do BlueBubbles frequentemente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, é possível habilitar o enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita a consulta. Padrão: `false`.
- As consultas são executadas somente depois que acesso ao grupo, autorização de comando e bloqueio por menção permitirem a passagem da mensagem.
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

### Bloqueio por menção (grupos)

BlueBubbles oferece suporte a bloqueio por menção para chats em grupo, acompanhando o comportamento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está habilitado para um grupo, o agente só responde quando é mencionado.
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
        "iMessage;-;chat123": { requireMention: false }, // substitui para grupo específico
      },
    },
  },
}
```

### Bloqueio de comandos

- Comandos de controle (ex.: `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

### Prompt de sistema por grupo

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem naquele grupo, para que você possa definir regras de persona ou comportamento por grupo sem editar os prompts do agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantenha as respostas com menos de 3 frases. Reflita o tom casual do grupo.",
        },
      },
    },
  },
}
```

A chave corresponde ao que o BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem correspondência exata (o mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre têm prioridade sobre o curinga. DMs ignoram esse campo; use personalização de prompt no nível do agente ou da conta.

#### Exemplo prático: respostas em thread e reações tapback (Private API)

Com a BlueBubbles Private API habilitada, mensagens recebidas chegam com IDs curtos de mensagem (por exemplo `[[reply_to:5]]`) e o agente pode chamar `action=reply` para responder em thread a uma mensagem específica ou `action=react` para adicionar um tapback. Um `systemPrompt` por grupo é uma forma confiável de manter o agente escolhendo a ferramenta correta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Ao responder neste grupo, sempre chame action=reply com o",
            "messageId [[reply_to:N]] do contexto para que sua resposta fique em thread",
            "sob a mensagem que a acionou. Nunca envie uma nova mensagem sem vínculo.",
            "",
            "Para reconhecimentos curtos ('ok', 'entendi', 'resolvo isso'), use",
            "action=react com um emoji tapback apropriado (❤️, 👍, 😂, ‼️, ❓)",
            "em vez de enviar uma resposta em texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reações tapback e respostas em thread exigem a BlueBubbles Private API; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para a mecânica subjacente.

## Vinculações de conversa ACP

Chats do BlueBubbles podem ser transformados em espaços de trabalho ACP duráveis sem alterar a camada de transporte.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles serão roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas também são suportadas por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino BlueBubbles suportada:

- identificador DM normalizado, como `+15555550123` ou `user@example.com`
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

- **Indicadores de digitação**: enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: o OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou ao expirar o tempo limite (a interrupção manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desabilita confirmações de leitura
    },
  },
}
```

## Ações avançadas

BlueBubbles oferece suporte a ações avançadas de mensagem quando habilitadas na configuração:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // respostas em thread por GUID da mensagem
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

Ações disponíveis:

- **react**: adiciona/remove reações tapback (`messageId`, `emoji`, `remove`). O conjunto nativo de tapbacks do iMessage é `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando um agente escolhe um emoji fora desse conjunto (por exemplo `👀`), a ferramenta de reação usa `love` como fallback para que o tapback ainda seja renderizado em vez de falhar toda a solicitação. Reações de confirmação configuradas ainda validam estritamente e retornam erro para valores desconhecidos.
- **edit**: edita uma mensagem enviada (`messageId`, `text`)
- **unsend**: cancela o envio de uma mensagem (`messageId`)
- **reply**: responde a uma mensagem específica (`messageId`, `text`, `to`)
- **sendWithEffect**: envia com efeito do iMessage (`text`, `to`, `effectId`)
- **renameGroup**: renomeia um chat em grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: define o ícone/foto de um chat em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
- **addParticipant**: adiciona alguém a um grupo (`chatGuid`, `address`)
- **removeParticipant**: remove alguém de um grupo (`chatGuid`, `address`)
- **leaveGroup**: sai de um chat em grupo (`chatGuid`)
- **upload-file**: envia mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`)
  - Memorandos de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como uma mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar memorandos de voz.
- Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.

### IDs de mensagem (curto vs. completo)

O OpenClaw pode expor IDs de mensagem _curtos_ (ex.: `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; podem expirar após reinício ou remoção do cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos retornarão erro se não estiverem mais disponíveis.

Use IDs completos para automações duráveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads recebidos

Consulte [Configuração](/pt-BR/gateway/configuration) para variáveis de template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescência de DMs com envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos no iMessage — por exemplo `Dump https://example.com/article` — a Apple divide o envio em **duas entregas de Webhook separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

Os dois Webhooks chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (frequentemente "me envie a URL"), e só vê a URL no turno 2 — momento em que o contexto do comando já se perdeu.

`channels.bluebubbles.coalesceSameSenderDms` faz com que uma DM opte por mesclar Webhooks consecutivos do mesmo remetente em um único turno do agente. Chats em grupo continuam usando chave por mensagem para que a estrutura de turnos com vários usuários seja preservada.

### Quando habilitar

Habilite quando:

- Você disponibiliza Skills que esperam `comando + payload` em uma única mensagem (dump, paste, save, queue etc.).
- Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
- Você pode aceitar a latência adicional de turno em DMs (veja abaixo).

Deixe desabilitado quando:

- Você precisa da menor latência possível de comando para gatilhos DM de uma única palavra.
- Todos os seus fluxos são comandos one-shot sem payloads subsequentes.

### Habilitando

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // habilita explicitamente (padrão: false)
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
        // ou estiver sob pressão de memória (a lacuna observada pode ultrapassar 2 s nesse caso).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Trade-offs

- **Latência adicional para comandos de controle em DMs.** Com a flag ativada, mensagens de comando de controle em DM (como `Dump`, `Save` etc.) agora esperam até a janela de debounce antes do envio, caso um Webhook de payload esteja chegando. Comandos em chats de grupo continuam com envio imediato.
- **A saída mesclada é limitada** — o texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira mais a mais recente são mantidas além disso). Cada `messageId` de origem ainda chega ao inbound-dedupe, para que uma reprodução posterior do MessagePoller de qualquer evento individual seja reconhecida como duplicata.
- **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.

### Cenários e o que o agente vê

| O usuário compõe                                                   | A Apple entrega          | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                      |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 Webhooks com ~1 s      | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 Webhooks               | Dois turnos                             | Um turno: texto + imagem                                              |
| `/status` (comando independente)                                   | 1 Webhook                | Envio imediato                          | **Espera até a janela, depois envia**                                 |
| URL colada sozinha                                                 | 1 Webhook                | Envio imediato                          | Envio imediato (apenas uma entrada no bucket)                         |
| Texto + URL enviados como duas mensagens separadas de propósito, com minutos de diferença | 2 Webhooks fora da janela | Dois turnos                             | Dois turnos (a janela expira entre eles)                              |
| Fluxo rápido (>10 DMs pequenas dentro da janela)                   | N Webhooks               | N turnos                                | Um turno, saída limitada (primeira + mais recente, com limites de texto/anexos aplicados) |

### Solução de problemas da coalescência de envio dividido

Se a flag estiver ativada e envios divididos ainda chegarem como dois turnos, verifique cada camada:

1. **A configuração foi realmente carregada.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Em seguida, `openclaw gateway restart` — a flag é lida na criação do registro de debouncer.

2. **A janela de debounce é ampla o suficiente para a sua configuração.** Veja o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Meça a diferença entre o envio do texto no estilo `"Dump"` e o envio seguinte de `"https://..."; Attachments:`. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir essa diferença com folga.

3. **Timestamps JSONL de sessão ≠ chegada do Webhook.** Timestamps de eventos de sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o Gateway entrega uma mensagem ao agente, **não** quando o Webhook chegou. Uma segunda mensagem enfileirada marcada com `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo Webhook chegou — o bucket de coalescência já havia sido descarregado. Ajuste a janela com base no log do servidor BB, não no log de sessão.

4. **Pressão de memória atrasando o envio da resposta.** Em máquinas menores (8 GB), os turnos do agente podem levar tempo suficiente para que o bucket de coalescência seja descarregado antes que a resposta seja concluída, e a URL acabe como um segundo turno enfileirado. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o Gateway estiver acima de ~500 MB de RSS e o compressor estiver ativo, feche outros processos pesados ou use um host maior.

5. **Envios com citação de resposta seguem um caminho diferente.** Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão Dump), a URL fica em `replyToBody`, não em um segundo Webhook. A coalescência não se aplica — isso é uma questão de Skill/prompt, não do debouncer.

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilita streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos recebidos são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia recebida e enviada (padrão: 8 MB).
- Texto enviado é dividido em blocos de `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.bluebubbles.enabled`: habilita/desabilita o canal.
- `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
- `channels.bluebubbles.password`: senha da API.
- `channels.bluebubbles.webhookPath`: caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permissões de DM (identificadores, e-mails, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permissões de remetentes em grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: no macOS, enriquece opcionalmente participantes sem nome em grupos com dados dos Contatos locais após a validação. Padrão: `false`.
- `channels.bluebubbles.groups`: configuração por grupo (`requireMention` etc.).
- `channels.bluebubbles.sendReadReceipts`: envia confirmações de leitura (padrão: `true`).
- `channels.bluebubbles.blockStreaming`: habilita streaming em blocos (padrão: `false`; necessário para respostas em streaming).
- `channels.bluebubbles.textChunkLimit`: tamanho do bloco de saída em caracteres (padrão: 4000).
- `channels.bluebubbles.sendTimeoutMs`: tempo limite por solicitação, em ms, para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações com macOS 26 em que envios de iMessage pela Private API podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo `45000` ou `60000`. Sondagens, buscas de chat, reações, edições e verificações de integridade atualmente mantêm o padrão mais curto de 10s; ampliar essa cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.bluebubbles.mediaMaxMb`: limite de mídia de entrada/saída em MB (padrão: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Por padrão, envios por caminho local são negados, a menos que isso esteja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: mescla Webhooks consecutivos de DM do mesmo remetente em um único turno do agente para que o envio dividido de texto + URL da Apple chegue como uma única mensagem (padrão: `false`). Consulte [Coalescência de DMs com envio dividido](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e trade-offs. Amplia a janela de debounce de entrada padrão de 500 ms para 2500 ms quando habilitado sem um `messages.inbound.byChannel.bluebubbles` explícito.
- `channels.bluebubbles.historyLimit`: máximo de mensagens de grupo para contexto (0 desabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite de histórico de DM.
- `channels.bluebubbles.actions`: habilita/desabilita ações específicas.
- `channels.bluebubbles.accounts`: configuração de múltiplas contas.

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Endereçamento / destinos de entrega

Prefira `chat_guid` para roteamento estável:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores diretos: `+15555550123`, `user@example.com`
  - Se um identificador direto não tiver um chat DM existente, o OpenClaw criará um por meio de `POST /api/v1/chat/new`. Isso exige que a BlueBubbles Private API esteja habilitada.

### Roteamento iMessage vs SMS

Quando o mesmo identificador tem tanto um chat iMessage quanto um chat SMS no Mac (por exemplo um número de telefone registrado no iMessage, mas que também recebeu fallback de balão verde), o OpenClaw prefere o chat iMessage e nunca faz downgrade silencioso para SMS. Para forçar o chat SMS, use um prefixo de destino `sms:` explícito (por exemplo `sms:+15555550123`). Identificadores sem um chat iMessage correspondente ainda enviam pela modalidade de chat que o BlueBubbles informar.

## Segurança

- Solicitações de Webhook são autenticadas comparando query params ou headers `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você fizer proxy do tráfego de Webhook, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Segurança do Gateway](/pt-BR/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se ele estiver exposto fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme que o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de emparelhamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a BlueBubbles private API (`POST /api/v1/message/react`); confirme que a versão do servidor a expõe.
- Editar/cancelar envio exige macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), editar está atualmente quebrado devido a mudanças na private API.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações conhecidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se editar ainda aparecer no macOS 26 (Tahoe), desabilite manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, mas envios divididos (ex.: `Dump` + URL) ainda chegam como dois turnos: consulte a checklist de [solução de problemas da coalescência de envio dividido](#split-send-coalescing-troubleshooting) — causas comuns são janela de debounce muito curta, timestamps do log de sessão interpretados incorretamente como chegada do Webhook, ou um envio com citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Canais](/pt-BR/channels) e o guia [Plugins](/pt-BR/tools/plugin).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
