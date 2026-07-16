---
read_when:
    - Creazione o migrazione di un plugin per un canale di messaggistica
    - Modifica delle liste consentite per messaggi diretti o gruppi, dei controlli di instradamento, dell'autorizzazione dei comandi, dell'autorizzazione degli eventi o dell'attivazione tramite menzione
    - Revisione dell'oscuramento dei dati in ingresso dai canali o dei limiti di compatibilità dell'SDK
sidebarTitle: Channel Ingress
summary: API sperimentale di ingresso dei canali per l'autorizzazione dei messaggi in entrata
title: API di ingresso del canale
x-i18n:
    generated_at: "2026-07-16T14:51:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

L'ingresso dei canali è il confine sperimentale di controllo degli accessi per gli eventi
in entrata dai canali. I Plugin gestiscono i dati specifici della piattaforma e gli effetti collaterali; il core gestisce
i criteri generici: elenchi consentiti per messaggi diretti e gruppi, voci per messaggi diretti nell'archivio di associazione, controlli delle route,
controlli dei comandi, autorizzazione degli eventi, attivazione tramite menzione, diagnostica oscurata e
ammissione.

Usare `openclaw/plugin-sdk/channel-ingress-runtime` per i percorsi di ricezione.

## Resolver di runtime

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

Non precalcolare gli elenchi consentiti effettivi, i proprietari dei comandi o i gruppi di comandi.
Il resolver li ricava dagli elenchi consentiti non elaborati, dai callback dell'archivio, dai descrittori delle route,
dai gruppi di accesso, dai criteri e dal tipo di conversazione.

## Risultato

I Plugin inclusi devono utilizzare direttamente le proiezioni moderne:

| Campo              | Significato                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisione ordinata dei controlli e ammissione                                |
| `senderAccess`     | sola autorizzazione del mittente e della conversazione                             |
| `routeAccess`      | proiezione della route e del mittente della route                                  |
| `commandAccess`    | autorizzazione del comando; `requested: false` se non è stato eseguito alcun controllo del comando |
| `activationAccess` | risultato della menzione/attivazione                                          |

L'autorizzazione degli eventi rimane disponibile nell'elemento ordinato `ingress.graph` e in quello
decisivo `ingress.reasonCode`; non viene emessa alcuna proiezione separata degli eventi.

Gli helper SDK deprecati di terze parti possono ricostruire internamente le strutture precedenti. I nuovi
percorsi di ricezione inclusi non devono riconvertire i risultati moderni in
DTO locali.

## Gruppi di accesso

Le voci `accessGroup:<name>` rimangono oscurate. Il core risolve autonomamente i gruppi statici
`message.senders` e chiama `resolveAccessGroupMembership` solo
per i gruppi dinamici che richiedono una ricerca sulla piattaforma. I gruppi mancanti, non supportati o
non riusciti adottano un comportamento di negazione predefinita.

## Modalità degli eventi

| `authMode`       | Significato                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normali controlli dei mittenti in entrata                      |
| `command`        | controlli dei comandi per callback o pulsanti con ambito    |
| `origin-subject` | l'attore deve corrispondere al soggetto del messaggio originale    |
| `route-only`     | soli controlli delle route per eventi attendibili con ambito della route |
| `none`           | gli eventi interni gestiti dal Plugin ignorano l'autorizzazione condivisa  |

Usare `mayPair: false` per reazioni, pulsanti, callback e comandi nativi.

## Route e attivazione

Usare i descrittori delle route per i criteri relativi a stanza, argomento, gilda, thread o route nidificate:

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

Usare `channelIngressRoutes(...)` quando un Plugin dispone di diversi descrittori di route
facoltativi; filtra i rami disabilitati mantenendo generici i dati delle route
e ordinandoli in base al valore `precedence` di ciascun descrittore.

Il controllo delle menzioni è un controllo di attivazione. Una menzione non rilevata restituisce
`admission: "skip"`, affinché il kernel del turno non elabori un turno di sola osservazione.
La maggior parte dei canali deve mantenere l'attivazione dopo i controlli del mittente e dei comandi. Le superfici
di chat pubbliche che devono silenziare il traffico privo di menzioni prima del rumore generato
dall'elenco consentito dei mittenti possono adottare `activation.order: "before-sender"` quando il bypass
tramite comandi testuali è disabilitato. I canali con attivazione implicita, come le risposte nei
thread dei bot, possono passare `activation.allowedImplicitMentionKinds`; la proiezione
`activationAccess.shouldBypassMention` indica quindi quando un comando o un'attivazione
implicita ha ignorato la necessità di una menzione esplicita.

## Oscuramento

I valori non elaborati dei mittenti e le voci non elaborate degli elenchi consentiti sono esclusivamente input del resolver. Non
devono comparire nello stato risolto, nelle decisioni, nella diagnostica, negli snapshot o
nei dati di compatibilità. Usare ID opachi per soggetti, voci, route e
diagnostica.

## Verifica

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
