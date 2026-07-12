---
read_when:
    - Integração de ferramentas que esperam o OpenAI Chat Completions
summary: Exponha um endpoint HTTP `/v1/chat/completions` compatível com a OpenAI por meio do Gateway
title: Conclusões de chat da OpenAI
x-i18n:
    generated_at: "2026-07-11T23:56:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

O Gateway pode disponibilizar uma pequena interface de Chat Completions compatível com a OpenAI. Ela é **desabilitada por padrão**.

Depois de habilitada, ela disponibiliza todos estes endpoints na mesma porta do Gateway (multiplexação de WS + HTTP):

| Método | Caminho                 |
| ------ | ----------------------- |
| POST   | `/v1/chat/completions`  |
| GET    | `/v1/models`            |
| GET    | `/v1/models/{id}`       |
| POST   | `/v1/embeddings`        |
| POST   | `/v1/responses`         |

As solicitações são executadas como uma execução normal de agente do Gateway (o mesmo fluxo de código de `openclaw agent`), portanto, o roteamento, as permissões e a configuração correspondem aos do seu Gateway.

## Como habilitar o endpoint

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

Defina `enabled: false` (ou omita essa opção) para desabilitar.

## Limite de segurança (importante)

Trate este endpoint como **acesso total de operador** à instância do Gateway:

- Um token/senha válido do Gateway para este endpoint equivale a uma credencial de proprietário/operador, não a um escopo limitado por usuário.
- As solicitações passam pelo mesmo caminho de agente do plano de controle que as ações de operadores confiáveis; portanto, se a política do agente de destino permitir ferramentas sensíveis, este endpoint poderá usá-las.
- Mantenha-o somente em local loopback, tailnet ou entrada privada. Não o exponha à internet pública.

Matriz de autenticação:

| Caminho de autenticação                                                                             | Comportamento                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`                            | Comprova a posse do segredo compartilhado do Gateway. Ignora qualquer cabeçalho `x-openclaw-scopes` e restaura o conjunto completo de escopos padrão do operador: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Trata os turnos de chat como turnos enviados pelo proprietário. |
| HTTP confiável com identidade (autenticação por proxy confiável ou `gateway.auth.mode="none"` em entrada privada) | Respeita `x-openclaw-scopes` quando presente; quando ausente, usa como alternativa o conjunto padrão de escopos do operador. Só perde a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`. Exige `operator.admin` para controles no nível de proprietário, como `x-openclaw-model`. |

Consulte [Escopos do operador](/pt-BR/gateway/operator-scopes), [Segurança](/pt-BR/gateway/security) e [Acesso remoto](/pt-BR/gateway/remote).

## Autenticação

Usa a configuração de autenticação do Gateway (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para obter detalhes desse modo):

| Modo                                | Como autenticar                                                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Defina por meio de `gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`.                                                                                                            |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Defina por meio de `gateway.auth.password` ou `OPENCLAW_GATEWAY_PASSWORD`.                                                                                                   |
| `gateway.auth.mode="trusted-proxy"` | Faça o roteamento pelo proxy configurado com reconhecimento de identidade; ele injeta os cabeçalhos de identidade necessários. Proxies local loopback no mesmo host precisam de `gateway.auth.trustedProxy.allowLoopback = true` explicitamente. |
| `gateway.auth.mode="none"`          | Nenhum cabeçalho de autenticação é necessário (somente entrada privada).                                                                                                                                         |

Observações:

- Chamadores no mesmo host que ignoram o proxy em um Gateway `trusted-proxy` podem usar diretamente `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` como alternativa. Qualquer evidência nos cabeçalhos `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` mantém a solicitação no caminho do proxy confiável.
- Se `gateway.auth.rateLimit` estiver configurado e houver muitas tentativas de autenticação com falha, o endpoint retornará `429` com um cabeçalho `Retry-After`.

## Quando usar este endpoint

- Prefira esta opção em vez de adicionar um novo canal integrado quando sua integração for apenas mais uma interface de operador/cliente para o mesmo Gateway.
- Para clientes móveis nativos que se conectam diretamente a um Gateway remoto, prefira o [WebChat](/pt-BR/web/webchat) ou o [Protocolo do Gateway](/pt-BR/gateway/protocol) com o fluxo de inicialização de dispositivo pareado/token de dispositivo, para que o dispositivo não precise de um token/senha HTTP compartilhado.
- Em vez disso, crie um Plugin de canal ao integrar uma rede externa de mensagens com seus próprios usuários, salas, entrega por Webhook ou transporte de saída. Consulte [Criação de plugins](/pt-BR/plugins/building-plugins).

## Contrato de modelo centrado no agente

O OpenClaw trata o campo `model` da OpenAI como um **destino de agente**, não como um ID bruto de modelo do provedor.

| Valor de `model`                             | Encaminha para                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | Agente padrão configurado                                                                                                            |
| `openclaw/default`                           | Agente padrão configurado (alias estável; pode ser incluído diretamente no código com segurança, mesmo que o ID real do agente padrão varie entre ambientes) |
| `openclaw/<agentId>` ou `openclaw:<agentId>` | Agente específico                                                                                                                     |
| `agent:<agentId>`                            | Agente específico (alias de compatibilidade)                                                                                          |

Cabeçalhos opcionais da solicitação:

| Cabeçalho                                       | Efeito                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Substitui o modelo de back-end do agente selecionado. Chamadores com segredo compartilhado no portador podem usar isso diretamente; chamadores com identidade (proxy confiável ou entrada privada sem autenticação com `x-openclaw-scopes`) precisam de `operator.admin`; caso contrário, recebem `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Substituição de compatibilidade para a seleção do agente.                                                                                                                                                                                                                                                                                |
| `x-openclaw-session-key: <sessionKey>`          | Roteamento explícito da sessão. É rejeitado com `400 invalid_request_error` se usar um namespace interno reservado (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                        |
| `x-openclaw-message-channel: <channel>`         | Define o contexto sintético do canal de entrada para prompts/políticas que consideram o canal.                                                                                                                                                                                                                                           |

`/v1/models` lista os destinos de agente de nível superior (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), não os modelos de provedores de back-end nem os subagentes; os subagentes permanecem como topologia interna de execução. Se você omitir `x-openclaw-model`, o agente selecionado será executado com seu modelo normalmente configurado.

`/v1/embeddings` usa os mesmos IDs de `model` de destino de agente. Envie `x-openclaw-model` (por meio de um chamador com segredo compartilhado ou de um chamador com identidade e `operator.admin`) para escolher um modelo de embeddings específico; caso contrário, a solicitação usará a configuração normal de embeddings do agente selecionado.

## Comportamento da sessão

Por padrão, o endpoint é **sem estado por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string `user` da OpenAI, o Gateway derivará dela uma chave de sessão estável para que chamadas repetidas possam compartilhar uma sessão de agente. Para aplicativos personalizados, reutilize o mesmo valor de `user` em cada encadeamento de conversa; evite identificadores no nível da conta, a menos que queira que várias conversas/dispositivos compartilhem uma sessão do OpenClaw. Use `x-openclaw-session-key` somente quando precisar de controle explícito de roteamento entre vários clientes/encadeamentos, com chaves pertencentes ao aplicativo que evitem os namespaces reservados mencionados acima.

## Limites das solicitações (configuração)

Os padrões podem ser ajustados em `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Valores padrão quando omitidos:

| Chave                 | Padrão                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `maxBodyBytes`        | 20 MB                                                                                      |
| `maxImageParts`       | 8 (máximo de partes `image_url` lidas da mensagem mais recente do usuário)                 |
| `maxTotalImageBytes`  | 20 MB (total acumulado de bytes decodificados em todas as partes `image_url` de uma solicitação) |
| `images.allowUrl`     | `false` (partes `image_url` originadas de URLs são rejeitadas, a menos que habilitadas)     |
| `images.maxBytes`     | 10 MB por imagem                                                                           |
| `images.maxRedirects` | 3                                                                                          |
| `images.timeoutMs`    | 10 s                                                                                       |

Fontes `image_url` HEIC/HEIF são aceitas e normalizadas para JPEG antes da entrega ao provedor por meio do processador de imagens compartilhado do OpenClaw (Rastermill), que recorre a um conversor do sistema (`sips`, ImageMagick, GraphicsMagick ou ffmpeg) para formatos que precisam de suporte externo a codecs.

Observação de segurança: incluir um nome de host na lista de permissões não contorna o bloqueio de IPs privados/internos. Para gateways expostos à internet, aplique controles de saída de rede além das proteções no nível da aplicação. Consulte [Segurança](/pt-BR/gateway/security).

## Contrato da ferramenta de chat

`/v1/chat/completions` oferece suporte a um subconjunto de ferramentas de função compatível com clientes comuns do OpenAI Chat.

### Campos de solicitação compatíveis

| Campo                      | Observações                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Matriz de `{ "type": "function", "function": { ... } }`                                                                                                           |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "function": { "name": "..." } }`                                                                       |
| `messages[*].role: "tool"` | Turnos de acompanhamento                                                                                                                                            |
| `messages[*].tool_call_id` | Associa o resultado de uma ferramenta a uma chamada de ferramenta anterior                                                                                         |
| `max_completion_tokens`    | Número; limite por chamada do total de tokens de conclusão (incluindo tokens de raciocínio). Nome atual do campo; usado quando ele e `max_tokens` são enviados.    |
| `max_tokens`               | Número; alias legado, ignorado quando `max_completion_tokens` também está presente.                                                                                |
| `temperature`              | Número de 0 a 2; aplicado conforme possível e encaminhado ao provedor upstream. `400 invalid_request_error` se estiver fora do intervalo.                          |
| `top_p`                    | Número de 0 a 1; aplicado conforme possível. `400 invalid_request_error` se estiver fora do intervalo.                                                            |
| `frequency_penalty`        | Número de -2,0 a 2,0; aplicado conforme possível. `400 invalid_request_error` se estiver fora do intervalo.                                                       |
| `presence_penalty`         | Número de -2,0 a 2,0; aplicado conforme possível. `400 invalid_request_error` se estiver fora do intervalo.                                                       |
| `seed`                     | Inteiro; aplicado conforme possível. `400 invalid_request_error` para valores que não sejam inteiros.                                                             |
| `stop`                     | String ou matriz de até 4 strings; aplicado conforme possível. `400 invalid_request_error` para mais de 4 sequências ou entradas vazias/que não sejam strings.     |

Todos os campos de amostragem e limite de tokens usam o mesmo canal de parâmetros de fluxo do agente e são encaminhados conforme possível:

- Limite de tokens: o nome do campo no protocolo é escolhido pelo transporte do provedor: `max_completion_tokens` para endpoints da família OpenAI, `max_tokens` para provedores que aceitam apenas o nome legado (Mistral, Chutes).
- `stop` é mapeado para o campo de parada do transporte: `stop` para backends de Chat Completions, `stop_sequences` para Anthropic. A API Responses da OpenAI não possui parâmetro de parada; portanto, `stop` não é aplicado a modelos baseados em Responses.
- O backend Codex Responses baseado no ChatGPT usa amostragem fixa no lado do servidor e remove `temperature`/`top_p` (junto com `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) antes que a solicitação chegue a esse backend.

### Variantes não compatíveis

Retorna `400 invalid_request_error` para:

- `tools` que não seja uma matriz, entradas de ferramentas que não sejam funções ou ausência de `tool.function.name`
- variantes de `tool_choice`, como `allowed_tools` e `custom`
- valores de `tool_choice.function.name` que não correspondam a uma ferramenta fornecida

Para `tool_choice: "required"` e `tool_choice` fixado em uma função, o endpoint restringe o conjunto exposto de ferramentas de função do cliente, instrui o runtime a chamar uma ferramenta do cliente antes de responder e retorna um erro se a resposta do agente não contiver uma chamada estruturada correspondente de ferramenta do cliente. Isso se aplica à lista HTTP `tools` fornecida pelo chamador, não a todas as ferramentas internas do agente OpenClaw.

### Formato da resposta de ferramenta sem streaming

Quando o agente chama ferramentas, a resposta usa:

- `choices[0].finish_reason = "tool_calls"`
- entradas em `choices[0].message.tool_calls[]` com `id`, `type: "function"`, `function.name`, `function.arguments` (string JSON)
- Comentários do assistente antes da chamada da ferramenta, em `choices[0].message.content` (possivelmente vazio)

### Formato da resposta de ferramenta com streaming

Quando `stream: true`, as chamadas de ferramenta chegam como blocos SSE incrementais: um delta inicial de função do assistente, deltas opcionais de comentários do assistente, um ou mais blocos `delta.tool_calls` contendo a identidade da ferramenta e fragmentos dos argumentos e, em seguida, um bloco final com `finish_reason: "tool_calls"` e `data: [DONE]`.

Se `stream_options.include_usage=true`, um bloco final de uso é emitido antes de `[DONE]`.

### Ciclo de acompanhamento da ferramenta

Após receber `tool_calls`, execute as funções solicitadas e envie uma solicitação de acompanhamento que inclua a mensagem anterior de chamada de ferramenta do assistente e uma ou mais mensagens com `role: "tool"` e o `tool_call_id` correspondente. Isso continua o mesmo ciclo de raciocínio do agente para produzir a resposta final.

## Streaming (SSE)

Defina `stream: true` para receber eventos enviados pelo servidor:

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- O fluxo termina com `data: [DONE]`

## Configuração rápida do Open WebUI

- URL base: `http://127.0.0.1:18789/v1`
- URL base do Docker no macOS: `http://host.docker.internal:18789/v1`
- Chave da API: seu token bearer do Gateway
- Modelo: `openclaw/default`

Comportamento esperado: `GET /v1/models` lista `openclaw/default`, e o Open WebUI o utiliza como ID do modelo de chat. Para um provedor/modelo de backend específico, defina o modelo padrão normal do agente ou envie `x-openclaw-model` (chamador com segredo compartilhado ou chamador com identidade e `operator.admin`).

Teste rápido de sanidade:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se isso retornar `openclaw/default`, a maioria das configurações do Open WebUI poderá se conectar com a mesma URL base e o mesmo token.

## Exemplos

Sessão estável para uma conversa do aplicativo:

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

Reutilize o mesmo valor de `user` nas chamadas posteriores dessa conversa para continuar a mesma sessão do agente.

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

`/v1/embeddings` aceita `input` como uma string ou uma matriz de strings.

## Conteúdo relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Escopos do operador](/pt-BR/gateway/operator-scopes)
- [OpenAI](/pt-BR/providers/openai)
