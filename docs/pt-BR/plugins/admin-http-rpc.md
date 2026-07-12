---
read_when:
    - Criação de ferramentas de host que não podem usar o cliente RPC WebSocket do Gateway
    - Expondo a automação administrativa do Gateway por meio de uma entrada privada e confiável
    - Auditoria do modelo de segurança para acesso HTTP aos métodos do Gateway
summary: Exponha métodos selecionados do plano de controle do Gateway por meio do plugin admin-http-rpc incluído e opcional
title: Plugin de RPC HTTP administrativo
x-i18n:
    generated_at: "2026-07-12T15:25:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

O plugin `admin-http-rpc` incluído expõe um conjunto permitido de métodos do plano de controle do Gateway por HTTP, para automação confiável no host que não consegue manter aberta uma conexão WebSocket com o Gateway.

Ele é fornecido com o OpenClaw, mas fica desativado por padrão; quando está desativado, a rota não é registrada. Quando ativado, adiciona `POST /api/v1/admin/rpc` no mesmo listener do Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Ative-o somente para ferramentas privadas do host, automação na tailnet ou um ingresso interno confiável. Nunca exponha essa rota diretamente à internet pública.

## Antes de ativá-lo

O RPC HTTP administrativo é uma superfície completa do plano de controle do operador: qualquer chamador que passe pela autenticação HTTP do Gateway pode invocar os métodos permitidos abaixo. Ative-o somente quando todas estas condições forem verdadeiras:

- O chamador é confiável para operar o Gateway.
- O chamador não consegue usar o cliente RPC WebSocket.
- A rota só pode ser acessada no loopback, em uma tailnet ou por um ingresso privado autenticado.
- Você analisou os métodos permitidos e eles correspondem à automação que pretende executar.

Para clientes do OpenClaw e ferramentas interativas que conseguem manter aberta uma conexão WebSocket com o Gateway, use RPC WebSocket.

## Ativar

Ative o plugin incluído:

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

A rota é registrada durante a inicialização do plugin; portanto, reinicie o Gateway após alterar a configuração do plugin.

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

Uma resposta bem-sucedida contém `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Quando o plugin está desativado, a rota retorna `404` porque não está registrada.

## Autenticação

A rota do plugin usa a autenticação HTTP do Gateway.

Caminhos comuns de autenticação:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`): `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`): encaminhe pelo proxy configurado com reconhecimento de identidade e permita que ele injete os cabeçalhos de identidade necessários
- autenticação aberta em ingresso privado (`gateway.auth.mode="none"`): nenhum cabeçalho de autenticação é necessário

## Modelo de segurança

Trate este plugin como uma superfície completa de operação do Gateway.

- Ativar o plugin oferece intencionalmente acesso aos métodos RPC administrativos permitidos em `/api/v1/admin/rpc`.
- O plugin declara o contrato reservado de manifesto `contracts.gatewayMethodDispatch: ["authenticated-request"]`, que permite à sua rota HTTP autenticada pelo Gateway despachar métodos do plano de controle dentro do processo. Isso não é um sandbox: o contrato impede o uso acidental de auxiliares reservados do SDK, mas plugins confiáveis ainda são executados no processo do Gateway.
- A autenticação bearer por segredo compartilhado (modos `token`/`password`) comprova a posse do segredo do operador do Gateway; cabeçalhos `x-openclaw-scopes` mais restritos são ignorados nesse caminho, e os padrões normais de operador completo são restaurados.
- A autenticação HTTP confiável com identidade (modo `trusted-proxy`) respeita `x-openclaw-scopes` quando presente.
- `gateway.auth.mode="none"` significa que essa rota não tem autenticação se o plugin estiver ativado. Use essa opção somente atrás de um ingresso privado no qual você confie plenamente.
- Depois que a autenticação da rota do plugin é aprovada, as solicitações são despachadas pelos mesmos manipuladores de métodos e verificações de escopo do Gateway usados pelo RPC WebSocket.
- A rota continua acessível durante uma concessão de suspensão preparada. A validação limitada de solicitações e a resposta de descoberta local de `commands.list` continuam disponíveis. Entre os métodos despachados para o Gateway, somente `gateway.suspend.prepare`, `gateway.suspend.status` e `gateway.suspend.resume` podem ser executados enquanto a admissão está fechada; os outros métodos permitidos retornam a resposta normal e repetível `UNAVAILABLE` do Gateway.
- Mantenha essa rota no loopback, na tailnet ou em um ingresso privado confiável. Não a exponha diretamente à internet pública. Use gateways separados quando os chamadores atravessarem limites de confiança.

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
- `method` (string, obrigatório): nome permitido do método do Gateway.
- `params` (qualquer tipo, opcional): parâmetros específicos do método.

O tamanho máximo padrão do corpo da solicitação é 1 MB.

## Resposta

Respostas bem-sucedidas usam o formato RPC do Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Erros de métodos do Gateway usam:

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

O status HTTP segue o código do erro:

| Código do erro             | Status HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| qualquer outro código      | 500         |

## Métodos permitidos

- descoberta: `commands.list`
  Retorna os nomes dos métodos RPC HTTP permitidos por este plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- configuração: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canais: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modelos: `models.list`, `models.authStatus`
- agentes: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- aprovações: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- dispositivos: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tarefas: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnósticos: `doctor.memory.status`, `update.status`

Outros métodos do Gateway ficam bloqueados até serem adicionados intencionalmente.

## Comparação com WebSocket

O caminho RPC WebSocket normal do Gateway continua sendo a API preferencial do plano de controle para clientes do OpenClaw. Use RPC HTTP administrativo somente para ferramentas do host que precisam de uma superfície HTTP de solicitação e resposta.

Clientes WebSocket com token compartilhado sem uma identidade de dispositivo confiável não podem declarar por conta própria escopos administrativos durante a conexão. O RPC HTTP administrativo segue deliberadamente o modelo existente de operador HTTP confiável: quando o plugin está ativado, a autenticação bearer por segredo compartilhado é tratada como acesso de operador completo nessa superfície administrativa.

## Solução de problemas

`404 Not Found`

: O plugin está desativado, o Gateway não foi reiniciado desde que ele foi ativado ou a solicitação está sendo enviada para outro processo do Gateway.

`401 Unauthorized`

: A solicitação não satisfez a autenticação HTTP do Gateway. Verifique o token bearer ou os cabeçalhos de identidade do proxy confiável.

`405 Method Not Allowed`

: A solicitação usou algo diferente de `POST`.

`413 Payload Too Large`

: O corpo da solicitação excedeu o limite de 1 MB.

`400 INVALID_REQUEST`

: O corpo da solicitação não é um JSON válido, o campo `method` está ausente, o método não está na lista de permissões do plugin ou um ID de retomada de suspensão não corresponde à concessão ativa.

`503 UNAVAILABLE`

: O método do Gateway está sendo iniciado, tem limitação de taxa, está suspenso ou aguarda uma operação concorrente de suspensão/retomada. Inspecione `error.details` quando presente e respeite `error.retryAfterMs` antes de tentar novamente.

## Relacionados

- [Escopos do operador](/pt-BR/gateway/operator-scopes)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Manifesto do plugin](/pt-BR/plugins/manifest#contracts-reference)
- [Subcaminhos do SDK](/pt-BR/plugins/sdk-subpaths)
