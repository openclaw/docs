---
read_when:
    - Usar ou configurar comandos de chat
    - Depurar roteamento de comandos ou permissões
summary: 'Comandos slash: texto vs nativo, configuração e comandos compatíveis'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-06T03:13:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 417e35b9ddd87f25f6c019111b55b741046ea11039dde89210948185ced5696d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que comece com `/`.
O comando de chat bash somente-host usa `! <cmd>` (com `/bash <cmd>` como alias).

Existem dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas de diretiva), elas são tratadas como “dicas inline” e **não** persistem configurações de sessão.
  - Em mensagens apenas de diretiva (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, essa será a única
    allowlist usada; caso contrário, a autorização vem de allowlists/pareamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem as diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (apenas para remetentes em allowlist/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, são removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (padrão `true`) habilita a análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar slash commands); ignorado para providers sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para sobrescrever por provider (bool ou `"auto"`).
  - `false` limpa comandos previamente registrados no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos nativos de **skill** quando suportado.
  - Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige criar um slash command por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para sobrescrever por provider (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos de shell no host (`/bash <cmd>` é um alias; exige allowlists `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de alternar para modo em segundo plano (`0` envia imediatamente para segundo plano).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de plugins mais controles de instalar + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (sobrescritas apenas em runtime).
- `commands.allowFrom` (opcional) define uma allowlist por provider para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (`commands.useAccessGroups` e allowlists/pareamento do canal
  são ignorados). Use `"*"` para um padrão global; chaves específicas do provider o sobrescrevem.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas a comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Texto + nativo (quando habilitado):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (mostra o que o agente atual pode usar agora; `verbose` adiciona descrições)
- `/skill <name> [input]` (executa uma skill pelo nome)
- `/status` (mostra o status atual; inclui uso/cota do provider para o provider de modelo atual quando disponível)
- `/tasks` (lista tarefas em segundo plano para a sessão atual; mostra detalhes de tarefas ativas e recentes com contagens locais de fallback por agente)
- `/allowlist` (listar/adicionar/remover entradas de allowlist)
- `/approve <id> <decision>` (resolve prompts de aprovação do exec; use a mensagem de aprovação pendente para ver as decisões disponíveis)
- `/context [list|detail|json]` (explica “contexto”; `detail` mostra tamanho por arquivo + por ferramenta + por skill + do prompt de sistema)
- `/btw <question>` (faz uma pergunta lateral efêmera sobre a sessão atual sem alterar o contexto futuro da sessão; consulte [/tools/btw](/pt-BR/tools/btw))
- `/export-session [path]` (alias: `/export`) (exporta a sessão atual para HTML com o prompt completo de sistema)
- `/whoami` (mostra seu id de remetente; alias: `/id`)
- `/session idle <duration|off>` (gerencia auto-unfocus por inatividade para bindings de thread focadas)
- `/session max-age <duration|off>` (gerencia auto-unfocus de idade máxima rígida para bindings de thread focadas)
- `/subagents list|kill|log|info|send|steer|spawn` (inspeciona, controla ou cria execuções de subagentes para a sessão atual)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspeciona e controla sessões de runtime ACP)
- `/agents` (lista agentes vinculados à thread para esta sessão)
- `/focus <target>` (Discord: vincula esta thread, ou uma nova thread, a um destino de sessão/subagente)
- `/unfocus` (Discord: remove o binding atual da thread)
- `/kill <id|#|all>` (aborta imediatamente um ou todos os subagentes em execução desta sessão; sem mensagem de confirmação)
- `/steer <id|#> <message>` (direciona um subagente em execução imediatamente: durante a execução quando possível, caso contrário aborta o trabalho atual e reinicia com a mensagem de direção)
- `/tell <id|#> <message>` (alias de `/steer`)
- `/config show|get|set|unset` (persiste a configuração em disco, somente proprietário; exige `commands.config: true`)
- `/mcp show|get|set|unset` (gerencia a configuração do servidor MCP do OpenClaw, somente proprietário; exige `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (inspeciona plugins descobertos, instala novos e alterna ativação; somente proprietário para gravações; exige `commands.plugins: true`)
  - `/plugin` é um alias de `/plugins`.
  - `/plugin install <spec>` aceita as mesmas specs de plugin de `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
  - Gravações de habilitar/desabilitar ainda respondem com uma dica de restart. Em um gateway em primeiro plano monitorado, o OpenClaw pode executar esse restart automaticamente logo após a gravação.
- `/debug show|set|unset|reset` (sobrescritas em runtime, somente proprietário; exige `commands.debug: true`)
- `/usage off|tokens|full|cost` (rodapé de uso por resposta ou resumo de custo local)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controla TTS; consulte [/tts](/pt-BR/tools/tts))
  - Discord: o comando nativo é `/voice` (o Discord reserva `/tts`); o texto `/tts` ainda funciona.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (muda as respostas para Telegram)
- `/dock-discord` (alias: `/dock_discord`) (muda as respostas para Discord)
- `/dock-slack` (alias: `/dock_slack`) (muda as respostas para Slack)
- `/activation mention|always` (somente grupos)
- `/send on|off|inherit` (somente proprietário)
- `/reset` ou `/new [model]` (dica opcional de modelo; o restante é repassado)
- `/think <off|minimal|low|medium|high|xhigh>` (escolhas dinâmicas por modelo/provider; aliases: `/thinking`, `/t`)
- `/fast status|on|off` (omitir o argumento mostra o estado efetivo atual do fast-mode)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; quando ativado, envia uma mensagem separada com o prefixo `Reasoning:`; `stream` = somente rascunho no Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` ignora aprovações do exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (envie `/exec` para ver o valor atual)
- `/model <name>` (alias: `/models`; ou `/<alias>` de `agents.defaults.models.*.alias`)
- `/queue <mode>` (mais opções como `debounce:2s cap:25 drop:summarize`; envie `/queue` para ver as configurações atuais)
- `/bash <command>` (somente-host; alias de `! <command>`; exige `commands.bash: true` + allowlists `tools.elevated`)
- `/dreaming [on|off|status|help]` (ativa/desativa dreaming global ou mostra status; consulte [Dreaming](/concepts/dreaming))

Somente texto:

- `/compact [instructions]` (consulte [/concepts/compaction](/pt-BR/concepts/compaction))
- `! <command>` (somente-host; um por vez; use `!poll` + `!stop` para jobs de longa duração)
- `!poll` (verifica saída / status; aceita `sessionId` opcional; `/bash poll` também funciona)
- `!stop` (interrompe o job bash em execução; aceita `sessionId` opcional; `/bash stop` também funciona)

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provider (correspondência aproximada); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para o detalhamento completo de uso por provider, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com múltiplas contas, `/allowlist --account <id>` voltado para configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local a partir dos logs de sessão do OpenClaw.
- `/restart` vem habilitado por padrão; defina `commands.restart: false` para desativá-lo.
- Comando nativo exclusivo do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não disponível como texto).
- Comandos de binding de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que bindings efetivos de thread estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência do comando ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` serve para depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/fast on|off` persiste uma sobrescrita de sessão. Use a opção `inherit` na UI de Sessões para limpá-la e voltar ao padrão da configuração.
- `/fast` é específico de provider: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos Responses, enquanto requisições Anthropic públicas diretas, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevante, mas texto detalhado de falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning` (e `/verbose`) são arriscados em grupos: podem revelar raciocínio interno ou saída de ferramenta que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats em grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se já houver uma execução ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto de nova tentativa limpo.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
- **Caminho rápido:** mensagens somente de comando de remetentes em allowlist são tratadas imediatamente (ignorando fila + modelo).
- **Bloqueio por menção em grupos:** mensagens somente de comando de remetentes em allowlist ignoram exigências de menção.
- **Atalhos inline (somente remetentes em allowlist):** determinados comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes que o modelo veja o restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de skill:** Skills `user-invocable` são expostas como comandos slash. Os nomes são saneados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comandos nativos impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - As Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente a uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus com botões quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu com botões quando um comando suporta escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O padrão de `/tools` é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que suportam argumentos expõem a mesma mudança de modo como `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do core, ferramentas
  de plugin conectadas e ferramentas pertencentes ao canal.

Para editar perfis e sobrescritas, use o painel Tools da Control UI ou superfícies de configuração/catálogo em vez de
tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provider** (exemplo: “Claude 80% left”) aparece em `/status` para o provider do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provider para `% left`; para MiniMax, campos de porcentagem apenas de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano marcado por modelo.
- **Linhas de tokens/cache** em `/status` podem usar como fallback a entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo for escasso. Valores vivos existentes e não zero ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior voltado ao prompt quando os totais armazenados estiverem ausentes ou forem menores.
- **Tokens/custo por resposta** são controlados por `/usage off|tokens|full` (acrescentados às respostas normais).
- `/model status` trata de **modelos/auth/endpoints**, não de uso.

## Seleção de modelo (`/model`)

`/model` é implementado como uma diretiva.

Exemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Observações:

- `/model` e `/model list` mostram um seletor compacto numerado (família de modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provider e modelo mais uma etapa Submit.
- `/model <#>` seleciona a partir desse seletor (e prefere o provider atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo endpoint configurado do provider (`baseUrl`) e modo de API (`api`) quando disponíveis.

## Sobrescritas de depuração

`/debug` permite definir sobrescritas de configuração **somente em runtime** (em memória, não em disco). Somente proprietário. Desativado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As sobrescritas se aplicam imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as sobrescritas e voltar à configuração em disco.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente proprietário. Desativado por padrão; habilite com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Observações:

- A configuração é validada antes da gravação; mudanças inválidas são rejeitadas.
- Atualizações feitas por `/config` persistem após restart.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desativado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não nas settings do projeto pertencentes ao Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de plugin

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a habilitação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desativado por padrão; habilite com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de plugins com base no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após mudanças de habilitação/desabilitação, reinicie o gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (tem como alvo a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** tem como alvo a sessão de chat ativa para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda tem suporte para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um slash command do Slack por comando integrado (mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O texto `/status` ainda funciona em mensagens do Slack.

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ela usa a sessão atual como contexto de fundo,
- é executada como uma chamada separada **sem ferramentas** e única,
- não altera o contexto futuro da sessão,
- não é gravada no histórico da transcrição,
- é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [Perguntas laterais BTW](/pt-BR/tools/btw) para ver o comportamento completo e
os detalhes de UX do cliente.
