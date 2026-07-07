---
read_when:
    - Agregar soporte para nodos de ubicación o interfaz de permisos
    - Diseñar permisos de ubicación o comportamiento en primer plano de Android
summary: Comando de ubicación para nodos (location.get), modos de permiso y comportamiento de Android en primer plano
title: Comando de ubicación
x-i18n:
    generated_at: "2026-07-06T21:48:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Resumen

- `location.get` es un comando de nodo, invocado mediante `node.invoke` u `openclaw nodes location get`.
- Desactivado de forma predeterminada.
- Las compilaciones de terceros para Android usan un selector: Desactivado / Mientras se usa / Siempre. Las compilaciones de Play siguen siendo Desactivado / Mientras se usa.
- Ubicación precisa es un interruptor independiente.

## Por qué un selector (y no solo un interruptor)

Los permisos de ubicación del sistema operativo tienen varios niveles. La ubicación precisa también es una concesión independiente del sistema operativo (iOS 14+ "Precise", Android "fine" frente a "coarse"). El selector dentro de la app controla el modo solicitado, pero el sistema operativo sigue decidiendo la concesión real.

## Modelo de configuración

Por dispositivo de nodo:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamiento de la IU:

- Seleccionar `whileUsing` solicita permiso en primer plano.
- Seleccionar `always` en la compilación de terceros para Android primero solicita permiso en primer plano, explica el acceso en segundo plano y luego abre la configuración de la app de Android para la concesión independiente **Permitir todo el tiempo**.
- Las compilaciones de Android Play no declaran permiso de ubicación en segundo plano ni muestran `always`.
- Si el sistema operativo deniega el nivel solicitado, la app vuelve al nivel concedido más alto y muestra el estado.

## Asignación de permisos (node.permissions)

Opcional. El nodo de macOS informa `location` mediante el mapa `permissions` en `node.list`/`node.describe`; iOS/Android pueden omitirlo.

## Comando: `location.get`

Se llama mediante `node.invoke` o el helper de CLI:

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

Las marcas de CLI se asignan directamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Carga útil de respuesta:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: la app está en segundo plano, pero solo se concedió Mientras se usa.
- `LOCATION_TIMEOUT`: no se obtuvo una posición a tiempo.
- `LOCATION_UNAVAILABLE`: fallo del sistema o no hay proveedores.

## Comportamiento en segundo plano

- Las compilaciones de terceros para Android aceptan `location.get` en segundo plano solo cuando el usuario seleccionó `Always` y Android concedió la ubicación en segundo plano. El servicio persistente de nodo existente agrega el tipo de servicio `location` y muestra `Location: Always` mientras está activo.
- Las compilaciones de Android Play y el modo `While Using` deniegan `location.get` mientras la app está en segundo plano.
- Otras plataformas de nodo pueden diferir.

## Integración de modelo/herramientas

- Herramienta del agente: la acción `location_get` de la herramienta `nodes` (nodo obligatorio).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices para agentes: llamar solo cuando el usuario haya habilitado la ubicación y entienda el alcance.

## Texto de UX (sugerido)

- Desactivado: "El uso compartido de ubicación está deshabilitado."
- Mientras se usa: "Solo cuando OpenClaw está abierto."
- Siempre: "Permitir comprobaciones de ubicación solicitadas mientras OpenClaw está en segundo plano."
- Precisa: "Usar ubicación GPS precisa. Desactívala para compartir una ubicación aproximada."

## Relacionado

- [Resumen de nodos](/es/nodes)
- [Análisis de ubicación de canales](/es/channels/location)
- [Captura de cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
