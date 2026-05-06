---
permalink: /security/formal-verification/
read_when:
    - Revisión de las garantías o los límites del modelo formal de seguridad
    - Reproducir o actualizar las comprobaciones del modelo de seguridad TLA+/TLC
summary: Modelos de seguridad verificados por máquina para las rutas de mayor riesgo de OpenClaw.
title: Verificación formal (modelos de seguridad)
x-i18n:
    generated_at: "2026-05-06T05:48:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Esta página hace seguimiento de los **modelos formales de seguridad** de OpenClaw (TLA+/TLC hoy; más según sea necesario).

> Nota: algunos enlaces antiguos pueden referirse al nombre anterior del proyecto.

**Objetivo (guía principal):** proporcionar un argumento verificado por máquina de que OpenClaw aplica su
política de seguridad prevista (autorización, aislamiento de sesiones, control de herramientas y
seguridad ante configuraciones incorrectas), bajo supuestos explícitos.

**Qué es esto (hoy):** un **conjunto de regresión de seguridad** ejecutable e impulsado por atacantes:

- Cada afirmación tiene una verificación de modelo ejecutable sobre un espacio de estados finito.
- Muchas afirmaciones tienen un **modelo negativo** emparejado que produce una traza de contraejemplo para una clase de error realista.

**Qué no es esto (todavía):** una prueba de que "OpenClaw es seguro en todos los aspectos" o de que la implementación completa en TypeScript es correcta.

## Dónde viven los modelos

Los modelos se mantienen en un repositorio independiente: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Advertencias importantes

- Estos son **modelos**, no la implementación completa en TypeScript. Es posible que haya divergencias entre el modelo y el código.
- Los resultados están limitados por el espacio de estados explorado por TLC; "verde" no implica seguridad más allá de los supuestos y límites modelados.
- Algunas afirmaciones dependen de supuestos ambientales explícitos (por ejemplo, despliegue correcto, entradas de configuración correctas).

## Reproducir los resultados

Hoy, los resultados se reproducen clonando localmente el repositorio de modelos y ejecutando TLC (ver abajo). Una iteración futura podría ofrecer:

- modelos ejecutados en CI con artefactos públicos (trazas de contraejemplo, registros de ejecución)
- un flujo de trabajo alojado de "ejecutar este modelo" para comprobaciones pequeñas y acotadas

Primeros pasos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposición del Gateway y configuración incorrecta de Gateway abierto

**Afirmación:** enlazarse más allá de loopback sin autenticación puede hacer posible el compromiso remoto / aumenta la exposición; token/contraseña bloquea atacantes no autenticados (según los supuestos del modelo).

- Ejecuciones verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rojas (esperadas):
  - `make gateway-exposure-v2-negative`

Ver también: `docs/gateway-exposure-matrix.md` en el repositorio de modelos.

### Canalización de exec de Node (capacidad de mayor riesgo)

**Afirmación:** `exec host=node` requiere (a) una lista de comandos Node permitidos más comandos declarados y (b) aprobación en vivo cuando está configurado; las aprobaciones se tokenizan para evitar la reproducción (en el modelo).

- Ejecuciones verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rojas (esperadas):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Almacén de emparejamiento (control de DM)

**Afirmación:** las solicitudes de emparejamiento respetan el TTL y los límites de solicitudes pendientes.

- Ejecuciones verdes:
  - `make pairing`
  - `make pairing-cap`
- Rojas (esperadas):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Control de entrada (menciones + omisión por comando de control)

**Afirmación:** en contextos de grupo que requieren mención, un "comando de control" no autorizado no puede omitir el control de menciones.

- Verde:
  - `make ingress-gating`
- Roja (esperada):
  - `make ingress-gating-negative`

### Aislamiento de enrutamiento/clave de sesión

**Afirmación:** los DM de pares distintos no se colapsan en la misma sesión salvo que estén vinculados/configurados explícitamente.

- Verde:
  - `make routing-isolation`
- Roja (esperada):
  - `make routing-isolation-negative`

## v1++: modelos acotados adicionales (concurrencia, reintentos, corrección de trazas)

Estos son modelos posteriores que refuerzan la fidelidad en torno a modos de fallo del mundo real (actualizaciones no atómicas, reintentos y distribución de mensajes).

### Concurrencia / idempotencia del almacén de emparejamiento

**Afirmación:** un almacén de emparejamiento debería aplicar `MaxPending` y la idempotencia incluso bajo intercalados (es decir, "comprobar y luego escribir" debe ser atómico / bloqueado; la actualización no debería crear duplicados).

Qué significa:

- Bajo solicitudes concurrentes, no puedes superar `MaxPending` para un canal.
- Las solicitudes/actualizaciones repetidas para el mismo `(channel, sender)` no deberían crear filas pendientes vivas duplicadas.

- Ejecuciones verdes:
  - `make pairing-race` (comprobación de límite atómica/bloqueada)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rojas (esperadas):
  - `make pairing-race-negative` (carrera de límite no atómica begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlación de trazas de entrada / idempotencia

**Afirmación:** la ingesta debería preservar la correlación de trazas durante la distribución y ser idempotente bajo reintentos del proveedor.

Qué significa:

- Cuando un evento externo se convierte en varios mensajes internos, cada parte mantiene la misma identidad de traza/evento.
- Los reintentos no provocan procesamiento doble.
- Si faltan los IDs de eventos del proveedor, la deduplicación recurre a una clave segura (por ejemplo, ID de traza) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rojas (esperadas):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedencia de dmScope de enrutamiento + identityLinks

**Afirmación:** el enrutamiento debe mantener aisladas las sesiones de DM de forma predeterminada, y solo colapsar sesiones cuando se configura explícitamente (precedencia de canal + enlaces de identidad).

Qué significa:

- Las anulaciones de dmScope específicas del canal deben prevalecer sobre los valores predeterminados globales.
- identityLinks debería colapsar solo dentro de grupos vinculados explícitos, no entre pares no relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rojas (esperadas):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
