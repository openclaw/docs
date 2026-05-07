---
read_when:
    - Trabalhando em recursos de canais do Discord
summary: Status de suporte, recursos e configuração do bot do Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Pronto para mensagens diretas e canais de guilda via o Gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Mensagens diretas do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
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

  <Step title="Ative intents privilegiadas">
    Ainda na página **Bot**, role até **Privileged Gateway Intents** e ative:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para listas de permissões de funções e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copie o token do seu bot">
    Role de volta para cima na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Este é o seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gere uma URL de convite e adicione o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você gerará uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role até **OAuth2 URL Generator** e ative:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Ative pelo menos:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Este é o conjunto básico para canais de texto normais. Se você planeja postar em threads do Discord, incluindo fluxos de trabalho de canais de fórum ou mídia que criam ou continuam uma thread, também ative **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no seu navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor do Discord.

  </Step>

  <Step title="Ative o Modo de Desenvolvedor e colete seus IDs">
    De volta ao app do Discord, você precisa ativar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três ao OpenClaw na próxima etapa.

  </Step>

  <Step title="Permita mensagens diretas de membros do servidor">
    Para o pareamento funcionar, o Discord precisa permitir que seu bot envie mensagem direta para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem mensagens diretas para você. Mantenha isso ativado se quiser usar mensagens diretas do Discord com o OpenClaw. Se você planeja usar apenas canais de guilda, pode desativar mensagens diretas após o pareamento.

  </Step>

  <Step title="Defina o token do seu bot com segurança (não o envie no chat)">
    O token do seu bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagem ao seu agente.

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

    Se o OpenClaw já estiver em execução como serviço em segundo plano, reinicie-o pelo app do OpenClaw para Mac ou parando e reiniciando o processo `openclaw gateway run`.
    Para instalações de serviço gerenciado, execute `openclaw gateway install` em um shell onde `DISCORD_BOT_TOKEN` esteja presente, ou armazene a variável em `~/.openclaw/.env`, para que o serviço consiga resolver o SecretRef de env após a reinicialização.
    Se seu host estiver bloqueado ou com limite de taxa pela consulta de aplicação na inicialização do Discord, defina o ID da aplicação/cliente do Discord no Portal de Desenvolvedores para que a inicialização possa ignorar essa chamada REST. Use `channels.discord.applicationId` para a conta padrão, ou `channels.discord.accounts.<accountId>.applicationId` quando você executa vários bots do Discord.

  </Step>

  <Step title="Configure o OpenClaw e faça o pareamento">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga a ele. Se o Discord for seu primeiro canal, use a aba CLI / configuração em vez disso.

        > "Já defini o token do meu bot do Discord na configuração. Finalize a configuração do Discord com User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuração">
        Se você prefere configuração baseada em arquivo, defina:

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

        Para configuração remota ou com scripts, grave o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e depois execute novamente sem `--dry-run`. Valores `token` em texto puro são compatíveis. Valores SecretRef também são compatíveis para `channels.discord.token` entre provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

        Para vários bots do Discord, mantenha cada token de bot e ID de aplicação sob sua conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas, então defina-o ali apenas quando todas as contas devem usar o mesmo ID de aplicação.

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

  <Step title="Aprove o pareamento da primeira mensagem direta">
    Aguarde até o Gateway estar em execução e, em seguida, envie uma mensagem direta ao seu bot no Discord. Ele responderá com um código de pareamento.

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

    Agora você deve conseguir conversar com seu agente no Discord via mensagem direta.

  </Step>
</Steps>

<Note>
A resolução de token é ciente da conta. Valores de token na configuração têm precedência sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Se duas contas do Discord ativadas resolverem para o mesmo token de bot, o OpenClaw inicia apenas um monitor de Gateway para esse token. Um token vindo da configuração tem precedência sobre o fallback de env padrão; caso contrário, a primeira conta ativada vence e a conta duplicada é relatada como desativada.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado para essa chamada. Isso se aplica a ações de envio e de leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política/repetição da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configure um workspace de guilda

Depois que as mensagens diretas estiverem funcionando, você pode configurar seu servidor do Discord como um workspace completo, onde cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde há apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à lista de permissões de guilda">
    Isso permite que seu agente responda em qualquer canal do seu servidor, não apenas em mensagens diretas.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à lista de permissões de guilda"
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

  <Step title="Permita respostas sem @mention">
    Por padrão, seu agente só responde em canais de guilda quando recebe @mention. Para um servidor privado, você provavelmente quer que ele responda a todas as mensagens.

    Em canais de guilda, respostas finais normais do assistente permanecem privadas por padrão. A saída visível no Discord deve ser enviada explicitamente com a ferramenta `message`, para que o agente possa observar por padrão e só postar quando decidir que uma resposta no canal é útil.

    Isso significa que o modelo selecionado deve chamar ferramentas de forma confiável. Se o Discord mostrar digitação e os logs mostrarem uso de tokens, mas nenhuma mensagem postada, verifique o log da sessão em busca de texto do assistente com `didSendViaMessagingTool: false`. Isso significa que o modelo produziu uma resposta final privada em vez de chamar `message(action=send)`. Troque para um modelo mais forte em chamada de ferramentas ou use a configuração abaixo para restaurar respostas finais automáticas legadas.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar receber @mention"
      </Tab>
      <Tab title="Configuração">
        Defina `requireMention: false` na sua configuração de guilda:

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

        Para restaurar respostas finais automáticas legadas em salas de grupo/canal, defina `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje a memória em canais de guilda">
    Por padrão, a memória de longo prazo (MEMORY.md) só é carregada em sessões de mensagem direta. Canais de guilda não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se você precisar de contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisa de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (elas são injetadas em todas as sessões). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor do Discord e comece a conversar. Seu agente consegue ver o nome do canal, e cada canal recebe sua própria sessão isolada — assim você pode configurar `#coding`, `#home`, `#research` ou o que combinar com seu fluxo de trabalho.

## Modelo de runtime

- O Gateway é dono da conexão com o Discord.
- O roteamento de respostas é determinístico: respostas recebidas pelo Discord voltam para o Discord.
- Os metadados de guilda/canal do Discord são adicionados ao prompt do modelo como contexto não confiável, não como um prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope de volta, o OpenClaw remove os metadados copiados das respostas enviadas e do contexto de reprodução futuro.
- Por padrão (`session.dmScope=main`), chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guilda são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos de barra nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de cron/heartbeat somente texto para o Discord usa a resposta final visível ao assistente uma vez. Payloads de mídia e componentes estruturados permanecem com múltiplas mensagens quando o agente emite vários payloads entregáveis.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas posts em threads. O OpenClaw oferece suporte a duas formas de criá-los:

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

Fóruns pais não aceitam componentes do Discord. Se precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens de agentes. Use a ferramenta de mensagens com um payload `components`. Os resultados de interação são roteados de volta para o agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos de barra `/model` e `/models` abrem um seletor de modelo interativo com menus suspensos de provedor, modelo e runtime compatível, além de uma etapa Enviar. `/models add` está obsoleto e agora retorna uma mensagem de obsolescência em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e somente o usuário que a invocou pode usá-la.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome de upload quando ele deve corresponder à referência do anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona um botão de acionamento automaticamente

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
    - `open` (requer que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de DM não for aberta, usuários desconhecidos são bloqueados (ou recebem uma solicitação de pareamento no modo `pairing`).

    Precedência de várias contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o `dm.allowFrom` legado.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` e o `dm.allowFrom` legado não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` legados ainda são lidos por compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando isso pode ser feito sem alterar o acesso.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos sem prefixo normalmente são resolvidos como IDs de canal quando um padrão de canal está ativo, mas IDs listados no `allowFrom` efetivo de DM da conta são tratados como destinos de DM de usuário por compatibilidade.

  </Tab>

  <Tab title="DM access groups">
    DMs do Discord podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

    Nomes de grupos de acesso são compartilhados entre canais de mensagem. Use `type: "message.senders"` para um grupo estático cujos membros são expressos na sintaxe normal de `allowFrom` de cada canal, ou `type: "discord.channelAudience"` quando o público atual com `ViewChannel` de um canal do Discord deve definir a associação dinamicamente. O comportamento compartilhado de grupos de acesso está documentado aqui: [Grupos de acesso](/pt-BR/channels/access-groups).

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

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação assim: o remetente da DM é membro da guilda configurada e atualmente tem permissão efetiva `ViewChannel` no canal configurado depois que sobrescritas de função e canal são aplicadas.

    Exemplo: permitir que qualquer pessoa que possa ver `#maintainers` envie DM para o bot, mantendo DMs fechadas para todos os demais.

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

    Consultas falham fechadas. Se o Discord retornar `Missing Access`, a consulta de membro falhar ou o canal pertencer a uma guilda diferente, o remetente da DM será tratado como não autorizado.

    Ative o **Server Members Intent** no Discord Developer Portal para o bot ao usar grupos de acesso baseados em público de canal. DMs não incluem estado de membro da guilda, então o OpenClaw resolve o membro por meio da API REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Guild policy">
    O tratamento de guildas é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - a guilda deve corresponder a `channels.discord.guilds` (`id` preferido, slug aceito)
    - listas de permissões opcionais de remetentes: `users` (IDs estáveis recomendados) e `roles` (somente IDs de função); se qualquer uma estiver configurada, remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - correspondência direta por nome/tag é desativada por padrão; ative `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade de emergência
    - nomes/tags são compatíveis para `users`, mas IDs são mais seguros; `openclaw security audit` avisa quando entradas de nome/tag são usadas
    - se uma guilda tiver `channels` configurado, canais não listados serão negados
    - se uma guilda não tiver bloco `channels`, todos os canais nessa guilda permitida serão permitidos

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
    Mensagens de guilda exigem menção por padrão.

    A detecção de menções inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos compatíveis

    Ao escrever mensagens enviadas pelo Discord, use a sintaxe canônica de menção: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para funções. Não use a forma legada de menção por apelido `<@!USER_ID>`.

    `requireMention` é configurado por guilda/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - lista de permissões opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agentes baseado em funções

Use `bindings[].match.roles` para rotear membros de guildas do Discord para diferentes agentes por ID de função. Vinculações baseadas em função aceitam apenas IDs de função e são avaliadas depois de vinculações por par ou par pai e antes de vinculações somente por guilda. Se uma vinculação também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

- `commands.native` usa `"auto"` como padrão e fica habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza de comandos de barra do Discord durante a inicialização. Comandos registrados anteriormente podem continuar visíveis no Discord até que você os remova do app do Discord.
- A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o processamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na UI do Discord para usuários não autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Comandos de barra](/pt-BR/tools/slash-commands) para ver o catálogo de comandos e o comportamento.

Configurações padrão de comandos de barra:

- `ephemeral: true`

## Detalhes do recurso

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord é compatível com tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`
    - `batched`

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem de saída do Discord no turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    turno de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para conversas ambíguas em rajadas, não para cada
    turno de mensagem única.

    IDs de mensagem são expostos no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de transmissão ao vivo">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming` aceita `off` | `partial` | `block` | `progress` (padrão). `progress` mantém um rascunho de status editável e o atualiza com o progresso de ferramentas até a entrega final; `streamMode` é um alias legado de runtime. Execute `openclaw doctor --fix` para reescrever a configuração persistida para a chave canônica.

    Defina `channels.discord.streaming.mode` como `off` para desabilitar edições de prévia do Discord. Se a transmissão em blocos do Discord estiver explicitamente habilitada, o OpenClaw ignora a transmissão de prévia para evitar transmissão duplicada.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` edita uma única mensagem de prévia conforme os tokens chegam.
    - `block` emite partes do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitado a `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de prévia pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de prévia.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla detalhes de comando/execução em linhas compactas de progresso: `raw` (padrão) ou `status` (somente rótulo da ferramenta).

    Oculte texto bruto de comando/execução mantendo linhas compactas de progresso:

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

    A transmissão de prévia é somente texto; respostas com mídia voltam para a entrega normal. Quando a transmissão `block` está explicitamente habilitada, o OpenClaw ignora a transmissão de prévia para evitar transmissão duplicada.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de threads">
    Contexto de histórico de guilda:

    - padrão de `channels.discord.historyLimit`: `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de threads:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, salvo substituição.
    - Sessões de thread herdam a seleção `/model` em nível de sessão do canal pai como fallback apenas de modelo; seleções `/model` locais da thread ainda têm precedência, e o histórico de transcrição do pai não é copiado, salvo se a herança de transcrição estiver habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) faz novas auto-threads iniciarem com a transcrição do pai. Substituições por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagem podem resolver alvos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação no estágio de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Listas de permissões controlam quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a threads para subagentes">
    O Discord pode vincular uma thread a um destino de sessão para que mensagens subsequentes nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagentes).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove o vínculo da thread atual
    - `/agents` mostra execuções ativas e estado de vínculo
    - `/session idle <duration|off>` inspeciona/atualiza o auto-unfocus por inatividade para vínculos focados
    - `/session max-age <duration|off>` inspeciona/atualiza a idade máxima rígida para vínculos focados

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
    - `spawnSessions` controla a criação/vínculo automático de threads para `sessions_spawn({ thread: true })` e spawns de thread ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo de subagente para spawns vinculados a thread. Padrão: `"fork"`.
    - Chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se vínculos de thread estiverem desabilitados para uma conta, `/focus` e operações relacionadas de vínculo de thread ficam indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vínculos persistentes de canais ACP">
    Para workspaces ACP estáveis e "sempre ativos", configure vínculos ACP tipados de nível superior direcionados a conversas do Discord.

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

    - `/acp spawn codex --bind here` vincula o canal ou a thread atual no lugar e mantém mensagens futuras na mesma sessão ACP. Mensagens de thread herdam o vínculo do canal pai.
    - Em um canal ou thread vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no lugar. Vínculos temporários de thread podem substituir a resolução de destino enquanto ativos.
    - `spawnSessions` controla a criação/vínculo de threads filhas via `--thread auto|here`.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes do comportamento de vínculo.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por guilda:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são convertidos em eventos de sistema e anexados à sessão roteada do Discord.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji da identidade do agente (`agents.list[].identity.emoji`; caso contrário, "👀")

    Observações:

    - O Discord aceita emoji Unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração">
    Gravações de configuração iniciadas pelo canal ficam habilitadas por padrão.

    Isso afeta fluxos `/config set|unset` (quando recursos de comando estão habilitados).

    Desabilitar:

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
    Roteie o tráfego WebSocket do Gateway do Discord e consultas REST de inicialização (ID do aplicativo + resolução de lista de permissões) por um proxy HTTP(S) com `channels.discord.proxy`.

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
    Habilite a resolução do PluralKit para mapear mensagens encaminhadas por proxy para a identidade de membro do sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Observações:

    - listas de permissões podem usar `pk:<memberId>`
    - nomes de exibição de membros são correspondidos por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - consultas usam o ID da mensagem original e são restritas por janela de tempo
    - se a consulta falhar, mensagens encaminhadas por proxy são tratadas como mensagens de bot e descartadas, salvo se `allowBots=true`

  </Accordion>

  <Accordion title="Aliases de menção de saída">
    Use `mentionAliases` quando agentes precisarem de menções de saída determinísticas para usuários conhecidos do Discord. Chaves são identificadores sem o `@` inicial; valores são IDs de usuário do Discord. Identificadores desconhecidos, `@everyone`, `@here` e menções dentro de spans de código Markdown permanecem inalterados.

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

    Exemplo de transmissão:

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
    - 4: Personalizado (usa o texto da atividade como estado do status; emoji é opcional)
    - 5: Competindo

    Exemplo de presença automática (sinal de integridade de runtime):

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

    A presença automática mapeia a disponibilidade em tempo de execução para o status do Discord: saudável => online, degradado ou desconhecido => ausente, esgotado ou indisponível => dnd. Sobrescritas de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (oferece suporte ao placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte ao processamento de aprovações baseado em botões em DMs e pode, opcionalmente, publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord habilita automaticamente as aprovações de execução nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução a partir de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente de aprovação nativo.

    Para comandos de grupo sensíveis e exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia prompts de aprovação e resultados finais em privado. Ele tenta primeiro a DM do Discord quando o proprietário que invoca tem uma rota de proprietário do Discord; se ela não estiver disponível, recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como Telegram.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Somente aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Os prompts de aprovação incluem o texto do comando, portanto habilite a entrega em canal somente em canais confiáveis. Se o ID do canal não puder ser derivado da chave de sessão, o OpenClaw recorre à entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DM para aprovadores e distribuição para canais.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando manual `/approve` somente quando o resultado da ferramenta indicar que
    aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.
    Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém
    o prompt local determinístico `/approve <id> <decision>` visível. Se o
    runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino,
    o OpenClaw envia um aviso de fallback no mesmo chat com o comando `/approve`
    exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovação seguem o contrato compartilhado do cliente Gateway (IDs `plugin:` são resolvidos por `plugin.approval.resolve`; outros IDs por `exec.approval.resolve`). As aprovações expiram após 30 minutos por padrão.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e barreiras de ação

As ações de mensagem do Discord incluem ações de mensagens, administração de canais, moderação, presença e metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

As barreiras de ação ficam em `channels.discord.actions.*`.

Comportamento padrão das barreiras:

| Grupo de ações                                                                                                                                                           | Padrão   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reações, mensagens, threads, pins, enquetes, busca, memberInfo, roleInfo, channelInfo, channels, voiceStatus, eventos, stickers, emojiUploads, stickerUploads, permissions | habilitado |
| roles                                                                                                                                                                    | desabilitado |
| moderação                                                                                                                                                                | desabilitado |
| presença                                                                                                                                                                 | desabilitado |

## IU de componentes v2

O OpenClaw usa componentes v2 do Discord para aprovações de execução e marcadores entre contextos. As ações de mensagem do Discord também podem aceitar `components` para IU personalizada (avançado; requer construir uma carga útil de componente por meio da ferramenta do Discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada por contêineres de componentes do Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` são ignorados quando componentes v2 estão presentes.

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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato de pré-visualização com forma de onda). O Gateway oferece suporte a ambos.

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

Exemplo de entrada automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Observações:

- `voice.tts` sobrescreve `messages.tts` somente para reprodução de voz.
- `voice.model` sobrescreve o LLM usado somente para respostas em canais de voz do Discord. Deixe-o indefinido para herdar o modelo do agente roteado.
- STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Sobrescritas de `systemPrompt` por canal do Discord se aplicam a turnos de transcrição de voz desse canal de voz.
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes que não são proprietários não podem acessar ferramentas exclusivas do proprietário (por exemplo, `gateway` e `cron`).
- Voz do Discord é opcional para configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar comandos `/vc`, o runtime de voz e a intenção de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` pode sobrescrever explicitamente a assinatura da intenção de estado de voz. Deixe indefinido para que a intenção siga a habilitação efetiva de voz.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se indefinidos.
- `voice.connectTimeoutMs` controla a espera inicial por Ready de `@discordjs/voice` para `/vc join` e tentativas de entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw aguarda uma sessão de voz desconectada começar a se reconectar antes de destruí-la. Padrão: `15000`.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após a atualização, colete um relatório de dependências e logs. A linha empacotada de `@discordjs/voice` inclui a correção de padding upstream do PR #11449 do discord.js, que encerrou a issue #11419 do discord.js.

Pipeline de canal de voz:

- A captura PCM do Discord é convertida em um arquivo temporário WAV.
- `tools.media.audio` lida com STT, por exemplo `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta executa com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita texto retornado, porque a voz do Discord controla a reprodução final de TTS.
- `voice.model`, quando definido, sobrescreve somente o LLM de resposta para este turno de canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; o áudio resultante é reproduzido no canal conectado.

Credenciais são resolvidas por componente: autenticação de rota de LLM para `voice.model`, autenticação de STT para `tools.media.audio` e autenticação de TTS para `messages.tts`/`voice.tts`.

### Mensagens de voz

Mensagens de voz do Discord mostram uma pré-visualização com forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita conteúdo de texto (o Discord rejeita texto + mensagem de voz na mesma carga útil).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intenções não permitidas usadas ou o bot não vê mensagens da guilda">

    - habilite Message Content Intent
    - habilite Server Members Intent quando você depender de resolução de usuário/membro
    - reinicie o Gateway após alterar intenções

  </Accordion>

  <Accordion title="Mensagens da guilda bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a allowlist da guilda em `channels.discord.guilds`
    - se o mapa `channels` da guilda existir, somente os canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention false, mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem allowlist de guilda/canal correspondente
    - `requireMention` configurado no lugar errado (deve estar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela allowlist `users` da guilda/canal

  </Accordion>

  <Accordion title="Turnos longos do Discord ou respostas duplicadas">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Ajustes da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla apenas o trabalho do listener do Gateway do Discord, não a duração do turno do agente

    O Discord não aplica um timeout próprio do canal a turnos de agente enfileirados. Listeners de mensagem fazem o repasse imediatamente, e execuções do Discord enfileiradas preservam a ordem por sessão até que o ciclo de vida da sessão/ferramenta/runtime seja concluído ou aborte o trabalho.

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

  <Accordion title="Avisos de timeout de consulta de metadados do Gateway">
    O OpenClaw busca os metadados de `/gateway/bot` do Discord antes de se conectar. Falhas transitórias usam a URL padrão do Gateway do Discord como fallback e têm limitação de taxa nos logs.

    Controles de timeout de metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - múltiplas contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback de variável de ambiente quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinícios por timeout de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões em tempo de execução. Configurações com múltiplas contas e escalonamento de inicialização podem precisar de uma janela de READY na inicialização maior que o padrão.

    Controles de timeout de READY:

    - inicialização com conta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicialização com múltiplas contas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback de variável de ambiente na inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão de inicialização: `15000` (15 segundos), máximo: `120000`
    - tempo de execução com conta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - tempo de execução com múltiplas contas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback de variável de ambiente em tempo de execução quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão em tempo de execução: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` só funcionam para IDs numéricos de canais.

    Se você usar chaves slug, a correspondência em tempo de execução ainda pode funcionar, mas o probe não consegue verificar totalmente as permissões.

  </Accordion>

  <Accordion title="Problemas de DM e emparelhamento">

    - DM desativada: `channels.discord.dm.enabled=false`
    - política de DM desativada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de emparelhamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens escritas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras rígidas de menção e allowlist para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bots que mencionem o bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
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
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão da dependência) e ajuste apenas se necessário
    - monitore os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete logs e compare com o histórico de recebimento DAVE do projeto de origem em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões de menor privilégio no Discord.
- Se a implantação/estado de comandos estiver obsoleto, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionados

<CardGroup cols={2}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Discord ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chat em grupo e allowlist.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e reforço de segurança.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comandos nativos.
  </Card>
</CardGroup>
