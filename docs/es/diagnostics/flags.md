---
read_when:
    - Necesitas registros de depuración específicos sin elevar los niveles de registro globales
    - Necesitas capturar registros específicos del subsistema para soporte
summary: Indicadores de diagnóstico para registros de depuración específicos
title: Indicadores de diagnóstico
x-i18n:
    generated_at: "2026-06-27T11:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Los indicadores de diagnóstico te permiten habilitar registros de depuración específicos sin activar el registro detallado en todas partes. Los indicadores son opcionales y no tienen efecto salvo que un subsistema los compruebe.

## Cómo funciona

- Los indicadores son cadenas (sin distinción entre mayúsculas y minúsculas).
- Puedes habilitar indicadores en la configuración o mediante una sobrescritura de variable de entorno.
- Se admiten comodines:
  - `telegram.*` coincide con `telegram.http`
  - `*` habilita todos los indicadores

## Habilitar mediante configuración

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

Reinicia el Gateway después de cambiar los indicadores.

## Sobrescritura de entorno (puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Deshabilitar todos los indicadores:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` es una sobrescritura de deshabilitación a nivel de proceso: deshabilita
los indicadores tanto del entorno como de la configuración para ese proceso.

## Indicadores de perfilado

Los indicadores del perfilador habilitan intervalos de medición específicos sin elevar los niveles
globales de registro. Están deshabilitados de forma predeterminada.

Habilitar todos los intervalos controlados por el perfilador para una ejecución del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Habilitar solo los intervalos del perfilador de despacho de respuestas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Habilitar solo los intervalos del perfilador de inicio/herramienta/hilo del servidor de la aplicación Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Habilitar indicadores del perfilador desde la configuración:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicia el Gateway después de cambiar los indicadores de configuración. Para deshabilitar un indicador del perfilador,
elimínalo de `diagnostics.flags` y reinicia. Para deshabilitar temporalmente todos los
indicadores de diagnóstico incluso cuando la configuración habilita indicadores del perfilador, inicia el proceso con:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefactos de línea de tiempo

El indicador `timeline` escribe eventos estructurados de temporización de inicio y tiempo de ejecución para
arneses de QA externos:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

También puedes habilitarlo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

La ruta del archivo de línea de tiempo sigue viniendo de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Cuando `timeline` se habilita solo desde la
configuración, los primeros intervalos de carga de configuración no se emiten porque OpenClaw
aún no ha leído la configuración; los intervalos de inicio posteriores usan el indicador de configuración.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` y
`OPENCLAW_DIAGNOSTICS=*` también habilitan la línea de tiempo porque habilitan todos los
indicadores de diagnóstico. Prefiere `timeline` cuando solo quieres el artefacto de temporización
JSONL.

Los registros de línea de tiempo usan el sobre `openclaw.diagnostics.v1`. Los eventos pueden incluir
identificadores de proceso, nombres de fase, nombres de intervalo, duraciones, identificadores de Plugin, recuentos de dependencias,
muestras de retraso del bucle de eventos, nombres de operaciones del proveedor, estado de salida de procesos secundarios
y nombres/mensajes de errores de inicio. Trata los archivos de línea de tiempo como
artefactos de diagnóstico locales; revísalos antes de compartirlos fuera de tu máquina.

## Dónde van los registros

Los indicadores emiten registros en el archivo estándar de registros de diagnóstico. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si estableces `logging.file`, usa esa ruta en su lugar. Los registros son JSONL (un objeto JSON por línea). La censura sigue aplicándose según `logging.redactSensitive`.

## Extraer registros

Elige el archivo de registro más reciente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrar diagnósticos HTTP de Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtrar diagnósticos HTTP de Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

O seguir el registro mientras reproduces:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, también puedes usar `openclaw logs --follow` (consulta [/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` está establecido por encima de `warn`, estos registros pueden suprimirse. El valor predeterminado `info` es adecuado.
- `brave.http` registra las URL/parámetros de consulta de solicitudes de Brave Search, el estado/tiempo de respuesta y los eventos de acierto/fallo/escritura en caché. No registra claves de API ni cuerpos de respuesta, pero las consultas de búsqueda pueden ser sensibles.
- Es seguro dejar los indicadores habilitados; solo afectan el volumen de registro del subsistema específico.
- Usa [/logging](/es/logging) para cambiar los destinos, niveles y censura de registros.

## Relacionado

- [Diagnósticos del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
