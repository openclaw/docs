---
read_when:
    - Você precisa de todos os campos de configuração do harness do Codex
    - Você está alterando o comportamento de transporte, autenticação, descoberta ou tempo limite do app-server
    - Você está depurando a inicialização do harness Codex, a descoberta de modelos ou o isolamento do ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de aplicativos para o harness Codex
title: Referência do harness Codex
x-i18n:
    generated_at: "2026-06-27T17:45:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência cobre a configuração detalhada do Plugin `codex`
incluído. Para decisões de configuração e roteamento, comece com
[Harness do Codex](/pt-BR/plugins/codex-harness).

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
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e timeout.                                                       |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                 |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir de turnos do app-server do Codex.                                         |
| `codexPlugins`             | desabilitado             | Suporte nativo a Plugin/app do Codex para plugins selecionados migrados instalados a partir do código-fonte. Veja [plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado             | Configuração do Computer Use do Codex. Veja [Computer Use do Codex](/pt-BR/plugins/codex-computer-use).                                        |

## Transporte do app-server

Por padrão, o OpenClaw inicia o binário gerenciado do Codex enviado com o Plugin
incluído:

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao Plugin `codex` incluído, em vez de
qualquer CLI separada do Codex que por acaso esteja instalada localmente. Defina
`appServer.command` somente quando você intencionalmente quiser executar um
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
| `command`                                     | binário Codex gerenciado                                   | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | não definido                                                  | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | não definido                                                  | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes extras de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | não definido                                                  | Raiz remota do workspace do app-server Codex. Quando definido, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia ao Codex apenas o cwd final do app-server. Se o cwd estiver fora da raiz resolvida do workspace OpenClaw, o OpenClaw falha em modo fechado em vez de enviar um caminho local do Gateway para o app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela silenciosa depois que o Codex aceita um turno ou depois de uma solicitação do app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de conclusão ociosa e progresso usada após uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão bruta de raciocínio ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas nas quais a síntese pós-ferramenta pode legitimamente ficar silenciosa por mais tempo do que o orçamento final de liberação do assistente.                                |
| `mode`                                        | `"yolo"` a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação guardian permitida       | Política de aprovação nativa do Codex enviada ao início, à retomada e ao turno da thread.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox guardian permitido  | Modo sandbox nativo do Codex enviado ao início e à retomada da thread. Sandboxes OpenClaw ativos restringem turnos `danger-full-access` para `workspace-write` do Codex; a flag de rede do turno segue a saída do sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou um revisor guardian permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | diretório do processo atual                              | Workspace usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | não definido                                                  | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, e `null` limpa a substituição. O valor legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                               | Opte por usar a rede do perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opção de visualização que registra um ambiente Codex com suporte de sandbox do OpenClaw no app-server Codex 0.132.0 ou mais recente, para que a execução nativa do Codex possa rodar dentro do sandbox OpenClaw ativo.                                                                                                                                                                                                         |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o
OpenClaw gera um nome de perfil resistente a colisões
`openclaw-network-<fingerprint>` a partir do corpo do perfil; use `profileName`
somente quando um nome local estável for necessário.

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
`networkProxy` usa acesso ao sistema de arquivos no estilo workspace para o
perfil de permissão gerado. A aplicação de rede gerenciada pelo Codex é rede em
sandbox, então um perfil com acesso total não protegeria o tráfego de saída.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. O app-server
Codex deve relatar a versão estável `0.125.0` ou mais recente.

OpenClaw trata URLs de servidor de app WebSocket que não são de loopback como remotas e exige
autenticação WebSocket com identidade por meio de `appServer.authToken` ou de um
cabeçalho `Authorization`. `appServer.authToken` e cada valor de `appServer.headers.*`
podem ser um SecretInput; o runtime de segredos resolve SecretRefs e abreviações de env
antes que o OpenClaw crie as opções de inicialização do servidor de app, e SecretRefs
estruturadas não resolvidas falham antes que qualquer token ou cabeçalho seja enviado. Quando plugins nativos do Codex
são configurados, o OpenClaw usa o plano de controle de Plugin do servidor de app conectado
para instalar ou atualizar esses plugins e, em seguida, atualiza o inventário de apps para que
apps pertencentes a plugins fiquem visíveis para a thread do Codex. `app/list` continua sendo a
fonte autoritativa de inventário e metadados, mas a política do OpenClaw decide se
`thread/start` envia `config.apps[appId].enabled = true` para um app acessível listado
mesmo que o Codex atualmente o marque como desabilitado. IDs de app desconhecidos ou ausentes permanecem
fail-closed; este caminho ativa apenas plugins do marketplace via `plugin/install`
e atualiza o inventário. Conecte o OpenClaw somente a servidores de app remotos que sejam
confiáveis para aceitar instalações de plugins gerenciadas pelo OpenClaw e atualizações de inventário de apps.

## Modos de aprovação e sandbox

Sessões locais de servidor de app stdio usam o modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura de operador local confiável permite que
turnos e heartbeats do OpenClaw sem supervisão avancem sem prompts de aprovação nativos
que ninguém está disponível para responder.

Se o arquivo local de requisitos de sistema do Codex não permitir valores implícitos de aprovação YOLO,
revisor ou sandbox, o OpenClaw trata o padrão implícito como guardian
em vez disso e seleciona permissões guardian permitidas. `tools.exec.mode: "auto"`
também força aprovações do Codex revisadas por guardian e não preserva substituições legadas inseguras de
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"`;
defina `tools.exec.mode: "full"` para uma postura intencional sem aprovação.
Entradas
`[[remote_sandbox_config]]` com correspondência de hostname no mesmo arquivo de requisitos são respeitadas
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
valores são permitidos. Campos individuais de política substituem `mode`. O valor de revisor mais antigo
`guardian_subagent` ainda é aceito como alias de compatibilidade,
mas novas configurações devem usar `auto_review`.

Quando um sandbox do OpenClaw está ativo, o processo local do servidor de app do Codex ainda
é executado no host do Gateway. Portanto, o OpenClaw desabilita o Code Mode nativo do Codex,
servidores MCP do usuário e execução de plugins baseada em app para esse turno em vez de
tratar o sandboxing no lado do host do Codex como equivalente ao backend de sandbox do OpenClaw.
O acesso ao shell é exposto por meio de ferramentas dinâmicas apoiadas pelo sandbox do OpenClaw,
como `sandbox_exec` e `sandbox_process`, quando as ferramentas normais de exec/process
estão disponíveis.

Em hosts Ubuntu/AppArmor, o bwrap do Codex pode falhar em `workspace-write` antes
de o comando de shell iniciar quando você executa intencionalmente `workspace-write`
nativo do Codex sem sandboxing ativo do OpenClaw. Se você vir
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, execute
`openclaw doctor` e corrija a política de namespace do host relatada para o usuário de serviço do OpenClaw
em vez de conceder privilégios mais amplos ao contêiner Docker. Prefira
um perfil AppArmor com escopo para o processo de serviço; o fallback
`kernel.apparmor_restrict_unprivileged_userns=0` afeta o host inteiro e tem
trocas de segurança.

## Execução nativa em sandbox

O padrão estável é fail-closed: o sandboxing ativo do OpenClaw desabilita superfícies de execução
nativa do Codex que, de outro modo, seriam executadas a partir do host do servidor de app do Codex.
Use `appServer.experimental.sandboxExecServer: true` somente quando quiser
experimentar o suporte a ambiente remoto do Codex com o backend de sandbox do OpenClaw. Este
caminho de prévia exige servidor de app Codex 0.132.0 ou mais recente.

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

Quando a flag está ativa e a sessão atual do OpenClaw está em sandbox, o OpenClaw
inicia um servidor de exec local loopback apoiado pelo sandbox ativo, registra-o
com o servidor de app do Codex e inicia a thread e o turno do Codex com esse
ambiente pertencente ao OpenClaw. Se o servidor de app não conseguir registrar o ambiente,
a execução falha de modo fail-closed em vez de voltar silenciosamente para execução no host.

Este caminho de prévia é apenas local. Um servidor de app WebSocket remoto não consegue alcançar o
servidor de exec de loopback a menos que esteja sendo executado no mesmo host, então o OpenClaw rejeita
essa combinação.

## Isolamento de autenticação e ambiente

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do servidor de app no Codex home desse agente.
3. Somente para inicializações locais de servidor de app stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de app está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw detecta um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do servidor de app do Codex serem cobrados pela API por acidente.

Perfis explícitos de chave de API do Codex e fallback local de chave de env stdio usam login do servidor de app
em vez de env herdado do processo filho. Conexões de servidor de app WebSocket
não recebem fallback de chave de API env do Gateway; use um perfil explícito de autenticação ou a
própria conta do servidor de app remoto.

Inicializações de servidor de app stdio herdam o ambiente de processo do OpenClaw por padrão.
O OpenClaw é dono da ponte de conta do servidor de app do Codex e define `CODEX_HOME` como um
diretório por agente sob o estado do OpenClaw desse agente. Isso mantém configuração do Codex,
contas, cache/dados de Plugin e estado de thread com escopo para o agente do OpenClaw
em vez de vazar a partir do home pessoal `~/.codex` do operador.

O OpenClaw não reescreve `HOME` para inicializações locais normais de servidor de app. Subprocessos
executados pelo Codex, como `openclaw`, `gh`, `git`, CLIs de nuvem e comandos de shell, veem
o home normal do processo e podem encontrar configuração e tokens do home do usuário. O Codex também pode
descobrir `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`;
essa descoberta de `.agents` é intencionalmente compartilhada com o home do operador e é
separada do estado isolado `~/.codex`.

Plugins do OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
registro de plugins e carregador de Skills do OpenClaw. Assets pessoais de `~/.codex` do Codex não. Se
você tem Skills ou plugins úteis da CLI do Codex vindos de um Codex home que deveriam se tornar
parte de um agente do OpenClaw, faça o inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se uma implantação precisa de isolamento adicional de ambiente, adicione essas variáveis a
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

`appServer.clearEnv` afeta apenas o processo filho do servidor de app do Codex gerado.
O OpenClaw remove `CODEX_HOME` e `HOME` desta lista durante a normalização da inicialização local:
`CODEX_HOME` permanece por agente, e `HOME` permanece herdado para que
subprocessos possam usar o estado normal do home do usuário.

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

A maioria das demais ferramentas de integração do OpenClaw, como mensagens, mídia, cron,
navegador, nodes, gateway, `heartbeat_respond` e `web_search`, está disponível
por meio da busca de ferramentas do Codex sob o namespace `openclaw`. Isso mantém o contexto inicial
do modelo menor. `sessions_yield` e respostas de origem somente com ferramenta de mensagem
permanecem diretas porque são contratos de controle de turno. `sessions_spawn` permanece
searchable para que o `spawn_agent` nativo do Codex continue sendo a principal superfície de subagente do Codex,
enquanto delegação explícita do OpenClaw ou ACP ainda está disponível por meio
do namespace de ferramentas dinâmicas `openclaw`.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um servidor de app Codex
customizado que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo
de ferramentas.

## Timeouts

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`. Cada solicitação `item/tool/call` do Codex usa o primeiro
timeout disponível nesta ordem:

- Um argumento positivo `timeoutMs` por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem um timeout configurado, o padrão de geração de imagem de 120 segundos.
- Para a ferramenta `image` de compreensão de mídia, `tools.media.image.timeoutSeconds`
  convertido para milissegundos, ou o padrão de mídia de 60 segundos. Para compreensão
  de imagem, isso se aplica à própria solicitação e não é reduzido por
  trabalho de preparação anterior.
- O padrão de ferramenta dinâmica de 90 segundos.

Este watchdog é o orçamento externo dinâmico de `item/tool/call`. Timeouts de solicitação
específicos do provedor são executados dentro dessa chamada e mantêm suas próprias semânticas de timeout.
Orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Ao atingir timeout, o OpenClaw aborta o
sinal da ferramenta quando suportado e retorna uma resposta de ferramenta dinâmica com falha ao Codex
para que o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma solicitação do servidor de app
com escopo de turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o servidor de app ficar
silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw faz uma interrupção best-effort
do turno do Codex, registra um timeout de diagnóstico e libera a lane da sessão do
OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um turno nativo
obsoleto.

A maioria das notificações não terminais para o mesmo turno desarma esse watchdog curto
porque o Codex comprovou que o turno ainda está ativo. As transferências para ferramentas usam um orçamento
de inatividade pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta `item/tool/call`, depois que
itens de ferramenta nativos como `commandExecution` são concluídos, depois de conclusões brutas de
`custom_tool_call_output` e depois de progresso bruto pós-ferramenta do assistente,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e,
caso contrário, usa cinco minutos por padrão. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela de síntese silenciosa antes que o Codex emita o próximo
evento do turno atual. Conclusões de raciocínio, conclusões de
`agentMessage` de comentário e progresso bruto de raciocínio ou assistente pré-ferramenta podem
ser seguidos por uma resposta final automática, portanto usam a proteção de resposta
pós-progresso em vez de liberar imediatamente a faixa da sessão. Somente
itens `agentMessage` concluídos finais/sem comentário e conclusões brutas do assistente
pré-ferramenta armam a liberação de saída do assistente: se então o Codex ficar em silêncio sem
`turn/completed`, o OpenClaw interrompe, em melhor esforço, o turno nativo e libera
a faixa da sessão. Falhas do app-server stdio seguras para replay, incluindo
timeouts de inatividade de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são tentadas novamente uma vez em uma nova tentativa do app-server. Timeouts
inseguros ainda aposentam o cliente do app-server travado e liberam a faixa da sessão do
OpenClaw. Eles também limpam a vinculação obsoleta da thread nativa em vez de serem
reproduzidos automaticamente. Timeouts de observação de conclusão exibem texto de timeout
específico do Codex: casos seguros para replay dizem que a resposta pode estar incompleta,
enquanto casos inseguros orientam o usuário a verificar o estado atual antes de tentar novamente.
Diagnósticos públicos de timeout incluem campos estruturais, como o último método de
notificação do app-server, id/tipo/função do item de resposta bruta do assistente,
contagens de solicitações/itens ativos e estado de observação armado. Quando a última
notificação é um item de resposta bruta do assistente, eles também incluem uma prévia
limitada do texto do assistente. Eles não incluem prompt bruto nem conteúdo de ferramenta.

## Descoberta de modelos

Por padrão, o Plugin Codex solicita ao app-server os modelos disponíveis. A disponibilidade de
modelos pertence ao app-server Codex, portanto a lista pode mudar quando o OpenClaw
atualiza a versão empacotada de `@openai/codex` ou quando uma implantação aponta
`appServer.command` para um binário Codex diferente. A disponibilidade também pode ter escopo
por conta. Use `/codex models` em um Gateway em execução para ver o catálogo ativo
desse harness e dessa conta.

Se a descoberta falhar ou atingir timeout, o OpenClaw usa um catálogo de fallback empacotado para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

O harness empacotado atual é `@openai/codex` `0.139.0`. Uma sondagem `model/list`
contra esse app-server empacotado retornou:

| Id do modelo    | Padrão | Oculto | Modalidades de entrada | Esforços de raciocínio   |
| --------------- | ------ | ------ | ---------------------- | ------------------------ |
| `gpt-5.5`       | Sim    | Não    | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.4`       | Não    | Não    | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Não    | Não    | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.3-codex` | Não    | Não    | texto, imagem          | low, medium, high, xhigh |
| `gpt-5.2`       | Não    | Não    | texto, imagem          | low, medium, high, xhigh |

Modelos ocultos podem ser retornados pelo catálogo do app-server para fluxos internos ou
especializados, mas não são escolhas normais no seletor de modelos.

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

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentação do projeto. O OpenClaw
não escreve arquivos sintéticos de documentação de projeto do Codex nem depende de nomes de arquivo de fallback do Codex
para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade do workspace do OpenClaw, o harness Codex resolve os outros arquivos de bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` são encaminhados como
instruções de desenvolvedor do OpenClaw Codex porque definem o agente ativo,
a orientação disponível do workspace e o perfil do usuário. A lista compacta de Skills do OpenClaw
é encaminhada como instruções de desenvolvedor de colaboração com escopo de turno.
O conteúdo de `HEARTBEAT.md` não é injetado; turnos de Heartbeat recebem um ponteiro de modo de colaboração
para ler o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md`
do workspace de agente configurado não é colado na entrada de turno nativa do Codex
quando ferramentas de memória estão disponíveis para esse workspace; quando ele existe, o harness
adiciona um pequeno ponteiro de memória do workspace às instruções de desenvolvedor de colaboração
com escopo de turno, e o Codex deve usar `memory_search` ou `memory_get` quando memória
durável for relevante. Se as ferramentas estiverem desativadas, a busca de memória estiver indisponível ou o
workspace ativo for diferente do workspace de memória do agente, `MEMORY.md` usa o
caminho normal e limitado de contexto de turno.
`BOOTSTRAP.md`, quando presente, é encaminhado como contexto de referência de entrada de turno do OpenClaw.

## Substituições de ambiente

Substituições de ambiente permanecem disponíveis para testes locais:

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
preferida para implantações reproduzíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Relacionados

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
