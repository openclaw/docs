---
read_when:
    - Necesita registros de depuración específicos sin aumentar los niveles globales de registro
    - Necesita recopilar registros específicos del subsistema para obtener asistencia
summary: Indicadores de diagnóstico para registros de depuración específicos
title: Indicadores de diagnóstico
x-i18n:
    generated_at: "2026-07-19T01:56:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a54692af361edcdc82863fb9c742a9dde21ed242f38e4253b6e27edb6a74f21
    source_path: diagnostics/flags.md
    workflow: 16
---

Los indicadores de diagnóstico activan registros adicionales para un subsistema sin elevar
`logging.level` globalmente. Un indicador no tiene efecto a menos que un subsistema lo compruebe.

## Cómo funciona

- Los indicadores son cadenas que no distinguen entre mayúsculas y minúsculas, resueltas a partir de `diagnostics.flags` en
  la configuración más la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS`, sin duplicados y convertidas a minúsculas.
- `name.*` coincide con el propio `name` y con cualquier elemento bajo `name.` (por ejemplo,
  `telegram.*` coincide con `telegram.http`).
- `*` o `all` activa todos los indicadores.
- Reinicie el Gateway después de cambiar `diagnostics.flags` en la configuración; no se
  recarga en caliente.

## Indicadores conocidos

| Indicador             | Activa                                                     |
| --------------------- | ---------------------------------------------------------- |
| `telegram.http`       | Registro de errores HTTP de la API de bots de Telegram     |
| `brave.http`          | Registro de solicitudes, respuestas y caché de Brave Search |
| `profiler`            | Perfilador de la etapa de respuesta y del servidor de aplicaciones de Codex (ambos) |
| `reply.profiler`      | Solo el perfilador de la etapa de respuesta                |
| `codex.profiler`      | Solo el perfilador del servidor de aplicaciones de Codex   |
| `health`              | Detalles de depuración de sondeos de estado, cuentas y vinculaciones del Gateway |
| `ingress.timing`      | Tiempos de carga de sesiones, selección de modelos y catálogo de modelos |
| `plugin.load-profile` | Tiempos de carga síncrona de módulos de plugins             |
| `timeline`            | Artefacto de cronología JSONL estructurada (véase más adelante) |

## Activar mediante la configuración

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Varios indicadores:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Sobrescritura mediante variable de entorno (ocasional)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Los valores se separan por comas o espacios en blanco. Valores especiales:

| Valor                       | Efecto                                             |
| --------------------------- | -------------------------------------------------- |
| `0`, `false`, `off`, `none` | Desactiva todos los indicadores y sobrescribe también la configuración |
| `1`, `true`, `all`, `*`     | Activa todos los indicadores                      |

`OPENCLAW_DIAGNOSTICS=0` desactiva los indicadores tanto del entorno como de la configuración para ese
proceso, lo que resulta útil para silenciar temporalmente un indicador de perfilador que quedó activo en la configuración
sin editar el archivo.

## Indicadores del perfilador

Los indicadores del perfilador controlan intervalos de medición ligeros; no añaden sobrecarga cuando están desactivados.

Active todos los intervalos controlados por el perfilador durante una ejecución del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Active solo los intervalos del perfilador de distribución de respuestas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Active solo los intervalos del perfilador de inicio, herramientas e hilos del servidor de aplicaciones de Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` activa tanto el perfilador de respuestas como el perfilador de Codex; utilice los
nombres de indicadores específicos para activar solo uno.

También puede establecerlo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicie el Gateway después de cambiar los indicadores de configuración. Para desactivar un indicador del perfilador,
elimínelo de `diagnostics.flags` y reinicie, o inicie el proceso con
`OPENCLAW_DIAGNOSTICS=0` para sobrescribir todos los indicadores de diagnóstico durante esa ejecución.

## Artefactos de cronología

El indicador `timeline` (alias: `diagnostics.timeline`) escribe eventos estructurados de tiempos de inicio
y ejecución como JSONL para entornos externos de QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

También puede activarlo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

La ruta de salida siempre procede de `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, incluso
cuando el propio indicador se establece en la configuración; no existe ninguna clave de configuración para la ruta.
Cuando `timeline` se activa únicamente desde la configuración, faltan los primeros intervalos de carga de la configuración
porque OpenClaw aún no la ha leído; los intervalos de inicio posteriores
se capturan con normalidad.

`OPENCLAW_DIAGNOSTICS=1`, `=all` y `=*` también activan la cronología, ya que
activan todos los indicadores. Utilice preferentemente el indicador específico `timeline` cuando solo desee el
artefacto JSONL y no todos los demás indicadores de diagnóstico.

Las muestras de retardo del bucle de eventos en la cronología requieren una activación adicional además de
`timeline`: establezca `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (o `on`/`true`/`yes`) además
de activar la cronología.

Los registros de la cronología utilizan el contenedor `openclaw.diagnostics.v1` y pueden incluir
identificadores de procesos, nombres de fases, nombres de intervalos, duraciones, identificadores de plugins, recuentos de
dependencias, muestras de retardo del bucle de eventos, nombres de operaciones de proveedores, estado de salida de
procesos secundarios y nombres o mensajes de errores de inicio. Trate los archivos de cronología como artefactos
de diagnóstico locales; revíselos antes de compartirlos fuera de su equipo.

## Dónde se guardan los registros

Los indicadores emiten registros en el archivo de registro de diagnóstico estándar. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si establece `logging.file`, utilice esa ruta en su lugar. Los registros están en formato JSONL (un objeto JSON
por línea). La ocultación sigue aplicándose según `logging.redactSensitive`.
Consulte [Registro](/es/logging) para conocer el modelo completo de resolución de rutas de registro, rotación y
ocultación.

## Extraer registros

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

O siga el registro mientras reproduce el problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, utilice `openclaw logs --follow` en su lugar (consulte
[/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` se establece por encima de `warn`, es posible que se
  omitan los registros controlados por indicadores. El valor predeterminado `info` es adecuado.
- `brave.http` registra las URL y los parámetros de consulta de las solicitudes de Brave Search, el
  estado y los tiempos de respuesta, y los eventos de acierto, fallo y escritura de la caché. No registra la clave de API
  (enviada como encabezado de solicitud) ni los cuerpos de las respuestas, pero las consultas de búsqueda pueden ser
  confidenciales.
- Es seguro dejar los indicadores activados; solo afectan al volumen de registros del
  subsistema específico.
- Utilice [/logging](/es/logging) para cambiar los destinos, niveles y la ocultación de los registros.

## Contenido relacionado

- [Diagnóstico del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
