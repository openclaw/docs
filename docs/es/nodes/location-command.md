---
read_when:
    - Agregar compatibilidad con nodos de ubicación o interfaz de permisos
    - Diseñar permisos de ubicación o comportamiento en primer plano de Android
summary: Comando de ubicación para nodos (location.get), modos de permiso y comportamiento en primer plano de Android
title: Comando de ubicación
x-i18n:
    generated_at: "2026-07-05T11:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a4d3321a9b4d290461742edb63a7829aeacb082bff11f65e217443d755dc29
    source_path: nodes/location-command.md
    workflow: 16
---

## En resumen

- `location.get` es un comando de Node, invocado mediante `node.invoke` u `openclaw nodes location get`.
- Desactivado de forma predeterminada.
- La configuración de la app de Android usa un selector: Desactivado / Mientras se usa.
- Ubicación precisa es un interruptor independiente.

## Por qué un selector (y no solo un interruptor)

Los permisos de ubicación del sistema operativo tienen varios niveles (iOS/macOS exponen Mientras se usa frente a Siempre; Android actualmente admite solo primer plano). La ubicación precisa también es una concesión independiente del sistema operativo (iOS 14+ "Precisa", Android "fina" frente a "aproximada"). El selector dentro de la app controla el modo solicitado, pero el sistema operativo sigue decidiendo la concesión real.

## Modelo de configuración

Por dispositivo Node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamiento de la interfaz:

- Seleccionar `whileUsing` solicita permiso de primer plano.
- Si el sistema operativo deniega el nivel solicitado, la app vuelve al nivel más alto concedido y muestra el estado.

## Asignación de permisos (node.permissions)

Opcional. El Node de macOS informa `location` mediante el mapa `permissions` en `node.list`/`node.describe`; iOS/Android pueden omitirlo.

## Comando: `location.get`

Se llama mediante `node.invoke` o el asistente de CLI:

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

Las flags de CLI se asignan directamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Payload de respuesta:

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

- La app de Android deniega `location.get` cuando está en segundo plano; mantén OpenClaw abierto al solicitar la ubicación en Android.
- Otras plataformas Node pueden diferir.

## Integración con modelos/herramientas

- Herramienta de agente: la acción `location_get` de la herramienta `nodes` (Node obligatorio).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices para agentes: llamar solo cuando el usuario haya habilitado la ubicación y entienda el alcance.

## Texto de UX (sugerido)

- Desactivado: "El uso compartido de ubicación está desactivado."
- Mientras se usa: "Solo cuando OpenClaw está abierto."
- Precisa: "Usar ubicación GPS precisa. Desactívalo para compartir ubicación aproximada."

## Relacionado

- [Información general de Nodes](/es/nodes)
- [Análisis de ubicación de canales](/es/channels/location)
- [Captura de cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
