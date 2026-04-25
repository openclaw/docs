---
read_when:
    - Você está aprovando solicitações de emparelhamento de dispositivos
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (emparelhamento de dispositivos + rotação/revogação de token)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-25T13:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerencie solicitações de emparelhamento de dispositivos e tokens com escopo de dispositivo.

## Comandos

### `openclaw devices list`

Lista solicitações de emparelhamento pendentes e dispositivos emparelhados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitação pendente mostra o acesso solicitado ao lado do acesso
aprovado atual do dispositivo quando ele já está emparelhado. Isso torna
explícitas as atualizações de escopo/função, em vez de parecer que o
emparelhamento foi perdido.

### `openclaw devices remove <deviceId>`

Remove uma entrada de dispositivo emparelhado.

Quando você está autenticado com um token de dispositivo emparelhado, chamadores
não administradores podem remover apenas a entrada do **próprio** dispositivo.
Remover outro dispositivo requer `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Limpa dispositivos emparelhados em massa.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprova uma solicitação pendente de emparelhamento de dispositivo pelo `requestId`
exato. Se `requestId` for omitido ou `--latest` for passado, o OpenClaw apenas
imprime a solicitação pendente selecionada e sai; execute a aprovação novamente
com o ID exato da solicitação após verificar os detalhes.

Observação: se o dispositivo tentar emparelhar novamente com detalhes de autenticação alterados (função/escopos/chave pública), o OpenClaw substitui a entrada pendente anterior e emite um novo
`requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o
ID atual.

Se o dispositivo já estiver emparelhado e solicitar escopos mais amplos ou uma função mais ampla,
o OpenClaw mantém a aprovação existente e cria uma nova solicitação pendente de atualização.
Revise as colunas `Requested` e `Approved` em `openclaw devices list`
ou use `openclaw devices approve --latest` para visualizar a atualização exata antes
de aprová-la.

Se o Gateway estiver configurado explicitamente com
`gateway.nodes.pairing.autoApproveCidrs`, solicitações iniciais com `role: node` de IPs de cliente correspondentes podem ser aprovadas antes de aparecerem nesta lista. Essa política
fica desativada por padrão e nunca se aplica a clientes operator/browser nem a solicitações de atualização.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeita uma solicitação pendente de emparelhamento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotaciona um token de dispositivo para uma função específica (opcionalmente atualizando escopos).
A função de destino já deve existir no contrato de emparelhamento aprovado desse dispositivo;
a rotação não pode emitir uma nova função não aprovada.
Se você omitir `--scope`, reconexões posteriores com o token rotacionado armazenado reutilizam os
escopos aprovados em cache desse token. Se você passar valores explícitos de `--scope`,
eles se tornarão o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores não administradores com dispositivo emparelhado podem rotacionar apenas o token do **próprio**
dispositivo.
Além disso, quaisquer valores explícitos de `--scope` devem permanecer dentro dos próprios
escopos de operator da sessão do chamador; a rotação não pode emitir um token de operator
mais amplo do que o chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna o payload do novo token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoga um token de dispositivo para uma função específica.

Chamadores não administradores com dispositivo emparelhado podem revogar apenas o token do **próprio** dispositivo.
Revogar o token de outro dispositivo requer `operator.admin`.

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

Observação: quando você define `--url`, a CLI não usa credenciais da configuração nem do ambiente como fallback.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Esses comandos exigem escopo `operator.pairing` (ou `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` é uma política opcional do Gateway para
  emparelhamento inicial de dispositivos de Node apenas; ela não altera a autoridade de aprovação da CLI.
- A rotação de token permanece dentro do conjunto de funções aprovado no emparelhamento e da linha de base de escopo aprovada
  para aquele dispositivo. Uma entrada perdida de token em cache não concede um novo
  alvo de rotação.
- Para sessões com token de dispositivo emparelhado, o gerenciamento entre dispositivos é apenas para administradores:
  `remove`, `rotate` e `revoke` são limitados ao próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de emparelhamento não estiver disponível em local loopback (e nenhum `--url` explícito for passado), `list`/`approve` podem usar um fallback local de emparelhamento.
- `devices approve` exige um ID de solicitação explícito antes de emitir tokens; omitir `requestId` ou passar `--latest` apenas visualiza a solicitação pendente mais recente.

## Checklist de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a fonte atual do token do Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos emparelhados e identifique o ID do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operator para o dispositivo afetado:

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

- A precedência normal de autenticação na reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para aquela única tentativa limitada.

Relacionado:

- [Solução de problemas de autenticação do painel](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
