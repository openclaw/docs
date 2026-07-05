---
read_when:
    - Planificación de una modernización amplia de la aplicación OpenClaw
    - Actualización de los estándares de implementación frontend para trabajos en aplicaciones o en la interfaz de usuario de Control
    - Convertir una revisión amplia de calidad del producto en trabajo de ingeniería por fases
summary: Plan integral de modernización de aplicaciones con actualizaciones de Skills para la entrega de frontend
title: Plan de modernización de aplicaciones
x-i18n:
    generated_at: "2026-07-05T11:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94d9afca6acbf19a93c265bb98f0fc0fcd85da8808680fa41d29d8c198bacb88
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Objetivo

Mover la aplicación hacia un producto más limpio, rápido y mantenible sin romper los flujos de trabajo actuales ni ocultar riesgos en refactorizaciones amplias. Entregar segmentos pequeños y revisables con pruebas para cada superficie modificada.

## Principios

- Preservar la arquitectura actual salvo que se demuestre que un límite causa rotación, coste de rendimiento o errores visibles para el usuario.
- Preferir el parche correcto más pequeño para cada problema y luego repetir.
- Separar las correcciones necesarias del pulido opcional para que los mantenedores puedan integrar trabajo de alto valor sin esperar decisiones subjetivas.
- Mantener documentado y compatible hacia atrás el comportamiento orientado a plugins.
- Verificar el comportamiento publicado, los contratos de dependencias y las pruebas antes de afirmar que una regresión está corregida.
- Mejorar primero la ruta principal del usuario: incorporación, autenticación, chat, configuración de proveedores, gestión de plugins y diagnósticos.

## Fase 1: Auditoría de referencia

Inventariar la aplicación actual antes de cambiarla.

- Identificar los principales flujos de trabajo de usuario y las superficies de código que los poseen.
- Listar posibilidades de acción obsoletas, ajustes duplicados, estados de error poco claros y rutas de renderizado costosas.
- Capturar los comandos de validación actuales para cada superficie.
- Marcar los problemas como requeridos, recomendados u opcionales.
- Documentar los bloqueos conocidos que necesitan revisión del propietario, especialmente cambios de API, seguridad, release y contrato de plugins.

Definición de terminado:

- Una lista de problemas con referencias de archivos desde la raíz del repo.
- Cada problema tiene severidad, superficie propietaria, impacto esperado en el usuario y una ruta de validación propuesta.
- No hay elementos de limpieza especulativa mezclados con correcciones requeridas.

## Fase 2: Limpieza de producto y UX

Priorizar los flujos de trabajo visibles y eliminar la confusión.

- Ajustar el texto de incorporación y los estados vacíos en torno a la autenticación de modelos, el estado del gateway y la configuración de plugins.
- Eliminar o desactivar posibilidades de acción obsoletas donde no haya ninguna acción posible.
- Mantener visibles las acciones importantes en anchos responsivos en lugar de ocultarlas tras supuestos frágiles de maquetación.
- Consolidar el lenguaje de estado repetido para que los errores tengan una única fuente de verdad.
- Añadir divulgación progresiva para ajustes avanzados mientras se mantiene rápida la configuración básica.

Validación recomendada:

- Ruta feliz manual para la configuración inicial y el arranque de usuarios existentes.
- Pruebas enfocadas para cualquier lógica de enrutamiento, persistencia de configuración o derivación de estado.
- Capturas de navegador para superficies responsivas modificadas.

## Fase 3: Ajuste de arquitectura frontend

Mejorar la mantenibilidad sin una reescritura amplia.

- Mover transformaciones repetidas de estado de UI a helpers tipados y estrechos.
- Mantener separadas las responsabilidades de obtención de datos, persistencia y presentación.
- Preferir hooks, stores y patrones de componentes existentes antes que nuevas abstracciones.
- Dividir componentes demasiado grandes solo cuando reduzca el acoplamiento o aclare las pruebas.
- Evitar introducir estado global amplio para interacciones locales de paneles.

Barandillas requeridas:

- No cambiar el comportamiento público como efecto secundario de dividir archivos.
- Mantener intacto el comportamiento de accesibilidad para menús, diálogos, pestañas y navegación por teclado.
- Verificar que los estados de carga, vacío, error y optimistas sigan renderizándose.

## Fase 4: Rendimiento y fiabilidad

Atacar el dolor medido en lugar de una optimización teórica amplia.

- Medir los costes de arranque, transición de rutas, listas grandes y transcripciones de chat.
- Sustituir datos derivados costosos repetidos por selectores memorizados o helpers en caché cuando el perfilado demuestre valor.
- Reducir escaneos evitables de red o sistema de archivos en rutas calientes.
- Mantener un orden determinista para entradas de prompts, registros, archivos, plugins y red antes de construir payloads de modelo.
- Añadir pruebas de regresión ligeras para helpers calientes y límites de contrato.

Definición de terminado:

- Cada cambio de rendimiento registra referencia, impacto esperado, impacto real y brecha restante.
- Ningún parche de rendimiento se integra solo por intuición cuando hay medición barata disponible.

## Fase 5: Refuerzo de tipos, contratos y pruebas

Elevar la corrección en los puntos de frontera de los que dependen usuarios y autores de plugins.

- Sustituir cadenas de runtime laxas por uniones discriminadas o listas cerradas de códigos.
- Validar entradas externas con helpers de esquema existentes o zod.
- Añadir pruebas de contrato en torno a manifiestos de plugins, catálogos de proveedores, mensajes de protocolo del gateway y comportamiento de migración de configuración.
- Mantener las rutas de compatibilidad en flujos de doctor o reparación en lugar de migraciones ocultas durante el arranque.
- Evitar acoplamiento solo de pruebas a internos de plugins; usar fachadas del SDK y barrels documentados.

Validación recomendada:

- `pnpm check:changed`
- Pruebas dirigidas para cada límite modificado.
- `pnpm build` cuando cambien límites lazy, empaquetado o superficies publicadas.

## Fase 6: Documentación y preparación de release

Mantener los documentos orientados al usuario alineados con el comportamiento.

- Actualizar la documentación con cambios de comportamiento, API, configuración, incorporación o plugins.
- Añadir entradas al changelog solo para cambios visibles para el usuario.
- Mantener la terminología de plugins orientada al usuario; usar nombres de paquetes internos solo cuando sea necesario para colaboradores.
- Confirmar que las instrucciones de release e instalación sigan coincidiendo con la superficie actual de comandos.

Definición de terminado:

- La documentación relevante se actualiza en la misma rama que los cambios de comportamiento.
- Las comprobaciones de documentación generada o deriva de API pasan cuando se tocan.
- La entrega nombra cualquier validación omitida y por qué se omitió.

## Primer segmento recomendado

Empezar con una pasada acotada de Control UI e incorporación:

- Auditar las superficies de configuración inicial, preparación de autenticación de proveedores, estado del gateway y configuración de plugins.
- Eliminar acciones obsoletas y aclarar estados de fallo.
- Añadir o actualizar pruebas enfocadas para derivación de estado y persistencia de configuración.
- Ejecutar `pnpm check:changed`.

Esto ofrece alto valor al usuario con riesgo arquitectónico limitado.

## Actualización de skill frontend

Usa esta sección para actualizar el `SKILL.md` enfocado en frontend suministrado con la tarea de modernización. Si adoptas esta guía como una skill local del repo para OpenClaw, crea primero `.agents/skills/openclaw-frontend/SKILL.md`, conserva el frontmatter que pertenece a esa skill de destino y luego añade o sustituye la guía del cuerpo con el siguiente contenido.

```markdown
# Estándares de entrega frontend

Usa esta skill al implementar o revisar trabajo de UI orientado al usuario en React, Next.js,
webview de escritorio o aplicación.

## Reglas operativas

- Empieza desde el flujo de trabajo del producto existente y las convenciones de código.
- Prefiere el parche correcto más pequeño que mejore la ruta actual del usuario.
- Separa las correcciones requeridas del pulido opcional en la entrega.
- No construyas páginas de marketing cuando la solicitud sea para una superficie de aplicación.
- Mantén las acciones visibles y utilizables en los tamaños de viewport soportados.
- Elimina posibilidades de acción obsoletas en lugar de dejar controles que no pueden actuar.
- Preserva estados de carga, vacío, error, éxito y permisos.
- Usa componentes del sistema de diseño, hooks, stores e iconos existentes antes de añadir
  primitivas nuevas.

## Lista de implementación

1. Identifica la tarea principal del usuario y el componente o ruta que la posee.
2. Lee los patrones de componentes locales antes de editar.
3. Parchea la superficie más estrecha que resuelva el problema.
4. Añade restricciones responsivas para controles de formato fijo, barras de herramientas, cuadrículas y
   contadores para que el texto y los estados hover no puedan redimensionar la maquetación inesperadamente.
5. Mantén claras las responsabilidades de carga de datos, derivación de estado y renderizado.
6. Añade pruebas cuando cambien lógica, persistencia, enrutamiento, permisos o helpers compartidos.
7. Verifica la ruta feliz principal y el caso límite más relevante.

## Controles de calidad visual

- El texto debe caber dentro de su contenedor en móvil y escritorio.
- Las barras de herramientas pueden envolverse, pero los controles deben seguir siendo alcanzables.
- Los botones deberían usar iconos familiares cuando el icono sea más claro que el texto.
- Las cards deberían usarse para elementos repetidos, modales y herramientas enmarcadas, no para
  cada sección de página.
- Evita paletas de color monótonas y fondos decorativos que compitan con
  contenido operativo.
- Las superficies densas de producto deberían optimizarse para escaneo, comparación y uso
  repetido.

## Formato de entrega

Reporta:

- Qué cambió.
- Qué comportamiento de usuario cambió.
- Validación requerida que pasó.
- Cualquier validación omitida y la razón concreta.
- Trabajo de seguimiento opcional, separado claramente de las correcciones requeridas.
```
