---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Planificación de la cobertura de plataformas o contribuciones
    - Depurar terminaciones por OOM de Linux o salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux + estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-07-05T11:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

El Gateway es totalmente compatible con Linux. Node es el runtime recomendado; Bun
no se recomienda (problemas conocidos con WhatsApp/Telegram).

Todavía no hay una app complementaria nativa para Linux. Se aceptan contribuciones.

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

## Servicio de Gateway (systemd)

Instálalo con uno de estos comandos:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

Repara o migra una instalación existente:

```bash
openclaw doctor
```

`openclaw gateway install` genera una unidad de **usuario** de systemd de forma predeterminada. La guía
completa del servicio, incluida la variante de unidad de nivel **sistema** para hosts compartidos o
siempre activos, está en el [runbook de Gateway](/es/gateway#supervision-and-service-lifecycle).

Escribe una unidad a mano solo para una configuración personalizada. Ejemplo mínimo de unidad de usuario
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

Actívala:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y terminaciones por OOM

En Linux, el kernel elige una víctima de OOM cuando un host, una VM o un cgroup de contenedor
se queda sin memoria. El Gateway es una mala víctima porque posee sesiones
persistentes y conexiones de canales, por lo que OpenClaw sesga los procesos
hijos transitorios para que se terminen primero cuando sea posible.

Para los procesos hijos aptos en Linux, OpenClaw envuelve el comando en un breve
shim de `/bin/sh` que eleva el `oom_score_adj` propio del hijo a `1000`, y luego
hace `exec` del comando real. Esto no requiere privilegios: un proceso siempre puede elevar
su propia puntuación de OOM.

Superficies de procesos hijos cubiertas:

- Hijos de comandos gestionados por el supervisor
- Hijos de shell PTY
- Hijos de servidores MCP stdio
- Procesos de navegador/Chrome iniciados por OpenClaw (mediante el runtime de procesos del plugin SDK)

El wrapper es solo para Linux y se omite cuando `/bin/sh` no está disponible, o cuando
el entorno del hijo establece `OPENCLAW_CHILD_OOM_SCORE_ADJ` en `0`, `false`, `no` u
`off`.

Verifica un proceso hijo:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los hijos cubiertos es `1000`; el proceso del Gateway en sí
mantiene su puntuación normal (normalmente `0`).

`OOMPolicy=continue` de la unidad systemd mantiene activo el servicio de Gateway cuando
un hijo transitorio es seleccionado por el OOM killer, en lugar de marcar toda la
unidad como fallida y reiniciar todos los canales; el hijo o la sesión fallida informa
su propio error.

Esto no sustituye al ajuste normal de memoria. Si una VPS o un contenedor termina hijos repetidamente,
aumenta el límite de memoria, reduce la concurrencia o añade controles de recursos
más estrictos (systemd `MemoryMax=`, límites de memoria del contenedor).

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
- [Runbook de Gateway](/es/gateway)
- [Configuración de Gateway](/es/gateway/configuration)
