---
read_when:
    - Stai trasferendo OpenClaw su un nuovo portatile o server
    - Provieni da un altro sistema di agenti e vuoi mantenere lo stato
    - Stai aggiornando un plugin sul posto
summary: 'Hub di migrazione: importazioni tra sistemi, trasferimenti da macchina a macchina e aggiornamenti dei plugin'
title: Guida alla migrazione
x-i18n:
    generated_at: "2026-07-12T07:12:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw supporta tre percorsi di migrazione: l'importazione da un altro sistema di agenti, il trasferimento di un'installazione esistente su un nuovo computer e l'aggiornamento di un plugin sul posto.

## Importazione da un altro sistema di agenti

I provider di migrazione inclusi importano in OpenClaw istruzioni, server MCP, Skills, configurazione dei modelli e, facoltativamente, chiavi API. I piani vengono visualizzati in anteprima prima di qualsiasi modifica, i segreti vengono oscurati nei rapporti e l'applicazione è supportata da un backup verificato.

<CardGroup cols={2}>
  <Card title="Migrazione da Claude" href="/it/install/migrating-claude" icon="brain">
    Importa lo stato di Claude Code e Claude Desktop, inclusi `CLAUDE.md`, server MCP, Skills e comandi di progetto.
  </Card>
  <Card title="Migrazione da Hermes" href="/it/install/migrating-hermes" icon="feather">
    Importa configurazione, provider, server MCP, memoria, Skills e chiavi `.env` supportate di Hermes.
  </Card>
</CardGroup>

Il punto di ingresso della CLI è [`openclaw migrate`](/it/cli/migrate). Anche la configurazione iniziale può proporre la migrazione quando rileva un'origine nota (`openclaw onboard --flow import`).

## Trasferire OpenClaw su un nuovo computer

Copia la **directory di stato** (`~/.openclaw/` per impostazione predefinita) e il tuo **spazio di lavoro** per conservare:

- **Configurazione** — `openclaw.json` e tutte le impostazioni del Gateway.
- **Autenticazione** — il file `auth-profiles.json` di ciascun agente (chiavi API e OAuth), oltre a qualsiasi stato dei canali o dei provider in `credentials/`.
- **Sessioni** — cronologia delle conversazioni e stato degli agenti.
- **Stato dei canali** — accesso a WhatsApp, sessione di Telegram e dati simili.
- **File dello spazio di lavoro** — `MEMORY.md`, `USER.md`, Skills e prompt.

<Tip>
Esegui `openclaw status` sul vecchio computer per verificare il percorso della directory di stato. I profili personalizzati utilizzano `~/.openclaw-<profile>/` o un percorso impostato tramite `OPENCLAW_STATE_DIR`.
</Tip>

### Passaggi della migrazione

<Steps>
  <Step title="Arrestare il Gateway ed eseguire il backup">
    Sul **vecchio** computer, arresta il Gateway affinché i file non vengano modificati durante la copia, quindi crea l'archivio:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se utilizzi più profili (ad esempio `~/.openclaw-work`), archivia ciascuno separatamente.

  </Step>

  <Step title="Installare OpenClaw sul nuovo computer">
    [Installa](/it/install) la CLI (e Node, se necessario) sul nuovo computer. Non è un problema se la configurazione iniziale crea una nuova directory `~/.openclaw/`: la sovrascriverai nel passaggio successivo.
  </Step>

  <Step title="Copiare la directory di stato e lo spazio di lavoro">
    Trasferisci l'archivio tramite `scp`, `rsync -a` o un'unità esterna, quindi estrailo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Verifica che siano state incluse le directory nascoste e che la proprietà dei file corrisponda all'utente che eseguirà il Gateway.

  </Step>

  <Step title="Eseguire Doctor e verificare">
    Sul nuovo computer, esegui [Doctor](/it/gateway/doctor) per applicare le migrazioni della configurazione e riparare i servizi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Se Telegram o Discord utilizza la variabile d'ambiente di ripiego predefinita (`TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN`), verifica che il file `.env` nella directory di stato migrata contenga tali chiavi senza stampare i valori segreti:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` avvisa inoltre quando un account predefinito di Telegram o Discord è abilitato ma non dispone di un token configurato e la variabile d'ambiente corrispondente non è disponibile per il processo Doctor.

### Problemi comuni

<AccordionGroup>
  <Accordion title="Profilo o directory di stato non corrispondenti">
    Se il vecchio Gateway utilizzava `--profile` o `OPENCLAW_STATE_DIR` e quello nuovo non li utilizza, i canali risulteranno disconnessi e le sessioni saranno vuote. Avvia il Gateway con lo **stesso** profilo o la stessa directory di stato che hai migrato, quindi esegui nuovamente `openclaw doctor`.
  </Accordion>

  <Accordion title="Copia del solo file openclaw.json">
    Il solo file di configurazione non è sufficiente. I profili di autenticazione dei modelli si trovano in `agents/<agentId>/agent/auth-profiles.json`, mentre lo stato dei canali e dei provider si trova in `credentials/`. Migra sempre l'**intera** directory di stato.
  </Accordion>

  <Accordion title="Permessi e proprietà">
    Se hai eseguito la copia come utente root o hai cambiato utente, il Gateway potrebbe non riuscire a leggere le credenziali. Assicurati che la directory di stato e lo spazio di lavoro appartengano all'utente che esegue il Gateway.
  </Accordion>

  <Accordion title="Modalità remota">
    Se la tua interfaccia utente è connessa a un Gateway **remoto**, l'host remoto contiene le sessioni e lo spazio di lavoro. Migra l'host del Gateway, non il tuo portatile locale. Consulta le [domande frequenti](/it/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segreti nei backup">
    La directory di stato contiene profili di autenticazione, credenziali dei canali e altri dati di stato dei provider. Conserva i backup in forma crittografata, evita canali di trasferimento non sicuri e ruota le chiavi se sospetti un'esposizione.
  </Accordion>
</AccordionGroup>

### Elenco di verifica

Sul nuovo computer, verifica quanto segue:

- [ ] `openclaw status` mostra che il Gateway è in esecuzione.
- [ ] I canali sono ancora connessi e non richiedono un nuovo abbinamento.
- [ ] La dashboard si apre e mostra le sessioni esistenti.
- [ ] I file dello spazio di lavoro (memoria e configurazioni) sono presenti.

## Aggiornare un plugin sul posto

Gli aggiornamenti sul posto dei plugin mantengono lo stesso ID del plugin e le stesse chiavi di configurazione, ma possono spostare lo stato su disco nella struttura corrente. Le guide di aggiornamento specifiche dei plugin si trovano accanto ai relativi canali:

- [Migrazione di Matrix](/it/channels/matrix-migration): limiti del ripristino dello stato crittografato, comportamento delle istantanee automatiche e comandi di ripristino manuale.

## Contenuti correlati

- [`openclaw migrate`](/it/cli/migrate): riferimento della CLI per le importazioni tra sistemi.
- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo la migrazione.
- [Disinstallazione](/it/install/uninstall): rimozione corretta di OpenClaw.
