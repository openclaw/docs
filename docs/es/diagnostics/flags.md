---
read_when:
    - Necesitas registros de depuración específicos sin elevar los niveles globales de registro
    - Debe capturar registros específicos del subsistema para soporte
summary: Opciones de diagnóstico para registros de depuración específicos
title: Opciones de diagnóstico
x-i18n:
    generated_at: "2026-04-30T05:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Los flags de diagnóstico te permiten activar registros de depuración dirigidos sin habilitar el registro detallado en todas partes. Los flags son opcionales y no tienen efecto a menos que un subsistema los compruebe.

## Cómo funciona

- Los flags son cadenas (sin distinción entre mayúsculas y minúsculas).
- Puedes activar flags en la configuración o mediante una anulación por variable de entorno.
- Se admiten comodines:
  - `telegram.*` coincide con `telegram.http`
  - `*` activa todos los flags

## Activar mediante configuración

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Varios flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Reinicia el Gateway después de cambiar los flags.

## Anulación por variable de entorno (puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desactivar todos los flags:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefactos de timeline

El flag `timeline` escribe eventos estructurados de temporización de inicio y ejecución para
arneses de QA externos:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

También puedes activarlo en la configuración:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

La ruta del archivo de timeline sigue viniendo de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Cuando `timeline` se activa solo desde la
configuración, los primeros intervalos de carga de configuración no se emiten porque OpenClaw aún
no ha leído la configuración; los intervalos de inicio posteriores usan el flag de configuración.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` y
`OPENCLAW_DIAGNOSTICS=*` también activan timeline porque activan todos los
flags de diagnóstico. Prefiere `timeline` cuando solo quieras el artefacto de temporización
JSONL.

Los registros de timeline usan el envoltorio `openclaw.diagnostics.v1`. Los eventos pueden incluir
ID de proceso, nombres de fase, nombres de intervalo, duraciones, ID de Plugin, recuentos de dependencias,
muestras de retraso del bucle de eventos, nombres de operaciones de proveedor, estado de salida de procesos secundarios
y nombres/mensajes de errores de inicio. Trata los archivos de timeline como artefactos de diagnóstico
locales; revísalos antes de compartirlos fuera de tu máquina.

## Dónde van los registros

Los flags emiten registros en el archivo estándar de registros de diagnóstico. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si estableces `logging.file`, usa esa ruta en su lugar. Los registros son JSONL (un objeto JSON por línea). La redacción sigue aplicándose según `logging.redactSensitive`.

## Extraer registros

Elige el archivo de registro más reciente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrar diagnósticos HTTP de Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

O seguir el registro mientras reproduces el problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para gateways remotos, también puedes usar `openclaw logs --follow` (consulta [/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` se establece por encima de `warn`, estos registros pueden suprimirse. El valor predeterminado `info` está bien.
- Es seguro dejar los flags activados; solo afectan el volumen de registros del subsistema específico.
- Usa [/logging](/es/logging) para cambiar los destinos, niveles y redacción de los registros.

## Relacionado

- [Diagnósticos del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
