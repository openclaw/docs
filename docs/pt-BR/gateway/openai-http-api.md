---
read_when:
    - Integrando ferramentas que esperam OpenAI Chat Completions
summary: Expor um endpoint HTTP `/v1/chat/completions` compatível com OpenAI a partir do Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-24T05:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

O Gateway do OpenClaw pode servir um pequeno endpoint Chat Completions compatível com OpenAI.

Esse endpoint fica **desabilitado por padrão**. Primeiro, habilite-o na configuração.

- `POST /v1/chat/completions`
- Mesma porta do Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando a superfície HTTP compatível com OpenAI do Gateway está habilitada, ela também serve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Internamente, as solicitações são executadas como uma execução normal de agente do Gateway (o mesmo codepath de `openclaw agent`), então o roteamento/permissões/configuração correspondem ao seu Gateway.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pela proxy com reconhecimento de identidade configurada e deixe-a injetar
  os headers de identidade necessários
- autenticação aberta para entrada privada (`gateway.auth.mode="none"`):
  nenhum header de autenticação é necessário

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem trusted proxy configurada sem loopback; proxies em loopback no mesmo host
  não satisfazem esse modo.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate esse endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação HTTP bearer aqui não é um modelo restrito de escopo por usuário.
- Um token/senha válidos do Gateway para esse endpoint devem ser tratados como uma credencial de proprietário/operador.
- As solicitações passam pelo mesmo caminho de agente do plano de controle que ações confiáveis de operador.
- Não há um limite separado de ferramentas para não proprietário/por usuário nesse endpoint; assim que um chamador passa pela autenticação do Gateway aqui, o OpenClaw trata esse chamador como um operador confiável desse gateway.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um header `x-openclaw-scopes` mais restrito.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação trusted proxy ou `gateway.auth.mode="none"`) respeitam `x-openclaw-scopes` quando presente e, caso contrário, usam o conjunto normal de escopos padrão de operador.
- Se a política do agente de destino permitir ferramentas sensíveis, esse endpoint poderá usá-las.
- Mantenha esse endpoint apenas em loopback/tailnet/entrada privada; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restrito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata turnos de chat nesse endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação trusted proxy ou `gateway.auth.mode="none"` em entrada privada)
  - autenticam alguma identidade externa confiável ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o header está presente
  - usam o conjunto normal de escopos padrão de operador quando o header está ausente
  - só perdem a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

Consulte [Segurança](/pt-BR/gateway/security) e [Acesso remoto](/pt-BR/gateway/remote).

## Contrato de modelo agent-first

O OpenClaw trata o campo OpenAI `model` como um **alvo de agente**, não como um ID bruto de modelo de provedor.

- `model: "openclaw"` roteia para o agente padrão configurado.
- `model: "openclaw/default"` também roteia para o agente padrão configurado.
- `model: "openclaw/<agentId>"` roteia para um agente específico.

Headers opcionais da solicitação:

- `x-openclaw-model: <provider/model-or-bare-id>` substitui o modelo de backend do agente selecionado.
- `x-openclaw-agent-id: <agentId>` continua compatível como substituição por compatibilidade.
- `x-openclaw-session-key: <sessionKey>` controla completamente o roteamento da sessão.
- `x-openclaw-message-channel: <channel>` define o contexto sintético do canal de entrada para prompts e políticas com reconhecimento de canal.

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

Se a solicitação incluir uma string OpenAI `user`, o Gateway deriva uma chave de sessão estável a partir dela, para que chamadas repetidas possam compartilhar uma sessão de agente.

## Por que essa superfície importa

Este é o conjunto de compatibilidade de maior impacto para frontends e ferramentas autohospedados:

- A maioria das configurações de Open WebUI, LobeChat e LibreChat espera `/v1/models`.
- Muitos sistemas RAG esperam `/v1/embeddings`.
- Clientes de chat OpenAI existentes normalmente podem começar com `/v1/chat/completions`.
- Clientes mais nativos de agente preferem cada vez mais `/v1/responses`.

## Lista de modelos e roteamento de agentes

<AccordionGroup>
  <Accordion title="O que `/v1/models` retorna?">
    Uma lista de alvos de agente do OpenClaw.

    Os IDs retornados são entradas `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Use-os diretamente como valores de OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` lista agentes ou subagentes?">
    Ele lista alvos de agente de nível superior, não modelos de backend de provedor nem subagentes.

    Os subagentes continuam sendo topologia interna de execução. Eles não aparecem como pseudomodelos.

  </Accordion>
  <Accordion title="Por que `openclaw/default` está incluído?">
    `openclaw/default` é o alias estável para o agente padrão configurado.

    Isso significa que os clientes podem continuar usando um ID previsível, mesmo que o ID real do agente padrão mude entre ambientes.

  </Accordion>
  <Accordion title="Como substituo o modelo de backend?">
    Use `x-openclaw-model`.

    Exemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se você omiti-lo, o agente selecionado será executado com sua escolha normal de modelo configurada.

  </Accordion>
  <Accordion title="Como embeddings se encaixam nesse contrato?">
    `/v1/embeddings` usa os mesmos IDs `model` de alvo de agente.

    Use `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Quando precisar de um modelo de embedding específico, envie-o em `x-openclaw-model`.
    Sem esse header, a solicitação é repassada para a configuração normal de embeddings do agente selecionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- O stream termina com `data: [DONE]`

## Configuração rápida do Open WebUI

Para uma conexão básica com Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base do Docker no macOS: `http://host.docker.internal:18789/v1`
- Chave de API: seu token bearer do Gateway
- Modelo: `openclaw/default`

Comportamento esperado:

- `GET /v1/models` deve listar `openclaw/default`
- O Open WebUI deve usar `openclaw/default` como ID do modelo de chat
- Se você quiser um provedor/modelo de backend específico para esse agente, defina o modelo padrão normal do agente ou envie `x-openclaw-model`

Teste rápido:

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

- `/v1/models` retorna alvos de agente do OpenClaw, não catálogos brutos de provedores.
- `openclaw/default` está sempre presente para que um ID estável funcione entre ambientes.
- Substituições de provedor/modelo de backend pertencem a `x-openclaw-model`, não ao campo OpenAI `model`.
- `/v1/embeddings` oferece suporte a `input` como string ou array de strings.

## Relacionado

- [Referência de Configuração](/pt-BR/gateway/configuration-reference)
- [OpenAI](/pt-BR/providers/openai)
