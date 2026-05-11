---
read_when:
    - Hai utilizzato il vecchio canale BlueBubbles e devi passare a iMessage
    - Stai scegliendo la configurazione supportata di OpenClaw per iMessage
    - Ti serve una breve spiegazione della rimozione di BlueBubbles
summary: Il supporto per BlueBubbles è stato rimosso da OpenClaw. Utilizza il Plugin iMessage incluso con imsg per le nuove configurazioni iMessage e per quelle migrate.
title: Rimozione di BlueBubbles e percorso imsg per iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Rimozione di BlueBubbles e percorso iMessage tramite imsg

OpenClaw non distribuisce più il canale BlueBubbles. Il supporto iMessage ora passa attraverso il plugin `imessage` incluso, che avvia [`imsg`](https://github.com/steipete/imsg) localmente o tramite un wrapper SSH e comunica in JSON-RPC su stdin/stdout.

Se la tua configurazione contiene ancora `channels.bluebubbles`, migrala a `channels.imessage`. Il vecchio URL della documentazione `/channels/bluebubbles` reindirizza a [Provenienza da BlueBubbles](/it/channels/imessage-from-bluebubbles), che contiene la tabella completa di traduzione della configurazione e la checklist di cutover.

## Cosa è cambiato

- Nel percorso iMessage supportato da OpenClaw non ci sono server HTTP BlueBubbles, route webhook, password REST o runtime del plugin BlueBubbles.
- OpenClaw legge e osserva Messages tramite `imsg` sul Mac in cui Messages.app ha effettuato l’accesso.
- Invio, ricezione, cronologia e media di base usano le normali superfici `imsg` e i permessi macOS.
- Azioni avanzate come risposte in thread, tapback, modifica, annullamento dell’invio, effetti, conferme di lettura, indicatori di digitazione e gestione dei gruppi richiedono `imsg launch` con il bridge API privato disponibile.
- I Gateway Linux e Windows possono ancora usare iMessage impostando `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` sul Mac con accesso effettuato.

## Cosa fare

1. Installa e verifica `imsg` sul Mac con Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Concedi i permessi Accesso completo al disco e Automazione al contesto di processo che esegue `imsg` e OpenClaw.

3. Traduci la vecchia configurazione:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Riavvia il Gateway e verifica:

   ```bash
   openclaw channels status --probe
   ```

5. Testa DM, gruppi, allegati e qualsiasi azione API privata da cui dipendi prima di eliminare il vecchio server BlueBubbles.

## Note di migrazione

- `channels.bluebubbles.serverUrl` e `channels.bluebubbles.password` non hanno equivalenti iMessage.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, radici degli allegati, limiti di dimensione dei media, chunking e toggle delle azioni hanno equivalenti iMessage.
- `channels.imessage.includeAttachments` è ancora disattivato per impostazione predefinita. Impostalo esplicitamente se prevedi che foto, memo vocali, video o file in ingresso raggiungano l’agente.
- Con `groupPolicy: "allowlist"`, copia il vecchio blocco `groups`, inclusa qualsiasi voce wildcard `"*"`. Le allowlist dei mittenti dei gruppi e il registro dei gruppi sono gate separati.
- I binding ACP che corrispondevano a `channel: "bluebubbles"` devono essere modificati in `channel: "imessage"`.
- Le vecchie chiavi di sessione BlueBubbles non diventano chiavi di sessione iMessage. Le approvazioni di abbinamento vengono trasferite per handle, ma la cronologia delle conversazioni sotto le chiavi di sessione BlueBubbles no.

## Vedi anche

- [Provenienza da BlueBubbles](/it/channels/imessage-from-bluebubbles)
- [iMessage](/it/channels/imessage)
- [Riferimento di configurazione - iMessage](/it/gateway/config-channels#imessage)
