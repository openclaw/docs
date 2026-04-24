---
read_when:
    - Chamando ferramentas sem executar um turno completo de agente
    - Criando automações que precisam de aplicação de política de ferramentas
summary: Invocar uma única ferramenta diretamente pelo endpoint HTTP do Gateway
title: API de invocação de ferramentas
x-i18n:
    generated_at: "2026-04-24T05:54:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Invocação de ferramentas (HTTP)

O Gateway do OpenClaw expõe um endpoint HTTP simples para invocar uma única ferramenta diretamente. Ele está sempre habilitado e usa autenticação do Gateway mais política de ferramentas. Assim como a superfície compatível com OpenAI `/v1/*`, a autenticação bearer por segredo compartilhado é tratada como acesso confiável de operador para todo o gateway.

- `POST /tools/invoke`
- Mesma porta do Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo padrão do payload é 2 MB.

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
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um header `x-openclaw-scopes` mais restrito.
- A autenticação por segredo compartilhado também trata invocações diretas de ferramenta nesse endpoint como turnos de remetente proprietário.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação trusted proxy ou `gateway.auth.mode="none"` em uma entrada privada) respeitam `x-openclaw-scopes` quando presente e, caso contrário, usam o conjunto normal de escopos padrão de operador.
- Mantenha esse endpoint apenas em loopback/tailnet/entrada privada; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restrito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata invocações diretas de ferramenta nesse endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação trusted proxy ou `gateway.auth.mode="none"` em entrada privada)
  - autenticam alguma identidade externa confiável ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o header está presente
  - usam o conjunto normal de escopos padrão de operador quando o header está ausente
  - só perdem a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

## Corpo da solicitação

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Campos:

- `tool` (string, obrigatório): nome da ferramenta a invocar.
- `action` (string, opcional): mapeado para args se o schema da ferramenta oferecer suporte a `action` e o payload de args a tiver omitido.
- `args` (objeto, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitido ou `"main"`, o Gateway usa a chave da sessão principal configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo global).
- `dryRun` (booleano, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade de ferramentas é filtrada pela mesma cadeia de política usada por agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave da sessão mapear para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retornará **404**.

Observações importantes sobre limites:

- Aprovações de exec são barreiras de operador, não um limite separado de autorização para esse endpoint HTTP. Se uma ferramenta estiver acessível aqui por autenticação do Gateway + política de ferramentas, `/tools/invoke` não adiciona um prompt extra de aprovação por chamada.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (e idealmente usuários/hosts de SO separados).

O HTTP do Gateway também aplica por padrão uma lista rígida de negação (mesmo que a política da sessão permita a ferramenta):

- `exec` — execução direta de comando (superfície de RCE)
- `spawn` — criação arbitrária de processo filho (superfície de RCE)
- `shell` — execução de comando shell (superfície de RCE)
- `fs_write` — mutação arbitrária de arquivos no host
- `fs_delete` — exclusão arbitrária de arquivos no host
- `fs_move` — mover/renomear arquivos arbitrariamente no host
- `apply_patch` — aplicação de patch pode reescrever arquivos arbitrários
- `sessions_spawn` — plano de controle de orquestração de sessão; iniciar agentes remotamente é RCE
- `sessions_send` — injeção de mensagem entre sessões
- `cron` — plano de controle de automação persistente
- `gateway` — plano de controle do gateway; evita reconfiguração via HTTP
- `nodes` — relay de comando de node pode alcançar `system.run` em hosts pareados
- `whatsapp_login` — configuração interativa que exige leitura de QR no terminal; trava em HTTP

Você pode personalizar essa lista de negação por meio de `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Ferramentas adicionais para bloquear por HTTP /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista de negação padrão
      allow: ["gateway"],
    },
  },
}
```

Para ajudar políticas de grupo a resolver contexto, você pode opcionalmente definir:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existirem várias contas)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitação inválida ou erro de entrada da ferramenta)
- `401` → não autorizado
- `429` → autenticação com limite de taxa (`Retry-After` definido)
- `404` → ferramenta não disponível (não encontrada ou não permitida por allowlist)
- `405` → método não permitido
- `500` → `{ ok: false, error: { type, message } }` (erro inesperado na execução da ferramenta; mensagem sanitizada)

## Exemplo

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Ferramentas e plugins](/pt-BR/tools)
