---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones avanzadas de memoria, como reordenación por relevancia o rutas indexadas adicionales
summary: Componente auxiliar de búsqueda con prioridad local que usa BM25, vectores, reordenamiento y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-04-30T05:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un componente auxiliar de búsqueda que prioriza lo local y se ejecuta junto a OpenClaw. Combina BM25, búsqueda vectorial y reordenación en un único binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué añade frente al motor incorporado

- **Reordenación y expansión de consultas** para una mejor recuperación.
- **Indexación de directorios adicionales** -- documentación de proyectos, notas del equipo, cualquier cosa en disco.
- **Indexación de transcripciones de sesiones** -- recupera conversaciones anteriores.
- **Totalmente local** -- se ejecuta con el paquete de runtime opcional node-llama-cpp y descarga automáticamente modelos GGUF.
- **Reserva automática** -- si QMD no está disponible, OpenClaw recurre sin interrupciones al motor incorporado.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan directamente. Windows tiene mejor soporte mediante WSL2.

### Activar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio de QMD autónomo en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida del componente auxiliar: las colecciones, las actualizaciones y las ejecuciones de embeddings se gestionan por ti. Prefiere las formas actuales de colección de QMD y consulta MCP, pero sigue recurriendo a indicadores de patrones de colección alternativos y nombres antiguos de herramientas MCP cuando hace falta. La reconciliación durante el arranque también recrea colecciones gestionadas obsoletas para devolverlas a sus patrones canónicos cuando todavía existe una colección QMD anterior con el mismo nombre.

## Cómo funciona el componente auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y cualquier `memory.qmd.paths` configurado, luego ejecuta `qmd update` cuando se abre el gestor de QMD y periódicamente después (cada 5 minutos de forma predeterminada). Estas actualizaciones se ejecutan mediante subprocesos de QMD, no con un rastreo del sistema de archivos dentro del proceso. Los modos semánticos también ejecutan `qmd embed`.
- La colección predeterminada del espacio de trabajo hace seguimiento de `MEMORY.md` y del árbol `memory/`. `memory.md` en minúsculas no se indexa como archivo de memoria raíz.
- El escáner propio de QMD ignora rutas ocultas y directorios comunes de dependencias/compilación como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y `build`. El inicio del Gateway no inicializa QMD de forma predeterminada, por lo que el arranque en frío evita importar el runtime de memoria o crear el observador de larga duración antes de que se use memoria por primera vez.
- Si aun así quieres una actualización al iniciar el Gateway, establece `memory.qmd.update.startup` en `idle` o `immediate`. La actualización de inicio opcional usa una ruta de subproceso QMD de una sola ejecución en lugar de crear el observador completo de larga duración dentro del proceso.
- Las búsquedas usan el `searchMode` configurado (predeterminado: `search`; también admite `vsearch` y `query`). `search` es solo BM25, por lo que OpenClaw omite las sondas de preparación vectorial semántica y el mantenimiento de embeddings en ese modo. Si un modo falla, OpenClaw reintenta con `qmd query`.
- Con versiones de QMD que anuncian filtros multcolección, OpenClaw agrupa colecciones del mismo origen en una única invocación de búsqueda QMD. Las versiones anteriores de QMD mantienen la reserva compatible por colección.
- Si QMD falla por completo, OpenClaw recurre al motor SQLite incorporado. Los intentos repetidos en turnos de chat aplican una breve espera tras un fallo de apertura para que un binario ausente o una dependencia rota del componente auxiliar no cree una tormenta de reintentos; `openclaw memory status` y las sondas CLI de una sola ejecución siguen comprobando QMD directamente.

<Info>
La primera búsqueda puede ser lenta -- QMD descarga automáticamente modelos GGUF (~2 GB) para reordenación y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Rendimiento de búsqueda y compatibilidad

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales como antiguas de QMD.

Al iniciar, OpenClaw comprueba una vez por gestor el texto de ayuda de QMD instalado. Si el binario anuncia soporte para múltiples filtros de colección, OpenClaw busca en todas las colecciones del mismo origen con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso QMD por cada colección de memoria duradera. Las colecciones de transcripciones de sesión permanecen en su propio grupo de origen, por lo que las búsquedas mixtas de `memory` + `sessions` siguen proporcionando al diversificador de resultados entradas de ambos orígenes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una de esas compilaciones, mantiene la ruta de compatibilidad y busca en cada colección por separado antes de fusionar y deduplicar los resultados.

Para inspeccionar manualmente el contrato instalado, ejecuta:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD indica que los filtros de colección pueden apuntar a una o más colecciones. La ayuda antigua suele describir una sola colección.

## Sobrescrituras de modelos

Las variables de entorno de modelos de QMD pasan sin cambios desde el proceso del Gateway, por lo que puedes ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embeddings, vuelve a ejecutar los embeddings para que el índice coincida con el nuevo espacio vectorial.

## Indexación de rutas adicionales

Apunta QMD a directorios adicionales para que puedan buscarse:

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

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en los resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la raíz de colección correcta.

## Indexación de transcripciones de sesiones

Activa la indexación de sesiones para recuperar conversaciones anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos User/Assistant saneados a una colección QMD dedicada en `~/.openclaw/agents/<id>/qmd/sessions/`.

## Alcance de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD se muestran en sesiones directas y de canal (no en grupos). Configura `memory.qmd.scope` para cambiar esto:

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

Cuando el alcance deniega una búsqueda, OpenClaw registra una advertencia con el canal y el tipo de chat derivados para que los resultados vacíos sean más fáciles de depurar.

## Citas

Cuando `memory.citations` es `auto` u `on`, los fragmentos de búsqueda incluyen un pie de página `Source: <path#line>`. Establece `memory.citations = "off"` para omitir el pie de página y seguir pasando internamente la ruta al agente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reordenación para obtener resultados de mayor calidad.
- Buscar documentación de proyectos o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves API.

Para configuraciones más simples, el [motor incorporado](/es/concepts/memory-builtin) funciona bien sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del Gateway. Si OpenClaw se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en tu shell pero OpenClaw sigue informando
`spawn qmd ENOENT`, probablemente el proceso del Gateway tiene un `PATH` distinto al de tu shell interactiva. Fija el binario explícitamente:

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

Usa `command -v qmd` en el entorno donde QMD está instalado y luego vuelve a comprobar con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF en el primer uso. Precaliéntalo con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿Muchos subprocesos QMD durante la búsqueda?** Actualiza QMD si es posible. OpenClaw usa un solo proceso para búsquedas multcolección del mismo origen únicamente cuando el QMD instalado anuncia soporte para múltiples filtros `-c`; de lo contrario, mantiene la reserva antigua por colección por corrección.

**¿QMD solo BM25 sigue intentando compilar llama.cpp?** Establece
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como solo léxico, no ejecuta sondas de estado vectorial de QMD ni mantenimiento de embeddings, y deja las comprobaciones de preparación semántica a configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (predeterminado: 4000ms). Establécelo en `120000` para hardware más lento.

**¿Resultados vacíos en chats de grupo?** Comprueba `memory.qmd.scope` -- el valor predeterminado solo permite sesiones directas y de canal.

**¿La búsqueda de memoria raíz se volvió demasiado amplia de repente?** Reinicia el Gateway o espera a la próxima reconciliación de inicio. OpenClaw recrea las colecciones gestionadas obsoletas de vuelta a los patrones canónicos `MEMORY.md` y `memory/` cuando detecta un conflicto con el mismo nombre.

**¿Repos temporales visibles desde el espacio de trabajo causan `ENAMETOOLONG` o indexación rota?**
Actualmente, el recorrido de QMD sigue el comportamiento del escáner QMD subyacente en lugar de las reglas de enlaces simbólicos incorporadas de OpenClaw. Mantén checkouts temporales de monorepos dentro de directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga recorridos seguros frente a ciclos o controles de exclusión explícitos.

## Configuración

Para la superficie completa de configuración (`memory.qmd.*`), modos de búsqueda, intervalos de actualización, reglas de alcance y todos los demás controles, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria incorporado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
