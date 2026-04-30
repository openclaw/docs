---
read_when:
    - Estás creando una nueva habilidad personalizada en tu espacio de trabajo
    - Necesita un flujo de trabajo inicial rápido para Skills basadas en SKILL.md
summary: Crea y prueba Skills de espacio de trabajo personalizadas con SKILL.md
title: Crear Skills
x-i18n:
    generated_at: "2026-04-30T06:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills enseñan al agente cómo y cuándo usar herramientas. Cada skill es un directorio
que contiene un archivo `SKILL.md` con frontmatter YAML e instrucciones en markdown.

Para saber cómo se cargan y priorizan las Skills, consulta [Skills](/es/tools/skills).

## Crea tu primera skill

<Steps>
  <Step title="Crea el directorio de la skill">
    Las Skills viven en tu workspace. Crea una carpeta nueva:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Escribe SKILL.md">
    Crea `SKILL.md` dentro de ese directorio. El frontmatter define los metadatos,
    y el cuerpo en markdown contiene instrucciones para el agente.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Usa estilo con guiones y letras minúsculas, dígitos y guiones para el
    `name` de la skill. Mantén alineados el nombre de la carpeta y el `name` del frontmatter.

  </Step>

  <Step title="Añade herramientas (opcional)">
    Puedes definir esquemas de herramientas personalizados en el frontmatter o indicar al agente
    que use herramientas del sistema existentes (como `exec` o `browser`). Las Skills también pueden
    distribuirse dentro de plugins junto con las herramientas que documentan.

  </Step>

  <Step title="Carga la skill">
    Inicia una sesión nueva para que OpenClaw detecte la skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Verifica que la skill se haya cargado:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Pruébala">
    Envía un mensaje que debería activar la skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    O simplemente chatea con el agente y pídele un saludo.

  </Step>
</Steps>

## Referencia de metadatos de skill

El frontmatter YAML admite estos campos:

| Campo                               | Requerido | Descripción                                                     |
| ----------------------------------- | --------- | --------------------------------------------------------------- |
| `name`                              | Sí        | Identificador único que usa letras minúsculas, dígitos y guiones |
| `description`                       | Sí        | Descripción de una línea que se muestra al agente               |
| `metadata.openclaw.os`              | No        | Filtro de SO (`["darwin"]`, `["linux"]`, etc.)                  |
| `metadata.openclaw.requires.bins`   | No        | Binarios requeridos en PATH                                     |
| `metadata.openclaw.requires.config` | No        | Claves de configuración requeridas                              |

## Buenas prácticas

- **Sé conciso** — indica al modelo _qué_ hacer, no cómo ser una IA
- **La seguridad primero** — si tu skill usa `exec`, asegúrate de que los prompts no permitan inyección arbitraria de comandos desde entradas no confiables
- **Prueba localmente** — usa `openclaw agent --message "..."` para probar antes de compartir
- **Usa ClawHub** — explora y contribuye Skills en [ClawHub](https://clawhub.ai)

## Dónde viven las Skills

| Ubicación                       | Prioridad  | Alcance                    |
| ------------------------------- | ---------- | -------------------------- |
| `\<workspace\>/skills/`         | Máxima     | Por agente                 |
| `\<workspace\>/.agents/skills/` | Alta       | Agente por workspace       |
| `~/.agents/skills/`             | Media      | Perfil de agente compartido |
| `~/.openclaw/skills/`           | Media      | Compartido (todos los agentes) |
| Incluidas (distribuidas con OpenClaw) | Baja       | Global                     |
| `skills.load.extraDirs`         | Mínima     | Carpetas compartidas personalizadas |

## Relacionado

- [Referencia de Skills](/es/tools/skills) — reglas de carga, prioridad y gating
- [Configuración de Skills](/es/tools/skills-config) — esquema de configuración `skills.*`
- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Construir Plugins](/es/plugins/building-plugins) — los plugins pueden distribuir Skills
