---
read_when:
    - Trabalhando em recursos do Telegram ou Webhooks
summary: Status de suporte, recursos e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. O long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é emparelhamento.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
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
    Telegram **não** usa `openclaw channels login telegram`; configure o token na configuração/env e depois inicie o Gateway.

  </Step>

  <Step title="Inicie o Gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Os códigos de emparelhamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e, em seguida, defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução de token considera a conta. Na prática, valores de configuração têm precedência sobre o fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens de grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações de grupo do Telegram.

    Bots administradores recebem todas as mensagens de grupo, o que é útil para comportamento de grupo sempre ativo.

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

    `channels.telegram.allowFrom` aceita IDs numéricos de usuário do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações de várias contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como um limite de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a lista de permissões efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração inicial pede somente IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas de lista de permissões `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se você anteriormente dependia de arquivos de lista de permissões do armazenamento de emparelhamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de lista de permissões (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de emparelhamento anteriores).

    Confusão comum: aprovação de emparelhamento por DM não significa "este remetente está autorizado em todos os lugares".
    O emparelhamento concede acesso por DM. Se ainda não houver proprietário de comandos, o primeiro emparelhamento aprovado também define `commands.ownerAllowFrom` para que comandos exclusivos do proprietário e aprovações de execução tenham uma conta de operador explícita.
    A autorização de remetentes em grupo ainda vem de listas de permissões explícitas na configuração.
    Se você quer "estou autorizado uma vez e tanto DMs quanto comandos de grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`; para comandos exclusivos do proprietário, garanta que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

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

  <Tab title="Política de grupo e listas de permissões">
    Dois controles se aplicam em conjunto:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos ficam bloqueados até você adicionar entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como lista de permissões (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupo. Se não definido, Telegram recorre a `allowFrom`.
    Entradas `groupAllowFrom` devem ser IDs numéricos de usuário do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupos ou supergrupos do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): autenticação de remetente em grupo **não** herda aprovações de armazenamento de emparelhamento por DM.
    O emparelhamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, Telegram recorre a `allowFrom` da configuração, não ao armazenamento de emparelhamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos-alvo em `channels.telegram.groups`.
    Nota de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com falha fechada, a menos que `channels.defaults.groupPolicy` esteja explicitamente definido.

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
      Erro comum: `groupAllowFrom` não é uma lista de permissões de grupos do Telegram.

      - Coloque IDs de chat negativos de grupos ou supergrupos do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram, como `8734062810`, em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` somente quando quiser que qualquer membro de um grupo permitido consiga falar com o bot.

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

    Elas atualizam somente o estado da sessão. Use configuração para persistência.

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

## Comportamento de runtime

- Telegram é de propriedade do processo do Gateway.
- O roteamento é determinístico: entradas do Telegram respondem de volta no Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas no envelope de canal compartilhado com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; OpenClaw preserva o ID da conversa para respostas, mas mantém DMs na sessão plana por padrão. Configure `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou uma configuração de tópico correspondente quando você intencionalmente quiser isolamento de sessão por tópico de DM.
- Long polling usa o runner do grammY com sequenciamento por chat/por conversa. A concorrência geral do coletor do runner usa `agents.defaults.maxConcurrent`.
- Long polling é protegido dentro de cada processo do Gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos `getUpdates` 409, outro Gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinicializações do watchdog de long polling são acionadas após 120 segundos sem vivacidade de `getUpdates` concluída por padrão. Aumente `channels.telegram.pollingStallThresholdMs` somente se sua implantação ainda vir reinicializações falsas por travamento de polling durante trabalhos de longa duração. O valor está em milissegundos e é permitido de `30000` a `600000`; substituições por conta são compatíveis.
- A Telegram Bot API não oferece suporte a recibos de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de transmissão ao vivo (edições de mensagem)">
    OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mantém um rascunho de status editável e o atualiza com progresso de ferramentas até a entrega final
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando a transmissão de prévia está ativa)
    - `streaming.preview.commandText` controla detalhes de comando/execução dentro dessas linhas de progresso de ferramenta: `raw` (padrão, preserva o comportamento lançado) ou `status` (somente rótulo da ferramenta)
    - `channels.telegram.streamMode` legado e valores booleanos de `streaming` são detectados; execute `openclaw doctor --fix` para migrá-los para `channels.telegram.streaming.mode`

    Atualizações de prévia de progresso de ferramenta são as linhas curtas de status mostradas enquanto ferramentas são executadas, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento ou resumos de patch. Telegram as mantém ativadas por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`. Para manter a prévia editada para o texto da resposta, mas ocultar linhas de progresso de ferramenta, defina:

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

    Para o modo de rascunho de progresso, coloque a mesma política de texto de comando em `streaming.progress`:

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

    Use `streaming.mode: "off"` somente quando quiser entrega apenas final: as edições de pré-visualização do Telegram são desativadas e conversas genéricas de ferramenta/progresso são suprimidas em vez de serem enviadas como mensagens de status independentes. Prompts de aprovação, cargas de mídia e erros ainda passam pela entrega final normal. Use `streaming.preview.toolProgress: false` quando quiser manter apenas as edições de pré-visualização da resposta enquanto oculta as linhas de status de progresso da ferramenta.

    <Note>
      As respostas a citações selecionadas do Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem recebida inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a pré-visualização da resposta, portanto `streaming.preview.toolProgress` não pode mostrar as linhas curtas de status para essa interação. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de pré-visualização. Defina `replyToMode: "off"` quando a visibilidade do progresso da ferramenta for mais importante do que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer essa troca.
    </Note>

    Para respostas somente em texto:

    - pré-visualizações curtas em DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de pré-visualização e faz uma edição final no mesmo lugar, a menos que uma mensagem visível que não seja de pré-visualização tenha sido enviada depois que a pré-visualização apareceu
    - pré-visualizações seguidas por saída visível que não seja de pré-visualização: o OpenClaw envia a resposta concluída como uma nova mensagem final e limpa a pré-visualização antiga, para que a resposta final apareça depois da saída intermediária
    - pré-visualizações com mais de cerca de um minuto: o OpenClaw envia a resposta concluída como uma nova mensagem final e depois limpa a pré-visualização, para que o carimbo de data/hora visível do Telegram reflita o horário de conclusão em vez do horário de criação da pré-visualização

    Para respostas complexas (por exemplo, cargas de mídia), o OpenClaw recorre à entrega final normal e depois limpa a mensagem de pré-visualização.

    O streaming de pré-visualização é separado do streaming de blocos. Quando o streaming de blocos é explicitamente ativado para o Telegram, o OpenClaw ignora o stream de pré-visualização para evitar streaming duplicado.

    Stream de raciocínio somente no Telegram:

    - `/reasoning stream` envia o raciocínio para a pré-visualização ao vivo durante a geração
    - a pré-visualização do raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback de HTML">
    O texto de saída usa `parse_mode: "HTML"` do Telegram.

    - Texto no estilo Markdown é renderizado como HTML seguro para o Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de análise do Telegram.
    - Se o Telegram rejeitar o HTML analisado, o OpenClaw tenta novamente como texto simples.

    Pré-visualizações de links são ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comando nativo:

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

    - nomes são normalizados (remove `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram

    Se comandos nativos estiverem desativados, os integrados serão removidos. Comandos personalizados/de Plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após a redução; reduza comandos de Plugin/Skills/personalizados ou desative `channels.telegram.commands.native`.
    - Falha em `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos curl diretos da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido como o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token do bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como uma falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera o código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando há apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. A transferência de bootstrap integrada mantém o token do nó principal em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo de bootstrap são prefixadas por função, portanto essa allowlist de operador só satisfaz solicitações de operador; funções que não sejam de operador ainda precisam de escopos sob seu próprio prefixo de função.

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
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` atualmente são ativados por padrão e não têm alternâncias separadas em `channels.telegram.actions.*`.
    Envios em tempo de execução usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), então caminhos de ação não fazem nova resolução ad hoc de SecretRef a cada envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de resposta">
    O Telegram oferece suporte a tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem acionadora
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de resposta está ativado e o texto ou a legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita o texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desativa o encadeamento implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de threads">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e indicação de digitação miram a thread do tópico
    - caminho de configuração de tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda os padrões do grupo.

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

    **Vínculo persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP por meio de vínculos ACP tipados de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Consulte [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn de ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Exige que `channels.telegram.threadBindings.spawnSessions` permaneça ativado (padrão: `true`).

    O contexto do template expõe `MessageThreadId` e `IsForum`. Conversas diretas com `message_thread_id` mantêm roteamento de mensagem direta e metadados de resposta em sessões planas por padrão; elas só usam chaves de sessão com reconhecimento de encadeamento quando configuradas com `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ou uma configuração de tópico correspondente. Use `channels.telegram.dm.threadReplies` no nível superior para o padrão da conta, ou `direct.<chatId>.threadReplies` para uma conversa direta.

  </Accordion>

  <Accordion title="Áudio, vídeo e figurinhas">
    ### Mensagens de áudio

    O Telegram distingue notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar o envio como nota de voz
    - transcrições de notas de voz recebidas são enquadradas como texto gerado por máquina
      e não confiável no contexto do agente; a detecção de menção ainda usa a transcrição
      bruta para que mensagens de voz controladas por menção continuem funcionando.

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

    Notas de vídeo não aceitam legendas; o texto de mensagem fornecido é enviado separadamente.

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

    Ação para enviar figurinha:

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
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos conteúdos das mensagens).

    Quando habilitado, o OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de encadeamento em atualizações de reação.
      - grupos que não são fóruns roteiam para a sessão do chat em grupo
      - grupos de fórum roteiam para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para sondagem/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji Unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou uma conta.

  </Accordion>

  <Accordion title="Gravações de configuração de eventos e comandos do Telegram">
    Gravações de configuração de canal são habilitadas por padrão (`configWrites !== false`).

    Gravações disparadas pelo Telegram incluem:

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

  <Accordion title="Sondagem longa vs Webhook">
    O padrão é sondagem longa. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais: `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    O ouvinte local se vincula a `127.0.0.1:8787`. Para entrada pública, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida proteções de requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    O OpenClaw então processa a atualização de forma assíncrona pelas mesmas filas do bot por chat/por tópico usadas pela sondagem longa, então turnos lentos do agente não seguram a confirmação de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, tentativas e destinos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia recebida e enviada pelo Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram são mantidos em buffer antes que o OpenClaw os despache como uma única mensagem recebida. Aumente esse valor se partes do álbum chegarem tarde; reduza-o para diminuir a latência de resposta do álbum.
    - `channels.telegram.timeoutSeconds` substitui o tempo limite do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY). Clientes de bot limitam valores configurados abaixo da proteção de requisição de texto/digitação de saída de 60 segundos para que o grammY não aborte a entrega da resposta visível antes que a proteção de transporte e a alternativa do OpenClaw possam executar. A sondagem longa ainda usa uma proteção de requisição `getUpdates` de 45 segundos para que sondagens ociosas não sejam abandonadas indefinidamente.
    - O padrão de `channels.telegram.pollingStallThresholdMs` é `120000`; ajuste entre `30000` e `600000` apenas para reinícios de sondagem travada por falso positivo.
    - O histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - Contexto suplementar de resposta/citação/encaminhamento é atualmente passado como recebido.
    - Listas de permissão do Telegram controlam principalmente quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.
    - Controles de histórico de mensagens diretas:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - A configuração `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega da resposta final a mensagens recebidas também usa uma nova tentativa limitada de envio seguro para falhas pré-conexão do Telegram, mas não repete envelopes de rede ambíguos pós-envio que poderiam duplicar mensagens visíveis.

    O destino de envio da CLI pode ser um ID numérico de chat ou um nome de usuário:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Enquetes do Telegram usam `openclaw message poll` e aceitam tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Opções de enquete exclusivas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um destino `:topic:`)

    O envio pelo Telegram também aceita:

    - `--presentation` com blocos `buttons` para teclados em linha quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar nesse chat
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads de foto compactada ou mídia animada

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desabilita a criação de enquetes do Telegram enquanto mantém envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de execução no Telegram">
    O Telegram oferece suporte a aprovações de execução em mensagens diretas de aprovadores e pode, opcionalmente, publicar solicitações no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (recorre aos IDs numéricos dos proprietários em `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de execução. O primeiro pareamento de mensagem direta aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe proprietário de comando, então a configuração com um único proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando a solicitação chega em um tópico de fórum, o OpenClaw preserva o tópico para a solicitação de aprovação e o acompanhamento. Aprovações de execução expiram após 30 minutos por padrão.

    Botões de aprovação em linha também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de Plugin; os demais são resolvidos primeiro por aprovações de execução.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                       |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável ao chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades. |

Sobrescritas por conta, grupo e tópico são aceitas (mesma herança de outras chaves de configuração do Telegram).

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

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total.
      - BotFather: `/setprivacy` -> Desabilitar
      - em seguida, remova + adicione o bot novamente ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ter a associação verificada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não está vendo nenhuma mensagem de grupo">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/Skills/personalizados ou desative menus nativos
    - as chamadas de inicialização `deleteMyCommands` / `setMyCommands` e as chamadas de digitação `sendChatAction` são limitadas e tentam novamente uma vez por meio do fallback de transporte do Telegram em caso de timeout da solicitação. Erros persistentes de rede/fetch geralmente indicam problemas de acessibilidade DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="A inicialização relata token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token de bot no BotFather e, em seguida, atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas de API posteriores.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de abort imediato se os tipos de AbortSignal forem incompatíveis.
    - Alguns hosts resolvem `api.telegram.org` primeiro para IPv6; saída IPv6 quebrada pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses erros como erros de rede recuperáveis.
    - Durante a inicialização do polling, o OpenClaw reutiliza a sondagem `getMe` bem-sucedida da inicialização para o grammY, para que o executor não precise de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro de rede transitório durante a inicialização do polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do polling. Um Webhook ainda ativo aparece como um conflito de `getUpdates`; então o OpenClaw reconstrói o transporte do Telegram e tenta novamente a limpeza do Webhook.
    - Se os sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se `channels.telegram.timeoutSeconds` está baixo; clientes de bot limitam valores configurados abaixo dos limites de solicitações de saída e `getUpdates`, mas versões mais antigas podiam abortar cada polling ou resposta quando isso era definido abaixo desses limites.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness concluída de long polling por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após a tolerância de inicialização, quando uma conta de Webhook em execução não concluiu `setWebhook` após a tolerância de inicialização, ou quando a última atividade de transporte de polling bem-sucedida está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` somente quando chamadas `getUpdates` de longa duração estiverem saudáveis, mas seu host ainda relatar reinicializações falsas por polling travado. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita env de proxy do processo para transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda pode contornar `api.telegram.org`.
    - Se o proxy gerenciado do OpenClaw estiver configurado por meio de `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhum env de proxy padrão estiver presente, o Telegram também usa essa URL para o transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por meio de `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2). A ordem dos resultados DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada se aplicar, Node 22+ volta para `ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas de intervalo de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      para downloads de mídia do Telegram por padrão. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode optar
      pelo bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma opção está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite o intervalo
      de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as proteções
      SSRF de mídia do Telegram. Use-a somente em ambientes de proxy confiáveis
      controlados pelo operador, como roteamento fake-IP do Clash, Mihomo ou Surge quando eles
      sintetizarem respostas privadas ou de uso especial fora do intervalo de benchmark
      RFC 2544. Deixe-a desativada para acesso normal do Telegram pela internet pública.
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
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/respostas: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz de API personalizada: `apiRoot` (somente raiz da Bot API; não inclua `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência de várias contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw usa como fallback o primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não valores de `accounts.default.*`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens recebidas para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e fortalecimento.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Solução de problemas" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
