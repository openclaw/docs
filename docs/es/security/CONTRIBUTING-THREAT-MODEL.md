---
read_when:
    - Quieres aportar hallazgos de seguridad o escenarios de amenazas
    - Revisar o actualizar el modelo de amenazas
summary: Cómo contribuir al modelo de amenazas de OpenClaw
title: Contribuir al modelo de amenazas
x-i18n:
    generated_at: "2026-05-06T18:00:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Gracias por ayudar a hacer que OpenClaw sea más seguro. Este modelo de amenazas es un documento vivo y agradecemos contribuciones de cualquier persona; no necesitas ser experto en seguridad.

## Formas de contribuir

### Añadir una amenaza

¿Detectaste un vector de ataque o un riesgo que no hemos cubierto? Abre un issue en [openclaw/trust](https://github.com/openclaw/trust/issues) y descríbelo con tus propias palabras. No necesitas conocer ningún marco de trabajo ni completar todos los campos; solo describe el escenario.

**Útil incluirlo (pero no obligatorio):**

- El escenario de ataque y cómo podría explotarse
- Qué partes de OpenClaw se ven afectadas (CLI, Gateway, canales, ClawHub, servidores MCP, etc.)
- Qué gravedad crees que tiene (baja / media / alta / crítica)
- Cualquier enlace a investigaciones relacionadas, CVE o ejemplos del mundo real

Nos encargaremos del mapeo de ATLAS, los ID de amenazas y la evaluación de riesgos durante la revisión. Si quieres incluir esos detalles, perfecto, pero no se espera que lo hagas.

> **Esto es para añadir información al modelo de amenazas, no para reportar vulnerabilidades activas.** Si encontraste una vulnerabilidad explotable, consulta nuestra [página de confianza](https://trust.openclaw.ai) para ver las instrucciones de divulgación responsable.

### Sugerir una mitigación

¿Tienes una idea sobre cómo abordar una amenaza existente? Abre un issue o PR que haga referencia a la amenaza. Las mitigaciones útiles son específicas y accionables; por ejemplo, "limitación de tasa por remitente de 10 mensajes/minuto en el Gateway" es mejor que "implementar limitación de tasa".

### Proponer una cadena de ataque

Las cadenas de ataque muestran cómo varias amenazas se combinan en un escenario de ataque realista. Si ves una combinación peligrosa, describe los pasos y cómo un atacante los encadenaría. Una breve narración de cómo se desarrolla el ataque en la práctica es más valiosa que una plantilla formal.

### Corregir o mejorar contenido existente

Errores tipográficos, aclaraciones, información desactualizada, mejores ejemplos: los PR son bienvenidos, no hace falta un issue.

## Qué usamos

### Marco de trabajo MITRE ATLAS

Este modelo de amenazas se basa en [MITRE ATLAS](https://atlas.mitre.org/) (panorama de amenazas adversarias para sistemas de IA), un marco de trabajo diseñado específicamente para amenazas de IA/ML como la inyección de prompts, el uso indebido de herramientas y la explotación de agentes. No necesitas conocer ATLAS para contribuir; mapeamos los envíos al marco de trabajo durante la revisión.

### ID de amenazas

Cada amenaza recibe un ID como `T-EXEC-003`. Las categorías son:

| Código  | Categoría                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconocimiento: recopilación de información |
| ACCESS  | Acceso inicial: obtención de entrada       |
| EXEC    | Ejecución: ejecución de acciones maliciosas |
| PERSIST | Persistencia: mantenimiento del acceso     |
| EVADE   | Evasión de defensas: evitar la detección   |
| DISC    | Descubrimiento: aprendizaje sobre el entorno |
| EXFIL   | Exfiltración: robo de datos                |
| IMPACT  | Impacto: daño o interrupción               |

Los mantenedores asignan los ID durante la revisión. No necesitas elegir uno.

### Niveles de riesgo

| Nivel        | Significado                                                       |
| ------------ | ----------------------------------------------------------------- |
| **Crítico**  | Compromiso total del sistema, o alta probabilidad + impacto crítico |
| **Alto**     | Daño significativo probable, o probabilidad media + impacto crítico |
| **Medio**    | Riesgo moderado, o baja probabilidad + alto impacto               |
| **Bajo**     | Improbable e impacto limitado                                     |

Si no tienes claro el nivel de riesgo, solo describe el impacto y lo evaluaremos.

## Proceso de revisión

1. **Triage**: revisamos los nuevos envíos en un plazo de 48 horas
2. **Evaluación**: verificamos la viabilidad, asignamos el mapeo de ATLAS y el ID de amenaza, validamos el nivel de riesgo
3. **Documentación**: nos aseguramos de que todo tenga el formato correcto y esté completo
4. **Fusión**: se añade al modelo de amenazas y a la visualización

## Recursos

- [Sitio web de ATLAS](https://atlas.mitre.org/)
- [Técnicas de ATLAS](https://atlas.mitre.org/techniques/)
- [Estudios de caso de ATLAS](https://atlas.mitre.org/studies/)
- [Modelo de amenazas de OpenClaw](/es/security/THREAT-MODEL-ATLAS)

## Contacto

- **Vulnerabilidades de seguridad:** consulta nuestra [página de confianza](https://trust.openclaw.ai) para ver las instrucciones de reporte
- **Preguntas sobre el modelo de amenazas:** abre un issue en [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat general:** canal #security de Discord

## Reconocimiento

Los colaboradores del modelo de amenazas reciben reconocimiento en los agradecimientos del modelo de amenazas, las notas de la versión y el salón de la fama de seguridad de OpenClaw por contribuciones significativas.

## Relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Verificación formal](/es/security/formal-verification)
