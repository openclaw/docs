---
read_when:
    - Você está depurando rejeições de solicitações do provedor relacionadas à estrutura da transcrição
    - Você está alterando a lógica de sanitização de transcrições ou de reparo de chamadas de ferramentas
    - Você está investigando incompatibilidades de IDs de chamadas de ferramentas entre provedores
summary: 'Referência: regras de sanitização e correção de transcrições específicas do provedor'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-07-12T00:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

O OpenClaw aplica **correções específicas do provedor** às transcrições antes de uma execução
(ao criar o contexto do modelo). A maioria delas consiste em ajustes **em memória** usados para
atender aos requisitos rigorosos do provedor. Uma etapa separada de reparo do arquivo de sessão
também pode reescrever o JSONL armazenado antes que a sessão seja carregada, mas apenas para
linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos.
As respostas entregues pelo assistente são preservadas no disco; a remoção do
preenchimento prévio do assistente específica do provedor ocorre apenas durante a criação
das cargas de saída.

Quando ocorre um reparo, o arquivo original é gravado em um arquivo irmão transitório
`*.bak-<pid>-<ts>` antes da substituição atômica e removido depois que a
substituição é concluída com êxito. O backup só é mantido se a própria limpeza falhar e,
nesse caso, o caminho é informado.

O escopo inclui:

- Exclusão do contexto de prompt exclusivo do runtime dos turnos de transcrição visíveis ao usuário
- Sanitização de IDs de chamadas de ferramenta
- Validação da entrada de chamadas de ferramenta
- Reparo do pareamento de resultados de ferramentas
- Validação/ordenação de turnos
- Limpeza de assinaturas de raciocínio
- Limpeza de assinaturas de pensamento
- Sanitização de cargas de imagens
- Limpeza de blocos de texto em branco antes da reprodução pelo provedor
- Limpeza de turnos incompletos por limite de tamanho contendo apenas raciocínio antes da reprodução pelo provedor
- Marcação da procedência da entrada do usuário (para prompts roteados entre sessões)
- Reparo de turnos de erro vazios do assistente para reprodução no Bedrock Converse

Se precisar de detalhes sobre o armazenamento de transcrições, consulte
[Análise detalhada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

---

## Regra global: o contexto do runtime não é uma transcrição do usuário

O contexto do runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas
não é conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt separado,
voltado à transcrição, para respostas do Gateway, acompanhamentos enfileirados, ACP, CLI e
execuções incorporadas do OpenClaw. Os turnos visíveis do usuário armazenados usam esse corpo
da transcrição em vez do prompt enriquecido pelo runtime.

Para sessões legadas que já persistiram invólucros do runtime, as superfícies de histórico
do Gateway aplicam uma projeção de exibição antes de retornar mensagens para clientes
WebChat, TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higienização de transcrições é centralizada no executor incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, baseada em `provider`, `modelApi` e `modelId`)
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em
  `src/agents/embedded-agent-runner/replay-history.ts`

Separadamente da higienização de transcrições, os arquivos de sessão são reparados (se necessário)
antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado por `src/agents/embedded-agent-runner/run/attempt.ts` e
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regra global: sanitização de imagens

As cargas de imagens são sempre sanitizadas para evitar rejeições pelo provedor devido aos
limites de tamanho (redução de escala/recompactação de imagens base64 grandes demais). Isso também ajuda
a controlar a pressão sobre tokens causada por imagens em modelos compatíveis com visão: dimensões
máximas menores reduzem o uso de tokens, enquanto dimensões maiores preservam os detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem pode ser configurado por `agents.defaults.imageMaxDimensionPx`
  (padrão: `1200`)
- Blocos de texto em branco são removidos enquanto essa etapa percorre o conteúdo de reprodução.
  Turnos do assistente que ficam vazios são removidos da cópia de reprodução; turnos do usuário
  e de resultado de ferramenta que ficam vazios recebem um espaço reservado não vazio para
  conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não contenham `input` nem `arguments` são removidos
antes da criação do contexto do modelo. Isso evita rejeições do provedor causadas por
chamadas de ferramenta parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regra global: turnos incompletos contendo apenas raciocínio

Turnos do assistente que atingiram o limite de saída do provedor contendo apenas conteúdo de pensamento ou
pensamento ocultado são omitidos da cópia de reprodução em memória. Esses
turnos contêm um estado incompleto do provedor e podem carregar uma assinatura parcial de pensamento.

Turnos vazios por limite de tamanho permanecem inalterados, assim como turnos por limite de tamanho com texto visível,
chamadas de ferramenta ou blocos de conteúdo desconhecidos. As transcrições armazenadas não são reescritas.

Implementação: `normalizeAssistantReplayContent` em
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regra global: procedência de entradas entre sessões

Quando um agente envia um prompt para outra sessão por meio de `sessions_send`
(incluindo etapas de resposta/anúncio entre agentes), o OpenClaw persiste o
turno de usuário criado com `message.provenance.kind = "inter_session"`.

O OpenClaw também adiciona antes do texto do prompt roteado, no mesmo turno, um marcador
`[Mensagem entre sessões] ... isUser=false` para que a chamada ativa do modelo possa
distinguir a saída de uma sessão externa das instruções externas do usuário final. Esse
marcador inclui a sessão de origem, o canal e a ferramenta, quando disponíveis. A
transcrição continua usando `role: "user"` para manter a compatibilidade com o provedor, mas o
texto visível e os metadados de procedência identificam o turno como dados entre sessões.

Durante a reconstrução do contexto, o OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos anteriormente que tenham apenas metadados de procedência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Remove assinaturas de raciocínio órfãs (itens de raciocínio independentes sem um
  bloco de conteúdo subsequente) para transcrições do OpenAI Responses/Codex e remove
  o raciocínio reproduzível do OpenAI após uma troca de rota do modelo.
- Preserva cargas de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo
  itens criptografados com resumo vazio, para que a reprodução manual/via WebSocket mantenha o estado
  `rs_*` obrigatório pareado com os itens de saída do assistente.
- O ChatGPT Codex Responses nativo segue a paridade do protocolo do Codex reproduzindo
  cargas anteriores de raciocínio/mensagem/função do Responses sem IDs de itens
  anteriores, preservando o `prompt_cache_key` da sessão.
- A reprodução da família OpenAI Responses preserva pares canônicos de raciocínio
  `call_*|fc_*` do mesmo modelo, mas normaliza deterministicamente IDs `call_id`/de itens
  de chamada de função malformados ou longos demais antes da conversão da carga pelo pi-ai.
- O reparo do pareamento de resultados de ferramentas pode mover saídas correspondentes reais e sintetizar
  saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação nem reordenação de turnos; sem remoção de assinaturas de raciocínio.

**Chat Completions compatível com OpenAI**

- Blocos históricos de pensamento/raciocínio do assistente são removidos antes da reprodução,
  para que servidores locais e no estilo proxy compatíveis com OpenAI não recebam
  campos de raciocínio de turnos anteriores, como `reasoning` ou `reasoning_content`.
- Continuações de chamadas de ferramenta no mesmo turno atual mantêm o bloco de raciocínio do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta tenha sido reproduzido.
- Entradas de modelos personalizados/auto-hospedados com `reasoning: true` preservam os
  metadados de raciocínio reproduzidos.
- Exceções controladas pelo provedor podem desativar esse comportamento quando o protocolo
  exigir metadados de raciocínio reproduzidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de IDs de chamadas de ferramenta: alfanuméricos estritos.
- Reparo do pareamento de resultados de ferramentas e resultados de ferramentas sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção da ordenação de turnos do Google (adiciona no início uma pequena inicialização do usuário se o histórico
  começar com o assistente).
- Antigravity Claude: normaliza assinaturas de pensamento; remove blocos de pensamento
  não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo do pareamento de resultados de ferramentas e resultados de ferramentas sintéticos.
- Validação de turnos (mescla turnos consecutivos do usuário para atender à
  alternância estrita).
- Turnos finais de preenchimento prévio do assistente são removidos das cargas de saída do Anthropic
  Messages quando o pensamento está ativado, incluindo rotas do Cloudflare AI
  Gateway.
- Assinaturas de pensamento do assistente anteriores à Compaction são removidas antes da
  reprodução pelo provedor quando uma sessão passou por Compaction. As assinaturas de pensamento são
  criptograficamente vinculadas ao prefixo da conversa no momento da geração;
  após a Compaction, o prefixo muda (o conteúdo resumido substitui o
  original), portanto, reproduzir as assinaturas originais faz o Anthropic
  rejeitar a solicitação com "Assinatura inválida no bloco de pensamento". O
  texto do pensamento é preservado como um bloco não assinado e depois processado pela
  regra abaixo.
- Blocos de pensamento com assinaturas de reprodução ausentes, vazias ou em branco são
  removidos antes da conversão para o provedor. Se isso esvaziar um turno do assistente,
  o OpenClaw mantém o formato do turno com um texto não vazio indicando raciocínio omitido.
- Turnos antigos do assistente contendo apenas pensamento que precisem ser removidos são substituídos
  por um texto não vazio indicando raciocínio omitido, para que os adaptadores do provedor não removam
  o turno de reprodução.

**Amazon Bedrock (API Converse)**

- Turnos vazios de erro de fluxo do assistente são reparados para conter um bloco de texto
  alternativo não vazio antes da reprodução. O Bedrock Converse rejeita mensagens do assistente
  com `content: []`, portanto, turnos persistidos do assistente com `stopReason:
"error"` e conteúdo vazio também são reparados no disco antes do carregamento.
- Turnos de erro de fluxo do assistente contendo apenas blocos de texto em branco são removidos da
  cópia de reprodução em memória, em vez de reproduzir um bloco em branco inválido.
- Assinaturas de pensamento do assistente anteriores à Compaction são removidas antes da reprodução no Converse
  quando uma sessão passou por Compaction, pelo mesmo motivo descrito acima para o
  Anthropic.
- Blocos de pensamento do Claude com assinaturas de reprodução ausentes, vazias ou em branco
  são removidos antes da reprodução no Converse. Se isso esvaziar um turno do assistente,
  o OpenClaw mantém o formato do turno com um texto não vazio indicando raciocínio omitido.
- Turnos antigos do assistente contendo apenas pensamento que precisem ser removidos são substituídos
  por um texto não vazio indicando raciocínio omitido, para que a reprodução no Converse mantenha
  o formato estrito dos turnos.
- A reprodução filtra turnos do assistente espelhados da entrega do OpenClaw e injetados pelo
  Gateway.
- A sanitização de imagens é aplicada de acordo com a regra global.

**Mistral (incluindo detecção baseada no ID do modelo)**

- Sanitização de IDs de chamadas de ferramenta: strict9 (alfanuméricos, comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinaturas de raciocínio: remove valores `thought_signature` que não sejam base64
  (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de preenchimento prévio do assistente são removidos das cargas verificadas de modelos Anthropic
  compatíveis com OpenAI no OpenRouter quando o raciocínio está ativado,
  correspondendo ao comportamento de reprodução direta do Anthropic e do Cloudflare Anthropic.

**Todos os demais**

- Apenas sanitização de imagens.

---

## Comportamento histórico (anterior à versão 2026.1.22)

Antes da versão 2026.1.22, o OpenClaw aplicava várias camadas de higienização de
transcrições:

- Uma **extensão de sanitização de transcrições** era executada em cada criação de contexto e podia:
  - Reparar o pareamento entre uso e resultado de ferramentas.
  - Sanitizar IDs de chamadas de ferramenta (incluindo um modo não estrito que preservava
    `_`/`-`).
- O executor também realizava sanitização específica do provedor, o que
  duplicava o trabalho.
- Outras mutações ocorriam fora da política do provedor, incluindo
  a remoção de tags `<final>` do texto do assistente antes da persistência, a remoção de
  turnos de erro vazios do assistente e o corte do conteúdo do assistente após chamadas de
  ferramenta.

Essa complexidade causava regressões entre provedores (especialmente no pareamento
`call_id|fc_id` do `openai-responses`). A limpeza da versão 2026.1.22 removeu
a extensão, centralizou a lógica no executor e fez com que o OpenAI ficasse **intocado**,
exceto pela sanitização de imagens.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
