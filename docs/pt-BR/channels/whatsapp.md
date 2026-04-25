---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é responsável pela(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o plugin ainda não está presente.
- Canal dev + checkout git: por padrão, usa o caminho local do plugin.
- Stable/Beta: por padrão, usa o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão para DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e guias de reparo.
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

  <Step title="Inicie o gateway">

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
O OpenClaw recomenda executar o WhatsApp em um número separado sempre que possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade do WhatsApp separada para o OpenClaw
    - listas de permissão de DM e limites de roteamento mais claros
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

  <Accordion title="Alternativa com número pessoal">
    O onboarding oferece suporte ao modo de número pessoal e grava uma base amigável para conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em tempo de execução, as proteções para conversa consigo mesmo dependem do próprio número vinculado e de `allowFrom`.

  </Accordion>

  <Accordion title="Escopo de canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal de mensagens do Twilio WhatsApp separado no registro interno de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de execução

- O Gateway é responsável pelo socket do WhatsApp e pelo loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Conversas de status e broadcast são ignoradas (`@status`, `@broadcast`).
- Conversas diretas usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte do WhatsApp Web respeita as variáveis de ambiente padrão de proxy no host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy no nível do host em vez de configurações específicas de proxy do WhatsApp por canal.

## Hooks de Plugin e privacidade

As mensagens recebidas no WhatsApp podem conter conteúdo pessoal de mensagens, números de telefone,
identificadores de grupo, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads de hook `message_received` recebidos para plugins
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

Você pode limitar essa opção a uma conta:

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

Ative isso apenas para plugins nos quais você confia para receber conteúdo
e identificadores de mensagens recebidas do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a conversas diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Substituição por múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em tempo de execução:

    - os pareamentos são persistidos no armazenamento de permissões do canal e combinados com `allowFrom` configurado
    - se nenhuma lista de permissão estiver configurada, o próprio número vinculado será permitido por padrão
    - o OpenClaw nunca faz pareamento automático de DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupo + listas de permissão">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissão de associação ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos serão elegíveis
       - se `groups` estiver presente, ele atua como uma lista de permissão de grupos (`"*"` é permitido)

    2. **Política de remetente do grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ignora a lista de permissão de remetentes
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia todas as mensagens recebidas de grupos

    Fallback da lista de permissão de remetentes:

    - se `groupAllowFrom` não estiver definido, o tempo de execução usa `allowFrom` como fallback quando disponível
    - as listas de permissão de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não existir nenhum bloco `channels.whatsapp`, o fallback da política de grupo em tempo de execução será `allowlist` (com um log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citar/responder apenas satisfaz o bloqueio por menção; isso **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da lista de permissão continuam bloqueados mesmo se responderem à mensagem de um usuário permitido

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É restrito ao proprietário.

  </Tab>
</Tabs>

## Comportamento com número pessoal e conversa consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, as proteções do WhatsApp para conversa consigo mesmo são ativadas:

- pular confirmações de leitura em interações de conversa consigo mesmo
- ignorar o comportamento de acionamento automático por menção de JID que, de outra forma, notificaria você mesmo
- se `messages.responsePrefix` não estiver definido, as respostas em conversa consigo mesmo usarão por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    As mensagens recebidas do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se existir uma resposta citada, o contexto será anexado nesta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Os campos de metadados da resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens recebidas somente com mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Corpos de localização usam texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco cercado, não como texto inline do prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupo">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot finalmente for acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    As confirmações de leitura são ativadas por padrão para mensagens recebidas aceitas no WhatsApp.

    Desative globalmente:

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

    Interações de conversa consigo mesmo pulam confirmações de leitura mesmo quando ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentação e mídia

<AccordionGroup>
  <Accordion title="Fragmentação de texto">
    - limite padrão de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois usa fragmentação segura por comprimento como fallback
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - payloads de resposta preservam `audioAsVoice`; o WhatsApp envia mídia de áudio como notas de voz PTT do Baileys
    - áudio não Ogg, incluindo saída MP3/WebM de TTS do Microsoft Edge, é transcodificado para Ogg/Opus antes da entrega como PTT
    - áudio nativo Ogg/Opus é enviado com `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - a reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com múltiplas mídias, exceto que notas de voz PTT enviam o áudio primeiro e o texto visível separadamente porque clientes do WhatsApp não renderizam legendas de nota de voz de forma consistente
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia recebida: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (varredura de redimensionamento/qualidade) para caber nos limites
    - em caso de falha no envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte à citação nativa de respostas, em que respostas de saída citam visivelmente a mensagem recebida. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                        |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensagem simples                            |
| `"first"`   | Citar apenas o primeiro bloco de resposta de saída                   |
| `"all"`     | Citar todos os blocos de resposta de saída                           |
| `"batched"` | Citar respostas em lote enfileiradas, deixando respostas imediatas sem citação |

O padrão é `"off"`. As substituições por conta usam `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Nível de reações

`channels.whatsapp.reactionLevel` controla quão amplamente o agente usa reações com emoji no WhatsApp:

| Nível         | Reações de ack | Reações iniciadas pelo agente | Descrição                                       |
| ------------- | -------------- | ----------------------------- | ----------------------------------------------- |
| `"off"`       | Não            | Não                           | Nenhuma reação                                  |
| `"ack"`       | Sim            | Não                           | Apenas reações de ack (confirmação pré-resposta) |
| `"minimal"`   | Sim            | Sim (conservador)             | Ack + reações do agente com orientação conservadora |
| `"extensive"` | Sim            | Sim (incentivado)             | Ack + reações do agente com orientação incentivada |

Padrão: `"minimal"`.

As substituições por conta usam `channels.whatsapp.accounts.<id>.reactionLevel`.

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

O WhatsApp oferece suporte a reações imediatas de ack no recebimento de entrada via `channels.whatsapp.ackReaction`.
As reações de ack são controladas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

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

Observações sobre o comportamento:

- enviada imediatamente após a entrada ser aceita (pré-resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em interações acionadas por menção; a ativação de grupo `always` atua como bypass para essa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - os ids de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se presente; caso contrário, o primeiro id de conta configurado (ordenado)
    - os ids de conta são normalizados internamente para consulta
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade com legado">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Controles de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal são ativadas por padrão (desative com `channels.whatsapp.configWrites=false`).

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

    Correção:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Nenhum listener ativo ao enviar">
    Envios de saída falham imediatamente quando não existe um listener ativo do gateway para a conta de destino.

    Certifique-se de que o gateway esteja em execução e de que a conta esteja vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da lista de permissão `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do gateway do WhatsApp deve usar Node. O Bun é marcado como incompatível para operação estável do gateway do WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts do sistema

O WhatsApp oferece suporte a prompts do sistema no estilo do Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta define seu próprio `groups`, ele substitui completamente o mapa `groups` raiz (sem mesclagem profunda). A busca de prompt então é executada no mapa único resultante:

1. **Prompt do sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada do grupo específico existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt do sistema será aplicado.
2. **Prompt do sistema curinga para grupos** (`groups["*"].systemPrompt`): usado quando a entrada do grupo específico está ausente do mapa por completo, ou quando ela existe, mas não define a chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta define seu próprio `direct`, ele substitui completamente o mapa `direct` raiz (sem mesclagem profunda). A busca de prompt então é executada no mapa único resultante:

1. **Prompt do sistema específico da conversa direta** (`direct["<peerId>"].systemPrompt`): usado quando a entrada específica do peer existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt do sistema será aplicado.
2. **Prompt do sistema curinga para conversas diretas** (`direct["*"].systemPrompt`): usado quando a entrada específica do peer está ausente do mapa por completo, ou quando ela existe, mas não define a chave `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`); as substituições de prompt ficam em `direct`.

**Diferença em relação ao comportamento de múltiplas contas no Telegram:** no Telegram, `groups` na raiz é intencionalmente suprimido para todas as contas em uma configuração de múltiplas contas — até mesmo para contas que não definem seu próprio `groups` — para evitar que um bot receba mensagens de grupo de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` e `direct` na raiz são sempre herdados por contas que não definem uma substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração de múltiplas contas do WhatsApp, se você quiser prompts de grupo ou diretos por conta, defina o mapa completo explicitamente em cada conta, em vez de depender dos padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é ao mesmo tempo um mapa de configuração por grupo e a lista de permissão de grupos no nível do chat. No escopo raiz ou de conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Adicione um `systemPrompt` de grupo curinga apenas quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de ids de grupo seja elegível, não use `groups["*"]` para o prompt padrão. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida.
- A admissão de grupo e a autorização do remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que pode alcançar o tratamento de grupos, mas isso, por si só, não autoriza todos os remetentes nesses grupos. O acesso do remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` apenas fornece uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais as regras de `allowFrom` ou do armazenamento de pareamento.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use apenas se todos os grupos devem ser admitidos no escopo raiz.
        // Aplica-se a todas as contas que não definem seu próprio mapa groups.
        "*": { systemPrompt: "Prompt padrão para todos os grupos." },
      },
      direct: {
        // Aplica-se a todas as contas que não definem seu próprio mapa direct.
        "*": { systemPrompt: "Prompt padrão para todos os chats diretos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta conta define seu próprio groups, então groups da raiz é
            // totalmente substituído. Para manter um curinga, defina "*" explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Foque em gerenciamento de projetos.",
            },
            // Use apenas se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio direct, então as entradas direct da raiz são
            // totalmente substituídas. Para manter um curinga, defina "*" explicitamente aqui também.
            "+15551234567": { systemPrompt: "Prompt para um chat direto de trabalho específico." },
            "*": { systemPrompt: "Prompt padrão para chats diretos de trabalho." },
          },
        },
      },
    },
  },
}
```

## Ponteiros para a referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos do WhatsApp de alto sinal:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
