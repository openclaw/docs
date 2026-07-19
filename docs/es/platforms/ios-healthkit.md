---
read_when:
    - Activación de los resúmenes de HealthKit en un nodo de iOS
    - Invocación de health.summary o solución de problemas de métricas de estado ausentes
    - Revisión de qué datos de salud pueden salir de un dispositivo iOS
summary: Habilitar e invocar resúmenes de HealthKit sujetos a controles de privacidad desde un Node de iOS
title: Resúmenes de HealthKit
x-i18n:
    generated_at: "2026-07-19T02:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 58c7d0cefcf55f653d19d796a70c2a27d299cf2c14c0cb5cf5e182ce080fdcb5
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Resúmenes de HealthKit

OpenClaw puede solicitar a un nodo iPhone o iPad conectado un resumen de solo lectura del día natural actual. El dispositivo calcula el agregado en el propio dispositivo y devuelve únicamente los pasos, la duración del sueño, la frecuencia cardíaca media en reposo y el número y la duración de los entrenamientos. No se admiten muestras individuales de HealthKit, fuentes, metadatos, historiales clínicos, ingesta en segundo plano ni operaciones de escritura.

Esta función está desactivada de forma predeterminada. Requiere un consentimiento independiente en el dispositivo iOS y autorización en el Gateway.

## Requisitos

- Un iPhone o iPad que ejecute la aplicación OpenClaw para iOS y en el que HealthKit indique que hay datos de salud disponibles.
- Un nodo iOS conectado y aprobado. Consulte [Configuración de la aplicación para iOS](/es/platforms/ios).
- Un Gateway actualizado que pueda acceder al nodo iOS.
- Datos de Salud legibles para todas las métricas que se espere consultar. Un Apple Watch puede aportar datos al almacén de Apple Health, pero la aplicación OpenClaw para watchOS no es necesaria para los resúmenes de HealthKit.

## Habilitar el acceso

### 1. Autorizar el comando del Gateway

Añada `health.summary` al array `gateway.nodes.allowCommands` existente en `openclaw.json`. Conserve todos los comandos que ya estén presentes:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` se clasifica como altamente sensible en términos de privacidad y nunca está permitido de forma predeterminada por la plataforma iOS. Una entrada en `gateway.nodes.denyCommands` prevalece sobre la entrada de permiso. Consulte [Política de comandos de Node](/es/nodes#command-policy).

### 2. Habilitar el uso compartido en el dispositivo iOS

En la aplicación para iOS:

1. Abra **Settings -> Permissions** y busque **Apple Health Summaries** en la sección **Apple Health**, que siempre está visible.
2. Pulse **Enable Apple Health Summaries**.
3. Lea la información y, a continuación, elija las categorías de Salud que OpenClaw puede leer en la hoja de permisos de Apple.

El interruptor registra la elección explícita de compartir datos con OpenClaw. No afirma que Apple haya concedido acceso a todas las categorías solicitadas.

Al habilitar los resúmenes de Salud, se añade `health.summary` a la superficie de comandos declarada del nodo. Apruebe la actualización resultante del emparejamiento del nodo:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

A continuación, verifique que el dispositivo iOS conectado exponga un comando `health.summary` efectivo:

```bash
openclaw nodes describe --node "<iOS device name>"
```

## Solicitar el resumen de hoy

Solo se admite `today`. Abarca desde la medianoche local hasta el momento de la solicitud y utiliza el calendario y la zona horaria actuales del dispositivo iOS.

```bash
openclaw nodes invoke \
  --node "<iOS device name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Los agentes pueden invocar el mismo comando con la herramienta `nodes`:

```json
{
  "action": "invoke",
  "node": "<iOS device name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

La carga útil del resumen contiene:

| Campo                    | Significado                                           |
| ------------------------ | ----------------------------------------------------- |
| `period`                 | Siempre `today`                                      |
| `startISO`               | Inicio local del día, codificado como instante ISO    |
| `endISO`                 | Hora de la solicitud, codificada como instante ISO    |
| `timeZoneIdentifier`     | Identificador de zona horaria del dispositivo iOS     |
| `stepCount`              | Pasos acumulados redondeados                           |
| `sleepDurationMinutes`   | Tiempo de sueño sin duplicados, limitado al día de hoy |
| `restingHeartRateBpm`    | Frecuencia cardíaca media en reposo                    |
| `workoutCount`           | Entrenamientos que comenzaron hoy                     |
| `workoutDurationMinutes` | Duración total de esos entrenamientos                  |

Los campos de métricas son opcionales y se omiten cuando HealthKit no devuelve ningún valor legible. Las fases del sueño y las fuentes superpuestas se combinan antes de calcular la duración, por lo que un mismo minuto no se contabiliza dos veces.

## Comportamiento relativo a la privacidad

- La agregación se realiza en el dispositivo iOS. Las muestras sin procesar no salen del dispositivo.
- El agregado solicitado sale del dispositivo a través del Gateway. Cuando lo solicita un agente, el agregado llega al proveedor de IA configurado y puede permanecer en el historial del chat. Una invocación directa desde la CLI lo devuelve al operador de la CLI.
- OpenClaw solo solicita acceso de lectura. No puede añadir ni modificar datos de Salud.
- OpenClaw solo lee HealthKit cuando se invoca `health.summary`. No hay ingesta de datos de salud en segundo plano.
- HealthKit no revela deliberadamente si se ha denegado el acceso de lectura. La ausencia de una métrica puede significar que se ha denegado el acceso, que no hay muestras coincidentes o que el tipo de datos no está disponible. OpenClaw no puede distinguir esos casos.
- El resumen sirve como contexto personal de salud y actividad física, no como diagnóstico ni asesoramiento médico.

Para dejar de compartir datos, vuelva a **Apple Health Summaries** y pulse **Turn Off Summaries**. El dispositivo iOS eliminará la funcionalidad de Salud y el comando `health.summary` de la superficie de su nodo. También se puede eliminar `health.summary` de `gateway.nodes.allowCommands` para cerrar el acceso desde el Gateway.

## Solución de problemas

### El nodo no declara el comando

Confirme que los resúmenes de Apple Health estén habilitados en la aplicación para iOS y que el dispositivo esté conectado. Ejecute `openclaw nodes pending`, apruebe cualquier actualización de funcionalidades y vuelva a inspeccionar `openclaw nodes describe --node "<iOS device name>"`.

### El comando requiere habilitación explícita

Añada `health.summary` a `gateway.nodes.allowCommands`. Compruebe también que `gateway.nodes.denyCommands` no lo contenga; la lista de denegación tiene prioridad.

### `HEALTH_ACCESS_DISABLED`

El interruptor para compartir datos de la aplicación está desactivado. Habilite **Apple Health Summaries** en **Settings -> Permissions -> Apple Health** en el dispositivo iOS.

### El resumen se genera correctamente, pero faltan métricas

Abra la aplicación Salud de Apple y confirme que haya datos de hoy. Revise el acceso de OpenClaw en los ajustes de Salud de Apple, pero no interprete un resultado vacío como prueba de que se ha denegado el acceso: HealthKit oculta deliberadamente esa distinción.

### Se produce un error con intervalos anteriores

El comando solo acepta `{"period":"today"}`. No se admiten resúmenes históricos ni de varios días.

## Contenido relacionado

- [Aplicación para iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway)
- [Auditoría de seguridad](/es/gateway/security)
