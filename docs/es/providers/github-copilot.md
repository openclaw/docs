---
read_when:
    - Quieres usar GitHub Copilot como proveedor de modelos
    - Necesitas el flujo `openclaw models auth login-github-copilot`
summary: Inicia sesión en GitHub Copilot desde OpenClaw usando el flujo de dispositivo o la importación de token no interactiva
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T05:57:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot es el asistente de codificación con IA de GitHub. Proporciona acceso a los modelos de Copilot para tu cuenta y plan de GitHub. OpenClaw puede usar Copilot como proveedor de modelos de dos maneras diferentes.

## Dos formas de usar Copilot en OpenClaw

<Tabs>
  <Tab title="Proveedor integrado (github-copilot)">
    Usa el flujo nativo de inicio de sesión del dispositivo para obtener un token de GitHub y luego intercambiarlo por tokens de la API de Copilot cuando se ejecute OpenClaw. Esta es la ruta **predeterminada** y más sencilla porque no requiere VS Code.

    <Steps>
      <Step title="Ejecutar el comando de inicio de sesión">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Se te pedirá que visites una URL e introduzcas un código de un solo uso. Mantén la terminal abierta hasta que se complete.
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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa la extensión **Copilot Proxy** de VS Code como puente local. OpenClaw se comunica con el endpoint `/v1` del proxy y usa la lista de modelos que configures allí.

    <Note>
    Elige esto cuando ya ejecutes Copilot Proxy en VS Code o necesites enrutar a través de él. Debes habilitar el Plugin y mantener en ejecución la extensión de VS Code.
    </Note>

  </Tab>
</Tabs>

## Indicadores opcionales

| Indicador       | Descripción                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Omitir la solicitud de confirmación                 |
| `--set-default` | Aplicar también el modelo predeterminado recomendado del proveedor |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Incorporación no interactiva

Si ya tienes un token de acceso OAuth de GitHub para Copilot, impórtalo durante la configuración sin interfaz con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

También puedes omitir `--auth-choice`; pasar `--github-copilot-token` infiere la opción de autenticación del proveedor GitHub Copilot. Si se omite el indicador, la incorporación recurre a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` y luego `GITHUB_TOKEN`. Usa `--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` configurado para almacenar un `tokenRef` respaldado por entorno en lugar de texto sin formato en `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interactiva requerida">
    El flujo de inicio de sesión del dispositivo requiere una TTY interactiva. Ejecútalo directamente en una terminal, no en un script no interactivo ni en una canalización de CI.
  </Accordion>

  <Accordion title="La disponibilidad de modelos depende de tu plan">
    La disponibilidad de modelos de Copilot depende de tu plan de GitHub. Si se rechaza un modelo, prueba con otro ID (por ejemplo, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selección de transporte">
    Los ID de modelo de Claude usan automáticamente el transporte Anthropic Messages. Los modelos GPT, o-series y Gemini mantienen el transporte OpenAI Responses. OpenClaw selecciona el transporte correcto según la referencia del modelo.
  </Accordion>

  <Accordion title="Compatibilidad de solicitudes">
    OpenClaw envía encabezados de solicitud de estilo IDE de Copilot en los transportes de Copilot, incluidos los turnos integrados de Compaction, resultados de herramientas y seguimiento de imágenes. No habilita la continuación de Responses a nivel de proveedor para Copilot a menos que ese comportamiento se haya verificado con la API de Copilot.
  </Accordion>

  <Accordion title="Orden de resolución de variables de entorno">
    OpenClaw resuelve la autenticación de Copilot desde variables de entorno en el siguiente orden de prioridad:

    | Prioridad | Variable              | Notas                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Prioridad máxima, específica de Copilot |
    | 2        | `GH_TOKEN`            | Token de GitHub CLI (reserva)    |
    | 3        | `GITHUB_TOKEN`        | Token estándar de GitHub (mínima) |

    Cuando se configuran varias variables, OpenClaw usa la de mayor prioridad. El flujo de inicio de sesión del dispositivo (`openclaw models auth login-github-copilot`) almacena su token en el almacén de perfiles de autenticación y tiene prioridad sobre todas las variables de entorno.

  </Accordion>

  <Accordion title="Almacenamiento de tokens">
    El inicio de sesión almacena un token de GitHub en el almacén de perfiles de autenticación y lo intercambia por un token de la API de Copilot cuando se ejecuta OpenClaw. No necesitas administrar el token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
El comando de inicio de sesión del dispositivo requiere una TTY interactiva. Usa la incorporación no interactiva cuando necesites una configuración sin interfaz.
</Warning>

## Embeddings de búsqueda de memoria

GitHub Copilot también puede servir como proveedor de embeddings para la [búsqueda de memoria](/es/concepts/memory-search). Si tienes una suscripción a Copilot y has iniciado sesión, OpenClaw puede usarlo para embeddings sin una clave de API independiente.

### Detección automática

Cuando `memorySearch.provider` es `"auto"` (el valor predeterminado), GitHub Copilot se prueba con prioridad 15, después de los embeddings locales pero antes de OpenAI y otros proveedores de pago. Si hay un token de GitHub disponible, OpenClaw descubre los modelos de embedding disponibles desde la API de Copilot y elige automáticamente el mejor.

### Configuración explícita

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
3. Consulta el endpoint `/models` de Copilot para descubrir los modelos de embedding disponibles.
4. Elige el mejor modelo (prefiere `text-embedding-3-small`).
5. Envía solicitudes de embedding al endpoint `/embeddings` de Copilot.

La disponibilidad de modelos depende de tu plan de GitHub. Si no hay modelos de embedding disponibles, OpenClaw omite Copilot y prueba el siguiente proveedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
