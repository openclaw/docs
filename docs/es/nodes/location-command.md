---
read_when:
    - Añadir compatibilidad con nodos de ubicación o interfaz de permisos
    - Diseño de permisos de ubicación de Android o del comportamiento en primer plano
summary: Comando de ubicación para nodos (location.get), modos de permiso y comportamiento en primer plano de Android
title: Comando de ubicación
x-i18n:
    generated_at: "2026-05-06T05:41:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Resumen rápido

- `location.get` es un comando de nodo (mediante `node.invoke`).
- Desactivado de forma predeterminada.
- La configuración de la app de Android usa un selector: Desactivado / Mientras se usa.
- Interruptor independiente: Ubicación precisa.

## Por qué un selector (y no solo un interruptor)

Los permisos del sistema operativo tienen varios niveles. Podemos exponer un selector dentro de la app, pero el sistema operativo sigue decidiendo la concesión real.

- iOS/macOS pueden exponer **Mientras se usa** o **Siempre** en los avisos/configuración del sistema.
- Actualmente, la app de Android solo admite ubicación en primer plano.
- La ubicación precisa es una concesión independiente (iOS 14+ "Precisa", Android "fine" frente a "coarse").

El selector en la IU controla el modo que solicitamos; la concesión real vive en la configuración del sistema operativo.

## Modelo de configuración

Por dispositivo de nodo:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamiento de la IU:

- Seleccionar `whileUsing` solicita permiso en primer plano.
- Si el sistema operativo deniega el nivel solicitado, vuelve al nivel concedido más alto y muestra el estado.

## Asignación de permisos (node.permissions)

Opcional. El nodo de macOS informa `location` mediante el mapa de permisos; iOS/Android pueden omitirlo.

## Comando: `location.get`

Llamado mediante `node.invoke`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: la app está en segundo plano, pero solo se permite Mientras se usa.
- `LOCATION_TIMEOUT`: no se obtuvo una posición a tiempo.
- `LOCATION_UNAVAILABLE`: fallo del sistema / sin proveedores.

## Comportamiento en segundo plano

- La app de Android deniega `location.get` mientras está en segundo plano.
- Mantén OpenClaw abierto al solicitar la ubicación en Android.
- Otras plataformas de nodo pueden diferir.

## Integración con modelo/herramientas

- Superficie de herramienta: la herramienta `nodes` añade la acción `location_get` (se requiere nodo).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices para agentes: llamar solo cuando el usuario haya activado la ubicación y entienda el alcance.

## Texto de UX (sugerido)

- Desactivado: "El uso compartido de ubicación está desactivado."
- Mientras se usa: "Solo cuando OpenClaw está abierto."
- Precisa: "Usa la ubicación GPS precisa. Desactívalo para compartir una ubicación aproximada."

## Relacionado

- [Análisis de ubicación de canales](/es/channels/location)
- [Captura de cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
