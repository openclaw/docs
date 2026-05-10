---
read_when:
    - Trabalhando em recursos do Telegram ou Webhooks
summary: Status de suporte, recursos e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. Long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é emparelhamento.
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
    Telegram **não** usa `openclaw channels login telegram`; configure o token na config/env e então inicie o Gateway.

  </Step>

  <Step title="Inicie o Gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Códigos de emparelhamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e então defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução de tokens considera a conta. Na prática, valores de configuração vencem o fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens de grupo:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot um admin do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de admin é controlado nas configurações do grupo do Telegram.

    Bots admins recebem todas as mensagens de grupo, o que é útil para comportamento de grupo sempre ativo.

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
    - `allowlist` (requer pelo menos um ID de remetente em `allowFrom`)
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use apenas para bots intencionalmente públicos com ferramentas rigidamente restritas; bots de um único proprietário devem usar `allowlist` com IDs de usuário numéricos.

    `channels.telegram.allowFrom` aceita IDs de usuário numéricos do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configs de múltiplas contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como uma fronteira de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a allowlist efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de config.
    A configuração solicita apenas IDs de usuário numéricos.
    Se você fez upgrade e sua config contém entradas de allowlist `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; requer um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist do armazenamento de emparelhamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs `allowFrom` numéricos explícitos para manter a política de acesso durável na config (em vez de depender de aprovações de emparelhamento anteriores).

    Confusão comum: aprovação de emparelhamento por DM não significa "este remetente está autorizado em todos os lugares".
    O emparelhamento concede acesso por DM. Se ainda não existir proprietário de comandos, o primeiro emparelhamento aprovado também define `commands.ownerAllowFrom` para que comandos somente do proprietário e aprovações de exec tenham uma conta de operador explícita.
    A autorização de remetente em grupos ainda vem de allowlists explícitas na config.
    Se você quer "sou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID de usuário numérico do Telegram em `channels.telegram.allowFrom`; para comandos somente do proprietário, certifique-se de que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

    ### Encontrando seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

    1. Envie uma DM para seu bot.
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
       - sem config `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes de grupo. Se não definido, Telegram recorre a `allowFrom`.
    Entradas `groupAllowFrom` devem ser IDs de usuário numéricos do Telegram (`telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Fronteira de segurança (`2026.2.25+`): auth de remetente de grupo **não** herda aprovações do armazenamento de emparelhamento de DM.
    O emparelhamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, Telegram recorre a `allowFrom` da config, não ao armazenamento de emparelhamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa o padrão fail-closed `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

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

      - Coloque IDs de chat de grupos ou supergrupos do Telegram negativos como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` apenas quando quiser que qualquer membro de um grupo permitido possa falar com o bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento de menções">
    Respostas em grupos exigem menção por padrão.

    A menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias de comando no nível da sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use config para persistência.

    Exemplo de config persistente:

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

    Obtendo o ID do chat de grupo:

    - encaminhe uma mensagem de grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento de runtime

- Telegram é de propriedade do processo do Gateway.
- O roteamento é determinístico: entradas do Telegram respondem de volta no Telegram (o modelo não escolhe canais).
- Mensagens recebidas são normalizadas no envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido de cadeia de respostas para respostas do Telegram que o Gateway observou.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; OpenClaw preserva o ID da thread para respostas, mas mantém DMs na sessão plana por padrão. Configure `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou uma config de tópico correspondente quando você quiser intencionalmente isolamento de sessão por tópico de DM.
- Long polling usa o runner do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- Long polling é protegido dentro de cada processo do Gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos `getUpdates` 409, outro Gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinicializações do watchdog de long-polling são acionadas após 120 segundos sem liveness de `getUpdates` concluído por padrão. Aumente `channels.telegram.pollingStallThresholdMs` apenas se seu deployment ainda observar reinicializações falsas por polling parado durante trabalhos de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; overrides por conta são compatíveis.
- A Bot API do Telegram não tem suporte a recibos de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de transmissão ao vivo (edições de mensagem)">
    OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mantém um rascunho de status editável para progresso de ferramentas, limpa-o ao concluir e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando streaming de prévia está ativo)
    - `streaming.preview.commandText` controla detalhes de comando/exec dentro dessas linhas de progresso de ferramentas: `raw` (padrão, preserva o comportamento lançado) ou `status` (apenas rótulo da ferramenta)
    - `channels.telegram.streamMode` legado e valores booleanos de `streaming` são detectados; execute `openclaw doctor --fix` para migrá-los para `channels.telegram.streaming.mode`

    Atualizações de prévia de progresso de ferramentas são as linhas curtas de status exibidas enquanto ferramentas são executadas, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento ou resumos de patches. Telegram mantém isso habilitado por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`. Para manter a prévia editada para texto de resposta, mas ocultar linhas de progresso de ferramentas, defina:

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

    Para manter o progresso de ferramentas visível, mas ocultar o texto de comando/execução, defina:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Use o modo `progress` quando quiser progresso de ferramentas visível sem editar a resposta final nessa mesma mensagem. Coloque a política de texto de comando em `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Use `streaming.mode: "off"` somente quando quiser entrega apenas final: as edições de prévia do Telegram são desativadas, e a conversa genérica de ferramentas/progresso é suprimida em vez de ser enviada como mensagens de status independentes. Prompts de aprovação, payloads de mídia e erros ainda passam pela entrega final normal. Use `streaming.preview.toolProgress: false` quando quiser apenas manter as edições de prévia da resposta enquanto oculta as linhas de status de progresso de ferramentas.

    <Note>
      As respostas a citações selecionadas no Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem recebida inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a prévia da resposta, então `streaming.preview.toolProgress` não consegue mostrar as linhas curtas de status para esse turno. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de prévia. Defina `replyToMode: "off"` quando a visibilidade do progresso de ferramentas for mais importante que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer essa troca.
    </Note>

    Para respostas somente texto:

    - prévias curtas em DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz a edição final no local
    - finais de texto longos que se dividem em várias mensagens do Telegram reutilizam a prévia existente como o primeiro trecho final quando possível, depois enviam apenas os trechos restantes
    - finais em modo de progresso limpam o rascunho de status e usam a entrega final normal em vez de editar o rascunho na resposta
    - se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa a entrega final normal e limpa a prévia obsoleta

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw recorre à entrega final normal e depois limpa a mensagem de prévia.

    Streaming de prévia é separado de streaming em blocos. Quando o streaming em blocos é explicitamente habilitado para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplicado.

    Stream de raciocínio somente no Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo durante a geração
    - a prévia de raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback HTML">
    O texto de saída usa Telegram `parse_mode: "HTML"`.

    - Texto no estilo Markdown é renderizado para HTML seguro para Telegram.
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

    - nomes são normalizados (remove `/` inicial, converte para minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram

    Se os comandos nativos estiverem desabilitados, os comandos integrados serão removidos. Comandos personalizados/de Plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após a redução; reduza comandos de Plugin/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - Falha em `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos diretos de curl da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido como o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove uma ocorrência acidental de `/bot<TOKEN>` no final.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como falha de limpeza de webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. A transferência de bootstrap integrada mantém o token do nó primário em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo de bootstrap têm prefixo de função, então essa lista de permissões de operador satisfaz apenas solicitações de operador; funções que não são de operador ainda precisam de escopos sob seu próprio prefixo de função.

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

    `capabilities: ["inlineButtons"]` legado mapeia para `inlineButtons: "all"`.

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
    As ações de ferramentas do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desabilitado)

    Observação: `edit` e `topic-create` atualmente são habilitados por padrão e não têm toggles `channels.telegram.actions.*` separados.
    Envios em runtime usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), então os caminhos de ação não executam nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de respostas">
    O Telegram aceita tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` responde à mensagem acionadora
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de respostas está habilitado e o texto ou legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de threads">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como alvo a thread do tópico
    - caminho de configuração de tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico Geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda dos padrões do grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente ao definir `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

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

    **Vínculo persistente de tópico ACP**: tópicos de fórum podem fixar sessões de harness ACP por meio de vínculos ACP tipados de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico, como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Veja [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer que `channels.telegram.threadBindings.spawnSessions` permaneça habilitado (padrão: `true`).

    O contexto do modelo expõe `MessageThreadId` e `IsForum`. Conversas de DM com `message_thread_id` mantêm roteamento de DM e metadados de resposta em sessões planas por padrão; elas só usam chaves de sessão cientes de threads quando configuradas com `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ou uma configuração de tópico correspondente. Use `channels.telegram.dm.threadReplies` no nível superior para o padrão da conta, ou `direct.<chatId>.threadReplies` para uma DM.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    Telegram diferencia recados de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar o envio como recado de voz
    - transcrições de recados de voz recebidos são enquadradas como texto gerado por máquina
      e não confiável no contexto do agente; a detecção de menções ainda usa a transcrição
      bruta, então mensagens de voz dependentes de menção continuam funcionando.

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

    Telegram diferencia arquivos de vídeo de recados de vídeo.

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

    Recados de vídeo não oferecem suporte a legendas; o texto de mensagem fornecido é enviado separadamente.

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

    Stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de visão.

    Habilitar ações de sticker:

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

    Quando habilitado, o OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - Telegram não fornece IDs de thread em atualizações de reação.
      - grupos que não são fóruns são roteados para a sessão do chat em grupo
      - grupos de fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook incluem `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - Telegram espera emoji Unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações de configuração de canal são habilitadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (exige habilitação de comando)

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
    O padrão é long polling. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` são opcionais (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    No modo long polling, o OpenClaw persiste sua marca d'água de reinício somente depois que uma atualização é despachada com sucesso. Se um handler falhar, essa atualização permanece retentável no mesmo processo e não é registrada como concluída para desduplicação após reinício.

    O listener local se vincula a `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida guardas de requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    O OpenClaw então processa a atualização de forma assíncrona pelas mesmas filas por chat/por tópico do bot usadas pelo long polling, então turnos lentos do agente não seguram o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, nova tentativa e destinos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia recebida e enviada do Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram são armazenados em buffer antes que o OpenClaw os despache como uma única mensagem recebida. Aumente se partes do álbum chegarem tarde; diminua para reduzir a latência de resposta do álbum.
    - `channels.telegram.timeoutSeconds` sobrescreve o timeout do cliente da API do Telegram (se não definido, o padrão do grammY se aplica). Clientes de bot limitam valores configurados abaixo do guarda de requisição de texto/digitação de saída de 60 segundos, para que o grammY não aborte a entrega de resposta visível antes que o guarda de transporte e o fallback do OpenClaw possam executar. Long polling ainda usa um guarda de requisição `getUpdates` de 45 segundos para que polls ociosos não sejam abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tem padrão `120000`; ajuste entre `30000` e `600000` apenas para reinícios por stall de polling falso-positivo.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - contexto suplementar de resposta/citação/encaminhamento é normalizado em uma janela selecionada de contexto de conversa quando o Gateway observou as mensagens pai; o cache de mensagens observadas é persistido ao lado do armazenamento de sessões. Telegram inclui apenas um `reply_to_message` raso nas atualizações, então cadeias mais antigas que o cache ficam limitadas ao payload de atualização atual do Telegram.
    - allowlists do Telegram controlam principalmente quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.
    - Controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - A configuração `channels.telegram.retry` se aplica a helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega de resposta final recebida também usa uma nova tentativa limitada de envio seguro para falhas de pré-conexão do Telegram, mas não tenta novamente envelopes de rede ambíguos pós-envio que poderiam duplicar mensagens visíveis.

    Destinos de envio da CLI e da ferramenta de mensagens podem ser ID numérico de chat, nome de usuário ou um destino de tópico de fórum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    Envio do Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot pode fixar mensagens nesse chat
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads de foto compactada ou mídia animada

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída do Telegram, incluindo polls
    - `channels.telegram.actions.poll=false` desabilita a criação de polls do Telegram, mantendo envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    Telegram oferece suporte a aprovações de exec em DMs de aprovadores e, opcionalmente, pode publicar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuários do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (faz fallback para IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de exec. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe proprietário de comando, então a configuração com um único proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões inline de aprovação também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de plugin; outros são resolvidos primeiro por aprovações de exec.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                     |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável ao chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades. |

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
      - depois remova e adicione o bot novamente ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupos; o curinga `"*"` não pode ter associação verificada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não vê nenhuma mensagem do grupo">

    - quando `channels.telegram.groups` existir, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para ver motivos de ignorar mensagens

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (emparelhamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política do grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/skill/personalizados ou desative menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` e chamadas de digitação `sendChatAction` são limitadas e tentam novamente uma vez pelo fallback de transporte do Telegram em caso de tempo limite da solicitação. Erros persistentes de rede/fetch geralmente indicam problemas de DNS/HTTPS para alcançar `api.telegram.org`

  </Accordion>

  <Accordion title="Inicialização relata token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou gere novamente o token do bot no BotFather e, em seguida, atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-lo como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas posteriores da API.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de aborto imediato se os tipos de AbortSignal não coincidirem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 com problemas pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Durante a inicialização de polling, o OpenClaw reutiliza a sondagem `getMe` bem-sucedida da inicialização para grammY, então o executor não precisa de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro transitório de rede durante a inicialização de polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do polling. Um webhook ainda ativo aparece como um conflito de `getUpdates`; então o OpenClaw reconstrói o transporte do Telegram e tenta limpar o webhook novamente.
    - Se sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se `channels.telegram.timeoutSeconds` está baixo; clientes de bot limitam valores configurados abaixo das proteções de solicitação de saída e `getUpdates`, mas versões mais antigas podiam abortar cada poll ou resposta quando isso era definido abaixo dessas proteções.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem vivacidade de long-poll concluída por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após a tolerância de inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após a tolerância de inicialização, ou quando a última atividade de transporte de polling bem-sucedida está antiga.
    - Aumente `channels.telegram.pollingStallThresholdMs` somente quando chamadas `getUpdates` de longa duração estiverem saudáveis, mas seu host ainda relatar reinicializações falsas por travamento de polling. Travamentos persistentes geralmente indicam problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita variáveis de ambiente de proxy do processo para transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda podem ignorar `api.telegram.org`.
    - Se o proxy gerenciado do OpenClaw estiver configurado por `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhuma variável de ambiente padrão de proxy estiver presente, o Telegram também usa essa URL para transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2). A ordem de resultados DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada se aplicar, Node 22+ recorre a `ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas de intervalo de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      para downloads de mídia do Telegram por padrão. Se um proxy fake-IP ou
      transparente confiável reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode optar
      pelo bypass somente para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma opção está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite o intervalo de
      benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as proteções
      de SSRF de mídia do Telegram. Use apenas em ambientes de proxy confiáveis e
      controlados pelo operador, como roteamento fake-IP do Clash, Mihomo ou Surge, quando eles
      sintetizarem respostas privadas ou de uso especial fora do intervalo de benchmark
      RFC 2544. Deixe desativado para acesso normal ao Telegram pela internet pública.
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

<Accordion title="Campos de alto sinal do Telegram">

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; links simbólicos são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de execução: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadeamento/respostas: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz de API personalizada: `apiRoot` (apenas raiz da Bot API; não inclua `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
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
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Telegram ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e endurecimento.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Solução de problemas" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
