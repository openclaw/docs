---
read_when:
    - Revisión de cargas por abuso o infracciones de políticas
    - Escritura de documentación de moderación o manuales de revisión
    - Decidir si una skill debe ocultarse o un usuario debe ser expulsado
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-06-27T10:49:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del mercado para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación pertenece en
ClawHub.

Estas reglas se aplican a lo que hace una ficha, lo que pide ejecutar a los usuarios, cómo se
representa a sí misma y cómo los publicadores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para los estados de moderación y la situación de la cuenta, consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulta [Solicitudes sobre derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de buena
fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de desarrolladores                           | La ficha ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen rutas de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta para revisión autorizada, preserva evidencia y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo usa cuentas basadas en consentimiento, configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada ficha es distinta, útil, está descrita con precisión y se mantiene razonablemente.                                                |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo acotado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o evasión de seguridad                      | Evasión de autenticación, toma de control de cuentas, abuso de límites de frecuencia, toma de control de llamadas en vivo o agentes, robo reutilizable de sesiones o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                                                                                                                   |
| Abuso de plataformas y evasión de prohibiciones                              | Cuentas sigilosas después de prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, automatización de múltiples cuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos de trabajo financieros engañosos             | Certificados o facturas falsas, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de trabajo de identidad sintética para fraude o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                                    |
| Enriquecimiento invasivo de la privacidad o vigilancia                 | Extracción de contactos para spam, doxxing, acoso, extracción de clientes potenciales combinada con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida o uso de datos filtrados o volcados de brechas.                                                                                                                  |
| Suplantación no consentida o manipulación de identidad       | Intercambio de rostros, gemelos digitales, influencers clonados, personas falsas u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con seguridad desactivada | Generación de imágenes, videos o contenido NSFW; envoltorios de contenido adulto alrededor de APIs de terceros; o fichas cuyo propósito principal sea contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores de tipo pipe-to-shell como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara o metadatos que oculten lo que la ficha realmente necesita para ejecutarse. |
| Material que infringe derechos de autor o vulnera derechos           | Republicar la skill, Plugin, documentación, activos de marca o código propietario de otra persona sin permiso; violar términos de licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento no permitido en el mercado

ClawHub también revisa cómo los publicadores usan el mercado. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación o la
atención de los usuarios.

El comportamiento no permitido en el mercado incluye:

- publicación masiva de grandes cantidades de fichas de bajo esfuerzo, duplicadas, de marcador de posición o
  generadas por máquina que no parezcan tener valor real para los usuarios
- inundar las superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de fichas con poco o ningún uso, mantenimiento, claridad de origen
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, bucles de autoinstalación, cuentas falsas, actividad
  coordinada, interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir moderación, prohibiciones, límites de publicador o
  revisión del mercado
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se ha ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de alto volumen no es automáticamente abuso. Los catálogos grandes son aceptables
cuando las fichas son significativamente diferentes, están descritas con precisión, se mantienen
y son usadas por usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con fichas superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos de contenido

Si crees que el contenido en ClawHub infringe tus derechos de autor u otros derechos, usa
[Solicitudes sobre derechos de contenido](/es/clawhub/content-rights). No uses los informes normales del mercado
para reclamaciones de derechos de autor o derechos salvo que la ficha también sea insegura,
maliciosa o engañosa.

## Revisión y aplicación

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso, informes de usuarios y
revisión del personal para identificar contenido inseguro o comportamiento de publicación abusivo. Una señal
no prueba abuso por sí sola; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma recuperable o, cuando el tipo de recurso lo admita,
  eliminar permanentemente fichas infractoras
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma recuperable contenido asociado
- restringir el acceso de publicación
- prohibir a infractores reincidentes o graves

No garantizamos una aplicación con advertencia previa para abusos obvios. Consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation) para informes, retenciones de moderación,
fichas ocultas, prohibiciones y situación de la cuenta.
