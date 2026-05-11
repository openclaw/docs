---
read_when:
    - Trabalhando em recursos ou Webhooks do Telegram
summary: Status de suporte, capacidades e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. Long polling é o modo padrão; o modo webhook é opcional.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é emparelhamento.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Criar o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

  </Step>

  <Step title="Configurar token e política de DM">

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

    Fallback de ambiente: `TELEGRAM_BOT_TOKEN=...` (somente conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token na configuração/env e então inicie o gateway.

  </Step>

  <Step title="Iniciar o gateway e aprovar a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Códigos de emparelhamento expiram após 1 hora.

  </Step>

  <Step title="Adicionar o bot a um grupo">
    Adicione o bot ao seu grupo e então obtenha os dois IDs necessários para o acesso ao grupo:

    - seu ID de usuário do Telegram, usado em `allowFrom` / `groupAllowFrom`
    - o ID do chat do grupo do Telegram, usado como chave em `channels.telegram.groups`

    Para a configuração inicial, obtenha o ID do chat do grupo em `openclaw logs --follow`, em um bot de ID encaminhado ou no `getUpdates` da Bot API. Depois que o grupo for permitido, `/whoami@<bot_username>` pode confirmar os IDs de usuário e grupo.

    IDs negativos de supergrupos do Telegram que começam com `-100` são IDs de chat de grupo. Coloque-os em `channels.telegram.groups`, não em `groupAllowFrom`.

  </Step>
</Steps>

<Note>
A ordem de resolução do token é ciente da conta. Na prática, valores de configuração prevalecem sobre o fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
</Note>

## Configurações no lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade de grupo">
    Bots do Telegram usam **Privacy Mode** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça uma destas opções:

    - desabilite o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

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

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use isso somente para bots intencionalmente públicos com ferramentas rigidamente restritas; bots de um único proprietário devem usar `allowlist` com IDs numéricos de usuário.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações com várias contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como um limite de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a allowlist efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração pede apenas IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas de allowlist `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist do armazenamento de emparelhamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de emparelhamento anteriores).

    Confusão comum: a aprovação de emparelhamento por DM não significa "este remetente está autorizado em todos os lugares".
    O emparelhamento concede acesso por DM. Se ainda não houver um proprietário de comandos, o primeiro emparelhamento aprovado também define `commands.ownerAllowFrom` para que comandos somente do proprietário e aprovações de exec tenham uma conta de operador explícita.
    A autorização de remetente em grupo ainda vem de allowlists explícitas na configuração.
    Se você quer "sou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`; para comandos somente do proprietário, certifique-se de que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

    ### Encontrar seu ID de usuário do Telegram

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
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetente em grupo. Se não definido, o Telegram faz fallback para `allowFrom`.
    Entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupos ou supergrupos do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): autenticação de remetente em grupo **não** herda aprovações do armazenamento de emparelhamento de DM.
    O emparelhamento permanece somente para DMs. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram faz fallback para `allowFrom` da configuração, não para o armazenamento de emparelhamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` não definido e permita os grupos-alvo em `channels.telegram.groups`.
    Nota de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com falha fechada, a menos que `channels.defaults.groupPolicy` esteja definido explicitamente.

    Configuração de grupo somente para proprietário:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Teste no grupo com `@<bot_username> ping`. Mensagens simples de grupo não acionam o bot enquanto `requireMention: true`.

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

      - Coloque IDs negativos de chats de grupos ou supergrupos do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
      - Coloque IDs de usuários do Telegram, como `8734062810`, em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` somente quando quiser que qualquer membro de um grupo permitido possa falar com o bot.

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

    Obter o ID do chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API
    - depois que o grupo for permitido, execute `/whoami@<bot_username>` se comandos nativos estiverem habilitados

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram pertence ao processo do gateway.
- O roteamento é determinístico: entradas do Telegram respondem de volta ao Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas no envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido da cadeia de respostas para respostas do Telegram que o gateway observou.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw preserva o ID da thread para respostas, mas mantém DMs na sessão plana por padrão. Configure `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou uma configuração de tópico correspondente quando você quiser intencionalmente isolamento de sessão por tópico em DM.
- Long polling usa o runner do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- Long polling é protegido dentro de cada processo de gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos 409 de `getUpdates`, outro gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinícios do watchdog de long-polling são acionados por padrão após 120 segundos sem liveness concluída de `getUpdates`. Aumente `channels.telegram.pollingStallThresholdMs` somente se sua implantação ainda tiver reinícios falsos por polling travado durante trabalhos de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são aceitas.
- A Bot API do Telegram não oferece suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de transmissão ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mantém um rascunho de status editável para o progresso de ferramentas, limpa-o ao concluir e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de pré-visualização editada (padrão: `true` quando o streaming de pré-visualização está ativo)
    - `streaming.preview.commandText` controla detalhes de comando/execução dentro dessas linhas de progresso de ferramenta: `raw` (padrão, preserva o comportamento lançado) ou `status` (somente rótulo da ferramenta)
    - valores legados de `channels.telegram.streamMode` e booleanos de `streaming` são detectados; execute `openclaw doctor --fix` para migrá-los para `channels.telegram.streaming.mode`

    Atualizações de pré-visualização de progresso de ferramenta são as linhas curtas de status mostradas enquanto ferramentas executam, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento ou resumos de patches. O Telegram as mantém ativadas por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`. Para manter a pré-visualização editada para o texto da resposta, mas ocultar linhas de progresso de ferramenta, defina:

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

    Para manter o progresso de ferramenta visível, mas ocultar texto de comando/execução, defina:

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

    Use o modo `progress` quando você quiser progresso de ferramenta visível sem editar a resposta final nessa mesma mensagem. Coloque a política de texto de comando em `streaming.progress`:

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

    Use `streaming.mode: "off"` somente quando você quiser entrega apenas final: edições de pré-visualização do Telegram são desativadas e conversas genéricas de ferramenta/progresso são suprimidas em vez de serem enviadas como mensagens de status independentes. Solicitações de aprovação, cargas de mídia e erros ainda são roteados pela entrega final normal. Use `streaming.preview.toolProgress: false` quando você quiser apenas manter edições de pré-visualização da resposta enquanto oculta as linhas de status de progresso de ferramenta.

    <Note>
      Respostas de citação selecionada do Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem recebida inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a pré-visualização da resposta, então `streaming.preview.toolProgress` não consegue mostrar as linhas curtas de status para essa interação. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de pré-visualização. Defina `replyToMode: "off"` quando a visibilidade de progresso de ferramenta importar mais do que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer a compensação.
    </Note>

    Para respostas somente de texto:

    - pré-visualizações curtas em DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de pré-visualização e faz a edição final no local
    - finais de texto longo que se dividem em várias mensagens do Telegram reutilizam a pré-visualização existente como o primeiro bloco final quando possível, depois enviam somente os blocos restantes
    - finais em modo de progresso limpam o rascunho de status e usam entrega final normal em vez de editar o rascunho para transformá-lo na resposta
    - se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa entrega final normal e limpa a pré-visualização obsoleta

    Para respostas complexas (por exemplo, cargas de mídia), o OpenClaw recorre à entrega final normal e depois limpa a mensagem de pré-visualização.

    O streaming de pré-visualização é separado do streaming em blocos. Quando o streaming em blocos é ativado explicitamente para o Telegram, o OpenClaw ignora o fluxo de pré-visualização para evitar streaming duplo.

    Fluxo de raciocínio exclusivo do Telegram:

    - `/reasoning stream` envia o raciocínio para a pré-visualização ao vivo enquanto gera
    - a pré-visualização do raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    O texto de saída usa `parse_mode: "HTML"` do Telegram.

    - Texto em estilo Markdown é renderizado para HTML seguro para o Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de análise do Telegram.
    - Se o Telegram rejeitar o HTML analisado, o OpenClaw tenta novamente como texto simples.

    Pré-visualizações de links são ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` ativa comandos nativos para o Telegram

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
    - comandos de plugin/skill ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram

    Se comandos nativos forem desativados, os integrados são removidos. Comandos personalizados/de plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de plugin/skill/personalizados ou desative `channels.telegram.commands.native`.
    - Falha de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos diretos de curl da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido como o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no aplicativo iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando há apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. A entrega integrada de bootstrap mantém o token do nó primário em `scopes: []`; qualquer token de operador entregue permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. Verificações de escopo de bootstrap têm prefixo de função, então essa lista de permissões de operador só satisfaz solicitações de operador; funções que não são de operador ainda precisam de escopos sob seu próprio prefixo de função.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

    Mais detalhes: [Pareamento](/pt-BR/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    Cliques de callback são passados para o agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de bloqueio:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` estão atualmente ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em tempo de execução usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), então caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    O Telegram aceita tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem acionadora
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de respostas está ativado e o texto ou a legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativo do Telegram. O Telegram limita texto de citação nativo a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e recaem para uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrupos com fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e ações de digitação miram o thread do tópico
    - caminho de configuração de tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações de grupo, salvo substituição (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo de tópico e não herda dos padrões de grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

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

    **Vinculação persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP por meio de vinculações ACP tipadas de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um ID qualificado por tópico como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Consulte [Agentes ACP](/pt-BR/tools/acp-agents).

    **Geração de ACP vinculada à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. OpenClaw fixa a confirmação de geração no tópico. Requer que `channels.telegram.threadBindings.spawnSessions` permaneça habilitado (padrão: `true`).

    O contexto do template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm o roteamento de DM e os metadados de resposta em sessões planas por padrão; eles só usam chaves de sessão com reconhecimento de thread quando configurados com `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ou uma configuração de tópico correspondente. Use `channels.telegram.dm.threadReplies` de nível superior para o padrão da conta, ou `direct.<chatId>.threadReplies` para uma DM.

  </Accordion>

  <Accordion title="Áudio, vídeo e figurinhas">
    ### Mensagens de áudio

    Telegram distingue mensagens de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar o envio como mensagem de voz
    - transcrições recebidas de mensagens de voz são enquadradas como texto gerado por máquina
      e não confiável no contexto do agente; a detecção de menções ainda usa a transcrição
      bruta, então mensagens de voz com gate por menção continuam funcionando.

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

    Telegram distingue arquivos de vídeo de mensagens de vídeo.

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

    Mensagens de vídeo não aceitam legendas; o texto de mensagem fornecido é enviado separadamente.

    ### Figurinhas

    Tratamento de figurinhas recebidas:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM de vídeo: ignorado

    Campos de contexto de figurinha:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de figurinhas:

    - `~/.openclaw/telegram/sticker-cache.json`

    Figurinhas são descritas uma vez (quando possível) e armazenadas em cache para reduzir chamadas de visão repetidas.

    Habilitar ações de figurinha:

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

    Ação de enviar figurinha:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquisar figurinhas em cache:

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

    Quando habilitado, OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - Telegram não fornece IDs de thread em atualizações de reação.
      - grupos que não são fórum roteiam para a sessão de chat do grupo
      - grupos de fórum roteiam para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook incluem `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - Telegram espera emoji Unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou uma conta.

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

  <Accordion title="Polling longo vs Webhook">
    O padrão é polling longo. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    No modo de polling longo, OpenClaw persiste sua marca d'água de reinicialização somente depois que uma atualização é despachada com sucesso. Se um handler falhar, essa atualização permanece passível de nova tentativa no mesmo processo e não é gravada como concluída para deduplicação na reinicialização.

    O listener local vincula a `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida as proteções de requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    OpenClaw então processa a atualização de forma assíncrona pelas mesmas lanes de bot por chat/por tópico usadas pelo polling longo, então turnos lentos do agente não seguram o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, nova tentativa e alvos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de dividir por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia recebida e enviada do Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram ficam em buffer antes que OpenClaw os despache como uma mensagem recebida. Aumente se partes do álbum chegarem tarde; diminua para reduzir a latência de resposta do álbum.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY). Clientes de bot limitam valores configurados abaixo da proteção de requisição de texto/digitação de saída de 60 segundos para que o grammY não aborte a entrega visível da resposta antes que a proteção de transporte e o fallback do OpenClaw possam executar. O polling longo ainda usa uma proteção de requisição `getUpdates` de 45 segundos para que polls ociosos não sejam abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` usa como padrão `120000`; ajuste entre `30000` e `600000` apenas para reinicializações por polling travado falso-positivas.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - contexto suplementar de resposta/citação/encaminhamento é normalizado em uma janela de contexto de conversa selecionada quando o Gateway observou as mensagens pai; o cache de mensagens observadas é persistido ao lado do armazenamento de sessões. Telegram inclui apenas um `reply_to_message` superficial nas atualizações, então cadeias mais antigas que o cache são limitadas ao payload de atualização atual do Telegram.
    - listas de permissão do Telegram fazem gate principalmente de quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica a helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega de resposta final recebida também usa uma nova tentativa limitada de envio seguro para falhas de pré-conexão do Telegram, mas não tenta novamente envelopes de rede ambíguos após o envio que poderiam duplicar mensagens visíveis.

    Alvos de envio da CLI e de ferramenta de mensagem podem ser ID numérico de chat, nome de usuário ou um alvo de tópico de fórum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Polls do Telegram usam `openclaw message poll` e dão suporte a tópicos de fórum:

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

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar nesse chat
    - `--force-document` para enviar imagens, GIFs e vídeos de saída como documentos em vez de uploads comprimidos de foto, mídia animada ou vídeo

    Gate de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída do Telegram, incluindo polls
    - `channels.telegram.actions.poll=false` desabilita a criação de polls do Telegram enquanto mantém envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente postar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (recorre a IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de exec. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe proprietário de comando, então a configuração com um proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões de aprovação inline também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de Plugin; outros são resolvidos primeiro por aprovações de exec.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores          | Padrão  | Descrição                                                                                                       |
| ----------------------------------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime totalmente as respostas de erro.      |
| `channels.telegram.errorCooldownMs` | número (ms)      | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante interrupções.               |

Há suporte a substituições por conta, por grupo e por tópico (mesma herança das outras chaves de configuração do Telegram).

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
  <Accordion title="O bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram precisa permitir visibilidade total.
      - BotFather: `/setprivacy` -> Desativar
      - depois remova e adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupos; o curinga `"*"` não pode ser verificado por associação.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não vê nenhuma mensagem de grupo">

    - quando `channels.telegram.groups` existe, o grupo precisa estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar mensagens

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize a identidade do remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/skill/personalizados ou desative menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` e chamadas de digitação `sendChatAction` são limitadas e tentam novamente uma vez pelo fallback de transporte do Telegram em caso de timeout da solicitação. Erros persistentes de rede/fetch geralmente indicam problemas de alcance DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="A inicialização relata token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token do bot no BotFather, depois atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas de API posteriores.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de abort imediato se os tipos de AbortSignal não coincidirem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 com defeito pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Durante a inicialização do polling, o OpenClaw reutiliza a sondagem `getMe` bem-sucedida da inicialização para o grammY, para que o executor não precise de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro de rede transitório durante a inicialização do polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do polling. Um Webhook ainda ativo aparece como um conflito de `getUpdates`; o OpenClaw então reconstrói o transporte do Telegram e tenta limpar o Webhook novamente.
    - Se os sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo; clientes de bot limitam valores configurados abaixo das proteções de solicitações de saída e `getUpdates`, mas versões mais antigas podiam abortar cada polling ou resposta quando isso era definido abaixo dessas proteções.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness de long-poll concluído por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após a tolerância de inicialização, quando uma conta de Webhook em execução não concluiu `setWebhook` após a tolerância de inicialização, ou quando a última atividade bem-sucedida do transporte de polling está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas `getUpdates` de longa duração estiverem saudáveis, mas seu host ainda relatar reinicializações falsas por travamento de polling. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita variáveis de ambiente de proxy do processo para o transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda podem ignorar `api.telegram.org`.
    - Se o proxy gerenciado do OpenClaw estiver configurado por `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhuma variável de ambiente de proxy padrão estiver presente, o Telegram também usa essa URL para o transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2). A ordem dos resultados DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada se aplicar, Node 22+ recorre a `ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas da faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro endereço
      privado/interno/de uso especial durante downloads de mídia, você pode optar
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
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa
      de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções SSRF de mídia do Telegram. Use apenas em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento fake-IP do Clash,
      Mihomo ou Surge, quando eles sintetizam respostas privadas ou de uso
      especial fora da faixa de benchmark RFC 2544. Deixe desativado para acesso
      normal ao Telegram pela internet pública.
    </Warning>

    - Substituições de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valide as respostas DNS:

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

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de execução: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadeamento/respostas: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz de API personalizada: `apiRoot` (somente raiz da Bot API; não inclua `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- escritas/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência de múltiplas contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar explícito o roteamento padrão. Caso contrário, o OpenClaw recorre ao primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não os valores de `accounts.default.*`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de allowlist de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canal" icon="route" href="/pt-BR/channels/channel-routing">
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
