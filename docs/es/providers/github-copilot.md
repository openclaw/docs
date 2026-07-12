---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos.
    - Necesitas el flujo `openclaw models auth login-github-copilot`
    - Estás eligiendo entre el proveedor Copilot integrado, el arnés del SDK de Copilot y Copilot Proxy
summary: Inicia sesión en GitHub Copilot desde OpenClaw mediante el flujo de dispositivo o la importación no interactiva de tokens
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-11T23:26:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a los modelos de Copilot disponibles para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor de modelos o entorno de ejecución de agentes de tres maneras diferentes.

## Tres maneras de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Usa el flujo nativo de inicio de sesión mediante dispositivo para obtener un token de GitHub y, después, intercámbialo por tokens de la API de Copilot cuando se ejecute OpenClaw. Esta es la ruta **predeterminada** y más sencilla porque no requiere VS Code.

    <Steps>
      <Step title="Ejecuta el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá que visites una URL e introduzcas un código de un solo uso. Mantén la terminal abierta hasta que finalice.
      </Step>
      <Step title="Establece un modelo predeterminado">
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

  <Tab title="Plugin de integración del SDK de Copilot (copilot)">
    Instala el Plugin externo `@openclaw/copilot` cuando quieras que la CLI y el SDK de Copilot de GitHub gestionen el bucle de agente de bajo nivel para determinados modelos `github-copilot/*`.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    A continuación, habilita el entorno de ejecución para un modelo o proveedor:

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

    Elige esta opción cuando quieras sesiones nativas de la CLI de Copilot, estado de los hilos gestionado por el SDK y Compaction gestionada por Copilot para esos turnos del agente. Sin la habilitación explícita mediante `agentRuntime`, los modelos `github-copilot/*` seguirán usando el proveedor integrado. Consulta [Integración del SDK de Copilot](/es/plugins/copilot) para conocer el contrato completo del entorno de ejecución.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa la extensión **Copilot Proxy** de VS Code como puente local. OpenClaw se comunica con el endpoint `/v1` del proxy (de manera predeterminada, `http://localhost:3000/v1`) y usa la lista de modelos que configures.

    El Plugin `copilot-proxy` se distribuye con OpenClaw y está habilitado de manera predeterminada. Configura la URL base y los identificadores de los modelos con:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Elige esta opción cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar el tráfico a través de él. La extensión de VS Code debe permanecer en ejecución.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residencia de datos)

Si tu organización usa un entorno de GitHub Enterprise con residencia de datos (un host `*.ghe.com`, como `your-org.ghe.com`), Copilot se encuentra en endpoints locales del entorno en lugar de en el `github.com` público. OpenClaw ofrece esta opción como método de autenticación de primera clase para que no tengas que editar las URL manualmente.

<Steps>
  <Step title="Elige la opción de autenticación de Enterprise">
    Durante la incorporación o en `openclaw models auth`, elige **GitHub Copilot (Enterprise / data residency)**. Se te pedirá el dominio de Enterprise (por ejemplo, `your-org.ghe.com`) y, después, el inicio de sesión mediante dispositivo se ejecutará en ese entorno.

    Introduce únicamente la raíz del entorno (`your-org.ghe.com`). No se aceptan hosts de servicio derivados, como `api.your-org.ghe.com` o `copilot-api.your-org.ghe.com`; OpenClaw obtiene esos endpoints automáticamente a partir de la raíz del entorno.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="El dominio se conserva en la configuración">
    El host elegido se almacena en los parámetros del proveedor para que las posteriores renovaciones de tokens y solicitudes de completado se dirijan automáticamente al entorno:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

El flujo mediante dispositivo, el intercambio de tokens y las solicitudes de completado se resuelven respectivamente en `https://your-org.ghe.com/login/device/code`, `https://api.your-org.ghe.com/copilot_internal/v2/token` y `https://copilot-api.your-org.ghe.com`. Los tokens de residencia de datos incluyen una marca del entorno y no contienen ninguna indicación de proxy, por lo que la URL base de completado recurre al host de Copilot del entorno en lugar del endpoint público.

<Note>
Al cambiar de dominio siempre se vuelve a ejecutar el inicio de sesión mediante dispositivo. Si ya tienes almacenado un token de Copilot y eliges un dominio distinto (el `github.com` público ↔ un entorno `*.ghe.com`, o de un entorno a otro), OpenClaw no reutilizará el token existente: forzará un nuevo inicio de sesión para que el ámbito del token corresponda al dominio que se escribirá en la configuración. Al volver a iniciar sesión en el *mismo* dominio, todavía se ofrece la posibilidad de reutilizar el token actual. Al volver al `github.com` público, se elimina el valor `githubDomain` conservado para que la configuración vuelva al valor predeterminado.
</Note>

<Note>
La variable de entorno `COPILOT_GITHUB_DOMAIN` sustituye el dominio resuelto en todas las rutas de Copilot que lo utilizan: el inicio de sesión mediante dispositivo de Enterprise (`--method device-enterprise`), el acceso directo independiente `openclaw models auth login-github-copilot`, la renovación de tokens, las incrustaciones y las solicitudes de completado. Asígnale tu host `*.ghe.com` en configuraciones completamente desatendidas o de CI. Déjala sin definir (y sin el parámetro de configuración) para usar el `github.com` público. Los inicios de sesión conservan el dominio para el que se emitió el token (y lo eliminan al iniciar sesión en el `github.com` público), por lo que el enrutamiento continúa siendo correcto incluso después de quitar la variable de entorno.
</Note>

## Indicadores opcionales

| Comando                                                                | Indicador       | Descripción                                                        |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Sobrescribe un perfil de autenticación existente sin pedir confirmación |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Aplica también el modelo predeterminado recomendado por el proveedor |

```bash
# Omitir la confirmación para volver a iniciar sesión
openclaw models auth login-github-copilot --yes

# Iniciar sesión y establecer el modelo predeterminado en un solo paso
openclaw models auth login --provider github-copilot --method device --set-default
```

## Incorporación no interactiva

El flujo de inicio de sesión mediante dispositivo requiere una TTY interactiva. Para una configuración desatendida, importa un token de acceso OAuth de GitHub existente con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

También puedes omitir `--auth-choice`; proporcionar `--github-copilot-token` permite deducir la opción de autenticación del proveedor GitHub Copilot. Si se omite el indicador, la incorporación recurre a `COPILOT_GITHUB_TOKEN`, después a `GH_TOKEN` y, por último, a `GITHUB_TOKEN`. Usa `--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` definido para almacenar un `tokenRef` respaldado por una variable de entorno, en lugar de texto sin cifrar en `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Se requiere una TTY interactiva">
    El flujo de inicio de sesión mediante dispositivo requiere una TTY interactiva. Ejecútalo directamente en una terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="La disponibilidad de los modelos depende de tu plan">
    La disponibilidad de los modelos de Copilot depende de tu plan de GitHub. Si se rechaza un modelo, prueba otro identificador (por ejemplo, `github-copilot/gpt-5.5`). Consulta los [modelos admitidos por cada plan de Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) de GitHub para conocer la lista actual de modelos.
  </Accordion>

  <Accordion title="Actualización en vivo del catálogo desde la API de Copilot">
    Una vez que la ruta de autenticación mediante inicio de sesión por dispositivo (o variable de entorno) ha resuelto un token de GitHub, OpenClaw actualiza el catálogo de modelos bajo demanda desde `${baseUrl}/models` (el mismo endpoint que usa Copilot en VS Code), de modo que el entorno de ejecución refleje los permisos de cada cuenta y las ventanas de contexto exactas sin necesidad de modificar continuamente el manifiesto. Los modelos de Copilot recién publicados se vuelven visibles sin actualizar OpenClaw, y las ventanas de contexto reflejan los límites reales de cada modelo (por ejemplo, 400 000 para la serie gpt-5.x y 1 millón para las variantes internas `claude-opus-*-1m`).

    El catálogo estático incluido permanece como alternativa visible cuando la detección está deshabilitada, el usuario no tiene un perfil de autenticación de GitHub, falla el intercambio de tokens o se produce un error en la llamada HTTPS a `/models`. Para desactivar esta función y depender por completo del catálogo estático del manifiesto (en situaciones sin conexión o con aislamiento de red):

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

  <Accordion title="Selección del transporte">
    Los identificadores de modelos Claude usan automáticamente el transporte Anthropic Messages. Los modelos Gemini usan el transporte OpenAI Chat Completions; los modelos GPT y de la serie o mantienen el transporte OpenAI Responses. OpenClaw selecciona el transporte correcto según la referencia del modelo.
  </Accordion>

  <Accordion title="Compatibilidad de las solicitudes">
    OpenClaw envía encabezados de solicitud con el estilo del IDE de Copilot en los transportes de Copilot (versiones del editor y del Plugin de VS Code, así como el identificador de integración `vscode-chat`), marca como iniciados por el agente los turnos de seguimiento de los resultados de herramientas y establece el encabezado de visión de Copilot cuando un turno contiene una imagen de entrada.
  </Accordion>

  <Accordion title="Orden de resolución de las variables de entorno">
    OpenClaw resuelve la autenticación de Copilot a partir de variables de entorno en el siguiente orden de prioridad:

    | Prioridad | Variable               | Notas                                      |
    | --------- | ---------------------- | ------------------------------------------ |
    | 1         | `COPILOT_GITHUB_TOKEN` | Prioridad máxima, específica de Copilot    |
    | 2         | `GH_TOKEN`             | Token de la CLI de GitHub (alternativa)    |
    | 3         | `GITHUB_TOKEN`         | Token estándar de GitHub (prioridad mínima) |

    Cuando hay varias variables definidas, OpenClaw usa la de mayor prioridad. El flujo de inicio de sesión mediante dispositivo (`openclaw models auth login-github-copilot`) almacena su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables de entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación (identificador de perfil `github-copilot:github`) y lo intercambia por un token de corta duración de la API de Copilot cuando se ejecuta OpenClaw. No necesitas gestionar el token manualmente.
  </Accordion>
</AccordionGroup>

## Incrustaciones para la búsqueda en memoria

GitHub Copilot también puede actuar como proveedor de incrustaciones para la [búsqueda en memoria](/es/concepts/memory-search). Si tienes una suscripción a Copilot y has iniciado sesión, OpenClaw puede usarla para generar incrustaciones sin una clave de API independiente.

### Configuración

Establece `memorySearch.provider` explícitamente para usar las incrustaciones de GitHub Copilot. Si hay disponible un token de GitHub, OpenClaw detecta los modelos de incrustación disponibles mediante la API de Copilot y elige automáticamente el mejor.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcional: sustituir el modelo detectado automáticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Funcionamiento

1. OpenClaw resuelve tu token de GitHub (a partir de variables de entorno o del perfil de autenticación).
2. Lo intercambia por un token de corta duración de la API de Copilot.
3. Consulta el endpoint `/models` de Copilot para detectar los modelos de incrustación disponibles.
4. Elige el mejor modelo (orden de preferencia: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`).
5. Envía solicitudes de incrustaciones al endpoint `/embeddings` de Copilot.

La disponibilidad de los modelos depende de tu plan de GitHub. Si no hay modelos de incrustación disponibles, OpenClaw omite Copilot y prueba el siguiente proveedor.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
