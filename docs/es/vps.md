---
read_when:
    - Quieres ejecutar el Gateway en un servidor Linux o un VPS en la nube
    - Necesitas un mapa rápido de las guías de alojamiento
    - Quieres un ajuste genérico de servidores Linux para OpenClaw
sidebarTitle: Linux Server
summary: 'Ejecuta OpenClaw en un servidor Linux o VPS en la nube: selección de proveedor, arquitectura y ajustes'
title: Servidor Linux
x-i18n:
    generated_at: "2026-07-11T23:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en cualquier servidor Linux o VPS en la nube. Esta página te ayuda a
elegir un proveedor, explica cómo funcionan los despliegues en la nube y aborda ajustes
genéricos de Linux aplicables en cualquier entorno.

## Elige un proveedor

<CardGroup cols={2}>
  <Card title="Azure" href="/es/install/azure">Máquina virtual Linux</Card>
  <Card title="DigitalOcean" href="/es/install/digitalocean">VPS de pago sencillo</Card>
  <Card title="exe.dev" href="/es/install/exe-dev">Máquina virtual con proxy HTTPS</Card>
  <Card title="Fly.io" href="/es/install/fly">Máquinas de Fly</Card>
  <Card title="GCP" href="/es/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/es/install/hetzner">Docker en un VPS de Hetzner</Card>
  <Card title="Hostinger" href="/es/install/hostinger">VPS con configuración en un clic</Card>
  <Card title="Northflank" href="/es/install/northflank">Configuración en un clic desde el navegador</Card>
  <Card title="Oracle Cloud" href="/es/install/oracle">Nivel ARM siempre gratuito</Card>
  <Card title="Railway" href="/es/install/railway">Configuración en un clic desde el navegador</Card>
  <Card title="Raspberry Pi" href="/es/install/raspberry-pi">Alojamiento propio en ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / nivel gratuito)** también funciona bien.
Hay disponible un videotutorial de la comunidad en
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso de la comunidad; puede dejar de estar disponible).

## Cómo funcionan las configuraciones en la nube

- El **Gateway se ejecuta en el VPS** y administra el estado y el espacio de trabajo.
- Te conectas desde tu portátil o teléfono mediante la **interfaz de control** o **Tailscale/SSH**.
- Considera el VPS como la fuente de verdad y realiza **copias de seguridad** periódicas del estado y el espacio de trabajo.
- Configuración predeterminada segura: mantén el Gateway en local loopback y accede mediante un túnel SSH o Tailscale Serve.
  Si lo vinculas a `lan` o `tailnet`, el Gateway requiere un secreto compartido
  (`gateway.auth.token` o `gateway.auth.password`), salvo que la autenticación se delegue a un
  proxy de confianza.

Páginas relacionadas: [Acceso remoto al Gateway](/es/gateway/remote), [Centro de plataformas](/es/platforms).

## Protege primero el acceso administrativo

Antes de instalar OpenClaw en un VPS público, decide cómo quieres administrar
el propio servidor.

- Para el acceso administrativo exclusivo mediante Tailnet: instala primero Tailscale, conecta el VPS a tu
  tailnet, comprueba una segunda sesión SSH mediante la IP de Tailscale o el nombre de MagicDNS
  y, después, restringe el acceso SSH público.
- Sin Tailscale: aplica medidas de protección equivalentes a tu vía de acceso SSH antes de
  exponer más servicios.
- Esto es independiente del acceso al Gateway. Puedes mantener OpenClaw vinculado a
  local loopback y usar un túnel SSH o Tailscale Serve para el panel.

Las opciones del Gateway específicas de Tailscale se encuentran en [Tailscale](/es/gateway/tailscale).

## Agente empresarial compartido en un VPS

Ejecutar un único agente para un equipo es una configuración válida cuando todos los usuarios
pertenecen al mismo límite de confianza y el agente se utiliza exclusivamente para fines empresariales.

- Mantenlo en un entorno de ejecución dedicado (VPS/máquina virtual/contenedor y usuario/cuentas del sistema operativo específicos).
- No inicies sesión en ese entorno con cuentas personales de Apple o Google ni con perfiles personales del navegador o del gestor de contraseñas.
- Si los usuarios pueden actuar de forma hostil entre sí, sepáralos por Gateway, host o usuario del sistema operativo.

Detalles del modelo de seguridad: [Seguridad](/es/gateway/security).

## Uso de nodos con un VPS

Puedes mantener el Gateway en la nube y emparejar **nodos** en tus dispositivos locales
(Mac/iOS/Android/sin interfaz gráfica). Los nodos proporcionan capacidades locales de pantalla, cámara, lienzo y `system.run`,
mientras el Gateway permanece en la nube.

Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

## Ajuste del inicio para máquinas virtuales pequeñas y hosts ARM

Si los comandos de la CLI parecen lentos en máquinas virtuales de baja potencia (o hosts ARM), habilita la caché de compilación de módulos de Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mejora los tiempos de inicio al ejecutar comandos repetidamente; la primera ejecución prepara la caché.
- `OPENCLAW_NO_RESPAWN=1` mantiene los reinicios habituales del Gateway dentro del mismo proceso, lo que evita transferencias adicionales entre procesos y simplifica el seguimiento del PID en hosts pequeños.
- Para obtener información específica sobre Raspberry Pi, consulta [Raspberry Pi](/es/install/raspberry-pi).

### Lista de comprobación para ajustar systemd (opcional)

Para hosts de máquinas virtuales que utilicen `systemd`, considera lo siguiente:

- Variables de entorno del servicio para disponer de una ruta de inicio estable: `OPENCLAW_NO_RESPAWN=1` y
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Comportamiento de reinicio explícito: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Discos SSD para las rutas de estado y caché, a fin de reducir las penalizaciones de arranque en frío causadas por operaciones de E/S aleatorias.

La ruta estándar `openclaw onboard --install-daemon` instala una unidad de usuario de
systemd; edítala con:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Si instalaste deliberadamente una unidad del sistema, edítala mediante
`sudo systemctl edit openclaw-gateway.service`.

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd puede automatizar la recuperación de servicios](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para obtener información sobre el comportamiento de OOM en Linux, la selección del proceso secundario que se finalizará y el diagnóstico de `exit 137`,
consulta [Presión de memoria y finalizaciones por OOM en Linux](/es/platforms/linux#memory-pressure-and-oom-kills).

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [DigitalOcean](/es/install/digitalocean)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
