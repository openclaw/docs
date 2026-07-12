---
read_when:
    - Creazione o migrazione di un Plugin per un canale di messaggistica
    - Modifica degli elenchi consentiti per i messaggi diretti o i gruppi, dei controlli di instradamento, dell'autorizzazione dei comandi, dell'autorizzazione degli eventi o dell'attivazione tramite menzione
    - Revisione dell'oscuramento dei dati in ingresso dei canali o dei confini di compatibilità dell'SDK
sidebarTitle: Channel Ingress
summary: API sperimentale di ingresso del canale per l'autorizzazione dei messaggi in entrata
title: API di ingresso del canale
x-i18n:
    generated_at: "2026-07-12T07:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

L'ingresso dei canali è il confine sperimentale di controllo degli accessi per gli eventi
in entrata dei canali. I Plugin gestiscono i dati specifici della piattaforma e gli effetti collaterali; il core gestisce
la policy generica: elenchi di consentiti per messaggi diretti e gruppi, voci per messaggi diretti nell'archivio di associazione, controlli delle route,
controlli dei comandi, autorizzazione degli eventi, attivazione tramite menzione, diagnostica oscurata e
ammissione.

Usa `openclaw/plugin-sdk/channel-ingress-runtime` per i nuovi percorsi di ricezione. Il
sottopercorso precedente `openclaw/plugin-sdk/channel-ingress` rimane esportato come
facciata di compatibilità deprecata per i plugin di terze parti.

## Risolutore di runtime

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

Non precalcolare gli elenchi di consentiti effettivi, i proprietari dei comandi o i gruppi di comandi.
Il risolutore li ricava dagli elenchi di consentiti non elaborati, dai callback dell'archivio, dai descrittori
delle route, dai gruppi di accesso, dalla policy e dal tipo di conversazione.

## Risultato

I plugin inclusi devono utilizzare direttamente le proiezioni moderne:

| Campo              | Significato                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisione ordinata dei controlli e ammissione                                |
| `senderAccess`     | solo autorizzazione del mittente e della conversazione                             |
| `routeAccess`      | proiezione della route e del mittente della route                                  |
| `commandAccess`    | autorizzazione dei comandi; `requested: false` quando non è stato eseguito alcun controllo dei comandi |
| `activationAccess` | risultato della menzione o dell'attivazione                                          |

L'autorizzazione degli eventi rimane disponibile nel grafo ordinato `ingress.graph` e nel
codice motivo determinante `ingress.reasonCode`; non viene emessa alcuna proiezione separata dell'evento.

Gli helper SDK deprecati di terze parti possono ricostruire internamente le strutture precedenti. I nuovi
percorsi di ricezione inclusi non devono riconvertire i risultati moderni in DTO
locali.

## Gruppi di accesso

Le voci `accessGroup:<name>` rimangono oscurate. Il core risolve autonomamente i gruppi statici
`message.senders` e chiama `resolveAccessGroupMembership` solo
per i gruppi dinamici che richiedono una ricerca sulla piattaforma. I gruppi mancanti, non supportati o
la cui risoluzione non riesce negano l'accesso per impostazione predefinita.

## Modalità degli eventi

| `authMode`       | Significato                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normali controlli del mittente in entrata                      |
| `command`        | controlli dei comandi per callback o pulsanti con ambito specifico    |
| `origin-subject` | l'attore deve corrispondere al soggetto del messaggio originale    |
| `route-only`     | solo controlli delle route per eventi attendibili con ambito di route |
| `none`           | gli eventi interni gestiti dal plugin ignorano l'autorizzazione condivisa  |

Usa `mayPair: false` per reazioni, pulsanti, callback e comandi nativi.

## Route e attivazione

Usa i descrittori di route per le policy di stanza, argomento, gilda, thread o route annidate:

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

Usa `channelIngressRoutes(...)` quando un plugin dispone di diversi descrittori di route
facoltativi; filtra i rami disabilitati mantenendo generici i dati delle route
e ordinandoli in base alla `precedence` di ciascun descrittore.

Il controllo delle menzioni è un controllo di attivazione. Una menzione mancante restituisce
`admission: "skip"`, affinché il kernel del turno non elabori un turno di sola osservazione.
La maggior parte dei canali deve lasciare l'attivazione dopo i controlli del mittente e dei comandi. Le superfici
di chat pubblica che devono silenziare il traffico senza menzioni prima del rumore prodotto dall'elenco
di mittenti consentiti possono scegliere `activation.order: "before-sender"` quando l'aggiramento
tramite comandi testuali è disabilitato. I canali con attivazione implicita, come le risposte nei
thread dei bot, possono passare `activation.allowedImplicitMentionKinds`; la proiezione
`activationAccess.shouldBypassMention` indica quindi quando un comando o un'attivazione implicita
ha aggirato una menzione esplicita.

## Oscuramento

I valori non elaborati dei mittenti e le voci non elaborate degli elenchi di consentiti sono esclusivamente input del risolutore. Non
devono comparire nello stato risolto, nelle decisioni, nella diagnostica, nelle istantanee o
nei dati di compatibilità. Usa ID opachi per soggetti, voci, route e
diagnostica.

## Verifica

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
