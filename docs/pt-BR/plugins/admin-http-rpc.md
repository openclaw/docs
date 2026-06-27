---
read_when:
    - Criando ferramentas de host que não podem usar o cliente RPC WebSocket do Gateway
    - Expondo a automação administrativa do Gateway por trás de uma entrada privada confiável
    - Auditando o modelo de segurança para acesso HTTP aos métodos do Gateway
summary: Expor métodos selecionados do plano de controle do Gateway por meio do plugin admin-http-rpc incluído e opcional
title: Plugin de RPC HTTP de administração
x-i18n:
    generated_at: "2026-06-27T17:44:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

O Plugin integrado `admin-http-rpc` expõe métodos selecionados do plano de controle do Gateway via HTTP para automação de host confiável que não pode usar o cliente RPC WebSocket normal do Gateway.

O Plugin está incluído no OpenClaw, mas fica desativado por padrão. Quando desativado, a rota não é registrada. Quando ativado, ele adiciona:

- `POST /api/v1/admin/rpc`
- o mesmo listener que o Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Ative-o apenas para ferramentas privadas de host, automação de tailnet ou um ingresso interno confiável. Não exponha esta rota diretamente à internet pública.

## Antes de ativá-lo

O RPC HTTP administrativo é uma superfície completa do plano de controle do operador. Qualquer chamador que passe pela autenticação HTTP do Gateway pode invocar os métodos permitidos nesta página.

Use-o quando todas estas condições forem verdadeiras:

- O chamador é confiável para operar o Gateway.
- O chamador não pode usar o cliente RPC WebSocket.
- A rota só é acessível em loopback, uma tailnet ou um ingresso privado autenticado.
- Você revisou os métodos permitidos e eles correspondem à automação que pretende executar.

Use o caminho RPC WebSocket para clientes OpenClaw e ferramentas interativas que podem manter uma conexão WebSocket do Gateway aberta.

## Ativar

Ative o Plugin integrado:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Configuração">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

A rota é registrada durante a inicialização do Plugin. Reinicie o Gateway depois de alterar a configuração do Plugin.

Desative-o quando não precisar mais da superfície HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verificar a rota

Use `health` como a menor solicitação segura:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Uma resposta bem-sucedida tem `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Quando o Plugin está desativado, a rota retorna `404` porque não está registrada.

## Autenticação

A rota do Plugin usa autenticação HTTP do Gateway.

Caminhos comuns de autenticação:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`): encaminhe pela proxy configurada com reconhecimento de identidade e deixe-a injetar os cabeçalhos de identidade necessários
- autenticação aberta de ingresso privado (`gateway.auth.mode="none"`): nenhum cabeçalho de autenticação é necessário

## Modelo de segurança

Trate este Plugin como uma superfície completa de operador do Gateway.

- Ativar o Plugin oferece intencionalmente acesso aos métodos RPC administrativos permitidos em `/api/v1/admin/rpc`.
- O Plugin declara o contrato de manifesto reservado `contracts.gatewayMethodDispatch: ["authenticated-request"]` para que sua rota HTTP autenticada pelo Gateway possa despachar métodos do plano de controle no processo.
- A autenticação bearer por segredo compartilhado comprova a posse do segredo de operador do gateway.
- Para autenticação `token` e `password`, cabeçalhos `x-openclaw-scopes` mais restritos são ignorados, e os padrões normais de operador completo são restaurados.
- Modos HTTP confiáveis com identidade respeitam `x-openclaw-scopes` quando presentes.
- `gateway.auth.mode="none"` significa que esta rota não é autenticada se o Plugin estiver ativado. Use isso apenas por trás de um ingresso privado em que você confie totalmente.
- As solicitações são despachadas pelos mesmos manipuladores de métodos do Gateway e verificações de escopo que o RPC WebSocket depois que a autenticação da rota do Plugin passa.
- Mantenha esta rota em loopback, tailnet ou um ingresso privado confiável. Não a exponha diretamente à internet pública.
- Contratos de manifesto de Plugin não são uma sandbox. Eles impedem o uso acidental de auxiliares reservados do SDK; Plugins confiáveis ainda são executados no processo do Gateway.

Use gateways separados quando os chamadores cruzarem limites de confiança.

## Solicitação

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Campos:

- `id` (string, opcional): copiado para a resposta. Um UUID é gerado quando omitido.
- `method` (string, obrigatório): nome de método do Gateway permitido.
- `params` (any, opcional): parâmetros específicos do método.

O tamanho máximo padrão do corpo da solicitação é 1 MB.

## Resposta

Respostas de sucesso usam o formato RPC do Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Erros de método do Gateway usam:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

O status HTTP segue o erro do Gateway quando possível. Por exemplo, `INVALID_REQUEST` retorna `400`, e `UNAVAILABLE` retorna `503`.

## Métodos permitidos

- descoberta: `commands.list`
  Retorna os nomes de métodos RPC HTTP permitidos por este Plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- configuração: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canais: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modelos: `models.list`, `models.authStatus`
- agentes: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- aprovações: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- dispositivos: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nós: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tarefas: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnósticos: `doctor.memory.status`, `update.status`

Outros métodos do Gateway são bloqueados até serem adicionados intencionalmente.

## Comparação com WebSocket

O caminho RPC WebSocket normal do Gateway continua sendo a API preferida do plano de controle para clientes OpenClaw. Use o RPC HTTP administrativo apenas para ferramentas de host que precisam de uma superfície HTTP de solicitação/resposta.

Clientes WebSocket com token compartilhado sem uma identidade de dispositivo confiável não podem autodeclarar escopos administrativos durante a conexão. O RPC HTTP administrativo segue deliberadamente o modelo de operador HTTP confiável existente: quando o Plugin está ativado, a autenticação bearer por segredo compartilhado é tratada como acesso de operador completo para esta superfície administrativa.

## Solução de problemas

`404 Not Found`

: O Plugin está desativado, o Gateway não foi reiniciado desde que ele foi ativado, ou a solicitação está indo para um processo diferente do Gateway.

`401 Unauthorized`

: A solicitação não satisfez a autenticação HTTP do Gateway. Verifique o token bearer ou os cabeçalhos de identidade do trusted-proxy.

`400 INVALID_REQUEST`

: O corpo da solicitação não é JSON válido, o campo `method` está ausente, ou o método não está na lista de permissões do Plugin.

`503 UNAVAILABLE`

: O manipulador de método do Gateway está indisponível. Verifique os logs do Gateway e tente novamente depois que o Gateway terminar a inicialização.

## Relacionados

- [Escopos de operador](/pt-BR/gateway/operator-scopes)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Manifesto do Plugin](/pt-BR/plugins/manifest#contracts)
- [Subcaminhos do SDK](/pt-BR/plugins/sdk-subpaths)
