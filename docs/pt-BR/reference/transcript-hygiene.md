---
read_when:
    - Você está depurando rejeições de solicitações do provedor relacionadas à estrutura da transcrição
    - Você está alterando a lógica de sanitização de transcrições ou de reparo de chamadas de ferramentas
    - Você está investigando incompatibilidades de IDs de chamadas de ferramentas entre provedores
summary: 'Referência: regras de sanitização e reparo de transcrições específicas do provedor'
title: Higiene de transcrições
x-i18n:
    generated_at: "2026-07-12T15:39:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

O OpenClaw aplica **correções específicas do provedor** às transcrições antes de uma execução
(ao criar o contexto do modelo). A maioria delas consiste em ajustes **na memória** usados para
atender a requisitos rigorosos do provedor. Uma etapa separada de reparo do arquivo de sessão
também pode reescrever o JSONL armazenado antes que a sessão seja carregada, mas somente para
linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos.
As respostas entregues pelo assistente são preservadas em disco; a remoção de
preenchimento prévio do assistente específica do provedor ocorre somente durante a criação
dos payloads de saída.

Quando ocorre um reparo, o arquivo original é gravado em um arquivo irmão transitório
`*.bak-<pid>-<ts>` antes da substituição atômica e removido depois que a
substituição é concluída com sucesso. O backup é mantido somente se a própria limpeza falhar,
caso em que o caminho é informado.

O escopo inclui:

- Manutenção do contexto de prompt exclusivo do runtime fora dos turnos da transcrição visíveis ao usuário
- Sanitização de IDs de chamadas de ferramenta
- Validação da entrada de chamadas de ferramenta
- Reparo do pareamento de resultados de ferramentas
- Validação / ordenação de turnos
- Limpeza de assinaturas de pensamento
- Limpeza de assinaturas de raciocínio
- Sanitização de payloads de imagem
- Limpeza de blocos de texto vazios antes da reprodução pelo provedor
- Limpeza de turnos incompletos por limite de tamanho contendo somente raciocínio antes da reprodução pelo provedor
- Marcação da proveniência da entrada do usuário (para prompts roteados entre sessões)
- Reparo de turnos de erro vazios do assistente para reprodução no Bedrock Converse

Se precisar de detalhes sobre o armazenamento de transcrições, consulte
[Análise aprofundada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

---

## Regra global: o contexto do runtime não é a transcrição do usuário

O contexto do runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas não é
conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt separado voltado
à transcrição para respostas do Gateway, acompanhamentos enfileirados, ACP, CLI e execuções
incorporadas do OpenClaw. Os turnos visíveis do usuário armazenados usam esse corpo da transcrição em vez
do prompt enriquecido pelo runtime.

Para sessões legadas que já persistiram wrappers do runtime, as superfícies de histórico
do Gateway aplicam uma projeção de exibição antes de retornar mensagens aos clientes
WebChat, TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higienização de transcrições é centralizada no executor incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, baseada em `provider`, `modelApi` e `modelId`)
- Aplicação da sanitização/reparo: `sanitizeSessionHistory` em
  `src/agents/embedded-agent-runner/replay-history.ts`

Separadamente da higienização de transcrições, os arquivos de sessão são reparados (se necessário)
antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado por `src/agents/embedded-agent-runner/run/attempt.ts` e
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regra global: sanitização de imagens

Os payloads de imagem sempre são sanitizados para evitar rejeições pelo provedor devido aos
limites de tamanho (redução de escala/recompressão de imagens base64 grandes demais). Isso também ajuda
a controlar a pressão sobre os tokens causada por imagens em modelos com capacidade de visão: dimensões
máximas menores reduzem o uso de tokens, enquanto dimensões maiores preservam os detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O tamanho máximo do lado da imagem é configurável por meio de `agents.defaults.imageMaxDimensionPx`
  (padrão: `1200`)
- Blocos de texto vazios são removidos enquanto essa etapa percorre o conteúdo de reprodução.
  Turnos do assistente que ficam vazios são descartados da cópia de reprodução; turnos do usuário
  e de resultados de ferramentas que ficam vazios recebem um placeholder não vazio de
  conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamadas de ferramenta do assistente sem `input` e `arguments` são descartados
antes da criação do contexto do modelo. Isso evita rejeições do provedor causadas por
chamadas de ferramenta parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regra global: turnos incompletos contendo somente raciocínio

Turnos do assistente que atingem o limite de saída do provedor contendo apenas conteúdo de raciocínio ou
raciocínio ocultado são omitidos da cópia de reprodução na memória. Esses
turnos contêm um estado incompleto do provedor e podem carregar uma assinatura parcial de raciocínio.

Turnos vazios por limite de tamanho permanecem inalterados, assim como turnos por limite de tamanho com texto visível,
chamadas de ferramenta ou blocos de conteúdo desconhecidos. As transcrições armazenadas não são reescritas.

Implementação: `normalizeAssistantReplayContent` em
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão por meio de `sessions_send`
(incluindo etapas de resposta/anúncio entre agentes), o OpenClaw persiste o
turno de usuário criado com `message.provenance.kind = "inter_session"`.

O OpenClaw também adiciona, no início do mesmo turno, um marcador `[Inter-session message] ... isUser=false`
antes do texto do prompt encaminhado, para que a chamada do modelo ativo possa
distinguir a saída de uma sessão externa das instruções de um usuário final externo. Esse
marcador inclui a sessão, o canal e a ferramenta de origem quando disponíveis. A
transcrição ainda usa `role: "user"` para compatibilidade com o provedor, mas tanto o
texto visível quanto os metadados de proveniência identificam o turno como
dados entre sessões.

Durante a reconstrução do contexto, o OpenClaw aplica o mesmo marcador a turnos
de usuário entre sessões persistidos anteriormente que tenham apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio independentes sem um
  bloco de conteúdo subsequente) em transcrições do OpenAI Responses/Codex e descarta
  o raciocínio reproduzível da OpenAI após uma troca de rota de modelo.
- Preserva os payloads reproduzíveis de itens de raciocínio do OpenAI Responses, incluindo
  itens criptografados com resumo vazio, para que a reprodução manual/via WebSocket mantenha o estado
  `rs_*` obrigatório associado aos itens de saída do assistente.
- O ChatGPT Codex Responses nativo mantém a paridade com o protocolo do Codex ao reproduzir
  payloads anteriores de raciocínio/mensagem/função do Responses sem IDs de itens
  anteriores, preservando a `prompt_cache_key` da sessão.
- A reprodução da família OpenAI Responses preserva pares canônicos de raciocínio
  `call_*|fc_*` do mesmo modelo, mas normaliza de modo determinístico IDs de itens
  `call_id`/chamada de função malformados ou longos demais antes da conversão do payload do pi-ai.
- O reparo do pareamento de resultados de ferramentas pode mover saídas reais correspondentes e sintetizar
  saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos; sem remoção de assinaturas de pensamento.

**Chat Completions compatível com OpenAI**

- Blocos históricos de pensamento/raciocínio do assistente são removidos antes da reprodução
  para que servidores locais e servidores proxy compatíveis com OpenAI não recebam
  campos de raciocínio de turnos anteriores, como `reasoning` ou `reasoning_content`.
- Continuações de chamadas de ferramenta no mesmo turno atual mantêm o bloco de raciocínio
  do assistente anexado à chamada de ferramenta até que o resultado da ferramenta seja reproduzido.
- Entradas de modelos personalizados/auto-hospedados com `reasoning: true` preservam os metadados
  de raciocínio reproduzidos.
- Exceções controladas pelo provedor podem não aplicar esse comportamento quando o protocolo
  de comunicação exigir metadados de raciocínio reproduzidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização do ID da chamada de ferramenta: estritamente alfanumérico.
- Reparo do pareamento de resultados de ferramentas e resultados sintéticos de ferramentas.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Ajuste da ordem dos turnos do Google (adiciona no início uma pequena inicialização do usuário se o histórico
  começar com o assistente).
- Antigravity Claude: normaliza assinaturas de pensamento; descarta blocos de pensamento
  não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo do pareamento de resultados de ferramentas e resultados sintéticos de ferramentas.
- Validação de turnos (mescla turnos consecutivos do usuário para atender à
  alternância estrita).
- Turnos finais de preenchimento prévio do assistente são removidos dos payloads de saída do Anthropic
  Messages quando o pensamento está habilitado, incluindo rotas do Cloudflare AI
  Gateway.
- Assinaturas de pensamento do assistente anteriores à Compaction são removidas antes da reprodução pelo provedor
  quando uma sessão foi compactada. As assinaturas de pensamento são
  vinculadas criptograficamente ao prefixo da conversa no momento da geração;
  após a Compaction, o prefixo muda (o conteúdo resumido substitui o
  original), portanto, reproduzir as assinaturas originais faz com que a Anthropic
  rejeite a solicitação com "Invalid signature in thinking block". O
  texto do pensamento é preservado como um bloco não assinado e depois processado pela
  regra abaixo.
- Blocos de pensamento com assinaturas de reprodução ausentes, vazias ou em branco são
  removidos antes da conversão do provedor. Se isso esvaziar um turno do assistente,
  o OpenClaw preserva o formato do turno com um texto não vazio indicando raciocínio omitido.
- Turnos mais antigos do assistente contendo apenas pensamento que precisam ser removidos são substituídos
  por um texto não vazio indicando raciocínio omitido, para que os adaptadores do provedor não descartem
  o turno reproduzido.

**Amazon Bedrock (API Converse)**

- Turnos de erro de streaming do assistente vazios são corrigidos para um bloco
  de texto de fallback não vazio antes da reprodução. O Bedrock Converse rejeita mensagens
  do assistente com `content: []`, portanto, turnos persistidos do assistente com `stopReason:
"error"` e conteúdo vazio também são corrigidos no disco antes do carregamento.
- Turnos de erro de streaming do assistente que contêm apenas blocos de texto em branco são descartados da
  cópia de reprodução em memória, em vez de reproduzir um bloco em branco inválido.
- As assinaturas de raciocínio do assistente anteriores à Compaction são removidas antes da reprodução
  pelo Converse quando uma sessão foi compactada, pelo mesmo motivo que no
  Anthropic acima.
- Blocos de raciocínio do Claude com assinaturas de reprodução ausentes, vazias ou em branco
  são removidos antes da reprodução pelo Converse. Se isso esvaziar um turno do assistente,
  o OpenClaw preserva a estrutura do turno com um texto não vazio indicando raciocínio omitido.
- Turnos antigos do assistente contendo apenas raciocínio que precisam ser removidos são substituídos
  por um texto não vazio indicando raciocínio omitido, para que a reprodução pelo Converse preserve
  a estrutura estrita dos turnos.
- A reprodução filtra turnos do assistente espelhados para entrega pelo OpenClaw e injetados pelo
  Gateway.
- A sanitização de imagens é aplicada por meio da regra global.

**Mistral (incluindo detecção baseada no ID do modelo)**

- Sanitização do ID de chamada de ferramenta: strict9 (alfanumérico, comprimento 9).

**OpenRouter Gemini**

- Limpeza da assinatura de raciocínio: remove valores de `thought_signature` que não estejam em base64
  (mantém os que estão em base64).

**OpenRouter Anthropic**

- Turnos finais de preenchimento prévio do assistente são removidos de payloads verificados de modelos Anthropic
  compatíveis com OpenAI do OpenRouter quando o raciocínio está habilitado,
  correspondendo ao comportamento de reprodução do Anthropic direto e do Cloudflare Anthropic.

**Todo o restante**

- Apenas sanitização de imagens.

---

## Comportamento histórico (anterior à versão 2026.1.22)

Antes da versão 2026.1.22, o OpenClaw aplicava várias camadas de higiene
de transcrição:

- Uma **extensão de sanitização de transcrição** era executada em cada construção de contexto e podia:
  - Corrigir o pareamento entre uso e resultado de ferramentas.
  - Sanitizar IDs de chamadas de ferramentas (incluindo um modo não estrito que preservava
    `_`/`-`).
- O executor também realizava sanitização específica do provedor, o que
  duplicava o trabalho.
- Outras mutações ocorriam fora da política do provedor, incluindo
  a remoção de tags `<final>` do texto do assistente antes da persistência, o descarte
  de turnos de erro vazios do assistente e o corte do conteúdo do assistente após chamadas de
  ferramentas.

Essa complexidade causava regressões entre provedores (principalmente no
pareamento de `call_id|fc_id` do `openai-responses`). A limpeza da versão 2026.1.22 removeu
a extensão, centralizou a lógica no executor e tornou o OpenAI **sem alterações**
além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
