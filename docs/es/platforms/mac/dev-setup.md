---
read_when:
    - Configuración del entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la aplicación de OpenClaw para macOS
title: Configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-07-16T11:44:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración del entorno de desarrollo en macOS

Compila y ejecuta la aplicación de OpenClaw para macOS desde el código fuente.

## Requisitos previos

- **Xcode 26.2+** (cadena de herramientas de Swift 6.2), en la versión más reciente de macOS disponible en
  Software Update.
- **Node.js 24.15+ y pnpm** para el Gateway, la CLI y los scripts de empaquetado. Node
  22.22.3+ también funciona.

## 1. Instalar las dependencias

```bash
pnpm install
```

## 2. Compilar y empaquetar la aplicación

```bash
./scripts/package-mac-app.sh
```

Genera `dist/OpenClaw.app`. Sin un certificado de Apple Developer ID, el
script recurre a la firma ad hoc.

Para consultar los modos de ejecución de desarrollo, las opciones de firma y la solución de problemas del Team ID, véase
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Ciclo rápido de desarrollo desde la raíz del repositorio: `scripts/restart-mac.sh` (añada `--no-sign` para la
firma ad hoc; los permisos de TCC no se conservan con `--no-sign`).

<Note>
Las aplicaciones firmadas ad hoc pueden generar avisos de seguridad. Si la aplicación se bloquea
inmediatamente con "Abort trap 6", véase [Solución de problemas](#troubleshooting).
</Note>

## 3. Instalar la CLI y el Gateway

La aplicación empaquetada incorpora el instalador canónico `scripts/install-cli.sh`. En un
perfil nuevo, seleccione **This Mac** durante la incorporación; la aplicación instala la
CLI de espacio de usuario y el entorno de ejecución correspondientes antes de iniciar el asistente del Gateway.

Para la recuperación manual durante el desarrollo, instale personalmente la CLI correspondiente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también
funcionan. Node sigue siendo el entorno de ejecución recomendado para el propio Gateway.

## Solución de problemas

### Error de compilación: incompatibilidad de la cadena de herramientas o el SDK

La compilación de la aplicación para macOS requiere el SDK más reciente de macOS y la cadena de herramientas
de Swift 6.2 (Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualice macOS/Xcode y vuelva a ejecutar la compilación.

### La aplicación se bloquea al conceder permisos

Si la aplicación se bloquea al intentar permitir el acceso a **Speech Recognition** o al
**Microphone**, puede deberse a una caché de TCC dañada o a una incompatibilidad de firma.

1. Restablezca los permisos de TCC para el identificador del paquete de depuración:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si esto no funciona, cambie temporalmente `BUNDLE_ID` en
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   para forzar un estado inicial limpio en macOS.

### El Gateway permanece en "Starting..." indefinidamente

Compruebe si un proceso zombi mantiene ocupado el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# Si no utiliza un LaunchAgent (modo de desarrollo / ejecuciones manuales), busque el proceso que escucha:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual mantiene ocupado el puerto, deténgala (Ctrl+C) o finalice el PID indicado anteriormente
como último recurso.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Descripción general de la instalación](/es/install)
