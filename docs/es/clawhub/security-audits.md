---
read_when:
    - Comprender los resultados de la auditoría de seguridad de ClawHub
    - Decidir si instalar una skill o un plugin
    - Explicación del estado de auditoría, el nivel de riesgo o los hallazgos de ClawHub
sidebarTitle: Security Audits
summary: Cómo entender los resultados de auditoría de seguridad de ClawHub antes de instalar una skill o un plugin.
title: Auditorías de seguridad
x-i18n:
    generated_at: "2026-07-01T20:11:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorías de seguridad

Las auditorías de seguridad de ClawHub te ayudan a decidir si una habilidad o Plugin es lo bastante seguro para instalarlo. Muestran qué hace una versión, qué autoridad solicita y si hay algo que merezca atención adicional antes de que pueda acceder a archivos, cuentas, credenciales, código o servicios externos.

Las auditorías son señales de seguridad sólidas, pero no garantizan que una versión esté libre de riesgos. Usa siempre tu criterio antes de conceder acceso sensible.

Consulta también [Seguridad](/clawhub/security), [Uso aceptable](/clawhub/acceptable-usage) y [Moderación y seguridad de la cuenta](/clawhub/moderation).

## Qué revisar antes de instalar

Antes de instalar, revisa:

- el estado general de la auditoría
- el nivel de riesgo
- cualquier hallazgo listado
- credenciales, permisos o variables de entorno requeridos
- propietario, fuente, versión, registro de cambios, descargas, estrellas y otras señales de confianza

Instala solo contenido que entiendas y en el que confíes.

## Estado de auditoría

El estado de auditoría te indica cómo reaccionar ante el resultado de la auditoría:

| Estado      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | No se encontró ningún problema visible por encima de riesgo bajo.                                |
| `Review`    | Lee los hallazgos antes de instalar. La versión aún puede ser legítima. |
| `Warn`      | Ten especial cautela. ClawHub encontró una preocupación de alto impacto o una señal de advertencia. |
| `Malicious` | No lo instales.                                                           |
| `Pending`   | Las auditorías aún no han finalizado.                                             |
| `Error`     | No se pudo completar la auditoría.                                         |

Un `Pass` es tranquilizador, pero no sustituye tu propio criterio. Esto importa especialmente para herramientas que pueden publicar contenido, editar datos, ejecutar comandos, leer archivos o acceder a sistemas de producción.

## Nivel de riesgo

El nivel de riesgo describe el radio de impacto: cuánto poder parece tener la versión si la usas según lo previsto.

| Nivel de riesgo | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Se encontró poca autoridad sensible o poco impacto para el usuario.                          |
| `Medium`   | La versión tiene autoridad significativa, como acceso a cuentas o cambios de datos. |
| `High`     | La versión tiene autoridad de alto impacto, hallazgos graves o señales maliciosas. |

El nivel de riesgo y el estado de auditoría responden preguntas distintas:

- El nivel de riesgo pregunta: "¿Cuánto poder hay aquí?"
- El estado de auditoría pregunta: "¿Qué debo hacer con este resultado?"

Por ejemplo, una habilidad de publicación puede mostrar `Review` con riesgo `Medium`. Eso no significa que sea maliciosa. Significa que la habilidad parece alineada con su propósito, pero puede actuar con autoridad significativa sobre una cuenta.

## Hallazgos

Los hallazgos explican por qué se mostró un resultado de auditoría. Cada hallazgo suele incluir:

- qué significa
- por qué se marcó
- el contenido relevante de la habilidad o Plugin
- una recomendación

Los hallazgos pueden etiquetarse como `Info`, `Low`, `Medium`, `High` o `Critical`. Los hallazgos de mayor gravedad contribuyen con más fuerza al nivel de riesgo y al estado de auditoría.

Los hallazgos de baja confianza se ocultan del resumen público de la auditoría para que la página se mantenga enfocada en evidencia útil.

## Qué comprueba ClawHub

ClawHub audita los artefactos de versión enviados, incluidos:

- instrucciones de habilidades o metadatos de Plugin
- variables de entorno y permisos declarados
- instrucciones de instalación y metadatos de paquetes
- archivos incluidos y manifiestos de archivos
- metadatos de compatibilidad y capacidades

La pregunta principal es la coherencia: ¿el nombre, el resumen, los metadatos, la autoridad solicitada y el contenido real coinciden con lo que los usuarios esperarían razonablemente?

Un comportamiento potente no es automáticamente malo. Muchas herramientas útiles necesitan credenciales, comandos locales, API de proveedores o instalaciones de paquetes. La auditoría comprueba si ese poder es esperado, está divulgado y es proporcional.

Las páginas de artefactos enlazan a la auditoría completa en:

```text
/<owner>/skills/<slug>/security-audit
```

La página de auditoría combina:

1. SkillSpector
2. VirusTotal
3. Análisis de riesgos

## VirusTotal

ClawHub usa VirusTotal como telemetría de malware en la pila de auditoría. VirusTotal es un estándar de confianza del sector para la reputación de archivos y el análisis de malware, y nuestra colaboración permite que ClawHub añada inteligencia de seguridad más amplia a la revisión de habilidades y Plugins.

VirusTotal es especialmente útil para artefactos maliciosos conocidos, detecciones de motores y señales de reputación que complementan la revisión de ClawHub con conciencia de agentes. Cuando los recuentos de motores de proveedores están disponibles, la auditoría los resume en lenguaje claro, por ejemplo:

```text
62/62 proveedores marcaron esta habilidad como limpia.
```

o:

```text
2/64 proveedores marcaron esta habilidad como maliciosa, 1/64 la marcó como sospechosa y 61/64 la marcaron como limpia.
```

Cuando ClawHub no tiene telemetría de recuento de proveedores para resumir, la auditoría dice:

```text
No hay hallazgos de VirusTotal
```

VirusTotal sigue siendo telemetría. No reemplaza el análisis de riesgos propio de ClawHub con conciencia de artefactos.

## Análisis de riesgos

El análisis de riesgos funciona internamente con ClawScan, el sistema propio de auditoría de seguridad de ClawHub. Revisa cada versión como un artefacto orientado a agentes: instrucciones, metadatos, permisos declarados, archivos, señales de capacidades, señales de análisis estático, hallazgos de SkillSpector, telemetría de VirusTotal y contexto proporcionado por el publicador. Las señales de análisis estático son contexto interno para esta revisión; no son una sección pública independiente de auditoría ni un veredicto que bloquee la instalación.

El análisis de riesgos usa el
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
como lente para riesgos como inyección de prompts, uso indebido de herramientas, exposición de credenciales, ejecución insegura, envenenamiento de memoria o contexto y agencia excesiva.

ClawScan no trata una capacidad de apariencia alarmante como automáticamente maliciosa. Pregunta si la capacidad está divulgada, alineada con su propósito y respaldada por el caso de uso declarado de la versión.
