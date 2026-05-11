---
read_when:
    - Revisión de cargas para detectar abuso o infracciones de políticas
    - Escribir documentación de moderación o guías operativas para revisores
    - Decidir si se debe ocultar una habilidad o bloquear a un usuario
summary: 'Política del Marketplace: lo que ClawHub permite y lo que no alojará.'
x-i18n:
    generated_at: "2026-05-11T22:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceptable

Esta página describe los tipos de habilidades y contenido que ClawHub acepta, y los flujos de trabajo abusivos que no alojará.

Estas reglas son intencionalmente prácticas. Nos importan sobre todo los flujos de abuso de extremo a extremo, no solo palabras clave aisladas. Si una habilidad está creada para evadir defensas, abusar de plataformas, estafar a personas, invadir la privacidad o permitir comportamientos no consensuados, no pertenece a ClawHub.

## Patrones recientes que aceptamos explícitamente

- Trabajo de frontend y sistemas de diseño que usa componentes reales, tokens semánticos, estados accesibles y flujos de usuario probados.
- Composición de shadcn/ui que usa componentes fuente instalados, alias del proyecto y variantes documentadas en lugar de marcado puntual.
- Conversión de JavaScript a TypeScript de UI5 que conserva los comentarios, usa tipos concretos de UI5 y mantiene revisables las interfaces de controles generadas.
- Revisión de seguridad defensiva, herramientas de moderación y prompts de detección de abuso que muestran evidencia y mantienen claros los límites de aprobación humana.
- Automatización de flujos de trabajo basada en consentimiento para cuentas personales o de equipo con credenciales explícitas, configuración transparente y modos de simulación o vista previa.
- Documentación, manuales operativos de migración, utilidades para desarrolladores y fixtures de prueba acotados al software al que dan soporte.

## No aceptable

- Flujos de trabajo de elusión de seguridad o acceso no autorizado.
  - Ejemplos: elusión de autenticación, toma de control de cuentas, elusión de CAPTCHA, evasión de Cloudflare o sistemas antibots, elusión de límites de tasa, scraping sigiloso diseñado para derrotar protecciones, toma de control de llamadas en vivo o agentes, robo reutilizable de sesiones, aprobación automática de flujos de emparejamiento para usuarios no aprobados.

- Abuso de plataformas y evasión de prohibiciones.
  - Ejemplos: cuentas sigilosas después de prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, cultivo de karma o seguidores, automatización de múltiples cuentas, publicaciones masivas, bots de spam, automatización de marketplaces o redes sociales creada para evitar la detección.

- Fraude, estafas y flujos financieros engañosos.
  - Ejemplos: certificados falsos, facturas falsas, flujos de pago engañosos, campañas de estafa, prueba social falsa, herramientas que permiten gastar o cobrar sin aprobación humana clara y controles transparentes, o flujos de identidad sintética creados para generar cuentas destinadas al fraude.

- Scraping, enriquecimiento o vigilancia invasivos para la privacidad.
  - Ejemplos: scraping de datos de contacto a escala para spam, doxxing, acoso, extracción de leads combinada con contacto no solicitado, monitoreo encubierto, búsqueda facial o coincidencia biométrica usada sin consentimiento claro, o compra, publicación, descarga u operacionalización de datos filtrados o volcados de brechas.

- Suplantación no consensuada o manipulación engañosa de identidad.
  - Ejemplos: intercambio de rostro, gemelos digitales, personas falsas, influencers clonados u otras herramientas de manipulación de identidad usadas para suplantar o engañar.

- Contenido sexual explícito y generación de contenido adulto con seguridad deshabilitada.
  - Ejemplos: generación de imágenes, videos o contenido NSFW, envoltorios de contenido adulto alrededor de API de terceros, o habilidades cuyo propósito principal es el contenido sexual explícito.

- Requisitos de ejecución ocultos, inseguros o engañosos.
  - Ejemplos: comandos de instalación ofuscados, `curl | sh`, requisitos de secretos no declarados, uso de claves privadas no declarado, ejecución remota de `npx @latest` sin revisabilidad clara, metadatos engañosos que ocultan lo que la habilidad realmente necesita para ejecutarse.

## Patrones recientes que explícitamente no aceptamos

- “Crear cuentas de vendedor sigilosas después de prohibiciones en marketplaces.”
- “Modificar el emparejamiento de Telegram para que usuarios no aprobados reciban automáticamente códigos de emparejamiento.”
- “Cultivar cuentas de Reddit/Twitter con automatización indetectable.”
- “Generar certificados profesionales o facturas para uso arbitrario.”
- “Generar contenido NSFW con las comprobaciones de seguridad deshabilitadas.”
- “Extraer leads, enriquecer contactos y lanzar campañas de contacto en frío a escala.”
- “Comprar, publicar o descargar datos filtrados o volcados de brechas.”
- “Crear en masa cuentas de correo electrónico o redes sociales con identidades sintéticas o resolución de CAPTCHA.”

## Notas para revisores

- El contexto importa. El mismo tema puede ser legítimo en un entorno defensivo limitado o basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de abuso.
- Debemos inclinarnos por actuar cuando una habilidad está claramente optimizada para la evasión, el engaño o el uso no consensuado.
- Las subidas repetidas en estas categorías son motivo para ocultar contenido y bloquear la cuenta.

## Aplicación

- Podemos ocultar, eliminar o borrar definitivamente habilidades infractoras.
- Podemos revocar tokens, eliminar de forma reversible el contenido asociado y bloquear a infractores reincidentes o graves.
- No garantizamos una aplicación con advertencia previa para abusos evidentes.
