---
x-i18n:
    generated_at: "2026-07-05T11:00:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Guía de documentación

Este directorio gestiona la autoría de documentación, las reglas de enlaces de Mintlify y la política de i18n de la documentación.

## Reglas de Mintlify

- La documentación se aloja en Mintlify (`https://docs.openclaw.ai`).
- Los enlaces internos de documentación en `docs/**/*.md` deben permanecer relativos a la raíz, sin sufijo `.md` ni `.mdx` (ejemplo: `[Configuración](/gateway/configuration)`).
- Las referencias cruzadas de secciones deben usar anclas en rutas relativas a la raíz (ejemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Los encabezados de documentación deben evitar rayas y apóstrofes porque la generación de anclas de Mintlify es frágil en esos casos.
- README y otra documentación renderizada por GitHub deben conservar URL absolutas de la documentación para que los enlaces funcionen fuera de Mintlify.
- El contenido de la documentación debe mantenerse genérico: sin nombres de dispositivos personales, nombres de host ni rutas locales; usa marcadores de posición como `user@gateway-host`.

## Reglas de contenido de documentación

- Para documentación, textos de UI y listas de selección, ordena los servicios/proveedores alfabéticamente salvo que la sección describa explícitamente el orden de ejecución o el orden de autodetección.
- Mantén la nomenclatura de Plugin incluido coherente con las reglas de terminología de Plugin de todo el repositorio en el `AGENTS.md` raíz.
- Documentación generada, nunca editar a mano: `docs/plugins/reference/**`, `docs/plugins/reference.md` y `docs/plugins/plugin-inventory.md` provienen de `pnpm plugins:inventory:gen`; `docs/docs_map.md` de `pnpm docs:map:gen`; `docs/maturity/**` de `pnpm maturity:render`.

## Documentación interna

- La documentación privada de operador de larga duración pertenece a `~/Projects/manager/docs/`.
- La documentación interna local del repositorio para borradores/réplicas puede vivir bajo `docs/internal/` ignorado.
- Nunca agregues páginas `docs/internal/**` a la navegación de `docs/docs.json` ni las enlaces desde documentación pública.
- `scripts/docs-sync-publish.mjs` excluye y poda `docs/internal/**` del repositorio público de publicación `openclaw/docs` si una página se agrega por la fuerza más tarde.
- La documentación interna puede mencionar rutas del repositorio, nombres de aplicaciones privadas, nombres de elementos de 1Password y runbooks, pero nunca incluir valores secretos.

## Edición del cuadro de mando de madurez

`taxonomy.yaml` y `qa/maturity-scores.yaml` son las entradas fuente; la documentación de madurez generada bajo `docs/maturity/` son proyecciones y no deben editarse a mano para puntuación, LTS, taxonomía, perfil de QA o tablas de evidencia.
`scripts/qa/render-maturity-docs.ts` gestiona la generación; usa `pnpm maturity:render` para actualizar la documentación confirmada y `pnpm maturity:check` para verificarla.
`.github/workflows/maturity-scorecard.yml` renderiza vistas previas de artefactos y puede abrir PRs de documentación generada; `.github/workflows/openclaw-release-checks.yml` lo despacha para QA de versiones.
Mantén los datos deterministas de `qa-evidence.json.scorecard` en artefactos de GitHub Actions salvo que un mantenedor pida explícitamente una proyección saneada confirmada.
Las anulaciones humanas deben cambiar el estado fuente en un PR y explicar el motivo junto con evidencia pública o redactada.

## i18n de documentación

- La documentación en idiomas extranjeros no se mantiene en este repositorio. La salida de publicación generada vive en el repositorio separado `openclaw/docs` (a menudo clonado localmente como `../openclaw-docs`).
- No agregues ni edites documentación localizada bajo `docs/<locale>/**` aquí.
- Trata la documentación en inglés de este repositorio más los archivos de glosario como la fuente de verdad.
- Canalización: actualiza la documentación en inglés aquí, actualiza `docs/.i18n/glossary.<locale>.json` según sea necesario y luego deja que la sincronización del repositorio de publicación y `scripts/docs-i18n` se ejecuten en `openclaw/docs`.
- Antes de volver a ejecutar `scripts/docs-i18n`, agrega entradas de glosario para cualquier término técnico nuevo, título de página o etiqueta breve de navegación que deba permanecer en inglés o usar una traducción fija.
- `pnpm docs:check-i18n-glossary` es la protección para títulos de documentación en inglés modificados y etiquetas breves de documentación interna.
- La memoria de traducción vive en archivos generados `docs/.i18n/*.tm.jsonl` en el repositorio de publicación.
- Consulta `docs/.i18n/README.md`.
