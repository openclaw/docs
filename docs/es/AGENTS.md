---
x-i18n:
    generated_at: "2026-04-12T23:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Guía de documentación

Este directorio gestiona la creación de documentación, las reglas de enlaces de Mintlify y la política de i18n de la documentación.

## Reglas de Mintlify

- La documentación se aloja en Mintlify (`https://docs.openclaw.ai`).
- Los enlaces internos de la documentación en `docs/**/*.md` deben seguir siendo relativos a la raíz y no incluir el sufijo `.md` ni `.mdx` (ejemplo: `[Config](/configuration)`).
- Las referencias cruzadas a secciones deben usar anclas en rutas relativas a la raíz (ejemplo: `[Hooks](/configuration#hooks)`).
- Los encabezados de la documentación deben evitar las rayas largas y los apóstrofos porque la generación de anclas de Mintlify es frágil con ellos.
- Los archivos README y otros documentos renderizados en GitHub deben mantener URLs absolutas de la documentación para que los enlaces funcionen fuera de Mintlify.
- El contenido de la documentación debe seguir siendo genérico: no uses nombres de dispositivos personales, nombres de host ni rutas locales; usa marcadores de posición como `user@gateway-host`.

## Reglas de contenido de la documentación

- En la documentación, el texto de la UI y las listas de selección, ordena los servicios/proveedores alfabéticamente, salvo que la sección describa explícitamente el orden de ejecución o el orden de detección automática.
- Mantén la nomenclatura de Plugin incluidos coherente con las reglas de terminología de plugin de todo el repositorio en el `AGENTS.md` raíz.

## i18n de la documentación

- La documentación en otros idiomas no se mantiene en este repositorio. La salida publicada generada vive en el repositorio separado `openclaw/docs` (a menudo clonado localmente como `../openclaw-docs`).
- No agregues ni edites documentación localizada en `docs/<locale>/**` aquí.
- Trata la documentación en inglés de este repositorio junto con los archivos de glosario como la fuente de verdad.
- Flujo: actualiza aquí la documentación en inglés, actualiza `docs/.i18n/glossary.<locale>.json` según sea necesario y luego deja que la sincronización del repositorio de publicación y `scripts/docs-i18n` se ejecuten en `openclaw/docs`.
- Antes de volver a ejecutar `scripts/docs-i18n`, agrega entradas al glosario para cualquier término técnico nuevo, título de página o etiqueta corta de navegación que deba permanecer en inglés o usar una traducción fija.
- `pnpm docs:check-i18n-glossary` es la validación para títulos de documentación en inglés modificados y etiquetas internas cortas de documentación.
- La memoria de traducción vive en archivos generados `docs/.i18n/*.tm.jsonl` en el repositorio de publicación.
- Consulta `docs/.i18n/README.md`.
