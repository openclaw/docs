---
read_when:
    - Chamar ferramentas sem executar uma rodada completa do agente
    - Criando automações que precisam de aplicação de políticas de ferramentas
summary: Invoque uma única ferramenta diretamente pelo endpoint HTTP do Gateway
title: API de invocação de ferramentas
x-i18n:
    generated_at: "2026-04-30T09:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Invocação de ferramentas (HTTP)

O Gateway do OpenClaw expõe um endpoint HTTP simples para invocar uma única ferramenta diretamente. Ele fica sempre habilitado e usa a autenticação do Gateway junto com a política de ferramentas. Assim como a superfície `/v1/*` compatível com OpenAI, a autenticação bearer por segredo compartilhado é tratada como acesso confiável de operador para todo o gateway.

- `POST /tools/invoke`
- Mesma porta que o Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo padrão do payload é 2 MB.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe que ele injete os
  cabeçalhos de identidade necessários
- autenticação aberta por ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é necessário

Notas:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies de loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação bearer HTTP aqui não é um modelo estreito de escopo por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- A autenticação por segredo compartilhado também trata invocações diretas de ferramentas neste endpoint como turnos de remetente proprietário.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação de proxy confiável ou `gateway.auth.mode="none"` em um ingresso privado) respeitam `x-openclaw-scopes` quando presente e, caso contrário, recorrem ao conjunto normal de escopos padrão de operador.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova a posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restrito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata invocações diretas de ferramentas neste endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação de proxy confiável, ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - recorrem ao conjunto normal de escopos padrão de operador quando o cabeçalho está ausente
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
- `action` (string, opcional): mapeado para args se o esquema da ferramenta der suporte a `action` e o payload de args o tiver omitido.
- `args` (object, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitido ou `"main"`, o Gateway usa a chave de sessão principal configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Política + comportamento de roteamento

A disponibilidade de ferramentas é filtrada pela mesma cadeia de políticas usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave da sessão mapear para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retornará **404**.

Notas importantes de limite:

- Aprovações de exec são guardrails de operador, não um limite de autorização separado para este endpoint HTTP. Se uma ferramenta estiver acessível aqui via autenticação do Gateway + política de ferramentas, `/tools/invoke` não adicionará um prompt de aprovação extra por chamada.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (e, idealmente, usuários/hosts de SO separados).

O HTTP do Gateway também aplica uma lista rígida de negação por padrão (mesmo que a política da sessão permita a ferramenta):

- `exec` — execução direta de comandos (superfície de RCE)
- `spawn` — criação arbitrária de processos filhos (superfície de RCE)
- `shell` — execução de comandos de shell (superfície de RCE)
- `fs_write` — mutação arbitrária de arquivos no host
- `fs_delete` — exclusão arbitrária de arquivos no host
- `fs_move` — movimentação/renomeação arbitrária de arquivos no host
- `apply_patch` — aplicação de patch pode reescrever arquivos arbitrários
- `sessions_spawn` — orquestração de sessões; gerar agentes remotamente é RCE
- `sessions_send` — injeção de mensagens entre sessões
- `cron` — plano de controle de automação persistente
- `gateway` — plano de controle do gateway; impede reconfiguração via HTTP
- `nodes` — retransmissão de comandos de node pode alcançar system.run em hosts pareados
- `whatsapp_login` — configuração interativa que exige leitura de QR no terminal; trava em HTTP

Você pode personalizar esta lista de negação via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Para ajudar políticas de grupo a resolver contexto, você pode definir opcionalmente:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existirem várias contas)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitação inválida ou erro de entrada da ferramenta)
- `401` → não autorizado
- `429` → autenticação limitada por taxa (`Retry-After` definido)
- `404` → ferramenta não disponível (não encontrada ou não incluída na lista de permissões)
- `405` → método não permitido
- `500` → `{ ok: false, error: { type, message } }` (erro inesperado de execução da ferramenta; mensagem sanitizada)

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
