---
read_when:
    - Configuración del entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la app de macOS de OpenClaw
title: Configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-06-27T12:02:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración de desarrollo en macOS

Compila y ejecuta la aplicación de OpenClaw para macOS desde el código fuente.

## Requisitos previos

Antes de compilar la aplicación, asegúrate de tener instalado lo siguiente:

1. **Xcode 26.2+**: Requerido para el desarrollo en Swift.
2. **Node.js 24 y pnpm**: Recomendados para el Gateway, la CLI y los scripts de empaquetado. Node 22 LTS, actualmente `22.19+`, sigue siendo compatible por compatibilidad.

## 1. Instalar dependencias

Instala las dependencias de todo el proyecto:

```bash
pnpm install
```

## 2. Compilar y empaquetar la aplicación

Para compilar la aplicación de macOS y empaquetarla en `dist/OpenClaw.app`, ejecuta:

```bash
./scripts/package-mac-app.sh
```

Si no tienes un certificado de Apple Developer ID, el script usará automáticamente **firma ad hoc** (`-`).

Para los modos de ejecución de desarrollo, las opciones de firma y la resolución de problemas del Team ID, consulta el README de la aplicación de macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Las aplicaciones firmadas ad hoc pueden activar avisos de seguridad. Si la aplicación se bloquea inmediatamente con "Abort trap 6", consulta la sección [Solución de problemas](#troubleshooting).

## 3. Instalar la CLI

La aplicación de macOS espera una instalación global de la CLI `openclaw` para administrar tareas en segundo plano.

**Para instalarla (recomendado):**

1. Abre la aplicación OpenClaw.
2. Ve a la pestaña de configuración **General**.
3. Haz clic en **"Install CLI"**.

Como alternativa, instálala manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también funcionan.
Para el entorno de ejecución del Gateway, Node sigue siendo la ruta recomendada.

## Solución de problemas

### Error de compilación: incompatibilidad de cadena de herramientas o SDK

La compilación de la aplicación de macOS espera el SDK de macOS más reciente y la cadena de herramientas Swift 6.2.

**Dependencias del sistema (requeridas):**

- **Última versión de macOS disponible en Actualización de software** (requerida por los SDK de Xcode 26.2)
- **Xcode 26.2** (cadena de herramientas Swift 6.2)

**Comprobaciones:**

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La aplicación se bloquea al conceder permisos

Si la aplicación se bloquea cuando intentas permitir el acceso a **Speech Recognition** o **Microphone**, puede deberse a una caché TCC dañada o a una incompatibilidad de firma.

**Solución:**

1. Restablece los permisos TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente el `BUNDLE_ID` en [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forzar un "clean slate" de macOS.

### Gateway "Starting..." indefinidamente

Si el estado del Gateway permanece en "Starting...", comprueba si un proceso zombi está ocupando el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual está ocupando el puerto, detén ese proceso (Ctrl+C). Como último recurso, termina el PID que encontraste arriba.

## Relacionado

- [Aplicación de macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
