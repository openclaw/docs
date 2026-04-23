---
x-i18n:
    generated_at: "2026-04-23T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Guía de documentación

Este directorio es responsable de la autoría de la documentación, las reglas de enlaces de Mintlify y la política de internacionalización de la documentación.

## Reglas de Mintlify

- La documentación está alojada en Mintlify (`https://docs.openclaw.ai`).
- Los enlaces internos de documentación en `docs/**/*.md` deben seguir siendo relativos a la raíz, sin sufijo `.md` ni `.mdx` (ejemplo: `[Config](/gateway/configuration)`).
- Las referencias cruzadas entre secciones deben usar anclas en rutas relativas a la raíz (ejemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Los encabezados de la documentación deben evitar las rayas largas y los apóstrofes porque la generación de anclas de Mintlify es frágil en esos casos.
- README y otros documentos renderizados en GitHub deben mantener URLs absolutas de la documentación para que los enlaces funcionen fuera de Mintlify.
- El contenido de la documentación debe seguir siendo genérico: sin nombres personales de dispositivos, nombres de host ni rutas locales; usa marcadores de posición como `user@gateway-host`.

## Reglas de contenido de la documentación

- En la documentación, los textos de la interfaz y las listas de selección, ordena los servicios/proveedores alfabéticamente, a menos que la sección describa explícitamente el orden de ejecución o el orden de detección automática.
- Mantén coherente la nomenclatura de los plugins incluidos con las reglas de terminología de plugins de todo el repositorio en el `AGENTS.md` raíz.

## Internacionalización de la documentación

- La documentación en otros idiomas no se mantiene en este repositorio. La salida de publicación generada vive en el repositorio separado `openclaw/docs` (a menudo clonado localmente como `../openclaw-docs`).
- No agregues ni edites documentación localizada en `docs/<locale>/**` aquí.
- Trata la documentación en inglés de este repositorio, junto con los archivos de glosario, como la fuente de verdad.
- Flujo: actualiza aquí la documentación en inglés, actualiza `docs/.i18n/glossary.<locale>.json` según sea necesario y luego deja que la sincronización del repositorio de publicación y `scripts/docs-i18n` se ejecuten en `openclaw/docs`.
- Antes de volver a ejecutar `scripts/docs-i18n`, agrega entradas al glosario para cualquier término técnico nuevo, título de página o etiqueta corta de navegación que deba mantenerse en inglés o usar una traducción fija.
- `pnpm docs:check-i18n-glossary` es la verificación para títulos de documentación en inglés modificados y etiquetas internas cortas de documentación.
- La memoria de traducción vive en los archivos generados `docs/.i18n/*.tm.jsonl` en el repositorio de publicación.
- Consulta `docs/.i18n/README.md`.
