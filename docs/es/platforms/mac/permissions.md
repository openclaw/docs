---
read_when:
    - Depuración de solicitudes de permisos de macOS que no aparecen o se quedan bloqueadas
    - Decidir si se concede acceso de Accesibilidad a Node o a un entorno de ejecución de la CLI
    - Empaquetado o firma de la aplicación para macOS
    - Cambiar los identificadores de paquete o las rutas de instalación de la aplicación
summary: Persistencia de permisos de macOS (TCC) y requisitos de firma
title: Permisos de macOS
x-i18n:
    generated_at: "2026-07-11T23:15:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Las concesiones de permisos de macOS son frágiles. TCC asocia una concesión de permiso con la firma de código de la aplicación, el identificador del paquete y la ruta en disco. Si cualquiera de estos elementos cambia, macOS considera que la aplicación es nueva y puede descartar u ocultar las solicitudes de permiso.

## Requisitos para permisos estables

- Misma ruta: ejecuta la aplicación desde una ubicación fija (para OpenClaw, `dist/OpenClaw.app`).
- Mismo identificador del paquete: el ID de paquete de OpenClaw es `ai.openclaw.mac`; cambiarlo crea una nueva identidad de permisos.
- Aplicación firmada: las compilaciones sin firmar o con firma ad hoc no conservan los permisos.
- Firma coherente: usa un certificado real de Apple Development o Developer ID para que la firma se mantenga estable entre recompilaciones.

Las firmas ad hoc generan una identidad nueva en cada compilación. macOS olvida las concesiones anteriores y las solicitudes de permiso pueden desaparecer por completo hasta que se eliminen las entradas obsoletas.

## Concesiones de accesibilidad para entornos de ejecución de Node y la CLI

Es preferible conceder accesibilidad a OpenClaw.app, Peekaboo.app u otro componente auxiliar firmado con su propio identificador del paquete, en lugar de a un binario genérico de `node`.

TCC de macOS concede accesibilidad a la identidad de código del proceso que detecta. Si un flujo de trabajo de Homebrew, nvm, pnpm o npm hace que un ejecutable compartido de `node` reciba acceso de accesibilidad, cualquier paquete de JavaScript iniciado mediante ese mismo ejecutable puede heredar privilegios de automatización de la interfaz gráfica.

Considera una entrada de `node` en System Settings como un permiso amplio para ese entorno de ejecución de Node, no como un permiso para un único paquete de npm. Evita conceder accesibilidad a `node`, a menos que confíes en todos los scripts y paquetes iniciados mediante esa instalación específica de Node.

Si concediste accesibilidad accidentalmente a `node`, elimina esa entrada en System Settings -> Privacy & Security -> Accessibility. Después, concede el permiso a la aplicación firmada o al componente auxiliar que deba encargarse de la automatización de la interfaz de usuario.

## Lista de comprobación para recuperar las solicitudes de permiso desaparecidas

1. Cierra la aplicación.
2. Elimina la entrada de la aplicación en System Settings -> Privacy & Security.
3. Vuelve a iniciar la aplicación desde la misma ruta y concede de nuevo los permisos.
4. Si la solicitud sigue sin aparecer, restablece las entradas de TCC con `tccutil` e inténtalo de nuevo.
5. Algunos permisos solo vuelven a aparecer después de reiniciar macOS por completo.

Ejemplos de restablecimiento (con el ID de paquete de OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permisos de archivos y carpetas (Desktop/Documents/Downloads)

macOS también puede restringir Desktop, Documents y Downloads para los procesos de terminal o en segundo plano. Si las lecturas de archivos o los listados de directorios se bloquean, concede acceso al mismo contexto de proceso que realiza las operaciones de archivos (por ejemplo, Terminal/iTerm, una aplicación iniciada por LaunchAgent o un proceso SSH).

Solución alternativa: mueve los archivos al espacio de trabajo de OpenClaw (`~/.openclaw/workspace`) si quieres evitar las concesiones específicas para cada carpeta.

Si estás probando permisos, firma siempre con un certificado real. Las compilaciones ad hoc solo son aceptables para ejecuciones locales rápidas en las que los permisos no sean importantes.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Firma para macOS](/es/platforms/mac/signing)
