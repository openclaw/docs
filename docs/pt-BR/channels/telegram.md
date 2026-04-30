---
read_when:
    - Trabalhando em funcionalidades do Telegram ou Webhooks
summary: Status de suporte, capacidades e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. Long polling é o modo padrão; o modo webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é o pareamento.
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

    Fallback de env: `TELEGRAM_BOT_TOKEN=...` (somente conta padrão).
    Telegram **não** usa `openclaw channels login telegram`; configure o token na configuração/env e então inicie o Gateway.

  </Step>

  <Step title="Inicie o Gateway e aprove a primeira DM">

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
A ordem de resolução do token considera a conta. Na prática, valores de configuração têm precedência sobre o fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Privacy Mode** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, você pode:

    - desativar o modo de privacidade via `/setprivacy`, ou
    - tornar o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova e readicione o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo do Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento de grupo sempre ativo.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para comportamento de visibilidade em grupos

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

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use apenas para bots intencionalmente públicos com ferramentas fortemente restritas; bots de um único proprietário devem usar `allowlist` com IDs numéricos de usuário.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuário do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações com múltiplas contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como uma fronteira de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a allowlist efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração pede apenas IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas de allowlist `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se antes você dependia de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: aprovação de pareamento por DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso por DM. Se ainda não existir proprietário de comando, o primeiro pareamento aprovado também define `commands.ownerAllowFrom` para que comandos exclusivos do proprietário e aprovações de exec tenham uma conta de operador explícita.
    A autorização de remetente em grupos ainda vem de allowlists explícitas na configuração.
    Se você quer "estou autorizado uma vez e tanto DMs quanto comandos de grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`; para comandos exclusivos do proprietário, garanta que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

    ### Encontrando seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

    1. Envie uma DM ao seu bot.
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
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos ficam bloqueados até você adicionar entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetente em grupos. Se não estiver definido, Telegram usa `allowFrom` como fallback.
    Entradas `groupAllowFrom` devem ser IDs numéricos de usuário do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Fronteira de segurança (`2026.2.25+`): autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, Telegram usa como fallback o `allowFrom` da configuração, não o armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa como padrão o fail-closed `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

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

      - Coloque IDs negativos de chat de grupo ou supergrupo do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram, como `8734062810`, em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
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

    Alternâncias de comando no nível da sessão:

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

    Obtendo o ID do chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- Telegram pertence ao processo do Gateway.
- O roteamento é determinístico: entradas do Telegram respondem de volta no Telegram (o modelo não escolhe canais).
- Mensagens recebidas são normalizadas para o envelope de canal compartilhado com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; OpenClaw as roteia com chaves de sessão cientes de thread e preserva o ID da thread para respostas.
- Long polling usa grammY runner com sequenciamento por chat/por thread. A concorrência geral do runner sink usa `agents.defaults.maxConcurrent`.
- Long polling é protegido dentro de cada processo do Gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vê conflitos `getUpdates` 409, outro Gateway OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinicializações do watchdog de long polling são acionadas após 120 segundos sem liveness concluída de `getUpdates` por padrão. Aumente `channels.telegram.pollingStallThresholdMs` apenas se sua implantação ainda tiver reinicializações falsas por polling-stall durante trabalho de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são compatíveis.
- Telegram Bot API não tem suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de stream ao vivo (edições de mensagem)">
    OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mapeia para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando o streaming de prévia está ativo)
    - `channels.telegram.streamMode` legado e valores booleanos de `streaming` são detectados; execute `openclaw doctor --fix` para migrá-los para `channels.telegram.streaming.mode`

    Atualizações de prévia de progresso de ferramenta são as linhas curtas "Trabalhando..." mostradas enquanto ferramentas são executadas, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento ou resumos de patches. Telegram as mantém ativadas por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`. Para manter a prévia editada para o texto da resposta, mas ocultar linhas de progresso de ferramenta, defina:

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

    Use `streaming.mode: "off"` apenas quando quiser entrega somente final: edições de prévia do Telegram são desativadas e conversas genéricas de ferramenta/progresso são suprimidas em vez de serem enviadas como mensagens "Trabalhando..." independentes. Prompts de aprovação, payloads de mídia e erros ainda são roteados pela entrega final normal. Use `streaming.preview.toolProgress: false` quando quiser manter apenas edições de prévia de resposta enquanto oculta as linhas de status de progresso de ferramenta.

    Para respostas somente texto:

    - prévias curtas de DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no local
    - prévias com mais de cerca de um minuto: o OpenClaw envia a resposta concluída como uma nova mensagem final e depois limpa a prévia, para que o carimbo de data/hora visível do Telegram reflita o horário de conclusão em vez do horário de criação da prévia

    Para respostas complexas (por exemplo, cargas de mídia), o OpenClaw volta para a entrega final normal e depois limpa a mensagem de prévia.

    O streaming de prévia é separado do streaming de bloco. Quando o streaming de bloco está explicitamente habilitado para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplicado.

    Stream de raciocínio exclusivo do Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo durante a geração
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback HTML">
    O texto de saída usa Telegram `parse_mode: "HTML"`.

    - Texto com estilo Markdown é renderizado em HTML seguro para Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de análise do Telegram.
    - Se o Telegram rejeitar o HTML analisado, o OpenClaw tenta novamente como texto simples.

    Pré-visualizações de links são habilitadas por padrão e podem ser desabilitadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Adicione entradas personalizadas ao menu de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regras:

    - nomes são normalizados (remove `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem sobrescrever comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de plugin/skill ainda podem funcionar quando digitados, mesmo se não forem exibidos no menu do Telegram

    Se comandos nativos estiverem desabilitados, os integrados são removidos. Comandos personalizados/de plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após a redução; reduza comandos de plugin/skill/personalizados ou desabilite `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` falhando com `404: Not Found` enquanto comandos curl diretos da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido como o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token do bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como uma falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` está instalado:

    1. `/pair` gera o código de configuração
    2. cole o código no aplicativo iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. A transferência de bootstrap integrada mantém o token do nó primário em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo de bootstrap são prefixadas por função, então essa lista de permissões de operador só satisfaz solicitações de operador; funções que não são de operador ainda precisam de escopos sob seu próprio prefixo de função.

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

    O legado `capabilities: ["inlineButtons"]` mapeia para `inlineButtons: "all"`.

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

    Cliques de callback são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    Ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de bloqueio:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desabilitado)

    Observação: `edit` e `topic-create` estão atualmente habilitados por padrão e não têm alternâncias separadas em `channels.telegram.actions.*`.
    Envios em tempo de execução usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), portanto os caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reações: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de resposta">
    O Telegram dá suporte a tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que disparou a ação
    - `[[reply_to:<id>]]` responde a uma ID específica de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de resposta está habilitado e o texto ou a legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita o texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desabilita o encadeamento implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de threads">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como destino a thread do tópico
    - caminho de configuração de tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam sobrescritas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda dos padrões do grupo.

    **Roteamento de agente por tópico**: Cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vínculo persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP por meio de vínculos ACP tipados de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e uma ID qualificada por tópico como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Veja [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto de template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão cientes de thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram distingue notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz
    - transcrições de notas de voz recebidas são enquadradas como texto gerado por máquina,
      não confiável no contexto do agente; a detecção de menção ainda usa a transcrição
      bruta, então mensagens de voz condicionadas a menção continuam funcionando.

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

    O Telegram distingue arquivos de vídeo de notas de vídeo.

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

    Notas de vídeo não dão suporte a legendas; o texto da mensagem fornecido é enviado separadamente.

    ### Stickers

    Tratamento de stickers recebidos:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM de vídeo: ignorado

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas de visão repetidas.

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

    Ação de envio de sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquise stickers em cache:

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
    Reações do Telegram chegam como atualizações `message_reaction` (separadas das cargas de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos do sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de tópico em atualizações de reação.
      - grupos que não são fóruns são roteados para a sessão de chat do grupo
      - grupos de fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Escritas de configuração a partir de eventos e comandos do Telegram">
    Escritas na configuração do canal são habilitadas por padrão (`configWrites !== false`).

    Escritas acionadas pelo Telegram incluem:

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

  <Accordion title="Long polling vs webhook">
    O padrão é long polling. Para o modo webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` opcionais (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    O listener local faz bind em `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo webhook valida as proteções da solicitação, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    Em seguida, o OpenClaw processa a atualização de forma assíncrona pelas mesmas lanes de bot por chat/por tópico usadas pelo long polling, então turnos lentos do agente não retêm o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, retry e alvos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de dividir por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia recebida e enviada do Telegram.
    - `channels.telegram.timeoutSeconds` sobrescreve o timeout do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY). Clientes de bot em long polling limitam valores configurados abaixo da proteção de solicitação de 45 segundos de `getUpdates`, para que polls ociosos não sejam abortados antes da conclusão da janela de poll de 30 segundos.
    - `channels.telegram.pollingStallThresholdMs` tem padrão `120000`; ajuste entre `30000` e `600000` apenas para reinicializações por polling travado falso-positivas.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - contexto suplementar de resposta/citação/encaminhamento é atualmente passado como recebido.
    - allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - Controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - A configuração `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega de resposta final recebida também usa uma nova tentativa de envio seguro limitada para falhas de pré-conexão do Telegram, mas não repete envelopes de rede ambíguos após o envio que poderiam duplicar mensagens visíveis.

    O alvo de envio da CLI pode ser um ID numérico de chat ou nome de usuário:

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
    - `--thread-id` para tópicos de fórum (ou use um alvo `:topic:`)

    O envio pelo Telegram também aceita:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permitir
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar mensagens nesse chat
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads de foto compactada ou mídia animada

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída do Telegram, incluindo polls
    - `channels.telegram.actions.poll=false` desabilita a criação de polls do Telegram, mantendo envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (faz fallback para IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de exec. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe nenhum proprietário de comando, então a configuração com um proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões de aprovação inline também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de plugin; os demais são resolvidos primeiro por aprovações de exec.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                        |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades. |

Substituições por conta, por grupo e por tópico são aceitas (mesma herança de outras chaves de configuração do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total.
      - BotFather: `/setprivacy` -> Disable
      - depois remova e readicione o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ter associação sondada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não está vendo mensagens de grupo">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/skill/customizados ou desabilite menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` são limitadas e tentam novamente uma vez pelo fallback de transporte do Telegram em timeout de solicitação. Erros persistentes de rede/fetch normalmente indicam problemas de DNS/alcance HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Inicialização relata token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token do bot no BotFather e atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-lo como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas de API posteriores.
    - Se `deleteWebhook` falhar com um erro transitório de rede durante a inicialização de polling, o OpenClaw verifica `getWebhookInfo`; quando o Telegram relata uma URL de webhook vazia, o polling continua porque a limpeza já foi satisfeita.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizados podem acionar comportamento de cancelamento imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 quebrada pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Se os sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo; clientes de bot com long polling limitam valores configurados abaixo da proteção da solicitação `getUpdates`, mas versões mais antigas podiam abortar cada polling quando isso era definido abaixo do tempo limite de long polling.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness de long poll concluída por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após o período de tolerância da inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após o período de tolerância da inicialização, ou quando a última atividade bem-sucedida do transporte de polling está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` somente quando chamadas `getUpdates` de longa duração estiverem saudáveis, mas seu host ainda relatar reinícios falsos por polling travado. Travamentos persistentes geralmente indicam problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita env de proxy do processo para transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda pode ignorar `api.telegram.org`.
    - Se o proxy gerenciado pelo OpenClaw estiver configurado por meio de `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhum env de proxy padrão estiver presente, o Telegram também usará essa URL para o transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas na faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro endereço
      privado/interno/de uso especial durante downloads de mídia, você pode optar
      pelo bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma adesão está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa de
      benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções de SSRF de mídia do Telegram. Use-a apenas em ambientes de proxy
      confiáveis controlados pelo operador, como roteamento fake-IP do Clash,
      Mihomo ou Surge quando eles sintetizam respostas privadas ou de uso especial
      fora da faixa de benchmark RFC 2544. Deixe-a desativada para acesso normal
      do Telegram à internet pública.
    </Warning>

    - Substituições de ambiente (temporárias):
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

<Accordion title="Campos de alta relevância do Telegram">

- inicialização/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de execução: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz da API personalizada: `apiRoot` (somente raiz da Bot API; não inclua `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- escritas/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência de várias contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw recorre ao primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não valores de `accounts.default.*`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram com o Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens recebidas para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaça e hardening.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Solução de problemas" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
