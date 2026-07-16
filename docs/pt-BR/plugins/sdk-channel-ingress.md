---
read_when:
    - Como criar ou migrar um plugin de canal de mensagens
    - Alteração de listas de permissões de DMs ou grupos, controles de rota, autenticação de comandos, autenticação de eventos ou ativação por menção
    - Revisão dos limites de redação de dados confidenciais na entrada de canais ou de compatibilidade do SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canal para autorização de mensagens recebidas
title: API de entrada de canais
x-i18n:
    generated_at: "2026-07-16T12:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

O ingresso de canais é o limite experimental de controle de acesso para eventos
recebidos de canais. Os plugins são responsáveis pelos fatos da plataforma e pelos efeitos colaterais; o núcleo é responsável
pela política genérica: listas de permissões de mensagens diretas/grupos, entradas de mensagens diretas do armazenamento de pareamento, gates de rota,
gates de comando, autenticação de eventos, ativação por menção, diagnósticos com dados ocultados e
admissão.

Use `openclaw/plugin-sdk/channel-ingress-runtime` nos caminhos de recebimento.

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

Não pré-calcule listas de permissões efetivas, proprietários de comandos nem grupos de comandos.
O resolvedor os deriva de listas de permissões brutas, callbacks de armazenamento, descritores de
rota, grupos de acesso, política e tipo de conversa.

## Resultado

Os plugins incluídos no pacote devem consumir diretamente as projeções modernas:

| Campo              | Significado                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisão ordenada dos gates e admissão                                |
| `senderAccess`     | somente autorização do remetente/da conversa                             |
| `routeAccess`      | projeção da rota e do remetente da rota                                  |
| `commandAccess`    | autorização de comando; `requested: false` quando nenhum gate de comando foi executado |
| `activationAccess` | resultado de menção/ativação                                          |

A autorização de eventos continua disponível no `ingress.graph` ordenado e no
`ingress.reasonCode` decisivo; nenhuma projeção separada de evento é emitida.

Helpers obsoletos do SDK de terceiros podem reconstruir formatos antigos internamente. Novos
caminhos de recebimento incluídos no pacote não devem converter resultados modernos de volta em
DTOs locais.

## Grupos de acesso

As entradas de `accessGroup:<name>` permanecem com dados ocultados. O núcleo resolve por conta própria os grupos
`message.senders` estáticos e chama `resolveAccessGroupMembership` somente
para grupos dinâmicos que exigem uma consulta à plataforma. Grupos ausentes, sem suporte ou
com falha são bloqueados por padrão.

## Modos de evento

| `authMode`       | Significado                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | gates normais de remetente para eventos recebidos                      |
| `command`        | gates de comando para callbacks ou botões com escopo    |
| `origin-subject` | o ator deve corresponder ao sujeito da mensagem original    |
| `route-only`     | somente gates de rota para eventos confiáveis com escopo de rota |
| `none`           | eventos internos pertencentes ao plugin ignoram a autenticação compartilhada  |

Use `mayPair: false` para reações, botões, callbacks e comandos nativos.

## Rotas e ativação

Use descritores de rota para políticas de sala, tópico, guilda, thread ou rota aninhada:

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

Use `channelIngressRoutes(...)` quando um plugin tiver vários descritores de rota
opcionais; ele filtra ramificações desabilitadas, mantendo os fatos das rotas genéricos
e ordenados pelo `precedence` de cada descritor.

O gate de menção é um gate de ativação. A ausência de uma menção retorna
`admission: "skip"` para que o kernel do turno não processe um turno somente de observação.
A maioria dos canais deve manter a ativação depois dos gates de remetente e de comando. Superfícies
de chat público que precisam silenciar tráfego sem menção antes do ruído da lista de permissões do
remetente podem optar por `activation.order: "before-sender"` quando o bypass de
comandos de texto estiver desabilitado. Canais com ativação implícita, como respostas em threads
do bot, podem passar `activation.allowedImplicitMentionKinds`; o
`activationAccess.shouldBypassMention` projetado então informa quando um comando ou uma
ativação implícita ignorou a exigência de uma menção explícita.

## Ocultação de dados

Valores brutos de remetente e entradas brutas de listas de permissões servem apenas como entrada do resolvedor. Eles
nunca devem aparecer no estado resolvido, nas decisões, nos diagnósticos, nos snapshots nem nos
fatos de compatibilidade. Use IDs opacos de sujeitos, entradas, rotas e
diagnósticos.

## Verificação

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
