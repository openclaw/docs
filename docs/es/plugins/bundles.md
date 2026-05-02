---
read_when:
    - Desea instalar un paquete compatible con Codex, Claude o Cursor
    - Debe comprender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instala y usa los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de Plugin
x-i18n:
    generated_at: "2026-05-02T05:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar plugins de tres ecosistemas externos: **Codex**, **Claude**,
y **Cursor**. Se denominan **paquetes**: packs de contenido y metadatos que
OpenClaw asigna a características nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  en proceso y pueden registrar cualquier capacidad. Los paquetes son packs de contenido con
  mapeo selectivo de características y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir a los autores que los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de características
nativas. Esto significa que puedes instalar un pack de comandos de Claude o un paquete
de Skills de Codex y usarlo de inmediato.

## Instalar un paquete

<Steps>
  <Step title="Instalar desde un directorio, archivo o marketplace">
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

  <Step title="Verificar la detección">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Los paquetes se muestran como `Format: bundle` con un subtipo de `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Reiniciar y usar">
    ```bash
    openclaw gateway restart
    ```

    Las características mapeadas (Skills, hooks, herramientas MCP, valores predeterminados de LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las características de paquete se ejecutan hoy en OpenClaw. Esto es lo que funciona y lo que
se detecta pero aún no está conectado.

### Compatible ahora

| Característica | Cómo se asigna                                                                             | Se aplica a    |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                 | Todos los formatos |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                           | Claude, Cursor |
| Packs de hooks | Diseños de estilo OpenClaw con `HOOK.md` + `handler.ts`                                    | Codex          |
| Herramientas MCP | La configuración MCP del paquete se fusiona en la configuración integrada de Pi; se cargan servidores stdio y HTTP compatibles | Todos los formatos |
| Servidores LSP | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados de LSP integrado de Pi | Claude         |
| Configuración | `settings.json` de Claude se importa como valores predeterminados integrados de Pi          | Claude         |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces de Skills normales de OpenClaw
- las raíces `commands` de Claude se tratan como raíces adicionales de Skills
- las raíces `.cursor/commands` de Cursor se tratan como raíces adicionales de Skills

Esto significa que los archivos de comandos Markdown de Claude funcionan mediante el cargador
normal de Skills de OpenClaw. Los comandos Markdown de Cursor funcionan por la misma vía.

#### Packs de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de pack de hooks
  de OpenClaw. Hoy esto es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete en la configuración efectiva integrada de Pi como
  `mcpServers`
- OpenClaw expone las herramientas MCP compatibles del paquete durante los turnos del agente Pi integrado mediante
  el inicio de servidores stdio o la conexión a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP de paquetes de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas para un agente o Gateway
- la configuración local del proyecto para Pi sigue aplicándose después de los valores predeterminados del paquete, por lo que la
  configuración del workspace puede anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro, por lo que
  los cambios de orden de `listTools()` de upstream no alteran los bloques de herramientas de la caché de prompts

##### Transportes

Los servidores MCP pueden usar transporte stdio o HTTP:

**Stdio** inicia un proceso hijo:

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
- `type: "http"` es una forma descendente nativa de CLI; usa `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias común.
- solo se permiten los esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor con `command` y `url`
- las credenciales de URL (userinfo y parámetros de consulta) se censuran en las
  descripciones de herramientas y los registros
- `connectionTimeoutMs` anula el tiempo de espera de conexión predeterminado de 30 segundos para
  los transportes stdio y HTTP

##### Nombres de herramientas

OpenClaw registra las herramientas MCP del paquete con nombres seguros para proveedores con la forma
`serverName__toolName`. Por ejemplo, un servidor con la clave `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`
- los prefijos de servidor tienen un límite de 30 caracteres
- los nombres completos de herramientas tienen un límite de 64 caracteres
- los nombres de servidor vacíos recurren a `mcp`
- los nombres saneados en conflicto se desambiguan con sufijos numéricos
- el orden final de herramientas expuestas es determinista por nombre seguro para mantener los turnos
  repetidos de Pi estables en caché
- el filtrado de perfiles trata todas las herramientas de un servidor MCP de paquete como pertenecientes al plugin
  `bundle-mcp`, por lo que las listas de permitidos y denegados del perfil pueden incluir nombres
  individuales de herramientas expuestas o la clave de plugin `bundle-mcp`

#### Configuración integrada de Pi

- `settings.json` de Claude se importa como configuración integrada predeterminada de Pi cuando el
  paquete está habilitado
- OpenClaw sanea las claves de anulación de shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP integrado de Pi

- los paquetes Claude habilitados pueden aportar configuración de servidor LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se fusiona en los valores predeterminados efectivos de LSP integrado de Pi
- hoy solo se pueden ejecutar servidores LSP compatibles respaldados por stdio; los transportes
  no compatibles aún aparecen en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/app de Codex más allá del informe de capacidades

## Formatos de paquete

<AccordionGroup>
  <Accordion title="Paquetes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes Codex se ajustan mejor a OpenClaw cuando usan raíces de Skills y directorios de packs de hooks
    de estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño Claude predeterminado (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en la configuración integrada de Pi (las claves de anulación de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP integrado de Pi
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - Las rutas de componentes personalizados en el manifiesto son aditivas (extienden los valores predeterminados, no los reemplazan)

  </Accordion>

  <Accordion title="Paquetes Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skills
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Precedencia de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o `package.json` válido con `openclaw.extensions`: se trata como **plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor): se trata como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita que
los paquetes de doble formato se instalen parcialmente como paquetes.

## Dependencias en tiempo de ejecución y limpieza

- Los paquetes compatibles de terceros no reciben reparación `npm install` al inicio. Deben
  instalarse mediante `openclaw plugins install` e incluir todo lo que
  necesitan en el directorio del plugin instalado.
- Los plugins empaquetados propiedad de OpenClaw se envían ligeros en core o son
  descargables mediante el instalador de plugins. El inicio de Gateway nunca ejecuta un
  gestor de paquetes para ellos.
- `openclaw doctor --fix` elimina directorios heredados de dependencias preparadas y puede
  instalar plugins descargables configurados que faltan en el índice local
  de plugins.

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios de runtime de paquetes en proceso
- Las rutas de Skills y packs de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límites)
- Los archivos de configuración se leen con las mismas comprobaciones de límites
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debes tratar los paquetes
de terceros como contenido de confianza para las características que exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta pero las capacidades no se ejecutan">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece pero está marcada como
    no conectada, es un límite del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrate de que el paquete esté habilitado y de que los archivos Markdown estén dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="La configuración de Claude no se aplica">
    Solo se admite la configuración integrada de Pi desde `settings.json`. OpenClaw no
    trata la configuración del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de pack de hooks de OpenClaw o envía un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins): crear un plugin nativo
- [Manifiesto de Plugin](/es/plugins/manifest): esquema de manifiesto nativo
