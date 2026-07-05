---
read_when:
    - Actualización de asignaciones de identificadores de modelos de dispositivos o archivos NOTICE/licencia
    - Cambiando cómo la IU de Instances muestra los nombres de dispositivos
summary: Cómo OpenClaw incorpora identificadores de modelo de dispositivos Apple para nombres descriptivos en la app de macOS.
title: Base de datos de modelos de dispositivos
x-i18n:
    generated_at: "2026-07-05T11:40:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

La interfaz de usuario **Instancias** de la app complementaria para macOS asigna identificadores de modelo de Apple a nombres legibles (`iPad16,6` -> "iPad Pro de 13 pulgadas (M4)", `Mac16,6` -> "MacBook Pro (14 pulgadas, 2024)"). `DeviceModelCatalog` también usa el prefijo del identificador (con respaldo en la familia del dispositivo) para elegir un SF Symbol por dispositivo.

Archivos en `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Archivo                                | Propósito                                      |
| -------------------------------------- | ---------------------------------------------- |
| `ios-device-identifiers.json`          | Asignación de identificador iOS/iPadOS -> nombre |
| `mac-device-identifiers.json`          | Asignación de identificador Mac -> nombre      |
| `NOTICE.md`                            | SHA de commits upstream fijados                |
| `LICENSE.apple-device-identifiers.txt` | Licencia MIT upstream                          |

## Fuente de datos

Vendorizado desde el repositorio de GitHub `kyle-seongwoo-jun/apple-device-identifiers`, con licencia MIT. Los archivos JSON están fijados a los SHA de commits registrados en `NOTICE.md` para mantener las compilaciones deterministas.

## Actualizar la base de datos

1. Elige los SHA de commits upstream que se fijarán (uno para iOS, otro para macOS).
2. Actualiza `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` con los nuevos SHA.
3. Vuelve a descargar los archivos JSON fijados a esos commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Confirma que `LICENSE.apple-device-identifiers.txt` aún coincide con upstream; reemplázalo si la licencia upstream cambió.
5. Verifica que la app para macOS compile correctamente:

```bash
swift build --package-path apps/macos
```

## Relacionado

- [Nodos](/es/nodes)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
