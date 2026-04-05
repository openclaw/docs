---
read_when:
    - Stai spostando OpenClaw su un nuovo laptop/server
    - Vuoi preservare sessioni, autenticazione e accessi ai canali (WhatsApp, ecc.)
summary: Spostare (migrare) un'installazione OpenClaw da una macchina a un'altra
title: Guida alla migrazione
x-i18n:
    generated_at: "2026-04-05T13:56:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Migrazione di OpenClaw su una nuova macchina

Questa guida sposta un gateway OpenClaw su una nuova macchina senza rifare l'onboarding.

## Cosa viene migrato

Quando copi la **directory di stato** (`~/.openclaw/` per impostazione predefinita) e il tuo **workspace**, preservi:

- **Configurazione** -- `openclaw.json` e tutte le impostazioni del gateway
- **Autenticazione** -- `auth-profiles.json` per agente (chiavi API + OAuth), oltre a qualsiasi stato di canale/provider sotto `credentials/`
- **Sessioni** -- cronologia delle conversazioni e stato dell'agente
- **Stato dei canali** -- accesso WhatsApp, sessione Telegram, ecc.
- **File del workspace** -- `MEMORY.md`, `USER.md`, Skills e prompt

<Tip>
Esegui `openclaw status` sulla vecchia macchina per confermare il percorso della directory di stato.
I profili personalizzati usano `~/.openclaw-<profile>/` o un percorso impostato tramite `OPENCLAW_STATE_DIR`.
</Tip>

## Passaggi della migrazione

<Steps>
  <Step title="Arresta il gateway ed esegui un backup">
    Sulla macchina **vecchia**, arresta il gateway in modo che i file non cambino durante la copia, quindi crea un archivio:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se usi più profili (ad esempio `~/.openclaw-work`), archivia ciascuno separatamente.

  </Step>

  <Step title="Installa OpenClaw sulla nuova macchina">
    [Installa](/install) la CLI (e Node, se necessario) sulla nuova macchina.
    Va bene se l'onboarding crea un nuovo `~/.openclaw/` -- lo sovrascriverai nel passaggio successivo.
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
    Sulla nuova macchina, esegui [Doctor](/gateway/doctor) per applicare le migrazioni di configurazione e riparare i servizi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Problemi comuni

<AccordionGroup>
  <Accordion title="Incompatibilità del profilo o della directory di stato">
    Se il vecchio gateway usava `--profile` o `OPENCLAW_STATE_DIR` e quello nuovo no,
    i canali risulteranno disconnessi e le sessioni saranno vuote.
    Avvia il gateway con lo **stesso** profilo o la stessa directory di stato che hai migrato, quindi riesegui `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiare solo openclaw.json">
    Il solo file di configurazione non basta. I profili di autenticazione dei modelli si trovano in
    `agents/<agentId>/agent/auth-profiles.json`, e lo stato di canali/provider
    si trova ancora sotto `credentials/`. Migra sempre l'**intera** directory di stato.
  </Accordion>

  <Accordion title="Permessi e proprietà">
    Se hai copiato come root o hai cambiato utente, il gateway potrebbe non riuscire a leggere le credenziali.
    Assicurati che la directory di stato e il workspace appartengano all'utente che esegue il gateway.
  </Accordion>

  <Accordion title="Modalità remota">
    Se la tua UI punta a un gateway **remoto**, l'host remoto possiede sessioni e workspace.
    Migra l'host del gateway stesso, non il tuo laptop locale. Vedi [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segreti nei backup">
    La directory di stato contiene profili di autenticazione, credenziali dei canali e altro
    stato dei provider.
    Conserva i backup in forma cifrata, evita canali di trasferimento non sicuri e ruota le chiavi se sospetti un'esposizione.
  </Accordion>
</AccordionGroup>

## Checklist di verifica

Sulla nuova macchina, conferma:

- [ ] `openclaw status` mostra il gateway in esecuzione
- [ ] I canali sono ancora connessi (non è necessario ripetere il pairing)
- [ ] La dashboard si apre e mostra le sessioni esistenti
- [ ] I file del workspace (memoria, configurazioni) sono presenti
