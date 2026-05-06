---
read_when:
    - Trabalhando em recursos de canais do Discord
summary: Status de suporte, recursos e configuração do bot do Discord
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

Pronto para DMs e canais de guilda por meio do Gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do Discord usam o modo de emparelhamento por padrão.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e emparelhá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crie um aplicativo e um bot do Discord">
    Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê a ele um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você dá ao seu agente do OpenClaw.

  </Step>

  <Step title="Habilite intents privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para allowlists de função e correspondência de nome para ID)
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
    Clique em **OAuth2** na barra lateral. Você gerará uma URL de convite com as permissões certas para adicionar o bot ao seu servidor.

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

    Este é o conjunto básico para canais de texto normais. Se você pretende postar em threads do Discord, incluindo fluxos de trabalho de canais de fórum ou mídia que criam ou continuam uma thread, habilite também **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor do Discord.

  </Step>

  <Step title="Habilite o Modo de Desenvolvedor e colete seus IDs">
    De volta ao aplicativo do Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três para o OpenClaw na próxima etapa.

  </Step>

  <Step title="Permita DMs de membros do servidor">
    Para que o emparelhamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso habilitado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais de guilda, pode desabilitar DMs após o emparelhamento.

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

    Se o OpenClaw já estiver em execução como serviço em segundo plano, reinicie-o pelo app para Mac do OpenClaw ou parando e reiniciando o processo `openclaw gateway run`.
    Para instalações de serviço gerenciado, execute `openclaw gateway install` a partir de um shell onde `DISCORD_BOT_TOKEN` esteja presente, ou armazene a variável em `~/.openclaw/.env`, para que o serviço possa resolver o SecretRef de env após a reinicialização.
    Se seu host estiver bloqueado ou limitado por taxa na busca de aplicativo de inicialização do Discord, defina o ID de aplicativo/cliente do Discord no Portal de Desenvolvedores para que a inicialização possa ignorar essa chamada REST. Use `channels.discord.applicationId` para a conta padrão, ou `channels.discord.accounts.<accountId>.applicationId` quando você executar vários bots do Discord.

  </Step>

  <Step title="Configure o OpenClaw e emparelhe">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente do OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga a ele. Se o Discord for seu primeiro canal, use a aba CLI / configuração em vez disso.

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

        Para configuração com script ou remota, grave o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e depois execute novamente sem `--dry-run`. Valores de `token` em texto simples são compatíveis. Valores SecretRef também são compatíveis com `channels.discord.token` em provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

        Para vários bots do Discord, mantenha cada token de bot e ID de aplicativo sob sua conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas, portanto defina-o ali somente quando todas as contas devam usar o mesmo ID de aplicativo.

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

  <Step title="Aprove o primeiro emparelhamento por DM">
    Aguarde até que o Gateway esteja em execução e então envie uma DM para seu bot no Discord. Ele responderá com um código de emparelhamento.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Envie o código de emparelhamento ao seu agente no seu canal existente:

        > "Aprove este código de emparelhamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Códigos de emparelhamento expiram após 1 hora.

    Agora você deve conseguir conversar com seu agente no Discord via DM.

  </Step>
</Steps>

<Note>
A resolução de token considera a conta. Valores de token na configuração prevalecem sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Se duas contas do Discord habilitadas resolverem para o mesmo token de bot, o OpenClaw inicia apenas um monitor de Gateway para esse token. Um token vindo da configuração prevalece sobre o fallback de env padrão; caso contrário, a primeira conta habilitada prevalece e a conta duplicada é relatada como desabilitada.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações de envio e de leitura/sondagem (por exemplo, leitura/pesquisa/busca/thread/pins/permissões). As configurações de política/tentativa da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configure um workspace de guilda

Depois que as DMs estiverem funcionando, você pode configurar seu servidor do Discord como um workspace completo, em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde há apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à allowlist de guilda">
    Isso permite que seu agente responda em qualquer canal no seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à allowlist de guilda"
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

    Isso significa que o modelo selecionado deve chamar ferramentas de forma confiável. Se o Discord mostrar que está digitando e os logs mostrarem uso de tokens, mas nenhuma mensagem for postada, verifique o log da sessão em busca de texto do assistente com `didSendViaMessagingTool: false`. Isso significa que o modelo produziu uma resposta final privada em vez de chamar `message(action=send)`. Mude para um modelo mais forte em chamada de ferramentas ou use a configuração abaixo para restaurar respostas finais automáticas legadas.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar receber @mention"
      </Tab>
      <Tab title="Configuração">
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

        Para restaurar respostas finais automáticas legadas para salas de grupo/canal, defina `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje memória em canais de guilda">
    Por padrão, memória de longo prazo (MEMORY.md) só é carregada em sessões de DM. Canais de guilda não carregam MEMORY.md automaticamente.

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

Agora crie alguns canais no seu servidor do Discord e comece a conversar. Seu agente consegue ver o nome do canal, e cada canal recebe sua própria sessão isolada — então você pode configurar `#coding`, `#home`, `#research` ou o que se adequar ao seu fluxo de trabalho.

## Modelo de runtime

- Gateway é dono da conexão do Discord.
- O roteamento de respostas é determinístico: respostas de entrada do Discord voltam para o Discord.
- Metadados de guilda/canal do Discord são adicionados ao prompt do modelo como
  contexto não confiável, não como um prefixo de resposta visível para o usuário. Se um modelo copiar esse envelope
  de volta, o OpenClaw remove os metadados copiados das respostas de saída e do
  contexto de reprodução futuro.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guilda são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de Cron/Heartbeat somente texto para o Discord usa a resposta final
  visível ao assistente uma vez. Mídia e payloads de componentes estruturados permanecem
  com várias mensagens quando o agente emite vários payloads entregáveis.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas postagens em threads. O OpenClaw oferece suporte a duas formas de criá-las:

- Envie uma mensagem para o pai do fórum (`channel:<forumId>`) para criar uma thread automaticamente. O título da thread usa a primeira linha não vazia da sua mensagem.
- Use `openclaw message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar para o pai do fórum para criar uma thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemplo: criar uma thread de fórum explicitamente

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Pais de fórum não aceitam componentes do Discord. Se você precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens de agentes. Use a ferramenta de mensagem com um payload `components`. Os resultados de interação são roteados de volta para o agente como mensagens de entrada normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seletores e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor interativo de modelos com menus suspensos de provedor, modelo e runtime compatível, além de uma etapa Enviar. `/models add` foi descontinuado e agora retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e apenas o usuário que invocou pode usá-la.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome do upload quando ele deve corresponder à referência do anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona um botão de gatilho automaticamente

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
  <Tab title="Política de DM">
    `channels.discord.dmPolicy` controla o acesso por DM. `channels.discord.allowFrom` é a lista de permissão canônica de DM.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos são bloqueados (ou recebem solicitação de pareamento no modo `pairing`).

    Precedência de múltiplas contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o legado `dm.allowFrom`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seus próprios `allowFrom` e o legado `dm.allowFrom` não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` legados ainda são lidos por compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando pode fazer isso sem alterar o acesso.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos simples normalmente são resolvidos como IDs de canal quando um padrão de canal está ativo, mas IDs listados no `allowFrom` efetivo de DM da conta são tratados como destinos de DM de usuário por compatibilidade.

  </Tab>

  <Tab title="Grupos de acesso de DM">
    DMs do Discord podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

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

    Um canal de texto do Discord não tem lista de membros separada. `type: "discord.channelAudience"` modela a associação assim: o remetente da DM é membro da guilda configurada e atualmente tem permissão efetiva `ViewChannel` no canal configurado depois que substituições de cargo e canal são aplicadas.

    Exemplo: permitir que qualquer pessoa que possa ver `#maintainers` envie DM ao bot, mantendo DMs fechadas para todos os outros.

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

    Habilite a **Server Members Intent** do Discord Developer Portal para o bot ao usar grupos de acesso por audiência de canal. DMs não incluem estado de membro de guilda, então o OpenClaw resolve o membro pela REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Política de guilda">
    O tratamento de guildas é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - a guilda deve corresponder a `channels.discord.guilds` (`id` preferido, slug aceito)
    - listas de permissão opcionais de remetentes: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de cargo); se qualquer uma estiver configurada, remetentes são permitidos quando correspondem a `users` OU `roles`
    - correspondência direta por nome/tag é desabilitada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade de emergência
    - nomes/tags são compatíveis para `users`, mas IDs são mais seguros; `openclaw security audit` avisa quando entradas de nome/tag são usadas
    - se uma guilda tiver `channels` configurados, canais não listados serão negados
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

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback de runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo se `channels.defaults.groupPolicy` for `open`.

  </Tab>

  <Tab title="Menções e DMs em grupo">
    Mensagens de guilda exigem menção por padrão.

    A detecção de menções inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos compatíveis

    Ao escrever mensagens de saída do Discord, use a sintaxe canônica de menção: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para cargos. Não use a forma legada de menção por apelido `<@!USER_ID>`.

    `requireMention` é configurado por guilda/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/cargo, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - lista de permissão opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agentes baseado em cargos

Use `bindings[].match.roles` para rotear membros de guildas do Discord para agentes diferentes por ID de cargo. Vinculações baseadas em cargos aceitam apenas IDs de cargo e são avaliadas depois de vinculações por par ou par pai e antes de vinculações somente por guilda. Se uma vinculação também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

## Comandos nativos e autorização de comandos

- `commands.native` assume `"auto"` por padrão e é habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza de comandos slash do Discord durante a inicialização. Comandos registrados anteriormente podem continuar visíveis no Discord até que você os remova do app do Discord.
- A autenticação de comandos nativos usa as mesmas allowlists/políticas do Discord que o processamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na interface do Discord para usuários que não estão autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "not authorized".

Consulte [Comandos slash](/pt-BR/tools/slash-commands) para ver o catálogo e o comportamento dos comandos.

Configurações padrão de comandos slash:

- `ephemeral: true`

## Detalhes do recurso

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    Discord oferece suporte a tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`
    - `batched`

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem enviada do Discord para o turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    turno de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para conversas ambíguas em rajadas, não para cada
    turno de mensagem única.

    IDs de mensagem são expostos no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de transmissão ao vivo">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming` aceita `off` (padrão) | `partial` | `block` | `progress`. `progress` mantém um rascunho de status editável e o atualiza com o progresso de ferramentas até a entrega final; `streamMode` é um alias legado de runtime. Execute `openclaw doctor --fix` para reescrever a configuração persistida para a chave canônica.

    O padrão permanece `off` porque edições de prévia do Discord atingem limites de taxa rapidamente quando vários bots ou gateways compartilham uma conta.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` edita uma única mensagem de prévia conforme os tokens chegam.
    - `block` emite trechos no tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitado a `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de prévia pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de prévia.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla detalhes de comando/exec em linhas compactas de progresso: `raw` (padrão) ou `status` (apenas o rótulo da ferramenta).

    Ocultar texto bruto de comando/exec mantendo linhas compactas de progresso:

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

    A transmissão de prévia é somente texto; respostas com mídia retornam à entrega normal. Quando a transmissão `block` é habilitada explicitamente, o OpenClaw ignora a transmissão de prévia para evitar transmissão duplicada.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de threads">
    Contexto de histórico da guilda:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de thread:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, salvo substituição.
    - Sessões de thread herdam a seleção `/model` em nível de sessão do canal pai como fallback somente de modelo; seleções `/model` locais da thread ainda têm precedência, e o histórico de transcrição do pai não é copiado salvo quando a herança de transcrição está habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) faz novas auto-threads usarem o transcrito pai como semente. Substituições por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagens podem resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação em estágio de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Allowlists controlam quem pode acionar o agente, não uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a thread para subagentes">
    Discord pode vincular uma thread a um destino de sessão para que mensagens de acompanhamento nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove a vinculação da thread atual
    - `/agents` mostra execuções ativas e estado de vinculação
    - `/session idle <duration|off>` inspeciona/atualiza auto-unfocus por inatividade para vinculações focadas
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
    - `spawnSessions` controla a criação/vinculação automática de threads para `sessions_spawn({ thread: true })` e spawns de threads ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo de subagente para spawns vinculados a thread. Padrão: `"fork"`.
    - Chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se vinculações de thread estiverem desabilitadas para uma conta, `/focus` e operações relacionadas de vinculação de thread ficam indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculações persistentes de canal ACP">
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

    - `/acp spawn codex --bind here` vincula o canal ou thread atual no lugar e mantém mensagens futuras na mesma sessão ACP. Mensagens de thread herdam a vinculação do canal pai.
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

    Eventos de reação são transformados em eventos de sistema e anexados à sessão do Discord roteada.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração">
    Gravações de configuração iniciadas pelo canal são habilitadas por padrão.

    Isso afeta fluxos `/config set|unset` (quando os recursos de comando estão habilitados).

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
    Roteie o tráfego WebSocket do Gateway do Discord e consultas REST de inicialização (ID do aplicativo + resolução de allowlist) por meio de um proxy HTTP(S) com `channels.discord.proxy`.

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
    Habilite a resolução do PluralKit para mapear mensagens proxied para a identidade de membro do sistema:

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

    - allowlists podem usar `pk:<memberId>`
    - nomes de exibição de membros são correspondidos por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - consultas usam o ID da mensagem original e são limitadas por janela de tempo
    - se a consulta falhar, mensagens proxied são tratadas como mensagens de bot e descartadas, salvo se `allowBots=true`

  </Accordion>

  <Accordion title="Aliases de menção de saída">
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

    Exemplo apenas de status:

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
    - 1: Transmitindo (exige `activityUrl`)
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

    A presença automática mapeia a disponibilidade em tempo de execução para o status do Discord: íntegro => online, degradado ou desconhecido => ausente, esgotado ou indisponível => dnd. Substituições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (aceita o placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord aceita tratamento de aprovações baseado em botões em DMs e, opcionalmente, pode publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord habilita automaticamente aprovações nativas de exec quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja por `execApprovals.approvers` ou por `commands.ownerAllowFrom`. O Discord não infere aprovadores de exec a partir de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagens diretas. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente nativo de aprovação.

    Para comandos sensíveis de grupo somente para proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia prompts de aprovação e resultados finais de forma privada. Ele tenta primeiro a DM do Discord quando o proprietário que invocou o comando tem uma rota de proprietário do Discord; se isso não estiver disponível, recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como Telegram.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Somente aprovadores resolvidos podem usar os botões; outros usuários recebem uma negativa efêmera. Os prompts de aprovação incluem o texto do comando, portanto habilite a entrega no canal somente em canais confiáveis. Se o ID do canal não puder ser derivado da chave da sessão, o OpenClaw recorre à entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DMs para aprovadores e distribuição para canais.
    Quando esses botões estiverem presentes, eles serão a UX principal de aprovação; o OpenClaw
    só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.
    Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém o
    prompt local determinístico `/approve <id> <decision>` visível. Se o
    runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino,
    o OpenClaw envia um aviso de fallback no mesmo chat com o comando `/approve`
    exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovações seguem o contrato compartilhado do cliente Gateway (IDs `plugin:` resolvem por `plugin.approval.resolve`; outros IDs por `exec.approval.resolve`). Aprovações expiram por padrão após 30 minutos.

    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e barreiras de ação

As ações de mensagem do Discord incluem mensagens, administração de canais, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

As barreiras de ação ficam em `channels.discord.actions.*`.

Comportamento padrão das barreiras:

| Grupo de ação                                                                                                                                                           | Padrão       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado   |
| roles                                                                                                                                                                   | desabilitado |
| moderation                                                                                                                                                              | desabilitado |
| presence                                                                                                                                                                | desabilitado |

## UI de componentes v2

O OpenClaw usa componentes v2 do Discord para aprovações de exec e marcadores entre contextos. As ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; exige construir um payload de componente por meio da ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada pelos contêineres de componentes do Discord (hex).
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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato de pré-visualização com forma de onda). O gateway oferece suporte a ambos.

### Canais de voz

Checklist de configuração:

1. Habilite Message Content Intent no Discord Developer Portal.
2. Habilite Server Members Intent quando listas de permissão de funções/usuários forem usadas.
3. Convide o bot com os escopos `bot` e `applications.commands`.
4. Conceda Connect, Speak, Send Messages e Read Message History no canal de voz de destino.
5. Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Use `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de lista de permissão e política de grupo que outros comandos do Discord.

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

- `voice.tts` substitui `messages.tts` somente para reprodução de voz.
- `voice.model` substitui o LLM usado somente para respostas de canal de voz do Discord. Deixe indefinido para herdar o modelo do agente roteado.
- STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Substituições de `systemPrompt` por canal do Discord se aplicam aos turnos de transcrição de voz desse canal de voz.
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes que não são proprietários não podem acessar ferramentas somente para proprietário (por exemplo, `gateway` e `cron`).
- A voz do Discord é opt-in para configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar comandos `/vc`, o runtime de voz e a intenção de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura da intenção de estado de voz. Deixe indefinido para que a intenção acompanhe a habilitação efetiva de voz.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não estiverem definidos.
- `voice.connectTimeoutMs` controla a espera inicial por Ready do `@discordjs/voice` para `/vc join` e tentativas de entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw espera que uma sessão de voz desconectada comece a se reconectar antes de destruí-la. Padrão: `15000`.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após a atualização, colete um relatório de dependências e logs. A linha incluída de `@discordjs/voice` inclui a correção upstream de preenchimento do PR #11449 do discord.js, que encerrou a issue #11419 do discord.js.

Pipeline de canal de voz:

- A captura PCM do Discord é convertida em um arquivo temporário WAV.
- `tools.media.audio` trata STT, por exemplo `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta executa com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita texto retornado, porque a voz do Discord controla a reprodução final de TTS.
- `voice.model`, quando definido, substitui somente o LLM de resposta para este turno de canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; o áudio resultante é reproduzido no canal em que entrou.

As credenciais são resolvidas por componente: autenticação de rota de LLM para `voice.model`, autenticação de STT para `tools.media.audio` e autenticação de TTS para `messages.tts`/`voice.tts`.

### Mensagens de voz

Mensagens de voz do Discord mostram uma pré-visualização em forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita o conteúdo de texto (o Discord rejeita texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intents não permitidas usadas ou bot não vê mensagens de guilda">

    - habilite Message Content Intent
    - habilite Server Members Intent quando depender de resolução de usuário/membro
    - reinicie o gateway após alterar intents

  </Accordion>

  <Accordion title="Mensagens de guilda bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a lista de permissão de guildas em `channels.discord.guilds`
    - se o mapa `channels` da guilda existir, somente canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem lista de permissão de guilda/canal correspondente
    - `requireMention` configurado no lugar errado (deve ficar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela lista de permissão `users` da guilda/canal

  </Accordion>

  <Accordion title="Turnos longos do Discord ou respostas duplicadas">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla somente o trabalho do listener do Gateway do Discord, não o tempo de vida do turno do agente

    O Discord não aplica um tempo limite de propriedade do canal a turnos de agente enfileirados. Listeners de mensagem transferem imediatamente, e execuções do Discord enfileiradas preservam a ordenação por sessão até que o ciclo de vida da sessão/ferramenta/runtime conclua ou aborte o trabalho.

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

  <Accordion title="Avisos de tempo limite da busca de metadados do Gateway">
    O OpenClaw busca os metadados `/gateway/bot` do Discord antes de conectar. Falhas transitórias fazem fallback para a URL padrão do gateway do Discord e têm limitação de taxa nos logs.

    Ajustes de tempo limite de metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback de env quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máx.: `120000`

  </Accordion>

  <Accordion title="Reinicializações por tempo limite de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do gateway do Discord durante a inicialização e após reconexões em runtime. Configurações com várias contas e escalonamento de inicialização podem precisar de uma janela READY de inicialização maior que a padrão.

    Ajustes de tempo limite de READY:

    - inicialização com conta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicialização com várias contas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback de env de inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão de inicialização: `15000` (15 segundos), máx.: `120000`
    - runtime com conta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime com várias contas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback de env de runtime quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão de runtime: `30000` (30 segundos), máx.: `120000`

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canais.

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas a sondagem não consegue verificar totalmente as permissões.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitada: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissões para evitar comportamento em loop.
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
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - observe os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete logs e compare com o histórico upstream de recebimento DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração - Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos de alto valor do Discord">

- inicialização/autenticação: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/repetição: `mediaMaxMb` (limita uploads de saída do Discord, padrão `100MB`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões do Discord com o menor privilégio necessário.
- Se a implantação/estado de comandos estiver desatualizada, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Discord ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Chat em grupo e comportamento da lista de permissões.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e reforço de segurança.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie guildas e canais para agentes.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comandos nativos.
  </Card>
</CardGroup>
