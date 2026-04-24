---
read_when:
    - Modificare le regole dei messaggi di gruppo o delle menzioni
summary: Comportamento e configurazione per la gestione dei messaggi di gruppo WhatsApp (`mentionPatterns` è condiviso tra le varie superfici)
title: Messaggi di gruppo
x-i18n:
    generated_at: "2026-04-24T08:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Messaggi di gruppo (canale web WhatsApp)

Obiettivo: permettere a Clawd di stare nei gruppi WhatsApp, attivarsi solo quando viene chiamato e mantenere quel thread separato dalla sessione DM personale.

Nota: `agents.list[].groupChat.mentionPatterns` ora viene usato anche da Telegram/Discord/Slack/iMessage; questa documentazione si concentra sul comportamento specifico di WhatsApp. Per configurazioni multi-agente, imposta `agents.list[].groupChat.mentionPatterns` per agente (oppure usa `messages.groupChat.mentionPatterns` come fallback globale).

## Implementazione attuale (2025-12-03)

- Modalità di attivazione: `mention` (predefinita) oppure `always`. `mention` richiede una chiamata diretta (vere @-mention di WhatsApp tramite `mentionedJids`, pattern regex sicuri o il numero E.164 del bot in qualsiasi punto del testo). `always` attiva l’agente a ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere un valore significativo; altrimenti restituisce l’esatto token silenzioso `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sostituiti per singolo gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funge anche da allowlist dei gruppi (includi `"*"` per consentirli tutti).
- Policy dei gruppi: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo sono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno la forma `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on`, `/trace on` o `/think high` (inviati come messaggi autonomi) sono limitati a quel gruppo; lo stato dei DM personali non viene toccato. Gli Heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo in sospeso** (predefinito 50) che _non_ hanno attivato un’esecuzione vengono anteposti sotto `[Chat messages since your last reply - for context]`, con la riga che ha attivato l’esecuzione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reinseriti.
- Esposizione del mittente: ogni batch di gruppo ora termina con `[from: Sender Name (+E164)]` così Pi sa chi sta parlando.
- Effimeri/view-once: li scartiamo dal wrapper prima di estrarre testo/menzioni, quindi le chiamate dirette al loro interno attivano comunque l’agente.
- Prompt di sistema per i gruppi: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia modalità) inseriamo un breve testo nel prompt di sistema come `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se i metadati non sono disponibili, diciamo comunque all’agente che si trova in una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` così le chiamate dirette tramite nome visualizzato funzionano anche quando WhatsApp rimuove il simbolo `@` visivo dal corpo del testo:

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

- Le regex non distinguono tra maiuscole e minuscole e usano le stesse protezioni safe-regex delle altre superfici regex di configurazione; i pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque menzioni canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero raramente è necessario, ma è una rete di sicurezza utile.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure il numero E.164 del bot se non impostato) può modificarlo. Invia `/status` come messaggio autonomo nel gruppo per vedere la modalità di attivazione corrente.

## Come si usa

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (oppure includi il numero). Solo i mittenti in allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell’agente includerà il contesto recente del gruppo più il marcatore finale `[from: …]`, così potrà rivolgersi alla persona giusta.
4. Le direttive a livello di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi autonomi affinché vengano registrate. La tua sessione DM personale rimane indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia una chiamata diretta `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia una seconda chiamata diretta e verifica che il blocco della cronologia venga incluso e poi cancellato al turno successivo.
- Controlla i log del gateway (esegui con `--verbose`) per vedere le voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli Heartbeat vengono intenzionalmente saltati per i gruppi per evitare broadcast rumorosi.
- La soppressione dell’eco usa la stringa batch combinata; se invii due volte lo stesso testo senza menzioni, solo il primo riceverà una risposta.
- Le voci dell’archivio sessioni appariranno come `agent:<agentId>:whatsapp:group:<jid>` nell’archivio sessioni (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); una voce mancante significa solo che il gruppo non ha ancora attivato un’esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode` (predefinito: `message` quando non c’è menzione).

## Correlati

- [Groups](/it/channels/groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi broadcast](/it/channels/broadcast-groups)
