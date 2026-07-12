---
read_when:
    - Configuración de OpenClaw en Oracle Cloud
    - Buscando alojamiento VPS gratuito para OpenClaw
    - Quieres OpenClaw disponible 24/7 en un servidor pequeño
summary: Aloja OpenClaw en el nivel ARM Always Free de Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-11T23:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en el nivel ARM **Always Free** de Oracle Cloud (hasta 4 OCPU, 24 GB de RAM y 200 GB de almacenamiento) sin costo.

## Requisitos previos

- Cuenta de Oracle Cloud ([registro](https://www.oracle.com/cloud/free/)); consulta la [guía de registro de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si tienes problemas
- Cuenta de Tailscale (gratuita en [tailscale.com](https://tailscale.com))
- Un par de claves SSH
- Unos 30 minutos

## Configuración

<Steps>
  <Step title="Crear una instancia de OCI">
    1. Inicia sesión en [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Ve a **Compute > Instances > Create Instance**.
    3. Configura:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (o hasta 4)
       - **Memory:** 12 GB (o hasta 24 GB)
       - **Boot volume:** 50 GB (hasta 200 GB gratuitos)
       - **SSH key:** Añade tu clave pública
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

    `build-essential` es necesario para compilar algunas dependencias en ARM.

  </Step>

  <Step title="Configurar el usuario y el nombre de host">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Activar la permanencia mantiene los servicios del usuario en ejecución después de cerrar sesión.

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

    Cuando aparezca "¿Cómo quieres iniciar tu bot?", selecciona **Hacerlo más tarde**.

  </Step>

  <Step title="Configurar el Gateway">
    Usa autenticación mediante token con Tailscale Serve para obtener acceso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Aquí, `gateway.trustedProxies=["127.0.0.1"]` solo se usa para la gestión de IP reenviada y cliente local del proxy local de Tailscale Serve. **No** equivale a `gateway.auth.mode: "trusted-proxy"`. En esta configuración, las rutas del visor de diferencias mantienen un comportamiento de denegación segura: las solicitudes directas del visor desde `127.0.0.1` sin encabezados reenviados por el proxy devuelven `Diff not found`. Usa `mode=file` / `mode=both` para los archivos adjuntos, o habilita intencionadamente los visores remotos y establece `plugins.entries.diffs.config.viewerBaseUrl` (o pasa un `baseUrl` de proxy) si necesitas enlaces compartibles al visor.

  </Step>

  <Step title="Restringir la seguridad de la VCN">
    Bloquea en el perímetro de la red todo el tráfico excepto el de Tailscale:

    1. Ve a **Networking > Virtual Cloud Networks** en OCI Console.
    2. Haz clic en tu VCN y, después, en **Security Lists > Default Security List**.
    3. **Elimina** todas las reglas de entrada excepto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Conserva las reglas de salida predeterminadas (permitir todo el tráfico saliente).

    Esto bloquea SSH en el puerto 22, HTTP, HTTPS y todo lo demás en el perímetro de la red. A partir de este momento, solo puedes conectarte mediante Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accede a la interfaz de control desde cualquier dispositivo de tu tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Sustituye `<tailnet-name>` por el nombre de tu tailnet (visible en `tailscale status`).

  </Step>
</Steps>

## Verificar la postura de seguridad

Con la VCN restringida (solo está abierto UDP 41641) y el Gateway vinculado a la interfaz local, el tráfico público queda bloqueado en el perímetro de la red y el acceso administrativo se limita a la tailnet. Esto elimina la necesidad de aplicar varias medidas tradicionales de protección de un VPS:

| Medida tradicional                  | ¿Es necesaria?       | Motivo                                                                                  |
| ----------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| Cortafuegos UFW                     | No                   | La VCN bloquea el tráfico antes de que llegue a la instancia.                           |
| fail2ban                            | No                   | El puerto 22 está bloqueado en la VCN; no existe una superficie para ataques de fuerza bruta. |
| Protección adicional de sshd        | No                   | SSH de Tailscale no utiliza sshd.                                                       |
| Deshabilitar el inicio de sesión de root | No              | Tailscale autentica mediante la identidad de la tailnet, no mediante usuarios del sistema. |
| Autenticación solo con claves SSH   | No                   | Lo mismo: la identidad de la tailnet sustituye las claves SSH del sistema.              |
| Protección adicional de IPv6       | Normalmente no       | Depende de la configuración de la VCN y la subred; verifica qué se ha asignado o expuesto realmente. |

Aun así, se recomienda:

- `chmod 700 ~/.openclaw` para restringir los permisos de los archivos de credenciales.
- `openclaw security audit` para realizar una comprobación de la postura de seguridad específica de OpenClaw.
- Ejecutar periódicamente `sudo apt update && sudo apt upgrade` para aplicar parches del sistema operativo.
- Revisar periódicamente los dispositivos en la [consola de administración de Tailscale](https://login.tailscale.com/admin).

Comandos de verificación rápida:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Notas sobre ARM

El nivel Always Free utiliza ARM (`aarch64`). La mayoría de las funciones de OpenClaw funcionan correctamente; una pequeña cantidad de binarios nativos requiere compilaciones para ARM:

- Node.js, Telegram y WhatsApp (Baileys): JavaScript puro, sin problemas.
- La mayoría de los paquetes npm con código nativo: disponen de artefactos `linux-arm64` precompilados.
- Herramientas auxiliares opcionales de la CLI (por ejemplo, binarios de Go/Rust distribuidos mediante Skills): comprueba que exista una versión para `aarch64` / `linux-arm64` antes de instalarlas.

Verifica la arquitectura con `uname -m` (debería mostrar `aarch64`). Para los binarios que no tengan una compilación para ARM, instala desde el código fuente u omítelos.

## Persistencia y copias de seguridad

El estado de OpenClaw se almacena en:

- `~/.openclaw/`: `openclaw.json`, archivos `auth-profiles.json` por agente, estado de canales y proveedores, y datos de sesiones.
- `~/.openclaw/workspace/`: el espacio de trabajo del agente (SOUL.md, memoria y artefactos).

Estos datos se conservan tras reiniciar. Para crear una instantánea portátil:

```bash
openclaw backup create
```

## Alternativa: túnel SSH

Si Tailscale Serve no funciona, utiliza un túnel SSH desde tu equipo local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Después, abre `http://localhost:18789`.

## Solución de problemas

**La creación de la instancia falla ("Out of capacity")**: las instancias ARM del nivel gratuito son populares. Prueba con otro dominio de disponibilidad o vuelve a intentarlo durante las horas de menor demanda.

**Tailscale no se conecta**: ejecuta `sudo tailscale up --ssh --hostname=openclaw --reset` para volver a autenticarte.

**El Gateway no se inicia**: ejecuta `openclaw doctor --non-interactive` y consulta los registros con `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas con binarios ARM**: la mayoría de los paquetes npm funcionan en ARM64. Para los binarios nativos, busca versiones `linux-arm64` o `aarch64`. Verifica la arquitectura con `uname -m`.

## Siguientes pasos

- [Canales](/es/channels): conecta Telegram, WhatsApp, Discord y otros servicios
- [Configuración del Gateway](/es/gateway/configuration): todas las opciones de configuración
- [Actualización](/es/install/updating): mantén OpenClaw actualizado

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [GCP](/es/install/gcp)
- [Alojamiento en VPS](/es/vps)
