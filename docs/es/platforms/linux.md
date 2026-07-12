---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Planificación de la compatibilidad con plataformas o de las contribuciones
    - Depuración de cierres por OOM de Linux o del código de salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux y estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-07-11T23:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

El Gateway es totalmente compatible con Linux. Node es el entorno de ejecución recomendado; Bun
no se recomienda (debido a problemas conocidos con WhatsApp/Telegram).

Todavía no existe una aplicación complementaria nativa para Linux. Las contribuciones son bienvenidas.

## Ruta rápida (VPS)

1. Instala Node 24 (recomendado) o Node 22.19+ (LTS, aún compatible).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde tu portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abre `http://127.0.0.1:18789/` y autentícate con el secreto compartido
   configurado (token de forma predeterminada; contraseña si `gateway.auth.mode` es `"password"`).

Guía completa del servidor: [Servidor Linux](/es/vps). Ejemplo de VPS paso a paso:
[exe.dev](/es/install/exe-dev).

## Instalación

- [Primeros pasos](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Opcional: [Bun (experimental)](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Servicio del Gateway (systemd)

Instálalo con una de estas opciones:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # selecciona "Servicio del Gateway" cuando se solicite
```

Repara o migra una instalación existente:

```bash
openclaw doctor
```

`openclaw gateway install` genera de forma predeterminada una unidad de **usuario** de systemd. La guía
completa del servicio, incluida la variante de unidad de nivel **sistema** para hosts compartidos o
siempre activos, se encuentra en el [manual operativo del Gateway](/es/gateway#supervision-and-service-lifecycle).

Escribe una unidad manualmente solo para una configuración personalizada. Ejemplo mínimo de unidad de usuario
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Habilítala:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y finalizaciones por OOM

En Linux, el kernel selecciona una víctima de OOM cuando un host, una máquina virtual o el cgroup de un contenedor
se queda sin memoria. El Gateway no es una víctima adecuada porque gestiona sesiones
y conexiones de canales de larga duración, por lo que OpenClaw favorece que los procesos secundarios
transitorios se finalicen primero cuando sea posible.

Para los procesos secundarios de Linux que cumplen los requisitos, OpenClaw envuelve el comando en un breve
adaptador de `/bin/sh` que eleva el valor `oom_score_adj` del propio proceso secundario a `1000` y, después,
ejecuta el comando real mediante `exec`. Esto no requiere privilegios: un proceso siempre puede elevar
su propia puntuación OOM.

Superficies de procesos secundarios cubiertas:

- Procesos secundarios de comandos gestionados por el supervisor
- Procesos secundarios de shell PTY
- Procesos secundarios de servidores stdio de MCP
- Procesos de navegador/Chrome iniciados por OpenClaw (mediante el entorno de ejecución de procesos del SDK del plugin)

El adaptador es exclusivo de Linux y se omite cuando `/bin/sh` no está disponible o cuando
el entorno del proceso secundario establece `OPENCLAW_CHILD_OOM_SCORE_ADJ` en `0`, `false`, `no` u
`off`.

Verifica un proceso secundario:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los procesos secundarios cubiertos es `1000`; el propio proceso del Gateway
mantiene su puntuación normal (generalmente `0`).

El valor `OOMPolicy=continue` de la unidad de systemd mantiene activo el servicio del Gateway cuando
el eliminador de OOM selecciona un proceso secundario transitorio, en lugar de marcar toda
la unidad como fallida y reiniciar todos los canales; el proceso secundario o la sesión que ha fallado informa de
su propio error.

Esto no sustituye el ajuste normal de la memoria. Si un VPS o contenedor finaliza procesos secundarios repetidamente,
aumenta el límite de memoria, reduce la concurrencia o añade controles de recursos más estrictos
(`MemoryMax=` de systemd, límites de memoria del contenedor).

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
- [Manual operativo del Gateway](/es/gateway)
- [Configuración del Gateway](/es/gateway/configuration)
