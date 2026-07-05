---
read_when:
    - Configuración del entorno de desarrollo de macOS
summary: Guía de configuración para desarrolladores que trabajan en la aplicación de macOS de OpenClaw
title: Configuración de desarrollo de macOS
x-i18n:
    generated_at: "2026-07-05T11:26:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuración de desarrollo en macOS

Compila y ejecuta la aplicación de OpenClaw para macOS desde el código fuente.

## Requisitos previos

- **Xcode 26.2+** (cadena de herramientas Swift 6.2), en la versión más reciente de macOS disponible en
  Actualización de software.
- **Node.js 24 y pnpm** para el Gateway, la CLI y los scripts de empaquetado. Node
  22.19+ también funciona.

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Compilar y empaquetar la app

```bash
./scripts/package-mac-app.sh
```

Genera `dist/OpenClaw.app`. Sin un certificado de Apple Developer ID, el
script recurre a la firma ad hoc.

Para modos de ejecución de desarrollo, flags de firma y solución de problemas de Team ID, consulta
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Bucle de desarrollo rápido desde la raíz del repo: `scripts/restart-mac.sh` (añade `--no-sign` para
firma ad hoc; los permisos TCC no persisten con `--no-sign`).

<Note>
Las apps firmadas ad hoc pueden activar avisos de seguridad. Si la app se bloquea
inmediatamente con "Abort trap 6", consulta [Solución de problemas](#troubleshooting).
</Note>

## 3. Instalar la CLI y el Gateway

La app empaquetada incluye el instalador canónico `scripts/install-cli.sh`. En un
perfil nuevo, elige **Este Mac** durante la incorporación; la app instala la
CLI y el runtime correspondientes en el espacio de usuario antes de iniciar el asistente del Gateway.

Para recuperación manual de desarrollo, instala tú mismo la CLI correspondiente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` y `bun add -g openclaw@<version>` también
funcionan. Node sigue siendo el runtime recomendado para el propio Gateway.

## Solución de problemas

### Error de compilación: incompatibilidad de cadena de herramientas o SDK

La compilación de la app para macOS espera el SDK de macOS más reciente y la cadena de herramientas Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Si las versiones no coinciden, actualiza macOS/Xcode y vuelve a ejecutar la compilación.

### La app se bloquea al conceder permisos

Si la app se bloquea cuando intentas permitir el acceso a **Reconocimiento de voz** o al
**Micrófono**, puede deberse a una caché TCC dañada o a una incompatibilidad de firma.

1. Restablece los permisos TCC para el id del bundle de depuración:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si eso falla, cambia temporalmente `BUNDLE_ID` en
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   para forzar un estado limpio desde macOS.

### Gateway en "Starting..." indefinidamente

Comprueba si un proceso zombi mantiene ocupado el puerto:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si una ejecución manual mantiene ocupado el puerto, detenla (Ctrl+C) o elimina el PID encontrado arriba
como último recurso.

## Relacionado

- [App para macOS](/es/platforms/macos)
- [Resumen de instalación](/es/install)
