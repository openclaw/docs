---
read_when:
    - Você está depurando rejeições de solicitações do provedor relacionadas ao formato da transcrição
    - Você está alterando a sanitização da transcrição ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de ID de chamadas de ferramenta entre provedores
summary: 'Referência: regras de sanitização e reparo de transcrição específicas do provedor'
title: Higiene de transcrição
x-i18n:
    generated_at: "2026-04-25T13:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Este documento descreve **correções específicas do provedor** aplicadas às transcrições antes de uma execução
(construção do contexto do modelo). Esses são ajustes **em memória** usados para satisfazer
requisitos rígidos dos provedores. Essas etapas de higiene **não** reescrevem a transcrição JSONL armazenada
em disco; no entanto, uma passagem separada de reparo de arquivo de sessão pode reescrever arquivos JSONL malformados
removendo linhas inválidas antes de a sessão ser carregada. Quando ocorre um reparo, o arquivo original
é salvo em backup ao lado do arquivo da sessão.

O escopo inclui:

- Contexto de prompt somente de runtime ficando fora dos turnos de transcrição visíveis ao usuário
- Sanitização de ID de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de thinking
- Sanitização de payload de imagem
- Marcação de procedência de entrada do usuário (para prompts roteados entre sessões)

Se você precisar de detalhes sobre armazenamento de transcrição, consulte:

- [Análise aprofundada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrição do usuário

O contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas não é
conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt separado voltado para a transcrição
para respostas do Gateway, follow-ups enfileirados, ACP, CLI e execuções incorporadas no Pi.
Os turnos visíveis do usuário armazenados usam esse corpo de transcrição em vez do
prompt enriquecido com runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de
histórico do Gateway aplicam uma projeção de exibição antes de retornar mensagens para WebChat,
TUI, clientes REST ou SSE.

---

## Onde isso é executado

Toda a higiene da transcrição é centralizada no runner incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene da transcrição, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (runner incorporado)

---

## Regra global: sanitização de imagem

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor devido a limites
de tamanho (reduzir/recomprimir imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com suporte a visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são removidos
antes de o contexto do modelo ser construído. Isso evita rejeições do provedor causadas por chamadas
de ferramenta parcialmente persistidas (por exemplo, após uma falha de limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: procedência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio entre agentes), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são gravados no momento do append da transcrição e não alteram o papel
(`role: "user"` é mantido para compatibilidade com provedores). Leitores da transcrição podem usar
isso para evitar tratar prompts internos roteados como instruções criadas pelo usuário final.

Durante a reconstrução do contexto, o OpenClaw também prefixa em memória um pequeno marcador
`[Inter-session message]` nesses turnos de usuário para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Remove assinaturas de reasoning órfãs (itens de reasoning isolados sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex, e remove reasoning OpenAI reproduzível após uma mudança de rota do modelo.
- Sem sanitização de ID de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo do Codex para chamadas de ferramenta ausentes.
- Sem validação nem reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Sem remoção de assinatura de thinking.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de ID de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prefixa um bootstrap mínimo de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (mescla turnos consecutivos do usuário para satisfazer alternância rígida).

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de ID de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de thinking: remove valores `thought_signature` que não sejam base64 (mantém base64).

**Todo o restante**

- Apenas sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes do release 2026.1.22, o OpenClaw aplicava várias camadas de higiene da transcrição:

- Uma extensão **transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar IDs de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também executava sanitização específica do provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Remoção de turnos de erro vazios do assistente.
  - Corte do conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causava regressões entre provedores (notavelmente no pareamento
`call_id|fc_id` do `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou o OpenAI **intocável** além da sanitização de imagem.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
