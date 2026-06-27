---
read_when:
    - Você está aprovando solicitações de pareamento de dispositivos
    - Você precisa alternar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (pareamento de dispositivos + rotação/revogação de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-06-27T17:18:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gerencie solicitações de pareamento de dispositivos e tokens com escopo por dispositivo.

## Comandos

### `openclaw devices list`

Liste solicitações de pareamento pendentes e dispositivos pareados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitações pendentes mostra o acesso solicitado ao lado do acesso
atualmente aprovado do dispositivo quando ele já está pareado. Isso torna
upgrades de escopo/função explícitos, em vez de parecer que o pareamento foi perdido.

### `openclaw devices remove <deviceId>`

Remova uma entrada de dispositivo pareado.

Quando você está autenticado com um token de dispositivo pareado, chamadores sem
admin podem remover apenas a entrada do **próprio** dispositivo. Remover outro
dispositivo exige `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Limpe dispositivos pareados em massa.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprove uma solicitação pendente de pareamento de dispositivo pelo `requestId` exato. Se `requestId`
for omitido ou `--latest` for passado, o OpenClaw apenas imprime a solicitação
pendente selecionada e encerra; execute novamente a aprovação com o ID exato da
solicitação depois de verificar os detalhes.

<Note>
Se um dispositivo tentar parear novamente com detalhes de autenticação alterados (função, escopos ou chave pública), o OpenClaw substitui a entrada pendente anterior e emite um novo `requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o ID atual.
</Note>

Se o dispositivo já estiver pareado e solicitar escopos mais amplos ou uma função
mais ampla, o OpenClaw mantém a aprovação existente e cria uma nova solicitação
pendente de upgrade. Revise as colunas `Requested` versus `Approved` em
`openclaw devices list` ou use `openclaw devices approve --latest` para pré-visualizar
o upgrade exato antes de aprová-lo.

Se o Gateway estiver configurado explicitamente com
`gateway.nodes.pairing.autoApproveCidrs`, solicitações iniciais `role: node` de
IPs de cliente correspondentes podem ser aprovadas antes de aparecerem nesta lista. Essa política
é desativada por padrão e nunca se aplica a clientes operador/navegador nem a solicitações
de upgrade.

Aprovar funções de dispositivo de nó ou outras funções não operadoras exige `operator.admin`.
`operator.pairing` é suficiente para aprovações de dispositivo operador apenas quando os
escopos de operador solicitados permanecem dentro dos escopos do próprio chamador. Consulte
[Escopos de operador](/pt-BR/gateway/operator-scopes) para as verificações no momento da aprovação.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Aprovação inicial do Paperclip / `openclaw_gateway`

Quando um novo agente Paperclip se conecta pelo adaptador `openclaw_gateway` pela primeira vez, o Gateway pode exigir uma aprovação única de pareamento de dispositivo antes que as execuções possam ter sucesso. Se o Paperclip relatar `openclaw_gateway_pairing_required`, aprove o dispositivo pendente e tente novamente.

Para gateways locais, pré-visualize a solicitação pendente mais recente:

```bash
openclaw devices approve --latest
```

A pré-visualização imprime o comando exato `openclaw devices approve <requestId>`. Verifique os detalhes da solicitação e então execute novamente esse comando com o ID da solicitação para aprová-la.

Para gateways remotos ou credenciais explícitas, passe as mesmas opções ao pré-visualizar e aprovar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar nova aprovação após reinicializações, mantenha uma chave de dispositivo persistente na configuração do adaptador Paperclip em vez de gerar uma nova identidade efêmera a cada execução:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Se a aprovação continuar falhando, execute `openclaw devices list` primeiro para confirmar que existe uma solicitação pendente.

### `openclaw devices reject <requestId>`

Rejeite uma solicitação pendente de pareamento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotacione um token de dispositivo para uma função específica (opcionalmente atualizando escopos).
A função de destino já deve existir no contrato de pareamento aprovado desse dispositivo;
a rotação não pode emitir uma nova função não aprovada.
Se você omitir `--scope`, reconexões posteriores com o token rotacionado armazenado reutilizam os
escopos aprovados em cache desse token. Se você passar valores explícitos de `--scope`, eles
se tornam o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores de dispositivo pareado sem admin podem rotacionar apenas o token do **próprio** dispositivo.
O conjunto de escopos do token de destino deve permanecer dentro dos escopos de operador
da própria sessão do chamador; a rotação não pode emitir nem preservar um token de operador
mais amplo do que o chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna metadados de rotação como JSON. Se o chamador estiver rotacionando o próprio token enquanto
estiver autenticado com esse token de dispositivo, a resposta também incluirá o token
substituto para que o cliente possa persistí-lo antes de reconectar. Rotações compartilhadas/admin
não ecoam o token bearer.

### `openclaw devices revoke --device <id> --role <role>`

Revogue um token de dispositivo para uma função específica.

Chamadores de dispositivo pareado sem admin podem revogar apenas o token do **próprio** dispositivo.
Revogar o token de outro dispositivo exige `operator.admin`.
O conjunto de escopos do token de destino também deve caber dentro dos escopos de operador
da própria sessão do chamador; chamadores apenas de pareamento não podem revogar tokens de operador admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Retorna o resultado da revogação como JSON.

## Opções comuns

- `--url <url>`: URL WebSocket do Gateway (usa `gateway.remote.url` por padrão quando configurado).
- `--token <token>`: token do Gateway (se necessário).
- `--password <password>`: senha do Gateway (autenticação por senha).
- `--timeout <ms>`: tempo limite de RPC.
- `--json`: saída JSON (recomendado para scripts).

<Warning>
Quando você define `--url`, a CLI não recorre a credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Warning>

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Estes comandos exigem o escopo `operator.pairing` (ou `operator.admin`). Algumas
  aprovações também exigem que o chamador tenha os escopos de operador que o dispositivo
  de destino emitiria ou herdaria. Funções de dispositivo não operadoras exigem
  `operator.admin`; consulte [Escopos de operador](/pt-BR/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` é uma política opcional do Gateway apenas para
  pareamento novo de dispositivo de nó; ela não altera a autoridade de aprovação da CLI.
- A rotação e a revogação de token permanecem dentro do conjunto de funções de pareamento aprovado e
  da linha de base de escopos aprovada para esse dispositivo. Uma entrada isolada de token em cache não
  concede um alvo de gerenciamento de token.
- Para sessões de token de dispositivo pareado, o gerenciamento entre dispositivos é somente admin:
  `remove`, `rotate` e `revoke` são apenas para o próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- A mutação de token também é contida pelo escopo do chamador: uma sessão apenas de pareamento não pode
  rotacionar nem revogar um token que atualmente carregue `operator.admin` ou
  `operator.write`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de pareamento estiver indisponível no local loopback (e nenhum `--url` explícito for passado), list/approve pode usar uma alternativa local de pareamento.
- `devices approve` exige um ID de solicitação explícito antes de emitir tokens; omitir `requestId` ou passar `--latest` apenas pré-visualiza a solicitação pendente mais recente.

## Lista de verificação de recuperação de desvio de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou `AUTH_SCOPE_MISMATCH`.

1. Confirme a origem atual do token do gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos pareados e identifique o id do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operador do dispositivo afetado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se a rotação não for suficiente, remova o pareamento obsoleto e aprove novamente:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Tente novamente a conexão do cliente com o token/senha compartilhado atual.

Observações:

- A precedência normal de autenticação na reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para uma única nova tentativa delimitada.
- `AUTH_SCOPE_MISMATCH` significa que o token de dispositivo foi reconhecido, mas não carrega o conjunto de escopos solicitado; corrija o contrato de pareamento/aprovação de escopo antes de alterar a autenticação compartilhada do gateway.

Relacionado:

- [Solução de problemas de autenticação do dashboard](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
