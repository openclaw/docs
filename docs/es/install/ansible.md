---
read_when:
    - Quieres una implementación automatizada de servidor con refuerzo de seguridad
    - Necesita una configuración aislada por firewall con acceso VPN
    - Estás implementando en servidores remotos Debian/Ubuntu
summary: Instalación automatizada y reforzada de OpenClaw con Ansible, VPN de Tailscale y aislamiento de firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-05T11:22:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Implementa OpenClaw en servidores de producción con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un instalador automatizado con una arquitectura que prioriza la seguridad.

<Info>
El repositorio [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) es la fuente de verdad para la implementación con Ansible. Esta página es una vista general rápida.
</Info>

## Requisitos previos

| Requisito   | Detalles                                                  |
| ----------- | --------------------------------------------------------- |
| SO          | Debian 11+ o Ubuntu 20.04+                                |
| Acceso      | Privilegios root o sudo                                   |
| Red         | Conexión a Internet para la instalación de paquetes       |
| Ansible     | 2.14+ (instalado automáticamente por el script de inicio rápido) |

## Qué obtienes

- Seguridad con firewall primero: UFW + aislamiento de Docker (solo SSH + Tailscale accesibles)
- VPN de Tailscale para acceso remoto sin exponer servicios públicamente
- Docker para contenedores de sandbox aislados con enlaces solo a localhost
- Integración con systemd con endurecimiento, inicio automático al arrancar
- Configuración con un solo comando

## Inicio rápido

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Qué se instala

1. Tailscale (VPN mallada para acceso remoto seguro)
2. Firewall UFW (solo puertos SSH + Tailscale)
3. Docker CE + Compose V2 (backend de sandbox de agente predeterminado)
4. Node.js y pnpm (OpenClaw requiere Node 22.19+ o 23.11+; se recomienda Node 24)
5. OpenClaw, instalado basado en el host, no en contenedores
6. Un servicio systemd con endurecimiento de seguridad

<Note>
El Gateway se ejecuta directamente en el host, no en Docker. El sandboxing de agentes es
opcional; este playbook instala Docker porque es el backend de sandbox
predeterminado. Consulta [Sandboxing](/es/gateway/sandboxing) para otros backends.
</Note>

## Configuración posterior a la instalación

<Steps>
  <Step title="Cambia al usuario openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Ejecuta el asistente de incorporación">
    El script posterior a la instalación te guía para configurar OpenClaw.
  </Step>
  <Step title="Conecta canales de mensajería">
    Inicia sesión en WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verifica la instalación">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conéctate a Tailscale">
    Únete a tu malla VPN para acceso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Channel login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Arquitectura de seguridad

Modelo de defensa de cuatro capas:

1. Firewall (UFW): solo SSH (22) y Tailscale (41641/udp) expuestos públicamente
2. VPN (Tailscale): el Gateway solo es accesible mediante la malla VPN
3. Aislamiento de Docker: la cadena iptables `DOCKER-USER` evita la exposición de puertos externos
4. Endurecimiento de systemd: `NoNewPrivileges`, `PrivateTmp`, usuario sin privilegios

Verifica tu superficie de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Solo el puerto 22 (SSH) debería estar abierto. El Gateway y Docker permanecen bloqueados.

Docker se instala para sandboxes de agentes (ejecución aislada de herramientas), no para ejecutar el Gateway. Consulta [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools) para la configuración de sandbox.

## Instalación manual

<Steps>
  <Step title="Instala los requisitos previos">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clona el repositorio">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instala las colecciones de Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Ejecuta el playbook">
    ```bash
    ./run-playbook.sh
    ```

    O ejecuta el playbook directamente y luego ejecuta el script de configuración manualmente:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Actualización

El instalador de Ansible configura OpenClaw para actualizaciones manuales; consulta [Actualización](/es/install/updating) para el flujo estándar.

Para volver a ejecutar el playbook (por ejemplo, después de cambios de configuración):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Esto es idempotente y seguro para ejecutarlo varias veces.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El firewall bloquea mi conexión">
    - Conéctate primero mediante la VPN de Tailscale; el Gateway solo es accesible de esa manera por diseño.
    - SSH (puerto 22) siempre está permitido.

  </Accordion>
  <Accordion title="El servicio no se inicia">
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
  <Accordion title="Problemas con el sandbox de Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build the sandbox image if missing (requires a source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Falla el inicio de sesión del canal">
    Asegúrate de estar ejecutando como el usuario `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configuración avanzada

Para obtener detalles sobre la arquitectura de seguridad y la solución de problemas, consulta el repositorio openclaw-ansible:

- [Arquitectura de seguridad](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalles técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guía de solución de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): guía completa de implementación
- [Docker](/es/install/docker): configuración del Gateway en contenedores
- [Sandboxing](/es/gateway/sandboxing): configuración de sandbox de agente
- [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools): aislamiento por agente
