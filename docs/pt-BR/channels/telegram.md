---
read_when:
    - Trabalhar em recursos do Telegram ou Webhooks
summary: Status do suporte do bot do Telegram, capacidades e configuração
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: pronto para produção para DMs de bot + grupos via grammY. Long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é o pareamento.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões completos de configuração de canal e exemplos.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Crie o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga os prompts e salve o token.

  </Step>

  <Step title="Configure o token e a política de DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback por env: `TELEGRAM_BOT_TOKEN=...` (somente conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e então inicie o gateway.

  </Step>

  <Step title="Inicie o gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e então defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token considera a conta. Na prática, os valores de config prevalecem sobre o fallback por env, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupo">
    Bots do Telegram usam por padrão o **Modo de privacidade**, que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a mudança.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo no Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento sempre ativo em grupos.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para o comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso por mensagem direta:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita apenas IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas `@username` na allowlist, execute `openclaw doctor --fix` para resolvê-las (em melhor esforço; exige um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist no armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots com um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações anteriores de pareamento).

    Confusão comum: a aprovação de pareamento de DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso apenas a DM. A autorização de remetentes em grupo ainda vem de allowlists explícitas na configuração.
    Se você quiser "sou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`.

    ### Encontrar seu ID de usuário do Telegram

    Forma mais segura (sem bot de terceiros):

    1. Envie uma DM para o seu bot.
    2. Execute `openclaw logs --follow`.
    3. Leia `from.id`.

    Método oficial da Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo e allowlists">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar pelas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até que você adicione entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupos. Se não estiver definido, o Telegram usa `allowFrom` como fallback.
    Entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (`telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): a autorização de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento permanece apenas para DMs. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram usa `allowFrom` da configuração como fallback, não o armazenamento de pareamento.
    Padrão prático para bots com um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` sem definir e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com fechamento por padrão, a menos que `channels.defaults.groupPolicy` esteja explicitamente definido.

    Exemplo: permitir qualquer membro em um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Exemplo: permitir apenas usuários específicos dentro de um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Erro comum: `groupAllowFrom` não é uma allowlist de grupos do Telegram.

      - Coloque IDs negativos de grupos ou supergrupos do Telegram como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuários do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` somente quando quiser que qualquer membro de um grupo permitido possa falar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas em grupos exigem menção por padrão.

    A menção pode vir de:

    - menção nativa `@nomedobot`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias de comando no nível da sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use a configuração para persistência.

    Exemplo de configuração persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Como obter o ID do chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é controlado pelo processo do gateway.
- O roteamento é determinístico: respostas recebidas do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas para o envelope compartilhado de canal com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID do grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw as roteia com chaves de sessão sensíveis a thread e preserva o ID da thread para as respostas.
- O long polling usa o runner do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- Reinicializações do watchdog de long polling são acionadas após 120 segundos sem liveness concluído de `getUpdates` por padrão. Aumente `channels.telegram.pollingStallThresholdMs` apenas se sua implantação ainda encontrar reinicializações falsas por travamento de polling durante trabalhos longos. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são compatíveis.
- A Telegram Bot API não tem suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de stream ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` é mapeado para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
    - `channels.telegram.streamMode` legado e valores booleanos de `streaming` são mapeados automaticamente

    Para respostas somente em texto:

    - DM: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no local (sem segunda mensagem)
    - grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no local (sem segunda mensagem)

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw recorre à entrega final normal e depois limpa a mensagem de prévia.

    A prévia em streaming é separada do block streaming. Quando o block streaming é explicitamente habilitado para o Telegram, o OpenClaw ignora a prévia em streaming para evitar streaming duplo.

    Se o transporte nativo de rascunho não estiver disponível/for rejeitado, o OpenClaw recorre automaticamente a `sendMessage` + `editMessageText`.

    Stream de raciocínio somente do Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo durante a geração
    - a resposta final é enviada sem o texto do raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback para HTML">
    O texto de saída usa `parse_mode: "HTML"` do Telegram.

    - Texto em estilo Markdown é renderizado para HTML seguro para o Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de parsing do Telegram.
    - Se o Telegram rejeitar o HTML processado, o OpenClaw tenta novamente como texto simples.

    As prévias de link são habilitadas por padrão e podem ser desabilitadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para o Telegram

    Adicione entradas personalizadas ao menu de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup do Git" },
        { command: "generate", description: "Criar uma imagem" },
      ],
    },
  },
}
```

    Regras:

    - nomes são normalizados (removem `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não sejam mostrados no menu do Telegram

    Se os comandos nativos estiverem desabilitados, os comandos integrados serão removidos. Comandos personalizados/de Plugin ainda podem ser registrados se estiverem configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de Plugin/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token bootstrap de curta duração. O handoff bootstrap integrado mantém o token do Node principal em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo do bootstrap usam prefixo de função, então essa allowlist de operador só atende solicitações de operador; funções que não são de operador ainda precisam de escopos sob o prefixo da própria função.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo, função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

    Mais detalhes: [Pareamento](/pt-BR/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botões inline">
    Configure o escopo do teclado inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Escopos:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (padrão)

    `capabilities: ["inlineButtons"]` legado é mapeado para `inlineButtons: "all"`.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Cliques de callback são passados para o agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações da ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` opcionais)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` opcionais)

    As ações de mensagem do canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desabilitado)

    Observação: `edit` e `topic-create` estão atualmente habilitados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em runtime usam o snapshot ativo de config/secrets (inicialização/reload), então os caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reações: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de resposta">
    O Telegram oferece suporte a tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou a execução
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Observação: `off` desabilita o encadeamento implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos de fórum:

    - chaves de sessão do tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como alvo a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não é herdado dos padrões do grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico geral → agente principal
                "3": { agentId: "zu" },        // Tópico dev → agente zu
                "5": { agentId: "coder" }      // Revisão de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculação persistente de tópico ACP**: tópicos de fórum podem fixar sessões do harness ACP por meio de bindings ACP tipados de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico como `-1001234567890:topic:42`). Atualmente com escopo para tópicos de fórum em grupos/supergrupos. Veja [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn de ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão sensíveis a thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensagens de vídeo

    O Telegram diferencia arquivos de vídeo de notas de vídeo.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Notas de vídeo não têm suporte a legendas; o texto de mensagem fornecido é enviado separadamente.

    ### Stickers

    Tratamento de stickers recebidos:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM em vídeo: ignorado

    Campos de contexto do sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers são descritos uma vez (quando possível) e colocados em cache para reduzir chamadas repetidas de vision.

    Habilite ações de sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Ação para enviar sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquisar stickers em cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reação">
    Reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos do sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuário a mensagens enviadas pelo bot (em melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos sem fórum roteiam para a sessão de chat em grupo
      - grupos com fórum roteiam para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão `"👀"`)

    Observações:

    - O Telegram espera emoji unicode (por exemplo `"👀"`).
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações de configuração de canal são habilitadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (requer habilitação de comando)

    Desabilitar:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs Webhook">
    O padrão é long polling. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` opcionais (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    O listener local faz bind em `127.0.0.1:8787`. Para entrada pública, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

  </Accordion>

  <Accordion title="Limites, novas tentativas e destinos da CLI">
    - o padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de dividir por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia do Telegram recebida e enviada.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não definido, o padrão do grammY é aplicado).
    - `channels.telegram.pollingStallThresholdMs` tem padrão `120000`; ajuste entre `30000` e `600000` apenas para reinicializações falsas por travamento do polling.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - o contexto suplementar de resposta/citação/encaminhamento atualmente é repassado como recebido.
    - as allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída.

    O destino de envio pela CLI pode ser um ID numérico de chat ou nome de usuário:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Enquetes do Telegram usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de enquete exclusivas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um destino `:topic:`)

    O envio no Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permitir isso
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar naquele chat
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads comprimidos de foto ou mídia animada

    Gating de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída no Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desabilita a criação de enquetes no Telegram, mantendo envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts no chat ou tópico de origem. Os aprovadores devem ser IDs numéricos de usuários do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador pode ser resolvido)
    - `channels.telegram.execApprovals.approvers` (usa como fallback IDs numéricos de proprietários de `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega em um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e para o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões inline de aprovação também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação com prefixo `plugin:` são resolvidos por meio de aprovações de Plugin; os demais são resolvidos primeiro por meio de aprovações de exec.

    Veja [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provider, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                          |
| ----------------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável ao chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades. |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança de outras chaves de configuração do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprime erros neste grupo
        },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total.
      - BotFather: `/setprivacy` -> Disable
      - depois remova + adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ser sondado quanto à associação.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não está vendo mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para ver motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/Skills/personalizados ou desabilite menus nativos
    - `setMyCommands failed` com erros de rede/fetch geralmente indica problemas de alcance DNS/HTTPS até `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado podem acionar comportamento de abort imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` primeiro para IPv6; saída IPv6 com problema pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness concluído de long-poll por padrão.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas longas de `getUpdates` estiverem saudáveis, mas seu host ainda relatar reinicializações falsas por travamento de polling. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa por padrão `autoSelectFamily=true` (exceto WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas da faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode
      habilitar o bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma habilitação também está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe primeiro a
      flag perigosa desligada. A mídia do Telegram já permite por padrão a faixa
      de benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções SSRF de mídia do Telegram. Use isso apenas em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento fake-IP de Clash, Mihomo ou Surge, quando eles
      sintetizarem respostas privadas ou de uso especial fora da faixa de benchmark RFC 2544.
      Deixe desligado para acesso normal do Telegram pela internet pública.
    </Warning>

    - Substituições por variável de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valide respostas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canal](/pt-BR/channels/troubleshooting).

## Ponteiros de referência de configuração do Telegram

Referência principal:

- `channels.telegram.enabled`: habilita/desabilita a inicialização do canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: lê o token a partir de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: allowlist de DM (IDs numéricos de usuários do Telegram). `allowlist` exige pelo menos um ID de remetente. `open` exige `"*"`. `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs e pode recuperar entradas de allowlist de arquivos do armazenamento de pareamento em fluxos de migração de allowlist.
- `channels.telegram.actions.poll`: habilita ou desabilita a criação de enquete no Telegram (padrão: habilitado; ainda exige `sendMessage`).
- `channels.telegram.defaultTo`: destino padrão do Telegram usado por `--deliver` na CLI quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist de remetentes em grupo (IDs numéricos de usuários do Telegram). `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs. Entradas não numéricas são ignoradas no momento da autenticação. A autenticação de grupo não usa fallback do armazenamento de pareamento de DM (`2026.2.25+`).
- Precedência de múltiplas contas:
  - Quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar explícito o roteamento padrão.
  - Se nenhum dos dois estiver definido, o OpenClaw usa como fallback o primeiro ID de conta normalizado e `openclaw doctor` emite um aviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam apenas à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando valores no nível da conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + allowlist (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: gating de menção padrão.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas as Skills, vazio = nenhuma).
  - `channels.telegram.groups.<id>.allowFrom`: substituição por grupo para allowlist de remetentes.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desabilita o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos do grupo + `agentId` exclusivo do tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: roteia este tópico para um agente específico (substitui roteamento no nível do grupo e por binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição por tópico para gating de menção.
- `bindings[]` de nível superior com `type: "acp"` e id canônico de tópico `chatId:topic:topicId` em `match.peer.id`: campos persistentes de binding de tópico ACP (veja [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: roteia tópicos de DM para um agente específico (mesmo comportamento de tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: habilita o Telegram como cliente de aprovações de exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuários do Telegram autorizados a aprovar ou negar solicitações de exec. Opcional quando `channels.telegram.allowFrom` ou um `channels.telegram.defaultTo` direto já identifica o proprietário.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico de origem do Telegram quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de chave de sessão (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<account>.execApprovals`: substituição por conta para roteamento de aprovação de exec no Telegram e autorização de aprovadores.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: habilita/desabilita comandos nativos de Skills no Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.telegram.linkPreview`: alterna prévias de links para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (prévia de stream ao vivo; padrão: `partial`; `progress` é mapeado para `partial`; `block` é compatibilidade legada com modo de prévia). A prévia em streaming do Telegram usa uma única mensagem de prévia que é editada no local.
- `channels.telegram.streaming.preview.toolProgress`: reutiliza a mensagem de prévia ao vivo para atualizações de ferramenta/progresso quando a prévia em streaming está ativa (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
- `channels.telegram.mediaMaxMb`: limite de mídia do Telegram recebida/enviada (MB, padrão: 100).
- `channels.telegram.retry`: política de nova tentativa para helpers de envio do Telegram (CLI/ferramentas/ações) em erros recuperáveis da API de saída (tentativas, `minDelayMs`, `maxDelayMs`, jitter).
- `channels.telegram.network.autoSelectFamily`: substitui `autoSelectFamily` do Node (true=habilita, false=desabilita). O padrão é habilitado no Node 22+, com WSL2 usando desabilitado por padrão.
- `channels.telegram.network.dnsResultOrder`: substitui a ordem de resultados DNS (`ipv4first` ou `verbatim`). O padrão é `ipv4first` no Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: habilitação perigosa para ambientes confiáveis com fake-IP ou proxy transparente em que downloads de mídia do Telegram resolvem `api.telegram.org` para endereços privados/internos/de uso especial fora da permissão padrão da faixa de benchmark RFC 2544.
- `channels.telegram.proxy`: URL de proxy para chamadas da Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilita o modo Webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo do Webhook (obrigatório quando `webhookUrl` está definido).
- `channels.telegram.webhookPath`: caminho local do Webhook (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host de bind local do Webhook (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta de bind local do Webhook (padrão `8787`).
- `channels.telegram.actions.reactions`: gating de reações da ferramenta do Telegram.
- `channels.telegram.actions.sendMessage`: gating de envios de mensagem da ferramenta do Telegram.
- `channels.telegram.actions.deleteMessage`: gating de exclusões de mensagem da ferramenta do Telegram.
- `channels.telegram.actions.sticker`: gating de ações de sticker do Telegram — enviar e pesquisar (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla quais reações acionam eventos do sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla a capacidade de reação do agente (padrão: `minimal` quando não definido).
- `channels.telegram.errorPolicy`: `reply | silent` — controla o comportamento de resposta de erro (padrão: `reply`). Substituições por conta/grupo/tópico são compatíveis.
- `channels.telegram.errorCooldownMs`: ms mínimo entre respostas de erro para o mesmo chat (padrão: `60000`). Evita spam de erros durante indisponibilidades.

- [Referência de configuração - Telegram](/pt-BR/gateway/configuration-reference#telegram)

Campos específicos do Telegram com maior sinal:

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
