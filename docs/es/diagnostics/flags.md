---
read_when:
    - Necesitas registros de depuración específicos sin aumentar los niveles globales de registro
    - Necesitas recopilar registros específicos del subsistema para obtener soporte.
summary: Indicadores de diagnóstico para registros de depuración específicos
title: Indicadores de diagnóstico
x-i18n:
    generated_at: "2026-07-11T23:04:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Las opciones de diagnóstico activan registros adicionales para un subsistema sin aumentar globalmente `logging.level`. Una opción no tiene efecto a menos que un subsistema la compruebe.

## Cómo funciona

- Las opciones son cadenas que no distinguen entre mayúsculas y minúsculas, obtenidas de `diagnostics.flags` en la configuración junto con la anulación de la variable de entorno `OPENCLAW_DIAGNOSTICS`; se eliminan los duplicados y se convierten a minúsculas.
- `name.*` coincide con el propio `name` y con cualquier elemento bajo `name.` (por ejemplo, `telegram.*` coincide con `telegram.http`).
- `*` o `all` activa todas las opciones.
- Reinicie el Gateway después de cambiar `diagnostics.flags` en la configuración; no se recarga en caliente.

## Opciones conocidas

| Opción           | Activa                                                              |
| ---------------- | ------------------------------------------------------------------- |
| `telegram.http`  | Registro de errores HTTP de la API de bots de Telegram              |
| `brave.http`     | Registro de solicitudes, respuestas y caché de Brave Search         |
| `profiler`       | Perfilador de la fase de respuesta y de Codex app-server (ambos)    |
| `reply.profiler` | Solo el perfilador de la fase de respuesta                          |
| `codex.profiler` | Solo el perfilador de Codex app-server                              |
| `timeline`       | Artefacto de cronología JSONL estructurado (consulte más adelante)   |

## Activación mediante la configuración

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Varias opciones:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Anulación mediante variable de entorno (uso puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Los valores se separan por comas o espacios en blanco. Valores especiales:

| Valor                       | Efecto                                                     |
| --------------------------- | ---------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Desactiva todas las opciones y también anula la configuración |
| `1`, `true`, `all`, `*`     | Activa todas las opciones                                  |

`OPENCLAW_DIAGNOSTICS=0` desactiva las opciones tanto de la variable de entorno como de la configuración para ese proceso. Esto resulta útil para silenciar temporalmente una opción del perfilador que se haya dejado activada en la configuración sin editar el archivo.

## Opciones del perfilador

Las opciones del perfilador controlan intervalos ligeros de medición de tiempo; cuando están desactivadas, no añaden sobrecarga.

Active todos los intervalos controlados por el perfilador para una ejecución del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Active solo los intervalos del perfilador de distribución de respuestas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Active solo los intervalos del perfilador de inicio, herramientas e hilos de Codex app-server:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` activa tanto el perfilador de respuestas como el perfilador de Codex; utilice los nombres de opciones específicos para activar solo uno.

También puede configurarlo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicie el Gateway después de cambiar las opciones de configuración. Para desactivar una opción del perfilador, elimínela de `diagnostics.flags` y reinicie, o inicie el proceso con `OPENCLAW_DIAGNOSTICS=0` para anular todas las opciones de diagnóstico durante esa ejecución.

## Artefactos de cronología

La opción `timeline` (alias: `diagnostics.timeline`) escribe como JSONL eventos estructurados de medición de tiempo del inicio y de la ejecución para sistemas externos de control de calidad:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

También puede activarla en la configuración:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

La ruta de salida siempre procede de `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, incluso cuando la propia opción se establece en la configuración; no existe ninguna clave de configuración para la ruta. Cuando `timeline` se activa únicamente desde la configuración, no se incluyen los primeros intervalos de carga de la configuración porque OpenClaw aún no la ha leído; los intervalos posteriores del inicio se capturan con normalidad.

`OPENCLAW_DIAGNOSTICS=1`, `=all` y `=*` también activan la cronología, ya que activan todas las opciones. Utilice preferentemente la opción específica `timeline` cuando solo quiera el artefacto JSONL y no todas las demás opciones de diagnóstico.

Las muestras de retardo del bucle de eventos en la cronología requieren una activación adicional aparte de `timeline`: establezca `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (o `on`/`true`/`yes`) además de activar la cronología.

Los registros de la cronología utilizan el contenedor `openclaw.diagnostics.v1` y pueden incluir identificadores de procesos, nombres de fases, nombres de intervalos, duraciones, identificadores de plugins, recuentos de dependencias, muestras de retardo del bucle de eventos, nombres de operaciones de proveedores, estado de salida de procesos secundarios y nombres o mensajes de errores de inicio. Trate los archivos de cronología como artefactos locales de diagnóstico; revíselos antes de compartirlos fuera de su equipo.

## Dónde se guardan los registros

Las opciones envían registros al archivo estándar de registro de diagnóstico. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si establece `logging.file`, se utiliza esa ruta. Los registros tienen formato JSONL (un objeto JSON por línea). La censura continúa aplicándose según `logging.redactSensitive`. Consulte [Registro](/es/logging) para conocer el modelo completo de resolución de rutas de registro, rotación y censura.

## Extracción de registros

Seleccione el archivo de registro más reciente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtre los diagnósticos HTTP de Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtre los diagnósticos HTTP de Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

O supervise el archivo mientras reproduce el problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, utilice `openclaw logs --follow` en su lugar (consulte [/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` se establece en un nivel superior a `warn`, es posible que se supriman los registros controlados por opciones. El valor predeterminado `info` es adecuado.
- `brave.http` registra las URL y los parámetros de consulta de las solicitudes de Brave Search, el estado y el tiempo de las respuestas, y los eventos de acierto, fallo y escritura de la caché. No registra la clave de la API (enviada como cabecera de la solicitud) ni los cuerpos de las respuestas, pero las consultas de búsqueda pueden contener información sensible.
- Es seguro dejar activadas las opciones; solo afectan al volumen de registros del subsistema específico.
- Utilice [/logging](/es/logging) para cambiar los destinos, los niveles y la censura de los registros.

## Contenido relacionado

- [Diagnósticos del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
