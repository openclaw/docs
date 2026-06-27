---
read_when:
    - Integração de clientes que usam a API OpenResponses
    - Você quer entradas baseadas em itens, chamadas de ferramentas do cliente ou eventos SSE
summary: Exponha um endpoint HTTP /v1/responses compatível com OpenResponses a partir do Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:31:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

O Gateway do OpenClaw pode servir um endpoint `POST /v1/responses` compatível com OpenResponses.

Este endpoint é **desabilitado por padrão**. Habilite-o primeiro na configuração.

- `POST /v1/responses`
- Mesma porta do Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, as solicitações são executadas como uma execução normal de agente do Gateway (mesmo caminho de código de
`openclaw agent`), então roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação, segurança e roteamento

O comportamento operacional corresponde a [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api):

- use o caminho de autenticação HTTP do Gateway correspondente:
  - autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticação por proxy confiável (`gateway.auth.mode="trusted-proxy"`): cabeçalhos de proxy com reconhecimento de identidade de uma origem de proxy confiável configurada; proxies de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito
  - fallback direto local de proxy confiável: chamadores do mesmo host sem cabeçalhos `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` podem usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - autenticação aberta de ingresso privado (`gateway.auth.mode="none"`): sem cabeçalho de autenticação
- trate o endpoint como acesso total de operador para a instância do gateway
- para modos de autenticação por segredo compartilhado (`token` e `password`), ignore valores mais restritos de `x-openclaw-scopes` declarados pelo bearer e restaure os padrões normais de operador completo
- para modos HTTP com identidade confiável (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"`), respeite `x-openclaw-scopes` quando presente e, caso contrário, use como fallback o conjunto normal de escopos padrão de operador
- selecione agentes com `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` ou `x-openclaw-agent-id`
- use `x-openclaw-model` quando quiser substituir o modelo de backend do agente selecionado
- use `x-openclaw-session-key` para roteamento explícito de sessão
- use `x-openclaw-message-channel` quando quiser um contexto de canal de ingresso sintético não padrão

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restritos
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat neste endpoint como turnos de remetente proprietário
- modos HTTP com identidade confiável (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - usam como fallback o conjunto normal de escopos padrão de operador quando o cabeçalho está ausente
  - só perdem semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Habilite ou desabilite este endpoint com `gateway.http.endpoints.responses.enabled`.

A mesma superfície de compatibilidade também inclui:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para a explicação canônica de como modelos direcionados a agentes, `openclaw/default`, repasse de embeddings e substituições de modelo de backend se encaixam, consulte [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api#agent-first-model-contract) e [Lista de modelos e roteamento de agentes](/pt-BR/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamento de sessão

Por padrão, o endpoint é **sem estado por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string `user` de OpenResponses, o Gateway deriva uma chave de sessão estável
a partir dela, para que chamadas repetidas possam compartilhar uma sessão de agente.

## Formato da solicitação (compatível)

A solicitação segue a API OpenResponses com entrada baseada em itens. Compatibilidade atual:

- `input`: string ou array de objetos de item.
- `instructions`: mescladas ao prompt do sistema.
- `tools`: definições de ferramentas do cliente (ferramentas de função).
- `tool_choice`: `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "name": "..." }` para filtrar ou exigir ferramentas do cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: limite de saída de melhor esforço (dependente do provedor).
- `temperature`: temperatura de amostragem de melhor esforço encaminhada ao provedor. Ignorada pelo backend Codex Responses baseado em ChatGPT, que usa amostragem fixa do lado do servidor.
- `top_p`: amostragem de núcleo de melhor esforço encaminhada ao provedor. Mesma ressalva de Codex Responses que `temperature`.
- `user`: roteamento de sessão estável.

Aceitos, mas **ignorados atualmente**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatível:

- `previous_response_id`: o OpenClaw reutiliza a sessão de resposta anterior quando a solicitação permanece dentro do mesmo escopo de agente/usuário/sessão solicitada.

## Itens (entrada)

### `message`

Funções: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` são anexados ao prompt do sistema.
- O item `user` ou `function_call_output` mais recente se torna a "mensagem atual".
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

Aceitos para compatibilidade de esquema, mas ignorados ao criar o prompt.

## Ferramentas (ferramentas de função do lado do cliente)

Forneça ferramentas com `tools: [{ type: "function", name, description?, parameters? }]`.

Se o agente decidir chamar uma ferramenta, a resposta retornará um item de saída `function_call`.
Você então envia uma solicitação de acompanhamento com `function_call_output` para continuar o turno.

Para `tool_choice: "required"` e `tool_choice` fixado em função, o endpoint restringe o conjunto exposto de ferramentas de função do cliente, instrui o runtime a chamar uma ferramenta do cliente antes de responder e rejeita o turno se ele não incluir uma chamada estruturada de ferramenta do cliente correspondente. Este contrato se aplica à lista HTTP `tools` fornecida pelo chamador, não a todas as ferramentas internas de agente do OpenClaw. Solicitações sem streaming retornam `502` com um `api_error`; solicitações com streaming emitem um evento `response.failed`. Isso corresponde ao contrato de `/v1/chat/completions`.

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
- O texto decodificado do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser adicionado,
  então os bytes do arquivo são tratados como dados, não como instruções confiáveis.
- O bloco injetado usa marcadores de limite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados
  `Source: External`.
- Este caminho de entrada de arquivo omite intencionalmente o banner longo `SECURITY NOTICE:` para
  preservar o orçamento de prompt; os marcadores de limite e metadados ainda permanecem em vigor.
- PDFs são analisados primeiro para texto. Se pouco texto for encontrado, as primeiras páginas são
  rasterizadas em imagens e passadas ao modelo, e o bloco de arquivo injetado usa
  o placeholder `[PDF content rendered to images]`.

A análise de PDF é fornecida pelo Plugin `document-extract` incluído, que usa
`clawpdf` e seu runtime PDFium WebAssembly empacotado para extração de texto e
renderização de páginas.

Padrões de busca por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` baseadas em URL por solicitação)
- As solicitações são protegidas (resolução DNS, bloqueio de IP privado, limites de redirecionamento, timeouts).
- Listas de permissão opcionais de hostname são compatíveis por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exato: `"cdn.example.com"`
  - Subdomínios curinga: `"*.assets.example.com"` (não corresponde ao ápice)
  - Listas de permissão vazias ou omitidas significam nenhuma restrição de lista de permissão de hostname.
- Para desabilitar completamente buscas baseadas em URL, defina `files.allowUrl: false` e/ou `images.allowUrl: false`.

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
- Fontes HEIC/HEIF de `input_image` são aceitas quando um conversor de sistema está disponível e são normalizadas para JPEG antes da entrega ao provedor. Conversores compatíveis são `sips` do macOS, ImageMagick, GraphicsMagick ou ffmpeg.

Nota de segurança:

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
- `response.failed` (em erro)

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
- `400` corpo de solicitação inválido
- `405` método errado

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

## Relacionado

- [Conclusões de chat da OpenAI](/pt-BR/gateway/openai-http-api)
- [OpenAI](/pt-BR/providers/openai)
