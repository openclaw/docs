---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Necesitas entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instalar y usar los paquetes de Codex, Claude y Cursor como Plugins de OpenClaw
title: Paquetes de Plugin
x-i18n:
    generated_at: "2026-05-05T01:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar plugins de tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Estos se llaman **paquetes**: conjuntos de contenido y metadatos que
OpenClaw asigna a funcionalidades nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  en el proceso y pueden registrar cualquier capacidad. Los paquetes son conjuntos de contenido con
  asignación selectiva de funcionalidades y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir a los autores que los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de funcionalidades
nativas. Esto significa que puedes instalar un paquete de comandos de Claude o un paquete
de Skills de Codex y usarlo inmediatamente.

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

    Las funcionalidades asignadas (Skills, hooks, herramientas MCP, valores predeterminados de LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las funcionalidades de los paquetes se ejecutan hoy en OpenClaw. Esto es lo que funciona y lo que
se detecta, pero aún no está conectado.

### Compatible ahora

| Funcionalidad       | Cómo se asigna                                                                                 | Se aplica a     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                                           | Todos los formatos    |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                                  | Claude, Cursor |
| Paquetes de hooks    | Diseños de estilo OpenClaw con `HOOK.md` + `handler.ts`                                             | Codex          |
| Herramientas MCP     | La configuración MCP del paquete se fusiona en la configuración integrada de Pi; se cargan servidores stdio y HTTP compatibles | Todos los formatos    |
| Servidores LSP   | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados de LSP integrado de Pi  | Claude         |
| Configuración      | `settings.json` de Claude se importa como valores predeterminados integrados de Pi                                     | Claude         |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces normales de Skills de OpenClaw
- las raíces `commands` de Claude se tratan como raíces adicionales de Skills
- las raíces `.cursor/commands` de Cursor se tratan como raíces adicionales de Skills

Esto significa que los archivos de comandos Markdown de Claude funcionan mediante el cargador normal
de Skills de OpenClaw. Los comandos Markdown de Cursor funcionan mediante la misma ruta.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de paquete de hooks
  de OpenClaw. Hoy, este es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete en la configuración efectiva integrada de Pi como
  `mcpServers`
- OpenClaw expone herramientas MCP de paquetes compatibles durante los turnos de agente integrado de Pi al
  iniciar servidores stdio o conectarse a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP de paquetes de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas de un agente o Gateway
- la configuración de Pi local del proyecto aún se aplica después de los valores predeterminados del paquete, por lo que la configuración
  del espacio de trabajo puede anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP de paquetes se ordenan de forma determinista antes del registro, por lo que
  los cambios de orden de `listTools()` aguas arriba no alteran los bloques de herramientas de la caché de prompts

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

- `transport` puede definirse como `"streamable-http"` o `"sse"`; si se omite, OpenClaw usa `sse`
- `type: "http"` es una forma descendente nativa de CLI; usa `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias común.
- solo se permiten esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor que tenga tanto `command` como `url`
- las credenciales de URL (userinfo y parámetros de consulta) se redactan de las
  descripciones de herramientas y los registros
- `connectionTimeoutMs` anula el tiempo de espera de conexión predeterminado de 30 segundos para
  los transportes stdio y HTTP

##### Nombres de herramientas

OpenClaw registra las herramientas MCP de paquetes con nombres seguros para proveedores en el formato
`serverName__toolName`. Por ejemplo, un servidor con clave `"vigil-harbor"` que expone una herramienta
`memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`
- los prefijos de servidor se limitan a 30 caracteres
- los nombres completos de herramientas se limitan a 64 caracteres
- los nombres de servidor vacíos usan `mcp` como alternativa
- los nombres saneados en conflicto se desambiguan con sufijos numéricos
- el orden final de herramientas expuestas es determinista por nombre seguro para mantener los turnos
  repetidos de Pi estables en caché
- el filtrado de perfiles trata todas las herramientas de un servidor MCP de paquete como propiedad del plugin
  `bundle-mcp`, por lo que las listas de permitidos y denegados de perfiles pueden incluir nombres de herramientas
  expuestas individuales o la clave de plugin `bundle-mcp`

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
  no compatibles siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos elementos se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/de aplicación de Codex más allá del informe de capacidades

## Formatos de paquetes

<AccordionGroup>
  <Accordion title="Codex bundles">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes de Codex encajan mejor con OpenClaw cuando usan raíces de Skills y directorios
    de paquetes de hooks de estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en la configuración integrada de Pi (las claves de anulación de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP integrado de Pi
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - Las rutas de componentes personalizados en el manifiesto son aditivas (extienden los valores predeterminados, no los reemplazan)

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
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor): se tratan como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita que
los paquetes de doble formato se instalen parcialmente como paquetes.

## Dependencias de runtime y limpieza

- Los paquetes compatibles de terceros no reciben reparación `npm install` al inicio. Deben
  instalarse mediante `openclaw plugins install` e incluir todo lo que
  necesitan en el directorio del plugin instalado.
- Los plugins empaquetados propiedad de OpenClaw se entregan ligeros en el núcleo o
  descargables mediante el instalador de plugins. El inicio de Gateway nunca ejecuta un
  gestor de paquetes para ellos.
- `openclaw doctor --fix` elimina directorios de dependencias preparados heredados y puede
  recuperar plugins descargables que faltan en el índice local de plugins cuando
  la configuración los referencia.

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos de runtime arbitrarios de paquetes en el proceso
- Las rutas de Skills y paquetes de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límites)
- Los archivos de configuración se leen con las mismas comprobaciones de límites
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debes tratar los paquetes
de terceros como contenido de confianza para las funcionalidades que exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece pero está marcada como
    no conectada, es una limitación del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Asegúrate de que el paquete esté habilitado y de que los archivos Markdown estén dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Solo se admite la configuración integrada de Pi de `settings.json`. OpenClaw no
    trata la configuración del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o entrega un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins) — crear un plugin nativo
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto nativo
