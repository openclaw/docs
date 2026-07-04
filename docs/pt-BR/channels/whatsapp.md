---
read_when:
    - Trabalhando no comportamento de canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:31:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia a(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal de desenvolvimento + checkout do git: usa por padrão o caminho do Plugin local.
- Stable/Beta: instala primeiro o Plugin oficial `@openclaw/whatsapp` do ClawHub,
  com npm como fallback.
- O runtime do WhatsApp é distribuído fora do pacote npm principal do OpenClaw para que
  as dependências de runtime específicas do WhatsApp permaneçam com o Plugin externo.

A instalação manual continua disponível:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use o pacote npm simples (`@openclaw/whatsapp`) apenas quando precisar do fallback do registro.
Fixe uma versão exata apenas quando precisar de uma instalação reproduzível.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Configure a política de acesso do WhatsApp">

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

  <Step title="Vincule o WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    O login atual é baseado em QR. Em ambientes remotos ou sem interface gráfica, garanta que você
    tenha um caminho confiável para entregar o código QR ativo ao telefone que fará a leitura
    antes de iniciar o login.

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

  <Step title="Inicie o Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprove a primeira solicitação de pareamento (se estiver usando o modo de pareamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    As solicitações de pareamento expiram após 1 hora. As solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
A OpenClaw recomenda executar o WhatsApp em um número separado quando possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

<Warning>
O fluxo atual de configuração do WhatsApp é somente por QR. QRs renderizados no terminal, capturas de tela,
PDFs ou anexos de chat podem expirar ou ficar ilegíveis durante o repasse
a partir de uma máquina remota. Para hosts remotos/sem interface gráfica, prefira um caminho direto
de entrega da imagem QR em vez de captura manual do terminal.
</Warning>

## Ligue para o solicitante atual com MeowCaller (experimental)

O Plugin do WhatsApp pode expor `whatsapp_call` em turnos de agente originados do WhatsApp. A ferramenta
usa [MeowCaller](https://github.com/purpshell/meowcaller) para fazer uma chamada de voz do WhatsApp para
o solicitante autorizado atual e reproduz uma mensagem TTS da OpenClaw depois que ele atende. A ferramenta
não aceita um número de destino, portanto um prompt não pode redirecionar a chamada para terceiros.
Este recurso experimental fica desabilitado por padrão.

<Warning>
MeowCaller é experimental, não tem release com tag e usa uma sessão de dispositivo vinculado whatsmeow
pareada separadamente. Ele não pode reutilizar as credenciais Baileys do Plugin do WhatsApp. O pareamento adiciona
outro dispositivo vinculado à mesma conta do WhatsApp. Leia o QR com a identidade do WhatsApp usada pela
OpenClaw. O modo número pessoal/self-chat não pode ligar para si mesmo; use um número dedicado da OpenClaw
para ligar para seu número pessoal.
</Warning>

<Steps>
  <Step title="Habilite chamadas experimentais">

    Adicione `actions.calls: true` ao canal do WhatsApp em `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Mescle isso à sua configuração existente do WhatsApp e reinicie o Gateway. Quando a
    configuração estiver ausente ou for `false`, a OpenClaw não expõe a ferramenta `whatsapp_call` ao agente.

  </Step>

  <Step title="Instale a CLI MeowCaller revisada">

    O adaptador espera um executável chamado `meowcaller` no `PATH` do host do Gateway.
    Até que [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) seja mesclado, compile
    a branch revisada no commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Garanta que `$HOME/.local/bin` também esteja no `PATH` do serviço do Gateway. Esta revisão fornece
    comandos explícitos `pair` e `notify` somente de envio. `notify` não abre microfone, alto-falante,
    dispositivo de vídeo, coletor de áudio de entrada nem captura de diagnóstico. Não substitua pelo comando
    `play` da CLI de exemplo.

  </Step>

  <Step title="Pareie o dispositivo vinculado do MeowCaller">

    Peça ao agente do WhatsApp para verificar a configuração de chamada. A ação de status `whatsapp_call` informa o
    diretório de estado específico da conta e o comando de pareamento. Para a conta padrão:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Execute o comando em um terminal interativo. Leia o QR em **WhatsApp > Dispositivos vinculados**
    e aguarde `MeowCaller linked device ready`. Em seguida, o comando termina. Mantenha `wa-voip.db`
    privado; ele é a sessão de dispositivo vinculado do MeowCaller. A ação de status `whatsapp_call`
    retorna o comando e o shell específicos da conta quando você usa uma conta não padrão. No
    Windows, execute o comando PowerShell dele; o MeowCaller cria o diretório de armazenamento.

  </Step>

  <Step title="Configure TTS e faça a chamada pelo WhatsApp">

    Configure um [provedor de TTS](/pt-BR/tools/tts) compatível com telefonia, reinicie o Gateway e envie uma
    solicitação do WhatsApp como `Call me and say the build finished.` A ferramenta resolve o remetente
    a partir do contexto de entrada confiável, sintetiza um arquivo WAV temporário privado, executa o MeowCaller por uma
    janela de chamada limitada e exclui o arquivo de áudio depois. A OpenClaw passa explicitamente o armazenamento da conta,
    aguarda um status de saída zero após atendimento, reprodução e encerramento da chamada, e trata
    timeout ou saída diferente de zero como uma chamada de ferramenta com falha.

  </Step>
</Steps>

Limites atuais:

- apenas chamadas de áudio de saída um para um
- sem números de destino arbitrários
- sem autenticação compartilhada com a conexão de chat
- sem chamadas para si mesmo no modo número pessoal/self-chat
- áudio sintetizado limitado a 60 segundos
- sem confirmação de audibilidade no aparelho além da conclusão de atendimento/reprodução/encerramento do MeowCaller
- a OpenClaw interrompe o processo auxiliar após uma janela limitada de 115 a 175 segundos, incluindo
  as fases de conexão, atendimento, reprodução e desligamento do MeowCaller

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade do WhatsApp separada para a OpenClaw
    - allowlists de DM e limites de roteamento mais claros
    - menor chance de confusão com self-chat

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

  <Accordion title="Fallback com número pessoal">
    O onboarding oferece suporte ao modo número pessoal e grava uma base compatível com self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    No runtime, as proteções de self-chat usam o número próprio vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="Escopo de canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado no WhatsApp Web (`Baileys`) na arquitetura atual de canais da OpenClaw.

    Não há um canal de mensagens separado do Twilio WhatsApp no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway gerencia o socket do WhatsApp e o loop de reconexão.
- O watchdog de reconexão usa a atividade do transporte do WhatsApp Web, não apenas o volume de mensagens de app de entrada, portanto uma sessão silenciosa de dispositivo vinculado não é reiniciada somente porque ninguém enviou uma mensagem recentemente. Um limite mais longo de silêncio da aplicação ainda força uma reconexão se frames de transporte continuarem chegando, mas nenhuma mensagem de aplicação for tratada durante a janela do watchdog; após uma reconexão transitória para uma sessão ativa recentemente, essa verificação de silêncio da aplicação usa o timeout normal de mensagens na primeira janela de recuperação.
- Os tempos do socket Baileys são explícitos em `web.whatsapp.*`: `keepAliveIntervalMs` controla pings de aplicação do WhatsApp Web, `connectTimeoutMs` controla o timeout do handshake de abertura, e `defaultQueryTimeoutMs` controla esperas de consulta do Baileys mais os limites locais da OpenClaw para envio/presença de saída e operações de confirmação de leitura de entrada.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Envios de grupo anexam metadados nativos de menção para tokens `@+<digits>` e `@<digits>` em texto e legendas de mídia quando o token corresponde aos metadados atuais de participante do WhatsApp, incluindo grupos com suporte a LID.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- O watchdog de reconexão segue a atividade do transporte do WhatsApp Web, não apenas o volume de mensagens de app de entrada: sessões silenciosas de dispositivos vinculados permanecem ativas enquanto frames de transporte continuam, mas uma interrupção do transporte força reconexão bem antes do caminho posterior de desconexão remota.
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` colapsa DMs para a sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters podem ser destinos explícitos de saída com seu JID nativo `@newsletter`. Envios de newsletter de saída usam metadados de sessão de canal (`agent:<agentId>:whatsapp:channel:<jid>`) em vez de semântica de sessão de DM.
- O transporte WhatsApp Web respeita variáveis de ambiente de proxy padrão no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy em nível de host em vez de configurações de proxy específicas do canal do WhatsApp.
- Quando `messages.removeAckAfterReply` está habilitado, a OpenClaw limpa a reação de confirmação do WhatsApp depois que uma resposta visível é entregue.

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
se originam do WhatsApp. O modo de destino usa o pipeline de encaminhamento compartilhado para destinos explícitos do WhatsApp
e não cria fanout separado de DM para aprovadores.

Reações de aprovação do WhatsApp exigem aprovadores explícitos do WhatsApp de `allowFrom` ou `"*"`.
`defaultTo` controla destinos padrão comuns de mensagens; ele não é um aprovador de aprovação. Comandos manuais
`/approve` ainda passam pelo caminho normal de autorização de remetente do WhatsApp antes da
resolução da aprovação.

## Hooks de Plugin e privacidade

Mensagens recebidas do WhatsApp podem conter conteúdo pessoal de mensagens, números de telefone,
identificadores de grupos, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads de hook `message_received` recebidos para plugins
a menos que você habilite isso explicitamente:

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

Você pode limitar a habilitação a uma conta:

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

Habilite isso apenas para plugins nos quais você confia para receber conteúdo
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

    `allowFrom` é uma lista de controle de acesso de remetentes de DM. Ela não controla envios explícitos de saída para JIDs de grupos do WhatsApp ou JIDs de canais `@newsletter`.

    Substituição para várias contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em runtime:

    - emparelhamentos são persistidos no armazenamento de permissões do canal e mesclados com o `allowFrom` configurado
    - automações agendadas e fallback de destinatário de Heartbeat usam destinos de entrega explícitos ou `allowFrom` configurado; aprovações de emparelhamento de DM não são destinatários implícitos de Cron ou Heartbeat
    - se nenhuma allowlist estiver configurada, o próprio número vinculado é permitido por padrão
    - o OpenClaw nunca emparelha automaticamente DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Group policy + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de participação em grupos** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist de remetentes ignorada
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia todas as entradas de grupos

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` quando disponível
    - allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se nenhum bloco `channels.whatsapp` existir, o fallback de política de grupos em runtime será `allowlist` (com um log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Mentions + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menções inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcrições de notas de voz recebidas para mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta satisfaz apenas o controle por menção; ela **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist continuam bloqueados mesmo que respondam à mensagem de um usuário na allowlist

    Comando de ativação em nível de sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ele é controlado pelo proprietário.

  </Tab>
</Tabs>

## Vinculações ACP configuradas

O WhatsApp é compatível com vinculações ACP persistentes com entradas `bindings[]` de nível superior:

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

- Chats diretos correspondem a números E.164, como `+15555550123`.
- Grupos correspondem a JIDs de grupos do WhatsApp, como `120363424282127706@g.us`.
- Allowlists de grupos, política de remetente e controle por menção ou ativação são executados antes de o OpenClaw garantir que a sessão ACP configurada exista.
- Uma vinculação ACP configurada correspondente é dona da rota. Grupos de broadcast do WhatsApp não distribuem esse turno para sessões comuns do WhatsApp.

## Comportamento de número pessoal e chat consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, as proteções de chat consigo mesmo do WhatsApp são ativadas:

- ignora confirmações de leitura para turnos de chat consigo mesmo
- ignora comportamento de acionamento automático por JID de menção que, caso contrário, mencionaria você mesmo
- se `messages.responsePrefix` não estiver definido, respostas de chat consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

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
    Quando o alvo da resposta citada é mídia baixável, o OpenClaw a salva por meio
    do armazenamento normal de mídia recebida e a expõe como `MediaPath`/`MediaType` para que
    o agente possa inspecionar a imagem referenciada em vez de ver apenas
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Mensagens recebidas somente com mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Notas de voz de grupos autorizados são transcritas antes do controle por menção quando o
    corpo contém apenas `<media:audio>`, então dizer a menção ao bot na nota de voz pode
    acionar a resposta. Se a transcrição ainda não mencionar o bot, a
    transcrição é mantida no histórico pendente do grupo em vez do placeholder bruto.

    Corpos de localização usam texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco cercado, não como texto inline no prompt.

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

    Turnos de chat consigo mesmo ignoram confirmações de leitura mesmo quando habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em partes e mídia

<AccordionGroup>
  <Accordion title="Text chunking">
    - limite padrão de parte: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e, em seguida, recorre à divisão em partes segura por comprimento

  </Accordion>

  <Accordion title="Outbound media behavior">
    - oferece suporte a payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - mídia de áudio é enviada pelo payload `audio` do Baileys com `ptt: true`, então clientes do WhatsApp a renderizam como nota de voz push-to-talk
    - payloads de resposta preservam `audioAsVoice`; a saída de nota de voz TTS para WhatsApp permanece nesse caminho PTT mesmo quando o provedor retorna MP3 ou WebM
    - áudio Ogg/Opus nativo é enviado como `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - áudio que não seja Ogg, incluindo a saída MP3/WebM do TTS do Microsoft Edge, é transcodificado com `ffmpeg` para Ogg/Opus mono de 48 kHz antes da entrega PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma nota de voz e suprime reenvios para a mesma resposta; `/tts chat on|off|default` controla o TTS automático para o chat atual do WhatsApp
    - reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - `forceDocument` / `asDocument` envia imagens, GIFs e vídeos de saída pelo payload de documento do Baileys para evitar compressão de mídia do WhatsApp, preservando o nome de arquivo resolvido e o tipo MIME
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com várias mídias, exceto que notas de voz PTT enviam o áudio primeiro e o texto visível separadamente porque clientes do WhatsApp não renderizam legendas de notas de voz de forma consistente
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - limite de salvamento de mídia recebida: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (varredura de redimensionamento/qualidade) para se ajustar aos limites, a menos que `forceDocument` / `asDocument` solicite entrega como documento
    - em falha de envio de mídia, o fallback do primeiro item envia aviso em texto em vez de descartar a resposta silenciosamente

  </Accordion>
</AccordionGroup>

## Citação de respostas

O WhatsApp é compatível com citação nativa de respostas, em que respostas de saída citam visivelmente a mensagem recebida. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                        |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nunca cita; envia como mensagem simples                              |
| `"first"`   | Cita apenas a primeira parte da resposta de saída                    |
| `"all"`     | Cita todas as partes da resposta de saída                            |
| `"batched"` | Cita respostas em lote enfileiradas, deixando respostas imediatas sem citação |

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
| ------------- | ---------------------- | ----------------------------- | ---------------------------------------------- |
| `"off"`       | Não                    | Não                           | Nenhuma reação                                 |
| `"ack"`       | Sim                    | Não                           | Apenas reações de confirmação (recibo pré-resposta) |
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

O WhatsApp é compatível com reações de confirmação imediatas no recebimento de entrada via `channels.whatsapp.ackReaction`.
Reações de confirmação são controladas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

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

- enviada imediatamente depois que a entrada é aceita (antes da resposta)
- se `ackReaction` estiver presente sem `emoji`, o WhatsApp usa o emoji de identidade do agente roteado, recorrendo a "👀"; omita `ackReaction` ou defina `emoji: ""` para não enviar nenhuma reação de confirmação
- falhas são registradas, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` atua como bypass para essa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (`messages.ackReaction` legado não é usado aqui)

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o WhatsApp substitua a reação de confirmação durante um turno em vez de deixar um emoji de recibo estático. Quando ativado, o OpenClaw usa o mesmo slot de reação da mensagem de entrada para estados do ciclo de vida, como enfileirado, pensando, atividade de ferramenta, Compaction, concluído e erro.

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

Notas de comportamento:

- `channels.whatsapp.ackReaction` ainda controla se as reações de status são elegíveis para mensagens diretas e grupos.
- A reação de status enfileirado usa o mesmo emoji de confirmação efetivo das reações de confirmação simples.
- O WhatsApp tem um slot de reação de bot por mensagem, portanto as atualizações de ciclo de vida substituem a reação atual no mesmo lugar.
- `messages.removeAckAfterReply: true` limpa a reação de status final após a retenção configurada de concluído/erro.
- As categorias de emoji de ferramenta incluem `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Várias contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - os ids de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default`, se presente; caso contrário, o primeiro id de conta configurado (ordenado)
    - os ids de conta são normalizados internamente para consulta

  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão

  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Quando um Gateway está acessível, o logout primeiro interrompe o listener ativo do WhatsApp para a conta selecionada, para que a sessão vinculada não continue recebendo mensagens até a próxima reinicialização. `openclaw channels remove --channel whatsapp` também interrompe o listener ativo antes de desabilitar ou excluir a configuração da conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Portões de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal são ativadas por padrão (desative via `channels.whatsapp.configWrites=false`).

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

    Contas silenciosas podem permanecer conectadas além do tempo limite normal de mensagens; o monitoramento
    reinicia quando a atividade do transporte WhatsApp Web para, o socket fecha ou
    a atividade no nível da aplicação permanece silenciosa além da janela de segurança mais longa.

    Se os logs mostrarem repetidamente `status=408 Request Time-out Connection was lost`, ajuste
    os tempos de socket do Baileys em `web.whatsapp`. Comece reduzindo
    `keepAliveIntervalMs` para abaixo do tempo limite ocioso da sua rede e aumentando
    `connectTimeoutMs` em links lentos ou com perdas:

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
    alerta sobre entradas legadas do crontab que ainda invocam
    `~/.openclaw/bin/ensure-whatsapp.sh`; remova essas entradas obsoletas com
    `crontab -e`, porque o cron pode não ter o ambiente de barramento de usuário do systemd e
    fazer esse script antigo relatar incorretamente a integridade do gateway.

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Login por QR expira atrás de um proxy">
    Sintoma: `openclaw channels login --channel whatsapp` falha antes de mostrar um código QR utilizável com `status=408 Request Time-out` ou uma desconexão de socket TLS.

    O login do WhatsApp Web usa o ambiente de proxy padrão do host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes em minúsculas e `NO_PROXY`). Verifique se o processo do gateway herda o env do proxy e se `NO_PROXY` não corresponde a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nenhum listener ativo ao enviar">
    Envios de saída falham rapidamente quando não existe listener de gateway ativo para a conta de destino.

    Certifique-se de que o gateway esteja em execução e que a conta esteja vinculada.

  </Accordion>

  <Accordion title="A resposta aparece na transcrição, mas não no WhatsApp">
    As linhas da transcrição registram o que o agente gerou. A entrega pelo WhatsApp é verificada separadamente: o OpenClaw só trata uma resposta automática como enviada depois que o Baileys retorna um id de mensagem de saída para pelo menos um envio visível de texto ou mídia.

    Reações de confirmação são recibos independentes anteriores à resposta. Uma reação bem-sucedida não prova que a resposta posterior de texto ou mídia foi aceita pelo WhatsApp.

    Verifique os logs do gateway por `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da lista de permissões `groups`
    - controle por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

    Se `channels.whatsapp.groups` estiver presente, o WhatsApp ainda poderá observar mensagens de outros grupos, mas o OpenClaw as descarta antes do roteamento de sessão. Adicione o JID do grupo a `channels.whatsapp.groups` ou adicione `groups["*"]` para admitir todos os grupos, mantendo a autorização de remetente em `groupPolicy` e `groupAllowFrom`.

  </Accordion>

  <Accordion title="Aviso do runtime Bun">
    O runtime do gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta define seus próprios `groups`, ele substitui completamente o mapa `groups` raiz (sem mesclagem profunda). A consulta do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta define seu próprio `direct`, ele substitui completamente o mapa `direct` raiz (sem mesclagem profunda). A consulta do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do direto** (`direct["<peerId>"].systemPrompt`): usado quando a entrada específica do par existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema curinga do direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do par está totalmente ausente do mapa ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

<Note>
`dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`). Substituições de prompt ficam em `direct`.
</Note>

**Diferença em relação ao comportamento de várias contas do Telegram:** No Telegram, `groups` raiz é suprimido intencionalmente para todas as contas em uma configuração de várias contas — até mesmo contas que não definem nenhum `groups` próprio — para impedir que um bot receba mensagens de grupo para grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração do WhatsApp com várias contas, se você quiser prompts de grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender de padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é tanto um mapa de configuração por grupo quanto a lista de permissões de grupo no nível do chat. No escopo raiz ou da conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Só adicione um `systemPrompt` de grupo curinga quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` para o padrão do prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida.
- Admissão de grupo e autorização de remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem chegar ao tratamento de grupos, mas por si só não autoriza todos os remetentes desses grupos. O acesso de remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` fornece apenas uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais `allowFrom` ou regras do armazenamento de pareamento.

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

## Indicadores da referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos de alto sinal do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- várias contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento da sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
