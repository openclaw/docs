---
read_when:
    - Revisión de archivos subidos para detectar abuso o infracciones de políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si se debe ocultar una Skill o bloquear a un usuario
summary: 'Política de Marketplace: qué permite ClawHub y qué no alojará.'
x-i18n:
    generated_at: "2026-05-12T04:09:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

Esta página describe los tipos de skills y contenido que ClawHub acepta, y los flujos de abuso que no alojará.

Estas reglas son intencionalmente prácticas. Nos importan más los flujos de abuso de extremo a extremo que solo palabras clave aisladas. Si una skill está diseñada para evadir defensas, abusar de plataformas, estafar a personas, invadir la privacidad o habilitar comportamientos no consentidos, no pertenece a ClawHub.

## Patrones recientes que aceptamos explícitamente

- Trabajo de frontend y sistemas de diseño que usa componentes reales, tokens semánticos, estados accesibles y flujos de usuario probados.
- Composición con shadcn/ui que usa componentes fuente instalados, alias del proyecto y variantes documentadas en lugar de markup puntual.
- Conversión de JavaScript a TypeScript en UI5 que conserva comentarios, usa tipos concretos de UI5 y mantiene revisables las interfaces de controles generadas.
- Revisión de seguridad defensiva, herramientas de moderación y prompts de detección de abuso que muestran evidencia y mantienen claros los límites de aprobación humana.
- Automatización de flujos de trabajo basada en consentimiento para cuentas personales o de equipo con credenciales explícitas, configuración transparente y modos de simulación o vista previa.
- Documentación, runbooks de migración, utilidades para desarrolladores y fixtures de prueba acotados al software al que dan soporte.

## No aceptado

- Flujos de evasión de seguridad o acceso no autorizado.
  - Ejemplos: omisión de autenticación, toma de control de cuentas, omisión de CAPTCHA, evasión de Cloudflare o antibots, omisión de límites de frecuencia, scraping sigiloso diseñado para derrotar protecciones, toma de control de llamadas o agentes en vivo, robo reutilizable de sesiones, aprobación automática de flujos de emparejamiento para usuarios no aprobados.

- Abuso de plataformas y evasión de prohibiciones.
  - Ejemplos: cuentas sigilosas después de prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, cultivo de karma o seguidores, automatización de múltiples cuentas, publicación masiva, bots de spam, automatización de marketplaces o redes sociales creada para evitar la detección.

- Fraude, estafas y flujos financieros engañosos.
  - Ejemplos: certificados falsos, facturas falsas, flujos de pago engañosos, contacto para estafas, prueba social falsa, herramientas que habilitan gastos o cobros sin aprobación humana clara y controles transparentes, o flujos de identidad sintética creados para generar cuentas con fines de fraude.

- Scraping, enriquecimiento o vigilancia invasivos de la privacidad.
  - Ejemplos: scraping de datos de contacto a escala para spam, doxxing, acoso, extracción de leads combinada con contacto no solicitado, monitoreo encubierto, búsqueda facial o coincidencia biométrica usada sin consentimiento claro, o compra, publicación, descarga u operacionalización de datos filtrados o volcados de brechas.

- Suplantación no consentida o manipulación engañosa de identidad.
  - Ejemplos: face swap, gemelos digitales, personas falsas, influencers clonados u otras herramientas de manipulación de identidad usadas para suplantar o engañar.

- Contenido sexual explícito y generación adulta con seguridad deshabilitada.
  - Ejemplos: generación de imágenes, videos o contenido NSFW, wrappers de contenido adulto alrededor de APIs de terceros, o skills cuyo propósito principal es contenido sexual explícito.

- Requisitos de ejecución ocultos, inseguros o engañosos.
  - Ejemplos: comandos de instalación ofuscados, `curl | sh`, requisitos de secretos no declarados, uso de claves privadas no declarado, ejecución remota de `npx @latest` sin revisabilidad clara, metadatos engañosos que ocultan lo que la skill realmente necesita para ejecutarse.

## Patrones recientes que explícitamente no aceptamos

- “Crear cuentas de vendedor sigilosas después de prohibiciones en marketplaces.”
- “Modificar el emparejamiento de Telegram para que usuarios no aprobados reciban automáticamente códigos de emparejamiento.”
- “Cultivar cuentas de Reddit/Twitter con automatización indetectable.”
- “Generar certificados profesionales o facturas para uso arbitrario.”
- “Generar contenido NSFW con comprobaciones de seguridad deshabilitadas.”
- “Extraer leads, enriquecer contactos y lanzar contacto en frío a escala.”
- “Comprar, publicar o descargar datos filtrados o volcados de brechas.”
- “Crear en masa cuentas de correo electrónico o redes sociales con identidades sintéticas o resolución de CAPTCHA.”

## Notas para revisores

- El contexto importa. El mismo tema puede ser legítimo en un entorno defensivo acotado o basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de abuso.
- Deberíamos inclinarnos por actuar cuando una skill está claramente optimizada para la evasión, el engaño o el uso no consentido.
- Las cargas repetidas en estas categorías son motivo para ocultar contenido y prohibir la cuenta.

## Cumplimiento

- Podemos ocultar, eliminar o eliminar permanentemente skills infractoras.
- Podemos revocar tokens, eliminar de forma reversible contenido asociado y prohibir a infractores reincidentes o graves.
- No garantizamos un aviso previo en casos de abuso evidente.
