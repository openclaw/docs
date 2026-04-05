---
read_when:
    - Avvio di una nuova sessione agente OpenClaw
    - Abilitazione o audit delle Skills predefinite
summary: Istruzioni predefinite dell'agente OpenClaw ed elenco delle Skills per la configurazione dell'assistente personale
title: AGENTS.md predefinito
x-i18n:
    generated_at: "2026-04-05T14:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistente personale OpenClaw (predefinito)

## Prima esecuzione (consigliata)

OpenClaw usa una directory di workspace dedicata per l'agente. Predefinita: `~/.openclaw/workspace` (configurabile tramite `agents.defaults.workspace`).

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

3. Facoltativo: se vuoi l'elenco Skills dell'assistente personale, sostituisci AGENTS.md con questo file:

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

- Non riversare directory o secret nella chat.
- Non eseguire comandi distruttivi a meno che non venga richiesto esplicitamente.
- Non inviare risposte parziali/in streaming a superfici di messaggistica esterne (solo risposte finali).

## Avvio della sessione (obbligatorio)

- Leggi `SOUL.md`, `USER.md` e oggi+ieri in `memory/`.
- Leggi `MEMORY.md` quando presente; usa il fallback a `memory.md` minuscolo solo quando `MEMORY.md` è assente.
- Fallo prima di rispondere.

## Soul (obbligatorio)

- `SOUL.md` definisce identità, tono e limiti. Tienilo aggiornato.
- Se modifichi `SOUL.md`, dillo all'utente.
- Sei una nuova istanza a ogni sessione; la continuità vive in questi file.

## Spazi condivisi (consigliato)

- Non sei la voce dell'utente; fai attenzione nelle chat di gruppo o nei canali pubblici.
- Non condividere dati privati, informazioni di contatto o note interne.

## Sistema di memoria (consigliato)

- Log giornaliero: `memory/YYYY-MM-DD.md` (crea `memory/` se necessario).
- Memoria a lungo termine: `MEMORY.md` per fatti durevoli, preferenze e decisioni.
- `memory.md` minuscolo è solo un fallback legacy; non mantenere intenzionalmente entrambi i file nella radice.
- All'avvio della sessione, leggi oggi + ieri + `MEMORY.md` quando presente, altrimenti `memory.md`.
- Cattura: decisioni, preferenze, vincoli, questioni aperte.
- Evita i secret a meno che non venga richiesto esplicitamente.

## Strumenti e Skills

- Gli strumenti vivono nelle Skills; segui `SKILL.md` di ogni Skill quando ti serve.
- Mantieni le note specifiche dell'ambiente in `TOOLS.md` (Note per le Skills).

## Suggerimento per il backup (consigliato)

Se tratti questo workspace come la “memoria” di Clawd, rendilo un repo git (idealmente privato) così `AGENTS.md` e i tuoi file di memoria vengono salvati.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Facoltativo: aggiungi un remote privato + push
```

## Cosa fa OpenClaw

- Esegue il gateway WhatsApp + l'agente di coding Pi in modo che l'assistente possa leggere/scrivere chat, recuperare contesto ed eseguire Skills tramite il Mac host.
- L'app macOS gestisce i permessi (registrazione schermo, notifiche, microfono) ed espone la CLI `openclaw` tramite il suo binario incluso.
- Le chat dirette confluiscono per impostazione predefinita nella sessione `main` dell'agente; i gruppi restano isolati come `agent:<agentId>:<channel>:group:<id>` (stanze/canali: `agent:<agentId>:<channel>:channel:<id>`); gli heartbeat mantengono attive le attività in background.

## Skills core (abilitale in Impostazioni → Skills)

- **mcporter** — Runtime/server strumenti e CLI per gestire backend Skills esterni.
- **Peekaboo** — Screenshot rapidi su macOS con analisi facoltativa tramite AI vision.
- **camsnap** — Cattura frame, clip o avvisi di movimento da videocamere di sicurezza RTSP/ONVIF.
- **oracle** — CLI agente pronta per OpenAI con replay di sessione e controllo del browser.
- **eightctl** — Controlla il tuo sonno, dal terminale.
- **imsg** — Invia, leggi e trasmetti in streaming iMessage e SMS.
- **wacli** — CLI WhatsApp: sincronizza, cerca, invia.
- **discord** — Azioni Discord: reazioni, sticker, sondaggi. Usa target `user:<id>` o `channel:<id>` (gli id numerici senza prefisso sono ambigui).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Client Spotify da terminale per cercare/mettere in coda/controllare la riproduzione.
- **sag** — Speech ElevenLabs con UX in stile say su Mac; per impostazione predefinita trasmette agli speaker.
- **Sonos CLI** — Controlla speaker Sonos (discovery/stato/riproduzione/volume/raggruppamento) dagli script.
- **blucli** — Riproduci, raggruppa e automatizza lettori BluOS dagli script.
- **OpenHue CLI** — Controllo dell'illuminazione Philips Hue per scene e automazioni.
- **OpenAI Whisper** — Speech-to-text locale per dettatura rapida e trascrizioni di messaggi vocali.
- **Gemini CLI** — Modelli Google Gemini dal terminale per domande e risposte rapide.
- **agent-tools** — Toolkit di utilità per automazioni e script di supporto.

## Note d'uso

- Preferisci la CLI `openclaw` per gli script; l'app Mac gestisce i permessi.
- Esegui le installazioni dalla scheda Skills; nasconde il pulsante se un binario è già presente.
- Mantieni gli heartbeat abilitati così l'assistente può pianificare promemoria, monitorare inbox e attivare catture della fotocamera.
- La UI Canvas viene eseguita a schermo intero con overlay nativi. Evita di posizionare controlli critici negli angoli alto-sinistra/alto-destra o lungo i bordi inferiori; aggiungi margini espliciti nel layout e non fare affidamento sugli inset di safe area.
- Per la verifica guidata dal browser, usa `openclaw browser` (tabs/status/screenshot) con il profilo Chrome gestito da OpenClaw.
- Per l'ispezione del DOM, usa `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando ti serve output leggibile da macchina).
- Per le interazioni, usa `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type richiedono riferimenti snapshot; usa `evaluate` per selettori CSS).
