---
read_when:
    - Você está conectando o comportamento de ciclo de vida do mecanismo de contexto ao harness do Codex
    - Você precisa que o lossless-claw ou outro Plugin de mecanismo de contexto funcione com sessões integradas do harness codex/*
    - Você está comparando o comportamento de contexto do PI incorporado e do servidor de apps do Codex
summary: Especificação para fazer o harness integrado do servidor de apps do Codex respeitar Plugins de mecanismo de contexto do OpenClaw
title: Port do mecanismo de contexto do Codex Harness
x-i18n:
    generated_at: "2026-04-24T06:00:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Port do mecanismo de contexto do Codex Harness

## Status

Especificação de implementação em rascunho.

## Objetivo

Fazer com que o harness integrado do servidor de apps do Codex respeite o mesmo contrato de
ciclo de vida do mecanismo de contexto do OpenClaw que os turnos PI incorporados já respeitam.

Uma sessão usando `agents.defaults.embeddedHarness.runtime: "codex"` ou um
modelo `codex/*` ainda deve permitir que o Plugin de mecanismo de contexto selecionado, como
`lossless-claw`, controle montagem de contexto, ingestão pós-turno, manutenção e
política de Compaction em nível de OpenClaw, na medida em que o limite do servidor de apps do Codex permitir.

## Não objetivos

- Não reimplementar internals do servidor de apps do Codex.
- Não fazer a Compactação nativa de thread do Codex produzir um resumo do lossless-claw.
- Não exigir que modelos não Codex usem o harness do Codex.
- Não alterar o comportamento de sessão de ACP/acpx. Esta especificação é apenas para o
  caminho de harness incorporado de agente não-ACP.
- Não fazer Plugins de terceiros registrarem factories de extensão do servidor de apps do Codex;
  o limite de confiança existente de Plugin incluído permanece inalterado.

## Arquitetura atual

O loop de execução incorporado resolve o mecanismo de contexto configurado uma vez por execução antes de
selecionar um harness concreto de baixo nível:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins de mecanismo de contexto
  - chama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` para
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega ao harness de agente selecionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

O harness do servidor de apps do Codex é registrado pelo Plugin Codex incluído:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

A implementação do harness do Codex recebe os mesmos `EmbeddedRunAttemptParams`
que tentativas com suporte de PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Isso significa que o ponto de hook necessário está em código controlado pelo OpenClaw. O limite
externo é o próprio protocolo do servidor de apps do Codex: o OpenClaw pode controlar o que envia para
`thread/start`, `thread/resume` e `turn/start`, e pode observar
notificações, mas não pode alterar o store interno de thread nem o compactador nativo do Codex.

## Lacuna atual

Tentativas PI incorporadas chamam diretamente o ciclo de vida do mecanismo de contexto:

- bootstrap/manutenção antes da tentativa
- assemble antes da chamada do modelo
- afterTurn ou ingest após a tentativa
- manutenção após um turno bem-sucedido
- Compaction do mecanismo de contexto para mecanismos que controlam a Compactação

Código PI relevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Atualmente, tentativas do servidor de apps do Codex executam hooks genéricos de harness de agente e espelham
a transcrição, mas não chamam `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ou
`params.contextEngine.maintain`.

Código Codex relevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desejado

Para turnos do harness Codex, o OpenClaw deve preservar este ciclo de vida:

1. Ler a transcrição espelhada da sessão do OpenClaw.
2. Fazer bootstrap do mecanismo de contexto ativo quando existir um arquivo de sessão anterior.
3. Executar manutenção de bootstrap quando disponível.
4. Montar contexto usando o mecanismo de contexto ativo.
5. Converter o contexto montado em entradas compatíveis com Codex.
6. Iniciar ou retomar a thread do Codex com instruções de desenvolvedor que incluam qualquer
   `systemPromptAddition` do mecanismo de contexto.
7. Iniciar o turno do Codex com o prompt voltado ao usuário já montado.
8. Espelhar o resultado do Codex de volta na transcrição do OpenClaw.
9. Chamar `afterTurn`, se implementado; caso contrário `ingestBatch`/`ingest`, usando o
   snapshot da transcrição espelhada.
10. Executar manutenção do turno após turnos bem-sucedidos e não abortados.
11. Preservar sinais de Compactação nativa do Codex e hooks de Compaction do OpenClaw.

## Restrições de design

### O servidor de apps do Codex continua sendo canônico para o estado nativo da thread

O Codex controla sua thread nativa e qualquer histórico estendido interno. O OpenClaw não deve
tentar modificar o histórico interno do servidor de apps, exceto por chamadas de protocolo compatíveis.

O espelho de transcrição do OpenClaw continua sendo a fonte para recursos do OpenClaw:

- histórico de chat
- busca
- bookkeeping de `/new` e `/reset`
- futura troca de modelo ou harness
- estado do Plugin de mecanismo de contexto

### A montagem do mecanismo de contexto deve ser projetada em entradas do Codex

A interface do mecanismo de contexto retorna `AgentMessage[]` do OpenClaw, não um patch de
thread do Codex. `turn/start` do servidor de apps do Codex aceita uma entrada atual do usuário, enquanto
`thread/start` e `thread/resume` aceitam instruções de desenvolvedor.

Portanto, a implementação precisa de uma camada de projeção. A primeira versão segura
deve evitar fingir que pode substituir o histórico interno do Codex. Ela deve injetar
o contexto montado como material determinístico de prompt/instrução de desenvolvedor em torno
do turno atual.

### A estabilidade do prompt-cache importa

Para mecanismos como lossless-claw, o contexto montado deve ser determinístico para
entradas inalteradas. Não adicione timestamps, ids aleatórios nem ordenação não determinística ao texto de contexto gerado.

### A semântica de fallback do PI não muda

A seleção de harness permanece como está:

- `runtime: "pi"` força PI
- `runtime: "codex"` seleciona o harness Codex registrado
- `runtime: "auto"` permite que harnesses de Plugin reivindiquem provedores compatíveis
- `fallback: "none"` desabilita fallback para PI quando nenhum harness de Plugin corresponder

Este trabalho altera o que acontece depois que o harness Codex é selecionado.

## Plano de implementação

### 1. Exportar ou realocar helpers reutilizáveis de tentativa do mecanismo de contexto

Hoje, os helpers reutilizáveis de ciclo de vida ficam sob o runner do PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

O Codex não deve importar de um caminho de implementação cujo nome sugira PI, se pudermos evitar.

Crie um módulo neutro em relação ao harness, por exemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mova ou reexporte:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- um pequeno wrapper em torno de `runContextEngineMaintenance`

Mantenha as importações do PI funcionando, seja reexportando a partir dos arquivos antigos ou atualizando os call sites do PI no mesmo PR.

Os nomes neutros de helper não devem mencionar PI.

Nomes sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Adicionar um helper de projeção de contexto do Codex

Adicione um novo módulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceitar `AgentMessage[]` montado, histórico espelhado original e prompt atual.
- Determinar qual contexto pertence às instruções de desenvolvedor vs entrada atual do usuário.
- Preservar o prompt atual do usuário como a solicitação acionável final.
- Renderizar mensagens anteriores em um formato estável e explícito.
- Evitar metadados voláteis.

API proposta:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Primeira projeção recomendada:

- Colocar `systemPromptAddition` nas instruções de desenvolvedor.
- Colocar o contexto de transcrição montado antes do prompt atual em `promptText`.
- Rotulá-lo claramente como contexto montado pelo OpenClaw.
- Manter o prompt atual por último.
- Excluir prompt atual duplicado do usuário se ele já aparecer na cauda.

Formato de prompt de exemplo:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Isso é menos elegante do que cirurgia nativa de histórico do Codex, mas é implementável
dentro do OpenClaw e preserva a semântica do mecanismo de contexto.

Melhoria futura: se o servidor de apps do Codex expuser um protocolo para substituir ou
suplementar o histórico da thread, troque essa camada de projeção para usar essa API.

### 3. Conectar bootstrap antes da inicialização da thread do Codex

Em `extensions/codex/src/app-server/run-attempt.ts`:

- Ler o histórico espelhado da sessão como hoje.
- Determinar se o arquivo de sessão existia antes desta execução. Prefira um helper
  que verifique `fs.stat(params.sessionFile)` antes de gravações de espelhamento.
- Abrir um `SessionManager` ou usar um adapter estreito de gerenciador de sessão se o helper
  exigir isso.
- Chamar o helper neutro de bootstrap quando `params.contextEngine` existir.

Pseudo-fluxo:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Use a mesma convenção de `sessionKey` que a ponte de ferramenta do Codex e o
espelho de transcrição. Hoje o Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` ou
`params.sessionId`; use isso consistentemente, a menos que exista algum motivo para preservar o `params.sessionKey` bruto.

### 4. Conectar assemble antes de `thread/start` / `thread/resume` e `turn/start`

Em `runCodexAppServerAttempt`:

1. Construir ferramentas dinâmicas primeiro, para que o mecanismo de contexto veja os nomes reais das ferramentas disponíveis.
2. Ler o histórico espelhado da sessão.
3. Executar `assemble(...)` do mecanismo de contexto quando `params.contextEngine` existir.
4. Projetar o resultado montado em:
   - adição de instrução de desenvolvedor
   - texto de prompt para `turn/start`

A chamada de hook existente:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

deve se tornar sensível ao contexto:

1. calcular instruções base de desenvolvedor com `buildDeveloperInstructions(params)`
2. aplicar montagem/projeção do mecanismo de contexto
3. executar `before_prompt_build` com o prompt/instruções de desenvolvedor projetados

Essa ordem permite que hooks genéricos de prompt vejam o mesmo prompt que o Codex receberá. Se
precisarmos de paridade estrita com PI, execute a montagem do mecanismo de contexto antes da composição de hooks,
porque o PI aplica `systemPromptAddition` do mecanismo de contexto ao prompt final do sistema após seu pipeline de prompt. O importante é que tanto o mecanismo de contexto quanto os hooks recebam uma ordem determinística e documentada.

Ordem recomendada para a primeira implementação:

1. `buildDeveloperInstructions(params)`
2. `assemble()` do mecanismo de contexto
3. anexar/prepender `systemPromptAddition` às instruções de desenvolvedor
4. projetar mensagens montadas em texto de prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passar instruções finais de desenvolvedor para `startOrResumeThread(...)`
7. passar o texto final do prompt para `buildTurnStartParams(...)`

A especificação deve ser codificada em testes para que mudanças futuras não a reordenem por acidente.

### 5. Preservar formatação estável de prompt-cache

O helper de projeção deve produzir saída estável em bytes para entradas idênticas:

- ordem estável de mensagens
- rótulos estáveis de papéis
- sem timestamps gerados
- sem vazamento de ordem de chave de objeto
- sem delimitadores aleatórios
- sem ids por execução

Use delimitadores fixos e seções explícitas.

### 6. Conectar pós-turno após o espelhamento da transcrição

O `CodexAppServerEventProjector` do Codex constrói um `messagesSnapshot` local para o
turno atual. `mirrorTranscriptBestEffort(...)` grava esse snapshot no espelho de transcrição do OpenClaw.

Depois que o espelhamento tiver sucesso ou falhar, chame o finalizador do mecanismo de contexto com o
melhor snapshot de mensagens disponível:

- Prefira o contexto completo da sessão espelhada após a gravação, porque `afterTurn`
  espera o snapshot da sessão, não apenas o turno atual.
- Use fallback para `historyMessages + result.messagesSnapshot` se o arquivo de sessão
  não puder ser reaberto.

Pseudo-fluxo:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Se o espelhamento falhar, ainda assim chame `afterTurn` com o snapshot de fallback, mas registre
que o mecanismo de contexto está fazendo ingest a partir de dados de turno em fallback.

### 7. Normalizar uso e contexto de runtime do prompt-cache

Os resultados do Codex incluem uso normalizado a partir de notificações de token do servidor de apps quando
disponíveis. Passe esse uso para o contexto de runtime do mecanismo de contexto.

Se o servidor de apps do Codex eventualmente expuser detalhes de leitura/gravação de cache, mapeie-os para
`ContextEnginePromptCacheInfo`. Até lá, omita `promptCache` em vez de inventar zeros.

### 8. Política de Compaction

Há dois sistemas de Compactação:

1. `compact()` do mecanismo de contexto do OpenClaw
2. `thread/compact/start` nativo do servidor de apps do Codex

Não os confunda silenciosamente.

#### `/compact` e Compactação explícita do OpenClaw

Quando o mecanismo de contexto selecionado tiver `info.ownsCompaction === true`, a
Compactação explícita do OpenClaw deve preferir o resultado de `compact()` do mecanismo de contexto para o
espelho de transcrição do OpenClaw e o estado do Plugin.

Quando o harness Codex selecionado tiver um binding nativo de thread, também podemos
solicitar a Compactação nativa do Codex para manter saudável a thread do servidor de apps, mas isso
deve ser relatado como uma ação separada de backend nos detalhes.

Comportamento recomendado:

- Se `contextEngine.info.ownsCompaction === true`:
  - chame primeiro `compact()` do mecanismo de contexto
  - depois faça, por melhor esforço, a chamada de Compactação nativa do Codex quando existir um binding de thread
  - retorne o resultado do mecanismo de contexto como resultado principal
  - inclua o status da Compactação nativa do Codex em `details.codexNativeCompaction`
- Se o mecanismo de contexto ativo não controlar a Compactação:
  - preserve o comportamento atual da Compactação nativa do Codex

Isso provavelmente exige alterar `extensions/codex/src/app-server/compact.ts` ou
encapsulá-lo a partir do caminho genérico de Compactação, dependendo de onde
`maybeCompactAgentHarnessSession(...)` é invocado.

#### Eventos nativos `contextCompaction` do Codex dentro do turno

O Codex pode emitir eventos de item `contextCompaction` durante um turno. Mantenha a emissão atual de hooks de antes/depois da Compactação em `event-projector.ts`, mas não trate isso como uma Compactação concluída do mecanismo de contexto.

Para mecanismos que controlam a Compactação, emita um diagnóstico explícito quando o Codex realizar
Compactação nativa mesmo assim:

- nome de stream/evento: o stream existente `compaction` é aceitável
- detalhes: `{ backend: "codex-app-server", ownsCompaction: true }`

Isso torna a separação auditável.

### 9. Comportamento de reset e binding de sessão

O `reset(...)` existente do harness Codex limpa o binding do servidor de apps do Codex do arquivo de sessão do OpenClaw. Preserve esse comportamento.

Garanta também que a limpeza de estado do mecanismo de contexto continue ocorrendo pelos caminhos existentes de ciclo de vida de sessão do OpenClaw. Não adicione limpeza específica do Codex, a menos que o ciclo de vida do mecanismo de contexto atualmente deixe de cobrir eventos de reset/delete para todos os harnesses.

### 10. Tratamento de erros

Siga a semântica do PI:

- falhas de bootstrap geram aviso e continuam
- falhas de assemble geram aviso e usam fallback para mensagens/prompt não montados do pipeline
- falhas de afterTurn/ingest geram aviso e marcam a finalização pós-turno como malsucedida
- manutenção só executa após turnos bem-sucedidos, não abortados e sem yield
- erros de Compaction não devem ser tentados novamente como prompts novos

Adições específicas do Codex:

- Se a projeção de contexto falhar, gere aviso e use fallback para o prompt original.
- Se o espelho de transcrição falhar, ainda tente a finalização do mecanismo de contexto com mensagens de fallback.
- Se a Compactação nativa do Codex falhar depois que a Compactação do mecanismo de contexto tiver sido bem-sucedida,
  não falhe toda a Compactação do OpenClaw quando o mecanismo de contexto for o principal.

## Plano de testes

### Testes unitários

Adicione testes em `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - O Codex chama `bootstrap` quando existe um arquivo de sessão.
   - O Codex chama `assemble` com mensagens espelhadas, orçamento de tokens, nomes de ferramentas,
     modo de citações, ID do modelo e prompt.
   - `systemPromptAddition` é incluído nas instruções de desenvolvedor.
   - Mensagens montadas são projetadas no prompt antes da solicitação atual.
   - O Codex chama `afterTurn` após o espelhamento da transcrição.
   - Sem `afterTurn`, o Codex chama `ingestBatch` ou `ingest` por mensagem.
   - A manutenção do turno executa após turnos bem-sucedidos.
   - A manutenção do turno não executa em erro de prompt, abort ou yield abort.

2. `context-engine-projection.test.ts`
   - saída estável para entradas idênticas
   - sem duplicação do prompt atual quando o histórico montado o inclui
   - lida com histórico vazio
   - preserva a ordem de papéis
   - inclui adição de prompt de sistema apenas nas instruções de desenvolvedor

3. `compact.context-engine.test.ts`
   - o resultado principal do mecanismo de contexto que controla a Compactação vence
   - o status da Compactação nativa do Codex aparece nos detalhes quando também tentado
   - falha nativa do Codex não falha a Compactação do mecanismo de contexto que controla a Compactação
   - mecanismo de contexto que não controla a Compactação preserva o comportamento atual da Compactação nativa

### Testes existentes a atualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` se existir; caso contrário,
  os testes de execução do servidor de apps do Codex mais próximos.
- `extensions/codex/src/app-server/event-projector.test.ts` apenas se os detalhes
  de evento de Compactação mudarem.
- `src/agents/harness/selection.test.ts` não deve precisar de mudanças, a menos que o comportamento
  de configuração mude; ele deve permanecer estável.
- Os testes do mecanismo de contexto do PI devem continuar passando sem alterações.

### Testes de integração / ao vivo

Adicione ou estenda testes smoke ao vivo do harness Codex:

- configure `plugins.slots.contextEngine` para um mecanismo de teste
- configure `agents.defaults.model` para um modelo `codex/*`
- configure `agents.defaults.embeddedHarness.runtime = "codex"`
- verifique que o mecanismo de teste observou:
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - manutenção

Evite exigir lossless-claw em testes centrais do OpenClaw. Use um pequeno
Plugin falso de mecanismo de contexto dentro do repositório.

## Observabilidade

Adicione logs de depuração em torno das chamadas de ciclo de vida do mecanismo de contexto do Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` com motivo
- `codex native compaction completed alongside context-engine compaction`

Evite registrar prompts completos ou conteúdo de transcrição.

Adicione campos estruturados quando for útil:

- `sessionId`
- `sessionKey` redigido ou omitido de acordo com a prática existente de logging
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migração / compatibilidade

Isso deve ser compatível com versões anteriores:

- Se nenhum mecanismo de contexto estiver configurado, o comportamento legado do mecanismo de contexto
  deve ser equivalente ao comportamento atual do harness Codex.
- Se `assemble` do mecanismo de contexto falhar, o Codex deve continuar com o
  caminho original do prompt.
- Bindings existentes de thread do Codex devem continuar válidos.
- O fingerprinting dinâmico de ferramentas não deve incluir a saída do mecanismo de contexto; caso contrário,
  toda mudança de contexto poderia forçar uma nova thread do Codex. Apenas o catálogo de ferramentas
  deve afetar o fingerprint dinâmico de ferramentas.

## Questões em aberto

1. O contexto montado deve ser injetado inteiramente no prompt do usuário, inteiramente
   nas instruções de desenvolvedor, ou dividido?

   Recomendação: dividido. Coloque `systemPromptAddition` nas instruções de desenvolvedor;
   coloque o contexto de transcrição montado no wrapper do prompt do usuário. Isso corresponde melhor
   ao protocolo atual do Codex sem modificar o histórico nativo da thread.

2. A Compactação nativa do Codex deve ser desabilitada quando um mecanismo de contexto controla
   a Compactação?

   Recomendação: não, pelo menos inicialmente. A Compactação nativa do Codex ainda pode ser
   necessária para manter viva a thread do servidor de apps. Mas ela deve ser relatada como
   Compactação nativa do Codex, não como Compactação do mecanismo de contexto.

3. `before_prompt_build` deve executar antes ou depois da montagem do mecanismo de contexto?

   Recomendação: depois da projeção do mecanismo de contexto para Codex, para que hooks genéricos de harness
   vejam as instruções de prompt/desenvolvedor reais que o Codex receberá. Se a paridade com o PI
   exigir o oposto, codifique a ordem escolhida em testes e documente isso
   aqui.

4. O servidor de apps do Codex pode aceitar no futuro uma substituição estruturada de contexto/histórico?

   Desconhecido. Se puder, substitua a camada de projeção de texto por esse protocolo e
   mantenha inalteradas as chamadas do ciclo de vida.

## Critérios de aceitação

- Um turno de harness incorporado `codex/*` invoca o ciclo de vida de
  assemble do mecanismo de contexto selecionado.
- Um `systemPromptAddition` do mecanismo de contexto afeta as instruções de desenvolvedor do Codex.
- O contexto montado afeta a entrada do turno do Codex de forma determinística.
- Turnos bem-sucedidos do Codex chamam `afterTurn` ou fallback para ingest.
- Turnos bem-sucedidos do Codex executam manutenção de turno do mecanismo de contexto.
- Turnos com falha/abortados/yield-abortados não executam manutenção de turno.
- A Compactação controlada pelo mecanismo de contexto permanece principal para o estado do OpenClaw/Plugin.
- A Compactação nativa do Codex permanece auditável como comportamento nativo do Codex.
- O comportamento existente do mecanismo de contexto do PI permanece inalterado.
- O comportamento existente do harness Codex permanece inalterado quando nenhum mecanismo de contexto não legado
  é selecionado ou quando a montagem falha.
