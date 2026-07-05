---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos
    - Necesita el flujo `openclaw models auth login-github-copilot`
    - Estás eligiendo entre el proveedor Copilot integrado, el arnés del SDK de Copilot y Copilot Proxy
summary: Inicia sesión en GitHub Copilot desde OpenClaw usando el flujo de dispositivo o la importación de token no interactiva
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-05T11:40:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8af0ed48af8586da0e2bd922e3a674b73c57fdaf25ae5a3a7988e38a467cab7f
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a modelos de Copilot
para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor de modelos
o runtime de agente de tres maneras diferentes.

## Tres maneras de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Usa el flujo nativo de inicio de sesión por dispositivo para obtener un token de GitHub y luego canjearlo por
    tokens de la API de Copilot cuando OpenClaw se ejecuta. Esta es la ruta **predeterminada** y más sencilla
    porque no requiere VS Code.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá que visites una URL e ingreses un código de un solo uso. Mantén la
        terminal abierta hasta que finalice.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        O en la configuración:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK harness plugin (copilot)">
    Instala el plugin externo `@openclaw/copilot` cuando quieras que la
    CLI y el SDK de Copilot de GitHub sean propietarios del bucle de agente de bajo nivel para los modelos
    `github-copilot/*` seleccionados.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Luego habilita el runtime para un modelo o proveedor:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Elige esto cuando quieras sesiones nativas de la CLI de Copilot, estado de hilos
    gestionado por el SDK y Compaction propiedad de Copilot para esos turnos de agente. Sin la
    habilitación explícita con `agentRuntime`, los modelos `github-copilot/*` siguen usando el
    proveedor integrado. Consulta [Copilot SDK harness](/es/plugins/copilot) para ver el contrato
    completo del runtime.

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Usa la extensión de VS Code **Copilot Proxy** como puente local. OpenClaw se comunica con
    el endpoint `/v1` del proxy (predeterminado `http://localhost:3000/v1`) y usa la
    lista de modelos que configures.

    El plugin `copilot-proxy` se incluye con OpenClaw y está habilitado de forma predeterminada.
    Configura la URL base y los ids de modelo con:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Elige esto cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar
    a través de él. La extensión de VS Code debe permanecer en ejecución.
    </Note>

  </Tab>
</Tabs>

## Banderas opcionales

| Comando                                                                | Bandera         | Descripción                                          |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Sobrescribe un perfil de autenticación existente sin preguntar |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | También aplica el modelo predeterminado recomendado por el proveedor |

```bash
# Skip the re-login confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Incorporación no interactiva

El flujo de inicio de sesión por dispositivo requiere una TTY interactiva. Para una configuración sin interfaz,
importa un token de acceso OAuth de GitHub existente con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

También puedes omitir `--auth-choice`; pasar `--github-copilot-token` infiere la
opción de autenticación del proveedor GitHub Copilot. Si se omite la bandera, la incorporación
recurre a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` y luego `GITHUB_TOKEN`. Usa
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` configurado para almacenar un
`tokenRef` respaldado por variable de entorno en lugar de texto sin formato en `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    El flujo de inicio de sesión por dispositivo requiere una TTY interactiva. Ejecútalo directamente en una
    terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    La disponibilidad de modelos de Copilot depende de tu plan de GitHub. Si se rechaza un modelo,
    prueba con otro ID (por ejemplo `github-copilot/gpt-5.5`). Consulta
    [modelos compatibles por plan de Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    de GitHub para ver la lista actual de modelos.
  </Accordion>

  <Accordion title="Live catalog refresh from the Copilot API">
    Una vez que la ruta de autenticación por inicio de sesión por dispositivo (o variable de entorno) ha resuelto un token de GitHub,
    OpenClaw actualiza el catálogo de modelos bajo demanda desde `${baseUrl}/models`
    (el mismo endpoint que usa VS Code Copilot), de modo que el runtime sigue
    los derechos por cuenta y ventanas de contexto precisas sin rotación de manifiestos.
    Los modelos de Copilot recién publicados se vuelven visibles sin actualizar OpenClaw,
    y las ventanas de contexto reflejan los límites reales por modelo
    (p. ej., 400k para la serie gpt-5.x, 1M para las variantes internas
    `claude-opus-*-1m`).

    El catálogo estático incluido permanece como alternativa visible cuando la detección
    está deshabilitada, el usuario no tiene perfil de autenticación de GitHub, el intercambio de token
    falla o la llamada HTTPS a `/models` produce un error. Para excluirte y depender por completo
    del catálogo de manifiesto estático (escenarios sin conexión / aislados de la red):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Transport selection">
    Los IDs de modelo Claude usan automáticamente el transporte Anthropic Messages.
    Los modelos Gemini usan el transporte OpenAI Chat Completions; los modelos GPT y o-series
    mantienen el transporte OpenAI Responses. OpenClaw selecciona el transporte correcto
    según la referencia de modelo.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw envía encabezados de solicitud de estilo IDE de Copilot en los transportes de Copilot
    (versiones del editor/plugin de VS Code y el id de integración `vscode-chat`),
    marca los turnos de seguimiento con resultado de herramienta como iniciados por el agente y configura el encabezado
    de visión de Copilot cuando un turno lleva entrada de imagen.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw resuelve la autenticación de Copilot desde variables de entorno en el siguiente
    orden de prioridad:

    | Prioridad | Variable              | Notas                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Prioridad más alta, específica de Copilot |
    | 2        | `GH_TOKEN`            | Token de GitHub CLI (alternativa) |
    | 3        | `GITHUB_TOKEN`        | Token estándar de GitHub (más baja) |

    Cuando se configuran varias variables, OpenClaw usa la de mayor prioridad.
    El flujo de inicio de sesión por dispositivo (`openclaw models auth login-github-copilot`) almacena
    su token en el almacén de perfiles de autenticación y tiene precedencia sobre todas las variables
    de entorno.

  </Accordion>

  <Accordion title="Token storage">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación (id de perfil
    `github-copilot:github`) y lo canjea por un token de API de Copilot de corta duración
    cuando OpenClaw se ejecuta. No necesitas gestionar el token manualmente.
  </Accordion>
</AccordionGroup>

## Embeddings de búsqueda de memoria

GitHub Copilot también puede servir como proveedor de embeddings para
[búsqueda de memoria](/es/concepts/memory-search). Si tienes una suscripción a Copilot y
has iniciado sesión, OpenClaw puede usarlo para embeddings sin una clave de API separada.

### Configuración

Configura `memorySearch.provider` explícitamente para usar embeddings de GitHub Copilot. Si hay un
token de GitHub disponible, OpenClaw detecta los modelos de embedding disponibles desde
la API de Copilot y elige automáticamente el mejor.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cómo funciona

1. OpenClaw resuelve tu token de GitHub (desde variables de entorno o perfil de autenticación).
2. Lo canjea por un token de API de Copilot de corta duración.
3. Consulta el endpoint `/models` de Copilot para detectar modelos de embedding disponibles.
4. Elige el mejor modelo (orden de preferencia: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Envía solicitudes de embedding al endpoint `/embeddings` de Copilot.

La disponibilidad de modelos depende de tu plan de GitHub. Si no hay modelos de embedding
disponibles, OpenClaw omite Copilot e intenta con el siguiente proveedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth and auth" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
