---
read_when:
    - Revisando cargas en busca de abusos o infracciones de políticas
    - Redacción de documentación de moderación o manuales de revisión
    - Decidir si una skill debe ocultarse o si se debe vetar a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: lo que ClawHub permite y lo que no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-06-28T05:07:10Z"
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

Estas reglas se aplican a lo que hace un listado, lo que pide a los usuarios ejecutar, cómo se
representa a sí mismo y cómo los publicadores usan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para estados de moderación y estado de la cuenta, consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation). Para reclamaciones de copyright u otros derechos,
consulta [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub da la bienvenida al contenido que es útil, comprensible y publicado de buena
fe.

| Categoría                                        | Permitido cuando                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de desarrolladores                 | El listado ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                  |
| Flujos de trabajo de UI, datos y automatización  | El alcance es claro, las credenciales necesarias son explícitas y las acciones riesgosas incluyen rutas de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abuso | La herramienta se presenta para revisión autorizada, conserva la evidencia y mantiene claros los límites de aprobación humana. |
| Flujos de trabajo personales o de equipo         | El flujo de trabajo usa cuentas basadas en consentimiento, configuración transparente y permisos explícitos.                      |
| Catálogos mantenidos                             | Cada listado es distinto, útil, está descrito con precisión y se mantiene razonablemente.                                        |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                   | No permitido                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de seguridad                 | Elusión de autenticación, toma de control de cuentas, abuso de límites de tasa, toma de control de llamadas en vivo o de agentes, robo de sesiones reutilizables, o aprobación automática de flujos de emparejamiento para usuarios no aprobados.                                                            |
| Abuso de plataformas y evasión de prohibiciones             | Cuentas encubiertas después de prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, automatización de múltiples cuentas, publicaciones masivas, bots de spam o automatización creada para evitar la detección.                                                                               |
| Fraude, estafas y flujos financieros engañosos              | Certificados o facturas falsos, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de trabajo de identidad sintética para fraude, o herramientas de gasto/cobro sin aprobación humana clara.                                                                                         |
| Enriquecimiento invasivo de la privacidad o vigilancia      | Extracción de contactos para spam, doxxing, acoso, extracción de leads junto con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida, o uso de datos filtrados o volcados de brechas.                                                                                          |
| Suplantación no consentida o manipulación de identidad      | Intercambio de rostros, gemelos digitales, influencers clonados, personas falsas u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                        |
| Contenido sexual explícito o generación para adultos con seguridad desactivada | Generación de imágenes, video o contenido NSFW; envoltorios de contenido para adultos alrededor de API de terceros; o listados cuyo propósito principal sea contenido sexual explícito.                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos      | Comandos de instalación ofuscados, instaladores pipe-to-shell como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara, o metadatos que ocultan lo que el listado realmente necesita para ejecutarse. |
| Material que infringe copyright o viola derechos            | Republicar la skill, plugin, documentación, activos de marca o código propietario de otra persona sin permiso; violar términos de licencia; o suplantar al autor o publicador original.                                                                                                                       |

## Comportamiento de marketplace no permitido

ClawHub también revisa cómo los publicadores usan el marketplace. No uses ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación o la
atención de los usuarios.

El comportamiento de marketplace no permitido incluye:

- publicar en bloque grandes cantidades de listados de bajo esfuerzo, duplicados, de marcador de posición o
  generados por máquina que no parecen tener valor real para los usuarios
- inundar superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de listados con poco o ningún uso, mantenimiento, claridad de origen
  o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de interacción
  mediante automatización, bucles de autoinstalación, cuentas falsas, actividad coordinada,
  interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir la moderación, prohibiciones, límites de publicador o
  revisión de marketplace
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya ha sido ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de alto volumen no es abuso automáticamente. Los catálogos grandes son aceptables
cuando los listados son significativamente diferentes, están descritos con precisión, se mantienen
y son usados por usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con listados superficiales, duplicados, engañosos, sin mantenimiento o
promocionados artificialmente.

## Derechos de contenido

Si crees que el contenido en ClawHub infringe tu copyright u otros derechos, usa
[Solicitudes de derechos de contenido](/es/clawhub/content-rights). No uses reportes normales de marketplace
para reclamaciones de copyright o derechos a menos que el listado también sea inseguro,
malicioso o engañoso.

## Revisión y aplicación

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso, reportes de usuarios y
revisión del personal para identificar contenido inseguro o comportamiento de publicación abusivo. Una señal
no prueba abuso por sí sola; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma reversible o, cuando el tipo de recurso lo admita,
  eliminar de forma irreversible listados infractores
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma reversible contenido asociado
- restringir el acceso de publicación
- prohibir a infractores reincidentes o graves

No garantizamos una aplicación con advertencia previa para abusos obvios. Consulta
[Moderación y seguridad de la cuenta](/es/clawhub/moderation) para reportes, retenciones de moderación,
listados ocultos, prohibiciones y estado de la cuenta.
