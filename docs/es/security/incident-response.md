---
read_when:
    - Responder a un informe de seguridad o a un presunto incidente de seguridad
    - Preparación de una divulgación coordinada o de una versión de seguridad con parche
    - Revisión de las expectativas de seguimiento posterior al incidente
summary: Cómo OpenClaw clasifica los incidentes de seguridad, responde a ellos y les da seguimiento
title: Respuesta a incidentes
x-i18n:
    generated_at: "2026-05-03T21:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Respuesta a incidentes

## 1. Detección y triaje

Monitorizamos señales de seguridad de:

- GitHub Security Advisories (GHSA) e informes privados de vulnerabilidades.
- Issues/discusiones públicas de GitHub cuando los informes no son sensibles.
- Señales automatizadas (por ejemplo, Dependabot, CodeQL, avisos de npm y escaneo de secretos).

Triaje inicial:

1. Confirmar el componente afectado, la versión y el impacto en el límite de confianza.
2. Clasificar como problema de seguridad frente a endurecimiento/sin acción usando el alcance de `SECURITY.md` del repositorio y las reglas fuera de alcance.
3. Un responsable del incidente responde según corresponda.

## 2. Evaluación

Guía de gravedad:

- **Crítica:** Compromiso de paquete/lanzamiento/repositorio, explotación activa o elusión no autenticada de un límite de confianza con control de alto impacto o exposición de datos.
- **Alta:** Elusión verificada de un límite de confianza que requiere precondiciones limitadas (por ejemplo, acción autenticada pero no autorizada de alto impacto), o exposición de credenciales sensibles propiedad de OpenClaw.
- **Media:** Debilidad de seguridad significativa con impacto práctico pero explotabilidad limitada o requisitos previos sustanciales.
- **Baja:** Hallazgos de defensa en profundidad, denegación de servicio de alcance limitado o brechas de endurecimiento/paridad sin una elusión demostrada de un límite de confianza.

## 3. Respuesta

1. Acusar recibo al informante (en privado cuando sea sensible).
2. Reproducir en versiones compatibles y en el `main` más reciente, luego implementar y validar un parche con cobertura de regresión.
3. Para incidentes críticos/altos, preparar versiones parcheadas tan rápido como sea práctico.
4. Para incidentes medios/bajos, parchear en el flujo normal de lanzamientos y documentar la orientación de mitigación.

## 4. Comunicación

Comunicamos a través de:

- GitHub Security Advisories en el repositorio afectado.
- Notas de lanzamiento/entradas del registro de cambios para versiones corregidas.
- Seguimiento directo con el informante sobre el estado y la resolución.

Política de divulgación:

- Los incidentes críticos/altos deben recibir una divulgación coordinada, con emisión de CVE cuando corresponda.
- Los hallazgos de endurecimiento de bajo riesgo pueden documentarse en notas de lanzamiento o avisos sin CVE, según el impacto y la exposición de los usuarios.

## 5. Recuperación y seguimiento

Después de publicar la corrección:

1. Verificar las remediaciones en CI y los artefactos de lanzamiento.
2. Ejecutar una breve revisión posterior al incidente (cronología, causa raíz, brecha de detección, plan de prevención).
3. Añadir tareas de seguimiento de endurecimiento/pruebas/documentación y hacerles seguimiento hasta su finalización.
