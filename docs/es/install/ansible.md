---
read_when:
    - Se busca una implementación automatizada del servidor con refuerzo de la seguridad
    - Necesita una configuración aislada mediante firewall con acceso por VPN
    - Vas a implementar en servidores Debian/Ubuntu remotos
summary: Instalación automatizada y reforzada de OpenClaw con Ansible, VPN de Tailscale y aislamiento mediante firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-14T13:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Implementa OpenClaw en servidores de producción con **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un instalador automatizado con una arquitectura centrada en la seguridad.

<Info>
El repositorio [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) es la fuente oficial para la implementación con Ansible. Esta página ofrece una descripción general rápida.
</Info>

## Requisitos previos

| Requisito | Detalles                                                  |
| ----------- | --------------------------------------------------------- |
| SO          | Debian 11+ o Ubuntu 20.04+                                |
| Acceso      | Privilegios de root o sudo                                |
| Red         | Conexión a Internet para instalar paquetes                |
| Ansible     | 2.14+ (el script de inicio rápido lo instala automáticamente) |

## Qué se obtiene

- Seguridad centrada en el cortafuegos: aislamiento mediante UFW + Docker (solo se puede acceder a SSH + Tailscale)
- VPN de Tailscale para el acceso remoto sin exponer públicamente los servicios
- Docker para contenedores aislados de entorno seguro con enlaces exclusivos a localhost
- Integración con systemd con refuerzo de seguridad e inicio automático al arrancar
- Configuración con un solo comando

## Inicio rápido

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Qué se instala

1. Tailscale (VPN de malla para un acceso remoto seguro)
2. Cortafuegos UFW (solo puertos de SSH + Tailscale)
3. Docker CE + Compose V2 (backend predeterminado del entorno seguro del agente)
4. Node.js y pnpm (OpenClaw requiere Node 22.22.3+, 24.15+ o 25.9+; se recomienda Node 24)
5. OpenClaw, instalado directamente en el host, sin contenedores
6. Un servicio de systemd con refuerzo de seguridad

<Note>
El Gateway se ejecuta directamente en el host, no en Docker. El aislamiento de agentes es
opcional; este playbook instala Docker porque es el backend predeterminado del entorno
seguro. Consulte [Aislamiento](/es/gateway/sandboxing) para conocer otros backends.
</Note>

## Configuración posterior a la instalación

<Steps>
  <Step title="Cambiar al usuario openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Ejecutar el asistente de incorporación">
    El script posterior a la instalación guía el proceso de configuración de OpenClaw.
  </Step>
  <Step title="Conectar canales de mensajería">
    Inicie sesión en WhatsApp, Telegram, Discord o Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verificar la instalación">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conectarse a Tailscale">
    Únase a la malla de la VPN para obtener acceso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Comprobar el estado del servicio
sudo systemctl status openclaw

# Ver los registros en tiempo real
sudo journalctl -u openclaw -f

# Reiniciar el Gateway
sudo systemctl restart openclaw

# Iniciar sesión en un canal (ejecutar como usuario openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Arquitectura de seguridad

Modelo de defensa de cuatro capas:

1. Cortafuegos (UFW): solo SSH (22) y Tailscale (41641/udp) se exponen públicamente
2. VPN (Tailscale): solo se puede acceder al Gateway mediante la malla de la VPN
3. Aislamiento mediante Docker: la cadena de iptables `DOCKER-USER` impide la exposición externa de puertos
4. Refuerzo de systemd: `NoNewPrivileges`, `PrivateTmp`, usuario sin privilegios

Verifique la superficie de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Solo debería estar abierto el puerto 22 (SSH). El Gateway y Docker permanecen protegidos.

Docker se instala para los entornos seguros de los agentes (ejecución aislada de herramientas), no para ejecutar el Gateway. Consulte [Entorno seguro y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para configurar el entorno seguro.

## Instalación manual

<Steps>
  <Step title="Instalar los requisitos previos">
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
  <Step title="Instalar las colecciones de Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Ejecutar el playbook">
    ```bash
    ./run-playbook.sh
    ```

    También puede ejecutar directamente el playbook y después ejecutar manualmente el script de configuración:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Después, ejecutar: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Actualización

El instalador de Ansible configura OpenClaw para las actualizaciones manuales; consulte [Actualización](/es/install/updating) para conocer el procedimiento estándar.

Para volver a ejecutar el playbook (por ejemplo, después de cambiar la configuración):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Es idempotente y se puede ejecutar varias veces de forma segura.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El cortafuegos bloquea la conexión">
    - Conéctese primero mediante la VPN de Tailscale; por diseño, solo se puede acceder al Gateway de esta manera.
    - SSH (puerto 22) siempre está permitido.

  </Accordion>
  <Accordion title="El servicio no se inicia">
    ```bash
    # Comprobar los registros
    sudo journalctl -u openclaw -n 100

    # Verificar los permisos
    sudo ls -la /opt/openclaw

    # Probar el inicio manual
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemas con el entorno seguro de Docker">
    ```bash
    # Verificar que Docker esté en ejecución
    sudo systemctl status docker

    # Comprobar la imagen del entorno seguro
    sudo docker images | grep openclaw-sandbox

    # Crear la imagen del entorno seguro si falta (requiere una copia del código fuente)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Para instalaciones mediante npm sin una copia del código fuente, consulte
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Falla el inicio de sesión en el canal">
    Asegúrese de ejecutar el comando como usuario `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configuración avanzada

Para obtener información detallada sobre la arquitectura de seguridad y la solución de problemas, consulte el repositorio openclaw-ansible:

- [Arquitectura de seguridad](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalles técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guía de solución de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Contenido relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): guía completa de implementación
- [Docker](/es/install/docker): configuración del Gateway en contenedores
- [Aislamiento](/es/gateway/sandboxing): configuración del entorno seguro del agente
- [Entorno seguro y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools): aislamiento por agente
