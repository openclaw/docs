---
read_when:
    - Avviare una nuova sessione dell'agente OpenClaw
    - Abilitazione o audit delle Skills predefinite
summary: Istruzioni predefinite dell'agente OpenClaw ed elenco delle Skills per la configurazione dell'assistente personale
title: AGENTS.md predefinito
x-i18n:
    generated_at: "2026-04-30T09:10:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - Assistente personale OpenClaw (predefinito)

## Primo avvio (consigliato)

OpenClaw usa una directory di workspace dedicata per l’agente. Predefinita: `~/.openclaw/workspace` (configurabile tramite `agents.defaults.workspace`).

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

3. Facoltativo: se vuoi l’elenco delle skill dell’assistente personale, sostituisci AGENTS.md con questo file:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facoltativo: scegli un workspace diverso impostando `agents.defaults.workspace` (supporta `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Impostazioni predefinite di sicurezza

- Non riversare directory o segreti nella chat.
- Non eseguire comandi distruttivi a meno che non venga richiesto esplicitamente.
- Non inviare risposte parziali/in streaming a superfici di messaggistica esterne (solo risposte finali).

## Avvio sessione (obbligatorio)

- Leggi `SOUL.md`, `USER.md` e oggi+ieri in `memory/`.
- Leggi `MEMORY.md` quando presente.
- Fallo prima di rispondere.

## Soul (obbligatorio)

- `SOUL.md` definisce identità, tono e limiti. Tienilo aggiornato.
- Se modifichi `SOUL.md`, avvisa l’utente.
- Sei una nuova istanza a ogni sessione; la continuità vive in questi file.

## Spazi condivisi (consigliato)

- Non sei la voce dell’utente; fai attenzione nelle chat di gruppo o nei canali pubblici.
- Non condividere dati privati, informazioni di contatto o note interne.

## Sistema di memoria (consigliato)

- Registro giornaliero: `memory/YYYY-MM-DD.md` (crea `memory/` se necessario).
- Memoria a lungo termine: `MEMORY.md` per fatti, preferenze e decisioni duraturi.
- `memory.md` in minuscolo è solo input di riparazione legacy; non mantenere intenzionalmente entrambi i file nella radice.
- All’avvio della sessione, leggi oggi + ieri + `MEMORY.md` quando presente.
- Acquisisci: decisioni, preferenze, vincoli, cicli aperti.
- Evita i segreti salvo richiesta esplicita.

## Strumenti e Skills

- Gli strumenti vivono nelle Skills; segui il `SKILL.md` di ogni skill quando ti serve.
- Mantieni le note specifiche dell’ambiente in `TOOLS.md` (Note per le Skills).

## Suggerimento per il backup (consigliato)

Se tratti questo workspace come la “memoria” di Clawd, rendilo un repo git (idealmente privato) così `AGENTS.md` e i tuoi file di memoria sono salvati.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Cosa fa OpenClaw

- Esegue WhatsApp Gateway + agente di coding Pi così l’assistente può leggere/scrivere chat, recuperare contesto ed eseguire Skills tramite il Mac host.
- L’app macOS gestisce i permessi (registrazione dello schermo, notifiche, microfono) ed espone la CLI `openclaw` tramite il suo binario incluso.
- Le chat dirette confluiscono per impostazione predefinita nella sessione `main` dell’agente; i gruppi restano isolati come `agent:<agentId>:<channel>:group:<id>` (stanze/canali: `agent:<agentId>:<channel>:channel:<id>`); gli Heartbeat mantengono attive le attività in background.

## Skills principali (abilita in Impostazioni → Skills)

- **mcporter** — Runtime/CLI del server strumenti per gestire backend di skill esterni.
- **Peekaboo** — Screenshot macOS rapidi con analisi AI vision facoltativa.
- **camsnap** — Acquisisci fotogrammi, clip o avvisi di movimento da videocamere di sicurezza RTSP/ONVIF.
- **oracle** — CLI agente pronta per OpenAI con replay di sessione e controllo del browser.
- **eightctl** — Controlla il sonno dal terminale.
- **imsg** — Invia, leggi, trasmetti in streaming iMessage e SMS.
- **wacli** — CLI WhatsApp: sincronizza, cerca, invia.
- **discord** — Azioni Discord: reazioni, sticker, sondaggi. Usa target `user:<id>` o `channel:<id>` (gli id numerici senza prefisso sono ambigui).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Client Spotify da terminale per cercare/mettere in coda/controllare la riproduzione.
- **sag** — Sintesi vocale ElevenLabs con UX in stile macOS `say`; trasmette agli altoparlanti per impostazione predefinita.
- **Sonos CLI** — Controlla altoparlanti Sonos (scoperta/stato/riproduzione/volume/raggruppamento) dagli script.
- **blucli** — Riproduci, raggruppa e automatizza lettori BluOS dagli script.
- **OpenHue CLI** — Controllo luci Philips Hue per scene e automazioni.
- **OpenAI Whisper** — Speech-to-text locale per dettatura rapida e trascrizioni di messaggi vocali.
- **Gemini CLI** — Modelli Google Gemini dal terminale per Q&A veloci.
- **agent-tools** — Toolkit di utilità per automazioni e script di supporto.

## Note d’uso

- Preferisci la CLI `openclaw` per gli script; l’app mac gestisce i permessi.
- Esegui le installazioni dalla scheda Skills; nasconde il pulsante se un binario è già presente.
- Mantieni abilitati gli Heartbeat così l’assistente può programmare promemoria, monitorare caselle di posta e attivare acquisizioni dalla videocamera.
- La Canvas UI viene eseguita a schermo intero con overlay nativi. Evita di posizionare controlli critici negli angoli superiore sinistro/superiore destro o nei bordi inferiori; aggiungi gutter espliciti nel layout e non fare affidamento sugli inset della safe area.
- Per la verifica guidata dal browser, usa `openclaw browser` (schede/stato/screenshot) con il profilo Chrome gestito da OpenClaw.
- Per l’ispezione del DOM, usa `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando ti serve output leggibile dalla macchina).
- Per le interazioni, usa `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type richiedono riferimenti snapshot; usa `evaluate` per selettori CSS).

## Correlati

- [Workspace agente](/it/concepts/agent-workspace)
- [Runtime agente](/it/concepts/agent)
