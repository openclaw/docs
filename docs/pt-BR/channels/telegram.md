---
read_when:
    - Trabalhando em recursos ou webhooks do Telegram
summary: Status, recursos e configuração do bot do Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-16T12:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Pronto para produção em DMs e grupos de bots via grammY. Long polling é o transporte padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DMs do Telegram é o emparelhamento.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Guias de diagnóstico e reparo entre canais.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Crie o token do bot no BotFather">
    Ambos os fluxos terminam com um token que deve ser colado no OpenClaw — escolha um:

    - **Fluxo por chat**: abra o Telegram, converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`), execute `/newbot`, siga as instruções e salve o token.
    - **Fluxo pela Web**: abra o [aplicativo Web do BotFather](https://t.me/BotFather?startapp) — ele funciona em todos os clientes do Telegram, incluindo [web.telegram.org](https://web.telegram.org) — crie o bot na interface e copie o token dele.

  </Step>

  <Step title="Configure o token e a política de DMs">

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

    Alternativa via variável de ambiente: `TELEGRAM_BOT_TOKEN` (somente para a conta padrão; contas nomeadas devem usar `botToken` ou `tokenFile`).
    O Telegram **não** usa `openclaw channels login telegram`; defina o token na configuração ou no ambiente e inicie o Gateway.

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
    Adicione o bot ao grupo e obtenha os dois IDs necessários para o acesso ao grupo:

    - seu ID de usuário do Telegram, para `allowFrom` / `groupAllowFrom`
    - o ID do chat de grupo do Telegram, como chave em `channels.telegram.groups`

    Obtenha o ID do chat de grupo por meio de `openclaw logs --follow`, de um bot de identificação por encaminhamento ou de `getUpdates` da API de Bot. Depois que o grupo for permitido, `/whoami@<bot_username>` confirma os IDs do usuário e do grupo.

    IDs negativos de supergrupos iniciados por `-100` são IDs de chats de grupo. Eles ficam em `channels.telegram.groups`, não em `groupAllowFrom`.

  </Step>
</Steps>

<Note>
A resolução do token considera a conta: `tokenFile` tem precedência sobre `botToken`, que tem precedência sobre o ambiente, e a configuração sempre tem precedência sobre `TELEGRAM_BOT_TOKEN` (que só é resolvido para a conta padrão). Após uma inicialização bem-sucedida, o OpenClaw armazena em cache a identidade do bot por até 24 horas, para que reinicializações evitem uma chamada adicional a `getMe`; alterar ou remover o token limpa esse cache.
</Note>

## Configurações do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Por padrão, os bots do Telegram usam o **Modo de privacidade**, que limita quais mensagens de grupos eles recebem.

    Para ver todas as mensagens dos grupos:

    - desative o modo de privacidade por meio de `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Após alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações de grupo do Telegram. Bots administradores recebem todas as mensagens do grupo, o que é útil para manter o comportamento do grupo sempre ativo.
  </Accordion>

  <Accordion title="Opções úteis do BotFather">

    - `/setjoingroups` — permitir ou negar adições a grupos
    - `/setprivacy` — comportamento de visibilidade em grupos

    As mesmas configurações estão disponíveis no [aplicativo Web do BotFather](https://t.me/BotFather?startapp), caso prefira uma interface em vez de comandos de chat.

  </Accordion>
</AccordionGroup>

## Mini App do painel

Execute `/dashboard` em uma DM com o bot para abrir o painel do OpenClaw dentro do Telegram.

Requisitos:

- `gateway.tailscale.mode: "serve"` ou `"funnel"` para a URL HTTPS publicada do Mini App.
- Seu ID numérico de usuário do Telegram deve estar no `allowFrom` efetivo da conta selecionada ou em `commands.ownerAllowFrom`.
- Use uma DM. Em grupos, `/dashboard` responde com `open this in a DM with the bot` e não envia nenhum botão.
- Instalações com Docker: os modos Serve/Funnel exigem que o Gateway seja vinculado à interface de loopback ao lado de `tailscaled`, algo que uma rede bridge com portas publicadas não consegue atender. Execute o contêiner do Gateway com `network_mode: host` e monte o soquete `tailscaled` do host (`/var/run/tailscale`), além da CLI `tailscale`, no contêiner.

O Mini App é um caminho v1 exclusivo do Tailscale e não oferece suporte ao iframe do Telegram Web.

## Controle de acesso e ativação

### Identidade do bot em grupos

Em grupos e tópicos de fóruns, uma menção explícita ao identificador configurado do bot (por exemplo, `@my_bot`) endereça o agente selecionado do OpenClaw, mesmo quando o nome da persona do agente é diferente do nome de usuário do Telegram. A política de silêncio do grupo ainda se aplica ao tráfego não relacionado, mas o identificador do bot nunca é considerado "outra pessoa".

<Tabs>
  <Tab title="Política de DMs">
    `channels.telegram.dmPolicy` controla o acesso a mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `dmPolicy: "open"` com `allowFrom: ["*"]` permite que qualquer conta do Telegram que encontre ou adivinhe o nome de usuário do bot envie comandos a ele. Use essa opção apenas para bots intencionalmente públicos com ferramentas rigorosamente restritas; bots de um único proprietário devem usar `allowlist` com IDs numéricos de usuários.

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Os prefixos `telegram:` / `tg:` são aceitos e normalizados.
    Em configurações com várias contas, um `channels.telegram.allowFrom` restritivo no nível superior funciona como limite de segurança: um `allowFrom: ["*"]` no nível da conta não torna essa conta pública, a menos que a lista de permissões efetiva após a mesclagem ainda contenha um curinga explícito.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação da configuração.
    A configuração solicita apenas IDs numéricos de usuários. Se a configuração tiver entradas de lista de permissões `@username` provenientes de uma configuração mais antiga, execute `openclaw doctor --fix` para resolvê-las como IDs numéricos (melhor esforço; exige um token de bot do Telegram).
    Caso anteriormente dependesse de arquivos de lista de permissões do armazenamento de emparelhamentos, `openclaw doctor --fix` pode recuperar as entradas para `channels.telegram.allowFrom` em fluxos de lista de permissões (por exemplo, quando `dmPolicy: "allowlist"` ainda não contém IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom`, em vez de depender de aprovações anteriores de emparelhamento.

    Confusão comum: a aprovação do emparelhamento de DMs não significa que "este remetente está autorizado em todos os lugares". O emparelhamento concede acesso somente a DMs. Se ainda não houver um proprietário de comandos, o primeiro emparelhamento aprovado também define `commands.ownerAllowFrom`, fornecendo uma conta de operador explícita aos comandos exclusivos do proprietário e às aprovações de execução. A autorização de remetentes em grupos ainda vem de listas de permissões explícitas na configuração.
    Para obter autorização para DMs e comandos de grupo com uma única identidade: inclua seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom` e, para comandos exclusivos do proprietário, verifique se `commands.ownerAllowFrom` contém `telegram:<your user id>`.

    ### Como encontrar seu ID de usuário do Telegram

    Opção mais segura (sem bot de terceiros): envie uma DM ao bot, execute `openclaw logs --follow` e consulte `from.id`.

    Método oficial da API de Bot:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupos e listas de permissões">
    Dois controles são aplicados em conjunto:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração de `groups`, `groupPolicy: "open"`: qualquer grupo passa nas verificações de ID de grupo
       - sem configuração de `groups`, `groupPolicy: "allowlist"` (padrão): todos os grupos são bloqueados até que sejam adicionadas entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como lista de permissões (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos nos grupos** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (padrão) / `disabled`

    `groupAllowFrom` filtra os remetentes dos grupos; se não estiver definido, o Telegram usa `allowFrom` como alternativa (não o armazenamento de emparelhamentos — a autorização de remetentes de grupos nunca herda aprovações do armazenamento de emparelhamentos de DMs, um limite de segurança desde `2026.2.25`).
    As entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (os prefixos `telegram:` / `tg:` são normalizados); entradas não numéricas são ignoradas. Não coloque IDs de chats de grupos ou supergrupos aqui — IDs negativos de chats ficam em `channels.telegram.groups`.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` sem definição e permita os grupos desejados em `channels.telegram.groups`.
    Se `channels.telegram` estiver totalmente ausente da configuração, o runtime usará por padrão o modo fechado em caso de falha `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` seja definido explicitamente.

    Configuração de grupo exclusiva para o proprietário:

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

    Teste no grupo com `@<bot_username> ping`. Mensagens comuns no grupo não acionam o bot enquanto `requireMention: true`.

    Permita qualquer membro em um grupo específico:

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

    Permita somente usuários específicos em um grupo específico:

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
      Erro comum: `groupAllowFrom` não é uma lista de permissões de grupos.

      - IDs negativos de chats de grupos/supergrupos do Telegram (`-1001234567890`) ficam em `channels.telegram.groups`.
      - IDs de usuários do Telegram (`8734062810`) ficam em `groupAllowFrom` para limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` somente para permitir que qualquer membro de um grupo permitido converse com o bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento das menções">
    Por padrão, respostas em grupos exigem uma menção. Uma menção pode vir de:

    - uma menção nativa `@botusername`, ou
    - um padrão de menção em `agents.list[].groupChat.mentionPatterns` ou `messages.groupChat.mentionPatterns`

    Alternâncias no nível da sessão (somente estado, não persistidas): `/activation always`, `/activation mention`. Use a configuração para obter persistência:

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

    O contexto do histórico do grupo está sempre ativado e é limitado por `historyLimit`. Defina `channels.telegram.historyLimit: 0` para desativar a janela do histórico do grupo. `openclaw doctor --fix` remove a chave descontinuada `includeGroupHistoryContext`.

    Como obter o ID do chat de grupo: encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`, consulte `chat.id` em `openclaw logs --follow`, inspecione `getUpdates` da API de Bot ou, depois que o grupo estiver permitido, execute `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportamento do runtime

- O Telegram é executado dentro do processo do Gateway.
- O roteamento é determinístico: respostas recebidas pelo Telegram retornam ao Telegram (o modelo não escolhe os canais).
- As mensagens recebidas são normalizadas no envelope de canal compartilhado com metadados de resposta, placeholders de mídia e contexto persistido da cadeia de respostas para as respostas que o Gateway observou.
- As sessões de grupo são isoladas pelo ID do grupo. Os tópicos de fórum acrescentam `:topic:<threadId>`.
- As mensagens de DM podem conter `message_thread_id`; o OpenClaw o preserva nas respostas. As sessões de tópicos de DM são separadas somente quando o `getMe` do Telegram informa `has_topics_enabled: true` para o bot; caso contrário, as DMs permanecem na sessão simples.
- O long polling usa o executor do grammY com sequenciamento por chat/thread. A simultaneidade do coletor do executor usa `agents.defaults.maxConcurrent`.
- A inicialização de várias contas limita as sondagens simultâneas de `getMe`, para que grandes frotas de bots não disparem a sondagem de todas as contas de uma só vez.
- Cada processo do Gateway protege o long polling para que apenas um poller ativo possa usar um token de bot por vez. Conflitos 409 persistentes de `getUpdates` indicam outro Gateway do OpenClaw, script ou poller externo usando o mesmo token.
- Por padrão, o watchdog de polling reinicia após 120 segundos sem conclusão da verificação de atividade de `getUpdates`. Aumente `channels.telegram.pollingStallThresholdMs` (30000-600000, com suporte a substituições por conta) somente se sua implantação apresentar reinicializações indevidas por polling paralisado durante trabalhos de longa duração.
- A API de bots do Telegram não oferece suporte a confirmações de leitura (`sendReadReceipts` não se aplica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` foram removidos. Execute `openclaw doctor --fix` após a atualização se sua configuração ainda contiver essas chaves. O roteamento de tópicos de DM agora segue o `getMe.has_topics_enabled` do Telegram (controlado pelo modo de threads do BotFather): bots com tópicos habilitados usam sessões de DM com escopo de thread quando o Telegram envia `message_thread_id`; as demais DMs permanecem na sessão simples.
</Note>

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia da transmissão ao vivo (edições de mensagens)">
    O OpenClaw transmite respostas parciais em tempo real em chats diretos, grupos e tópicos: envia uma mensagem de prévia, executa `editMessageText` repetidamente e finaliza no mesmo local.

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - prévias curtas da resposta inicial passam por debounce e depois são materializadas após um atraso limitado se a execução ainda estiver ativa
    - `progress` mantém um único rascunho de status editável para o progresso das ferramentas, mostra o rótulo de status estável quando há atividade de resposta antes do progresso das ferramentas, limpa-o na conclusão e envia a resposta final como uma mensagem normal
    - `streaming.preview.toolProgress` controla se as atualizações de ferramentas/progresso reutilizam a mesma mensagem de prévia editada (padrão: `true` quando a transmissão da prévia está ativa)
    - `streaming.preview.commandText` controla os detalhes de comando/execução nessas linhas: `raw` (padrão) ou `status` (somente o rótulo da ferramenta)
    - `streaming.progress.commentary` (padrão: `false`) habilita texto de comentário/preâmbulo do assistente no rascunho temporário de progresso
    - `channels.telegram.streamMode` legado, valores booleanos de `streaming` e chaves descontinuadas de prévia de rascunho nativa são detectados; execute `openclaw doctor --fix` para migrá-los

    As linhas de progresso das ferramentas são as atualizações curtas de status exibidas durante a execução das ferramentas (execução de comandos, leitura de arquivos, atualizações de planejamento, resumos de patches, preâmbulo/comentário do Codex no modo app-server). O Telegram as mantém habilitadas por padrão (corresponde ao comportamento lançado a partir de `v2026.4.22`+).

    Mantenha as edições da prévia da resposta, mas oculte as linhas de progresso das ferramentas:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Mantenha o progresso das ferramentas visível, mas oculte o texto de comando/execução:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    O modo `progress` mostra o progresso das ferramentas sem editar a resposta final nessa mensagem. Coloque a política de texto de comandos em `streaming.progress`:

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

    `streaming.mode: "off"` desabilita as edições da prévia e suprime mensagens genéricas sobre ferramentas/progresso, em vez de enviá-las como mensagens de status independentes; solicitações de aprovação, mídias e erros ainda são encaminhados pela entrega final normal. `streaming.preview.toolProgress: false` mantém somente as edições da prévia da resposta.

    <Note>
      As respostas com citação selecionada são a exceção. Quando `replyToMode` é `first`, `all` ou `batched` e a mensagem recebida contém texto de citação selecionado, o OpenClaw envia a resposta final pelo caminho nativo de resposta com citação do Telegram, em vez de editar a prévia da resposta, portanto `streaming.preview.toolProgress` não pode mostrar linhas de status nessa interação. Respostas à mensagem atual sem texto de citação selecionado continuam sendo transmitidas. Defina `replyToMode: "off"` quando a visibilidade do progresso das ferramentas for mais importante que as respostas nativas com citação, ou `streaming.preview.toolProgress: false` para aceitar essa desvantagem.
    </Note>

    Para respostas somente de texto: prévias curtas recebem a edição final no mesmo local; respostas finais longas divididas em várias mensagens reutilizam a prévia como o primeiro fragmento e enviam apenas o restante; respostas finais no modo de progresso limpam o rascunho de status e usam a entrega final normal; se a edição final falhar antes da confirmação da conclusão, o OpenClaw recorre à entrega final normal e remove a prévia obsoleta. Para respostas complexas (cargas de mídia), o OpenClaw sempre recorre à entrega final normal e remove a prévia.

    A transmissão da prévia e a transmissão em blocos são mutuamente exclusivas — quando a transmissão em blocos é habilitada explicitamente, o OpenClaw ignora a transmissão da prévia para evitar transmissão duplicada.

    Raciocínio: `/reasoning stream` transmite o raciocínio na prévia ao vivo durante a geração e depois exclui a prévia do raciocínio após a entrega final (use `/reasoning on` para mantê-la visível). A resposta final é enviada sem o texto do raciocínio.

  </Accordion>

  <Accordion title="Formatação avançada de mensagens">
    Por padrão, o texto enviado usa mensagens HTML padrão do Telegram, legíveis nos clientes atuais: negrito, itálico, links, código, spoilers, citações — não blocos avançados exclusivos da Bot API 10.2 (tabelas nativas, detalhes, mídia avançada, fórmulas).

    Habilite mensagens avançadas da Bot API 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Quando habilitado: o agente é informado de que mensagens avançadas estão disponíveis para esse bot/essa conta (com o contrato de autoria compatível com Markdown + ilhas HTML); o texto Markdown é renderizado pelo IR de Markdown do OpenClaw como blocos avançados tipados da Bot API 10.2 (títulos, tabelas, detalhes, listas de verificação, mídia avançada, fórmulas, mapas, colagens); as legendas de mídia continuam usando legendas HTML do Telegram (mensagens avançadas não substituem legendas, e as legendas têm um limite de 1024 caracteres).

    Isso mantém o texto do modelo afastado dos símbolos especiais de Markdown avançado do Telegram, para que valores monetários como `$400-600K` não sejam interpretados como matemática. Textos avançados longos são divididos automaticamente de acordo com os limites do Telegram. Tabelas que excedem o limite de 20 colunas recorrem a um bloco de código.

    Padrão: desabilitado, para compatibilidade com clientes — alguns clientes atuais para Desktop, Web, Android e de terceiros renderizam mensagens avançadas aceitas como não compatíveis. Mantenha essa opção desabilitada, a menos que todos os clientes usados com o bot consigam renderizá-las. `/status` mostra se as mensagens avançadas estão habilitadas ou desabilitadas na sessão atual.

    As prévias de links são habilitadas por padrão. `channels.telegram.linkPreview: false` desabilita a detecção automática de entidades para texto avançado.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O menu de comandos do Telegram é registrado na inicialização com `setMyCommands`. `commands.native: "auto"` habilita comandos nativos para o Telegram.

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

    Regras: os nomes são normalizados (remoção do `/` inicial, conversão para minúsculas); padrão válido `a-z`, `0-9`, `_`, comprimento de 1-32; comandos personalizados não podem substituir comandos nativos; conflitos/duplicatas são ignorados e registrados.

    Comandos personalizados são apenas entradas de menu — eles não implementam comportamentos automaticamente. Comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram. Se os comandos nativos forem desabilitados, os comandos integrados serão removidos; comandos personalizados/de Plugin ainda poderão ser registrados se estiverem configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` após uma nova tentativa de redução significa que o menu ainda excede o limite; reduza os comandos de Plugin/Skills/personalizados ou desabilite `channels.telegram.commands.native`.
    - Falhas de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` com `404: Not Found`, enquanto comandos curl diretos da Bot API funcionam, geralmente significam que `channels.telegram.apiRoot` foi definido como o endpoint completo de `/bot<TOKEN>`. `apiRoot` deve ser somente a raiz da Bot API; `openclaw doctor --fix` remove um `/bot<TOKEN>` final adicionado acidentalmente.
    - `getMe returned 401` significa que o Telegram rejeitou o token de bot configurado. Atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` (conta padrão) com o token atual do BotFather; o OpenClaw é interrompido antes do polling, portanto isso não é informado como uma falha de limpeza de Webhook.
    - `setMyCommands failed` com erros de rede/busca geralmente significa que o DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivos (Plugin `device-pair`)

    Quando instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no aplicativo para iOS
    3. `/pair pending` lista as solicitações pendentes (incluindo função/escopos)
    4. aprove: `/pair approve <requestId>`, `/pair approve` (única solicitação pendente) ou `/pair approve latest`

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (função, escopos, chave pública), a solicitação pendente anterior será substituída por um novo `requestId`; execute novamente `/pair pending` antes de aprovar.

    Mais detalhes: [Pareamento](/pt-BR/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Botões embutidos">
    Configure o escopo do teclado embutido:

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

    Escopos: `off`, `dm`, `group`, `all`, `allowlist` (padrão). O `capabilities: ["inlineButtons"]` legado é mapeado para `"all"`.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Escolha uma opção:",
  buttons: [
    [
      { text: "Sim", callback_data: "yes" },
      { text: "Não", callback_data: "no" },
    ],
    [{ text: "Cancelar", callback_data: "cancel" }],
  ],
}
```

    Exemplo de botão de Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Abrir aplicativo:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Iniciar", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Os botões `web_app` funcionam somente em chats privados entre um usuário e o bot.

    Cliques de callback não reivindicados por um manipulador interativo de plugin registrado são encaminhados ao agente como texto: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Ações de mensagens do Telegram para agentes e automação">
    Ações:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, botões embutidos `presentation` opcionais; edições somente de botões atualizam a marcação da resposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Aliases ergonômicos: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Controle de disponibilidade: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (padrão: desabilitado). `edit`, `createForumTopic` e `editForumTopic` são habilitados por padrão, sem opção dedicada.
    Os envios em tempo de execução usam o snapshot ativo de configuração/segredos da inicialização/recarga; portanto, os caminhos de ação não resolvem novamente os valores de `SecretRef` a cada envio.

    Semântica da remoção de reações: [/tools/reactions](/pt-BR/tools/reactions).

  </Accordion>

  <Accordion title="Tags de encadeamento de respostas">
    Tags explícitas de encadeamento de respostas na saída gerada:

    - `[[reply_to_current]]` — responde à mensagem que acionou a resposta
    - `[[reply_to:<id>]]` — responde a um ID de mensagem específico

    `channels.telegram.replyToMode`: `off` (padrão), `first`, `all`.

    Quando o encadeamento de respostas está habilitado e o texto/legenda original está disponível, o OpenClaw adiciona automaticamente um trecho de citação nativo. O Telegram limita o texto de citações nativas a 1024 unidades de código UTF-16; mensagens mais longas são citadas a partir do início e recorrem a uma resposta simples se o Telegram rejeitar a citação.

    `off` desabilita apenas o encadeamento implícito de respostas; as tags explícitas `[[reply_to_*]]` continuam sendo respeitadas.

  </Accordion>

  <Accordion title="Comportamento de tópicos de fórum e threads">
    Supergrupos de fórum: as chaves de sessão do tópico recebem o sufixo `:topic:<threadId>`; respostas e indicadores de digitação são direcionados à thread do tópico; o caminho de configuração do tópico é `channels.telegram.groups.<chatId>.topics.<threadId>`.

    O tópico geral (`threadId=1`) é um caso especial: os envios de mensagens omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)` com "thread não encontrada"), mas as ações de digitação ainda incluem `message_thread_id` (empiricamente necessário para que o indicador de digitação apareça).

    As entradas de tópico herdam as configurações do grupo, salvo quando substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` é exclusivo do tópico e não herda os padrões do grupo. `topics."*"` define os padrões para todos os tópicos desse grupo; IDs de tópico exatos ainda têm precedência sobre `"*"`.

    **Roteamento de agentes por tópico**: cada tópico pode ser roteado para um agente diferente por meio de `agentId` na configuração do tópico, atribuindo a ele seu próprio espaço de trabalho, memória e sessão:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico geral -> agente principal
                "3": { agentId: "zu" },        // Tópico de desenvolvimento -> agente zu
                "5": { agentId: "coder" }      // Revisão de código -> agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico passa a ter sua própria chave de sessão, por exemplo, `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Vinculação persistente de tópico ACP**: tópicos de fórum podem fixar sessões do harness ACP por meio de vinculações tipadas de nível superior (`bindings[]` com `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` e um ID qualificado por tópico como `-1001234567890:topic:42`). Atualmente limitado a tópicos de fórum em grupos/supergrupos. Consulte [Agentes ACP](/pt-BR/tools/acp-agents).

    **Criação de ACP vinculada à thread pelo chat**: `/acp spawn <agent> --thread here|auto` vincula o tópico atual a uma nova sessão ACP; mensagens subsequentes são encaminhadas diretamente para ela, e o OpenClaw fixa a confirmação da criação no tópico. Requer `channels.telegram.threadBindings.spawnSessions` (padrão: `true`).

    O contexto do template expõe `MessageThreadId` e `IsForum`. Conversas por mensagem direta com `message_thread_id` mantêm os metadados de resposta, mas usam chaves de sessão compatíveis com threads somente quando `getMe` do Telegram informa `has_topics_enabled: true`.
    As substituições descontinuadas `dm.threadReplies` e `direct.*.threadReplies` foram removidas; o modo de threads do BotFather é a única fonte da verdade. Execute `openclaw doctor --fix` para remover chaves de configuração obsoletas.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram distingue mensagens de voz de arquivos de áudio. Padrão: comportamento de arquivo de áudio; use a tag `[[audio_as_voice]]` na resposta do agente para forçar o envio como mensagem de voz. As transcrições de mensagens de voz recebidas são apresentadas no contexto do agente como texto não confiável e gerado por máquina, mas a detecção de menções ainda usa a transcrição bruta para manter o funcionamento de mensagens de voz condicionadas a menções.

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

    O Telegram distingue arquivos de vídeo de mensagens de vídeo. Mensagens de vídeo não oferecem suporte a legendas; o texto fornecido para a mensagem é enviado separadamente.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Localizações e estabelecimentos

    Use a ação existente `send` com um único objeto independente `location`. As coordenadas enviam um marcador nativo; adicionar `name` e `address` envia um cartão nativo de estabelecimento. Envios de localização não podem ser combinados com texto de mensagem nem mídia.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Torre Eiffel",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Stickers

    Recebimento: WEBP estático é baixado e processado (espaço reservado `<media:sticker>`); TGS animado e WEBM de vídeo são ignorados.

    Campos de contexto do sticker: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. As descrições são armazenadas em cache no estado SQLite do plugin do OpenClaw para reduzir chamadas repetidas de visão.

    Habilite ações de stickers:

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

    Envie:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquise stickers armazenados em cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "gato acenando",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reações">
    As reações do Telegram chegam como atualizações `message_reaction`, separadas das cargas de mensagens. Quando habilitado, o OpenClaw enfileira eventos de sistema como `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço por meio de um cache de mensagens enviadas). Os eventos de reação continuam respeitando os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.

    O Telegram não fornece IDs de thread nas atualizações de reação: grupos que não são fóruns são roteados para a sessão de conversa do grupo; grupos de fórum são roteados para a sessão do tópico geral (`:topic:1`), não para o tópico exato de origem.

    `allowed_updates` para polling/webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida. `messages.ackReactionScope` determina *quando* ele é enviado.

    **Ordem de resolução do emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de fallback da identidade do agente (`agents.list[].identity.emoji`, caso contrário, "👀")

    O Telegram espera um emoji Unicode (por exemplo, "👀"); use `""` para desabilitar a reação em um canal ou conta.

    **Escopo (`messages.ackReactionScope`, padrão `"group-mentions"`; atualmente sem substituição por conta ou canal do Telegram):**

    `all` (mensagens diretas + grupos, incluindo eventos ambientes da sala), `direct` (somente mensagens diretas), `group-all` (todas as mensagens de grupo, exceto eventos ambientes da sala; sem mensagens diretas), `group-mentions` (grupos quando o bot é mencionado; **sem mensagens diretas** — padrão), `off` / `none` (desabilitado).

    <Note>
    O escopo padrão (`group-mentions`) não dispara reações de confirmação em mensagens diretas nem em eventos ambientes da sala. Use `direct` ou `all` para mensagens diretas; somente `all` confirma eventos ambientes da sala. Esse valor é lido na inicialização do provedor do Telegram; portanto, é necessário reiniciar o Gateway para que a alteração entre em vigor.
    </Note>

  </Accordion>

  <Accordion title="Gravações de configuração por eventos e comandos do Telegram">
    As gravações de configuração do canal são habilitadas por padrão (`configWrites !== false`). As gravações acionadas pelo Telegram incluem eventos de migração de grupo (`migrate_to_chat_id`, atualiza `channels.telegram.groups`) e `/config set` / `/config unset` (requer a habilitação do comando).

    Desabilite:

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
    O padrão é long polling. Para o modo webhook, defina `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opcionais: `webhookPath` (padrão `/telegram-webhook`), `webhookHost` (padrão `127.0.0.1`), `webhookPort` (padrão `8787`), `webhookCertPath` (PEM de certificado autoassinado para configurações com IP direto ou sem domínio).

    No modo long polling, o OpenClaw persiste seu marcador de reinicialização somente depois que uma atualização é despachada com sucesso; uma falha no manipulador deixa essa atualização disponível para nova tentativa no mesmo processo, em vez de marcá-la como concluída.

    O listener local se vincula a `127.0.0.1:8787` por padrão. Para entrada pública, coloque um proxy reverso à frente da porta local ou defina `webhookHost: "0.0.0.0"` intencionalmente.

    O modo webhook valida as proteções da solicitação, o token secreto do Telegram e o corpo JSON e, em seguida, confirma a atualização em sua fila de entrada durável antes de retornar um `200` vazio. A adoção durável bem-sucedida inclui `x-openclaw-delivery-accepted: durable`; respostas de integridade, roteamento, autenticação, validação e erro de armazenamento omitem esse cabeçalho. Proxies reversos e controladores de host podem exigir o cabeçalho para distinguir a adoção pelo OpenClaw de um `200` vazio genérico, sem inferir a aceitação pelo tempo de resposta.

    Em seguida, o OpenClaw processa a atualização de forma assíncrona pelas mesmas filas do bot por conversa/tópico usadas pelo long polling; assim, execuções lentas do agente não retêm o ACK de entrega do Telegram.

  </Accordion>

  <Accordion title="Limites, novas tentativas e destinos da CLI">
    - `channels.telegram.textChunkLimit` padrão 4000; `streaming.chunkMode="newline"` prioriza limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho da mídia de entrada e saída.
    - `channels.telegram.mediaGroupFlushMs` (padrão 500, intervalo 10-60000) controla por quanto tempo álbuns/grupos de mídia ficam em buffer antes que o OpenClaw os encaminhe como uma única mensagem de entrada. Aumente-o se partes do álbum chegarem com atraso; diminua-o para reduzir a latência da resposta ao álbum.
    - `channels.telegram.timeoutSeconds` substitui o tempo limite do cliente da API (o padrão do grammY se aplica se não estiver definido). Os clientes de bot restringem os valores configurados abaixo da proteção de 60 segundos para solicitações de texto/digitação de saída, para que o grammY não interrompa a entrega de respostas visíveis antes que a proteção de transporte e o fallback do OpenClaw possam ser executados. O long polling ainda usa uma proteção de solicitação `getUpdates` de 45 segundos para que sondagens ociosas não sejam abandonadas indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tem como padrão 120000; ajuste entre 30000 e 600000 somente para reinicializações por detecção falso-positiva de sondagem travada.
    - o histórico de contexto do grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto complementar de resposta/citação/encaminhamento é normalizado em uma única janela de contexto de conversa selecionada quando o Gateway observou as mensagens pai; o cache de mensagens observadas fica no estado SQLite do Plugin do OpenClaw, e `openclaw doctor --fix` importa arquivos auxiliares legados. O Telegram inclui apenas um `reply_to_message` superficial por atualização, portanto, cadeias mais antigas que o cache ficam limitadas a essa carga útil.
    - as listas de permissões do Telegram controlam principalmente quem pode acionar o agente, não constituindo um limite completo de ocultação do contexto complementar.
    - histórico de MD: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída. A entrega da resposta final de entrada usa uma nova tentativa limitada de envio seguro para falhas anteriores à conexão, mas não repete envelopes de rede ambíguos posteriores ao envio que poderiam duplicar mensagens visíveis.

    Os destinos de envio da CLI e da ferramenta de mensagens aceitam um ID numérico de chat, nome de usuário ou destino de tópico de fórum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    As enquetes usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de enquete exclusivas do Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (ou um destino `:topic:`). `--poll-option` repete de 2 a 12 vezes (limite de opções do Telegram).

    O envio pelo Telegram também oferece suporte a `--presentation` com blocos `buttons` para teclados embutidos (quando `channels.telegram.capabilities.inlineButtons` permite), `--pin` ou `--delivery '{"pin":true}'` para solicitar a entrega fixada quando o bot pode fixar mensagens nesse chat, e `--force-document` para enviar imagens, GIFs e vídeos de saída como documentos, em vez de uploads compactados/animados/de vídeo.

    Controle de ações: `channels.telegram.actions.sendMessage=false` desativa todas as mensagens de saída, incluindo enquetes; `channels.telegram.actions.poll=false` desativa a criação de enquetes enquanto mantém os envios regulares ativados.

  </Accordion>

  <Accordion title="Aprovações de execução no Telegram">
    O Telegram oferece suporte a aprovações de execução nas MDs dos aprovadores e pode, opcionalmente, publicar solicitações no chat ou tópico de origem. Os aprovadores devem ser IDs numéricos de usuários do Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` ativa quando pelo menos um aprovador pode ser resolvido)
    - `channels.telegram.execApprovals.approvers` (recorre aos IDs numéricos dos proprietários em `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (padrão) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controlam quem pode conversar com o bot e para onde ele envia respostas normais — eles não tornam alguém um aprovador de execução. O primeiro pareamento aprovado por MD inicializa `commands.ownerAllowFrom` quando ainda não existe um proprietário de comandos, portanto, configurações com um único proprietário funcionam sem duplicar IDs em `execApprovals.approvers`.

    A entrega no canal mostra o texto do comando no chat; ative `channel` ou `both` somente em grupos/tópicos confiáveis. Quando a solicitação chega a um tópico de fórum, o OpenClaw preserva o tópico para a solicitação de aprovação e o acompanhamento. Por padrão, as aprovações de execução expiram após 30 minutos.

    Os botões de aprovação embutidos também exigem que `channels.telegram.capabilities.inlineButtons` permita a superfície de destino (`dm`, `group` ou `all`). IDs de aprovação prefixados com `plugin:` são resolvidos por meio das aprovações do Plugin; os demais são resolvidos primeiro por meio das aprovações de execução.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou do provedor, a política de erros controla se as mensagens de erro chegam ao chat do Telegram:

| Chave                                 | Valores                     | Padrão         | Descrição                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` envia todas as mensagens de erro ao chat. `once` envia cada mensagem de erro exclusiva uma vez por janela de espera (suprime erros idênticos repetidos). `silent` nunca envia mensagens de erro ao chat. |
| `channels.telegram.errorCooldownMs` | número (ms)                | `14400000` (4h) | Janela de espera da política `once`. Após o envio de um erro, a mesma mensagem é suprimida até que esse intervalo decorra. Evita excesso de mensagens de erro durante indisponibilidades.                                           |

Há suporte a substituições por conta, grupo e tópico (a mesma herança de outras chaves de configuração do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprimir erros neste grupo
        },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total: BotFather `/setprivacy` -> Disable; depois, remova e adicione novamente o bot ao grupo.
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` verifica IDs numéricos explícitos de grupos; não é possível sondar a associação com o curinga `"*"`.
    - Teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não vê nenhuma mensagem do grupo">

    - Quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`).
    - Verifique a associação do bot ao grupo.
    - Consulte `openclaw logs --follow` para saber os motivos de omissão.

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - Autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico); a autorização de comandos ainda se aplica mesmo quando a política do grupo é `open`.
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza os comandos de Plugins/Skills/personalizados ou desative os menus nativos.
    - As chamadas de inicialização `deleteMyCommands` / `setMyCommands` e as chamadas de digitação `sendChatAction` são limitadas e repetidas uma vez por meio do fallback de transporte do Telegram em caso de tempo limite da solicitação. Erros persistentes de rede/fetch geralmente significam que o DNS/HTTPS para `api.telegram.org` está inacessível.

  </Accordion>

  <Accordion title="A inicialização informa token não autorizado">

    - `getMe returned 401` é uma falha de autenticação do Telegram para o token de bot configurado. Copie novamente ou gere outro token no BotFather e atualize `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` (conta padrão).
    - `deleteWebhook 401 Unauthorized` durante a inicialização também é uma falha de autenticação; tratá-la como "nenhum webhook existe" apenas adiaria a mesma falha de token inválido para uma chamada posterior da API.

  </Accordion>

  <Accordion title="Instabilidade de sondagem ou de rede">

    - O Node 22+ com fetch/proxy personalizado pode acionar um comportamento de interrupção imediata se os tipos de `AbortSignal` forem incompatíveis.
    - Alguns hosts resolvem `api.telegram.org` primeiro para IPv6; uma saída IPv6 com problemas causa falhas intermitentes da API.
    - Logs com `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!` são repetidos como erros de rede recuperáveis.
    - Durante a inicialização da sondagem, o OpenClaw reutiliza para o grammY a sondagem `getMe` bem-sucedida da inicialização, para que o executor não precise de uma segunda `getMe` antes do primeiro `getUpdates`.
    - Se `deleteWebhook` falhar com um erro transitório de rede durante a inicialização da sondagem, o OpenClaw prossegue para o long polling em vez de realizar outra chamada de plano de controle antes da sondagem. Um webhook ainda ativo surge então como um conflito `getUpdates`; o OpenClaw reconstrói o transporte e tenta novamente limpar o webhook.
    - Se os soquetes do Telegram forem reciclados em uma cadência fixa curta, verifique se há um `channels.telegram.timeoutSeconds` baixo — os clientes de bot restringem os valores configurados abaixo das proteções de solicitação de saída e `getUpdates`, mas versões anteriores podiam interromper cada sondagem ou resposta quando esse valor era definido abaixo dessas proteções.
    - `Polling stall detected` nos logs significa que, por padrão, o OpenClaw reinicia a sondagem e reconstrói o transporte após 120 segundos sem atividade concluída do long polling.
    - `openclaw channels status --probe` e `openclaw doctor` avisam quando uma conta de sondagem em execução não concluiu `getUpdates` após o período de tolerância da inicialização, quando uma conta de webhook em execução não concluiu `setWebhook` após o período de tolerância da inicialização ou quando a última atividade bem-sucedida do transporte de sondagem está desatualizada.
    - Aumente `channels.telegram.pollingStallThresholdMs` somente quando chamadas `getUpdates` de longa duração estiverem íntegras, mas seu host ainda informar reinicializações falso-positivas por sondagem travada. Travamentos persistentes geralmente indicam problemas de proxy, DNS, IPv6 ou saída TLS para `api.telegram.org`.
    - O Telegram respeita as variáveis de ambiente de proxy do processo para o transporte da API de bots: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e variantes em minúsculas. `NO_PROXY` / `no_proxy` ainda podem ignorar `api.telegram.org`.
    - Se `OPENCLAW_PROXY_URL` estiver definido para um ambiente de serviço e nenhuma variável de ambiente de proxy padrão estiver presente, o Telegram também usará essa URL para o transporte da API de bots.
    - Em hosts VPS com saída direta/TLS instável, encaminhe as chamadas da API do Telegram por um proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - O Node 22+ usa `autoSelectFamily=true` por padrão (exceto no WSL2). A ordem dos resultados de DNS do Telegram respeita `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, depois `channels.telegram.network.dnsResultOrder` e, em seguida, o padrão do processo (por exemplo, `NODE_OPTIONS=--dns-result-order=ipv4first`), recorrendo a `ipv4first` no Node 22+ se nenhuma opção se aplicar.
    - No WSL2, ou quando o comportamento somente IPv4 funcionar melhor, force a seleção da família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - As respostas do intervalo de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas por padrão para downloads de mídia do Telegram. Se um proxy fake-IP confiável ou transparente reescrever `api.telegram.org` para algum outro endereço privado/interno/de uso especial durante downloads de mídia, habilite a exceção exclusiva do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma habilitação está disponível por conta em `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se o proxy resolver hosts de mídia do Telegram para `198.18.x.x`, primeiro mantenha a opção perigosa desativada — esse intervalo já é permitido por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as proteções contra SSRF de mídia do Telegram. Use-a apenas em ambientes de proxy confiáveis controlados pelo operador (roteamento fake-IP do Clash, Mihomo ou Surge) que sintetizem respostas privadas ou de uso especial fora do intervalo de benchmark RFC 2544. Mantenha-a desativada para o acesso normal do Telegram pela internet pública.
    </Warning>

    - Substituições temporárias por variáveis de ambiente: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Valide as respostas de DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Referência de configuração

Referência principal: [Referência de configuração — Telegram](/pt-BR/gateway/config-channels#telegram).

<Accordion title="Campos de alta relevância do Telegram">

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile` (deve ser um arquivo comum; links simbólicos são rejeitados), `accounts.*`
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` no nível superior (`type: "acp"`)
- padrões de tópicos: `groups.<chatId>.topics."*"` aplica-se aos tópicos de fórum sem correspondência; IDs exatos de tópicos têm precedência
- aprovações de execução: `execApprovals`, `accounts.*.execApprovals`
- comandos/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadeamento/respostas: `replyToMode`, `threadBindings`
- streaming: `streaming` (modos `off | partial | block | progress`), `streaming.preview.toolProgress`
- formatação/entrega: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raiz personalizada da API: `apiRoot` (somente a raiz da Bot API; não inclua `/bot<TOKEN>`), `trustedLocalFileRoots` (raízes absolutas `file_path` da Bot API auto-hospedada)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- ações/recursos: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedência entre várias contas: com dois ou mais IDs de conta configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar explícito o roteamento padrão. Caso contrário, o OpenClaw recorre ao primeiro ID de conta normalizado e `openclaw doctor` emite um aviso. Contas nomeadas herdam `channels.telegram.allowFrom` / `groupAllowFrom`, mas não os valores de `accounts.default.*`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Telegram com o Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento da lista de permissões de grupos e tópicos.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas para agentes.
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
