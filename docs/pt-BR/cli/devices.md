---
read_when:
    - Você está aprovando solicitações de emparelhamento de dispositivo
    - Você precisa rotacionar ou revogar tokens de dispositivo
summary: Referência da CLI para `openclaw devices` (emparelhamento de dispositivo + rotação/revogação de token)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-26T11:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
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
aprovado atual do dispositivo quando o dispositivo já está emparelhado. Isso
torna upgrades de escopo/função explícitos, em vez de parecer que o emparelhamento
foi perdido.

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

Limpa dispositivos emparelhados em lote.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprova uma solicitação pendente de emparelhamento de dispositivo por `requestId`
exato. Se `requestId` for omitido ou `--latest` for passado, o OpenClaw apenas
imprime a solicitação pendente selecionada e sai; execute a aprovação novamente
com o ID exato da solicitação após verificar os detalhes.

Observação: se um dispositivo tentar emparelhar novamente com detalhes de autenticação alterados (função/escopos/chave pública), o OpenClaw substitui a entrada pendente anterior e emite um novo
`requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o
ID atual.

Se o dispositivo já estiver emparelhado e solicitar escopos mais amplos ou uma função mais ampla,
o OpenClaw mantém a aprovação existente e cria uma nova solicitação pendente de upgrade.
Revise as colunas `Requested` e `Approved` em `openclaw devices list`
ou use `openclaw devices approve --latest` para visualizar o upgrade exato antes
de aprová-lo.

Se o Gateway estiver explicitamente configurado com
`gateway.nodes.pairing.autoApproveCidrs`, solicitações de primeira vez de `role: node` de IPs de cliente correspondentes podem ser aprovadas antes de aparecerem nesta lista. Essa política
fica desabilitada por padrão e nunca se aplica a clientes operator/browser nem a solicitações de upgrade.

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
a rotação não pode gerar uma nova função não aprovada.
Se você omitir `--scope`, reconexões posteriores com o token rotacionado armazenado reutilizarão os
escopos aprovados em cache desse token. Se você passar valores explícitos de `--scope`, eles
se tornarão o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores não administradores com dispositivo emparelhado podem rotacionar apenas o token do **próprio**
dispositivo.
O conjunto de escopos do token de destino deve permanecer dentro dos escopos operator da própria sessão do chamador;
a rotação não pode gerar nem preservar um token operator mais amplo do que o chamador já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna a carga do novo token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoga um token de dispositivo para uma função específica.

Chamadores não administradores com dispositivo emparelhado podem revogar apenas o token do **próprio**
dispositivo.
Revogar o token de outro dispositivo requer `operator.admin`.
O conjunto de escopos do token de destino também deve caber dentro dos escopos operator da própria sessão do chamador;
chamadores com apenas emparelhamento não podem revogar tokens operator admin/write.

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

Observação: quando você define `--url`, a CLI não usa fallback para credenciais de configuração ou ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Esses comandos exigem o escopo `operator.pairing` (ou `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` é uma política opt-in do Gateway para
  emparelhamento inicial apenas de dispositivos node; ela não altera a autoridade de aprovação da CLI.
- A rotação e a revogação de tokens permanecem dentro do conjunto de funções aprovado no emparelhamento e
  da linha de base de escopo aprovada para esse dispositivo. Uma entrada de token em cache perdida não
  concede um alvo de gerenciamento de token.
- Para sessões com token de dispositivo emparelhado, o gerenciamento entre dispositivos é somente admin:
  `remove`, `rotate` e `revoke` são apenas para o próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- A mutação de token também é contida pelo escopo do chamador: uma sessão somente de emparelhamento não pode
  rotacionar nem revogar um token que atualmente carrega `operator.admin` ou
  `operator.write`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de emparelhamento não estiver disponível em local loopback (e nenhum `--url` explícito for passado), `list`/`approve` podem usar um fallback de emparelhamento local.
- `devices approve` exige um ID de solicitação explícito antes de gerar tokens; omitir `requestId` ou passar `--latest` apenas visualiza a solicitação pendente mais recente.

## Checklist de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a origem atual do token do gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos emparelhados e identifique o ID do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token operator do dispositivo afetado:

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

- A precedência normal de autenticação de reconexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para essa única nova tentativa limitada.

Relacionado:

- [Solução de problemas de autenticação do painel](/pt-BR/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
