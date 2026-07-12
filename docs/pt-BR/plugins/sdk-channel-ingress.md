---
read_when:
    - Como criar ou migrar um plugin de canal de mensagens
    - Alteração das listas de permissões de mensagens diretas ou grupos, dos controles de rota, da autenticação de comandos, da autenticação de eventos ou da ativação por menção
    - Revisão dos limites de redação de dados na entrada de canais ou de compatibilidade do SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canais para autorização de mensagens recebidas
title: API de entrada de canais
x-i18n:
    generated_at: "2026-07-12T00:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

A entrada de canal é o limite experimental de controle de acesso para eventos
de canal recebidos. Os Plugins controlam os fatos e efeitos colaterais da
plataforma; o núcleo controla a política genérica: listas de permissões de
MD/grupo, entradas de MD no armazenamento de pareamento, bloqueios de rota,
bloqueios de comando, autorização de eventos, ativação por menção,
diagnósticos com dados ocultados e admissão.

Use `openclaw/plugin-sdk/channel-ingress-runtime` para novos fluxos de
recebimento. O subcaminho mais antigo
`openclaw/plugin-sdk/channel-ingress` continua exportado como uma fachada de
compatibilidade obsoleta para Plugins de terceiros.

## Resolvedor de tempo de execução

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

Não pré-calcule listas de permissões efetivas, proprietários de comandos nem
grupos de comandos. O resolvedor os deriva de listas de permissões brutas,
retornos de chamada do armazenamento, descritores de rota, grupos de acesso,
política e tipo de conversa.

## Resultado

Os Plugins incluídos devem consumir diretamente as projeções modernas:

| Campo              | Significado                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| `ingress`          | decisão ordenada dos bloqueios e admissão                                    |
| `senderAccess`     | somente autorização do remetente/conversa                                    |
| `routeAccess`      | projeção da rota e do remetente da rota                                      |
| `commandAccess`    | autorização de comando; `requested: false` quando nenhum bloqueio foi aplicado |
| `activationAccess` | resultado da menção/ativação                                                  |

A autorização de eventos continua disponível no `ingress.graph` ordenado e no
`ingress.reasonCode` decisivo; nenhuma projeção de evento separada é emitida.

Auxiliares obsoletos do SDK para terceiros podem reconstruir internamente
formatos mais antigos. Novos fluxos de recebimento incluídos não devem
converter resultados modernos de volta em DTOs locais.

## Grupos de acesso

As entradas `accessGroup:<name>` permanecem ocultadas. O núcleo resolve por
conta própria os grupos estáticos de `message.senders` e chama
`resolveAccessGroupMembership` somente para grupos dinâmicos que exigem uma
consulta à plataforma. Grupos ausentes, incompatíveis ou com falha são
bloqueados por padrão.

## Modos de evento

| `authMode`       | Significado                                                   |
| ---------------- | ------------------------------------------------------------- |
| `inbound`        | bloqueios normais do remetente de entrada                     |
| `command`        | bloqueios de comando para retornos de chamada ou botões com escopo |
| `origin-subject` | o agente deve corresponder ao sujeito da mensagem original    |
| `route-only`     | somente bloqueios de rota para eventos confiáveis com escopo de rota |
| `none`           | eventos internos controlados pelo Plugin ignoram a autorização compartilhada |

Use `mayPair: false` para reações, botões, retornos de chamada e comandos
nativos.

## Rotas e ativação

Use descritores de rota para políticas de sala, tópico, servidor, thread ou
rota aninhada:

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

Use `channelIngressRoutes(...)` quando um Plugin tiver vários descritores de
rota opcionais; ele filtra ramificações desativadas enquanto mantém os fatos
de rota genéricos e ordenados pela `precedence` de cada descritor.

O bloqueio por menção é um bloqueio de ativação. A ausência de menção retorna
`admission: "skip"` para que o núcleo de turnos não processe um turno apenas
de observação. A maioria dos canais deve manter a ativação após os bloqueios
de remetente e comando. Superfícies públicas de bate-papo que precisam
silenciar o tráfego sem menções antes do ruído da lista de permissões de
remetentes podem optar por `activation.order: "before-sender"` quando o desvio
por comando de texto estiver desativado. Canais com ativação implícita, como
respostas em threads de bots, podem fornecer
`activation.allowedImplicitMentionKinds`; o
`activationAccess.shouldBypassMention` projetado então informa quando um
comando ou uma ativação implícita dispensou uma menção explícita.

## Ocultação

Valores brutos de remetentes e entradas brutas de listas de permissões são
apenas dados de entrada do resolvedor. Eles não devem aparecer no estado
resolvido, nas decisões, nos diagnósticos, nos instantâneos nem nos fatos de
compatibilidade. Use IDs opacos de sujeitos, entradas, rotas e diagnósticos.

## Verificação

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
