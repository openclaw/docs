---
read_when:
    - Trabalhando no comportamento do canal do WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal do WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-07-11T23:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia as sessões vinculadas; não há um canal separado do Twilio para WhatsApp.

## Instalação

`openclaw onboard` e `openclaw channels add --channel whatsapp` solicitam a instalação do plugin na primeira vez que você o seleciona; `openclaw channels login --channel whatsapp` oferece o mesmo fluxo de instalação se o plugin estiver ausente. Checkouts de desenvolvimento usam o caminho local do plugin; instalações estáveis/beta instalam primeiro `@openclaw/whatsapp` pelo ClawHub, com fallback para o npm. O runtime do WhatsApp é distribuído fora do pacote npm principal do OpenClaw, portanto suas dependências de runtime permanecem com o plugin externo. Instalação manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use o pacote npm sem prefixo (`@openclaw/whatsapp`) somente para o fallback do registro; fixe uma versão exata apenas para uma instalação reproduzível.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de MD é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e guias de reparo.
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

    O login é feito exclusivamente por QR. Em hosts remotos ou sem interface gráfica, tenha um meio confiável de enviar o QR ativo ao telefone antes de iniciar o login; QRs renderizados no terminal, capturas de tela ou anexos de chat podem expirar durante o envio.

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

    As solicitações de pareamento expiram após 1 hora; o limite é de 3 solicitações pendentes por conta.

  </Step>
</Steps>

<Note>
Recomenda-se um número separado do WhatsApp (a configuração e os metadados são otimizados para isso), mas configurações com número pessoal/conversa consigo mesmo são totalmente compatíveis.
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidade separada do WhatsApp para o OpenClaw
    - listas de permissões de MD e limites de roteamento mais claros
    - menor chance de confusão em conversas consigo mesmo

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
    A integração inicial é compatível com o modo de número pessoal e grava uma configuração de referência apropriada para conversas consigo mesmo: `dmPolicy: "allowlist"`, `allowFrom` incluindo seu próprio número e `selfChatMode: true`. As proteções de runtime para conversas consigo mesmo usam o próprio número vinculado em conjunto com `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway gerencia o socket do WhatsApp e o ciclo de reconexão.
- Um watchdog monitora dois sinais de forma independente: a atividade bruta do transporte do WhatsApp Web e a atividade de mensagens do aplicativo. Uma sessão silenciosa, mas conectada, não é reiniciada apenas porque nenhuma mensagem chegou recentemente; ela força uma reconexão somente quando os frames de transporte param de chegar durante uma janela interna fixa (não configurável pelo usuário) ou quando as mensagens do aplicativo permanecem inativas além de quatro vezes o tempo limite normal de mensagens. Logo após uma reconexão de uma sessão recentemente ativa, a primeira janela usa o tempo limite normal de mensagens, mais curto, em vez da janela quatro vezes maior. O OpenClaw pode responder automaticamente a mensagens offline que o Baileys entrega no início dessa reconexão, limitado pelo período de deduplicação dos IDs das mensagens recebidas; a inicialização mantém a proteção curta contra histórico obsoleto.
- Os tempos do socket do Baileys são definidos explicitamente em `web.whatsapp.*`: `keepAliveIntervalMs` (intervalo de ping do aplicativo), `connectTimeoutMs` (tempo limite do handshake de abertura), `defaultQueryTimeoutMs` (esperas de consultas do Baileys, além dos tempos limite de envio/presença de saída e confirmação de leitura de entrada do OpenClaw).
- Os envios de saída exigem um listener ativo do WhatsApp para a conta de destino; caso contrário, falham imediatamente.
- Os envios para grupos anexam metadados nativos de menção para tokens `@+<digits>` e `@<digits>` (no texto e nas legendas de mídia) quando o token corresponde aos metadados atuais de um participante, inclusive em grupos baseados em LID.
- Conversas de status e transmissão (`@status`, `@broadcast`) são ignoradas.
- Conversas diretas usam as regras de sessão de MD (`session.dmScope`; o padrão `main` reúne as MDs na sessão principal do agente). As sessões de grupo são isoladas por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Canais/boletins informativos do WhatsApp podem ser destinos explícitos de saída por meio de seu JID nativo `@newsletter`, usando metadados de sessão de canal (`agent:<agentId>:whatsapp:channel:<jid>`) em vez da semântica de MD.
- O transporte do WhatsApp Web respeita as variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` e variantes em minúsculas). Prefira a configuração de proxy no nível do host às configurações por canal.
- Com `messages.removeAckAfterReply` habilitado, o OpenClaw remove a reação de confirmação depois que uma resposta visível é entregue.

## Ligar para o solicitante atual com o MeowCaller (experimental)

O plugin pode disponibilizar `whatsapp_call` em turnos do agente originados no WhatsApp. Ele usa o [MeowCaller](https://github.com/purpshell/meowcaller) para fazer uma chamada de voz pelo WhatsApp ao solicitante autorizado atual e reproduzir uma mensagem de TTS do OpenClaw depois que ele atender. A ferramenta não possui parâmetro de número de destino, portanto um prompt não pode redirecionar a chamada. Desabilitada por padrão.

<Warning>
O MeowCaller é experimental, não possui versão com tag e usa uma sessão de dispositivo vinculado do whatsmeow pareada separadamente — ele não pode reutilizar as credenciais do Baileys do plugin. O pareamento adiciona outro dispositivo vinculado à mesma conta do WhatsApp; escaneie usando a identidade utilizada pelo OpenClaw. O modo de número pessoal/conversa consigo mesmo não pode ligar para si próprio; use um número dedicado do OpenClaw para ligar para seu número pessoal.
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

    O adaptador espera um executável `meowcaller` no `PATH` do host do Gateway. Até que o [PR nº 7 do MeowCaller](https://github.com/purpshell/meowcaller/pull/7) seja mesclado, compile o branch revisado:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Verifique se `$HOME/.local/bin` está no `PATH` do serviço do Gateway. Essa revisão possui comandos explícitos `pair` e `notify`, somente para envio; `notify` não abre microfone, alto-falante, dispositivo de vídeo nem captura de diagnóstico. Não substitua pelo comando `play` da CLI de exemplo do upstream.

  </Step>

  <Step title="Parear o dispositivo vinculado do MeowCaller">

    Peça ao agente do WhatsApp para verificar a configuração de chamadas (a ação de status de `whatsapp_call` informa o diretório de estado específico da conta e o comando de pareamento). Para a conta padrão:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Execute isso interativamente, escaneie o QR em **WhatsApp > Linked devices** e aguarde `MeowCaller linked device ready`. Mantenha `wa-voip.db` privado — ele contém a sessão do MeowCaller. Contas que não sejam a padrão recebem seu próprio caminho de armazenamento pela ação de status; no Windows, execute o comando correspondente do PowerShell.

  </Step>

  <Step title="Configurar TTS e ligar pelo WhatsApp">

    Configure um [provedor de TTS](/pt-BR/tools/tts) compatível com telefonia, reinicie o Gateway e envie uma solicitação como `Ligue para mim e diga que a compilação terminou.` A ferramenta identifica o remetente pelo contexto confiável da mensagem recebida, sintetiza um arquivo WAV privado temporário, executa o MeowCaller durante uma janela de chamada limitada e exclui o arquivo de áudio ao final. O OpenClaw fornece explicitamente o armazenamento da conta, aguarda um status de saída zero após atendimento/reprodução/encerramento e trata um tempo limite ou status de saída diferente de zero como falha na chamada da ferramenta.

  </Step>
</Steps>

Limites: somente chamadas de áudio de saída individuais, sem números de destino arbitrários, sem autenticação compartilhada com a conexão de chat, sem chamadas para si próprio no modo de número pessoal/conversa consigo mesmo, áudio sintetizado limitado a 60 segundos, sem confirmação de audibilidade no aparelho além da conclusão de atendimento/reprodução/encerramento do MeowCaller, e o OpenClaw encerra o processo complementar após uma janela limitada de 115 a 175 segundos (abrangendo as fases de conexão, atendimento, reprodução e encerramento do MeowCaller).

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

`approvals.exec` e `approvals.plugin` são independentes; habilitar o WhatsApp como canal apenas vincula o transporte e não envia nada, a menos que a família de aprovações correspondente esteja habilitada e roteada para ele. O modo de sessão fornece aprovações nativas por emoji somente para aprovações originadas no WhatsApp. O modo de destino usa o pipeline compartilhado de encaminhamento para destinos explícitos e não cria uma distribuição separada para MDs de aprovadores.

As reações de aprovação do WhatsApp exigem aprovadores explícitos em `allowFrom` (ou `"*"`). `defaultTo` define destinos padrão para mensagens comuns, não uma lista de aprovadores. Comandos manuais `/approve` ainda passam pelo fluxo normal de autorização do remetente do WhatsApp antes da resolução da aprovação.

## Hooks de plugins e privacidade

Mensagens recebidas do WhatsApp podem conter conteúdo pessoal, números de telefone, identificadores de grupos, nomes de remetentes e campos de correlação de sessão. O WhatsApp não transmite payloads do hook `message_received` de mensagens recebidas para plugins, a menos que você habilite explicitamente essa opção:

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

Restrinja a habilitação a uma conta em `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Habilite isso somente para plugins nos quais você confia para acessar conteúdo e identificadores recebidos pelo WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de MD">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamento |
    | --- | --- |
    | `pairing` (padrão) | Remetentes desconhecidos solicitam pareamento; o proprietário aprova |
    | `allowlist` | Somente remetentes em `allowFrom` são admitidos |
    | `open` | Exige que `allowFrom` inclua `"*"` |
    | `disabled` | Bloqueia todas as MDs |

    `allowFrom` aceita números no formato E.164 (normalizados internamente). Trata-se apenas de uma lista de controle de acesso de remetentes de MD — ela não restringe envios explícitos para JIDs de grupo ou JIDs de canal `@newsletter`.

    Substituição para múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `.allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Observações de runtime:

    - os pareamentos persistem no armazenamento de permissões do canal e são combinados com o `allowFrom` configurado
    - a automação agendada e o fallback de destinatário de Heartbeat usam destinos de entrega explícitos ou o `allowFrom` configurado; aprovações de pareamento por mensagem direta não tornam o remetente implicitamente destinatário de Cron/Heartbeat
    - se nenhuma lista de permissões estiver configurada, o próprio número vinculado será permitido por padrão
    - o OpenClaw nunca pareia automaticamente mensagens diretas de saída com `fromMe` (mensagens que você envia para si mesmo pelo dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos e listas de permissões">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissões de participação em grupos** (`channels.whatsapp.groups`): se `groups` for omitido, todos os grupos serão elegíveis; se estiver presente, funcionará como uma lista de permissões de grupos (`"*"` permite todos).
    2. **Política de remetentes em grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` ignora a lista de permissões de remetentes, `allowlist` exige uma correspondência em `groupAllowFrom` (ou `*`) e `disabled` bloqueia todas as mensagens recebidas de grupos.

    Se `groupAllowFrom` não estiver definido, as verificações de remetente recorrerão a `allowFrom` quando ele tiver entradas. As listas de permissões de remetentes são avaliadas antes da ativação por menção/resposta.

    Se não houver nenhum bloco `channels.whatsapp`, o runtime recorrerá a `groupPolicy: "allowlist"` (com um registro de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido com outro valor.

    <Note>
    A resolução de participação em grupos tem uma proteção para conta única: se apenas uma conta do WhatsApp estiver configurada e o `accounts.<id>.groups` dela for um objeto vazio explícito (`{}`), isso será tratado como "não definido" e recorrerá ao mapa `channels.whatsapp.groups` da raiz, em vez de bloquear silenciosamente todos os grupos. Com duas ou mais contas configuradas, um mapa de conta explicitamente vazio continuará vazio e não recorrerá à raiz — isso permite que uma conta desative intencionalmente todos os grupos sem afetar as demais.
    </Note>

  </Tab>

  <Tab title="Menções e /activation">
    Por padrão, as respostas em grupos exigem uma menção. A detecção de menções inclui:

    - menções explícitas no WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - transcrições de mensagens de voz recebidas em mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (o remetente da mensagem respondida corresponde à identidade do bot)

    Segurança: citar/responder apenas satisfaz o requisito de menção — isso **não** concede autorização ao remetente. Com `groupPolicy: "allowlist"`, remetentes que não estão na lista de permissões continuam bloqueados mesmo ao responder à mensagem de um usuário permitido.

    Comando de ativação no nível da sessão: `/activation mention` ou `/activation always`. Isso atualiza o estado da sessão (não a configuração global) e é restrito ao proprietário.

  </Tab>
</Tabs>

## Vinculações ACP configuradas

O WhatsApp oferece suporte a vinculações ACP persistentes por meio de `bindings[]` no nível superior:

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

Conversas diretas correspondem a números E.164; grupos correspondem a JIDs de grupo do WhatsApp. Listas de permissões de grupos, a política de remetentes e o requisito de menção/ativação são processados antes que o OpenClaw garanta a existência da sessão ACP vinculada. Uma vinculação correspondente assume o controle da rota — grupos de transmissão não distribuem esse turno para sessões comuns do WhatsApp.

## Comportamento de número pessoal e conversa consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, as proteções para conversas consigo mesmo são ativadas: as confirmações de leitura são ignoradas nesses turnos, o comportamento de acionamento automático por JID de menção que enviaria uma notificação para você mesmo é ignorado e as respostas usam `[{identity.name}]` (ou `[openclaw]`) por padrão quando `messages.responsePrefix` não está definido.

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada e contexto de resposta">
    As mensagens recebidas são encapsuladas no envelope de entrada compartilhado. Uma resposta citada acrescenta o contexto neste formato:

    ```text
    [Respondendo a <sender> id:<stanzaId>]
    <corpo citado ou espaço reservado de mídia>
    [/Respondendo]
    ```

    Os metadados da resposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente) são preenchidos quando disponíveis. Se o alvo citado for uma mídia que possa ser baixada, o OpenClaw a salva por meio do armazenamento normal de mídias recebidas e disponibiliza `MediaPath`/`MediaType` para que o agente possa inspecioná-la diretamente, em vez de ver apenas `<media:image>`.

  </Accordion>

  <Accordion title="Espaços reservados de mídia e extração de localização/contato">
    Mensagens que contêm apenas mídia são normalizadas em espaços reservados: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Mensagens de voz autorizadas em grupos são transcritas antes da verificação de menção quando o corpo contém apenas `<media:audio>`, de modo que dizer a menção ao bot na mensagem de voz possa acionar a resposta. Se a transcrição ainda não mencionar o bot, ela permanecerá no histórico pendente do grupo, em vez do espaço reservado bruto.

    Os corpos de localização são renderizados como texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco delimitado, e não como texto embutido no prompt.

  </Accordion>

  <Accordion title="Injeção do histórico pendente do grupo">
    Mensagens de grupo não processadas são armazenadas em buffer e injetadas como contexto quando o bot finalmente é acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`, com fallback para `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção: `[Mensagens da conversa desde sua última resposta - para contexto]` e `[Mensagem atual - responda a esta]`.

  </Accordion>

  <Accordion title="Confirmações de leitura">
    Ativadas por padrão para mensagens recebidas aceitas. Para desativar globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Substituição por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Turnos de conversa consigo mesmo ignoram as confirmações de leitura mesmo quando elas estão ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em blocos e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em blocos">
    - limite padrão por bloco: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` prioriza limites de parágrafo (linhas em branco) e depois recorre à divisão segura por comprimento

  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a cargas de imagem, vídeo, áudio (mensagem de voz PTT) e documento
    - o áudio é enviado como a carga `audio` do Baileys com `ptt: true`, sendo renderizado como uma mensagem de voz do tipo pressione para falar; `audioAsVoice` é preservado nas cargas de resposta para que a saída de mensagem de voz por TTS continue nesse fluxo, independentemente do formato de origem do provedor
    - áudio nativo Ogg/Opus é enviado como `audio/ogg; codecs=opus`; qualquer outro formato (incluindo saídas MP3/WebM do TTS do Microsoft Edge) é transcodificado com `ffmpeg` para Ogg/Opus mono de 48 kHz antes da entrega PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma única mensagem de voz e impede envios repetidos da mesma resposta; `/tts chat on|off|default` controla o TTS automático da conversa atual
    - `gifPlayback: true` em envios de vídeo ativa a reprodução de GIF animado
    - `forceDocument`/`asDocument` encaminha imagens, GIFs e vídeos de saída pela carga de documento do Baileys para evitar a compactação de mídia do WhatsApp, preservando o nome de arquivo e o tipo MIME resolvidos
    - as legendas são aplicadas ao primeiro item de mídia em uma resposta com várias mídias, exceto em mensagens de voz PTT: o áudio é enviado primeiro sem legenda e, em seguida, a legenda é enviada como uma mensagem de texto separada (os clientes do WhatsApp não renderizam legendas de mensagens de voz de forma consistente)
    - a origem da mídia pode ser HTTP(S), `file://` ou um caminho local

  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite para salvar mídias recebidas e enviar mídias de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituição por conta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - as imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para respeitar os limites, a menos que `forceDocument`/`asDocument` solicite a entrega como documento
    - em caso de falha no envio de mídia, o fallback do primeiro item envia um aviso de texto em vez de descartar silenciosamente a resposta

  </Accordion>
</AccordionGroup>

## Citação de respostas

`channels.whatsapp.replyToMode` controla a citação nativa de respostas (as respostas de saída citam visivelmente a mensagem recebida):

| Valor              | Comportamento                                                    |
| ------------------ | ---------------------------------------------------------------- |
| `"off"` (padrão)   | Nunca cita; envia como uma mensagem simples                      |
| `"first"`          | Cita apenas o primeiro bloco da resposta de saída                |
| `"all"`            | Cita todos os blocos da resposta de saída                        |
| `"batched"`        | Cita respostas agrupadas na fila; deixa respostas imediatas sem citação |

Substituição por conta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nível de reações

`channels.whatsapp.reactionLevel` controla a abrangência do uso de reações com emojis pelo agente:

| Nível                  | Reações de confirmação | Reações iniciadas pelo agente       |
| ---------------------- | ---------------------- | ----------------------------------- |
| `"off"`                | Não                    | Não                                 |
| `"ack"`                | Sim                    | Não                                 |
| `"minimal"` (padrão)   | Sim                    | Sim, com orientação conservadora    |
| `"extensive"`          | Sim                    | Sim, com orientação para incentivar |

Substituição por conta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reações de confirmação

`channels.whatsapp.ackReaction` envia uma reação imediata ao receber uma mensagem, condicionada por `reactionLevel` (suprimida quando definido como `"off"`):

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

Observações: enviada imediatamente após a mensagem recebida ser aceita (antes da resposta); se `ackReaction` estiver presente sem `emoji`, o WhatsApp usará o emoji de identidade do agente responsável pela rota, com fallback para "👀" (omita `ackReaction` ou defina `emoji: ""` para não enviar confirmação); as falhas são registradas, mas não bloqueiam a entrega da resposta; o modo de grupo `mentions` reage apenas em turnos acionados por menção, enquanto a ativação de grupo `always` ignora essa verificação; o WhatsApp usa apenas `channels.whatsapp.ackReaction` (o `messages.ackReaction` legado não se aplica aqui).

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o WhatsApp substitua a reação de confirmação durante um turno, em vez de manter um emoji estático de recebimento, alternando entre estados como na fila, pensando, atividade de ferramenta, Compaction, concluído e erro:

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

Observações: `channels.whatsapp.ackReaction` ainda controla a elegibilidade para mensagens diretas e grupos; o estado na fila usa o mesmo emoji efetivo das reações simples de confirmação; o WhatsApp tem um único espaço de reação do bot por mensagem, portanto as atualizações do ciclo de vida substituem a reação atual no mesmo local; `messages.removeAckAfterReply: true` remove a reação de status final após o período configurado de permanência do estado concluído/erro; as categorias de emojis de ferramentas incluem `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Várias contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de contas e padrões">
    Os IDs das contas vêm de `channels.whatsapp.accounts`. A seleção da conta padrão será `default`, se estiver presente; caso contrário, será o primeiro ID de conta configurado (em ordem alfabética). Os IDs das contas são normalizados internamente para consulta.
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (backup: `creds.json.bak`)
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos da conta padrão

  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp dessa conta. Quando um Gateway está acessível, o logout primeiro interrompe o listener ativo dessa conta, para que a sessão vinculada pare de receber mensagens antes da próxima reinicialização. `openclaw channels remove --channel whatsapp` também interrompe o listener ativo antes de desabilitar ou excluir a configuração da conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Controles de ações: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (as ações existentes têm `true` como padrão), `channels.whatsapp.actions.calls` (padrão `false`; consulte MeowCaller acima).
- As gravações de configuração iniciadas pelo canal são habilitadas por padrão; desabilite-as com `channels.whatsapp.configWrites: false`.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR obrigatório)">
    Sintoma: o status do canal informa que ele não está vinculado.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Vinculado, mas desconectado/ciclo de reconexão">
    Sintoma: conta vinculada com desconexões ou tentativas de reconexão repetidas.

    Contas com pouca atividade podem permanecer conectadas além do tempo limite normal de mensagens; o watchdog reinicia somente quando a atividade do transporte do WhatsApp Web é interrompida, o socket é fechado ou a atividade no nível da aplicação permanece ausente além da janela de segurança mais longa (consulte Modelo de execução acima).

    Se os logs mostrarem repetidamente `status=408 Request Time-out Connection was lost`, ajuste os tempos do socket do Baileys em `web.whatsapp`. Comece reduzindo `keepAliveIntervalMs` para um valor abaixo do tempo limite de inatividade da sua rede e aumentando `connectTimeoutMs` em conexões lentas ou com perdas:

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

    Se o ciclo persistir depois que a conectividade do host e os tempos forem corrigidos, faça backup do diretório de autenticação da conta e vincule-a novamente:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` informar `Gateway inactive`, mas `openclaw gateway status` e `openclaw channels status --probe` indicarem que tudo está funcionando corretamente, execute `openclaw doctor`. No Linux, o doctor alerta sobre entradas legadas do crontab que invocam o script desativado `~/.openclaw/bin/ensure-whatsapp.sh`; remova essas entradas com `crontab -e` — o cron pode não ter o ambiente do barramento de usuário do systemd, fazendo com que esse script antigo informe incorretamente a integridade do Gateway.

  </Accordion>

  <Accordion title="O login por QR expira quando feito por meio de um proxy">
    Sintoma: `openclaw channels login --channel whatsapp` falha antes de exibir um QR utilizável, com `status=408 Request Time-out` ou uma desconexão do socket TLS.

    O login do WhatsApp Web usa o ambiente de proxy padrão do host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes em minúsculas, `NO_PROXY`). Verifique se o processo do Gateway herda as variáveis de ambiente do proxy e se `NO_PROXY` não corresponde a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nenhum listener ativo durante o envio">
    Os envios de saída falham imediatamente quando não há um listener ativo do Gateway para a conta de destino. Confirme se o Gateway está em execução e se a conta está vinculada.
  </Accordion>

  <Accordion title="A resposta aparece na transcrição, mas não no WhatsApp">
    As linhas da transcrição registram o que o agente gerou; a entrega pelo WhatsApp é verificada separadamente. O OpenClaw só considera uma resposta automática como enviada depois que o Baileys retorna um ID de mensagem de saída para pelo menos um envio visível de texto ou mídia.

    As reações de confirmação são recibos independentes enviados antes da resposta — uma reação bem-sucedida não comprova que a resposta posterior de texto/mídia foi aceita. Verifique os logs do Gateway em busca de `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entradas da lista de permissões de `groups`, controle por menção (`requireMention` + padrões de menção) e chaves duplicadas em `openclaw.json` (entradas posteriores do JSON5 substituem as anteriores — mantenha apenas um `groupPolicy` por escopo).

    Se `channels.whatsapp.groups` estiver presente, o WhatsApp ainda poderá observar mensagens de outros grupos, mas o OpenClaw as descartará antes do roteamento da sessão. Adicione o JID do grupo a `channels.whatsapp.groups` ou adicione `groups["*"]` para permitir todos os grupos enquanto mantém a autorização do remetente sob `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Aviso sobre o ambiente de execução Bun">
    O ambiente de execução do Gateway do WhatsApp deve usar Node. O Bun é indicado como incompatível com a operação estável do Gateway do WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts do sistema

O WhatsApp oferece suporte a prompts do sistema no estilo do Telegram para grupos e conversas diretas por meio dos mapas `groups` e `direct`.

Resolução para mensagens de grupo: primeiro, o mapa `groups` efetivo é determinado — se a conta definir sua própria chave `groups`, ela substituirá completamente o mapa `groups` raiz (sem mesclagem profunda). Em seguida, a busca do prompt é realizada nesse único mapa resultante:

1. **Prompt específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada do grupo existe **e** sua chave `systemPrompt` está definida. Uma string vazia (`""`) suprime o curinga e não aplica nenhum prompt.
2. **Prompt curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está ausente ou existe sem uma chave `systemPrompt`.

A resolução para mensagens diretas segue o mesmo padrão no mapa `direct` e em `direct["*"]`.

<Note>
`dms` continua sendo o contêiner leve de substituições do histórico por mensagem direta (`dms.<id>.historyLimit`). As substituições de prompt ficam em `direct`.
</Note>

<Note>
Esse comportamento em que a conta substitui a raiz para a resolução de prompts é uma substituição superficial simples: qualquer chave `groups`/`direct` da conta, incluindo um objeto vazio explícito, substitui o mapa raiz. Isso difere da verificação da lista de permissões de participação em grupos descrita acima, que possui uma proteção para conta única em caso de um `groups: {}` acidentalmente vazio.
</Note>

**Diferença em relação ao Telegram:** o Telegram suprime o `groups` raiz para todas as contas em uma configuração com várias contas (até mesmo para contas sem um `groups` próprio), evitando que um bot receba mensagens de grupos aos quais não pertence. O WhatsApp não aplica essa proteção — `groups`/`direct` raiz são herdados por qualquer conta sem uma substituição própria, independentemente da quantidade de contas. Em uma configuração do WhatsApp com várias contas, defina explicitamente o mapa completo em cada conta se quiser prompts específicos por conta.

Comportamentos importantes:

- `channels.whatsapp.groups` funciona tanto como um mapa de configuração por grupo quanto como a lista de permissões de grupos no nível da conversa. No escopo raiz ou da conta, `groups["*"]` significa "todos os grupos são permitidos" nesse escopo.
- Adicione um `systemPrompt` curinga somente quando você já quiser que esse escopo permita todos os grupos. Para manter apenas um conjunto fixo de IDs de grupos elegíveis, repita o prompt em cada entrada explicitamente permitida em vez de usar `groups["*"]`.
- A admissão do grupo e a autorização do remetente são verificações separadas. `groups["*"]` amplia os grupos que chegam ao processamento de grupos; ele não autoriza todos os remetentes desses grupos — isso continua sendo controlado por `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` não tem um efeito colateral equivalente para mensagens diretas: `direct["*"]` apenas fornece uma configuração padrão depois que uma mensagem direta já foi admitida por `dmPolicy`, juntamente com `allowFrom` ou as regras do armazenamento de pareamento.

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

## Referências de configuração

Referência principal: [Referência de configuração — WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

| Área                  | Campos                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acesso                | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega               | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Várias contas         | `accounts.<id>.enabled`, `accounts.<id>.authDir` e outras substituições por conta                              |
| Operações             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamento da sessão | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                 |
| Prompts               | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Conteúdo relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
