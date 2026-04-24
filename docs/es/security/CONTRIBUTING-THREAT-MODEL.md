---
read_when:
    - Quieres contribuir hallazgos de seguridad o escenarios de amenazas
    - Revisar o actualizar el modelo de amenazas
summary: Cómo contribuir al modelo de amenazas de OpenClaw
title: Contribuir al modelo de amenazas
x-i18n:
    generated_at: "2026-04-24T05:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Cómo contribuir al modelo de amenazas de OpenClaw

Gracias por ayudar a hacer OpenClaw más seguro. Este modelo de amenazas es un documento vivo y agradecemos contribuciones de cualquier persona: no necesitas ser un experto en seguridad.

## Formas de contribuir

### Añadir una amenaza

¿Has detectado un vector de ataque o un riesgo que no hemos cubierto? Abre un issue en [openclaw/trust](https://github.com/openclaw/trust/issues) y descríbelo con tus propias palabras. No necesitas conocer marcos ni completar todos los campos; basta con describir el escenario.

**Útil incluir (pero no obligatorio):**

- El escenario de ataque y cómo podría explotarse
- Qué partes de OpenClaw están afectadas (CLI, gateway, canales, ClawHub, servidores MCP, etc.)
- Qué severidad crees que tiene (baja / media / alta / crítica)
- Cualquier enlace a investigación relacionada, CVE o ejemplos del mundo real

Nosotros nos ocuparemos del mapeo ATLAS, los ids de amenazas y la evaluación de riesgos durante la revisión. Si quieres incluir esos detalles, genial, pero no se espera.

> **Esto es para añadir contenido al modelo de amenazas, no para informar vulnerabilidades activas.** Si has encontrado una vulnerabilidad explotable, consulta nuestra [página de Trust](https://trust.openclaw.ai) para ver instrucciones de divulgación responsable.

### Sugerir una mitigación

¿Tienes una idea para abordar una amenaza existente? Abre un issue o una PR haciendo referencia a la amenaza. Las mitigaciones útiles son específicas y accionables: por ejemplo, «limitación por remitente a 10 mensajes/minuto en el gateway» es mejor que «implementar rate limiting».

### Proponer una cadena de ataque

Las cadenas de ataque muestran cómo múltiples amenazas se combinan en un escenario de ataque realista. Si ves una combinación peligrosa, describe los pasos y cómo un atacante los encadenaría. Una narrativa breve de cómo se desarrolla el ataque en la práctica es más valiosa que una plantilla formal.

### Corregir o mejorar contenido existente

Errores tipográficos, aclaraciones, información desactualizada, mejores ejemplos: las PR son bienvenidas, sin necesidad de issue.

## Qué usamos

### MITRE ATLAS

Este modelo de amenazas se basa en [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un marco diseñado específicamente para amenazas de IA/ML como inyección de prompts, mal uso de herramientas y explotación de agentes. No necesitas conocer ATLAS para contribuir: nosotros mapeamos las aportaciones al marco durante la revisión.

### Ids de amenazas

Cada amenaza recibe un id como `T-EXEC-003`. Las categorías son:

| Código  | Categoría                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconocimiento - recopilación de información |
| ACCESS  | Acceso inicial - obtención de entrada      |
| EXEC    | Ejecución - ejecución de acciones maliciosas |
| PERSIST | Persistencia - mantenimiento del acceso    |
| EVADE   | Evasión de defensas - evitar la detección  |
| DISC    | Descubrimiento - aprender sobre el entorno |
| EXFIL   | Exfiltración - robo de datos               |
| IMPACT  | Impacto - daño o interrupción              |

Los mantenedores asignan los ids durante la revisión. No necesitas elegir uno.

### Niveles de riesgo

| Nivel        | Significado                                                        |
| ------------ | ------------------------------------------------------------------ |
| **Crítico**  | Compromiso completo del sistema, o alta probabilidad + impacto crítico |
| **Alto**     | Daño significativo probable, o probabilidad media + impacto crítico |
| **Medio**    | Riesgo moderado, o baja probabilidad + alto impacto                |
| **Bajo**     | Poco probable y de impacto limitado                                |

Si no estás seguro del nivel de riesgo, simplemente describe el impacto y nosotros lo evaluaremos.

## Proceso de revisión

1. **Triage** - Revisamos nuevas aportaciones en un plazo de 48 horas
2. **Evaluación** - Verificamos viabilidad, asignamos mapeo ATLAS e id de amenaza, validamos el nivel de riesgo
3. **Documentación** - Nos aseguramos de que todo esté formateado y completo
4. **Merge** - Se añade al modelo de amenazas y a la visualización

## Recursos

- [Sitio web de ATLAS](https://atlas.mitre.org/)
- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Casos de estudio ATLAS](https://atlas.mitre.org/studies/)
- [Modelo de amenazas de OpenClaw](/es/security/THREAT-MODEL-ATLAS)

## Contacto

- **Vulnerabilidades de seguridad:** consulta nuestra [página de Trust](https://trust.openclaw.ai) para instrucciones de reporte
- **Preguntas sobre el modelo de amenazas:** abre un issue en [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat general:** canal #security de Discord

## Reconocimiento

Las personas que contribuyen al modelo de amenazas reciben reconocimiento en los agradecimientos del modelo de amenazas, en las notas de lanzamiento y en el salón de la fama de seguridad de OpenClaw por contribuciones significativas.

## Relacionado

- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
- [Verificación formal](/es/security/formal-verification)
