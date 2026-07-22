---
read_when:
    - Quieres configurar QMD como backend de memoria
    - Se necesitan funciones de memoria avanzadas, como la reranquización o rutas indexadas adicionales
summary: Servicio auxiliar de búsqueda local con BM25, vectores, reordenación y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-07-22T10:31:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c0e54dc9a18d834036e4c79d6b7bdecb268a29976d9f30ea6e82a56ca5d71fda
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un servicio auxiliar de búsqueda con prioridad local que se ejecuta
junto con OpenClaw. Combina BM25, búsqueda vectorial y reclasificación en un único
binario, y puede indexar contenido más allá de los archivos de memoria del espacio de trabajo.

## Qué añade respecto al motor integrado

- **Reclasificación y expansión de consultas** para mejorar la exhaustividad.
- **Indexación de directorios adicionales**: documentación de proyectos, notas del equipo y cualquier contenido del disco.
- **Indexación de transcripciones de sesiones**: permite recordar conversaciones anteriores.
- **Totalmente local**: se ejecuta con el Plugin proveedor oficial de llama.cpp y
  descarga automáticamente los modelos GGUF.
- **Alternativa automática**: si QMD no está disponible, OpenClaw utiliza el
  motor integrado de forma transparente.

## Primeros pasos

### Requisitos previos

- Instale QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Una compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan sin configuración adicional. En Windows, se recomienda utilizar WSL2.

### Activación

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio principal autónomo de QMD en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del servicio auxiliar: las colecciones, las actualizaciones y las ejecuciones de incrustación se administran automáticamente.
Da preferencia a los formatos actuales de colecciones y consultas MCP de QMD, pero recurre a
indicadores alternativos de patrones de colecciones y a nombres antiguos de herramientas MCP cuando es necesario.
La conciliación durante el inicio también vuelve a crear las colecciones administradas obsoletas con sus
patrones canónicos cuando todavía existe una colección antigua de QMD con el mismo nombre.

## Funcionamiento del servicio auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria del espacio de trabajo y de los
  `memory.qmd.paths` configurados. El adaptador de QMD controla las heurísticas de actualización,
  incrustación, antirrebote y tiempo de espera; no son opciones configurables por el usuario.
- QMD sigue controlando su `index.sqlite`, la configuración YAML de las colecciones y las
  descargas de modelos dentro del directorio principal de QMD de cada agente; estos son artefactos
  de una herramienta externa, no tablas de estado de OpenClaw. La coordinación propiedad de OpenClaw reside únicamente en SQLite:
  una concesión compartida limita el trabajo de incrustación entre los agentes, mientras que una concesión en cada
  base de datos de agente serializa las escrituras de colección, actualización e incrustación de ese agente.
  El entorno de ejecución ya no crea archivos auxiliares de bloqueo de QMD. `openclaw doctor --fix`
  elimina los archivos auxiliares retirados solo después de comprobar que el antiguo proceso propietario está obsoleto.
  Las actualizaciones requieren una transición completa: detenga y reinicie todos los procesos de OpenClaw que
  compartan el directorio de estado antes de usar la nueva versión. No se admite la combinación de procesos de escritura
  antiguos y nuevos de QMD; el entorno de ejecución no aplica deliberadamente un doble bloqueo a los archivos auxiliares
  retirados.
- La colección predeterminada del espacio de trabajo realiza el seguimiento de `MEMORY.md` y del árbol
  `memory/`. El archivo `memory.md` en minúsculas no se indexa como archivo de memoria raíz.
- El analizador propio de QMD ignora las rutas ocultas y los directorios habituales de dependencias y
  compilación, como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. El inicio del Gateway mantiene QMD en modo diferido; el gestor se inicializa cuando se utiliza
  la memoria por primera vez.
- Las búsquedas utilizan el `searchMode` configurado (valor predeterminado: `search`; también admite
  `vsearch` y `query`). `search` utiliza únicamente BM25, por lo que OpenClaw omite las comprobaciones
  de disponibilidad vectorial semántica y el mantenimiento de incrustaciones en ese modo. Si un modo
  falla, OpenClaw vuelve a intentarlo con `qmd query`.
- Cuando `searchMode` sea `query`, establezca `memory.qmd.rerank` en `false` para utilizar
  la ruta de consultas híbridas de QMD sin el reclasificador (requiere QMD 2.1 o una versión posterior).
  OpenClaw pasa `--no-rerank` a la ruta directa de la CLI de QMD y
  `rerank: false` a la herramienta de consultas MCP de QMD.
- Con las versiones de QMD que anuncian filtros para varias colecciones, OpenClaw agrupa
  las colecciones del mismo origen en una sola invocación de búsqueda de QMD. Las versiones anteriores de QMD
  mantienen la alternativa compatible por colección.
- Si QMD falla por completo, OpenClaw recurre al motor SQLite integrado.
  Los intentos repetidos durante los turnos de chat aplican brevemente un tiempo de espera incremental tras un fallo
  de apertura, para que la ausencia del binario o una dependencia averiada del servicio auxiliar no genere una avalancha
  de reintentos; `openclaw memory status` y las comprobaciones puntuales de la CLI siguen verificando QMD
  directamente.

<Info>
La primera búsqueda puede ser lenta: QMD descarga automáticamente modelos GGUF (~2 GB) para
la reclasificación y la expansión de consultas durante la primera ejecución de `qmd query`.
</Info>

## Rendimiento y compatibilidad de la búsqueda

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales como
anteriores de QMD.

Al iniciarse, OpenClaw comprueba una vez por gestor el texto de ayuda de la versión instalada de QMD. Si
el binario anuncia compatibilidad con varios filtros de colecciones, OpenClaw
busca en todas las colecciones del mismo origen mediante un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria persistente.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de origen, por lo que las búsquedas
combinadas de `memory` y `sessions` siguen proporcionando al diversificador de resultados datos de
ambos orígenes.

Las versiones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas versiones, mantiene la ruta de compatibilidad y busca en cada colección
por separado antes de combinar y desduplicar los resultados.

Para inspeccionar manualmente el contrato instalado, ejecute:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD menciona la selección de una o varias colecciones. La ayuda antigua
suele describir una sola colección.

## Sustitución de modelos

Las variables de entorno de modelos de QMD se transmiten sin cambios desde el proceso del Gateway,
por lo que se puede ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de incrustación, vuelva a ejecutar las incrustaciones para que el índice coincida con el
nuevo espacio vectorial.

## Indexación de rutas adicionales

Indique a QMD otros directorios para que se puedan buscar:

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
resultados de búsqueda. `memory_get` reconoce este prefijo y lee desde la
raíz correcta de la colección.

## Indexación de transcripciones de sesiones

Active la indexación de sesiones para recordar conversaciones anteriores. QMD necesita tanto el
origen general de sesiones `memory.search` como el exportador de transcripciones de QMD:

```json5
{
  memory: {
    backend: "qmd",
    search: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"],
    },
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección dedicada de QMD
en `~/.openclaw/agents/<id>/qmd/sessions/`. Configurar únicamente
`sources: ["sessions"]` no exporta las transcripciones a QMD; active también
`rememberAcrossConversations` o la exportación explícita de sesiones de QMD.

Los resultados de sesiones siguen filtrándose mediante
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La
visibilidad predeterminada `tree` incluye la sesión actual, las sesiones que esta genera
y las sesiones de grupo del mismo agente supervisadas mediante el reconocimiento ambiental de grupos. Con
`session.dmScope: "main"`, los usuarios de una configuración de mensajes directos multiusuario comparten la sesión
principal y pueden recordar contenido de sus grupos supervisados. Use un
`dmScope` por interlocutor para aislar los mensajes directos, o establezca la visibilidad en `"self"` para excluir
las lecturas ambientales de sesiones supervisadas. Otras sesiones no relacionadas del mismo agente siguen requiriendo
la visibilidad `"agent"`.

## Ámbito de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD solo se muestran en sesiones directas, no en
chats de grupo ni de canal. Configure `memory.qmd.scope` para cambiarlo:

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

El fragmento anterior es la regla predeterminada real. Cuando el ámbito rechaza una búsqueda,
OpenClaw registra una advertencia con el canal y el tipo de chat derivados para facilitar
la depuración de resultados vacíos.

## Citas

Cuando `memory.citations` sea `auto` o `on`, se añade a los fragmentos de búsqueda un
pie `Source: <path>#L<line>` (o `#L<start>-L<end>`). En el modo `auto`,
el pie solo se añade en las sesiones de chat directo. Establezca
`memory.citations = "off"` para omitir el pie y seguir transmitiendo internamente la ruta
al agente.

## Cuándo utilizarlo

Elija QMD cuando necesite:

- Reclasificación para obtener resultados de mayor calidad.
- Buscar documentación o notas de proyectos fuera del espacio de trabajo.
- Recordar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrese de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, cree un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en el intérprete de comandos, pero OpenClaw sigue indicando
`spawn qmd ENOENT`, es probable que el proceso del Gateway tenga un `PATH` diferente del
intérprete de comandos interactivo. Especifique explícitamente el binario:

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

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF la primera vez que se utiliza. Precaliéntelo
con `qmd query "test"` usando los mismos directorios XDG que utiliza OpenClaw.

**¿Se ejecutan muchos subprocesos de QMD durante la búsqueda?** Actualice QMD si es posible. OpenClaw
utiliza un solo proceso para las búsquedas en varias colecciones del mismo origen únicamente cuando la
versión instalada de QMD anuncia compatibilidad con varios filtros `-c`; de lo contrario,
mantiene la alternativa antigua por colección para garantizar la corrección.

**¿QMD configurado solo para BM25 sigue intentando compilar llama.cpp?** Establezca
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como
exclusivamente léxico, omite las comprobaciones del estado vectorial de QMD y el mantenimiento de incrustaciones,
y deja las comprobaciones de disponibilidad semántica a las configuraciones `vsearch` o `query`.

**¿Se agota el tiempo de espera de la búsqueda?** Aumente `memory.qmd.limits.timeoutMs` (valor predeterminado: 4000ms).
Establézcalo en un valor mayor, por ejemplo `120000`, para hardware más lento. Este límite se aplica a
los comandos de búsqueda propios de QMD durante las llamadas `memory_search` del agente; la configuración, la sincronización,
la alternativa integrada y el trabajo complementario del corpus mantienen sus propios plazos más cortos.

**¿Resultados vacíos en chats de grupo o de canal?** Es el comportamiento esperado con el
valor predeterminado `memory.qmd.scope`, que solo permite sesiones directas. Añada una
regla `allow` para los tipos de chat `group` o `channel` si desea obtener resultados de QMD
en ellos.

**¿La búsqueda en la memoria raíz se ha vuelto demasiado amplia de repente?** Reinicie el Gateway o espere
a la siguiente conciliación durante el inicio. OpenClaw vuelve a crear las colecciones administradas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando
detecta un conflicto de nombres.

**¿Los repositorios temporales visibles desde el espacio de trabajo causan `ENAMETOOLONG` o errores de indexación?**
El recorrido de QMD utiliza el analizador subyacente de QMD en lugar de las
reglas de enlaces simbólicos del motor integrado de OpenClaw. Mantenga las copias de trabajo temporales de monorrepositorios en
directorios ocultos como `.tmp/` o fuera de las raíces indexadas de QMD hasta que QMD ofrezca
un recorrido seguro frente a ciclos o controles explícitos de exclusión.

## Configuración

Para consultar toda la superficie de configuración (`memory.qmd.*`), los modos de búsqueda, los intervalos de actualización,
las reglas de ámbito y el resto de opciones, consulte la
[referencia de configuración de memoria](/es/reference/memory-config).

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
