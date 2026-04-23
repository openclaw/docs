---
read_when:
    - Você está aprovando solicitações de pareamento de dispositivo
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (pareamento de dispositivo + rotação/revogação de token)
title: dispositivos
x-i18n:
    generated_at: "2026-04-23T14:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerencie solicitações de pareamento de dispositivo e tokens com escopo de dispositivo.

## Comandos

### `openclaw devices list`

Liste solicitações de pareamento pendentes e dispositivos pareados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitações pendentes mostra o acesso solicitado ao lado do acesso
aprovado atual do dispositivo quando o dispositivo já está pareado. Isso torna
explícitas as atualizações de escopo/função, em vez de parecer que o pareamento
foi perdido.

### `openclaw devices remove <deviceId>`

Remova uma entrada de dispositivo pareado.

Quando você está autenticado com um token de dispositivo pareado, chamadores não administradores podem
remover apenas **sua própria** entrada de dispositivo. Remover outro dispositivo exige
`operator.admin`.

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
for omitido ou `--latest` for passado, o OpenClaw apenas imprime a solicitação pendente
selecionada e sai; execute a aprovação novamente com o ID exato da solicitação após verificar
os detalhes.

Observação: se um dispositivo tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave
pública), o OpenClaw substitui a entrada pendente anterior e emite um novo
`requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o
ID atual.

Se o dispositivo já estiver pareado e solicitar escopos mais amplos ou uma função mais ampla,
o OpenClaw mantém a aprovação existente e cria uma nova solicitação pendente
de upgrade. Revise as colunas `Requested` e `Approved` em `openclaw devices list`
ou use `openclaw devices approve --latest` para visualizar o upgrade exato antes
de aprová-lo.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

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
se tornarão o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores não administradores com dispositivo pareado podem rotacionar apenas **seu próprio** token de dispositivo.
Além disso, quaisquer valores explícitos de `--scope` devem permanecer dentro dos próprios
escopos de operador da sessão do chamador; a rotação não pode emitir um token de operador
mais amplo do que o chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna a carga do novo token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revogue um token de dispositivo para uma função específica.

Chamadores não administradores com dispositivo pareado podem revogar apenas **seu próprio** token de dispositivo.
Revogar o token de outro dispositivo exige `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Retorna o resultado da revogação como JSON.

## Opções comuns

- `--url <url>`: URL do WebSocket do Gateway (usa por padrão `gateway.remote.url` quando configurado).
- `--token <token>`: token do Gateway (se necessário).
- `--password <password>`: senha do Gateway (autenticação por senha).
- `--timeout <ms>`: timeout de RPC.
- `--json`: saída em JSON (recomendado para scripts).

Observação: quando você define `--url`, a CLI não usa fallback para credenciais da config ou do ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Esses comandos exigem escopo `operator.pairing` (ou `operator.admin`).
- A rotação de token permanece dentro do conjunto de funções de pareamento aprovado e da linha de base
  de escopos aprovada para esse dispositivo. Uma entrada perdida de token em cache não concede um novo
  destino de rotação.
- Para sessões de token de dispositivo pareado, o gerenciamento entre dispositivos é somente para administradores:
  `remove`, `rotate` e `revoke` são apenas para o próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de pareamento não estiver disponível em local loopback (e nenhum `--url` explícito for passado), list/approve podem usar um fallback local de pareamento.
- `devices approve` exige um ID explícito de solicitação antes de emitir tokens; omitir `requestId` ou passar `--latest` apenas visualiza a solicitação pendente mais recente.

## Checklist de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a origem atual do token do gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos pareados e identifique o ID do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operador para o dispositivo afetado:

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

- A precedência normal de autenticação de reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para a única nova tentativa delimitada.

Relacionado:

- [Solução de problemas de autenticação do dashboard](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)
