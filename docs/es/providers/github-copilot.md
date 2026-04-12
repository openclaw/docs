---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos
    - Necesitas el flujo `openclaw models auth login-github-copilot`
summary: Inicia sesión en GitHub Copilot desde OpenClaw mediante el flujo de dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a
modelos de Copilot para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como
proveedor de modelos de dos formas diferentes.

## Dos formas de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Usa el flujo nativo de inicio de sesión por dispositivo para obtener un token de GitHub y luego intercambiarlo por
    tokens de API de Copilot cuando OpenClaw se ejecute. Esta es la ruta **predeterminada** y más sencilla
    porque no requiere VS Code.

    <Steps>
      <Step title="Ejecutar el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá que visites una URL e introduzcas un código de un solo uso. Mantén la
        terminal abierta hasta que se complete.
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        O en la configuración:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa la extensión de VS Code **Copilot Proxy** como un puente local. OpenClaw se comunica con
    el endpoint `/v1` del proxy y usa la lista de modelos que configures allí.

    <Note>
    Elige esta opción cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar
    a través de él. Debes habilitar el Plugin y mantener la extensión de VS Code en ejecución.
    </Note>

  </Tab>
</Tabs>

## Indicadores opcionales

| Flag            | Description                                              |
| --------------- | -------------------------------------------------------- |
| `--yes`         | Omitir la solicitud de confirmación                      |
| `--set-default` | Aplicar también el modelo predeterminado recomendado del proveedor |

```bash
# Omitir la confirmación
openclaw models auth login-github-copilot --yes

# Iniciar sesión y establecer el modelo predeterminado en un solo paso
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Se requiere un TTY interactivo">
    El flujo de inicio de sesión por dispositivo requiere un TTY interactivo. Ejecútalo directamente en una
    terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="La disponibilidad de modelos depende de tu plan">
    La disponibilidad de los modelos de Copilot depende de tu plan de GitHub. Si un modelo es
    rechazado, prueba con otro ID (por ejemplo, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selección de transporte">
    Los ID de modelos Claude usan automáticamente el transporte Anthropic Messages. Los modelos GPT,
    o-series y Gemini mantienen el transporte OpenAI Responses. OpenClaw
    selecciona el transporte correcto en función de la referencia del modelo.
  </Accordion>

  <Accordion title="Orden de resolución de variables de entorno">
    OpenClaw resuelve la autenticación de Copilot a partir de variables de entorno en el siguiente
    orden de prioridad:

    | Priority | Variable               | Notes                                 |
    | -------- | ---------------------- | ------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Máxima prioridad, específica de Copilot |
    | 2        | `GH_TOKEN`             | Token de GitHub CLI (respaldo)        |
    | 3        | `GITHUB_TOKEN`         | Token estándar de GitHub (prioridad más baja) |

    Cuando hay varias variables configuradas, OpenClaw usa la de mayor prioridad.
    El flujo de inicio de sesión por dispositivo (`openclaw models auth login-github-copilot`) almacena
    su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables
    de entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación y lo intercambia
    por un token de API de Copilot cuando OpenClaw se ejecuta. No necesitas gestionar el
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Requiere un TTY interactivo. Ejecuta el comando de inicio de sesión directamente en una terminal, no
dentro de un script sin interfaz o un trabajo de CI.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
