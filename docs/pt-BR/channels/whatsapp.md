---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é responsável pela(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal dev + checkout do git: por padrão, usa o caminho local do Plugin.
- Stable/Beta: por padrão, usa o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
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
O OpenClaw recomenda executar o WhatsApp em um número separado sempre que possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade separada do WhatsApp para o OpenClaw
    - allowlists de DM e limites de roteamento mais claros
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

  <Accordion title="Fallback com número pessoal">
    O onboarding oferece suporte ao modo com número pessoal e grava uma linha de base compatível com conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de conversa consigo mesmo dependem do número próprio vinculado e de `allowFrom`.

  </Accordion>

  <Accordion title="Escopo de canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal separado de mensagens WhatsApp via Twilio no registro interno de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway é responsável pelo socket do WhatsApp e pelo loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` consolida as DMs na sessão principal do agente).
- As sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte do WhatsApp Web respeita as variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira a configuração de proxy no nível do host em vez de configurações específicas de proxy do WhatsApp por canal.

## Hooks de Plugin e privacidade

As mensagens de entrada do WhatsApp podem conter conteúdo pessoal de mensagens, números de telefone,
identificadores de grupos, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads de hook `message_received` de entrada para Plugins
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

Você pode limitar a ativação a uma conta:

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

Ative isso apenas para Plugins nos quais você confia para receber conteúdo
e identificadores de mensagens de entrada do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Substituição por múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes de comportamento em runtime:

    - os pareamentos são persistidos no armazenamento de permissão do canal e combinados com o `allowFrom` configurado
    - se nenhuma allowlist estiver configurada, o número próprio vinculado é permitido por padrão
    - o OpenClaw nunca faz pareamento automático de DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de associação ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos serão elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: a allowlist de remetentes é ignorada
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia toda entrada de grupos

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback quando disponível
    - as allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se nenhum bloco `channels.whatsapp` existir, o fallback da política de grupo em runtime será `allowlist` (com um aviso no log), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupos exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citar/responder apenas satisfaz a restrição por menção; isso **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist continuam bloqueados mesmo se responderem à mensagem de um usuário da allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ele é restrito ao proprietário.

  </Tab>
</Tabs>

## Comportamento com número pessoal e conversa consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as salvaguardas de conversa consigo mesmo do WhatsApp são ativadas:

- ignorar confirmações de leitura em interações de conversa consigo mesmo
- ignorar o comportamento de acionamento automático por mention-JID que, de outra forma, faria ping em você mesmo
- se `messages.responsePrefix` não estiver definido, respostas em conversa consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    As mensagens de entrada do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se existir uma resposta citada, o contexto será anexado neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Os campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remetente JID/E.164).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada somente com mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Corpos de localização usam texto conciso com coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis delimitados por cercas, e não como texto inline no prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupos">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot for finalmente acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    As confirmações de leitura são ativadas por padrão para mensagens de entrada do WhatsApp aceitas.

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

    Interações de conversa consigo mesmo ignoram confirmações de leitura mesmo quando ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentação e mídia

<AccordionGroup>
  <Accordion title="Fragmentação de texto">
    - limite padrão de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prioriza limites de parágrafo (linhas em branco), depois usa fragmentação segura por comprimento como fallback
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - suporta payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - payloads de resposta preservam `audioAsVoice`; o WhatsApp envia mídia de áudio como notas de voz PTT do Baileys
    - áudio que não seja Ogg, incluindo saída MP3/WebM de TTS do Microsoft Edge, é transcodificado para Ogg/Opus antes da entrega como PTT
    - áudio nativo Ogg/Opus é enviado com `audio/ogg; codecs=opus` para compatibilidade com notas de voz
    - a reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com várias mídias
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (varredura de redimensionamento/qualidade) para se ajustarem aos limites
    - em falha de envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte a citação nativa de resposta, na qual respostas de saída citam visivelmente a mensagem de entrada. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                            |
| ----------- | ------------------------------------------------------------------------ |
| `"off"`     | Nunca citar; enviar como mensagem simples                               |
| `"first"`   | Citar apenas o primeiro fragmento da resposta de saída                   |
| `"all"`     | Citar todos os fragmentos da resposta de saída                           |
| `"batched"` | Citar respostas enfileiradas em lote, deixando respostas imediatas sem citação |

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

## Nível de reação

`channels.whatsapp.reactionLevel` controla quão amplamente o agente usa reações com emoji no WhatsApp:

| Nível         | Reações de ack | Reações iniciadas pelo agente | Descrição                                      |
| ------------- | -------------- | ----------------------------- | ---------------------------------------------- |
| `"off"`       | Não            | Não                           | Nenhuma reação                                 |
| `"ack"`       | Sim            | Não                           | Somente reações de ack (confirmação pré-resposta) |
| `"minimal"`   | Sim            | Sim (conservadoras)           | Ack + reações do agente com orientação conservadora |
| `"extensive"` | Sim            | Sim (incentivadas)            | Ack + reações do agente com orientação incentivada |

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

O WhatsApp oferece suporte a reações imediatas de ack ao receber mensagens de entrada por meio de `channels.whatsapp.ackReaction`.
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

Observações de comportamento:

- enviadas imediatamente após a entrada ser aceita (pré-resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em interações acionadas por menção; a ativação de grupo `always` atua como bypass para essa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - os IDs de conta vêm de `channels.whatsapp.accounts`
    - seleção da conta padrão: `default`, se presente; caso contrário, o primeiro ID de conta configurado (ordenado)
    - os IDs de conta são normalizados internamente para consulta
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho atual de autenticação: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp dessa conta.

    Em diretórios legados de autenticação, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Portões de ação:
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

  <Accordion title="Sem listener ativo ao enviar">
    Os envios de saída falham rapidamente quando não existe um listener ativo do Gateway para a conta de destino.

    Certifique-se de que o Gateway está em execução e de que a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da allowlist de `groups`
    - restrição por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do Gateway do WhatsApp deve usar Node. O Bun é sinalizado como incompatível para operação estável do Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo do Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta definir seu próprio `groups`, ele substituirá completamente o mapa `groups` raiz (sem mesclagem profunda). A consulta do prompt então é executada sobre o mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o wildcard é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema wildcard do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando ela existe mas não define a chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta definir seu próprio `direct`, ele substituirá completamente o mapa `direct` raiz (sem mesclagem profunda). A consulta do prompt então é executada sobre o mapa único resultante:

1. **Prompt de sistema específico do chat direto** (`direct["<peerId>"].systemPrompt`): usado quando a entrada específica do peer existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o wildcard é suprimido e nenhum prompt de sistema é aplicado.
2. **Prompt de sistema wildcard do chat direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do peer está totalmente ausente do mapa, ou quando ela existe mas não define a chave `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`); as substituições de prompt ficam em `direct`.

**Diferença em relação ao comportamento de múltiplas contas no Telegram:** No Telegram, `groups` raiz é intencionalmente suprimido para todas as contas em uma configuração com múltiplas contas — até mesmo para contas que não definem `groups` próprios — para evitar que um bot receba mensagens de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem uma substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração do WhatsApp com múltiplas contas, se você quiser prompts de grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender dos padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é tanto um mapa de configuração por grupo quanto a allowlist de grupo no nível do chat. No escopo raiz ou de conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Adicione um `systemPrompt` wildcard de grupo apenas quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` como padrão de prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente presente na allowlist.
- Admissão de grupo e autorização de remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem alcançar o tratamento de grupos, mas isso por si só não autoriza todos os remetentes nesses grupos. O acesso de remetentes ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` fornece apenas uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais `allowFrom` ou regras do armazenamento de pareamento.

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
            // Esta conta define seu próprio groups, então groups raiz é totalmente
            // substituído. Para manter um wildcard, defina "*" explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentre-se em gerenciamento de projetos.",
            },
            // Use apenas se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio direct, então as entradas root direct são
            // totalmente substituídas. Para manter um wildcard, defina "*" explicitamente aqui também.
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
- [Roteamento com vários agentes](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
