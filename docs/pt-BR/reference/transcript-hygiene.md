---
read_when:
    - Você está depurando rejeições de solicitação do provedor ligadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de id de chamadas de ferramenta entre provedores
summary: 'Referência: regras específicas de provedor para sanitização e reparo de transcrições'
title: Higiene de transcrição
x-i18n:
    generated_at: "2026-04-23T14:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene de transcrição (correções de provedor)

Este documento descreve as **correções específicas de provedor** aplicadas às transcrições antes de uma execução
(construção do contexto do modelo). Esses ajustes são feitos **em memória** para satisfazer
requisitos rígidos do provedor. Essas etapas de higiene **não** reescrevem a transcrição JSONL armazenada
em disco; no entanto, uma etapa separada de reparo do arquivo de sessão pode reescrever arquivos JSONL malformados
descartando linhas inválidas antes de a sessão ser carregada. Quando ocorre um reparo, o arquivo
original recebe backup ao lado do arquivo da sessão.

O escopo inclui:

- Sanitização de id de chamadas de ferramenta
- Validação de entrada de chamadas de ferramenta
- Reparo de pareamento de resultados de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinaturas de pensamento
- Sanitização de carga de imagem
- Marcação de procedência de entrada do usuário (para prompts roteados entre sessões)

Se você precisar de detalhes de armazenamento da transcrição, veja:

- [/reference/session-management-compaction](/pt-BR/reference/session-management-compaction)

---

## Onde isso é executado

Toda a higiene de transcrição é centralizada no embedded runner:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrição, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regra global: sanitização de imagem

Cargas de imagem são sempre sanitizadas para evitar rejeição do lado do provedor devido a
limites de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com suporte a visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente sem `input` e sem `arguments` são descartados
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
isso para evitar tratar prompts internos roteados como instruções escritas pelo usuário final.

Durante a reconstrução do contexto, o OpenClaw também prefixa um pequeno marcador `[Inter-session message]`
a esses turnos de usuário em memória para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio isolados sem um bloco de conteúdo seguinte) em transcrições do OpenAI Responses/Codex.
- Nenhuma sanitização de id de chamada de ferramenta.
- Nenhum reparo de pareamento de resultado de ferramenta.
- Nenhuma validação ou reordenação de turnos.
- Nenhum resultado sintético de ferramenta.
- Nenhuma remoção de assinatura de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prefixa um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de pensamento; descarta blocos de pensamento sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não são base64 (mantém base64).

**Todo o resto**

- Apenas sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes da release 2026.1.22, o OpenClaw aplicava várias camadas de higiene de transcrição:

- Uma extensão **transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar o pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também executava sanitização específica de provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Descarte de turnos vazios de erro do assistente.
  - Corte de conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causava regressões entre provedores (notadamente no pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou o OpenAI **intocável** além da sanitização de imagem.
