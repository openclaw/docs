---
read_when:
    - Trabalhando no comportamento do WhatsApp/canal web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T13:59:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é dono da(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal dev + checkout do git: usa por padrão o caminho do Plugin local.
- Stable/Beta: usa por padrão o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
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

    Solicitações de pareamento expiram após 1 hora. As solicitações pendentes são limitadas a 3 por canal.

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
    O onboarding oferece suporte ao modo com número pessoal e grava uma base amigável para conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções para conversa consigo mesmo usam o número próprio vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal separado de mensagens do WhatsApp via Twilio no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway é dono do socket do WhatsApp e do loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs para a sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte do WhatsApp Web respeita variáveis de ambiente padrão de proxy no host do Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira a configuração de proxy no nível do host em vez de configurações de proxy específicas do WhatsApp no canal.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso ao chat direto:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Sobrescrita por múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em runtime:

    - pareamentos persistem no armazenamento de permissão do canal e são mesclados com `allowFrom` configurado
    - se nenhuma allowlist estiver configurada, o número próprio vinculado é permitido por padrão
    - DMs de saída `fromMe` nunca são pareadas automaticamente

  </Tab>

  <Tab title="Política de grupo + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de associação a grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` é permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: a allowlist de remetentes é ignorada
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia toda entrada de grupos

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` quando disponível
    - as allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não houver nenhum bloco `channels.whatsapp`, o fallback da política de grupo em runtime será `allowlist` (com um log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta apenas satisfaz o bloqueio por menção; isso **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes que não estão na allowlist continuam bloqueados mesmo que respondam à mensagem de um usuário que está na allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É protegido por proprietário.

  </Tab>
</Tabs>

## Comportamento com número pessoal e conversa consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as proteções do WhatsApp para conversa consigo mesmo são ativadas:

- ignorar confirmações de leitura em turnos de conversa consigo mesmo
- ignorar comportamento de acionamento automático por mention-JID que, de outra forma, enviaria menção para você mesmo
- se `messages.responsePrefix` não estiver definido, respostas em conversa consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    Mensagens recebidas do WhatsApp são encapsuladas no envelope compartilhado de entrada.

    Se existir uma resposta citada, o contexto é anexado neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remetente JID/E.164).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens recebidas contendo apenas mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Cargas úteis de localização e contato são normalizadas em contexto textual antes do roteamento.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupo">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot é finalmente acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    Confirmações de leitura estão ativadas por padrão para mensagens recebidas do WhatsApp que foram aceitas.

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

    Sobrescrita por conta:

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

    Turnos de conversa consigo mesmo ignoram confirmações de leitura mesmo quando ativadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentação e mídia

<AccordionGroup>
  <Accordion title="Fragmentação de texto">
    - limite padrão de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois recorre à fragmentação segura por comprimento
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a cargas úteis de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - a reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar cargas úteis de resposta com múltiplas mídias
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia recebida: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - sobrescritas por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para se ajustarem aos limites
    - em falha no envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte à citação nativa de resposta, em que respostas de saída citam visivelmente a mensagem recebida. Controle isso com `channels.whatsapp.replyToMode`.

| Value    | Behavior                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Cita a mensagem recebida quando o provedor oferece suporte; caso contrário, não cita |
| `"on"`   | Sempre cita a mensagem recebida; recorre a um envio simples se a citação for rejeitada |
| `"off"`  | Nunca cita; envia como mensagem simples                                               |

O padrão é `"auto"`. Sobrescritas por conta usam `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Nível de reação

`channels.whatsapp.reactionLevel` controla quão amplamente o agente usa reações com emoji no WhatsApp:

| Level         | Ack reactions | Agent-initiated reactions | Description                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | No            | No                        | Nenhuma reação                                   |
| `"ack"`       | Sim           | No                        | Apenas reações de ack (confirmação antes da resposta) |
| `"minimal"`   | Sim           | Sim (conservadoras)       | Ack + reações do agente com orientação conservadora |
| `"extensive"` | Sim           | Sim (incentivadas)        | Ack + reações do agente com orientação incentivada   |

Padrão: `"minimal"`.

Sobrescritas por conta usam `channels.whatsapp.accounts.<id>.reactionLevel`.

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

Observações de comportamento:

- enviada imediatamente após a entrada ser aceita (antes da resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` funciona como desvio dessa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - os IDs de conta vêm de `channels.whatsapp.accounts`
    - seleção da conta padrão: `default` se estiver presente; caso contrário, o primeiro ID de conta configurado (ordenado)
    - os IDs de conta são normalizados internamente para busca
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho atual de autenticação: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Tools, ações e gravações de configuração

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
    Envios de saída falham rapidamente quando não existe listener ativo do Gateway para a conta de destino.

    Verifique se o Gateway está em execução e se a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da allowlist `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do Gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do Gateway do WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts do sistema

O WhatsApp oferece suporte a prompts do sistema no estilo Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta definir seu próprio `groups`, ele substitui completamente o mapa `groups` raiz (sem deep merge). A busca do prompt então é executada no mapa único resultante:

1. **Prompt do sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado se a entrada específica do grupo definir um `systemPrompt`.
2. **Prompt do sistema curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está ausente ou não define `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta definir seu próprio `direct`, ele substitui completamente o mapa `direct` raiz (sem deep merge). A busca do prompt então é executada no mapa único resultante:

1. **Prompt do sistema específico do direto** (`direct["<peerId>"].systemPrompt`): usado se a entrada específica do par definir um `systemPrompt`.
2. **Prompt do sistema curinga do direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do par está ausente ou não define `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de sobrescrita de histórico por DM (`dms.<id>.historyLimit`); as sobrescritas de prompt ficam em `direct`.

**Diferença em relação ao comportamento de múltiplas contas do Telegram:** No Telegram, o `groups` raiz é intencionalmente suprimido para todas as contas em uma configuração com múltiplas contas — até mesmo contas que não definem seu próprio `groups` — para impedir que um bot receba mensagens de grupo de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem uma sobrescrita no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração do WhatsApp com múltiplas contas, se você quiser prompts de grupo ou diretos por conta, defina o mapa completo explicitamente em cada conta em vez de depender de padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é ao mesmo tempo um mapa de configuração por grupo e a allowlist de grupos no nível do chat. No escopo raiz ou de conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Adicione um `systemPrompt` curinga de grupo apenas quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` para o prompt padrão. Em vez disso, repita o prompt em cada entrada de grupo explicitamente permitida na allowlist.
- A admissão em grupo e a autorização do remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem chegar ao tratamento de grupo, mas isso por si só não autoriza todos os remetentes nesses grupos. O acesso do remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` apenas fornece uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais `allowFrom` ou regras do armazenamento de pareamento.

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
              systemPrompt: "Foque em gerenciamento de projetos.",
            },
            // Use apenas se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio direct, então as entradas direct raiz são
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

## Ponteiros para referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/configuration-reference#whatsapp)

Campos do WhatsApp de alto sinal:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescritas no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
