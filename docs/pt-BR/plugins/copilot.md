---
read_when:
    - Você quer usar a estrutura do SDK do GitHub Copilot para um agente
    - Você precisa de exemplos de configuração para o runtime `copilot`
    - Você está conectando um agente ao Copilot por assinatura (github / openclaw / copilot) e quer que ele seja executado por meio da CLI do Copilot
summary: Execute turnos do agente incorporado do OpenClaw por meio do harness externo do GitHub Copilot SDK
title: Harness do SDK do Copilot
x-i18n:
    generated_at: "2026-07-16T12:40:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

O Plugin externo `@openclaw/copilot` executa turnos de agente do Copilot por assinatura incorporados
por meio da CLI do GitHub Copilot (`@github/copilot-sdk`), em vez do
harness integrado do OpenClaw. A sessão da CLI do Copilot controla o loop de
agente de baixo nível: execução nativa de ferramentas, Compaction nativa (`infiniteSessions`) e
estado da thread gerenciado pela CLI em `copilotHome`. O OpenClaw continua controlando os canais de
chat, arquivos de sessão, seleção de modelo, ferramentas dinâmicas (intermediadas), aprovações,
entrega de mídia, o espelho visível da transcrição, perguntas paralelas de `/btw` (consulte
[Perguntas paralelas (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Para conhecer a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes).

## Requisitos

- OpenClaw com o Plugin `@openclaw/copilot` instalado.
- Se sua configuração usa `plugins.allow`, inclua `copilot` (o id de manifesto que o
  Plugin declara). Uma entrada da lista de permissões para o nome do pacote npm
  `@openclaw/copilot` não corresponderá e deixará o Plugin bloqueado, mesmo com
  `agentRuntime.id: "copilot"` definido.
- Uma assinatura do GitHub Copilot capaz de operar a CLI do Copilot ou uma
  variável de ambiente `gitHubToken` / entrada de perfil de autenticação para execuções headless ou de Cron.
- Um diretório `copilotHome` gravável. O padrão é `<agentDir>/copilot` quando
  o OpenClaw fornece um diretório de agente; caso contrário,
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` executa o [contrato do doctor](#doctor) do Plugin para
propriedade do estado da sessão e futuras migrações de configuração. Ele não verifica o
ambiente da CLI do Copilot.

## Instalação

O runtime do Copilot é fornecido como um Plugin externo para que o pacote principal `openclaw`
não inclua `@github/copilot-sdk` nem seu binário da CLI `@github/copilot-<platform>-<arch>`
específico da plataforma (cerca de 260 MB juntos).
Instale-o somente para agentes que optarem por esse runtime:

```bash
openclaw plugins install @openclaw/copilot
```

O assistente de configuração instala o Plugin automaticamente na primeira vez que você seleciona
um modelo `github-copilot/*` **e** sua configuração encaminha esse modelo (ou seu
provedor) para o runtime do Copilot por meio de `agentRuntime: { id: "copilot" }`; consulte
[Início rápido](#quickstart). Sem essa opção, o OpenClaw usa seu provedor
integrado do GitHub Copilot e nunca instala esse Plugin.

O runtime resolve o SDK nesta ordem:

1. `import("@github/copilot-sdk")` do pacote `@openclaw/copilot`
   instalado.
2. O diretório alternativo `~/.openclaw/npm-runtime/copilot/` (destino legado de instalação
   sob demanda).

A ausência do SDK gera um erro com o código `COPILOT_SDK_MISSING` e o
comando de reinstalação acima.

## Início rápido

Fixe um modelo (ou um provedor) no harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Defina `agentRuntime.id` em uma única entrada de modelo para encaminhar somente esse modelo pelo
harness ou em um provedor para encaminhar todos os modelos desse provedor.

`github-copilot/auto` é o ponto de partida portátil. Os modelos nomeados do Copilot
dependem das políticas da conta e da organização; confirme se a CLI do Copilot autenticada
realmente expõe um modelo antes de fixá-lo.

## Provedores compatíveis

O harness é compatível com o provedor canônico `github-copilot` (controlado por
`extensions/github-copilot`), além de entradas personalizadas `models.providers` quando o
modelo tem um `baseUrl` não vazio e um destes formatos de `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completions compatíveis com OpenAI)
- `openai-completions`
- `openai-responses`

Os ids de provedores nativos (`openai`, `anthropic`, `google`, `ollama`) continuam sob controle de
seus runtimes nativos. Em vez disso, use um id de provedor personalizado distinto para encaminhar um endpoint
por meio do BYOK do Copilot.

Os endpoints BYOK do Copilot devem ser URLs HTTPS públicas. O harness fornece ao
SDK do Copilot um proxy de loopback por tentativa e, em seguida, encaminha o tráfego do provedor
pelo caminho de fetch protegido do OpenClaw, para que a fixação de DNS e a política de SSRF continuem
sob controle do OpenClaw. Use o runtime nativo do OpenClaw para servidores de modelos locais do Ollama, LM
Studio ou da LAN.

## BYOK

O BYOK do Copilot usa o contrato de provedor personalizado no nível da sessão do SDK. O OpenClaw
transmite o endpoint resolvido do modelo, a chave de API, o modo de token bearer, os cabeçalhos, o id do
modelo e os limites de contexto/saída; a lógica de transporte do provedor permanece no SDK, não
no núcleo.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

As sessões BYOK são identificadas separadamente das sessões por assinatura e de outros
endpoints ou credenciais BYOK. A rotação da chave, dos cabeçalhos, do modelo ou do endpoint
inicia uma nova sessão do SDK do Copilot, em vez de retomar um estado incompatível.

## Autenticação

Precedência aplicada por agente durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` explícito** na entrada da tentativa — usa o
   usuário conectado à CLI do Copilot no `copilotHome` do agente.
2. **`gitHubToken` explícito** na entrada da tentativa (requer `profileId` +
   `profileVersion`). Para invocações diretas da CLI e testes que precisam
   ignorar a resolução do perfil de autenticação.
3. **`resolvedApiKey` + `authProfileId` resolvidos pelo contrato** — o principal
   caminho de produção. O núcleo resolve o perfil de autenticação `github-copilot` configurado
   para o agente (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes
   de invocar o harness, portanto um perfil de autenticação `github-copilot:<profile>` funciona
   de ponta a ponta para configurações headless, de Cron ou com múltiplos perfis, sem variáveis de ambiente.
4. **Fallback de variável de ambiente**, verificado nesta ordem (o primeiro valor não vazio vence;
   strings vazias são consideradas ausentes; espelha a precedência do provedor `github-copilot`
   fornecida em `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — substituição específica do harness; permite fixar um
      token para o harness do OpenClaw sem interferir na configuração global de `gh` /
      CLI do Copilot.
   2. `COPILOT_GITHUB_TOKEN` — variável de ambiente padrão do SDK / CLI do Copilot.
   3. `GH_TOKEN` — variável de ambiente padrão da CLI `gh`.
   4. `GITHUB_TOKEN` — fallback genérico de token do GitHub.

   O id sintetizado do perfil do pool é `env:<NAME>`; a versão do perfil é uma
   impressão digital sha256 irreversível do token; portanto, a rotação do valor do ambiente
   invalida corretamente o pool de clientes.

5. **`useLoggedInUser` padrão** quando nenhum sinal de token está disponível.

Cada agente recebe seu próprio `copilotHome`, para que tokens, sessões e
configurações da CLI do Copilot nunca vazem entre agentes na mesma máquina. Padrão:
`<agentDir>/copilot` (mantém o estado do SDK fora do mesmo diretório que
`models.json` / `auth-profiles.json` do OpenClaw), ou
`~/.openclaw/agents/<agentId>/copilot` quando nenhum diretório de agente é fornecido.
Substitua por `copilotHome: <path>` na entrada da tentativa para usar um
local personalizado (por exemplo, uma montagem compartilhada para migração).

Os testes ao vivo do harness usam `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` para um
token direto. A configuração compartilhada dos testes ao vivo limpa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
e `GITHUB_TOKEN` depois de preparar perfis de autenticação reais no diretório home isolado de teste,
portanto, um valor `gh auth token` transmitido pela variável dedicada evita
falsos saltos sem vazar para suítes não relacionadas.

## Superfície de configuração

O harness lê a configuração da entrada por tentativa (`runCopilotAttempt({...})`)
e de um pequeno conjunto de padrões de ambiente em `extensions/copilot/src/`:

| Campo                    | Finalidade                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Diretório de estado da CLI por agente (padrões acima).                                                                                                                                                                                                                                                 |
| `model`                  | String ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omita para usar a seleção normal de modelo do agente; o harness verifica se o provedor resolvido é compatível.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Mapeia a partir da resolução de `ThinkLevel` / `ReasoningLevel` do OpenClaw em `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Substituição opcional para o bloco `infiniteSessions` do SDK, controlado por `harness.compact`. É seguro mantê-la como está.                                                                                                                                                                                        |
| `hooksConfig`            | Configuração nativa opcional `SessionHooks` do SDK do Copilot para callbacks de ferramenta/MCP, prompt do usuário, sessão e erro. Separada dos hooks de ciclo de vida portáteis do OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Substituição opcional para o manipulador `onPermissionRequest` do SDK para tipos de ferramentas integradas do SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). O padrão é `rejectAllPolicy` como medida de segurança; consulte [Permissões e ask_user](#permissions-and-ask_user) para entender por que ele nunca é realmente acionado. |
| `enableSessionTelemetry` | Sinalizador opcional de telemetria de sessão do SDK.                                                                                                                                                                                                                                                            |

Os hooks de Plugin do OpenClaw não precisam de nenhuma configuração de tentativa específica do Copilot. O
harness executa `before_prompt_build` (e o hook de compatibilidade legado `before_agent_start`),
`llm_input`, `llm_output` e `agent_end` por meio dos
helpers padrão do harness. Compactions bem-sucedidas do SDK também executam
`before_compaction` e `after_compaction`. As ferramentas intermediadas do OpenClaw executam
`before_tool_call` e relatam `after_tool_call`; `hooksConfig` permanece para
callbacks exclusivos do SDK nativo sem equivalente portátil.

Nenhuma outra parte do OpenClaw precisa conhecer esses campos. Outros Plugins,
canais e o código do núcleo veem apenas o formato padrão `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Quando `harness.compact` é executado, o harness do SDK do Copilot:

1. Retoma a sessão rastreada do SDK sem continuar o trabalho pendente.
2. Chama a RPC de Compaction do histórico no escopo da sessão do SDK.
3. Retorna o resultado da Compaction do SDK sem gravar arquivos de marcador de
   compatibilidade no workspace.

O espelho da transcrição no lado do OpenClaw (abaixo) continua recebendo mensagens
após a Compaction, portanto o histórico de chat visível ao usuário permanece consistente.

## Espelhamento da transcrição

`runCopilotAttempt` realiza gravação dupla das mensagens espelháveis de cada turno na
transcrição de auditoria do OpenClaw por meio de
`extensions/copilot/src/dual-write-transcripts.ts`. O espelho tem escopo por
sessão (`copilot:${sessionId}`) e uma chave por mensagem
(`${role}:${sha256_16(role,content)}`), portanto, entradas de turnos anteriores reemitidas
colidem com as chaves existentes no disco em vez de serem duplicadas.

Duas camadas de contenção de falhas envolvem o espelho para que uma falha na
gravação da transcrição nunca cause falha na tentativa: um wrapper interno de melhor esforço, além de uma
`.catch(...)` de defesa em profundidade no nível da tentativa. As falhas são registradas, não
expostas.

## Perguntas secundárias (`/btw`)

`/btw` **não** é nativo neste harness. `createCopilotAgentHarness()`
deliberadamente deixa `harness.runSideQuestion` indefinido
(confirmado em `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
portanto, o despachante `/btw` do OpenClaw (`src/agents/btw.ts`) recorre ao
mesmo caminho usado para todos os runtimes que não são Codex: o provedor de modelo configurado
é chamado diretamente com um prompt curto de pergunta secundária, e a resposta é transmitida por streaming via
`streamSimple` (sem sessão da CLI, sem slot adicional no pool).

Isso mantém as sessões da CLI do Copilot reservadas para o loop principal de turnos do agente e
mantém o comportamento de `/btw` idêntico ao de outros runtimes que não são Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` é carregado automaticamente por
`src/plugins/doctor-contract-registry.ts`. Ele contribui com:

- Um `legacyConfigRules` vazio (ainda não há campos descontinuados).
- Um `normalizeCompatibilityConfig` que não realiza nenhuma operação (mantido para que futuras descontinuações de campos
  tenham um local estável na árvore).
- Uma entrada `sessionRouteStateOwners`: provedor `github-copilot`, runtime
  `copilot`, chave de sessão da CLI `copilot`, prefixo do perfil de autenticação `github-copilot:`.

## Limitações

- O harness reivindica `github-copilot` e IDs de provedores BYOK personalizados sem proprietário.
  IDs de provedores nativos pertencentes a manifestos permanecem no runtime proprietário, mesmo quando
  `agentRuntime.id` é forçado para `copilot`.
- Sem interface TUI; a TUI do PI continua sendo o fallback para runtimes sem uma interface
  equivalente.
- O estado da sessão do PI não é migrado quando um agente muda para `copilot`.
  A seleção ocorre por tentativa; as sessões existentes do PI continuam válidas.
- `ask_user` usa o mesmo caminho de prompt e resposta do OpenClaw que o harness do Codex:
  quando o SDK do Copilot solicita entrada do usuário, o OpenClaw publica um
  prompt bloqueante no canal/TUI ativo, e a próxima mensagem do usuário na fila
  resolve a solicitação do SDK.

## Permissões e ask_user

A aplicação de permissões para ferramentas integradas do OpenClaw ocorre **dentro do wrapper da
ferramenta**, não por meio do callback `onPermissionRequest` do SDK. O mesmo
`wrapToolWithBeforeToolCallHook` usado pelo PI
(`src/agents/agent-tools.before-tool-call.ts`) é aplicado por
`createOpenClawCodingTools` a todas as ferramentas de programação: detecção de loops, políticas de
plugins confiáveis, hooks anteriores à chamada da ferramenta e aprovações de plugins em duas fases por meio
do Gateway (`plugin.approval.request`) passam exatamente pelo mesmo caminho de código
das tentativas nativas do PI.

Cada ferramenta do SDK retornada pela ponte de ferramentas do Copilot é marcada com:

- `overridesBuiltInTool: true` — substitui a ferramenta integrada da CLI do Copilot com
  o mesmo nome (edit, read, write, bash, ...) para que cada chamada de ferramenta retorne
  ao OpenClaw.
- `skipPermission: true` — instrui o SDK a não acionar
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar a ferramenta. O
  `execute()` encapsulado já executa a verificação de políticas mais completa do OpenClaw; um
  prompt no nível do SDK ignoraria a aplicação de políticas do OpenClaw
  (permitir tudo) ou bloquearia todas as chamadas de ferramentas (rejeitar tudo) — nenhuma das opções corresponde à
  paridade com o PI.

O harness do Codex na árvore usa a mesma divisão: as ferramentas integradas do OpenClaw são
encapsuladas (`extensions/codex/src/app-server/dynamic-tools.ts`) e os
tipos de aprovação nativos do próprio codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) são encaminhados por `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). O equivalente no SDK do Copilot
— `rejectAllPolicy` com falha fechada para qualquer tipo diferente de `custom-tool`
que chegue a `onPermissionRequest` — é a mesma rede de segurança e
nunca é acionado na prática porque `overridesBuiltInTool: true` substitui todas as
ferramentas integradas.

Para que a camada de ferramentas encapsuladas tome decisões de política equivalentes às do PI, o
harness encaminha o contexto completo de ferramentas da tentativa do PI para
`createOpenClawCodingTools`: identidade (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), canal/roteamento (`groupId`,
`currentChannelId`, `replyToMode`, alternâncias de ferramentas de mensagens), autenticação
(`authProfileStore`), identidade da execução (`sessionKey` / `runSessionKey` derivados
de `sandboxSessionKey`, `runId`), contexto do modelo (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) e hooks da execução
(`onToolOutcome`, `onYield`). Sem esses campos, listas de permissões exclusivas do proprietário
negam silenciosamente por padrão, políticas de confiança de plugins não conseguem resolver o escopo
correto e `session_status: "current"` é resolvido para uma chave de sandbox obsoleta. O
construtor da ponte é `extensions/copilot/src/tool-bridge.ts`, espelhando a chamada
autoritativa do PI em `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` resolve o contexto de sandbox por meio da interface compartilhada
`resolveSandboxContext`, fornece ao SDK um diretório de trabalho efetivo
e encaminha `sandbox`, além do espaço de trabalho de criação de subagentes, para a ponte de
ferramentas. A ponte também encaminha os controles limitados de construção de ferramentas que
pode aplicar no limite do SDK: `includeCoreTools`, a lista de permissões de ferramentas do
runtime e `toolConstructionPlan`.

A ponte também usa o helper compartilhado de interface de ferramentas do harness de
`openclaw/plugin-sdk/agent-harness-tool-runtime` para manter a paridade com o PI. Quando
a pesquisa de ferramentas está habilitada, o SDK recebe ferramentas de controle compactas e um executor de
catálogo oculto, em vez de todos os esquemas de ferramentas do OpenClaw. Quando o modo de código está
habilitado, o helper cria a mesma interface de controle do modo de código e o mesmo ciclo de vida do
catálogo usados por outros harnesses de agentes. Padrões enxutos para modelos locais,
filtragem de esquemas compatível com o runtime, hidratação de diretórios e limpeza do
catálogo permanecem no helper compartilhado para que os harnesses do Copilot e os adjacentes ao
Codex não divirjam.

### Token do GitHub no nível da sessão

O contrato do SDK do Copilot diferencia o token do GitHub no **nível do cliente**
(`CopilotClientOptions.gitHubToken`, autentica o próprio processo da CLI)
do token no **nível da sessão** (`SessionConfig.gitHubToken`, determina
a exclusão de conteúdo, o roteamento de modelos e a cota dessa sessão; respeitado tanto em
`createSession` quanto em `resumeSession`). O harness resolve a autenticação uma vez por meio de
`resolveCopilotAuth` e define ambos os campos quando o modo de autenticação é `gitHubToken`
(um `auth.gitHubToken` explícito ou um `resolvedApiKey` resolvido pelo contrato a partir
de um perfil de autenticação `github-copilot` configurado). Quando o modo resolvido é
`useLoggedInUser`, o campo no nível da sessão é omitido para que o SDK continue
derivando a identidade da identidade conectada.

`ask_user` usa `SessionConfig.onUserInputRequest`. A ponte aceita índices
ou rótulos de opções para solicitações de escolha fixa, aceita respostas em formato livre quando
a solicitação do SDK as permite e cancela uma solicitação pendente quando a tentativa do OpenClaw
é abortada.

## Relacionado

- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Plugins de harness de agentes (referência do SDK)](/pt-BR/plugins/sdk-agent-harness)
