---
read_when:
    - Compilar o firmar compilaciones de depuración para Mac
summary: Pasos de firma para compilaciones de depuración de macOS generadas por scripts de empaquetado
title: Firma de macOS
x-i18n:
    generated_at: "2026-07-05T11:29:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# firma de mac (compilaciones de depuración)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compila y empaqueta la aplicación en una ruta fija (`dist/OpenClaw.app`) y luego llama a [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para firmarla. Los permisos de TCC están vinculados al ID del paquete y a la firma de código; mantener ambos estables (y la aplicación en una ruta fija) entre recompilaciones evita que macOS olvide las concesiones de TCC (notificaciones, accesibilidad, grabación de pantalla, micrófono, voz).

- El identificador del paquete de depuración predeterminado es `ai.openclaw.mac.debug` (se puede sobrescribir con `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` o `>=23.11.0` (`engines` de `package.json` del repositorio). El empaquetador también compila la UI de control (`pnpm ui:build`).
- Requiere una identidad de firma real de forma predeterminada; el script de codesign termina con un error si no encuentra ninguna y `ALLOW_ADHOC_SIGNING` no está definido. La firma ad hoc (`SIGN_IDENTITY="-"`) es una opción explícita y no conserva los permisos de TCC entre recompilaciones. Consulta [permisos de macOS](/es/platforms/mac/permissions).
- Lee `SIGN_IDENTITY` desde el entorno (por ejemplo, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, o un certificado Developer ID Application). Sin esto, `codesign-mac-app.sh` selecciona automáticamente una identidad en este orden: Developer ID Application, Apple Distribution, Apple Development y luego la primera identidad de codesigning válida encontrada.
- `CODESIGN_TIMESTAMP=auto` (predeterminado) habilita marcas de tiempo de confianza solo para firmas Developer ID Application. Define `on`/`off` para forzarlo en uno u otro sentido.
- Marca Info.plist con `OpenClawBuildTimestamp` (ISO8601 UTC) y `OpenClawGitCommit` (hash corto, `unknown` si no está disponible) para que la pestaña Acerca de pueda mostrar la compilación, git y el canal de depuración/lanzamiento.
- Ejecuta una auditoría de Team ID después de firmar y falla si algún Mach-O dentro del paquete tiene un Team ID distinto. Define `SKIP_TEAM_ID_CHECK=1` para omitirla.

## Uso

```bash
# from repo root
scripts/package-mac-app.sh                                                      # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # dev-only Sparkle Team ID mismatch workaround
```

### Nota sobre la firma ad hoc

`SIGN_IDENTITY="-"` deshabilita Hardened Runtime (`--options runtime`) para evitar fallos cuando la aplicación carga frameworks incrustados (como Sparkle) que no comparten el mismo Team ID. Las firmas ad hoc también rompen la persistencia de permisos de TCC; consulta [permisos de macOS](/es/platforms/mac/permissions) para ver los pasos de recuperación.

## Metadatos de compilación para Acerca de

La pestaña Acerca de lee `OpenClawBuildTimestamp` y `OpenClawGitCommit` desde Info.plist para mostrar la versión, la fecha de compilación, el commit de git y si la compilación es DEBUG (mediante `#if DEBUG`). Vuelve a ejecutar el empaquetador después de cambios de código para actualizar estos valores.

## Relacionado

- [aplicación macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
