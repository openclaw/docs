---
read_when:
    - Trabalhando em recursos do Telegram ou Webhooks
summary: Status do suporte do bot do Telegram, recursos e configuração
title: Telegram
x-i18n:
    generated_at: "2026-04-25T18:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9509ae437c6017c966d944b6d09af65b106f78ea023174127ac900b8cdc45ede
    source_path: channels/telegram.md
    workflow: 15
---

Pronto para produção para DMs de bots e grupos via grammY. Long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
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
  <Step title="Crie o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

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

    Fallback por variável de ambiente: `TELEGRAM_BOT_TOKEN=...` (apenas conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e depois inicie o gateway.

  </Step>

  <Step title="Inicie o gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Os códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e depois defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token reconhece contas. Na prática, os valores de config prevalecem sobre o fallback por variável de ambiente, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova e readicione o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo no Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para um comportamento sempre ativo no grupo.

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
    Se você atualizou e sua configuração contém entradas `@username` na allowlist, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; requer um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso persistente na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: aprovar o pareamento de DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso apenas a DMs. A autorização de remetentes em grupos ainda vem de allowlists explícitas na configuração.
    Se você quiser "eu sou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`.

    ### Como encontrar seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

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
    Dois controles se aplicam em conjunto:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar pelas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): os grupos são bloqueados até que você adicione entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupos. Se não estiver definido, o Telegram usa `allowFrom` como fallback.
    As entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs negativos de chat pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento continua sendo apenas para DMs. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram usa `allowFrom` da configuração como fallback, não o armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` sem definir e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, os padrões de runtime usam fail-closed com `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

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

      - Coloque IDs negativos de grupos ou supergrupos do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
      - Coloque IDs de usuários do Telegram, como `8734062810`, em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` apenas quando quiser que qualquer membro de um grupo permitido possa falar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas em grupo exigem menção por padrão.

    A menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias de comando em nível de sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use configuração para persistência.

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

    Como obter o ID do chat de grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é controlado pelo processo do gateway.
- O roteamento é determinístico: respostas de entrada do Telegram retornam para o Telegram (o modelo não escolhe canais).
- As mensagens recebidas são normalizadas no envelope compartilhado de canais com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw as roteia com chaves de sessão sensíveis a thread e preserva o ID da thread para as respostas.
- Long polling usa grammY runner com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- O long polling é protegido dentro de cada processo do gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos 409 de `getUpdates`, outro gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinícios do watchdog de long polling são acionados após 120 segundos sem liveness concluído de `getUpdates` por padrão. Aumente `channels.telegram.pollingStallThresholdMs` apenas se sua implantação ainda encontrar reinícios falsos por travamento de polling durante trabalhos de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são compatíveis.
- A Telegram Bot API não oferece suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de streaming ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` é mapeado para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando o streaming de prévia está ativo)
    - valores booleanos legados em `channels.telegram.streamMode` e `streaming` são detectados; execute `openclaw doctor --fix` para migrá-los para `channels.telegram.streaming.mode`

    As atualizações de prévia de progresso de ferramenta são as linhas curtas de "Working..." mostradas enquanto as ferramentas estão em execução, por exemplo execução de comandos, leituras de arquivo, atualizações de planejamento ou resumos de patch. O Telegram as mantém ativadas por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`. Para manter a prévia editada para o texto da resposta, mas ocultar as linhas de progresso de ferramenta, defina:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Use `streaming.mode: "off"` apenas quando quiser desativar completamente as edições de prévia no Telegram. Use `streaming.preview.toolProgress: false` quando quiser apenas desativar as linhas de status de progresso de ferramenta.

    Para respostas somente de texto:

    - DM: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no local (sem segunda mensagem)
    - grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no local (sem segunda mensagem)

    Para respostas complexas (por exemplo payloads de mídia), o OpenClaw usa entrega final normal como fallback e depois limpa a mensagem de prévia.

    O streaming de prévia é separado do block streaming. Quando o block streaming é habilitado explicitamente para o Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplo.

    Se o transporte nativo de rascunho não estiver disponível/for rejeitado, o OpenClaw usa `sendMessage` + `editMessageText` automaticamente como fallback.

    Stream de raciocínio somente para Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo durante a geração
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback para HTML">
    O texto de saída usa Telegram `parse_mode: "HTML"`.

    - Texto no estilo Markdown é renderizado como HTML seguro para Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de parse no Telegram.
    - Se o Telegram rejeitar o HTML parseado, o OpenClaw tenta novamente como texto simples.

    As prévias de links são ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` ativa comandos nativos para Telegram

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

    - os nomes são normalizados (removem `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não sejam mostrados no menu do Telegram

    Se os comandos nativos estiverem desativados, os integrados serão removidos. Comandos personalizados/de Plugin ainda poderão ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de Plugin/Skills/personalizados ou desative `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch normalmente significa que o DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando há apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token bootstrap de curta duração. A transferência bootstrap integrada mantém o token do node primário em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo bootstrap usam prefixo da função, então essa allowlist de operador atende apenas solicitações de operador; funções que não são de operador ainda precisam de escopos sob o prefixo da própria função.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

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

    O legado `capabilities: ["inlineButtons"]` é mapeado para `inlineButtons: "all"`.

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

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    As ações de mensagem do canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` estão atualmente ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Os envios em runtime usam o snapshot ativo de config/secrets (inicialização/reload), então os caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de respostas">
    O Telegram oferece suporte a tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos com fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como destino a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo de tópico e não é herdado dos padrões do grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico geral → agente main
                "3": { agentId: "zu" },        // Tópico de desenvolvimento → agente zu
                "5": { agentId: "coder" }      // Revisão de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculação persistente de tópico ACP**: tópicos de fórum podem fixar sessões de harness ACP por meio de bindings ACP tipados de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico como `-1001234567890:topic:42`). Atualmente com escopo para tópicos de fórum em grupos/supergrupos. Veja [ACP Agents](/pt-BR/tools/acp-agents).

    **Criação de ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de criação no tópico. Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão sensíveis a thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz
    - transcrições recebidas de nota de voz são enquadradas como texto não confiável gerado por máquina no contexto do agente; a detecção de menção ainda usa a transcrição bruta, então mensagens de voz controladas por menção continuam funcionando.

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

    Notas de vídeo não oferecem suporte a legendas; o texto da mensagem fornecido é enviado separadamente.

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

    Os stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de visão.

    Ative ações de sticker:

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
    Reações no Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando ativado, o OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread nas atualizações de reação.
      - grupos sem fórum são roteados para a sessão do chat em grupo
      - grupos com fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo "👀").
    - Use `""` para desativar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações na configuração do canal são ativadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (requer ativação de comando)

    Desativar:

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
    O padrão é long polling. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionalmente `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    O listener local se vincula a `127.0.0.1:8787`. Para ingress público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida os guardas da requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    Depois, o OpenClaw processa a atualização de forma assíncrona pelas mesmas lanes de bot por chat/por tópico usadas pelo long polling, para que turnos lentos do agente não segurem o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, retry e destinos da CLI">
    - o padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de dividir por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho da mídia recebida e enviada no Telegram.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY).
    - `channels.telegram.pollingStallThresholdMs` tem padrão `120000`; ajuste entre `30000` e `600000` apenas para reinícios falsos positivos por travamento do polling.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto suplementar de resposta/citação/encaminhamento atualmente é repassado como recebido.
    - as allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída.

    O destino de envio da CLI pode ser um ID numérico de chat ou nome de usuário:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Polls do Telegram usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de poll exclusivas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um destino `:topic:`)

    O envio no Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permitir
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar naquela conversa
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads compactados de foto ou mídia animada

    Gating de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo polls
    - `channels.telegram.actions.poll=false` desativa a criação de polls no Telegram, mantendo envios regulares ativados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts no chat ou tópico de origem. Os aprovadores devem ser IDs numéricos de usuários do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (é ativado automaticamente quando pelo menos um aprovador pode ser resolvido)
    - `channels.telegram.execApprovals.approvers` (usa como fallback IDs numéricos de proprietários de `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    A entrega no canal mostra o texto do comando no chat; ative `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega em um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e para o acompanhamento. As aprovações de exec expiram após 30 minutos por padrão.

    Botões inline de aprovação também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação com prefixo `plugin:` são resolvidos por meio de aprovações de Plugin; os demais são resolvidos primeiro por meio de aprovações de exec.

    Veja [Exec approvals](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou do provider, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                           |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro no mesmo chat. Evita spam de erros durante indisponibilidades.      |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança que outras chaves de configuração do Telegram).

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

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade completa.
      - BotFather: `/setprivacy` -> Disable
      - depois remova e readicione o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupos; o curinga `"*"` não pode ter associação verificada por probe.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não está vendo mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique se o bot faz parte do grupo
    - revise os logs: `openclaw logs --follow` para ver motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/Skills/personalizados ou desative menus nativos
    - `setMyCommands failed` com erros de rede/fetch normalmente indica problemas de alcance de DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de aborto imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` primeiro para IPv6; saída IPv6 com problema pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness concluído do long poll por padrão.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas longas de `getUpdates` estiverem saudáveis, mas seu host ainda reportar reinícios falsos por travamento de polling. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - O Node 22+ usa como padrão `autoSelectFamily=true` (exceto no WSL2) e `dnsResultOrder=ipv4first`.
    - Se o seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas na faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode
      ativar o bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma ativação opcional está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se o seu proxy resolver hosts de mídia do Telegram em `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções SSRF de mídia do Telegram. Use isso apenas em ambientes de proxy
      confiáveis e controlados por operador, como roteamento fake-IP do Clash, Mihomo ou Surge, quando eles
      sintetizarem respostas privadas ou de uso especial fora da faixa de benchmark RFC 2544.
      Deixe isso desativado para acesso normal ao Telegram pela internet pública.
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

Mais ajuda: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Referência de configuração

Referência principal: [Referência de configuração - Telegram](/pt-BR/gateway/config-channels#telegram).

<Accordion title="Campos de Telegram de alto sinal">

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

</Accordion>

<Note>
Precedência multi-conta: quando dois ou mais IDs de conta estão configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw usa como fallback o primeiro ID de conta normalizado e `openclaw doctor` emite um aviso. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de allowlist de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens recebidas para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e reforço de segurança.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Solução de problemas" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
