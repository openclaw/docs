---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Debes entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instala y usa los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de Plugin
x-i18n:
    generated_at: "2026-04-30T05:51:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar plugins desde tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Estos se llaman **paquetes**: paquetes de contenido y metadatos que
OpenClaw asigna a funciones nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  dentro del proceso y pueden registrar cualquier capacidad. Los paquetes son paquetes de contenido con
  asignación selectiva de funciones y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir a los autores que los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de funciones
nativas. Esto significa que puedes instalar un paquete de comandos de Claude o un paquete de Skills de Codex
y usarlo de inmediato.

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

    Las funciones asignadas (Skills, hooks, herramientas MCP, valores predeterminados de LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las funciones de los paquetes se ejecutan hoy en OpenClaw. Esto es lo que funciona y lo que
se detecta pero aún no está conectado.

### Compatible ahora

| Función       | Cómo se asigna                                                                              | Se aplica a    |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                 | Todos los formatos |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                           | Claude, Cursor |
| Paquetes de hooks | Diseños de estilo OpenClaw con `HOOK.md` + `handler.ts`                                  | Codex          |
| Herramientas MCP | La configuración MCP del paquete se combina con los ajustes de Pi integrado; se cargan servidores stdio y HTTP compatibles | Todos los formatos |
| Servidores LSP | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se combinan con los valores predeterminados de LSP de Pi integrado | Claude         |
| Ajustes      | `settings.json` de Claude se importa como valores predeterminados de Pi integrado            | Claude         |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces de Skills normales de OpenClaw
- las raíces `commands` de Claude se tratan como raíces de Skills adicionales
- las raíces `.cursor/commands` de Cursor se tratan como raíces de Skills adicionales

Esto significa que los archivos de comandos markdown de Claude funcionan mediante el cargador normal de Skills
de OpenClaw. El markdown de comandos de Cursor funciona por la misma ruta.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de paquete de hooks
  de OpenClaw. Hoy esto es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidores MCP
- OpenClaw combina la configuración MCP del paquete con los ajustes efectivos de Pi integrado como
  `mcpServers`
- OpenClaw expone herramientas MCP compatibles del paquete durante los turnos del agente de Pi integrado
  iniciando servidores stdio o conectándose a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP del paquete de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas para un agente o gateway
- los ajustes de Pi locales del proyecto siguen aplicándose después de los valores predeterminados del paquete, por lo que los ajustes
  del espacio de trabajo pueden anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro, por lo que
  los cambios de orden de `listTools()` del proveedor no alteran los bloques de herramientas de la caché de prompts

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

- `transport` puede establecerse en `"streamable-http"` o `"sse"`; si se omite, OpenClaw usa `sse`
- `type: "http"` es una forma descendente nativa de CLI; usa `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias común.
- solo se permiten esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor con `command` y `url`
- las credenciales de URL (userinfo y parámetros de consulta) se redactan de las descripciones
  de herramientas y de los registros
- `connectionTimeoutMs` anula el tiempo de espera de conexión predeterminado de 30 segundos para
  los transportes stdio y HTTP

##### Nomenclatura de herramientas

OpenClaw registra las herramientas MCP de paquetes con nombres seguros para proveedores con la forma
`serverName__toolName`. Por ejemplo, un servidor con la clave `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`
- los prefijos de servidor están limitados a 30 caracteres
- los nombres completos de herramientas están limitados a 64 caracteres
- los nombres de servidor vacíos usan `mcp` como alternativa
- los nombres saneados que colisionan se desambiguan con sufijos numéricos
- el orden final de herramientas expuestas es determinista por nombre seguro para mantener los turnos repetidos de Pi
  estables para la caché
- el filtrado de perfiles trata todas las herramientas de un servidor MCP de paquete como propiedad del plugin
  `bundle-mcp`, por lo que las listas de permitidos y denegados de perfiles pueden incluir nombres de herramientas expuestas
  individuales o la clave de plugin `bundle-mcp`

#### Ajustes de Pi integrado

- `settings.json` de Claude se importa como ajustes predeterminados de Pi integrado cuando el
  paquete está habilitado
- OpenClaw sanea las claves de anulación de shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP de Pi integrado

- los paquetes de Claude habilitados pueden aportar configuración de servidores LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se combina con los valores predeterminados efectivos de LSP de Pi integrado
- hoy solo se pueden ejecutar servidores LSP compatibles respaldados por stdio; los transportes
  no compatibles siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos se reconocen y se muestran en los diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/app de Codex más allá del reporte de capacidades

## Formatos de paquete

<AccordionGroup>
  <Accordion title="Paquetes de Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes de Codex encajan mejor con OpenClaw cuando usan raíces de Skills y directorios de
    paquetes de hooks de estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes de Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en los ajustes de Pi integrado (las claves de anulación de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP de Pi integrado
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - las rutas de componentes personalizados en el manifiesto son aditivas (amplían los valores predeterminados, no los reemplazan)

  </Accordion>

  <Accordion title="Paquetes de Cursor">
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
los paquetes de formato dual se instalen parcialmente como paquetes.

## Dependencias de ejecución y limpieza

- Los paquetes compatibles de terceros no reciben reparación `npm install` al inicio. Deben
  instalarse mediante `openclaw plugins install` e incluir todo lo que
  necesitan en el directorio de plugin instalado.
- Los plugins empaquetados incluidos que son propiedad de OpenClaw tienen una excepción estrecha: cuando uno está
  habilitado, el inicio del Gateway puede reparar dependencias de ejecución declaradas que falten
  antes de la importación. Los operadores pueden inspeccionar o reparar esa etapa con
  `openclaw plugins deps`.
- La canalización de publicación sigue siendo responsable de enviar una carga completa de dependencias
  incluidas cuando sea posible (consulta la regla de verificación posterior a la publicación en
  [Publicación](/es/reference/RELEASING)).

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos de ejecución arbitrarios del paquete dentro del proceso
- Las rutas de Skills y de paquetes de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límites)
- Los archivos de ajustes se leen con las mismas comprobaciones de límites
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debes tratar los paquetes
de terceros como contenido de confianza para las funciones que exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta pero las capacidades no se ejecutan">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece en la lista pero está marcada como
    no conectada, eso es una limitación del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrate de que el paquete esté habilitado y de que los archivos markdown estén dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="Los ajustes de Claude no se aplican">
    Solo se admiten los ajustes de Pi integrado de `settings.json`. OpenClaw no
    trata los ajustes del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o distribuye un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins) — crear un plugin nativo
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto nativo
