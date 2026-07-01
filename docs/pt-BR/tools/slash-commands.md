---
read_when:
    - Usando ou configurando comandos de chat
    - Depuração de roteamento de comandos ou permissões
    - Entendendo como os comandos de Skills são registrados
sidebarTitle: Slash commands
summary: Todos os comandos de barra, diretivas e atalhos em linha disponíveis — configuração, roteamento e comportamento por superfície.
title: Comandos de barra
x-i18n:
    generated_at: "2026-07-01T20:16:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

O Gateway lida com comandos enviados como mensagens avulsas que começam com `/`.
Comandos bash somente do host usam `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa está vinculada a uma sessão ACP, o texto normal é roteado para o harness ACP. Os comandos de gerenciamento do Gateway permanecem locais: `/acp ...` sempre chega ao manipulador de comandos do OpenClaw, e `/status` mais `/unfocus` permanecem locais sempre que o tratamento de comandos está habilitado para a superfície.

## Três tipos de comando

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensagens avulsas `/...` tratadas pelo Gateway. Devem ser enviadas como o
    único conteúdo na mensagem.
  </Card>
  <Card title="Diretivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — removidas da mensagem antes que o modelo
    as veja. Persistem as configurações da sessão quando enviadas sozinhas; atuam como dicas inline
    quando enviadas com outro texto.
  </Card>
  <Card title="Atalhos inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — executam imediatamente e são
    removidos antes que o modelo veja o texto restante. Apenas remetentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalhes do comportamento das diretivas">
    - As diretivas são removidas da mensagem antes que o modelo as veja.
    - Em mensagens **somente com diretivas** (a mensagem contém apenas diretivas), elas
      persistem na sessão e respondem com uma confirmação.
    - Em mensagens de **chat normal** com outro texto, elas atuam como dicas inline e
      **não** persistem as configurações da sessão.
    - As diretivas se aplicam apenas a **remetentes autorizados**. Se `commands.allowFrom`
      estiver definido, essa será a única lista de permissões usada; caso contrário, a autorização vem de
      listas de permissões/emparelhamento do canal mais `commands.useAccessGroups`. Remetentes não autorizados
      veem diretivas tratadas como texto simples.
  </Accordion>
</AccordionGroup>

## Configuração

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Habilita a análise de `/...` em mensagens de chat. Em superfícies sem comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), comandos de texto
  funcionam mesmo quando definido como `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: ativado para Discord/Telegram; desativado para Slack;
  ignorado para provedores sem suporte nativo. Substitua por canal com
  `channels.<provider>.commands.native`. No Discord, `false` ignora o registro de comandos slash;
  comandos registrados anteriormente podem permanecer visíveis até serem removidos.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de skill nativamente quando houver suporte. Auto: ativado para
  Discord/Telegram; desativado para Slack. Substitua com
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos de shell do host (alias `/bash <cmd>`). Exige
  listas de permissões `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Por quanto tempo o bash espera antes de alternar para o modo em segundo plano (`0` coloca em segundo plano
  imediatamente).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`). Somente proprietário.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava configuração MCP gerenciada pelo OpenClaw em `mcp.servers`). Somente proprietário.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de Plugin mais instalação + ativar/desativar). Somente proprietário para gravações.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições de configuração somente em runtime). Somente proprietário.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` e ações de ferramenta de reinício do gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista de permissões explícita de proprietário para superfícies de comando somente do proprietário. Separada de
  `commands.allowFrom` e do acesso por emparelhamento de DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: exige identidade de proprietário para comandos somente do proprietário. Quando `true`,
  o remetente deve corresponder a `commands.ownerAllowFrom` ou possuir o escopo interno `operator.admin`.
  Uma entrada curinga `allowFrom` **não** é suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como IDs de proprietário aparecem no prompt do sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segredo HMAC usado quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permissões por provedor para autorização de comandos. Quando configurada, ela é a
  **única** fonte de autorização para comandos e diretivas. Use `"*"` para um
  padrão global; chaves específicas de provedor a substituem.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Os comandos vêm de três fontes:

- **Integrados do core:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock gerados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugin:** chamadas `registerCommand()` do Plugin

A disponibilidade depende de flags de configuração, superfície do canal e
plugins instalados/habilitados.

### Comandos do core

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    | Comando | Descrição |
    | --- | --- |
    | `/new [model]` | Arquiva a sessão atual e inicia uma nova |
    | `/reset [soft [message]]` | Redefine a sessão atual no lugar. `soft` mantém a transcrição, descarta IDs de sessão de backend CLI reutilizados e executa a inicialização novamente |
    | `/name <title>` | Nomeia ou renomeia a sessão atual. Omita o título para ver o nome atual e uma sugestão |
    | `/compact [instructions]` | Compacta o contexto da sessão. Veja [Compaction](/pt-BR/concepts/compaction) |
    | `/stop` | Aborta a execução atual |
    | `/session idle <duration\|off>` | Gerencia a expiração por inatividade da vinculação de thread |
    | `/session max-age <duration\|off>` | Gerencia a expiração por idade máxima da vinculação de thread |
    | `/export-session [path]` | Exporta a sessão atual para HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta um pacote de trajetória JSONL para a sessão atual. Alias: `/trajectory` |

    <Note>
      A UI de controle intercepta `/new` digitado para criar e alternar para uma nova
      sessão de dashboard, exceto quando `session.dmScope: "main"` está configurado
      e o pai atual é a sessão principal do agente — nesse caso `/new`
      redefine a sessão principal no lugar. `/reset` digitado ainda executa a redefinição
      no lugar do Gateway. Use `/model default` quando quiser limpar uma seleção
      de modelo fixada na sessão.
    </Note>

  </Accordion>

  <Accordion title="Controles de modelo e execução">
    | Comando | Descrição |
    | --- | --- |
    | `/think <level\|default>` | Define o nível de pensamento ou limpa a substituição da sessão. Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Alterna a saída detalhada. Alias: `/v` |
    | `/trace on\|off` | Alterna a saída de trace de Plugin para a sessão atual |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, define ou limpa o modo rápido |
    | `/reasoning [on\|off\|stream]` | Alterna a visibilidade do raciocínio. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Alterna o modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra ou define padrões de exec |
    | `/login [codex\|openai\|openai-codex]` | Emparelha login Codex/OpenAI a partir de um chat privado ou sessão da interface Web. Somente proprietário/admin |
    | `/model [name\|#\|status]` | Mostra ou define o modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista provedores ou modelos configurados/disponíveis por autenticação |
    | `/queue <mode>` | Gerencia o comportamento da fila de execuções ativas. Veja [Queue](/pt-BR/concepts/queue) e [Direção de fila](/pt-BR/concepts/queue-steering) |
    | `/steer <message>` | Injeta orientação na execução ativa. Alias: `/tell`. Veja [Direcionar](/pt-BR/tools/steer) |

    <AccordionGroup>
      <Accordion title="segurança de verbose / trace / fast / reasoning">
        - `/verbose` é para depuração — mantenha **desativado** no uso normal.
        - `/trace` revela apenas linhas de trace/depuração pertencentes ao Plugin; conversas detalhadas normais permanecem desativadas.
        - `/fast auto|on|off` persiste uma substituição de sessão; use a opção `inherit` da UI de Sessões para limpá-la.
        - `/fast` é específico do provedor: OpenAI/Codex o mapeiam para `service_tier=priority`; solicitações diretas à Anthropic o mapeiam para `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo — eles podem revelar raciocínio interno ou diagnósticos de Plugin. Mantenha-os desativados em chats de grupo.

      </Accordion>
      <Accordion title="Detalhes da troca de modelo">
        - `/model` persiste o novo modelo imediatamente na sessão.
        - Se o agente estiver ocioso, a próxima execução o usará imediatamente.
        - Se uma execução estiver ativa, a troca será marcada como pendente e aplicada no próximo ponto de nova tentativa limpa.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descoberta e status">
    | Comando | Descrição |
    | --- | --- |
    | `/help` | Mostra o resumo curto de ajuda |
    | `/commands` | Mostra o catálogo de comandos gerado |
    | `/tools [compact\|verbose]` | Mostra o que o agente atual pode usar agora |
    | `/status` | Mostra status de execução/runtime, uptime do Gateway e do sistema, integridade de Plugin, mais uso/cota de provedor |
    | `/status plugins` | Mostra integridade detalhada de Plugin: erros de carregamento, quarentenas, falhas de canal, problemas de dependência, avisos de compatibilidade |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gerencia o [objetivo](/pt-BR/tools/goal) durável da sessão atual |
    | `/diagnostics [note]` | Fluxo de relatório de suporte somente do proprietário. Solicita aprovação de exec sempre |
    | `/crestodian <request>` | Executa o auxiliar de configuração e reparo Crestodian a partir de uma DM do proprietário |
    | `/tasks` | Lista tarefas em segundo plano ativas/recentes para a sessão atual |
    | `/context [list\|detail\|map\|json]` | Explica como o contexto é montado |
    | `/whoami` | Mostra o ID do seu remetente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla o rodapé de uso por resposta (`reset`/`inherit`/`clear`/`default` limpa a substituição da sessão para voltar a herdar o padrão configurado) ou imprime um resumo de custo local |
  </Accordion>

  <Accordion title="Skills, listas de permissões, aprovações">
    | Comando | Descrição |
    | --- | --- |
    | `/skill <name> [input]` | Executa uma skill pelo nome |
    | `/allowlist [list\|add\|remove] ...` | Gerencia entradas de lista de permissões. Somente texto |
    | `/approve <id> <decision>` | Resolve prompts de aprovação de exec ou Plugin |
    | `/btw <question>` | Faz uma pergunta paralela sem alterar o contexto da sessão. Alias: `/side`. Veja [BTW](/pt-BR/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes e ACP">
    | Comando | Descrição |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspeciona execuções de subagentes para a sessão atual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gerencia sessões ACP e opções de runtime. Controles de runtime exigem proprietário externo ou identidade de administrador interno do Gateway |
    | `/focus <target>` | Vincula a thread atual do Discord ou o tópico atual do Telegram a um alvo de sessão |
    | `/unfocus` | Remove o vínculo da thread atual |
    | `/agents` | Lista agentes vinculados à thread para a sessão atual |
  </Accordion>

  <Accordion title="Gravações somente para proprietário e administração">
    | Comando | Exige | Descrição |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lê ou grava `openclaw.json`. Somente proprietário |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw. Somente proprietário |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspeciona ou altera o estado de plugin. Somente proprietário para gravações. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Substituições de configuração somente em runtime. Somente proprietário |
    | `/restart` | `commands.restart: true` (padrão) | Reinicia o OpenClaw |
    | `/send on\|off\|inherit` | proprietário | Define a política de envio |
  </Accordion>

  <Accordion title="Controle de voz, TTS e canal">
    | Comando | Descrição |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla TTS. Consulte [TTS](/pt-BR/tools/tts) |
    | `/activation mention\|always` | Define o modo de ativação de grupo |
    | `/bash <command>` | Executa um comando de shell do host. Alias: `! <command>`. Exige `commands.bash: true` |
    | `!poll [sessionId]` | Verifica uma tarefa bash em segundo plano |
    | `!stop [sessionId]` | Interrompe uma tarefa bash em segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos dock

Comandos dock alternam a rota de resposta da sessão ativa para outro canal vinculado.
Consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking) para configuração e solução de problemas.

Gerados a partir de plugins de canal com suporte a comando nativo:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Comandos dock exigem `session.identityLinks`. O remetente de origem e o par de destino
devem estar no mesmo grupo de identidade.

### Comandos de plugins integrados

| Comando                                                                                      | Descrição                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Alterna Dreaming de memória (proprietário ou administrador do Gateway). Consulte [Dreaming](/pt-BR/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gerencia pareamento de dispositivos. Consulte [Pareamento](/pt-BR/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | Arma temporariamente comandos de nó de telefone de alto risco                                       |
| `/voice status\|list\|set <voiceId>`                                                         | Gerencia a configuração de voz Talk. Nome nativo no Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | Envia predefinições de cartão rico LINE. Consulte [LINE](/pt-BR/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Controla o harness do servidor de aplicativo Codex. Consulte [Harness Codex](/pt-BR/plugins/codex-harness)   |

Somente QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skills

Skills invocáveis pelo usuário são expostas como comandos slash:

- `/skill <name> [input]` sempre funciona como o ponto de entrada genérico.
- Skills podem se registrar como comandos diretos (por exemplo, `/prose` para OpenProse).
- O registro de comandos nativos de Skills é controlado por `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de Skills">
    Por padrão, comandos de Skills são roteados ao modelo como uma solicitação normal.

    Skills podem declarar `command-dispatch: tool` para rotear diretamente a uma ferramenta
    (determinístico, sem envolvimento do modelo). Exemplo: `/prose` (plugin OpenProse)
    — consulte [OpenProse](/pt-BR/prose).

  </Accordion>
  <Accordion title="Argumentos de comando nativo">
    O Discord usa preenchimento automático para opções dinâmicas e menus de botões quando
    argumentos obrigatórios são omitidos. Telegram e Slack mostram um menu de botões para comandos com
    escolhas. Escolhas dinâmicas são resolvidas em relação ao modelo da sessão alvo, portanto opções
    específicas de modelo, como níveis de `/think`, seguem a substituição de `/model` da sessão.
  </Accordion>
</AccordionGroup>

## `/tools` — o que o agente pode usar agora

`/tools` responde a uma pergunta de runtime: **o que este agente pode usar agora nesta
conversa** — não um catálogo de configuração estático.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Os resultados têm escopo de sessão. Alterar agente, canal, thread, autorização do remetente
ou modelo pode alterar a saída. Para edição de perfil e substituição,
use o painel Ferramentas da Control UI ou superfícies de configuração.

## `/model` — seleção de modelo

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e
modelo. O seletor respeita `agents.defaults.models`, incluindo entradas
`provider/*`.

## `/config` — gravações de configuração em disco

<Note>
  Somente proprietário. Desativado por padrão — habilite com `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

A configuração é validada antes da gravação. Alterações inválidas são rejeitadas. `/config`
persiste atualizações entre reinicializações.

## `/mcp` — configuração de servidor MCP

<Note>
  Somente proprietário. Desativado por padrão — habilite com `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto do agente incorporado.

## `/debug` — substituições somente em runtime

<Note>
  Somente proprietário. Desativado por padrão — habilite com `commands.debug: true`.
  As substituições se aplicam imediatamente a novas leituras de configuração, mas **não** gravam em disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — gerenciamento de plugins

<Note>
  Somente proprietário para gravações. Desativado por padrão — habilite com `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` atualiza a configuração de plugin e recarrega a quente o runtime de plugins do Gateway
para novas rodadas do agente. `/plugins install` reinicia Gateways gerenciados
automaticamente porque os módulos-fonte do plugin mudaram.

## `/trace` — saída de rastreamento de plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` revela linhas de rastreamento/depuração de plugin com escopo de sessão sem o modo
verboso completo. Ele não substitui `/debug` (substituições de runtime) nem `/verbose` (saída
normal de ferramentas).

## `/btw` — perguntas paralelas

`/btw` é uma pergunta paralela rápida sobre o contexto da sessão atual. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Ao contrário de uma mensagem normal:

- Usa a sessão atual como contexto de fundo.
- Em sessões do harness Codex, executa como uma thread lateral efêmera do Codex.
- **Não** altera o contexto futuro da sessão.
- Não é gravada no histórico de transcrição.

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo.

## Observações de superfície

<AccordionGroup>
  <Accordion title="Escopo de sessão por superfície">
    - **Comandos de texto:** executam na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
    - **Comandos nativos do Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos do Slack:** `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos do Telegram:** `telegram:slash:<userId>` (direciona a sessão de chat via `CommandTargetSessionKey`)
    - **`/login codex`** envia códigos de pareamento de dispositivo somente por chat privado ou caminhos de resposta da Web UI. Invocações em grupo/tópico do Telegram pedem que o proprietário envie uma DM ao bot.
    - **`/stop`** mira a sessão de chat ativa para abortar a execução atual.

  </Accordion>
  <Accordion title="Especificidades do Slack">
    `channels.slack.slashCommand` oferece suporte a um único comando no estilo `/openclaw`.
    Com `commands.native: true`, crie um comando slash do Slack por comando integrado.
    Registre `/agentstatus` (não `/status`) porque o Slack reserva
    `/status`. O texto `/status` ainda funciona em mensagens do Slack.
  </Accordion>
  <Accordion title="Caminho rápido e atalhos inline">
    - Mensagens somente de comando de remetentes allowlisted são tratadas imediatamente (ignorando fila + modelo).
    - Atalhos inline (`/help`, `/commands`, `/status`, `/whoami`) também funcionam incorporados em mensagens normais e são removidos antes que o modelo veja o texto restante.
    - Mensagens somente de comando não autorizadas são ignoradas silenciosamente; tokens inline `/...` são tratados como texto simples.

  </Accordion>
  <Accordion title="Observações sobre argumentos">
    - Comandos aceitam um `:` opcional entre o comando e os argumentos (`/think: high`, `/send: on`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto será tratado como corpo da mensagem.
    - `/allowlist add|remove` exige `commands.config: true` e respeita `configWrites` do canal.

  </Accordion>
</AccordionGroup>

## Uso e status de provedor

- **Uso/cota do provedor** (por exemplo, "Claude 80% left") aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado.
- **Linhas de token/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo está esparso.
- **Execução vs runtime:** `/status` relata `Execution` para o caminho efetivo de sandbox e `Runtime` para quem está executando a sessão: `OpenClaw Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP.
- **Tokens/custo por resposta:** controlado por `/usage off|tokens|full`.
- `/model status` trata de modelos/autenticação/endpoints, não de uso.

## Relacionados

<CardGroup cols={2}>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Como os comandos slash de Skills são registrados e controlados.
  </Card>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie uma Skill que registre seu próprio comando slash.
  </Card>
  <Card title="BTW" href="/pt-BR/tools/btw" icon="comments">
    Perguntas paralelas sem alterar o contexto da sessão.
  </Card>
  <Card title="Steer" href="/pt-BR/tools/steer" icon="compass">
    Oriente o agente durante a execução com `/steer`.
  </Card>
</CardGroup>
