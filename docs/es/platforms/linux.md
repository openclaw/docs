---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Planificación de la cobertura de plataformas o de contribuciones
    - Depurar terminaciones por OOM de Linux o código de salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux + estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-05-07T13:20:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway es totalmente compatible con Linux. **Node es el entorno de ejecución recomendado**.
Bun no se recomienda para Gateway (errores de WhatsApp/Telegram).

Hay aplicaciones complementarias nativas para Linux planificadas. Las contribuciones son bienvenidas si quieres ayudar a crear una.

## Ruta rápida para principiantes (VPS)

1. Instala Node 24 (recomendado; Node 22 LTS, actualmente `22.16+`, sigue funcionando por compatibilidad)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde tu portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abre `http://127.0.0.1:18789/` y autentícate con el secreto compartido configurado (token de forma predeterminada; contraseña si configuras `gateway.auth.mode: "password"`)

Guía completa del servidor Linux: [Servidor Linux](/es/vps). Ejemplo de VPS paso a paso: [exe.dev](/es/install/exe-dev)

## Instalación

- [Primeros pasos](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Flujos opcionales: [Bun (experimental)](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Gateway

- [Runbook de Gateway](/es/gateway)
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

OpenClaw instala un servicio systemd de **usuario** de forma predeterminada. Usa un servicio de **sistema** para servidores compartidos o siempre activos. `openclaw gateway install` y
`openclaw onboard --install-daemon` ya generan la unidad canónica actual
para ti; escribe una manualmente solo cuando necesites una configuración personalizada de sistema/gestor de servicios. La guía completa del servicio está en el [runbook de Gateway](/es/gateway).

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Actívalo:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y finalizaciones por OOM

En Linux, el kernel elige una víctima OOM cuando un cgroup de host, VM o contenedor
se queda sin memoria. Gateway puede ser una mala víctima porque posee
sesiones y conexiones de canales de larga duración. Por ello, OpenClaw sesga los procesos secundarios transitorios
para que sean finalizados antes que Gateway cuando sea posible.

Para los procesos secundarios de Linux aptos, OpenClaw inicia el proceso secundario mediante un breve
envoltorio `/bin/sh` que eleva el `oom_score_adj` propio del proceso secundario a `1000`, y luego
hace `exec` del comando real. Esta es una operación sin privilegios porque el proceso secundario
solo aumenta su propia probabilidad de finalización por OOM.

Las superficies de procesos secundarios cubiertas incluyen:

- procesos secundarios de comandos gestionados por el supervisor,
- procesos secundarios de shell PTY,
- procesos secundarios de servidor MCP stdio,
- procesos de navegador/Chrome iniciados por OpenClaw.

El envoltorio es solo para Linux y se omite cuando `/bin/sh` no está disponible. También se omite si el entorno del proceso secundario establece `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` u `off`.

Para verificar un proceso secundario:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los procesos secundarios cubiertos es `1000`. El proceso Gateway debe conservar
su puntuación normal, normalmente `0`.

Esto no sustituye el ajuste normal de memoria. Si un VPS o contenedor finaliza repetidamente
procesos secundarios, aumenta el límite de memoria, reduce la concurrencia o añade controles de recursos
más estrictos, como `MemoryMax=` de systemd o límites de memoria a nivel de contenedor.

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
