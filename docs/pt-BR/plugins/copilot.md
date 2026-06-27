---
read_when:
    - Você quer usar o harness do SDK do GitHub Copilot para um agente
    - Você precisa de exemplos de configuração para o runtime `copilot`
    - Você está conectando um agente ao Copilot por assinatura (github / openclaw / copilot) e quer executá-lo por meio da CLI do Copilot
summary: Execute turnos de agente incorporado do OpenClaw por meio do harness externo do SDK do GitHub Copilot
title: Harness do SDK do Copilot
x-i18n:
    generated_at: "2026-06-27T17:47:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

O Plugin externo `@openclaw/copilot` permite que o OpenClaw execute turnos de agente
Copilot de assinatura incorporados por meio da GitHub Copilot CLI (`@github/copilot-sdk`)
em vez do harness PI integrado.

Use o harness do Copilot SDK quando quiser que a sessão da Copilot CLI seja dona do
loop de agente de baixo nível: execução nativa de ferramentas, Compaction nativa
(`infiniteSessions`) e estado da thread gerenciado pela CLI em `copilotHome`.
O OpenClaw ainda é dono dos canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw (ponteadas), aprovações, entrega de mídia, o espelho
visível da transcrição, perguntas laterais `/btw` (tratadas pelo fallback PI na árvore — veja
[Perguntas laterais (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Para a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes).

## Requisitos

- OpenClaw com o Plugin `@openclaw/copilot` instalado.
- Se sua configuração usa `plugins.allow`, inclua `copilot` (o id de manifesto
  declarado pelo Plugin). Uma lista de permissões restritiva que usa o nome
  de pacote no estilo npm `@openclaw/copilot` deixará o Plugin bloqueado e o runtime
  não será carregado, mesmo com `agentRuntime.id: "copilot"`.
- Uma assinatura do GitHub Copilot que consiga acionar a Copilot CLI (ou uma entrada
  `gitHubToken` de env / perfil de autenticação para execuções headless / cron).
- Um diretório `copilotHome` gravável. O harness usa como padrão
  `<agentDir>/copilot` quando o OpenClaw fornece um diretório de agente; caso contrário,
  `~/.openclaw/agents/<agentId>/copilot` para isolamento total por agente.

`openclaw doctor` executa o
[contrato de doctor](#doctor) do Plugin para propriedade declarativa do estado de sessão e futuras
migrações de compatibilidade. Ele não executa sondas de ambiente da Copilot CLI.

## Instalação do Plugin

O runtime do Copilot é um Plugin externo, então o pacote principal `openclaw` não
carrega a dependência `@github/copilot-sdk` nem o binário de CLI
`@github/copilot-<platform>-<arch>` específico da plataforma. Juntos, eles adicionam cerca de
260 MB, portanto instale-os apenas para agentes que optam por este runtime:

```bash
openclaw plugins install @openclaw/copilot
```

O assistente instala o Plugin na primeira vez que você seleciona um modelo
`github-copilot/*` **e** sua configuração opta o modelo (ou seu provedor) para o
runtime de agente do Copilot via
`agentRuntime: { id: "copilot" }` (veja [Início rápido](#quickstart) abaixo).
Sem a adesão explícita, o openclaw usa seu provedor GitHub Copilot integrado
e nunca instala o Plugin de runtime.

O runtime resolve o SDK nesta ordem:

1. `import("@github/copilot-sdk")` a partir do pacote `@openclaw/copilot`
   instalado.
2. O diretório fallback conhecido `~/.openclaw/npm-runtime/copilot/` (o
   alvo legado de instalação sob demanda).

Um SDK ausente expõe um único erro com o código `COPILOT_SDK_MISSING`
e o comando de reinstalação do Plugin acima.

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

As duas rotas são equivalentes. Use `agentRuntime.id` em uma única entrada de modelo
quando apenas esse modelo deve ser roteado pelo harness; defina
`agentRuntime.id` em um provedor quando todos os modelos sob esse provedor devem
usá-lo.

`github-copilot/auto` é o ponto de partida portátil. Modelos Copilot nomeados
dependem da conta e da política da organização, então só fixe um depois de confirmar
que a Copilot CLI autenticada o expõe.

## Provedores compatíveis

O harness anuncia suporte ao provedor canônico `github-copilot`
(o mesmo id pertencente a `extensions/github-copilot`):

- `github-copilot`

Ele também aceita entradas personalizadas em `models.providers` quando o modelo selecionado tem
um `baseUrl` não vazio e uma destas formas de API:

- `openai-responses`
- `openai-completions`
- `ollama` (completions compatíveis com OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Ids de provedores nativos como `openai`, `anthropic`, `google` e `ollama` permanecem
pertencentes aos seus runtimes nativos. Use um id de provedor personalizado distinto ao rotear
um endpoint pelo Copilot BYOK.

Endpoints Copilot BYOK devem ser URLs HTTPS de rede pública. O harness fornece ao
Copilot SDK uma URL de proxy loopback por tentativa e então encaminha o tráfego do provedor
pelo caminho de fetch protegido do OpenClaw para que o pinning de DNS e a política de SSRF
continuem pertencendo ao OpenClaw. Use o runtime nativo do OpenClaw para Ollama local, LM Studio
ou servidores de modelo em LAN.

## BYOK

O Copilot BYOK usa o contrato de provedor personalizado no nível de sessão do SDK. O OpenClaw
passa o endpoint de modelo resolvido, chave de API, modo bearer-token, cabeçalhos, id do modelo
e limites de contexto/saída sem mover a lógica de transporte do provedor para o núcleo.

Por exemplo:

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

Sessões BYOK são chaveadas separadamente de sessões de assinatura e de outros
endpoints ou impressões digitais de credenciais. Rotacionar a chave, cabeçalhos, modelo ou
endpoint cria uma nova sessão do Copilot SDK em vez de retomar estado incompatível.

## Autenticação

Precedência por agente, aplicada durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` explícito** na entrada da tentativa. Usa o usuário logado da Copilot
   CLI resolvido sob o `copilotHome` do agente.
2. **`gitHubToken` explícito** na entrada da tentativa (com `profileId` +
   `profileVersion`). Útil para invocações diretas da CLI e testes em que o
   chamador quer ignorar a resolução de perfil de autenticação.
3. **`resolvedApiKey` + `authProfileId` resolvidos por contrato** a partir do formato
   `EmbeddedRunAttemptParams`. Este é o **caminho principal de produção**:
   o núcleo resolve o perfil de autenticação `github-copilot` configurado do agente
   (via `src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes
   de invocar o harness, e o harness consome os dois campos diretamente.
   Isso faz um perfil de autenticação `github-copilot:<profile>` funcionar de ponta a ponta
   para configurações headless / cron / multiperfil sem variáveis de ambiente.
4. **Fallback de variável de ambiente** para execuções diretas da CLI / dogfood em que nenhum perfil
   de autenticação está configurado. O runtime verifica as seguintes variáveis em
   ordem de precedência, espelhando o provedor `github-copilot` enviado
   (`extensions/github-copilot/auth.ts`) e a configuração documentada do Copilot SDK:
   1. `OPENCLAW_GITHUB_TOKEN` -- substituição específica do harness; defina isto
      para fixar um token para o harness do OpenClaw sem perturbar a configuração
      global do sistema de `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` -- variável de ambiente padrão do Copilot SDK / CLI.
   3. `GH_TOKEN` -- variável de ambiente padrão da CLI `gh` (corresponde à precedência
      existente do provedor `github-copilot`).
   4. `GITHUB_TOKEN` -- fallback genérico de token do GitHub.

   O primeiro valor não vazio vence; strings vazias são tratadas como
   ausentes. O id de perfil de pool sintetizado é `env:<NAME>` e o
   profileVersion é uma impressão digital sha256 não reversível do
   token, então rotacionar o valor de env invalida claramente o pool de clientes.

5. **`useLoggedInUser` padrão** quando nenhum sinal de token está disponível.

Cada agente recebe um `copilotHome` dedicado para que tokens, sessões e
configurações da Copilot CLI não vazem entre agentes na mesma máquina. O padrão é
`<agentDir>/copilot` quando o host entrega ao harness um diretório de agente
(isolando o estado do SDK de `models.json` / `auth-profiles.json` do OpenClaw no
mesmo diretório), ou `~/.openclaw/agents/<agentId>/copilot` caso contrário.
Substitua por `copilotHome: <path>` na entrada da tentativa quando precisar de um
local personalizado (por exemplo, um mount compartilhado para migração).

Testes live do harness usam `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` quando um token direto
é necessário. A configuração compartilhada de teste live limpa intencionalmente
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e `GITHUB_TOKEN` após preparar perfis de autenticação reais
no home de teste isolado, então passar um valor de `gh auth token`
pela variável dedicada de teste live evita falsos skips sem expor
o token a suítes não relacionadas.

## Superfície de configuração

O harness lê sua configuração da entrada por tentativa
(`runCopilotAttempt({...})`) mais um pequeno conjunto de padrões de env dentro de
`extensions/copilot/src/`:

- `copilotHome` — diretório de estado da CLI por agente (padrões documentados acima).
- `model` — string ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Quando omitido, o OpenClaw usa a seleção normal de modelo do agente e o
  harness verifica se o provedor resolvido é compatível.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Mapeia a partir da
  resolução de `ThinkLevel` / `ReasoningLevel` do OpenClaw em
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — substituição opcional para o bloco
  `infiniteSessions` do SDK acionado por `harness.compact`. Os padrões são seguros para
  deixar como estão.
- `hooksConfig` — configuração opcional de compatibilidade nativa `SessionHooks` do Copilot SDK
  para callbacks de ferramenta/MCP, prompt de usuário, sessão e erro.
  Ela é separada dos hooks portáteis de ciclo de vida do OpenClaw.
- `permissionPolicy` — substituição opcional para o handler
  `onPermissionRequest` do SDK usado para tipos de ferramentas integradas do SDK
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). O padrão
  é `rejectAllPolicy` como rede de segurança; na prática, o SDK nunca
  invoca nenhum desses tipos porque toda ferramenta OpenClaw ponteada é
  registrada com `overridesBuiltInTool: true` e
  `skipPermission: true`, então 100% das chamadas de ferramenta fluem pelo
  `execute()` encapsulado do OpenClaw. Veja [Permissões e ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — flag opcional de telemetria de sessão do SDK.

Hooks de Plugin do OpenClaw não precisam de configuração de tentativa específica do Copilot. O
harness executa `before_prompt_build` (e o hook legado de compatibilidade `before_agent_start`),
`llm_input`, `llm_output` e `agent_end` por meio dos
helpers padrão do harness. Compactions bem-sucedidas do SDK também executam
`before_compaction` e `after_compaction`. Ferramentas OpenClaw ponteadas continuam a
executar `before_tool_call` e relatar `after_tool_call`; `hooksConfig` permanece para
callbacks nativos apenas do SDK que não têm equivalente portátil.

Nada no restante do OpenClaw precisa saber sobre esses campos. Outros
Plugins, canais e código do núcleo veem apenas o formato padrão
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Quando `harness.compact` é executado, o harness do Copilot SDK:

1. Retoma a sessão rastreada do SDK sem continuar trabalho pendente.
2. Chama a RPC de Compaction de histórico com escopo de sessão do SDK.
3. Retorna o resultado de Compaction do SDK sem gravar arquivos marcadores de compatibilidade
   sob o workspace.

O espelho de transcrição do lado do OpenClaw (veja abaixo) continua recebendo as
mensagens pós-Compaction, então o histórico de chat voltado ao usuário permanece consistente.

## Espelhamento de transcrição

`runCopilotAttempt` faz gravação dupla das mensagens espelháveis de cada turno na
transcrição de auditoria do OpenClaw por meio de
`extensions/copilot/src/dual-write-transcripts.ts`. O espelho tem escopo
por sessão (`copilot:${sessionId}`) e usa uma identidade por mensagem
(`${role}:${sha256_16(role,content)}`), então reemissões de entradas de turnos anteriores
colidem com chaves existentes em disco e não duplicam.

O espelho é envolvido em duas camadas de contenção de falhas para que uma falha
de gravação de transcrição não possa falhar a tentativa: um wrapper interno de melhor esforço e um
`.catch(...)` de defesa em profundidade no nível da tentativa. Falhas são registradas, mas
não expostas.

## Perguntas laterais (`/btw`)

`/btw` **não** é nativo neste harness. `createCopilotAgentHarness()`
deliberadamente deixa `harness.runSideQuestion` indefinido, então o dispatcher
`/btw` do OpenClaw (`src/agents/btw.ts`) passa para o mesmo caminho de fallback
PI no repositório que ele usa para todo runtime que não seja Codex: o provedor
de modelo configurado é chamado diretamente com um prompt curto de pergunta
paralela e transmitido de volta via `streamSimple` (sem sessão de CLI, sem slot
extra no pool).

Isso mantém as sessões da Copilot CLI reservadas para o loop principal de turnos
do agente e mantém o comportamento de `/btw` idêntico ao de outros runtimes
baseados em PI. O contrato é verificado em
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
em `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` é carregado automaticamente por
`src/plugins/doctor-contract-registry.ts`. Ele contribui:

- Um `legacyConfigRules` vazio (nenhum campo aposentado no MVP).
- Um `normalizeCompatibilityConfig` sem efeito (mantido para que futuras
  aposentadorias de campos tenham um local estável no repositório).
- Uma entrada `sessionRouteStateOwners` reivindicando o provedor
  `github-copilot`; runtime `copilot`; chave de sessão de CLI `copilot`;
  prefixo de perfil de autenticação `github-copilot:`.

## Limitações

- O harness reivindica `github-copilot` mais ids de provedores BYOK
  personalizados sem dono. Ids de provedores nativos pertencentes ao manifesto
  permanecem em seu runtime proprietário mesmo quando `agentRuntime.id` é
  forçado para `copilot`.
- O harness não entrega TUI; a TUI do PI não é afetada e continua sendo o
  fallback para quaisquer runtimes que não tenham uma superfície par.
- O estado de sessão do PI não é migrado quando um agente alterna para
  `copilot`. A seleção é por tentativa; sessões PI existentes continuam
  válidas.
- `ask_user` usa o mesmo caminho de prompt e resposta do OpenClaw que o harness
  Codex. Quando o Copilot SDK solicita entrada do usuário, o OpenClaw publica um
  prompt bloqueante no canal/TUI ativo e a próxima mensagem de usuário na fila
  resolve a solicitação do SDK.

## Permissões e ask_user

A aplicação de permissões para ferramentas OpenClaw em ponte acontece **dentro
do wrapper da ferramenta**, não por meio do callback `onPermissionRequest` do
SDK. O mesmo `wrapToolWithBeforeToolCallHook` que o PI usa
(`src/agents/pi-tools.before-tool-call.ts`) é aplicado por
`createOpenClawCodingTools` a toda ferramenta de codificação: detecção de loop,
políticas de plugins confiáveis, hooks antes da chamada de ferramenta e
aprovações de plugins em duas fases via Gateway (`plugin.approval.request`)
executam todos com exatamente o mesmo caminho de código das tentativas PI
nativas.

Para permitir que esse wrapper seja dono da decisão, a ferramenta do SDK
retornada por `convertOpenClawToolToSdkTool` é marcada com:

- `overridesBuiltInTool: true` — substitui a ferramenta integrada da Copilot CLI
  com o mesmo nome (edit, read, write, bash, …), para que toda invocação de
  ferramenta seja roteada de volta ao OpenClaw.
- `skipPermission: true` — instrui o SDK a não disparar
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar a ferramenta.
  O `execute()` encapsulado realiza internamente a verificação de política mais
  rica do OpenClaw; um prompt no nível do SDK ou contornaria a aplicação do
  OpenClaw (se permitíssemos tudo) ou bloquearia toda chamada de ferramenta (se
  rejeitássemos tudo) — nenhum dos dois corresponde à paridade com PI.

O harness Codex no repositório usa a mesma separação: ferramentas OpenClaw em
ponte são encapsuladas (`extensions/codex/src/app-server/dynamic-tools.ts`) e os
tipos de aprovação nativos _próprios_ do codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) são roteados por
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). O equivalente no
Copilot SDK — `rejectAllPolicy` com falha fechada para qualquer tipo que não
seja `custom-tool` que chegue a `onPermissionRequest` — é a mesma rede de
segurança, e ela não dispara na prática porque `overridesBuiltInTool: true`
desloca toda ferramenta integrada.

Para que a camada de ferramenta encapsulada tome decisões de política
equivalentes ao PI, o harness encaminha o contexto completo de ferramenta de
tentativa do PI para `createOpenClawCodingTools` — identidade
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, …),
canal/roteamento (`groupId`, `currentChannelId`, `replyToMode`, alternâncias de
ferramentas de mensagem), autenticação (`authProfileStore`), identidade de
execução (`sessionKey`/`runSessionKey` derivados de `sandboxSessionKey`,
`runId`), contexto de modelo (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) e hooks de execução (`onToolOutcome`,
`onYield`). Sem esses campos, allowlists somente para dono silenciosamente se
comportam como negação por padrão, políticas de confiança de plugin não
conseguem resolver para o escopo correto, e `session_status: "current"` resolve
para uma chave de sandbox obsoleta. O construtor da ponte fica em
`extensions/copilot/src/tool-bridge.ts` e espelha a chamada PI autoritativa em
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt` já
resolve o contexto de sandbox pela costura compartilhada `resolveSandboxContext`,
passa ao SDK um diretório de trabalho efetivo e encaminha `sandbox` mais o
workspace de criação de subagente para a ponte de ferramentas. A ponte também
encaminha os controles limitados de construção de ferramentas que pode aplicar
na fronteira do SDK: `includeCoreTools`, a allowlist de ferramentas do runtime e
`toolConstructionPlan`.

A ponte também usa o helper compartilhado de superfície de ferramentas do
harness em `openclaw/plugin-sdk/agent-harness-tool-runtime` para paridade com
PI. Quando a busca de ferramentas está habilitada, o SDK vê ferramentas de
controle compactas mais um executor de catálogo oculto, em vez de todo esquema
de ferramentas do OpenClaw. Quando o modo de código está habilitado, o helper
constrói a mesma superfície de controle de modo de código e o mesmo ciclo de
vida de catálogo usados por outros harnesses de agente. Padrões enxutos de
modelo local, filtragem de esquema compatível com o runtime, hidratação de
diretório e limpeza de catálogo permanecem todos no helper compartilhado para
que harnesses Copilot e adjacentes ao Codex não divirjam.

### Token GitHub em nível de sessão

O contrato do Copilot SDK distingue o token GitHub em **nível de cliente**
(`CopilotClientOptions.gitHubToken`, usado para autenticar o próprio processo de
CLI) do token em **nível de sessão** (`SessionConfig.gitHubToken`, que determina
exclusão de conteúdo, roteamento de modelo e cota para essa sessão e é
respeitado tanto em `createSession` quanto em `resumeSession`). O harness resolve
a autenticação uma vez via `resolveCopilotAuth` e define ambos os campos quando
o modo de autenticação é `gitHubToken` (um `auth.gitHubToken` explícito ou uma
`resolvedApiKey` resolvida por contrato a partir de um perfil de autenticação
`github-copilot` configurado). Quando o modo resolvido é `useLoggedInUser`, o
campo em nível de sessão é omitido para que o SDK continue derivando a
identidade da identidade conectada.

`ask_user` usa `SessionConfig.onUserInputRequest`. A ponte aceita índices ou
rótulos de escolha para solicitações de escolha fixa, aceita respostas livres
quando a solicitação do SDK permite, e cancela uma solicitação pendente quando a
tentativa do OpenClaw é abortada.

## Relacionado

- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Plugins de harness de agente (referência do SDK)](/pt-BR/plugins/sdk-agent-harness)
