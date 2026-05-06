---
read_when:
    - Avvio di una nuova sessione dell'agente OpenClaw
    - Abilitazione o verifica delle Skills predefinite
summary: Istruzioni predefinite dell'agente OpenClaw ed elenco delle Skills per la configurazione dell'assistente personale
title: AGENTS.md predefinito
x-i18n:
    generated_at: "2026-05-06T09:07:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

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

3. Facoltativo: se vuoi l'elenco delle skill dell'assistente personale, sostituisci AGENTS.md con questo file:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facoltativo: scegli un workspace diverso impostando `agents.defaults.workspace` (supporta `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Impostazioni di sicurezza predefinite

- Non scaricare directory o segreti nella chat.
- Non eseguire comandi distruttivi se non richiesto esplicitamente.
- Non inviare risposte parziali/in streaming a superfici di messaggistica esterne (solo risposte finali).

## Avvio della sessione (obbligatorio)

- Leggi `SOUL.md`, `USER.md` e oggi+ieri in `memory/`.
- Leggi `MEMORY.md` quando presente.
- Fallo prima di rispondere.

## Anima (obbligatorio)

- `SOUL.md` definisce identità, tono e limiti. Mantienilo aggiornato.
- Se modifichi `SOUL.md`, informa l'utente.
- Sei una nuova istanza a ogni sessione; la continuità vive in questi file.

## Spazi condivisi (consigliato)

- Non sei la voce dell'utente; fai attenzione nelle chat di gruppo o nei canali pubblici.
- Non condividere dati privati, informazioni di contatto o note interne.

## Sistema di memoria (consigliato)

- Registro giornaliero: `memory/YYYY-MM-DD.md` (crea `memory/` se necessario).
- Memoria a lungo termine: `MEMORY.md` per fatti, preferenze e decisioni durevoli.
- `memory.md` in minuscolo è solo input di riparazione legacy; non mantenere entrambi i file radice intenzionalmente.
- All'avvio della sessione, leggi oggi + ieri + `MEMORY.md` quando presente.
- Registra: decisioni, preferenze, vincoli, cicli aperti.
- Evita i segreti se non richiesto esplicitamente.

## Strumenti e skill

- Gli strumenti vivono nelle skill; segui il `SKILL.md` di ogni skill quando ne hai bisogno.
- Mantieni le note specifiche dell'ambiente in `TOOLS.md` (Note per Skills).

## Suggerimento di backup (consigliato)

Se tratti questo workspace come la "memoria" di Clawd, rendilo un repository git (idealmente privato) così `AGENTS.md` e i tuoi file di memoria vengono sottoposti a backup.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Cosa fa OpenClaw

- Esegue il gateway WhatsApp + l'agente di coding Pi così l'assistente può leggere/scrivere chat, recuperare contesto ed eseguire skill tramite il Mac host.
- L'app macOS gestisce le autorizzazioni (registrazione dello schermo, notifiche, microfono) ed espone la CLI `openclaw` tramite il binario incluso.
- Le chat dirette confluiscono per impostazione predefinita nella sessione `main` dell'agente; i gruppi restano isolati come `agent:<agentId>:<channel>:group:<id>` (stanze/canali: `agent:<agentId>:<channel>:channel:<id>`); gli Heartbeat mantengono attive le attività in background.

## Skill principali (abilitale in Impostazioni → Skills)

- **mcporter** - Runtime/CLI per server di strumenti per gestire backend di skill esterni.
- **Peekaboo** - Screenshot macOS rapidi con analisi di visione IA opzionale.
- **camsnap** - Acquisisci fotogrammi, clip o avvisi di movimento da videocamere di sicurezza RTSP/ONVIF.
- **oracle** - CLI per agenti pronta per OpenAI con riproduzione della sessione e controllo del browser.
- **eightctl** - Controlla il tuo sonno dal terminale.
- **imsg** - Invia, leggi e trasmetti in streaming iMessage e SMS.
- **wacli** - CLI WhatsApp: sincronizza, cerca, invia.
- **discord** - Azioni Discord: reazioni, sticker, sondaggi. Usa destinazioni `user:<id>` o `channel:<id>` (gli ID numerici senza prefisso sono ambigui).
- **gog** - CLI Google Suite: Gmail, Calendar, Drive, Contatti.
- **spotify-player** - Client Spotify da terminale per cercare/mettere in coda/controllare la riproduzione.
- **sag** - Sintesi vocale ElevenLabs con UX say in stile Mac; trasmette agli altoparlanti per impostazione predefinita.
- **Sonos CLI** - Controlla gli speaker Sonos (rilevamento/stato/riproduzione/volume/raggruppamento) dagli script.
- **blucli** - Riproduci, raggruppa e automatizza player BluOS dagli script.
- **OpenHue CLI** - Controllo dell'illuminazione Philips Hue per scene e automazioni.
- **OpenAI Whisper** - Trascrizione vocale locale per dettatura rapida e trascrizioni della segreteria.
- **Gemini CLI** - Modelli Google Gemini dal terminale per domande e risposte rapide.
- **agent-tools** - Toolkit di utilità per automazioni e script di supporto.

## Note d'uso

- Preferisci la CLI `openclaw` per gli script; l'app Mac gestisce le autorizzazioni.
- Esegui le installazioni dalla scheda Skills; nasconde il pulsante se un binario è già presente.
- Mantieni gli Heartbeat abilitati così l'assistente può programmare promemoria, monitorare caselle di posta e attivare acquisizioni dalla videocamera.
- L'interfaccia Canvas viene eseguita a schermo intero con overlay nativi. Evita di posizionare controlli critici negli angoli in alto a sinistra/in alto a destra o sui bordi inferiori; aggiungi margini espliciti nel layout e non fare affidamento sugli inset dell'area sicura.
- Per la verifica guidata dal browser, usa `openclaw browser` (schede/stato/screenshot) con il profilo Chrome gestito da OpenClaw.
- Per l'ispezione del DOM, usa `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando hai bisogno di output macchina).
- Per le interazioni, usa `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type richiedono riferimenti snapshot; usa `evaluate` per i selettori CSS).

## Correlati

- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Runtime dell'agente](/it/concepts/agent)
