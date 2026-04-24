---
read_when:
    - Configurando OpenClaw en Oracle Cloud
    - Buscando alojamiento VPS gratuito para OpenClaw
    - Quieres OpenClaw 24/7 en un servidor pequeño
summary: Aloja OpenClaw en el nivel ARM Always Free de Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T05:35:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Ejecuta un Gateway persistente de OpenClaw en el nivel ARM **Always Free** de Oracle Cloud (hasta 4 OCPU, 24 GB de RAM y 200 GB de almacenamiento) sin costo.

## Requisitos previos

- Cuenta de Oracle Cloud ([registro](https://www.oracle.com/cloud/free/)) -- consulta la [guía comunitaria de registro](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si tienes problemas
- Cuenta de Tailscale (gratuita en [tailscale.com](https://tailscale.com))
- Un par de claves SSH
- Aproximadamente 30 minutos

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
       - **Boot volume:** 50 GB (hasta 200 GB gratis)
       - **SSH key:** añade tu clave pública
    4. Haz clic en **Create** y anota la dirección IP pública.

    <Tip>
    Si la creación de la instancia falla con "Out of capacity", prueba con un dominio de disponibilidad diferente o vuelve a intentarlo más tarde. La capacidad del nivel gratuito es limitada.
    </Tip>

  </Step>

  <Step title="Conectarse y actualizar el sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` es necesario para la compilación en ARM de algunas dependencias.

  </Step>

  <Step title="Configurar usuario y nombre de host">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Habilitar linger mantiene los servicios del usuario en ejecución después de cerrar sesión.

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

  <Step title="Configurar el gateway">
    Usa autenticación por token con Tailscale Serve para un acceso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` aquí es solo para la gestión de IP reenviada/cliente local del proxy local de Tailscale Serve. **No** es `gateway.auth.mode: "trusted-proxy"`. Las rutas del visor de diferencias mantienen comportamiento fail-closed en esta configuración: las solicitudes sin procesar del visor a `127.0.0.1` sin encabezados proxy reenviados pueden devolver `Diff not found`. Usa `mode=file` / `mode=both` para archivos adjuntos, o habilita intencionadamente visores remotos y establece `plugins.entries.diffs.config.viewerBaseUrl` (o pasa un proxy `baseUrl`) si necesitas enlaces compartibles del visor.

  </Step>

  <Step title="Bloquear la seguridad de la VCN">
    Bloquea todo el tráfico excepto Tailscale en el borde de la red:

    1. Ve a **Networking > Virtual Cloud Networks** en OCI Console.
    2. Haz clic en tu VCN y luego en **Security Lists > Default Security List**.
    3. **Elimina** todas las reglas de ingreso excepto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantén las reglas predeterminadas de salida (permitir todo el tráfico saliente).

    Esto bloquea SSH en el puerto 22, HTTP, HTTPS y todo lo demás en el borde de la red. A partir de este momento, solo podrás conectarte mediante Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accede a Control UI desde cualquier dispositivo de tu tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Sustituye `<tailnet-name>` por el nombre de tu tailnet (visible en `tailscale status`).

  </Step>
</Steps>

## Alternativa: túnel SSH

Si Tailscale Serve no funciona, usa un túnel SSH desde tu máquina local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Luego abre `http://localhost:18789`.

## Solución de problemas

**La creación de la instancia falla ("Out of capacity")** -- Las instancias ARM del nivel gratuito son populares. Prueba con un dominio de disponibilidad diferente o vuelve a intentarlo en horas de menor demanda.

**Tailscale no se conecta** -- Ejecuta `sudo tailscale up --ssh --hostname=openclaw --reset` para volver a autenticarte.

**El Gateway no se inicia** -- Ejecuta `openclaw doctor --non-interactive` y revisa los registros con `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas con binarios ARM** -- La mayoría de los paquetes npm funcionan en ARM64. Para binarios nativos, busca versiones `linux-arm64` o `aarch64`. Verifica la arquitectura con `uname -m`.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración de Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Relacionado

- [Resumen de instalación](/es/install)
- [GCP](/es/install/gcp)
- [Alojamiento VPS](/es/vps)
