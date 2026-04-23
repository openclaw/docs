---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Necesitas entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instalar y usar paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de plugins
x-i18n:
    generated_at: "2026-04-23T14:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
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
detecta estos formatos y asigna su contenido compatible al conjunto de funciones nativas.
Esto significa que puedes instalar un paquete de comandos de Claude o un paquete de Skills de Codex
y usarlo inmediatamente.

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

Hoy no todas las funciones del paquete se ejecutan en OpenClaw. Aquí está lo que
funciona y lo que se detecta pero aún no está conectado.

### Compatible ahora

| Función       | Cómo se asigna                                                                              | Se aplica a     |
| ------------- | ------------------------------------------------------------------------------------------- | --------------- |
| Contenido de Skills | Las raíces de Skills del paquete se cargan como raíces normales de Skills de OpenClaw | Todos los formatos |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de Skills                           | Claude, Cursor  |
| Paquetes de hooks | Diseños de estilo OpenClaw `HOOK.md` + `handler.ts`                                     | Codex           |
| Herramientas MCP | La configuración MCP del paquete se fusiona en los ajustes integrados de Pi; se cargan servidores stdio y HTTP compatibles | Todos los formatos |
| Servidores LSP | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados integrados de Pi LSP | Claude          |
| Ajustes       | `settings.json` de Claude se importa como valores predeterminados integrados de Pi         | Claude          |

#### Contenido de Skills

- las raíces de Skills del paquete se cargan como raíces normales de Skills de OpenClaw
- las raíces `commands` de Claude se tratan como raíces adicionales de Skills
- las raíces `.cursor/commands` de Cursor se tratan como raíces adicionales de Skills

Esto significa que los archivos de comandos markdown de Claude funcionan mediante el cargador normal de Skills de OpenClaw. Los comandos markdown de Cursor funcionan a través de la misma ruta.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de paquete de hooks de OpenClaw.
  Hoy esto es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete en los ajustes efectivos integrados de Pi como
  `mcpServers`
- OpenClaw expone herramientas MCP compatibles del paquete durante turnos del agente Pi integrado al
  iniciar servidores stdio o conectarse a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP del paquete de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas para un agente o gateway
- los ajustes locales de Pi del proyecto siguen aplicándose después de los valores predeterminados del paquete, por
  lo que los ajustes del espacio de trabajo pueden anular entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro, para
  que los cambios ascendentes en el orden de `listTools()` no alteren los bloques de herramientas de caché de prompt

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
- solo se permiten esquemas URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor con `command` y `url` a la vez
- las credenciales URL (userinfo y parámetros de consulta) se redactan de las
  descripciones de herramientas y de los registros
- `connectionTimeoutMs` anula el tiempo de espera predeterminado de conexión de 30 segundos para
  transportes stdio y HTTP

##### Nombres de herramientas

OpenClaw registra herramientas MCP del paquete con nombres seguros para el proveedor en la forma
`serverName__toolName`. Por ejemplo, un servidor con clave `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`
- los prefijos de servidor se limitan a 30 caracteres
- los nombres completos de herramienta se limitan a 64 caracteres
- los nombres de servidor vacíos recurren a `mcp`
- los nombres saneados que colisionan se desambiguarán con sufijos numéricos
- el orden final expuesto de herramientas es determinista por nombre seguro para mantener estables en caché los
  turnos repetidos de Pi
- el filtrado por perfil trata todas las herramientas de un servidor MCP del paquete como propiedad del Plugin
  `bundle-mcp`, por lo que las listas de permitidos y de denegación del perfil pueden incluir tanto
  nombres individuales expuestos de herramientas como la clave del Plugin `bundle-mcp`

#### Ajustes integrados de Pi

- `settings.json` de Claude se importa como ajustes predeterminados integrados de Pi cuando el
  paquete está habilitado
- OpenClaw sanea las claves de anulación del shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### Pi LSP integrado

- los paquetes Claude habilitados pueden aportar configuración de servidor LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se fusiona en los valores predeterminados efectivos integrados de Pi LSP
- hoy solo se pueden ejecutar servidores LSP compatibles con stdio; los transportes no compatibles
  siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/de aplicación de Codex más allá de la información de capacidades

## Formatos de paquetes

<AccordionGroup>
  <Accordion title="Paquetes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes Codex encajan mejor con OpenClaw cuando usan raíces de Skills y
    directorios de paquete de hooks de estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de Skills
    - `settings.json` se importa en los ajustes integrados de Pi (las claves de anulación del shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados integrados de Pi LSP
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - Las rutas de componentes personalizadas del manifiesto son aditivas (amplían los valores predeterminados, no los reemplazan)

  </Accordion>

  <Accordion title="Paquetes Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skills
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Precedencia de detección

OpenClaw comprueba primero el formato de Plugin nativo:

1. `openclaw.plugin.json` o `package.json` válido con `openclaw.extensions`: se trata como **Plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor): se trata como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita
que los paquetes de doble formato se instalen parcialmente como paquetes.

## Dependencias de tiempo de ejecución y limpieza

- Las dependencias de tiempo de ejecución de los plugins agrupados se incluyen dentro del paquete OpenClaw en
  `dist/*`. OpenClaw **no** ejecuta `npm install` al inicio para plugins
  agrupados; la canalización de publicación es responsable de enviar una carga útil completa de dependencias
  agrupadas (consulta la regla de verificación posterior a la publicación en
  [Releasing](/es/reference/RELEASING)).

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios de tiempo de ejecución del paquete en proceso
- Las rutas de Skills y de paquetes de hooks deben permanecer dentro de la raíz del plugin (comprobación de límites)
- Los archivos de ajustes se leen con las mismas comprobaciones de límites
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así deberías tratar los
paquetes de terceros como contenido confiable para las funciones que sí exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta, pero las capacidades no se ejecutan">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece pero está marcada como
    no conectada, eso es un límite del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrate de que el paquete esté habilitado y de que los archivos markdown estén dentro de una raíz detectada
    `commands/` o `skills/`.
  </Accordion>

  <Accordion title="Los ajustes de Claude no se aplican">
    Solo son compatibles los ajustes integrados de Pi desde `settings.json`. OpenClaw no
    trata los ajustes del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o distribuye un Plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Creación de plugins](/es/plugins/building-plugins) — crear un Plugin nativo
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto nativo
