---
read_when:
    - Você quer usar o harness do SDK do GitHub Copilot para um agente
    - Você precisa de exemplos de configuração para o runtime `copilot`
    - Você está conectando um agente ao Copilot por assinatura (github / openclaw / copilot) e quer que ele seja executado por meio da CLI do Copilot
summary: Execute turnos do agente integrado do OpenClaw por meio do harness externo do SDK do GitHub Copilot
title: Harness do SDK do Copilot
x-i18n:
    generated_at: "2026-07-12T15:27:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

O plugin externo `@openclaw/copilot` executa turnos incorporados do agente Copilot por assinatura por meio da CLI do GitHub Copilot (`@github/copilot-sdk`), em vez do harness integrado do OpenClaw. A sessão da CLI do Copilot controla o loop de baixo nível do agente: execução nativa de ferramentas, Compaction nativa (`infiniteSessions`) e estado da thread gerenciado pela CLI em `copilotHome`. O OpenClaw continua controlando canais de chat, arquivos de sessão, seleção de modelos, ferramentas dinâmicas (intermediadas), aprovações, entrega de mídia, o espelho visível da transcrição, perguntas paralelas com `/btw` (consulte
[Perguntas paralelas (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Para entender a divisão mais ampla entre modelo, provedor e runtime, comece por
[Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

## Requisitos

- OpenClaw com o plugin `@openclaw/copilot` instalado.
- Se sua configuração usar `plugins.allow`, inclua `copilot` (o id de manifesto declarado pelo
  plugin). Uma entrada na lista de permissões com o nome do pacote npm
  `@openclaw/copilot` não corresponderá e manterá o plugin bloqueado, mesmo com
  `agentRuntime.id: "copilot"` definido.
- Uma assinatura do GitHub Copilot capaz de operar a CLI do Copilot ou uma
  variável de ambiente `gitHubToken` / entrada de perfil de autenticação para execuções headless ou de Cron.
- Um diretório `copilotHome` gravável. O padrão é `<agentDir>/copilot` quando
  o OpenClaw fornece um diretório de agente; caso contrário,
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` executa o [contrato do doctor](#doctor) do plugin para
controle do estado da sessão e futuras migrações de configuração. Ele não verifica o
ambiente da CLI do Copilot.

## Instalação

O runtime do Copilot é distribuído como um plugin externo para que o pacote principal `openclaw`
não inclua `@github/copilot-sdk` nem o binário da CLI específico de plataforma
`@github/copilot-<platform>-<arch>` (aproximadamente 260 MB juntos).
Instale-o apenas para agentes que optarem por esse runtime:

```bash
openclaw plugins install @openclaw/copilot
```

O assistente de configuração instala o plugin automaticamente na primeira vez que você seleciona
um modelo `github-copilot/*` **e** sua configuração encaminha esse modelo (ou seu
provedor) ao runtime do Copilot por meio de `agentRuntime: { id: "copilot" }`; consulte
[Início rápido](#quickstart). Sem essa opção, o OpenClaw usa seu provedor
integrado do GitHub Copilot e nunca instala este plugin.

O runtime resolve o SDK nesta ordem:

1. `import("@github/copilot-sdk")` a partir do pacote `@openclaw/copilot`
   instalado.
2. O diretório alternativo `~/.openclaw/npm-runtime/copilot/` (destino legado de
   instalação sob demanda).

A ausência do SDK gera um único erro com o código `COPILOT_SDK_MISSING` e o
comando de reinstalação acima.

## Início rápido

Fixe um modelo (ou um provedor) ao harness:

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

Defina `agentRuntime.id` em uma única entrada de modelo para encaminhar apenas esse modelo pelo
harness ou em um provedor para encaminhar todos os modelos desse provedor.

`github-copilot/auto` é o ponto de partida portátil. Os modelos nomeados do Copilot dependem
das políticas da conta e da organização; confirme que sua CLI do Copilot autenticada
realmente disponibiliza um modelo antes de fixá-lo.

## Provedores compatíveis

O harness é compatível com o provedor canônico `github-copilot` (controlado por
`extensions/github-copilot`), além de entradas personalizadas em `models.providers` quando o
modelo tem um `baseUrl` não vazio e um destes formatos de `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (conclusões compatíveis com OpenAI)
- `openai-completions`
- `openai-responses`

Os ids dos provedores nativos (`openai`, `anthropic`, `google`, `ollama`) continuam sob controle
de seus runtimes nativos. Use um id de provedor personalizado distinto para encaminhar um endpoint
pelo BYOK do Copilot.

Os endpoints BYOK do Copilot devem ser URLs HTTPS públicas. O harness fornece ao
SDK do Copilot um proxy de loopback por tentativa e, em seguida, encaminha o tráfego do provedor
pelo caminho protegido de fetch do OpenClaw, para que a fixação de DNS e a política de SSRF permaneçam
sob controle do OpenClaw. Use o runtime nativo do OpenClaw para Ollama local, LM
Studio ou servidores de modelos na LAN.

## BYOK

O BYOK do Copilot usa o contrato de provedor personalizado por sessão do SDK. O OpenClaw
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
   usuário conectado na CLI do Copilot no `copilotHome` do agente.
2. **`gitHubToken` explícito** na entrada da tentativa (requer `profileId` +
   `profileVersion`). Para invocações diretas da CLI e testes que precisam
   ignorar a resolução do perfil de autenticação.
3. **`resolvedApiKey` + `authProfileId` resolvidos pelo contrato** — o caminho
   principal de produção. O núcleo resolve o perfil de autenticação `github-copilot`
   configurado para o agente (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes de
   invocar o harness, de modo que um perfil de autenticação `github-copilot:<profile>` funcione
   de ponta a ponta em configurações headless, de Cron ou com vários perfis, sem variáveis de ambiente.
4. **Fallback por variável de ambiente**, verificado nesta ordem (o primeiro valor não vazio prevalece;
   strings vazias são consideradas ausentes; espelha a precedência do provedor `github-copilot`
   distribuído em `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — substituição específica do harness; permite fixar um
      token para o harness do OpenClaw sem afetar a configuração global do `gh` /
      da CLI do Copilot.
   2. `COPILOT_GITHUB_TOKEN` — variável de ambiente padrão do SDK / da CLI do Copilot.
   3. `GH_TOKEN` — variável de ambiente padrão da CLI `gh`.
   4. `GITHUB_TOKEN` — fallback genérico de token do GitHub.

   O id sintetizado do perfil do pool é `env:<NAME>`; a versão do perfil é uma
   impressão digital sha256 irreversível do token, portanto a rotação do valor da variável de ambiente
   invalida corretamente o pool de clientes.

5. **`useLoggedInUser` padrão** quando nenhum sinal de token está disponível.

Cada agente recebe seu próprio `copilotHome`, para que tokens, sessões e
configurações da CLI do Copilot nunca vazem entre agentes na mesma máquina. Padrão:
`<agentDir>/copilot` (mantém o estado do SDK fora do mesmo diretório de
`models.json` / `auth-profiles.json` do OpenClaw) ou
`~/.openclaw/agents/<agentId>/copilot` quando nenhum diretório de agente é fornecido.
Substitua por `copilotHome: <path>` na entrada da tentativa para usar um local
personalizado (por exemplo, um volume compartilhado para migração).

Os testes ao vivo do harness usam `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` para fornecer um
token diretamente. A configuração compartilhada dos testes ao vivo remove `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
e `GITHUB_TOKEN` depois de preparar perfis de autenticação reais no diretório inicial de teste
isolado, de modo que um valor de `gh auth token` fornecido pela variável dedicada evite
omissões incorretas sem vazar para suítes não relacionadas.

## Superfície de configuração

O harness lê a configuração da entrada de cada tentativa (`runCopilotAttempt({...})`)
e de um pequeno conjunto de padrões de ambiente em `extensions/copilot/src/`:

| Campo                    | Finalidade                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Diretório de estado da CLI por agente (padrões acima).                                                                                                                                                                                                                                                 |
| `model`                  | String ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omita para usar a seleção normal de modelo do agente; o harness verifica se há compatibilidade com o provedor resolvido.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Mapeado a partir da resolução de `ThinkLevel` / `ReasoningLevel` do OpenClaw em `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Substituição opcional do bloco `infiniteSessions` do SDK controlado por `harness.compact`. É seguro mantê-lo como está.                                                                                                                                                                                        |
| `hooksConfig`            | Configuração nativa opcional de `SessionHooks` do SDK do Copilot para callbacks de ferramenta/MCP, prompt do usuário, sessão e erro. Separada dos hooks portáteis de ciclo de vida do OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Substituição opcional do manipulador `onPermissionRequest` do SDK para tipos de ferramentas integradas do SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). O padrão é `rejectAllPolicy` como medida de segurança; consulte [Permissões e ask_user](#permissions-and-ask_user) para saber por que ele nunca é acionado. |
| `enableSessionTelemetry` | Sinalizador opcional de telemetria da sessão do SDK.                                                                                                                                                                                                                                                            |

Os hooks de plugin do OpenClaw não exigem configuração específica do Copilot na tentativa. O
harness executa `before_prompt_build` (e o hook legado de compatibilidade
`before_agent_start`), `llm_input`, `llm_output` e `agent_end` por meio dos
auxiliares padrão do harness. Compactações bem-sucedidas do SDK também executam
`before_compaction` e `after_compaction`. As ferramentas intermediadas do OpenClaw executam
`before_tool_call` e informam `after_tool_call`; `hooksConfig` permanece disponível para
callbacks exclusivos do SDK nativo sem equivalente portátil.

Nenhuma outra parte do OpenClaw precisa conhecer esses campos. Outros plugins,
canais e o código do núcleo veem apenas o formato padrão `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Quando `harness.compact` é executado, o harness do SDK do Copilot:

1. Retoma a sessão rastreada do SDK sem continuar trabalhos pendentes.
2. Chama o RPC de compactação de histórico no escopo da sessão do SDK.
3. Retorna o resultado da compactação do SDK sem gravar arquivos de marcador de
   compatibilidade no workspace.

O espelho da transcrição no OpenClaw (abaixo) continua recebendo mensagens após a compactação,
portanto o histórico de chat visível ao usuário permanece consistente.

## Espelhamento da transcrição

`runCopilotAttempt` grava em paralelo as mensagens espelháveis de cada turno na
transcrição de auditoria do OpenClaw por meio de
`extensions/copilot/src/dual-write-transcripts.ts`. O espelho tem escopo por
sessão (`copilot:${sessionId}`) e chave por mensagem
(`${role}:${sha256_16(role,content)}`), portanto entradas reemitidas de turnos anteriores
colidem com as chaves existentes no disco, em vez de serem duplicadas.

Duas camadas de contenção de falhas envolvem o espelho para que uma falha na
gravação da transcrição nunca faça a tentativa falhar: um wrapper interno de
melhor esforço, além de um `.catch(...)` de defesa em profundidade no nível
da tentativa. As falhas são registradas, não expostas.

## Perguntas paralelas (`/btw`)

`/btw` **não** é nativo neste harness. `createCopilotAgentHarness()`
deliberadamente deixa `harness.runSideQuestion` indefinido
(confirmado em `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
portanto, o dispatcher de `/btw` do OpenClaw (`src/agents/btw.ts`) recorre ao
mesmo caminho usado para todos os runtimes que não são Codex: o provedor de
modelo configurado é chamado diretamente com um prompt curto de pergunta
paralela, e a resposta é transmitida de volta via `streamSimple` (sem sessão
da CLI, sem slot adicional no pool).

Isso mantém as sessões da CLI do Copilot reservadas para o loop principal de
turnos do agente e mantém o comportamento de `/btw` idêntico ao de outros
runtimes que não são Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` é carregado automaticamente por
`src/plugins/doctor-contract-registry.ts`. Ele fornece:

- Um `legacyConfigRules` vazio (ainda não há campos descontinuados).
- Um `normalizeCompatibilityConfig` sem operação (mantido para que futuras
  descontinuações de campos tenham um local estável dentro da árvore).
- Uma entrada em `sessionRouteStateOwners`: provedor `github-copilot`, runtime
  `copilot`, chave de sessão da CLI `copilot`, prefixo do perfil de autenticação
  `github-copilot:`.

## Limitações

- O harness reivindica `github-copilot`, além de ids de provedores BYOK
  personalizados sem proprietário. Os ids de provedores nativos pertencentes
  ao manifesto permanecem no runtime proprietário, mesmo quando
  `agentRuntime.id` é forçado para `copilot`.
- Não há superfície de TUI; a TUI do PI continua sendo o fallback para
  runtimes sem uma superfície equivalente.
- O estado da sessão do PI não é migrado quando um agente muda para `copilot`.
  A seleção ocorre por tentativa; as sessões existentes do PI permanecem
  válidas.
- `ask_user` usa o mesmo caminho de prompt e resposta do OpenClaw que o
  harness do Codex: quando o SDK do Copilot solicita uma entrada do usuário,
  o OpenClaw publica um prompt bloqueante no canal/TUI ativo, e a próxima
  mensagem do usuário na fila resolve a solicitação do SDK.

## Permissões e ask_user

A aplicação de permissões para ferramentas conectadas do OpenClaw ocorre
**dentro do wrapper da ferramenta**, não por meio do callback
`onPermissionRequest` do SDK. O mesmo `wrapToolWithBeforeToolCallHook` usado
pelo PI (`src/agents/agent-tools.before-tool-call.ts`) é aplicado por
`createOpenClawCodingTools` a todas as ferramentas de programação: detecção
de loops, políticas de plugins confiáveis, hooks anteriores à chamada da
ferramenta e aprovações de plugins em duas fases por meio do Gateway
(`plugin.approval.request`) percorrem exatamente o mesmo caminho de código
das tentativas nativas do PI.

A Tool do SDK retornada por `convertOpenClawToolToSdkTool` é marcada com:

- `overridesBuiltInTool: true` — substitui a ferramenta integrada de mesmo
  nome da CLI do Copilot (edit, read, write, bash, ...) para que todas as
  chamadas de ferramenta retornem ao OpenClaw.
- `skipPermission: true` — instrui o SDK a não disparar
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar a ferramenta.
  O `execute()` encapsulado já realiza a verificação mais abrangente das
  políticas do OpenClaw; um prompt no nível do SDK ignoraria a aplicação das
  políticas do OpenClaw (permitir tudo) ou bloquearia todas as chamadas de
  ferramenta (rejeitar tudo) — nenhum dos dois corresponde à paridade com o
  PI.

O harness do Codex na árvore usa a mesma separação: as ferramentas conectadas
do OpenClaw são encapsuladas
(`extensions/codex/src/app-server/dynamic-tools.ts`) e os próprios tipos de
aprovação nativos do codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) são encaminhados por meio de
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). O equivalente no SDK
do Copilot — a `rejectAllPolicy` com falha fechada para qualquer tipo que não
seja `custom-tool` e que chegue a `onPermissionRequest` — é a mesma rede de
segurança e, na prática, nunca é acionada porque
`overridesBuiltInTool: true` substitui todas as ferramentas integradas.

Para que a camada de ferramentas encapsuladas tome decisões de política
equivalentes às do PI, o harness encaminha todo o contexto de ferramentas da
tentativa do PI para `createOpenClawCodingTools`: identidade
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, ...),
canal/roteamento (`groupId`, `currentChannelId`, `replyToMode`, alternâncias
da ferramenta de mensagens), autenticação (`authProfileStore`), identidade
da execução (`sessionKey` / `runSessionKey` derivadas de
`sandboxSessionKey`, `runId`), contexto do modelo (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) e hooks da
execução (`onToolOutcome`, `onYield`). Sem esses campos, as listas de
permissão exclusivas do proprietário negam silenciosamente por padrão, as
políticas de confiança de plugins não conseguem determinar o escopo correto
e `session_status: "current"` é resolvido para uma chave de sandbox
desatualizada. O construtor da ponte é
`extensions/copilot/src/tool-bridge.ts`, espelhando a chamada autoritativa do
PI em `src/agents/embedded-agent-runner/run/attempt.ts:1262`. `runAttempt`
resolve o contexto do sandbox por meio da interface compartilhada
`resolveSandboxContext`, fornece ao SDK um diretório de trabalho efetivo e
encaminha `sandbox`, além do espaço de trabalho de criação de subagentes,
para a ponte de ferramentas. A ponte também encaminha os controles limitados
de construção de ferramentas que pode aplicar no limite do SDK:
`includeCoreTools`, a lista de permissão de ferramentas do runtime e
`toolConstructionPlan`.

A ponte também usa o auxiliar compartilhado da superfície de ferramentas do
harness em `openclaw/plugin-sdk/agent-harness-tool-runtime` para manter a
paridade com o PI. Quando a busca de ferramentas está ativada, o SDK recebe
ferramentas de controle compactas, além de um executor de catálogo oculto, em
vez de todos os esquemas de ferramentas do OpenClaw. Quando o modo de código
está ativado, o auxiliar cria a mesma superfície de controle do modo de
código e o mesmo ciclo de vida do catálogo usados por outros harnesses de
agentes. Os padrões enxutos para modelos locais, a filtragem de esquemas
compatível com o runtime, a hidratação de diretórios e a limpeza do catálogo
permanecem no auxiliar compartilhado para que os harnesses do Copilot e os
adjacentes ao Codex não divirjam.

### Token do GitHub no nível da sessão

O contrato do SDK do Copilot distingue o token do GitHub no **nível do
cliente** (`CopilotClientOptions.gitHubToken`, que autentica o próprio
processo da CLI) do token no **nível da sessão**
(`SessionConfig.gitHubToken`, que determina a exclusão de conteúdo, o
roteamento do modelo e a cota dessa sessão; respeitado tanto em
`createSession` quanto em `resumeSession`). O harness resolve a autenticação
uma vez por meio de `resolveCopilotAuth` e define ambos os campos quando o
modo de autenticação é `gitHubToken` (um `auth.gitHubToken` explícito ou uma
`resolvedApiKey` resolvida pelo contrato a partir de um perfil de
autenticação `github-copilot` configurado). Quando o modo resolvido é
`useLoggedInUser`, o campo no nível da sessão é omitido para que o SDK
continue derivando a identidade a partir da identidade conectada.

`ask_user` usa `SessionConfig.onUserInputRequest`. A ponte aceita índices ou
rótulos de opções para solicitações com opções fixas, aceita respostas em
formato livre quando a solicitação do SDK as permite e cancela uma
solicitação pendente quando a tentativa do OpenClaw é abortada.

## Relacionados

- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Plugins de harness de agentes (referência do SDK)](/pt-BR/plugins/sdk-agent-harness)
