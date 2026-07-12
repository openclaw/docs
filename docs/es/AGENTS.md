---
x-i18n:
    generated_at: "2026-07-11T22:51:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Guía de documentación

Este directorio contiene las normas de creación de documentación, las reglas de enlaces de Mintlify y la política de internacionalización de la documentación.

## Reglas de Mintlify

- La documentación se aloja en Mintlify (`https://docs.openclaw.ai`).
- Los enlaces internos de la documentación en `docs/**/*.md` deben ser relativos a la raíz y no incluir el sufijo `.md` ni `.mdx` (ejemplo: `[Configuración](/gateway/configuration)`).
- Las referencias cruzadas a secciones deben usar anclas en rutas relativas a la raíz (ejemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Los encabezados de la documentación deben evitar las rayas y los apóstrofos, ya que la generación de anclas de Mintlify es poco fiable con esos caracteres.
- El archivo README y otros documentos renderizados por GitHub deben conservar las URL absolutas de la documentación para que los enlaces funcionen fuera de Mintlify.
- El contenido de la documentación debe ser genérico: no debe incluir nombres de dispositivos personales, nombres de host ni rutas locales; use marcadores de posición como `user@gateway-host`.

## Reglas de contenido de la documentación

- En la documentación, el texto de la interfaz y las listas de selección, ordene los servicios y proveedores alfabéticamente, salvo que la sección describa explícitamente el orden de ejecución o el orden de detección automática.
- Mantenga la nomenclatura de los plugins incluidos coherente con las reglas terminológicas para plugins de todo el repositorio que figuran en el archivo `AGENTS.md` raíz.
- Documentación generada, no editar manualmente: `docs/plugins/reference/**`, `docs/plugins/reference.md` y `docs/plugins/plugin-inventory.md` se generan mediante `pnpm plugins:inventory:gen`; `docs/docs_map.md`, mediante `pnpm docs:map:gen`; y `docs/maturity/**`, mediante `pnpm maturity:render`.

## Documentación interna

- La documentación privada de larga duración para operadores debe almacenarse en `~/Projects/manager/docs/`.
- La documentación interna temporal o replicada del repositorio puede almacenarse en el directorio ignorado `docs/internal/`.
- Nunca añada páginas de `docs/internal/**` a la navegación de `docs/docs.json` ni las enlace desde la documentación pública.
- `scripts/docs-sync-publish.mjs` excluye y elimina `docs/internal/**` del repositorio público de publicación `openclaw/docs` si posteriormente se fuerza la adición de alguna página.
- La documentación interna puede mencionar rutas del repositorio, nombres de aplicaciones privadas, nombres de elementos de 1Password y manuales operativos, pero nunca debe incluir valores secretos.

## Edición de la tabla de puntuación de madurez

`taxonomy.yaml` y `qa/maturity-scores.yaml` son las entradas de origen; los documentos de madurez generados en `docs/maturity/` son proyecciones y no deben editarse manualmente para modificar la puntuación, el LTS, la taxonomía, el perfil de control de calidad ni las tablas de evidencias.
`scripts/qa/render-maturity-docs.ts` controla la generación; use `pnpm maturity:render` para actualizar los documentos confirmados y `pnpm maturity:check` para verificarlos.
`.github/workflows/maturity-scorecard.yml` renderiza vistas previas de los artefactos y puede abrir solicitudes de incorporación de cambios para la documentación generada; `.github/workflows/openclaw-release-checks.yml` lo ejecuta para el control de calidad de las versiones.
Mantenga los datos deterministas de `qa-evidence.json.scorecard` en los artefactos de GitHub Actions, salvo que un responsable solicite explícitamente una proyección depurada y confirmada.
Las anulaciones manuales deben modificar el estado de origen en una solicitud de incorporación de cambios y explicar el motivo, además de aportar evidencias públicas o censuradas.

## Internacionalización de la documentación

- La documentación en otros idiomas no se mantiene en este repositorio. El resultado de publicación generado se encuentra en el repositorio independiente `openclaw/docs` (que suele clonarse localmente como `../openclaw-docs`).
- No añada ni edite aquí documentación localizada en `docs/<locale>/**`.
- Considere la documentación en inglés de este repositorio y los archivos de glosario como la fuente de verdad.
- Proceso: actualice aquí la documentación en inglés, actualice `docs/.i18n/glossary.<locale>.json` según sea necesario y, a continuación, permita que se ejecuten la sincronización del repositorio de publicación y `scripts/docs-i18n` en `openclaw/docs`.
- Antes de volver a ejecutar `scripts/docs-i18n`, añada entradas al glosario para cualquier término técnico, título de página o etiqueta breve de navegación nuevos que deban permanecer en inglés o usar una traducción fija.
- `pnpm docs:check-i18n-glossary` es la protección para los títulos modificados de la documentación en inglés y las etiquetas internas breves de la documentación.
- La memoria de traducción se encuentra en los archivos generados `docs/.i18n/*.tm.jsonl` del repositorio de publicación.
- Consulte `docs/.i18n/README.md`.
