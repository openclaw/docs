---
read_when:
    - Você está depurando rejeições de solicitações de provedor relacionadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramentas
    - Você está investigando divergências de IDs de chamadas de ferramenta entre provedores
summary: 'Referência: regras de sanitização e reparo de transcrição específicas do provedor'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-05-05T01:49:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correções específicas de provedor** a transcritos antes de uma execução (ao construir o contexto do modelo). A maioria delas são ajustes **em memória** usados para satisfazer requisitos rigorosos de provedores. Uma etapa separada de reparo de arquivo de sessão também pode reescrever o JSONL armazenado antes que a sessão seja carregada, mas apenas para linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos. Respostas entregues pelo assistente são preservadas em disco; a remoção de prefill do assistente específica de provedor acontece apenas durante a construção de payloads de saída. Quando ocorre um reparo, o arquivo original recebe backup ao lado do arquivo de sessão.

O escopo inclui:

- Contexto de prompt apenas em runtime ficando fora dos turnos de transcrito visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de thinking
- Sanitização de payload de imagem
- Limpeza de blocos de texto vazios antes do replay do provedor
- Marcação de proveniência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro vazio do assistente para replay do Bedrock Converse

Se você precisar de detalhes de armazenamento de transcritos, veja:

- [Análise detalhada de gerenciamento de sessões](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrito do usuário

Contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas ele
não é conteúdo criado pelo usuário final. OpenClaw mantém um corpo de prompt separado voltado ao transcrito
para respostas do Gateway, acompanhamentos enfileirados, ACP, CLI e execuções de Pi
embutidas. Turnos visíveis de usuário armazenados usam esse corpo de transcrito em vez do
prompt enriquecido em runtime.

Para sessões legadas que já persistiram wrappers de runtime, superfícies de histórico do Gateway
aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat,
TUI, REST ou SSE.

---

## Onde isso executa

Toda a higiene de transcritos é centralizada no runner embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcritos, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado a partir de `run/attempt.ts` e `compact.ts` (runner embutido)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição pelo provedor devido a limites
de tamanho (redimensionar/recomprimir imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens para modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto vazios são removidos enquanto esta etapa percorre o conteúdo de replay. Turnos de assistente
  que ficam vazios são removidos da cópia de replay; turnos de usuário e de resultado de ferramenta
  que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são removidos
antes de o contexto do modelo ser construído. Isso evita rejeições de provedor por chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio de agente para agente), OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

OpenClaw também prefixa um marcador `[Inter-session message ... isUser=false]`
no mesmo turno antes do texto do prompt roteado para que a chamada ativa ao modelo consiga distinguir
saída de sessão externa de instruções externas do usuário final. Esse marcador inclui
a sessão de origem, o canal e a ferramenta quando disponíveis. O transcrito ainda usa
`role: "user"` para compatibilidade com provedores, mas o texto visível e os metadados
de proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos mais antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Remove assinaturas de raciocínio órfãs (itens de raciocínio autônomos sem um bloco de conteúdo seguinte) para transcritos OpenAI Responses/Codex, e remove raciocínio OpenAI reproduzível após uma troca de rota de modelo.
- Preserva payloads de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo itens criptografados com resumo vazio, para que o replay manual/WebSocket mantenha o estado `rs_*` necessário pareado com itens de saída do assistente.
- Native ChatGPT Codex Responses segue paridade de fio do Codex ao reproduzir payloads anteriores de raciocínio/mensagem/função de Responses sem IDs de itens anteriores, preservando `prompt_cache_key` da sessão.
- Sem sanitização de id de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Sem remoção de assinatura de pensamento.

**Gemma 4 compatível com OpenAI**

- Blocos históricos de thinking/raciocínio do assistente são removidos antes do replay para que servidores locais
  Gemma 4 compatíveis com OpenAI não recebam conteúdo de raciocínio de turnos anteriores.
- Continuações de chamada de ferramenta no mesmo turno atual mantêm o bloco de raciocínio do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta tenha sido reproduzido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérica estrita.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prefixa um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).
- Turnos finais de prefill do assistente são removidos de payloads Anthropic Messages
  de saída quando thinking está habilitado, incluindo rotas Cloudflare AI Gateway.
- Blocos de thinking com assinaturas de replay ausentes, vazias ou em branco são removidos
  antes da conversão do provedor. Se isso esvaziar um turno de assistente, OpenClaw mantém
  o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos apenas com thinking que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que adaptadores de provedor não removam o turno
  de replay.

**Amazon Bedrock (Converse API)**

- Turnos vazios de erro de stream do assistente são reparados para um bloco de texto fallback não vazio
  antes do replay. Bedrock Converse rejeita mensagens de assistente com `content: []`, então
  turnos de assistente persistidos com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são removidos
  da cópia de replay em memória em vez de reproduzir um bloco em branco inválido.
- Blocos de thinking do Claude com assinaturas de replay ausentes, vazias ou em branco são
  removidos antes do replay do Converse. Se isso esvaziar um turno de assistente, OpenClaw
  mantém o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos apenas com thinking que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que o replay do Converse mantenha o formato estrito de turnos.
- O replay filtra turnos de assistente de espelho de entrega do OpenClaw e injetados pelo gateway.
- A sanitização de imagens se aplica pela regra global.

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérica com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não são base64 (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de prefill do assistente são removidos de payloads de modelos Anthropic
  compatíveis com OpenAI verificados do OpenRouter quando raciocínio está habilitado, correspondendo
  ao comportamento de replay direto do Anthropic e Cloudflare Anthropic.

**Todo o resto**

- Apenas sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, OpenClaw aplicava várias camadas de higiene de transcritos:

- Uma **extensão de sanitização de transcrito** executava em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também realizava sanitização específica de provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política de provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Remoção de turnos vazios de erro do assistente.
  - Corte do conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notavelmente pareamento
`call_id|fc_id` do `openai-responses`). A limpeza da versão 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou OpenAI **sem toque** além da sanitização de imagens.

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
