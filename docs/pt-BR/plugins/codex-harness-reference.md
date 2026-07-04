---
read_when:
    - Você precisa de todos os campos de configuração do harness Codex
    - Você está alterando o transporte, a autenticação, a descoberta ou o comportamento de timeout do app-server
    - Você está depurando a inicialização do harness Codex, a descoberta de modelos ou o isolamento de ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de aplicativo para o harness Codex
title: Referência do ambiente de testes do Codex
x-i18n:
    generated_at: "2026-07-04T10:32:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência cobre a configuração detalhada do Plugin `codex`
incluído. Para decisões de configuração e roteamento, comece com
[harness do Codex](/pt-BR/plugins/codex-harness).

## Superfície de configuração do Plugin

Todas as configurações do harness Codex ficam em `plugins.entries.codex.config`.

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

| Campo                      | Padrão                  | Significado                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Configurações de descoberta de modelos para `model/list` do app-server do Codex.                                                                               |
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e tempo limite.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.                                                               |
| `codexPlugins`             | desabilitado                 | Suporte nativo a plugin/app do Codex para plugins curados migrados instalados a partir do código-fonte. Consulte [plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado                 | Configuração do Codex Computer Use. Consulte [Codex Computer Use](/pt-BR/plugins/codex-computer-use).                                                          |

## Transporte do app-server

Por padrão, o OpenClaw inicia o binário gerenciado do Codex enviado com o Plugin
incluído:

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao Plugin `codex` incluído, em vez de
qualquer CLI separada do Codex que esteja instalada localmente. Defina
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

| Campo                                         | Padrão                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado do Codex por agente OpenClaw. `"user"` compartilha o `$CODEX_HOME` nativo ou `~/.codex`, usa autenticação nativa e habilita o gerenciamento de threads somente pelo proprietário. O escopo de usuário exige stdio.                                                                                                                                                                                               |
| `command`                                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | não definido                                                  | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | não definido                                                  | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | não definido                                                  | Raiz remota do workspace do app-server Codex. Quando definida, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia ao Codex somente o cwd final do app-server. Se o cwd estiver fora da raiz resolvida do workspace OpenClaw, o OpenClaw falha em modo fechado em vez de enviar um caminho local do gateway para o app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela sem atividade depois que o Codex aceita um turno ou depois de uma solicitação app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de conclusão ociosa e progresso usada após uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão de raciocínio bruto ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese pós-ferramenta pode legitimamente ficar silenciosa por mais tempo que o orçamento final de liberação do assistente.                                |
| `mode`                                        | `"yolo"` a menos que requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada para início de thread, retomada e turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox de guardião permitido  | Modo de sandbox nativo do Codex enviado para início e retomada de thread. Sandboxes OpenClaw ativos restringem turnos `danger-full-access` ao `workspace-write` do Codex; a flag de rede do turno segue a saída do sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | diretório do processo atual                              | Workspace usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | não definido                                                  | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, e `null` limpa a substituição. O legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                               | Adere à rede de perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Adesão opcional de prévia que registra um ambiente Codex respaldado por sandbox do OpenClaw com o app-server Codex 0.132.0 ou mais recente, para que a execução nativa do Codex possa rodar dentro do sandbox OpenClaw ativo.                                                                                                                                                                                                         |

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

Se o runtime normal do servidor de aplicativo fosse `danger-full-access`, habilitar
`networkProxy` usa acesso ao sistema de arquivos no estilo workspace para o perfil
de permissões gerado. A aplicação de rede gerenciada pelo Codex é rede em sandbox,
portanto um perfil de acesso total não protegeria o tráfego de saída.

O plugin bloqueia handshakes de servidor de aplicativo mais antigos ou sem versão. O servidor de aplicativo do Codex
deve informar a versão estável `0.125.0` ou mais recente.

OpenClaw trata URLs de servidor de aplicativo WebSocket que não sejam loopback como remotas e exige
autenticação WebSocket com identidade por meio de `appServer.authToken` ou de um
cabeçalho `Authorization`. `appServer.authToken` e cada valor `appServer.headers.*`
podem ser um SecretInput; o runtime de segredos resolve SecretRefs e abreviações de env
antes de o OpenClaw criar as opções de inicialização do servidor de aplicativo, e SecretRefs
estruturados não resolvidos falham antes que qualquer token ou cabeçalho seja enviado. Quando plugins nativos do Codex
estão configurados, o OpenClaw usa o plano de controle de plugins do servidor de aplicativo conectado
para instalar ou atualizar esses plugins e então atualiza o inventário de aplicativos para que
aplicativos pertencentes a plugins fiquem visíveis para a thread do Codex. `app/list` continua sendo a
fonte autoritativa de inventário e metadados, mas a política do OpenClaw decide se
`thread/start` envia `config.apps[appId].enabled = true` para um aplicativo acessível listado,
mesmo que o Codex atualmente o marque como desabilitado. IDs de aplicativos desconhecidos ou ausentes continuam
falhando em modo fechado; esse caminho só ativa plugins de marketplace via `plugin/install`
e atualiza o inventário. Conecte o OpenClaw apenas a servidores de aplicativo remotos que sejam
confiáveis para aceitar instalações de plugins gerenciadas pelo OpenClaw e atualizações de inventário de aplicativos.

## Modos de aprovação e sandbox

Sessões locais de servidor de aplicativo via stdio usam o modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura de operador local confiável permite que
turnos e heartbeats não assistidos do OpenClaw avancem sem prompts de aprovação nativos
que ninguém esteja por perto para responder.

Se o arquivo local de requisitos do sistema do Codex proibir valores implícitos de aprovação YOLO,
revisor ou sandbox, o OpenClaw trata o padrão implícito como guardian
e seleciona permissões guardian permitidas. `tools.exec.mode: "auto"`
também força aprovações do Codex revisadas por guardian e não preserva substituições legadas inseguras
de `approvalPolicy: "never"` ou `sandbox: "danger-full-access"`;
defina `tools.exec.mode: "full"` para uma postura intencional sem aprovação.
Entradas
`[[remote_sandbox_config]]` correspondentes ao hostname no mesmo arquivo de requisitos são respeitadas
para a decisão padrão de sandbox.

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
valores são permitidos. Campos de política individuais substituem `mode`. O valor de revisor
mais antigo `guardian_subagent` ainda é aceito como alias de compatibilidade,
mas novas configurações devem usar `auto_review`.

Quando um sandbox do OpenClaw está ativo, o processo local do servidor de aplicativo Codex ainda
é executado no host do Gateway. Portanto, o OpenClaw desabilita o Code Mode nativo do Codex,
servidores MCP do usuário e execução de plugins apoiados por aplicativos para esse turno, em vez de
tratar o sandboxing no lado do host do Codex como equivalente ao backend de sandbox
do OpenClaw. O acesso ao shell é exposto por meio de ferramentas dinâmicas apoiadas pelo sandbox do OpenClaw,
como `sandbox_exec` e `sandbox_process`, quando as ferramentas normais de exec/process
estão disponíveis.

Em hosts Ubuntu/AppArmor, o bwrap do Codex pode falhar em `workspace-write` antes
de o comando de shell iniciar quando você executa intencionalmente `workspace-write`
nativo do Codex sem sandboxing ativo do OpenClaw. Se você vir
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, execute
`openclaw doctor` e corrija a política de namespace do host relatada para o usuário
do serviço OpenClaw, em vez de conceder privilégios mais amplos ao contêiner Docker. Prefira
um perfil AppArmor com escopo para o processo de serviço; o fallback
`kernel.apparmor_restrict_unprivileged_userns=0` é amplo para todo o host e tem
tradeoffs de segurança.

## Execução nativa em sandbox

O padrão estável é falhar em modo fechado: sandboxing ativo do OpenClaw desabilita superfícies de execução nativa
do Codex que, de outra forma, seriam executadas a partir do host do servidor de aplicativo Codex. Use `appServer.experimental.sandboxExecServer: true` apenas quando quiser
experimentar o suporte a ambiente remoto do Codex com o backend de sandbox do OpenClaw. Esse
caminho de prévia exige servidor de aplicativo Codex 0.132.0 ou mais recente.

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
inicia um servidor de execução local loopback apoiado pelo sandbox ativo, registra-o
no servidor de aplicativo Codex e inicia a thread e o turno do Codex com esse
ambiente pertencente ao OpenClaw. Se o servidor de aplicativo não conseguir registrar o ambiente,
a execução falha em modo fechado em vez de voltar silenciosamente para a execução no host.

Esse caminho de prévia é apenas local. Um servidor de aplicativo WebSocket remoto não consegue acessar o
servidor de execução loopback, a menos que esteja em execução no mesmo host, então o OpenClaw rejeita
essa combinação.

## Autenticação e isolamento de ambiente

No home por agente padrão, a autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do servidor de aplicativo no home Codex desse agente.
3. Apenas para inicializações locais de servidor de aplicativo via stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de aplicativo está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do servidor de aplicativo Codex serem cobrados pela API por acidente.

Perfis explícitos de chave de API do Codex e fallback local de chave env via stdio usam login do servidor de aplicativo
em vez de env herdado do processo filho. Conexões de servidor de aplicativo WebSocket
não recebem fallback de chave de API env do Gateway; use um perfil de autenticação explícito ou a
própria conta do servidor de aplicativo remoto.

Inicializações de servidor de aplicativo via stdio herdam o ambiente de processo do OpenClaw por padrão.
O OpenClaw possui a ponte de conta do servidor de aplicativo Codex e define `CODEX_HOME` como um
diretório por agente dentro do estado OpenClaw desse agente. Isso mantém a configuração,
as contas, o cache/dados de plugins e o estado de threads do Codex com escopo no agente OpenClaw,
em vez de vazar do home pessoal `~/.codex` do operador.

Defina `appServer.homeScope: "user"` para compartilhar o estado nativo do Codex com o Codex
Desktop e a CLI. Esse modo somente local-stdio usa `$CODEX_HOME` quando definido e
`~/.codex` caso contrário, incluindo autenticação, configuração, plugins e threads nativos.
O OpenClaw ignora sua ponte de perfil de autenticação para o servidor de aplicativo. Turnos de proprietário
verificados podem usar `codex_threads` para listar, pesquisar, ler, bifurcar, renomear, arquivar e restaurar
essas threads. Bifurque uma thread antes de continuá-la no OpenClaw; processos
independentes do Codex não coordenam escritores concorrentes para a mesma thread.

O OpenClaw não reescreve `HOME` para inicializações locais normais de servidor de aplicativo. Subprocessos executados pelo Codex,
como `openclaw`, `gh`, `git`, CLIs de nuvem e comandos de shell, veem
o home normal do processo e conseguem encontrar configurações e tokens do home do usuário. O Codex também pode
descobrir `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`;
essa descoberta de `.agents` é intencionalmente compartilhada com o home do operador e é
separada do estado isolado de `~/.codex`.

No escopo de agente padrão, plugins do OpenClaw e snapshots de Skills do OpenClaw ainda
fluem pelo próprio registro de plugins e carregador de Skills do OpenClaw; ativos pessoais do Codex
em `~/.codex` não. Se você tiver Skills ou plugins úteis da CLI do Codex de um
home Codex que devam se tornar parte de um agente OpenClaw isolado, faça o inventário
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

`appServer.clearEnv` afeta apenas o processo filho do servidor de aplicativo Codex gerado.
O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização da inicialização local:
`CODEX_HOME` continua apontando para o escopo selecionado de agente ou usuário,
e `HOME` continua herdado para que subprocessos possam usar o estado normal do home do usuário.

## Ferramentas dinâmicas

Ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações de workspace nativas do Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

A maioria das ferramentas restantes de integração do OpenClaw, como mensagens, mídia, cron,
navegador, nós, Gateway, `heartbeat_respond` e `web_search`, está disponível
por meio da pesquisa de ferramentas do Codex no namespace `openclaw`. Isso mantém o contexto inicial
do modelo menor. `sessions_yield` e respostas de origem apenas de ferramentas de mensagem
continuam diretas porque são contratos de controle de turno. `sessions_spawn` continua
pesquisável para que o `spawn_agent` nativo do Codex permaneça a principal superfície de subagente
do Codex, enquanto delegação explícita do OpenClaw ou ACP continua disponível por meio
do namespace de ferramentas dinâmicas `openclaw`.

Defina `codexDynamicToolsLoading: "direct"` apenas ao conectar a um servidor de aplicativo Codex
customizado que não consegue pesquisar ferramentas dinâmicas adiadas ou ao depurar o payload completo
de ferramentas.

## Timeouts

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`. Cada solicitação Codex `item/tool/call` usa o primeiro
timeout disponível nesta ordem:

- Um argumento positivo `timeoutMs` por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem timeout configurado, o padrão de 120 segundos
  para geração de imagens.
- Para a ferramenta de entendimento de mídia `image`, `tools.media.image.timeoutSeconds`
  convertido em milissegundos, ou o padrão de mídia de 60 segundos. Para entendimento
  de imagem, isso se aplica à própria solicitação e não é reduzido por
  trabalho de preparação anterior.
- O padrão de 90 segundos para ferramentas dinâmicas.

Esse watchdog é o orçamento externo dinâmico de `item/tool/call`. Timeouts de solicitação
específicos do provedor são executados dentro dessa chamada e mantêm sua própria semântica de timeout.
Orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Em caso de timeout, o OpenClaw aborta o
sinal da ferramenta quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex
para que o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma solicitação
do servidor de aplicativo com escopo de turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o servidor de aplicativo ficar
silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw tenta, em melhor esforço,
interromper o turno do Codex, registra um timeout de diagnóstico e libera a
lane de sessão do OpenClaw para que mensagens de chat de acompanhamento não fiquem enfileiradas atrás de um turno
nativo obsoleto.

A maioria das notificações não terminais para o mesmo turno desarma esse watchdog curto
porque o Codex provou que o turno ainda está ativo. Handoffs de ferramentas usam um orçamento
pós-ferramenta mais longo para ociosidade: depois que o OpenClaw retorna uma resposta `item/tool/call`, depois que
itens de ferramenta nativa como `commandExecution` são concluídos, depois de conclusões brutas
`custom_tool_call_output` e depois de progresso bruto do assistente pós-ferramenta,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e,
caso contrário, usa cinco minutos por padrão. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela silenciosa de síntese antes que o Codex emita o próximo
evento do turno atual. Conclusões de raciocínio, conclusões de
`agentMessage` de comentário e progresso bruto de raciocínio ou assistente pré-ferramenta podem
ser seguidos por uma resposta final automática, então usam a proteção de resposta pós-progresso
em vez de liberar imediatamente a faixa da sessão. Somente itens
`agentMessage` concluídos finais/não comentário e conclusões brutas de assistente pré-ferramenta
armam a liberação de saída do assistente: se o Codex ficar silencioso sem
`turn/completed`, o OpenClaw interrompe a turno nativo em melhor esforço e libera
a faixa da sessão. Falhas do app-server stdio seguras para replay, incluindo
timeouts de ociosidade de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são tentadas novamente uma vez em uma nova tentativa do app-server. Timeouts
inseguros ainda aposentam o cliente do app-server travado e liberam a faixa da sessão
do OpenClaw. Eles também limpam a associação obsoleta da thread nativa em vez de serem
reproduzidos automaticamente. Timeouts de observação de conclusão exibem texto de timeout
específico do Codex: casos seguros para replay dizem que a resposta pode estar incompleta,
enquanto casos inseguros orientam o usuário a verificar o estado atual antes de tentar novamente.
Diagnósticos públicos de timeout incluem campos estruturais, como o último método de notificação
do app-server, id/tipo/função do item de resposta bruta do assistente, contagens de solicitações/itens
ativos e estado armado de observação. Quando a última notificação é um item de resposta bruta do assistente, eles
também incluem uma prévia limitada do texto do assistente. Eles não incluem prompt bruto nem
conteúdo de ferramenta.

## Descoberta de modelos

Por padrão, o Plugin do Codex pede ao app-server os modelos disponíveis. A
disponibilidade de modelos pertence ao app-server do Codex, então a lista pode mudar quando o OpenClaw
atualiza a versão empacotada de `@openai/codex` ou quando uma implantação aponta
`appServer.command` para um binário diferente do Codex. A disponibilidade também pode ser
delimitada por conta. Use `/codex models` em um Gateway em execução para ver o catálogo ao vivo
desse harness e dessa conta.

Se a descoberta falhar ou atingir timeout, o OpenClaw usa um catálogo de fallback empacotado para:

- GPT-5.5
- GPT-5.4 mini

O harness empacotado atual é `@openai/codex` `0.142.4`. Uma sondagem `model/list`
contra esse app-server empacotado em um workspace com GPT-5.6 habilitado retornou estas
linhas públicas do seletor:

| ID do modelo          | Modalidades de entrada | Esforços de raciocínio                |
| --------------------- | ---------------------- | ------------------------------------ |
| `gpt-5.6-sol`         | texto, imagem          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | texto, imagem          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | texto, imagem          | low, medium, high, xhigh, max        |
| `gpt-5.5`             | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.4`             | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | texto, imagem          | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | texto                  | low, medium, high, xhigh             |

O acesso ao GPT-5.6 é delimitado por conta durante a prévia limitada. `max` é um
esforço de raciocínio do modelo. `ultra` é metadado separado de orquestração multiagente do Codex,
não um esforço de raciocínio padrão da OpenAI.

Modelos ocultos podem ser retornados pelo catálogo do app-server para fluxos internos ou
especializados, mas eles não são opções normais do seletor de modelos.

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
não grava arquivos sintéticos de documentação de projeto do Codex nem depende de nomes de arquivo de fallback
do Codex para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade de workspace do OpenClaw, o harness do Codex resolve os outros arquivos de bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` são encaminhados como
instruções de desenvolvedor do OpenClaw Codex porque definem o agente ativo,
orientações disponíveis do workspace e o perfil do usuário. A lista compacta de Skills do OpenClaw
é encaminhada como instruções de desenvolvedor de colaboração com escopo de turno.
O conteúdo de `HEARTBEAT.md` não é injetado; turnos de heartbeat recebem um ponteiro de modo de colaboração
para ler o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md`
do workspace de agente configurado não é colado na entrada nativa de turno do Codex
quando ferramentas de memória estão disponíveis para esse workspace; quando ele existe, o harness
adiciona um pequeno ponteiro de memória do workspace às instruções de desenvolvedor de colaboração
com escopo de turno, e o Codex deve usar `memory_search` ou `memory_get` quando memória durável
for relevante. Se as ferramentas estiverem desativadas, a pesquisa de memória estiver indisponível ou o
workspace ativo diferir do workspace de memória do agente, `MEMORY.md` usa o
caminho normal de contexto de turno limitado.
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Configuração é
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
