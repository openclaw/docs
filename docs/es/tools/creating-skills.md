---
read_when:
    - Estás creando una nueva habilidad personalizada
    - Necesitas un flujo de trabajo inicial rápido para Skills basadas en SKILL.md
    - Quieres usar Skill Workshop para proponer una Skill para la revisión por parte de un agente
sidebarTitle: Creating skills
summary: Crea, prueba y publica Skills de espacio de trabajo personalizadas mediante SKILL.md para tus agentes de OpenClaw.
title: Creación de Skills
x-i18n:
    generated_at: "2026-07-11T23:33:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills enseña al agente cómo y cuándo usar herramientas. Cada habilidad es un directorio
que contiene un archivo `SKILL.md` con frontmatter YAML e instrucciones en Markdown.
OpenClaw carga las habilidades desde varias ubicaciones raíz según un [orden de precedencia](/es/tools/skills#loading-order) definido.

## Crea tu primera habilidad

<Steps>
  <Step title="Create the skill directory">
    Las habilidades se encuentran en la carpeta `skills/` de tu espacio de trabajo:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Puedes agrupar las habilidades en subcarpetas para organizarlas; la habilidad sigue
    recibiendo su nombre del frontmatter de `SKILL.md`, no de la ruta de la carpeta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    El frontmatter define los metadatos; el cuerpo proporciona instrucciones al agente.

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
    - Mantén alineados el nombre del directorio y el valor `name` del frontmatter.
    - `description` se muestra al agente y durante el descubrimiento de comandos con barra;
      debe ocupar una sola línea y tener menos de 160 caracteres.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    De forma predeterminada, OpenClaw supervisa los archivos `SKILL.md` situados bajo las
    ubicaciones raíz de habilidades. Si el supervisor está desactivado o continúas una
    sesión existente, inicia una nueva para que el agente reciba la lista actualizada:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    También puedes abrir un chat y pedírselo directamente al agente. Usa `/skill hello-world`
    para invocarla explícitamente por su nombre.

  </Step>
</Steps>

## Referencia de SKILL.md

### Campos obligatorios

| Campo         | Descripción                                                              |
| ------------- | ------------------------------------------------------------------------ |
| `name`        | Identificador único con letras minúsculas, dígitos y guiones             |
| `description` | Descripción de una línea que se muestra al agente y en el resultado del descubrimiento |

### Claves opcionales del frontmatter

| Campo                      | Valor predeterminado | Descripción                                                                         |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `user-invocable`           | `true`               | Expone la habilidad como comando con barra para el usuario                          |
| `disable-model-invocation` | `false`              | Excluye la habilidad del prompt del sistema del agente (aún se ejecuta mediante `/skill`) |
| `command-dispatch`         | —                    | Establécelo en `tool` para dirigir el comando con barra directamente a una herramienta, omitiendo el modelo |
| `command-tool`             | —                    | Nombre de la herramienta que se invocará cuando se establezca `command-dispatch: tool` |
| `command-arg-mode`         | `raw`                | Para el envío a herramientas, reenvía a la herramienta la cadena de argumentos sin procesar |
| `homepage`                 | —                    | URL que se muestra como "Website" en la interfaz de Skills para macOS               |

Para obtener información sobre los campos de activación (`requires.bins`, `requires.env`, etc.), consulta
[Skills — Activación](/es/tools/skills#gating).

### Uso de `{baseDir}`

Haz referencia a archivos dentro del directorio de la habilidad sin codificar rutas de forma fija;
el agente resuelve `{baseDir}` con respecto al directorio de la propia habilidad:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Añadir activación condicional

Configura la activación de tu habilidad para que solo se cargue cuando sus dependencias estén disponibles:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Clave | Descripción |
    | --- | --- |
    | `requires.bins` | Todos los binarios deben existir en `PATH` |
    | `requires.anyBins` | Al menos un binario debe existir en `PATH` |
    | `requires.env` | Cada variable de entorno debe existir en el proceso o la configuración |
    | `requires.config` | Cada ruta de `openclaw.json` debe tener un valor verdadero |
    | `os` | Filtro de plataforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Establécelo en `true` para omitir todas las condiciones e incluir siempre la habilidad |

    Referencia completa: [Skills — Activación](/es/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
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

    La clave se inyecta en el proceso anfitrión únicamente durante ese turno del agente.
    No llega al entorno aislado; consulta
    [variables de entorno aisladas](/es/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponer mediante Skill Workshop

Para habilidades redactadas por el agente o cuando quieras que un operador las revise antes
de ponerlas en funcionamiento, usa las propuestas de [Skill Workshop](/es/tools/skill-workshop)
en lugar de escribir `SKILL.md` directamente.

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

Usa `--proposal-dir` cuando la propuesta incluya archivos auxiliares:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

El directorio debe contener `PROPOSAL.md` en su raíz. Los archivos auxiliares se colocan en
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`.

Después de la revisión:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/es/tools/skill-workshop) para conocer el ciclo de vida completo de las propuestas.

## Publicar en ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Asegúrate de establecer `name`, `description` y cualquier campo de activación de
    `metadata.openclaw`. Añade una URL `homepage` si tienes una página del proyecto.
  </Step>
  <Step title="Install the standalone ClawHub CLI and log in">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publish">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Añade `--version <version>` o `--owner <owner>` para reemplazar la versión inferida
    o publicar con un propietario específico. Consulta
    [ClawHub — Publicación](/es/clawhub/publishing) y
    [CLI de ClawHub](/es/clawhub/cli) para conocer el flujo completo, el ámbito del propietario
    y otros comandos de mantenimiento (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Prácticas recomendadas

<Tip>
  - **Sé conciso**: indica al modelo *qué* debe hacer, no cómo ser una IA.
  - **La seguridad es lo primero**: si tu habilidad usa `exec`, asegúrate de que los prompts
    no permitan la inyección arbitraria de comandos mediante entradas que no sean de confianza.
  - **Prueba localmente**: usa `openclaw agent --message "..."` antes de compartirla.
  - **Usa ClawHub**: explora las habilidades de la comunidad en [clawhub.ai](https://clawhub.ai)
    antes de crear una desde cero.
</Tip>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Skills reference" href="/es/tools/skills" icon="puzzle-piece">
    Orden de carga, activación, listas de permitidos y formato de SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para habilidades redactadas por agentes.
  </Card>
  <Card title="Skills config" href="/es/tools/skills-config" icon="gear">
    Esquema de configuración completo de `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explora y publica habilidades en el registro público.
  </Card>
  <Card title="Building plugins" href="/es/plugins/building-plugins" icon="plug">
    Los plugins pueden distribuir habilidades junto con las herramientas que documentan.
  </Card>
</CardGroup>
