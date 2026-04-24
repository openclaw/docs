---
read_when:
    - Buscando el estado de la app complementaria para Linux
    - Planificar cobertura de plataforma o contribuciones
    - Depurar finalizaciones por OOM en Linux o salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux + estado de la app complementaria
title: App Linux
x-i18n:
    generated_at: "2026-04-24T05:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway es totalmente compatible con Linux. **Node es el entorno de ejecución recomendado**.
Bun no se recomienda para Gateway (errores de WhatsApp/Telegram).

Las apps complementarias nativas para Linux están planificadas. Las contribuciones son bienvenidas si quieres ayudar a crear una.

## Ruta rápida para principiantes (VPS)

1. Instala Node 24 (recomendado; Node 22 LTS, actualmente `22.14+`, sigue funcionando por compatibilidad)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde tu portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abre `http://127.0.0.1:18789/` y autentícate con el secreto compartido configurado (token de forma predeterminada; contraseña si configuraste `gateway.auth.mode: "password"`)

Guía completa para servidor Linux: [Servidor Linux](/es/vps). Ejemplo paso a paso de VPS: [exe.dev](/es/install/exe-dev)

## Instalación

- [Getting Started](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Flujos opcionales: [Bun (experimental)](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Gateway

- [Guía operativa de Gateway](/es/gateway)
- [Configuración](/es/gateway/configuration)

## Instalación del servicio Gateway (CLI)

Usa una de estas opciones:

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

OpenClaw instala por defecto un servicio de usuario systemd. Usa un servicio de **sistema**
para servidores compartidos o siempre activos. `openclaw gateway install` y
`openclaw onboard --install-daemon` ya generan por ti la unidad canónica
actual; escribe una a mano solo cuando necesites una configuración personalizada de sistema/gestor de servicios.
La guía completa del servicio se encuentra en la [Guía operativa de Gateway](/es/gateway).

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

Habilítalo:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y finalizaciones por OOM

En Linux, el kernel elige una víctima OOM cuando un host, VM o cgroup de contenedor
se queda sin memoria. Gateway puede ser una mala víctima porque posee sesiones
de larga duración y conexiones de canales. Por ello, OpenClaw sesga los procesos hijo transitorios
para que se eliminen antes que Gateway cuando sea posible.

Para los lanzamientos de hijos Linux que cumplan los requisitos, OpenClaw inicia el hijo a través de un breve
envoltorio `/bin/sh` que eleva el `oom_score_adj` propio del hijo a `1000`, y luego
hace `exec` del comando real. Esta es una operación sin privilegios porque el hijo
solo está aumentando su propia probabilidad de ser eliminado por OOM.

Las superficies de procesos hijo cubiertas incluyen:

- hijos de comandos gestionados por supervisor,
- hijos de shell PTY,
- hijos de servidores MCP stdio,
- procesos de navegador/Chrome iniciados por OpenClaw.

El envoltorio es solo para Linux y se omite cuando `/bin/sh` no está disponible. También
se omite si el entorno del hijo establece `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` u `off`.

Para verificar un proceso hijo:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los hijos cubiertos es `1000`. El proceso Gateway debe conservar
su puntuación normal, normalmente `0`.

Esto no sustituye el ajuste normal de memoria. Si un VPS o contenedor elimina repetidamente procesos hijo,
aumenta el límite de memoria, reduce la concurrencia o añade controles de recursos más estrictos
como `MemoryMax=` de systemd o límites de memoria a nivel de contenedor.

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
