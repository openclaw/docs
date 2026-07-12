---
read_when:
    - Quieres contribuir con hallazgos de seguridad o escenarios de amenazas
    - Revisión o actualización del modelo de amenazas
summary: Cómo contribuir al modelo de amenazas de OpenClaw
title: Contribuir al modelo de amenazas
x-i18n:
    generated_at: "2026-07-11T23:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

El [modelo de amenazas](/es/security/THREAT-MODEL-ATLAS) es un documento en constante evolución. Se aceptan contribuciones de cualquier persona; no es necesario tener experiencia en seguridad ni en MITRE ATLAS.

<Note>
Esto es para realizar aportaciones al modelo de amenazas, no para informar sobre vulnerabilidades activas. Si ha encontrado una vulnerabilidad explotable, siga en su lugar las instrucciones de divulgación responsable de la [página de confianza](https://trust.openclaw.ai).
</Note>

## Formas de contribuir

**Añadir una amenaza.** Abra una incidencia en [openclaw/trust](https://github.com/openclaw/trust/issues) y describa el escenario de ataque con sus propias palabras. Resulta útil, aunque no es obligatorio, incluir:

- El escenario de ataque y cómo podría explotarse.
- Los componentes afectados (CLI, Gateway, canales, ClawHub, servidores MCP, etc.).
- Su estimación de la gravedad (baja / media / alta / crítica).
- Enlaces a investigaciones relacionadas, CVE o ejemplos reales.

Durante la revisión, los responsables de mantenimiento asignan la correspondencia con ATLAS, el identificador de la amenaza y el nivel de riesgo.

**Sugerir una mitigación.** Abra una incidencia o una PR que haga referencia a la amenaza. Sea específico y proponga medidas concretas: «limitar en el Gateway la frecuencia por remitente a 10 mensajes por minuto» resulta más útil que «implementar una limitación de frecuencia».

**Proponer una cadena de ataque.** Las cadenas de ataque muestran cómo se combinan varias amenazas en un escenario realista. Describa los pasos y cómo los encadenaría un atacante; una breve narración es preferible a una plantilla formal.

**Corregir o mejorar el contenido existente.** Erratas, aclaraciones, información obsoleta o mejores ejemplos: se aceptan PR sin necesidad de abrir una incidencia.

## Referencia del marco

Las amenazas se corresponden con [MITRE ATLAS](https://atlas.mitre.org/) (panorama de amenazas adversarias para sistemas de IA), un marco para amenazas específicas de IA y aprendizaje automático, como la inyección de instrucciones, el uso indebido de herramientas y la explotación de agentes. No es necesario conocer ATLAS para contribuir; los responsables de mantenimiento asignan las correspondencias durante la revisión.

**Identificadores de amenazas.** Cada amenaza recibe un identificador como `T-EXEC-003`, asignado por los responsables de mantenimiento durante la revisión.

| Código  | Categoría                                        |
| ------- | ------------------------------------------------ |
| RECON   | Reconocimiento: recopilación de información      |
| ACCESS  | Acceso inicial: obtención de acceso              |
| EXEC    | Ejecución: realización de acciones maliciosas    |
| PERSIST | Persistencia: mantenimiento del acceso           |
| EVADE   | Evasión de defensas: elusión de la detección     |
| DISC    | Descubrimiento: conocimiento del entorno         |
| EXFIL   | Exfiltración: robo de datos                      |
| IMPACT  | Impacto: daños o interrupciones                  |

**Niveles de riesgo.** Si no está seguro del nivel, limítese a describir el impacto; los responsables de mantenimiento lo evaluarán.

| Nivel       | Significado                                                         |
| ----------- | ------------------------------------------------------------------- |
| **Crítico** | Compromiso total del sistema, o alta probabilidad + impacto crítico |
| **Alto**    | Daños significativos probables, o probabilidad media + impacto crítico |
| **Medio**   | Riesgo moderado, o baja probabilidad + impacto alto                 |
| **Bajo**    | Impacto improbable y limitado                                      |

## Proceso de revisión

1. **Clasificación inicial**: las nuevas propuestas se revisan en un plazo de 48 horas.
2. **Evaluación**: los responsables de mantenimiento verifican la viabilidad, asignan la correspondencia con ATLAS y el identificador de la amenaza, y validan el nivel de riesgo.
3. **Documentación**: se comprueban el formato y la integridad.
4. **Fusión**: se añade al modelo de amenazas y a la visualización.

## Recursos

- [Sitio web de ATLAS](https://atlas.mitre.org/)
- [Técnicas de ATLAS](https://atlas.mitre.org/techniques/)
- [Casos prácticos de ATLAS](https://atlas.mitre.org/studies/)

## Contacto

- **Vulnerabilidades de seguridad:** consulte las instrucciones para informar de ellas en la [página de confianza](https://trust.openclaw.ai) o escriba a `security@openclaw.ai`.
- **Preguntas sobre el modelo de amenazas:** abra una incidencia en [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Conversación general:** canal `#security` de Discord.

## Reconocimiento

Las personas que contribuyen al modelo de amenazas reciben reconocimiento en los agradecimientos del modelo de amenazas, en las notas de la versión y, en el caso de contribuciones significativas, en el salón de la fama de seguridad de OpenClaw.

## Contenido relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Respuesta ante incidentes](/es/security/incident-response)
- [Verificación formal](/es/security/formal-verification)
