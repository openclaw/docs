---
read_when:
    - Stai spostando OpenClaw su un nuovo laptop/server
    - Vuoi preservare sessioni, auth e accessi ai canali (WhatsApp, ecc.)
summary: Spostare (migrare) un'installazione OpenClaw da una macchina a un'altra
title: Guida alla migrazione
x-i18n:
    generated_at: "2026-04-24T08:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# Migrare OpenClaw su una nuova macchina

Questa guida sposta un Gateway OpenClaw su una nuova macchina senza rifare l'onboarding.

## Cosa viene migrato

Quando copi la **directory di stato** (`~/.openclaw/` per impostazione predefinita) e il tuo **workspace**, preservi:

- **Configurazione** -- `openclaw.json` e tutte le impostazioni del Gateway
- **Auth** -- `auth-profiles.json` per agente (chiavi API + OAuth), più qualsiasi stato di canale/provider sotto `credentials/`
- **Sessioni** -- cronologia delle conversazioni e stato dell'agente
- **Stato del canale** -- accesso WhatsApp, sessione Telegram, ecc.
- **File del workspace** -- `MEMORY.md`, `USER.md`, Skills e prompt

<Tip>
Esegui `openclaw status` sulla vecchia macchina per confermare il percorso della tua directory di stato.
I profili personalizzati usano `~/.openclaw-<profile>/` o un percorso impostato tramite `OPENCLAW_STATE_DIR`.
</Tip>

## Passaggi di migrazione

<Steps>
  <Step title="Arresta il Gateway ed esegui il backup">
    Sulla macchina **vecchia**, arresta il Gateway in modo che i file non cambino durante la copia, poi archivia:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se usi più profili (ad esempio `~/.openclaw-work`), archiviali ciascuno separatamente.

  </Step>

  <Step title="Installa OpenClaw sulla nuova macchina">
    [Installa](/it/install) la CLI (e Node se necessario) sulla nuova macchina.
    Va bene se l'onboarding crea un nuovo `~/.openclaw/` -- lo sovrascriverai nel passaggio successivo.
  </Step>

  <Step title="Copia la directory di stato e il workspace">
    Trasferisci l'archivio tramite `scp`, `rsync -a` o un'unità esterna, poi estrailo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assicurati che le directory nascoste siano state incluse e che la proprietà dei file corrisponda all'utente che eseguirà il Gateway.

  </Step>

  <Step title="Esegui Doctor e verifica">
    Sulla nuova macchina, esegui [Doctor](/it/gateway/doctor) per applicare le migrazioni della configurazione e riparare i servizi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Problemi comuni

<AccordionGroup>
  <Accordion title="Mancata corrispondenza del profilo o della directory di stato">
    Se il vecchio Gateway usava `--profile` o `OPENCLAW_STATE_DIR` e quello nuovo no,
    i canali appariranno disconnessi e le sessioni saranno vuote.
    Avvia il Gateway con lo **stesso** profilo o la stessa directory di stato che hai migrato, poi esegui di nuovo `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiare solo openclaw.json">
    Il solo file di configurazione non basta. I profili auth dei modelli si trovano sotto
    `agents/<agentId>/agent/auth-profiles.json`, e lo stato del canale/provider
    si trova ancora sotto `credentials/`. Migra sempre l'**intera** directory di stato.
  </Accordion>

  <Accordion title="Permessi e proprietà">
    Se hai copiato come root o cambiato utente, il Gateway potrebbe non riuscire a leggere le credenziali.
    Assicurati che la directory di stato e il workspace siano di proprietà dell'utente che esegue il Gateway.
  </Accordion>

  <Accordion title="Modalità remota">
    Se la tua UI punta a un Gateway **remoto**, l'host remoto possiede sessioni e workspace.
    Migra l'host Gateway stesso, non il tuo laptop locale. Vedi [FAQ](/it/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segreti nei backup">
    La directory di stato contiene profili auth, credenziali dei canali e altro
    stato dei provider.
    Conserva i backup cifrati, evita canali di trasferimento non sicuri e ruota le chiavi se sospetti un'esposizione.
  </Accordion>
</AccordionGroup>

## Checklist di verifica

Sulla nuova macchina, conferma:

- [ ] `openclaw status` mostra il Gateway in esecuzione
- [ ] I canali sono ancora connessi (non serve riassociazione)
- [ ] La dashboard si apre e mostra le sessioni esistenti
- [ ] I file del workspace (memoria, configurazioni) sono presenti

## Correlati

- [Panoramica installazione](/it/install)
- [Migrazione Matrix](/it/install/migrating-matrix)
- [Disinstallazione](/it/install/uninstall)
