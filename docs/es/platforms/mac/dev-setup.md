---
read_when:
    - Configuración del entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la aplicación para macOS de OpenClaw
title: Configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-04-30T05:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración para desarrolladores de macOS

Compila y ejecuta la aplicación de OpenClaw para macOS desde el código fuente.

## Requisitos previos

Antes de compilar la aplicación, asegúrate de tener instalado lo siguiente:

1. **Xcode 26.2+**: Requerido para el desarrollo en Swift.
2. **Node.js 24 y pnpm**: Recomendado para el Gateway, la CLI y los scripts de empaquetado. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible.

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

Si no tienes un certificado de Apple Developer ID, el script usará automáticamente **firma ad-hoc** (`-`).

Para los modos de ejecución de desarrollo, las opciones de firma y la solución de problemas del Team ID, consulta el README de la aplicación de macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Las aplicaciones firmadas ad-hoc pueden activar avisos de seguridad. Si la aplicación se bloquea de inmediato con "Abort trap 6", consulta la sección [Solución de problemas](#troubleshooting).

## 3. Instalar la CLI

La aplicación de macOS espera una instalación global de la CLI `openclaw` para gestionar tareas en segundo plano.

**Para instalarla (recomendado):**

1. Abre la aplicación OpenClaw.
2. Ve a la pestaña de configuración **General**.
3. Haz clic en **"Instalar CLI"**.

Como alternativa, instálala manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también funcionan.
Para el entorno de ejecución del Gateway, Node sigue siendo la ruta recomendada.

## Solución de problemas

### La compilación falla: incompatibilidad de toolchain o SDK

La compilación de la aplicación de macOS espera el SDK de macOS más reciente y la toolchain de Swift 6.2.

**Dependencias del sistema (requeridas):**

- **La versión más reciente de macOS disponible en Actualización de software** (requerida por los SDK de Xcode 26.2)
- **Xcode 26.2** (toolchain de Swift 6.2)

**Comprobaciones:**

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La aplicación se bloquea al conceder permisos

Si la aplicación se bloquea cuando intentas permitir el acceso a **Reconocimiento de voz** o **Micrófono**, puede deberse a una caché TCC dañada o a una incompatibilidad de firma.

**Corrección:**

1. Restablece los permisos de TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente el `BUNDLE_ID` en [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forzar un "estado limpio" desde macOS.

### Gateway "Iniciando..." indefinidamente

Si el estado del Gateway permanece en "Iniciando...", comprueba si un proceso zombie está reteniendo el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual está reteniendo el puerto, detén ese proceso (Ctrl+C). Como último recurso, termina el PID que encontraste arriba.

## Relacionado

- [Aplicación de macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
