---
read_when:
    - Stai spostando OpenClaw su un nuovo laptop o server
    - Provieni da un altro sistema di agenti e vuoi mantenere lo stato
    - Stai aggiornando un Plugin sul posto
summary: 'Hub di migrazione: importazioni tra sistemi, spostamenti da macchina a macchina e aggiornamenti dei Plugin'
title: Guida alla migrazione
x-i18n:
    generated_at: "2026-05-02T08:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw supporta tre percorsi di migrazione: importazione da un altro sistema di agenti, spostamento di un'installazione esistente su una nuova macchina e aggiornamento di un plugin sul posto.

## Importazione da un altro sistema di agenti

Usa i provider di migrazione inclusi per portare istruzioni, server MCP, Skills, configurazione del modello e chiavi API (facoltative) in OpenClaw. I piani vengono mostrati in anteprima prima di qualsiasi modifica, i segreti sono oscurati nei report e l'applicazione è supportata da un backup verificato.

<CardGroup cols={2}>
  <Card title="Migrazione da Claude" href="/it/install/migrating-claude" icon="brain">
    Importa lo stato di Claude Code e Claude Desktop, inclusi `CLAUDE.md`, server MCP, Skills e comandi di progetto.
  </Card>
  <Card title="Migrazione da Hermes" href="/it/install/migrating-hermes" icon="feather">
    Importa configurazione di Hermes, provider, server MCP, memoria, Skills e chiavi `.env` supportate.
  </Card>
</CardGroup>

Il punto di ingresso della CLI è [`openclaw migrate`](/it/cli/migrate). Anche l'onboarding può offrire la migrazione quando rileva una sorgente nota (`openclaw onboard --flow import`).

## Spostare OpenClaw su una nuova macchina

Copia la **directory di stato** (`~/.openclaw/` per impostazione predefinita) e il tuo **workspace** per preservare:

- **Configurazione** — `openclaw.json` e tutte le impostazioni del gateway.
- **Autenticazione** — `auth-profiles.json` per agente (chiavi API più OAuth), più qualsiasi stato di canale o provider sotto `credentials/`.
- **Sessioni** — cronologia delle conversazioni e stato dell'agente.
- **Stato del canale** — accesso WhatsApp, sessione Telegram e simili.
- **File del workspace** — `MEMORY.md`, `USER.md`, Skills e prompt.

<Tip>
Esegui `openclaw status` sulla vecchia macchina per confermare il percorso della directory di stato. I profili personalizzati usano `~/.openclaw-<profile>/` o un percorso impostato tramite `OPENCLAW_STATE_DIR`.
</Tip>

### Passaggi di migrazione

<Steps>
  <Step title="Arresta il gateway ed esegui il backup">
    Sulla **vecchia** macchina, arresta il gateway in modo che i file non cambino durante la copia, quindi crea un archivio:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se usi più profili (per esempio `~/.openclaw-work`), archiviali separatamente.

  </Step>

  <Step title="Installa OpenClaw sulla nuova macchina">
    [Installa](/it/install) la CLI (e Node se necessario) sulla nuova macchina. Va bene se l'onboarding crea un nuovo `~/.openclaw/`. Lo sovrascriverai nel passaggio successivo.
  </Step>

  <Step title="Copia la directory di stato e il workspace">
    Trasferisci l'archivio tramite `scp`, `rsync -a` o un'unità esterna, quindi estrailo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assicurati che le directory nascoste siano state incluse e che la proprietà dei file corrisponda all'utente che eseguirà il gateway.

  </Step>

  <Step title="Esegui doctor e verifica">
    Sulla nuova macchina, esegui [Doctor](/it/gateway/doctor) per applicare le migrazioni della configurazione e riparare i servizi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Se Telegram o Discord usa il fallback env predefinito (`TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN`), verifica che il `.env` della directory di stato migrata contenga quelle chiavi senza stampare i valori segreti:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` avvisa anche quando un account Telegram o Discord predefinito abilitato non ha un token configurato e la variabile env corrispondente non è disponibile per il processo doctor.

### Problemi comuni

<AccordionGroup>
  <Accordion title="Profilo o directory di stato non corrispondenti">
    Se il vecchio gateway usava `--profile` o `OPENCLAW_STATE_DIR` e quello nuovo no, i canali appariranno disconnessi e le sessioni saranno vuote. Avvia il gateway con lo **stesso** profilo o la stessa directory di stato che hai migrato, quindi esegui di nuovo `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiare solo openclaw.json">
    Il solo file di configurazione non è sufficiente. I profili di autenticazione del modello si trovano sotto `agents/<agentId>/agent/auth-profiles.json`, mentre lo stato di canali e provider si trova sotto `credentials/`. Migra sempre l'**intera** directory di stato.
  </Accordion>

  <Accordion title="Permessi e proprietà">
    Se hai copiato come root o hai cambiato utente, il gateway potrebbe non riuscire a leggere le credenziali. Assicurati che la directory di stato e il workspace appartengano all'utente che esegue il gateway.
  </Accordion>

  <Accordion title="Modalità remota">
    Se la tua UI punta a un gateway **remoto**, l'host remoto possiede sessioni e workspace. Migra l'host del gateway stesso, non il tuo laptop locale. Consulta le [FAQ](/it/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segreti nei backup">
    La directory di stato contiene profili di autenticazione, credenziali dei canali e altro stato dei provider. Archivia i backup cifrati, evita canali di trasferimento non sicuri e ruota le chiavi se sospetti un'esposizione.
  </Accordion>
</AccordionGroup>

### Checklist di verifica

Sulla nuova macchina, conferma:

- [ ] `openclaw status` mostra che il gateway è in esecuzione.
- [ ] I canali sono ancora connessi (non è necessario riassociare).
- [ ] La dashboard si apre e mostra le sessioni esistenti.
- [ ] I file del workspace (memoria, configurazioni) sono presenti.

## Aggiornare un plugin sul posto

Gli aggiornamenti dei plugin sul posto preservano lo stesso ID plugin e le stesse chiavi di configurazione, ma possono spostare lo stato su disco nel layout corrente. Le guide di aggiornamento specifiche dei plugin si trovano accanto ai rispettivi canali:

- [Migrazione Matrix](/it/channels/matrix-migration): limiti di ripristino dello stato cifrato, comportamento degli snapshot automatici e comandi di ripristino manuale.

## Correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento CLI per importazioni tra sistemi.
- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controllo di integrità post-migrazione.
- [Disinstallazione](/it/install/uninstall): rimuovere OpenClaw in modo pulito.
