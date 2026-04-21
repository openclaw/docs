---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos
    - Necesitas el flujo `openclaw models auth login-github-copilot`
summary: Inicia sesión en GitHub Copilot desde OpenClaw usando el flujo de dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T05:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot es el asistente de programación con IA de GitHub. Proporciona acceso a
modelos de Copilot para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor
de modelos de dos formas diferentes.

## Dos formas de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Usa el flujo nativo de inicio de sesión por dispositivo para obtener un token de GitHub y luego intercambiarlo por
    tokens de la API de Copilot cuando OpenClaw se ejecute. Esta es la ruta **predeterminada** y más simple
    porque no requiere VS Code.

    <Steps>
      <Step title="Ejecuta el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá que visites una URL e introduzcas un código de un solo uso. Mantén la
        terminal abierta hasta que termine.
      </Step>
      <Step title="Establece un modelo predeterminado">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        O en la configuración:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa la extensión de VS Code **Copilot Proxy** como puente local. OpenClaw se comunica con
    el endpoint `/v1` del proxy y usa la lista de modelos que configures allí.

    <Note>
    Elige esto cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar
    a través de él. Debes habilitar el Plugin y mantener la extensión de VS Code en ejecución.
    </Note>

  </Tab>
</Tabs>

## Indicadores opcionales

| Indicador      | Descripción                                             |
| -------------- | ------------------------------------------------------- |
| `--yes`        | Omite la solicitud de confirmación                      |
| `--set-default` | También aplica el modelo predeterminado recomendado del proveedor |

```bash
# Omitir confirmación
openclaw models auth login-github-copilot --yes

# Iniciar sesión y establecer el modelo predeterminado en un solo paso
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Se requiere TTY interactivo">
    El flujo de inicio de sesión por dispositivo requiere un TTY interactivo. Ejecútalo directamente en una
    terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="La disponibilidad de modelos depende de tu plan">
    La disponibilidad de modelos de Copilot depende de tu plan de GitHub. Si se
    rechaza un modelo, prueba otro ID (por ejemplo `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selección de transporte">
    Los IDs de modelo Claude usan automáticamente el transporte Anthropic Messages. GPT,
    los modelos de la serie o y Gemini mantienen el transporte OpenAI Responses. OpenClaw
    selecciona el transporte correcto según la referencia del modelo.
  </Accordion>

  <Accordion title="Orden de resolución de variables de entorno">
    OpenClaw resuelve la autenticación de Copilot desde variables de entorno en el siguiente
    orden de prioridad:

    | Prioridad | Variable               | Notas                                 |
    | --------- | ---------------------- | ------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Máxima prioridad, específica de Copilot |
    | 2         | `GH_TOKEN`             | Token de GitHub CLI (respaldo)        |
    | 3         | `GITHUB_TOKEN`         | Token estándar de GitHub (mínima prioridad) |

    Cuando se establecen varias variables, OpenClaw usa la de mayor prioridad.
    El flujo de inicio de sesión por dispositivo (`openclaw models auth login-github-copilot`) almacena
    su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables de entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación y lo intercambia
    por un token de la API de Copilot cuando OpenClaw se ejecuta. No necesitas gestionar el
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Requiere un TTY interactivo. Ejecuta el comando de inicio de sesión directamente en una terminal, no
dentro de un script sin interfaz o un trabajo de CI.
</Warning>

## Embeddings de búsqueda de memoria

GitHub Copilot también puede servir como proveedor de embeddings para
[búsqueda de memoria](/es/concepts/memory-search). Si tienes una suscripción a Copilot y
has iniciado sesión, OpenClaw puede usarlo para embeddings sin una clave API independiente.

### Detección automática

Cuando `memorySearch.provider` es `"auto"` (el valor predeterminado), GitHub Copilot se prueba
con prioridad 15, después de los embeddings locales pero antes de OpenAI y otros
proveedores de pago. Si hay un token de GitHub disponible, OpenClaw descubre los modelos de
embeddings disponibles desde la API de Copilot y elige automáticamente el mejor.

### Configuración explícita

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcional: sobrescribir el modelo detectado automáticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cómo funciona

1. OpenClaw resuelve tu token de GitHub (desde variables de entorno o perfil de autenticación).
2. Lo intercambia por un token de la API de Copilot de corta duración.
3. Consulta el endpoint `/models` de Copilot para descubrir los modelos de embeddings disponibles.
4. Elige el mejor modelo (prefiere `text-embedding-3-small`).
5. Envía solicitudes de embeddings al endpoint `/embeddings` de Copilot.

La disponibilidad de modelos depende de tu plan de GitHub. Si no hay modelos de embeddings
disponibles, OpenClaw omite Copilot y prueba el siguiente proveedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
