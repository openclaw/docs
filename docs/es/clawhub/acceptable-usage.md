---
read_when:
    - Revisión de cargas en busca de abuso o infracciones de políticas
    - Redacción de documentación de moderación o runbooks para revisores
    - Decidir si se debe ocultar una skill o bloquear a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-05T20:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja skills, plugins, paquetes y metadatos de marketplace para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación corresponde a
ClawHub.

Estas reglas se aplican a lo que hace un listado, lo que pide a los usuarios que ejecuten, cómo se
representa a sí mismo y cómo los editores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para los estados de moderación y la situación de la cuenta, consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulta [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de buena
fe.

| Categoría                                        | Permitido cuando                                                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Productividad para desarrolladores               | El listado ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                        |
| Flujos de trabajo de UI, datos y automatización  | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen revisión, simulación, vista previa o rutas de confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta para revisión autorizada, conserva evidencias y mantiene claros los límites de aprobación humana.        |
| Flujos de trabajo personales o de equipo         | El flujo de trabajo usa cuentas basadas en consentimiento, una configuración transparente y permisos explícitos.                        |
| Catálogos mantenidos                             | Cada listado es distinto, útil, está descrito con precisión y se mantiene razonablemente.                                               |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea abuso, engaño, ejecución insegura
o infracción de derechos.

| Categoría                                                   | No permitido                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado u omisión de seguridad                 | Omisión de autenticación, toma de control de cuentas, abuso de límites de tasa, toma de control de llamadas en vivo o de agentes, robo de sesiones reutilizables o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                                                 |
| Abuso de plataformas y evasión de prohibiciones             | Cuentas furtivas tras prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, automatización multicuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                                       |
| Fraude, estafas y flujos de trabajo financieros engañosos   | Certificados o facturas falsos, flujos de pago engañosos, contacto fraudulento, prueba social falsa, flujos de trabajo de identidad sintética para fraude o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                             |
| Enriquecimiento o vigilancia invasivos de la privacidad     | Extracción de contactos para spam, doxxing, acoso, extracción de leads combinada con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida o uso de datos filtrados o volcados de brechas.                                                                                                         |
| Suplantación no consentida o manipulación de identidad      | Intercambio de caras, gemelos digitales, influencers clonados, personajes falsos u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                          |
| Contenido sexual explícito o generación para adultos con seguridad desactivada | Generación de imágenes, video o contenido NSFW; wrappers de contenido para adultos alrededor de API de terceros; o listados cuyo propósito principal sea contenido sexual explícito.                                                                                                                               |
| Requisitos de ejecución ocultos, inseguros o engañosos      | Comandos de instalación ofuscados, instaladores pipe-to-shell como contenido descargado ejecutado con `sh` o `bash` sin revisión clara posible, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisión clara posible o metadatos que ocultan lo que el listado realmente necesita para ejecutarse. |
| Material que infringe derechos de autor o vulnera derechos  | Republicar la skill, el plugin, la documentación, los activos de marca o el código propietario de otra persona sin permiso; infringir términos de licencia; o suplantar al autor o editor original.                                                                                                                               |

## Comportamiento de marketplace no permitido

ClawHub también revisa cómo los editores usan el marketplace. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación o la
atención de los usuarios.

El comportamiento de marketplace no permitido incluye:

- publicar en masa grandes cantidades de listados de bajo esfuerzo, duplicativos, provisionales o
  generados por máquina que no parezcan tener valor real para los usuarios
- saturar las superficies de búsqueda o categorías con skills o plugins casi idénticos
- publicar cientos de listados con poco o ningún uso, mantenimiento, claridad de fuente
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de interacción
  mediante automatización, bucles de autoinstalación, cuentas falsas, actividad coordinada,
  interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir moderación, prohibiciones, límites de editor o
  revisión del marketplace
- engañar a los usuarios sobre la propiedad, la fuente, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o editor
- subir repetidamente contenido que ya se ha ocultado, eliminado o bloqueado
  sin solucionar el problema subyacente

La publicación de alto volumen no es abuso automáticamente. Los catálogos grandes son aceptables
cuando los listados son significativamente diferentes, están descritos con precisión, se mantienen
y los usan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con listados superficiales, duplicativos, engañosos, sin mantenimiento o
promocionados artificialmente.

## Derechos de contenido

Si crees que el contenido en ClawHub infringe tus derechos de autor u otros derechos, usa
[Solicitudes de derechos de contenido](/es/clawhub/content-rights). No uses los reportes normales del marketplace
para reclamaciones de derechos de autor o derechos a menos que el listado también sea inseguro,
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
- prohibir a infractores reincidentes o graves

No garantizamos una aplicación con advertencia previa para abusos evidentes. Consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation) para reportes, retenciones de moderación,
listados ocultos, prohibiciones y situación de la cuenta.
