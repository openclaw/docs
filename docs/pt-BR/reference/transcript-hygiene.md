---
read_when:
    - Você está depurando rejeições de requisição do provedor ligadas ao formato do transcript
    - Você está alterando a sanitização de transcript ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de id de chamada de ferramenta entre provedores
summary: 'Referência: regras de sanitização e reparo de transcript específicas por provedor'
title: Higiene de transcript
x-i18n:
    generated_at: "2026-04-25T18:21:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Este documento descreve **correções específicas por provedor** aplicadas a transcripts antes de uma execução
(construção do contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a
requisitos estritos do provedor. Um passo separado de reparo de arquivo de sessão também pode reescrever
JSONL armazenado antes de a sessão ser carregada, seja removendo linhas JSONL malformadas ou
reparando turnos persistidos que são sintaticamente válidos, mas sabidamente rejeitados por um
provedor durante o replay. Quando ocorre um reparo, o arquivo original recebe backup ao lado do
arquivo da sessão.

O escopo inclui:

- Contexto de prompt somente de runtime que fica fora dos turnos de transcript visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Sanitização de payload de imagem
- Marcação de procedência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro com assistant vazio para replay do Bedrock Converse

Se você precisar de detalhes sobre armazenamento de transcript, veja:

- [Session management deep dive](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcript do usuário

Contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas
não é conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt voltado ao
transcript separado para respostas do Gateway, followups enfileirados, ACP, execuções na
CLI e execuções de Pi embutido. Os turnos visíveis de usuário armazenados usam esse corpo
de transcript em vez do prompt enriquecido pelo runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de histórico do
Gateway aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat,
TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higiene de transcript é centralizada no executor embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcript, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (executor embutido)

---

## Regra global: sanitização de imagem

Payloads de imagem sempre são sanitizados para evitar rejeição no lado do provedor devido a limites
de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistant que não têm nem `input` nem `arguments` são removidos
antes de o contexto do modelo ser construído. Isso evita rejeições do provedor causadas por chamadas
de ferramenta parcialmente persistidas (por exemplo, após uma falha de rate limit).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: procedência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio entre agentes), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são gravados no momento do append ao transcript e não alteram o papel
(`role: "user"` permanece para compatibilidade com o provedor). Leitores do transcript podem usar
isso para evitar tratar prompts internos roteados como instruções criadas pelo usuário final.

Durante a reconstrução de contexto, o OpenClaw também adiciona em memória um pequeno marcador
`[Inter-session message]` a esses turnos de usuário para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Remove assinaturas de reasoning órfãs (itens de reasoning isolados sem um bloco de conteúdo seguinte) para transcripts de OpenAI Responses/Codex e remove reasoning replayável da OpenAI após uma troca de rota de modelo.
- Nenhuma sanitização de id de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Nenhuma validação nem reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Nenhuma remoção de assinatura de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (adiciona um pequeno bootstrap de usuário se o histórico começar com assistant).
- Antigravity Claude: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos consecutivos de usuário para atender à alternância estrita).

**Amazon Bedrock (API Converse)**

- Turnos de erro de stream com assistant vazio são reparados para um bloco de texto fallback não vazio
  antes do replay. O Bedrock Converse rejeita mensagens de assistant com `content: []`, então
  turnos persistidos de assistant com `stopReason: "error"` e conteúdo vazio também são reparados em disco antes do carregamento.
- O replay filtra turnos de assistant espelhados pela entrega do OpenClaw e injetados pelo gateway.
- A sanitização de imagem se aplica por meio da regra global.

**Mistral (incluindo detecção baseada em id de modelo)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**Todo o restante**

- Apenas sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes da release 2026.1.22, o OpenClaw aplicava várias camadas de higiene de transcript:

- Uma extensão **transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O executor também realizava sanitização específica por provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política de provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistant antes da persistência.
  - Remoção de turnos de erro com assistant vazio.
  - Corte de conteúdo do assistant após chamadas de ferramenta.

Essa complexidade causava regressões entre provedores (principalmente no pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no executor e tornou a OpenAI **sem intervenção** além da sanitização de imagem.

## Relacionado

- [Session management](/pt-BR/concepts/session)
- [Session pruning](/pt-BR/concepts/session-pruning)
