---
read_when:
    - Trabalhando em recursos do canal do Discord
summary: Configuração do bot do Discord, chaves de configuração, componentes, voz e solução de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-11T23:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se conecta ao Discord como um bot pelo gateway oficial do Discord. Há suporte para mensagens diretas e canais de servidores.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Por padrão, as mensagens diretas do Discord usam o modo de pareamento.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento dos comandos nativos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnóstico entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Crie um aplicativo do Discord com um bot, adicione o bot ao seu servidor e faça o pareamento dele com o OpenClaw. Se possível, use um servidor privado; [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) se necessário.

<Steps>
  <Step title="Crie um aplicativo e um bot do Discord">
    No [Discord Developer Portal](https://discord.com/developers/applications), clique em **New Application** e dê um nome a ele (por exemplo, "OpenClaw").

    Abra **Bot** na barra lateral e defina **Username** como o nome do seu agente.

  </Step>

  <Step title="Ative as intenções privilegiadas">
    Ainda na página **Bot**, em **Privileged Gateway Intents**, ative:

    - **Message Content Intent** (obrigatória)
    - **Server Members Intent** (recomendada; obrigatória para listas de permissões por função, correspondência de nomes com IDs e grupos de acesso ao público do canal)
    - **Presence Intent** (opcional; somente para atualizações de presença)

  </Step>

  <Step title="Copie o token do bot">
    Na página **Bot**, clique em **Reset Token** e copie o token.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

  </Step>

  <Step title="Gere uma URL de convite e adicione o bot ao servidor">
    Abra **OAuth2** na barra lateral. Em **OAuth2 URL Generator**, ative os escopos:

    - `bot`
    - `applications.commands`

    Na seção **Bot Permissions** que aparecer, ative pelo menos:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Essa é a configuração básica para canais de texto comuns. Se o bot publicar em threads — incluindo fluxos de canais de fórum ou mídia que criem ou continuem uma thread — ative também **Send Messages in Threads**.

    Copie a URL gerada, abra-a em um navegador, selecione seu servidor e clique em **Continue**. O bot agora deverá aparecer no servidor.

  </Step>

  <Step title="Ative o Modo de desenvolvedor e obtenha seus IDs">
    No aplicativo do Discord, ative o Modo de desenvolvedor para poder copiar IDs:

    1. **User Settings** (ícone de engrenagem) → **Developer** → ative **Developer Mode**
       *(em dispositivos móveis: **App Settings** → **Advanced**)*
    2. Clique com o botão direito no **ícone do servidor** → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Guarde o ID do servidor e o ID do usuário junto com o token do bot; você precisará dos três na próxima etapa.

  </Step>

  <Step title="Permita mensagens diretas de membros do servidor">
    Para que o pareamento funcione, o Discord deve permitir que o bot envie uma mensagem direta a você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Mantenha essa opção ativada se você usa mensagens diretas do Discord com o OpenClaw. Se você usa apenas canais do servidor, pode desativá-la após o pareamento.

  </Step>

  <Step title="Defina o token do bot com segurança (não o envie no chat)">
    O token do bot é um segredo. Defina-o na máquina que executa o OpenClaw antes de enviar mensagens ao agente:

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Se o OpenClaw já estiver sendo executado como um serviço em segundo plano, reinicie-o pelo aplicativo OpenClaw para Mac ou interrompendo e reiniciando o processo `openclaw gateway run`.
    Para instalações como serviço gerenciado, execute `openclaw gateway install` em um shell no qual `DISCORD_BOT_TOKEN` esteja definida ou armazene a variável em `~/.openclaw/.env` para que o serviço possa resolver a SecretRef de ambiente após a reinicialização.
    Se seu host estiver bloqueado ou sujeito a limites de requisições na consulta inicial de aplicativos do Discord, defina o ID do aplicativo/cliente no Developer Portal para que a inicialização possa ignorar essa chamada REST: `channels.discord.applicationId` para a conta padrão ou `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configure o OpenClaw e faça o pareamento">

    <Tabs>
      <Tab title="Peça ao seu agente">
        Converse com seu agente do OpenClaw em um canal existente (por exemplo, Telegram) e dê a instrução a ele. Se o Discord for seu primeiro canal, use a aba CLI / configuração.

        > "Eu já defini o token do meu bot do Discord na configuração. Conclua a configuração do Discord com o ID de usuário `<user_id>` e o ID de servidor `<server_id>`."
      </Tab>
      <Tab title="CLI / configuração">
        Configuração baseada em arquivo:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Alternativa por variável de ambiente para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Para uma configuração automatizada ou remota, grave o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e execute novamente sem `--dry-run`. Strings `token` em texto simples também funcionam, e há suporte a valores SecretRef para `channels.discord.token` nos provedores de ambiente, arquivo e execução. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

        Para vários bots do Discord, mantenha o token e o ID do aplicativo de cada bot na respectiva conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas; portanto, defina-o nesse nível apenas quando todas as contas usarem o mesmo ID de aplicativo.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprove o primeiro pareamento por mensagem direta">
    Quando o gateway estiver em execução, envie uma mensagem direta ao bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Peça ao seu agente">
        Envie o código de pareamento ao agente pelo seu canal existente:

        > "Aprove este código de pareamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Os códigos de pareamento expiram após 1 hora. Após a aprovação, converse com seu agente por mensagem direta no Discord.

  </Step>
</Steps>

<Note>
A resolução de tokens considera a conta. Os valores de token na configuração têm precedência sobre a alternativa por variável de ambiente, e `DISCORD_BOT_TOKEN` é usada apenas para a conta padrão.
Se duas contas habilitadas do Discord forem resolvidas para o mesmo token de bot, o OpenClaw iniciará apenas um monitor de gateway para esse token: um token originado da configuração terá precedência sobre a alternativa por variável de ambiente; caso contrário, a primeira conta habilitada terá precedência, e a conta duplicada será indicada como desabilitada com o motivo `duplicate bot token`.
Para chamadas de saída avançadas (ferramenta de mensagens/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica às ações de envio e às ações de leitura/sondagem (leitura/pesquisa/busca/thread/mensagens fixadas/permissões). As configurações de política e repetição da conta ainda vêm da conta selecionada no instantâneo de runtime ativo.
</Note>

## Recomendado: configure um espaço de trabalho no servidor

Quando as mensagens diretas estiverem funcionando, você poderá transformar seu servidor em um espaço de trabalho completo, no qual cada canal terá sua própria sessão do agente com contexto próprio. Isso é recomendado para servidores privados que tenham apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à lista de permissões de servidores">
    Isso permite que o agente responda em qualquer canal do servidor, não apenas em mensagens diretas.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Adicione meu ID de servidor do Discord `<server_id>` à lista de permissões de servidores"
      </Tab>
      <Tab title="Configuração">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permita respostas sem @menção">
    Por padrão, o agente só responde nos canais do servidor quando é @mencionado. Em um servidor privado, provavelmente será melhor que ele responda a todas as mensagens.

    Nos canais do servidor, as respostas comuns são publicadas automaticamente por padrão. Para salas compartilhadas sempre ativas, habilite `messages.groupChat.visibleReplies: "message_tool"` para que o agente possa observar silenciosamente e publicar apenas quando decidir que uma resposta no canal é útil. Isso funciona melhor com modelos de última geração confiáveis no uso de ferramentas, como o GPT-5.6 Sol. Os eventos ambientais da sala permanecem silenciosos, a menos que a ferramenta faça um envio. Consulte [Eventos ambientais da sala](/pt-BR/channels/ambient-room-events) para ver a configuração completa do modo de observação silenciosa.

    Se o Discord mostrar o indicador de digitação e os registros mostrarem uso de tokens, mas nenhuma mensagem for publicada, verifique se o turno foi configurado como um evento ambiental da sala ou se as respostas visíveis pela ferramenta de mensagens foram habilitadas.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
      </Tab>
      <Tab title="Configuração">
        Defina `requireMention: false` na configuração do servidor:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Para exigir envios pela ferramenta de mensagens nas respostas visíveis de grupos/canais, defina `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje o uso da memória nos canais do servidor">
    A memória de longo prazo (MEMORY.md) só é carregada automaticamente em sessões de mensagens diretas; os canais do servidor não a carregam.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Quando eu fizer perguntas nos canais do Discord, use memory_search ou memory_get se precisar do contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Para ter contexto compartilhado em todos os canais, coloque instruções estáveis em `AGENTS.md` ou `USER.md` (injetadas em todas as sessões). Mantenha as anotações de longo prazo em `MEMORY.md` e acesse-as sob demanda com as ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie canais e comece a conversar. O agente vê o nome do canal, e cada canal é uma sessão isolada — configure `#coding`, `#home`, `#research` ou qualquer opção adequada ao seu fluxo de trabalho.

## Modelo de runtime

- O Gateway gerencia a conexão com o Discord.
- O roteamento de respostas é determinístico: as respostas às entradas do Discord retornam ao Discord.
- Os metadados de servidor/canal do Discord são adicionados ao prompt do modelo como contexto não confiável, e não como um prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope de volta, o OpenClaw removerá os metadados copiados das respostas de saída e do contexto de reprodução futuro.
- Por padrão (`session.dmScope=main`), os chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Os canais do servidor usam chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- As mensagens diretas em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Os comandos de barra nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), mas ainda levam `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega ao Discord de anúncios de Cron/Heartbeat que contenham apenas texto é condensada na resposta final visível do assistente, enviada uma única vez. As cargas de mídia e componentes estruturados continuam sendo enviadas em várias mensagens quando o agente emite várias cargas entregáveis.

## Canais de fórum

Os canais de fórum e mídia do Discord aceitam apenas publicações em threads. O OpenClaw oferece duas maneiras de criá-las:

- Envie uma mensagem ao fórum pai (`channel:<forumId>`) para criar automaticamente uma thread. O título da thread é a primeira linha não vazia da mensagem (truncada de acordo com o limite de 100 caracteres do Discord para nomes de threads).
- Use `openclaw message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Envie ao fórum pai para criar uma thread:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Título do tópico\nCorpo da publicação"
```

Crie explicitamente uma thread de fórum:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Título do tópico" --message "Corpo da publicação"
```

Fóruns pais não aceitam componentes do Discord. Se precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens do agente. Use a ferramenta de mensagens com um payload `components`. Os resultados das interações são encaminhados de volta ao agente como mensagens de entrada normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ações permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes podem ser usados uma única vez. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Usuários não correspondentes recebem uma recusa efêmera.

Por padrão, os callbacks de componentes expiram após 30 minutos. Defina `channels.discord.agentComponents.ttlMs` para alterar o tempo de vida do registro de callbacks da conta padrão, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` por conta. O valor é expresso em milissegundos, deve ser um inteiro positivo e tem o limite máximo de `86400000` (24 horas). TTLs mais longos são adequados para fluxos de revisão/aprovação que exigem que os botões permaneçam utilizáveis, mas ampliam o período durante o qual uma mensagem antiga do Discord ainda pode acionar uma ação. Prefira o TTL mais curto que atenda à necessidade e mantenha o padrão quando callbacks obsoletos puderem causar surpresa.

Os comandos de barra `/model` e `/models` abrem um seletor interativo de modelos com listas suspensas de provedor, modelo e runtime compatível, além de uma etapa Submit. `/models add` está obsoleto e retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e pode ser usada somente pelo usuário que o invocou. Os menus de seleção do Discord são limitados a 25 opções; portanto, adicione entradas `provider/*` a `agents.defaults.models` quando quiser que o seletor exiba modelos descobertos dinamicamente somente para provedores selecionados, como `openai` ou `vllm`.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo por meio de `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome do upload quando ele precisar corresponder à referência do anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona automaticamente um botão de acionamento

Exemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de MD">
    `channels.discord.dmPolicy` controla o acesso por MD. `channels.discord.allowFrom` é a lista de permissões canônica para MDs.

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um remetente em `allowFrom`)
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de MD não estiver aberta, usuários desconhecidos serão bloqueados (ou receberão uma solicitação de pareamento no modo `pairing`).

    Precedência para várias contas:

    - `channels.discord.accounts.default.allowFrom` aplica-se somente à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o `dm.allowFrom` legado.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seus próprios `allowFrom` e `dm.allowFrom` legado não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Os campos legados `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando isso pode ser feito sem alterar o acesso.

    Formato do destino de MD para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos sem prefixo normalmente são resolvidos como IDs de canal quando um padrão de canal está ativo, mas IDs listados no `allowFrom` efetivo de MD da conta são tratados como destinos de MD de usuário para fins de compatibilidade.

  </Tab>

  <Tab title="Grupos de acesso">
    MDs do Discord e a autorização de comandos de texto podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

    Os nomes dos grupos de acesso são compartilhados entre os canais de mensagens. Use `type: "message.senders"` para um grupo estático cujos membros são expressos na sintaxe normal de `allowFrom` de cada canal, ou `type: "discord.channelAudience"` quando o público atual de `ViewChannel` de um canal do Discord deve definir a associação dinamicamente. Comportamento compartilhado dos grupos de acesso: [Grupos de acesso](/pt-BR/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação da seguinte forma: o remetente da MD é membro do servidor configurado e atualmente tem a permissão efetiva `ViewChannel` no canal configurado após a aplicação das substituições de função e canal.

    Exemplo: permita que qualquer pessoa que possa ver `#maintainers` envie uma MD ao bot, mantendo as MDs fechadas para todos os demais.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Você pode combinar entradas dinâmicas e estáticas:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    As consultas falham de modo restritivo. Se o Discord retornar `Missing Access`, a consulta do membro falhar ou o canal pertencer a outro servidor, o remetente da MD será tratado como não autorizado.

    Ative **Server Members Intent** no Discord Developer Portal ao usar grupos de acesso baseados no público de um canal. As MDs não incluem o estado de membro do servidor, portanto o OpenClaw consulta o membro pela API REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Política de servidor">
    O processamento de servidores é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A configuração básica segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - o servidor deve corresponder a `channels.discord.guilds` (prefira `id`; slug é aceito)
    - listas de remetentes permitidos opcionais: `users` (IDs estáveis são recomendados) e `roles` (somente IDs de função); se qualquer uma delas estiver configurada, os remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - a correspondência direta por nome/tag está desativada por padrão; ative `channels.discord.dangerouslyAllowNameMatching: true` somente como modo emergencial de compatibilidade
    - nomes/tags são aceitos em `users`, mas IDs são mais seguros; `openclaw security audit` alerta quando entradas de nome/tag são usadas
    - se um servidor tiver `channels` configurado, os canais não listados serão negados
    - se um servidor não tiver um bloco `channels`, todos os canais desse servidor incluído na lista de permissões serão permitidos

    Exemplo:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    A chave legada `allow` por canal é migrada para `enabled` por `openclaw doctor --fix`.

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback do runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo que `channels.defaults.groupPolicy` seja `open`.

  </Tab>

  <Tab title="Menções e MDs em grupo">
    Por padrão, mensagens de servidores exigem menção.

    A detecção de menções inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot nos casos compatíveis

    Ao escrever mensagens de saída do Discord, use a sintaxe canônica de menção: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para funções. Não use a forma legada de menção por apelido `<@!USER_ID>`.

    `requireMention` é configurado por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente mensagens que mencionem outro usuário/função, mas não o bot (exceto @everyone/@here).

    MDs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - lista de permissões opcional por meio de `dm.groupChannels` (IDs ou slugs de canais)

  </Tab>
</Tabs>

### Roteamento de agentes baseado em funções

Use `bindings[].match.roles` para encaminhar membros de servidores do Discord a diferentes agentes por ID de função. Vinculações baseadas em funções aceitam somente IDs de função e são avaliadas após as vinculações de par ou par pai e antes das vinculações exclusivas de servidor. Se uma vinculação também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados deverão corresponder.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Comandos nativos e autenticação de comandos

- `commands.native` usa `"auto"` por padrão e está habilitado para o Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza dos comandos de barra do Discord durante a inicialização. Comandos registrados anteriormente podem continuar visíveis no Discord até que você os remova do aplicativo do Discord.
- A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o processamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na interface do Discord para usuários não autorizados; a execução aplica a autenticação do OpenClaw e responde "não autorizado".
- Configurações padrão dos comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consulte [Comandos de barra](/pt-BR/tools/slash-commands) para conhecer o catálogo e o comportamento dos comandos.

## Detalhes dos recursos

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord oferece suporte a tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão): não há encadeamento implícito de respostas; as tags explícitas `[[reply_to_*]]` ainda são respeitadas
    - `first`: anexa a referência implícita da resposta nativa à primeira mensagem de saída do Discord no turno
    - `all`: anexa a referência a todas as mensagens de saída
    - `batched`: anexa a referência somente quando o evento de entrada era um lote, com debounce, de várias mensagens — útil quando você deseja respostas nativas principalmente em conversas com rajadas ambíguas, e não em cada turno de mensagem única

    Os IDs das mensagens são disponibilizados no contexto/histórico para que os agentes possam direcionar respostas a mensagens específicas.

  </Accordion>

  <Accordion title="Pré-visualizações de links">
    Por padrão, o Discord gera incorporações avançadas de links para URLs. Por padrão, o OpenClaw suprime essas incorporações geradas nas mensagens de saída do Discord, para que as URLs enviadas pelo agente permaneçam como links simples, a menos que você habilite essa opção:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Defina `channels.discord.accounts.<id>.suppressEmbeds` para substituir a configuração de uma conta. Os envios pela ferramenta de mensagens do agente também podem passar `suppressEmbeds: false` para uma única mensagem. Cargas explícitas `embeds` do Discord não são suprimidas pela configuração padrão de pré-visualização de links.

  </Accordion>

  <Accordion title="Pré-visualização de transmissão ao vivo">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming.mode` aceita `off` | `partial` | `block` | `progress` (padrão quando nenhuma chave `streaming` nem a chave legada `streamMode` está definida). `streamMode` é um alias legado; execute `openclaw doctor --fix` para reescrever a configuração persistida para o formato aninhado canônico `streaming`.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` desabilita as edições de pré-visualização do Discord.
    - `partial` edita uma única mensagem de pré-visualização conforme os tokens chegam.
    - `block` emite blocos do tamanho de rascunhos; ajuste o tamanho e os pontos de quebra com `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), limitado a `textChunkLimit`. Quando a transmissão em blocos é habilitada explicitamente, o OpenClaw ignora a transmissão de pré-visualização para evitar transmissão duplicada.
    - `progress` mantém um rascunho de status editável e o atualiza com o progresso das ferramentas até a entrega final; o rótulo inicial compartilhado é uma linha contínua, portanto sai da tela como o restante quando há trabalho suficiente.
    - Resultados finais com mídia, erro ou resposta explícita cancelam as edições de pré-visualização pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se as atualizações de ferramenta/progresso reutilizam a mensagem de pré-visualização.
    - As linhas de ferramenta/progresso são renderizadas como emoji compacto + título + detalhe, quando disponível, por exemplo, `🛠️ Bash: executar testes` ou `🔎 Pesquisa na Web: por "consulta"`.
    - `streaming.progress.commentary` (padrão `false`) habilita o texto de comentário/preâmbulo do assistente no rascunho temporário de progresso. O comentário é limpo antes da exibição, permanece transitório e não altera a entrega da resposta final.
    - `streaming.progress.maxLineChars` controla o limite por linha da pré-visualização de progresso. A prosa é encurtada nos limites das palavras; os detalhes de comandos e caminhos preservam sufixos úteis.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla os detalhes de comando/execução nas linhas compactas de progresso: `raw` (padrão) ou `status` (somente o rótulo da ferramenta).

    Oculte o texto bruto de comando/execução sem remover as linhas compactas de progresso:

    ```json
    {
      "channels": {
        "discord": {
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

    A transmissão da pré-visualização aceita somente texto; respostas com mídia usam a entrega normal.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de threads">
    Contexto do histórico do servidor:

    - `channels.discord.historyLimit` tem o padrão `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles do histórico de mensagens diretas:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de threads:

    - As threads do Discord são encaminhadas como sessões de canal e herdam a configuração do canal pai, a menos que haja uma substituição.
    - As sessões de thread herdam a seleção de `/model` no nível da sessão do canal pai apenas como alternativa de modelo; seleções de `/model` locais da thread têm precedência, e o histórico da transcrição pai não é copiado, a menos que a herança de transcrição esteja habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) permite que novas threads automáticas sejam inicializadas com a transcrição pai. Substituição por conta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - As reações da ferramenta de mensagens podem resolver destinos de mensagens diretas `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante a alternativa de ativação na etapa de resposta.

    Os tópicos dos canais são injetados como contexto **não confiável**. As listas de permissões restringem quem pode acionar o agente, mas não constituem um limite completo de redação do contexto complementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a threads para subagentes">
    O Discord pode vincular uma thread a um destino de sessão, para que as mensagens subsequentes nessa thread continuem sendo encaminhadas à mesma sessão, incluindo sessões de subagentes.

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove o vínculo da thread atual
    - `/agents` mostra execuções ativas e o estado do vínculo
    - `/session idle <duration|off>` consulta/atualiza o desvínculo automático por inatividade para vínculos em foco
    - `/session max-age <duration|off>` consulta/atualiza a idade máxima absoluta para vínculos em foco

    Configuração:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Observações:

    - `session.threadBindings.*` define os padrões globais; `channels.discord.threadBindings.*` substitui o comportamento do Discord.
    - `spawnSessions` controla a criação/vinculação automática de threads para `sessions_spawn({ thread: true })` e criações de threads ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo do subagente para criações vinculadas a threads. Padrão: `"fork"`.
    - As chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se os vínculos de threads estiverem desabilitados para uma conta, `/focus` e as operações relacionadas de vínculo de threads não estarão disponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vínculos persistentes de canais ACP">
    Para espaços de trabalho ACP estáveis e "sempre ativos", configure vínculos ACP tipados no nível superior que tenham conversas do Discord como destino.

    Caminho da configuração: `bindings[]` com `type: "acp"` e `match.channel: "discord"`.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Observações:

    - `/acp spawn codex --bind here` vincula o canal ou a thread atual no local e mantém as mensagens futuras na mesma sessão ACP. As mensagens da thread herdam o vínculo do canal pai.
    - Em um canal ou uma thread vinculada, `/new` e `/reset` redefinem a mesma sessão ACP no local. Vínculos temporários de threads podem substituir a resolução do destino enquanto estiverem ativos.
    - `spawnSessions` controla a criação/vinculação de threads filhas por meio de `--thread auto|here`.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para obter detalhes sobre o comportamento dos vínculos.

  </Accordion>

  <Accordion title="Notificações de reações">
    Modo de notificação de reações por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Os eventos de reação são convertidos em eventos do sistema e anexados à sessão encaminhada do Discord.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji da identidade do agente (`agents.list[].identity.emoji`; caso contrário, "👀")

    Observações:

    - O Discord aceita emojis Unicode ou nomes de emojis personalizados.
    - Use `""` para desabilitar a reação em um canal ou uma conta.

    **Escopo (`messages.ackReactionScope`):**

    Valores: `"all"` (mensagens diretas + grupos, incluindo eventos ambientes da sala), `"direct"` (somente mensagens diretas), `"group-all"` (todas as mensagens de grupo, exceto eventos ambientes da sala; sem mensagens diretas), `"group-mentions"` (grupos quando o bot é mencionado; **sem mensagens diretas**, padrão), `"off"` / `"none"` (desabilitado).

    <Note>
    O escopo padrão (`"group-mentions"`) não aciona reações de confirmação em mensagens diretas nem em eventos ambientes da sala. Para receber uma reação de confirmação em mensagens diretas recebidas do Discord e em eventos de salas silenciosas, defina `messages.ackReactionScope` como `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Gravações de configuração">
    As gravações de configuração iniciadas pelo canal ficam habilitadas por padrão. Isso afeta os fluxos `/config set|unset` quando os recursos de comando estão habilitados.

    Para desabilitar:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy do Gateway">
    Encaminhe o tráfego WebSocket do gateway do Discord e as consultas REST de inicialização (ID do aplicativo + resolução da lista de permissões) por um proxy HTTP(S) com `channels.discord.proxy`.
    O proxy WebSocket do gateway do Discord é explícito; as conexões WebSocket não herdam as variáveis de ambiente de proxy do processo do Gateway. As consultas REST de inicialização usam esse proxy quando `channels.discord.proxy` está configurado.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Suporte ao PluralKit">
    Habilite a resolução do PluralKit para mapear mensagens intermediadas para a identidade do membro do sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcional; necessário para sistemas privados
      },
    },
  },
}
```

    Observações:

    - as listas de permissões podem usar `pk:<memberId>`
    - os nomes de exibição dos membros são comparados por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - as consultas usam a API do PluralKit com o ID da mensagem original
    - se a consulta falhar, as mensagens encaminhadas por proxy serão tratadas como mensagens de bot e descartadas, a menos que `allowBots` permita sua passagem

  </Accordion>

  <Accordion title="Aliases de menções de saída">
    Use `mentionAliases` quando os agentes precisarem de menções de saída determinísticas para usuários conhecidos do Discord. As chaves são identificadores sem o `@` inicial; os valores são IDs de usuário do Discord. Identificadores desconhecidos, `@everyone`, `@here` e menções dentro de trechos de código Markdown permanecem inalterados.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Configuração de presença">
    As atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando ativa a presença automática.

    Somente status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Atividade (o status personalizado é o tipo de atividade padrão quando `activity` é definido):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Transmissão:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de atividade:

    - 0: Jogando
    - 1: Transmitindo (requer `activityUrl`; por sua vez, `activityUrl` requer `activityType: 1`)
    - 2: Ouvindo
    - 3: Assistindo
    - 4: Personalizado (usa o texto da atividade como o estado do status; o emoji é opcional)
    - 5: Competindo

    Presença automática (sinal de integridade do runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: íntegro => online, degradado ou desconhecido => ocioso, esgotado ou indisponível => não perturbe. Padrões: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (deve ser menor ou igual a `intervalMs`). Substituições opcionais de texto:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (compatível com o espaço reservado `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece tratamento de aprovações por botões em mensagens diretas e, opcionalmente, pode publicar solicitações de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa `commands.ownerAllowFrom` como alternativa quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord ativa automaticamente as aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser determinado, seja por `execApprovals.approvers` ou por `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução a partir de `allowFrom` do canal, do `dm.allowFrom` legado nem do `defaultTo` de mensagens diretas. Defina `enabled: false` para desativar explicitamente o Discord como cliente nativo de aprovação.

    Para comandos sensíveis de grupo exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia as solicitações de aprovação e os resultados finais de forma privada. Primeiro, ele tenta usar uma mensagem direta do Discord quando o proprietário que invocou o comando tem uma rota de proprietário no Discord; caso contrário, usa como alternativa a primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como o Telegram.

    Quando `target` é `channel` ou `both`, a solicitação de aprovação fica visível no canal. Somente os aprovadores determinados podem usar os botões; outros usuários recebem uma recusa efêmera. As solicitações de aprovação incluem o texto do comando, portanto, ative a entrega no canal somente em canais confiáveis. Se não for possível obter o ID do canal a partir da chave da sessão, o OpenClaw usa a entrega por mensagem direta como alternativa.

    O Discord renderiza os botões de aprovação compartilhados usados por outros canais de chat; o adaptador nativo do Discord adiciona principalmente o roteamento de mensagens diretas para aprovadores e a distribuição entre canais. Quando esses botões estão presentes, eles são a principal experiência de aprovação; o OpenClaw só deve incluir um comando manual `/approve` quando o resultado da ferramenta indicar que as aprovações pelo chat estão indisponíveis ou que a aprovação manual é o único caminho. Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém visível a solicitação local determinística `/approve <id> <decision>`. Se o runtime estiver ativo, mas não for possível entregar um cartão nativo a nenhum destino, o OpenClaw enviará um aviso alternativo no mesmo chat com o comando `/approve` exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovações seguem o contrato compartilhado do cliente do Gateway (IDs `plugin:` são resolvidos por `plugin.approval.resolve`; outros IDs, por `exec.approval.resolve`). Por padrão, as aprovações expiram após 30 minutos.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e controles de ações

As ações de mensagens do Discord abrangem mensagens, administração de canais, moderação, presença e metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

Os controles de ações ficam em `channels.discord.actions.*`.

Comportamento padrão dos controles:

| Grupo de ações                                                                                                                                                            | Padrão      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ativado     |
| roles                                                                                                                                                                    | desativado  |
| moderation                                                                                                                                                               | desativado  |
| presence                                                                                                                                                                 | desativado  |

## Interface de componentes v2

O OpenClaw usa os componentes v2 do Discord para aprovações de execução e marcadores entre contextos. As ações de mensagens do Discord também podem aceitar `components` para interfaces personalizadas (avançado; requer a criação de uma carga de componente por meio da ferramenta do Discord), enquanto os `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada pelos contêineres de componentes do Discord (hexadecimal). Por conta: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla por quanto tempo os callbacks dos componentes enviados ao Discord permanecem registrados (padrão `1800000`, máximo `86400000`). Por conta: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` são ignorados quando os componentes v2 estão presentes.
- As prévias de URLs simples são suprimidas por padrão. Defina `suppressEmbeds: false` em uma ação de mensagem quando um único link de saída precisar ser expandido.

Exemplo:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voz

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagens de voz** (o formato de prévia com forma de onda). O Gateway oferece suporte a ambos.

### Canais de voz

Lista de verificação da configuração:

1. Ative Message Content Intent no Discord Developer Portal.
2. Ative Server Members Intent quando forem usadas listas de permissões de funções/usuários.
3. Convide o bot com os escopos `bot` e `applications.commands`.
4. Conceda Connect, Speak, Send Messages e Read Message History no canal de voz de destino.
5. Ative os comandos nativos (`commands.native` ou `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Use `/vc join|leave|status` para controlar as sessões. O comando usa o agente padrão da conta e segue as mesmas regras de lista de permissões e política de grupo dos outros comandos do Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Para inspecionar as permissões efetivas do bot antes de entrar:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Exemplo de entrada automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Observações:

- A voz do Discord é opcional em configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar os comandos `/vc`, o runtime de voz e a intenção `GuildVoiceStates` do Gateway. `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura da intenção; deixe-a sem definir para seguir a habilitação efetiva da voz.
- `voice.mode` controla o fluxo da conversa. O padrão é `agent-proxy`: uma interface de voz em tempo real gerencia o tempo dos turnos, as interrupções e a reprodução, delega o trabalho substancial ao agente OpenClaw roteado por meio de `openclaw_agent_consult` e trata o resultado como um prompt digitado no Discord por esse participante. `stt-tts` mantém o fluxo em lote mais antigo de STT seguido de TTS. `bidi` permite que o modelo em tempo real converse diretamente, enquanto disponibiliza `openclaw_agent_consult` para o cérebro do OpenClaw.
- `voice.agentSession` controla qual conversa do OpenClaw recebe os turnos de voz. Deixe-a sem definir para usar a sessão própria do canal de voz ou defina `{ mode: "target", target: "channel:<text-channel-id>" }` para fazer o canal de voz atuar como uma extensão de microfone/alto-falante de uma sessão existente de canal de texto do Discord, como `#maintainers`.
- `voice.model` substitui o cérebro do agente OpenClaw para respostas de voz do Discord e consultas em tempo real. Deixe-o sem definir para herdar o modelo do agente roteado. Ele é separado de `voice.realtime.model`.
- `voice.followUsers` permite que o bot entre, se mova e saia da voz do Discord junto com usuários selecionados. Consulte [Seguir usuários na voz](#follow-users-in-voice).
- `agent-proxy` roteia a fala por `discord-voice`, que preserva a autorização normal de proprietário e de ferramentas para o participante e a sessão de destino, mas oculta a ferramenta `tts` do agente porque a voz do Discord controla a reprodução. Por padrão, `agent-proxy` concede à consulta acesso completo a ferramentas, equivalente ao do proprietário, para participantes proprietários (`voice.realtime.toolPolicy: "owner"`) e prioriza fortemente consultar o agente OpenClaw antes de respostas substanciais (`voice.realtime.consultPolicy: "always"`). Nesse modo `always` padrão, a camada em tempo real não fala automaticamente frases de preenchimento antes da resposta da consulta; ela captura e transcreve a fala e depois reproduz a resposta roteada do OpenClaw. Se várias respostas de consultas obrigatórias forem concluídas enquanto o Discord ainda estiver reproduzindo a primeira resposta, as respostas posteriores com fala exata serão enfileiradas até que a reprodução fique ociosa, em vez de substituir a fala no meio de uma frase.
- No modo `stt-tts`, o STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Nos modos em tempo real, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configuram a sessão de áudio em tempo real. Para usar OpenAI Realtime 2.1 com o cérebro Codex, use `voice.realtime.model: "gpt-realtime-2.1"` e `voice.model: "openai/gpt-5.6-sol"`.
- Por padrão, os modos de voz em tempo real incluem pequenos arquivos de perfil `IDENTITY.md`, `USER.md` e `SOUL.md` nas instruções do provedor em tempo real, para que turnos diretos rápidos mantenham a mesma identidade, o mesmo contexto do usuário e a mesma persona do agente OpenClaw roteado. Defina `voice.realtime.bootstrapContextFiles` como um subconjunto para personalizar isso ou como `[]` para desabilitá-lo. Somente esses arquivos de perfil são compatíveis; `AGENTS.md` permanece no contexto normal do agente. O contexto de perfil injetado não substitui `openclaw_agent_consult` para trabalho no espaço de trabalho, fatos atuais, consulta à memória ou ações apoiadas por ferramentas.
- No modo em tempo real `agent-proxy` da OpenAI, defina `voice.realtime.requireWakeName: true` para manter a voz em tempo real do Discord em silêncio até que uma transcrição comece ou termine com um nome de ativação. Os nomes de ativação configurados devem ter uma ou duas palavras. Se `voice.realtime.wakeNames` não estiver definido, o OpenClaw usará o `name` do agente roteado mais `OpenClaw`, recorrendo ao ID do agente mais `OpenClaw`. A exigência de nome de ativação desabilita a resposta automática do provedor em tempo real, roteia os turnos aceitos pelo fluxo de consulta do agente OpenClaw e fornece uma breve confirmação falada quando um nome de ativação inicial é reconhecido na transcrição parcial, antes da chegada da transcrição final.
- O provedor em tempo real da OpenAI aceita os nomes atuais de eventos do Realtime 2 e aliases legados compatíveis com Codex para eventos de áudio de saída e transcrição, permitindo que instantâneos compatíveis do provedor divirjam sem descartar o áudio do assistente.
- `voice.realtime.bargeIn` controla se eventos de início de fala no Discord interrompem a reprodução em tempo real ativa. Se não estiver definido, ele seguirá a configuração de interrupção por áudio de entrada do provedor em tempo real.
- `voice.realtime.minBargeInAudioEndMs` controla a duração mínima da reprodução do assistente antes que uma interrupção em tempo real da OpenAI trunque o áudio. Padrão: `250`. Defina `0` para interrupção imediata em salas com pouco eco ou aumente o valor para configurações de alto-falantes com muito eco.
- `voice.tts` substitui `messages.tts` somente para a reprodução de voz de `stt-tts`; os modos em tempo real usam `voice.realtime.speakerVoice`. Para usar uma voz da OpenAI na reprodução do Discord, defina `voice.tts.provider: "openai"` e escolha uma voz de conversão de texto em fala em `voice.tts.providers.openai.speakerVoice`. `cedar` é uma boa opção de sonoridade masculina no modelo TTS atual da OpenAI.
- As substituições de `systemPrompt` por canal do Discord são aplicadas aos turnos de transcrição de voz desse canal de voz.
- Os turnos de transcrição de voz determinam o status de proprietário com base em `allowFrom` (ou `dm.allowFrom`) do Discord para comandos e ações de canal restritos ao proprietário. A visibilidade das ferramentas do agente segue a política de ferramentas configurada para a sessão roteada.
- Se `voice.autoJoin` tiver várias entradas para o mesmo servidor, o OpenClaw entrará no último canal configurado para esse servidor.
- `voice.allowedChannels` é uma lista de permissões de permanência opcional. Deixe-a sem definir para permitir que `/vc join` entre em qualquer canal de voz autorizado do Discord. Quando definida, `/vc join`, a entrada automática na inicialização e as movimentações do estado de voz do bot ficam restritos às entradas `{ guildId, channelId }` listadas. Defina-a como um array vazio para impedir todas as entradas em voz do Discord. Se o Discord mover o bot para fora da lista de permissões, o OpenClaw sairá desse canal e entrará novamente no destino de entrada automática configurado, quando houver um disponível.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados às opções de entrada de `@discordjs/voice`; os padrões do upstream são `daveEncryption=true` e `decryptionFailureTolerance=24`.
- O OpenClaw usa o codec `libopus-wasm` incluído para receber voz do Discord e reproduzir PCM bruto em tempo real. Ele inclui uma compilação WebAssembly fixada da libopus e não exige complementos nativos do Opus.
- `voice.connectTimeoutMs` controla a espera inicial pelo estado `Ready` de `@discordjs/voice` nas tentativas de `/vc join` e entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw aguarda que uma sessão de voz desconectada comece a se reconectar antes de destruí-la. Padrão: `15000`.
- No modo `stt-tts`, a reprodução de voz não para apenas porque outro usuário começou a falar. Para evitar ciclos de realimentação, o OpenClaw ignora novas capturas de voz enquanto o TTS está sendo reproduzido; fale depois que a reprodução terminar para iniciar o próximo turno. Os modos em tempo real encaminham inícios de fala como sinais de interrupção ao provedor em tempo real.
- Nos modos em tempo real, o eco dos alto-falantes captado por um microfone aberto pode parecer uma interrupção e interromper a reprodução. Para salas do Discord com muito eco, defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que a OpenAI interrompa automaticamente em resposta ao áudio de entrada. Adicione `voice.realtime.bargeIn: true` se ainda quiser que eventos de início de fala do Discord interrompam a reprodução ativa. A ponte em tempo real da OpenAI ignora truncamentos de reprodução mais curtos que `voice.realtime.minBargeInAudioEndMs`, considerando-os prováveis ecos ou ruídos, e os registra como ignorados em vez de limpar a reprodução do Discord.
- `voice.captureSilenceGraceMs` controla por quanto tempo o OpenClaw aguarda depois que o Discord informa que um participante parou de falar antes de finalizar esse segmento de áudio para STT. Padrão: `2000`; aumente-o se o Discord dividir pausas normais em transcrições parciais fragmentadas.
- Quando ElevenLabs é o provedor TTS selecionado, a reprodução de voz do Discord usa TTS por streaming e começa a partir do fluxo de resposta do provedor. Provedores sem suporte a streaming recorrem ao fluxo de arquivo temporário sintetizado.
- O OpenClaw monitora falhas de descriptografia na recepção e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em um curto intervalo.
- Se os registros de recepção mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após uma atualização, colete um relatório de dependências e os registros. A versão incluída de `@discordjs/voice` contém a correção upstream de preenchimento da PR nº 11449 do discord.js, que encerrou a issue nº 11419 do discord.js.
- Os eventos de recepção `The operation was aborted` são esperados quando o OpenClaw finaliza um segmento capturado de um participante; eles são diagnósticos detalhados, não avisos.
- Os registros detalhados de voz do Discord incluem uma prévia limitada, em uma linha, da transcrição STT de cada segmento de participante aceito, permitindo que a depuração mostre tanto o lado do usuário quanto o lado da resposta do agente sem despejar texto de transcrição sem limites.
- No modo `agent-proxy`, o fallback de consulta obrigatória ignora fragmentos de transcrição provavelmente incompletos, como texto terminado em `...` ou em um conector final como "e", além de encerramentos obviamente não acionáveis, como "já volto" ou "tchau". Os registros mostram `forced agent consult skipped reason=...` quando isso impede uma resposta enfileirada obsoleta.

### Seguir usuários na voz

Use `voice.followUsers` quando quiser que o bot de voz do Discord permaneça com um ou mais usuários conhecidos do Discord, em vez de entrar em um canal fixo na inicialização ou aguardar `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Comportamento:

- `followUsers` aceita IDs brutos de usuários do Discord e valores `discord:<id>`. O OpenClaw normaliza ambas as formas antes de comparar eventos de estado de voz.
- `followUsersEnabled` assume `true` por padrão quando `followUsers` está configurado. Defina-o como `false` para manter a lista salva, mas interromper o acompanhamento automático por voz.
- Quando um usuário seguido entra em um canal de voz permitido, o OpenClaw entra nesse canal. Quando o usuário se move, o OpenClaw se move com ele. Quando o usuário seguido ativo se desconecta, o OpenClaw sai.
- Se vários usuários seguidos estiverem no mesmo servidor e o usuário seguido ativo sair, o OpenClaw se moverá para o canal de outro usuário seguido monitorado antes de sair do servidor. Se vários usuários seguidos se moverem ao mesmo tempo, prevalecerá o evento de estado de voz observado mais recentemente.
- `allowedChannels` continua sendo aplicado. Um usuário seguido em um canal não permitido é ignorado, e uma sessão controlada pelo acompanhamento se move para outro usuário seguido ou sai.
- O OpenClaw reconcilia eventos de estado de voz perdidos na inicialização e em intervalos limitados. A reconciliação faz amostragens dos servidores configurados e limita as consultas REST por execução; portanto, listas `followUsers` muito grandes podem levar mais de um intervalo para convergir.
- Se o Discord ou um administrador mover o bot enquanto ele estiver seguindo um usuário, o OpenClaw reconstruirá a sessão de voz e preservará o controle do acompanhamento quando o destino for permitido. Se o bot for movido para fora de `allowedChannels`, o OpenClaw sairá e entrará novamente no destino configurado, quando houver um.
- A recuperação da recepção DAVE pode sair e entrar novamente no mesmo canal após falhas repetidas de descriptografia. As sessões controladas pelo acompanhamento mantêm esse controle durante o fluxo de recuperação; portanto, uma desconexão posterior do usuário seguido ainda fará o bot sair do canal.

Escolha entre os modos de entrada:

- Use `followUsers` em configurações pessoais ou de operadores nas quais o bot deva estar automaticamente na voz quando você estiver.
- Use `autoJoin` para bots de salas fixas que devam permanecer presentes mesmo quando nenhum usuário monitorado estiver na voz.
- Use `/vc join` para entradas pontuais ou salas nas quais a presença automática por voz seria inesperada.

Codec de voz do Discord:

- Os registros de recepção de voz mostram `discord voice: opus decoder: libopus-wasm`.
- A reprodução em tempo real codifica PCM estéreo bruto de 48 kHz em Opus com o mesmo pacote `libopus-wasm` incluído antes de entregar os pacotes a `@discordjs/voice`.
- A reprodução de arquivos e de streams de provedores transcodifica para PCM estéreo bruto de 48 kHz com ffmpeg e depois usa `libopus-wasm` para o fluxo de pacotes Opus enviado ao Discord.

Pipeline de STT seguido de TTS:

- A captura PCM do Discord é convertida em um arquivo WAV temporário.
- `tools.media.audio` processa STT, por exemplo, `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta é executado com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita o texto retornado, pois a voz do Discord controla a reprodução final de TTS.
- `voice.model`, quando definido, substitui apenas o LLM de resposta para este turno do canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; provedores compatíveis com streaming alimentam o reprodutor diretamente; caso contrário, o arquivo de áudio resultante é reproduzido no canal conectado.

Exemplo de sessão de canal de voz padrão com proxy do agente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Sem um bloco `voice.agentSession`, cada canal de voz recebe sua própria sessão roteada do OpenClaw. Por exemplo, `/vc join channel:234567890123456789` se comunica com a sessão desse canal de voz do Discord. O modelo em tempo real é apenas a interface de voz; solicitações substanciais são encaminhadas ao agente OpenClaw configurado. Se o modelo em tempo real produzir uma transcrição final sem chamar a ferramenta de consulta, o OpenClaw força a consulta como alternativa para que o padrão continue funcionando como uma conversa com o agente.

Exemplo de STT legado com TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Exemplo bidirecional em tempo real:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voz como extensão de uma sessão existente de canal do Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

No modo `agent-proxy`, o bot entra no canal de voz configurado, mas os turnos do agente OpenClaw usam a sessão roteada normal e o agente do canal de destino. A sessão de voz em tempo real fala o resultado retornado no canal de voz. O agente supervisor ainda pode usar as ferramentas normais de mensagem de acordo com sua política de ferramentas, incluindo o envio de uma mensagem separada no Discord, se essa for a ação adequada.

Enquanto uma execução delegada do OpenClaw está ativa, novas transcrições de voz do Discord são tratadas como controle da execução em tempo real antes do início de outro turno do agente. Frases como "status", "cancele isso", "use a correção menor" ou "quando terminar, verifique também os testes" são classificadas como entrada de status, cancelamento, direcionamento ou acompanhamento para a sessão ativa. Os resultados de status, cancelamento, direcionamento aceito e acompanhamento são falados no canal de voz para que o interlocutor saiba se o OpenClaw processou a solicitação.

Formatos de destino úteis:

- `target: "channel:123456789012345678"` roteia por uma sessão de canal de texto do Discord.
- `target: "123456789012345678"` é tratado como um destino de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` roteia pela sessão de mensagem direta correspondente.

Exemplo do OpenAI Realtime para ambientes com muito eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Use isto quando o modelo ouvir sua própria reprodução do Discord por um microfone aberto, mas você ainda quiser interrompê-lo falando. O OpenClaw impede que a OpenAI interrompa automaticamente com base no áudio de entrada bruto, enquanto `bargeIn: true` permite que eventos de início de fala do Discord e o áudio de um interlocutor já ativo cancelem respostas em tempo real ativas antes que o próximo turno capturado chegue à OpenAI. Sinais de interrupção muito precoces, com `audioEndMs` abaixo de `minBargeInAudioEndMs`, são tratados como provável eco ou ruído e ignorados, para que o modelo não seja interrompido no primeiro quadro da reprodução.

Registros de voz esperados:

- Ao entrar: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Ao iniciar o processamento em tempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- No áudio do interlocutor: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Ao ignorar fala obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- Ao concluir a resposta em tempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Ao interromper ou redefinir a reprodução: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Na consulta em tempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Na resposta do agente: `discord voice: agent turn answer ...`
- Ao enfileirar fala exata: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido por `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Ao detectar uma interrupção por fala: `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido por `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Na interrupção em tempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido por `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ou `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Ao ignorar eco ou ruído: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Com a interrupção por fala desativada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Com a reprodução ociosa: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para diagnosticar áudio interrompido, leia os registros de voz em tempo real como uma linha do tempo:

1. `realtime audio playback started` significa que o Discord começou a reproduzir o áudio do assistente. A partir desse ponto, a ponte começa a contar os fragmentos da saída do assistente, os bytes PCM do Discord, os bytes em tempo real do provedor e a duração do áudio sintetizado.
2. `realtime speaker turn opened` marca quando um interlocutor do Discord se torna ativo. Se a reprodução já estiver ativa e `bargeIn` estiver habilitado, isso poderá ser seguido por `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca o primeiro quadro de áudio efetivamente recebido nesse turno do interlocutor. `outputActive=true` ou um valor diferente de zero em `outputAudioMs` nesse ponto significa que o microfone está enviando entrada enquanto a reprodução do assistente ainda está ativa.
4. `barge-in detected source=active-speaker-audio` significa que o OpenClaw detectou áudio ao vivo do interlocutor enquanto a reprodução do assistente estava ativa. Isso é útil para distinguir uma interrupção real de um evento de início de fala do Discord sem áudio útil.
5. `barge-in requested reason=...` significa que o OpenClaw solicitou ao provedor em tempo real que cancelasse ou truncasse a resposta ativa. Ele inclui `outputAudioMs`, `outputActive` e `playbackChunks` para que você possa ver quanto do áudio do assistente havia sido efetivamente reproduzido antes da interrupção.
6. `realtime audio playback stopped reason=...` é o ponto local de redefinição da reprodução do Discord. O motivo indica quem interrompeu a reprodução: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` resume o turno de entrada capturado. `chunks=0` ou `hasAudio=false` significa que o turno do interlocutor foi aberto, mas nenhum áudio utilizável chegou à ponte em tempo real. `interruptedPlayback=true` significa que esse turno de entrada coincidiu com a saída do assistente e acionou a lógica de interrupção por fala.

Campos úteis:

- `outputAudioMs`: duração do áudio do assistente gerado pelo provedor em tempo real antes da linha de registro.
- `audioMs`: duração do áudio do assistente contabilizada pelo OpenClaw antes da interrupção da reprodução.
- `elapsedMs`: tempo decorrido entre a abertura e o fechamento do fluxo de reprodução ou do turno do interlocutor.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados para ou recebidos da voz do Discord.
- `realtimeBytes`: bytes PCM no formato do provedor enviados para ou recebidos do provedor em tempo real.
- `playbackChunks`: fragmentos de áudio do assistente encaminhados ao Discord para a resposta ativa.
- `sinceLastAudioMs`: intervalo entre o último quadro de áudio capturado do interlocutor e o fechamento do turno.

Padrões comuns:

- Uma interrupção imediata com `source=active-speaker-audio`, um `outputAudioMs` pequeno e o mesmo usuário por perto geralmente indica que o eco do alto-falante está entrando no microfone. Aumente `voice.realtime.minBargeInAudioEndMs`, reduza o volume do alto-falante, use fones de ouvido ou defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido por `speaker turn closed ... hasAudio=false` significa que o Discord informou o início da fala, mas nenhum áudio chegou ao OpenClaw. Isso pode ser um evento transitório de voz do Discord, um comportamento do controle de ruído ou um cliente que ativou brevemente o microfone.
- `audio playback stopped reason=stream-close` sem uma interrupção por fala ou um `provider-clear-audio` próximo significa que o fluxo local de reprodução do Discord terminou inesperadamente. Verifique os registros anteriores do provedor e do reprodutor do Discord.
- `capture ignored during playback (barge-in disabled)` significa que o OpenClaw descartou intencionalmente a entrada enquanto o áudio do assistente estava ativo. Habilite `voice.realtime.bargeIn` se quiser que a fala interrompa a reprodução.
- `barge-in ignored ... outputActive=false` significa que o Discord ou a detecção de atividade de voz do provedor detectou fala, mas o OpenClaw não tinha nenhuma reprodução ativa para interromper. Isso não deve interromper o áudio.

As credenciais são resolvidas por componente: autenticação da rota do LLM para `voice.model`, autenticação de STT para `tools.media.audio`, autenticação de TTS para `messages.tts`/`voice.tts` e autenticação do provedor em tempo real para `voice.realtime.providers` ou para a configuração normal de autenticação do provedor.

### Mensagens de voz

As mensagens de voz do Discord exibem uma prévia da forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter o áudio.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita o conteúdo de texto (o Discord rejeita texto e mensagem de voz na mesma carga).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intenções não permitidas foram usadas ou o bot não vê mensagens do servidor">

    - habilite o Message Content Intent
    - habilite o Server Members Intent quando depender da resolução de usuários/membros
    - reinicie o Gateway após alterar os intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifique `groupPolicy`
    - verifique a lista de permissões de servidores em `channels.discord.guilds`
    - se existir um mapa `channels` para um servidor, somente os canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Causas comuns:

    - `groupPolicy="allowlist"` sem uma lista de permissões correspondente de servidor/canal
    - `requireMention` configurado no local errado (deve estar em `channels.discord.guilds` ou em uma entrada de canal)
    - remetente bloqueado pela lista de permissões `users` do servidor/canal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Opções da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla apenas o trabalho do listener do Gateway do Discord, não a duração do turno do agente

    O Discord não aplica um tempo limite pertencente ao canal aos turnos de agente enfileirados. Os listeners de mensagens repassam o trabalho imediatamente, e as execuções enfileiradas do Discord preservam a ordem por sessão até que o ciclo de vida da sessão, ferramenta ou ambiente de execução conclua ou interrompa o trabalho.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway metadata lookup timeout warnings">
    O OpenClaw busca os metadados `/gateway/bot` do Discord antes de se conectar. Em caso de falhas transitórias, usa a URL padrão do Gateway do Discord como alternativa e limita a frequência dos registros nos logs.

    Opções de tempo limite dos metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variável de ambiente alternativa quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões do ambiente de execução. Configurações com várias contas e inicialização escalonada podem precisar de uma janela de espera de `READY` maior que a padrão durante a inicialização.

    Opções de tempo limite de `READY`:

    - inicialização com conta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicialização com várias contas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variável de ambiente alternativa na inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão na inicialização: `15000` (15 segundos), máximo: `120000`
    - ambiente de execução com conta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ambiente de execução com várias contas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variável de ambiente alternativa no ambiente de execução quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão no ambiente de execução: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    As verificações de permissões de `channels status --probe` funcionam apenas com IDs numéricos de canais.

    Se você usar chaves de slug, a correspondência no ambiente de execução ainda poderá funcionar, mas a sondagem não conseguirá verificar completamente as permissões.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - mensagens diretas desabilitadas: `channels.discord.dm.enabled=false`
    - política de mensagens diretas desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Por padrão, as mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissões para evitar ciclos.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bots que mencionem o bot.

    O OpenClaw também inclui uma [proteção compartilhada contra ciclos de bots](/pt-BR/channels/bot-loop-protection). Sempre que `allowBots` permite que mensagens criadas por bots cheguem ao encaminhamento, o Discord mapeia o evento recebido para dados de `(conta, canal, par de bots)`, e a proteção genérica de pares suprime o par depois que ele ultrapassa o orçamento de eventos configurado. A proteção impede ciclos descontrolados entre dois bots que antes precisavam ser interrompidos pelos limites de frequência do Discord; ela não afeta implantações com um único bot nem respostas isoladas de bots que permaneçam dentro do orçamento.

    Configurações padrão (ativas quando `allowBots` está definido):

    - `maxEventsPerWindow: 20` -- o par de bots pode trocar 20 mensagens dentro da janela deslizante
    - `windowSeconds: 60` -- duração da janela deslizante
    - `cooldownSeconds: 60` -- quando o orçamento é excedido, todas as mensagens adicionais entre os bots, em qualquer direção, são descartadas durante um minuto

    Configure o padrão compartilhado uma vez em `channels.defaults.botLoopProtection` e depois substitua-o para o Discord quando um fluxo de trabalho legítimo precisar de mais margem. A precedência é:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - padrões integrados

    O Discord usa as chaves genéricas `maxEventsPerWindow`, `windowSeconds` e `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha listens to other bots only when they mention it.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Bravo write an Alpha Discord mention with the configured user id.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para garantir que a lógica de recuperação da recepção de voz do Discord esteja presente
    - confirme que `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão do projeto upstream) e ajuste somente se necessário
    - monitore os logs em busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete os logs e compare-os com o histórico upstream da recepção DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração — Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- inicialização/autenticação: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener, padrão `120000`), `eventQueue.maxQueueSize` (padrão `10000`), `eventQueue.maxConcurrency` (padrão `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (padrão `2000`), `maxLinesPerMessage` (padrão `17`)
- transmissão: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (as chaves planas legadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` e `chunkMode` são migradas para `streaming.*` por `openclaw doctor --fix`)
- mídia/nova tentativa: `mediaMaxMb` (limita os uploads enviados ao Discord, padrão `100`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interface: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` no nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate os tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda ao Discord apenas as permissões mínimas necessárias.
- Se a implantação ou o estado dos comandos estiver desatualizado, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Discord com o Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pt-BR/channels/groups">
    Comportamento de conversas em grupo e listas de permissões.
  </Card>
  <Card title="Channel routing" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas para agentes.
  </Card>
  <Card title="Security" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e proteção.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento dos comandos nativos.
  </Card>
</CardGroup>
