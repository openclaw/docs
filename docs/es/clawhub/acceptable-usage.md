---
read_when:
    - Revisión de cargas por abuso o infracciones de políticas
    - Escritura de documentación de moderación o manuales de ejecución para revisores
    - Decidir si una skill debe ocultarse o si se debe banear a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del mercado: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-04T10:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos de marketplace para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación pertenece a
ClawHub.

Estas reglas se aplican a lo que hace una publicación, lo que pide a los usuarios que ejecuten, cómo se
representa a sí misma y cómo los publicadores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para los estados de moderación y la situación de la cuenta, consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulta [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de buena
fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad para desarrolladores                           | La publicación ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de IU, datos y automatización               | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen rutas de revisión, ensayo, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta para una revisión autorizada, preserva pruebas y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo usa cuentas basadas en consentimiento, una configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada publicación es distinta, útil, está descrita con precisión y se mantiene de forma razonable.                                                |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo abusivo.

## Contenido prohibido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o evasión de seguridad                      | Evasión de autenticación, toma de control de cuentas, abuso de límites de frecuencia, toma de control de llamadas en vivo o agentes, robo de sesiones reutilizables o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                                                                                                                   |
| Abuso de plataformas y evasión de bloqueos                              | Cuentas encubiertas después de bloqueos, preparación o cultivo de cuentas, interacción falsa, automatización de varias cuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de trabajo de identidad sintética para fraude o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                                    |
| Enriquecimiento o vigilancia invasivos de la privacidad                 | Extracción de contactos para spam, doxxing, acoso, extracción de clientes potenciales combinada con contacto no solicitado, monitoreo encubierto, comparación biométrica no consensuada o uso de datos filtrados o volcados de brechas.                                                                                                                  |
| Suplantación no consensuada o manipulación de identidad       | Intercambio de rostros, gemelos digitales, influencers clonados, personajes falsos u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con seguridad desactivada | Generación de imágenes, videos o contenido NSFW; envoltorios de contenido para adultos alrededor de API de terceros; o publicaciones cuyo propósito principal sea contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores pipe-to-shell como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara o metadatos que ocultan lo que la publicación realmente necesita para ejecutarse. |
| Material que infringe derechos de autor o vulnera derechos           | Republicar Skills, plugins, documentación, activos de marca o código propietario de otra persona sin permiso; violar términos de licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento prohibido en el marketplace

ClawHub también revisa cómo los publicadores usan el marketplace. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento prohibido en el marketplace incluye:

- publicar en masa grandes cantidades de publicaciones de bajo esfuerzo, duplicadas, marcadores de posición o
  generadas por máquina que no parezcan tener valor real para los usuarios
- saturar las superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de publicaciones con poco o ningún uso, mantenimiento, claridad de origen
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de interacción
  mediante automatización, bucles de autoinstalación, cuentas falsas, actividad coordinada,
  interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir moderación, bloqueos, límites de publicador o
  revisión del marketplace
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se haya ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de alto volumen no es automáticamente abuso. Los catálogos grandes son aceptables
cuando las publicaciones son significativamente diferentes, están descritas con precisión, se mantienen
y las usan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con publicaciones superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos de contenido

Si crees que el contenido en ClawHub infringe tus derechos de autor u otros derechos, usa
[Solicitudes de derechos de contenido](/es/clawhub/content-rights). No uses los reportes normales del marketplace
para reclamaciones de derechos de autor o derechos, a menos que la publicación también sea insegura,
maliciosa o engañosa.

## Revisión y cumplimiento

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso, reportes de usuarios y
revisión del personal para identificar contenido inseguro o comportamiento de publicación abusivo. Una señal
no prueba abuso por sí sola; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma reversible o, cuando sea compatible con el tipo de recurso,
  eliminar de forma permanente las publicaciones infractoras
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma reversible el contenido asociado
- restringir el acceso de publicación
- bloquear a infractores reincidentes o graves

No garantizamos que la aplicación de medidas comience con una advertencia para abusos evidentes. Consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation) para reportes, retenciones de moderación,
publicaciones ocultas, bloqueos y situación de la cuenta.
