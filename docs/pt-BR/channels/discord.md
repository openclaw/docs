---
read_when:
    - Trabalhando em recursos do canal Discord
summary: Status do suporte do bot do Discord, capacidades e configuração
title: Discord
x-i18n:
    generated_at: "2026-04-24T05:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Pronto para DMs e canais de servidor via o gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnóstico entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Criar um aplicativo e bot no Discord">
    Acesse o [Portal do Desenvolvedor do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê a ele um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você usa para seu agente OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para allowlists de função e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copiar o token do seu bot">
    Role de volta para o topo da página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Esse é seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gerar uma URL de convite e adicionar o bot ao seu servidor">
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

    Este é o conjunto básico para canais de texto normais. Se você pretende publicar em threads do Discord, incluindo fluxos de canais de fórum ou mídia que criam ou continuam uma thread, habilite também **Send Messages in Threads**.
    Copie a URL gerada na parte inferior, cole-a no navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor do Discord.

  </Step>

  <Step title="Habilitar o Modo de Desenvolvedor e coletar seus IDs">
    De volta ao app do Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do seu servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três ao OpenClaw na próxima etapa.

  </Step>

  <Step title="Permitir DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DMs para você. Clique com o botão direito no **ícone do seu servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso ativado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais do servidor, pode desabilitar DMs após o pareamento.

  </Step>

  <Step title="Definir seu token de bot com segurança (não o envie no chat)">
    O token do seu bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagens ao seu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Se o OpenClaw já estiver em execução como serviço em segundo plano, reinicie-o pelo app OpenClaw para Mac ou parando e reiniciando o processo `openclaw gateway run`.

  </Step>

  <Step title="Configurar o OpenClaw e parear">

    <Tabs>
      <Tab title="Pedir ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga isso a ele. Se o Discord for seu primeiro canal, use a aba CLI / config em vez disso.

        > "Eu já defini meu token de bot do Discord na configuração. Por favor, conclua a configuração do Discord com o User ID `<user_id>` e o Server ID `<server_id>`."
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

        Valores `token` em texto simples são suportados. Valores SecretRef também são suportados para `channels.discord.token` nos provedores env/file/exec. Consulte [Secrets Management](/pt-BR/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprovar o primeiro pareamento por DM">
    Aguarde até que o gateway esteja em execução e então envie uma DM para seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Pedir ao seu agente">
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

    Os códigos de pareamento expiram após 1 hora.

    Agora você já deve conseguir conversar com seu agente no Discord via DM.

  </Step>
</Steps>

<Note>
A resolução de token reconhece contas. Valores de token na configuração têm precedência sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Para chamadas avançadas de saída (ações de ferramenta de mensagem/canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações de envio e de leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política de conta/tentativa ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configurar um workspace de servidor

Depois que as DMs estiverem funcionando, você pode configurar seu servidor do Discord como um workspace completo no qual cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados em que só estão você e seu bot.

<Steps>
  <Step title="Adicionar seu servidor à allowlist de servidores">
    Isso permite que seu agente responda em qualquer canal do seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à allowlist de servidores"
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

  <Step title="Permitir respostas sem @mention">
    Por padrão, seu agente só responde em canais de servidor quando é mencionado com @mention. Em um servidor privado, provavelmente você vai querer que ele responda a todas as mensagens.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mentioned"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` na configuração do seu servidor:

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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planejar memória em canais de servidor">
    Por padrão, a memória de longo prazo (`MEMORY.md`) é carregada apenas em sessões de DM. Canais de servidor não carregam `MEMORY.md` automaticamente.

    <Tabs>
      <Tab title="Pedir ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo de `MEMORY.md`."
      </Tab>
      <Tab title="Manual">
        Se você precisar de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (eles são injetados em toda sessão). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor do Discord e comece a conversar. Seu agente pode ver o nome do canal, e cada canal recebe sua própria sessão isolada — assim você pode configurar `#coding`, `#home`, `#research` ou o que melhor se encaixar no seu fluxo de trabalho.

## Modelo de runtime

- O Gateway é o responsável pela conexão com o Discord.
- O roteamento de respostas é determinístico: entradas do Discord respondem de volta para o Discord.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de servidor usam chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas publicações em thread. O OpenClaw oferece suporte a duas formas de criá-las:

- Envie uma mensagem ao pai do fórum (`channel:<forumId>`) para criar automaticamente uma thread. O título da thread usa a primeira linha não vazia da sua mensagem.
- Use `openclaw message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar ao pai do fórum para criar uma thread

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

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens do agente. Use a ferramenta de mensagem com uma carga `components`. Os resultados de interação são roteados de volta ao agente como mensagens de entrada normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos suportados:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor interativo de modelo com menus suspensos de provedor e modelo, além de uma etapa Submit. A menos que `commands.modelsWrite=false`, `/models add` também oferece suporte à adição de uma nova entrada de provedor/modelo pelo chat, e modelos recém-adicionados aparecem sem reiniciar o gateway. A resposta do seletor é efêmera e apenas o usuário que o invocou pode usá-la.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome de upload quando ele precisar corresponder à referência do anexo

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
  message: "Texto de fallback opcional",
  components: {
    reusable: true,
    text: "Escolha um caminho",
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
          placeholder: "Escolha uma opção",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
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
  <Tab title="Política de DM">
    `channels.discord.dmPolicy` controla o acesso por DM (legado: `channels.discord.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`; legado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos serão bloqueados (ou receberão um prompt para pareamento no modo `pairing`).

    Precedência em várias contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos sem qualificador são ambíguos e rejeitados, a menos que um tipo explícito de destino user/channel seja fornecido.

  </Tab>

  <Tab title="Política de servidor">
    O tratamento de servidor é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - o servidor deve corresponder a `channels.discord.guilds` (`id` é preferível, slug é aceito)
    - allowlists opcionais de remetente: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de função); se qualquer um estiver configurado, remetentes são permitidos quando corresponderem a `users` OU `roles`
    - correspondência direta por nome/tag é desabilitada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade de emergência
    - nomes/tags são suportados para `users`, mas IDs são mais seguros; `openclaw security audit` emite aviso quando entradas de nome/tag são usadas
    - se um servidor tiver `channels` configurado, canais não listados serão negados
    - se um servidor não tiver bloco `channels`, todos os canais nesse servidor da allowlist serão permitidos

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

  <Tab title="Menções e DMs em grupo">
    Mensagens de servidor exigem menção por padrão.

    A detecção de menção inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos compatíveis

    `requireMention` é configurado por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionem outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - allowlist opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de servidores do Discord para agentes diferentes por ID de função. Bindings baseados em função aceitam apenas IDs de função e são avaliados após bindings peer ou parent-peer e antes de bindings somente de servidor. Se um binding também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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
- Sobrescrita por canal: `channels.discord.commands.native`.
- `commands.native=false` remove explicitamente comandos nativos do Discord previamente registrados.
- A autenticação de comando nativo usa as mesmas allowlists/políticas do Discord que o tratamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na interface do Discord para usuários não autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Slash commands](/pt-BR/tools/slash-commands) para o catálogo e o comportamento dos comandos.

Configurações padrão de comandos slash:

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
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem de saída do Discord no turno.
    `batched` anexa a referência implícita de resposta nativa do Discord somente quando o
    turno de entrada foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para chats com rajadas ambíguas, não para todo
    turno de mensagem única.

    IDs de mensagem aparecem no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de streaming ao vivo">
    O OpenClaw pode transmitir rascunhos de resposta enviando uma mensagem temporária e editando-a à medida que o texto chega. `channels.discord.streaming` aceita `off` (padrão) | `partial` | `block` | `progress`. `progress` é mapeado para `partial` no Discord; `streamMode` é um alias legado e é migrado automaticamente.

    O padrão continua sendo `off` porque edições de prévia no Discord atingem limites de taxa rapidamente quando vários bots ou gateways compartilham uma conta.

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

    - `partial` edita uma única mensagem de prévia à medida que os tokens chegam.
    - `block` emite blocos do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra, limitados por `textChunkLimit`).
    - Finais com mídia, erro e resposta explícita cancelam edições de prévia pendentes.
    - `streaming.preview.toolProgress` (padrão `true`) controla se atualizações de ferramenta/progresso reutilizam a mensagem de prévia.

    O streaming de prévia é somente texto; respostas com mídia usam a entrega normal. Quando o streaming `block` é explicitamente habilitado, o OpenClaw ignora o stream de prévia para evitar streaming duplo.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de threads">
    Contexto do histórico de servidor:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de threads:

    - Threads do Discord são roteadas como sessões de canal e herdam a configuração do canal pai, a menos que sejam sobrescritas.
    - `channels.discord.thread.inheritParent` (padrão `false`) faz com que novas auto-threads usem o transcript do pai como base. Sobrescritas por conta ficam em `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reações da ferramenta de mensagem podem resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` é preservado durante o fallback de ativação na fase de resposta.

    Tópicos de canal são injetados como contexto **não confiável**. Allowlists controlam quem pode acionar o agente, não funcionam como um limite completo de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a thread para subagentes">
    O Discord pode vincular uma thread a um destino de sessão para que mensagens subsequentes nessa thread continuem sendo roteadas para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` vincula a thread atual/nova a um destino de subagente/sessão
    - `/unfocus` remove o vínculo da thread atual
    - `/agents` mostra execuções ativas e estado de vínculo
    - `/session idle <duration|off>` inspeciona/atualiza o desfoco automático por inatividade para vínculos em foco
    - `/session max-age <duration|off>` inspeciona/atualiza a idade máxima rígida para vínculos em foco

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
        spawnSubagentSessions: false, // adesão opcional
      },
    },
  },
}
```

    Observações:

    - `session.threadBindings.*` define padrões globais.
    - `channels.discord.threadBindings.*` sobrescreve o comportamento do Discord.
    - `spawnSubagentSessions` deve ser `true` para criar/vincular threads automaticamente em `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve ser `true` para criar/vincular threads automaticamente para ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se os vínculos de thread estiverem desabilitados para uma conta, `/focus` e operações relacionadas a vínculo de thread não estarão disponíveis.

    Consulte [Sub-agents](/pt-BR/tools/subagents), [ACP Agents](/pt-BR/tools/acp-agents) e [Configuration Reference](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings persistentes de canal ACP">
    Para workspaces ACP estáveis "sempre ativos", configure bindings ACP tipados de nível superior direcionados a conversas do Discord.

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

    - `/acp spawn codex --bind here` vincula o canal ou thread atual no lugar e mantém mensagens futuras na mesma sessão ACP. Mensagens em thread herdam o binding do canal pai.
    - Em um canal ou thread vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no lugar. Bindings temporários de thread podem sobrescrever a resolução de destino enquanto estiverem ativos.
    - `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar/vincular uma thread filha via `--thread auto|here`.

    Consulte [ACP Agents](/pt-BR/tools/acp-agents) para detalhes do comportamento de binding.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por servidor:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos do sistema e anexados à sessão Discord roteada.

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
    Gravações de configuração iniciadas pelo canal são habilitadas por padrão.

    Isso afeta fluxos `/config set|unset` (quando recursos de comando estão habilitados).

    Desabilite:

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
    Roteie o tráfego WebSocket do gateway do Discord e consultas REST de inicialização (ID do aplicativo + resolução de allowlist) por um proxy HTTP(S) com `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Sobrescrita por conta:

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
    Habilite a resolução do PluralKit para mapear mensagens com proxy para a identidade do membro do sistema:

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
    - nomes de exibição de membros são correspondidos por nome/slug apenas quando `channels.discord.dangerouslyAllowNameMatching: true`
    - buscas usam o ID original da mensagem e são limitadas por janela de tempo
    - se a busca falhar, mensagens com proxy são tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuração de presença">
    Atualizações de presença são aplicadas quando você define um status ou campo de atividade, ou quando habilita presença automática.

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
      activity: "Tempo de foco",
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
      activity: "Codando ao vivo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de atividade:

    - 0: Jogando
    - 1: Streaming (requer `activityUrl`)
    - 2: Ouvindo
    - 3: Assistindo
    - 4: Personalizado (usa o texto da atividade como estado do status; emoji é opcional)
    - 5: Competindo

    Exemplo de presença automática (sinal de saúde do runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "tokens esgotados",
      },
    },
  },
}
```

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: saudável => online, degradado ou desconhecido => idle, esgotado ou indisponível => dnd. Sobrescritas de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (suporta placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte ao tratamento de aprovações por botão em DMs e pode opcionalmente publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa fallback para `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou está como `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente nativo de aprovação.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Apenas aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Prompts de aprovação incluem o texto do comando, então habilite a entrega no canal apenas em canais confiáveis. Se o ID do canal não puder ser derivado da chave de sessão, o OpenClaw usa fallback para entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente roteamento de DM do aprovador e fanout de canal.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando manual `/approve` apenas quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.

    A autenticação do Gateway e a resolução de aprovação seguem o contrato compartilhado de cliente do Gateway (IDs `plugin:` são resolvidos por `plugin.approval.resolve`; outros IDs por `exec.approval.resolve`). As aprovações expiram após 30 minutos por padrão.

    Consulte [Exec approvals](/pt-BR/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Ferramentas e controles de ação

As ações de mensagem do Discord incluem mensagens, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

Os controles de ação ficam em `channels.discord.actions.*`.

Comportamento padrão dos controles:

| Grupo de ação                                                                                                                                                             | Padrão    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado |
| roles                                                                                                                                                                     | desabilitado |
| moderation                                                                                                                                                                | desabilitado |
| presence                                                                                                                                                                  | desabilitado |

## Interface de componentes v2

O OpenClaw usa componentes v2 do Discord para aprovações de execução e marcadores entre contextos. Ações de mensagem do Discord também podem aceitar `components` para interface personalizada (avançado; requer construir uma carga de componente via ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

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

O Discord tem duas superfícies de voz distintas: **canais de voz** em tempo real (conversas contínuas) e **anexos de mensagem de voz** (o formato com prévia de forma de onda). O gateway oferece suporte a ambos.

### Canais de voz

Requisitos:

- Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- O bot precisa de permissões Connect + Speak no canal de voz de destino.

Use `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de allowlist e política de grupo que outros comandos do Discord.

Exemplo de entrada automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Observações:

- `voice.tts` sobrescreve `messages.tts` apenas para reprodução de voz.
- Turnos de transcrição de voz derivam status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes não proprietários não podem acessar ferramentas somente do proprietário (por exemplo `gateway` e `cron`).
- Voz é habilitada por padrão; defina `channels.discord.voice.enabled=false` para desabilitar.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não definidos.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, isso pode ser o bug de recebimento upstream de `@discordjs/voice` rastreado em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Mensagens de voz

Mensagens de voz do Discord mostram uma prévia de forma de onda e exigem áudio OGG/Opus. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` no host do gateway para inspecionar e converter.

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita conteúdo de texto (o Discord rejeita texto + mensagem de voz na mesma carga).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus quando necessário.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Usou intents não permitidas ou o bot não vê mensagens de servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent quando depender de resolução de usuário/membro
    - reinicie o gateway após alterar intents

  </Accordion>

  <Accordion title="Mensagens de servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a allowlist de servidor em `channels.discord.guilds`
    - se existir um mapa `channels` do servidor, apenas os canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem allowlist de servidor/canal correspondente
    - `requireMention` configurado no lugar errado (deve ficar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela allowlist `users` do servidor/canal

  </Accordion>

  <Accordion title="Manipuladores de longa duração expiram ou duplicam respostas">

    Logs típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ajuste do orçamento do listener:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ajuste do tempo limite de execução do worker:

    - conta única: `channels.discord.inboundWorker.runTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - padrão: `1800000` (30 minutos); defina `0` para desabilitar

    Linha de base recomendada:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Use `eventQueue.listenerTimeout` para configuração lenta do listener e `inboundWorker.runTimeoutMs`
    apenas se você quiser uma válvula de segurança separada para turnos de agente enfileirados.

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canal.

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas a sondagem não consegue verificar permissões completamente.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitada: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens escritas por bot são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e allowlist para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bot que mencionem o bot.

  </Accordion>

  <Accordion title="Perdas no STT de voz com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para que a lógica de recuperação de recebimento de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - monitore os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a nova entrada automática, colete logs e compare com [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Referência de configuração

Referência principal: [Configuration reference - Discord](/pt-BR/gateway/config-channels#discord).

<Accordion title="Campos do Discord de alto sinal">

- inicialização/autenticação: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker de entrada: `inboundWorker.runTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/nova tentativa: `mediaMaxMb` (limita uploads de saída do Discord, padrão `100MB`), `retry`
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões do Discord com privilégio mínimo.
- Se o estado/implantação de comandos estiver desatualizado, reinicie o gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionados

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Discord ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chat em grupo e allowlist.
  </Card>
  <Card title="Roteamento de canal" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaça e hardening.
  </Card>
  <Card title="Roteamento multiagente" icon="sitemap" href="/pt-BR/concepts/multi-agent">
    Mapeie servidores e canais para agentes.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos.
  </Card>
</CardGroup>
