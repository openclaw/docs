---
read_when:
    - Integrando clientes que usam a API OpenResponses
    - Você quer entradas baseadas em itens, chamadas de ferramentas do cliente ou eventos SSE
summary: Expor um endpoint HTTP /v1/responses compatível com OpenResponses a partir do Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-30T09:50:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

O Gateway do OpenClaw pode servir um endpoint `POST /v1/responses` compatível com OpenResponses.

Esse endpoint fica **desabilitado por padrão**. Habilite-o primeiro na configuração.

- `POST /v1/responses`
- A mesma porta do Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Por baixo dos panos, as solicitações são executadas como uma execução normal de agente do Gateway (o mesmo caminho de código de
`openclaw agent`), portanto roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação, segurança e roteamento

O comportamento operacional corresponde a [Conclusões de chat da OpenAI](/pt-BR/gateway/openai-http-api):

- use o caminho de autenticação HTTP do Gateway correspondente:
  - autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticação por proxy confiável (`gateway.auth.mode="trusted-proxy"`): cabeçalhos de proxy com identidade de uma origem de proxy confiável configurada; proxies local loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito
  - autenticação aberta em ingresso privado (`gateway.auth.mode="none"`): nenhum cabeçalho de autenticação
- trate o endpoint como acesso completo de operador para a instância do gateway
- para modos de autenticação por segredo compartilhado (`token` e `password`), ignore valores `x-openclaw-scopes` mais restritos declarados no bearer e restaure os padrões normais de operador completo
- para modos HTTP com identidade confiável (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"`), respeite `x-openclaw-scopes` quando presente e, caso contrário, volte ao conjunto normal de escopos padrão do operador
- selecione agentes com `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` ou `x-openclaw-agent-id`
- use `x-openclaw-model` quando quiser substituir o modelo de backend do agente selecionado
- use `x-openclaw-session-key` para roteamento explícito de sessão
- use `x-openclaw-message-channel` quando quiser um contexto de canal de ingresso sintético não padrão

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restritos
  - restaura o conjunto completo de escopos padrão do operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat neste endpoint como turnos do remetente proprietário
- modos HTTP com identidade confiável (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - voltam ao conjunto normal de escopos padrão do operador quando o cabeçalho está ausente
  - só perdem a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Habilite ou desabilite este endpoint com `gateway.http.endpoints.responses.enabled`.

A mesma superfície de compatibilidade também inclui:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para a explicação canônica de como modelos direcionados a agentes, `openclaw/default`, repasse de embeddings e substituições de modelo de backend se combinam, consulte [Conclusões de chat da OpenAI](/pt-BR/gateway/openai-http-api#agent-first-model-contract) e [Lista de modelos e roteamento de agentes](/pt-BR/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamento de sessão

Por padrão, o endpoint é **sem estado por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string `user` do OpenResponses, o Gateway derivará dela uma chave de sessão estável, para que chamadas repetidas possam compartilhar uma sessão de agente.

## Formato da solicitação (compatível)

A solicitação segue a API OpenResponses com entrada baseada em itens. Compatibilidade atual:

- `input`: string ou array de objetos de item.
- `instructions`: mesclado ao prompt do sistema.
- `tools`: definições de ferramentas do cliente (ferramentas de função).
- `tool_choice`: filtra ou exige ferramentas do cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: limite de saída por melhor esforço (dependente do provedor).
- `user`: roteamento de sessão estável.

Aceitos, mas **ignorados atualmente**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatível:

- `previous_response_id`: o OpenClaw reutiliza a sessão de resposta anterior quando a solicitação permanece no mesmo escopo de agente/usuário/sessão solicitada.

## Itens (entrada)

### `message`

Papéis: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` são anexados ao prompt do sistema.
- O item `user` ou `function_call_output` mais recente se torna a “mensagem atual”.
- Mensagens anteriores de usuário/assistente são incluídas como histórico para contexto.

### `function_call_output` (ferramentas baseadas em turno)

Envie resultados de ferramentas de volta ao modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Aceitos para compatibilidade de schema, mas ignorados ao criar o prompt.

## Ferramentas (ferramentas de função do lado do cliente)

Forneça ferramentas com `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Se o agente decidir chamar uma ferramenta, a resposta retornará um item de saída `function_call`.
Em seguida, envie uma solicitação de acompanhamento com `function_call_output` para continuar o turno.

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

- O conteúdo do arquivo é decodificado e adicionado ao **prompt do sistema**, não à mensagem do usuário,
  portanto permanece efêmero (não persistido no histórico da sessão).
- O texto decodificado do arquivo é envolvido como **conteúdo externo não confiável** antes de ser adicionado,
  para que os bytes do arquivo sejam tratados como dados, não como instruções confiáveis.
- O bloco injetado usa marcadores de limite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados
  `Source: External`.
- Este caminho de entrada de arquivo omite intencionalmente o banner longo `SECURITY NOTICE:`
  para preservar o orçamento de prompt; os marcadores de limite e os metadados ainda permanecem no lugar.
- PDFs são analisados primeiro para extração de texto. Se pouco texto for encontrado, as primeiras páginas são
  rasterizadas em imagens e passadas ao modelo, e o bloco de arquivo injetado usa
  o placeholder `[PDF content rendered to images]`.

A análise de PDF é fornecida pelo Plugin `document-extract` incluído, que usa a build legada `pdfjs-dist` compatível com
Node (sem worker). A build moderna do PDF.js
espera workers/globais de DOM de navegador, portanto não é usada no Gateway.

Padrões de busca por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` baseadas em URL por solicitação)
- As solicitações são protegidas (resolução DNS, bloqueio de IP privado, limites de redirecionamento, timeouts).
- Listas opcionais de permissão de hostnames são compatíveis por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exato: `"cdn.example.com"`
  - Subdomínios curinga: `"*.assets.example.com"` (não corresponde ao apex)
  - Listas de permissão vazias ou omitidas significam nenhuma restrição por lista de permissão de hostname.
- Para desabilitar buscas baseadas em URL por completo, defina `files.allowUrl: false` e/ou `images.allowUrl: false`.

## Limites de arquivo + imagem (configuração)

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
- fontes `input_image` HEIC/HEIF são aceitas e normalizadas para JPEG antes da entrega ao provedor.

Observação de segurança:

- Listas de permissão de URL são aplicadas antes da busca e em saltos de redirecionamento.
- Permitir um hostname não ignora o bloqueio de IP privado/interno.
- Para gateways expostos à internet, aplique controles de egresso de rede além das proteções no nível do app.
  Consulte [Segurança](/pt-BR/gateway/security).

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

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

`usage` é preenchido quando o provedor subjacente relata contagens de tokens.
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
- `400` corpo da solicitação inválido
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

Streaming:

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

## Relacionado

- [Conclusões de chat da OpenAI](/pt-BR/gateway/openai-http-api)
- [OpenAI](/pt-BR/providers/openai)
