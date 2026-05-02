---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal do WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia a(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal de dev + checkout git: usa por padrão o caminho do Plugin local.
- Stable/Beta: usa o pacote npm `@openclaw/whatsapp` na tag oficial de
  lançamento atual.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

Use o pacote sem versão para acompanhar a tag oficial de lançamento atual. Fixe uma
versão exata apenas quando precisar de uma instalação reproduzível.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Para uma conta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para anexar um diretório de autenticação existente/personalizado do WhatsApp Web antes do login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    As solicitações de pareamento expiram após 1 hora. As solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
A OpenClaw recomenda executar o WhatsApp em um número separado quando possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são suportadas.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Este é o modo operacional mais limpo:

    - identidade do WhatsApp separada para a OpenClaw
    - allowlists de DM e limites de roteamento mais claros
    - menor chance de confusão com conversas consigo mesmo

    Padrão mínimo de política:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    O onboarding oferece suporte ao modo de número pessoal e grava uma base compatível com conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de conversa consigo mesmo usam o número próprio vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    O canal da plataforma de mensagens é baseado no WhatsApp Web (`Baileys`) na arquitetura atual de canais da OpenClaw.

    Não há um canal separado de mensagens do Twilio WhatsApp no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway gerencia o socket do WhatsApp e o loop de reconexão.
- O watchdog de reconexão usa a atividade de transporte do WhatsApp Web, não apenas o volume de mensagens de aplicativo recebidas, então uma sessão silenciosa de dispositivo vinculado não é reiniciada apenas porque ninguém enviou uma mensagem recentemente. Um limite mais longo de silêncio da aplicação ainda força uma reconexão se frames de transporte continuarem chegando, mas nenhuma mensagem de aplicação for processada durante a janela do watchdog; após uma reconexão transitória para uma sessão recentemente ativa, essa verificação de silêncio da aplicação usa o timeout normal de mensagens para a primeira janela de recuperação.
- Os tempos do socket Baileys são explícitos em `web.whatsapp.*`: `keepAliveIntervalMs` controla os pings de aplicação do WhatsApp Web, `connectTimeoutMs` controla o timeout do handshake de abertura, e `defaultQueryTimeoutMs` controla os timeouts de consulta do Baileys.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- O watchdog de reconexão acompanha a atividade de transporte do WhatsApp Web, não apenas o volume de mensagens de aplicativo recebidas: sessões silenciosas de dispositivos vinculados continuam ativas enquanto frames de transporte continuam, mas uma parada no transporte força a reconexão bem antes do caminho posterior de desconexão remota.
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` consolida DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- Canais/Newsletters do WhatsApp podem ser destinos explícitos de saída com seu JID nativo `@newsletter`. Envios de newsletter de saída usam metadados de sessão de canal (`agent:<agentId>:whatsapp:channel:<jid>`) em vez de semântica de sessão de DM.
- O transporte do WhatsApp Web respeita variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy no nível do host em vez de configurações de proxy específicas do canal WhatsApp.
- Quando `messages.removeAckAfterReply` está habilitado, a OpenClaw limpa a reação de confirmação do WhatsApp depois que uma resposta visível é entregue.

## Hooks de Plugin e privacidade

Mensagens recebidas do WhatsApp podem conter conteúdo pessoal de mensagens, números de telefone,
identificadores de grupo, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads de hook `message_received` recebidos para Plugins
a menos que você opte explicitamente por isso:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Você pode limitar a adesão a uma conta:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Habilite isso apenas para Plugins nos quais você confia para receber conteúdo
e identificadores de mensagens recebidas do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números em estilo E.164 (normalizados internamente).

    `allowFrom` é uma lista de controle de acesso de remetentes de DM. Ela não bloqueia envios explícitos de saída para JIDs de grupo do WhatsApp ou JIDs de canal `@newsletter`.

    Substituição de múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) tem precedência sobre os padrões no nível do canal para essa conta.

    Detalhes de comportamento em runtime:

    - pareamentos são persistidos no allow-store do canal e mesclados com `allowFrom` configurado
    - automação agendada e fallback de destinatário de Heartbeat usam destinos explícitos de entrega ou `allowFrom` configurado; aprovações de pareamento de DM não são destinatários implícitos de Cron ou Heartbeat
    - se nenhuma allowlist estiver configurada, o número próprio vinculado é permitido por padrão
    - a OpenClaw nunca pareia automaticamente DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Group policy + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de associação a grupos** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist de remetentes ignorada
       - `allowlist`: remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia todas as mensagens de entrada de grupos

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` quando disponível
    - allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se nenhum bloco `channels.whatsapp` existir, o fallback da política de grupo em runtime é `allowlist` (com log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Mentions + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcrições de notas de voz recebidas para mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta apenas satisfaz o gate de menção; ela **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist continuam bloqueados mesmo que respondam à mensagem de um usuário na allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ele é restrito ao proprietário.

  </Tab>
</Tabs>

## Comportamento de número pessoal e conversa consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as salvaguardas de conversa consigo mesmo do WhatsApp são ativadas:

- ignora confirmações de leitura para turnos de conversa consigo mesmo
- ignora comportamento de acionamento automático por JID de menção que, de outra forma, mencionaria você mesmo
- se `messages.responsePrefix` não estiver definido, respostas de conversa consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Mensagens recebidas do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se existir uma resposta citada, o contexto é anexado neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).
    Quando o alvo da resposta citada é mídia baixável, a OpenClaw a salva por meio
    do armazenamento normal de mídia recebida e a expõe como `MediaPath`/`MediaType` para que
    o agente possa inspecionar a imagem referenciada em vez de ver apenas
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Mensagens recebidas somente de mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Notas de voz de grupo autorizadas são transcritas antes do gate de menção quando o
    corpo é apenas `<media:audio>`, então dizer a menção ao bot na nota de voz pode
    acionar a resposta. Se a transcrição ainda não mencionar o bot, a
    transcrição é mantida no histórico pendente do grupo em vez do placeholder bruto.

    Corpos de localização usam texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco delimitado, não como texto inline de prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot finalmente for acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Confirmações de leitura são habilitadas por padrão para mensagens recebidas aceitas do WhatsApp.

    Desabilitar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Substituição por conta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Turnos de autochat ignoram confirmações de leitura mesmo quando ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em partes e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em partes">
    - limite padrão de partes: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois recorre à divisão em partes segura por comprimento

  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - aceita payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - mídia de áudio é enviada pelo payload `audio` do Baileys com `ptt: true`, para que clientes WhatsApp a renderizem como nota de voz push-to-talk
    - payloads de resposta preservam `audioAsVoice`; a saída de nota de voz TTS para WhatsApp permanece nesse caminho PTT mesmo quando o provedor retorna MP3 ou WebM
    - áudio Ogg/Opus nativo é enviado como `audio/ogg; codecs=opus` para compatibilidade com notas de voz
    - áudio não Ogg, incluindo saída MP3/WebM de TTS do Microsoft Edge, é transcodificado com `ffmpeg` para Ogg/Opus mono de 48 kHz antes da entrega PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma nota de voz e suprime reenvios repetidos para a mesma resposta; `/tts chat on|off|default` controla o TTS automático para o chat WhatsApp atual
    - reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com várias mídias, exceto notas de voz PTT, que enviam o áudio primeiro e o texto visível separadamente porque clientes WhatsApp não renderizam legendas de notas de voz de forma consistente
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais

  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para caber nos limites
    - em falha de envio de mídia, o fallback do primeiro item envia um aviso de texto em vez de descartar a resposta silenciosamente

  </Accordion>
</AccordionGroup>

## Citação de respostas

WhatsApp aceita citação nativa de resposta, em que respostas de saída citam visivelmente a mensagem de entrada. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                        |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensagem simples                             |
| `"first"`   | Citar apenas a primeira parte da resposta de saída                     |
| `"all"`     | Citar todas as partes da resposta de saída                            |
| `"batched"` | Citar respostas agrupadas em fila, deixando respostas imediatas sem citação |

O padrão é `"off"`. Substituições por conta usam `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Nível de reação

`channels.whatsapp.reactionLevel` controla a amplitude com que o agente usa reações de emoji no WhatsApp:

| Nível         | Reações de confirmação | Reações iniciadas pelo agente | Descrição                                             |
| ------------- | ---------------------- | ----------------------------- | ----------------------------------------------------- |
| `"off"`       | Não                    | Não                           | Nenhuma reação                                        |
| `"ack"`       | Sim                    | Não                           | Apenas reações de confirmação (recibo pré-resposta)   |
| `"minimal"`   | Sim                    | Sim (conservador)             | Confirmação + reações do agente com orientação conservadora |
| `"extensive"` | Sim                    | Sim (incentivado)             | Confirmação + reações do agente com orientação incentivada |

Padrão: `"minimal"`.

Substituições por conta usam `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reações de confirmação

WhatsApp aceita reações de confirmação imediatas no recebimento de entrada via `channels.whatsapp.ackReaction`.
Reações de confirmação são bloqueadas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Notas de comportamento:

- enviadas imediatamente depois que a entrada é aceita (pré-resposta)
- falhas são registradas, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` atua como bypass para essa verificação
- WhatsApp usa `channels.whatsapp.ackReaction` (`messages.ackReaction` legado não é usado aqui)

## Várias contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - ids de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se presente; caso contrário, o primeiro id de conta configurado (ordenado)
    - ids de conta são normalizados internamente para consulta

  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão

  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Quando um Gateway está acessível, o logout primeiro interrompe o listener WhatsApp ativo para a conta selecionada, para que a sessão vinculada não continue recebendo mensagens até a próxima reinicialização. `openclaw channels remove --channel whatsapp` também interrompe o listener ativo antes de desativar ou excluir a configuração da conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Gates de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal são ativadas por padrão (desative via `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR obrigatório)">
    Sintoma: o status do canal informa que não está vinculado.

    Correção:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado, mas desconectado / loop de reconexão">
    Sintoma: conta vinculada com desconexões repetidas ou tentativas de reconexão.

    Contas silenciosas podem permanecer conectadas além do timeout normal de mensagens; o watchdog
    reinicia quando a atividade de transporte do WhatsApp Web para, o socket fecha ou
    a atividade em nível de aplicação permanece silenciosa além da janela de segurança mais longa.

    Se os logs mostrarem `status=408 Request Time-out Connection was lost` repetido, ajuste
    os tempos de socket do Baileys em `web.whatsapp`. Comece reduzindo
    `keepAliveIntervalMs` para abaixo do timeout de ociosidade da sua rede e aumentando
    `connectTimeoutMs` em links lentos ou com perda:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Correção:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` disser `Gateway inactive`, mas
    `openclaw gateway status` e `openclaw channels status --probe` mostrarem que o
    Gateway e o WhatsApp estão saudáveis, execute `openclaw doctor`. No Linux, o doctor
    alerta sobre entradas legadas de crontab que ainda invocam
    `~/.openclaw/bin/ensure-whatsapp.sh`; remova essas entradas obsoletas com
    `crontab -e` porque o cron pode não ter o ambiente do barramento de usuário do systemd e
    fazer esse script antigo relatar incorretamente a saúde do Gateway.

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Login por QR expira atrás de um proxy">
    Sintoma: `openclaw channels login --channel whatsapp` falha antes de mostrar um código QR utilizável com `status=408 Request Time-out` ou uma desconexão de socket TLS.

    O login do WhatsApp Web usa o ambiente de proxy padrão do host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes em minúsculas e `NO_PROXY`). Verifique se o processo do Gateway herda o ambiente de proxy e se `NO_PROXY` não corresponde a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nenhum listener ativo ao enviar">
    Envios de saída falham rapidamente quando não existe listener ativo do Gateway para a conta de destino.

    Confira se o Gateway está em execução e a conta está vinculada.

  </Accordion>

  <Accordion title="A resposta aparece na transcrição, mas não no WhatsApp">
    Linhas de transcrição registram o que o agente gerou. A entrega pelo WhatsApp é verificada separadamente: OpenClaw só trata uma resposta automática como enviada depois que o Baileys retorna um id de mensagem de saída para pelo menos um envio de texto visível ou mídia.

    Reações de confirmação são recibos pré-resposta independentes. Uma reação bem-sucedida não prova que a resposta posterior de texto ou mídia foi aceita pelo WhatsApp.

    Verifique os logs do Gateway por `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permissões `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime Bun">
    O runtime do Gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

WhatsApp aceita prompts de sistema no estilo Telegram para grupos e chats diretos via os mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta define seus próprios `groups`, ele substitui totalmente o mapa `groups` raiz (sem merge profundo). A busca de prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada do grupo específico existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada do grupo específico está totalmente ausente do mapa ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta define seu próprio `direct`, ele substitui totalmente o mapa `direct` raiz (sem merge profundo). A busca de prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do direto** (`direct["<peerId>"].systemPrompt`): usado quando a entrada do par específico existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema curinga de direto** (`direct["*"].systemPrompt`): usado quando a entrada do par específico está totalmente ausente do mapa ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

<Note>
`dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`). Substituições de prompt ficam em `direct`.
</Note>

**Diferença em relação ao comportamento multiconta do Telegram:** No Telegram, `groups` na raiz é suprimido intencionalmente para todas as contas em uma configuração multiconta, até mesmo contas que não definem seus próprios `groups`, para impedir que um bot receba mensagens de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` e `direct` na raiz são sempre herdados por contas que não definem uma substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração multiconta do WhatsApp, se você quiser prompts de grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender de padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é tanto um mapa de configuração por grupo quanto a lista de permissões de grupos no nível do chat. No escopo raiz ou da conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Só adicione um `systemPrompt` de grupo curinga quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` para o prompt padrão. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida.
- A admissão de grupo e a autorização de remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem chegar ao tratamento de grupos, mas isso, por si só, não autoriza todos os remetentes nesses grupos. O acesso de remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para mensagens diretas. `direct["*"]` só fornece uma configuração padrão de chat direto depois que uma mensagem direta já foi admitida por `dmPolicy` mais `allowFrom` ou por regras do armazenamento de pareamento.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Ponteiros da referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos de alto sinal do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multiconta: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento da sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
