---
read_when:
    - Provieni da Claude Code o Claude Desktop e vuoi conservare istruzioni, server MCP e Skills
    - Devi capire cosa OpenClaw importa automaticamente e cosa rimane solo nell’archivio
summary: Sposta lo stato locale di Claude Code e Claude Desktop in OpenClaw tramite un'importazione con anteprima
title: Migrazione da Claude
x-i18n:
    generated_at: "2026-04-30T08:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importa lo stato locale di Claude tramite il provider di migrazione Claude incluso. Il provider mostra un'anteprima di ogni elemento prima di modificare lo stato, oscura i segreti nei piani e nei report e crea un backup verificato prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una configurazione OpenClaw nuova. Se hai già uno stato OpenClaw locale, reimposta prima configurazione, credenziali, sessioni e workspace, oppure usa direttamente `openclaw migrate` con `--overwrite` dopo aver esaminato il piano.
</Note>

## Due modi per importare

<Tabs>
  <Tab title="Procedura guidata di onboarding">
    La procedura guidata propone Claude quando rileva uno stato Claude locale.

    ```bash
    openclaw onboard --flow import
    ```

    Oppure punta a una sorgente specifica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` per esecuzioni tramite script o ripetibili. Vedi [`openclaw migrate`](/it/cli/migrate) per il riferimento completo.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Aggiungi `--from <path>` per importare una home Claude Code o una radice di progetto specifica.

  </Tab>
</Tabs>

## Cosa viene importato

<AccordionGroup>
  <Accordion title="Istruzioni e memoria">
    - Il contenuto di progetto `CLAUDE.md` e `.claude/CLAUDE.md` viene copiato o aggiunto al file `AGENTS.md` del workspace dell'agente OpenClaw.
    - Il contenuto utente `~/.claude/CLAUDE.md` viene aggiunto a `USER.md` del workspace.

  </Accordion>
  <Accordion title="Server MCP">
    Le definizioni dei server MCP vengono importate da `.mcp.json` del progetto, da Claude Code `~/.claude.json` e da Claude Desktop `claude_desktop_config.json` quando presenti.
  </Accordion>
  <Accordion title="Skills e comandi">
    - Le Skills di Claude con un file `SKILL.md` vengono copiate nella directory Skills del workspace OpenClaw.
    - I file Markdown dei comandi Claude in `.claude/commands/` o `~/.claude/commands/` vengono convertiti in Skills OpenClaw con `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Cosa resta solo in archivio

Il provider copia questi elementi nel report di migrazione per la revisione manuale, ma **non** li carica nella configurazione OpenClaw attiva:

- Hook Claude
- Autorizzazioni Claude e allowlist ampie degli strumenti
- Valori predefiniti dell'ambiente Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagenti Claude in `.claude/agents/` o `~/.claude/agents/`
- Cache, piani e directory della cronologia dei progetti di Claude Code
- Estensioni Claude Desktop e credenziali archiviate dal sistema operativo

OpenClaw rifiuta di eseguire hook, considerare attendibili le allowlist delle autorizzazioni o decodificare automaticamente lo stato opaco delle credenziali OAuth e Desktop. Sposta manualmente ciò che ti serve dopo aver esaminato l'archivio.

## Selezione della sorgente

Senza `--from`, OpenClaw ispeziona la home predefinita di Claude Code in `~/.claude`, il file di stato campionato di Claude Code `~/.claude.json` e la configurazione MCP di Claude Desktop su macOS.

Quando `--from` punta alla radice di un progetto, OpenClaw importa solo i file Claude di quel progetto, come `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` e `.mcp.json`. Non legge la tua home Claude globale durante un'importazione dalla radice del progetto.

## Flusso consigliato

<Steps>
  <Step title="Visualizza l'anteprima del piano">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Il piano elenca tutto ciò che cambierà, inclusi conflitti, elementi saltati e valori sensibili oscurati dai campi MCP annidati `env` o `headers`.

  </Step>
  <Step title="Applica con backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crea e verifica un backup prima di applicare le modifiche.

  </Step>
  <Step title="Esegui doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/it/gateway/doctor) verifica eventuali problemi di configurazione o stato dopo l'importazione.

  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Conferma che il Gateway sia integro e che le istruzioni, i server MCP e le Skills importati siano caricati.

  </Step>
</Steps>

## Gestione dei conflitti

L'applicazione rifiuta di continuare quando il piano segnala conflitti (un file o valore di configurazione esiste già nella destinazione).

<Warning>
Esegui di nuovo con `--overwrite` solo quando la sostituzione della destinazione esistente è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory dei report di migrazione.
</Warning>

Per una nuova installazione OpenClaw, i conflitti sono insoliti. In genere compaiono quando riesegui l'importazione su una configurazione che contiene già modifiche utente.

## Output JSON per automazione

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Con `--json` e senza `--yes`, apply stampa il piano e non modifica lo stato. Questa è la modalità più sicura per CI e script condivisi.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Lo stato Claude si trova fuori da ~/.claude">
    Passa `--from /actual/path` (CLI) o `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="L'onboarding rifiuta l'importazione su una configurazione esistente">
    Le importazioni durante l'onboarding richiedono una configurazione nuova. Reimposta lo stato e ripeti l'onboarding, oppure usa direttamente `openclaw migrate apply claude`, che supporta `--overwrite` e il controllo esplicito dei backup.
  </Accordion>
  <Accordion title="I server MCP da Claude Desktop non sono stati importati">
    Claude Desktop legge `claude_desktop_config.json` da un percorso specifico della piattaforma. Punta `--from` alla directory di quel file se OpenClaw non lo ha rilevato automaticamente.
  </Accordion>
  <Accordion title="I comandi Claude sono diventati Skills con invocazione del modello disabilitata">
    È intenzionale. I comandi Claude vengono attivati dall'utente, quindi OpenClaw li importa come Skills con `disable-model-invocation: true`. Modifica il frontmatter di ogni skill se vuoi che l'agente le invochi automaticamente.
  </Accordion>
</AccordionGroup>

## Correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento CLI completo, contratto del Plugin e forme JSON.
- [Guida alla migrazione](/it/install/migrating): tutti i percorsi di migrazione.
- [Migrazione da Hermes](/it/install/migrating-hermes): l'altro percorso di importazione tra sistemi.
- [Onboarding](/it/cli/onboard): flusso della procedura guidata e flag non interattivi.
- [Doctor](/it/gateway/doctor): controllo di integrità post-migrazione.
- [Workspace dell'agente](/it/concepts/agent-workspace): dove si trovano `AGENTS.md`, `USER.md` e le Skills.
