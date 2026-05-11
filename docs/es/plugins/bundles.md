---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Debe entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instalar y usar los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de Plugin
x-i18n:
    generated_at: "2026-05-11T20:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar paquetes desde tres ecosistemas externos: **Codex**, **Claude**,
y **Cursor**. Estos se llaman **paquetes**: paquetes de contenido y metadatos que
OpenClaw asigna a funciones nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  en proceso y pueden registrar cualquier capacidad. Los paquetes son paquetes de contenido con
  asignación selectiva de funciones y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir que los autores los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de funciones
nativas. Esto significa que puedes instalar un paquete de comandos de Claude o un paquete de Skills de Codex
y usarlo de inmediato.

## Instalar un paquete

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Los paquetes se muestran como `Format: bundle` con un subtipo de `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Las funciones asignadas (Skills, hooks, herramientas MCP, valores predeterminados de LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las funciones de los paquetes se ejecutan en OpenClaw hoy. Esto es lo que funciona y lo que
se detecta, pero aún no está conectado.

### Compatible ahora

| Función       | Cómo se asigna                                                                                 | Se aplica a     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                                           | Todos los formatos    |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                                  | Claude, Cursor |
| Paquetes de hooks    | Diseños estilo OpenClaw de `HOOK.md` + `handler.ts`                                             | Codex          |
| Herramientas MCP     | La configuración MCP del paquete se fusiona en los ajustes integrados de Pi; se cargan servidores stdio y HTTP compatibles | Todos los formatos    |
| Servidores LSP   | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados de LSP de Pi integrado  | Claude         |
| Ajustes      | `settings.json` de Claude se importa como valores predeterminados de Pi integrado                                     | Claude         |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces normales de Skills de OpenClaw
- las raíces `commands` de Claude se tratan como raíces adicionales de Skills
- las raíces `.cursor/commands` de Cursor se tratan como raíces adicionales de Skills

Esto significa que los archivos de comandos markdown de Claude funcionan a través del cargador normal de Skills de OpenClaw.
El markdown de comandos de Cursor funciona por la misma ruta.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de paquete de hooks
  de OpenClaw. Hoy, esto es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete en los ajustes efectivos de Pi integrado como
  `mcpServers`
- OpenClaw expone herramientas MCP de paquetes compatibles durante los turnos del agente Pi integrado al
  iniciar servidores stdio o conectarse a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP de paquetes de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas en un agente o gateway
- los ajustes de Pi locales del proyecto siguen aplicándose después de los valores predeterminados del paquete, por lo que los ajustes
  del espacio de trabajo pueden anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro, por lo que
  los cambios en el orden de `listTools()` del origen no invalidan repetidamente los bloques de herramientas de la caché de prompts

##### Transportes

Los servidores MCP pueden usar transporte stdio o HTTP:

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

**HTTP** se conecta a un servidor MCP en ejecución mediante `sse` de forma predeterminada, o `streamable-http` cuando se solicita:

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

- `transport` puede establecerse en `"streamable-http"` o `"sse"`; cuando se omite, OpenClaw usa `sse`
- `type: "http"` es una forma descendente nativa de la CLI; usa `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias común.
- solo se permiten los esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor que tenga tanto `command` como `url`
- las credenciales de URL (userinfo y parámetros de consulta) se redactan de las
  descripciones de herramientas y los registros
- `connectionTimeoutMs` anula el tiempo de espera de conexión predeterminado de 30 segundos para
  los transportes stdio y HTTP

##### Nombres de herramientas

OpenClaw registra herramientas MCP de paquetes con nombres seguros para el proveedor en la forma
`serverName__toolName`. Por ejemplo, un servidor con clave `"vigil-harbor"` que expone una herramienta
`memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se sustituyen por `-`
- los fragmentos que empezarían con una letra no alfabética reciben un prefijo de letra, por lo que claves
  de servidor numéricas como `12306` se convierten en prefijos de herramienta seguros para el proveedor
- los prefijos de servidor tienen un límite de 30 caracteres
- los nombres completos de herramientas tienen un límite de 64 caracteres
- los nombres de servidor vacíos recurren a `mcp`
- los nombres saneados que colisionan se desambiguan con sufijos numéricos
- el orden final de herramientas expuestas es determinista por nombre seguro para mantener estables en caché
  los turnos repetidos de Pi
- el filtrado de perfiles trata todas las herramientas de un servidor MCP de paquete como propiedad del plugin
  `bundle-mcp`, por lo que las listas de permitidos y denegados del perfil pueden incluir nombres individuales
  de herramientas expuestas o la clave de plugin `bundle-mcp`

#### Ajustes de Pi integrado

- `settings.json` de Claude se importa como ajustes predeterminados de Pi integrado cuando el
  paquete está habilitado
- OpenClaw sanea las claves de anulación de shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP de Pi integrado

- los paquetes Claude habilitados pueden aportar configuración de servidor LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se fusiona en los valores predeterminados efectivos de LSP de Pi integrado
- solo los servidores LSP respaldados por stdio compatibles pueden ejecutarse hoy; los transportes
  no compatibles siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/de app de Codex más allá del informe de capacidades

## Formatos de paquete

<AccordionGroup>
  <Accordion title="Codex bundles">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes Codex encajan mejor con OpenClaw cuando usan raíces de Skills y directorios
    de paquetes de hooks estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en los ajustes de Pi integrado (las claves de anulación de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP de Pi integrado
    - `hooks/hooks.json` se detecta, pero no se ejecuta
    - las rutas de componentes personalizados del manifiesto son aditivas (amplían los valores predeterminados, no los sustituyen)

  </Accordion>

  <Accordion title="Cursor bundles">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skills
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Precedencia de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o un `package.json` válido con `openclaw.extensions`: se trata como **plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor): se trata como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita que
los paquetes de formato dual se instalen parcialmente como paquetes.

## Dependencias de runtime y limpieza

- Los paquetes compatibles de terceros no reciben reparación de `npm install` al iniciar. Deben
  instalarse mediante `openclaw plugins install` e incluir todo lo que
  necesitan en el directorio de plugin instalado.
- Los plugins empaquetados propiedad de OpenClaw se envían ligeros en el núcleo o
  se pueden descargar mediante el instalador de plugins. El inicio del Gateway nunca ejecuta un
  gestor de paquetes para ellos.
- `openclaw doctor --fix` elimina directorios de dependencias preparados heredados y puede
  recuperar plugins descargables que faltan en el índice local de plugins cuando
  la configuración los referencia.

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos de runtime arbitrarios del paquete en proceso
- Las rutas de Skills y paquetes de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límite)
- Los archivos de ajustes se leen con las mismas comprobaciones de límite
- Los servidores stdio MCP compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debes tratar los paquetes
de terceros como contenido de confianza para las funciones que sí exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece listada pero marcada como
    no conectada, eso es una limitación del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Asegúrate de que el paquete esté habilitado y de que los archivos markdown estén dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Solo se admiten los ajustes de Pi integrado desde `settings.json`. OpenClaw no
    trata los ajustes del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o envía un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins) — crea un plugin nativo
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto nativo
