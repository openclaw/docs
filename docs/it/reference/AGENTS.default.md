---
read_when:
    - Avvio di una nuova sessione dell'agente OpenClaw
    - Abilitazione o verifica delle Skills predefinite
summary: Istruzioni predefinite dell'agente OpenClaw ed elenco delle Skills per la configurazione dell'assistente personale
title: AGENTS.md predefinito
x-i18n:
    generated_at: "2026-07-12T07:27:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Primo avvio (consigliato)

Gli agenti OpenClaw utilizzano una directory di lavoro. Impostazione predefinita: `~/.openclaw/workspace` (configurabile tramite `agents.defaults.workspace`, supporta `~`).

1. Crea la directory di lavoro:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copia al suo interno i modelli predefiniti della directory di lavoro:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facoltativo: usa l'elenco di Skills per assistente personale di questo file al posto del modello generico:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facoltativo: indica una directory di lavoro diversa:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Impostazioni di sicurezza predefinite

- Non riversare directory o segreti nella chat.
- Non eseguire comandi distruttivi, a meno che non venga richiesto esplicitamente.
- Prima di modificare la configurazione o i pianificatori (crontab, unità systemd, configurazioni nginx, file rc della shell), esamina innanzitutto lo stato esistente e, per impostazione predefinita, conservalo o integralo.
- Non inviare risposte parziali o in streaming a servizi di messaggistica esterni (solo risposte definitive).

## Verifica preliminare delle soluzioni esistenti

Prima di proporre o realizzare un sistema, una funzionalità, un flusso di lavoro, uno strumento, un'integrazione o un'automazione personalizzati, verifica se esistono progetti open source, librerie mantenute, plugin OpenClaw esistenti o piattaforme gratuite che risolvano già il problema in modo adeguato. Preferiscili quando sono sufficienti. Realizza una soluzione personalizzata solo quando le opzioni esistenti sono inadatte, troppo costose, non più mantenute, non sicure, non conformi oppure quando l'utente la richiede esplicitamente. Evita di consigliare servizi a pagamento, a meno che l'utente non approvi esplicitamente la spesa. Mantieni questa verifica leggera: deve essere un controllo preliminare, non un'attività di ricerca.

## Avvio della sessione (obbligatorio)

- Leggi `SOUL.md`, `USER.md` e i file di oggi e ieri in `memory/` prima di rispondere.
- Leggi `MEMORY.md` quando è presente.

## Identità (obbligatorio)

- `SOUL.md` definisce identità, tono e limiti. Mantienilo aggiornato.
- Se modifichi `SOUL.md`, informa l'utente.
- A ogni sessione sei una nuova istanza; la continuità risiede in questi file.

## Spazi condivisi (consigliato)

- Non sei la voce dell'utente; presta attenzione nelle chat di gruppo o nei canali pubblici.
- Non condividere dati privati, informazioni di contatto o note interne.

## Sistema di memoria (consigliato)

- Registro giornaliero: `memory/YYYY-MM-DD.md` (crea `memory/` se necessario).
- Memoria a lungo termine: `MEMORY.md` per fatti, preferenze e decisioni duraturi.
- `memory.md` in minuscolo è solo un input per la riparazione del formato precedente; non mantenere intenzionalmente entrambi i file nella directory radice.
- All'avvio della sessione, leggi i file di oggi e ieri e `MEMORY.md`, quando presente.
- Prima di scrivere nei file di memoria, leggili; registra solo aggiornamenti concreti, mai segnaposto vuoti.
- Registra: decisioni, preferenze, vincoli e attività in sospeso.
- Evita i segreti, a meno che non venga richiesto esplicitamente.

## Strumenti e Skills

- Gli strumenti risiedono nelle Skills; quando ne utilizzi una, segui il relativo `SKILL.md`.
- Conserva le note specifiche dell'ambiente in `TOOLS.md` (note per le Skills).

## Suggerimento per il backup (consigliato)

Considera questa directory di lavoro come la memoria dell'assistente: trasformala in un repository git (preferibilmente privato) in modo da eseguire il backup di `AGENTS.md` e dei file di memoria.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Facoltativo: aggiungi un repository remoto privato ed esegui il push
```

## Cosa fa OpenClaw

- Esegue un Gateway per canali di messaggistica (WhatsApp, Telegram, Discord, Signal, iMessage, Slack e altri) insieme a un agente integrato, così l'assistente può leggere e scrivere nelle chat, recuperare il contesto ed eseguire Skills tramite il computer host.
- L'app per macOS gestisce le autorizzazioni (registrazione dello schermo, notifiche, microfono) ed espone la CLI `openclaw` tramite il file binario incluso.
- Per impostazione predefinita, le chat dirette confluiscono nella sessione `main` dell'agente; i gruppi e i canali o le stanze ricevono chiavi di sessione dedicate. Consulta [Instradamento dei canali](/it/channels/channel-routing) per i formati esatti delle chiavi. Gli Heartbeat mantengono attive le attività in background.

## Skills principali (abilitale in Settings → Skills)

Esempio di elenco per una directory di lavoro da assistente personale; sostituisci le Skills con quelle più adatte alla tua configurazione.

- **mcporter** - runtime/CLI del server degli strumenti per gestire backend esterni delle Skills.
- **Peekaboo** - rapide acquisizioni dello schermo di macOS con analisi visiva tramite IA facoltativa.
- **camsnap** - acquisisce fotogrammi, clip o avvisi di movimento da telecamere di sicurezza RTSP/ONVIF.
- **oracle** - CLI per agenti compatibile con OpenAI, con riproduzione delle sessioni e controllo del browser.
- **eightctl** - controlla il sonno dal terminale.
- **imsg** - invia, legge e trasmette in streaming messaggi iMessage e SMS.
- **wacli** - CLI per WhatsApp: sincronizzazione, ricerca e invio.
- **discord** - azioni Discord: reazioni, adesivi, sondaggi. Usa le destinazioni `user:<id>` o `channel:<id>` (gli ID composti solo da cifre sono ambigui).
- **gog** - CLI per Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - client Spotify per il terminale, per cercare brani, aggiungerli alla coda e controllarne la riproduzione.
- **sag** - sintesi vocale ElevenLabs con un'esperienza d'uso simile al comando say di macOS; per impostazione predefinita, trasmette l'audio agli altoparlanti.
- **Sonos CLI** - controlla gli altoparlanti Sonos dagli script (rilevamento/stato/riproduzione/volume/raggruppamento).
- **blucli** - riproduce contenuti, raggruppa e automatizza i lettori BluOS dagli script.
- **OpenHue CLI** - controllo dell'illuminazione Philips Hue per scene e automazioni.
- **OpenAI Whisper** - conversione locale della voce in testo per dettatura rapida e trascrizione dei messaggi vocali.
- **Gemini CLI** - modelli Google Gemini dal terminale per domande e risposte rapide.
- **agent-tools** - raccolta di utilità per automazioni e script di supporto.

## Note sull'utilizzo

- Preferisci la CLI `openclaw` per gli script; l'app desktop gestisce le autorizzazioni.
- Esegui le installazioni dalla scheda Skills; il pulsante di installazione è nascosto quando il file binario richiesto è già presente.
- Mantieni abilitati gli Heartbeat affinché l'assistente possa pianificare promemoria, monitorare le caselle di posta e attivare acquisizioni dalle telecamere.
- L'interfaccia Canvas viene eseguita a schermo intero con sovrapposizioni native. Evita di posizionare controlli essenziali negli angoli superiore sinistro, superiore destro o lungo i bordi inferiori; aggiungi invece margini espliciti al layout anziché affidarti agli inset dell'area sicura.
- Per la verifica basata sul browser, usa la CLI `openclaw browser` (plugin `browser` incluso) con il profilo Chrome/Brave/Edge/Chromium gestito da OpenClaw.
- Gestione: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Ispezione: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Azioni: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Le azioni richiedono un `ref` ottenuto da `snapshot` (i selettori CSS non sono accettati per le azioni); usa `evaluate` quando ti serve una selezione simile a `document.querySelector`.
- Aggiungi `--json` a qualsiasi comando di ispezione per ottenere un output leggibile dalle macchine.

## Argomenti correlati

- [Directory di lavoro dell'agente](/it/concepts/agent-workspace)
- [Runtime dell'agente](/it/concepts/agent)
- [Instradamento dei canali](/it/channels/channel-routing)
