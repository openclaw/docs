---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte a canais do WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é dono da(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- A integração inicial (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal de desenvolvimento + checkout do git: usa por padrão o caminho do Plugin local.
- Stable/Beta: instala primeiro o Plugin oficial `@openclaw/whatsapp` pelo ClawHub,
  com npm como fallback.
- O runtime do WhatsApp é distribuído fora do pacote npm central do OpenClaw para que
  as dependências de runtime específicas do WhatsApp permaneçam com o Plugin externo.

A instalação manual continua disponível:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use o pacote npm simples (`@openclaw/whatsapp`) somente quando precisar do fallback do registro. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e manuais de reparo.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
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

    O login atual é baseado em QR. Em ambientes remotos ou headless, garanta que você
    tenha um caminho confiável para entregar o código QR ao vivo ao telefone que irá
    escaneá-lo antes de iniciar o login.

    Para uma conta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para anexar um diretório de autenticação do WhatsApp Web existente/personalizado antes do login:

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

    Solicitações de pareamento expiram após 1 hora. Solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
O OpenClaw recomenda executar o WhatsApp em um número separado quando possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

<Warning>
O fluxo atual de configuração do WhatsApp aceita somente QR. QRs renderizados no terminal, capturas de tela,
PDFs ou anexos de chat podem expirar ou se tornar ilegíveis enquanto são retransmitidos
de uma máquina remota. Para hosts remotos/headless, prefira um caminho direto de entrega
da imagem QR em vez de captura manual do terminal.
</Warning>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Este é o modo operacional mais limpo:

    - identidade separada do WhatsApp para o OpenClaw
    - listas de permissões de DM e limites de roteamento mais claros
    - menor chance de confusão com conversa consigo mesmo

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
    A integração inicial aceita o modo de número pessoal e grava uma linha de base adequada para conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de conversa consigo mesmo usam como chave o próprio número vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    O canal da plataforma de mensagens é baseado no WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal de mensagens Twilio WhatsApp separado no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway é dono do socket do WhatsApp e do loop de reconexão.
- O watchdog de reconexão usa a atividade de transporte do WhatsApp Web, não apenas o volume de mensagens de aplicativo recebidas, portanto uma sessão silenciosa de dispositivo vinculado não é reiniciada apenas porque ninguém enviou uma mensagem recentemente. Um limite mais longo de silêncio do aplicativo ainda força uma reconexão se frames de transporte continuarem chegando, mas nenhuma mensagem de aplicativo for tratada durante a janela do watchdog; após uma reconexão transitória para uma sessão recentemente ativa, essa verificação de silêncio do aplicativo usa o timeout normal de mensagem na primeira janela de recuperação.
- Os tempos do socket Baileys são explícitos em `web.whatsapp.*`: `keepAliveIntervalMs` controla pings de aplicativo do WhatsApp Web, `connectTimeoutMs` controla o timeout do handshake de abertura, e `defaultQueryTimeoutMs` controla as esperas de consulta do Baileys mais os limites de operação locais do OpenClaw para envio/presença de saída e confirmação de leitura de entrada.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Envios para grupos anexam metadados nativos de menção para tokens `@+<digits>` e `@<digits>` no texto e em legendas de mídia quando o token corresponde aos metadados atuais de participantes do WhatsApp, incluindo grupos apoiados por LID.
- Chats de status e transmissão são ignorados (`@status`, `@broadcast`).
- O watchdog de reconexão segue a atividade de transporte do WhatsApp Web, não apenas o volume de mensagens de aplicativo recebidas: sessões silenciosas de dispositivo vinculado permanecem ativas enquanto frames de transporte continuam, mas uma interrupção de transporte força reconexão bem antes do caminho posterior de desconexão remota.
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` colapsa DMs para a sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- Canais/Newsletters do WhatsApp podem ser destinos explícitos de saída com seu JID nativo `@newsletter`. Envios de saída para newsletter usam metadados de sessão de canal (`agent:<agentId>:whatsapp:channel:<jid>`) em vez de semântica de sessão de DM.
- O transporte do WhatsApp Web respeita variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy no nível do host em vez de configurações de proxy específicas do canal do WhatsApp.
- Quando `messages.removeAckAfterReply` está habilitado, o OpenClaw limpa a reação de confirmação do WhatsApp depois que uma resposta visível é entregue.

## Prompts de aprovação

O WhatsApp pode renderizar prompts de aprovação de exec e Plugin com reações `👍` / `👎`. A entrega é
controlada pela configuração de encaminhamento de aprovação de nível superior:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` e `approvals.plugin` são independentes. Habilitar o WhatsApp como canal apenas vincula
o transporte; isso não envia prompts de aprovação a menos que a família de aprovação correspondente esteja habilitada
e roteie para o WhatsApp. O modo de sessão entrega aprovações nativas por emoji somente para aprovações que
se originam do WhatsApp. O modo de destino usa o pipeline compartilhado de encaminhamento para destinos explícitos do WhatsApp
e não cria fanout separado de DM de aprovador.

Reações de aprovação no WhatsApp exigem aprovadores explícitos do WhatsApp vindos de `allowFrom` ou `"*"`.
`defaultTo` controla destinos padrão comuns de mensagens; ele não é um aprovador de aprovação. Comandos manuais
`/approve` ainda passam pelo caminho normal de autorização de remetente do WhatsApp antes da
resolução da aprovação.

## Hooks de Plugin e privacidade

Mensagens recebidas do WhatsApp podem conter conteúdo pessoal de mensagens, números de telefone,
identificadores de grupo, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads do hook `message_received` recebidos para Plugins
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

Habilite isso somente para Plugins em que você confia para receber conteúdo
e identificadores de mensagens recebidas do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    `allowFrom` é uma lista de controle de acesso de remetentes de DM. Ela não bloqueia envios explícitos de saída para JIDs de grupo do WhatsApp ou JIDs de canal `@newsletter`.

    Substituição para várias contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões de nível de canal para essa conta.

    Detalhes de comportamento em runtime:

    - pareamentos são persistidos no armazenamento de permissões do canal e mesclados com `allowFrom` configurado
    - automação agendada e fallback de destinatário de Heartbeat usam destinos de entrega explícitos ou `allowFrom` configurado; aprovações de pareamento de DM não são destinatários implícitos de Cron ou Heartbeat
    - se nenhuma lista de permissões estiver configurada, o próprio número vinculado é permitido por padrão
    - o OpenClaw nunca pareia automaticamente DMs `fromMe` de saída (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Group policy + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissões de associação a grupos** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, ele atua como uma lista de permissões de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista de permissões de remetentes ignorada
       - `allowlist`: remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia todas as entradas de grupo

    Fallback da lista de permissões de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` quando disponível
    - listas de permissões de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se nenhum bloco `channels.whatsapp` existir, o fallback de política de grupo em runtime será `allowlist` (com um log de aviso), mesmo se `channels.defaults.groupPolicy` estiver definido.

  </Tab>

  <Tab title="Mentions + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menções inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcrições de notas de voz recebidas para mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta apenas satisfaz o bloqueio por menção; ela **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da lista de permissões ainda são bloqueados mesmo que respondam à mensagem de um usuário permitido

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ele é restrito ao proprietário.

  </Tab>
</Tabs>

## Vinculações ACP configuradas

O WhatsApp aceita vinculações ACP persistentes com entradas `bindings[]` de nível superior:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Conversas diretas correspondem a números E.164, como `+15555550123`.
- Grupos correspondem a JIDs de grupo do WhatsApp, como `120363424282127706@g.us`.
- Listas de permissões de grupo, política de remetente e bloqueio por menção ou ativação são executados antes que o OpenClaw garanta que a sessão ACP configurada exista.
- Um vínculo ACP configurado correspondente controla a rota. Grupos de transmissão do WhatsApp não distribuem esse turno para sessões comuns do WhatsApp.

## Comportamento de número pessoal e conversa consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as proteções de conversa consigo mesmo do WhatsApp são ativadas:

- pular recibos de leitura para turnos de conversa consigo mesmo
- ignorar o comportamento de acionamento automático por JID de menção que, de outra forma, enviaria um ping para você mesmo
- se `messages.responsePrefix` não estiver definido, respostas de conversa consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    Mensagens recebidas do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se existir uma resposta citada, o contexto será anexado neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).
    Quando o alvo da resposta citada é uma mídia baixável, o OpenClaw a salva pelo
    armazenamento normal de mídia de entrada e a expõe como `MediaPath`/`MediaType` para que
    o agente possa inspecionar a imagem referenciada, em vez de ver apenas
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada que contêm apenas mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Mensagens de voz autorizadas em grupo são transcritas antes do bloqueio por menção quando o
    corpo é apenas `<media:audio>`, então dizer a menção do bot na mensagem de voz pode
    acionar a resposta. Se a transcrição ainda não mencionar o bot, a
    transcrição será mantida no histórico pendente do grupo em vez do placeholder bruto.

    Corpos de localização usam texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco delimitado, não como texto inline no prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente do grupo">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot finalmente for acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Recibos de leitura">
    Recibos de leitura ficam ativados por padrão para mensagens de entrada aceitas do WhatsApp.

    Desativar globalmente:

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

    Turnos de conversa consigo mesmo pulam recibos de leitura mesmo quando ativados globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em blocos e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em blocos">
    - limite padrão de bloco: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois recorre à divisão segura por comprimento

  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a payloads de imagem, vídeo, áudio (mensagem de voz PTT) e documento
    - mídia de áudio é enviada pelo payload `audio` do Baileys com `ptt: true`, então clientes WhatsApp a renderizam como uma mensagem de voz push-to-talk
    - payloads de resposta preservam `audioAsVoice`; saída de mensagem de voz TTS para WhatsApp permanece neste caminho PTT mesmo quando o provedor retorna MP3 ou WebM
    - áudio Ogg/Opus nativo é enviado como `audio/ogg; codecs=opus` para compatibilidade com mensagem de voz
    - áudio que não seja Ogg, incluindo saída MP3/WebM do Microsoft Edge TTS, é transcodificado com `ffmpeg` para Ogg/Opus mono de 48 kHz antes da entrega PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma mensagem de voz e suprime envios repetidos para a mesma resposta; `/tts chat on|off|default` controla TTS automático para a conversa atual do WhatsApp
    - reprodução de GIF animado é suportada via `gifPlayback: true` em envios de vídeo
    - `forceDocument` / `asDocument` envia imagens, GIFs e vídeos de saída pelo payload de documento do Baileys para evitar a compactação de mídia do WhatsApp, preservando o nome de arquivo resolvido e o tipo MIME
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta multimídia, exceto que mensagens de voz PTT enviam o áudio primeiro e o texto visível separadamente porque clientes WhatsApp não renderizam legendas de mensagem de voz de forma consistente
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais

  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para se ajustarem aos limites, a menos que `forceDocument` / `asDocument` solicite entrega como documento
    - em falha de envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente

  </Accordion>
</AccordionGroup>

## Citação de respostas

WhatsApp oferece suporte a citação nativa de resposta, em que respostas de saída citam visivelmente a mensagem de entrada. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensagem simples                                  |
| `"first"`   | Citar apenas o primeiro bloco de resposta de saída                             |
| `"all"`     | Citar todos os blocos de resposta de saída                                      |
| `"batched"` | Citar respostas em lote enfileiradas, deixando respostas imediatas sem citação |

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

| Nível         | Reações de confirmação | Reações iniciadas pelo agente | Descrição                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Não            | Não                        | Nenhuma reação                                  |
| `"ack"`       | Sim           | Não                        | Apenas reações de confirmação (recibo pré-resposta)           |
| `"minimal"`   | Sim           | Sim (conservador)        | Confirmação + reações do agente com orientação conservadora |
| `"extensive"` | Sim           | Sim (incentivado)          | Confirmação + reações do agente com orientação incentivada   |

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

WhatsApp oferece suporte a reações de confirmação imediatas no recebimento de entrada via `channels.whatsapp.ackReaction`.
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

Observações de comportamento:

- enviadas imediatamente após a entrada ser aceita (pré-resposta)
- se `ackReaction` estiver presente sem `emoji`, o WhatsApp usa o emoji de identidade do agente roteado, com fallback para "👀"; omita `ackReaction` ou defina `emoji: ""` para não enviar reação de confirmação
- falhas são registradas, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` atua como bypass para esta verificação
- WhatsApp usa `channels.whatsapp.ackReaction` (`messages.ackReaction` legado não é usado aqui)

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o WhatsApp substitua a reação de confirmação durante um turno em vez de deixar um emoji de recibo estático. Quando ativado, o OpenClaw usa o mesmo slot de reação da mensagem de entrada para estados de ciclo de vida como enfileirado, pensando, atividade de ferramenta, Compaction, concluído e erro.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Observações de comportamento:

- `channels.whatsapp.ackReaction` ainda controla se reações de status são elegíveis para mensagens diretas e grupos.
- A reação de status enfileirado usa o mesmo emoji de confirmação efetivo das reações de confirmação simples.
- WhatsApp tem um slot de reação do bot por mensagem, então atualizações de ciclo de vida substituem a reação atual no lugar.
- `messages.removeAckAfterReply: true` limpa a reação de status final após a retenção configurada de concluído/erro.
- Categorias de emoji de ferramenta incluem `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

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
    - autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão

  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Quando um Gateway está acessível, o logout primeiro interrompe o listener ativo do WhatsApp para a conta selecionada, para que a sessão vinculada não continue recebendo mensagens até a próxima reinicialização. `openclaw channels remove --channel whatsapp` também interrompe o listener ativo antes de desativar ou excluir a configuração da conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Bloqueios de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal ficam ativadas por padrão (desative via `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: o status do canal informa que não está vinculado.

    Correção:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado, mas desconectado / loop de reconexão">
    Sintoma: conta vinculada com desconexões repetidas ou tentativas de reconexão.

    Contas silenciosas podem permanecer conectadas além do tempo limite normal de mensagens; o watchdog
    reinicia quando a atividade de transporte do WhatsApp Web para, o socket fecha ou
    a atividade em nível de aplicação permanece silenciosa além da janela de segurança mais longa.

    Se os logs mostrarem `status=408 Request Time-out Connection was lost` repetidamente, ajuste
    os tempos do socket do Baileys em `web.whatsapp`. Comece reduzindo
    `keepAliveIntervalMs` para ficar abaixo do tempo limite de inatividade da sua rede e aumentando
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Se o loop persistir depois que a conectividade do host e os tempos forem corrigidos, faça backup
    do diretório de autenticação da conta e vincule essa conta novamente:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` disser `Gateway inactive`, mas
    `openclaw gateway status` e `openclaw channels status --probe` mostrarem que o
    gateway e o WhatsApp estão íntegros, execute `openclaw doctor`. No Linux, o doctor
    alerta sobre entradas legadas de crontab que ainda invocam
    `~/.openclaw/bin/ensure-whatsapp.sh`; remova essas entradas obsoletas com
    `crontab -e`, porque o cron pode não ter o ambiente de barramento de usuário do systemd e
    fazer esse script antigo informar incorretamente a integridade do gateway.

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Login por QR expira atrás de um proxy">
    Sintoma: `openclaw channels login --channel whatsapp` falha antes de mostrar um código QR utilizável com `status=408 Request Time-out` ou uma desconexão de socket TLS.

    O login do WhatsApp Web usa o ambiente de proxy padrão do host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes em minúsculas e `NO_PROXY`). Verifique se o processo do gateway herda o ambiente de proxy e se `NO_PROXY` não corresponde a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nenhum listener ativo ao enviar">
    Envios de saída falham rapidamente quando não existe nenhum listener de gateway ativo para a conta de destino.

    Certifique-se de que o gateway esteja em execução e que a conta esteja vinculada.

  </Accordion>

  <Accordion title="Resposta aparece na transcrição, mas não no WhatsApp">
    As linhas de transcrição registram o que o agente gerou. A entrega pelo WhatsApp é verificada separadamente: o OpenClaw só trata uma resposta automática como enviada depois que o Baileys retorna um id de mensagem de saída para pelo menos um envio visível de texto ou mídia.

    Reações de confirmação são recibos pré-resposta independentes. Uma reação bem-sucedida não prova que a resposta posterior de texto ou mídia foi aceita pelo WhatsApp.

    Verifique os logs do gateway para `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da lista de permissões de `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

    Se `channels.whatsapp.groups` estiver presente, o WhatsApp ainda pode observar mensagens de outros grupos, mas o OpenClaw as descarta antes do roteamento de sessão. Adicione o JID do grupo a `channels.whatsapp.groups` ou adicione `groups["*"]` para admitir todos os grupos, mantendo a autorização de remetente em `groupPolicy` e `groupAllowFrom`.

  </Accordion>

  <Accordion title="Aviso de runtime Bun">
    O runtime do gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts do sistema

O WhatsApp oferece suporte a prompts do sistema no estilo do Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa efetivo de `groups` é determinado primeiro: se a conta definir seus próprios `groups`, ele substitui totalmente o mapa `groups` raiz (sem mesclagem profunda). A busca de prompt então é executada no único mapa resultante:

1. **Prompt do sistema específico de grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt do sistema será aplicado.
2. **Prompt do sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa efetivo de `direct` é determinado primeiro: se a conta definir seu próprio `direct`, ele substitui totalmente o mapa `direct` raiz (sem mesclagem profunda). A busca de prompt então é executada no único mapa resultante:

1. **Prompt do sistema específico de chat direto** (`direct["<peerId>"].systemPrompt`): usado quando a entrada específica do par existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt do sistema será aplicado.
2. **Prompt do sistema curinga de chat direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do par está totalmente ausente do mapa, ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

<Note>
`dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`). Substituições de prompt ficam em `direct`.
</Note>

**Diferença em relação ao comportamento multi-conta do Telegram:** No Telegram, o `groups` raiz é intencionalmente suprimido para todas as contas em uma configuração multi-conta, mesmo contas que não definem `groups` próprios, para impedir que um bot receba mensagens de grupos aos quais não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração multi-conta do WhatsApp, se você quiser prompts de grupo ou diretos por conta, defina o mapa completo explicitamente em cada conta em vez de depender de padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é tanto um mapa de configuração por grupo quanto a lista de permissões de grupo no nível de chat. No escopo raiz ou de conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Só adicione um `systemPrompt` curinga de grupo quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` como padrão do prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida.
- Admissão de grupo e autorização de remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem alcançar o tratamento de grupo, mas por si só não autoriza todos os remetentes nesses grupos. O acesso de remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` apenas fornece uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais `allowFrom` ou regras do armazenamento de pareamento.

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

## Ponteiros de referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos do WhatsApp de alto sinal:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-conta: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
