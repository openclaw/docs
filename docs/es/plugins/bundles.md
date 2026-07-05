---
read_when:
    - Quieres instalar un paquete compatible con Codex, Claude o Cursor
    - Necesitas entender cómo OpenClaw asigna el contenido del paquete a funciones nativas
    - Estás depurando la detección de paquetes o capacidades faltantes
summary: Instala y usa paquetes de Codex, Claude y Cursor como plugins de OpenClaw
title: Paquetes de Plugin
x-i18n:
    generated_at: "2026-07-05T11:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw puede instalar plugins de tres ecosistemas externos: **Codex**, **Claude**
y **Cursor**. Estos se llaman **paquetes**: paquetes de contenido y metadatos que
OpenClaw asigna a características nativas como habilidades, hooks y herramientas MCP.

<Info>
  Los paquetes **no** son lo mismo que los plugins nativos de OpenClaw. Los plugins nativos se ejecutan
  en proceso y pueden registrar cualquier capacidad. Los paquetes son paquetes de contenido con
  asignación selectiva de características y un límite de confianza más estrecho.
</Info>

## Por qué existen los paquetes

Muchos plugins útiles se publican en formato Codex, Claude o Cursor. En lugar
de exigir a los autores que los reescriban como plugins nativos de OpenClaw, OpenClaw
detecta estos formatos y asigna su contenido compatible al conjunto de características
nativas. Puedes instalar un paquete de comandos de Claude o un paquete de habilidades de Codex y usarlo
de inmediato.

## Instalar un paquete

<Steps>
  <Step title="Instalar desde un directorio, archivo o marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` es una ruta/repositorio de marketplace local o una fuente git/GitHub.

  </Step>

  <Step title="Verificar la detección">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Los paquetes muestran `Format: bundle` más un valor `Bundle format:` de `codex`,
    `claude` o `cursor`.

  </Step>

  <Step title="Reiniciar y usar">
    ```bash
    openclaw gateway restart
    ```

    Las características asignadas (habilidades, hooks, herramientas MCP, valores predeterminados de LSP) están disponibles en la siguiente sesión.

  </Step>
</Steps>

## Qué asigna OpenClaw desde los paquetes

No todas las características de los paquetes se ejecutan hoy en OpenClaw. Esto es lo que funciona y lo que
se detecta, pero aún no está conectado.

### Compatible ahora

| Característica       | Cómo se asigna                                                                                       | Se aplica a     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Contenido de habilidades | Las raíces de habilidades del paquete se cargan como habilidades normales de OpenClaw                                                 | Todos los formatos    |
| Comandos      | `commands/` y `.cursor/commands/` se tratan como raíces de habilidades                                        | Claude, Cursor |
| Paquetes de hooks    | Diseños estilo OpenClaw con `HOOK.md` + `handler.ts`                                                   | Codex          |
| Herramientas MCP     | La configuración MCP del paquete se fusiona en la configuración embebida de OpenClaw; se cargan servidores stdio y HTTP compatibles | Todos los formatos    |
| Servidores LSP   | `.lsp.json` de Claude y `lspServers` declarados en el manifiesto se fusionan en los valores predeterminados de LSP embebidos de OpenClaw  | Claude         |
| Configuración      | `settings.json` de Claude se importa como valores predeterminados embebidos de OpenClaw                                     | Claude         |

#### Contenido de habilidades

- Las raíces de habilidades del paquete se cargan como raíces de habilidades normales de OpenClaw.
- Las raíces `commands/` de Claude se tratan como raíces de habilidades adicionales.
- Las raíces `.cursor/commands/` de Cursor se tratan como raíces de habilidades adicionales.

Los archivos de comandos markdown de Claude y el markdown de comandos de Cursor funcionan mediante el
cargador normal de habilidades de OpenClaw.

#### Paquetes de hooks

Las raíces de hooks de paquetes funcionan **solo** cuando usan el diseño normal de paquete de hooks de OpenClaw:
`HOOK.md` más `handler.ts` o `handler.js`. Hoy, este es principalmente
el caso compatible con Codex.

#### MCP para OpenClaw embebido

- Los paquetes habilitados pueden aportar configuración de servidores MCP.
- OpenClaw fusiona la configuración MCP del paquete en la configuración efectiva de OpenClaw
  embebido como `mcpServers`.
- OpenClaw expone herramientas MCP de paquetes compatibles durante los turnos de agente de OpenClaw
  embebido iniciando servidores stdio o conectándose a servidores HTTP.
- Los perfiles de herramientas `coding` y `messaging` incluyen herramientas MCP de paquetes de forma
  predeterminada; usa `tools.deny: ["bundle-mcp"]` para excluirlas para un agente o Gateway.
- La configuración de agente embebido local del proyecto sigue aplicándose después de los valores predeterminados del paquete, por lo que
  la configuración del espacio de trabajo puede anular entradas MCP del paquete cuando sea necesario.
- Los catálogos de herramientas MCP de paquetes se ordenan de forma determinista antes del registro, por lo que
  los cambios en el orden de `listTools()` ascendente no invalidan repetidamente los bloques de herramientas de la caché de prompts.

##### Transportes

Los servidores MCP pueden usar transporte stdio o HTTP.

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

**HTTP** se conecta a un servidor MCP en ejecución, usando `sse` de forma predeterminada a menos que
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
- `type: "http"` es una forma descendente nativa de la CLI; usa `transport: "streamable-http"` en la configuración de OpenClaw. `openclaw mcp set` y `openclaw doctor --fix` normalizan el alias común.
- Solo se permiten esquemas de URL `http:` y `https:`.
- Los valores de `headers` admiten interpolación `${ENV_VAR}`.
- Se rechaza una entrada de servidor con `command` y `url`.
- Las credenciales de URL (userinfo y parámetros de consulta) se redactan de las
  descripciones de herramientas y los logs.
- `connectionTimeoutMs` anula el tiempo de espera de conexión predeterminado de 30 segundos para
  transportes stdio y HTTP. El tiempo de espera de solicitud tiene un valor predeterminado de 60 segundos y
  puede anularse con `requestTimeoutMs`.

##### Nomenclatura de herramientas

OpenClaw registra herramientas MCP de paquetes con nombres seguros para proveedores en la forma
`serverName__toolName`. Por ejemplo, un servidor con la clave `"vigil-harbor"` que expone una
herramienta `memory_search` se registra como `vigil-harbor__memory_search`.

- Los caracteres fuera de `A-Za-z0-9_-` se reemplazan por `-`.
- Los fragmentos que empezarían por una no letra reciben un prefijo de letra, por lo que las claves numéricas
  de servidor como `12306` se convierten en prefijos de herramienta seguros para proveedores.
- Los prefijos de servidor tienen un límite de 30 caracteres.
- Los nombres completos de herramientas tienen un límite de 64 caracteres.
- Los nombres de servidor vacíos usan `mcp` como alternativa.
- Los nombres saneados que colisionan se desambiguan con sufijos numéricos.
- El orden final de herramientas expuestas es determinista por nombre seguro, lo que mantiene los turnos
  repetidos de agente embebido estables para la caché.
- El filtrado de perfiles trata cada herramienta de un servidor MCP de paquete como
  propiedad del plugin `bundle-mcp`, por lo que las listas allow/deny de perfiles pueden hacer referencia
  a nombres individuales de herramientas expuestas o a la clave de plugin `bundle-mcp`.

#### Configuración embebida de OpenClaw

`settings.json` de Claude se importa como configuración predeterminada embebida de OpenClaw cuando
el paquete está habilitado. OpenClaw sanea las claves de anulación de shell antes de aplicarlas:

- `shellPath`
- `shellCommandPrefix`

#### LSP embebido de OpenClaw

- Los paquetes Claude habilitados pueden aportar configuración de servidores LSP.
- OpenClaw carga `.lsp.json` más cualquier ruta `lspServers` declarada en el manifiesto.
- La configuración LSP del paquete se fusiona en los valores predeterminados efectivos de LSP de OpenClaw
  embebido.
- Hoy solo son ejecutables los servidores LSP respaldados por stdio compatibles; los transportes
  no compatibles siguen apareciendo en `openclaw plugins inspect <id>`.

### Detectado pero no ejecutado

Se reconocen y se muestran en diagnósticos, pero OpenClaw no los ejecuta:

- `agents`, automatización `hooks/hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- Metadatos `.app.json` de Codex más allá del informe de capacidades

## Formatos de paquete

<AccordionGroup>
  <Accordion title="Paquetes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Contenido opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Los paquetes Codex encajan mejor con OpenClaw cuando usan raíces de habilidades y directorios
    de paquetes de hooks estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquetes Claude">
    Dos modos de detección:

    - **Basado en manifiesto:** `.claude-plugin/plugin.json`
    - **Sin manifiesto:** diseño predeterminado de Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamiento específico de Claude:

    - `commands/` se trata como contenido de habilidades
    - `settings.json` se importa en la configuración embebida de OpenClaw (las claves de anulación de shell se sanean)
    - `.mcp.json` expone herramientas stdio compatibles a OpenClaw embebido
    - `.lsp.json` más las rutas `lspServers` declaradas en el manifiesto se cargan en los valores predeterminados de LSP embebidos de OpenClaw
    - `hooks/hooks.json` se detecta pero no se ejecuta
    - Las rutas de componentes personalizados en el manifiesto son aditivas; extienden los valores predeterminados, no los reemplazan

  </Accordion>

  <Accordion title="Paquetes Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Contenido opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` se trata como contenido de habilidades
    - `.cursor/rules/`, `.cursor/agents/` y `.cursor/hooks.json` son solo de detección

  </Accordion>
</AccordionGroup>

## Prioridad de detección

OpenClaw comprueba primero el formato de plugin nativo:

1. `openclaw.plugin.json` o un `package.json` válido con `openclaw.extensions`: se trata como un **plugin nativo**
2. Marcadores de paquete (`.codex-plugin/`, `.claude-plugin/` o diseño predeterminado de Claude/Cursor): se trata como un **paquete**

Si un directorio contiene ambos, OpenClaw usa la ruta nativa. Esto evita que
los paquetes de doble formato se instalen parcialmente como paquetes.

## Dependencias en tiempo de ejecución y limpieza

- Los paquetes compatibles de terceros no reciben reparación `npm install` en el inicio. Deben
  instalarse mediante `openclaw plugins install` y traer todo lo que
  necesitan en el directorio de plugin instalado.
- Los plugins empaquetados propiedad de OpenClaw se entregan ligeros en core o
  se pueden descargar mediante el instalador de plugins. El inicio de Gateway nunca ejecuta un
  gestor de paquetes para ellos.
- `openclaw doctor --fix` elimina registros obsoletos de instalación local de plugins empaquetados
  y puede recuperar plugins descargables que faltan en el índice local de plugins
  cuando la configuración aún hace referencia a ellos.

## Seguridad

Los paquetes tienen un límite de confianza más estrecho que los plugins nativos:

- OpenClaw **no** carga módulos arbitrarios de tiempo de ejecución del paquete en proceso.
- Las rutas de habilidades y paquetes de hooks deben permanecer dentro de la raíz del plugin (con comprobación de límite).
- Los archivos de configuración se leen con las mismas comprobaciones de límite.
- Los servidores MCP stdio compatibles pueden iniciarse como subprocesos.

Esto hace que los paquetes sean más seguros de forma predeterminada, pero aun así debes tratar los paquetes
de terceros como contenido de confianza para las características que exponen.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El paquete se detecta pero las capacidades no se ejecutan">
    Ejecuta `openclaw plugins inspect <id>`. Si una capacidad aparece, pero está marcada como
    no conectada, es un límite del producto, no una instalación rota.
  </Accordion>

  <Accordion title="Los archivos de comandos Claude no aparecen">
    Asegúrate de que el paquete esté habilitado y de que los archivos markdown estén dentro de una raíz
    `commands/` o `skills/` detectada.
  </Accordion>

  <Accordion title="La configuración Claude no se aplica">
    Solo se admite la configuración embebida de OpenClaw desde `settings.json`. OpenClaw no
    trata la configuración del paquete como parches de configuración sin procesar.
  </Accordion>

  <Accordion title="Los hooks Claude no se ejecutan">
    `hooks/hooks.json` es solo de detección. Si necesitas hooks ejecutables, usa el
    diseño de paquete de hooks de OpenClaw o entrega un plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar y configurar plugins](/es/tools/plugin)
- [Crear plugins](/es/plugins/building-plugins): crea un plugin nativo
- [Manifiesto de plugin](/es/plugins/manifest): esquema de manifiesto nativo
