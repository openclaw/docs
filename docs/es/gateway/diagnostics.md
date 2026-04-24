---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depurar fallos, reinicios, presión de memoria o cargas útiles sobredimensionadas de Gateway
    - Revisar qué datos de diagnóstico se registran o se redactan
summary: Crear paquetes de diagnóstico de Gateway compartibles para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-04-24T05:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw puede crear un zip local de diagnósticos que es seguro para adjuntar a informes
de errores. Combina estado, salud, forma de configuración y registros de Gateway sanitizados, junto con
eventos recientes de estabilidad sin cargas útiles.

## Inicio rápido

```bash
openclaw gateway diagnostics export
```

El comando imprime la ruta del zip generado. Para elegir una ruta:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automatización:

```bash
openclaw gateway diagnostics export --json
```

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquinas de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración sanitizada y detalles de configuración no secretos.
- Resúmenes de registros sanitizados y líneas recientes de registros redactadas.
- Instantáneas de estado y salud de Gateway con el mejor esfuerzo posible.
- `stability/latest.json`: el paquete de estabilidad persistido más reciente, cuando está disponible.

La exportación es útil incluso cuando Gateway no está en buen estado. Si Gateway no puede
responder a solicitudes de estado o salud, los registros locales, la forma de configuración y el
paquete de estabilidad más reciente se siguen recopilando cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistemas, IDs de Plugin, IDs de proveedor, IDs de canal y modos configurados
- códigos de estado, duraciones, conteos de bytes, estado de colas y lecturas de memoria
- metadatos de registros sanitizados y mensajes operativos redactados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o redacta:

- texto de chat, prompts, instrucciones, cuerpos de webhook y salidas de herramientas
- credenciales, claves API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitudes o respuestas
- IDs de cuenta, IDs de mensaje, IDs de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la
exportación conserva solo que se omitió un mensaje y el conteo de bytes.

## Registrador de estabilidad

Gateway registra por defecto un flujo de estabilidad limitado y sin cargas útiles cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

Inspecciona el registrador activo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete de estabilidad persistido más reciente después de una salida fatal, un tiempo de espera
de apagado o un fallo de inicio tras reinicio:

```bash
openclaw gateway stability --bundle latest
```

Crea un zip de diagnósticos a partir del paquete persistido más reciente:

```bash
openclaw gateway stability --bundle latest --export
```

Los paquetes persistidos viven en `~/.openclaw/logs/stability/` cuando existen eventos.

## Opciones útiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: escribe en una ruta zip específica.
- `--log-lines <count>`: número máximo de líneas de registro sanitizadas que se incluirán.
- `--log-bytes <bytes>`: número máximo de bytes de registro que se inspeccionarán.
- `--url <url>`: URL WebSocket de Gateway para instantáneas de estado y salud.
- `--token <token>`: token de Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña de Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantáneas de estado y salud.
- `--no-stability-bundle`: omite la búsqueda del paquete de estabilidad persistido.
- `--json`: imprime metadatos de exportación legibles por máquinas.

## Deshabilitar diagnósticos

Los diagnósticos están habilitados de forma predeterminada. Para deshabilitar el registrador de estabilidad y
la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Deshabilitar los diagnósticos reduce el detalle del informe de errores. No afecta al
registro normal de Gateway.

## Documentación relacionada

- [Comprobaciones de estado](/es/gateway/health)
- [CLI de Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo de Gateway](/es/gateway/protocol#system-and-identity)
- [Registros](/es/logging)
