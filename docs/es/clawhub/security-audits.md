---
read_when:
    - Interpretación de los resultados de la auditoría de seguridad de ClawHub
    - Decidir si instalar una skill o un plugin
    - Explicación del estado de auditoría, el nivel de riesgo o los hallazgos de ClawHub
sidebarTitle: Security Audits
summary: Cómo interpretar los resultados de la auditoría de seguridad de ClawHub antes de instalar una skill o un plugin.
title: Auditorías de seguridad
x-i18n:
    generated_at: "2026-07-12T21:23:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorías de seguridad

Las auditorías de seguridad de ClawHub ayudan a decidir si una Skill o un Plugin es lo suficientemente seguro
para instalarlo. Muestran qué hace una versión, qué autoridad solicita y
si hay algo que merezca atención adicional antes de que pueda acceder a archivos, cuentas,
credenciales, código o servicios externos.

Las auditorías son señales de seguridad sólidas, pero no garantizan que una versión esté
libre de riesgos. Se debe aplicar siempre un criterio propio antes de conceder acceso confidencial.

Consulte también [Seguridad](/clawhub/security), [Uso aceptable](/es/clawhub/acceptable-usage)
y [Moderación y seguridad de las cuentas](/clawhub/moderation).

## Qué comprobar antes de instalar

Antes de instalar, revise:

- el estado general de la auditoría
- el nivel de riesgo
- los hallazgos enumerados
- las credenciales, los permisos o las variables de entorno requeridos
- el propietario, el código fuente, la versión, el registro de cambios, las descargas, las estrellas y otras señales de confianza

Instale únicamente contenido que comprenda y en el que confíe.

## Estado de la auditoría

El estado de la auditoría indica cómo reaccionar ante su resultado:

| Estado      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | No se encontró ningún problema visible con un riesgo superior al bajo.                                |
| `Review`    | Lea los hallazgos antes de instalar. La versión aún puede ser legítima. |
| `Warn`      | Extreme las precauciones. ClawHub encontró un problema de gran impacto o una señal de advertencia. |
| `Malicious` | No instale.                                                           |
| `Pending`   | Las auditorías todavía no han finalizado.                                             |
| `Error`     | No se pudo completar la auditoría.                                         |

Un resultado `Pass` es tranquilizador, pero no sustituye el criterio propio. Esto es especialmente
importante para las herramientas que pueden publicar contenido, editar datos, ejecutar comandos, leer archivos o
acceder a sistemas de producción.

## Nivel de riesgo

El nivel de riesgo describe el radio de impacto: cuánto poder parece tener la versión si
se utiliza según lo previsto.

| Nivel de riesgo | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Se detectó poca autoridad confidencial o poco impacto para el usuario.                          |
| `Medium`   | La versión tiene una autoridad considerable, como acceso a cuentas o capacidad de modificar datos. |
| `High`     | La versión tiene una autoridad de gran impacto, hallazgos graves o señales maliciosas. |

El nivel de riesgo y el estado de la auditoría responden a preguntas diferentes:

- El nivel de riesgo pregunta: «¿Cuánto poder hay aquí?»
- El estado de la auditoría pregunta: «¿Qué debo hacer con este resultado?»

Por ejemplo, una Skill de publicación puede mostrar `Review` con un riesgo `Medium`. Esto no
significa que sea maliciosa. Significa que la Skill parece ajustarse a su propósito, pero puede
actuar con una autoridad considerable sobre la cuenta.

## Hallazgos

Los hallazgos explican por qué se mostró un resultado de auditoría. Cada hallazgo suele incluir:

- qué significa
- por qué se marcó
- el contenido pertinente de la Skill o del Plugin
- una recomendación

Los hallazgos pueden etiquetarse como `Info`, `Low`, `Medium`, `High` o `Critical`. Los hallazgos de mayor
gravedad contribuyen en mayor medida al nivel de riesgo y al estado de la auditoría.

Los hallazgos con un nivel de confianza bajo se ocultan del resumen público de la auditoría para que la página
se centre en las pruebas útiles.

## Qué comprueba ClawHub

ClawHub audita los artefactos de las versiones enviadas, incluidos:

- las instrucciones de la Skill o los metadatos del Plugin
- las variables de entorno y los permisos declarados
- las instrucciones de instalación y los metadatos del paquete
- los archivos incluidos y los manifiestos de archivos
- los metadatos de compatibilidad y capacidades

La pregunta principal es la coherencia: ¿coinciden el nombre, el resumen, los metadatos, la autoridad
solicitada y el contenido real con lo que los usuarios esperarían razonablemente?

Un comportamiento potente no es malo de forma automática. Muchas herramientas útiles necesitan credenciales,
comandos locales, API de proveedores o instalaciones de paquetes. La auditoría comprueba si ese
poder es esperado, se ha declarado y es proporcional.

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
colaboración permite a ClawHub incorporar información de seguridad más amplia a la revisión de Skills y Plugins.

VirusTotal es especialmente útil para detectar artefactos maliciosos conocidos, detecciones de motores y
señales de reputación que complementan la revisión de ClawHub adaptada a los agentes. Cuando están disponibles
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
No hay hallazgos de VirusTotal
```

VirusTotal sigue siendo telemetría. No sustituye el análisis de riesgos de ClawHub adaptado a los
artefactos.

## Análisis de riesgos

El análisis de riesgos funciona internamente mediante ClawScan, el sistema propio de auditoría de seguridad
de ClawHub. Revisa cada versión como un artefacto orientado a agentes: instrucciones,
metadatos, permisos declarados, archivos, señales de capacidades, señales de análisis estático,
hallazgos de SkillSpector, telemetría de VirusTotal y contexto proporcionado por el editor.
Las señales de análisis estático son contexto interno para esta revisión; no constituyen una
sección pública independiente de la auditoría ni un veredicto que bloquee la instalación.

El análisis de riesgos utiliza el
[Top 10 de Skills agénticas de OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
como marco para riesgos como la inyección de prompts, el uso indebido de herramientas, la exposición de credenciales,
la ejecución insegura, el envenenamiento de la memoria o del contexto y la autonomía excesiva.

ClawScan no considera automáticamente maliciosa una capacidad que parezca alarmante.
Evalúa si la capacidad está declarada, se ajusta al propósito y está respaldada por
el caso de uso indicado para la versión.
