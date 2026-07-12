---
read_when:
    - Hai usato il vecchio canale BlueBubbles e devi passare a iMessage
    - Stai scegliendo la configurazione di iMessage supportata da OpenClaw
    - Hai bisogno di una breve spiegazione della rimozione di BlueBubbles
summary: Il supporto per BlueBubbles è stato rimosso da OpenClaw. Per le configurazioni iMessage nuove e migrate, usa il plugin iMessage incluso con imsg.
title: Rimozione di BlueBubbles e percorso imsg per iMessage
x-i18n:
    generated_at: "2026-07-12T06:46:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Rimozione di BlueBubbles e percorso iMessage tramite imsg

OpenClaw non include più il canale BlueBubbles. Il supporto per iMessage passa attraverso il plugin `imessage` incluso: il Gateway avvia [`imsg`](https://github.com/steipete/imsg) come processo figlio, localmente o tramite un wrapper SSH, e comunica mediante JSON-RPC su stdin/stdout. Nessun server, nessun webhook, nessuna porta.

Se la configurazione contiene ancora `channels.bluebubbles`, eseguine la migrazione a `channels.imessage`. Il precedente URL della documentazione `/channels/bluebubbles` reindirizza a [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles), che contiene la tabella completa di conversione della configurazione e l'elenco di controllo per il passaggio.

## Modifiche apportate

- Il percorso iMessage supportato non prevede server HTTP BlueBubbles, route webhook, password REST o runtime del plugin BlueBubbles.
- OpenClaw legge e monitora Messaggi tramite `imsg` sul Mac in cui è stato effettuato l'accesso a Messages.app.
- Le funzionalità di base per invio, ricezione, cronologia e contenuti multimediali usano le normali interfacce di `imsg` e le autorizzazioni di macOS.
- Le azioni avanzate (risposte nelle conversazioni, tapback, modifica, annullamento dell'invio, effetti, conferme di lettura, indicatori di digitazione, gestione dei gruppi) richiedono il bridge API privato: esegui `imsg launch`, che richiede la disattivazione di SIP.
- I Gateway Linux e Windows possono comunque usare iMessage impostando `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` sul Mac in cui è stato effettuato l'accesso.

## Procedura

1. Installa e verifica `imsg` sul Mac con Messaggi:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Concedi le autorizzazioni Accesso completo al disco e Automazione al contesto del processo che esegue `imsg` e OpenClaw.

3. Converti la vecchia configurazione:

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

5. Verifica i messaggi diretti, i gruppi, gli allegati e tutte le azioni API private da cui dipendi prima di eliminare il vecchio server BlueBubbles.

## Note sulla migrazione

- `channels.bluebubbles.serverUrl` e `channels.bluebubbles.password` non hanno un equivalente in iMessage: non esiste alcun server da raggiungere o presso cui autenticarsi.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` e `actions.*` mantengono il proprio significato in `channels.imessage`.
- `channels.imessage.includeAttachments` rimane disattivato per impostazione predefinita. Impostalo esplicitamente se prevedi che foto, memo vocali, video o file in entrata raggiungano l'agente.
- Con `groupPolicy: "allowlist"`, copia il vecchio blocco `groups`, inclusa l'eventuale voce jolly `"*"`. Gli elenchi di mittenti consentiti per i gruppi e il registro dei gruppi sono controlli distinti; un blocco `groups` con voci ma senza un `chat_id` corrispondente (o senza `"*"`) scarta il messaggio durante l'esecuzione, mentre un blocco `groups` vuoto registra un avviso all'avvio, anche se il filtro dei mittenti continua a consentire il passaggio dei messaggi.
- I binding ACP con `match.channel: "bluebubbles"` devono essere modificati in `"imessage"`.
- Le vecchie chiavi di sessione BlueBubbles non diventano chiavi di sessione iMessage. Le approvazioni di abbinamento si basano sugli identificativi dei mittenti, quindi le voci `allowFrom` copiate continuano a funzionare, ma la cronologia delle conversazioni associata alle chiavi di sessione BlueBubbles non viene trasferita.

## Vedi anche

- [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles)
- [iMessage](/it/channels/imessage)
- [Riferimento della configurazione - iMessage](/it/gateway/config-channels#imessage)
