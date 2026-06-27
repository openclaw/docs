---
read_when:
    - Chamando ferramentas sem executar uma rodada completa do agente
    - Criando automações que precisam de aplicação de políticas de ferramentas
summary: Invoque uma única ferramenta diretamente pelo endpoint HTTP do Gateway
title: API de invocação de ferramentas
x-i18n:
    generated_at: "2026-06-27T17:34:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

O Gateway do OpenClaw expõe um endpoint HTTP simples para invocar uma única ferramenta diretamente. Ele está sempre habilitado e usa a autenticação do Gateway mais a política de ferramentas. Assim como a superfície compatível com OpenAI `/v1/*`, a autenticação bearer com segredo compartilhado é tratada como acesso confiável de operador para todo o gateway.

- `POST /tools/invoke`
- Mesma porta do Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo padrão do payload é 2 MB.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe-o injetar os
  cabeçalhos de identidade exigidos
- autenticação aberta em ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é necessário

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies de local loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Chamadores internos no mesmo host que ignoram o proxy podem usar
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` como fallback local direto.
  Qualquer evidência de cabeçalho `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`
  mantém a solicitação no caminho de trusted-proxy.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retorna `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação HTTP bearer aqui não é um modelo estreito de escopo por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador total mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais estreito.
- A autenticação por segredo compartilhado também trata invocações diretas de ferramenta neste endpoint como turnos de remetente proprietário.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em um ingresso privado) respeitam `x-openclaw-scopes` quando presente e, caso contrário, retornam ao conjunto normal de escopos padrão do operador.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova a posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais estreitos
  - restaura o conjunto completo de escopos padrão do operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata invocações diretas de ferramenta neste endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - retornam ao conjunto normal de escopos padrão do operador quando o cabeçalho está ausente
  - só perdem a semântica de proprietário quando o chamador estreita explicitamente os escopos e omite `operator.admin`

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
- `action` (string, opcional): mapeado para args se o esquema da ferramenta oferecer suporte a `action` e o payload de args o omitir.
- `args` (object, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitido ou `"main"`, o Gateway usa a chave de sessão principal configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Política + comportamento de roteamento

A disponibilidade de ferramentas é filtrada pela mesma cadeia de políticas usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave de sessão mapear para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retorna **404**.

Observações importantes de limite:

- Aprovações de exec são proteções de operador, não um limite de autorização separado para este endpoint HTTP. Se uma ferramenta estiver acessível aqui por autenticação do Gateway + política de ferramentas, `/tools/invoke` não adiciona um prompt extra de aprovação por chamada.
- Se `exec` estiver acessível aqui, trate-o como uma superfície mutável de shell. Negar `write`, `edit`, `apply_patch` ou ferramentas HTTP de escrita no sistema de arquivos não torna a execução de shell somente leitura.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (e idealmente usuários/hosts de SO separados).

O HTTP do Gateway também aplica uma lista de negação rígida por padrão (mesmo que a política de sessão permita a ferramenta):

- `exec` - execução direta de comandos (superfície de RCE)
- `spawn` - criação arbitrária de processo filho (superfície de RCE)
- `shell` - execução de comando de shell (superfície de RCE)
- `fs_write` - mutação arbitrária de arquivos no host
- `fs_delete` - exclusão arbitrária de arquivos no host
- `fs_move` - movimentação/renomeação arbitrária de arquivos no host
- `apply_patch` - aplicação de patch pode reescrever arquivos arbitrários
- `sessions_spawn` - orquestração de sessões; gerar agentes remotamente é RCE
- `sessions_send` - injeção de mensagens entre sessões
- `cron` - plano de controle de automação persistente
- `gateway` - plano de controle do gateway; impede reconfiguração via HTTP
- `nodes` - retransmissão de comandos de nó pode alcançar system.run em hosts pareados
- `whatsapp_login` - configuração interativa que exige leitura de QR no terminal; trava em HTTP

Você pode personalizar esta lista de negação via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` é uma substituição de exposição, não uma elevação de escopo. Em
modos HTTP com identidade, `cron`, `gateway` e `nodes` permanecem indisponíveis
para chamadores que não têm identidade de proprietário/admin (`operator.admin`), mesmo quando
estão listados em `gateway.tools.allow`. A autenticação bearer por segredo compartilhado ainda segue
a regra de operador confiável total acima.

Para ajudar políticas de grupo a resolver contexto, você pode definir opcionalmente:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existem várias contas)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitação inválida ou erro de entrada da ferramenta)
- `401` → não autorizado
- `429` → autenticação limitada por taxa (`Retry-After` definido)
- `404` → ferramenta indisponível (não encontrada ou não incluída na allowlist)
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
