---
read_when:
    - Trabalhando no comportamento dos canais WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal do WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T12:15:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia as sessões vinculadas; não há um canal separado do Twilio WhatsApp.

## Instalação

`openclaw onboard` e `openclaw channels add --channel whatsapp` solicitam a instalação do plugin na primeira vez que ele é selecionado; `openclaw channels login --channel whatsapp` oferece o mesmo fluxo de instalação se o plugin estiver ausente. Checkouts de desenvolvimento usam o caminho local do plugin; instalações stable/beta instalam primeiro o `@openclaw/whatsapp` pelo ClawHub, com fallback para o npm. O runtime do WhatsApp é distribuído fora do pacote npm principal do OpenClaw, portanto suas dependências de runtime permanecem com o plugin externo. Instalação manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use o pacote npm sem qualificação (`@openclaw/whatsapp`) somente para o fallback do registro; fixe uma versão exata somente para uma instalação reproduzível.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de MD para remetentes desconhecidos é o pareamento.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e procedimentos de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Configurar a política de acesso">

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

  <Step title="Vincular o WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    O login é feito somente por QR. Em hosts remotos ou sem interface gráfica, tenha um meio confiável de enviar o QR ativo ao telefone antes de iniciar o login; códigos QR renderizados no terminal, capturas de tela ou anexos de chat podem expirar durante o envio.

    Para uma conta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para associar um diretório de autenticação existente/personalizado antes do login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprovar a primeira solicitação de pareamento (modo de pareamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    As solicitações de pareamento expiram após 1 hora; há um limite de 3 solicitações pendentes por conta.

  </Step>
</Steps>

<Note>
Recomenda-se um número separado do WhatsApp (a configuração e os metadados são otimizados para isso), mas configurações com número pessoal/chat consigo mesmo têm suporte completo.
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidade separada do WhatsApp para o OpenClaw
    - listas de permissões de MD e limites de roteamento mais claros
    - menor chance de confusão com chats consigo mesmo

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

  <Accordion title="Fallback para número pessoal">
    A integração inicial oferece suporte ao modo de número pessoal e grava uma configuração básica adequada para chats consigo mesmo: `dmPolicy: "allowlist"`, `allowFrom` incluindo seu próprio número, `selfChatMode: true`. As proteções de runtime para chats consigo mesmo usam como chave o próprio número vinculado mais `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway gerencia o socket do WhatsApp e o ciclo de reconexão.
- Um watchdog monitora dois sinais independentemente: a atividade bruta do transporte do WhatsApp Web e a atividade de mensagens do aplicativo. Uma sessão silenciosa, mas conectada, não é reiniciada apenas porque nenhuma mensagem chegou recentemente; ele força a reconexão somente quando os frames de transporte deixam de chegar durante uma janela interna fixa (não configurável pelo usuário) ou quando as mensagens do aplicativo permanecem ausentes por mais de 4x o tempo limite normal de mensagens. Logo após uma reconexão de uma sessão recentemente ativa, essa primeira janela usa o tempo limite normal de mensagens, mais curto, em vez da janela de 4x. O OpenClaw pode responder automaticamente às mensagens offline que o Baileys entrega no início dessa reconexão, limitado pelo período de vida da desduplicação de IDs de mensagens de entrada; a inicialização inicial mantém a proteção curta contra histórico obsoleto.
- Os tempos do socket do Baileys são explícitos em `web.whatsapp.*`: `keepAliveIntervalMs` (intervalo de ping do aplicativo), `connectTimeoutMs` (tempo limite do handshake inicial), `defaultQueryTimeoutMs` (esperas de consultas do Baileys, além dos tempos limite do OpenClaw para envio/presença de saída e confirmação de leitura de entrada).
- Os envios de saída exigem um listener ativo do WhatsApp para a conta de destino; caso contrário, os envios falham imediatamente.
- Os envios para grupos incluem metadados nativos de menção para tokens `@+<digits>` e `@<digits>` (no texto e nas legendas de mídia) quando o token corresponde aos metadados atuais de participantes, inclusive em grupos baseados em LID.
- Chats de status e transmissão (`@status`, `@broadcast`) são ignorados.
- Chats diretos usam regras de sessão de MD (`session.dmScope`; o padrão `main` reúne as MDs na sessão principal do agente). As sessões de grupo são isoladas por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Canais/Newsletters do WhatsApp podem ser destinos explícitos de saída por meio de seu JID `@newsletter` nativo, usando metadados de sessão do canal (`agent:<agentId>:whatsapp:channel:<jid>`) em vez da semântica de MD.
- O transporte do WhatsApp Web respeita as variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, incluindo variantes em minúsculas). Prefira a configuração de proxy no nível do host às configurações por canal.
- Com `messages.removeAckAfterReply` habilitado, o OpenClaw remove a reação de confirmação depois que uma resposta visível é entregue.

## Ligar para o solicitante atual com o MeowCaller (experimental)

O plugin pode disponibilizar `whatsapp_call` em turnos do agente originados no WhatsApp. Ele usa o [MeowCaller](https://github.com/purpshell/meowcaller) para realizar uma chamada de voz pelo WhatsApp para o solicitante autorizado atual e reproduzir uma mensagem TTS do OpenClaw após o atendimento. A ferramenta não tem parâmetro de número de destino, portanto um prompt não pode redirecionar a chamada. Desabilitado por padrão.

<Warning>
O MeowCaller é experimental, não tem versão identificada por tag e usa uma sessão de dispositivo vinculado do whatsmeow pareada separadamente — ele não pode reutilizar as credenciais do Baileys do plugin. O pareamento adiciona outro dispositivo vinculado à mesma conta do WhatsApp; escaneie com a identidade usada pelo OpenClaw. O modo de número pessoal/chat consigo mesmo não pode ligar para si próprio; use um número dedicado do OpenClaw para ligar para seu número pessoal.
</Warning>

<Steps>
  <Step title="Habilitar chamadas experimentais">

    Adicione `actions.calls: true` à configuração do canal do WhatsApp e reinicie o Gateway:

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

    Quando ausente ou definido como `false`, o OpenClaw não disponibiliza a ferramenta `whatsapp_call`.

  </Step>

  <Step title="Instalar a CLI revisada do MeowCaller">

    O adaptador espera um executável `meowcaller` no `PATH` do host do Gateway. Até que o [PR nº 7 do MeowCaller](https://github.com/purpshell/meowcaller/pull/7) seja integrado, compile o branch revisado:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Verifique se `$HOME/.local/bin` está no `PATH` do serviço do Gateway. Essa revisão contém comandos explícitos `pair` e `notify` somente para envio; `notify` não abre microfone, alto-falante, dispositivo de vídeo nem captura de diagnóstico. Não o substitua pelo comando `play` da CLI de exemplo upstream.

  </Step>

  <Step title="Parear o dispositivo vinculado do MeowCaller">

    Peça ao agente do WhatsApp para verificar a configuração de chamadas (a ação de status `whatsapp_call` informa o diretório de estado específico da conta e o comando de pareamento). Para a conta padrão:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Execute isso interativamente, escaneie o QR em **WhatsApp > Linked devices** e aguarde por `MeowCaller linked device ready`. Mantenha `wa-voip.db` privado — essa é a sessão do MeowCaller. Contas não padrão recebem seu próprio caminho de armazenamento pela ação de status; no Windows, execute o comando do PowerShell correspondente.

  </Step>

  <Step title="Configurar o TTS e ligar pelo WhatsApp">

    Configure um [provedor de TTS](/pt-BR/tools/tts) compatível com telefonia, reinicie o Gateway e envie uma solicitação como `Call me and say the build finished.` A ferramenta identifica o remetente pelo contexto de entrada confiável, sintetiza um arquivo WAV privado temporário, executa o MeowCaller durante uma janela de chamada limitada e exclui o arquivo de áudio posteriormente. O OpenClaw informa explicitamente o armazenamento da conta, aguarda um status de saída zero após o atendimento/reprodução/encerramento e trata um tempo limite ou status de saída diferente de zero como uma chamada de ferramenta com falha.

  </Step>
</Steps>

Limites: somente chamadas de áudio individuais de saída, nenhum número de destino arbitrário, nenhuma autenticação compartilhada com a conexão de chat, nenhuma chamada para si próprio no modo de número pessoal/chat consigo mesmo, áudio sintetizado limitado a 60 segundos, nenhuma confirmação de audibilidade no aparelho além da conclusão de atendimento/reprodução/encerramento do MeowCaller, e o OpenClaw encerra o processo complementar após uma janela limitada de 115-175 segundos (abrangendo as fases de conexão, atendimento, reprodução e encerramento do MeowCaller).

## Solicitações de aprovação

O WhatsApp pode renderizar solicitações de aprovação de execução e plugins como reações `👍`/`👎`, controladas pela configuração de encaminhamento de aprovações no nível superior:

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

`approvals.exec` e `approvals.plugin` são independentes; habilitar o WhatsApp como canal apenas vincula o transporte e não envia nada, a menos que a família de aprovações correspondente esteja habilitada e roteada para ele. O modo de sessão entrega aprovações nativas por emoji somente para aprovações originadas no WhatsApp. O modo de destino usa o pipeline de encaminhamento compartilhado para destinos explícitos e não cria uma distribuição separada para MDs de aprovadores.

As reações de aprovação do WhatsApp exigem aprovadores explícitos em `allowFrom` (ou `"*"`). `defaultTo` define destinos de mensagens padrão comuns, não uma lista de aprovadores. Comandos manuais `/approve` ainda passam pelo fluxo normal de autorização de remetentes do WhatsApp antes da resolução da aprovação.

## Hooks de plugins e privacidade

As mensagens de entrada do WhatsApp podem conter conteúdo pessoal, números de telefone, identificadores de grupos, nomes de remetentes e campos de correlação de sessões. O WhatsApp não transmite payloads do hook de entrada `message_received` aos plugins, a menos que essa opção seja habilitada:

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

Restrinja a habilitação a uma conta em `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Habilite isso somente para plugins nos quais se confia para acessar o conteúdo e os identificadores de entrada do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de MD">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamento |
    | --- | --- |
    | `pairing` (padrão) | Remetentes desconhecidos solicitam pareamento; o proprietário aprova |
    | `allowlist` | Somente remetentes de `allowFrom` são admitidos |
    | `open` | Exige que `allowFrom` inclua `"*"` |
    | `disabled` | Bloqueia todas as MDs |

    `allowFrom` aceita números no formato E.164 (normalizados internamente). Trata-se apenas de uma lista de controle de acesso para remetentes de MD — ela não restringe envios explícitos de saída para JIDs de grupos nem JIDs de canais `@newsletter`.

    Substituição para várias contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `.allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Observações sobre o runtime:

    - os pareamentos persistem no armazenamento de permissões do canal e são mesclados com `allowFrom` configurado
    - a automação agendada e o fallback de destinatário do Heartbeat usam destinos de entrega explícitos ou `allowFrom` configurado; aprovações de pareamento de MD não são destinatários implícitos de Cron/Heartbeat
    - se nenhuma lista de permissões estiver configurada, o próprio número vinculado será permitido por padrão
    - o OpenClaw nunca pareia automaticamente MDs `fromMe` de saída (mensagens que você envia para si mesmo pelo dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos e listas de permissões">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissões de participação em grupos** (`channels.whatsapp.groups`): se `groups` for omitido, todos os grupos serão elegíveis; se estiver presente, atuará como uma lista de permissões de grupos (`"*"` permite todos).
    2. **Política de remetentes de grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` ignora a lista de permissões de remetentes, `allowlist` exige uma correspondência de `groupAllowFrom` (ou `*`), `disabled` bloqueia todas as mensagens de entrada de grupos.

    Se `groupAllowFrom` não estiver definido, as verificações de remetente usarão `allowFrom` como fallback quando houver entradas. As listas de permissões de remetentes são avaliadas antes da ativação por menção/resposta.

    Se não houver nenhum bloco `channels.whatsapp`, o runtime usará `groupPolicy: "allowlist"` como fallback (com um aviso no log), mesmo que `channels.defaults.groupPolicy` esteja definido como outra opção.

    <Note>
    A resolução da participação em grupos tem uma proteção para conta única: se apenas uma conta do WhatsApp estiver configurada e seu `accounts.<id>.groups` for um objeto vazio explícito (`{}`), isso será tratado como "não definido" e usará o mapa `channels.whatsapp.groups` raiz como fallback, em vez de bloquear silenciosamente todos os grupos. Com 2 ou mais contas configuradas, um mapa de conta explicitamente vazio permanece vazio e não usa fallback — isso permite que uma conta desative intencionalmente todos os grupos sem afetar as demais.
    </Note>

  </Tab>

  <Tab title="Menções e /activation">
    Por padrão, as respostas em grupos exigem uma menção. A detecção de menções inclui:

    - menções explícitas no WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - transcrições de mensagens de voz recebidas em mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Segurança: citar/responder apenas satisfaz o requisito de menção — isso **não** concede autorização ao remetente. Com `groupPolicy: "allowlist"`, remetentes que não estão na lista de permissões continuam bloqueados mesmo ao responder à mensagem de um usuário permitido.

    Comando de ativação no nível da sessão: `/activation mention` ou `/activation always`. Isso atualiza o estado da sessão (não a configuração global) e é restrito ao proprietário.

  </Tab>
</Tabs>

## Vinculações de ACP configuradas

O WhatsApp oferece suporte a vinculações persistentes de ACP por meio de `bindings[]` no nível superior:

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

Conversas diretas correspondem a números E.164; grupos correspondem a JIDs de grupos do WhatsApp. As listas de permissões de grupos, a política de remetentes e o controle de menção/ativação são executados antes que o OpenClaw garanta a existência da sessão de ACP vinculada. Uma vinculação correspondente controla a rota — grupos de transmissão não distribuem esse turno para sessões comuns do WhatsApp.

## Comportamento de número pessoal e conversa consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, as proteções para conversas consigo mesmo são ativadas: ignoram confirmações de leitura nesses turnos, ignoram o comportamento de acionamento automático por JID de menção que enviaria uma notificação para você mesmo e direcionam as respostas por padrão a `[{identity.name}]` (ou `[openclaw]`) quando `messages.responsePrefix` não está definido.

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada e contexto da resposta">
    As mensagens recebidas são encapsuladas no envelope de entrada compartilhado. Uma resposta citada acrescenta contexto neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Os metadados da resposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente) são preenchidos quando disponíveis. Se o destino citado for uma mídia que pode ser baixada, o OpenClaw a salva por meio do armazenamento normal de mídia recebida e expõe `MediaPath`/`MediaType` para que o agente possa inspecioná-la diretamente, em vez de ver apenas `<media:image>`.

  </Accordion>

  <Accordion title="Espaços reservados de mídia e extração de localização/contato">
    Mensagens contendo apenas mídia são normalizadas para espaços reservados: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Mensagens de voz autorizadas em grupos são transcritas antes do controle de menção quando o corpo contém apenas `<media:audio>`, portanto, pronunciar a menção ao bot na mensagem de voz pode acionar a resposta. Se a transcrição ainda não mencionar o bot, ela permanecerá no histórico pendente do grupo, em vez do espaço reservado bruto.

    Os corpos de localização são renderizados como texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco delimitado, não como texto em linha no prompt.

  </Accordion>

  <Accordion title="Injeção do histórico pendente do grupo">
    Mensagens de grupo não processadas são armazenadas em buffer e injetadas como contexto quando o bot finalmente é acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`, com fallback para `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção: `[Chat messages since your last reply - for context]` e `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Confirmações de leitura">
    Ativadas por padrão para mensagens de entrada aceitas. Para desativar globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Substituição por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Turnos de conversas consigo mesmo ignoram as confirmações de leitura mesmo quando ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em partes e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em partes">
    - limite padrão por parte: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` prioriza os limites de parágrafos (linhas em branco) e depois usa como fallback uma divisão segura por tamanho

  </Accordion>

  <Accordion title="Comportamento da mídia de saída">
    - oferece suporte a cargas de imagem, vídeo, áudio (mensagem de voz PTT) e documento
    - o áudio é enviado como carga `audio` do Baileys com `ptt: true`, sendo renderizado como uma mensagem de voz push-to-talk; `audioAsVoice` é preservado nas cargas de resposta para que a saída de mensagem de voz por TTS permaneça nesse caminho, independentemente do formato de origem do provedor
    - áudio Ogg/Opus nativo é enviado como `audio/ogg; codecs=opus`; qualquer outro formato (incluindo saídas MP3/WebM do TTS do Microsoft Edge) é transcodificado com `ffmpeg` para Ogg/Opus mono de 48 kHz antes da entrega por PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma única mensagem de voz e impede envios repetidos da mesma resposta; `/tts chat on|off|default` controla o TTS automático da conversa atual
    - `gifPlayback: true` em envios de vídeo ativa a reprodução como GIF animado
    - `forceDocument`/`asDocument` encaminha imagens, GIFs e vídeos de saída pela carga de documento do Baileys para evitar a compactação de mídia do WhatsApp, preservando o nome de arquivo e o tipo MIME resolvidos
    - as legendas são aplicadas ao primeiro item de mídia em uma resposta com várias mídias, exceto mensagens de voz PTT: o áudio é enviado primeiro sem legenda, e depois a legenda é enviada como uma mensagem de texto separada (os clientes do WhatsApp não renderizam legendas de mensagens de voz de forma consistente)
    - a origem da mídia pode ser HTTP(S), `file://` ou um caminho local

  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite para salvar mídias de entrada e enviar mídias de saída: `channels.whatsapp.mediaMaxMb` (padrão: `50`)
    - substituição por conta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - as imagens são otimizadas automaticamente (redimensionamento/variação de qualidade) para respeitar os limites, a menos que `forceDocument`/`asDocument` solicite a entrega como documento
    - em caso de falha no envio de mídia, o fallback do primeiro item envia um aviso de texto, em vez de descartar silenciosamente a resposta

  </Accordion>
</AccordionGroup>

## Citação de respostas

`channels.whatsapp.replyToMode` controla a citação nativa de respostas (as respostas de saída citam visivelmente a mensagem recebida):

| Valor             | Comportamento                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (padrão) | Nunca citar; enviar como mensagem simples                           |
| `"first"`         | Citar apenas a primeira parte da resposta de saída                      |
| `"all"`           | Citar todas as partes da resposta de saída                               |
| `"batched"`       | Citar respostas em lote na fila; deixar respostas imediatas sem citação |

Substituição por conta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nível de reações

`channels.whatsapp.reactionLevel` controla a abrangência do uso de reações com emojis pelo agente:

| Nível                 | Reações de confirmação | Reações iniciadas pelo agente  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Não            | Não                         |
| `"ack"`               | Sim           | Não                         |
| `"minimal"` (padrão) | Sim           | Sim, orientação conservadora |
| `"extensive"`         | Sim           | Sim, orientação incentivada   |

Substituição por conta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reações de confirmação

`channels.whatsapp.ackReaction` envia uma reação imediata ao receber uma mensagem, controlada por `reactionLevel` (suprimida quando `"off"`):

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

Observações: enviada imediatamente após a aceitação da mensagem de entrada (antes da resposta); se `ackReaction` estiver presente sem `emoji`, o WhatsApp usará o emoji de identidade do agente encaminhado, com fallback para "👀" (omita `ackReaction` ou defina `emoji: ""` para não enviar confirmação); as falhas são registradas, mas não bloqueiam a entrega da resposta; o modo de grupo `mentions` reage apenas em turnos acionados por menção, enquanto a ativação de grupo `always` ignora essa verificação; o WhatsApp usa apenas `channels.whatsapp.ackReaction` (o `messages.ackReaction` legado não se aplica aqui).

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o WhatsApp substitua a reação de confirmação durante um turno, em vez de manter um emoji de recebimento estático, alternando entre estados como na fila, pensando, atividade de ferramenta, Compaction, concluído e erro:

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

Observações: `channels.whatsapp.ackReaction` ainda controla a elegibilidade para mensagens diretas e grupos; o estado na fila usa o mesmo emoji efetivo das reações de confirmação simples; o WhatsApp tem um slot de reação do bot por mensagem, portanto, as atualizações do ciclo de vida substituem a reação atual no mesmo lugar; `messages.removeAckAfterReply: true` remove a reação de status final após o período configurado de permanência do estado concluído/erro; as categorias de emoji de ferramentas incluem `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Várias contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    Os ids de conta vêm de `channels.whatsapp.accounts`. A seleção da conta padrão é `default`, se estiver presente; caso contrário, é o primeiro id de conta configurado (em ordem alfabética). Os ids de conta são normalizados internamente para consulta.
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (backup: `creds.json.bak`)
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos da conta padrão

  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp dessa conta. Quando um gateway está acessível, o logout primeiro interrompe o listener ativo dessa conta, para que a sessão vinculada pare de receber mensagens antes da próxima reinicialização. `openclaw channels remove --channel whatsapp` também interrompe o listener ativo antes de desabilitar ou excluir a configuração da conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Controles de ações: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (as ações existentes usam `true` por padrão), `channels.whatsapp.actions.calls` (padrão `false`, consulte MeowCaller acima).
- As gravações de configuração iniciadas pelo canal são habilitadas por padrão; desabilite-as por meio de `channels.whatsapp.configWrites: false`.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: o status do canal informa que ele não está vinculado.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Vinculado, mas desconectado/loop de reconexão">
    Sintoma: conta vinculada com desconexões ou tentativas de reconexão repetidas.

    Contas inativas podem permanecer conectadas além do tempo limite normal de mensagens; o watchdog só reinicia quando a atividade do transporte do WhatsApp Web é interrompida, o socket é fechado ou a atividade no nível da aplicação permanece inativa além da janela de segurança mais longa (consulte Modelo de runtime acima).

    Se os logs mostrarem `status=408 Request Time-out Connection was lost` repetidamente, ajuste os tempos do socket do Baileys em `web.whatsapp`. Comece reduzindo `keepAliveIntervalMs` para um valor inferior ao tempo limite de inatividade da sua rede e aumentando `connectTimeoutMs` em conexões lentas ou com perdas:

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

    Se o loop persistir após a correção da conectividade do host e dos tempos, faça backup do diretório de autenticação da conta e vincule-a novamente:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` indicar `Gateway inactive`, mas `openclaw gateway status` e `openclaw channels status --probe` mostrarem que tudo está íntegro, execute `openclaw doctor`. No Linux, o doctor alerta sobre entradas legadas no crontab que invocam o script descontinuado `~/.openclaw/bin/ensure-whatsapp.sh`; remova essas entradas com `crontab -e` — o cron pode não ter o ambiente do barramento de usuário do systemd e fazer com que esse script antigo informe incorretamente a integridade do gateway.

  </Accordion>

  <Accordion title="O login por QR expira atrás de um proxy">
    Sintoma: `openclaw channels login --channel whatsapp` falha antes de exibir um QR utilizável, com `status=408 Request Time-out` ou uma desconexão de socket TLS.

    O login do WhatsApp Web usa o ambiente de proxy padrão do host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes em minúsculas, `NO_PROXY`). Verifique se o processo do gateway herda as variáveis de ambiente do proxy e se `NO_PROXY` não corresponde a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nenhum listener ativo durante o envio">
    Os envios de saída falham imediatamente quando não há um listener ativo do gateway para a conta de destino. Confirme se o gateway está em execução e se a conta está vinculada.
  </Accordion>

  <Accordion title="A resposta aparece na transcrição, mas não no WhatsApp">
    As linhas da transcrição registram o que o agente gerou; a entrega pelo WhatsApp é verificada separadamente. O OpenClaw só considera uma resposta automática como enviada depois que o Baileys retorna um id de mensagem de saída para pelo menos um envio visível de texto ou mídia.

    As reações de confirmação são recibos independentes anteriores à resposta — uma reação bem-sucedida não comprova que a resposta posterior de texto/mídia foi aceita. Verifique se os logs do gateway contêm `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entradas da lista de permissões `groups`, controle por menção (`requireMention` + padrões de menção) e chaves duplicadas em `openclaw.json` (entradas posteriores do JSON5 substituem as anteriores — mantenha apenas um `groupPolicy` por escopo).

    Se `channels.whatsapp.groups` estiver presente, o WhatsApp ainda poderá observar mensagens de outros grupos, mas o OpenClaw as descartará antes do roteamento da sessão. Adicione o JID do grupo a `channels.whatsapp.groups` ou adicione `groups["*"]` para admitir todos os grupos, mantendo a autorização do remetente em `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Aviso do runtime Bun">
    Os gateways do OpenClaw exigem Node. O Bun não fornece a API `node:sqlite` usada pelo armazenamento de estado canônico, e o doctor migra serviços Bun legados para Node.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo do Telegram para grupos e conversas diretas por meio dos mapas `groups` e `direct`.

Resolução para mensagens de grupo: primeiro, determina-se o mapa `groups` efetivo — se a conta definir sua própria chave `groups`, ela substituirá completamente o mapa raiz `groups` (sem mesclagem profunda). Em seguida, a consulta do prompt é executada nesse único mapa resultante:

1. **Prompt específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada do grupo existe **e** sua chave `systemPrompt` está definida. Uma string vazia (`""`) suprime o curinga e não aplica nenhum prompt.
2. **Prompt curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está ausente ou existe sem uma chave `systemPrompt`.

A resolução para mensagens diretas segue o mesmo padrão no mapa `direct` e em `direct["*"]`.

<Note>
`dms` continua sendo o contêiner leve de substituição do histórico por mensagem direta (`dms.<id>.historyLimit`). As substituições de prompt ficam em `direct`.
</Note>

<Note>
Esse comportamento em que a conta substitui a raiz na resolução de prompts é uma substituição superficial simples: qualquer chave `groups`/`direct` da conta, incluindo um objeto vazio explícito, substitui o mapa raiz. Ele difere da verificação da lista de permissões de participação em grupos descrita acima, que possui uma proteção para uma única conta no caso de um `groups: {}` acidentalmente vazio.
</Note>

**Diferença em relação ao Telegram:** o Telegram suprime o `groups` raiz para todas as contas em uma configuração com várias contas (até mesmo para contas sem um `groups` próprio), para impedir que um bot receba mensagens de grupos dos quais não participa. O WhatsApp não aplica essa proteção — `groups`/`direct` raiz são herdados por qualquer conta sem uma substituição própria, independentemente da quantidade de contas. Em uma configuração do WhatsApp com várias contas, defina explicitamente o mapa completo em cada conta se quiser prompts específicos por conta.

Comportamentos importantes:

- `channels.whatsapp.groups` é tanto um mapa de configuração por grupo quanto a lista de permissões de grupos no nível da conversa. No escopo raiz ou da conta, `groups["*"]` significa "todos os grupos são admitidos" nesse escopo.
- Adicione um curinga `systemPrompt` somente quando já quiser que esse escopo admita todos os grupos. Para manter apenas um conjunto fixo de ids de grupo elegíveis, repita o prompt em cada entrada explicitamente permitida em vez de usar `groups["*"]`.
- A admissão do grupo e a autorização do remetente são verificações separadas. `groups["*"]` amplia quais grupos chegam ao processamento de grupos; isso não autoriza todos os remetentes nesses grupos — esse controle continua sendo feito por `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` não tem efeito colateral equivalente para mensagens diretas: `direct["*"]` apenas fornece uma configuração padrão depois que uma mensagem direta já foi admitida por `dmPolicy` em conjunto com `allowFrom` ou com as regras do armazenamento de pareamento.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use somente se todos os grupos devam ser admitidos no escopo raiz.
        // Aplica-se a todas as contas que não definem seu próprio mapa groups.
        "*": { systemPrompt: "Prompt padrão para todos os grupos." },
      },
      direct: {
        // Aplica-se a todas as contas que não definem seu próprio mapa direct.
        "*": { systemPrompt: "Prompt padrão para todas as conversas diretas." },
      },
      accounts: {
        work: {
          groups: {
            // Esta conta define seu próprio groups; portanto, o groups raiz é
            // completamente substituído. Para manter um curinga, defina "*" explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentre-se no gerenciamento de projetos.",
            },
            // Use somente se todos os grupos devam ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio mapa direct; portanto, as entradas direct
            // raiz são completamente substituídas. Para manter um curinga, defina "*" explicitamente aqui também.
            "+15551234567": { systemPrompt: "Prompt para uma conversa direta de trabalho específica." },
            "*": { systemPrompt: "Prompt padrão para conversas diretas de trabalho." },
          },
        },
      },
    },
  },
}
```

## Referências da configuração

Referência principal: [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

| Área                  | Campos                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acesso                | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega               | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Várias contas         | `accounts.<id>.enabled`, `accounts.<id>.authDir` e outras substituições por conta                              |
| Operações             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamento da sessão | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts               | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
