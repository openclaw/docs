---
read_when:
    - Avviare una nuova sessione dell'agente OpenClaw
    - Abilitare o verificare le Skills predefinite
summary: Istruzioni predefinite dell'agente OpenClaw ed elenco delle Skills per la configurazione dell'assistente personale
title: AGENTS.md predefinito
x-i18n:
    generated_at: "2026-04-24T08:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistente personale OpenClaw (predefinito)

## Primo avvio (consigliato)

OpenClaw usa una directory workspace dedicata per l'agente. Predefinita: `~/.openclaw/workspace` (configurabile tramite `agents.defaults.workspace`).

1. Crea il workspace (se non esiste già):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copia i template predefiniti del workspace nel workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facoltativo: se vuoi l'elenco delle Skills dell'assistente personale, sostituisci AGENTS.md con questo file:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facoltativo: scegli un workspace diverso impostando `agents.defaults.workspace` (supporta `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valori predefiniti di sicurezza

- Non scaricare directory o segreti nella chat.
- Non eseguire comandi distruttivi a meno che non venga richiesto esplicitamente.
- Non inviare risposte parziali/in streaming a superfici esterne di messaggistica (solo risposte finali).

## Avvio della sessione (obbligatorio)

- Leggi `SOUL.md`, `USER.md` e oggi+ieri in `memory/`.
- Leggi `MEMORY.md` quando presente.
- Fallo prima di rispondere.

## Soul (obbligatorio)

- `SOUL.md` definisce identità, tono e confini. Mantienilo aggiornato.
- Se modifichi `SOUL.md`, dillo all'utente.
- Sei un'istanza nuova a ogni sessione; la continuità vive in questi file.

## Spazi condivisi (consigliato)

- Non sei la voce dell'utente; fai attenzione nelle chat di gruppo o nei canali pubblici.
- Non condividere dati privati, informazioni di contatto o note interne.

## Sistema di memoria (consigliato)

- Log giornaliero: `memory/YYYY-MM-DD.md` (crea `memory/` se necessario).
- Memoria a lungo termine: `MEMORY.md` per fatti, preferenze e decisioni durevoli.
- `memory.md` in minuscolo è solo input legacy di riparazione; non mantenere intenzionalmente entrambi i file root.
- All'avvio della sessione, leggi oggi + ieri + `MEMORY.md` quando presente.
- Cattura: decisioni, preferenze, vincoli, loop aperti.
- Evita i segreti a meno che non vengano richiesti esplicitamente.

## Strumenti e Skills

- Gli strumenti vivono nelle Skills; segui lo `SKILL.md` di ogni skill quando ti serve.
- Mantieni le note specifiche dell'ambiente in `TOOLS.md` (Note per le Skills).

## Suggerimento per il backup (consigliato)

Se tratti questo workspace come la “memoria” di Clawd, trasformalo in un repo git (idealmente privato) così `AGENTS.md` e i tuoi file di memoria vengono salvati.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Facoltativo: aggiungi un remote privato + push
```

## Cosa fa OpenClaw

- Esegue il gateway WhatsApp + l'agente di coding Pi così l'assistente può leggere/scrivere chat, recuperare contesto ed eseguire Skills tramite il Mac host.
- L'app macOS gestisce i permessi (registrazione schermo, notifiche, microfono) ed espone la CLI `openclaw` tramite il proprio binario incluso.
- Le chat dirette confluiscono nella sessione `main` dell'agente per impostazione predefinita; i gruppi restano isolati come `agent:<agentId>:<channel>:group:<id>` (stanze/canali: `agent:<agentId>:<channel>:channel:<id>`); gli Heartbeat mantengono attive le attività in background.

## Skills core (abilita in Impostazioni → Skills)

- **mcporter** — Runtime/CLI del server di strumenti per gestire backend esterni delle skill.
- **Peekaboo** — Screenshot rapidi su macOS con analisi AI opzionale della visione.
- **camsnap** — Acquisizione di frame, clip o avvisi di movimento da telecamere di sicurezza RTSP/ONVIF.
- **oracle** — CLI dell'agente pronta per OpenAI con replay della sessione e controllo del browser.
- **eightctl** — Controlla il tuo sonno dal terminale.
- **imsg** — Invia, legge e trasmette in streaming iMessage e SMS.
- **wacli** — CLI di WhatsApp: sincronizza, cerca, invia.
- **discord** — Azioni Discord: reazioni, sticker, sondaggi. Usa target `user:<id>` o `channel:<id>` (gli ID numerici semplici sono ambigui).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Client Spotify da terminale per cercare/mettere in coda/controllare la riproduzione.
- **sag** — Speech ElevenLabs con UX in stile say di macOS; per impostazione predefinita trasmette agli altoparlanti.
- **Sonos CLI** — Controlla altoparlanti Sonos (discovery/stato/riproduzione/volume/raggruppamento) da script.
- **blucli** — Riproduci, raggruppa e automatizza player BluOS da script.
- **OpenHue CLI** — Controllo delle luci Philips Hue per scene e automazioni.
- **OpenAI Whisper** — Speech-to-text locale per dettatura rapida e trascrizioni di segreteria telefonica.
- **Gemini CLI** — Modelli Google Gemini dal terminale per domande e risposte rapide.
- **agent-tools** — Toolkit di utilità per automazioni e script helper.

## Note d'uso

- Preferisci la CLI `openclaw` per lo scripting; l'app Mac gestisce i permessi.
- Esegui le installazioni dalla scheda Skills; nasconde il pulsante se un binario è già presente.
- Mantieni gli Heartbeat abilitati così l'assistente può pianificare promemoria, monitorare inbox e attivare acquisizioni dalle telecamere.
- La UI Canvas viene eseguita a schermo intero con overlay nativi. Evita di posizionare controlli critici negli angoli alto-sinistro/alto-destro/lungo i bordi inferiori; aggiungi gutter espliciti nel layout e non fare affidamento sui safe-area inset.
- Per la verifica guidata dal browser, usa `openclaw browser` (tabs/status/screenshot) con il profilo Chrome gestito da OpenClaw.
- Per l'ispezione del DOM, usa `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando ti serve output leggibile dalla macchina).
- Per le interazioni, usa `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type richiedono ref dello snapshot; usa `evaluate` per i selettori CSS).

## Correlati

- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Runtime dell'agente](/it/concepts/agent)
