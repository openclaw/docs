---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Planificación de la cobertura de plataformas o contribuciones
    - Depurar terminaciones por OOM de Linux o salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux + estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-06-27T12:01:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

The Gateway es totalmente compatible con Linux. **Node es el runtime recomendado**.
Bun no se recomienda para el Gateway (errores de WhatsApp/Telegram).

Las aplicaciones complementarias nativas para Linux están planificadas. Las contribuciones son bienvenidas si quieres ayudar a crear una.

## Ruta rápida para principiantes (VPS)

1. Instala Node 24 (recomendado; Node 22 LTS, actualmente `22.19+`, sigue funcionando por compatibilidad)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde tu portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abre `http://127.0.0.1:18789/` y autentícate con el secreto compartido configurado (token por defecto; contraseña si configuras `gateway.auth.mode: "password"`)

Guía completa para servidores Linux: [Servidor Linux](/es/vps). Ejemplo de VPS paso a paso: [exe.dev](/es/install/exe-dev)

## Instalación

- [Primeros pasos](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Flujos opcionales: [Bun (experimental)](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Gateway

- [Manual operativo del Gateway](/es/gateway)
- [Configuración](/es/gateway/configuration)

## Instalación del servicio Gateway (CLI)

Usa uno de estos:

```
openclaw onboard --install-daemon
```

O:

```
openclaw gateway install
```

O:

```
openclaw configure
```

Selecciona **Servicio Gateway** cuando se te solicite.

Reparar/migrar:

```
openclaw doctor
```

## Control del sistema (unidad de usuario systemd)

OpenClaw instala un servicio systemd de **usuario** por defecto. Usa un servicio de **sistema**
para servidores compartidos o siempre activos. `openclaw gateway install` y
`openclaw onboard --install-daemon` ya generan la unidad canónica actual
por ti; escribe una manualmente solo cuando necesites una configuración personalizada
de sistema/gestor de servicios. La guía completa del servicio está en el [manual operativo del Gateway](/es/gateway).

Configuración mínima:

Crea `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Actívalo:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y terminaciones por OOM

En Linux, el kernel elige una víctima OOM cuando un cgroup de host, VM o contenedor
se queda sin memoria. El Gateway puede ser una mala víctima porque posee sesiones
de larga duración y conexiones de canales. Por eso OpenClaw prioriza que los procesos
hijo transitorios se terminen antes que el Gateway cuando sea posible.

Para los procesos hijo de Linux elegibles, OpenClaw inicia el hijo mediante un breve
envoltorio `/bin/sh` que eleva el `oom_score_adj` propio del hijo a `1000`, y luego
ejecuta con `exec` el comando real. Esta es una operación sin privilegios porque el hijo
solo aumenta su propia probabilidad de terminación por OOM.

Las superficies de procesos hijo cubiertas incluyen:

- hijos de comandos gestionados por supervisor,
- hijos de shell PTY,
- hijos de servidor MCP stdio,
- procesos de navegador/Chrome lanzados por OpenClaw.

El envoltorio es solo para Linux y se omite cuando `/bin/sh` no está disponible. También
se omite si el entorno del hijo define `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` u `off`.

Para verificar un proceso hijo:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los hijos cubiertos es `1000`. El proceso Gateway debería mantener
su puntuación normal, normalmente `0`.

La unidad systemd recomendada también define `OOMPolicy=continue`. Esto mantiene viva la
unidad del Gateway cuando el asesino OOM selecciona un proceso hijo transitorio;
el comando/sesión hijo puede fallar y reportar su error sin que systemd marque
todo el servicio gateway como fallido ni reinicie todos los canales.

Esto no reemplaza el ajuste normal de memoria. Si un VPS o contenedor termina hijos
repetidamente, aumenta el límite de memoria, reduce la concurrencia o añade controles
de recursos más estrictos, como `MemoryMax=` de systemd o límites de memoria a nivel de contenedor.

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
