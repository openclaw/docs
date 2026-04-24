---
read_when:
    - Configurar el entorno de desarrollo en macOS
summary: Guía de configuración para desarrolladores que trabajan en la app de macOS de OpenClaw
title: configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-04-24T05:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configuración de desarrollo en macOS

Esta guía cubre los pasos necesarios para compilar y ejecutar desde el código fuente la aplicación de OpenClaw para macOS.

## Requisitos previos

Antes de compilar la app, asegúrate de tener instalado lo siguiente:

1. **Xcode 26.2+**: requerido para desarrollo con Swift.
2. **Node.js 24 y pnpm**: recomendados para el gateway, la CLI y los scripts de empaquetado. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por motivos de compatibilidad.

## 1. Instalar dependencias

Instala las dependencias de todo el proyecto:

```bash
pnpm install
```

## 2. Compilar y empaquetar la app

Para compilar la app de macOS y empaquetarla en `dist/OpenClaw.app`, ejecuta:

```bash
./scripts/package-mac-app.sh
```

Si no tienes un certificado Apple Developer ID, el script usará automáticamente **firma ad-hoc** (`-`).

Para modos de ejecución de desarrollo, flags de firma y solución de problemas del Team ID, consulta el README de la app de macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Las apps firmadas ad-hoc pueden activar avisos de seguridad. Si la app se bloquea inmediatamente con "Abort trap 6", consulta la sección [Solución de problemas](#solución-de-problemas).

## 3. Instalar la CLI

La app de macOS espera una instalación global de la CLI `openclaw` para gestionar tareas en segundo plano.

**Para instalarla (recomendado):**

1. Abre la app de OpenClaw.
2. Ve a la pestaña de ajustes **General**.
3. Haz clic en **"Install CLI"**.

Como alternativa, instálala manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también funcionan.
Para el tiempo de ejecución del Gateway, Node sigue siendo la ruta recomendada.

## Solución de problemas

### La compilación falla: desajuste de toolchain o SDK

La compilación de la app de macOS espera el SDK más reciente de macOS y el toolchain Swift 6.2.

**Dependencias del sistema (requeridas):**

- **La última versión de macOS disponible en Software Update** (requerida por los SDK de Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Comprobaciones:**

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La app se bloquea al conceder permisos

Si la app se bloquea cuando intentas permitir acceso a **Speech Recognition** o **Microphone**, puede deberse a una caché TCC dañada o a un desajuste de firma.

**Solución:**

1. Restablece los permisos TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente el `BUNDLE_ID` en [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forzar un "estado limpio" de macOS.

### Gateway "Starting..." indefinidamente

Si el estado del gateway se queda en "Starting...", comprueba si un proceso zombi está reteniendo el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# Si no estás usando un LaunchAgent (modo desarrollo / ejecuciones manuales), busca el listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual está reteniendo el puerto, detén ese proceso (Ctrl+C). Como último recurso, mata el PID que encontraste arriba.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
