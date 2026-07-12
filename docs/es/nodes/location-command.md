---
read_when:
    - Adición de compatibilidad con nodos de ubicación o de una interfaz de permisos
    - Diseño de los permisos de ubicación o del comportamiento en primer plano de Android
summary: Comando de ubicación para nodos (location.get), modos de permisos y comportamiento en primer plano de Android
title: Comando de ubicación
x-i18n:
    generated_at: "2026-07-11T23:14:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Resumen

- `location.get` es un comando de Node que se invoca mediante `node.invoke` o `openclaw nodes location get`.
- Desactivado de forma predeterminada.
- Las compilaciones de terceros para Android usan un selector: Desactivado / Mientras se usa / Siempre. Las compilaciones de Play mantienen Desactivado / Mientras se usa.
- La ubicación precisa tiene un interruptor independiente.

## Por qué un selector (y no solo un interruptor)

Los permisos de ubicación del sistema operativo tienen varios niveles. La ubicación precisa también es una concesión independiente del sistema operativo (en iOS 14+, «Precisa»; en Android, «precisa» frente a «aproximada»). El selector de la aplicación determina el modo solicitado, pero el sistema operativo sigue decidiendo el permiso que realmente concede.

## Modelo de configuración

Por dispositivo Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamiento de la interfaz:

- Seleccionar `whileUsing` solicita permiso de ubicación en primer plano.
- Al seleccionar `always` en la compilación de terceros para Android, primero se solicita permiso de ubicación en primer plano, se explica el acceso en segundo plano y, después, se abre la configuración de la aplicación en Android para conceder por separado **Allow all the time**.
- Las compilaciones de Android para Play no declaran el permiso de ubicación en segundo plano ni muestran `always`.
- Si el sistema operativo deniega el nivel solicitado, la aplicación vuelve al nivel concedido más alto y muestra el estado.

## Correspondencia de permisos (`node.permissions`)

Opcional. El Node de macOS informa de `location` mediante el mapa `permissions` en `node.list`/`node.describe`; iOS y Android pueden omitirlo.

## Comando: `location.get`

Se llama mediante `node.invoke` o con el asistente de la CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parámetros:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Las opciones de la CLI se corresponden directamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Carga útil de la respuesta:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Errores (códigos estables):

- `LOCATION_DISABLED`: el selector está desactivado.
- `LOCATION_PERMISSION_REQUIRED`: falta el permiso para el modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: la aplicación está en segundo plano, pero solo se ha concedido Mientras se usa.
- `LOCATION_TIMEOUT`: no se obtuvo una posición a tiempo.
- `LOCATION_UNAVAILABLE`: fallo del sistema o ausencia de proveedores.

## Comportamiento en segundo plano

- Las compilaciones de terceros para Android aceptan `location.get` en segundo plano solo cuando el usuario ha seleccionado `Siempre` y Android ha concedido el permiso de ubicación en segundo plano. El servicio persistente existente de Node añade el tipo de servicio `location` y muestra `Location: Always` mientras está activo.
- Las compilaciones de Android para Play y el modo `Mientras se usa` deniegan `location.get` cuando la aplicación está en segundo plano.
- Otras plataformas de Node pueden tener un comportamiento diferente.

## Integración con el modelo y las herramientas

- Herramienta del agente: la acción `location_get` de la herramienta `nodes` (requiere un Node).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices del agente: llamar solo cuando el usuario haya habilitado la ubicación y comprenda el alcance.

## Texto de la experiencia de usuario (sugerido)

- Desactivado: «El uso compartido de la ubicación está desactivado».
- Mientras se usa: «Solo cuando OpenClaw está abierto».
- Siempre: «Permitir las comprobaciones de ubicación solicitadas mientras OpenClaw está en segundo plano».
- Precisa: «Usar la ubicación GPS precisa. Desactívelo para compartir una ubicación aproximada».

## Contenido relacionado

- [Descripción general de los Nodes](/es/nodes)
- [Análisis de ubicación de los canales](/es/channels/location)
- [Captura de la cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
