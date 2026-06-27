---
read_when:
    - Compilar o firmar compilaciones de depuración para Mac
summary: Pasos de firma para compilaciones de depuración de macOS generadas por scripts de empaquetado
title: Firma de macOS
x-i18n:
    generated_at: "2026-06-27T12:03:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# firma de mac (compilaciones de depuración)

Esta app se compila normalmente desde [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que ahora:

- establece un identificador de paquete de depuración estable: `ai.openclaw.mac.debug`
- escribe el Info.plist con ese id de paquete (sobrescríbelo mediante `BUNDLE_ID=...`)
- llama a [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para firmar el binario principal y el paquete de la app, de modo que macOS trate cada recompilación como el mismo paquete firmado y conserve los permisos de TCC (notificaciones, accesibilidad, grabación de pantalla, micrófono, voz). Para permisos estables, usa una identidad de firma real; ad hoc es optativo y frágil (consulta [permisos de macOS](/es/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` de forma predeterminada; habilita marcas de tiempo de confianza para firmas de Developer ID. Establece `CODESIGN_TIMESTAMP=off` para omitir la marca de tiempo (compilaciones de depuración sin conexión).
- inyecta metadatos de compilación en Info.plist: `OpenClawBuildTimestamp` (UTC) y `OpenClawGitCommit` (hash corto) para que el panel Acerca de pueda mostrar la compilación, git y el canal de depuración/lanzamiento.
- **El empaquetado usa Node 24 de forma predeterminada**: el script ejecuta compilaciones TS y la compilación de Control UI. Node 22 LTS, actualmente `22.19+`, sigue siendo compatible.
- lee `SIGN_IDENTITY` desde el entorno. Añade `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (o tu certificado Developer ID Application) a tu rc de shell para firmar siempre con tu certificado. La firma ad hoc requiere una habilitación explícita mediante `ALLOW_ADHOC_SIGNING=1` o `SIGN_IDENTITY="-"` (no recomendado para pruebas de permisos).
- ejecuta una auditoría de Team ID después de firmar y falla si cualquier Mach-O dentro del paquete de la app está firmado por un Team ID distinto. Establece `SKIP_TEAM_ID_CHECK=1` para omitirla.

## Uso

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Nota de firma ad hoc

Al firmar con `SIGN_IDENTITY="-"` (ad hoc), el script deshabilita automáticamente **Hardened Runtime** (`--options runtime`). Esto es necesario para evitar cierres inesperados cuando la app intenta cargar frameworks incrustados (como Sparkle) que no comparten el mismo Team ID. Las firmas ad hoc también rompen la persistencia de permisos de TCC; consulta [permisos de macOS](/es/platforms/mac/permissions) para ver los pasos de recuperación.

## Metadatos de compilación para Acerca de

`package-mac-app.sh` marca el paquete con:

- `OpenClawBuildTimestamp`: UTC ISO8601 en el momento del empaquetado
- `OpenClawGitCommit`: hash corto de git (o `unknown` si no está disponible)

La pestaña Acerca de lee estas claves para mostrar la versión, la fecha de compilación, el commit de git y si es una compilación de depuración (mediante `#if DEBUG`). Ejecuta el empaquetador para actualizar estos valores después de cambios de código.

## Por qué

Los permisos de TCC están vinculados al identificador de paquete _y_ a la firma de código. Las compilaciones de depuración sin firmar con UUID cambiantes hacían que macOS olvidara las concesiones después de cada recompilación. Firmar los binarios (ad hoc de forma predeterminada) y mantener un id/ruta de paquete fijo (`dist/OpenClaw.app`) conserva las concesiones entre compilaciones, igual que el enfoque de VibeTunnel.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
