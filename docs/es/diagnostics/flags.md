---
read_when:
    - Necesitas registros de depuración dirigidos sin elevar los niveles globales de registro
    - Necesitas capturar registros específicos de subsistemas para soporte
summary: Banderas de diagnóstico para registros de depuración dirigidos
title: Banderas de diagnóstico
x-i18n:
    generated_at: "2026-04-24T05:27:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Las banderas de diagnóstico te permiten habilitar registros de depuración dirigidos sin activar el registro detallado en todas partes. Las banderas son opcionales y no tienen efecto a menos que un subsistema las consulte.

## Cómo funciona

- Las banderas son cadenas (no distinguen entre mayúsculas y minúsculas).
- Puedes habilitar banderas en la configuración o mediante una anulación por entorno.
- Se admiten comodines:
  - `telegram.*` coincide con `telegram.http`
  - `*` habilita todas las banderas

## Habilitar mediante configuración

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Varias banderas:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Reinicia el gateway después de cambiar las banderas.

## Anulación por entorno (puntual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desactivar todas las banderas:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Dónde van los registros

Las banderas emiten registros en el archivo estándar de registros de diagnóstico. De forma predeterminada:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si estableces `logging.file`, usa esa ruta en su lugar. Los registros están en formato JSONL (un objeto JSON por línea). La redacción sigue aplicándose según `logging.redactSensitive`.

## Extraer registros

Elige el archivo de registro más reciente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrar diagnósticos HTTP de Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

O seguirlos mientras reproduces el problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para gateways remotos, también puedes usar `openclaw logs --follow` (consulta [/cli/logs](/es/cli/logs)).

## Notas

- Si `logging.level` está configurado por encima de `warn`, estos registros pueden suprimirse. El valor predeterminado `info` está bien.
- Las banderas son seguras para dejarlas habilitadas; solo afectan al volumen de registros del subsistema específico.
- Usa [/logging](/es/logging) para cambiar destinos, niveles y redacción de registros.

## Relacionado

- [Diagnósticos de Gateway](/es/gateway/diagnostics)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
