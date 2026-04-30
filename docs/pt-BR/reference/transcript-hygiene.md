---
read_when:
    - Você está depurando rejeições de solicitações do provedor vinculadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramentas
    - Você está investigando incompatibilidades de IDs de chamadas de ferramenta entre provedores
summary: 'Referência: regras específicas de provedor para sanitização e reparo de transcrições'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-04-30T10:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correções específicas de provedor** às transcrições antes de uma execução (ao criar o contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a requisitos rígidos de provedores. Uma etapa separada de reparo do arquivo de sessão também pode reescrever JSONL armazenado antes que a sessão seja carregada, seja descartando linhas JSONL malformadas ou reparando turnos persistidos que são sintaticamente válidos, mas conhecidos por serem rejeitados por um
provedor durante a reprodução. Quando ocorre um reparo, o arquivo original recebe um backup ao lado
do arquivo de sessão.

O escopo inclui:

- Contexto de prompt somente em runtime ficando fora dos turnos de transcrição visíveis ao usuário
- Sanitização de IDs de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultados de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de Thinking
- Sanitização de payloads de imagem
- Limpeza de blocos de texto em branco antes da reprodução pelo provedor
- Marcação de proveniência da entrada do usuário (para prompts roteados entre sessões)
- Reparo de turnos de erro vazios do assistente para reprodução no Bedrock Converse

Se precisar de detalhes sobre armazenamento de transcrições, consulte:

- [Análise detalhada de gerenciamento de sessões](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrição do usuário

O contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas ele
não é conteúdo criado pelo usuário final. OpenClaw mantém um corpo de prompt separado voltado à
transcrição para respostas do Gateway, acompanhamentos em fila, ACP, CLI e execuções de Pi
embutidas. Turnos visíveis de usuário armazenados usam esse corpo de transcrição em vez do
prompt enriquecido por runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de histórico do Gateway
aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat,
TUI, REST ou SSE.

---

## Onde isto é executado

Toda a higiene de transcrição é centralizada no runner embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrição, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado a partir de `run/attempt.ts` e `compact.ts` (runner embutido)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição pelo provedor devido a limites
de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com suporte a visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto em branco são removidos enquanto essa etapa percorre o conteúdo de reprodução. Turnos do assistente
  que ficam vazios são descartados da cópia de reprodução; turnos de usuário e de resultado de ferramenta
  que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são descartados
antes que o contexto do modelo seja criado. Isso evita rejeições do provedor por chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha de limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio entre agentes), OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

OpenClaw também antepõe um marcador `[Inter-session message ... isUser=false]`
no mesmo turno antes do texto do prompt roteado, para que a chamada ativa do modelo consiga distinguir
saída de sessão estrangeira de instruções externas do usuário final. Esse marcador inclui
a sessão de origem, canal e ferramenta quando disponíveis. A transcrição ainda usa
`role: "user"` para compatibilidade com provedores, mas o texto visível e os metadados de
proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos mais antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio autônomos sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex e descarta raciocínio OpenAI reproduzível após uma troca de rota de modelo.
- Preserva payloads de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo itens criptografados com resumo vazio, para que a reprodução manual/WebSocket mantenha o estado `rs_*` necessário pareado com itens de saída do assistente.
- Sem sanitização de IDs de chamada de ferramenta.
- O reparo de pareamento de resultados de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de reprodução do Codex.
- Sem remoção de assinatura de pensamento.

**Gemma 4 compatível com OpenAI**

- Blocos históricos de thinking/raciocínio do assistente são removidos antes da reprodução para que servidores
  Gemma 4 locais compatíveis com OpenAI não recebam conteúdo de raciocínio de turnos anteriores.
- Continuações de chamada de ferramenta do mesmo turno atual mantêm o bloco de raciocínio do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta seja reproduzido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de IDs de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultados de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Ajuste de ordenação de turnos do Google (antepõe um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; descarta blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultados de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos consecutivos de usuário para atender à alternância estrita).
- Turnos finais de prefill do assistente são removidos dos payloads de Anthropic Messages
  enviados quando thinking está habilitado, incluindo rotas do Cloudflare AI Gateway.
- Blocos de thinking com assinaturas de reprodução ausentes, vazias ou em branco são removidos
  antes da conversão do provedor. Se isso esvaziar um turno do assistente, OpenClaw mantém
  a forma do turno com texto não vazio de raciocínio omitido.
- Turnos mais antigos do assistente contendo apenas thinking que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido, para que os adaptadores de provedor não descartem o turno
  de reprodução.

**Amazon Bedrock (Converse API)**

- Turnos de erro de stream vazios do assistente são reparados para um bloco de texto fallback não vazio
  antes da reprodução. O Bedrock Converse rejeita mensagens do assistente com `content: []`, portanto
  turnos persistidos do assistente com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são descartados
  da cópia de reprodução em memória em vez de reproduzir um bloco em branco inválido.
- Blocos de thinking do Claude com assinaturas de reprodução ausentes, vazias ou em branco são
  removidos antes da reprodução no Converse. Se isso esvaziar um turno do assistente, OpenClaw
  mantém a forma do turno com texto não vazio de raciocínio omitido.
- Turnos mais antigos do assistente contendo apenas thinking que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido, para que a reprodução no Converse mantenha a forma estrita dos turnos.
- A reprodução filtra turnos espelhados de entrega do OpenClaw e turnos do assistente injetados pelo gateway.
- A sanitização de imagens é aplicada pela regra global.

**Mistral (incluindo detecção baseada em ID de modelo)**

- Sanitização de IDs de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não são base64 (mantém base64).

**Todo o restante**

- Apenas sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, OpenClaw aplicava várias camadas de higiene de transcrição:

- Uma **extensão de sanitização de transcrição** era executada em toda criação de contexto e podia:
  - Reparar o pareamento de uso/resultado de ferramenta.
  - Sanitizar IDs de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também executava sanitização específica por provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remover tags `<final>` do texto do assistente antes da persistência.
  - Descartar turnos de erro vazios do assistente.
  - Aparar conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notavelmente no pareamento
`call_id|fc_id` do `openai-responses`). A limpeza da versão 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou o OpenAI **intocado** além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
