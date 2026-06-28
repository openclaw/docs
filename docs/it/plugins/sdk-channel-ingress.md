---
read_when:
    - Creazione o migrazione di un Plugin per canali di messaggistica
    - Modifica delle liste consentite per DM o gruppi, dei gate di routing, dell'autorizzazione dei comandi, dell'autorizzazione degli eventi o dell'attivazione tramite menzione
    - Revisione dell'occultamento dell'ingresso del canale o dei limiti di compatibilità dell'SDK
sidebarTitle: Channel Ingress
summary: API sperimentale di ingresso dei canali per l'autorizzazione dei messaggi in entrata
title: API di ingresso del canale
x-i18n:
    generated_at: "2026-05-10T19:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API di ingresso dei canali

L'ingresso dei canali è il confine sperimentale di controllo degli accessi per gli eventi di canale
in ingresso. Usa `openclaw/plugin-sdk/channel-ingress-runtime` per i percorsi di ricezione.
Il sottopercorso precedente `openclaw/plugin-sdk/channel-ingress` rimane esportato come
facciata di compatibilità deprecata per Plugin di terze parti.

I Plugin possiedono i fatti della piattaforma e gli effetti collaterali. Il nucleo possiede le policy generiche: allowlist di DM/gruppi, voci DM dell'archivio di associazione, gate di route, gate dei comandi, autorizzazione degli eventi,
attivazione tramite menzione, diagnostica redatta e ammissione.

## Risolutore Runtime

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

Non precomputare allowlist effettive, proprietari dei comandi o gruppi di comandi. Il
risolutore li deriva da allowlist grezze, callback dell'archivio, descrittori di route,
gruppi di accesso, policy e tipo di conversazione.

## Risultato

I Plugin inclusi dovrebbero consumare direttamente le proiezioni moderne:

- `ingress`: decisione ordinata dei gate e ammissione
- `senderAccess`: solo autorizzazione del mittente/della conversazione
- `routeAccess`: route e proiezione mittente-route
- `commandAccess`: autorizzazione dei comandi; falso quando non è stato eseguito alcun gate di comando
- `activationAccess`: risultato di menzione/attivazione

L'autorizzazione degli eventi rimane disponibile su `ingress.graph` ordinato e sul
decisivo `ingress.reasonCode`; non viene emessa alcuna proiezione separata degli eventi.

Gli helper SDK deprecati di terze parti possono ricostruire internamente le forme precedenti. I nuovi
percorsi di ricezione inclusi non dovrebbero tradurre i risultati moderni di nuovo in DTO locali.

## Gruppi di accesso

Le voci `accessGroup:<name>` rimangono redatte. Il nucleo risolve autonomamente i gruppi statici
`message.senders` e chiama `resolveAccessGroupMembership` solo
per i gruppi dinamici che richiedono una ricerca sulla piattaforma. Gruppi mancanti, non supportati e
non riusciti falliscono in modo chiuso.

## Modalità evento

| `authMode`       | Significato                                      |
| ---------------- | ----------------------------------------------- |
| `inbound`        | normali gate del mittente in ingresso           |
| `command`        | gate dei comandi per callback o pulsanti con ambito |
| `origin-subject` | l'attore deve corrispondere al soggetto del messaggio originale |
| `route-only`     | solo gate di route per eventi attendibili con ambito di route |
| `none`           | eventi interni di proprietà del plugin ignorano l'autenticazione condivisa |

Usa `mayPair: false` per reazioni, pulsanti, callback e comandi nativi.

## Route e attivazione

Usa descrittori di route per policy di stanza, argomento, gilda, thread o route annidata:

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

Usa `channelIngressRoutes(...)` quando un Plugin ha diversi descrittori di route
opzionali; filtra i rami disabilitati mantenendo i fatti di route generici e
ordinati in base alla `precedence` di ciascun descrittore.

Il gate delle menzioni è un gate di attivazione. Una menzione mancata restituisce
`admission: "skip"` così il kernel del turno non elabora un turno di sola osservazione.
La maggior parte dei canali dovrebbe lasciare l'attivazione dopo i gate di mittente e comando. Le superfici di chat
pubbliche che devono silenziare il traffico non menzionato prima del rumore della allowlist dei mittenti
possono optare per `activation.order: "before-sender"` quando il bypass dei comandi testuali
è disabilitato. I canali con attivazione implicita, come le risposte nei thread del bot,
possono passare `activation.allowedImplicitMentionKinds`; il valore proiettato
`activationAccess.shouldBypassMention` segnala quindi quando il comando o l'attivazione implicita
ha aggirato una menzione esplicita.

## Redazione

I valori grezzi del mittente e le voci grezze della allowlist sono solo input del risolutore. Non devono
comparire nello stato risolto, nelle decisioni, nella diagnostica, negli snapshot o nei fatti di
compatibilità. Usa ID soggetto opachi, ID voce, ID route e
ID diagnostici.

## Verifica

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
