---
read_when:
    - Você está aprovando solicitações de pareamento de dispositivos
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (pareamento de dispositivo + rotação/revogação de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-05-03T05:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gerencie solicitações de emparelhamento de dispositivos e tokens com escopo por dispositivo.

## Comandos

### `openclaw devices list`

Liste solicitações de emparelhamento pendentes e dispositivos emparelhados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitação pendente mostra o acesso solicitado ao lado do acesso
atual aprovado do dispositivo quando o dispositivo já está emparelhado. Isso
torna upgrades de escopo/função explícitos, em vez de parecer que o
emparelhamento foi perdido.

### `openclaw devices remove <deviceId>`

Remova uma entrada de dispositivo emparelhado.

Quando você está autenticado com um token de dispositivo emparelhado, chamadores
não administradores podem remover apenas a entrada do **próprio** dispositivo.
Remover outro dispositivo exige `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Limpe dispositivos emparelhados em massa.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprove uma solicitação pendente de emparelhamento de dispositivo pelo `requestId`
exato. Se `requestId` for omitido ou `--latest` for passado, o OpenClaw apenas
imprime a solicitação pendente selecionada e sai; execute a aprovação novamente
com o ID exato da solicitação depois de verificar os detalhes.

<Note>
Se um dispositivo tentar o emparelhamento novamente com detalhes de autenticação alterados (função, escopos ou chave pública), o OpenClaw substitui a entrada pendente anterior e emite um novo `requestId`. Execute `openclaw devices list` logo antes da aprovação para usar o ID atual.
</Note>

Se o dispositivo já estiver emparelhado e solicitar escopos mais amplos ou uma
função mais ampla, o OpenClaw mantém a aprovação existente e cria uma nova
solicitação pendente de upgrade. Revise as colunas `Requested` versus `Approved`
em `openclaw devices list` ou use `openclaw devices approve --latest` para
pré-visualizar o upgrade exato antes de aprová-lo.

Se o Gateway estiver explicitamente configurado com
`gateway.nodes.pairing.autoApproveCidrs`, solicitações de primeira vez com
`role: node` vindas de IPs de cliente correspondentes podem ser aprovadas antes
de aparecerem nesta lista. Essa política é desabilitada por padrão e nunca se
aplica a clientes operador/navegador nem a solicitações de upgrade.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeite uma solicitação pendente de emparelhamento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotacione um token de dispositivo para uma função específica (opcionalmente
atualizando escopos). A função de destino já deve existir no contrato de
emparelhamento aprovado desse dispositivo; a rotação não pode emitir uma nova
função não aprovada. Se você omitir `--scope`, reconexões posteriores com o
token rotacionado armazenado reutilizam os escopos aprovados em cache desse
token. Se você passar valores explícitos de `--scope`, eles se tornam o conjunto
de escopos armazenado para futuras reconexões com token em cache. Chamadores de
dispositivos emparelhados não administradores podem rotacionar apenas o token do
**próprio** dispositivo. O conjunto de escopos do token de destino deve
permanecer dentro dos escopos de operador da própria sessão do chamador; a
rotação não pode emitir nem preservar um token de operador mais amplo do que o
chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna metadados de rotação como JSON. Se o chamador estiver rotacionando o
próprio token enquanto autenticado com esse token de dispositivo, a resposta
também inclui o token de substituição para que o cliente possa persistí-lo antes
de reconectar. Rotações compartilhadas/de administrador não ecoam o token bearer.

### `openclaw devices revoke --device <id> --role <role>`

Revogue um token de dispositivo para uma função específica.

Chamadores de dispositivos emparelhados não administradores podem revogar apenas
o token do **próprio** dispositivo. Revogar o token de outro dispositivo exige
`operator.admin`. O conjunto de escopos do token de destino também deve caber
dentro dos escopos de operador da própria sessão do chamador; chamadores apenas
com emparelhamento não podem revogar tokens de operador de administrador/gravação.

```
openclaw devices revoke --device <deviceId> --role node
```

Retorna o resultado da revogação como JSON.

## Opções comuns

- `--url <url>`: URL WebSocket do Gateway (usa `gateway.remote.url` por padrão quando configurado).
- `--token <token>`: token do Gateway (se exigido).
- `--password <password>`: senha do Gateway (autenticação por senha).
- `--timeout <ms>`: tempo limite de RPC.
- `--json`: saída JSON (recomendado para scripts).

<Warning>
Quando você define `--url`, a CLI não recorre a credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Warning>

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Estes comandos exigem o escopo `operator.pairing` (ou `operator.admin`). Algumas
  aprovações também exigem que o chamador possua os escopos de operador que o
  dispositivo de destino emitiria ou herdaria; consulte [Escopos de operador](/pt-BR/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` é uma política opt-in do Gateway
  apenas para emparelhamento de dispositivo Node novo; ela não altera a autoridade
  de aprovação da CLI.
- A rotação e a revogação de tokens permanecem dentro do conjunto de funções de
  emparelhamento aprovado e da linha de base de escopos aprovada para esse
  dispositivo. Uma entrada perdida de token em cache não concede um destino de
  gerenciamento de token.
- Para sessões de token de dispositivo emparelhado, o gerenciamento entre
  dispositivos é exclusivo de administradores: `remove`, `rotate` e `revoke` são
  apenas para o próprio dispositivo, a menos que o chamador tenha `operator.admin`.
- A mutação de token também fica contida no escopo do chamador: uma sessão apenas
  com emparelhamento não pode rotacionar nem revogar um token que atualmente
  carrega `operator.admin` ou `operator.write`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de emparelhamento estiver indisponível em local loopback (e nenhum `--url` explícito for passado), list/approve pode usar um fallback local de emparelhamento.
- `devices approve` exige um ID de solicitação explícito antes de emitir tokens; omitir `requestId` ou passar `--latest` apenas pré-visualiza a solicitação pendente mais recente.

## Lista de verificação de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a fonte atual do token do Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos emparelhados e identifique o id do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operador para o dispositivo afetado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se a rotação não for suficiente, remova o emparelhamento obsoleto e aprove novamente:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Tente novamente a conexão do cliente com o token/senha compartilhado atual.

Observações:

- A precedência normal de autenticação na reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para a única nova tentativa delimitada.

Relacionado:

- [Solução de problemas de autenticação do Dashboard](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
