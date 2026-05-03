---
read_when:
    - Você está depurando rejeições de solicitações do provedor relacionadas ao formato da transcrição
    - Você está alterando a sanitização da transcrição ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de IDs de chamadas de ferramenta entre provedores
summary: 'Referência: regras por provedor para sanitização e reparo de transcrições'
title: Higiene da transcrição
x-i18n:
    generated_at: "2026-05-03T05:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

O OpenClaw aplica **correções específicas por provedor** aos transcripts antes de uma execução (ao construir o contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a requisitos rigorosos dos provedores. Uma etapa separada de reparo do arquivo de sessão também pode reescrever o JSONL armazenado antes que a sessão seja carregada, mas apenas para linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos. As respostas entregues pelo assistente são preservadas em disco; a remoção de prefill de assistente específica do provedor ocorre somente durante a construção dos payloads de saída. Quando ocorre um reparo, o arquivo original é copiado como backup junto ao arquivo de sessão.

O escopo inclui:

- Contexto de prompt apenas em tempo de execução que fica fora dos turnos de transcript visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de raciocínio
- Sanitização de payload de imagem
- Limpeza de blocos de texto em branco antes da reprodução pelo provedor
- Marcação de proveniência de entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro de assistente vazio para reprodução do Bedrock Converse

Se você precisar de detalhes sobre armazenamento de transcript, consulte:

- [Visão aprofundada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcript do usuário

O contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas ele
não é conteúdo criado pelo usuário final. O OpenClaw mantém um corpo de prompt separado,
voltado ao transcript, para respostas do Gateway, followups enfileirados, ACP, CLI e execuções
Pi incorporadas. Turnos visíveis de usuário armazenados usam esse corpo de transcript em vez do
prompt enriquecido em runtime.

Para sessões legadas que já persistiram wrappers de runtime, as superfícies de histórico do Gateway
aplicam uma projeção de exibição antes de retornar mensagens a clientes WebChat,
TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higiene de transcript é centralizada no executor incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcript, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado a partir de `run/attempt.ts` e `compact.ts` (executor incorporado)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor devido a limites
de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos compatíveis com visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto em branco são removidos enquanto essa etapa percorre o conteúdo de reprodução. Turnos de assistente
  que ficam vazios são descartados da cópia de reprodução; turnos de usuário e de resultado de ferramenta
  que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente sem `input` nem `arguments` são descartados
antes que o contexto do modelo seja construído. Isso evita rejeições de provedor causadas por chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/anúncio entre agentes), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

O OpenClaw também prefixa um marcador no mesmo turno `[Inter-session message ... isUser=false]`
antes do texto do prompt roteado para que a chamada ativa do modelo possa distinguir
a saída de sessão externa de instruções externas do usuário final. Esse marcador inclui
a sessão de origem, o canal e a ferramenta quando disponíveis. O transcript ainda usa
`role: "user"` por compatibilidade com provedores, mas o texto visível e os metadados
de proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, o OpenClaw aplica o mesmo marcador a turnos de usuário
entre sessões persistidos mais antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio independentes sem um bloco de conteúdo subsequente) para transcripts OpenAI Responses/Codex, e descarta raciocínio OpenAI reproduzível após uma troca de rota de modelo.
- Preserva payloads de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo itens criptografados de resumo vazio, para que a reprodução manual/WebSocket mantenha o estado `rs_*` obrigatório pareado com itens de saída do assistente.
- Sem sanitização de id de chamada de ferramenta.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de reprodução do Codex.
- Sem remoção de assinatura de pensamento.

**Gemma 4 compatível com OpenAI**

- Blocos históricos de pensamento/raciocínio do assistente são removidos antes da reprodução para que servidores
  Gemma 4 locais compatíveis com OpenAI não recebam conteúdo de raciocínio de turnos anteriores.
- Continuações de chamada de ferramenta no mesmo turno atual mantêm o bloco de raciocínio do assistente
  anexado à chamada de ferramenta até que o resultado da ferramenta tenha sido reproduzido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prefixa um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normaliza assinaturas de raciocínio; descarta blocos de raciocínio não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos de usuário consecutivos para satisfazer alternância estrita).
- Turnos finais de prefill do assistente são removidos dos payloads Anthropic Messages
  de saída quando o raciocínio está habilitado, incluindo rotas do Cloudflare AI Gateway.
- Blocos de raciocínio com assinaturas de reprodução ausentes, vazias ou em branco são removidos
  antes da conversão do provedor. Se isso esvaziar um turno de assistente, o OpenClaw mantém
  o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos somente com raciocínio que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que os adaptadores de provedor não descartem o turno de reprodução.

**Amazon Bedrock (Converse API)**

- Turnos de erro de stream do assistente vazios são reparados para um bloco de texto fallback não vazio
  antes da reprodução. O Bedrock Converse rejeita mensagens de assistente com `content: []`, então
  turnos de assistente persistidos com `stopReason: "error"` e conteúdo vazio também são
  reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são descartados
  da cópia de reprodução em memória em vez de reproduzir um bloco em branco inválido.
- Blocos de raciocínio Claude com assinaturas de reprodução ausentes, vazias ou em branco são
  removidos antes da reprodução do Converse. Se isso esvaziar um turno de assistente, o OpenClaw
  mantém o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos somente com raciocínio que precisam ser removidos são substituídos por
  texto não vazio de raciocínio omitido para que a reprodução do Converse mantenha o formato estrito dos turnos.
- A reprodução filtra turnos de assistente de espelho de entrega do OpenClaw e injetados pelo gateway.
- A sanitização de imagens se aplica pela regra global.

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de prefill do assistente são removidos de payloads de modelos Anthropic verificados
  compatíveis com OpenAI no OpenRouter quando o raciocínio está habilitado, correspondendo
  ao comportamento de reprodução direta da Anthropic e da Cloudflare Anthropic.

**Todo o restante**

- Apenas sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, o OpenClaw aplicava várias camadas de higiene de transcript:

- Uma **extensão transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O executor também realizava sanitização específica por provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remover tags `<final>` do texto do assistente antes da persistência.
  - Descartar turnos de erro de assistente vazios.
  - Aparar conteúdo de assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notadamente o pareamento
`call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no executor e tornou a OpenAI **sem alterações** além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
