---
read_when:
    - Depuración de avisos de permisos de macOS ausentes o bloqueados
    - Decidir si conceder Accesibilidad a node o a un entorno de ejecución de CLI
    - Empaquetar o firmar la app de macOS
    - Cambiar los ID de paquete o las rutas de instalación de la app
summary: Persistencia de permisos de macOS (TCC) y requisitos de firma
title: Permisos de macOS
x-i18n:
    generated_at: "2026-06-27T12:03:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Las concesiones de permisos de macOS son frágiles. TCC asocia una concesión de permiso con la
firma de código de la app, el identificador del paquete y la ruta en disco. Si cualquiera de estos cambia,
macOS trata la app como nueva y puede descartar u ocultar los avisos.

## Requisitos para permisos estables

- Misma ruta: ejecuta la app desde una ubicación fija (para OpenClaw, `dist/OpenClaw.app`).
- Mismo identificador de paquete: cambiar el ID del paquete crea una nueva identidad de permiso.
- App firmada: las compilaciones sin firma o firmadas ad hoc no conservan los permisos.
- Firma coherente: usa un certificado real de Apple Development o Developer ID
  para que la firma se mantenga estable entre recompilaciones.

Las firmas ad hoc generan una identidad nueva en cada compilación. macOS olvidará las concesiones
anteriores, y los avisos pueden desaparecer por completo hasta que se borren las entradas obsoletas.

## Concesiones de Accesibilidad para tiempos de ejecución de Node y CLI

Prefiere conceder Accesibilidad a OpenClaw.app, Peekaboo.app u otro asistente firmado
con su propio identificador de paquete en lugar de un binario `node` genérico.

TCC de macOS concede Accesibilidad a la identidad de código del proceso que ve. Si un
flujo de trabajo de Homebrew, nvm, pnpm o npm hace que un ejecutable `node` compartido
reciba Accesibilidad, cualquier paquete de JavaScript iniciado mediante ese mismo
ejecutable puede heredar privilegios de automatización de GUI.

Trata una entrada `node` en Configuración del Sistema como un permiso amplio para ese tiempo de ejecución de Node,
no como un permiso para un único paquete npm. Evita conceder Accesibilidad a
`node` a menos que confíes en todos los scripts y paquetes iniciados mediante esa instalación exacta de
Node.

Si concediste Accesibilidad a `node` por accidente, elimina esa entrada de
Configuración del Sistema -> Privacidad y seguridad -> Accesibilidad. Luego concede el permiso a la app
o al asistente firmado que debe ser dueño de la automatización de la UI.

## Lista de recuperación cuando desaparecen los avisos

1. Cierra la app.
2. Elimina la entrada de la app en Configuración del Sistema -> Privacidad y seguridad.
3. Vuelve a iniciar la app desde la misma ruta y concede de nuevo los permisos.
4. Si el aviso todavía no aparece, restablece las entradas de TCC con `tccutil` e inténtalo de nuevo.
5. Algunos permisos solo vuelven a aparecer después de reiniciar macOS por completo.

Ejemplos de restablecimiento (reemplaza el ID de paquete según sea necesario):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permisos de archivos y carpetas (Escritorio/Documentos/Descargas)

macOS también puede restringir Escritorio, Documentos y Descargas para procesos de terminal/en segundo plano. Si las lecturas de archivos o los listados de directorios se bloquean, concede acceso al mismo contexto de proceso que realiza las operaciones de archivo (por ejemplo, Terminal/iTerm, una app iniciada por LaunchAgent o un proceso SSH).

Solución alternativa: mueve los archivos al espacio de trabajo de OpenClaw (`~/.openclaw/workspace`) si quieres evitar concesiones por carpeta.

Si estás probando permisos, firma siempre con un certificado real. Las compilaciones ad hoc
solo son aceptables para ejecuciones locales rápidas donde los permisos no importan.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [firma de macOS](/es/platforms/mac/signing)
