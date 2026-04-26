---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depurar cierres, reinicios, presión de memoria o cargas útiles sobredimensionadas del Gateway
    - Revisar qué datos de diagnósticos se registran o se redactan
summary: Crear paquetes de diagnósticos compartibles del Gateway para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-04-26T11:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw puede crear un zip local de diagnósticos que es seguro adjuntar a informes de errores. Combina estado del Gateway saneado, salud, registros, forma de configuración y eventos recientes de estabilidad sin cargas útiles.

## Inicio rápido

```bash
openclaw gateway diagnostics export
```

El comando imprime la ruta del zip escrito. Para elegir una ruta:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automatización:

```bash
openclaw gateway diagnostics export --json
```

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por personas para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración saneada y detalles de configuración no secretos.
- Resúmenes saneados de registros y líneas recientes de registros redactadas.
- Instantáneas de estado y salud del Gateway con mejor esfuerzo.
- `stability/latest.json`: el paquete de estabilidad persistido más reciente, cuando está disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede responder a solicitudes de estado o salud, los registros locales, la forma de configuración y el último paquete de estabilidad se siguen recopilando cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos que ayudan a depurar, como:

- nombres de subsistemas, ids de plugins, ids de proveedores, ids de canales y modos configurados
- códigos de estado, duraciones, conteos de bytes, estado de cola y lecturas de memoria
- metadatos saneados de registros y mensajes operativos redactados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o redacta:

- texto de chats, prompts, instrucciones, cuerpos de Webhook y salidas de herramientas
- credenciales, claves API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitudes o respuestas
- ids de cuentas, ids de mensajes, ids de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece ser texto de usuario, chat, prompt o carga útil de herramienta, la exportación conserva solo que se omitió un mensaje y el conteo de bytes.

## Registrador de estabilidad

El Gateway registra un flujo de estabilidad acotado y sin cargas útiles de forma predeterminada cuando los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

Inspecciona el registrador en vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete de estabilidad persistido más reciente después de una salida fatal, un tiempo de espera de apagado o un fallo de inicio tras reinicio:

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
- `--log-lines <count>`: número máximo de líneas de registro saneadas a incluir.
- `--log-bytes <bytes>`: máximo de bytes de registro a inspeccionar.
- `--url <url>`: URL de WebSocket del Gateway para instantáneas de estado y salud.
- `--token <token>`: token del Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña del Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantánea de estado y salud.
- `--no-stability-bundle`: omite la búsqueda del paquete de estabilidad persistido.
- `--json`: imprime metadatos de exportación legibles por máquina.

## Deshabilitar diagnósticos

Los diagnósticos están habilitados de forma predeterminada. Para deshabilitar el registrador de estabilidad y la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Deshabilitar diagnósticos reduce el detalle de los informes de errores. No afecta el registro normal del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación OpenTelemetry](/es/gateway/opentelemetry) — flujo separado para transmitir diagnósticos a un recolector
