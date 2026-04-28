---
read_when:
    - Vuoi un deployment automatico del server con rafforzamento della sicurezza
    - Hai bisogno di una configurazione isolata dal firewall con accesso VPN
    - Stai eseguendo il deployment su server Debian/Ubuntu remoti
summary: Installazione automatizzata e protetta di OpenClaw con Ansible, Tailscale VPN e isolamento tramite firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-21T08:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Installazione con Ansible

Distribuisci OpenClaw su server di produzione con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un installer automatico con architettura orientata alla sicurezza.

<Info>
Il repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) è la fonte di riferimento per il deployment con Ansible. Questa pagina è una panoramica rapida.
</Info>

## Prerequisiti

| Requisito | Dettagli                                                  |
| --------- | --------------------------------------------------------- |
| **OS**    | Debian 11+ o Ubuntu 20.04+                                |
| **Accesso** | Privilegi di root o sudo                               |
| **Rete**  | Connessione Internet per l'installazione dei pacchetti    |
| **Ansible** | 2.14+ (installato automaticamente dallo script quick-start) |

## Cosa ottieni

- **Sicurezza firewall-first** -- UFW + isolamento Docker (accessibili solo SSH + Tailscale)
- **VPN Tailscale** -- accesso remoto sicuro senza esporre pubblicamente i servizi
- **Docker** -- container sandbox isolati, binding solo localhost
- **Defense in depth** -- architettura di sicurezza a 4 livelli
- **Integrazione con Systemd** -- avvio automatico al boot con hardening
- **Configurazione con un solo comando** -- deployment completo in pochi minuti

## Avvio rapido

Installazione con un solo comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Cosa viene installato

Il playbook Ansible installa e configura:

1. **Tailscale** -- mesh VPN per accesso remoto sicuro
2. **Firewall UFW** -- solo porte SSH + Tailscale
3. **Docker CE + Compose V2** -- per il backend sandbox dell'agente predefinito
4. **Node.js 24 + pnpm** -- dipendenze runtime (Node 22 LTS, attualmente `22.14+`, resta supportato)
5. **OpenClaw** -- basato su host, non containerizzato
6. **Servizio Systemd** -- avvio automatico con hardening di sicurezza

<Note>
Il Gateway viene eseguito direttamente sull'host (non in Docker). Il sandboxing degli agenti è
opzionale; questo playbook installa Docker perché è il backend sandbox
predefinito. Consulta [Sandboxing](/it/gateway/sandboxing) per i dettagli e per gli altri backend.
</Note>

## Configurazione post-installazione

<Steps>
  <Step title="Passa all'utente openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Esegui la procedura guidata di onboarding">
    Lo script post-installazione ti guida nella configurazione delle impostazioni di OpenClaw.
  </Step>
  <Step title="Collega i provider di messaggistica">
    Accedi a WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verifica l'installazione">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connettiti a Tailscale">
    Unisciti alla tua mesh VPN per l'accesso remoto sicuro.
  </Step>
</Steps>

### Comandi rapidi

```bash
# Controlla lo stato del servizio
sudo systemctl status openclaw

# Visualizza i log live
sudo journalctl -u openclaw -f

# Riavvia il gateway
sudo systemctl restart openclaw

# Login provider (esegui come utente openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architettura di sicurezza

Il deployment usa un modello di difesa a 4 livelli:

1. **Firewall (UFW)** -- solo SSH (22) + Tailscale (41641/udp) esposti pubblicamente
2. **VPN (Tailscale)** -- Gateway accessibile solo tramite mesh VPN
3. **Isolamento Docker** -- la catena iptables DOCKER-USER impedisce l'esposizione di porte esterne
4. **Hardening Systemd** -- NoNewPrivileges, PrivateTmp, utente non privilegiato

Per verificare la tua superficie di attacco esterna:

```bash
nmap -p- YOUR_SERVER_IP
```

Solo la porta 22 (SSH) dovrebbe essere aperta. Tutti gli altri servizi (Gateway, Docker) sono bloccati.

Docker viene installato per le sandbox degli agenti (esecuzione isolata degli strumenti), non per eseguire il Gateway stesso. Consulta [Multi-Agent Sandbox and Tools](/it/tools/multi-agent-sandbox-tools) per la configurazione della sandbox.

## Installazione manuale

Se preferisci un controllo manuale sull'automazione:

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
  <Step title="Installa le collection Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Esegui il playbook">
    ```bash
    ./run-playbook.sh
    ```

    In alternativa, eseguilo direttamente e poi avvia manualmente lo script di configurazione:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Poi esegui: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aggiornamento

L'installer Ansible configura OpenClaw per aggiornamenti manuali. Consulta [Updating](/it/install/updating) per il flusso di aggiornamento standard.

Per rieseguire il playbook Ansible (ad esempio, per modifiche alla configurazione):

```bash
cd openclaw-ansible
./run-playbook.sh
```

È idempotente e sicuro da eseguire più volte.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il firewall blocca la mia connessione">
    - Assicurati prima di poter accedere tramite VPN Tailscale
    - L'accesso SSH (porta 22) è sempre consentito
    - Il Gateway è accessibile solo tramite Tailscale per progettazione

  </Accordion>
  <Accordion title="Il servizio non si avvia">
    ```bash
    # Controlla i log
    sudo journalctl -u openclaw -n 100

    # Verifica i permessi
    sudo ls -la /opt/openclaw

    # Testa l'avvio manuale
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemi con la sandbox Docker">
    ```bash
    # Verifica che Docker sia in esecuzione
    sudo systemctl status docker

    # Controlla l'immagine sandbox
    sudo docker images | grep openclaw-sandbox

    # Crea l'immagine sandbox se manca
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Il login del provider fallisce">
    Assicurati di essere in esecuzione come utente `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

Per l'architettura di sicurezza dettagliata e la risoluzione dei problemi, consulta il repository openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Correlati

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guida completa al deployment
- [Docker](/it/install/docker) -- configurazione del Gateway containerizzato
- [Sandboxing](/it/gateway/sandboxing) -- configurazione della sandbox dell'agente
- [Multi-Agent Sandbox and Tools](/it/tools/multi-agent-sandbox-tools) -- isolamento per agente
