---
read_when:
    - Trabalhando em recursos ou webhooks do Telegram
summary: Status de suporte, recursos e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção para DMs e grupos de bots via grammY. O modo de consulta longa é o padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e manuais de reparo.
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

    Fallback de ambiente: `TELEGRAM_BOT_TOKEN=...` (somente conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token na config/env e então inicie o gateway.

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
    Adicione o bot ao seu grupo e então obtenha os dois IDs de que o acesso ao grupo precisa:

    - seu ID de usuário do Telegram, usado em `allowFrom` / `groupAllowFrom`
    - o ID do chat de grupo do Telegram, usado como chave em `channels.telegram.groups`

    Para uma configuração inicial, obtenha o ID do chat de grupo em `openclaw logs --follow`, em um bot de ID encaminhado ou no `getUpdates` da Bot API. Depois que o grupo for permitido, `/whoami@<bot_username>` pode confirmar os IDs do usuário e do grupo.

    IDs negativos de supergrupos do Telegram que começam com `-100` são IDs de chats de grupo. Coloque-os em `channels.telegram.groups`, não em `groupAllowFrom`.

  </Step>
</Steps>

<Note>
A ordem de resolução do token é ciente da conta. Na prática, valores de configuração prevalecem sobre o fallback de ambiente, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
Após uma inicialização bem-sucedida, o OpenClaw armazena em cache a identidade do bot no diretório de estado por até 24 horas para que reinicializações possam evitar uma chamada extra `getMe` do Telegram; alterar ou remover o token limpa esse cache.
</Note>

## Configurações no lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, você pode:

    - desativar o modo de privacidade via `/setprivacy`, ou
    - tornar o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações de grupo do Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento de grupo sempre ativo.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para o comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

### Identidade do bot no grupo

Em grupos e tópicos de fórum do Telegram, uma menção explícita ao identificador configurado do bot (por exemplo, `@my_bot`) é tratada como endereçada ao agente OpenClaw selecionado, mesmo quando o nome da persona do agente difere do nome de usuário do Telegram. A política de silêncio do grupo ainda se aplica ao tráfego de grupo não relacionado, mas o próprio identificador do bot não é considerado "outra pessoa."

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso por mensagem direta:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot comande o bot. Use isso somente para bots intencionalmente públicos com ferramentas rigidamente restritas; bots de um único proprietário devem usar `allowlist` com IDs numéricos de usuário.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações de várias contas, um `channels.telegram.allowFrom` restritivo no nível superior é tratado como um limite de segurança: entradas `allowFrom: ["*"]` no nível da conta não tornam essa conta pública, a menos que a lista efetiva de permissões da conta ainda contenha um curinga explícito após a mesclagem.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita somente IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas de lista de permissões `@username`, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de lista de permissões do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de lista de permissões (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: a aprovação de pareamento por DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso por DM. Se ainda não existir um proprietário de comando, o primeiro pareamento aprovado também define `commands.ownerAllowFrom` para que comandos exclusivos do proprietário e aprovações de execução tenham uma conta de operador explícita.
    A autorização de remetentes em grupos ainda vem de listas de permissões explícitas na configuração.
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

  <Tab title="Política de grupo e listas de permissões">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem config `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até que você adicione entradas `groups` (ou `"*"`)
       - `groups` configurado: atua como lista de permissões (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupos. Se não estiver definido, o Telegram usa `allowFrom` como fallback.
    Entradas `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupos ou supergrupos do Telegram em `groupAllowFrom`. IDs negativos de chat pertencem em `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetentes.
    Limite de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento permanece somente para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram usa a configuração `allowFrom` como fallback, não o armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos-alvo em `channels.telegram.groups`.
    Nota de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com falha fechada, a menos que `channels.defaults.groupPolicy` esteja definido explicitamente.

    Configuração de grupo exclusiva do proprietário:

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

    Teste isso no grupo com `@<bot_username> ping`. Mensagens simples de grupo não acionam o bot enquanto `requireMention: true`.

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
      Erro comum: `groupAllowFrom` não é uma lista de permissões de grupos do Telegram.

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

    Elas atualizam somente o estado da sessão. Use a configuração para persistência.

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

    O contexto do histórico de grupo usa `mention-only` por padrão: mensagens anteriores do grupo são
    incluídas somente quando foram endereçadas ao bot, são respostas ao bot
    ou são mensagens do próprio bot. Defina `includeGroupHistoryContext: "recent"` para
    incluir o histórico recente da sala em grupos confiáveis. Defina
    `includeGroupHistoryContext: "none"` para não enviar nenhum histórico anterior de grupo do Telegram
    com o próximo turno.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Obtendo o ID do chat de grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione o `getUpdates` da Bot API
    - depois que o grupo for permitido, execute `/whoami@<bot_username>` se comandos nativos estiverem habilitados

  </Tab>
</Tabs>

## Comportamento de runtime

- Telegram é de propriedade do processo do Gateway.
- O roteamento é determinístico: respostas de entrada do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas para o envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido da cadeia de respostas para respostas do Telegram que o Gateway observou.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw o preserva para respostas. Sessões de tópico em DM só se dividem quando o `getMe` do Telegram informa `has_topics_enabled: true` para o bot; caso contrário, DMs permanecem na sessão plana.
- O polling longo usa o runner grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- A inicialização de várias contas limita sondagens concorrentes de `getMe` do Telegram para que grandes frotas de bots não disparem a sondagem de todas as contas de uma vez.
- O polling longo é protegido dentro de cada processo do Gateway para que apenas um poller ativo possa usar um token de bot por vez. Se você ainda vir conflitos 409 de `getUpdates`, outro Gateway do OpenClaw, script ou poller externo provavelmente está usando o mesmo token.
- Reinícios do watchdog de polling longo disparam após 120 segundos sem atividade concluída de `getUpdates` por padrão. Aumente `channels.telegram.pollingStallThresholdMs` somente se sua implantação ainda vir reinícios falsos por polling travado durante trabalhos longos. O valor está em milissegundos e é permitido de `30000` a `600000`; substituições por conta são compatíveis.
- A Telegram Bot API não tem suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` foram removidos. Execute `openclaw doctor --fix` após atualizar se sua configuração ainda tiver essas chaves. O roteamento de tópicos em DM agora segue a capacidade do bot em `getMe.has_topics_enabled` do Telegram, que é controlada pelo modo com threads do BotFather: bots com tópicos habilitados usam sessões de DM com escopo de thread quando o Telegram envia `message_thread_id`; outras DMs permanecem na sessão plana.
</Note>

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de stream ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - prévias curtas de resposta inicial são submetidas a debounce e então materializadas após um atraso limitado se a execução ainda estiver ativa
    - `progress` mantém um rascunho de status editável para progresso de ferramentas, mostra o rótulo de status estável quando atividade de resposta chega antes do progresso de ferramentas, limpa-o na conclusão e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando o streaming de prévia está ativo)
    - `streaming.preview.commandText` controla detalhes de comando/execução dentro dessas linhas de progresso de ferramenta: `raw` (padrão, preserva o comportamento lançado) ou `status` (somente rótulo da ferramenta)
    - `streaming.progress.commentary` (padrão: `false`) habilita texto de comentário/preâmbulo do assistente no rascunho temporário de progresso
    - `channels.telegram.streamMode`, valores booleanos de `streaming` e chaves legadas de prévia de rascunho nativo são detectados; execute `openclaw doctor --fix` para migrá-los para a configuração de streaming atual

    Atualizações de prévia de progresso de ferramenta são as linhas curtas de status mostradas enquanto ferramentas executam, por exemplo execução de comandos, leituras de arquivos, atualizações de planejamento, resumos de patches ou texto de preâmbulo/comentário do Codex no modo app-server do Codex. O Telegram mantém isso habilitado por padrão para corresponder ao comportamento lançado do OpenClaw a partir de `v2026.4.22`.

    Para manter a prévia editada para o texto da resposta, mas ocultar linhas de progresso de ferramenta, defina:

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

    Use `streaming.mode: "off"` somente quando quiser entrega apenas final: edições de prévia do Telegram são desabilitadas e conversas genéricas de ferramenta/progresso são suprimidas em vez de enviadas como mensagens de status independentes. Prompts de aprovação, payloads de mídia e erros ainda são roteados pela entrega final normal. Use `streaming.preview.toolProgress: false` quando você só quiser manter edições de prévia de resposta enquanto oculta as linhas de status de progresso de ferramenta.

    <Note>
      Respostas de citação selecionada do Telegram são a exceção. Quando `replyToMode` é `"first"`, `"all"` ou `"batched"` e a mensagem de entrada inclui texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram em vez de editar a prévia da resposta, então `streaming.preview.toolProgress` não pode mostrar as linhas curtas de status para esse turno. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de prévia. Defina `replyToMode: "off"` quando a visibilidade do progresso de ferramenta importar mais do que respostas nativas com citação, ou defina `streaming.preview.toolProgress: false` para reconhecer a troca.
    </Note>

    Para respostas somente de texto:

    - prévias curtas de DM/grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz a edição final no local
    - finais de texto longos que se dividem em várias mensagens do Telegram reutilizam a prévia existente como o primeiro bloco final quando possível e então enviam somente os blocos restantes
    - finais em modo de progresso limpam o rascunho de status e usam entrega final normal em vez de editar o rascunho para virar a resposta
    - se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa entrega final normal e limpa a prévia obsoleta

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw recorre à entrega final normal e então limpa a mensagem de prévia.

    Streaming de prévia é separado de streaming em blocos. Quando streaming em blocos está explicitamente habilitado para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplicado.

    Comportamento do stream de raciocínio:

    - `/reasoning stream` usa o caminho de prévia de raciocínio de um canal compatível; no Telegram, ele transmite o raciocínio para a prévia ao vivo durante a geração
    - a prévia de raciocínio é excluída após a entrega final; use `/reasoning on` quando o raciocínio deve permanecer visível
    - a resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatação avançada de mensagens">
    O texto de saída usa mensagens HTML padrão do Telegram por padrão para que as respostas permaneçam legíveis nos clientes atuais do Telegram. Esse modo de compatibilidade oferece suporte a negrito, itálico, links, código, spoilers e citações normais, mas não a blocos exclusivos de mensagens avançadas da Bot API 10.1, como tabelas nativas, detalhes, mídia avançada e fórmulas.

    Defina `channels.telegram.richMessages: true` para habilitar mensagens avançadas da Bot API 10.1:

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

    - O agente é informado de que mensagens avançadas do Telegram estão disponíveis para este bot/conta.
    - Texto Markdown é renderizado pelo IR de Markdown do OpenClaw e enviado como HTML avançado do Telegram.
    - Payloads explícitos de HTML avançado preservam tags compatíveis da Bot API 10.1, como cabeçalhos, tabelas, detalhes, mídia avançada e fórmulas.
    - Legendas de mídia ainda usam legendas HTML do Telegram porque mensagens avançadas não substituem legendas.

    Isso mantém o texto do modelo longe dos sigilos de Markdown Avançado do Telegram, então moedas como `$400-600K` não são interpretadas como matemática. Texto avançado longo é dividido automaticamente entre os limites de texto avançado e bloco avançado do Telegram. Tabelas acima do limite de colunas do Telegram são enviadas como blocos de código.

    Padrão: desativado para compatibilidade com clientes. Mensagens avançadas exigem clientes Telegram compatíveis; alguns clientes atuais Desktop, Web, Android e de terceiros exibem mensagens avançadas aceitas como sem suporte. Mantenha esta opção desabilitada a menos que todos os clientes usados com o bot consigam renderizá-las. `/status` mostra se a sessão atual do Telegram está com mensagens avançadas ativadas ou desativadas.

    Prévias de link são habilitadas por padrão. `channels.telegram.linkPreview: false` ignora a detecção automática de entidades para texto avançado.

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
    - comandos de plugin/skill ainda podem funcionar quando digitados, mesmo que não sejam mostrados no menu do Telegram

    Se comandos nativos estiverem desabilitados, os embutidos são removidos. Comandos personalizados/de plugins ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de plugins/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - falha em `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found` enquanto comandos curl diretos da Bot API funcionam pode significar que `channels.telegram.apiRoot` foi definido para o endpoint completo `/bot<TOKEN>`. `apiRoot` deve ser somente a raiz da Bot API, e `openclaw doctor --fix` remove um `/bot<TOKEN>` final acidental.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` com o token atual do BotFather; o OpenClaw para antes do polling, então isso não é relatado como falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. O bootstrap de código de configuração embutido é somente para node: a primeira conexão cria uma solicitação de node pendente e, após a aprovação, o Gateway retorna um token de node durável com `scopes: []`. Ele não retorna um token de operador transferido; acesso de operador exige um pareamento de operador aprovado separado ou fluxo de token.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo, função/escopos/chave pública), a solicitação pendente anterior é substituída e a nova solicitação usa um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

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

    Botões `web_app` do Telegram funcionam apenas em chats privados entre um usuário e o
    bot.

    Cliques de callback são passados para o agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    As ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, botões inline `presentation` opcionais; edições somente de botão atualizam a marcação de resposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    As ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de bloqueio:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` atualmente são ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em runtime usam o snapshot ativo de configuração/segredos (inicialização/recarregamento), então os caminhos de ação não fazem nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reações: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    O Telegram oferece suporte a tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` responde à mensagem acionadora
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Quando o encadeamento de respostas está ativado e o texto ou a legenda original do Telegram está disponível, o OpenClaw inclui automaticamente um trecho de citação nativa do Telegram. O Telegram limita o texto de citação nativa a 1024 unidades de código UTF-16, então mensagens mais longas são citadas a partir do início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação miram a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é somente de tópico e não herda dos padrões do grupo.
    `topics."*"` define padrões para todos os tópicos nesse grupo; IDs exatos de tópico ainda prevalecem sobre `"*"`.

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

    **Spawn ACP vinculado à thread pelo chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; acompanhamentos são roteados diretamente para lá. O OpenClaw fixa a confirmação de spawn no tópico. Requer que `channels.telegram.threadBindings.spawnSessions` permaneça ativado (padrão: `true`).

    O contexto de template expõe `MessageThreadId` e `IsForum`. Chats de DM com `message_thread_id` mantêm metadados de resposta; eles usam chaves de sessão cientes de thread somente quando `getMe` do Telegram informa `has_topics_enabled: true` para o bot.
    As antigas substituições `dm.threadReplies` e `direct.*.threadReplies` foram aposentadas intencionalmente; use o modo encadeado do BotFather como a única fonte da verdade e execute `openclaw doctor --fix` para remover chaves de configuração obsoletas.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Mensagens de áudio

    O Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz
    - transcrições de notas de voz recebidas são enquadradas como texto gerado por máquina
      e não confiável no contexto do agente; a detecção de menções ainda usa a transcrição
      bruta, então mensagens de voz bloqueadas por menção continuam funcionando.

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

    Notas de vídeo não aceitam legendas; o texto da mensagem fornecido é enviado separadamente.

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

    As descrições de figurinhas são armazenadas em cache no estado de Plugin SQLite do OpenClaw para reduzir chamadas repetidas de visão.

    Habilite ações de figurinha:

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
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa reações de usuários apenas a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos que não são fórum são roteados para a sessão de chat do grupo
      - grupos de fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida. `ackReactionScope` decide *quando* esse emoji é realmente enviado.

    **Ordem de resolução de emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo, "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

    **Escopo (`messages.ackReactionScope`):**

    O provedor do Telegram lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Hoje não há substituição no nível de conta do Telegram nem no nível de canal do Telegram.

    Valores: `"all"` (DMs + grupos), `"direct"` (apenas DMs), `"group-all"` (todas as mensagens de grupo, sem DMs), `"group-mentions"` (grupos quando o bot é mencionado; **sem DMs** — este é o padrão), `"off"` / `"none"` (desabilitado).

    <Note>
    O escopo padrão (`"group-mentions"`) não dispara reações de confirmação em mensagens diretas. Para obter uma reação de confirmação em DMs recebidas do Telegram, defina `messages.ackReactionScope` como `"direct"` ou `"all"`. O valor é lido na inicialização do provedor do Telegram, então é necessário reiniciar o gateway para a alteração entrar em vigor.
    </Note>

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações de configuração do canal são habilitadas por padrão (`configWrites !== false`).

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

  <Accordion title="Long polling versus webhook">
    O padrão é long polling. Para o modo webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais `webhookPath`, `webhookHost`, `webhookPort` (padrões `/telegram-webhook`, `127.0.0.1`, `8787`).

    No modo long-polling, o OpenClaw persiste seu watermark de reinicialização somente depois que uma atualização é despachada com sucesso. Se um handler falhar, essa atualização permanece passível de nova tentativa no mesmo processo e não é gravada como concluída para deduplicação na reinicialização.

    O listener local faz bind em `127.0.0.1:8787`. Para ingresso público, coloque um proxy reverso na frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo webhook valida as proteções da requisição, o token secreto do Telegram e o corpo JSON antes de retornar `200` ao Telegram.
    Em seguida, o OpenClaw processa a atualização de forma assíncrona pelas mesmas lanes de bot por chat/por tópico usadas pelo long polling, de modo que turnos lentos de agente não bloqueiem o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, repetição e alvos da CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia de entrada e saída do Telegram.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500) controla por quanto tempo álbuns/grupos de mídia do Telegram são armazenados em buffer antes que o OpenClaw os despache como uma única mensagem de entrada. Aumente se partes do álbum chegarem tarde; diminua para reduzir a latência de resposta do álbum.
    - `channels.telegram.timeoutSeconds` substitui o tempo limite do cliente da API do Telegram (se não definido, o padrão do grammY se aplica). Clientes de bot limitam valores configurados abaixo da proteção de 60 segundos para solicitações de texto/digitação de saída, para que o grammY não aborte a entrega de respostas visíveis antes que a proteção de transporte e o fallback do OpenClaw possam ser executados. O long polling ainda usa uma proteção de solicitação `getUpdates` de 45 segundos para que polls ociosos não sejam abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` usa `120000` por padrão; ajuste entre `30000` e `600000` somente para reinicializações por travamento de polling falso-positivas.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto suplementar de resposta/citação/encaminhamento é normalizado em uma janela de contexto de conversa selecionada quando o gateway observou as mensagens pai; o cache de mensagens observadas fica no estado de Plugin SQLite do OpenClaw, e `openclaw doctor --fix` importa arquivos auxiliares legados. O Telegram inclui apenas um `reply_to_message` superficial nas atualizações, então cadeias mais antigas que o cache ficam limitadas ao payload de atualização atual do Telegram.
    - allowlists do Telegram controlam principalmente quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.
    - Controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - A configuração `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega de resposta final de entrada também usa uma repetição de envio seguro limitada para falhas de pré-conexão do Telegram, mas não repete envelopes de rede ambíguos pós-envio que poderiam duplicar mensagens visíveis.

    Alvos de envio da CLI e da ferramenta de mensagens podem ser ID numérico de chat, nome de usuário ou um alvo de tópico de fórum:

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
    - `--thread-id` para tópicos de fórum (ou use um alvo `:topic:`)

    O envio pelo Telegram também oferece suporte a:

    - `--presentation` com blocos `buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--pin` ou `--delivery '{"pin":true}'` para solicitar entrega fixada quando o bot puder fixar nesse chat
    - `--force-document` para enviar imagens, GIFs e vídeos de saída como documentos em vez de uploads comprimidos de foto, mídia animada ou vídeo

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desativa a criação de enquetes do Telegram enquanto mantém envios normais ativados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts no chat ou tópico de origem. Aprovadores devem ser IDs numéricos de usuário do Telegram.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled` (ativa automaticamente quando pelo menos um aprovador é resolvível)
    - `channels.telegram.execApprovals.approvers` (usa como fallback IDs numéricos de proprietários de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode falar com o bot e para onde ele envia respostas normais. Eles não tornam alguém um aprovador de exec. O primeiro pareamento de DM aprovado inicializa `commands.ownerAllowFrom` quando ainda não existe proprietário de comando, então a configuração com um único proprietário ainda funciona sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; ative `channel` ou `both` somente em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento. Aprovações de exec expiram após 30 minutos por padrão.

    Botões de aprovação inline também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por meio de aprovações de Plugin; outros são resolvidos primeiro por aprovações de exec.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                           |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável ao chat. `silent` suprime respostas de erro totalmente. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro ao mesmo chat. Evita spam de erros durante indisponibilidades. |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança de outras chaves de configuração do Telegram).

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

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade completa.
      - BotFather: `/setprivacy` -> Disable
      - depois remova e adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ter associação testada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não vê mensagens de grupo">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/skill/personalizados ou desative menus nativos
    - chamadas de inicialização `deleteMyCommands` / `setMyCommands` e chamadas de digitação `sendChatAction` são limitadas e repetem uma vez pelo fallback de transporte do Telegram em tempo limite de solicitação. Erros persistentes de rede/fetch geralmente indicam problemas de alcançabilidade DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Inicialização informa token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado.
    - Copie novamente ou regenere o token do bot no BotFather, depois atualize `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` para a conta padrão.
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para chamadas de API posteriores.

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de abort imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 quebrada pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora repete essas falhas como erros de rede recuperáveis.
    - Durante a inicialização de polling, o OpenClaw reutiliza a sondagem `getMe` bem-sucedida de inicialização para o grammY, para que o runner não precise de um segundo `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro de rede transitório durante a inicialização de polling, o OpenClaw continua para long polling em vez de fazer outra chamada de plano de controle antes do poll. Um webhook ainda ativo aparece como um conflito de `getUpdates`; o OpenClaw então reconstrói o transporte do Telegram e tenta novamente a limpeza do webhook.
    - Se sockets do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo; clientes de bot limitam valores configurados abaixo das proteções de solicitação de saída e `getUpdates`, mas versões antigas podiam abortar cada poll ou resposta quando isso era definido abaixo dessas proteções.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e reconstrói o transporte do Telegram após 120 segundos sem liveness de long-poll concluída por padrão.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de polling em execução não concluiu `getUpdates` após a tolerância de inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após a tolerância de inicialização, ou quando a última atividade bem-sucedida de transporte de polling está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` somente quando chamadas `getUpdates` longas estiverem saudáveis, mas seu host ainda relatar reinicializações falsas por travamento de polling. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - O Telegram também respeita envs de proxy de processo para o transporte da Bot API, incluindo `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e suas variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda pode ignorar `api.telegram.org`.
    - Se o proxy gerenciado pelo OpenClaw estiver configurado por meio de `OPENCLAW_PROXY_URL` para um ambiente de serviço e nenhum env de proxy padrão estiver presente, o Telegram também usa essa URL para o transporte da Bot API.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` por padrão (exceto WSL2). A ordem de resultados DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder`, depois o padrão do processo, como `NODE_OPTIONS=--dns-result-order=ipv4first`; se nada se aplicar, Node 22+ usa `ipv4first` como fallback.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas no intervalo de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se uma IP falsa confiável ou um
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode
      habilitar o bypass somente para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma habilitação está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se o seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite o intervalo
      de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções de SSRF de mídia do Telegram. Use somente em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento de IP falsa do Clash,
      Mihomo ou Surge, quando eles sintetizam respostas privadas ou de uso especial
      fora do intervalo de benchmark RFC 2544. Deixe desativado para acesso normal
      ao Telegram pela internet pública.
    </Warning>

    - Sobrescritas de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validar respostas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Referência de configuração

Referência principal: [Referência de configuração - Telegram](/pt-BR/gateway/config-channels#telegram).

<Accordion title="Campos de alto valor do Telegram">

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- padrões de tópicos: `groups.<chatId>.topics."*"` se aplica a tópicos de fórum sem correspondência; IDs de tópico exatos o sobrescrevem
- aprovações de execução: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadeamento/respostas: `replyToMode`
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
Precedência de múltiplas contas: quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito. Caso contrário, o OpenClaw recorre ao primeiro ID de conta normalizado e `openclaw doctor` avisa. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não os valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento da lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens recebidas para agentes.
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
