---
read_when:
    - Buscar, instalar o actualizar Skills o plugins
    - Publicar Skills o plugins en el registro
    - Configurar la CLI de clawhub o sus sobrescrituras de entorno
sidebarTitle: ClawHub
summary: 'ClawHub: registro público de Skills y plugins de OpenClaw, flujos de instalación nativos y la CLI de clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub es el registro público de **Skills y plugins de OpenClaw**.

- Usa los comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI independiente `clawhub` para la autenticación del registro, publicar, eliminar/restaurar y flujos de trabajo de sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

<Steps>
  <Step title="Buscar">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalar">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Usar">
    Inicia una nueva sesión de OpenClaw: detectará la nueva Skill.
  </Step>
  <Step title="Publicar (opcional)">
    Para flujos de trabajo autenticados en el registro (publicar, sincronizar, administrar), instala
    la CLI independiente `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flujos nativos de OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Los comandos nativos de `openclaw` instalan en tu espacio de trabajo activo y
    conservan metadatos de origen para que llamadas posteriores a `update` puedan seguir usando ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Las especificaciones de plugin simples compatibles con npm también se prueban contra ClawHub antes que npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y
    `minGatewayVersion` antes de ejecutar la instalación del archivo, de modo que
    los hosts incompatibles fallen de forma segura desde el principio en lugar de instalar parcialmente
    el paquete.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` solo acepta familias de plugins instalables. Si un paquete de ClawHub es en realidad una Skill, OpenClaw se detiene y
te redirige a `openclaw skills install <slug>`.

Las instalaciones anónimas de plugins de ClawHub también fallan de forma segura para paquetes privados.
Los canales de la comunidad u otros canales no oficiales aún pueden instalarse, pero OpenClaw
muestra una advertencia para que los operadores puedan revisar la fuente y la verificación antes de habilitarlos.
</Note>

## Qué es ClawHub

- Un registro público para Skills y plugins de OpenClaw.
- Un almacén versionado de paquetes de Skills y metadatos.
- Una superficie de descubrimiento para búsqueda, etiquetas y señales de uso.

Una Skill típica es un paquete versionado de archivos que incluye:

- Un archivo `SKILL.md` con la descripción y el uso principales.
- Configuraciones, scripts o archivos de soporte opcionales usados por la Skill.
- Metadatos como etiquetas, resumen y requisitos de instalación.

ClawHub usa metadatos para impulsar el descubrimiento y exponer de forma segura las
capacidades de las Skills. El registro rastrea señales de uso (estrellas, descargas) para
mejorar la clasificación y la visibilidad. Cada publicación crea una nueva
versión semver, y el registro conserva el historial de versiones para que los usuarios puedan auditar
los cambios.

## Espacio de trabajo y carga de Skills

La CLI independiente `clawhub` también instala Skills en `./skills` dentro
de tu directorio de trabajo actual. Si hay un espacio de trabajo de OpenClaw configurado,
`clawhub` recurre a ese espacio de trabajo a menos que sobrescribas `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carga las Skills del espacio de trabajo desde
`<workspace>/skills` y las detecta en la **siguiente** sesión.

Si ya usas `~/.openclaw/skills` o Skills incluidas, las Skills del espacio de trabajo
tienen prioridad. Para más detalles sobre cómo se cargan, comparten y restringen las Skills,
consulta [Skills](/es/tools/skills).

## Funciones del servicio

| Función            | Notas                                                      |
| ------------------ | ---------------------------------------------------------- |
| Navegación pública | Las Skills y su contenido `SKILL.md` son visibles públicamente. |
| Búsqueda           | Impulsada por embeddings (búsqueda vectorial), no solo por palabras clave. |
| Versionado         | Semver, changelogs y etiquetas (incluida `latest`).         |
| Descargas          | Zip por versión.                                           |
| Estrellas y comentarios | Retroalimentación de la comunidad.                    |
| Moderación         | Aprobaciones y auditorías.                                 |
| API compatible con CLI | Adecuada para automatización y scripting.               |

## Seguridad y moderación

ClawHub es abierto por defecto: cualquiera puede subir Skills, pero una cuenta de GitHub
debe tener **al menos una semana de antigüedad** para publicar. Esto ralentiza
el abuso sin bloquear a colaboradores legítimos.

<AccordionGroup>
  <Accordion title="Reportes">
    - Cualquier usuario que haya iniciado sesión puede reportar una Skill.
    - Los motivos del reporte son obligatorios y se registran.
    - Cada usuario puede tener hasta 20 reportes activos al mismo tiempo.
    - Las Skills con más de 3 reportes únicos se ocultan automáticamente por defecto.
  </Accordion>
  <Accordion title="Moderación">
    - Los moderadores pueden ver Skills ocultas, volver a mostrarlas, eliminarlas o prohibir usuarios.
    - Abusar de la función de reporte puede resultar en bloqueos de cuenta.
    - ¿Te interesa convertirte en moderador? Pregunta en el Discord de OpenClaw y contacta con un moderador o maintainer.
  </Accordion>
</AccordionGroup>

## CLI de ClawHub

Solo la necesitas para flujos de trabajo autenticados en el registro, como
publicar/sincronizar.

### Opciones globales

<ParamField path="--workdir <dir>" type="string">
  Directorio de trabajo. Predeterminado: directorio actual; recurre al espacio de trabajo de OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directorio de Skills, relativo al directorio de trabajo.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sitio (inicio de sesión en el navegador).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base de la API del registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Desactiva los prompts (no interactivo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Imprime la versión de la CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Autenticación (login / logout / whoami)">
    ```bash
    clawhub login              # flujo en el navegador
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opciones de inicio de sesión:

    - `--token <token>` — pega un token de API.
    - `--label <label>` — etiqueta almacenada para tokens de inicio de sesión en el navegador (predeterminado: `CLI token`).
    - `--no-browser` — no abre un navegador (requiere `--token`).

  </Accordion>
  <Accordion title="Buscar">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — número máximo de resultados.

  </Accordion>
  <Accordion title="Instalar / actualizar / listar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opciones:

    - `--version <version>` — instala o actualiza a una versión específica (solo un slug en `update`).
    - `--force` — sobrescribe si la carpeta ya existe, o cuando los archivos locales no coinciden con ninguna versión publicada.
    - `clawhub list` lee `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publicar Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opciones:

    - `--slug <slug>` — slug de la Skill.
    - `--name <name>` — nombre para mostrar.
    - `--version <version>` — versión semver.
    - `--changelog <text>` — texto del changelog (puede estar vacío).
    - `--tags <tags>` — etiquetas separadas por comas (predeterminado: `latest`).

  </Accordion>
  <Accordion title="Publicar plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` puede ser una carpeta local, `owner/repo`, `owner/repo@ref` o una
    URL de GitHub.

    Opciones:

    - `--dry-run` — crea el plan exacto de publicación sin subir nada.
    - `--json` — emite una salida legible por máquina para CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — sobrescrituras opcionales cuando la autodetección no es suficiente.

  </Accordion>
  <Accordion title="Eliminar / restaurar (owner o administrador)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizar (escanear local + publicar nuevos o actualizados)">
    ```bash
    clawhub sync
    ```

    Opciones:

    - `--root <dir...>` — raíces de escaneo adicionales.
    - `--all` — sube todo sin prompts.
    - `--dry-run` — muestra qué se subiría.
    - `--bump <type>` — `patch|minor|major` para actualizaciones (predeterminado: `patch`).
    - `--changelog <text>` — changelog para actualizaciones no interactivas.
    - `--tags <tags>` — etiquetas separadas por comas (predeterminado: `latest`).
    - `--concurrency <n>` — comprobaciones del registro (predeterminado: `4`).

  </Accordion>
</AccordionGroup>

## Flujos de trabajo comunes

<Tabs>
  <Tab title="Buscar">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Instalar">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Actualizar todo">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publicar una sola Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar muchas Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar un plugin desde GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadatos del paquete del plugin

Los plugins de código deben incluir los metadatos requeridos de OpenClaw en
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Los paquetes publicados deben incluir **JavaScript compilado** y apuntar
`runtimeExtensions` a esa salida. Las instalaciones desde checkout de Git aún pueden recurrir
al código fuente TypeScript cuando no existen archivos compilados, pero las entradas
de runtime compiladas evitan la compilación en tiempo de ejecución de TypeScript durante el arranque, doctor y
las rutas de carga de plugins.

## Versionado, lockfile y telemetría

<AccordionGroup>
  <Accordion title="Versionado y etiquetas">
    - Cada publicación crea una nueva `SkillVersion` **semver**.
    - Las etiquetas (como `latest`) apuntan a una versión; mover etiquetas te permite revertir.
    - Los changelogs se adjuntan por versión y pueden estar vacíos al sincronizar o publicar actualizaciones.
  </Accordion>
  <Accordion title="Cambios locales frente a versiones del registro">
    Las actualizaciones comparan el contenido local de la Skill con las versiones del registro mediante un
    hash de contenido. Si los archivos locales no coinciden con ninguna versión publicada, la
    CLI pregunta antes de sobrescribir (o requiere `--force` en
    ejecuciones no interactivas).
  </Accordion>
  <Accordion title="Escaneo de sincronización y raíces de respaldo">
    `clawhub sync` primero escanea tu directorio de trabajo actual. Si no se
    encuentran Skills, recurre a ubicaciones heredadas conocidas (por ejemplo
    `~/openclaw/skills` y `~/.openclaw/skills`). Esto está diseñado para
    encontrar instalaciones antiguas de Skills sin banderas adicionales.
  </Accordion>
  <Accordion title="Almacenamiento y lockfile">
    - Las Skills instaladas se registran en `.clawhub/lock.json` dentro de tu directorio de trabajo.
    - Los tokens de autenticación se almacenan en el archivo de configuración de la CLI de ClawHub (sobrescríbelo mediante `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="Telemetría (recuentos de instalación)">
    Cuando ejecutas `clawhub sync` mientras has iniciado sesión, la CLI envía una instantánea mínima
    para calcular recuentos de instalación. Puedes desactivar esto por completo:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables de entorno

| Variable                      | Efecto                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Sobrescribe la URL del sitio.                   |
| `CLAWHUB_REGISTRY`            | Sobrescribe la URL de la API del registro.      |
| `CLAWHUB_CONFIG_PATH`         | Sobrescribe dónde la CLI almacena el token/la configuración. |
| `CLAWHUB_WORKDIR`             | Sobrescribe el directorio de trabajo predeterminado. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría en `sync`.              |

## Relacionado

- [Plugins de la comunidad](/es/plugins/community)
- [Plugins](/es/tools/plugin)
- [Skills](/es/tools/skills)
