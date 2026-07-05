---
read_when:
    - Responder a un informe de seguridad o a un incidente de seguridad sospechado
    - Preparar una divulgación coordinada o una versión de seguridad parcheada
    - Revisión de las expectativas de seguimiento posteriores al incidente
summary: Cómo OpenClaw clasifica, responde y da seguimiento a los incidentes de seguridad
title: Respuesta a incidentes
x-i18n:
    generated_at: "2026-07-05T11:46:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detección y triage

Las señales de seguridad provienen de:

- GitHub Security Advisories (GHSA) e informes privados de vulnerabilidades.
- Issues/discussions públicos de GitHub cuando los informes no son sensibles.
- Señales automatizadas: Dependabot, CodeQL, avisos de npm, escaneo de secretos.

Triage inicial:

1. Confirmar el componente afectado, la versión y el impacto en el límite de confianza.
2. Clasificarlo como un problema de seguridad frente a refuerzo/sin acción, usando las reglas de alcance y fuera de alcance de `SECURITY.md`.
3. Un responsable del incidente responde según corresponda.

## 2. Severidad

| Severidad | Definición                                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crítica   | Compromiso de paquete/lanzamiento/repositorio, explotación activa o evasión no autenticada del límite de confianza con control de alto impacto o exposición de datos.                       |
| Alta      | Evasión verificada del límite de confianza que requiere precondiciones limitadas (por ejemplo, una acción autenticada pero no autorizada de alto impacto), o exposición de credenciales sensibles propiedad de OpenClaw. |
| Media     | Debilidad de seguridad significativa con impacto práctico, pero con explotabilidad limitada o requisitos previos sustanciales.                                                               |
| Baja      | Hallazgos de defensa en profundidad, denegación de servicio de alcance reducido o brechas de refuerzo/paridad sin una evasión demostrada del límite de confianza.                            |

## 3. Respuesta

1. Confirmar la recepción al informante (en privado cuando sea sensible).
2. Reproducir en versiones compatibles y en la última versión de `main`, luego implementar y validar un parche con cobertura de regresión.
3. Crítica/alta: preparar versiones parcheadas tan rápido como sea práctico.
4. Media/baja: parchear en el flujo normal de lanzamiento y documentar la guía de mitigación.

## 4. Comunicación y divulgación

Comunicar a través de GitHub Security Advisories en el repositorio afectado, notas de lanzamiento/entradas del registro de cambios para las versiones corregidas y seguimiento directo con el informante sobre el estado y la resolución.

Los incidentes críticos/altos reciben divulgación coordinada, con emisión de CVE cuando corresponda. Los hallazgos de refuerzo de bajo riesgo pueden documentarse en notas de lanzamiento o avisos sin un CVE, según el impacto y la exposición del usuario.

## 5. Recuperación y seguimiento

Después de publicar la corrección:

1. Verificar las remediaciones en CI y en los artefactos de lanzamiento.
2. Realizar una breve revisión posterior al incidente: cronología, causa raíz, brecha de detección, plan de prevención.
3. Agregar tareas de seguimiento de refuerzo/pruebas/docs y hacerles seguimiento hasta completarlas.

## Relacionado

- [Política de seguridad](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — alcance de los informes y modelo de confianza.
- [Modelo de amenazas](/es/security/THREAT-MODEL-ATLAS)
