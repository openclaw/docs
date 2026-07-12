---
read_when:
    - Cómo interpretar los resultados de la auditoría de seguridad de ClawHub
    - Decidir si instalar una skill o un plugin
    - Explicación del estado de auditoría, el nivel de riesgo o los hallazgos de ClawHub
sidebarTitle: Security Audits
summary: Cómo interpretar los resultados de las auditorías de seguridad de ClawHub antes de instalar una Skill o un Plugin.
title: Auditorías de seguridad
x-i18n:
    generated_at: "2026-07-11T22:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorías de seguridad

Las auditorías de seguridad de ClawHub te ayudan a decidir si una Skill o un Plugin es lo suficientemente seguro
para instalarlo. Muestran qué hace una versión, qué autoridad solicita y
si algo merece atención adicional antes de que pueda acceder a archivos, cuentas,
credenciales, código o servicios externos.

Las auditorías son indicadores sólidos de seguridad, pero no garantizan que una versión esté
libre de riesgos. Aplica siempre tu propio criterio antes de conceder acceso confidencial.

Consulta también [Seguridad](/clawhub/security), [Uso aceptable](/clawhub/acceptable-usage)
y [Moderación y seguridad de las cuentas](/clawhub/moderation).

## Qué comprobar antes de instalar

Antes de instalar, revisa:

- el estado general de la auditoría
- el nivel de riesgo
- todos los hallazgos indicados
- las credenciales, los permisos o las variables de entorno necesarios
- el propietario, la fuente, la versión, el registro de cambios, las descargas, las estrellas y otros indicadores de confianza

Instala únicamente contenido que comprendas y en el que confíes.

## Estado de la auditoría

El estado de la auditoría indica cómo debes reaccionar ante su resultado:

| Estado      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | No se encontró ningún problema visible con un riesgo superior al nivel bajo.                                |
| `Review`    | Lee los hallazgos antes de instalar. La versión aún puede ser legítima. |
| `Warn`      | Actúa con especial cautela. ClawHub encontró un problema de gran impacto o un indicador de advertencia. |
| `Malicious` | No la instales.                                                           |
| `Pending`   | Las auditorías aún no han finalizado.                                             |
| `Error`     | No se pudo completar la auditoría.                                         |

Un resultado `Pass` es tranquilizador, pero no sustituye tu propio criterio. Esto es especialmente
importante para las herramientas que pueden publicar contenido, editar datos, ejecutar comandos, leer archivos o
acceder a sistemas de producción.

## Nivel de riesgo

El nivel de riesgo describe el radio de impacto: cuánto poder parece tener la versión si
la utilizas según lo previsto.

| Nivel de riesgo | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Se detectó poca autoridad confidencial o poco impacto para el usuario.                          |
| `Medium`   | La versión tiene una autoridad considerable, como acceso a cuentas o capacidad para modificar datos. |
| `High`     | La versión tiene una autoridad de gran impacto, hallazgos graves o indicadores maliciosos. |

El nivel de riesgo y el estado de la auditoría responden a preguntas diferentes:

- El nivel de riesgo pregunta: «¿Cuánto poder hay aquí?»
- El estado de la auditoría pregunta: «¿Qué debo hacer con este resultado?»

Por ejemplo, una Skill de publicación puede mostrar `Review` con un riesgo `Medium`. Eso no
significa que sea maliciosa. Significa que la Skill parece acorde con su propósito, pero puede
actuar con una autoridad considerable sobre la cuenta.

## Hallazgos

Los hallazgos explican por qué se mostró un resultado de auditoría. Por lo general, cada hallazgo incluye:

- qué significa
- por qué se marcó
- el contenido pertinente de la Skill o el Plugin
- una recomendación

Los hallazgos pueden etiquetarse como `Info`, `Low`, `Medium`, `High` o `Critical`. Los hallazgos de mayor
gravedad contribuyen en mayor medida al nivel de riesgo y al estado de la auditoría.

Los hallazgos con poca fiabilidad se ocultan del resumen público de la auditoría para que la página
se centre en pruebas útiles.

## Qué comprueba ClawHub

ClawHub audita los artefactos de las versiones enviadas, incluidos:

- las instrucciones de la Skill o los metadatos del Plugin
- las variables de entorno y los permisos declarados
- las instrucciones de instalación y los metadatos del paquete
- los archivos incluidos y los manifiestos de archivos
- los metadatos de compatibilidad y capacidades

La cuestión principal es la coherencia: ¿coinciden el nombre, el resumen, los metadatos, la autoridad
solicitada y el contenido real con lo que los usuarios podrían esperar razonablemente?

Un comportamiento con mucho poder no es necesariamente malo. Muchas herramientas útiles necesitan credenciales,
comandos locales, API de proveedores o instalaciones de paquetes. La auditoría comprueba si ese
poder es esperado, está declarado y resulta proporcional.

Las páginas de artefactos enlazan a la auditoría completa en:

```text
/<owner>/skills/<slug>/security-audit
```

La página de auditoría combina:

1. SkillSpector
2. VirusTotal
3. Análisis de riesgos

## VirusTotal

ClawHub utiliza VirusTotal como telemetría de malware en el conjunto de auditoría. VirusTotal es un
estándar fiable del sector para la reputación de archivos y el análisis de malware, y nuestra
colaboración permite que ClawHub incorpore información de seguridad más amplia a la revisión de Skills y Plugins.

VirusTotal resulta especialmente útil para detectar artefactos maliciosos conocidos, resultados positivos de motores e
indicadores de reputación que complementan la revisión de ClawHub orientada a agentes. Cuando están disponibles
los recuentos de motores de proveedores, la auditoría los resume en lenguaje sencillo, por ejemplo:

```text
62/62 proveedores marcaron esta Skill como limpia.
```

o:

```text
2/64 proveedores marcaron esta Skill como maliciosa, 1/64 la marcó como sospechosa y 61/64 la marcaron como limpia.
```

Cuando ClawHub no dispone de telemetría de recuentos de proveedores que resumir, la auditoría indica:

```text
Sin hallazgos de VirusTotal
```

VirusTotal sigue siendo telemetría. No sustituye el análisis de riesgos de ClawHub
basado en los propios artefactos.

## Análisis de riesgos

El análisis de riesgos utiliza internamente ClawScan, el sistema de auditoría de seguridad
propio de ClawHub. Revisa cada versión como un artefacto orientado a agentes: instrucciones,
metadatos, permisos declarados, archivos, indicadores de capacidades, indicadores de análisis estático,
hallazgos de SkillSpector, telemetría de VirusTotal y contexto proporcionado por el editor.
Los indicadores del análisis estático constituyen contexto interno para esta revisión; no son una
sección pública independiente de la auditoría ni un veredicto que impida la instalación.

El análisis de riesgos utiliza el
[Top 10 de Skills agénticas de OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
como marco para riesgos como la inyección de instrucciones, el uso indebido de herramientas, la exposición de credenciales,
la ejecución insegura, el envenenamiento de la memoria o del contexto y la autonomía excesiva.

ClawScan no considera automáticamente maliciosa una capacidad que parezca peligrosa.
Comprueba si la capacidad está declarada, es acorde con el propósito y está respaldada por
el caso de uso indicado para la versión.
