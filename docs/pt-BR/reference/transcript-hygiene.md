---
read_when:
    - Você está depurando rejeições de solicitações do provedor vinculadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de IDs de chamadas de ferramenta entre provedores
summary: 'Referência: regras específicas do provedor para sanitização e reparo de transcrições'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-05-10T19:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correções específicas de provedor** às transcrições antes de uma execução (ao construir o contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a requisitos rígidos dos provedores. Uma etapa separada de reparo do arquivo de sessão também pode reescrever o JSONL armazenado antes que a sessão seja carregada, mas apenas para linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos. As respostas entregues pelo assistente são preservadas em disco; a remoção de prefill do assistente específica do provedor acontece apenas durante a construção dos payloads de saída. Quando ocorre um reparo, o arquivo original é copiado como backup ao lado do arquivo de sessão.

O escopo inclui:

- Contexto de prompt somente de runtime ficando fora dos turnos de transcrição visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de raciocínio
- Sanitização de payload de imagem
- Limpeza de blocos de texto em branco antes do replay do provedor
- Marcação de proveniência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro vazio do assistente para replay do Bedrock Converse

Se você precisa de detalhes sobre armazenamento de transcrições, consulte:

- [Análise aprofundada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrição do usuário

O contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas ele
não é conteúdo criado pelo usuário final. OpenClaw mantém um corpo de prompt separado voltado
à transcrição para respostas do Gateway, follow-ups enfileirados, ACP, CLI e execuções
incorporadas do Pi. Turnos visíveis de usuário armazenados usam esse corpo de transcrição em vez do
prompt enriquecido por runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de histórico do Gateway
aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat,
TUI, REST ou SSE.

---

## Onde isto é executado

Toda a higiene de transcrições é centralizada no executor incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrições, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado a partir de `run/attempt.ts` e `compact.ts` (executor incorporado)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor devido a
limites de tamanho (redimensionamento/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto em branco são removidos enquanto esta etapa percorre o conteúdo de replay. Turnos do assistente
  que ficam vazios são descartados da cópia de replay; turnos de usuário e de resultado de ferramenta
  que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são descartados
antes que o contexto do modelo seja construído. Isso evita rejeições do provedor causadas por chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha de limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio entre agentes), OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

OpenClaw também antepõe ao mesmo turno um marcador `[Inter-session message ... isUser=false]`
antes do texto do prompt roteado, para que a chamada do modelo ativo consiga distinguir
saída de sessão externa de instruções externas do usuário final. Esse marcador inclui
a sessão de origem, o canal e a ferramenta quando disponíveis. A transcrição ainda usa
`role: "user"` para compatibilidade com o provedor, mas o texto visível e os metadados
de proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos mais antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio isolados sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex, e descarta raciocínio OpenAI reproduzível após uma troca de rota de modelo.
- Preserva payloads de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo itens criptografados com resumo vazio, para que o replay manual/WebSocket mantenha o estado `rs_*` necessário pareado com itens de saída do assistente.
- Native ChatGPT Codex Responses segue a paridade de fio do Codex ao reproduzir payloads anteriores de raciocínio/mensagem/função do Responses sem IDs de item anteriores, preservando o `prompt_cache_key` da sessão.
- Sem sanitização de id de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Sem remoção de assinatura de pensamento.

**OpenAI-compatible Chat Completions**

- Blocos históricos de pensamento/raciocínio do assistente são removidos antes do replay para que
  servidores locais e de proxy compatíveis com OpenAI não recebam campos de raciocínio
  de turnos anteriores, como `reasoning` ou `reasoning_content`.
- Continuações de chamada de ferramenta no mesmo turno atual mantêm o bloco de raciocínio do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta tenha sido reproduzido.
- Exceções pertencentes ao provedor podem optar por sair quando seu protocolo de fio exigir
  metadados de raciocínio reproduzidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (antepõe um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de raciocínio; descarta blocos de raciocínio sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).
- Turnos finais de prefill do assistente são removidos de payloads Anthropic Messages
  de saída quando o raciocínio está habilitado, incluindo rotas do Cloudflare AI Gateway.
- Blocos de raciocínio com assinaturas de replay ausentes, vazias ou em branco são removidos
  antes da conversão do provedor. Se isso esvaziar um turno do assistente, OpenClaw mantém
  a forma do turno com texto não vazio de raciocínio omitido.
- Turnos mais antigos do assistente somente com raciocínio que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que os adaptadores de provedor não descartem o turno
  de replay.

**Amazon Bedrock (Converse API)**

- Turnos de erro de stream vazios do assistente são reparados para um bloco de texto de fallback não vazio
  antes do replay. Bedrock Converse rejeita mensagens do assistente com `content: []`, então
  turnos persistidos do assistente com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são descartados
  da cópia de replay em memória em vez de reproduzir um bloco em branco inválido.
- Blocos de raciocínio do Claude com assinaturas de replay ausentes, vazias ou em branco são
  removidos antes do replay do Converse. Se isso esvaziar um turno do assistente, OpenClaw
  mantém a forma do turno com texto não vazio de raciocínio omitido.
- Turnos mais antigos do assistente somente com raciocínio que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que o replay do Converse mantenha a forma estrita dos turnos.
- O replay filtra turnos do assistente de espelhamento de entrega do OpenClaw e injetados pelo Gateway.
- A sanitização de imagens se aplica pela regra global.

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico de comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de prefill do assistente são removidos de payloads de modelos Anthropic
  compatíveis com OpenAI verificados do OpenRouter quando o raciocínio está habilitado, correspondendo
  ao comportamento de replay direto da Anthropic e do Cloudflare Anthropic.

**Todo o resto**

- Apenas sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, OpenClaw aplicava várias camadas de higiene de transcrições:

- Uma **extensão de sanitização de transcrição** era executada em cada construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O executor também realizava sanitização específica do provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Descarte de turnos de erro vazios do assistente.
  - Corte do conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notavelmente o pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no executor e tornou o OpenAI **sem toque** além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
