---
read_when:
    - Necesitas registros de depuración específicos sin aumentar los niveles de registro globales
    - Necesitas capturar registros específicos del subsistema para soporte
summary: Indicadores de diagnóstico para registros de depuración específicos
title: Indicadores de diagnóstico
x-i18n:
    generated_at: "2026-07-05T11:16:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Las marcas de diagnóstico activan registros adicionales para un subsistema sin elevar
`logging.level` globalmente. Una marca no tiene efecto a menos que un subsistema la compruebe.

## Cómo funciona

- Las marcas son cadenas que no distinguen mayúsculas de minúsculas, resueltas desde `diagnostics.flags` en
  la configuración más la anulación de env `OPENCLAW_DIAGNOSTICS`, deduplicadas y convertidas a minúsculas.
- `name.*` coincide con `name` y con cualquier cosa bajo `name.` (por ejemplo,
  `telegram.*` coincide con `telegram.http`).
- `*` o `all` habilita todas las marcas.
- Reinicia el Gateway después de cambiar `diagnostics.flags` en la configuración; no se
  recarga en caliente.

## Marcas conocidas

| Marca            | Habilita                                                  |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Registro de errores HTTP de Telegram Bot API              |
| `brave.http`     | Registro de solicitudes/respuestas/caché de Brave Search  |
| `profiler`       | Perfilador de etapa de respuesta y perfilador del servidor de aplicación de Codex (ambos) |
| `reply.profiler` | Solo el perfilador de etapa de respuesta                  |
| `codex.profiler` | Solo el perfilador del servidor de aplicación de Codex    |
| `timeline`       | Artefacto de línea de tiempo JSONL estructurado (ver abajo) |

## Habilitar mediante configuración

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Varias marcas:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Anulación por env (puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Los valores se dividen por comas o espacios en blanco. Valores especiales:

| Valor                       | Efecto                                  |
| --------------------------- | --------------------------------------- |
| `0`, `false`, `off`, `none` | Deshabilita todas las marcas, anulando también la configuración |
| `1`, `true`, `all`, `*`     | Habilita todas las marcas               |

`OPENCLAW_DIAGNOSTICS=0` deshabilita las marcas tanto de env como de la configuración para ese
proceso, útil para silenciar temporalmente una marca de perfilador que quedó activada en la configuración
sin editar el archivo.

## Marcas de perfilador

Las marcas de perfilador controlan tramos de temporización ligeros; no añaden sobrecarga cuando están desactivadas.

Habilita todos los tramos controlados por perfilador para una ejecución del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Habilita solo los tramos del perfilador de despacho de respuestas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Habilita solo los tramos del perfilador de inicio/herramienta/hilo del servidor de aplicación de Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` habilita tanto el perfilador de respuestas como el perfilador de Codex; usa los
nombres de marcas con ámbito para habilitar solo uno.

O configúralo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicia el Gateway después de cambiar las marcas de configuración. Para deshabilitar una marca de perfilador,
elimínala de `diagnostics.flags` y reinicia, o inicia el proceso con
`OPENCLAW_DIAGNOSTICS=0` para anular todas las marcas de diagnóstico en esa ejecución.

## Artefactos de línea de tiempo

La marca `timeline` (alias: `diagnostics.timeline`) escribe eventos estructurados de temporización de inicio
y ejecución como JSONL, para arneses de QA externos:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

O habilítala en la configuración:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

La ruta de salida siempre proviene de `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, incluso
cuando la marca se define en la configuración; no hay una clave de configuración para la ruta.
Cuando `timeline` se habilita solo desde la configuración, faltan los primeros tramos de carga de configuración
porque OpenClaw aún no ha leído la configuración; los tramos de inicio posteriores
se capturan normalmente.

`OPENCLAW_DIAGNOSTICS=1`, `=all` y `=*` también habilitan la línea de tiempo, ya que
habilitan todas las marcas. Prefiere la marca con ámbito `timeline` cuando solo quieres el
artefacto JSONL y no todas las demás marcas de diagnóstico.

Las muestras de retardo del bucle de eventos en la línea de tiempo necesitan una activación adicional además de
`timeline`: define `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (o `on`/`true`/`yes`) junto
con la habilitación de la línea de tiempo.

Los registros de línea de tiempo usan el contenedor `openclaw.diagnostics.v1` y pueden incluir
ids de proceso, nombres de fase, nombres de tramo, duraciones, ids de plugin, recuentos de dependencias,
muestras de retardo del bucle de eventos, nombres de operación del proveedor, estado de salida de procesos hijo
y nombres/mensajes de errores de inicio. Trata los archivos de línea de tiempo como artefactos locales
de diagnóstico; revísalos antes de compartirlos fuera de tu máquina.

## Dónde van los registros

Las marcas emiten registros en el archivo de registro de diagnóstico estándar. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si defines `logging.file`, usa esa ruta en su lugar. Los registros son JSONL (un objeto JSON
por línea). La redacción sigue aplicándose según `logging.redactSensitive`.
Consulta [Registro](/es/logging) para ver el modelo completo de resolución de rutas de registro, rotación y
redacción.

## Extraer registros

Elige el archivo de registro más reciente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtra diagnósticos HTTP de Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtra diagnósticos HTTP de Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

O sigue el registro mientras reproduces:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, usa `openclaw logs --follow` en su lugar (consulta
[/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` está por encima de `warn`, los registros controlados por marcas pueden quedar
  suprimidos. El valor predeterminado `info` está bien.
- `brave.http` registra URLs/parámetros de consulta de solicitudes de Brave Search, estado/tiempo
  de respuesta y eventos de acierto/fallo/escritura de caché. No registra la clave de API
  (enviada como encabezado de solicitud) ni los cuerpos de respuesta, pero las búsquedas pueden ser
  sensibles.
- Es seguro dejar las marcas habilitadas; solo afectan al volumen de registros del
  subsistema específico.
- Usa [/logging](/es/logging) para cambiar destinos, niveles y redacción de registros.

## Relacionado

- [Diagnósticos del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
