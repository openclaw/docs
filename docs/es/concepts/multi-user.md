---
read_when:
    - Comparte un agente de OpenClaw con otros operadores
    - Necesita comprender los indicadores de propietario y presencia de la sesión
    - Está decidiendo si un agente compartido proporciona suficiente aislamiento
summary: Cómo funcionan la propiedad de las sesiones y la presencia cuando varias personas operan un agente
title: Modo multiusuario
x-i18n:
    generated_at: "2026-07-22T13:19:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0e2a580663dd134c5ef5b034889f17f75b2d63f5a8c69c01affa5b8375b8a419
    source_path: concepts/multi-user.md
    workflow: 16
---

El modo multiusuario permite que varias personas de confianza operen el mismo agente de OpenClaw. Añade la propiedad de las sesiones, la presencia en tiempo real y el filtrado por creador para que un equipo pueda saber quién inició el trabajo y quién lo está observando en ese momento.

## Límite de confianza

Cualquier persona que pueda operar un agente puede hacer que realice cualquier acción que ese agente pueda ejecutar. La propiedad de las sesiones, la visibilidad en la barra lateral y los indicadores de presencia son funciones de usabilidad, no límites de seguridad.

Si las personas no deben acceder a las sesiones, herramientas, credenciales o archivos de otras, asígneles agentes independientes o límites de confianza de Gateway/host separados. No dependa de los avatares de propietario ni de los filtros para el aislamiento.

## Propiedad y presencia

Las sesiones nuevas registran a su creador cuando el Gateway dispone de una identidad de confianza. La identidad del proxy de confianza tiene prioridad; de lo contrario, OpenClaw utiliza la etiqueta de operador o el nombre para mostrar del dispositivo emparejado. Las sesiones anteriores y las creadas sin ninguna de estas identidades no tienen ninguna marca de propietario.

La aplicación web mantiene la propiedad y la presencia visualmente diferenciadas:

- Un avatar de propietario sólido es permanente durante toda la vida útil de esa sesión.
- Los avatares de presencia con borde o translúcidos muestran a las personas que están conectadas u observando en ese momento.
- El filtro de personas de la barra lateral muestra las sesiones creadas por una identidad, a la vez que conserva los grupos personalizados existentes.

Cuando aparecen menos de dos creadores distintos en la lista de sesiones cargada, OpenClaw oculta todos los elementos visuales de propiedad y del filtro de personas. Por lo tanto, un Gateway de un solo usuario mantiene el mismo aspecto.

## Atribución de turnos

La atribución del remitente de cada turno se realiza en la medida de lo posible. La intervención puede combinar entradas con un turno activo, por lo que la transcripción no siempre puede representar la contribución de cada persona como un turno independiente.

## Contenido relacionado

- [La sesión principal](/es/concepts/main-session)
- [Gestión de sesiones](/es/concepts/session)
- [Presencia](/es/concepts/presence)
- [Seguridad del Gateway](/es/gateway/security)
