---
read_when:
    - Estás creando una nueva habilidad personalizada
    - Necesitas un flujo de trabajo inicial rápido para Skills basadas en SKILL.md
    - Quieres usar Skill Workshop para proponer una habilidad para la revisión por parte de un agente
sidebarTitle: Creating skills
summary: Crea, prueba y publica habilidades de espacio de trabajo SKILL.md personalizadas para tus agentes de OpenClaw.
title: Creación de Skills
x-i18n:
    generated_at: "2026-06-27T13:02:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills enseña al agente cómo y cuándo usar herramientas. Cada habilidad es un directorio
que contiene un archivo `SKILL.md` con frontmatter YAML e instrucciones en markdown.
OpenClaw carga Skills desde varias raíces en un [orden de precedencia](/es/tools/skills#loading-order) definido.

## Crea tu primera habilidad

<Steps>
  <Step title="Crea el directorio de la habilidad">
    Skills reside en la carpeta `skills/` de tu espacio de trabajo. Crea un directorio para tu
    nueva habilidad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Puedes agrupar habilidades en subcarpetas para organizarlas; la habilidad sigue
    recibiendo su nombre del frontmatter de `SKILL.md`, no de la ruta de la carpeta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Escribe SKILL.md">
    Crea `SKILL.md` dentro del directorio. El frontmatter define los metadatos;
    el cuerpo proporciona instrucciones al agente.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Reglas de nomenclatura:
    - Usa letras minúsculas, dígitos y guiones para `name`.
    - Mantén alineados el nombre del directorio y el `name` del frontmatter.
    - `description` se muestra al agente y en la detección de comandos de barra;
      mantenlo en una sola línea y con menos de 160 caracteres.

  </Step>

  <Step title="Verifica que la habilidad se haya cargado">
    ```bash
    openclaw skills list
    ```

    OpenClaw observa de forma predeterminada los archivos `SKILL.md` bajo las raíces de Skills. Si el
    observador está deshabilitado o estás continuando una sesión existente, inicia una
    nueva para que el agente reciba la lista actualizada:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Pruébala">
    Envía un mensaje que debería activar la habilidad:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    O abre un chat y pregúntale directamente al agente. Usa `/skill hello-world` para
    invocarla explícitamente por nombre.

  </Step>
</Steps>

## Referencia de SKILL.md

### Campos obligatorios

| Campo         | Descripción                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | Slug único que usa letras minúsculas, dígitos y guiones        |
| `description` | Descripción de una línea que se muestra al agente y en la salida de detección |

### Claves opcionales de frontmatter

| Campo                      | Valor predeterminado | Descripción                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Expone la habilidad como un comando de barra de usuario                                         |
| `disable-model-invocation` | `false` | Mantiene la habilidad fuera del prompt del sistema del agente (aun así se ejecuta mediante `/skill`)        |
| `command-dispatch`         | —       | Establécelo en `tool` para enrutar el comando de barra directamente a una herramienta, omitiendo el modelo |
| `command-tool`             | —       | Nombre de la herramienta que se invoca cuando `command-dispatch: tool` está establecido                         |
| `command-arg-mode`         | `raw`   | Para el despacho de herramientas, reenvía la cadena de argumentos sin procesar a la herramienta                      |
| `homepage`                 | —       | URL que se muestra como "Sitio web" en la interfaz de Skills de macOS                                    |

Para los campos de control (`requires.bins`, `requires.env`, etc.), consulta
[Skills — Control](/es/tools/skills#gating).

### Uso de `{baseDir}`

Usa `{baseDir}` en el cuerpo de la habilidad para hacer referencia a archivos dentro del directorio
de la habilidad sin codificar rutas de forma fija:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Agregar activación condicional

Controla tu habilidad para que solo se cargue cuando sus dependencias estén disponibles:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opciones de control">
    | Clave | Descripción |
    | --- | --- |
    | `requires.bins` | Todos los binarios deben existir en `PATH` |
    | `requires.anyBins` | Al menos un binario debe existir en `PATH` |
    | `requires.env` | Cada variable de entorno debe existir en el proceso o la configuración |
    | `requires.config` | Cada ruta de `openclaw.json` debe ser verdadera |
    | `os` | Filtro de plataforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Establécelo en `true` para omitir todos los controles e incluir siempre la habilidad |

    Referencia completa: [Skills — Control](/es/tools/skills#gating).

  </Accordion>
  <Accordion title="Entorno y claves de API">
    Vincula una clave de API a una entrada de habilidad en `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    La clave se inyecta en el proceso host solo para ese turno del agente.
    No llega al sandbox; consulta
    [variables de entorno en sandbox](/es/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponer mediante Skill Workshop

Para habilidades redactadas por agentes o cuando quieras una revisión del operador antes de que una habilidad entre
en producción, usa propuestas de [Skill Workshop](/es/tools/skill-workshop) en lugar de escribir
`SKILL.md` directamente.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Usa `--proposal-dir` cuando la propuesta incluya archivos de apoyo:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

El directorio debe contener `PROPOSAL.md`. Los archivos de apoyo pueden ir en `assets/`,
`examples/`, `references/`, `scripts/` o `templates/`.

Después de la revisión:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/es/tools/skill-workshop) para ver el ciclo de vida completo de las propuestas.

## Publicar en ClawHub

<Steps>
  <Step title="Asegúrate de que tu SKILL.md esté completo">
    Asegúrate de que `name`, `description` y cualquier campo de control `metadata.openclaw`
    estén establecidos. Agrega una URL `homepage` si tienes una página del proyecto.
  </Step>
  <Step title="Instala la habilidad de ClawHub">
    La habilidad de ClawHub documenta la forma actual del comando de publicación y los metadatos
    obligatorios:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publica">
    ```bash
    clawhub publish
    ```

    Consulta [ClawHub — Publicación](/es/clawhub/publishing) para ver el flujo completo.

  </Step>
</Steps>

## Prácticas recomendadas

<Tip>
  - **Sé conciso**: indica al modelo *qué* hacer, no cómo ser una IA.
  - **La seguridad primero**: si tu habilidad usa `exec`, asegúrate de que los prompts no permitan
    la inyección arbitraria de comandos desde entradas no confiables.
  - **Prueba localmente**: usa `openclaw agent --message "..."` antes de compartir.
  - **Usa ClawHub**: explora habilidades de la comunidad en [clawhub.ai](https://clawhub.ai)
    antes de crear algo desde cero.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Orden de carga, control, listas de permisos y formato de SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para habilidades redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración `skills.*`.
  </Card>
  <Card title="ClawHub" href="/es/clawhub" icon="cloud">
    Explora y publica habilidades en el registro público.
  </Card>
  <Card title="Crear plugins" href="/es/plugins/building-plugins" icon="plug">
    Los Plugins pueden distribuir habilidades junto con las herramientas que documentan.
  </Card>
</CardGroup>
