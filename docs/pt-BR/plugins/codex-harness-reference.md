---
read_when:
    - Você precisa de todos os campos de configuração do harness Codex
    - Você está alterando o transporte, a autenticação, a descoberta ou o comportamento de timeout do app-server
    - Você está depurando a inicialização do harness do Codex, a descoberta de modelos ou o isolamento do ambiente
summary: Referência de configuração, autenticação, descoberta e servidor do aplicativo para o harness Codex
title: Referência do harness Codex
x-i18n:
    generated_at: "2026-07-01T07:55:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência aborda a configuração detalhada para o Plugin `codex`
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

| Campo                      | Padrão                  | Significado                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Configurações de descoberta de modelos para `model/list` do app-server do Codex.                                                                               |
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e timeout.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.                                                               |
| `codexPlugins`             | desabilitado                 | Suporte nativo a plugins/apps do Codex para plugins curados migrados instalados a partir do código-fonte. Veja [plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado                 | Configuração do Codex Computer Use. Veja [Codex Computer Use](/pt-BR/plugins/codex-computer-use).                                                          |

## Transporte do app-server

Por padrão, o OpenClaw inicia o binário gerenciado do Codex enviado com o
Plugin incluído:

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao Plugin `codex` incluído, em vez de
qualquer CLI do Codex separada que por acaso esteja instalada localmente. Defina
`appServer.command` somente quando você quiser intencionalmente executar um
executável diferente.

Para um app-server que já esteja em execução, use o transporte WebSocket:

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
| `command`                                     | binário gerenciado do Codex                            | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | indefinido                                             | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | indefinido                                             | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw monta seu ambiente herdado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | indefinido                                             | Raiz remota do workspace do app-server Codex. Quando definido, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia apenas o cwd final do app-server ao Codex. Se o cwd estiver fora da raiz resolvida do workspace OpenClaw, o OpenClaw falha de forma fechada em vez de enviar um caminho local do Gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas de plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela silenciosa depois que o Codex aceita um turno ou depois de uma solicitação app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de ociosidade de conclusão e progresso usada depois de uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão de raciocínio bruto ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese pós-ferramenta possa legitimamente ficar silenciosa por mais tempo que o orçamento final de liberação do assistente.                                |
| `mode`                                        | `"yolo"` a menos que requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada ao iniciar thread, retomar e turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou uma sandbox de guardião permitida  | Modo de sandbox nativo do Codex enviado ao iniciar e retomar thread. Sandboxes OpenClaw ativas restringem turnos `danger-full-access` para Codex `workspace-write`; a flag de rede do turno segue a saída da sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | diretório do processo atual                              | Workspace usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | indefinido                                             | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento de modo rápido, `"flex"` solicita processamento flex, e `null` limpa a substituição. O legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                           | Opte pela rede de perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Adesão de prévia que registra um ambiente Codex com suporte de sandbox OpenClaw junto ao app-server Codex 0.132.0 ou mais recente para que a execução nativa do Codex possa rodar dentro da sandbox OpenClaw ativa.                                                                                                                                                                                                         |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o OpenClaw gera um
nome de perfil resistente a colisões `openclaw-network-<fingerprint>` a partir do
corpo do perfil; use `profileName` apenas quando um nome local estável for necessário.

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
perfil de permissão gerado. A aplicação de rede gerenciada pelo Codex é rede em sandbox,
portanto um perfil de acesso total não protegeria o tráfego de saída.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. O app-server Codex
deve relatar a versão estável `0.125.0` ou mais recente.

OpenClaw trata URLs de servidor de apps WebSocket que não são loopback como remotas e exige
autenticação WebSocket com identidade por meio de `appServer.authToken` ou de um
cabeçalho `Authorization`. `appServer.authToken` e cada valor de `appServer.headers.*`
podem ser um SecretInput; o runtime de segredos resolve SecretRefs e atalhos de env
antes que o OpenClaw crie as opções de inicialização do servidor de apps, e SecretRefs
estruturados não resolvidos falham antes que qualquer token ou cabeçalho seja enviado.
Quando Plugins nativos do Codex são configurados, o OpenClaw usa o plano de controle de
Plugins do servidor de apps conectado para instalar ou atualizar esses Plugins e, então,
atualiza o inventário de apps para que apps pertencentes a Plugins fiquem visíveis para a
thread do Codex. `app/list` continua sendo a fonte autoritativa de inventário e metadados,
mas a política do OpenClaw decide se `thread/start` envia
`config.apps[appId].enabled = true` para um app acessível listado, mesmo que o Codex
atualmente o marque como desabilitado. IDs de apps desconhecidos ou ausentes continuam
falhando de modo fechado; esse caminho só ativa Plugins de marketplace via
`plugin/install` e atualiza o inventário. Conecte o OpenClaw somente a servidores de apps
remotos que sejam confiáveis para aceitar instalações de Plugins gerenciadas pelo
OpenClaw e atualizações de inventário de apps.

## Modos de aprovação e sandbox

Sessões locais de servidor de apps stdio usam modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura confiável de operador local permite que
turnos e heartbeats não assistidos do OpenClaw avancem sem prompts de aprovação nativos
que ninguém estaria presente para responder.

Se o arquivo local de requisitos do sistema do Codex não permitir valores implícitos de
aprovação YOLO, revisor ou sandbox, o OpenClaw trata o padrão implícito como guardian em
vez disso e seleciona permissões guardian permitidas. `tools.exec.mode: "auto"` também
força aprovações do Codex revisadas por guardian e não preserva substituições legadas
inseguras de `approvalPolicy: "never"` ou `sandbox: "danger-full-access"`; defina
`tools.exec.mode: "full"` para uma postura intencional sem aprovação. Entradas
`[[remote_sandbox_config]]` com correspondência de hostname no mesmo arquivo de
requisitos são respeitadas para a decisão padrão de sandbox.

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
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando esses valores
são permitidos. Campos de política individuais substituem `mode`. O valor de revisor
mais antigo `guardian_subagent` ainda é aceito como alias de compatibilidade, mas novas
configurações devem usar `auto_review`.

Quando um sandbox do OpenClaw está ativo, o processo local do servidor de apps Codex
ainda é executado no host do Gateway. Portanto, o OpenClaw desabilita o modo nativo de
código do Codex, servidores MCP do usuário e execução de Plugins baseada em apps para
esse turno, em vez de tratar o sandboxing do lado do host do Codex como equivalente ao
backend de sandbox do OpenClaw. O acesso ao shell é exposto por ferramentas dinâmicas
com backend de sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`, quando as
ferramentas normais de exec/process estão disponíveis.

Em hosts Ubuntu/AppArmor, o bwrap do Codex pode falhar em `workspace-write` antes de o
comando shell iniciar quando você executa intencionalmente `workspace-write` nativo do
Codex sem sandboxing ativo do OpenClaw. Se você vir
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, execute
`openclaw doctor` e corrija a política de namespace do host relatada para o usuário de
serviço do OpenClaw, em vez de conceder privilégios mais amplos ao contêiner Docker.
Prefira um perfil AppArmor com escopo para o processo de serviço; o fallback
`kernel.apparmor_restrict_unprivileged_userns=0` vale para todo o host e tem
tradeoffs de segurança.

## Execução nativa em sandbox

O padrão estável é falhar de modo fechado: o sandboxing ativo do OpenClaw desabilita as
superfícies de execução nativa do Codex que, de outra forma, seriam executadas a partir
do host do servidor de apps Codex. Use `appServer.experimental.sandboxExecServer: true`
somente quando quiser experimentar o suporte a ambiente remoto do Codex com o backend de
sandbox do OpenClaw. Esse caminho de prévia exige servidor de apps Codex 0.132.0 ou mais
novo.

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
inicia um servidor de execução local loopback apoiado pelo sandbox ativo, registra-o no
servidor de apps Codex e inicia a thread e o turno do Codex com esse ambiente pertencente
ao OpenClaw. Se o servidor de apps não conseguir registrar o ambiente, a execução falha
de modo fechado em vez de voltar silenciosamente para a execução no host.

Esse caminho de prévia é apenas local. Um servidor de apps WebSocket remoto não consegue
acessar o servidor de execução loopback a menos que esteja sendo executado no mesmo host,
então o OpenClaw rejeita essa combinação.

## Autenticação e isolamento de ambiente

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do servidor de apps no Codex home desse agente.
3. Somente para inicializações locais de servidor de apps stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de apps está presente e a
   autenticação da OpenAI ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura do ChatGPT,
ele remove `CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex criado. Isso mantém
chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do servidor de apps Codex serem cobrados pela API por acidente.

Perfis explícitos de chave de API do Codex e o fallback local de chave por env em stdio
usam login no servidor de apps em vez de env herdado do processo filho. Conexões de
servidor de apps WebSocket não recebem fallback de chave de API via env do Gateway; use
um perfil de autenticação explícito ou a própria conta do servidor de apps remoto.

Inicializações de servidor de apps stdio herdam o ambiente de processo do OpenClaw por
padrão. O OpenClaw possui a ponte de conta do servidor de apps Codex e define
`CODEX_HOME` como um diretório por agente dentro do estado OpenClaw desse agente. Isso
mantém configuração do Codex, contas, cache/dados de Plugins e estado de threads
escopados ao agente OpenClaw em vez de vazar do home pessoal `~/.codex` do operador.

O OpenClaw não reescreve `HOME` para inicializações locais normais de servidor de apps.
Subprocessos executados pelo Codex, como `openclaw`, `gh`, `git`, CLIs de nuvem e
comandos shell, veem o home normal do processo e conseguem encontrar configurações e
tokens no home do usuário. O Codex também pode descobrir `$HOME/.agents/skills` e
`$HOME/.agents/plugins/marketplace.json`; essa descoberta de `.agents` é
intencionalmente compartilhada com o home do operador e é separada do estado `~/.codex`
isolado.

Plugins do OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo registro de
Plugins e pelo carregador de Skills próprios do OpenClaw. Ativos pessoais do Codex em
`~/.codex` não. Se você tiver Skills ou Plugins úteis da CLI Codex de um Codex home que
devam se tornar parte de um agente OpenClaw, faça o inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas variáveis
a `appServer.clearEnv`:

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

`appServer.clearEnv` afeta somente o processo filho do servidor de apps Codex criado. O
OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização da inicialização
local: `CODEX_HOME` permanece por agente, e `HOME` permanece herdado para que
subprocessos possam usar o estado normal do home do usuário.

## Ferramentas dinâmicas

Ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não
expõe ferramentas dinâmicas que duplicam operações de workspace nativas do Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

A maioria das ferramentas restantes de integração do OpenClaw, como mensagens, mídia,
cron, navegador, nodes, gateway, `heartbeat_respond` e `web_search`, fica disponível por
meio da busca de ferramentas do Codex no namespace `openclaw`. Isso mantém o contexto
inicial do modelo menor. `sessions_yield` e respostas de origem apenas com ferramenta de
mensagem permanecem diretas porque são contratos de controle de turno. `sessions_spawn`
permanece pesquisável para que o `spawn_agent` nativo do Codex continue sendo a
superfície principal de subagentes do Codex, enquanto delegação explícita do OpenClaw ou
ACP ainda fica disponível pelo namespace de ferramentas dinâmicas `openclaw`.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um servidor de apps
Codex customizado que não consiga pesquisar ferramentas dinâmicas adiadas ou ao depurar o
payload completo de ferramentas.

## Timeouts

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas
independentemente de `appServer.requestTimeoutMs`. Cada requisição `item/tool/call` do
Codex usa o primeiro timeout disponível nesta ordem:

- Um argumento `timeoutMs` positivo por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem timeout configurado, o padrão de 120 segundos de geração de
  imagens.
- Para a ferramenta `image` de compreensão de mídia, `tools.media.image.timeoutSeconds`
  convertido para milissegundos, ou o padrão de mídia de 60 segundos. Para compreensão de
  imagens, isso se aplica à própria requisição e não é reduzido por trabalho de
  preparação anterior.
- O padrão de 90 segundos para ferramenta dinâmica.

Esse watchdog é o orçamento externo de `item/tool/call` dinâmico. Timeouts de requisição
específicos de provedores são executados dentro dessa chamada e mantêm suas próprias
semânticas de timeout. Orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Ao
atingir timeout, o OpenClaw aborta o sinal da ferramenta quando houver suporte e retorna
uma resposta de ferramenta dinâmica com falha ao Codex para que o turno possa continuar
em vez de deixar a sessão em `processing`.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma requisição do
servidor de apps com escopo de turno, o harness espera que o Codex faça progresso no
turno atual e eventualmente finalize o turno nativo com `turn/completed`. Se o servidor
de apps ficar silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw tenta
interromper o turno do Codex em best-effort, registra um timeout de diagnóstico e libera
a lane de sessão do OpenClaw para que mensagens de chat subsequentes não fiquem
enfileiradas atrás de um turno nativo obsoleto.

A maioria das notificações não terminais para o mesmo turno desarma esse watchdog curto
porque o Codex provou que o turno ainda está ativo. Handoffs de ferramentas usam um orçamento de ociosidade
pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta `item/tool/call`, depois que
itens de ferramenta nativos como `commandExecution` são concluídos, depois de conclusões brutas de
`custom_tool_call_output` e depois de progresso bruto do assistente pós-ferramenta,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e,
caso contrário, usa cinco minutos por padrão. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela silenciosa de síntese antes que o Codex emita o próximo
evento do turno atual. Conclusões de raciocínio, conclusões de
`agentMessage` de comentário e progresso bruto de raciocínio ou assistente pré-ferramenta podem
ser seguidos por uma resposta final automática, então eles usam a proteção de resposta
pós-progresso em vez de liberar a via de sessão imediatamente. Somente itens
`agentMessage` concluídos finais/sem comentário e conclusões brutas do assistente
pré-ferramenta armam a liberação de saída do assistente: se então o Codex ficar em silêncio sem
`turn/completed`, o OpenClaw interrompe em melhor esforço o turno nativo e libera
a via de sessão. Falhas replay-safe do servidor de aplicativo stdio, incluindo
tempos limite de ociosidade de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são repetidas uma vez em uma nova tentativa do servidor de aplicativo. Tempos limite
inseguros ainda aposentam o cliente preso do servidor de aplicativo e liberam a via de sessão
do OpenClaw. Eles também limpam a associação obsoleta da thread nativa em vez de serem
reexecutados automaticamente. Tempos limite de observação de conclusão exibem texto de timeout
específico do Codex: casos replay-safe dizem que a resposta pode estar incompleta, enquanto casos inseguros
orientam o usuário a verificar o estado atual antes de tentar novamente. Diagnósticos públicos de timeout
incluem campos estruturais como o último método de notificação do servidor de aplicativo,
id/tipo/função do item de resposta bruta do assistente, contagens de solicitações/itens ativos e
estado armado de observação. Quando a última notificação é um item de resposta bruta do assistente, eles
também incluem uma prévia limitada do texto do assistente. Eles não incluem prompt bruto nem
conteúdo de ferramenta.

## Descoberta de modelos

Por padrão, o Plugin Codex solicita ao servidor de aplicativo os modelos disponíveis. A
disponibilidade de modelos pertence ao servidor de aplicativo do Codex, então a lista pode mudar quando o OpenClaw
atualiza a versão do `@openai/codex` empacotada ou quando uma implantação aponta
`appServer.command` para um binário diferente do Codex. A disponibilidade também pode ser
delimitada por conta. Use `/codex models` em um Gateway em execução para ver o catálogo ao vivo
desse harness e dessa conta.

Se a descoberta falhar ou atingir timeout, o OpenClaw usa um catálogo fallback empacotado para:

- GPT-5.5
- GPT-5.4 mini

O harness empacotado atual é `@openai/codex` `0.142.4`. Uma sondagem `model/list`
contra esse servidor de aplicativo empacotado em um workspace habilitado para GPT-5.6 retornou estas
linhas públicas do seletor:

| ID do modelo          | Modalidades de entrada | Esforços de raciocínio               |
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

Modelos ocultos podem ser retornados pelo catálogo do servidor de aplicativo para fluxos internos ou
especializados, mas eles não são escolhas normais do seletor de modelos.

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e use apenas o
catálogo fallback:

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

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentos de projeto. O OpenClaw
não escreve arquivos sintéticos de documentos de projeto do Codex nem depende de nomes de arquivo fallback do Codex
para arquivos de persona, porque fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade de workspace do OpenClaw, o harness Codex resolve os outros arquivos de bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` são encaminhados como
instruções de desenvolvedor do OpenClaw Codex porque definem o agente ativo,
as orientações disponíveis do workspace e o perfil de usuário. A lista compacta de Skills do OpenClaw
é encaminhada como instruções de desenvolvedor de colaboração delimitadas ao turno.
O conteúdo de `HEARTBEAT.md` não é injetado; turnos de Heartbeat recebem um ponteiro de modo de colaboração
para ler o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md`
do workspace de agente configurado não é colado na entrada nativa de turno do Codex
quando ferramentas de memória estão disponíveis para esse workspace; quando ele existe, o harness
adiciona um pequeno ponteiro de memória de workspace às instruções de desenvolvedor de colaboração
delimitadas ao turno, e o Codex deve usar `memory_search` ou `memory_get` quando memória durável
for relevante. Se as ferramentas estiverem desabilitadas, a busca de memória estiver indisponível ou o
workspace ativo for diferente do workspace de memória do agente, `MEMORY.md` usa o
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferida para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Relacionados

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
