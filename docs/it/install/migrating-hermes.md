---
read_when:
    - Provieni da Hermes e vuoi mantenere la configurazione del modello, i prompt, la memoria e le Skills
    - Vuoi sapere che cosa OpenClaw importa automaticamente e che cosa rimane solo nell'archivio
    - Ti serve un percorso di migrazione pulito e automatizzato tramite script (CI, nuovo portatile, automazione)
summary: Passa da Hermes a OpenClaw con un'importazione reversibile e visualizzata in anteprima
title: Migrazione da Hermes
x-i18n:
    generated_at: "2026-07-12T07:08:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Il provider di migrazione Hermes incluso rileva lo stato in `~/.hermes`, mostra un'anteprima di ogni modifica prima di applicarla, oscura i segreti nei piani e nei report e crea un backup OpenClaw verificato prima di intervenire.

<Note>
Le importazioni richiedono una nuova configurazione di OpenClaw. Se disponi già di uno stato OpenClaw locale, reimposta prima la configurazione, le credenziali, le sessioni e l'area di lavoro oppure usa direttamente `openclaw migrate apply hermes` con `--overwrite` dopo aver esaminato il piano.
</Note>

## Due modi per importare

<Tabs>
  <Tab title="Procedura guidata di onboarding">
    Rileva Hermes in `~/.hermes` e mostra un'anteprima prima di applicare le modifiche.

    ```bash
    openclaw onboard --flow import
    ```

    In alternativa, indica un'origine specifica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` per esecuzioni tramite script o ripetibili. Consulta [`openclaw migrate`](/it/cli/migrate) per la documentazione di riferimento completa.

    ```bash
    openclaw migrate hermes --dry-run    # solo anteprima
    openclaw migrate apply hermes --yes  # applica senza richiedere conferma
    ```

    Aggiungi `--from <path>` quando Hermes si trova al di fuori di `~/.hermes`.

  </Tab>
</Tabs>

## Elementi importati

<AccordionGroup>
  <Accordion title="Configurazione del modello">
    - Selezione del modello predefinito dal file `config.yaml` di Hermes.
    - Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.

  </Accordion>
  <Accordion title="Server MCP">
    Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
  </Accordion>
  <Accordion title="File dell'area di lavoro">
    - `SOUL.md` e `AGENTS.md` vengono copiati nell'area di lavoro dell'agente OpenClaw.
    - `memories/MEMORY.md` e `memories/USER.md` vengono **aggiunti** ai file di memoria OpenClaw corrispondenti anziché sovrascriverli.

  </Accordion>
  <Accordion title="Configurazione della memoria">
    Impostazioni predefinite della configurazione della memoria per la memoria su file di OpenClaw. I provider di memoria esterni, come Honcho, vengono registrati come elementi di archivio o da esaminare manualmente, per consentirti di trasferirli in modo consapevole.
  </Accordion>
  <Accordion title="Skills">
    Le Skills con un file `SKILL.md` in `skills/<name>/` vengono copiate insieme ai valori di configurazione specifici di ciascuna Skill da `skills.config`.
  </Accordion>
  <Accordion title="Credenziali di autenticazione">
    La modalità interattiva di `openclaw migrate` chiede conferma prima di importare le credenziali di autenticazione, con sì selezionato per impostazione predefinita. Accettando, vengono importate le voci OAuth di OpenAI e GitHub Copilot di OpenCode dal file `auth.json` di OpenCode, insieme alle [chiavi `.env` di Hermes supportate](/it/cli/migrate#supported-env-keys). Le voci OAuth presenti nel file `auth.json` di Hermes sono considerate stato legacy: vengono segnalate come elementi che richiedono una nuova autenticazione manuale o un intervento di doctor, anziché essere importate nell'autenticazione attiva. Usa `--include-secrets` per importare le credenziali in un'esecuzione non interattiva, `--no-auth-credentials` per ignorarne completamente l'importazione oppure il flag `--import-secrets` della procedura guidata di onboarding.
  </Accordion>
</AccordionGroup>

## Elementi mantenuti solo nell'archivio

Il provider copia gli elementi seguenti nella directory del report di migrazione affinché vengano esaminati manualmente, ma **non** li carica nella configurazione o nelle credenziali attive di OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw rifiuta di eseguire o considerare attendibile questo stato automaticamente, perché i formati e i presupposti di attendibilità possono divergere tra i sistemi. Dopo aver esaminato l'archivio, trasferisci manualmente ciò che ti occorre.

## Procedura consigliata

<Steps>
  <Step title="Visualizza l'anteprima del piano">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Il piano elenca tutto ciò che verrà modificato, inclusi conflitti, elementi ignorati ed elementi sensibili. Nell'output vengono oscurate le chiavi annidate che sembrano contenere segreti.

  </Step>
  <Step title="Applica con backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea e verifica un backup prima di applicare le modifiche. Questo esempio non interattivo importa solo lo stato privo di segreti. Esegui il comando senza `--yes` per rispondere interattivamente alla richiesta relativa alle credenziali oppure aggiungi `--include-secrets` per includere le credenziali supportate in un'esecuzione automatica.

  </Step>
  <Step title="Esegui doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/it/gateway/doctor) riapplica le eventuali migrazioni della configurazione in sospeso e verifica la presenza di problemi introdotti durante l'importazione.

  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Verifica che il Gateway funzioni correttamente e che il modello, la memoria e le Skills importati siano caricati.

  </Step>
</Steps>

## Gestione dei conflitti

L'applicazione rifiuta di continuare quando il piano segnala conflitti, ossia quando un file o un valore di configurazione esiste già nella destinazione.

<Warning>
Esegui nuovamente il comando con `--overwrite` solo quando intendi sostituire la destinazione esistente. I provider possono comunque creare backup dei singoli elementi per i file sovrascritti nella directory del report di migrazione.
</Warning>

I conflitti sono insoliti in una nuova installazione. In genere si verificano quando ripeti l'importazione in una configurazione che contiene già modifiche dell'utente.

Se durante l'applicazione emerge un conflitto, ad esempio a causa di una condizione di concorrenza imprevista su un file di configurazione, Hermes contrassegna gli elementi di configurazione dipendenti rimanenti come `skipped` con il motivo `blocked by earlier apply conflict`, anziché scriverli parzialmente. Il report di migrazione registra ogni elemento bloccato, consentendoti di risolvere il conflitto originario e ripetere l'importazione.

## Segreti

La modalità interattiva di `openclaw migrate` chiede se importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita.

- Accettando, vengono importate le voci OAuth di OpenAI e GitHub Copilot di OpenCode dal file `auth.json` di OpenCode, insieme alle [chiavi `.env` supportate](/it/cli/migrate#supported-env-keys). Le voci OAuth presenti nel file `auth.json` di Hermes vengono invece segnalate affinché si esegua manualmente una nuova autenticazione OpenAI o una riparazione tramite doctor.
- Usa `--no-auth-credentials`, oppure rispondi no alla richiesta, per importare solo lo stato privo di segreti.
- Usa `--include-secrets` per importare le credenziali durante un'esecuzione automatica con `--yes`.
- Usa il flag `--import-secrets` della procedura guidata di onboarding per importare le credenziali dalla procedura guidata.

## Output JSON per l'automazione

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` e senza `--yes`, l'applicazione stampa il piano e non modifica lo stato: è la modalità più sicura per la CI e gli script condivisi.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="L'applicazione viene rifiutata a causa di conflitti">
    Esamina l'output del piano. Ogni conflitto identifica il percorso di origine e la destinazione esistente. Per ciascun elemento, decidi se ignorarlo, modificare la destinazione o eseguire nuovamente il comando con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes si trova al di fuori di ~/.hermes">
    Specifica `--from /actual/path` per la CLI oppure `--import-source /actual/path` per l'onboarding.
  </Accordion>
  <Accordion title="L'onboarding rifiuta l'importazione in una configurazione esistente">
    Le importazioni tramite onboarding richiedono una nuova configurazione. Reimposta lo stato ed esegui nuovamente l'onboarding oppure usa direttamente `openclaw migrate apply hermes`, che supporta `--overwrite` e il controllo esplicito del backup.
  </Accordion>
  <Accordion title="Le chiavi API non sono state importate">
    La modalità interattiva di `openclaw migrate` importa le chiavi API solo quando accetti la richiesta relativa alle credenziali. Le esecuzioni non interattive con `--yes` richiedono `--include-secrets`; le importazioni tramite onboarding richiedono `--import-secrets`. Vengono riconosciute solo le [chiavi `.env` supportate](/it/cli/migrate#supported-env-keys); le altre variabili `.env` vengono ignorate.
  </Accordion>
</AccordionGroup>

## Argomenti correlati

- [`openclaw migrate`](/it/cli/migrate): documentazione di riferimento completa della CLI, contratto del Plugin e strutture JSON.
- [Onboarding](/it/cli/onboard): procedura guidata e flag per la modalità non interattiva.
- [Migrazione](/it/install/migrating): trasferimento di un'installazione OpenClaw tra computer.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo la migrazione.
- [Area di lavoro dell'agente](/it/concepts/agent-workspace): posizione dei file `SOUL.md`, `AGENTS.md` e dei file di memoria.
