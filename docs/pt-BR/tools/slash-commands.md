---
read_when:
    - Usando ou configurando comandos de chat
    - Depuração de roteamento de comandos ou permissões
    - Entendendo como os comandos de Skills são registrados
sidebarTitle: Slash commands
summary: Todos os comandos de barra, diretivas e atalhos inline disponíveis — configuração, roteamento e comportamento por superfície.
title: Comandos de barra
x-i18n:
    generated_at: "2026-06-27T18:18:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

O Gateway lida com comandos enviados como mensagens independentes que começam com `/`.
Comandos bash somente do host usam `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa está vinculada a uma sessão ACP, o texto normal é roteado para o
harness ACP. Os comandos de gerenciamento do Gateway permanecem locais: `/acp ...` sempre chega
ao manipulador de comandos do OpenClaw, e `/status` mais `/unfocus` permanecem locais sempre que
o tratamento de comandos está habilitado para a superfície.

## Três tipos de comando

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensagens `/...` independentes tratadas pelo Gateway. Devem ser enviadas como o
    único conteúdo da mensagem.
  </Card>
  <Card title="Diretivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — removidas da mensagem antes que o modelo
    a veja. Persistem as configurações da sessão quando enviadas sozinhas; atuam como dicas inline
    quando enviadas com outro texto.
  </Card>
  <Card title="Atalhos inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — executam imediatamente e são
    removidos antes que o modelo veja o texto restante. Somente remetentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalhes do comportamento das diretivas">
    - Diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens **somente com diretivas** (a mensagem contém apenas diretivas), elas
      persistem na sessão e respondem com uma confirmação.
    - Em mensagens de **chat normal** com outro texto, elas atuam como dicas inline e
      **não** persistem as configurações da sessão.
    - Diretivas só se aplicam a **remetentes autorizados**. Se `commands.allowFrom`
      estiver definido, ele será a única lista de permissões usada; caso contrário, a autorização vem de
      listas de permissões/pareamento de canal mais `commands.useAccessGroups`. Remetentes não autorizados
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
  comandos registrados anteriormente podem continuar visíveis até serem removidos.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de skill nativamente quando compatível. Auto: ativado para
  Discord/Telegram; desativado para Slack. Substitua com
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos shell do host (alias `/bash <cmd>`). Requer
  listas de permissões `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Por quanto tempo o bash aguarda antes de mudar para o modo em segundo plano (`0` coloca em segundo plano
  imediatamente).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`). Somente proprietário.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`). Somente proprietário.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins mais instalar + habilitar/desabilitar). Somente proprietário para gravações.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições de configuração somente em runtime). Somente proprietário.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` e ações de ferramenta de reinício do gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista explícita de permissões de proprietário para superfícies de comando somente para proprietário. Separada de
  `commands.allowFrom` e do acesso por pareamento de DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: exige identidade de proprietário para comandos somente de proprietário. Quando `true`,
  o remetente deve corresponder a `commands.ownerAllowFrom` ou ter o escopo interno `operator.admin`.
  Uma entrada curinga `allowFrom` **não** é suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como ids de proprietário aparecem no prompt do sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segredo HMAC usado quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permissões por provedor para autorização de comandos. Quando configurada, ela é a
  **única** fonte de autorização para comandos e diretivas. Use `"*"` para um
  padrão global; chaves específicas de provedor o substituem.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Os comandos vêm de três fontes:

- **Integrados do core:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock gerados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugin:** chamadas `registerCommand()` de plugin

A disponibilidade depende de flags de configuração, da superfície do canal e de
plugins instalados/habilitados.

### Comandos do core

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    | Comando | Descrição |
    | --- | --- |
    | `/new [model]` | Arquiva a sessão atual e inicia uma nova |
    | `/reset [soft [message]]` | Redefine a sessão atual no mesmo lugar. `soft` mantém a transcrição, descarta ids de sessão de backend CLI reutilizados e executa novamente a inicialização |
    | `/name <title>` | Nomeia ou renomeia a sessão atual. Omita o título para ver o nome atual e uma sugestão |
    | `/compact [instructions]` | Compacta o contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction) |
    | `/stop` | Interrompe a execução atual |
    | `/session idle <duration\|off>` | Gerencia a expiração por inatividade da vinculação de thread |
    | `/session max-age <duration\|off>` | Gerencia a expiração por idade máxima da vinculação de thread |
    | `/export-session [path]` | Exporta a sessão atual para HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta um pacote de trajetória JSONL para a sessão atual. Alias: `/trajectory` |

    <Note>
      A UI de controle intercepta `/new` digitado para criar e alternar para uma nova
      sessão de dashboard, exceto quando `session.dmScope: "main"` está configurado
      e o pai atual é a sessão principal do agente — nesse caso, `/new`
      redefine a sessão principal no mesmo lugar. `/reset` digitado ainda executa a redefinição
      no mesmo lugar do Gateway. Use `/model default` quando quiser limpar uma seleção
      de modelo de sessão fixada.
    </Note>

  </Accordion>

  <Accordion title="Controles de modelo e execução">
    | Comando | Descrição |
    | --- | --- |
    | `/think <level\|default>` | Define o nível de pensamento ou limpa a substituição da sessão. Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Alterna a saída detalhada. Alias: `/v` |
    | `/trace on\|off` | Alterna a saída de rastreamento de plugin para a sessão atual |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, define ou limpa o modo rápido |
    | `/reasoning [on\|off\|stream]` | Alterna a visibilidade do raciocínio. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Alterna o modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra ou define os padrões de exec |
    | `/model [name\|#\|status]` | Mostra ou define o modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista provedores ou modelos configurados/disponíveis por autenticação |
    | `/queue <mode>` | Gerencia o comportamento da fila de execução ativa. Consulte [Queue](/pt-BR/concepts/queue) e [Queue steering](/pt-BR/concepts/queue-steering) |
    | `/steer <message>` | Injeta orientação na execução ativa. Alias: `/tell`. Consulte [Steer](/pt-BR/tools/steer) |

    <AccordionGroup>
      <Accordion title="segurança de verbose / trace / fast / reasoning">
        - `/verbose` é para depuração — mantenha **desativado** no uso normal.
        - `/trace` revela apenas linhas de rastreamento/depuração pertencentes a plugins; a verbosidade normal permanece desativada.
        - `/fast auto|on|off` persiste uma substituição de sessão; use a opção `inherit` da UI de sessões para limpá-la.
        - `/fast` é específico do provedor: OpenAI/Codex o mapeiam para `service_tier=priority`; solicitações Anthropic diretas o mapeiam para `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo — eles podem revelar raciocínio interno ou diagnósticos de plugin. Mantenha-os desativados em chats em grupo.

      </Accordion>
      <Accordion title="Detalhes da troca de modelo">
        - `/model` persiste o novo modelo imediatamente na sessão.
        - Se o agente estiver ocioso, a próxima execução o usará imediatamente.
        - Se uma execução estiver ativa, a troca será marcada como pendente e aplicada no próximo ponto de nova tentativa limpo.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descoberta e status">
    | Comando | Descrição |
    | --- | --- |
    | `/help` | Mostra o resumo curto de ajuda |
    | `/commands` | Mostra o catálogo de comandos gerado |
    | `/tools [compact\|verbose]` | Mostra o que o agente atual pode usar neste momento |
    | `/status` | Mostra status de execução/runtime, tempo de atividade do Gateway e do sistema, integridade de plugins, mais uso/cota de provedores |
    | `/status plugins` | Mostra integridade detalhada de plugins: erros de carregamento, quarentenas, falhas de canal, problemas de dependência, avisos de compatibilidade |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gerencia a [meta](/pt-BR/tools/goal) durável da sessão atual |
    | `/diagnostics [note]` | Fluxo de relatório de suporte somente para proprietário. Solicita aprovação de exec todas as vezes |
    | `/crestodian <request>` | Executa o auxiliar de configuração e reparo Crestodian a partir de uma DM do proprietário |
    | `/tasks` | Lista tarefas em segundo plano ativas/recentes da sessão atual |
    | `/context [list\|detail\|map\|json]` | Explica como o contexto é montado |
    | `/whoami` | Mostra seu id de remetente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla o rodapé de uso por resposta (`reset`/`inherit`/`clear`/`default` limpa a substituição da sessão para herdar novamente o padrão configurado) ou imprime um resumo local de custos |
  </Accordion>

  <Accordion title="Skills, listas de permissões, aprovações">
    | Comando | Descrição |
    | --- | --- |
    | `/skill <name> [input]` | Executa uma skill pelo nome |
    | `/allowlist [list\|add\|remove] ...` | Gerencia entradas da lista de permissões. Somente texto |
    | `/approve <id> <decision>` | Resolve prompts de aprovação de exec ou plugin |
    | `/btw <question>` | Faz uma pergunta lateral sem alterar o contexto da sessão. Alias: `/side`. Consulte [BTW](/pt-BR/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes e ACP">
    | Comando | Descrição |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspeciona execuções de subagentes para a sessão atual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gerencia sessões ACP e opções de tempo de execução |
    | `/focus <target>` | Vincula a thread atual do Discord ou o tópico do Telegram a um alvo de sessão |
    | `/unfocus` | Remove o vínculo da thread atual |
    | `/agents` | Lista agentes vinculados à thread para a sessão atual |
  </Accordion>

  <Accordion title="Escritas somente pelo proprietário e administração">
    | Comando | Requer | Descrição |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lê ou escreve `openclaw.json`. Somente proprietário |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lê ou escreve a configuração de servidor MCP gerenciada pelo OpenClaw. Somente proprietário |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspeciona ou altera o estado de Plugin. Somente proprietário para escritas. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Substituições de configuração somente em tempo de execução. Somente proprietário |
    | `/restart` | `commands.restart: true` (padrão) | Reinicia o OpenClaw |
    | `/send on\|off\|inherit` | proprietário | Define a política de envio |
  </Accordion>

  <Accordion title="Voz, TTS, controle de canal">
    | Comando | Descrição |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla TTS. Consulte [TTS](/pt-BR/tools/tts) |
    | `/activation mention\|always` | Define o modo de ativação em grupo |
    | `/bash <command>` | Executa um comando de shell do host. Alias: `! <command>`. Requer `commands.bash: true` |
    | `!poll [sessionId]` | Verifica uma tarefa bash em segundo plano |
    | `!stop [sessionId]` | Interrompe uma tarefa bash em segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamento

Comandos de acoplamento alternam a rota de resposta da sessão ativa para outro canal vinculado.
Consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking) para configuração e solução de problemas.

Gerado a partir de Plugins de canal com suporte a comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Comandos de acoplamento requerem `session.identityLinks`. O remetente de origem e o par de destino
devem estar no mesmo grupo de identidade.

### Comandos de Plugin incluídos

| Comando                                                                                      | Descrição                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Alterna Dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming)                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gerencia o pareamento de dispositivos. Consulte [Pareamento](/pt-BR/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | Arma temporariamente comandos de nó de telefone de alto risco                                     |
| `/voice status\|list\|set <voiceId>`                                                         | Gerencia a configuração de voz do Talk. Nome nativo no Discord: `/talkvoice`                       |
| `/card ...`                                                                                  | Envia predefinições de cartões avançados do LINE. Consulte [LINE](/pt-BR/channels/line)                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Controla o ambiente de servidor de app do Codex. Consulte [ambiente do Codex](/pt-BR/plugins/codex-harness) |

Somente QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skills

Skills invocáveis pelo usuário são expostas como comandos de barra:

- `/skill <name> [input]` sempre funciona como o ponto de entrada genérico.
- Skills podem ser registradas como comandos diretos (por exemplo, `/prose` para OpenProse).
- O registro de comando nativo de Skill é controlado por `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de Skill">
    Por padrão, comandos de Skill são roteados para o modelo como uma solicitação normal.

    Skills podem declarar `command-dispatch: tool` para rotear diretamente para uma ferramenta
    (determinístico, sem envolvimento do modelo). Exemplo: `/prose` (Plugin OpenProse)
    — consulte [OpenProse](/pt-BR/prose).

  </Accordion>
  <Accordion title="Argumentos de comando nativo">
    Discord usa preenchimento automático para opções dinâmicas e menus de botões quando argumentos
    obrigatórios são omitidos. Telegram e Slack mostram um menu de botões para comandos com
    escolhas. Escolhas dinâmicas são resolvidas contra o modelo da sessão de destino, portanto opções
    específicas do modelo, como níveis de `/think`, seguem a substituição de `/model` da sessão.
  </Accordion>
</AccordionGroup>

## `/tools` — o que o agente pode usar agora

`/tools` responde a uma pergunta de tempo de execução: **o que este agente pode usar agora nesta
conversa** — não um catálogo estático de configuração.

```text
/tools         # visão compacta
/tools verbose # com descrições curtas
```

Os resultados têm escopo de sessão. Alterar agente, canal, thread, autorização
do remetente ou modelo pode alterar a saída. Para editar perfis e substituições,
use o painel Tools da Control UI ou as superfícies de configuração.

## `/model` — seleção de modelo

```text
/model             # mostra o seletor de modelo
/model list        # igual
/model 3           # seleciona pelo número no seletor
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # limpa a seleção de modelo da sessão
/model status      # visão detalhada com endpoint e modo de API
```

No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e
modelo. O seletor respeita `agents.defaults.models`, incluindo
entradas `provider/*`.

## `/config` — escritas na configuração em disco

<Note>
  Somente proprietário. Desabilitado por padrão — habilite com `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

A configuração é validada antes da escrita. Alterações inválidas são rejeitadas. `/config`
persiste atualizações entre reinicializações.

## `/mcp` — configuração de servidor MCP

<Note>
  Somente proprietário. Desabilitado por padrão — habilite com `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto do agente incorporado.

## `/debug` — substituições somente em tempo de execução

<Note>
  Somente proprietário. Desabilitado por padrão — habilite com `commands.debug: true`.
  Substituições se aplicam imediatamente a novas leituras de configuração, mas **não** escrevem em disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — gerenciamento de Plugins

<Note>
  Somente proprietário para escritas. Desabilitado por padrão — habilite com `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` atualiza a configuração de Plugin e recarrega a quente o tempo de execução de Plugins do Gateway
para novas interações do agente. `/plugins install` reinicia Gateways gerenciados
automaticamente porque os módulos-fonte do Plugin mudaram.

## `/trace` — saída de rastreamento de Plugin

```text
/trace          # mostra o estado atual do rastreamento
/trace on
/trace off
```

`/trace` revela linhas de rastreamento/depuração de Plugin com escopo de sessão sem o modo
totalmente detalhado. Ele não substitui `/debug` (substituições de tempo de execução) nem `/verbose` (saída normal
de ferramentas).

## `/btw` — perguntas laterais

`/btw` é uma pergunta lateral rápida sobre o contexto da sessão atual. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Diferentemente de uma mensagem normal:

- Usa a sessão atual como contexto de fundo.
- Em sessões do ambiente Codex, executa como uma thread lateral efêmera do Codex.
- **Não** altera o contexto futuro da sessão.
- Não é escrito no histórico da transcrição.

Consulte [perguntas laterais BTW](/pt-BR/tools/btw) para o comportamento completo.

## Observações de superfície

<AccordionGroup>
  <Accordion title="Escopo de sessão por superfície">
    - **Comandos de texto:** executam na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
    - **Comandos nativos do Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos do Slack:** `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos do Telegram:** `telegram:slash:<userId>` (alvos a sessão de chat via `CommandTargetSessionKey`)
    - **`/stop`** mira a sessão de chat ativa para abortar a execução atual.

  </Accordion>
  <Accordion title="Especificidades do Slack">
    `channels.slack.slashCommand` oferece suporte a um único comando no estilo `/openclaw`.
    Com `commands.native: true`, crie um comando de barra do Slack por comando integrado.
    Registre `/agentstatus` (não `/status`) porque o Slack reserva
    `/status`. O texto `/status` ainda funciona em mensagens do Slack.
  </Accordion>
  <Accordion title="Caminho rápido e atalhos embutidos">
    - Mensagens contendo somente comando de remetentes na lista de permitidos são tratadas imediatamente (ignoram fila + modelo).
    - Atalhos embutidos (`/help`, `/commands`, `/status`, `/whoami`) também funcionam inseridos em mensagens normais e são removidos antes de o modelo ver o texto restante.
    - Mensagens contendo somente comando de remetentes não autorizados são ignoradas silenciosamente; tokens embutidos `/...` são tratados como texto simples.

  </Accordion>
  <Accordion title="Observações sobre argumentos">
    - Comandos aceitam um `:` opcional entre o comando e os argumentos (`/think: high`, `/send: on`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto é tratado como o corpo da mensagem.
    - `/allowlist add|remove` requer `commands.config: true` e respeita `configWrites` do canal.

  </Accordion>
</AccordionGroup>

## Uso e status do provedor

- **Uso/cota do provedor** (por exemplo, "Claude 80% left") aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado.
- **Linhas de token/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o instantâneo da sessão ao vivo está esparso.
- **Execução versus tempo de execução:** `/status` relata `Execution` para o caminho efetivo do sandbox e `Runtime` para quem está executando a sessão: `OpenClaw Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP.
- **Tokens/custo por resposta:** controlado por `/usage off|tokens|full`.
- `/model status` trata de modelos/autenticação/endpoints, não de uso.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Como comandos de barra de Skill são registrados e protegidos.
  </Card>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie uma Skill que registra seu próprio comando de barra.
  </Card>
  <Card title="BTW" href="/pt-BR/tools/btw" icon="comments">
    Perguntas laterais sem alterar o contexto da sessão.
  </Card>
  <Card title="Steer" href="/pt-BR/tools/steer" icon="compass">
    Oriente o agente durante a execução com `/steer`.
  </Card>
</CardGroup>
