---
read_when:
    - Trabalhando em recursos do canal Discord
summary: Status de suporte, capacidades e configuração do bot do Discord
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Pronto para DMs e canais de guilda via o Gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comandos nativos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar uma nova aplicação com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crie uma aplicação e um bot do Discord">
    Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê a ela um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você usa para seu agente OpenClaw.

  </Step>

  <Step title="Habilite intents privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para allowlists de funções e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copie o token do seu bot">
    Role de volta para cima na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Este é seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gere uma URL de convite e adicione o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você gerará uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role para baixo até **OAuth2 URL Generator** e habilite:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Habilite pelo menos:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Este é o conjunto básico para canais de texto normais. Se você pretende postar em threads do Discord, incluindo fluxos de canais de fórum ou mídia que criam ou continuam uma thread, habilite também **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor Discord.

  </Step>

  <Step title="Habilite o Modo de Desenvolvedor e colete seus IDs">
    De volta ao app do Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três para o OpenClaw na próxima etapa.

  </Step>

  <Step title="Permita DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso habilitado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais de guilda, pode desabilitar DMs após o pareamento.

  </Step>

  <Step title="Defina o token do seu bot com segurança (não o envie no chat)">
    O token do bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagem ao seu agente.

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

    Se o OpenClaw já estiver em execução como serviço em segundo plano, reinicie-o pelo app OpenClaw para Mac ou parando e reiniciando o processo `openclaw gateway run`.
    Para instalações de serviço gerenciado, execute `openclaw gateway install` em um shell onde `DISCORD_BOT_TOKEN` esteja presente, ou armazene a variável em `~/.openclaw/.env`, para que o serviço possa resolver o SecretRef de env após a reinicialização.
    Se seu host estiver bloqueado ou limitado por taxa pela busca de aplicação de inicialização do Discord, defina o ID da aplicação/cliente do Discord no Portal de Desenvolvedores para que a inicialização possa pular essa chamada REST. Use `channels.discord.applicationId` para a conta padrão, ou `channels.discord.accounts.<accountId>.applicationId` quando você executar vários bots do Discord.

  </Step>

  <Step title="Configure o OpenClaw e faça o pareamento">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga a ele. Se o Discord for seu primeiro canal, use a aba CLI / config.

        > "Já defini meu token do bot do Discord na configuração. Conclua a configuração do Discord com User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se preferir configuração baseada em arquivo, defina:

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

        Fallback de env para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Para configuração com script ou remota, grave o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e depois execute novamente sem `--dry-run`. Valores `token` em texto claro são aceitos. Valores SecretRef também são aceitos para `channels.discord.token` entre provedores env/file/exec. Veja [Gerenciamento de Segredos](/pt-BR/gateway/secrets).

        Para vários bots do Discord, mantenha cada token de bot e ID da aplicação sob sua conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas, portanto defina-o ali apenas quando todas as contas devem usar o mesmo ID de aplicação.

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

  <Step title="Aprove o primeiro pareamento por DM">
    Aguarde até que o Gateway esteja em execução e então envie uma DM para seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Envie o código de pareamento ao seu agente no canal existente:

        > "Aprove este código de pareamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Códigos de pareamento expiram após 1 hora.

    Agora você deve conseguir conversar com seu agente no Discord via DM.

  </Step>
</Steps>

<Note>
A resolução de token leva a conta em consideração. Valores de token na configuração vencem o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Se duas contas Discord habilitadas resolverem para o mesmo token de bot, o OpenClaw inicia apenas um monitor de Gateway para esse token. Um token vindo da configuração vence o fallback de env padrão; caso contrário, a primeira conta habilitada vence e a conta duplicada é reportada como desabilitada.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações de envio e leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política/repetição da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configure um workspace de guilda

Depois que as DMs estiverem funcionando, você pode configurar seu servidor Discord como um workspace completo, em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde é só você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à allowlist de guildas">
    Isso permite que seu agente responda em qualquer canal do seu servidor, não apenas DMs.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à allowlist de guildas"
      </Tab>
      <Tab title="Config">

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
    Por padrão, seu agente só responde em canais de guilda quando @mencionado. Para um servidor privado, você provavelmente quer que ele responda a todas as mensagens.

    Em canais de guilda, respostas normais são postadas automaticamente por padrão. Para salas compartilhadas sempre ativas, opte por `messages.groupChat.visibleReplies: "message_tool"` para que o agente possa ficar à espreita e postar apenas quando decidir que uma resposta no canal é útil. Isso funciona melhor com modelos de última geração e confiáveis com ferramentas, como GPT 5.5. Eventos ambientes de sala permanecem silenciosos, a menos que a ferramenta envie. Veja [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events) para a configuração completa do modo de espera.

    Se o Discord mostrar digitação e os logs mostrarem uso de tokens, mas nenhuma mensagem postada, verifique se o turno foi configurado como evento ambiente de sala ou optou por respostas visíveis com ferramenta de mensagem.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` na configuração da sua guilda:

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

        Para exigir envios por ferramenta de mensagem para respostas visíveis de grupo/canal, defina `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje memória em canais de guilda">
    Por padrão, a memória de longo prazo (MEMORY.md) só é carregada em sessões de DM. Canais de guilda não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisar de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (elas são injetadas em todas as sessões). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor Discord e comece a conversar. Seu agente pode ver o nome do canal, e cada canal recebe sua própria sessão isolada — então você pode configurar `#coding`, `#home`, `#research` ou o que se encaixar no seu fluxo de trabalho.

## Modelo de runtime

- O Gateway é responsável pela conexão com Discord.
- O roteamento de respostas é determinístico: respostas recebidas pelo Discord voltam para o Discord.
- Metadados de guild/canal do Discord são adicionados ao prompt do modelo como contexto não confiável, não como prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope de volta, o OpenClaw remove os metadados copiados das respostas enviadas e do contexto de reprodução futuro.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guild usam chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), ainda carregando `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de cron/heartbeat apenas em texto para o Discord usa a resposta final visível ao assistente uma vez. Payloads de mídia e componentes estruturados permanecem com várias mensagens quando o agente emite múltiplos payloads entregáveis.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas publicações em threads. O OpenClaw oferece suporte a duas formas de criá-las:

- Envie uma mensagem para o fórum pai (`channel:<forumId>`) para criar uma thread automaticamente. O título da thread usa a primeira linha não vazia da sua mensagem.
- Use `openclaw message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar para o fórum pai para criar uma thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemplo: criar uma thread de fórum explicitamente

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Fóruns pai não aceitam componentes do Discord. Se você precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens de agentes. Use a ferramenta de mensagens com um payload `components`. Os resultados de interação são roteados de volta para o agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Callbacks de componentes expiram após 30 minutos por padrão. Defina `channels.discord.agentComponents.ttlMs` para alterar essa duração do registro de callbacks para a conta padrão do Discord, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para substituir uma conta em uma configuração com várias contas. O valor é em milissegundos, deve ser um inteiro positivo e é limitado a `86400000` (24 horas). TTLs mais longos são úteis para fluxos de trabalho de revisão ou aprovação que precisam que botões continuem utilizáveis, mas também estendem a janela em que uma mensagem antiga do Discord ainda pode acionar uma ação. Prefira o TTL mais curto que se ajuste ao fluxo de trabalho e mantenha o padrão quando callbacks obsoletos seriam surpreendentes.

Os comandos slash `/model` e `/models` abrem um seletor interativo de modelo com menus suspensos de provedor, modelo e runtime compatível, além de uma etapa Enviar. `/models add` está obsoleto e agora retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e apenas o usuário que o invocou pode usá-la. Menus de seleção do Discord são limitados a 25 opções, então adicione entradas `provider/*` a `agents.defaults.models` quando quiser que o seletor mostre modelos descobertos dinamicamente apenas para provedores selecionados, como `openai` ou `vllm`.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome do upload quando ele precisar corresponder à referência de anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona um botão acionador automaticamente

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` controla o acesso por DM. `channels.discord.allowFrom` é a lista de permissões canônica de DM.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos são bloqueados (ou solicitados a fazer pareamento no modo `pairing`).

    Precedência em várias contas:

    - `channels.discord.accounts.default.allowFrom` aplica-se apenas à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o `dm.allowFrom` legado.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seus próprios `allowFrom` e `dm.allowFrom` legado não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` legados ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos simples normalmente são resolvidos como IDs de canal quando um padrão de canal está ativo, mas IDs listados no `allowFrom` efetivo de DM da conta são tratados como destinos de DM de usuário por compatibilidade.

  </Tab>

  <Tab title="Access groups">
    DMs do Discord e autorização de comandos de texto podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

    Nomes de grupos de acesso são compartilhados entre canais de mensagem. Use `type: "message.senders"` para um grupo estático cujos membros são expressos na sintaxe normal de `allowFrom` de cada canal, ou `type: "discord.channelAudience"` quando a audiência atual de `ViewChannel` de um canal do Discord deve definir a associação dinamicamente. O comportamento compartilhado de grupos de acesso está documentado aqui: [Grupos de acesso](/pt-BR/channels/access-groups).

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

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação assim: o remetente da DM é membro da guild configurada e atualmente tem permissão efetiva de `ViewChannel` no canal configurado depois que sobrescritas de função e canal são aplicadas.

    Exemplo: permitir que qualquer pessoa que consiga ver `#maintainers` envie DM para o bot, mantendo DMs fechadas para todos os outros.

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

    Você pode misturar entradas dinâmicas e estáticas:

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

    Consultas falham fechadas. Se o Discord retornar `Missing Access`, a consulta de membro falhar ou o canal pertencer a uma guild diferente, o remetente da DM será tratado como não autorizado.

    Ative a **Server Members Intent** do Portal de Desenvolvedores do Discord para o bot ao usar grupos de acesso baseados em audiência de canal. DMs não incluem estado de membro da guild, então o OpenClaw resolve o membro via REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Guild policy">
    O tratamento de guild é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - a guild deve corresponder a `channels.discord.guilds` (`id` preferido, slug aceito)
    - listas de permissão opcionais de remetente: `users` (IDs estáveis recomendados) e `roles` (somente IDs de função); se qualquer uma estiver configurada, remetentes são permitidos quando correspondem a `users` OU `roles`
    - correspondência direta de nome/tag é desativada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade emergencial
    - nomes/tags são compatíveis com `users`, mas IDs são mais seguros; `openclaw security audit` avisa quando entradas de nome/tag são usadas
    - se uma guild tiver `channels` configurado, canais não listados são negados
    - se uma guild não tiver bloco `channels`, todos os canais nessa guild permitida são permitidos

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback de runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo que `channels.defaults.groupPolicy` seja `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Mensagens de guild exigem menção por padrão.

    A detecção de menção inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos compatíveis

    Ao escrever mensagens enviadas pelo Discord, use a sintaxe de menção canônica: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para funções. Não use a forma de menção de apelido legada `<@!USER_ID>`.

    `requireMention` é configurado por guild/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - lista de permissões opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de servidores Discord para agentes diferentes por ID de cargo. Vínculos baseados em cargo aceitam apenas IDs de cargo e são avaliados depois de vínculos de peer ou parent-peer e antes de vínculos somente de servidor. Se um vínculo também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

- `commands.native` usa `"auto"` por padrão e é habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza de comandos de barra do Discord durante a inicialização. Comandos registrados anteriormente podem permanecer visíveis no Discord até você removê-los do app Discord.
- A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o processamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na UI do Discord para usuários que não estão autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Comandos de barra](/pt-BR/tools/slash-commands) para ver o catálogo e o comportamento dos comandos.

Configurações padrão de comandos de barra:

- `ephemeral: true`

## Detalhes do recurso

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    O Discord oferece suporte a tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`
    - `batched`

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem Discord de saída do turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    evento de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para chats ambíguos em rajadas, não para cada
    turno de mensagem única.

    IDs de mensagem são expostos no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Link previews">
    O Discord gera embeds avançados de links para URLs por padrão. O OpenClaw suprime esses embeds gerados em mensagens Discord de saída por padrão, para que URLs enviadas pelo agente permaneçam como links simples, a menos que você opte por ativá-los:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Defina `channels.discord.accounts.<id>.suppressEmbeds` para substituir uma conta. Envios pela ferramenta de mensagens do agente também podem passar `suppressEmbeds: false` para uma única mensagem. Payloads explícitos `embeds` do Discord não são suprimidos pela configuração padrão de pré-visualização de links.

  </Accordion>

  <Accordion title="Live stream preview">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming` aceita `off` | `partial` | `block` | `progress` (padrão). `progress` mantém um rascunho de status editável e o atualiza com o progresso de ferramentas até a entrega final; o rótulo inicial compartilhado é uma linha rotativa, então ele rola para fora como o restante quando trabalho suficiente aparece. `streamMode` é um alias legado de runtime. Execute `openclaw doctor --fix` para reescrever a configuração persistida para a chave canônica.

    Defina `channels.discord.streaming.mode` como `off` para desabilitar edições de pré-visualização do Discord. Se a transmissão em blocos do Discord estiver explicitamente habilitada, o OpenClaw ignora a transmissão de pré-visualização para evitar transmissão dupla.

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

    - `partial` edita uma única mensagem de pré-visualização conforme tokens chegam.
    - `block` emite partes do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitado a `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de pré-visualização pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de pré-visualização.
    - Linhas de ferramenta/progresso são renderizadas como emoji compacto + título + detalhe quando disponíveis, por exemplo `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (padrão `false`) opta por incluir texto de comentário/preâmbulo do assistente no rascunho temporário de progresso. O comentário é limpo antes da exibição, permanece transitório e não altera a entrega da resposta final.
    - `streaming.progress.maxLineChars` controla o orçamento por linha da pré-visualização de progresso. A prosa é encurtada em limites de palavras; detalhes de comando e caminho mantêm sufixos úteis.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla detalhes de comando/exec em linhas compactas de progresso: `raw` (padrão) ou `status` (apenas rótulo da ferramenta).

    Oculte texto bruto de comando/exec mantendo linhas compactas de progresso:

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

    A transmissão de pré-visualização é somente texto; respostas com mídia voltam para a entrega normal. Quando a transmissão `block` está explicitamente habilitada, o OpenClaw ignora a transmissão de pré-visualização para evitar transmissão dupla.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexto de histórico do servidor:

    - padrão de `channels.discord.historyLimit` `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de threads:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, a menos que substituída.
    - Sessões de thread herdam a seleção `/model` em nível de sessão do canal pai como fallback somente de modelo; seleções `/model` locais da thread ainda têm precedência, e o histórico de transcrição do pai não é copiado, a menos que a herança de transcrição esteja habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) opta por iniciar novas auto-threads com base na transcrição do pai. Substituições por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagens podem resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação na etapa de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Listas de permissões controlam quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    O Discord pode vincular uma thread a um destino de sessão para que mensagens de acompanhamento nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` vincula o tópico atual/novo a um destino de subagente/sessão
    - `/unfocus` remove a vinculação do tópico atual
    - `/agents` mostra execuções ativas e o estado de vinculação
    - `/session idle <duration|off>` inspeciona/atualiza a remoção automática de foco por inatividade para vinculações focadas
    - `/session max-age <duration|off>` inspeciona/atualiza a idade máxima rígida para vinculações focadas

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

    - `session.threadBindings.*` define padrões globais.
    - `channels.discord.threadBindings.*` substitui o comportamento do Discord.
    - `spawnSessions` controla a criação/vinculação automática de tópicos para `sessions_spawn({ thread: true })` e criações de tópicos ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo de subagente para criações vinculadas a tópicos. Padrão: `"fork"`.
    - As chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se as vinculações de tópicos estiverem desativadas para uma conta, `/focus` e operações relacionadas de vinculação de tópicos ficam indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Para workspaces ACP estáveis e "sempre ativos", configure vinculações ACP tipadas de nível superior direcionadas a conversas do Discord.

    Caminho de configuração:

    - `bindings[]` com `type: "acp"` e `match.channel: "discord"`

    Exemplo:

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

    - `/acp spawn codex --bind here` vincula o canal ou tópico atual no lugar e mantém mensagens futuras na mesma sessão ACP. Mensagens de tópicos herdam a vinculação do canal pai.
    - Em um canal ou tópico vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no lugar. Vinculações temporárias de tópicos podem substituir a resolução de destino enquanto estiverem ativas.
    - `spawnSessions` controla a criação/vinculação de tópicos filhos via `--thread auto|here`.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes do comportamento de vinculação.

  </Accordion>

  <Accordion title="Reaction notifications">
    Modo de notificação de reações por servidor:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos do sistema e anexados à sessão Discord roteada.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desativar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Config writes">
    Gravações de configuração iniciadas pelo canal são ativadas por padrão.

    Isso afeta fluxos `/config set|unset` (quando recursos de comando estão ativados).

    Desativar:

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

  <Accordion title="Gateway proxy">
    Roteie o tráfego WebSocket do Gateway do Discord e consultas REST de inicialização (ID do aplicativo + resolução de lista de permissões) por meio de um proxy HTTP(S) com `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
    Ative a resolução PluralKit para mapear mensagens intermediadas para a identidade de membro do sistema:

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

    - allowlists podem usar `pk:<memberId>`
    - nomes de exibição dos membros são correspondidos por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - as consultas usam o ID da mensagem original e são limitadas por janela de tempo
    - se a consulta falhar, mensagens encaminhadas por proxy serão tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Aliases de menção de saída">
    Use `mentionAliases` quando agentes precisarem de menções de saída determinísticas para usuários conhecidos do Discord. As chaves são handles sem o `@` inicial; os valores são IDs de usuário do Discord. Handles desconhecidos, `@everyone`, `@here` e menções dentro de code spans Markdown permanecem inalterados.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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
    Atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando habilita presença automática.

    Exemplo somente de status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemplo de atividade (status personalizado é o tipo de atividade padrão):

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

    Exemplo de streaming:

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
    - 1: Transmitindo (requer `activityUrl`)
    - 2: Ouvindo
    - 3: Assistindo
    - 4: Personalizado (usa o texto da atividade como o estado do status; emoji é opcional)
    - 5: Competindo

    Exemplo de presença automática (sinal de integridade do runtime):

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

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: íntegro => online, degradado ou desconhecido => ausente, esgotado ou indisponível => não perturbe. Sobrescritas opcionais de texto:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (oferece suporte ao placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte ao tratamento de aprovações baseado em botões em DMs e pode, opcionalmente, publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord habilita automaticamente aprovações exec nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja a partir de `execApprovals.approvers` ou de `commands.ownerAllowFrom`. O Discord não infere aprovadores exec a partir de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente de aprovação nativo.

    Para comandos de grupo sensíveis e restritos ao proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia prompts de aprovação e resultados finais de forma privada. Ele tenta primeiro a DM do Discord quando o proprietário que invocou tem uma rota de proprietário do Discord; se isso não estiver disponível, recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como Telegram.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Somente aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Prompts de aprovação incluem o texto do comando, portanto habilite a entrega em canal somente em canais confiáveis. Se o ID do canal não puder ser derivado da chave de sessão, o OpenClaw recorre à entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DM para aprovadores e fanout para canais.
    Quando esses botões estão presentes, eles são a UX de aprovação principal; o OpenClaw
    deve incluir um comando manual `/approve` somente quando o resultado da ferramenta disser
    que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.
    Se o runtime de aprovação nativo do Discord não estiver ativo, o OpenClaw mantém o
    prompt determinístico local `/approve <id> <decision>` visível. Se o
    runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino,
    o OpenClaw envia um aviso de fallback no mesmo chat com o comando `/approve`
    exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovações seguem o contrato compartilhado do cliente do Gateway (IDs `plugin:` são resolvidos por meio de `plugin.approval.resolve`; outros IDs por meio de `exec.approval.resolve`). Aprovações expiram após 30 minutos por padrão.

    Consulte [Aprovações exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e gates de ação

Ações de mensagem do Discord incluem mensagens, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

Gates de ação ficam em `channels.discord.actions.*`.

Comportamento padrão dos gates:

| Grupo de ações                                                                                                                                                           | Padrão    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reações, mensagens, threads, pins, enquetes, busca, memberInfo, roleInfo, channelInfo, channels, voiceStatus, eventos, stickers, emojiUploads, stickerUploads, permissões | habilitado |
| roles                                                                                                                                                                    | desabilitado |
| moderação                                                                                                                                                                | desabilitado |
| presença                                                                                                                                                                 | desabilitado |

## UI de Components v2

O OpenClaw usa components v2 do Discord para aprovações exec e marcadores entre contextos. Ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer construir um payload de componente por meio da ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada por contêineres de componentes do Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla por quanto tempo callbacks de componentes do Discord enviados permanecem registrados (padrão `1800000`, máximo `86400000`). Defina por conta com `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` são ignorados quando components v2 estão presentes.
- Prévias de URL simples são suprimidas por padrão. Defina `suppressEmbeds: false` em uma ação de mensagem quando um único link de saída deve ser expandido.

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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato de prévia com forma de onda). O gateway oferece suporte a ambas.

### Canais de voz

Checklist de configuração:

1. Habilite Message Content Intent no Discord Developer Portal.
2. Habilite Server Members Intent quando allowlists de função/usuário forem usadas.
3. Convide o bot com os escopos `bot` e `applications.commands`.
4. Conceda Connect, Speak, Send Messages e Read Message History no canal de voz de destino.
5. Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Use `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de allowlist e política de grupo que outros comandos do Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Para inspecionar as permissões efetivas do bot antes de entrar, execute:

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
        model: "openai/gpt-5.5",
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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Observações:

- `voice.tts` substitui `messages.tts` apenas para reprodução de voz `stt-tts`. Modos realtime usam `voice.realtime.speakerVoice`.
- `voice.mode` controla o caminho da conversa. O padrão é `agent-proxy`: um front-end de voz realtime lida com o tempo dos turnos, interrupção e reprodução, delega o trabalho substantivo para o agente OpenClaw roteado por meio de `openclaw_agent_consult` e trata o resultado como um prompt digitado no Discord por aquele falante. `stt-tts` mantém o fluxo em lote mais antigo de STT mais TTS. `bidi` permite que o modelo realtime converse diretamente enquanto expõe `openclaw_agent_consult` para o cérebro do OpenClaw.
- `voice.agentSession` controla qual conversa do OpenClaw recebe turnos de voz. Deixe sem definir para a sessão própria do canal de voz, ou defina `{ mode: "target", target: "channel:<text-channel-id>" }` para fazer o canal de voz atuar como a extensão de microfone/alto-falante de uma sessão existente de canal de texto do Discord, como `#maintainers`.
- `voice.model` substitui o cérebro do agente OpenClaw para respostas de voz no Discord e consultas realtime. Deixe sem definir para herdar o modelo do agente roteado. Ele é separado de `voice.realtime.model`.
- `voice.followUsers` permite que o bot entre, mude e saia da voz do Discord com usuários selecionados. Consulte [Seguir usuários por voz](#follow-users-in-voice) para regras de comportamento e exemplos.
- `agent-proxy` roteia fala por `discord-voice`, que preserva a autorização normal de proprietário/ferramenta para o falante e a sessão de destino, mas oculta a ferramenta `tts` do agente porque a voz do Discord é dona da reprodução. Por padrão, `agent-proxy` dá à consulta acesso total a ferramentas equivalente ao proprietário para falantes proprietários (`voice.realtime.toolPolicy: "owner"`) e prefere fortemente consultar o agente OpenClaw antes de respostas substantivas (`voice.realtime.consultPolicy: "always"`). Nesse modo padrão `always`, a camada realtime não fala automaticamente preenchimento antes da resposta da consulta; ela captura e transcreve a fala e então fala a resposta roteada do OpenClaw. Se várias respostas de consultas forçadas terminarem enquanto o Discord ainda estiver reproduzindo a primeira resposta, respostas posteriores de fala exata serão enfileiradas até a reprodução ficar ociosa, em vez de substituir a fala no meio da frase.
- No modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Em modos realtime, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configuram a sessão de áudio realtime. Para OpenAI Realtime 2 mais o cérebro Codex, use `voice.realtime.model: "gpt-realtime-2"` e `voice.model: "openai/gpt-5.5"`.
- Modos de voz realtime incluem pequenos arquivos de perfil `IDENTITY.md`, `USER.md` e `SOUL.md` nas instruções do provedor realtime por padrão, para que turnos diretos rápidos mantenham a mesma identidade, fundamentação de usuário e persona que o agente OpenClaw roteado. Defina `voice.realtime.bootstrapContextFiles` para um subconjunto para personalizar isso, ou `[]` para desativá-lo. Os arquivos de bootstrap realtime compatíveis são limitados a esses arquivos de perfil; `AGENTS.md` permanece no contexto normal do agente. O contexto de perfil injetado não substitui `openclaw_agent_consult` para trabalho no workspace, fatos atuais, busca de memória ou ações apoiadas por ferramentas.
- No modo realtime `agent-proxy` da OpenAI, defina `voice.realtime.requireWakeName: true` para manter a voz realtime do Discord em silêncio até que uma transcrição comece ou termine com um nome de ativação. Nomes de ativação configurados devem ter uma ou duas palavras. Se `voice.realtime.wakeNames` não estiver definido, o OpenClaw usa o `name` do agente roteado mais `OpenClaw`, recorrendo ao id do agente mais `OpenClaw`. O controle por nome de ativação desativa a resposta automática do provedor realtime, roteia turnos aceitos pelo caminho de consulta do agente OpenClaw e dá um breve reconhecimento falado quando um nome de ativação inicial é reconhecido na transcrição parcial antes da chegada da transcrição final.
- O provedor realtime da OpenAI aceita nomes de eventos atuais do Realtime 2 e aliases legados compatíveis com Codex para eventos de áudio de saída e transcrição, de modo que snapshots compatíveis do provedor possam variar sem descartar áudio do assistente.
- `voice.realtime.bargeIn` controla se eventos de início de fala do Discord interrompem a reprodução realtime ativa. Se não definido, segue a configuração de interrupção de áudio de entrada do provedor realtime.
- `voice.realtime.minBargeInAudioEndMs` controla a duração mínima da reprodução do assistente antes que uma interrupção realtime da OpenAI trunque o áudio. Padrão: `250`. Defina `0` para interrupção imediata em salas com pouco eco, ou aumente para configurações de alto-falantes com muito eco.
- Para uma voz da OpenAI na reprodução do Discord, defina `voice.tts.provider: "openai"` e escolha uma voz Text-to-speech em `voice.tts.providers.openai.speakerVoice`. `cedar` é uma boa escolha com som masculino no modelo TTS atual da OpenAI.
- Substituições de `systemPrompt` por canal do Discord se aplicam a turnos de transcrição de voz desse canal de voz.
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` (ou `dm.allowFrom`) do Discord para comandos protegidos por proprietário e ações de canal. A visibilidade de ferramentas do agente segue a política de ferramentas configurada para a sessão roteada.
- Voz do Discord é opcional para configurações somente texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar comandos `/vc`, o runtime de voz e a intent `GuildVoiceStates` do Gateway.
- `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura da intent de estado de voz. Deixe sem definir para que a intent siga a habilitação efetiva de voz.
- Se `voice.autoJoin` tiver várias entradas para o mesmo guild, o OpenClaw entra no último canal configurado para esse guild.
- `voice.allowedChannels` é uma lista de permissões opcional de residência. Deixe sem definir para permitir `/vc join` em qualquer canal de voz autorizado do Discord. Quando definida, `/vc join`, entrada automática na inicialização e movimentações do estado de voz do bot ficam restritas às entradas `{ guildId, channelId }` listadas. Defina como um array vazio para negar todas as entradas em voz do Discord. Se o Discord mover o bot para fora da lista de permissões, o OpenClaw sai desse canal e volta a entrar no destino de entrada automática configurado quando um estiver disponível.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada do `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não definidos.
- O OpenClaw usa o codec `libopus-wasm` incluído para recebimento de voz do Discord e reprodução PCM bruta realtime. Ele inclui uma build WebAssembly fixada do libopus e não exige addons opus nativos.
- `voice.connectTimeoutMs` controla a espera inicial por Ready do `@discordjs/voice` para tentativas de `/vc join` e entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw espera uma sessão de voz desconectada começar a se reconectar antes de destruí-la. Padrão: `15000`.
- No modo `stt-tts`, a reprodução de voz não para só porque outro usuário começa a falar. Para evitar loops de feedback, o OpenClaw ignora nova captura de voz enquanto o TTS está tocando; fale após o término da reprodução para o próximo turno. Modos realtime encaminham inícios de fala como sinais de barge-in para o provedor realtime.
- Em modos realtime, o eco de alto-falantes em um microfone aberto pode parecer barge-in e interromper a reprodução. Para salas do Discord com muito eco, defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que a OpenAI interrompa automaticamente em áudio de entrada. Adicione `voice.realtime.bargeIn: true` se você ainda quiser que eventos de início de fala do Discord interrompam a reprodução ativa. A ponte realtime da OpenAI ignora truncamentos de reprodução menores que `voice.realtime.minBargeInAudioEndMs` como provável eco/ruído e os registra como ignorados em vez de limpar a reprodução do Discord.
- `voice.captureSilenceGraceMs` controla por quanto tempo o OpenClaw espera depois que o Discord informa que um falante parou antes de finalizar esse segmento de áudio para STT. Padrão: `2000`; aumente isso se o Discord dividir pausas normais em transcrições parciais instáveis.
- Quando ElevenLabs é o provedor TTS selecionado, a reprodução de voz do Discord usa TTS por streaming e começa a partir do stream de resposta do provedor. Provedores sem suporte a streaming recorrem ao caminho de arquivo temporário sintetizado.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e reentrando no canal de voz após falhas repetidas em uma janela curta.
- Se logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após a atualização, colete um relatório de dependências e logs. A linha `@discordjs/voice` incluída contém a correção upstream de padding do PR #11449 do discord.js, que fechou a issue #11419 do discord.js.
- Eventos de recebimento `The operation was aborted` são esperados quando o OpenClaw finaliza um segmento capturado de falante; são diagnósticos verbosos, não avisos.
- Logs verbosos de voz do Discord incluem uma prévia limitada de uma linha da transcrição STT para cada segmento de falante aceito, de modo que a depuração mostre tanto o lado do usuário quanto o lado da resposta do agente sem despejar texto de transcrição ilimitado.
- No modo `agent-proxy`, o fallback de consulta forçada ignora fragmentos de transcrição provavelmente incompletos, como texto terminado em `...` ou um conector final como `and`, além de encerramentos obviamente não acionáveis como “já volto” ou “tchau”. Os logs mostram `forced agent consult skipped reason=...` quando isso evita uma resposta enfileirada obsoleta.

### Seguir usuários por voz

Use `voice.followUsers` quando quiser que o bot de voz do Discord fique com um ou mais usuários conhecidos do Discord em vez de entrar em um canal fixo na inicialização ou aguardar `/vc join`.

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

- `followUsers` aceita IDs brutos de usuários do Discord e valores `discord:<id>`. O OpenClaw normaliza ambas as formas antes de corresponder eventos de estado de voz.
- `followUsersEnabled` assume `true` como padrão quando `followUsers` está configurado. Defina como `false` para manter a lista salva, mas parar o acompanhamento automático de voz.
- Quando um usuário seguido entra em um canal de voz permitido, o OpenClaw entra nesse canal. Quando o usuário muda, o OpenClaw muda com ele. Quando o usuário seguido ativo desconecta, o OpenClaw sai.
- Se vários usuários seguidos estiverem no mesmo guild e o usuário seguido ativo sair, o OpenClaw muda para o canal de outro usuário seguido rastreado antes de sair do guild. Se vários usuários seguidos se moverem ao mesmo tempo, vence o evento de estado de voz observado mais recente.
- `allowedChannels` ainda se aplica. Um usuário seguido em um canal não permitido é ignorado, e uma sessão controlada por acompanhamento muda para outro usuário seguido ou sai.
- O OpenClaw reconcilia eventos de estado de voz perdidos na inicialização e em um intervalo limitado. A reconciliação amostra guilds configurados e limita consultas REST por execução, então listas `followUsers` muito grandes podem levar mais de um intervalo para convergir.
- Se o Discord ou um administrador mover o bot enquanto ele estiver seguindo um usuário, o OpenClaw reconstrói a sessão de voz e preserva a propriedade de acompanhamento quando o destino é permitido. Se o bot for movido para fora de `allowedChannels`, o OpenClaw sai e volta a entrar no destino configurado quando houver um.
- A recuperação de recebimento DAVE pode sair e reentrar no mesmo canal após falhas repetidas de descriptografia. Sessões controladas por acompanhamento mantêm sua propriedade de acompanhamento por esse caminho de recuperação, então uma desconexão posterior de usuário seguido ainda sai do canal.

Escolha entre os modos de entrada:

- Use `followUsers` para configurações pessoais ou de operador em que o bot deve estar automaticamente em voz quando você estiver.
- Use `autoJoin` para bots de sala fixa que devem estar presentes mesmo quando nenhum usuário rastreado estiver em voz.
- Use `/vc join` para entradas únicas ou salas em que presença automática em voz seria surpreendente.

Codec de voz do Discord:

- Os logs de recebimento de voz mostram `discord voice: opus decoder: libopus-wasm`.
- A reprodução em tempo real codifica PCM estéreo bruto de 48 kHz para Opus com o mesmo pacote `libopus-wasm` incluído antes de entregar os pacotes a `@discordjs/voice`.
- A reprodução de arquivos e fluxos de provedor transcodifica para PCM estéreo bruto de 48 kHz com ffmpeg e, em seguida, usa `libopus-wasm` para o fluxo de pacotes Opus enviado ao Discord.

Pipeline de STT mais TTS:

- A captura PCM do Discord é convertida para um arquivo temporário WAV.
- `tools.media.audio` lida com STT, por exemplo `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pela entrada e pelo roteamento do Discord enquanto o LLM de resposta é executado com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita texto retornado, porque a voz do Discord é proprietária da reprodução TTS final.
- `voice.model`, quando definido, substitui apenas o LLM de resposta para este turno do canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; provedores com suporte a streaming alimentam o player diretamente, caso contrário o arquivo de áudio resultante é reproduzido no canal ingressado.

Exemplo de sessão de canal de voz padrão com proxy de agente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Sem um bloco `voice.agentSession`, cada canal de voz recebe sua própria sessão roteada do OpenClaw. Por exemplo, `/vc join channel:234567890123456789` fala com a sessão desse canal de voz do Discord. O modelo em tempo real é apenas a interface de voz; solicitações substantivas são entregues ao agente OpenClaw configurado. Se o modelo em tempo real produzir uma transcrição final sem chamar a ferramenta de consulta, o OpenClaw força a consulta como fallback para que o padrão ainda se comporte como uma conversa com o agente.

Exemplo legado de STT mais TTS:

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

Exemplo bidi em tempo real:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voz como extensão de uma sessão de canal do Discord existente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

No modo `agent-proxy`, o bot entra no canal de voz configurado, mas os turnos do agente OpenClaw usam a sessão roteada normal e o agente do canal de destino. A sessão de voz em tempo real fala o resultado retornado de volta no canal de voz. O agente supervisor ainda pode usar ferramentas normais de mensagem de acordo com sua política de ferramentas, incluindo enviar uma mensagem separada no Discord se essa for a ação correta.

Enquanto uma execução delegada do OpenClaw está ativa, novas transcrições de voz do Discord são tratadas como controle de execução ao vivo antes de iniciar outro turno do agente. Frases como "status", "cancel that", "use the smaller fix" ou "when you're done also check tests" são classificadas como status, cancelamento, direcionamento ou entrada de acompanhamento para a sessão ativa. Resultados de status, cancelamento, direcionamento aceito e acompanhamento são falados de volta no canal de voz para que o chamador saiba se o OpenClaw lidou com a solicitação.

Formas úteis de destino:

- `target: "channel:123456789012345678"` roteia por uma sessão de canal de texto do Discord.
- `target: "123456789012345678"` é tratado como um destino de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` roteia por essa sessão de mensagem direta.

Exemplo de OpenAI Realtime com muito eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

Use isso quando o modelo ouve a própria reprodução do Discord por um microfone aberto, mas você ainda quer interrompê-lo falando. O OpenClaw impede que a OpenAI interrompa automaticamente em áudio de entrada bruto, enquanto `bargeIn: true` permite que eventos de início de fala no Discord e áudio de falante já ativo cancelem respostas em tempo real ativas antes que o próximo turno capturado chegue à OpenAI. Sinais de interrupção muito iniciais com `audioEndMs` abaixo de `minBargeInAudioEndMs` são tratados como provável eco/ruído e ignorados para que o modelo não seja interrompido no primeiro quadro de reprodução.

Logs de voz esperados:

- Ao entrar: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Ao iniciar em tempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Em áudio de falante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Em fala obsoleta ignorada: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- Na conclusão de resposta em tempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Ao parar/redefinir a reprodução: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Em consulta em tempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Na resposta do agente: `discord voice: agent turn answer ...`
- Em fala exata enfileirada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido por `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Na detecção de interrupção: `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido por `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Na interrupção em tempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido por `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ou `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Em eco/ruído ignorado: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Em interrupção desativada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Em reprodução ociosa: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar áudio interrompido, leia os logs de voz em tempo real como uma linha do tempo:

1. `realtime audio playback started` significa que o Discord começou a reproduzir áudio do assistente. A ponte começa a contar chunks de saída do assistente, bytes PCM do Discord, bytes em tempo real do provedor e duração de áudio sintetizado a partir deste ponto.
2. `realtime speaker turn opened` marca um falante do Discord ficando ativo. Se a reprodução já estiver ativa e `bargeIn` estiver habilitado, isso pode ser seguido por `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca o primeiro quadro de áudio real recebido para esse turno de falante. `outputActive=true` ou um `outputAudioMs` diferente de zero aqui significa que o microfone está enviando entrada enquanto a reprodução do assistente ainda está ativa.
4. `barge-in detected source=active-speaker-audio` significa que o OpenClaw viu áudio de falante ao vivo enquanto a reprodução do assistente estava ativa. Isso é útil para distinguir uma interrupção real de um evento de início de fala do Discord sem áudio útil.
5. `barge-in requested reason=...` significa que o OpenClaw pediu ao provedor em tempo real para cancelar ou truncar a resposta ativa. Ele inclui `outputAudioMs`, `outputActive` e `playbackChunks` para que você possa ver quanto áudio do assistente tinha realmente sido reproduzido antes da interrupção.
6. `realtime audio playback stopped reason=...` é o ponto local de redefinição da reprodução do Discord. O motivo informa quem parou a reprodução: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` resume o turno de entrada capturado. `chunks=0` ou `hasAudio=false` significa que o turno de falante foi aberto, mas nenhum áudio utilizável chegou à ponte em tempo real. `interruptedPlayback=true` significa que esse turno de entrada se sobrepôs à saída do assistente e acionou a lógica de interrupção.

Campos úteis:

- `outputAudioMs`: duração do áudio do assistente gerada pelo provedor em tempo real antes da linha de log.
- `audioMs`: duração do áudio do assistente que o OpenClaw contou antes de a reprodução parar.
- `elapsedMs`: tempo decorrido de relógio entre abrir e fechar o fluxo de reprodução ou o turno de falante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados para ou recebidos da voz do Discord.
- `realtimeBytes`: bytes PCM no formato do provedor enviados para ou recebidos do provedor em tempo real.
- `playbackChunks`: chunks de áudio do assistente encaminhados ao Discord para a resposta ativa.
- `sinceLastAudioMs`: intervalo entre o último quadro de áudio de falante capturado e o fechamento do turno de falante.

Padrões comuns:

- Interrupção imediata com `source=active-speaker-audio`, `outputAudioMs` pequeno e o mesmo usuário por perto geralmente aponta para eco do alto-falante entrando no microfone. Aumente `voice.realtime.minBargeInAudioEndMs`, reduza o volume do alto-falante, use fones de ouvido ou defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido por `speaker turn closed ... hasAudio=false` significa que o Discord relatou um início de fala, mas nenhum áudio chegou ao OpenClaw. Isso pode ser um evento transitório de voz do Discord, comportamento de gate de ruído ou um cliente ativando brevemente o microfone.
- `audio playback stopped reason=stream-close` sem uma interrupção próxima ou `provider-clear-audio` significa que o fluxo local de reprodução do Discord terminou inesperadamente. Verifique os logs anteriores do provedor e do player do Discord.
- `capture ignored during playback (barge-in disabled)` significa que o OpenClaw descartou intencionalmente a entrada enquanto o áudio do assistente estava ativo. Habilite `voice.realtime.bargeIn` se quiser que a fala interrompa a reprodução.
- `barge-in ignored ... outputActive=false` significa que o VAD do Discord ou do provedor relatou fala, mas o OpenClaw não tinha reprodução ativa para interromper. Isso não deve cortar o áudio.

As credenciais são resolvidas por componente: autenticação da rota LLM para `voice.model`, autenticação STT para `tools.media.audio`, autenticação TTS para `messages.tts`/`voice.tts` e autenticação do provedor em tempo real para `voice.realtime.providers` ou a configuração normal de autenticação do provedor.

### Mensagens de voz

As mensagens de voz do Discord mostram uma prévia de forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita o conteúdo de texto (o Discord rejeita texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Usou intents não permitidas ou o bot não vê mensagens do servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent quando você depender da resolução de usuário/membro
    - reinicie o Gateway depois de alterar intents

  </Accordion>

  <Accordion title="Mensagens do servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a lista de permissões de servidores em `channels.discord.guilds`
    - se existir um mapa `channels` do servidor, somente os canais listados são permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention falso, mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem lista de permissões de servidor/canal correspondente
    - `requireMention` configurado no lugar errado (deve ficar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela lista de permissões `users` do servidor/canal

  </Accordion>

  <Accordion title="Turnos longos do Discord ou respostas duplicadas">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla apenas o trabalho do listener do Gateway do Discord, não a duração do turno do agente

    O Discord não aplica um timeout próprio do canal a turnos de agente enfileirados. Listeners de mensagem transferem o trabalho imediatamente, e execuções do Discord enfileiradas preservam a ordenação por sessão até que o ciclo de vida de sessão/ferramenta/runtime conclua ou aborte o trabalho.

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

  <Accordion title="Avisos de timeout na busca de metadados do Gateway">
    O OpenClaw busca metadados `/gateway/bot` do Discord antes de conectar. Falhas transitórias usam como fallback a URL padrão do Gateway do Discord e são limitadas por taxa nos logs.

    Controles de timeout de metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback de env quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicializações por timeout de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões de runtime. Configurações com várias contas e escalonamento de inicialização podem precisar de uma janela de READY de inicialização maior que a padrão.

    Controles de timeout de READY:

    - inicialização com conta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicialização com várias contas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback de env de inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão de inicialização: `15000` (15 segundos), máximo: `120000`
    - runtime com conta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime com várias contas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback de env de runtime quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão de runtime: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canal.

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas o probe não consegue verificar permissões completamente.

  </Accordion>

  <Accordion title="Problemas de DM e emparelhamento">

    - DM desabilitada: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de emparelhamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissões para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bots que mencionem o bot.

    O OpenClaw também inclui [proteção contra loop de bots](/pt-BR/channels/bot-loop-protection) compartilhada. Sempre que `allowBots` permite que mensagens criadas por bots cheguem ao dispatch, o Discord mapeia o evento de entrada para fatos de `(conta, canal, par de bots)`, e a proteção genérica de pares suprime o par depois que ele excede o orçamento de eventos configurado. A proteção evita loops descontrolados entre dois bots que antes precisavam ser interrompidos por limites de taxa do Discord; ela não afeta implantações com um único bot nem respostas pontuais de bots que permanecem abaixo do orçamento.

    Configurações padrão (ativas quando `allowBots` está definido):

    - `maxEventsPerWindow: 20` -- o par de bots pode trocar 20 mensagens dentro da janela deslizante
    - `windowSeconds: 60` -- duração da janela deslizante
    - `cooldownSeconds: 60` -- quando o orçamento é atingido, toda mensagem adicional de bot para bot em qualquer direção é descartada por um minuto

    Configure o padrão compartilhado uma vez em `channels.defaults.botLoopProtection` e então sobrescreva o Discord quando um fluxo de trabalho legítimo precisar de mais folga. A precedência é:

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
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
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

  <Accordion title="Quedas de STT de voz com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para que a lógica de recuperação de recebimento de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - observe os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reconexão automática, colete logs e compare com o histórico upstream de recebimento DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração - Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos de alto sinal do Discord">

- inicialização/autenticação: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/tentativa: `mediaMaxMb` (limita uploads de saída do Discord, padrão `100MB`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões mínimas necessárias no Discord.
- Se o deploy/estado de comandos estiver obsoleto, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionados

<CardGroup cols={2}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Discord ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chat em grupo e lista de permissões.
  </Card>
  <Card title="Roteamento de canal" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comando nativo.
  </Card>
</CardGroup>
