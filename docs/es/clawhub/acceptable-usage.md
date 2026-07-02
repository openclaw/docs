---
read_when:
    - Revisar cargas para detectar abuso o infracciones de políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si una skill debe ocultarse o si se debe expulsar a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-02T07:54:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos de marketplace para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación pertenece en
ClawHub.

Estas reglas se aplican a lo que hace un listado, lo que pide a los usuarios que ejecuten, cómo se
representa a sí mismo y cómo los publicadores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para los estados de moderación y la situación de la cuenta, consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulta [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub da la bienvenida al contenido que es útil, comprensible y publicado de buena
fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de desarrollo                           | El listado ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de IU, datos y automatización               | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen rutas de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abuso | La herramienta está planteada para revisión autorizada, preserva evidencia y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo usa cuentas basadas en consentimiento, configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada listado es distinto, útil, descrito con precisión y mantenido razonablemente.                                                |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo acotado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de seguridad                      | Elusión de autenticación, toma de control de cuentas, abuso de límites de tasa, toma de control de llamadas en vivo o agentes, robo de sesiones reutilizables o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                                                                                                                   |
| Abuso de plataformas y evasión de bloqueos                              | Cuentas encubiertas después de bloqueos, preparación o cultivo de cuentas, interacción falsa, automatización de múltiples cuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de identidad sintética para fraude o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                                    |
| Enriquecimiento o vigilancia invasivos de la privacidad                 | Extracción de contactos para spam, doxxing, acoso, extracción de prospectos combinada con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida o uso de datos filtrados o volcados de brechas.                                                                                                                  |
| Suplantación no consentida o manipulación de identidad       | Intercambio de rostro, gemelos digitales, influencers clonados, personas falsas u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con seguridad deshabilitada | Generación de imágenes, videos o contenido NSFW; envoltorios de contenido para adultos alrededor de API de terceros; o listados cuyo propósito principal sea contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores pipe-to-shell como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara o metadatos que ocultan lo que el listado realmente necesita para ejecutarse. |
| Material que infringe derechos de autor o vulnera derechos           | Republicar el Skill, plugin, documentación, activos de marca o código propietario de otra persona sin permiso; violar términos de licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento de marketplace no permitido

ClawHub también revisa cómo los publicadores usan el marketplace. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento de marketplace no permitido incluye:

- publicar en bloque grandes cantidades de listados de bajo esfuerzo, duplicativos, de marcador de posición o
  generados por máquina que no parecen tener valor real para los usuarios
- saturar las superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de listados con poco o ningún uso, mantenimiento, claridad de origen
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de interacción
  mediante automatización, bucles de autoinstalación, cuentas falsas, actividad coordinada,
  interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir la moderación, bloqueos, límites de publicador o
  revisión del marketplace
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se ha ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de alto volumen no es automáticamente abuso. Los catálogos grandes son aceptables
cuando los listados son significativamente diferentes, están descritos con precisión, se mantienen
y son usados por usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con listados superficiales, duplicativos, engañosos, sin mantenimiento o
promocionados artificialmente.

## Derechos de contenido

Si crees que contenido en ClawHub infringe tus derechos de autor u otros derechos, usa
[Solicitudes de derechos de contenido](/es/clawhub/content-rights). No uses reportes normales del marketplace
para reclamaciones de derechos de autor o derechos, a menos que el listado también sea inseguro,
malicioso o engañoso.

## Revisión y aplicación

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso, reportes de usuarios y
revisión del personal para identificar contenido inseguro o comportamiento de publicación abusivo. Una señal
no prueba abuso por sí sola; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma reversible o, cuando sea compatible con el tipo de recurso,
  eliminar de forma permanente listados infractores
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma reversible contenido asociado
- restringir el acceso de publicación
- bloquear a infractores reincidentes o graves

No garantizamos aplicar medidas con advertencia previa ante abuso evidente. Consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation) para reportes, retenciones de moderación,
listados ocultos, bloqueos y situación de la cuenta.
