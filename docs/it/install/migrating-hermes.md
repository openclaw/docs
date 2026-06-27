---
read_when:
    - Arrivi da Hermes e vuoi conservare la configurazione del modello, i prompt, la memoria e le Skills
    - Vuoi sapere cosa importa automaticamente OpenClaw e cosa resta solo nell’archivio
    - Serve un percorso di migrazione pulito e scriptabile (CI, laptop appena configurato, automazione)
summary: Passa da Hermes a OpenClaw con un'importazione reversibile e visualizzata in anteprima
title: Migrazione da Hermes
x-i18n:
    generated_at: "2026-06-27T17:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importa lo stato di Hermes tramite un provider di migrazione incluso. Il provider mostra un'anteprima di tutto prima di modificare lo stato, oscura i segreti nei piani e nei report e crea un backup verificato prima dell'applicazione.

<Note>
Le importazioni richiedono una configurazione OpenClaw nuova. Se hai già uno stato OpenClaw locale, reimposta prima configurazione, credenziali, sessioni e workspace, oppure usa direttamente `openclaw migrate` con `--overwrite` dopo aver esaminato il piano.
</Note>

## Due modi per importare

<Tabs>
  <Tab title="Procedura guidata di onboarding">
    Il percorso più rapido. La procedura guidata rileva Hermes in `~/.hermes` e mostra un'anteprima prima di applicare le modifiche.

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
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
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
    - `memories/MEMORY.md` e `memories/USER.md` vengono **aggiunti in coda** ai file di memoria OpenClaw corrispondenti invece di sovrascriverli.

  </Accordion>
  <Accordion title="Configurazione della memoria">
    Impostazioni predefinite della configurazione della memoria per la memoria su file di OpenClaw. I provider di memoria esterni, come Honcho, vengono registrati come elementi di archivio o di revisione manuale, così puoi spostarli in modo deliberato.
  </Accordion>
  <Accordion title="Skills">
    Le Skills con un file `SKILL.md` in `skills/<name>/` vengono copiate, insieme ai valori di configurazione per singola skill da `skills.config`.
  </Accordion>
  <Accordion title="Credenziali di autenticazione">
    `openclaw migrate` interattivo chiede conferma prima di importare le credenziali di autenticazione, con sì selezionato per impostazione predefinita. Le importazioni accettate includono credenziali OpenAI OAuth di OpenCode da `auth.json` di OpenCode, voci OpenCode e GitHub Copilot da `auth.json` di OpenCode e le [chiavi `.env` supportate](/it/cli/migrate#supported-env-keys). Le voci OAuth di `auth.json` di Hermes sono stato legacy e vengono presentate come lavoro manuale di riautenticazione/doctor invece di essere importate nell'autenticazione live. Usa `--include-secrets` per l'importazione non interattiva delle credenziali con `openclaw migrate`, `--no-auth-credentials` per saltarla, oppure `--import-secrets` dell'onboarding quando importi dalla procedura guidata di onboarding.
  </Accordion>
</AccordionGroup>

## Cosa resta solo nell'archivio

Il provider copia questi elementi nella directory del report di migrazione per la revisione manuale, ma **non** li carica nella configurazione o nelle credenziali OpenClaw live:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw rifiuta di eseguire o considerare attendibile automaticamente questo stato perché i formati e le assunzioni di attendibilità possono divergere tra sistemi. Sposta a mano ciò che ti serve dopo aver esaminato l'archivio.

## Flusso consigliato

<Steps>
  <Step title="Visualizza l'anteprima del piano">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Il piano elenca tutto ciò che cambierà, inclusi conflitti, elementi saltati ed eventuali elementi sensibili. L'output del piano oscura le chiavi annidate che sembrano segreti.

  </Step>
  <Step title="Applica con backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea e verifica un backup prima di applicare le modifiche. Questo esempio non interattivo importa stato non segreto. Esegui senza `--yes` per rispondere alla richiesta sulle credenziali, oppure aggiungi `--include-secrets` per includere le credenziali supportate nelle esecuzioni non presidiate.

  </Step>
  <Step title="Esegui doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/it/gateway/doctor) riapplica eventuali migrazioni di configurazione in sospeso e verifica la presenza di problemi introdotti durante l'importazione.

  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Conferma che il gateway sia integro e che il modello, la memoria e le skill importati siano caricati.

  </Step>
</Steps>

## Gestione dei conflitti

L'applicazione rifiuta di continuare quando il piano segnala conflitti (un file o un valore di configurazione esiste già nella destinazione).

<Warning>
Riesegui con `--overwrite` solo quando sostituire la destinazione esistente è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory del report di migrazione.
</Warning>

Per una nuova installazione di OpenClaw, i conflitti sono insoliti. Di solito compaiono quando riesegui l'importazione su una configurazione che contiene già modifiche dell'utente.

Se un conflitto emerge a metà applicazione (ad esempio, una race imprevista su un file di configurazione), Hermes contrassegna gli elementi di configurazione dipendenti rimanenti come `skipped` con motivo `blocked by earlier apply conflict` invece di scriverli parzialmente. Il report di migrazione registra ogni elemento bloccato, così puoi risolvere il conflitto originale e rieseguire l'importazione.

## Segreti

`openclaw migrate` interattivo chiede se importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita.

- Accettando la richiesta, vengono importate credenziali OpenAI OAuth di OpenCode da `auth.json` di OpenCode, voci OpenCode e GitHub Copilot da `auth.json` di OpenCode e le [chiavi `.env` supportate](/it/cli/migrate#supported-env-keys). Le voci OAuth di `auth.json` di Hermes vengono segnalate per la riautenticazione manuale a OpenAI o la riparazione con doctor.
- Usa `--no-auth-credentials` o scegli no alla richiesta per importare solo stato non segreto.
- Usa `--include-secrets` quando esegui senza supervisione con `--yes`.
- Usa `--import-secrets` dell'onboarding quando importi credenziali dalla procedura guidata di onboarding.
- Per le credenziali gestite da SecretRef, configura la sorgente SecretRef dopo il completamento dell'importazione.

## Output JSON per l'automazione

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` e senza `--yes`, l'applicazione stampa il piano e non modifica lo stato. Questa è la modalità più sicura per CI e script condivisi.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="L'applicazione rifiuta con conflitti">
    Ispeziona l'output del piano. Ogni conflitto identifica il percorso sorgente e la destinazione esistente. Decidi per ogni elemento se saltarlo, modificare la destinazione o rieseguire con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes si trova fuori da ~/.hermes">
    Passa `--from /actual/path` (CLI) o `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="L'onboarding rifiuta l'importazione su una configurazione esistente">
    Le importazioni tramite onboarding richiedono una configurazione nuova. Reimposta lo stato ed esegui di nuovo l'onboarding, oppure usa direttamente `openclaw migrate apply hermes`, che supporta `--overwrite` e il controllo esplicito del backup.
  </Accordion>
  <Accordion title="Le chiavi API non sono state importate">
    `openclaw migrate` interattivo importa le chiavi API solo quando accetti la richiesta sulle credenziali. Le esecuzioni non interattive con `--yes` richiedono `--include-secrets`; le importazioni tramite onboarding richiedono `--import-secrets`. Vengono riconosciute solo le [chiavi `.env` supportate](/it/cli/migrate#supported-env-keys); le altre variabili in `.env` vengono ignorate.
  </Accordion>
</AccordionGroup>

## Correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento CLI completo, contratto del plugin e forme JSON.
- [Onboarding](/it/cli/onboard): flusso della procedura guidata e flag non interattivi.
- [Migrazione](/it/install/migrating): spostare un'installazione OpenClaw tra macchine.
- [Doctor](/it/gateway/doctor): controllo di integrità post-migrazione.
- [Workspace dell'agente](/it/concepts/agent-workspace): dove risiedono `SOUL.md`, `AGENTS.md` e i file di memoria.
