---
read_when:
    - Você precisa de todos os campos de configuração do harness do Codex
    - Você está alterando o comportamento de transporte, autenticação, descoberta ou tempo limite do servidor do aplicativo
    - Você está depurando a inicialização do harness do Codex, a descoberta de modelos ou o isolamento do ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de aplicativos para o harness do Codex
title: Referência do harness do Codex
x-i18n:
    generated_at: "2026-07-16T12:39:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência aborda a configuração detalhada do plugin oficial `codex`.
Para decisões de configuração e roteamento, comece pelo
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

| Campo                      | Padrão                  | Significado                                                                                                                                        |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Configurações de descoberta de modelos para o app-server do Codex `model/list`.                                                                                    |
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e tempo limite. O harness comum usa por padrão o estado com escopo de agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.                                                                    |
| `codexPlugins`             | desabilitado                 | Suporte nativo a plugins/aplicativos do Codex, incluindo acesso opcional a aplicativos de contas conectadas. Consulte [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado                 | Configuração do Codex Computer Use. Consulte [Codex Computer Use](/pt-BR/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | habilitado                  | Descoberta nativa de sessões do Codex para a barra lateral. Defina `enabled: false` para desabilitar a descoberta sem desabilitar o provedor ou o harness.           |
| `supervision`              | desabilitado                 | Política de transcrição de sessões nativas e controle de gravação voltada ao agente. Consulte [Supervisão do Codex](/pt-BR/plugins/codex-supervision).                          |

## Supervisão

Por padrão, a descoberta de sessões nativas lista as sessões não arquivadas do Codex no computador do Gateway
e nos nodes pareados que aceitaram participar. Desabilite somente esse catálogo com:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` controla separadamente as ferramentas voltadas ao agente:

| Campo                 | Padrão                 | Significado                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Habilita as ferramentas de supervisão do Codex voltadas ao agente. Isso não controla o catálogo de sessões autenticadas do operador.                                                                                                                            |
| `endpoints`           | endpoint local integrado | Destinos de endpoint avançados e de compatibilidade para o agente de supervisão do Codex mantido e para ferramentas MCP independentes. O catálogo humano e o fluxo de ramificações ignoram esses destinos e usam o App Server de supervisão resolvido a partir de `appServer`.       |
| `allowRawTranscripts` | `false`                 | Com a supervisão habilitada, permite leituras autônomas de transcrições pelo agente ou pelo MCP independente e campos de lista derivados de transcrições. As leituras somente de metadados de `codex_threads` permanecem disponíveis. Não controla a continuação autenticada da Control UI.     |
| `allowWriteControls`  | `false`                 | Com a supervisão habilitada, permite mutações autônomas de bifurcação, renomeação, arquivamento e desarquivamento de `codex_threads`, além de operações independentes de envio, direcionamento e interrupção do MCP. Não ignora outras verificações de vinculação, host, status ou confirmação. |

As entradas de endpoint aceitam estes campos:

| Campo          | Aplica-se a    | Significado                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | todos           | ID estável do endpoint.                                                   |
| `label`        | todos           | Rótulo de exibição opcional.                                               |
| `transport`    | todos           | `"stdio-proxy"` ou `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Comando opcional do App Server.                                          |
| `args`         | `stdio-proxy` | Argumentos opcionais do comando.                                           |
| `cwd`          | `stdio-proxy` | Diretório de trabalho opcional do processo filho.                             |
| `url`          | `websocket`   | URL obrigatória de WebSocket ou de socket local compatível.                     |
| `authTokenEnv` | `websocket`   | Variável de ambiente opcional cujo valor autentica o endpoint. |

A página **Sessões do Codex** usa o App Server de supervisão do plugin e mostra
somente sessões não arquivadas. Sem configurações explícitas de conexão em `appServer`,
essa conexão usa stdio gerenciado no diretório inicial do usuário. As linhas locais armazenadas ou ociosas podem criar
um Chat bloqueado ao modelo com histórico limitado do usuário e do assistente até o último
turno de origem persistido e concluído. Sua vinculação privada mantém a bifurcação do snapshot,
a ramificação canônica de origem `appServer`, a injeção do histórico e os turnos posteriores nessa
conexão. O primeiro início canônico usa o par retornado pela bifurcação. As retomadas
posteriores omitem as substituições de modelo e provedor do OpenClaw para que o Codex restaure o
par persistido da thread canônica; uma alteração nativa separada pode atualizar esse
par, mas o modelo externo e a cadeia de fallback nunca o substituem. As linhas armazenadas e ociosas
podem ser arquivadas após a confirmação de que não há outro executor, a menos que outra vinculação ativa
do OpenClaw seja proprietária do destino exato ou de um de seus descendentes gerados
não arquivados. O OpenClaw segue a paginação de descendentes do Codex e falha de forma fechada em caso de
erros de enumeração, ciclos ou esgotamento do limite de segurança. A confirmação ainda
abrange clientes nativos desconhecidos e a condição de corrida entre status e arquivamento. Um Chat
supervisionado e bloqueado ao modelo não pode ser excluído enquanto protege a vinculação nativa.
Origens ativas não podem criar uma ramificação nem ser arquivadas, mas um Chat supervisionado
existente ainda pode ser aberto. Todas as linhas de nodes pareados permanecem somente leitura; o transporte
do node ainda não fornece o ciclo de vida de streaming necessário ao harness.

`appServer.homeScope: "user"` por si só altera qual diretório inicial do Codex um processo
gerenciado do harness usa; isso não publica o catálogo da frota. Habilitar a supervisão não
altera o padrão do harness. Em vez disso, a conexão de supervisão separada
usa por padrão o stdio gerenciado no diretório inicial do usuário quando não existem configurações explícitas
de conexão em `appServer`. As configurações explícitas são respeitadas nessa conexão.
As vinculações supervisionadas pendentes e confirmadas mantêm essa conexão em todos os turnos;
a supervisão desabilitada ou um desvio de conexão/ciclo de vida falha de forma fechada, em vez de
recorrer ao harness do diretório inicial do agente. A conexão padrão compartilha as sessões armazenadas
com clientes nativos do Codex, mas não o estado de atividade local de seus processos.

As configurações legadas de `plugins.entries.codex-supervisor` foram descontinuadas. Execute
`openclaw doctor --fix` para migrar a entrada antiga, as definições de endpoint, os sinalizadores
de política e as referências de permissão/bloqueio de plugins para este bloco. Em caso de conflito, os valores
canônicos explícitos de `codex.config.supervision` prevalecem.

## Transporte do app-server

Para turnos comuns do harness, o OpenClaw inicia o binário gerenciado do Codex fornecido
com o plugin oficial (atualmente `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao plugin oficial `codex`, em vez de
qualquer CLI separada do Codex que esteja instalada localmente. Defina
`appServer.command` somente quando quiser intencionalmente um executável diferente.
Turnos gerenciados comuns com o diretório inicial isolado padrão do agente priorizam esse
pacote fixado mesmo quando um pacote de aplicativo desktop do macOS está instalado. Quando
o [Computer Use](/pt-BR/plugins/codex-computer-use) está habilitado, ou quando `homeScope` é
`"user"` e consegue carregar o estado nativo do Computer Use, a inicialização gerenciada passa a priorizar
o binário do aplicativo desktop que possui as permissões necessárias do macOS. A mesma
regra de priorização do desktop se aplica quando a configuração efetiva do Codex de um diretório inicial isolado
do agente habilita o Computer Use nativo. Se nenhum pacote de aplicativo desktop estiver instalado, o OpenClaw
recorre ao binário do pacote fixado.

A transferência do executável e o isolamento da configuração nativa coordenam clientes dentro de um
único processo do Gateway em execução. Reinicie o Gateway depois que outro processo alterar a
configuração de plugins nativos do Codex.

A supervisão resolve uma conexão separada. Sem configurações explícitas de
conexão em `appServer`, ela usa stdio gerenciado com `homeScope: "user"`;
o harness comum permanece com stdio gerenciado usando `homeScope: "agent"`. As configurações explícitas
de conexão são respeitadas por ambos os caminhos. Defina `homeScope: "user"`
explicitamente quando o harness comum precisar compartilhar `$CODEX_HOME` (ou `~/.codex`)
com clientes nativos. Uma vinculação supervisionada privada usa a conexão de supervisão
independentemente do padrão do harness comum. Processos independentes do App Server
mantêm estados ativos e de aprovação separados.

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

Campos de `appServer`:

| Campo                                         | Padrão                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"unix"` explícito se conecta ao soquete de controle local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado comum do harness por agente do OpenClaw. `"user"` é uma opção de adesão explícita que compartilha o `$CODEX_HOME` ou `~/.codex` nativo, usa autenticação nativa e habilita o gerenciamento de threads somente pelo proprietário. O escopo do usuário aceita transporte stdio local ou Unix. Para a conexão de supervisão separada, um valor não definido é resolvido como `"user"` para stdio ou Unix e `"agent"` para WebSocket.     |
| `command`                                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | não definido                                                  | URL do App Server WebSocket ou URL `unix://`. Um caminho Unix explicitamente vazio seleciona o soquete de controle canônico no diretório inicial do usuário.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | não definido                                                  | Token bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket adicionais. Os valores dos cabeçalhos aceitam strings literais ou valores SecretInput, por exemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes de variáveis de ambiente adicionais removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | não definido                                                  | Raiz remota do espaço de trabalho do app-server do Codex. Quando definida, o OpenClaw infere a raiz do espaço de trabalho local a partir do espaço de trabalho resolvido do OpenClaw, preserva o sufixo do cwd atual sob essa raiz remota e envia somente o cwd final do app-server ao Codex. Se o cwd estiver fora da raiz resolvida do espaço de trabalho do OpenClaw, o OpenClaw falhará de forma fechada em vez de enviar um caminho local do Gateway ao app-server remoto. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instala o subprocesso `PreToolUse` do Codex usado somente para a detecção de loops do OpenClaw e seu marcador explícito de ausência de política. Defina `false` para reduzir a multiplicação de processos por ferramenta. Os hooks de Plugin anteriores à ferramenta e a política de ferramentas confiáveis ainda instalam o relay necessário.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela de inatividade depois que o Codex aceita um turno ou após uma solicitação do app-server com escopo de turno, enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Proteção de inatividade de conclusão e progresso usada após uma transferência para ferramenta, a conclusão de uma ferramenta nativa, o progresso bruto do assistente após a ferramenta, a conclusão do raciocínio bruto ou o progresso do raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese após a ferramenta possa legitimamente permanecer inativa por mais tempo que o orçamento de liberação final do assistente.                                |
| `mode`                                        | `"yolo"` salvo quando os requisitos locais do Codex não permitem YOLO | Predefinição para execução YOLO ou revisada pelo guardião.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação permitida pelo guardião       | Política de aprovação nativa do Codex enviada ao iniciar e retomar a thread e a cada turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox permitido pelo guardião  | Modo de sandbox nativo do Codex enviado ao iniciar e retomar a thread. Os sandboxes ativos do OpenClaw restringem os turnos `danger-full-access` ao `workspace-write` do Codex; o sinalizador de rede do turno segue a saída de rede do sandbox do OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou um revisor permitido pelo guardião               | Use `"auto_review"` para permitir que o Codex revise solicitações de aprovação nativas quando permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | diretório do processo atual                              | Espaço de trabalho usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | não definido                                                  | Nível de serviço opcional do app-server do Codex. `"priority"` habilita o roteamento em modo rápido, `"flex"` solicita processamento flexível e `null` remove a substituição. O valor legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                               | Adere à rede do perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opção de adesão de prévia que registra um ambiente do Codex respaldado pelo sandbox do OpenClaw no app-server compatível do Codex, para que a execução nativa do Codex possa ocorrer dentro do sandbox ativo do OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o
OpenClaw gera um nome de perfil `openclaw-network-<fingerprint>` resistente a colisões com base
no corpo do perfil; use `profileName` somente quando for necessário um nome
local estável.

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

Se o runtime normal do servidor de aplicativos fosse `danger-full-access`,
habilitar `networkProxy` usaria, em vez disso, acesso ao sistema de arquivos
no estilo de workspace para o perfil de permissão gerado. A aplicação de
políticas de rede gerenciada pelo Codex é uma rede em sandbox, portanto um
perfil de acesso total não protegeria o tráfego de saída.

O Plugin bloqueia handshakes de servidor de aplicativos mais antigos ou sem
versão: o servidor de aplicativos do Codex deve informar a versão estável
`0.143.0` ou mais recente.

O OpenClaw trata URLs WebSocket de servidor de aplicativos que não sejam de
loopback como remotas e exige autenticação WebSocket com identidade por meio de
`appServer.authToken` ou de um cabeçalho `Authorization`.
`appServer.authToken` e cada valor de `appServer.headers.*` podem ser um SecretInput;
o runtime de segredos resolve SecretRefs e a forma abreviada de variáveis de
ambiente antes que o OpenClaw crie as opções de inicialização do servidor de
aplicativos, e SecretRefs estruturados não resolvidos causam falha antes que
qualquer token ou cabeçalho seja enviado. Quando Plugins nativos do Codex estão
configurados, o OpenClaw usa o plano de controle de Plugins do servidor de
aplicativos conectado para instalar ou atualizar esses Plugins e, em seguida,
atualiza o inventário de aplicativos para que os aplicativos pertencentes aos
Plugins fiquem visíveis para a thread do Codex. `app/list` continua
sendo a fonte autoritativa de inventário e metadados, mas a política do OpenClaw
decide se `thread/start` envia `config.apps[appId].enabled = true` para um aplicativo
acessível listado, mesmo que o Codex o marque atualmente como desabilitado. IDs
de aplicativos desconhecidos ou ausentes continuam falhando de forma fechada;
esse caminho apenas ativa Plugins do marketplace por meio de
`plugin/install` e atualiza o inventário. Conecte o OpenClaw somente a
servidores de aplicativos remotos confiáveis para aceitar instalações de
Plugins gerenciadas pelo OpenClaw e atualizações do inventário de aplicativos.

## Modos de aprovação e sandbox

Por padrão, sessões locais do servidor de aplicativos por stdio usam o modo
YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura de operador local confiável permite que turnos
e heartbeats autônomos do OpenClaw avancem sem prompts de aprovação nativos que
ninguém esteja disponível para responder.

Se o arquivo local de requisitos do sistema do Codex não permitir valores
implícitos de aprovação YOLO, revisor ou sandbox, o OpenClaw tratará o padrão
implícito como guardian e selecionará permissões guardian permitidas.
`tools.exec.mode: "auto"` também força aprovações do Codex revisadas pelo guardian e
não preserva substituições legadas inseguras de `approvalPolicy: "never"` ou
`sandbox: "danger-full-access"`; defina `tools.exec.mode: "full"` para adotar intencionalmente uma
postura sem aprovação. Entradas `[[remote_sandbox_config]]` correspondentes ao nome do
host no mesmo arquivo de requisitos são respeitadas na decisão do padrão de
sandbox.

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
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando esses valores são permitidos.
Campos individuais de política substituem `mode`. O valor de
revisor mais antigo `guardian_subagent` ainda é aceito como alias de
compatibilidade, mas novas configurações devem usar `auto_review`.

Quando um sandbox do OpenClaw está ativo, o processo local do servidor de
aplicativos do Codex ainda é executado no host do Gateway. Portanto, o OpenClaw
desabilita o Code Mode nativo do Codex, servidores MCP do usuário e a execução
de Plugins baseada em aplicativos para esse turno, em vez de tratar o sandbox
do lado do host do Codex como equivalente ao backend de sandbox do OpenClaw. O
acesso ao shell é disponibilizado por meio de ferramentas dinâmicas apoiadas
pelo sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`, quando
as ferramentas normais de execução/processo estão disponíveis.

<Note>
Em hosts de sandbox do OpenClaw baseados em Docker (`agents.defaults.sandbox.mode` definido
como um backend Docker), `openclaw doctor` verifica se o host permite os
namespaces de usuário sem privilégios (e, quando a saída de rede do sandbox
Docker está desabilitada, os namespaces de rede) necessários ao
`bwrap` aninhado do Codex para a execução de shell
`workspace-write` dentro do contêiner de sandbox. Uma falha na verificação
geralmente aparece como `bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` em hosts Ubuntu/AppArmor. Corrija a política de namespaces
do host indicada para o usuário do serviço OpenClaw e reinicie o Gateway;
prefira um perfil AppArmor com escopo limitado ao processo do serviço em vez do
fallback `kernel.apparmor_restrict_unprivileged_userns=0` para todo o host e não conceda privilégios mais
amplos ao contêiner Docker apenas para atender ao `bwrap` aninhado.
</Note>

## Execução nativa em sandbox

O padrão estável é falhar de forma fechada: o sandbox ativo do OpenClaw
desabilita superfícies de execução nativa do Codex que, de outra forma, seriam
executadas no host do servidor de aplicativos do Codex. Use
`appServer.experimental.sandboxExecServer: true` somente quando quiser testar o suporte a ambientes remotos
do Codex com o backend de sandbox do OpenClaw. Esse caminho de prévia funciona
com todas as versões compatíveis do servidor de aplicativos do Codex.

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

Quando a flag está ativada e a sessão atual do OpenClaw está em sandbox, o
OpenClaw inicia um servidor de execução de loopback local apoiado pelo sandbox
ativo, registra-o no servidor de aplicativos do Codex e inicia a thread e o
turno do Codex com esse ambiente pertencente ao OpenClaw. Se o servidor de
aplicativos não puder registrar o ambiente, a execução falhará de forma fechada
em vez de recorrer silenciosamente à execução no host.

Esse caminho de prévia é somente local. Um servidor de aplicativos WebSocket
remoto não pode acessar o servidor de execução de loopback, a menos que esteja
sendo executado no mesmo host, portanto o OpenClaw rejeita essa combinação.

## Isolamento de autenticação e ambiente

No diretório inicial padrão por agente, a autenticação é selecionada nesta
ordem:

1. Um perfil explícito de autenticação do Codex no OpenClaw para o agente.
2. A conta existente do servidor de aplicativos no diretório inicial do Codex desse agente.
3. Somente para inicializações locais do servidor de aplicativos por stdio, `CODEX_API_KEY` e depois
   `OPENAI_API_KEY`, quando nenhuma conta do servidor de aplicativos estiver presente e a autenticação da OpenAI
   ainda for necessária.

Quando o OpenClaw detecta um perfil de autenticação do Codex no estilo de
assinatura do ChatGPT (tipo de credencial OAuth ou token), ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex iniciado.
Isso mantém as chaves de API no nível do Gateway disponíveis para embeddings
ou modelos diretos da OpenAI sem fazer com que turnos nativos do servidor de
aplicativos do Codex sejam cobrados pela API acidentalmente.

Perfis explícitos de chave de API do Codex e o fallback de chave por variável
de ambiente de stdio local usam o login do servidor de aplicativos em vez de
herdar o ambiente do processo filho. Conexões WebSocket do servidor de
aplicativos não recebem o fallback de chave de API do ambiente do Gateway; use
um perfil de autenticação explícito ou a própria conta do servidor de
aplicativos remoto.

Por padrão, inicializações do servidor de aplicativos por stdio herdam o
ambiente de processo do OpenClaw. O OpenClaw controla a ponte de conta do
servidor de aplicativos do Codex e define `CODEX_HOME` como um diretório
por agente dentro do estado desse agente no OpenClaw. Isso mantém a
configuração, as contas, o cache/dados de Plugins e o estado das threads do
Codex limitados ao agente do OpenClaw, em vez de vazarem do diretório inicial
`~/.codex` pessoal do operador.

Defina `appServer.homeScope: "user"` para compartilhar o estado nativo do Codex com o
Codex Desktop e a CLI. Esse modo de diretório inicial do usuário local oferece
suporte a stdio gerenciado e transporte Unix explícito. Ele usa
`$CODEX_HOME` quando definido e `~/.codex` caso contrário,
incluindo autenticação nativa, configuração, Plugins e threads. O OpenClaw
ignora sua ponte de perfil de autenticação para o servidor de aplicativos.
Turnos verificados do proprietário podem usar `codex_threads` para listar
(com um filtro `search` opcional), ler, bifurcar, renomear, arquivar
e desarquivar essas threads. Bifurque uma thread antes de continuá-la no
OpenClaw; processos independentes do Codex não coordenam gravações simultâneas
na mesma thread.

Essa adesão por `homeScope` se aplica a sessões comuns do harness. Um
Chat criado por meio de Codex Sessions usa sua conexão de supervisão privada,
que preserva a autenticação e a configuração de provedor da conexão nativa para
a ramificação canônica e retomadas futuras.

Em um Chat supervisionado bloqueado a um modelo, `codex_threads` não pode
anexar uma bifurcação diferente nem arquivar a thread nativa vinculada ao Chat.
A listagem e a leitura somente de metadados permanecem disponíveis. Leituras da
transcrição bruta exigem `allowRawTranscripts`; quando essa opção está
desabilitada, a pesquisa na lista também é rejeitada porque a pesquisa nativa
pode corresponder a prévias da transcrição. Renomear, desarquivar, criar uma
bifurcação separada e arquivar uma thread não relacionada que não pertença a
outro Chat do OpenClaw exigem `allowWriteControls`. Nenhuma das opções ignora uma
vinculação bloqueada.

O OpenClaw não reescreve `HOME` em inicializações locais normais do
servidor de aplicativos. Subprocessos executados pelo Codex, como
`openclaw`, `gh`, `git`, CLIs de nuvem e
comandos de shell, veem o diretório inicial normal do processo e podem
encontrar configurações e tokens no diretório inicial do usuário. O Codex
também pode descobrir `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`; essa descoberta
de `.agents` é compartilhada intencionalmente com o diretório inicial
do operador e é separada do estado isolado de `~/.codex`.

No escopo padrão do agente, os Plugins do OpenClaw e snapshots de Skills do
OpenClaw ainda passam pelo registro de Plugins e pelo carregador de Skills do
próprio OpenClaw; ativos pessoais `~/.codex` do Codex não. Se houver
Skills ou Plugins úteis da CLI do Codex em um diretório inicial do Codex que
devam fazer parte de um agente isolado do OpenClaw, inventarie-os explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se uma implantação precisar de isolamento adicional do ambiente, adicione
essas variáveis a `appServer.clearEnv`:

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

`appServer.clearEnv` afeta somente o processo filho iniciado do servidor de
aplicativos do Codex. O OpenClaw remove `CODEX_HOME` e
`HOME` dessa lista durante a normalização da inicialização local:
`CODEX_HOME` continua apontando para o escopo selecionado do agente ou
usuário, e `HOME` continua sendo herdado para que subprocessos
possam usar o estado normal do diretório inicial do usuário.

## Ferramentas dinâmicas

Por padrão, as ferramentas dinâmicas do Codex usam o carregamento
`searchable`, disponibilizado no namespace `openclaw` com
`deferLoading: true`. Normalmente, o OpenClaw não disponibiliza ferramentas
dinâmicas que dupliquem operações nativas de workspace do Codex ou a própria
superfície de pesquisa de ferramentas do Codex:

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

Quando uma lista finita de permissões do runtime desabilita o Code Mode nativo,
o OpenClaw envia uma seleção vazia do ambiente de execução. Nesse caso direto
e sem sandbox, o OpenClaw mantém suas ferramentas `exec` e
`process` filtradas por política como fallback de shell. As listas de
permissões do runtime e `codexDynamicToolsExclude` ainda se aplicam.

A maioria das ferramentas de integração restantes do OpenClaw, como mensagens, mídia, cron,
navegador, nodes, gateway, `heartbeat_respond` e `web_search`, está disponível
por meio da pesquisa de ferramentas do Codex nesse namespace. Isso mantém menor o contexto
inicial do modelo. Um pequeno conjunto de ferramentas permanece diretamente invocável independentemente de
`codexDynamicToolsLoading`, porque a pesquisa de ferramentas do Codex pode estar indisponível ou
resolver um universo somente de conectores: `agents_list`, `sessions_spawn` e
`sessions_yield`. As instruções do desenvolvedor ainda direcionam os subagentes normais do Codex
para `spawn_agent` nativo em trabalhos de subagentes nativos do Codex, enquanto
`sessions_spawn` permanece disponível para delegação explícita do OpenClaw ou ACP.
As respostas de origem que usam somente a ferramenta de mensagens também permanecem diretas, pois esse é um
contrato de controle de turno.

As ferramentas marcadas como `catalogMode: "direct-only"`, incluindo a ferramenta
`computer` do OpenClaw, são agrupadas em `openclaw_direct`. O OpenClaw adiciona esse namespace à
lista `code_mode.direct_only_tool_namespaces` do Codex sem substituir
as entradas fornecidas pelo operador. Portanto, o Codex expõe essas ferramentas como
`DirectModelOnly` em threads normais e exclusivas do modo de código, em vez de encaminhá-las
por meio de chamadas aninhadas de `tools.*` do Modo de Código. Esse limite é necessário para
resultados que contêm imagens: a serialização aninhada do Modo de Código achata a saída de imagem em
texto, o que descartaria a captura de tela necessária para a próxima ação no computador.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar-se a um
servidor de aplicativo personalizado do Codex que não consiga pesquisar ferramentas dinâmicas adiadas ou ao depurar
o payload completo das ferramentas.

## Tempos limite

As chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`. Cada solicitação `item/tool/call` do Codex usa o
primeiro tempo limite disponível nesta ordem:

- Um argumento `timeoutMs` positivo por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sem um tempo limite configurado, o padrão de 120 segundos
  para geração de imagens.
- Para a ferramenta de compreensão de mídia `image`, `tools.media.image.timeoutSeconds`
  convertido em milissegundos ou o padrão de mídia de 60 segundos. Para compreensão
  de imagens, isso se aplica à própria solicitação e não é reduzido pelo
  trabalho de preparação anterior.
- Para a ferramenta `message`, um padrão fixo de 120 segundos.
- O padrão de 90 segundos para ferramentas dinâmicas.

Esse watchdog é o orçamento externo do `item/tool/call` dinâmico. Tempos limite de
solicitação específicos do provedor são executados dentro dessa chamada e mantêm sua própria semântica de tempo limite.
Os orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Quando o tempo se esgota, o OpenClaw interrompe o
sinal da ferramenta quando houver suporte e retorna ao Codex uma resposta de falha da ferramenta dinâmica
para que o turno possa continuar, em vez de deixar a sessão em
`processing`.

Depois que o Codex aceita um turno e depois que o OpenClaw responde a uma solicitação
do servidor de aplicativo com escopo de turno, o harness espera que o Codex avance no turno atual
e, por fim, conclua o turno nativo com `turn/completed`. Se o
servidor de aplicativo ficar inativo por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw
tenta interromper o turno do Codex, registra um tempo limite de diagnóstico e
libera a faixa de sessão do OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas
atrás de um turno nativo obsoleto.

A maioria das notificações não terminais do mesmo turno desativa esse watchdog curto
porque o Codex comprovou que o turno ainda está ativo. As transferências de ferramentas usam um orçamento de
inatividade pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta `item/tool/call`,
depois que itens de ferramentas nativas como `commandExecution` são concluídos, depois de conclusões
brutas de `custom_tool_call_output` e depois do progresso bruto do assistente
pós-ferramenta, conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e
usa cinco minutos como padrão caso contrário. Esse mesmo orçamento pós-ferramenta também estende
o watchdog de progresso durante a janela silenciosa de síntese antes que o Codex emita o
próximo evento do turno atual. Conclusões de raciocínio, conclusões de `agentMessage`
de comentários e progresso bruto de raciocínio ou do assistente antes da ferramenta podem ser seguidos
por uma resposta final automática, portanto usam a proteção de resposta pós-progresso
em vez de liberar imediatamente a faixa de sessão. Somente itens `agentMessage` concluídos
finais/sem comentários e conclusões brutas do assistente antes da ferramenta ativam a
liberação por saída do assistente: se o Codex ficar inativo sem `turn/completed`,
o OpenClaw tenta interromper o turno nativo e libera a faixa de
sessão. Falhas reproduzíveis com segurança do servidor de aplicativo stdio, incluindo tempos limite de inatividade
na conclusão do turno sem evidências do assistente, de ferramentas, de itens ativos ou de efeitos colaterais, são
tentadas novamente uma vez em uma nova tentativa do servidor de aplicativo. Tempos limite inseguros ainda desativam o
cliente travado do servidor de aplicativo e liberam a faixa de sessão do OpenClaw. Eles também
limpam a associação obsoleta da thread nativa, em vez de serem reproduzidos
automaticamente. Tempos limite de monitoramento de conclusão exibem texto de tempo limite específico do Codex:
casos reproduzíveis com segurança informam que a resposta pode estar incompleta, enquanto casos inseguros orientam
o usuário a verificar o estado atual antes de tentar novamente. Os diagnósticos públicos de tempo limite
incluem campos estruturais, como o último método de notificação do servidor de aplicativo,
ID/tipo/função do item de resposta bruta do assistente, contagens de solicitações/itens ativos e
estado de monitoramento ativado. Quando a última notificação é um item de resposta bruta do
assistente, eles também incluem uma prévia limitada do texto do assistente. Eles não
incluem conteúdo bruto de prompts ou ferramentas.

## Descoberta de modelos

Por padrão, o Plugin do Codex solicita ao servidor de aplicativo os modelos disponíveis. A
disponibilidade dos modelos pertence ao servidor de aplicativo do Codex, portanto a lista pode mudar quando
o OpenClaw atualiza a versão integrada de `@openai/codex` ou quando uma implantação
direciona `appServer.command` para um binário diferente do Codex. A disponibilidade também pode
ter escopo de conta. Use `/codex models` em um gateway em execução para ver o catálogo
atual desse harness e dessa conta.

Se a descoberta falhar ou exceder o tempo limite, o OpenClaw usará um catálogo alternativo integrado:

| ID do modelo       | Nome de exibição | Níveis de raciocínio     |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | baixo, médio, alto, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | baixo, médio, alto, xhigh |

<Note>
O harness integrado atual é `@openai/codex` `0.144.3`. Uma sondagem `model/list`
nesse servidor de aplicativo integrado retornou estas linhas públicas do seletor:

| ID do modelo        | Modalidades de entrada | Níveis de raciocínio                  |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | texto, imagem      | baixo, médio, alto, xhigh, max, ultra |
| `gpt-5.6-terra` | texto, imagem      | baixo, médio, alto, xhigh, max, ultra |
| `gpt-5.6-luna`  | texto, imagem      | baixo, médio, alto, xhigh, max        |
| `gpt-5.5`       | texto, imagem      | baixo, médio, alto, xhigh             |
| `gpt-5.4`       | texto, imagem      | baixo, médio, alto, xhigh             |
| `gpt-5.4-mini`  | texto, imagem      | baixo, médio, alto, xhigh             |
| `gpt-5.2`       | texto, imagem      | baixo, médio, alto, xhigh             |

O catálogo do servidor de aplicativo pode informar `ultra`; no momento, os controles de raciocínio do OpenClaw
expõem níveis até `max`.

As linhas atuais do seletor têm escopo de conta e podem mudar conforme a conta, o catálogo do Codex
ou a versão integrada; execute `/codex models` para obter a lista atual em vez
de depender de qualquer tabela de um momento específico. Modelos ocultos também podem aparecer no
catálogo do servidor de aplicativo para fluxos internos ou especializados sem serem opções normais
do seletor de modelos.
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

Desative a descoberta quando quiser evitar que a inicialização sonde o Codex e usar somente
o catálogo alternativo:

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

O Codex processa `AGENTS.md` por conta própria por meio da descoberta nativa de documentos do projeto.
O OpenClaw não grava arquivos sintéticos de documentos de projeto do Codex nem depende de
nomes de arquivos alternativos do Codex para arquivos de persona, pois os nomes alternativos do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para manter a paridade do workspace do OpenClaw, o harness do Codex encaminha os outros
arquivos de bootstrap como instruções do desenvolvedor, mas não de forma idêntica:

- `TOOLS.md` é encaminhado como instruções do desenvolvedor **herdadas** do Codex, portanto
  subagentes nativos do Codex iniciados durante o turno também o recebem.
- `SOUL.md`, `IDENTITY.md` e `USER.md` são encaminhados como instruções
  de colaboração **com escopo de turno**. Os subagentes nativos do Codex não as herdam,
  o que evita que os turnos dos subagentes recebam a persona e
  o perfil de usuário do agente pai.
- A lista compacta de Skills carregadas do OpenClaw também é encaminhada como instruções do desenvolvedor
  de colaboração com escopo de turno, portanto os subagentes nativos do Codex também não
  a herdam.
- O conteúdo de `HEARTBEAT.md` não é injetado; os turnos de Heartbeat recebem um
  indicador no modo de colaboração para ler o arquivo quando ele existe e não está
  vazio.
- O conteúdo de `MEMORY.md` do workspace configurado do agente não é colado na
  entrada de turno nativa do Codex quando as ferramentas de memória estão disponíveis para esse
  workspace; quando ele existe, o harness adiciona um pequeno indicador de memória do workspace
  às instruções do desenvolvedor de colaboração com escopo de turno, e o Codex
  deve usar `memory_search` ou `memory_get` quando a memória persistente for relevante.
  Se as ferramentas estiverem desativadas, a pesquisa de memória estiver indisponível ou o workspace
  ativo for diferente do workspace de memória do agente, `MEMORY.md` usará o
  caminho normal limitado de contexto do turno.
- `BOOTSTRAP.md`, quando presente, é encaminhado como contexto de referência da entrada de turno
  do OpenClaw.

## Substituições de ambiente

As substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em seu lugar ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferível para implantações reproduzíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Supervisão do Codex](/pt-BR/plugins/codex-supervision)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Uso do computador pelo Codex](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
