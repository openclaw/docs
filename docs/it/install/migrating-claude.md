---
read_when:
    - Provieni da Claude Code o Claude Desktop e vuoi mantenere istruzioni, server MCP e Skills
    - Devi comprendere cosa OpenClaw importa automaticamente e cosa rimane solo nell'archivio
summary: Sposta lo stato locale di Claude Code e Claude Desktop in OpenClaw con un'importazione visualizzata in anteprima
title: Migrazione da Claude
x-i18n:
    generated_at: "2026-07-12T07:10:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importa lo stato locale di Claude tramite il provider di migrazione Claude incluso. Il provider mostra un'anteprima di ogni elemento prima di modificare lo stato, oscura i segreti nei piani e nei report e crea un backup verificato prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una nuova configurazione di OpenClaw. Se disponi già di uno stato locale di OpenClaw, reimposta prima la configurazione, le credenziali, le sessioni e lo spazio di lavoro, oppure usa direttamente `openclaw migrate` con `--overwrite` dopo aver esaminato il piano.
</Note>

## Due modi per importare

<Tabs>
  <Tab title="Procedura guidata di onboarding">
    La procedura guidata propone Claude quando rileva uno stato locale di Claude.

    ```bash
    openclaw onboard --flow import
    ```

    In alternativa, indica una sorgente specifica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` per esecuzioni tramite script o ripetibili. Consulta [`openclaw migrate`](/it/cli/migrate) per la documentazione di riferimento completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Aggiungi `--from <path>` per importare una directory home di Claude Code o la radice di un progetto specifico.

  </Tab>
</Tabs>

## Elementi importati

<AccordionGroup>
  <Accordion title="Istruzioni e memoria">
    - Il contenuto di `CLAUDE.md` e `.claude/CLAUDE.md` del progetto viene copiato o aggiunto al file `AGENTS.md` nello spazio di lavoro dell'agente OpenClaw.
    - Il contenuto di `~/.claude/CLAUDE.md` dell'utente viene aggiunto al file `USER.md` dello spazio di lavoro.

  </Accordion>
  <Accordion title="Server MCP">
    Le definizioni dei server MCP vengono importate, quando presenti, da `.mcp.json` del progetto, da `~/.claude.json` di Claude Code e da `claude_desktop_config.json` di Claude Desktop.
  </Accordion>
  <Accordion title="Skills e comandi">
    - Le Skills di Claude che contengono un file `SKILL.md` vengono copiate nella directory delle Skills dello spazio di lavoro OpenClaw.
    - I file Markdown dei comandi Claude in `.claude/commands/` o `~/.claude/commands/` vengono convertiti in Skills di OpenClaw con `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Elementi conservati solo nell'archivio

Il provider copia i seguenti elementi nel report di migrazione per consentirne la revisione manuale, ma **non** li carica nella configurazione attiva di OpenClaw:

- Hook di Claude
- Autorizzazioni di Claude ed elenchi estesi di strumenti consentiti
- Valori predefiniti dell'ambiente Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Sottoagenti Claude in `.claude/agents/` o `~/.claude/agents/`
- Cache, piani e directory della cronologia dei progetti di Claude Code
- Estensioni di Claude Desktop e credenziali archiviate nel sistema operativo

OpenClaw si rifiuta di eseguire gli hook, considerare attendibili gli elenchi di autorizzazioni consentite o decodificare automaticamente lo stato opaco delle credenziali OAuth e Desktop. Dopo aver esaminato l'archivio, trasferisci manualmente ciò che ti serve.

## Selezione della sorgente

Senza `--from`, OpenClaw esamina la directory home predefinita di Claude Code in `~/.claude`, il file di stato campionato `~/.claude.json` di Claude Code e la configurazione MCP di Claude Desktop su macOS.

Quando `--from` indica la radice di un progetto, OpenClaw importa solo i file Claude di quel progetto, come `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` e `.mcp.json`. Durante l'importazione dalla radice di un progetto, non legge la directory home globale di Claude.

## Flusso consigliato

<Steps>
  <Step title="Visualizza l'anteprima del piano">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Il piano elenca tutto ciò che verrà modificato, inclusi i conflitti, gli elementi ignorati e i valori sensibili oscurati nei campi MCP `env` o `headers` annidati.

  </Step>
  <Step title="Applica con backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crea e verifica un backup prima dell'applicazione.

  </Step>
  <Step title="Esegui doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/it/gateway/doctor) verifica la presenza di problemi di configurazione o di stato dopo l'importazione.

  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Verifica che il Gateway funzioni correttamente e che le istruzioni, i server MCP e le Skills importati siano caricati.

  </Step>
</Steps>

## Gestione dei conflitti

L'applicazione si rifiuta di continuare quando il piano segnala conflitti, ossia quando un file o un valore di configurazione esiste già nella destinazione.

<Warning>
Esegui nuovamente il comando con `--overwrite` solo quando intendi sostituire la destinazione esistente. I provider possono comunque creare backup a livello di singolo elemento per i file sovrascritti nella directory del report di migrazione.
</Warning>

In una nuova installazione di OpenClaw, i conflitti sono insoliti. In genere si verificano quando esegui nuovamente l'importazione in una configurazione che contiene già modifiche dell'utente.

## Output JSON per l'automazione

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` è obbligatorio per `migrate apply` al di fuori di un terminale interattivo; senza questa opzione, OpenClaw restituisce un errore anziché applicare le modifiche, quindi gli script e la CI devono specificare esplicitamente `--yes`. Visualizza prima l'anteprima con `--dry-run --json`, quindi applica le modifiche con `--json --yes` quando il piano è corretto.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Lo stato di Claude si trova fuori da ~/.claude">
    Specifica `--from /actual/path` (CLI) o `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="L'onboarding rifiuta l'importazione in una configurazione esistente">
    Le importazioni durante l'onboarding richiedono una nuova configurazione. Reimposta lo stato ed esegui nuovamente l'onboarding oppure usa direttamente `openclaw migrate apply claude`, che supporta `--overwrite` e il controllo esplicito del backup.
  </Accordion>
  <Accordion title="I server MCP di Claude Desktop non sono stati importati">
    Claude Desktop legge `claude_desktop_config.json` da un percorso specifico della piattaforma. Se OpenClaw non lo ha rilevato automaticamente, indica con `--from` la directory contenente tale file.
  </Accordion>
  <Accordion title="I comandi Claude sono diventati Skills con l'invocazione da parte del modello disabilitata">
    È il comportamento previsto. I comandi Claude vengono attivati dall'utente, quindi OpenClaw li importa come Skills con `disable-model-invocation: true`. Modifica il frontmatter di ciascuna Skill se vuoi che l'agente le invochi automaticamente.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [`openclaw migrate`](/it/cli/migrate): documentazione di riferimento completa della CLI, contratto dei Plugin e strutture JSON.
- [Guida alla migrazione](/it/install/migrating): tutti i percorsi di migrazione.
- [Migrazione da Hermes](/it/install/migrating-hermes): l'altro percorso di importazione tra sistemi.
- [Onboarding](/it/cli/onboard): flusso della procedura guidata e flag non interattivi.
- [Doctor](/it/gateway/doctor): controllo dello stato del sistema dopo la migrazione.
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace): posizione di `AGENTS.md`, `USER.md` e delle Skills.
