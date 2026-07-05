---
permalink: /security/formal-verification/
read_when:
    - Revisión de las garantías o límites del modelo de seguridad formal
    - Reproducción o actualización de comprobaciones del modelo de seguridad TLA+/TLC
summary: Modelos de seguridad verificados por máquina para las rutas de mayor riesgo de OpenClaw.
title: Verificación formal (modelos de seguridad)
x-i18n:
    generated_at: "2026-07-05T11:41:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Los modelos formales de seguridad de OpenClaw (TLA+/TLC actualmente) ofrecen un argumento verificado por máquina de que rutas específicas de mayor riesgo — autorización, aislamiento de sesiones, control de herramientas y seguridad ante configuraciones erróneas — aplican su política prevista, bajo supuestos explícitos declarados.

> Nota: algunos enlaces antiguos pueden hacer referencia al nombre anterior del proyecto.

## Qué es esto

Un conjunto ejecutable de regresión de seguridad impulsado por atacantes:

- Cada afirmación tiene una comprobación de modelo ejecutable sobre un espacio de estados finito.
- Muchas afirmaciones tienen un modelo negativo emparejado que produce una traza de contraejemplo para una clase de error realista.

Esto **no** es una prueba de que OpenClaw sea seguro en todos los aspectos, y no verifica la implementación completa en TypeScript.

## Dónde viven los modelos

Los modelos se mantienen en un repositorio separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Ese repositorio no está disponible actualmente (GitHub devuelve "Repository not found" al momento de escribir esto). Si sigue fallando para ti, pregunta en los canales de mantenedores de OpenClaw por la ubicación actual antes de asumir que los modelos fueron eliminados.
</Note>

## Advertencias

- Estos son modelos, no la implementación completa en TypeScript — es posible que haya deriva entre el modelo y el código.
- Los resultados están acotados por el espacio de estados que explora TLC. Un resultado verde no implica seguridad más allá de los supuestos y límites modelados.
- Algunas afirmaciones dependen de supuestos explícitos del entorno (por ejemplo, despliegue correcto y entradas de configuración correctas).

## Reproducir resultados

Clona el repositorio de modelos y ejecuta TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

Todavía no hay integración de CI de vuelta a este repositorio; una iteración futura podría agregar modelos ejecutados por CI con artefactos públicos (trazas de contraejemplo, registros de ejecución) o un flujo alojado de "ejecutar este modelo" para comprobaciones pequeñas y acotadas.

## Afirmaciones y objetivos

### Exposición del Gateway y configuración errónea de Gateway abierto

**Afirmación:** enlazar más allá de loopback sin autenticación puede hacer posible una vulneración remota y aumenta la exposición; un token/contraseña bloquea a atacantes no autenticados, según los supuestos del modelo.

| Resultado      | Objetivos                                                        |
| -------------- | ---------------------------------------------------------------- |
| Verde          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Rojo (esperado) | `make gateway-exposure-v2-negative`                              |

Consulta también `docs/gateway-exposure-matrix.md` en el repositorio de modelos.

### Canalización de exec de Node (capacidad de mayor riesgo)

**Afirmación:** `exec host=node` requiere (a) una lista de permitidos de comandos de Node más comandos declarados y (b) aprobación en vivo cuando está configurado; las aprobaciones se tokenizan para evitar la repetición, en el modelo.

| Resultado      | Objetivos                                                       |
| -------------- | --------------------------------------------------------------- |
| Verde          | `make nodes-pipeline`, `make approvals-token`                   |
| Rojo (esperado) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Almacén de emparejamiento (control de DM)

**Afirmación:** las solicitudes de emparejamiento respetan el TTL y los límites de solicitudes pendientes.

| Resultado      | Objetivos                                            |
| -------------- | ---------------------------------------------------- |
| Verde          | `make pairing`, `make pairing-cap`                   |
| Rojo (esperado) | `make pairing-negative`, `make pairing-cap-negative` |

### Control de entrada (menciones y omisión de comandos de control)

**Afirmación:** en contextos de grupo que requieren mención, un comando de control no autorizado no puede omitir el control de menciones.

| Resultado      | Objetivos                      |
| -------------- | ------------------------------ |
| Verde          | `make ingress-gating`          |
| Rojo (esperado) | `make ingress-gating-negative` |

### Enrutamiento y aislamiento de claves de sesión

**Afirmación:** los DM de pares distintos no se colapsan en la misma sesión salvo que estén explícitamente vinculados o configurados.

| Resultado      | Objetivos                         |
| -------------- | --------------------------------- |
| Verde          | `make routing-isolation`          |
| Rojo (esperado) | `make routing-isolation-negative` |

## Modelos v1++: concurrencia, reintentos, corrección de trazas

Modelos posteriores que ajustan la fidelidad en torno a modos de fallo reales: actualizaciones no atómicas, reintentos y distribución de mensajes.

### Concurrencia e idempotencia del almacén de emparejamiento

**Afirmación:** el almacén de emparejamiento aplica `MaxPending` e idempotencia incluso bajo intercalados — la verificación y posterior escritura debe ser atómica/bloqueada, y la actualización no debe crear duplicados. Concretamente: las solicitudes concurrentes no pueden superar `MaxPending` para un canal, y las solicitudes/actualizaciones repetidas para el mismo `(channel, sender)` no crean filas pendientes activas duplicadas.

| Resultado      | Objetivos                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verde          | `make pairing-race` (verificación de límite atómica/bloqueada), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                              |
| Rojo (esperado) | `make pairing-race-negative` (carrera no atómica de límite begin/commit), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Correlación de trazas e idempotencia de entrada

**Afirmación:** la ingesta preserva la correlación de trazas en la distribución y es idempotente bajo reintentos del proveedor. Cuando un evento externo se convierte en múltiples mensajes internos, cada parte conserva la misma identidad de traza/evento; los reintentos no se procesan dos veces; si faltan los ID de evento del proveedor, la deduplicación recurre a una clave segura (por ejemplo, ID de traza) para evitar descartar eventos distintos.

| Resultado      | Objetivos                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Verde          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Rojo (esperado) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Precedencia de dmScope e identityLinks en enrutamiento

**Afirmación:** el enrutamiento mantiene las sesiones de DM aisladas de forma predeterminada y solo colapsa sesiones cuando está configurado explícitamente, mediante precedencia de canal y enlaces de identidad. Las anulaciones de `dmScope` específicas del canal prevalecen sobre los valores predeterminados globales; `identityLinks` colapsa sesiones solo dentro de grupos vinculados explícitos, no entre pares no relacionados.

| Resultado      | Objetivos                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| Verde          | `make routing-precedence`, `make routing-identitylinks`                   |
| Rojo (esperado) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
- [Respuesta a incidentes](/es/security/incident-response)
