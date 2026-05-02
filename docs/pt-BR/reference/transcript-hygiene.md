---
read_when:
    - Você está depurando rejeições de solicitações do provedor relacionadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de IDs de chamadas de ferramenta entre provedores
summary: 'Referência: regras específicas do provedor para sanitização e reparo de transcrições'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-05-02T21:04:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correções específicas por provedor** às transcrições antes de uma execução (ao construir o contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a requisitos rigorosos dos provedores. Uma passagem separada de reparo de arquivo de sessão também pode reescrever JSONL armazenado antes que a sessão seja carregada, seja descartando linhas JSONL malformadas ou reparando turnos persistidos que são sintaticamente válidos, mas conhecidos por serem rejeitados por um
provedor durante a reprodução. Quando ocorre um reparo, o arquivo original é salvo como backup ao lado
do arquivo de sessão.

O escopo inclui:

- Contexto de prompt somente em runtime ficando fora de turnos de transcrição visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de thinking
- Sanitização de payload de imagem
- Limpeza de blocos de texto em branco antes da reprodução pelo provedor
- Marcação de proveniência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro vazio do assistente para reprodução do Bedrock Converse

Se você precisar de detalhes de armazenamento de transcrições, consulte:

- [Aprofundamento em gerenciamento de sessões](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcrição do usuário

Contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas não é
conteúdo criado pelo usuário final. OpenClaw mantém um corpo de prompt separado voltado à transcrição
para respostas do Gateway, followups enfileirados, ACP, CLI e execuções Pi incorporadas.
Turnos visíveis de usuário armazenados usam esse corpo de transcrição em vez do
prompt enriquecido em runtime.

Para sessões legadas que já persistiram wrappers de runtime, superfícies de histórico do Gateway
aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat,
TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higiene de transcrição é centralizada no runner incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcrição, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (runner incorporado)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição pelo provedor devido a limites
de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos com visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto em branco são removidos enquanto essa passagem percorre o conteúdo de reprodução. Turnos do assistente
  que ficam vazios são descartados da cópia de reprodução; turnos de usuário e de resultado de ferramenta
  que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que não têm `input` nem `arguments` são descartados
antes que o contexto do modelo seja construído. Isso evita rejeições do provedor por chamadas de ferramenta
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
no mesmo turno antes do texto do prompt roteado, para que a chamada ativa do modelo possa distinguir
saída de sessão externa de instruções externas do usuário final. Esse marcador inclui
a sessão de origem, o canal e a ferramenta quando disponíveis. A transcrição ainda usa
`role: "user"` para compatibilidade com provedores, mas tanto o texto visível quanto os metadados
de proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Somente sanitização de imagens.
- Descarta assinaturas de reasoning órfãs (itens de reasoning independentes sem um bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex, e descarta reasoning reproduzível da OpenAI após uma troca de rota de modelo.
- Preserva payloads de itens de reasoning reproduzíveis do OpenAI Responses, incluindo itens criptografados com resumo vazio, para que a reprodução manual/WebSocket mantenha o estado `rs_*` obrigatório pareado com itens de saída do assistente.
- Sem sanitização de id de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de reprodução do Codex.
- Sem remoção de assinatura de pensamento.

**Gemma 4 compatível com OpenAI**

- Blocos históricos de thinking/reasoning do assistente são removidos antes da reprodução para que servidores locais
  Gemma 4 compatíveis com OpenAI não recebam conteúdo de reasoning de turnos anteriores.
- Continuações de chamada de ferramenta no mesmo turno atual mantêm o bloco de reasoning do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta tenha sido reproduzido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérica estrita.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Ajuste de ordenação de turnos do Google (prefixa um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; descarta blocos de thinking não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos de usuário consecutivos para satisfazer alternância estrita).
- Turnos finais de prefill do assistente são removidos dos payloads de Anthropic Messages
  enviados quando thinking está habilitado, incluindo rotas do Cloudflare AI Gateway.
- Blocos de thinking com assinaturas de reprodução ausentes, vazias ou em branco são removidos
  antes da conversão do provedor. Se isso esvaziar um turno do assistente, OpenClaw mantém
  o formato do turno com texto não vazio de reasoning omitido.
- Turnos antigos do assistente somente de thinking que precisam ser removidos são substituídos por
  texto não vazio de reasoning omitido para que adaptadores de provedor não descartem o turno de reprodução.

**Amazon Bedrock (Converse API)**

- Turnos de erro de stream vazios do assistente são reparados para um bloco de texto fallback não vazio
  antes da reprodução. O Bedrock Converse rejeita mensagens do assistente com `content: []`, então
  turnos do assistente persistidos com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são descartados
  da cópia de reprodução em memória em vez de reproduzir um bloco em branco inválido.
- Blocos de thinking do Claude com assinaturas de reprodução ausentes, vazias ou em branco são
  removidos antes da reprodução Converse. Se isso esvaziar um turno do assistente, OpenClaw
  mantém o formato do turno com texto não vazio de reasoning omitido.
- Turnos antigos do assistente somente de thinking que precisam ser removidos são substituídos por
  texto não vazio de reasoning omitido para que a reprodução Converse mantenha o formato estrito dos turnos.
- A reprodução filtra turnos do assistente espelhados por entrega do OpenClaw e injetados pelo gateway.
- A sanitização de imagens se aplica pela regra global.

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de prefill do assistente são removidos de payloads verificados de modelos Anthropic
  compatíveis com OpenAI do OpenRouter quando reasoning está habilitado, correspondendo
  ao comportamento de reprodução direta da Anthropic e da Cloudflare Anthropic.

**Todo o resto**

- Somente sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes do lançamento 2026.1.22, OpenClaw aplicava várias camadas de higiene de transcrição:

- Uma **extensão de sanitização de transcrição** era executada em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também realizava sanitização específica por provedor, duplicando trabalho.
- Mutações adicionais ocorriam fora da política de provedor, incluindo:
  - Remover tags `<final>` do texto do assistente antes da persistência.
  - Descartar turnos de erro vazios do assistente.
  - Cortar conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notavelmente no pareamento `call_id|fc_id` de
`openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou a
lógica no runner e tornou a OpenAI **sem alterações** além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
