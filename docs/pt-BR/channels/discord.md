---
read_when:
    - Trabalhando em recursos do canal Discord
summary: Status, recursos e configuração do bot do Discord
title: Discord
x-i18n:
    generated_at: "2026-06-30T13:50:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Pronto para DMs e canais de guilda via o Gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comando nativo e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo ao OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tem um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crie um aplicativo e bot do Discord">
    Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você usa para seu agente OpenClaw.

  </Step>

  <Step title="Habilite intents privilegiadas">
    Ainda na página **Bot**, role até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para allowlists de funções e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copie seu token de bot">
    Role de volta para cima na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Este é o seu **Bot Token**, e você precisará dele em breve.

  </Step>

  <Step title="Gere uma URL de convite e adicione o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você gerará uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role para baixo até **OAuth2 URL Generator** e habilite:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Habilite pelo menos:

    **Permissões gerais**
      - Ver canais

    **Permissões de texto**
      - Enviar mensagens
      - Ler histórico de mensagens
      - Incorporar links
      - Anexar arquivos
      - Adicionar reações (opcional)

    Este é o conjunto básico para canais de texto normais. Se você planeja postar em threads do Discord, incluindo fluxos de trabalho de canais de fórum ou mídia que criam ou continuam uma thread, habilite também **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no seu navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor Discord.

  </Step>

  <Step title="Habilite o Modo de Desenvolvedor e colete seus IDs">
    De volta ao aplicativo Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → Role até **Developer** na barra lateral → ative **Developer Mode**

        *(Observação: no aplicativo móvel do Discord, o Modo de Desenvolvedor fica em **App Settings** → **Advanced**)*

    2. Clique com o botão direito no **ícone do servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três ao OpenClaw na próxima etapa.

  </Step>

  <Step title="Permita DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso habilitado se quiser usar DMs do Discord com o OpenClaw. Se você planeja usar apenas canais de guilda, pode desabilitar DMs após o pareamento.

  </Step>

  <Step title="Defina seu token de bot com segurança (não o envie no chat)">
    Seu token de bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagem ao seu agente.

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

    Se o OpenClaw já estiver em execução como serviço em segundo plano, reinicie-o pelo aplicativo OpenClaw para Mac ou parando e reiniciando o processo `openclaw gateway run`.
    Para instalações de serviço gerenciado, execute `openclaw gateway install` em um shell onde `DISCORD_BOT_TOKEN` esteja presente, ou armazene a variável em `~/.openclaw/.env`, para que o serviço consiga resolver o SecretRef de env após reiniciar.
    Se seu host estiver bloqueado ou com limite de taxa pela consulta de aplicativo de inicialização do Discord, defina o ID do aplicativo/cliente do Discord pelo Portal de Desenvolvedores para que a inicialização possa ignorar essa chamada REST. Use `channels.discord.applicationId` para a conta padrão, ou `channels.discord.accounts.<accountId>.applicationId` quando executar vários bots do Discord.

  </Step>

  <Step title="Configure o OpenClaw e faça o pareamento">

    <Tabs>
      <Tab title="Peça ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga a ele. Se Discord for seu primeiro canal, use a aba CLI / configuração em vez disso.

        > "Já defini meu token de bot do Discord na configuração. Conclua a configuração do Discord com User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuração">
        Se você preferir configuração baseada em arquivo, defina:

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

        Para configuração automatizada ou remota, escreva o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e depois execute novamente sem `--dry-run`. Valores de `token` em texto simples são compatíveis. Valores SecretRef também são compatíveis para `channels.discord.token` entre provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

        Para vários bots do Discord, mantenha cada token de bot e ID de aplicativo sob sua conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas, então defina-o ali apenas quando todas as contas devem usar o mesmo ID de aplicativo.

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
    Aguarde até que o Gateway esteja em execução e então envie uma DM ao seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Peça ao seu agente">
        Envie o código de pareamento ao seu agente no seu canal existente:

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
A resolução de token é ciente da conta. Valores de token da configuração vencem o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Se duas contas do Discord habilitadas resolverem para o mesmo token de bot, o OpenClaw inicia apenas um monitor de Gateway para esse token. Um token originado da configuração vence o fallback de env padrão; caso contrário, a primeira conta habilitada vence e a conta duplicada é relatada como desabilitada.
Para chamadas avançadas de saída (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado para essa chamada. Isso se aplica a ações de envio e ações do tipo leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política/tentativa da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configure um workspace de guilda

Depois que as DMs estiverem funcionando, você pode configurar seu servidor Discord como um workspace completo em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde há apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à allowlist de guildas">
    Isso permite que seu agente responda em qualquer canal no seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à allowlist de guildas"
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
    Por padrão, seu agente só responde em canais de guilda quando é @mencionado. Para um servidor privado, você provavelmente quer que ele responda a todas as mensagens.

    Em canais de guilda, respostas normais são postadas automaticamente por padrão. Para salas compartilhadas sempre ativas, opte por `messages.groupChat.visibleReplies: "message_tool"` para que o agente possa ficar observando e só poste quando decidir que uma resposta no canal é útil. Isso funciona melhor com modelos de última geração e confiáveis com ferramentas, como GPT 5.5. Eventos de sala ambientes permanecem silenciosos a menos que a ferramenta envie. Consulte [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events) para a configuração completa do modo de observação silenciosa.

    Se o Discord mostrar digitação e os logs mostrarem uso de token, mas nenhuma mensagem postada, verifique se o turno foi configurado como um evento de sala ambiente ou optou por respostas visíveis com ferramenta de mensagem.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
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

        Para exigir envios por ferramenta de mensagem em respostas visíveis de grupo/canal, defina `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje memória em canais de guilda">
    Por padrão, a memória de longo prazo (MEMORY.md) só é carregada em sessões de DM. Canais de guilda não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisar de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (elas são injetadas em todas as sessões). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor Discord e comece a conversar. Seu agente consegue ver o nome do canal, e cada canal recebe sua própria sessão isolada — assim você pode configurar `#coding`, `#home`, `#research` ou o que for adequado ao seu fluxo de trabalho.

## Modelo de runtime

- O Gateway é responsável pela conexão do Discord.
- O roteamento de respostas é determinístico: respostas recebidas pelo Discord voltam para o Discord.
- Metadados de guild/canal do Discord são adicionados ao prompt do modelo como contexto
  não confiável, não como um prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope
  de volta, o OpenClaw remove os metadados copiados das respostas de saída e do
  contexto de replay futuro.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guild são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs de grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de cron/heartbeat somente em texto para o Discord usa a resposta final
  visível ao assistente uma vez. Payloads de mídia e componentes estruturados permanecem
  com várias mensagens quando o agente emite vários payloads entregáveis.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas postagens em threads. O OpenClaw oferece duas formas de criá-las:

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

Fóruns pais não aceitam componentes do Discord. Se você precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens de agente. Use a ferramenta de mensagem com um payload `components`. Os resultados de interação são roteados de volta ao agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Callbacks de componentes expiram após 30 minutos por padrão. Defina `channels.discord.agentComponents.ttlMs` para alterar esse tempo de vida do registro de callbacks para a conta padrão do Discord, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para substituir uma conta em uma configuração com várias contas. O valor é em milissegundos, deve ser um inteiro positivo e é limitado a `86400000` (24 horas). TTLs mais longos são úteis para fluxos de trabalho de revisão ou aprovação que precisam que botões permaneçam utilizáveis, mas também ampliam a janela em que uma mensagem antiga do Discord ainda pode acionar uma ação. Prefira o menor TTL que atenda ao fluxo de trabalho e mantenha o padrão quando callbacks obsoletos causariam surpresa.

Os comandos slash `/model` e `/models` abrem um seletor interativo de modelo com menus suspensos de provedor, modelo e runtime compatível, além de uma etapa Submit. `/models add` foi descontinuado e agora retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e apenas o usuário que invocou pode usá-la. Menus de seleção do Discord são limitados a 25 opções, então adicione entradas `provider/*` a `agents.defaults.models` quando quiser que o seletor mostre modelos descobertos dinamicamente apenas para provedores selecionados, como `openai` ou `vllm`.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome do upload quando ele deve corresponder à referência do anexo

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
    `channels.discord.dmPolicy` controla o acesso por DM. `channels.discord.allowFrom` é a allowlist canônica de DMs.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos serão bloqueados (ou solicitados a fazer pareamento no modo `pairing`).

    Precedência com várias contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o legado `dm.allowFrom`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` e o legado `dm.allowFrom` não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Os legados `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

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

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação assim: o remetente da DM é membro da guild configurada e atualmente tem permissão efetiva de `ViewChannel` no canal configurado depois que funções e substituições de canal são aplicadas.

    Exemplo: permitir que qualquer pessoa que consiga ver `#maintainers` envie DM ao bot, mantendo DMs fechadas para todos os demais.

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

    Habilite o **Server Members Intent** do Portal de Desenvolvedores do Discord para o bot ao usar grupos de acesso de audiência de canal. DMs não incluem estado de membro da guild, então o OpenClaw resolve o membro pelo REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Guild policy">
    O tratamento de guilds é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - a guild deve corresponder a `channels.discord.guilds` (`id` preferido, slug aceito)
    - allowlists opcionais de remetentes: `users` (IDs estáveis recomendados) e `roles` (somente IDs de função); se qualquer uma estiver configurada, remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - correspondência direta de nome/tag é desativada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade emergencial
    - nomes/tags são compatíveis com `users`, mas IDs são mais seguros; `openclaw security audit` avisa quando entradas de nome/tag são usadas
    - se uma guild tiver `channels` configurado, canais não listados serão negados
    - se uma guild não tiver bloco `channels`, todos os canais nessa guild incluída na allowlist serão permitidos

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

    Ao escrever mensagens de saída do Discord, use a sintaxe canônica de menção: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para funções. Não use a forma legada de menção por apelido `<@!USER_ID>`.

    `requireMention` é configurado por guild/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs de grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - allowlist opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de guildas do Discord para diferentes agentes por ID de função. Vinculações baseadas em funções aceitam apenas IDs de função e são avaliadas depois de vinculações de peer ou peer-pai e antes de vinculações somente de guilda. Se uma vinculação também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

- `commands.native` tem como padrão `"auto"` e é habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza de comandos slash do Discord durante a inicialização. Comandos registrados anteriormente podem continuar visíveis no Discord até que você os remova do app do Discord.
- A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o tratamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na interface do Discord para usuários não autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Comandos slash](/pt-BR/tools/slash-commands) para o catálogo e o comportamento dos comandos.

Configurações padrão de comando slash:

- `ephemeral: true`

## Detalhes do recurso

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord oferece suporte a tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`
    - `batched`

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags `[[reply_to_*]]` explícitas ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem de saída do Discord no turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    evento de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para conversas ambíguas em rajadas, não para cada
    turno de mensagem única.

    IDs de mensagem são expostos no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Pré-visualizações de links">
    Por padrão, o Discord gera incorporações ricas de links para URLs. O OpenClaw suprime essas incorporações geradas em mensagens de saída do Discord por padrão, para que URLs enviadas pelo agente permaneçam como links simples, a menos que você aceite habilitá-las:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Defina `channels.discord.accounts.<id>.suppressEmbeds` para substituir em uma conta. Envios pela ferramenta de mensagem do agente também podem passar `suppressEmbeds: false` para uma única mensagem. Payloads `embeds` explícitos do Discord não são suprimidos pela configuração padrão de pré-visualização de links.

  </Accordion>

  <Accordion title="Pré-visualização de transmissão ao vivo">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming` aceita `off` | `partial` | `block` | `progress` (padrão). `progress` mantém um rascunho de status editável e o atualiza com o progresso das ferramentas até a entrega final; o rótulo inicial compartilhado é uma linha rotativa, então ele rola para fora como o restante quando trabalho suficiente aparece. `streamMode` é um alias legado de runtime. Execute `openclaw doctor --fix` para reescrever a configuração persistida para a chave canônica.

    Defina `channels.discord.streaming.mode` como `off` para desabilitar edições de pré-visualização do Discord. Se a transmissão em blocos do Discord estiver explicitamente habilitada, o OpenClaw ignora a transmissão de pré-visualização para evitar transmissão duplicada.

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

    - `partial` edita uma única mensagem de pré-visualização conforme os tokens chegam.
    - `block` emite blocos do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitado a `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de pré-visualização pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de pré-visualização.
    - Linhas de ferramenta/progresso são renderizadas como emoji compacto + título + detalhe quando disponível, por exemplo `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (padrão `false`) permite texto de comentário/preâmbulo do assistente no rascunho temporário de progresso. O comentário é limpo antes da exibição, permanece transitório e não altera a entrega da resposta final.
    - `streaming.progress.maxLineChars` controla o orçamento de pré-visualização de progresso por linha. Prosa é encurtada em limites de palavra; detalhes de comandos e caminhos mantêm sufixos úteis.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla detalhes de comando/exec em linhas compactas de progresso: `raw` (padrão) ou `status` (somente rótulo da ferramenta).

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

    A transmissão de pré-visualização é somente texto; respostas com mídia voltam à entrega normal. Quando a transmissão `block` está explicitamente habilitada, o OpenClaw ignora a transmissão de pré-visualização para evitar transmissão duplicada.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de threads">
    Contexto de histórico de guilda:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de thread:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, a menos que sejam substituídas.
    - Sessões de thread herdam a seleção `/model` em nível de sessão do canal pai como fallback somente de modelo; seleções `/model` locais da thread ainda têm precedência, e o histórico de transcrição do pai não é copiado, a menos que a herança de transcrição esteja habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) faz novas auto-threads semearem a partir da transcrição pai. Substituições por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagem podem resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação no estágio de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Listas de permissões controlam quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a threads para subagentes">
    O Discord pode vincular uma thread a um destino de sessão para que mensagens subsequentes nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagentes).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove a vinculação da thread atual
    - `/agents` mostra execuções ativas e estado de vinculação
    - `/session idle <duration|off>` inspeciona/atualiza o auto-unfocus por inatividade para vinculações focadas
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
    - `spawnSessions` controla a criação/vinculação automática de threads para `sessions_spawn({ thread: true })` e gerações de threads ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo do subagente para gerações vinculadas a threads. Padrão: `"fork"`.
    - Chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se vinculações de thread estiverem desabilitadas para uma conta, `/focus` e operações relacionadas de vinculação de thread ficam indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculações persistentes de canal ACP">
    Para workspaces ACP estáveis "sempre ativos", configure vinculações ACP tipadas de nível superior direcionadas a conversas do Discord.

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

    - `/acp spawn codex --bind here` vincula o canal ou a thread atual no lugar e mantém mensagens futuras na mesma sessão ACP. Mensagens de thread herdam a vinculação do canal pai.
    - Em um canal ou thread vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no lugar. Vinculações temporárias de thread podem substituir a resolução de destino enquanto estiverem ativas.
    - `spawnSessions` controla a criação/vinculação de threads filhas via `--thread auto|here`.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes do comportamento de vinculação.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por guilda:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos de sistema e anexados à sessão roteada do Discord.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou uma conta.

  </Accordion>

  <Accordion title="Gravações de configuração">
    Gravações de configuração iniciadas pelo canal são habilitadas por padrão.

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

  <Accordion title="Suporte a PluralKit">
    Habilite a resolução do PluralKit para mapear mensagens com proxy para a identidade de membro do sistema:

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
    - nomes de exibição de membros são correspondidos por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - consultas usam o ID da mensagem original e são limitadas por janela de tempo
    - se a consulta falhar, mensagens intermediadas são tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Aliases de menções de saída">
    Use `mentionAliases` quando agentes precisam de menções de saída determinísticas para usuários conhecidos do Discord. As chaves são identificadores sem o `@` inicial; os valores são IDs de usuário do Discord. Identificadores desconhecidos, `@everyone`, `@here` e menções dentro de spans de código Markdown permanecem inalterados.

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
    - 4: Personalizado (usa o texto da atividade como o estado do status; emoji é opcional)
    - 5: Competindo

    Exemplo de presença automática (sinal de integridade em runtime):

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

    Presença automática mapeia a disponibilidade em runtime para o status do Discord: saudável => online, degradado ou desconhecido => ausente, esgotado ou indisponível => não perturbe. Sobrescrições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (compatível com o placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    Discord é compatível com tratamento de aprovações baseado em botões em DMs e pode, opcionalmente, publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automaticamente aprovações exec nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `commands.ownerAllowFrom`. Discord não infere aprovadores exec de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente de aprovação nativo.

    Para comandos de grupo sensíveis e exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia prompts de aprovação e resultados finais privadamente. Ele tenta primeiro uma DM no Discord quando o proprietário invocador tem uma rota de proprietário no Discord; se isso não estiver disponível, recorre à primeira rota de proprietário disponível de `commands.ownerAllowFrom`, como Telegram.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Somente aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Prompts de aprovação incluem o texto do comando, portanto habilite a entrega no canal somente em canais confiáveis. Se o ID do canal não puder ser derivado da chave da sessão, o OpenClaw recorre à entrega por DM.

    Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DM para aprovadores e fanout de canal.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando manual `/approve` somente quando o resultado da ferramenta indicar
    que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.
    Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém o
    prompt local determinístico `/approve <id> <decision>` visível. Se o
    runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino,
    o OpenClaw envia um aviso de fallback no mesmo chat com o comando `/approve`
    exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovação seguem o contrato compartilhado do cliente Gateway (IDs `plugin:` resolvem por `plugin.approval.resolve`; outros IDs por `exec.approval.resolve`). Aprovações expiram após 30 minutos por padrão.

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

| Grupo de ações                                                                                                                                                           | Padrão     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado |
| roles                                                                                                                                                                    | desabilitado |
| moderation                                                                                                                                                               | desabilitado |
| presence                                                                                                                                                                 | desabilitado |

## Interface de componentes v2

O OpenClaw usa componentes v2 do Discord para aprovações exec e marcadores entre contextos. Ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer construir um payload de componente por meio da ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada por contêineres de componentes do Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla por quanto tempo callbacks de componentes do Discord enviados permanecem registrados (padrão `1800000`, máximo `86400000`). Defina por conta com `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` são ignorados quando componentes v2 estão presentes.
- Pré-visualizações de URL simples são suprimidas por padrão. Defina `suppressEmbeds: false` em uma ação de mensagem quando um único link de saída deve se expandir.

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

Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato de prévia de forma de onda). O gateway é compatível com ambos.

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
- `voice.mode` controla o caminho da conversa. O padrão é `agent-proxy`: uma interface de voz realtime lida com temporização de turnos, interrupção e reprodução, delega o trabalho substantivo ao agente OpenClaw roteado por meio de `openclaw_agent_consult` e trata o resultado como um prompt digitado no Discord vindo daquele falante. `stt-tts` mantém o fluxo em lote mais antigo de STT mais TTS. `bidi` permite que o modelo realtime converse diretamente enquanto expõe `openclaw_agent_consult` para o cérebro do OpenClaw.
- `voice.agentSession` controla qual conversa do OpenClaw recebe turnos de voz. Deixe sem definir para a sessão própria do canal de voz, ou defina `{ mode: "target", target: "channel:<text-channel-id>" }` para fazer o canal de voz atuar como a extensão de microfone/alto-falante de uma sessão existente de canal de texto do Discord, como `#maintainers`.
- `voice.model` substitui o cérebro do agente OpenClaw para respostas de voz do Discord e consultas realtime. Deixe sem definir para herdar o modelo do agente roteado. Ele é separado de `voice.realtime.model`.
- `voice.followUsers` permite que o bot entre, mude e saia da voz do Discord com usuários selecionados. Consulte [Seguir usuários em voz](#follow-users-in-voice) para regras de comportamento e exemplos.
- `agent-proxy` roteia fala por meio de `discord-voice`, que preserva a autorização normal de proprietário/ferramenta para o falante e a sessão de destino, mas oculta a ferramenta `tts` do agente porque a voz do Discord controla a reprodução. Por padrão, `agent-proxy` dá à consulta acesso completo a ferramentas equivalente ao proprietário para falantes proprietários (`voice.realtime.toolPolicy: "owner"`) e prefere fortemente consultar o agente OpenClaw antes de respostas substantivas (`voice.realtime.consultPolicy: "always"`). Nesse modo padrão `always`, a camada realtime não fala automaticamente preenchimento antes da resposta da consulta; ela captura e transcreve a fala, depois fala a resposta roteada do OpenClaw. Se várias respostas de consulta forçadas terminarem enquanto o Discord ainda estiver reproduzindo a primeira resposta, respostas posteriores de fala exata entram em fila até a reprodução ficar ociosa, em vez de substituir a fala no meio da frase.
- No modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Em modos realtime, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configuram a sessão de áudio realtime. Para OpenAI Realtime 2 mais o cérebro Codex, use `voice.realtime.model: "gpt-realtime-2"` e `voice.model: "openai/gpt-5.5"`.
- Modos de voz realtime incluem pequenos arquivos de perfil `IDENTITY.md`, `USER.md` e `SOUL.md` nas instruções do provedor realtime por padrão, para que turnos diretos rápidos mantenham a mesma identidade, fundamentação de usuário e persona que o agente OpenClaw roteado. Defina `voice.realtime.bootstrapContextFiles` como um subconjunto para personalizar isso, ou `[]` para desativar. Os arquivos de bootstrap realtime compatíveis são limitados a esses arquivos de perfil; `AGENTS.md` permanece no contexto normal do agente. O contexto de perfil injetado não substitui `openclaw_agent_consult` para trabalho no workspace, fatos atuais, consulta de memória ou ações apoiadas por ferramentas.
- No modo realtime `agent-proxy` da OpenAI, defina `voice.realtime.requireWakeName: true` para manter a voz realtime do Discord silenciosa até uma transcrição começar ou terminar com um nome de ativação. Nomes de ativação configurados devem ter uma ou duas palavras. Se `voice.realtime.wakeNames` não estiver definido, o OpenClaw usa o `name` do agente roteado mais `OpenClaw`, recorrendo ao id do agente mais `OpenClaw`. O bloqueio por nome de ativação desativa a resposta automática do provedor realtime, roteia turnos aceitos pelo caminho de consulta do agente OpenClaw e dá um breve reconhecimento falado quando um nome de ativação inicial é reconhecido a partir de transcrição parcial antes da chegada da transcrição final.
- O provedor realtime da OpenAI aceita nomes de evento atuais do Realtime 2 e aliases legados compatíveis com Codex para eventos de áudio de saída e transcrição, para que snapshots de provedor compatíveis possam variar sem descartar áudio do assistente.
- `voice.realtime.bargeIn` controla se eventos de início de fala no Discord interrompem a reprodução realtime ativa. Se não definido, ele segue a configuração de interrupção de áudio de entrada do provedor realtime.
- `voice.realtime.minBargeInAudioEndMs` controla a duração mínima da reprodução do assistente antes que uma interrupção realtime da OpenAI trunque o áudio. Padrão: `250`. Defina `0` para interrupção imediata em salas com pouco eco, ou aumente para configurações de alto-falantes com muito eco.
- Para uma voz OpenAI na reprodução do Discord, defina `voice.tts.provider: "openai"` e escolha uma voz Text-to-speech em `voice.tts.providers.openai.speakerVoice`. `cedar` é uma boa escolha com som masculino no modelo atual de TTS da OpenAI.
- Substituições de `systemPrompt` por canal no Discord se aplicam a turnos de transcrição de voz daquele canal de voz.
- Turnos de transcrição de voz derivam status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`) para comandos com bloqueio por proprietário e ações de canal. A visibilidade das ferramentas do agente segue a política de ferramentas configurada para a sessão roteada.
- A voz do Discord é opcional para configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar comandos `/vc`, o runtime de voz e a intenção de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura da intenção de estado de voz. Deixe sem definir para que a intenção siga a habilitação efetiva de voz.
- Se `voice.autoJoin` tiver várias entradas para a mesma guilda, o OpenClaw entra no último canal configurado para essa guilda.
- `voice.allowedChannels` é uma lista de permissão de residência opcional. Deixe sem definir para permitir `/vc join` em qualquer canal de voz autorizado do Discord. Quando definida, `/vc join`, entrada automática na inicialização e movimentações do estado de voz do bot ficam restritos às entradas `{ guildId, channelId }` listadas. Defina como um array vazio para negar todas as entradas em voz do Discord. Se o Discord mover o bot para fora da lista de permissão, o OpenClaw sai desse canal e volta ao destino de entrada automática configurado quando houver um disponível.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não definidos.
- O OpenClaw usa o codec `libopus-wasm` incluído para recebimento de voz do Discord e reprodução PCM bruta realtime. Ele inclui uma build WebAssembly fixada do libopus e não exige addons opus nativos.
- `voice.connectTimeoutMs` controla a espera inicial por Ready do `@discordjs/voice` para `/vc join` e tentativas de entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw espera uma sessão de voz desconectada começar a reconectar antes de destruí-la. Padrão: `15000`.
- No modo `stt-tts`, a reprodução de voz não para só porque outro usuário começa a falar. Para evitar ciclos de feedback, o OpenClaw ignora nova captura de voz enquanto o TTS está tocando; fale depois que a reprodução terminar para o próximo turno. Modos realtime encaminham inícios de fala como sinais de interrupção para o provedor realtime.
- Em modos realtime, eco de alto-falantes em um microfone aberto pode parecer uma interrupção e interromper a reprodução. Para salas do Discord com muito eco, defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que a OpenAI interrompa automaticamente ao receber áudio de entrada. Adicione `voice.realtime.bargeIn: true` se você ainda quiser que eventos de início de fala do Discord interrompam a reprodução ativa. A ponte realtime da OpenAI ignora truncamentos de reprodução menores que `voice.realtime.minBargeInAudioEndMs` como provável eco/ruído e os registra como ignorados, em vez de limpar a reprodução do Discord.
- `voice.captureSilenceGraceMs` controla por quanto tempo o OpenClaw espera depois que o Discord informa que um falante parou antes de finalizar esse segmento de áudio para STT. Padrão: `2000`; aumente isso se o Discord dividir pausas normais em transcrições parciais fragmentadas.
- Quando ElevenLabs é o provedor de TTS selecionado, a reprodução de voz do Discord usa TTS em streaming e começa a partir do stream de resposta do provedor. Provedores sem suporte a streaming recorrem ao caminho de arquivo temporário sintetizado.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após atualizar, colete um relatório de dependências e logs. A linha `@discordjs/voice` incluída contém a correção upstream de preenchimento do PR #11449 do discord.js, que encerrou a issue #11419 do discord.js.
- Eventos de recebimento `The operation was aborted` são esperados quando o OpenClaw finaliza um segmento capturado de falante; são diagnósticos detalhados, não avisos.
- Logs detalhados da voz do Discord incluem uma prévia delimitada de uma linha da transcrição STT para cada segmento de falante aceito, para que a depuração mostre tanto o lado do usuário quanto o lado da resposta do agente sem despejar texto de transcrição ilimitado.
- No modo `agent-proxy`, o fallback de consulta forçada ignora fragmentos de transcrição provavelmente incompletos, como texto que termina em `...` ou um conector final como `and`, além de encerramentos obviamente não acionáveis como “já volto” ou “tchau”. Logs mostram `forced agent consult skipped reason=...` quando isso impede uma resposta antiga em fila.

### Seguir usuários em voz

Use `voice.followUsers` quando quiser que o bot de voz do Discord permaneça com um ou mais usuários conhecidos do Discord em vez de entrar em um canal fixo na inicialização ou esperar por `/vc join`.

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

- `followUsers` aceita IDs brutos de usuário do Discord e valores `discord:<id>`. O OpenClaw normaliza ambas as formas antes de corresponder eventos de estado de voz.
- `followUsersEnabled` usa `true` como padrão quando `followUsers` está configurado. Defina como `false` para manter a lista salva, mas interromper o seguimento automático de voz.
- Quando um usuário seguido entra em um canal de voz permitido, o OpenClaw entra nesse canal. Quando o usuário se move, o OpenClaw se move com ele. Quando o usuário seguido ativo se desconecta, o OpenClaw sai.
- Se vários usuários seguidos estiverem na mesma guilda e o usuário seguido ativo sair, o OpenClaw se move para o canal de outro usuário seguido rastreado antes de sair da guilda. Se vários usuários seguidos se moverem ao mesmo tempo, vence o evento de estado de voz observado mais recente.
- `allowedChannels` ainda se aplica. Um usuário seguido em um canal não permitido é ignorado, e uma sessão controlada por seguimento se move para outro usuário seguido ou sai.
- O OpenClaw reconcilia eventos de estado de voz perdidos na inicialização e em um intervalo delimitado. A reconciliação amostra guildas configuradas e limita consultas REST por execução, portanto listas `followUsers` muito grandes podem levar mais de um intervalo para convergir.
- Se o Discord ou um administrador mover o bot enquanto ele está seguindo um usuário, o OpenClaw reconstrói a sessão de voz e preserva a propriedade de seguimento quando o destino é permitido. Se o bot for movido para fora de `allowedChannels`, o OpenClaw sai e entra novamente no destino configurado quando houver um.
- A recuperação de recebimento DAVE pode sair e entrar novamente no mesmo canal após falhas de descriptografia repetidas. Sessões controladas por seguimento mantêm sua propriedade de seguimento por esse caminho de recuperação, então uma desconexão posterior do usuário seguido ainda sai do canal.

Escolha entre os modos de entrada:

- Use `followUsers` para configurações pessoais ou de operador em que o bot deve estar automaticamente em voz quando você estiver.
- Use `autoJoin` para bots de sala fixa que devem estar presentes mesmo quando nenhum usuário rastreado estiver em voz.
- Use `/vc join` para entradas pontuais ou salas em que a presença automática de voz seria surpreendente.

Codec de voz do Discord:

- Os logs de recebimento de voz mostram `discord voice: opus decoder: libopus-wasm`.
- A reprodução em tempo real codifica PCM estéreo bruto de 48 kHz para Opus com o mesmo pacote `libopus-wasm` incluído antes de entregar os pacotes a `@discordjs/voice`.
- A reprodução de arquivo e de fluxo do provedor transcodifica para PCM estéreo bruto de 48 kHz com ffmpeg e então usa `libopus-wasm` para o fluxo de pacotes Opus enviado ao Discord.

Pipeline STT mais TTS:

- A captura PCM do Discord é convertida em um arquivo temporário WAV.
- `tools.media.audio` lida com STT, por exemplo `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta é executado com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita texto retornado, porque a voz do Discord é responsável pela reprodução final de TTS.
- `voice.model`, quando definido, substitui apenas o LLM de resposta para este turno de canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; provedores compatíveis com streaming alimentam o player diretamente, caso contrário o arquivo de áudio resultante é reproduzido no canal ingressado.

Exemplo de sessão de canal de voz agent-proxy padrão:

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

Sem um bloco `voice.agentSession`, cada canal de voz recebe sua própria sessão OpenClaw roteada. Por exemplo, `/vc join channel:234567890123456789` fala com a sessão desse canal de voz do Discord. O modelo em tempo real é apenas o front-end de voz; solicitações substantivas são entregues ao agente OpenClaw configurado. Se o modelo em tempo real produzir uma transcrição final sem chamar a ferramenta de consulta, o OpenClaw força a consulta como fallback para que o padrão ainda se comporte como falar com o agente.

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

Voz como extensão de uma sessão existente de canal do Discord:

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

Enquanto uma execução delegada do OpenClaw está ativa, novas transcrições de voz do Discord são tratadas como controle de execução ao vivo antes de iniciar outro turno do agente. Frases como "status", "cancel that", "use the smaller fix" ou "when you're done also check tests" são classificadas como entrada de status, cancelamento, direcionamento ou acompanhamento para a sessão ativa. Resultados de status, cancelamento, direcionamento aceito e acompanhamento são falados de volta no canal de voz para que o chamador saiba se o OpenClaw lidou com a solicitação.

Formas de destino úteis:

- `target: "channel:123456789012345678"` roteia por uma sessão de canal de texto do Discord.
- `target: "123456789012345678"` é tratado como um destino de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` roteia por essa sessão de mensagem direta.

Exemplo OpenAI Realtime com muito eco:

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

Use isto quando o modelo ouve sua própria reprodução do Discord por um microfone aberto, mas você ainda quer interrompê-lo falando. O OpenClaw impede que a OpenAI interrompa automaticamente em áudio de entrada bruto, enquanto `bargeIn: true` permite que eventos de início de fala do Discord e áudio de falante já ativo cancelem respostas em tempo real ativas antes que o próximo turno capturado chegue à OpenAI. Sinais muito iniciais de barge-in com `audioEndMs` abaixo de `minBargeInAudioEndMs` são tratados como provável eco/ruído e ignorados para que o modelo não seja interrompido no primeiro quadro de reprodução.

Logs de voz esperados:

- Ao entrar: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Ao iniciar em tempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Em áudio do falante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Em fala obsoleta ignorada: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- Na conclusão da resposta em tempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Na parada/reinicialização da reprodução: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Na consulta em tempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Na resposta do agente: `discord voice: agent turn answer ...`
- Em fala exata enfileirada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido por `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Na detecção de barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido por `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Na interrupção em tempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido por `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ou `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Em eco/ruído ignorado: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Em barge-in desativado: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Em reprodução ociosa: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar áudio cortado, leia os logs de voz em tempo real como uma linha do tempo:

1. `realtime audio playback started` significa que o Discord começou a reproduzir áudio do assistente. A ponte começa a contar chunks de saída do assistente, bytes PCM do Discord, bytes em tempo real do provedor e duração de áudio sintetizado a partir desse ponto.
2. `realtime speaker turn opened` marca um falante do Discord ficando ativo. Se a reprodução já estiver ativa e `bargeIn` estiver habilitado, isso pode ser seguido por `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca o primeiro quadro de áudio real recebido para esse turno do falante. `outputActive=true` ou um `outputAudioMs` diferente de zero aqui significa que o microfone está enviando entrada enquanto a reprodução do assistente ainda está ativa.
4. `barge-in detected source=active-speaker-audio` significa que o OpenClaw viu áudio de falante ao vivo enquanto a reprodução do assistente estava ativa. Isso é útil para distinguir uma interrupção real de um evento de início de fala do Discord sem áudio útil.
5. `barge-in requested reason=...` significa que o OpenClaw pediu ao provedor em tempo real para cancelar ou truncar a resposta ativa. Ele inclui `outputAudioMs`, `outputActive` e `playbackChunks` para que você possa ver quanto áudio do assistente realmente havia sido reproduzido antes da interrupção.
6. `realtime audio playback stopped reason=...` é o ponto local de reinicialização da reprodução do Discord. O motivo diz quem interrompeu a reprodução: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` resume o turno de entrada capturado. `chunks=0` ou `hasAudio=false` significa que o turno do falante foi aberto, mas nenhum áudio utilizável chegou à ponte em tempo real. `interruptedPlayback=true` significa que esse turno de entrada se sobrepôs à saída do assistente e acionou a lógica de barge-in.

Campos úteis:

- `outputAudioMs`: duração do áudio do assistente gerado pelo provedor em tempo real antes da linha de log.
- `audioMs`: duração do áudio do assistente que o OpenClaw contou antes da reprodução parar.
- `elapsedMs`: tempo de relógio entre abrir e fechar o fluxo de reprodução ou turno do falante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados para ou recebidos da voz do Discord.
- `realtimeBytes`: bytes PCM em formato do provedor enviados para ou recebidos do provedor em tempo real.
- `playbackChunks`: chunks de áudio do assistente encaminhados ao Discord para a resposta ativa.
- `sinceLastAudioMs`: intervalo entre o último quadro de áudio capturado do falante e o fechamento do turno do falante.

Padrões comuns:

- Corte imediato com `source=active-speaker-audio`, `outputAudioMs` pequeno e o mesmo usuário por perto geralmente aponta para eco do alto-falante entrando no microfone. Aumente `voice.realtime.minBargeInAudioEndMs`, diminua o volume do alto-falante, use fones de ouvido ou defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido por `speaker turn closed ... hasAudio=false` significa que o Discord relatou um início de fala, mas nenhum áudio chegou ao OpenClaw. Isso pode ser um evento transitório de voz do Discord, comportamento de gate de ruído ou um cliente ativando brevemente o microfone.
- `audio playback stopped reason=stream-close` sem um barge-in próximo ou `provider-clear-audio` significa que o fluxo local de reprodução do Discord terminou inesperadamente. Verifique os logs anteriores do provedor e do player do Discord.
- `capture ignored during playback (barge-in disabled)` significa que o OpenClaw descartou intencionalmente a entrada enquanto o áudio do assistente estava ativo. Habilite `voice.realtime.bargeIn` se quiser que a fala interrompa a reprodução.
- `barge-in ignored ... outputActive=false` significa que o VAD do Discord ou do provedor relatou fala, mas o OpenClaw não tinha reprodução ativa para interromper. Isso não deve cortar áudio.

As credenciais são resolvidas por componente: autenticação da rota LLM para `voice.model`, autenticação de STT para `tools.media.audio`, autenticação de TTS para `messages.tts`/`voice.tts` e autenticação do provedor em tempo real para `voice.realtime.providers` ou a configuração normal de autenticação do provedor.

### Mensagens de voz

Mensagens de voz do Discord mostram uma prévia de forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter.

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
    - reinicie o gateway depois de alterar intents

  </Accordion>

  <Accordion title="Mensagens do servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a lista de permissões de servidores em `channels.discord.guilds`
    - se o mapa `channels` do servidor existir, somente os canais listados serão permitidos
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

  <Accordion title="Turnos do Discord de longa duração ou respostas duplicadas">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla apenas o trabalho do listener do Gateway do Discord, não a duração do turno do agente

    O Discord não aplica um timeout pertencente ao canal a turnos de agente enfileirados. Listeners de mensagens transferem imediatamente, e execuções do Discord enfileiradas preservam a ordenação por sessão até que o ciclo de vida da sessão/ferramenta/runtime conclua ou aborte o trabalho.

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

  <Accordion title="Avisos de timeout na consulta de metadados do Gateway">
    O OpenClaw busca metadados `/gateway/bot` do Discord antes de conectar. Falhas transitórias recorrem à URL padrão do Gateway do Discord e têm limite de taxa nos logs.

    Controles de timeout de metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback de env quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicializações por timeout de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões de runtime. Configurações com várias contas e escalonamento de inicialização podem precisar de uma janela READY de inicialização maior que o padrão.

    Controles de timeout READY:

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

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas a sondagem não consegue verificar permissões por completo.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitada: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras rígidas de menção e lista de permissões para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar somente mensagens de bots que mencionem o bot.

    O OpenClaw também inclui [proteção contra loops de bots](/pt-BR/channels/bot-loop-protection) compartilhada. Sempre que `allowBots` permite que mensagens criadas por bots cheguem ao dispatch, o Discord mapeia o evento de entrada para fatos de `(conta, canal, par de bots)`, e o guardião genérico de pares suprime o par depois que ele ultrapassa o orçamento de eventos configurado. O guardião evita loops descontrolados entre dois bots que antes precisavam ser interrompidos por limites de taxa do Discord; ele não afeta implantações com um único bot nem respostas pontuais de bots que permanecem abaixo do orçamento.

    Configurações padrão (ativas quando `allowBots` é definido):

    - `maxEventsPerWindow: 20` -- o par de bots pode trocar 20 mensagens dentro da janela deslizante
    - `windowSeconds: 60` -- duração da janela deslizante
    - `cooldownSeconds: 60` -- depois que o orçamento estoura, toda mensagem adicional entre bots em qualquer direção é descartada por um minuto

    Configure o padrão compartilhado uma vez em `channels.defaults.botLoopProtection` e então sobrescreva o Discord quando um workflow legítimo precisar de mais margem. A precedência é:

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

  <Accordion title="STT de voz descartado com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para que a lógica de recuperação de recebimento de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste somente se necessário
    - monitore os logs por:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete logs e compare com o histórico upstream de recebimento DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração - Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos do Discord de alto sinal">

- inicialização/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/nova tentativa: `mediaMaxMb` (limita uploads de saída do Discord, padrão `100MB`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões do Discord com privilégio mínimo.
- Se o deploy/estado de comandos estiver obsoleto, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Discord ao Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chat em grupo e lista de permissões.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comandos nativos.
  </Card>
</CardGroup>
