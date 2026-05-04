---
read_when:
    - Trabalhando em recursos de canais do Discord
summary: Status do suporte a robôs do Discord, capacidades e configuração
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

Pronto para DMs e canais de guild via o Gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo dos comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnóstico entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crie um aplicativo e bot do Discord">
    Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê a ele um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você dá ao seu agente OpenClaw.

  </Step>

  <Step title="Ative intents privilegiados">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e ative:

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

    Role para baixo até **OAuth2 URL Generator** e ative:

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

    Este é o conjunto básico para canais de texto normais. Se você pretende postar em threads do Discord, incluindo fluxos de canais de fórum ou mídia que criam ou continuam uma thread, ative também **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no seu navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor Discord.

  </Step>

  <Step title="Ative o Modo de Desenvolvedor e colete seus IDs">
    De volta ao aplicativo Discord, você precisa ativar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três para o OpenClaw na próxima etapa.

  </Step>

  <Step title="Permita DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso ativado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais de guild, pode desativar DMs após o pareamento.

  </Step>

  <Step title="Defina o token do seu bot com segurança (não o envie no chat)">
    Seu token de bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagens ao seu agente.

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

    Se o OpenClaw já estiver em execução como um serviço em segundo plano, reinicie-o pelo aplicativo OpenClaw para Mac ou parando e reiniciando o processo `openclaw gateway run`.
    Para instalações de serviço gerenciado, execute `openclaw gateway install` a partir de um shell onde `DISCORD_BOT_TOKEN` esteja presente, ou armazene a variável em `~/.openclaw/.env`, para que o serviço possa resolver o env SecretRef após a reinicialização.
    Se seu host estiver bloqueado ou com limite de taxa pela consulta de aplicativo na inicialização do Discord, defina o ID do aplicativo/cliente Discord no Portal de Desenvolvedores para que a inicialização possa pular essa chamada REST. Use `channels.discord.applicationId` para a conta padrão, ou `channels.discord.accounts.<accountId>.applicationId` quando você executar vários bots Discord.

  </Step>

  <Step title="Configure o OpenClaw e faça o pareamento">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e informe-o. Se Discord for seu primeiro canal, use a aba CLI / config em vez disso.

        > "Já defini meu token de bot do Discord na configuração. Conclua a configuração do Discord com User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
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

        Para configuração via script ou remota, escreva o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e depois execute novamente sem `--dry-run`. Valores `token` em texto simples são compatíveis. Valores SecretRef também são compatíveis para `channels.discord.token` entre provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

        Para vários bots Discord, mantenha cada token de bot e ID de aplicativo sob sua conta. Um `channels.discord.applicationId` de nível superior é herdado pelas contas, então só o defina ali quando todas as contas devem usar o mesmo ID de aplicativo.

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
    Aguarde até que o gateway esteja em execução e, em seguida, envie uma DM ao seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
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
A resolução de tokens reconhece contas. Valores de token na configuração têm precedência sobre fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Se duas contas Discord ativadas resolverem para o mesmo token de bot, o OpenClaw inicia apenas um monitor de Gateway para esse token. Um token vindo da configuração tem precedência sobre o fallback de env padrão; caso contrário, a primeira conta ativada tem precedência e a conta duplicada é relatada como desativada.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado para essa chamada. Isso se aplica a ações de envio e leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política/tentativa da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configure um workspace de guild

Depois que as DMs estiverem funcionando, você pode configurar seu servidor Discord como um workspace completo em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados em que é apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à lista de permissões de guild">
    Isso permite que seu agente responda em qualquer canal do seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à lista de permissões de guild"
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

  <Step title="Permita respostas sem @mention">
    Por padrão, seu agente só responde em canais de guild quando recebe @mention. Para um servidor privado, você provavelmente quer que ele responda a todas as mensagens.

    Em canais de guild, respostas finais normais do assistente permanecem privadas por padrão. A saída visível no Discord deve ser enviada explicitamente com a ferramenta `message`, para que o agente possa observar por padrão e só postar quando decidir que uma resposta no canal é útil.

    Isso significa que o modelo selecionado deve chamar ferramentas de forma confiável. Se o Discord mostrar digitação e os logs mostrarem uso de tokens, mas nenhuma mensagem publicada, verifique o log da sessão para texto do assistente com `didSendViaMessagingTool: false`. Isso significa que o modelo produziu uma resposta final privada em vez de chamar `message(action=send)`. Troque para um modelo mais forte em chamadas de ferramenta ou use a configuração abaixo para restaurar respostas finais automáticas legadas.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar receber @mention"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` na sua configuração de guild:

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

  <Step title="Planeje memória em canais de guild">
    Por padrão, a memória de longo prazo (MEMORY.md) carrega apenas em sessões de DM. Canais de guild não carregam MEMORY.md automaticamente.

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

Agora crie alguns canais no seu servidor Discord e comece a conversar. Seu agente consegue ver o nome do canal, e cada canal recebe sua própria sessão isolada — então você pode configurar `#coding`, `#home`, `#research` ou o que se encaixar no seu fluxo de trabalho.

## Modelo de runtime

- O Gateway controla a conexão com o Discord.
- O roteamento de respostas é determinístico: respostas recebidas do Discord retornam ao Discord.
- Metadados de guild/canal do Discord são adicionados ao prompt do modelo como contexto não confiável, não como prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope de volta, o OpenClaw remove os metadados copiados das respostas de saída e do contexto de replay futuro.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guild são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs de grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos de barra nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de cron/heartbeat somente texto ao Discord usa a resposta final visível ao assistente uma vez. Payloads de mídia e componentes estruturados permanecem como múltiplas mensagens quando o agente emite vários payloads entregáveis.

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

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens de agentes. Use a ferramenta de mensagem com um payload `components`. Os resultados de interação são roteados de volta para o agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos de barra `/model` e `/models` abrem um seletor interativo de modelo com menus suspensos de provedor, modelo e runtime compatível, além de uma etapa Enviar. `/models add` foi descontinuado e agora retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e somente o usuário que a invocou pode usá-la.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para múltiplos arquivos
- Use `filename` para substituir o nome do upload quando ele deve corresponder à referência do anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona um botão de disparo automaticamente

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
    `channels.discord.dmPolicy` controla o acesso a DMs. `channels.discord.allowFrom` é a lista de permissões canônica para DMs.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos são bloqueados (ou recebem solicitação de pareamento no modo `pairing`).

    Precedência de múltiplas contas:

    - `channels.discord.accounts.default.allowFrom` se aplica somente à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o `dm.allowFrom` legado.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` e o `dm.allowFrom` legado não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` legados ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando pode fazer isso sem alterar o acesso.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos simples normalmente são resolvidos como IDs de canal quando um padrão de canal está ativo, mas IDs listados no `allowFrom` efetivo de DM da conta são tratados como destinos de DM de usuário para compatibilidade.

  </Tab>

  <Tab title="Grupos de acesso de DM">
    DMs do Discord podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

    Nomes de grupos de acesso são compartilhados entre canais de mensagem. Use `type: "message.senders"` para um grupo estático cujos membros são expressos na sintaxe normal de `allowFrom` de cada canal, ou `type: "discord.channelAudience"` quando o público atual de `ViewChannel` de um canal do Discord deve definir a associação dinamicamente. O comportamento compartilhado de grupos de acesso está documentado aqui: [Grupos de acesso](/pt-BR/channels/access-groups).

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

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação assim: o remetente da DM é membro da guild configurada e atualmente tem permissão efetiva de `ViewChannel` no canal configurado após a aplicação de substituições de função e canal.

    Exemplo: permitir que qualquer pessoa que possa ver `#maintainers` envie DM ao bot, mantendo as DMs fechadas para todos os demais.

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

    As consultas falham fechadas. Se o Discord retornar `Missing Access`, a consulta de membro falhar ou o canal pertencer a uma guild diferente, o remetente da DM será tratado como não autorizado.

    Ative a **Server Members Intent** do Portal de Desenvolvedor do Discord para o bot ao usar grupos de acesso baseados em público de canal. DMs não incluem estado de membro da guild, então o OpenClaw resolve o membro via REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Política de guild">
    O tratamento de guilds é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - a guild deve corresponder a `channels.discord.guilds` (`id` preferido, slug aceito)
    - listas de permissões opcionais de remetentes: `users` (IDs estáveis recomendados) e `roles` (somente IDs de função); se qualquer uma for configurada, remetentes são permitidos quando correspondem a `users` OU `roles`
    - correspondência direta por nome/tag é desabilitada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` somente como modo de compatibilidade emergencial
    - nomes/tags são compatíveis para `users`, mas IDs são mais seguros; `openclaw security audit` alerta quando entradas de nome/tag são usadas
    - se uma guild tiver `channels` configurado, canais não listados serão negados
    - se uma guild não tiver bloco `channels`, todos os canais dessa guild na lista de permissões serão permitidos

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

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback em runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo se `channels.defaults.groupPolicy` for `open`.

  </Tab>

  <Tab title="Menções e DMs de grupo">
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
    - lista de permissões opcional via `dm.groupChannels` (IDs ou slugs de canal)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de guild do Discord para diferentes agentes por ID de função. Bindings baseados em função aceitam somente IDs de função e são avaliados após bindings de peer ou parent-peer e antes de bindings somente de guild. Se um binding também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

## Comandos nativos e autenticação de comando

- `commands.native` tem como padrão `"auto"` e é habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` ignora o registro e a limpeza de comandos de barra do Discord durante a inicialização. Comandos registrados anteriormente podem continuar visíveis no Discord até que você os remova do aplicativo do Discord.
- A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o tratamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na IU do Discord para usuários que não estão autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Veja [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo e o comportamento dos comandos.

Configurações padrão de comandos de barra:

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

    Observação: `off` desabilita o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem enviada do Discord no turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    turno de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para conversas ambíguas em rajadas, não para cada
    turno de mensagem única.

    IDs de mensagem são expostos no contexto/histórico para que os agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de transmissão ao vivo">
    O OpenClaw pode transmitir respostas em rascunho enviando uma mensagem temporária e editando-a conforme o texto chega. `channels.discord.streaming` aceita `off` (padrão) | `partial` | `block` | `progress`. `progress` mantém um rascunho de status editável e o atualiza com o progresso da ferramenta até a entrega final; `streamMode` é um alias legado e é migrado automaticamente.

    O padrão continua sendo `off` porque edições de prévia do Discord atingem limites de taxa rapidamente quando vários bots ou gateways compartilham uma conta.

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
    - `block` emite blocos do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitado a `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de prévia pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de prévia.

    A transmissão de prévia é somente texto; respostas com mídia voltam para a entrega normal. Quando a transmissão `block` é habilitada explicitamente, o OpenClaw ignora o fluxo de prévia para evitar transmissão duplicada.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de thread">
    Contexto de histórico de guilda:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de thread:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, a menos que sejam substituídas.
    - Sessões de thread herdam a seleção `/model` em nível de sessão do canal pai como fallback apenas de modelo; seleções `/model` locais da thread ainda têm precedência e o histórico da transcrição pai não é copiado, a menos que a herança de transcrição esteja habilitada.
    - `channels.discord.thread.inheritParent` (padrão `false`) opta novas auto-threads por propagação a partir da transcrição pai. Substituições por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagem podem resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação no estágio de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Listas de permissões controlam quem pode acionar o agente, não são uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a threads para subagentes">
    O Discord pode vincular uma thread a um destino de sessão para que mensagens subsequentes nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove o vínculo da thread atual
    - `/agents` mostra execuções ativas e estado de vínculo
    - `/session idle <duration|off>` inspeciona/atualiza o auto-desfoque por inatividade para vínculos focados
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
    - `spawnSessions` controla a criação/vinculação automática de threads para `sessions_spawn({ thread: true })` e criações de thread do ACP. Padrão: `true`.
    - `defaultSpawnContext` controla o contexto nativo de subagente para criações vinculadas a thread. Padrão: `"fork"`.
    - Chaves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` são migradas por `openclaw doctor --fix`.
    - Se vínculos de thread estiverem desabilitados para uma conta, `/focus` e operações relacionadas de vínculo de thread não estarão disponíveis.

    Veja [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vínculos persistentes de canal ACP">
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

    - `/acp spawn codex --bind here` vincula o canal ou a thread atual no local e mantém mensagens futuras na mesma sessão ACP. Mensagens de thread herdam o vínculo do canal pai.
    - Em um canal ou thread vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no local. Vínculos temporários de thread podem substituir a resolução de destino enquanto estiverem ativos.
    - `spawnSessions` controla a criação/vinculação de threads filhas via `--thread auto|here`.

    Veja [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes do comportamento de vínculo.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por guilda:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos do sistema e anexados à sessão roteada do Discord.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração">
    Gravações de configuração iniciadas por canal são habilitadas por padrão.

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
    Roteie o tráfego WebSocket do Gateway do Discord e buscas REST de inicialização (ID do aplicativo + resolução de lista de permissões) por meio de um proxy HTTP(S) com `channels.discord.proxy`.

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
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Observações:

    - listas de permissões podem usar `pk:<memberId>`
    - nomes de exibição de membros são correspondidos por nome/slug somente quando `channels.discord.dangerouslyAllowNameMatching: true`
    - buscas usam o ID da mensagem original e são restritas por janela de tempo
    - se a busca falhar, mensagens com proxy são tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Aliases de menção de saída">
    Use `mentionAliases` quando agentes precisarem de menções de saída determinísticas para usuários conhecidos do Discord. As chaves são identificadores sem o `@` inicial; os valores são IDs de usuário do Discord. Identificadores desconhecidos, `@everyone`, `@here` e menções dentro de spans de código Markdown são deixados inalterados.

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

    Exemplo de presença automática (sinal de integridade em tempo de execução):

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

    Presença automática mapeia disponibilidade em tempo de execução para status do Discord: saudável => online, degradada ou desconhecida => ocioso, esgotada ou indisponível => dnd. Substituições opcionais de texto:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (oferece suporte ao placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte ao tratamento de aprovação baseado em botões em DMs e pode opcionalmente publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord ativa automaticamente as aprovações de execução nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução a partir de `allowFrom` do canal, do `dm.allowFrom` legado ou de `defaultTo` de mensagem direta. Defina `enabled: false` para desativar explicitamente o Discord como cliente de aprovação nativo.

    Para comandos de grupo sensíveis e exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia solicitações de aprovação e resultados finais em privado. Ele tenta primeiro a DM do Discord quando o proprietário que invocou o comando tem uma rota de proprietário do Discord; se isso não estiver disponível, recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como Telegram.

    Quando `target` é `channel` ou `both`, a solicitação de aprovação fica visível no canal. Somente aprovadores resolvidos podem usar os botões; outros usuários recebem uma negativa efêmera. As solicitações de aprovação incluem o texto do comando, portanto habilite a entrega em canal apenas em canais confiáveis. Se o ID do canal não puder ser derivado da chave de sessão, o OpenClaw recorre à entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DM para aprovadores e distribuição para canais.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando `/approve` manual somente quando o resultado da ferramenta indicar que
    aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.
    Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém a
    solicitação determinística local `/approve <id> <decision>` visível. Se o
    runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino,
    o OpenClaw envia um aviso de fallback no mesmo chat com o comando `/approve`
    exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovação seguem o contrato compartilhado do cliente Gateway (IDs `plugin:` são resolvidos por `plugin.approval.resolve`; outros IDs por `exec.approval.resolve`). Aprovações expiram após 30 minutos por padrão.

    Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e portões de ação

As ações de mensagem do Discord incluem ações de mensagens, administração de canais, moderação, presença e metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

Os portões de ação ficam em `channels.discord.actions.*`.

Comportamento padrão dos portões:

| Grupo de ações                                                                                                                                                           | Padrão    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado |
| roles                                                                                                                                                                    | desabilitado |
| moderation                                                                                                                                                               | desabilitado |
| presence                                                                                                                                                                 | desabilitado |

## UI Components v2

O OpenClaw usa componentes v2 do Discord para aprovações de execução e marcadores entre contextos. As ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer construir um payload de componente pela ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato de prévia com forma de onda). O Gateway oferece suporte a ambos.

### Canais de voz

Checklist de configuração:

1. Habilite Message Content Intent no Discord Developer Portal.
2. Habilite Server Members Intent quando allowlists de funções/usuários forem usadas.
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

- `voice.tts` substitui `messages.tts` apenas para reprodução de voz.
- `voice.model` substitui o LLM usado apenas para respostas em canais de voz do Discord. Deixe sem definir para herdar o modelo do agente roteado.
- STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Substituições de `systemPrompt` do Discord por canal se aplicam aos turnos de transcrição de voz desse canal de voz.
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes que não são proprietários não podem acessar ferramentas exclusivas do proprietário (por exemplo, `gateway` e `cron`).
- A voz do Discord é opcional para configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar comandos `/vc`, o runtime de voz e a intenção Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura de intenção de estado de voz. Deixe sem definir para que a intenção siga a habilitação efetiva de voz.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados às opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não forem definidos.
- `voice.connectTimeoutMs` controla a espera inicial por Ready de `@discordjs/voice` para `/vc join` e tentativas de entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw aguarda que uma sessão de voz desconectada comece a se reconectar antes de destruí-la. Padrão: `15000`.
- O OpenClaw também observa falhas de descriptografia no recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após a atualização, colete um relatório de dependências e logs. A linha `@discordjs/voice` incluída contém a correção upstream de preenchimento do PR #11449 do discord.js, que fechou a issue #11419 do discord.js.

Pipeline de canal de voz:

- A captura PCM do Discord é convertida em um arquivo temporário WAV.
- `tools.media.audio` lida com STT, por exemplo `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta roda com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita texto retornado, porque a voz do Discord controla a reprodução TTS final.
- `voice.model`, quando definido, substitui apenas o LLM de resposta para esse turno de canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; o áudio resultante é reproduzido no canal conectado.

As credenciais são resolvidas por componente: autenticação da rota LLM para `voice.model`, autenticação STT para `tools.media.audio` e autenticação TTS para `messages.tts`/`voice.tts`.

### Mensagens de voz

Mensagens de voz do Discord mostram uma prévia com forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita o conteúdo de texto (o Discord rejeita texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intents não permitidas usadas ou bot não vê mensagens da guilda">

    - habilite Message Content Intent
    - habilite Server Members Intent quando depender da resolução de usuário/membro
    - reinicie o Gateway após alterar intents

  </Accordion>

  <Accordion title="Mensagens da guilda bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a allowlist de guilda em `channels.discord.guilds`
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

    O Discord não aplica um timeout controlado pelo canal a turnos de agente enfileirados. Listeners de mensagem fazem a transferência imediatamente, e execuções do Discord enfileiradas preservam a ordenação por sessão até que o ciclo de vida da sessão/ferramenta/runtime conclua ou aborte o trabalho.

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
    O OpenClaw busca metadados `/gateway/bot` do Discord antes de conectar. Falhas transitórias recorrem à URL padrão de Gateway do Discord e têm taxa limitada nos logs.

    Ajustes de timeout de metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback de env quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicializações por timeout de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões em tempo de execução. Configurações com várias contas e escalonamento de inicialização podem precisar de uma janela de READY de inicialização maior que o padrão.

    Controles de timeout de READY:

    - conta única na inicialização: `channels.discord.gatewayReadyTimeoutMs`
    - várias contas na inicialização: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback de env na inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão de inicialização: `15000` (15 segundos), máx.: `120000`
    - conta única em tempo de execução: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - várias contas em tempo de execução: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback de env em tempo de execução quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão em tempo de execução: `30000` (30 segundos), máx.: `120000`

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canais.

    Se você usa chaves de slug, a correspondência em tempo de execução ainda pode funcionar, mas o probe não consegue verificar permissões completamente.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desativada: `channels.discord.dm.enabled=false`
    - política de DM desativada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissões para evitar comportamento de loop.
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
    - monitore os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete os logs e compare com o histórico upstream de recebimento do DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração - Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos de Discord de alto sinal">

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
- Conceda permissões do Discord com privilégio mínimo.
- Se a implantação/estado de comandos estiver obsoleto, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionados

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
    Modelo de ameaça e endurecimento.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie guildas e canais para agentes.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento de comando nativo.
  </Card>
</CardGroup>
