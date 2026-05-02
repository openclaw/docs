---
read_when:
    - Necesitas registros de depuración específicos sin aumentar los niveles de registro globales
    - Debe capturar registros específicos del subsistema para soporte técnico
summary: Opciones de diagnóstico para registros de depuración selectivos
title: Opciones de diagnóstico
x-i18n:
    generated_at: "2026-05-02T20:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Los indicadores de diagnóstico te permiten activar registros de depuración específicos sin habilitar el registro detallado en todas partes. Los indicadores son opcionales y no tienen efecto a menos que un subsistema los compruebe.

## Cómo funciona

- Los indicadores son cadenas (sin distinción entre mayúsculas y minúsculas).
- Puedes activar indicadores en la configuración o mediante una anulación de entorno.
- Se admiten comodines:
  - `telegram.*` coincide con `telegram.http`
  - `*` activa todos los indicadores

## Activar mediante configuración

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

## Anulación de entorno (puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desactivar todos los indicadores:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefactos de línea de tiempo

El indicador `timeline` escribe eventos estructurados de arranque y temporización
en tiempo de ejecución para arneses de QA externos:

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

La ruta del archivo de línea de tiempo sigue viniendo de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Cuando `timeline` se activa solo desde la
configuración, los primeros intervalos de carga de configuración no se emiten
porque OpenClaw aún no ha leído la configuración; los intervalos de arranque
posteriores usan el indicador de configuración.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` y
`OPENCLAW_DIAGNOSTICS=*` también activan la línea de tiempo porque activan todos
los indicadores de diagnóstico. Prefiere `timeline` cuando solo quieras el
artefacto de temporización JSONL.

Los registros de línea de tiempo usan el contenedor `openclaw.diagnostics.v1`.
Los eventos pueden incluir identificadores de proceso, nombres de fase, nombres
de intervalo, duraciones, identificadores de Plugin, recuentos de dependencias,
muestras de retraso del bucle de eventos, nombres de operaciones de proveedor,
estado de salida de procesos secundarios y nombres/mensajes de errores de
arranque. Trata los archivos de línea de tiempo como artefactos locales de
diagnóstico; revísalos antes de compartirlos fuera de tu máquina.

## Dónde van los registros

Los indicadores emiten registros en el archivo estándar de registro de diagnóstico. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si defines `logging.file`, usa esa ruta en su lugar. Los registros son JSONL (un objeto JSON por línea). La censura sigue aplicándose según `logging.redactSensitive`.

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

O sigue el registro mientras reproduces el problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, también puedes usar `openclaw logs --follow` (consulta [/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` está configurado por encima de `warn`, estos registros pueden suprimirse. El valor predeterminado `info` funciona bien.
- `brave.http` registra URL/parámetros de consulta de solicitudes de Brave Search, estado/temporización de respuestas y eventos de acierto/fallo/escritura de caché. No registra claves de API ni cuerpos de respuesta, pero las consultas de búsqueda pueden ser sensibles.
- Es seguro dejar los indicadores activados; solo afectan al volumen de registro del subsistema específico.
- Usa [/logging](/es/logging) para cambiar destinos, niveles y censura de registros.

## Relacionado

- [Diagnósticos del Gateway](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
