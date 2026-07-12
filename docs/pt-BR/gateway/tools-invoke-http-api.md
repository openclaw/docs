---
read_when:
    - Chamando ferramentas sem executar um turno completo do agente
    - Criando automações que exigem a aplicação de políticas de ferramentas
summary: Invoque uma única ferramenta diretamente pelo endpoint HTTP do Gateway
title: Ferramentas invocam a API
x-i18n:
    generated_at: "2026-07-12T15:15:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

O Gateway do OpenClaw expõe um endpoint HTTP para invocar diretamente uma única ferramenta. Ele está sempre habilitado e usa a autenticação do Gateway junto com a política de ferramentas. Assim como na superfície compatível com a OpenAI `/v1/*`, a autenticação bearer com segredo compartilhado é tratada como acesso de operador confiável para todo o gateway.

- `POST /tools/invoke`
- Mesma porta do Gateway (multiplexação de WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`
- Tamanho máximo padrão do corpo da solicitação: 2 MB

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação com segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`): encaminhe pelo proxy configurado com reconhecimento de identidade e deixe que ele injete os cabeçalhos de identidade necessários
- autenticação aberta em entrada privada (`gateway.auth.mode="none"`): nenhum cabeçalho de autenticação é necessário

Observações:

- `mode="token"` usa `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` usa `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` exige que a solicitação HTTP venha de uma origem de proxy confiável configurada; proxies de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Chamadores internos no mesmo host que ignoram o proxy podem usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` como fallback local direto. Qualquer evidência de cabeçalho `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` mantém a solicitação no caminho do proxy confiável.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retornará `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso total de operador** para a instância do gateway.

- A autenticação bearer HTTP aqui não é um modelo de escopo restrito por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- Nos modos de autenticação com segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais de operador completo, mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- A autenticação com segredo compartilhado também trata as invocações diretas de ferramentas neste endpoint como turnos enviados pelo proprietário.
- Os modos HTTP confiáveis com identidade (autenticação por proxy confiável ou `gateway.auth.mode="none"` em uma entrada privada) respeitam `x-openclaw-scopes` quando presente e, caso contrário, usam como fallback o conjunto normal de escopos padrão do operador.
- Mantenha este endpoint apenas em loopback/tailnet/entrada privada; não o exponha diretamente à internet pública.

Matriz de autenticação:

| Modo de autenticação                                                                    | Comportamento                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` ou `password` + `Authorization: Bearer ...`                                     | Comprova a posse do segredo compartilhado de operador do gateway. Ignora um `x-openclaw-scopes` mais restrito. Restaura o conjunto completo de escopos padrão do operador: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Trata as invocações diretas de ferramentas como turnos enviados pelo proprietário. |
| HTTP confiável com identidade (autenticação por proxy confiável ou `mode="none"` em entrada privada) | Autentica uma identidade externa confiável ou um limite de implantação. Respeita `x-openclaw-scopes` quando presente. Usa como fallback o conjunto normal de escopos padrão do operador quando o cabeçalho está ausente. Só perde a semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`.                                                |

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

- `tool` / `name` (string, obrigatório): nome da ferramenta a invocar. `name` tem precedência se ambos forem enviados.
- `action` (string, opcional): mesclado em `args.action` se o esquema da ferramenta oferecer suporte a uma propriedade `action` e `args` ainda não tiver definido uma.
- `args` (objeto, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitida ou definida como `"main"`, o Gateway usa a chave da sessão principal configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo de sessão global).
- `agentId` (string, opcional): resolve a chave da sessão para esse agente. Retorna erro `400` se entrar em conflito com uma `sessionKey` explícita que já esteja mapeada para um agente diferente.
- `idempotencyKey` (string, opcional): usada para derivar um ID estável de chamada de ferramenta para a invocação.
- `dryRun` (booleano, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade das ferramentas é filtrada pela mesma cadeia de políticas usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave da sessão estiver mapeada para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retornará **404**.

Observações importantes sobre o limite:

- As aprovações de execução são proteções operacionais, não um limite de autorização separado para este endpoint HTTP. Se uma ferramenta estiver acessível aqui por meio da autenticação do Gateway + política de ferramentas, `/tools/invoke` não adicionará uma solicitação de aprovação extra por chamada.
- Se `exec` estiver acessível aqui, trate-o como uma superfície de shell com capacidade de modificação. Negar `write`, `edit`, `apply_patch` ou ferramentas HTTP de gravação no sistema de arquivos não torna a execução de shell somente leitura.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (idealmente com usuários/hosts distintos do sistema operacional).

O HTTP do Gateway também aplica uma lista rígida de negação por padrão (mesmo que a política da sessão permita a ferramenta):

| Ferramenta       | Motivo                                                               |
| ---------------- | -------------------------------------------------------------------- |
| `exec`           | Execução direta de comandos (superfície de RCE)                      |
| `spawn`          | Criação arbitrária de processos filhos (superfície de RCE)           |
| `shell`          | Execução de comandos de shell (superfície de RCE)                    |
| `fs_write`       | Modificação arbitrária de arquivos no host                           |
| `fs_delete`      | Exclusão arbitrária de arquivos no host                              |
| `fs_move`        | Movimentação/renomeação arbitrária de arquivos no host               |
| `apply_patch`    | A aplicação de patches pode reescrever arquivos arbitrários          |
| `sessions_spawn` | Orquestração de sessões; iniciar agentes remotamente constitui RCE   |
| `sessions_send`  | Injeção de mensagens entre sessões                                   |
| `cron`           | Plano de controle de automação persistente                           |
| `gateway`        | Plano de controle do Gateway; impede a reconfiguração via HTTP       |
| `nodes`          | O retransmissor de comandos do Node pode acessar `system.run` em hosts pareados |

`cron`, `gateway` e `nodes` também são exclusivos do proprietário: mesmo fora desta lista de negação padrão, chamadores que não sejam proprietários não podem invocá-los nesta superfície.

Personalize a lista geral de negação por meio de `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Ferramentas adicionais a bloquear via HTTP /tools/invoke
      deny: ["browser"],
      // Remova ferramentas da lista de negação padrão para chamadores proprietários/administradores
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` é uma substituição de exposição, não uma elevação de escopo. Nos modos HTTP com identidade, `cron`, `gateway` e `nodes` permanecem indisponíveis para chamadores sem identidade de proprietário/administrador (`operator.admin`), mesmo quando listados em `gateway.tools.allow`. A autenticação bearer com segredo compartilhado ainda segue a regra de operador totalmente confiável descrita acima.

Para ajudar as políticas de grupo a resolver o contexto, você pode definir opcionalmente:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existem várias contas)
- `x-openclaw-message-to: <target>` (destino de entrega para a política da ferramenta de mensagens)
- `x-openclaw-thread-id: <threadId>` (contexto da thread para a política da ferramenta de mensagens)

## Respostas

| Status | Significado                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| `200`  | `{ ok: true, result }`                                                                                       |
| `400`  | `{ ok: false, error: { type, message } }` (solicitação inválida ou erro na entrada da ferramenta)           |
| `401`  | Não autorizado                                                                                               |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }` (chamada da ferramenta bloqueada pela política) |
| `404`  | Ferramenta indisponível (não encontrada ou não incluída na lista de permissões)                              |
| `405`  | Método não permitido                                                                                         |
| `408`  | Tempo limite excedido ao ler o corpo da solicitação                                                          |
| `413`  | O corpo da solicitação excedeu o tamanho máximo da carga útil                                                |
| `429`  | Autenticação limitada por taxa (`Retry-After` definido)                                                      |
| `500`  | `{ ok: false, error: { type, message } }` (erro inesperado na execução da ferramenta; mensagem sanitizada)   |

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

## Relacionados

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Ferramentas e plugins](/pt-BR/tools)
