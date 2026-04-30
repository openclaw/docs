---
read_when:
    - Modifica delle regole dei messaggi di gruppo o delle menzioni
summary: Comportamento e configurazione per la gestione dei messaggi dei gruppi WhatsApp (mentionPatterns sono condivisi tra le superfici)
title: Messaggi di gruppo
x-i18n:
    generated_at: "2026-04-30T08:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Obiettivo: consentire a Clawd di restare nei gruppi WhatsApp, attivarsi solo quando viene chiamato, e mantenere quel thread separato dalla sessione DM personale.

<Note>
`agents.list[].groupChat.mentionPatterns` è usato anche da Telegram, Discord, Slack e iMessage. Questo documento si concentra sul comportamento specifico di WhatsApp. Per configurazioni multi-agente, imposta `agents.list[].groupChat.mentionPatterns` per agente, oppure usa `messages.groupChat.mentionPatterns` come fallback globale.
</Note>

## Implementazione attuale (2025-12-03)

- Modalità di attivazione: `mention` (predefinita) o `always`. `mention` richiede un richiamo (vere @-menzioni WhatsApp tramite `mentionedJids`, pattern regex sicuri, oppure l’E.164 del bot ovunque nel testo). `always` attiva l’agente a ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere valore significativo; altrimenti restituisce il token silenzioso esatto `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sovrascritti per gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funge anche da allowlist dei gruppi (includi `"*"` per consentirli tutti).
- Criterio di gruppo: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo sono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno la forma `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on`, `/trace on` o `/think high` (inviati come messaggi autonomi) sono circoscritti a quel gruppo; lo stato dei DM personali resta invariato. Gli Heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo in sospeso** (predefinito 50) che _non_ hanno attivato un’esecuzione sono prefissati sotto `[Chat messages since your last reply - for context]`, con la riga di attivazione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reiniettati.
- Esposizione del mittente: ogni batch di gruppo ora termina con `[from: Sender Name (+E164)]`, così Pi sa chi sta parlando.
- Effimeri/visualizza una volta: li estraiamo prima di ricavare testo/menzioni, quindi i richiami al loro interno continuano ad attivare.
- Prompt di sistema del gruppo: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia modalità) iniettiamo nel prompt di sistema una breve nota come `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se i metadati non sono disponibili, comunichiamo comunque all’agente che si tratta di una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` così i richiami tramite nome visualizzato funzionano anche quando WhatsApp rimuove la `@` visiva nel corpo del testo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Note:

- Le regex non distinguono maiuscole/minuscole e usano le stesse protezioni safe-regex delle altre superfici regex di configurazione; pattern non validi e ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque le menzioni canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero è raramente necessario ma è una rete di sicurezza utile.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure l’E.164 del bot stesso quando non impostato) può modificarlo. Invia `/status` come messaggio autonomo nel gruppo per vedere la modalità di attivazione corrente.

## Come usare

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (oppure includi il numero). Solo i mittenti in allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell’agente includerà il contesto recente del gruppo più il marker finale `[from: …]`, così potrà rivolgersi alla persona corretta.
4. Le direttive a livello di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi autonomi affinché vengano registrate. La tua sessione DM personale resta indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia un richiamo `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia un secondo richiamo e verifica che il blocco cronologia venga incluso, poi cancellato al turno successivo.
- Controlla i log del Gateway (esegui con `--verbose`) per vedere voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli Heartbeat vengono saltati intenzionalmente per i gruppi, per evitare broadcast rumorosi.
- La soppressione degli echo usa la stringa batch combinata; se invii due volte un testo identico senza menzioni, solo il primo riceverà una risposta.
- Le voci nello store delle sessioni appariranno come `agent:<agentId>:whatsapp:group:<jid>` nello store delle sessioni (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); una voce mancante significa semplicemente che il gruppo non ha ancora attivato un’esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode`. Quando le risposte visibili usano la modalità predefinita solo message-tool, la digitazione inizia immediatamente per impostazione predefinita, così i membri del gruppo possono vedere che l’agente sta lavorando anche se non viene pubblicata alcuna risposta finale automatica. La configurazione esplicita della modalità di digitazione ha comunque la precedenza.

## Correlati

- [Gruppi](/it/channels/groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi di broadcast](/it/channels/broadcast-groups)
