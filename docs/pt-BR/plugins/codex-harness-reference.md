---
read_when:
    - Você precisa de todos os campos de configuração do harness Codex
    - Você está alterando o transporte, a autenticação, a descoberta ou o comportamento de tempo limite do app-server
    - Você está depurando a inicialização do harness do Codex, a descoberta de modelos ou o isolamento do ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de app para o harness do Codex
title: Referência do harness do Codex
x-i18n:
    generated_at: "2026-07-04T20:28:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência aborda a configuração detalhada do plugin `codex`
incluído. Para decisões de configuração e roteamento, comece com
[harness do Codex](/pt-BR/plugins/codex-harness).

## Superfície de configuração do Plugin

Todas as configurações do harness do Codex ficam em `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Campos de nível superior compatíveis:

| Campo                      | Padrão                   | Significado                                                                                                                               |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Configurações de descoberta de modelos para `model/list` do app-server do Codex.                                                          |
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e tempo limite.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                  |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir das rodadas do app-server do Codex.                                        |
| `codexPlugins`             | desabilitado             | Suporte nativo a plugins/apps do Codex para plugins selecionados migrados instalados a partir do código-fonte. Consulte [plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado             | Configuração do Computer Use do Codex. Consulte [Codex Computer Use](/pt-BR/plugins/codex-computer-use).                                        |

## Transporte do app-server

Por padrão, o OpenClaw inicia o binário gerenciado do Codex enviado com o
plugin `codex` incluído:

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao plugin `codex` incluído, em vez de
qualquer CLI separada do Codex que por acaso esteja instalada localmente. Defina
`appServer.command` somente quando você quiser intencionalmente executar um
executável diferente.

Para um app-server já em execução, use o transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` compatíveis:

| Campo                                         | Padrão                                                 | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado do Codex por agente OpenClaw. `"user"` compartilha o `$CODEX_HOME` nativo ou `~/.codex`, usa autenticação nativa e habilita o gerenciamento de threads somente pelo proprietário. O escopo de usuário requer stdio.                                                                                                                                                   |
| `command`                                     | binário Codex gerenciado                               | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                              |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | indefinido                                             | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                    |
| `authToken`                                   | indefinido                                             | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                             |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo stdio app-server iniciado depois que o OpenClaw constrói seu ambiente herdado.                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | indefinido                                             | Raiz remota do workspace do app-server Codex. Quando definida, o OpenClaw infere a raiz do workspace local a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia apenas o cwd final do app-server ao Codex. Se o cwd estiver fora da raiz resolvida do workspace OpenClaw, o OpenClaw falha fechado em vez de enviar um caminho local do gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela de inatividade depois que o Codex aceita um turno ou depois de uma solicitação app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de inatividade de conclusão e progresso usada depois de uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão bruta de raciocínio ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese pós-ferramenta pode legitimamente ficar silenciosa por mais tempo que o orçamento final de liberação do assistente. |
| `mode`                                        | `"yolo"` salvo se requisitos locais do Codex não permitirem YOLO | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                                                                                                                                                                       |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação de guardião permitida | Política de aprovação nativa do Codex enviada ao iniciar thread, retomar e turno.                                                                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox de guardião permitido | Modo sandbox nativo do Codex enviado ao iniciar e retomar thread. Sandboxes ativos do OpenClaw restringem turnos `danger-full-access` para `workspace-write` do Codex; a flag de rede do turno segue a saída do sandbox OpenClaw.                                                                                                                                                                |
| `approvalsReviewer`                           | `"user"` ou um revisor guardião permitido              | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido.                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | diretório do processo atual                            | Workspace usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                                     |
| `serviceTier`                                 | indefinido                                             | Camada de serviço opcional do app-server Codex. `"priority"` habilita o roteamento em modo rápido, `"flex"` solicita processamento flex e `null` limpa a substituição. O legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                            |
| `networkProxy`                                | desabilitado                                           | Opte por usar a rede de perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in de prévia que registra um ambiente Codex com suporte de sandbox do OpenClaw no app-server Codex 0.132.0 ou mais recente, para que a execução nativa do Codex possa ser executada dentro do sandbox OpenClaw ativo.                                                                                                                                                                       |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o OpenClaw gera um
nome de perfil `openclaw-network-<fingerprint>` resistente a colisões a partir do
corpo do perfil; use `profileName` somente quando um nome local estável for necessário.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Se o runtime normal do app-server seria `danger-full-access`, habilitar
`networkProxy` usa acesso ao sistema de arquivos em estilo workspace para o
perfil de permissões gerado. A imposição de rede gerenciada pelo Codex é rede em sandbox,
portanto um perfil de acesso total não protegeria o tráfego de saída.

O plugin bloqueia handshakes de app-server mais antigos ou sem versão. O app-server do Codex
deve informar a versão estável `0.125.0` ou mais recente.

OpenClaw trata URLs de app-server WebSocket que não sejam loopback como remotas e exige
autenticação WebSocket com identidade por meio de `appServer.authToken` ou de um
cabeçalho `Authorization`. `appServer.authToken` e cada valor `appServer.headers.*`
podem ser um SecretInput; o runtime de segredos resolve SecretRefs e atalhos de env
antes de o OpenClaw criar as opções de inicialização do app-server, e SecretRefs
estruturados não resolvidos falham antes que qualquer token ou cabeçalho seja enviado. Quando plugins nativos do Codex
estão configurados, o OpenClaw usa o plano de controle de plugins do app-server conectado
para instalar ou atualizar esses plugins e então atualiza o inventário de apps para que
apps pertencentes a plugins fiquem visíveis para a thread do Codex. `app/list` ainda é a
fonte autoritativa de inventário e metadados, mas a política do OpenClaw decide se
`thread/start` envia `config.apps[appId].enabled = true` para um app acessível listado
mesmo que o Codex atualmente o marque como desabilitado. IDs de app desconhecidos ou ausentes permanecem
fail-closed; esse caminho apenas ativa plugins do marketplace via `plugin/install`
e atualiza o inventário. Conecte o OpenClaw somente a app-servers remotos que sejam
confiáveis para aceitar instalações de plugins gerenciadas pelo OpenClaw e atualizações de inventário de apps.

## Modos de aprovação e sandbox

Sessões locais de app-server por stdio usam o modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura de operador local confiável permite que
turnos e Heartbeats autônomos do OpenClaw avancem sem prompts de aprovação nativos
que ninguém estaria por perto para responder.

Se o arquivo local de requisitos de sistema do Codex não permitir aprovação YOLO implícita,
valores de revisor ou de sandbox, o OpenClaw trata o padrão implícito como guardian
em vez disso e seleciona permissões guardian permitidas. `tools.exec.mode: "auto"`
também força aprovações do Codex revisadas por guardian e não preserva substituições legadas inseguras
de `approvalPolicy: "never"` ou `sandbox: "danger-full-access"`;
defina `tools.exec.mode: "full"` para uma postura intencional sem aprovação.
Entradas
`[[remote_sandbox_config]]` com correspondência de hostname no mesmo arquivo de requisitos são respeitadas
para a decisão do padrão de sandbox.

Defina `appServer.mode: "guardian"` para aprovações do Codex revisadas por guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

O preset `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando esses
valores são permitidos. Campos de política individuais substituem `mode`. O valor de revisor mais antigo
`guardian_subagent` ainda é aceito como um alias de compatibilidade,
mas novas configurações devem usar `auto_review`.

Quando uma sandbox do OpenClaw está ativa, o processo local do app-server do Codex ainda
roda no host do Gateway. Portanto, o OpenClaw desabilita o Code Mode nativo do Codex,
servidores MCP do usuário e execução de plugins apoiada por app para esse turno, em vez de
tratar o sandboxing do lado do host do Codex como equivalente ao backend de sandbox do OpenClaw.
O acesso ao shell é exposto por meio de ferramentas dinâmicas apoiadas pela sandbox do OpenClaw,
como `sandbox_exec` e `sandbox_process`, quando as ferramentas normais de exec/process
estão disponíveis.

Em hosts Ubuntu/AppArmor, o bwrap do Codex pode falhar em `workspace-write` antes
de o comando shell iniciar quando você executa intencionalmente `workspace-write`
nativo do Codex sem sandboxing ativo do OpenClaw. Se você vir
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, execute
`openclaw doctor` e corrija a política de namespace do host relatada para o usuário de serviço do OpenClaw,
em vez de conceder privilégios mais amplos ao contêiner Docker. Prefira
um perfil AppArmor com escopo para o processo de serviço; o fallback
`kernel.apparmor_restrict_unprivileged_userns=0` é amplo para o host e tem
tradeoffs de segurança.

## Execução nativa em sandbox

O padrão estável é fail-closed: sandboxing ativo do OpenClaw desabilita superfícies de execução nativas do Codex
que de outra forma rodariam a partir do host do app-server do Codex. Use `appServer.experimental.sandboxExecServer: true` somente quando você quiser
experimentar o suporte a ambiente remoto do Codex com o backend de sandbox do OpenClaw. Esse
caminho de prévia exige app-server do Codex 0.132.0 ou mais recente.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Quando a flag está ativada e a sessão atual do OpenClaw está em sandbox, o OpenClaw
inicia um exec-server local loopback apoiado pela sandbox ativa, registra-o
no app-server do Codex e inicia a thread e o turno do Codex com esse
ambiente pertencente ao OpenClaw. Se o app-server não conseguir registrar o ambiente,
a execução falha fechada em vez de voltar silenciosamente para execução no host.

Esse caminho de prévia é apenas local. Um app-server WebSocket remoto não consegue alcançar o
exec-server de loopback, a menos que esteja rodando no mesmo host, portanto o OpenClaw rejeita
essa combinação.

## Autenticação e isolamento de ambiente

No home padrão por agente, a autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server no home Codex desse agente.
3. Apenas para inicializações locais de app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de app-server está presente e autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex iniciado. Isso
mantém chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do app-server do Codex serem cobrados pela API por acidente.

Perfis explícitos de chave de API do Codex e fallback local de chave por env em stdio usam login do app-server
em vez de env herdado do processo filho. Conexões WebSocket de app-server
não recebem fallback de chave de API por env do Gateway; use um perfil de autenticação explícito ou a
própria conta do app-server remoto.

Inicializações de app-server por stdio herdam o ambiente de processo do OpenClaw por padrão.
OpenClaw é dono da ponte de contas do app-server do Codex e define `CODEX_HOME` para um
diretório por agente dentro do estado do OpenClaw desse agente. Isso mantém configuração,
contas, cache/dados de plugins e estado de threads do Codex com escopo no agente do OpenClaw,
em vez de vazar do home pessoal `~/.codex` do operador.

Defina `appServer.homeScope: "user"` para compartilhar estado nativo do Codex com o Codex
Desktop e a CLI. Esse modo apenas local-stdio usa `$CODEX_HOME` quando definido e
`~/.codex` caso contrário, incluindo autenticação nativa, configuração, plugins e threads.
O OpenClaw ignora sua ponte de perfis de autenticação para o app-server. Turnos de proprietário verificado
podem usar `codex_threads` para listar, buscar, ler, bifurcar, renomear, arquivar e restaurar
essas threads. Bifurque uma thread antes de continuá-la no OpenClaw; processos independentes
do Codex não coordenam escritores concorrentes para a mesma thread.

O OpenClaw não reescreve `HOME` para inicializações locais normais de app-server. Subprocessos executados pelo Codex,
como `openclaw`, `gh`, `git`, CLIs de nuvem e comandos shell, veem
o home de processo normal e podem encontrar configuração e tokens do home do usuário. O Codex também pode
descobrir `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`;
essa descoberta de `.agents` é intencionalmente compartilhada com o home do operador e é
separada do estado isolado `~/.codex`.

No escopo padrão de agente, plugins do OpenClaw e snapshots de Skills do OpenClaw ainda
fluem pelo próprio registro de plugins e carregador de Skills do OpenClaw; assets pessoais do Codex
`~/.codex` não. Se você tiver Skills ou plugins úteis da CLI do Codex de um
home Codex que devam se tornar parte de um agente isolado do OpenClaw, inventarie-os
explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas variáveis a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` afeta apenas o processo filho do app-server do Codex iniciado.
O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização de inicialização local:
`CODEX_HOME` permanece apontado para o escopo de agente ou usuário selecionado,
e `HOME` permanece herdado para que subprocessos possam usar estado normal do home do usuário.

## Ferramentas dinâmicas

Ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações nativas do Codex no workspace:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

A maioria das ferramentas restantes de integração do OpenClaw, como mensagens, mídia, cron,
navegador, nós, gateway, `heartbeat_respond` e `web_search`, está disponível
pela busca de ferramentas do Codex sob o namespace `openclaw`. Isso mantém o contexto inicial
do modelo menor. `sessions_yield` e respostas de origem apenas de ferramentas de mensagem
permanecem diretas porque esses são contratos de controle de turno. `sessions_spawn` permanece
pesquisável para que o `spawn_agent` nativo do Codex continue sendo a principal superfície de subagente do Codex,
enquanto delegação explícita do OpenClaw ou ACP ainda fica disponível pelo
namespace de ferramentas dinâmicas `openclaw`.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um app-server Codex customizado
que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo
de ferramentas.

## Timeouts

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`. Cada solicitação Codex `item/tool/call` usa o primeiro
timeout disponível nesta ordem:

- Um argumento `timeoutMs` positivo por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem um timeout configurado, o padrão de 120 segundos
  de geração de imagem.
- Para a ferramenta `image` de entendimento de mídia, `tools.media.image.timeoutSeconds`
  convertido para milissegundos, ou o padrão de mídia de 60 segundos. Para entendimento
  de imagem, isso se aplica à própria solicitação e não é reduzido por
  trabalho de preparação anterior.
- O padrão de 90 segundos de ferramenta dinâmica.

Esse watchdog é o orçamento externo dinâmico de `item/tool/call`. Timeouts de solicitação
específicos de provedor rodam dentro dessa chamada e mantêm sua própria semântica de timeout.
Orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Em timeout, o OpenClaw aborta o
sinal da ferramenta quando suportado e retorna uma resposta de ferramenta dinâmica com falha ao Codex
para que o turno possa continuar, em vez de deixar a sessão em `processing`.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma solicitação de app-server
com escopo no turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o app-server ficar
silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw faz uma tentativa de melhor esforço para
interromper o turno do Codex, registra um timeout diagnóstico e libera a lane de sessão
do OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um turno
nativo obsoleto.

A maioria das notificações não terminais para o mesmo turno desarma esse watchdog curto
porque o Codex comprovou que o turno ainda está ativo. As transferências de ferramentas usam um orçamento
de ociosidade pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta `item/tool/call`, depois que
itens de ferramentas nativas como `commandExecution` são concluídos, depois de conclusões brutas de
`custom_tool_call_output` e depois de progresso bruto pós-ferramenta do assistente,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e,
caso contrário, usa cinco minutos por padrão. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela silenciosa de síntese antes que o Codex emita o próximo
evento do turno atual. Conclusões de raciocínio, conclusões de
`agentMessage` de comentário e progresso bruto de raciocínio ou do assistente antes da ferramenta podem
ser seguidos por uma resposta final automática, então eles usam a proteção de resposta pós-progresso
em vez de liberar a faixa da sessão imediatamente. Somente itens `agentMessage`
finais/não comentados concluídos e conclusões brutas do assistente antes da ferramenta
armam a liberação de saída do assistente: se o Codex então ficar silencioso sem
`turn/completed`, o OpenClaw tenta interromper o turno nativo da melhor forma possível e libera
a faixa da sessão. Falhas do servidor de aplicativo stdio seguras para replay, incluindo
tempos limite de ociosidade de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são tentadas uma vez novamente em uma nova tentativa do servidor de aplicativo. Tempos limite
inseguros ainda aposentam o cliente do servidor de aplicativo travado e liberam a faixa de sessão do
OpenClaw. Eles também limpam o vínculo obsoleto do thread nativo em vez de serem
reproduzidos automaticamente. Tempos limite de observação de conclusão exibem texto de tempo limite
específico do Codex: casos seguros para replay dizem que a resposta pode estar incompleta,
enquanto casos inseguros dizem ao usuário para verificar o estado atual antes de tentar novamente.
Diagnósticos públicos de tempo limite incluem campos estruturais como o último método de notificação
do servidor de aplicativo, id/tipo/função do item bruto de resposta do assistente, contagens de
requisições/itens ativos e estado armado de observação. Quando a última notificação é um item bruto de
resposta do assistente, eles também incluem uma prévia delimitada do texto do assistente. Eles não
incluem prompt bruto nem conteúdo de ferramenta.

## Descoberta de modelos

Por padrão, o Plugin Codex pergunta ao servidor de aplicativo quais modelos estão disponíveis. A
disponibilidade de modelos pertence ao servidor de aplicativo do Codex, então a lista pode mudar quando o OpenClaw
atualiza a versão do `@openai/codex` empacotada ou quando uma implantação aponta
`appServer.command` para um binário Codex diferente. A disponibilidade também pode ser
escopada por conta. Use `/codex models` em um Gateway em execução para ver o catálogo ativo
desse harness e dessa conta.

Se a descoberta falhar ou atingir tempo limite, o OpenClaw usa um catálogo de fallback empacotado para:

- GPT-5.5
- GPT-5.4 mini

O harness empacotado atual é `@openai/codex` `0.142.5`. Uma sondagem `model/list`
contra esse servidor de aplicativo empacotado retornou estas linhas públicas do seletor:

| ID do modelo          | Modalidades de entrada | Esforços de raciocínio   |
| --------------------- | ---------------------- | ------------------------ |
| `gpt-5.5`             | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.4`             | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.4-mini`        | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | texto                  | low, medium, high, xhigh |

Modelos ocultos podem ser retornados pelo catálogo do servidor de aplicativo para fluxos internos ou
especializados, mas não são opções normais do seletor de modelos.

Ajuste a descoberta em `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e use apenas o
catálogo de fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentação de projeto. O OpenClaw
não grava arquivos sintéticos de documentação de projeto do Codex nem depende de nomes de arquivo de fallback do Codex
para arquivos de persona, porque os fallbacks do Codex se aplicam somente quando
`AGENTS.md` está ausente.

Para paridade do workspace do OpenClaw, o harness Codex resolve os outros arquivos de bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` são encaminhados como
instruções de desenvolvedor do OpenClaw Codex porque definem o agente ativo,
orientações disponíveis do workspace e perfil do usuário. A lista compacta de Skills do OpenClaw
é encaminhada como instruções de desenvolvedor de colaboração escopadas ao turno.
O conteúdo de `HEARTBEAT.md` não é injetado; turnos de Heartbeat recebem um ponteiro de modo de colaboração
para ler o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md`
do workspace do agente configurado não é colado na entrada nativa de turno do Codex
quando ferramentas de memória estão disponíveis para esse workspace; quando ele existe, o harness
adiciona um pequeno ponteiro de memória do workspace às instruções de desenvolvedor de colaboração
escopadas ao turno, e o Codex deve usar `memory_search` ou `memory_get` quando memória durável
for relevante. Se as ferramentas estiverem desativadas, a busca de memória estiver indisponível ou o
workspace ativo diferir do workspace de memória do agente, `MEMORY.md` usa o
caminho normal delimitado de contexto de turno.
`BOOTSTRAP.md`, quando presente, é encaminhado como contexto de referência de entrada de turno do OpenClaw.

## Substituições de ambiente

Substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferida para implantações repetíveis porque mantém o comportamento do Plugin no mesmo arquivo
revisado que o restante da configuração do harness Codex.

## Relacionado

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
