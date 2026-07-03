---
read_when:
    - Entender los resultados de la auditoría de seguridad de ClawHub
    - Decidir si instalar una Skill o un Plugin
    - Explicar el estado de auditoría de ClawHub, el nivel de riesgo o los hallazgos
sidebarTitle: Security Audits
summary: Cómo entender los resultados de la auditoría de seguridad de ClawHub antes de instalar una habilidad o un Plugin.
title: Auditorías de seguridad
x-i18n:
    generated_at: "2026-07-03T02:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorías de seguridad

Las auditorías de seguridad de ClawHub te ayudan a decidir si una skill o un plugin es lo bastante seguro
para instalarlo. Muestran qué hace una versión, qué autoridad solicita y
si algo merece atención adicional antes de que pueda acceder a archivos, cuentas,
credenciales, código o servicios externos.

Las auditorías son señales de seguridad sólidas, pero no garantizan que una versión esté
libre de riesgos. Usa siempre tu propio criterio antes de conceder acceso sensible.

Consulta también [Seguridad](/clawhub/security), [Uso aceptable](/clawhub/acceptable-usage)
y [Moderación y seguridad de la cuenta](/clawhub/moderation).

## Qué comprobar antes de instalar

Antes de instalar, revisa:

- el estado general de la auditoría
- el nivel de riesgo
- cualquier hallazgo indicado
- las credenciales, permisos o variables de entorno requeridos
- propietario, origen, versión, registro de cambios, descargas, estrellas y otras señales de confianza

Instala solo contenido que entiendas y en el que confíes.

## Estado de auditoría

El estado de auditoría te indica cómo reaccionar al resultado de la auditoría:

| Estado      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | No se encontró ningún problema visible por encima del riesgo bajo.                                |
| `Review`    | Lee los hallazgos antes de instalar. La versión todavía puede ser legítima. |
| `Warn`      | Ten especial cautela. ClawHub encontró una preocupación de alto impacto o una señal de advertencia. |
| `Malicious` | No instales.                                                           |
| `Pending`   | Las auditorías aún no han terminado.                                             |
| `Error`     | La auditoría no se pudo completar.                                         |

Un `Pass` es tranquilizador, pero no sustituye tu propio criterio. Esto importa
sobre todo para herramientas que pueden publicar contenido, editar datos, ejecutar comandos, leer archivos o
acceder a sistemas de producción.

## Nivel de riesgo

El nivel de riesgo describe el radio de impacto: cuánto poder parece tener la versión si
la usas según lo previsto.

| Nivel de riesgo | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Se encontró poca autoridad sensible o poco impacto para el usuario.                          |
| `Medium`   | La versión tiene autoridad significativa, como acceso a cuentas o cambios de datos. |
| `High`     | La versión tiene autoridad de alto impacto, hallazgos graves o señales maliciosas. |

El nivel de riesgo y el estado de auditoría responden preguntas distintas:

- El nivel de riesgo pregunta: "¿Cuánto poder hay aquí?"
- El estado de auditoría pregunta: "¿Qué debo hacer con este resultado?"

Por ejemplo, una skill de publicación puede mostrar `Review` con riesgo `Medium`. Eso
no significa que sea maliciosa. Significa que la skill parece alineada con su propósito, pero puede
actuar con autoridad significativa sobre una cuenta.

## Hallazgos

Los hallazgos explican por qué se mostró un resultado de auditoría. Cada hallazgo suele incluir:

- qué significa
- por qué se marcó
- el contenido relevante de la skill o el plugin
- una recomendación

Los hallazgos pueden estar etiquetados como `Info`, `Low`, `Medium`, `High` o `Critical`. Los hallazgos de mayor
gravedad contribuyen con más fuerza al nivel de riesgo y al estado de auditoría.

Los hallazgos de baja confianza se ocultan del resumen público de la auditoría para que la página
se mantenga centrada en evidencia útil.

## Qué comprueba ClawHub

ClawHub audita los artefactos de versión enviados, incluidos:

- instrucciones de la skill o metadatos del plugin
- variables de entorno y permisos declarados
- instrucciones de instalación y metadatos del paquete
- archivos incluidos y manifiestos de archivos
- metadatos de compatibilidad y capacidades

La pregunta principal es la coherencia: ¿el nombre, el resumen, los metadatos, la autoridad
solicitada y el contenido real coinciden con lo que los usuarios esperarían razonablemente?

Un comportamiento potente no es automáticamente malo. Muchas herramientas útiles necesitan credenciales,
comandos locales, API de proveedores o instalaciones de paquetes. La auditoría comprueba si ese
poder es esperado, declarado y proporcional.

Las páginas de artefactos enlazan a la auditoría completa en:

```text
/<owner>/skills/<slug>/security-audit
```

La página de auditoría combina:

1. SkillSpector
2. VirusTotal
3. Análisis de riesgo

## VirusTotal

ClawHub usa VirusTotal como telemetría de malware en la pila de auditoría. VirusTotal es un
estándar de confianza del sector para la reputación de archivos y el análisis de malware, y nuestra
colaboración permite a ClawHub añadir inteligencia de seguridad más amplia a la revisión de skills y plugins.

VirusTotal es especialmente útil para artefactos maliciosos conocidos, coincidencias de motores y
señales de reputación que complementan la revisión consciente de agentes de ClawHub. Cuando los
recuentos de motores de proveedores están disponibles, la auditoría los resume en lenguaje claro, por ejemplo:

```text
62/62 vendors flagged this skill as clean.
```

o:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Cuando ClawHub no tiene telemetría de recuentos de proveedores para resumir, la auditoría dice:

```text
No VirusTotal findings
```

VirusTotal sigue siendo telemetría. No sustituye el análisis de riesgo propio de ClawHub,
consciente del artefacto.

## Análisis de riesgo

El análisis de riesgo está impulsado internamente por ClawScan, el sistema propio de auditoría de seguridad de
ClawHub. Revisa cada versión como un artefacto orientado a agentes: instrucciones,
metadatos, permisos declarados, archivos, señales de capacidades, señales de análisis estático,
hallazgos de SkillSpector, telemetría de VirusTotal y contexto proporcionado por el publicador.
Las señales de análisis estático son contexto interno para esta revisión; no son una
sección pública independiente de auditoría ni un veredicto que bloquee la instalación.

El análisis de riesgo usa el
[Top 10 de OWASP Agentic Skills](https://owasp.org/www-project-agentic-skills-top-10/)
como marco para riesgos como inyección de prompts, uso indebido de herramientas, exposición de credenciales,
ejecución insegura, envenenamiento de memoria o contexto y agencia excesiva.

ClawScan no trata una capacidad de apariencia preocupante como automáticamente maliciosa.
Pregunta si la capacidad está declarada, alineada con el propósito y respaldada por
el caso de uso indicado de la versión.
