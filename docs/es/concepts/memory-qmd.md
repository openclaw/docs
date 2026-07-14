---
read_when:
    - Quieres configurar QMD como backend de memoria
    - Se necesitan funciones avanzadas de memoria, como la reranquización o rutas indexadas adicionales.
summary: Servicio auxiliar de búsqueda local-first con BM25, vectores, reordenación y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-07-14T13:33:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un servicio auxiliar de búsqueda con prioridad local que se ejecuta
junto con OpenClaw. Combina BM25, búsqueda vectorial y reclasificación en un único
binario, y puede indexar contenido más allá de los archivos de memoria del espacio de trabajo.

## Qué aporta respecto al motor integrado

- **Reclasificación y expansión de consultas** para mejorar la exhaustividad.
- **Indexación de directorios adicionales**: documentación de proyectos, notas del equipo y cualquier contenido del disco.
- **Indexación de transcripciones de sesiones**: permite recuperar conversaciones anteriores.
- **Totalmente local**: se ejecuta con el plugin proveedor oficial de llama.cpp y
  descarga automáticamente los modelos GGUF.
- **Alternativa automática**: si QMD no está disponible, OpenClaw recurre al
  motor integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instale QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Una compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan directamente. En Windows, la mejor compatibilidad se obtiene mediante WSL2.

### Activación

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio autónomo para QMD en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del servicio auxiliar: las colecciones, actualizaciones y ejecuciones de incrustación se gestionan automáticamente.
Da preferencia a las formas actuales de las colecciones y consultas MCP de QMD, pero recurre a
indicadores alternativos de patrones de colección y nombres antiguos de herramientas MCP cuando es necesario.
La reconciliación al iniciar también vuelve a crear las colecciones gestionadas obsoletas con sus
patrones canónicos cuando sigue presente una colección antigua de QMD con el mismo nombre.

## Funcionamiento del servicio auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria del espacio de trabajo y de cualquier
  `memory.qmd.paths` configurado; después, ejecuta `qmd update` cuando se abre el gestor de QMD
  y periódicamente a partir de entonces (`memory.qmd.update.interval`, valor predeterminado:
  `5m`). Las actualizaciones se ejecutan mediante subprocesos de QMD, no mediante un rastreo
  del sistema de archivos dentro del proceso. Los modos de búsqueda semántica también ejecutan `qmd embed`
  (`memory.qmd.update.embedInterval`, valor predeterminado: `60m`).
- La colección predeterminada del espacio de trabajo realiza el seguimiento de `MEMORY.md` y del árbol `memory/`.
  El archivo `memory.md` en minúsculas no se indexa como archivo de memoria raíz.
- El analizador de QMD ignora las rutas ocultas y los directorios habituales de dependencias y compilación,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. De forma predeterminada, el inicio del Gateway no inicializa QMD
  (`memory.qmd.update.startup` tiene como valor predeterminado `off`), por lo que un arranque en frío evita
  importar el entorno de ejecución de memoria o crear el observador de larga duración antes
  del primer uso de la memoria.
- Establezca `memory.qmd.update.startup` en `idle` o `immediate` para inicializar QMD
  al iniciar el Gateway. `memory.qmd.update.onBoot` tiene como valor predeterminado `true` y
  ejecuta la actualización inicial al arrancar; establézcalo en `false` para omitir esa
  actualización inmediata (el gestor de larga duración se seguirá abriendo cuando se configuren
  intervalos de actualización o incrustación, por lo que QMD seguirá controlando su observador y temporizadores habituales).
- Las búsquedas utilizan el `searchMode` configurado (valor predeterminado: `search`; también admite
  `vsearch` y `query`). `search` solo utiliza BM25, por lo que OpenClaw omite las comprobaciones de
  disponibilidad de vectores semánticos y el mantenimiento de incrustaciones en ese modo. Si un modo
  falla, OpenClaw vuelve a intentarlo con `qmd query`.
- Cuando `searchMode` sea `query`, establezca `memory.qmd.rerank` en `false` para utilizar
  la ruta de consulta híbrida de QMD sin el reclasificador (requiere QMD 2.1 o posterior).
  OpenClaw pasa `--no-rerank` a la ruta directa de la CLI de QMD y
  `rerank: false` a la herramienta de consulta MCP de QMD.
- Con las versiones de QMD que anuncian filtros para varias colecciones, OpenClaw agrupa
  las colecciones del mismo origen en una única invocación de búsqueda de QMD. Las versiones anteriores de QMD
  conservan la alternativa compatible de una invocación por colección.
- Si QMD falla por completo, OpenClaw recurre al motor SQLite integrado.
  Los intentos repetidos durante turnos de chat aplican una breve espera tras un error de apertura para que
  la ausencia del binario o una dependencia averiada del servicio auxiliar no genere una tormenta de reintentos;
  `openclaw memory status` y las comprobaciones puntuales de la CLI siguen verificando QMD
  directamente.

<Info>
La primera búsqueda puede ser lenta: QMD descarga automáticamente modelos GGUF (~2 GB) para
la reclasificación y la expansión de consultas durante la primera ejecución de `qmd query`.
</Info>

## Rendimiento y compatibilidad de la búsqueda

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales como
antiguas de QMD.

Al iniciarse, OpenClaw comprueba una vez por gestor el texto de ayuda de la instalación de QMD. Si
el binario anuncia compatibilidad con varios filtros de colección, OpenClaw
busca en todas las colecciones del mismo origen con un único comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria persistente.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de origen, por lo que las búsquedas
combinadas de `memory` y `sessions` siguen proporcionando al diversificador de resultados datos de
ambos orígenes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas compilaciones, mantiene la ruta de compatibilidad y busca en cada colección
por separado antes de combinar y deduplicar los resultados.

Para inspeccionar manualmente el contrato instalado, ejecute:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD menciona la selección de una o varias colecciones. La ayuda antigua
suele describir una sola colección.

## Sustitución de modelos

Las variables de entorno de los modelos de QMD se transfieren sin cambios desde el proceso del Gateway,
por lo que es posible ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de incrustación, vuelva a ejecutar las incrustaciones para que el índice coincida con el
nuevo espacio vectorial.

## Indexación de rutas adicionales

Configure QMD para que apunte a directorios adicionales y permita realizar búsquedas en ellos:

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
los resultados de búsqueda. `memory_get` reconoce este prefijo y lee desde la
raíz correcta de la colección.

## Indexación de transcripciones de sesiones

Active la indexación de sesiones para recuperar conversaciones anteriores. QMD necesita tanto el
origen general de sesiones `memorySearch` como el exportador de transcripciones de QMD:

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

Las transcripciones se exportan como turnos de Usuario/Asistente depurados a una colección específica de QMD
en `~/.openclaw/agents/<id>/qmd/sessions/`. Establecer únicamente
`memorySearch.experimental.sessionMemory` no exporta las transcripciones a
QMD.

Los resultados de sesiones siguen filtrándose mediante
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La
visibilidad predeterminada `tree` no expone sesiones no relacionadas del mismo agente. Si una
sesión iniciada por el Gateway debe poder recuperarse desde una sesión de mensajes directos independiente,
establezca `tools.sessions.visibility: "agent"` de forma intencionada.

## Ámbito de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD solo se muestran en sesiones directas (no en
chats de grupo o de canal). Configure `memory.qmd.scope` para cambiar este comportamiento:

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

El fragmento anterior es la regla predeterminada real. Cuando el ámbito deniega una búsqueda,
OpenClaw registra una advertencia con el canal y el tipo de chat derivados para facilitar la
depuración de resultados vacíos.

## Citas

Cuando `memory.citations` es `auto` o `on`, se añade a los fragmentos de búsqueda
un pie `Source: <path>#L<line>` (o `#L<start>-L<end>`). En el modo `auto`,
el pie solo se añade en las sesiones de chat directo. Establezca
`memory.citations = "off"` para omitir el pie sin dejar de pasar internamente la ruta
al agente.

## Cuándo utilizarlo

Elija QMD cuando necesite:

- Reclasificación para obtener resultados de mayor calidad.
- Buscar documentación de proyectos o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrese de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, cree un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en el shell, pero OpenClaw sigue notificando
`spawn qmd ENOENT`, es probable que el proceso del Gateway tenga un `PATH` distinto del
shell interactivo. Especifique explícitamente el binario:

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

Utilice `command -v qmd` en el entorno donde esté instalado QMD y vuelva a comprobarlo
con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF durante el primer uso. Realice una
preparación previa con `qmd query "test"` utilizando los mismos directorios XDG que utiliza OpenClaw.

**¿Se inician muchos subprocesos de QMD durante la búsqueda?** Actualice QMD si es posible. OpenClaw
utiliza un único proceso para búsquedas en varias colecciones del mismo origen solo cuando la
instalación de QMD anuncia compatibilidad con varios filtros `-c`; de lo contrario,
conserva la alternativa antigua de una invocación por colección para garantizar la corrección.

**¿QMD configurado solo para BM25 sigue intentando compilar llama.cpp?** Establezca
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como
exclusivamente léxico, omite las comprobaciones de estado vectorial y el mantenimiento de incrustaciones de QMD, y
deja las comprobaciones de disponibilidad semántica para las configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumente `memory.qmd.limits.timeoutMs` (valor predeterminado: 4000ms).
Establézcalo en un valor mayor, por ejemplo `120000`, para hardware más lento. Este límite se aplica a
los comandos de búsqueda propios de QMD durante las llamadas `memory_search` del agente; la configuración, la sincronización,
la alternativa integrada y las tareas adicionales del corpus conservan sus propios plazos más breves.

**¿Se obtienen resultados vacíos en chats de grupo o de canal?** Este comportamiento es el esperado con el
valor predeterminado `memory.qmd.scope`, que solo permite sesiones directas. Añada una
regla `allow` para los tipos de chat `group` o `channel` si desea obtener resultados de QMD
en ellos.

**¿La búsqueda en la memoria raíz se ha vuelto demasiado amplia de repente?** Reinicie el Gateway o espere
a la siguiente reconciliación al iniciar. OpenClaw vuelve a crear las colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando
detecta un conflicto con el mismo nombre.

**¿Los repositorios temporales visibles desde el espacio de trabajo causan `ENAMETOOLONG` o errores de indexación?**
El recorrido de QMD sigue el analizador subyacente de QMD en lugar de las
reglas de enlaces simbólicos del motor integrado de OpenClaw. Mantenga las copias de trabajo temporales del monorrepositorio en
directorios ocultos como `.tmp/` o fuera de las raíces indexadas por QMD hasta que QMD proporcione
un recorrido seguro frente a ciclos o controles explícitos de exclusión.

## Configuración

Para consultar toda la superficie de configuración (`memory.qmd.*`), los modos de búsqueda, los intervalos de actualización,
las reglas de ámbito y todos los demás ajustes, consulte la
[referencia de configuración de memoria](/es/reference/memory-config).

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
