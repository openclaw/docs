---
read_when:
    - Configurazione specifica dei gruppi WhatsApp
    - Modifica delle modalità di attivazione di WhatsApp (`mention` rispetto a `always`)
    - Ottimizzazione delle chiavi di sessione dei gruppi WhatsApp o del contesto dei messaggi in sospeso
sidebarTitle: WhatsApp groups
summary: Gestione dei messaggi dei gruppi WhatsApp — attivazione, liste di elementi consentiti, sessioni e inserimento del contesto
title: Messaggi dei gruppi WhatsApp
x-i18n:
    generated_at: "2026-07-16T13:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Per il modello di gruppi multicanale (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), consultare [Gruppi](/it/channels/groups). Questa pagina illustra il comportamento specifico di WhatsApp che si aggiunge a tale modello: attivazione, elenchi di elementi consentiti per i gruppi, chiavi di sessione per gruppo e inserimento nel contesto dei messaggi in sospeso.

Obiettivo: consentire a OpenClaw di partecipare ai gruppi WhatsApp, attivarsi solo quando viene menzionato e mantenere la conversazione separata dalla sessione personale dei messaggi diretti.

<Note>
`agents.list[].groupChat.mentionPatterns` è condiviso con il controllo delle menzioni degli altri canali. Per le configurazioni multi-agente, impostarlo per ogni agente oppure usare `messages.groupChat.mentionPatterns` come valore di ripiego globale. Se non è impostato nessuno dei due, i pattern vengono derivati dal nome o dall'emoji dell'identità dell'agente.
</Note>

## Comportamento

- Modalità di attivazione: `mention` (predefinita) o `always`. `mention` richiede una menzione: una vera @menzione di WhatsApp (`mentionedJids`), un pattern regex configurato, le cifre E.164 del bot in qualsiasi punto del testo oppure una risposta con citazione a uno dei messaggi del bot (eccetto nelle configurazioni di chat con sé stessi mediante numero condiviso). `always` attiva l'agente a ogni messaggio, ma il prompt di gruppo inserito gli indica di rispondere solo quando apporta valore e, in caso contrario, di restituire esattamente il token di silenzio `NO_REPLY` (senza distinzione tra maiuscole e minuscole). I valori predefiniti provengono dalla configurazione (`channels.whatsapp.groups` `requireMention`) e possono essere sostituiti per ogni gruppo tramite `/activation`.
- Elenco di gruppi consentiti: quando è impostato `channels.whatsapp.groups`, vengono ammessi solo i JID dei gruppi elencati (includere `"*"` per consentirli tutti); i messaggi dei gruppi non elencati vengono ignorati con un'indicazione nel log.
- Criterio per i gruppi: `channels.whatsapp.groupPolicy` determina se i messaggi di gruppo vengono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (valore di ripiego: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non vengono aggiunti mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno un formato simile a `agent:<agentId>:whatsapp:group:<jid>` (per gli account non predefiniti viene aggiunto `:thread:whatsapp-account-<accountId>`), pertanto le direttive come `/verbose on`, `/trace on` o `/think high` (inviate come messaggi autonomi) sono limitate a quel gruppo; lo stato dei messaggi diretti personali rimane invariato.
- Inserimento nel contesto: i messaggi di gruppo **solo in sospeso** (50 per impostazione predefinita) che _non hanno_ avviato un'esecuzione vengono anteposti sotto `[Chat messages since your last reply - for context]`, mentre la riga di attivazione viene inserita sotto `[Current message - respond to this]`. La finestra dei messaggi in sospeso viene svuotata dopo l'esecuzione; i messaggi già presenti nella sessione non vengono inseriti nuovamente.
- Attribuzione del mittente: ogni riga del gruppo include l'etichetta del mittente nella busta del messaggio, ad esempio `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, mentre l'identità del mittente e l'oggetto o i membri del gruppo vengono inclusi nel blocco non attendibile dei metadati della conversazione.
- Messaggi effimeri/visualizzabili una sola volta: i wrapper vengono rimossi prima di estrarre testo e menzioni, quindi le menzioni al loro interno attivano comunque l'agente.
- Prompt di sistema del gruppo: il primo turno di una sessione di gruppo (e qualsiasi turno successivo alla modifica della modalità tramite `/activation`) inserisce nel prompt di sistema le indicazioni per l'attivazione (`Activation: trigger-only ...` o `Activation: always-on ...`, oltre a «rivolgersi al mittente specifico»). Le indicazioni permanenti per la consegna nelle chat di gruppo («Sei in una chat di gruppo WhatsApp...») sono sempre incluse.

## Esempio di configurazione (WhatsApp)

Consentire il funzionamento delle menzioni tramite nome visualizzato anche quando WhatsApp rimuove il simbolo visibile `@` dal corpo del testo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // finestra del contesto di gruppo in sospeso (valore predefinito: 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Note:

- Le espressioni regolari non distinguono tra maiuscole e minuscole e usano le stesse protezioni per le regex sicure delle altre aree di configurazione basate su regex; i pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque le menzioni canoniche tramite `mentionedJids` quando viene toccato il contatto, quindi il valore di ripiego basato sul numero è raramente necessario, ma costituisce un'utile misura di sicurezza.
- La finestra del contesto in sospeso viene determinata secondo `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Comando di attivazione (solo proprietario)

Usare il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo i numeri dei proprietari (provenienti da `channels.whatsapp.allowFrom` oppure, se non impostato, il numero E.164 del bot) possono modificare questa impostazione; `/activation` inviato da chiunque altro viene ignorato e memorizzato solo come contesto. Inviare `/status` come messaggio autonomo nel gruppo per visualizzare la modalità di attivazione corrente.

## Modalità d'uso

1. Aggiungere al gruppo l'account WhatsApp che esegue OpenClaw.
2. Inviare `@openclaw ...` (oppure includere il numero). Solo i mittenti inclusi nell'elenco degli elementi consentiti possono attivarlo, a meno che non venga impostato `groupPolicy: "open"`.
3. Il prompt dell'agente include il contesto di gruppo in sospeso e le righe etichettate con il mittente, affinché possa rivolgersi alla persona corretta.
4. Le direttive di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviarle come messaggi autonomi affinché vengano registrate. La sessione personale dei messaggi diretti rimane indipendente.

## Test/verifica

- Test rapido manuale:
  - Inviare una menzione `@openclaw` nel gruppo e verificare la ricezione di una risposta che faccia riferimento al nome del mittente.
  - Inviare una seconda menzione e verificare che il blocco della cronologia sia incluso e venga poi svuotato al turno successivo.
- Controllare i log del Gateway (eseguire con `--verbose`) per individuare le voci `inbound web message` che mostrano `from: <groupJid>` e il corpo etichettato con il mittente.

## Considerazioni note

- Gli Heartbeat vengono eseguiti nella sessione principale dell'agente; le sessioni di gruppo non ricevono mai esecuzioni Heartbeat.
- La soppressione degli echi memorizza il prompt combinato (cronologia e messaggio corrente) per ogni sessione, in modo che i messaggi consegnati dal bot stesso non lo riattivino; un batch identico e ripetuto può essere ignorato come eco.
- Le voci nell'archivio delle sessioni vengono visualizzate come `agent:<agentId>:whatsapp:group:<jid>` nell'archivio SQLite delle sessioni per agente; l'assenza di una voce indica semplicemente che il gruppo non ha ancora avviato un'esecuzione.
- Gli indicatori di digitazione seguono `session.typingMode` / `agents.defaults.typingMode`. Quando per le risposte visibili viene attivata la modalità basata esclusivamente sullo strumento per i messaggi, la digitazione inizia immediatamente per impostazione predefinita, così i membri del gruppo possono vedere che l'agente sta lavorando anche se non viene pubblicata alcuna risposta finale automatica. La configurazione esplicita della modalità di digitazione mantiene comunque la precedenza.

## Contenuti correlati

- [Gruppi](/it/channels/groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi di trasmissione](/it/channels/broadcast-groups)
