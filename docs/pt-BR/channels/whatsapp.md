---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T05:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0261e132d459c91f5d81d5ad9485acbdf5792e6bfc8cd33bb74e45192df9fd2f
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway é responsável pela(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal de desenvolvimento + checkout git: usa por padrão o caminho do Plugin local.
- Stable/Beta: usa por padrão o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é de pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnóstico entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do gateway" icon="settings" href="/pt-BR/gateway/configuration">
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

  </Step>

  <Step title="Iniciar o gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprovar a primeira solicitação de pareamento (se estiver usando o modo de pareamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Solicitações de pareamento expiram após 1 hora. Solicitações pendentes são limitadas a 3 por canal.

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
    O onboarding oferece suporte ao modo de número pessoal e grava uma linha de base amigável para conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de conversa consigo mesmo usam o próprio número vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal de mensagens separado do WhatsApp via Twilio no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway é responsável pelo socket do WhatsApp e pelo loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte do WhatsApp Web respeita variáveis de ambiente padrão de proxy no host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira configuração de proxy no nível do host em vez de configurações específicas de proxy do WhatsApp por canal.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Sobrescrita para várias contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes de comportamento em runtime:

    - os pareamentos são persistidos no armazenamento de permissões do canal e mesclados com `allowFrom` configurado
    - se nenhuma allowlist for configurada, o próprio número vinculado é permitido por padrão
    - o OpenClaw nunca faz pareamento automático de DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupo + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de associação ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos serão elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ignora a allowlist de remetentes
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia toda entrada de grupo

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback quando disponível
    - allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não existir nenhum bloco `channels.whatsapp`, o fallback de runtime para política de grupo será `allowlist` (com um aviso no log), mesmo se `channels.defaults.groupPolicy` estiver definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas no WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta satisfaz apenas o bloqueio por menção; ela **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist continuam bloqueados mesmo que respondam à mensagem de um usuário que esteja na allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É protegido por dono.

  </Tab>
</Tabs>

## Comportamento com número pessoal e conversa consigo mesmo

Quando o próprio número vinculado também está presente em `allowFrom`, são ativadas proteções do WhatsApp para conversa consigo mesmo:

- ignorar confirmações de leitura em turnos de conversa consigo mesmo
- ignorar o comportamento de acionamento automático por JID de menção que, de outra forma, faria você mencionar a si mesmo
- se `messages.responsePrefix` não estiver definido, respostas de conversa consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    Mensagens recebidas do WhatsApp são encapsuladas no envelope compartilhado de entrada.

    Se existir uma resposta citada, o contexto é anexado nesta forma:

    ```text
    [Respondendo a <sender> id:<stanzaId>]
    <corpo citado ou placeholder de mídia>
    [/Respondendo]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada contendo apenas mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Corpos de localização usam texto curto de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis cercados por fence, não como texto inline no prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupo">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot for finalmente acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Marcadores de injeção:

    - `[Mensagens do chat desde sua última resposta - para contexto]`
    - `[Mensagem atual - responda a esta]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    Confirmações de leitura são habilitadas por padrão para mensagens recebidas aceitas no WhatsApp.

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

    Turnos de conversa consigo mesmo ignoram confirmações de leitura mesmo quando habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentação e mídia

<AccordionGroup>
  <Accordion title="Fragmentação de texto">
    - limite padrão de fragmentação: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco), depois usa fallback para fragmentação segura por comprimento
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a cargas de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar cargas de resposta com várias mídias
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia recebida: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - sobrescritas por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para caber nos limites
    - em falha no envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte a citação de resposta nativa, em que respostas de saída citam visivelmente a mensagem de entrada. Controle isso com `channels.whatsapp.replyToMode`.

| Valor    | Comportamento                                                                      |
| -------- | ----------------------------------------------------------------------------------- |
| `"auto"` | Cita a mensagem de entrada quando o provedor oferece suporte; caso contrário, não cita |
| `"on"`   | Sempre cita a mensagem de entrada; usa fallback para envio simples se a citação for rejeitada |
| `"off"`  | Nunca cita; envia como mensagem simples                                            |

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

`channels.whatsapp.reactionLevel` controla o quão amplamente o agente usa reações com emoji no WhatsApp:

| Nível         | Reações de confirmação | Reações iniciadas pelo agente | Descrição                                      |
| ------------- | ---------------------- | ----------------------------- | ---------------------------------------------- |
| `"off"`       | Não                    | Não                           | Nenhuma reação                                 |
| `"ack"`       | Sim                    | Não                           | Somente reações de confirmação (confirmação antes da resposta) |
| `"minimal"`   | Sim                    | Sim (conservador)             | Confirmação + reações do agente com orientação conservadora |
| `"extensive"` | Sim                    | Sim (encorajado)              | Confirmação + reações do agente com orientação encorajada   |

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

O WhatsApp oferece suporte a reações imediatas de confirmação ao receber mensagens de entrada via `channels.whatsapp.ackReaction`.
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

- enviada imediatamente após a entrada ser aceita (antes da resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` atua como bypass dessa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Várias contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - IDs de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se existir; caso contrário, o primeiro ID de conta configurado (ordenado)
    - IDs de conta são normalizados internamente para busca
  </Accordion>

  <Accordion title="Caminhos de credencial e compatibilidade legada">
    - caminho atual de autenticação: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação legada padrão em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
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
- Gravações de configuração iniciadas pelo canal são habilitadas por padrão (desabilite com `channels.whatsapp.configWrites=false`).

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
    Envios de saída falham rapidamente quando não existe um listener ativo do gateway para a conta de destino.

    Certifique-se de que o gateway esteja em execução e que a conta esteja vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da allowlist `groups`
    - bloqueio por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores sobrescrevem anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do gateway do WhatsApp deve usar Node. Bun é marcado como incompatível para operação estável do gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta definir seu próprio `groups`, ele substitui completamente o mapa `groups` da raiz (sem merge profundo). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado se a entrada específica do grupo definir um `systemPrompt`.
2. **Prompt de sistema curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está ausente ou não define `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta definir seu próprio `direct`, ele substitui completamente o mapa `direct` da raiz (sem merge profundo). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do chat direto** (`direct["<peerId>"].systemPrompt`): usado se a entrada específica do peer definir um `systemPrompt`.
2. **Prompt de sistema curinga do chat direto** (`direct["*"].systemPrompt`): usado quando a entrada específica do peer está ausente ou não define `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de sobrescrita de histórico por DM (`dms.<id>.historyLimit`); sobrescritas de prompt ficam em `direct`.

**Diferença em relação ao comportamento de várias contas no Telegram:** No Telegram, `groups` da raiz é intencionalmente suprimido para todas as contas em uma configuração com várias contas — mesmo para contas que não definem `groups` próprios — para evitar que um bot receba mensagens de grupo de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` e `direct` da raiz são sempre herdados por contas que não definem uma sobrescrita no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração de WhatsApp com várias contas, se você quiser prompts de grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender de padrões no nível da raiz.

Comportamentos importantes:

- `channels.whatsapp.groups` é ao mesmo tempo um mapa de configuração por grupo e a allowlist de grupos no nível do chat. No escopo da raiz ou da conta, `groups["*"]` significa "todos os grupos são admitidos" para aquele escopo.
- Adicione um `systemPrompt` curinga de grupo apenas quando você já quiser que aquele escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` como padrão de prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente presente na allowlist.
- Admissão ao grupo e autorização do remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que podem alcançar o tratamento de grupo, mas por si só não autoriza todos os remetentes desses grupos. O acesso do remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` apenas fornece uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais regras de `allowFrom` ou do armazenamento de pareamento.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use apenas se todos os grupos devem ser admitidos no escopo da raiz.
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
            // completamente substituído. Para manter um curinga, defina "*"
            // explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Foque em gerenciamento de projetos.",
            },
            // Use apenas se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio direct, então entradas direct da raiz
            // são completamente substituídas. Para manter um curinga, defina "*"
            // explicitamente aqui também.
            "+15551234567": { systemPrompt: "Prompt para um chat direto específico de trabalho." },
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

- [Configuration reference - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos de alto sinal do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- várias contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescritas no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionados

- [Pairing](/pt-BR/channels/pairing)
- [Groups](/pt-BR/channels/groups)
- [Security](/pt-BR/gateway/security)
- [Channel routing](/pt-BR/channels/channel-routing)
- [Multi-agent routing](/pt-BR/concepts/multi-agent)
- [Troubleshooting](/pt-BR/channels/troubleshooting)
