---
read_when:
    - Você precisa de todos os campos de configuração do harness do Codex
    - Você está alterando o comportamento de transporte, autenticação, descoberta ou tempo limite do servidor do aplicativo
    - Você está depurando a inicialização do harness do Codex, a descoberta de modelos ou o isolamento do ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de aplicativos para o harness do Codex
title: Referência do harness do Codex
x-i18n:
    generated_at: "2026-07-12T00:08:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência aborda a configuração detalhada do Plugin oficial `codex`.
Para decisões de configuração e roteamento, comece por
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

Campos de nível superior:

| Campo                      | Padrão                            | Significado                                                                                                                                                                                    |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                        | Configurações de descoberta de modelos para `model/list` do app-server do Codex.                                                                                                               |
| `appServer`                | app-server stdio gerenciado       | Configurações de transporte, comando, autenticação, aprovação, sandbox e tempo limite. O harness comum usa, por padrão, o estado com escopo do agente.                                          |
| `codexDynamicToolsLoading` | `"searchable"`                    | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                                                                      |
| `codexDynamicToolsExclude` | `[]`                              | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.                                                                                              |
| `codexPlugins`             | desabilitado                      | Suporte nativo a plugins/aplicativos do Codex, incluindo acesso opcional a aplicativos de contas conectadas. Consulte [plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).                |
| `computerUse`              | desabilitado                      | Configuração do Computer Use do Codex. Consulte [Computer Use do Codex](/pt-BR/plugins/codex-computer-use).                                                                                           |
| `supervision`              | desabilitado                      | Catálogo de sessões nativas não arquivadas, continuação de ramificações locais e política de ferramentas do agente. Consulte [supervisão do Codex](/plugins/codex-supervision).                |

## Supervisão

A supervisão lista sessões não arquivadas do Codex no computador do Gateway e
nos Nodes pareados que aderiram ao recurso. Habilite-a independentemente do harness do agente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Campos de `supervision`:

| Campo                 | Padrão                   | Significado                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`             | `false`                  | Divulga o catálogo de sessões locais e, no Gateway, agrega catálogos de Nodes pareados que aderiram ao recurso para a página de sessões do Codex.                                                                                                                         |
| `endpoints`           | endpoint local integrado | Destinos de endpoint avançados e de compatibilidade para o agente de supervisão do Codex mantido e para ferramentas MCP independentes. O catálogo humano e o fluxo de ramificação ignoram esses destinos e usam o App Server de supervisão resolvido a partir de `appServer`. |
| `allowRawTranscripts` | `false`                  | Com a supervisão habilitada, permite que agentes autônomos ou MCPs independentes leiam transcrições e campos de listagem derivados delas. Leituras somente de metadados de `codex_threads` continuam disponíveis. Não controla a continuação autenticada na interface de controle. |
| `allowWriteControls`  | `false`                  | Com a supervisão habilitada, permite mutações autônomas de bifurcação, renomeação, arquivamento e desarquivamento em `codex_threads`, além de operações independentes de envio, direcionamento e interrupção via MCP. Não ignora outras verificações de vinculação, host, status ou confirmação. |

As entradas de endpoint aceitam estes campos:

| Campo          | Aplica-se a   | Significado                                                                    |
| -------------- | ------------- | ------------------------------------------------------------------------------ |
| `id`           | todos         | ID estável do endpoint.                                                        |
| `label`        | todos         | Rótulo de exibição opcional.                                                   |
| `transport`    | todos         | `"stdio-proxy"` ou `"websocket"`.                                              |
| `command`      | `stdio-proxy` | Comando opcional do App Server.                                                |
| `args`         | `stdio-proxy` | Argumentos opcionais do comando.                                               |
| `cwd`          | `stdio-proxy` | Diretório de trabalho opcional do processo filho.                              |
| `url`          | `websocket`   | URL WebSocket ou de soquete local compatível, obrigatória.                     |
| `authTokenEnv` | `websocket`   | Variável de ambiente opcional cujo valor autentica o endpoint.                 |

A página **Sessões do Codex** usa o App Server de supervisão do Plugin e mostra
somente sessões não arquivadas. Sem configurações explícitas de conexão em
`appServer`, essa conexão usa stdio gerenciado no diretório inicial do usuário.
Linhas locais armazenadas ou ociosas podem criar um Chat bloqueado para o modelo,
com um histórico limitado de usuário e assistente até o último turno de origem
terminal persistido. Sua vinculação privada mantém a bifurcação do snapshot, a
ramificação canônica proveniente de `appServer`, a injeção de histórico e os
turnos posteriores nessa conexão. O primeiro início canônico usa o par retornado
pela bifurcação. Retomadas posteriores omitem as substituições de modelo e
provedor do OpenClaw para que o Codex restaure o par persistido da thread
canônica; uma alteração nativa separada pode atualizar esse par, mas o modelo
externo e a cadeia de fallback nunca o substituem. Linhas armazenadas e ociosas
podem ser arquivadas após a confirmação de que não há outro executor, a menos
que outra vinculação ativa do OpenClaw seja proprietária do destino exato ou de
um de seus descendentes gerados e não arquivados. O OpenClaw segue a paginação
de descendentes do Codex e interrompe com segurança em caso de erros de
enumeração, ciclos ou esgotamento do limite de segurança. A confirmação ainda
abrange clientes nativos desconhecidos e a condição de corrida entre status e
arquivamento. Um Chat supervisionado e bloqueado para o modelo não pode ser
excluído enquanto protege a vinculação nativa. Origens ativas não podem criar
uma ramificação nem ser arquivadas, mas um Chat supervisionado existente ainda
pode ser aberto. Todas as linhas de Nodes pareados permanecem somente leitura; o
transporte do Node ainda não fornece o ciclo de vida de streaming necessário
para o harness.

`appServer.homeScope: "user"` por si só altera qual diretório inicial do Codex um
processo de harness gerenciado usa; ele não publica o catálogo da frota.
Habilitar a supervisão não altera o padrão do harness. Em vez disso, a conexão
de supervisão separada usa, por padrão, stdio gerenciado no diretório inicial do
usuário quando não existem configurações explícitas de conexão em `appServer`.
As configurações explícitas são respeitadas nessa conexão. Vinculações
supervisionadas pendentes e confirmadas mantêm essa conexão em todos os turnos;
a supervisão desabilitada ou um desvio de conexão/ciclo de vida interrompe com
segurança, em vez de recorrer ao harness no diretório inicial do agente. A
conexão padrão compartilha sessões armazenadas com clientes nativos do Codex,
mas não o estado de atividade local dos processos deles.

As configurações legadas de `plugins.entries.codex-supervisor` foram
descontinuadas. Execute `openclaw doctor --fix` para migrar a entrada antiga, as
definições de endpoint, os sinalizadores de política e as referências de
permissão/negação do Plugin para este bloco. Valores canônicos explícitos em
`codex.config.supervision` prevalecem em caso de conflito.

## Transporte do app-server

Para turnos comuns do harness, o OpenClaw inicia o binário gerenciado do Codex
fornecido com o Plugin oficial (atualmente `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao Plugin oficial `codex`, em vez de
usar qualquer CLI do Codex instalada separadamente no sistema local. Defina
`appServer.command` somente quando quiser intencionalmente usar outro executável.
Turnos gerenciados comuns com o diretório inicial isolado padrão do agente
preferem esse pacote fixado mesmo quando um pacote do aplicativo para macOS está
instalado. Quando o [Computer Use](/pt-BR/plugins/codex-computer-use) está habilitado,
ou quando `homeScope` é `"user"` e pode carregar o estado nativo do Computer Use,
a inicialização gerenciada passa a preferir o binário do aplicativo para desktop
que possui as permissões necessárias do macOS. A mesma regra de priorização do
desktop se aplica quando a configuração efetiva do Codex no diretório inicial
isolado de um agente habilita o Computer Use nativo. Se nenhum pacote do
aplicativo para desktop estiver instalado, o OpenClaw recorre ao binário do
pacote fixado.

A transferência do executável e o isolamento da configuração nativa coordenam
clientes dentro de um único processo do Gateway em execução. Reinicie o Gateway
depois que outro processo alterar a configuração nativa do Plugin do Codex.

A supervisão resolve uma conexão separada. Sem configurações explícitas de
conexão em `appServer`, ela usa stdio gerenciado com `homeScope: "user"`; o
harness comum permanece com stdio gerenciado e `homeScope: "agent"`.
Configurações explícitas de conexão são respeitadas pelos dois caminhos. Defina
`homeScope: "user"` explicitamente quando o harness comum precisar compartilhar
`$CODEX_HOME` (ou `~/.codex`) com clientes nativos. Uma vinculação supervisionada
privada usa a conexão de supervisão independentemente do padrão do harness
comum. Processos independentes do App Server mantêm estados ativos e de
aprovação separados.

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

Campos de `appServer`:

| Campo                                         | Padrão                                                 | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"unix"` explícito conecta-se ao soquete de controle local; `"websocket"` conecta-se à `url`.                                                                                                                                                                                                                                                                         |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado comum do harness por agente do OpenClaw. `"user"` é uma adesão explícita que compartilha o `$CODEX_HOME` nativo ou `~/.codex`, usa a autenticação nativa e habilita o gerenciamento de threads somente pelo proprietário. O escopo de usuário oferece suporte ao transporte stdio local ou Unix. Para a conexão de supervisão separada, um valor não definido é resolvido como `"user"` para stdio ou Unix e como `"agent"` para WebSocket. |
| `command`                                     | binário gerenciado do Codex                            | Executável para o transporte stdio. Deixe-o não definido para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para o transporte stdio.                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | não definido                                           | URL do App Server WebSocket ou URL `unix://`. Um caminho Unix explícito vazio seleciona o soquete de controle canônico no diretório inicial do usuário.                                                                                                                                                                                                                                         |
| `authToken`                                   | não definido                                           | Token Bearer para o transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket adicionais. Os valores dos cabeçalhos aceitam strings literais ou valores SecretInput, por exemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | Nomes adicionais de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado.                                                                                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | não definido                                           | Raiz remota do espaço de trabalho do app-server do Codex. Quando definida, o OpenClaw infere a raiz local do espaço de trabalho a partir do espaço de trabalho resolvido do OpenClaw, preserva o sufixo do cwd atual sob essa raiz remota e envia ao Codex somente o cwd final do app-server. Se o cwd estiver fora da raiz resolvida do espaço de trabalho do OpenClaw, o OpenClaw falhará de forma segura, em vez de enviar um caminho local do Gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela de inatividade depois que o Codex aceita um turno ou após uma solicitação do app-server com escopo de turno, enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Proteção de inatividade de conclusão e progresso usada após uma transferência para uma ferramenta, a conclusão de uma ferramenta nativa, o progresso bruto do assistente após a ferramenta, a conclusão do raciocínio bruto ou o progresso do raciocínio, enquanto o OpenClaw aguarda `turn/completed`. Use esta opção para cargas de trabalho confiáveis ou pesadas nas quais a síntese após a ferramenta pode permanecer legitimamente inativa por mais tempo que o orçamento de liberação final do assistente. |
| `mode`                                        | `"yolo"`, salvo se os requisitos locais do Codex não permitirem YOLO | Predefinição para execução YOLO ou revisada pelo guardião.                                                                                                                                                                                                                                                                                                                                      |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação permitida pelo guardião | Política de aprovação nativa do Codex enviada ao iniciar e retomar a thread e ao executar o turno.                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox permitido pelo guardião | Modo de sandbox nativo do Codex enviado ao iniciar e retomar a thread. Sandboxes ativos do OpenClaw restringem turnos `danger-full-access` ao `workspace-write` do Codex; o sinalizador de rede do turno segue a saída de rede do sandbox do OpenClaw.                                                                                                                                              |
| `approvalsReviewer`                           | `"user"` ou um revisor permitido pelo guardião         | Use `"auto_review"` para permitir que o Codex revise solicitações de aprovação nativas quando permitido.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | diretório atual do processo                            | Espaço de trabalho usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | não definido                                           | Nível de serviço opcional do app-server do Codex. `"priority"` habilita o roteamento em modo rápido, `"flex"` solicita processamento flexível e `null` remove a substituição. O valor legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                           | Adere ao uso da rede do perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a escolhe com `default_permissions`, em vez de enviar `sandbox`.                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | Adesão de prévia que registra um ambiente do Codex respaldado pelo sandbox do OpenClaw no app-server compatível do Codex, permitindo que a execução nativa do Codex ocorra dentro do sandbox ativo do OpenClaw.                                                                                                                                                                                   |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do
Codex. Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissões gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o OpenClaw gera um
nome de perfil `openclaw-network-<fingerprint>` resistente a colisões a partir do
corpo do perfil; use `profileName` somente quando for necessário um nome local
estável.

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

Se o runtime normal do servidor de aplicativos fosse `danger-full-access`, habilitar
`networkProxy` usaria, em vez disso, acesso ao sistema de arquivos no estilo do espaço
de trabalho para o perfil de permissões gerado. A imposição de rede gerenciada pelo Codex
é uma rede em sandbox, portanto um perfil de acesso total não protegeria o tráfego de saída.

O Plugin bloqueia handshakes do servidor de aplicativos mais antigos ou sem versão: o servidor
de aplicativos do Codex deve informar a versão estável `0.143.0` ou mais recente.

O OpenClaw trata URLs WebSocket do servidor de aplicativos que não sejam de local loopback como
remotas e exige autenticação WebSocket vinculada à identidade por meio de `appServer.authToken`
ou de um cabeçalho `Authorization`. `appServer.authToken` e cada valor
`appServer.headers.*` podem ser um SecretInput; o runtime de segredos resolve SecretRefs e a
forma abreviada de variáveis de ambiente antes que o OpenClaw crie as opções de inicialização
do servidor de aplicativos, e SecretRefs estruturadas não resolvidas causam falha antes que
qualquer token ou cabeçalho seja enviado. Quando Plugins nativos do Codex estão configurados,
o OpenClaw usa o plano de controle de Plugins do servidor de aplicativos conectado para instalar
ou atualizar esses Plugins e, em seguida, atualiza o inventário de aplicativos para que os
aplicativos pertencentes aos Plugins fiquem visíveis para a thread do Codex. `app/list` continua
sendo a fonte oficial do inventário e dos metadados, mas a política do OpenClaw decide se
`thread/start` envia `config.apps[appId].enabled = true` para um aplicativo acessível listado,
mesmo que o Codex atualmente o marque como desabilitado. IDs de aplicativos desconhecidos ou
ausentes continuam bloqueados por padrão; esse caminho apenas ativa Plugins do marketplace por
meio de `plugin/install` e atualiza o inventário. Conecte o OpenClaw somente a servidores de
aplicativos remotos confiáveis para aceitar instalações de Plugins gerenciadas pelo OpenClaw e
atualizações do inventário de aplicativos.

## Modos de aprovação e sandbox

As sessões locais do servidor de aplicativos via stdio usam o modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura confiável do operador local permite que
turnos e heartbeats autônomos do OpenClaw avancem sem prompts de aprovação nativos
que ninguém estaria disponível para responder.

Se o arquivo local de requisitos do sistema do Codex não permitir valores implícitos de
aprovação YOLO, revisor ou sandbox, o OpenClaw tratará o padrão implícito como guardian
e selecionará permissões guardian permitidas. `tools.exec.mode: "auto"`
também força aprovações do Codex revisadas pelo guardian e não preserva substituições
legadas inseguras de `approvalPolicy: "never"` ou `sandbox: "danger-full-access"`;
defina `tools.exec.mode: "full"` para uma postura intencional sem aprovação.
As entradas `[[remote_sandbox_config]]` correspondentes ao nome do host no mesmo arquivo
de requisitos são respeitadas na decisão do sandbox padrão.

Defina `appServer.mode: "guardian"` para aprovações do Codex revisadas pelo guardian:

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

A predefinição `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando esses
valores são permitidos. Campos individuais de política substituem `mode`. O valor
mais antigo `guardian_subagent` do revisor ainda é aceito como um alias de compatibilidade,
mas novas configurações devem usar `auto_review`.

Quando uma sandbox do OpenClaw está ativa, o processo local do servidor de aplicativos do
Codex ainda é executado no host do Gateway. Portanto, o OpenClaw desabilita o Code Mode
nativo do Codex, servidores MCP do usuário e a execução de Plugins apoiada por aplicativos
nesse turno, em vez de tratar a sandbox no host do Codex como equivalente ao backend de
sandbox do OpenClaw. O acesso ao shell é disponibilizado por ferramentas dinâmicas apoiadas
pela sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`, quando as ferramentas
normais de execução/processo estão disponíveis.

<Note>
Em hosts de sandbox do OpenClaw baseados em Docker (`agents.defaults.sandbox.mode` definido
como um backend Docker), `openclaw doctor` verifica se o host permite os namespaces de usuário
sem privilégios (e, quando a saída de rede da sandbox Docker está desabilitada, os namespaces
de rede) necessários para que o `bwrap` aninhado do Codex execute o shell com
`workspace-write` dentro do contêiner da sandbox. Uma verificação com falha geralmente aparece
como `bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` em hosts
Ubuntu/AppArmor. Corrija a política de namespaces do host indicada para o usuário do serviço
OpenClaw e reinicie o Gateway; prefira um perfil AppArmor restrito ao processo do serviço em
vez da alternativa aplicável a todo o host
`kernel.apparmor_restrict_unprivileged_userns=0` e não conceda privilégios mais amplos ao
contêiner Docker apenas para atender ao `bwrap` aninhado.
</Note>

## Execução nativa em sandbox

O padrão estável é bloquear em caso de falha: a sandbox ativa do OpenClaw desabilita
superfícies de execução nativas do Codex que, de outra forma, seriam executadas no host
do servidor de aplicativos do Codex. Use `appServer.experimental.sandboxExecServer: true`
somente quando quiser experimentar o suporte a ambientes remotos do Codex com o backend
de sandbox do OpenClaw. Esse caminho de prévia funciona com todas as versões compatíveis
do servidor de aplicativos do Codex.

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

Quando a opção está ativada e a sessão atual do OpenClaw está em sandbox, o OpenClaw
inicia um servidor de execução em local loopback apoiado pela sandbox ativa, registra-o
no servidor de aplicativos do Codex e inicia a thread e o turno do Codex com esse ambiente
pertencente ao OpenClaw. Se o servidor de aplicativos não conseguir registrar o ambiente,
a execução falhará de forma bloqueada em vez de retornar silenciosamente à execução no host.

Esse caminho de prévia é somente local. Um servidor de aplicativos WebSocket remoto não
consegue acessar o servidor de execução de loopback, a menos que seja executado no mesmo host;
portanto, o OpenClaw rejeita essa combinação.

## Autenticação e isolamento do ambiente

Na home padrão por agente, a autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação do Codex no OpenClaw para o agente.
2. A conta existente do servidor de aplicativos na home do Codex desse agente.
3. Somente para inicializações locais do servidor de aplicativos via stdio, `CODEX_API_KEY`
   e depois `OPENAI_API_KEY`, quando nenhuma conta do servidor de aplicativos está presente
   e a autenticação da OpenAI ainda é necessária.

Quando o OpenClaw encontra um perfil de autenticação do Codex no estilo de assinatura do
ChatGPT (OAuth ou tipo de credencial de token), ele remove `CODEX_API_KEY` e
`OPENAI_API_KEY` do processo filho do Codex iniciado. Isso mantém as chaves de API no nível
do Gateway disponíveis para embeddings ou modelos diretos da OpenAI sem fazer com que os
turnos nativos do servidor de aplicativos do Codex sejam cobrados pela API acidentalmente.

Perfis explícitos de chave de API do Codex e o fallback local para chaves de ambiente via
stdio usam o login do servidor de aplicativos em vez do ambiente herdado pelo processo filho.
Conexões WebSocket do servidor de aplicativos não recebem o fallback para chaves de API do
ambiente do Gateway; use um perfil de autenticação explícito ou a própria conta do servidor
de aplicativos remoto.

As inicializações do servidor de aplicativos via stdio herdam o ambiente de processo do
OpenClaw por padrão. O OpenClaw controla a ponte de conta do servidor de aplicativos do
Codex e define `CODEX_HOME` como um diretório por agente no estado do OpenClaw desse agente.
Isso mantém a configuração, as contas, o cache/dados de Plugins e o estado das threads do
Codex restritos ao agente do OpenClaw, em vez de permitir que vazem da home pessoal
`~/.codex` do operador.

Defina `appServer.homeScope: "user"` para compartilhar o estado nativo do Codex com o Codex
Desktop e a CLI. Esse modo de home do usuário local é compatível com stdio gerenciado e
transporte Unix explícito. Ele usa `$CODEX_HOME` quando definido e `~/.codex` caso contrário,
incluindo autenticação, configuração, Plugins e threads nativos. O OpenClaw ignora sua ponte
de perfis de autenticação para o servidor de aplicativos. Turnos verificados do proprietário
podem usar `codex_threads` para listar (com um filtro opcional `search`), ler, criar uma
bifurcação, renomear, arquivar e desarquivar essas threads. Crie uma bifurcação de uma thread
antes de continuá-la no OpenClaw; processos independentes do Codex não coordenam gravações
simultâneas na mesma thread.

Essa opção `homeScope` se aplica a sessões comuns do harness. Um Chat criado por meio do
Codex Sessions usa sua conexão privada de supervisão, que preserva a configuração de
autenticação e provedor da conexão nativa para a ramificação canônica e retomadas futuras.

Em um Chat supervisionado bloqueado a um modelo, `codex_threads` não pode anexar uma
bifurcação diferente nem arquivar a thread nativa vinculada ao Chat. A listagem e a leitura
somente de metadados continuam disponíveis. Leituras brutas da transcrição exigem
`allowRawTranscripts`; quando essa opção está desabilitada, a pesquisa na lista também é
rejeitada, pois a pesquisa nativa pode corresponder a prévias da transcrição. Renomear,
desarquivar, criar uma bifurcação desvinculada e arquivar uma thread não relacionada que não
pertença a outro Chat do OpenClaw exigem `allowWriteControls`. Nenhuma das opções ignora uma
vinculação bloqueada.

O OpenClaw não reescreve `HOME` nas inicializações locais normais do servidor de aplicativos.
Subprocessos executados pelo Codex, como `openclaw`, `gh`, `git`, CLIs de nuvem e comandos
do shell, veem a home normal do processo e podem encontrar configurações e tokens da home
do usuário. O Codex também pode descobrir `$HOME/.agents/skills` e
`$HOME/.agents/plugins/marketplace.json`; essa descoberta em `.agents` é intencionalmente
compartilhada com a home do operador e é separada do estado isolado de `~/.codex`.

No escopo padrão do agente, os Plugins do OpenClaw e os snapshots de Skills do OpenClaw
ainda fluem pelo próprio registro de Plugins e carregador de Skills do OpenClaw; os ativos
pessoais de `~/.codex` do Codex não. Se você tiver Skills da CLI do Codex ou Plugins úteis
de uma home do Codex que devam se tornar parte de um agente isolado do OpenClaw, faça o
inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se uma implantação precisar de isolamento adicional do ambiente, adicione essas variáveis
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

`appServer.clearEnv` afeta somente o processo filho do servidor de aplicativos do Codex
iniciado. O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização da
inicialização local: `CODEX_HOME` continua apontando para o escopo selecionado do agente ou
usuário, e `HOME` continua herdado para que os subprocessos possam usar o estado normal da
home do usuário.

## Ferramentas dinâmicas

As ferramentas dinâmicas do Codex usam por padrão o carregamento `searchable`, disponibilizado
no namespace `openclaw` com `deferLoading: true`. O OpenClaw não disponibiliza ferramentas
dinâmicas que dupliquem operações de espaço de trabalho nativas do Codex ou a própria superfície
de pesquisa de ferramentas do Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

A maioria das ferramentas de integração restantes do OpenClaw, como mensagens, mídia, cron,
navegador, Nodes, Gateway, `heartbeat_respond` e `web_search`, está disponível pela pesquisa
de ferramentas do Codex nesse namespace. Isso mantém menor o contexto inicial do modelo. Um
pequeno conjunto de ferramentas permanece diretamente invocável independentemente de
`codexDynamicToolsLoading`, pois a pesquisa de ferramentas do Codex pode estar indisponível
ou resolver um universo somente de conectores: `agents_list`, `sessions_spawn` e
`sessions_yield`. As instruções do desenvolvedor ainda direcionam subagentes normais do Codex
para `spawn_agent` nativo em trabalhos de subagentes nativos do Codex, enquanto
`sessions_spawn` permanece disponível para delegação explícita do OpenClaw ou ACP.
Respostas da origem somente pela ferramenta de mensagens também permanecem diretas, pois
isso é um contrato de controle do turno.

As ferramentas marcadas como `catalogMode: "direct-only"`, incluindo a ferramenta `computer`
do OpenClaw, são agrupadas em `openclaw_direct`. O OpenClaw adiciona esse namespace à lista
`code_mode.direct_only_tool_namespaces` do Codex sem substituir as entradas fornecidas pelo
operador. Portanto, o Codex disponibiliza essas ferramentas como `DirectModelOnly` em threads
normais e exclusivas do modo de código, em vez de encaminhá-las por chamadas aninhadas
`tools.*` do Code Mode. Esse limite é necessário para resultados que contêm imagens: a
serialização aninhada do Code Mode transforma a saída de imagem em texto, o que descartaria
a captura de tela necessária para a próxima ação no computador.

Defina `codexDynamicToolsLoading: "direct"` somente ao se conectar a um servidor de aplicativos
do Codex personalizado que não consiga pesquisar ferramentas dinâmicas adiadas ou ao depurar
o payload completo de ferramentas.

## Tempos limite

As chamadas dinâmicas de ferramentas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`. Cada solicitação Codex `item/tool/call` usa o
primeiro tempo limite disponível nesta ordem:

- Um argumento `timeoutMs` positivo por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem um tempo limite configurado, o padrão de 120 segundos
  para geração de imagens.
- Para a ferramenta `image` de compreensão de mídia, `tools.media.image.timeoutSeconds`
  convertido em milissegundos, ou o padrão de mídia de 60 segundos. Para a
  compreensão de imagens, isso se aplica à própria solicitação e não é reduzido
  pelo trabalho de preparação anterior.
- Para a ferramenta `message`, um padrão fixo de 120 segundos.
- O padrão de 90 segundos para ferramentas dinâmicas.

Esse watchdog é o orçamento externo da chamada dinâmica `item/tool/call`. Os
tempos limite de solicitação específicos do provedor são executados dentro
dessa chamada e mantêm sua própria semântica de tempo limite. Os orçamentos de
ferramentas dinâmicas são limitados a 600000 ms. Quando o tempo limite é
atingido, o OpenClaw aborta o sinal da ferramenta quando houver suporte e
retorna ao Codex uma resposta de falha da ferramenta dinâmica, para que o turno
possa continuar em vez de deixar a sessão em `processing`.

Depois que o Codex aceita um turno e depois que o OpenClaw responde a uma
solicitação do servidor de aplicativo com escopo de turno, o harness espera
que o Codex avance no turno atual e, por fim, conclua o turno nativo com
`turn/completed`. Se o servidor de aplicativo ficar inativo por
`appServer.turnCompletionIdleTimeoutMs`, o OpenClaw tenta interromper o turno
do Codex, registra um tempo limite de diagnóstico e libera a via de sessão do
OpenClaw para que as mensagens de chat subsequentes não fiquem enfileiradas
atrás de um turno nativo obsoleto.

A maioria das notificações não terminais do mesmo turno desativa esse watchdog
curto, pois o Codex comprovou que o turno ainda está ativo. As transferências
para ferramentas usam um orçamento de inatividade pós-ferramenta mais longo:
depois que o OpenClaw retorna uma resposta `item/tool/call`, depois que itens
de ferramentas nativas, como `commandExecution`, são concluídos, depois de
conclusões brutas de `custom_tool_call_output` e depois de progresso bruto do
assistente pós-ferramenta, conclusões brutas de raciocínio ou progresso de
raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e,
caso contrário, adota cinco minutos como padrão. Esse mesmo orçamento
pós-ferramenta também estende o watchdog de progresso durante a janela
silenciosa de síntese antes que o Codex emita o próximo evento do turno atual.
Conclusões de raciocínio, conclusões de `agentMessage` de comentário e
progresso bruto de raciocínio ou do assistente antes da ferramenta podem ser
seguidos por uma resposta final automática; portanto, usam a proteção de
resposta pós-progresso em vez de liberar imediatamente a via de sessão.
Somente itens `agentMessage` concluídos finais/que não sejam de comentário e
conclusões brutas do assistente antes da ferramenta ativam a liberação por
saída do assistente: se o Codex ficar inativo sem `turn/completed`, o OpenClaw
tenta interromper o turno nativo e libera a via de sessão. Falhas do servidor
de aplicativo stdio que sejam seguras para repetição, incluindo tempos limite
de inatividade na conclusão do turno sem evidências do assistente, de
ferramentas, de itens ativos ou de efeitos colaterais, são repetidas uma vez
em uma nova tentativa do servidor de aplicativo. Tempos limite inseguros ainda
desativam o cliente travado do servidor de aplicativo e liberam a via de
sessão do OpenClaw. Eles também removem a associação obsoleta à thread nativa
em vez de serem repetidos automaticamente. Tempos limite do monitoramento de
conclusão exibem texto de tempo limite específico do Codex: os casos seguros
para repetição informam que a resposta pode estar incompleta, enquanto os
casos inseguros orientam o usuário a verificar o estado atual antes de tentar
novamente. Os diagnósticos públicos de tempo limite incluem campos
estruturais, como o último método de notificação do servidor de aplicativo, o
id/tipo/papel do item bruto de resposta do assistente, as contagens de
solicitações/itens ativos e o estado do monitoramento ativado. Quando a última
notificação é um item bruto de resposta do assistente, eles também incluem uma
prévia limitada do texto do assistente. Eles não incluem o conteúdo bruto do
prompt nem da ferramenta.

## Descoberta de modelos

Por padrão, o Plugin Codex solicita ao servidor de aplicativo os modelos
disponíveis. A disponibilidade dos modelos pertence ao servidor de aplicativo
do Codex; portanto, a lista pode mudar quando o OpenClaw atualiza a versão
incluída de `@openai/codex` ou quando uma implantação aponta
`appServer.command` para outro binário do Codex. A disponibilidade também pode
ser específica da conta. Use `/codex models` em um Gateway em execução para
ver o catálogo ativo desse harness e dessa conta.

Se a descoberta falhar ou atingir o tempo limite, o OpenClaw usará um catálogo
alternativo incluído:

| Id do modelo    | Nome de exibição | Níveis de raciocínio     |
| --------------- | ---------------- | ------------------------ |
| `gpt-5.5`       | gpt-5.5          | low, medium, high, xhigh |
| `gpt-5.4-mini`  | GPT-5.4-Mini     | low, medium, high, xhigh |

<Note>
O harness incluído atualmente é o `@openai/codex` `0.144.1`. Uma sondagem
`model/list` nesse servidor de aplicativo incluído retornou estas linhas
públicas do seletor:

| Id do modelo     | Modalidades de entrada | Níveis de raciocínio                 |
| ---------------- | ---------------------- | ------------------------------------ |
| `gpt-5.6-sol`    | texto, imagem          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`  | texto, imagem          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`   | texto, imagem          | low, medium, high, xhigh, max        |
| `gpt-5.5`        | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.4`        | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.4-mini`   | texto, imagem          | low, medium, high, xhigh             |
| `gpt-5.2`        | texto, imagem          | low, medium, high, xhigh             |

O catálogo do servidor de aplicativo pode informar `ultra`; atualmente, os
controles de raciocínio do OpenClaw disponibilizam níveis até `max`.

As linhas ativas do seletor são específicas da conta e podem mudar conforme a
conta, o catálogo do Codex ou a versão incluída; execute `/codex models` para
obter a lista atual em vez de depender de qualquer tabela referente a um
momento específico. Modelos ocultos também podem aparecer no catálogo do
servidor de aplicativo para fluxos internos ou especializados sem serem
opções normais do seletor de modelos.
</Note>

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

Desative a descoberta quando quiser evitar que a inicialização sonde o Codex e
usar apenas o catálogo alternativo:

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

## Arquivos de inicialização do espaço de trabalho

O próprio Codex processa `AGENTS.md` por meio da descoberta nativa de
documentação do projeto. O OpenClaw não grava arquivos sintéticos de
documentação de projeto do Codex nem depende dos nomes de arquivos
alternativos do Codex para arquivos de persona, pois as alternativas do Codex
só são aplicadas quando `AGENTS.md` está ausente.

Para manter a paridade do espaço de trabalho do OpenClaw, o harness do Codex
encaminha os outros arquivos de inicialização como instruções de
desenvolvedor, mas não de maneira idêntica:

- `TOOLS.md` é encaminhado como instruções de desenvolvedor **herdadas** do
  Codex; portanto, os subagentes nativos do Codex iniciados durante o turno
  também o recebem.
- `SOUL.md`, `IDENTITY.md` e `USER.md` são encaminhados como instruções de
  colaboração **com escopo de turno**. Os subagentes nativos do Codex não as
  herdam, o que impede que os turnos dos subagentes adotem a persona e o
  perfil de usuário do agente principal.
- A lista compacta de Skills carregadas do OpenClaw também é encaminhada como
  instruções de desenvolvedor para colaboração com escopo de turno; portanto,
  os subagentes nativos do Codex também não a herdam.
- O conteúdo de `HEARTBEAT.md` não é injetado; os turnos de Heartbeat recebem
  um indicador em modo de colaboração para ler o arquivo quando ele existe e
  não está vazio.
- O conteúdo de `MEMORY.md` do espaço de trabalho configurado do agente não é
  inserido na entrada do turno nativo do Codex quando as ferramentas de
  memória estão disponíveis para esse espaço de trabalho; quando ele existe,
  o harness adiciona um pequeno indicador de memória do espaço de trabalho às
  instruções de desenvolvedor para colaboração com escopo de turno, e o Codex
  deve usar `memory_search` ou `memory_get` quando a memória persistente for
  relevante. Se as ferramentas estiverem desativadas, a pesquisa de memória
  estiver indisponível ou o espaço de trabalho ativo for diferente do espaço
  de trabalho de memória do agente, `MEMORY.md` usará o caminho normal e
  limitado do contexto do turno.
- `BOOTSTRAP.md`, quando presente, é encaminhado como contexto de referência da
  entrada do turno do OpenClaw.

## Substituições de ambiente

As substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Em vez disso, use
`plugins.entries.codex.config.appServer.mode: "guardian"` ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A
configuração é preferível para implantações reproduzíveis porque mantém o
comportamento do Plugin no mesmo arquivo revisado que o restante da
configuração do harness do Codex.

## Relacionado

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Supervisão do Codex](/plugins/codex-supervision)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Uso de computador do Codex](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
