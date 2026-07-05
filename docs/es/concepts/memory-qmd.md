---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones avanzadas de memoria como reclasificación o rutas indexadas adicionales
summary: Sidecar de búsqueda local-first con BM25, vectores, reordenación y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-07-05T11:14:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un sidecar de búsqueda local-first que se ejecuta
junto a OpenClaw. Combina BM25, búsqueda vectorial y reranking en un único
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué añade sobre el integrado

- **Reranking y expansión de consultas** para mejorar la recuperación.
- **Indexa directorios adicionales**: documentación del proyecto, notas del equipo, cualquier cosa en disco.
- **Indexa transcripciones de sesiones**: recupera conversaciones anteriores.
- **Totalmente local**: se ejecuta con el plugin de proveedor oficial de llama.cpp y
  descarga automáticamente modelos GGUF.
- **Fallback automático**: si QMD no está disponible, OpenClaw vuelve al motor
  integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan directamente. Windows tiene mejor soporte mediante WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio de QMD autónomo bajo
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del sidecar: las colecciones, actualizaciones y ejecuciones de embeddings se gestionan por ti.
Prefiere las formas actuales de colección de QMD y consulta MCP, pero vuelve a
flags alternativos de patrón de colección y nombres de herramientas MCP más antiguos cuando es necesario.
La reconciliación de inicio también vuelve a crear colecciones gestionadas obsoletas con sus
patrones canónicos cuando una colección QMD más antigua con el mismo nombre sigue
presente.

## Cómo funciona el sidecar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y cualquier
  `memory.qmd.paths` configurado, y luego ejecuta `qmd update` cuando se abre el gestor de QMD
  y periódicamente después (`memory.qmd.update.interval`, valor predeterminado
  `5m`). Las actualizaciones se ejecutan mediante subprocesos de QMD, no con un rastreo del
  sistema de archivos dentro del proceso. Los modos de búsqueda semántica también ejecutan `qmd embed`
  (`memory.qmd.update.embedInterval`, valor predeterminado `60m`).
- La colección predeterminada del espacio de trabajo rastrea `MEMORY.md` más el árbol
  `memory/`. `memory.md` en minúsculas no se indexa como archivo raíz de memoria.
- El escáner propio de QMD ignora rutas ocultas y directorios comunes de dependencias/compilación
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. El inicio del Gateway no inicializa QMD de forma predeterminada
  (`memory.qmd.update.startup` tiene `off` como valor predeterminado), por lo que un arranque en frío evita
  importar el runtime de memoria o crear el observador de larga duración antes de que
  se use memoria por primera vez.
- Establece `memory.qmd.update.startup` en `idle` o `immediate` para inicializar QMD
  al iniciar el Gateway de todos modos. `memory.qmd.update.onBoot` tiene `true` como valor predeterminado y
  ejecuta la actualización inicial al inicio; establécelo en `false` para omitir esa
  actualización inmediata (el gestor de larga duración se sigue abriendo cuando se configuran intervalos
  de actualización o embedding, por lo que QMD conserva la propiedad de su observador/temporizadores regulares).
- Las búsquedas usan el `searchMode` configurado (valor predeterminado: `search`; también admite
  `vsearch` y `query`). `search` es solo BM25, por lo que OpenClaw omite las
  comprobaciones de preparación vectorial semántica y el mantenimiento de embeddings en ese modo. Si un modo
  falla, OpenClaw reintenta con `qmd query`.
- Cuando `searchMode` es `query`, establece `memory.qmd.rerank` en `false` para usar
  la ruta de consulta híbrida de QMD sin el reranker (requiere QMD 2.1 o posterior).
  OpenClaw pasa `--no-rerank` a la ruta directa de la CLI de QMD y
  `rerank: false` a la herramienta de consulta MCP de QMD.
- Con versiones de QMD que anuncian filtros de múltiples colecciones, OpenClaw agrupa
  colecciones de la misma fuente en una sola invocación de búsqueda de QMD. Las versiones más antiguas de QMD
  conservan el fallback compatible por colección.
- Si QMD falla por completo, OpenClaw vuelve al motor SQLite integrado.
  Los intentos repetidos en turnos de chat aplican una pausa breve tras un fallo de apertura para que un
  binario ausente o una dependencia rota del sidecar no genere una tormenta de reintentos;
  `openclaw memory status` y las comprobaciones puntuales de CLI siguen volviendo a comprobar QMD
  directamente.

<Info>
La primera búsqueda puede ser lenta: QMD descarga automáticamente modelos GGUF (~2 GB) para
reranking y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Rendimiento de búsqueda y compatibilidad

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales como antiguas de QMD.

Al iniciar, OpenClaw comprueba una vez por gestor el texto de ayuda de QMD instalado. Si
el binario anuncia compatibilidad con múltiples filtros de colección, OpenClaw
busca en todas las colecciones de la misma fuente con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria duradera.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de origen, por lo que las búsquedas mixtas
`memory` + `sessions` siguen dando al diversificador de resultados entrada de
ambas fuentes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas compilaciones, conserva la ruta de compatibilidad y busca en cada colección
por separado antes de fusionar y deduplicar resultados.

Para inspeccionar manualmente el contrato instalado, ejecuta:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD menciona apuntar a una o más colecciones. La ayuda antigua
normalmente describe una sola colección.

## Sobrescrituras de modelo

Las variables de entorno de modelo de QMD pasan sin cambios desde el proceso del Gateway,
por lo que puedes ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embedding, vuelve a ejecutar los embeddings para que el índice coincida con el
nuevo espacio vectorial.

## Indexar rutas adicionales

Apunta QMD a directorios adicionales para hacerlos buscables:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en los
resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la
raíz de colección correcta.

## Indexar transcripciones de sesiones

Habilita la indexación de sesiones para recuperar conversaciones anteriores. QMD necesita tanto la
fuente general de sesión `memorySearch` como el exportador de transcripciones de QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos User/Assistant saneados a una colección QMD
dedicada bajo `~/.openclaw/agents/<id>/qmd/sessions/`. Establecer solo
`memorySearch.experimental.sessionMemory` no exporta transcripciones a
QMD.

Las coincidencias de sesiones siguen filtrándose por
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La visibilidad
predeterminada `tree` no expone sesiones no relacionadas del mismo agente. Si una
sesión despachada por Gateway debe poder recuperarse desde una sesión de DM separada,
establece `tools.sessions.visibility: "agent"` de forma intencional.

## Alcance de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD se muestran solo en sesiones directas (no en
chats de grupo o canal). Configura `memory.qmd.scope` para cambiar esto:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

El fragmento anterior es la regla predeterminada real. Cuando el alcance deniega una búsqueda,
OpenClaw registra una advertencia con el canal y tipo de chat derivados para que los
resultados vacíos sean más fáciles de depurar.

## Citas

Cuando `memory.citations` es `auto` u `on`, los fragmentos de búsqueda reciben un
pie `Source: <path>#L<line>` (o `#L<start>-L<end>`) añadido. En modo `auto`
el pie solo se añade para sesiones de chat directo. Establece
`memory.citations = "off"` para omitir el pie y seguir pasando la ruta al
agente internamente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reranking para resultados de mayor calidad.
- Buscar documentación o notas del proyecto fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones pasadas.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más simples, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en tu shell pero OpenClaw sigue informando
`spawn qmd ENOENT`, es probable que el proceso del Gateway tenga un `PATH` diferente al de
tu shell interactivo. Fija el binario explícitamente:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Usa `command -v qmd` en el entorno donde QMD está instalado, y luego vuelve a comprobar
con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF en el primer uso. Precalienta
con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿Muchos subprocesos de QMD durante la búsqueda?** Actualiza QMD si es posible. OpenClaw
usa un proceso para búsquedas de múltiples colecciones de la misma fuente solo cuando el
QMD instalado anuncia compatibilidad con múltiples filtros `-c`; de lo contrario,
conserva el fallback antiguo por colección para mantener la corrección.

**¿QMD solo BM25 sigue intentando compilar llama.cpp?** Establece
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como
solo léxico, omite las comprobaciones de estado vectorial de QMD y el mantenimiento de embeddings, y
deja las comprobaciones de preparación semántica a configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (valor predeterminado:
4000ms). Establécelo más alto, por ejemplo `120000`, para hardware más lento.

**¿Resultados vacíos en chats de grupo o canal?** Esto es lo esperado con el
`memory.qmd.scope` predeterminado, que solo permite sesiones directas. Añade una regla
`allow` para tipos de chat `group` o `channel` si quieres resultados de QMD
allí.

**¿La búsqueda de memoria raíz se volvió demasiado amplia de repente?** Reinicia el Gateway o espera
la próxima reconciliación de inicio. OpenClaw vuelve a crear colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando
detecta un conflicto con el mismo nombre.

**¿Repos temporales visibles desde el espacio de trabajo causan `ENAMETOOLONG` o indexación rota?**
El recorrido de QMD sigue el escáner QMD subyacente en lugar de las
reglas de symlink integradas de OpenClaw. Mantén los checkouts temporales de monorepos bajo
directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga
recorrido seguro frente a ciclos o controles de exclusión explícitos.

## Configuración

Para la superficie completa de configuración (`memory.qmd.*`), modos de búsqueda, intervalos de actualización,
reglas de alcance y todos los demás controles, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
