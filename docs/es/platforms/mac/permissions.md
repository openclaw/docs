---
read_when:
    - Depurar solicitudes de permisos de macOS ausentes o bloqueadas
    - Empaquetar o firmar la app de macOS
    - Cambiar IDs de bundle o rutas de instalación de la app
summary: Persistencia de permisos en macOS (TCC) y requisitos de firma
title: Permisos de macOS
x-i18n:
    generated_at: "2026-04-24T05:38:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

Los permisos concedidos en macOS son frágiles. TCC asocia una concesión de permisos con la
firma de código de la app, el identificador del bundle y la ruta en disco. Si cualquiera de ellos cambia,
macOS trata la app como nueva y puede descartar u ocultar los avisos.

## Requisitos para permisos estables

- Misma ruta: ejecuta la app desde una ubicación fija (para OpenClaw, `dist/OpenClaw.app`).
- Mismo identificador de bundle: cambiar el ID del bundle crea una nueva identidad de permisos.
- App firmada: las compilaciones sin firmar o firmadas ad-hoc no conservan permisos.
- Firma consistente: usa un certificado real Apple Development o Developer ID
  para que la firma se mantenga estable entre recompilaciones.

Las firmas ad-hoc generan una nueva identidad en cada compilación. macOS olvidará las
concesiones anteriores, y los avisos pueden desaparecer por completo hasta que se borren las entradas obsoletas.

## Lista de recuperación cuando los avisos desaparecen

1. Cierra la app.
2. Elimina la entrada de la app en Ajustes del Sistema -> Privacidad y seguridad.
3. Vuelve a iniciar la app desde la misma ruta y vuelve a conceder permisos.
4. Si el aviso sigue sin aparecer, restablece las entradas TCC con `tccutil` y vuelve a intentarlo.
5. Algunos permisos solo reaparecen después de reiniciar por completo macOS.

Ejemplos de restablecimiento (reemplaza el ID del bundle según corresponda):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permisos de archivos y carpetas (Escritorio/Documentos/Descargas)

macOS también puede restringir Escritorio, Documentos y Descargas para procesos de terminal/en segundo plano. Si las lecturas de archivos o los listados de directorios se bloquean, concede acceso al mismo contexto de proceso que realiza las operaciones de archivo (por ejemplo Terminal/iTerm, app iniciada por LaunchAgent o proceso SSH).

Solución alternativa: mueve los archivos al espacio de trabajo de OpenClaw (`~/.openclaw/workspace`) si quieres evitar concesiones por carpeta.

Si estás probando permisos, firma siempre con un certificado real. Las compilaciones ad-hoc
solo son aceptables para ejecuciones locales rápidas en las que los permisos no importan.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Firma en macOS](/es/platforms/mac/signing)
