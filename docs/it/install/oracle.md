---
read_when:
    - Configurare OpenClaw su Oracle Cloud
    - Cercare hosting VPS gratuito per OpenClaw
    - Voler usare OpenClaw 24/7 su un piccolo server
summary: Ospitare OpenClaw sul tier ARM Always Free di Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T13:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Esegui un Gateway OpenClaw persistente sul tier ARM **Always Free** di Oracle Cloud (fino a 4 OCPU, 24 GB di RAM, 200 GB di storage) senza costi.

## Prerequisiti

- Account Oracle Cloud ([registrazione](https://www.oracle.com/cloud/free/)) -- vedi la [guida della community per la registrazione](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se incontri problemi
- Account Tailscale (gratuito su [tailscale.com](https://tailscale.com))
- Una coppia di chiavi SSH
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Crea un'istanza OCI">
    1. Accedi a [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Vai a **Compute > Instances > Create Instance**.
    3. Configura:
       - **Nome:** `openclaw`
       - **Immagine:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (o fino a 4)
       - **Memoria:** 12 GB (o fino a 24 GB)
       - **Volume di avvio:** 50 GB (fino a 200 GB gratuiti)
       - **Chiave SSH:** aggiungi la tua chiave pubblica
    4. Fai clic su **Create** e annota l'indirizzo IP pubblico.

    <Tip>
    Se la creazione dell'istanza fallisce con "Out of capacity", prova un availability domain diverso o riprova più tardi. La capacità del free tier è limitata.
    </Tip>

  </Step>

  <Step title="Connettiti e aggiorna il sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` è richiesto per la compilazione ARM di alcune dipendenze.

  </Step>

  <Step title="Configura utente e hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    L'abilitazione di linger mantiene in esecuzione i servizi utente dopo il logout.

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

    Quando viene richiesto "How do you want to hatch your bot?", seleziona **Do this later**.

  </Step>

  <Step title="Configura il gateway">
    Usa l'autenticazione con token con Tailscale Serve per un accesso remoto sicuro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` qui serve solo per la gestione dell'IP inoltrato/client locale del proxy locale Tailscale Serve. **Non** è `gateway.auth.mode: "trusted-proxy"`. Le route del visualizzatore diff mantengono un comportamento fail-closed in questa configurazione: le richieste raw del visualizzatore a `127.0.0.1` senza header proxy inoltrati possono restituire `Diff not found`. Usa `mode=file` / `mode=both` per gli allegati, oppure abilita intenzionalmente i visualizzatori remoti e imposta `plugins.entries.diffs.config.viewerBaseUrl` (o passa un `baseUrl` del proxy) se ti servono link del visualizzatore condivisibili.

  </Step>

  <Step title="Metti in sicurezza la VCN">
    Blocca tutto il traffico tranne Tailscale al margine della rete:

    1. Vai a **Networking > Virtual Cloud Networks** nella OCI Console.
    2. Fai clic sulla tua VCN, poi su **Security Lists > Default Security List**.
    3. **Rimuovi** tutte le regole di ingresso tranne `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantieni le regole di uscita predefinite (consenti tutto il traffico in uscita).

    Questo blocca SSH sulla porta 22, HTTP, HTTPS e tutto il resto al margine della rete. Da questo punto in poi puoi connetterti solo tramite Tailscale.

  </Step>

  <Step title="Verifica">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accedi alla Control UI da qualsiasi dispositivo sul tuo tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Sostituisci `<tailnet-name>` con il nome del tuo tailnet (visibile in `tailscale status`).

  </Step>
</Steps>

## Fallback: tunnel SSH

Se Tailscale Serve non funziona, usa un tunnel SSH dalla tua macchina locale:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Poi apri `http://localhost:18789`.

## Troubleshooting

**La creazione dell'istanza fallisce ("Out of capacity")** -- Le istanze ARM del free tier sono molto richieste. Prova un availability domain diverso o riprova in orari di minore utilizzo.

**Tailscale non si connette** -- Esegui `sudo tailscale up --ssh --hostname=openclaw --reset` per autenticarti di nuovo.

**Il Gateway non si avvia** -- Esegui `openclaw doctor --non-interactive` e controlla i log con `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemi con binari ARM** -- La maggior parte dei pacchetti npm funziona su ARM64. Per i binari nativi, cerca release `linux-arm64` o `aarch64`. Verifica l'architettura con `uname -m`.

## Passaggi successivi

- [Channels](/it/channels) -- collega Telegram, WhatsApp, Discord e altro
- [Gateway configuration](/gateway/configuration) -- tutte le opzioni di configurazione
- [Updating](/install/updating) -- mantieni OpenClaw aggiornato
