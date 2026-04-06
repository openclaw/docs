---
read_when:
    - Trabalhando em recursos do canal Discord
summary: Status do suporte ao bot do Discord, capacidades e configuração
title: Discord
x-i18n:
    generated_at: "2026-04-06T03:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54af2176a1b4fa1681e3f07494def0c652a2730165058848000e71a59e2a9d08
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: pronto para DMs e canais de servidor por meio do gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos e fluxo de reparo entre canais.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Criar um aplicativo e bot no Discord">
    Acesse o [Discord Developer Portal](https://discord.com/developers/applications) e clique em **New Application**. Dê a ele um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você usa para seu agente OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para allowlists por função e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copiar o token do seu bot">
    Role de volta para o topo da página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Este é o seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gerar uma URL de convite e adicionar o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você vai gerar uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role para baixo até **OAuth2 URL Generator** e habilite:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Habilite:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Copie a URL gerada na parte inferior, cole-a no navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deverá ver seu bot no servidor do Discord.

  </Step>

  <Step title="Habilitar o Modo de Desenvolvedor e coletar seus IDs">
    De volta ao app do Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do seu servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três ao OpenClaw na próxima etapa.

  </Step>

  <Step title="Permitir DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do seu servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso habilitado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais do servidor, pode desabilitar DMs após o pareamento.

  </Step>

  <Step title="Definir seu token de bot com segurança (não o envie no chat)">
    O token do seu bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagem ao seu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Se o OpenClaw já estiver em execução como um serviço em segundo plano, reinicie-o pelo app OpenClaw Mac ou parando e reiniciando o processo `openclaw gateway run`.

  </Step>

  <Step title="Configurar o OpenClaw e fazer o pareamento">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e informe isso. Se o Discord for seu primeiro canal, use a aba CLI / config em vez disso.

        > "Eu já defini meu token de bot do Discord na configuração. Conclua a configuração do Discord com o User ID `<user_id>` e o Server ID `<server_id>`."
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

        Valores `token` em texto simples são suportados. Valores SecretRef também são suportados para `channels.discord.token` nos providers env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprovar o primeiro pareamento por DM">
    Espere até que o gateway esteja em execução e então envie uma DM para seu bot no Discord. Ele responderá com um código de pareamento.

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

    Os códigos de pareamento expiram após 1 hora.

    Agora você já deve conseguir conversar com seu agente no Discord por DM.

  </Step>
</Steps>

<Note>
A resolução de token considera a conta. Valores de token na configuração têm precedência sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Para chamadas avançadas de saída (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações do tipo enviar e ler/sondar (por exemplo read/search/fetch/thread/pins/permissions). As configurações de política da conta/repetição ainda vêm da conta selecionada no snapshot ativo do runtime.
</Note>

## Recomendado: configurar um workspace de servidor

Quando as DMs estiverem funcionando, você poderá configurar seu servidor do Discord como um workspace completo, em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados em que há apenas você e seu bot.

<Steps>
  <Step title="Adicionar seu servidor à allowlist de servidores">
    Isso permite que seu agente responda em qualquer canal do seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
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
    Por padrão, seu agente só responde em canais de servidor quando é @mencionado. Em um servidor privado, você provavelmente vai querer que ele responda a toda mensagem.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
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

  <Step title="Planejar a memória em canais de servidor">
    Por padrão, a memória de longo prazo (MEMORY.md) só é carregada em sessões de DM. Canais de servidor não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo do MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisar de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (eles são injetados em toda sessão). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor do Discord e comece a conversar. Seu agente pode ver o nome do canal, e cada canal recebe sua própria sessão isolada — então você pode configurar `#coding`, `#home`, `#research` ou o que melhor se encaixar no seu fluxo de trabalho.

## Modelo de runtime

- O gateway controla a conexão com o Discord.
- O roteamento de respostas é determinístico: respostas recebidas do Discord voltam para o Discord.
- Por padrão (`session.dmScope=main`), chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Canais de servidor usam chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), mantendo ainda `CommandTargetSessionKey` para a sessão de conversa roteada.

## Canais de fórum

Os canais de fórum e mídia do Discord aceitam apenas postagens em tópicos. O OpenClaw oferece suporte a duas formas de criá-las:

- Envie uma mensagem ao canal pai do fórum (`channel:<forumId>`) para criar um tópico automaticamente. O título do tópico usa a primeira linha não vazia da sua mensagem.
- Use `openclaw message thread create` para criar um tópico diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar ao canal pai do fórum para criar um tópico

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemplo: criar explicitamente um tópico de fórum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Canais pais de fórum não aceitam componentes do Discord. Se você precisar de componentes, envie para o próprio tópico (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres Discord components v2 para mensagens do agente. Use a ferramenta de mensagem com um payload `components`. Os resultados de interação são roteados de volta ao agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos suportados:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seletores e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor de modelo interativo com listas suspensas de provider e modelo, além de uma etapa Submit. A resposta do seletor é efêmera, e apenas o usuário que o invocou pode usá-la.

Anexos de arquivo:

- blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo por `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
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
    `channels.discord.dmPolicy` controla o acesso por DM (legado: `channels.discord.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.discord.allowFrom` inclua `"*"`; legado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos serão bloqueados (ou receberão um prompt para pareamento no modo `pairing`).

    Precedência de múltiplas contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos simples são ambíguos e rejeitados, a menos que um tipo de destino explícito de usuário/canal seja fornecido.

  </Tab>

  <Tab title="Política de servidor">
    O tratamento de servidores é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - o servidor deve corresponder a `channels.discord.guilds` (`id` é preferido, slug é aceito)
    - allowlists opcionais de remetente: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de função); se qualquer um estiver configurado, remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - correspondência direta por nome/tag é desabilitada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade emergencial
    - nomes/tags são suportados para `users`, mas IDs são mais seguros; `openclaw security audit` alerta quando entradas de nome/tag são usadas
    - se um servidor tiver `channels` configurado, canais não listados serão negados
    - se um servidor não tiver um bloco `channels`, todos os canais desse servidor em allowlist serão permitidos

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
    Mensagens em servidores exigem menção por padrão.

    A detecção de menção inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos suportados

    `requireMention` é configurado por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - allowlist opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de servidor do Discord a agentes diferentes por ID de função. Bindings baseados em função aceitam apenas IDs de função e são avaliados após bindings por peer ou parent-peer e antes de bindings somente por servidor. Se um binding também definir outros campos de correspondência (por exemplo `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

## Configuração no Developer Portal

<AccordionGroup>
  <Accordion title="Criar app e bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copie o token do bot

  </Accordion>

  <Accordion title="Intents privilegiadas">
    Em **Bot -> Privileged Gateway Intents**, habilite:

    - Message Content Intent
    - Server Members Intent (recomendado)

    Presence intent é opcional e só é necessária se você quiser receber atualizações de presença. Definir a presença do bot (`setPresence`) não exige habilitar atualizações de presença para membros.

  </Accordion>

  <Accordion title="Escopos OAuth e permissões de linha de base">
    Gerador de URL OAuth:

    - escopos: `bot`, `applications.commands`

    Permissões típicas de linha de base:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Evite `Administrator`, a menos que seja explicitamente necessário.

  </Accordion>

  <Accordion title="Copiar IDs">
    Habilite o Discord Developer Mode e então copie:

    - ID do servidor
    - ID do canal
    - ID do usuário

    Prefira IDs numéricos na configuração do OpenClaw para auditorias e sondagens confiáveis.

  </Accordion>
</AccordionGroup>

## Comandos nativos e autenticação de comandos

- `commands.native` tem como padrão `"auto"` e é habilitado para Discord.
- Sobrescrita por canal: `channels.discord.commands.native`.
- `commands.native=false` remove explicitamente comandos nativos do Discord previamente registrados.
- A autenticação de comandos nativos usa as mesmas allowlists/políticas do Discord que o tratamento normal de mensagens.
- Os comandos ainda podem estar visíveis na interface do Discord para usuários que não estão autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Comandos slash](/pt-BR/tools/slash-commands) para catálogo e comportamento de comandos.

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
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem de saída do Discord do turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    turno recebido foi um lote com debounce de várias mensagens. Isso é útil
    quando você quer respostas nativas principalmente para chats ambíguos e intensos, e não para todo
    turno com uma única mensagem.

    IDs de mensagem são expostos no contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de transmissão ao vivo">
    O OpenClaw pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega.

    - `channels.discord.streaming` controla a transmissão da prévia (`off` | `partial` | `block` | `progress`, padrão: `off`).
    - O padrão permanece `off` porque edições de prévia no Discord podem atingir limites de taxa rapidamente, especialmente quando vários bots ou gateways compartilham a mesma conta ou tráfego de servidor.
    - `progress` é aceito para consistência entre canais e é mapeado para `partial` no Discord.
    - `channels.discord.streamMode` é um alias legado e é migrado automaticamente.
    - `partial` edita uma única mensagem de prévia à medida que os tokens chegam.
    - `block` emite blocos do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra).

    Exemplo:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Padrões de fragmentação do modo `block` (limitados por `channels.discord.textChunkLimit`):

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

    A transmissão de prévia é somente texto; respostas com mídia voltam para a entrega normal.

    Observação: a transmissão de prévia é separada da transmissão em blocos. Quando a transmissão em blocos é explicitamente
    habilitada para o Discord, o OpenClaw ignora a transmissão de prévia para evitar transmissão dupla.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de tópicos">
    Contexto de histórico de servidor:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de tópicos:

    - tópicos do Discord são roteados como sessões de canal
    - metadados do tópico pai podem ser usados para vinculação à sessão pai
    - a configuração do tópico herda a configuração do canal pai, a menos que exista uma entrada específica para o tópico

    Tópicos de canal são injetados como contexto **não confiável** (não como prompt de sistema).
    O contexto de resposta e de mensagem citada atualmente permanece como recebido.
    As allowlists do Discord principalmente controlam quem pode acionar o agente, e não uma fronteira completa de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a tópico para subagentes">
    O Discord pode vincular um tópico a um destino de sessão para que mensagens seguintes nesse tópico continuem sendo roteadas para a mesma sessão (incluindo sessões de subagentes).

    Comandos:

    - `/focus <target>` vincula o tópico atual/novo a um destino de subagente/sessão
    - `/unfocus` remove o vínculo do tópico atual
    - `/agents` mostra execuções ativas e estado de vínculo
    - `/session idle <duration|off>` inspeciona/atualiza o desfoco automático por inatividade para vínculos focados
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Observações:

    - `session.threadBindings.*` define padrões globais.
    - `channels.discord.threadBindings.*` sobrescreve o comportamento do Discord.
    - `spawnSubagentSessions` deve ser `true` para criar/vincular automaticamente tópicos para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve ser `true` para criar/vincular automaticamente tópicos para ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se os vínculos de tópico estiverem desabilitados para uma conta, `/focus` e operações relacionadas de vínculo de tópico ficarão indisponíveis.

    Consulte [Subagentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

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

    - `/acp spawn codex --bind here` vincula o canal ou tópico atual do Discord no local e mantém mensagens futuras roteadas para a mesma sessão ACP.
    - Isso ainda pode significar "iniciar uma nova sessão ACP do Codex", mas não cria por si só um novo tópico do Discord. O canal existente continua sendo a superfície de chat.
    - O Codex ainda pode ser executado em seu próprio `cwd` ou workspace de backend em disco. Esse workspace é estado de runtime, não um tópico do Discord.
    - Mensagens de tópico podem herdar o vínculo ACP do canal pai.
    - Em um canal ou tópico vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no local.
    - Vínculos temporários de tópico ainda funcionam e podem sobrescrever a resolução de destino enquanto estiverem ativos.
    - `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar/vincular um tópico filho via `--thread auto|here`. Não é necessário para `/acp spawn ... --bind here` no canal atual.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes do comportamento de vínculos.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por servidor:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos de sistema e anexados à sessão Discord roteada.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback do emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
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

  <Accordion title="Proxy do gateway">
    Roteie o tráfego WebSocket do gateway do Discord e consultas REST de inicialização (ID do aplicativo + resolução de allowlist) por meio de um proxy HTTP(S) com `channels.discord.proxy`.

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

  <Accordion title="Suporte a PluralKit">
    Habilite a resolução de PluralKit para mapear mensagens com proxy para a identidade do membro do sistema:

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
    - nomes de exibição de membro são correspondidos por nome/slug apenas quando `channels.discord.dangerouslyAllowNameMatching: true`
    - buscas usam o ID da mensagem original e são limitadas por janela de tempo
    - se a busca falhar, mensagens com proxy são tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuração de presença">
    Atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando habilita presença automática.

    Exemplo apenas com status:

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

    Exemplo de presença automática (sinal de saúde do runtime):

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

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: saudável => online, degradado ou desconhecido => idle, esgotado ou indisponível => dnd. Sobrescritas opcionais de texto:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (suporta o placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte a tratamento de aprovações com botões em DMs e pode opcionalmente publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa fallback para `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja por `execApprovals.approvers` ou por `commands.ownerAllowFrom`. O Discord não infere aprovadores de execução a partir de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desabilitar explicitamente o Discord como cliente nativo de aprovação.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Apenas aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Os prompts de aprovação incluem o texto do comando, então habilite a entrega em canal apenas em canais confiáveis. Se o ID do canal não puder ser derivado da chave da sessão, o OpenClaw usa fallback para entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord principalmente adiciona roteamento de DM para aprovadores e fanout de canal.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou que aprovação manual é o único caminho.

    A autenticação do gateway para esse manipulador usa o mesmo contrato compartilhado de resolução de credenciais que outros clientes do gateway:

    - autenticação local com prioridade para env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` e depois `gateway.auth.*`)
    - em modo local, `gateway.remote.*` pode ser usado como fallback apenas quando `gateway.auth.*` não está definido; SecretRefs locais configurados, mas não resolvidos, falham em modo fechado
    - suporte a modo remoto via `gateway.remote.*` quando aplicável
    - sobrescritas de URL são seguras para sobrescrita: sobrescritas de CLI não reutilizam credenciais implícitas, e sobrescritas de env usam apenas credenciais de env

    Comportamento da resolução de aprovação:

    - IDs prefixados com `plugin:` são resolvidos por `plugin.approval.resolve`.
    - Outros IDs são resolvidos por `exec.approval.resolve`.
    - O Discord não faz um salto extra de fallback de exec para plugin aqui; o prefixo
      do id decide qual método do gateway ele chama.

    Aprovações de execução expiram após 30 minutos por padrão. Se aprovações falharem com
    IDs de aprovação desconhecidos, verifique a resolução do aprovador, a habilitação do recurso e
    se o tipo de id de aprovação entregue corresponde à solicitação pendente.

    Documentação relacionada: [Aprovações de execução](/pt-BR/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Ferramentas e controles de ação

As ações de mensagem do Discord incluem mensagens, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

Os controles de ação ficam em `channels.discord.actions.*`.

Comportamento padrão dos controles:

| Grupo de ação                                                                                                                                                             | Padrão   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado |
| roles                                                                                                                                                                     | desabilitado |
| moderation                                                                                                                                                                | desabilitado |
| presence                                                                                                                                                                  | desabilitado |

## Interface components v2

O OpenClaw usa Discord components v2 para aprovações de execução e marcadores entre contextos. Ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer construir um payload de componente pela ferramenta discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada por contêineres de componentes do Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` são ignorados quando components v2 estão presentes.

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

## Canais de voz

O OpenClaw pode entrar em canais de voz do Discord para conversas contínuas em tempo real. Isso é separado de anexos de mensagem de voz.

Requisitos:

- Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- O bot precisa de permissões Connect + Speak no canal de voz de destino.

Use o comando nativo exclusivo do Discord `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de allowlist e group policy dos outros comandos do Discord.

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
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes que não são proprietários não podem acessar ferramentas exclusivas do proprietário (por exemplo `gateway` e `cron`).
- Voz é habilitada por padrão; defina `channels.discord.voice.enabled=false` para desabilitá-la.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não forem definidos.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, isso pode ser o bug de recebimento upstream de `@discordjs/voice` rastreado em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Mensagens de voz

Mensagens de voz do Discord mostram uma prévia de forma de onda e exigem áudio OGG/Opus mais metadados. O OpenClaw gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` disponíveis no host do gateway para inspecionar e converter arquivos de áudio.

Requisitos e restrições:

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita conteúdo de texto (o Discord não permite texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus quando necessário.

Exemplo:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Usou intents não permitidas ou o bot não vê mensagens de servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent quando você depende de resolução de usuário/membro
    - reinicie o gateway após alterar intents

  </Accordion>

  <Accordion title="Mensagens de servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a allowlist do servidor em `channels.discord.guilds`
    - se o mapa `channels` do servidor existir, apenas canais listados serão permitidos
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

    - `groupPolicy="allowlist"` sem allowlist correspondente de servidor/canal
    - `requireMention` configurado no lugar errado (deve ficar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela allowlist `users` do servidor/canal

  </Accordion>

  <Accordion title="Manipuladores de longa duração expiram ou duplicam respostas">

    Logs típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Controle do orçamento do listener:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - múltiplas contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Controle do tempo limite de execução do worker:

    - conta única: `channels.discord.inboundWorker.runTimeoutMs`
    - múltiplas contas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    Use `eventQueue.listenerTimeout` para inicialização lenta do listener e `inboundWorker.runTimeoutMs`
    apenas se você quiser uma válvula de segurança separada para turnos de agente enfileirados.

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    Verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canal.

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas a sonda não consegue verificar permissões completamente.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitada: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bots são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras rígidas de menção e allowlist para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bot que mencionem o bot.

  </Accordion>

  <Accordion title="Voice STT falha com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para garantir que a lógica de recuperação de recebimento de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - monitore os logs em busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a nova entrada automática, colete logs e compare com [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Ponteiros para a referência de configuração

Referência principal:

- [Referência de configuração - Discord](/pt-BR/gateway/configuration-reference#discord)

Campos do Discord com maior sinal:

- inicialização/autenticação: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker de entrada: `inboundWorker.runTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/repetição: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita uploads de saída do Discord (padrão: `100MB`)
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferível em ambientes supervisionados).
- Conceda permissões do Discord com o menor privilégio possível.
- Se a implantação/estado dos comandos estiver desatualizada, reinicie o gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
- [Comandos slash](/pt-BR/tools/slash-commands)
