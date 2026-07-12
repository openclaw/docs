---
read_when:
    - Você está aprovando solicitações de pareamento de dispositivos
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (pareamento de dispositivos + rotação/revogação de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-07-11T23:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gerencie solicitações de pareamento de dispositivos e tokens com escopo de dispositivo.

## Opções comuns

- `--url <url>`: URL do WebSocket do Gateway (usa `gateway.remote.url` por padrão quando configurado)
- `--token <token>`: token do Gateway (se necessário)
- `--password <password>`: senha do Gateway (autenticação por senha)
- `--timeout <ms>`: tempo limite da RPC
- `--json`: saída JSON (recomendado para scripts)

<Warning>
Quando você define `--url`, a CLI não recorre às credenciais da configuração nem do ambiente. Passe `--token` ou `--password` explicitamente; caso contrário, o comando falhará.
</Warning>

## Comandos

### `openclaw devices list`

Liste as solicitações de pareamento pendentes e os dispositivos pareados.

```bash
openclaw devices list
openclaw devices list --json
```

Para uma solicitação pendente em um dispositivo já pareado, a saída mostra o acesso solicitado ao lado do acesso atualmente aprovado para o dispositivo, para que ampliações de escopo ou função fiquem visíveis em vez de parecerem um pareamento perdido.

Os nomes de exibição dos dispositivos pareados usam esta ordem de precedência: rótulo do operador (`operatorLabel` de `devices rename`), depois `displayName` do cliente, depois `clientId` e, por fim, `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Aprove uma solicitação de pareamento pendente pelo `requestId` exato. Omitir `requestId` ou passar `--latest` apenas exibe uma prévia da solicitação pendente mais recente e encerra (código 1); execute novamente com o ID exato da solicitação para aprová-la.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Se um dispositivo tentar novamente o pareamento com detalhes de autenticação alterados (função, escopos ou chave pública), o OpenClaw substituirá a entrada pendente anterior por uma nova com outro `requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para obter o ID atual.
</Note>

Comportamento da aprovação:

- Se o dispositivo já estiver pareado e solicitar escopos mais amplos ou outra função, o OpenClaw manterá a aprovação existente e criará uma nova solicitação de ampliação pendente. Compare `Requested` com `Approved` em `openclaw devices list` ou visualize uma prévia com `--latest` antes de aprovar.
- Aprovar uma função `node` ou outra função que não seja de operador exige `operator.admin`. `operator.pairing` é suficiente para aprovações de dispositivos de operador, mas somente quando os escopos de operador solicitados permanecem dentro dos escopos do próprio chamador. Consulte [Escopos do operador](/pt-BR/gateway/operator-scopes).
- Se `gateway.nodes.pairing.autoApproveCidrs` estiver configurado, solicitações iniciais com `role: node` provenientes de IPs de cliente correspondentes poderão ser aprovadas automaticamente antes de aparecerem nesta lista. Esse recurso é desativado por padrão e nunca se aplica a clientes operadores/navegadores nem a solicitações de ampliação.
- `gateway.nodes.pairing.sshVerify` (ativado por padrão) aprova automaticamente solicitações iniciais com `role: node` quando o Gateway verifica a chave do dispositivo por SSH no host do Node. Portanto, as solicitações podem aparecer como aprovadas logo após serem exibidas. Defina `sshVerify: false` para desativar a verificação por SSH; isso é independente de `autoApproveCidrs`, portanto desative essa opção também para exigir pareamento exclusivamente manual.

### `openclaw devices reject <requestId>`

Rejeite uma solicitação pendente de pareamento de dispositivo.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Remova uma entrada de dispositivo pareado.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Um chamador autenticado com um token de dispositivo pareado pode remover apenas a entrada de seu **próprio** dispositivo. A remoção de outro dispositivo exige `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Atribua um rótulo de operador a um dispositivo pareado. Os rótulos são um estado mantido pelo proprietário: eles persistem após reparos de pareamento e novas aprovações de função e não alteram o `deviceId` estável.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` é obrigatório, tem espaços nas extremidades removidos, não pode estar vazio e é limitado a 64 caracteres.
- As superfícies de exibição (lista da CLI e inventário da interface de controle) priorizam o rótulo do operador em relação ao nome de exibição informado pelo cliente.
- Um chamador de dispositivo pareado sem privilégios administrativos pode renomear apenas seu **próprio** dispositivo. Renomear outro dispositivo exige `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Remova dispositivos pareados em massa. Exige `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` também rejeita todas as solicitações de pareamento pendentes.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Alterne o token de um dispositivo para uma função, atualizando opcionalmente seus escopos.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- A função de destino já deve existir no contrato de pareamento aprovado desse dispositivo; a alternância não pode emitir uma nova função não aprovada.
- Omitir `--scope` reutiliza os escopos aprovados armazenados em cache para o token nas reconexões posteriores. Passar valores `--scope` explícitos substitui o conjunto de escopos armazenado para futuras reconexões com token em cache.
- Um chamador de dispositivo pareado sem privilégios administrativos pode alternar apenas o token de seu **próprio** dispositivo, e o conjunto de escopos de destino deve permanecer dentro dos escopos de operador do próprio chamador; a alternância não pode emitir nem preservar um token mais amplo do que aquele que o chamador já possui.

Retorna os metadados da alternância como JSON. Se o chamador alternar seu próprio token enquanto estiver autenticado com esse token de dispositivo, a resposta incluirá o token substituto para que o cliente possa armazená-lo antes da reconexão. Alternâncias compartilhadas/administrativas nunca retornam o token de portador.

### `openclaw devices revoke --device <id> --role <role>`

Revogue o token de um dispositivo para uma função.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Um chamador de dispositivo pareado sem privilégios administrativos pode revogar apenas o token de seu **próprio** dispositivo. Revogar o token de outro dispositivo exige `operator.admin`. O conjunto de escopos de destino também deve estar contido nos escopos de operador do próprio chamador; chamadores com apenas permissão de pareamento não podem revogar tokens de operador com privilégios administrativos/de gravação.

## Observações

- Estes comandos exigem o escopo `operator.pairing` (ou `operator.admin`). Funções de dispositivo que não sejam de operador sempre exigem `operator.admin`; consulte [Escopos do operador](/pt-BR/gateway/operator-scopes).
- A alternância e a revogação de tokens permanecem dentro do conjunto de funções de pareamento aprovado do dispositivo e de sua linha de base de escopos. Uma entrada isolada de token em cache não concede um destino para gerenciamento de tokens.
- Em sessões com token de dispositivo pareado, o gerenciamento entre dispositivos (`remove`, `rename`, `rotate`, `revoke`) é restrito ao próprio dispositivo, a menos que o chamador tenha `operator.admin`.
- A alternância de token retorna um novo token (sensível) — trate-o como um segredo.
- Se o escopo de pareamento não estiver disponível no local loopback e nenhum `--url` explícito for passado, `list`/`approve` poderão recorrer ao estado de pareamento local.

## Lista de verificação para recuperação de divergência de tokens

Use esta lista quando a interface de controle ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou `AUTH_SCOPE_MISMATCH`.

1. Confirme a origem atual do token do Gateway:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Liste os dispositivos pareados e identifique o ID do dispositivo afetado:

   ```bash
   openclaw devices list
   ```

3. Alterne o token de operador do dispositivo afetado:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Se a alternância não for suficiente, remova o pareamento obsoleto e aprove novamente:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Tente novamente a conexão do cliente com o token/senha compartilhado atual.

Observações:

- Precedência normal de autenticação na reconexão: primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de inicialização.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente o token compartilhado e o token de dispositivo armazenado juntos em uma única nova tentativa limitada.
- `AUTH_SCOPE_MISMATCH` significa que o token do dispositivo foi reconhecido, mas não contém o conjunto de escopos solicitado; corrija o contrato de aprovação de pareamento/escopos antes de alterar a autenticação compartilhada do Gateway.

Relacionado:

- [Solução de problemas de autenticação do painel](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Aprovação na primeira execução do Paperclip / `openclaw_gateway`

Os agentes do Paperclip que se conectam pelo adaptador `openclaw_gateway` passam pela mesma aprovação de pareamento de dispositivo na primeira execução que qualquer outro cliente novo. Se o Paperclip informar `openclaw_gateway_pairing_required`, aprove o dispositivo pendente e tente novamente.

```bash
openclaw devices approve --latest
```

A prévia mostra o comando `openclaw devices approve <requestId>` exato; verifique os detalhes e execute novamente esse comando com o ID da solicitação para aprová-la. Para um Gateway remoto ou credenciais explícitas, passe as mesmas opções ao visualizar a prévia e aprovar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar novas aprovações após cada reinicialização, configure um `adapterConfig.devicePrivateKeyPem` persistente no Paperclip em vez de permitir que ele gere uma nova identidade efêmera de dispositivo a cada execução:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Se a aprovação continuar falhando, execute primeiro `openclaw devices list` para confirmar que existe uma solicitação pendente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
