---
permalink: /security/formal-verification/
read_when:
    - Revisando garantías o límites de modelos formales de seguridad
    - Reproduciendo o actualizando comprobaciones de modelos de seguridad TLA+/TLC
summary: Modelos de seguridad verificados por máquina para las rutas de mayor riesgo de OpenClaw.
title: Verificación formal (modelos de seguridad)
x-i18n:
    generated_at: "2026-04-24T05:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Esta página sigue los **modelos formales de seguridad** de OpenClaw (hoy TLA+/TLC; más según sea necesario).

> Nota: algunos enlaces antiguos pueden referirse al nombre anterior del proyecto.

**Objetivo (norte):** proporcionar un argumento verificado por máquina de que OpenClaw aplica su
política de seguridad prevista (autorización, aislamiento de sesión, control de herramientas y
seguridad ante configuraciones erróneas), bajo supuestos explícitos.

**Lo que esto es (hoy):** una **suite de regresión de seguridad** ejecutable y orientada al atacante:

- Cada afirmación tiene una comprobación de modelo ejecutable sobre un espacio de estados finito.
- Muchas afirmaciones tienen un **modelo negativo** emparejado que produce una traza de contraejemplo para una clase de fallo realista.

**Lo que esto no es (todavía):** una prueba de que “OpenClaw es seguro en todos los aspectos” o de que la implementación completa en TypeScript es correcta.

## Dónde viven los modelos

Los modelos se mantienen en un repositorio separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Advertencias importantes

- Estos son **modelos**, no la implementación completa en TypeScript. Puede haber divergencias entre modelo y código.
- Los resultados están limitados por el espacio de estados explorado por TLC; que esté “verde” no implica seguridad más allá de los supuestos y límites modelados.
- Algunas afirmaciones dependen de supuestos ambientales explícitos (por ejemplo, implementación correcta, entradas de configuración correctas).

## Reproducir resultados

Hoy, los resultados se reproducen clonando el repositorio de modelos localmente y ejecutando TLC (ver más abajo). Una iteración futura podría ofrecer:

- modelos ejecutados en CI con artefactos públicos (trazas de contraejemplo, registros de ejecución)
- un flujo alojado de “ejecuta este modelo” para comprobaciones pequeñas y acotadas

Primeros pasos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposición del gateway y configuración errónea de gateway abierto

**Afirmación:** enlazar más allá de loopback sin autenticación puede hacer posible una vulneración remota / aumenta la exposición; token/password bloquea a atacantes no autenticados (según los supuestos del modelo).

- Ejecuciones verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rojo (esperado):
  - `make gateway-exposure-v2-negative`

Consulta también: `docs/gateway-exposure-matrix.md` en el repositorio de modelos.

### Canalización exec de Node (capacidad de mayor riesgo)

**Afirmación:** `exec host=node` requiere (a) lista de permitidos de comandos de Node más comandos declarados y (b) aprobación en vivo cuando esté configurada; las aprobaciones usan tokens para evitar repeticiones (en el modelo).

- Ejecuciones verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rojo (esperado):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Almacén de emparejamiento (control de DM)

**Afirmación:** las solicitudes de emparejamiento respetan el TTL y los límites de solicitudes pendientes.

- Ejecuciones verdes:
  - `make pairing`
  - `make pairing-cap`
- Rojo (esperado):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Control de entrada (menciones + omisión de comandos de control)

**Afirmación:** en contextos de grupo que requieren mención, un “comando de control” no autorizado no puede omitir el control por menciones.

- Verde:
  - `make ingress-gating`
- Rojo (esperado):
  - `make ingress-gating-negative`

### Enrutamiento/aislamiento de claves de sesión

**Afirmación:** los mensajes directos de distintos interlocutores no colapsan en la misma sesión a menos que estén enlazados/configurados explícitamente.

- Verde:
  - `make routing-isolation`
- Rojo (esperado):
  - `make routing-isolation-negative`

## v1++: modelos acotados adicionales (concurrencia, reintentos, corrección de trazas)

Estos son modelos posteriores que ajustan la fidelidad en torno a fallos del mundo real (actualizaciones no atómicas, reintentos y distribución de mensajes).

### Concurrencia / idempotencia del almacén de emparejamiento

**Afirmación:** un almacén de emparejamiento debería aplicar `MaxPending` e idempotencia incluso bajo intercalados (es decir, “comprobar-y-luego-escribir” debe ser atómico / bloqueado; refresh no debería crear duplicados).

Qué significa:

- Bajo solicitudes concurrentes, no puedes superar `MaxPending` para un canal.
- Las solicitudes/reintentos repetidos para el mismo `(channel, sender)` no deberían crear filas pendientes duplicadas activas.

- Ejecuciones verdes:
  - `make pairing-race` (comprobación atómica/bloqueada del límite)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rojo (esperado):
  - `make pairing-race-negative` (condición de carrera de límite begin/commit no atómica)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlación/idempotencia de trazas de entrada

**Afirmación:** la ingesta debe preservar la correlación de trazas a través de la distribución y ser idempotente ante reintentos del proveedor.

Qué significa:

- Cuando un evento externo se convierte en varios mensajes internos, cada parte mantiene la misma identidad de traza/evento.
- Los reintentos no producen doble procesamiento.
- Si faltan ID de evento del proveedor, la deduplicación recurre a una clave segura (por ejemplo, ID de traza) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rojo (esperado):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Prioridad de dmScope e identityLinks en enrutamiento

**Afirmación:** el enrutamiento debe mantener aisladas las sesiones DM por defecto y solo colapsarlas cuando esté configurado explícitamente (prioridad por canal + enlaces de identidad).

Qué significa:

- Las anulaciones de dmScope específicas del canal deben prevalecer sobre los valores predeterminados globales.
- `identityLinks` debería colapsar solo dentro de grupos enlazados explícitos, no entre interlocutores no relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rojo (esperado):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
