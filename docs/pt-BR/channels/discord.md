---
read_when:
    - Trabalhando em recursos do canal do Discord
summary: Configuração do bot do Discord, chaves de configuração, componentes, voz e solução de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:55:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

O OpenClaw se conecta ao Discord como um bot por meio do gateway oficial do Discord. Há suporte para DMs e canais de servidor.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
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
  <Step title="Criar um aplicativo e um bot do Discord">
    No [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications), clique em **New Application** e dê um nome a ele (por exemplo, "OpenClaw").

    Abra **Bot** na barra lateral e defina **Username** como o nome do seu agente.

  </Step>

  <Step title="Ativar intents privilegiados">
    Ainda na página **Bot**, em **Privileged Gateway Intents**, ative:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para listas de permissões de funções, correspondência de nomes com IDs e grupos de acesso ao público do canal)
    - **Presence Intent** (opcional; somente para atualizações de presença)

  </Step>

  <Step title="Copiar o token do bot">
    Na página **Bot**, clique em **Reset Token** e copie o token.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

  </Step>

  <Step title="Gerar uma URL de convite e adicionar o bot ao servidor">
    Abra **OAuth2** na barra lateral. Em **OAuth2 URL Generator**, ative os escopos:

    - `bot`
    - `applications.commands`

    Na seção **Bot Permissions** exibida, ative pelo menos:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Essa é a configuração básica para canais de texto normais. Se o bot for publicar em threads — incluindo fluxos de canais de fórum ou mídia que criem ou continuem uma thread — ative também **Send Messages in Threads**.

    Copie a URL gerada, abra-a em um navegador, selecione seu servidor e clique em **Continue**. O bot agora deve aparecer no servidor.

  </Step>

  <Step title="Ativar o Modo de Desenvolvedor e coletar seus IDs">
    No aplicativo Discord, ative o Modo de Desenvolvedor para poder copiar IDs:

    1. **User Settings** (ícone de engrenagem) → **Developer** → ative **Developer Mode**
       *(em dispositivos móveis: **App Settings** → **Advanced**)*
    2. Clique com o botão direito no **ícone do servidor** → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Guarde o ID do servidor e o ID do usuário junto com o token do bot; você precisará dos três na próxima etapa.

  </Step>

  <Step title="Permitir DMs de membros do servidor">
    Para o pareamento funcionar, o Discord precisa permitir que o bot envie uma DM para você. Clique com o botão direito no **ícone do servidor** → **Privacy Settings** → ative **Direct Messages**.

    Mantenha essa opção ativada se você usa DMs do Discord com o OpenClaw. Se usa apenas canais do servidor, pode desativá-la após o pareamento.

  </Step>

  <Step title="Definir o token do bot com segurança (não o envie no chat)">
    O token do bot é um segredo. Defina-o na máquina que executa o OpenClaw antes de enviar uma mensagem ao agente:

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

    Se o OpenClaw já estiver sendo executado como serviço em segundo plano, reinicie-o pelo aplicativo OpenClaw para Mac ou interrompendo e reiniciando o processo `openclaw gateway run`.
    Para instalações como serviço gerenciado, execute `openclaw gateway install` em um shell no qual `DISCORD_BOT_TOKEN` esteja definido ou armazene a variável em `~/.openclaw/.env` para que o serviço possa resolver o SecretRef de ambiente após a reinicialização.
    Se seu host estiver bloqueado ou com limite de taxa imposto pela consulta de inicialização do aplicativo do Discord, defina o ID do aplicativo/cliente no Portal de Desenvolvedores para que a inicialização possa ignorar essa chamada REST: `channels.discord.applicationId` para a conta padrão ou `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configurar o OpenClaw e fazer o pareamento">

    <Tabs>
      <Tab title="Pedir ao seu agente">
        Converse com seu agente do OpenClaw em um canal existente (por exemplo, Telegram) e dê a instrução abaixo. Se o Discord for seu primeiro canal, use a aba de CLI/configuração.

        > "Já defini o token do meu bot do Discord na configuração. Conclua a configuração do Discord com o ID de usuário `<user_id>` e o ID do servidor `<server_id>`."
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

        Fallback de ambiente para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Para configuração automatizada ou remota, grave o mesmo bloco JSON5 com `openclaw config patch --file ./discord.patch.json5 --dry-run` e execute novamente sem `--dry-run`. Strings `token` em texto simples também funcionam, e valores SecretRef têm suporte para `channels.discord.token` nos provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

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

  <Step title="Aprovar o primeiro pareamento por DM">
    Quando o gateway estiver em execução, envie uma DM ao bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        Envie o código de pareamento ao agente em seu canal existente:

        > "Aprove este código de pareamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Os códigos de pareamento expiram após 1 hora. Depois da aprovação, converse com seu agente em uma DM do Discord.

  </Step>
</Steps>

<Note>
A resolução de tokens considera a conta. Os valores de token da configuração têm precedência sobre o fallback de ambiente, e `DISCORD_BOT_TOKEN` é usado somente para a conta padrão.
Se duas contas do Discord ativadas resolverem para o mesmo token de bot, o OpenClaw iniciará apenas um monitor de gateway para esse token: um token proveniente da configuração terá precedência sobre o fallback de ambiente; caso contrário, a primeira conta ativada terá precedência, e a conta duplicada será informada como desativada com o motivo `duplicate bot token`.
Para chamadas de saída avançadas (ferramenta de mensagens/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações de envio e de leitura/sondagem (leitura/pesquisa/busca/thread/mensagens fixadas/permissões). As configurações de política e repetição da conta ainda são obtidas da conta selecionada no snapshot ativo do runtime.
</Note>

## Recomendado: configurar um espaço de trabalho no servidor

Quando as DMs estiverem funcionando, você poderá transformar seu servidor em um espaço de trabalho completo, no qual cada canal terá sua própria sessão do agente com seu próprio contexto. Recomendado para servidores privados em que há apenas você e seu bot.

<Steps>
  <Step title="Adicionar seu servidor à lista de permissões de servidores">
    Isso permite que o agente responda em qualquer canal do servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Adicione o ID do meu servidor do Discord `<server_id>` à lista de permissões de servidores"
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

  <Step title="Permitir respostas sem @menção">
    Por padrão, o agente só responde em canais do servidor quando recebe uma @menção. Em um servidor privado, provavelmente será melhor que ele responda a todas as mensagens.

    Nos canais do servidor, as respostas normais são publicadas automaticamente por padrão. Para salas compartilhadas sempre ativas, habilite `messages.groupChat.visibleReplies: "message_tool"` para que o agente possa observar silenciosamente e publicar somente quando decidir que uma resposta no canal é útil. Isso funciona melhor com modelos de última geração e confiáveis no uso de ferramentas, como o GPT-5.6 Sol. Os eventos ambientes da sala permanecem silenciosos, a menos que a ferramenta envie algo. Consulte [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events) para ver a configuração completa do modo de observação silenciosa.

    Se o Discord mostrar o indicador de digitação e os logs mostrarem uso de tokens, mas nenhuma mensagem for publicada, verifique se o turno foi configurado como um evento ambiente de sala ou se as respostas visíveis foram configuradas para usar a ferramenta de mensagens.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar receber uma @menção"
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

  <Step title="Planejar o uso da memória nos canais do servidor">
    A memória de longo prazo (MEMORY.md) só é carregada automaticamente em sessões de DM; os canais do servidor não a carregam.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Quando eu fizer perguntas nos canais do Discord, use memory_search ou memory_get se precisar do contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Para ter contexto compartilhado em todos os canais, coloque instruções estáveis em `AGENTS.md` ou `USER.md` (injetadas em todas as sessões). Mantenha as anotações de longo prazo em `MEMORY.md` e acesse-as sob demanda com as ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie canais e comece a conversar. O agente vê o nome do canal, e cada canal é uma sessão isolada — configure `#coding`, `#home`, `#research` ou o que melhor se adequar ao seu fluxo de trabalho.

## Modelo de runtime

- O Gateway gerencia a conexão com o Discord.
- O roteamento de respostas é determinístico: respostas a mensagens recebidas do Discord voltam para o Discord.
- Os metadados de servidor/canal do Discord são adicionados ao prompt do modelo como contexto não confiável, não como prefixo de resposta visível ao usuário. Se um modelo copiar esse envelope de volta, o OpenClaw removerá os metadados copiados das respostas de saída e do contexto de reprodução futuro.
- Por padrão (`session.dmScope=main`), os chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Os canais do servidor têm chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- As DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Os comandos de barra nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), mas ainda incluem `CommandTargetSessionKey` para a sessão de conversa roteada.
- A entrega de anúncios de Cron/Heartbeat somente em texto para o Discord é condensada na resposta final visível do assistente, enviada uma única vez. As cargas de mídia e de componentes estruturados continuam sendo enviadas em várias mensagens quando o agente emite várias cargas entregáveis.

## Canais de fórum

Os canais de fórum e de mídia do Discord aceitam apenas publicações em threads. O OpenClaw oferece suporte a duas formas de criá-las:

- Envie uma mensagem ao canal pai do fórum (`channel:<forumId>`) para criar uma thread automaticamente. O título da thread será a primeira linha não vazia da mensagem (truncada para respeitar o limite de 100 caracteres do Discord para nomes de threads).
- Use `openclaw message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Envie ao canal pai do fórum para criar uma thread:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Título do tópico\nCorpo da publicação"
```

Crie explicitamente uma thread de fórum:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Título do tópico" --message "Corpo da publicação"
```

Canais pais de fórum não aceitam componentes do Discord. Se precisar de componentes, envie para a própria thread (`channel:<threadId>`).

## Componentes interativos

O OpenClaw é compatível com contêineres de componentes v2 do Discord para mensagens do agente. Use a ferramenta de mensagens com um payload `components`. Os resultados das interações são encaminhados de volta ao agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ações permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuários do Discord, tags ou `*`). Usuários que não correspondam recebem uma recusa efêmera.

Por padrão, os callbacks dos componentes expiram após 30 minutos. Defina `channels.discord.agentComponents.ttlMs` para alterar a duração do registro de callbacks da conta padrão ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para cada conta. O valor é expresso em milissegundos, deve ser um inteiro positivo e é limitado a `86400000` (24 horas). TTLs mais longos são adequados para fluxos de revisão/aprovação que precisam manter os botões utilizáveis, mas ampliam o período durante o qual uma mensagem antiga do Discord ainda pode acionar uma ação. Prefira o TTL mais curto que atenda à necessidade e mantenha o padrão quando callbacks obsoletos puderem causar surpresa.

Os comandos de barra `/model` e `/models` abrem um seletor interativo de modelos com listas suspensas de provedor, modelo e runtime compatível, além de uma etapa de envio. `/models add` está obsoleto e retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat. A resposta do seletor é efêmera e pode ser usada apenas pelo usuário que o invocou. Os menus de seleção do Discord são limitados a 25 opções; portanto, adicione entradas `provider/*` a `agents.defaults.models` quando quiser que o seletor exiba modelos descobertos dinamicamente apenas para provedores selecionados, como `openai` ou `vllm`.

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
  message: "Texto alternativo opcional",
  components: {
    reusable: true,
    text: "Escolha um caminho",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Aprovar",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Recusar", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Escolha uma opção",
          options: [
            { label: "Opção A", value: "a" },
            { label: "Opção B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detalhes",
      triggerLabel: "Abrir formulário",
      fields: [
        { type: "text", label: "Solicitante" },
        {
          type: "select",
          label: "Prioridade",
          options: [
            { label: "Baixa", value: "low" },
            { label: "Alta", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de mensagens diretas">
    `channels.discord.dmPolicy` controla o acesso por mensagens diretas. `channels.discord.allowFrom` é a lista de permissões canônica para mensagens diretas.

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um remetente em `allowFrom`)
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`)
    - `disabled`

    Se a política de mensagens diretas não estiver aberta, usuários desconhecidos serão bloqueados (ou receberão uma solicitação de pareamento no modo `pairing`).

    Precedência entre várias contas:

    - `channels.discord.accounts.default.allowFrom` aplica-se apenas à conta `default`.
    - Para uma conta, `allowFrom` tem precedência sobre o antigo `dm.allowFrom`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seus próprios `allowFrom` e o antigo `dm.allowFrom` não estão definidos.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Os campos antigos `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` ainda são lidos para fins de compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando isso pode ser feito sem alterar o acesso.

    Formato do destino de mensagens diretas para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos isolados normalmente são resolvidos como IDs de canal quando há um canal padrão ativo, mas IDs incluídos no `allowFrom` efetivo para mensagens diretas da conta são tratados como destinos de mensagens diretas de usuários para fins de compatibilidade.

  </Tab>

  <Tab title="Grupos de acesso">
    As mensagens diretas do Discord e a autorização de comandos de texto podem usar entradas dinâmicas `accessGroup:<name>` em `channels.discord.allowFrom`.

    Os nomes dos grupos de acesso são compartilhados entre os canais de mensagens. Use `type: "message.senders"` para um grupo estático cujos membros são expressos na sintaxe normal de `allowFrom` de cada canal ou `type: "discord.channelAudience"` quando o público atual com permissão `ViewChannel` de um canal do Discord deve definir a associação dinamicamente. Comportamento compartilhado dos grupos de acesso: [Grupos de acesso](/pt-BR/channels/access-groups).

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

    Um canal de texto do Discord não tem uma lista de membros separada. `type: "discord.channelAudience"` modela a associação da seguinte forma: o remetente da mensagem direta é membro do servidor configurado e, no momento, tem a permissão efetiva `ViewChannel` no canal configurado após a aplicação das substituições de função e canal.

    Exemplo: permita que qualquer pessoa que possa ver `#maintainers` envie mensagens diretas ao bot, mantendo-as fechadas para todas as outras pessoas.

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

    As consultas falham de forma restritiva. Se o Discord retornar `Missing Access`, a consulta do membro falhar ou o canal pertencer a outro servidor, o remetente da mensagem direta será tratado como não autorizado.

    Ative **Server Members Intent** no Discord Developer Portal ao usar grupos de acesso baseados no público do canal. As mensagens diretas não incluem o estado do membro do servidor; por isso, o OpenClaw resolve o membro por meio da API REST do Discord no momento da autorização.

  </Tab>

  <Tab title="Política de servidores">
    O processamento de servidores é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A configuração básica segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - o servidor deve corresponder a `channels.discord.guilds` (preferencialmente pelo `id`; slug aceito)
    - listas de remetentes permitidos opcionais: `users` (IDs estáveis recomendados) e `roles` (somente IDs de funções); se uma delas estiver configurada, os remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - a correspondência direta por nome/tag é desativada por padrão; ative `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade emergencial
    - nomes/tags são aceitos em `users`, mas IDs são mais seguros; `openclaw security audit` emite um aviso quando entradas de nome/tag são usadas
    - se um servidor tiver `channels` configurado, canais que não estiverem listados serão negados
    - se um servidor não tiver um bloco `channels`, todos os canais desse servidor permitido serão aceitos

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

    A chave antiga `allow` por canal é migrada para `enabled` por `openclaw doctor --fix`.

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback do runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo que `channels.defaults.groupPolicy` seja `open`.

  </Tab>

  <Tab title="Menções e mensagens diretas em grupo">
    Por padrão, as mensagens de servidores exigem menção.

    A detecção de menções inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot nos casos compatíveis

    Ao escrever mensagens de saída do Discord, use a sintaxe canônica de menção: `<@USER_ID>` para usuários, `<#CHANNEL_ID>` para canais e `<@&ROLE_ID>` para funções. Não use o formato antigo de menção por apelido `<@!USER_ID>`.

    `requireMention` é configurado por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente mensagens que mencionem outro usuário/função, mas não o bot (exceto @everyone/@here).

    Mensagens diretas em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - lista de permissões opcional por meio de `dm.groupChannels` (IDs ou slugs de canais)

  </Tab>
</Tabs>

### Roteamento de agentes baseado em funções

Use `bindings[].match.roles` para encaminhar membros de servidores do Discord a agentes diferentes por ID de função. Vínculos baseados em funções aceitam apenas IDs de funções e são avaliados após vínculos de pares ou pares superiores e antes de vínculos somente de servidor. Se um vínculo também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados deverão corresponder.

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
  - `commands.native=false` ignora o registro e a limpeza dos comandos de barra do Discord durante a inicialização. Os comandos registrados anteriormente podem permanecer visíveis no Discord até que você os remova do aplicativo do Discord.
  - A autenticação de comandos nativos usa as mesmas listas de permissões/políticas do Discord que o processamento normal de mensagens.
  - Os comandos ainda podem ficar visíveis na interface do Discord para usuários não autorizados; a execução aplica a autenticação do OpenClaw e responde "não autorizado".
  - Configurações padrão dos comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  Consulte [Comandos de barra](/pt-BR/tools/slash-commands) para ver o catálogo e o comportamento dos comandos.

  ## Detalhes do recurso

  <AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord aceita tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão): não há encadeamento implícito de respostas; as tags explícitas `[[reply_to_*]]` ainda são respeitadas
    - `first`: anexa a referência implícita da resposta nativa à primeira mensagem enviada ao Discord no turno
    - `all`: anexa-a a todas as mensagens enviadas
    - `batched`: anexa-a somente quando o evento recebido é um lote de várias mensagens agrupadas após debounce — útil quando você deseja respostas nativas principalmente em conversas ambíguas com mensagens em rajada, e não em cada turno com uma única mensagem

    Os IDs das mensagens são disponibilizados no contexto/histórico para que os agentes possam direcionar respostas a mensagens específicas.

  </Accordion>

  <Accordion title="Pré-visualizações de links">
    Por padrão, o Discord gera incorporações avançadas para URLs. Por padrão, o OpenClaw suprime essas incorporações geradas nas mensagens de saída do Discord, portanto, as URLs enviadas pelo agente permanecem como links simples, a menos que você habilite esse recurso:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Defina `channels.discord.accounts.<id>.suppressEmbeds` para substituir a configuração de uma conta. Os envios feitos pela ferramenta de mensagens do agente também podem passar `suppressEmbeds: false` para uma única mensagem. Payloads `embeds` explícitos do Discord não são suprimidos pela configuração padrão de pré-visualização de links.

  </Accordion>

  <Accordion title="Live stream preview">
    O OpenClaw pode transmitir respostas de rascunho enviando uma mensagem temporária e editando-a à medida que o texto chega. `channels.discord.streaming.mode` aceita `off` | `partial` | `block` | `progress` (padrão quando nenhuma chave `streaming`/legada `streamMode` está definida). `streamMode` é um alias legado; execute `openclaw doctor --fix` para regravar a configuração persistida no formato aninhado canônico `streaming`.

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

    - `off` desativa as edições de pré-visualização do Discord.
    - `partial` edita uma única mensagem de pré-visualização à medida que os tokens chegam.
    - `block` emite blocos do tamanho de rascunhos; ajuste o tamanho e os pontos de quebra com `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), limitado a `textChunkLimit`. Quando o streaming em blocos está explicitamente ativado, o OpenClaw ignora o fluxo de pré-visualização para evitar streaming duplicado.
    - `progress` mantém um único rascunho de status editável e o atualiza com o progresso das ferramentas até a entrega final; o rótulo inicial compartilhado é uma linha contínua, portanto ele sai da tela como o restante quando há trabalho suficiente.
    - Resultados finais com mídia, erro e resposta explícita cancelam as edições de pré-visualização pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se as atualizações de ferramenta/progresso reutilizam a mensagem de pré-visualização.
    - As linhas de ferramenta/progresso são renderizadas como emoji compacto + título + detalhe, quando disponíveis, por exemplo, `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (padrão `false`) ativa a inclusão de texto de comentário/preâmbulo do assistente no rascunho temporário de progresso. O comentário é limpo antes da exibição, permanece temporário e não altera a entrega da resposta final.
    - `streaming.progress.maxLineChars` controla o limite de pré-visualização de progresso por linha. O texto em prosa é abreviado nos limites das palavras; os detalhes de comandos e caminhos preservam sufixos úteis.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla os detalhes de comando/execução nas linhas compactas de progresso: `raw` (padrão) ou `status` (somente o rótulo da ferramenta).

    Oculte o texto bruto de comando/execução, mantendo linhas compactas de progresso:

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

    A transmissão de pré-visualização é somente de texto; respostas com mídia usam a entrega normal como alternativa.

  </Accordion>

  <Accordion title="Comportamento do histórico, do contexto e das threads">
    Contexto do histórico do servidor:

    - `channels.discord.historyLimit` tem como padrão `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` desativa

    Controles do histórico de mensagens diretas:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento das threads:

    - As threads do Discord são encaminhadas como sessões de canal e herdam a configuração do canal pai, salvo se houver substituição.
    - As sessões de thread herdam a seleção `/model` no nível da sessão do canal pai apenas como alternativa de modelo; as seleções `/model` locais da thread têm precedência, e o histórico da transcrição do pai não é copiado, a menos que a herança de transcrição esteja ativada.
    - `channels.discord.thread.inheritParent` (padrão `false`) permite que novas threads automáticas sejam iniciadas com base na transcrição do pai. Substituição por conta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - As reações da ferramenta de mensagens podem resolver destinos de mensagens diretas `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante a alternativa de ativação na etapa de resposta.

    Os tópicos dos canais são injetados como contexto **não confiável**. As listas de permissões controlam quem pode acionar o agente, mas não constituem um limite completo de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a threads para subagentes">
    O Discord pode vincular uma thread a um destino de sessão para que as mensagens subsequentes nessa thread continuem sendo encaminhadas para a mesma sessão (incluindo sessões de subagentes).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove a vinculação da thread atual
    - `/agents` mostra execuções ativas e o estado da vinculação
    - `/session idle <duration|off>` inspeciona/atualiza o desfoco automático por inatividade das vinculações em foco
    - `/session max-age <duration|off>` inspeciona/atualiza a idade máxima absoluta das vinculações em foco

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
    - Se as vinculações de threads estiverem desativadas para uma conta, `/focus` e as operações relacionadas de vinculação de threads ficarão indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculações persistentes de canais ACP">
    Para espaços de trabalho ACP estáveis e "sempre ativos", configure vinculações ACP tipadas de nível superior direcionadas a conversas do Discord.

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

    - `/acp spawn codex --bind here` vincula o canal ou a thread atual no local e mantém as mensagens futuras na mesma sessão ACP. As mensagens da thread herdam a vinculação do canal pai.
    - Em um canal ou uma thread vinculada, `/new` e `/reset` redefinem a mesma sessão ACP no local. Vinculações temporárias de threads podem substituir a resolução do destino enquanto estiverem ativas.
    - `spawnSessions` controla a criação/vinculação de threads filhas por meio de `--thread auto|here`.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para obter detalhes sobre o comportamento das vinculações.

  </Accordion>

  <Accordion title="Notificações de reações">
    Modo de notificação de reações por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Os eventos de reação são convertidos em eventos do sistema e anexados à sessão roteada do Discord.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji de identidade do agente como alternativa (`agents.list[].identity.emoji`; caso contrário, "👀")

    Observações:

    - O Discord aceita emojis Unicode ou nomes de emojis personalizados.
    - Use `""` para desativar a reação em um canal ou uma conta.

    **Escopo (`messages.ackReactionScope`):**

    Valores: `"all"` (MDs + grupos, incluindo eventos ambientes da sala), `"direct"` (somente MDs), `"group-all"` (todas as mensagens de grupo, exceto eventos ambientes da sala; sem MDs), `"group-mentions"` (grupos quando o bot é mencionado; **sem MDs**, padrão), `"off"` / `"none"` (desativado).

    <Note>
    O escopo padrão (`"group-mentions"`) não aciona reações de confirmação em mensagens diretas nem em eventos ambientes da sala. Para obter uma reação de confirmação em MDs recebidas do Discord e eventos silenciosos da sala, defina `messages.ackReactionScope` como `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Gravações de configuração">
    As gravações de configuração iniciadas pelo canal são ativadas por padrão. Isso afeta os fluxos `/config set|unset` (quando os recursos de comando estão ativados).

    Para desativar:

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
    O uso de proxy para o WebSocket do gateway do Discord é explícito; as conexões WebSocket não herdam as variáveis de ambiente de proxy do processo do Gateway. As consultas REST de inicialização usam esse proxy quando `channels.discord.proxy` está configurado.

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
    Ative a resolução do PluralKit para mapear mensagens intermediadas para a identidade do membro do sistema:

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
    - se a consulta falhar, as mensagens intermediadas serão tratadas como mensagens de bot e descartadas, a menos que `allowBots` permita sua passagem

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

    Atividade (o status personalizado é o tipo de atividade padrão quando `activity` está definido):

```json5
{
  channels: {
    discord: {
      activity: "Tempo de concentração",
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
      activity: "Programação ao vivo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de atividade:

    - 0: Jogando
    - 1: Transmitindo (requer `activityUrl`; `activityUrl`, por sua vez, requer `activityType: 1`)
    - 2: Ouvindo
    - 3: Assistindo
    - 4: Personalizada (usa o texto da atividade como estado do status; o emoji é opcional)
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
        exhaustedText: "token esgotado",
      },
    },
  },
}
```

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: íntegro => online, degradado ou desconhecido => ausente, esgotado ou indisponível => não perturbe. Padrões: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (deve ser menor ou igual a `intervalMs`). Substituições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (compatível com o espaço reservado `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece tratamento de aprovações por botões em mensagens diretas e pode, opcionalmente, publicar solicitações de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord ativa automaticamente as aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja por `execApprovals.approvers` ou por `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução a partir de `allowFrom` do canal, do antigo `dm.allowFrom` nem de `defaultTo` de mensagens diretas. Defina `enabled: false` para desativar explicitamente o Discord como cliente nativo de aprovação.

    Para comandos sensíveis de grupo exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, o OpenClaw envia as solicitações de aprovação e os resultados finais de forma privada. Primeiro, ele tenta usar uma mensagem direta do Discord quando o proprietário solicitante tem uma rota de proprietário no Discord; caso contrário, recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, como o Telegram.

    Quando `target` é `channel` ou `both`, a solicitação de aprovação fica visível no canal. Somente os aprovadores resolvidos podem usar os botões; os demais usuários recebem uma recusa efêmera. As solicitações de aprovação incluem o texto do comando, portanto, ative a entrega em canais somente em canais confiáveis. Se o ID do canal não puder ser derivado da chave da sessão, o OpenClaw recorre à entrega por mensagem direta.

    O Discord renderiza os botões de aprovação compartilhados usados por outros canais de chat; o adaptador nativo do Discord adiciona principalmente o roteamento de mensagens diretas para aprovadores e a distribuição para canais. Quando esses botões estão presentes, eles são a experiência de aprovação principal; o OpenClaw só deve incluir um comando manual `/approve` quando o resultado da ferramenta indicar que as aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho. Se o runtime de aprovação nativa do Discord não estiver ativo, o OpenClaw mantém visível a solicitação local determinística `/approve <id> <decision>`. Se o runtime estiver ativo, mas um cartão nativo não puder ser entregue a nenhum destino, o OpenClaw enviará um aviso alternativo no mesmo chat com o comando `/approve` exato da aprovação pendente.

    A autenticação do Gateway e a resolução de aprovações seguem o contrato de cliente compartilhado do Gateway (IDs `plugin:` são resolvidos por `plugin.approval.resolve`; os demais IDs, por `exec.approval.resolve`). Por padrão, as aprovações expiram após 30 minutos.

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

| Grupo de ações                                                                                                                                                             | Padrão     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ativado    |
| roles                                                                                                                                                                    | desativado |
| moderation                                                                                                                                                               | desativado |
| presence                                                                                                                                                                 | desativado |

## Interface de componentes v2

O OpenClaw usa os componentes v2 do Discord para aprovações de execução e marcadores entre contextos. As ações de mensagens do Discord também podem aceitar `components` para interfaces personalizadas (avançado; exige a construção de uma carga útil de componentes por meio da ferramenta do Discord), enquanto os antigos `embeds` continuam disponíveis, mas não são recomendados.

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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagens de voz** (o formato de prévia com forma de onda). O Gateway é compatível com ambas.

### Canais de voz

Lista de verificação da configuração:

1. Ative Message Content Intent no Discord Developer Portal.
2. Ative Server Members Intent quando listas de permissões de funções/usuários forem usadas.
3. Convide o bot com os escopos `bot` e `applications.commands`.
4. Conceda Connect, Speak, Send Messages e Read Message History no canal de voz de destino.
5. Ative os comandos nativos (`commands.native` ou `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Use `/vc join|leave|status` para controlar as sessões. O comando usa o agente padrão da conta e segue as mesmas regras de lista de permissões e política de grupo dos demais comandos do Discord.

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

- A voz do Discord é opcional em configurações somente de texto; defina `channels.discord.voice.enabled=true` (ou mantenha um bloco `channels.discord.voice` existente) para habilitar os comandos `/vc`, o runtime de voz e a intenção de gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` pode substituir explicitamente a assinatura da intenção; deixe essa opção sem definir para acompanhar a habilitação efetiva da voz.
- `voice.mode` controla o fluxo da conversa. O padrão é `agent-proxy`: um front-end de voz em tempo real gerencia o momento dos turnos, as interrupções e a reprodução, delega o trabalho substancial ao agente OpenClaw encaminhado por meio de `openclaw_agent_consult` e trata o resultado como um prompt digitado no Discord por esse interlocutor. `stt-tts` mantém o fluxo em lote mais antigo de STT seguido de TTS. `bidi` permite que o modelo em tempo real converse diretamente, enquanto disponibiliza `openclaw_agent_consult` para o cérebro do OpenClaw.
- `voice.agentSession` controla qual conversa do OpenClaw recebe os turnos de voz. Deixe essa opção sem definir para usar a própria sessão do canal de voz ou defina `{ mode: "target", target: "channel:<text-channel-id>" }` para fazer o canal de voz atuar como a extensão de microfone/alto-falante de uma sessão existente de canal de texto do Discord, como `#maintainers`.
- `voice.model` substitui o cérebro do agente OpenClaw para respostas de voz no Discord e consultas em tempo real. Deixe essa opção sem definir para herdar o modelo do agente encaminhado. Ela é separada de `voice.realtime.model`.
- `voice.followUsers` permite que o bot entre, mude de canal e saia da voz do Discord com usuários selecionados. Consulte [Seguir usuários na voz](#follow-users-in-voice).
- `agent-proxy` encaminha a fala por `discord-voice`, que preserva a autorização normal de proprietário e de ferramentas para o interlocutor e a sessão de destino, mas oculta a ferramenta `tts` do agente porque a voz do Discord é responsável pela reprodução. Por padrão, `agent-proxy` concede à consulta acesso completo a ferramentas equivalente ao do proprietário para interlocutores proprietários (`voice.realtime.toolPolicy: "owner"`) e dá forte preferência à consulta do agente OpenClaw antes de respostas substanciais (`voice.realtime.consultPolicy: "always"`). Nesse modo padrão `always`, a camada em tempo real não fala automaticamente frases de preenchimento antes da resposta da consulta; ela captura e transcreve a fala e, em seguida, reproduz a resposta encaminhada do OpenClaw. Se várias respostas de consultas forçadas forem concluídas enquanto o Discord ainda estiver reproduzindo a primeira resposta, as respostas posteriores de fala exata serão enfileiradas até que a reprodução fique ociosa, em vez de substituir a fala no meio de uma frase.
- No modo `stt-tts`, o STT usa `tools.media.audio`; `voice.model` não afeta a transcrição.
- Nos modos em tempo real, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configuram a sessão de áudio em tempo real. Para usar o OpenAI Realtime 2.1 com o cérebro Codex, use `voice.realtime.model: "gpt-realtime-2.1"` e `voice.model: "openai/gpt-5.6-sol"`.
- Por padrão, os modos de voz em tempo real incluem pequenos arquivos de perfil `IDENTITY.md`, `USER.md` e `SOUL.md` nas instruções do provedor em tempo real, para que turnos diretos rápidos mantenham a mesma identidade, fundamentação no usuário e persona do agente OpenClaw encaminhado. Defina `voice.realtime.bootstrapContextFiles` como um subconjunto para personalizar isso ou como `[]` para desabilitar. Somente esses arquivos de perfil são compatíveis; `AGENTS.md` permanece no contexto normal do agente. O contexto de perfil injetado não substitui `openclaw_agent_consult` para trabalhos no workspace, fatos atuais, consulta à memória ou ações respaldadas por ferramentas.
- No modo em tempo real `agent-proxy` da OpenAI, defina `voice.realtime.requireWakeName: true` para manter a voz em tempo real do Discord em silêncio até que uma transcrição comece ou termine com um nome de ativação. Os nomes de ativação configurados devem ter uma ou duas palavras. Se `voice.realtime.wakeNames` não estiver definido, o OpenClaw usará o `name` do agente encaminhado mais `OpenClaw`, recorrendo ao ID do agente mais `OpenClaw`. A exigência de nome de ativação desabilita a resposta automática do provedor em tempo real, encaminha os turnos aceitos pelo fluxo de consulta ao agente OpenClaw e fornece uma breve confirmação falada quando um nome de ativação inicial é reconhecido na transcrição parcial, antes da chegada da transcrição final.
- O provedor em tempo real da OpenAI aceita os nomes atuais de eventos do Realtime 2 e aliases legados compatíveis com o Codex para eventos de áudio de saída e transcrição, permitindo que snapshots compatíveis do provedor variem sem descartar o áudio do assistente.
- `voice.realtime.bargeIn` controla se os eventos de início de fala no Discord interrompem a reprodução em tempo real ativa. Se não estiver definido, ele acompanha a configuração de interrupção por áudio de entrada do provedor em tempo real.
- `voice.realtime.minBargeInAudioEndMs` controla a duração mínima da reprodução do assistente antes que uma interrupção em tempo real da OpenAI trunque o áudio. Padrão: `250`. Defina `0` para interrupção imediata em salas com pouco eco ou aumente o valor para configurações de alto-falantes com muito eco.
- `voice.tts` substitui `messages.tts` somente para a reprodução de voz de `stt-tts`; os modos em tempo real usam `voice.realtime.speakerVoice`. Para usar uma voz da OpenAI na reprodução do Discord, defina `voice.tts.provider: "openai"` e escolha uma voz de conversão de texto em fala em `voice.tts.providers.openai.speakerVoice`. `cedar` é uma boa opção de sonoridade masculina no modelo atual de TTS da OpenAI.
- As substituições de `systemPrompt` por canal do Discord se aplicam aos turnos de transcrição de voz desse canal de voz.
- Os turnos de transcrição de voz determinam o status de proprietário com base em `allowFrom` (ou `dm.allowFrom`) do Discord para comandos e ações de canal restritos ao proprietário. A visibilidade das ferramentas do agente segue a política de ferramentas configurada para a sessão encaminhada.
- Se `voice.autoJoin` tiver várias entradas para o mesmo servidor, o OpenClaw entrará no último canal configurado para esse servidor.
- `voice.allowedChannels` é uma lista de permissões opcional de permanência. Deixe essa opção sem definir para permitir que `/vc join` entre em qualquer canal de voz autorizado do Discord. Quando definida, `/vc join`, a entrada automática na inicialização e as mudanças de estado de voz do bot ficam restritas às entradas `{ guildId, channelId }` listadas. Defina-a como um array vazio para negar todas as entradas em voz do Discord. Se o Discord mover o bot para fora da lista de permissões, o OpenClaw sairá desse canal e entrará novamente no destino de entrada automática configurado, quando houver um disponível.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados às opções de entrada do `@discordjs/voice`; os padrões do upstream são `daveEncryption=true` e `decryptionFailureTolerance=24`.
- O OpenClaw usa o codec `libopus-wasm` incluído para receber voz do Discord e reproduzir PCM bruto em tempo real. Ele inclui uma compilação WebAssembly fixada da libopus e não exige complementos nativos do opus.
- `voice.connectTimeoutMs` controla a espera inicial pelo estado Ready do `@discordjs/voice` nas tentativas de `/vc join` e entrada automática. Padrão: `30000`.
- `voice.reconnectGraceMs` controla por quanto tempo o OpenClaw aguarda que uma sessão de voz desconectada comece a se reconectar antes de destruí-la. Padrão: `15000`.
- No modo `stt-tts`, a reprodução de voz não para apenas porque outro usuário começou a falar. Para evitar ciclos de realimentação, o OpenClaw ignora novas capturas de voz enquanto o TTS está sendo reproduzido; fale após o término da reprodução para iniciar o próximo turno. Os modos em tempo real encaminham os inícios de fala como sinais de interrupção ao provedor em tempo real.
- Nos modos em tempo real, o eco dos alto-falantes captado por um microfone aberto pode parecer uma interrupção e interromper a reprodução. Para salas do Discord com muito eco, defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que a OpenAI interrompa automaticamente ao detectar áudio de entrada. Adicione `voice.realtime.bargeIn: true` se ainda quiser que os eventos de início de fala do Discord interrompam a reprodução ativa. A ponte em tempo real da OpenAI ignora truncamentos de reprodução menores que `voice.realtime.minBargeInAudioEndMs`, considerando-os provavelmente eco ou ruído, e os registra como ignorados em vez de limpar a reprodução do Discord.
- `voice.captureSilenceGraceMs` controla por quanto tempo o OpenClaw aguarda depois que o Discord informa que um interlocutor parou de falar antes de finalizar esse segmento de áudio para STT. Padrão: `2000`; aumente esse valor se o Discord dividir pausas normais em transcrições parciais fragmentadas.
- Quando ElevenLabs é o provedor de TTS selecionado, a reprodução de voz do Discord usa TTS por streaming e começa a partir do fluxo de resposta do provedor. Provedores sem suporte a streaming recorrem ao fluxo de arquivo temporário sintetizado.
- O OpenClaw monitora falhas de descriptografia na recepção e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em um curto intervalo.
- Se os logs de recepção mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` após uma atualização, colete um relatório de dependências e os logs. A versão incluída do `@discordjs/voice` contém a correção upstream de preenchimento do PR #11449 do discord.js, que encerrou a issue #11419 do discord.js.
- Os eventos de recepção `The operation was aborted` são esperados quando o OpenClaw finaliza um segmento capturado de um interlocutor; são diagnósticos detalhados, não avisos.
- Os logs detalhados de voz do Discord incluem uma prévia limitada a uma linha da transcrição STT para cada segmento de interlocutor aceito, permitindo que a depuração mostre tanto o lado do usuário quanto o lado da resposta do agente sem despejar texto de transcrição ilimitado.
- No modo `agent-proxy`, o fallback de consulta forçada ignora fragmentos de transcrição provavelmente incompletos, como texto terminado em `...` ou em um conector final como "e", além de encerramentos obviamente não acionáveis como "já volto" ou "tchau". Os logs mostram `forced agent consult skipped reason=...` quando isso impede uma resposta obsoleta na fila.

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
- Quando um usuário seguido entra em um canal de voz permitido, o OpenClaw entra nesse canal. Quando o usuário muda de canal, o OpenClaw o acompanha. Quando o usuário seguido ativo se desconecta, o OpenClaw sai.
- Se vários usuários seguidos estiverem no mesmo servidor e o usuário seguido ativo sair, o OpenClaw mudará para o canal de outro usuário seguido rastreado antes de sair do servidor. Se vários usuários seguidos mudarem ao mesmo tempo, prevalecerá o evento de estado de voz observado mais recentemente.
- `allowedChannels` ainda se aplica. Um usuário seguido em um canal não permitido é ignorado, e uma sessão controlada pelo acompanhamento muda para outro usuário seguido ou sai.
- O OpenClaw reconcilia eventos de estado de voz perdidos na inicialização e em um intervalo limitado. A reconciliação examina os servidores configurados e limita as consultas REST por execução, portanto listas `followUsers` muito grandes podem levar mais de um intervalo para convergir.
- Se o Discord ou um administrador mover o bot enquanto ele estiver seguindo um usuário, o OpenClaw reconstruirá a sessão de voz e preservará o controle por acompanhamento quando o destino for permitido. Se o bot for movido para fora de `allowedChannels`, o OpenClaw sairá e entrará novamente no destino configurado, quando houver um.
- A recuperação de recepção DAVE pode sair e entrar novamente no mesmo canal após falhas repetidas de descriptografia. As sessões controladas pelo acompanhamento mantêm esse controle durante o fluxo de recuperação, portanto uma desconexão posterior do usuário seguido ainda fará o bot sair do canal.

Escolha entre os modos de entrada:

- Use `followUsers` em configurações pessoais ou operacionais nas quais o bot deve estar automaticamente na voz quando você estiver.
- Use `autoJoin` para bots de salas fixas que devem estar presentes mesmo quando nenhum usuário rastreado estiver na voz.
- Use `/vc join` para entradas pontuais ou salas nas quais a presença automática na voz seria inesperada.

Codec de voz do Discord:

- Os logs de recepção de voz mostram `discord voice: opus decoder: libopus-wasm`.
- A reprodução em tempo real codifica PCM estéreo bruto de 48 kHz em Opus com o mesmo pacote `libopus-wasm` incluído antes de entregar os pacotes ao `@discordjs/voice`.
- A reprodução de arquivos e de streams de provedores transcodifica para PCM estéreo bruto de 48 kHz com ffmpeg e, em seguida, usa `libopus-wasm` para o fluxo de pacotes Opus enviado ao Discord.

Pipeline de STT seguido de TTS:

- A captura PCM do Discord é convertida em um arquivo WAV temporário.
- `tools.media.audio` lida com STT, por exemplo, `openai/gpt-4o-mini-transcribe`.
- A transcrição é enviada pelo ingresso e roteamento do Discord enquanto o LLM de resposta é executado com uma política de saída de voz que oculta a ferramenta `tts` do agente e solicita o texto retornado, pois a voz do Discord controla a reprodução final de TTS.
- `voice.model`, quando definido, substitui somente o LLM de resposta para este turno do canal de voz.
- `voice.tts` é mesclado sobre `messages.tts`; provedores com suporte a streaming alimentam o reprodutor diretamente; caso contrário, o arquivo de áudio resultante é reproduzido no canal em que o bot entrou.

Exemplo de sessão de canal de voz padrão com proxy de agente:

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

Sem um bloco `voice.agentSession`, cada canal de voz recebe sua própria sessão roteada do OpenClaw. Por exemplo, `/vc join channel:234567890123456789` conversa com a sessão desse canal de voz do Discord. O modelo em tempo real é apenas a interface de voz; solicitações substanciais são encaminhadas ao agente OpenClaw configurado. Se o modelo em tempo real produzir uma transcrição final sem chamar a ferramenta de consulta, o OpenClaw força a consulta como fallback para que o padrão continue funcionando como uma conversa com o agente.

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

No modo `agent-proxy`, o bot entra no canal de voz configurado, mas os turnos do agente OpenClaw usam a sessão roteada normal e o agente do canal de destino. A sessão de voz em tempo real fala o resultado retornado no canal de voz. O agente supervisor ainda pode usar as ferramentas normais de mensagens de acordo com sua política de ferramentas, inclusive enviando uma mensagem separada no Discord se essa for a ação apropriada.

Enquanto uma execução delegada do OpenClaw estiver ativa, novas transcrições de voz do Discord serão tratadas como controle da execução em andamento antes que outro turno do agente seja iniciado. Frases como "status", "cancele isso", "use a correção menor" ou "quando terminar, verifique também os testes" são classificadas como entrada de status, cancelamento, orientação ou acompanhamento para a sessão ativa. Os resultados de status, cancelamento, orientação aceita e acompanhamento são falados no canal de voz para que o chamador saiba se o OpenClaw tratou a solicitação.

Formas de destino úteis:

- `target: "channel:123456789012345678"` faz o roteamento por uma sessão de canal de texto do Discord.
- `target: "123456789012345678"` é tratado como destino de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` faz o roteamento por essa sessão de mensagem direta.

Exemplo do OpenAI Realtime em ambiente com muito eco:

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

Use isto quando o modelo ouvir a própria reprodução do Discord por um microfone aberto, mas você ainda quiser interrompê-lo falando. O OpenClaw impede que a OpenAI interrompa automaticamente ao receber áudio bruto de entrada, enquanto `bargeIn: true` permite que eventos de início de fala do Discord e o áudio de um falante já ativo cancelem respostas ativas em tempo real antes que o próximo turno capturado chegue à OpenAI. Sinais de interrupção muito precoces, com `audioEndMs` abaixo de `minBargeInAudioEndMs`, são tratados como provável eco/ruído e ignorados para que o modelo não seja interrompido no primeiro quadro da reprodução.

Logs de voz esperados:

- Ao entrar: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Ao iniciar o modo em tempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- No áudio do falante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Quando uma fala obsoleta é ignorada: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- Ao concluir uma resposta em tempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Ao interromper/redefinir a reprodução: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Em uma consulta em tempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Na resposta do agente: `discord voice: agent turn answer ...`
- Ao enfileirar uma fala exata: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido por `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Ao detectar uma interrupção por fala: `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido por `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Em uma interrupção em tempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido por `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ou `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Quando eco/ruído é ignorado: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Quando a interrupção por fala está desativada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Com a reprodução ociosa: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar áudio interrompido, leia os logs de voz em tempo real como uma linha do tempo:

1. `realtime audio playback started` significa que o Discord começou a reproduzir o áudio do assistente. A partir deste ponto, a ponte começa a contar os blocos de saída do assistente, os bytes PCM do Discord, os bytes em tempo real do provedor e a duração do áudio sintetizado.
2. `realtime speaker turn opened` indica que um falante do Discord se tornou ativo. Se a reprodução já estiver ativa e `bargeIn` estiver habilitado, isso poderá ser seguido por `barge-in detected source=speaker-start`.
3. `realtime input audio started` indica o primeiro quadro de áudio efetivamente recebido nesse turno do falante. `outputActive=true` ou um `outputAudioMs` diferente de zero aqui significa que o microfone está enviando entrada enquanto a reprodução do assistente ainda está ativa.
4. `barge-in detected source=active-speaker-audio` significa que o OpenClaw detectou áudio ao vivo do falante enquanto a reprodução do assistente estava ativa. Isso é útil para distinguir uma interrupção real de um evento de início de fala do Discord sem áudio útil.
5. `barge-in requested reason=...` significa que o OpenClaw solicitou ao provedor em tempo real que cancelasse ou truncasse a resposta ativa. Ele inclui `outputAudioMs`, `outputActive` e `playbackChunks` para que você possa ver quanto áudio do assistente havia sido efetivamente reproduzido antes da interrupção.
6. `realtime audio playback stopped reason=...` é o ponto local de redefinição da reprodução do Discord. O motivo indica quem interrompeu a reprodução: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` resume o turno de entrada capturado. `chunks=0` ou `hasAudio=false` significa que o turno do falante foi aberto, mas nenhum áudio utilizável chegou à ponte em tempo real. `interruptedPlayback=true` significa que esse turno de entrada coincidiu com a saída do assistente e acionou a lógica de interrupção por fala.

Campos úteis:

- `outputAudioMs`: duração do áudio do assistente gerado pelo provedor em tempo real antes da linha do log.
- `audioMs`: duração do áudio do assistente contabilizada pelo OpenClaw antes de a reprodução parar.
- `elapsedMs`: tempo decorrido entre a abertura e o fechamento do fluxo de reprodução ou do turno do falante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados para ou recebidos da voz do Discord.
- `realtimeBytes`: bytes PCM no formato do provedor enviados para ou recebidos do provedor em tempo real.
- `playbackChunks`: blocos de áudio do assistente encaminhados ao Discord para a resposta ativa.
- `sinceLastAudioMs`: intervalo entre o último quadro de áudio capturado do falante e o fechamento do turno do falante.

Padrões comuns:

- Uma interrupção imediata com `source=active-speaker-audio`, `outputAudioMs` pequeno e o mesmo usuário por perto geralmente indica que o eco do alto-falante está entrando no microfone. Aumente `voice.realtime.minBargeInAudioEndMs`, reduza o volume do alto-falante, use fones de ouvido ou defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido por `speaker turn closed ... hasAudio=false` significa que o Discord informou o início de fala, mas nenhum áudio chegou ao OpenClaw. Isso pode ser um evento transitório da voz do Discord, um comportamento do gate de ruído ou um cliente que ativou brevemente o microfone.
- `audio playback stopped reason=stream-close` sem uma interrupção por fala ou `provider-clear-audio` nas proximidades significa que o fluxo local de reprodução do Discord terminou inesperadamente. Verifique os logs anteriores do provedor e do reprodutor do Discord.
- `capture ignored during playback (barge-in disabled)` significa que o OpenClaw descartou intencionalmente a entrada enquanto o áudio do assistente estava ativo. Habilite `voice.realtime.bargeIn` se quiser que a fala interrompa a reprodução.
- `barge-in ignored ... outputActive=false` significa que o VAD do Discord ou do provedor detectou fala, mas o OpenClaw não tinha uma reprodução ativa para interromper. Isso não deve interromper o áudio.

As credenciais são resolvidas por componente: autenticação da rota do LLM para `voice.model`, autenticação de STT para `tools.media.audio`, autenticação de TTS para `messages.tts`/`voice.tts` e autenticação do provedor em tempo real para `voice.realtime.providers` ou a configuração de autenticação normal do provedor.

### Mensagens de voz

As mensagens de voz do Discord exibem uma prévia da forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do Gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita o conteúdo de texto (o Discord rejeita texto + mensagem de voz na mesma carga útil).
- Qualquer formato de áudio é aceito; o OpenClaw o converte para OGG/Opus conforme necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intenções não permitidas foram usadas ou o bot não vê mensagens do servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent quando depender da resolução de usuários/membros
    - reinicie o Gateway após alterar as intents

  </Accordion>

  <Accordion title="Mensagens do servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a lista de permissões do servidor em `channels.discord.guilds`
    - se existir um mapa `channels` para um servidor, somente os canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Menção não obrigatória, mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem uma lista de permissões correspondente para o servidor/canal
    - `requireMention` configurado no local errado (deve estar em `channels.discord.guilds` ou em uma entrada de canal)
    - remetente bloqueado pela lista de permissões `users` do servidor/canal

  </Accordion>

  <Accordion title="Interações prolongadas no Discord ou respostas duplicadas">

    Logs típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Opções de configuração da fila do Gateway do Discord:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - isso controla somente o trabalho do listener do Gateway do Discord, não a duração da interação do agente

    O Discord não aplica um tempo limite controlado pelo canal às interações enfileiradas do agente. Os listeners de mensagens transferem o trabalho imediatamente, e as execuções enfileiradas do Discord preservam a ordem por sessão até que o ciclo de vida da sessão/ferramenta/runtime seja concluído ou aborte o trabalho.

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

  <Accordion title="Avisos de tempo limite na consulta de metadados do Gateway">
    O OpenClaw obtém os metadados `/gateway/bot` do Discord antes de se conectar. Em caso de falhas transitórias, ele usa como alternativa a URL padrão do Gateway do Discord, e os logs têm limitação de frequência.

    Opções de tempo limite dos metadados:

    - conta única: `channels.discord.gatewayInfoTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - alternativa por variável de ambiente quando a configuração não está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - padrão: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicializações por tempo limite de READY do Gateway">
    O OpenClaw aguarda o evento `READY` do Gateway do Discord durante a inicialização e após reconexões do runtime. Configurações com várias contas e inicialização escalonada podem precisar de uma janela de READY inicial maior que a padrão.

    Opções de tempo limite de READY:

    - inicialização com conta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicialização com várias contas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - alternativa por variável de ambiente na inicialização quando a configuração não está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - padrão na inicialização: `15000` (15 segundos), máximo: `120000`
    - runtime com conta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime com várias contas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - alternativa por variável de ambiente no runtime quando a configuração não está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - padrão no runtime: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Inconsistências na auditoria de permissões">
    As verificações de permissões de `channels status --probe` funcionam somente com IDs numéricos de canais.

    Se você usar chaves de slug, a correspondência em tempo de execução ainda poderá funcionar, mas a verificação não poderá validar totalmente as permissões.

  </Accordion>

  <Accordion title="Problemas com mensagens diretas e pareamento">

    - Mensagens diretas desativadas: `channels.discord.dm.enabled=false`
    - Política de mensagens diretas desativada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops entre bots">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissões para evitar comportamentos em loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bots que mencionem o bot.

    O OpenClaw também inclui [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection). Sempre que `allowBots` permite que mensagens criadas por bots cheguem ao despacho, o Discord mapeia o evento recebido para os fatos de `(account, channel, bot pair)`, e a proteção genérica de pares suprime o par depois que ele ultrapassa o orçamento de eventos configurado. A proteção evita loops descontrolados entre dois bots que anteriormente precisavam ser interrompidos pelos limites de taxa do Discord; ela não afeta implantações com um único bot nem respostas únicas de bots que permaneçam dentro do orçamento.

    Configurações padrão (ativas quando `allowBots` está definido):

    - `maxEventsPerWindow: 20` -- o par de bots pode trocar 20 mensagens dentro da janela deslizante
    - `windowSeconds: 60` -- duração da janela deslizante
    - `cooldownSeconds: 60` -- quando o limite é atingido, todas as mensagens adicionais entre bots, em qualquer direção, são descartadas por um minuto

    Configure o padrão compartilhado uma vez em `channels.defaults.botLoopProtection` e, em seguida, substitua-o no Discord quando um fluxo de trabalho legítimo precisar de mais margem. A ordem de precedência é:

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
      // Substituição opcional para todo o Discord. Os blocos de conta substituem campos
      // individuais e herdam daqui os campos omitidos.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha escuta outros bots somente quando eles o mencionam.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo escuta todas as mensagens do Discord enviadas por bots.
          allowBots: true,
          mentionAliases: {
            // Permite que Bravo escreva uma menção a Alpha no Discord com o ID de usuário configurado.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Permite até cinco mensagens por minuto antes de suprimir o par.
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

  <Accordion title="Interrupções do STT de voz com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para que a lógica de recuperação da recepção de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão do upstream) e ajuste somente se necessário
    - monitore os logs em busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a reentrada automática, colete os logs e compare-os com o histórico upstream de recepção do DAVE em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Referência de configuração — Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos do Discord de alto valor diagnóstico">

- inicialização/autenticação: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- fila de eventos: `eventQueue.listenerTimeout` (limite do listener, padrão `120000`), `eventQueue.maxQueueSize` (padrão `10000`), `eventQueue.maxConcurrency` (padrão `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (padrão `2000`), `maxLinesPerMessage` (padrão `17`)
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (as chaves planas legadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` são migradas para `streaming.*` por `openclaw doctor --fix`)
- mídia/repetição: `mediaMaxMb` (limita os uploads de saída do Discord, padrão `100`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interface: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` no nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (prefira `DISCORD_BOT_TOKEN` em ambientes supervisionados).
- Conceda permissões do Discord com o menor privilégio possível.
- Se a implantação ou o estado dos comandos estiver desatualizado, reinicie o Gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Discord com o Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chats em grupo e da lista de permissões.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas aos agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e proteção.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento dos comandos nativos.
  </Card>
</CardGroup>
