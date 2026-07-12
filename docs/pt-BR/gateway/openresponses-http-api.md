---
read_when:
    - Integração de clientes que usam a API OpenResponses
    - Você quer entradas baseadas em itens, chamadas de ferramentas do cliente ou eventos SSE
summary: Exponha um endpoint HTTP `/v1/responses` compatível com OpenResponses por meio do Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T15:14:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

O Gateway pode disponibilizar um endpoint `POST /v1/responses` compatível com OpenResponses. Ele é **desativado por padrão** e compartilha a porta com o Gateway (multiplexação de WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

As solicitações são executadas como uma execução normal de agente do Gateway (o mesmo caminho de código de `openclaw agent`), portanto o roteamento, as permissões e a configuração correspondem aos do seu Gateway.

Ative ou desative com `gateway.http.endpoints.responses.enabled`. Quando ativado, a mesma superfície de compatibilidade também disponibiliza `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` e `POST /v1/chat/completions`.

## Autenticação, segurança e roteamento

O comportamento operacional corresponde ao de [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api):

- O caminho de autenticação corresponde a `gateway.auth.mode`: segredo compartilhado (`token`/`password`) usa `Authorization: Bearer <token-or-password>`; proxy confiável usa cabeçalhos de proxy com informações de identidade (proxies de loopback no mesmo host precisam de `gateway.auth.trustedProxy.allowLoopback = true`, com um fallback direto no mesmo host por meio de `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` quando nenhum cabeçalho `Forwarded`/`X-Forwarded-*`/`X-Real-IP` está presente); `none` em ingresso privado não precisa de cabeçalho de autenticação. Consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- Trate o endpoint como acesso total de operador à instância do Gateway.
- Os modos de autenticação por segredo compartilhado ignoram um `x-openclaw-scopes` mais restrito declarado no bearer e restauram o conjunto completo de escopos padrão do operador: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Os turnos de chat neste endpoint são tratados como turnos enviados pelo proprietário.
- Os modos HTTP confiáveis com identidade (proxy confiável ou `gateway.auth.mode="none"`) respeitam `x-openclaw-scopes` quando presente; caso contrário, recorrem ao conjunto de escopos padrão do operador. A semântica de proprietário é perdida somente quando o chamador restringe explicitamente os escopos e omite `operator.admin`.
- Selecione agentes com `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` ou o cabeçalho `x-openclaw-agent-id`.
- Use `x-openclaw-model` para substituir o modelo de backend do agente selecionado (requer `operator.admin` nos caminhos de autenticação com identidade).
- Use `x-openclaw-session-key` para roteamento explícito de sessão (rejeitado com `400 invalid_request_error` se usar um namespace reservado: `subagent:`, `cron:`, `acp:`).
- Use `x-openclaw-message-channel` para um contexto de canal de ingresso sintético que não seja o padrão.

Para obter a explicação canônica sobre modelos direcionados a agentes, `openclaw/default`, repasse de embeddings e substituições de modelo de backend, consulte [OpenAI Chat Completions](/pt-BR/gateway/openai-http-api#agent-first-model-contract).

Consulte [Escopos do operador](/pt-BR/gateway/operator-scopes) e [Segurança](/pt-BR/gateway/security).

## Comportamento da sessão

Por padrão, o endpoint é **sem estado por solicitação** (uma nova chave de sessão é gerada a cada chamada).

Se a solicitação incluir uma string OpenResponses `user`, o Gateway derivará dela uma chave de sessão estável para que chamadas repetidas possam compartilhar uma sessão de agente.

`previous_response_id` reutiliza a sessão da resposta anterior quando a solicitação permanece no mesmo escopo de agente/usuário/sessão solicitada (correspondência por sujeito da autenticação, ID do agente e `x-openclaw-session-key`).

## Formato da solicitação

| Campo                                                            | Compatibilidade                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | String ou array de objetos de item.                                                                                               |
| `instructions`                                                   | Mesclado ao prompt do sistema.                                                                                                 |
| `tools`                                                          | Definições de ferramentas do cliente (ferramentas de função).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "name": "..." }` para filtrar ou exigir ferramentas do cliente.                |
| `stream`                                                         | Ativa streaming por SSE.                                                                                                         |
| `max_output_tokens`                                              | Limite de saída com base no melhor esforço (dependente do provedor).                                                                                 |
| `temperature`                                                    | Temperatura de amostragem com base no melhor esforço. Ignorada pelo backend Codex Responses baseado no ChatGPT, que usa amostragem fixa no lado do servidor. |
| `top_p`                                                          | Amostragem de núcleo com base no melhor esforço. A mesma ressalva de Codex Responses de `temperature`.                                                    |
| `user`                                                           | Roteamento estável de sessão.                                                                                                        |
| `previous_response_id`                                           | Continuidade da sessão (veja acima).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Aceitos, mas atualmente ignorados.                                                                                                |

## Itens (entrada)

### `message`

Funções: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` são acrescentados ao prompt do sistema.
- O item `user` ou `function_call_output` mais recente torna-se a "mensagem atual".
- Mensagens anteriores do usuário/assistente são incluídas como histórico para contexto.

### `function_call_output` (ferramentas baseadas em turnos)

Envie os resultados das ferramentas de volta ao modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Aceitos para compatibilidade de esquema, mas ignorados durante a criação do prompt.

## Ferramentas (ferramentas de função no lado do cliente)

Forneça ferramentas com `tools: [{ type: "function", name, description?, parameters? }]`.

Se o agente chamar uma ferramenta, a resposta retornará um item de saída `function_call`. Envie uma solicitação subsequente com `function_call_output` para continuar o turno.

Para `tool_choice: "required"` e `tool_choice` fixado em uma função, o endpoint restringe o conjunto exposto de ferramentas de função do cliente, instrui o runtime a chamar uma ferramenta do cliente antes de responder e rejeita o turno se ele não incluir uma chamada estruturada correspondente de ferramenta do cliente, de acordo com o contrato de `/v1/chat/completions`. Solicitações sem streaming retornam `502` com um `api_error`; solicitações com streaming emitem um evento `response.failed`.

## Imagens (`input_image`)

Compatível com fontes base64 ou URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (padrão): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Tamanho máximo (padrão): 10MB.

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

Tipos MIME permitidos (padrão): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Tamanho máximo (padrão): 5MB.

Comportamento atual:

- O conteúdo do arquivo é decodificado e adicionado ao **prompt do sistema**, não à mensagem do usuário, portanto permanece efêmero (não é persistido no histórico da sessão).
- O texto decodificado do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser adicionado, portanto os bytes do arquivo são tratados como dados, não como instruções confiáveis. O bloco injetado usa marcadores de limite explícitos (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) e uma linha de metadados `Source: External`. Ele omite intencionalmente o banner longo `SECURITY NOTICE:` para preservar o orçamento do prompt; os marcadores de limite e os metadados ainda se aplicam.
- Primeiro, os PDFs são analisados para extrair texto. Se pouco texto for encontrado, as primeiras páginas serão rasterizadas em imagens e enviadas ao modelo, e o bloco de arquivo injetado usará o placeholder `[PDF content rendered to images]`.

A análise de PDF é fornecida pelo plugin `document-extract` incluído, que usa `clawpdf` e seu runtime PDFium WebAssembly empacotado para extração de texto e renderização de páginas.

Padrões de busca por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` baseadas em URL por solicitação)
- As solicitações são protegidas (resolução de DNS, bloqueio de IPs privados, limites de redirecionamento, tempos limite).
- Há suporte a listas de permissões opcionais de nomes de host por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`): host exato (`"cdn.example.com"`) ou subdomínios curinga (`"*.assets.example.com"`, não corresponde ao domínio raiz). Listas de permissões vazias ou omitidas significam que não há restrição por lista de permissões de nomes de host.
- Para desativar completamente as buscas baseadas em URL, defina `files.allowUrl: false` e/ou `images.allowUrl: false`.

## Limites de arquivos e imagens (configuração)

Os valores padrão podem ser ajustados em `gateway.http.endpoints.responses`:

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
            maxChars: 60000,
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

Valores padrão quando omitidos:

| Chave                    | Padrão    |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

As fontes HEIC/HEIF de `input_image` são normalizadas para JPEG antes da entrega ao provedor por meio do processador de imagens compartilhado do OpenClaw (Rastermill), que recorre a um conversor do sistema (`sips`, ImageMagick, GraphicsMagick ou ffmpeg) para formatos que exigem suporte a codecs externos.

Observação de segurança: as listas de permissões de URL são aplicadas antes da busca e em cada etapa de redirecionamento. Incluir um nome de host na lista de permissões não contorna o bloqueio de IPs privados/internos. Para gateways expostos à internet, aplique controles de saída de rede além das proteções no nível do aplicativo. Consulte [Segurança](/pt-BR/gateway/security).

## Streaming (SSE)

Defina `stream: true` para receber eventos enviados pelo servidor:

- `Content-Type: text/event-stream`
- Cada linha de evento é `event: <type>` e `data: <json>`
- O fluxo termina com `data: [DONE]`

Tipos de evento emitidos atualmente: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (em caso de erro).

## Uso

`usage` é preenchido quando o provedor subjacente informa as contagens de tokens. O OpenClaw normaliza aliases comuns no estilo da OpenAI antes que esses contadores cheguem às superfícies de status/sessão subsequentes, incluindo `input_tokens` / `output_tokens` e `prompt_tokens` / `completion_tokens`.

## Erros

Os erros usam um objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comuns: `400` corpo da solicitação inválido, `401` autenticação ausente/inválida, `403` escopo de operador ausente, `405` método incorreto, `429` excesso de tentativas de autenticação malsucedidas (com `Retry-After`).

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
- [Escopos de operador](/pt-BR/gateway/operator-scopes)
- [OpenAI](/pt-BR/providers/openai)
