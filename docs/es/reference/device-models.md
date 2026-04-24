---
read_when:
    - Actualizar asignaciones de identificadores de modelo de dispositivos o archivos NOTICE/licencia
    - Cambiar cómo la UI de Instances muestra los nombres de dispositivos
summary: Cómo OpenClaw incorpora los identificadores de modelo de dispositivos Apple para mostrar nombres legibles en la app de macOS.
title: Base de datos de modelos de dispositivos
x-i18n:
    generated_at: "2026-04-24T05:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Base de datos de modelos de dispositivos (nombres legibles)

La app complementaria de macOS muestra nombres legibles de modelos de dispositivos Apple en la UI de **Instances** al asignar identificadores de modelo de Apple (por ejemplo `iPad16,6`, `Mac16,6`) a nombres comprensibles para humanos.

La asignación se incorpora como JSON en:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Fuente de datos

Actualmente incorporamos la asignación desde el repositorio con licencia MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para mantener compilaciones deterministas, los archivos JSON están fijados a commits específicos aguas arriba (registrados en `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Actualizar la base de datos

1. Elige los commits aguas arriba que quieres fijar (uno para iOS y otro para macOS).
2. Actualiza los hashes de commit en `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Vuelve a descargar los archivos JSON, fijados a esos commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Asegúrate de que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` siga coincidiendo con la licencia aguas arriba (sustitúyelo si cambia la licencia aguas arriba).
5. Verifica que la app de macOS compila limpiamente (sin advertencias):

```bash
swift build --package-path apps/macos
```

## Relacionado

- [Nodes](/es/nodes)
- [Solución de problemas de Nodes](/es/nodes/troubleshooting)
