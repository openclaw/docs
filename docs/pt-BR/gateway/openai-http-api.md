---
read_when:
    - Integração de ferramentas que esperam OpenAI Chat Completions
summary: Exponha um endpoint HTTP /v1/chat/completions compatível com OpenAI a partir do Gateway
title: Conclusões de chat da OpenAI
x-i18n:
    generated_at: "2026-06-27T17:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

O Gateway do OpenClaw pode servir um pequeno endpoint de Chat Completions compatível com OpenAI.

Esse endpoint fica **desativado por padrão**. Ative-o primeiro na configuração.

- `POST /v1/chat/completions`
- Mesma porta do Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando a superfície HTTP compatível com OpenAI do Gateway está ativada, ela também serve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Por baixo dos panos, as solicitações são executadas como uma execução normal de agente do Gateway (o mesmo caminho de código de `openclaw agent`), então roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe que ele injete os
  cabeçalhos de identidade necessários
- autenticação aberta de ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é necessário

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies de loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Chamadores internos do mesmo host que contornam o proxy podem usar
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` como fallback direto local.
  Qualquer evidência de cabeçalho `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`
  mantém a solicitação no caminho de proxy confiável.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem falhas de autenticação demais, o endpoint retorna `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação HTTP bearer aqui não é um modelo estreito de escopo por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- As solicitações passam pelo mesmo caminho de agente do plano de controle que ações confiáveis de operador.
- Não há um limite de ferramenta separado para não proprietários/por usuário neste endpoint; depois que um chamador passa pela autenticação do Gateway aqui, o OpenClaw trata esse chamador como um operador confiável para este gateway.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"`) respeitam `x-openclaw-scopes` quando presente e, caso contrário, voltam ao conjunto normal de escopos padrão de operador.
- Se a política do agente de destino permitir ferramentas sensíveis, este endpoint poderá usá-las.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova a posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restrito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat neste endpoint como turnos enviados pelo proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - voltam ao conjunto normal de escopos padrão de operador quando o cabeçalho está ausente
  - só perdem semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`
  - exigem `operator.admin` para controles de solicitação em nível de proprietário, como `x-openclaw-model`

Consulte [Segurança](/pt-BR/gateway/security) e [Acesso remoto](/pt-BR/gateway/remote).

## Quando usar este endpoint

Use `/v1/chat/completions` quando estiver integrando ferramentas ou um backend confiável do lado do aplicativo com um gateway existente e puder manter credenciais de operador do gateway com segurança.

- Prefira isso a adicionar um novo canal integrado quando sua integração for apenas outra superfície de operador/cliente para o mesmo gateway.
- Para clientes móveis nativos que se conectam diretamente a um gateway remoto, prefira [WebChat](/pt-BR/web/webchat) ou o [Protocolo do Gateway](/pt-BR/gateway/protocol) e implemente o fluxo de bootstrap de dispositivo pareado/token de dispositivo para que o dispositivo não precise de um token/senha HTTP compartilhado.
- Em vez disso, crie um plugin de canal quando estiver integrando uma rede externa de mensagens com seus próprios usuários, salas, entrega por webhook ou transporte de saída. Consulte [Criando plugins](/pt-BR/plugins/building-plugins).

## Contrato de modelo com agente em primeiro lugar

O OpenClaw trata o campo `model` da OpenAI como um **destino de agente**, não como um id bruto de modelo de provedor.

- `model: "openclaw"` roteia para o agente padrão configurado.
- `model: "openclaw/default"` também roteia para o agente padrão configurado.
- `model: "openclaw/<agentId>"` roteia para um agente específico.

Cabeçalhos opcionais de solicitação:

- `x-openclaw-model: <provider/model-or-bare-id>` substitui o modelo de backend do agente selecionado. Chamadores bearer com segredo compartilhado podem usar este cabeçalho. Chamadores com identidade, como proxy confiável ou solicitações de ingresso privado sem autenticação com `x-openclaw-scopes`, precisam de `operator.admin`; chamadores somente de escrita recebem `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` continua com suporte como substituição de compatibilidade.
- `x-openclaw-session-key: <sessionKey>` controla explicitamente o roteamento de sessão. O valor não deve usar namespaces internos reservados de sessão, como `subagent:`, `cron:` ou `acp:`; essas solicitações são rejeitadas com `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` define o contexto sintético de canal de ingresso para prompts e políticas com reconhecimento de canal.

Aliases de compatibilidade ainda aceitos:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Ativando o endpoint

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

## Desativando o endpoint

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

Se a solicitação incluir uma string `user` da OpenAI, o Gateway deriva dela uma chave de sessão estável, para que chamadas repetidas possam compartilhar uma sessão de agente.

Para aplicativos personalizados, o padrão mais seguro é reutilizar o mesmo valor de `user` por conversa. Evite identificadores em nível de conta, a menos que você queira explicitamente que várias conversas ou dispositivos compartilhem uma sessão do OpenClaw. Use `x-openclaw-session-key` somente quando precisar de controle explícito de roteamento entre vários clientes ou conversas, e escolha chaves pertencentes ao aplicativo que não comecem com namespaces internos reservados, como `subagent:`, `cron:` ou `acp:`.

## Por que esta superfície importa

Este é o conjunto de compatibilidade de maior alavancagem para frontends e ferramentas auto-hospedados:

- A maioria das configurações de Open WebUI, LobeChat e LibreChat espera `/v1/models`.
- Muitos sistemas RAG esperam `/v1/embeddings`.
- Clientes de chat OpenAI existentes geralmente podem começar com `/v1/chat/completions`.
- Clientes mais nativos de agentes preferem cada vez mais `/v1/responses`.

## Lista de modelos e roteamento de agentes

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Uma lista de destinos de agentes do OpenClaw.

    Os ids retornados são entradas `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Use-os diretamente como valores de `model` da OpenAI.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Ele lista destinos de agentes de nível superior, não modelos de provedores de backend nem subagentes.

    Subagentes permanecem como topologia interna de execução. Eles não aparecem como pseudomodelos.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` é o alias estável para o agente padrão configurado.

    Isso significa que os clientes podem continuar usando um id previsível mesmo que o id real do agente padrão mude entre ambientes.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Use `x-openclaw-model`. Esta é uma substituição em nível de proprietário: ela funciona com o caminho de token/senha bearer de segredo compartilhado do Gateway e exige `operator.admin` em caminhos HTTP com identidade, como autenticação por proxy confiável.

    Exemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se você o omitir, o agente selecionado será executado com sua escolha normal de modelo configurada.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` usa os mesmos ids de `model` de destino de agente.

    Use `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Quando precisar de um modelo específico de embeddings, envie-o em `x-openclaw-model` a partir de um chamador com segredo compartilhado ou de um chamador com identidade e `operator.admin`.
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
- `tool_choice`: `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` turnos de acompanhamento
- `messages[*].tool_call_id` para vincular resultados de ferramentas de volta a uma chamada de ferramenta anterior
- `max_completion_tokens`: número; limite por chamada para o total de tokens de conclusão (tokens de raciocínio incluídos). Nome atual do campo de Chat Completions da OpenAI; preferido quando `max_completion_tokens` e `max_tokens` são enviados.
- `max_tokens`: número; alias legado aceito para compatibilidade retroativa. Ignorado quando `max_completion_tokens` também está presente.
- `temperature`: número; temperatura de amostragem em melhor esforço encaminhada ao provedor upstream pelo canal de parâmetros de stream do agente.
- `top_p`: número; amostragem nucleus em melhor esforço encaminhada ao provedor upstream pelo canal de parâmetros de stream do agente.
- `frequency_penalty`: número; penalidade de frequência em melhor esforço encaminhada ao provedor upstream pelo canal de parâmetros de stream do agente. Intervalo validado: -2.0 a 2.0. Retorna `400 invalid_request_error` para valores fora do intervalo.
- `presence_penalty`: número; penalidade de presença em melhor esforço encaminhada ao provedor upstream pelo canal de parâmetros de stream do agente. Intervalo validado: -2.0 a 2.0. Retorna `400 invalid_request_error` para valores fora do intervalo.
- `seed`: número (inteiro); seed em melhor esforço encaminhado ao provedor upstream pelo canal de parâmetros de stream do agente. Retorna `400 invalid_request_error` para valores não inteiros.
- `stop`: string ou array de até 4 strings; sequências de parada em melhor esforço encaminhadas ao provedor upstream pelo canal de parâmetros de stream do agente. Retorna `400 invalid_request_error` para mais de 4 sequências ou entradas que não sejam string/vazias.

Quando qualquer campo de limite de tokens é definido, o valor é encaminhado ao provedor upstream pelo canal stream-param do agente. O nome real do campo no fio enviado ao provedor upstream é escolhido pelo transporte do provedor: `max_completion_tokens` para endpoints da família OpenAI, e `max_tokens` para provedores que aceitam apenas o nome legado (como Mistral e Chutes). Os campos de amostragem (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) seguem o mesmo canal stream-param; o backend Codex Responses baseado no ChatGPT os remove no lado do servidor, já que usa amostragem fixa. `stop` também trafega pelo canal stream-param e é mapeado para o campo de parada do transporte (`stop` para backends Chat Completions, `stop_sequences` para Anthropic); a OpenAI Responses API não tem parâmetro de parada, portanto `stop` não é aplicado em modelos baseados em Responses.

### Variantes sem suporte

O endpoint retorna `400 invalid_request_error` para variantes de ferramentas sem suporte, incluindo:

- `tools` que não seja array
- entradas de ferramenta que não sejam função
- `tool.function.name` ausente
- variantes de `tool_choice`, como `allowed_tools` e `custom`
- valores de `tool_choice.function.name` que não correspondem às `tools` fornecidas

Para `tool_choice: "required"` e `tool_choice` fixado em função, o endpoint restringe o conjunto de ferramentas de função do cliente exposto, instrui o runtime a chamar uma ferramenta do cliente antes de responder e retorna um erro se a resposta do agente não incluir uma chamada estruturada correspondente de ferramenta do cliente. Esse contrato se aplica à lista HTTP `tools` fornecida pelo chamador, não a todas as ferramentas internas do agente OpenClaw.

### Formato de resposta de ferramenta sem streaming

Quando o agente decide chamar ferramentas, a resposta usa:

- entradas `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` com:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (string JSON)

Comentários do assistente antes da chamada da ferramenta são retornados em `choices[0].message.content` (possivelmente vazio).

### Formato de resposta de ferramenta com streaming

Quando `stream: true`, as chamadas de ferramentas são emitidas como chunks SSE incrementais:

- delta inicial de função do assistente
- deltas opcionais de comentário do assistente
- um ou mais chunks `delta.tool_calls` contendo identidade da ferramenta e fragmentos de argumentos
- chunk final com `finish_reason: "tool_calls"`
- `data: [DONE]`

Se `stream_options.include_usage=true`, um chunk final de uso é emitido antes de `[DONE]`.

### Loop de acompanhamento de ferramenta

Após receber `tool_calls`, o cliente deve executar a(s) função(ões) solicitada(s) e enviar uma solicitação de acompanhamento que inclua:

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
- O Open WebUI deve usar `openclaw/default` como id do modelo de chat
- Se você quiser um provedor/modelo de backend específico para esse agente, defina o modelo padrão normal do agente ou envie `x-openclaw-model` a partir de um chamador com segredo compartilhado ou de um chamador com identidade que tenha `operator.admin`

Smoke rápido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se isso retornar `openclaw/default`, a maioria das configurações do Open WebUI poderá se conectar com a mesma URL base e token.

## Exemplos

Sessão estável para uma conversa de aplicativo:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Reutilize o mesmo valor de `user` em chamadas posteriores dessa conversa para continuar a mesma sessão do agente.

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

- `/v1/models` retorna alvos de agentes OpenClaw, não catálogos brutos de provedores.
- `openclaw/default` está sempre presente, para que um id estável funcione em todos os ambientes.
- Substituições de provedor/modelo de backend pertencem a `x-openclaw-model`, não ao campo `model` da OpenAI. Em caminhos de autenticação HTTP com identidade, esse cabeçalho exige `operator.admin`.
- `/v1/embeddings` aceita `input` como string ou array de strings.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [OpenAI](/pt-BR/providers/openai)
