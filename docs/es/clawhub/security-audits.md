---
read_when:
    - Cómo interpretar los resultados de la auditoría de seguridad de ClawHub
    - Decidir si instalar una skill o un plugin
    - Explicación del estado de auditoría, el nivel de riesgo o los hallazgos de ClawHub
sidebarTitle: Security Audits
summary: Cómo interpretar los resultados de la auditoría de seguridad de ClawHub antes de instalar una Skill o un Plugin.
title: Auditorías de seguridad
x-i18n:
    generated_at: "2026-07-16T11:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorías de seguridad

Las auditorías de seguridad de ClawHub ayudan a decidir si una skill o un plugin son lo bastante seguros
para instalarlos. Muestran qué hace una versión, qué autoridad solicita y
si algo merece atención adicional antes de que pueda acceder a archivos, cuentas,
credenciales, código o servicios externos.

Las auditorías son indicadores de seguridad sólidos, pero no garantizan que una versión esté
libre de riesgos. Se debe aplicar siempre el criterio propio antes de conceder acceso confidencial.

Véanse también [Seguridad](/clawhub/security), [Uso aceptable](/es/clawhub/acceptable-usage)
y [Moderación y seguridad de las cuentas](/clawhub/moderation).

## Qué comprobar antes de instalar

Antes de instalar, se debe revisar:

- el estado general de la auditoría
- el nivel de riesgo
- todos los hallazgos enumerados
- las credenciales, los permisos o las variables de entorno necesarios
- el propietario, la fuente, la versión, el registro de cambios, las descargas, las estrellas y otros indicadores de confianza

Se debe instalar únicamente contenido que se comprenda y en el que se confíe.

## Estado de la auditoría

El estado de la auditoría indica cómo reaccionar ante el resultado:

| Estado      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | No se encontró ningún problema visible con un riesgo superior a bajo.                                |
| `Review`    | Se deben leer los hallazgos antes de instalar. La versión aún puede ser legítima. |
| `Warn`      | Se debe extremar la precaución. ClawHub encontró un problema de gran impacto o un indicador de advertencia. |
| `Malicious` | No instalar.                                                           |
| `Pending`   | Las auditorías aún no han finalizado.                                             |
| `Error`     | No se pudo completar la auditoría.                                         |

Un resultado `Pass` es tranquilizador, pero no sustituye el criterio propio. Esto es especialmente
importante para las herramientas que pueden publicar contenido, editar datos, ejecutar comandos, leer archivos o
acceder a sistemas de producción.

## Nivel de riesgo

El nivel de riesgo describe el alcance del impacto: cuánto poder parece tener la versión si
se utiliza según lo previsto.

| Nivel de riesgo | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Se encontró poca autoridad confidencial o repercusión para el usuario.                          |
| `Medium`   | La versión tiene una autoridad considerable, como acceso a cuentas o cambios en datos. |
| `High`     | La versión tiene una autoridad de gran impacto, hallazgos graves o indicios maliciosos. |

El nivel de riesgo y el estado de la auditoría responden a preguntas diferentes:

- El nivel de riesgo pregunta: «¿Cuánto poder hay aquí?»
- El estado de la auditoría pregunta: «¿Qué se debe hacer con este resultado?»

Por ejemplo, una skill de publicación puede mostrar `Review` con un riesgo `Medium`. Esto no
significa que sea maliciosa. Significa que la skill parece estar en consonancia con su propósito, pero puede
actuar con una autoridad considerable sobre la cuenta.

## Hallazgos

Los hallazgos explican por qué se mostró un resultado de auditoría. Cada hallazgo suele incluir:

- qué significa
- por qué se marcó
- el contenido relevante de la skill o el plugin
- una recomendación

Los hallazgos pueden etiquetarse como `Info`, `Low`, `Medium`, `High` o `Critical`. Los hallazgos de mayor
gravedad contribuyen en mayor medida al nivel de riesgo y al estado de la auditoría.

Los hallazgos de baja confianza se ocultan del resumen público de la auditoría para que la página
se centre en pruebas útiles.

## Qué comprueba ClawHub

ClawHub audita los artefactos de versión enviados, incluidos:

- las instrucciones de la skill o los metadatos del plugin
- las variables de entorno y los permisos declarados
- las instrucciones de instalación y los metadatos del paquete
- los archivos incluidos y los manifiestos de archivos
- los metadatos de compatibilidad y capacidades

La pregunta principal es la coherencia: ¿coinciden el nombre, el resumen, los metadatos, la
autoridad solicitada y el contenido real con lo que los usuarios esperarían razonablemente?

Un comportamiento con capacidades amplias no es necesariamente malo. Muchas herramientas útiles necesitan credenciales,
comandos locales, API de proveedores o instalaciones de paquetes. La auditoría comprueba si ese
poder es previsible, se declara y es proporcional.

Las páginas de artefactos enlazan a la auditoría completa en:

```text
/<owner>/skills/<slug>/security-audit
```

La página de auditoría combina:

1. SkillSpector
2. VirusTotal
3. Análisis de riesgos

## VirusTotal

ClawHub utiliza VirusTotal como telemetría de software malicioso en el conjunto de auditoría. VirusTotal es un
estándar de confianza del sector para la reputación de archivos y el análisis de software malicioso, y nuestra
colaboración permite que ClawHub incorpore inteligencia de seguridad más amplia a la revisión de skills y plugins.

VirusTotal es especialmente útil para artefactos maliciosos conocidos, detecciones de motores e
indicadores de reputación que complementan la revisión de ClawHub orientada a agentes. Cuando están disponibles
los recuentos de motores de proveedores, la auditoría los resume en lenguaje sencillo, por
ejemplo:

```text
62/62 proveedores marcaron esta skill como limpia.
```

o:

```text
2/64 proveedores marcaron esta skill como maliciosa, 1/64 la marcaron como sospechosa y 61/64 la marcaron como limpia.
```

Cuando ClawHub no dispone de telemetría de recuentos de proveedores que resumir, la auditoría indica:

```text
No hay hallazgos de VirusTotal
```

VirusTotal sigue siendo telemetría. No sustituye el análisis de riesgos de ClawHub
orientado a los artefactos.

## Análisis de riesgos

El análisis de riesgos funciona internamente mediante ClawScan, el sistema propio de auditoría de seguridad de
ClawHub. Revisa cada versión como un artefacto dirigido a agentes: instrucciones,
metadatos, permisos declarados, archivos, indicadores de capacidades, indicadores de análisis estático,
hallazgos de SkillSpector, telemetría de VirusTotal y contexto proporcionado por el editor.
Los indicadores de análisis estático constituyen contexto interno para esta revisión; no son una
sección pública independiente de la auditoría ni un veredicto que bloquee la instalación.

El análisis de riesgos utiliza el
[Top 10 de skills agénticas de OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
como marco para riesgos como la inyección de prompts, el uso indebido de herramientas, la exposición de credenciales,
la ejecución insegura, el envenenamiento de la memoria o del contexto y la autonomía excesiva.

ClawScan no considera que una capacidad de aspecto alarmante sea automáticamente maliciosa.
Evalúa si la capacidad se declara, está en consonancia con su propósito y cuenta con el respaldo
del caso de uso indicado para la versión.
