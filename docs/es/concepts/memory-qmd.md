---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones de memoria avanzadas como reranking o rutas indexadas adicionales
summary: Servicio auxiliar de búsqueda con prioridad local con BM25, vectores, reordenación y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-06-28T22:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un auxiliar de búsqueda local-first que se ejecuta
junto a OpenClaw. Combina BM25, búsqueda vectorial y reranking en un único
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué añade frente al integrado

- **Reranking y expansión de consultas** para mejorar la recuperación.
- **Indexar directorios adicionales** -- documentación del proyecto, notas del equipo, cualquier cosa en disco.
- **Indexar transcripciones de sesiones** -- recupera conversaciones anteriores.
- **Totalmente local** -- se ejecuta con el Plugin de proveedor oficial llama.cpp y
  descarga automáticamente modelos GGUF.
- **Fallback automático** -- si QMD no está disponible, OpenClaw vuelve al motor
  integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan sin configuración adicional. Windows se admite mejor mediante WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio QMD autónomo en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del auxiliar -- las colecciones, actualizaciones y ejecuciones de embeddings se gestionan por ti.
Prefiere las formas actuales de colección QMD y consulta MCP, pero sigue recurriendo a
flags de patrones de colección alternativos y nombres de herramientas MCP anteriores cuando es necesario.
La reconciliación en el arranque también recrea las colecciones gestionadas obsoletas con sus
patrones canónicos cuando todavía existe una colección QMD anterior con el mismo nombre.

## Cómo funciona el auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y cualquier
  `memory.qmd.paths` configurado, luego ejecuta `qmd update` cuando se abre el gestor QMD
  y periódicamente después (de forma predeterminada, cada 5 minutos). Estas actualizaciones
  se ejecutan mediante subprocesos QMD, no mediante un rastreo del sistema de archivos dentro del proceso. Los modos semánticos
  también ejecutan `qmd embed`.
- La colección predeterminada del espacio de trabajo rastrea `MEMORY.md` más el árbol
  `memory/`. `memory.md` en minúsculas no se indexa como archivo raíz de memoria.
- El propio escáner de QMD ignora rutas ocultas y directorios comunes de dependencias/compilación
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. El inicio del Gateway no inicializa QMD de forma predeterminada, por lo que el arranque en frío
  evita importar el runtime de memoria o crear el observador de larga duración antes de
  que la memoria se use por primera vez.
- Si quieres que QMD se inicialice de todos modos al iniciar el Gateway, establece
  `memory.qmd.update.startup` en `idle` o `immediate`. Con
  `memory.qmd.update.onBoot: true`, el inicio ejecuta la actualización inicial. Con
  `onBoot: false`, el inicio omite esa actualización inmediata, pero aun así abre el
  gestor de larga duración cuando se configuran intervalos de actualización o embedding, para que QMD pueda
  encargarse de su observador y temporizadores regulares.
- Las búsquedas usan el `searchMode` configurado (predeterminado: `search`; también admite
  `vsearch` y `query`). `search` es solo BM25, por lo que OpenClaw omite las pruebas de preparación
  vectorial semántica y el mantenimiento de embeddings en ese modo. Si un modo
  falla, OpenClaw reintenta con `qmd query`.
- Cuando `searchMode` es `query`, establece `memory.qmd.rerank` en `false` para usar la ruta
  de consulta híbrida de QMD sin el reranker. OpenClaw pasa `--no-rerank` a la ruta directa
  de la CLI de QMD y `rerank: false` a la herramienta de consulta MCP de QMD. Esta opción
  requiere QMD 2.1 o más reciente.
- Con versiones de QMD que anuncian filtros de múltiples colecciones, OpenClaw agrupa
  colecciones de la misma fuente en una invocación de búsqueda QMD. Las versiones anteriores de QMD
  mantienen el fallback compatible por colección.
- Si QMD falla por completo, OpenClaw vuelve al motor SQLite integrado.
  Los intentos repetidos durante turnos de chat retroceden brevemente después de un fallo de apertura para que
  un binario faltante o una dependencia rota del auxiliar no cree una tormenta de reintentos;
  `openclaw memory status` y las pruebas puntuales de CLI siguen comprobando QMD directamente.

<Info>
La primera búsqueda puede ser lenta -- QMD descarga automáticamente modelos GGUF (~2 GB) para
reranking y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Rendimiento de búsqueda y compatibilidad

OpenClaw mantiene la ruta de búsqueda QMD compatible tanto con instalaciones actuales como anteriores de QMD.

Al iniciar, OpenClaw comprueba una vez por gestor el texto de ayuda de QMD instalado. Si el
binario anuncia compatibilidad con varios filtros de colección, OpenClaw busca en todas las
colecciones de la misma fuente con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso QMD por cada colección de memoria duradera.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de fuente, por lo que las búsquedas mixtas
de `memory` + `sessions` siguen proporcionando al diversificador de resultados entradas de ambas
fuentes.

Las compilaciones anteriores de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas compilaciones, mantiene la ruta de compatibilidad y busca cada colección
por separado antes de fusionar y deduplicar resultados.

Para inspeccionar manualmente el contrato instalado, ejecuta:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD indica que los filtros de colección pueden apuntar a una o más colecciones.
La ayuda anterior suele describir una sola colección.

## Sobrescrituras de modelos

Las variables de entorno de modelos QMD se pasan sin cambios desde el proceso
del Gateway, para que puedas ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embeddings, vuelve a ejecutar los embeddings para que el índice coincida con el
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

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en
los resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la raíz correcta
de la colección.

## Indexar transcripciones de sesiones

Habilita la indexación de sesiones para recuperar conversaciones anteriores. QMD necesita tanto la fuente general
de sesión `memorySearch` como el exportador de transcripciones QMD:

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

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección QMD
dedicada en `~/.openclaw/agents/<id>/qmd/sessions/`. Establecer solo
`memorySearch.experimental.sessionMemory` no exporta transcripciones a QMD.

Los aciertos de sesión siguen filtrándose mediante
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La visibilidad predeterminada
`tree` no expone sesiones no relacionadas del mismo agente. Si una sesión
despachada por el Gateway debe poder recuperarse desde una sesión de DM separada, establece
`tools.sessions.visibility: "agent"` de forma intencional.

## Alcance de búsqueda

De forma predeterminada, los resultados de búsqueda QMD se muestran en sesiones directas y de canal
(no en grupos). Configura `memory.qmd.scope` para cambiar esto:

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

Cuando el alcance deniega una búsqueda, OpenClaw registra una advertencia con el canal derivado y
el tipo de chat para que sea más fácil depurar resultados vacíos.

## Citas

Cuando `memory.citations` está en `auto` u `on`, los fragmentos de búsqueda incluyen un
pie `Source: <path#line>`. Establece `memory.citations = "off"` para omitir el pie
y aun así pasar internamente la ruta al agente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reranking para resultados de mayor calidad.
- Buscar documentación o notas del proyecto fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves API.

Para configuraciones más simples, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en tu shell pero OpenClaw sigue informando
`spawn qmd ENOENT`, probablemente el proceso del Gateway tenga un `PATH` distinto al de tu
shell interactivo. Fija el binario explícitamente:

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

Usa `command -v qmd` en el entorno donde QMD está instalado y luego vuelve a comprobar
con `openclaw memory status --deep`.

**¿Primera búsqueda muy lenta?** QMD descarga modelos GGUF en el primer uso. Precaliéntalo
con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿Muchos subprocesos QMD durante la búsqueda?** Actualiza QMD si es posible. OpenClaw usa
un proceso para búsquedas de múltiples colecciones de la misma fuente solo cuando el QMD instalado
anuncia compatibilidad con varios filtros `-c`; de lo contrario, mantiene el fallback anterior
por colección para garantizar la corrección.

**¿QMD solo BM25 sigue intentando compilar llama.cpp?** Establece
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como solo léxico,
no ejecuta pruebas de estado vectorial de QMD ni mantenimiento de embeddings, y deja
las comprobaciones de preparación semántica a configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (predeterminado: 4000 ms).
Establécelo en `120000` para hardware más lento.

**¿Resultados vacíos en chats de grupo?** Comprueba `memory.qmd.scope` -- el valor predeterminado solo
permite sesiones directas y de canal.

**¿La búsqueda de memoria raíz se volvió demasiado amplia de repente?** Reinicia el Gateway o espera a
la siguiente reconciliación de inicio. OpenClaw recrea las colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando detecta un conflicto
con el mismo nombre.

**¿Repos temporales visibles para el espacio de trabajo causan `ENAMETOOLONG` o indexación rota?**
El recorrido de QMD actualmente sigue el comportamiento del escáner QMD subyacente en lugar de
las reglas de enlaces simbólicos integradas de OpenClaw. Mantén los checkouts temporales de monorepo bajo
directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga
recorrido seguro frente a ciclos o controles de exclusión explícitos.

## Configuración

Para ver toda la superficie de configuración (`memory.qmd.*`), modos de búsqueda, intervalos de actualización,
reglas de alcance y todos los demás controles, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
