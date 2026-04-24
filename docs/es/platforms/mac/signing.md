---
read_when:
    - Compilar o firmar compilaciones de depuración de Mac
summary: Pasos de firma para compilaciones de depuración de macOS generadas por scripts de empaquetado
title: Firma de macOS
x-i18n:
    generated_at: "2026-04-24T05:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# firma de Mac (compilaciones de depuración)

Esta app normalmente se compila desde [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que ahora:

- establece un identificador de paquete de depuración estable: `ai.openclaw.mac.debug`
- escribe el Info.plist con ese identificador de paquete (sobrescritura mediante `BUNDLE_ID=...`)
- llama a [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para firmar el binario principal y el paquete de la app, de modo que macOS trate cada recompilación como el mismo paquete firmado y conserve los permisos TCC (notificaciones, accesibilidad, grabación de pantalla, micrófono, voz). Para permisos estables, usa una identidad de firma real; la firma ad-hoc es opcional y frágil (consulta [permisos de macOS](/es/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` de forma predeterminada; habilita marcas de tiempo de confianza para firmas Developer ID. Establece `CODESIGN_TIMESTAMP=off` para omitir la marca de tiempo (compilaciones de depuración sin conexión).
- inyecta metadatos de compilación en Info.plist: `OpenClawBuildTimestamp` (UTC) y `OpenClawGitCommit` (hash corto) para que el panel Acerca de pueda mostrar compilación, git y canal debug/release.
- **El empaquetado usa Node 24 de forma predeterminada**: el script ejecuta compilaciones TS y la compilación de Control UI. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por compatibilidad.
- lee `SIGN_IDENTITY` desde el entorno. Añade `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (o tu certificado Developer ID Application) a tu shell rc para firmar siempre con tu certificado. La firma ad-hoc requiere activación explícita mediante `ALLOW_ADHOC_SIGNING=1` o `SIGN_IDENTITY="-"` (no se recomienda para pruebas de permisos).
- ejecuta una auditoría de Team ID después de firmar y falla si cualquier Mach-O dentro del paquete de la app está firmado por un Team ID diferente. Establece `SKIP_TEAM_ID_CHECK=1` para omitirla.

## Uso

```bash
# desde la raíz del repositorio
scripts/package-mac-app.sh               # selecciona automáticamente la identidad; da error si no encuentra ninguna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificado real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (los permisos no se conservarán)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc explícito (misma advertencia)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # solución alternativa solo para desarrollo ante desajuste de Team ID de Sparkle
```

### Nota sobre firma ad-hoc

Al firmar con `SIGN_IDENTITY="-"` (ad-hoc), el script desactiva automáticamente el **Hardened Runtime** (`--options runtime`). Esto es necesario para evitar fallos cuando la app intenta cargar frameworks embebidos (como Sparkle) que no comparten el mismo Team ID. Las firmas ad-hoc también rompen la persistencia de permisos TCC; consulta [permisos de macOS](/es/platforms/mac/permissions) para los pasos de recuperación.

## Metadatos de compilación para Acerca de

`package-mac-app.sh` marca el paquete con:

- `OpenClawBuildTimestamp`: ISO8601 UTC en el momento del empaquetado
- `OpenClawGitCommit`: hash corto de git (o `unknown` si no está disponible)

La pestaña Acerca de lee estas claves para mostrar versión, fecha de compilación, commit de git y si es una compilación de depuración (mediante `#if DEBUG`). Ejecuta el empaquetador para actualizar estos valores después de cambios de código.

## Por qué

Los permisos TCC están vinculados al identificador del paquete _y_ a la firma del código. Las compilaciones de depuración sin firmar con UUID cambiantes estaban haciendo que macOS olvidara las concesiones después de cada recompilación. Firmar los binarios (ad-hoc de forma predeterminada) y mantener un id/ruta fijos del paquete (`dist/OpenClaw.app`) conserva las concesiones entre compilaciones, igual que el enfoque de VibeTunnel.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Permisos de macOS](/es/platforms/mac/permissions)
