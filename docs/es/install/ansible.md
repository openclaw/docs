---
read_when:
    - Quieres un despliegue automatizado del servidor con refuerzo de seguridad
    - Necesita una configuración aislada por firewall con acceso mediante VPN
    - Está desplegando en servidores Debian/Ubuntu remotos
summary: Instalación automatizada y reforzada de OpenClaw con Ansible, VPN Tailscale y aislamiento mediante firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-30T05:46:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Instalación con Ansible

Implementa OpenClaw en servidores de producción con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un instalador automatizado con una arquitectura centrada en la seguridad.

<Info>
El repositorio [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) es la fuente de referencia para la implementación con Ansible. Esta página es un resumen rápido.
</Info>

## Requisitos previos

| Requisito   | Detalles                                                  |
| ----------- | --------------------------------------------------------- |
| **SO**      | Debian 11+ o Ubuntu 20.04+                                |
| **Acceso**  | Privilegios de root o sudo                                |
| **Red**     | Conexión a Internet para la instalación de paquetes       |
| **Ansible** | 2.14+ (instalado automáticamente por el script de inicio rápido) |

## Lo que obtienes

- **Seguridad con firewall primero** -- UFW + aislamiento de Docker (solo SSH + Tailscale accesibles)
- **VPN de Tailscale** -- acceso remoto seguro sin exponer servicios públicamente
- **Docker** -- contenedores sandbox aislados, vinculaciones solo a localhost
- **Defensa en profundidad** -- arquitectura de seguridad de 4 capas
- **Integración con Systemd** -- inicio automático al arrancar con endurecimiento
- **Configuración con un solo comando** -- implementación completa en minutos

## Inicio rápido

Instalación con un solo comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Qué se instala

El playbook de Ansible instala y configura:

1. **Tailscale** -- VPN de malla para acceso remoto seguro
2. **Firewall UFW** -- solo puertos SSH + Tailscale
3. **Docker CE + Compose V2** -- para el backend sandbox de agente predeterminado
4. **Node.js 24 + pnpm** -- dependencias de runtime (Node 22 LTS, actualmente `22.14+`, sigue siendo compatible)
5. **OpenClaw** -- basado en el host, no en contenedores
6. **Servicio Systemd** -- inicio automático con endurecimiento de seguridad

<Note>
El Gateway se ejecuta directamente en el host (no en Docker). El uso de sandbox para agentes es
opcional; este playbook instala Docker porque es el backend sandbox
predeterminado. Consulta [Sandboxing](/es/gateway/sandboxing) para detalles y otros backends.
</Note>

## Configuración posterior a la instalación

<Steps>
  <Step title="Cambiar al usuario openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Ejecutar el asistente de incorporación">
    El script posterior a la instalación te guía para configurar los ajustes de OpenClaw.
  </Step>
  <Step title="Conectar proveedores de mensajería">
    Inicia sesión en WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verificar la instalación">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conectarse a Tailscale">
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

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Arquitectura de seguridad

La implementación usa un modelo de defensa de 4 capas:

1. **Firewall (UFW)** -- solo SSH (22) + Tailscale (41641/udp) expuestos públicamente
2. **VPN (Tailscale)** -- Gateway accesible solo mediante malla VPN
3. **Aislamiento de Docker** -- la cadena iptables DOCKER-USER evita la exposición de puertos externos
4. **Endurecimiento de Systemd** -- NoNewPrivileges, PrivateTmp, usuario sin privilegios

Para verificar tu superficie de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Solo el puerto 22 (SSH) debería estar abierto. Todos los demás servicios (Gateway, Docker) están bloqueados.

Docker se instala para sandboxes de agentes (ejecución aislada de herramientas), no para ejecutar el Gateway en sí. Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la configuración de sandbox.

## Instalación manual

Si prefieres control manual sobre la automatización:

<Steps>
  <Step title="Instalar requisitos previos">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clonar el repositorio">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instalar colecciones de Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Ejecutar el playbook">
    ```bash
    ./run-playbook.sh
    ```

    Como alternativa, ejecútalo directamente y luego ejecuta manualmente el script de configuración:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Actualización

El instalador de Ansible configura OpenClaw para actualizaciones manuales. Consulta [Actualización](/es/install/updating) para el flujo de actualización estándar.

Para volver a ejecutar el playbook de Ansible (por ejemplo, para cambios de configuración):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Es idempotente y seguro ejecutarlo varias veces.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El firewall bloquea mi conexión">
    - Asegúrate primero de poder acceder mediante la VPN de Tailscale
    - El acceso SSH (puerto 22) siempre está permitido
    - El Gateway solo es accesible mediante Tailscale por diseño

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

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Falla el inicio de sesión del proveedor">
    Asegúrate de estar ejecutando como el usuario `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuración avanzada

Para ver la arquitectura de seguridad detallada y la solución de problemas, consulta el repositorio openclaw-ansible:

- [Arquitectura de seguridad](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalles técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guía de solución de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guía de implementación completa
- [Docker](/es/install/docker) -- configuración del Gateway en contenedores
- [Sandboxing](/es/gateway/sandboxing) -- configuración de sandbox de agentes
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- aislamiento por agente
