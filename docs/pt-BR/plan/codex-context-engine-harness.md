---
read_when:
    - Você está integrando o comportamento de ciclo de vida do mecanismo de contexto ao harness Codex
    - Você precisa que o lossless-claw ou outro Plugin de mecanismo de contexto funcione com sessões do harness embutido `codex/*`
    - Você está comparando o comportamento de contexto entre o Pi embutido e o servidor de aplicativo Codex
summary: Especificação para fazer com que o harness empacotado do servidor de aplicativo Codex respeite Plugins de mecanismo de contexto do OpenClaw
title: Porta do mecanismo de contexto do harness Codex
x-i18n:
    generated_at: "2026-04-25T13:49:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Status

Especificação de implementação em rascunho.

## Objetivo

Fazer com que o harness empacotado do servidor de aplicativo Codex respeite o mesmo contrato de
ciclo de vida do mecanismo de contexto do OpenClaw que os turnos do Pi embutido já respeitam.

Uma sessão usando `agents.defaults.embeddedHarness.runtime: "codex"` ou um
modelo `codex/*` ainda deve permitir que o Plugin de mecanismo de contexto selecionado, como
`lossless-claw`, controle a montagem de contexto, ingestão após o turno, manutenção e
política de Compaction no nível do OpenClaw, na medida permitida pelo limite do servidor de aplicativo Codex.

## Não objetivos

- Não reimplementar partes internas do servidor de aplicativo Codex.
- Não fazer a compaction nativa de thread do Codex produzir um resumo do lossless-claw.
- Não exigir que modelos não Codex usem o harness Codex.
- Não alterar o comportamento de sessão ACP/acpx. Esta especificação é para o
  caminho de harness de agente embutido não ACP apenas.
- Não fazer com que Plugins de terceiros registrem fábricas de extensão do servidor de aplicativo Codex;
  o limite de confiança existente de Plugin empacotado permanece inalterado.

## Arquitetura atual

O loop de execução embutido resolve o mecanismo de contexto configurado uma vez por execução antes de
selecionar um harness concreto de baixo nível:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins de mecanismo de contexto
  - chama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` para
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega ao harness de agente selecionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

O harness do servidor de aplicativo Codex é registrado pelo Plugin Codex empacotado:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

A implementação do harness Codex recebe o mesmo `EmbeddedRunAttemptParams`
que tentativas com suporte de Pi:

- `extensions/codex/src/app-server/run-attempt.ts`

Isso significa que o ponto de hook necessário está em código controlado pelo OpenClaw. O limite
externo é o próprio protocolo do servidor de aplicativo Codex: o OpenClaw pode controlar o que ele
envia para `thread/start`, `thread/resume` e `turn/start`, e pode observar
notificações, mas não pode alterar o armazenamento interno de threads do Codex nem seu compactador nativo.

## Lacuna atual

Tentativas do Pi embutido chamam diretamente o ciclo de vida do mecanismo de contexto:

- bootstrap/manutenção antes da tentativa
- assemble antes da chamada do modelo
- afterTurn ou ingest após a tentativa
- manutenção após um turno bem-sucedido
- compaction do mecanismo de contexto para mecanismos que controlam a Compaction

Código relevante do Pi:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Tentativas do servidor de aplicativo Codex atualmente executam hooks genéricos de harness de agente e espelham
a transcrição, mas não chamam `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ou
`params.contextEngine.maintain`.

Código relevante do Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desejado

Para turnos do harness Codex, o OpenClaw deve preservar este ciclo de vida:

1. Ler a transcrição espelhada da sessão OpenClaw.
2. Fazer bootstrap do mecanismo de contexto ativo quando existir um arquivo de sessão anterior.
3. Executar manutenção de bootstrap quando disponível.
4. Montar o contexto usando o mecanismo de contexto ativo.
5. Converter o contexto montado em entradas compatíveis com Codex.
6. Iniciar ou retomar a thread Codex com instruções de desenvolvedor que incluam qualquer
   `systemPromptAddition` do mecanismo de contexto.
7. Iniciar o turno Codex com o prompt voltado ao usuário montado.
8. Espelhar o resultado do Codex de volta na transcrição do OpenClaw.
9. Chamar `afterTurn` se implementado; caso contrário `ingestBatch`/`ingest`, usando o
   snapshot da transcrição espelhada.
10. Executar manutenção do turno após turnos não abortados bem-sucedidos.
11. Preservar sinais de compaction nativa do Codex e hooks de Compaction do OpenClaw.

## Restrições de design

### O servidor de aplicativo Codex continua canônico para o estado nativo da thread

O Codex controla sua thread nativa e qualquer histórico estendido interno. O OpenClaw não deve
tentar mutar o histórico interno do servidor de aplicativo, exceto por meio de chamadas de protocolo compatíveis.

O espelho de transcrição do OpenClaw continua sendo a fonte para recursos do OpenClaw:

- histórico de chat
- busca
- bookkeeping de `/new` e `/reset`
- futura troca de modelo ou harness
- estado do Plugin de mecanismo de contexto

### A montagem do mecanismo de contexto deve ser projetada em entradas do Codex

A interface do mecanismo de contexto retorna `AgentMessage[]` do OpenClaw, não um patch de
thread do Codex. `turn/start` do servidor de aplicativo Codex aceita uma entrada atual do usuário, enquanto
`thread/start` e `thread/resume` aceitam instruções de desenvolvedor.

Portanto, a implementação precisa de uma camada de projeção. A primeira versão segura
deve evitar fingir que pode substituir o histórico interno do Codex. Ela deve injetar o
contexto montado como material determinístico de prompt/instrução de desenvolvedor em torno
do turno atual.

### A estabilidade do cache de prompt importa

Para mecanismos como lossless-claw, o contexto montado deve ser determinístico
para entradas inalteradas. Não adicione timestamps, IDs aleatórios nem ordenação não determinística
ao texto de contexto gerado.

### A semântica de fallback do Pi não muda

A seleção de harness permanece como está:

- `runtime: "pi"` força Pi
- `runtime: "codex"` seleciona o harness Codex registrado
- `runtime: "auto"` permite que harnesses de Plugin reivindiquem provedores compatíveis
- `fallback: "none"` desativa o fallback para Pi quando nenhum harness de Plugin corresponde

Este trabalho altera o que acontece depois que o harness Codex é selecionado.

## Plano de implementação

### 1. Exportar ou realocar helpers reutilizáveis de tentativa do mecanismo de contexto

Hoje os helpers reutilizáveis de ciclo de vida ficam sob o runner Pi:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

O Codex não deve importar de um caminho de implementação cujo nome implique Pi, se
pudermos evitar isso.

Crie um módulo neutro de harness, por exemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mova ou reexporte:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- um pequeno wrapper em torno de `runContextEngineMaintenance`

Mantenha as importações do Pi funcionando, seja reexportando dos arquivos antigos ou atualizando os
call sites do Pi no mesmo PR.

Os nomes neutros dos helpers não devem mencionar Pi.

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

- Aceitar `AgentMessage[]` montados, histórico original espelhado e o prompt atual.
- Determinar qual contexto pertence às instruções de desenvolvedor versus à entrada atual do usuário.
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

- Colocar `systemPromptAddition` em instruções de desenvolvedor.
- Colocar o contexto de transcrição montado antes do prompt atual em `promptText`.
- Rotulá-lo claramente como contexto montado do OpenClaw.
- Manter o prompt atual por último.
- Excluir prompt atual do usuário duplicado se ele já aparecer no final.

Exemplo de formato de prompt:

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

Isso é menos elegante do que uma cirurgia nativa no histórico do Codex, mas é implementável
dentro do OpenClaw e preserva a semântica do mecanismo de contexto.

Melhoria futura: se o servidor de aplicativo Codex expuser um protocolo para substituir ou
suplementar o histórico da thread, troque essa camada de projeção para usar essa API.

### 3. Integrar bootstrap antes do início da thread Codex

Em `extensions/codex/src/app-server/run-attempt.ts`:

- Ler o histórico de sessão espelhado como hoje.
- Determinar se o arquivo de sessão existia antes desta execução. Prefira um helper
  que verifique `fs.stat(params.sessionFile)` antes de gravações de espelhamento.
- Abrir um `SessionManager` ou usar um adaptador estreito de gerenciador de sessão se o helper
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

Use a mesma convenção de `sessionKey` que a bridge de ferramentas do Codex e o espelho de transcrição. Hoje o Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` ou
`params.sessionId`; use isso de forma consistente, a menos que haja motivo para preservar `params.sessionKey` bruto.

### 4. Integrar assemble antes de `thread/start` / `thread/resume` e `turn/start`

Em `runCodexAppServerAttempt`:

1. Construir ferramentas dinâmicas primeiro, para que o mecanismo de contexto veja os nomes reais
   das ferramentas disponíveis.
2. Ler o histórico de sessão espelhado.
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

1. calcular instruções-base de desenvolvedor com `buildDeveloperInstructions(params)`
2. aplicar montagem/projeção do mecanismo de contexto
3. executar `before_prompt_build` com o prompt/instruções de desenvolvedor projetados

Essa ordem permite que hooks genéricos de prompt vejam o mesmo prompt que o Codex receberá. Se
precisarmos de paridade estrita com o Pi, execute a montagem do mecanismo de contexto antes da composição de hooks,
porque o Pi aplica `systemPromptAddition` do mecanismo de contexto ao prompt final do sistema após seu pipeline de prompt. O invariante importante é que tanto o mecanismo de contexto quanto os hooks recebam uma ordem determinística e documentada.

Ordem recomendada para a primeira implementação:

1. `buildDeveloperInstructions(params)`
2. `assemble()` do mecanismo de contexto
3. anexar/prepender `systemPromptAddition` às instruções de desenvolvedor
4. projetar mensagens montadas no texto do prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passar as instruções finais de desenvolvedor para `startOrResumeThread(...)`
7. passar o texto final do prompt para `buildTurnStartParams(...)`

A especificação deve ser codificada em testes para que mudanças futuras não reordenem isso
por acidente.

### 5. Preservar formatação estável do cache de prompt

O helper de projeção deve produzir saída estável em bytes para entradas idênticas:

- ordem estável das mensagens
- rótulos estáveis de função
- sem timestamps gerados
- sem vazamento de ordem de chaves de objeto
- sem delimitadores aleatórios
- sem IDs por execução

Use delimitadores fixos e seções explícitas.

### 6. Integrar pós-turno após o espelhamento da transcrição

O `CodexAppServerEventProjector` do Codex constrói um `messagesSnapshot` local para o
turno atual. `mirrorTranscriptBestEffort(...)` grava esse snapshot no espelho de transcrição do OpenClaw.

Após o espelhamento ter êxito ou falhar, chame o finalizador do mecanismo de contexto com o
melhor snapshot de mensagens disponível:

- Prefira o contexto completo da sessão espelhada após a gravação, porque `afterTurn`
  espera o snapshot da sessão, não apenas o turno atual.
- Recorra a `historyMessages + result.messagesSnapshot` se o arquivo de sessão
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
que o mecanismo de contexto está fazendo ingest a partir de dados de fallback do turno.

### 7. Normalizar contexto de runtime de uso e cache de prompt

Os resultados do Codex incluem uso normalizado a partir de notificações de token do servidor de aplicativo quando
disponível. Passe esse uso para o contexto de runtime do mecanismo de contexto.

Se o servidor de aplicativo Codex eventualmente expuser detalhes de leitura/gravação de cache, mapeie-os para
`ContextEnginePromptCacheInfo`. Até lá, omita `promptCache` em vez de
inventar zeros.

### 8. Política de Compaction

Existem dois sistemas de compaction:

1. `compact()` do mecanismo de contexto do OpenClaw
2. `thread/compact/start` nativo do servidor de aplicativo Codex

Não os confunda silenciosamente.

#### `/compact` e compaction explícita do OpenClaw

Quando o mecanismo de contexto selecionado tiver `info.ownsCompaction === true`, a compaction
explícita do OpenClaw deve preferir o resultado de `compact()` do mecanismo de contexto para o espelho de transcrição do OpenClaw e para o estado do Plugin.

Quando o harness Codex selecionado tiver um vínculo de thread nativo, poderemos adicionalmente
solicitar compaction nativa do Codex para manter a thread do servidor de aplicativo saudável, mas isso
deve ser informado como uma ação de backend separada em detalhes.

Comportamento recomendado:

- Se `contextEngine.info.ownsCompaction === true`:
  - chame `compact()` do mecanismo de contexto primeiro
  - depois chame a compaction nativa do Codex por melhor esforço quando existir um vínculo de thread
  - retorne o resultado do mecanismo de contexto como resultado primário
  - inclua o status da compaction nativa do Codex em `details.codexNativeCompaction`
- Se o mecanismo de contexto ativo não controlar a Compaction:
  - preserve o comportamento atual da compaction nativa do Codex

Isso provavelmente exige alterar `extensions/codex/src/app-server/compact.ts` ou
encapsulá-lo a partir do caminho genérico de compaction, dependendo de onde
`maybeCompactAgentHarnessSession(...)` é invocado.

#### Eventos `contextCompaction` nativos do Codex durante o turno

O Codex pode emitir eventos de item `contextCompaction` durante um turno. Mantenha a emissão atual
de hook before/after compaction em `event-projector.ts`, mas não trate isso como uma
compaction concluída do mecanismo de contexto.

Para mecanismos que controlam a Compaction, emita um diagnóstico explícito quando o Codex executar
compaction nativa mesmo assim:

- nome de stream/evento: a stream `compaction` existente é aceitável
- detalhes: `{ backend: "codex-app-server", ownsCompaction: true }`

Isso torna a separação auditável.

### 9. Comportamento de redefinição e vínculo de sessão

O `reset(...)` existente do harness Codex limpa o vínculo do servidor de aplicativo Codex do arquivo de sessão do OpenClaw. Preserve esse comportamento.

Também garanta que a limpeza de estado do mecanismo de contexto continue acontecendo pelos caminhos
existentes de ciclo de vida de sessão do OpenClaw. Não adicione limpeza específica do Codex, a menos
que o ciclo de vida do mecanismo de contexto atualmente deixe de capturar eventos de reset/delete para todos os harnesses.

### 10. Tratamento de erros

Siga a semântica do Pi:

- falhas de bootstrap geram aviso e continuam
- falhas de assemble geram aviso e recorrem às mensagens/prompt não montados do pipeline
- falhas de afterTurn/ingest geram aviso e marcam a finalização pós-turno como malsucedida
- manutenção roda apenas após turnos bem-sucedidos, não abortados e sem yield abort
- erros de compaction não devem ser repetidos como prompts novos

Adições específicas do Codex:

- Se a projeção de contexto falhar, gere aviso e recorra ao prompt original.
- Se o espelho de transcrição falhar, ainda tente a finalização do mecanismo de contexto com
  mensagens de fallback.
- Se a compaction nativa do Codex falhar depois que a compaction do mecanismo de contexto tiver êxito,
  não falhe toda a compaction do OpenClaw quando o mecanismo de contexto for primário.

## Plano de testes

### Testes unitários

Adicione testes em `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex chama `bootstrap` quando existe um arquivo de sessão.
   - Codex chama `assemble` com mensagens espelhadas, orçamento de tokens, nomes de ferramentas,
     modo de citações, ID do modelo e prompt.
   - `systemPromptAddition` é incluído nas instruções de desenvolvedor.
   - Mensagens montadas são projetadas no prompt antes da solicitação atual.
   - Codex chama `afterTurn` após o espelhamento da transcrição.
   - Sem `afterTurn`, o Codex chama `ingestBatch` ou `ingest` por mensagem.
   - A manutenção do turno roda após turnos bem-sucedidos.
   - A manutenção do turno não roda em erro de prompt, abort ou yield abort.

2. `context-engine-projection.test.ts`
   - saída estável para entradas idênticas
   - sem prompt atual duplicado quando o histórico montado o inclui
   - trata histórico vazio
   - preserva a ordem das funções
   - inclui a adição de prompt do sistema apenas nas instruções de desenvolvedor

3. `compact.context-engine.test.ts`
   - o resultado primário do mecanismo de contexto que controla a Compaction prevalece
   - o status da compaction nativa do Codex aparece em detalhes quando também é tentada
   - falha nativa do Codex não faz a compaction do mecanismo de contexto que controla a Compaction falhar
   - mecanismo de contexto que não controla a Compaction preserva o comportamento atual de compaction nativa

### Testes existentes a atualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` se existir; caso contrário,
  os testes de execução mais próximos do servidor de aplicativo Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` apenas se os detalhes do evento de compaction
  mudarem.
- `src/agents/harness/selection.test.ts` não deve precisar de mudanças, a menos que o comportamento
  de configuração mude; ele deve permanecer estável.
- Testes do mecanismo de contexto do Pi devem continuar passando sem alterações.

### Testes de integração / ao vivo

Adicione ou estenda testes smoke ao vivo do harness Codex:

- configure `plugins.slots.contextEngine` para um mecanismo de teste
- configure `agents.defaults.model` para um modelo `codex/*`
- configure `agents.defaults.embeddedHarness.runtime = "codex"`
- afirme que o mecanismo de teste observou:
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - manutenção

Evite exigir lossless-claw nos testes centrais do OpenClaw. Use um pequeno
Plugin fake de mecanismo de contexto dentro do repositório.

## Observabilidade

Adicione logs de depuração em torno das chamadas de ciclo de vida do mecanismo de contexto do Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` com motivo
- `codex native compaction completed alongside context-engine compaction`

Evite registrar prompts completos ou conteúdos de transcrição.

Adicione campos estruturados quando útil:

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

- Se nenhum mecanismo de contexto estiver configurado, o comportamento legado do mecanismo de contexto deve ser
  equivalente ao comportamento atual do harness Codex.
- Se `assemble` do mecanismo de contexto falhar, o Codex deve continuar com o caminho
  de prompt original.
- Vínculos de thread Codex existentes devem permanecer válidos.
- O fingerprinting dinâmico de ferramentas não deve incluir saída do mecanismo de contexto; caso contrário,
  toda mudança de contexto poderia forçar uma nova thread Codex. Apenas o catálogo de ferramentas
  deve afetar o fingerprint dinâmico de ferramentas.

## Questões em aberto

1. O contexto montado deve ser injetado inteiramente no prompt do usuário, inteiramente
   nas instruções de desenvolvedor ou dividido?

   Recomendação: dividir. Coloque `systemPromptAddition` nas instruções de desenvolvedor;
   coloque o contexto de transcrição montado no wrapper de prompt do usuário. Isso corresponde melhor
   ao protocolo atual do Codex sem mutar o histórico nativo da thread.

2. A compaction nativa do Codex deve ser desativada quando um mecanismo de contexto controla a
   Compaction?

   Recomendação: não, pelo menos inicialmente. A compaction nativa do Codex ainda pode ser
   necessária para manter a thread do servidor de aplicativo ativa. Mas ela deve ser informada como
   compaction nativa do Codex, não como compaction do mecanismo de contexto.

3. `before_prompt_build` deve rodar antes ou depois da montagem do mecanismo de contexto?

   Recomendação: depois da projeção do mecanismo de contexto para Codex, para que hooks genéricos do harness
   vejam o prompt/instruções de desenvolvedor reais que o Codex receberá. Se a paridade com o Pi
   exigir o contrário, codifique a ordem escolhida em testes e documente-a
   aqui.

4. O servidor de aplicativo Codex pode aceitar uma futura substituição estruturada de contexto/histórico?

   Desconhecido. Se puder, substitua a camada de projeção de texto por esse protocolo e
   mantenha as chamadas de ciclo de vida inalteradas.

## Critérios de aceitação

- Um turno do harness embutido `codex/*` invoca o ciclo de vida de assemble
  do mecanismo de contexto selecionado.
- Um `systemPromptAddition` do mecanismo de contexto afeta as instruções de desenvolvedor do Codex.
- O contexto montado afeta a entrada do turno Codex de forma determinística.
- Turnos Codex bem-sucedidos chamam `afterTurn` ou fallback de ingest.
- Turnos Codex bem-sucedidos executam manutenção de turno do mecanismo de contexto.
- Turnos com falha/abortados/com yield abortado não executam manutenção de turno.
- A compaction controlada pelo mecanismo de contexto continua primária para estado do OpenClaw/Plugin.
- A compaction nativa do Codex continua auditável como comportamento nativo do Codex.
- O comportamento existente do mecanismo de contexto do Pi permanece inalterado.
- O comportamento existente do harness Codex permanece inalterado quando nenhum mecanismo de contexto não legado
  estiver selecionado ou quando a montagem falhar.
