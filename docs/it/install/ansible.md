---
read_when:
    - Vuoi una distribuzione automatizzata del server con rafforzamento della sicurezza
    - È necessaria una configurazione isolata tramite firewall con accesso VPN
    - Stai distribuendo su server Debian/Ubuntu remoti
summary: Installazione automatizzata e rafforzata di OpenClaw con Ansible, VPN Tailscale e isolamento tramite firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-30T08:56:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Installazione Ansible

Distribuisci OpenClaw su server di produzione con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un installer automatizzato con architettura orientata alla sicurezza.

<Info>
Il repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) è la fonte di riferimento per la distribuzione con Ansible. Questa pagina è una panoramica rapida.
</Info>

## Prerequisiti

| Requisito   | Dettagli                                                  |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ o Ubuntu 20.04+                               |
| **Accesso** | Privilegi root o sudo                                     |
| **Rete**    | Connessione Internet per l'installazione dei pacchetti    |
| **Ansible** | 2.14+ (installato automaticamente dallo script di avvio rapido) |

## Cosa ottieni

- **Sicurezza con priorità al firewall** -- isolamento UFW + Docker (accessibili solo SSH + Tailscale)
- **VPN Tailscale** -- accesso remoto sicuro senza esporre pubblicamente i servizi
- **Docker** -- container sandbox isolati, binding solo su localhost
- **Difesa in profondità** -- architettura di sicurezza a 4 livelli
- **Integrazione Systemd** -- avvio automatico al boot con hardening
- **Configurazione con un solo comando** -- distribuzione completa in pochi minuti

## Avvio rapido

Installazione con un solo comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Cosa viene installato

Il playbook Ansible installa e configura:

1. **Tailscale** -- VPN mesh per accesso remoto sicuro
2. **Firewall UFW** -- solo porte SSH + Tailscale
3. **Docker CE + Compose V2** -- per il backend sandbox predefinito degli agenti
4. **Node.js 24 + pnpm** -- dipendenze di runtime (Node 22 LTS, attualmente `22.14+`, resta supportato)
5. **OpenClaw** -- basato sull'host, non containerizzato
6. **Servizio Systemd** -- avvio automatico con hardening di sicurezza

<Note>
Il Gateway viene eseguito direttamente sull'host (non in Docker). Il sandboxing degli agenti è
facoltativo; questo playbook installa Docker perché è il backend sandbox
predefinito. Consulta [Sandboxing](/it/gateway/sandboxing) per dettagli e altri backend.
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
  <Step title="Connetti i provider di messaggistica">
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
    Unisciti alla tua mesh VPN per un accesso remoto sicuro.
  </Step>
</Steps>

### Comandi rapidi

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Architettura di sicurezza

La distribuzione usa un modello di difesa a 4 livelli:

1. **Firewall (UFW)** -- solo SSH (22) + Tailscale (41641/udp) esposti pubblicamente
2. **VPN (Tailscale)** -- Gateway accessibile solo tramite mesh VPN
3. **Isolamento Docker** -- la chain iptables DOCKER-USER impedisce l'esposizione di porte esterne
4. **Hardening Systemd** -- NoNewPrivileges, PrivateTmp, utente senza privilegi

Per verificare la tua superficie di attacco esterna:

```bash
nmap -p- YOUR_SERVER_IP
```

Dovrebbe essere aperta solo la porta 22 (SSH). Tutti gli altri servizi (Gateway, Docker) sono bloccati.

Docker viene installato per le sandbox degli agenti (esecuzione isolata degli strumenti), non per eseguire il Gateway stesso. Consulta [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per la configurazione della sandbox.

## Installazione manuale

Se preferisci il controllo manuale rispetto all'automazione:

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

    In alternativa, eseguilo direttamente e poi esegui manualmente lo script di configurazione in seguito:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aggiornamento

L'installer Ansible configura OpenClaw per aggiornamenti manuali. Consulta [Aggiornamento](/it/install/updating) per il flusso di aggiornamento standard.

Per rieseguire il playbook Ansible (ad esempio, per modifiche di configurazione):

```bash
cd openclaw-ansible
./run-playbook.sh
```

È idempotente e può essere eseguito più volte in sicurezza.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il firewall blocca la mia connessione">
    - Assicurati prima di poter accedere tramite VPN Tailscale
    - L'accesso SSH (porta 22) è sempre consentito
    - Il Gateway è accessibile solo tramite Tailscale per progettazione

  </Accordion>
  <Accordion title="Il servizio non si avvia">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemi con la sandbox Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="L'accesso al provider non riesce">
    Assicurati di eseguire come utente `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

Per architettura di sicurezza dettagliata e risoluzione dei problemi, consulta il repo openclaw-ansible:

- [Architettura di sicurezza](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Dettagli tecnici](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guida alla risoluzione dei problemi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Correlati

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guida completa alla distribuzione
- [Docker](/it/install/docker) -- configurazione del Gateway containerizzato
- [Sandboxing](/it/gateway/sandboxing) -- configurazione della sandbox degli agenti
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- isolamento per agente
