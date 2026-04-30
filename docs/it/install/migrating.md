---
read_when:
    - Stai trasferendo OpenClaw su un nuovo portatile o un nuovo server
    - Provieni da un altro sistema di agenti e vuoi mantenere lo stato
    - Stai aggiornando un Plugin sul posto
summary: 'Hub di migrazione: importazioni tra sistemi, trasferimenti da macchina a macchina e aggiornamenti dei Plugin'
title: Guida alla migrazione
x-i18n:
    generated_at: "2026-04-30T08:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw supporta tre percorsi di migrazione: importare da un altro sistema di agenti, spostare un'installazione esistente su una nuova macchina e aggiornare un Plugin sul posto.

## Importa da un altro sistema di agenti

Usa i provider di migrazione inclusi per portare in OpenClaw istruzioni, server MCP, skills, configurazione del modello e chiavi API (facoltative). I piani vengono visualizzati in anteprima prima di qualsiasi modifica, i segreti sono redatti nei report e l'applicazione è supportata da un backup verificato.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/it/install/migrating-claude" icon="brain">
    Importa lo stato di Claude Code e Claude Desktop, inclusi `CLAUDE.md`, server MCP, skills e comandi di progetto.
  </Card>
  <Card title="Migrating from Hermes" href="/it/install/migrating-hermes" icon="feather">
    Importa configurazione di Hermes, provider, server MCP, memoria, skills e chiavi `.env` supportate.
  </Card>
</CardGroup>

Il punto di ingresso della CLI è [`openclaw migrate`](/it/cli/migrate). Anche l'onboarding può offrire la migrazione quando rileva una sorgente nota (`openclaw onboard --flow import`).

## Sposta OpenClaw su una nuova macchina

Copia la **directory di stato** (`~/.openclaw/` per impostazione predefinita) e il tuo **workspace** per preservare:

- **Configurazione** — `openclaw.json` e tutte le impostazioni del gateway.
- **Autenticazione** — `auth-profiles.json` per agente (chiavi API più OAuth), oltre a qualsiasi stato di canale o provider sotto `credentials/`.
- **Sessioni** — cronologia delle conversazioni e stato dell'agente.
- **Stato del canale** — accesso WhatsApp, sessione Telegram e simili.
- **File del workspace** — `MEMORY.md`, `USER.md`, skills e prompt.

<Tip>
Esegui `openclaw status` sulla vecchia macchina per confermare il percorso della directory di stato. I profili personalizzati usano `~/.openclaw-<profile>/` o un percorso impostato tramite `OPENCLAW_STATE_DIR`.
</Tip>

### Passaggi di migrazione

<Steps>
  <Step title="Stop the gateway and back up">
    Sulla **vecchia** macchina, arresta il gateway in modo che i file non cambino durante la copia, quindi archivia:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se usi più profili (per esempio `~/.openclaw-work`), archiviali separatamente.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    [Installa](/it/install) la CLI (e Node se necessario) sulla nuova macchina. Va bene se l'onboarding crea un nuovo `~/.openclaw/`. Lo sovrascriverai nel passaggio successivo.
  </Step>

  <Step title="Copy state directory and workspace">
    Trasferisci l'archivio tramite `scp`, `rsync -a` o un'unità esterna, quindi estrailo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assicurati che le directory nascoste siano state incluse e che la proprietà dei file corrisponda all'utente che eseguirà il gateway.

  </Step>

  <Step title="Run doctor and verify">
    Sulla nuova macchina, esegui [Doctor](/it/gateway/doctor) per applicare le migrazioni di configurazione e riparare i servizi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Problemi comuni

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Se il vecchio gateway usava `--profile` o `OPENCLAW_STATE_DIR` e quello nuovo no, i canali appariranno disconnessi e le sessioni saranno vuote. Avvia il gateway con lo **stesso** profilo o la stessa directory di stato che hai migrato, quindi riesegui `openclaw doctor`.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Il solo file di configurazione non è sufficiente. I profili di autenticazione del modello si trovano sotto `agents/<agentId>/agent/auth-profiles.json`, mentre lo stato dei canali e dei provider si trova sotto `credentials/`. Migra sempre l'**intera** directory di stato.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Se hai copiato come root o hai cambiato utente, il gateway potrebbe non riuscire a leggere le credenziali. Assicurati che la directory di stato e il workspace appartengano all'utente che esegue il gateway.
  </Accordion>

  <Accordion title="Remote mode">
    Se la tua UI punta a un gateway **remoto**, l'host remoto possiede sessioni e workspace. Migra l'host del gateway stesso, non il tuo laptop locale. Consulta le [FAQ](/it/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in backups">
    La directory di stato contiene profili di autenticazione, credenziali dei canali e altro stato dei provider. Conserva i backup cifrati, evita canali di trasferimento non sicuri e ruota le chiavi se sospetti un'esposizione.
  </Accordion>
</AccordionGroup>

### Checklist di verifica

Sulla nuova macchina, conferma che:

- [ ] `openclaw status` mostri il gateway in esecuzione.
- [ ] I canali siano ancora connessi (non è necessario riassociare).
- [ ] La dashboard si apra e mostri le sessioni esistenti.
- [ ] I file del workspace (memoria, configurazioni) siano presenti.

## Aggiorna un Plugin sul posto

Gli aggiornamenti sul posto dei Plugin preservano lo stesso ID Plugin e le stesse chiavi di configurazione, ma possono spostare lo stato su disco nel layout corrente. Le guide di aggiornamento specifiche dei Plugin si trovano accanto ai rispettivi canali:

- [Migrazione di Matrix](/it/channels/matrix-migration): limiti di recupero dello stato cifrato, comportamento automatico degli snapshot e comandi di recupero manuale.

## Correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento CLI per importazioni tra sistemi.
- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controllo di salute post-migrazione.
- [Disinstallazione](/it/install/uninstall): rimozione pulita di OpenClaw.
