---
read_when:
    - Estás creando una nueva skill personalizada
    - Necesitas un flujo de trabajo inicial rápido para skills basadas en SKILL.md
    - Quieres usar Skill Workshop para proponer una skill para revisión del agente
sidebarTitle: Creating skills
summary: Crea, prueba y publica skills de espacio de trabajo SKILL.md personalizados para tus agentes de OpenClaw.
title: Creación de Skills
x-i18n:
    generated_at: "2026-07-05T11:48:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills enseñan al agente cómo y cuándo usar herramientas. Cada skill es un directorio
que contiene un archivo `SKILL.md` con frontmatter YAML e instrucciones en Markdown.
OpenClaw carga Skills desde varias raíces en un [orden de precedencia](/es/tools/skills#loading-order) definido.

## Crea tu primera skill

<Steps>
  <Step title="Crea el directorio de la skill">
    Skills viven en la carpeta `skills/` de tu espacio de trabajo:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Puedes agrupar skills en subcarpetas para organizarlas; la skill sigue
    recibiendo su nombre del frontmatter de `SKILL.md`, no de la ruta de la carpeta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Escribe SKILL.md">
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
    - Mantén alineados el nombre del directorio y el `name` del frontmatter.
    - `description` se muestra al agente y en el descubrimiento de comandos de barra;
      mantenla en una línea y por debajo de 160 caracteres.

  </Step>

  <Step title="Verifica que la skill se cargó">
    ```bash
    openclaw skills list
    ```

    OpenClaw observa de forma predeterminada los archivos `SKILL.md` bajo las raíces de skills. Si el
    observador está deshabilitado o continúas una sesión existente, inicia una nueva
    para que el agente reciba la lista actualizada:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Pruébala">
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
| `description` | Descripción de una línea mostrada al agente y en la salida de descubrimiento |

### Claves opcionales del frontmatter

| Campo                      | Predeterminado | Descripción                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Expone la skill como comando de barra de usuario                                         |
| `disable-model-invocation` | `false` | Mantiene la skill fuera del prompt del sistema del agente (aún se ejecuta mediante `/skill`)        |
| `command-dispatch`         | —       | Establece `tool` para enrutar el comando de barra directamente a una herramienta, omitiendo el modelo |
| `command-tool`             | —       | Nombre de la herramienta que se invoca cuando `command-dispatch: tool` está establecido                         |
| `command-arg-mode`         | `raw`   | Para el despacho a herramientas, reenvía la cadena de argumentos sin procesar a la herramienta                      |
| `homepage`                 | —       | URL mostrada como "Sitio web" en la interfaz de Skills de macOS                                    |

Para los campos de control de activación (`requires.bins`, `requires.env`, etc.), consulta
[Skills — Control de activación](/es/tools/skills#gating).

### Uso de `{baseDir}`

Referencia archivos dentro del directorio de la skill sin codificar rutas de forma fija; el
agente resuelve `{baseDir}` contra el propio directorio de la skill:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Agregar activación condicional

Controla la activación de tu skill para que solo se cargue cuando sus dependencias estén disponibles:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opciones de control de activación">
    | Clave | Descripción |
    | --- | --- |
    | `requires.bins` | Todos los binarios deben existir en `PATH` |
    | `requires.anyBins` | Al menos un binario debe existir en `PATH` |
    | `requires.env` | Cada variable de entorno debe existir en el proceso o en la configuración |
    | `requires.config` | Cada ruta de `openclaw.json` debe evaluarse como verdadera |
    | `os` | Filtro de plataforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Establécelo en `true` para omitir todos los controles e incluir siempre la skill |

    Referencia completa: [Skills — Control de activación](/es/tools/skills#gating).

  </Accordion>
  <Accordion title="Entorno y claves de API">
    Conecta una clave de API a una entrada de skill en `openclaw.json`:

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

Para skills redactadas por el agente o cuando quieres una revisión del operador antes de que una skill entre
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

Usa `--proposal-dir` cuando la propuesta incluya archivos de soporte:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

El directorio debe contener `PROPOSAL.md` en su raíz. Los archivos de soporte van bajo
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`.

Después de la revisión:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/es/tools/skill-workshop) para ver el ciclo de vida completo de las propuestas.

## Publicar en ClawHub

<Steps>
  <Step title="Asegúrate de que tu SKILL.md esté completo">
    Asegúrate de que `name`, `description` y cualquier campo de control de activación de `metadata.openclaw`
    estén configurados. Agrega una URL de `homepage` si tienes una página de proyecto.
  </Step>
  <Step title="Instala la CLI independiente de ClawHub e inicia sesión">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publica">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Agrega `--version <version>` o `--owner <owner>` para anular la versión
    inferida o publicar bajo un propietario específico. Consulta
    [ClawHub — Publicación](/es/clawhub/publishing) y
    [CLI de ClawHub](/es/clawhub/cli) para ver el flujo completo, el alcance por propietario y otros
    comandos de mantenimiento (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Prácticas recomendadas

<Tip>
  - **Sé conciso**: instruye al modelo sobre *qué* hacer, no sobre cómo ser una IA.
  - **La seguridad primero**: si tu skill usa `exec`, asegúrate de que los prompts no permitan
    inyección arbitraria de comandos desde entradas no confiables.
  - **Prueba localmente**: usa `openclaw agent --message "..."` antes de compartir.
  - **Usa ClawHub**: explora skills de la comunidad en [clawhub.ai](https://clawhub.ai)
    antes de crear desde cero.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Orden de carga, control de activación, listas de permitidos y formato de SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para skills redactadas por el agente.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración de `skills.*`.
  </Card>
  <Card title="ClawHub" href="/es/clawhub" icon="cloud">
    Explora y publica skills en el registro público.
  </Card>
  <Card title="Crear plugins" href="/es/plugins/building-plugins" icon="plug">
    Los plugins pueden enviar skills junto con las herramientas que documentan.
  </Card>
</CardGroup>
