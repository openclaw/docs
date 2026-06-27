---
read_when:
    - Revisar las cargas para detectar abusos o infracciones de políticas
    - Escribir documentación de moderación o manuales operativos para revisores
    - Decidir si una skill debe ocultarse o si debe prohibirse a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: lo que ClawHub permite y lo que no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-06-27T17:08:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del marketplace para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación pertenece en
ClawHub.

Estas reglas se aplican a lo que hace una ficha, lo que pide a los usuarios ejecutar, cómo se
representa a sí misma y cómo los publicadores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para estados de moderación y estado de la cuenta, consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation). Para reclamaciones de copyright u otros derechos,
consulta [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de buena
fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad para desarrolladores                           | La ficha ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen rutas de revisión, ejecución de prueba, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abuso | La herramienta se presenta para revisión autorizada, conserva evidencia y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo usa cuentas basadas en consentimiento, configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada ficha es distinta, útil, descrita con precisión y se mantiene razonablemente.                                                |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de seguridad                      | Elusión de autenticación, toma de control de cuentas, abuso de límites de frecuencia, toma de control de llamadas en vivo o agentes, robo de sesiones reutilizables o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                                                                                                                   |
| Abuso de plataformas y evasión de bloqueos                              | Cuentas encubiertas después de bloqueos, calentamiento o cultivo de cuentas, interacción falsa, automatización de múltiples cuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de identidad sintética para fraude o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                                    |
| Enriquecimiento o vigilancia invasivos de la privacidad                 | Extracción de contactos para spam, doxxing, acoso, extracción de prospectos combinada con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida o uso de datos filtrados o volcados de brechas.                                                                                                                  |
| Suplantación no consentida o manipulación de identidad       | Intercambio de rostros, gemelos digitales, influencers clonados, personajes falsos u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con seguridad desactivada | Generación de imágenes, video o contenido NSFW; envoltorios de contenido para adultos alrededor de APIs de terceros; o fichas cuyo propósito principal sea contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores de tipo canalización a shell como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos de secretos o claves privadas no declarados, ejecución remota de `npx @latest` sin revisabilidad clara, o metadatos que oculten lo que la ficha realmente necesita para ejecutarse. |
| Material que infringe copyright o vulnera derechos           | Republicar la skill, plugin, documentación, activos de marca o código propietario de otra persona sin permiso; infringir términos de licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento no permitido en el marketplace

ClawHub también revisa cómo los publicadores usan el marketplace. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento no permitido en el marketplace incluye:

- publicar en bloque grandes cantidades de fichas de bajo esfuerzo, duplicadas, de marcador de posición o
  generadas por máquina que no parezcan tener valor real para los usuarios
- inundar superficies de búsqueda o categoría con Skills o plugins casi idénticos
- publicar cientos de fichas con poco o ningún uso, mantenimiento, claridad de origen
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, bucles de autoinstalación, cuentas falsas, actividad
  coordinada, interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir moderación, bloqueos, límites de publicador o
  revisión del marketplace
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se ha ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de alto volumen no es abuso automáticamente. Los catálogos grandes son aceptables
cuando las fichas son significativamente diferentes, están descritas con precisión, se mantienen
y las usan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con fichas superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos de contenido

Si crees que el contenido en ClawHub infringe tu copyright u otros derechos, usa
[Solicitudes de derechos de contenido](/es/clawhub/content-rights). No uses los reportes normales del marketplace
para reclamaciones de copyright o derechos, a menos que la ficha también sea insegura,
maliciosa o engañosa.

## Revisión y aplicación

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso, reportes de usuarios y
revisión del personal para identificar contenido inseguro o comportamiento de publicación abusivo. Una señal
no prueba abuso por sí sola; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma recuperable o, cuando el tipo de recurso lo admita,
  eliminar de forma definitiva fichas infractoras
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma recuperable contenido asociado
- restringir el acceso de publicación
- bloquear a infractores reincidentes o graves

No garantizamos una aplicación con advertencia previa para abusos obvios. Consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation) para reportes, retenciones de moderación,
fichas ocultas, bloqueos y estado de la cuenta.
