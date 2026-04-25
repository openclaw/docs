---
read_when:
    - Integrando clientes que falam a API OpenResponses
    - Você quer entradas baseadas em itens, chamadas de ferramenta do cliente ou eventos SSE
summary: Exponha um endpoint HTTP `/v1/responses` compatível com OpenResponses a partir do Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-25T13:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

O Gateway do OpenClaw pode servir um endpoint `POST /v1/responses` compatível com OpenResponses.

Esse endpoint fica **desativado por padrão**. Ative-o primeiro na configuração.

- `POST /v1/responses`
- Mesma porta do Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, as solicitações são executadas como uma execução normal de agente do Gateway (mesmo codepath de
`openclaw agent`), então roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação, segurança e roteamento

O comportamento operacional corresponde a [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api):

- use o caminho correspondente de autenticação HTTP do Gateway:
  - autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticação por trusted-proxy (`gateway.auth.mode="trusted-proxy"`): headers de proxy com reconhecimento de identidade vindos de uma origem trusted proxy configurada que não seja loopback
  - autenticação aberta em entrada privada (`gateway.auth.mode="none"`): sem header de autenticação
- trate o endpoint como acesso completo de operator para a instância do gateway
- para modos de autenticação por segredo compartilhado (`token` e `password`), ignore valores mais restritos de `x-openclaw-scopes` declarados no bearer e restaure os padrões normais completos de operator
- para modos HTTP confiáveis com identidade (por exemplo trusted proxy auth ou `gateway.auth.mode="none"`), respeite `x-openclaw-scopes` quando presente e, caso contrário, use como fallback o conjunto normal de escopos padrão de operator
- selecione agentes com `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` ou `x-openclaw-agent-id`
- use `x-openclaw-model` quando quiser sobrescrever o modelo de backend do agente selecionado
- use `x-openclaw-session-key` para roteamento explícito de sessão
- use `x-openclaw-message-channel` quando quiser um contexto sintético de canal de entrada diferente do padrão

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prova posse do segredo compartilhado de operator do gateway
  - ignora `x-openclaw-scopes` mais restritos
  - restaura o conjunto completo padrão de escopos de operator:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat nesse endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo trusted proxy auth, ou `gateway.auth.mode="none"` em entrada privada)
  - respeitam `x-openclaw-scopes` quando o header está presente
  - usam como fallback o conjunto normal de escopos padrão de operator quando o header está ausente
  - só perdem a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Ative ou desative esse endpoint com `gateway.http.endpoints.responses.enabled`.

A mesma superfície de compatibilidade também inclui:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para a explicação canônica de como modelos direcionados a agente, `openclaw/default`, passthrough de embeddings e sobrescritas de modelo de backend se encaixam, consulte [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api#agent-first-model-contract) e [Lista de modelos e roteamento de agente](/pt-BR/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamento de sessão

Por padrão, o endpoint é **stateless por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string `user` do OpenResponses, o Gateway deriva dela uma chave de sessão estável,
para que chamadas repetidas possam compartilhar uma sessão de agente.

## Formato da solicitação (compatível)

A solicitação segue a API OpenResponses com entrada baseada em itens. Suporte atual:

- `input`: string ou array de objetos de item.
- `instructions`: mesclado ao prompt de sistema.
- `tools`: definições de ferramentas do cliente (function tools).
- `tool_choice`: filtra ou exige ferramentas do cliente.
- `stream`: ativa streaming SSE.
- `max_output_tokens`: limite de saída por melhor esforço (dependente do provedor).
- `user`: roteamento estável de sessão.

Aceitos, mas **atualmente ignorados**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatível:

- `previous_response_id`: o OpenClaw reutiliza a sessão da resposta anterior quando a solicitação permanece dentro do mesmo escopo de agente/usuário/sessão solicitada.

## Itens (`input`)

### `message`

Papéis: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` são acrescentados ao prompt de sistema.
- O item `user` ou `function_call_output` mais recente se torna a “mensagem atual”.
- Mensagens anteriores de user/assistant são incluídas como histórico para contexto.

### `function_call_output` (ferramentas por turno)

Envie os resultados da ferramenta de volta ao modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Aceitos para compatibilidade de schema, mas ignorados ao construir o prompt.

## Ferramentas (function tools do lado do cliente)

Forneça ferramentas com `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Se o agente decidir chamar uma ferramenta, a resposta retornará um item de saída `function_call`.
Em seguida, você envia uma solicitação de acompanhamento com `function_call_output` para continuar o turno.

## Imagens (`input_image`)

Compatível com fontes base64 ou URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (atuais): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Tamanho máximo (atual): 10MB.

## Arquivos (`input_file`)

Compatível com fontes base64 ou URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Tipos MIME permitidos (atuais): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Tamanho máximo (atual): 5MB.

Comportamento atual:

- O conteúdo do arquivo é decodificado e adicionado ao **prompt de sistema**, não à mensagem do usuário,
  para que permaneça efêmero (não persistido no histórico da sessão).
- O texto do arquivo decodificado é encapsulado como **conteúdo externo não confiável** antes de ser adicionado,
  para que os bytes do arquivo sejam tratados como dados, não como instruções confiáveis.
- O bloco injetado usa marcadores explícitos de limite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma
  linha de metadados `Source: External`.
- Esse caminho de entrada de arquivo omite intencionalmente o longo banner `SECURITY NOTICE:`
  para preservar orçamento de prompt; os marcadores de limite e metadados ainda permanecem no lugar.
- PDFs são primeiro analisados para extração de texto. Se pouco texto for encontrado, as primeiras páginas
  são rasterizadas em imagens e passadas ao modelo, e o bloco de arquivo injetado usa
  o placeholder `[PDF content rendered to images]`.

A análise de PDF é fornecida pelo Plugin `document-extract` incluído, que usa a
build legada de `pdfjs-dist` compatível com Node (sem worker). A build moderna do PDF.js
espera workers/globals DOM de navegador, então não é usada no Gateway.

Padrões de busca por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` baseadas em URL por solicitação)
- Solicitações são protegidas (resolução DNS, bloqueio de IP privado, limites de redirecionamento, timeouts).
- Há suporte a allowlists opcionais de hostname por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exato: `"cdn.example.com"`
  - Subdomínios com curinga: `"*.assets.example.com"` (não corresponde ao apex)
  - Allowlists vazias ou omitidas significam ausência de restrição por allowlist de hostname.
- Para desativar totalmente buscas baseadas em URL, defina `files.allowUrl: false` e/ou `images.allowUrl: false`.

## Limites de arquivo + imagem (config)

Os padrões podem ser ajustados em `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

Padrões quando omitidos:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4.000.000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Fontes `input_image` HEIC/HEIF são aceitas e normalizadas para JPEG antes da entrega ao provedor.

Observação de segurança:

- Allowlists de URL são aplicadas antes da busca e em cada salto de redirecionamento.
- Colocar um hostname na allowlist não contorna o bloqueio de IP privado/interno.
- Para gateways expostos à internet, aplique controles de saída de rede além das proteções no nível da aplicação.
  Consulte [Security](/pt-BR/gateway/security).

## Streaming (SSE)

Defina `stream: true` para receber eventos Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `event: <type>` e `data: <json>`
- O stream termina com `data: [DONE]`

Tipos de evento emitidos atualmente:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (em caso de erro)

## Uso

`usage` é preenchido quando o provedor subjacente informa contagens de tokens.
O OpenClaw normaliza aliases comuns no estilo OpenAI antes que esses contadores cheguem
às superfícies downstream de status/sessão, incluindo `input_tokens` / `output_tokens`
e `prompt_tokens` / `completion_tokens`.

## Erros

Erros usam um objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comuns:

- `401` autenticação ausente/inválida
- `400` corpo de solicitação inválido
- `405` método incorreto

## Exemplos

Sem streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Com streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Relacionados

- [OpenAI chat completions](/pt-BR/gateway/openai-http-api)
- [OpenAI](/pt-BR/providers/openai)
