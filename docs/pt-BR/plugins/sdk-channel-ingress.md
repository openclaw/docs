---
read_when:
    - Criando ou migrando um Plugin de canal de mensagens
    - Alteração das listas de permissões de mensagens diretas ou grupos, controles de rota, autenticação de comandos, autenticação de eventos ou ativação por menção
    - Revisando os limites de mascaramento de entrada do canal ou de compatibilidade do SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canal para autorização de mensagens recebidas
title: API de entrada de canal
x-i18n:
    generated_at: "2026-05-10T19:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API de entrada de canal

A entrada de canal é o limite experimental de controle de acesso para eventos
de canal recebidos. Use `openclaw/plugin-sdk/channel-ingress-runtime` para caminhos de recebimento.
O subcaminho mais antigo `openclaw/plugin-sdk/channel-ingress` continua exportado como uma
fachada de compatibilidade obsoleta para plugins de terceiros.

Plugins são responsáveis por fatos e efeitos colaterais da plataforma. O núcleo é responsável pela política genérica: listas de permissão de DM/grupo, entradas de DM do armazenamento de pareamento, bloqueios de rota, bloqueios de comando, autenticação de evento, ativação por menção, diagnósticos redigidos e admissão.

## Resolvedor de runtime

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Não pré-calcule listas de permissão efetivas, proprietários de comandos ou grupos de comandos. O
resolvedor os deriva de listas de permissão brutas, callbacks de armazenamento, descritores de rota,
grupos de acesso, política e tipo de conversa.

## Resultado

Plugins empacotados devem consumir projeções modernas diretamente:

- `ingress`: decisão de bloqueio e admissão ordenadas
- `senderAccess`: somente autorização de remetente/conversa
- `routeAccess`: projeção de rota e remetente da rota
- `commandAccess`: autorização de comando; falso quando nenhum bloqueio de comando foi executado
- `activationAccess`: resultado de menção/ativação

A autorização de evento permanece disponível no `ingress.graph` ordenado e no
`ingress.reasonCode` decisivo; nenhuma projeção separada de evento é emitida.

Helpers obsoletos do SDK de terceiros podem reconstruir formatos antigos internamente. Novos
caminhos de recebimento empacotados não devem traduzir resultados modernos de volta para DTOs locais.

## Grupos de acesso

Entradas `accessGroup:<name>` continuam redigidas. O núcleo resolve grupos estáticos
`message.senders` por conta própria e chama `resolveAccessGroupMembership` somente
para grupos dinâmicos que exigem uma consulta à plataforma. Grupos ausentes, sem suporte e
com falha falham fechados.

## Modos de evento

| `authMode`       | Significado                                      |
| ---------------- | ------------------------------------------------ |
| `inbound`        | bloqueios normais de remetente recebido          |
| `command`        | bloqueios de comando para callbacks ou botões com escopo |
| `origin-subject` | o ator deve corresponder ao assunto da mensagem original |
| `route-only`     | somente bloqueios de rota para eventos confiáveis com escopo de rota |
| `none`           | eventos internos de propriedade do plugin ignoram a autenticação compartilhada |

Use `mayPair: false` para reações, botões, callbacks e comandos nativos.

## Rotas e ativação

Use descritores de rota para política de sala, tópico, guilda, thread ou rota aninhada:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Use `channelIngressRoutes(...)` quando um plugin tiver vários descritores de rota opcionais;
ele filtra ramificações desabilitadas enquanto mantém os fatos de rota genéricos e
ordenados pela `precedence` de cada descritor.

O bloqueio por menção é um bloqueio de ativação. Uma menção ausente retorna
`admission: "skip"` para que o kernel de turno não processe um turno apenas de observação.
A maioria dos canais deve deixar a ativação após os bloqueios de remetente e comando. Superfícies de
chat públicas que precisam silenciar tráfego sem menção antes do ruído da lista de permissão de remetentes
podem optar por `activation.order: "before-sender"` quando o bypass de comando de texto
estiver desabilitado. Canais com ativação implícita, como respostas em threads de bot,
podem passar `activation.allowedImplicitMentionKinds`; então o
`activationAccess.shouldBypassMention` projetado relata quando um comando ou ativação
implícita ignorou uma menção explícita.

## Redação

Valores brutos de remetente e entradas brutas de lista de permissão são apenas entrada do resolvedor. Eles não devem
aparecer em estado resolvido, decisões, diagnósticos, snapshots ou
fatos de compatibilidade. Use IDs opacos de assunto, IDs de entrada, IDs de rota e
IDs de diagnóstico.

## Verificação

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
