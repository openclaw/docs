---
read_when:
    - Activación de resúmenes de HealthKit en un nodo iPhone
    - Invocación de health.summary o solución de problemas por la ausencia de métricas de estado
    - Revisión de qué datos de salud pueden salir de un iPhone
summary: Habilitar e invocar resúmenes de HealthKit sujetos a controles de privacidad desde un nodo de iPhone
title: Resúmenes de HealthKit
x-i18n:
    generated_at: "2026-07-14T13:49:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Resúmenes de HealthKit

OpenClaw puede solicitar un resumen de solo lectura del día natural actual a un
nodo iPhone conectado. El iPhone calcula la información agregada en el dispositivo y devuelve
únicamente los pasos, la duración del sueño, la frecuencia cardíaca media en reposo y el
número y la duración de los entrenamientos. No se admiten muestras individuales de HealthKit,
fuentes, metadatos, registros clínicos, ingestión en segundo plano ni escrituras.

Esta función está desactivada de forma predeterminada. Requiere un consentimiento independiente en el iPhone y
autorización en el Gateway.

## Requisitos

- Un iPhone que ejecute la aplicación iOS de OpenClaw y en el que HealthKit indique que los datos de salud están
  disponibles.
- Un nodo iPhone conectado y aprobado. Consulte [Configuración de la aplicación iOS](/es/platforms/ios).
- Un Gateway actualizado que pueda comunicarse con el nodo iPhone.
- Datos de Salud legibles para las métricas que se espera consultar. Un Apple Watch puede
  aportar datos al almacén de Salud del iPhone, pero la aplicación watchOS de OpenClaw
  no es necesaria para los resúmenes de HealthKit.

## Habilitar el acceso

### 1. Autorizar el comando del Gateway

Añada `health.summary` al array `gateway.nodes.allowCommands` existente en
`openclaw.json`. Conserve los comandos que ya estén presentes:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` está clasificado como altamente sensible en materia de privacidad y nunca se permite de forma
predeterminada en la plataforma iOS. Una entrada en `gateway.nodes.denyCommands` prevalece sobre la
entrada de autorización. Consulte [Política de comandos de Node](/es/nodes#command-policy).

### 2. Habilitar el uso compartido en el iPhone

En la aplicación iOS:

1. Abra **Ajustes -> Permisos -> Privacidad y acceso -> Resúmenes de salud**.
2. Pulse **Habilitar y compartir resúmenes**.
3. Lea el aviso y elija las categorías de Salud que OpenClaw puede leer
   en la hoja de permisos de Apple.

El interruptor registra la elección explícita de compartir datos con OpenClaw. No afirma
que Apple haya concedido acceso a todas las categorías solicitadas.

Al habilitar los resúmenes de Salud, se añade `health.summary` a la superficie de comandos declarada
del nodo. Apruebe la actualización resultante del emparejamiento del nodo:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

A continuación, compruebe que el iPhone conectado exponga un comando `health.summary`
efectivo:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Solicitar el resumen de hoy

Solo se admite `today`. Abarca desde la medianoche local hasta el momento de la solicitud,
según el calendario y la zona horaria actuales del iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Los agentes pueden ejecutar el mismo comando con la herramienta `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

La carga útil del resumen contiene:

| Campo                    | Significado                                       |
| ------------------------ | --------------------------------------------- |
| `period`                 | Siempre `today`                                |
| `startISO`               | Inicio local del día, codificado como instante ISO |
| `endISO`                 | Hora de la solicitud, codificada como instante ISO       |
| `timeZoneIdentifier`     | Identificador de zona horaria del iPhone                   |
| `stepCount`              | Pasos acumulados redondeados                      |
| `sleepDurationMinutes`   | Tiempo de sueño sin duplicados, limitado al día actual    |
| `restingHeartRateBpm`    | Frecuencia cardíaca media en reposo                    |
| `workoutCount`           | Entrenamientos iniciados hoy                   |
| `workoutDurationMinutes` | Duración total de esos entrenamientos              |

Los campos de métricas son opcionales y se omiten cuando HealthKit no devuelve ningún
valor legible. Las fases del sueño y las fuentes superpuestas se combinan antes de
calcular la duración, por lo que un mismo minuto no se contabiliza dos veces.

## Comportamiento de privacidad

- La agregación se realiza en el iPhone. Las muestras sin procesar no salen del dispositivo.
- La información agregada solicitada sale del iPhone a través del Gateway. Cuando un agente
  la solicita, dicha información llega al proveedor de IA configurado y puede permanecer
  en el historial del chat. Una invocación directa desde la CLI la devuelve al operador de la CLI.
- OpenClaw solicita únicamente acceso de lectura. No puede añadir ni modificar datos de Salud.
- OpenClaw solo lee HealthKit cuando se invoca `health.summary`. No hay
  ingestión de datos de salud en segundo plano.
- HealthKit no revela deliberadamente si se ha denegado el acceso de lectura. Una
  métrica ausente puede indicar acceso denegado, que no existen muestras coincidentes o que el
  tipo de dato no está disponible. OpenClaw no puede distinguir entre estos casos.
- El resumen proporciona contexto personal sobre salud y actividad física, no diagnósticos ni
  asesoramiento médico.

Para dejar de compartir datos, vuelva a **Resúmenes de salud** y pulse **Deshabilitar**. El iPhone
eliminará entonces la capacidad de Salud y el comando `health.summary` de su superficie de
nodo. También se puede eliminar `health.summary` de
`gateway.nodes.allowCommands` para cerrar el control de acceso en el lado del Gateway.

## Solución de problemas

### El nodo no declara el comando

Confirme que los resúmenes de Salud estén habilitados en la aplicación iOS y que el iPhone esté conectado.
Ejecute `openclaw nodes pending`, apruebe cualquier actualización de capacidades y vuelva a inspeccionar
`openclaw nodes describe --node "<iPhone name>"`.

### El comando requiere habilitación explícita

Añada `health.summary` a `gateway.nodes.allowCommands`. Compruebe también que
`gateway.nodes.denyCommands` no lo contenga; la lista de denegación tiene prioridad.

### `HEALTH_ACCESS_DISABLED`

El interruptor para compartir datos de la aplicación está desactivado. Habilite **Resúmenes de salud** en
**Privacidad y acceso** en el iPhone.

### El resumen se obtiene correctamente, pero faltan métricas

Abra la aplicación Salud de Apple y confirme que existan datos del día actual. Revise
el acceso de OpenClaw en los ajustes de Salud de Apple, pero no interprete un resultado vacío
como prueba de que se denegó el acceso: HealthKit oculta deliberadamente esa distinción.

### Los intervalos anteriores fallan

El comando solo acepta `{"period":"today"}`. No se admiten resúmenes
de varios días ni históricos.

## Contenido relacionado

- [Aplicación iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway)
- [Auditoría de seguridad](/es/gateway/security)
