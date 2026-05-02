---
x-i18n:
    generated_at: "2026-05-02T22:22:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Diseño de importación de tema personalizado de Tweakcn

Estado: aprobado en terminal el 2026-04-22

## Resumen

Añade exactamente una ranura de tema personalizado local del navegador para la interfaz de Control que se puede importar desde un enlace compartido de tweakcn. Las familias de temas integradas existentes siguen siendo `claw`, `knot` y `dash`. La nueva familia `custom` se comporta como una familia de temas normal de OpenClaw y admite los modos `light`, `dark` y `system` cuando la carga útil importada de tweakcn incluye conjuntos de tokens tanto claros como oscuros.

El tema importado se almacena solo en el perfil actual del navegador con el resto de los ajustes de la interfaz de Control. No se escribe en la configuración del Gateway y no se sincroniza entre dispositivos ni navegadores.

## Problema

El sistema de temas de la interfaz de Control actualmente está cerrado sobre tres familias de temas codificadas de forma rígida:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Los usuarios pueden cambiar entre familias integradas y variantes de modo, pero no pueden incorporar un tema desde tweakcn sin editar el CSS del repositorio. El resultado solicitado es más pequeño que un sistema general de temas: mantener los tres integrados y añadir una ranura importada controlada por el usuario que se pueda reemplazar desde un enlace de tweakcn.

## Objetivos

- Mantener sin cambios las familias de temas integradas existentes.
- Añadir exactamente una ranura personalizada importada, no una biblioteca de temas.
- Aceptar un enlace compartido de tweakcn o una URL directa `https://tweakcn.com/r/themes/{id}`.
- Persistir el tema importado solo en el almacenamiento local del navegador.
- Hacer que la ranura importada funcione con los controles de modo `light`, `dark` y `system` existentes.
- Mantener seguro el comportamiento ante fallos: una importación incorrecta nunca rompe el tema activo de la interfaz.

## No objetivos

- Sin biblioteca multitema ni lista local del navegador de importaciones.
- Sin persistencia del lado del Gateway ni sincronización entre dispositivos.
- Sin editor de CSS arbitrario ni editor de JSON de tema sin procesar.
- Sin carga automática de recursos de fuentes remotas desde tweakcn.
- Sin intento de admitir cargas útiles de tweakcn que solo expongan un modo.
- Sin refactorización de temas en todo el repositorio más allá de las uniones necesarias para la interfaz de Control.

## Decisiones de usuario ya tomadas

- Mantener los tres temas integrados.
- Añadir una ranura de importación impulsada por tweakcn.
- Almacenar el tema importado en el navegador, no en la configuración del Gateway.
- Admitir `light`, `dark` y `system` para la ranura importada.
- Sobrescribir la ranura personalizada con la siguiente importación es el comportamiento previsto.

## Enfoque recomendado

Añade un cuarto id de familia de temas, `custom`, al modelo de temas de la interfaz de Control. La familia `custom` solo se vuelve seleccionable cuando hay una importación válida de tweakcn. La carga útil importada se normaliza en un registro de tema personalizado específico de OpenClaw y se almacena en el almacenamiento local del navegador con el resto de los ajustes de la interfaz.

En tiempo de ejecución, OpenClaw renderiza una etiqueta `<style>` gestionada que define los bloques de variables CSS personalizados resueltos:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Esto mantiene las variables del tema personalizado limitadas a la familia `custom` y evita filtrar variables CSS en línea a las familias integradas.

## Arquitectura

### Modelo de temas

Actualiza `ui/src/ui/theme.ts`:

- Extiende `ThemeName` para incluir `custom`.
- Extiende `ResolvedTheme` para incluir `custom` y `custom-light`.
- Extiende `VALID_THEME_NAMES`.
- Actualiza `resolveTheme()` para que `custom` refleje el comportamiento de familia existente:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` o `custom-light` según la preferencia del sistema operativo

No se añaden alias heredados para `custom`.

### Modelo de persistencia

Extiende la persistencia de `UiSettings` en `ui/src/ui/storage.ts` con una carga útil opcional de tema personalizado:

- `customTheme?: ImportedCustomTheme`

Forma almacenada recomendada:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Notas:

- `sourceUrl` almacena la entrada original del usuario después de la normalización.
- `themeId` es el id del tema de tweakcn extraído de la URL.
- `label` es el campo `name` de tweakcn cuando está presente; si no, `Custom`.
- `light` y `dark` ya son mapas de tokens normalizados de OpenClaw, no cargas útiles sin procesar de tweakcn.
- La carga útil importada vive junto a otros ajustes locales del navegador y se serializa en el mismo documento de almacenamiento local.
- Si los datos de tema personalizado almacenados faltan o no son válidos al cargar, ignora la carga útil y vuelve a `theme: "claw"` cuando la familia persistida era `custom`.

### Aplicación en tiempo de ejecución

Añade un gestor estrecho de hoja de estilos de tema personalizado en el tiempo de ejecución de la interfaz de Control, ubicado cerca de `ui/src/ui/app-settings.ts` y `ui/src/ui/theme.ts`.

Responsabilidades:

- Crear o actualizar una etiqueta estable `<style id="openclaw-custom-theme">` en `document.head`.
- Emitir CSS solo cuando exista una carga útil válida de tema personalizado.
- Quitar el contenido de la etiqueta de estilo cuando se borre la carga útil.
- Mantener el CSS de familias integradas en `ui/src/styles/base.css`; no insertar tokens importados en la hoja de estilos registrada en el repositorio.

Este gestor se ejecuta cada vez que los ajustes se cargan, guardan, importan o borran.

### Selectores de modo claro

La implementación debe preferir `data-theme-mode="light"` para el estilo claro entre familias en lugar de tratar `custom-light` como caso especial. Si un selector existente está fijado a `data-theme="light"` y necesita aplicarse a cada familia clara, amplíalo como parte de este trabajo.

## UX de importación

Actualiza `ui/src/ui/views/config.ts` en la sección `Appearance`:

- Añade una tarjeta de tema `Custom` junto a `Claw`, `Knot` y `Dash`.
- Muestra la tarjeta como deshabilitada cuando no existe ningún tema personalizado importado.
- Añade un panel de importación debajo de la cuadrícula de temas con:
  - una entrada de texto para un enlace compartido de tweakcn o una URL `/r/themes/{id}`
  - un botón `Import`
  - una ruta `Replace` cuando ya existe una carga útil personalizada
  - una acción `Clear` cuando ya existe una carga útil personalizada
- Muestra la etiqueta del tema importado y el host de origen cuando existe una carga útil.
- Si el tema activo es `custom`, importar un reemplazo se aplica inmediatamente.
- Si el tema activo no es `custom`, importar solo almacena la nueva carga útil hasta que el usuario selecciona la tarjeta `Custom`.

El selector rápido de temas en `ui/src/ui/views/config-quick.ts` también debe mostrar `Custom` solo cuando existe una carga útil.

## Análisis de URL y obtención remota

La ruta de importación del navegador acepta:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

La implementación debe normalizar ambas formas a:

- `https://tweakcn.com/r/themes/{id}`

Luego el navegador obtiene directamente el endpoint normalizado `/r/themes/{id}`.

Usa un validador de esquema estrecho para la carga útil externa. Se prefiere un esquema zod porque este es un límite externo no confiable.

Campos remotos requeridos:

- `name` de nivel superior como cadena opcional
- `cssVars.theme` como objeto opcional
- `cssVars.light` como objeto
- `cssVars.dark` como objeto

Si falta `cssVars.light` o `cssVars.dark`, rechaza la importación. Esto es deliberado: el comportamiento de producto aprobado es soporte completo de modos, no síntesis de mejor esfuerzo de un lado faltante.

## Mapeo de tokens

No reflejes variables de tweakcn a ciegas. Normaliza un subconjunto acotado en tokens de OpenClaw y deriva el resto en un ayudante.

### Tokens importados directamente

De cada bloque de modo de tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

De `cssVars.theme` compartido cuando está presente:

- `font-sans`
- `font-mono`

Si un bloque de modo sobrescribe `font-sans`, `font-mono` o `radius`, gana el valor local del modo.

### Tokens derivados para OpenClaw

El importador deriva variables exclusivas de OpenClaw a partir de los colores base importados:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Las reglas de derivación viven en un ayudante puro para que se puedan probar de forma independiente. Las fórmulas exactas de mezcla de colores son un detalle de implementación, pero el ayudante debe satisfacer dos restricciones:

- preservar un contraste legible cercano a la intención del tema importado
- producir una salida estable para la misma carga útil importada

### Tokens ignorados en v1

Estos tokens de tweakcn se ignoran intencionadamente en la primera versión:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Esto mantiene el alcance en los tokens que la interfaz de Control actual realmente necesita.

### Fuentes

Las cadenas de pilas de fuentes se importan si están presentes, pero OpenClaw no carga recursos de fuentes remotas en v1. Si la pila importada referencia fuentes que no están disponibles en el navegador, se aplica el comportamiento normal de reserva.

## Comportamiento ante fallos

Las importaciones incorrectas deben fallar de forma cerrada.

- Formato de URL no válido: mostrar error de validación en línea, no obtener.
- Host o forma de ruta no admitidos: mostrar error de validación en línea, no obtener.
- Error de red, respuesta no OK o JSON mal formado: mostrar error en línea, mantener intacta la carga útil almacenada actual.
- Fallo de esquema o bloques light/dark faltantes: mostrar error en línea, mantener intacta la carga útil almacenada actual.
- Acción de borrado:
  - elimina la carga útil personalizada almacenada
  - elimina el contenido de la etiqueta de estilo personalizado gestionada
  - si `custom` está activo, cambia la familia de tema de vuelta a `claw`
- Carga útil personalizada almacenada no válida en la primera carga:
  - ignora la carga útil almacenada
  - no emite CSS personalizado
  - si la familia de tema persistida era `custom`, vuelve a `claw`

En ningún momento una importación fallida debe dejar el documento activo con variables CSS personalizadas parciales aplicadas.

## Archivos que se espera que cambien en la implementación

Archivos principales:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Ayudantes nuevos probables:

- `ui/src/ui/custom-theme.ts`

Pruebas:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nuevas pruebas enfocadas para análisis de URL y normalización de carga útil

## Pruebas

Cobertura mínima de implementación:

- analizar URL de enlace compartido en id de tema de tweakcn
- normalizar `/themes/{id}` y `/r/themes/{id}` en la URL de obtención
- rechazar hosts no admitidos e ids mal formados
- validar la forma de la carga útil de tweakcn
- mapear una carga útil válida de tweakcn en mapas de tokens claros y oscuros normalizados de OpenClaw
- cargar y guardar la carga útil personalizada en los ajustes locales del navegador
- resolver `custom` para `light`, `dark` y `system`
- deshabilitar la selección de `Custom` cuando no existe una carga útil
- aplicar el tema importado inmediatamente cuando `custom` ya está activo
- volver a `claw` cuando se borra el tema personalizado activo

Objetivo de verificación manual:

- importar un tema conocido de tweakcn desde Ajustes
- cambiar entre `light`, `dark` y `system`
- cambiar entre `custom` y las familias integradas
- recargar la página y confirmar que el tema personalizado importado persiste localmente

## Notas de despliegue

Esta función es intencionadamente pequeña. Si más adelante los usuarios piden varios temas importados, renombrado, exportación o sincronización entre dispositivos, trátalo como un diseño posterior. No preconstruyas una abstracción de biblioteca de temas en esta implementación.
