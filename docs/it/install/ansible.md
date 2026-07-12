---
read_when:
    - Desideri una distribuzione automatizzata del server con misure di sicurezza avanzate
    - È necessaria una configurazione isolata da firewall con accesso tramite VPN
    - Stai eseguendo il deployment su server Debian/Ubuntu remoti
summary: Installazione automatizzata e protetta di OpenClaw con Ansible, VPN Tailscale e isolamento tramite firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-12T07:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Distribuisci OpenClaw sui server di produzione con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un programma di installazione automatizzato con un'architettura orientata alla sicurezza.

<Info>
Il repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) è la fonte autorevole per la distribuzione con Ansible. Questa pagina ne offre una rapida panoramica.
</Info>

## Prerequisiti

| Requisito | Dettagli                                                          |
| --------- | ----------------------------------------------------------------- |
| SO        | Debian 11+ o Ubuntu 20.04+                                        |
| Accesso   | Privilegi root o sudo                                             |
| Rete      | Connessione Internet per l'installazione dei pacchetti            |
| Ansible   | 2.14+ (installato automaticamente dallo script di avvio rapido)   |

## Cosa ottieni

- Sicurezza basata innanzitutto sul firewall: UFW + isolamento Docker (sono raggiungibili solo SSH + Tailscale)
- VPN Tailscale per l'accesso remoto senza esporre pubblicamente i servizi
- Docker per container sandbox isolati con associazioni limitate a localhost
- Integrazione con systemd con rafforzamento della sicurezza e avvio automatico all'accensione
- Configurazione con un solo comando

## Avvio rapido

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Cosa viene installato

1. Tailscale (VPN mesh per l'accesso remoto sicuro)
2. Firewall UFW (solo porte SSH + Tailscale)
3. Docker CE + Compose V2 (backend predefinito per la sandbox degli agenti)
4. Node.js e pnpm (OpenClaw richiede Node 22.19+ o 23.11+; è consigliato Node 24)
5. OpenClaw, installato direttamente sull'host, non in un container
6. Un servizio systemd con rafforzamento della sicurezza

<Note>
Il Gateway viene eseguito direttamente sull'host, non in Docker. L'uso della sandbox per gli agenti è
facoltativo; questo playbook installa Docker perché è il backend predefinito per la sandbox.
Per gli altri backend, consulta [Uso della sandbox](/it/gateway/sandboxing).
</Note>

## Configurazione successiva all'installazione

<Steps>
  <Step title="Passa all'utente openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Esegui la procedura guidata di configurazione iniziale">
    Lo script successivo all'installazione ti guida nella configurazione di OpenClaw.
  </Step>
  <Step title="Connetti i canali di messaggistica">
    Accedi a WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verifica l'installazione">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connettiti a Tailscale">
    Entra nella tua rete VPN mesh per un accesso remoto sicuro.
  </Step>
</Steps>

### Comandi rapidi

```bash
# Controlla lo stato del servizio
sudo systemctl status openclaw

# Visualizza i log in tempo reale
sudo journalctl -u openclaw -f

# Riavvia il gateway
sudo systemctl restart openclaw

# Accesso al canale (esegui come utente openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Architettura di sicurezza

Modello di difesa a quattro livelli:

1. Firewall (UFW): solo SSH (22) e Tailscale (41641/udp) sono esposti pubblicamente
2. VPN (Tailscale): il Gateway è raggiungibile solo tramite la rete VPN mesh
3. Isolamento Docker: la catena iptables `DOCKER-USER` impedisce l'esposizione esterna delle porte
4. Rafforzamento della sicurezza di systemd: `NoNewPrivileges`, `PrivateTmp`, utente senza privilegi

Verifica la superficie di attacco esterna:

```bash
nmap -p- YOUR_SERVER_IP
```

Dovrebbe essere aperta solo la porta 22 (SSH). Il Gateway e Docker rimangono protetti.

Docker viene installato per le sandbox degli agenti (esecuzione isolata degli strumenti), non per eseguire il Gateway. Per la configurazione della sandbox, consulta [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools).

## Installazione manuale

<Steps>
  <Step title="Installa i prerequisiti">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clona il repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Installa le raccolte Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Esegui il playbook">
    ```bash
    ./run-playbook.sh
    ```

    In alternativa, esegui direttamente il playbook e poi avvia manualmente lo script di configurazione:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Quindi esegui: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aggiornamento

Il programma di installazione Ansible configura OpenClaw per gli aggiornamenti manuali; per il flusso standard, consulta [Aggiornamento](/it/install/updating).

Per eseguire nuovamente il playbook, ad esempio dopo modifiche alla configurazione:

```bash
cd openclaw-ansible
./run-playbook.sh
```

L'operazione è idempotente e può essere eseguita più volte in sicurezza.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il firewall blocca la connessione">
    - Connettiti prima tramite la VPN Tailscale; per progettazione, il Gateway è raggiungibile solo in questo modo.
    - SSH (porta 22) è sempre consentito.

  </Accordion>
  <Accordion title="Il servizio non si avvia">
    ```bash
    # Controlla i log
    sudo journalctl -u openclaw -n 100

    # Verifica le autorizzazioni
    sudo ls -la /opt/openclaw

    # Prova l'avvio manuale
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
    Assicurati di eseguire i comandi come utente `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

Per informazioni dettagliate sull'architettura di sicurezza e sulla risoluzione dei problemi, consulta il repository openclaw-ansible:

- [Architettura di sicurezza](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Dettagli tecnici](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guida alla risoluzione dei problemi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Contenuti correlati

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): guida completa alla distribuzione
- [Docker](/it/install/docker): configurazione del Gateway in container
- [Uso della sandbox](/it/gateway/sandboxing): configurazione della sandbox degli agenti
- [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools): isolamento per agente
