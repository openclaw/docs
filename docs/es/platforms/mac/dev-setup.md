---
read_when:
    - Configurar el entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la app de OpenClaw para macOS
title: configuración de desarrollo en macOS
x-i18n:
    generated_at: "2026-07-04T06:22:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración de desarrollo en macOS

Compila y ejecuta la aplicación de macOS de OpenClaw desde el código fuente.

## Requisitos previos

Antes de compilar la aplicación, asegúrate de tener instalado lo siguiente:

1. **Xcode 26.2+**: Requerido para el desarrollo con Swift.
2. **Node.js 24 y pnpm**: Recomendado para el Gateway, la CLI y los scripts de empaquetado. Node 22 LTS, actualmente `22.19+`, sigue siendo compatible por compatibilidad.

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

Si no tienes un certificado de Apple Developer ID, el script usará automáticamente la **firma ad hoc** (`-`).

Para los modos de ejecución de desarrollo, las opciones de firma y la solución de problemas con el Team ID, consulta el README de la aplicación de macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: Las aplicaciones firmadas ad hoc pueden activar avisos de seguridad. Si la aplicación se bloquea inmediatamente con "Abort trap 6", consulta la sección [Solución de problemas](#troubleshooting).

## 3. Instalar la CLI y el Gateway

La aplicación empaquetada incluye el instalador canónico `scripts/install-cli.sh`. En un
perfil nuevo, elige **Este Mac** durante la incorporación; la aplicación instala la
CLI y el entorno de ejecución de espacio de usuario correspondientes antes de iniciar el asistente del Gateway.

Para recuperación manual de desarrollo, instala tú mismo la CLI correspondiente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también funcionan.
Para el entorno de ejecución del Gateway, Node sigue siendo la ruta recomendada.

## Solución de problemas

### Error de compilación: incompatibilidad de toolchain o SDK

La compilación de la aplicación de macOS espera el SDK de macOS más reciente y la toolchain de Swift 6.2.

**Dependencias del sistema (requeridas):**

- **Última versión de macOS disponible en Actualización de software** (requerida por los SDK de Xcode 26.2)
- **Xcode 26.2** (toolchain de Swift 6.2)

**Comprobaciones:**

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La aplicación se bloquea al conceder permisos

Si la aplicación se bloquea cuando intentas permitir el acceso a **Reconocimiento de voz** o **Micrófono**, puede deberse a una caché de TCC dañada o a una incompatibilidad de firma.

**Solución:**

1. Restablece los permisos de TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente el `BUNDLE_ID` en [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forzar un "estado limpio" desde macOS.

### Gateway en "Starting..." indefinidamente

Si el estado del Gateway permanece en "Starting...", comprueba si un proceso zombi está ocupando el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual está ocupando el puerto, detén ese proceso (Ctrl+C). Como último recurso, elimina el PID que encontraste arriba.

## Relacionado

- [Aplicación de macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
