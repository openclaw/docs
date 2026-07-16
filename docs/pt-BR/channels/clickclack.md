---
read_when:
    - Conectando o OpenClaw a um espaço de trabalho do ClickClack
    - Testando identidades de bots do ClickClack
summary: Configuração do canal por token de bot do ClickClack e sintaxe de destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T12:11:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta o OpenClaw a um workspace ClickClack auto-hospedado por meio de tokens de bot ClickClack de primeira classe.

Use esta opção quando quiser que um agente do OpenClaw apareça como um usuário bot do ClickClack. O ClickClack oferece suporte a bots de serviço independentes e bots pertencentes a usuários; os bots pertencentes a usuários mantêm um `owner_user_id` e recebem somente os escopos de token que você conceder.

## Configuração rápida

No ClickClack, abra **Workspace settings → Integrations → OpenClaw**, crie um
bot e copie o token dele. Em seguida, configure o canal:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` aceita um id de workspace (`wsp_...`), slug ou nome de exibição.
`channels add` verifica o servidor, o token e o workspace após salvar e, em seguida,
informa se o Gateway em execução detectou a nova conta. Se o OpenClaw já estiver
em execução, o ClickClack se conectará automaticamente e nenhum segundo comando será
necessário. Caso contrário, inicie-o com:

```bash
openclaw gateway
```

Para uma configuração guiada, execute:

```bash
openclaw onboard
```

Selecione ClickClack e insira a URL do servidor, o token do bot e o workspace quando
solicitado. A configuração guiada verifica o servidor, o token e o workspace após salvar; uma
falha na verificação não descarta a configuração.

### Alternativa: token baseado em variável de ambiente

A conta padrão pode ler `CLICKCLACK_BOT_TOKEN` em vez de armazenar um token
na configuração:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

As contas nomeadas devem usar um token configurado ou um arquivo de token; a variável de
ambiente compartilhada é intencionalmente limitada à conta padrão.

### Referência JSON5

A estrutura de configuração equivalente é:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Uma conta será considerada configurada somente quando `baseUrl`, uma origem de token e
`workspace` estiverem todos definidos. Uma origem de token pode ser `token`, `tokenFile` ou
`CLICKCLACK_BOT_TOKEN` para a conta padrão. `workspace` aceita um
id de workspace (`wsp_...`), slug ou nome; o Gateway o resolve para o id na inicialização.

### Chaves de configuração da conta

| Chave                   | Padrão              | Observações                                                                              |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | nenhum (obrigatório) | URL do servidor ClickClack.                                                             |
| `token`                 | nenhum              | Token do bot como string simples ou referência de segredo (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | nenhum              | Caminho para um arquivo de token do bot; tem precedência sobre `token`.                  |
| `workspace`             | nenhum (obrigatório) | Id, slug ou nome do workspace.                                                          |
| `replyMode`             | `"agent"`           | `"agent"` executa o pipeline completo do agente; `"model"` envia conclusões diretas e curtas do modelo. |
| `defaultTo`             | `"channel:general"` | Destino usado quando um caminho de saída não fornece um destino.                        |
| `allowFrom`             | `["*"]`             | Lista de permissões de ids de usuário para DMs e mensagens de canal recebidas.          |
| `botUserId`             | detectado automaticamente | Resolvido com base na identidade do token do bot na inicialização.                 |
| `agentId`               | rota padrão          | Fixa as mensagens recebidas desta conta a um agente.                                    |
| `toolsAllow`            | nenhum              | Lista de permissões de ferramentas para respostas do agente desta conta.                |
| `model`, `systemPrompt` | nenhum              | Usados pelas conclusões de `replyMode: "model"`.                                        |
| `commandMenu`           | `true`              | Publica comandos nativos no preenchimento automático do compositor do ClickClack.       |
| `reconnectMs`           | `1500`              | Atraso de reconexão em tempo real (100 a 60000).                                        |

Se `plugins.allow` for uma lista restritiva não vazia, selecionar explicitamente
ClickClack na configuração de canais ou executar `openclaw plugins enable clickclack`
adicionará `clickclack` a essa lista. A instalação durante a integração usa o mesmo
comportamento de seleção explícita. Esses caminhos não substituem `plugins.deny` nem uma
configuração global de `plugins.enabled: false`. O uso direto de
`openclaw plugins install @openclaw/clickclack` segue a política normal de instalação de
plugins e também registra o ClickClack em uma lista de permissões existente.

## Vários bots

Cada conta abre sua própria conexão em tempo real com o ClickClack e usa seu próprio token de bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modos de resposta

- `replyMode: "agent"` (padrão) encaminha as mensagens recebidas pelo pipeline normal do agente, incluindo o registro da sessão e a política de ferramentas.
- `replyMode: "model"` ignora o pipeline do agente e usa `llm.complete` do runtime do plugin para respostas diretas do bot, opcionalmente configuradas por `model` e `systemPrompt`. O provedor e o modelo selecionados controlam o orçamento de conclusão.

O modo de modelo executa conclusões no id resolvido do agente do bot, o que exige
o bit de confiança explícito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Mantenha o bit de confiança desativado se você usar somente o modo de resposta padrão `agent`; ele
não é necessário nesse caso.

## Menu de comandos

Na inicialização do Gateway, cada conta configurada publica os comandos nativos
do OpenClaw no ClickClack. Eles aparecem no preenchimento automático do compositor identificados pelo
nome de usuário do bot. O conjunto publicado é substituído por completo a cada inicialização,
inclusive com a limpeza de um menu obsoleto quando o catálogo de comandos nativos está vazio.

A sincronização do menu de comandos fica ativada por padrão. Defina `commandMenu: false` em uma conta
para desativá-la:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

O token precisa de `commands:write`. Os pacotes atuais `bot:write` e
`bot:admin` do ClickClack incluem esse escopo, que também pode ser concedido
individualmente. Talvez seja necessário adicionar o escopo aos tokens criados antes da introdução
dos menus de comandos ou substituí-los.

A sincronização funciona com melhor esforço e é executada uma vez por inicialização do Gateway. Um escopo ausente ou uma falha de
rede registra um aviso; um servidor ClickClack mais antigo sem o endpoint registra o evento no
nível de depuração. Nenhuma dessas falhas impede a inicialização em tempo real. Os menus permanecem
disponíveis enquanto o agente está offline e são removidos quando o bot sai do
workspace.

Esta versão publica somente especificações de comandos nativos. Aliases e
catálogos de comandos de Skills, plugins ou personalizados não são adicionados ao menu. Se um
nome também estiver registrado como um comando HTTP com barra, o ClickClack encaminhará esse
registro primeiro; os outros comandos de menu continuarão pelo fluxo normal de
entrega de mensagens.

Use o modo `agent` para evidências de correlação entre serviços. Para um id de
mensagem autoritativo do ClickClack em sua estrutura canônica `msg_<ulid>`, o canal deriva
o id determinístico de execução do OpenClaw `clickclack:<message-id>`. Cada chamada de modelo
fica visível nos diagnósticos como `clickclack:<message-id>:model:<n>`; quando esse
turno usa o ClawRouter, o mesmo id de chamada do modelo é enviado como `X-Request-ID`.
O modo `model` ignora os diagnósticos normais de execução/sessão do agente e, portanto,
não é adequado para esse caminho de evidências.

Quando um evento em tempo real contém um `payload.correlation_id` validado, o
canal o transporta como `X-Correlation-ID` na busca autoritativa da mensagem e
nas solicitações de resposta resultantes do ClickClack. Os valores usam o conjunto seguro de
128 caracteres do ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` e `-`); valores inválidos
são omitidos. Essas associações contêm somente identificadores, nunca corpos de mensagens,
prompts, conclusões, credenciais ou saídas de ferramentas.

## Entrega durável de mídia

As respostas do agente que contêm mídia usam entrega durável obrigatória. O OpenClaw atribui
nonces estáveis por parte para mensagens e uploads antes da primeira gravação no ClickClack, de modo que
uma nova tentativa reutilize o mesmo upload e a mesma mensagem, em vez de consumir a cota de armazenamento
ou publicar duplicatas. Se um upload já existir após uma reinicialização,
o OpenClaw não relerá o caminho local original nem a URL remota da mídia.

Esse contrato de recuperação exige um servidor ClickClack compatível com:

- `GET /api/uploads/by-nonce` com
  `X-ClickClack-Upload-Nonce: supported` em resultados encontrados e ausentes.
- `GET /api/messages/by-nonce` com
  `X-ClickClack-Message-Nonce: supported` em resultados encontrados e ausentes.
- Criação idempotente de mensagens e associação de anexos para o mesmo
  nonce com escopo do proprietário e o mesmo upload.

O erro 404 genérico de um servidor mais antigo não é tratado como prova de que um envio está ausente.
O OpenClaw deixa a entrega sem resolução em vez de arriscar uma duplicata; atualize o
ClickClack antes de habilitar respostas de agentes que produzam mídia.

## Linhas de atividade do agente

Por padrão, um canal do ClickClack não exibe nada enquanto um turno do agente está em execução; somente a resposta final é publicada. Defina `agentActivity: true` em uma conta para publicar linhas de mensagem duráveis de `agent_commentary` e `agent_tool` enquanto o turno estiver em andamento:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisitos e comportamento:

- **Desativado por padrão.** As configurações padrão e os servidores ClickClack mais antigos não são afetados.
- **Exige o escopo de token `agent_activity:write`.** Esse escopo é separado de `bot:write` e não é herdado por ele; crie o token do bot com `--scopes bot:write,agent_activity:write` (ou conceda o escopo a um token existente) antes de habilitar a opção.
- **Degradação com melhor esforço.** Se o token não tiver `agent_activity:write` ou se o servidor rejeitar gravações de atividade, as falhas serão registradas e a resposta final ainda será entregue normalmente; nenhuma linha de atividade aparecerá.
- As linhas são agrupadas por turno (`turn_id`), combinadas de modo que uma etapa lógica corresponda a uma linha, e as linhas de ferramentas usam a mesma formatação de progresso do Discord/Slack/Telegram (nome da ferramenta mais detalhes do comando).
- **Metadados de atribuição.** As publicações criadas pelo agente (linhas de atividade e a resposta final) incluem os campos `author_model` e `author_thinking`, resolvidos com base no modelo realmente usado no turno (inclusive após um fallback). Servidores que não definem essas colunas ignoram os campos JSON desconhecidos; servidores que os persistem podem responder "qual modelo disse esta linha e em qual nível de raciocínio" por mensagem.

## Destinos

- `channel:<name-or-id>` envia para um canal do espaço de trabalho. Destinos sem prefixo usam `channel:` por padrão.
- `dm:<user_id>` cria ou reutiliza uma conversa direta com esse usuário.
- `thread:<message_id>` responde na thread cuja mensagem raiz é essa.

Destinos de saída explícitos também podem incluir o prefixo de provedor `clickclack:` ou `cc:`.

A mídia de saída usa a API de upload do ClickClack e, em seguida, anexa o upload persistente
à mensagem de canal, resposta na thread ou DM criada. Arquivos locais e URLs de mídia
remota compatíveis seguem a política normal de acesso a mídia do OpenClaw, com um limite
de 64 MiB por arquivo. Envios persistentes em fila usam nonces separados, com escopo de
proprietário, para cada upload e parte da mensagem e, depois, tentam novamente associar
o anexo aos mesmos objetos. Consulte [Entrega persistente de mídia](#durable-media-delivery)
para ver o contrato do servidor e o comportamento de recuperação.

Exemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "olá"
openclaw message send --channel clickclack --target dm:usr_123 --message "olá"
openclaw message send --channel clickclack --target thread:msg_123 --message "dando continuidade"
```

## Permissões

Os escopos de token do ClickClack são impostos pela API do ClickClack.

- `bot:read`: lê dados de espaço de trabalho, canal, mensagem, thread, DM, tempo real e perfil.
- `bot:write`: `bot:read` mais mensagens de canal, respostas em threads, DMs, uploads e publicação do menu de comandos.
- `bot:admin`: `bot:write` mais criação de canais.
- `commands:write`: publica o menu de comandos do bot. Incluído nos pacotes atuais `bot:write` e `bot:admin` e pode ser concedido individualmente.
- `agent_activity:write`: linhas persistentes de atividade do agente (`agent_commentary` / `agent_tool`). Não é herdado por `bot:write` nem `bot:admin`; necessário somente quando `agentActivity: true` está definido.

O OpenClaw precisa apenas do `bot:write` atual para o chat normal do agente e a sincronização do menu de comandos. Adicione `agent_activity:write` ao habilitar [linhas de atividade do agente](#agent-activity-rows).

## Solução de problemas

- `ClickClack is not configured for account "<id>"`: defina `baseUrl`, `token` (por exemplo, por meio de `CLICKCLACK_BOT_TOKEN`) e `workspace` para essa conta.
- `ClickClack workspace not found: <value>`: defina `workspace` como o id, slug ou nome do espaço de trabalho retornado pelo ClickClack.
- Sem respostas recebidas: confirme se o token tem acesso de leitura em tempo real e observe que o bot ignora as próprias mensagens e as mensagens de outros bots.
- Falha nos envios para canais: verifique se o bot é membro do espaço de trabalho e tem `bot:write`.
- Sem menu de comandos: confirme que `commandMenu` não é `false`, que o servidor ClickClack oferece suporte a `PUT /api/bots/self/commands` e que o token tem `commands:write`.
