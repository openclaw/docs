---
read_when:
    - Você está aprovando solicitações de pareamento de dispositivo
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (pareamento de dispositivo + rotação/revogação de token)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-24T05:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerencie solicitações de pareamento de dispositivo e tokens com escopo de dispositivo.

## Comandos

### `openclaw devices list`

Lista solicitações de pareamento pendentes e dispositivos pareados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitações pendentes mostra o acesso solicitado ao lado do acesso
aprovado atual do dispositivo quando o dispositivo já está pareado. Isso torna
upgrades de escopo/papel explícitos em vez de parecer que o pareamento foi perdido.

### `openclaw devices remove <deviceId>`

Remove uma entrada de dispositivo pareado.

Quando você está autenticado com um token de dispositivo pareado, chamadores não administradores
podem remover apenas a entrada do dispositivo **deles mesmos**. Remover outro dispositivo requer
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Limpa dispositivos pareados em lote.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprova uma solicitação pendente de pareamento de dispositivo pelo `requestId` exato. Se `requestId`
for omitido ou `--latest` for passado, o OpenClaw apenas imprime a solicitação pendente
selecionada e sai; execute a aprovação novamente com o ID exato da solicitação após verificar
os detalhes.

Observação: se um dispositivo tentar novamente o pareamento com detalhes de autenticação alterados (papel/escopos/chave pública),
o OpenClaw substitui a entrada pendente anterior e emite um novo
`requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o
ID atual.

Se o dispositivo já estiver pareado e pedir escopos mais amplos ou um papel mais amplo,
o OpenClaw mantém a aprovação existente e cria uma nova solicitação pendente de
upgrade. Revise as colunas `Requested` vs `Approved` em `openclaw devices list`
ou use `openclaw devices approve --latest` para visualizar o upgrade exato antes
de aprová-lo.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeita uma solicitação pendente de pareamento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotaciona um token de dispositivo para um papel específico (opcionalmente atualizando os escopos).
O papel de destino já deve existir no contrato de pareamento aprovado desse dispositivo;
a rotação não pode emitir um novo papel não aprovado.
Se você omitir `--scope`, reconexões posteriores com o token rotacionado armazenado reutilizarão
os escopos aprovados em cache desse token. Se você passar valores explícitos de `--scope`, eles
se tornarão o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores não administradores com dispositivo pareado podem rotacionar apenas o token do dispositivo
**deles mesmos**.
Além disso, quaisquer valores explícitos de `--scope` devem permanecer dentro dos
escopos de operator da própria sessão do chamador; a rotação não pode emitir um token de operator
mais amplo do que o chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna a carga do novo token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoga um token de dispositivo para um papel específico.

Chamadores não administradores com dispositivo pareado podem revogar apenas o token do dispositivo
**deles mesmos**.
Revogar o token de outro dispositivo requer `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Retorna o resultado da revogação como JSON.

## Opções comuns

- `--url <url>`: URL WebSocket do Gateway (usa por padrão `gateway.remote.url` quando configurado).
- `--token <token>`: token do Gateway (se necessário).
- `--password <password>`: senha do Gateway (autenticação por senha).
- `--timeout <ms>`: timeout de RPC.
- `--json`: saída JSON (recomendado para scripts).

Observação: quando você define `--url`, a CLI não usa credenciais de configuração ou ambiente como fallback.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes geram erro.

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como segredo.
- Esses comandos exigem escopo `operator.pairing` (ou `operator.admin`).
- A rotação de token permanece dentro do conjunto de papéis de pareamento aprovados e da baseline
  de escopo aprovada para esse dispositivo. Uma entrada isolada de token em cache não concede um novo
  alvo de rotação.
- Para sessões de token de dispositivo pareado, o gerenciamento entre dispositivos é somente para administradores:
  `remove`, `rotate` e `revoke` são apenas para o próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de pareamento estiver indisponível no local loopback (e nenhum `--url` explícito for passado), list/approve pode usar um fallback local de pareamento.
- `devices approve` exige um ID de solicitação explícito antes de emitir tokens; omitir `requestId` ou passar `--latest` apenas visualiza a solicitação pendente mais recente.

## Checklist de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a fonte atual do token do gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos pareados e identifique o ID do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operator para o dispositivo afetado:

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

- A precedência normal de autenticação de reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e depois token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para essa única nova tentativa limitada.

Relacionado:

- [Solução de problemas de autenticação do Dashboard](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
