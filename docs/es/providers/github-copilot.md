---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos
    - Necesitas el flujo `openclaw models auth login-github-copilot`
    - Está eligiendo entre el proveedor de Copilot integrado, el arnés de Copilot SDK y Copilot Proxy
summary: Inicia sesión en GitHub Copilot desde OpenClaw usando el flujo de dispositivo o la importación no interactiva de token
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T12:37:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a los modelos de Copilot
para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor de modelos
o runtime de agente de tres maneras diferentes.

## Tres formas de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Usa el flujo nativo de inicio de sesión en dispositivo para obtener un token de GitHub y luego canjéalo por
    tokens de la API de Copilot cuando OpenClaw se ejecute. Esta es la ruta **predeterminada** y más sencilla
    porque no requiere VS Code.

    <Steps>
      <Step title="Ejecuta el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá visitar una URL e introducir un código de un solo uso. Mantén la
        terminal abierta hasta que finalice.
      </Step>
      <Step title="Define un modelo predeterminado">
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

  <Tab title="Plugin de arnés del SDK de Copilot (copilot)">
    Instala el Plugin externo `@openclaw/copilot` cuando quieras que la
    CLI y el SDK de Copilot de GitHub controlen el bucle de agente de bajo nivel para los modelos
    `github-copilot/*` seleccionados.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Luego asigna un modelo o proveedor al runtime:

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

    Elige esta opción cuando quieras sesiones nativas de la CLI de Copilot, estado de hilos
    gestionado por el SDK y Compaction gestionada por Copilot para esos turnos de agente. Consulta
    [Arnés del SDK de Copilot](/es/plugins/copilot) para ver el contrato completo del runtime.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa la extensión **Copilot Proxy** de VS Code como puente local. OpenClaw se comunica con
    el endpoint `/v1` del proxy y usa la lista de modelos que configures allí.

    <Note>
    Elige esta opción cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar
    a través de él. Debes habilitar el Plugin y mantener la extensión de VS Code en ejecución.
    </Note>

  </Tab>
</Tabs>

## Flags opcionales

| Flag            | Descripción                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Omite la solicitud de confirmación                  |
| `--set-default` | También aplica el modelo predeterminado recomendado por el proveedor |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Incorporación no interactiva

Si ya tienes un token de acceso OAuth de GitHub para Copilot, impórtalo durante la
configuración sin interfaz con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

También puedes omitir `--auth-choice`; pasar `--github-copilot-token` infiere la
opción de autenticación del proveedor GitHub Copilot. Si se omite el flag, la incorporación
recurre a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` y luego `GITHUB_TOKEN`. Usa
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` definido para almacenar un
`tokenRef` respaldado por env en lugar de texto sin formato en `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Se requiere TTY interactiva">
    El flujo de inicio de sesión en dispositivo requiere una TTY interactiva. Ejecútalo directamente en una
    terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="La disponibilidad de modelos depende de tu plan">
    La disponibilidad de modelos de Copilot depende de tu plan de GitHub. Si se
    rechaza un modelo, prueba otro ID (por ejemplo `github-copilot/gpt-5.5`). Consulta
    los [modelos compatibles por plan de Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) de GitHub
    para ver la lista actual de modelos.
  </Accordion>

  <Accordion title="Actualización en vivo del catálogo desde la API de Copilot">
    Una vez que la ruta de autenticación por inicio de sesión en dispositivo (o variable de entorno) haya resuelto un token de GitHub,
    OpenClaw actualiza el catálogo de modelos bajo demanda desde `${baseUrl}/models`
    (el mismo endpoint que usa VS Code Copilot), de modo que el runtime refleje
    los derechos por cuenta y las ventanas de contexto precisas sin cambios
    en el manifiesto. Los modelos de Copilot publicados recientemente quedan visibles sin una actualización de OpenClaw,
    y las ventanas de contexto reflejan los límites reales por modelo
    (por ejemplo, 400k para la serie gpt-5.x, 1M para las variantes internas
    `claude-opus-*-1m`).

    El catálogo estático incluido permanece como alternativa visible cuando la detección
    está deshabilitada, el usuario no tiene perfil de autenticación de GitHub, el intercambio de tokens
    falla o la llamada HTTPS a `/models` produce un error. Para desactivar esto y depender por completo
    del catálogo estático del manifiesto (escenarios sin conexión / aislados de la red):

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

  <Accordion title="Selección de transporte">
    Los ID de modelos Claude usan automáticamente el transporte Anthropic Messages. Los modelos GPT,
    o-series y Gemini conservan el transporte OpenAI Responses. OpenClaw
    selecciona el transporte correcto según la referencia del modelo.
  </Accordion>

  <Accordion title="Compatibilidad de solicitudes">
    OpenClaw envía encabezados de solicitud de estilo IDE de Copilot en los transportes de Copilot,
    incluidos turnos integrados de Compaction, resultado de herramienta y seguimiento de imagen. No
    habilita la continuación de Responses a nivel de proveedor para Copilot a menos que
    ese comportamiento se haya verificado con la API de Copilot.
  </Accordion>

  <Accordion title="Orden de resolución de variables de entorno">
    OpenClaw resuelve la autenticación de Copilot desde variables de entorno en el siguiente
    orden de prioridad:

    | Prioridad | Variable              | Notas                            |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Máxima prioridad, específica de Copilot |
    | 2         | `GH_TOKEN`            | Token de GitHub CLI (alternativa) |
    | 3         | `GITHUB_TOKEN`        | Token estándar de GitHub (mínima) |

    Cuando se definen varias variables, OpenClaw usa la de mayor prioridad.
    El flujo de inicio de sesión en dispositivo (`openclaw models auth login-github-copilot`) almacena
    su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables
    de entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación y lo intercambia
    por un token de la API de Copilot cuando OpenClaw se ejecuta. No necesitas gestionar el
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
El comando de inicio de sesión en dispositivo requiere una TTY interactiva. Usa la incorporación no interactiva
cuando necesites una configuración sin interfaz.
</Warning>

## Embeddings de búsqueda de memoria

GitHub Copilot también puede servir como proveedor de embeddings para
[búsqueda de memoria](/es/concepts/memory-search). Si tienes una suscripción a Copilot y
has iniciado sesión, OpenClaw puede usarlo para embeddings sin una clave de API separada.

### Configuración

Define `memorySearch.provider` explícitamente para usar embeddings de GitHub Copilot. Si hay un
token de GitHub disponible, OpenClaw descubre los modelos de embeddings disponibles desde
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

1. OpenClaw resuelve tu token de GitHub (desde variables de entorno o el perfil de autenticación).
2. Lo intercambia por un token de la API de Copilot de corta duración.
3. Consulta el endpoint `/models` de Copilot para descubrir los modelos de embeddings disponibles.
4. Elige el mejor modelo (prefiere `text-embedding-3-small`).
5. Envía solicitudes de embeddings al endpoint `/embeddings` de Copilot.

La disponibilidad de modelos depende de tu plan de GitHub. Si no hay modelos de embeddings
disponibles, OpenClaw omite Copilot e intenta con el siguiente proveedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
