---
x-i18n:
    generated_at: "2026-05-10T19:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Guía de documentación

Este directorio es responsable de la creación de documentación, las reglas de enlaces de Mintlify y la política de i18n de la documentación.

## Reglas de Mintlify

- La documentación está alojada en Mintlify (`https://docs.openclaw.ai`).
- Los enlaces internos de documentación en `docs/**/*.md` deben mantenerse relativos a la raíz, sin sufijo `.md` ni `.mdx` (ejemplo: `[Config](/gateway/configuration)`).
- Las referencias cruzadas de sección deben usar anclas en rutas relativas a la raíz (ejemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Los encabezados de documentación deben evitar rayas largas y apóstrofos porque la generación de anclas de Mintlify es frágil con ellos.
- El README y otros documentos renderizados por GitHub deben conservar URL absolutas de la documentación para que los enlaces funcionen fuera de Mintlify.
- El contenido de la documentación debe mantenerse genérico: sin nombres de dispositivos personales, nombres de host ni rutas locales; usa marcadores de posición como `user@gateway-host`.

## Reglas de contenido de la documentación

- Para documentación, textos de UI y listas de selección, ordena los servicios/proveedores alfabéticamente, salvo que la sección describa explícitamente el orden de ejecución o el orden de detección automática.
- Mantén la nomenclatura de plugins incluidos coherente con las reglas de terminología de plugins de todo el repositorio en el `AGENTS.md` raíz.

## Documentación interna

- La documentación privada de operadores de larga duración pertenece a `~/Projects/manager/docs/`.
- La documentación interna de borrador/espejo local del repositorio puede vivir bajo el `docs/internal/` ignorado.
- Nunca agregues páginas `docs/internal/**` a la navegación de `docs/docs.json` ni las enlaces desde la documentación pública.
- `scripts/docs-sync-publish.mjs` excluye y depura `docs/internal/**` del repositorio de publicación público `openclaw/docs` si una página se agrega por fuerza más adelante.
- La documentación interna puede mencionar rutas del repositorio, nombres de aplicaciones privadas, nombres de elementos de 1Password y runbooks, pero nunca incluir valores secretos.

## i18n de la documentación

- La documentación en idiomas extranjeros no se mantiene en este repositorio. La salida de publicación generada vive en el repositorio separado `openclaw/docs` (a menudo clonado localmente como `../openclaw-docs`).
- No agregues ni edites documentación localizada bajo `docs/<locale>/**` aquí.
- Trata la documentación en inglés de este repositorio y los archivos de glosario como la fuente de verdad.
- Flujo: actualiza la documentación en inglés aquí, actualiza `docs/.i18n/glossary.<locale>.json` según sea necesario y luego deja que la sincronización del repositorio de publicación y `scripts/docs-i18n` se ejecuten en `openclaw/docs`.
- Antes de volver a ejecutar `scripts/docs-i18n`, agrega entradas de glosario para cualquier término técnico nuevo, título de página o etiqueta corta de navegación que deba permanecer en inglés o usar una traducción fija.
- `pnpm docs:check-i18n-glossary` es la protección para títulos de documentación en inglés modificados y etiquetas cortas de documentación interna.
- La memoria de traducción vive en archivos generados `docs/.i18n/*.tm.jsonl` en el repositorio de publicación.
- Consulta `docs/.i18n/README.md`.
