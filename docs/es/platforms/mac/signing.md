---
read_when:
    - Compilación o firma de versiones de depuración para Mac
summary: Pasos de firma para compilaciones de depuración de macOS generadas por scripts de empaquetado
title: Firma de macOS
x-i18n:
    generated_at: "2026-07-14T13:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# firma en macOS (compilaciones de depuración)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compila y empaqueta la aplicación en una ruta fija (`dist/OpenClaw.app`) y, a continuación, llama a [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para firmarla. Los permisos de TCC están vinculados al ID del paquete y a la firma de código; mantener ambos estables (y la aplicación en una ruta fija) entre recompilaciones evita que macOS olvide las concesiones de TCC (notificaciones, accesibilidad, grabación de pantalla, micrófono y reconocimiento de voz).

- El identificador del paquete de depuración es, de forma predeterminada, `ai.openclaw.mac.debug` (se puede sustituir con `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` o `>=25.9.0` (`package.json` del repositorio: `engines`). El empaquetador también compila la interfaz de control (`pnpm ui:build`).
- De forma predeterminada, requiere una identidad de firma real; el script de firma de código termina con un error si no se encuentra ninguna y `ALLOW_ADHOC_SIGNING` no está definido. La firma ad hoc (`SIGN_IDENTITY="-"`) requiere una activación explícita y no conserva los permisos de TCC entre recompilaciones. Consulte [Permisos de macOS](/es/platforms/mac/permissions).
- Lee `SIGN_IDENTITY` del entorno (por ejemplo, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` o un certificado Developer ID Application). Si no se proporciona, `codesign-mac-app.sh` selecciona automáticamente una identidad en este orden: Developer ID Application, Apple Distribution, Apple Development y, por último, la primera identidad válida de firma de código que encuentre.
- `CODESIGN_TIMESTAMP=auto` (valor predeterminado) habilita las marcas de tiempo de confianza únicamente para las firmas Developer ID Application. Defina `on`/`off` para forzar cualquiera de las dos opciones.
- Añade a Info.plist `OpenClawBuildTimestamp` (ISO8601 UTC) y `OpenClawGitCommit` (hash corto, `unknown` si no está disponible) para que la pestaña Acerca de pueda mostrar la compilación, la información de Git y el canal de depuración o publicación.
- Ejecuta una auditoría del ID de equipo después de firmar y falla si algún archivo Mach-O del paquete tiene un ID de equipo diferente. Defina `SKIP_TEAM_ID_CHECK=1` para omitirla.

## Uso

```bash
# desde la raíz del repositorio
scripts/package-mac-app.sh                                                      # selecciona automáticamente la identidad; genera un error si no encuentra ninguna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificado real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (los permisos no se conservarán)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc explícita (con la misma salvedad)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # solución provisional solo para desarrollo ante una discrepancia del ID de equipo de Sparkle
```

### Nota sobre la firma ad hoc

`SIGN_IDENTITY="-"` deshabilita el entorno de ejecución reforzado (`--options runtime`) para evitar fallos cuando la aplicación carga frameworks integrados (como Sparkle) que no comparten el mismo ID de equipo. Las firmas ad hoc también impiden conservar los permisos de TCC; consulte [Permisos de macOS](/es/platforms/mac/permissions) para conocer los pasos de recuperación.

## Metadatos de compilación para Acerca de

La pestaña Acerca de lee `OpenClawBuildTimestamp` y `OpenClawGitCommit` de Info.plist para mostrar la versión, la fecha de compilación, el commit de Git y si la compilación es DEBUG (mediante `#if DEBUG`). Vuelva a ejecutar el empaquetador después de modificar el código para actualizar estos valores.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Permisos de macOS](/es/platforms/mac/permissions)
