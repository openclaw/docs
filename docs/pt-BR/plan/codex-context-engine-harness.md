---
read_when:
    - Você está integrando o comportamento de ciclo de vida do mecanismo de contexto ao harness do Codex
    - Você precisa do lossless-claw ou de outro Plugin de mecanismo de contexto para trabalhar com sessões de harness incorporado codex/*
    - Você está comparando o comportamento de contexto do servidor de aplicativos incorporado do OpenClaw e do Codex
summary: Especificação para fazer o harness de servidor de aplicativo Codex incluído respeitar plugins de mecanismo de contexto do OpenClaw
title: Porte do Motor de Contexto do Harness do Codex
x-i18n:
    generated_at: "2026-06-27T17:41:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Especificação de implementação em rascunho.

## Objetivo

Fazer o harness app-server Codex incluído honrar o mesmo contrato de ciclo de vida
do mecanismo de contexto do OpenClaw que os turnos incorporados do OpenClaw já honram.

Uma sessão usando provedor/modelo `agentRuntime.id: "codex"` ou um modelo `codex/*`
ainda deve permitir que o Plugin de mecanismo de contexto selecionado, como
`lossless-claw`, controle a montagem de contexto, a ingestão pós-turno, a manutenção e
a política de Compaction no nível do OpenClaw até onde o limite do app-server Codex permitir.

## Não objetivos

- Não reimplementar os internos do app-server Codex.
- Não fazer a Compaction nativa de thread do Codex produzir um resumo lossless-claw.
- Não exigir que modelos não Codex usem o harness Codex.
- Não alterar o comportamento de sessões ACP/acpx. Esta especificação é apenas para o
  caminho de harness de agente incorporado não ACP.
- Não fazer Plugins de terceiros registrarem fábricas de extensão do app-server Codex;
  o limite de confiança de Plugin incluído existente permanece inalterado.

## Arquitetura atual

O loop de execução incorporado resolve o mecanismo de contexto configurado uma vez por execução antes
de selecionar um harness concreto de baixo nível:

- `src/agents/embedded-agent-runner/run.ts`
  - inicializa Plugins de mecanismo de contexto
  - chama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` para
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega para o harness de agente selecionado:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

O harness app-server Codex é registrado pelo Plugin Codex incluído:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

A implementação do harness Codex recebe os mesmos `EmbeddedRunAttemptParams`
que as tentativas integradas do OpenClaw:

- `extensions/codex/src/app-server/run-attempt.ts`

Isso significa que o ponto de hook necessário está em código controlado pelo OpenClaw. O limite externo
é o próprio protocolo do app-server Codex: o OpenClaw pode controlar o que envia
para `thread/start`, `thread/resume` e `turn/start`, e pode observar notificações,
mas não pode alterar o armazenamento interno de threads do Codex nem o compactador nativo.

## Lacuna atual

As tentativas integradas do OpenClaw chamam o ciclo de vida do mecanismo de contexto diretamente:

- bootstrap/manutenção antes da tentativa
- montagem antes da chamada ao modelo
- afterTurn ou ingestão após a tentativa
- manutenção após um turno bem-sucedido
- Compaction do mecanismo de contexto para mecanismos que possuem Compaction

Código relevante do OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

As tentativas do app-server Codex atualmente executam hooks genéricos de harness de agente e espelham
a transcrição, mas não chamam `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` nem
`params.contextEngine.maintain`.

Código Codex relevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desejado

Para turnos do harness Codex, o OpenClaw deve preservar este ciclo de vida:

1. Ler a transcrição espelhada da sessão OpenClaw.
2. Fazer bootstrap do mecanismo de contexto ativo quando existir um arquivo de sessão anterior.
3. Executar manutenção de bootstrap quando disponível.
4. Montar contexto usando o mecanismo de contexto ativo.
5. Converter o contexto montado em entradas compatíveis com Codex.
6. Iniciar ou retomar a thread Codex com instruções de desenvolvedor que incluam qualquer
   `systemPromptAddition` do mecanismo de contexto.
7. Iniciar o turno Codex com o prompt voltado ao usuário montado.
8. Espelhar o resultado do Codex de volta para a transcrição do OpenClaw.
9. Chamar `afterTurn` se implementado; caso contrário, `ingestBatch`/`ingest`, usando o
   snapshot da transcrição espelhada.
10. Executar manutenção de turno após turnos bem-sucedidos e não abortados.
11. Preservar os sinais nativos de Compaction do Codex e os hooks de Compaction do OpenClaw.

## Restrições de design

### O app-server Codex permanece canônico para o estado nativo da thread

O Codex possui sua thread nativa e qualquer histórico estendido interno. O OpenClaw não deve
tentar modificar o histórico interno do app-server exceto por chamadas de protocolo compatíveis.

O espelho de transcrição do OpenClaw permanece a fonte para recursos do OpenClaw:

- histórico de chat
- busca
- escrituração de `/new` e `/reset`
- futura troca de modelo ou harness
- estado de Plugin de mecanismo de contexto

### A montagem do mecanismo de contexto deve ser projetada em entradas Codex

A interface do mecanismo de contexto retorna `AgentMessage[]` do OpenClaw, não um patch de thread
Codex. `turn/start` do app-server Codex aceita uma entrada atual do usuário, enquanto
`thread/start` e `thread/resume` aceitam instruções de desenvolvedor.

Portanto, a implementação precisa de uma camada de projeção. A primeira versão segura
deve evitar fingir que consegue substituir o histórico interno do Codex. Ela deve injetar
o contexto montado como material determinístico de prompt/instrução de desenvolvedor ao redor
do turno atual.

### A estabilidade do cache de prompt importa

Para mecanismos como lossless-claw, o contexto montado deve ser determinístico
para entradas inalteradas. Não adicione timestamps, ids aleatórios nem ordenação
não determinística ao texto de contexto gerado.

### A semântica de seleção de runtime não muda

A seleção de harness permanece como está:

- `runtime: "openclaw"` seleciona o harness OpenClaw integrado
- `runtime: "codex"` seleciona o harness Codex registrado
- `runtime: "auto"` permite que harnesses de Plugin reivindiquem provedores compatíveis
- execuções `auto` sem correspondência usam o harness OpenClaw integrado

Este trabalho altera o que acontece depois que o harness Codex é selecionado.

## Plano de implementação

### 1. Exportar ou realocar helpers reutilizáveis de tentativa do mecanismo de contexto

Hoje os helpers reutilizáveis de ciclo de vida ficam sob o executor de agente incorporado:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

O Codex deve importar helpers neutros de harness em vez de acessar detalhes de implementação
do executor.

Crie um módulo neutro de harness, por exemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mova ou reexporte:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- um pequeno wrapper em torno de `runContextEngineMaintenance`

Atualize os pontos de chamada do harness integrado no mesmo PR.

Os nomes dos helpers neutros não devem mencionar o harness integrado.

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

- Colocar `systemPromptAddition` nas instruções de desenvolvedor.
- Colocar o contexto de transcrição montado antes do prompt atual em `promptText`.
- Rotulá-lo claramente como contexto montado do OpenClaw.
- Manter o prompt atual por último.
- Excluir o prompt atual duplicado do usuário se ele já aparecer no final.

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

Isso é menos elegante que cirurgia nativa no histórico do Codex, mas é implementável
dentro do OpenClaw e preserva a semântica do mecanismo de contexto.

Melhoria futura: se o app-server Codex expuser um protocolo para substituir ou
suplementar o histórico de thread, troque esta camada de projeção para usar essa API.

### 3. Conectar bootstrap antes da inicialização da thread Codex

Em `extensions/codex/src/app-server/run-attempt.ts`:

- Ler o histórico de sessão espelhado como hoje.
- Determinar se o arquivo de sessão existia antes desta execução. Prefira um helper
  que verifica `fs.stat(params.sessionFile)` antes de escritas de espelhamento.
- Abrir um `SessionManager` ou usar um adaptador estreito de gerenciador de sessão se o helper
  exigir.
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

Use a mesma convenção de `sessionKey` que a ponte de ferramentas Codex e o espelho de transcrição.
Hoje o Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` ou
`params.sessionId`; use isso consistentemente, a menos que haja uma razão para preservar
`params.sessionKey` bruto.

### 4. Conectar montagem antes de `thread/start` / `thread/resume` e `turn/start`

Em `runCodexAppServerAttempt`:

1. Construir primeiro as ferramentas dinâmicas, para que o mecanismo de contexto veja os nomes reais
   das ferramentas disponíveis.
2. Ler o histórico de sessão espelhado.
3. Executar `assemble(...)` do mecanismo de contexto quando `params.contextEngine` existir.
4. Projetar o resultado montado em:
   - acréscimo de instrução de desenvolvedor
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
2. aplicar montagem/projeção do mecanismo de contexto
3. executar `before_prompt_build` com o prompt/instruções de desenvolvedor projetados

Esta ordem permite que hooks genéricos de prompt vejam o mesmo prompt que o Codex receberá. Se
precisarmos de paridade estrita com o OpenClaw, execute a montagem do mecanismo de contexto antes da composição
de hooks, porque o harness integrado aplica `systemPromptAddition` do mecanismo de contexto
ao prompt de sistema final após seu pipeline de prompt. O invariante importante é que tanto
o mecanismo de contexto quanto os hooks tenham uma ordem determinística e documentada.

Ordem recomendada para a primeira implementação:

1. `buildDeveloperInstructions(params)`
2. `assemble()` do mecanismo de contexto
3. anexar/prepender `systemPromptAddition` às instruções de desenvolvedor
4. projetar mensagens montadas no texto do prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passar as instruções de desenvolvedor finais para `startOrResumeThread(...)`
7. passar o texto de prompt final para `buildTurnStartParams(...)`

A especificação deve ser codificada em testes para que alterações futuras não a reordenem
por acidente.

### 5. Preservar formatação estável para cache de prompt

O helper de projeção deve produzir saída estável em bytes para entradas idênticas:

- ordem estável de mensagens
- rótulos de função estáveis
- nenhum timestamp gerado
- nenhum vazamento de ordem de chaves de objeto
- nenhum delimitador aleatório
- nenhum id por execução

Use delimitadores fixos e seções explícitas.

### 6. Conectar pós-turno após espelhamento da transcrição

O `CodexAppServerEventProjector` do Codex cria um `messagesSnapshot` local para o
turno atual. `mirrorTranscriptBestEffort(...)` grava esse snapshot no espelho de
transcrição do OpenClaw.

Depois que o espelhamento tiver sucesso ou falhar, chame o finalizador do mecanismo
de contexto com o melhor snapshot de mensagens disponível:

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
que o mecanismo de contexto está ingerindo a partir dos dados de turno de fallback.

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

Não os confunda silenciosamente.

#### `/compact` e Compaction explícita do OpenClaw

Quando o mecanismo de contexto selecionado tiver `info.ownsCompaction === true`, a Compaction
explícita do OpenClaw deve preferir o resultado de `compact()` do mecanismo de contexto para
o espelho de transcrição do OpenClaw e o estado do Plugin.

Quando o harness do Codex selecionado tiver uma vinculação de thread nativa, também podemos
solicitar a Compaction nativa do Codex para manter a thread do app-server saudável, mas isso
deve ser relatado como uma ação de backend separada nos detalhes.

Comportamento recomendado:

- Se `contextEngine.info.ownsCompaction === true`:
  - chame `compact()` do mecanismo de contexto primeiro
  - em seguida, chame a Compaction nativa do Codex em modo melhor esforço quando existir uma vinculação de thread
  - retorne o resultado do mecanismo de contexto como resultado primário
  - inclua o status da Compaction nativa do Codex em `details.codexNativeCompaction`
- Se o mecanismo de contexto ativo não for proprietário da Compaction:
  - preserve o comportamento atual de Compaction nativa do Codex

Isso provavelmente exige alterar `extensions/codex/src/app-server/compact.ts` ou
envolvê-lo a partir do caminho genérico de Compaction, dependendo de onde
`maybeCompactAgentHarnessSession(...)` é invocado.

#### Eventos contextCompaction nativos do Codex dentro do turno

O Codex pode emitir eventos de item `contextCompaction` durante um turno. Mantenha a emissão atual
do hook de Compaction antes/depois em `event-projector.ts`, mas não trate
isso como uma Compaction concluída do mecanismo de contexto.

Para mecanismos que são proprietários da Compaction, emita um diagnóstico explícito quando o Codex executar
Compaction nativa mesmo assim:

- nome do stream/evento: o stream `compaction` existente é aceitável
- detalhes: `{ backend: "codex-app-server", ownsCompaction: true }`

Isso torna a separação auditável.

### 9. Redefinição de sessão e comportamento de vinculação

O `reset(...)` existente do harness do Codex remove a vinculação do app-server do Codex do
arquivo de sessão do OpenClaw. Preserve esse comportamento.

Também garanta que a limpeza de estado do mecanismo de contexto continue acontecendo pelos caminhos
existentes do ciclo de vida da sessão do OpenClaw. Não adicione limpeza específica do Codex, a menos que o
ciclo de vida do mecanismo de contexto atualmente deixe de receber eventos de reset/delete para todos os harnesses.

### 10. Tratamento de erros

Siga a semântica integrada do OpenClaw:

- falhas de bootstrap avisam e continuam
- falhas de assembly avisam e fazem fallback para mensagens/prompt do pipeline não montado
- falhas de afterTurn/ingest avisam e marcam a finalização pós-turno como malsucedida
- manutenção roda apenas após turnos bem-sucedidos, não abortados e sem yield abort
- erros de Compaction não devem ser repetidos como prompts novos

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
   - Codex chama `bootstrap` quando existe um arquivo de sessão.
   - Codex chama `assemble` com mensagens espelhadas, orçamento de tokens, nomes de ferramentas,
     modo de citações, id do modelo e prompt.
   - `systemPromptAddition` é incluído nas instruções de desenvolvedor.
   - Mensagens montadas são projetadas no prompt antes da solicitação atual.
   - Codex chama `afterTurn` após o espelhamento da transcrição.
   - Sem `afterTurn`, Codex chama `ingestBatch` ou `ingest` por mensagem.
   - Manutenção de turno roda após turnos bem-sucedidos.
   - Manutenção de turno não roda em erro de prompt, abort ou yield abort.

2. `context-engine-projection.test.ts`
   - saída estável para entradas idênticas
   - nenhum prompt atual duplicado quando o histórico montado o inclui
   - lida com histórico vazio
   - preserva a ordem dos papéis
   - inclui a adição de prompt do sistema apenas nas instruções de desenvolvedor

3. `compact.context-engine.test.ts`
   - o resultado primário do mecanismo de contexto proprietário prevalece
   - o status da Compaction nativa do Codex aparece nos detalhes quando também tentada
   - falha nativa do Codex não falha a Compaction do mecanismo de contexto proprietário
   - mecanismo de contexto não proprietário preserva o comportamento atual de Compaction nativa

### Testes existentes a atualizar

- `extensions/codex/src/app-server/run-attempt.test.ts`, se presente; caso contrário,
  os testes de execução do app-server do Codex mais próximos.
- `extensions/codex/src/app-server/event-projector.test.ts` apenas se os detalhes de eventos de Compaction
  mudarem.
- `src/agents/harness/selection.test.ts` não deve precisar de alterações, a menos que o comportamento de configuração
  mude; ele deve permanecer estável.
- Os testes integrados de mecanismo de contexto de harness devem continuar passando sem alterações.

### Testes de integração / ao vivo

Adicione ou estenda testes smoke ao vivo do harness do Codex:

- configure `plugins.slots.contextEngine` para um mecanismo de teste
- configure `agents.defaults.model` para um modelo `codex/*`
- configure `agentRuntime.id = "codex"` de provedor/modelo
- afirme que o mecanismo de teste observou:
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - manutenção

Evite exigir lossless-claw nos testes core do OpenClaw. Use um pequeno Plugin
de mecanismo de contexto falso dentro do repositório.

## Observabilidade

Adicione logs de debug ao redor das chamadas de ciclo de vida do mecanismo de contexto do Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` com motivo
- `codex native compaction completed alongside context-engine compaction`

Evite registrar prompts completos ou conteúdo de transcrição.

Adicione campos estruturados onde for útil:

- `sessionId`
- `sessionKey` redigido ou omitido conforme a prática de logging existente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migração / compatibilidade

Isto deve ser retrocompatível:

- Se nenhum mecanismo de contexto estiver configurado, o comportamento legado do mecanismo de contexto deve ser
  equivalente ao comportamento atual do harness do Codex.
- Se `assemble` do mecanismo de contexto falhar, Codex deve continuar pelo caminho
  de prompt original.
- Vinculações de thread existentes do Codex devem continuar válidas.
- A impressão digital dinâmica de ferramentas não deve incluir a saída do mecanismo de contexto; caso contrário,
  toda mudança de contexto poderia forçar uma nova thread do Codex. Apenas o catálogo de ferramentas
  deve afetar a impressão digital dinâmica de ferramentas.

## Perguntas em aberto

1. O contexto montado deve ser injetado inteiramente no prompt do usuário, inteiramente
   nas instruções de desenvolvedor, ou dividido?

   Recomendação: dividir. Coloque `systemPromptAddition` nas instruções de desenvolvedor;
   coloque o contexto de transcrição montado no wrapper do prompt do usuário. Isso corresponde melhor
   ao protocolo atual do Codex sem modificar o histórico nativo da thread.

2. A Compaction nativa do Codex deve ser desabilitada quando um mecanismo de contexto for proprietário
   da Compaction?

   Recomendação: não, inicialmente. A Compaction nativa do Codex ainda pode ser
   necessária para manter a thread do app-server viva. Mas ela deve ser relatada como
   Compaction nativa do Codex, não como Compaction do mecanismo de contexto.

3. `before_prompt_build` deve rodar antes ou depois da montagem do mecanismo de contexto?

   Recomendação: depois da projeção do mecanismo de contexto para Codex, para que hooks genéricos de harness
   vejam o prompt/instruções de desenvolvedor reais que o Codex receberá. Se a paridade com o harness
   integrado exigir o oposto, codifique a ordem escolhida em
   testes e documente-a aqui.

4. O app-server do Codex pode aceitar uma sobreposição futura estruturada de contexto/histórico?

   Desconhecido. Se puder, substitua a camada de projeção de texto por esse protocolo e
   mantenha as chamadas de ciclo de vida inalteradas.

## Critérios de aceite

- Um turno de harness incorporado `codex/*` invoca o ciclo de vida de assemble do
  mecanismo de contexto selecionado.
- Um `systemPromptAddition` do mecanismo de contexto afeta as instruções de desenvolvedor do Codex.
- O contexto montado afeta a entrada do turno do Codex de forma determinística.
- Turnos bem-sucedidos do Codex chamam `afterTurn` ou fallback de ingest.
- Turnos bem-sucedidos do Codex rodam a manutenção de turno do mecanismo de contexto.
- Turnos com falha/abortados/yield-aborted não rodam manutenção de turno.
- Compaction pertencente ao mecanismo de contexto permanece primária para o estado do OpenClaw/Plugin.
- Compaction nativa do Codex permanece auditável como comportamento nativo do Codex.
- O comportamento existente de mecanismo de contexto de harness integrado permanece inalterado.
- O comportamento existente do harness do Codex permanece inalterado quando nenhum mecanismo de contexto
  não legado é selecionado ou quando a montagem falha.
