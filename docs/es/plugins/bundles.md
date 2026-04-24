---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Necesitas entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando detección de paquetes o capacidades faltantes
summary: Instala y usa los paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de plugins
x-i18n:
    generated_at: "2026-04-24T05:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw puede instalar plugins desde tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Estos se llaman **paquetes** — paquetes de contenido y metadatos que
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

    Los paquetes se muestran como `Format: bundle` con un subtipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Reiniciar y usar">
    ```bash
    openclaw gateway restart
    ```

    Las funciones asignadas (Skills, hooks, herramientas MCP, valores predeterminados LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las funciones de los paquetes se ejecutan en OpenClaw hoy. Aquí se muestra qué
funciona y qué se detecta pero todavía no está conectado.

### Compatible ahora

| Función         | Cómo se asigna                                                                                | Se aplica a    |
| --------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Contenido de Skill | Las raíces de Skill del paquete se cargan como Skills normales de OpenClaw                | Todos los formatos |
| Comandos        | `commands/` y `.cursor/commands/` se tratan como raíces de Skill                             | Claude, Cursor |
| Paquetes de hooks | Diseños de estilo OpenClaw `HOOK.md` + `handler.ts`                                        | Codex          |
| Herramientas MCP | La configuración MCP del paquete se fusiona con la configuración integrada de Pi; se cargan servidores compatibles stdio y HTTP | Todos los formatos |
| Servidores LSP  | Los `.lsp.json` de Claude y los `lspServers` declarados en el manifiesto se fusionan con los valores predeterminados LSP integrados de Pi | Claude         |
| Ajustes         | `settings.json` de Claude se importa como valores predeterminados integrados de Pi           | Claude         |

#### Contenido de Skill

- las raíces de Skill del paquete se cargan como raíces normales de Skill de OpenClaw
- las raíces `commands` de Claude se tratan como raíces adicionales de Skill
- las raíces `.cursor/commands` de Cursor se tratan como raíces adicionales de Skill

Esto significa que los archivos de comandos markdown de Claude funcionan mediante el cargador normal de Skills de OpenClaw. Los comandos markdown de Cursor funcionan por la misma vía.

#### Paquetes de hooks

- las raíces de hooks del paquete funcionan **solo** cuando usan el diseño normal de paquete de hooks de OpenClaw. Hoy esto es principalmente el caso compatible con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP para Pi

- los paquetes habilitados pueden aportar configuración de servidor MCP
- OpenClaw fusiona la configuración MCP del paquete con la configuración integrada efectiva de Pi como
  `mcpServers`
- OpenClaw expone herramientas MCP compatibles del paquete durante los turnos integrados del agente Pi iniciando servidores stdio o conectándose a servidores HTTP
- los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP de paquetes por
  defecto; usa `tools.deny: ["bundle-mcp"]` para excluirlas en un agente o gateway
- los ajustes locales del proyecto de Pi siguen aplicándose después de los valores predeterminados del paquete, por lo que los ajustes del espacio de trabajo pueden sobrescribir entradas MCP del paquete cuando sea necesario
- los catálogos de herramientas MCP de paquetes se ordenan de forma determinista antes del registro, para que los cambios ascendentes en el orden de `listTools()` no desestabilicen los bloques de herramientas de prompt-cache

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

**HTTP** se conecta a un servidor MCP en ejecución usando `sse` por defecto, o `streamable-http` cuando se solicita:

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
- solo se permiten esquemas de URL `http:` y `https:`
- los valores de `headers` admiten interpolación `${ENV_VAR}`
- se rechaza una entrada de servidor que tenga tanto `command` como `url`
- las credenciales de URL (userinfo y parámetros de consulta) se redactan de las descripciones y registros de herramientas
- `connectionTimeoutMs` sobrescribe el tiempo de espera de conexión predeterminado de 30 segundos para transportes stdio y HTTP

##### Nombres de herramientas

OpenClaw registra las herramientas MCP del paquete con nombres seguros para el proveedor con la forma
`serverName__toolName`. Por ejemplo, un servidor identificado como `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`
- los prefijos de servidor están limitados a 30 caracteres
- los nombres completos de herramientas están limitados a 64 caracteres
- los nombres vacíos de servidor usan `mcp` como alternativa
- los nombres saneados que colisionan se diferencian con sufijos numéricos
- el orden final expuesto de herramientas es determinista por nombre seguro para mantener estables en caché los turnos repetidos de Pi
- el filtrado por perfil trata todas las herramientas de un servidor MCP del paquete como propiedad del plugin
  `bundle-mcp`, por lo que las allowlists y deny lists del perfil pueden incluir tanto
  nombres individuales de herramientas expuestas como la clave de plugin `bundle-mcp`

#### Ajustes integrados de Pi

- `settings.json` de Claude se importa como ajustes integrados predeterminados de Pi cuando el
  paquete está habilitado
- OpenClaw sanea las claves de sobrescritura de shell antes de aplicarlas

Claves saneadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP integrado de Pi

- los paquetes habilitados de Claude pueden aportar configuración de servidor LSP
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto
- la configuración LSP del paquete se fusiona con los valores predeterminados LSP efectivos integrados de Pi
- hoy solo pueden ejecutarse servidores LSP compatibles respaldados por stdio; los
  transportes no compatibles siguen apareciendo en `openclaw plugins inspect <id>`

### Detectado pero no ejecutado

Estos se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- metadatos inline/de app de Codex más allá del informe de capacidades

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

    - `commands/` se trata como contenido de Skill
    - `settings.json` se importa en los ajustes integrados de Pi (las claves de sobrescritura de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles al Pi integrado
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados LSP integrados de Pi
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - las rutas de componentes personalizadas en el manifiesto son aditivas (extienden los valores predeterminados, no los reemplazan)

  </Accordion>

  <Accordion title="Paquetes de Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de Skill
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Precedencia de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o `package.json` válido con `openclaw.extensions` — se trata como **plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor) — se trata como **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita que
los paquetes de formato dual se instalen parcialmente como paquetes.

## Dependencias de tiempo de ejecución y limpieza

- Las dependencias de tiempo de ejecución de plugins incluidos se distribuyen dentro del paquete de OpenClaw bajo
  `dist/*`. OpenClaw **no** ejecuta `npm install` al iniciar para los
  plugins incluidos; la canalización de publicación es responsable de distribuir una
  carga útil completa de dependencias incluidas (consulta la regla de verificación posterior a la publicación en
  [Releasing](/es/reference/RELEASING)).

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios de tiempo de ejecución del paquete en proceso
- Las rutas de Skills y paquetes de hooks deben permanecer dentro de la raíz del plugin (comprobación de límites)
- Los archivos de ajustes se leen con las mismas comprobaciones de límites
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos

Esto hace que los paquetes sean más seguros por defecto, pero aun así deberías tratar
los paquetes de terceros como contenido de confianza para las funciones que sí exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se detecta el paquete pero sus capacidades no se ejecutan">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece listada pero marcada como
    no conectada, eso es un límite del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Los archivos de comandos de Claude no aparecen">
    Asegúrate de que el paquete esté habilitado y de que los archivos markdown estén dentro de una raíz detectada
    `commands/` o `skills/`.
  </Accordion>

  <Accordion title="Los ajustes de Claude no se aplican">
    Solo se admiten ajustes integrados de Pi desde `settings.json`. OpenClaw no
    trata los ajustes del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks de Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o distribuye un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Building Plugins](/es/plugins/building-plugins) — crear un plugin nativo
- [Manifiesto de plugin](/es/plugins/manifest) — esquema de manifiesto nativo
