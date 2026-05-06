---
read_when:
    - Configuración de OpenClaw en Oracle Cloud
    - Buscando alojamiento VPS gratuito para OpenClaw
    - Quieres OpenClaw 24/7 en un servidor pequeño
summary: Aloja OpenClaw en el nivel Always Free ARM de Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T05:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en el nivel ARM **Always Free** de Oracle Cloud (hasta 4 OCPU, 24 GB de RAM, 200 GB de almacenamiento) sin costo.

## Prerrequisitos

- Cuenta de Oracle Cloud ([registro](https://www.oracle.com/cloud/free/)) -- consulta la [guía de registro de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si tienes problemas
- Cuenta de Tailscale (gratis en [tailscale.com](https://tailscale.com))
- Un par de claves SSH
- Aproximadamente 30 minutos

## Configuración

<Steps>
  <Step title="Crear una instancia de OCI">
    1. Inicia sesión en [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Ve a **Compute > Instances > Create Instance**.
    3. Configura:
       - **Nombre:** `openclaw`
       - **Imagen:** Ubuntu 24.04 (aarch64)
       - **Forma:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (o hasta 4)
       - **Memoria:** 12 GB (o hasta 24 GB)
       - **Volumen de arranque:** 50 GB (hasta 200 GB gratis)
       - **Clave SSH:** Agrega tu clave pública
    4. Haz clic en **Create** y anota la dirección IP pública.

    <Tip>
    Si la creación de la instancia falla con "Out of capacity", prueba con otro dominio de disponibilidad o vuelve a intentarlo más tarde. La capacidad del nivel gratuito es limitada.
    </Tip>

  </Step>

  <Step title="Conectar y actualizar el sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` es necesario para compilar en ARM algunas dependencias.

  </Step>

  <Step title="Configurar usuario y nombre de host">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Habilitar linger mantiene los servicios de usuario en ejecución después de cerrar sesión.

  </Step>

  <Step title="Instalar Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    A partir de ahora, conéctate mediante Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Instalar OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Cuando se te pregunte "How do you want to hatch your bot?", selecciona **Do this later**.

  </Step>

  <Step title="Configurar el Gateway">
    Usa autenticación por token con Tailscale Serve para un acceso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Aquí `gateway.trustedProxies=["127.0.0.1"]` es solo para la gestión de IP reenviada/cliente local del proxy local de Tailscale Serve. **No** es `gateway.auth.mode: "trusted-proxy"`. Las rutas del visor de diferencias mantienen un comportamiento de cierre seguro en esta configuración: las solicitudes sin procesar del visor a `127.0.0.1` sin encabezados de proxy reenviados pueden devolver `Diff not found`. Usa `mode=file` / `mode=both` para adjuntos, o habilita intencionalmente visores remotos y configura `plugins.entries.diffs.config.viewerBaseUrl` (o pasa un `baseUrl` de proxy) si necesitas enlaces de visor compartibles.

  </Step>

  <Step title="Bloquear la seguridad de la VCN">
    Bloquea todo el tráfico excepto Tailscale en el perímetro de red:

    1. Ve a **Networking > Virtual Cloud Networks** en la consola de OCI.
    2. Haz clic en tu VCN y luego en **Security Lists > Default Security List**.
    3. **Elimina** todas las reglas de entrada excepto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Conserva las reglas de salida predeterminadas (permitir todo el tráfico saliente).

    Esto bloquea SSH en el puerto 22, HTTP, HTTPS y todo lo demás en el perímetro de red. Desde este punto, solo puedes conectarte mediante Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accede a la interfaz de usuario de control desde cualquier dispositivo de tu tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Sustituye `<tailnet-name>` por el nombre de tu tailnet (visible en `tailscale status`).

  </Step>
</Steps>

## Verificar la postura de seguridad

Con la VCN bloqueada (solo UDP 41641 abierto) y el Gateway enlazado a loopback, el tráfico público se bloquea en el perímetro de red y el acceso de administración queda limitado a la tailnet. Esto elimina la necesidad de varios pasos tradicionales de endurecimiento de VPS:

| Paso tradicional              | ¿Necesario?     | Por qué                                                                    |
| ----------------------------- | --------------- | -------------------------------------------------------------------------- |
| Firewall UFW                  | No              | La VCN bloquea el tráfico antes de que llegue a la instancia.              |
| fail2ban                      | No              | El puerto 22 está bloqueado en la VCN; no hay superficie de fuerza bruta.  |
| Endurecimiento de sshd        | No              | Tailscale SSH no usa sshd.                                                 |
| Deshabilitar inicio de sesión root | No          | Tailscale autentica por identidad de tailnet, no por usuarios del sistema. |
| Autenticación SSH solo con clave | No            | Lo mismo: la identidad de tailnet reemplaza las claves SSH del sistema.    |
| Endurecimiento de IPv6        | Normalmente no  | Depende de la configuración de VCN/subred; verifica qué está asignado/expuesto realmente. |

Aún se recomienda:

- `chmod 700 ~/.openclaw` para restringir los permisos de los archivos de credenciales.
- `openclaw security audit` para una comprobación de postura específica de OpenClaw.
- `sudo apt update && sudo apt upgrade` periódicamente para parches del sistema operativo.
- Revisar periódicamente los dispositivos en la [consola de administración de Tailscale](https://login.tailscale.com/admin).

Comandos rápidos de verificación:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Notas sobre ARM

El nivel Always Free es ARM (`aarch64`). La mayoría de las funciones de OpenClaw funcionan correctamente; una pequeña cantidad de binarios nativos necesitan compilaciones para ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript puro, sin problemas.
- La mayoría de los paquetes npm con código nativo: artefactos precompilados `linux-arm64` disponibles.
- Ayudantes opcionales de CLI (por ejemplo, binarios Go/Rust enviados por Skills): comprueba que exista una versión `aarch64` / `linux-arm64` antes de instalar.

Verifica la arquitectura con `uname -m` (debería imprimir `aarch64`). Para binarios sin compilación ARM, instala desde el código fuente u omítelos.

## Persistencia y copias de seguridad

El estado de OpenClaw se encuentra en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/proveedor y datos de sesión.
- `~/.openclaw/workspace/` — el espacio de trabajo del agente (SOUL.md, memoria, artefactos).

Estos datos sobreviven a los reinicios. Para tomar una instantánea portable:

```bash
openclaw backup create
```

## Alternativa: túnel SSH

Si Tailscale Serve no funciona, usa un túnel SSH desde tu máquina local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Luego abre `http://localhost:18789`.

## Solución de problemas

**La creación de la instancia falla ("Out of capacity")** -- Las instancias ARM del nivel gratuito son populares. Prueba con otro dominio de disponibilidad o vuelve a intentarlo durante horas de menor demanda.

**Tailscale no se conecta** -- Ejecuta `sudo tailscale up --ssh --hostname=openclaw --reset` para volver a autenticar.

**El Gateway no arranca** -- Ejecuta `openclaw doctor --non-interactive` y revisa los registros con `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas con binarios ARM** -- La mayoría de los paquetes npm funcionan en ARM64. Para binarios nativos, busca versiones `linux-arm64` o `aarch64`. Verifica la arquitectura con `uname -m`.

## Próximos pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Relacionado

- [Resumen de instalación](/es/install)
- [GCP](/es/install/gcp)
- [Alojamiento VPS](/es/vps)
