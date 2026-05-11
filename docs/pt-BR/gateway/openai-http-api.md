---
read_when:
    - Integração de ferramentas que esperam OpenAI Chat Completions
summary: Exponha um endpoint HTTP /v1/chat/completions compatível com OpenAI a partir do Gateway
title: Compleções de chat da OpenAI
x-i18n:
    generated_at: "2026-05-11T20:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

O Gateway do OpenClaw pode servir um pequeno endpoint de Chat Completions compatível com OpenAI.

Esse endpoint fica **desabilitado por padrão**. Primeiro, habilite-o na configuração.

- `POST /v1/chat/completions`
- Mesma porta do Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando a superfície HTTP compatível com OpenAI do Gateway está habilitada, ela também serve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Por baixo dos panos, as solicitações são executadas como uma execução normal de agente do Gateway (mesmo caminho de código que `openclaw agent`), então roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe-o injetar os
  cabeçalhos de identidade obrigatórios
- autenticação aberta de ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é obrigatório

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies de loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso completo de operador** para a instância do Gateway.

- A autenticação HTTP bearer aqui não é um modelo de escopo restrito por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- As solicitações passam pelo mesmo caminho de agente do plano de controle que ações confiáveis de operador.
- Não há um limite separado de ferramentas para não proprietários/por usuário neste endpoint; depois que um chamador passa pela autenticação do Gateway aqui, o OpenClaw trata esse chamador como um operador confiável para este Gateway.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"`) respeitam `x-openclaw-scopes` quando presente e, caso contrário, recorrem ao conjunto de escopos padrão normal de operador.
- Se a política do agente de destino permitir ferramentas sensíveis, este endpoint poderá usá-las.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do Gateway
  - ignora `x-openclaw-scopes` mais restrito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat neste endpoint como turnos enviados pelo proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - recorrem ao conjunto de escopos padrão normal de operador quando o cabeçalho está ausente
  - só perdem semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Consulte [Segurança](/pt-BR/gateway/security) e [Acesso remoto](/pt-BR/gateway/remote).

## Contrato de modelo centrado em agente

O OpenClaw trata o campo `model` da OpenAI como um **destino de agente**, não como um id bruto de modelo de provedor.

- `model: "openclaw"` roteia para o agente padrão configurado.
- `model: "openclaw/default"` também roteia para o agente padrão configurado.
- `model: "openclaw/<agentId>"` roteia para um agente específico.

Cabeçalhos opcionais de solicitação:

- `x-openclaw-model: <provider/model-or-bare-id>` substitui o modelo de backend para o agente selecionado.
- `x-openclaw-agent-id: <agentId>` continua com suporte como substituição de compatibilidade.
- `x-openclaw-session-key: <sessionKey>` controla totalmente o roteamento de sessão.
- `x-openclaw-message-channel: <channel>` define o contexto sintético de canal de ingresso para prompts e políticas sensíveis a canal.

Aliases de compatibilidade ainda aceitos:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Habilitando o endpoint

Defina `gateway.http.endpoints.chatCompletions.enabled` como `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Desabilitando o endpoint

Defina `gateway.http.endpoints.chatCompletions.enabled` como `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportamento de sessão

Por padrão, o endpoint é **sem estado por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string `user` da OpenAI, o Gateway derivará dela uma chave de sessão estável, para que chamadas repetidas possam compartilhar uma sessão de agente.

## Por que esta superfície importa

Este é o conjunto de compatibilidade de maior impacto para frontends e ferramentas auto-hospedados:

- A maioria das configurações do Open WebUI, LobeChat e LibreChat espera `/v1/models`.
- Muitos sistemas RAG esperam `/v1/embeddings`.
- Clientes de chat OpenAI existentes geralmente podem começar com `/v1/chat/completions`.
- Clientes mais nativos para agentes cada vez mais preferem `/v1/responses`.

## Lista de modelos e roteamento de agentes

<AccordionGroup>
  <Accordion title="O que `/v1/models` retorna?">
    Uma lista de destinos de agente do OpenClaw.

    Os ids retornados são entradas `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Use-os diretamente como valores de `model` da OpenAI.

  </Accordion>
  <Accordion title="`/v1/models` lista agentes ou subagentes?">
    Ele lista destinos de agentes de nível superior, não modelos de provedores de backend nem subagentes.

    Subagentes permanecem como topologia interna de execução. Eles não aparecem como pseudomodelos.

  </Accordion>
  <Accordion title="Por que `openclaw/default` está incluído?">
    `openclaw/default` é o alias estável para o agente padrão configurado.

    Isso significa que clientes podem continuar usando um id previsível mesmo que o id real do agente padrão mude entre ambientes.

  </Accordion>
  <Accordion title="Como substituo o modelo de backend?">
    Use `x-openclaw-model`.

    Exemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se você o omitir, o agente selecionado executará com sua escolha normal de modelo configurada.

  </Accordion>
  <Accordion title="Como embeddings se encaixam neste contrato?">
    `/v1/embeddings` usa os mesmos ids de `model` de destino de agente.

    Use `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Quando precisar de um modelo específico de embedding, envie-o em `x-openclaw-model`.
    Sem esse cabeçalho, a solicitação passa para a configuração normal de embeddings do agente selecionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- O stream termina com `data: [DONE]`

## Contrato de ferramentas de chat

`/v1/chat/completions` oferece suporte a um subconjunto de ferramentas de função compatível com clientes comuns de Chat da OpenAI.

### Campos de solicitação compatíveis

- `tools`: array de `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- turnos de acompanhamento `messages[*].role: "tool"`
- `messages[*].tool_call_id` para vincular resultados de ferramentas de volta a uma chamada de ferramenta anterior

### Variantes sem suporte

O endpoint retorna `400 invalid_request_error` para variantes de ferramentas sem suporte, incluindo:

- `tools` que não seja array
- entradas de ferramentas que não sejam funções
- `tool.function.name` ausente
- variantes de `tool_choice` como `allowed_tools` e `custom`
- `tool_choice: "required"` (ainda não aplicado em tempo de execução; terá suporte quando a aplicação rígida for implementada)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (mesma justificativa de `required`)
- valores de `tool_choice.function.name` que não correspondem aos `tools` fornecidos

### Formato de resposta de ferramenta sem streaming

Quando o agente decide chamar ferramentas, a resposta usa:

- `choices[0].finish_reason = "tool_calls"`
- entradas `choices[0].message.tool_calls[]` com:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (string JSON)

O comentário do assistente antes da chamada de ferramenta é retornado em `choices[0].message.content` (possivelmente vazio).

### Formato de resposta de ferramenta com streaming

Quando `stream: true`, chamadas de ferramenta são emitidas como chunks SSE incrementais:

- delta inicial de função do assistente
- deltas opcionais de comentários do assistente
- um ou mais chunks `delta.tool_calls` carregando identidade da ferramenta e fragmentos de argumentos
- chunk final com `finish_reason: "tool_calls"`
- `data: [DONE]`

Se `stream_options.include_usage=true`, um chunk final de uso é emitido antes de `[DONE]`.

### Loop de acompanhamento de ferramenta

Depois de receber `tool_calls`, o cliente deve executar a(s) função(ões) solicitada(s) e enviar uma solicitação de acompanhamento que inclua:

- mensagem anterior de chamada de ferramenta do assistente
- uma ou mais mensagens `role: "tool"` com `tool_call_id` correspondente

Isso permite que a execução do agente do Gateway continue o mesmo loop de raciocínio e produza a resposta final do assistente.

## Configuração rápida do Open WebUI

Para uma conexão básica do Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base do Docker no macOS: `http://host.docker.internal:18789/v1`
- Chave de API: seu token bearer do Gateway
- Modelo: `openclaw/default`

Comportamento esperado:

- `GET /v1/models` deve listar `openclaw/default`
- O Open WebUI deve usar `openclaw/default` como o id do modelo de chat
- Se você quiser um provedor/modelo de backend específico para esse agente, defina o modelo padrão normal do agente ou envie `x-openclaw-model`

Smoke rápido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se isso retornar `openclaw/default`, a maioria das configurações do Open WebUI poderá se conectar com a mesma URL base e token.

## Exemplos

Sem streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Com streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Listar modelos:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Buscar um modelo:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Criar embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Observações:

- `/v1/models` retorna destinos de agentes do OpenClaw, não catálogos brutos de provedores.
- `openclaw/default` está sempre presente para que um id estável funcione entre ambientes.
- Substituições de provedor/modelo de backend pertencem a `x-openclaw-model`, não ao campo `model` da OpenAI.
- `/v1/embeddings` oferece suporte a `input` como string ou array de strings.

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [OpenAI](/pt-BR/providers/openai)
