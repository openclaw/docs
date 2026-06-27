---
read_when:
    - Respuesta a un informe de seguridad o a un presunto incidente de seguridad
    - Preparación de una divulgación coordinada o una versión de seguridad con parche
    - Revisión de las expectativas de seguimiento posterior al incidente
summary: Cómo OpenClaw clasifica, responde y da seguimiento a los incidentes de seguridad
title: Respuesta a incidentes
x-i18n:
    generated_at: "2026-05-06T05:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 1. Detección y triaje

Monitoreamos señales de seguridad de:

- Avisos de seguridad de GitHub (GHSA) e informes privados de vulnerabilidades.
- Incidencias/discusiones públicas de GitHub cuando los informes no son sensibles.
- Señales automatizadas (por ejemplo Dependabot, CodeQL, avisos de npm y escaneo de secretos).

Triaje inicial:

1. Confirmar el componente afectado, la versión y el impacto en los límites de confianza.
2. Clasificar como problema de seguridad frente a endurecimiento/sin acción usando el alcance y las reglas de fuera de alcance del repositorio `SECURITY.md`.
3. Un responsable del incidente responde según corresponda.

## 2. Evaluación

Guía de gravedad:

- **Crítica:** Compromiso de paquete/lanzamiento/repositorio, explotación activa o elusión no autenticada de un límite de confianza con control de alto impacto o exposición de datos.
- **Alta:** Elusión verificada de un límite de confianza que requiere precondiciones limitadas (por ejemplo, acción autenticada pero no autorizada de alto impacto), o exposición de credenciales sensibles propiedad de OpenClaw.
- **Media:** Debilidad de seguridad significativa con impacto práctico pero explotabilidad limitada o requisitos previos sustanciales.
- **Baja:** Hallazgos de defensa en profundidad, denegación de servicio de alcance reducido o brechas de endurecimiento/paridad sin una elusión demostrada de un límite de confianza.

## 3. Respuesta

1. Acusar recibo al informante (en privado cuando sea sensible).
2. Reproducir en lanzamientos compatibles y en la versión más reciente de `main`, luego implementar y validar un parche con cobertura de regresión.
3. Para incidentes críticos/altos, preparar lanzamientos parcheados tan rápido como sea práctico.
4. Para incidentes medios/bajos, parchear en el flujo normal de lanzamientos y documentar orientación de mitigación.

## 4. Comunicación

Nos comunicamos mediante:

- Avisos de seguridad de GitHub en el repositorio afectado.
- Notas de lanzamiento/entradas del registro de cambios para versiones corregidas.
- Seguimiento directo con el informante sobre el estado y la resolución.

Política de divulgación:

- Los incidentes críticos/altos deben recibir divulgación coordinada, con emisión de CVE cuando corresponda.
- Los hallazgos de endurecimiento de bajo riesgo pueden documentarse en notas de lanzamiento o avisos sin CVE, según el impacto y la exposición de los usuarios.

## 5. Recuperación y seguimiento

Después de publicar la corrección:

1. Verificar las remediaciones en CI y en los artefactos de lanzamiento.
2. Realizar una breve revisión posterior al incidente (cronología, causa raíz, brecha de detección, plan de prevención).
3. Agregar tareas de seguimiento de endurecimiento/pruebas/documentación y hacerles seguimiento hasta completarlas.
