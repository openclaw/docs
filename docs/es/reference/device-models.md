---
read_when:
    - Actualización de las asignaciones de identificadores de modelos de dispositivos o de los archivos NOTICE/licencia
    - Cambiar cómo la interfaz de usuario de instancias muestra los nombres de los dispositivos
summary: Cómo OpenClaw integra identificadores de modelos de dispositivos Apple para mostrar nombres descriptivos en la aplicación para macOS.
title: Base de datos de modelos de dispositivos
x-i18n:
    generated_at: "2026-07-11T23:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

La interfaz de usuario **Instances** de la aplicación complementaria para macOS asigna los identificadores de modelos de Apple a nombres descriptivos (`iPad16,6` -> "iPad Pro de 13 pulgadas (M4)", `Mac16,6` -> "MacBook Pro (14 pulgadas, 2024)"). `DeviceModelCatalog` también utiliza el prefijo del identificador (y, como alternativa, la familia del dispositivo) para elegir un símbolo SF para cada dispositivo.

Archivos de `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Archivo                                  | Propósito                                      |
| ---------------------------------------- | ---------------------------------------------- |
| `ios-device-identifiers.json`            | Asignación de identificador de iOS/iPadOS a nombre |
| `mac-device-identifiers.json`            | Asignación de identificador de Mac a nombre    |
| `NOTICE.md`                              | SHA de commits ascendentes fijados             |
| `LICENSE.apple-device-identifiers.txt`   | Licencia MIT del proyecto ascendente           |

## Fuente de los datos

Incorporados desde el repositorio de GitHub `kyle-seongwoo-jun/apple-device-identifiers`, con licencia MIT. Los archivos JSON están fijados a los SHA de commits registrados en `NOTICE.md` para mantener las compilaciones deterministas.

## Actualización de la base de datos

1. Elija los SHA de commits ascendentes que se fijarán (uno para iOS y otro para macOS).
2. Actualice `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` con los nuevos SHA.
3. Vuelva a descargar los archivos JSON fijados a esos commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Confirme que `LICENSE.apple-device-identifiers.txt` siga coincidiendo con el proyecto ascendente; sustitúyalo si la licencia del proyecto ascendente ha cambiado.
5. Verifique que la aplicación para macOS se compile correctamente:

```bash
swift build --package-path apps/macos
```

## Contenido relacionado

- [Nodes](/es/nodes)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
