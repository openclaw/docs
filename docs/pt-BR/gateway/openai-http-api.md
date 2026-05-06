---
read_when:
    - Integrando ferramentas que esperam OpenAI Chat Completions
summary: Expor um endpoint HTTP /v1/chat/completions compatível com OpenAI a partir do Gateway
title: Conclusões de chat da OpenAI
x-i18n:
    generated_at: "2026-05-06T09:04:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway pode servir um pequeno endpoint de Chat Completions compatível com OpenAI.

Este endpoint fica **desativado por padrão**. Ative-o primeiro na configuração.

- `POST /v1/chat/completions`
- Mesma porta que o Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando a superfície HTTP compatível com OpenAI do Gateway está ativada, ela também serve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Por baixo dos panos, as solicitações são executadas como uma execução normal de agente do Gateway (o mesmo caminho de código que `openclaw agent`), então roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe-o injetar os
  cabeçalhos de identidade exigidos
- autenticação aberta em ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é exigido

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies local loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso completo de operador** para a instância do Gateway.

- A autenticação bearer HTTP aqui não é um modelo de escopo restrito por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como credencial de proprietário/operador.
- As solicitações passam pelo mesmo caminho de agente do plano de controle que ações confiáveis de operador.
- Não há um limite separado de ferramentas para não proprietários/por usuário neste endpoint; depois que um chamador passa pela autenticação do Gateway aqui, o OpenClaw trata esse chamador como um operador confiável para este gateway.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"`) respeitam `x-openclaw-scopes` quando presente e, caso contrário, voltam ao conjunto normal de escopos padrão do operador.
- Se a política do agente de destino permitir ferramentas sensíveis, este endpoint poderá usá-las.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova a posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restritos
  - restaura o conjunto completo de escopos padrão do operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat neste endpoint como turnos enviados pelo proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - voltam ao conjunto normal de escopos padrão do operador quando o cabeçalho está ausente
  - só perdem semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Consulte [Segurança](/pt-BR/gateway/security) e [Acesso remoto](/pt-BR/gateway/remote).

## Contrato de modelo com agente primeiro

O OpenClaw trata o campo OpenAI `model` como um **destino de agente**, não como um ID bruto de modelo de provedor.

- `model: "openclaw"` roteia para o agente padrão configurado.
- `model: "openclaw/default"` também roteia para o agente padrão configurado.
- `model: "openclaw/<agentId>"` roteia para um agente específico.

Cabeçalhos opcionais de solicitação:

- `x-openclaw-model: <provider/model-or-bare-id>` substitui o modelo de backend para o agente selecionado.
- `x-openclaw-agent-id: <agentId>` continua compatível como substituição de compatibilidade.
- `x-openclaw-session-key: <sessionKey>` controla totalmente o roteamento de sessão.
- `x-openclaw-message-channel: <channel>` define o contexto sintético do canal de ingresso para prompts e políticas cientes de canal.

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

Se a solicitação incluir uma string OpenAI `user`, o Gateway derivará uma chave de sessão estável a partir dela, então chamadas repetidas podem compartilhar uma sessão de agente.

## Por que esta superfície importa

Este é o conjunto de compatibilidade de maior impacto para frontends e ferramentas auto-hospedados:

- A maioria das configurações do Open WebUI, LobeChat e LibreChat espera `/v1/models`.
- Muitos sistemas RAG esperam `/v1/embeddings`.
- Clientes de chat OpenAI existentes geralmente podem começar com `/v1/chat/completions`.
- Clientes mais nativos de agentes preferem cada vez mais `/v1/responses`.

## Lista de modelos e roteamento de agentes

<AccordionGroup>
  <Accordion title="O que `/v1/models` retorna?">
    Uma lista de destinos de agente do OpenClaw.

    Os IDs retornados são entradas `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Use-os diretamente como valores OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` lista agentes ou subagentes?">
    Ele lista destinos de agente de nível superior, não modelos de provedor de backend nem subagentes.

    Subagentes continuam sendo topologia interna de execução. Eles não aparecem como pseudomodelos.

  </Accordion>
  <Accordion title="Por que `openclaw/default` está incluído?">
    `openclaw/default` é o alias estável para o agente padrão configurado.

    Isso significa que clientes podem continuar usando um ID previsível mesmo que o ID real do agente padrão mude entre ambientes.

  </Accordion>
  <Accordion title="Como substituo o modelo de backend?">
    Use `x-openclaw-model`.

    Exemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se você o omitir, o agente selecionado será executado com sua escolha normal de modelo configurada.

  </Accordion>
  <Accordion title="Como embeddings se encaixam neste contrato?">
    `/v1/embeddings` usa os mesmos IDs `model` de destino de agente.

    Use `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Quando precisar de um modelo de embedding específico, envie-o em `x-openclaw-model`.
    Sem esse cabeçalho, a solicitação passa para a configuração normal de embeddings do agente selecionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Defina `stream: true` para receber eventos enviados pelo servidor (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- O stream termina com `data: [DONE]`

## Configuração rápida do Open WebUI

Para uma conexão básica com o Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base do Docker no macOS: `http://host.docker.internal:18789/v1`
- Chave de API: seu token bearer do Gateway
- Modelo: `openclaw/default`

Comportamento esperado:

- `GET /v1/models` deve listar `openclaw/default`
- O Open WebUI deve usar `openclaw/default` como ID do modelo de chat
- Se você quiser um provedor/modelo de backend específico para esse agente, defina o modelo padrão normal do agente ou envie `x-openclaw-model`

Smoke rápido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se isso retornar `openclaw/default`, a maioria das configurações do Open WebUI consegue se conectar com a mesma URL base e token.

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

- `/v1/models` retorna destinos de agente do OpenClaw, não catálogos brutos de provedores.
- `openclaw/default` está sempre presente para que um ID estável funcione em diferentes ambientes.
- Substituições de provedor/modelo de backend pertencem a `x-openclaw-model`, não ao campo OpenAI `model`.
- `/v1/embeddings` aceita `input` como uma string ou um array de strings.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [OpenAI](/pt-BR/providers/openai)
