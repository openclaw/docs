---
read_when:
    - Como usar ou configurar comandos de chat
    - Depuração do roteamento de comandos ou das permissões
    - Entendendo como os comandos de Skills são registrados
sidebarTitle: Slash commands
summary: Todos os comandos de barra, diretivas e atalhos inline disponíveis — configuração, roteamento e comportamento por superfície.
title: Comandos de barra
x-i18n:
    generated_at: "2026-07-16T13:03:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

O Gateway processa comandos enviados como mensagens independentes que começam com `/`.
Os comandos bash exclusivos do host usam `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa está vinculada a uma sessão ACP, o texto normal é encaminhado ao
harness ACP. Os comandos de gerenciamento do Gateway permanecem locais: `/acp ...` sempre chega
ao manipulador de comandos do OpenClaw, e `/status` e `/unfocus` permanecem locais sempre que
o processamento de comandos está habilitado para a superfície.

## Três tipos de comando

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensagens `/...` independentes processadas pelo Gateway. Devem ser enviadas como o
    único conteúdo da mensagem.
  </Card>
  <Card title="Diretivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — removidas da mensagem antes que o modelo
    a veja. Persistem as configurações da sessão quando enviadas isoladamente; atuam como orientações em linha
    quando enviadas com outro texto.
  </Card>
  <Card title="Atalhos em linha" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — são executados imediatamente e
    removidos antes que o modelo veja o texto restante. Somente remetentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalhes do comportamento das diretivas">
    - As diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens **somente com diretivas** (a mensagem contém apenas diretivas), elas
      persistem na sessão e respondem com uma confirmação.
    - Em mensagens de **chat normal** com outro texto, elas atuam como orientações em linha e
      **não** persistem as configurações da sessão.
    - As diretivas se aplicam somente a **remetentes autorizados**. Se `commands.allowFrom`
      estiver definido, ele será a única lista de permissões usada; caso contrário, a autorização virá das
      listas de permissões/pareamento do canal e de `commands.useAccessGroups`. Para remetentes não
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
  Habilita a análise de `/...` em mensagens de chat. Em superfícies sem comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), os comandos de texto
  funcionam mesmo quando definido como `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: ativado para Discord/Telegram; desativado para Slack;
  ignorado para provedores sem suporte nativo. Substitua por canal com
  `channels.<provider>.commands.native`. No Discord, `false` ignora o registro de
  comandos de barra; comandos registrados anteriormente podem permanecer visíveis até serem removidos.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de Skills nativamente quando houver suporte. Automático: ativado para
  Discord/Telegram; desativado para Slack. Substitua com
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos do shell do host (alias `/bash <cmd>`). Requer
  listas de permissões `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Por quanto tempo o bash aguarda antes de alternar para o modo em segundo plano (`0` passa
  imediatamente para o segundo plano).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`). Somente para o proprietário.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`). Somente para o proprietário.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins, além de instalação e ativação/desativação). Somente para o proprietário em operações de gravação.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições de configuração somente em tempo de execução). Somente para o proprietário.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` e solicitações externas de reinicialização `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista de permissões explícita do proprietário para superfícies de comandos exclusivas do proprietário. Separada de
  `commands.allowFrom` e do acesso por pareamento em mensagens diretas.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: exige a identidade do proprietário para comandos exclusivos do proprietário. Quando `true`,
  o remetente deve corresponder a `commands.ownerAllowFrom` ou possuir o escopo interno `operator.admin`.
  Uma entrada curinga `allowFrom` **não** é suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como os IDs do proprietário aparecem no prompt do sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segredo HMAC usado quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permissões por provedor para autorização de comandos. Quando configurada, ela é a
  **única** fonte de autorização para comandos e diretivas. Use `"*"` como
  padrão global; chaves específicas do provedor o substituem.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Os comandos vêm de três fontes:

- **Comandos internos do núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock gerados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de plugins:** chamadas `registerCommand()` do plugin

A disponibilidade depende das opções de configuração, da superfície do canal e dos
plugins instalados/habilitados.

### Comandos do núcleo

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    | Comando | Descrição |
    | --- | --- |
    | `/new [model]` | Arquiva a sessão atual e inicia uma nova |
    | `/reset [soft [message]]` | Redefine a sessão atual no local. `soft` mantém a transcrição, descarta IDs de sessão reutilizados do backend da CLI e executa novamente a inicialização |
    | `/name <title>` | Nomeia ou renomeia a sessão atual. Omita o título para ver o nome atual e uma sugestão |
    | `/compact [instructions]` | Compacta o contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction) |
    | `/stop` | Interrompe a execução atual |
    | `/session idle <duration\|off>` | Gerencia a expiração por inatividade da vinculação à thread |
    | `/session max-age <duration\|off>` | Gerencia a expiração por idade máxima da vinculação à thread |
    | `/export-session [path]` | Somente para o proprietário. Exporta a sessão atual para HTML dentro do espaço de trabalho. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta um pacote de trajetória JSONL para a sessão atual. Alias: `/trajectory` |

    Caminhos `/export-session` explícitos substituem arquivos existentes dentro do
    espaço de trabalho. Omita o caminho para gerar um nome de arquivo sem risco de colisão.

    <Note>
      A Control UI intercepta `/new` digitado para criar e alternar para uma nova
      sessão do painel, exceto quando `session.dmScope: "main"` está configurado
      e o pai atual é a sessão principal do agente — nesse caso, `/new`
      redefine a sessão principal no local. `/reset` digitado ainda executa a
      redefinição no local do Gateway. Use `/model default` quando quiser limpar uma
      seleção de modelo fixada à sessão.
    </Note>

  </Accordion>

  <Accordion title="Controles de modelo e execução">
    | Comando | Descrição |
    | --- | --- |
    | `/think <level\|default>` | Define o nível de raciocínio ou limpa a substituição da sessão. Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Alterna a saída detalhada. Alias: `/v` |
    | `/trace on\|off` | Alterna a saída de rastreamento de plugins para a sessão atual |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, define ou limpa o modo rápido |
    | `/reasoning [on\|off\|stream]` | Alterna a visibilidade do raciocínio. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Alterna o modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra ou define os padrões de execução |
    | `/login [codex\|openai\|openai-codex]` | Pareia o login do Codex/OpenAI a partir de um chat privado ou de uma sessão da interface Web. Somente proprietário/administrador |
    | `/model [name\|#\|status]` | Mostra ou define o modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista provedores ou modelos configurados/disponíveis para autenticação |
    | `/queue <mode>` | Gerencia o comportamento da fila de execuções ativas. Consulte [Fila](/pt-BR/concepts/queue) e [Direcionamento da fila](/pt-BR/concepts/queue-steering) |
    | `/steer <message>` | Injeta orientação na execução ativa. Alias: `/tell`. Consulte [Direcionar](/pt-BR/tools/steer) |

    <AccordionGroup>
      <Accordion title="Segurança de saída detalhada / rastreamento / modo rápido / raciocínio">
        - `/verbose` destina-se à depuração — mantenha-o **desativado** durante o uso normal.
        - `/trace` revela apenas linhas de rastreamento/depuração pertencentes ao plugin; as demais mensagens detalhadas permanecem desativadas.
        - `/fast auto|on|off` persiste uma substituição da sessão; use a opção `inherit` da interface de Sessões para limpá-la.
        - `/fast` é específico do provedor: OpenAI/Codex o mapeiam para `service_tier=priority`; solicitações diretas à Anthropic o mapeiam para `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` apresentam riscos em ambientes de grupo — podem revelar raciocínio interno ou diagnósticos de plugins. Mantenha-os desativados em chats em grupo.

      </Accordion>
      <Accordion title="Detalhes da troca de modelo">
        - `/model` persiste imediatamente o novo modelo na sessão.
        - Se o agente estiver ocioso, a próxima execução o usará imediatamente.
        - Se houver uma execução ativa, a troca será marcada como pendente e aplicada no próximo ponto seguro de nova tentativa.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descoberta e status">
    | Comando | Descrição |
    | --- | --- |
    | `/help` | Mostra o breve resumo da ajuda |
    | `/commands` | Mostra o catálogo de comandos gerado |
    | `/tools [compact\|verbose]` | Mostra o que o agente atual pode usar neste momento |
    | `/status` | Mostra o status da execução/tempo de execução, o tempo de atividade do Gateway e do sistema, a integridade dos plugins, além do uso/da cota do provedor |
    | `/status plugins` | Mostra informações detalhadas sobre a integridade dos plugins: erros de carregamento, quarentenas, falhas de plugins de canal, problemas de dependência e avisos de compatibilidade. Requer `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gerencia o [objetivo](/pt-BR/tools/goal) persistente da sessão atual |
    | `/diagnostics [note]` | Fluxo de relatório de suporte exclusivo do proprietário. Solicita aprovação de execução todas as vezes |
    | `/openclaw <request>` | Executa o assistente de configuração e reparo do OpenClaw a partir de uma mensagem direta do proprietário |
    | `/tasks` | Lista tarefas em segundo plano ativas/recentes da sessão atual |
    | `/context [list\|detail\|map\|json]` | Explica como o contexto é montado |
    | `/whoami` | Mostra seu ID de remetente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla o rodapé de uso por resposta (`reset`/`inherit`/`clear`/`default` limpa a substituição da sessão para voltar a herdar o padrão configurado) ou exibe um resumo local de custos |
  </Accordion>

  <Accordion title="Skills, listas de permissões, aprovações">
    | Comando | Descrição |
    | --- | --- |
    | `/skill <name> [input]` | Executar uma skill pelo nome |
    | `/learn [request]` | Elaborar uma skill revisável com base na conversa atual ou nas fontes nomeadas por meio do [Workshop de Skills](/pt-BR/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gerenciar entradas da lista de permissões. Somente texto |
    | `/approve <id> <decision>` | Resolver solicitações de aprovação de execução ou de plugin |
    | `/btw <question>` | Fazer uma pergunta paralela sem alterar o contexto da sessão. Alias: `/side`. Consulte [BTW](/pt-BR/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes e ACP">
    | Comando | Descrição |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecionar execuções de subagentes da sessão atual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gerenciar sessões ACP e opções de runtime. Os controles de runtime exigem uma identidade de proprietário externo ou administrador interno do Gateway |
    | `/focus <target>` | Vincular a thread atual do Discord ou o tópico do Telegram a um destino de sessão |
    | `/unfocus` | Remover o vínculo da thread atual |
    | `/agents` | Listar agentes vinculados a threads da sessão atual |
  </Accordion>

  <Accordion title="Gravações e administração exclusivas do proprietário">
    | Comando | Requer | Descrição |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Ler ou gravar `openclaw.json`. Exclusivo do proprietário |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Ler ou gravar a configuração de servidores MCP gerenciada pelo OpenClaw. Exclusivo do proprietário |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecionar ou modificar o estado de plugins. Gravações exclusivas do proprietário. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Substituições de configuração somente para o runtime. Exclusivo do proprietário |
    | `/restart` | `commands.restart: true` (padrão) | Reiniciar o OpenClaw |
    | `/send on\|off\|inherit` | proprietário | Definir a política de envio |
  </Accordion>

  <Accordion title="Voz, TTS, controle de canal">
    | Comando | Descrição |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlar o TTS. Consulte [TTS](/pt-BR/tools/tts) |
    | `/activation mention\|always` | Definir o modo de ativação de grupo |
    | `/bash <command>` | Executar um comando de shell no host. Alias: `! <command>`. Requer `commands.bash: true` |
    | `!poll [sessionId]` | Verificar uma tarefa bash em segundo plano |
    | `!stop [sessionId]` | Interromper uma tarefa bash em segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamento

Os comandos de acoplamento mudam a rota de resposta da sessão ativa para outro canal vinculado.
Consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking) para configuração e solução de problemas.

Gerados por plugins de canal com suporte a comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Os comandos de acoplamento exigem `session.identityLinks`. O remetente de origem e o par de destino
devem estar no mesmo grupo de identidades.

### Comandos de plugins incluídos

| Comando                                                 | Descrição                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Ativar ou desativar o Dreaming da memória (proprietário ou administrador do Gateway). Consulte [Dreaming](/pt-BR/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gerenciar o pareamento de dispositivos. Consulte [Pareamento](/pt-BR/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Autorizar temporariamente comandos de Node de alto risco (câmera/tela/computador/gravações). Consulte [Uso do computador](/pt-BR/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gerenciar a configuração de voz do Talk. Nome nativo no Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Enviar predefinições de cartões avançados do LINE. Consulte [LINE](/pt-BR/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Vincular, direcionar e inspecionar o harness do app-server do Codex (status, threads, retomada, modelo, modo rápido, permissões, compactação, revisão, MCP, skills e muito mais). Consulte [Harness do Codex](/pt-BR/plugins/codex-harness) |

Somente para QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de skills

As skills invocáveis pelo usuário são disponibilizadas como comandos de barra:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- As skills podem ser registradas como comandos diretos (por exemplo, `/prose` para OpenProse).
- O registro nativo de comandos de skills é controlado por `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- Os nomes são normalizados para `a-z0-9_` (máximo de 32 caracteres); colisões recebem sufixos numéricos.

<AccordionGroup>
  <Accordion title="Encaminhamento de comandos de skills">
    Por padrão, os comandos de skills são encaminhados ao modelo como uma solicitação normal.

    As skills podem declarar `command-dispatch: tool` para encaminhar diretamente a uma ferramenta
    (determinístico, sem participação do modelo). Exemplo: `/prose` (plugin OpenProse)
    — consulte [OpenProse](/pt-BR/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    O Discord usa preenchimento automático para opções dinâmicas e menus de botões quando os
    argumentos obrigatórios são omitidos. O Telegram e o Slack exibem um menu de botões para comandos com
    opções. As opções dinâmicas são resolvidas de acordo com o modelo da sessão de destino, portanto opções
    específicas do modelo, como os níveis de `/think`, seguem a substituição de `/model` da sessão.
  </Accordion>
</AccordionGroup>

## `/tools`: o que o agente pode usar agora

`/tools` responde a uma pergunta de runtime: **o que este agente pode usar agora nesta
conversa** — não um catálogo estático de configuração.

```text
/tools         # exibição compacta
/tools verbose # com descrições curtas
```

Os resultados são específicos da sessão. Alterar o agente, canal, thread, autorização do
remetente ou modelo pode alterar a saída. Para editar perfis e substituições,
use o painel Ferramentas da IU de Controle ou as superfícies de configuração.

## `/model`: seleção de modelo

```text
/model             # mostrar o seletor de modelos
/model list        # equivalente
/model 3           # selecionar pelo número no seletor
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # limpar a seleção de modelo da sessão
/model status      # exibição detalhada com endpoint e modo da API
```

No Discord, `/model` e `/models` abrem um seletor interativo com listas suspensas de provedor e
modelo. O seletor respeita `agents.defaults.models`, incluindo
entradas de `provider/*`.

## `/config`: gravações de configuração em disco

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
`/mcp show` oculta campos que contêm credenciais, valores reconhecidos de flags de credenciais
e argumentos conhecidos com formato de segredo. Quando executada em um grupo, a
configuração é enviada de forma privada ao proprietário; se não houver uma rota privada
disponível para o proprietário, o comando falhará de forma segura e solicitará que o proprietário tente novamente em uma conversa
direta.

## `/debug`: substituições somente para o runtime

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
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` atualiza a configuração dos plugins e recarrega a quente o runtime de
plugins do Gateway para novas interações do agente. `/plugins install` reinicia automaticamente os
Gateways gerenciados porque os módulos-fonte dos plugins foram alterados. Instalações confiáveis do ClawHub
e do catálogo oficial não precisam de confirmação adicional. Fontes arbitrárias de npm,
git, arquivo, `npm-pack:` e caminho local exibem um aviso de procedência e
exigem um `--force` ao final depois que a fonte for revisada. Essa flag confirma
a fonte e permite substituir uma instalação existente; ela não ignora
`security.installPolicy` nem as verificações de segurança do instalador. Versões do ClawHub com
avisos de risco ainda exigem a flag separada e exclusiva do shell
`--acknowledge-clawhub-risk`. Instalações do marketplace, vinculadas e fixadas também
continuam exclusivas do shell.

## `/trace`: saída de rastreamento de plugins

```text
/trace          # mostrar o estado atual do rastreamento
/trace on
/trace off
```

`/trace` revela linhas de rastreamento/depuração de plugins específicas da sessão sem o modo
detalhado completo. Ele não substitui `/debug` (substituições de runtime) nem `/verbose` (saída normal
de ferramentas).

## `/btw`: perguntas paralelas

`/btw` é uma pergunta paralela rápida sobre o contexto da sessão atual. Alias: `/side`.

```text
/btw o que estamos fazendo agora?
/side o que mudou enquanto a execução principal continuava?
```

Diferentemente de uma mensagem normal:

- Usa a sessão atual como contexto de fundo.
- Em sessões do harness do Codex, é executada como uma thread paralela efêmera do Codex.
- **Não** altera o contexto futuro da sessão.
- Não é gravada no histórico da transcrição.

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para conhecer o comportamento completo.

## Observações sobre superfícies

<AccordionGroup>
  <Accordion title="Escopo da sessão por superfície">
    - **Comandos de texto:** são executados na sessão normal da conversa (mensagens diretas compartilham `main`; grupos têm sua própria sessão).
    - **Comandos nativos do Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos do Slack:** `agent:<agentId>:slack:slash:<userId>` (prefixo configurável por meio de `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos do Telegram:** `telegram:slash:<userId>` (direciona à sessão da conversa por meio de `CommandTargetSessionKey`)
    - **`/login codex`** envia códigos de pareamento de dispositivos somente por conversa privada ou pelos caminhos de resposta da IU da Web. Invocações em grupos/tópicos do Telegram solicitam que o proprietário envie uma mensagem direta ao bot.
    - **`/stop`** direciona à sessão da conversa ativa para cancelar a execução atual.

  </Accordion>
  <Accordion title="Especificidades do Slack">
    `channels.slack.slashCommand` oferece suporte a um único comando no estilo `/openclaw`.
    Com `commands.native: true`, crie um comando de barra do Slack para cada comando
    integrado. Registre `/agentstatus` (não `/status`), pois o Slack reserva
    `/status`. O texto `/status` ainda funciona em mensagens do Slack.
  </Accordion>
  <Accordion title="Caminho rápido e atalhos em linha">
    - Mensagens que contêm apenas comandos, enviadas por remetentes na lista de permissões, são processadas imediatamente (ignoram a fila e o modelo).
    - Atalhos em linha (`/help`, `/commands`, `/status`, `/whoami`) também funcionam incorporados a mensagens normais e são removidos antes que o modelo veja o texto restante.
    - Mensagens não autorizadas que contêm apenas comandos são ignoradas silenciosamente; tokens `/...` em linha são tratados como texto simples.

  </Accordion>
  <Accordion title="Observações sobre argumentos">
    - Os comandos aceitam um `:` opcional entre o comando e os argumentos (`/think: high`, `/send: on`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto será tratado como o corpo da mensagem.
    - `/allowlist add|remove` exige `commands.config: true` e respeita o `configWrites` do canal.

  </Accordion>
</AccordionGroup>

## Uso e status do provedor

- **Uso/cota do provedor** (por exemplo, "Claude com 80% restante") é exibido em `/status` para o provedor do modelo atual quando o acompanhamento de uso está ativado.
- **Linhas de tokens/cache** em `/status` podem usar como alternativa a entrada de uso mais recente da transcrição quando o instantâneo da sessão ativa contém poucos dados.
- **Execução versus ambiente de execução:** `/status` informa `Execution` para o caminho efetivo do sandbox e `Runtime` para indicar quem está executando a sessão: `OpenClaw Default`, `OpenAI Codex`, um backend de CLI ou um backend de ACP.
- **Tokens/custo por resposta:** controlados por `/usage off|tokens|full`.
- `/model status` trata de modelos/autenticação/endpoints, não de uso.

## Conteúdo relacionado

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
  <Card title="Direcionamento" href="/pt-BR/tools/steer" icon="compass">
    Oriente o agente durante a execução com `/steer`.
  </Card>
</CardGroup>
