---
read_when:
    - Estás creando una nueva Skill personalizada en tu espacio de trabajo
    - Necesitas un flujo de inicio rápido para Skills basadas en `SKILL.md`
summary: Crear y probar Skills personalizadas del espacio de trabajo con `SKILL.md`
title: Crear Skills
x-i18n:
    generated_at: "2026-04-24T05:52:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Las Skills enseñan al agente cómo y cuándo usar herramientas. Cada Skill es un directorio
que contiene un archivo `SKILL.md` con frontmatter YAML e instrucciones en markdown.

Para ver cómo se cargan y priorizan las Skills, consulta [Skills](/es/tools/skills).

## Crea tu primera Skill

<Steps>
  <Step title="Crear el directorio de la Skill">
    Las Skills viven en tu espacio de trabajo. Crea una nueva carpeta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Escribir SKILL.md">
    Crea `SKILL.md` dentro de ese directorio. El frontmatter define los metadatos,
    y el cuerpo markdown contiene instrucciones para el agente.

    ```markdown
    ---
    name: hello_world
    description: Una Skill simple que saluda.
    ---

    # Skill Hello World

    Cuando el usuario pida un saludo, usa la herramienta `echo` para decir
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Agregar herramientas (opcional)">
    Puedes definir esquemas de herramientas personalizados en el frontmatter o indicar al agente
    que use herramientas del sistema existentes (como `exec` o `browser`). Las Skills también pueden
    incluirse dentro de plugins junto con las herramientas que documentan.

  </Step>

  <Step title="Cargar la Skill">
    Inicia una sesión nueva para que OpenClaw recoja la Skill:

    ```bash
    # Desde el chat
    /new

    # O reinicia el gateway
    openclaw gateway restart
    ```

    Verifica que la Skill se cargó:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Probarla">
    Envía un mensaje que debería activar la Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    O simplemente chatea con el agente y pídele un saludo.

  </Step>
</Steps>

## Referencia de metadatos de Skill

El frontmatter YAML admite estos campos:

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Yes      | Unique identifier (snake_case)              |
| `description`                       | Yes      | One-line description shown to the agent     |
| `metadata.openclaw.os`              | No       | OS filter (`["darwin"]`, `["linux"]`, etc.) |
| `metadata.openclaw.requires.bins`   | No       | Required binaries on PATH                   |
| `metadata.openclaw.requires.config` | No       | Required config keys                        |

## Buenas prácticas

- **Sé conciso** — indica al modelo _qué_ hacer, no cómo ser una IA
- **La seguridad primero** — si tu Skill usa `exec`, asegúrate de que los prompts no permitan inyección arbitraria de comandos desde entradas no confiables
- **Prueba localmente** — usa `openclaw agent --message "..."` para probar antes de compartir
- **Usa ClawHub** — explora y contribuye Skills en [ClawHub](https://clawhub.ai)

## Dónde viven las Skills

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | Highest    | Per-agent             |
| `\<workspace\>/.agents/skills/` | High       | Per-workspace agent   |
| `~/.agents/skills/`             | Medium     | Shared agent profile  |
| `~/.openclaw/skills/`           | Medium     | Shared (all agents)   |
| Bundled (shipped with OpenClaw) | Low        | Global                |
| `skills.load.extraDirs`         | Lowest     | Custom shared folders |

## Relacionado

- [Referencia de Skills](/es/tools/skills) — reglas de carga, precedencia y restricción
- [Configuración de Skills](/es/tools/skills-config) — esquema de configuración `skills.*`
- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Building Plugins](/es/plugins/building-plugins) — los plugins pueden incluir Skills
