---
read_when:
    - Si desidera automatizzare la distribuzione del server con un rafforzamento della sicurezza
    - È necessaria una configurazione isolata tramite firewall con accesso VPN
    - Si sta eseguendo il deployment su server Debian/Ubuntu remoti
summary: Installazione automatizzata e con protezione avanzata di OpenClaw tramite Ansible, VPN Tailscale e isolamento mediante firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-16T14:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Distribuisci OpenClaw sui server di produzione con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un programma di installazione automatizzato con un'architettura che mette la sicurezza al primo posto.

<Info>
Il repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) è la fonte autorevole per la distribuzione con Ansible. Questa pagina ne offre una rapida panoramica.
</Info>

## Prerequisiti

| Requisito | Dettagli                                                   |
| ----------- | --------------------------------------------------------- |
| Sistema operativo | Debian 11+ o Ubuntu 20.04+                         |
| Accesso     | Privilegi root o sudo                                     |
| Rete        | Connessione Internet per l'installazione dei pacchetti    |
| Ansible     | 2.14+ (installato automaticamente dallo script di avvio rapido) |

## Funzionalità incluse

- Sicurezza incentrata sul firewall: UFW + isolamento Docker (sono raggiungibili solo SSH + Tailscale)
- VPN Tailscale per l'accesso remoto senza esporre pubblicamente i servizi
- Docker per container sandbox isolati con binding solo su localhost
- Integrazione con systemd con protezioni avanzate e avvio automatico all'accensione
- Configurazione con un solo comando

## Avvio rapido

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Componenti installati

1. Tailscale (VPN mesh per l'accesso remoto sicuro)
2. Firewall UFW (solo porte SSH + Tailscale)
3. Docker CE + Compose V2 (backend sandbox predefinito per gli agenti)
4. Node.js e pnpm (OpenClaw richiede Node 22.22.3+, 24.15+ o 25.9+; è consigliato Node 24)
5. OpenClaw, installato direttamente sull'host, non in un container
6. Un servizio systemd con protezioni di sicurezza avanzate

<Note>
Il Gateway viene eseguito direttamente sull'host, non in Docker. L'uso della sandbox per gli agenti è
facoltativo; questo playbook installa Docker perché è il backend sandbox
predefinito. Per altri backend, consultare [Uso della sandbox](/it/gateway/sandboxing).
</Note>

## Configurazione successiva all'installazione

<Steps>
  <Step title="Passare all'utente openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Eseguire la procedura guidata di onboarding">
    Lo script successivo all'installazione guida nella configurazione di OpenClaw.
  </Step>
  <Step title="Connettere i canali di messaggistica">
    Accedere a WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verificare l'installazione">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connettersi a Tailscale">
    Entrare nella mesh VPN per un accesso remoto sicuro.
  </Step>
</Steps>

### Comandi rapidi

```bash
# Controlla lo stato del servizio
sudo systemctl status openclaw

# Visualizza i log in tempo reale
sudo journalctl -u openclaw -f

# Riavvia il Gateway
sudo systemctl restart openclaw

# Accesso al canale (eseguire come utente openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Architettura di sicurezza

Modello di difesa a quattro livelli:

1. Firewall (UFW): solo SSH (22) e Tailscale (41641/udp) sono esposti pubblicamente
2. VPN (Tailscale): il Gateway è raggiungibile solo tramite la mesh VPN
3. Isolamento Docker: la catena iptables `DOCKER-USER` impedisce l'esposizione esterna delle porte
4. Protezione avanzata di systemd: `NoNewPrivileges`, `PrivateTmp`, utente senza privilegi

Verificare la superficie di attacco esterna:

```bash
nmap -p- YOUR_SERVER_IP
```

Dovrebbe essere aperta solo la porta 22 (SSH). Il Gateway e Docker rimangono protetti.

Docker viene installato per le sandbox degli agenti (esecuzione isolata degli strumenti), non per eseguire il Gateway. Per la configurazione della sandbox, consultare [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools).

## Installazione manuale

<Steps>
  <Step title="Installare i prerequisiti">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clonare il repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Installare le raccolte Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Eseguire il playbook">
    ```bash
    ./run-playbook.sh
    ```

    In alternativa, eseguire direttamente il playbook e poi eseguire manualmente lo script di configurazione:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Quindi esegui: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aggiornamento

Il programma di installazione Ansible configura OpenClaw per gli aggiornamenti manuali; per la procedura standard, consultare [Aggiornamento](/it/install/updating).

Per eseguire nuovamente il playbook (ad esempio, dopo modifiche alla configurazione):

```bash
cd openclaw-ansible
./run-playbook.sh
```

L'operazione è idempotente e può essere eseguita più volte in sicurezza.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il firewall blocca la connessione">
    - Connettersi prima tramite la VPN Tailscale; per progettazione, il Gateway è raggiungibile solo in questo modo.
    - SSH (porta 22) è sempre consentito.

  </Accordion>
  <Accordion title="Il servizio non si avvia">
    ```bash
    # Controlla i log
    sudo journalctl -u openclaw -n 100

    # Verifica le autorizzazioni
    sudo ls -la /opt/openclaw

    # Verifica l'avvio manuale
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemi con la sandbox Docker">
    ```bash
    # Verifica che Docker sia in esecuzione
    sudo systemctl status docker

    # Controlla l'immagine della sandbox
    sudo docker images | grep openclaw-sandbox

    # Crea l'immagine della sandbox se manca (richiede un checkout del codice sorgente)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Per le installazioni npm senza un checkout del codice sorgente, consulta
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="L'accesso al canale non riesce">
    Assicurarsi di eseguire i comandi come utente `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

Per informazioni dettagliate sull'architettura di sicurezza e sulla risoluzione dei problemi, consultare il repository openclaw-ansible:

- [Architettura di sicurezza](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Dettagli tecnici](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guida alla risoluzione dei problemi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Contenuti correlati

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): guida completa alla distribuzione
- [Docker](/it/install/docker): configurazione del Gateway in container
- [Uso della sandbox](/it/gateway/sandboxing): configurazione della sandbox per gli agenti
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools): isolamento per agente
