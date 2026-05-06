---
read_when:
    - Configurar el entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la aplicación de macOS de OpenClaw
title: Configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-05-06T09:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración de desarrollo para macOS

Compila y ejecuta la aplicación de OpenClaw para macOS desde el código fuente.

## Requisitos previos

Antes de compilar la app, asegúrate de tener instalado lo siguiente:

1. **Xcode 26.2+**: Requerido para el desarrollo en Swift.
2. **Node.js 24 y pnpm**: Recomendado para el Gateway, la CLI y los scripts de empaquetado. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por compatibilidad.

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

Si no tienes un certificado de Apple Developer ID, el script usará automáticamente **firma ad-hoc** (`-`).

Para modos de ejecución de desarrollo, flags de firma y solución de problemas con Team ID, consulta el README de la app de macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Las apps firmadas ad-hoc pueden activar avisos de seguridad. Si la app se bloquea de inmediato con "Abort trap 6", consulta la sección [Solución de problemas](#troubleshooting).

## 3. Instalar la CLI

La app de macOS espera una instalación global de la CLI `openclaw` para gestionar tareas en segundo plano.

**Para instalarla (recomendado):**

1. Abre la app OpenClaw.
2. Ve a la pestaña de configuración **General**.
3. Haz clic en **"Instalar CLI"**.

También puedes instalarla manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también funcionan.
Para el runtime del Gateway, Node sigue siendo la ruta recomendada.

## Solución de problemas

### La compilación falla: incompatibilidad de toolchain o SDK

La compilación de la app de macOS espera el SDK de macOS más reciente y el toolchain Swift 6.2.

**Dependencias del sistema (requeridas):**

- **Última versión de macOS disponible en Actualización de software** (requerida por los SDK de Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Comprobaciones:**

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La app se bloquea al conceder permisos

Si la app se bloquea cuando intentas permitir el acceso a **Reconocimiento de voz** o **Micrófono**, puede deberse a una caché de TCC dañada o a una incompatibilidad de firma.

**Solución:**

1. Restablece los permisos de TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente el `BUNDLE_ID` en [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forzar un "borrón y cuenta nueva" desde macOS.

### Gateway "Iniciando..." indefinidamente

Si el estado del Gateway permanece en "Iniciando...", comprueba si un proceso zombi está reteniendo el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# Si no estás usando un LaunchAgent (modo dev / ejecuciones manuales), busca el listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual está reteniendo el puerto, detén ese proceso (Ctrl+C). Como último recurso, termina el PID que encontraste arriba.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
