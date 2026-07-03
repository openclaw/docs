---
read_when:
    - Trabalhando em recursos do Telegram ou webhooks
summary: Status, recursos e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:19:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. A sondagem longa é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
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
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e depois inicie o gateway.

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
    Adicione o bot ao seu grupo e, depois, obtenha ambos os IDs necessários para o acesso do grupo:

    - seu ID de usuário do Telegram, usado em `allowFrom` / `groupAllowFrom`
    - o ID de chat do grupo do Telegram, usado como a chave em `channels.telegram.groups`

    Para a configuração inicial, obtenha o ID de chat do grupo em `openclaw logs --follow`, com um bot de ID encaminhado ou pela Bot API `getUpdates`. Depois que o grupo for permitido, `/whoami@<bot_username>` pode confirmar os IDs de usuário e de grupo.

    IDs negativos de supergrupos do Telegram que começam com `-100` são IDs de chat de grupo. Coloque-os em `channels.telegram.groups`, não em `groupAllowFrom`.

  </Step>
</Steps>

<Note>
A ordem de resolução do token é ciente da conta. Na prática, valores de configuração têm precedência sobre fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
Após uma inicialização bem-sucedida, o OpenClaw armazena a identidade do bot em cache no diretório de estado por até 24 horas para que reinicializações possam evitar uma chamada extra `getMe` ao Telegram; alterar ou remover o token limpa esse cache.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade de grupo">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens de grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo do Telegram.

    Bots administradores recebem todas as mensagens de grupo, o que é útil para comportamento de grupo sempre ativo.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para comportamento de visibilidade em grupo

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

### Identidade do bot no grupo

Em grupos e tópicos de fórum do Telegram, uma menção explícita ao identificador configurado do bot (por exemplo, `@my_bot`) é tratada como endereçamento ao agente OpenClaw selecionado, mesmo quando o nome da persona do agente difere do nome de usuário do Telegram. A política de silêncio do grupo ainda se aplica ao tráfego de grupo não relacionado, mas o identificador do bot em si não é considerado "outra pessoa".

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso por mensagem direta:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use isso apenas para bots intencionalmente públicos com ferramentas rigidamente restritas; bots de um único proprietário devem usar `allowlist` com IDs numéricos de usuário.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações com várias contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como uma fronteira de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a allowlist efetiva da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita apenas IDs numéricos de usuário.
    Se você fez upgrade e sua configuração contém entradas de allowlist `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas em `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: aprovação de pareamento por DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso por DM. Se ainda não existir um proprietário de comandos, o primeiro pareamento aprovado também define `commands.ownerAllowFrom` para que comandos somente do proprietário e aprovações de execução tenham uma conta de operador explícita.
    A autorização de remetente em grupo ainda vem de allowlists explícitas de configuração.
    Se você quer "estou autorizado uma vez e tanto DMs quanto comandos de grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`; para comandos somente do proprietário, garanta que `commands.ownerAllowFrom` contenha `telegram:<your user id>`.

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

    `groupAllowFrom` é usado para filtragem de remetentes em grupo. Se não estiver definido, o Telegram recorre a `allowFrom`.
    Entradas `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupos ou supergrupos do Telegram em `groupAllowFrom`. IDs negativos de chat pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Fronteira de segurança (`2026.2.25+`): autenticação de remetente de grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram recorre ao `allowFrom` da configuração, não ao armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` não definido e permita os grupos de destino em `channels.telegram.groups`.
    Nota de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com falha fechada, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

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

      - Coloque IDs negativos de chat de grupos ou supergrupos do Telegram, como `-1001234567890`, em `channels.telegram.groups`.
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

    O contexto de histórico do grupo fica sempre ativo para grupos e é limitado por
    `historyLimit`. Defina `channels.telegram.historyLimit: 0` para desativar a
    janela de histórico de grupo do Telegram. A chave aposentada `includeGroupHistoryContext`
    é removida por `openclaw doctor --fix`.

    Obtendo o ID de chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione Bot API `getUpdates`
    - depois que o grupo for permitido, execute `/whoami@<bot_username>` se comandos nativos estiverem habilitados

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é de propriedade do processo de gateway.
- O roteamento é determinístico: respostas de entrada do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas no envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido da cadeia de respostas para respostas do Telegram que o gateway observou.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw o preserva para respostas. Sessões de tópico em DM só se dividem quando o `getMe` do Telegram informa `has_topics_enabled: true` para o bot; caso contrário, DMs permanecem na sessão plana.
- O polling longo usa o executor do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do executor usa `agents.defaults.maxConcurrent`.
- A inicialização de várias contas limita sondagens concorrentes de `getMe` do Telegram para que grandes frotas de bots não disparem sondagens de todas as contas ao mesmo tempo.
- O polling longo é protegido dentro de cada processo de gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos `getUpdates` 409, outro gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinicializações do watchdog de long polling são acionadas por padrão após 120 segundos sem liveness concluída de `getUpdates`. Aumente `channels.telegram.pollingStallThresholdMs` somente se sua implantação ainda vir reinicializações falsas por stall de polling durante trabalhos de longa duração. O valor é em milissegundos e é permitido de `30000` a `600000`; substituições por conta são aceitas.
- A Telegram Bot API não oferece suporte a recibos de leitura (`sendReadReceipts` não se aplica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` foram removidos. Execute `openclaw doctor --fix` após a atualização se sua configuração ainda tiver essas chaves. O roteamento de tópicos em DM agora segue a capacidade do bot em `getMe.has_topics_enabled` do Telegram, que é controlada pelo modo com threads do BotFather: bots com tópicos habilitados usam sessões de DM com escopo de thread quando o Telegram envia `message_thread_id`; outras DMs permanecem na sessão plana.
</Note>

## Referência de recursos

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - prévias curtas da resposta inicial são debounced e então materializadas após um atraso limitado se a execução ainda estiver ativa
    - `progress` mantém um rascunho de status editável para progresso de ferramentas, mostra o rótulo de status estável quando atividade de resposta chega antes do progresso de ferramenta, limpa-o na conclusão e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando streaming de prévia está ativo)
    - `streaming.preview.commandText` controla detalhes de comando/execução dentro dessas linhas de progresso de ferramenta: `raw` (padrão, preserva o comportamento lançado) ou `status` (somente rótulo da ferramenta)
    - `streaming.progress.commentary` (padrão: `false`) opta por incluir texto de comentário/preâmbulo do assistente no rascunho temporário de progresso
    - `channels.telegram.streamMode` legado, valores booleanos de `streaming` e chaves aposentadas de prévia de rascunho nativa são detectados; execute `openclaw doctor --fix` para migrá-los para a configuração de streaming atual

    Atualizações de prévia de progresso de ferramenta são as linhas curtas de status mostradas enquanto ferramentas executam, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento, resumos de patches ou texto de preâmbulo/comentário do Codex no modo app-server do Codex. O Telegram as mantém habilitadas por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`.

    Para manter a prévia editada para texto de resposta, mas ocultar linhas de progresso de ferramenta, defina:

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

    Use o modo `progress` quando quiser progresso de ferramenta visível sem editar a resposta final nessa mesma mensagem. Coloque a política de texto de comando em `streaming.progress`:

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

    Use `streaming.mode: "off"` somente quando quiser entrega apenas final: edições de prévia do Telegram são desabilitadas e conversa genérica de ferramenta/progresso é suprimida em vez de ser enviada como mensagens de status independentes. Solicitações de aprovação, payloads de mídia e erros ainda são roteados pela entrega final normal. Use `streaming.preview.toolProgress: false` quando quiser apenas manter edições de prévia de resposta enquanto oculta as linhas de status de progresso de ferramenta.

    <Note>
      Respostas a citações selecionadas do Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem de entrada inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a prévia da resposta, então `streaming.preview.toolProgress` não pode mostrar as linhas curtas de status para esse turno. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm streaming de prévia. Defina `replyToMode: "off"` quando a visibilidade do progresso de ferramenta for mais importante do que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer a troca.
    </Note>

    Para respostas somente de texto:

    - prévias curtas de DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e realiza a edição final no lugar
    - finais de texto longos que são divididos em várias mensagens do Telegram reutilizam a prévia existente como o primeiro trecho final quando possível, depois enviam apenas os trechos restantes
    - finais em modo de progresso limpam o rascunho de status e usam entrega final normal em vez de editar o rascunho para virar a resposta
    - se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa entrega final normal e limpa a prévia obsoleta

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw recorre à entrega final normal e depois limpa a mensagem de prévia.

    Streaming de prévia é separado de streaming em bloco. Quando streaming em bloco está explicitamente habilitado para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplicado.

    Comportamento do stream de raciocínio:

    - `/reasoning stream` usa o caminho de prévia de raciocínio de um canal compatível; no Telegram, ele transmite o raciocínio para a prévia ao vivo durante a geração
    - a prévia de raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Rich message formatting">
    O texto de saída usa mensagens HTML padrão do Telegram por padrão para que as respostas continuem legíveis nos clientes atuais do Telegram. Esse modo de compatibilidade oferece suporte a negrito, itálico, links, código, spoilers e citações normais, mas não a blocos exclusivos de rich text da Bot API 10.1, como tabelas nativas, detalhes, mídia rica e fórmulas.

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
    - Texto Markdown é renderizado pelo IR de Markdown do OpenClaw e enviado como HTML rico do Telegram.
    - Payloads HTML ricos explícitos preservam tags compatíveis da Bot API 10.1, como cabeçalhos, tabelas, detalhes, mídia rica e fórmulas.
    - Legendas de mídia ainda usam legendas HTML do Telegram porque mensagens ricas não substituem legendas.

    Isso mantém texto do modelo longe dos sigilos do Telegram Rich Markdown, então valores monetários como `$400-600K` não são analisados como matemática. Texto rico longo é dividido automaticamente entre os limites de rich text e blocos ricos do Telegram. Tabelas acima do limite de colunas do Telegram são enviadas como blocos de código.

    Padrão: desativado para compatibilidade com clientes. Mensagens ricas exigem clientes do Telegram compatíveis; alguns clientes atuais de Desktop, Web, Android e terceiros exibem mensagens ricas aceitas como incompatíveis. Mantenha esta opção desabilitada a menos que todos os clientes usados com o bot possam renderizá-las. `/status` mostra se a sessão atual do Telegram está com mensagens ricas ativadas ou desativadas.

    Prévias de links são habilitadas por padrão. `channels.telegram.linkPreview: false` ignora a detecção automática de entidades para rich text.

  </Accordion>

  <Accordion title="Native commands and custom commands">
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
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo se não forem mostrados no menu do Telegram

    Se comandos nativos estiverem desabilitados, os integrados são removidos. Comandos personalizados/de Plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de Plugin/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - Falha em `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos curl diretos da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido para o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser apenas a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como falha de limpeza de Webhook.
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

    O código de configuração carrega um token de bootstrap de curta duração. O bootstrap integrado por código de configuração retorna um token de nó durável com `scopes: []` mais um token limitado de transferência para operador para onboarding móvel confiável. Esse token de operador pode ler configuração nativa do momento da configuração, mas não concede escopos de mutação de pareamento nem `operator.admin`.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo, função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

    Mais detalhes: [Emparelhamento](/pt-BR/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    O `capabilities: ["inlineButtons"]` legado é mapeado para `inlineButtons: "all"`.

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

    Botões `web_app` do Telegram funcionam apenas em chats privados entre um usuário e o
    bot.

    Cliques de callback que não forem reivindicados por um manipulador interativo
    de Plugin registrado são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagens do Telegram para agentes e automação">
    As ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, botões inline `presentation` opcionais; edições apenas de botões atualizam a marcação de resposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` atualmente são ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em tempo de execução usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), portanto os caminhos de ação não fazem nova resolução SecretRef ad hoc por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de respostas">
    Telegram oferece suporte a tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` responde à mensagem acionadora
    - `[[reply_to:<id>]]` responde a um ID de mensagem específico do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de respostas está ativado e o texto ou a legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita o texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas desde o início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de threads">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como alvo a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópicos: entradas de tópico herdam configurações do grupo, a menos que sejam sobrescritas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda dos padrões do grupo.
    `topics."*"` define padrões para todos os tópicos desse grupo; IDs exatos de tópicos ainda prevalecem sobre `"*"`.

    **Roteamento de agente por tópico**: Cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio espaço de trabalho, memória e sessão isolados. Exemplo:

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

    **Vinculação persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP por meio de vinculações ACP tipadas de nível superior (`bindings[]` com `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e um id qualificado por tópico como `-1001234567890:topic:42`). Atualmente restrito a tópicos de fórum em grupos/supergrupos. Consulte [Agentes ACP](/pt-BR/tools/acp-agents).

    **Spawn de ACP vinculado à thread pelo chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer que `channels.telegram.threadBindings.spawnSessions` permaneça ativado (padrão: `true`).

    O contexto do template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm metadados de resposta; eles usam chaves de sessão cientes de thread apenas quando o `getMe` do Telegram relata `has_topics_enabled: true` para o bot.
    As antigas substituições `dm.threadReplies` e `direct.*.threadReplies` foram aposentadas intencionalmente; use o modo com threads do BotFather como a única fonte da verdade e execute `openclaw doctor --fix` para remover chaves de configuração obsoletas.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz
    - transcrições de notas de voz recebidas são enquadradas como texto gerado por máquina,
      não confiável no contexto do agente; a detecção de menções ainda usa a transcrição
      bruta, então mensagens de voz controladas por menção continuam funcionando.

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

    Notas de vídeo não aceitam legendas; o texto de mensagem fornecido é enviado separadamente.

    ### Figurinhas

    Tratamento de figurinhas recebidas:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM de vídeo: ignorado

    Campos de contexto da figurinha:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    As descrições das figurinhas são armazenadas em cache no estado de Plugin SQLite do OpenClaw para reduzir chamadas repetidas de visão.

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

    Ação de envio de figurinha:

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

  <Accordion title="Reaction notifications">
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos do sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações do usuário a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos que não são fóruns são roteados para a sessão de chat do grupo
      - grupos de fórum são roteados para a sessão de tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida. `ackReactionScope` decide *quando* esse emoji é realmente enviado.

    **Ordem de resolução do emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

    **Escopo (`messages.ackReactionScope`):**

    O provedor do Telegram lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Atualmente não há substituição no nível da conta do Telegram ou do canal do Telegram.

    Valores: `"all"` (DMs + grupos), `"direct"` (somente DMs), `"group-all"` (todas as mensagens de grupo, sem DMs), `"group-mentions"` (grupos quando o bot é mencionado; **sem DMs** — este é o padrão), `"off"` / `"none"` (desabilitado).

    <Note>
    O escopo padrão (`"group-mentions"`) não dispara reações de confirmação em mensagens diretas. Para receber uma reação de confirmação em DMs recebidas do Telegram, defina `messages.ackReactionScope` como `"direct"` ou `"all"`. O valor é lido na inicialização do provedor do Telegram, então é necessário reiniciar o Gateway para que a alteração entre em vigor.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Escritas de configuração do canal são habilitadas por padrão (`configWrites !== false`).

    Escritas disparadas pelo Telegram incluem:

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

  <Accordion title="Long polling vs webhook">
    O padrão é long polling. Para o modo Webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    No modo de long polling, o OpenClaw persiste seu marcador de reinicialização somente depois que uma atualização é despachada com sucesso. Se um handler falhar, essa atualização permanece apta para nova tentativa no mesmo processo e não é gravada como concluída para deduplicação na reinicialização.

    O listener local vincula-se a `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso à frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo Webhook valida as proteções da solicitação, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    Em seguida, o OpenClaw processa a atualização de forma assíncrona pelas mesmas lanes de bot por chat/por tópico usadas pelo long polling, para que turnos lentos do agente não prendam o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, nova tentativa e destinos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia de entrada e saída do Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram ficam em buffer antes que o OpenClaw os despache como uma única mensagem de entrada. Aumente se partes do álbum chegarem tarde; reduza para diminuir a latência da resposta ao álbum.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não estiver definido, aplica-se o padrão do grammY). Clientes de bot limitam valores configurados abaixo da proteção de 60 segundos para solicitações de texto/digitação de saída, para que o grammY não aborte a entrega de respostas visíveis antes que a proteção de transporte e o fallback do OpenClaw possam executar. O long polling ainda usa uma proteção de solicitação `getUpdates` de 45 segundos para que polls ociosos não sejam abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` usa `120000` por padrão; ajuste entre `30000` e `600000` apenas para reinícios por polling travado falso-positivo.
    - O histórico de contexto de grupos usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - O contexto suplementar de resposta/citação/encaminhamento é normalizado em uma única janela de contexto de conversa selecionada quando o Gateway observou as mensagens pai; o cache de mensagens observadas fica no estado de Plugin SQLite do OpenClaw, e `openclaw doctor --fix` importa sidecars legados. O Telegram inclui apenas um `reply_to_message` raso nas atualizações, então cadeias mais antigas que o cache ficam limitadas ao payload atual de atualização do Telegram.
    - As allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - Controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - A configuração `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega da resposta final de entrada também usa uma nova tentativa limitada de envio seguro para falhas de pré-conexão do Telegram, mas não tenta novamente envelopes de rede ambíguos após envio que poderiam duplicar mensagens visíveis.

    Destinos de envio da CLI e de ferramentas de mensagem podem ser ID numérico de chat, nome de usuário ou um destino de tópico de fórum:

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

    O envio pelo Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot pode fixar nesse chat
    - `--force-document` para enviar imagens, GIFs e vídeos de saída como documentos em vez de uploads de foto comprimida, mídia animada ou vídeo

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desativa a criação de enquetes do Telegram mantendo envios regulares ativados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode, opcionalmente, publicar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (ativa automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (recorre aos IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de exec. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não há proprietário de comandos, então a configuração de um proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; ative `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões de aprovação inline também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por aprovações de Plugin; os demais são resolvidos primeiro por aprovações de exec.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, a política de erros controla se mensagens de erro são enviadas ao chat do Telegram:

| Chave                               | Valores                   | Padrão          | Descrição                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — envia todas as mensagens de erro ao chat. `once` — envia cada mensagem de erro única uma vez por janela de cooldown (suprime erros idênticos repetidos). `silent` — nunca envia mensagens de erro ao chat.          |
| `channels.telegram.errorCooldownMs` | número (ms)               | `14400000` (4h) | Janela de cooldown para a política `once`. Depois que um erro é enviado, a mesma mensagem de erro é suprimida até que esse intervalo decorra. Evita spam de erros durante indisponibilidades.                                 |

Overrides por conta, por grupo e por tópico têm suporte (mesma herança que outras chaves de configuração do Telegram).

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

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade completa.
      - BotFather: `/setprivacy` -> Disable
      - depois remova e adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupos; o curinga `"*"` não pode ter associação verificada por probe.
    - Teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não está vendo mensagens de grupo">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot no grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política do grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/skill/personalizados ou desative menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` e chamadas de digitação `sendChatAction` são limitadas e tentam novamente uma vez pelo fallback de transporte do Telegram em timeout de solicitação. Erros persistentes de rede/fetch geralmente indicam problemas de DNS/alcance HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Inicialização informa token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token do bot no BotFather e atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas posteriores da API.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de abort imediato se os tipos de AbortSignal não coincidirem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 quebrada pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Durante a inicialização de polling, o OpenClaw reutiliza a probe `getMe` de inicialização bem-sucedida para o grammY, para que o runner não precise de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro de rede transitório durante a inicialização de polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do poll. Um webhook ainda ativo aparece como um conflito de `getUpdates`; então o OpenClaw reconstrói o transporte do Telegram e tenta novamente a limpeza do webhook.
    - Se sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo; clientes de bot limitam valores configurados abaixo das proteções de solicitação de saída e `getUpdates`, mas versões mais antigas podiam abortar cada poll ou resposta quando isso era definido abaixo dessas proteções.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness de long-poll concluída por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após o período de tolerância de inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após o período de tolerância de inicialização, ou quando a última atividade bem-sucedida de transporte de polling está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas `getUpdates` de longa duração estiverem saudáveis, mas seu host ainda relatar reinícios por polling travado falso-positivo. Travamentos persistentes geralmente apontam para problemas de saída de proxy, DNS, IPv6 ou TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita env de proxy de processo para transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda pode contornar `api.telegram.org`.
    - Se o proxy gerenciado do OpenClaw estiver configurado por `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhum env de proxy padrão estiver presente, o Telegram também usa essa URL para transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - O Node 22+ usa `autoSelectFamily=true` por padrão (exceto no WSL2). A ordem dos resultados de DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada disso se aplicar, o Node 22+ volta para `ipv4first`.
    - Se o seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas de intervalo de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      para downloads de mídia do Telegram por padrão. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro endereço
      privado/interno/de uso especial durante downloads de mídia, você pode optar
      pelo bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma opção está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se o seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite o intervalo
      de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções contra SSRF de mídia do Telegram. Use isso apenas em ambientes de
      proxy confiáveis e controlados pelo operador, como roteamento fake-IP do
      Clash, Mihomo ou Surge, quando eles sintetizam respostas privadas ou de uso
      especial fora do intervalo de benchmark RFC 2544. Deixe desativado para
      acesso normal ao Telegram pela internet pública.
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

<Accordion title="Campos de alto sinal do Telegram">

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- padrões de tópicos: `groups.<chatId>.topics."*"` se aplica a tópicos de fórum sem correspondência; IDs de tópico exatos o substituem
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadeamento/respostas: `replyToMode`
- streaming: `streaming` (prévia), `streaming.preview.toolProgress`, `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz de API personalizada: `apiRoot` (somente raiz da Bot API; não inclua `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência de várias contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw volta para o primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não os valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie grupos e tópicos para agentes.
  </Card>
  <Card title="Solução de problemas" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais.
  </Card>
</CardGroup>
