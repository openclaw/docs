---
read_when:
    - Modifica delle regole dei messaggi di gruppo o delle menzioni
summary: Comportamento e configurazione per la gestione dei messaggi di gruppo di WhatsApp (`mentionPatterns` sono condivisi tra le superfici)
title: Messaggi di gruppo
x-i18n:
    generated_at: "2026-04-05T13:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Messaggi di gruppo (canale web di WhatsApp)

Obiettivo: consentire a Clawd di stare nei gruppi WhatsApp, attivarsi solo quando viene chiamato e mantenere quel thread separato dalla sessione DM personale.

Nota: `agents.list[].groupChat.mentionPatterns` ora è usato anche da Telegram/Discord/Slack/iMessage; questa documentazione si concentra sul comportamento specifico di WhatsApp. Per le configurazioni multi-agente, imposta `agents.list[].groupChat.mentionPatterns` per agente (oppure usa `messages.groupChat.mentionPatterns` come fallback globale).

## Implementazione attuale (2025-12-03)

- Modalità di attivazione: `mention` (predefinita) o `always`. `mention` richiede una chiamata (vere @-menzioni di WhatsApp tramite `mentionedJids`, pattern regex sicuri o il numero E.164 del bot in qualsiasi punto del testo). `always` attiva l'agente a ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere un valore significativo; altrimenti restituisce l'esatto token silenzioso `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sovrascritti per gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funge anche da allowlist dei gruppi (includi `"*"` per consentire tutti).
- Criterio di gruppo: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo sono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno il formato `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on` o `/think high` (inviati come messaggi autonomi) sono limitati a quel gruppo; lo stato dei DM personali non viene toccato. Gli heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo pendenti** (predefinito 50) che _non_ hanno attivato un'esecuzione vengono prefissati sotto `[Chat messages since your last reply - for context]`, con la riga di attivazione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reiniettati.
- Visibilità del mittente: ogni batch di gruppo ora termina con `[from: Nome Mittente (+E164)]`, così Pi sa chi sta parlando.
- Effimeri/view-once: li decomprimiamo prima di estrarre testo/menzioni, quindi anche le chiamate al loro interno attivano comunque l'agente.
- Prompt di sistema del gruppo: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia modalità) iniettiamo un breve testo nel prompt di sistema, ad esempio `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se i metadati non sono disponibili, indichiamo comunque all'agente che si tratta di una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` in modo che le chiamate tramite nome visualizzato funzionino anche quando WhatsApp rimuove il simbolo visivo `@` dal corpo del testo:

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
- WhatsApp invia comunque menzioni canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero è raramente necessario ma rappresenta una rete di sicurezza utile.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure il numero E.164 del bot se non impostato) può modificarlo. Invia `/status` come messaggio autonomo nel gruppo per vedere la modalità di attivazione corrente.

## Come usarlo

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (oppure includi il numero). Solo i mittenti presenti nell'allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell'agente includerà il contesto recente del gruppo più il marcatore finale `[from: …]`, così potrà rivolgersi alla persona giusta.
4. Le direttive a livello di sessione (`/verbose on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi autonomi in modo che vengano registrate. La tua sessione DM personale resta indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia una chiamata `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia una seconda chiamata e verifica che il blocco della cronologia venga incluso e poi cancellato al turno successivo.
- Controlla i log del gateway (esegui con `--verbose`) per vedere le voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli heartbeat vengono intenzionalmente saltati per i gruppi per evitare trasmissioni rumorose.
- La soppressione dell'eco usa la stringa batch combinata; se invii due volte lo stesso testo senza menzioni, solo il primo riceverà una risposta.
- Le voci dell'archivio sessioni appariranno come `agent:<agentId>:whatsapp:group:<jid>` nell'archivio sessioni (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); l'assenza di una voce significa solo che il gruppo non ha ancora attivato un'esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode` (predefinito: `message` quando non menzionato).
