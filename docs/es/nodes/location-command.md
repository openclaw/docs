---
read_when:
    - Añadir compatibilidad de ubicación de nodos o UI de permisos
    - Diseñar permisos de ubicación de Android o comportamiento en primer plano
summary: Comando de ubicación para nodos (`location.get`), modos de permiso y comportamiento en primer plano de Android
title: Comando de ubicación
x-i18n:
    generated_at: "2026-04-24T05:36:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## Resumen rápido

- `location.get` es un comando de nodo (mediante `node.invoke`).
- Está desactivado de forma predeterminada.
- La configuración de la app de Android usa un selector: Desactivado / Mientras se usa.
- Alternancia independiente: Ubicación precisa.

## Por qué un selector (y no solo un interruptor)

Los permisos del sistema operativo tienen varios niveles. Podemos exponer un selector en la app, pero el sistema operativo sigue decidiendo la concesión real.

- iOS/macOS puede exponer **Mientras se usa** o **Siempre** en las solicitudes del sistema o en Ajustes.
- La app de Android actualmente solo admite ubicación en primer plano.
- La ubicación precisa es un permiso independiente (iOS 14+ “Precisa”, Android “fine” frente a “coarse”).

El selector en la UI define el modo solicitado; la concesión real vive en la configuración del sistema operativo.

## Modelo de configuración

Por dispositivo de nodo:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamiento de la UI:

- Seleccionar `whileUsing` solicita permiso de ubicación en primer plano.
- Si el sistema operativo deniega el nivel solicitado, vuelve al nivel más alto concedido y muestra el estado.

## Asignación de permisos (`node.permissions`)

Opcional. El nodo de macOS informa de `location` mediante el mapa de permisos; iOS/Android pueden omitirlo.

## Comando: `location.get`

Se llama mediante `node.invoke`.

Parámetros (sugeridos):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: la app está en segundo plano, pero solo está permitido Mientras se usa.
- `LOCATION_TIMEOUT`: no se obtuvo una posición a tiempo.
- `LOCATION_UNAVAILABLE`: fallo del sistema / no hay proveedores.

## Comportamiento en segundo plano

- La app de Android deniega `location.get` cuando está en segundo plano.
- Mantén OpenClaw abierto cuando solicites ubicación en Android.
- Otras plataformas de nodos pueden comportarse de forma distinta.

## Integración con modelos/herramientas

- Superficie de herramientas: la herramienta `nodes` añade la acción `location_get` (requiere nodo).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices del agente: solo llamar cuando el usuario haya habilitado la ubicación y entienda el alcance.

## Texto de UX (sugerido)

- Desactivado: “El uso compartido de ubicación está desactivado.”
- Mientras se usa: “Solo cuando OpenClaw está abierto.”
- Precisa: “Usar ubicación GPS precisa. Desactívala para compartir una ubicación aproximada.”

## Relacionado

- [Análisis de ubicación de canales](/es/channels/location)
- [Captura de cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
