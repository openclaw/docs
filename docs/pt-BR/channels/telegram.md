---
read_when:
    - Trabalhando em recursos do Telegram ou webhooks
summary: Status de suporte, capacidades e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:32:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs de bots e grupos via grammY. Long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é o pareamento.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e manuais de reparo.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Create the bot token in BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram **não** usa `openclaw channels login telegram`; configure o token na configuração/ambiente e depois inicie o Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Os códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Add the bot to a group">
    Adicione o bot ao seu grupo e depois obtenha os dois IDs de que o acesso ao grupo precisa:

    - seu ID de usuário do Telegram, usado em `allowFrom` / `groupAllowFrom`
    - o ID de chat do grupo do Telegram, usado como chave em `channels.telegram.groups`

    Para a configuração inicial, obtenha o ID de chat do grupo em `openclaw logs --follow`, com um bot de ID encaminhado ou com `getUpdates` da Bot API. Depois que o grupo for permitido, `/whoami@<bot_username>` pode confirmar os IDs de usuário e de grupo.

    IDs negativos de supergrupos do Telegram que começam com `-100` são IDs de chat de grupo. Coloque-os em `channels.telegram.groups`, não em `groupAllowFrom`.

  </Step>
</Steps>

<Note>
A ordem de resolução de tokens considera a conta. Na prática, valores de configuração têm precedência sobre o fallback de ambiente, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
Após uma inicialização bem-sucedida, o OpenClaw armazena em cache a identidade do bot no diretório de estado por até 24 horas para que reinicializações evitem uma chamada extra `getMe` ao Telegram; alterar ou remover o token limpa esse cache.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Bots do Telegram usam **Privacy Mode** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens de grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Group permissions">
    O status de administrador é controlado nas configurações de grupo do Telegram.

    Bots administradores recebem todas as mensagens de grupo, o que é útil para comportamento de grupo sempre ativo.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para o comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

### Identidade do bot em grupo

Em grupos e tópicos de fórum do Telegram, uma menção explícita ao identificador configurado do bot (por exemplo, `@my_bot`) é tratada como direcionada ao agente OpenClaw selecionado, mesmo quando o nome da persona do agente difere do nome de usuário do Telegram. A política de silêncio do grupo ainda se aplica ao tráfego de grupo não relacionado, mas o identificador do bot em si não é considerado "outra pessoa".

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controla o acesso por mensagem direta:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use isso somente para bots intencionalmente públicos com ferramentas rigidamente restritas; bots de um único proprietário devem usar `allowlist` com IDs de usuário numéricos.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações com várias contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como uma fronteira de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a allowlist efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita apenas IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas de allowlist `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se antes você dependia de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: a aprovação de pareamento por DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso por DM. Se ainda não existir um proprietário de comandos, o primeiro pareamento aprovado também define `commands.ownerAllowFrom` para que comandos somente do proprietário e aprovações de execução tenham uma conta de operador explícita.
    A autorização de remetente em grupo ainda vem de allowlists explícitas na configuração.
    Se você quer "sou autorizado uma vez e tanto DMs quanto comandos de grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`; para comandos somente do proprietário, garanta que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

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

  <Tab title="Group policy and allowlists">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar pelas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupo. Se não estiver definido, Telegram recorre a `allowFrom`.
    Entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupos ou supergrupos do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Fronteira de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/tópico.
    Se `groupAllowFrom` não estiver definido, Telegram recorre à configuração `allowFrom`, não ao armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa como padrão `groupPolicy="allowlist"` com falha fechada, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

    Configuração de grupo somente do proprietário:

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

    Teste a partir do grupo com `@<bot_username> ping`. Mensagens comuns de grupo não acionam o bot enquanto `requireMention: true`.

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

    Exemplo: permitir somente usuários específicos dentro de um grupo específico:

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

      - Coloque IDs negativos de chat de grupos ou supergrupos do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram, como `8734062810`, em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` somente quando quiser que qualquer membro de um grupo permitido possa falar com o bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
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

    O contexto do histórico de grupo está sempre ativado para grupos e limitado por
    `historyLimit`. Defina `channels.telegram.historyLimit: 0` para desativar a
    janela de histórico de grupo do Telegram. A chave desativada `includeGroupHistoryContext`
    é removida por `openclaw doctor --fix`.

    Obtendo o ID de chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API
    - depois que o grupo for permitido, execute `/whoami@<bot_username>` se comandos nativos estiverem habilitados

  </Tab>
</Tabs>

## Comportamento de runtime

- Telegram pertence ao processo do Gateway.
- O roteamento é determinístico: respostas de entrada do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas no envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido da cadeia de respostas para respostas do Telegram que o Gateway observou.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw o preserva nas respostas. Sessões de tópicos em DM só são divididas quando o `getMe` do Telegram relata `has_topics_enabled: true` para o bot; caso contrário, DMs permanecem na sessão plana.
- Long polling usa o runner grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- A inicialização multi-conta limita sondagens `getMe` concorrentes do Telegram para que grandes frotas de bots não disparem sondagens de todas as contas de uma vez.
- O long polling é protegido dentro de cada processo do Gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos 409 de `getUpdates`, outro Gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinícios do watchdog de long polling são acionados por padrão após 120 segundos sem liveness concluída de `getUpdates`. Aumente `channels.telegram.pollingStallThresholdMs` somente se sua implantação ainda vir reinícios falsos por polling travado durante trabalhos de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são suportadas.
- A Telegram Bot API não tem suporte a recibo de leitura (`sendReadReceipts` não se aplica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` foram removidos. Execute `openclaw doctor --fix` após atualizar se sua configuração ainda tiver essas chaves. O roteamento de tópicos em DM agora segue a capacidade do bot em `getMe.has_topics_enabled` do Telegram, que é controlada pelo modo com threads do BotFather: bots com tópicos habilitados usam sessões de DM com escopo de thread quando o Telegram envia `message_thread_id`; outras DMs permanecem na sessão plana.
</Note>

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de transmissão ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - prévias curtas de resposta inicial têm debounce e depois são materializadas após um atraso limitado se a execução ainda estiver ativa
    - `progress` mantém um rascunho de status editável para progresso de ferramentas, mostra o rótulo de status estável quando a atividade de resposta chega antes do progresso de ferramentas, limpa-o na conclusão e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando a transmissão de prévia está ativa)
    - `streaming.preview.commandText` controla detalhes de comando/execução nessas linhas de progresso de ferramenta: `raw` (padrão, preserva o comportamento lançado) ou `status` (apenas rótulo da ferramenta)
    - `streaming.progress.commentary` (padrão: `false`) opta por incluir texto de comentário/preâmbulo do assistente no rascunho temporário de progresso
    - `channels.telegram.streamMode` legado, valores booleanos de `streaming` e chaves removidas de prévia de rascunho nativo são detectados; execute `openclaw doctor --fix` para migrá-los para a configuração atual de transmissão

    Atualizações de prévia de progresso de ferramentas são as linhas curtas de status mostradas enquanto ferramentas são executadas, por exemplo execução de comandos, leituras de arquivo, atualizações de planejamento, resumos de patch ou texto de preâmbulo/comentário do Codex no modo de servidor de app do Codex. O Telegram mantém isso habilitado por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`.

    Para manter a prévia editada do texto da resposta, mas ocultar linhas de progresso de ferramentas, defina:

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

    Para manter o progresso de ferramentas visível, mas ocultar texto de comando/execução, defina:

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

    Use `streaming.mode: "off"` somente quando quiser entrega apenas final: edições de prévia do Telegram são desabilitadas, e conversas genéricas de ferramenta/progresso são suprimidas em vez de serem enviadas como mensagens de status independentes. Prompts de aprovação, payloads de mídia e erros ainda passam pela entrega final normal. Use `streaming.preview.toolProgress: false` quando você quiser apenas manter edições de prévia da resposta enquanto oculta as linhas de status de progresso de ferramentas.

    <Note>
      Respostas a citações selecionadas do Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem de entrada inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a prévia da resposta, então `streaming.preview.toolProgress` não pode mostrar as linhas curtas de status para esse turno. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm a transmissão de prévia. Defina `replyToMode: "off"` quando a visibilidade do progresso de ferramentas for mais importante que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer a troca.
    </Note>

    Para respostas somente de texto:

    - prévias curtas de DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e realiza a edição final no lugar
    - finais de texto longo que se dividem em várias mensagens do Telegram reutilizam a prévia existente como o primeiro bloco final quando possível e depois enviam apenas os blocos restantes
    - finais em modo de progresso limpam o rascunho de status e usam a entrega final normal em vez de editar o rascunho na resposta
    - se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa a entrega final normal e limpa a prévia obsoleta

    Para respostas complexas (por exemplo payloads de mídia), o OpenClaw recua para a entrega final normal e depois limpa a mensagem de prévia.

    A transmissão de prévia é separada da transmissão em blocos. Quando a transmissão em blocos é explicitamente habilitada para o Telegram, o OpenClaw ignora a transmissão de prévia para evitar transmissão dupla.

    Comportamento da transmissão de raciocínio:

    - `/reasoning stream` usa o caminho de prévia de raciocínio de um canal suportado; no Telegram, ele transmite o raciocínio para a prévia ao vivo durante a geração
    - a prévia de raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatação de mensagens ricas">
    O texto de saída usa mensagens HTML padrão do Telegram por padrão para que as respostas permaneçam legíveis nos clientes atuais do Telegram. Esse modo de compatibilidade suporta negrito, itálico, links, código, spoilers e citações normais, mas não blocos exclusivos de rich text da Bot API 10.1, como tabelas nativas, detalhes, rich media e fórmulas.

    Defina `channels.telegram.richMessages: true` para optar por mensagens ricas da Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Quando habilitado:

    - O agente é informado de que mensagens ricas do Telegram estão disponíveis para este bot/conta.
    - Texto Markdown é renderizado pela IR de Markdown do OpenClaw e enviado como HTML rico do Telegram.
    - Payloads HTML ricos explícitos preservam tags suportadas da Bot API 10.1, como cabeçalhos, tabelas, detalhes, rich media e fórmulas.
    - Legendas de mídia ainda usam legendas HTML do Telegram porque mensagens ricas não substituem legendas.

    Isso mantém o texto do modelo longe dos sigilos de Rich Markdown do Telegram, para que valores monetários como `$400-600K` não sejam analisados como matemática. Texto rico longo é dividido automaticamente entre os limites de rich text e blocos ricos do Telegram. Tabelas acima do limite de colunas do Telegram são enviadas como blocos de código.

    Padrão: desativado para compatibilidade de clientes. Mensagens ricas exigem clientes compatíveis do Telegram; alguns clientes atuais de Desktop, Web, Android e terceiros exibem mensagens ricas aceitas como não suportadas. Mantenha esta opção desabilitada a menos que todos os clientes usados com o bot possam renderizá-las. `/status` mostra se a sessão atual do Telegram tem mensagens ricas ativadas ou desativadas.

    Prévias de link são habilitadas por padrão. `channels.telegram.linkPreview: false` ignora a detecção automática de entidades para rich text.

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
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não sejam mostrados no menu do Telegram

    Se comandos nativos forem desabilitados, os integrados serão removidos. Comandos personalizados/de Plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de Plugin/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - Falha em `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos diretos de curl da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido como o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando há apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. O bootstrap integrado por código de configuração é apenas para nó: a primeira conexão cria uma solicitação de nó pendente e, após a aprovação, o Gateway retorna um token de nó durável com `scopes: []`. Ele não retorna um token de operador transferido; acesso de operador exige um pareamento de operador aprovado separado ou fluxo de token.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo função/escopos/chave pública), a solicitação pendente anterior é substituída e a nova solicitação usa um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

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

    Exemplo de botão de Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Os botões `web_app` do Telegram funcionam apenas em chats privados entre um usuário e o
    bot.

    Cliques de callback que não forem reivindicados por um manipulador interativo de Plugin
    registrado são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, botões inline opcionais de `presentation`; edições apenas de botões atualizam a marcação de resposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    As ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de restrição:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` atualmente são ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em runtime usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), então os caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de respostas">
    O Telegram oferece suporte a tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou a execução
    - `[[reply_to:<id>]]` responde a um ID de mensagem específico do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de respostas está ativado e o texto ou legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita o texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e voltam para uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de threads">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e indicação de digitação têm como destino a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico Geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, exceto quando substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda dos padrões do grupo.
    `topics."*"` define padrões para todos os tópicos naquele grupo; IDs exatos de tópico ainda têm precedência sobre `"*"`.

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

    **Vinculação persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP por meio de vinculações ACP tipadas de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Consulte [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn de ACP vinculado à thread a partir do chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer que `channels.telegram.threadBindings.spawnSessions` permaneça ativado (padrão: `true`).

    O contexto de template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm metadados de resposta; eles usam chaves de sessão cientes de thread apenas quando o `getMe` do Telegram relata `has_topics_enabled: true` para o bot.
    As antigas substituições `dm.threadReplies` e `direct.*.threadReplies` foram intencionalmente aposentadas; use o modo com threads do BotFather como a única fonte da verdade e execute `openclaw doctor --fix` para remover chaves de configuração obsoletas.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram distingue notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz
    - transcrições de notas de voz recebidas são enquadradas como texto gerado por máquina,
      não confiável, no contexto do agente; a detecção de menções ainda usa a transcrição
      bruta, então mensagens de voz restritas por menção continuam funcionando.

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
    - WEBM de vídeo: ignorado

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    As descrições de stickers são armazenadas em cache no estado de Plugin SQLite do OpenClaw para reduzir chamadas repetidas de visão.

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
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos do sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa reações de usuários apenas a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos que não são fórum são roteados para a sessão de chat do grupo
      - grupos de fórum são roteados para a sessão de tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida. `ackReactionScope` decide *quando* esse emoji é realmente enviado.

    **Ordem de resolução do emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

    **Escopo (`messages.ackReactionScope`):**

    O provedor Telegram lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Hoje não há substituição em nível de conta do Telegram ou canal do Telegram.

    Valores: `"all"` (DMs + grupos), `"direct"` (somente DMs), `"group-all"` (todas as mensagens de grupo, sem DMs), `"group-mentions"` (grupos quando o bot é mencionado; **sem DMs** — este é o padrão), `"off"` / `"none"` (desabilitado).

    <Note>
    O escopo padrão (`"group-mentions"`) não dispara reações de confirmação em mensagens diretas. Para obter uma reação de confirmação em DMs recebidas do Telegram, defina `messages.ackReactionScope` como `"direct"` ou `"all"`. O valor é lido na inicialização do provedor Telegram, portanto é necessário reiniciar o Gateway para que a alteração entre em vigor.
    </Note>

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações de configuração de canal são habilitadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (exige habilitação de comandos)

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

  <Accordion title="Polling longo versus Webhook">
    O padrão é polling longo. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    No modo de polling longo, o OpenClaw persiste sua marca d'água de reinicialização somente depois que uma atualização é despachada com sucesso. Se um manipulador falhar, essa atualização permanece passível de nova tentativa no mesmo processo e não é gravada como concluída para deduplicação na reinicialização.

    O listener local faz bind em `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida proteções de requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    Em seguida, o OpenClaw processa a atualização de forma assíncrona pelas mesmas filas de bot por chat/por tópico usadas pelo polling longo, de modo que turnos lentos de agente não seguram o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, nova tentativa e destinos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia de entrada e saída do Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram ficam em buffer antes que o OpenClaw os despache como uma única mensagem de entrada. Aumente se partes do álbum chegarem atrasadas; reduza para diminuir a latência da resposta ao álbum.
    - `channels.telegram.timeoutSeconds` substitui o tempo limite do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY). Clientes de bot limitam valores configurados abaixo da proteção de requisição de texto/digitação de saída de 60 segundos para que o grammY não aborte a entrega visível da resposta antes que a proteção de transporte e o fallback do OpenClaw possam executar. Long polling ainda usa uma proteção de requisição `getUpdates` de 45 segundos para que polls ociosos não sejam abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tem como padrão `120000`; ajuste entre `30000` e `600000` apenas para reinicializações de polling travado falso-positivas.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - o contexto suplementar de resposta/citação/encaminhamento é normalizado em uma janela de contexto de conversa selecionada quando o Gateway observou as mensagens pai; o cache de mensagens observadas fica no estado de Plugin SQLite do OpenClaw, e `openclaw doctor --fix` importa sidecars legados. O Telegram inclui apenas um `reply_to_message` superficial nas atualizações, então cadeias mais antigas que o cache ficam limitadas ao payload de atualização atual do Telegram.
    - allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega de resposta final de entrada também usa uma nova tentativa limitada de envio seguro para falhas de pré-conexão do Telegram, mas não tenta novamente envelopes de rede ambíguos pós-envio que poderiam duplicar mensagens visíveis.

    Destinos de envio da CLI e da ferramenta de mensagens podem ser ID numérico do chat, nome de usuário ou um destino de tópico de fórum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    O envio do Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot pode fixar naquele chat
    - `--force-document` para enviar imagens, GIFs e vídeos de saída como documentos em vez de uploads compactados de foto, mídia animada ou vídeo

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desabilita a criação de enquetes do Telegram enquanto mantém envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de execução no Telegram">
    O Telegram oferece suporte a aprovações de execução em DMs de aprovadores e pode opcionalmente publicar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (habilita automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (recorre aos IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de execução. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe proprietário de comando, então a configuração com um único proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt cai em um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de execução expiram após 30 minutos por padrão.

    Botões de aprovação inline também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de plugin; outros são resolvidos primeiro por aprovações de execução.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, a política de erro controla se mensagens de erro são enviadas ao chat do Telegram:

| Chave                               | Valores                    | Padrão          | Descrição                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — envia toda mensagem de erro ao chat. `once` — envia cada mensagem de erro única uma vez por janela de cooldown (suprime erros idênticos repetidos). `silent` — nunca envia mensagens de erro ao chat. |
| `channels.telegram.errorCooldownMs` | número (ms)                | `14400000` (4h) | Janela de cooldown para a política `once`. Depois que um erro é enviado, a mesma mensagem de erro é suprimida até que esse intervalo decorra. Evita spam de erro durante indisponibilidades.               |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança de outras chaves de configuração do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
      - depois remova e adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupos; o curinga `"*"` não pode ter associação sondada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não vê mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/skill/personalizados ou desabilite menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` e chamadas de digitação `sendChatAction` são limitadas e tentam novamente uma vez pelo fallback de transporte do Telegram em tempo limite de requisição. Erros persistentes de rede/fetch geralmente indicam problemas de alcance DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Inicialização relata token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token do bot no BotFather e, em seguida, atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas posteriores da API.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de aborto imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; egresso IPv6 quebrado pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Durante a inicialização de polling, o OpenClaw reutiliza a sondagem `getMe` de inicialização bem-sucedida para o grammY, então o runner não precisa de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro de rede transitório durante a inicialização de polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do poll. Um webhook ainda ativo aparece como um conflito de `getUpdates`; então o OpenClaw reconstrói o transporte do Telegram e tenta novamente a limpeza do webhook.
    - Se sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo; clientes de bot limitam valores configurados abaixo das proteções de requisição de saída e `getUpdates`, mas versões mais antigas podiam abortar todo poll ou resposta quando isso era definido abaixo dessas proteções.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness de long-poll concluída por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após a tolerância de inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após a tolerância de inicialização ou quando a última atividade bem-sucedida do transporte de polling está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas `getUpdates` longas estão saudáveis, mas seu host ainda relata reinicializações de polling travado falso-positivas. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou egresso TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita env de proxy do processo para transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda pode ignorar `api.telegram.org`.
    - Se o proxy gerenciado pelo OpenClaw for configurado por `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhum env de proxy padrão estiver presente, o Telegram também usará essa URL para o transporte da Bot API.
    - Em hosts VPS com egresso/TLS direto instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - O Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2). A ordem dos resultados de DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada se aplicar, o Node 22+ volta para `ipv4first`.
    - Se o seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas da faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      para downloads de mídia do Telegram por padrão. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode aderir
      ao bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma adesão explícita está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se o seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe o
      sinalizador perigoso desativado primeiro. A mídia do Telegram já permite a faixa de
      benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções contra SSRF de mídia do Telegram. Use apenas em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento fake-IP do Clash, Mihomo ou Surge,
      quando eles sintetizam respostas privadas ou de uso especial fora da faixa de benchmark
      RFC 2544. Deixe desativado para acesso normal ao Telegram pela internet pública.
    </Warning>

    - Substituições de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valide as respostas de DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Referência de configuração

Referência principal: [Referência de configuração - Telegram](/pt-BR/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; links simbólicos são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- padrões de tópicos: `groups.<chatId>.topics."*"` se aplica a tópicos de fórum sem correspondência; IDs de tópico exatos o substituem
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/respostas: `replyToMode`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz de API personalizada: `apiRoot` (somente raiz da Bot API; não inclua `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência de várias contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw volta para o primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não os valores de `accounts.default.*`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pt-BR/channels/groups">
    Comportamento de lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Channel routing" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens recebidas para agentes.
  </Card>
  <Card title="Security" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e endurecimento.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
