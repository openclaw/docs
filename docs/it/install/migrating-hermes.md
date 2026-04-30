---
read_when:
    - Provieni da Hermes e vuoi conservare la configurazione del modello, i prompt, la memoria e le Skills
    - Vuoi sapere cosa OpenClaw importa automaticamente e cosa resta solo nell'archivio
    - Serve un percorso di migrazione pulito e basato su script (CI, laptop nuovo, automazione)
summary: Migra da Hermes a OpenClaw con un'importazione reversibile con anteprima
title: Migrazione da Hermes
x-i18n:
    generated_at: "2026-04-30T08:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importa lo stato di Hermes tramite un provider di migrazione incluso. Il provider mostra un'anteprima di tutto prima di modificare lo stato, redige i segreti nei piani e nei report e crea un backup verificato prima dell'applicazione.

<Note>
Le importazioni richiedono una configurazione OpenClaw nuova. Se hai già uno stato OpenClaw locale, reimposta prima configurazione, credenziali, sessioni e workspace, oppure usa direttamente `openclaw migrate` con `--overwrite` dopo aver esaminato il piano.
</Note>

## Due modi per importare

<Tabs>
  <Tab title="Procedura guidata di onboarding">
    Il percorso più rapido. La procedura guidata rileva Hermes in `~/.hermes` e mostra un'anteprima prima dell'applicazione.

    ```bash
    openclaw onboard --flow import
    ```

    Oppure indica una sorgente specifica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` per esecuzioni con script o ripetibili. Consulta [`openclaw migrate`](/it/cli/migrate) per il riferimento completo.

    ```bash
    openclaw migrate hermes --dry-run    # solo anteprima
    openclaw migrate apply hermes --yes  # applica saltando la conferma
    ```

    Aggiungi `--from <path>` quando Hermes si trova fuori da `~/.hermes`.

  </Tab>
</Tabs>

## Cosa viene importato

<AccordionGroup>
  <Accordion title="Configurazione del modello">
    - Selezione del modello predefinito da `config.yaml` di Hermes.
    - Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.

  </Accordion>
  <Accordion title="Server MCP">
    Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
  </Accordion>
  <Accordion title="File del workspace">
    - `SOUL.md` e `AGENTS.md` vengono copiati nel workspace dell'agente OpenClaw.
    - `memories/MEMORY.md` e `memories/USER.md` vengono **aggiunti** ai file di memoria OpenClaw corrispondenti invece di sovrascriverli.

  </Accordion>
  <Accordion title="Configurazione della memoria">
    Valori predefiniti della configurazione della memoria per la memoria su file di OpenClaw. I provider di memoria esterni, come Honcho, vengono registrati come elementi di archivio o di revisione manuale, così puoi spostarli deliberatamente.
  </Accordion>
  <Accordion title="Skills">
    Le Skills con un file `SKILL.md` sotto `skills/<name>/` vengono copiate, insieme ai valori di configurazione per singola Skill da `skills.config`.
  </Accordion>
  <Accordion title="Chiavi API (opzionale)">
    Imposta `--include-secrets` per importare le chiavi `.env` supportate: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Senza il flag, i segreti non vengono mai copiati.
  </Accordion>
</AccordionGroup>

## Cosa resta solo in archivio

Il provider copia questi elementi nella directory del report di migrazione per la revisione manuale, ma **non** li carica nella configurazione o nelle credenziali OpenClaw attive:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw rifiuta di eseguire o considerare attendibile automaticamente questo stato perché i formati e le assunzioni di fiducia possono divergere tra sistemi. Sposta manualmente ciò che ti serve dopo aver esaminato l'archivio.

## Flusso consigliato

<Steps>
  <Step title="Visualizza l'anteprima del piano">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Il piano elenca tutto ciò che cambierà, inclusi conflitti, elementi saltati ed eventuali elementi sensibili. L'output del piano redige le chiavi annidate che sembrano segreti.

  </Step>
  <Step title="Applica con backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea e verifica un backup prima dell'applicazione. Se devi importare chiavi API, aggiungi `--include-secrets`.

  </Step>
  <Step title="Esegui doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/it/gateway/doctor) riapplica eventuali migrazioni di configurazione in sospeso e controlla i problemi introdotti durante l'importazione.

  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Conferma che il Gateway sia integro e che il modello, la memoria e le Skills importati siano caricati.

  </Step>
</Steps>

## Gestione dei conflitti

L'applicazione rifiuta di continuare quando il piano segnala conflitti (un file o un valore di configurazione esiste già nella destinazione).

<Warning>
Riesegui con `--overwrite` solo quando la sostituzione della destinazione esistente è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory del report di migrazione.
</Warning>

Per un'installazione OpenClaw nuova, i conflitti sono insoliti. In genere compaiono quando riesegui l'importazione su una configurazione che contiene già modifiche dell'utente.

Se emerge un conflitto durante l'applicazione (ad esempio una race imprevista su un file di configurazione), Hermes contrassegna gli elementi di configurazione dipendenti rimanenti come `skipped` con motivo `blocked by earlier apply conflict` invece di scriverli parzialmente. Il report di migrazione registra ogni elemento bloccato, così puoi risolvere il conflitto originale e rieseguire l'importazione.

## Segreti

I segreti non vengono mai importati per impostazione predefinita.

- Esegui prima `openclaw migrate apply hermes --yes` per importare lo stato non segreto.
- Se vuoi anche copiare le chiavi `.env` supportate, riesegui con `--include-secrets`.
- Per le credenziali gestite da SecretRef, configura la sorgente SecretRef dopo il completamento dell'importazione.

## Output JSON per l'automazione

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` e senza `--yes`, apply stampa il piano e non modifica lo stato. Questa è la modalità più sicura per CI e script condivisi.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="L'applicazione rifiuta con conflitti">
    Ispeziona l'output del piano. Ogni conflitto identifica il percorso sorgente e la destinazione esistente. Decidi per ogni elemento se saltarlo, modificare la destinazione o rieseguire con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes si trova fuori da ~/.hermes">
    Passa `--from /actual/path` (CLI) o `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="L'onboarding rifiuta di importare su una configurazione esistente">
    Le importazioni tramite onboarding richiedono una configurazione nuova. Reimposta lo stato e ripeti l'onboarding, oppure usa direttamente `openclaw migrate apply hermes`, che supporta `--overwrite` e il controllo esplicito del backup.
  </Accordion>
  <Accordion title="Le chiavi API non sono state importate">
    `--include-secrets` è obbligatorio e vengono riconosciute solo le chiavi elencate sopra. Le altre variabili in `.env` vengono ignorate.
  </Accordion>
</AccordionGroup>

## Correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento CLI completo, contratto del plugin e forme JSON.
- [Onboarding](/it/cli/onboard): flusso della procedura guidata e flag non interattivi.
- [Migrazione](/it/install/migrating): spostare un'installazione OpenClaw tra macchine.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo la migrazione.
- [Workspace dell'agente](/it/concepts/agent-workspace): dove si trovano `SOUL.md`, `AGENTS.md` e i file di memoria.
