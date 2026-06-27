---
read_when:
    - Você está depurando rejeições de solicitações do provedor vinculadas ao formato da transcrição
    - Você está alterando a sanitização de transcrições ou a lógica de reparo de chamadas de ferramenta
    - Você está investigando incompatibilidades de ids de chamadas de ferramenta entre provedores
summary: 'Referência: regras de sanitização e reparo de transcrições específicas do provedor'
title: Higiene de transcrição
x-i18n:
    generated_at: "2026-06-27T18:11:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correções específicas de provedor** aos transcripts antes de uma execução (ao construir o contexto do modelo). A maioria delas são ajustes **em memória** usados para atender a requisitos rigorosos dos provedores. Uma etapa separada de reparo do arquivo de sessão também pode reescrever JSONL armazenado antes que a sessão seja carregada, mas somente para linhas malformadas ou turnos persistidos que sejam registros duráveis inválidos. As respostas entregues do assistente são preservadas em disco; a remoção de prefill de assistente específica do provedor acontece apenas durante a construção de payloads de saída. Quando ocorre um reparo, o arquivo original é gravado em um irmão transitório `*.bak-<pid>-<ts>` antes da substituição atômica e removido quando a substituição é bem-sucedida; o backup só é mantido se a própria limpeza falhar (nesse caso, o caminho é informado de volta).

O escopo inclui:

- Contexto de prompt somente de runtime ficando fora dos turnos de transcript visíveis ao usuário
- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Limpeza de assinatura de thinking
- Sanitização de payload de imagem
- Limpeza de blocos de texto em branco antes do replay do provedor
- Limpeza de turno de comprimento incompleto somente de raciocínio antes do replay do provedor
- Marcação de proveniência da entrada do usuário (para prompts roteados entre sessões)
- Reparo de turno de erro vazio de assistente para replay do Bedrock Converse

Se você precisar de detalhes de armazenamento de transcript, consulte:

- [Aprofundamento em gerenciamento de sessão](/pt-BR/reference/session-management-compaction)

---

## Regra global: contexto de runtime não é transcript do usuário

Contexto de runtime/sistema pode ser adicionado ao prompt do modelo para um turno, mas não é conteúdo criado pelo usuário final. OpenClaw mantém um corpo de prompt separado voltado ao transcript para respostas do Gateway, followups enfileirados, ACP, CLI e execuções incorporadas do OpenClaw. Turnos visíveis de usuário armazenados usam esse corpo de transcript em vez do prompt enriquecido pelo runtime.

Para sessões legadas que já persistiram wrappers de runtime, superfícies de histórico do Gateway aplicam uma projeção de exibição antes de retornar mensagens para clientes WebChat, TUI, REST ou SSE.

---

## Onde isso é executado

Toda a higiene de transcript é centralizada no runner incorporado:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/embedded-agent-runner/replay-history.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcript, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado por `run/attempt.ts` e `compact.ts` (runner incorporado)

---

## Regra global: sanitização de imagens

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor devido a limites de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens gerada por imagens para modelos com capacidade de visão. Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).
- Blocos de texto em branco são removidos enquanto essa etapa percorre o conteúdo de replay. Turnos de assistente que ficam vazios são descartados da cópia de replay; turnos de usuário e de resultado de ferramenta que ficam vazios recebem um placeholder não vazio de conteúdo omitido.

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente sem `input` e sem `arguments` são descartados antes da construção do contexto do modelo. Isso evita rejeições do provedor por chamadas de ferramenta parcialmente persistidas (por exemplo, após uma falha de limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regra global: turnos incompletos somente de raciocínio

Turnos de assistente que atingem o limite de saída do provedor com apenas conteúdo de thinking ou thinking redigido são omitidos da cópia de replay em memória. Esses turnos contêm estado incompleto do provedor e podem carregar uma assinatura parcial de thinking.

Turnos de comprimento vazios permanecem inalterados, assim como turnos de comprimento com texto visível, chamadas de ferramenta ou blocos de conteúdo desconhecidos. Transcripts armazenados não são reescritos.

Implementação:

- `normalizeAssistantReplayContent` em `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo etapas de resposta/anúncio entre agentes), OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

OpenClaw também prefixa um marcador no mesmo turno `[Inter-session message ... isUser=false]` antes do texto do prompt roteado, para que a chamada ativa ao modelo consiga distinguir saída de sessão estrangeira de instruções externas do usuário final. Esse marcador inclui a sessão de origem, o canal e a ferramenta quando disponíveis. O transcript ainda usa `role: "user"` para compatibilidade com provedores, mas o texto visível e os metadados de proveniência marcam o turno como dados entre sessões.

Durante a reconstrução de contexto, OpenClaw aplica o mesmo marcador a turnos de usuário entre sessões persistidos mais antigos que têm apenas metadados de proveniência.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagens.
- Descarta assinaturas órfãs de raciocínio (itens de raciocínio avulsos sem um bloco de conteúdo seguinte) para transcripts OpenAI Responses/Codex, e descarta raciocínio OpenAI reproduzível após uma troca de rota de modelo.
- Preserva payloads de itens de raciocínio reproduzíveis do OpenAI Responses, incluindo itens criptografados com resumo vazio, para que o replay manual/WebSocket mantenha o estado `rs_*` necessário pareado com itens de saída do assistente.
- Native ChatGPT Codex Responses segue paridade de fio do Codex ao reproduzir payloads anteriores de raciocínio/mensagem/função do Responses sem IDs de itens anteriores, preservando `prompt_cache_key` da sessão.
- O replay da família OpenAI Responses preserva pares canônicos de raciocínio de mesmo modelo `call_*|fc_*`, mas normaliza de forma determinística `call_id` / ids de item de chamada de função malformados ou longos demais antes da conversão de payload pi-ai.
- O reparo de pareamento de resultado de ferramenta pode mover saídas reais correspondentes e sintetizar saídas `aborted` no estilo Codex para chamadas de ferramenta ausentes.
- Sem validação ou reordenação de turnos.
- Saídas de ferramenta ausentes da família OpenAI Responses são sintetizadas como `aborted` para corresponder à normalização de replay do Codex.
- Sem remoção de assinatura de pensamento.

**Chat Completions compatíveis com OpenAI**

- Blocos históricos de thinking/raciocínio do assistente são removidos antes do replay para que servidores locais e servidores compatíveis com OpenAI no estilo proxy não recebam campos de raciocínio de turnos anteriores, como `reasoning` ou `reasoning_content`.
- Continuações de chamada de ferramenta no mesmo turno atual mantêm o bloco de raciocínio do assistente anexado à chamada de ferramenta até que o resultado da ferramenta seja reproduzido.
- Entradas de modelo customizadas/auto-hospedadas com `reasoning: true` preservam metadados de raciocínio reproduzidos.
- Exceções de propriedade do provedor podem optar por sair quando seu protocolo de fio exige metadados de raciocínio reproduzidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (prefixa um pequeno bootstrap de usuário se o histórico começa com assistente).
- Antigravity Claude: normaliza assinaturas de thinking; descarta blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados de ferramenta sintéticos.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).
- Turnos finais de prefill de assistente são removidos dos payloads Anthropic Messages de saída quando thinking está habilitado, incluindo rotas do Cloudflare AI Gateway.
- Assinaturas de thinking de assistente anteriores à Compaction são removidas antes do replay do provedor quando uma sessão passou por Compaction. Assinaturas de thinking são criptograficamente vinculadas ao prefixo da conversa no momento da geração; após a Compaction, o prefixo muda (o conteúdo resumido é substituído por um resumo de Compaction), então reproduzir as assinaturas originais faz a Anthropic rejeitar a solicitação com "Invalid signature in thinking block". O texto de thinking é preservado como um bloco sem assinatura e então tratado pela regra abaixo.
- Blocos de thinking com assinaturas de replay ausentes, vazias ou em branco são removidos antes da conversão do provedor. Se isso esvaziar um turno de assistente, OpenClaw mantém o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos somente de thinking que precisam ser removidos são substituídos por texto não vazio de raciocínio omitido para que adaptadores de provedor não descartem o turno de replay.

**Amazon Bedrock (Converse API)**

- Turnos vazios de erro de stream do assistente são reparados para um bloco de texto fallback não vazio antes do replay. Bedrock Converse rejeita mensagens de assistente com `content: []`, então turnos de assistente persistidos com `stopReason: "error"` e conteúdo vazio também são reparados em disco antes do carregamento.
- Turnos de erro de stream do assistente que contêm apenas blocos de texto em branco são descartados da cópia de replay em memória em vez de reproduzir um bloco em branco inválido.
- Assinaturas de thinking de assistente anteriores à Compaction são removidas antes do replay do Converse quando uma sessão passou por Compaction, pelo mesmo motivo da Anthropic acima.
- Blocos de thinking Claude com assinaturas de replay ausentes, vazias ou em branco são removidos antes do replay do Converse. Se isso esvaziar um turno de assistente, OpenClaw mantém o formato do turno com texto não vazio de raciocínio omitido.
- Turnos de assistente mais antigos somente de thinking que precisam ser removidos são substituídos por texto não vazio de raciocínio omitido para que o replay do Converse mantenha o formato estrito de turnos.
- O replay filtra turnos de assistente de espelho de entrega do OpenClaw e injetados pelo gateway.
- A sanitização de imagens se aplica pela regra global.

**Mistral (incluindo detecção baseada em id de modelo)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico de comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não são base64 (mantém base64).

**OpenRouter Anthropic**

- Turnos finais de prefill de assistente são removidos de payloads de modelo Anthropic compatíveis com OpenAI e verificados do OpenRouter quando raciocínio está habilitado, correspondendo ao comportamento de replay direto da Anthropic e do Cloudflare Anthropic.

**Todo o restante**

- Apenas sanitização de imagens.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, OpenClaw aplicava várias camadas de higiene de transcript:

- Uma **extensão transcript-sanitize** era executada em toda construção de contexto e podia:
  - Reparar pareamento de uso/resultado de ferramenta.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também realizava sanitização específica de provedor, duplicando trabalho.
- Mutações adicionais ocorriam fora da política de provedor, incluindo:
  - Remover tags `<final>` do texto do assistente antes da persistência.
  - Descartar turnos vazios de erro do assistente.
  - Aparar conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causou regressões entre provedores (notavelmente no pareamento `call_id|fc_id` de `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou a lógica no runner e tornou OpenAI **sem toque** além da sanitização de imagens.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
