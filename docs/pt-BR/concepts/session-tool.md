---
read_when:
    - Você quer entender quais ferramentas de sessão estão disponíveis para o agente
    - Você quer configurar o acesso entre sessões ou a geração de subagentes
    - Você quer inspecionar o status ou controlar subagentes criados
summary: Ferramentas de agente para status entre sessões, recuperação, mensagens e orquestração de subagentes
title: Ferramentas da sessão
x-i18n:
    generated_at: "2026-04-30T09:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw dá aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta        | O que ela faz                                                               |
| ----------------- | --------------------------------------------------------------------------- |
| `sessions_list`   | Lista sessões com filtros opcionais (tipo, rótulo, agente, recência, prévia) |
| `sessions_history` | Lê a transcrição de uma sessão específica                                  |
| `sessions_send`   | Envia uma mensagem para outra sessão e, opcionalmente, aguarda              |
| `sessions_spawn`  | Cria uma sessão isolada de subagente para trabalho em segundo plano         |
| `sessions_yield`  | Encerra a vez atual e aguarda resultados posteriores de subagentes          |
| `subagents`       | Lista, orienta ou encerra subagentes criados para esta sessão               |
| `session_status`  | Mostra um cartão no estilo `/status` e, opcionalmente, define uma substituição de modelo por sessão |

Essas ferramentas ainda estão sujeitas ao perfil de ferramentas ativo e à
política de permissão/negação. `tools.profile: "coding"` inclui o conjunto
completo de orquestração de sessões, incluindo `sessions_spawn`,
`sessions_yield` e `subagents`. `tools.profile: "messaging"` inclui ferramentas
de mensagens entre sessões (`sessions_list`, `sessions_history`,
`sessions_send`, `session_status`), mas não inclui a criação de subagentes. Para
manter um perfil de mensagens e ainda permitir delegação nativa, adicione:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Políticas de grupo, provedor, sandbox e por agente ainda podem remover essas
ferramentas após a etapa de perfil. Use `/tools` na sessão afetada para
inspecionar a lista efetiva de ferramentas.

## Listando e lendo sessões

`sessions_list` retorna sessões com sua chave, agentId, tipo, canal, modelo,
contagens de tokens e carimbos de data/hora. Filtre por tipo (`main`, `group`,
`cron`, `hook`, `node`), `label` exato, `agentId` exato, texto de busca ou
recência (`activeMinutes`). Quando você precisa de triagem em estilo caixa de
entrada, ele também pode solicitar um título derivado com escopo de visibilidade,
um trecho de prévia da última mensagem ou mensagens recentes limitadas em cada
linha. Títulos derivados e prévias são produzidos apenas para sessões que o
chamador já pode ver conforme a política de visibilidade configurada para
ferramentas de sessão, portanto sessões não relacionadas permanecem ocultas.

`sessions_history` busca a transcrição da conversa de uma sessão específica. Por
padrão, resultados de ferramentas são excluídos -- passe `includeTools: true`
para vê-los. A visualização retornada é intencionalmente limitada e filtrada por
segurança:

- o texto do assistente é normalizado antes da recuperação:
  - tags de pensamento são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamadas de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo payloads
    truncados que nunca fecham corretamente
  - estruturas rebaixadas de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens vazados de controle do modelo, como `<|assistant|>`, outros tokens
    ASCII `<|...|>` e variantes de largura total `<｜...｜>` são removidos
  - XML malformado de chamada de ferramenta MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos de texto longos são truncados
- históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a ferramenta relata sinalizadores de resumo como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID
de sessão** de uma chamada de listagem anterior.

Se você precisar da transcrição byte a byte exata, inspecione o arquivo de
transcrição no disco em vez de tratar `sessions_history` como um despejo bruto.

## Enviando mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e, opcionalmente, aguarda a
resposta:

- **Enviar sem aguardar:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Aguardar resposta:** defina um tempo limite e receba a resposta inline.

Mensagens e respostas de acompanhamento A2A são marcadas como dados entre
sessões no prompt de recebimento (`[Inter-session message ... isUser=false]`) e
na proveniência da transcrição. O agente receptor deve tratá-las como dados
roteados por ferramenta, não como uma instrução escrita diretamente pelo usuário
final.

Depois que o destino responde, o OpenClaw pode executar um **loop de resposta de
volta**, no qual os agentes alternam mensagens (até 5 turnos). O agente de
destino pode responder `REPLY_SKIP` para parar antecipadamente.

## Auxiliares de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual
ou outra sessão visível. Ela relata uso, hora, estado de modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Como `/status`,
ela pode preencher retroativamente contadores esparsos de tokens/cache a partir
da entrada de uso mais recente da transcrição, e `model=default` limpa uma
substituição por sessão. Use `sessionKey="current"` para a sessão atual do
chamador; rótulos visíveis de cliente, como `openclaw-tui`, não são chaves de
sessão.

`sessions_yield` encerra intencionalmente a vez atual para que a próxima mensagem
possa ser o evento de acompanhamento que você está aguardando. Use-a após criar
subagentes quando quiser que os resultados de conclusão cheguem como a próxima
mensagem, em vez de criar loops de sondagem.

`subagents` é o auxiliar de plano de controle para subagentes OpenClaw já
criados. Ele oferece suporte a:

- `action: "list"` para inspecionar execuções ativas/recentes
- `action: "steer"` para enviar orientação posterior a um filho em execução
- `action: "kill"` para interromper um filho ou `all`

## Criando subagentes

`sessions_spawn` cria, por padrão, uma sessão isolada para uma tarefa em segundo
plano. Ela é sempre não bloqueante -- retorna imediatamente com um `runId` e
`childSessionKey`.

Opções principais:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de harness externos.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a criação a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor sandboxing ao filho.
- `context: "fork"` para subagentes nativos quando o filho precisa da
  transcrição atual do solicitante; omita ou use `context: "isolated"` para um
  filho limpo.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que
possam gerenciar seus próprios filhos. Execuções folha ainda não recebem
ferramentas recursivas de orquestração.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do
solicitante. A entrega da conclusão preserva o roteamento de thread/tópico
vinculado quando disponível e, se a origem da conclusão identificar apenas um
canal, o OpenClaw ainda pode reutilizar a rota armazenada da sessão do
solicitante (`lastChannel` / `lastTo`) para entrega direta.

Para comportamento específico de ACP, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

Ferramentas de sessão têm escopo para limitar o que o agente pode ver:

| Nível   | Escopo                                   |
| ------- | ---------------------------------------- |
| `self`  | Apenas a sessão atual                    |
| `tree`  | Sessão atual + subagentes criados        |
| `agent` | Todas as sessões deste agente            |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree` independentemente da
configuração.

## Leitura adicional

- [Gerenciamento de sessões](/pt-BR/concepts/session) -- roteamento, ciclo de vida, manutenção
- [Agentes ACP](/pt-BR/tools/acp-agents) -- criação de harness externo
- [Multiagente](/pt-BR/concepts/multi-agent) -- arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- controles de configuração de ferramentas de sessão

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
