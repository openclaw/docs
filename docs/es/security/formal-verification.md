---
permalink: /security/formal-verification/
read_when:
    - Revisión de las garantías o limitaciones del modelo formal de seguridad
    - Reproducción o actualización de las comprobaciones del modelo de seguridad de TLA+/TLC
summary: Modelos de seguridad verificados automáticamente para las rutas de mayor riesgo de OpenClaw.
title: Verificación formal (modelos de seguridad)
x-i18n:
    generated_at: "2026-07-11T23:31:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Los modelos formales de seguridad de OpenClaw (actualmente TLA+/TLC) proporcionan un argumento verificado por máquina de que determinadas rutas de máximo riesgo —autorización, aislamiento de sesiones, control de acceso a herramientas y seguridad ante configuraciones incorrectas— aplican la política prevista, bajo supuestos explícitos.

> Nota: algunos enlaces antiguos pueden hacer referencia al nombre anterior del proyecto.

## Qué es esto

Un conjunto ejecutable de pruebas de regresión de seguridad orientadas a ataques:

- Cada afirmación dispone de una comprobación de modelo ejecutable sobre un espacio de estados finito.
- Muchas afirmaciones incluyen un modelo negativo asociado que genera una traza de contraejemplo para una clase realista de errores.

Esto **no** demuestra que OpenClaw sea seguro en todos los aspectos ni verifica la implementación completa en TypeScript.

## Dónde se encuentran los modelos

Los modelos se mantienen en un repositorio independiente: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Actualmente no se puede acceder a ese repositorio (GitHub devuelve "Repository not found" en el momento de redactar este documento). Si sigue sin funcionar, consulte en los canales de mantenedores de OpenClaw cuál es la ubicación actual antes de suponer que se eliminaron los modelos.
</Note>

## Consideraciones

- Estos son modelos, no la implementación completa en TypeScript; es posible que haya divergencias entre el modelo y el código.
- Los resultados están limitados por el espacio de estados que explora TLC. Un resultado correcto no implica seguridad más allá de los supuestos y límites modelados.
- Algunas afirmaciones dependen de supuestos explícitos sobre el entorno (por ejemplo, un despliegue correcto y entradas de configuración correctas).

## Reproducción de los resultados

Clone el repositorio de modelos y ejecute TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Se requiere Java 11+ (TLC se ejecuta en la JVM).
# El repositorio incluye una versión fijada de tla2tools.jar y proporciona bin/tlc, además de objetivos de Make.

make <target>
```

Todavía no existe integración de CI con este repositorio; una iteración futura podría añadir modelos ejecutados mediante CI con artefactos públicos (trazas de contraejemplos y registros de ejecución) o un flujo de trabajo alojado de «ejecutar este modelo» para comprobaciones acotadas pequeñas.

## Afirmaciones y objetivos

### Exposición del Gateway y configuración incorrecta de un Gateway abierto

**Afirmación:** escuchar más allá de local loopback sin autenticación puede posibilitar un ataque remoto y aumentar la exposición; un token o una contraseña bloquean a los atacantes no autenticados, según los supuestos del modelo.

| Resultado           | Objetivos                                                         |
| ------------------- | ----------------------------------------------------------------- |
| Correcto            | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Incorrecto (previsto) | `make gateway-exposure-v2-negative`                             |

Consulte también `docs/gateway-exposure-matrix.md` en el repositorio de modelos.

### Canalización de ejecución de Node (capacidad de máximo riesgo)

**Afirmación:** `exec host=node` requiere (a) una lista de comandos permitidos de Node junto con comandos declarados y (b) aprobación en tiempo real cuando esté configurada; en el modelo, las aprobaciones utilizan tokens para evitar la reutilización.

| Resultado           | Objetivos                                                        |
| ------------------- | ---------------------------------------------------------------- |
| Correcto            | `make nodes-pipeline`, `make approvals-token`                   |
| Incorrecto (previsto) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Almacén de vinculación (control de acceso a mensajes directos)

**Afirmación:** las solicitudes de vinculación respetan el TTL y los límites de solicitudes pendientes.

| Resultado           | Objetivos                                             |
| ------------------- | ----------------------------------------------------- |
| Correcto            | `make pairing`, `make pairing-cap`                   |
| Incorrecto (previsto) | `make pairing-negative`, `make pairing-cap-negative` |

### Control de acceso de entrada (menciones y omisión mediante comandos de control)

**Afirmación:** en contextos de grupo que requieren una mención, un comando de control no autorizado no puede eludir el control de acceso mediante menciones.

| Resultado           | Objetivos                       |
| ------------------- | ------------------------------- |
| Correcto            | `make ingress-gating`          |
| Incorrecto (previsto) | `make ingress-gating-negative` |

### Enrutamiento y aislamiento de claves de sesión

**Afirmación:** los mensajes directos de distintos interlocutores no se agrupan en la misma sesión, salvo que se vinculen o configuren explícitamente.

| Resultado           | Objetivos                          |
| ------------------- | ---------------------------------- |
| Correcto            | `make routing-isolation`          |
| Incorrecto (previsto) | `make routing-isolation-negative` |

## Modelos v1++: concurrencia, reintentos y corrección de trazas

Modelos posteriores que mejoran la fidelidad respecto a modos de fallo reales: actualizaciones no atómicas, reintentos y distribución de mensajes.

### Concurrencia e idempotencia del almacén de vinculación

**Afirmación:** el almacén de vinculación aplica `MaxPending` y la idempotencia incluso con intercalaciones: la comprobación seguida de escritura debe ser atómica o estar bloqueada, y la actualización no debe crear duplicados. En concreto, las solicitudes simultáneas no pueden superar `MaxPending` para un canal, y las solicitudes o actualizaciones repetidas para el mismo `(channel, sender)` no crean filas pendientes activas duplicadas.

| Resultado           | Objetivos                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correcto            | `make pairing-race` (comprobación atómica o bloqueada del límite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                           |
| Incorrecto (previsto) | `make pairing-race-negative` (condición de carrera no atómica entre inicio y confirmación del límite), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Correlación e idempotencia de trazas de entrada

**Afirmación:** la ingesta conserva la correlación de trazas durante la distribución y es idempotente ante los reintentos del proveedor. Cuando un evento externo se convierte en varios mensajes internos, cada parte mantiene la misma identidad de traza o evento; los reintentos no provocan un procesamiento duplicado; si faltan los identificadores de evento del proveedor, la deduplicación recurre a una clave segura (por ejemplo, el identificador de traza) para evitar descartar eventos distintos.

| Resultado           | Objetivos                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Correcto            | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Incorrecto (previsto) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Precedencia de dmScope e identityLinks en el enrutamiento

**Afirmación:** el enrutamiento mantiene aisladas de forma predeterminada las sesiones de mensajes directos y solo las agrupa cuando se configura explícitamente mediante la precedencia de canales y los vínculos de identidad. Las sustituciones de `dmScope` específicas de cada canal tienen prioridad sobre los valores predeterminados globales; `identityLinks` agrupa sesiones únicamente dentro de grupos vinculados explícitamente, no entre interlocutores sin relación.

| Resultado           | Objetivos                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| Correcto            | `make routing-precedence`, `make routing-identitylinks`                   |
| Incorrecto (previsto) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Contenido relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
- [Respuesta ante incidentes](/es/security/incident-response)
