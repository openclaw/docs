---
read_when:
    - Añadir compatibilidad con nodos de ubicación o una interfaz de permisos
    - Diseño de permisos de ubicación o comportamiento en primer plano en Android
summary: Comando de ubicación para Node, modos de permisos de la plataforma y configuración de GeoClue en Linux
title: Comando de ubicación
x-i18n:
    generated_at: "2026-07-14T13:52:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## Resumen

- `location.get` es un comando de Node, invocado mediante `node.invoke` o `openclaw nodes location get`.
- Desactivado de forma predeterminada.
- Las compilaciones de terceros para Android usan un selector: Desactivado / Mientras se usa / Siempre. Las compilaciones de Play mantienen Desactivado / Mientras se usa.
- La ubicación precisa es un control independiente.

## Por qué un selector (y no solo un interruptor)

Los permisos de ubicación del sistema operativo tienen varios niveles. La ubicación precisa también es una autorización independiente del sistema operativo («Precise» en iOS 14+, «fine» frente a «coarse» en Android). El selector de la aplicación determina el modo solicitado, pero el sistema operativo sigue decidiendo la autorización real.

## Modelo de configuración

Por dispositivo Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamiento de la interfaz:

- Seleccionar `whileUsing` solicita permiso en primer plano.
- Seleccionar `always` en la compilación de terceros para Android primero solicita permiso en primer plano, explica el acceso en segundo plano y, después, abre la configuración de la aplicación de Android para conceder por separado **Allow all the time**.
- Las compilaciones de Android para Play no declaran el permiso de ubicación en segundo plano ni muestran `always`.
- Si el sistema operativo deniega el nivel solicitado, la aplicación vuelve al nivel autorizado más alto y muestra el estado.

## Correspondencia de permisos (node.permissions)

Opcional. El Node de macOS informa de `location` mediante el mapa `permissions` en `node.list`/`node.describe`; iOS y Android pueden omitirlo.

## Comando: `location.get`

Se llama mediante `node.invoke` o con el auxiliar de la CLI:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: la aplicación está en segundo plano, pero solo se ha autorizado Mientras se usa.
- `LOCATION_TIMEOUT`: no se obtuvo una posición a tiempo.
- `LOCATION_UNAVAILABLE`: fallo del sistema o ausencia de proveedores.

## Comportamiento en segundo plano

- Las compilaciones de terceros para Android aceptan `location.get` en segundo plano solo cuando el usuario ha seleccionado `Always` y Android ha autorizado la ubicación en segundo plano. El servicio persistente de Node existente añade el tipo de servicio `location` y muestra `Location: Always` mientras está activo.
- Las compilaciones de Android para Play y el modo `While Using` deniegan `location.get` mientras la aplicación está en segundo plano.
- Otras plataformas de Node pueden comportarse de forma diferente.

## Host de Node para Linux

El Plugin de Node para Linux incluido añade `location.get` al servicio `openclaw node` de la CLI, incluidos los hosts sin interfaz gráfica que no tienen la aplicación de escritorio para Linux. La ubicación está desactivada de forma predeterminada. Actívela en la entrada del Plugin y, después, reinicie el servicio de Node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Instale GeoClue2 y su demostración `where-am-i` (`geoclue-2-demo` en Debian y Ubuntu). La política de GeoClue y el agente de autorización del host deben permitir el acceso al usuario del servicio de Node.

El Plugin usa `where-am-i` en lugar de una secuencia de llamadas a `busctl`. GeoClue vincula la creación del cliente, las propiedades, el inicio, las actualizaciones y la detención a una única conexión de cliente D-Bus; la demostración mantiene unido ese ciclo de vida, mientras que los subprocesos independientes de `busctl` no lo hacen. No se añade ninguna dependencia de npm.

Linux asigna `coarse`, `balanced` y `precise` a los niveles de precisión de GeoClue `4`, `6` y `8`. Valida `maxAgeMs` con la marca de tiempo devuelta. La demostración de GeoClue no expone el proveedor seleccionado, por lo que `source` es `unknown`; `isPrecise` es verdadero solo cuando la precisión indicada es de 100 metros o mejor.

Linux usa los mismos errores estables: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` y `LOCATION_UNAVAILABLE`.

## Integración con modelos y herramientas

- Herramienta del agente: la acción `location_get` de la herramienta `nodes` (requiere un Node).
- CLI: `openclaw nodes location get --node <id>`.
- Directrices para el agente: llamar solo cuando el usuario haya habilitado la ubicación y comprenda su alcance.

## Texto de la experiencia de usuario (sugerido)

- Desactivado: «El uso compartido de la ubicación está deshabilitado».
- Mientras se usa: «Solo cuando OpenClaw está abierto».
- Siempre: «Permite las comprobaciones de ubicación solicitadas mientras OpenClaw está en segundo plano».
- Precisa: «Usa la ubicación GPS precisa. Desactive esta opción para compartir una ubicación aproximada».

## Temas relacionados

- [Descripción general de los Nodes](/es/nodes)
- [Análisis de la ubicación del canal](/es/channels/location)
- [Captura con la cámara](/es/nodes/camera)
- [Modo de conversación](/es/nodes/talk)
