---
read_when:
    - Respuesta ante un informe de seguridad o un posible incidente de seguridad
    - Preparación de una divulgación coordinada o una versión de seguridad corregida
    - Revisión de las expectativas de seguimiento posterior al incidente
summary: Cómo OpenClaw clasifica, responde y realiza el seguimiento de los incidentes de seguridad
title: Respuesta ante incidentes
x-i18n:
    generated_at: "2026-07-11T23:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detección y triaje

Las señales de seguridad provienen de:

- Avisos de seguridad de GitHub (GHSA) e informes privados de vulnerabilidades.
- Issues y debates públicos de GitHub cuando los informes no son confidenciales.
- Señales automatizadas: Dependabot, CodeQL, avisos de npm y análisis de secretos.

Triaje inicial:

1. Confirmar el componente y la versión afectados, así como el impacto en los límites de confianza.
2. Clasificarlo como un problema de seguridad o como una medida de refuerzo/sin acción, según las reglas de ámbito y exclusión de ámbito de `SECURITY.md`.
3. La persona responsable del incidente responde según corresponda.

## 2. Gravedad

| Gravedad | Definición                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crítica  | Compromiso de un paquete, una versión o un repositorio; explotación activa; o elusión no autenticada de un límite de confianza con control de alto impacto o exposición de datos.                           |
| Alta     | Elusión verificada de un límite de confianza que requiere condiciones previas limitadas (por ejemplo, una acción autenticada pero no autorizada de alto impacto), o exposición de credenciales confidenciales propiedad de OpenClaw. |
| Media    | Debilidad de seguridad significativa con impacto práctico, pero con una capacidad de explotación limitada o requisitos previos considerables.                                                              |
| Baja     | Hallazgos de defensa en profundidad, denegación de servicio de ámbito limitado o carencias de refuerzo o paridad sin una elusión demostrada de un límite de confianza.                                     |

## 3. Respuesta

1. Confirmar la recepción al informante (de forma privada cuando sea confidencial).
2. Reproducir el problema en las versiones compatibles y en la última versión de `main`; después, implementar y validar un parche con cobertura de regresión.
3. Crítica/alta: preparar las versiones corregidas tan rápido como sea posible.
4. Media/baja: aplicar el parche mediante el flujo normal de versiones y documentar las medidas de mitigación.

## 4. Comunicación y divulgación

Comunicarse mediante los avisos de seguridad de GitHub del repositorio afectado, las notas de la versión o entradas del registro de cambios de las versiones corregidas y el seguimiento directo con el informante sobre el estado y la resolución.

Los incidentes críticos o de gravedad alta se divulgan de forma coordinada y se emite un CVE cuando corresponde. Los hallazgos de refuerzo de bajo riesgo pueden documentarse en las notas de la versión o en avisos sin un CVE, según el impacto y la exposición de los usuarios.

## 5. Recuperación y seguimiento

Después de publicar la corrección:

1. Verificar las medidas correctivas en CI y en los artefactos de la versión.
2. Realizar una breve revisión posterior al incidente: cronología, causa raíz, carencia de detección y plan de prevención.
3. Añadir tareas de seguimiento de refuerzo, pruebas y documentación, y realizar su seguimiento hasta completarlas.

## Contenido relacionado

- [Política de seguridad](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — ámbito de los informes y modelo de confianza.
- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
