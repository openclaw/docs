---
read_when:
    - Se desea usar GitHub Copilot como proveedor de modelos
    - Necesita el flujo `openclaw models auth login-github-copilot`
    - Se está eligiendo entre el proveedor Copilot integrado, el arnés del SDK de Copilot y Copilot Proxy
summary: Inicia sesión en GitHub Copilot desde OpenClaw mediante el flujo de dispositivo o la importación no interactiva de tokens
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-22T10:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e839e6c72e7e7cb106a2f98c62c4994b4f3d6f34a2e76b549f2f6ccfdac91fe6
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a los modelos de Copilot
para su cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor de
modelos o entorno de ejecución de agentes de tres formas diferentes.

## Tres formas de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Use el flujo nativo de inicio de sesión mediante dispositivo para obtener un token de GitHub y, después,
    intercambiarlo por tokens de la API de Copilot cuando se ejecute OpenClaw. Esta es la ruta **predeterminada** y más sencilla
    porque no requiere VS Code.

    <Steps>
      <Step title="Ejecutar el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se le pedirá que visite una URL e introduzca un código de un solo uso. Mantenga
        la terminal abierta hasta que finalice.
      </Step>
      <Step title="Establecer un modelo predeterminado">
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

  <Tab title="Plugin del entorno SDK de Copilot (copilot)">
    Instale el Plugin externo `@openclaw/copilot` cuando quiera que la
    CLI y el SDK de Copilot de GitHub controlen el bucle de agente de bajo nivel para determinados
    modelos `github-copilot/*`.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Después, habilite el entorno de ejecución para un modelo o proveedor:

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

    Elija esta opción si quiere sesiones nativas de la CLI de Copilot, un estado de los hilos
    administrado por el SDK y una Compaction controlada por Copilot para esos turnos del agente. Sin
    la habilitación explícita `agentRuntime`, los modelos `github-copilot/*` siguen usando el
    proveedor integrado. Consulte [Entorno SDK de Copilot](/es/plugins/copilot) para conocer el contrato
    completo del entorno de ejecución.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use la extensión **Copilot Proxy** de VS Code como puente local. OpenClaw se comunica con
    el endpoint `/v1` del proxy (valor predeterminado: `http://localhost:3000/v1`) y usa la
    lista de modelos que configure.

    El Plugin `copilot-proxy` se incluye con OpenClaw y está habilitado de forma predeterminada.
    Configure la URL base y los identificadores de modelo con:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Elija esta opción si ya ejecuta Copilot Proxy en VS Code o necesita enrutar
    las solicitudes a través de él. La extensión de VS Code debe permanecer en ejecución.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residencia de datos)

Si su organización usa un tenant de GitHub Enterprise con residencia de datos (un
host `*.ghe.com` como `your-org.ghe.com`), Copilot reside en endpoints locales del tenant
en lugar del `github.com` público. OpenClaw ofrece esta opción de
autenticación de forma nativa para que no sea necesario editar manualmente las URL.

<Steps>
  <Step title="Elegir la opción de autenticación de Enterprise">
    Durante la incorporación o en `openclaw models auth`, elija
    **GitHub Copilot (Enterprise / data residency)**. Se le solicitará
    el dominio de Enterprise (por ejemplo, `your-org.ghe.com`) y, después, el inicio de sesión
    mediante dispositivo se ejecutará en ese tenant.

    Introduzca únicamente la raíz del tenant (`your-org.ghe.com`). No se aceptan hosts de servicio derivados
    como `api.your-org.ghe.com` o `copilot-api.your-org.ghe.com`;
    OpenClaw deriva automáticamente esos endpoints a partir de la raíz del tenant.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="El dominio se conserva en la configuración">
    El host elegido se almacena en los parámetros del proveedor para que las posteriores renovaciones de tokens
    y finalizaciones se dirijan automáticamente al tenant:

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

El flujo mediante dispositivo, el intercambio de tokens y las finalizaciones se resuelven respectivamente en
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` y
`https://copilot-api.your-org.ghe.com`. Los tokens de residencia de datos incluyen
una marca del tenant y ninguna indicación de proxy, por lo que la URL base de las finalizaciones recurre al
host de Copilot del tenant en lugar de al endpoint público.

<Note>
Al cambiar de dominio, siempre se vuelve a ejecutar el inicio de sesión mediante dispositivo. Si ya tiene almacenado
un token de Copilot y elige un dominio distinto (`github.com` público ↔ un tenant `*.ghe.com`,
o de un tenant a otro), OpenClaw no reutilizará el token existente:
forzará un nuevo inicio de sesión para que el ámbito del token corresponda al dominio que se escribirá en la
configuración. Al volver a iniciar sesión en el *mismo* dominio, seguirá ofreciéndose la posibilidad de reutilizar el token
actual. Al volver al `github.com` público, se elimina el
`githubDomain` conservado para que la configuración vuelva al valor predeterminado.
</Note>

<Note>
La variable de entorno `COPILOT_GITHUB_DOMAIN` reemplaza el dominio resuelto
en todas las rutas de Copilot que lo resuelven: el inicio de sesión mediante dispositivo de Enterprise
(`--method device-enterprise`), el acceso directo independiente
`openclaw models auth login-github-copilot`, la renovación de tokens, las incrustaciones
y las finalizaciones. Establézcala en su host `*.ghe.com` para configuraciones totalmente
sin interfaz o de CI. Déjela sin establecer (y sin el parámetro de configuración) para usar el `github.com` público.
Los inicios de sesión conservan el dominio para el que emitieron el token (y lo eliminan al iniciar
sesión en el `github.com` público), por lo que el enrutamiento sigue siendo correcto incluso después de
eliminar la variable de entorno.
</Note>

## Indicadores opcionales

| Comando                                                                | Indicador       | Descripción                                                   |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Sobrescribe un perfil de autenticación existente sin preguntar |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | También aplica el modelo predeterminado recomendado por el proveedor |

```bash
# Omitir la confirmación para volver a iniciar sesión
openclaw models auth login-github-copilot --yes

# Iniciar sesión y establecer el modelo predeterminado en un solo paso
openclaw models auth login --provider github-copilot --method device --set-default
```

## Incorporación no interactiva

El flujo de inicio de sesión mediante dispositivo requiere una TTY interactiva. Para una configuración sin interfaz, importe
un token de acceso OAuth de GitHub existente con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

También puede omitir `--auth-choice`; proporcionar `--github-copilot-token` permite inferir la
opción de autenticación del proveedor GitHub Copilot. Si se omite el indicador, la incorporación
recurre sucesivamente a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` y `GITHUB_TOKEN`. Use
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` establecido para almacenar un
`tokenRef` respaldado por una variable de entorno en lugar de texto sin formato en `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Se requiere una TTY interactiva">
    El flujo de inicio de sesión mediante dispositivo requiere una TTY interactiva. Ejecútelo directamente en una
    terminal, no en un script no interactivo ni en una Pipeline de CI.
  </Accordion>

  <Accordion title="La disponibilidad de los modelos depende de su plan">
    La disponibilidad de los modelos de Copilot depende de su plan de GitHub. Si se
    rechaza un modelo, pruebe otro identificador (por ejemplo, `github-copilot/gpt-5.5`). Consulte los
    [modelos compatibles por plan de Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    de GitHub para ver la lista actual de modelos.
  </Accordion>

  <Accordion title="Actualización en tiempo real del catálogo desde la API de Copilot">
    Una vez que la ruta de autenticación mediante inicio de sesión en el dispositivo (o variable de entorno) haya resuelto un token de GitHub,
    OpenClaw actualiza bajo demanda el catálogo de modelos desde `${baseUrl}/models`
    (el mismo endpoint que usa Copilot en VS Code) para que el entorno de ejecución refleje
    los derechos de cada cuenta y las ventanas de contexto correctas sin modificar
    continuamente el manifiesto. Los modelos de Copilot recién publicados pasan a estar visibles sin necesidad de
    actualizar OpenClaw, y las ventanas de contexto reflejan los límites reales de cada modelo
    (p. ej., 400k para la serie gpt-5.x y 1M para las variantes internas
    `claude-opus-*-1m`).

    El catálogo estático incluido permanece como alternativa visible cuando la detección
    está deshabilitada, el usuario no tiene un perfil de autenticación de GitHub, falla el intercambio
    de tokens o se produce un error en la llamada HTTPS `/models`. Para desactivar esta función y depender por completo
    del catálogo estático del manifiesto (situaciones sin conexión o con aislamiento de red):

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
    Los identificadores de modelos Claude usan automáticamente el transporte Anthropic Messages.
    Los modelos Gemini usan el transporte OpenAI Chat Completions; los modelos GPT y de la serie o
    mantienen el transporte OpenAI Responses. OpenClaw selecciona el transporte correcto
    según la referencia del modelo.
  </Accordion>

  <Accordion title="Compatibilidad de las solicitudes">
    OpenClaw envía encabezados de solicitud al estilo de Copilot IDE en los transportes de Copilot
    (versiones del editor/Plugin de VS Code y el identificador de integración `vscode-chat`),
    marca como iniciados por el agente los turnos de seguimiento de resultados de herramientas y establece el encabezado de
    visión de Copilot cuando un turno incluye una imagen como entrada.
  </Accordion>

  <Accordion title="Orden de resolución de las variables de entorno">
    OpenClaw resuelve la autenticación de Copilot a partir de variables de entorno en el siguiente
    orden de prioridad:

    | Prioridad | Variable              | Notas                                    |
    | --------- | --------------------- | ---------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Máxima prioridad, específica de Copilot |
    | 2         | `GH_TOKEN`            | Token de la CLI de GitHub (alternativa) |
    | 3         | `GITHUB_TOKEN`        | Token estándar de GitHub (prioridad mínima) |

    Cuando se establecen varias variables, OpenClaw usa la que tenga mayor prioridad.
    El flujo de inicio de sesión mediante dispositivo (`openclaw models auth login-github-copilot`) almacena
    su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables de
    entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación (identificador de perfil
    `github-copilot:github`) y lo intercambia por un token de la API de Copilot
    de corta duración cuando se ejecuta OpenClaw. No es necesario administrar el token manualmente.
  </Accordion>
</AccordionGroup>

## Incrustaciones para la búsqueda en memoria

GitHub Copilot también puede actuar como proveedor de incrustaciones para la
[búsqueda en memoria](/es/concepts/memory-search). Si tiene una suscripción a Copilot y
ha iniciado sesión, OpenClaw puede usarlo para generar incrustaciones sin una clave de API independiente.

### Configuración

Establezca `memory.search.provider` explícitamente para usar las incrustaciones de GitHub Copilot. Si hay
un token de GitHub disponible, OpenClaw detecta los modelos de incrustaciones disponibles en
la API de Copilot y elige automáticamente el mejor.

```json5
{
  memory: {
    search: {
      provider: "github-copilot",
      // Opcional: reemplazar el modelo detectado automáticamente
      model: "text-embedding-3-small",
    },
  },
}
```

### Funcionamiento

1. OpenClaw resuelve su token de GitHub (a partir de variables de entorno o del perfil de autenticación).
2. Lo intercambia por un token de la API de Copilot de corta duración.
3. Consulta el endpoint `/models` de Copilot para detectar los modelos de incrustaciones disponibles.
4. Elige el mejor modelo (orden de preferencia: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Envía solicitudes de incrustaciones al endpoint `/embeddings` de Copilot.

La disponibilidad de los modelos depende de su plan de GitHub. Si no hay modelos de incrustaciones
disponibles, OpenClaw omite Copilot y prueba el siguiente proveedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
