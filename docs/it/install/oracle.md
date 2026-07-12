---
read_when:
    - Configurazione di OpenClaw su Oracle Cloud
    - Cerchi un hosting VPS gratuito per OpenClaw
    - Vuoi OpenClaw 24 ore su 24, 7 giorni su 7, su un piccolo server
summary: Ospita OpenClaw nel livello ARM Always Free di Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T07:10:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente sul livello ARM **Always Free** di Oracle Cloud (fino a 4 OCPU, 24 GB di RAM e 200 GB di spazio di archiviazione) senza alcun costo.

## Prerequisiti

- Account Oracle Cloud ([registrazione](https://www.oracle.com/cloud/free/)) -- in caso di problemi, consulta la [guida della community alla registrazione](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Account Tailscale (gratuito su [tailscale.com](https://tailscale.com))
- Una coppia di chiavi SSH
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Crea un'istanza OCI">
    1. Accedi alla [console Oracle Cloud](https://cloud.oracle.com/).
    2. Vai a **Compute > Instances > Create Instance**.
    3. Configura:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (o fino a 4)
       - **Memory:** 12 GB (o fino a 24 GB)
       - **Boot volume:** 50 GB (fino a 200 GB gratuiti)
       - **SSH key:** aggiungi la tua chiave pubblica
    4. Fai clic su **Create** e annota l'indirizzo IP pubblico.

    <Tip>
    Se la creazione dell'istanza non riesce con il messaggio "Out of capacity", prova un dominio di disponibilità diverso oppure riprova più tardi. La capacità del livello gratuito è limitata.
    </Tip>

  </Step>

  <Step title="Connettiti e aggiorna il sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` è necessario per compilare su ARM alcune dipendenze.

  </Step>

  <Step title="Configura l'utente e il nome host">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    L'abilitazione della persistenza mantiene in esecuzione i servizi utente dopo la disconnessione.

  </Step>

  <Step title="Installa Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Da questo momento, connettiti tramite Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Installa OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Quando viene visualizzata la richiesta "How do you want to hatch your bot?", seleziona **Do this later**.

  </Step>

  <Step title="Configura il Gateway">
    Usa l'autenticazione tramite token con Tailscale Serve per un accesso remoto sicuro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    In questo caso, `gateway.trustedProxies=["127.0.0.1"]` serve esclusivamente alla gestione dell'IP inoltrato e del client locale da parte del proxy Tailscale Serve locale. **Non** corrisponde a `gateway.auth.mode: "trusted-proxy"`. Con questa configurazione, le route del visualizzatore delle differenze mantengono un comportamento fail-closed: le richieste non elaborate al visualizzatore da `127.0.0.1` prive delle intestazioni inoltrate dal proxy restituiscono `Diff not found`. Usa `mode=file` / `mode=both` per gli allegati oppure abilita intenzionalmente i visualizzatori remoti e imposta `plugins.entries.diffs.config.viewerBaseUrl` (o passa un `baseUrl` del proxy) se ti servono collegamenti condivisibili al visualizzatore.

  </Step>

  <Step title="Proteggi la sicurezza della VCN">
    Blocca tutto il traffico tranne Tailscale al perimetro della rete:

    1. Vai a **Networking > Virtual Cloud Networks** nella console OCI.
    2. Fai clic sulla tua VCN, quindi su **Security Lists > Default Security List**.
    3. **Rimuovi** tutte le regole in ingresso tranne `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantieni le regole in uscita predefinite (consenti tutto il traffico in uscita).

    Questa configurazione blocca SSH sulla porta 22, HTTP, HTTPS e tutto il resto al perimetro della rete. Da questo momento puoi connetterti solo tramite Tailscale.

  </Step>

  <Step title="Verifica">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accedi all'interfaccia di controllo da qualsiasi dispositivo nella tua tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Sostituisci `<tailnet-name>` con il nome della tua tailnet (visibile in `tailscale status`).

  </Step>
</Steps>

## Verifica il livello di sicurezza

Con la VCN protetta (solo la porta UDP 41641 aperta) e il Gateway associato a local loopback, il traffico pubblico viene bloccato al perimetro della rete e l'accesso amministrativo è limitato alla tailnet. Ciò elimina la necessità di diverse procedure tradizionali di protezione dei VPS:

| Procedura tradizionale                | Necessaria?          | Motivo                                                                                  |
| ------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| Firewall UFW                          | No                   | La VCN blocca il traffico prima che raggiunga l'istanza.                                |
| fail2ban                              | No                   | La porta 22 è bloccata dalla VCN; non esiste una superficie esposta ad attacchi di forza bruta. |
| Protezione di sshd                    | No                   | Tailscale SSH non utilizza sshd.                                                        |
| Disabilitazione dell'accesso root     | No                   | Tailscale autentica tramite l'identità della tailnet, non tramite gli utenti di sistema. |
| Autenticazione solo con chiave SSH    | No                   | Come sopra: l'identità della tailnet sostituisce le chiavi SSH di sistema.              |
| Protezione IPv6                       | Generalmente no      | Dipende dalle impostazioni della VCN/sottorete; verifica cosa è effettivamente assegnato o esposto. |

Sono comunque consigliati:

- `chmod 700 ~/.openclaw` per limitare le autorizzazioni dei file delle credenziali.
- `openclaw security audit` per una verifica del livello di sicurezza specifica per OpenClaw.
- Eseguire regolarmente `sudo apt update && sudo apt upgrade` per applicare le patch del sistema operativo.
- Controllare periodicamente i dispositivi nella [console di amministrazione Tailscale](https://login.tailscale.com/admin).

Comandi di verifica rapida:

```bash
# Verifica che nessuna porta pubblica sia in ascolto
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifica che Tailscale SSH sia attivo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Facoltativo: disabilita completamente sshd dopo aver verificato il funzionamento di Tailscale SSH
sudo systemctl disable --now ssh
```

## Note su ARM

Il livello Always Free usa ARM (`aarch64`). La maggior parte delle funzionalità di OpenClaw opera correttamente; un numero limitato di file binari nativi richiede build per ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript puro, nessun problema.
- La maggior parte dei pacchetti npm con codice nativo: sono disponibili artefatti `linux-arm64` precompilati.
- Strumenti CLI facoltativi (ad esempio file binari Go/Rust distribuiti dalle Skills): prima dell'installazione, verifica che sia disponibile una versione `aarch64` / `linux-arm64`.

Verifica l'architettura con `uname -m` (dovrebbe restituire `aarch64`). Per i file binari privi di una build ARM, esegui l'installazione dal codice sorgente oppure non installarli.

## Persistenza e backup

Lo stato di OpenClaw si trova nelle seguenti directory:

- `~/.openclaw/` -- `openclaw.json`, i file `auth-profiles.json` di ciascun agente, lo stato di canali e provider e i dati delle sessioni.
- `~/.openclaw/workspace/` -- lo spazio di lavoro dell'agente (SOUL.md, memoria, artefatti).

Questi dati persistono dopo i riavvii. Per creare un'istantanea portabile:

```bash
openclaw backup create
```

## Alternativa: tunnel SSH

Se Tailscale Serve non funziona, utilizza un tunnel SSH dal computer locale:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Quindi apri `http://localhost:18789`.

## Risoluzione dei problemi

**La creazione dell'istanza non riesce ("Out of capacity")** -- Le istanze ARM del livello gratuito sono molto richieste. Prova un dominio di disponibilità diverso oppure riprova nelle ore di minore affluenza.

**Tailscale non si connette** -- Esegui `sudo tailscale up --ssh --hostname=openclaw --reset` per autenticarti nuovamente.

**Il Gateway non si avvia** -- Esegui `openclaw doctor --non-interactive` e controlla i log con `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemi con i file binari ARM** -- La maggior parte dei pacchetti npm funziona su ARM64. Per i file binari nativi, cerca versioni `linux-arm64` o `aarch64`. Verifica l'architettura con `uname -m`.

## Passaggi successivi

- [Canali](/it/channels) -- collega Telegram, WhatsApp, Discord e altri servizi
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating) -- mantieni OpenClaw aggiornato

## Argomenti correlati

- [Panoramica dell'installazione](/it/install)
- [GCP](/it/install/gcp)
- [Hosting VPS](/it/vps)
