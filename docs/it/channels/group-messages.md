---
read_when:
    - Configurazione specifica dei gruppi WhatsApp
    - Modifica delle modalità di attivazione di WhatsApp (`mention` vs `always`)
    - Regolazione delle chiavi di sessione di gruppo di WhatsApp o del contesto dei messaggi in sospeso
sidebarTitle: WhatsApp groups
summary: Gestione dei messaggi nei gruppi WhatsApp — attivazione, liste consentite, sessioni e iniezione del contesto
title: Messaggi di gruppo di WhatsApp
x-i18n:
    generated_at: "2026-05-06T08:39:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Per il modello dei gruppi multicanale (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), vedi [Gruppi](/it/channels/groups). Questa pagina descrive il comportamento specifico di WhatsApp in aggiunta a quel modello: attivazione, allowlist dei gruppi, chiavi di sessione per gruppo e iniezione del contesto dei messaggi in sospeso.

Obiettivo: consentire a OpenClaw di restare nei gruppi WhatsApp, attivarsi solo quando viene chiamato in causa e mantenere quel thread separato dalla sessione DM personale.

<Note>
`agents.list[].groupChat.mentionPatterns` viene usato anche da Telegram, Discord, Slack e iMessage. Per configurazioni multi-agente, impostalo per ogni agente oppure usa `messages.groupChat.mentionPatterns` come fallback globale.
</Note>

## Comportamento

- Modalità di attivazione: `mention` (predefinita) o `always`. `mention` richiede un richiamo esplicito (vere @-mention WhatsApp tramite `mentionedJids`, pattern regex sicuri o il numero E.164 del bot in qualsiasi punto del testo). `always` attiva l'agente a ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere valore significativo; altrimenti restituisce il token silenzioso esatto `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sovrascritti per gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funge anche da allowlist dei gruppi (includi `"*"` per consentirli tutti).
- Criterio dei gruppi: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo vengono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno la forma `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on`, `/trace on` o `/think high` (inviati come messaggi autonomi) sono limitati a quel gruppo; lo stato dei DM personali resta invariato. Gli Heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo in sospeso** (predefinito 50) che _non_ hanno attivato un'esecuzione vengono prefissati sotto `[Chat messages since your last reply - for context]`, con la riga di attivazione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reinseriti.
- Esposizione del mittente: ogni batch di gruppo ora termina con `[from: Sender Name (+E164)]`, così Pi sa chi sta parlando.
- Effimeri/visualizzabili una volta: li estraiamo prima di ricavare testo/mention, quindi i richiami al loro interno attivano comunque.
- Prompt di sistema del gruppo: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia la modalità) inseriamo nel prompt di sistema una breve descrizione come `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Se i metadati non sono disponibili, diciamo comunque all'agente che si tratta di una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` in modo che i richiami tramite nome visualizzato funzionino anche quando WhatsApp rimuove la `@` visiva dal corpo del testo:

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

- Le regex non distinguono maiuscole/minuscole e usano le stesse protezioni safe-regex delle altre superfici regex di configurazione; i pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque mention canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero è raramente necessario, ma è un'utile rete di sicurezza.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure il numero E.164 del bot quando non è impostato) può modificarlo. Invia `/status` come messaggio autonomo nel gruppo per vedere la modalità di attivazione corrente.

## Come si usa

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (o includi il numero). Solo i mittenti nella allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell'agente includerà il contesto recente del gruppo più il marker finale `[from: …]`, così potrà rivolgersi alla persona corretta.
4. Le direttive a livello di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi autonomi perché vengano registrate. La tua sessione DM personale resta indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia un richiamo `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia un secondo richiamo e verifica che il blocco della cronologia venga incluso e poi cancellato al turno successivo.
- Controlla i log del Gateway (esegui con `--verbose`) per vedere voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli Heartbeat vengono saltati intenzionalmente per i gruppi, per evitare broadcast rumorosi.
- La soppressione degli echo usa la stringa combinata del batch; se invii lo stesso testo due volte senza mention, solo il primo riceverà una risposta.
- Le voci dello store delle sessioni appariranno come `agent:<agentId>:whatsapp:group:<jid>` nello store delle sessioni (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); una voce mancante significa semplicemente che il gruppo non ha ancora attivato un'esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode`. Quando le risposte visibili usano la modalità predefinita solo strumento messaggi, la digitazione inizia immediatamente per impostazione predefinita, così i membri del gruppo possono vedere che l'agente sta lavorando anche se non viene pubblicata alcuna risposta finale automatica. La configurazione esplicita della modalità di digitazione ha comunque la precedenza.

## Correlati

- [Gruppi](/it/channels/groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi broadcast](/it/channels/broadcast-groups)
