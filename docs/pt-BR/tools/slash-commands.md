---
read_when:
    - Usar ou configurar comandos de chat
    - Depuração do roteamento de comandos ou das permissões
    - Entendendo como os comandos de Skills são registrados
sidebarTitle: Slash commands
summary: Todos os comandos de barra, diretivas e atalhos embutidos disponíveis — configuração, roteamento e comportamento por superfície.
title: Comandos de barra
x-i18n:
    generated_at: "2026-07-12T00:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

O Gateway processa comandos enviados como mensagens independentes que começam com `/`.
Comandos bash exclusivos do host usam `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa está vinculada a uma sessão ACP, o texto normal é encaminhado ao
harness ACP. Os comandos de gerenciamento do Gateway permanecem locais: `/acp ...`
sempre chega ao manipulador de comandos do OpenClaw, e `/status` e `/unfocus`
permanecem locais sempre que o processamento de comandos está habilitado para a
superfície.

## Três tipos de comando

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensagens independentes `/...` processadas pelo Gateway. Devem ser enviadas
    como o único conteúdo da mensagem.
  </Card>
  <Card title="Diretivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — removidas da mensagem antes que o modelo
    a veja. Persistem as configurações da sessão quando enviadas isoladamente;
    funcionam como instruções embutidas quando enviadas com outro texto.
  </Card>
  <Card title="Atalhos embutidos" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — executados imediatamente e
    removidos antes que o modelo veja o texto restante. Somente remetentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalhes do comportamento das diretivas">
    - As diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens **somente com diretivas** (a mensagem contém apenas diretivas),
      elas persistem na sessão e respondem com uma confirmação.
    - Em mensagens de **chat normal** com outro texto, elas funcionam como
      instruções embutidas e **não** persistem as configurações da sessão.
    - As diretivas se aplicam apenas a **remetentes autorizados**. Se
      `commands.allowFrom` estiver definido, essa será a única lista de permissões
      usada; caso contrário, a autorização virá das listas de permissões ou do
      pareamento do canal, além de `commands.useAccessGroups`. Para remetentes não
      autorizados, as diretivas são tratadas como texto simples.
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
  Habilita a análise de `/...` em mensagens de chat. Em superfícies sem comandos
  nativos (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), os
  comandos de texto funcionam mesmo quando a opção está definida como `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: ativado para Discord/Telegram; desativado
  para Slack; ignorado para provedores sem suporte nativo. Substitua por canal com
  `channels.<provider>.commands.native`. No Discord, `false` ignora o registro de
  comandos de barra; comandos registrados anteriormente podem permanecer visíveis
  até serem removidos.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de Skills nativamente quando houver suporte. Automático:
  ativado para Discord/Telegram; desativado para Slack. Substitua com
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos do shell do host (alias `/bash <cmd>`).
  Requer listas de permissões de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Por quanto tempo o bash aguarda antes de alternar para o modo em segundo plano
  (`0` envia imediatamente para segundo plano).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`). Somente para o proprietário.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`). Somente para o proprietário.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins, além de instalação e ativação/desativação). Somente o proprietário pode fazer gravações.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições de configuração somente em tempo de execução). Somente para o proprietário.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` e ações da ferramenta de reinicialização do Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista explícita de permissões do proprietário para superfícies de comandos
  exclusivas do proprietário. Separada de `commands.allowFrom` e do acesso por
  pareamento em mensagens diretas.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: exige a identidade do proprietário para comandos exclusivos do
  proprietário. Quando `true`, o remetente deve corresponder a
  `commands.ownerAllowFrom` ou possuir o escopo interno `operator.admin`.
  Uma entrada curinga em `allowFrom` **não** é suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como os IDs dos proprietários aparecem no prompt do sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segredo HMAC usado quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permissões por provedor para autorização de comandos. Quando configurada, ela é a
  **única** fonte de autorização para comandos e diretivas. Use `"*"` como padrão
  global; chaves específicas de provedores o substituem.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Os comandos vêm de três fontes:

- **Comandos integrados do núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock gerados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugins:** chamadas `registerCommand()` de Plugins

A disponibilidade depende das opções de configuração, da interface do canal e dos
Plugins instalados/habilitados.

### Comandos do núcleo

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    | Comando | Descrição |
    | --- | --- |
    | `/new [model]` | Arquiva a sessão atual e inicia uma nova |
    | `/reset [soft [message]]` | Redefine a sessão atual no mesmo lugar. `soft` mantém a transcrição, descarta IDs de sessão reutilizados do backend da CLI e executa novamente a inicialização |
    | `/name <title>` | Nomeia ou renomeia a sessão atual. Omita o título para ver o nome atual e uma sugestão |
    | `/compact [instructions]` | Compacta o contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction) |
    | `/stop` | Interrompe a execução atual |
    | `/session idle <duration\|off>` | Gerencia a expiração por inatividade da vinculação à conversa |
    | `/session max-age <duration\|off>` | Gerencia a expiração por idade máxima da vinculação à conversa |
    | `/export-session [path]` | Exporta a sessão atual para HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta um pacote de trajetória JSONL da sessão atual. Alias: `/trajectory` |

    <Note>
      A interface de controle intercepta `/new` digitado para criar e alternar para uma nova
      sessão do painel, exceto quando `session.dmScope: "main"` está configurado
      e o pai atual é a sessão principal do agente — nesse caso, `/new`
      redefine a sessão principal no mesmo lugar. `/reset` digitado ainda executa a
      redefinição no mesmo lugar do Gateway. Use `/model default` quando quiser limpar uma
      seleção de modelo fixada na sessão.
    </Note>

  </Accordion>

  <Accordion title="Controles de modelo e execução">
    | Comando | Descrição |
    | --- | --- |
    | `/think <level\|default>` | Define o nível de reflexão ou limpa a substituição da sessão. Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ativa ou desativa a saída detalhada. Alias: `/v` |
    | `/trace on\|off` | Ativa ou desativa a saída de rastreamento de Plugins na sessão atual |
    | `/fast [status\|auto\|on\|off\|default]` | Exibe, define ou limpa o modo rápido |
    | `/reasoning [on\|off\|stream]` | Ativa ou desativa a visibilidade do raciocínio. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Ativa ou desativa o modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Exibe ou define os padrões de execução |
    | `/login [codex\|openai\|openai-codex]` | Vincula o login do Codex/OpenAI por meio de uma conversa privada ou sessão da interface web. Somente proprietário/administrador |
    | `/model [name\|#\|status]` | Exibe ou define o modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista provedores ou modelos configurados/disponíveis para autenticação |
    | `/queue <mode>` | Gerencia o comportamento da fila de execuções ativas. Consulte [Fila](/pt-BR/concepts/queue) e [Direcionamento da fila](/pt-BR/concepts/queue-steering) |
    | `/steer <message>` | Injeta orientações na execução ativa. Alias: `/tell`. Consulte [Direcionar](/pt-BR/tools/steer) |

    <AccordionGroup>
      <Accordion title="segurança de verbose / trace / fast / reasoning">
        - `/verbose` serve para depuração — mantenha-o **desativado** durante o uso normal.
        - `/trace` revela somente linhas de rastreamento/depuração pertencentes a Plugins; as mensagens detalhadas normais permanecem desativadas.
        - `/fast auto|on|off` mantém uma substituição na sessão; use a opção `inherit` na interface de sessões para limpá-la.
        - `/fast` é específico do provedor: OpenAI/Codex o mapeiam para `service_tier=priority`; solicitações diretas à Anthropic o mapeiam para `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` são arriscados em contextos de grupo — podem revelar raciocínio interno ou diagnósticos de Plugins. Mantenha-os desativados em conversas em grupo.

      </Accordion>
      <Accordion title="Detalhes da troca de modelo">
        - `/model` salva imediatamente o novo modelo na sessão.
        - Se o agente estiver ocioso, a próxima execução o utilizará imediatamente.
        - Se uma execução estiver ativa, a troca será marcada como pendente e aplicada no próximo ponto seguro de nova tentativa.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descoberta e status">
    | Comando | Descrição |
    | --- | --- |
    | `/help` | Exibe o resumo breve da ajuda |
    | `/commands` | Exibe o catálogo de comandos gerado |
    | `/tools [compact\|verbose]` | Exibe o que o agente atual pode usar neste momento |
    | `/status` | Exibe o status de execução/tempo de execução, o tempo de atividade do Gateway e do sistema, a integridade dos Plugins, além do uso/cota do provedor |
    | `/status plugins` | Exibe detalhes da integridade dos Plugins: erros de carregamento, quarentenas, falhas de Plugins de canal, problemas de dependências e avisos de compatibilidade. Requer `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gerencia o [objetivo](/pt-BR/tools/goal) persistente da sessão atual |
    | `/diagnostics [note]` | Fluxo de relatório de suporte exclusivo do proprietário. Solicita aprovação de execução todas as vezes |
    | `/crestodian <request>` | Executa o assistente de configuração e reparo Crestodian a partir de uma mensagem direta do proprietário |
    | `/tasks` | Lista tarefas em segundo plano ativas/recentes da sessão atual |
    | `/context [list\|detail\|map\|json]` | Explica como o contexto é montado |
    | `/whoami` | Exibe seu ID de remetente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla o rodapé de uso por resposta (`reset`/`inherit`/`clear`/`default` limpa a substituição da sessão para voltar a herdar o padrão configurado) ou exibe um resumo local de custos |
  </Accordion>

  <Accordion title="Skills, listas de permissões e aprovações">
    | Comando | Descrição |
    | --- | --- |
    | `/skill <name> [input]` | Executa uma skill pelo nome |
    | `/learn [request]` | Elabora uma skill revisável a partir da conversa atual ou de fontes indicadas por meio da [Oficina de Skills](/pt-BR/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gerencia entradas da lista de permissões. Somente texto |
    | `/approve <id> <decision>` | Resolve solicitações de aprovação de execução ou de Plugins |
    | `/btw <question>` | Faz uma pergunta paralela sem alterar o contexto da sessão. Alias: `/side`. Consulte [BTW](/pt-BR/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes e ACP">
    | Comando | Descrição |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspeciona as execuções de subagentes da sessão atual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gerencia sessões ACP e opções de execução. Os controles de execução exigem a identidade de um proprietário externo ou administrador interno do Gateway |
    | `/focus <target>` | Vincula a thread atual do Discord ou o tópico do Telegram a um destino de sessão |
    | `/unfocus` | Remove o vínculo da thread atual |
    | `/agents` | Lista os agentes vinculados à thread na sessão atual |
  </Accordion>

  <Accordion title="Gravações e administração exclusivas do proprietário">
    | Comando | Requer | Descrição |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lê ou grava `openclaw.json`. Exclusivo do proprietário |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lê ou grava a configuração de servidores MCP gerenciada pelo OpenClaw. Exclusivo do proprietário |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspeciona ou altera o estado dos plugins. Gravações exclusivas do proprietário. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Substituições de configuração somente em tempo de execução. Exclusivo do proprietário |
    | `/restart` | `commands.restart: true` (padrão) | Reinicia o OpenClaw |
    | `/send on\|off\|inherit` | proprietário | Define a política de envio |
  </Accordion>

  <Accordion title="Voz, TTS e controle de canal">
    | Comando | Descrição |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla o TTS. Consulte [TTS](/pt-BR/tools/tts) |
    | `/activation mention\|always` | Define o modo de ativação em grupo |
    | `/bash <command>` | Executa um comando do shell do host. Alias: `! <command>`. Requer `commands.bash: true` |
    | `!poll [sessionId]` | Verifica uma tarefa do bash em segundo plano |
    | `!stop [sessionId]` | Interrompe uma tarefa do bash em segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamento

Os comandos de acoplamento alteram a rota de resposta da sessão ativa para outro canal vinculado.
Consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking) para obter instruções de configuração e solução de problemas.

Gerados a partir de plugins de canal compatíveis com comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Os comandos de acoplamento exigem `session.identityLinks`. O remetente de origem e o par de destino
devem estar no mesmo grupo de identidades.

### Comandos de plugins incluídos

| Comando                                                 | Descrição                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Ativa ou desativa o Dreaming de memória (proprietário ou administrador do Gateway). Consulte [Dreaming](/pt-BR/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gerencia o pareamento de dispositivos. Consulte [Pareamento](/pt-BR/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Habilita temporariamente comandos de alto risco do Node (câmera/tela/computador/gravações). Consulte [Uso do computador](/pt-BR/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gerencia a configuração de voz do Talk. Nome nativo no Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Envia predefinições de cartões avançados do LINE. Consulte [LINE](/pt-BR/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Vincula, orienta e inspeciona o ambiente do servidor de aplicativo Codex (status, threads, retomada, modelo, modo rápido, permissões, compactação, revisão, MCP, Skills e muito mais). Consulte [Ambiente Codex](/pt-BR/plugins/codex-harness) |

Somente no QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skills

As Skills que podem ser invocadas pelo usuário são disponibilizadas como comandos de barra:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- As Skills podem ser registradas como comandos diretos (por exemplo, `/prose` para o OpenProse).
- O registro de comandos nativos de Skills é controlado por `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- Os nomes são normalizados para `a-z0-9_` (máximo de 32 caracteres); colisões recebem sufixos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de Skills">
    Por padrão, os comandos de Skills são encaminhados ao modelo como uma solicitação normal.

    As Skills podem declarar `command-dispatch: tool` para encaminhar diretamente a uma ferramenta
    (de forma determinística, sem participação do modelo). Exemplo: `/prose` (plugin OpenProse)
    — consulte [OpenProse](/pt-BR/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    O Discord usa preenchimento automático para opções dinâmicas e menus de botões quando os
    argumentos obrigatórios são omitidos. O Telegram e o Slack exibem um menu de botões para comandos com
    opções. As opções dinâmicas são resolvidas com base no modelo da sessão de destino; portanto, opções
    específicas do modelo, como os níveis de `/think`, seguem a substituição de `/model` da sessão.
  </Accordion>
</AccordionGroup>

## `/tools`: o que o agente pode usar agora

`/tools` responde a uma pergunta de tempo de execução: **o que este agente pode usar agora nesta
conversa** — não é um catálogo estático de configurações.

```text
/tools         # exibição compacta
/tools verbose # com descrições breves
```

Os resultados são específicos da sessão. Alterar o agente, canal, thread, autorização
do remetente ou modelo pode alterar a saída. Para editar perfis e substituições,
use o painel de ferramentas da interface de controle ou as superfícies de configuração.

## `/model`: seleção de modelo

```text
/model             # exibe o seletor de modelos
/model list        # o mesmo
/model 3           # seleciona pelo número no seletor
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # limpa a seleção de modelo da sessão
/model status      # exibição detalhada com endpoint e modo da API
```

No Discord, `/model` e `/models` abrem um seletor interativo com listas suspensas de
provedores e modelos. O seletor respeita `agents.defaults.models`, incluindo
entradas `provider/*`.

## `/config`: gravações da configuração em disco

<Note>
  Exclusivo do proprietário. Desativado por padrão — ative com `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

A configuração é validada antes da gravação. Alterações inválidas são rejeitadas. As atualizações de `/config`
persistem após reinicializações.

## `/mcp`: configuração de servidores MCP

<Note>
  Exclusivo do proprietário. Desativado por padrão — ative com `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto do agente incorporado.
`/mcp show` oculta campos que contêm credenciais, valores de flags de credenciais
reconhecidos e argumentos conhecidos com formato de segredo. Quando executado em um grupo, a
configuração é enviada de forma privada ao proprietário; se não houver uma rota privada disponível
para o proprietário, o comando falha de forma segura e solicita que ele tente novamente em uma conversa
direta.

## `/debug`: substituições somente em tempo de execução

<Note>
  Exclusivo do proprietário. Desativado por padrão — ative com `commands.debug: true`.
  As substituições são aplicadas imediatamente a novas leituras de configuração, mas **não** são gravadas em disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: gerenciamento de plugins

<Note>
  Gravações exclusivas do proprietário. Desativado por padrão — ative com `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` atualiza a configuração de plugins e recarrega em tempo real o ambiente de
plugins do Gateway para novas interações do agente. `/plugins install` reinicia automaticamente os
Gateways gerenciados porque os módulos de origem do plugin foram alterados.

## `/trace`: saída de rastreamento de plugins

```text
/trace          # exibe o estado atual do rastreamento
/trace on
/trace off
```

`/trace` revela linhas de rastreamento/depuração de plugins específicas da sessão sem o modo detalhado
completo. Ele não substitui `/debug` (substituições em tempo de execução) nem `/verbose` (saída normal
das ferramentas).

## `/btw`: perguntas paralelas

`/btw` é uma pergunta paralela rápida sobre o contexto da sessão atual. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Ao contrário de uma mensagem normal:

- Usa a sessão atual como contexto de fundo.
- Em sessões do ambiente Codex, é executada como uma thread paralela efêmera do Codex.
- **Não** altera o contexto futuro da sessão.
- Não é gravada no histórico de transcrição.

Consulte [Perguntas paralelas com BTW](/pt-BR/tools/btw) para conhecer o comportamento completo.

## Observações sobre as superfícies

<AccordionGroup>
  <Accordion title="Escopo da sessão por superfície">
    - **Comandos de texto:** são executados na sessão normal de conversa (mensagens diretas compartilham `main`; grupos têm suas próprias sessões).
    - **Comandos nativos do Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos do Slack:** `agent:<agentId>:slack:slash:<userId>` (prefixo configurável por `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos do Telegram:** `telegram:slash:<userId>` (direcionam-se à sessão da conversa por meio de `CommandTargetSessionKey`)
    - **`/login codex`** envia códigos de pareamento de dispositivo somente por conversa privada ou pelos caminhos de resposta da interface web. Invocações em grupos/tópicos do Telegram solicitam que o proprietário envie uma mensagem direta ao bot.
    - **`/stop`** direciona-se à sessão ativa da conversa para cancelar a execução atual.

  </Accordion>
  <Accordion title="Especificidades do Slack">
    `channels.slack.slashCommand` é compatível com um único comando no estilo `/openclaw`.
    Com `commands.native: true`, crie um comando de barra do Slack para cada comando
    integrado. Registre `/agentstatus` (não `/status`), pois o Slack reserva
    `/status`. O comando de texto `/status` continua funcionando nas mensagens do Slack.
  </Accordion>
  <Accordion title="Caminho rápido e atalhos em linha">
    - Mensagens que contêm somente comandos, enviadas por remetentes incluídos na lista de permissões, são processadas imediatamente (ignoram a fila e o modelo).
    - Atalhos em linha (`/help`, `/commands`, `/status`, `/whoami`) também funcionam incorporados a mensagens normais e são removidos antes que o modelo veja o texto restante.
    - Mensagens não autorizadas que contêm somente comandos são ignoradas silenciosamente; tokens `/...` em linha são tratados como texto simples.

  </Accordion>
  <Accordion title="Observações sobre argumentos">
    - Os comandos aceitam um `:` opcional entre o comando e os argumentos (`/think: high`, `/send: on`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto é tratado como o corpo da mensagem.
    - `/allowlist add|remove` exige `commands.config: true` e respeita `configWrites` do canal.

  </Accordion>
</AccordionGroup>

## Uso e status do provedor

- **Uso/cota do provedor** (por exemplo, "Claude 80% left") aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está ativado.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão em tempo real contém poucos dados.
- **Execução vs. runtime:** `/status` mostra `Execution` para o caminho efetivo do sandbox e `Runtime` para indicar quem está executando a sessão: `OpenClaw Default`, `OpenAI Codex`, um backend de CLI ou um backend de ACP.
- **Tokens/custo por resposta:** controlados por `/usage off|tokens|full`.
- `/model status` trata de modelos/autenticação/endpoints, não de uso.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    Como os comandos de barra de Skills são registrados e controlados.
  </Card>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie uma Skill que registre seu próprio comando de barra.
  </Card>
  <Card title="BTW" href="/pt-BR/tools/btw" icon="comments">
    Perguntas paralelas sem alterar o contexto da sessão.
  </Card>
  <Card title="Direcionar" href="/pt-BR/tools/steer" icon="compass">
    Oriente o agente durante a execução com `/steer`.
  </Card>
</CardGroup>
