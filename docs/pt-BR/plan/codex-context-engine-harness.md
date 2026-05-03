---
read_when:
    - Você está integrando o comportamento de ciclo de vida do mecanismo de contexto ao arcabouço do Codex
    - Você precisa do lossless-claw ou de outro Plugin context-engine para trabalhar com sessões de estrutura de testes incorporada codex/*
    - Você está comparando o comportamento de contexto do PI incorporado e do servidor de aplicativo do Codex
summary: Especificação para fazer com que o harness de app-server incluído do Codex respeite os plugins de mecanismo de contexto do OpenClaw
title: Porta do mecanismo de contexto do Codex Harness
x-i18n:
    generated_at: "2026-05-03T05:50:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Especificação de implementação em rascunho.

## Objetivo

Fazer com que o harness do app-server Codex incluído honre o mesmo contrato de ciclo de vida do context-engine do OpenClaw que as rodadas de PI embutidas já honram.

Uma sessão que usa `agents.defaults.embeddedHarness.runtime: "codex"` ou um modelo `codex/*` ainda deve permitir que o Plugin de context-engine selecionado, como `lossless-claw`, controle a montagem de contexto, a ingestão pós-rodada, a manutenção e a política de Compaction em nível OpenClaw até onde o limite do app-server Codex permitir.

## Não objetivos

- Não reimplementar os componentes internos do app-server Codex.
- Não fazer a Compaction nativa de threads do Codex produzir um resumo do lossless-claw.
- Não exigir que modelos não Codex usem o harness Codex.
- Não alterar o comportamento de sessões ACP/acpx. Esta especificação é apenas para o caminho de harness de agente embutido não ACP.
- Não fazer Plugins de terceiros registrarem fábricas de extensão do app-server Codex; o limite de confiança de Plugins incluídos existente permanece inalterado.

## Arquitetura atual

O loop de execução embutido resolve o mecanismo de contexto configurado uma vez por execução antes de selecionar um harness concreto de baixo nível:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins de context-engine
  - chama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` para `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega para o harness de agente selecionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

O harness do app-server Codex é registrado pelo Plugin Codex incluído:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

A implementação do harness Codex recebe os mesmos `EmbeddedRunAttemptParams` que as tentativas baseadas em PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Isso significa que o ponto de hook necessário está em código controlado pelo OpenClaw. O limite externo é o próprio protocolo do app-server Codex: o OpenClaw pode controlar o que envia para `thread/start`, `thread/resume` e `turn/start`, e pode observar notificações, mas não pode alterar o armazenamento interno de threads do Codex nem o compactador nativo.

## Lacuna atual

Tentativas de PI embutidas chamam o ciclo de vida do context-engine diretamente:

- bootstrap/manutenção antes da tentativa
- montagem antes da chamada ao modelo
- afterTurn ou ingestão após a tentativa
- manutenção depois de uma rodada bem-sucedida
- Compaction do context-engine para mecanismos que possuem a Compaction

Código de PI relevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

As tentativas do app-server Codex atualmente executam hooks genéricos de harness de agente e espelham a transcrição, mas não chamam `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` nem `params.contextEngine.maintain`.

Código Codex relevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desejado

Para rodadas do harness Codex, o OpenClaw deve preservar este ciclo de vida:

1. Ler a transcrição espelhada da sessão OpenClaw.
2. Fazer bootstrap do context-engine ativo quando existir um arquivo de sessão anterior.
3. Executar manutenção de bootstrap quando disponível.
4. Montar contexto usando o context-engine ativo.
5. Converter o contexto montado em entradas compatíveis com Codex.
6. Iniciar ou retomar a thread Codex com instruções de desenvolvedor que incluam qualquer `systemPromptAddition` do context-engine.
7. Iniciar a rodada Codex com o prompt montado voltado ao usuário.
8. Espelhar o resultado Codex de volta para a transcrição OpenClaw.
9. Chamar `afterTurn` se implementado; caso contrário, `ingestBatch`/`ingest`, usando o snapshot da transcrição espelhada.
10. Executar manutenção de rodada após rodadas bem-sucedidas e não abortadas.
11. Preservar sinais de Compaction nativa do Codex e hooks de Compaction do OpenClaw.

## Restrições de design

### O app-server Codex permanece canônico para o estado nativo da thread

O Codex possui sua thread nativa e qualquer histórico estendido interno. O OpenClaw não deve tentar alterar o histórico interno do app-server exceto por chamadas de protocolo compatíveis.

O espelho de transcrição do OpenClaw permanece a fonte para recursos do OpenClaw:

- histórico de chat
- busca
- escrituração de `/new` e `/reset`
- troca futura de modelo ou harness
- estado de Plugin de context-engine

### A montagem do context-engine deve ser projetada em entradas Codex

A interface do context-engine retorna `AgentMessage[]` do OpenClaw, não um patch de thread Codex. `turn/start` do app-server Codex aceita uma entrada de usuário atual, enquanto `thread/start` e `thread/resume` aceitam instruções de desenvolvedor.

Portanto, a implementação precisa de uma camada de projeção. A primeira versão segura deve evitar fingir que pode substituir o histórico interno do Codex. Ela deve injetar o contexto montado como material determinístico de prompt/instrução de desenvolvedor em torno da rodada atual.

### A estabilidade do cache de prompt importa

Para mecanismos como lossless-claw, o contexto montado deve ser determinístico para entradas inalteradas. Não adicione timestamps, IDs aleatórios nem ordenação não determinística ao texto de contexto gerado.

### A semântica de seleção de runtime não muda

A seleção de harness permanece como está:

- `runtime: "pi"` força PI
- `runtime: "codex"` seleciona o harness Codex registrado
- `runtime: "auto"` permite que harnesses de Plugin reivindiquem provedores compatíveis
- execuções `auto` sem correspondência usam PI

Este trabalho altera o que acontece depois que o harness Codex é selecionado.

## Plano de implementação

### 1. Exportar ou realocar helpers reutilizáveis de tentativa de context-engine

Hoje os helpers reutilizáveis de ciclo de vida ficam sob o executor PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

O Codex não deve importar de um caminho de implementação cujo nome implica PI se pudermos evitar.

Crie um módulo neutro para harness, por exemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mova ou reexporte:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- um pequeno wrapper em torno de `runContextEngineMaintenance`

Mantenha as importações de PI funcionando, seja reexportando dos arquivos antigos ou atualizando os pontos de chamada de PI no mesmo PR.

Os nomes de helpers neutros não devem mencionar PI.

Nomes sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Adicionar um helper de projeção de contexto Codex

Adicione um novo módulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceitar o `AgentMessage[]` montado, o histórico espelhado original e o prompt atual.
- Determinar qual contexto pertence às instruções de desenvolvedor versus à entrada de usuário atual.
- Preservar o prompt de usuário atual como a solicitação acionável final.
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
- Excluir prompt de usuário atual duplicado se ele já aparecer no final.

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

Isso é menos elegante que uma cirurgia nativa no histórico Codex, mas é implementável dentro do OpenClaw e preserva a semântica do context-engine.

Melhoria futura: se o app-server Codex expuser um protocolo para substituir ou suplementar o histórico de thread, troque esta camada de projeção para usar essa API.

### 3. Conectar bootstrap antes da inicialização da thread Codex

Em `extensions/codex/src/app-server/run-attempt.ts`:

- Ler o histórico de sessão espelhado como hoje.
- Determinar se o arquivo de sessão existia antes desta execução. Prefira um helper que verifica `fs.stat(params.sessionFile)` antes de escritas de espelhamento.
- Abrir um `SessionManager` ou usar um adaptador estreito de gerenciador de sessão se o helper exigir.
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

Use a mesma convenção de `sessionKey` que a ponte de ferramentas Codex e o espelho de transcrição. Hoje o Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` ou `params.sessionId`; use isso de forma consistente, a menos que haja um motivo para preservar `params.sessionKey` bruto.

### 4. Conectar montagem antes de `thread/start` / `thread/resume` e `turn/start`

Em `runCodexAppServerAttempt`:

1. Construir ferramentas dinâmicas primeiro, para que o context-engine veja os nomes reais das ferramentas disponíveis.
2. Ler o histórico de sessão espelhado.
3. Executar `assemble(...)` do context-engine quando `params.contextEngine` existir.
4. Projetar o resultado montado em:
   - adição às instruções de desenvolvedor
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

deve se tornar ciente de contexto:

1. calcular instruções de desenvolvedor base com `buildDeveloperInstructions(params)`
2. aplicar montagem/projeção do context-engine
3. executar `before_prompt_build` com o prompt/instruções de desenvolvedor projetados

Essa ordem permite que hooks genéricos de prompt vejam o mesmo prompt que o Codex receberá. Se precisarmos de paridade estrita com PI, execute a montagem do context-engine antes da composição de hooks, porque PI aplica `systemPromptAddition` do context-engine ao prompt de sistema final depois de seu pipeline de prompt. A invariável importante é que tanto o context-engine quanto os hooks recebam uma ordem determinística e documentada.

Ordem recomendada para a primeira implementação:

1. `buildDeveloperInstructions(params)`
2. `assemble()` do context-engine
3. anexar/prepender `systemPromptAddition` às instruções de desenvolvedor
4. projetar mensagens montadas no texto do prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passar as instruções de desenvolvedor finais para `startOrResumeThread(...)`
7. passar o texto de prompt final para `buildTurnStartParams(...)`

A especificação deve ser codificada em testes para que mudanças futuras não a reordenem por acidente.

### 5. Preservar formatação estável para cache de prompt

O helper de projeção deve produzir saída byte-estável para entradas idênticas:

- ordem estável de mensagens
- rótulos de função estáveis
- nenhum timestamp gerado
- nenhum vazamento de ordem de chaves de objeto
- nenhum delimitador aleatório
- nenhum ID por execução

Use delimitadores fixos e seções explícitas.

### 6. Conectar pós-rodada depois do espelhamento de transcrição

Codex's `CodexAppServerEventProjector` constrói um `messagesSnapshot` local para o turno atual. `mirrorTranscriptBestEffort(...)` grava esse snapshot no espelho de transcrição do OpenClaw.

Depois que o espelhamento tem sucesso ou falha, chame o finalizador do mecanismo de contexto com o melhor snapshot de mensagens disponível:

- Prefira o contexto completo da sessão espelhada após a gravação, porque `afterTurn`
  espera o snapshot da sessão, não apenas o turno atual.
- Faça fallback para `historyMessages + result.messagesSnapshot` se o arquivo da sessão
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

Se o espelhamento falhar, ainda chame `afterTurn` com o snapshot de fallback, mas registre
que o mecanismo de contexto está ingerindo dados do turno de fallback.

### 7. Normalize o uso e o contexto de runtime do cache de prompt

Os resultados do Codex incluem uso normalizado a partir das notificações de tokens do app-server quando
disponíveis. Passe esse uso para o contexto de runtime do mecanismo de contexto.

Se o app-server do Codex eventualmente expuser detalhes de leitura/gravação de cache, mapeie-os para
`ContextEnginePromptCacheInfo`. Até lá, omita `promptCache` em vez de
inventar zeros.

### 8. Política de Compaction

Há dois sistemas de Compaction:

1. `compact()` do mecanismo de contexto do OpenClaw
2. `thread/compact/start` nativo do app-server do Codex

Não os misture silenciosamente.

#### `/compact` e Compaction explícita do OpenClaw

Quando o mecanismo de contexto selecionado tiver `info.ownsCompaction === true`, a Compaction explícita do OpenClaw deve preferir o resultado de `compact()` do mecanismo de contexto para o espelho de transcrição do OpenClaw e o estado do Plugin.

Quando o harness Codex selecionado tiver uma vinculação de thread nativa, também podemos solicitar Compaction nativa do Codex em melhor esforço para manter a thread do app-server saudável, mas isso deve ser relatado como uma ação de backend separada nos detalhes.

Comportamento recomendado:

- Se `contextEngine.info.ownsCompaction === true`:
  - chame `compact()` do mecanismo de contexto primeiro
  - depois chame a Compaction nativa do Codex em melhor esforço quando existir uma vinculação de thread
  - retorne o resultado do mecanismo de contexto como resultado principal
  - inclua o status da Compaction nativa do Codex em `details.codexNativeCompaction`
- Se o mecanismo de contexto ativo não for dono da Compaction:
  - preserve o comportamento atual de Compaction nativa do Codex

Isso provavelmente exige alterar `extensions/codex/src/app-server/compact.ts` ou
envolvê-lo a partir do caminho genérico de Compaction, dependendo de onde
`maybeCompactAgentHarnessSession(...)` é invocado.

#### Eventos `contextCompaction` nativos do Codex durante o turno

O Codex pode emitir eventos de item `contextCompaction` durante um turno. Mantenha a emissão atual de hooks antes/depois da Compaction em `event-projector.ts`, mas não trate isso como uma Compaction concluída do mecanismo de contexto.

Para mecanismos que são donos da Compaction, emita um diagnóstico explícito quando o Codex executar Compaction nativa mesmo assim:

- nome do stream/evento: o stream `compaction` existente é aceitável
- detalhes: `{ backend: "codex-app-server", ownsCompaction: true }`

Isso torna a separação auditável.

### 9. Redefinição de sessão e comportamento de vinculação

O `reset(...)` existente do harness Codex limpa a vinculação do app-server do Codex no arquivo de sessão do OpenClaw. Preserve esse comportamento.

Também garanta que a limpeza de estado do mecanismo de contexto continue acontecendo pelos caminhos existentes do ciclo de vida da sessão do OpenClaw. Não adicione limpeza específica do Codex a menos que o ciclo de vida do mecanismo de contexto atualmente perca eventos de reset/delete para todos os harnesses.

### 10. Tratamento de erros

Siga a semântica de PI:

- falhas de bootstrap avisam e continuam
- falhas de assembly avisam e fazem fallback para mensagens/prompt do pipeline não montado
- falhas de afterTurn/ingest avisam e marcam a finalização pós-turno como malsucedida
- manutenção roda apenas após turnos bem-sucedidos, não abortados e sem yield
- erros de Compaction não devem ser tentados novamente como prompts novos

Adições específicas do Codex:

- Se a projeção de contexto falhar, avise e faça fallback para o prompt original.
- Se o espelho de transcrição falhar, ainda tente a finalização do mecanismo de contexto com
  mensagens de fallback.
- Se a Compaction nativa do Codex falhar depois que a Compaction do mecanismo de contexto tiver sucesso,
  não falhe toda a Compaction do OpenClaw quando o mecanismo de contexto for primário.

## Plano de testes

### Testes unitários

Adicione testes em `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - O Codex chama `bootstrap` quando existe um arquivo de sessão.
   - O Codex chama `assemble` com mensagens espelhadas, orçamento de tokens, nomes de ferramentas,
     modo de citações, id do modelo e prompt.
   - `systemPromptAddition` é incluído nas instruções de desenvolvedor.
   - As mensagens montadas são projetadas no prompt antes da solicitação atual.
   - O Codex chama `afterTurn` após o espelhamento da transcrição.
   - Sem `afterTurn`, o Codex chama `ingestBatch` ou `ingest` por mensagem.
   - A manutenção do turno roda após turnos bem-sucedidos.
   - A manutenção do turno não roda em erro de prompt, aborto ou yield abortado.

2. `context-engine-projection.test.ts`
   - saída estável para entradas idênticas
   - nenhum prompt atual duplicado quando o histórico montado o inclui
   - lida com histórico vazio
   - preserva a ordem dos papéis
   - inclui a adição de prompt de sistema apenas nas instruções de desenvolvedor

3. `compact.context-engine.test.ts`
   - o resultado primário do mecanismo de contexto dono vence
   - o status da Compaction nativa do Codex aparece nos detalhes quando também tentado
   - falha nativa do Codex não falha a Compaction do mecanismo de contexto dono
   - mecanismo de contexto não dono preserva o comportamento atual de Compaction nativa

### Testes existentes a atualizar

- `extensions/codex/src/app-server/run-attempt.test.ts`, se presente; caso contrário,
  os testes de execução do app-server Codex mais próximos.
- `extensions/codex/src/app-server/event-projector.test.ts` somente se os detalhes do evento de Compaction
  mudarem.
- `src/agents/harness/selection.test.ts` não deve precisar de mudanças a menos que o comportamento de configuração
  mude; ele deve permanecer estável.
- Os testes do mecanismo de contexto de PI devem continuar passando sem alterações.

### Testes de integração / live

Adicione ou estenda testes smoke live do harness Codex:

- configure `plugins.slots.contextEngine` para um mecanismo de teste
- configure `agents.defaults.model` para um modelo `codex/*`
- configure `agents.defaults.embeddedHarness.runtime = "codex"`
- confirme que o mecanismo de teste observou:
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - manutenção

Evite exigir lossless-claw nos testes core do OpenClaw. Use um pequeno Plugin falso de mecanismo de contexto dentro do repositório.

## Observabilidade

Adicione logs de depuração em torno das chamadas de ciclo de vida do mecanismo de contexto do Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` com motivo
- `codex native compaction completed alongside context-engine compaction`

Evite registrar prompts completos ou conteúdo de transcrições.

Adicione campos estruturados quando útil:

- `sessionId`
- `sessionKey` redigido ou omitido de acordo com a prática de logging existente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migração / compatibilidade

Isto deve ser retrocompatível:

- Se nenhum mecanismo de contexto estiver configurado, o comportamento legado do mecanismo de contexto deve ser
  equivalente ao comportamento atual do harness Codex.
- Se `assemble` do mecanismo de contexto falhar, o Codex deve continuar com o caminho de prompt original.
- As vinculações de thread existentes do Codex devem permanecer válidas.
- A impressão digital dinâmica de ferramentas não deve incluir a saída do mecanismo de contexto; caso contrário,
  cada mudança de contexto poderia forçar uma nova thread do Codex. Apenas o catálogo de ferramentas
  deve afetar a impressão digital dinâmica de ferramentas.

## Perguntas em aberto

1. O contexto montado deve ser injetado inteiramente no prompt do usuário, inteiramente
   nas instruções de desenvolvedor, ou dividido?

   Recomendação: dividir. Coloque `systemPromptAddition` nas instruções de desenvolvedor;
   coloque o contexto de transcrição montado no wrapper do prompt do usuário. Isso corresponde melhor
   ao protocolo atual do Codex sem alterar o histórico nativo da thread.

2. A Compaction nativa do Codex deve ser desativada quando um mecanismo de contexto é dono da
   Compaction?

   Recomendação: não, inicialmente. A Compaction nativa do Codex ainda pode ser
   necessária para manter a thread do app-server ativa. Mas ela deve ser relatada como
   Compaction nativa do Codex, não como Compaction do mecanismo de contexto.

3. `before_prompt_build` deve rodar antes ou depois do assembly do mecanismo de contexto?

   Recomendação: depois da projeção do mecanismo de contexto para o Codex, para que hooks genéricos do harness
   vejam o prompt/instruções de desenvolvedor reais que o Codex receberá. Se a paridade com PI
   exigir o oposto, codifique a ordem escolhida em testes e documente-a aqui.

4. O app-server do Codex pode aceitar uma futura substituição estruturada de contexto/histórico?

   Desconhecido. Se puder, substitua a camada de projeção textual por esse protocolo e
   mantenha as chamadas de ciclo de vida inalteradas.

## Critérios de aceitação

- Um turno de harness embutido `codex/*` invoca o ciclo de vida de assemble do mecanismo de contexto selecionado.
- Um `systemPromptAddition` do mecanismo de contexto afeta as instruções de desenvolvedor do Codex.
- O contexto montado afeta a entrada do turno do Codex de forma determinística.
- Turnos bem-sucedidos do Codex chamam `afterTurn` ou fallback de ingest.
- Turnos bem-sucedidos do Codex rodam a manutenção de turno do mecanismo de contexto.
- Turnos com falha/abortados/com yield abortado não rodam a manutenção de turno.
- A Compaction de propriedade do mecanismo de contexto permanece primária para o estado do OpenClaw/Plugin.
- A Compaction nativa do Codex permanece auditável como comportamento nativo do Codex.
- O comportamento existente do mecanismo de contexto de PI permanece inalterado.
- O comportamento existente do harness Codex permanece inalterado quando nenhum mecanismo de contexto não legado
  é selecionado ou quando o assembly falha.
