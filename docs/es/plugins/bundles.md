---
read_when:
    - Quiere instalar un paquete compatible con Codex, Claude o Cursor
    - Necesita comprender cómo OpenClaw asigna el contenido del paquete a funciones nativas de OpenClaw
    - Está depurando la detección de paquetes o capacidades ausentes
summary: Instalar y usar los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de plugins
x-i18n:
    generated_at: "2026-04-23T05:16:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# Paquetes de plugins

OpenClaw puede instalar plugins de tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Estos se llaman **paquetes**: paquetes de contenido y metadatos que
OpenClaw asigna a funciones nativas como Skills, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  en proceso y pueden registrar cualquier capacidad. Los paquetes son paquetes de contenido con
  asignación selectiva de funciones y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir a los autores que los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de funciones nativas. Esto significa que puede instalar un paquete de comandos de Claude o un paquete de Skills de Codex
y usarlo de inmediato.

## Instalar un paquete

<Steps>
  <Step title="Instalar desde un directorio, archivo o marketplace">
    ```bash
    # Directorio local
    openclaw plugins install ./my-bundle

    # Archivo
    openclaw plugins install ./my-bundle.tgz

    # Marketplace de Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verificar la detección">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Los paquetes aparecen como `Format: bundle` con un subtipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Reiniciar y usar">
    ```bash
    openclaw gateway restart
    ```

    Las funciones asignadas (Skills, hooks, herramientas MCP, valores predeterminados de LSP) estarán disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las funciones del paquete se ejecutan en OpenClaw hoy. Esto es lo que funciona y lo que
se detecta pero aún no está conectado.

### Compatible actualmente

| Feature       | How it maps                                                                                 | Applies to     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como Skills normales de OpenClaw                                           | Todos los formatos    |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                                  | Claude, Cursor |
| Paquetes de hooks    | Diseños de estilo OpenClaw con `HOOK.md` + `handler.ts`                                             | Codex          |
| Herramientas MCP     | La configuración MCP del paquete se fusiona en la configuración integrada de Pi; se cargan servidores stdio y HTTP compatibles | Todos los formatos    |
| Servidores LSP   | El `.lsp.json` de Claude y los `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados integrados de LSP de Pi  | Claude         |
| Configuración      | El `settings.json` de Claude se importa como valores predeterminados integrados de Pi                                     | Claude         |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces normales de Skills de OpenClaw
- las raíces `commands` de Claude se tratan como raíces de Skills adicionales
- las raíces `.cursor/commands` de Cursor se tratan como raíces de Skills adicionales

Esto significa que los archivos markdown de comandos de Claude funcionan a través del cargador normal de Skills de OpenClaw. Los comandos markdown de Cursor funcionan por la misma vía.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal
  de paquete de hooks de OpenClaw. Hoy esto corresponde principalmente al caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete en la configuración efectiva integrada de Pi como
  `mcpServers`
- OpenClaw expone las herramientas MCP compatibles del paquete durante los turnos del agente integrado de Pi mediante
  el inicio de servidores stdio o la conexión a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP del paquete de forma predeterminada; use `tools.deny: ["bundle-mcp"]` para excluirlas en un agente o Gateway
- la configuración local del proyecto de Pi sigue aplicándose después de los valores predeterminados del paquete, por lo que la configuración del espacio de trabajo puede anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro, para que
  los cambios ascendentes en el orden de `listTools()` no alteren en exceso los bloques de herramientas de caché de prompts

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
- solo se permiten esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor que tenga tanto `command` como `url`
- las credenciales de URL (userinfo y parámetros de consulta) se redactan en las descripciones de herramientas y los registros
- `connectionTimeoutMs` anula el tiempo de espera predeterminado de 30 segundos para la conexión tanto en transportes stdio como HTTP

##### Nombres de herramientas

OpenClaw registra las herramientas MCP del paquete con nombres seguros para el proveedor con el formato
`serverName__toolName`. Por ejemplo, un servidor con clave `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se sustituyen por `-`
- los prefijos de servidor tienen un límite de 30 caracteres
- los nombres completos de herramientas tienen un límite de 64 caracteres
- los nombres de servidor vacíos recurren a `mcp`
- los nombres saneados que colisionan se desambiguarán con sufijos numéricos
- el orden final de herramientas expuestas es determinista por nombre seguro para mantener estables en caché los turnos repetidos de Pi
- el filtrado por perfil trata todas las herramientas de un servidor MCP del paquete como propiedad del plugin
  `bundle-mcp`, por lo que las listas de permitidos y denegados del perfil pueden incluir
  nombres individuales de herramientas expuestas o la clave del plugin `bundle-mcp`

#### Configuración integrada de Pi

- el `settings.json` de Claude se importa como configuración predeterminada integrada de Pi cuando el
  paquete está habilitado
- OpenClaw sanea las claves de anulación del shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP integrado de Pi

- los paquetes de Claude habilitados pueden aportar configuración de servidor LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se fusiona en los valores predeterminados efectivos del LSP integrado de Pi
- hoy solo se pueden ejecutar servidores LSP compatibles basados en stdio; los transportes no compatibles siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos elementos se reconocen y se muestran en el diagnóstico, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos en línea/de aplicación de Codex más allá del informe de capacidades

## Formatos de paquetes

<AccordionGroup>
  <Accordion title="Paquetes de Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes de Codex encajan mejor con OpenClaw cuando usan raíces de Skills y
    directorios de paquetes de hooks de estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes de Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en la configuración integrada de Pi (las claves de anulación del shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados del LSP integrado de Pi
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - las rutas de componentes personalizadas del manifiesto son aditivas (amplían los valores predeterminados, no los reemplazan)

  </Accordion>

  <Accordion title="Paquetes de Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skills
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Prioridad de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o un `package.json` válido con `openclaw.extensions` — se trata como **plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o el diseño predeterminado de Claude/Cursor) — se trata como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita
que los paquetes de doble formato se instalen parcialmente como paquetes.

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios del tiempo de ejecución del paquete en proceso
- las rutas de Skills y paquetes de hooks deben permanecer dentro de la raíz del plugin (comprobación de límites)
- los archivos de configuración se leen con las mismas comprobaciones de límites
- los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debe tratar los
paquetes de terceros como contenido de confianza para las funciones que sí exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta pero las capacidades no se ejecutan">
    Ejecute `openclaw plugins inspect <id>`. Si una capacidad aparece en la lista pero está marcada como
    no conectada, se trata de una limitación del producto, no de una instalación defectuosa.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrese de que el paquete esté habilitado y que los archivos markdown estén dentro de una raíz detectada
    `commands/` o `skills/`.
  </Accordion>

  <Accordion title="La configuración de Claude no se aplica">
    Solo se admiten las configuraciones integradas de Pi desde `settings.json`. OpenClaw no
    trata la configuración del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesita hooks ejecutables, use el
    diseño de paquete de hooks de OpenClaw o distribuya un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Creación de plugins](/es/plugins/building-plugins) — cree un plugin nativo
- [Manifiesto de plugin](/es/plugins/manifest) — esquema de manifiesto nativo
