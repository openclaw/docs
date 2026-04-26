---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é responsável pela(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal dev + checkout do git: usa por padrão o caminho local do Plugin.
- Stable/Beta: usa por padrão o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de correção.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Configurar a política de acesso do WhatsApp">

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

  <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprovar a primeira solicitação de pareamento (se estiver usando o modo de pareamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Solicitações de pareamento expiram após 1 hora. As solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
O OpenClaw recomenda executar o WhatsApp em um número separado quando possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade separada do WhatsApp para o OpenClaw
    - listas de permissões de DM e limites de roteamento mais claros
    - menor chance de confusão com chat consigo mesmo

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

  <Accordion title="Fallback para número pessoal">
    O onboarding oferece suporte ao modo de número pessoal e grava uma linha de base amigável para chat consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui o seu número pessoal
    - `selfChatMode: true`

    Em tempo de execução, as proteções para chat consigo mesmo são baseadas no próprio número vinculado e em `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal separado de mensagens do WhatsApp via Twilio no registro interno de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de execução

- O Gateway é responsável pelo socket do WhatsApp e pelo loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte WhatsApp Web respeita variáveis de ambiente de proxy padrão no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy no nível do host em vez de configurações de proxy do WhatsApp específicas do canal.
- Quando `messages.removeAckAfterReply` está ativado, o OpenClaw remove a reação de confirmação do WhatsApp depois que uma resposta visível é entregue.

## Hooks de Plugin e privacidade

Mensagens recebidas do WhatsApp podem conter conteúdo pessoal da mensagem, números de telefone,
identificadores de grupo, nomes de remetentes e campos de correlação de sessão. Por esse motivo,
o WhatsApp não transmite payloads de hook `message_received` recebidos para Plugins
a menos que você ative isso explicitamente:

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

Ative isso apenas para Plugins nos quais você confia para receber conteúdo e identificadores
de mensagens recebidas do WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Substituição para múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em tempo de execução:

    - pareamentos são persistidos no armazenamento de permissões do canal e mesclados com `allowFrom` configurado
    - se nenhuma lista de permissões estiver configurada, o próprio número vinculado será permitido por padrão
    - o OpenClaw nunca faz pareamento automático de DMs `fromMe` de saída (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupo + listas de permissões">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissões de associação ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos serão elegíveis
       - se `groups` estiver presente, ele atua como uma lista de permissões de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: a lista de permissões de remetentes é ignorada
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia todas as entradas de grupo

    Fallback da lista de permissões de remetentes:

    - se `groupAllowFrom` não estiver definido, o tempo de execução usa `allowFrom` como fallback quando disponível
    - listas de permissões de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não existir nenhum bloco `channels.whatsapp`, o fallback de política de grupo em tempo de execução será `allowlist` (com um aviso no log), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcrições recebidas de mensagens de voz para mensagens de grupo autorizadas
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta atende apenas ao bloqueio por menção; ela **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes que não estão na lista de permissões ainda são bloqueados mesmo que respondam à mensagem de um usuário que esteja na lista

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ela é protegida por owner-gating.

  </Tab>
</Tabs>

## Comportamento com número pessoal e chat consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, as proteções para chat consigo mesmo no WhatsApp são ativadas:

- ignorar confirmações de leitura em turnos de chat consigo mesmo
- ignorar o comportamento de disparo automático por menção de JID que, de outra forma, acionaria você mesmo
- se `messages.responsePrefix` não estiver definido, respostas em chat consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    Mensagens recebidas do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se existir uma resposta citada, o contexto é anexado neste formato:

    ```text
    [Respondendo a <sender> id:<stanzaId>]
    <corpo citado ou marcador de mídia>
    [/Respondendo]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).

  </Accordion>

  <Accordion title="Marcadores de mídia e extração de localização/contato">
    Mensagens recebidas contendo apenas mídia são normalizadas com marcadores como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Mensagens de voz autorizadas em grupos são transcritas antes do bloqueio por menção quando o
    corpo é apenas `<media:audio>`, portanto mencionar o bot na mensagem de voz pode
    acionar a resposta. Se a transcrição ainda não mencionar o bot, a
    transcrição será mantida no histórico pendente do grupo em vez do marcador bruto.

    Corpos de localização usam texto de coordenadas conciso. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco delimitado, não como texto inline do prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupo">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot finalmente for acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção:

    - `[Mensagens do chat desde a sua última resposta - para contexto]`
    - `[Mensagem atual - responda a esta]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    Confirmações de leitura são ativadas por padrão para mensagens aceitas recebidas do WhatsApp.

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

    Turnos de chat consigo mesmo ignoram confirmações de leitura mesmo quando elas estão ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentação e mídia

<AccordionGroup>
  <Accordion title="Fragmentação de texto">
    - limite padrão de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois usa fragmentação segura por tamanho como fallback
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a payloads de imagem, vídeo, áudio (mensagem de voz PTT) e documento
    - mídia de áudio é enviada pelo payload `audio` do Baileys com `ptt: true`, para que clientes do WhatsApp a renderizem como uma mensagem de voz push-to-talk
    - payloads de resposta preservam `audioAsVoice`; a saída de mensagem de voz de TTS para WhatsApp permanece nesse caminho PTT mesmo quando o provedor retorna MP3 ou WebM
    - áudio Ogg/Opus nativo é enviado como `audio/ogg; codecs=opus` para compatibilidade com mensagens de voz
    - áudio não Ogg, incluindo saída MP3/WebM de TTS do Microsoft Edge, é transcodificado com `ffmpeg` para Ogg/Opus mono a 48 kHz antes da entrega como PTT
    - `/tts latest` envia a resposta mais recente do assistente como uma única mensagem de voz e suprime envios repetidos para a mesma resposta; `/tts chat on|off|default` controla o TTS automático para o chat atual do WhatsApp
    - a reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com múltiplas mídias, exceto que mensagens de voz PTT enviam primeiro o áudio e o texto visível separadamente porque clientes do WhatsApp não renderizam legendas de mensagens de voz de forma consistente
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para caber nos limites
    - em caso de falha no envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte a citação nativa de resposta, em que respostas de saída citam visivelmente a mensagem recebida. Controle isso com `channels.whatsapp.replyToMode`.

| Valor       | Comportamento                                                       |
| ----------- | ------------------------------------------------------------------- |
| `"off"`     | Nunca cita; envia como mensagem simples                            |
| `"first"`   | Cita apenas o primeiro fragmento da resposta de saída              |
| `"all"`     | Cita cada fragmento da resposta de saída                           |
| `"batched"` | Cita respostas enfileiradas em lote, deixando respostas imediatas sem citação |

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

`channels.whatsapp.reactionLevel` controla quão amplamente o agente usa reações com emoji no WhatsApp:

| Nível         | Reações de confirmação | Reações iniciadas pelo agente | Descrição                                           |
| ------------- | ---------------------- | ----------------------------- | --------------------------------------------------- |
| `"off"`       | Não                    | Não                           | Nenhuma reação                                      |
| `"ack"`       | Sim                    | Não                           | Apenas reações de confirmação (recebimento pré-resposta) |
| `"minimal"`   | Sim                    | Sim (conservadoras)           | Confirmação + reações do agente com orientação conservadora |
| `"extensive"` | Sim                    | Sim (incentivadas)            | Confirmação + reações do agente com orientação incentivada |

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

O WhatsApp oferece suporte a reações imediatas de confirmação no recebimento por meio de `channels.whatsapp.ackReaction`.
As reações de confirmação são controladas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

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
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` funciona como bypass para essa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - IDs de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se presente; caso contrário, o primeiro ID de conta configurado (ordenado)
    - IDs de conta são normalizados internamente para busca
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho atual de autenticação: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Portas de ações:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal são ativadas por padrão (desative via `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: o status do canal reporta que não está vinculado.

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
    Envios de saída falham rapidamente quando não existe um listener ativo do Gateway para a conta de destino.

    Verifique se o Gateway está em execução e se a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da lista de permissões `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime Bun">
    O runtime do Gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta definir seu próprio `groups`, ele substituirá completamente o mapa `groups` raiz (sem mesclagem profunda). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt de sistema será aplicado.
2. **Prompt de sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando existe, mas não define a chave `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta definir seu próprio `direct`, ele substituirá completamente o mapa `direct` raiz (sem mesclagem profunda). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do direto** (`direct["<peerId>"].systemPrompt`): usado quando a entrada específica do peer existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt de sistema será aplicado.
2. **Prompt de sistema curinga de direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do peer está totalmente ausente do mapa, ou quando existe, mas não define a chave `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`); as substituições de prompt ficam em `direct`.

**Diferença em relação ao comportamento de múltiplas contas no Telegram:** No Telegram, `groups` raiz é intencionalmente suprimido para todas as contas em uma configuração com múltiplas contas — até mesmo para contas que não definem `groups` próprios — para impedir que um bot receba mensagens de grupo de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem uma substituição em nível de conta, independentemente de quantas contas estejam configuradas. Em uma configuração de WhatsApp com múltiplas contas, se você quiser prompts por grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender de padrões em nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é ao mesmo tempo um mapa de configuração por grupo e a lista de permissões de grupo no nível do chat. No escopo raiz ou da conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Adicione um `systemPrompt` curinga de grupo apenas quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` como padrão de prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida.
- Admissão em grupo e autorização de remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem chegar ao tratamento de grupo, mas isso por si só não autoriza todos os remetentes nesses grupos. O acesso do remetente continua sendo controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` apenas fornece uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais regras de `allowFrom` ou do armazenamento de pareamento.

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
            // substituído. Para manter um curinga, defina "*" explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentre-se em gerenciamento de projetos.",
            },
            // Use apenas se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio direct, então entradas direct raiz são
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

## Ponteiros de referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos do WhatsApp de alto sinal:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições em nível de conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
