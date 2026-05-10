---
read_when:
    - Chamando ferramentas sem executar um turno completo do agente
    - Criando automações que precisam de aplicação de políticas de ferramentas
summary: Invoque uma única ferramenta diretamente por meio do endpoint HTTP do Gateway
title: API de invocação de ferramentas
x-i18n:
    generated_at: "2026-05-10T19:36:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

O Gateway do OpenClaw expõe um endpoint HTTP simples para invocar uma única ferramenta diretamente. Ele está sempre habilitado e usa autenticação do Gateway mais política de ferramentas. Como a superfície compatível com OpenAI `/v1/*`, a autenticação bearer por segredo compartilhado é tratada como acesso de operador confiável para todo o gateway.

- `POST /tools/invoke`
- Mesma porta que o Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo padrão do payload é 2 MB.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  roteie pelo proxy configurado com reconhecimento de identidade e deixe que ele injete os
  cabeçalhos de identidade necessários
- autenticação aberta em ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação necessário

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem de proxy confiável configurada; proxies loopback no mesmo host exigem
  `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação bearer HTTP aqui não é um modelo estreito de escopo por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- Para modos de autenticação por segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais estreito.
- A autenticação por segredo compartilhado também trata invocações diretas de ferramenta neste endpoint como turnos de remetente-proprietário.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável ou `gateway.auth.mode="none"` em um ingresso privado) respeitam `x-openclaw-scopes` quando presente e, caso contrário, recorrem ao conjunto normal de escopos padrão de operador.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais estreito
  - restaura o conjunto completo de escopos padrão de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata invocações diretas de ferramenta neste endpoint como turnos de remetente-proprietário
- modos HTTP confiáveis com identidade (por exemplo, autenticação por proxy confiável, ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade confiável externa ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - recorrem ao conjunto normal de escopos padrão de operador quando o cabeçalho está ausente
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
- `action` (string, opcional): mapeado para args se o schema da ferramenta oferecer suporte a `action` e o payload de args o tiver omitido.
- `args` (object, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitida ou `"main"`, o Gateway usa a chave de sessão principal configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade de ferramentas é filtrada pela mesma cadeia de políticas usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave de sessão mapear para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retornará **404**.

Observações importantes de limite:

- Aprovações de exec são proteções de operador, não um limite de autorização separado para este endpoint HTTP. Se uma ferramenta estiver acessível aqui via autenticação do Gateway + política de ferramentas, `/tools/invoke` não adiciona um prompt extra de aprovação por chamada.
- Se `exec` estiver acessível aqui, trate-o como uma superfície mutável de shell. Negar `write`, `edit`, `apply_patch` ou ferramentas HTTP de escrita no sistema de arquivos não torna a execução de shell somente leitura.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (e, idealmente, usuários/hosts de SO separados).

O HTTP do Gateway também aplica uma lista rígida de negação por padrão (mesmo que a política de sessão permita a ferramenta):

- `exec` - execução direta de comando (superfície de RCE)
- `spawn` - criação arbitrária de processo filho (superfície de RCE)
- `shell` - execução de comando de shell (superfície de RCE)
- `fs_write` - mutação arbitrária de arquivo no host
- `fs_delete` - exclusão arbitrária de arquivo no host
- `fs_move` - mover/renomear arquivo arbitrariamente no host
- `apply_patch` - a aplicação de patch pode reescrever arquivos arbitrários
- `sessions_spawn` - orquestração de sessões; gerar agentes remotamente é RCE
- `sessions_send` - injeção de mensagens entre sessões
- `cron` - plano de controle de automação persistente
- `gateway` - plano de controle do gateway; impede reconfiguração via HTTP
- `nodes` - o retransmissor de comandos de nó pode alcançar system.run em hosts pareados
- `whatsapp_login` - configuração interativa que exige leitura de QR no terminal; trava em HTTP

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

Para ajudar políticas de grupo a resolver contexto, você pode opcionalmente definir:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existem várias contas)

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
