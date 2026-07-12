---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Necesitas comprender cómo OpenClaw convierte el contenido de los paquetes en funciones nativas
    - Estás depurando la detección de paquetes o la ausencia de capacidades
summary: Instala y usa los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de Plugins
x-i18n:
    generated_at: "2026-07-11T23:18:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar plugins de tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Se denominan **paquetes**: conjuntos de contenido y metadatos que
OpenClaw asigna a funciones nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  dentro del proceso y pueden registrar cualquier capacidad. Los paquetes son conjuntos de contenido con
  una asignación selectiva de funciones y un límite de confianza más restringido.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir que sus autores los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna el contenido compatible al conjunto de funciones
nativas. Puede instalar un paquete de comandos de Claude o un paquete de Skills de Codex y usarlo
inmediatamente.

## Instalar un paquete

<Steps>
  <Step title="Instalar desde un directorio, archivo comprimido o marketplace">
    ```bash
    # Directorio local
    openclaw plugins install ./my-bundle

    # Archivo comprimido
    openclaw plugins install ./my-bundle.tgz

    # Marketplace de Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` es una ruta o repositorio de marketplace local, o una fuente de git/GitHub.

  </Step>

  <Step title="Verificar la detección">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Los paquetes muestran `Format: bundle` junto con un valor `Bundle format:` de `codex`,
    `claude` o `cursor`.

  </Step>

  <Step title="Reiniciar y usar">
    ```bash
    openclaw gateway restart
    ```

    Las funciones asignadas (Skills, hooks, herramientas MCP y valores predeterminados de LSP) estarán disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

Actualmente no todas las funciones de los paquetes se ejecutan en OpenClaw. A continuación se indica qué funciona y qué
se detecta, pero aún no está conectado.

### Compatibilidad actual

| Función              | Cómo se asigna                                                                                                    | Se aplica a           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| Contenido de Skills  | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                                      | Todos los formatos    |
| Comandos             | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                                                | Claude, Cursor        |
| Paquetes de hooks    | Estructuras de estilo OpenClaw con `HOOK.md` + `handler.ts`                                                      | Codex                 |
| Herramientas MCP     | La configuración MCP del paquete se combina con la configuración integrada de OpenClaw; se cargan servidores stdio y HTTP compatibles | Todos los formatos    |
| Servidores LSP       | `.lsp.json` de Claude y los `lspServers` declarados en el manifiesto se combinan con los valores predeterminados de LSP integrado de OpenClaw | Claude                |
| Configuración        | `settings.json` de Claude se importa como valores predeterminados integrados de OpenClaw                         | Claude                |

#### Contenido de Skills

- Las raíces de Skills de los paquetes se cargan como raíces de Skills normales de OpenClaw.
- Las raíces `commands/` de Claude se tratan como raíces de Skills adicionales.
- Las raíces `.cursor/commands/` de Cursor se tratan como raíces de Skills adicionales.

Tanto los archivos de comandos Markdown de Claude como los de Cursor funcionan mediante el
cargador normal de Skills de OpenClaw.

#### Paquetes de hooks

Las raíces de hooks de los paquetes funcionan **solo** cuando usan la estructura normal de paquetes de hooks
de OpenClaw: `HOOK.md` junto con `handler.ts` o `handler.js`. Actualmente, esto corresponde principalmente
al caso compatible con Codex.

#### MCP para OpenClaw integrado

- Los paquetes habilitados pueden aportar configuración de servidores MCP.
- OpenClaw combina la configuración MCP de los paquetes con la configuración integrada efectiva de OpenClaw
  como `mcpServers`.
- OpenClaw expone las herramientas MCP compatibles de los paquetes durante los turnos del agente integrado de OpenClaw
  iniciando servidores stdio o conectándose a servidores HTTP.
- Los perfiles de herramientas `coding` y `messaging` incluyen las herramientas MCP de los paquetes de forma
  predeterminada; use `tools.deny: ["bundle-mcp"]` para desactivarlas en un agente o Gateway.
- La configuración local del proyecto para el agente integrado sigue aplicándose después de los valores predeterminados del paquete, por lo que
  la configuración del espacio de trabajo puede sobrescribir las entradas MCP del paquete cuando sea necesario.
- Los catálogos de herramientas MCP de los paquetes se ordenan de forma determinista antes del registro, para que
  los cambios en el orden de `listTools()` del sistema de origen no alteren continuamente los bloques de herramientas de la caché de prompts.

##### Transportes

Los servidores MCP pueden usar el transporte stdio o HTTP.

**Stdio** inicia un proceso secundario:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** se conecta a un servidor MCP en ejecución y usa `sse` de forma predeterminada, salvo que
se solicite `streamable-http`:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` acepta `"streamable-http"` o `"sse"`; si se omite, el valor predeterminado es `sse`.
- `type: "http"` es una estructura descendente nativa de la CLI; use `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias habitual.
- Solo se permiten los esquemas de URL `http:` y `https:`.
- Los valores de `headers` admiten la interpolación `${ENV_VAR}`.
- Se rechazan las entradas de servidor que incluyan tanto `command` como `url`.
- Las credenciales de la URL (información de usuario y parámetros de consulta) se ocultan en las descripciones
  de las herramientas y en los registros.
- `connectionTimeoutMs` sobrescribe el tiempo de espera de conexión predeterminado de 30 segundos para
  los transportes stdio y HTTP. El tiempo de espera predeterminado de las solicitudes es de 60 segundos y
  se puede sobrescribir con `requestTimeoutMs`.

##### Nombres de herramientas

OpenClaw registra las herramientas MCP de los paquetes con nombres compatibles con los proveedores en el formato
`serverName__toolName`. Por ejemplo, un servidor con la clave `"vigil-harbor"` que exponga una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- Los caracteres que no pertenezcan a `A-Za-z0-9_-` se sustituyen por `-`.
- Los fragmentos que comenzarían con un carácter que no sea una letra reciben un prefijo alfabético, por lo que las claves
  numéricas de servidor como `12306` se convierten en prefijos de herramientas compatibles con los proveedores.
- Los prefijos de servidor tienen un límite de 30 caracteres.
- Los nombres completos de las herramientas tienen un límite de 64 caracteres.
- Los nombres de servidor vacíos usan `mcp` como alternativa.
- Los nombres normalizados que colisionen se diferencian mediante sufijos numéricos.
- El orden final de las herramientas expuestas es determinista según el nombre seguro, lo que mantiene estables en caché
  los turnos repetidos del agente integrado.
- El filtrado por perfiles trata todas las herramientas de un servidor MCP de paquete como
  pertenecientes al plugin `bundle-mcp`, de modo que las listas de elementos permitidos o denegados del perfil pueden hacer referencia
  a nombres individuales de herramientas expuestas o a la clave del plugin `bundle-mcp`.

#### Configuración de OpenClaw integrado

El archivo `settings.json` de Claude se importa como configuración predeterminada de OpenClaw integrado cuando
el paquete está habilitado. OpenClaw depura las claves de sobrescritura del shell antes de aplicarlas:

- `shellPath`
- `shellCommandPrefix`

#### LSP de OpenClaw integrado

- Los paquetes de Claude habilitados pueden aportar configuración de servidores LSP.
- OpenClaw carga `.lsp.json` junto con cualquier ruta `lspServers` declarada en el manifiesto.
- La configuración LSP del paquete se combina con los valores predeterminados efectivos de LSP
  de OpenClaw integrado.
- Actualmente solo se pueden ejecutar servidores LSP compatibles basados en stdio; los transportes
  no compatibles siguen apareciendo en `openclaw plugins inspect <id>`.

### Detectado, pero no ejecutado

Los siguientes elementos se reconocen y aparecen en los diagnósticos, pero OpenClaw no los ejecuta:

- Automatización de `agents`, `hooks/hooks.json` y `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json` y `.cursor/rules` de Cursor
- Metadatos `.app.json` de Codex más allá de los informes de capacidades

## Formatos de paquetes

<AccordionGroup>
  <Accordion title="Paquetes de Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes de Codex se adaptan mejor a OpenClaw cuando usan raíces de Skills y directorios de paquetes
    de hooks con el estilo de OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes de Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** estructura predeterminada de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en la configuración de OpenClaw integrado (se depuran las claves de sobrescritura del shell)
    - `.mcp.json` expone herramientas stdio compatibles a OpenClaw integrado
    - `.lsp.json` junto con las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP de OpenClaw integrado
    - `hooks/hooks.json` se detecta, pero no se ejecuta
    - Las rutas de componentes personalizadas del manifiesto son aditivas; amplían los valores predeterminados, no los sustituyen

  </Accordion>

  <Accordion title="Paquetes de Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skills
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` solo se detectan

  </Accordion>
</AccordionGroup>

## Precedencia de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o un `package.json` válido con `openclaw.extensions`: se trata como un **plugin nativo**
2. Marcadores de paquetes (`.codex-plugin/`, `.claude-plugin/` o la estructura predeterminada de Claude/Cursor): se trata como un **paquete**

Si un directorio contiene ambos formatos, OpenClaw usa la ruta nativa. Esto evita
que los paquetes con formato dual se instalen parcialmente como paquetes.

## Dependencias de ejecución y limpieza

- Los paquetes compatibles de terceros no reciben una reparación mediante `npm install` durante el inicio. Deben
  instalarse mediante `openclaw plugins install` e incluir todo lo
  necesario en el directorio del plugin instalado.
- Los plugins incluidos propiedad de OpenClaw se distribuyen como elementos ligeros dentro del núcleo o
  se pueden descargar mediante el instalador de plugins. El inicio del Gateway nunca ejecuta un
  gestor de paquetes para ellos.
- `openclaw doctor --fix` elimina los registros obsoletos de instalación local de plugins incluidos
  y puede recuperar plugins descargables que falten en el índice local de plugins
  cuando la configuración todavía haga referencia a ellos.

## Seguridad

Los paquetes tienen un límite de confianza más restringido que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios de ejecución de los paquetes dentro del proceso.
- Las rutas de Skills y de paquetes de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límites).
- Los archivos de configuración se leen con las mismas comprobaciones de límites.
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos.

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debe tratar los paquetes
de terceros como contenido de confianza para las funciones que exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta, pero las capacidades no se ejecutan">
    Ejecute `openclaw plugins inspect <id>`. Si aparece una capacidad, pero está marcada como
    no conectada, se trata de una limitación del producto, no de una instalación defectuosa.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrese de que el paquete esté habilitado y de que los archivos Markdown se encuentren dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="La configuración de Claude no se aplica">
    Solo se admite la configuración de OpenClaw integrado procedente de `settings.json`. OpenClaw
    no trata la configuración de los paquetes como parches directos de configuración.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` solo se detecta. Si necesita hooks ejecutables, use la
    estructura de paquetes de hooks de OpenClaw o distribuya un plugin nativo.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins): cree un plugin nativo
- [Manifiesto de plugins](/es/plugins/manifest): esquema del manifiesto nativo
