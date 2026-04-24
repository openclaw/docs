---
read_when:
    - Você está depurando rejeições de requests do provedor relacionadas ao formato da transcrição
    - Você está alterando a sanitização da transcrição ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de ID de chamadas de ferramenta entre provedores
summary: 'Referência: regras específicas de provedor para sanitização e reparo de transcrições'
title: Higiene de transcrição
x-i18n:
    generated_at: "2026-04-24T06:12:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene de transcrição (correções por provedor)

Este documento descreve **correções específicas de provedor** aplicadas a transcrições antes de uma execução
(construção do contexto do modelo). Esses são ajustes **em memória** usados para satisfazer
requisitos rígidos do provedor. Essas etapas de higiene **não** reescrevem a transcrição JSONL
armazenada em disco; no entanto, uma passagem separada de reparo de arquivo de sessão pode reescrever arquivos
JSONL malformados removendo linhas inválidas antes que a sessão seja carregada. Quando um reparo ocorre, o arquivo
original recebe backup ao lado do arquivo de sessão.

O escopo inclui:

- Sanitização de ID de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Sanitização de payload de imagem
- Tag de proveniência de entrada do usuário (para prompts roteados entre sessões)

Se você precisar de detalhes sobre armazenamento de transcrição, consulte:

- [/reference/session-management-compaction](/pt-BR/reference/session-management-compaction)

---

## Onde isso roda

Toda a higiene de transcrição é centralizada no executor embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrição, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (executor embutido)

---

## Regra global: sanitização de imagem

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor devido a
limites de tamanho (redução/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagem para modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm nem `input` nem `arguments` são removidos
antes que o contexto do modelo seja construído. Isso evita rejeições do provedor por
chamadas de ferramenta parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de reply/announce de agente para agente), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são gravados no momento de append da transcrição e não alteram o papel
(`role: "user"` permanece para compatibilidade com o provedor). Leitores de transcrição podem usar
isso para evitar tratar prompts internos roteados como instruções criadas por usuário final.

Durante a reconstrução do contexto, o OpenClaw também acrescenta em memória um pequeno marcador
`[Inter-session message]` a esses turnos de usuário, para que o modelo possa distingui-los de
instruções externas de usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Remove assinaturas órfãs de reasoning (itens isolados de reasoning sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex.
- Sem sanitização de ID de chamada de ferramenta.
- Sem reparo de pareamento de resultado de ferramenta.
- Sem validação ou reordenação de turnos.
- Sem resultados sintéticos de ferramenta.
- Sem remoção de assinatura de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de ID de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turno (alternância de turno no estilo Gemini).
- Correção de ordenação de turno do Google (antecipa um pequeno bootstrap de usuário se o histórico começar com assistente).
- Claude do Antigravity: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turno (mescla turnos consecutivos de usuário para satisfazer alternância estrita).

**Mistral (incluindo detecção baseada em ID do modelo)**

- Sanitização de ID de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**Todo o resto**

- Apenas sanitização de imagem.

---

## Comportamento histórico (antes de 2026.1.22)

Antes da release 2026.1.22, o OpenClaw aplicava múltiplas camadas de higiene de transcrição:

- Uma **extensão transcript-sanitize** rodava em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar IDs de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O executor também executava sanitização específica de provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remover tags `<final>` do texto do assistente antes da persistência.
  - Remover turnos vazios de erro do assistente.
  - Aparar conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causava regressões entre provedores (notavelmente no pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no executor e tornou o OpenAI **intocável** além da sanitização de imagem.

## Relacionados

- [Session management](/pt-BR/concepts/session)
- [Session pruning](/pt-BR/concepts/session-pruning)
