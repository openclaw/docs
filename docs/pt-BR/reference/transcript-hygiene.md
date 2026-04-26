---
read_when:
    - Você está depurando rejeições de solicitações do provedor vinculadas ao formato da transcrição
    - Você está alterando a lógica de sanitização de transcrição ou de reparo de chamada de ferramenta
    - Você está investigando incompatibilidades de ID de chamada de ferramenta entre provedores
summary: 'Referência: regras de sanitização e reparo de transcrição específicas do provedor'
title: Higiene de transcrição
x-i18n:
    generated_at: "2026-04-26T11:37:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Este documento descreve **correções específicas por provedor** aplicadas às transcrições antes de uma execução
(construção do contexto do modelo). A maioria desses ajustes é feita **em memória** para satisfazer
requisitos rígidos de provedores. Uma etapa separada de reparo do arquivo de sessão também pode reescrever
o JSONL armazenado antes de a sessão ser carregada, seja removendo linhas JSONL malformadas ou
reparando turnos persistidos que são sintaticamente válidos, mas que se sabe serem rejeitados por um
provedor durante o replay. Quando ocorre um reparo, o arquivo original recebe backup ao lado do
arquivo da sessão.

O escopo inclui:

- Contexto de prompt somente em tempo de execução ficando fora dos turnos de transcrição visíveis ao usuário
- Sanitização de ID de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de thinking
- Sanitização de payload de imagem
- Marcação de procedência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turnos de erro vazios do assistente para replay do Bedrock Converse

Se você precisar de detalhes sobre armazenamento de transcrição, consulte:

- [Análise aprofundada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrição do usuário

O contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas ele
não é conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt voltado para
transcrição separado para respostas do Gateway, followups enfileirados, ACP, CLI e execuções
Pi incorporadas. Os turnos visíveis de usuário armazenados usam esse corpo de transcrição em vez do
prompt enriquecido em runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de histórico do
Gateway aplicam uma projeção de exibição antes de retornar mensagens para WebChat,
TUI, clientes REST ou SSE.

---

## Onde isso é executado

Toda a higiene de transcrição é centralizada no runner incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrição, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado a partir de `run/attempt.ts` e `compact.ts` (runner incorporado)

---

## Regra global: sanitização de imagem

Os payloads de imagem são sempre sanitizados para evitar rejeição no lado do provedor devido a limites
de tamanho (reduzir resolução/recomprimir imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens gerada por imagens em modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável por `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são removidos
antes de o contexto do modelo ser construído. Isso evita rejeições do provedor causadas por chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: procedência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio de agente para agente), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são gravados no momento do append da transcrição e não alteram o papel
(`role: "user"` permanece por compatibilidade com o provedor). Leitores de transcrição podem usar
isso para evitar tratar prompts internos roteados como instruções criadas pelo usuário final.

Durante a reconstrução do contexto, o OpenClaw também adiciona em memória um pequeno marcador
`[Inter-session message]` a esses turnos de usuário para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Somente sanitização de imagem.
- Remove assinaturas de reasoning órfãs (itens de reasoning autônomos sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex e remove reasoning OpenAI reaproveitável após uma troca de rota de modelo.
- Sem sanitização de ID de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação nem reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Sem remoção de assinatura de thought.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de ID de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prepend de um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).
- Blocos de thinking com assinaturas de replay ausentes, vazias ou em branco são removidos
  antes da conversão para o provedor. Se isso esvaziar um turno do assistente, o OpenClaw mantém
  o formato do turno com texto de reasoning omitido não vazio.
- Turnos mais antigos do assistente com apenas thinking que precisam ser removidos são substituídos por
  texto de reasoning omitido não vazio para que os adaptadores do provedor não removam o
  turno durante o replay.

**Amazon Bedrock (API Converse)**

- Turnos vazios de erro de stream do assistente são reparados para um bloco de texto fallback não vazio
  antes do replay. O Bedrock Converse rejeita mensagens do assistente com `content: []`, então
  turnos persistidos do assistente com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Blocos de thinking do Claude com assinaturas de replay ausentes, vazias ou em branco são
  removidos antes do replay no Converse. Se isso esvaziar um turno do assistente, o OpenClaw
  mantém o formato do turno com texto de reasoning omitido não vazio.
- Turnos mais antigos do assistente com apenas thinking que precisam ser removidos são substituídos por
  texto de reasoning omitido não vazio para que o replay no Converse mantenha o formato estrito do turno.
- O replay filtra turnos do assistente de espelhamento de entrega do OpenClaw e injetados pelo Gateway.
- A sanitização de imagem se aplica por meio da regra global.

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de ID de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de thought: remove valores `thought_signature` que não sejam base64 (mantém base64).

**Todo o restante**

- Somente sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes do lançamento 2026.1.22, o OpenClaw aplicava várias camadas de higiene de transcrição:

- Uma extensão **transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar o pareamento de uso/resultado de ferramenta.
  - Sanitizar IDs de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também executava sanitização específica por provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Remoção de turnos vazios de erro do assistente.
  - Corte do conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notadamente no pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou a OpenAI **intocável** além da sanitização de imagem.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
