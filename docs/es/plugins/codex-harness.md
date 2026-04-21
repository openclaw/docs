---
read_when:
    - Quieres usar el arnés app-server de Codex incluido en el paquete
    - Necesitas referencias de modelos de Codex y ejemplos de configuración
    - Quieres deshabilitar el fallback de PI para despliegues solo de Codex
summary: Ejecuta turnos de agente integrados de OpenClaw a través del arnés app-server de Codex incluido en el paquete
title: Arnés de Codex
x-i18n:
    generated_at: "2026-04-21T05:16:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Arnés de Codex

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del app-server de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex se encargue de la sesión de agente de bajo nivel: descubrimiento de modelos, reanudación nativa de hilos, Compaction nativa y ejecución en app-server.
OpenClaw sigue controlando los canales de chat, los archivos de sesión, la selección de modelos, las herramientas, las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

El arnés está desactivado por defecto. Solo se selecciona cuando el plugin `codex` está habilitado y el modelo resuelto es un modelo `codex/*`, o cuando fuerzas explícitamente `embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.
Si nunca configuras `codex/*`, las ejecuciones existentes de PI, OpenAI, Anthropic, Gemini, locales y de proveedores personalizados mantienen su comportamiento actual.

## Elige el prefijo de modelo correcto

OpenClaw tiene rutas separadas para acceso con forma de OpenAI y de Codex:

| Ref de modelo         | Ruta de runtime                               | Úsalo cuando                                                            |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Proveedor OpenAI mediante la plomería de OpenClaw/PI | Quieres acceso directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Proveedor OAuth de OpenAI Codex a través de PI | Quieres OAuth de ChatGPT/Codex sin el arnés app-server de Codex.        |
| `codex/gpt-5.4`       | Proveedor Codex incluido más arnés de Codex   | Quieres ejecución nativa de app-server de Codex para el turno de agente integrado. |

El arnés de Codex solo reclama refs de modelo `codex/*`. Las refs existentes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, locales y de proveedores personalizados mantienen sus rutas normales.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.118.0` o posterior.
- Autenticación de Codex disponible para el proceso del app-server.

El plugin bloquea handshakes de app-server más antiguos o sin versión. Eso mantiene
a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación normalmente proviene de `OPENAI_API_KEY`, además de archivos opcionales de CLI de Codex como `~/.codex/auth.json` y `~/.codex/config.toml`. Usa el mismo material de autenticación que use tu app-server local de Codex.

## Configuración mínima

Usa `codex/gpt-5.4`, habilita el plugin incluido y fuerza el arnés `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Si tu configuración usa `plugins.allow`, incluye también `codex` allí:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Configurar `agents.defaults.model` o un modelo de agente en `codex/<model>` también habilita automáticamente el plugin `codex` incluido. La entrada explícita del plugin sigue siendo útil en configuraciones compartidas porque hace evidente la intención del despliegue.

## Agregar Codex sin reemplazar otros modelos

Mantén `runtime: "auto"` cuando quieras Codex para modelos `codex/*` y PI para todo lo demás:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Con esta forma:

- `/model codex` o `/model codex/gpt-5.4` usa el arnés app-server de Codex.
- `/model gpt` o `/model openai/gpt-5.4` usa la ruta del proveedor OpenAI.
- `/model opus` usa la ruta del proveedor Anthropic.
- Si se selecciona un modelo que no sea Codex, PI sigue siendo el arnés de compatibilidad.

## Despliegues solo de Codex

Deshabilita el fallback de PI cuando necesites demostrar que cada turno de agente integrado usa el arnés de Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Sobrescritura por variable de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el fallback deshabilitado, OpenClaw falla pronto si el plugin Codex está deshabilitado,
si el modelo solicitado no es una ref `codex/*`, si el app-server es demasiado antiguo o si el app-server no puede iniciarse.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado mantiene la selección automática normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa comandos de sesión normales para cambiar de agente y de modelo. `/new` crea una sesión nueva de OpenClaw y el arnés de Codex crea o reanuda su hilo sidecar de app-server según sea necesario. `/reset` borra el binding de sesión de OpenClaw para ese hilo.

## Descubrimiento de modelos

Por defecto, el plugin Codex consulta al app-server por los modelos disponibles. Si el descubrimiento falla o agota el tiempo, usa el catálogo fallback incluido:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Puedes ajustar el descubrimiento en `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se quede con el catálogo fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Conexión y política del app-server

Por defecto, el plugin inicia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Por defecto, OpenClaw le pide a Codex que solicite aprobaciones nativas. Puedes ajustar más esa
política, por ejemplo endureciéndola y enrutando las revisiones a través de guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Para un app-server ya en ejecución, usa transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` compatibles:

| Campo               | Predeterminado                              | Significado                                                              |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                   | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                |
| `command`           | `"codex"`                                   | Ejecutable para transporte stdio.                                        |
| `args`              | `["app-server", "--listen", "stdio://"]`    | Argumentos para transporte stdio.                                        |
| `url`               | sin configurar                              | URL del app-server WebSocket.                                            |
| `authToken`         | sin configurar                              | Token Bearer para transporte WebSocket.                                  |
| `headers`           | `{}`                                        | Encabezados WebSocket adicionales.                                       |
| `requestTimeoutMs`  | `60000`                                     | Tiempo de espera para llamadas del plano de control al app-server.       |
| `approvalPolicy`    | `"on-request"`                              | Política de aprobación nativa de Codex enviada al inicio/reanudación/turno del hilo. |
| `sandbox`           | `"workspace-write"`                         | Modo sandbox nativo de Codex enviado al inicio/reanudación del hilo.     |
| `approvalsReviewer` | `"user"`                                    | Usa `"guardian_subagent"` para que Codex guardian revise aprobaciones nativas. |
| `serviceTier`       | sin configurar                              | Nivel de servicio opcional de Codex, por ejemplo `"priority"`.           |

Las variables de entorno anteriores siguen funcionando como fallback para pruebas locales cuando el campo de configuración correspondiente no está configurado:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Se prefiere la configuración para despliegues reproducibles.

## Recetas comunes

Codex local con transporte stdio predeterminado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validación de arnés solo Codex, con fallback de PI deshabilitado:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Aprobaciones de Codex revisadas por guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con encabezados explícitos:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

El cambio de modelos sigue estando controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta a un hilo de Codex existente, el siguiente turno vuelve a enviar al app-server el modelo `codex/*`, proveedor, política de aprobación, sandbox y nivel de servicio seleccionados actualmente. Cambiar de `codex/gpt-5.4` a `codex/gpt-5.2` mantiene el binding del hilo, pero le pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como comando con barra autorizado. Es genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad en vivo del app-server, modelos, cuenta, límites de tasa, servidores MCP y Skills.
- `/codex models` lista los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` le pide al app-server de Codex que haga Compaction del hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

`/codex resume` escribe el mismo archivo de binding sidecar que usa el arnés para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo `codex/*` de OpenClaw actualmente seleccionado al app-server y mantiene
habilitado el historial extendido.

La superficie de comandos requiere app-server de Codex `0.118.0` o posterior. Los métodos de
control individuales se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Herramientas, medios y Compaction

El arnés de Codex solo cambia el ejecutor integrado de agente de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados dinámicos de herramientas desde el
arnés. El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de
herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw.

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa del hilo se
delega al app-server de Codex. OpenClaw conserva un espejo de la transcripción para
el historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o
de arnés. El espejo incluye el prompt del usuario, el texto final del asistente y
registros livianos de razonamiento o plan de Codex cuando el app-server los emite.

La generación de medios no requiere PI. La generación de imágenes, video, música, PDF, TTS y la
comprensión de medios siguen usando la configuración correspondiente de proveedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece en `/model`:** habilita `plugins.entries.codex.enabled`,
configura una ref de modelo `codex/*` o verifica si `plugins.allow` excluye `codex`.

**OpenClaw vuelve a PI como fallback:** configura `embeddedHarness.fallback: "none"` o
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` mientras haces pruebas.

**Se rechaza el app-server:** actualiza Codex para que el handshake del app-server
informe la versión `0.118.0` o posterior.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita el descubrimiento.

**El transporte WebSocket falla inmediatamente:** verifica `appServer.url`, `authToken`
y que el app-server remoto hable la misma versión de protocolo de app-server de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado. El arnés de Codex solo reclama
refs de modelo `codex/*`.

## Relacionado

- [Agent Harness Plugins](/es/plugins/sdk-agent-harness)
- [Model Providers](/es/concepts/model-providers)
- [Configuration Reference](/es/gateway/configuration-reference)
- [Testing](/es/help/testing#live-codex-app-server-harness-smoke)
